// Characterization tests for the compliance-deliverables data (CHECKLIST and
// QUICKWINS) — locks in regulatorily-significant entries so future edits
// cannot silently remove a required obligation.
//
// These are NOT TDD-cycle tests (the data already shipped in PRs #3-#5).
// They are regression guards against accidental deletion of regulatory
// citations the UI relies on.

import { describe, it, expect } from 'vitest';
import { CHECKLIST, QUICKWINS, isFriaItem } from './deliverables.js';

const ALL_TIERS = [
  'INTERDIT',
  'HAUT_RISQUE_ANNEXE_I',
  'HAUT_RISQUE_ANNEXE_III',
  'RISQUE_LIMITE',
  'RISQUE_MINIMAL',
  'GPAI',
  'GPAI_RS',
];

describe('CHECKLIST — RISQUE_LIMITE includes art. 50(5) accessibility entry', () => {
  it('Transparency pillar surfaces art. 50(5) directive 2019/882/EU reference', () => {
    const transparency = CHECKLIST.RISQUE_LIMITE.find(p =>
      /Transparency|Transparence/.test(p.pilier.en) || /Transparency|Transparence/.test(p.pilier.fr)
    );
    expect(transparency).toBeDefined();
    const entry = transparency.items.find(i => i.ref === 'art. 50(5)');
    expect(entry).toBeDefined();
    // The text must cite the European Accessibility Act, not WCAG, per the PR #5 polish
    expect(entry.txt.en).toMatch(/2019\/882/);
    expect(entry.txt.fr).toMatch(/2019\/882/);
  });
});

describe('CHECKLIST — structural invariants', () => {
  ALL_TIERS.forEach(tier => {
    it(`${tier} has at least one pillar with at least one item`, () => {
      expect(CHECKLIST[tier]).toBeDefined();
      expect(CHECKLIST[tier].length).toBeGreaterThan(0);
      CHECKLIST[tier].forEach(pillar => {
        expect(pillar.pilier).toBeDefined();
        expect(pillar.pilier.en).toBeTruthy();
        expect(pillar.pilier.fr).toBeTruthy();
        expect(Array.isArray(pillar.items)).toBe(true);
        expect(pillar.items.length).toBeGreaterThan(0);
        pillar.items.forEach(item => {
          // ref must be a string or {en, fr}
          if (typeof item.ref === 'string') {
            expect(item.ref).toBeTruthy();
          } else {
            expect(item.ref.en).toBeTruthy();
            expect(item.ref.fr).toBeTruthy();
          }
          // txt must always be {en, fr}
          expect(item.txt.en).toBeTruthy();
          expect(item.txt.fr).toBeTruthy();
        });
      });
    });
  });
});

describe('CHECKLIST — art. 4 AI literacy is surfaced in every tier (universal obligation)', () => {
  ALL_TIERS.forEach(tier => {
    it(`${tier} cites art. 4 somewhere in its checklist`, () => {
      const allRefs = CHECKLIST[tier].flatMap(p =>
        p.items.map(i => (typeof i.ref === 'string' ? i.ref : i.ref.en))
      );
      // GPAI / GPAI_RS / HAUT_RISQUE_ANNEXE_I do not necessarily cite art. 4 directly
      // in their checklists because their regimes are layered ON TOP of universal art. 4.
      // The audit (PR #3) explicitly placed art. 4 in the tier-specific checklists for
      // tiers where personnel-facing UI/training is the primary deliverable — that's
      // INTERDIT (via redesign team), HAUT_RISQUE_ANNEXE_III, RISQUE_LIMITE, RISQUE_MINIMAL.
      // GPAI/GPAI_RS/HAUT_RISQUE_ANNEXE_I rely on the QUICKWINS art. 4 entry.
      if (['HAUT_RISQUE_ANNEXE_III', 'RISQUE_LIMITE', 'RISQUE_MINIMAL'].includes(tier)) {
        expect(allRefs.some(r => r === 'art. 4')).toBe(true);
      }
    });
  });
});

describe('QUICKWINS — structural invariants', () => {
  ALL_TIERS.forEach(tier => {
    it(`${tier} has at least one quickwin with titre/delai/refs/action`, () => {
      expect(QUICKWINS[tier]).toBeDefined();
      expect(QUICKWINS[tier].length).toBeGreaterThan(0);
      QUICKWINS[tier].forEach(q => {
        expect(q.titre.en).toBeTruthy();
        expect(q.titre.fr).toBeTruthy();
        expect(q.delai.en).toBeTruthy();
        expect(q.delai.fr).toBeTruthy();
        expect(Array.isArray(q.refs)).toBe(true);
        expect(q.refs.length).toBeGreaterThan(0);
        expect(q.action.en).toBeTruthy();
        expect(q.action.fr).toBeTruthy();
      });
    });
  });
});

describe('QUICKWINS — art. 27 FRIA quickwin exists in HAUT_RISQUE_ANNEXE_III', () => {
  // This is the regulatorily-critical entry that isFriaItem gates against.
  // If it disappears, the FRIA gating logic becomes inert.
  it('exactly one HAUT_RISQUE_ANNEXE_III quickwin is identified by isFriaItem', () => {
    const friaQuickwins = QUICKWINS.HAUT_RISQUE_ANNEXE_III.filter(isFriaItem);
    expect(friaQuickwins).toHaveLength(1);
    expect(friaQuickwins[0].refs).toContain('art. 27');
  });

  it('no other tier has a FRIA-flagged quickwin (FRIA is HAUT_RISQUE_ANNEXE_III-only)', () => {
    const otherTiers = ALL_TIERS.filter(t => t !== 'HAUT_RISQUE_ANNEXE_III');
    otherTiers.forEach(tier => {
      const friaInTier = QUICKWINS[tier].filter(isFriaItem);
      expect(friaInTier).toHaveLength(0);
    });
  });
});

describe('isFriaItem — predicate semantics', () => {
  it('returns true for items whose refs include the exact string "art. 27"', () => {
    expect(isFriaItem({ refs: ['art. 27'] })).toBe(true);
    expect(isFriaItem({ refs: ['art. 27', 'ISO/IEC 42005:2025'] })).toBe(true);
  });

  it('returns false for items citing related but distinct articles', () => {
    expect(isFriaItem({ refs: ['art. 27(1)'] })).toBe(false);
    expect(isFriaItem({ refs: ['art. 27(1)(a)'] })).toBe(false);
    expect(isFriaItem({ refs: ['art. 26'] })).toBe(false);
  });

  it('returns false for items with no refs or undefined refs', () => {
    expect(isFriaItem({})).toBe(false);
    expect(isFriaItem({ refs: [] })).toBe(false);
  });
});
