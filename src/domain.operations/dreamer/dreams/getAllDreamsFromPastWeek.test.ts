import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

import { getAllDreamsFromPastWeek } from './getAllDreamsFromPastWeek';

describe('getAllDreamsFromPastWeek', () => {
  const tempDir = path.join(os.tmpdir(), 'getAllDreamsFromPastWeek-test');
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
    const result = getAllDreamsFromPastWeek({ dreamDir });
    expect(result).toEqual([]);
  });

  test('returns empty array when dream dir does not exist', () => {
    const result = getAllDreamsFromPastWeek({ dreamDir: '/nonexistent/path' });
    expect(result).toEqual([]);
  });

  test('includes dreams within 7 days', () => {
    // create dreams at different dates
    const today = new Date();
    const threeDaysAgo = new Date(today);
    threeDaysAgo.setDate(today.getDate() - 3);

    const todayStr = formatDate(today);
    const threeDaysAgoStr = formatDate(threeDaysAgo);

    fs.writeFileSync(
      path.join(dreamDir, `${todayStr}.today-dream.dream.md`),
      'dream = ',
      'utf-8',
    );
    fs.writeFileSync(
      path.join(dreamDir, `${threeDaysAgoStr}.older-dream.dream.md`),
      'dream = ',
      'utf-8',
    );

    const result = getAllDreamsFromPastWeek({ dreamDir });

    expect(result).toHaveLength(2);
    const names = result.map((d) => d.name);
    expect(names).toContain('today-dream');
    expect(names).toContain('older-dream');
  });

  test('excludes dreams older than 7 days', () => {
    const today = new Date();
    const tenDaysAgo = new Date(today);
    tenDaysAgo.setDate(today.getDate() - 10);

    const todayStr = formatDate(today);
    const tenDaysAgoStr = formatDate(tenDaysAgo);

    fs.writeFileSync(
      path.join(dreamDir, `${todayStr}.recent-dream.dream.md`),
      'dream = ',
      'utf-8',
    );
    fs.writeFileSync(
      path.join(dreamDir, `${tenDaysAgoStr}.old-dream.dream.md`),
      'dream = ',
      'utf-8',
    );

    const result = getAllDreamsFromPastWeek({ dreamDir });

    expect(result).toHaveLength(1);
    expect(result[0]!.name).toEqual('recent-dream');
  });

  test('correctly extracts name from filename', () => {
    const today = new Date();
    const todayStr = formatDate(today);

    fs.writeFileSync(
      path.join(dreamDir, `${todayStr}.config-hot-reload.dream.md`),
      'dream = ',
      'utf-8',
    );

    const result = getAllDreamsFromPastWeek({ dreamDir });

    expect(result).toHaveLength(1);
    expect(result[0]!.name).toEqual('config-hot-reload');
    expect(result[0]!.date).toEqual(todayStr);
    expect(result[0]!.filename).toEqual(
      `${todayStr}.config-hot-reload.dream.md`,
    );
  });

  test('ignores non-dream files', () => {
    const today = new Date();
    const todayStr = formatDate(today);

    fs.writeFileSync(
      path.join(dreamDir, `${todayStr}.valid-dream.dream.md`),
      'dream = ',
      'utf-8',
    );
    fs.writeFileSync(
      path.join(dreamDir, '.readme.md'),
      'readme content',
      'utf-8',
    );
    fs.writeFileSync(
      path.join(dreamDir, 'random-file.txt'),
      'content',
      'utf-8',
    );

    const result = getAllDreamsFromPastWeek({ dreamDir });

    expect(result).toHaveLength(1);
    expect(result[0]!.name).toEqual('valid-dream');
  });
});
