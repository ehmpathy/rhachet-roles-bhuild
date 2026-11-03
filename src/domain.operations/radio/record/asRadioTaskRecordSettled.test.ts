import { MalfunctionError } from 'helpful-errors';
import { getError, given, then, when } from 'test-fns';

import { RadioChannel } from '@src/domain.objects/RadioChannel';
import { RadioTaskRecord } from '@src/domain.objects/RadioTaskRecord';
import { RadioTaskRecordStatus } from '@src/domain.objects/RadioTaskRecordStatus';
import { RadioTaskRepo } from '@src/domain.objects/RadioTaskRepo';

import { asRadioTaskRecordSettled } from './asRadioTaskRecordSettled';

const HEADLINE_OLD =
  'GraphQL: Resource not accessible by integration (updateIssue)';

const recordRead = new RadioTaskRecord({
  key: 'a1b2c3d4e5f60718',
  kind: 'update',
  repo: new RadioTaskRepo({ owner: 'sandpine', name: 'svc-lessons' }),
  via: RadioChannel.GH_ISSUES,
  auth: null,
  idem: null,
  title: 'lesson reminders',
  description: 'details',
  exid: '673',
  status: null,
  recordStatus: RadioTaskRecordStatus.QUEUED,
  reason: 'upstream:access',
  reasonHeadline: HEADLINE_OLD,
  heldSeq: 1,
  deliveredExid: null,
});

const TEST_CASES = [
  {
    description: 'a new reason with no words of its own clears the old words',
    given: { change: { reason: 'upstream:transient' } },
    expect: { reason: 'upstream:transient', reasonHeadline: null },
  },
  {
    description: 'a new reason with its own words keeps those words',
    given: {
      change: { reason: 'upstream:fault', reasonHeadline: 'HTTP 422' },
    },
    expect: { reason: 'upstream:fault', reasonHeadline: 'HTTP 422' },
  },
  {
    description: 'a delivery clears the reason and its words',
    given: {
      change: {
        reason: null,
        recordStatus: RadioTaskRecordStatus.DELIVERED,
      },
    },
    expect: { reason: null, reasonHeadline: null },
  },
  {
    description: 'a change that leaves the reason alone keeps its words',
    given: { change: { heldSeq: 2 } },
    expect: { reason: 'upstream:access', reasonHeadline: HEADLINE_OLD },
  },
  {
    description:
      'a headline passed as undefined names none: a new reason still clears the old words, never writes undefined',
    given: {
      change: { reason: 'upstream:transient', reasonHeadline: undefined },
    },
    expect: { reason: 'upstream:transient', reasonHeadline: null },
  },
  {
    description:
      'a drop, as `del` writes it, clears the words of the fault it ends',
    given: {
      change: {
        reason: 'dropped: superseded by #604',
        recordStatus: RadioTaskRecordStatus.DROPPED,
      },
    },
    expect: { reason: 'dropped: superseded by #604', reasonHeadline: null },
  },
];

describe('asRadioTaskRecordSettled', () => {
  given('[case1] words that hold a token', () => {
    when('[t0] they are settled onto the record', () => {
      then('they are refused loud, never written', async () => {
        const error = await getError(async () =>
          asRadioTaskRecordSettled({
            record: recordRead,
            change: {
              reason: 'upstream:access',
              reasonHeadline: `refused for ghp_${'a'.repeat(36)}`,
            },
          }),
        );
        expect(error).toBeInstanceOf(MalfunctionError);
        expect(error.message).toContain('a tracked file must not keep it');
      });
    });
  });

  given('[case2] words that hold a clock', () => {
    when('[t0] they are settled onto the record', () => {
      then('they are refused loud, never written', async () => {
        const error = await getError(async () =>
          asRadioTaskRecordSettled({
            record: recordRead,
            change: {
              reason: 'upstream:access',
              reasonHeadline: 'refused at 14:02:11',
            },
          }),
        );
        expect(error).toBeInstanceOf(MalfunctionError);
      });
    });
  });

  TEST_CASES.map((thisCase) =>
    given(`[case3] a change: ${thisCase.description}`, () => {
      when('[t0] it is settled onto the record', () => {
        then('the reason and its words land as expected', () => {
          const output = asRadioTaskRecordSettled({
            record: recordRead,
            change: thisCase.given.change,
          });
          expect({
            reason: output.reason,
            reasonHeadline: output.reasonHeadline,
          }).toEqual(thisCase.expect);
        });
      });
    }),
  );
});
