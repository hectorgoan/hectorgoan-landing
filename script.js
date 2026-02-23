document.addEventListener('DOMContentLoaded', () => {
    const themeButtons = document.querySelectorAll('.switch-btn');
    const switchBg = document.querySelector('.switch-bg');

    // Check for saved user preference
    const savedTheme = localStorage.getItem('theme') || 'auto';

    // Check system preference
    const systemDark = window.matchMedia('(prefers-color-scheme: dark)');

    function applyTheme(theme) {
        // Remove existing classes
        document.body.classList.remove('light-mode', 'dark-mode');

        if (theme === 'auto') {
            // Remove manual override to let system preference take over
            localStorage.removeItem('theme');
        } else {
            document.body.classList.add(theme + '-mode');
            localStorage.setItem('theme', theme);
        }

        updateSelector(theme);
        updateHdrState();
    }

    function updateHdrState() {
        const hdrToggle = document.getElementById('hdr-toggle');
        if (!hdrToggle) return;

        const isDark = document.body.classList.contains('dark-mode') ||
            (document.body.classList.length === 0 && window.matchMedia('(prefers-color-scheme: dark)').matches);

        if (isDark) {
            hdrToggle.classList.remove('active');

            const profilePic = document.getElementById('profilePic');
            if (profilePic) {
                profilePic.classList.remove('hdr-active');
            }

            const cards = document.querySelectorAll('.card');
            cards.forEach(card => card.classList.remove('hdr-active'));
        }
    }

    function updateSelector(theme) {
        // Find the active button
        const activeButton = document.getElementById(`theme-${theme}`);
        if (!activeButton) return;

        // Update active class
        themeButtons.forEach(btn => btn.classList.remove('active'));
        activeButton.classList.add('active');

        // Move the background pill
        // We need to calculate position relative to the container
        const containerRect = document.querySelector('.theme-switch').getBoundingClientRect();
        const buttonRect = activeButton.getBoundingClientRect();

        const offsetLeft = buttonRect.left - containerRect.left;
        const width = buttonRect.width;

        switchBg.style.width = `${width}px`;
        switchBg.style.transform = `translateX(${offsetLeft - 4}px)`;
    }

    // Initialize
    applyTheme(savedTheme);

    // Event Listeners
    themeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const theme = btn.id.replace('theme-', '');
            applyTheme(theme);
        });
    });

    const hdrToggle = document.getElementById('hdr-toggle');
    if (hdrToggle) {
        hdrToggle.addEventListener('click', () => {
            const isDark = document.body.classList.contains('dark-mode') ||
                (document.body.classList.length === 0 && window.matchMedia('(prefers-color-scheme: dark)').matches);

            if (isDark) return; // Do nothing if in dark mode

            hdrToggle.classList.toggle('active');

            const profilePic = document.getElementById('profilePic');
            if (profilePic) {
                profilePic.classList.toggle('hdr-active', hdrToggle.classList.contains('active'));
            }

            const cards = document.querySelectorAll('.card');
            cards.forEach(card => {
                card.classList.toggle('hdr-active', hdrToggle.classList.contains('active'));
            });
        });
    }

    // Add animate-in class to cards for initial load animation
    const cards = document.querySelectorAll('.card');
    cards.forEach((card, index) => {
        card.classList.add('animate-in');

        // Remove the animate-in class after the animation finishes
        // Animation is 0.6s max plus up to 1.0s delay = 1600ms
        setTimeout(() => {
            card.classList.remove('animate-in');
        }, 1600);
    });

});
