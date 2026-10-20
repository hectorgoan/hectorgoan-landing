// Follow the system theme while the homepage choice is "auto"
const media = window.matchMedia('(prefers-color-scheme: dark)');
media.addEventListener('change', (e) => {
    if ((localStorage.getItem('theme') || 'auto') !== 'auto') return;
    document.documentElement.classList.toggle('dark-mode', e.matches);
    document.documentElement.classList.toggle('light-mode', !e.matches);
});

// Highlights carousel: arrows page through the cards and dim at either end
const track = document.querySelector('.lp-track');
const arrows = document.querySelectorAll('.lp-arrow');

const updateArrows = () => {
    const max = track.scrollWidth - track.clientWidth - 1;
    arrows.forEach((btn) => {
        btn.disabled = btn.dataset.scroll === '-1' ? track.scrollLeft <= 0 : track.scrollLeft >= max;
    });
};

arrows.forEach((btn) => {
    btn.addEventListener('click', () => {
        const card = track.querySelector('.lp-card');
        const step = card ? card.getBoundingClientRect().width + 20 : track.clientWidth;
        track.scrollBy({ left: Number(btn.dataset.scroll) * step });
    });
});

// Chips scroll the carousel to their card without moving the page
document.querySelectorAll('.lp-chip').forEach((chip) => {
    chip.addEventListener('click', (e) => {
        const card = document.getElementById(chip.getAttribute('href').slice(1));
        if (!card) return;
        e.preventDefault();
        const left = card.getBoundingClientRect().left - track.getBoundingClientRect().left + track.scrollLeft;
        track.scrollTo({ left });
    });
});

track.addEventListener('scroll', updateArrows, { passive: true });
window.addEventListener('resize', updateArrows);
updateArrows();
