import { execSync } from 'child_process';
import fs from 'fs';
import { MalfunctionError } from 'helpful-errors';
import path from 'path';
import { parseReviewArgs } from 'rhachet-roles-bhrain/cli/review';
import { getAllStones } from 'rhachet-roles-bhrain/sdk/route';
import { genTempDir, given, then, useBeforeAll, when } from 'test-fns';

import { initBehaviorDir } from './initBehaviorDir';

/**
 * .what = proves each 1.vision peer lane's scope, as bhrain computes it, holds the experience files
 * .why  = the lanes grade the experience decomposition and its demos. bhrain drops route files
 *         other than `*.yield.md` as paperwork, and a glob that also matches the yield earns no
 *         exemption, so a bind of `$route/1.vision.*.md` alone hands the lanes the yield and
 *         naught else — an "approved" verdict on files the lane never read (bhuild#496)
 *
 * .note = the scope is walked by bhrain's own `getOneReviewScope` — diffs, paths, join, and the
 *         polluter drop — in a real git repo, from the lane's verbatim `run:` line. no brain is
 *         called. the walk is not a declared package export, so it is reached by its dist path;
 *         a bhrain upgrade that moves it fails this suite loud, never silent
 */
const BHRAIN_DIST = path.join(
  __dirname,
  '../../../../node_modules/rhachet-roles-bhrain/dist',
);
/**
 * .what = the slice of bhrain's `getOneReviewScope` contract this suite reads
 * .why  = the package exports map hides the function's own declaration, so the slice is
 *         declared here from `dist/domain.operations/review/getOneReviewScope.d.ts` (0.43.1,
 *         the version `package.json` pins)
 */
type GetOneReviewScope = (
  input: {
    review: {
      rules: string[];
      diffs?: string;
      paths?: string;
      pathsWith?: string[];
      pathsWout?: string[];
      polluters?: 'drop' | 'keep';
      join?: 'union' | 'intersect';
      refs?: string[];
      output: string;
      focus: 'pull' | 'push';
      goal: 'exhaustive' | 'representative';
    };
    brain: string;
    ruleFiles: string[];
    logDir: string;
    logDirRelative: string;
  },
  context: { cwd: string },
) => Promise<{ targets: { files: string[] } }>;

// note: an untyped require at a package boundary; the cast names the slice declared above.
//       remove once bhrain exports the scope walk (a declared export would type itself)
const { getOneReviewScope } = require(
  path.join(BHRAIN_DIST, 'domain.operations/review/getOneReviewScope.js'),
) as { getOneReviewScope: GetOneReviewScope };

const GUARD_VARIANTS = ['light', 'heavy'] as const;

const ROUTE_REL = '.behavior/v2026_10_19.vision-scope';

/**
 * .what = the vision artifacts a real route holds once the vision stone is written
 * .why  = the lanes must see the yield, the axes, the inventory, and each demo
 */
const VISION_FILES = [
  '0.wish.md',
  '1.vision.yield.md',
  '1.vision.experience.dimensions.md',
  '1.vision.experience.case=_.md',
  '1.vision.experience.case=1.book-a-lesson.md',
];

/**
 * .what = the criteria + blueprint yields a route holds once the blueprint stone is written
 * .why  = the blueprint `wisher-how` lane must see the criteria yield, since a light route
 *         runs no criteria guard and this lane is the first gate a criteria slip meets
 */
const BLUEPRINT_FILES = [
  '2.1.criteria.blackbox.yield.md',
  '2.2.criteria.blackbox.matrix.yield.md',
  '2.3.criteria.blueprint.yield.md',
  '3.3.1.blueprint.product.yield.md',
];

/**
 * .what = splits a guard `run:` line into argv, as a shell would for its quoted words
 * .why  = the lane's flags must reach bhrain's own parser verbatim
 */
const asArgvOfRun = (input: { run: string }): string[] =>
  [...input.run.matchAll(/'([^']*)'|"([^"]*)"|(\S+)/g)].map(
    (match) => match[1] ?? match[2] ?? match[3]!,
  );

/**
 * .what = the argv a guard would hand `rhx review`, with the guard's vars expanded
 * .why  = mirrors the guard's substitution; `--conversation` is dropped since no round has run
 */
const asReviewArgvOfLane = (input: {
  run: string;
  routeRel: string;
  output: string;
}): string[] => {
  const argvOfRun = asArgvOfRun({
    run: input.run
      .replace(/\$route/g, input.routeRel)
      .replace(/"\$output"/g, input.output),
  });

  // only a review lane has a review scope; any other verb fails here, never walked as a review
  if (argvOfRun[0] !== '$rhx' || argvOfRun[1] !== 'review')
    throw new MalfunctionError(
      'lane is not a review call, so it has no scope',
      {
        verb: argvOfRun.slice(0, 2).join(' '),
        hint: 'pass this lane slug out of the walk, via `slugs`',
      },
    );
  const argv = argvOfRun.slice(2); // drop `$rhx review`
  const at = argv.indexOf('--conversation');
  return at === -1 ? argv : [...argv.slice(0, at), ...argv.slice(at + 2)];
};

/**
 * .what = a scratch git repo on a feature branch, with a vision route written but uncommitted
 * .why  = `--diffs since-main` must see the route files as this branch's change
 */
const genRepoWithVisionRoute = (input: {
  guard: 'light' | 'heavy';
}): { repoDir: string } => {
  const repoDir = genTempDir({ slug: `vision-scope-${input.guard}` });
  execSync('git init -q -b main', { cwd: repoDir });
  execSync(
    'git -c user.name=bert -c user.email=bert@example.com commit -q --allow-empty -m init',
    { cwd: repoDir },
  );
  execSync('git checkout -q -b feat', { cwd: repoDir });
  const route = path.join(repoDir, ROUTE_REL);
  initBehaviorDir({
    behaviorDir: route,
    behaviorDirRel: ROUTE_REL,
    guard: input.guard,
  });
  [...VISION_FILES, ...BLUEPRINT_FILES].forEach((file) =>
    fs.writeFileSync(path.join(route, file), `# ${file}\n`),
  );
  return { repoDir };
};

/**
 * .what = writes a stub at each rule and ref path a lane names outside the route
 * .why  = the scope walk enumerates rules and refs; their content is not under test
 */
const setStubsForLaneSupplies = (input: {
  repoDir: string;
  rules: string[];
  refs: string[];
}): void =>
  [...input.rules, ...input.refs]
    .filter((file) => !file.startsWith(ROUTE_REL))
    .forEach((file) => {
      const at = path.join(input.repoDir, file);
      fs.mkdirSync(path.dirname(at), { recursive: true });
      fs.writeFileSync(at, `# ${path.basename(file)}\n`);
    });

/**
 * .what = findserts the log dir of one lane walk, and returns its path
 * .why = the walk's log and output land there, apart per stone and lane
 */
const genLaneLogDir = (input: {
  repoDir: string;
  stone: string;
  slug: string;
}): string => {
  const logDir = path.join(input.repoDir, '.log', input.stone, input.slug);
  fs.mkdirSync(logDir, { recursive: true });
  return logDir;
};

/**
 * .what = walks the scope of each peer lane a stone's guard declares, as bhrain computes it
 * .why  = one walk serves the vision lanes and the blueprint lane alike
 * .note = writes to the repo: a log dir per lane, and a stub at each rule and ref path the
 *         lane names outside the route (the stubs are idempotent; a rewrite holds the same text)
 */
const getAllLaneScopesOfStone = async (input: {
  repoDir: string;
  stone: string;
  slugs: string[] | null; // null = every lane; a list = those lanes alone
}): Promise<{ slug: string; files: string[] }[]> => {
  const stones = await getAllStones({
    route: path.join(input.repoDir, ROUTE_REL),
  });
  const lanes = (
    stones.find((stone) => stone.name === input.stone)?.guard?.reviews.peer ??
    []
  ).filter((lane) => input.slugs === null || input.slugs.includes(lane.slug));
  return Promise.all(
    lanes.map(async (lane) => {
      const logDir = genLaneLogDir({ ...input, slug: lane.slug });
      const options = parseReviewArgs(
        asReviewArgvOfLane({
          run: lane.run,
          routeRel: ROUTE_REL,
          output: path.join(logDir, 'output.md'),
        }),
      );
      setStubsForLaneSupplies({
        repoDir: input.repoDir,
        rules: options.rules ?? [],
        refs: options.refs ?? [],
      });
      const scope = await getOneReviewScope(
        {
          review: {
            rules: options.rules ?? [],
            diffs: options.diffs,
            paths: options.paths,
            pathsWith: options.pathsWith,
            pathsWout: options.pathsWout,
            // note: bhrain's arg parser types these two as plain strings, though it admits only
            //       the literals below; casts at the package boundary, removed with the require
            //       cast above once bhrain exports the scope walk
            polluters: options.polluters as 'drop' | 'keep',
            join: options.join as 'union' | 'intersect',
            refs: options.refs,
            output: options.output!,
            focus: 'push',
            goal: 'exhaustive',
          },
          brain: options.brain,
          ruleFiles: options.rules ?? [],
          logDir,
          logDirRelative: path.relative(input.repoDir, logDir),
        },
        { cwd: input.repoDir },
      );
      return {
        slug: lane.slug,
        files: [...scope.targets.files].sort(),
      };
    }),
  );
};

describe('initBehaviorDir.laneScope', () => {
  GUARD_VARIANTS.forEach((guard, index) =>
    given(`[case${index + 1}] a vision route, guard=${guard}`, () => {
      const scene = useBeforeAll(async () => {
        const { repoDir } = genRepoWithVisionRoute({ guard });
        const scopes = await getAllLaneScopesOfStone({
          repoDir,
          stone: '1.vision',
          slugs: null,
        });
        // the blueprint guard also holds `$rhx enroll` lanes, which are no `review` call
        const scopesBlueprint = await getAllLaneScopesOfStone({
          repoDir,
          stone: '3.3.1.blueprint.product',
          slugs: ['wisher-how'],
        });
        return { scopes, scopesBlueprint };
      });

      when('[t0] each vision peer lane scope is walked by bhrain', () => {
        then('the experience lanes and the wisher-how lane are present', () => {
          expect(scene.scopes.map((scope) => scope.slug).sort()).toEqual([
            'dimensional-decomposition',
            'experience-coverage',
            'wisher-how',
          ]);
        });

        then('every lane holds the dimensions file and the inventory', () => {
          scene.scopes.forEach((scope) => {
            expect(scope.files).toContain(
              `${ROUTE_REL}/1.vision.experience.dimensions.md`,
            );
            expect(scope.files).toContain(
              `${ROUTE_REL}/1.vision.experience.case=_.md`,
            );
          });
        });

        then('every lane holds the yield and each demo', () => {
          scene.scopes.forEach((scope) => {
            expect(scope.files).toContain(`${ROUTE_REL}/1.vision.yield.md`);
            expect(scope.files).toContain(
              `${ROUTE_REL}/1.vision.experience.case=1.book-a-lesson.md`,
            );
          });
        });

        then('the scopes match the snapshot', () => {
          expect(scene.scopes).toMatchSnapshot();
        });
      });

      when(
        '[t1] the blueprint wisher-how lane scope is walked by bhrain',
        () => {
          then(
            'the lane holds the criteria yield and the blueprint yield',
            () => {
              const lane = scene.scopesBlueprint.find(
                (scope) => scope.slug === 'wisher-how',
              );
              // the matrix is criteria too, so a how copied into it is graded as well
              expect(lane?.files).toEqual([
                `${ROUTE_REL}/2.1.criteria.blackbox.yield.md`,
                `${ROUTE_REL}/2.2.criteria.blackbox.matrix.yield.md`,
                `${ROUTE_REL}/2.3.criteria.blueprint.yield.md`,
                `${ROUTE_REL}/3.3.1.blueprint.product.yield.md`,
              ]);
              expect(lane).toMatchSnapshot();
            },
          );
        },
      );
    }),
  );
});
