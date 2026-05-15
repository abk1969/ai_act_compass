// End-to-end parcours tests — drives a real browser through the 7-step flow
// and asserts the verdict screen renders the expected primary category.
// Catches the class of bug that unit + component tests can miss:
// - Runtime React errors (scope, missing imports) — PR #3 C2 example
// - UI navigation logic (Bug #1 art. 25 flip Step 7 visibility)
// - Short-circuit interaction (Bug #2 prohibition + carve-out)
//
// Not in `npm test` (Vitest scope). Run manually: `npx playwright test`.
//
// Selectors anchor on the OptionCard aria-label, which is composed as
// `<title> — <sub> — <desc>`. We match on unique fragments (often `sub`
// like "art. 3(3)") to keep selectors stable across copy changes.

import { test, expect } from '@playwright/test';

const startQualification = (page) =>
  page.getByRole('button', { name: /start qualification/i }).click();
const clickContinue = (page) =>
  page.getByRole('button', { name: /^continue$/i }).click();
const clickViewVerdict = (page) =>
  page.getByRole('button', { name: /view verdict|continue/i }).first().click();

// OptionCard renders as <button role="radio"> (single) or <button role="checkbox"> (multi).
// Try checkbox first since multi cards are more likely to be the constraining ones.
async function clickCard(page, nameRegex) {
  const checkbox = page.getByRole('checkbox', { name: nameRegex });
  if (await checkbox.count() > 0) {
    await checkbox.first().click();
    return;
  }
  const radio = page.getByRole('radio', { name: nameRegex });
  await radio.first().click();
}

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test('happy path — provider with no triggers lands on RISQUE_MINIMAL', async ({ page }) => {
  await startQualification(page);

  // Step 1: provider (anchor on the unique sub "art. 3(3)")
  await clickCard(page, /art\. 3\(3\)/);
  await clickContinue(page);

  // Step 2: AI system (sub "art. 3(1)")
  await clickCard(page, /art\. 3\(1\)/);
  await clickContinue(page);

  // Step 3: none of the above
  await clickCard(page, /None of the above practices apply/);
  await clickContinue(page);

  // Step 4: Annex I coverage = No (desc unique to the No card)
  await clickCard(page, /My system does not fall within/);
  await clickContinue(page);

  // Step 5: no Annex III selection — Continue allowed (canNext true on empty)
  await clickContinue(page);

  // Step 6: no art. 50 triggers
  await clickContinue(page);

  // Step 7: not applicable for non-GPAI, non-flipped — View verdict
  await clickViewVerdict(page);

  await expect(page.getByText(/qualification verdict/i)).toBeVisible();
  await expect(page.getByText(/minimal risk|risque minimal/i).first()).toBeVisible();
});

test('high-risk deployer Annex III §3 surfaces FRIA quickwin', async ({ page }) => {
  await startQualification(page);

  // Step 1: deployer (sub "art. 3(4)") + public_body sub-question
  await clickCard(page, /art\. 3\(4\)/);
  await clickCard(page, /Body governed by public law/);
  await clickContinue(page);

  // Step 2: AI system
  await clickCard(page, /art\. 3\(1\)/);
  await clickContinue(page);

  // Step 3: none
  await clickCard(page, /None of the above practices apply/);
  await clickContinue(page);

  // Step 4: Annex I = No
  await clickCard(page, /My system does not fall within/);
  await clickContinue(page);

  // Step 5: Annex III §3 education + No exception
  await clickCard(page, /Education and vocational training/);
  await clickCard(page, /No exception applies/);
  await clickContinue(page);

  // Step 6: skip
  await clickContinue(page);

  // Step 7: not applicable for non-GPAI deployer
  await clickViewVerdict(page);

  // Verdict + FRIA quickwin visible (PR #3 Item C FRIA gating)
  await expect(page.getByText(/high-risk|haut risque/i).first()).toBeVisible();
  await expect(page.getByText(/FRIA|fundamental rights/i).first()).toBeVisible();
});

test('art. 25 flip — integrator + substantialModification + systemic risk → GPAI_RS (Bug #1 regression)', async ({ page }) => {
  await startQualification(page);

  // Step 1: provider (any role works; we just need to advance)
  await clickCard(page, /art\. 3\(3\)/);
  await clickContinue(page);

  // Step 2: pick "AI system relying on a GPAI" (sub "System integrating a GPAI model")
  await clickCard(page, /System integrating a GPAI model/);
  // Sub-question appears: Yes — substantial modification (sub "art. 25")
  await clickCard(page, /Yes — substantial modification/);
  await clickContinue(page);

  // Step 3: none
  await clickCard(page, /None of the above practices apply/);
  await clickContinue(page);

  // Step 4: Annex I = No
  await clickCard(page, /My system does not fall within/);
  await clickContinue(page);

  // Step 5: skip
  await clickContinue(page);

  // Step 6: skip
  await clickContinue(page);

  // Step 7: BUG #1 REGRESSION — the systemic-risk question MUST appear here
  // even though nature is 'systeme_sur_gpai' (not 'gpai'), because of the
  // declared substantial modification.
  await expect(page.getByText(/model with systemic risk/i)).toBeVisible();
  await clickCard(page, /Yes — model with systemic risk/);
  await clickViewVerdict(page);

  // Verdict primary should be GPAI_RS
  await expect(page.getByText(/GPAI.*systemic|GPAI \/ SR/i).first()).toBeVisible();
});

test('art. 5 carve-out does NOT short-circuit to verdict (Bug #2 regression)', async ({ page }) => {
  await startQualification(page);

  // Step 1: provider
  await clickCard(page, /art\. 3\(3\)/);
  await clickContinue(page);

  // Step 2: AI system
  await clickCard(page, /art\. 3\(1\)/);
  await clickContinue(page);

  // Step 3: prohibition (h) — sub "art. 5(1)(h)"
  await clickCard(page, /art\. 5\(1\)\(h\)/);
  // Carve-out sub-question appears — claim the law-enforcement exception (sub "art. 5(2)-(3)")
  await clickCard(page, /art\. 5\(2\)-\(3\)/);

  // BUG #2 REGRESSION: with the carve-out claimed, Continue should advance to
  // Step 4, NOT short-circuit to the verdict.
  await clickContinue(page);

  // Verify we're on Step 4 (Annex I question)
  await expect(page.getByText(/safety component.*harmonised|composant de sécurité/i)).toBeVisible();
  // The verdict's "qualification verdict" header should NOT be visible
  await expect(page.getByText(/qualification verdict/i)).not.toBeVisible();
});
