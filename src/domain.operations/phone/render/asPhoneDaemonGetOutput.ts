import type { PhoneDaemonLock } from '@src/access/daos/daoPhoneDaemon';

import { asPhoneOutput } from './asPhoneOutput';

/**
 * .what = the `phone.daemon get` output: whether the tree's daemon swims, its pid, its log
 */
export const asPhoneDaemonGetOutput = (input: {
  lock: PhoneDaemonLock | null;
  logPath: string;
}): string => {
  // a live daemon names its pid
  if (input.lock?.state === 'LIVE')
    return asPhoneOutput({
      vibe: 'the daemon swims',
      root: 'phone.daemon',
      nodes: [
        { text: 'state: LIVE' },
        { text: `pid: ${input.lock.pid ?? 'unknown'}` },
        { text: `log: ${input.logPath}` },
      ],
    });

  // else it rests, and the start command is named
  return asPhoneOutput({
    vibe: 'the daemon rests',
    root: 'phone.daemon',
    nodes: [
      { text: 'state: DOWN' },
      { text: 'start it: rhx phone.daemon set' },
      { text: `log: ${input.logPath}` },
    ],
  });
};
