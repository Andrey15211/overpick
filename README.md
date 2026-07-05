# Overpick

Overpick is a Russian-language Overwatch 2 counter-pick and meta dashboard. It shows hero counters, tier lists, patch history, role filters, and hero detail pages from local JSON data that is refreshed from Blizzard public sources.

## Current Scope

- Counter-pick browser for all heroes in `src/data/heroes.json`.
- Meta and tier list views driven by `src/data/meta.json` and `src/data/metaFilters.ts`.
- Patch history from `src/data/patches.json`.
- Hero detail pages at `/hero/[id]`.
- Production smoke checks for `/`, `/heroes`, `/meta`, `/patches`, and `/hero/junkerqueen`.
- Weekly GitHub Actions sync from Blizzard Hero Statistics and live patch notes.

## Commands

```bash
npm run dev
npm test
npm run lint
npm run build
npm run verify:site
npm run verify:browser
npm run sync:meta
```

Use `npm run dev` for local development. Before pushing meaningful changes, run `npm test`, `npm run lint`, `npm run build`, and `npm run verify:site`. Use `npm run verify:browser` when touching meta sync, source parsing, patch parsing, or GitHub Actions.

## Automation

`.github/workflows/ci.yml` runs on pushes to `main`, `codex/**`, and pull requests. It installs Chromium, runs data/design tests, lints, builds, and verifies the built site.

`.github/workflows/update-meta.yml` runs every Tuesday at 09:00 UTC and can also be started manually. It:

1. Verifies live Blizzard sources in a browser.
2. Runs `npm run sync:meta`.
3. Runs tests, lint, build, and built-site verification.
4. Commits `src/data/meta.json` and `src/data/patches.json` only when synced data changed.

## Meta Sources

The sync script uses:

- Blizzard Hero Statistics for current win rate and pick rate.
- Blizzard live patch notes for recent hotfix and patch entries.
- Local expert-signal weights in `src/data/metaFilters.ts`.

`tests/meta-data.test.cjs` enforces hero coverage, patch data contracts, image hosts, tier color tokens, and freshness of `meta.lastUpdated`. `tests/meta-filters.test.cjs` covers computed meta behavior, including Junker Queen staying in B tier for the default competitive view.

## Design System

`tokens.css` is the portable design-token source. `src/styles/variables.css` maps those tokens to the older Overpick variable names used by existing components.

`tests/design-contract.test.cjs` keeps the UI from drifting back into raw colors or broad motion declarations:

- raw color literals belong in `tokens.css` only;
- use explicit transition properties instead of `transition: all`;
- use `overflow-x: clip` or layout fixes instead of `overflow-x: hidden`.

## Key Paths

- `src/app`: Next.js App Router pages.
- `src/components`: reusable UI components.
- `src/data`: hero, counter, meta, patch, and synergy data.
- `src/styles`: shared component CSS.
- `scripts/sync-overwatch-meta.mjs`: Blizzard sync job.
- `scripts/verify-overwatch-browser.mjs`: live-source browser verifier.
- `scripts/verify-site.mjs`: production smoke verifier.
- `tests`: Node test contracts used by CI and weekly sync.

## Deployment

The app is a standard Next.js static/SSG project and can be deployed on Vercel or any host that supports `next build` and `next start`. The automated meta sync requires GitHub Actions with `contents: write` permission, which is already configured in `update-meta.yml`.
