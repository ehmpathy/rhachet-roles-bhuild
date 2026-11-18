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

import { getAllRadioTaskRecordsHeld } from './getAllRadioTaskRecordsHeld';
import { setRadioTaskRecordFromComment } from './setRadioTaskRecordFromComment';

/**
 * .what = a comment on #489 of sandpine/svc-lessons
 */
const asComment = (input: {
  body: string;
  via?: RadioChannel;
  auth?: string | null;
}) => ({
  repo: new RadioTaskRepo({ owner: 'sandpine', name: 'svc-lessons' }),
  via: input.via ?? RadioChannel.GH_ISSUES,
  auth: input.auth ?? null,
  exid: '489',
  body: input.body,
});

/**
 * .what = the record files in a record dir
 */
const getRecordFiles = (input: { dir: string }): string[] =>
  fs.readdirSync(input.dir).filter((name) => name.startsWith('record.'));

describe('setRadioTaskRecordFromComment', () => {
  given('[case1] a first comment on a thread', () => {
    const scene = useBeforeAll(async () => {
      const cwd = genTempDir({ slug: 'radio-record-comment', git: true });
      const dir = `${cwd}/.behavior/.radio`;
      return { cwd, dir };
    });

    when('[t0] it is transcribed', () => {
      const result = useThen('it is written', () =>
        setRadioTaskRecordFromComment(
          { comment: asComment({ body: 'the cure is wrong' }) },
          scene,
        ),
      );

      then(
        'the record is a QUEUED comment whose description is the body',
        () => {
          expect(result.before).toBeNull();
          expect(result.record).toMatchObject({
            kind: 'comment',
            exid: '489',
            description: 'the cure is wrong',
            title: null,
            status: null,
            idem: null,
            recordStatus: RadioTaskRecordStatus.QUEUED,
            heldSeq: 1,
          });
        },
      );
    });

    when('[t1] the same body is transcribed again, with an auth named', () => {
      const result = useThen('it is written', () =>
        setRadioTaskRecordFromComment(
          {
            comment: asComment({ body: 'the cure is wrong', auth: 'as-human' }),
          },
          scene,
        ),
      );

      then('it lands on the one extant record, its place in line kept', () => {
        expect(result.before?.key).toEqual(result.record.key);
        expect(result.record.heldSeq).toEqual(1);
        expect(getRecordFiles(scene)).toHaveLength(1);
      });

      then('the named auth wins', () => {
        expect(result.record.auth).toEqual('as-human');
      });
    });

    when(
      '[t2] the same body is transcribed a third time, no auth named',
      () => {
        const result = useThen('it is written', () =>
          setRadioTaskRecordFromComment(
            { comment: asComment({ body: 'the cure is wrong' }) },
            scene,
          ),
        );

        then(
          'the extant auth stays: a bare retry never undoes an amend',
          () => {
            expect(result.record.auth).toEqual('as-human');
          },
        );
      },
    );

    when('[t3] a different body lands on the same thread', () => {
      const result = useThen('it is written', () =>
        setRadioTaskRecordFromComment(
          { comment: asComment({ body: 'and see the tide table test' }) },
          scene,
        ),
      );

      then('it is its own record, next in line', () => {
        expect(result.before).toBeNull();
        expect(result.record.heldSeq).toEqual(2);
        expect(getRecordFiles(scene)).toHaveLength(2);
      });
    });

    when('[t4] the same body arrives via another channel', () => {
      const result = useThen('it is refused', async () => ({
        error: await getError(() =>
          setRadioTaskRecordFromComment(
            {
              comment: asComment({
                body: 'the cure is wrong',
                via: RadioChannel.OS_FILEOPS,
              }),
            },
            scene,
          ),
        ),
      }));

      then('a ConstraintError names the drop that frees it', () => {
        expect(result.error).toBeInstanceOf(ConstraintError);
        expect(result.error.message).toContain(
          'rhx radio.task.queue del --uuid',
        );
      });
    });
  });

  given('[case2] a comment whose record was refused upstream', () => {
    const scene = useBeforeAll(async () => {
      const cwd = genTempDir({
        slug: 'radio-record-comment-refused',
        git: true,
      });
      const dir = `${cwd}/.behavior/.radio`;
      const first = setRadioTaskRecordFromComment(
        { comment: asComment({ body: 'hello' }) },
        { cwd, dir },
      );
      daoRadioTaskRecord.set.upsert({
        dir,
        record: new RadioTaskRecord({
          ...first.record,
          recordStatus: RadioTaskRecordStatus.REFUSED,
          reason: 'upstream:refused',
        }),
      });
      return { cwd, dir };
    });

    when('[t0] the same comment is pushed again', () => {
      const result = useThen('it is written', () =>
        setRadioTaskRecordFromComment(
          { comment: asComment({ body: 'hello' }) },
          scene,
        ),
      );

      then('it re-queues: a re-push re-runs a refusal', () => {
        expect(result.before?.recordStatus).toEqual(
          RadioTaskRecordStatus.REFUSED,
        );
        expect(result.record.recordStatus).toEqual(
          RadioTaskRecordStatus.QUEUED,
        );
        expect(result.record.reason).toBeNull();
      });
    });
  });

  given('[case3] a comment whose record was already delivered', () => {
    const scene = useBeforeAll(async () => {
      const cwd = genTempDir({ slug: 'radio-record-comment-done', git: true });
      const dir = `${cwd}/.behavior/.radio`;
      const first = setRadioTaskRecordFromComment(
        { comment: asComment({ body: 'shipped' }) },
        { cwd, dir },
      );
      daoRadioTaskRecord.set.upsert({
        dir,
        record: new RadioTaskRecord({
          ...first.record,
          recordStatus: RadioTaskRecordStatus.DELIVERED,
          deliveredExid: '489',
        }),
      });
      return { cwd, dir };
    });

    when('[t0] the same comment is pushed again', () => {
      const result = useThen('it is written', () =>
        setRadioTaskRecordFromComment(
          { comment: asComment({ body: 'shipped' }) },
          scene,
        ),
      );

      then(
        'it re-queues on its one key: the thread findsert decides kept or posted (F13)',
        () => {
          expect(result.before?.key).toEqual(result.record.key);
          expect(result.record.recordStatus).toEqual(
            RadioTaskRecordStatus.QUEUED,
          );
        },
      );
    });

    when(
      '[t1] the same comment is pushed again with a trailed newline, as @stdin carries it',
      () => {
        const result = useThen('it is written', () =>
          setRadioTaskRecordFromComment(
            { comment: asComment({ body: 'shipped\n' }) },
            scene,
          ),
        );

        then('it lands on the same record, its place in line kept', () => {
          expect(result.before?.key).toEqual(result.record.key);
          expect(result.record.heldSeq).toEqual(result.before?.heldSeq);
          expect(result.record.recordStatus).toEqual(
            RadioTaskRecordStatus.QUEUED,
          );
        });

        then(
          'its stored body is not rewritten, so the record file does not churn',
          () => {
            expect(result.record.description).toEqual('shipped');
          },
        );
      },
    );
  });

  given(
    '[case4] a comment held while unbound, repeated after a route bind moved the home',
    () => {
      const scene = useBeforeAll(async () => {
        const cwd = genTempDir({
          slug: 'radio-record-comment-rebind',
          git: true,
        });
        const dirUnbound = `${cwd}/.behavior/.radio`;
        const dirRoute = `${cwd}/.behavior/v2026_01_01.lessons/.radio`;
        const first = setRadioTaskRecordFromComment(
          { comment: asComment({ body: 'the wetsuit rack is full' }) },
          { dir: dirUnbound, cwd },
        );
        return { cwd, dirUnbound, dirRoute, first };
      });

      when('[t0] the same comment is repeated into the route home', () => {
        const result = useThen('it is written', () =>
          setRadioTaskRecordFromComment(
            { comment: asComment({ body: 'the wetsuit rack is full' }) },
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
});
