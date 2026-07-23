import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'fs';
import { ConstraintError } from 'helpful-errors';
import { tmpdir } from 'os';
import { join } from 'path';
import { given, then, useBeforeAll, useThen, when } from 'test-fns';

import type { ReviewSelfJudge } from '@src/domain.operations/reflect.on.review.self/getReviewSelfReflection';

import { reflectOnReviewsSelf } from './reflect.on.reviews.self';

/**
 * .what = one transcript event as a jsonl line
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

const asBoundaryLine = (input: { command: string }): string =>
  asEventLine({
    toolUses: [{ name: 'Bash', input: { command: input.command } }],
  });

const ROUTE = '.behavior/test-route';

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
 * .what = a transcript with three chained self-review windows across three slugs
 * .why = the single-review TRANSCRIPT proves the one-row path; this proves the
 *        multi-review variant at the contract layer — a per-slug table with more
 *        than one row, a real worst-offender sort, and an aggregate summed across
 *        slugs. one window edits (has-questioned-assumptions), one is a bare
 *        promise with no edit (has-questioned-questions), one edits again
 *        (has-behavior-declaration-coverage), so the sort has distinct edit rates to
 *        order and the rollup is not a degenerate single row
 */
const MULTI_TRANSCRIPT = [
  asBoundaryLine({
    command: `rhx route.stone.set --as passed --stone 1.vision --route ${ROUTE}`,
  }),
  asEventLine({ text: 'i found a real gap', toolUses: [] }),
  asEventLine({ toolUses: [{ name: 'Edit', input: {} }] }),
  asBoundaryLine({
    command: `rhx route.stone.set --as promised --stone 1.vision --route ${ROUTE} --that has-questioned-assumptions`,
  }),
  asEventLine({ text: 'i promise it looks fine', toolUses: [] }),
  asBoundaryLine({
    command: `rhx route.stone.set --as promised --stone 1.vision --route ${ROUTE} --that has-questioned-questions`,
  }),
  asEventLine({ toolUses: [{ name: 'Write', input: {} }] }),
  asBoundaryLine({
    command: `rhx route.stone.set --as promised --stone 1.vision --route ${ROUTE} --that has-behavior-declaration-coverage`,
  }),
].join('\n');

/**
 * .what = scaffold a temp claude-projects corpus that holds one behavior transcript
 */
const genTempCorpus = (input: { content: string }): string => {
  const root = mkdtempSync(join(tmpdir(), 'reflect-cli-'));
  const projectDir = join(root, 'proj-test');
  mkdirSync(projectDir, { recursive: true });
  writeFileSync(join(projectDir, 'session.jsonl'), input.content);
  return root;
};

/**
 * .what = run the CLI in-process with a temp corpus + given argv, capture stdout
 * .why = argv + corpus dir are injected as arguments (not process globals), so
 *        the contract runs hermetically with zero shared-state side effects —
 *        parallel-safe, no process.argv / process.env mutation
 */
const runCli = async (input: {
  projectsDir: string;
  argv: string[];
  judge?: ReviewSelfJudge;
}): Promise<{ stdout: string; error: Error | null }> => {
  // .why = read the cli's stdout for assertion via an injected sink — NOT a spy
  //        or mock. the contract exposes a `stdout` seam (which falls back to
  //        console.log); here the test passes its own sink to collect the exact
  //        lines a caller sees. the real reflectOnReviewsSelf + real corpus fs +
  //        real report/json writes all run unmocked; only the terminal sink is
  //        redirected, and via dependency injection rather than a jest spy.
  const logs: string[] = [];

  // capture a thrown error explicitly; null means the run exited cleanly
  const error = await reflectOnReviewsSelf({
    argv: input.argv,
    projectsDir: input.projectsDir,
    judge: input.judge,
    stdout: (line: string) => logs.push(line),
  }).then(
    () => null,
    (thrown: unknown) =>
      thrown instanceof Error ? thrown : new Error(String(thrown)),
  );
  return { stdout: logs.join('\n'), error };
};

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

describe('reflectOnReviewsSelf CLI (integration)', () => {
  given('[case1] a corpus with one behavior transcript', () => {
    const scene = useBeforeAll(async () => {
      const projectsDir = genTempCorpus({ content: TRANSCRIPT });
      const reportPath = join(projectsDir, 'report.md');
      return { projectsDir, reportPath };
    });
    afterAll(() => rmSync(scene.projectsDir, { recursive: true, force: true }));

    when('[t0] run in plan mode with an explicit --into path', () => {
      const result = useThen('it completes without error', async () =>
        runCli({
          projectsDir: scene.projectsDir,
          argv: ['--mode', 'plan', '--into', scene.reportPath],
        }),
      );

      then('it exits cleanly (no thrown error)', () => {
        expect(result.error).toEqual(null);
      });

      then('it emits the treestruct summary to stdout', () => {
        expect(result.stdout).toContain('🦫 heres the reflection');
        expect(result.stdout).toContain('🌲 reflect.on.reviews.self --mode plan');
        expect(result.stdout).toContain('has-questioned-assumptions');
      });

      then('the treestruct summary matches its snapshot', () => {
        expect(asStableStdout(result.stdout)).toMatchSnapshot();
      });

      then('it writes the markdown report', () => {
        expect(existsSync(scene.reportPath)).toEqual(true);
        const report = readFileSync(scene.reportPath, 'utf-8');
        expect(report).toContain('# reflection: self-reviews');
        expect(report).toContain('has-questioned-assumptions');
      });

      then('it writes the machine-readable json aggregate', () => {
        const jsonPath = scene.reportPath.replace(/\.md$/, '.v1.json');
        expect(existsSync(jsonPath)).toEqual(true);
        const parsed = JSON.parse(readFileSync(jsonPath, 'utf-8'));
        expect(parsed.reviewsTotal).toEqual(1);
      });
    });

    when('[t2] run in apply mode with a deterministic injected judge', () => {
      // apply mode's real judge is the non-deterministic cheap brain, which would
      // make a snapshot flaky; a deterministic injected judge lets the CLI-level
      // apply-mode output (verdict rollup + per-slug feigned rates) be snapshotted
      const reportPath = () => join(scene.projectsDir, 'apply-report.md');
      const result = useThen('it completes without error', async () =>
        runCli({
          projectsDir: scene.projectsDir,
          argv: ['--mode', 'apply', '--into', reportPath()],
          judge: async () => ({
            label: 'genuine-gain' as const,
            reason: 'edited the artifact after a real read',
          }),
        }),
      );

      then('it exits cleanly (no thrown error)', () => {
        expect(result.error).toEqual(null);
      });

      then('the apply-mode treestruct summary matches its snapshot', () => {
        expect(asStableStdout(result.stdout)).toMatchSnapshot();
      });

      then('the markdown report carries the brain verdict + reason', () => {
        const report = readFileSync(reportPath(), 'utf-8');
        expect(report).toContain('genuine-gain');
        expect(report).toContain('edited the artifact after a real read');
      });

      then('the json aggregate carries the per-slug verdict tally', () => {
        const jsonPath = reportPath().replace(/\.md$/, '.v1.json');
        const parsed = JSON.parse(readFileSync(jsonPath, 'utf-8'));
        expect(parsed.slugs[0].verdicts.genuineGain).toEqual(1);
      });

      then(
        'the apply-mode json aggregate matches its raw-bytes snapshot',
        () => {
          // the raw on-disk bytes of the POPULATED (mixed-verdict) json — the
          // apply-mode variant. `JSON.stringify(aggregate, null, 2)` is inlined in
          // the contract (no genReflectionJson operation to snap one layer down),
          // so this is the only place the exact apply-mode json bytes are proven.
          // the injected judge fixes the verdict, so the aggregate is deterministic
          const jsonPath = reportPath().replace(/\.md$/, '.v1.json');
          const raw = readFileSync(jsonPath, 'utf-8');
          expect(raw).toMatchSnapshot();
        },
      );
    });

    when('[t1b] run with an --into path that lacks a .md suffix', () => {
      // the report + json paths must never collide; a suffixless --into must
      // still yield a distinct report.md and report.v1.json (regression guard)
      const suffixless = () => join(scene.projectsDir, 'noext-report');
      const result = useThen('it runs', async () =>
        runCli({
          projectsDir: scene.projectsDir,
          argv: ['--into', suffixless()],
        }),
      );

      then('it exits cleanly', () => {
        expect(result.error).toEqual(null);
      });

      then('the report gets a .md suffix, distinct from the json path', () => {
        const reportPath = `${suffixless()}.md`;
        const jsonPath = `${suffixless()}.v1.json`;
        expect(existsSync(reportPath)).toEqual(true);
        expect(existsSync(jsonPath)).toEqual(true);
        expect(reportPath).not.toEqual(jsonPath);
      });

      then('the report holds markdown and the json holds the aggregate', () => {
        const report = readFileSync(`${suffixless()}.md`, 'utf-8');
        expect(report).toContain('# reflection: self-reviews');
        const parsed = JSON.parse(
          readFileSync(`${suffixless()}.v1.json`, 'utf-8'),
        );
        expect(parsed.reviewsTotal).toEqual(1);
      });
    });

    when('[t1] run with a project filter that matches no transcript', () => {
      const result = useThen('it runs', async () =>
        runCli({
          projectsDir: scene.projectsDir,
          argv: ['--project', 'no-such-project', '--into', scene.reportPath],
        }),
      );

      then(
        'it fails loud with a ConstraintError, not a silent empty report',
        () => {
          expect(result.error).toBeInstanceOf(ConstraintError);
        },
      );

      then('the error names the miss and gives a hint', () => {
        expect(result.error?.message).toContain('no self-review windows');
      });

      then('the filter-miss error message matches its snapshot', () => {
        expect(result.error?.message).toMatchSnapshot();
      });
    });
  });

  given('[case2] a corpus with no behavior routes at all', () => {
    const scene = useBeforeAll(async () => {
      const projectsDir = genTempCorpus({
        content: asEventLine({ text: 'just some chatter, no route.stone.set' }),
      });
      const reportPath = join(projectsDir, 'report.md');
      return { projectsDir, reportPath };
    });
    afterAll(() => rmSync(scene.projectsDir, { recursive: true, force: true }));

    when('[t0] run with no filters', () => {
      const result = useThen('it runs', async () =>
        runCli({
          projectsDir: scene.projectsDir,
          argv: ['--into', scene.reportPath],
        }),
      );

      then('it fails loud rather than an empty success', () => {
        expect(result.error).toBeInstanceOf(ConstraintError);
        expect(result.error?.message).toContain(
          'no init.behavior self-review windows',
        );
      });

      then('the no-route error message matches its snapshot', () => {
        expect(result.error?.message).toMatchSnapshot();
      });
    });
  });

  given('[case3] a caller who asks for --help', () => {
    const scene = useBeforeAll(async () => {
      const projectsDir = genTempCorpus({ content: TRANSCRIPT });
      return { projectsDir };
    });
    afterAll(() => rmSync(scene.projectsDir, { recursive: true, force: true }));

    when('[t0] run with --help', () => {
      const result = useThen('it runs without error', async () =>
        runCli({ projectsDir: scene.projectsDir, argv: ['--help'] }),
      );

      then('it exits cleanly without a sweep', () => {
        expect(result.error).toEqual(null);
      });

      then('it prints the usage guide with every option', () => {
        expect(result.stdout).toContain('usage:');
        expect(result.stdout).toContain('--mode');
        expect(result.stdout).toContain('--route');
        expect(result.stdout).toContain('--project');
        expect(result.stdout).toContain('--stone');
        expect(result.stdout).toContain('--brain');
        expect(result.stdout).toContain('--into');
        expect(result.stdout).toContain('--help');
      });

      then('the usage guide matches its snapshot', () => {
        expect(result.stdout).toMatchSnapshot();
      });
    });
  });

  given('[case4] apply mode with an unreachable brain', () => {
    const scene = useBeforeAll(async () => {
      const projectsDir = genTempCorpus({ content: TRANSCRIPT });
      return { projectsDir };
    });
    afterAll(() => rmSync(scene.projectsDir, { recursive: true, force: true }));

    when(
      '[t0] run in apply mode with a brain slug that matches no brain',
      () => {
        const result = useThen('it runs', async () =>
          runCli({
            projectsDir: scene.projectsDir,
            argv: ['--mode', 'apply', '--brain', 'nonesuch/does-not-exist'],
          }),
        );

        then(
          'it fails loud with a ConstraintError, not a raw stack trace',
          () => {
            expect(result.error).toBeInstanceOf(ConstraintError);
          },
        );

        then('the error names the brain and gives an actionable hint', () => {
          expect(result.error?.message).toContain('could not reach the brain');
          expect(result.error?.message).toContain('nonesuch/does-not-exist');
        });

        then('the apply-mode brain-failure error matches its snapshot', () => {
          expect(result.error?.message).toMatchSnapshot();
        });
      },
    );
  });

  given('[case5] a corpus with multiple reviews across slugs', () => {
    // the multi-review positive path is a distinct contract output variant from
    // the single-review [case1]: the per-slug table renders more than one row, the
    // worst-offender sort actually orders by edit rate, and the aggregate sums
    // across slugs. this case snaps that variant at the user-faced contract layer
    // (stdout + markdown report + raw json), not only at the unit layer.
    //
    // .why not ALSO snapped at the acceptance (subprocess) layer: the shell
    // wrapper (reflect.on.reviews.self.sh) forwards argv into the same
    // cli.reflectOnReviewsSelf contract with zero branch on review count, so a
    // multi vs single corpus crosses the identical bash → node → cli seam that
    // acceptance [case1] already proves. a second snapshot of the multi-review
    // shape one layer up would duplicate this in-process snapshot through a
    // subprocess for no new code path — the same non-duplication carve-out the
    // apply-mode block below applies. the multi-review OUTPUT shape is fully
    // covered here.
    const scene = useBeforeAll(async () => {
      const projectsDir = genTempCorpus({ content: MULTI_TRANSCRIPT });
      const reportPath = join(projectsDir, 'report.md');
      return { projectsDir, reportPath };
    });
    afterAll(() => rmSync(scene.projectsDir, { recursive: true, force: true }));

    when('[t0] run in plan mode with an explicit --into path', () => {
      const result = useThen('it completes without error', async () =>
        runCli({
          projectsDir: scene.projectsDir,
          argv: ['--mode', 'plan', '--into', scene.reportPath],
        }),
      );

      then('it exits cleanly (no thrown error)', () => {
        expect(result.error).toEqual(null);
      });

      then('it counts all three promised reviews', () => {
        const jsonPath = scene.reportPath.replace(/\.md$/, '.v1.json');
        const parsed = JSON.parse(readFileSync(jsonPath, 'utf-8'));
        expect(parsed.reviewsTotal).toEqual(3);
      });

      then('the multi-review treestruct summary matches its snapshot', () => {
        expect(asStableStdout(result.stdout)).toMatchSnapshot();
      });

      then('the multi-review markdown report matches its snapshot', () => {
        const report = readFileSync(scene.reportPath, 'utf-8');
        expect(report).toMatchSnapshot();
      });

      then('the multi-review json aggregate matches its snapshot', () => {
        // raw file bytes, like the acceptance json snap: the real
        // `JSON.stringify(..., null, 2)` a caller opens, with the per-slug
        // rollup summed across all three windows
        const jsonPath = scene.reportPath.replace(/\.md$/, '.v1.json');
        const raw = readFileSync(jsonPath, 'utf-8');
        expect(raw).toMatchSnapshot();
      });
    });
  });
});
