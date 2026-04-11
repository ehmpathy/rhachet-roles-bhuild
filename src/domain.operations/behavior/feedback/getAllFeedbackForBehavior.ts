import { existsSync, readdirSync } from 'fs';
import { join } from 'path';

/**
 * .what = discover all [given] feedback files in a behavior directory
 * .why = enables feedback.take.get to list all feedback and their status
 */
export const getAllFeedbackForBehavior = (input: {
  behaviorDir: string;
}): {
  givenPath: string;
  artifactFileName: string;
  feedbackVersion: number;
}[] => {
  const feedbackDir = join(input.behaviorDir, 'feedback');

  // if feedback dir doesn't exist, no feedback
  if (!existsSync(feedbackDir)) return [];

  // read directory contents
  const files = readdirSync(feedbackDir);

  // pattern to match [given] feedback files
  // format: {artifactFileName}.[feedback].v{N}.[given].by_human.md
  const givenPattern = /^(.+)\.\[feedback\]\.v(\d+)\.\[given\]\.by_human\.md$/;

  // collect feedback files
  const feedbackFiles: {
    givenPath: string;
    artifactFileName: string;
    feedbackVersion: number;
  }[] = [];

  for (const file of files) {
    const match = file.match(givenPattern);
    if (!match) continue;

    const artifactFileName = match[1];
    const feedbackVersion = parseInt(match[2] ?? '', 10);

    if (!artifactFileName || isNaN(feedbackVersion)) continue;

    feedbackFiles.push({
      givenPath: join(feedbackDir, file),
      artifactFileName,
      feedbackVersion,
    });
  }

  // sort by artifact name, then by version (highest first)
  feedbackFiles.sort((a, b) => {
    const nameCompare = a.artifactFileName.localeCompare(b.artifactFileName);
    if (nameCompare !== 0) return nameCompare;
    return b.feedbackVersion - a.feedbackVersion;
  });

  return feedbackFiles;
};
