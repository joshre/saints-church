# Saints Church

The website for [Saints Church](https://saintschurchknox.com), a Reformed Baptist church in Knoxville, TN.

Jekyll and Tailwind CSS, deployed by GitHub Pages from `master`.

## Running it locally

Requires Ruby and Node (the version in `.nvmrc`; `nvm use` will switch for you).

```bash
bundle install
yarn install
yarn watch
```

`yarn watch` runs the JS bundler, the Tailwind compiler, and `jekyll serve` together with live reload.

## How content is organized

Page copy lives in `_data/content.yml` instead of scattered through the templates. Rewording something doesn't require touching any markup. Templates pull it in as `{{ site.data.content.<section>.<field> }}`.

| Path | What's in it |
|------|--------------|
| `_data/content.yml` | All page copy |
| `_posts/` | Sermons, one file per episode |
| `_prayer_gatherings/` | Monthly prayer gathering guides |
| `resources/` | Standalone resource pages |
| `_includes/`, `_layouts/` | Templates |
| `_css/input.css` | Styles and Tailwind theme |

## Sermons

Sermons sync themselves. A scheduled workflow hits the podcast RSS feed every day, writes a post for anything new, pulls out the scripture reference and series, and then regenerates both the preacher and series index pages. Duplicates get caught by tracking episode GUIDs in `_data/processed_episodes.json`.

Transcriptions are added separately and rendered in a collapsible section on the sermon page.

See `.github/workflows/README.md` for the details, including how to trigger a sync by hand.

## Generated files

Four files get generated and committed directly – GitHub Pages serves them as-is: `_includes/icon.html`, `css/output.css`, `js/site.min.js`, and the taxonomy pages under `sermons/`.

You shouldn't need to build any of them by hand. The pre-commit hook regenerates them automatically, and CI fails if what's committed doesn't match a fresh build.

`_includes/icon.html` only holds the Heroicons actually used on the site, not the full set. Add an icon to a template and you'll need to run `yarn generate-icons` afterward – skip that step and it falls back to a default.

## Checks

The pre-commit hook handles formatting, regeneration, and linting on every commit – so most of this is automatic. It gets installed when you run `yarn install`.

```bash
yarn lint     # types, JS, CSS, Markdown, YAML, Tailwind class order
yarn format   # fix what's fixable
yarn build    # bundle JS
```

Formatting is Biome for JS and TypeScript, rumdl for Markdown, rustywind for Tailwind class order, and stylelint for CSS. CI runs the same checks, plus a full Jekyll build, on every push and pull request.

## License

MIT for the code. Sermon audio, transcriptions, and written content are the property of Saints Church.


Soli Deo Gloria
