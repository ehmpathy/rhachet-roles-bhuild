import type { PhoneDaemonLock } from '@src/access/daos/daoPhoneDaemon';

import { asPhoneOutput } from './asPhoneOutput';
import { asPhoneTreeLines } from './asPhoneTreeLines';

/**
 * .what = the `phone.daemon set` output, per what was observed
 * .why = FOUND and STARTED name the live pid; UNCONFIRMED is a malfunction the system must fix
 *        (a daemon was spawned, yet no live lock showed), so it reads the way every phone
 *        refusal reads — the 🦫 vibe, a blank line, then the qualified `💥 MalfunctionError:`
 *        header and its tree — and names the log that holds the why. the vibe is the vision's
 *        rendered sample word for word; the header is the text the first snapshot locked
 */
export const asPhoneDaemonSetOutput = (input: {
  lock: PhoneDaemonLock | null;
  outcome: 'FOUND' | 'STARTED' | 'UNCONFIRMED';
  logPath: string;
}): string => {
  // no live lock showed: a malfunction, with the log that holds the why
  if (input.outcome === 'UNCONFIRMED')
    return [
      '🦫 bummer, the daemon did not surface',
      '',
      '💥 MalfunctionError: the daemon did not surface',
      ...asPhoneTreeLines({
        nodes: [
          { text: 'state: DOWN' },
          { text: 'no lock was seen LIVE within the wait' },
          { text: `read why in its log: ${input.logPath}` },
          { text: 'then try again: rhx phone.daemon set' },
        ],
      }),
    ].join('\n');

  // a live daemon, found or just started
  return asPhoneOutput({
    vibe: VIBE_OF_SET[input.outcome],
    root: 'phone.daemon set',
    nodes: [
      { text: 'state: LIVE' },
      { text: `pid: ${input.lock?.pid ?? 'unknown'}` },
      { text: `log: ${input.logPath}` },
    ],
  });
};

const VIBE_OF_SET = {
  FOUND: 'the daemon already swims',
  STARTED: 'the daemon dives in',
} as const;
