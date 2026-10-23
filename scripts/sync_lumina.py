#!/usr/bin/env python3
"""Sync the Lumina page with the marketing material in github.com/hectorgoan/lumina-releases.

Lumina's source repo is private; its public releases repo carries the README, the marketing
images and the downloads. Reads the feature table between <!-- features:start --> and <!-- features:end --> in
Lumina's README, downloads each feature image, cuts the feature's app icon and color out
of it for its chip, and rewrites the highlights carousel and its chips in
lumina/index.html, plus the tools grouped by theme (see THEMES), the App Store sandbox
comparison (see SANDBOXED) and the version shown in the hero. Features that left the README
are removed.

    python3 scripts/sync_lumina.py           # features only
    python3 scripts/sync_lumina.py --hero    # also refresh the icon and panel screenshots

Images come from marketing/2x/ (1600px cards, 2880px heroes), which stay sharp on 2x screens;
marketing/ itself holds the README's 1x copies.

Needs Pillow (python3 -m pip install Pillow) to resize images.
"""
import argparse
import html
import io
import re
import sys
import urllib.request
from pathlib import Path

try:
    from PIL import Image, ImageDraw
except ImportError:
    sys.exit("Pillow is required: python3 -m pip install Pillow")

RAW = "https://raw.githubusercontent.com/hectorgoan/lumina-releases/HEAD/"
ROOT = Path(__file__).resolve().parent.parent
PAGE = ROOT / "lumina" / "index.html"
FEATURES_DIR = ROOT / "lumina" / "features"
ICONS_DIR = ROOT / "lumina" / "icons"
FEATURE_WIDTH = 1280  # cards show at up to 640px, so this stays sharp on 2x screens
CARD_WIDTH = 1280     # extract_icon's coordinates are tuned to cards this wide
ICON_SIZE = 60        # chips show icons at 20px, the theme lists at 36px

# The tools, grouped into themes so the count reads as a plan. Each tool is a README feature
# slug, or (name, icon, card) for a quick action, which has no card of its own: its icon is a
# hand-drawn SVG in lumina/icons/ and it links to the card it shares. Each tool links to its
# card in the highlights. Every README feature must have a theme, or be in NO_THEME.
THEMES = [
    ("Focus", "Stay in the zone, and appear available while you do.",
     ["caffeine", "stay-green", "pomodoro", "quit-all"]),
    ("Monitor", "Know what your Mac is doing, at a glance.",
     ["system", "top-processes", "storage", "batteries"]),
    ("Clean", "Get your space, and a fresh start, back.",
     ["cleanup", "uninstaller", ("Empty Trash", "empty-trash.svg", "quick-actions"), "keyboard-lock"]),
    ("Everyday", "The small switches you reach for all day.",
     ["media", "world-clocks", "appearance", ("Sleep", "sleep.svg", "quick-actions"),
      ("Silence", "silence.svg", "quick-actions")]),
]
NO_THEME = {"quick-actions", "more-section", "customize"}  # split into its tools above, or settings
# The tools "Why Lumina isn’t on the Mac App Store" says couldn’t work in the App Sandbox: the
# comparison dims them. Keep it in step with the reasons written out under it in index.html.
SANDBOXED = {"uninstaller", "cleanup", "quit-all", "empty-trash", "appearance", "stay-green",
             "keyboard-lock", "system", "media", "batteries"}
NUMBERS = "zero one two three four five six seven eight nine ten eleven twelve thirteen fourteen " \
          "fifteen sixteen seventeen eighteen nineteen twenty twenty-one twenty-two twenty-three " \
          "twenty-four twenty-five".split()

# Crops of marketing/hero-{light,dark}.jpg in its 1440x900 coordinates, tuned to its current
# layout: the panel sits under the menu bar on the right. Re-check them when that layout changes.
# sync_hero scales them to the 2x hero it crops from.
HERO_CROPS = {
    ROOT / "lumina" / "hero-panel-{mode}.jpg": (1000, 0, 1440, 620),           # Lumina page hero
    ROOT / "resources" / "lumina-panel-{mode}.jpg": (1163, 24, 1375, 360),     # homepage tile peek
}


def fetch(path):
    with urllib.request.urlopen(RAW + path, timeout=30) as res:
        return res.read()


def save_jpeg(image, path, width=None):
    image = image.convert("RGB")
    if width and image.width > width:
        image = image.resize((width, round(image.height * width / image.width)), Image.LANCZOS)
    image.save(path, "JPEG", quality=84, optimize=True, progressive=True)
    return image


def hex_color(rgb):
    return "#%02x%02x%02x" % tuple(rgb)


def contrast_with_white(rgb):
    def channel(v):
        v /= 255
        return v / 12.92 if v <= 0.03928 else ((v + 0.055) / 1.055) ** 2.4
    lum = 0.2126 * channel(rgb[0]) + 0.7152 * channel(rgb[1]) + 0.0722 * channel(rgb[2])
    return 1.05 / (lum + 0.05)


def extract_icon(card, path):
    """Cut the app icon from the top-left of a 1280px marketing card and return its color.

    The icon is the first bright block in the left column; its height moves with the copy
    below it, so it is found rather than cropped at fixed coordinates.
    """
    px = card.load()
    bright = lambda x, y: max(px[x, y]) > 170
    rows = [y for y in range(30, 420) if sum(bright(x, y) for x in range(70, 180)) > 40]
    if not rows:
        return None
    top = bottom = rows[0]
    for y in rows[1:]:
        if y != bottom + 1:
            break
        bottom = y
    cols = [x for x in range(40, 220) if sum(bright(x, y) for y in range(top, bottom + 1)) > (bottom - top) // 3]
    if not cols or not 60 < bottom - top < 110:
        return None
    icon = card.crop((cols[0] - 2, top - 2, cols[-1] + 3, bottom + 3)).resize((ICON_SIZE, ICON_SIZE), Image.LANCZOS)

    # The icon's own color: the median of its saturated, non-white pixels
    raw = icon.convert("RGB").tobytes()
    pixels = (tuple(raw[i:i + 3]) for i in range(0, len(raw), 3))
    colored = sorted((p for p in pixels if max(p) - min(p) > 40 and sum(p) < 600), key=sum)
    color = colored[len(colored) // 2] if colored else (88, 86, 214)

    # Round the corners so the dark card background doesn't show around the icon
    scale = 4
    mask = Image.new("L", (ICON_SIZE * scale, ICON_SIZE * scale), 0)
    ImageDraw.Draw(mask).rounded_rectangle((5, 5, ICON_SIZE * scale - 6, ICON_SIZE * scale - 6),
                                           radius=round(ICON_SIZE * scale * 0.22), fill=255)
    icon = icon.convert("RGBA")
    icon.putalpha(mask.resize((ICON_SIZE, ICON_SIZE), Image.LANCZOS))
    icon.save(path, optimize=True)

    # Darken it until white chip text on it reads at 4.5:1
    fill, t = color, 0.0
    while contrast_with_white(fill) < 4.5:
        t += 0.02
        fill = tuple(round(c * (1 - t)) for c in color)
    return hex_color(color), hex_color(fill)


def read_features():
    readme = fetch("README.md").decode("utf-8")
    block = re.search(r"<!-- features:start -->(.*?)<!-- features:end -->", readme, re.S)
    if not block:
        sys.exit("Lumina's README has no <!-- features:start --> block")
    features = []
    for slug, alt in re.findall(r'href="marketing/features/([\w-]+)\.jpg"><img [^>]*alt="([^"]+)"', block.group(1)):
        alt = html.unescape(alt)
        features.append({"slug": slug, "name": alt.split(":")[0].strip(), "alt": alt})
    if not features:
        sys.exit("Found no features in Lumina's README")
    version = re.search(r"Download Lumina (\d[\w.]*)", readme)
    return features, version.group(1) if version else None


def replace_block(page, name, body):
    pattern = re.compile(rf"(<!-- {name}:start -->).*?\n([ \t]*)(<!-- {name}:end -->)", re.S)
    if not pattern.search(page):
        sys.exit(f"lumina/index.html has no <!-- {name}:start --> block")
    return pattern.sub(lambda m: f"{m.group(1)}\n{body}\n{m.group(2)}{m.group(3)}", page)


def sync_features():
    features, version = read_features()
    FEATURES_DIR.mkdir(parents=True, exist_ok=True)
    ICONS_DIR.mkdir(parents=True, exist_ok=True)
    for f in features:
        card = save_jpeg(Image.open(io.BytesIO(fetch(f"marketing/2x/features/{f['slug']}.jpg"))),
                         FEATURES_DIR / f"{f['slug']}.jpg", FEATURE_WIDTH)
        f["size"] = card.size
        if card.width != CARD_WIDTH:
            card = card.resize((CARD_WIDTH, round(card.height * CARD_WIDTH / card.width)), Image.LANCZOS)
        f["colors"] = extract_icon(card, ICONS_DIR / f"{f['slug']}.png")
        if not f["colors"]:
            print(f"Warning: no icon found on the {f['name']} card; its chip has no icon or color")
    removed = []
    for folder, ext in ((FEATURES_DIR, "jpg"), (ICONS_DIR, "png")):
        keep = {f"{f['slug']}.{ext}" for f in features}
        for p in folder.glob(f"*.{ext}"):
            if p.name not in keep:
                p.unlink()
                removed.append(f"{folder.name}/{p.name}")

    indent = " " * 24
    cards = "\n".join(
        f'{indent}<figure class="lp-card" id="f-{f["slug"]}"><img src="features/{f["slug"]}.jpg" '
        f'alt="{html.escape(f["alt"])}" width="{f["size"][0]}" height="{f["size"][1]}" '
        f'loading="lazy" decoding="async"></figure>'
        for f in features)
    def chip(f):
        if not f["colors"]:
            return f'{indent}<a class="lp-chip" href="#f-{f["slug"]}">{html.escape(f["name"])}</a>'
        color, fill = f["colors"]
        return (f'{indent}<a class="lp-chip" href="#f-{f["slug"]}" style="--chip: {fill}; --chip-glow: {color}">'
                f'<img src="icons/{f["slug"]}.png" alt="" width="{ICON_SIZE}" height="{ICON_SIZE}">'
                f'{html.escape(f["name"])}</a>')
    chips = "\n".join(chip(f) for f in features)
    page = PAGE.read_text(encoding="utf-8")
    page = replace_block(page, "lumina-themes", themes_html(features))
    page = replace_block(page, "lumina-sandbox", sandbox_html(features))
    page = replace_block(page, "lumina-features", cards)
    if version:
        page = re.sub(r"(<!-- lumina-version -->)\d[\w.]*", rf"\g<1>{version}", page)
    else:
        print("Warning: no version found in Lumina's README; the hero keeps its old one")
    page = replace_block(page, "lumina-chips", chips)
    PAGE.write_text(page, encoding="utf-8")
    print(f"Lumina {version}, {len(features)} features: {', '.join(f['name'] for f in features)}")
    if removed:
        print(f"Removed: {', '.join(removed)}")


def themes_html(features):
    """The tools grouped by theme, with the total in the heading."""
    names = {f["slug"]: f["name"] for f in features}
    themed = {t if isinstance(t, str) else t[2] for _, _, tools in THEMES for t in tools}
    missing = [f["name"] for f in features if f["slug"] not in themed | NO_THEME]
    if missing:
        sys.exit(f"Add {', '.join(missing)} to a theme in THEMES (scripts/sync_lumina.py)")
    gone = [t for t in themed if t not in names]
    if gone:
        sys.exit(f"{', '.join(gone)} left Lumina's README: remove them from THEMES")
    total = sum(len(tools) for _, _, tools in THEMES)
    count = NUMBERS[total].capitalize() if total < len(NUMBERS) else str(total)
    jobs = NUMBERS[len(THEMES)].capitalize()

    pad = " " * 20
    out = [f'{pad}<h2 class="lp-h2" id="tools">{count} tools. <span class="lp-ink">{jobs} jobs.</span></h2>',
           f'{pad}<p class="lp-sec-lede">Everything in Lumina helps you focus, keep an eye on your Mac, '
           f'clean it up, or get through the day.</p>',
           f'{pad}<div class="lp-themes">']
    for name, blurb, tools in THEMES:
        out.append(f'{pad}    <article class="lp-theme">')
        out.append(f'{pad}        <div class="lp-theme-top">')
        out.append(f'{pad}            <h3 class="lp-theme-name">{html.escape(name)}</h3>')
        out.append(f'{pad}            <span class="lp-theme-count">{len(tools)} tools</span>')
        out.append(f'{pad}        </div>')
        out.append(f'{pad}        <p class="lp-theme-blurb">{html.escape(blurb)}</p>')
        out.append(f'{pad}        <ul class="lp-theme-tools">')
        for t in tools:
            label, icon, card = (names[t], f"{t}.png", t) if isinstance(t, str) else t
            out.append(f'{pad}            <li><a class="lp-tool" href="#f-{card}">'
                       f'<img src="icons/{icon}" alt="" width="{ICON_SIZE}" height="{ICON_SIZE}">'
                       f'{html.escape(label)}</a></li>')
        out.append(f'{pad}        </ul>')
        out.append(f'{pad}    </article>')
    out.append(f'{pad}</div>')
    return "\n".join(out)


def sandbox_html(features):
    """Every tool twice: as it would be in the App Sandbox (SANDBOXED dimmed), and as sold."""
    names = {f["slug"]: f["name"] for f in features}
    tools = [(names[t], f"{t}.png", t) if isinstance(t, str) else t for _, _, ts in THEMES for t in ts]
    unknown = SANDBOXED - {tool_slug(t) for t in tools}
    if unknown:
        sys.exit(f"{', '.join(sorted(unknown))} in SANDBOXED is not a tool in THEMES")
    total, works = len(tools), sum(1 for t in tools if tool_slug(t) not in SANDBOXED)
    pad = " " * 20

    def grid(dim):
        cells = []
        for t in tools:
            off = dim and tool_slug(t) in SANDBOXED
            cells.append(f'{pad}            <li class="lp-sb-tool{" is-off" if off else ""}">'
                         f'<img src="icons/{t[1]}" alt="" width="{ICON_SIZE}" height="{ICON_SIZE}">'
                         f'<span>{html.escape(t[0])}</span></li>')
        return "\n".join(cells)

    return "\n".join([
        f'{pad}<div class="lp-sb">',
        f'{pad}    <div class="lp-sb-card">',
        f'{pad}        <div class="lp-sb-top"><div><p class="lp-sb-label">In the App Sandbox</p>'
        f'<h3 class="lp-sb-name">A handful of toggles</h3></div>'
        f'<span class="lp-sb-count">{works} of {total}</span></div>',
        f'{pad}        <ul class="lp-sb-grid" aria-label="Tools that would still work: '
        f'{html.escape(", ".join(t[0] for t in tools if tool_slug(t) not in SANDBOXED))}">',
        grid(True),
        f'{pad}        </ul>',
        f'{pad}        <p class="lp-sb-foot">The {NUMBERS[total - works]} dimmed tools can’t do their job from inside the sandbox.</p>',
        f'{pad}    </div>',
        f'{pad}    <div class="lp-sb-card is-on">',
        f'{pad}        <div class="lp-sb-top"><div><p class="lp-sb-label">Sold directly</p>'
        f'<h3 class="lp-sb-name">All of Lumina</h3></div>'
        f'<span class="lp-sb-count">{total} of {total}</span></div>',
        f'{pad}        <ul class="lp-sb-grid" aria-label="Every tool works">',
        grid(False),
        f'{pad}        </ul>',
        f'{pad}        <p class="lp-sb-foot">Download it here, pay once, and it updates itself in place.</p>',
        f'{pad}    </div>',
        f'{pad}</div>',
    ])


def tool_slug(tool):
    """A tool's own slug: its feature's, or for a quick action its icon's name."""
    label, icon, card = tool
    return icon[:-4] if icon.endswith(".svg") else card


def sync_hero():
    icon = Image.open(io.BytesIO(fetch("marketing/icon.png")))
    icon.resize((160, 160), Image.LANCZOS).save(ROOT / "resources" / "lumina-icon.png", optimize=True)
    for mode in ("light", "dark"):
        hero = Image.open(io.BytesIO(fetch(f"marketing/2x/hero-{mode}.jpg")))
        scale = hero.width / 1440
        for target, box in HERO_CROPS.items():
            save_jpeg(hero.crop(tuple(round(v * scale) for v in box)), Path(str(target).format(mode=mode)))
    print("Refreshed the icon and panel screenshots")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--hero", action="store_true", help="also refresh the icon and panel screenshots")
    args = parser.parse_args()
    sync_features()
    if args.hero:
        sync_hero()
