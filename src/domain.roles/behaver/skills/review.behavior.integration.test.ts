import { spawnSync } from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { given, then, useBeforeAll, when } from 'test-fns';

import {
  FIXTURES_PATH,
  prepareFixtureWithGit,
  SKILL_PATH,
} from './review.behavior.test.utils';

describe('review.behavior', () => {
  given('ambiguous behavior name', () => {
    const scene = useBeforeAll(async () => {
      const fixture = path.join(FIXTURES_PATH, 'ambiguous-behavior');
      const gitRepo = prepareFixtureWithGit(fixture);
      return { gitRepo };
    });

    afterAll(() => {
      fs.rmSync(scene.gitRepo, { recursive: true, force: true });
    });

    when('[t0] --of weather (matches multiple)', () => {
      then('fails fast listing matches', () => {
        const result = spawnSync('bash', [
          SKILL_PATH,
          '--of',
          'weather',
          '--against',
          'wish',
          '--dir',
          scene.gitRepo,
        ]);

        expect(result.status).not.toBe(0);
        expect(result.stdout.toString()).toContain('multiple behaviors match');
      });
    });
  });

  given('missing required arguments', () => {
    when('[t0] missing --of', () => {
      then('fails fast with usage guidance', () => {
        const result = spawnSync('bash', [SKILL_PATH, '--against', 'wish']);

        expect(result.status).not.toBe(0);
        expect(result.stdout.toString()).toContain('--of is required');
      });
    });
  });

  given('no .behavior directory', () => {
    when('[t0] skill invoked in dir without .behavior/', () => {
      then('fails fast with clear error', () => {
        const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'no-behavior-'));

        const result = spawnSync('bash', [
          SKILL_PATH,
          '--of',
          'anything',
          '--against',
          'wish',
          '--dir',
          tempDir,
        ]);

        fs.rmSync(tempDir, { recursive: true, force: true });

        expect(result.status).not.toBe(0);
        expect(result.stdout.toString()).toContain(
          '.behavior/ directory not found',
        );
      });
    });
  });

  given('behavior not found', () => {
    const scene = useBeforeAll(async () => {
      const fixture = path.join(FIXTURES_PATH, 'valid-behavior');
      const gitRepo = prepareFixtureWithGit(fixture);
      return { gitRepo };
    });

    afterAll(() => {
      fs.rmSync(scene.gitRepo, { recursive: true, force: true });
    });

    when('[t0] --of nonexistent', () => {
      then('fails fast listing available behaviors', () => {
        const result = spawnSync('bash', [
          SKILL_PATH,
          '--of',
          'nonexistent-behavior',
          '--against',
          'wish',
          '--dir',
          scene.gitRepo,
        ]);

        expect(result.status).not.toBe(0);
        const stdout = result.stdout.toString();
        expect(stdout).toContain('no behavior found');
        expect(stdout).toContain('available behaviors');
      });
    });
  });

  given('--help flag', () => {
    when('[t0] --help is passed', () => {
      then('shows usage and exits 0', () => {
        const result = spawnSync('bash', [SKILL_PATH, '--help']);

        expect(result.status).toBe(0);
        const stdout = result.stdout.toString();
        expect(stdout).toContain('usage:');
        expect(stdout).toContain('--of');
        expect(stdout).toContain('--against');
      });
    });
  });

  given('missing artifact file', () => {
    const scene = useBeforeAll(async () => {
      const fixture = path.join(FIXTURES_PATH, 'missing-criteria');
      const gitRepo = prepareFixtureWithGit(fixture);
      return { gitRepo };
    });

    afterAll(() => {
      fs.rmSync(scene.gitRepo, { recursive: true, force: true });
    });

    when('[t0] --against criteria (file missing)', () => {
      then('fails fast with clear error', () => {
        const result = spawnSync('bash', [
          SKILL_PATH,
          '--of',
          'foo',
          '--against',
          'criteria',
          '--dir',
          scene.gitRepo,
        ]);

        expect(result.status).not.toBe(0);
        expect(result.stdout.toString()).toContain('artifact not found');
      });
    });

    when('[t1] --against wish,criteria (one missing)', () => {
      then('fails fast with clear error', () => {
        const result = spawnSync('bash', [
          SKILL_PATH,
          '--of',
          'foo',
          '--against',
          'wish,criteria',
          '--dir',
          scene.gitRepo,
        ]);

        expect(result.status).not.toBe(0);
        expect(result.stdout.toString()).toContain('artifact not found');
      });
    });
  });
});
