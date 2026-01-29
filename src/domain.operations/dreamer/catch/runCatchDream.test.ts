import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

import { DreamArtifact } from '../../../domain.objects/dreamer/DreamArtifact';
import { runCatchDream } from './runCatchDream';

describe('runCatchDream', () => {
  const tempDir = path.join(os.tmpdir(), 'runCatchDream-test');

  // helper to format date as YYYY_MM_DD
  const formatDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}_${month}_${day}`;
  };

  beforeEach(() => {
    // clean up and recreate temp dir before each test
    fs.rmSync(tempDir, { recursive: true, force: true });
    fs.mkdirSync(tempDir, { recursive: true });
  });

  afterAll(() => {
    // clean up temp dir after all tests
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  test('catches a new dream', () => {
    const result = runCatchDream({
      name: 'config-reload',
      cwd: tempDir,
    });

    expect(result.outcome).toEqual('caught');
    expect(result.dream).toBeInstanceOf(DreamArtifact);
    expect(result.dream.name).toEqual('config-reload');

    // verify file was created
    expect(fs.existsSync(result.dream.path)).toBe(true);

    // verify content
    const content = fs.readFileSync(result.dream.path, 'utf-8');
    expect(content).toContain('dream = ');
  });

  test('finds prior dream', () => {
    const today = new Date();
    const todayStr = formatDate(today);
    const dreamDir = path.join(tempDir, '.dream');

    // create prior dream
    fs.mkdirSync(dreamDir, { recursive: true });
    fs.writeFileSync(
      path.join(dreamDir, `${todayStr}.config-reload.dream.md`),
      'dream = prior',
      'utf-8',
    );

    const result = runCatchDream({
      name: 'config-reload',
      cwd: tempDir,
    });

    expect(result.outcome).toEqual('found');
    expect(result.dream.name).toEqual('config-reload');
  });

  test('normalizes dream name', () => {
    const result = runCatchDream({
      name: 'Config Hot Reload',
      cwd: tempDir,
    });

    expect(result.dream.name).toEqual('config-hot-reload');
  });

  test('bootstraps .dream/ folder', () => {
    const dreamDir = path.join(tempDir, '.dream');
    expect(fs.existsSync(dreamDir)).toBe(false);

    runCatchDream({
      name: 'first-idea',
      cwd: tempDir,
    });

    expect(fs.existsSync(dreamDir)).toBe(true);
    expect(fs.existsSync(path.join(dreamDir, '.readme.md'))).toBe(true);
  });

  test('finds similar dreams as candidates', () => {
    const today = new Date();
    const todayStr = formatDate(today);
    const dreamDir = path.join(tempDir, '.dream');

    // create similar dream
    fs.mkdirSync(dreamDir, { recursive: true });
    fs.writeFileSync(
      path.join(dreamDir, `${todayStr}.config-reload.dream.md`),
      'dream = ',
      'utf-8',
    );

    // catch with typo
    const result = runCatchDream({
      name: 'config-relod', // typo
      cwd: tempDir,
    });

    expect(result.candidates).toHaveLength(1);
    expect(result.candidates[0]!.dream.name).toEqual('config-reload');
  });

  test('handles opener error gracefully', () => {
    const result = runCatchDream({
      name: 'config-reload',
      open: 'nonexistent-editor-12345',
      cwd: tempDir,
    });

    // should still catch the dream
    expect(result.outcome).toEqual('caught');

    // but opener should fail
    expect(result.openerResult?.success).toBe(false);
    expect(result.openerResult?.error).toContain('nonexistent-editor-12345');
  });

  test('opener result is undefined when --open not provided', () => {
    const result = runCatchDream({
      name: 'config-reload',
      cwd: tempDir,
    });

    expect(result.openerResult).toBeUndefined();
  });
});
