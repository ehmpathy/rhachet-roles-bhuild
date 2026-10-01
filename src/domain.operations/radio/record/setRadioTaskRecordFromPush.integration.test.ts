import { genTempDir, given, then, useBeforeAll, useThen, when } from 'test-fns';

import { daoRadioTaskRecord } from '@src/access/daos/daoRadioTaskRecord';
import { RadioChannel } from '@src/domain.objects/RadioChannel';
import { RadioTaskRecord } from '@src/domain.objects/RadioTaskRecord';
import { RadioTaskRecordStatus } from '@src/domain.objects/RadioTaskRecordStatus';
import { RadioTaskRepo } from '@src/domain.objects/RadioTaskRepo';

import { asRadioTaskRecordKey } from './asRadioTaskRecordKey';
import { getAllRadioTaskRecordsHeld } from './getAllRadioTaskRecordsHeld';
import { setRadioTaskRecordFromPush } from './setRadioTaskRecordFromPush';

/**
 * .what = a create push with a given title
 * .why = each title is a distinct push identity, so each lands in its own record
 */
const asPush = (input: { title: string }) => ({
  repo: new RadioTaskRepo({ owner: 'ehmpathy', name: 'rhachet' }),
  via: RadioChannel.OS_FILEOPS,
  auth: null,
  idem: null,
  title: input.title,
  description: 'a body',
  exid: null,
  status: null,
});

describe('setRadioTaskRecordFromPush', () => {
  given(
    '[case1] two pushes in one second, the first with the later key',
    () => {
      // .note = heldAt has one-second precision; push the task whose key sorts later
      //         first, so a tiebreak on the key would reverse the push order
      const scene = useBeforeAll(async () => {
        const cwd = genTempDir({ slug: 'radio-record-heldseq', git: true });
        const dir = `${cwd}/.behavior/.radio`;
        const isKeyOfALater =
          asRadioTaskRecordKey(asPush({ title: 'task a' })) >
          asRadioTaskRecordKey(asPush({ title: 'task b' }));
        const titleFirst = isKeyOfALater ? 'task a' : 'task b';
        const titleSecond = isKeyOfALater ? 'task b' : 'task a';
        const first = setRadioTaskRecordFromPush(
          { push: asPush({ title: titleFirst }) },
          { dir },
        );
        const second = setRadioTaskRecordFromPush(
          { push: asPush({ title: titleSecond }) },
          { dir },
        );
        daoRadioTaskRecord.set.upsert({
          dir,
          record: new RadioTaskRecord({
            ...second.record,
            heldAt: first.record.heldAt,
          }),
        });
        return { cwd, titleFirst, titleSecond };
      });

      when('[t0] the held records are lined up', () => {
        then('they hold the push order, not the key order', () => {
          expect(
            getAllRadioTaskRecordsHeld({}, { cwd: scene.cwd }).map(
              ({ record }) => [record.title, record.heldSeq],
            ),
          ).toEqual([
            [scene.titleFirst, 1],
            [scene.titleSecond, 2],
          ]);
        });
      });
    },
  );

  given('[case2] a record already delivered upstream', () => {
    const scene = useBeforeAll(async () => {
      const cwd = genTempDir({ slug: 'radio-record-repush', git: true });
      const dir = `${cwd}/.behavior/.radio`;
      const { record } = setRadioTaskRecordFromPush(
        { push: asPush({ title: 'fix flaky test' }) },
        { dir },
      );
      daoRadioTaskRecord.set.upsert({
        dir,
        record: new RadioTaskRecord({
          ...record,
          recordStatus: RadioTaskRecordStatus.DELIVERED,
          deliveredExid: '412',
        }),
      });
      return { dir };
    });

    when('[t0] the same task is re-pushed verbatim (C3)', () => {
      const result = useThen('the push is transcribed', async () =>
        setRadioTaskRecordFromPush(
          { push: asPush({ title: 'fix flaky test' }) },
          { dir: scene.dir },
        ),
      );

      then('the record stays delivered, with its exid', () => {
        expect(result.record.recordStatus).toEqual(
          RadioTaskRecordStatus.DELIVERED,
        );
        expect(result.record.deliveredExid).toEqual('412');
      });
    });

    when('[t1] the same task is re-pushed with a new body', () => {
      const result = useThen('the push is transcribed', async () =>
        setRadioTaskRecordFromPush(
          {
            push: {
              ...asPush({ title: 'fix flaky test' }),
              description: 'a new body',
            },
          },
          { dir: scene.dir },
        ),
      );

      then('the record re-queues, so upstream decides it', () => {
        expect(result.record.recordStatus).toEqual(
          RadioTaskRecordStatus.QUEUED,
        );
        expect(result.record.deliveredExid).toEqual(null);
        expect(result.record.description).toEqual('a new body');
      });
    });
  });
});
