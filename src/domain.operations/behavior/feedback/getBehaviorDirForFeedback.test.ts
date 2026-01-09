import { execSync } from 'child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'fs';
import { BadRequestError } from 'helpful-errors';
import { tmpdir } from 'os';
import { join } from 'path';

import { getBehaviorDirForFeedback } from './getBehaviorDirForFeedback';

describe('getBehaviorDirForFeedback', () => {
  let testDir: string;
  let currentBranch: string;

  beforeEach(() => {
    testDir = mkdtempSync(join(tmpdir(), 'behavior-dir-test-'));

    // init git repo
    execSync('git init', { cwd: testDir });
    execSync('git config user.email "test@test.com"', { cwd: testDir });
    execSync('git config user.name "Test"', { cwd: testDir });

    // create initial commit so branch exists
    writeFileSync(join(testDir, 'README.md'), '# test');
    execSync('git add . && git commit -m "init"', { cwd: testDir });

    // get the actual current branch name
    currentBranch = execSync('git rev-parse --abbrev-ref HEAD', {
      cwd: testDir,
      encoding: 'utf-8',
    }).trim();
  });

  afterEach(() => {
    rmSync(testDir, { recursive: true, force: true });
  });

  const setupBehavior = (name: string) => {
    const behaviorDir = join(testDir, '.behavior', name);
    mkdirSync(behaviorDir, { recursive: true });
    return behaviorDir;
  };

  const setupBind = (behaviorName: string, branchName: string) => {
    const bindDir = join(testDir, '.behavior', behaviorName, '.bind');
    mkdirSync(bindDir, { recursive: true });
    const flatBranch = branchName.replace(/\//g, '.');
    writeFileSync(join(bindDir, `${flatBranch}.flag`), '');
  };

  test('bound + no flag → returns bind', () => {
    setupBehavior('v2025_01_01.feature');
    setupBind('v2025_01_01.feature', currentBranch);

    const result = getBehaviorDirForFeedback({}, { cwd: testDir });

    expect(result).toEqual(join(testDir, '.behavior/v2025_01_01.feature'));
  });

  test('bound + flag matches → returns bind', () => {
    setupBehavior('v2025_01_01.feature');
    setupBind('v2025_01_01.feature', currentBranch);

    const result = getBehaviorDirForFeedback(
      { behavior: 'feature' },
      { cwd: testDir },
    );

    expect(result).toEqual(join(testDir, '.behavior/v2025_01_01.feature'));
  });

  test('bound + flag differs + no force → throws', () => {
    setupBehavior('v2025_01_01.feature');
    setupBehavior('v2025_02_01.other');
    setupBind('v2025_01_01.feature', currentBranch);

    expect(() =>
      getBehaviorDirForFeedback({ behavior: 'other' }, { cwd: testDir }),
    ).toThrow(BadRequestError);
    expect(() =>
      getBehaviorDirForFeedback({ behavior: 'other' }, { cwd: testDir }),
    ).toThrow(/use --force to override/);
  });

  test('bound + flag differs + force → returns flag', () => {
    setupBehavior('v2025_01_01.feature');
    setupBehavior('v2025_02_01.other');
    setupBind('v2025_01_01.feature', currentBranch);

    const result = getBehaviorDirForFeedback(
      { behavior: 'other', force: true },
      { cwd: testDir },
    );

    expect(result).toEqual(join(testDir, '.behavior/v2025_02_01.other'));
  });

  test('not bound + flag → returns flag', () => {
    setupBehavior('v2025_01_01.feature');

    const result = getBehaviorDirForFeedback(
      { behavior: 'feature' },
      { cwd: testDir },
    );

    expect(result).toEqual(join(testDir, '.behavior/v2025_01_01.feature'));
  });

  test('not bound + no flag → throws', () => {
    setupBehavior('v2025_01_01.feature');

    expect(() => getBehaviorDirForFeedback({}, { cwd: testDir })).toThrow(
      BadRequestError,
    );
    expect(() => getBehaviorDirForFeedback({}, { cwd: testDir })).toThrow(
      /no behavior bound/,
    );
  });

  test('flag not found → throws', () => {
    setupBehavior('v2025_01_01.feature');

    expect(() =>
      getBehaviorDirForFeedback({ behavior: 'nonexistent' }, { cwd: testDir }),
    ).toThrow(BadRequestError);
    expect(() =>
      getBehaviorDirForFeedback({ behavior: 'nonexistent' }, { cwd: testDir }),
    ).toThrow(/no behavior found/);
  });

  test('flag ambiguous → throws', () => {
    setupBehavior('v2025_01_01.feature');
    setupBehavior('v2025_02_01.feature-v2');

    expect(() =>
      getBehaviorDirForFeedback({ behavior: 'feature' }, { cwd: testDir }),
    ).toThrow(BadRequestError);
    expect(() =>
      getBehaviorDirForFeedback({ behavior: 'feature' }, { cwd: testDir }),
    ).toThrow(/multiple behaviors match/);
  });
});
