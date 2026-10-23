import { genPhoneRefusal } from '@src/domain.operations/phone/render/genPhoneRefusal';

/**
 * .what = refuses a verb whose required flag is absent, and returns the flag's value when given
 * .why = an absent flag must be named as absent, never passed on as '' to a caster that then
 *        blames a blank value it was never handed
 */
export const assertPhoneFlagGiven = (input: {
  skill: string;
  verb: string;
  flag: string;
  value: string | undefined;
  usage: string;
}): string => {
  if (input.value !== undefined && input.value.trim() !== '')
    return input.value;
  throw genPhoneRefusal({
    vibe: 'bummer, that verb needs one more flag',
    headline: `${input.skill} ${input.verb} needs --${input.flag}`,
    nodes: [
      { text: `rhx ${input.skill} ${input.usage}` },
      { text: `see the usage: rhx ${input.skill} --help` },
    ],
  });
};
