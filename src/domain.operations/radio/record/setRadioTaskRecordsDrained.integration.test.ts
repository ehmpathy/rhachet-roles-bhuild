import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
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
import { RadioTaskRecordStatus } from '@src/domain.objects/RadioTaskRecordStatus';
import { RadioTaskRepo } from '@src/domain.objects/RadioTaskRepo';
import { RadioTaskStatus } from '@src/domain.objects/RadioTaskStatus';
import { shx } from '@src/infra/shell/shx';

import { getAllRadioTaskRecordDirs } from './getAllRadioTaskRecordDirs';
import { getAllRadioTaskRecordsHeld } from './getAllRadioTaskRecordsHeld';
import { getOneRadioTaskRecordByKey } from './getOneRadioTaskRecordByKey';
import { setRadioTaskRecordAmended } from './setRadioTaskRecordAmended';
import { setRadioTaskRecordDropped } from './setRadioTaskRecordDropped';
import { setRadioTaskRecordFromPush } from './setRadioTaskRecordFromPush';
import { setRadioTaskRecordsDrained } from './setRadioTaskRecordsDrained';

/**
 * .mock = the gh cli, via a stub `gh` first on PATH
 * .why  = a rate limit, a 403 on one issue, and a repo the auth cannot see are faults a test
 *         cannot provoke on demand against real github; the stub replays gh's own stderr text
 *         for each, per target repo
 * .real = the 401 path runs against real github in setRadioTaskRecordsDrainedByPush
 *         [case7]; the gh dao itself in daoRadioTaskViaGhIssues.integration.test.ts
 */
const STUB_GH = `#!/usr/bin/env bash
args="$*"
repo="$(printf '%s' "$args" | grep -oE -- '--repo [^ ]+' | cut -d' ' -f2 | tr '/' '_')"
mode="ok"
if [ -n "$repo" ] && [ -f "$STUB_GH_DIR/mode.$repo" ]; then mode="$(cat "$STUB_GH_DIR/mode.$repo")"; fi
case "$1 $2" in
  "api user") echo "stubbot"; exit 0 ;;
esac
if [ "$mode" = "rate-limit" ]; then echo "API rate limit exceeded for installation ID 1" >&2; exit 1; fi
if [ "$mode" = "access" ] && [ "$2" = "create" ]; then echo "GraphQL: Resource not accessible by integration (createIssue)" >&2; exit 1; fi
if [ "$mode" = "unreachable" ]; then echo "GraphQL: Could not resolve to a Repository with the name '$repo'. (repository)" >&2; exit 1; fi
case "$1 $2" in
  "issue list") echo "[]" ;;
  "issue create") echo "https://github.com/stub/stub/issues/7" ;;
  *) echo "stub gh: unexpected call: $args" >&2; exit 1 ;;
esac
`;

/**
 * .what = a temp git repo and a temp home, isolated per scene
 * .why = the record dirs live in the repo; the radio.uses meters live in the home
 */
const genScene = (input: { slug: string }) => ({
  cwd: genTempDir({ slug: input.slug, git: true }),
  homeDir: genTempDir({ slug: `${input.slug}-home` }),
});

/**
 * .what = open or shut the local radio.uses gate of a scene repo
 * .why = hold pushes first, then drain them, the way a human would
 */
const setLocalGate = (input: { cwd: string; state: 'allowed' | 'blocked' }) => {
  fs.mkdirSync(path.join(input.cwd, '.meter'), { recursive: true });
  fs.writeFileSync(
    path.join(input.cwd, '.meter', 'radio.uses.jsonc'),
    JSON.stringify({ state: input.state }),
  );
};

/**
 * .what = set how the stub gh answers for one target repo
 * .why = each scene faults one target and leaves the rest deliverable
 */
const setStubMode = (input: {
  repo: RadioTaskRepo;
  mode: 'ok' | 'rate-limit' | 'access' | 'unreachable';
}) =>
  fs.writeFileSync(
    path.join(
      process.env.STUB_GH_DIR!,
      `mode.${input.repo.owner}_${input.repo.name}`,
    ),
    input.mode,
  );

/**
 * .what = transcribe one push into the queue, unsent
 * .why = the drain is the act under test, so the pushes only record
 */
const holdPush = (input: {
  cwd: string;
  repo: RadioTaskRepo;
  via: RadioChannel;
  title: string | null;
  exid?: string | null;
  status?: RadioTaskStatus | null;
  auth?: string | null;
}) =>
  setRadioTaskRecordFromPush(
    {
      push: {
        repo: input.repo,
        via: input.via,
        auth: input.auth ?? null,
        idem: null,
        title: input.title,
        description: input.title ? `details for ${input.title}` : null,
        exid: input.exid ?? null,
        status: input.status ?? null,
      },
    },
    { dir: path.join(input.cwd, '.behavior', '.radio'), cwd: input.cwd },
  ).record;

/**
 * .what = the message of the error a promise rejects with, as a plain object
 * .why = useThen hands back its result through a proxy that reads plain fields; an Error's
 *        message must be lifted onto one to be read there
 */
const getErrorMessage = async (
  promise: Promise<unknown>,
): Promise<{ message: string }> => ({
  message: (await getError(promise)).message,
});

/**
 * .what = every record file in a scene repo
 * .why = assert what each act left on disk
 */
const getAllRecords = (input: { cwd: string }) =>
  daoRadioTaskRecord.get.all({
    dirs: getAllRadioTaskRecordDirs({}, { cwd: input.cwd }),
  });

/**
 * .what = every task file the os.fileops store holds for a target
 * .why = assert what landed upstream, apart from the local records
 */
const getAllTasksUpstream = (repo: RadioTaskRepo): string[] => {
  const dir = path.join(os.homedir(), 'git', '.radio', repo.owner, repo.name);
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((name) => name.endsWith('._.md'));
};

describe('radio.task.queue — drain, set, del', () => {
  const runId = `${Date.now()}`;
  const repoGh = new RadioTaskRepo({ owner: 'sandpine', name: 'svc-lessons' });
  const repoGhOther = new RadioTaskRepo({
    owner: 'sandpine',
    name: 'infrastructure',
  });
  const repoFile = new RadioTaskRepo({
    owner: 'queue-file',
    name: `repo-${runId}`,
  });
  const authEnv = 'as-robot:env(RADIO_QUEUE_TEST_TOKEN)';
  const pathPrior = process.env.PATH;

  // put the stub gh first on PATH, with a token the env auth mode can read
  beforeAll(() => {
    const dir = genTempDir({ slug: 'radio-queue-stub-gh' });
    fs.writeFileSync(path.join(dir, 'gh'), STUB_GH, { mode: 0o755 });
    process.env.STUB_GH_DIR = dir;
    process.env.PATH = `${dir}:${pathPrior}`;
    process.env.RADIO_QUEUE_TEST_TOKEN = 'ghp_radioQueueTestTokenStub000000';
  });
  afterAll(() => {
    process.env.PATH = pathPrior;
    fs.rmSync(
      path.join(os.homedir(), 'git', '.radio', repoFile.owner, repoFile.name),
      { recursive: true, force: true },
    );
  });

  given(
    '[case1] a record the robot may not write, ahead of deliverable ones (the #599 shape)',
    () => {
      const scene = useBeforeAll(async () => genScene({ slug: 'queue-case1' }));
      const context = () => ({ ...scene, env: process.env, shx });

      when('[t0] the queue is drained', () => {
        const result = useThen('the drain runs', async () => {
          setStubMode({ repo: repoGh, mode: 'access' });
          setLocalGate({ cwd: scene.cwd, state: 'blocked' });
          const held = holdPush({
            cwd: scene.cwd,
            repo: repoGh,
            via: RadioChannel.GH_ISSUES,
            title: 'book-a-lesson reminder',
            auth: authEnv,
          });
          holdPush({
            cwd: scene.cwd,
            repo: repoFile,
            via: RadioChannel.OS_FILEOPS,
            title: 'board rental count',
          });
          holdPush({
            cwd: scene.cwd,
            repo: repoFile,
            via: RadioChannel.OS_FILEOPS,
            title: 'tide chart refresh',
          });
          setLocalGate({ cwd: scene.cwd, state: 'allowed' });
          const drained = await setRadioTaskRecordsDrained({}, context());
          return {
            key: held.key,
            ...drained,
            heldStored: getAllRadioTaskRecordsHeld({}, scene),
            tasksUpstream: getAllTasksUpstream(repoFile),
          };
        });

        then('the access fault is set aside as upstream:access', () => {
          expect(result.fates[0]).toMatchObject({
            fate: 'held',
            halt: false,
            record: { reason: 'upstream:access' },
          });
        });

        then('the records behind it still deliver, in order', () => {
          expect(
            result.fates.map((fate) => [fate.fate, fate.record.title]),
          ).toEqual([
            ['held', 'book-a-lesson reminder'],
            ['delivered', 'board rental count'],
            ['delivered', 'tide chart refresh'],
          ]);
          expect(result.tasksUpstream).toHaveLength(2);
        });

        then('only the faulted record still waits', () => {
          expect(result.heldStored.map(({ record }) => record.key)).toEqual([
            result.key,
          ]);
        });
      });

      when('[t1] its auth is amended, then the queue is drained again', () => {
        const result = useThen('set then drain run', async () => {
          const key = getAllRadioTaskRecordsHeld({}, scene)[0]!.record.key;
          const amended = await setRadioTaskRecordAmended(
            {
              key,
              auth: 'as-robot:env(RADIO_QUEUE_TEST_TOKEN_HUMAN)',
              description: null,
            },
            scene,
          );
          setStubMode({ repo: repoGh, mode: 'ok' });
          process.env.RADIO_QUEUE_TEST_TOKEN_HUMAN =
            'ghp_radioQueueTestTokenHuman00000';
          const drained = await setRadioTaskRecordsDrained({}, context());
          return {
            amended,
            drained,
            after: getOneRadioTaskRecordByKey({ key, dirHome: null }, scene),
          };
        });

        then('set changes the auth alone, and keeps its place in line', () => {
          expect(result.amended.after.auth).toEqual(
            'as-robot:env(RADIO_QUEUE_TEST_TOKEN_HUMAN)',
          );
          expect(result.amended.after.heldSeq).toEqual(
            result.amended.before.heldSeq,
          );
          expect(result.amended.after.description).toEqual(
            result.amended.before.description,
          );
        });

        then('the next drain delivers it under the new auth', () => {
          expect(result.drained.fates.map((fate) => fate.fate)).toEqual([
            'delivered',
          ]);
          expect(result.after?.record.recordStatus).toEqual(
            RadioTaskRecordStatus.DELIVERED,
          );
        });
      });

      when('[t2] set is asked of the now-settled record', () => {
        const error = useThen('it is refused', async () => {
          const found = getAllRecords(scene).find(
            ({ record }) => record.repo.name === repoGh.name,
          );
          return getErrorMessage(
            setRadioTaskRecordAmended(
              { key: found!.record.key, auth: 'as-human', description: null },
              scene,
            ),
          );
        });

        then('it fails loud: the record is DELIVERED, not held', () => {
          expect(error.message).toContain('is DELIVERED, not held');
        });
      });
    },
  );

  given('[case2] a rate limit ahead of others (F1)', () => {
    const scene = useBeforeAll(async () => genScene({ slug: 'queue-case2' }));
    const context = () => ({ ...scene, env: process.env, shx });

    when('[t0] the queue is drained', () => {
      const result = useThen('the drain runs', async () => {
        setStubMode({ repo: repoGh, mode: 'rate-limit' });
        setLocalGate({ cwd: scene.cwd, state: 'blocked' });
        holdPush({
          cwd: scene.cwd,
          repo: repoGh,
          via: RadioChannel.GH_ISSUES,
          title: 'swell alert',
          auth: authEnv,
        });
        holdPush({
          cwd: scene.cwd,
          repo: repoFile,
          via: RadioChannel.OS_FILEOPS,
          title: 'wetsuit inventory',
        });
        setLocalGate({ cwd: scene.cwd, state: 'allowed' });
        const drained = await setRadioTaskRecordsDrained({}, context());
        return {
          ...drained,
          heldStored: getAllRadioTaskRecordsHeld({}, scene),
        };
      });

      then('the rate limit halts the drain', () => {
        expect(result.fates[0]).toMatchObject({
          fate: 'held',
          halt: true,
          record: { reason: 'upstream:rate-limit' },
        });
      });

      then(
        'the record behind it waits in its place, unsent, with the halter reason',
        () => {
          expect(
            result.heldStored.map(({ record }) => [
              record.title,
              record.reason,
            ]),
          ).toEqual([
            ['swell alert', 'upstream:rate-limit'],
            ['wetsuit inventory', 'upstream:rate-limit'],
          ]);
        },
      );
    });

    when('[t1] the rate limit lifts, and the queue is drained', () => {
      const result = useThen('the drain runs', async () => {
        setStubMode({ repo: repoGh, mode: 'ok' });
        return setRadioTaskRecordsDrained({}, context());
      });

      then('both deliver, in their order', () => {
        expect(
          result.fates.map((fate) => [fate.fate, fate.record.title]),
        ).toEqual([
          ['delivered', 'swell alert'],
          ['delivered', 'wetsuit inventory'],
        ]);
      });
    });
  });

  given(
    '[case3] an update into a repo the auth cannot see (case=8 [t2])',
    () => {
      const scene = useBeforeAll(async () => genScene({ slug: 'queue-case3' }));

      when('[t0] the queue is drained', () => {
        const result = useThen('the drain runs', async () => {
          setStubMode({ repo: repoGhOther, mode: 'unreachable' });
          setLocalGate({ cwd: scene.cwd, state: 'allowed' });
          holdPush({
            cwd: scene.cwd,
            repo: repoGhOther,
            via: RadioChannel.GH_ISSUES,
            title: null,
            exid: '7',
            status: RadioTaskStatus.DELIVERED,
            auth: authEnv,
          });
          return setRadioTaskRecordsDrained(
            {},
            { ...scene, env: process.env, shx },
          );
        });

        then(
          'it is set aside as upstream:not-found — never REFUSED as "task not found"',
          () => {
            expect(result.fates[0]).toMatchObject({
              fate: 'held',
              halt: false,
              record: {
                recordStatus: RadioTaskRecordStatus.QUEUED,
                reason: 'upstream:not-found',
              },
            });
          },
        );
      });
    },
  );

  given('[case4] a drain under a one-off --auth (F3)', () => {
    const scene = useBeforeAll(async () => genScene({ slug: 'queue-case4' }));

    when(
      '[t0] a record whose own auth cannot be derived is drained with --auth',
      () => {
        const result = useThen('the drain runs', async () => {
          setStubMode({ repo: repoGh, mode: 'ok' });
          setLocalGate({ cwd: scene.cwd, state: 'blocked' });
          const held = holdPush({
            cwd: scene.cwd,
            repo: repoGh,
            via: RadioChannel.GH_ISSUES,
            title: 'instructor schedule',
            auth: 'as-robot:env(RADIO_QUEUE_TEST_TOKEN_ABSENT)',
          });
          setLocalGate({ cwd: scene.cwd, state: 'allowed' });
          const drained = await setRadioTaskRecordsDrained(
            {},
            { ...scene, env: process.env, shx, authOverride: authEnv },
          );
          return {
            drained,
            after: getOneRadioTaskRecordByKey(
              { key: held.key, dirHome: null },
              scene,
            ),
          };
        });

        then('it delivers under the override', () => {
          expect(result.drained.fates[0]?.fate).toEqual('delivered');
        });

        then('the record on disk keeps its own auth', () => {
          expect(result.after?.record.auth).toEqual(
            'as-robot:env(RADIO_QUEUE_TEST_TOKEN_ABSENT)',
          );
        });
      },
    );
  });

  given('[case5] a held record a clone wants gone (case=2)', () => {
    const scene = useBeforeAll(async () => genScene({ slug: 'queue-case5' }));
    const pushed = useBeforeAll(async () => {
      setLocalGate({ cwd: scene.cwd, state: 'blocked' });
      return holdPush({
        cwd: scene.cwd,
        repo: repoFile,
        via: RadioChannel.OS_FILEOPS,
        title: 'old lesson reminder',
      });
    });

    when('[t0] del runs with no --why', () => {
      const error = useThen('it is refused', async () =>
        getErrorMessage(
          setRadioTaskRecordDropped({ key: pushed.key, why: '' }, scene),
        ),
      );

      then('it fails loud and names --why', () => {
        expect(error.message).toContain('--why is required');
      });
    });

    when('[t1] del runs with a why', () => {
      const result = useThen('it drops the record', async () =>
        setRadioTaskRecordDropped(
          { key: pushed.key, why: 'superseded by #604' },
          scene,
        ),
      );

      then('the record is DROPPED in place, body and why kept', () => {
        expect(result.record.recordStatus).toEqual(
          RadioTaskRecordStatus.DROPPED,
        );
        expect(result.record.reason).toEqual('dropped: superseded by #604');
        expect(result.record.description).toEqual(
          'details for old lesson reminder',
        );
        expect(fs.existsSync(result.path)).toEqual(true);
      });

      then('it leaves the queue', () => {
        expect(getAllRadioTaskRecordsHeld({}, scene)).toEqual([]);
      });
    });

    when('[t2] del runs again on the dropped record', () => {
      const error = useThen('it is refused', async () =>
        getErrorMessage(
          setRadioTaskRecordDropped({ key: pushed.key, why: 'again' }, scene),
        ),
      );

      then('it fails loud: the record is DROPPED, not held', () => {
        expect(error.message).toContain('is DROPPED, not held');
      });
    });

    when('[t3] del names a key the worktree does not hold', () => {
      const error = useThen('it is refused', async () =>
        getErrorMessage(
          setRadioTaskRecordDropped(
            { key: '0000000000000000', why: 'x' },
            scene,
          ),
        ),
      );

      then('it fails loud and names `queue get`', () => {
        expect(error.message).toContain('radio.task.queue get');
      });
    });

    when('[t4] the same task is pushed again', () => {
      const result = useThen('it is transcribed', async () =>
        holdPush({
          cwd: scene.cwd,
          repo: repoFile,
          via: RadioChannel.OS_FILEOPS,
          title: 'old lesson reminder',
        }),
      );

      then('the dropped record is queued again', () => {
        expect(result.recordStatus).toEqual(RadioTaskRecordStatus.QUEUED);
        expect(
          getAllRadioTaskRecordsHeld({}, scene).map(({ record }) => record.key),
        ).toEqual([pushed.key]);
      });
    });
  });

  given('[case6] a drain while radio.uses blocks (the wish bound)', () => {
    const scene = useBeforeAll(async () => genScene({ slug: 'queue-case6' }));

    when('[t0] the queue is drained at a shut gate', () => {
      const result = useThen('the drain runs', async () => {
        setLocalGate({ cwd: scene.cwd, state: 'blocked' });
        holdPush({
          cwd: scene.cwd,
          repo: repoFile,
          via: RadioChannel.OS_FILEOPS,
          title: 'surf report digest',
        });
        return setRadioTaskRecordsDrained(
          {},
          { ...scene, env: process.env, shx },
        );
      });

      then(
        'naught is sent; the record is held at the gate, with its lift',
        () => {
          const [fate] = result.fates;
          expect(result.fates).toHaveLength(1);
          expect(fate?.fate).toEqual('held');
          expect(fate?.fate === 'held' ? fate.lift : null).toContain(
            'radio.uses',
          );
        },
      );
    });
  });
});
