import { spawnSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { given, then, useBeforeAll, when } from 'test-fns';

import {
  FIXTURES_PATH,
  findFeedbackFile,
  prepareFixtureWithGit,
  SKILL_PATH,
} from './review.behavior.test.utils';

describe('review.behavior', () => {
  given('[case9] behavior with well-formed artifacts', () => {
    const scene = useBeforeAll(async () => {
      const fixture = path.join(FIXTURES_PATH, 'behavior-well-formed');
      const gitRepo = prepareFixtureWithGit(fixture);
      return { gitRepo };
    });

    afterAll(() => {
      fs.rmSync(scene.gitRepo, { recursive: true, force: true });
    });

    when('[t0] review wish (clear desires, bounded scope)', () => {
      then('feedback has no blockers', () => {
        const result = spawnSync(
          'bash',
          [
            SKILL_PATH,
            '--of',
            'good-behavior',
            '--against',
            'wish',
            '--dir',
            scene.gitRepo,
          ],
          { timeout: 180000 },
        );

        expect(result.status).toBe(0);

        const behaviorDir = path.join(
          scene.gitRepo,
          '.behavior/v2025_01_01.good-behavior',
        );
        const feedbackFile = findFeedbackFile(behaviorDir, 'wish');
        expect(feedbackFile).toBeDefined();

        const content = fs.readFileSync(
          path.join(behaviorDir, feedbackFile!),
          'utf-8',
        );
        // match blockers but exclude "blocker.N = none" or "blockers: 0"
        expect(content.toLowerCase()).not.toMatch(
          /^# blocker\.\d+ = (?!none)/m,
        );
      });
    });

    when('[t1] review criteria (proper BDD format)', () => {
      then('feedback has no blockers', () => {
        const result = spawnSync(
          'bash',
          [
            SKILL_PATH,
            '--of',
            'good-behavior',
            '--against',
            'criteria',
            '--dir',
            scene.gitRepo,
          ],
          { timeout: 180000 },
        );

        expect(result.status).toBe(0);

        const behaviorDir = path.join(
          scene.gitRepo,
          '.behavior/v2025_01_01.good-behavior',
        );
        const feedbackFile = findFeedbackFile(behaviorDir, 'criteria');
        expect(feedbackFile).toBeDefined();

        const content = fs.readFileSync(
          path.join(behaviorDir, feedbackFile!),
          'utf-8',
        );
        // match blockers but exclude "blocker.N = none" or "blockers: 0"
        expect(content.toLowerCase()).not.toMatch(
          /^# blocker\.\d+ = (?!none)/m,
        );
      });
    });
  });
});
