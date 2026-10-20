const { createApp, ref, onMounted, onUnmounted, watch, computed, nextTick } = Vue;

const GITHUB_USER = 'hectorgoan';
const LOCAL_TZ = 'America/Guatemala';
const HOME_TZ = 'Europe/Madrid';
const CONTRIBUTION_WEEKS = 26;

// Hours-since-epoch-ish value of the wall clock in a time zone, used to diff two zones
const wallClockHours = (date, timeZone) => {
    const parts = new Intl.DateTimeFormat('en-GB', {
        timeZone, year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', hourCycle: 'h23'
    }).formatToParts(date);
    const get = (type) => Number(parts.find((p) => p.type === type).value);
    return Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute')) / 3600000;
};

const App = {
    setup() {
        // --- State ---
        const theme = ref(localStorage.getItem('theme') || 'auto');
        const isHdrActive = ref(false);
        const isAnimating = ref(false);
        const systemDark = ref(window.matchMedia('(prefers-color-scheme: dark)').matches);

        // Refs for DOM elements to calculate switch background position
        const btnAuto = ref(null);
        const btnLight = ref(null);
        const btnDark = ref(null);

        const localTime = ref('');
        const timeDifference = ref('');
        const contributions = ref([]);
        const contributionsFailed = ref(false);
        let clockTimer = null;

        const switchBgStyle = ref({
            width: '0px',
            transform: 'translateX(0px)'
        });

        // --- Computed ---
        const isDarkMode = computed(() => {
            return theme.value === 'dark' || (theme.value === 'auto' && systemDark.value);
        });

        const contributionsLabel = computed(() => {
            const total = contributions.value.reduce((sum, day) => sum + day.count, 0);
            return `${total} GitHub contributions in the last ${CONTRIBUTION_WEEKS} weeks`;
        });

        // --- Methods ---
        const applyThemeToBody = () => {
            document.documentElement.classList.remove('light-mode', 'dark-mode');
            document.documentElement.classList.add(isDarkMode.value ? 'dark-mode' : 'light-mode');
        };

        const updateSelectorPosition = () => {
            nextTick(() => {
                let activeButton = null;
                if (theme.value === 'auto') activeButton = btnAuto.value;
                if (theme.value === 'light') activeButton = btnLight.value;
                if (theme.value === 'dark') activeButton = btnDark.value;

                if (!activeButton) return;

                // We need to calculate position relative to the container
                // btnAuto.value is relatively close to the container
                const containerRect = btnAuto.value.parentElement.getBoundingClientRect();
                const buttonRect = activeButton.getBoundingClientRect();

                const offsetLeft = buttonRect.left - containerRect.left;
                const width = buttonRect.width;

                switchBgStyle.value = {
                    width: `${width}px`,
                    transform: `translateX(${offsetLeft - 4}px)` // -4px accounts for padding in theme-switch
                };
            });
        };

        const updateClock = () => {
            const now = new Date();
            localTime.value = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: LOCAL_TZ });
            const diff = Math.round(wallClockHours(now, HOME_TZ) - wallClockHours(now, LOCAL_TZ));
            timeDifference.value = diff === 0 ? 'Same time as Spain' : `${Math.abs(diff)} hours ${diff > 0 ? 'behind' : 'ahead of'} Spain`;
        };

        const loadContributions = async () => {
            try {
                const res = await fetch(`https://github-contributions-api.jogruber.de/v4/${GITHUB_USER}?y=last`);
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const { contributions: days } = await res.json();
                if (!Array.isArray(days) || !days.length) throw new Error('No data');

                // Show whole weeks (Sunday first, like GitHub), ending with today
                const lastDay = new Date(`${days[days.length - 1].date}T00:00:00Z`).getUTCDay();
                const count = (CONTRIBUTION_WEEKS - 1) * 7 + lastDay + 1;
                contributions.value = days.slice(-count);
            } catch (e) {
                contributionsFailed.value = true;
            }
        };

        const setTheme = (newTheme) => {
            theme.value = newTheme;

            if (newTheme === 'auto') {
                localStorage.removeItem('theme');
            } else {
                localStorage.setItem('theme', newTheme);
            }
        };

        const toggleHdr = () => {
            if (isDarkMode.value) return; // Do nothing if in dark mode
            isHdrActive.value = !isHdrActive.value;
        };

        const checkHdrStateWhenThemeChanges = () => {
            if (isDarkMode.value) {
                isHdrActive.value = false;
            }
        };

        // --- Watchers ---
        watch(theme, () => {
            applyThemeToBody();
            updateSelectorPosition();
            checkHdrStateWhenThemeChanges();
        });

        watch(systemDark, () => {
            if (theme.value === 'auto') {
                checkHdrStateWhenThemeChanges();
            }
        });

        // --- Lifecycle ---
        onMounted(() => {
            // Listen to system theme changes
            window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
                systemDark.value = e.matches;
            });

            // Initial setup
            updateClock();
            clockTimer = setInterval(updateClock, 30000);
            loadContributions();
            window.addEventListener('resize', updateSelectorPosition);
            applyThemeToBody();
            updateSelectorPosition();
            checkHdrStateWhenThemeChanges();

            // Initial load animation
            isAnimating.value = true;
            setTimeout(() => {
                isAnimating.value = false;
            }, 1600); // Animation is 0.7s plus up to 0.55s delay
        });

        onUnmounted(() => {
            clearInterval(clockTimer);
            window.removeEventListener('resize', updateSelectorPosition);
        });

        return {
            theme,
            isHdrActive,
            isAnimating,
            switchBgStyle,
            btnAuto,
            btnLight,
            btnDark,
            setTheme,
            toggleHdr,
            localTime,
            timeDifference,
            contributions,
            contributionsFailed,
            contributionsLabel
        };
    }
};

createApp(App).mount('#app');
