import fs from 'fs';
import path from 'path';
import { genTempDir, given, then, useBeforeAll, when } from 'test-fns';

import { getAllBehaviorContextArtifacts } from './getAllBehaviorContextArtifacts';

/**
 * .what = integration test for the full ordered artifact set the boot hook emits
 *         (touches filesystem)
 * .why  = this is the exact gap the wish targets: after the `.yield.md` rename,
 *         the boot hook no longer found vision/criteria/blueprint. this test
 *         locks which artifacts are surfaced, by name, so the gap cannot reopen.
 */

const genBehaviorDir = (input: { files: string[] }): string => {
  const dir = genTempDir({ slug: 'getAllBehaviorContextArtifacts-test' });
  for (const file of input.files) {
    fs.writeFileSync(path.join(dir, file), `content of ${file}`);
  }
  return dir;
};

// map to { scope, file } so assertions ignore the temp-dir prefix
const asScopeAndFile = (
  artifacts: Array<{ scope: string; path: string; required: boolean }>,
): Array<{ scope: string; file: string; required: boolean }> =>
  artifacts.map((a) => ({
    scope: a.scope,
    file: path.basename(a.path),
    required: a.required,
  }));

describe('getAllBehaviorContextArtifacts', () => {
  given(
    '[case1] a fully-driven behavior with current `.yield.md` artifacts',
    () => {
      const scene = useBeforeAll(async () => {
        const behaviorDir = genBehaviorDir({
          files: [
            '0.wish.md',
            '1.vision.yield.md',
            '2.1.criteria.blackbox.yield.md',
            '2.3.criteria.blueprint.yield.md',
            '3.3.0.blueprint.factory.yield.md',
            '3.3.1.blueprint.product.yield.md',
            // noise that must NOT be surfaced
            '1.vision.stone',
            '1.vision.guard',
            '5.1.execution.from_vision.yield.md',
            '4.1.roadmap.yield.md',
            // a stray legacy `.md` that must NOT be surfaced
            '2.criteria.md',
          ],
        });
        return { behaviorDir };
      });

      when('[t0] the boot context artifacts are computed', () => {
        then(
          'it surfaces wish + vision + criteria pair + both blueprints, in order',
          () => {
            const result = getAllBehaviorContextArtifacts({
              behaviorDir: scene.behaviorDir,
            });
            expect(asScopeAndFile(result)).toEqual([
              { scope: 'wish', file: '0.wish.md', required: true },
              { scope: 'vision', file: '1.vision.yield.md', required: false },
              {
                scope: 'criteria-blackbox',
                file: '2.1.criteria.blackbox.yield.md',
                required: false,
              },
              {
                scope: 'criteria-blueprint',
                file: '2.3.criteria.blueprint.yield.md',
                required: false,
              },
              {
                scope: 'blueprint-factory',
                file: '3.3.0.blueprint.factory.yield.md',
                required: false,
              },
              {
                scope: 'blueprint',
                file: '3.3.1.blueprint.product.yield.md',
                required: false,
              },
            ]);
          },
        );

        then('it does NOT surface roadmap or execution work-notes', () => {
          const result = getAllBehaviorContextArtifacts({
            behaviorDir: scene.behaviorDir,
          });
          const files = result.map((a) => path.basename(a.path));
          expect(files).not.toContain('4.1.roadmap.yield.md');
          expect(files).not.toContain('5.1.execution.from_vision.yield.md');
        });

        then('it does NOT surface a stray legacy `.md`', () => {
          const result = getAllBehaviorContextArtifacts({
            behaviorDir: scene.behaviorDir,
          });
          const files = result.map((a) => path.basename(a.path));
          expect(files).not.toContain('2.criteria.md');
        });

        then('the surfaced set matches snapshot', () => {
          const result = getAllBehaviorContextArtifacts({
            behaviorDir: scene.behaviorDir,
          });
          expect(asScopeAndFile(result)).toMatchSnapshot();
        });
      });
    },
  );

  given('[case2] a behavior with only a wish', () => {
    const scene = useBeforeAll(async () => {
      const behaviorDir = genBehaviorDir({ files: ['0.wish.md'] });
      return { behaviorDir };
    });

    when('[t0] the boot context artifacts are computed', () => {
      then('it surfaces only the required wish', () => {
        const result = getAllBehaviorContextArtifacts({
          behaviorDir: scene.behaviorDir,
        });
        expect(asScopeAndFile(result)).toEqual([
          { scope: 'wish', file: '0.wish.md', required: true },
        ]);
      });
    });
  });

  given('[case3] a behavior whose wish file is absent', () => {
    const scene = useBeforeAll(async () => {
      const behaviorDir = genBehaviorDir({ files: ['1.vision.yield.md'] });
      return { behaviorDir };
    });

    when('[t0] the boot context artifacts are computed', () => {
      then(
        'the wish entry is still present and required (so the hook can warn)',
        () => {
          const result = getAllBehaviorContextArtifacts({
            behaviorDir: scene.behaviorDir,
          });
          const wish = result.find((a) => a.scope === 'wish');
          expect(wish).toBeDefined();
          expect(wish!.required).toEqual(true);
          expect(path.basename(wish!.path)).toEqual('0.wish.md');
        },
      );
    });
  });
});
