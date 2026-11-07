import { asPhoneOutput } from './asPhoneOutput';

/**
 * .what = the `phone.daemon del` output: whether the daemon is gone yet
 * .why = a daemon mid-say finishes that say before it reads the stop, so STOPPING says it still
 *        holds its lock; every outcome says the QUEUED texts wait on disk
 */
export const asPhoneDaemonDelOutput = (input: {
  outcome: 'ABSENT' | 'STOPPED' | 'STOPPING';
}): string =>
  asPhoneOutput({
    vibe: VIBE_OF_DEL[input.outcome],
    root: 'phone.daemon del',
    nodes: [
      { text: STATE_OF_DEL[input.outcome] },
      { text: 'QUEUED texts wait on disk for the next start' },
    ],
  });

const VIBE_OF_DEL = {
  ABSENT: 'the daemon already rests',
  STOPPED: 'the daemon climbs out',
  STOPPING: 'the daemon heads for the bank',
} as const;

const STATE_OF_DEL = {
  ABSENT: 'state: DOWN',
  STOPPED: 'state: DOWN',
  STOPPING:
    'state: STOPPING; it finishes its current say, then releases its lock',
} as const;
