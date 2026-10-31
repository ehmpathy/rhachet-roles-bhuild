import { given, then, when } from 'test-fns';

import { RadioChannel } from '@src/domain.objects/RadioChannel';
import { RadioTaskRecord } from '@src/domain.objects/RadioTaskRecord';
import { RadioTaskRecordStatus } from '@src/domain.objects/RadioTaskRecordStatus';
import { RadioTaskRepo } from '@src/domain.objects/RadioTaskRepo';

import { asRadioHaltLines } from './asRadioHaltLines';

const genRecord = (input: { reason: string | null }): RadioTaskRecord =>
  new RadioTaskRecord({
    key: 'a1b2c3d4e5f60718',
    kind: 'create',
    repo: new RadioTaskRepo({ owner: 'sandpine', name: 'svc-lessons' }),
    via: RadioChannel.GH_ISSUES,
    auth: null,
    idem: null,
    title: 'wetsuit inventory count',
    description: 'count the wetsuits before the swell',
    exid: null,
    status: null,
    recordStatus: RadioTaskRecordStatus.QUEUED,
    reason: input.reason,
    heldSeq: 1,
    deliveredExid: null,
  });

const CASES = [
  {
    description: 'the record that hit the rate limit names the halt and a wait',
    given: { reason: 'upstream:rate-limit', halt: true },
    expect: {
      output: [
        'halted: the line stops here',
        'wait, then: rhx radio.task.queue drain',
      ],
    },
  },
  {
    description: 'a record behind the halt names its place, unsent',
    given: { reason: 'upstream:rate-limit', halt: false },
    expect: { output: ['behind the halt: unsent, still in line'] },
  },
  {
    description: 'a record set aside on its own fault names naught here',
    given: { reason: 'upstream:access', halt: false },
    expect: { output: [] },
  },
  {
    description: 'a record not reached names naught here',
    given: { reason: null, halt: false },
    expect: { output: [] },
  },
];

describe('asRadioHaltLines', () => {
  CASES.map((thisCase, index) =>
    given(`[case${index + 1}] ${thisCase.description}`, () => {
      when('[t0] the halt lines are derived', () => {
        then('it yields the expected lines', () => {
          expect(
            asRadioHaltLines({
              fate: {
                fate: 'held',
                record: genRecord({ reason: thisCase.given.reason }),
                lift: null,
                detail: 'HTTP 429: API rate limit exceeded',
                halt: thisCase.given.halt,
              },
            }),
          ).toEqual(thisCase.expect.output);
        });
      });
    }),
  );
});
