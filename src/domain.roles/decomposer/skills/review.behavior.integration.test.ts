import * as path from 'path';
import { given, then, when } from 'test-fns';

import { invokeReviewBehaviorSkill } from '../../../.test/utils/invokeReviewBehaviorSkill';

const ASSETS_DIR = path.join(__dirname, '.test/assets/example.repo');

describe('review.behavior.sh', () => {
  given('[case1] behavior with artifacts under 30% threshold', () => {
    when('[t0] skill invoked', () => {
      then('exit code is 0', () => {
        const result = invokeReviewBehaviorSkill({
          behaviorName: 'feature',
          dir: path.join(ASSETS_DIR, 'already-decomposed'),
        });
        expect(result.exitCode).toEqual(0);
      });

      then('recommendation is DECOMPOSE_UNNEEDED', () => {
        const result = invokeReviewBehaviorSkill({
          behaviorName: 'feature',
          dir: path.join(ASSETS_DIR, 'already-decomposed'),
        });
        expect(result.stdout).toContain('DECOMPOSE_UNNEEDED');
      });

      then('does not emit hazard warning', () => {
        const result = invokeReviewBehaviorSkill({
          behaviorName: 'feature',
          dir: path.join(ASSETS_DIR, 'already-decomposed'),
        });
        expect(result.stdout).not.toContain('HAZARD');
      });
    });
  });

  given('[case2] behavior without criteria', () => {
    when('[t0] skill invoked', () => {
      then('exit code is non-zero', () => {
        const result = invokeReviewBehaviorSkill({
          behaviorName: 'incomplete',
          dir: path.join(ASSETS_DIR, 'no-criteria'),
        });
        expect(result.exitCode).not.toEqual(0);
      });
    });
  });

  given('[case3] behavior not found', () => {
    when('[t0] skill invoked with unknown name', () => {
      then('exit code is non-zero', () => {
        const result = invokeReviewBehaviorSkill({
          behaviorName: 'nonexistent',
          dir: path.join(ASSETS_DIR, 'already-decomposed'),
        });
        expect(result.exitCode).not.toEqual(0);
      });
    });
  });
});
