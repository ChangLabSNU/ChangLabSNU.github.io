# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Jekyll 4 static site for the Hyeshik Chang Lab (Quantitative Molecular Biology) at Seoul National University. Live at **qbio.io**.

Tech stack: Jekyll 4.x (Gemfile pins `~> 4.3`), Bootstrap 3.3.x and jQuery 1.11.3 (both
vendored and pinned to each other -- Bootstrap 3's JS will not run on jQuery 3),
Font Awesome Free 5.15.3, Kramdown (GFM), Liquid templates, SCSS.

## Build & Serve

```bash
bundle install              # Install dependencies
bundle exec jekyll serve --watch  # Dev server at http://localhost:4000
bundle exec jekyll build -d public  # Production build
```

## Architecture

### Data-driven content (`_data/`)

All dynamic content lives in YAML data files:

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
3. Add photo to `images/members/<name>-thumb.jpg`

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
- Custom plugin `_plugins/markdown.rb` enables `{% markdown filename %}` in templates
- Homepage carousel configured in `_pages/home.md` with images from `images/home-slider/`.
  Every slide carries its own `width`/`height` (the real pixel size of the file, so the
  browser reserves the right box) and every slide but the first carries `loading="lazy"`.
  Keep both in step when swapping a photo. Slides not currently on the page live in
  `images/_home-slider-archive/`, which is excluded from the build.
- Icon CSS is subset: `_sass/fontawesome/_icons-subset.scss` and the tail of
  `_sass/bootstrap/_glyphicons.scss` list only the icons in use. Using a new icon means
  adding its rule there -- the class alone will render nothing.

## Deployment

GitHub Actions (`.github/workflows/jekyll.yml`) builds on push to `main` with Ruby 3.3
and `JEKYLL_ENV=production`, and deploys to GitHub Pages. Manual deploy via `./sync.sh`,
which builds and rsyncs to production.

`.gitlab-ci.yml` is left over from a GitLab Pages setup and cannot succeed: it pins Ruby
2.6.3 and bundler 2.0.1, while the Gemfile needs Ruby >= 2.7 and `Gemfile.lock` is in a
format only bundler >= 2.6 can read. There is no GitLab remote. Fix or delete it.
