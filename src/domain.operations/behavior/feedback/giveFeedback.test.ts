import { execSync } from 'child_process';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'fs';
import { BadRequestError } from 'helpful-errors';
import { tmpdir } from 'os';
import { join } from 'path';

import { giveFeedback } from './giveFeedback';

describe('giveFeedback', () => {
  let testDir: string;
  let behaviorDir: string;

  const setupTestRepo = () => {
    testDir = mkdtempSync(join(tmpdir(), 'give-feedback-test-'));

    // init git repo
    execSync('git init', { cwd: testDir });
    execSync('git config user.email "test@test.com"', { cwd: testDir });
    execSync('git config user.name "Test"', { cwd: testDir });
    writeFileSync(join(testDir, 'README.md'), '# test');
    execSync('git add . && git commit -m "init"', { cwd: testDir });

    // create behavior directory
    behaviorDir = join(testDir, '.behavior/v2025_01_01.test-feature');
    mkdirSync(behaviorDir, { recursive: true });

    // create default template
    writeFileSync(
      join(behaviorDir, '.ref.[feedback].v1.[given].by_human.md'),
      [
        'feedback for $BEHAVIOR_REF_NAME',
        'emit response to $BEHAVIOR_DIR_REL/response.md',
      ].join('\n'),
    );
  };

  afterEach(() => {
    if (testDir) rmSync(testDir, { recursive: true, force: true });
  });

  test('creates feedback for execution artifact', () => {
    setupTestRepo();
    writeFileSync(join(behaviorDir, '5.1.execution.v1.i1.md'), '# execution');

    const result = giveFeedback(
      { against: 'execution', behavior: 'test-feature' },
      { cwd: testDir },
    );

    expect(existsSync(result.feedbackFile)).toBe(true);
    expect(result.feedbackFile).toContain(
      '5.1.execution.v1.i1.md.[feedback].v1.[given].by_human.md',
    );
  });

  test('creates feedback for criteria.blackbox', () => {
    setupTestRepo();
    writeFileSync(join(behaviorDir, '2.1.criteria.blackbox.md'), '# criteria');

    const result = giveFeedback(
      { against: 'criteria.blackbox', behavior: 'test-feature' },
      { cwd: testDir },
    );

    expect(existsSync(result.feedbackFile)).toBe(true);
    expect(result.feedbackFile).toContain(
      '2.1.criteria.blackbox.md.[feedback].v1.[given].by_human.md',
    );
  });

  test('creates feedback for wish', () => {
    setupTestRepo();
    writeFileSync(join(behaviorDir, '0.wish.md'), '# wish');

    const result = giveFeedback(
      { against: 'wish', behavior: 'test-feature' },
      { cwd: testDir },
    );

    expect(existsSync(result.feedbackFile)).toBe(true);
    expect(result.feedbackFile).toContain(
      '0.wish.md.[feedback].v1.[given].by_human.md',
    );
  });

  test('respects --version flag', () => {
    setupTestRepo();
    writeFileSync(join(behaviorDir, '0.wish.md'), '# wish');

    const result = giveFeedback(
      { against: 'wish', behavior: 'test-feature', version: 2 },
      { cwd: testDir },
    );

    expect(result.feedbackFile).toContain('[feedback].v2.[given].by_human.md');
  });

  test('uses custom --template', () => {
    setupTestRepo();
    writeFileSync(join(behaviorDir, '0.wish.md'), '# wish');

    const customTemplate = join(testDir, 'custom-template.md');
    writeFileSync(customTemplate, 'custom: $BEHAVIOR_REF_NAME');

    const result = giveFeedback(
      { against: 'wish', behavior: 'test-feature', template: customTemplate },
      { cwd: testDir },
    );

    const content = readFileSync(result.feedbackFile, 'utf-8');
    expect(content).toEqual('custom: 0.wish.md');
  });

  test('fails if artifact not found', () => {
    setupTestRepo();

    expect(() =>
      giveFeedback(
        { against: 'nonexistent', behavior: 'test-feature' },
        { cwd: testDir },
      ),
    ).toThrow(BadRequestError);
    expect(() =>
      giveFeedback(
        { against: 'nonexistent', behavior: 'test-feature' },
        { cwd: testDir },
      ),
    ).toThrow(/no artifact found/);
  });

  test('fails if feedback file already present', () => {
    setupTestRepo();
    writeFileSync(join(behaviorDir, '0.wish.md'), '# wish');
    writeFileSync(
      join(behaviorDir, '0.wish.md.[feedback].v1.[given].by_human.md'),
      'prior feedback',
    );

    expect(() =>
      giveFeedback(
        { against: 'wish', behavior: 'test-feature' },
        { cwd: testDir },
      ),
    ).toThrow(BadRequestError);
    expect(() =>
      giveFeedback(
        { against: 'wish', behavior: 'test-feature' },
        { cwd: testDir },
      ),
    ).toThrow(/already exists/);
  });

  test('fails if template not found', () => {
    setupTestRepo();
    writeFileSync(join(behaviorDir, '0.wish.md'), '# wish');

    // remove the template
    rmSync(join(behaviorDir, '.ref.[feedback].v1.[given].by_human.md'));

    expect(() =>
      giveFeedback(
        { against: 'wish', behavior: 'test-feature' },
        { cwd: testDir },
      ),
    ).toThrow(BadRequestError);
    expect(() =>
      giveFeedback(
        { against: 'wish', behavior: 'test-feature' },
        { cwd: testDir },
      ),
    ).toThrow(/template not found/);
  });
});
