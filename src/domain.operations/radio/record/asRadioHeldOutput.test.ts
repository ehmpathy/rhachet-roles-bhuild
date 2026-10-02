import { asIsoTimeStamp } from 'iso-time';
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
    title: input.title,
    description: 'details',
    exid: null,
    status: null,
    recordStatus: RadioTaskRecordStatus.QUEUED,
    reason: input.reason ?? 'radio.uses:blocked — global',
    heldAt: asIsoTimeStamp('2026-09-29T09:14:00Z'),
    heldSeq: 1,
    settledAt: null,
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

      then('it is one line with the count and the lift', () => {
        expect(output).toEqual(
          '🦫 3 tasks held for the radio · lift: rhx radio.uses --global allow · next push delivers them',
        );
        expect(output).toMatchSnapshot();
      });
    });

    when('[t1] the list renders', () => {
      const output = asRadioHeldOutput({ held, mode: 'list' });

      then('it lists each held task and the lift', () => {
        expect(output).toContain('🦫 held for the radio');
        expect(output).toContain(
          'a → ehmpathy/rhachet (radio.uses:blocked — global)',
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
        expect(output).not.toContain('lift it (human):');
        expect(output).toContain(
          'the radio is open, so the next push delivers the backlog first',
        );
        expect(output).toMatchSnapshot();
      });
    });
  });

  given('[case2.1] tasks held on an upstream fault, the gate open', () => {
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
            '🦫 3 tasks held for the radio · lift: rhx radio.uses --global allow · fix: upstream:auth · next push delivers them',
          );
          expect(output).not.toContain('the radio is open');
          expect(output).toMatchSnapshot();
        },
      );
    });

    when('[t1] the list renders', () => {
      const output = asRadioHeldOutput({ held, mode: 'list' });

      then('it names the fault to fix beside the lift', () => {
        expect(output).toContain('fix it: upstream:auth');
        expect(output).not.toContain('the radio is open');
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
});
