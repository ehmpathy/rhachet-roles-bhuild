/**
 * .what = global repeatability config for stochastic tests
 * .why = centralized config for brain.repl integration tests
 */
export const REPEATABILITY_CONFIG = {
  criteria: process.env.CI ? 'SOME' : 'EVERY',
  attempts: 3,
} as const;
