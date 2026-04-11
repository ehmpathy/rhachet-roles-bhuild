import { existsSync, readdirSync } from 'fs';
import { join } from 'path';

import { getAllFeedbackVersionsForArtifact } from './getAllFeedbackVersionsForArtifact';

/**
 * .what = find the highest feedback version for an artifact
 * .why = enables default to latest version and ++ increment
 */
export const getLatestFeedbackVersion = (input: {
  behaviorDir: string;
  artifactFileName: string;
}): number | null => {
  // feedback files live in the feedback/ subdir
  const feedbackDir = join(input.behaviorDir, 'feedback');

  // if feedback dir doesn't exist, no feedback
  if (!existsSync(feedbackDir)) return null;

  // read directory contents
  const filenames = readdirSync(feedbackDir);

  // extract versions for this artifact
  const versions = getAllFeedbackVersionsForArtifact({
    filenames,
    artifactFileName: input.artifactFileName,
  });

  // return max version or null if none
  if (versions.length === 0) return null;
  return Math.max(...versions);
};
