import { ConstraintError } from 'helpful-errors';

import type { PhoneRefusal } from './genPhoneRefusal';

/**
 * .what = is this error a phone refusal, so its vibe line may be printed
 */
export const isPhoneRefusal = (error: unknown): error is PhoneRefusal =>
  error instanceof ConstraintError &&
  'phoneVibe' in error &&
  typeof error.phoneVibe === 'string';
