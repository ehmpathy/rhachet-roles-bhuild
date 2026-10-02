import { execSync, spawnSync } from 'child_process';
import fs from 'fs';
import { MalfunctionError } from 'helpful-errors';
import path from 'path';
import { given, then, useBeforeAll, useThen, when } from 'test-fns';

import {
  genConsumerRepo,
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
    },
    timeout: 30000,
  });

/**
 * .what = a consumer repo with the dispatcher role initialized, as a human sets it up
 * .why = `rhachet roles init` writes the onStop hook into `.claude/settings.json`; the test
 *        drives the hook from there, the same surface claude reads
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
 * .why = the hook is a contract claude runs from `.claude/settings.json`; the test reads it
 *        there rather than from the role's source, so a wire defect in init surfaces here
 */
const getOnStopHookCommandFromSettings = (input: {
  repoDir: string;
}): string => {
  const settings = JSON.parse(
    fs.readFileSync(
      path.join(input.repoDir, '.claude', 'settings.json'),
      'utf-8',
    ),
  ) as {
    hooks?: Record<string, { hooks?: { command: string }[] }[]>;
  };
  const command = (settings.hooks?.Stop ?? [])
    .flatMap((entry) => entry.hooks ?? [])
    .map((hook) => hook.command)
    .find((cmd) => cmd.includes('radioTaskHeld'));
  if (!command)
    throw new MalfunctionError(
      'dispatcher onStop hook absent from .claude/settings.json',
      {
        hint: 'rhachet roles init --role dispatcher must bind onBrain.onStop for radio.task.held',
        hooks: settings.hooks,
      },
    );
  return command;
};

/**
 * .what = mask the parts of a drain output that vary per run
 * .why = os.fileops exids, dates, and held-since stamps differ each run; the shape is what the snapshot pins
 */
const asStableOutput = (input: { output: string }): string =>
  sanitizeOutput(input.output)
    .replace(/#[\w-]+/g, '#<exid>')
    .replace(/exid: [\w-]+/g, 'exid: <exid>')
    .replace(/repo-\d+/g, 'repo-<run>')
    .replace(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}Z/g, '<stamp>')
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

    when('[t2] the clone stops (S2)', () => {
      const result = useThen('the stop hook runs', () =>
        runDispatcherSkill({
          ...scene,
          repoDir: scene.consumer.repoDir,
          skill: 'radio.task.held',
          args: '--when hook.onStop',
        }),
      );

      then('exit code is 0 — the stop is never blocked', () => {
        expect(result.exitCode).toBe(0);
      });

      then('it prints one systemMessage line with the count and the lift', () => {
        const line = result.stdout.split('\n').find((l) => l.startsWith('{'));
        expect(JSON.parse(line ?? '{}')).toEqual({
          systemMessage:
            '🦫 2 tasks held for the radio · lift: rhx radio.uses allow · next push delivers them',
        });
        expect(asStableOutput({ output: result.stdout })).toMatchSnapshot();
      });
    });

    when('[t2.1] the dispatcher onStop hook command runs, as claude runs it', () => {
      const result = useThen('the hook command runs', () => {
        const command = getOnStopHookCommandFromSettings({
          repoDir: scene.consumer.repoDir,
        });
        const stdout = execSync(command, {
          cwd: scene.consumer.repoDir,
          env: { ...process.env, HOME: scene.homeDir },
        })
          .toString()
          .trim(); // trimmed like [t2], so both stop-hook snaps read alike
        return { stdout };
      });

      then('its whole stdout is the json claude parses', () => {
        expect(JSON.parse(result.stdout)).toEqual({
          systemMessage:
            '🦫 2 tasks held for the radio · lift: rhx radio.uses allow · next push delivers them',
        });
        expect(result.stdout).toMatchSnapshot();
      });
    });

    when('[t3] a human lists the held tasks', () => {
      const result = useThen('the list runs', () =>
        runDispatcherSkill({
          ...scene,
          repoDir: scene.consumer.repoDir,
          skill: 'radio.task.held',
          args: '',
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
          skill: 'radio.task.held',
          args: '--when hook.onStop',
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
          skill: 'radio.task.held',
          args: '--when hook.onStop',
        }),
      );

      then('the skill prints naught beyond the rhachet frame banner, and exits 0', () => {
        expect(result.exitCode).toBe(0);
        expect(result.stdout).not.toContain('systemMessage');
        // the one line is rhachet's entry banner — the skill itself adds no byte
        expect(asStableOutput({ output: result.stdout })).toEqual(
          '🪨 run solid skill repo=bhuild/role=dispatcher/skill=radio.task.held',
        );
        expect(asStableOutput({ output: result.stdout })).toMatchSnapshot();
      });
    });

    when('[t5.0] a human lists the held tasks, the backlog drained', () => {
      const result = useThen('the list runs', () =>
        runDispatcherSkill({
          ...scene,
          repoDir: scene.consumer.repoDir,
          skill: 'radio.task.held',
          args: '',
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

    when('[t1] a human asks radio.task.held for help', () => {
      const result = useThen('help runs', () =>
        runDispatcherSkill({
          ...scene,
          repoDir: scene.consumer.repoDir,
          skill: 'radio.task.held',
          args: '--help',
        }),
      );

      then('it shows usage and options, exit 0, and reads no records', () => {
        expect(result.exitCode).toBe(0);
        expect(result.stdout).toContain('radio.task.held --when hook.onStop');
        expect(sanitizeOutput(result.stdout)).toMatchSnapshot();
      });
    });
  });
});
