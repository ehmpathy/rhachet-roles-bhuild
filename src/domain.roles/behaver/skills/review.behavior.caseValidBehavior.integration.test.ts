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
  given('[case1] valid behavior with all artifacts', () => {
    const scene = useBeforeAll(async () => {
      const fixture = path.join(FIXTURES_PATH, 'valid-behavior');
      const gitRepo = prepareFixtureWithGit(fixture);
      return { gitRepo };
    });

    afterAll(() => {
      fs.rmSync(scene.gitRepo, { recursive: true, force: true });
    });

    when('[t0] --against wish', () => {
      then('creates feedback file for wish review', () => {
        const result = spawnSync(
          'bash',
          [
            SKILL_PATH,
            '--of',
            'get-weather-emoji',
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
          '.behavior/v2025_01_01.get-weather-emoji',
        );
        const feedbackFile = findFeedbackFile(behaviorDir, 'wish');
        expect(feedbackFile).toBeDefined();
      });
    });

    when('[t1] --against criteria', () => {
      then('creates feedback file for criteria review', () => {
        const result = spawnSync(
          'bash',
          [
            SKILL_PATH,
            '--of',
            'get-weather-emoji',
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
          '.behavior/v2025_01_01.get-weather-emoji',
        );
        const feedbackFile = findFeedbackFile(behaviorDir, 'criteria');
        expect(feedbackFile).toBeDefined();
      });
    });

    when('[t2] --against blueprint', () => {
      then('creates feedback file for blueprint review', () => {
        const result = spawnSync(
          'bash',
          [
            SKILL_PATH,
            '--of',
            'get-weather-emoji',
            '--against',
            'blueprint',
            '--dir',
            scene.gitRepo,
          ],
          { timeout: 180000 },
        );

        expect(result.status).toBe(0);

        const behaviorDir = path.join(
          scene.gitRepo,
          '.behavior/v2025_01_01.get-weather-emoji',
        );
        const feedbackFile = findFeedbackFile(behaviorDir, 'blueprint');
        expect(feedbackFile).toBeDefined();
      });
    });

    when('[t3] --against roadmap', () => {
      then('creates feedback file for roadmap review', () => {
        const result = spawnSync(
          'bash',
          [
            SKILL_PATH,
            '--of',
            'get-weather-emoji',
            '--against',
            'roadmap',
            '--dir',
            scene.gitRepo,
          ],
          { timeout: 180000 },
        );

        expect(result.status).toBe(0);

        const behaviorDir = path.join(
          scene.gitRepo,
          '.behavior/v2025_01_01.get-weather-emoji',
        );
        const feedbackFile = findFeedbackFile(behaviorDir, 'roadmap');
        expect(feedbackFile).toBeDefined();
      });
    });
  });
});
