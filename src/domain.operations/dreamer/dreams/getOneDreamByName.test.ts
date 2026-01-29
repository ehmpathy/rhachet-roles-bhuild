import * as fs from 'fs';
import { UnexpectedCodePathError } from 'helpful-errors';
import * as os from 'os';
import * as path from 'path';

import { DreamArtifact } from '../../../domain.objects/dreamer/DreamArtifact';
import { getOneDreamByName } from './getOneDreamByName';

describe('getOneDreamByName', () => {
  const tempDir = path.join(os.tmpdir(), 'getOneDreamByName-test');
  const dreamDir = path.join(tempDir, '.dream');

  beforeEach(() => {
    // clean up and recreate temp dir before each test
    fs.rmSync(tempDir, { recursive: true, force: true });
    fs.mkdirSync(dreamDir, { recursive: true });
  });

  afterAll(() => {
    // clean up temp dir after all tests
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  test('returns null when no match', () => {
    const result = getOneDreamByName({
      name: 'nonexistent',
      dreamDir,
    });

    expect(result).toBeNull();
  });

  test('returns null when dream dir does not exist', () => {
    const result = getOneDreamByName({
      name: 'nonexistent',
      dreamDir: '/nonexistent/path',
    });

    expect(result).toBeNull();
  });

  test('returns DreamArtifact when single match', () => {
    // create a dream file
    const filename = '2026_01_27.config-reload.dream.md';
    fs.writeFileSync(path.join(dreamDir, filename), 'dream = ', 'utf-8');

    const result = getOneDreamByName({
      name: 'config-reload',
      dreamDir,
    });

    expect(result).not.toBeNull();
    expect(result).toBeInstanceOf(DreamArtifact);
    expect(result!.name).toEqual('config-reload');
    expect(result!.date).toEqual('2026_01_27');
    expect(result!.filename).toEqual(filename);
  });

  test('throws when multiple matches', () => {
    // create multiple dream files with same name but different dates
    fs.writeFileSync(
      path.join(dreamDir, '2026_01_20.config-reload.dream.md'),
      'dream = ',
      'utf-8',
    );
    fs.writeFileSync(
      path.join(dreamDir, '2026_01_27.config-reload.dream.md'),
      'dream = ',
      'utf-8',
    );

    expect(() =>
      getOneDreamByName({ name: 'config-reload', dreamDir }),
    ).toThrow(UnexpectedCodePathError);
  });

  test('correctly parses date from filename', () => {
    const filename = '2025_12_31.year-end-dream.dream.md';
    fs.writeFileSync(path.join(dreamDir, filename), 'dream = ', 'utf-8');

    const result = getOneDreamByName({
      name: 'year-end-dream',
      dreamDir,
    });

    expect(result!.date).toEqual('2025_12_31');
  });

  test('ignores files that do not match the pattern', () => {
    // create a file with similar but unmatched pattern
    fs.writeFileSync(
      path.join(dreamDir, '2026_01_27.other-dream.dream.md'),
      'dream = ',
      'utf-8',
    );
    fs.writeFileSync(
      path.join(dreamDir, 'not-a-dream.txt'),
      'content',
      'utf-8',
    );

    const result = getOneDreamByName({
      name: 'config-reload',
      dreamDir,
    });

    expect(result).toBeNull();
  });
});
