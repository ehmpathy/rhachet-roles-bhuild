import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { genTempDir, given, then, useBeforeAll, useThen, when } from 'test-fns';

import { daoRadioTaskRecord } from '@src/access/daos/daoRadioTaskRecord';
import { RadioChannel } from '@src/domain.objects/RadioChannel';
import { RadioTaskRecordStatus } from '@src/domain.objects/RadioTaskRecordStatus';
import { RadioTaskRepo } from '@src/domain.objects/RadioTaskRepo';
import { shx } from '@src/infra/shell/shx';

import { genRadioDrainDeadline } from './genRadioDrainDeadline';
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

/**
 * .what = a drain deadline far off, as a drain's lock would hand this op
 * .why = these cases call the op direct, outside a lock, and no case nears the deadline
 */
const drainDeadline = genRadioDrainDeadline({
  lease: { milliseconds: 5 * 60_000 },
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
        const context = { cwd, homeDir, env: process.env, shx, drainDeadline };

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

        then('the fate reads held, as the record on disk stands', () => {
          expect(result.fate.fate).toEqual('held');
          expect(result.fate.record.recordStatus).toEqual(
            RadioTaskRecordStatus.QUEUED,
          );
          expect(result.fate.record.description).toEqual(
            'remind the surfer, and pack a wetsuit',
          );
          expect(
            result.fate.fate === 'held' ? result.fate.detail : null,
          ).toContain('a re-push rewrote this record');
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
            { record: record!, dir: scene.dir, authTyped: null },
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

  given(
    '[case2] a record whose auth faults, re-pushed with a new body before it settles',
    () => {
      const scene = useBeforeAll(async () => {
        const cwd = genTempDir({ slug: 'radio-repush-auth-fault', git: true });
        const homeDir = genTempDir({ slug: 'radio-repush-auth-fault-home' });
        fs.mkdirSync(path.join(cwd, '.meter'), { recursive: true });
        fs.writeFileSync(
          path.join(cwd, '.meter', 'radio.uses.jsonc'),
          JSON.stringify({ state: 'allowed' }),
        );
        const dir = path.join(cwd, '.behavior', '.radio');
        const context = { cwd, homeDir, env: process.env, shx, drainDeadline };

        // the drain reads this copy, whose auth mode no grammar knows
        const { record: read } = setRadioTaskRecordFromPush(
          {
            push: {
              ...genPush({ repo, description: 'count the wetsuits' }),
              title: 'wetsuit inventory count',
              via: RadioChannel.GH_ISSUES,
              auth: 'some-unknown-mode',
            },
          },
          { dir, cwd },
        );

        // a re-push lands while that copy is in flight
        setRadioTaskRecordFromPush(
          {
            push: {
              ...genPush({
                repo,
                description: 'count the wetsuits, and the rash guards',
              }),
              title: 'wetsuit inventory count',
              via: RadioChannel.GH_ISSUES,
              auth: 'some-unknown-mode',
            },
          },
          { dir, cwd },
        );
        return { dir, context, read };
      });

      when('[t0] the drain settles the copy it tried', () => {
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

        then('the fate names the re-push, never the old copy fault', () => {
          expect(result.fate.fate).toEqual('held');
          expect(
            result.fate.fate === 'held' ? result.fate.detail : null,
          ).toContain('a re-push rewrote this record');
        });

        then(
          'the re-pushed request is kept on disk, its fate untouched',
          () => {
            expect(result.onDisk?.description).toEqual(
              'count the wetsuits, and the rash guards',
            );
            expect(result.onDisk?.reason).toEqual(null);
          },
        );
      });
    },
  );

  given(
    '[case3] a record whose typed shell auth stalls past its derive cap, far from the drain deadline',
    () => {
      const scene = useBeforeAll(async () => {
        const cwd = genTempDir({ slug: 'radio-auth-derive-stall', git: true });
        const homeDir = genTempDir({ slug: 'radio-auth-derive-stall-home' });
        fs.mkdirSync(path.join(cwd, '.meter'), { recursive: true });
        fs.writeFileSync(
          path.join(cwd, '.meter', 'radio.uses.jsonc'),
          JSON.stringify({ state: 'allowed' }),
        );
        const dir = path.join(cwd, '.behavior', '.radio');
        const { record } = setRadioTaskRecordFromPush(
          {
            push: {
              ...genPush({ repo, description: 'count the board rentals' }),
              title: 'board rental count',
              via: RadioChannel.GH_ISSUES,
            },
          },
          { dir, cwd },
        );

        // the human typed a shell auth on this drain; it waits as on a hardware prompt
        const context = {
          cwd,
          homeDir,
          env: process.env,
          shx,
          drainDeadline,
          drainAuthDeriveCap: { milliseconds: 500 },
          authOverride: 'as-robot:shx(sleep 5 && echo ghp_stubToken000)',
        };
        return { dir, context, record };
      });

      when('[t0] the drain reaches it', () => {
        const result = useThen('it settles', async () => {
          const startedMs = Date.now();
          const fate = await setRadioTaskRecordUpstream(
            { record: scene.record, dir: scene.dir },
            scene.context,
          );
          return {
            fate,
            elapsedMs: Date.now() - startedMs,
            onDisk: daoRadioTaskRecord.get.one.byUnique({
              dir: scene.dir,
              key: scene.record.key,
            }),
          };
        });

        then(
          'it is set aside as its own auth fault, never "spent its send budget"',
          () => {
            expect(result.fate.fate).toEqual('held');
            if (result.fate.fate !== 'held') throw new Error('not held');
            expect(result.fate.halt).toEqual(false);
            expect(result.fate.detail).toContain('auth derive did not finish');
            expect(result.fate.detail).not.toContain('send budget');
          },
        );

        then(
          'the record holds upstream:auth on disk, so its fix line shows',
          () => {
            expect(result.onDisk?.recordStatus).toEqual(
              RadioTaskRecordStatus.QUEUED,
            );
            expect(result.onDisk?.reason).toEqual('upstream:auth');
          },
        );

        then('it costs the cap, not the stall', () => {
          expect(result.elapsedMs).toBeLessThan(4_000);
        });
      });
    },
  );
});
