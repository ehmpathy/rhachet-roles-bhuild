import { MalfunctionError } from 'helpful-errors';

import type { PhoneMalfunction } from './genPhoneMalfunction';

/**
 * .what = is this error a phone malfunction, so its vibe line may be printed
 */
export const isPhoneMalfunction = (error: unknown): error is PhoneMalfunction =>
  error instanceof MalfunctionError &&
  'phoneVibe' in error &&
  typeof error.phoneVibe === 'string';
