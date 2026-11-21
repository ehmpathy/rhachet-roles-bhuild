import { genPhoneRefusal } from '@src/domain.operations/phone/render/genPhoneRefusal';

/**
 * .what = refuses a verb a phone skill does not know, before any other check runs
 * .why = a typo must fail loud under a `✋ ConstraintError` header, with the verbs that do exist.
 *        it runs first, so a typo outside a clone or a tree names the typo, never a "no clone"
 *        that hides it
 */
export const assertPhoneVerbKnown = (input: {
  skill: string;
  verb: string;
  known: string[];
  usage: string[];
}): void => {
  if (input.known.includes(input.verb)) return;
  throw genPhoneRefusal({
    vibe: 'bummer, that verb is not one the phone knows',
    headline: `${input.skill} has no verb '${input.verb}'`,
    nodes: [
      {
        text: 'verbs',
        children: input.usage.map((line) => ({
          text: `rhx ${input.skill} ${line}`,
        })),
      },
      { text: `see the usage: rhx ${input.skill} --help` },
    ],
  });
};
