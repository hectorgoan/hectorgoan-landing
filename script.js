const { createApp, ref, onMounted, onUnmounted, watch, computed, nextTick } = Vue;

const GITHUB_USER = 'hectorgoan';
const CONTRIBUTION_WEEKS = 26;
const CONTRIBUTIONS_TIMEOUT_MS = 8000;

const MAP_CENTER = [14.5566, -90.7337]; // Antigua Guatemala
const MAP_ZOOM = 15;
// Both sources are keyless. Dark mode tints the street tiles with a CSS filter.
const MAP_LAYERS = {
    street: {
        // Humanitarian (HOT) style, hosted by OpenStreetMap France
        url: 'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
        attribution: '&copy; OpenStreetMap contributors, tiles by HOT hosted by OSM France',
        options: { maxZoom: 19, subdomains: 'abc' }
    },
    satellite: {
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        attribution: 'Imagery &copy; Esri',
        options: { maxZoom: 19, detectRetina: true }
    }
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

        const contributions = ref([]);
        const contributionsFailed = ref(false);
        const chartImageFailed = ref(false);
        const mapType = ref(localStorage.getItem('mapType') === 'satellite' ? 'satellite' : 'street');
        const mapReady = ref(false);
        const mapEl = ref(null);
        let map = null;
        let mapLayer = null;

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

        const loadContributions = async () => {
            try {
                const controller = new AbortController();
                const timeout = setTimeout(() => controller.abort(), CONTRIBUTIONS_TIMEOUT_MS);
                const res = await fetch(`https://github-contributions-api.jogruber.de/v4/${GITHUB_USER}?y=last`, { signal: controller.signal });
                clearTimeout(timeout);
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

        const applyMapLayer = () => {
            if (!map) return;
            const { url, attribution, options } = MAP_LAYERS[mapType.value === 'satellite' ? 'satellite' : 'street'];
            if (mapLayer) map.removeLayer(mapLayer);
            mapLayer = window.L.tileLayer(url, { attribution, ...options }).addTo(map);
        };

        const initMap = () => {
            // Leaflet comes from a CDN; without it the drawn fallback map stays visible
            if (!window.L || !mapEl.value) return;
            map = window.L.map(mapEl.value, {
                center: MAP_CENTER,
                zoom: MAP_ZOOM,
                zoomControl: false,
                dragging: false,
                scrollWheelZoom: false,
                doubleClickZoom: false,
                touchZoom: false,
                boxZoom: false,
                keyboard: false
            });
            map.attributionControl.setPrefix(false);
            applyMapLayer();
            mapReady.value = true;
            window.addEventListener('resize', () => map.invalidateSize());
        };

        const setMapType = (type) => {
            mapType.value = type;
            localStorage.setItem('mapType', type);
            applyMapLayer();
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
            loadContributions();
            nextTick(initMap);
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
            contributions,
            contributionsFailed,
            chartImageFailed,
            contributionsLabel,
            mapType,
            mapReady,
            mapEl,
            setMapType
        };
    }
};

createApp(App).mount('#app');
