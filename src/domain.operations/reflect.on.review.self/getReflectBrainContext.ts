import { ConstraintError } from 'helpful-errors';
import type { BrainAtom, ContextBrain } from 'rhachet/brains';

/**
 * .what = the brain-atom slug for the cheap judge model
 * .why = the default cheap brain for utility verdicts (fireworks deepseek flash);
 *        owned here by the communicator that reaches the brain, not the leaf that
 *        only shapes the prompt — the leaf should not know where its context came from
 */
export const REFLECT_BRAIN_SLUG = 'fireworks/deepseek/v4-flash';

/**
 * .what = the keyrack location of the brain's FIREWORKS_API_KEY credential
 * .why = the fireworks supplier fetches its key from the keyrack (owner + env);
 *        the credential is provisioned under the ehmpath owner, prep env
 */
export const REFLECT_BRAIN_KEYRACK = { owner: 'ehmpath', env: 'prep' } as const;

/**
 * .what = build the cheap-judge brain context for a given brain slug
 * .why = the single communicator that reaches the external brain supplier — both
 *        apply mode (CLI) and the real-brain integration test consume it, so the
 *        setup (supplier discovery + keyrack creds + loud failure) lives in
 *        exactly one place instead of two re-derived copies that drift apart
 *
 * .note = communicator grain — a raw i/o boundary to the rhachet brain supplier;
 *         an absent supplier, package, or credential surfaces as a hinted
 *         ConstraintError, never a raw stack trace. the `rhachet/brains` import is
 *         dynamic so plan mode (which never calls this) needs no brain at all.
 *
 * @param brainSlug - the brain-atom choice slug to bind the context to
 * @param onFailureHint - the caller-specific fix hint for the loud failure
 * @param keyrack - override the keyrack location of the credential; production
 *        uses the default (ehmpath/prep), but the real-brain integration test
 *        overrides to ehmpath/test so it resolves the CI firewall's `--env test`
 *        export while local prod stays on the prep dev vault
 */
export const getReflectBrainContext = async (
  input: { brainSlug: string },
  options?: {
    onFailureHint?: string;
    keyrack?: { owner: string; env: string };
  },
): Promise<ContextBrain<BrainAtom>> => {
  const keyrack = options?.keyrack ?? REFLECT_BRAIN_KEYRACK;
  try {
    // discovery mode: finds the installed rhachet-brains-* supplier for the slug;
    // creds point the supplier at the keyrack location of its api key
    const { genContextBrain } = await import('rhachet/brains');
    return await genContextBrain({
      choice: { atom: input.brainSlug },
      creds: { keyrack },
    });
  } catch (error) {
    throw new ConstraintError(
      `could not reach the brain "${input.brainSlug}"`,
      {
        brain: input.brainSlug,
        cause: error instanceof Error ? error : new Error(String(error)),
        hint:
          options?.onFailureHint ??
          `confirm the rhachet-brains supplier is installed and its credential is on the keyrack (owner ${keyrack.owner})`,
      },
    );
  }
};
