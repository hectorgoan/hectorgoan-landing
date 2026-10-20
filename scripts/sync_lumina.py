#!/usr/bin/env python3
"""Sync the Lumina page with the marketing material in github.com/hectorgoan/lumina.

Reads the feature table between <!-- features:start --> and <!-- features:end --> in
Lumina's README, downloads each feature image, and rewrites the highlights carousel and
its chips in lumina/index.html. Features that left the README are removed.

    python3 scripts/sync_lumina.py           # features only
    python3 scripts/sync_lumina.py --hero    # also refresh the icon and panel screenshots

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
    from PIL import Image
except ImportError:
    sys.exit("Pillow is required: python3 -m pip install Pillow")

RAW = "https://raw.githubusercontent.com/hectorgoan/lumina/HEAD/"
ROOT = Path(__file__).resolve().parent.parent
PAGE = ROOT / "lumina" / "index.html"
FEATURES_DIR = ROOT / "lumina" / "features"
FEATURE_WIDTH = 1280  # cards show at up to 640px, so this stays sharp on 2x screens

# Crops of docs/marketing/hero-{light,dark}.png (2880x1800), tuned to its current layout:
# the panel sits under the menu bar on the right. Re-check them when that layout changes.
HERO_CROPS = {
    ROOT / "lumina" / "hero-panel-{mode}.jpg": (2000, 0, 2880, 1240),          # Lumina page hero
    ROOT / "resources" / "lumina-panel-{mode}.jpg": (2326, 48, 2750, 720),     # homepage tile peek
}


def fetch(path):
    with urllib.request.urlopen(RAW + path, timeout=30) as res:
        return res.read()


def save_jpeg(image, path, width=None):
    image = image.convert("RGB")
    if width and image.width > width:
        image = image.resize((width, round(image.height * width / image.width)), Image.LANCZOS)
    image.save(path, "JPEG", quality=84, optimize=True, progressive=True)


def read_features():
    readme = fetch("README.md").decode("utf-8")
    block = re.search(r"<!-- features:start -->(.*?)<!-- features:end -->", readme, re.S)
    if not block:
        sys.exit("Lumina's README has no <!-- features:start --> block")
    features = []
    for slug, alt in re.findall(r'href="docs/marketing/features/([\w-]+)\.png"><img [^>]*alt="([^"]+)"', block.group(1)):
        alt = html.unescape(alt)
        features.append({"slug": slug, "name": alt.split(":")[0].strip(), "alt": alt})
    if not features:
        sys.exit("Found no features in Lumina's README")
    return features


def replace_block(page, name, body):
    pattern = re.compile(rf"(<!-- {name}:start -->).*?\n([ \t]*)(<!-- {name}:end -->)", re.S)
    if not pattern.search(page):
        sys.exit(f"lumina/index.html has no <!-- {name}:start --> block")
    return pattern.sub(lambda m: f"{m.group(1)}\n{body}\n{m.group(2)}{m.group(3)}", page)


def sync_features():
    features = read_features()
    FEATURES_DIR.mkdir(parents=True, exist_ok=True)
    for f in features:
        save_jpeg(Image.open(io.BytesIO(fetch(f"docs/marketing/features/{f['slug']}.png"))),
                  FEATURES_DIR / f"{f['slug']}.jpg", FEATURE_WIDTH)
    keep = {f"{f['slug']}.jpg" for f in features}
    removed = [p.name for p in FEATURES_DIR.glob("*.jpg") if p.name not in keep]
    for name in removed:
        (FEATURES_DIR / name).unlink()

    indent = " " * 24
    cards = "\n".join(
        f'{indent}<figure class="lp-card" id="f-{f["slug"]}"><img src="features/{f["slug"]}.jpg" '
        f'alt="{html.escape(f["alt"])}" width="{FEATURE_WIDTH}" height="{FEATURE_WIDTH * 9 // 16}" '
        f'loading="lazy" decoding="async"></figure>'
        for f in features)
    chips = "\n".join(
        f'{indent}<a class="lp-chip" href="#f-{f["slug"]}">{html.escape(f["name"])}</a>'
        for f in features)
    page = PAGE.read_text(encoding="utf-8")
    page = replace_block(page, "lumina-features", cards)
    page = replace_block(page, "lumina-chips", chips)
    PAGE.write_text(page, encoding="utf-8")
    print(f"{len(features)} features: {', '.join(f['name'] for f in features)}")
    if removed:
        print(f"Removed: {', '.join(removed)}")


def sync_hero():
    icon = Image.open(io.BytesIO(fetch("docs/icon.png")))
    icon.resize((160, 160), Image.LANCZOS).save(ROOT / "resources" / "lumina-icon.png", optimize=True)
    for mode in ("light", "dark"):
        hero = Image.open(io.BytesIO(fetch(f"docs/marketing/hero-{mode}.png")))
        for target, box in HERO_CROPS.items():
            save_jpeg(hero.crop(box), Path(str(target).format(mode=mode)))
    print("Refreshed the icon and panel screenshots")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--hero", action="store_true", help="also refresh the icon and panel screenshots")
    args = parser.parse_args()
    sync_features()
    if args.hero:
        sync_hero()
