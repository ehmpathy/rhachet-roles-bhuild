import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

import { DreamArtifact } from '../../../domain.objects/dreamer/DreamArtifact';
import { setDream } from './setDream';

describe('setDream', () => {
  const tempDir = path.join(os.tmpdir(), 'setDream-test');
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

  test('returns outcome "found" when prior dream exists', () => {
    // create a prior dream file
    const filename = '2026_01_20.config-reload.dream.md';
    fs.writeFileSync(
      path.join(dreamDir, filename),
      'dream = prior content',
      'utf-8',
    );

    const result = setDream({
      findsert: {
        name: 'config-reload',
        dreamDir,
        date: '2026_01_27',
      },
    });

    expect(result.outcome).toEqual('found');
    expect(result.dream).toBeInstanceOf(DreamArtifact);
    expect(result.dream.date).toEqual('2026_01_20'); // prior date preserved
  });

  test('returns outcome "caught" when new dream created', () => {
    const result = setDream({
      findsert: {
        name: 'config-reload',
        dreamDir,
        date: '2026_01_27',
      },
    });

    expect(result.outcome).toEqual('caught');
    expect(result.dream).toBeInstanceOf(DreamArtifact);
    expect(result.dream.date).toEqual('2026_01_27');
  });

  test('file path format is correct', () => {
    const result = setDream({
      findsert: {
        name: 'my-dream',
        dreamDir,
        date: '2026_01_27',
      },
    });

    expect(result.dream.path).toEqual(
      path.join(dreamDir, '2026_01_27.my-dream.dream.md'),
    );
    expect(result.dream.filename).toEqual('2026_01_27.my-dream.dream.md');
  });

  test('creates file with template content', () => {
    setDream({
      findsert: {
        name: 'config-reload',
        dreamDir,
        date: '2026_01_27',
      },
    });

    const filepath = path.join(dreamDir, '2026_01_27.config-reload.dream.md');
    const content = fs.readFileSync(filepath, 'utf-8');

    expect(content).toEqual('dream = \n\n');
  });

  test('findsert is idempotent - second call returns prior', () => {
    // first call creates
    const result1 = setDream({
      findsert: {
        name: 'config-reload',
        dreamDir,
        date: '2026_01_27',
      },
    });
    expect(result1.outcome).toEqual('caught');

    // second call finds
    const result2 = setDream({
      findsert: {
        name: 'config-reload',
        dreamDir,
        date: '2026_01_28', // different date, same name
      },
    });
    expect(result2.outcome).toEqual('found');
    expect(result2.dream.date).toEqual('2026_01_27'); // prior date
  });
});
