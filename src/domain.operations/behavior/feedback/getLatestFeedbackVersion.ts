import { readdirSync } from 'fs';

/**
 * .what = find the highest feedback version for an artifact
 * .why = enables default to latest version and ++ increment
 */
export const getLatestFeedbackVersion = (input: {
  behaviorDir: string;
  artifactFileName: string;
}): number | null => {
  // read directory contents
  const files = readdirSync(input.behaviorDir);

  // pattern to match feedback files for this artifact
  // format: {artifactFileName}.[feedback].v{N}.[given].by_human.md
  const feedbackPattern = new RegExp(
    `^${escapeRegex(input.artifactFileName)}\\.\\[feedback\\]\\.v(\\d+)\\.`,
  );

  // collect feedback versions
  const versions: number[] = [];

  for (const file of files) {
    const match = file.match(feedbackPattern);
    if (!match) continue;

    const version = parseInt(match[1] ?? '', 10);
    if (!isNaN(version)) {
      versions.push(version);
    }
  }

  // return null if no feedback exists
  if (versions.length === 0) return null;

  // sort desc and return highest
  versions.sort((a, b) => b - a);
  return versions[0] ?? null;
};

/**
 * .what = escape special regex characters in a string
 * .why = enables safe use of artifact filenames in regex patterns
 */
const escapeRegex = (str: string): string => {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};
