import { spawnSync } from 'child_process';
import fs from 'fs';
import { MalfunctionError } from 'helpful-errors';
import path from 'path';
import { genTempDir, given, then, useBeforeAll, useThen, when } from 'test-fns';

import { genConsumerRepo, sanitizeOutput } from '../.test/infra';

/**
 * .what = journey acceptance tests for the promise gate of radio.task.push and radio.task.queue
 * .why = a task text sent to a public repo cannot be taken back; these journeys drive the built
 *        skills through a stub gh and prove what reaches the wire (calls.log) and what the
 *        caller reads (the snapshots), for each way a repo reads: public, private, unreadable
 *
 * .mock = the gh cli, via a stub `gh` first on PATH
 * .why = a repo that reads PUBLIC, a rate limit, a reset socket, and a rejected token are states
 *        a test cannot provoke on demand against real github; the stub answers `repo view` per
 *        repo from a mode file, logs every call, and keeps each body and title it was sent
 * .real = src/access/daos/daoRadioTask/getOneGhRepoVisibility.integration.test.ts reads real github
 *         visibility; skill.radio.task.push.via-gh-issues.acceptance.test.ts pushes real issues
 * .note = the stub token is a marker the stub logs, never a credential
 */

// each skill run is a fresh node that boots rhachet; a journey step runs several, on a loaded box
jest.setTimeout(240000);

const TARGET = 'sandpine/spot-forecast-widget';
const PROMISE = 'task-to-public-repo-is-anonymized';
const TOKEN_VAR = 'RADIO_PROMISE_TOKEN';
const AUTH = `as-robot:env(${TOKEN_VAR})`;
const MIC = '\u{1F399}️';

const STUB_GH = `#!/usr/bin/env bash
args="$*"
verb="$1 $2"
if [ "$verb" = "repo view" ]; then
  repo="$(printf '%s' "$3" | tr '/' '_')"
else
  repo="$(printf '%s' "$args" | grep -oE -- '--repo [^ ]+' | cut -d' ' -f2 | tr '/' '_')"
fi
echo "\${GH_TOKEN:-<gh-session>} $1 $2 $repo" >> "$STUB_GH_DIR/calls.log"
n="$(wc -l < "$STUB_GH_DIR/calls.log" | tr -d ' ')"
prev=""
for arg in "$@"; do
  if [ "$prev" = "--body-file" ]; then mkdir -p "$STUB_GH_DIR/bodies"; cp "$arg" "$STUB_GH_DIR/bodies/$n"; fi
  if [ "$prev" = "--title" ]; then mkdir -p "$STUB_GH_DIR/titles"; printf '%s' "$arg" > "$STUB_GH_DIR/titles/$n"; fi
  prev="$arg"
done
case "$verb" in
  "api user") echo "stubbot"; exit 0 ;;
  "repo view")
    mode="PRIVATE"
    if [ -f "$STUB_GH_DIR/visibility.$repo" ]; then mode="$(cat "$STUB_GH_DIR/visibility.$repo")"; fi
    case "$mode" in
      PUBLIC|PRIVATE|INTERNAL) echo "{\\"visibility\\":\\"$mode\\"}"; exit 0 ;;
      garbage) echo "not json at all"; exit 0 ;;
      unknown) echo '{"visibility":"SECRET"}'; exit 0 ;;
      unauthorized) echo "HTTP 401: Bad credentials (https://api.github.com/graphql)" >&2; exit 1 ;;
      ratelimit) echo "HTTP 403: API rate limit exceeded for user ID 1" >&2; exit 1 ;;
      econnreset) echo "read tcp 10.0.0.1:443: read ECONNRESET" >&2; exit 1 ;;
      *) echo "gh: the stub was told to fail" >&2; exit 1 ;;
    esac ;;
  "issue view")
    assignees='[]'
    if [ "$(cat "$STUB_GH_DIR/issue.$3" 2>/dev/null)" = "CLAIMED" ]; then assignees='[{"login":"stubbot"}]'; fi
    echo '{"number":'"$3"',"title":"${MIC} task - stub issue title","body":"**description**\\n\\nstub issue body","state":"OPEN","assignees":'"$assignees"',"createdAt":"2026-10-20","author":{"login":"stubbot"}}' ;;
  "issue list") echo "[]" ;;
  "issue create") echo "https://github.com/stub/stub/issues/$((700 + n))" ;;
  "issue edit"|"issue close") echo "https://github.com/stub/stub/issues/1" ;;
  *) echo "stub gh: unexpected call: $args" >&2; exit 1 ;;
esac
`;

type JourneyScene = { repoDir: string; homeDir: string; stubDir: string };
type SkillRun = { exitCode: number; stdout: string; stderr: string };
type StubVisibility =
  | 'PUBLIC'
  | 'PRIVATE'
  | 'INTERNAL'
  | 'garbage'
  | 'unknown'
  | 'unauthorized'
  | 'ratelimit'
  | 'econnreset'
  | 'fail';

/**
 * .what = the org gate for sandpine, as a human sets it in the scene home
 */
const setGate = (input: { scene: JourneyScene; gate: 'allowed' | 'blocked' }) => {
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
 * .what = a consumer repo, an isolated home, and a stub gh dir, with the sandpine org gate open
 * .why = each journey owns its scene, so no journey leans on the state another left behind
 */
const genJourneyScene = (input: { prefix: string }): JourneyScene => {
  const consumer = genConsumerRepo({
    prefix: input.prefix,
    branchName: 'feat/promise-journey',
  });
  const homeDir = path.join(consumer.repoDir, '.home');
  fs.mkdirSync(homeDir);
  const stubDir = genTempDir({ slug: `${input.prefix}stub-gh` });
  fs.writeFileSync(path.join(stubDir, 'gh'), STUB_GH, { mode: 0o755 });
  const scene = { repoDir: consumer.repoDir, homeDir, stubDir };
  setGate({ scene, gate: 'allowed' });
  return scene;
};

/**
 * .what = how the stub answers `gh repo view` for one repo
 */
const setVisibility = (input: {
  scene: JourneyScene;
  repo: string;
  mode: StubVisibility;
}) =>
  fs.writeFileSync(
    path.join(input.scene.stubDir, `visibility.${input.repo.replace('/', '_')}`),
    input.mode,
  );

/**
 * .what = whether the stub issue reads claimed or queued
 * .why = a deliver lands only on a claimed issue, and a claim only on a queued one
 */
const setIssueState = (input: {
  scene: JourneyScene;
  exid: string;
  state: 'QUEUED' | 'CLAIMED';
}) =>
  fs.writeFileSync(
    path.join(input.scene.stubDir, `issue.${input.exid}`),
    input.state,
  );

/**
 * .what = run a dispatcher skill as a consumer would, with the stub gh first on PATH
 * .why = argv passes each value as one arg, so a body keeps every byte; line runs through bash,
 *        so the shell parses the quotes a nudge printed, as a human who copies it would
 */
const runSkill = (input: {
  scene: JourneyScene;
  skill: 'radio.task.push' | 'radio.task.queue';
  argv?: string[];
  line?: string;
  stdin?: string;
  env?: Record<string, string | undefined>;
}): SkillRun => {
  const base = [
    'npx',
    'rhachet',
    'run',
    '--repo',
    'bhuild',
    '--role',
    'dispatcher',
    '--skill',
    input.skill,
    '--',
  ];
  const env = {
    ...process.env,
    HOME: input.scene.homeDir,
    PATH: `${input.scene.stubDir}:${process.env.PATH}`,
    STUB_GH_DIR: input.scene.stubDir,
    [TOKEN_VAR]: 'ghp_radioPromisePlayTokenStub000000',
    ...input.env,
  };
  const run =
    input.line !== undefined
      ? spawnSync('bash', ['-c', [...base, input.line].join(' ')], {
          cwd: input.scene.repoDir,
          env,
          input: input.stdin ?? '',
          timeout: 60000,
        })
      : spawnSync(base[0]!, [...base.slice(1), ...(input.argv ?? [])], {
          cwd: input.scene.repoDir,
          env,
          input: input.stdin ?? '',
          timeout: 60000,
        });
  if (run.error || run.status === null)
    throw new MalfunctionError(`${input.skill} did not exit`, {
      error: run.error?.message ?? null,
      signal: run.signal,
      stderr: run.stderr?.toString() ?? null,
    });
  return {
    exitCode: run.status,
    stdout: run.stdout.toString().trim(),
    stderr: run.stderr.toString().trim(),
  };
};

/**
 * .what = the argv of a gh.issues push, in the order the nudge prints its flags
 */
const asPushArgv = (input: {
  into?: string;
  via?: string;
  exid?: string;
  status?: string;
  title?: string;
  description?: string;
  auth?: string;
  promise?: string | true;
}): string[] => [
  '--via',
  input.via ?? 'gh.issues',
  '--into',
  input.into ?? TARGET,
  ...(input.exid !== undefined ? ['--exid', input.exid] : []),
  ...(input.status !== undefined ? ['--status', input.status] : []),
  ...(input.title !== undefined ? ['--title', input.title] : []),
  ...(input.description !== undefined
    ? ['--description', input.description]
    : []),
  '--auth',
  input.auth ?? AUTH,
  ...(input.promise === true ? ['--promise'] : []),
  ...(typeof input.promise === 'string' ? ['--promise', input.promise] : []),
];

const runPush = (
  input: Parameters<typeof asPushArgv>[0] & {
    scene: JourneyScene;
    stdin?: string;
  },
) =>
  runSkill({
    scene: input.scene,
    skill: 'radio.task.push',
    argv: asPushArgv(input),
    stdin: input.stdin,
  });

const runQueue = (input: {
  scene: JourneyScene;
  args: string[];
  stdin?: string;
}) =>
  runSkill({
    scene: input.scene,
    skill: 'radio.task.queue',
    argv: input.args,
    stdin: input.stdin,
  });

/**
 * .what = the gh calls the stub saw, one line each: token, verb, target
 */
const getCalls = (input: { scene: JourneyScene }): string[] => {
  const file = path.join(input.scene.stubDir, 'calls.log');
  if (!fs.existsSync(file)) return [];
  return fs.readFileSync(file, 'utf8').split('\n').filter(Boolean);
};

/**
 * .what = the numbers of the calls of one verb, e.g. `repo view` or `issue create`
 * .why = a call's number is also the name of the body the stub kept for it
 */
const getCallNumbers = (input: {
  scene: JourneyScene;
  verb: string;
  repo?: string;
  after?: number;
}): number[] =>
  getCalls(input)
    .map((line, index) => ({ parts: line.split(' '), n: index + 1 }))
    .filter(
      (call) =>
        call.n > (input.after ?? 0) &&
        call.parts.slice(1, 3).join(' ') === input.verb &&
        (input.repo === undefined ||
          call.parts[3] === input.repo.replace('/', '_')),
    )
    .map((call) => call.n);

const getBodyOfCall = (input: { scene: JourneyScene; n: number }): string =>
  fs.readFileSync(
    path.join(input.scene.stubDir, 'bodies', String(input.n)),
    'utf8',
  );

/**
 * .what = the bodies the stub kept for the calls of one verb, oldest first
 * .why = a call that carries no body file (an assignee edit, a close) keeps none
 */
const getBodiesSent = (input: {
  scene: JourneyScene;
  verb: string;
  after?: number;
}): string[] =>
  getCallNumbers(input)
    .filter((n) =>
      fs.existsSync(path.join(input.scene.stubDir, 'bodies', String(n))),
    )
    .map((n) => getBodyOfCall({ scene: input.scene, n }));

type RecordOnDisk = {
  key: string;
  exid: string | null;
  title: string | null;
  description: string | null;
  promise: string | null;
  recordStatus: string;
  reason: string | null;
};

const getRecords = (input: { scene: JourneyScene }): RecordOnDisk[] => {
  const dir = path.join(input.scene.repoDir, '.behavior', '.radio');
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((name) => /^record\.[a-z0-9-]+\.json$/.test(name))
    .map((name) => JSON.parse(fs.readFileSync(path.join(dir, name), 'utf-8')));
};

const getOneRecord = (input: {
  scene: JourneyScene;
  title: string | null;
  exid?: string | null;
  status?: string | null;
}): RecordOnDisk => {
  const record = getRecords(input).find(
    (one) => one.title === input.title && one.exid === (input.exid ?? null),
  );
  if (!record)
    throw new MalfunctionError('no record on disk for this push', {
      title: input.title,
      exid: input.exid ?? null,
    });
  return record;
};

const getLastLine = (input: { text: string }): string =>
  input.text.split('\n').at(-1) ?? '';

/**
 * .what = the nudge's last line, as the args a re-run takes after the skill name
 */
const asLineFromNudge = (input: { text: string }): string => {
  const head = 'rhx radio.task.push ';
  return input.text.slice(input.text.lastIndexOf(head) + head.length);
};

/**
 * .what = mask the parts of an output that vary per run
 * .why = record keys hash the push identity, so they hold still; temp paths, dates, and exids vary
 */
const asStableOutput = (input: { output: string }): string =>
  sanitizeOutput(input.output)
    .replace(/#[\w-]+/g, '#<exid>')
    .replace(/exid: [\w-]+/g, 'exid: <exid>')
    .replace(/repo-\d+/g, 'repo-<run>')
    .replace(/\b[0-9a-f]{16}\b/g, '<uuid>')
    .replace(/\d{4}-\d{2}-\d{2}/g, '<date>');

describe('radio.task.push — the promise gate, via a stub gh', () => {
  given('[case1] a clone pushes a follow-up into a public repo (stub: PUBLIC)', () => {
    const commandNudged = `rhx radio.task.push --via gh.issues --into ${TARGET} --title 'retry lesson reminders' --description 'retry a failed reminder once' --auth 'as-robot:env(${TOKEN_VAR})' --promise ${PROMISE}`;
    const scene = useBeforeAll(async () => {
      const scene = genJourneyScene({ prefix: 'radio-promise-journey-1-' });
      setVisibility({ scene, repo: TARGET, mode: 'PUBLIC' });
      return scene;
    });

    when('[t0] before any push', () => {
      const result = useThen('the scene is read', () => ({
        records: getRecords({ scene }),
        calls: getCalls({ scene }),
      }));

      then('no record file is on disk, and no gh call was made', () => {
        expect(result.records).toEqual([]);
        expect(result.calls).toEqual([]);
      });
    });

    when('[t1] push title and body, no --promise', () => {
      const result = useThen('the push runs, then the queue is read', () => {
        const push = runPush({
          scene,
          title: 'retry lesson reminders',
          description: 'retry a failed reminder once',
        });
        const queue = runQueue({ scene, args: ['get'] });
        return {
          push,
          queue,
          reads: getCallNumbers({ scene, verb: 'repo view', repo: TARGET }),
          creates: getCallNumbers({ scene, verb: 'issue create' }),
          records: getRecords({ scene }),
        };
      });

      then('exit 2, and the nudge ends with the exact command to re-run', () => {
        expect(result.push.exitCode).toEqual(2);
        expect(result.push.stdout).toContain(
          '🦫 hold up — this task goes to a public repo',
        );
        expect(getLastLine({ text: result.push.stdout })).toEqual(
          commandNudged,
        );
        expect(asStableOutput({ output: result.push.stdout })).toMatchSnapshot();
      });

      then('the visibility was read once, and no issue was created', () => {
        expect(result.reads).toHaveLength(1);
        expect(result.creates).toEqual([]);
      });

      then('the push own record is DROPPED, and none is held', () => {
        expect(result.records).toHaveLength(1);
        expect(result.records[0]?.recordStatus).toEqual('DROPPED');
        expect(result.records[0]?.reason).toEqual('public-repo:unpromised');
        expect(result.queue.exitCode).toEqual(0);
        expect(result.queue.stdout).toContain('naught held');
      });
    });

    when('[t2] push --promise wrong-value', () => {
      const result = useThen('the push runs', () => {
        const callsBefore = getCalls({ scene }).length;
        const push = runPush({
          scene,
          title: 'retry lesson reminders',
          description: 'retry a failed reminder once',
          promise: 'wrong-value',
        });
        return { push, callsNew: getCalls({ scene }).slice(callsBefore) };
      });

      then('exit 2, names the one valid value, and sends no request', () => {
        expect(result.push.exitCode).toEqual(2);
        expect(result.push.stderr).toContain('✋ ConstraintError');
        expect(result.push.stderr).toContain(`--promise ${PROMISE}`);
        expect(result.callsNew).toEqual([]);
        expect(
          asStableOutput({ output: result.push.stderr }),
        ).toMatchSnapshot();
      });
    });

    when('[t3] re-run the exact command the nudge printed', () => {
      const result = useThen('the command runs, then the queue is read', () => {
        const push = runSkill({
          scene,
          skill: 'radio.task.push',
          line: commandNudged.replace(/^rhx radio\.task\.push /, ''),
        });
        const queue = runQueue({ scene, args: ['get'] });
        return {
          push,
          queue,
          creates: getCallNumbers({ scene, verb: 'issue create' }),
          record: getOneRecord({ scene, title: 'retry lesson reminders' }),
        };
      });

      then('exit 0, and exactly one issue was created', () => {
        expect(result.push.exitCode).toEqual(0);
        expect(result.creates).toHaveLength(1);
        expect(asStableOutput({ output: result.push.stdout })).toMatchSnapshot();
      });

      then('the record is DELIVERED with the promise set, and naught waits', () => {
        expect(result.record.recordStatus).toEqual('DELIVERED');
        expect(result.record.promise).toEqual(PROMISE);
        expect(result.queue.stdout).toContain('naught held');
      });
    });
  });

  given('[case2] a clone pushes into a private and an internal repo (stub: PRIVATE, INTERNAL)', () => {
    const repoInternal = 'sandpine/instructor-schedule';
    const scene = useBeforeAll(async () => {
      const scene = genJourneyScene({ prefix: 'radio-promise-journey-2-' });
      setVisibility({ scene, repo: TARGET, mode: 'PRIVATE' });
      setVisibility({ scene, repo: repoInternal, mode: 'INTERNAL' });
      return scene;
    });

    when('[t1] push title and body to the private repo, no --promise', () => {
      const result = useThen('the push runs', () => ({
        push: runPush({
          scene,
          title: 'board rentals open friday',
          description: 'rentals open at nine',
        }),
        reads: getCallNumbers({ scene, verb: 'repo view' }),
        creates: getCallNumbers({ scene, verb: 'issue create' }),
      }));

      then('exit 0, no nudge, one read, and one issue created', () => {
        expect(result.push.exitCode).toEqual(0);
        expect(result.push.stdout).not.toContain('hold up');
        expect(result.reads).toHaveLength(1);
        expect(result.creates).toHaveLength(1);
        expect(asStableOutput({ output: result.push.stdout })).toMatchSnapshot();
      });
    });

    when('[t2] push to the private repo with a stray --promise', () => {
      const result = useThen('the push runs', () => {
        const callsBefore = getCalls({ scene }).length;
        const push = runPush({
          scene,
          title: 'wetsuit sizes',
          description: 'count the 4/3s',
          promise: PROMISE,
        });
        return {
          push,
          reads: getCallNumbers({ scene, verb: 'repo view', after: callsBefore }),
          creates: getCallNumbers({ scene, verb: 'issue create', after: callsBefore }),
        };
      });

      then('exit 0, one issue created, and no read: the promise settles it', () => {
        expect(result.push.exitCode).toEqual(0);
        expect(result.reads).toEqual([]);
        expect(result.creates).toHaveLength(1);
        expect(asStableOutput({ output: result.push.stdout })).toMatchSnapshot();
      });
    });

    when('[t3] push to the internal repo, no --promise', () => {
      const result = useThen('the push runs', () => {
        const callsBefore = getCalls({ scene }).length;
        const push = runPush({
          scene,
          into: repoInternal,
          title: 'instructor shifts',
          description: 'swap the dawn shifts',
        });
        return {
          push,
          reads: getCallNumbers({ scene, verb: 'repo view', repo: repoInternal, after: callsBefore }),
          creates: getCallNumbers({ scene, verb: 'issue create', repo: repoInternal, after: callsBefore }),
        };
      });

      then('exit 0, one read, and one issue created', () => {
        expect(result.push.exitCode).toEqual(0);
        expect(result.push.stdout).not.toContain('hold up');
        expect(result.reads).toHaveLength(1);
        expect(result.creates).toHaveLength(1);
        expect(asStableOutput({ output: result.push.stdout })).toMatchSnapshot();
      });
    });

    when('[t4] edit the body of issue 41 in the private repo, no --promise', () => {
      const result = useThen('the push runs', () => {
        const callsBefore = getCalls({ scene }).length;
        const push = runPush({
          scene,
          exid: '41',
          description: 'rentals open at ten',
        });
        return {
          push,
          reads: getCallNumbers({ scene, verb: 'repo view', after: callsBefore }),
          bodies: getBodiesSent({ scene, verb: 'issue edit', after: callsBefore }),
        };
      });

      then('exit 0, no nudge, and the edit carries the new body', () => {
        expect(result.push.exitCode).toEqual(0);
        expect(result.push.stdout).not.toContain('hold up');
        expect(result.reads).toHaveLength(1);
        expect(result.bodies).toHaveLength(1);
        expect(result.bodies[0]).toContain('rentals open at ten');
        expect(asStableOutput({ output: result.push.stdout })).toMatchSnapshot();
      });
    });
  });

  given('[case3] a clone pushes into a repo whose visibility cannot be read (stub: fail, garbage, unknown)', () => {
    const repoGarbage = 'sandpine/board-rentals';
    const repoUnknown = 'sandpine/wetsuit-stock';
    const scene = useBeforeAll(async () => {
      const scene = genJourneyScene({ prefix: 'radio-promise-journey-3-' });
      setVisibility({ scene, repo: TARGET, mode: 'fail' });
      setVisibility({ scene, repo: repoGarbage, mode: 'garbage' });
      setVisibility({ scene, repo: repoUnknown, mode: 'unknown' });
      return scene;
    });

    when('[t1] push title and body, no --promise', () => {
      const result = useThen('the push runs', () => ({
        push: runPush({
          scene,
          title: 'retry lesson reminders',
          description: 'retry a failed reminder once',
        }),
        creates: getCallNumbers({ scene, verb: 'issue create' }),
        record: getOneRecord({ scene, title: 'retry lesson reminders' }),
      }));

      then('exit 2, and the nudge marks the repo as unreadable, treated as public', () => {
        expect(result.push.exitCode).toEqual(2);
        expect(result.push.stdout).toContain('🦫 hold up — this task may go to a public repo');
        expect(result.push.stdout).toContain('(visibility unreadable — treated as public');
        expect(result.creates).toEqual([]);
        expect(result.record.recordStatus).toEqual('DROPPED');
        expect(result.record.reason).toEqual('public-repo:unreadable');
        expect(asStableOutput({ output: result.push.stdout })).toMatchSnapshot();
      });
    });

    when('[t2] re-run with --promise', () => {
      const result = useThen('the push runs', () => {
        const callsBefore = getCalls({ scene }).length;
        const push = runPush({
          scene,
          title: 'retry lesson reminders',
          description: 'retry a failed reminder once',
          promise: PROMISE,
        });
        return {
          push,
          reads: getCallNumbers({ scene, verb: 'repo view', after: callsBefore }),
          creates: getCallNumbers({ scene, verb: 'issue create', after: callsBefore }),
        };
      });

      then('exit 0, one issue created, and no read for this push', () => {
        expect(result.push.exitCode).toEqual(0);
        expect(result.reads).toEqual([]);
        expect(result.creates).toHaveLength(1);
        expect(asStableOutput({ output: result.push.stdout })).toMatchSnapshot();
      });
    });

    when('[t3] push --exid 41 --description, no --promise', () => {
      const result = useThen('the push runs', () => {
        const callsBefore = getCalls({ scene }).length;
        const push = runPush({ scene, exid: '41', description: 'rentals open at ten' });
        return {
          push,
          edits: getCallNumbers({ scene, verb: 'issue edit', after: callsBefore }),
        };
      });

      then('exit 2, the nudge prints the --exid 41 command with --promise, and no edit is sent', () => {
        expect(result.push.exitCode).toEqual(2);
        expect(getLastLine({ text: result.push.stdout })).toContain('--exid 41');
        expect(getLastLine({ text: result.push.stdout })).toContain(`--promise ${PROMISE}`);
        expect(result.edits).toEqual([]);
        expect(asStableOutput({ output: result.push.stdout })).toMatchSnapshot();
      });
    });

    when('[t4] push to a repo that answers non-json', () => {
      const result = useThen('the push runs', () => ({
        push: runPush({
          scene,
          into: repoGarbage,
          title: 'board rack count',
          description: 'count the racks',
        }),
      }));

      then('exit 2, and the nudge names the cause: visibility json unparsable', () => {
        expect(result.push.exitCode).toEqual(2);
        expect(result.push.stdout).toContain('visibility json unparsable');
        expect(asStableOutput({ output: result.push.stdout })).toMatchSnapshot();
      });
    });

    when('[t5] push to a repo that answers an unknown visibility', () => {
      const result = useThen('the push runs', () => ({
        push: runPush({
          scene,
          into: repoUnknown,
          title: 'wetsuit stock count',
          description: 'count the wetsuits',
        }),
      }));

      then('exit 2, and the nudge names the unknown value as the cause', () => {
        expect(result.push.exitCode).toEqual(2);
        expect(result.push.stdout).toContain('visibility value "SECRET" unknown');
        expect(asStableOutput({ output: result.push.stdout })).toMatchSnapshot();
      });
    });
  });

  given('[case4] a clone edits the title and body of a public issue (stub: PUBLIC)', () => {
    const scene = useBeforeAll(async () => {
      const scene = genJourneyScene({ prefix: 'radio-promise-journey-4-' });
      setVisibility({ scene, repo: TARGET, mode: 'PUBLIC' });
      return scene;
    });

    when('[t1] push --exid 41 with a new title and body, no --promise', () => {
      const result = useThen('the push runs', () => ({
        push: runPush({
          scene,
          exid: '41',
          title: 'lesson reminder retry',
          description: 'retry once, then report',
        }),
        edits: getCallNumbers({ scene, verb: 'issue edit' }),
      }));

      then('exit 2, the nudge prints the --exid 41 command, and no edit is sent', () => {
        expect(result.push.exitCode).toEqual(2);
        expect(getLastLine({ text: result.push.stdout })).toContain('--exid 41');
        expect(getLastLine({ text: result.push.stdout })).toContain("--title 'lesson reminder retry'");
        expect(result.edits).toEqual([]);
        expect(asStableOutput({ output: result.push.stdout })).toMatchSnapshot();
      });
    });

    when('[t2] re-run with --promise', () => {
      const result = useThen('the push runs', () => {
        const callsBefore = getCalls({ scene }).length;
        const push = runPush({
          scene,
          exid: '41',
          title: 'lesson reminder retry',
          description: 'retry once, then report',
          promise: PROMISE,
        });
        return {
          push,
          edits: getCallNumbers({ scene, verb: 'issue edit', after: callsBefore }),
          bodies: getBodiesSent({ scene, verb: 'issue edit', after: callsBefore }),
        };
      });

      then('exit 0, and exactly one edit carries the new body', () => {
        expect(result.push.exitCode).toEqual(0);
        expect(result.edits).toHaveLength(1);
        expect(result.bodies[0]).toContain('retry once, then report');
        expect(asStableOutput({ output: result.push.stdout })).toMatchSnapshot();
      });
    });

    when('[t3] push via os.fileops with a stray --promise', () => {
      const result = useThen('the push runs', () => {
        const callsBefore = getCalls({ scene }).length;
        const push = runSkill({
          scene,
          skill: 'radio.task.push',
          argv: [
            '--via', 'os.fileops',
            '--into', TARGET,
            '--title', 'board wax order',
            '--description', 'order the wax',
            '--promise', PROMISE,
          ],
        });
        return {
          push,
          reads: getCallNumbers({ scene, verb: 'repo view', after: callsBefore }),
          creates: getCallNumbers({ scene, verb: 'issue create', after: callsBefore }),
        };
      });

      then('exit 0, and no visibility read and no issue create: the channel is not gh', () => {
        expect(result.push.exitCode).toEqual(0);
        expect(result.reads).toEqual([]);
        expect(result.creates).toEqual([]);
        expect(asStableOutput({ output: result.push.stdout })).toMatchSnapshot();
      });
    });
  });

  given('[case5] a clone claims an issue in a public repo, status only (stub: PUBLIC)', () => {
    const scene = useBeforeAll(async () => {
      const scene = genJourneyScene({ prefix: 'radio-promise-journey-5-' });
      setVisibility({ scene, repo: TARGET, mode: 'PUBLIC' });
      setIssueState({ scene, exid: '5', state: 'QUEUED' });
      return scene;
    });

    when('[t1] push --exid 5 --status CLAIMED', () => {
      const result = useThen('the push runs', () => ({
        push: runPush({ scene, exid: '5', status: 'CLAIMED' }),
        reads: getCallNumbers({ scene, verb: 'repo view' }),
        bodies: getBodiesSent({ scene, verb: 'issue edit' }),
      }));

      then('exit 0, no nudge, and no visibility read', () => {
        expect(result.push.exitCode).toEqual(0);
        expect(result.push.stdout).not.toContain('hold up');
        expect(result.reads).toEqual([]);
        expect(asStableOutput({ output: result.push.stdout })).toMatchSnapshot();
      });

      then('the body the claim writes is the extant tree line over the issue own text', () => {
        expect(result.bodies).toHaveLength(1);
        expect(result.bodies[0]).toContain('🌲 tree planted at feat/promise-journey');
        expect(result.bodies[0]).toContain('stub issue body');
      });
    });
  });

  given('[case6] four pushes held behind a shut radio.uses gate: A public+promise, B public, C private, D unreadable', () => {
    const repoA = 'sandpine/svc-lessons';
    const repoB = TARGET;
    const repoC = 'sandpine/infrastructure';
    const repoD = 'sandpine/coachbook';
    const scene = useBeforeAll(async () => {
      const scene = genJourneyScene({ prefix: 'radio-promise-journey-6-' });
      setVisibility({ scene, repo: repoA, mode: 'PUBLIC' });
      setVisibility({ scene, repo: repoB, mode: 'PUBLIC' });
      setVisibility({ scene, repo: repoC, mode: 'PRIVATE' });
      setVisibility({ scene, repo: repoD, mode: 'fail' });
      setGate({ scene, gate: 'blocked' });
      return scene;
    });

    when('[t0] the four pushes are held, then the queue is read', () => {
      const result = useThen('four pushes, then queue get', () => {
        const pushes = [
          runPush({ scene, into: repoA, title: 'lesson reminder copy', description: 'say see you at nine', promise: PROMISE }),
          runPush({ scene, into: repoB, title: 'retry lesson reminders', description: 'retry a failed reminder once' }),
          runPush({ scene, into: repoC, title: 'rotate the wax order', description: 'order wax monthly' }),
          runPush({ scene, into: repoD, title: 'coach roster sync', description: 'sync the roster nightly' }),
        ];
        return { pushes, queue: runQueue({ scene, args: ['get'] }), callsAll: getCalls({ scene }) };
      });

      then('each push is held at the gate, exit 2, with no gh call', () => {
        expect(result.pushes.map((push) => push.exitCode)).toEqual([2, 2, 2, 2]);
        expect(result.callsAll).toEqual([]);
      });

      then('a text push held at the gate says a public repo will owe a promise; the promised one does not', () => {
        const note = 'a public repo will owe --promise; pass it now if so';
        expect(result.pushes.map((push) => push.stdout.includes(note))).toEqual([false, true, true, true]);
        expect(asStableOutput({ output: result.pushes[1]!.stdout })).toMatchSnapshot();
      });

      then('queue get lists four held records', () => {
        expect(result.queue.exitCode).toEqual(0);
        expect(result.queue.stdout.match(/→ sandpine\//g)).toHaveLength(4);
        expect(asStableOutput({ output: result.queue.stdout })).toMatchSnapshot();
      });
    });

    when('[t1] open the radio.uses gate; queue drain', () => {
      const result = useThen('the gate opens, then the drain runs', () => {
        setGate({ scene, gate: 'allowed' });
        const drain = runQueue({ scene, args: ['drain'] });
        return {
          drain,
          creates: getCallNumbers({ scene, verb: 'issue create' }),
          createsA: getCallNumbers({ scene, verb: 'issue create', repo: repoA }),
          createsC: getCallNumbers({ scene, verb: 'issue create', repo: repoC }),
          reads: getCallNumbers({ scene, verb: 'repo view' }),
          recordB: getOneRecord({ scene, title: 'retry lesson reminders' }),
          recordD: getOneRecord({ scene, title: 'coach roster sync' }),
        };
      });

      then('exit 2, A and C are created, and B and D are held with their reasons', () => {
        expect(result.drain.exitCode).toEqual(2);
        expect(result.creates).toHaveLength(2);
        expect(result.createsA).toHaveLength(1);
        expect(result.createsC).toHaveLength(1);
        expect(result.recordB.recordStatus).toEqual('QUEUED');
        expect(result.recordB.reason).toEqual('public-repo:unpromised');
        expect(result.recordD.recordStatus).toEqual('QUEUED');
        expect(result.recordD.reason).toEqual('public-repo:unreadable');
      });

      then('the visibility was read for B, C, and D, never for the promised A', () => {
        expect(result.reads).toHaveLength(3);
      });

      then('each held row names its record file, the scrub, the vouch, and the drop', () => {
        expect(result.drain.stdout).toContain('public-repo:unpromised');
        expect(result.drain.stdout).toContain('public-repo:unreadable');
        expect(result.drain.stdout).toContain('visibility unreadable — treated as public');
        expect(result.drain.stdout).toContain('rhx radio.task.queue set --uuid');
        expect(result.drain.stdout).toContain(`rhx radio.task.queue drain --promise ${PROMISE}`);
        expect(result.drain.stdout).toContain('rhx radio.task.queue del --uuid');
        expect(asStableOutput({ output: result.drain.stdout })).toMatchSnapshot();
      });
    });

    when('[t2] a promised push into a public repo flushes the backlog', () => {
      const result = useThen('the push runs', () => {
        const callsBefore = getCalls({ scene }).length;
        const push = runPush({ scene, into: repoA, title: 'surf report copy', description: 'say the swell is up', promise: PROMISE });
        return {
          push,
          createsA: getCallNumbers({ scene, verb: 'issue create', repo: repoA, after: callsBefore }),
          creates: getCallNumbers({ scene, verb: 'issue create', after: callsBefore }),
          recordB: getOneRecord({ scene, title: 'retry lesson reminders' }),
          recordD: getOneRecord({ scene, title: 'coach roster sync' }),
        };
      });

      then('its promise vouches its own text alone: one create, and B and D stay held', () => {
        expect(result.creates).toHaveLength(1);
        expect(result.createsA).toHaveLength(1);
        expect(result.recordB.recordStatus).toEqual('QUEUED');
        expect(result.recordB.reason).toEqual('public-repo:unpromised');
        expect(result.recordB.promise).toBeNull();
        expect(result.recordD.recordStatus).toEqual('QUEUED');
        expect(result.recordD.reason).toEqual('public-repo:unreadable');
        expect(result.recordD.promise).toBeNull();
      });

      then('the push output shows its own create and both held rows, each with its reason', () => {
        expect(result.push.exitCode).toEqual(0);
        expect(result.push.stdout).toContain('public-repo:unpromised');
        expect(result.push.stdout).toContain('public-repo:unreadable');
        expect(asStableOutput({ output: result.push.stdout })).toMatchSnapshot();
      });
    });

    when('[t3] queue drain --promise wrong-value', () => {
      const result = useThen('the drain runs', () => {
        const callsBefore = getCalls({ scene }).length;
        const drain = runQueue({ scene, args: ['drain', '--promise', 'wrong-value'] });
        return { drain, callsNew: getCalls({ scene }).slice(callsBefore) };
      });

      then('exit 2, names the one valid value, and sends no request', () => {
        expect(result.drain.exitCode).toEqual(2);
        expect(result.drain.stderr).toContain('✋ ConstraintError');
        expect(result.drain.stderr).toContain(`--promise ${PROMISE}`);
        expect(result.callsNew).toEqual([]);
        expect(asStableOutput({ output: result.drain.stderr })).toMatchSnapshot();
      });
    });

    when('[t4] queue drain --promise task-to-public-repo-is-anonymized', () => {
      const result = useThen('the drain runs', () => {
        const callsBefore = getCalls({ scene }).length;
        const drain = runQueue({ scene, args: ['drain', '--promise', PROMISE] });
        return {
          drain,
          createsB: getCallNumbers({ scene, verb: 'issue create', repo: repoB, after: callsBefore }),
          createsD: getCallNumbers({ scene, verb: 'issue create', repo: repoD, after: callsBefore }),
          creates: getCallNumbers({ scene, verb: 'issue create', after: callsBefore }),
          reads: getCallNumbers({ scene, verb: 'repo view', after: callsBefore }),
        };
      });

      then('exit 0, and B and D are created, one request each, with no read', () => {
        expect(result.drain.exitCode).toEqual(0);
        expect(result.creates).toHaveLength(2);
        expect(result.createsB).toHaveLength(1);
        expect(result.createsD).toHaveLength(1);
        expect(result.reads).toEqual([]);
        expect(asStableOutput({ output: result.drain.stdout })).toMatchSnapshot();
      });
    });

    when('[t5] queue get', () => {
      const result = useThen('the queue is read', () => ({
        queue: runQueue({ scene, args: ['get'] }),
      }));

      then('naught waits', () => {
        expect(result.queue.exitCode).toEqual(0);
        expect(result.queue.stdout).toContain('naught held');
        expect(asStableOutput({ output: result.queue.stdout })).toMatchSnapshot();
      });
    });
  });

  given('[case7] a private push flushes a backlog that holds a public record (stub: PUBLIC, PRIVATE)', () => {
    const repoPrivate = 'sandpine/infrastructure';
    const scene = useBeforeAll(async () => {
      const scene = genJourneyScene({ prefix: 'radio-promise-journey-7-' });
      setVisibility({ scene, repo: TARGET, mode: 'PUBLIC' });
      setVisibility({ scene, repo: repoPrivate, mode: 'PRIVATE' });
      setGate({ scene, gate: 'blocked' });
      return scene;
    });

    when('[t0] a public push is held at the shut gate', () => {
      const result = useThen('the push runs', () => ({
        push: runPush({ scene, title: 'retry lesson reminders', description: 'retry a failed reminder once' }),
      }));

      then('exit 2, held', () => {
        expect(result.push.exitCode).toEqual(2);
        expect(result.push.stdout).toContain('🦫 held for the radio');
      });
    });

    when('[t1] the gate opens, and a private push goes through', () => {
      const result = useThen('the push runs, then the queue is read', () => {
        setGate({ scene, gate: 'allowed' });
        const push = runPush({ scene, into: repoPrivate, title: 'tide chart refresh', description: 'refresh the chart at dawn' });
        const queue = runQueue({ scene, args: ['get'] });
        return {
          push,
          queue,
          createsPrivate: getCallNumbers({ scene, verb: 'issue create', repo: repoPrivate }),
          createsPublic: getCallNumbers({ scene, verb: 'issue create', repo: TARGET }),
        };
      });

      then('exit 0: its own task is sent, and the public record is not', () => {
        expect(result.push.exitCode).toEqual(0);
        expect(result.createsPrivate).toHaveLength(1);
        expect(result.createsPublic).toEqual([]);
      });

      then('the output names the public record still held, with its fix', () => {
        expect(result.push.stdout).toContain('retry lesson reminders');
        expect(result.push.stdout).toContain('public-repo:unpromised');
        expect(asStableOutput({ output: result.push.stdout })).toMatchSnapshot();
      });

      then('queue get lists it in the state: awaits promise', () => {
        expect(result.queue.stdout).toContain('retry lesson reminders');
        expect(result.queue.stdout).toContain('awaits promise');
        expect(asStableOutput({ output: result.queue.stdout })).toMatchSnapshot();
      });
    });
  });

  given('[case8] the visibility read meets a rate limit, a reset socket, and a rejected token', () => {
    const repoLimit = 'sandpine/swell-feed';
    const repoReset = 'sandpine/tide-feed';
    const repoToken = 'sandpine/wave-feed';
    const scene = useBeforeAll(async () => {
      const scene = genJourneyScene({ prefix: 'radio-promise-journey-8-' });
      setVisibility({ scene, repo: repoLimit, mode: 'ratelimit' });
      setVisibility({ scene, repo: repoReset, mode: 'econnreset' });
      setVisibility({ scene, repo: repoToken, mode: 'unauthorized' });
      return scene;
    });

    when('[t1] a held push meets a rate limit on the read; queue drain', () => {
      const result = useThen('hold, open, drain', () => {
        setGate({ scene, gate: 'blocked' });
        runPush({ scene, into: repoLimit, title: 'swell feed audit', description: 'audit the swell feed' });
        setGate({ scene, gate: 'allowed' });
        const drain = runQueue({ scene, args: ['drain'] });
        return {
          drain,
          creates: getCallNumbers({ scene, verb: 'issue create' }),
          record: getOneRecord({ scene, title: 'swell feed audit' }),
        };
      });

      then('exit 2: the drain halts, the record stays queued, and the row names the read', () => {
        expect(result.drain.exitCode).toEqual(2);
        expect(result.creates).toEqual([]);
        expect(result.record.recordStatus).toEqual('QUEUED');
        expect(result.record.reason).toEqual('upstream:rate-limit');
        expect(result.drain.stdout).toContain('visibility read');
        expect(asStableOutput({ output: result.drain.stdout })).toMatchSnapshot();
      });
    });

    when('[t2] the limit lifts; a held push meets a reset socket on the read; queue drain', () => {
      const result = useThen('lift, hold, open, drain', () => {
        setVisibility({ scene, repo: repoLimit, mode: 'PRIVATE' });
        setGate({ scene, gate: 'blocked' });
        runPush({ scene, into: repoReset, title: 'tide feed audit', description: 'audit the tide feed' });
        setGate({ scene, gate: 'allowed' });
        const drain = runQueue({ scene, args: ['drain'] });
        return {
          drain,
          createsLimit: getCallNumbers({ scene, verb: 'issue create', repo: repoLimit }),
          createsReset: getCallNumbers({ scene, verb: 'issue create', repo: repoReset }),
          record: getOneRecord({ scene, title: 'tide feed audit' }),
        };
      });

      then('exit 2: the first record is delivered, the second halts at the read, and the row names it', () => {
        expect(result.drain.exitCode).toEqual(2);
        expect(result.createsLimit).toHaveLength(1);
        expect(result.createsReset).toEqual([]);
        expect(result.record.recordStatus).toEqual('QUEUED');
        expect(result.record.reason).toEqual('upstream:transient');
        expect(result.drain.stdout).toContain('visibility read');
        expect(asStableOutput({ output: result.drain.stdout })).toMatchSnapshot();
      });
    });

    when('[t3] the socket recovers; a push meets a rejected token on the read', () => {
      const result = useThen('recover, push', () => {
        setVisibility({ scene, repo: repoReset, mode: 'PRIVATE' });
        const push = runPush({ scene, into: repoToken, title: 'wave feed audit', description: 'audit the wave feed' });
        return { push, record: getOneRecord({ scene, title: 'wave feed audit' }) };
      });

      then('exit 2, and the nudge leads with the auth fix, and its command re-runs as human with no promise', () => {
        expect(result.push.exitCode).toEqual(2);
        expect(result.push.stdout).toContain('first: re-run with --auth as-human');
        expect(getLastLine({ text: result.push.stdout })).toContain('--auth as-human');
        expect(getLastLine({ text: result.push.stdout })).not.toContain('--promise');
        expect(result.record.recordStatus).toEqual('DROPPED');
        expect(result.record.reason).toEqual('public-repo:unreadable-auth');
        expect(asStableOutput({ output: result.push.stdout })).toMatchSnapshot();
      });
    });

    when('[t4] a held push meets a rejected token on the read; queue drain', () => {
      const result = useThen('hold, open, drain', () => {
        setGate({ scene, gate: 'blocked' });
        runPush({ scene, into: repoToken, title: 'wave feed repair', description: 'repair the wave feed' });
        setGate({ scene, gate: 'allowed' });
        const drain = runQueue({ scene, args: ['drain'] });
        return { drain, record: getOneRecord({ scene, title: 'wave feed repair' }) };
      });

      then('exit 2, and the row leads with the as-human amend', () => {
        expect(result.drain.exitCode).toEqual(2);
        expect(result.record.recordStatus).toEqual('QUEUED');
        expect(result.record.reason).toEqual('public-repo:unreadable-auth');
        expect(result.drain.stdout).toContain('first, try another auth: rhx radio.task.queue set --uuid');
        expect(asStableOutput({ output: result.drain.stdout })).toMatchSnapshot();
      });
    });

    when('[t5] a push, with the gate open, meets a reset socket on the read', () => {
      const result = useThen('reset, push', () => {
        setVisibility({ scene, repo: repoReset, mode: 'econnreset' });
        // [t3] flushed the held tide record into this repo; count only this push's creates
        const createsBefore = getCallNumbers({ scene, verb: 'issue create', repo: repoReset });
        const push = runPush({ scene, into: repoReset, title: 'tide feed repair', description: 'repair the tide feed' });
        const createsAfter = getCallNumbers({ scene, verb: 'issue create', repo: repoReset });
        return {
          push,
          creates: createsAfter.slice(createsBefore.length),
          record: getOneRecord({ scene, title: 'tide feed repair' }),
        };
      });

      then('exit 2: no create, the record stays queued for the next drain, and no promise nudge — an outage is a wall, not a public repo', () => {
        expect(result.push.exitCode).toEqual(2);
        expect(result.creates).toEqual([]);
        expect(result.record.recordStatus).toEqual('QUEUED');
        expect(result.record.reason).toEqual('upstream:transient');
        expect(result.push.stdout).not.toContain('🦫 hold up');
        expect(result.push.stdout).toContain('visibility read');
        // the backlog holds one record that awaits a promise; the next line counts it apart
        expect(result.push.stdout).toContain(
          'then the next push delivers the rest of the backlog first; 1 awaits an anonymized promise: `drain --promise`',
        );
        expect(asStableOutput({ output: result.push.stdout })).toMatchSnapshot();
      });
    });
  });

  given('[case9] refusals, help, and the stop line (stub: PUBLIC)', () => {
    const scene = useBeforeAll(async () => {
      const scene = genJourneyScene({ prefix: 'radio-promise-journey-9-' });
      setVisibility({ scene, repo: TARGET, mode: 'PUBLIC' });
      return scene;
    });

    when('[t1] push with a bare --promise', () => {
      const result = useThen('the push runs', () => ({
        push: runPush({ scene, title: 'retry lesson reminders', description: 'retry once', promise: true }),
        records: getRecords({ scene }),
        calls: getCalls({ scene }),
      }));

      then('exit 2, the valid value is named, and no record or request is made', () => {
        expect(result.push.exitCode).toEqual(2);
        expect(result.push.stderr).toContain('(no value)');
        expect(result.push.stderr).toContain(`--promise ${PROMISE}`);
        expect(result.records).toEqual([]);
        expect(result.calls).toEqual([]);
        expect(asStableOutput({ output: result.push.stderr })).toMatchSnapshot();
      });
    });

    when('[t1.1] queue drain with a bare --promise, and with an empty one (an unset $P)', () => {
      const result = useThen('both drains run', () => ({
        bare: runQueue({ scene, args: ['drain', '--promise'] }),
        empty: runQueue({ scene, args: ['drain', '--promise', ''] }),
        calls: getCalls({ scene }),
      }));

      then('both exit 2, name the one valid value, and make no request', () => {
        expect(result.bare.exitCode).toEqual(2);
        expect(result.bare.stderr).toContain(`--promise ${PROMISE}`);
        expect(result.empty.exitCode).toEqual(2);
        expect(result.empty.stderr).toContain(`--promise ${PROMISE}`);
        expect(result.calls).toEqual([]);
        expect(asStableOutput({ output: result.bare.stderr })).toMatchSnapshot();
        expect(asStableOutput({ output: result.empty.stderr })).toMatchSnapshot();
      });
    });

    when('[t2] push with an empty body: --description with no text, and an empty @stdin', () => {
      const result = useThen('both pushes run', () => ({
        pushArg: runPush({ scene, title: 'retry lesson reminders', description: '' }),
        pushStdin: runPush({ scene, title: 'retry lesson reminders', description: '@stdin', stdin: '' }),
        // an update with an empty body would blank the issue; the re-run with the pipe forgotten
        updateArg: runPush({ scene, exid: '7', description: '' }),
        updateStdin: runPush({ scene, exid: '7', description: '@stdin', stdin: '' }),
        // an update with an empty title would retitle the issue; an unset shell variable does it
        updateTitle: runPush({ scene, exid: '7', title: '' }),
        records: getRecords({ scene }),
        calls: getCalls({ scene }),
      }));

      then('an update with an empty title exits 2, names the empty title, and retitles no issue', () => {
        expect(result.updateTitle.exitCode).toEqual(2);
        expect(result.updateTitle.stderr).toContain('--title is empty');
        expect(result.records).toEqual([]);
        expect(result.calls).toEqual([]);
        expect(asStableOutput({ output: result.updateTitle.stderr })).toMatchSnapshot();
      });

      then('an update with an empty body exits 2, names the empty body, and blanks no issue', () => {
        expect(result.updateArg.exitCode).toEqual(2);
        expect(result.updateArg.stderr).toContain('--description is empty');
        expect(result.updateStdin.exitCode).toEqual(2);
        expect(result.updateStdin.stderr).toContain('--description is empty');
        expect(result.records).toEqual([]);
        expect(result.calls).toEqual([]);
        expect(asStableOutput({ output: result.updateArg.stderr })).toMatchSnapshot();
      });

      then('both exit 2, name the empty body (never "required"), and no record or request is made', () => {
        expect(result.pushArg.exitCode).toEqual(2);
        expect(result.pushArg.stderr).toContain('✋ ConstraintError');
        expect(result.pushArg.stderr).toContain('--description is empty; a new task needs a body');
        expect(result.pushStdin.exitCode).toEqual(2);
        expect(result.pushStdin.stderr).toContain('--description is empty; a new task needs a body');
        expect(result.pushStdin.stderr).not.toContain('--description required');
        expect(result.records).toEqual([]);
        expect(result.calls).toEqual([]);
        expect(asStableOutput({ output: result.pushArg.stderr })).toMatchSnapshot();
        expect(asStableOutput({ output: result.pushStdin.stderr })).toMatchSnapshot();
      });
    });

    when('[t3] queue set with an empty @stdin body', () => {
      const result = useThen('the set runs', () => ({
        set: runQueue({
          scene,
          args: ['set', '--uuid', 'abcdef0123456789', '--description', '@stdin'],
          stdin: '',
        }),
      }));

      then('exit 2, and the refusal names the empty body', () => {
        expect(result.set.exitCode).toEqual(2);
        expect(result.set.stderr).toContain('--description is empty');
        expect(asStableOutput({ output: result.set.stderr })).toMatchSnapshot();
      });
    });

    when('[t4] both --help outputs', () => {
      const result = useThen('both helps run', () => ({
        push: runSkill({ scene, skill: 'radio.task.push', argv: ['--help'] }),
        queue: runSkill({ scene, skill: 'radio.task.queue', argv: ['--help'] }),
      }));

      then('each names the promise', () => {
        expect(result.push.exitCode).toEqual(0);
        expect(result.push.stdout).toContain(`--promise ${PROMISE}`);
        expect(result.queue.exitCode).toEqual(0);
        expect(result.queue.stdout).toContain(`drain --promise ${PROMISE}`);
        expect(asStableOutput({ output: result.push.stdout })).toMatchSnapshot();
        expect(asStableOutput({ output: result.queue.stdout })).toMatchSnapshot();
      });
    });

    when('[t5] a public record is held for its promise; queue get --when hook.onStop', () => {
      const result = useThen('hold, open, drain, then the stop line', () => {
        setGate({ scene, gate: 'blocked' });
        runPush({ scene, title: 'retry lesson reminders', description: 'retry a failed reminder once' });
        setGate({ scene, gate: 'allowed' });
        runQueue({ scene, args: ['drain'] });
        return { stop: runQueue({ scene, args: ['get', '--when', 'hook.onStop'] }) };
      });

      then('exit 0, one line that leads with the read, never the vouch first', () => {
        expect(result.stop.exitCode).toEqual(0);
        const line = result.stop.stdout.split('\n').find((one) => one.startsWith('{')) ?? '{}';
        const message: string = JSON.parse(line).systemMessage ?? '';
        expect(message).toContain('1 awaits an anonymized promise');
        expect(message).toContain('read each at its record file');
        expect(message.indexOf('read each')).toBeLessThan(message.indexOf('drain --promise'));
        expect(message).not.toContain('next push delivers');
        expect(asStableOutput({ output: result.stop.stdout })).toMatchSnapshot();
      });
    });
  });

  given('[case10] a promised record held at a shut gate, then amended (catalog #27)', () => {
    const scene = useBeforeAll(async () => {
      const scene = genJourneyScene({ prefix: 'radio-promise-journey-10-' });
      setVisibility({ scene, repo: TARGET, mode: 'PUBLIC' });
      setGate({ scene, gate: 'blocked' });
      return scene;
    });

    when('[t0] a promised public push is held at the gate', () => {
      const result = useThen('the push runs', () => ({
        push: runPush({ scene, title: 'retry lesson reminders', description: 'retry a failed reminder once', promise: PROMISE }),
        record: getOneRecord({ scene, title: 'retry lesson reminders' }),
      }));

      then('exit 2, held, and the record carries the promise', () => {
        expect(result.push.exitCode).toEqual(2);
        expect(result.record.recordStatus).toEqual('QUEUED');
        expect(result.record.promise).toEqual(PROMISE);
      });
    });

    when('[t1] queue set --uuid <key> --description @stdin', () => {
      const result = useThen('the amend runs', () => {
        const key = getOneRecord({ scene, title: 'retry lesson reminders' }).key;
        return {
          set: runQueue({ scene, args: ['set', '--uuid', key, '--description', '@stdin'], stdin: 'retry a failed reminder twice\n' }),
          record: getOneRecord({ scene, title: 'retry lesson reminders' }),
        };
      });

      then('exit 0, the output names the promise cleared, and the record holds no promise', () => {
        expect(result.set.exitCode).toEqual(0);
        expect(result.set.stdout).toContain('promise: cleared');
        expect(result.record.promise).toBeNull();
        expect(result.record.description).toEqual('retry a failed reminder twice');
        expect(asStableOutput({ output: result.set.stdout })).toMatchSnapshot();
      });
    });

    when('[t2] open the radio.uses gate; queue drain', () => {
      const result = useThen('the gate opens, then the drain runs', () => {
        setGate({ scene, gate: 'allowed' });
        return {
          drain: runQueue({ scene, args: ['drain'] }),
          creates: getCallNumbers({ scene, verb: 'issue create' }),
          record: getOneRecord({ scene, title: 'retry lesson reminders' }),
        };
      });

      then('exit 2, no create is sent, and the record is held for its promise again', () => {
        expect(result.drain.exitCode).toEqual(2);
        expect(result.creates).toEqual([]);
        expect(result.record.recordStatus).toEqual('QUEUED');
        expect(result.record.reason).toEqual('public-repo:unpromised');
        expect(asStableOutput({ output: result.drain.stdout })).toMatchSnapshot();
      });
    });
  });

  given('[case11] a public push is nudged while its drain carries a backlog (catalog #29)', () => {
    const repoPrivate = 'sandpine/infrastructure';
    const authAbsent = 'as-robot:env(RADIO_PROMISE_ABSENT_TOKEN)';
    const scene = useBeforeAll(async () => {
      const scene = genJourneyScene({ prefix: 'radio-promise-journey-11-' });
      setVisibility({ scene, repo: TARGET, mode: 'PUBLIC' });
      setVisibility({ scene, repo: repoPrivate, mode: 'PRIVATE' });
      setGate({ scene, gate: 'blocked' });
      return scene;
    });

    when('[t0] a private record and an auth-faulted record are held at the shut gate', () => {
      const result = useThen('two pushes run', () => ({
        pushes: [
          runPush({ scene, into: repoPrivate, title: 'rotate the wax order', description: 'order wax monthly' }),
          runPush({ scene, into: repoPrivate, title: 'audit the board racks', description: 'count the racks', auth: authAbsent }),
        ],
      }));

      then('both exit 2, held', () => {
        expect(result.pushes.map((push) => push.exitCode)).toEqual([2, 2]);
      });
    });

    when('[t1] the gate opens; push to the public repo with no --promise', () => {
      const result = useThen('the gate opens, then the push runs', () => {
        setGate({ scene, gate: 'allowed' });
        const push = runPush({ scene, title: 'retry lesson reminders', description: 'retry a failed reminder once' });
        return {
          push,
          createsPrivate: getCallNumbers({ scene, verb: 'issue create', repo: repoPrivate }),
          createsPublic: getCallNumbers({ scene, verb: 'issue create', repo: TARGET }),
          recordFault: getOneRecord({ scene, title: 'audit the board racks' }),
        };
      });

      then('exit 2: the nudge, then the backlog: one delivered, one held with its fix', () => {
        expect(result.push.exitCode).toEqual(2);
        expect(result.push.stdout).toContain('🦫 hold up — this task goes to a public repo');
        expect(result.push.stdout).toContain('🌊 the backlog');
        expect(result.createsPrivate).toHaveLength(1);
        expect(result.createsPublic).toEqual([]);
        expect(result.recordFault.reason).toEqual('upstream:auth');
        expect(asStableOutput({ output: result.push.stdout })).toMatchSnapshot();
      });
    });
  });

  given('[case12] an --exid re-push inherits a body it did not pass (catalog #28)', () => {
    const scene = useBeforeAll(async () => {
      const scene = genJourneyScene({ prefix: 'radio-promise-journey-12-' });
      setVisibility({ scene, repo: TARGET, mode: 'PUBLIC' });
      setIssueState({ scene, exid: '5', state: 'QUEUED' });
      setGate({ scene, gate: 'blocked' });
      return scene;
    });

    when('[t0] a claim with a body is held at the shut gate', () => {
      const result = useThen('the push runs', () => ({
        push: runPush({ scene, exid: '5', status: 'CLAIMED', description: 'EARLIER-BODY-DETAIL' }),
      }));

      then('exit 2, held', () => {
        expect(result.push.exitCode).toEqual(2);
      });
    });

    when('[t1] the gate opens; push --exid 5 --status CLAIMED, no body', () => {
      const result = useThen('the push runs', () => {
        setGate({ scene, gate: 'allowed' });
        return {
          push: runPush({ scene, exid: '5', status: 'CLAIMED' }),
          edits: getCallNumbers({ scene, verb: 'issue edit' }),
        };
      });

      then('exit 2, and the nudge names the record path as text this push did not send', () => {
        expect(result.push.exitCode).toEqual(2);
        expect(result.push.stdout).toMatch(/this record carries a body from an earlier push, at \.behavior\/\.radio\/record\.[0-9a-f]{16}\.json/);
        expect(result.push.stdout).toContain('to send status alone: re-run the same command, as you ran it');
        expect(result.edits).toEqual([]);
        expect(asStableOutput({ output: result.push.stdout })).toMatchSnapshot();
      });
    });

    when('[t2] the same command, re-run as typed', () => {
      const result = useThen('the push runs', () => {
        const callsBefore = getCalls({ scene }).length;
        return {
          push: runPush({ scene, exid: '5', status: 'CLAIMED' }),
          bodies: getBodiesSent({ scene, verb: 'issue edit', after: callsBefore }),
          reads: getCallNumbers({ scene, verb: 'repo view', after: callsBefore }),
        };
      });

      then('exit 0, one edit with no earlier body in it, and no read', () => {
        expect(result.push.exitCode).toEqual(0);
        expect(result.bodies).toHaveLength(1);
        expect(result.bodies[0]).not.toContain('EARLIER-BODY-DETAIL');
        expect(result.reads).toEqual([]);
        expect(asStableOutput({ output: result.push.stdout })).toMatchSnapshot();
      });
    });
  });

  given('[case13] the printed command round-trips byte for byte (stub: PUBLIC)', () => {
    const body = `it's $HOME and \`tick\` and "quotes"\nsecond line`;
    const scene = useBeforeAll(async () => {
      const scene = genJourneyScene({ prefix: 'radio-promise-journey-13-' });
      setVisibility({ scene, repo: TARGET, mode: 'PUBLIC' });
      return scene;
    });

    // one push, shared by [t1] (which reads the nudge) and [t2] (which runs its printed line)
    const nudged = useThen('the push with no --promise runs', () => ({
      push: runPush({ scene, title: 'quote probe', description: body }),
    }));

    when('[t1] push a body with a quote, a dollar, a backtick, and a newline, no --promise', () => {
      then('exit 2, and the nudge holds the body quoted for a shell', () => {
        expect(nudged.push.exitCode).toEqual(2);
        expect(nudged.push.stdout).toContain(`'it'\\''s $HOME and `);
        expect(asStableOutput({ output: nudged.push.stdout })).toMatchSnapshot();
      });
    });

    when('[t2] run the printed command through bash, as typed', () => {
      const result = useThen('the printed line runs', () => {
        const push = runSkill({ scene, skill: 'radio.task.push', line: asLineFromNudge({ text: nudged.push.stdout }) });
        return { push, bodies: getBodiesSent({ scene, verb: 'issue create' }) };
      });

      then('exit 0, one create, and the body on the wire equals the original, byte for byte', () => {
        expect(result.push.exitCode).toEqual(0);
        expect(result.bodies).toHaveLength(1);
        expect(result.bodies[0]?.endsWith(body)).toEqual(true);
      });
    });
  });

  given('[case14] a text and status push is nudged, then a status-only re-run (catalog #34)', () => {
    const scene = useBeforeAll(async () => {
      const scene = genJourneyScene({ prefix: 'radio-promise-journey-14-' });
      setVisibility({ scene, repo: TARGET, mode: 'PUBLIC' });
      setIssueState({ scene, exid: '5', state: 'CLAIMED' });
      return scene;
    });

    when('[t1] push --exid 5 --status DELIVERED --description <text>, no --promise', () => {
      const result = useThen('the push runs', () => ({
        push: runPush({ scene, exid: '5', status: 'DELIVERED', description: 'DROPPED-TEXT-DETAIL' }),
        record: getOneRecord({ scene, title: null, exid: '5' }),
      }));

      then('exit 2, and the record is DROPPED', () => {
        expect(result.push.exitCode).toEqual(2);
        expect(result.record.recordStatus).toEqual('DROPPED');
        expect(asStableOutput({ output: result.push.stdout })).toMatchSnapshot();
      });
    });

    when('[t2] push --exid 5 --status DELIVERED', () => {
      const result = useThen('the push runs', () => {
        const callsBefore = getCalls({ scene }).length;
        return {
          push: runPush({ scene, exid: '5', status: 'DELIVERED' }),
          bodies: getBodiesSent({ scene, verb: 'issue edit', after: callsBefore }),
          reads: getCallNumbers({ scene, verb: 'repo view', after: callsBefore }),
        };
      });

      then('exit 0, no nudge, and one edit with no dropped text in it', () => {
        expect(result.push.exitCode).toEqual(0);
        expect(result.push.stdout).not.toContain('hold up');
        expect(result.reads).toEqual([]);
        expect(result.bodies).toHaveLength(1);
        expect(result.bodies[0]).not.toContain('DROPPED-TEXT-DETAIL');
        expect(asStableOutput({ output: result.push.stdout })).toMatchSnapshot();
      });
    });
  });

  given('[case15] an unvouched record is held at a shut gate, then a no-text push carries a stray --promise (catalog #39)', () => {
    const scene = useBeforeAll(async () => {
      const scene = genJourneyScene({ prefix: 'radio-promise-journey-15-' });
      setVisibility({ scene, repo: TARGET, mode: 'PUBLIC' });
      setIssueState({ scene, exid: '5', state: 'QUEUED' });
      setGate({ scene, gate: 'blocked' });
      return scene;
    });

    when('[t0] a claim with a body is held at the shut gate', () => {
      const result = useThen('the push runs', () => ({
        push: runPush({ scene, exid: '5', status: 'CLAIMED', description: 'EARLIER-BODY-DETAIL' }),
      }));

      then('exit 2, held', () => {
        expect(result.push.exitCode).toEqual(2);
      });
    });

    when('[t1] the gate opens; push --exid 5 --status CLAIMED --promise <promise>', () => {
      const result = useThen('the push runs', () => {
        setGate({ scene, gate: 'allowed' });
        return {
          push: runPush({ scene, exid: '5', status: 'CLAIMED', promise: PROMISE }),
          edits: getCallNumbers({ scene, verb: 'issue edit' }),
        };
      });

      then('exit 2, no request, and the nudge says a --promise here cannot vouch the body', () => {
        expect(result.push.exitCode).toEqual(2);
        expect(result.edits).toEqual([]);
        expect(result.push.stdout).toMatch(/this record carries a body from an earlier push, at \.behavior\/\.radio\/record\./);
        expect(result.push.stdout).toContain('a --promise here cannot vouch it');
        expect(getLastLine({ text: result.push.stdout })).toContain('--description @stdin');
        expect(getLastLine({ text: result.push.stdout }).match(/--promise/g)).toHaveLength(1);
        expect(asStableOutput({ output: result.push.stdout })).toMatchSnapshot();
      });
    });

    when('[t2] the same command, re-run as typed', () => {
      const result = useThen('the push runs', () => {
        const callsBefore = getCalls({ scene }).length;
        return {
          push: runPush({ scene, exid: '5', status: 'CLAIMED', promise: PROMISE }),
          bodies: getBodiesSent({ scene, verb: 'issue edit', after: callsBefore }),
        };
      });

      then('exit 0, one edit for the status, and no earlier body in it', () => {
        expect(result.push.exitCode).toEqual(0);
        expect(result.bodies).toHaveLength(1);
        expect(result.bodies[0]).not.toContain('EARLIER-BODY-DETAIL');
        expect(asStableOutput({ output: result.push.stdout })).toMatchSnapshot();
      });
    });
  });

  given('[case16] a claim with text is nudged, with a deliver held behind it (catalog #33)', () => {
    const scene = useBeforeAll(async () => {
      const scene = genJourneyScene({ prefix: 'radio-promise-journey-16-' });
      setVisibility({ scene, repo: TARGET, mode: 'PUBLIC' });
      setIssueState({ scene, exid: '5', state: 'QUEUED' });
      setGate({ scene, gate: 'blocked' });
      return scene;
    });

    when('[t0] a claim with text, then a deliver, are held at the shut gate', () => {
      const result = useThen('two pushes run', () => ({
        pushes: [
          runPush({ scene, exid: '5', status: 'CLAIMED', description: 'claim note detail' }),
          runPush({ scene, exid: '5', status: 'DELIVERED' }),
        ],
      }));

      then('both exit 2, held', () => {
        expect(result.pushes.map((push) => push.exitCode)).toEqual([2, 2]);
      });
    });

    when('[t1] the gate opens; push the claim with text again, no --promise', () => {
      const result = useThen('the push runs', () => {
        setGate({ scene, gate: 'allowed' });
        return {
          push: runPush({ scene, exid: '5', status: 'CLAIMED', description: 'claim note detail' }),
          edits: getCallNumbers({ scene, verb: 'issue edit' }),
          closes: getCallNumbers({ scene, verb: 'issue close' }),
        };
      });

      then('exit 2, and the nudge names the update that waits and the deliver-needs-claim warn', () => {
        expect(result.push.exitCode).toEqual(2);
        expect(result.push.stdout).toContain('1 update waits behind it on #5');
        expect(result.push.stdout).toContain('its deliver needs this claim first');
        expect(result.push.stdout).toContain(
          'a re-run sends that deliver first, and it is refused; push the deliver again once the claim lands',
        );
        expect(result.edits).toEqual([]);
        expect(result.closes).toEqual([]);
        expect(asStableOutput({ output: result.push.stdout })).toMatchSnapshot();
      });
    });

    when('[t2] the status-only re-run the nudge printed: push --exid 5 --status CLAIMED', () => {
      const result = useThen('the push runs, then the queue is read', () => {
        const callsBefore = getCalls({ scene }).length;
        const push = runPush({ scene, exid: '5', status: 'CLAIMED' });
        return {
          push,
          queue: runQueue({ scene, args: ['get'] }),
          bodies: getBodiesSent({ scene, verb: 'issue edit', after: callsBefore }),
          closes: getCallNumbers({ scene, verb: 'issue close', after: callsBefore }),
        };
      });

      then('exit 0, the claim lands with no dropped text; the deliver, sent first as the oldest, is refused in plain sight', () => {
        expect(result.push.exitCode).toEqual(0);
        expect(result.push.stdout).not.toContain('hold up');
        expect(result.bodies.join('\n')).not.toContain('claim note detail');
        // the backlog sends oldest first, so the deliver meets an unclaimed issue: refused, named,
        // never stranded unseen (catalog #33), as a deliver behind a `queue del`-dropped claim is
        expect(result.push.stdout).toContain('claim #5 (updated)');
        expect(result.push.stdout).toContain('cannot deliver unclaimed task');
        expect(result.closes).toEqual([]);
        expect(result.queue.stdout).toContain('naught held');
        expect(asStableOutput({ output: result.push.stdout })).toMatchSnapshot();
        expect(asStableOutput({ output: result.queue.stdout })).toMatchSnapshot();
      });
    });
  });

  given('[case17] a held public record is scrubbed, then vouched (the drained-record recovery)', () => {
    const scene = useBeforeAll(async () => {
      const scene = genJourneyScene({ prefix: 'radio-promise-journey-17-' });
      setVisibility({ scene, repo: TARGET, mode: 'PUBLIC' });
      setGate({ scene, gate: 'blocked' });
      return scene;
    });

    when('[t0] a public push is held at the shut gate', () => {
      const result = useThen('the push runs', () => ({
        push: runPush({ scene, title: 'coach notes', description: 'SECRET-DETAIL in the raw note' }),
      }));

      then('exit 2, held', () => {
        expect(result.push.exitCode).toEqual(2);
      });
    });

    when('[t1] queue set --uuid <key> --description @stdin, with the scrubbed body', () => {
      const result = useThen('the amend runs', () => {
        setGate({ scene, gate: 'allowed' });
        const key = getOneRecord({ scene, title: 'coach notes' }).key;
        return {
          set: runQueue({ scene, args: ['set', '--uuid', key, '--description', '@stdin'], stdin: 'a scrubbed coach note\n' }),
        };
      });

      then('exit 0, and the body is amended', () => {
        expect(result.set.exitCode).toEqual(0);
        expect(result.set.stdout).toContain('description: amended');
        expect(asStableOutput({ output: result.set.stdout })).toMatchSnapshot();
      });
    });

    when('[t2] queue drain --promise task-to-public-repo-is-anonymized', () => {
      const result = useThen('the drain runs', () => ({
        drain: runQueue({ scene, args: ['drain', '--promise', PROMISE] }),
        bodies: getBodiesSent({ scene, verb: 'issue create' }),
      }));

      then('exit 0, one create, and its body is the scrubbed text, not the original', () => {
        expect(result.drain.exitCode).toEqual(0);
        expect(result.bodies).toHaveLength(1);
        expect(result.bodies[0]).toContain('a scrubbed coach note');
        expect(result.bodies[0]).not.toContain('SECRET-DETAIL');
        expect(asStableOutput({ output: result.drain.stdout })).toMatchSnapshot();
      });
    });
  });

  given('[case18] a nudged push is re-run with a scrubbed title (stub: PUBLIC)', () => {
    const scene = useBeforeAll(async () => {
      const scene = genJourneyScene({ prefix: 'radio-promise-journey-18-' });
      setVisibility({ scene, repo: TARGET, mode: 'PUBLIC' });
      return scene;
    });

    when('[t1] push a title that names a private repo, no --promise', () => {
      const result = useThen('the push runs', () => ({
        push: runPush({
          scene,
          title: 'retry lesson reminders from svc-lessons',
          description: 'retry a failed reminder once',
        }),
      }));

      then('exit 2, the nudge is shown, and naught is sent', () => {
        expect(result.push.exitCode).toEqual(2);
        expect(result.push.stdout).toContain('🦫 hold up');
        expect(getCallNumbers({ scene, verb: 'issue create' })).toEqual([]);
      });
    });

    when('[t2] push the scrubbed title with --promise', () => {
      const result = useThen('the push runs, then the queue is read', () => {
        const push = runPush({
          scene,
          title: 'retry lesson reminders',
          description: 'retry a failed reminder once',
          promise: PROMISE,
        });
        const queue = runQueue({ scene, args: ['get'] });
        return {
          push,
          queue,
          creates: getCallNumbers({ scene, verb: 'issue create' }),
          records: getRecords({ scene }),
        };
      });

      then('exit 0, and exactly one issue was created', () => {
        expect(result.push.exitCode).toEqual(0);
        expect(result.creates).toHaveLength(1);
      });

      then('the scrubbed push lands on a new key, and the first stays DROPPED, never held', () => {
        const scrubbed = getOneRecord({ scene, title: 'retry lesson reminders' });
        const first = getOneRecord({
          scene,
          title: 'retry lesson reminders from svc-lessons',
        });
        expect(result.records).toHaveLength(2);
        expect(scrubbed.key).not.toEqual(first.key);
        expect(scrubbed.recordStatus).toEqual('DELIVERED');
        expect(first.recordStatus).toEqual('DROPPED');
        expect(result.queue.stdout).toContain('naught held');
        expect(asStableOutput({ output: result.push.stdout })).toMatchSnapshot();
      });
    });
  });

  given('[case19] a held public record is dropped by queue del, the third recovery move (catalog #43)', () => {
    const scene = useBeforeAll(async () => {
      const scene = genJourneyScene({ prefix: 'radio-promise-journey-19-' });
      setVisibility({ scene, repo: TARGET, mode: 'PUBLIC' });
      setGate({ scene, gate: 'blocked' });
      return scene;
    });

    when('[t0] a public push is held at the shut gate', () => {
      const result = useThen('the push runs', () => ({
        push: runPush({ scene, title: 'wetsuit count', description: 'SECRET-DETAIL in the raw note' }),
      }));

      then('exit 2, held', () => {
        expect(result.push.exitCode).toEqual(2);
      });
    });

    when('[t1] the gate opens, and a plain drain meets the unvouched record', () => {
      const result = useThen('the drain runs', () => {
        setGate({ scene, gate: 'allowed' });
        return { drain: runQueue({ scene, args: ['drain'] }) };
      });

      then('exit 2, held for a promise, and the held row names queue del', () => {
        expect(result.drain.exitCode).toEqual(2);
        expect(result.drain.stdout).toContain('public-repo:unpromised');
        expect(result.drain.stdout).toContain('rhx radio.task.queue del --uuid');
      });
    });

    when('[t2] queue del --uuid <key> --why, then a drain', () => {
      const result = useThen('the drop runs, then the drain', () => {
        const key = getOneRecord({ scene, title: 'wetsuit count' }).key;
        const del = runQueue({ scene, args: ['del', '--uuid', key, '--why', 'text not safe to publish'] });
        const drain = runQueue({ scene, args: ['drain'] });
        const queue = runQueue({ scene, args: ['get'] });
        return {
          del,
          drain,
          queue,
          creates: getCallNumbers({ scene, verb: 'issue create' }),
          record: getOneRecord({ scene, title: 'wetsuit count' }),
        };
      });

      then('the drop exits 0, and the record is DROPPED on disk', () => {
        expect(result.del.exitCode).toEqual(0);
        expect(result.record.recordStatus).toEqual('DROPPED');
        expect(asStableOutput({ output: result.del.stdout })).toMatchSnapshot();
      });

      then('the drain sends naught, and the queue holds naught', () => {
        expect(result.drain.exitCode).toEqual(0);
        expect(result.creates).toEqual([]);
        expect(result.queue.stdout).toContain('naught held');
      });
    });
  });

  given('[case20] a new task with its body piped via --description @stdin into a public repo (catalog #45)', () => {
    const body = 'add a\nswell legend\n';
    const scene = useBeforeAll(async () => {
      const scene = genJourneyScene({ prefix: 'radio-promise-journey-20-' });
      setVisibility({ scene, repo: TARGET, mode: 'PUBLIC' });
      return scene;
    });

    // one push, shared by [t0] (which reads the nudge) and [t1] (which runs its printed line)
    const nudged = useThen('the push with no --promise runs', () => ({
      push: runPush({ scene, title: 'swell legend', description: '@stdin', stdin: body }),
      creates: getCallNumbers({ scene, verb: 'issue create' }),
    }));

    when('[t0] push --description @stdin with a body, no --promise', () => {
      then('exit 2, no create, and the nudge asks to re-pipe the checked body, with its record path', () => {
        expect(nudged.push.exitCode).toEqual(2);
        expect(nudged.creates).toEqual([]);
        expect(nudged.push.stdout).toContain('re-pipe the checked body into the command below');
        expect(nudged.push.stdout).toContain('the body this push piped: .behavior/.radio/record.');
        expect(nudged.push.stdout).toContain('run the command below with the body piped in');
        expect(getLastLine({ text: nudged.push.stdout })).toContain('--description @stdin');
        expect(getLastLine({ text: nudged.push.stdout })).toContain(`--promise ${PROMISE}`);
        expect(asStableOutput({ output: nudged.push.stdout })).toMatchSnapshot();
      });
    });

    when('[t1] the printed command, with the body piped in again', () => {
      const result = useThen('the printed line runs with stdin', () => {
        const callsBefore = getCalls({ scene }).length;
        const push = runSkill({
          scene,
          skill: 'radio.task.push',
          line: asLineFromNudge({ text: nudged.push.stdout }),
          stdin: body,
        });
        return {
          push,
          creates: getCallNumbers({ scene, verb: 'issue create', after: callsBefore }),
          bodies: getBodiesSent({ scene, verb: 'issue create', after: callsBefore }),
        };
      });

      then('exit 0, exactly one create, and it carries the piped body', () => {
        expect(result.push.exitCode).toEqual(0);
        expect(result.creates).toHaveLength(1);
        expect(result.bodies[0]).toContain('add a\nswell legend');
      });
    });
  });
});
