import { genPhoneRefusal } from '@src/domain.operations/phone/render/genPhoneRefusal';

/**
 * .what = refuses a verb whose required flag is absent or bare, and returns the flag's value when given
 * .why = an absent flag must be named as absent, never passed on as '' to a caster that then
 *        blames a blank value it was never handed; and a flag passed with no value must be named
 *        as bare, never as absent, else a caller who typed it reads "needs --X" and retries the
 *        same call
 *
 * .note = `raw` is the parsed value: undefined = absent; `true` or a blank string = bare
 */
export const assertPhoneFlagGiven = (input: {
  skill: string;
  verb: string;
  flag: string;
  raw: string | boolean | undefined;
  takes: string;
  usage: string;
}): string => {
  // a flag with a value is given
  if (typeof input.raw === 'string' && input.raw.trim() !== '')
    return input.raw;

  // a flag that was typed with no value is bare
  if (input.raw !== undefined)
    throw genPhoneRefusal({
      vibe: 'bummer, that flag came with no value',
      headline: `--${input.flag} takes a value: ${input.takes}`,
      nodes: [
        { text: `rhx ${input.skill} ${input.usage}` },
        { text: `see the usage: rhx ${input.skill} --help` },
      ],
    });

  // a flag that was never typed is absent
  throw genPhoneRefusal({
    vibe: 'bummer, that verb needs one more flag',
    headline: `${input.skill} ${input.verb} needs --${input.flag}`,
    nodes: [
      { text: `rhx ${input.skill} ${input.usage}` },
      { text: `see the usage: rhx ${input.skill} --help` },
    ],
  });
};
