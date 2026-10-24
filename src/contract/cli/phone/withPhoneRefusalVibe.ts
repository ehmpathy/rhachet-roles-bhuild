import { isPhoneMalfunction } from '@src/domain.operations/phone/render/isPhoneMalfunction';
import { isPhoneRefusal } from '@src/domain.operations/phone/render/isPhoneRefusal';

/**
 * .what = prints a phone refusal's or malfunction's 🦫 vibe line and a blank line, then rethrows
 * .why = a phone error reads as the vibe, a blank line, then `✋ ConstraintError: ...` (or
 *        `💥 MalfunctionError: ...`) and its tree; the shared cli wrapper prints the error and
 *        exits 2 (or 1), so this adds only the vibe
 */
export const withPhoneRefusalVibe =
  (logic: () => Promise<void>) => async (): Promise<void> => {
    try {
      await logic();
    } catch (error) {
      if (isPhoneRefusal(error) || isPhoneMalfunction(error))
        console.error(`🦫 ${error.phoneVibe}\n`);
      throw error;
    }
  };
