import { existsSync, readdirSync } from 'fs';

import { DreamArtifact } from '../../../domain.objects/dreamer/DreamArtifact';

/**
 * .what = retrieves all dreams created within the past week
 * .why = provides candidate pool for fuzzy match recovery
 */
export const getAllDreamsFromPastWeek = (input: {
  dreamDir: string;
}): DreamArtifact[] => {
  // handle dir not present
  if (!existsSync(input.dreamDir)) return [];

  // read directory
  const files = readdirSync(input.dreamDir);

  // pattern: YYYY_MM_DD.name.dream.md
  const dreamPattern = /^(\d{4}_\d{2}_\d{2})\.(.+)\.dream\.md$/;

  // calculate cutoff date (7 days ago)
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - 7);
  cutoffDate.setHours(0, 0, 0, 0);

  const dreams: DreamArtifact[] = [];

  for (const file of files) {
    const match = dreamPattern.exec(file);
    if (!match) continue;

    const [, dateStr, name] = match;
    if (!dateStr || !name) continue;

    // parse date from YYYY_MM_DD format
    const fileDate = parseDreamDate(dateStr);
    if (!fileDate) continue;

    // filter by date within past 7 days
    if (fileDate >= cutoffDate) {
      dreams.push(
        new DreamArtifact({
          path: `${input.dreamDir}/${file}`,
          name,
          date: dateStr,
          filename: file,
        }),
      );
    }
  }

  return dreams;
};

/**
 * .what = parses YYYY_MM_DD format to Date
 * .why = enables date comparison for week filter
 */
const parseDreamDate = (dateStr: string): Date | null => {
  const [year, month, day] = dateStr.split('_').map(Number);
  if (!year || !month || !day) return null;

  const date = new Date(year, month - 1, day);
  date.setHours(0, 0, 0, 0);
  return date;
};
