import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { given, then, when } from 'test-fns';

import { getOneBehaviorGathered } from './getOneBehaviorGathered';

/**
 * .what = creates a mock context for testing
 */
const mockContext = () => ({
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
  cacheDir: { mounted: { path: '/tmp/cache' } },
  brain: { repl: { imagine: jest.fn() } },
});

describe('getOneBehaviorGathered', () => {
  given('[case1] behavior directory exists', () => {
    when('[t0] looking up existing behavior by ref', () => {
      then('returns gathered behavior', async () => {
        const tempDir = path.join(os.tmpdir(), `test-getone-${Date.now()}-1`);
        const behaviorDir = path.join(tempDir, '.behavior', 'feature-a');
        await fs.mkdir(behaviorDir, { recursive: true });
        await fs.writeFile(path.join(behaviorDir, '0.wish.md'), 'test wish');

        const result = await getOneBehaviorGathered(
          {
            behavior: { org: 'test', repo: 'repo', name: 'feature-a' },
            repoDir: tempDir,
          },
          mockContext() as any,
        );

        expect(result).not.toBeNull();
        expect(result?.behavior.name).toEqual('feature-a');
        expect(result?.status).toEqual('wished');

        await fs.rm(tempDir, { recursive: true });
      });
    });

    when('[t1] behavior has multiple files', () => {
      then('gathers all files', async () => {
        const tempDir = path.join(os.tmpdir(), `test-getone-${Date.now()}-2`);
        const behaviorDir = path.join(tempDir, '.behavior', 'feature-b');
        await fs.mkdir(behaviorDir, { recursive: true });
        await fs.writeFile(path.join(behaviorDir, '0.wish.md'), 'wish');
        await fs.writeFile(path.join(behaviorDir, '1.vision.md'), 'vision');
        await fs.writeFile(path.join(behaviorDir, '2.criteria.md'), 'criteria');

        const result = await getOneBehaviorGathered(
          {
            behavior: { org: 'test', repo: 'repo', name: 'feature-b' },
            repoDir: tempDir,
          },
          mockContext() as any,
        );

        expect(result).not.toBeNull();
        expect(result?.files).toHaveLength(3);
        expect(result?.status).toEqual('constrained');

        await fs.rm(tempDir, { recursive: true });
      });
    });
  });

  given('[case2] behavior directory does not exist', () => {
    when('[t0] looking up non-existent behavior', () => {
      then('returns null', async () => {
        const tempDir = path.join(os.tmpdir(), `test-getone-${Date.now()}-3`);
        await fs.mkdir(tempDir, { recursive: true });

        const result = await getOneBehaviorGathered(
          {
            behavior: { org: 'test', repo: 'repo', name: 'non-existent' },
            repoDir: tempDir,
          },
          mockContext() as any,
        );

        expect(result).toBeNull();

        await fs.rm(tempDir, { recursive: true });
      });
    });

    when('[t1] .behavior directory missing entirely', () => {
      then('returns null', async () => {
        const tempDir = path.join(os.tmpdir(), `test-getone-${Date.now()}-4`);
        await fs.mkdir(tempDir, { recursive: true });

        const result = await getOneBehaviorGathered(
          {
            behavior: { org: 'test', repo: 'repo', name: 'any-behavior' },
            repoDir: tempDir,
          },
          mockContext() as any,
        );

        expect(result).toBeNull();

        await fs.rm(tempDir, { recursive: true });
      });
    });
  });

  given('[case3] behavior with delivered status', () => {
    when('[t0] behavior has delivered.md file', () => {
      then('status is delivered', async () => {
        const tempDir = path.join(os.tmpdir(), `test-getone-${Date.now()}-5`);
        const behaviorDir = path.join(
          tempDir,
          '.behavior',
          'completed-feature',
        );
        await fs.mkdir(behaviorDir, { recursive: true });
        await fs.writeFile(path.join(behaviorDir, '0.wish.md'), 'wish');
        await fs.writeFile(path.join(behaviorDir, 'delivered.md'), 'delivered');

        const result = await getOneBehaviorGathered(
          {
            behavior: { org: 'test', repo: 'repo', name: 'completed-feature' },
            repoDir: tempDir,
          },
          mockContext() as any,
        );

        expect(result).not.toBeNull();
        expect(result?.status).toEqual('delivered');

        await fs.rm(tempDir, { recursive: true });
      });
    });
  });
});
