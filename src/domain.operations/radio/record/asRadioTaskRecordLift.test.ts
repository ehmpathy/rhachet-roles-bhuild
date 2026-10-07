import { asIsoTimeStamp } from 'iso-time';
import { given, then, when } from 'test-fns';

import { RadioChannel } from '@src/domain.objects/RadioChannel';
import { RadioTaskRecord } from '@src/domain.objects/RadioTaskRecord';
import { RadioTaskRecordStatus } from '@src/domain.objects/RadioTaskRecordStatus';
import { RadioTaskRepo } from '@src/domain.objects/RadioTaskRepo';

import { asRadioTaskRecordLift } from './asRadioTaskRecordLift';

const genRecord = (input: { owner: string }): RadioTaskRecord =>
  new RadioTaskRecord({
    key: `k.${input.owner}`,
    kind: 'create',
    repo: new RadioTaskRepo({ owner: input.owner, name: 'svc' }),
    via: RadioChannel.GH_ISSUES,
    auth: null,
    idem: null,
    title: 'fix flaky keyrack test',
    description: 'the test flakes',
    exid: null,
    status: null,
    recordStatus: RadioTaskRecordStatus.QUEUED,
    reason: null,
    heldAt: asIsoTimeStamp('2026-09-29T09:14:00Z'),
    heldSeq: 1,
    settledAt: null,
    deliveredExid: null,
  });

const TEST_CASES: {
  description: string;
  given: {
    owner: string;
    states: Parameters<typeof asRadioTaskRecordLift>[0]['states'];
  };
  expect: { lift: string | null };
}[] = [
  {
    description: 'an open org gate needs no lift',
    given: {
      owner: 'ehmpathy',
      states: {
        global: null,
        org: { orgs: { ehmpathy: 'allowed' as const } },
        local: null,
      },
    },
    expect: { lift: null },
  },
  {
    description: 'a global block lifts globally, whatever the org says',
    given: {
      owner: 'ehmpathy',
      states: {
        global: { blocked: true },
        org: { orgs: { ehmpathy: 'allowed' as const } },
        local: null,
      },
    },
    expect: { lift: 'rhx radio.uses --global allow' },
  },
  {
    description: 'an org block lifts via the target org',
    given: {
      owner: 'sandpine',
      states: {
        global: null,
        org: {
          orgs: {
            ehmpathy: 'allowed' as const,
            sandpine: 'blocked' as const,
          },
        },
        local: null,
      },
    },
    expect: { lift: 'rhx radio.uses --org sandpine allow' },
  },
  {
    description: 'one loaded state set gives each target its own lift',
    given: {
      owner: 'ehmpathy',
      states: {
        global: null,
        org: {
          orgs: {
            ehmpathy: 'allowed' as const,
            sandpine: 'blocked' as const,
          },
        },
        local: null,
      },
    },
    expect: { lift: null },
  },
  {
    description: 'no state at all is the safe default block, lifted locally',
    given: {
      owner: 'ehmpathy',
      states: { global: null, org: null, local: null },
    },
    expect: { lift: 'rhx radio.uses allow' },
  },
];

describe('asRadioTaskRecordLift', () => {
  TEST_CASES.map((thisCase, index) =>
    given(`[case${index + 1}] ${thisCase.description}`, () => {
      when('[t0] the lift is derived for the record', () => {
        then('it yields the expected lift', () => {
          const lift = asRadioTaskRecordLift({
            record: genRecord({ owner: thisCase.given.owner }),
            states: thisCase.given.states,
          });
          expect(lift).toEqual(thisCase.expect.lift);
        });
      });
    }),
  );
});
