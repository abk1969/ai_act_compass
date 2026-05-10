# Vitest unit-test runner + `computeCategory` extraction — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Vitest to AI Act Compass and extract `computeCategory` (plus its three data constants and the `t()` helper) from `ai-act-compass.jsx` into `src/lib/`, then lock the regulatory classification logic with a 32-test matrix organised by EU AI Act article cluster.

**Architecture:** Behaviour-preserving extraction — no logic changes anywhere, only file moves and import re-wiring. The wizard UI imports from the new `src/lib/` modules; the modules have no React or DOM dependencies and run in the Node test environment for speed.

**Tech Stack:** Vite 5, React 18, Vitest (new), @vitest/coverage-v8 (new), v8 coverage provider, Node test environment.

**Branch:** `feat/vitest-classify-extract` (already created and pushed; spec at `docs/superpowers/specs/2026-05-10-vitest-classify-extract-design.md`).

---

## Task 1: Install Vitest, configure it, wire up npm scripts

**Files:**
- Modify: `C:\Users\globa\ai_act_compass\package.json`
- Create: `C:\Users\globa\ai_act_compass\vitest.config.js`
- Modify: `C:\Users\globa\ai_act_compass\.gitignore`
- Create: `C:\Users\globa\ai_act_compass\src\lib\sanity.test.js` (will be deleted in Task 2)

- [ ] **Step 1: Install Vitest and the v8 coverage provider as devDependencies**

Run:
```powershell
npm install --save-dev vitest@^2.1.0 @vitest/coverage-v8@^2.1.0
```

Expected: both packages added under `devDependencies` in `package.json`; `package-lock.json` updated; no errors.

- [ ] **Step 2: Add `vitest.config.js` at the repo root**

Create the file with this exact content:

```js
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.js'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/lib/**/*.js'],
      exclude: ['src/lib/**/*.test.js'],
    },
  },
});
```

Why a separate config file (not merged into `vite.config.js`): the build config stays untouched, and the test config can evolve without touching production-build settings.

- [ ] **Step 3: Add three npm scripts to `package.json`**

In `package.json`, replace the `"scripts"` block with:

```json
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage"
  },
```

- [ ] **Step 4: Add `coverage/` to `.gitignore`**

Append to `.gitignore`:

```
# Vitest coverage output
coverage/
```

(If `.gitignore` does not yet exist, create it with that content.)

- [ ] **Step 5: Write a throwaway sanity test to prove Vitest is wired**

Create `src/lib/sanity.test.js`:

```js
import { describe, it, expect } from 'vitest';

describe('vitest wiring', () => {
  it('runs', () => {
    expect(1 + 1).toBe(2);
  });
});
```

- [ ] **Step 6: Run the sanity test**

Run:
```powershell
npm test
```

Expected output (key lines):
```
 ✓ src/lib/sanity.test.js (1)
   ✓ vitest wiring (1)
     ✓ runs

 Test Files  1 passed (1)
      Tests  1 passed (1)
```

If you get `vitest: command not found`, the install in Step 1 failed — re-run it. If the test runs but reports 0 tests, your `include` glob is wrong.

- [ ] **Step 7: Commit**

```powershell
git add package.json package-lock.json vitest.config.js .gitignore src/lib/sanity.test.js
git commit -m "test: add Vitest with v8 coverage and node env"
```

---

## Task 2: Extract the `t()` i18n helper to `src/lib/i18n.js`

**Files:**
- Create: `C:\Users\globa\ai_act_compass\src\lib\i18n.js`
- Create: `C:\Users\globa\ai_act_compass\src\lib\i18n.test.js`
- Modify: `C:\Users\globa\ai_act_compass\ai-act-compass.jsx` (lines 23–28)
- Delete: `C:\Users\globa\ai_act_compass\src\lib\sanity.test.js`

- [ ] **Step 1: Verify there is only one `t` definition in the JSX file**

Run:
```powershell
git grep -n "^const t\b\|^function t\b" ai-act-compass.jsx
```

Expected: exactly **one** match — `ai-act-compass.jsx:24:const t = (val, lang) => {`. If you see more than one, stop and investigate before deleting anything; the spec's "Risks" section calls this out.

- [ ] **Step 2: Write the failing test for `t()`**

Create `src/lib/i18n.test.js`:

```js
import { describe, it, expect } from 'vitest';
import { t } from './i18n.js';

describe('t(val, lang) — i18n resolver', () => {
  it('returns empty string for null', () => {
    expect(t(null, 'en')).toBe('');
  });

  it('returns empty string for undefined', () => {
    expect(t(undefined, 'fr')).toBe('');
  });

  it('passes through a plain string regardless of lang', () => {
    expect(t('hello', 'en')).toBe('hello');
    expect(t('hello', 'fr')).toBe('hello');
  });

  it('resolves a {en, fr} object by lang', () => {
    expect(t({ en: 'cat', fr: 'chat' }, 'en')).toBe('cat');
    expect(t({ en: 'cat', fr: 'chat' }, 'fr')).toBe('chat');
  });

  it('falls back to en when the requested lang key is missing', () => {
    expect(t({ en: 'only-en' }, 'fr')).toBe('only-en');
  });

  it('falls back to fr when neither requested nor en is present', () => {
    expect(t({ fr: 'only-fr' }, 'en')).toBe('only-fr');
  });

  it('returns empty string when the object has no usable key', () => {
    expect(t({ de: 'nope' }, 'en')).toBe('');
  });
});
```

- [ ] **Step 3: Run the test to confirm it fails**

Run:
```powershell
npm test -- src/lib/i18n.test.js
```

Expected: failure with `Failed to load url ./i18n.js` or `Cannot find module`.

- [ ] **Step 4: Create `src/lib/i18n.js`**

Create the file with this exact content (copied from `ai-act-compass.jsx` lines 23–28):

```js
// Translates a value: string passes through, {en, fr} object resolves by lang.
// Pure — used by both the React UI and the headless classify module.
export const t = (val, lang) => {
  if (val == null) return '';
  if (typeof val === 'string') return val;
  return val[lang] ?? val.en ?? val.fr ?? '';
};
```

- [ ] **Step 5: Run the test again to confirm it passes**

Run:
```powershell
npm test -- src/lib/i18n.test.js
```

Expected: 7 tests passed.

- [ ] **Step 6: Wire `ai-act-compass.jsx` to import `t` from the new module**

In `ai-act-compass.jsx`:

a) After the existing `import` block (after line 7), add:

```jsx
import { t } from './src/lib/i18n.js';
```

b) Delete the inline definition at lines 23–28 (the `// Translates a value:` comment through the closing `};` of the arrow function).

After the edit, `ai-act-compass.jsx` should still have `LangContext` and `useLang` at lines 20–21 — those stay (they need React).

- [ ] **Step 7: Verify the dev server still works**

Run:
```powershell
npm run dev
```

Open http://localhost:5173. Click through Welcome → Provider step. Toggle the EN/FR switch in the header. Confirm the labels swap correctly. Stop the dev server with Ctrl+C.

If labels are blank or stuck on one language, the import path is wrong or you deleted too much.

- [ ] **Step 8: Delete the throwaway sanity test from Task 1**

Run:
```powershell
git rm src/lib/sanity.test.js
```

- [ ] **Step 9: Run the full test suite**

Run:
```powershell
npm test
```

Expected: only the 7 i18n tests run, all passing. No reference to sanity.test.js.

- [ ] **Step 10: Commit**

```powershell
git add src/lib/i18n.js src/lib/i18n.test.js ai-act-compass.jsx
git commit -m "refactor(i18n): extract t() helper to src/lib/i18n.js with tests"
```

---

## Task 3: Extract `computeCategory` + 3 data constants to `src/lib/classify.js`

This task does the file move only — the test corpus comes in Tasks 4a–4e. We use one round-trip TDD test (an obvious-prohibited input → `INTERDIT`) to drive the extraction.

**Files:**
- Create: `C:\Users\globa\ai_act_compass\src\lib\classify.js`
- Create: `C:\Users\globa\ai_act_compass\src\lib\classify.test.js`
- Modify: `C:\Users\globa\ai_act_compass\ai-act-compass.jsx` (delete lines 312–385, 387–468, 505–542, 949–1051; add imports)

- [ ] **Step 1: Write one failing extraction-driver test**

Create `src/lib/classify.test.js`:

```js
import { describe, it, expect } from 'vitest';
import {
  computeCategory,
  PROHIBITED_PRACTICES,
  ANNEX_III_AREAS,
  ART50_TRIGGERS,
} from './classify.js';

describe('classify.js — module surface', () => {
  it('exports computeCategory as a function', () => {
    expect(typeof computeCategory).toBe('function');
  });

  it('exports PROHIBITED_PRACTICES with 8 items (art. 5(1)(a)..(h))', () => {
    expect(PROHIBITED_PRACTICES).toHaveLength(8);
  });

  it('exports ANNEX_III_AREAS with 8 items (Annex III §1..§8)', () => {
    expect(ANNEX_III_AREAS).toHaveLength(8);
  });

  it('exports ART50_TRIGGERS with 4 items', () => {
    expect(ART50_TRIGGERS).toHaveLength(4);
  });
});

describe('computeCategory — extraction round-trip', () => {
  it('returns INTERDIT when any prohibited practice is selected', () => {
    const result = computeCategory({ prohibitions: ['a'] }, 'en');
    expect(result.primary).toBe('INTERDIT');
    expect(result.secondary).toBeNull();
    expect(result.justifications.length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Run the test to confirm it fails**

Run:
```powershell
npm test -- src/lib/classify.test.js
```

Expected: failure with `Cannot find module './classify.js'` or similar.

- [ ] **Step 3a: Read the four source ranges from `ai-act-compass.jsx`**

The file content for `src/lib/classify.js` is built by literally concatenating four ranges from `ai-act-compass.jsx`, with `export` added to each top-level declaration. The ranges (verified against the current file at the time of plan-writing):

| Range | What | First line of source | Last line of source |
|---|---|---|---|
| L312–L385 | `PROHIBITED_PRACTICES` array (8 items) | `const PROHIBITED_PRACTICES = [` | `];` (the closing of the array) |
| L387–L468 | `ANNEX_III_AREAS` array (8 items) | `const ANNEX_III_AREAS = [` | `];` |
| L505–L542 | `ART50_TRIGGERS` array (4 items) | `const ART50_TRIGGERS = [` | `];` |
| L949–L1051 | `function computeCategory(answers, lang) { … }` | `function computeCategory(answers, lang) {` | the closing `}` of the function (line 1051) |

Use the Read tool with `offset` and `limit` to fetch each range exactly. Example: `Read(file_path: 'C:\Users\globa\ai_act_compass\ai-act-compass.jsx', offset: 312, limit: 74)` for the first range.

Before pasting, **re-verify each range's start line** with this command — line numbers may have shifted by ±5 if you have unstaged work on the file:

```powershell
git grep -n "^const PROHIBITED_PRACTICES\b\|^const ANNEX_III_AREAS\b\|^const ART50_TRIGGERS\b\|^function computeCategory\b" ai-act-compass.jsx
```

Expected: four matches. If any line number differs from the table above, use the actual number when you Read.

- [ ] **Step 3b: Verify the icon dependencies that `ANNEX_III_AREAS` brings along**

Run:
```powershell
git grep -n "icon: " ai-act-compass.jsx | git grep -v "^Binary"
```

Confirm `ANNEX_III_AREAS` items reference these icons from `lucide-react`: `Eye`, `Network`, `GraduationCap`, `Briefcase`, `Stethoscope`, `Shield`, `Plane`, `Gavel`. These are real React components, so `classify.js` will need to import them — even though the test environment only invokes `computeCategory` (which never reads `.icon`), the constants still hold the references and `lucide-react` must resolve.

`lucide-react` is plain ESM (`type: "module"` in its package.json) and loads in Vitest's `node` environment without a DOM. No JSDOM needed.

- [ ] **Step 3c: Write `src/lib/classify.js`**

Create the file with this structure. The `…paste range…` placeholders are filled with the exact bytes you read in Step 3a, with one minimal edit: each top-level `const` or `function` gets `export ` prepended.

```js
// Classification logic for EU AI Act risk-tier assignment.
// Pure — no React, no DOM, no globals. Safe to run in node, edge, or browser.
// Source of truth for art. 5 / 6(1) / 6(2) + 6(3) / 50 / 51-55 decisions.
// Tested in classify.test.js — every regulatory branch has an asserting test.

import {
  Eye, Network, GraduationCap, Briefcase,
  Stethoscope, Shield, Plane, Gavel,
} from 'lucide-react';
import { t } from './i18n.js';

export const PROHIBITED_PRACTICES = [
  // …paste range L312–L385 here, dropping the leading `const PROHIBITED_PRACTICES = [`
  //  and the trailing `];` (those frame the array — keep only the 8 item objects).
];

export const ANNEX_III_AREAS = [
  // …paste range L387–L468 here, dropping the leading `const ANNEX_III_AREAS = [`
  //  and the trailing `];` (keep only the 8 item objects with their `icon:` refs).
];

export const ART50_TRIGGERS = [
  // …paste range L505–L542 here, dropping the leading `const ART50_TRIGGERS = [`
  //  and the trailing `];` (keep only the 4 item objects).
];

export function computeCategory(answers, lang) {
  // …paste the body of range L949–L1051 here, dropping the leading
  //  `function computeCategory(answers, lang) {` and the trailing `}`
  //  (keep only what's between the braces).
}
```

After the paste, sanity-check by counting items: `grep -c "^  {" src/lib/classify.js` should print **20** (8 + 8 + 4). If it prints anything else, you missed an item or grabbed an extra.

- [ ] **Step 4: Run the extraction-driver test to confirm it passes**

Run:
```powershell
npm test -- src/lib/classify.test.js
```

Expected: 5 tests passed (4 surface tests + 1 round-trip).

If `PROHIBITED_PRACTICES` length is not 8 or `ANNEX_III_AREAS` length is not 8, you missed an item during the paste — re-check the source line ranges.

- [ ] **Step 5: Wire `ai-act-compass.jsx` to import from `src/lib/classify.js`**

In `ai-act-compass.jsx`:

a) Below the existing `t` import added in Task 2, add:

```jsx
import {
  computeCategory,
  PROHIBITED_PRACTICES,
  ANNEX_III_AREAS,
  ART50_TRIGGERS,
} from './src/lib/classify.js';
```

b) Delete the inline `const PROHIBITED_PRACTICES = [...]` block (was lines 312–385).
c) Delete the inline `const ANNEX_III_AREAS = [...]` block (was lines 387–468).
d) Delete the inline `const ART50_TRIGGERS = [...]` block (was lines 505–542).
e) Delete the inline `function computeCategory(answers, lang) {...}` (was lines 949–1051).
f) Leave `ART6_EXCEPTIONS`, `ROLES`, `NATURES`, `QUICKWINS`, `CHECKLIST`, `TIMELINE`, `CATEGORIES_META`, `generateReport` untouched.

g) `ai-act-compass.jsx` no longer needs `Eye`, `Network`, `GraduationCap`, `Briefcase`, `Stethoscope`, `Shield`, `Plane`, `Gavel` from `lucide-react` **only if** those icons are not also used elsewhere in the file. Run:

```powershell
git grep -n "\bEye\b\|\bNetwork\b\|\bGraduationCap\b\|\bBriefcase\b\|\bStethoscope\b\|\bShield\b\|\bPlane\b\|\bGavel\b" ai-act-compass.jsx
```

If any match remains outside the deleted ranges, keep that icon in the `lucide-react` import list. Otherwise, prune it.

- [ ] **Step 6: Verify the dev server still works**

Run:
```powershell
npm run dev
```

Open http://localhost:5173. Click through the full wizard (Welcome → Provider → AI system → Subliminal techniques → Result). Confirm the verdict still says "Prohibited" and the justification still references art. 5(1)(a). Stop the dev server.

If the page renders blank or throws, check the browser console — most likely an undefined import (you deleted a constant that was still referenced elsewhere).

- [ ] **Step 7: Verify `npm run build` still produces a working bundle**

Run:
```powershell
npm run build
```

Expected: `dist/` written, no errors. If you see "is not exported by", an import path is wrong.

- [ ] **Step 8: Commit**

```powershell
git add src/lib/classify.js src/lib/classify.test.js ai-act-compass.jsx
git commit -m "refactor(classify): extract computeCategory + data tables to src/lib/classify.js"
```

---

## Task 4a: Article 5 — prohibited-practice tests

**Files:**
- Modify: `C:\Users\globa\ai_act_compass\src\lib\classify.test.js`

- [ ] **Step 1: Write the data-driven prohibited-practice tests**

Append this block to `src/lib/classify.test.js` (after the existing `describe` blocks):

```js
describe('art. 5 — prohibited practices', () => {
  // Data-driven: one test per item in PROHIBITED_PRACTICES so adding a new
  // prohibition automatically grows the matrix.
  PROHIBITED_PRACTICES.forEach((practice) => {
    it(`returns INTERDIT and cites ${practice.ref} when "${practice.id}" is selected`, () => {
      const result = computeCategory({ prohibitions: [practice.id] }, 'en');
      expect(result.primary).toBe('INTERDIT');
      expect(result.secondary).toBeNull();
      expect(result.justifications.some(j => j.ref === practice.ref)).toBe(true);
    });
  });

  it('short-circuits: prohibited + Annex III + art. 50 still returns INTERDIT only', () => {
    const result = computeCategory({
      prohibitions: ['a'],
      annexIII: [3, 4],          // education + employment
      art50: ['interaction'],     // chatbot trigger
      annexI: 'oui',
      nature: 'gpai',
      gpaiSystemic: 'oui',
    }, 'en');
    expect(result.primary).toBe('INTERDIT');
    expect(result.secondary).toBeNull();
    // Only the prohibition justification should be present — no Annex III,
    // no art. 50, no GPAI. The function returns early after the prohibition check.
    expect(result.justifications).toHaveLength(1);
    expect(result.justifications[0].ref).toBe('art. 5(1)(a)');
  });
});
```

- [ ] **Step 2: Run the tests**

Run:
```powershell
npm test -- src/lib/classify.test.js
```

Expected: previously-passing 5 tests + 8 prohibited tests + 1 short-circuit = **14 tests passed**.

- [ ] **Step 3: Commit**

```powershell
git add src/lib/classify.test.js
git commit -m "test(classify): art. 5 prohibited-practice matrix (8) + short-circuit"
```

---

## Task 4b: Article 6 — high-risk pathway tests

**Files:**
- Modify: `C:\Users\globa\ai_act_compass\src\lib\classify.test.js`

- [ ] **Step 1: Write the high-risk tests**

Append to `src/lib/classify.test.js`:

```js
describe('art. 6(1) — Annex I product safety pathway', () => {
  it('returns HAUT_RISQUE_ANNEXE_I when annexI === "oui"', () => {
    const result = computeCategory({ annexI: 'oui' }, 'en');
    expect(result.primary).toBe('HAUT_RISQUE_ANNEXE_I');
    expect(result.justifications.some(j => /Annex I|Annexe I/.test(j.ref))).toBe(true);
  });
});

describe('art. 6(2) — Annex III pathway (no exception)', () => {
  // Data-driven: one test per Annex III area.
  ANNEX_III_AREAS.forEach((area) => {
    it(`returns HAUT_RISQUE_ANNEXE_III for area "${area.id}"`, () => {
      const result = computeCategory({ annexIII: [area.id] }, 'en');
      expect(result.primary).toBe('HAUT_RISQUE_ANNEXE_III');
      // The area's ref must be cited (works for both en and fr forms because
      // the test calls with lang='en' which resolves the en variant).
      expect(result.justifications.some(j => j.ref === t(area.ref, 'en'))).toBe(true);
    });
  });
});

describe('art. 6(3) — derogations', () => {
  it('keeps high-risk when exceptions === ["none"]', () => {
    const result = computeCategory({
      annexIII: [3],
      exceptions: ['none'],
    }, 'en');
    expect(result.primary).toBe('HAUT_RISQUE_ANNEXE_III');
  });

  it('removes from high-risk when a substantive exception is selected', () => {
    const result = computeCategory({
      annexIII: [3],
      exceptions: ['narrow'],   // narrow procedural task
    }, 'en');
    expect(result.primary).toBe('RISQUE_MINIMAL');
    expect(result.justifications.some(j => j.ref === 'art. 6(3)')).toBe(true);
    // The Annex III area examined is still traced for audit
    expect(result.justifications.some(j => j.ref === 'Annex III §3')).toBe(true);
  });
});

describe('art. 6(3) 2nd al. — profiling override', () => {
  it('blocks the derogation when profiling === true; system stays high-risk', () => {
    const result = computeCategory({
      annexIII: [3],
      exceptions: ['narrow'],
      profiling: true,
    }, 'en');
    expect(result.primary).toBe('HAUT_RISQUE_ANNEXE_III');
    expect(result.justifications.some(j => j.ref === 'art. 6(3) 2e al.')).toBe(true);
  });
});
```

The reference to `t` requires importing it. Update the existing import block at the top of `classify.test.js`:

```js
import {
  computeCategory,
  PROHIBITED_PRACTICES,
  ANNEX_III_AREAS,
  ART50_TRIGGERS,
} from './classify.js';
import { t } from './i18n.js';
```

- [ ] **Step 2: Run the tests**

Run:
```powershell
npm test -- src/lib/classify.test.js
```

Expected: 14 previous + 1 (Annex I) + 8 (Annex III base) + 2 (derogations) + 1 (profiling override) = **26 tests passed**.

- [ ] **Step 3: Commit**

```powershell
git add src/lib/classify.test.js
git commit -m "test(classify): art. 6 high-risk pathway (Annex I + 8 Annex III + derogations + profiling)"
```

---

## Task 4c: Article 50 — transparency-trigger tests

**Files:**
- Modify: `C:\Users\globa\ai_act_compass\src\lib\classify.test.js`

- [ ] **Step 1: Write the data-driven art. 50 tests**

Append to `src/lib/classify.test.js`:

```js
describe('art. 50 — limited-risk transparency triggers', () => {
  ART50_TRIGGERS.forEach((trigger) => {
    it(`returns RISQUE_LIMITE and cites ${trigger.ref} for trigger "${trigger.id}"`, () => {
      const result = computeCategory({ art50: [trigger.id] }, 'en');
      expect(result.primary).toBe('RISQUE_LIMITE');
      expect(result.justifications.some(j => j.ref === trigger.ref)).toBe(true);
    });
  });
});
```

- [ ] **Step 2: Run the tests**

Run:
```powershell
npm test -- src/lib/classify.test.js
```

Expected: 26 previous + 4 = **30 tests passed**.

- [ ] **Step 3: Commit**

```powershell
git add src/lib/classify.test.js
git commit -m "test(classify): art. 50 transparency triggers (4)"
```

---

## Task 4d: GPAI tests (art. 51–55 + art. 25 integrator note)

**Files:**
- Modify: `C:\Users\globa\ai_act_compass\src\lib\classify.test.js`

- [ ] **Step 1: Write the GPAI tests**

Append to `src/lib/classify.test.js`:

```js
describe('art. 51-55 + art. 25 — GPAI', () => {
  it('classifies a GPAI provider without systemic risk as GPAI', () => {
    const result = computeCategory({
      nature: 'gpai',
      gpaiSystemic: 'non',
    }, 'en');
    expect(result.primary).toBe('GPAI');
  });

  it('classifies a GPAI provider with systemic risk as GPAI_RS', () => {
    const result = computeCategory({
      nature: 'gpai',
      gpaiSystemic: 'oui',
    }, 'en');
    expect(result.primary).toBe('GPAI_RS');
  });

  it('does NOT apply GPAI categories to a third-party-GPAI integrator, but adds the art. 25/53 note', () => {
    const result = computeCategory({
      nature: 'systeme_sur_gpai',
    }, 'en');
    // No GPAI category — integrator is not the model provider
    expect(result.primary).not.toBe('GPAI');
    expect(result.primary).not.toBe('GPAI_RS');
    // The art. 25 + art. 53 informational note must be present
    expect(result.justifications.some(j => j.ref === 'art. 25 + art. 53')).toBe(true);
  });
});
```

- [ ] **Step 2: Run the tests**

Run:
```powershell
npm test -- src/lib/classify.test.js
```

Expected: 30 previous + 3 = **33 tests passed**.

- [ ] **Step 3: Commit**

```powershell
git add src/lib/classify.test.js
git commit -m "test(classify): GPAI provider + GPAI-RS + third-party integrator note"
```

---

## Task 4e: Priority ordering, minimal-risk fallback, i18n parity

**Files:**
- Modify: `C:\Users\globa\ai_act_compass\src\lib\classify.test.js`

- [ ] **Step 1: Write the closing tests**

Append to `src/lib/classify.test.js`:

```js
describe('priority ordering across multiple triggers', () => {
  it('orders categories: Annex I > Annex III > GPAI_RS > GPAI > RISQUE_LIMITE', () => {
    const result = computeCategory({
      annexI: 'oui',
      annexIII: [3],
      art50: ['interaction'],
      nature: 'gpai',
      gpaiSystemic: 'oui',
    }, 'en');
    expect(result.primary).toBe('HAUT_RISQUE_ANNEXE_I');
    expect(result.secondary).toEqual([
      'HAUT_RISQUE_ANNEXE_III',
      'GPAI_RS',
      'RISQUE_LIMITE',
    ]);
  });
});

describe('RISQUE_MINIMAL fallback', () => {
  it('returns RISQUE_MINIMAL with a generic justification when no trigger fires', () => {
    const result = computeCategory({}, 'en');
    expect(result.primary).toBe('RISQUE_MINIMAL');
    expect(result.justifications).toHaveLength(1);
    expect(result.justifications[0].ref).toBe('analysis');
  });

  it('returns RISQUE_MINIMAL when high-risk is fully derogated, but preserves the Annex III + art. 6(3) trace', () => {
    const result = computeCategory({
      annexIII: [3],
      exceptions: ['narrow'],
    }, 'en');
    expect(result.primary).toBe('RISQUE_MINIMAL');
    // The fallback's generic "no trigger" justification must NOT be added
    // when prior justifications (Annex III area + art. 6(3) note) already exist.
    expect(result.justifications.some(j => j.ref === 'analysis')).toBe(false);
    expect(result.justifications.some(j => j.ref === 'Annex III §3')).toBe(true);
    expect(result.justifications.some(j => j.ref === 'art. 6(3)')).toBe(true);
  });
});

describe('i18n parity', () => {
  // computeCategory is language-independent in its CATEGORY decisions. Most
  // justification refs are language-independent strings ('art. 5(1)(a)',
  // 'art. 50(1)', etc.) — but Annex III refs are localised ('Annex III §3'
  // vs 'Annexe III §3') because they pass through t(). So we deliberately
  // pick answers whose refs are all language-independent.
  it('produces identical primary, secondary, and justification refs across en and fr (language-independent refs only)', () => {
    const answers = {
      prohibitions: [],
      annexI: 'non',
      annexIII: [],
      art50: ['interaction', 'genai_media'],
      nature: 'gpai',
      gpaiSystemic: 'oui',
    };
    const en = computeCategory(answers, 'en');
    const fr = computeCategory(answers, 'fr');
    expect(en.primary).toBe(fr.primary);
    expect(en.secondary).toEqual(fr.secondary);
    expect(en.justifications.map(j => j.ref))
      .toEqual(fr.justifications.map(j => j.ref));
    // Labels themselves differ — that's expected and not asserted here.
  });

  it('preserves category structure for Annex III paths even though refs are localised', () => {
    const answers = { annexIII: [3] };
    const en = computeCategory(answers, 'en');
    const fr = computeCategory(answers, 'fr');
    expect(en.primary).toBe(fr.primary);
    expect(en.secondary).toEqual(fr.secondary);
    expect(en.justifications).toHaveLength(fr.justifications.length);
    // Refs differ across languages here ('Annex III §3' vs 'Annexe III §3') —
    // that's by design, so we only assert structural parity, not ref equality.
  });
});
```

- [ ] **Step 2: Run the tests**

Run:
```powershell
npm test -- src/lib/classify.test.js
```

Expected: 33 previous + 1 (priority) + 2 (minimal fallback) + 2 (i18n parity) = **38 tests passed**.

(Spec estimated 28–35; actual is 38 because the surface tests in Task 3 added 4 cardinality assertions and the i18n cluster has 2 tests instead of 1 — one for language-independent refs, one for structural parity on localised-ref paths. That is the right kind of overshoot.)

- [ ] **Step 3: Commit**

```powershell
git add src/lib/classify.test.js
git commit -m "test(classify): priority ordering + minimal-risk fallback + i18n parity"
```

---

## Task 5: Coverage check + final verification + push

**Files:** none modified — verification only.

- [ ] **Step 1: Run the full suite with coverage**

Run:
```powershell
npm run test:coverage
```

Expected:
- All 7 i18n tests + 38 classify tests = **45 tests passed**.
- Coverage table prints. For `src/lib/classify.js`, `% Lines` ≥ 95 and `% Branches` ≥ 90. For `src/lib/i18n.js`, `% Lines` = 100.

If a branch is uncovered, the coverage report names the line (e.g. `Uncovered Line #s`). Common gaps to expect: none — the matrix is built to hit every branch.

If coverage is below the bar, identify the uncovered branch from the report and add a targeted test before continuing.

- [ ] **Step 2: Confirm dev server still works**

Run:
```powershell
npm run dev
```

Open http://localhost:5173 and walk the full wizard once: Welcome → Provider → AI system → Subliminal techniques (art. 5) → Verdict. Confirm:
- Verdict reads "Prohibited" / "Pratique interdite" depending on language toggle
- Justification references art. 5(1)(a)
- The 30-day quickwins, checklist, and timeline panels still render

Stop the dev server with Ctrl+C.

- [ ] **Step 3: Confirm the production build still works**

Run:
```powershell
npm run build
```

Expected: `dist/` produced, no errors, bundle size unchanged within ±5% of the pre-extraction baseline.

- [ ] **Step 4: Push the branch**

Run:
```powershell
git push
```

Expected: `feat/vitest-classify-extract` updated on origin with 8 new commits (1 Vitest setup + 1 i18n extract + 1 classify extract + 5 test-matrix commits).

- [ ] **Step 5: Open the PR**

Run:
```powershell
gh pr create --base main --head feat/vitest-classify-extract --title "feat(test): Vitest + extract computeCategory to src/lib/" --body @- <<'EOF'
## Summary

Adds Vitest as the unit-test runner and extracts the AI Act classification logic
(`computeCategory` + the 3 data tables it consumes + the `t()` i18n helper) from
the 2,812-line `ai-act-compass.jsx` into focused `src/lib/` modules.

The extraction is **behaviour-preserving** — no logic was changed, only moved.
The wizard, build, and Docker image still work identically.

## What changed

- `src/lib/i18n.js` — new, exports `t(val, lang)` (7 tests)
- `src/lib/classify.js` — new, exports `computeCategory` + `PROHIBITED_PRACTICES`
  + `ANNEX_III_AREAS` + `ART50_TRIGGERS` (38 tests)
- `vitest.config.js` — new, node env, v8 coverage, scoped to `src/**/*.test.js`
- `package.json` — adds `vitest` + `@vitest/coverage-v8` devDeps and 3 scripts
- `ai-act-compass.jsx` — ~250 lines lighter, now imports from `src/lib/`
- `.gitignore` — ignores `coverage/`

## Test matrix

45 tests organised by EU AI Act article cluster:

| Cluster | Tests |
|---|---|
| `t()` i18n resolver | 7 |
| Module surface (export shape, cardinality) | 5 |
| Art. 5 prohibited (1 per item + short-circuit) | 9 |
| Art. 6(1) Annex I | 1 |
| Art. 6(2) Annex III base (1 per item) | 8 |
| Art. 6(3) derogations | 2 |
| Art. 6(3) 2nd al. profiling override | 1 |
| Art. 50 transparency triggers | 4 |
| GPAI (provider, GPAI-RS, third-party integrator) | 3 |
| Priority ordering across triggers | 1 |
| RISQUE_MINIMAL fallback | 2 |
| i18n parity (language-independent refs + structural parity) | 2 |

Coverage of `src/lib/classify.js`: ≥ 95% lines, ≥ 90% branches.

## Out of scope (parking-lot follow-ups)

- Extracting `generateReport` and the content data tables
- Playwright e2e smoke for the wizard (separate branch, will use the
  newly installed `playwright-best-practices` skill)
- CI workflow + coverage badge

Spec: `docs/superpowers/specs/2026-05-10-vitest-classify-extract-design.md`
Plan: `docs/superpowers/plans/2026-05-10-vitest-classify-extract.md`

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
```

If `gh` is not authenticated, the command will print the authentication URL — follow it, then re-run the command.

---

## Done. Summary of artifacts produced

After Task 5:

- 8 commits on `feat/vitest-classify-extract` (spec already committed pre-plan)
- 5 new files: `vitest.config.js`, `src/lib/i18n.js`, `src/lib/i18n.test.js`, `src/lib/classify.js`, `src/lib/classify.test.js`
- 1 modified: `ai-act-compass.jsx` (~250 lines lighter)
- 1 modified: `package.json` (3 new scripts, 2 new devDeps)
- 1 modified: `.gitignore` (1 entry)
- 45 unit tests, all passing, ≥ 95% line coverage of `src/lib/classify.js`
- 1 PR open against `main`
