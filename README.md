# Saints Church

The website for [Saints Church](https://saintschurchknox.com), a Reformed Baptist church in Knoxville, TN.

Jekyll and Tailwind CSS. The Pages workflow (`.github/workflows/pages.yml`) builds the CSS, JS, and site and deploys every push to `master`, so the repo's Pages source needs to be set to "GitHub Actions".

## Running it locally

Requires Ruby and Node (the version in `.nvmrc`; `nvm use` will switch for you).

```bash
bundle install
yarn install
yarn watch
```

`yarn watch` runs the JS bundler, the Tailwind compiler, and `jekyll serve` together with live reload. The built CSS and JS aren't committed, so if you'd rather run `bundle exec jekyll serve` on its own, run `yarn build:prod` first.

## How content is organized

Page copy lives in `_data/content.yml` instead of scattered through the templates. Rewording something doesn't require touching any markup. Templates pull it in as `{{ site.data.content.<section>.<field> }}`.

| Path | What's in it |
|------|--------------|
| `_data/content.yml` | All page copy |
| `_posts/` | Sermons, one file per episode |
| `_prayer_gatherings/` | Monthly prayer gathering guides |
| `_worship_guides/` | Weekly worship guides, one file per Sunday |
| `_data/songs/` | Song lyrics, one file per song |
| `resources/` | Standalone resource pages |
| `_includes/`, `_layouts/` | Templates |
| `_css/input.css` | Styles and Tailwind theme |

## Worship guides

Each Sunday's guide is a front-matter-only file in `_worship_guides/`, named for the date (`2026-10-25.md`). It lists the sections and their items by reference, so the lyrics, creed and catechism text live once in `_data/` and get reused every week. `/worship-guide/` always shows the current Sunday's guide, and `/worship-guide/2026-10-25/` shows that week's.

To add a week:

1. Copy last week's file and rename it to the new Sunday's date.
2. Change `title`, `description` and `sunday`, then swap the items.
3. Add any song that isn't in `_data/songs/` yet as `_data/songs/<slug>.yml`, with each stanza pasted as-is (a blank line inside a stanza starts a new block).

Items are `song: <slug>`, `catechism: <number>`, `creed: <key from _data/creeds.yml>`, `prayer: <reference>`, `communion: <title>`, `sermon: <text>`, `custom:` (with `title`, optional `meta`, and a Markdown `body`), or `include: <path>` for a one-off template. A section with `catechism_answer: kids` shows the kids' answer. A reference that doesn't resolve shows a dashed placeholder like `[song: slug]`, so preview the page before Sunday.

## Sermons

Sermons sync themselves. A scheduled workflow hits the podcast RSS feed every 6 hours from Sunday through Thursday (plus once on Friday), writes a post for anything new, pulls out the scripture reference and series, and then regenerates both the preacher and series index pages. Duplicates get caught by tracking episode GUIDs in `_data/processed_episodes.json`.

Transcriptions are added separately and rendered in a collapsible section on the sermon page.

See `.github/workflows/README.md` for the details, including how to trigger a sync by hand.

## Generated files

Two sets of generated files are committed: `_includes/icon.html` and the taxonomy pages under `sermons/`. `css/output.css` and `js/site.min.js` are built by the Pages workflow and gitignored.

You shouldn't need to build the committed ones by hand. The pre-commit hook regenerates them automatically, and CI fails if what's committed doesn't match a fresh run.

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


_Soli Deo Gloria_
