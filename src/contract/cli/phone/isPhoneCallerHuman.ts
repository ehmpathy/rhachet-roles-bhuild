/**
 * .what = is a human at the keys: a tty on stdin, or `__I_AM_HUMAN=true`
 * .why = the same check `radio.uses` and `git.commit.uses` make; the meter is as strong as it
 */
export const isPhoneCallerHuman = (input: {
  env: NodeJS.ProcessEnv;
}): boolean =>
  process.stdin.isTTY === true || input.env.__I_AM_HUMAN === 'true';
