import { spawnSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { given, then, useBeforeAll, when } from 'test-fns';

import {
  FIXTURES_PATH,
  findFeedbackFile,
  prepareFixtureWithGit,
  SKILL_PATH,
} from './.test/utils';

describe('review.behavior', () => {
  given('[case8] behavior with intentional rule violations', () => {
    const scene = useBeforeAll(async () => {
      const fixture = path.join(FIXTURES_PATH, 'behavior-with-violations');
      const gitRepo = prepareFixtureWithGit({ fixturePath: fixture });
      return { gitRepo };
    });

    afterAll(() => {
      fs.rmSync(scene.gitRepo, { recursive: true, force: true });
    });

    when('[t0] review wish (vague, no clear desires)', () => {
      then('feedback contains blocker for unclear desires', () => {
        const result = spawnSync(
          'bash',
          [
            SKILL_PATH,
            '--of',
            'bad-behavior',
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
          '.behavior/v2025_01_01.bad-behavior',
        );
        const feedbackFile = findFeedbackFile({ dir: behaviorDir, pattern: 'wish' });
        expect(feedbackFile).toBeDefined();

        const content = fs.readFileSync(
          path.join(behaviorDir, feedbackFile!),
          'utf-8',
        );
        expect(content.toLowerCase()).toContain('blocker');
      });
    });

    when('[t1] review criteria (no BDD format)', () => {
      then('feedback contains blocker for BDD format not found', () => {
        const result = spawnSync(
          'bash',
          [
            SKILL_PATH,
            '--of',
            'bad-behavior',
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
          '.behavior/v2025_01_01.bad-behavior',
        );
        const feedbackFile = findFeedbackFile({ dir: behaviorDir, pattern: 'criteria' });
        expect(feedbackFile).toBeDefined();

        const content = fs.readFileSync(
          path.join(behaviorDir, feedbackFile!),
          'utf-8',
        );
        expect(content.toLowerCase()).toContain('blocker');
      });
    });
  });
});
