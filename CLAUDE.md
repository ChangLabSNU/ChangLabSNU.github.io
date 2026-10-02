# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Jekyll 4 static site for the Hyeshik Chang Lab (Quantitative Molecular Biology) at Seoul National University. Live at **qbio.io**.

Tech stack: Jekyll 4.x (Gemfile pins `~> 4.3`), Bootstrap 3.3.x CSS (vendored SCSS) with no
jQuery or Bootstrap JS: `js/site.js` is the only script -- carousel, collapsing navbar and
clickable team cards -- and drives Bootstrap 3's CSS classes directly,
Font Awesome Free 5.15.3, Kramdown (GFM), Liquid templates, SCSS.

## Build & Serve

Ruby version is pinned in `.ruby-version` (CI reads it too); `Gemfile.lock` needs Bundler 4.
On the lab server Ruby, Bundler and the gems all live in the `qbiowww` conda env
(`environment.yml`, dedicated to this repo -- free to rebuild). Enter it with `cdrun`;
plain `bundle` outside it is the system Ruby and will not match.

```bash
cdrun qbiowww "bundle install"      # Install dependencies into the env
./run.sh                            # Dev server at http://localhost:4000
cdrun qbiowww "JEKYLL_ENV=production bundle exec jekyll build"   # Production build into _site/
```

Bumping Ruby means changing `.ruby-version` and `environment.yml` together.

CI also runs `htmlproofer` over `_site/` (internal links and images only); the exact
invocation is in `.github/workflows/jekyll.yml` and README.md. Run it before pushing.
Links under `qbio.io/share/` point at a separate Pages site on the same domain and
are skipped.

## Architecture

### Data-driven content (`_data/`)

All dynamic content lives in YAML data files. `_plugins/data_check.rb` checks them on every
build (local, CI and `sync.sh`) and fails it with a list of problems: author or fellowship
`link`s that are not in team.yml, unknown categories, a non-boolean `active`, missing photos
or images, malformed or out-of-order dates. Its rules mirror what the templates read -- when a
template starts reading a new field or category, update the matching rule.

- **team.yml** — Current members. Key fields: `name`, `link` (URL slug), `category` (principal-investigator/student/postdoc/support/research-assistant), `active` (true/false), `sort-key` (lastname-firstname).
- **publist.yml** — Publications. Authors reference members via `link` field (matching team.yml) or external authors via `name`. Supports `is_first`/`is_corresponding` markers. `highlight: 1` features a paper in the highlights section.
- **alumni_members.yml** — Former members with `start_date`/`end_date` as `[year, month, day]` arrays.
- **alumni_interns.yml** — Undergraduate interns with `year_begin`/`year_end`.
- **resources.yml** — Software and other materials shared from the lab. Fields: `name`, `link`, `category` (software/resource), `info` (one-line subtitle), `description`, optional `image` (file in `images/resources/`), `links` (list of `title`/`url`) and `license`.
- **news.yml** — Announcements with `date` (string like "Feb 24, 2025") and `headline` (HTML supported). Newest first.

### Layouts (`_layouts/`)

- **default.html** — Base with header/footer.
- **homelay.html** — Two-column (8/4) with news sidebar.
- **gridlay.html** — Full-width grid (team, publications).
- **textlay.html** — Full-width text (research, openings).
- **member.html** — Individual profile with sidebar for CV/social links. Auto-populates publications by last name match.

### Pages (`_pages/`)

Content pages live here. Member profiles are in `_pages/team/[link].md` where `[link]` matches the team.yml `link` field.

### Key includes (`_includes/`)

- **team_list.html** — Renders member grid, filters by category/active status.
- **resource_list.html** — Renders resources.yml grouped by category; an empty group prints no heading.
- **publication_author_list.html** — Formats author lists with internal links and first/corresponding markers.
- **publication_in_profile.html** — Shows a member's publications on their profile page.

## Common Content Tasks

### Add a team member

1. Add entry to `_data/team.yml` with `active: true`
2. Create `_pages/team/<link>.md` with `layout: member` front matter
3. Add photo to `images/members/<name>-thumb.jpg` (any size; the team page resizes it)

### Add a publication

Add entry to top of `_data/publist.yml`. Use `link:` for lab member authors (must match team.yml), `name:` for external authors.

### Add or change a page's social card

`_includes/head.html` builds the title, description, canonical link and Open Graph
tags from front matter: `title`, `excerpt` (falls back to `site.description`) and
`image` (falls back to the lab photo). A page with its own `image` gets the small
square Twitter card, everything else the wide one. Member pages compose their
description from `title` and `position` instead of needing an `excerpt`.

`sitemap: false` genuinely excludes a page now that jekyll-sitemap is loaded --
keep it on 404 and redirect stubs, leave it off anything that should be indexed.

### Add software or a shared resource

Add an entry to `_data/resources.yml` with `category: software` (lab-developed tools) or
`category: resource` (everything else we distribute). It appears on `/resources`,
in the order the entries are listed in the file.
For the optional thumbnail, put the file in `images/resources/` named `<slug>-thumb.png`
and supply it 240px wide (2x): it renders 120px wide, capped at 160px tall, floated
left of the text.

### Add news

Add entry to top of `_data/news.yml`. HTML is supported in `headline`.

### Move member to alumni

Set `active: false` in team.yml. Add entry to `_data/alumni_members.yml` with dates and current position.

## Conventions

- Member URL slugs: lowercase hyphenated (`jane-doe`)
- Sort keys: `lastname-firstname` pattern
- Publication author superscripts: `<sup>1</sup>` = first author, `<sup>*</sup>` = corresponding
- Custom plugins: `_plugins/sri.rb` adds an `sri` filter that hashes a local file at build
  time: `<script src="..." integrity="{{ '/js/x.js' | sri }}">`. Use it for every script tag.
  `_plugins/data_check.rb` validates `_data/` (see above).
- Photos go through `{% picture <preset> <path> alt="..." %}` (`_plugins/picture.rb`), not a
  bare `<img>`: it publishes WebP copies at the widths of the preset (`pictures:` in
  `_config.yml`) with `srcset`/`sizes` and the right `width`/`height`, so commit the
  full-size JPEG and let the build resize it. Used for the carousel slides, team-page
  photos and research figures. A production build needs libvips (in `environment.yml`;
  CI installs it); other builds fall back to the original image. The member page photo
  and Open Graph images stay plain JPEG, since link-preview crawlers handle WebP poorly.
- Homepage carousel configured in `_pages/home.md` with images from `images/home-slider/`.
  Every slide but the first carries `loading="lazy"`. Slides not currently on the page live
  in `images/_home-slider-archive/`, which is excluded from the build.
- Icon CSS is subset: `_sass/fontawesome/_icons-subset.scss` and the tail of
  `_sass/bootstrap/_glyphicons.scss` list only the icons in use. Using a new icon means
  adding its rule there -- the class alone will render nothing.

## Deployment

GitHub Pages is the live site. `.github/workflows/jekyll.yml` builds every push and pull
request with `JEKYLL_ENV=production` and link-checks the result; only `main` is deployed.
Dependabot (`.github/dependabot.yml`) proposes action and gem updates monthly.
`.github/workflows/external-links.yml` checks outbound links every Monday and keeps a single
"Broken external links" issue open while any fail (closing it when they recover); it ignores
403/429, which publishers send to every bot. It never blocks a deploy.

`./sync.sh` keeps a backup mirror on the lab server: `/home/www/qbio.io/`, served by nginx
as **qbio.snu.ac.kr**, needed for internal operational reasons. It builds an export of
`origin/main` (never the working tree) into a temp dir, so a failed build leaves the mirror
alone, then rsyncs `--delete -c`: only files whose contents changed are copied and listed.
A lock stops a cron run and a manual run from overlapping. That docroot also holds hand-placed directories that are not in
this repo; they are listed in `KEEP` in `sync.sh` and protected from the delete. `-n` is a
dry run, `-q` (for cron) prints only changes and errors. Running it for real publishes to the
mirror: leave that to the user.

Because of the mirror, links to the site's own pages and assets must be root-relative
(`{{ site.baseurl }}/...` or `relative_url`), never `{{ site.url }}`: an absolute qbio.io
URL would make the mirror depend on GitHub Pages, and the mirror's CSP blocks it anyway.
Only canonical and Open Graph URLs use `absolute_url`.

That CSP is set by the lab server's nginx (`script-src 'self'`, no `'unsafe-inline'`, no
third-party images). GitHub Pages cannot set headers, so qbio.io itself serves none -- write
for the stricter host: no inline scripts, no new third-party origins.
