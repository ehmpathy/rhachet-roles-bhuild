import { asIsoDateStamp } from 'iso-time';
import { given, then, when } from 'test-fns';

import { RadioChannel } from '@src/domain.objects/RadioChannel';
import { RadioTask } from '@src/domain.objects/RadioTask';
import { RadioTaskRecord } from '@src/domain.objects/RadioTaskRecord';
import { RadioTaskRecordStatus } from '@src/domain.objects/RadioTaskRecordStatus';
import { RadioTaskRepo } from '@src/domain.objects/RadioTaskRepo';
import { RadioTaskStatus } from '@src/domain.objects/RadioTaskStatus';

import { asRadioDrainOutput } from './asRadioDrainOutput';
import { asRadioFateRepushedMidSend } from './asRadioFateRepushedMidSend';
import { asRadioFateUnreachedByBudget } from './asRadioFateUnreachedByBudget';

const repo = new RadioTaskRepo({ owner: 'sandpine', name: 'svc-lessons' });

const genRecord = (input: Partial<RadioTaskRecord>): RadioTaskRecord =>
  new RadioTaskRecord({
    key: 'a1b2c3d4e5f60718',
    kind: 'create',
    repo,
    via: RadioChannel.GH_ISSUES,
    auth: null,
    idem: null,
    title: 'lesson reminders',
    description: 'remind each surfer a day ahead',
    exid: null,
    status: null,
    recordStatus: RadioTaskRecordStatus.QUEUED,
    reason: null,
    heldSeq: 1,
    deliveredExid: null,
    ...input,
  });

const taskDelivered = new RadioTask({
  exid: '603',
  title: 'board rentals',
  description: 'open friday',
  status: RadioTaskStatus.QUEUED,
  repo,
  pushedBy: 'seaturtle',
  pushedAt: asIsoDateStamp('2026-10-25'),
  claimedBy: null,
  claimedAt: null,
  deliveredAt: null,
  branch: null,
});

describe('asRadioDrainOutput', () => {
  given('[case1] an empty queue', () => {
    when('[t0] the drain renders', () => {
      const output = asRadioDrainOutput({
        authOverride: null,
        fates: [],
        backlog: 0,
      });

      then('it says naught is held', () => {
        expect(output).toEqual('🦫 naught held for the radio');
      });
    });
  });

  given('[case2] one delivered past a set-aside head (#511)', () => {
    when('[t0] the drain renders', () => {
      const output = asRadioDrainOutput({
        authOverride: null,
        fates: [
          {
            fate: 'held',
            record: genRecord({
              kind: 'update',
              title: null,
              exid: '599',
              status: RadioTaskStatus.DELIVERED,
              reason: 'upstream:access',
            }),
            lift: null,
            detail:
              'GraphQL: Resource not accessible by integration (updateIssue)',
            halt: false,
          },
          {
            fate: 'delivered',
            record: genRecord({
              key: 'b1b2c3d4e5f60718',
              title: 'board rentals',
              recordStatus: RadioTaskRecordStatus.DELIVERED,
              deliveredExid: '603',
            }),
            task: taskDelivered,
            outcome: 'created',
          },
        ],
        backlog: 1,
      });

      then(
        'it says part of the backlog went, the head named with its fix',
        () => {
          expect(output).toContain(
            '🦫 back in the river! part of the backlog is delivered',
          );
          expect(output).not.toContain('back in the river! the backlog');
          expect(output).toContain('#603 board rentals');
          expect(output).toContain(
            'deliver #599 → sandpine/svc-lessons (upstream:access)',
          );
          expect(output).toContain(
            'fault: GraphQL: Resource not accessible by integration (updateIssue)',
          );
          expect(output).toContain(
            'amend it: rhx radio.task.queue set --key a1b2c3d4e5f60718',
          );
          expect(output).toContain('backlog = 1 awaits the radio');
          expect(output).toMatchSnapshot();
        },
      );
    });
  });

  given('[case3] a halt, naught through', () => {
    when('[t0] the drain renders', () => {
      const output = asRadioDrainOutput({
        authOverride: null,
        fates: [
          {
            fate: 'held',
            record: genRecord({ reason: 'upstream:rate-limit' }),
            lift: null,
            detail: 'API rate limit exceeded',
            halt: true,
          },
          {
            fate: 'held',
            record: genRecord({
              key: 'b1b2c3d4e5f60718',
              title: 'board rentals',
              reason: 'upstream:rate-limit',
            }),
            lift: null,
            detail: null,
            halt: false,
          },
        ],
        backlog: 2,
      });

      then('it says naught was delivered and counts the backlog', () => {
        expect(output).toContain(
          '🦫 naught delivered; the backlog still waits',
        );
        expect(output).not.toContain('back in the river');
        expect(output).toContain('fault: API rate limit exceeded');
        expect(output).toContain('backlog = 2 await the radio');
        expect(output).not.toContain('or drop it');
        expect(output).toMatchSnapshot();
      });
    });
  });

  given('[case4] a gate-held record at a clear drain', () => {
    when('[t0] the drain renders', () => {
      const output = asRadioDrainOutput({
        authOverride: null,
        fates: [
          {
            fate: 'held',
            record: genRecord({ reason: 'radio.uses:blocked — org' }),
            lift: 'rhx radio.uses --org sandpine allow',
            detail: null,
            halt: false,
          },
        ],
        backlog: 1,
      });

      then('it names the lift for a human', () => {
        expect(output).toContain(
          'lift it (human): rhx radio.uses --org sandpine allow',
        );
        expect(output).not.toContain('fault:');
        expect(output).toMatchSnapshot();
      });
    });
  });

  given('[case5] every record delivered', () => {
    when('[t0] the drain renders', () => {
      const output = asRadioDrainOutput({
        authOverride: null,
        fates: [
          {
            fate: 'delivered',
            record: genRecord({
              recordStatus: RadioTaskRecordStatus.DELIVERED,
              deliveredExid: '603',
            }),
            task: taskDelivered,
            outcome: 'created',
          },
        ],
        backlog: 0,
      });

      then(
        'it says the backlog is delivered, the same words a push uses, and the count is clear',
        () => {
          expect(output).toContain(
            '🦫 back in the river! the backlog is delivered',
          );
          expect(output).toContain('backlog = 0');
          expect(output).toMatchSnapshot();
        },
      );
    });
  });

  given('[case6] the only record the drain sent was refused', () => {
    when('[t0] the drain renders', () => {
      const output = asRadioDrainOutput({
        authOverride: null,
        fates: [
          {
            fate: 'refused',
            record: genRecord({
              kind: 'update',
              title: null,
              exid: '999',
              status: RadioTaskStatus.CLAIMED,
              recordStatus: RadioTaskRecordStatus.REFUSED,
            }),
            detail: 'BadRequestError: task not found',
          },
        ],
        backlog: 0,
      });

      then('it never cheers: naught delivered, upstream refused', () => {
        expect(output).toContain(
          '🦫 naught delivered; upstream refused what the drain sent',
        );
        expect(output).not.toContain('back in the river');
        expect(output).not.toContain('is delivered');
        expect(output).toMatchSnapshot();
      });
    });
  });

  given('[case7] a drain whose send budget ran out (T)', () => {
    when('[t0] the drain renders', () => {
      const output = asRadioDrainOutput({
        authOverride: null,
        fates: [
          {
            fate: 'delivered',
            record: genRecord({
              recordStatus: RadioTaskRecordStatus.DELIVERED,
              deliveredExid: '603',
            }),
            task: taskDelivered,
            outcome: 'created',
          },
          asRadioFateUnreachedByBudget({
            record: genRecord({
              key: 'b1b2c3d4e5f60718',
              title: 'wetsuit sizes',
            }),
          }),
        ],
        backlog: 1,
      });

      then(
        'the record left reads not attempted, with the one move: drain again',
        () => {
          expect(output).toContain(
            'b1b2c3d4e5f60718 wetsuit sizes → sandpine/svc-lessons (not attempted)',
          );
          expect(output).toContain(
            'not attempted: this drain spent its send budget',
          );
          expect(output).not.toContain('not reached');
          expect(output).toMatchSnapshot();
        },
      );
    });
  });

  given('[case8] a record a re-push rewrote mid-send', () => {
    when('[t0] the drain renders', () => {
      const output = asRadioDrainOutput({
        authOverride: null,
        fates: [
          asRadioFateRepushedMidSend({
            record: genRecord({ title: 'wetsuit sizes' }),
          }),
        ],
        backlog: 1,
      });

      then(
        'it says the prior copy went and the new request waits, never not attempted or faulted',
        () => {
          expect(output).toContain(
            '🦫 a prior copy went upstream; its new request still waits',
          );
          expect(output).not.toContain('naught delivered');
          expect(output).toContain(
            'a1b2c3d4e5f60718 wetsuit sizes → sandpine/svc-lessons (prior copy sent; new request waits)',
          );
          expect(output).not.toContain('(not attempted)');
          expect(output).toContain('a re-push rewrote this record');
          expect(output).not.toContain('fault:');
          expect(output).toMatchSnapshot();
        },
      );
    });
  });
});
