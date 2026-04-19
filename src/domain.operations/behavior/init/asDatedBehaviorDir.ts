import { join } from 'path';

/**
 * .what = generate behavior directory path with today's date prefix
 * .why = new behaviors get versioned directory names like v2026_04_17.my-feature
 */
export const asDatedBehaviorDir = (input: {
  targetDir: string;
  behaviorName: string;
}): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const isoDate = `${year}_${month}_${day}`;
  return join(
    input.targetDir,
    '.behavior',
    `v${isoDate}.${input.behaviorName}`,
  );
};
