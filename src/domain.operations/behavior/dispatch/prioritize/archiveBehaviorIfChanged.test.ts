import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { given, then, when } from 'test-fns';

import { archiveBehaviorIfChanged } from './archiveBehaviorIfChanged';

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
    cost: { horizon: { weeks: 52 } },
    gain: {
      hourlyRate: 100,
      defaults: { baseYieldage: 100, transitiveMultiplier: 0.5 },
    },
    weights: { author: 1, support: 1 },
  },
  cacheDir: { mounted: { path: '/tmp/cache' } },
  brain: { repl: { imagine: jest.fn() } },
});

describe('archiveBehaviorIfChanged', () => {
  given('[case1] file does not exist', () => {
    when('[t0] writing new content', () => {
      then('creates file without archiving', async () => {
        const tempDir = path.join(os.tmpdir(), `test-archive-${Date.now()}-1`);
        await fs.mkdir(tempDir, { recursive: true });
        const filePath = path.join(tempDir, 'test.md');
        const context = mockContext();

        const result = await archiveBehaviorIfChanged(
          { filePath, newContent: 'new content' },
          context as any,
        );

        expect(result.archived).toEqual(false);
        expect(result.archivePath).toBeNull();

        const content = await fs.readFile(filePath, 'utf-8');
        expect(content).toEqual('new content');

        await fs.rm(tempDir, { recursive: true });
      });
    });
  });

  given('[case2] file exists with same content', () => {
    when('[t0] writing identical content', () => {
      then('does not archive', async () => {
        const tempDir = path.join(os.tmpdir(), `test-archive-${Date.now()}-2`);
        await fs.mkdir(tempDir, { recursive: true });
        const filePath = path.join(tempDir, 'test.md');
        await fs.writeFile(filePath, 'same content');
        const context = mockContext();

        const result = await archiveBehaviorIfChanged(
          { filePath, newContent: 'same content' },
          context as any,
        );

        expect(result.archived).toEqual(false);
        expect(result.archivePath).toBeNull();

        await fs.rm(tempDir, { recursive: true });
      });
    });
  });

  given('[case3] file exists with different content', () => {
    when('[t0] writing new content', () => {
      then('archives old file and writes new', async () => {
        const tempDir = path.join(os.tmpdir(), `test-archive-${Date.now()}-3`);
        await fs.mkdir(tempDir, { recursive: true });
        const filePath = path.join(tempDir, 'test.md');
        await fs.writeFile(filePath, 'old content');
        const context = mockContext();

        const result = await archiveBehaviorIfChanged(
          { filePath, newContent: 'new content' },
          context as any,
        );

        expect(result.archived).toEqual(true);
        expect(result.archivePath).not.toBeNull();

        // verify new content written
        const content = await fs.readFile(filePath, 'utf-8');
        expect(content).toEqual('new content');

        // verify archive exists with old content
        const archiveContent = await fs.readFile(result.archivePath!, 'utf-8');
        expect(archiveContent).toEqual('old content');

        await fs.rm(tempDir, { recursive: true });
      });
    });

    when('[t1] archiving creates .archive directory', () => {
      then('archive is stored in .archive subdirectory', async () => {
        const tempDir = path.join(os.tmpdir(), `test-archive-${Date.now()}-4`);
        await fs.mkdir(tempDir, { recursive: true });
        const filePath = path.join(tempDir, 'test.md');
        await fs.writeFile(filePath, 'old content');
        const context = mockContext();

        const result = await archiveBehaviorIfChanged(
          { filePath, newContent: 'new content' },
          context as any,
        );

        expect(result.archivePath).toContain('.archive');
        expect(result.archivePath).toContain('test.md');

        await fs.rm(tempDir, { recursive: true });
      });
    });
  });

  given('[case4] nested directory structure', () => {
    when('[t0] file is in nested directories', () => {
      then('creates parent directories if needed', async () => {
        const tempDir = path.join(os.tmpdir(), `test-archive-${Date.now()}-5`);
        const filePath = path.join(tempDir, 'deep', 'nested', 'test.md');
        const context = mockContext();

        const result = await archiveBehaviorIfChanged(
          { filePath, newContent: 'content' },
          context as any,
        );

        expect(result.archived).toEqual(false);
        const content = await fs.readFile(filePath, 'utf-8');
        expect(content).toEqual('content');

        await fs.rm(tempDir, { recursive: true });
      });
    });
  });
});
