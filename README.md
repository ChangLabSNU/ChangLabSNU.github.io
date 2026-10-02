# qbio.io

Website of the Hyeshik Chang Lab (Quantitative Molecular Biology) at Seoul
National University, live at <https://qbio.io>. It is a Jekyll 4 site.

## Working on it locally

You need Ruby (the version in `.ruby-version`) and Bundler 4.

```sh
bundle config set --local path vendor/bundle   # once: keep gems inside the checkout
bundle install
./run.sh                                        # preview at http://localhost:4000
```

To check a production build the way CI does:

```sh
JEKYLL_ENV=production bundle exec jekyll build
bundle exec htmlproofer ./_site --disable-external --no-enforce-https \
  --swap-urls '^https\://qbio\.io:' --ignore-urls '/^(https:\/\/qbio\.io)?\/share\//'
```

## Editing content

Most changes are edits to YAML files in `_data/`: members (`team.yml`),
publications (`publist.yml`), news (`news.yml`), alumni and shared resources.
`CLAUDE.md` describes each file's fields and the usual content tasks.

## Deployment

- **Live site:** every push to `main` is built and deployed to GitHub Pages by
  `.github/workflows/jekyll.yml`. Pull requests are built and link-checked, not
  deployed.
- **Backup mirror:** `./sync.sh` on the lab server rebuilds the current
  `origin/main` and rsyncs it to `/home/www/qbio.io/`. It refuses to run from a
  checkout that has local changes or is not at `origin/main`.
