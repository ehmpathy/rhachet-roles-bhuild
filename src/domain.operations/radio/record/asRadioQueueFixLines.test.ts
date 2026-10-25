import { given, then, when } from 'test-fns';

import { RadioChannel } from '@src/domain.objects/RadioChannel';
import { RadioTaskRecord } from '@src/domain.objects/RadioTaskRecord';
import { RadioTaskRecordStatus } from '@src/domain.objects/RadioTaskRecordStatus';
import { RadioTaskRepo } from '@src/domain.objects/RadioTaskRepo';

import { asRadioQueueFixLines } from './asRadioQueueFixLines';

const genRecord = (input: { reason: string | null }): RadioTaskRecord =>
  new RadioTaskRecord({
    key: 'a1b2c3d4e5f60718',
    kind: 'update',
    repo: new RadioTaskRepo({ owner: 'sandpine', name: 'svc-lessons' }),
    via: RadioChannel.GH_ISSUES,
    auth: null,
    idem: null,
    title: null,
    description: 'board rentals open friday',
    exid: '599',
    status: null,
    recordStatus: RadioTaskRecordStatus.QUEUED,
    reason: input.reason,
    heldSeq: 1,
    deliveredExid: null,
  });

const AMEND =
  'amend it: rhx radio.task.queue set --key a1b2c3d4e5f60718 --auth as-human (needs a gh login on this host)';
const DROP =
  'or drop it: rhx radio.task.queue del --key a1b2c3d4e5f60718 --why "<why>"';

const FIX_CASES = [
  {
    description: 'an access fault names amend + drop (the #599 shape)',
    given: { reason: 'upstream:access' },
    expect: { output: [AMEND, DROP] },
  },
  {
    description: 'a repo the auth cannot see names amend + drop',
    given: { reason: 'upstream:not-found' },
    expect: { output: [AMEND, DROP] },
  },
  {
    description: 'a rejected token names amend + drop (#513)',
    given: { reason: 'upstream:401' },
    expect: { output: [AMEND, DROP] },
  },
  {
    description: 'an auth not derivable names amend + drop',
    given: { reason: 'upstream:auth' },
    expect: { output: [AMEND, DROP] },
  },
  {
    description:
      'an unknown fault names drop only; no auth is known to cure it',
    given: { reason: 'upstream:fault' },
    expect: { output: [DROP] },
  },
  {
    description: 'a rate limit names naught; a wait is its fix',
    given: { reason: 'upstream:rate-limit' },
    expect: { output: [] },
  },
  {
    description: 'a gate names naught here; the lift is its fix',
    given: { reason: 'radio.uses:blocked — org' },
    expect: { output: [] },
  },
  {
    description: 'a record never tried names naught',
    given: { reason: null },
    expect: { output: [] },
  },
];

describe('asRadioQueueFixLines', () => {
  FIX_CASES.map((thisCase, index) =>
    given(`[case${index + 1}] ${thisCase.description}`, () => {
      when('[t0] the fix lines are derived', () => {
        then('it yields the expected lines', () => {
          expect(
            asRadioQueueFixLines({
              record: genRecord({ reason: thisCase.given.reason }),
            }),
          ).toEqual(thisCase.expect.output);
        });
      });
    }),
  );
});
