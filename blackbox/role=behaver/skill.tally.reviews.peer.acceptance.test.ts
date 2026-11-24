import { spawnSync } from 'child_process';
import fs from 'fs';
import { MalfunctionError } from 'helpful-errors';
import path from 'path';
import { given, then, useBeforeAll, when } from 'test-fns';

import { genTestGitRepo } from '../.test/infra';

const SCRIPT_PATH = path.join(
  __dirname,
  '../../src/domain.roles/behaver/skills/tally.reviews.peer.sh',
);

const ROUTE = '.behavior/v2026_01_01.tally-fixture';

/**
 * .what = one peer-review report in the guard's shape
 * .why = the skill reads exactly this shape; the fixture writes it as the guard would
 */
const asReport = (input: {
  blocks: { severity: 'blocker' | 'nitpick'; rule: string }[];
}): string => {
  const count = (severity: 'blocker' | 'nitpick'): number =>
    input.blocks.filter((block) => block.severity === severity).length;
  return [
    '🦉 needs your talons',
    '   └─ summary',
    `      ├─ ${count('blocker')} blockers 🔴`,
    `      └─ ${count('nitpick')} nitpicks 🟠`,
    '',
    ...input.blocks.flatMap((block, index) => [
      '---',
      `# ${block.severity}.${index + 1}: a point`,
      '',
      `**rule**: .agent/repo=ehmpathy/role=mechanic/briefs/${block.rule}.md`,
      '',
    ]),
  ].join('\n');
};

/**
 * .what = the report filename the guard writes for one lane and round
 */
const asReportName = (input: { round: string; lane: string }): string =>
  `5.1.execution.from_vision._.review.i001.abc.${input.round}._.given.by_peer.${input.lane}.report.md`;

/**
 * .what = a temp repo with a route whose peer dir holds the given files
 * .why = the skill resolves `import('rhachet-roles-bhuild')` from cwd, so the
 *        temp repo links node_modules, exactly the seam a consumer uses
 */
const genScene = (input: {
  files: Record<string, string> | null;
}): { repoDir: string; cleanup: () => void } => {
  const { repoDir, cleanup } = genTestGitRepo({ prefix: 'tally-accept-' });
  fs.symlinkSync(
    path.join(process.cwd(), 'node_modules'),
    path.join(repoDir, 'node_modules'),
  );
  if (input.files === null) return { repoDir, cleanup };
  const peerDir = path.join(repoDir, ROUTE, '.reviews', 'peer');
  fs.mkdirSync(peerDir, { recursive: true });
  Object.entries(input.files).map(([name, content]) =>
    fs.writeFileSync(path.join(peerDir, name), content),
  );
  return { repoDir, cleanup };
};

/**
 * .what = run the skill as a caller would, and capture its exit and output
 * .why  = spawnSync reports a spawn failure or a signal on its own fields, so neither
 *         can pose as a skill's exit 1; the args ride a shell so their quotes hold
 */
const runSkill = (input: {
  repoDir: string;
  args: string;
}): { output: string; exitCode: number } => {
  const run = spawnSync('bash', ['-c', `bash "${SCRIPT_PATH}" ${input.args}`], {
    cwd: input.repoDir,
    encoding: 'utf-8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  // a spawn failure or a signal is a harness malfunction, never a skill verdict
  if (run.error) throw run.error;
  if (run.status === null)
    throw new MalfunctionError('the skill exited on a signal', {
      signal: run.signal,
      args: input.args,
    });

  // join stdout + stderr in that order, as a caller's terminal shows them
  const output = [run.stdout, run.stderr]
    .map((part) => part.trim())
    .filter(Boolean)
    .join('\n');
  return { output, exitCode: run.status };
};

/**
 * .what = the refusal a human reads — header, metadata, and hint — with machine bytes cut
 * .why  = the hint is the half that names the fix, so it rides in the snapshot; the stack
 *         frames and the temp repo path vary per box, so they are cut or masked
 */
const asStableErrorOutput = (input: {
  output: string;
  repoDir: string;
}): string =>
  input.output
    .split('\n')
    .filter((line) => !/^\s+at /.test(line))
    .join('\n')
    .split(input.repoDir)
    .join('<repo>');

const FILES_TWO_LANES = {
  [asReportName({ round: 'r001', lane: 'prose-of-briefs' })]: asReport({
    blocks: [
      { severity: 'blocker', rule: 'rule.forbid.absolutes' },
      { severity: 'nitpick', rule: 'rule.forbid.riddles' },
    ],
  }),
  [asReportName({ round: 'r002', lane: 'mech-failhides' })]: asReport({
    blocks: [{ severity: 'blocker', rule: 'rule.forbid.absolutes' }],
  }),
  [asReportName({ round: 'r003', lane: 'arch-smell-scopeleaks' })]: asReport({
    blocks: [],
  }),
};

describe('tally.reviews.peer (acceptance)', () => {
  given('[case1] a route with reports from three lanes', () => {
    const scene = useBeforeAll(async () =>
      genScene({ files: FILES_TWO_LANES }),
    );
    afterAll(() => scene.cleanup());

    when('[t0] it is tallied by lane', () => {
      const result = useBeforeAll(async () =>
        runSkill({ repoDir: scene.repoDir, args: `--route ${ROUTE}` }),
      );

      then('it exits 0 and names each lane with its counts', () => {
        expect(result.exitCode).toEqual(0);
        expect(result.output).toContain('├─ corpus: 3 reports');
        expect(result.output).toContain('arch-smell-scopeleaks');
      });

      then('the stdout matches its snapshot', () => {
        expect(result.output).toMatchSnapshot();
      });
    });

    when('[t1] it is tallied by rule, one lane dropped', () => {
      const result = useBeforeAll(async () =>
        runSkill({
          repoDir: scene.repoDir,
          args: `--route ${ROUTE} --by rule --lane-wout mech-`,
        }),
      );

      then('it exits 0 and drops the excluded lane from the corpus', () => {
        expect(result.exitCode).toEqual(0);
        expect(result.output).toContain('├─ corpus: 2 reports');
        expect(result.output).toContain('rule.forbid.riddles');
      });

      then('the stdout matches its snapshot', () => {
        expect(result.output).toMatchSnapshot();
      });
    });

    when('[t8] it is tallied by rule, every lane kept', () => {
      const result = useBeforeAll(async () =>
        runSkill({ repoDir: scene.repoDir, args: `--route ${ROUTE} --by rule` }),
      );

      then('it exits 0 and merges a rule two lanes cited into one row', () => {
        expect(result.exitCode).toEqual(0);
        expect(result.output).toContain('├─ corpus: 3 reports');
        expect(result.output).toMatch(/2 points +\S+ +rule\.forbid\.absolutes +b=2 n=0/);
      });

      then('the stdout matches its snapshot', () => {
        expect(result.output).toMatchSnapshot();
      });
    });

    when('[t2] --help is asked', () => {
      const result = useBeforeAll(async () =>
        runSkill({ repoDir: scene.repoDir, args: '--help' }),
      );

      then('it exits 0 and marks --route required, with no default', () => {
        expect(result.exitCode).toEqual(0);
        expect(result.output).toContain('🌲 tally.reviews.peer --help');
        expect(result.output).toMatch(/--route <dir> +the route dir to tally +\(required\)/);
        expect(result.output).not.toContain('default: required');
      });

      then('the guide matches its snapshot', () => {
        expect(result.output).toMatchSnapshot();
      });
    });

    when('[t7] -h is asked, the alias the guide advertises', () => {
      const result = useBeforeAll(async () =>
        runSkill({ repoDir: scene.repoDir, args: '-h' }),
      );

      then('it exits 0 with the guide, never a --route refusal', () => {
        expect(result.exitCode).toEqual(0);
        expect(result.output).toContain('🌲 tally.reviews.peer --help');
        expect(result.output).not.toContain('--route is required');
      });

      then('the guide matches its snapshot', () => {
        expect(result.output).toMatchSnapshot();
      });
    });

    when('[t3] --route is absent', () => {
      const result = useBeforeAll(async () =>
        runSkill({ repoDir: scene.repoDir, args: '--by rule' }),
      );

      then('it exits 2 as a constraint, never 0 with a guide', () => {
        expect(result.exitCode).toEqual(2);
        expect(
          asStableErrorOutput({ output: result.output, repoDir: scene.repoDir }),
        ).toMatchSnapshot();
      });
    });

    when('[t4] the route rides as a positional', () => {
      const result = useBeforeAll(async () =>
        runSkill({ repoDir: scene.repoDir, args: ROUTE }),
      );

      then('it exits 2: a positional is refused, never read as a route', () => {
        expect(result.exitCode).toEqual(2);
        expect(
          asStableErrorOutput({ output: result.output, repoDir: scene.repoDir }),
        ).toMatchSnapshot();
      });
    });

    when('[t6] --by names an axis it does not know', () => {
      const result = useBeforeAll(async () =>
        runSkill({ repoDir: scene.repoDir, args: `--route ${ROUTE} --by bogus` }),
      );

      // getCliArgs refuses a schema miss with exit 1 for every cli here; its move
      // to exit 2 is a shared-infra sweep, held as fulcrum F26 with its dream
      then('it fails loud: an unknown axis is refused, never tallied by lane', () => {
        expect(result.exitCode).toEqual(1);
        expect(result.output).toContain('input invalid');
        expect(
          asStableErrorOutput({ output: result.output, repoDir: scene.repoDir }),
        ).toMatchSnapshot();
      });
    });

    when('[t5] --lane-with matches no report', () => {
      const result = useBeforeAll(async () =>
        runSkill({
          repoDir: scene.repoDir,
          args: `--route ${ROUTE} --lane-with absent-lane`,
        }),
      );

      then('it exits 2: an empty corpus is refused, not tallied as clean', () => {
        expect(result.exitCode).toEqual(2);
        expect(
          asStableErrorOutput({ output: result.output, repoDir: scene.repoDir }),
        ).toMatchSnapshot();
      });
    });
  });

  given('[case1b] the same route, narrowed or misfiltered', () => {
    const scene = useBeforeAll(async () =>
      genScene({ files: FILES_TWO_LANES }),
    );
    afterAll(() => scene.cleanup());

    when('[t0] --lane-with names one lane', () => {
      const result = useBeforeAll(async () =>
        runSkill({
          repoDir: scene.repoDir,
          args: `--route ${ROUTE} --lane-with prose-of`,
        }),
      );

      then('it exits 0 and the corpus holds that lane alone', () => {
        expect(result.exitCode).toEqual(0);
        expect(result.output).toContain('├─ lane-with: prose-of');
        expect(result.output).toContain('├─ corpus: 1 report');
        expect(result.output).not.toContain('mech-failhides');
      });

      then('the stdout matches its snapshot', () => {
        expect(result.output).toMatchSnapshot();
      });
    });

    when('[t1] --lane-wout is repeated', () => {
      const result = useBeforeAll(async () =>
        runSkill({
          repoDir: scene.repoDir,
          args: `--route ${ROUTE} --lane-wout mech- --lane-wout prose-of`,
        }),
      );

      then('it exits 2: a repeat is refused, never read last-wins', () => {
        expect(result.exitCode).toEqual(2);
        expect(result.output).toContain('--lane-wout mech-,prose-of');
        expect(
          asStableErrorOutput({ output: result.output, repoDir: scene.repoDir }),
        ).toMatchSnapshot();
      });
    });

    when('[t2] --lane-wout drops every report', () => {
      const result = useBeforeAll(async () =>
        runSkill({
          repoDir: scene.repoDir,
          args: `--route ${ROUTE} --lane-wout mech-,prose-of,arch-`,
        }),
      );

      then('it exits 2: an empty corpus is refused, and the hint names the filter', () => {
        expect(result.exitCode).toEqual(2);
        expect(result.output).toContain('--lane-wout');
        expect(
          asStableErrorOutput({ output: result.output, repoDir: scene.repoDir }),
        ).toMatchSnapshot();
      });
    });

    // `by_peer` sits in every report name, so --lane-with keeps all three and --lane-wout
    // then drops one: the two filters compose, and the corpus line names both
    when('[t3] --lane-with and --lane-wout compose, tallied by rule', () => {
      const result = useBeforeAll(async () =>
        runSkill({
          repoDir: scene.repoDir,
          args: `--route ${ROUTE} --by rule --lane-with by_peer --lane-wout mech-`,
        }),
      );

      then('it exits 0, and the corpus holds what both filters keep', () => {
        expect(result.exitCode).toEqual(0);
        expect(result.output).toContain('├─ lane-with: by_peer');
        expect(result.output).toContain('├─ lane-wout: mech-');
        expect(result.output).toContain('├─ corpus: 2 reports');
        expect(result.output).toContain('rule.forbid.riddles');
      });

      then('the stdout matches its snapshot', () => {
        expect(result.output).toMatchSnapshot();
      });
    });
  });

  given('[case1c] a route whose lanes raised no point', () => {
    const scene = useBeforeAll(async () =>
      genScene({
        files: {
          [asReportName({ round: 'r001', lane: 'repo-rules' })]: asReport({
            blocks: [],
          }),
          [asReportName({ round: 'r002', lane: 'mech-failhides' })]: asReport({
            blocks: [],
          }),
        },
      }),
    );
    afterAll(() => scene.cleanup());

    when('[t0] it is tallied by lane', () => {
      const result = useBeforeAll(async () =>
        runSkill({ repoDir: scene.repoDir, args: `--route ${ROUTE}` }),
      );

      then('it exits 0, each lane on a row, each share a dash', () => {
        expect(result.exitCode).toEqual(0);
        expect(result.output).toContain('├─ totals: 0 points');
        expect(result.output).toContain('—   repo-rules');
        expect(result.output).toContain('—   mech-failhides');
      });

      then('the stdout matches its snapshot', () => {
        expect(result.output).toMatchSnapshot();
      });
    });
  });

  given('[case1d] the same clean route, tallied by rule', () => {
    const scene = useBeforeAll(async () =>
      genScene({
        files: {
          [asReportName({ round: 'r001', lane: 'repo-rules' })]: asReport({
            blocks: [],
          }),
        },
      }),
    );
    afterAll(() => scene.cleanup());

    when('[t0] it is tallied by rule', () => {
      const result = useBeforeAll(async () =>
        runSkill({ repoDir: scene.repoDir, args: `--route ${ROUTE} --by rule` }),
      );

      then('it exits 0 and says the corpus cites no rule', () => {
        expect(result.exitCode).toEqual(0);
        expect(result.output).toContain('└─ (none — the corpus cites no rule)');
      });

      then('the stdout matches its snapshot', () => {
        expect(result.output).toMatchSnapshot();
      });
    });
  });

  given('[case1e] a route where one lane ran two rounds', () => {
    const scene = useBeforeAll(async () =>
      genScene({
        files: {
          [asReportName({ round: 'r001', lane: 'prose-of-briefs' })]: asReport({
            blocks: [{ severity: 'blocker', rule: 'rule.forbid.absolutes' }],
          }),
          [asReportName({ round: 'r004', lane: 'prose-of-briefs' })]: asReport({
            blocks: [{ severity: 'nitpick', rule: 'rule.forbid.riddles' }],
          }),
          [asReportName({ round: 'r002', lane: 'mech-failhides' })]: asReport({
            blocks: [],
          }),
        },
      }),
    );
    afterAll(() => scene.cleanup());

    when('[t0] it is tallied by lane', () => {
      const result = useBeforeAll(async () =>
        runSkill({ repoDir: scene.repoDir, args: `--route ${ROUTE}` }),
      );

      then('it exits 0 and sums both rounds into one lane row', () => {
        expect(result.exitCode).toEqual(0);
        expect(result.output).toContain('├─ corpus: 3 reports');
        expect(result.output).toMatch(
          /2 points +\S+ +prose-of-briefs +2 reports +· b=1 n=1/,
        );
      });

      then('the stdout matches its snapshot', () => {
        expect(result.output).toMatchSnapshot();
      });
    });
  });

  given('[case2] a route whose guard ran no peer lane', () => {
    const scene = useBeforeAll(async () => genScene({ files: null }));
    afterAll(() => scene.cleanup());

    when('[t0] it is tallied', () => {
      const result = useBeforeAll(async () =>
        runSkill({ repoDir: scene.repoDir, args: `--route ${ROUTE}` }),
      );

      then('it exits 2 and names the absent dir', () => {
        expect(result.exitCode).toEqual(2);
        expect(
          asStableErrorOutput({ output: result.output, repoDir: scene.repoDir }),
        ).toMatchSnapshot();
      });
    });
  });

  given('[case2b] a route whose peer dir holds wrappers but no report', () => {
    const scene = useBeforeAll(async () =>
      genScene({
        files: {
          '5.1.execution.from_vision._.review.i001.abc.r001._.given.by_peer.repo-rules.md':
            '├─ stdout\n└─ tallied\n',
        },
      }),
    );
    afterAll(() => scene.cleanup());

    when('[t0] it is tallied', () => {
      const result = useBeforeAll(async () =>
        runSkill({ repoDir: scene.repoDir, args: `--route ${ROUTE}` }),
      );

      then('it exits 2, and the hint names the absent *.report.md', () => {
        expect(result.exitCode).toEqual(2);
        expect(result.output).toContain('no peer-review reports matched');
        expect(result.output).toContain('.report.md');
        expect(
          asStableErrorOutput({ output: result.output, repoDir: scene.repoDir }),
        ).toMatchSnapshot();
      });
    });
  });

  given('[case3] a report whose summary disagrees with its points', () => {
    const scene = useBeforeAll(async () =>
      genScene({
        files: {
          [asReportName({ round: 'r001', lane: 'repo-rules' })]: asReport({
            blocks: [{ severity: 'blocker', rule: 'rule.forbid.absolutes' }],
          }).replace('1 blockers', '0 blockers'),
        },
      }),
    );
    afterAll(() => scene.cleanup());

    when('[t0] it is tallied', () => {
      const result = useBeforeAll(async () =>
        runSkill({ repoDir: scene.repoDir, args: `--route ${ROUTE}` }),
      );

      then('it exits 1 as a malfunction, never a silent zero', () => {
        expect(result.exitCode).toEqual(1);
        expect(
          asStableErrorOutput({ output: result.output, repoDir: scene.repoDir }),
        ).toMatchSnapshot();
      });
    });
  });

  const REPORT_ONE_BLOCKER = asReport({
    blocks: [{ severity: 'blocker', rule: 'rule.forbid.absolutes' }],
  });
  const CASES_PARSE_REFUSAL: { slug: string; name: string; content: string; header: string }[] = [
    {
      slug: 'a point block with two rule lines',
      name: asReportName({ round: 'r001', lane: 'repo-rules' }),
      content: REPORT_ONE_BLOCKER.replace(
        '**rule**:',
        '**rule**: .agent/rule.forbid.riddles.md\n**rule**:',
      ),
      header: '💥 MalfunctionError: a point block owes exactly one rule line',
    },
    {
      slug: 'a rule line with no rule slug',
      name: asReportName({ round: 'r001', lane: 'repo-rules' }),
      content: REPORT_ONE_BLOCKER.replace(
        /\*\*rule\*\*:.*$/m,
        '**rule**: see the brief on absolutes',
      ),
      header: '💥 MalfunctionError: rule line carries no rule.* slug',
    },
    {
      slug: 'a report whose filename declares no lane',
      name: 'notes.report.md',
      content: REPORT_ONE_BLOCKER,
      header: '💥 MalfunctionError: report filename declares no lane slug',
    },
    {
      slug: 'a summary with no blocker count',
      name: asReportName({ round: 'r001', lane: 'repo-rules' }),
      content: REPORT_ONE_BLOCKER.replace(/^.*1 blockers.*\n/m, ''),
      header: '💥 MalfunctionError: no blocker count in the summary',
    },
  ];

  CASES_PARSE_REFUSAL.map((thisCase) =>
    given(`[case4] ${thisCase.slug}`, () => {
      const scene = useBeforeAll(async () =>
        genScene({ files: { [thisCase.name]: thisCase.content } }),
      );
      afterAll(() => scene.cleanup());

      when('[t0] it is tallied', () => {
        const result = useBeforeAll(async () =>
          runSkill({ repoDir: scene.repoDir, args: `--route ${ROUTE}` }),
        );

        then('it exits 1 as a malfunction, and names the defect', () => {
          expect(result.exitCode).toEqual(1);
          expect(result.output).toContain(thisCase.header);
        });

        then('the refusal matches its snapshot', () => {
          expect(
            asStableErrorOutput({ output: result.output, repoDir: scene.repoDir }),
          ).toMatchSnapshot();
        });
      });
    }),
  );
});
