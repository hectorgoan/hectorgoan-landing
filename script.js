document.addEventListener('DOMContentLoaded', () => {
    const toggleButton = document.getElementById('theme-toggle');
    const icon = toggleButton.querySelector('i');
    
    // Check for saved user preference, if any, on load of the website
    const savedTheme = localStorage.getItem('theme');
    
    // Check system preference
    const systemDark = window.matchMedia('(prefers-color-scheme: dark)');

    // Function to set the visual state of the button
    function updateIcon(isDark) {
        if (isDark) {
            icon.classList.remove('fa-moon');
            icon.classList.add('fa-sun'); // Show sun to toggle to light
        } else {
            icon.classList.remove('fa-sun');
            icon.classList.add('fa-moon'); // Show moon to toggle to dark
        }
    }

    // Apply saved theme if exists
    if (savedTheme) {
        document.body.classList.add(savedTheme + '-mode');
        updateIcon(savedTheme === 'dark');
    } else {
        // No saved preference, use system
        updateIcon(systemDark.matches);
    }

    toggleButton.addEventListener('click', () => {
        const isDarkMode = document.body.classList.contains('dark-mode');
        const isLightMode = document.body.classList.contains('light-mode');
        const systemIsDark = systemDark.matches;

        let newTheme = '';

        if (isDarkMode) {
            // currently forced dark -> switch to light
            newTheme = 'light';
        } else if (isLightMode) {
            // currently forced light -> switch to dark
            newTheme = 'dark';
        } else {
            // currently auto
            if (systemIsDark) {
                // system is dark, so we are effectively dark -> switch to light
                newTheme = 'light';
            } else {
                // system is light, so we are effectively light -> switch to dark
                newTheme = 'dark';
            }
        }

        // Remove both classes first
        document.body.classList.remove('light-mode', 'dark-mode');
        
        // Add new class
        document.body.classList.add(newTheme + '-mode');
        
        // Save preference
        localStorage.setItem('theme', newTheme);
        
        // Update icon
        updateIcon(newTheme === 'dark');
    });

    // Listen for system changes if no manual override is set
    systemDark.addEventListener('change', (e) => {
        if (!localStorage.getItem('theme')) {
            updateIcon(e.matches);
        }
    });
});
