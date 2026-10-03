# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Jekyll 4 static site for the Hyeshik Chang Lab (Quantitative Molecular Biology) at Seoul National University. Live at **qbio.io**.

Tech stack: Jekyll 4.x (Gemfile pins `~> 4.3`), Kramdown (GFM), Liquid templates, Dart Sass.

- CSS: `_sass/_base.scss` is Bootstrap 3.3.7 + Bootswatch Lumen compiled once to plain CSS
  and pruned to what the site uses (its header says what was kept); edit it directly.
  `css/main.scss` holds the site's own rules on top and pulls it in with `@use`. No Bootstrap
  SCSS, mixins or variables remain, and Sass builds with no deprecations silenced -- keep it
  that way (`@use`, not `@import`). A component Bootstrap had but the site never used
  (buttons, forms, modals, ...) is not in `_base.scss`.
- Design: colours, widths and the font stack are custom properties on `:root` at the top
  of `css/main.scss` (`--ink`, `--accent`, `--tint`, ...); use them rather than new hex
  values. Every link is one blue, `--link` (also the team page's names and the blue
  labels); hovering underlines a link, or thickens the underline of one in running text.
  The purple `--accent` is for the buttons ("Join the lab" and the home page's two), and
  `--accent-blue`, the old link blue made darker, for the home page's news dates and its
  header links on hover (on inner pages the news dates are `--link`).
  The type is Ubuntu Sans, self-hosted (`fonts/`, `@font-face` in `_sass/_fonts.scss`):
  Latin-only variable cuts of the roman and italic, weight 400-800, normal width. Their
  `unicode-range` lists exactly the characters the files have, so anything else falls
  back to a system font -- keep the two in step if the files are ever re-cut. The Ubuntu
  Font Licence makes a modified copy carry "derivative" in its name, so the cut is named
  "Ubuntu Sans derivative QBio" inside the files (`fonts/UbuntuSans-LICENCE.txt`).
- Content pages share the team page's pieces (the "shared pieces" block in `css/main.scss`):
  `.chip` icon buttons for links (team PI band, member page links, resource links),
  `.team-role` for a bold grey role line, photos with 12px corners and no shadow, and
  rows split by `--hairline` rules (alumni, interns, publications, resources, all news).
- JS: `js/site.js` runs the carousel, driving Bootstrap 3's CSS classes directly (no
  jQuery), and makes the email buttons a mailto link. The carousel holds still
  while the mouse is over it or keyboard focus is in it (WCAG 2.2.2), and its arrows answer
  Enter and Space. `js/ribosome.js` draws the pixel scene under the home page hero (a
  ribosome translating an mRNA, 12 fps on a `<canvas>`). Both respect
  `prefers-reduced-motion`, and follow it if it changes while the page is open: the scene
  shows one still frame, the carousel stops autoplaying and its slides jump instead of glide.
- Icons: Font Awesome Free 5.15.3 shapes (the X logos from 6.5.2) as inline SVG (see Conventions).

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
build (local, CI and `sync.sh`) and fails it with a list of problems: missing required
fields, an author `link` or fellowship `recipient` that is not in team.yml, unknown
categories, a non-boolean `active`, missing photos or images, malformed or out-of-order
dates, icon names missing from `icons.yml`. Its rules
mirror what the templates read -- when a template starts reading a new field or category,
update the matching rule.

- **team.yml** — Members, current (`active: true`, shown on /team) and former. Key fields: `name`, `link` (URL slug), `category` (principal-investigator/student/postdoc/support/research-assistant), `active` (true/false), `sort-key` (lastname-firstname), `photo` (file in `images/members/`), `info` (the role line) and `intro` (one line on the card).
- **publist.yml** — Publications. Authors reference members via `link` field (matching team.yml) or external authors via `name`. Supports `is_first`/`is_corresponding` markers. `vip` is the volume and pages (or "in press"); `marked: 1` puts a triangle before the title.
- **fellowships.yml** — Fellowships and scholarships, listed on the recipient's profile as "<title> from <donor>" (so a donor reads "the X Foundation"). `recipient` is a team.yml `link`.
- **alumni_members.yml** — Former members with `start_date`/`end_date` as `[year, month, day]` arrays.
- **alumni_interns.yml** — Undergraduate interns with `year_begin`/`year_end`.
- **resources.yml** — Software and other materials shared from the lab. Fields: `name`, `link`, `category` (software/resource), `info` (one-line subtitle), `description`, optional `image` (file in `images/resources/`), `links` (list of `title`/`url`) and `license`.
- **news.yml** — Announcements with `date` (string like "Feb 24, 2025") and `headline` (HTML supported). Newest first.

### Layouts (`_layouts/`)

- **default.html** — Base: the masthead (`header.html`, plus `hero.html` when the page has
  `hero:` front matter), the content and the footer. Only the home page (the one with a
  hero) has the redesign's colours. Every other page gets `<body class="inner">`, which
  keeps the old site's: navy `#0a1922` header and footer, `#aaa` section links, `#555`
  text, `#333` headings (the `body.inner` block in `css/main.scss` repoints the tokens).
- **homelay.html** — Two-column (8/4) with news sidebar.
- **gridlay.html** — Full-width grid (team, publications, resources).
- **textlay.html** — Full-width text (research, openings, about, all news, 404).
- **member.html** — Individual profile: photo, name and position, then the CV/social links as icon buttons beside the text (a member with none gets no button column). The email button is `_includes/email_chip.html`: text with a hidden word in the HTML, against harvesters, which `js/site.js` makes a mailto link (the team page's PI band uses it too). The publications and fellowships come from `{% include publication_in_profile.html %}` in the page body, which matches the page's file name against author `link`s and fellowship `recipient`s (the PI's page leaves it out: it would be the whole list).
- **redirected.html** — Meta-refresh stubs that send an address on this site elsewhere, to the URL in `redirect_to` front matter: `/join` to the Notion application guide, `/feed/collections.xml` to an outside feed.

### Pages (`_pages/`)

Content pages live here. Member profiles are in `_pages/team/[link].md` where `[link]` matches the team.yml `link` field.

### Key includes (`_includes/`)

- **header.html** — Wordmark, the four section links and the "Join the lab" button.
  `aria-current` marks the section of the current page (its first URL segment): "page" on
  the section's own page, "true" on a page under it (a profile under Team). Section links
  end in a slash, as their permalinks do, so they cost no redirect.
- **hero.html** — The home page's headline, intro, buttons and pixel scene, all from the
  page's `hero:` front matter (see `_pages/home.md`). The masthead then fills the window
  (`.masthead-hero`, `100svh`) with the scene on its bottom edge, as on railcode.dev; the
  scene's pixel scale (4, 3 or 2) follows the window height so it fits (a window under
  700px wide always gets 3), and on a window too short for the text, a phone as a rule,
  it simply sits below the fold. Longer hero
  text pushes it there sooner, so check the pinning at 1280x720 after editing it.
- **team_lead.html** — The team page's opening band: the principal investigator's photo,
  intro and buttons (profile, email).
- **team_list.html** — The member cards (4:5 photo, name, role, intro; each a link to the
  profile), for the active members in `selected_categories`. With `order="monthly"` (as on
  the team page) they are shuffled into an order seeded by the month in Korea, e.g.
  "2026-10" (`_plugins/monthly_shuffle.rb`); `TEAM_ORDER_MONTH=2026-11` builds as if it
  were another month.
- **resource_list.html** — Renders resources.yml grouped by category; an empty group prints no heading.
- **publication_author_list.html** — Formats author lists with internal links and first/corresponding markers.
- **publication_in_profile.html** — A member's fellowships and publications, included at
  the end of their profile page's body.

## Common Content Tasks

### Add a team member

1. Add entry to `_data/team.yml` with `active: true`
2. Create `_pages/team/<link>.md` (copy an existing one): front matter `layout: member`,
   `title` (the name), `position`, `image`, `permalink: /team/<link>` (without it the page
   is built under `/_pages/`), and any of `email`, `cv`, `x`, `github`, `orcid`, `scholar`
   that apply; then the bio, `## Education`, and `{% include publication_in_profile.html %}`
3. Add photo to `images/members/<name>-thumb.jpg`, at least 520px wide and roughly 4:5
   (the team page crops it to 4:5 around the centre and resizes it)

### Add a publication

Add entry to top of `_data/publist.yml`. Use `link:` for lab member authors (must match team.yml), `name:` for external authors.

### Add or change a page's social card

`_includes/head.html` builds the title, description, canonical link and Open Graph
tags from front matter: `title`, the page's short name ("Team"; the tab shows "Team |
CHANGlab", except on the home page), `excerpt`, one sentence on what the page holds
(falls back to `site.description`) and
`image` (falls back to the lab photo). A page with its own `image` gets the small
square card on X (`twitter:card` summary), everything else the wide one. Member pages compose their
description from `title` and `position` instead of needing an `excerpt`.

`sitemap: false` genuinely excludes a page now that jekyll-sitemap is loaded --
keep it on 404 and redirect stubs, leave it off anything that should be indexed.

### Add software or a shared resource

Add an entry to `_data/resources.yml` with `category: software` (lab-developed tools) or
`category: resource` (everything else we distribute). It appears on `/resources`,
in the order the entries are listed in the file.
For the optional thumbnail, put the file in `images/resources/` named `<slug>-thumb.png`
and supply it 240px wide (2x): it renders at most 120px wide (90px below 768px) and
160px tall, in a column left of the text, and above the text below 600px.

### Change the home page headline

Edit `hero:` in the front matter of `_pages/home.md`: `title`, `text` and a list of
`buttons` (`label`, `url`, optional `style: outline`). The paragraphs, photos and openings
note below it are the page body.

### Add news

Add entry to top of `_data/news.yml`. HTML is supported in `headline`.

### Move member to alumni

Set `active: false` in team.yml. Add entry to `_data/alumni_members.yml` with dates and current position.
On their profile page, set `position: Former member (<first year>–<last year>)`, the years
of `start_date` and `end_date` in alumni_members.yml (time as a member; an internship
before it does not count).

## Conventions

- Headings never skip a level (the accessibility audit checks this): a page has one `#`
  (its title), and its sections are `##`, also in member pages ("## Education") and the
  text pages. CSS sets their size per context, so a section heading in a member page or on
  /research looks smaller than a `##` on /team; do not drop to `###`/`####` for size.
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
  Every slide but the first carries `loading="lazy"`; a new slide needs a dot added to the
  `carousel-indicators` list too. Slides not currently on the page live
  in `images/_home-slider-archive/`, which is excluded from the build.
- Icons are inline SVG, not an icon font: `{% include icon.html name="github" %}`. The
  shapes live in `_data/icons.yml`,
  traced from Font Awesome Free 5.15.3 (CC BY 4.0), except the X logos, which 5.15.3 predates
  and come from 6.5.2; to add one, copy its `viewBox` and path from that version's SVG. The
  data check fails the build on a name that is not there.

## Deployment

GitHub Pages is the live site. `.github/workflows/jekyll.yml` builds every push and pull
request with `JEKYLL_ENV=production` and link-checks the result; only `main` is deployed.
It also rebuilds on a schedule around the turn of each month, which is what brings in the
team page's new monthly order. GitHub turns off a public repository's schedules after 60
days without activity; if the order stops changing, re-enable the workflow in the Actions
tab. A manual run on a branch other than main builds and checks
it without deploying.
Dependabot (`.github/dependabot.yml`) proposes action and gem updates monthly.
`.github/workflows/external-links.yml` checks outbound links every Monday and keeps a single
"Broken external links" issue open while any fail (closing it when they recover); it ignores
403/429, which publishers send to every bot. It never blocks a deploy.

`./sync.sh` keeps a backup mirror on the lab server: `/home/www/qbio.io/`, served by nginx
as **qbio.snu.ac.kr**, needed for internal operational reasons. It builds an export of
`origin/main` (never the working tree) into a temp dir, so a failed build leaves the mirror
alone, then rsyncs `--delete -c`: only files whose contents changed are copied and listed.
A lock stops a cron run and a manual run from overlapping, and the export shares this
checkout's `.jekyll-cache/pictures`, so photos are not re-encoded on every run. That
docroot also holds hand-placed directories that are not in this repo; they are listed in
`KEEP` in `sync.sh` and protected from the delete. `-n` is a dry run, `-q` (for cron)
prints only changes and errors. It is meant to run hourly from the user's crontab:

    17 * * * * /home/hyeshik/ChangLabSNU.github.io/sync.sh -q

Running it for real publishes to the mirror: leave that, and installing the cron line, to
the user.

Because of the mirror, links to the site's own pages and assets must be root-relative
(`{{ site.baseurl }}/...` or `relative_url`), never `{{ site.url }}`: an absolute qbio.io
URL would make the mirror depend on GitHub Pages, and the mirror's CSP blocks it anyway.
Only canonical and Open Graph URLs use `absolute_url`.

That CSP is set by the lab server's nginx (`script-src 'self'`, no `'unsafe-inline'` in it or
in `style-src`, no third-party images). GitHub Pages cannot set headers, so qbio.io itself
serves none -- write for the stricter host: no inline scripts, no `style="..."` attributes
or `<style>` blocks, no new third-party origins.
