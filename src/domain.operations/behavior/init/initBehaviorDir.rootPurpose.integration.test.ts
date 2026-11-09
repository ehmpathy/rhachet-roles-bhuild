import fs from 'fs';
import { MalfunctionError } from 'helpful-errors';
import path from 'path';
import { genTempDir, given, then, useBeforeAll, useThen, when } from 'test-fns';

import { getOneBehaverBriefsDir } from '../../../domain.roles/.test/getOneBehaverBriefsDir';
import { getOneBehaverSkillsDir } from '../../../domain.roles/.test/getOneBehaverSkillsDir';
import { getOneVisionRootPurposeVerdict } from '../vision/getOneVisionRootPurposeVerdict';
import { VISION_ROOT_PURPOSE_DEPTH_FLOOR } from '../vision/rootPurpose/VISION_ROOT_PURPOSE_DEPTH_FLOOR';
import { initBehaviorDir } from './initBehaviorDir';

const ROUTE_REL = '.behavior/v2026_11_08.sandpine-lesson-reminders';

/**
 * .what = the root purpose scaffold block the vision stone hands its author
 * .why  = the clamp grades the very block an author copies, not a hand-typed twin
 */
const getOneScaffoldOfStone = (input: { stone: string }): string => {
  const match = input.stone.match(
    /```md\n(## \.the root purpose\n[\s\S]*?)```/,
  );
  if (!match)
    throw new MalfunctionError('vision stone holds no root purpose scaffold', {
      hint: 'the 1.vision.stone template lost its ```md fence of the section',
    });
  return match[1]!;
};

/**
 * .what = the scaffold with each `<…>` placeholder replaced by a motive
 * .why  = an author who fills the scaffold as handed must pass the depth lane
 */
const asScaffoldFilled = (input: { scaffold: string }): string => {
  const motives = [
    'surfers who book a lesson should get a reminder the day before',
    'a surfer who forgets misses the slot',
    'an empty slot is an instructor hour the school never recovers',
  ];
  return input.scaffold
    .split('\n')
    .reduce<{ index: number; lines: string[] }>(
      (state, line) => {
        // a line with no placeholder is kept as is
        if (!/- why: <[^<>]*>$/.test(line))
          return { index: state.index, lines: [...state.lines, line] };

        // a placeholder past the motives here means the template drifted; fail at the cause
        const motive = motives[state.index];
        if (motive === undefined)
          throw new MalfunctionError(
            'vision stone scaffold holds more placeholders than this clamp fills',
            {
              placeholders: state.index + 1,
              motives: motives.length,
              hint: 'the 1.vision.stone template changed its root purpose scaffold; add a motive here',
            },
          );
        return {
          index: state.index + 1,
          lines: [...state.lines, line.replace(/<[^<>]*>$/, motive)],
        };
      },
      { index: 0, lines: [] },
    )
    .lines.join('\n');
};

/**
 * .what = the depth lane's verdict on the inited route's yield, written with the given markdown
 * .why  = each case writes the yield an author would write, then reads it through the vision
 *         group's one public verdict, as the guard's depth lane does — no reach into its parts
 */
const getVerdictOfYield = (input: { repoDir: string; markdown: string }) => {
  fs.writeFileSync(
    path.join(input.repoDir, ROUTE_REL, '1.vision.yield.md'),
    input.markdown,
  );
  return getOneVisionRootPurposeVerdict(
    { vision: `${ROUTE_REL}/1.vision.yield.md` },
    { cwd: input.repoDir },
  );
};

describe('initBehaviorDir.rootPurpose', () => {
  given('[case1] a route inited by initBehaviorDir', () => {
    const scene = useBeforeAll(async () => {
      const repoDir = genTempDir({ slug: 'vision-root-purpose' });
      initBehaviorDir({
        behaviorDir: path.join(repoDir, ROUTE_REL),
        behaviorDirRel: ROUTE_REL,
      });
      const stone = fs.readFileSync(
        path.join(repoDir, ROUTE_REL, '1.vision.stone'),
        'utf-8',
      );
      return { repoDir, stone, scaffold: getOneScaffoldOfStone({ stone }) };
    });

    when('[t0] the vision stone is read', () => {
      then(
        'the stone asks for the root purpose before the outcome world',
        () => {
          const atPurpose = scene.stone.indexOf('## .the root purpose');
          const atOutcome = scene.stone.indexOf('## the outcome world');
          expect(atPurpose).toBeGreaterThan(-1);
          expect(atPurpose).toBeLessThan(atOutcome);
        },
      );

      then(
        'the scaffold holds 3 placeholder layers, each nested deeper',
        () => {
          const indents = scene.scaffold
            .split('\n')
            .filter((line) => /- why: <[^<>]*>$/.test(line))
            .map((line) => line.indexOf('-'));
          expect(indents).toEqual([0, 2, 4]);
        },
      );

      then('the scaffold matches the snapshot', () => {
        expect(scene.scaffold).toMatchSnapshot();
      });

      then('the stone names the free local depth check, on this route', () => {
        expect(scene.stone).toContain(
          `rhx review.vision.root-purpose --vision '${ROUTE_REL}/1.vision.yield.md'`,
        );
      });
    });

    when('[t1] the scaffold is copied into a yield as is', () => {
      const verdict = useThen('the depth lane reads it', async () =>
        getVerdictOfYield({
          repoDir: scene.repoDir,
          markdown: scene.scaffold,
        }),
      );

      then('the depth lane is red', () => {
        expect(verdict.blockers).toEqual(1);
        expect(verdict.stdout).toContain('layers: 0 of 3');
        expect(verdict.stdout).toContain('no motive in 3 layers');
      });
    });

    when('[t2] each placeholder is filled with a motive', () => {
      const verdict = useThen('the depth lane reads it', async () =>
        getVerdictOfYield({
          repoDir: scene.repoDir,
          markdown: asScaffoldFilled({ scaffold: scene.scaffold }),
        }),
      );

      then('the depth lane is green, 3 layers deep', () => {
        expect(verdict.blockers).toEqual(0);
        expect(verdict.stdout).toContain('layers: 3 of 3');
      });
    });

    when('[t3] the filled scaffold loses its deepest layer', () => {
      const verdict = useThen('the depth lane reads it', async () => {
        const filled = asScaffoldFilled({ scaffold: scene.scaffold });
        const lines = filled.split('\n').filter((line) => line.trim() !== '');
        return getVerdictOfYield({
          repoDir: scene.repoDir,
          markdown: lines.slice(0, -1).join('\n'),
        });
      });

      then('the depth lane is red, 2 layers deep', () => {
        expect(verdict.blockers).toEqual(1);
        expect(verdict.stdout).toContain('layers: 2 of 3');
      });
    });

    when('[t4] the vision has no root purpose section', () => {
      const verdict = useThen('the depth lane reads it', async () =>
        getVerdictOfYield({
          repoDir: scene.repoDir,
          markdown: '# vision\n\n## the outcome world\n',
        }),
      );

      then('the depth lane is red', () => {
        expect(verdict.blockers).toEqual(1);
        expect(verdict.stdout).toContain('section: absent');
      });
    });
  });

  given('[case2] the prose that states the floor and the lane split', () => {
    const scene = useBeforeAll(async () => {
      // the prose a reader meets, with emphasis and line breaks flattened
      const asProseFlat = (input: { text: string }): string =>
        input.text.replace(/\*\*/g, '').replace(/\s+/g, ' ');
      const stone = fs.readFileSync(
        path.join(__dirname, 'templates', '1.vision.stone'),
        'utf-8',
      );
      // the briefs dir the role itself declares, never a hand-built path into its layout
      const dirOfBriefs = path.join(
        getOneBehaverBriefsDir(),
        'practices/behavior.vision',
      );
      const brief = fs.readFileSync(
        path.join(dirOfBriefs, 'rule.require.vision-root-purpose.md'),
        'utf-8',
      );
      const briefOfMotive = fs.readFileSync(
        path.join(dirOfBriefs, 'rule.forbid.vision-root-purpose-mechanism.md'),
        'utf-8',
      );
      // each other surface that states the floor in words: the skill's help, both guards
      const surfacesOfFloor = [
        path.join(getOneBehaverSkillsDir(), 'review.vision.root-purpose.sh'),
        path.join(__dirname, 'templates', '1.vision.guard.light'),
        path.join(__dirname, 'templates', '1.vision.guard.heavy'),
      ].map((file) => ({ file, text: fs.readFileSync(file, 'utf-8') }));
      return {
        stone: asProseFlat({ text: stone }),
        brief: asProseFlat({ text: brief }),
        briefOfMotive: asProseFlat({ text: briefOfMotive }),
        surfacesOfFloor,
      };
    });

    when('[t0] the stone and the brief are read', () => {
      then('each states the same floor the depth lane enforces', () => {
        const floor = `at least ${VISION_ROOT_PURPOSE_DEPTH_FLOOR} layers deep`;
        expect(scene.stone).toContain(floor);
        expect(scene.brief).toContain(floor);
      });

      then(
        'the skill help and both guards state that floor and no other',
        () => {
          // every `N layers` or `N nested \`- why:\` layers` names the floor; a raise must reach each
          const numbers = scene.surfacesOfFloor.map(({ file, text }) => ({
            file: path.basename(file),
            numbers: [
              ...text.matchAll(/\b(\d+) (?:nested `- why:` )?layers\b/g),
            ].map((match) => Number(match[1])),
          }));
          numbers.forEach((surface) =>
            expect(surface.numbers.length).toBeGreaterThan(0),
          );
          expect(
            numbers.filter((surface) =>
              surface.numbers.some(
                (number) => number !== VISION_ROOT_PURPOSE_DEPTH_FLOOR,
              ),
            ),
          ).toEqual([]);
        },
      );

      then('the stone points at both rules, and shows one motive pair', () => {
        expect(scene.stone).toContain('`rule.require.vision-root-purpose`');
        expect(scene.stone).toContain(
          '`rule.forbid.vision-root-purpose-mechanism`',
        );
        expect(scene.stone).toContain('a mechanism can wear motive words');
      });

      then("the motive lane's rule grades a filler layer as no motive", () => {
        expect(scene.briefOfMotive).toContain(
          'a filler layer names no gain or harm to anyone',
        );
      });

      then(
        'the brief keeps the motive lane off the depth lane concerns',
        () => {
          expect(scene.brief).toContain(
            'the motive lane stays silent on presence, count, and scaffold.',
          );
        },
      );

      then(
        "the motive lane's rule declares the depth concerns out of its grade",
        () => {
          expect(scene.briefOfMotive).toContain(
            'this rule does not grade presence, count, depth, form, or scaffold text.',
          );
        },
      );

      then(
        "the motive lane's rule never states the floor, so its brain cannot grade it",
        () => {
          expect(scene.briefOfMotive).not.toMatch(
            new RegExp(`\\b${VISION_ROOT_PURPOSE_DEPTH_FLOOR} layers?\\b`),
          );
        },
      );
    });
  });
});
