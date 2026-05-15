// Component smoke tests for the App — narrow safety net against the class of
// bug exemplified by PR #3's C2 scope error (`roleNotes` defined in `App` but
// consumed in `Result` would throw `ReferenceError` at runtime despite green
// unit tests and a green build).
//
// These tests render the full React tree and exercise navigation. They are
// NOT a substitute for end-to-end testing of each verdict path — they are a
// tripwire for runtime errors, missing imports, and scope mistakes that
// pure-function unit tests cannot catch.
//
// Tested in jsdom via vitest's environmentMatchGlobs override (see
// vitest.config.js). The full Result-screen walk-through is intentionally
// deferred to a future Playwright E2E pass — getting to step 7 in jsdom
// with the current UI requires more selector engineering than the safety
// net warrants.

import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../ai-act-compass.jsx';

describe('App smoke — runtime safety', () => {
  beforeEach(() => cleanup());

  it('mounts the welcome screen without throwing', () => {
    render(<App />);
    expect(screen.getByRole('main')).toBeInTheDocument();
    // The "Start qualification" CTA must be present and clickable.
    expect(screen.getByRole('button', { name: /start qualification/i })).toBeEnabled();
  });

  it('navigates Welcome → Step 1 when Start is clicked', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: /start qualification/i }));

    // Step 1 renders the role question. "Continue" is the Next CTA.
    const continueBtn = screen.getByRole('button', { name: /^continue$/i });
    expect(continueBtn).toBeInTheDocument();
    // canNext is false until a role is picked → button is disabled.
    expect(continueBtn).toBeDisabled();
  });

  it('enables Continue after picking a role on Step 1', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: /start qualification/i }));

    // Click the "Provider" role card. The role IDs are French ('fournisseur')
    // but the displayed label is "Provider" in EN.
    const providerLabel = screen.getByText(/^Provider$/);
    const providerCard = providerLabel.closest('button, [role="button"]') || providerLabel.parentElement;
    await user.click(providerCard);

    // After picking the role, Continue becomes enabled.
    const continueBtn = screen.getByRole('button', { name: /^continue$/i });
    expect(continueBtn).toBeEnabled();
  });

  it('shows the deployerKind sub-question only when role === "deployeur"', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: /start qualification/i }));

    // Before any role selection, the deployer-kind subhead is not in the DOM.
    expect(screen.queryByText(/deployer kind/i)).not.toBeInTheDocument();

    // Pick "Deployer".
    const deployerLabel = screen.getByText(/^Deployer$/);
    const deployerCard = deployerLabel.closest('button, [role="button"]') || deployerLabel.parentElement;
    await user.click(deployerCard);

    // The deployer-kind sub-question header now appears.
    expect(screen.getByText(/deployer kind/i)).toBeInTheDocument();
  });
});
