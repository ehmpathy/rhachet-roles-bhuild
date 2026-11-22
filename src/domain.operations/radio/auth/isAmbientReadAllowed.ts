import { isTestEnv } from './isTestEnv';

/**
 * .what = may this env read the box's ambient identity
 * .why = outside a test, always; inside a test, only once the test declared a stub gh on the
 *        subprocess PATH (RADIO_GH_STUB=1), so no test can reach a real gh login
 */
export const isAmbientReadAllowed = (input: {
  env: NodeJS.ProcessEnv;
}): boolean =>
  !isTestEnv({ env: input.env }) || input.env.RADIO_GH_STUB === '1';
