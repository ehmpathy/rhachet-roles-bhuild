import { given, then, when } from 'test-fns';

import { RadioChannel } from '@src/domain.objects/RadioChannel';
import { RadioTaskRecord } from '@src/domain.objects/RadioTaskRecord';
import { RadioTaskRecordStatus } from '@src/domain.objects/RadioTaskRecordStatus';
import { RadioTaskRepo } from '@src/domain.objects/RadioTaskRepo';
import { RadioTaskStatus } from '@src/domain.objects/RadioTaskStatus';

import { asRadioDropOutput } from './asRadioDropOutput';

const genDropped = (): RadioTaskRecord =>
  new RadioTaskRecord({
    key: 'a1b2c3d4e5f60718',
    kind: 'update',
    repo: new RadioTaskRepo({ owner: 'sandpine', name: 'svc-lessons' }),
    via: RadioChannel.GH_ISSUES,
    auth: null,
    idem: null,
    title: null,
    description: null,
    exid: '599',
    status: RadioTaskStatus.CLAIMED,
    recordStatus: RadioTaskRecordStatus.DROPPED,
    reason: 'dropped: claim moot, the issue is closed',
    heldSeq: 1,
    deliveredExid: null,
  });

const genDeliverHeld = (): RadioTaskRecord =>
  new RadioTaskRecord({
    key: 'f0e1d2c3b4a59687',
    kind: 'update',
    repo: new RadioTaskRepo({ owner: 'sandpine', name: 'svc-lessons' }),
    via: RadioChannel.GH_ISSUES,
    auth: null,
    idem: null,
    title: null,
    description: 'board rentals open friday',
    exid: '599',
    status: RadioTaskStatus.DELIVERED,
    recordStatus: RadioTaskRecordStatus.QUEUED,
    reason: null,
    heldSeq: 2,
    deliveredExid: null,
  });

describe('asRadioDropOutput', () => {
  given('[case2] a dropped claim with two updates behind it', () => {
    when('[t0] the drop renders', () => {
      const output = asRadioDropOutput({
        record: genDropped(),
        path: '.behavior/.radio/record.a1b2c3d4e5f60718.json',
        behind: 2,
        deliverNeedsClaim: null,
        isAlreadyDropped: false,
      });

      then('it says the updates behind it now send', () => {
        expect(output).toContain(
          '2 updates to #599 wait behind it; they send next drain',
        );
        expect(output).toMatchSnapshot();
      });
    });

    when('[t1] one update waits behind it', () => {
      const output = asRadioDropOutput({
        record: genDropped(),
        path: '.behavior/.radio/record.a1b2c3d4e5f60718.json',
        behind: 1,
        deliverNeedsClaim: null,
        isAlreadyDropped: false,
      });

      then('it reads in the singular', () => {
        expect(output).toContain(
          '1 update to #599 waits behind it; it sends next drain',
        );
      });
    });
  });

  given('[case1] a dropped update, the #599 shape', () => {
    when('[t0] the drop renders', () => {
      const output = asRadioDropOutput({
        behind: 0,
        deliverNeedsClaim: null,
        isAlreadyDropped: false,
        record: new RadioTaskRecord({
          key: 'a1b2c3d4e5f60718',
          kind: 'update',
          repo: new RadioTaskRepo({ owner: 'sandpine', name: 'svc-lessons' }),
          via: RadioChannel.GH_ISSUES,
          auth: null,
          idem: null,
          title: null,
          description: 'board rentals open friday',
          exid: '599',
          status: RadioTaskStatus.DELIVERED,
          recordStatus: RadioTaskRecordStatus.DROPPED,
          reason: 'dropped: superseded by #604',
          heldSeq: 1,
          deliveredExid: null,
        }),
        path: '.behavior/.radio/record.a1b2c3d4e5f60718.json',
      });

      then('it names the task, the why, and where its words are kept', () => {
        expect(output).toContain('🦫 dropped from the radio, never sent');
        expect(output).toContain('deliver #599 → sandpine/svc-lessons');
        expect(output).toContain('why     = dropped: superseded by #604');
        expect(output).toContain(
          'kept at = .behavior/.radio/record.a1b2c3d4e5f60718.json',
        );
        expect(output).toContain('a re-push of the same task queues it again');
        expect(output).not.toContain('needs a claim');
        expect(output).toMatchSnapshot();
      });
    });
  });

  given('[case3] a retry of a drop already made', () => {
    when('[t0] the drop renders', () => {
      const output = asRadioDropOutput({
        record: genDropped(),
        path: '.behavior/.radio/record.a1b2c3d4e5f60718.json',
        behind: 0,
        deliverNeedsClaim: null,
        isAlreadyDropped: true,
      });

      then('it says naught changed and keeps the first why', () => {
        expect(output).toContain(
          '🦫 already dropped, never sent; naught changed',
        );
        expect(output).toContain(
          'why     = dropped: claim moot, the issue is closed (kept)',
        );
        expect(output).toMatchSnapshot();
      });
    });
  });

  given(
    '[case4] a dropped claim with its deliver behind it (case=10 [t2])',
    () => {
      when('[t0] the drop renders', () => {
        const output = asRadioDropOutput({
          record: genDropped(),
          path: '.behavior/.radio/record.a1b2c3d4e5f60718.json',
          behind: 1,
          deliverNeedsClaim: genDeliverHeld(),
          isAlreadyDropped: false,
        });

        then('it warns the deliver needs a claim, and names both fixes', () => {
          expect(output).toContain(
            '⚠️ the deliver of #599 behind it needs a claim; if #599 is not claimed upstream, the next drain refuses it for good',
          );
          expect(output).toContain(
            're-push the claim: rhx radio.task.push --via gh.issues --into sandpine/svc-lessons --exid 599 --status CLAIMED',
          );
          expect(output).toContain(
            'or drop the deliver too: rhx radio.task.queue del --key f0e1d2c3b4a59687 --why "its claim was dropped"',
          );
          expect(output).toMatchSnapshot();
        });
      });
    },
  );
});
