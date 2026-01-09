import { existsSync } from 'fs';
import { BadRequestError } from 'helpful-errors';
import { join, relative } from 'path';

import { computeBehaviorFeedbackName } from './computeBehaviorFeedbackName';
import { getBehaviorDirForFeedback } from './getBehaviorDirForFeedback';
import { getLatestArtifactByName } from './getLatestArtifactByName';
import { initFeedbackTemplate } from './initFeedbackTemplate';

/**
 * .what = create a feedback file for a behavior artifact
 * .why = enables structured feedback on any behavior artifact with placeholder substitution
 */
export const giveFeedback = (
  input: {
    against: string;
    behavior?: string;
    version?: number;
    template?: string;
    force?: boolean;
  },
  context?: { cwd?: string },
): { feedbackFile: string; artifactFile: string; behaviorDir: string } => {
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

  // compute feedback filename
  const feedbackVersion = input.version ?? 1;
  const feedbackFilename = computeBehaviorFeedbackName({
    artifactFileName: artifact.filename,
    feedbackVersion,
  });
  const feedbackPath = join(behaviorDir, feedbackFilename);

  // check if feedback file already exists
  if (existsSync(feedbackPath)) {
    throw new BadRequestError(
      `feedback file already exists: ${feedbackFilename}. use --version ${feedbackVersion + 1} to create a new version.`,
    );
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
  });

  return {
    feedbackFile: feedbackPath,
    artifactFile: artifact.path,
    behaviorDir,
  };
};
