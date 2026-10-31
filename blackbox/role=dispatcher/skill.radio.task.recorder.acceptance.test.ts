import { execSync, spawnSync } from 'child_process';
import fs from 'fs';
import { MalfunctionError } from 'helpful-errors';
import path from 'path';
import { genTempDir, given, then, useBeforeAll, useThen, when } from 'test-fns';

import { getTimestampFound } from '../../src/.test/utils/getTimestampFound';
import {
  genConsumerRepo,
  getRepoClaudeSettings,
  REPO_CLAUDE_SETTINGS_PATH,
  runRhachetSkill,
  runRolesInit,
  sanitizeOutput,
} from '../.test/infra';

/**
 * .what = acceptance tests for the radio.recorder
 * .why = a blocked push is held (never lost), the next push that gets through
 *        delivers the backlog, and at stop the clone reminds the human
 *
 * .note = all pushes go via os.fileops, so no credentials are needed
 */

/**
 * .what = invoke a dispatcher skill in the consumer repo, with an isolated home
 * .why = the radio.uses meters and the os.fileops store live under $HOME
 */
const runDispatcherSkill = (input: {
  repoDir: string;
  homeDir: string;
  skill: string;
  args: string;
  asHuman?: boolean;
  env?: Record<string, string | undefined>;
}) =>
  runRhachetSkill({
    repo: 'bhuild',
    role: 'dispatcher',
    skill: input.skill,
    args: input.args,
    repoDir: input.repoDir,
    env: {
      HOME: input.homeDir,
      ...(input.asHuman ? { __I_AM_HUMAN: 'true' } : {}),
      ...input.env,
    },
    timeout: 30000,
  });

/**
 * .mock = the gh cli, via a stub `gh` first on PATH
 * .why  = an update the robot may not write, and a human gh session, are states a test cannot
 *         provoke on demand against real github; the stub replays gh's own stderr text per
 *         target repo, and logs which token each call carried
 * .real = src/domain.operations/radio/record/setRadioTaskRecordsDrainedByPush.integration.test.ts
 *         [case7] (a peer file; not this file's [case7], which uses this stub) runs the 401 path
 *         against real github with a rejected token, and
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
if [ "$mode" = "access-update" ] && [ "$1 $2" = "issue edit" ]; then echo "GraphQL: Resource not accessible by integration (updateIssue)" >&2; exit 1; fi
if [ "$mode" = "access-update" ] && [ "$1 $2" = "issue close" ]; then echo "GraphQL: Resource not accessible by integration (updateIssue)" >&2; exit 1; fi
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

/**
 * .what = a consumer repo with the dispatcher role initialized, as a human sets it up
 * .why = `rhachet roles init` writes the onStop hook into the repo-level claude settings;
 *        the test drives the hook from there, the same surface claude reads
 */
const genConsumerRepoWithDispatcher = (input: {
  prefix: string;
  branchName: string;
}): { repoDir: string } => {
  const consumer = genConsumerRepo({ ...input, withClaudeDir: true });
  const init = runRolesInit({
    repo: 'bhuild',
    role: 'dispatcher',
    repoDir: consumer.repoDir,
  });
  if (init.exitCode !== 0)
    throw new MalfunctionError('roles init --role dispatcher failed', {
      exitCode: init.exitCode,
      stderr: init.stderr,
    });
  return consumer;
};

/**
 * .what = the dispatcher's onStop hook command, as written into the consumer's settings
 * .why = the hook is a contract claude runs from the repo-level claude settings; the test
 *        reads it there rather than from the role's source, so a wire defect in init
 *        surfaces here
 */
const getOnStopHookCommandFromSettings = (input: {
  repoDir: string;
}): string => {
  const settings = getRepoClaudeSettings({ repoDir: input.repoDir });
  const command = (settings.hooks?.Stop ?? [])
    .flatMap((entry) => entry.hooks ?? [])
    .map((hook) => hook.command)
    .find((cmd) => cmd.includes('radioTaskQueue'));
  if (!command)
    throw new MalfunctionError(
      `dispatcher onStop hook absent from ${REPO_CLAUDE_SETTINGS_PATH}`,
      {
        hint: 'rhachet roles init --role dispatcher must bind onBrain.onStop for radio.task.queue get',
        hooks: settings.hooks,
      },
    );
  return command;
};

/**
 * .what = mask the parts of a drain output that vary per run
 * .why = os.fileops exids, dates, and record uuids (a hash over the per-run repo) differ
 *        each run; the shape is what the snapshot pins
 */
const asStableOutput = (input: { output: string }): string =>
  sanitizeOutput(input.output)
    .replace(/#[\w-]+/g, '#<exid>')
    .replace(/exid: [\w-]+/g, 'exid: <exid>')
    .replace(/repo-\d+/g, 'repo-<run>')
    .replace(/\b[0-9a-f]{16}\b/g, '<uuid>')
    .replace(/\d{4}-\d{2}-\d{2}/g, '<date>');

describe('radio.task.push — the radio.recorder', () => {
  given('[case1] a clone on a branch bound to a route; the radio is shut', () => {
    const target = `recorder-acpt/repo-${Date.now()}`;
    const routeRel = '.behavior/v2026_09_29.demo';
    const scene = useBeforeAll(async () => {
      const consumer = genConsumerRepoWithDispatcher({
        prefix: 'radio-recorder-acpt-',
        branchName: 'feat/recorder',
      });
      const homeDir = path.join(consumer.repoDir, '.home');
      fs.mkdirSync(homeDir);
      const bindDir = path.join(consumer.repoDir, routeRel, '.bind');
      fs.mkdirSync(bindDir, { recursive: true });
      fs.writeFileSync(path.join(bindDir, 'feat.recorder.flag'), '');
      return { consumer, homeDir };
    });

    when('[t0] the clone pushes a task (C7)', () => {
      const result = useThen('the push runs', () =>
        runDispatcherSkill({
          ...scene,
          repoDir: scene.consumer.repoDir,
          skill: 'radio.task.push',
          args: `--via os.fileops --into ${target} --title "fix flaky test" --description "it flakes"`,
        }),
      );

      then('exit code is 2 — held, not delivered', () => {
        expect(result.exitCode).toBe(2);
      });

      then('the output says held, with the lift', () => {
        expect(result.stdout).toContain('🦫 held for the radio');
        expect(result.stdout).toContain('lift it (human): rhx radio.uses allow');
        expect(asStableOutput({ output: result.stdout })).toMatchSnapshot();
      });

      then('the record is in the route .radio/', () => {
        const dir = path.join(scene.consumer.repoDir, routeRel, '.radio');
        expect(fs.readdirSync(dir).filter((f) => f.startsWith('record.'))).toHaveLength(1);
      });
    });

    when('[t1] the clone re-pushes the same task, then pushes a second (C11, C10)', () => {
      const result = useThen('both pushes run', () => {
        runDispatcherSkill({
          ...scene,
          repoDir: scene.consumer.repoDir,
          skill: 'radio.task.push',
          args: `--via os.fileops --into ${target} --title "fix flaky test" --description "it flakes"`,
        });
        return runDispatcherSkill({
          ...scene,
          repoDir: scene.consumer.repoDir,
          skill: 'radio.task.push',
          args: `--via os.fileops --into ${target} --title "guard absent sponsor" --description "it crashes"`,
        });
      });

      then('the backlog reads 2 — the repeat was not doubled', () => {
        expect(result.stdout).toContain('backlog = 2 await the radio');
      });
    });

    when('[t2.1] the dispatcher onStop hook command runs, as claude runs it (S2)', () => {
      const result = useThen('the hook command runs', () => {
        const command = getOnStopHookCommandFromSettings({
          repoDir: scene.consumer.repoDir,
        });
        const stdout = execSync(command, {
          cwd: scene.consumer.repoDir,
          env: { ...process.env, HOME: scene.homeDir },
        })
          .toString()
          .trim(); // trimmed, so the snap holds only the json claude parses
        return { stdout };
      });

      then('its whole stdout is the json claude parses', () => {
        expect(JSON.parse(result.stdout)).toEqual({
          systemMessage:
            '🦫 2 tasks held for the radio · 2 at a gate · lift: rhx radio.uses allow · next push delivers them',
        });
        expect(result.stdout).not.toContain('deprecated');
        expect(getOnStopHookCommandFromSettings({ repoDir: scene.consumer.repoDir })).toContain(
          'cli.radioTaskQueue()',
        );
        expect(result.stdout).toMatchSnapshot();
      });
    });

    when('[t3] a human lists the held tasks', () => {
      const result = useThen('the list runs', () =>
        runDispatcherSkill({
          ...scene,
          repoDir: scene.consumer.repoDir,
          skill: 'radio.task.queue',
          args: 'get',
        }),
      );

      then('it lists both held tasks', () => {
        expect(result.stdout).toContain('fix flaky test');
        expect(result.stdout).toContain('guard absent sponsor');
        expect(asStableOutput({ output: result.stdout })).toMatchSnapshot();
      });
    });

    when('[t3.1] the human opens the radio, then the clone stops before any push (S3)', () => {
      const result = useThen('allow, then the stop hook runs', () => {
        runDispatcherSkill({
          ...scene,
          repoDir: scene.consumer.repoDir,
          skill: 'radio.uses',
          args: 'allow',
          asHuman: true,
        });
        return runDispatcherSkill({
          ...scene,
          repoDir: scene.consumer.repoDir,
          skill: 'radio.task.queue',
          args: 'get --when hook.onStop',
        });
      });

      then('exit code is 0 — the stop is never blocked', () => {
        expect(result.exitCode).toBe(0);
      });

      then('it prints one line: both still held, the radio open, no lift', () => {
        const line = result.stdout.split('\n').find((l) => l.startsWith('{'));
        const message: string = JSON.parse(line ?? '{}').systemMessage ?? '';
        expect(message).toEqual(
          '🦫 2 tasks held, the radio is open · next push delivers them',
        );
        expect(asStableOutput({ output: result.stdout })).toMatchSnapshot();
      });
    });

    when('[t4] the clone pushes a third task through the open radio (C4)', () => {
      const result = useThen('the push runs', () => {
        return runDispatcherSkill({
          ...scene,
          repoDir: scene.consumer.repoDir,
          skill: 'radio.task.push',
          args: `--via os.fileops --into ${target} --title "retry race" --description "it races"`,
        });
      });

      then('exit code is 0', () => {
        expect(result.exitCode).toBe(0);
      });

      then('the backlog drains first, oldest first, then the new task', () => {
        const output = result.stdout;
        expect(output).toContain('🦫 back in the river! the backlog is delivered');
        expect(output.indexOf('fix flaky test')).toBeLessThan(
          output.indexOf('guard absent sponsor'),
        );
        expect(output).toContain('backlog = 0');
        expect(asStableOutput({ output })).toMatchSnapshot();
      });

      then('the target holds three tasks — none lost, none doubled', () => {
        const store = path.join(scene.homeDir, 'git', '.radio', ...target.split('/'));
        const tasks = fs.readdirSync(store).filter((f) => f.endsWith('._.md'));
        expect(tasks).toHaveLength(3);
      });
    });

    when('[t5] the clone stops again (S1)', () => {
      const result = useThen('the stop hook runs', () =>
        runDispatcherSkill({
          ...scene,
          repoDir: scene.consumer.repoDir,
          skill: 'radio.task.queue',
          args: 'get --when hook.onStop',
        }),
      );

      then('the skill prints naught beyond the rhachet frame banner, and exits 0', () => {
        expect(result.exitCode).toBe(0);
        expect(result.stdout).not.toContain('systemMessage');
        // the one line is rhachet's entry banner — the skill itself adds no byte
        expect(asStableOutput({ output: result.stdout })).toEqual(
          '🪨 run solid skill repo=bhuild/role=dispatcher/skill=radio.task.queue',
        );
        expect(asStableOutput({ output: result.stdout })).toMatchSnapshot();
      });
    });

    when('[t5.0] a human lists the held tasks, the backlog drained', () => {
      const result = useThen('the list runs', () =>
        runDispatcherSkill({
          ...scene,
          repoDir: scene.consumer.repoDir,
          skill: 'radio.task.queue',
          args: 'get',
        }),
      );

      then('it reads naught held, and exits 0', () => {
        expect(result.exitCode).toBe(0);
        expect(result.stdout).toContain('🦫 naught held for the radio');
        expect(result.stdout).not.toContain('fix flaky test');
        expect(asStableOutput({ output: result.stdout })).toMatchSnapshot();
      });
    });

    when('[t5.1] the clone pushes a fresh task, the radio open, naught held (C1)', () => {
      const result = useThen('the push runs', () =>
        runDispatcherSkill({
          ...scene,
          repoDir: scene.consumer.repoDir,
          skill: 'radio.task.push',
          args: `--via os.fileops --into ${target} --title "trim stale log" --description "it grows"`,
        }),
      );

      then('exit code is 0, and naught else is delivered with it', () => {
        expect(result.exitCode).toBe(0);
        expect(result.stdout).not.toContain('back in the river');
        expect(asStableOutput({ output: result.stdout })).toMatchSnapshot();
      });

      then('its record is on disk, DELIVERED, with the exid upstream holds it under', () => {
        const dir = path.join(scene.consumer.repoDir, routeRel, '.radio');
        const records = fs
          .readdirSync(dir)
          .filter((f) => f.startsWith('record.'))
          .map((f) => JSON.parse(fs.readFileSync(path.join(dir, f), 'utf-8')));
        const record = records.find((r) => r.title === 'trim stale log');
        expect(record?.recordStatus).toEqual('DELIVERED');
        expect(record?.reason).toBeNull();
        expect(record?.deliveredExid?.length).toBeGreaterThan(0);
        expect(result.stdout).toContain(`exid: ${record?.deliveredExid}`);
      });
    });

    when('[t5.2] the clone re-pushes the task just delivered (C3, case=4)', () => {
      const result = useThen('the re-push runs', () =>
        runDispatcherSkill({
          ...scene,
          repoDir: scene.consumer.repoDir,
          skill: 'radio.task.push',
          args: `--via os.fileops --into ${target} --title "trim stale log" --description "it grows"`,
        }),
      );

      then('exit code is 0, and it reads already delivered', () => {
        expect(result.exitCode).toBe(0);
        expect(result.stdout).toContain('🦫 already delivered');
        expect(asStableOutput({ output: result.stdout })).toMatchSnapshot();
      });

      then('the target still holds four tasks — the re-push filed no second one', () => {
        const store = path.join(scene.homeDir, 'git', '.radio', ...target.split('/'));
        const tasks = fs.readdirSync(store).filter((f) => f.endsWith('._.md'));
        expect(tasks).toHaveLength(4);
      });
    });

    when('[t6] the clone claims a task upstream does not hold (U3)', () => {
      const result = useThen('the claim runs', () =>
        runDispatcherSkill({
          ...scene,
          repoDir: scene.consumer.repoDir,
          skill: 'radio.task.push',
          args: `--via os.fileops --into ${target} --exid absent-999 --status CLAIMED`,
        }),
      );

      then('exit code is 2, and the record reads refused, closed', () => {
        expect(result.exitCode).toBe(2);
        expect(result.stdout).toContain('🦫 refused upstream');
        expect(result.stdout).toContain('closed, never retried');
        expect(asStableOutput({ output: result.stdout })).toMatchSnapshot();
      });

      then('no file the cli wrote holds a time of day — records held, delivered, refused, and the tasks sent', () => {
        // every record the cli wrote in this scene, in every state it settled
        const dirRecords = path.join(scene.consumer.repoDir, routeRel, '.radio');
        const records = fs
          .readdirSync(dirRecords)
          .filter((f) => f.startsWith('record.'))
          .map((f) => fs.readFileSync(path.join(dirRecords, f), 'utf-8'));
        expect(records.map((content) => JSON.parse(content).recordStatus).sort()).toEqual([
          'DELIVERED',
          'DELIVERED',
          'DELIVERED',
          'DELIVERED',
          'REFUSED',
        ]);

        // every task the os.fileops channel filed upstream
        const store = path.join(scene.homeDir, 'git', '.radio', ...target.split('/'));
        const tasks = fs
          .readdirSync(store)
          .filter((f) => f.endsWith('._.md'))
          .map((f) => fs.readFileSync(path.join(store, f), 'utf-8'));
        expect(tasks).toHaveLength(4);

        // a datestamp is fine; a time of day is the drift the gate forbids
        [...records, ...tasks].forEach((content) => {
          expect(getTimestampFound({ content })).toEqual(null);
          expect(content).not.toContain('heldAt');
          expect(content).not.toContain('settledAt');
        });
      });
    });

    when('[t7] the clone re-pushes the refused claim (case=2 [t4.2]: a re-push re-queues a REFUSED record)', () => {
      const result = useThen('the re-push runs', () =>
        runDispatcherSkill({
          ...scene,
          repoDir: scene.consumer.repoDir,
          skill: 'radio.task.push',
          args: `--via os.fileops --into ${target} --exid absent-999 --status CLAIMED`,
        }),
      );

      then('the refusal did not bury it: the re-push sends it again, and upstream refuses it again, exit 2', () => {
        expect(result.exitCode).toBe(2);
        expect(result.stdout).toContain('🦫 refused upstream');
        expect(asStableOutput({ output: result.stdout })).toMatchSnapshot();
      });

      then('the one record for the claim is REFUSED once more; no second record is minted', () => {
        const dirRecords = path.join(scene.consumer.repoDir, routeRel, '.radio');
        const statuses = fs
          .readdirSync(dirRecords)
          .filter((f) => f.startsWith('record.'))
          .map((f) => JSON.parse(fs.readFileSync(path.join(dirRecords, f), 'utf-8')).recordStatus);
        expect(statuses.filter((status) => status === 'REFUSED')).toHaveLength(1);
        expect(statuses).toHaveLength(5);
      });
    });
  });

  given('[case3] a clone claims an extant task while the radio is shut (U2, case=7)', () => {
    const target = `recorder-acpt-claim/repo-${Date.now()}`;
    const routeRel = '.behavior/v2026_09_29.claim';
    const scene = useBeforeAll(async () => {
      const consumer = genConsumerRepo({
        prefix: 'radio-recorder-acpt-claim-',
        branchName: 'feat/recorder-claim',
      });
      const homeDir = path.join(consumer.repoDir, '.home');
      fs.mkdirSync(homeDir);
      const bindDir = path.join(consumer.repoDir, routeRel, '.bind');
      fs.mkdirSync(bindDir, { recursive: true });
      fs.writeFileSync(path.join(bindDir, 'feat.recorder-claim.flag'), '');
      return { consumer, homeDir };
    });

    when('[t0] the clone claims task 412', () => {
      const result = useThen('the claim runs', () =>
        runDispatcherSkill({
          ...scene,
          repoDir: scene.consumer.repoDir,
          skill: 'radio.task.push',
          args: `--via os.fileops --into ${target} --exid 412 --status CLAIMED`,
        }),
      );

      then('exit code is 2 — held, not sent', () => {
        expect(result.exitCode).toBe(2);
      });

      then('the output says held, names the claim, and the lift', () => {
        expect(result.stdout).toContain('🦫 held for the radio');
        expect(result.stdout).toContain('412');
        expect(result.stdout).toContain('radio.uses:blocked');
        expect(result.stdout).toContain('lift it (human): rhx radio.uses allow');
        expect(asStableOutput({ output: result.stdout })).toMatchSnapshot();
      });

      then('the claim is transcribed first: one update record, QUEUED, with the block as its reason', () => {
        const dir = path.join(scene.consumer.repoDir, routeRel, '.radio');
        const files = fs.readdirSync(dir).filter((f) => f.startsWith('record.'));
        expect(files).toHaveLength(1);
        const record = JSON.parse(fs.readFileSync(path.join(dir, files[0]!), 'utf-8'));
        expect(record.kind).toEqual('update');
        expect(record.exid).toEqual('412');
        expect(record.status).toEqual('CLAIMED');
        expect(record.recordStatus).toEqual('QUEUED');
        expect(record.reason).toContain('radio.uses:blocked');
      });

      then('naught is sent upstream — the target store is untouched', () => {
        const store = path.join(scene.homeDir, 'git', '.radio', ...target.split('/'));
        expect(fs.existsSync(store)).toBe(false);
      });
    });
  });

  given('[case4] a blocked push pipes its body via --description @stdin', () => {
    // .note = transcribe-first moved the stdin read ahead of the gate; before it, a blocked
    //         push never read its body, so a held record would have carried no description
    const target = `recorder-acpt-stdin/repo-${Date.now()}`;
    const routeRel = '.behavior/v2026_09_29.stdin';
    const scene = useBeforeAll(async () => {
      const consumer = genConsumerRepo({
        prefix: 'radio-recorder-acpt-stdin-',
        branchName: 'feat/recorder-stdin',
      });
      const homeDir = path.join(consumer.repoDir, '.home');
      fs.mkdirSync(homeDir);
      const bindDir = path.join(consumer.repoDir, routeRel, '.bind');
      fs.mkdirSync(bindDir, { recursive: true });
      fs.writeFileSync(path.join(bindDir, 'feat.recorder-stdin.flag'), '');
      return { consumer, homeDir };
    });

    when('[t0] the clone pipes a multi-line body into a push at a shut gate', () => {
      const result = useThen('the push runs', () => {
        const run = spawnSync(
          'npx',
          [
            'rhachet',
            'run',
            '--repo',
            'bhuild',
            '--role',
            'dispatcher',
            '--skill',
            'radio.task.push',
            '--',
            '--via',
            'os.fileops',
            '--into',
            target,
            '--title',
            'piped task',
            '--description',
            '@stdin',
          ],
          {
            cwd: scene.consumer.repoDir,
            env: { ...process.env, HOME: scene.homeDir },
            input: 'line one of the body\nline two of the body\n',
            timeout: 90000,
          },
        );

        // fail loud on a killed spawn; a timeout otherwise reads as a bare `status: null`
        if (run.error || run.status === null)
          throw new MalfunctionError('piped radio.task.push did not exit', {
            error: run.error?.message ?? null,
            signal: run.signal,
            stderr: run.stderr?.toString() ?? null,
          });
        return { status: run.status, stdout: run.stdout.toString().trim() };
      });

      then('exit code is 2 — held, not delivered', () => {
        expect(result.status).toBe(2);
        expect(result.stdout).toContain('🦫 held for the radio');
        expect(asStableOutput({ output: result.stdout })).toMatchSnapshot();
      });

      then('the held record carries the piped body, verbatim', () => {
        const dir = path.join(scene.consumer.repoDir, routeRel, '.radio');
        const files = fs.readdirSync(dir).filter((f) => f.startsWith('record.'));
        expect(files).toHaveLength(1);
        const record = JSON.parse(fs.readFileSync(path.join(dir, files[0]!), 'utf-8'));
        expect(record.title).toEqual('piped task');
        expect(record.description).toContain('line one of the body');
        expect(record.description).toContain('line two of the body');
        expect(record.recordStatus).toEqual('QUEUED');
      });
    });
  });

  given('[case5] two clones run one journey, seconds apart: a legacy record, a push held unbound, a route bind, a push held bound, then the radio opens (case=1, case=3, case=4)', () => {
    // one target name for both runs, so the record keys (a hash of the push identity) match
    const target = `recorder-acpt-rerun/repo-${Date.now()}`;
    const routeRel = '.behavior/v2026_10_07.rerun';
    const [owner, name] = target.split('/');

    /**
     * .what = run the whole journey in a fresh consumer repo, through the cli alone
     * .why = a rerun on another clock must write the same bytes; the legacy record must drain
     *        first and shed its clock; the drain must cross the unbound dir and the route dir
     */
    const asRun = (input: { slug: string }) => {
      const consumer = genConsumerRepo({
        prefix: `radio-recorder-acpt-rerun-${input.slug}-`,
        branchName: 'feat/recorder-rerun',
      });
      const homeDir = path.join(consumer.repoDir, '.home');
      fs.mkdirSync(homeDir);
      const push = (args: string) =>
        runDispatcherSkill({ repoDir: consumer.repoDir, homeDir, skill: 'radio.task.push', args });

      // a prior version wrote this record: it holds a clock field, and took seq 1
      const dirUnbound = path.join(consumer.repoDir, '.behavior', '.radio');
      fs.mkdirSync(dirUnbound, { recursive: true });
      fs.writeFileSync(
        path.join(dirUnbound, 'record.legacy-a.json'),
        JSON.stringify(
          {
            key: 'legacy-a',
            kind: 'create',
            repo: { owner, name },
            via: 'os.fileops',
            auth: null,
            idem: null,
            title: 'book a lesson for bert',
            description: 'a sandpine surf lesson',
            exid: null,
            status: null,
            recordStatus: 'QUEUED',
            reason: 'radio.uses blocked',
            heldSeq: 1,
            deliveredExid: null,
            heldAt: '2026-01-01T00:00:00Z', // note: a pinned stamp; the gate exempts .ts files
            settledAt: null,
          },
          null,
          2,
        ),
      );

      // a push held while the branch is unbound, then one held after a route bind
      const heldUnbound = push(
        `--via os.fileops --into ${target} --title "rent a wetsuit" --description "size m"`,
      );
      const bindDir = path.join(consumer.repoDir, routeRel, '.bind');
      fs.mkdirSync(bindDir, { recursive: true });
      fs.writeFileSync(path.join(bindDir, 'feat.recorder-rerun.flag'), '');
      const heldBound = push(
        `--via os.fileops --into ${target} --title "post the swell forecast" --description "dawn patrol"`,
      );

      // the human opens the radio; the next push drains all that waits, oldest first
      runDispatcherSkill({
        repoDir: consumer.repoDir,
        homeDir,
        skill: 'radio.uses',
        args: 'allow',
        asHuman: true,
      });
      const drain = push(
        `--via os.fileops --into ${target} --title "remind bert of his lesson" --description "tomorrow"`,
      );

      // every record file, by path rel to the repo; os.fileops mints a random exid per run
      const records = [dirUnbound, path.join(consumer.repoDir, routeRel, '.radio')]
        .flatMap((dir) =>
          fs
            .readdirSync(dir)
            .filter((f) => f.startsWith('record.'))
            .map((f) => ({
              rel: path.relative(consumer.repoDir, path.join(dir, f)),
              content: fs
                .readFileSync(path.join(dir, f), 'utf-8')
                .replace(/"deliveredExid": "[^"]+"/, '"deliveredExid": "<exid>"'),
            })),
        )
        .sort((a, b) => JSON.parse(a.content).heldSeq - JSON.parse(b.content).heldSeq); // drain order; a key-hashed filename would reorder per run
      return { heldUnbound, heldBound, drain, records };
    };

    const runs = useBeforeAll(async () => {
      const first = asRun({ slug: 'a' });
      await new Promise((done) => setTimeout(done, 1100)); // past a second boundary: any clock field would differ
      const second = asRun({ slug: 'b' });
      return { first, second };
    });

    when('[t0] the first clone runs the journey', () => {
      then('both early pushes are held, exit 2', () => {
        expect(runs.first.heldUnbound.exitCode).toBe(2);
        expect(runs.first.heldBound.exitCode).toBe(2);
      });

      then('the drain delivers the legacy record first, then each held push in push order, then itself', () => {
        expect(runs.first.drain.exitCode).toBe(0);
        const order = [
          'book a lesson for bert',
          'rent a wetsuit',
          'post the swell forecast',
          'remind bert of his lesson',
        ].map((title) => runs.first.drain.stdout.indexOf(title));
        expect(order.every((at) => at >= 0)).toBe(true);
        expect([...order].sort((a, b) => a - b)).toEqual(order);
        expect(asStableOutput({ output: runs.first.drain.stdout })).toMatchSnapshot();
      });

      then('the records span both dirs, all DELIVERED, seq 1 to 4, and none holds a clock key', () => {
        const json = runs.first.records.map(({ rel, content }) => ({ rel, ...JSON.parse(content) }));
        expect(json.map((r) => r.rel.startsWith(routeRel))).toEqual([false, false, true, true]); // two unbound, two in the route
        expect(json.map((r) => r.recordStatus)).toEqual(['DELIVERED', 'DELIVERED', 'DELIVERED', 'DELIVERED']);
        expect(json.map((r) => r.heldSeq)).toEqual([1, 2, 3, 4]);
        expect(json.map((r) => r.title)).toEqual([
          'book a lesson for bert',
          'rent a wetsuit',
          'post the swell forecast',
          'remind bert of his lesson',
        ]);
        runs.first.records.forEach(({ content }) => {
          expect(content).not.toContain('heldAt');
          expect(content).not.toContain('settledAt');
          expect(getTimestampFound({ content })).toEqual(null);
        });
      });
    });

    when('[t1] a second clone runs the same journey, on a later clock', () => {
      then('it writes the same record files, byte for byte', () => {
        expect(runs.second.records).toEqual(runs.first.records);
      });

      then('the record bytes read as the snapshot pins them', () => {
        // the key hashes the target, whose name holds this run's id; the legacy key stays legible
        expect(
          runs.second.records
            .map(
              ({ rel, content }) =>
                `# ${rel.replace(/record\.[0-9a-f]{16}\.json/, 'record.<key>.json')}\n${content
                  .replace(/repo-\d+/g, 'repo-<run>')
                  .replace(/"key": "[0-9a-f]{16}"/, '"key": "<key>"')}`,
            )
            .join('\n'),
        ).toMatchSnapshot();
      });
    });
  });

  given('[case2] a record file on disk that is not valid json', () => {
    const scene = useBeforeAll(async () => {
      const consumer = genConsumerRepoWithDispatcher({
        prefix: 'radio-recorder-acpt-malformed-',
        branchName: 'feat/recorder-malformed',
      });
      const homeDir = path.join(consumer.repoDir, '.home');
      fs.mkdirSync(homeDir);
      const radioDir = path.join(consumer.repoDir, '.behavior', '.radio');
      fs.mkdirSync(radioDir, { recursive: true });
      fs.writeFileSync(path.join(radioDir, 'record.bad.json'), '{ not json');
      return { consumer, homeDir };
    });

    when('[t0] the dispatcher onStop hook command runs, as claude runs it', () => {
      const result = useThen('the hook command runs', () => {
        const command = getOnStopHookCommandFromSettings({
          repoDir: scene.consumer.repoDir,
        });
        const run = spawnSync(command, {
          shell: true,
          cwd: scene.consumer.repoDir,
          env: { ...process.env, HOME: scene.homeDir },
        });
        return {
          status: run.status,
          stdout: run.stdout.toString(),
          stderr: run.stderr.toString(),
        };
      });

      then('it fails loud, yet never with exit 2 — the stop is not blocked', () => {
        expect(result.status).not.toBe(0);
        expect(result.status).not.toBe(2);
      });

      then('stderr names the fault, the file, and the fix — whole, with no json block', () => {
        expect(result.stderr).toContain('radio task record could not be read');
        expect(result.stderr).toContain('record.bad.json');
        expect(result.stderr).toContain('└─ fix:');
        expect(result.stderr).not.toContain('{"');
        // snap the whole stream; mask the absolute dir, node's JSON.parse text (varies by node version),
        // and the stack frames (host paths + dist line numbers) — collapsed to one line that says a stack follows
        expect(result.stderr).toMatch(/^\s+at /m);
        const stderrStable = result.stderr
          .replace(/\S*\/record\.bad\.json/g, '<dir>/record.bad.json')
          .replace(/(├─ why:\s+).*/g, '$1<json parse fault>')
          .replace(/(^\s+at .*$\n?)+/m, '    at <stack>\n')
          .trim();
        expect(stderrStable).toMatchSnapshot();
      });

      then('stdout holds no systemMessage', () => {
        expect(result.stdout).not.toContain('systemMessage');
      });
    });

    when('[t1] a human asks radio.task.queue for help', () => {
      const result = useThen('help runs', () =>
        runDispatcherSkill({
          ...scene,
          repoDir: scene.consumer.repoDir,
          skill: 'radio.task.queue',
          args: '--help',
        }),
      );

      then('it shows usage and options, exit 0, and reads no records', () => {
        expect(result.exitCode).toBe(0);
        expect(result.stdout).toContain('get --when hook.onStop');
        expect(sanitizeOutput(result.stdout)).toMatchSnapshot();
      });
    });

    when('[t2] the clone pushes a first task, the bad record still on disk', () => {
      const target = `recorder-acpt-malformed/repo-${Date.now()}`;
      const result = useThen('the push runs', () =>
        runDispatcherSkill({
          ...scene,
          repoDir: scene.consumer.repoDir,
          skill: 'radio.task.push',
          args: `--via os.fileops --into ${target} --title "book-a-lesson reminder" --description "remind bert of his lesson"`,
        }),
      );

      then('the push is recorded first — held, never lost', () => {
        const dir = path.join(scene.consumer.repoDir, '.behavior', '.radio');
        const records = fs
          .readdirSync(dir)
          .filter((f) => f.startsWith('record.') && f !== 'record.bad.json')
          .map((f) => JSON.parse(fs.readFileSync(path.join(dir, f), 'utf-8')));
        expect(records).toHaveLength(1);
        expect(records[0].title).toEqual('book-a-lesson reminder');
        expect(records[0].recordStatus).toEqual('QUEUED');
      });

      then('then it fails loud on the bad record, as a malfunction, and names it', () => {
        expect(result.exitCode).toBe(1);
        expect(result.stderr).toContain('radio task record could not be read');
        expect(result.stderr).toContain('record.bad.json');
      });

      then('stderr first says the push is saved, so the caller repairs + re-pushes', () => {
        expect(result.stderr).toContain(
          '🦫 this push is saved, as QUEUED in .behavior/.radio/. fix the fault below',
        );
        // mask the absolute dir, node's JSON.parse text, and the stack, as [t0] does; and drop the
        // ansi color codes the rhachet wrapper paints on stderr
        const stderrStable = result.stderr
          // biome-ignore lint/suspicious/noControlCharactersInRegex: the escape byte is what an ansi code starts with
          .replace(/\u001b\[[0-9;]*m/g, '')
          .replace(/\S*\/record\.bad\.json/g, '<dir>/record.bad.json')
          .replace(/(├─ why:\s+).*/g, '$1<json parse fault>')
          .replace(/(^\s+at .*$\n?)+/m, '    at <stack>\n')
          .trim();
        expect(stderrStable).toMatchSnapshot();
      });
    });
  });

  given('[case6] a clone reads, drops, and drains the queue (#604, case=2, case=4, case=5)', () => {
    const target = `recorder-acpt-queue/repo-${Date.now()}`;
    const scene = useBeforeAll(async () => {
      const consumer = genConsumerRepoWithDispatcher({
        prefix: 'radio-queue-acpt-',
        branchName: 'feat/queue',
      });
      const homeDir = path.join(consumer.repoDir, '.home');
      fs.mkdirSync(homeDir);
      return { consumer, homeDir };
    });
    // the keys a clone reads off `queue get`, the contract, as each held record's row
    const keys = new Map<string, string>();
    const getOneKeyOf = (input: { title: string }): string => {
      const key = keys.get(input.title);
      if (!key)
        throw new MalfunctionError('no key read off `queue get` for title', {
          title: input.title,
          hint: 'the [t0] `queue get` must list this title before a later step asks for its key',
        });
      return key;
    };

    when('[t0] two pushes are held at the shut gate, then the clone reads the queue', () => {
      const result = useThen('the pushes and the read run', () => {
        const pushes = [
          { title: 'wetsuit inventory', description: 'count the 4/3s' },
          { title: 'old lesson reminder', description: 'moot now' },
        ].map((push) =>
          runDispatcherSkill({
            ...scene,
            repoDir: scene.consumer.repoDir,
            skill: 'radio.task.push',
            args: `--via os.fileops --into ${target} --title "${push.title}" --description "${push.description}"`,
          }),
        );
        const get = runDispatcherSkill({
          ...scene,
          repoDir: scene.consumer.repoDir,
          skill: 'radio.task.queue',
          args: 'get',
        });

        // read each uuid off its row: `<uuid> <title> → <repo>`
        for (const title of ['wetsuit inventory', 'old lesson reminder']) {
          const row = new RegExp(`([0-9a-f]{16}) ${title} →`).exec(get.stdout);
          if (row?.[1]) keys.set(title, row[1]);
        }
        return { pushes, get };
      });

      then('each push is held at the shut gate, exit 2', () => {
        expect(result.pushes.map((push) => push.exitCode)).toEqual([2, 2]);
      });

      then('it lists each record with its key, task, and reason, exit 0', () => {
        expect(result.get.exitCode).toBe(0);
        expect(getOneKeyOf({ title: 'wetsuit inventory' })).toMatch(/^[0-9a-f]{16}$/);
        expect(getOneKeyOf({ title: 'old lesson reminder' })).toMatch(/^[0-9a-f]{16}$/);
        expect(result.get.stdout).toContain('radio.uses:blocked');
        expect(asStableOutput({ output: result.get.stdout })).toMatchSnapshot();
      });
    });

    when('[t1] the clone drains while the gate is shut (case=4)', () => {
      const result = useThen('the drain runs', () =>
        runDispatcherSkill({
          ...scene,
          repoDir: scene.consumer.repoDir,
          skill: 'radio.task.queue',
          args: 'drain',
        }),
      );

      then('exit 2: naught is sent, and the output names the lift', () => {
        expect(result.exitCode).toBe(2);
        expect(result.stdout).toContain('lift it (human): rhx radio.uses allow');
        expect(result.stdout).toContain('backlog = 2 await the radio');
        expect(asStableOutput({ output: result.stdout })).toMatchSnapshot();
      });
    });

    when('[t2] the clone drops the moot record with a why (case=2)', () => {
      const result = useThen('the del runs', () =>
        runDispatcherSkill({
          ...scene,
          repoDir: scene.consumer.repoDir,
          skill: 'radio.task.queue',
          args: `del --uuid ${getOneKeyOf({ title: 'old lesson reminder' })} --why "superseded by #604"`,
        }),
      );

      then('exit 0; it names the why and where the body is kept', () => {
        expect(result.exitCode).toBe(0);
        expect(result.stdout).toContain('dropped from the radio, never sent');
        expect(result.stdout).toContain('why     = dropped: superseded by #604');
        expect(result.stdout).toContain('kept at = ');
        expect(asStableOutput({ output: result.stdout })).toMatchSnapshot();
      });
    });

    when('[t2.1] the clone amends the body of the held record (case=_ grid 3: set | held, --description)', () => {
      const result = useThen('the set runs', () =>
        runDispatcherSkill({
          ...scene,
          repoDir: scene.consumer.repoDir,
          skill: 'radio.task.queue',
          args: `set --uuid ${getOneKeyOf({ title: 'wetsuit inventory' })} --description "count the 4/3s and the 3/2s"`,
        }),
      );

      then('exit 0; it names the field changed and that naught was sent', () => {
        expect(result.exitCode).toBe(0);
        expect(result.stdout).toContain('amended the held record');
        expect(result.stdout).toContain('description: amended');
        expect(result.stdout).toContain('naught sent; its place in line is kept');
        expect(asStableOutput({ output: result.stdout })).toMatchSnapshot();
      });
    });

    when('[t2.2] the clone tries to retitle the held record (F5)', () => {
      const result = useThen('the set runs', () =>
        runDispatcherSkill({
          ...scene,
          repoDir: scene.consumer.repoDir,
          skill: 'radio.task.queue',
          args: `set --uuid ${getOneKeyOf({ title: 'wetsuit inventory' })} --title "wetsuit count"`,
        }),
      );

      then('exit 2: a title cannot be amended, and the fix is named', () => {
        expect(result.exitCode).toBe(2);
        expect(result.stderr).toContain('--title cannot be amended');
        expect(result.stderr).toContain('to retitle, run `rhx radio.task.queue del --uuid <uuid>` and push again');
        expect(asStableOutput({ output: result.stderr })).toMatchSnapshot();
      });
    });

    when('[t3] the clone drops it again', () => {
      const result = useThen('the del runs', () =>
        runDispatcherSkill({
          ...scene,
          repoDir: scene.consumer.repoDir,
          skill: 'radio.task.queue',
          args: `del --uuid ${getOneKeyOf({ title: 'old lesson reminder' })} --why "again"`,
        }),
      );

      then('exit 0: the drop converged, so a retry is a no-op that says so', () => {
        expect(result.exitCode).toBe(0);
        expect(result.stdout).toContain('already dropped, never sent; naught changed');
        expect(result.stdout).toContain('dropped: superseded by #604');
        expect(asStableOutput({ output: result.stdout })).toMatchSnapshot();
      });
    });

    when('[t4] the human opens the radio and the clone drains', () => {
      const result = useThen('allow, then drain', () => {
        const allow = runDispatcherSkill({
          ...scene,
          repoDir: scene.consumer.repoDir,
          skill: 'radio.uses',
          args: 'allow',
          asHuman: true,
        });
        const drain = runDispatcherSkill({
          ...scene,
          repoDir: scene.consumer.repoDir,
          skill: 'radio.task.queue',
          args: 'drain',
        });
        return { allow, drain };
      });

      then('the human opens the gate, exit 0', () => {
        expect(result.allow.exitCode).toBe(0);
      });

      then('exit 0: the held record delivers, the dropped one stays unsent', () => {
        expect(result.drain.exitCode).toBe(0);
        expect(result.drain.stdout).toContain('wetsuit inventory');
        expect(result.drain.stdout).not.toContain('old lesson reminder');
        expect(result.drain.stdout).toContain('backlog = 0');
        expect(asStableOutput({ output: result.drain.stdout })).toMatchSnapshot();
      });

      then('the amended body is the one that lands upstream ([t2.1])', () => {
        const dir = path.join(scene.homeDir, 'git', '.radio', ...target.split('/'));
        const bodies = fs
          .readdirSync(dir)
          .filter((name) => name.endsWith('._.md'))
          .map((name) => fs.readFileSync(path.join(dir, name), 'utf-8'));
        expect(bodies).toHaveLength(1);
        expect(bodies[0]).toContain('count the 4/3s and the 3/2s');
      });
    });

    when('[t5] the clone re-pushes the dropped task, as the del output promised', () => {
      const result = useThen('the re-push runs', () =>
        runDispatcherSkill({
          ...scene,
          repoDir: scene.consumer.repoDir,
          skill: 'radio.task.push',
          args: `--via os.fileops --into ${target} --title "old lesson reminder" --description "moot now"`,
        }),
      );

      then('exit 0: the drop did not bury it; the re-push queues it again and it delivers', () => {
        expect(result.exitCode).toBe(0);
        expect(result.stdout).toContain('old lesson reminder');
        expect(asStableOutput({ output: result.stdout })).toMatchSnapshot();
      });

      then('the dropped task now lands upstream beside the first', () => {
        const dir = path.join(scene.homeDir, 'git', '.radio', ...target.split('/'));
        const bodies = fs
          .readdirSync(dir)
          .filter((name) => name.endsWith('._.md'))
          .map((name) => fs.readFileSync(path.join(dir, name), 'utf-8'));
        expect(bodies).toHaveLength(2);
        expect(bodies.some((body) => body.includes('moot now'))).toBe(true);
      });
    });

    when('[t6] the clone reads, then drains, the queue it emptied (case=5, an empty queue)', () => {
      const result = useThen('get, then drain', () => {
        const get = runDispatcherSkill({
          ...scene,
          repoDir: scene.consumer.repoDir,
          skill: 'radio.task.queue',
          args: 'get',
        });
        const drain = runDispatcherSkill({
          ...scene,
          repoDir: scene.consumer.repoDir,
          skill: 'radio.task.queue',
          args: 'drain',
        });
        const stop = runDispatcherSkill({
          ...scene,
          repoDir: scene.consumer.repoDir,
          skill: 'radio.task.queue',
          args: 'get --when hook.onStop',
        });
        return { get, drain, stop };
      });

      then('the stop hook on the queue verb exits 0 and prints no systemMessage', () => {
        expect(result.stop.exitCode).toBe(0);
        expect(result.stop.stdout).not.toContain('systemMessage');
        expect(result.stop.stdout).not.toContain('held');
      });

      then('get exits 0 and reads naught held, with no rename notice', () => {
        expect(result.get.exitCode).toBe(0);
        expect(result.get.stdout).toContain('naught held for the radio');
        expect(result.get.stdout).not.toContain('deprecated');
        expect(asStableOutput({ output: result.get.stdout })).toMatchSnapshot();
      });

      then('drain exits 0 and reads naught held; naught is sent', () => {
        expect(result.drain.exitCode).toBe(0);
        expect(result.drain.stdout).toContain('naught held for the radio');
        expect(result.drain.stdout).not.toContain('drained');
        expect(asStableOutput({ output: result.drain.stdout })).toMatchSnapshot();
      });
    });
  });

  given('[case7] a drain crosses a fault through rhachet, via a stub gh (#511, #513, case=5, case=7)', () => {
    const authEnv = 'as-robot:env(RADIO_ACPT_JOURNEY_TOKEN)';
    const tokenStub = 'ghp_radioAcptJourneyTokenStub0000000';
    const scene = useBeforeAll(async () => {
      const consumer = genConsumerRepoWithDispatcher({
        prefix: 'radio-fault-acpt-',
        branchName: 'feat/fault',
      });
      const homeDir = path.join(consumer.repoDir, '.home');
      fs.mkdirSync(homeDir);
      const stubDir = genTempDir({ slug: 'radio-fault-acpt-stub-gh' });
      fs.writeFileSync(path.join(stubDir, 'gh'), STUB_GH, { mode: 0o755 });
      return { consumer, homeDir, stubDir };
    });

    /**
     * .what = the env each skill run in this case carries: the stub gh first on PATH, its log dir,
     *         and the token the env auth mode reads
     * .why = rhachet spreads this env onto the skill's process, so the stub stands in for gh there
     */
    const getEnvWithStub = (input: { asHumanSession: boolean }) => ({
      PATH: `${scene.stubDir}:${process.env.PATH}`,
      STUB_GH_DIR: scene.stubDir,
      RADIO_ACPT_JOURNEY_TOKEN: tokenStub,
      // an as-human run drops the test-env markers; the stub gh stands in for the human gh session
      ...(input.asHumanSession
        ? { NODE_ENV: undefined, JEST_WORKER_ID: undefined }
        : {}),
    });

    /**
     * .what = set how the stub gh answers for one target repo, and the org gate in the scene home
     */
    const setStubMode = (input: { repo: string; mode: 'ok' | 'access-update' }) =>
      fs.writeFileSync(
        path.join(scene.stubDir, `mode.${input.repo.replace('/', '_')}`),
        input.mode,
      );
    const setGate = (input: { gate: 'allowed' | 'blocked' }) => {
      const dirMeter = path.join(
        scene.homeDir,
        '.rhachet/storage/repo=bhuild/role=dispatcher/.meter',
      );
      fs.mkdirSync(dirMeter, { recursive: true });
      fs.writeFileSync(
        path.join(dirMeter, 'radio.uses.org.jsonc'),
        JSON.stringify({ orgs: { sandpine: input.gate } }),
      );
    };

    /**
     * .what = the gh calls the stub saw, each with the token it carried
     */
    const getStubCalls = (): string[] => {
      const file = path.join(scene.stubDir, 'calls.log');
      if (!fs.existsSync(file)) return [];
      return fs.readFileSync(file, 'utf8').split('\n').filter(Boolean);
    };

    /**
     * .what = each record on disk, by the shape a clone would read off its file
     */
    const getRecordsOnDisk = (): {
      key: string;
      exid: string | null;
      title: string | null;
      auth: string | null;
      recordStatus: string;
      reason: string | null;
    }[] => {
      const dir = path.join(scene.consumer.repoDir, '.behavior', '.radio');
      return fs
        .readdirSync(dir)
        .filter((name) => /^record\.[a-z0-9-]+\.json$/.test(name))
        .map((name) => JSON.parse(fs.readFileSync(path.join(dir, name), 'utf-8')));
    };
    const getOneRecordOnDisk = (input: { exid: string | null; title: string | null }) => {
      const record = getRecordsOnDisk().find(
        (one) => one.exid === input.exid && one.title === input.title,
      );
      if (!record)
        throw new MalfunctionError('no record on disk for this push', { ...input });
      return record;
    };

    when('[t0] two gh pushes are held at a shut gate, then the gate opens and the clone drains; the robot may not write the update', () => {
      const result = useThen('the pushes and the drain run', () => {
        setGate({ gate: 'blocked' });
        const pushes = [
          `--via gh.issues --into sandpine/svc-lessons --exid 599 --status DELIVERED --description "board rentals open friday" --auth "${authEnv}"`,
          `--via gh.issues --into sandpine/svc-rentals --title "wetsuit sizes" --description "count the 4/3s" --auth "${authEnv}"`,
        ].map((args) =>
          runDispatcherSkill({
            ...scene,
            repoDir: scene.consumer.repoDir,
            skill: 'radio.task.push',
            args,
            env: getEnvWithStub({ asHumanSession: false }),
          }),
        );
        const callsAfterPushes = getStubCalls().length;
        setGate({ gate: 'allowed' });
        setStubMode({ repo: 'sandpine/svc-lessons', mode: 'access-update' });
        setStubMode({ repo: 'sandpine/svc-rentals', mode: 'ok' });
        const drain = runDispatcherSkill({
          ...scene,
          repoDir: scene.consumer.repoDir,
          skill: 'radio.task.queue',
          args: 'drain',
          env: getEnvWithStub({ asHumanSession: false }),
        });
        return { pushes, callsAfterPushes, drain, calls: getStubCalls() };
      });

      then('each push is held at the shut gate, exit 2, and no gh call is made', () => {
        expect(result.pushes.map((push) => push.exitCode)).toEqual([2, 2]);
        expect(result.callsAfterPushes).toEqual(0);
      });

      then('the drain exits 2, since one record still waits', () => {
        expect(result.drain.exitCode).toEqual(2);
      });

      then('the update is set aside, named, with its fault and its fix', () => {
        expect(result.drain.stdout).toContain(
          'fault: GraphQL: Resource not accessible by integration (updateIssue)',
        );
        expect(result.drain.stdout).toContain('amend it: rhx radio.task.queue set');
        const update = getOneRecordOnDisk({ exid: '599', title: null });
        expect(update.recordStatus).toEqual('QUEUED');
        expect(update.reason).toEqual('upstream:access');
      });

      then('the create behind it still delivers (no head-of-line block)', () => {
        const create = getOneRecordOnDisk({ exid: null, title: 'wetsuit sizes' });
        expect(create.recordStatus).toEqual('DELIVERED');
      });

      then('every gh call carried the robot token', () => {
        expect(result.calls.length).toBeGreaterThan(0);
        expect(result.calls.every((call) => call.startsWith(`${tokenStub} `))).toEqual(true);
      });

      then('the stdout reads as a human sees it', () => {
        // the mask hides every exid in the snap, so pin the stub's fixed issue number by text
        expect(result.drain.stdout).toContain('deliver #599 → sandpine/svc-lessons');
        expect(asStableOutput({ output: result.drain.stdout })).toMatchSnapshot();
      });
    });

    when('[t1] the clone drains with a flag the verb does not read', () => {
      const result = useThen('the drain runs', () => {
        const callsBefore = getStubCalls().length;
        const update = getOneRecordOnDisk({ exid: '599', title: null });
        const drain = runDispatcherSkill({
          ...scene,
          repoDir: scene.consumer.repoDir,
          skill: 'radio.task.queue',
          args: `drain --uuid ${update.key} --auth as-human`,
          env: getEnvWithStub({ asHumanSession: true }),
        });
        return { drain, calls: getStubCalls().slice(callsBefore) };
      });

      then('exit 2: it refuses, names the flags drain reads, and sends naught', () => {
        expect(result.drain.exitCode).toEqual(2);
        expect(result.drain.stderr).toContain('drain does not read --uuid');
        expect(result.calls).toEqual([]);
        expect(asStableOutput({ output: result.drain.stderr })).toMatchSnapshot();
      });
    });

    when('[t2] the clone amends the set-aside update to as-human, then drains (#513, #603)', () => {
      const result = useThen('the set and the drain run', () => {
        const update = getOneRecordOnDisk({ exid: '599', title: null });
        const set = runDispatcherSkill({
          ...scene,
          repoDir: scene.consumer.repoDir,
          skill: 'radio.task.queue',
          args: `set --uuid ${update.key} --auth as-human`,
          env: getEnvWithStub({ asHumanSession: true }),
        });
        setStubMode({ repo: 'sandpine/svc-lessons', mode: 'ok' });
        const callsBefore = getStubCalls().length;
        const drain = runDispatcherSkill({
          ...scene,
          repoDir: scene.consumer.repoDir,
          skill: 'radio.task.queue',
          args: 'drain',
          env: getEnvWithStub({ asHumanSession: true }),
        });
        return {
          set,
          drain,
          calls: getStubCalls().slice(callsBefore),
          onDisk: getOneRecordOnDisk({ exid: '599', title: null }),
        };
      });

      then('the set exits 0 and names the auth change', () => {
        expect(result.set.exitCode).toEqual(0);
        expect(result.set.stdout).toContain(`auth: ${authEnv} → as-human`);
        expect(asStableOutput({ output: result.set.stdout })).toMatchSnapshot();
      });

      then('the drain exits 0: the queue is empty', () => {
        expect(result.drain.exitCode).toEqual(0);
        expect(asStableOutput({ output: result.drain.stdout })).toMatchSnapshot();
      });

      then('the update went out on the gh session, never the robot token', () => {
        expect(result.calls.length).toBeGreaterThan(0);
        expect(result.calls.every((call) => call.startsWith('<gh-session> '))).toEqual(true);
      });

      then('the record on disk is DELIVERED, with the as-human auth it was amended to', () => {
        expect(result.onDisk.recordStatus).toEqual('DELIVERED');
        expect(result.onDisk.auth).toEqual('as-human');
      });
    });
  });
});
