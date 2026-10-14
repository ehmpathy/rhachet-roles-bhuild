import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { genTempDir, given, then, useBeforeAll, useThen, when } from 'test-fns';

import { daoRadioTaskRecord } from '@src/access/daos/daoRadioTaskRecord';
import { RadioChannel } from '@src/domain.objects/RadioChannel';
import { RadioTaskRecordStatus } from '@src/domain.objects/RadioTaskRecordStatus';
import { RadioTaskRepo } from '@src/domain.objects/RadioTaskRepo';
import { shx } from '@src/infra/shell/shx';

import { setRadioTaskRecordFromPush } from './setRadioTaskRecordFromPush';
import { setRadioTaskRecordsDrainedByPush } from './setRadioTaskRecordsDrainedByPush';
import { setRadioTaskRecordUpstream } from './setRadioTaskRecordUpstream';

/**
 * .what = a push of the sandpine lesson task, with a given body
 * .why = the same identity (repo, title) twice, with two bodies, is a re-push
 */
const genPush = (input: { repo: RadioTaskRepo; description: string }) => ({
  repo: input.repo,
  via: RadioChannel.OS_FILEOPS,
  auth: null,
  idem: null,
  title: 'book-a-lesson reminder',
  description: input.description,
  exid: null,
  status: null,
});

describe('setRadioTaskRecordUpstream', () => {
  // a unique os.fileops target per run; the os.fileops store lives under the real home
  const repo = new RadioTaskRepo({
    owner: 'recorder-repush',
    name: `repo-${Date.now()}`,
  });
  afterAll(() =>
    fs.rmSync(path.join(os.homedir(), 'git', '.radio', repo.owner), {
      recursive: true,
      force: true,
    }),
  );

  given(
    '[case1] a record the drain read, then re-pushed with a new body before it settles',
    () => {
      const scene = useBeforeAll(async () => {
        const cwd = genTempDir({ slug: 'radio-repush-mid-drain', git: true });
        const homeDir = genTempDir({ slug: 'radio-repush-mid-drain-home' });
        fs.mkdirSync(path.join(cwd, '.meter'), { recursive: true });
        fs.writeFileSync(
          path.join(cwd, '.meter', 'radio.uses.jsonc'),
          JSON.stringify({ state: 'allowed' }),
        );
        const dir = path.join(cwd, '.behavior', '.radio');
        const context = { cwd, homeDir, env: process.env, shx };

        // the drain reads this copy
        const { record: read } = setRadioTaskRecordFromPush(
          { push: genPush({ repo, description: 'remind the surfer' }) },
          { dir, cwd },
        );

        // a re-push lands while that copy is in flight
        setRadioTaskRecordFromPush(
          {
            push: genPush({
              repo,
              description: 'remind the surfer, and pack a wetsuit',
            }),
          },
          { dir, cwd },
        );
        return { cwd, dir, context, read };
      });

      when('[t0] the drain settles the copy it sent', () => {
        const result = useThen('it settles', async () => {
          const fate = await setRadioTaskRecordUpstream(
            { record: scene.read, dir: scene.dir },
            scene.context,
          );
          return {
            fate,
            onDisk: daoRadioTaskRecord.get.one.byUnique({
              dir: scene.dir,
              key: scene.read.key,
            }),
          };
        });

        then('the copy it sent is reported delivered', () => {
          expect(result.fate.fate).toEqual('delivered');
        });

        then('the re-pushed body is kept on disk, not overwritten', () => {
          expect(result.onDisk?.description).toEqual(
            'remind the surfer, and pack a wetsuit',
          );
        });

        then('the re-pushed body stays queued, owed a send', () => {
          expect(result.onDisk?.recordStatus).toEqual(
            RadioTaskRecordStatus.QUEUED,
          );
        });
      });

      when('[t1] the re-push drains, behind the first drain', () => {
        const result = useThen('it drains', async () => {
          const record = daoRadioTaskRecord.get.one.byUnique({
            dir: scene.dir,
            key: scene.read.key,
          });
          const drained = await setRadioTaskRecordsDrainedByPush(
            { record: record!, dir: scene.dir },
            scene.context,
          );
          return {
            drained,
            onDisk: daoRadioTaskRecord.get.one.byUnique({
              dir: scene.dir,
              key: scene.read.key,
            }),
          };
        });

        then('the re-pushed body is sent and settled', () => {
          expect(result.drained.pushed.fate).toEqual('delivered');
          expect(result.onDisk?.recordStatus).toEqual(
            RadioTaskRecordStatus.DELIVERED,
          );
          expect(result.onDisk?.description).toEqual(
            'remind the surfer, and pack a wetsuit',
          );
        });
      });
    },
  );
});
