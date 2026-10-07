import { ConstraintError } from 'helpful-errors';
import path from 'path';
import { getAllStones } from 'rhachet-roles-bhrain/sdk/route';
import { genTempDir, given, then, useBeforeAll, when } from 'test-fns';

import { getAllPeerLanesWithBrain } from '../../../.test/utils/getAllPeerLanesWithBrain';
import { BEHAVIOR_SIZE_ORDER } from './getAllTemplatesBySize';
import { initBehaviorDir } from './initBehaviorDir';

/**
 * .what = proves the brain each stone and each peer reviewer lands on, for every size × variant
 * .why  = the wish: design stones (prefix 1.–3.) drive on opus, build stones (prefix 4.–5.) on
 *         sonnet, sonnet reviewers on the current sonnet, and every other reviewer on the brain
 *         it ran on before. a template edit that drops a prescription must go red here.
 *
 * .note = the walk reads each route through bhrain's own `getAllStones` — its stone order and
 *         its guard parser — so the test proves what bhrain will dispatch, not a local reread.
 *         an unguarded stone keeps the prior brain (bhrain's sticky rule), so the walk carries
 *         the last declared brain forward.
 */

/**
 * .note = BRAIN_BUILD and REVIEWER_SONNET hold one string today, and stay separate on purpose:
 *         the wish names them as two decisions (the build stones' driver; the sonnet reviewers),
 *         so a bump of one is a choice, never a split. each is asserted on its own, and
 *         initBehaviorDir.brain.claude proves both reach the real cli
 */
const BRAIN_DESIGN = 'claude-opus-5-5[1m]';
const BRAIN_BUILD = 'claude-sonnet-5-5[1m]';
const REVIEWER_SONNET = 'claude-sonnet-5-5[1m]';

const GUARD_VARIANTS = ['light', 'heavy'] as const;

/**
 * .what = the label a lane carries when its run command names no brain
 * .why  = such a lane runs on the bhrain default; the label makes that explicit in assertions
 */
const BRAIN_OF_LANE_DEFAULT = '(bhrain default)';

/**
 * .what = the brain a stone's phase prescribes, read from its numeric prefix
 * .why  = the phase rule: a stone's phase is its place in the route
 */
const getOneBrainForStonePhase = (input: { stoneName: string }): string => {
  const prefix = Number(input.stoneName.split('.')[0]);
  if (prefix >= 1 && prefix <= 3) return BRAIN_DESIGN;
  if (prefix >= 4 && prefix <= 5) return BRAIN_BUILD;
  throw new ConstraintError('stone has a prefix outside 1.–5.', {
    stoneName: input.stoneName,
    hint: 'give the new prefix a phase in getOneBrainForStonePhase',
  });
};

/**
 * .what = walks a route in bhrain's order and records the brain each stone lands on
 * .why  = mirrors bhrain's dispatch: a guard's brain applies on entry, and an unguarded
 *         stone keeps the brain of the stone before it
 */
const getAllStoneBrainsByWalk = async (input: {
  route: string;
}): Promise<
  { stone: string; declared: string | null; landed: string | null }[]
> => {
  const stones = await getAllStones({ route: input.route });
  return stones.reduce<
    { stone: string; declared: string | null; landed: string | null }[]
  >((walked, stone) => {
    const declared = stone.guard?.brain?.choice ?? null;
    const landedPrior = walked.at(-1)?.landed ?? null;
    return [
      ...walked,
      { stone: stone.name, declared, landed: declared ?? landedPrior },
    ];
  }, []);
};

describe('initBehaviorDir.brain', () => {
  BEHAVIOR_SIZE_ORDER.forEach((size, sizeIndex) =>
    GUARD_VARIANTS.forEach((guard, guardIndex) =>
      given(
        `[case${sizeIndex * GUARD_VARIANTS.length + guardIndex + 1}] size=${size}, guard=${guard}`,
        () => {
          const scene = useBeforeAll(async () => {
            const repoDir = genTempDir({ slug: `brain-${size}-${guard}` });
            const behaviorDirRel = '.behavior/v2026_10_05.brain-walk';
            const route = path.join(repoDir, behaviorDirRel);
            initBehaviorDir({
              behaviorDir: route,
              behaviorDirRel,
              size,
              guard,
            });
            const walk = await getAllStoneBrainsByWalk({ route });
            const stones = await getAllStones({ route });
            return { walk, stones };
          });

          when('[t0] the route is walked in bhrain order', () => {
            then('every stone lands on the brain its phase prescribes', () => {
              const mismatches = scene.walk
                .map((step) => ({
                  ...step,
                  expected: getOneBrainForStonePhase({ stoneName: step.stone }),
                }))
                .filter((step) => step.landed !== step.expected);
              expect(mismatches).toEqual([]);
            });

            then('every guard declares a brain', () => {
              const guardsWithoutBrain = scene.stones
                .filter((stone) => stone.guard && !stone.guard.brain?.choice)
                .map((stone) => stone.guard?.path);
              expect(guardsWithoutBrain).toEqual([]);
            });

            then('the walk matches the snapshot', () => {
              const lines = scene.walk.map(
                (step) =>
                  `${step.stone} → ${step.landed}${step.declared ? '' : ' (inherited)'}`,
              );
              expect(lines).toHaveLength(scene.stones.length);
              expect(
                lines.filter(
                  (line) =>
                    !line.includes(`→ ${BRAIN_DESIGN}`) &&
                    !line.includes(`→ ${BRAIN_BUILD}`),
                ),
              ).toEqual([]);
              expect(lines).toMatchSnapshot();
            });
          });
        },
      ),
    ),
  );

  given(
    `[case${BEHAVIOR_SIZE_ORDER.length * GUARD_VARIANTS.length + 1}] every guard that init can write, across sizes and variants`,
    () => {
      const scene = useBeforeAll(async () => {
        const lanesPerRoute = await Promise.all(
          (['nano', 'giga'] as const).flatMap((size) =>
            GUARD_VARIANTS.map(async (guard) => {
              const repoDir = genTempDir({ slug: `lanes-${size}-${guard}` });
              const behaviorDirRel = '.behavior/v2026_10_05.lanes';
              const route = path.join(repoDir, behaviorDirRel);
              initBehaviorDir({
                behaviorDir: route,
                behaviorDirRel,
                size,
                guard,
              });
              const lanes = await getAllPeerLanesWithBrain({ route });
              return lanes.map((lane) => ({
                ...lane,
                brain: lane.brain ?? BRAIN_OF_LANE_DEFAULT, // no brain named → bhrain default
                route: `${size}.${guard}`,
              }));
            }),
          ),
        );
        return { lanes: lanesPerRoute.flat() };
      });

      when('[t0] each peer reviewer lane is read', () => {
        then('there is at least one claude lane to check', () => {
          expect(
            scene.lanes.filter((lane) => lane.isClaude).length,
          ).toBeGreaterThan(0);
        });

        then('every claude lane runs on the current sonnet', () => {
          const claudeOffSonnet = scene.lanes
            .filter((lane) => lane.isClaude && lane.brain !== REVIEWER_SONNET)
            .map(
              (lane) =>
                `${lane.route} · ${lane.stone} · ${lane.slug} → ${lane.brain}`,
            );
          expect(claudeOffSonnet).toEqual([]);
        });

        then(
          'every other lane keeps its baseline brain (bhrain default; no brain named)',
          () => {
            // explicit baseline, not a snapshot: any brain an rhx review lane names is a drift
            const otherOffBaseline = scene.lanes
              .filter(
                (lane) =>
                  !lane.isClaude && lane.brain !== BRAIN_OF_LANE_DEFAULT,
              )
              .map(
                (lane) =>
                  `${lane.route} · ${lane.stone} · ${lane.slug} → ${lane.brain}`,
              );
            expect(otherOffBaseline).toEqual([]);
          },
        );

        then('every lane brain matches the snapshot baseline', () => {
          const lines = scene.lanes.map(
            (lane) =>
              `${lane.route} · ${lane.stone} · ${lane.slug} → ${lane.brain}`,
          );
          expect(lines.length).toBeGreaterThan(0);
          expect(
            lines.filter(
              (line) =>
                !line.endsWith(`→ ${REVIEWER_SONNET}`) &&
                !line.endsWith(`→ ${BRAIN_OF_LANE_DEFAULT}`),
            ),
          ).toEqual([]);
          expect(lines).toMatchSnapshot();
        });
      });
    },
  );
});
