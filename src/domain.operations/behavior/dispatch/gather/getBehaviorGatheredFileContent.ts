import * as path from 'path';

import type { RefByUnique } from 'domain-objects';
import { genArtifactGitFile, type GitFile } from 'rhachet-artifact-git';

import type { BehaviorGathered } from '../../../../domain.objects/BehaviorGathered';

/**
 * .what = reads content from a behavior file ref on-demand
 * .why = enables memory-efficient access to file contents without persisting inline
 */
export const getBehaviorGatheredFileContent = async (input: {
  file: RefByUnique<typeof GitFile>;
}): Promise<string | null> => {
  const artifact = genArtifactGitFile({ uri: input.file.uri });
  const gitFile = await artifact.get();
  return gitFile?.content ?? null;
};

/**
 * .what = finds and reads all behavior files matching a regex pattern
 * .why = supports decomposed files (e.g., 0.wish.md, 0.wish.detailed.md)
 *
 * @note concatenates content from all matching files with newlines
 */
export const getBehaviorGatheredFileContentByPattern = async (input: {
  gathered: BehaviorGathered;
  pattern: RegExp;
}): Promise<string | null> => {
  // find all files matching pattern (compare against basename of uri)
  const matchingFiles = input.gathered.files.filter((f) =>
    input.pattern.test(path.basename(f.uri)),
  );
  if (matchingFiles.length === 0) return null;

  // read content from all matching files
  const contents = await Promise.all(
    matchingFiles.map((file) => getBehaviorGatheredFileContent({ file })),
  );

  // concatenate non-null contents
  const validContents = contents.filter((c): c is string => c !== null);
  if (validContents.length === 0) return null;

  return validContents.join('\n\n');
};

/**
 * .what = reads wish content from gathered behavior
 * .why = convenience accessor for wish artifacts (supports decomposed: 0.wish.*.md)
 */
export const getBehaviorGatheredWish = async (input: {
  gathered: BehaviorGathered;
}): Promise<string | null> => {
  return getBehaviorGatheredFileContentByPattern({
    gathered: input.gathered,
    pattern: /^0\.wish(\..+)?\.md$/,
  });
};

/**
 * .what = reads vision content from gathered behavior
 * .why = convenience accessor for vision artifacts (supports decomposed: 1.vision.*.md)
 */
export const getBehaviorGatheredVision = async (input: {
  gathered: BehaviorGathered;
}): Promise<string | null> => {
  return getBehaviorGatheredFileContentByPattern({
    gathered: input.gathered,
    pattern: /^1\.vision(\..+)?\.md$/,
  });
};

/**
 * .what = reads criteria content from gathered behavior
 * .why = convenience accessor for criteria artifacts (supports decomposed: 2.criteria.*.md)
 */
export const getBehaviorGatheredCriteria = async (input: {
  gathered: BehaviorGathered;
}): Promise<string | null> => {
  return getBehaviorGatheredFileContentByPattern({
    gathered: input.gathered,
    pattern: /^2\.criteria(\..+)?\.md$/,
  });
};

/**
 * .what = reads blueprint content from gathered behavior
 * .why = convenience accessor for blueprint artifacts (matches *.blueprint.*.md)
 */
export const getBehaviorGatheredBlueprint = async (input: {
  gathered: BehaviorGathered;
}): Promise<string | null> => {
  return getBehaviorGatheredFileContentByPattern({
    gathered: input.gathered,
    pattern: /\.blueprint\..+\.md$/,
  });
};
