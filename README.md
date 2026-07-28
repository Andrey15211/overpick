# Overpick

Overpick is a Russian-language Overwatch 2 counter-pick and meta dashboard. It shows hero counters, tier lists, patch history, role filters, and hero detail pages from local JSON data that is refreshed from Blizzard public sources.

## Current Scope

- Counter-pick browser for all heroes in `src/data/heroes.json`.
- Meta and tier list views driven by `src/data/meta.json` and `src/data/metaFilters.ts`.
- Patch history from `src/data/patches.json`.
- Hero detail pages at `/hero/[id]`.
- Production smoke checks for `/`, `/heroes`, `/meta`, `/patches`, and `/hero/junkerqueen`.
- Local weekly sync from Blizzard Hero Statistics and live patch notes.

## Commands

```bash
npm run dev
npm test
npm run lint
npm run build
npm run verify:site
npm run verify:browser
npm run verify:local
npm run verify:all
npm run sync:meta
npm run update:meta
```

Use `npm run dev` for local development. Before pushing meaningful changes, run `npm run verify:local`; it runs tests, lint, production build, and built-site smoke verification in the required order. Use `npm run verify:all` when touching meta sync, source parsing, or patch parsing because it also checks live Blizzard sources in a browser.

## Automation

GitHub Actions are intentionally disabled. The repository does not contain active workflow files; weekly updates are run locally by the owner or a machine-level scheduler.

Install dependencies once with `npm ci`, then run the complete weekly job from the repository root:

```bash
npm run update:meta
```

The command performs this sequence:

1. `npm run verify:browser` checks that Blizzard Hero Statistics and a live patch-notes page still expose the expected source structure.
2. `npm run sync:meta` downloads Blizzard rates and live patch notes, recalculates each hero tier from rates plus `src/data/metaFilters.ts`, and rewrites `src/data/meta.json` and `src/data/patches.json`.
3. `npm run verify:local` runs data tests, lint, `next build`, and production browser smoke checks for the built site.

The command does not commit, push, or deploy. To refresh a connected deployment after the checks pass, review the two data files, commit them, and push the intended branch; the hosting provider's existing deployment integration can then build the updated site. No deployment credentials or external settings are managed by this repository.

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
- `scripts/sync-overwatch-meta.mjs`: Blizzard sync job and tier-list generator.
- `scripts/verify-overwatch-browser.mjs`: live-source browser verifier.
- `scripts/verify-site.mjs`: production smoke verifier.
- `tests`: Node test contracts used by CI and weekly sync.

## Deployment

The app is a standard Next.js static/SSG project and can be deployed on Vercel or any host that supports `next build` and `next start`. There is no deployment command or deployment configuration in this repository; deployment remains the responsibility of the existing host integration after a reviewed push.
