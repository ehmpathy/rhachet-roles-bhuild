import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { given, then, useBeforeAll, when } from 'test-fns';

import { genTestGitRepo } from '../.test/infra';

const SCRIPT_PATH = path.join(
  __dirname,
  '../../src/domain.roles/behaver/skills/reflect.on.reviews.self.sh',
);

/**
 * .what = one transcript event as a jsonl line
 * .why = the corpus is a stream of these; the acceptance test synthesizes them
 */
const asEventLine = (input: {
  toolUses?: { name: string; input: Record<string, unknown> }[];
  text?: string;
}): string =>
  JSON.stringify({
    type: 'assistant',
    message: {
      role: 'assistant',
      content: [
        ...(input.text ? [{ type: 'text', text: input.text }] : []),
        ...(input.toolUses ?? []).map((toolUse) => ({
          type: 'tool_use',
          name: toolUse.name,
          input: toolUse.input,
        })),
      ],
    },
  });

/**
 * .what = a bash tool_use that runs a route.stone.set boundary command
 */
const asBoundaryLine = (input: { command: string }): string =>
  asEventLine({
    toolUses: [{ name: 'Bash', input: { command: input.command } }],
  });

/**
 * .what = mask the two temp-path leaves in the wrote-section of captured stdout
 * .why = the treestruct summary is deterministic and snapshot-worthy, but the
 *        report/json leaves under `└─ wrote` carry a temp-dir path — replace the
 *        volatile path with a stable token so the wrote-section stays visible in
 *        the snapshot (structure intact) yet deterministic
 */
const asStableStdout = (stdout: string): string =>
  stdout
    .split('\n')
    .map((line) => line.replace(/(─ (?:report|json) += ).*$/, '$1<path>'))
    .join('\n');

/**
 * .what = extract the clean helpful-error block from a failed run's output
 * .why = a thrown ConstraintError surfaces via node as a clean `✋ ClassName:
 *        message + {json}` block followed by a stack trace whose frames carry
 *        absolute machine paths (flaky). the clean block is deterministic and
 *        snapshot-worthy; the stack frames are not — so keep the block, from its
 *        `✋` line up to the json close brace, and drop the volatile stack
 */
const asStableError = (output: string): string => {
  const lines = output.split('\n');
  const start = lines.findIndex((line) => line.includes('✋'));
  if (start === -1) return output;
  const end = lines.findIndex((line, index) => index >= start && line === '}');
  return lines.slice(start, end === -1 ? undefined : end + 1).join('\n');
};

/**
 * .what = extract the clean cli-arg validation block from a failed run's output
 * .why = getCliArgs prints a `⛈️ error: input invalid` tree on a bad flag then
 *        exits non-zero (it does not throw), so this surfaces only via the
 *        subprocess. the block is deterministic (no paths) — keep it from its
 *        `⛈️` line through the last tree row and drop any subprocess tail noise
 */
const asStableValidationError = (output: string): string => {
  const lines = output.split('\n');
  const start = lines.findIndex((line) => line.includes('⛈️'));
  if (start === -1) return output;
  // the block is the header line plus tree rows; a tree row starts with spaces
  // then a branch glyph. stop at the first line that is neither the header nor a
  // tree row, so a stray node/npm notice at the tail cannot leak into the snap
  const block = [lines[start]!];
  for (let i = start + 1; i < lines.length; i++) {
    const line = lines[i]!;
    if (!line.startsWith('   ├─') && !line.startsWith('   └─')) break;
    block.push(line);
  }
  return block.join('\n');
};

const ROUTE = '.behavior/acceptance-route';

/**
 * .what = a transcript with one promised self-review that did a real edit
 */
const TRANSCRIPT = [
  asBoundaryLine({
    command: `rhx route.stone.set --as passed --stone 1.vision --route ${ROUTE}`,
  }),
  asEventLine({ text: 'i found a real gap', toolUses: [] }),
  asEventLine({ toolUses: [{ name: 'Edit', input: {} }] }),
  asBoundaryLine({
    command: `rhx route.stone.set --as promised --stone 1.vision --route ${ROUTE} --that has-questioned-assumptions`,
  }),
].join('\n');

/**
 * .what = a clean scaffold: a git repo cwd + a claude-projects corpus dir
 * .why = the skill dispatches via `bash ...sh` → `node -e "import(...)"`, so the
 *        temp cwd needs node_modules resolvable and CLAUDE_PROJECTS_DIR points
 *        at a synthetic corpus — the exact seams a real caller uses
 */
const genScene = (input: {
  corpus: string | null;
}): { repoDir: string; corpusDir: string; cleanup: () => void } => {
  const { repoDir, cleanup } = genTestGitRepo({ prefix: 'reflect-accept-' });

  // symlink node_modules so `import('rhachet-roles-bhuild')` resolves from cwd
  fs.symlinkSync(
    path.join(process.cwd(), 'node_modules'),
    path.join(repoDir, 'node_modules'),
  );

  // scaffold a corpus dir with one project transcript, when content is given
  const corpusDir = path.join(repoDir, '.corpus');
  const projectDir = path.join(corpusDir, 'proj-accept');
  fs.mkdirSync(projectDir, { recursive: true });
  if (input.corpus !== null)
    fs.writeFileSync(path.join(projectDir, 'session.jsonl'), input.corpus);

  return { repoDir, corpusDir, cleanup };
};

/**
 * .what = run reflect.on.reviews.self.sh directly, as a caller would
 */
const runReflectSkill = (input: {
  repoDir: string;
  corpusDir: string;
  args: string;
}): { stdout: string; exitCode: number } => {
  try {
    const stdout = execSync(`bash "${SCRIPT_PATH}" ${input.args}`, {
      cwd: input.repoDir,
      encoding: 'utf-8',
      env: { ...process.env, CLAUDE_PROJECTS_DIR: input.corpusDir },
    });
    return { stdout: stdout.trim(), exitCode: 0 };
  } catch (error: unknown) {
    const execError = error as {
      stdout?: string;
      stderr?: string;
      status?: number;
    };
    const output = [
      (execError.stdout ?? '').toString().trim(),
      (execError.stderr ?? '').toString().trim(),
    ]
      .filter(Boolean)
      .join('\n');
    return { stdout: output, exitCode: execError.status ?? 1 };
  }
};

describe('reflect.on.reviews.self (acceptance)', () => {
  given('[case1] a corpus with one behavior self-review', () => {
    const scene = useBeforeAll(async () => genScene({ corpus: TRANSCRIPT }));
    afterAll(() => scene.cleanup());

    when('[t0] the skill is dispatched in plan mode with an --into path', () => {
      const reportPath = () => path.join(scene.repoDir, 'report.md');
      const result = useBeforeAll(async () =>
        runReflectSkill({
          repoDir: scene.repoDir,
          corpusDir: scene.corpusDir,
          args: `--mode plan --into "${reportPath()}"`,
        }),
      );

      then('it exits cleanly', () => {
        expect(result.exitCode).toBe(0);
      });

      then('it emits the treestruct summary to stdout', () => {
        expect(result.stdout).toContain('🦫 heres the reflection');
        expect(result.stdout).toContain('🌲 reflect.on.reviews.self --mode plan');
        expect(result.stdout).toContain('has-questioned-assumptions');
      });

      then('the stdout summary matches its snapshot', () => {
        expect(asStableStdout(result.stdout)).toMatchSnapshot();
      });

      then('it writes the markdown report', () => {
        const report = fs.readFileSync(reportPath(), 'utf-8');
        expect(report).toContain('# reflection: self-reviews');
        expect(report).toContain('has-questioned-assumptions');
      });

      then('the markdown report matches its snapshot', () => {
        const report = fs.readFileSync(reportPath(), 'utf-8');
        expect(report).toMatchSnapshot();
      });

      then('it writes the machine-readable json aggregate', () => {
        const jsonPath = reportPath().replace(/\.md$/, '.v1.json');
        const parsed = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
        expect(parsed.reviewsTotal).toBe(1);
      });

      then('the json aggregate matches its snapshot', () => {
        // snapshot the RAW file bytes (not a re-parsed object) so the diff shows
        // exactly what a caller opens: the real `JSON.stringify(..., null, 2)`
        // output — strict json with no comma after the last member, consistent
        // with the error blocks above (which are also raw strings). a re-parsed
        // object would instead render via jest pretty-format, which adds a comma
        // after the last member and diverges from the true artifact. the aggregate
        // is a pure per-slug rollup with no timestamps or temp paths, so it is
        // deterministic for a fixed corpus. full shape still surfaces schema drift.
        const jsonPath = reportPath().replace(/\.md$/, '.v1.json');
        const raw = fs.readFileSync(jsonPath, 'utf-8');
        expect(raw).toMatchSnapshot();
      });
    });
  });

  given('[case2] a corpus with no behavior routes', () => {
    const scene = useBeforeAll(async () =>
      genScene({
        corpus: asEventLine({ text: 'just chatter, no route.stone.set' }),
      }),
    );
    afterAll(() => scene.cleanup());

    when('[t0] the skill is dispatched with no filters', () => {
      const result = useBeforeAll(async () =>
        runReflectSkill({
          repoDir: scene.repoDir,
          corpusDir: scene.corpusDir,
          args: `--into "${path.join(scene.repoDir, 'r.md')}"`,
        }),
      );

      then('it fails loud rather than an empty success', () => {
        expect(result.exitCode).not.toBe(0);
        expect(result.stdout).toContain(
          'no init.behavior self-review windows',
        );
      });

      then('the no-route error block matches its snapshot', () => {
        expect(asStableError(result.stdout)).toMatchSnapshot();
      });
    });
  });

  given('[case3] a caller who asks for --help', () => {
    const scene = useBeforeAll(async () => genScene({ corpus: TRANSCRIPT }));
    afterAll(() => scene.cleanup());

    when('[t0] the skill is dispatched with --help', () => {
      const result = useBeforeAll(async () =>
        runReflectSkill({
          repoDir: scene.repoDir,
          corpusDir: scene.corpusDir,
          args: '--help',
        }),
      );

      then('it exits cleanly and prints the usage guide', () => {
        expect(result.exitCode).toBe(0);
        expect(result.stdout).toContain('usage:');
        expect(result.stdout).toContain('--mode');
        expect(result.stdout).toContain('--brain');
      });

      then('the usage guide matches its snapshot', () => {
        expect(result.stdout).toMatchSnapshot();
      });
    });
  });

  given('[case4] a filter that matches no transcript', () => {
    const scene = useBeforeAll(async () => genScene({ corpus: TRANSCRIPT }));
    afterAll(() => scene.cleanup());

    when('[t0] the skill is dispatched with a project filter that misses', () => {
      const result = useBeforeAll(async () =>
        runReflectSkill({
          repoDir: scene.repoDir,
          corpusDir: scene.corpusDir,
          args: `--project no-such-project --into "${path.join(scene.repoDir, 'r.md')}"`,
        }),
      );

      then('it fails loud with the filter-miss constraint', () => {
        expect(result.exitCode).not.toBe(0);
        expect(result.stdout).toContain(
          'no self-review windows matched the given filters',
        );
      });

      then('the filter-miss error block matches its snapshot', () => {
        expect(asStableError(result.stdout)).toMatchSnapshot();
      });
    });
  });

  // .why = apply mode is acceptance-tested only on its *error* path (below), not
  //        its success path, by deliberate scope split. an apply-mode SUCCESS
  //        journey against the real cheap brain yields a NON-deterministic verdict
  //        (the brain's genuine-gain/noop label varies run to run), so it cannot be
  //        snapshotted, and a live-brain call in every acceptance run adds cost +
  //        flakiness. the success path is instead proven where it can be
  //        deterministic or real without those costs:
  //          - real-brain correctness: imagineReviewSelfVerdict.integration.test.ts
  //            (calls the real fireworks brain, no mock)
  //          - full CLI path for apply success: the CLI integration [case1 t2]
  //            (deterministic injected judge → snapshot-stable verdict rollup)
  //          - shell → CLI dispatch: every acceptance case here (plan success,
  //            errors, help) crosses the same bash → node → cli.reflectSelfreviews
  //            seam, so the shell entrypoint itself is proven end-to-end
  //        the only seam left is shell + real-brain together, which adds no new
  //        untested code path — just a costly, flaky, unsnapshottable re-proof.
  given('[case5] apply mode with an unreachable brain', () => {
    const scene = useBeforeAll(async () => genScene({ corpus: TRANSCRIPT }));
    afterAll(() => scene.cleanup());

    when('[t0] the skill is dispatched in apply mode with a bad brain', () => {
      const result = useBeforeAll(async () =>
        runReflectSkill({
          repoDir: scene.repoDir,
          corpusDir: scene.corpusDir,
          args: '--mode apply --brain nonesuch/does-not-exist',
        }),
      );

      then('it fails loud rather than a raw stack trace', () => {
        expect(result.exitCode).not.toBe(0);
        expect(result.stdout).toContain('could not reach the brain');
      });

      then('the brain-failure error block matches its snapshot', () => {
        expect(asStableError(result.stdout)).toMatchSnapshot();
      });
    });
  });

  // .why = an unsupported --mode is a validation error, a distinct caller-facing
  //        variant from the domain errors above (no routes, filter miss, brain
  //        miss). getCliArgs surfaces it as a clean `⛈️ error: input invalid`
  //        block on stderr + a non-zero exit, and — key point — it does NOT
  //        throw; it calls process.exit(1). that hard exit cannot be observed in
  //        the in-process integration test (it would kill the jest worker), so
  //        the invalid-input variant can only be snapped here, through the real
  //        subprocess. this case gives that variant its exhaustive snapshot.
  given('[case6] a caller who passes an unsupported --mode', () => {
    const scene = useBeforeAll(async () => genScene({ corpus: TRANSCRIPT }));
    afterAll(() => scene.cleanup());

    when('[t0] the skill is dispatched with --mode set to a bad value', () => {
      const result = useBeforeAll(async () =>
        runReflectSkill({
          repoDir: scene.repoDir,
          corpusDir: scene.corpusDir,
          args: '--mode bogus',
        }),
      );

      then('it fails loud with a non-zero exit, not a silent plan fallback', () => {
        expect(result.exitCode).not.toBe(0);
      });

      then('it names the offending flag and that input was invalid', () => {
        expect(result.stdout).toContain('input invalid');
        expect(result.stdout).toContain('--mode');
      });

      then('the invalid-input validation block matches its snapshot', () => {
        expect(asStableValidationError(result.stdout)).toMatchSnapshot();
      });
    });
  });
});
