---
name: update-lumina-page
description: Update the Lumina page (lumina/) and the homepage Lumina tile with the latest features and screenshots from github.com/hectorgoan/lumina. Use when asked to "update the Lumina page", sync Lumina features, or after a new Lumina release.
---

# Update the Lumina page

The Lumina page (`lumina/index.html`) shows Lumina's marketing material. Its source of
truth is the feature table in Lumina's README (between `<!-- features:start -->` and
`<!-- features:end -->`) and the images under `docs/marketing/` in that repo.
`scripts/sync_lumina.py` copies them over, so never hand-edit the generated blocks.

## Steps

1. Branch from `main` as `feature/lumina-<what-changed>` (for example
   `feature/lumina-media-widget`). Branch names always follow `feature/<name>`.
2. Make sure Pillow is installed: `python3 -m pip install Pillow`.
3. Run `python3 scripts/sync_lumina.py`. It downloads every feature image to
   `lumina/features/`, rewrites the highlights carousel and its chips between the
   `lumina-features` and `lumina-chips` markers, and removes features that left the README.
   Each chip gets the feature's icon, cut from its card into `lumina/icons/`, and its colour.
   If it warns that it couldn't find an icon on a card, that chip falls back to indigo; check it.
   It prints the feature list; compare it with `git diff --stat` to name what's new.
4. When the app's look changed (new icon, redesigned panel), run it with `--hero` too. That
   refreshes `resources/lumina-icon.png` and the panel crops used by the page hero
   (`lumina/hero-panel-*.jpg`) and the homepage tile (`resources/lumina-panel-*.jpg`). The
   crop boxes in `HERO_CROPS` match the current marketing hero; look at the new crops and
   adjust the boxes if the panel moved.
5. Check the hand-written copy in `lumina/index.html` against Lumina's README: the hero
   description (the headline "Your desktop’s Swiss Army knife." is Héctor's marketing line,
   shared with the homepage tile, so keep it even if the README tagline differs), "Requires macOS …", and the install steps. Update them if the
   README changed (for example a new minimum macOS or notarization removing step 3).
6. Look at the page at desktop and phone widths, in light and dark (serve the repo with
   `python3 -m http.server` and open `/lumina/`). The CDNs may be blocked in a sandbox;
   the page itself needs none.
7. If a preview artifact exists (see project memory), republish it from the branch.
8. Commit with a message that lists the new or removed features, push, and open a PR
   against `main` with Before/After paragraphs naming them.

## Notes

- The download button links to `releases/latest/download/Lumina.zip`, which always serves
  the newest release, so releases alone never need a page update.
- Lumina's indigo (`--indigo`, `--lp-cta`) is the only accent on the page. Keep new
  elements in the homepage's white and graphite style.
