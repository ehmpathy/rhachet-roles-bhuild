import { asReviewerOutputLines } from './asReviewerOutputLines';
import { getAllVisionRootPurposeBlockers } from './getAllVisionRootPurposeBlockers';
import { getAllVisionRootPurposeNitpicks } from './getAllVisionRootPurposeNitpicks';
import type { getOneVisionRootPurpose } from './getOneVisionRootPurpose';
import { VISION_ROOT_PURPOSE_DEPTH_FLOOR } from './VISION_ROOT_PURPOSE_DEPTH_FLOOR';

/**
 * .what = the head lines: the yield, its section state, and — only when present — its depth
 * .why  = an absent section has no depth to report, so the layers line appears only beside one
 */
const asLinesOfHead = (input: {
  vision: string;
  purpose: ReturnType<typeof getOneVisionRootPurpose>;
}): string[] => {
  const linesOfName = [
    '🦫 root purpose',
    `   ├─ vision: ${input.vision}`,
    `   ├─ section: ${input.purpose.section}`,
  ];
  if (input.purpose.section !== 'present') return linesOfName;
  return [
    ...linesOfName,
    `   ├─ layers: ${input.purpose.depth} of ${VISION_ROOT_PURPOSE_DEPTH_FLOOR}`,
  ];
};

/**
 * .what = renders the depth lane's verdict as reviewer stdout
 * .why  = the head names the yield and what the lane read; the tail is the shared reviewer
 *         output, which always holds both numeric counts (contract.reviewer-output)
 * .note = pure: the concerns are decided here, from the one purpose the head reports, so a
 *         head can never sit beside the concerns of another read
 */
export const asVisionRootPurposeReport = (input: {
  vision: string;
  purpose: ReturnType<typeof getOneVisionRootPurpose>;
}): { blockers: number; nitpicks: number; stdout: string } => {
  // the concerns: each decided from the same purpose
  const blockers = getAllVisionRootPurposeBlockers({ purpose: input.purpose });
  const nitpicks = getAllVisionRootPurposeNitpicks({ purpose: input.purpose });

  // the head: the yield, and what the lane read of it
  const linesOfHead = asLinesOfHead({
    vision: input.vision,
    purpose: input.purpose,
  });

  // the tail: each concern with its fix, then the two numeric lines the guard reads
  const linesOfTail = asReviewerOutputLines({ blockers, nitpicks });

  return {
    blockers: blockers.length,
    nitpicks: nitpicks.length,
    stdout: [...linesOfHead, ...linesOfTail].join('\n'),
  };
};
