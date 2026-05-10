# Vitest unit-test runner + `computeCategory` extraction — design

**Date:** 2026-05-10
**Status:** Approved (brainstorming complete; awaiting implementation plan)
**Author:** brainstorming session, AI Act Compass repo

## Goal

Add a unit-test runner to AI Act Compass and use it to lock in the regulatory
classification logic that today lives unexported inside the 2,812-line
`ai-act-compass.jsx`. The result is a regression net for the article-level
decisions in `computeCategory(answers, lang)` so that future edits to the wizard
data tables or the function body cannot silently move a system between risk
tiers.

The change is intentionally surgical: only `computeCategory` and the three data
constants it consumes leave the JSX file. Everything else
(`generateReport`, `CHECKLIST`, `QUICKWINS`, `TIMELINE`, `CATEGORIES_META`,
`ROLES`, `NATURES`, `ART6_EXCEPTIONS`) stays in place and can be extracted in a
later pass if and when it earns tests.

## Non-goals

- React component or wizard-flow tests (Playwright covers that separately, in a
  follow-up branch driven by the newly installed `playwright-best-practices`
  skill)
- Extracting or testing `generateReport` and the heavy content tables
- Snapshot testing — justification strings include EU article text that would
  produce brittle snapshots
- TypeScript migration
- Any change to `make-demo.cjs`, `Dockerfile`, `nginx.conf`, or the build
  pipeline

## Stack

- **Runner:** [Vitest](https://vitest.dev/) — native to Vite, zero-config for
  this project, fast on pure-logic tests
- **Environment:** `node` — `computeCategory` is pure and never touches the
  DOM, so we skip jsdom for speed
- **Coverage:** `@vitest/coverage-v8` with `text` + `html` reporters
- **New devDependencies:** `vitest`, `@vitest/coverage-v8`
- **Config:** a new `vitest.config.js` at the repo root with
  `test: { environment: 'node', include: ['src/**/*.test.js'] }`. We keep this
  separate from `vite.config.js` so the build config stays untouched
- **npm scripts** (added to `package.json`):
  - `test` → `vitest run`
  - `test:watch` → `vitest`
  - `test:coverage` → `vitest run --coverage`

## File changes

### Added

```
src/lib/
├─ i18n.js              # exports `t(val, lang)` (the standalone helper from line 24)
├─ classify.js          # exports computeCategory + PROHIBITED_PRACTICES + ANNEX_III_AREAS + ART50_TRIGGERS
└─ classify.test.js     # the classification matrix
vitest.config.js        # vitest configuration
```

### Modified

- **`ai-act-compass.jsx`**
  - Delete the inline `t()` helper (line 24)
  - Delete `PROHIBITED_PRACTICES` (line 312), `ANNEX_III_AREAS` (line 387),
    `ART50_TRIGGERS` (line 505)
  - Delete `computeCategory` (line 949)
  - Add at the top of section 2 (or near existing imports):
    ```js
    import { t } from './src/lib/i18n.js';
    import {
      computeCategory,
      PROHIBITED_PRACTICES,
      ANNEX_III_AREAS,
      ART50_TRIGGERS,
    } from './src/lib/classify.js';
    ```
  - Net effect: ~250 fewer lines in `ai-act-compass.jsx`; behaviour unchanged
- **`package.json`**: add the two devDeps and three scripts above
- **`.gitignore`**: add `coverage/`

### Untouched (deliberately)

`ART6_EXCEPTIONS`, `ROLES`, `NATURES`, `QUICKWINS`, `CHECKLIST`, `TIMELINE`,
`CATEGORIES_META`, `generateReport`. None of them are referenced inside
`computeCategory`; moving them would inflate the diff without enabling any
test.

## Test corpus

Tests live in `src/lib/classify.test.js`, organised by EU AI Act article
cluster. Each `it()` block carries a one-line citation comment so a future
reader can see at a glance which provision is being protected.

| Cluster | Test count | What it asserts |
|---|---|---|
| **Art. 5 prohibited practices** | 1 per item in `PROHIBITED_PRACTICES` | Each `id` selected → `primary === 'INTERDIT'`, justifications include the practice's `ref` |
| **Art. 5 short-circuit** | 1 | Prohibited + Annex III + art. 50 all set → still `INTERDIT`; no `categories` accumulated |
| **Art. 6(1) Annex I** | 1 | `annexI: 'oui'` → `primary === 'HAUT_RISQUE_ANNEXE_I'` |
| **Art. 6(2) Annex III base path** | 1 per item in `ANNEX_III_AREAS` | Each area, no exception → `primary === 'HAUT_RISQUE_ANNEXE_III'` |
| **Art. 6(3) derogations** | 2 | `exceptions: ['none']` → high-risk preserved; substantive exception (non-`none`) → not high-risk, derogation note in justifications |
| **Art. 6(3) 2nd al. profiling override** | 1 | `profiling: true` + a substantive exception → high-risk maintained, profiling note added |
| **Art. 50 transparency triggers** | 1 per item in `ART50_TRIGGERS` | Each trigger → `RISQUE_LIMITE` in categories |
| **GPAI** | 3 | `nature: 'gpai'`, `gpaiSystemic: 'non'` → `GPAI`; `gpaiSystemic: 'oui'` → `GPAI_RS`; `nature: 'systeme_sur_gpai'` → no GPAI category, art. 25/53 note added |
| **Priority ordering** | 1 | Annex I + Annex III + GPAI-RS + art. 50 all set → `primary === 'HAUT_RISQUE_ANNEXE_I'`, `secondary` in order `['HAUT_RISQUE_ANNEXE_III', 'GPAI_RS', 'RISQUE_LIMITE']` |
| **Minimal-risk fallback** | 2 | Empty answers → `RISQUE_MINIMAL` with the generic "no trigger" justification; high-risk fully derogated with no other trigger → `RISQUE_MINIMAL` but earlier justifications preserved |
| **i18n parity** | 1 | Same answers in `'en'` and `'fr'` produce identical `primary`, `secondary`, and category structure (only label text differs) |

Estimated total: **~28–35 tests**, exact count depends on the cardinality of
the three data constants.

Tests must use the data constants themselves (`PROHIBITED_PRACTICES.forEach(p =>
it(...))`) rather than hard-coded `id` strings, so adding a new prohibited
practice or Annex III area automatically grows the matrix instead of silently
leaving the new entry untested.

## Quality bars

- All tests pass on first run after extraction (we are not changing logic, only
  moving it)
- Coverage of `src/lib/classify.js`: ≥ 95% lines, ≥ 90% branches
- `npm run dev` still serves the wizard at `http://localhost:5173`
- `npm run build` still produces a working `dist/`
- `node make-demo.cjs` still produces the same MP4 walkthrough
- The Docker image still builds and `/health` still responds

## Architecture notes

- `src/lib/i18n.js` exports only the pure `t(val, lang)` helper. The React
  context-based `LangContext` and `useLang` stay in `ai-act-compass.jsx`
  because they require React and are only consumed by components.
- `src/lib/classify.js` has no React or DOM imports. It can run in a Node
  worker, on the edge, or in a future server-side compliance API without
  modification.
- The data tables are co-located with `computeCategory` (Approach A from
  brainstorming) rather than split into `src/lib/data/*.js` (Approach B). If
  `classify.js` ever exceeds ~400 lines or accrues a fourth data table, that
  decision should be revisited.
- Almost every justification carries a regulation citation in its `ref` field
  (`art. 5`, `art. 6(3)`, `art. 25 + art. 53`, …); the only exception is the
  minimal-risk fallback, whose `ref` is the literal `'analysis'` /
  `'analyse'`. Tests must assert presence by `ref`, not by full label text,
  because the labels include long EU regulation prose that is brittle to
  reformat.

## Risks and mitigations

- **Risk:** the extraction subtly changes module-load order or breaks a closure
  in `ai-act-compass.jsx`.
  **Mitigation:** behaviour-preserving extraction is the entire point — we run
  `npm run dev` and step through the demo flow before committing, and the
  Playwright smoke (when added) will catch regressions in CI.
- **Risk:** Vitest picks up tests inside `node_modules` or unrelated files.
  **Mitigation:** `include: ['src/**/*.test.js']` is restrictive by design.
- **Risk:** the file might contain a second `t` definition (e.g. shadowed
  inside a component) that the extraction silently breaks.
  **Mitigation:** before deletion, grep for `\bt\s*=|function\s+t\b` in
  `ai-act-compass.jsx` and confirm the only match is the standalone
  `const t = (val, lang) => …` at line 24.

## Out-of-scope follow-ups (parking lot)

- Extract `generateReport` and the content data tables into `src/lib/`, with a
  matching test file
- Add a Playwright e2e smoke (Welcome → Provider → AI system → Subliminal
  practice → Verdict) using the new `playwright-best-practices` skill
- Wire `npm test` into a pre-push hook or GitHub Actions workflow
- Add a coverage badge to the README
