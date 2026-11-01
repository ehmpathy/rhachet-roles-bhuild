import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { genTempDir, given, then, useBeforeAll, useThen, when } from 'test-fns';

import { daoRadioTaskRecord } from '@src/access/daos/daoRadioTaskRecord';
import { RadioChannel } from '@src/domain.objects/RadioChannel';
import { RadioTaskRecordStatus } from '@src/domain.objects/RadioTaskRecordStatus';
import { RadioTaskRepo } from '@src/domain.objects/RadioTaskRepo';
import { RadioTaskStatus } from '@src/domain.objects/RadioTaskStatus';
import { shx } from '@src/infra/shell/shx';

import { setRadioTaskRecordDropped } from './setRadioTaskRecordDropped';
import { setRadioTaskRecordFromPush } from './setRadioTaskRecordFromPush';
import { setRadioTaskRecordsDrainedByPush } from './setRadioTaskRecordsDrainedByPush';

/**
 * .what = a push of one os.fileops task, as the cli records it
 * .why = each step in the scene is one push; only the status (or the create) varies
 */
const genPush = (input: {
  repo: RadioTaskRepo;
  exid: string | null;
  status: RadioTaskStatus | null;
}) => ({
  repo: input.repo,
  via: RadioChannel.OS_FILEOPS,
  auth: null,
  idem: null,
  title: input.exid ? null : 'lesson reminder',
  description: input.exid ? null : 'remind the surfer of the lesson',
  exid: input.exid,
  status: input.status,
});

describe('getOneRadioPushRecordAfterDrain', () => {
  // a unique os.fileops target per run; the os.fileops store lives under the real home
  const repo = new RadioTaskRepo({
    owner: 'recorder-settle',
    name: `repo-${Date.now()}${process.pid}`,
  });
  afterAll(() =>
    fs.rmSync(path.join(os.homedir(), 'git', '.radio', repo.owner), {
      recursive: true,
      force: true,
    }),
  );

  given(
    '[case1] push A claims an issue and push B delivers it; B drains both before A drains',
    () => {
      const scene = useBeforeAll(async () => {
        const cwd = genTempDir({ slug: 'radio-settle-order', git: true });
        const homeDir = genTempDir({ slug: 'radio-settle-order-home' });
        fs.mkdirSync(path.join(cwd, '.meter'), { recursive: true });
        fs.writeFileSync(
          path.join(cwd, '.meter', 'radio.uses.jsonc'),
          JSON.stringify({ state: 'allowed' }),
        );
        const dir = path.join(cwd, '.behavior', '.radio');
        const context = { cwd, homeDir, env: process.env, shx };

        // the issue the two updates move
        const { record: create } = setRadioTaskRecordFromPush(
          { push: genPush({ repo, exid: null, status: null }) },
          { dir, cwd },
        );
        const created = await setRadioTaskRecordsDrainedByPush(
          { record: create, dir, authTyped: null },
          context,
        );
        const exid =
          created.pushed.fate === 'delivered' ? created.pushed.task.exid : null;
        if (!exid) throw new Error('scene: the create never delivered');

        // push A (claim) and push B (deliver) are both held, A first
        const { record: recordA } = setRadioTaskRecordFromPush(
          { push: genPush({ repo, exid, status: RadioTaskStatus.CLAIMED }) },
          { dir, cwd },
        );
        const { record: recordB } = setRadioTaskRecordFromPush(
          { push: genPush({ repo, exid, status: RadioTaskStatus.DELIVERED }) },
          { dir, cwd },
        );

        // B's drain wins the lock and carries both, in line order
        const drainedB = await setRadioTaskRecordsDrainedByPush(
          { record: recordB, dir, authTyped: null },
          context,
        );
        return { dir, context, recordA, drainedB };
      });

      when('[t0] A drains after, with naught left held', () => {
        const result = useThen('A reads its fate', async () => {
          const drainedA = await setRadioTaskRecordsDrainedByPush(
            { record: scene.recordA, dir: scene.dir, authTyped: null },
            scene.context,
          );
          return {
            drainedA,
            onDisk: daoRadioTaskRecord.get.one.byUnique({
              dir: scene.dir,
              key: scene.recordA.key,
            }),
          };
        });

        then('B carried A, and both landed', () => {
          expect(scene.drainedB.pushed.fate).toEqual('delivered');
          expect(
            scene.drainedB.others.map((fate) => [fate.record.key, fate.fate]),
          ).toEqual([[scene.recordA.key, 'delivered']]);
        });

        then('A reads as landed, never refused', () => {
          expect(result.drainedA.pushed.fate).toEqual('landed');
        });

        then('A stays DELIVERED on disk, with its exid', () => {
          expect(result.onDisk?.recordStatus).toEqual(
            RadioTaskRecordStatus.DELIVERED,
          );
          expect(result.onDisk?.deliveredExid).not.toEqual(null);
          expect(result.onDisk?.reason).toEqual(null);
        });
      });
    },
  );

  given(
    '[case2] push P updates an absent issue and push Q creates one; Q drains both before P drains',
    () => {
      const scene = useBeforeAll(async () => {
        const cwd = genTempDir({ slug: 'radio-settle-refused', git: true });
        const homeDir = genTempDir({ slug: 'radio-settle-refused-home' });
        fs.mkdirSync(path.join(cwd, '.meter'), { recursive: true });
        fs.writeFileSync(
          path.join(cwd, '.meter', 'radio.uses.jsonc'),
          JSON.stringify({ state: 'allowed' }),
        );
        const dir = path.join(cwd, '.behavior', '.radio');
        const context = { cwd, homeDir, env: process.env, shx };

        // push P (an update to an issue that does not exist) and push Q (a create), P first
        const { record: recordP } = setRadioTaskRecordFromPush(
          {
            push: genPush({
              repo,
              exid: '999999',
              status: RadioTaskStatus.CLAIMED,
            }),
          },
          { dir, cwd },
        );
        const { record: recordQ } = setRadioTaskRecordFromPush(
          { push: genPush({ repo, exid: null, status: null }) },
          { dir, cwd },
        );

        // Q's drain wins the lock, carries P, and upstream refuses P
        const drainedQ = await setRadioTaskRecordsDrainedByPush(
          { record: recordQ, dir, authTyped: null },
          context,
        );
        return { dir, context, recordP, drainedQ };
      });

      when('[t0] P drains after, with naught left held', () => {
        const result = useThen('P reads its fate', async () =>
          setRadioTaskRecordsDrainedByPush(
            { record: scene.recordP, dir: scene.dir, authTyped: null },
            scene.context,
          ),
        );

        then('Q carried P, and upstream refused it', () => {
          expect(
            scene.drainedQ.others.map((fate) => [fate.record.key, fate.fate]),
          ).toEqual([[scene.recordP.key, 'refused']]);
        });

        then('P reads as refused, never a malfunction', () => {
          expect(result.pushed.fate).toEqual('refused');
        });

        then('P carries the refusal its record holds on disk', () => {
          if (result.pushed.fate !== 'refused') throw new Error('not refused');
          expect(result.pushed.detail).toContain('task not found');
        });
      });
    },
  );

  given(
    '[case3] push P is held, then dropped via queue del before its drain',
    () => {
      const scene = useBeforeAll(async () => {
        const cwd = genTempDir({ slug: 'radio-settle-dropped', git: true });
        const homeDir = genTempDir({ slug: 'radio-settle-dropped-home' });
        fs.mkdirSync(path.join(cwd, '.meter'), { recursive: true });
        fs.writeFileSync(
          path.join(cwd, '.meter', 'radio.uses.jsonc'),
          JSON.stringify({ state: 'allowed' }),
        );
        const dir = path.join(cwd, '.behavior', '.radio');
        const context = { cwd, homeDir, env: process.env, shx };
        const { record: recordP } = setRadioTaskRecordFromPush(
          { push: genPush({ repo, exid: null, status: null }) },
          { dir, cwd },
        );
        await setRadioTaskRecordDropped(
          { key: recordP.key, why: 'superseded by the board rental task' },
          { cwd },
        );
        return { dir, context, recordP };
      });

      when('[t0] P drains', () => {
        const result = useThen('P reads its fate', async () =>
          setRadioTaskRecordsDrainedByPush(
            { record: scene.recordP, dir: scene.dir, authTyped: null },
            scene.context,
          ),
        );

        then('P reads as refused, with the why it was dropped', () => {
          expect(result.pushed.fate).toEqual('refused');
          if (result.pushed.fate !== 'refused') throw new Error('not refused');
          expect(result.pushed.detail).toEqual(
            'dropped: superseded by the board rental task',
          );
        });
      });
    },
  );
});
