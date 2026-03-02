const { createApp, ref, onMounted, watch, computed, nextTick } = Vue;

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

        const switchBgStyle = ref({
            width: '0px',
            transform: 'translateX(0px)'
        });

        // --- Computed ---
        const isDarkMode = computed(() => {
            return theme.value === 'dark' || (theme.value === 'auto' && systemDark.value);
        });

        const cardClasses = computed(() => {
            return {
                'hdr-active': isHdrActive.value,
                'animate-in': isAnimating.value
            };
        });

        // --- Methods ---
        const applyThemeToBody = () => {
            document.body.classList.remove('light-mode', 'dark-mode');

            if (theme.value !== 'auto') {
                document.body.classList.add(theme.value + '-mode');
            }
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
            applyThemeToBody();
            updateSelectorPosition();
            checkHdrStateWhenThemeChanges();

            // Initial load animation
            isAnimating.value = true;
            setTimeout(() => {
                isAnimating.value = false;
            }, 1600); // Animation is 0.6s max plus up to 1.0s delay = 1600ms
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
            cardClasses
        };
    }
};

createApp(App).mount('#app');
