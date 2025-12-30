import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';

import { given, then, when } from 'test-fns';

import { BehaviorGathered } from '../../../../domain.objects/BehaviorGathered';
import {
  getBehaviorGatheredBlueprint,
  getBehaviorGatheredCriteria,
  getBehaviorGatheredVision,
  getBehaviorGatheredWish,
} from './getBehaviorGatheredFileContent';

describe('getBehaviorGatheredFileContent', () => {
  given('[case1] behavior with standard file names', () => {
    when('[t0] getting wish content', () => {
      then('should return content from 0.wish.md', async () => {
        const tempDir = path.join(os.tmpdir(), `test-content-${Date.now()}-1`);
        await fs.mkdir(tempDir, { recursive: true });
        await fs.writeFile(path.join(tempDir, '0.wish.md'), 'my wish content');

        const gathered = new BehaviorGathered({
          gatheredAt: new Date().toISOString(),
          behavior: { org: 'test', repo: 'repo', name: 'test-behavior' },
          contentHash: 'hash1',
          status: 'wished',
          files: [{ uri: path.join(tempDir, '0.wish.md') }],
          source: { type: 'repo.local' },
        });

        const content = await getBehaviorGatheredWish({ gathered });
        expect(content).toEqual('my wish content');

        await fs.rm(tempDir, { recursive: true });
      });
    });

    when('[t1] getting vision content', () => {
      then('should return content from 1.vision.md', async () => {
        const tempDir = path.join(os.tmpdir(), `test-content-${Date.now()}-2`);
        await fs.mkdir(tempDir, { recursive: true });
        await fs.writeFile(
          path.join(tempDir, '1.vision.md'),
          'my vision content',
        );

        const gathered = new BehaviorGathered({
          gatheredAt: new Date().toISOString(),
          behavior: { org: 'test', repo: 'repo', name: 'test-behavior' },
          contentHash: 'hash2',
          status: 'envisioned',
          files: [{ uri: path.join(tempDir, '1.vision.md') }],
          source: { type: 'repo.local' },
        });

        const content = await getBehaviorGatheredVision({ gathered });
        expect(content).toEqual('my vision content');

        await fs.rm(tempDir, { recursive: true });
      });
    });

    when('[t2] getting criteria content', () => {
      then('should return content from 2.criteria.md', async () => {
        const tempDir = path.join(os.tmpdir(), `test-content-${Date.now()}-3`);
        await fs.mkdir(tempDir, { recursive: true });
        await fs.writeFile(
          path.join(tempDir, '2.criteria.md'),
          'my criteria content',
        );

        const gathered = new BehaviorGathered({
          gatheredAt: new Date().toISOString(),
          behavior: { org: 'test', repo: 'repo', name: 'test-behavior' },
          contentHash: 'hash3',
          status: 'constrained',
          files: [{ uri: path.join(tempDir, '2.criteria.md') }],
          source: { type: 'repo.local' },
        });

        const content = await getBehaviorGatheredCriteria({ gathered });
        expect(content).toEqual('my criteria content');

        await fs.rm(tempDir, { recursive: true });
      });
    });
  });

  given('[case2] behavior with decomposed files', () => {
    when('[t0] getting wish from multiple decomposed files', () => {
      then('should concatenate all matching files', async () => {
        const tempDir = path.join(os.tmpdir(), `test-content-${Date.now()}-4`);
        await fs.mkdir(tempDir, { recursive: true });
        await fs.writeFile(path.join(tempDir, '0.wish.md'), 'main wish');
        await fs.writeFile(
          path.join(tempDir, '0.wish.details.md'),
          'wish details',
        );

        const gathered = new BehaviorGathered({
          gatheredAt: new Date().toISOString(),
          behavior: { org: 'test', repo: 'repo', name: 'test-behavior' },
          contentHash: 'hash4',
          status: 'wished',
          files: [
            { uri: path.join(tempDir, '0.wish.md') },
            { uri: path.join(tempDir, '0.wish.details.md') },
          ],
          source: { type: 'repo.local' },
        });

        const content = await getBehaviorGatheredWish({ gathered });
        expect(content).toContain('main wish');
        expect(content).toContain('wish details');

        await fs.rm(tempDir, { recursive: true });
      });
    });

    when('[t1] getting criteria from decomposed files', () => {
      then('should concatenate all 2.criteria.*.md files', async () => {
        const tempDir = path.join(os.tmpdir(), `test-content-${Date.now()}-5`);
        await fs.mkdir(tempDir, { recursive: true });
        await fs.writeFile(
          path.join(tempDir, '2.criteria.md'),
          'main criteria',
        );
        await fs.writeFile(
          path.join(tempDir, '2.criteria.blackbox.md'),
          'blackbox criteria',
        );

        const gathered = new BehaviorGathered({
          gatheredAt: new Date().toISOString(),
          behavior: { org: 'test', repo: 'repo', name: 'test-behavior' },
          contentHash: 'hash5',
          status: 'constrained',
          files: [
            { uri: path.join(tempDir, '2.criteria.md') },
            { uri: path.join(tempDir, '2.criteria.blackbox.md') },
          ],
          source: { type: 'repo.local' },
        });

        const content = await getBehaviorGatheredCriteria({ gathered });
        expect(content).toContain('main criteria');
        expect(content).toContain('blackbox criteria');

        await fs.rm(tempDir, { recursive: true });
      });
    });
  });

  given('[case3] behavior with blueprint files', () => {
    when('[t0] getting blueprint content', () => {
      then('should return content from *.blueprint.*.md files', async () => {
        const tempDir = path.join(os.tmpdir(), `test-content-${Date.now()}-6`);
        await fs.mkdir(tempDir, { recursive: true });
        await fs.writeFile(
          path.join(tempDir, '3.3.blueprint.v1.i1.md'),
          'blueprint content',
        );

        const gathered = new BehaviorGathered({
          gatheredAt: new Date().toISOString(),
          behavior: { org: 'test', repo: 'repo', name: 'test-behavior' },
          contentHash: 'hash6',
          status: 'blueprinted',
          files: [{ uri: path.join(tempDir, '3.3.blueprint.v1.i1.md') }],
          source: { type: 'repo.local' },
        });

        const content = await getBehaviorGatheredBlueprint({ gathered });
        expect(content).toEqual('blueprint content');

        await fs.rm(tempDir, { recursive: true });
      });
    });
  });

  given('[case4] behavior with no matching files', () => {
    when('[t0] getting content when file does not exist', () => {
      then('should return null', async () => {
        const gathered = new BehaviorGathered({
          gatheredAt: new Date().toISOString(),
          behavior: { org: 'test', repo: 'repo', name: 'test-behavior' },
          contentHash: 'hash7',
          status: 'wished',
          files: [],
          source: { type: 'repo.local' },
        });

        const wishContent = await getBehaviorGatheredWish({ gathered });
        const visionContent = await getBehaviorGatheredVision({ gathered });
        const criteriaContent = await getBehaviorGatheredCriteria({ gathered });
        const blueprintContent = await getBehaviorGatheredBlueprint({
          gathered,
        });

        expect(wishContent).toBeNull();
        expect(visionContent).toBeNull();
        expect(criteriaContent).toBeNull();
        expect(blueprintContent).toBeNull();
      });
    });
  });
});
