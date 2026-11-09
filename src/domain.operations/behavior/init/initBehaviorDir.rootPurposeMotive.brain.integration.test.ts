import { execSync, spawnSync } from 'child_process';
import fs from 'fs';
import { MalfunctionError } from 'helpful-errors';
import path from 'path';
import { getAllStones } from 'rhachet-roles-bhrain/sdk/route';
import { genTempDir, given, then, useThen, when } from 'test-fns';

import { RUN_BRAIN_TEST } from '../../../.test/utils/RUN_BRAIN_TEST';
import { initBehaviorDir } from './initBehaviorDir';

/**
 * .what = proves the `root-purpose-motive` lane, run live on a brain, refuses a mechanism root
 *         and approves a motive root
 * .why  = the wish's third refusal ("names a mechanism as its root") rests wholly on this lane;
 *         the journey stubs it, so only a live run shows the rubric and its bind still hold
 *
 * .note = the lane's run line is read from an init'd guard via bhrain's own parser, so the bind
 *         under test is the one that ships, never a hand-typed twin
 * .note = a live-brain probe: it runs only when targeted (`BRAIN_LIVE=true`, see RUN_BRAIN_TEST),
 *         since each case bills a real model call and its verdict rides the model
 */

const ROUTE_REL = '.behavior/v2026_11_08.sandpine-lesson-reminders';
const REPO_ROOT = path.join(__dirname, '../../../..');

// one review reads a short yield and a short wish; a slow reply still fits
const REVIEW_TIMEOUT_MS = 600_000;
jest.setTimeout(2 * REVIEW_TIMEOUT_MS + 120_000);

const WISH = [
  'wish =',
  '',
  'surfers who book a sandpine lesson should get a reminder the day before.',
  '',
].join('\n');

// an outcome world that serves the reminders root: the surfer shows up, the slot is kept
const OUTCOME_SERVES_ROOT =
  'a surfer gets a text the day before each lesson, and shows up on time.';

// a held-out domain: the developer tools this repo builds, where a part of the build and a
// person's outcome blur, and where the rule's own examples never reach
const WISH_OF_TOOL = [
  'wish =',
  '',
  'every vision a clone writes should say why it is wanted, before it says what it builds.',
  '',
].join('\n');
const OUTCOME_OF_TOOL_SERVES_ROOT =
  'a reviewer opens a vision, reads its motive in the first section, and grades the shape against it.';

/**
 * .what = a vision yield whose root purpose is the given layers, each nested one indent deeper,
 *         over the given outcome world
 */
const asYield = (input: {
  title: string;
  layers: string[];
  outcome: string;
}): string =>
  [
    `# vision: ${input.title}`,
    '',
    '## .the root purpose',
    '',
    ...input.layers.map(
      (layer, index) => `${'  '.repeat(index)}- why: ${layer}`,
    ),
    '',
    '## the outcome world',
    '',
    input.outcome,
    '',
  ].join('\n');

/**
 * .what = a sandpine reminders yield with the given layers
 */
const asYieldOfReminders = (input: {
  layers: string[];
  outcome: string;
}): string => asYield({ title: 'sandpine lesson reminders', ...input });

/**
 * .what = a git repo with a route init'd on a feature branch, and the repo's roles linked in
 * .why  = the lane binds `--diffs since-main` and reads its rubric from `.agent/`, so the yield
 *         must sit on a branch off main, beside the same `.agent/` and `node_modules` this repo has
 */
const genRepoWithRoute = (input: {
  slug: string;
  wish: string;
}): { repoDir: string } => {
  const repoDir = genTempDir({ slug: input.slug });
  fs.symlinkSync(
    path.join(REPO_ROOT, 'node_modules'),
    path.join(repoDir, 'node_modules'),
  );
  fs.symlinkSync(path.join(REPO_ROOT, '.agent'), path.join(repoDir, '.agent'));
  fs.symlinkSync(
    path.join(REPO_ROOT, 'package.json'),
    path.join(repoDir, 'package.json'),
  );
  fs.writeFileSync(
    path.join(repoDir, '.gitignore'),
    'node_modules\n.agent\npackage.json\n',
  );
  execSync(
    [
      'git init -b main',
      'git add .gitignore',
      'git -c user.name=bert -c user.email=bert@example.com commit -m init',
      'git checkout -b feat/lesson-reminders',
    ].join(' && '),
    { cwd: repoDir, stdio: 'pipe' },
  );
  initBehaviorDir({
    behaviorDir: path.join(repoDir, ROUTE_REL),
    behaviorDirRel: ROUTE_REL,
  });
  fs.writeFileSync(path.join(repoDir, ROUTE_REL, '0.wish.md'), input.wish);
  return { repoDir };
};

/**
 * .what = the motive lane's run line, as the init'd 1.vision guard declares it
 */
const getRunOfMotiveLane = async (input: {
  repoDir: string;
}): Promise<string> => {
  const stones = await getAllStones({
    route: path.join(input.repoDir, ROUTE_REL),
  });
  const stoneOfVision = stones.find((stone) => stone.name === '1.vision');
  const peers = stoneOfVision?.guard?.reviews?.peer ?? [];
  const lane = peers.find((peer) => peer.slug === 'root-purpose-motive');
  if (!lane)
    throw new MalfunctionError(
      '1.vision guard holds no root-purpose-motive lane',
      {
        hint: 'the 1.vision.guard templates lost the lane',
      },
    );
  return lane.run;
};

/**
 * .what = the lane's run line with the guard's vars filled, as bhrain fills them
 * .why  = `$conversation` holds no prior round on a fresh route, so its flag drops whole
 */
const asRunFilled = (input: { run: string; output: string }): string =>
  input.run
    .replace(/--conversation \$conversation\s*/, '')
    .split('$rhx')
    .join(path.join(REPO_ROOT, 'node_modules', '.bin', 'rhx'))
    .split('$route')
    .join(ROUTE_REL)
    .split('"$output"')
    .join(`"${input.output}"`);

/**
 * .what = runs the motive lane live on the given yield, under the given wish; returns its tallies
 */
const runMotiveLaneOnYield = async (input: {
  slug: string;
  wish: string;
  markdown: string;
}): Promise<{ blockers: number; nitpicks: number; stdout: string }> => {
  // write the yield the lane reads
  const { repoDir } = genRepoWithRoute({ slug: input.slug, wish: input.wish });
  fs.writeFileSync(
    path.join(repoDir, ROUTE_REL, '1.vision.yield.md'),
    input.markdown,
  );

  // run the lane as the guard declares it
  const output = path.join(repoDir, '.review.output.md');
  const run = asRunFilled({
    run: await getRunOfMotiveLane({ repoDir }),
    output,
  });
  const result = spawnSync('bash', ['-c', run], {
    cwd: repoDir,
    encoding: 'utf-8',
    timeout: REVIEW_TIMEOUT_MS,
  });

  // keep the lane's review in the repo's gitignored .log/, so a red names its cause
  const logDir = path.join(REPO_ROOT, '.log', 'test', 'rootPurposeMotive');
  fs.mkdirSync(logDir, { recursive: true });
  if (fs.existsSync(output))
    fs.copyFileSync(output, path.join(logDir, `${input.slug}.review.md`));

  // read the two counts the guard reads (contract.reviewer-output)
  const blockers = result.stdout.match(/(\d+) blockers?\b/);
  const nitpicks = result.stdout.match(/(\d+) nitpicks?\b/);
  if (result.status !== 0 || !blockers || !nitpicks)
    throw new MalfunctionError('the motive lane gave no readable verdict', {
      exitCode: result.status,
      stdout: result.stdout.slice(-2000),
      stderr: result.stderr.slice(-2000),
      hint: 'the lane brain reads its key from the prep keyrack; unlock it (rhx keyrack unlock --owner ehmpath --env prep), then run: BRAIN_LIVE=true npx jest -c ./jest.integration.config.ts rootPurposeMotive',
    });
  return {
    blockers: Number(blockers[1]),
    nitpicks: Number(nitpicks[1]),
    stdout: result.stdout,
  };
};

/**
 * .what = the verdict as a plain object: its counts and the lane's stdout
 * .why  = a match on this shows the whole stdout in a red diff, so a miss names its cause
 */
const asVerdictShown = (verdict: {
  blockers: number;
  nitpicks: number;
  stdout: string;
}) => ({
  blockers: verdict.blockers,
  nitpicks: verdict.nitpicks,
  stdout: verdict.stdout,
});

describe('initBehaviorDir.rootPurposeMotive.brain', () => {
  given.runIf(RUN_BRAIN_TEST)(
    '[case1] a vision whose root purpose is a mechanism (catalog row 8)',
    () => {
      when('[t0] the motive lane runs live on the yield', () => {
        const verdict = useThen('the lane runs', async () =>
          runMotiveLaneOnYield({
            slug: 'root-purpose-motive-mechanism',
            wish: WISH,
            markdown: asYieldOfReminders({
              layers: [
                'surfers who book a lesson should get a reminder the day before',
                'a surfer who forgets misses the slot',
                'the reminder job must run on a nightly cron',
              ],
              outcome: OUTCOME_SERVES_ROOT,
            }),
          }),
        );

        then('it refuses the root with at least one blocker', () => {
          expect(verdict.blockers).toBeGreaterThanOrEqual(1);
        });
      });
    },
  );

  given.runIf(RUN_BRAIN_TEST)(
    '[case2] a vision whose root purpose digs to a motive (catalog row 1)',
    () => {
      when('[t0] the motive lane runs live on the yield', () => {
        const verdict = useThen('the lane runs', async () =>
          runMotiveLaneOnYield({
            slug: 'root-purpose-motive-motive',
            wish: WISH,
            markdown: asYieldOfReminders({
              layers: [
                'surfers who book a lesson should get a reminder the day before',
                'a surfer who forgets misses the slot, and the instructor waits on an empty beach',
                'an empty slot is an instructor hour the school pays for and never recovers',
              ],
              outcome: OUTCOME_SERVES_ROOT,
            }),
          }),
        );

        then('it approves the root with no blocker', () => {
          expect(asVerdictShown(verdict)).toMatchObject({ blockers: 0 }); // a red diff shows the lane stdout
        });
      });
    },
  );

  given.runIf(RUN_BRAIN_TEST)(
    '[case3] a vision whose root purpose is two motives deep (catalog row 6)',
    () => {
      when('[t0] the motive lane runs live on the yield', () => {
        const verdict = useThen('the lane runs', async () =>
          runMotiveLaneOnYield({
            slug: 'root-purpose-motive-shallow',
            wish: WISH,
            markdown: asYieldOfReminders({
              layers: [
                'surfers who book a lesson should get a reminder the day before',
                'a surfer who forgets misses the slot, and the instructor waits on an empty beach',
              ],
              outcome: OUTCOME_SERVES_ROOT,
            }),
          }),
        );

        then(
          'it raises no blocker: depth is the depth lane concern, never its own',
          () => {
            expect(asVerdictShown(verdict)).toMatchObject({ blockers: 0 }); // a red diff shows the lane stdout
          },
        );
      });
    },
  );

  given.runIf(RUN_BRAIN_TEST)(
    '[case4] a vision whose root is a motive, over a shape that ignores it (catalog row 8b)',
    () => {
      when('[t0] the motive lane runs live on the yield', () => {
        const verdict = useThen('the lane runs', async () =>
          runMotiveLaneOnYield({
            slug: 'root-purpose-motive-ignored',
            wish: WISH,
            markdown: asYieldOfReminders({
              layers: [
                'surfers who book a lesson should get a reminder the day before',
                'a surfer who forgets misses the slot, and the instructor waits on an empty beach',
                'an empty slot is an instructor hour the school pays for and never recovers',
              ],
              outcome:
                'the school site gets a new logo, a darker palette, and a photo gallery of past swells. reminders are not in scope.',
            }),
          }),
        );

        then('it raises a nitpick on the shape, never a blocker', () => {
          expect(asVerdictShown(verdict)).toMatchObject({ blockers: 0 }); // a red diff shows the lane stdout
          expect(verdict.nitpicks).toBeGreaterThanOrEqual(1);
        });
      });
    },
  );

  // the depth lane alone owns presence, count, and scaffold; the motive lane must stay silent on
  // each, so the author never meets two sources for one fix
  const CASES_SILENT: {
    description: string;
    slug: string;
    markdown: string;
  }[] = [
    {
      description:
        '[case5] a vision with no root purpose section (catalog row 3)',
      slug: 'root-purpose-motive-absent',
      markdown: [
        '# vision: sandpine lesson reminders',
        '',
        '## the outcome world',
        '',
        OUTCOME_SERVES_ROOT,
        '',
      ].join('\n'),
    },
    {
      description:
        '[case6] a vision whose root purpose is the scaffold left verbatim (catalog row 4)',
      slug: 'root-purpose-motive-scaffold',
      markdown: asYieldOfReminders({
        layers: [
          '<the surface motive — why the wisher asked>',
          '<the motive beneath it>',
          '<the root motive — the one that no longer shifts>',
        ],
        outcome: OUTCOME_SERVES_ROOT,
      }),
    },
  ];
  CASES_SILENT.map((thisCase) =>
    given.runIf(RUN_BRAIN_TEST)(thisCase.description, () => {
      when('[t0] the motive lane runs live on the yield', () => {
        const verdict = useThen('the lane runs', async () =>
          runMotiveLaneOnYield({
            slug: thisCase.slug,
            wish: WISH,
            markdown: thisCase.markdown,
          }),
        );

        then(
          'it raises no blocker: presence and scaffold are the depth lane concern',
          () => {
            expect(asVerdictShown(verdict)).toMatchObject({ blockers: 0 }); // a red diff shows the lane stdout
          },
        );
      });
    }),
  );

  // each yield below names a mechanism, or no motive at all, somewhere in its root; the lane
  // must refuse it
  const CASES_REFUSED: {
    description: string;
    slug: string;
    wish: string;
    markdown: string;
  }[] = [
    {
      description:
        '[case7] a vision whose layers are filler words (catalog row 5k)',
      slug: 'root-purpose-motive-filler',
      wish: WISH,
      markdown: asYieldOfReminders({
        layers: ['tbd', 'n/a', 'because'],
        outcome: OUTCOME_SERVES_ROOT,
      }),
    },
    {
      description:
        '[case8] a vision two layers deep whose second layer is a mechanism (catalog row 7)',
      slug: 'root-purpose-motive-shallow-mechanism',
      wish: WISH,
      markdown: asYieldOfReminders({
        layers: [
          'surfers who book a lesson should get a reminder the day before',
          'the reminder service must read lesson times from the bookings table',
        ],
        outcome: OUTCOME_SERVES_ROOT,
      }),
    },
    {
      description:
        '[case9] a vision four layers deep whose root is a mechanism (catalog row 9)',
      slug: 'root-purpose-motive-deep-mechanism',
      wish: WISH,
      markdown: asYieldOfReminders({
        layers: [
          'surfers who book a lesson should get a reminder the day before',
          'a surfer who forgets misses the slot',
          'an empty slot is an instructor hour never recovered',
          'so every reminder flows through one queue the ops team can replay',
        ],
        outcome: OUTCOME_SERVES_ROOT,
      }),
    },
    {
      description:
        '[case10] a developer-tool vision whose root is a mechanism in motive words, held out of the rule (catalog row 10b)',
      slug: 'root-purpose-motive-tool-mechanism',
      wish: WISH_OF_TOOL,
      markdown: asYield({
        title: 'every vision digs to its root purpose',
        layers: [
          'a reviewer should know why a vision is wanted before they grade its shape',
          'a reviewer who reads no motive approves whatever looks tidy',
          'so each yield passes through a second model review before the stone can advance',
        ],
        outcome: OUTCOME_OF_TOOL_SERVES_ROOT,
      }),
    },
  ];
  CASES_REFUSED.map((thisCase) =>
    given.runIf(RUN_BRAIN_TEST)(thisCase.description, () => {
      when('[t0] the motive lane runs live on the yield', () => {
        const verdict = useThen('the lane runs', async () =>
          runMotiveLaneOnYield({
            slug: thisCase.slug,
            wish: thisCase.wish,
            markdown: thisCase.markdown,
          }),
        );

        then('it refuses the root with at least one blocker', () => {
          expect(verdict.blockers).toBeGreaterThanOrEqual(1);
        });
      });
    }),
  );

  given.runIf(RUN_BRAIN_TEST)(
    '[case11] a terse developer-tool vision whose root is a motive (catalog row 10)',
    () => {
      when('[t0] the motive lane runs live on the yield', () => {
        const verdict = useThen('the lane runs', async () =>
          runMotiveLaneOnYield({
            slug: 'root-purpose-motive-tool-motive',
            wish: WISH_OF_TOOL,
            markdown: asYield({
              title: 'every vision digs to its root purpose',
              layers: [
                'a reviewer should know why a vision is wanted before they grade it',
                'a reviewer who reads no motive approves whatever looks tidy',
                'the wisher then gets work they did not want, and pays for it twice',
              ],
              outcome: OUTCOME_OF_TOOL_SERVES_ROOT,
            }),
          }),
        );

        then('it approves the root with no blocker', () => {
          expect(asVerdictShown(verdict)).toMatchObject({ blockers: 0 }); // a red diff shows the lane stdout
        });
      });
    },
  );
});
