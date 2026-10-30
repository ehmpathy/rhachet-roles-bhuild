import path from 'path';
import { getAllStones } from 'rhachet-roles-bhrain/sdk/route';
import { genTempDir, given, then, useBeforeAll, when } from 'test-fns';

import { BEHAVIOR_SIZE_ORDER } from './getAllTemplatesBySize';
import { initBehaviorDir } from './initBehaviorDir';

/**
 * .what = the clamp: every route init writes ends in 6.preship, then 7.reflect
 * .why  = a route that ends at verification or playtest leaves its work on the local tree, since no
 *         stone asks the driver to ship (#590). this goes red if any size or variant loses the
 *         tail, gains a stone after it, or reorders the two.
 *
 * .note = the route is read through bhrain's own `getAllStones`, so the order asserted is the
 *         order bhrain drives, not a local sort.
 */
const TAIL_EXPECTED = ['6.preship', '7.reflect'];
const GUARD_VARIANTS = ['light', 'heavy'] as const;

describe('initBehaviorDir.tail', () => {
  BEHAVIOR_SIZE_ORDER.forEach((size, sizeIndex) =>
    GUARD_VARIANTS.forEach((guard, guardIndex) =>
      given(
        `[case${sizeIndex * GUARD_VARIANTS.length + guardIndex + 1}] size=${size}, guard=${guard}`,
        () => {
          const scene = useBeforeAll(async () => {
            const repoDir = genTempDir({ slug: `tail-${size}-${guard}` });
            const behaviorDirRel = '.behavior/v2026_10_24.tail';
            const route = path.join(repoDir, behaviorDirRel);
            initBehaviorDir({
              behaviorDir: route,
              behaviorDirRel,
              size,
              guard,
            });
            const stones = await getAllStones({ route });
            return { names: stones.map((stone) => stone.name) };
          });

          when('[t0] the route is read in bhrain order', () => {
            then('its last two stones are 6.preship then 7.reflect', () => {
              expect(scene.names.slice(-2)).toEqual(TAIL_EXPECTED);
            });

            then('each tail stone appears exactly once', () => {
              const tailCounts = TAIL_EXPECTED.map(
                (name) => scene.names.filter((found) => found === name).length,
              );
              expect(tailCounts).toEqual([1, 1]);
            });
          });
        },
      ),
    ),
  );
});
