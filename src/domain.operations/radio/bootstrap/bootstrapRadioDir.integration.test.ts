import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { given, then, useBeforeAll, when } from 'test-fns';

import { RadioTaskRepo } from '../../../domain.objects/RadioTaskRepo';
import { bootstrapRadioDir } from './bootstrapRadioDir';
import { getGlobalRadioRoot, getRadioPath } from './getRadioPath';

describe('bootstrapRadioDir', () => {
  // use unique repo per test run
  const testRepo = new RadioTaskRepo({
    owner: 'bootstrap-test',
    name: `repo-${Date.now()}`,
  });
  const testCwd = path.join(os.tmpdir(), `radio-test-${Date.now()}`);
  const globalDir = getRadioPath({
    repo: testRepo,
    variant: 'global',
  }).radioDir;

  // setup temp directory
  beforeAll(async () => {
    await fs.mkdir(testCwd, { recursive: true });
  });

  // cleanup after all tests
  afterAll(async () => {
    await fs.rm(testCwd, { recursive: true, force: true });
    await fs.rm(globalDir, { recursive: true, force: true });
  });

  given('[case1] first bootstrap for a repo', () => {
    const result = useBeforeAll(async () => {
      return bootstrapRadioDir({ repo: testRepo, cwd: testCwd });
    });

    when('[t0] bootstrap completes', () => {
      then('returns globalDir path', () => {
        expect(result.globalDir).toEqual(globalDir);
      });

      then('returns localSymlink path', () => {
        expect(result.localSymlink).toEqual(path.join(testCwd, '.radio'));
      });
    });

    when('[t1] global root readme', () => {
      then('exists at ~/git/.radio/readme.md', async () => {
        const readmePath = path.join(getGlobalRadioRoot(), 'readme.md');
        const exists = await fs
          .access(readmePath)
          .then(() => true)
          .catch(() => false);
        expect(exists).toBe(true);
      });

      then('contains global radio documentation', async () => {
        const readmePath = path.join(getGlobalRadioRoot(), 'readme.md');
        const content = await fs.readFile(readmePath, 'utf-8');
        expect(content).toContain('global radio directory');
      });
    });

    when('[t2] repo readme', () => {
      then('exists in repo radio directory', async () => {
        const readmePath = path.join(globalDir, 'readme.md');
        const exists = await fs
          .access(readmePath)
          .then(() => true)
          .catch(() => false);
        expect(exists).toBe(true);
      });

      then('contains repo-specific documentation', async () => {
        const readmePath = path.join(globalDir, 'readme.md');
        const content = await fs.readFile(readmePath, 'utf-8');
        expect(content).toContain(testRepo.owner);
        expect(content).toContain(testRepo.name);
      });
    });

    when('[t3] local symlink', () => {
      then('exists at cwd/.radio', async () => {
        const symlinkPath = path.join(testCwd, '.radio');
        const exists = await fs
          .access(symlinkPath)
          .then(() => true)
          .catch(() => false);
        expect(exists).toBe(true);
      });

      then('is a symbolic link', async () => {
        const symlinkPath = path.join(testCwd, '.radio');
        const stat = await fs.lstat(symlinkPath);
        expect(stat.isSymbolicLink()).toBe(true);
      });

      then('points to global radio directory', async () => {
        const symlinkPath = path.join(testCwd, '.radio');
        const target = await fs.readlink(symlinkPath);
        expect(target).toEqual(globalDir);
      });
    });
  });

  given('[case2] repeated bootstrap is idempotent', () => {
    when('[t0] bootstrap called twice', () => {
      then('second call succeeds without error', async () => {
        // first call already done in case1
        const result = await bootstrapRadioDir({
          repo: testRepo,
          cwd: testCwd,
        });
        expect(result.globalDir).toEqual(globalDir);
      });
    });
  });
});
