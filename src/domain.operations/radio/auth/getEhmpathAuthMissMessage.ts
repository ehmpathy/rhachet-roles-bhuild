import { asRadioNestedLines } from '../asRadioNestedLines';

/**
 * .what = the message for an as-ehmpath send that found no ehmpath token
 * .why = a miss must name each spot it checked, what each held, and the fix, so a caller
 *        knows why the robot could not send and what to do now
 *
 * .note = the last fix is always `--auth as-human`, offered as a choice made on purpose,
 *         never as the robot's fallback
 *
 * .note = auth null means the send named no --auth (the ambient-first default), so the header
 *         names the default rather than a value the caller never typed
 */
export const getEhmpathAuthMissMessage = (input: {
  auth: string | null;
  misses: { row: string; fix: string | null }[];
}): string => {
  const fixesOfSpots = input.misses.flatMap((miss) =>
    miss.fix ? [miss.fix] : [],
  );
  const fixHuman = 'send as yourself, on purpose: --auth as-human';
  const subject = input.auth
    ? `--auth ${input.auth}`
    : 'the default auth (no --auth)';
  return [
    `${subject} found no ehmpath token`,
    '',
    asRadioNestedLines({
      head: 'checked',
      lines: input.misses.map((miss) => miss.row),
    }),
    '',
    asRadioNestedLines({
      head: 'fix',
      lines: [
        ...fixesOfSpots,
        fixesOfSpots.length ? `or ${fixHuman}` : fixHuman,
      ],
    }),
  ].join('\n');
};
