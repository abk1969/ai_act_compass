import { describe, it, expect } from 'vitest';
import {
  computeCategory,
  PROHIBITED_PRACTICES,
  ANNEX_III_AREAS,
  ART50_TRIGGERS,
  ART5_CARVEOUTS,
  computeRoleNotes,
} from './classify.js';
import { t } from './i18n.js';

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
      annexICoverage: 'oui',
      annexI3rdPartyCA: 'oui',
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

describe('art. 6(1) — Annex I product safety pathway (cumulative test)', () => {
  it('returns HAUT_RISQUE_ANNEXE_I when BOTH annexICoverage AND annexI3rdPartyCA are "oui"', () => {
    const result = computeCategory({
      annexICoverage: 'oui',
      annexI3rdPartyCA: 'oui',
    }, 'en');
    expect(result.primary).toBe('HAUT_RISQUE_ANNEXE_I');
    expect(result.justifications.some(j => /Annex I|Annexe I/.test(j.ref))).toBe(true);
  });

  it('does NOT trigger HAUT_RISQUE_ANNEXE_I when only coverage is "oui" (no 3rd-party CA)', () => {
    const result = computeCategory({
      annexICoverage: 'oui',
      annexI3rdPartyCA: 'non',
    }, 'en');
    expect(result.primary).not.toBe('HAUT_RISQUE_ANNEXE_I');
  });

  it('does NOT trigger HAUT_RISQUE_ANNEXE_I when only 3rd-party CA is "oui" (no Annex I coverage)', () => {
    const result = computeCategory({
      annexICoverage: 'non',
      annexI3rdPartyCA: 'oui',
    }, 'en');
    expect(result.primary).not.toBe('HAUT_RISQUE_ANNEXE_I');
  });

  it('does NOT trigger HAUT_RISQUE_ANNEXE_I when neither is set (defaults to null)', () => {
    const result = computeCategory({}, 'en');
    expect(result.primary).not.toBe('HAUT_RISQUE_ANNEXE_I');
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

describe('art. 50 — limited-risk transparency triggers', () => {
  ART50_TRIGGERS.forEach((trigger) => {
    it(`returns RISQUE_LIMITE and cites ${trigger.ref} for trigger "${trigger.id}"`, () => {
      const result = computeCategory({ art50: [trigger.id] }, 'en');
      expect(result.primary).toBe('RISQUE_LIMITE');
      expect(result.justifications.some(j => j.ref === trigger.ref)).toBe(true);
    });
  });
});

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

describe('priority ordering across multiple triggers', () => {
  it('orders categories: Annex I > Annex III > GPAI_RS > GPAI > RISQUE_LIMITE', () => {
    const result = computeCategory({
      annexICoverage: 'oui',
      annexI3rdPartyCA: 'oui',
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
      annexICoverage: 'non',
      annexI3rdPartyCA: 'non',
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
  it('returns INTERDIT when no carve-out is claimed for prohibition (h)', () => {
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
    expect(result.justifications).toHaveLength(2);
  });

  it('silently ignores a carve-out claimed for a prohibition with no carve-out path (e.g. "a")', () => {
    const result = computeCategory({
      prohibitions: ['a'],
      prohibitionCarveOuts: { a: true },  // 'a' has no ART5_CARVEOUTS entry
    }, 'en');
    // Carve-out is unmapped — the prohibition still lands in INTERDIT.
    expect(result.primary).toBe('INTERDIT');
    expect(result.justifications.some(j => j.ref === 'art. 5(1)(a)')).toBe(true);
  });
});

describe('French label branches — coverage for lang === "fr" ternary arms', () => {
  // These tests exercise the French side of label ternaries that the rest of
  // the matrix covers in English only. The functional decisions are identical
  // across languages; we just need to hit the fr label branches.
  it('profiling override emits the French label', () => {
    const result = computeCategory({
      annexIII: [3],
      exceptions: ['narrow'],
      profiling: true,
    }, 'fr');
    expect(result.primary).toBe('HAUT_RISQUE_ANNEXE_III');
    const profilingNote = result.justifications.find(j => j.ref === 'art. 6(3) 2e al.');
    expect(profilingNote).toBeDefined();
    expect(profilingNote.label).toMatch(/Profilage de personnes physiques/);
  });

  it('art. 6(3) derogation emits the French label', () => {
    const result = computeCategory({
      annexIII: [3],
      exceptions: ['narrow'],
    }, 'fr');
    const derogationNote = result.justifications.find(j => j.ref === 'art. 6(3)');
    expect(derogationNote).toBeDefined();
    expect(derogationNote.label).toMatch(/Exception applicable/);
    expect(derogationNote.label).toMatch(/système retiré du haut risque/);
  });

  it('third-party-GPAI integrator note emits the French label', () => {
    const result = computeCategory({ nature: 'systeme_sur_gpai' }, 'fr');
    const integratorNote = result.justifications.find(j => j.ref === 'art. 25 + art. 53');
    expect(integratorNote).toBeDefined();
    expect(integratorNote.label).toMatch(/modèle GPAI tiers/);
  });

  it('minimal-risk fallback emits the French ref + label', () => {
    const result = computeCategory({}, 'fr');
    expect(result.primary).toBe('RISQUE_MINIMAL');
    expect(result.justifications).toHaveLength(1);
    expect(result.justifications[0].ref).toBe('analyse');
    expect(result.justifications[0].label).toMatch(/Aucun déclencheur/);
  });
});

describe('computeRoleNotes — art. 27 FRIA applicability', () => {
  const annexIII_3 = { annexIII: [3] };           // education
  const annexIII_5 = { annexIII: [5] };           // essential services (5(b) credit / 5(c) insurance live here)
  const annexIII_2 = { annexIII: [2] };           // critical infrastructure — excluded from FRIA

  it('returns friaRequired=false for a provider regardless of tier', () => {
    const notes = computeRoleNotes(annexIII_3, 'fournisseur', 'en');
    expect(notes.friaRequired).toBe(false);
  });

  it('returns friaRequired=true for a public-body deployer of Annex III §3', () => {
    const notes = computeRoleNotes(
      { ...annexIII_3, deployerKind: 'public_body' },
      'deployeur',
      'en',
    );
    expect(notes.friaRequired).toBe(true);
    expect(notes.friaReason.ref).toBe('art. 27(1)(a)');
  });

  it('returns friaRequired=true for a private-public-service deployer of Annex III §3', () => {
    const notes = computeRoleNotes(
      { ...annexIII_3, deployerKind: 'private_public_service' },
      'deployeur',
      'en',
    );
    expect(notes.friaRequired).toBe(true);
    expect(notes.friaReason.ref).toBe('art. 27(1)(a)');
  });

  it('returns friaRequired=false for a public-body deployer of Annex III §2 (critical infrastructure)', () => {
    const notes = computeRoleNotes(
      { ...annexIII_2, deployerKind: 'public_body' },
      'deployeur',
      'en',
    );
    expect(notes.friaRequired).toBe(false);
  });

  it('returns friaRequired=true for any deployer of Annex III §5(b)/§5(c) (credit/insurance pathway)', () => {
    const notes = computeRoleNotes(
      { annexIII: [5], annexIII5Subitems: ['b'], deployerKind: 'private_other' },
      'deployeur',
      'en',
    );
    expect(notes.friaRequired).toBe(true);
    expect(notes.friaReason.ref).toBe('art. 27(1)(b)');
  });

  it('returns friaRequired=false when system is not high-risk (no Annex III selected)', () => {
    const notes = computeRoleNotes(
      { annexIII: [], deployerKind: 'public_body' },
      'deployeur',
      'en',
    );
    expect(notes.friaRequired).toBe(false);
  });

  it('emits a French label when lang === "fr"', () => {
    const notes = computeRoleNotes(
      { annexIII: [5], annexIII5Subitems: ['c'], deployerKind: 'private_other' },
      'deployeur',
      'fr',
    );
    expect(notes.friaRequired).toBe(true);
    expect(notes.friaReason.label).toMatch(/FRIA requise/);
  });
});

describe('Annex III §5 sub-items — art. 27(1)(b) refinement', () => {
  const subItem = (subs) => ({ annexIII: [5], annexIII5Subitems: subs });

  it('triggers art. 27(1)(b) for §5(b) credit-scoring sub-item', () => {
    const notes = computeRoleNotes(
      { ...subItem(['b']), deployerKind: 'private_other' },
      'deployeur',
      'en',
    );
    expect(notes.friaRequired).toBe(true);
    expect(notes.friaReason.ref).toBe('art. 27(1)(b)');
  });

  it('triggers art. 27(1)(b) for §5(c) life/health insurance sub-item', () => {
    const notes = computeRoleNotes(
      { ...subItem(['c']), deployerKind: 'private_other' },
      'deployeur',
      'en',
    );
    expect(notes.friaRequired).toBe(true);
    expect(notes.friaReason.ref).toBe('art. 27(1)(b)');
  });

  it('does NOT trigger art. 27(1)(b) for §5(a) public benefits alone — falls back to path (a)', () => {
    const notes = computeRoleNotes(
      { ...subItem(['a']), deployerKind: 'private_other' },
      'deployeur',
      'en',
    );
    expect(notes.friaRequired).toBe(false);
  });

  it('does NOT trigger art. 27(1)(b) for §5(d) emergency dispatch alone — falls back to path (a)', () => {
    const notes = computeRoleNotes(
      { ...subItem(['d']), deployerKind: 'public_body' },
      'deployeur',
      'en',
    );
    // Falls back to path (a) because deployerKind is public_body and §5 is in Annex III ≠ §2
    expect(notes.friaRequired).toBe(true);
    expect(notes.friaReason.ref).toBe('art. 27(1)(a)');
  });

  it('does NOT trigger art. 27(1)(b) when §5 is selected without any sub-items (user did not refine)', () => {
    const notes = computeRoleNotes(
      { annexIII: [5], deployerKind: 'private_other' },
      'deployeur',
      'en',
    );
    expect(notes.friaRequired).toBe(false);
  });

  it('still triggers art. 27(1)(b) when mixed sub-items include (b) — selection-based, not exclusive', () => {
    const notes = computeRoleNotes(
      { ...subItem(['a', 'b']), deployerKind: 'private_other' },
      'deployeur',
      'en',
    );
    expect(notes.friaRequired).toBe(true);
    expect(notes.friaReason.ref).toBe('art. 27(1)(b)');
  });
});

describe('art. 25 — substantial-modification provider flip', () => {
  it('keeps the integrator note when substantialModification is unset', () => {
    const result = computeCategory({ nature: 'systeme_sur_gpai' }, 'en');
    expect(result.primary).toBe('RISQUE_MINIMAL');
    expect(result.justifications.some(j => j.ref === 'art. 25 + art. 53')).toBe(true);
  });

  it('keeps the integrator note when substantialModification === "non"', () => {
    const result = computeCategory({
      nature: 'systeme_sur_gpai',
      substantialModification: 'non',
    }, 'en');
    expect(result.primary).toBe('RISQUE_MINIMAL');
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

  it('does NOT emit the art. 25 flip note for a native GPAI provider (no flip needed)', () => {
    const result = computeCategory({
      nature: 'gpai',
      substantialModification: 'oui',   // irrelevant for a native provider
    }, 'en');
    expect(result.primary).toBe('GPAI');
    // The art. 25 flip note is reserved for the integrator-flip path
    expect(result.justifications.some(j => j.ref === 'art. 25')).toBe(false);
  });
});

describe('art. 50(4) §2 — human-edit exemption for AI-generated public-interest text', () => {
  it('still triggers RISQUE_LIMITE for genai_text when no human-edit claim is made', () => {
    const result = computeCategory({ art50: ['genai_text'] }, 'en');
    expect(result.primary).toBe('RISQUE_LIMITE');
    expect(result.justifications.some(j => j.ref === 'art. 50(4) §2')).toBe(true);
  });

  it('removes RISQUE_LIMITE contribution of genai_text when art50TextHumanEdit === "oui"', () => {
    const result = computeCategory({
      art50: ['genai_text'],
      art50TextHumanEdit: 'oui',
    }, 'en');
    expect(result.primary).not.toBe('RISQUE_LIMITE');
    expect(result.justifications.some(j => j.ref === 'art. 50(4) §2 carve-out')).toBe(true);
    expect(result.justifications.some(j => j.ref === 'art. 50(4) §2')).toBe(false);
  });

  it('keeps other art50 triggers active when only genai_text is carved out', () => {
    const result = computeCategory({
      art50: ['genai_text', 'interaction'],
      art50TextHumanEdit: 'oui',
    }, 'en');
    expect(result.primary).toBe('RISQUE_LIMITE');
    // chatbot trigger still contributes
    expect(result.justifications.some(j => j.ref === 'art. 50(1)')).toBe(true);
    // genai_text is carved out
    expect(result.justifications.some(j => j.ref === 'art. 50(4) §2')).toBe(false);
    expect(result.justifications.some(j => j.ref === 'art. 50(4) §2 carve-out')).toBe(true);
  });

  it('emits a French label for the carve-out when lang === "fr"', () => {
    const result = computeCategory({
      art50: ['genai_text'],
      art50TextHumanEdit: 'oui',
    }, 'fr');
    const carveOut = result.justifications.find(j => j.ref === 'art. 50(4) §2 carve-out');
    expect(carveOut).toBeDefined();
    expect(carveOut.label).toMatch(/édition humaine|revue éditoriale/i);
  });

  it('is a no-op when art50TextHumanEdit is set but genai_text is not selected', () => {
    const result = computeCategory({
      art50: ['interaction'],
      art50TextHumanEdit: 'oui',
    }, 'en');
    expect(result.primary).toBe('RISQUE_LIMITE');
    expect(result.justifications.some(j => j.ref === 'art. 50(4) §2 carve-out')).toBe(false);
    expect(result.justifications.some(j => j.ref === 'art. 50(1)')).toBe(true);
  });
});
