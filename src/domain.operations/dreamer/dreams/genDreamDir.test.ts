import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

import { genDreamDir } from './genDreamDir';

describe('genDreamDir', () => {
  const tempDir = path.join(os.tmpdir(), 'genDreamDir-test');

  beforeEach(() => {
    // clean up temp dir before each test
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  afterAll(() => {
    // clean up temp dir after all tests
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  test('creates directory if absent', () => {
    const result = genDreamDir({ repoRoot: tempDir });

    expect(result.dreamDir).toEqual(path.join(tempDir, '.dream'));
    expect(fs.existsSync(result.dreamDir)).toBe(true);
  });

  test('idempotent if directory exists', () => {
    // create directory first
    const dreamDir = path.join(tempDir, '.dream');
    fs.mkdirSync(dreamDir, { recursive: true });

    // call genDreamDir - should not throw
    const result = genDreamDir({ repoRoot: tempDir });

    expect(result.dreamDir).toEqual(dreamDir);
    expect(fs.existsSync(result.dreamDir)).toBe(true);
  });

  test('creates .readme.md if absent', () => {
    const result = genDreamDir({ repoRoot: tempDir });

    expect(result.readmeCreated).toBe(true);
    const readmePath = path.join(result.dreamDir, '.readme.md');
    expect(fs.existsSync(readmePath)).toBe(true);
  });

  test('skips .readme.md if present', () => {
    // create directory and readme first
    const dreamDir = path.join(tempDir, '.dream');
    fs.mkdirSync(dreamDir, { recursive: true });
    fs.writeFileSync(
      path.join(dreamDir, '.readme.md'),
      'prior content',
      'utf-8',
    );

    const result = genDreamDir({ repoRoot: tempDir });

    expect(result.readmeCreated).toBe(false);
    // verify prior content is preserved
    const content = fs.readFileSync(
      path.join(result.dreamDir, '.readme.md'),
      'utf-8',
    );
    expect(content).toEqual('prior content');
  });

  test('.readme.md contains expected content', () => {
    const result = genDreamDir({ repoRoot: tempDir });

    const readmePath = path.join(result.dreamDir, '.readme.md');
    const content = fs.readFileSync(readmePath, 'utf-8');

    expect(content).toContain('# .dream/ 🌙');
    expect(content).toContain('catch.dream');
    expect(content).toContain('init.behavior');
  });
});
