import { describe, it, expect } from 'vitest';
import {
  computeCategory,
  PROHIBITED_PRACTICES,
  ANNEX_III_AREAS,
  ART50_TRIGGERS,
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

describe('art. 50 — limited-risk transparency triggers', () => {
  ART50_TRIGGERS.forEach((trigger) => {
    it(`returns RISQUE_LIMITE and cites ${trigger.ref} for trigger "${trigger.id}"`, () => {
      const result = computeCategory({ art50: [trigger.id] }, 'en');
      expect(result.primary).toBe('RISQUE_LIMITE');
      expect(result.justifications.some(j => j.ref === trigger.ref)).toBe(true);
    });
  });
});
