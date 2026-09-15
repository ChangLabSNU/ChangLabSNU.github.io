# Home-slider archive

Photos that have appeared in, or are candidates for, the carousel on the
front page. They are kept here rather than in `images/home-slider/` so
they stay in the repository without being copied into every build — the
carousel markup puts all of its `<img>` tags in the DOM at once, so a
slide costs a visitor its full weight whether or not they ever see it.

To put one back on the front page, move the file into
`images/home-slider/` and add an `<img>` (and a matching
`<li data-slide-to="...">` indicator) in `_pages/home.md`. Everything
under `images/home-slider/` should be referenced by that page; anything
that stops being referenced belongs back here.

This directory is excluded from the build in `_config.yml`.
