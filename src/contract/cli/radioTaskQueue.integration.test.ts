import * as fs from 'fs';
import { mkdtempSync } from 'fs';
import { ConstraintError } from 'helpful-errors';
import * as os from 'os';
import * as path from 'path';
import { genTempDir, given, then, useBeforeAll, useThen, when } from 'test-fns';

import { daoRadioTaskRecord } from '@src/access/daos/daoRadioTaskRecord';
import { RadioChannel } from '@src/domain.objects/RadioChannel';
import { RadioTaskRecord } from '@src/domain.objects/RadioTaskRecord';
import { RadioTaskRecordStatus } from '@src/domain.objects/RadioTaskRecordStatus';
import { RadioTaskRepo } from '@src/domain.objects/RadioTaskRepo';
import { RadioTaskStatus } from '@src/domain.objects/RadioTaskStatus';
import { setRadioTaskRecordFromPush } from '@src/domain.operations/radio/record/setRadioTaskRecordFromPush';

import { cliRadioTaskPush } from './radioTaskPush';
import { cliRadioTaskQueue } from './radioTaskQueue';

/**
 * .what = contract-boundary tests for the radio.task.queue CLI: its help and its error paths
 * .why  = snaps what a human reads when a verb or a flag is wrong, so a reviewer sees the
 *         exact text, and asserts each is a ConstraintError (exit 2) that names its fix
 *
 * .note = each run isolates HOME + cwd to a fresh temp dir, so no ambient radio record or
 *         radio.uses config is read. an invalid `--when` value is rejected by the shared
 *         getCliArgs zod gate, which calls process.exit(1); that path cannot be run in-process
 */
describe('radio.task.queue.integration — CLI contract', () => {
  // run the cli with argv under an isolated HOME + cwd; capture stdout and any thrown error
  const runQueue = async (input: {
    argvTail: string[];
  }): Promise<{ stdout: string; error: Error | null }> => {
    const home = mkdtempSync(path.join(os.tmpdir(), 'radio-queue-cli-'));
    const argvBefore = process.argv;
    const envBefore = process.env;
    const cwdBefore = process.cwd();
    const lines: string[] = [];
    const logSpy = jest
      .spyOn(console, 'log')
      .mockImplementation((...args: unknown[]) => {
        lines.push(args.map((a) => String(a)).join(' '));
      });
    process.argv = ['node', ...input.argvTail];
    process.env = { ...envBefore, HOME: home };
    process.chdir(home);
    try {
      const error = await cliRadioTaskQueue().then(
        () => null,
        (thrown: unknown) => {
          if (thrown instanceof Error) return thrown;
          throw thrown;
        },
      );
      return { stdout: lines.join('\n'), error };
    } finally {
      process.argv = argvBefore;
      process.env = envBefore;
      process.chdir(cwdBefore);
      logSpy.mockRestore();
    }
  };

  given('[case1] --help', () => {
    when('[t0] the queue skill runs', () => {
      then('prints the usage contract for all four verbs', async () => {
        const result = await runQueue({ argvTail: ['--help'] });
        expect(result.error).toBeNull();
        expect(result.stdout).toContain('radio.task.queue get');
        expect(result.stdout).toContain('radio.task.queue drain');
        expect(result.stdout).toMatchSnapshot();
      });
    });

    when('[t1] the queue skill runs with the short -h', () => {
      then('prints the same usage contract as --help', async () => {
        const long = await runQueue({ argvTail: ['--help'] });
        const short = await runQueue({ argvTail: ['-h'] });
        expect(short.error).toBeNull();
        expect(short.stdout).toEqual(long.stdout);
      });
    });
  });

  given('[case2] no verb', () => {
    when('[t0] the queue skill runs', () => {
      then('prints the same usage contract, not an error', async () => {
        const result = await runQueue({ argvTail: [] });
        const help = await runQueue({ argvTail: ['--help'] });
        expect(result.error).toBeNull();
        expect(result.stdout).toEqual(help.stdout);
      });
    });
  });

  given('[case3] an unknown verb', () => {
    when('[t0] the queue skill runs', () => {
      then('fails with a constraint that names the four verbs', async () => {
        const result = await runQueue({ argvTail: ['flush'] });
        expect(result.error).toBeInstanceOf(ConstraintError);
        expect(result.error?.message).toContain('use get, set, del, or drain');
        expect(result.error?.message).toMatchSnapshot();
      });
    });
  });

  given('[case4] set with no field to amend', () => {
    when('[t0] the queue skill runs', () => {
      then('fails with a constraint that names the two fields', async () => {
        const result = await runQueue({
          argvTail: ['set', '--key', 'a1b2c3d4e5f60718'],
        });
        expect(result.error).toBeInstanceOf(ConstraintError);
        expect(result.error?.message).toContain('--auth and/or --description');
        expect(result.error?.message).toMatchSnapshot();
      });
    });
  });

  given('[case5] set with no --key', () => {
    when('[t0] the queue skill runs', () => {
      then('fails with a constraint that names how to list keys', async () => {
        const result = await runQueue({
          argvTail: ['set', '--auth', 'as-human'],
        });
        expect(result.error).toBeInstanceOf(ConstraintError);
        expect(result.error?.message).toContain('rhx radio.task.queue get');
        expect(result.error?.message).toMatchSnapshot();
      });
    });
  });

  given('[case6] del with no --key', () => {
    when('[t0] the queue skill runs', () => {
      then('fails with a constraint that names how to list keys', async () => {
        const result = await runQueue({
          argvTail: ['del', '--why', 'superseded by a coachbook task'],
        });
        expect(result.error).toBeInstanceOf(ConstraintError);
        expect(result.error?.message).toContain('rhx radio.task.queue get');
        expect(result.error?.message).toMatchSnapshot();
      });
    });
  });

  given('[case7] del with no --why', () => {
    when('[t0] the queue skill runs', () => {
      then('fails with a constraint that shows a --why to pass', async () => {
        const result = await runQueue({
          argvTail: ['del', '--key', 'a1b2c3d4e5f60718'],
        });
        expect(result.error).toBeInstanceOf(ConstraintError);
        expect(result.error?.message).toContain('--why is required');
        expect(result.error?.message).toMatchSnapshot();
      });
    });
  });

  given('[case8] an --auth value that is not an auth mode', () => {
    when('[t0] set runs with it', () => {
      then('fails with a constraint that lists the four modes', async () => {
        const result = await runQueue({
          argvTail: ['set', '--key', 'a1b2c3d4e5f60718', '--auth', 'as-surfer'],
        });
        expect(result.error).toBeInstanceOf(ConstraintError);
        expect(result.error?.message).toContain('as-human');
        expect(result.error?.message).toContain('as-robot:via-keyrack(owner)');
        expect(result.error?.message).toContain('as-robot:env(VAR)');
        expect(result.error?.message).toContain('as-robot:shx(cmd)');
        expect(result.error?.message).toMatchSnapshot();
      });
    });

    when('[t1] drain runs with it', () => {
      then('fails the same way, before any send', async () => {
        const result = await runQueue({
          argvTail: ['drain', '--auth', 'as-surfer'],
        });
        expect(result.error).toBeInstanceOf(ConstraintError);
        expect(result.error?.message).toContain('is not an auth mode');
        expect(result.error?.message).toMatchSnapshot();
      });
    });
  });

  given('[case9] set with a --title', () => {
    when('[t0] the queue skill runs', () => {
      then(
        'fails with a constraint that names the del + re-push path',
        async () => {
          const result = await runQueue({
            argvTail: [
              'set',
              '--key',
              'a1b2c3d4e5f60718',
              '--title',
              'book a lesson',
            ],
          });
          expect(result.error).toBeInstanceOf(ConstraintError);
          expect(result.error?.message).toContain(
            'to retitle, run `rhx radio.task.queue del --key <key>` and push again',
          );
          expect(result.error?.message).toMatchSnapshot();
        },
      );
    });
  });

  given('[case14] a verb with a flag it does not read', () => {
    when('[t0] drain runs with --key, as though it scoped the drain', () => {
      then(
        'it refuses before any send, and names what drain reads',
        async () => {
          const result = await runQueue({
            argvTail: [
              'drain',
              '--key',
              'a1b2c3d4e5f60718',
              '--auth',
              'as-human',
            ],
          });
          expect(result.error).toBeInstanceOf(ConstraintError);
          expect(result.error?.message).toContain('drain does not read --key');
          expect(result.error?.message).toContain('--auth');
          expect(result.error?.message).toMatchSnapshot();
        },
      );
    });

    when('[t1] drain runs with --mode plan, as though it previewed', () => {
      then('it refuses rather than send for real', async () => {
        const result = await runQueue({
          argvTail: ['drain', '--mode', 'plan'],
        });
        expect(result.error).toBeInstanceOf(ConstraintError);
        expect(result.error?.message).toContain('drain does not read --mode');
        expect(result.error?.message).toMatchSnapshot();
      });
    });

    when('[t2] del runs with a --description', () => {
      then('it refuses, and names what del reads', async () => {
        const result = await runQueue({
          argvTail: [
            'del',
            '--key',
            'a1b2c3d4e5f60718',
            '--why',
            'moot',
            '--description',
            'new body',
          ],
        });
        expect(result.error).toBeInstanceOf(ConstraintError);
        expect(result.error?.message).toContain(
          'del does not read --description',
        );
        expect(result.error?.message).toContain('--key, --why');
      });
    });
  });

  given('[case15] set with a blank --description', () => {
    when('[t0] the queue skill runs', () => {
      then('it refuses to blank the body', async () => {
        const result = await runQueue({
          argvTail: [
            'set',
            '--key',
            'a1b2c3d4e5f60718',
            '--description',
            '   ',
          ],
        });
        expect(result.error).toBeInstanceOf(ConstraintError);
        expect(result.error?.message).toContain('--description is empty');
        expect(result.error?.message).toMatchSnapshot();
      });
    });
  });

  given('[case10] set on a key no record holds', () => {
    when('[t0] the queue skill runs', () => {
      then('fails with a constraint that names how to list keys', async () => {
        const result = await runQueue({
          argvTail: ['set', '--key', 'a1b2c3d4e5f60718', '--auth', 'as-human'],
        });
        expect(result.error).toBeInstanceOf(ConstraintError);
        expect(result.error?.message).toMatchSnapshot();
      });
    });
  });
});

/**
 * .mock = the gh cli, via a stub `gh` first on PATH
 * .why  = an update the robot may not write, a rate limit, and a human gh session are states a
 *         test cannot provoke on demand against real github; the stub replays gh's own stderr
 *         text per target repo, and logs which token each call carried
 * .real = src/domain.operations/radio/record/setRadioTaskRecordsDrainedByPush.integration.test.ts
 *         [case7] (a peer file) runs the 401 path against real github with a rejected token, and
 *         skill.radio.task.push.via-gh-issues [case1]-[case6] create and update real issues with
 *         the keyrack token (ci shard `test-shards-acceptance (explicit, 2, ...)`)
 * .note = the stub token is a marker the stub logs, never a credential: no call it carries
 *         reaches github, so no real token is owed here
 */
const STUB_GH = `#!/usr/bin/env bash
args="$*"
repo="$(printf '%s' "$args" | grep -oE -- '--repo [^ ]+' | cut -d' ' -f2 | tr '/' '_')"
echo "\${GH_TOKEN:-<gh-session>} $1 $2 $repo" >> "$STUB_GH_DIR/calls.log"
mode="ok"
if [ -n "$repo" ] && [ -f "$STUB_GH_DIR/mode.$repo" ]; then mode="$(cat "$STUB_GH_DIR/mode.$repo")"; fi
case "$1 $2" in
  "api user") echo "stubbot"; exit 0 ;;
esac
if [ "$mode" = "rate-limit" ]; then echo "API rate limit exceeded for installation ID 1" >&2; exit 1; fi
if [ "$mode" = "access-update" ] && [ "$1 $2" = "issue edit" ]; then echo "GraphQL: Resource not accessible by integration (updateIssue)" >&2; exit 1; fi
if [ "$mode" = "access-update" ] && [ "$1 $2" = "issue close" ]; then echo "GraphQL: Resource not accessible by integration (updateIssue)" >&2; exit 1; fi
if [ "$mode" = "access-claim" ] && [ "$1 $2" = "issue view" ]; then echo '{"number":599,"title":"🎙️ task - board rentals open friday","body":"**description**\\n\\nboard rentals open friday","state":"OPEN","assignees":[],"createdAt":"2026-10-20T00:00:00Z","author":{"login":"stubbot"}}'; exit 0; fi
if [ "$mode" = "access-claim" ] && [ "$1 $2" = "issue edit" ]; then echo "GraphQL: Resource not accessible by integration (updateIssue)" >&2; exit 1; fi
if [ "$mode" = "open" ] && [ "$1 $2" = "issue view" ]; then echo '{"number":599,"title":"🎙️ task - board rentals open friday","body":"**description**\\n\\nboard rentals open friday","state":"OPEN","assignees":[],"createdAt":"2026-10-20T00:00:00Z","author":{"login":"stubbot"}}'; exit 0; fi
if [ "$mode" = "not-radio" ] && [ "$1 $2" = "issue view" ]; then echo '{"number":599,"title":"wetsuit rack is broken","body":"filed by hand","state":"OPEN","assignees":[],"createdAt":"2026-10-20T00:00:00Z","author":{"login":"bert"}}'; exit 0; fi
if [ "$mode" = "absent" ] && [ "$1 $2" = "issue view" ]; then echo "GraphQL: Could not resolve to an issue or pull request with the number of 599. (repository.issue)" >&2; exit 1; fi
case "$1 $2" in
  "issue view") echo '{"number":599,"title":"🎙️ task - board rentals open friday","body":"**description**\\n\\nboard rentals open friday","state":"OPEN","assignees":[{"login":"stubbot"}],"createdAt":"2026-10-20T00:00:00Z","author":{"login":"stubbot"}}' ;;
  "issue edit"|"issue close") echo "https://github.com/stub/stub/issues/599" ;;
  "issue list") echo "[]" ;;
  "issue create")
    n="$(cat "$STUB_GH_DIR/seq" 2>/dev/null || echo 700)"; n=$((n + 1)); echo "$n" > "$STUB_GH_DIR/seq"
    echo "https://github.com/stub/stub/issues/$n" ;;
  *) echo "stub gh: unexpected call: $args" >&2; exit 1 ;;
esac
`;

const repoLessons = new RadioTaskRepo({
  owner: 'sandpine',
  name: 'svc-lessons',
});
const repoRentals = new RadioTaskRepo({
  owner: 'sandpine',
  name: 'svc-rentals',
});
const repoForecast = new RadioTaskRepo({
  owner: 'sandpine',
  name: 'spot-forecast',
});
const authEnv = 'as-robot:env(RADIO_QUEUE_JOURNEY_TOKEN)';
const tokenStub = 'ghp_radioQueueJourneyTokenStub000000';

/**
 * .what = a cli stdout with its per-run parts masked: record keys and temp paths
 * .why = a snapshot must match on every run
 */
const asMaskedStdout = (input: { stdout: string }): string =>
  input.stdout
    .replace(/[0-9a-f]{16}/g, '<key>')
    .replace(
      new RegExp(
        os.tmpdir().replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '[^\\s)]*',
        'g',
      ),
      '<tmp>',
    );

describe('radio.task.queue.integration — a journey across faults, via a stub gh', () => {
  const pathPrior = process.env.PATH;
  const stubDir = genTempDir({ slug: 'radio-queue-journey-stub-gh' });

  // put the stub gh first on PATH, with a token the env auth mode can read
  beforeAll(() => {
    fs.writeFileSync(path.join(stubDir, 'gh'), STUB_GH, { mode: 0o755 });
    process.env.STUB_GH_DIR = stubDir;
    process.env.PATH = `${stubDir}:${pathPrior}`;
    process.env.RADIO_QUEUE_JOURNEY_TOKEN = tokenStub;
  });
  afterAll(() => {
    process.env.PATH = pathPrior;
  });

  /**
   * .what = set how the stub gh answers for one target repo
   * .why = each step faults some targets and leaves the rest deliverable
   */
  const setStubMode = (input: {
    repo: RadioTaskRepo;
    mode:
      | 'ok'
      | 'rate-limit'
      | 'access-update'
      | 'access-claim'
      | 'open'
      | 'not-radio'
      | 'absent';
  }) =>
    fs.writeFileSync(
      path.join(stubDir, `mode.${input.repo.owner}_${input.repo.name}`),
      input.mode,
    );

  /**
   * .what = the gh calls the stub saw since a mark, each with the token it carried
   * .why = proves which auth a drain sent under
   */
  const getStubCalls = (): string[] => {
    const file = path.join(stubDir, 'calls.log');
    if (!fs.existsSync(file)) return [];
    return fs.readFileSync(file, 'utf8').split('\n').filter(Boolean);
  };

  /**
   * .what = a temp git repo + a temp home whose org gate lets sandpine through
   * .why = the cli reads HOME for radio.uses and cwd for the records
   */
  const genScene = (input: { slug: string }) => {
    const cwd = genTempDir({ slug: input.slug, git: true });
    const homeDir = genTempDir({ slug: `${input.slug}-home` });
    setSceneGate({ scene: { homeDir }, gate: 'allowed' });
    return { cwd, homeDir, dir: path.join(cwd, '.behavior', '.radio') };
  };

  /**
   * .what = set the org gate for sandpine in a scene's home
   * .why = a held twin shuts the gate at push, then opens it for the drain
   */
  const setSceneGate = (input: {
    scene: { homeDir: string };
    gate: 'allowed' | 'blocked';
  }) => {
    const dirMeter = path.join(
      input.scene.homeDir,
      '.rhachet/storage/repo=bhuild/role=dispatcher/.meter',
    );
    fs.mkdirSync(dirMeter, { recursive: true });
    fs.writeFileSync(
      path.join(dirMeter, 'radio.uses.org.jsonc'),
      JSON.stringify({ orgs: { sandpine: input.gate } }),
    );
  };

  /**
   * .what = the one record on disk in a scene, read back whole
   * .why = a push mints its own key; the test reads the record it left
   */
  const getSceneRecords = (input: { scene: { dir: string } }) =>
    daoRadioTaskRecord.get
      .all({ dirs: [input.scene.dir] })
      .map(({ record }) => record);

  /**
   * .what = transcribe one push into the queue, unsent
   * .why = the held work each step starts from
   */
  const holdPush = (input: {
    scene: { cwd: string; dir: string };
    repo: RadioTaskRepo;
    title: string | null;
    exid?: string | null;
    status?: RadioTaskStatus | null;
    description?: string | null;
  }) =>
    setRadioTaskRecordFromPush(
      {
        push: {
          repo: input.repo,
          via: RadioChannel.GH_ISSUES,
          auth: authEnv,
          idem: null,
          title: input.title,
          description:
            input.description ??
            (input.title ? `details for ${input.title}` : null),
          exid: input.exid ?? null,
          status: input.status ?? null,
        },
      },
      { dir: input.scene.dir, cwd: input.scene.cwd },
    ).record;

  /**
   * .what = run the cli in the scene; capture stdout, the exit code, any thrown error
   * .why = the journey runs through the contract a clone calls, never the domain ops alone
   *
   * .note = envOmit drops the test-env markers for an as-human run; the stub gh stands in for
   *         the human gh session, so no real login is ever read
   */
  const runQueueInScene = async (input: {
    scene: { cwd: string; homeDir: string };
    argvTail: string[];
    envOmit?: string[];
    cli?: () => Promise<void>;
  }): Promise<{ stdout: string; exitCode: number; error: Error | null }> => {
    const argvBefore = process.argv;
    const envBefore = process.env;
    const cwdBefore = process.cwd();
    const exitCodeBefore = process.exitCode;
    const lines: string[] = [];
    const logSpy = jest
      .spyOn(console, 'log')
      .mockImplementation((...args: unknown[]) => {
        lines.push(args.map((a) => String(a)).join(' '));
      });
    const envNext: NodeJS.ProcessEnv = {
      ...envBefore,
      HOME: input.scene.homeDir,
    };
    (input.envOmit ?? []).forEach((name) => delete envNext[name]);
    process.argv = ['node', ...input.argvTail];
    process.env = envNext;
    process.exitCode = 0;
    process.chdir(input.scene.cwd);
    try {
      const error = await (input.cli ?? cliRadioTaskQueue)().then(
        () => null,
        (thrown: unknown) => {
          if (thrown instanceof Error) return thrown;
          throw thrown;
        },
      );
      return {
        stdout: lines.join('\n'),
        exitCode: Number(process.exitCode ?? 0),
        error,
      };
    } finally {
      process.argv = argvBefore;
      process.env = envBefore;
      process.exitCode = exitCodeBefore;
      process.chdir(cwdBefore);
      logSpy.mockRestore();
    }
  };

  given(
    '[case11] an update the robot may not write, and a create behind it',
    () => {
      const scene = useBeforeAll(async () => {
        setStubMode({ repo: repoLessons, mode: 'access-update' });
        setStubMode({ repo: repoRentals, mode: 'ok' });
        const one = genScene({ slug: 'radio-queue-journey-c11' });
        const update = holdPush({
          scene: one,
          repo: repoLessons,
          title: null,
          exid: '599',
          status: RadioTaskStatus.DELIVERED,
          description: 'board rentals open friday',
        });
        holdPush({ scene: one, repo: repoRentals, title: 'wetsuit sizes' });
        return { ...one, update };
      });

      when('[t0] drain runs', () => {
        const result = useThen('it drains', async () =>
          runQueueInScene({ scene, argvTail: ['drain'] }),
        );

        then('it exits 2, since one record still waits', () => {
          expect(result.error).toBeNull();
          expect(result.exitCode).toEqual(2);
        });

        then(
          'the update is set aside, named, with its fault and its fix',
          () => {
            expect(result.stdout).toContain('deliver #599');
            expect(result.stdout).toContain(
              'fault: GraphQL: Resource not accessible by integration (updateIssue)',
            );
            expect(result.stdout).toContain(
              'amend it: rhx radio.task.queue set',
            );
          },
        );

        then('the create behind it still delivers', () => {
          expect(result.stdout).toContain('drained');
          expect(result.stdout).toContain('wetsuit sizes');
          const onDisk = daoRadioTaskRecord.get.one.byUnique({
            dir: scene.dir,
            key: scene.update.key,
          });
          expect(onDisk?.recordStatus).toEqual(RadioTaskRecordStatus.QUEUED);
          expect(onDisk?.reason).toEqual('upstream:access');
        });

        then('the stdout reads as a human sees it', () => {
          expect(result.stdout).not.toContain('Command failed:');
          expect(asMaskedStdout(result)).toMatchSnapshot();
        });
      });

      when('[t1] set --auth as-human on the set-aside update', () => {
        const result = useThen('it amends', async () =>
          runQueueInScene({
            scene,
            argvTail: ['set', '--key', scene.update.key, '--auth', 'as-human'],
          }),
        );

        then('it succeeds and names the change', () => {
          expect(result.error).toBeNull();
          expect(result.exitCode).toEqual(0);
          expect(result.stdout).toContain(`auth: ${authEnv} → as-human`);
          expect(asMaskedStdout(result)).toMatchSnapshot();
        });

        then('the record on disk carries the new auth, still queued', () => {
          const onDisk = daoRadioTaskRecord.get.one.byUnique({
            dir: scene.dir,
            key: scene.update.key,
          });
          expect(onDisk?.auth).toEqual('as-human');
          expect(onDisk?.recordStatus).toEqual(RadioTaskRecordStatus.QUEUED);
        });
      });

      when(
        '[t2] drain --auth as-human, once the human may write the update',
        () => {
          const result = useThen('it drains', async () => {
            setStubMode({ repo: repoLessons, mode: 'ok' });
            const create = holdPush({
              scene,
              repo: repoRentals,
              title: 'board rental hours',
            });
            const callsBefore = getStubCalls().length;
            const ran = await runQueueInScene({
              scene,
              argvTail: ['drain', '--auth', 'as-human'],
              envOmit: ['NODE_ENV', 'JEST_WORKER_ID'],
            });
            return {
              ...ran,
              create,
              calls: getStubCalls().slice(callsBefore),
            };
          });

          then('it exits 0: the queue is empty', () => {
            expect(result.error).toBeNull();
            expect(result.exitCode).toEqual(0);
          });

          then('the notice prints before the drain output', () => {
            const lines = result.stdout.split('\n');
            const idxNotice = lines.findIndex((line) =>
              line.includes('this drain sent under --auth as-human'),
            );
            const idxDrained = lines.findIndex((line) =>
              line.includes('drained'),
            );
            expect(idxNotice).toBeGreaterThanOrEqual(0);
            expect(idxDrained).toBeGreaterThan(idxNotice);
            expect(asMaskedStdout(result)).toMatchSnapshot();
          });

          then(
            'every gh call went out on the gh session, never the robot token',
            () => {
              expect(result.calls.length).toBeGreaterThan(0);
              expect(
                result.calls.every((call) => call.startsWith('<gh-session> ')),
              ).toEqual(true);
              expect(result.calls.join('\n')).not.toContain(tokenStub);
            },
          );

          then(
            'the override is for this drain only: the record keeps its own auth',
            () => {
              const onDisk = daoRadioTaskRecord.get.one.byUnique({
                dir: scene.dir,
                key: result.create.key,
              });
              expect(onDisk?.recordStatus).toEqual(
                RadioTaskRecordStatus.DELIVERED,
              );
              expect(onDisk?.auth).toEqual(authEnv);
            },
          );
        },
      );
    },
  );

  given(
    '[case12] a set-aside update, an update behind it on one issue, and a rate limit',
    () => {
      const scene = useBeforeAll(async () => {
        setStubMode({ repo: repoLessons, mode: 'access-claim' });
        setStubMode({ repo: repoForecast, mode: 'rate-limit' });
        const one = genScene({ slug: 'radio-queue-journey-c12' });
        holdPush({
          scene: one,
          repo: repoLessons,
          title: null,
          exid: '599',
          status: RadioTaskStatus.CLAIMED,
        });
        holdPush({
          scene: one,
          repo: repoLessons,
          title: null,
          exid: '599',
          status: RadioTaskStatus.DELIVERED,
          description: 'board rentals open friday',
        });
        holdPush({ scene: one, repo: repoForecast, title: 'tide widget' });
        holdPush({ scene: one, repo: repoForecast, title: 'swell alerts' });
        const drained = await runQueueInScene({
          scene: one,
          argvTail: ['drain'],
        });
        setStubMode({ repo: repoForecast, mode: 'ok' });
        return { ...one, drained };
      });

      when('[t0] get runs after the drain', () => {
        const result = useThen('it lists the queue', async () =>
          runQueueInScene({ scene, argvTail: ['get'] }),
        );

        then('the drain before it exited 2', () => {
          expect(scene.drained.exitCode).toEqual(2);
        });

        then('it lists all four records, each with its own state', () => {
          expect(result.error).toBeNull();
          expect(result.stdout).toContain('claim #599');
          expect(result.stdout).toContain('deliver #599');
          expect(result.stdout).toContain('tide widget');
          expect(result.stdout).toContain('swell alerts');
          expect(result.stdout).toContain('upstream:access');
          expect(result.stdout).toContain('upstream:rate-limit');
          expect(result.stdout).toMatch(/same issue #599/);
        });

        then('the rows read as a human sees them', () => {
          expect(asMaskedStdout(result)).toMatchSnapshot();
        });
      });

      when('[t1] get --when hook.onStop runs', () => {
        const result = useThen('it reminds', async () =>
          runQueueInScene({
            scene,
            argvTail: ['get', '--when', 'hook.onStop'],
          }),
        );

        then('it prints the one-line reminder, never exit 2', () => {
          expect(result.error).toBeNull();
          expect(result.exitCode).toEqual(0);
          expect(result.stdout).toContain('systemMessage');
          expect(asMaskedStdout(result)).toMatchSnapshot();
        });
      });
    },
  );

  given(
    '[case13] a set-aside update amended to as-human, then a plain drain (the headline path)',
    () => {
      const scene = useBeforeAll(async () => {
        setStubMode({ repo: repoRentals, mode: 'access-update' });
        const one = genScene({ slug: 'radio-queue-journey-c13' });
        const update = holdPush({
          scene: one,
          repo: repoRentals,
          title: null,
          exid: '599',
          status: RadioTaskStatus.DELIVERED,
          description: 'wetsuit rack moved to the shed',
        });
        await runQueueInScene({ scene: one, argvTail: ['drain'] });
        return { ...one, update };
      });

      when('[t0] set --auth with a shell command', () => {
        const result = useThen('it refuses', async () =>
          runQueueInScene({
            scene,
            argvTail: [
              'set',
              '--key',
              scene.update.key,
              '--auth',
              'as-robot:shx(echo pwned)',
            ],
          }),
        );

        then('it refuses to store it, and names the drain --auth path', () => {
          expect(result.error).toBeInstanceOf(ConstraintError);
          expect(result.error?.message).toContain(
            'cannot be stored on a record',
          );
          expect(result.error?.message).toContain(
            'rhx radio.task.queue drain --auth',
          );
          // the message names the auth itself; no raw json block trails it
          expect(result.error?.message).not.toContain('{');
          expect(
            result.error?.message.replace(scene.update.key, '<key>'),
          ).toMatchSnapshot();
        });

        then('the record on disk keeps its prior auth', () => {
          const onDisk = daoRadioTaskRecord.get.one.byUnique({
            dir: scene.dir,
            key: scene.update.key,
          });
          expect(onDisk?.auth).toEqual(authEnv);
        });
      });

      when(
        '[t1] set --auth as-human, then a plain drain with no --auth',
        () => {
          const result = useThen('it drains', async () => {
            await runQueueInScene({
              scene,
              argvTail: [
                'set',
                '--key',
                scene.update.key,
                '--auth',
                'as-human',
              ],
            });
            setStubMode({ repo: repoRentals, mode: 'ok' });
            const callsBefore = getStubCalls().length;
            const ran = await runQueueInScene({
              scene,
              argvTail: ['drain'],
              envOmit: ['NODE_ENV', 'JEST_WORKER_ID'],
            });
            setStubMode({ repo: repoRentals, mode: 'ok' });
            return { ...ran, calls: getStubCalls().slice(callsBefore) };
          });

          then('it exits 0, and the update lands', () => {
            expect(result.error).toBeNull();
            expect(result.exitCode).toEqual(0);
            const onDisk = daoRadioTaskRecord.get.one.byUnique({
              dir: scene.dir,
              key: scene.update.key,
            });
            expect(onDisk?.recordStatus).toEqual(
              RadioTaskRecordStatus.DELIVERED,
            );
          });

          then(
            'it sent under the record own as-human auth, no override',
            () => {
              expect(result.stdout).not.toContain(
                'this drain sent under --auth',
              );
              expect(result.calls.length).toBeGreaterThan(0);
              expect(
                result.calls.every((call) => call.startsWith('<gh-session> ')),
              ).toEqual(true);
              expect(asMaskedStdout(result)).toMatchSnapshot();
            },
          );
        },
      );
    },
  );

  given('[case16] set --description @stdin with a multi-line body', () => {
    const scene = useBeforeAll(async () => {
      const one = genScene({ slug: 'radio-queue-journey-c16' });
      const create = holdPush({
        scene: one,
        repo: repoRentals,
        title: 'wetsuit sizes',
      });
      return { ...one, create };
    });

    /**
     * .what = run `set --description @stdin` with a given pipe
     * .why = the pipe is fd 0; a spy on the fd-0 read stands in for it, and every other read
     *        still reaches the disk
     */
    const runSetFromStdin = async (input: { stdin: string }) => {
      // spy on the core module itself; `* as fs` above is a copy the reader never calls
      const fsCore = jest.requireActual<typeof fs>('fs');
      const readFileSyncReal = fsCore.readFileSync;
      const readSpy = jest
        .spyOn(fsCore, 'readFileSync')
        .mockImplementation(((
          target: Parameters<typeof fs.readFileSync>[0],
          ...rest: unknown[]
        ) =>
          target === 0
            ? input.stdin
            : (readFileSyncReal as (...args: unknown[]) => unknown)(
                target,
                ...rest,
              )) as typeof fs.readFileSync);
      try {
        return await runQueueInScene({
          scene,
          argvTail: [
            'set',
            '--key',
            scene.create.key,
            '--description',
            '@stdin',
          ],
        });
      } finally {
        readSpy.mockRestore();
      }
    };

    when('[t0] the pipe holds a multi-line body', () => {
      const result = useThen('it amends', async () =>
        runSetFromStdin({
          stdin:
            'sizes for the summer lessons:\n- kids: xs, s\n- adults: m, l, xl\n',
        }),
      );

      then('it amends the body and names where the record is kept', () => {
        expect(result.error).toBeNull();
        expect(result.exitCode).toEqual(0);
        expect(result.stdout).toContain('description: amended');
        expect(result.stdout).toContain('kept at = .behavior/.radio/record.');
        expect(asMaskedStdout(result)).toMatchSnapshot();
      });

      then('the record on disk holds every line of the body', () => {
        const onDisk = daoRadioTaskRecord.get.one.byUnique({
          dir: scene.dir,
          key: scene.create.key,
        });
        expect(onDisk?.description).toEqual(
          'sizes for the summer lessons:\n- kids: xs, s\n- adults: m, l, xl',
        );
        expect(onDisk?.recordStatus).toEqual(RadioTaskRecordStatus.QUEUED);
      });
    });

    when('[t1] the pipe is empty', () => {
      const result = useThen('it refuses', async () =>
        runSetFromStdin({ stdin: '' }),
      );

      then('it refuses to blank the body, and keeps the prior one', () => {
        expect(result.error).toBeInstanceOf(ConstraintError);
        expect(result.error?.message).toContain('--description is empty');
        const onDisk = daoRadioTaskRecord.get.one.byUnique({
          dir: scene.dir,
          key: scene.create.key,
        });
        expect(onDisk?.description).toContain('sizes for the summer lessons');
      });
    });
  });

  given(
    '[case17] an update to an issue the radio may not edit (case=8 [t0] [t1])',
    () => {
      when('[t0] the issue is not a radio task (filed by hand)', () => {
        const result = useThen('it drains', async () => {
          setStubMode({ repo: repoLessons, mode: 'not-radio' });
          const scene = genScene({ slug: 'radio-queue-journey-c17-t0' });
          const update = holdPush({
            scene,
            repo: repoLessons,
            title: null,
            exid: '599',
            status: RadioTaskStatus.DELIVERED,
            description: 'board rentals open friday',
          });
          const ran = await runQueueInScene({ scene, argvTail: ['drain'] });
          setStubMode({ repo: repoLessons, mode: 'ok' });
          return { ...ran, scene, update };
        });

        then('it names why, and that the fix is by hand', () => {
          expect(result.error).toBeNull();
          expect(result.stdout).toContain('is not a radio task');
          expect(result.stdout).toContain('edit or close #599 by hand');
          expect(result.stdout).not.toContain('Command failed:');
          expect(asMaskedStdout(result)).toMatchSnapshot();
        });

        then(
          'the record is refused and settled; the radio never wrote to the issue',
          () => {
            expect(result.stdout).toContain('refused — closed, never retried');
            expect(result.exitCode).toEqual(2); // a refusal this drain made is never read as success
            const onDisk = daoRadioTaskRecord.get.one.byUnique({
              dir: result.scene.dir,
              key: result.update.key,
            });
            expect(onDisk?.recordStatus).toEqual(RadioTaskRecordStatus.REFUSED);
          },
        );
      });

      when('[t1] the issue is absent from a reachable repo', () => {
        const result = useThen('it drains', async () => {
          setStubMode({ repo: repoForecast, mode: 'absent' });
          const scene = genScene({ slug: 'radio-queue-journey-c17-t1' });
          const update = holdPush({
            scene,
            repo: repoForecast,
            title: null,
            exid: '599',
            status: RadioTaskStatus.DELIVERED,
            description: 'swell alerts moved to the widget',
          });
          const ran = await runQueueInScene({ scene, argvTail: ['drain'] });
          setStubMode({ repo: repoForecast, mode: 'ok' });
          return { ...ran, scene, update };
        });

        then('it names a true absence, never a raw gh dump', () => {
          expect(result.error).toBeNull();
          expect(result.stdout).toContain('deliver #599 — task not found');
          expect(result.stdout).not.toContain('BadRequestError:');
          expect(result.stdout).not.toContain('Command failed:');
          expect(asMaskedStdout(result)).toMatchSnapshot();
        });

        then(
          'the record is refused and settled, never left in the queue',
          () => {
            expect(result.exitCode).toEqual(2);
            const onDisk = daoRadioTaskRecord.get.one.byUnique({
              dir: result.scene.dir,
              key: result.update.key,
            });
            expect(onDisk?.recordStatus).toEqual(RadioTaskRecordStatus.REFUSED);
          },
        );
      });
    },
  );

  given(
    '[case18] push --exid 599 --status CLAIMED --auth as-human (#603, the push form)',
    () => {
      const argvPush = [
        '--via',
        'gh.issues',
        '--into',
        `${repoRentals.owner}/${repoRentals.name}`,
        '--exid',
        '599',
        '--status',
        'CLAIMED',
        '--auth',
        'as-human',
      ];

      when('[t0] the gate is open', () => {
        const result = useThen('it pushes', async () => {
          setStubMode({ repo: repoRentals, mode: 'open' });
          const scene = genScene({ slug: 'radio-queue-journey-c18-t0' });
          const callsBefore = getStubCalls().length;
          const ran = await runQueueInScene({
            scene,
            argvTail: argvPush,
            envOmit: ['NODE_ENV', 'JEST_WORKER_ID'],
            cli: cliRadioTaskPush,
          });
          setStubMode({ repo: repoRentals, mode: 'ok' });
          return { ...ran, scene, calls: getStubCalls().slice(callsBefore) };
        });

        then('it exits 0, and the record is delivered', () => {
          expect(result.error).toBeNull();
          expect(result.exitCode).toEqual(0);
          const records = getSceneRecords({ scene: result.scene });
          expect(records).toHaveLength(1);
          expect(records[0]?.recordStatus).toEqual(
            RadioTaskRecordStatus.DELIVERED,
          );
        });

        then('every gh call went out on the gh session, never a token', () => {
          expect(result.calls.length).toBeGreaterThan(0);
          expect(
            result.calls.every((call) => call.startsWith('<gh-session> ')),
          ).toEqual(true);
          expect(result.calls.join('\n')).toContain('issue edit');

          // the claim stamps today and the host's gh login; mask both so the snap holds
          expect(
            asMaskedStdout(result)
              .replace(/claimedAt: \d{4}-\d{2}-\d{2}/, 'claimedAt: <today>')
              .replace(/claimedBy: \S+/, 'claimedBy: <gh-login>'),
          ).toMatchSnapshot();
        });
      });

      when(
        '[t1] the gate is shut at push, then a later drain replays the stored as-human',
        () => {
          const result = useThen('it holds, then drains', async () => {
            setStubMode({ repo: repoRentals, mode: 'open' });
            const scene = genScene({ slug: 'radio-queue-journey-c18-t1' });
            setSceneGate({ scene, gate: 'blocked' });
            const callsBeforeHeld = getStubCalls().length;
            const held = await runQueueInScene({
              scene,
              argvTail: argvPush,
              cli: cliRadioTaskPush,
            });
            const callsHeld = getStubCalls().slice(callsBeforeHeld);
            const recordHeld = getSceneRecords({ scene })[0];
            setSceneGate({ scene, gate: 'allowed' });
            const callsBefore = getStubCalls().length;
            const drained = await runQueueInScene({
              scene,
              argvTail: ['drain'],
              envOmit: ['NODE_ENV', 'JEST_WORKER_ID'],
            });
            setStubMode({ repo: repoRentals, mode: 'ok' });
            return {
              held,
              callsHeld,
              recordHeld,
              drained,
              scene,
              calls: getStubCalls().slice(callsBefore),
            };
          });

          then(
            'the push is held at the gate, exit 2, with its as-human auth kept',
            () => {
              expect(result.held.error).toBeNull();
              expect(result.held.exitCode).toEqual(2);
              expect(result.callsHeld).toEqual([]);
              expect(result.recordHeld?.recordStatus).toEqual(
                RadioTaskRecordStatus.QUEUED,
              );
              expect(result.recordHeld?.auth).toEqual('as-human');
              expect(asMaskedStdout(result.held)).toMatchSnapshot();
            },
          );

          then(
            'the drain replays as-human: gh session calls, delivered, exit 0',
            () => {
              expect(result.drained.error).toBeNull();
              expect(result.drained.exitCode).toEqual(0);
              expect(result.calls.length).toBeGreaterThan(0);
              expect(
                result.calls.every((call) => call.startsWith('<gh-session> ')),
              ).toEqual(true);
              expect(
                getSceneRecords({ scene: result.scene })[0]?.recordStatus,
              ).toEqual(RadioTaskRecordStatus.DELIVERED);
              expect(asMaskedStdout(result.drained)).toMatchSnapshot();
            },
          );
        },
      );
    },
  );

  given(
    '[case19] a verb given a positional, as though it named one record',
    () => {
      const scene = useBeforeAll(async () => {
        setStubMode({ repo: repoRentals, mode: 'ok' });
        const one = genScene({ slug: 'radio-queue-journey-c19' });
        const create = holdPush({
          scene: one,
          repo: repoRentals,
          title: 'board wax stock',
        });
        return { ...one, create };
      });

      const ARGV_CASES = [
        { label: '[t0] drain <key>', argv: (key: string) => ['drain', key] },
        {
          label: '[t1] drain --auth as-human <key>',
          argv: (key: string) => ['drain', '--auth', 'as-human', key],
        },
        { label: '[t2] get x', argv: (_key: string) => ['get', 'x'] },
      ];
      ARGV_CASES.map((thisCase) =>
        when(thisCase.label, () => {
          const result = useThen('it runs', async () => {
            const callsBefore = getStubCalls().length;
            const run = await runQueueInScene({
              scene,
              argvTail: thisCase.argv(scene.create.key),
              envOmit: ['NODE_ENV', 'JEST_WORKER_ID'],
            });
            return { ...run, calls: getStubCalls().slice(callsBefore) };
          });

          then(
            'it refuses before any send: no gh call, the record still held',
            () => {
              expect(result.error).toBeInstanceOf(ConstraintError);
              expect(result.error?.message).toContain('takes no positional');
              expect(result.calls).toEqual([]);
              expect(getSceneRecords({ scene })[0]?.recordStatus).toEqual(
                RadioTaskRecordStatus.QUEUED,
              );
              expect(
                result.error?.message.replace(scene.create.key, '<key>'),
              ).toMatchSnapshot();
            },
          );
        }),
      );
    },
  );

  given('[case20] a del retried on a record already dropped', () => {
    const scene = useBeforeAll(async () => {
      const one = genScene({ slug: 'radio-queue-journey-c20' });
      const create = holdPush({
        scene: one,
        repo: repoRentals,
        title: 'old wetsuit list',
      });
      const first = await runQueueInScene({
        scene: one,
        argvTail: ['del', '--key', create.key, '--why', 'superseded'],
      });
      return { ...one, create, first };
    });

    when('[t0] del runs again on the same key', () => {
      const result = useThen('it runs', async () =>
        runQueueInScene({
          scene,
          argvTail: ['del', '--key', scene.create.key, '--why', 'retry'],
        }),
      );

      then('it is a no-op: exit 0, the first why kept', () => {
        expect(scene.first.error).toBeNull();
        expect(result.error).toBeNull();
        expect(result.exitCode).toEqual(0);
        expect(result.stdout).toContain('already dropped');
        const onDisk = getSceneRecords({ scene })[0];
        expect(onDisk?.recordStatus).toEqual(RadioTaskRecordStatus.DROPPED);
        expect(onDisk?.reason).toEqual('dropped: superseded');
        expect(asMaskedStdout(result)).toMatchSnapshot();
      });
    });
  });

  // a settled record left the queue: a del must refuse it, never rewrite it to DROPPED, or a later
  // re-push of a DELIVERED task would re-queue it and file a duplicate upstream
  const SETTLED_CASES = [
    { label: 'DELIVERED', recordStatus: RadioTaskRecordStatus.DELIVERED },
    { label: 'REFUSED', recordStatus: RadioTaskRecordStatus.REFUSED },
  ];
  SETTLED_CASES.map((thisCase) =>
    given(`[case22] del or set on a ${thisCase.label} record`, () => {
      const scene = useBeforeAll(async () => {
        const one = genScene({
          slug: `radio-queue-journey-c22-${thisCase.label.toLowerCase()}`,
        });
        const create = holdPush({
          scene: one,
          repo: repoRentals,
          title: 'surf camp roster',
        });
        daoRadioTaskRecord.set.upsert({
          dir: one.dir,
          record: new RadioTaskRecord({
            ...create,
            recordStatus: thisCase.recordStatus,
            deliveredExid:
              thisCase.recordStatus === RadioTaskRecordStatus.DELIVERED
                ? '700'
                : null,
          }),
        });
        return { ...one, create };
      });

      when('[t0] del runs on its key', () => {
        const result = useThen('it runs', async () =>
          runQueueInScene({
            scene,
            argvTail: ['del', '--key', scene.create.key, '--why', 'moot'],
          }),
        );

        then('it refuses, names the state, and leaves the record as is', () => {
          expect(result.error).toBeInstanceOf(ConstraintError);
          expect(result.error?.message).toContain(thisCase.label);
          expect(getSceneRecords({ scene })[0]?.recordStatus).toEqual(
            thisCase.recordStatus,
          );
          expect(
            result.error?.message.replace(scene.create.key, '<key>'),
          ).toMatchSnapshot();
        });
      });

      when('[t1] set runs on its key', () => {
        const result = useThen('it runs', async () =>
          runQueueInScene({
            scene,
            argvTail: [
              'set',
              '--key',
              scene.create.key,
              '--description',
              'roster moved to friday',
            ],
          }),
        );

        then('it refuses, names the state, and leaves the record as is', () => {
          expect(result.error).toBeInstanceOf(ConstraintError);
          expect(result.error?.message).toContain(thisCase.label);
          const onDisk = getSceneRecords({ scene })[0];
          expect(onDisk?.recordStatus).toEqual(thisCase.recordStatus);
          expect(onDisk?.description).not.toEqual('roster moved to friday');
          expect(
            result.error?.message.replace(scene.create.key, '<key>'),
          ).toMatchSnapshot();
        });
      });
    }),
  );

  // the wish bound "no github write outside the radio": only drain sends. the held record is
  // deliverable (stub mode ok), so a stray send from any other verb would reach the stub
  given('[case21] get, set, and del on a deliverable held record', () => {
    const scene = useBeforeAll(async () => {
      setStubMode({ repo: repoRentals, mode: 'ok' });
      const one = genScene({ slug: 'radio-queue-journey-c21' });
      const create = holdPush({
        scene: one,
        repo: repoRentals,
        title: 'lesson reminder copy',
      });
      return { ...one, create };
    });

    const VERB_CASES = [
      {
        label: '[t0] get',
        argv: (_key: string) => ['get'],
        statusAfter: RadioTaskRecordStatus.QUEUED,
      },
      {
        label: '[t1] get --when hook.onStop',
        argv: (_key: string) => ['get', '--when', 'hook.onStop'],
        statusAfter: RadioTaskRecordStatus.QUEUED,
      },
      {
        label: '[t2] set --description',
        argv: (key: string) => [
          'set',
          '--key',
          key,
          '--description',
          'reminder goes out the night before',
        ],
        statusAfter: RadioTaskRecordStatus.QUEUED,
      },
      {
        label: '[t3] set --auth as-human',
        argv: (key: string) => ['set', '--key', key, '--auth', 'as-human'],
        statusAfter: RadioTaskRecordStatus.QUEUED,
      },
      {
        label: '[t4] del --why',
        argv: (key: string) => ['del', '--key', key, '--why', 'superseded'],
        statusAfter: RadioTaskRecordStatus.DROPPED,
      },
    ];
    VERB_CASES.map((thisCase) =>
      when(thisCase.label, () => {
        const result = useThen('it runs', async () => {
          const callsBefore = getStubCalls().length;
          const run = await runQueueInScene({
            scene,
            argvTail: thisCase.argv(scene.create.key),
            envOmit: ['NODE_ENV', 'JEST_WORKER_ID'],
          });
          return { ...run, calls: getStubCalls().slice(callsBefore) };
        });

        then('it succeeds and sends naught: no gh call', () => {
          expect(result.error).toBeNull();
          expect(result.calls).toEqual([]);
        });

        then('the record is never delivered', () => {
          expect(getSceneRecords({ scene })[0]?.recordStatus).toEqual(
            thisCase.statusAfter,
          );
        });
      }),
    );
  });
});
