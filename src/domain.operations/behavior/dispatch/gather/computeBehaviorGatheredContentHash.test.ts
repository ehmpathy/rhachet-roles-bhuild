import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { given, then, when } from 'test-fns';

import { computeBehaviorGatheredContentHash } from './computeBehaviorGatheredContentHash';

describe('computeBehaviorGatheredContentHash', () => {
  given('[case1] behavior directory with files', () => {
    when('[t0] computing hash for single file', () => {
      then('returns deterministic sha256 hash', async () => {
        const tempDir = path.join(os.tmpdir(), `test-hash-${Date.now()}-1`);
        await fs.mkdir(tempDir, { recursive: true });
        await fs.writeFile(path.join(tempDir, '0.wish.md'), 'test wish');

        const hash1 = await computeBehaviorGatheredContentHash({
          behaviorDir: tempDir,
        });
        const hash2 = await computeBehaviorGatheredContentHash({
          behaviorDir: tempDir,
        });

        expect(hash1).toEqual(hash2);
        expect(hash1).toMatch(/^[a-f0-9]{64}$/);

        await fs.rm(tempDir, { recursive: true });
      });
    });

    when('[t1] computing hash for multiple files', () => {
      then('hash changes when any file changes', async () => {
        const tempDir = path.join(os.tmpdir(), `test-hash-${Date.now()}-2`);
        await fs.mkdir(tempDir, { recursive: true });
        await fs.writeFile(path.join(tempDir, '0.wish.md'), 'test wish');
        await fs.writeFile(path.join(tempDir, '1.vision.md'), 'test vision');

        const hashBefore = await computeBehaviorGatheredContentHash({
          behaviorDir: tempDir,
        });

        await fs.writeFile(path.join(tempDir, '1.vision.md'), 'updated vision');

        const hashAfter = await computeBehaviorGatheredContentHash({
          behaviorDir: tempDir,
        });

        expect(hashBefore).not.toEqual(hashAfter);

        await fs.rm(tempDir, { recursive: true });
      });
    });

    when('[t2] files are in different order on disk', () => {
      then('hash is same (deterministic)', async () => {
        const tempDir1 = path.join(os.tmpdir(), `test-hash-${Date.now()}-3a`);
        const tempDir2 = path.join(os.tmpdir(), `test-hash-${Date.now()}-3b`);
        await fs.mkdir(tempDir1, { recursive: true });
        await fs.mkdir(tempDir2, { recursive: true });

        // create files in different order
        await fs.writeFile(path.join(tempDir1, 'a.md'), 'content a');
        await fs.writeFile(path.join(tempDir1, 'b.md'), 'content b');

        await fs.writeFile(path.join(tempDir2, 'b.md'), 'content b');
        await fs.writeFile(path.join(tempDir2, 'a.md'), 'content a');

        const hash1 = await computeBehaviorGatheredContentHash({
          behaviorDir: tempDir1,
        });
        const hash2 = await computeBehaviorGatheredContentHash({
          behaviorDir: tempDir2,
        });

        expect(hash1).toEqual(hash2);

        await fs.rm(tempDir1, { recursive: true });
        await fs.rm(tempDir2, { recursive: true });
      });
    });

    when('[t3] directory contains nested subdirectories', () => {
      then('includes nested files in hash', async () => {
        const tempDir = path.join(os.tmpdir(), `test-hash-${Date.now()}-4`);
        await fs.mkdir(path.join(tempDir, 'nested'), { recursive: true });
        await fs.writeFile(path.join(tempDir, '0.wish.md'), 'wish');
        await fs.writeFile(path.join(tempDir, 'nested', 'detail.md'), 'detail');

        const hash1 = await computeBehaviorGatheredContentHash({
          behaviorDir: tempDir,
        });

        await fs.writeFile(
          path.join(tempDir, 'nested', 'detail.md'),
          'updated',
        );

        const hash2 = await computeBehaviorGatheredContentHash({
          behaviorDir: tempDir,
        });

        expect(hash1).not.toEqual(hash2);

        await fs.rm(tempDir, { recursive: true });
      });
    });
  });
});
