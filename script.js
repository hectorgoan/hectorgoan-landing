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

});
