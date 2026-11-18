import { genTempDir, given, then, useBeforeAll, useThen, when } from 'test-fns';

import { daoRadioTaskRecord } from '@src/access/daos/daoRadioTaskRecord';
import { RadioChannel } from '@src/domain.objects/RadioChannel';
import { RadioTaskRecordStatus } from '@src/domain.objects/RadioTaskRecordStatus';
import { RadioTaskRepo } from '@src/domain.objects/RadioTaskRepo';

import { RADIO_PROMISE_PUBLIC_REPO } from '../promise/RADIO_PROMISE_PUBLIC_REPO';
import { DETAIL_REPUSHED_MID_SEND } from './asRadioFateRepushedMidSend';
import { setRadioTaskRecordFromPush } from './setRadioTaskRecordFromPush';
import { setRadioTaskRecordHeld } from './setRadioTaskRecordHeld';

/**
 * .what = a create push for a lesson reminder into a public repo, with or without the promise
 * .why = one push identity, so a re-run with --promise lands on the same record
 */
const asPush = (input: { promise: string | null }) => ({
  repo: new RadioTaskRepo({ owner: 'sandpine', name: 'surf-forecast-public' }),
  via: RadioChannel.GH_ISSUES,
  auth: null,
  idem: null,
  title: 'lesson reminders',
  description: 'remind each surfer a day ahead',
  exid: null,
  status: null,
  promise: input.promise,
});

/**
 * .what = a temp repo with one record pushed, no promise; the drain's line copy of it
 */
const genSceneOnePush = (input: { slug: string }) => {
  const cwd = genTempDir({ slug: input.slug, git: true });
  const dir = `${cwd}/.behavior/.radio`;
  const { record: lineCopy } = setRadioTaskRecordFromPush(
    { push: asPush({ promise: null }) },
    { dir, cwd },
  );
  return { cwd, dir, lineCopy };
};

describe('setRadioTaskRecordHeld', () => {
  given('[case1] the drain read a record, and no re-push came since', () => {
    const scene = useBeforeAll(async () =>
      genSceneOnePush({ slug: 'radio-record-held-plain' }),
    );

    when('[t0] the promise gate holds it on another key', () => {
      const fate = useThen('the hold is written', async () =>
        setRadioTaskRecordHeld({
          record: scene.lineCopy,
          dir: scene.dir,
          change: { reason: 'public-repo:unpromised' },
          detail: 'public repo, no anonymized promise on this record',
          halt: false,
        }),
      );

      then('the record on disk stays QUEUED with the hold reason', () => {
        const onDisk = daoRadioTaskRecord.get.one.byUnique({
          dir: scene.dir,
          key: scene.lineCopy.key,
        });
        expect(onDisk?.recordStatus).toEqual(RadioTaskRecordStatus.QUEUED);
        expect(onDisk?.reason).toEqual('public-repo:unpromised');
      });

      then(
        'the fate is held, carries the dir, the detail, and the halt',
        () => {
          expect(fate.fate).toEqual('held');
          expect(fate.dir).toEqual(scene.dir);
          expect(fate.detail).toEqual(
            'public repo, no anonymized promise on this record',
          );
          expect(fate.halt).toEqual(false);
        },
      );
    });
  });

  given(
    '[case2] the drain read the push own record, and no re-push came since',
    () => {
      const scene = useBeforeAll(async () =>
        genSceneOnePush({ slug: 'radio-record-held-drop' }),
      );

      when('[t0] the promise gate drops it', () => {
        const fate = useThen('the drop is written', async () =>
          setRadioTaskRecordHeld({
            record: scene.lineCopy,
            dir: scene.dir,
            change: {
              recordStatus: RadioTaskRecordStatus.DROPPED,
              reason: 'public-repo:unpromised',
            },
            detail: 'public repo, no anonymized promise on this record',
            halt: false,
          }),
        );

        then(
          'the record on disk is DROPPED, its reason the machine code',
          () => {
            const onDisk = daoRadioTaskRecord.get.one.byUnique({
              dir: scene.dir,
              key: scene.lineCopy.key,
            });
            expect(onDisk?.recordStatus).toEqual(RadioTaskRecordStatus.DROPPED);
            expect(onDisk?.reason).toEqual('public-repo:unpromised');
          },
        );

        then('the fate is held and reports the record as dropped', () => {
          expect(fate.fate).toEqual('held');
          expect(fate.record.recordStatus).toEqual(
            RadioTaskRecordStatus.DROPPED,
          );
        });
      });
    },
  );

  given(
    '[case3] the drain read a record, then the nudged command re-ran with --promise before the drop settled',
    () => {
      const scene = useBeforeAll(async () => {
        const { cwd, dir, lineCopy } = genSceneOnePush({
          slug: 'radio-record-held-repush',
        });
        setRadioTaskRecordFromPush(
          { push: asPush({ promise: RADIO_PROMISE_PUBLIC_REPO }) },
          { dir, cwd },
        );
        return { dir, lineCopy };
      });

      when('[t0] the promise gate tries to drop the line copy', () => {
        const fate = useThen('the hold is attempted', async () =>
          setRadioTaskRecordHeld({
            record: scene.lineCopy,
            dir: scene.dir,
            change: {
              recordStatus: RadioTaskRecordStatus.DROPPED,
              reason: 'public-repo:unpromised',
            },
            detail: 'public repo, no anonymized promise on this record',
            halt: false,
          }),
        );

        then(
          'the record on disk is left as the re-run wrote it: QUEUED, promised',
          () => {
            const onDisk = daoRadioTaskRecord.get.one.byUnique({
              dir: scene.dir,
              key: scene.lineCopy.key,
            });
            expect(onDisk?.recordStatus).toEqual(RadioTaskRecordStatus.QUEUED);
            expect(onDisk?.promise).toEqual(RADIO_PROMISE_PUBLIC_REPO);
            expect(onDisk?.reason).toBeNull();
          },
        );

        then('the fate reports a re-push mid-send, never the drop', () => {
          expect(fate.detail).toEqual(DETAIL_REPUSHED_MID_SEND);
          expect(fate.record.recordStatus).toEqual(
            RadioTaskRecordStatus.QUEUED,
          );
        });
      });
    },
  );
});
