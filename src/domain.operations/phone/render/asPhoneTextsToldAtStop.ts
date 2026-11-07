import type { PhoneMailboxEntry } from '@src/access/daos/daoPhoneMailbox';

import { asPhoneTextSaid } from './asPhoneTextSaid';

/**
 * .what = what a clone reads at its stop: each text held for it, as its daemon would have said it
 * .why = the stop hook is the path that needs no daemon; it hands the clone the same words, the
 *        same signature, and the same reply command a say would, so a told text reads as one
 * .note = a daemon that is down is named with its cure, since the next text waits on it too
 */
export const asPhoneTextsToldAtStop = (input: {
  told: PhoneMailboxEntry[];
  self: string;
  daemon: 'LIVE' | 'DOWN';
}): string => {
  const count = input.told.length;
  const header = `🦫📬 ${count} text${count > 1 ? 's' : ''} held for you (${input.self}), told at your stop`;
  const nodesDaemon =
    input.daemon === 'DOWN'
      ? [
          '',
          "💧 this tree's phone daemon is down; texts wait on it, or on your next stop",
          '   └─ start it: rhx phone.daemon set',
        ]
      : [];
  return [
    header,
    ...input.told.flatMap((entry) => [
      '',
      asPhoneTextSaid({ record: entry.record }),
    ]),
    ...nodesDaemon,
  ].join('\n');
};
