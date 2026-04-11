/**
 * .what = extract feedback version number from a filename
 * .why = encapsulates regex pattern for feedback file name convention
 */
export const asFeedbackVersionFromFilename = (input: {
  filename: string;
  artifactFileName: string;
}): number | null => {
  // escape special regex characters in artifact name
  const escaped = input.artifactFileName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  // pattern: {artifactFileName}.[feedback].v{N}.[given].by_human.md
  const pattern = new RegExp(`^${escaped}\\.\\[feedback\\]\\.v(\\d+)\\.`);

  // extract version from match
  const match = input.filename.match(pattern);
  if (!match) return null;

  // parse version number
  const versionStr = match[1];
  if (versionStr === undefined) return null;

  const version = parseInt(versionStr, 10);
  return isNaN(version) ? null : version;
};
