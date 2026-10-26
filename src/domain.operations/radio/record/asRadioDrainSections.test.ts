import { asIsoDateStamp } from 'iso-time';
import { given, then, when } from 'test-fns';

import { RadioChannel } from '@src/domain.objects/RadioChannel';
import { RadioTask } from '@src/domain.objects/RadioTask';
import { RadioTaskRecord } from '@src/domain.objects/RadioTaskRecord';
import { RadioTaskRecordStatus } from '@src/domain.objects/RadioTaskRecordStatus';
import { RadioTaskRepo } from '@src/domain.objects/RadioTaskRepo';
import { RadioTaskStatus } from '@src/domain.objects/RadioTaskStatus';

import { asRadioDrainSections } from './asRadioDrainSections';
import { asRadioFateRepushedMidSend } from './asRadioFateRepushedMidSend';
import { asRadioFateUnreachedByBudget } from './asRadioFateUnreachedByBudget';
import type { RadioTaskRecordFate } from './RadioTaskRecordFate';

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

const genTask = (input: { exid: string; title: string }): RadioTask =>
  new RadioTask({
    ...input,
    description: 'remind each surfer a day ahead',
    status: RadioTaskStatus.QUEUED,
    repo,
    pushedBy: 'seaturtle',
    pushedAt: asIsoDateStamp('2026-10-25'),
    claimedBy: null,
    claimedAt: null,
    deliveredAt: null,
    branch: null,
  });

const genHeld = (input: {
  record: Partial<RadioTaskRecord>;
  detail: string | null;
  lift?: string | null;
  halt?: boolean;
}): RadioTaskRecordFate => ({
  fate: 'held',
  record: genRecord(input.record),
  lift: input.lift ?? null,
  detail: input.detail,
  halt: input.halt ?? false,
});

describe('asRadioDrainSections', () => {
  given('[case1] a created and a found delivery', () => {
    when('[t0] the sections render', () => {
      const sections = asRadioDrainSections({
        authOverride: null,
        fates: [
          {
            fate: 'delivered',
            record: genRecord({
              recordStatus: RadioTaskRecordStatus.DELIVERED,
              deliveredExid: '601',
            }),
            task: genTask({ exid: '601', title: 'lesson reminders' }),
            outcome: 'created',
          },
          {
            fate: 'delivered',
            record: genRecord({
              key: 'b1b2c3d4e5f60718',
              title: 'board rentals',
              recordStatus: RadioTaskRecordStatus.DELIVERED,
              deliveredExid: '602',
            }),
            task: genTask({ exid: '602', title: 'board rentals' }),
            outcome: 'found',
          },
        ],
      });

      then('both are drained, in drain order, the found one marked', () => {
        expect(sections.drained).toEqual([
          {
            line: 'drained',
            children: [
              '#601 lesson reminders',
              '#602 board rentals (already upstream — marked delivered)',
            ],
          },
        ]);
        expect(sections.closedOrHeld).toEqual([]);
        expect(sections).toMatchSnapshot();
      });
    });
  });

  given('[case2] a refused record', () => {
    when('[t0] the sections render', () => {
      const sections = asRadioDrainSections({
        authOverride: null,
        fates: [
          {
            fate: 'refused',
            record: genRecord({ recordStatus: RadioTaskRecordStatus.REFUSED }),
            detail: 'cannot findsert; entity exists with diff attributes',
          },
        ],
      });

      then(
        'it is closed, with its detail, and says get will not recall it',
        () => {
          expect(sections.drained).toEqual([]);
          expect(sections.closedOrHeld[0]?.line).toEqual(
            'refused — closed, never retried; rhx radio.task.queue get lists it no more, and its reason stays in its record file',
          );
          // the note rides on the head, so every child is a refused record
          expect(sections.closedOrHeld[0]?.children).toEqual([
            'lesson reminders — cannot findsert; entity exists with diff attributes',
          ]);
          expect(sections).toMatchSnapshot();
        },
      );
    });
  });

  given('[case3] two records held at a shut gate', () => {
    when('[t0] the sections render', () => {
      const sections = asRadioDrainSections({
        authOverride: null,
        fates: [
          genHeld({
            record: { reason: 'radio.uses:blocked — global' },
            detail: null,
            lift: 'rhx radio.uses --global allow',
          }),
          genHeld({
            record: {
              key: 'b1b2c3d4e5f60718',
              title: 'board rentals',
              reason: 'radio.uses:blocked — global',
            },
            detail: null,
            lift: 'rhx radio.uses --global allow',
          }),
        ],
      });

      // each gated row carries its own lift, as `queue get` does; a lift at the list level
      // read as a lift for every row, a faulted one beside it included ([case3.1])
      then('each is held, each with its lift under its own row', () => {
        const children = sections.closedOrHeld[0]?.children ?? [];
        expect(sections.closedOrHeld[0]?.line).toEqual('still held');
        expect(children).toHaveLength(2);
        children.forEach((row) =>
          expect(row).toContain(
            'lift it (human): rhx radio.uses --global allow',
          ),
        );
        expect(
          children.filter((row) => row.startsWith('lift it (human)')),
        ).toHaveLength(0);
        expect(children.join('\n')).not.toContain('amend it');
        expect(sections).toMatchSnapshot();
      });
    });
  });

  given(
    '[case3.1] a record at a shut gate beside a record set aside on auth',
    () => {
      when('[t0] the sections render', () => {
        const sections = asRadioDrainSections({
          authOverride: null,
          fates: [
            genHeld({
              record: { reason: 'radio.uses:blocked — default' },
              detail: null,
              lift: 'rhx radio.uses allow',
            }),
            genHeld({
              record: {
                key: 'b1b2c3d4e5f60718',
                title: 'board rentals',
                reason: 'upstream:auth',
              },
              detail: 'github auth failed: the robot token was rejected (401)',
              lift: null,
            }),
          ],
        });

        then(
          'the lift sits under the gated row only, never beside the faulted one',
          () => {
            const [gated, faulted] = sections.closedOrHeld[0]?.children ?? [];
            expect(gated).toContain('lift it (human): rhx radio.uses allow');
            expect(faulted).not.toContain('lift it (human)');
            expect(faulted).toContain(
              'amend it: rhx radio.task.queue set --key b1b2c3d4e5f60718',
            );
            expect(sections.closedOrHeld[0]?.children).toHaveLength(2);
            expect(sections).toMatchSnapshot();
          },
        );
      });
    },
  );

  given('[case4] records set aside, one per fault reason', () => {
    const reasons = [
      {
        reason: 'upstream:access',
        detail: 'GraphQL: Resource not accessible by integration (updateIssue)',
      },
      {
        reason: 'upstream:not-found',
        detail: 'HTTP 404: Not Found (repos/sandpine/svc-gone)',
      },
      { reason: 'upstream:401', detail: 'HTTP 401: Bad credentials' },
      { reason: 'upstream:auth', detail: 'no token in env var GH_TOKEN' },
      { reason: 'upstream:fault', detail: 'unexpected EOF\nsecond line' },
    ];
    when('[t0] the sections render', () => {
      const sections = asRadioDrainSections({
        authOverride: null,
        fates: reasons.map((one, index) =>
          genHeld({
            record: {
              key: `${index}1b2c3d4e5f60718`,
              title: `task ${one.reason}`,
              reason: one.reason,
            },
            detail: one.detail,
          }),
        ),
      });
      const text = JSON.stringify(sections);

      then('each names its fault text, first line only', () => {
        expect(text).toContain(
          'fault: GraphQL: Resource not accessible by integration (updateIssue)',
        );
        expect(text).toContain('fault: HTTP 404: Not Found');
        expect(text).toContain('fault: HTTP 401: Bad credentials');
        expect(text).toContain('fault: unexpected EOF');
        expect(text).not.toContain('second line');
      });

      then(
        'the auth-cured reasons name amend + drop; a bare fault, drop only',
        () => {
          expect(text.match(/amend it:/g)).toHaveLength(4);
          expect(text.match(/or drop it:/g)).toHaveLength(5);
          expect(sections).toMatchSnapshot();
        },
      );
    });
  });

  given('[case5] a rate-limit halt with records behind it', () => {
    when('[t0] the sections render', () => {
      const sections = asRadioDrainSections({
        authOverride: null,
        fates: [
          genHeld({
            record: { reason: 'upstream:rate-limit' },
            detail: 'API rate limit exceeded for installation',
            halt: true,
          }),
          genHeld({
            record: {
              key: 'b1b2c3d4e5f60718',
              title: 'board rentals',
              reason: 'upstream:rate-limit',
            },
            detail: null,
          }),
        ],
      });
      const text = JSON.stringify(sections);

      then(
        'the halter names its fault; no row names an amend or a drop',
        () => {
          expect(text).toContain(
            'fault: API rate limit exceeded for installation',
          );
          expect(text).not.toContain('amend it');
          expect(text).not.toContain('or drop it');
          expect(sections).toMatchSnapshot();
        },
      );
    });
  });

  given('[case7] two updates to one issue, the first set aside', () => {
    when('[t0] the sections render', () => {
      const sections = asRadioDrainSections({
        authOverride: null,
        fates: [
          genHeld({
            record: {
              kind: 'update',
              title: null,
              exid: '599',
              status: RadioTaskStatus.CLAIMED,
              reason: 'upstream:access',
            },
            detail:
              'GraphQL: Resource not accessible by integration (updateIssue)',
          }),
          genHeld({
            record: {
              key: 'b1b2c3d4e5f60718',
              kind: 'update',
              title: null,
              exid: '599',
              status: RadioTaskStatus.DELIVERED,
              reason: 'behind:a1b2c3d4e5f60718 (same issue #599)',
            },
            detail:
              'behind claim #599 on the same issue: unsent, sends once it lands or is dropped',
          }),
        ],
      });
      const rows = sections.closedOrHeld[0]?.children ?? [];
      const rowBehind = rows.find((row) => row.includes('(same issue #599)'));

      then(
        'the record behind reads as a wait, with no fault and no fix',
        () => {
          expect(rowBehind).toBeDefined();
          expect(rowBehind).toContain(
            'unsent, sends once it lands or is dropped',
          );
          expect(rowBehind).not.toContain('fault:');
          expect(rowBehind).not.toContain('amend it');
          expect(rowBehind).not.toContain('or drop it');
          expect(rowBehind).not.toContain('behind:a1b2c3d4e5f60718');
        },
      );

      then('the record ahead still names its fault and its fixes', () => {
        const text = rows.join('\n');
        expect(text).toContain('fault: GraphQL: Resource not accessible');
        expect(text.match(/amend it:/g)).toHaveLength(1);
        expect(sections).toMatchSnapshot();
      });
    });
  });

  given('[case8] a record the drain did not reach on its budget', () => {
    when('[t0] the sections render, with a prior fault still on record', () => {
      const sections = asRadioDrainSections({
        authOverride: null,
        fates: [
          asRadioFateUnreachedByBudget({
            record: genRecord({ reason: 'upstream:access' }),
          }),
        ],
      });
      const text = JSON.stringify(sections);

      then('it reads not attempted, with no stale fault and no fix', () => {
        expect(text).toContain('(not attempted)');
        expect(text).toContain('this drain spent its send budget');
        expect(text).not.toContain('upstream:access');
        expect(text).not.toContain('fault:');
        expect(text).not.toContain('amend it');
        expect(text).not.toContain('or drop it');
        expect(sections).toMatchSnapshot();
      });
    });
  });

  given('[case9] a record a re-push rewrote mid-send', () => {
    when('[t0] the sections render, with a prior fault still on record', () => {
      const sections = asRadioDrainSections({
        authOverride: null,
        fates: [
          asRadioFateRepushedMidSend({
            record: genRecord({ reason: 'upstream:401' }),
          }),
        ],
      });
      const text = JSON.stringify(sections);

      then('it reads prior copy sent, with no stale fault and no fix', () => {
        expect(text).toContain('(prior copy sent; new request waits)');
        expect(text).not.toContain('(not attempted)');
        expect(text).toContain('the next drain sends the new request');
        expect(text).not.toContain('upstream:401');
        expect(text).not.toContain('fault:');
        expect(text).not.toContain('amend it');
        expect(text).not.toContain('or drop it');
        expect(sections).toMatchSnapshot();
      });
    });
  });

  given('[case6] a record already as-human, set aside on a 401', () => {
    when('[t0] the sections render', () => {
      const sections = asRadioDrainSections({
        authOverride: null,
        fates: [
          genHeld({
            record: { reason: 'upstream:401', auth: 'as-human' },
            detail: 'HTTP 401: Bad credentials',
          }),
        ],
      });
      const text = JSON.stringify(sections);

      then('it names the gh login, never a second as-human amend', () => {
        expect(text).toContain('gh auth status');
        expect(text).not.toContain('--auth as-human');
        expect(sections).toMatchSnapshot();
      });
    });
  });
});
