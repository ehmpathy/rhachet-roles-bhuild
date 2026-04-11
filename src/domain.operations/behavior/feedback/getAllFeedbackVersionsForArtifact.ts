import { asFeedbackVersionFromFilename } from './asFeedbackVersionFromFilename';

/**
 * .what = extract all feedback versions for an artifact from a list of filenames
 * .why = encapsulates version extraction pipeline for orchestrator readability
 */
export const getAllFeedbackVersionsForArtifact = (input: {
  filenames: string[];
  artifactFileName: string;
}): number[] => {
  const versions: number[] = [];

  for (const filename of input.filenames) {
    const version = asFeedbackVersionFromFilename({
      filename,
      artifactFileName: input.artifactFileName,
    });
    if (version !== null) {
      versions.push(version);
    }
  }

  return versions;
};
