import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

import { DreamCandidate } from '../../../domain.objects/dreamer/DreamCandidate';
import { getAllDreamsBySimilarity } from './getAllDreamsBySimilarity';

describe('getAllDreamsBySimilarity', () => {
  const tempDir = path.join(os.tmpdir(), 'getAllDreamsBySimilarity-test');
  const dreamDir = path.join(tempDir, '.dream');

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
    fs.mkdirSync(dreamDir, { recursive: true });
  });

  afterAll(() => {
    // clean up temp dir after all tests
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  test('returns empty array when no dreams', () => {
    const result = getAllDreamsBySimilarity({
      name: 'config-reload',
      dreamDir,
    });
    expect(result).toEqual([]);
  });

  test('returns empty array when no similar dreams', () => {
    const today = new Date();
    const todayStr = formatDate(today);

    fs.writeFileSync(
      path.join(dreamDir, `${todayStr}.totally-different.dream.md`),
      'dream = ',
      'utf-8',
    );

    const result = getAllDreamsBySimilarity({
      name: 'config-reload',
      dreamDir,
    });
    expect(result).toEqual([]);
  });

  test('skips exact matches', () => {
    const today = new Date();
    const todayStr = formatDate(today);

    fs.writeFileSync(
      path.join(dreamDir, `${todayStr}.config-reload.dream.md`),
      'dream = ',
      'utf-8',
    );

    const result = getAllDreamsBySimilarity({
      name: 'config-reload',
      dreamDir,
    });
    expect(result).toEqual([]);
  });

  test('finds dreams within default threshold (3)', () => {
    const today = new Date();
    const todayStr = formatDate(today);

    // distance 1: config-reload vs config-relod (one char deleted)
    fs.writeFileSync(
      path.join(dreamDir, `${todayStr}.config-reload.dream.md`),
      'dream = ',
      'utf-8',
    );

    const result = getAllDreamsBySimilarity({
      name: 'config-relod', // typo
      dreamDir,
    });

    expect(result).toHaveLength(1);
    expect(result[0]).toBeInstanceOf(DreamCandidate);
    expect(result[0]!.dream.name).toEqual('config-reload');
    expect(result[0]!.distance).toEqual(1);
  });

  test('respects custom threshold', () => {
    const today = new Date();
    const todayStr = formatDate(today);

    // distance 3: config-reload vs config-re (3 chars deleted: l, o, a, d)
    fs.writeFileSync(
      path.join(dreamDir, `${todayStr}.config-reload.dream.md`),
      'dream = ',
      'utf-8',
    );

    // with threshold 2, should not find (distance is 4)
    const result1 = getAllDreamsBySimilarity({
      name: 'config-re',
      dreamDir,
      threshold: 2,
    });
    expect(result1).toEqual([]);

    // with threshold 5, should find
    const result2 = getAllDreamsBySimilarity({
      name: 'config-re',
      dreamDir,
      threshold: 5,
    });
    expect(result2).toHaveLength(1);
  });

  test('sorts results by distance (closest first)', () => {
    const today = new Date();
    const todayStr = formatDate(today);

    // distance 1: config-reload vs config-relod
    fs.writeFileSync(
      path.join(dreamDir, `${todayStr}.config-reload.dream.md`),
      'dream = ',
      'utf-8',
    );
    // distance 2: config-reload-v2 vs config-relod (more different)
    fs.writeFileSync(
      path.join(dreamDir, `${todayStr}.config-relod-v2.dream.md`),
      'dream = ',
      'utf-8',
    );

    const result = getAllDreamsBySimilarity({
      name: 'config-relod',
      dreamDir,
      threshold: 5,
    });

    expect(result).toHaveLength(2);
    expect(result[0]!.dream.name).toEqual('config-reload');
    expect(result[0]!.distance).toBeLessThanOrEqual(result[1]!.distance);
  });

  test('only includes dreams from past week', () => {
    const today = new Date();
    const tenDaysAgo = new Date(today);
    tenDaysAgo.setDate(today.getDate() - 10);

    const todayStr = formatDate(today);
    const tenDaysAgoStr = formatDate(tenDaysAgo);

    // recent dream (within week)
    fs.writeFileSync(
      path.join(dreamDir, `${todayStr}.config-reload.dream.md`),
      'dream = ',
      'utf-8',
    );
    // old dream (outside week)
    fs.writeFileSync(
      path.join(dreamDir, `${tenDaysAgoStr}.config-relod.dream.md`),
      'dream = ',
      'utf-8',
    );

    const result = getAllDreamsBySimilarity({
      name: 'config-relod',
      dreamDir,
    });

    // only the recent one should be considered
    expect(result).toHaveLength(1);
    expect(result[0]!.dream.name).toEqual('config-reload');
  });
});
