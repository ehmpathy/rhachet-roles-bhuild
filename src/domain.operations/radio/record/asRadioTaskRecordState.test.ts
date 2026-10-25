import { given, then, when } from 'test-fns';

import { RadioChannel } from '@src/domain.objects/RadioChannel';
import { RadioTaskRecord } from '@src/domain.objects/RadioTaskRecord';
import { RadioTaskRecordStatus } from '@src/domain.objects/RadioTaskRecordStatus';
import { RadioTaskRepo } from '@src/domain.objects/RadioTaskRepo';

import { asRadioTaskRecordState } from './asRadioTaskRecordState';

const genRecord = (input: { reason: string | null }): RadioTaskRecord =>
  new RadioTaskRecord({
    key: 'a1b2c3d4e5f60718',
    kind: 'create',
    repo: new RadioTaskRepo({ owner: 'sandpine', name: 'svc-lessons' }),
    via: RadioChannel.GH_ISSUES,
    auth: null,
    idem: null,
    title: 'lesson reminders',
    description: 'details',
    exid: null,
    status: null,
    recordStatus: RadioTaskRecordStatus.QUEUED,
    reason: input.reason,
    heldSeq: 1,
    deliveredExid: null,
  });

const STATE_CASES = [
  {
    description: 'a shut gate holds it',
    given: {
      reason: 'radio.uses:blocked — org',
      lift: 'rhx radio.uses --org sandpine allow',
    },
    expect: { output: 'held at gate' },
  },
  {
    description: 'a shut gate wins over a prior upstream fault',
    given: {
      reason: 'upstream:access',
      lift: 'rhx radio.uses --org sandpine allow',
    },
    expect: { output: 'held at gate' },
  },
  {
    description: 'a fault of its own sets it aside (the #599 shape)',
    given: { reason: 'upstream:access', lift: null },
    expect: { output: 'set aside' },
  },
  {
    description: 'a rejected token sets it aside',
    given: { reason: 'upstream:401', lift: null },
    expect: { output: 'set aside' },
  },
  {
    description: 'a rate limit halts it',
    given: { reason: 'upstream:rate-limit', lift: null },
    expect: { output: 'halted' },
  },
  {
    description: 'an outage halts it',
    given: { reason: 'upstream:transient', lift: null },
    expect: { output: 'halted' },
  },
  {
    description: 'a gate since opened leaves it not reached',
    given: { reason: 'radio.uses:blocked — default', lift: null },
    expect: { output: 'not reached' },
  },
  {
    description: 'no reason at all leaves it not reached',
    given: { reason: null, lift: null },
    expect: { output: 'not reached' },
  },
];

describe('asRadioTaskRecordState', () => {
  STATE_CASES.map((thisCase, index) =>
    given(`[case${index + 1}] ${thisCase.description}`, () => {
      when('[t0] the state is read', () => {
        then('it yields the expected state', () => {
          expect(
            asRadioTaskRecordState({
              record: genRecord({ reason: thisCase.given.reason }),
              lift: thisCase.given.lift,
            }),
          ).toEqual(thisCase.expect.output);
        });
      });
    }),
  );
});
