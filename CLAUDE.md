# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Jekyll 3.9.3 static site for the Hyeshik Chang Lab (Quantitative Molecular Biology) at Seoul National University. Live at **qbio.io**.

Tech stack: Jekyll, Bootstrap 3, FontAwesome 6, Kramdown (GFM), Liquid templates, SCSS.

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
- Homepage carousel configured in `_pages/home.md` with images from `images/home-slider/`

## Deployment

GitLab CI builds on master branch push (Ruby 2.6.3, JEKYLL_ENV=production). Manual deploy via `./sync.sh` which builds and rsyncs to production.
