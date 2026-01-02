import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { given, then, when } from 'test-fns';

import { getAllBehaviorGathered } from './getAllBehaviorGathered';

/**
 * .what = creates a mock context for testing with temp cache dir
 */
const mockContext = (cacheDir: string) => ({
  log: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
  config: {
    sources: { local: { enabled: true }, remote: [] },
    output: '/tmp/output',
    constraints: { maxConcurrency: 3 },
    cost: { horizon: 52 },
    gain: {
      hourlyRate: 100,
      defaults: { baseYieldage: 100, transitiveMultiplier: 0.5 },
    },
    weights: { author: 1, support: 1 },
  },
  cacheDir: { mounted: { path: cacheDir } },
  brain: { repl: { imagine: jest.fn() } },
});

describe('getAllBehaviorGathered', () => {
  given('[case1] repository with multiple behaviors', () => {
    when('[t0] local source is enabled', () => {
      then('gathers all behaviors from .behavior directory', async () => {
        const tempDir = path.join(os.tmpdir(), `test-getall-${Date.now()}-1`);
        const cacheDir = path.join(tempDir, '.cache');
        await fs.mkdir(cacheDir, { recursive: true });

        // create two behaviors
        const behavior1 = path.join(tempDir, '.behavior', 'feature-a');
        await fs.mkdir(behavior1, { recursive: true });
        await fs.writeFile(
          path.join(behavior1, '0.wish.md'),
          'wish for feature a',
        );

        const behavior2 = path.join(tempDir, '.behavior', 'feature-b');
        await fs.mkdir(behavior2, { recursive: true });
        await fs.writeFile(
          path.join(behavior2, '0.wish.md'),
          'wish for feature b',
        );
        await fs.writeFile(
          path.join(behavior2, '1.vision.md'),
          'vision for feature b',
        );

        const result = await getAllBehaviorGathered(
          { repoDir: tempDir },
          mockContext(cacheDir) as any,
        );

        expect(result).toHaveLength(2);
        expect(result.map((g) => g.behavior.name).sort()).toEqual([
          'feature-a',
          'feature-b',
        ]);

        await fs.rm(tempDir, { recursive: true });
      });
    });

    when('[t1] behaviors have different statuses', () => {
      then('correctly identifies each status', async () => {
        const tempDir = path.join(os.tmpdir(), `test-getall-${Date.now()}-2`);
        const cacheDir = path.join(tempDir, '.cache');
        await fs.mkdir(cacheDir, { recursive: true });

        // wished behavior
        const wished = path.join(tempDir, '.behavior', 'wished-only');
        await fs.mkdir(wished, { recursive: true });
        await fs.writeFile(path.join(wished, '0.wish.md'), 'wish');

        // delivered behavior
        const delivered = path.join(tempDir, '.behavior', 'completed');
        await fs.mkdir(delivered, { recursive: true });
        await fs.writeFile(path.join(delivered, '0.wish.md'), 'wish');
        await fs.writeFile(path.join(delivered, 'delivered.md'), 'delivered');

        const result = await getAllBehaviorGathered(
          { repoDir: tempDir },
          mockContext(cacheDir) as any,
        );

        expect(result).toHaveLength(2);

        const wishedBehavior = result.find(
          (g) => g.behavior.name === 'wished-only',
        );
        expect(wishedBehavior?.status).toEqual('wished');

        const completedBehavior = result.find(
          (g) => g.behavior.name === 'completed',
        );
        expect(completedBehavior?.status).toEqual('delivered');

        await fs.rm(tempDir, { recursive: true });
      });
    });
  });

  given('[case2] repository with no behaviors', () => {
    when('[t0] .behavior directory is empty', () => {
      then('returns empty array', async () => {
        const tempDir = path.join(os.tmpdir(), `test-getall-${Date.now()}-3`);
        const cacheDir = path.join(tempDir, '.cache');
        const behaviorDir = path.join(tempDir, '.behavior');
        await fs.mkdir(behaviorDir, { recursive: true });
        await fs.mkdir(cacheDir, { recursive: true });

        const result = await getAllBehaviorGathered(
          { repoDir: tempDir },
          mockContext(cacheDir) as any,
        );

        expect(result).toEqual([]);

        await fs.rm(tempDir, { recursive: true });
      });
    });

    when('[t1] .behavior directory does not exist', () => {
      then('returns empty array', async () => {
        const tempDir = path.join(os.tmpdir(), `test-getall-${Date.now()}-4`);
        const cacheDir = path.join(tempDir, '.cache');
        await fs.mkdir(cacheDir, { recursive: true });

        const result = await getAllBehaviorGathered(
          { repoDir: tempDir },
          mockContext(cacheDir) as any,
        );

        expect(result).toEqual([]);

        await fs.rm(tempDir, { recursive: true });
      });
    });
  });

  given('[case3] output artifacts', () => {
    when('[t0] gathering behaviors', () => {
      then('writes gathered.md summary to cache', async () => {
        const tempDir = path.join(os.tmpdir(), `test-getall-${Date.now()}-5`);
        const cacheDir = path.join(tempDir, '.cache');
        await fs.mkdir(cacheDir, { recursive: true });

        const behavior1 = path.join(tempDir, '.behavior', 'feature-a');
        await fs.mkdir(behavior1, { recursive: true });
        await fs.writeFile(path.join(behavior1, '0.wish.md'), 'wish');

        await getAllBehaviorGathered(
          { repoDir: tempDir },
          mockContext(cacheDir) as any,
        );

        const gatheredMdPath = path.join(cacheDir, 'gathered.md');
        const gatheredMd = await fs.readFile(gatheredMdPath, 'utf-8');
        expect(gatheredMd).toContain('# gathered behaviors');
        expect(gatheredMd).toContain('feature-a');

        await fs.rm(tempDir, { recursive: true });
      });
    });

    when('[t1] gathering behaviors', () => {
      then('writes gathered.json index to cache', async () => {
        const tempDir = path.join(os.tmpdir(), `test-getall-${Date.now()}-6`);
        const cacheDir = path.join(tempDir, '.cache');
        await fs.mkdir(cacheDir, { recursive: true });

        const behavior1 = path.join(tempDir, '.behavior', 'feature-a');
        await fs.mkdir(behavior1, { recursive: true });
        await fs.writeFile(path.join(behavior1, '0.wish.md'), 'wish');

        await getAllBehaviorGathered(
          { repoDir: tempDir },
          mockContext(cacheDir) as any,
        );

        const gatheredJsonPath = path.join(cacheDir, 'gathered.json');
        const gatheredJson = JSON.parse(
          await fs.readFile(gatheredJsonPath, 'utf-8'),
        );
        expect(gatheredJson).toHaveLength(1);
        expect(gatheredJson[0].behavior.name).toEqual('feature-a');

        await fs.rm(tempDir, { recursive: true });
      });
    });
  });

  given('[case4] local source disabled', () => {
    when('[t0] config disables local source', () => {
      then('returns empty array (no remote sources configured)', async () => {
        const tempDir = path.join(os.tmpdir(), `test-getall-${Date.now()}-7`);
        const cacheDir = path.join(tempDir, '.cache');
        await fs.mkdir(cacheDir, { recursive: true });

        const behavior1 = path.join(tempDir, '.behavior', 'feature-a');
        await fs.mkdir(behavior1, { recursive: true });
        await fs.writeFile(path.join(behavior1, '0.wish.md'), 'wish');

        const context = mockContext(cacheDir);
        context.config.sources.local.enabled = false;

        const result = await getAllBehaviorGathered(
          { repoDir: tempDir },
          context as any,
        );

        expect(result).toEqual([]);

        await fs.rm(tempDir, { recursive: true });
      });
    });
  });
});
