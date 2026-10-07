import { asIsoDateStamp, asIsoTimeStamp } from 'iso-time';
import { given, then, when } from 'test-fns';

import { RadioChannel } from '@src/domain.objects/RadioChannel';
import { RadioTask } from '@src/domain.objects/RadioTask';
import { RadioTaskRecord } from '@src/domain.objects/RadioTaskRecord';
import { RadioTaskRecordStatus } from '@src/domain.objects/RadioTaskRecordStatus';
import { RadioTaskRepo } from '@src/domain.objects/RadioTaskRepo';
import { RadioTaskStatus } from '@src/domain.objects/RadioTaskStatus';

import { asRadioPushOutput } from './asRadioPushOutput';

const repo = new RadioTaskRepo({ owner: 'ehmpathy', name: 'rhachet' });
const repoShut = new RadioTaskRepo({
  owner: 'sandpine',
  name: 'svc-reservations',
});

const genRecord = (input: Partial<RadioTaskRecord>): RadioTaskRecord =>
  new RadioTaskRecord({
    key: 'k',
    kind: 'create',
    repo,
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
    ...input,
  });

const genTask = (input: { exid: string; title: string }): RadioTask =>
  new RadioTask({
    ...input,
    description: 'the test flakes',
    status: RadioTaskStatus.QUEUED,
    repo,
    pushedBy: 'seaturtle',
    pushedAt: asIsoDateStamp('2026-09-29'),
    claimedBy: null,
    claimedAt: null,
    deliveredAt: null,
    branch: null,
  });

const homeRoute = {
  dir: '.behavior/v2026_09_28.fix-radio-recorder/.radio',
  place: 'route' as const,
  binds: ['.behavior/v2026_09_28.fix-radio-recorder'],
};

describe('asRadioPushOutput', () => {
  given('[case1] an open push with no backlog (C1)', () => {
    when('[t0] the push is delivered', () => {
      const output = asRadioPushOutput({
        pushed: {
          fate: 'delivered',
          record: genRecord({
            recordStatus: RadioTaskRecordStatus.DELIVERED,
            deliveredExid: '414',
          }),
          task: genTask({ exid: '414', title: 'fix flaky keyrack test' }),
          outcome: 'created',
        },
        others: [],
        home: homeRoute,
        backlog: 0,
      });

      then('it reads as today, plus where it was recorded', () => {
        expect(output).toContain('🦫 onto the pile!');
        expect(output).toContain(`recorded: ${homeRoute.dir}/`);
        expect(output).toMatchSnapshot();
      });
    });
  });

  given('[case2] a push blocked by radio.uses (C10)', () => {
    when('[t0] the push is held with one other held', () => {
      const output = asRadioPushOutput({
        pushed: {
          fate: 'held',
          record: genRecord({ reason: 'radio.uses:blocked — global' }),
          lift: 'rhx radio.uses --global allow',
          detail: null,
          halt: false,
        },
        others: [],
        home: homeRoute,
        backlog: 2,
      });

      then('it leads with held, the reason, the backlog, and the lift', () => {
        expect(output).toContain('🦫 held for the radio');
        expect(output).toContain('QUEUED (radio.uses:blocked — global)');
        expect(output).toContain('backlog = 2 await the radio');
        expect(output).toContain(
          'lift it (human): rhx radio.uses --global allow',
        );
        expect(output).toMatchSnapshot();
      });
    });
  });

  given('[case3] an unbound push held by an upstream fault (R2, C13)', () => {
    when('[t0] the token was rejected', () => {
      const output = asRadioPushOutput({
        pushed: {
          fate: 'held',
          record: genRecord({ reason: 'upstream:401' }),
          lift: null,
          detail:
            'github auth failed: the robot token was rejected by github (401)\n  • unblock now — re-run as human: --auth as-human',
          halt: true,
        },
        others: [],
        home: { dir: '.behavior/.radio', place: 'unbound', binds: [] },
        backlog: 1,
      });

      then('it names the place and the fix', () => {
        expect(output).toContain('(no route bound to this branch)');
        expect(output).toContain('fix it: github auth failed');
        expect(output).toMatchSnapshot();
      });
    });

    when('[t1] the branch is bound to two routes (R3)', () => {
      const output = asRadioPushOutput({
        pushed: {
          fate: 'held',
          record: genRecord({ reason: 'radio.uses:blocked — default' }),
          lift: 'rhx radio.uses allow',
          detail: null,
          halt: false,
        },
        others: [],
        home: {
          dir: '.behavior/.radio',
          place: 'multibound',
          binds: ['.behavior/v2026_01_01.alpha', '.behavior/v2026_01_02.beta'],
        },
        backlog: 1,
      });

      then('it names the place and both binds', () => {
        expect(output).toContain(
          'held at = .behavior/.radio/ (branch bound to 2 routes: .behavior/v2026_01_01.alpha, .behavior/v2026_01_02.beta)',
        );
        expect(output).toMatchSnapshot();
      });
    });

    when('[t2] the fault hint carries its own tree', () => {
      const output = asRadioPushOutput({
        pushed: {
          fate: 'held',
          record: genRecord({ reason: 'upstream:auth' }),
          lift: null,
          detail: [
            'unrecognized --auth mode: some-unknown-mode',
            '',
            'supported modes:',
            '├─ as-robot:env(VAR)',
            '│     use token from environment variable',
            '└─ as-human',
            '      use gh cli logged-in session (interactive)',
          ].join('\n'),
          halt: true,
        },
        others: [],
        home: { dir: '.behavior/.radio', place: 'unbound', binds: [] },
        backlog: 1,
      });

      then(
        'the inner tree nests under its header, with no second glyph per line',
        () => {
          expect(output).not.toContain('├─ ├─');
          expect(output).not.toContain('├─ │');
          expect(output).toContain('│  ├─ as-robot:env(VAR)');
          expect(output).toContain(
            '│        use gh cli logged-in session (interactive)',
          );
          expect(output).toMatchSnapshot();
        },
      );
    });
  });

  given('[case3.1] a delivered record that lacks its exid', () => {
    when('[t0] the output renders', () => {
      then('it fails loud, never prints #null', () => {
        expect(() =>
          asRadioPushOutput({
            pushed: {
              fate: 'landed',
              record: genRecord({
                recordStatus: RadioTaskRecordStatus.DELIVERED,
                deliveredExid: null,
              }),
            },
            others: [],
            home: homeRoute,
            backlog: 0,
          }),
        ).toThrow('delivered radio task record lacks its exid');
      });
    });
  });

  given('[case4] an open push that drains a backlog (C4, C20, U3)', () => {
    when(
      '[t0] one drains, one is refused, one stays held behind a shut org',
      () => {
        const output = asRadioPushOutput({
          pushed: {
            fate: 'delivered',
            record: genRecord({
              key: 'new',
              title: 'retry race in route.bounce',
              recordStatus: RadioTaskRecordStatus.DELIVERED,
              deliveredExid: '415',
            }),
            task: genTask({ exid: '415', title: 'retry race in route.bounce' }),
            outcome: 'created',
          },
          others: [
            {
              fate: 'delivered',
              record: genRecord({
                key: 'a',
                recordStatus: RadioTaskRecordStatus.DELIVERED,
                deliveredExid: '412',
              }),
              task: genTask({ exid: '412', title: 'fix flaky keyrack test' }),
              outcome: 'created',
            },
            {
              fate: 'refused',
              record: genRecord({
                key: 'b',
                kind: 'update',
                title: null,
                exid: '411',
                status: RadioTaskStatus.CLAIMED,
                recordStatus: RadioTaskRecordStatus.REFUSED,
              }),
              detail: 'task already claimed by different branch',
            },
            {
              fate: 'held',
              record: genRecord({
                key: 'c',
                repo: repoShut,
                title: 'guard gateway',
                reason: 'radio.uses:blocked — org',
              }),
              lift: 'rhx radio.uses --org sandpine allow',
              detail: null,
              halt: false,
            },
          ],
          home: homeRoute,
          backlog: 1,
        });

        then(
          'it lists drained, pushed, refused, still held, and the backlog',
          () => {
            expect(output).toContain(
              '🦫 back in the river! part of the backlog is delivered',
            );
            expect(output).not.toContain('river! the backlog is delivered');
            expect(output).toContain(
              '#412 fix flaky keyrack test (held since 2026-09-29T09:14Z)',
            );
            expect(output).toContain(
              '#415 retry race in route.bounce (created)',
            );
            expect(output).toContain(
              'claim #411 — task already claimed by different branch',
            );
            expect(output).toContain(
              'guard gateway → sandpine/svc-reservations (radio.uses:blocked — org)',
            );
            expect(output).toMatchSnapshot();
          },
        );
      },
    );
  });

  given(
    '[case5] a delivered push re-pushed while the gate is shut (C9)',
    () => {
      when('[t0] the record already landed', () => {
        const output = asRadioPushOutput({
          pushed: {
            fate: 'landed',
            record: genRecord({
              recordStatus: RadioTaskRecordStatus.DELIVERED,
              deliveredExid: '412',
            }),
          },
          others: [],
          home: homeRoute,
          backlog: 0,
        });

        then('it says already delivered, with the exid', () => {
          expect(output).toContain('🦫 already delivered');
          expect(output).toContain('exid    = #412');
          expect(output).toMatchSnapshot();
        });
      });
    },
  );

  given(
    '[case6] a held claim replays onto a task claimed elsewhere (U3)',
    () => {
      when('[t0] the push itself is refused', () => {
        const output = asRadioPushOutput({
          pushed: {
            fate: 'refused',
            record: genRecord({
              kind: 'update',
              title: null,
              exid: '412',
              status: RadioTaskStatus.CLAIMED,
              recordStatus: RadioTaskRecordStatus.REFUSED,
            }),
            detail: 'task already claimed by different branch',
          },
          others: [],
          home: homeRoute,
          backlog: 0,
        });

        then('it reads refused, closed, never retried', () => {
          expect(output).toContain('🦫 refused upstream');
          expect(output).toContain('closed, never retried');
          expect(output).toMatchSnapshot();
        });
      });
    },
  );

  given(
    '[case7] a delivered push re-pushed through an open gate, with a backlog (C3, C6, case=4 t0)',
    () => {
      when('[t0] the backlog drains; one record had lost its mark', () => {
        const output = asRadioPushOutput({
          pushed: {
            fate: 'landed',
            record: genRecord({
              recordStatus: RadioTaskRecordStatus.DELIVERED,
              deliveredExid: '412',
            }),
          },
          others: [
            {
              fate: 'delivered',
              record: genRecord({
                key: 'lost',
                title: 'guard absent sponsor',
                recordStatus: RadioTaskRecordStatus.DELIVERED,
                deliveredExid: '413',
              }),
              task: genTask({ exid: '413', title: 'guard absent sponsor' }),
              outcome: 'found',
            },
          ],
          home: homeRoute,
          backlog: 0,
        });

        then(
          'it says already delivered, and lists the drained backlog, the lost mark named',
          () => {
            expect(output).toContain('🦫 already delivered');
            expect(output).toContain('exid    = #412');
            expect(output).toContain(
              '#413 guard absent sponsor (held since 2026-09-29T09:14Z; already upstream — marked delivered)',
            );
            expect(output).toContain('backlog = 0');
            expect(output).toMatchSnapshot();
          },
        );
      });
    },
  );

  given(
    '[case8] a refused push through an open gate, with a backlog behind it (U3, C4)',
    () => {
      when('[t0] the push is refused; one drains, one stays held', () => {
        const output = asRadioPushOutput({
          pushed: {
            fate: 'refused',
            record: genRecord({
              kind: 'update',
              title: null,
              exid: '411',
              status: RadioTaskStatus.CLAIMED,
              recordStatus: RadioTaskRecordStatus.REFUSED,
            }),
            detail: 'task already claimed by different branch',
          },
          others: [
            {
              fate: 'delivered',
              record: genRecord({
                key: 'a',
                recordStatus: RadioTaskRecordStatus.DELIVERED,
                deliveredExid: '412',
              }),
              task: genTask({ exid: '412', title: 'fix flaky keyrack test' }),
              outcome: 'created',
            },
            {
              fate: 'held',
              record: genRecord({
                key: 'c',
                repo: repoShut,
                title: 'guard gateway',
                reason: 'radio.uses:blocked — org',
              }),
              lift: 'rhx radio.uses --org sandpine allow',
              detail: null,
              halt: false,
            },
          ],
          home: homeRoute,
          backlog: 1,
        });

        then(
          'it reads refused, and lists the drained, the still held, and the backlog',
          () => {
            expect(output).toContain('🦫 refused upstream');
            expect(output).toContain('closed, never retried');
            expect(output).toContain(
              '#412 fix flaky keyrack test (held since 2026-09-29T09:14Z)',
            );
            expect(output).toContain(
              'guard gateway → sandpine/svc-reservations (radio.uses:blocked — org)',
            );
            expect(output).toContain('backlog = 1');
            expect(output).toMatchSnapshot();
          },
        );
      });
    },
  );
});
