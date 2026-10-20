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
const chips = document.querySelectorAll('.lp-chip');
let pinned = null;
let scrollTimer = null;

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
        pinned = null;
        track.scrollBy({ left: Number(btn.dataset.scroll) * step });
    });
});

// The chip of the card at the carousel's left edge shows as current. A clicked chip stays
// current while its card is in view, since the last cards can't scroll to the left edge.

const isInView = (card) => {
    const t = track.getBoundingClientRect();
    const c = card.getBoundingClientRect();
    return c.left >= t.left - 1 && c.right <= t.right + 1;
};

const updateCurrentChip = () => {
    const pinnedCard = pinned && document.getElementById(pinned);
    if (pinnedCard && !isInView(pinnedCard) && !track.dataset.scrolling) pinned = null;
    const edge = track.getBoundingClientRect().left;
    let current = pinned;
    let best = Infinity;
    if (!current) track.querySelectorAll('.lp-card').forEach((card) => {
        const distance = Math.abs(card.getBoundingClientRect().left - edge);
        if (distance < best) {
            best = distance;
            current = card.id;
        }
    });
    chips.forEach((chip) => {
        chip.setAttribute('aria-current', chip.getAttribute('href') === `#${current}` ? 'true' : 'false');
    });
};

// Scroll the carousel to a card and keep its chip current
const showCard = (card) => {
    pinned = card.id;
    // Ignore the pin check until the smooth scroll lands on the card
    track.dataset.scrolling = 'true';
    clearTimeout(scrollTimer);
    scrollTimer = setTimeout(() => { delete track.dataset.scrolling; updateCurrentChip(); }, 800);
    const left = card.getBoundingClientRect().left - track.getBoundingClientRect().left + track.scrollLeft;
    track.scrollTo({ left });
};

// Chips scroll the carousel to their card without moving the page
chips.forEach((chip) => {
    chip.addEventListener('click', (e) => {
        const card = document.getElementById(chip.getAttribute('href').slice(1));
        if (!card) return;
        e.preventDefault();
        showCard(card);
    });
});

// Tools in the theme cards bring up the highlights, opened on their card
document.querySelectorAll('.lp-tool').forEach((tool) => {
    tool.addEventListener('click', (e) => {
        const card = document.getElementById(tool.getAttribute('href').slice(1));
        if (!card) return;
        e.preventDefault();
        const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        document.getElementById('highlights').scrollIntoView({ behavior: still ? 'auto' : 'smooth' });
        showCard(card);
    });
});

const onScroll = () => {
    updateArrows();
    updateCurrentChip();
};

track.addEventListener('scroll', onScroll, { passive: true });
window.addEventListener('resize', onScroll);
onScroll();
