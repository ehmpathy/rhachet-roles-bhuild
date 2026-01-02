import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { given, then, when } from 'test-fns';

import { enumBehaviorDirs } from './enumBehaviorDirs';

describe('enumBehaviorDirs', () => {
  given('[case1] repository with .behavior directory', () => {
    when('[t0] .behavior contains subdirectories', () => {
      then('returns all behavior directory paths', async () => {
        const tempDir = path.join(os.tmpdir(), `test-enum-${Date.now()}-1`);
        await fs.mkdir(path.join(tempDir, '.behavior', 'feature-a'), {
          recursive: true,
        });
        await fs.mkdir(path.join(tempDir, '.behavior', 'feature-b'), {
          recursive: true,
        });

        const result = await enumBehaviorDirs({ repoDir: tempDir });

        expect(result).toHaveLength(2);
        expect(result.map((p) => path.basename(p)).sort()).toEqual([
          'feature-a',
          'feature-b',
        ]);

        await fs.rm(tempDir, { recursive: true });
      });
    });

    when('[t1] .behavior is empty', () => {
      then('returns empty array', async () => {
        const tempDir = path.join(os.tmpdir(), `test-enum-${Date.now()}-2`);
        await fs.mkdir(path.join(tempDir, '.behavior'), { recursive: true });

        const result = await enumBehaviorDirs({ repoDir: tempDir });

        expect(result).toEqual([]);

        await fs.rm(tempDir, { recursive: true });
      });
    });

    when('[t2] .behavior contains files (not directories)', () => {
      then('excludes files from result', async () => {
        const tempDir = path.join(os.tmpdir(), `test-enum-${Date.now()}-3`);
        await fs.mkdir(path.join(tempDir, '.behavior', 'feature-a'), {
          recursive: true,
        });
        await fs.writeFile(
          path.join(tempDir, '.behavior', 'readme.md'),
          'readme',
        );

        const result = await enumBehaviorDirs({ repoDir: tempDir });

        expect(result).toHaveLength(1);
        expect(path.basename(result[0]!)).toEqual('feature-a');

        await fs.rm(tempDir, { recursive: true });
      });
    });
  });

  given('[case2] repository without .behavior directory', () => {
    when('[t0] .behavior does not exist', () => {
      then('returns empty array', async () => {
        const tempDir = path.join(os.tmpdir(), `test-enum-${Date.now()}-4`);
        await fs.mkdir(tempDir, { recursive: true });

        const result = await enumBehaviorDirs({ repoDir: tempDir });

        expect(result).toEqual([]);

        await fs.rm(tempDir, { recursive: true });
      });
    });
  });
});
