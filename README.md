# qbio.io

Website of the Hyeshik Chang Lab (Quantitative Molecular Biology) at Seoul
National University, live at <https://qbio.io>. It is a Jekyll 4 site.

## Working on it locally

You need Ruby (the version in `.ruby-version`) and Bundler 4. On the lab server they
come from the `qbiowww` conda env, defined in `environment.yml` and used only by this
repo; `run.sh` and `sync.sh` enter it through `cdrun`:

```sh
conda env create -f environment.yml        # once; `conda env update` after edits
cdrun qbiowww "gem install --no-document bundler -v 4.0.6 && bundle install"
./run.sh                                   # preview at http://localhost:4000
```

Elsewhere, any Ruby of that version works: `gem install bundler -v 4.0.6`,
`bundle install`, `./run.sh`.

To check a production build the way CI does:

```sh
JEKYLL_ENV=production bundle exec jekyll build
bundle exec htmlproofer ./_site --disable-external --no-enforce-https \
  --swap-urls '^https\://qbio\.io:' --ignore-urls '/^(https:\/\/qbio\.io)?\/share\//'
```

## Editing content

Most changes are edits to YAML files in `_data/`: members (`team.yml`),
publications (`publist.yml`), news (`news.yml`), alumni and shared resources.
`CLAUDE.md` describes each file's fields and the usual content tasks. Every build
checks these files and stops with a list of problems (an author `link` missing from
`team.yml`, a misspelt category, a date out of order, ...), so fix what it reports.

## Deployment

- **Live site:** every push to `main` is built and deployed to GitHub Pages by
  `.github/workflows/jekyll.yml`. Pull requests are built and link-checked, not
  deployed.
- **Backup mirror:** `./sync.sh` on the lab server builds the current `origin/main`
  (from an export of that commit, whatever this checkout holds) and rsyncs it to
  `/home/www/qbio.io/`, which nginx serves as <https://qbio.snu.ac.kr>. `-n` shows
  what would change; `-q` prints nothing unless something changed or failed.
  Directories placed there by hand (listed in `KEEP` in the script) are left alone.
  To keep it current without anyone remembering, run it from cron (`crontab -e`;
  cron mails whatever it prints to `MAILTO`, so you hear only of changes and failures):

  ```
  17 * * * * /home/hyeshik/ChangLabSNU.github.io/sync.sh -q
  ```

Asset and navigation links are root-relative (`{{ site.baseurl }}/...`), never
`{{ site.url }}`, so the mirror loads everything from itself; only canonical
and Open Graph URLs are absolute and point at qbio.io.
