import { genTempDir, given, then, useBeforeAll, useThen, when } from 'test-fns';

import { daoRadioTaskRecord } from '@src/access/daos/daoRadioTaskRecord';
import { RadioChannel } from '@src/domain.objects/RadioChannel';
import { RadioTaskRecord } from '@src/domain.objects/RadioTaskRecord';
import { RadioTaskRecordStatus } from '@src/domain.objects/RadioTaskRecordStatus';
import { RadioTaskRepo } from '@src/domain.objects/RadioTaskRepo';

import { setRadioTaskRecordFromPush } from './setRadioTaskRecordFromPush';
import { setRadioTaskRecordHeldBehindHalt } from './setRadioTaskRecordHeldBehindHalt';
import { setRadioTaskRecordSettled } from './setRadioTaskRecordSettled';

/**
 * .what = a create push for a lesson reminder, with a given body
 * .why = one push identity, so a second push lands on the same record
 */
const asPush = (input: { description: string }) => ({
  repo: new RadioTaskRepo({ owner: 'sandpine', name: 'svc-lessons' }),
  via: RadioChannel.OS_FILEOPS,
  auth: null,
  idem: null,
  title: 'lesson reminders',
  description: input.description,
  exid: null,
  status: null,
});

/**
 * .what = the held fate of a record that hit a rate limit, which halts the drain
 * .why = the records behind it are held with its reason
 */
const asHalter = (input: { record: RadioTaskRecord }) => ({
  fate: 'held' as const,
  record: new RadioTaskRecord({
    ...input.record,
    reason: 'upstream:rate-limit',
  }),
  lift: null,
  detail: 'api rate limit exceeded',
  halt: true,
});

describe('setRadioTaskRecordSettled', () => {
  given(
    '[case1] the drain read a record, then a re-push rewrote its body',
    () => {
      const scene = useBeforeAll(async () => {
        const cwd = genTempDir({
          slug: 'radio-record-settled-repush',
          git: true,
        });
        const dir = `${cwd}/.behavior/.radio`;
        const { record: lineCopy } = setRadioTaskRecordFromPush(
          { push: asPush({ description: 'remind each surfer a day ahead' }) },
          { dir, cwd },
        );
        setRadioTaskRecordFromPush(
          {
            push: asPush({ description: 'remind each surfer two days ahead' }),
          },
          { dir, cwd },
        );
        return { dir, lineCopy };
      });

      when('[t0] the drain holds its line copy behind a halt', () => {
        const result = useThen('the hold is written', async () =>
          setRadioTaskRecordHeldBehindHalt({
            record: scene.lineCopy,
            dir: scene.dir,
            halter: asHalter({ record: scene.lineCopy }),
          }),
        );

        then('the record on disk keeps the re-pushed body', () => {
          const onDisk = daoRadioTaskRecord.get.one.byUnique({
            dir: scene.dir,
            key: scene.lineCopy.key,
          });
          expect(onDisk?.description).toEqual(
            'remind each surfer two days ahead',
          );
          expect(onDisk?.recordStatus).toEqual(RadioTaskRecordStatus.QUEUED);
        });

        then('the fate reports the record as it stands on disk', () => {
          expect(result.record.description).toEqual(
            'remind each surfer two days ahead',
          );
        });
      });
    },
  );

  given('[case2] the drain read a record, and no re-push came since', () => {
    const scene = useBeforeAll(async () => {
      const cwd = genTempDir({ slug: 'radio-record-settled-plain', git: true });
      const dir = `${cwd}/.behavior/.radio`;
      const { record: lineCopy } = setRadioTaskRecordFromPush(
        { push: asPush({ description: 'remind each surfer a day ahead' }) },
        { dir, cwd },
      );
      return { dir, lineCopy };
    });

    when('[t0] the drain settles it as delivered', () => {
      const result = useThen('the fate is written', async () =>
        setRadioTaskRecordSettled({
          dir: scene.dir,
          record: scene.lineCopy,
          change: {
            recordStatus: RadioTaskRecordStatus.DELIVERED,
            deliveredExid: '42',
          },
        }),
      );

      then('the record on disk carries the fate', () => {
        const onDisk = daoRadioTaskRecord.get.one.byUnique({
          dir: scene.dir,
          key: scene.lineCopy.key,
        });
        expect(onDisk?.recordStatus).toEqual(RadioTaskRecordStatus.DELIVERED);
        expect(onDisk?.deliveredExid).toEqual('42');
        expect(result.recordStatus).toEqual(RadioTaskRecordStatus.DELIVERED);
      });
    });
  });
});
