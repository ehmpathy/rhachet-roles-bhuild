import { isPhoneRefusal } from '@src/domain.operations/phone/render/isPhoneRefusal';

/**
 * .what = prints a phone refusal's 🦫 vibe line and a blank line, then rethrows it
 * .why = a refusal reads as the vibe, a blank line, then `✋ ConstraintError: ...` and its tree;
 *        the shared cli wrapper prints the error and exits 2, so this adds only the vibe
 */
export const withPhoneRefusalVibe =
  (logic: () => Promise<void>) => async (): Promise<void> => {
    try {
      await logic();
    } catch (error) {
      if (isPhoneRefusal(error)) console.error(`🦫 ${error.phoneVibe}\n`);
      throw error;
    }
  };
