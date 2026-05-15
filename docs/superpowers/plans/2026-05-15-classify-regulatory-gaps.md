# Classify.js — Regulatory Gaps Fix-Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close three regulatorily-significant gaps in `src/lib/classify.js` surfaced by the 2026-05-15 audit against Reg. (EU) 2024/1689 — (A) art. 5(2)–(5) carve-outs for prohibitions (h)/(f)/(g); (C) role-differentiated FRIA applicability per art. 27; (D) art. 25 substantial-modification provider-flip for third-party-GPAI integrators.

**Architecture:** All three fixes extend the existing pure-function `computeCategory(answers, lang)` and add a new pure function `computeRoleNotes(answers, role, lang)`. No new dependencies. The `answers` object gains three optional fields (`prohibitionCarveOuts`, `substantialModification`, and the already-captured `role` consumed in the new function). Tests follow the existing Vitest data-driven pattern in `classify.test.js`. UI changes in `ai-act-compass.jsx` are limited to (i) initial-state defaults for new answer fields, (ii) follow-up question blocks for carve-outs and substantial-modification, and (iii) gating the FRIA quickwin in `QUICKWINS.HAUT_RISQUE_ANNEXE_III` behind the new applicability function.

**Tech Stack:** JavaScript (no TypeScript), Vitest 1.x, React 18, Vite. Pure functional classifier — no DOM/network/globals.

---

## File Structure

| File | Responsibility | Change |
|---|---|---|
| `src/lib/classify.js` | Tier classification + role-scoped notes (pure) | **Modify** — extend `computeCategory`; add `computeRoleNotes` + new exported constants `ART5_CARVEOUTS`, `FRIA_ANNEX_III_TRIGGERS` |
| `src/lib/classify.test.js` | Vitest data-driven test surface | **Modify** — add 3 new `describe` blocks |
| `ai-act-compass.jsx` | UI + answers state + QUICKWINS gating | **Modify** — (i) initial-state lines 2154–2156 & 2178–2179; (ii) Step 3 (prohibitions) follow-up; (iii) Step 2 (nature) substantial-modification follow-up; (iv) FRIA quickwin gating in `QUICKWINS.HAUT_RISQUE_ANNEXE_III` assembly |

The classifier stays the single source of truth: UI never re-implements regulation logic — it only renders inputs and consumes the result of `computeCategory` + `computeRoleNotes`.

---

## Feature A — Article 5 carve-outs (audit finding A)

**Regulatory basis:**
- art. 5(2)–(5) — law-enforcement exception to art. 5(1)(h) real-time remote biometric ID (judicial/admin authorisation + FRIA + Annex VI registration; offences in Annex II)
- art. 5(1)(f) parenthetical — medical or safety carve-out to workplace/education emotion recognition
- art. 5(1)(g) parenthetical — law-enforcement carve-out to biometric categorisation of sensitive attributes

**Design:** add an optional `answers.prohibitionCarveOuts: { h?: boolean, f?: boolean, g?: boolean }`. When a carve-out is claimed for a selected prohibition, that prohibition is **removed from the INTERDIT short-circuit**. If every selected prohibition has a carve-out, classification continues down the Annex I/III/50/GPAI tree. The classifier emits a justification entry per claimed carve-out, citing the carve-out article — but does **not** auto-reclassify to high-risk; that determination follows from the downstream Annex III §1 selection the user makes separately. Counsel/notified-body verification is flagged in the justification text.

---

### Task A1: Export `ART5_CARVEOUTS` metadata + carve-out filtering in `computeCategory`

**Files:**
- Modify: `src/lib/classify.js` (top of file, after `PROHIBITED_PRACTICES`; inside `computeCategory` at lines 213–219)
- Test: `src/lib/classify.test.js`

- [ ] **Step 1: Write failing tests for `ART5_CARVEOUTS` export and carve-out filtering**

Append to `src/lib/classify.test.js`:

```js
import { ART5_CARVEOUTS } from './classify.js';

describe('ART5_CARVEOUTS — exported metadata', () => {
  it('exports exactly 3 carve-outs (h, f, g) with correct article refs', () => {
    expect(ART5_CARVEOUTS).toHaveLength(3);
    const byId = Object.fromEntries(ART5_CARVEOUTS.map(c => [c.id, c]));
    expect(byId.h.ref).toBe('art. 5(2)-(3)');
    expect(byId.f.ref).toBe('art. 5(1)(f) parenthetical');
    expect(byId.g.ref).toBe('art. 5(1)(g) parenthetical');
  });
});

describe('art. 5 carve-outs — INTERDIT filtering', () => {
  it('returns INTERDIT when carve-out is claimed but prohibition (h) has no carveOut flag', () => {
    const result = computeCategory({ prohibitions: ['h'] }, 'en');
    expect(result.primary).toBe('INTERDIT');
  });

  it('removes prohibition (h) from INTERDIT when prohibitionCarveOuts.h === true', () => {
    const result = computeCategory({
      prohibitions: ['h'],
      prohibitionCarveOuts: { h: true },
    }, 'en');
    expect(result.primary).not.toBe('INTERDIT');
    // Carve-out justification must be emitted
    expect(result.justifications.some(j => j.ref === 'art. 5(2)-(3)')).toBe(true);
  });

  it('keeps INTERDIT when one of two selected prohibitions has no carve-out', () => {
    const result = computeCategory({
      prohibitions: ['h', 'a'],          // a has no carve-out path
      prohibitionCarveOuts: { h: true },
    }, 'en');
    expect(result.primary).toBe('INTERDIT');
    // Only prohibition 'a' should appear in the INTERDIT justification list
    expect(result.justifications.some(j => j.ref === 'art. 5(1)(a)')).toBe(true);
    expect(result.justifications.some(j => j.ref === 'art. 5(1)(h)')).toBe(false);
  });

  it('falls through to RISQUE_MINIMAL when every selected prohibition has a carve-out', () => {
    const result = computeCategory({
      prohibitions: ['f', 'g'],
      prohibitionCarveOuts: { f: true, g: true },
    }, 'en');
    expect(result.primary).toBe('RISQUE_MINIMAL');
    expect(result.justifications.some(j => j.ref === 'art. 5(1)(f) parenthetical')).toBe(true);
    expect(result.justifications.some(j => j.ref === 'art. 5(1)(g) parenthetical')).toBe(true);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/lib/classify.test.js`
Expected: 4 new tests fail with `ART5_CARVEOUTS is not exported` and "Expected ... not to be 'INTERDIT'".

- [ ] **Step 3: Export `ART5_CARVEOUTS` constant**

Insert in `src/lib/classify.js` immediately after the `PROHIBITED_PRACTICES` array (line 85):

```js
export const ART5_CARVEOUTS = [
  {
    id: 'h',
    appliesTo: 'h',
    ref: 'art. 5(2)-(3)',
    label: {
      en: 'Real-time RBI — law enforcement exception',
      fr: 'IBR temps réel — exception forces de l\'ordre',
    },
    desc: {
      en: 'Use is strictly necessary for: (i) targeted search for victims (abduction, trafficking, sexual exploitation) or missing persons; (ii) prevention of specific substantial/imminent threat to life or terrorist attack; (iii) localisation/identification of suspects of Annex II offences punishable by ≥4-year custodial sentence. Requires prior judicial/administrative authorisation + FRIA + Annex VI registration. Counsel verification required.',
      fr: 'Usage strictement nécessaire à : (i) recherche ciblée de victimes (enlèvement, traite, exploitation sexuelle) ou personnes disparues ; (ii) prévention d\'une menace grave et imminente pour la vie ou d\'un acte terroriste ; (iii) localisation/identification de suspects d\'infractions Annexe II passibles d\'une peine ≥ 4 ans. Autorisation judiciaire/administrative préalable + FRIA + enregistrement Annexe VI requis. Vérification juridique requise.',
    },
  },
  {
    id: 'f',
    appliesTo: 'f',
    ref: 'art. 5(1)(f) parenthetical',
    label: {
      en: 'Emotion recognition — medical or safety carve-out',
      fr: 'Reconnaissance émotionnelle — exception médicale ou de sécurité',
    },
    desc: {
      en: 'Workplace/education emotion recognition is not prohibited if intended to be put in place or into the market strictly for medical or safety reasons. Counsel verification required.',
      fr: 'La reconnaissance émotionnelle au travail/en éducation n\'est pas interdite si destinée à être mise en place ou sur le marché strictement pour des raisons médicales ou de sécurité. Vérification juridique requise.',
    },
  },
  {
    id: 'g',
    appliesTo: 'g',
    ref: 'art. 5(1)(g) parenthetical',
    label: {
      en: 'Biometric categorisation — law enforcement / legally acquired dataset',
      fr: 'Catégorisation biométrique — forces de l\'ordre / jeu légalement acquis',
    },
    desc: {
      en: 'Biometric categorisation of sensitive attributes is not prohibited where labelling/filtering of legally acquired biometric datasets is performed in the area of law enforcement. Counsel verification required.',
      fr: 'La catégorisation biométrique d\'attributs sensibles n\'est pas interdite lorsque l\'étiquetage/filtrage de jeux biométriques légalement acquis est effectué dans le cadre de l\'application de la loi. Vérification juridique requise.',
    },
  },
];
```

- [ ] **Step 4: Modify the INTERDIT branch to filter by claimed carve-outs**

In `src/lib/classify.js`, replace the existing block at lines 213–219:

```js
  if (answers.prohibitions && answers.prohibitions.length > 0) {
    answers.prohibitions.forEach(id => {
      const p = PROHIBITED_PRACTICES.find(x => x.id === id);
      justifications.push({ ref: p.ref, label: t(p.label, lang) });
    });
    return { primary: 'INTERDIT', secondary: null, justifications };
  }
```

with:

```js
  if (answers.prohibitions && answers.prohibitions.length > 0) {
    const carveOuts = answers.prohibitionCarveOuts || {};
    const interdictedRefs = [];
    const carvedOutRefs = [];
    answers.prohibitions.forEach(id => {
      const p = PROHIBITED_PRACTICES.find(x => x.id === id);
      if (carveOuts[id]) {
        const co = ART5_CARVEOUTS.find(c => c.appliesTo === id);
        if (co) carvedOutRefs.push({ ref: co.ref, label: t(co.label, lang) });
      } else {
        interdictedRefs.push({ ref: p.ref, label: t(p.label, lang) });
      }
    });
    if (interdictedRefs.length > 0) {
      // At least one un-carved-out prohibition remains → still INTERDIT.
      return { primary: 'INTERDIT', secondary: null, justifications: interdictedRefs };
    }
    // Every selected prohibition has a claimed carve-out → fall through to the
    // rest of the classification tree, preserving the carve-out trace.
    carvedOutRefs.forEach(j => justifications.push(j));
  }
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run src/lib/classify.test.js`
Expected: all carve-out tests pass; pre-existing tests still pass (the carve-out path is opt-in).

- [ ] **Step 6: Commit**

```bash
git add src/lib/classify.js src/lib/classify.test.js
git commit -m "feat(classify): model art. 5(2)-(5) + 5(1)(f)/(g) carve-outs"
```

---

### Task A2: UI — surface carve-out follow-up after Step 3 (prohibitions)

**Files:**
- Modify: `ai-act-compass.jsx` (initial-state at lines 2154–2157 + 2178–2179; Step 3 block around lines 2276–2310)

- [ ] **Step 1: Add `prohibitionCarveOuts` to initial state and reset**

In `ai-act-compass.jsx`, replace the `useState` initialiser at lines 2154–2157:

```js
  const [answers, setAnswers] = useState({
    role: null, nature: null, prohibitions: null, annexI: null,
    annexIII: [], exceptions: null, profiling: false, art50: [], gpaiSystemic: null,
  });
```

with:

```js
  const [answers, setAnswers] = useState({
    role: null, nature: null, prohibitions: null, prohibitionCarveOuts: {}, annexI: null,
    annexIII: [], exceptions: null, profiling: false, art50: [], gpaiSystemic: null,
  });
```

And apply the same change to the `restart` reset object at lines 2177–2180.

- [ ] **Step 2: Add the carve-out import and UI block**

Add `ART5_CARVEOUTS` to the existing import from `./src/lib/classify.js` near line 10 (the file already imports `computeCategory` from there).

In the Step 3 (prohibitions) block, after the prohibitions list and before the `canNext` evaluation, render a follow-up block that maps over `ART5_CARVEOUTS` filtered by `(answers.prohibitions || []).includes(c.appliesTo)`. Each carve-out is an `OptionCard` that toggles `answers.prohibitionCarveOuts[c.id]`. Reuse the existing `OptionCard` component (used at lines 2316–2326). Don't change `canNext` — a user may decline a carve-out and proceed to INTERDIT.

Concrete insertion (paste before the existing prohibition `OptionCard` mapping ends in the Step 3 block):

```jsx
{(answers.prohibitions || []).some(id => ART5_CARVEOUTS.some(c => c.appliesTo === id)) && (
  <div className="mt-6 space-y-2">
    <div className="text-sm uppercase tracking-wider opacity-60">
      {lang === 'en' ? 'Article 5 carve-outs (optional)' : 'Exceptions article 5 (facultatives)'}
    </div>
    {ART5_CARVEOUTS
      .filter(c => (answers.prohibitions || []).includes(c.appliesTo))
      .map(c => (
        <OptionCard
          key={`carveout-${c.id}`}
          selected={!!(answers.prohibitionCarveOuts || {})[c.id]}
          onClick={() => setAnswers({
            ...answers,
            prohibitionCarveOuts: {
              ...(answers.prohibitionCarveOuts || {}),
              [c.id]: !((answers.prohibitionCarveOuts || {})[c.id]),
            },
          })}
          title={t(c.label, lang)}
          sub={c.ref}
          desc={t(c.desc, lang)}
        />
      ))}
  </div>
)}
```

- [ ] **Step 3: Manual smoke-check + commit**

Run: `npm run dev` and walk through Step 3 selecting prohibition (h), claiming the carve-out, advancing — verdict should not be INTERDIT.

Run: `npx vitest run` — full suite still green.

```bash
git add ai-act-compass.jsx
git commit -m "feat(ui): surface art. 5 carve-out claims after prohibitions step"
```

---

## Feature C — Role-differentiated FRIA applicability (audit finding C)

**Regulatory basis:** art. 27(1) — FRIA binds **deployers only**, and only when (a) the deployer is a body governed by public law / private entity providing public services and the system falls under Annex III (excluding §2 critical infrastructure); OR (b) the system is an Annex III §5(b) credit-scoring or §5(c) life/health-insurance high-risk system, regardless of public-vs-private status.

**Design:** add a pure function `computeRoleNotes(answers, role, lang)` returning `{ friaRequired: boolean, friaReason: { ref, label }, ... }`. Consumed by UI to gate the FRIA quickwin in `QUICKWINS.HAUT_RISQUE_ANNEXE_III`.

The `role` field is already captured in `answers.role` (see line 2155). It carries values `'provider' | 'deployer' | 'importer' | 'distributor' | 'authRep'` (verify the exact enum in the existing UI). We additionally need a refinement of `deployer` into `public_body | private_public_service | private_other`. Introduce a new optional answer field `deployerKind` captured only when `role === 'deployer'`.

---

### Task C1: Add `computeRoleNotes` + FRIA applicability logic

**Files:**
- Modify: `src/lib/classify.js`
- Modify: `src/lib/classify.test.js`

- [ ] **Step 1: Write failing tests for FRIA applicability matrix**

Append to `src/lib/classify.test.js`:

```js
import { computeRoleNotes } from './classify.js';

describe('computeRoleNotes — art. 27 FRIA applicability', () => {
  const annexIII_3 = { annexIII: [3] };           // education
  const annexIII_5 = { annexIII: [5] };           // essential services (5(b) credit / 5(c) insurance live here)
  const annexIII_2 = { annexIII: [2] };           // critical infrastructure — excluded from FRIA

  it('returns friaRequired=false for a provider regardless of tier', () => {
    const notes = computeRoleNotes(annexIII_3, 'provider', 'en');
    expect(notes.friaRequired).toBe(false);
  });

  it('returns friaRequired=true for a public-body deployer of Annex III §3', () => {
    const notes = computeRoleNotes(
      { ...annexIII_3, deployerKind: 'public_body' },
      'deployer',
      'en',
    );
    expect(notes.friaRequired).toBe(true);
    expect(notes.friaReason.ref).toBe('art. 27(1)(a)');
  });

  it('returns friaRequired=true for a private-public-service deployer of Annex III §3', () => {
    const notes = computeRoleNotes(
      { ...annexIII_3, deployerKind: 'private_public_service' },
      'deployer',
      'en',
    );
    expect(notes.friaRequired).toBe(true);
    expect(notes.friaReason.ref).toBe('art. 27(1)(a)');
  });

  it('returns friaRequired=false for a public-body deployer of Annex III §2 (critical infrastructure)', () => {
    const notes = computeRoleNotes(
      { ...annexIII_2, deployerKind: 'public_body' },
      'deployer',
      'en',
    );
    expect(notes.friaRequired).toBe(false);
  });

  it('returns friaRequired=true for any deployer of Annex III §5 (credit/insurance pathway)', () => {
    const notes = computeRoleNotes(
      { ...annexIII_5, deployerKind: 'private_other' },
      'deployer',
      'en',
    );
    expect(notes.friaRequired).toBe(true);
    expect(notes.friaReason.ref).toBe('art. 27(1)(b)');
  });

  it('returns friaRequired=false when system is not high-risk (no Annex III selected)', () => {
    const notes = computeRoleNotes(
      { annexIII: [], deployerKind: 'public_body' },
      'deployer',
      'en',
    );
    expect(notes.friaRequired).toBe(false);
  });

  it('emits a French label when lang === "fr"', () => {
    const notes = computeRoleNotes(
      { annexIII: [5], deployerKind: 'private_other' },
      'deployer',
      'fr',
    );
    expect(notes.friaRequired).toBe(true);
    expect(notes.friaReason.label).toMatch(/FRIA|évaluation d'impact/i);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/lib/classify.test.js`
Expected: 7 new tests fail with `computeRoleNotes is not exported`.

- [ ] **Step 3: Implement `computeRoleNotes`**

Append to `src/lib/classify.js` after `computeCategory` (after line 311):

```js
// art. 27(1) FRIA applicability — pure, side-effect-free.
// Returns { friaRequired: boolean, friaReason: { ref, label } | null }.
//
// FRIA binds DEPLOYERS only, when EITHER:
//   (a) the deployer is a body governed by public law, or a private entity
//       providing public services, AND the system falls under Annex III
//       (excluding §2 critical infrastructure), OR
//   (b) the system is an Annex III §5(b) credit-scoring or §5(c) life/health
//       insurance system, regardless of deployer kind.
export function computeRoleNotes(answers, role, lang) {
  const friaA = lang === 'en'
    ? 'FRIA required before first use (deployer is public body / private provider of public services and system is Annex III other than §2).'
    : 'FRIA requise avant première utilisation (déployeur public ou privé chargé d\'un service public, et système Annexe III hors §2).';
  const friaB = lang === 'en'
    ? 'FRIA required before first use (Annex III §5 credit-scoring or life/health-insurance pathway — applies regardless of deployer kind).'
    : 'FRIA requise avant première utilisation (Annexe III §5 — scoring de crédit ou tarification vie/santé — applicable quel que soit le type de déployeur).';

  if (role !== 'deployer') return { friaRequired: false, friaReason: null };

  const areas = answers.annexIII || [];
  const inAnnexIIIOtherThan2 = areas.some(id => id !== 2 && id >= 1 && id <= 8);
  const inAnnexIII5 = areas.includes(5);

  // Path (b) is checked first — it overrides deployer-kind filtering.
  if (inAnnexIII5) {
    return { friaRequired: true, friaReason: { ref: 'art. 27(1)(b)', label: friaB } };
  }

  const kind = answers.deployerKind;
  const isPublicLike = kind === 'public_body' || kind === 'private_public_service';
  if (isPublicLike && inAnnexIIIOtherThan2) {
    return { friaRequired: true, friaReason: { ref: 'art. 27(1)(a)', label: friaA } };
  }

  return { friaRequired: false, friaReason: null };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/lib/classify.test.js`
Expected: all 7 new tests pass; existing tests still green.

- [ ] **Step 5: Commit**

```bash
git add src/lib/classify.js src/lib/classify.test.js
git commit -m "feat(classify): add computeRoleNotes for art. 27 FRIA gating"
```

---

### Task C2: UI — gate FRIA quickwin behind `computeRoleNotes`

**Files:**
- Modify: `ai-act-compass.jsx` (FRIA item in `QUICKWINS.HAUT_RISQUE_ANNEXE_III` around lines 405–410; initial state lines 2154–2156)

- [ ] **Step 1: Add `deployerKind` to initial state**

In `ai-act-compass.jsx`, replace the `useState` and `restart` answer objects updated in Task A2 with one additional field `deployerKind: null`:

```js
{
  role: null, nature: null, prohibitions: null, prohibitionCarveOuts: {}, annexI: null,
  annexIII: [], exceptions: null, profiling: false, art50: [], gpaiSystemic: null,
  deployerKind: null,
}
```

- [ ] **Step 2: Add a deployer-kind sub-question to the role step**

Locate the existing role-selection block (search for `answers.role` assignments — likely Step 1). After the role is set to `'deployer'`, render three `OptionCard`s for `deployerKind`: `public_body`, `private_public_service`, `private_other`, with EN/FR labels:

```jsx
{answers.role === 'deployer' && (
  <div className="mt-4 space-y-2">
    <div className="text-sm uppercase tracking-wider opacity-60">
      {lang === 'en' ? 'Deployer kind (art. 27 gating)' : 'Type de déployeur (gating art. 27)'}
    </div>
    <OptionCard
      selected={answers.deployerKind === 'public_body'}
      onClick={() => setAnswers({ ...answers, deployerKind: 'public_body' })}
      title={lang === 'en' ? 'Body governed by public law' : 'Organisme de droit public'}
      desc={lang === 'en' ? 'Public administration, public agency, state-owned entity.' : 'Administration publique, agence publique, entité étatique.'}
    />
    <OptionCard
      selected={answers.deployerKind === 'private_public_service'}
      onClick={() => setAnswers({ ...answers, deployerKind: 'private_public_service' })}
      title={lang === 'en' ? 'Private entity providing public services' : 'Entité privée fournissant un service public'}
      desc={lang === 'en' ? 'Operator of public service under delegation/concession.' : 'Opérateur de service public en délégation/concession.'}
    />
    <OptionCard
      selected={answers.deployerKind === 'private_other'}
      onClick={() => setAnswers({ ...answers, deployerKind: 'private_other' })}
      title={lang === 'en' ? 'Other private deployer' : 'Autre déployeur privé'}
      desc={lang === 'en' ? 'No public-service mandate.' : 'Sans mission de service public.'}
    />
  </div>
)}
```

- [ ] **Step 3: Import and call `computeRoleNotes`**

Update the import from `./src/lib/classify.js` to include `computeRoleNotes`.
Add near line 2174:

```js
const roleNotes = useMemo(
  () => computeRoleNotes(answers, answers.role, lang),
  [answers, lang],
);
```

- [ ] **Step 4: Gate the FRIA quickwin**

Locate the FRIA item in `QUICKWINS.HAUT_RISQUE_ANNEXE_III` (lines 405–410). The quickwins for the active category are likely accessed via `QUICKWINS[result.primary]` somewhere in the render. Wrap the rendering of the FRIA item behind `roleNotes.friaRequired` — for example, when mapping over the quickwins array, filter out items whose `ref` includes `'art. 27'` if `!roleNotes.friaRequired`.

Concrete: find the line that maps `QUICKWINS[result.primary]` to UI; replace with:

```js
QUICKWINS[result.primary]
  .filter(item => !(item.refs || []).some(r => (typeof r === 'string' ? r : '') === 'art. 27') || roleNotes.friaRequired)
```

If FRIA is required, also surface `roleNotes.friaReason.label` near the FRIA item to explain why it applies.

- [ ] **Step 5: Manual smoke-check + commit**

Run: `npm run dev`. Flow A: provider + Annex III §3 → FRIA quickwin should be hidden. Flow B: deployer (public_body) + Annex III §3 → FRIA quickwin visible with art. 27(1)(a) reason. Flow C: deployer (private_other) + Annex III §5 → FRIA visible with art. 27(1)(b) reason.

Run: `npx vitest run` — all green.

```bash
git add ai-act-compass.jsx
git commit -m "feat(ui): gate art. 27 FRIA quickwin by role + deployerKind + Annex III area"
```

---

## Feature D — art. 25 substantial-modification provider-flip (audit finding D)

**Regulatory basis:** art. 25 — fine-tuning, retraining, or repurposing a third-party GPAI model in a way that constitutes substantial modification flips the integrator into a provider (for the modified system / model). Recitals 84 + 109 inform the threshold.

**Design:** when `answers.nature === 'systeme_sur_gpai'` AND `answers.substantialModification === 'oui'`, treat the integrator as a GPAI provider — push `GPAI` (or `GPAI_RS` per `gpaiSystemic`) into `categories` and replace the informational integrator note with an art. 25 flip note.

---

### Task D1: Provider-flip in `computeCategory`

**Files:**
- Modify: `src/lib/classify.js` (block at lines 281–293)
- Modify: `src/lib/classify.test.js`

- [ ] **Step 1: Write failing tests for the art. 25 flip**

Append to `src/lib/classify.test.js`:

```js
describe('art. 25 — substantial-modification provider flip', () => {
  it('keeps the integrator note when substantialModification is unset', () => {
    const result = computeCategory({ nature: 'systeme_sur_gpai' }, 'en');
    expect(result.primary).not.toBe('GPAI');
    expect(result.justifications.some(j => j.ref === 'art. 25 + art. 53')).toBe(true);
  });

  it('keeps the integrator note when substantialModification === "non"', () => {
    const result = computeCategory({
      nature: 'systeme_sur_gpai',
      substantialModification: 'non',
    }, 'en');
    expect(result.primary).not.toBe('GPAI');
    expect(result.justifications.some(j => j.ref === 'art. 25 + art. 53')).toBe(true);
  });

  it('flips to GPAI when substantialModification === "oui" and gpaiSystemic !== "oui"', () => {
    const result = computeCategory({
      nature: 'systeme_sur_gpai',
      substantialModification: 'oui',
    }, 'en');
    expect(result.primary).toBe('GPAI');
    expect(result.justifications.some(j => j.ref === 'art. 25')).toBe(true);
  });

  it('flips to GPAI_RS when substantialModification === "oui" and gpaiSystemic === "oui"', () => {
    const result = computeCategory({
      nature: 'systeme_sur_gpai',
      substantialModification: 'oui',
      gpaiSystemic: 'oui',
    }, 'en');
    expect(result.primary).toBe('GPAI_RS');
    expect(result.justifications.some(j => j.ref === 'art. 25')).toBe(true);
  });

  it('emits a French art. 25 flip label when lang === "fr"', () => {
    const result = computeCategory({
      nature: 'systeme_sur_gpai',
      substantialModification: 'oui',
    }, 'fr');
    const flip = result.justifications.find(j => j.ref === 'art. 25');
    expect(flip).toBeDefined();
    expect(flip.label).toMatch(/modification substantielle/i);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/lib/classify.test.js`
Expected: 5 new tests fail — 3 of them on the `'GPAI' / 'GPAI_RS'` flip assertions, 2 (the keep-note cases) may already pass.

- [ ] **Step 3: Implement the flip**

In `src/lib/classify.js`, replace the existing block at lines 281–293:

```js
  if (isGPAIProvider) {
    if (isGPAI_RS) categories.push('GPAI_RS');
    else categories.push('GPAI');
  } else if (isOnGPAI) {
    justifications.push({
      ref: 'art. 25 + art. 53',
      label: lang === 'en'
        ? 'System integrates a third-party GPAI model — GPAI obligations (art. 53–55) bind the model provider, not the integrator (unless substantial modification under art. 25 triggers a provider flip).'
        : 'Système intégrant un modèle GPAI tiers — les obligations GPAI (art. 53–55) pèsent sur le fournisseur du modèle, pas sur l\'intégrateur (sauf modification substantielle art. 25 requalifiant en provider).',
    });
  }
```

with:

```js
  const flipsViaArt25 = isOnGPAI && answers.substantialModification === 'oui';
  if (isGPAIProvider || flipsViaArt25) {
    if (isGPAI_RS) categories.push('GPAI_RS');
    else categories.push('GPAI');
    if (flipsViaArt25) {
      justifications.push({
        ref: 'art. 25',
        label: lang === 'en'
          ? 'Substantial modification of a third-party GPAI model — integrator is requalified as a provider; GPAI obligations (art. 53–55) now apply.'
          : 'Modification substantielle d\'un modèle GPAI tiers — l\'intégrateur est requalifié en provider ; les obligations GPAI (art. 53–55) s\'appliquent désormais.',
      });
    }
  } else if (isOnGPAI) {
    justifications.push({
      ref: 'art. 25 + art. 53',
      label: lang === 'en'
        ? 'System integrates a third-party GPAI model — GPAI obligations (art. 53–55) bind the model provider, not the integrator (unless substantial modification under art. 25 triggers a provider flip).'
        : 'Système intégrant un modèle GPAI tiers — les obligations GPAI (art. 53–55) pèsent sur le fournisseur du modèle, pas sur l\'intégrateur (sauf modification substantielle art. 25 requalifiant en provider).',
    });
  }
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/lib/classify.test.js`
Expected: all 5 new tests pass; existing `art. 51-55 + art. 25 — GPAI` tests still pass.

- [ ] **Step 5: Commit**

```bash
git add src/lib/classify.js src/lib/classify.test.js
git commit -m "feat(classify): art. 25 provider-flip for substantially-modified integrators"
```

---

### Task D2: UI — add substantial-modification follow-up

**Files:**
- Modify: `ai-act-compass.jsx` (initial-state updated in C2; the nature step block — search for `nature: 'systeme_sur_gpai'`)

- [ ] **Step 1: Add `substantialModification: null` to initial state and reset**

In `ai-act-compass.jsx`, extend the `useState` initialiser and `restart` reset object from Task C2 by appending `substantialModification: null`:

```js
{
  role: null, nature: null, prohibitions: null, prohibitionCarveOuts: {}, annexI: null,
  annexIII: [], exceptions: null, profiling: false, art50: [], gpaiSystemic: null,
  deployerKind: null, substantialModification: null,
}
```

- [ ] **Step 2: Render the follow-up after the nature selection**

Locate the nature-selection block (Step 2 — search for `answers.nature === n.id` near line 2260). Immediately after the `OptionCard` mapping that sets `answers.nature`, conditionally render:

```jsx
{answers.nature === 'systeme_sur_gpai' && (
  <div className="mt-6 space-y-2">
    <div className="text-sm uppercase tracking-wider opacity-60">
      {lang === 'en' ? 'Substantial modification (art. 25)' : 'Modification substantielle (art. 25)'}
    </div>
    <div className="text-xs opacity-70">
      {lang === 'en'
        ? 'Have you fine-tuned, retrained, or repurposed the third-party model in a way that materially changes its intended purpose or affects its compliance? (See recitals 84, 109.)'
        : 'Avez-vous fine-tuné, réentraîné ou repurposé le modèle tiers d\'une manière qui modifie matériellement sa finalité ou affecte sa conformité ? (Cf. considérants 84, 109.)'}
    </div>
    <OptionCard
      selected={answers.substantialModification === 'oui'}
      onClick={() => setAnswers({ ...answers, substantialModification: 'oui' })}
      title={lang === 'en' ? 'Yes — substantial modification' : 'Oui — modification substantielle'}
      sub="art. 25"
      desc={lang === 'en'
        ? 'You are flipped to GPAI provider for the modified model — art. 53–55 obligations apply.'
        : 'Vous êtes requalifié en provider GPAI pour le modèle modifié — obligations art. 53–55 applicables.'}
    />
    <OptionCard
      selected={answers.substantialModification === 'non'}
      onClick={() => setAnswers({ ...answers, substantialModification: 'non' })}
      title={lang === 'en' ? 'No — pure integration' : 'Non — intégration pure'}
      desc={lang === 'en'
        ? 'GPAI obligations remain with the upstream model provider; you operate under the AI-system regime only.'
        : 'Les obligations GPAI restent sur le fournisseur amont ; vous opérez sous le régime système IA uniquement.'}
    />
  </div>
)}
```

- [ ] **Step 3: Manual smoke-check + commit**

Run: `npm run dev`. Pick `systeme_sur_gpai` → claim substantial modification → verdict surfaces GPAI (or GPAI_RS if also `gpaiSystemic === 'oui'`) and an art. 25 flip note.

Run: `npx vitest run` — all green.

```bash
git add ai-act-compass.jsx
git commit -m "feat(ui): substantial-modification follow-up for third-party-GPAI integrators"
```

---

## Final integration check

- [ ] **Step 1: Full suite + build**

Run:

```bash
npx vitest run
npm run build
```

Expected: all tests pass; production build succeeds.

- [ ] **Step 2: End-to-end smoke (3 scenarios)**

Run `npm run dev` and walk these flows:

1. **Carve-out flow** — Provider + AI system + prohibition (h) selected + carve-out claimed → verdict is NOT INTERDIT; justification cites `art. 5(2)-(3)`.
2. **FRIA gating** — Deployer (public_body) + Annex III §3 (education) → FRIA quickwin visible with `art. 27(1)(a)` reason. Re-run as Provider → FRIA hidden.
3. **art. 25 flip** — Integrator (`systeme_sur_gpai`) + substantial modification = oui + `gpaiSystemic = oui` → primary verdict is GPAI_RS; justification cites `art. 25`.

- [ ] **Step 3: Push branch**

```bash
git push -u origin HEAD
```
