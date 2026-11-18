import { given, then } from 'test-fns';

import { RadioChannel } from '@src/domain.objects/RadioChannel';
import type { RadioTask } from '@src/domain.objects/RadioTask';
import { RadioTaskRecord } from '@src/domain.objects/RadioTaskRecord';
import { RadioTaskRecordStatus } from '@src/domain.objects/RadioTaskRecordStatus';
import { RadioTaskRepo } from '@src/domain.objects/RadioTaskRepo';

import { asRadioFateDelivered } from './asRadioFateDelivered';

const RECORD = new RadioTaskRecord({
  key: 'a1b2c3d4e5f60718',
  kind: 'comment',
  repo: new RadioTaskRepo({ owner: 'sandpine', name: 'svc-lessons' }),
  via: RadioChannel.GH_ISSUES,
  auth: null,
  idem: null,
  title: null,
  description: 'the tide table test passes now',
  exid: '489',
  status: null,
  recordStatus: RadioTaskRecordStatus.DELIVERED,
  reason: null,
  heldSeq: 1,
  deliveredExid: '489',
});

describe('asRadioFateDelivered', () => {
  given('a comment send that landed', () => {
    const comment = {
      url: 'https://github.com/sandpine/svc-lessons/issues/489#issuecomment-1',
    };

    then('the fate carries the comment and its outcome, and no task', () => {
      const fate = asRadioFateDelivered({
        record: RECORD,
        sent: { exid: '489', comment, outcome: 'posted' },
      });
      expect(fate).toEqual({
        fate: 'delivered',
        record: RECORD,
        comment,
        outcome: 'posted',
      });
      expect('task' in fate).toBe(false);
    });
  });

  given('a task send that landed', () => {
    const task = { exid: '489' } as RadioTask; // note: a fixture; the map only carries the task through by identity

    then('the fate carries the task and its outcome, and no comment', () => {
      const fate = asRadioFateDelivered({
        record: RECORD,
        sent: { exid: '489', task, outcome: 'created' },
      });
      expect(fate).toEqual({
        fate: 'delivered',
        record: RECORD,
        task,
        outcome: 'created',
      });
      expect('comment' in fate).toBe(false);
    });
  });
});
