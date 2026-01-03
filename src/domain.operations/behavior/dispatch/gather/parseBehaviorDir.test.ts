import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { given, then, when } from 'test-fns';

import { parseBehaviorDir } from './parseBehaviorDir';

describe('parseBehaviorDir', () => {
  given('[case1] behavior directory with standard files', () => {
    when('[t0] parsing directory with wish only', () => {
      then('status should be wished', async () => {
        const tempDir = path.join(os.tmpdir(), `test-parse-${Date.now()}-1`);
        await fs.mkdir(tempDir, { recursive: true });
        await fs.writeFile(path.join(tempDir, '0.wish.md'), 'test wish');

        const result = await parseBehaviorDir({
          behaviorDir: tempDir,
          org: 'test',
          repo: 'repo',
          source: { type: 'repo.local' },
        });

        expect(result.status).toEqual('wished');
        await fs.rm(tempDir, { recursive: true });
      });
    });

    when('[t1] parsing directory with wish and vision', () => {
      then('status should be envisioned', async () => {
        const tempDir = path.join(os.tmpdir(), `test-parse-${Date.now()}-2`);
        await fs.mkdir(tempDir, { recursive: true });
        await fs.writeFile(path.join(tempDir, '0.wish.md'), 'test wish');
        await fs.writeFile(path.join(tempDir, '1.vision.md'), 'test vision');

        const result = await parseBehaviorDir({
          behaviorDir: tempDir,
          org: 'test',
          repo: 'repo',
          source: { type: 'repo.local' },
        });

        expect(result.status).toEqual('envisioned');
        await fs.rm(tempDir, { recursive: true });
      });
    });

    when('[t2] parsing directory with criteria', () => {
      then('status should be constrained', async () => {
        const tempDir = path.join(os.tmpdir(), `test-parse-${Date.now()}-3`);
        await fs.mkdir(tempDir, { recursive: true });
        await fs.writeFile(path.join(tempDir, '0.wish.md'), 'test wish');
        await fs.writeFile(path.join(tempDir, '1.vision.md'), 'test vision');
        await fs.writeFile(
          path.join(tempDir, '2.criteria.md'),
          'test criteria',
        );

        const result = await parseBehaviorDir({
          behaviorDir: tempDir,
          org: 'test',
          repo: 'repo',
          source: { type: 'repo.local' },
        });

        expect(result.status).toEqual('constrained');
        await fs.rm(tempDir, { recursive: true });
      });
    });

    when('[t3] parsing directory with blueprint files', () => {
      then('status should be blueprinted', async () => {
        const tempDir = path.join(os.tmpdir(), `test-parse-${Date.now()}-4`);
        await fs.mkdir(tempDir, { recursive: true });
        await fs.writeFile(path.join(tempDir, '0.wish.md'), 'test wish');
        await fs.writeFile(
          path.join(tempDir, '2.criteria.md'),
          'test criteria',
        );
        await fs.writeFile(
          path.join(tempDir, '3.3.blueprint.v1.i1.md'),
          'test blueprint',
        );

        const result = await parseBehaviorDir({
          behaviorDir: tempDir,
          org: 'test',
          repo: 'repo',
          source: { type: 'repo.local' },
        });

        expect(result.status).toEqual('blueprinted');
        await fs.rm(tempDir, { recursive: true });
      });
    });

    when('[t4] parsing directory with execution files', () => {
      then('status should be inflight', async () => {
        const tempDir = path.join(os.tmpdir(), `test-parse-${Date.now()}-5`);
        await fs.mkdir(tempDir, { recursive: true });
        await fs.writeFile(path.join(tempDir, '0.wish.md'), 'test wish');
        await fs.writeFile(
          path.join(tempDir, '5.1.execution.phase0.v1.i1.md'),
          'test execution',
        );

        const result = await parseBehaviorDir({
          behaviorDir: tempDir,
          org: 'test',
          repo: 'repo',
          source: { type: 'repo.local' },
        });

        expect(result.status).toEqual('inflight');
        await fs.rm(tempDir, { recursive: true });
      });
    });

    when('[t5] parsing directory with delivered flag', () => {
      then('status should be delivered', async () => {
        const tempDir = path.join(os.tmpdir(), `test-parse-${Date.now()}-6`);
        await fs.mkdir(tempDir, { recursive: true });
        await fs.writeFile(path.join(tempDir, '0.wish.md'), 'test wish');
        await fs.writeFile(path.join(tempDir, 'delivered.md'), 'delivered');

        const result = await parseBehaviorDir({
          behaviorDir: tempDir,
          org: 'test',
          repo: 'repo',
          source: { type: 'repo.local' },
        });

        expect(result.status).toEqual('delivered');
        await fs.rm(tempDir, { recursive: true });
      });
    });
  });

  given('[case2] behavior directory with decomposed files', () => {
    when('[t0] parsing directory with decomposed wish files', () => {
      then('status should be wished and files should be gathered', async () => {
        const tempDir = path.join(os.tmpdir(), `test-parse-${Date.now()}-7`);
        await fs.mkdir(tempDir, { recursive: true });
        await fs.writeFile(path.join(tempDir, '0.wish.summary.md'), 'summary');
        await fs.writeFile(path.join(tempDir, '0.wish.details.md'), 'details');

        const result = await parseBehaviorDir({
          behaviorDir: tempDir,
          org: 'test',
          repo: 'repo',
          source: { type: 'repo.local' },
        });

        expect(result.status).toEqual('wished');
        expect(result.files).toHaveLength(2);
        await fs.rm(tempDir, { recursive: true });
      });
    });

    when('[t1] parsing directory with decomposed criteria files', () => {
      then('status should be constrained', async () => {
        const tempDir = path.join(os.tmpdir(), `test-parse-${Date.now()}-8`);
        await fs.mkdir(tempDir, { recursive: true });
        await fs.writeFile(path.join(tempDir, '0.wish.md'), 'wish');
        await fs.writeFile(path.join(tempDir, '2.criteria.md'), 'criteria');
        await fs.writeFile(
          path.join(tempDir, '2.criteria.blackbox.md'),
          'blackbox criteria',
        );

        const result = await parseBehaviorDir({
          behaviorDir: tempDir,
          org: 'test',
          repo: 'repo',
          source: { type: 'repo.local' },
        });

        expect(result.status).toEqual('constrained');
        expect(result.files).toHaveLength(3);
        await fs.rm(tempDir, { recursive: true });
      });
    });
  });

  given('[case3] behavior directory with feedback files', () => {
    when('[t0] parsing directory containing feedback files', () => {
      then('feedback files should be excluded', async () => {
        const tempDir = path.join(os.tmpdir(), `test-parse-${Date.now()}-9`);
        await fs.mkdir(tempDir, { recursive: true });
        await fs.writeFile(path.join(tempDir, '0.wish.md'), 'wish');
        await fs.writeFile(path.join(tempDir, '2.criteria.md'), 'criteria');
        await fs.writeFile(
          path.join(tempDir, '2.criteria.md.[feedback].v1.[given].by_human.md'),
          'feedback',
        );
        await fs.writeFile(
          path.join(tempDir, '2.criteria.md.[feedback].v1.[taken].by_robot.md'),
          'response',
        );

        const result = await parseBehaviorDir({
          behaviorDir: tempDir,
          org: 'test',
          repo: 'repo',
          source: { type: 'repo.local' },
        });

        expect(result.files).toHaveLength(2);
        const fileNames = result.files.map((f) => path.basename(f.uri));
        expect(fileNames).toContain('0.wish.md');
        expect(fileNames).toContain('2.criteria.md');
        expect(fileNames).not.toContain(
          '2.criteria.md.[feedback].v1.[given].by_human.md',
        );
        expect(fileNames).not.toContain(
          '2.criteria.md.[feedback].v1.[taken].by_robot.md',
        );
        await fs.rm(tempDir, { recursive: true });
      });
    });
  });
});
