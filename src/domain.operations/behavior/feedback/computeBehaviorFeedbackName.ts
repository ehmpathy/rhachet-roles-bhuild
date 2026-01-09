/**
 * .what = compute the feedback filename for a target artifact
 * .why = centralizes the filename convention logic
 */
export const computeBehaviorFeedbackName = (input: {
  artifactFileName: string;
  feedbackVersion: number;
}): string => {
  // append feedback suffix with version
  return `${input.artifactFileName}.[feedback].v${input.feedbackVersion}.[given].by_human.md`;
};
