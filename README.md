# Héctor Go. An. - Personal Landing Page

A minimal, highly interactive, and responsive personal landing page. This project serves as a modern digital business card, utilizing a popular Bento-box grid layout to showcase professional links, personal social media, and dynamic integrations.

## ✨ Features

- **Modern Bento Grid Architecture**: A responsive layout that elegantly organizes diverse content formats, ranging from simple links to interactive maps and dynamic charts.
- **Apple-inspired Design**: Quiet, content-first widgets set in San Francisco (Inter as a fallback), with the theme and HDR controls floating above the page on a Liquid Glass-style material.
- **Smart Theme Engine (Dark/Light/Auto)**: 
  - Supports manual Light and Dark mode toggles.
  - Features an 'Auto' mode that seamlessly syncs with the user's operating system preferences via `prefers-color-scheme`.
  - Persists user preferences using `localStorage`.
- **HDR Enhancement Mode**: An experimental visual "easter egg" that applies a striking high-dynamic-range style glow to UI elements (like the avatar and cards) when active. For optimal UX, this feature is intelligently disabled when Dark Mode is active.
- **Dynamic Integrations**:
  - **GitHub Contributions**: Live contribution history for the last 26 weeks, fetched from the public [github-contributions-api](https://github.com/grubersjoe/github-contributions-api) and drawn natively (falls back to a ghchart image if the request fails).
  - **Location Map**: A live Leaflet map of Antigua Guatemala with a Satellite/Street switch (Satellite by default) (keyless OpenStreetMap Humanitarian tiles, tinted dark in Dark Mode; Esri imagery). The choice is remembered, and an inline SVG drawing shows if Leaflet can't load.
- **Zero-Build Setup**: Built without heavy bundlers or Node.js dependencies. It uses **Vue 3** via CDN for reactive state management, allowing for immediate execution and deployment anywhere.
- **Fluid Micro-interactions**: Enter animations, hover effects, and a smooth slider for the theme switcher, all heavily optimized with modern CSS transitions.

## 🛠️ Technology Stack

- **Structure**: Semantic HTML5
- **Styling**: Vanilla CSS (CSS Variables, Flexbox, Grid, Media Queries)
- **Interactivity & State Management**: Vue 3 (Composition API via CDN)
- **Icons**: Inline SVG

## 🚀 Getting Started

Since there is no build process required, getting this project up and running is as simple as serving static files.

1. Clone this repository.
2. Open `index.html` in your favorite browser, or serve it using a local static server (e.g., Python's `http.server`, `npx serve .`, or VS Code Live Server).

## 📂 Project Structure

- `index.html`: The main entry point containing the structural layout, Vue mount point, and Bento grid.
- `styles.css`: All the visual styling, animations, theme variables, and responsive breakpoints.
- `script.js`: Vue 3 application logic handling theme switching, HDR toggling, and animations.
- `resources/`: Directory containing static media assets (e.g., avatar profile image, base SVGs).

---
*Authored with focus on performance, minimalism, and an excellent user experience.*
