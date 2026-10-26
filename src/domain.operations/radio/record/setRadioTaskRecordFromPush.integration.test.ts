import * as fs from 'fs';
import { ConstraintError } from 'helpful-errors';
import {
  genTempDir,
  getError,
  given,
  then,
  useBeforeAll,
  useThen,
  when,
} from 'test-fns';

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
  given('[case1] two pushes, the first with the later key', () => {
    // .note = push the task whose key sorts later first, so a tiebreak on the key
    //         would reverse the push order; only heldSeq can keep it
    const scene = useBeforeAll(async () => {
      const cwd = genTempDir({ slug: 'radio-record-heldseq', git: true });
      const dir = `${cwd}/.behavior/.radio`;
      const isKeyOfALater =
        asRadioTaskRecordKey(asPush({ title: 'task a' })) >
        asRadioTaskRecordKey(asPush({ title: 'task b' }));
      const titleFirst = isKeyOfALater ? 'task a' : 'task b';
      const titleSecond = isKeyOfALater ? 'task b' : 'task a';
      setRadioTaskRecordFromPush(
        { push: asPush({ title: titleFirst }) },
        { dir, cwd },
      );
      setRadioTaskRecordFromPush(
        { push: asPush({ title: titleSecond }) },
        { dir, cwd },
      );
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
  });

  given('[case2] a record already delivered upstream', () => {
    const scene = useBeforeAll(async () => {
      const cwd = genTempDir({ slug: 'radio-record-repush', git: true });
      const dir = `${cwd}/.behavior/.radio`;
      const { record } = setRadioTaskRecordFromPush(
        { push: asPush({ title: 'fix flaky test' }) },
        { dir, cwd },
      );
      daoRadioTaskRecord.set.upsert({
        dir,
        record: new RadioTaskRecord({
          ...record,
          recordStatus: RadioTaskRecordStatus.DELIVERED,
          deliveredExid: '412',
        }),
      });
      return { dir, cwd };
    });

    when('[t0] the same task is re-pushed verbatim (C3)', () => {
      const result = useThen('the push is transcribed', async () =>
        setRadioTaskRecordFromPush(
          { push: asPush({ title: 'fix flaky test' }) },
          { dir: scene.dir, cwd: scene.cwd },
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
          { dir: scene.dir, cwd: scene.cwd },
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

  given('[case3] pushes into two record dirs of one worktree', () => {
    const scene = useBeforeAll(async () => {
      const cwd = genTempDir({ slug: 'radio-record-heldseq-dirs', git: true });
      const dirUnbound = `${cwd}/.behavior/.radio`;
      const dirRoute = `${cwd}/.behavior/v2026_01_01.demo/.radio`;
      const first = setRadioTaskRecordFromPush(
        { push: asPush({ title: 'task unbound' }) },
        { dir: dirUnbound, cwd },
      );
      const second = setRadioTaskRecordFromPush(
        { push: asPush({ title: 'task routed' }) },
        { dir: dirRoute, cwd },
      );
      const third = setRadioTaskRecordFromPush(
        { push: asPush({ title: 'task unbound again' }) },
        { dir: dirUnbound, cwd },
      );
      return { cwd, first, second, third };
    });

    when('[t0] the seq each push took is read', () => {
      then('the seq spans the worktree, not one dir', () => {
        expect([
          scene.first.record.heldSeq,
          scene.second.record.heldSeq,
          scene.third.record.heldSeq,
        ]).toEqual([1, 2, 3]);
      });

      then('the held records line up in push order across dirs', () => {
        expect(
          getAllRadioTaskRecordsHeld({}, { cwd: scene.cwd }).map(
            ({ record }) => record.title,
          ),
        ).toEqual(['task unbound', 'task routed', 'task unbound again']);
      });
    });
  });

  given(
    '[case4] a legacy record file that still holds heldAt and settledAt',
    () => {
      const scene = useBeforeAll(async () => {
        const cwd = genTempDir({ slug: 'radio-record-legacy', git: true });
        const dir = `${cwd}/.behavior/.radio`;
        const { record } = setRadioTaskRecordFromPush(
          { push: asPush({ title: 'task legacy' }) },
          { dir, cwd },
        );
        const path = `${dir}/record.${record.key}.json`;
        const legacy = {
          ...JSON.parse(fs.readFileSync(path, 'utf-8')),
          heldAt: '2026-09-29T00:00:00Z', // note: a pinned stamp never drifts, and the gate exempts .ts files
          settledAt: null,
        };
        fs.writeFileSync(path, JSON.stringify(legacy, null, 2) + '\n');
        return { cwd, dir, path };
      });

      when('[t0] the same task is re-pushed', () => {
        const result = useThen('the push is transcribed', async () => {
          setRadioTaskRecordFromPush(
            { push: asPush({ title: 'task legacy' }) },
            { dir: scene.dir, cwd: scene.cwd },
          );
          return { content: fs.readFileSync(scene.path, 'utf-8') };
        });

        then('the rewrite sheds the legacy clock fields', () => {
          expect(result.content).not.toContain('heldAt');
          expect(result.content).not.toContain('settledAt');
        });

        then('the record keeps its place in line', () => {
          expect(JSON.parse(result.content).heldSeq).toEqual(1);
        });
      });
    },
  );

  given(
    '[case5] a push held while unbound, re-pushed after a route bind moved the home',
    () => {
      const scene = useBeforeAll(async () => {
        const cwd = genTempDir({ slug: 'radio-record-rebind', git: true });
        const dirUnbound = `${cwd}/.behavior/.radio`;
        const dirRoute = `${cwd}/.behavior/v2026_01_01.lessons/.radio`;
        const first = setRadioTaskRecordFromPush(
          { push: asPush({ title: 'book-a-lesson reminder' }) },
          { dir: dirUnbound, cwd },
        );
        return { cwd, dirUnbound, dirRoute, first };
      });

      when('[t0] the same push is re-pushed into the route home', () => {
        const result = useThen('the push is transcribed', async () =>
          setRadioTaskRecordFromPush(
            { push: asPush({ title: 'book-a-lesson reminder' }) },
            { dir: scene.dirRoute, cwd: scene.cwd },
          ),
        );

        then('it lands on its extant record, in the dir that holds it', () => {
          expect(result.dir).toEqual(scene.dirUnbound);
          expect(result.before?.key).toEqual(scene.first.record.key);
        });

        then('it keeps its place in line', () => {
          expect(result.record.heldSeq).toEqual(scene.first.record.heldSeq);
        });

        then('one record waits, not two', () => {
          expect(
            getAllRadioTaskRecordsHeld({}, { cwd: scene.cwd }),
          ).toHaveLength(1);
          expect(fs.existsSync(scene.dirRoute)).toEqual(false);
        });
      });
    },
  );

  given('[case6] one task pushed over two channels', () => {
    // .note = the key hashes (repo, title) only, so both pushes name one record
    const scene = useBeforeAll(async () => {
      const cwd = genTempDir({ slug: 'radio-record-via-flip', git: true });
      const dir = `${cwd}/.behavior/.radio`;
      const { record } = setRadioTaskRecordFromPush(
        { push: asPush({ title: 'book-a-lesson reminder' }) },
        { dir, cwd },
      );
      daoRadioTaskRecord.set.upsert({
        dir,
        record: new RadioTaskRecord({
          ...record,
          recordStatus: RadioTaskRecordStatus.DELIVERED,
          deliveredExid: 'book-a-lesson-reminder',
        }),
      });
      return { dir, cwd, key: record.key };
    });

    when(
      '[t0] the same title is pushed via gh.issues after it landed via os.fileops',
      () => {
        const result = useThen('the push is refused', async () => ({
          error: await getError(() =>
            setRadioTaskRecordFromPush(
              {
                push: {
                  ...asPush({ title: 'book-a-lesson reminder' }),
                  via: RadioChannel.GH_ISSUES,
                },
              },
              { dir: scene.dir, cwd: scene.cwd },
            ),
          ),
        }));

        then(
          'it is a ConstraintError that names both channels and the fix',
          () => {
            expect(result.error).toBeInstanceOf(ConstraintError);
            expect(result.error.message).toContain(
              'via os.fileops, not via gh.issues',
            );
            expect(result.error.message).toContain(
              `rhx radio.task.queue del --key ${scene.key}`,
            );
          },
        );

        then(
          'the first record is unchanged on disk: its channel and fate stand',
          () => {
            const found = daoRadioTaskRecord.get
              .all({ dirs: [scene.dir] })
              .map(({ record }) => [record.via, record.recordStatus]);
            expect(found).toEqual([
              [RadioChannel.OS_FILEOPS, RadioTaskRecordStatus.DELIVERED],
            ]);
          },
        );
      },
    );
  });
});
