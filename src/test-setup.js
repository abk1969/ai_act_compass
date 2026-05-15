// Global test setup — extends Vitest's `expect` with jest-dom matchers
// (toBeInTheDocument, toHaveTextContent, etc.) for any test running in jsdom.
// No-op for tests in the default node environment.
import '@testing-library/jest-dom/vitest';

// jsdom doesn't implement window.scrollTo — the App calls it on step change,
// producing noisy stderr. Stub it out so tests get clean output.
if (typeof window !== 'undefined') {
  window.scrollTo = () => {};
}
