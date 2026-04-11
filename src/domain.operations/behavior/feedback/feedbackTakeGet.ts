import { relative } from 'path';

import { getAllFeedbackForBehavior } from './getAllFeedbackForBehavior';
import { getBehaviorDirForFeedback } from './getBehaviorDirForFeedback';
import { type FeedbackStatus, getFeedbackStatus } from './getFeedbackStatus';

export type FeedbackTakeGetResult = {
  behaviorDir: string;
  feedback: {
    givenPath: string;
    givenPathRel: string;
    artifactFileName: string;
    feedbackVersion: number;
    status: FeedbackStatus;
  }[];
  unresponded: number;
  responded: number;
  stale: number;
};

/**
 * .what = list all feedback for a behavior with their response status
 * .why = enables clones to see what feedback needs response
 */
export const feedbackTakeGet = (
  input: {
    behavior?: string;
    force?: boolean;
    targetDir?: string;
  },
  context: { cwd: string },
): FeedbackTakeGetResult => {
  // get behavior directory
  const behaviorDir = getBehaviorDirForFeedback(
    {
      behavior: input.behavior,
      force: input.force,
      targetDir: input.targetDir,
    },
    context,
  );

  // get all feedback files
  const allFeedback = getAllFeedbackForBehavior({ behaviorDir });

  // get status for each feedback file
  const feedbackWithStatus = allFeedback.map((fb) => ({
    ...fb,
    givenPathRel: relative(context.cwd, fb.givenPath),
    status: getFeedbackStatus({ givenPath: fb.givenPath }),
  }));

  // count by status
  const unresponded = feedbackWithStatus.filter(
    (fb) => fb.status.status === 'unresponded',
  ).length;
  const responded = feedbackWithStatus.filter(
    (fb) => fb.status.status === 'responded',
  ).length;
  const stale = feedbackWithStatus.filter(
    (fb) => fb.status.status === 'stale',
  ).length;

  return {
    behaviorDir,
    feedback: feedbackWithStatus,
    unresponded,
    responded,
    stale,
  };
};
