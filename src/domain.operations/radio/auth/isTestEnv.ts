/**
 * .what = does this env belong to a test run
 * .why = two auth paths read the host's own gh login (as-human, as-ehmpath ambient); a
 *        test must never reach a real one, so both ask this one question
 */
export const isTestEnv = (input: { env: NodeJS.ProcessEnv }): boolean =>
  input.env.NODE_ENV === 'test' || input.env.JEST_WORKER_ID !== undefined;
