/**
 * .what = does this env belong to a test run
 * .why = a test must never send under a human's gh login: `--auth as-human` refuses in a test
 *        env, and the ambient fallback skips the gh login there, by the same rule
 */
export const isGithubAuthTestEnv = (input: {
  env: NodeJS.ProcessEnv;
}): boolean =>
  input.env.NODE_ENV === 'test' || input.env.JEST_WORKER_ID !== undefined;
