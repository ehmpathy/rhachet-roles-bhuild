import { existsSync } from 'fs';
import { BadRequestError } from 'helpful-errors';
import { join, relative } from 'path';

import { computeBehaviorFeedbackName } from './computeBehaviorFeedbackName';
import { getBehaviorDirForFeedback } from './getBehaviorDirForFeedback';
import { getLatestArtifactByName } from './getLatestArtifactByName';
import { getLatestFeedbackVersion } from './getLatestFeedbackVersion';
import { initFeedbackTemplate } from './initFeedbackTemplate';

/**
 * .what = create or find a feedback file for a behavior artifact
 * .why = enables structured feedback on any behavior artifact with placeholder substitution
 *
 * .note = findsert behavior: if feedback exists, returns it instead of throw
 */
export const giveFeedback = (
  input: {
    against: string;
    behavior?: string;
    version?: number | '++';
    template?: string;
    force?: boolean;
  },
  context?: { cwd?: string },
): {
  feedbackFile: string;
  artifactFile: string;
  behaviorDir: string;
  created: boolean;
} => {
  const cwd = context?.cwd ?? process.cwd();

  // resolve behavior directory
  const behaviorDir = getBehaviorDirForFeedback(
    { behavior: input.behavior, force: input.force },
    { cwd },
  );

  // find latest artifact
  const artifact = getLatestArtifactByName(
    { behaviorDir, artifactName: input.against },
    { cwd },
  );
  if (!artifact) {
    throw new BadRequestError(
      `no artifact found for '${input.against}' in ${behaviorDir}`,
    );
  }

  // resolve feedback version
  const latestVersion = getLatestFeedbackVersion({
    behaviorDir,
    artifactFileName: artifact.filename,
  });
  const feedbackVersion = (() => {
    // explicit number → use as-is
    if (typeof input.version === 'number') return input.version;

    // ++ → increment from latest (or 1 if none)
    if (input.version === '++') return (latestVersion ?? 0) + 1;

    // undefined → use latest (or 1 if none)
    return latestVersion ?? 1;
  })();

  // compute feedback filename
  const feedbackFilename = computeBehaviorFeedbackName({
    artifactFileName: artifact.filename,
    feedbackVersion,
  });
  const feedbackPath = join(behaviorDir, feedbackFilename);

  // findsert: if feedback file exists, return it
  if (existsSync(feedbackPath)) {
    return {
      feedbackFile: feedbackPath,
      artifactFile: artifact.path,
      behaviorDir,
      created: false,
    };
  }

  // resolve template path
  const templatePath =
    input.template ??
    join(behaviorDir, '.ref.[feedback].v1.[given].by_human.md');
  if (!existsSync(templatePath)) {
    throw new BadRequestError(`template not found: ${templatePath}`);
  }

  // compute relative behavior directory path
  const behaviorDirRel = relative(cwd, behaviorDir);

  // init feedback file from template
  initFeedbackTemplate({
    templatePath,
    targetPath: feedbackPath,
    artifactFileName: artifact.filename,
    behaviorDirRel,
    feedbackVersion,
  });

  return {
    feedbackFile: feedbackPath,
    artifactFile: artifact.path,
    behaviorDir,
    created: true,
  };
};
