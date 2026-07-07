import fs from 'fs';
import path from 'path';
import { genTempDir, given, then, useBeforeAll, when } from 'test-fns';

import { getOneBehaviorArtifactPath } from './getOneBehaviorArtifactPath';

/**
 * .what = integration test for stone artifact discovery (touches filesystem)
 * .why  = locks the name contract the boot hook depends on: only the current
 *         template `${stoneName}.yield.md` is found; a stray legacy `.md` is
 *         not; each stone finds only its own exact yield, not a peer's.
 */

const genBehaviorDir = (input: { files: string[] }): string => {
  const dir = genTempDir({ slug: 'getOneBehaviorArtifactPath-test' });
  for (const file of input.files) {
    fs.writeFileSync(path.join(dir, file), `content of ${file}`);
  }
  return dir;
};

describe('getOneBehaviorArtifactPath', () => {
  given('[case1] a behavior with a current `.yield.md` vision', () => {
    const scene = useBeforeAll(async () => {
      const behaviorDir = genBehaviorDir({
        files: ['1.vision.yield.md', '1.vision.stone', '1.vision.guard'],
      });
      return { behaviorDir };
    });

    when('[t0] the vision stone is looked up', () => {
      then('it finds the `.yield.md` file', () => {
        const result = getOneBehaviorArtifactPath({
          behaviorDir: scene.behaviorDir,
          stoneName: '1.vision',
        });
        expect(result).toEqual(
          path.join(scene.behaviorDir, '1.vision.yield.md'),
        );
      });
    });
  });

  given('[case2] a behavior with only a legacy `.md` vision', () => {
    const scene = useBeforeAll(async () => {
      const behaviorDir = genBehaviorDir({ files: ['1.vision.md'] });
      return { behaviorDir };
    });

    when('[t0] the vision stone is looked up', () => {
      then('it returns null (legacy `.md` is not supported)', () => {
        const result = getOneBehaviorArtifactPath({
          behaviorDir: scene.behaviorDir,
          stoneName: '1.vision',
        });
        expect(result).toBeNull();
      });
    });
  });

  given('[case3] a behavior with peer criteria stones', () => {
    const scene = useBeforeAll(async () => {
      const behaviorDir = genBehaviorDir({
        files: [
          '2.1.criteria.blackbox.yield.md',
          '2.2.criteria.blackbox.matrix.yield.md',
          '2.3.criteria.blueprint.yield.md',
        ],
      });
      return { behaviorDir };
    });

    when('[t0] the blackbox criteria stone is looked up', () => {
      then('it finds only its own yield, not the matrix peer', () => {
        const result = getOneBehaviorArtifactPath({
          behaviorDir: scene.behaviorDir,
          stoneName: '2.1.criteria.blackbox',
        });
        expect(result).toEqual(
          path.join(scene.behaviorDir, '2.1.criteria.blackbox.yield.md'),
        );
      });
    });

    when('[t1] the blueprint criteria stone is looked up', () => {
      then('it finds its own yield', () => {
        const result = getOneBehaviorArtifactPath({
          behaviorDir: scene.behaviorDir,
          stoneName: '2.3.criteria.blueprint',
        });
        expect(result).toEqual(
          path.join(scene.behaviorDir, '2.3.criteria.blueprint.yield.md'),
        );
      });
    });
  });

  given('[case4] a behavior without the requested stone', () => {
    const scene = useBeforeAll(async () => {
      const behaviorDir = genBehaviorDir({ files: ['0.wish.md'] });
      return { behaviorDir };
    });

    when('[t0] a stone with no artifact is looked up', () => {
      then('it returns null', () => {
        const result = getOneBehaviorArtifactPath({
          behaviorDir: scene.behaviorDir,
          stoneName: '1.vision',
        });
        expect(result).toBeNull();
      });
    });
  });

  given('[case5] a behavior directory that is absent', () => {
    when('[t0] a stone is looked up', () => {
      then('it returns null without a throw', () => {
        const result = getOneBehaviorArtifactPath({
          behaviorDir: '/tmp/does-not-exist-getOneBehaviorArtifactPath',
          stoneName: '1.vision',
        });
        expect(result).toBeNull();
      });
    });
  });
});
