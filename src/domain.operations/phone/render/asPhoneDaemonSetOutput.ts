import type { PhoneDaemonLock } from '@src/access/daos/daoPhoneDaemon';

import { asPhoneOutput } from './asPhoneOutput';
import { asPhoneTreeLines } from './asPhoneTreeLines';

/**
 * .what = the `phone.daemon set` output, per what was observed
 * .why = FOUND and STARTED name the live pid; UNCONFIRMED is a malfunction the system must fix
 *        (a daemon was spawned, yet no live lock showed), so it opens with the qualified
 *        `💥 MalfunctionError:` header and names the log that holds the why
 */
export const asPhoneDaemonSetOutput = (input: {
  lock: PhoneDaemonLock | null;
  outcome: 'FOUND' | 'STARTED' | 'UNCONFIRMED';
  logPath: string;
}): string => {
  // no live lock showed: a malfunction, with the log that holds the why
  if (input.outcome === 'UNCONFIRMED')
    return [
      '💥 MalfunctionError: the daemon did not surface',
      '',
      '💧 phone.daemon set',
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
