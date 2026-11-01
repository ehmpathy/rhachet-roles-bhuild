import { RadioChannel } from '@src/domain.objects/RadioChannel';
import { RadioTaskRecord } from '@src/domain.objects/RadioTaskRecord';
import { RadioTaskRecordStatus } from '@src/domain.objects/RadioTaskRecordStatus';
import { RadioTaskRepo } from '@src/domain.objects/RadioTaskRepo';

import { asRadioDrainAuthNotice } from './asRadioDrainAuthNotice';
import type { RadioTaskRecordFate } from './RadioTaskRecordFate';

const genHeld = (input: {
  reason: string | null;
  lift: string | null;
}): RadioTaskRecordFate => ({
  fate: 'held',
  record: new RadioTaskRecord({
    key: 'a1b2c3d4e5f60718',
    kind: 'create',
    repo: new RadioTaskRepo({ owner: 'sandpine', name: 'svc-lessons' }),
    via: RadioChannel.GH_ISSUES,
    auth: null,
    idem: null,
    title: 'lesson reminders',
    description: 'remind each surfer a day ahead',
    exid: null,
    status: null,
    recordStatus: RadioTaskRecordStatus.QUEUED,
    reason: input.reason,
    heldSeq: 1,
    deliveredExid: null,
  }),
  lift: input.lift,
  detail: null,
  halt: false,
});

const SET_ASIDE = genHeld({ reason: 'upstream:access', lift: null });
const AT_GATE = genHeld({
  reason: 'radio.uses:blocked — local',
  lift: 'rhx radio.uses allow',
});

const TEST_CASES = [
  {
    description: 'no override names naught',
    given: { fates: [SET_ASIDE], authOverride: null },
    expect: { output: null },
  },
  {
    description: 'an override over an empty queue names naught',
    given: { fates: [], authOverride: 'as-human' },
    expect: { output: null },
  },
  {
    description:
      'an override where every record waits at a shut gate names naught, since naught went out',
    given: { fates: [AT_GATE, AT_GATE], authOverride: 'as-human' },
    expect: { output: null },
  },
  {
    description: 'an override that sent a record names the override',
    given: { fates: [SET_ASIDE, AT_GATE], authOverride: 'as-human' },
    expect: { output: '🦫 this drain sent under --auth as-human' },
  },
];

describe('asRadioDrainAuthNotice', () => {
  TEST_CASES.map((thisCase) =>
    test(thisCase.description, () => {
      expect(asRadioDrainAuthNotice(thisCase.given)).toEqual(
        thisCase.expect.output,
      );
    }),
  );
});
