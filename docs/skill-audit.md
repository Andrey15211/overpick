# Skill audit for Overpick

Date: 2026-07-05

## Installed and used

- `hallmark`: used for the workbench visual pass, responsive constraints, token discipline, and CSS anti-pattern checks.
- `make-interfaces-feel-better`: used for motion details, interruptible transitions, tactile controls, and hover/active polish.
- `complexity-optimizer`: used for code-path review around repeated filtering, derived data, and build-time validation.
- `codebase-design`: used for the architecture audit vocabulary: module, interface, depth, seam, adapter, leverage, locality.
- `webapp-testing`: already installed in the local skill set; used conceptually for responsive browser verification.

## Newly installed

- `code-review` from `mattpocock/skills`: installed because the goal explicitly asks for a full code review pass.
- `improve-codebase-architecture` from `mattpocock/skills`: installed because the project still needs deeper module seams around meta data sync and display derivation.

Codex must be restarted before newly installed skills appear in the skill list for future turns.

## Reviewed but not installed wholesale

- `mattpocock/skills`: useful as a source of engineering workflow skills, but installing every skill would add unrelated productivity and deprecated/in-progress flows. Only the two relevant engineering skills were installed.
- `jakubkrehel/make-interfaces-feel-better`: already installed locally; no duplicate installation.
- `Nutlope/hallmark`: already installed locally; no duplicate installation.
- `Kappaemme-git/codex-complexity-optimizer`: already installed locally; no duplicate installation.
- `ComposioHQ/awesome-codex-skills`: reviewed as a catalog. Most entries are Composio/Rube automations for unrelated external services. Installing all of them would pollute the skill set without improving this Next.js site. The relevant local equivalent, `webapp-testing`, is already installed.

## Current architecture findings

- The weekly meta sync module now has better CI leverage: the same GitHub Actions interface runs browser source verification, data tests, lint, and a production build before it can commit.
- The data validation module was too shallow: it only checked one meta entry per hero. It now validates source freshness shape, numeric rate ranges, patch IDs, patch dates, change types, and hero references.
- The Blizzard fetch implementation had poor locality for external-source failure handling. HTTP timeout handling now lives inside `fetchText`, so future fetch callers inherit the same failure mode.
