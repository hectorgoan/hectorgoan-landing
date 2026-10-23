---
name: update-lumina-page
description: Update the Lumina page (lumina/) and the homepage Lumina tile with the latest features and screenshots from github.com/hectorgoan/lumina-releases. Use when asked to "update the Lumina page", sync Lumina features, or after a new Lumina release.
---

# Update the Lumina page

The Lumina page (`lumina/index.html`) shows Lumina's marketing material. Its source of
truth is the feature table in the README of Lumina's public releases repo,
github.com/hectorgoan/lumina-releases (between `<!-- features:start -->` and
`<!-- features:end -->`), and the images under `marketing/` there. Lumina's source repo,
hectorgoan/lumina, is private, so the page never links to it.
`scripts/sync_lumina.py` copies them over, so never hand-edit the generated blocks.

## Steps

1. Branch from `main` as `feature/lumina-<what-changed>` (for example
   `feature/lumina-media-widget`). Branch names always follow `feature/<name>`.
2. Make sure Pillow is installed: `python3 -m pip install Pillow`.
3. Run `python3 scripts/sync_lumina.py`. It downloads every feature image to
   `lumina/features/`, rewrites the highlights carousel and its chips between the
   `lumina-features` and `lumina-chips` markers, fills the "Seventeen tools. Four jobs."
   cards between the `lumina-themes` markers from `THEMES`, and removes features that left
   the README. It also sets the hero's version (`<!-- lumina-version -->`) from the README's
   "Download Lumina <version>" link, and rebuilds the "A handful of toggles" comparison between the
   `lumina-sandbox` markers, dimming the tools in `SANDBOXED`. Every tool needs a theme: when the README gains a feature, the script stops and
   names it; add its slug to the right theme in `THEMES` (or to `NO_THEME` if it is a panel
   setting, like More and Customize) and run it again. The heading's count follows `THEMES`, and
   each tool links to its highlight card (quick actions to the Quick Actions card).
   Quick actions have no card of their own, so `THEMES` lists them as `(name, icon)` with a
   hand-drawn SVG in `lumina/icons/` (white glyph on the Quick Actions indigo gradient).
   Each chip gets the feature's icon, cut from its card into `lumina/icons/`, and its colour.
   If it warns that it couldn't find an icon on a card, that chip falls back to indigo; check it.
   The script reads the 2x images in `marketing/2x/` (1600px cards, 2880px heroes) and saves
   cards at 1280px, so they stay sharp on Retina screens. `marketing/` itself only has the
   README's 1x copies (800px cards, 1440px heroes); don't sync from those.
   Right after a release, raw.githubusercontent.com can serve the old README for a few minutes;
   if the printed version is behind, wait or point `RAW` at the release commit for that run.
   It prints the feature list; compare it with `git diff --stat` to name what's new.
4. When the app's look changed (new icon, redesigned panel), run it with `--hero` too. That
   refreshes `resources/lumina-icon.png` and the panel crops used by the page hero
   (`lumina/hero-panel-*.jpg`) and the homepage tile (`resources/lumina-panel-*.jpg`). The
   page hero's box, `HERO_CROP`, is in the 1x hero's 1440x900 coordinates. The homepage tile's
   crop is not a fixed box: `panel_box` finds the panel's edges and top in each hero, so it stays
   centred when a release nudges the panel. It prints where it found the panel; look at the tile
   in light and dark anyway, and if it exits saying it couldn't find the edges, the screenshot's
   layout changed and `panel_box` needs a look.
5. Check the hand-written copy in `lumina/index.html` against Lumina's README: the hero
   description (the headline "Your desktop’s Swiss Army knife." is Héctor's marketing line,
   shared with the homepage tile, so keep it even if the README tagline differs), "Requires macOS …", and the install steps. Update them if the
   README changed (for example a new minimum macOS or notarization removing step 3), and the
   licence tiles and price line ("To be announced soon" until Héctor sets a price) against its
   "Free trial and licence" section. "Why Lumina isn’t on the Mac App Store" is Héctor's text:
   keep it word for word, and keep `SANDBOXED` in step with the tools its reasons name.
6. Look at the page at desktop and phone widths, in light and dark (serve the repo with
   `python3 -m http.server` and open `/lumina/`). The CDNs may be blocked in a sandbox;
   the page itself needs none.
7. If a preview artifact exists (see project memory), republish it from the branch.
8. Commit with a message that lists the new or removed features, push, and open a PR
   against `main` with Before/After paragraphs naming them.

## Notes

- The download button links to lumina-releases' `releases/latest/download/Lumina.zip`, which always serves
  the newest release, so releases alone never need a page update beyond the version line.
- Lumina's indigo (`--indigo`, `--lp-cta`) is the only accent on the page. Keep new
  elements in the homepage's white and graphite style.
