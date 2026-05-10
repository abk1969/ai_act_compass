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
