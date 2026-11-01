import { given, then, when } from 'test-fns';

import { RadioChannel } from '@src/domain.objects/RadioChannel';
import { RadioTaskRecord } from '@src/domain.objects/RadioTaskRecord';
import { RadioTaskRecordStatus } from '@src/domain.objects/RadioTaskRecordStatus';
import { RadioTaskRepo } from '@src/domain.objects/RadioTaskRepo';
import { RadioTaskStatus } from '@src/domain.objects/RadioTaskStatus';

import { getOneRadioFateAheadOnIssue } from './getOneRadioFateAheadOnIssue';
import type { RadioTaskRecordFate } from './RadioTaskRecordFate';

const repo = new RadioTaskRepo({ owner: 'sandpine', name: 'svc-bookings' });

const genUpdate = (input: {
  key: string;
  exid: string | null;
  status: RadioTaskStatus;
  reason: string | null;
}): RadioTaskRecord =>
  new RadioTaskRecord({
    key: input.key,
    kind: input.exid === null ? 'create' : 'update',
    repo,
    via: RadioChannel.GH_ISSUES,
    auth: null,
    idem: null,
    title: input.exid === null ? 'board rentals' : null,
    description: null,
    exid: input.exid,
    status: input.status,
    recordStatus: RadioTaskRecordStatus.QUEUED,
    reason: input.reason,
    heldSeq: 1,
    deliveredExid: null,
  });

const genHeld = (input: {
  record: RadioTaskRecord;
  lift: string | null;
}): RadioTaskRecordFate => ({
  fate: 'held',
  record: input.record,
  lift: input.lift,
  detail: null,
  halt: false,
});

const recordBehind = genUpdate({
  key: 'b1b2c3d4e5f60718',
  exid: '599',
  status: RadioTaskStatus.DELIVERED,
  reason: null,
});

describe('getOneRadioFateAheadOnIssue', () => {
  given('[case1] an earlier update to the same issue, set aside', () => {
    when('[t0] the record behind looks ahead', () => {
      then('it finds the record ahead', () => {
        const ahead = getOneRadioFateAheadOnIssue({
          record: recordBehind,
          fates: [
            genHeld({
              record: genUpdate({
                key: 'a1b2c3d4e5f60718',
                exid: '599',
                status: RadioTaskStatus.CLAIMED,
                reason: 'upstream:access',
              }),
              lift: null,
            }),
          ],
        });
        expect(ahead?.record.key).toEqual('a1b2c3d4e5f60718');
      });
    });
  });

  given('[case2] an earlier update to the same issue, held at a gate', () => {
    when('[t0] the record behind looks ahead', () => {
      then(
        'it finds none: the record behind meets the same gate on its own',
        () => {
          const ahead = getOneRadioFateAheadOnIssue({
            record: recordBehind,
            fates: [
              genHeld({
                record: genUpdate({
                  key: 'a1b2c3d4e5f60718',
                  exid: '599',
                  status: RadioTaskStatus.CLAIMED,
                  reason: 'radio.uses:blocked — org',
                }),
                lift: 'rhx radio.uses --org sandpine allow',
              }),
            ],
          });
          expect(ahead).toBeNull();
        },
      );
    });
  });

  given('[case3] an earlier update to another issue, set aside', () => {
    when('[t0] the record behind looks ahead', () => {
      then('it finds none', () => {
        const ahead = getOneRadioFateAheadOnIssue({
          record: recordBehind,
          fates: [
            genHeld({
              record: genUpdate({
                key: 'a1b2c3d4e5f60718',
                exid: '600',
                status: RadioTaskStatus.CLAIMED,
                reason: 'upstream:access',
              }),
              lift: null,
            }),
          ],
        });
        expect(ahead).toBeNull();
      });
    });
  });

  given('[case4] a create, behind a set-aside update', () => {
    when('[t0] the create looks ahead', () => {
      then('it finds none: a create names no issue', () => {
        const ahead = getOneRadioFateAheadOnIssue({
          record: genUpdate({
            key: 'c1b2c3d4e5f60718',
            exid: null,
            status: RadioTaskStatus.QUEUED,
            reason: null,
          }),
          fates: [
            genHeld({
              record: genUpdate({
                key: 'a1b2c3d4e5f60718',
                exid: '599',
                status: RadioTaskStatus.CLAIMED,
                reason: 'upstream:access',
              }),
              lift: null,
            }),
          ],
        });
        expect(ahead).toBeNull();
      });
    });
  });

  given(
    '[case5] an earlier update to the same exid over another channel, set aside',
    () => {
      when('[t0] the record behind looks ahead', () => {
        then(
          'it finds none: an exid is scoped per channel, so it is another task',
          () => {
            const ahead = getOneRadioFateAheadOnIssue({
              record: recordBehind,
              fates: [
                genHeld({
                  record: new RadioTaskRecord({
                    ...genUpdate({
                      key: 'a1b2c3d4e5f60718',
                      exid: '599',
                      status: RadioTaskStatus.CLAIMED,
                      reason: 'upstream:access',
                    }),
                    via: RadioChannel.OS_FILEOPS,
                  }),
                  lift: null,
                }),
              ],
            });
            expect(ahead).toBeNull();
          },
        );
      });
    },
  );
});
