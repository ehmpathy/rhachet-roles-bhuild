import * as fs from 'fs';
import * as path from 'path';
import { genTempDir, given, then, useBeforeAll, useThen, when } from 'test-fns';

import { RadioChannel } from '@src/domain.objects/RadioChannel';
import { RadioTaskRecordStatus } from '@src/domain.objects/RadioTaskRecordStatus';
import { RadioTaskRepo } from '@src/domain.objects/RadioTaskRepo';
import { shx } from '@src/infra/shell/shx';

import { setRadioTaskRecordFromPush } from './setRadioTaskRecordFromPush';
import { setRadioTaskRecordsDrained } from './setRadioTaskRecordsDrained';

/**
 * .mock = the gh cli, via a stub `gh` first on PATH
 * .why  = a stalled github, a slow one, and a 403 on a given title are faults a test
 *         cannot provoke on demand against real github; the stub plays each per target repo
 * .real = the gh dao itself in daoRadioTaskViaGhIssues.integration.test.ts
 *
 * .note = mode `stall` never answers a lookup (exec sleep, so the kill reaches it at once);
 *         mode `slow` answers each lookup after one second; mode `refuse` refuses each create
 *         with github's 403 text
 */
const STUB_GH = `#!/usr/bin/env bash
args="$*"
repo="$(printf '%s' "$args" | grep -oE -- '--repo [^ ]+' | cut -d' ' -f2 | tr '/' '_')"
mode="ok"
if [ -n "$repo" ] && [ -f "$STUB_GH_DIR/mode.$repo" ]; then mode="$(cat "$STUB_GH_DIR/mode.$repo")"; fi
case "$1 $2" in
  "api user") echo "stubbot"; exit 0 ;;
esac
if [ "$mode" = "stall" ]; then exec sleep 20; fi
if [ "$mode" = "slow" ]; then sleep 1; fi
if [ "$mode" = "refuse" ] && [ "$1 $2" = "issue create" ]; then echo "HTTP 403: Resource not accessible by integration (https://api.github.com/graphql)" >&2; exit 1; fi
case "$1 $2" in
  "issue list") echo "[]" ;;
  "issue create")
    n="$(cat "$STUB_GH_DIR/seq" 2>/dev/null || echo 800)"; n=$((n + 1)); echo "$n" > "$STUB_GH_DIR/seq"
    echo "https://github.com/stub/stub/issues/$n" ;;
  *) echo "stub gh: unexpected call: $args" >&2; exit 1 ;;
esac
`;

const repoStall = new RadioTaskRepo({ owner: 'sandpine', name: 'svc-lessons' });
const repoOk = new RadioTaskRepo({ owner: 'sandpine', name: 'svc-rentals' });
const repoSlow = new RadioTaskRepo({ owner: 'sandpine', name: 'coachbook' });
const repoRefuse = new RadioTaskRepo({
  owner: 'sandpine',
  name: 'spot-forecast',
});
const authEnv = 'as-robot:env(RADIO_SENDLIMIT_TEST_TOKEN)';

/**
 * .what = a temp git repo + a temp home, with the sandpine org gate open
 * .why = every record here meets an open gate, so only the send can hold it
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
  return { cwd, homeDir };
};

/**
 * .what = set how the stub gh answers for one target repo
 */
const setStubMode = (input: {
  repo: RadioTaskRepo;
  mode: 'ok' | 'stall' | 'slow' | 'refuse';
}) =>
  fs.writeFileSync(
    path.join(
      process.env.STUB_GH_DIR ?? '',
      `mode.${input.repo.owner}_${input.repo.name}`,
    ),
    input.mode,
  );

/**
 * .what = transcribe one create into the queue, unsent
 */
const holdCreate = (input: {
  cwd: string;
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
      },
    },
    { dir: path.join(input.cwd, '.behavior', '.radio'), cwd: input.cwd },
  ).record;

/**
 * .what = the elapsed milliseconds of an async act, from the monotonic clock
 */
const getElapsed = async <T>(
  act: () => Promise<T>,
): Promise<{ result: T; milliseconds: number }> => {
  const startedNs = process.hrtime.bigint();
  const result = await act();
  return {
    result,
    milliseconds: Number(process.hrtime.bigint() - startedNs) / 1_000_000,
  };
};

describe('setRadioTaskRecordsDrained — the send limit', () => {
  const pathPrior = process.env.PATH;

  // put the stub gh first on PATH, with a token the env auth mode can read
  beforeAll(() => {
    const dir = genTempDir({ slug: 'radio-sendlimit-stub-gh' });
    fs.writeFileSync(path.join(dir, 'gh'), STUB_GH, { mode: 0o755 });
    process.env.STUB_GH_DIR = dir;
    process.env.PATH = `${dir}:${pathPrior}`;
    process.env.RADIO_SENDLIMIT_TEST_TOKEN =
      'ghp_radioSendLimitTestTokenStub000000';
    setStubMode({ repo: repoStall, mode: 'stall' });
    setStubMode({ repo: repoOk, mode: 'ok' });
    setStubMode({ repo: repoSlow, mode: 'slow' });
    setStubMode({ repo: repoRefuse, mode: 'refuse' });
  });
  afterAll(() => {
    process.env.PATH = pathPrior;
  });

  given(
    '[case1] a record whose gh call stalls, ahead of a record that would land',
    () => {
      const scene = useBeforeAll(async () => {
        const { cwd, homeDir } = genScene({ slug: 'radio-sendlimit-stall' });
        const stalled = holdCreate({
          cwd,
          repo: repoStall,
          title: 'lesson reminders',
        });
        const behind = holdCreate({
          cwd,
          repo: repoOk,
          title: 'wetsuit sizes',
        });
        return { cwd, homeDir, stalled, behind };
      });

      when('[t0] a drain runs with a short per-call bound', () => {
        const result = useThen('it returns its fates', async () =>
          getElapsed(() =>
            setRadioTaskRecordsDrained(
              {},
              {
                cwd: scene.cwd,
                homeDir: scene.homeDir,
                env: process.env,
                shx,
                drainSendLimit: {
                  perCall: { milliseconds: 300 },
                  perSend: { milliseconds: 5_000 },
                },
              },
            ),
          ),
        );

        then('the stalled record is held as transient, and halts', () => {
          const [first] = result.result.fates;
          expect(first?.fate).toEqual('held');
          expect(first?.record.key).toEqual(scene.stalled.key);
          expect(first?.record.reason).toEqual('upstream:transient');
          expect(first?.fate === 'held' ? first.halt : null).toEqual(true);
        });

        then('the record behind it is held behind the halt, unsent', () => {
          const [, second] = result.result.fates;
          expect(second?.fate).toEqual('held');
          expect(second?.record.key).toEqual(scene.behind.key);
          expect(second?.record.recordStatus).toEqual(
            RadioTaskRecordStatus.QUEUED,
          );
          expect(second?.fate === 'held' ? second.halt : null).toEqual(false);
        });

        then('the drain ends well before the stub would answer', () => {
          expect(result.milliseconds).toBeLessThan(5_000);
        });
      });
    },
  );

  given(
    '[case2] a record whose every gh call is slow, under a short send deadline',
    () => {
      const scene = useBeforeAll(async () => {
        const { cwd, homeDir } = genScene({ slug: 'radio-sendlimit-slow' });
        const slow = holdCreate({
          cwd,
          repo: repoSlow,
          title: 'coachbook ics',
        });
        return { cwd, homeDir, slow };
      });

      when(
        '[t0] a drain runs with a per-send deadline under its call count',
        () => {
          const result = useThen('it returns its fates', async () =>
            getElapsed(() =>
              setRadioTaskRecordsDrained(
                {},
                {
                  cwd: scene.cwd,
                  homeDir: scene.homeDir,
                  env: process.env,
                  shx,
                  drainSendLimit: {
                    perCall: { milliseconds: 3_000 },
                    perSend: { milliseconds: 1_500 },
                  },
                },
              ),
            ),
          );

          then('the send is cut at its deadline and held as transient', () => {
            const [first] = result.result.fates;
            expect(first?.fate).toEqual('held');
            expect(first?.record.reason).toEqual('upstream:transient');
            expect(first?.record.recordStatus).toEqual(
              RadioTaskRecordStatus.QUEUED,
            );
          });

          then('the drain ends inside the send deadline plus slack', () => {
            expect(result.milliseconds).toBeLessThan(2_800);
          });
        },
      );
    },
  );

  given(
    '[case3] a create refused with a 403, its title names a rate limit',
    () => {
      const scene = useBeforeAll(async () => {
        const { cwd, homeDir } = genScene({ slug: 'radio-sendlimit-title' });
        const refused = holdCreate({
          cwd,
          repo: repoRefuse,
          title: 'handle rate limit in radio',
        });
        const behind = holdCreate({
          cwd,
          repo: repoOk,
          title: 'board rentals',
        });
        return { cwd, homeDir, refused, behind };
      });

      when('[t0] a drain runs', () => {
        const result = useThen('it returns its fates', async () =>
          setRadioTaskRecordsDrained(
            {},
            { cwd: scene.cwd, homeDir: scene.homeDir, env: process.env, shx },
          ),
        );

        then('the fault is classified from what github said: access', () => {
          const [first] = result.fates;
          expect(first?.record.key).toEqual(scene.refused.key);
          expect(first?.record.reason).toEqual('upstream:access');
          expect(first?.fate === 'held' ? first.halt : null).toEqual(false);
        });

        then('the record behind it still delivers (no halt)', () => {
          const [, second] = result.fates;
          expect(second?.fate).toEqual('delivered');
        });
      });
    },
  );
});
