import { spawnSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { genTempDir, given, then, useBeforeAll, when } from 'test-fns';

const SKILL_PATH = path.join(__dirname, 'review.behavior.sh');

/**
 * .what = a scratch repo with one behavior and its wish, and a stub brain in `.bin`
 * .why = the skill writes its prompt with no real brain; the stub marks that it ran
 *
 * .mock = the `claude` cli, the brain this skill calls
 * .why  = the suite grades what the skill sends and how it reports, not what a brain
 *         replies; a live brain call per run costs money and varies its words
 * .real = the skill's live brain call runs on every hand-run `review.behavior` a human
 *         asks for; the live-brain suites in `blackbox/role=behaver/skill.review.behavior.*`
 *         cover it and are skipped on main, held by
 *         `.dream/v2026_10_22.fix-unskip-external-contract-suites-on-main.md`
 */
const genRepoWithWishAndStubBrain = (input: {
  slug: string;
  brainExit: 0 | 1;
  brainSays: string;
}): { repoDir: string; binDir: string } => {
  const repoDir = genTempDir({ slug: input.slug });
  const behaviorDir = path.join(
    repoDir,
    '.behavior',
    'v2026_11_23.surf-lesson',
  );
  fs.mkdirSync(behaviorDir, { recursive: true });
  fs.writeFileSync(
    path.join(behaviorDir, '0.wish.md'),
    'wish = a surfer books a lesson\n',
  );
  const binDir = path.join(repoDir, '.bin');
  fs.mkdirSync(binDir, { recursive: true });
  fs.writeFileSync(
    path.join(binDir, 'claude'),
    `#!/usr/bin/env bash\ntouch "${binDir}/claude.ran"\ncat <<'BRAIN_SAYS'\n${input.brainSays}\nBRAIN_SAYS\nexit ${input.brainExit}\n`,
    { mode: 0o755 },
  );
  return { repoDir, binDir };
};

/**
 * .what = masks the values a rerun or another host changes: the scratch repo's path, the
 *         run's log dir, the elapsed seconds, the output file's stamp, and the host path to
 *         the rules
 * .why = the snapshot must hold the same bytes on every run, on every host
 */
const asStdioStable = (input: { stdio: string }): string =>
  input.stdio
    .replace(/\S*\/\.temp\/[^/\s]+/g, '{REPO}')
    .replace(/review\.behavior\/[^/\s]+/g, 'review.behavior/{RUN}')
    .replace(/\(\d+s\)/g, '({N}s)')
    .replace(/by_robot\.v\d{8}_\d{6}/g, 'by_robot.v{STAMP}')
    .replace(
      /rules: \S*\/briefs\/practices\//g,
      'rules: {ROLE}/briefs/practices/',
    );

/**
 * .what = a copy of the skill beside a wish rules dir that holds only a rule's companion
 * .why = proves the skill halts when its filter leaves no rule to grade
 */
const genSkillWithCompanionOnlyRules = (input: {
  repoDir: string;
}): { skillPath: string } => {
  const roleDir = path.join(input.repoDir, '.role');
  const skillPath = path.join(roleDir, 'skills', 'review.behavior.sh');
  fs.mkdirSync(path.dirname(skillPath), { recursive: true });
  fs.copyFileSync(SKILL_PATH, skillPath);
  const rulesDir = path.join(roleDir, 'briefs', 'practices', 'behavior.wish');
  fs.mkdirSync(rulesDir, { recursive: true });
  fs.writeFileSync(
    path.join(rulesDir, 'rule.forbid.trust-of-wisher-how.reason.md'),
    '# an argument, not a rule\n',
  );
  return { skillPath };
};

/**
 * .what = runs the wish review of the scratch behavior, with the stub brain first on PATH
 * .why = a host shell function named claude (exported as BASH_FUNC_*, or sourced via
 *        BASH_ENV) would shadow the stub on PATH, so the child env carries neither
 */
const runWishReview = (input: {
  repoDir: string;
  binDir: string;
  skillPath: string;
  args: string[];
}): ReturnType<typeof spawnSync> => {
  const envHost = Object.fromEntries(
    Object.entries(process.env).filter(
      ([key]) =>
        !key.startsWith('BASH_FUNC_') && key !== 'BASH_ENV' && key !== 'ENV',
    ),
  );
  return spawnSync('bash', [input.skillPath, ...input.args], {
    cwd: input.repoDir,
    env: { ...envHost, PATH: `${input.binDir}:${process.env.PATH}` },
    encoding: 'utf-8',
  });
};

/**
 * .what = the args of a wish review of the scratch behavior
 */
const ARGS_WISH_REVIEW = ['--of', 'surf-lesson', '--against', 'wish'];

/**
 * .what = what the stub brain says on a clean review: a header, no blocker or nitpick
 */
const BRAIN_SAYS_CLEAN = '# review: wish';

/**
 * .what = the wish prompt the skill logged for its one run
 */
const getWishPromptLogged = (input: { repoDir: string }): string => {
  const logRoot = path.join(input.repoDir, '.log', 'bhuild', 'review.behavior');
  const logRun = fs.readdirSync(logRoot)[0]!;
  return fs.readFileSync(path.join(logRoot, logRun, 'prompt.wish.md'), 'utf-8');
};

/**
 * .what = proves which briefs the wish review inlines as rules
 * .why = a rule's argument (.reason.md) and worked case (.example=*.md) share
 *        its name; graded as rules, a case reads as a second law
 */
describe('review.behavior.sh (behaver)', () => {
  given('[case1] a behavior with a wish, and a stub brain on PATH', () => {
    const scene = useBeforeAll(async () => {
      const repo = genRepoWithWishAndStubBrain({
        slug: 'behaver-review-behavior-rules',
        brainExit: 0,
        brainSays: BRAIN_SAYS_CLEAN,
      });
      const result = runWishReview({
        ...repo,
        skillPath: SKILL_PATH,
        args: ARGS_WISH_REVIEW,
      });
      const prompt = getWishPromptLogged(repo);
      const stubRan = fs.existsSync(path.join(repo.binDir, 'claude.ran'));
      return { result, prompt, stubRan };
    });

    when('[t0] the wish review runs', () => {
      then('it calls the stub brain and exits clean', () => {
        expect({
          stubRan: scene.stubRan,
          status: scene.result.status,
          stderr: scene.result.stderr,
        }).toEqual({ stubRan: true, status: 0, stderr: '' });
      });

      then('the render shows the review, a clean summary, and the log', () => {
        const stdout = asStdioStable({ stdio: String(scene.result.stdout) });
        expect(stdout).toContain('✓ complete');
        expect(stdout).toContain('├── failed: 0');
        expect(stdout).toContain('✨ review.behavior complete');
        expect(stdout).toMatchSnapshot();
      });

      then('the prompt inlines the wisher-how rule as a rule', () => {
        expect(scene.prompt).toContain(
          '### rule.forbid.trust-of-wisher-how.md',
        );
      });

      then(
        'the prompt inlines no argument and no worked case as a rule',
        () => {
          expect(scene.prompt).not.toMatch(/### rule\.[^\n]*\.reason\.md/);
          expect(scene.prompt).not.toMatch(/### rule\.[^\n]*\.example=/);
        },
      );
    });
  });

  given('[case2] a wish rules dir that holds only a rule companion', () => {
    const scene = useBeforeAll(async () => {
      const repo = genRepoWithWishAndStubBrain({
        slug: 'behaver-review-behavior-norules',
        brainExit: 0,
        brainSays: BRAIN_SAYS_CLEAN,
      });
      const { skillPath } = genSkillWithCompanionOnlyRules(repo);
      const result = runWishReview({
        ...repo,
        skillPath,
        args: ARGS_WISH_REVIEW,
      });
      const stubRan = fs.existsSync(path.join(repo.binDir, 'claude.ran'));
      return { result, stubRan };
    });

    when('[t0] the wish review runs', () => {
      then('it halts as a constraint and never calls the brain', () => {
        expect({
          stubRan: scene.stubRan,
          status: scene.result.status,
        }).toEqual({ stubRan: false, status: 2 });
      });

      then('the halt names the rules dir and the fix', () => {
        const stderr = String(scene.result.stderr);
        expect(stderr).toContain(
          "✋ ConstraintError: no rules to review 'wish' against",
        );
        expect(stderr).toContain('behavior.wish');
        expect(stderr).toContain('fix: add a rule.*.md');
        expect(stderr).toMatchSnapshot();
      });
    });
  });

  given('[case3] a behavior with a wish, and a stub brain that fails', () => {
    const scene = useBeforeAll(async () => {
      const repo = genRepoWithWishAndStubBrain({
        slug: 'behaver-review-behavior-brainfail',
        brainExit: 1,
        brainSays: BRAIN_SAYS_CLEAN,
      });
      const result = runWishReview({
        ...repo,
        skillPath: SKILL_PATH,
        args: ARGS_WISH_REVIEW,
      });
      return { result };
    });

    when('[t0] the wish review runs', () => {
      then('it exits as a malfunction', () => {
        expect(scene.result.status).toEqual(1);
      });

      then('the error names the brain exit, its words, and the log', () => {
        const stderr = asStdioStable({ stdio: String(scene.result.stderr) });
        expect(stderr).toContain(
          "💥 MalfunctionError: review of 'wish' failed (claude exit code: 1)",
        );
        expect(stderr).toContain('# review: wish');
        expect(stderr).toContain('full log: ');
        expect(stderr).toMatchSnapshot();
      });

      then('the summary counts the failed review', () => {
        const stdout = asStdioStable({ stdio: String(scene.result.stdout) });
        expect(stdout).toContain('├── failed: 1');
        expect(stdout).not.toContain('✨ review.behavior complete');
        expect(stdout).toMatchSnapshot();
      });
    });
  });

  given(
    '[case4] a behavior with a wish, and a stub brain that reports a blocker and a nitpick',
    () => {
      const scene = useBeforeAll(async () => {
        const repo = genRepoWithWishAndStubBrain({
          slug: 'behaver-review-behavior-findings',
          brainExit: 0,
          brainSays: [
            '# review: wish',
            '# blocker.1: the wish names a prior tool as the parity target',
            '# nitpick.1: the lesson verb could read clearer',
          ].join('\n'),
        });
        const result = runWishReview({
          ...repo,
          skillPath: SKILL_PATH,
          args: ARGS_WISH_REVIEW,
        });
        return { result };
      });

      when('[t0] the wish review runs', () => {
        then('it exits clean, since the review itself ran', () => {
          expect(scene.result.status).toEqual(0);
        });

        then('the summary counts and lists each blocker and nitpick', () => {
          const stdout = asStdioStable({ stdio: String(scene.result.stdout) });
          expect(stdout).toContain('├── blockers: 1');
          expect(stdout).toContain('└── nitpicks: 1');
          expect(stdout).toContain('⛈️ blockers:');
          expect(stdout).toContain(
            'the wish names a prior tool as the parity target',
          );
          expect(stdout).toContain('🌊 nitpicks:');
          expect(stdout).toMatchSnapshot();
        });
      });
    },
  );

  /**
   * .what = the other renders a caller can meet, one invocation each
   * .why = each is a variant of the skill's contract; a reword or a lost line shows in review
   */
  const CASES_OTHER_RENDERS = [
    { slug: 'help', args: ['--help'], wishAbsent: false },
    {
      slug: 'unknown-target',
      args: ['--of', 'surf-lesson', '--against', 'bogus'],
      wishAbsent: false,
    },
    { slug: 'wish-absent', args: ARGS_WISH_REVIEW, wishAbsent: true },
    { slug: 'of-absent', args: ['--against', 'wish'], wishAbsent: false },
  ];
  given('[case5] the other renders a caller can meet', () => {
    CASES_OTHER_RENDERS.forEach((thisCase) => {
      when(`[t.${thisCase.slug}] the skill runs`, () => {
        const scene = useBeforeAll(async () => {
          const repo = genRepoWithWishAndStubBrain({
            slug: `behaver-review-behavior-${thisCase.slug}`,
            brainExit: 0,
            brainSays: BRAIN_SAYS_CLEAN,
          });
          if (thisCase.wishAbsent)
            fs.rmSync(
              path.join(
                repo.repoDir,
                '.behavior',
                'v2026_11_23.surf-lesson',
                '0.wish.md',
              ),
            );
          const result = runWishReview({
            ...repo,
            skillPath: SKILL_PATH,
            args: thisCase.args,
          });
          return { result };
        });

        then('its exit code, stdout, and stderr hold their render', () => {
          expect({
            status: scene.result.status,
            stdout: asStdioStable({ stdio: String(scene.result.stdout) }),
            stderr: asStdioStable({ stdio: String(scene.result.stderr) }),
          }).toMatchSnapshot();
        });
      });
    });
  });
});
