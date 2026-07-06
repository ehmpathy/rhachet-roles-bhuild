import * as fs from 'fs/promises';
import { ConstraintError } from 'helpful-errors';
import type { IsoDateStamp } from 'iso-time';
import * as os from 'os';
import * as path from 'path';
import { getError, given, then, useBeforeAll, when } from 'test-fns';

import { daoRadioTaskViaOsFileops } from '@src/access/daos/daoRadioTask';
import type { ContextGitRepo } from '@src/domain.objects/RadioContext';
import { RadioTask } from '@src/domain.objects/RadioTask';
import { RadioTaskRepo } from '@src/domain.objects/RadioTaskRepo';
import { RadioTaskStatus } from '@src/domain.objects/RadioTaskStatus';

import { cliRadioTaskPull } from './radioTaskPull';

/**
 * .what = contract-boundary tests for the radio.task.pull CLI
 * .why  = proves the caller-faced output a human sees — the positive --help
 *         contract and every --auth failure (the wish's "key is not set" +
 *         two-path guidance, etc) — renders correctly at the CLI boundary,
 *         snapshotted so reviewers vibecheck the exact text without execution
 * .note = these invoke the built CLI contract (cliRadioTaskPull) and cross the
 *         real shell boundary via shx, so they live in the integration tier.
 *         (the repo's acceptance tier targets a deployed/local server via
 *         `--against local|cloud`; this is a serverless roles package, so the
 *         integration runner is the right home for a real-i/o contract test.)
 *         pull and push both compose getOneRadioContextFromCliArgs →
 *         getGithubTokenByAuthArg, so these journeys cover the shared auth
 *         contract. auth fails fast before any gh i/o, so no network is touched.
 *         jest sets JEST_WORKER_ID, so isTestEnv is true — as-human is forbidden
 *         and via-keyrack would nudge one-path, exactly as in ci.
 *         a gh.issues *success* would be live gh data (non-deterministic) + a
 *         secret token, so the deterministic positive success contract is a real
 *         os.fileops pull (case7): a seeded local task read back off the real
 *         filesystem and rendered through the same output path a human sees.
 *         (--help, case6, is the deterministic positive *usage* contract.)
 */
describe('radio.task.pull.integration — CLI contract', () => {
  // invoke the CLI contract with injected argv + env, capture any thrown error
  const runPull = async (input: {
    auth: string;
    env?: NodeJS.ProcessEnv;
  }): Promise<Error> => {
    const argvBefore = process.argv;
    const envBefore = process.env;
    process.argv = [
      'node',
      '--via',
      'gh.issues',
      '--from',
      'ehmpathy/example',
      '--list',
      '--auth',
      input.auth,
    ];
    process.env = { ...envBefore, ...(input.env ?? {}) };
    try {
      return await getError(cliRadioTaskPull());
    } finally {
      process.argv = argvBefore;
      process.env = envBefore;
    }
  };

  // invoke the CLI contract with --help, capture the stdout it prints
  // (--help calls process.exit(0), so stub exit to a sentinel and catch it)
  const runHelp = async (): Promise<string> => {
    const argvBefore = process.argv;
    const lines: string[] = [];
    const logSpy = jest
      .spyOn(console, 'log')
      .mockImplementation((...args: unknown[]) => {
        lines.push(args.map((a) => String(a)).join(' '));
      });
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation((() => {
      throw new Error('__exit__');
    }) as unknown as typeof process.exit);
    process.argv = ['node', '--help'];
    try {
      await getError(cliRadioTaskPull());
      return lines.join('\n');
    } finally {
      process.argv = argvBefore;
      logSpy.mockRestore();
      exitSpy.mockRestore();
    }
  };

  // invoke the CLI contract in list mode against os.fileops, capture stdout
  // (list mode returns normally — no process.exit — so only console.log is spied)
  const runListViaOsFileops = async (input: {
    repo: RadioTaskRepo;
  }): Promise<string> => {
    const argvBefore = process.argv;
    const lines: string[] = [];
    const logSpy = jest
      .spyOn(console, 'log')
      .mockImplementation((...args: unknown[]) => {
        lines.push(args.map((a) => String(a)).join(' '));
      });
    process.argv = [
      'node',
      '--via',
      'os.fileops',
      '--from',
      `${input.repo.owner}/${input.repo.name}`,
      '--list',
    ];
    try {
      await cliRadioTaskPull();
      return lines.join('\n');
    } finally {
      process.argv = argvBefore;
      logSpy.mockRestore();
    }
  };

  given('[case1] --auth as-robot:env(MY_TOKEN) with the var unset', () => {
    when('[t0] the pull skill runs', () => {
      then(
        'fails with a ConstraintError that names the var + fix',
        async () => {
          const error = await runPull({ auth: 'as-robot:env(MY_TOKEN)' });
          expect(error).toBeInstanceOf(ConstraintError);
          expect(error.message).toContain('MY_TOKEN');
          expect(error.message).toContain('not set');
          expect(error.message).toMatchSnapshot();
        },
      );
    });
  });

  given('[case2] --auth as-human inside the test environment', () => {
    when('[t0] the pull skill runs', () => {
      then(
        'fails with a ConstraintError that names the robot alternatives',
        async () => {
          const error = await runPull({ auth: 'as-human' });
          expect(error).toBeInstanceOf(ConstraintError);
          expect(error.message).toContain('forbidden in test');
          expect(error.message).toContain('as-robot:env');
          expect(error.message).toContain('as-robot:shx');
          expect(error.message).toMatchSnapshot();
        },
      );
    });
  });

  given('[case3] --auth as-robot:shx(command) that exits non-zero', () => {
    when('[t0] the pull skill runs the real shell command', () => {
      then(
        'fails with a ConstraintError that wraps the shell failure',
        async () => {
          const error = await runPull({ auth: 'as-robot:shx(exit 1)' });
          expect(error).toBeInstanceOf(ConstraintError);
          expect(error.message).toContain('command failed');
          expect(error.message).toContain('check the command runs');
          expect(error.message).toMatchSnapshot();
        },
      );
    });
  });

  given('[case4] --auth as-robot:shx(command) that prints no output', () => {
    when('[t0] the pull skill runs the real shell command', () => {
      then(
        'fails with a ConstraintError that names the empty output',
        async () => {
          const error = await runPull({ auth: 'as-robot:shx(printf "")' });
          expect(error).toBeInstanceOf(ConstraintError);
          expect(error.message).toContain('no output');
          expect(error.message).toMatchSnapshot();
        },
      );
    });
  });

  given('[case5] --auth with an unrecognized mode', () => {
    when('[t0] the pull skill runs', () => {
      then(
        'fails with a ConstraintError that lists every supported mode',
        async () => {
          const error = await runPull({ auth: 'some-unknown-mode' });
          expect(error).toBeInstanceOf(ConstraintError);
          expect(error.message).toContain('unrecognized --auth mode');
          expect(error.message).toContain('as-robot:via-keyrack');
          expect(error.message).toContain('as-robot:shx');
          expect(error.message).toContain('as-robot:env');
          expect(error.message).toContain('as-human');
          expect(error.message).toMatchSnapshot();
        },
      );
    });
  });

  given('[case6] --help (the positive contract output)', () => {
    when('[t0] the pull skill runs', () => {
      then('prints the usage + options help text', async () => {
        const stdout = await runHelp();
        expect(stdout).toContain('radio.task.pull --help');
        expect(stdout).toContain('--via');
        expect(stdout).toContain('--auth');
        expect(stdout).toMatchSnapshot();
      });
    });
  });

  given(
    '[case7] --via os.fileops --list with a seeded local task (the positive success contract)',
    () => {
      // a unique repo per run isolates the fixture; the repo name never appears
      // in the rendered list output, so the snapshot stays deterministic
      const repo = new RadioTaskRepo({
        owner: 'test-owner',
        name: `test-repo-cli-pull-${Date.now()}`,
      });
      const radioDir = path.join(
        os.homedir(),
        'git',
        '.radio',
        repo.owner,
        repo.name,
      );
      const ctx: ContextGitRepo = { git: { repo } };

      // seed exactly one task — os.fileops get.all reads dir order (unordered),
      // so a single task guarantees a deterministic one-line list snapshot
      useBeforeAll(async () => {
        const task = new RadioTask({
          exid: 'pull-cli-001',
          title: 'first cli pull task',
          description: 'test',
          status: RadioTaskStatus.QUEUED,
          repo,
          pushedBy: 'tester',
          pushedAt: '2026-01-30' as IsoDateStamp,
          claimedBy: null,
          claimedAt: null,
          deliveredAt: null,
          branch: null,
        });
        return daoRadioTaskViaOsFileops.set.findsert({ task }, ctx);
      });

      afterAll(async () => {
        await fs.rm(radioDir, { recursive: true, force: true });
      });

      when('[t0] the pull skill runs the real filesystem read', () => {
        then('prints the rendered task list a human sees', async () => {
          const stdout = await runListViaOsFileops({ repo });
          expect(stdout).toContain('back in the river');
          expect(stdout).toContain('pull-cli-001');
          expect(stdout).toContain('first cli pull task');
          expect(stdout).toMatchSnapshot();
        });
      });
    },
  );

  // .note = the via-keyrack "key is not set" guidance (the wish's primary
  //   behavior) is authoritatively snapshotted at the layer that produces it —
  //   genAuthFromKeyrack.test case4 (two-path, with --auth as-human) + case6
  //   (one-path, test env) + genAuthFromKeyrack.integration case2 (real absent
  //   via a bogus key name). getGithubTokenByAuthArg's via-keyrack branch
  //   forwards that ConstraintError verbatim (no transform), so the CLI output
  //   is byte-identical to those locks. a CLI-level absent case is not
  //   deterministic: the CLI hardcodes a *present* key (EHMPATH_BEAVER_GITHUB_TOKEN,
  //   env prep), so via-keyrack(ehmpath) grants successfully, and a bogus owner
  //   yields a host-manifest MalfunctionError rather than the clean absent path.
});
