import * as fs from 'fs';
import * as path from 'path';
import { genTempDir, given, then, useBeforeAll, useThen, when } from 'test-fns';

import { daoRadioTaskRecord } from '@src/access/daos/daoRadioTaskRecord';
import { RadioChannel } from '@src/domain.objects/RadioChannel';
import { RadioTaskRecordStatus } from '@src/domain.objects/RadioTaskRecordStatus';
import { RadioTaskRepo } from '@src/domain.objects/RadioTaskRepo';
import { shx } from '@src/infra/shell/shx';

import { getOneRadioPushDrainWithBacklog } from './getOneRadioPushDrainWithBacklog';
import { setRadioTaskRecordFromPush } from './setRadioTaskRecordFromPush';

/**
 * .mock = the gh cli, via a stub `gh` first on PATH
 * .why  = a public repo and a private one, side by side in one drain, is a state a test cannot
 *         set up on demand against real github; the stub answers each repo's visibility from a
 *         mode file and logs every call, so a test can count the creates per repo
 * .real = src/access/daos/daoRadioTask/getOneGhRepoVisibility.integration.test.ts reads the real
 *         demo repo; the via-gh-issues acceptance suites push to it with the promise
 */
const STUB_GH = `#!/usr/bin/env bash
echo "$*" >> "$STUB_GH_DIR/calls.log"
case "$1 $2" in
  "api user") echo "stubbot"; exit 0 ;;
  "repo view")
    mode="$(cat "$STUB_GH_DIR/mode.$(printf '%s' "$3" | tr '/' '_')" 2>/dev/null || echo PRIVATE)"
    echo "{\\"visibility\\":\\"$mode\\"}"; exit 0 ;;
  "issue list") echo "[]" ;;
  "issue create")
    n="$(cat "$STUB_GH_DIR/seq" 2>/dev/null || echo 800)"; n=$((n + 1)); echo "$n" > "$STUB_GH_DIR/seq"
    echo "https://github.com/stub/stub/issues/$n" ;;
  *) echo "stub gh: unexpected call: $*" >&2; exit 1 ;;
esac
`;

const repoPublic = new RadioTaskRepo({
  owner: 'sandpine',
  name: 'surf-forecast-public',
});
const repoPrivate = new RadioTaskRepo({
  owner: 'sandpine',
  name: 'svc-lessons',
});
const authEnv = 'as-robot:env(RADIO_NUDGE_TEST_TOKEN)';

/**
 * .what = a temp git repo + a temp home with radio allowed for the sandpine org
 */
const genScene = (input: { slug: string }) => {
  const cwd = genTempDir({ slug: input.slug, git: true });
  const homeDir = genTempDir({ slug: `${input.slug}-home` });
  const dirMeter = path.join(
    homeDir,
    '.rhachet/storage/repo=bhuild/role=dispatcher/.meter',
  );
  fs.mkdirSync(dirMeter, { recursive: true });
  fs.writeFileSync(
    path.join(dirMeter, 'radio.uses.org.jsonc'),
    JSON.stringify({ orgs: { sandpine: 'allowed' } }),
  );
  return { cwd, homeDir, dir: path.join(cwd, '.behavior', '.radio') };
};

/**
 * .what = transcribe one create push into the queue
 */
const genPushRecord = (input: {
  scene: { cwd: string; dir: string };
  repo: RadioTaskRepo;
  title: string;
}) =>
  setRadioTaskRecordFromPush(
    {
      push: {
        repo: input.repo,
        via: RadioChannel.GH_ISSUES,
        auth: authEnv,
        idem: null,
        title: input.title,
        description: `details for ${input.title}`,
        exid: null,
        status: null,
        promise: null,
      },
    },
    { dir: input.scene.dir, cwd: input.scene.cwd },
  ).record;

/**
 * .what = the creates the stub saw for one repo
 */
const getCreatesOf = (input: { repo: RadioTaskRepo }): string[] =>
  fs
    .readFileSync(path.join(process.env.STUB_GH_DIR ?? '', 'calls.log'), 'utf8')
    .split('\n')
    .filter(
      (line) =>
        line.startsWith('issue create') &&
        line.includes(`${input.repo.owner}/${input.repo.name}`),
    );

describe('getOneRadioPushDrainWithBacklog', () => {
  const pathPrior = process.env.PATH;
  beforeAll(() => {
    const dir = genTempDir({ slug: 'radio-nudge-drain-stub-gh' });
    fs.writeFileSync(path.join(dir, 'gh'), STUB_GH, { mode: 0o755 });
    fs.writeFileSync(path.join(dir, 'calls.log'), '');
    fs.writeFileSync(
      path.join(dir, `mode.${repoPublic.owner}_${repoPublic.name}`),
      'PUBLIC',
    );
    process.env.STUB_GH_DIR = dir;
    process.env.PATH = `${dir}:${pathPrior}`;
    process.env.RADIO_NUDGE_TEST_TOKEN = 'ghp_radioNudgeTestTokenStub0000000';
  });
  afterAll(() => {
    process.env.PATH = pathPrior;
  });

  given(
    '[case1] a public push with no promise, a private record held in the backlog ahead of it',
    () => {
      const scene = useBeforeAll(async () => {
        const base = genScene({ slug: 'radio-nudge-drain-public' });
        const backlogRecord = genPushRecord({
          scene: base,
          repo: repoPrivate,
          title: 'lesson reminder flakes',
        });
        const pushRecord = genPushRecord({
          scene: base,
          repo: repoPublic,
          title: 'swell height per spot',
        });
        return { ...base, backlogRecord, pushRecord };
      });

      when('[t0] the push drains its line', () => {
        const result = useThen('the drain runs', async () =>
          getOneRadioPushDrainWithBacklog(
            { record: scene.pushRecord, dir: scene.dir, authTyped: authEnv },
            {
              cwd: scene.cwd,
              homeDir: scene.homeDir,
              env: process.env,
              shx,
            },
          ),
        );

        then(
          'the nudge names the reason, the record, and its path from the repo root',
          () => {
            expect(result.nudge?.reason).toEqual('public-repo:unpromised');
            expect(result.nudge?.record.key).toEqual(scene.pushRecord.key);
            expect(result.nudge?.recordPath).toEqual(
              `.behavior/.radio/record.${scene.pushRecord.key}.json`,
            );
          },
        );

        then('the nudge counts no strand: naught waits behind a create', () => {
          expect(result.nudge?.behind).toEqual([]);
          expect(result.nudge?.deliverNeedsClaim).toEqual(false);
        });

        then(
          'the push own record is DROPPED on disk, and no create reached the public repo',
          () => {
            const onDisk = daoRadioTaskRecord.get.one.byUnique({
              dir: scene.dir,
              key: scene.pushRecord.key,
            });
            expect(onDisk?.recordStatus).toEqual(RadioTaskRecordStatus.DROPPED);
            expect(getCreatesOf({ repo: repoPublic })).toEqual([]);
          },
        );

        then(
          'the private backlog record rode the drain and was delivered',
          () => {
            expect(result.others.map((fate) => fate.fate)).toEqual([
              'delivered',
            ]);
            expect(getCreatesOf({ repo: repoPrivate })).toHaveLength(1);
          },
        );

        then(
          'the backlog read after the drain excludes the dropped record',
          () => {
            expect(result.backlog).toEqual([]);
          },
        );
      });
    },
  );

  given('[case2] a push into a private repo, no promise', () => {
    const scene = useBeforeAll(async () => {
      const base = genScene({ slug: 'radio-nudge-drain-private' });
      const pushRecord = genPushRecord({
        scene: base,
        repo: repoPrivate,
        title: 'wetsuit sizes per lesson',
      });
      return { ...base, pushRecord };
    });

    when('[t0] the push drains its line', () => {
      const result = useThen('the drain runs', async () =>
        getOneRadioPushDrainWithBacklog(
          { record: scene.pushRecord, dir: scene.dir, authTyped: authEnv },
          {
            cwd: scene.cwd,
            homeDir: scene.homeDir,
            env: process.env,
            shx,
          },
        ),
      );

      then('no nudge: a private repo owes no promise', () => {
        expect(result.nudge).toBeNull();
      });

      then('the push is delivered, the backlog empty', () => {
        expect(result.pushed.fate).toEqual('delivered');
        expect(result.backlog).toEqual([]);
      });
    });
  });
});
