import { asCountNoun } from './asCountNoun';
import type { ReviewerConcern } from './asReviewerOutputLines';
import type { getOneVisionRootPurpose } from './getOneVisionRootPurpose';

/**
 * .what = the nitpicks a root purpose earns, each with its fix
 * .why  = three things the lane can read but must not block on:
 *         - a why in a foreign form (`* why:`, `1. why`) counts as naught; a nitpick names it,
 *           always — never a silent drop, and never a condition tied to the blocker decider
 *         - a section below another `##` is read after the shape it should frame; a reviewer
 *           and the 1.vision approver read the motive first only where it comes first
 *         - a second `## .the root purpose` is never read; a nitpick names it, so its layers
 *           are not lost in silence
 */
export const getAllVisionRootPurposeNitpicks = (input: {
  purpose: ReturnType<typeof getOneVisionRootPurpose>;
}): ReviewerConcern[] => {
  const { purpose } = input;

  // graded `better`: each costs the author a round, never a shipped harm
  const severity = 'better' as const;

  // whys the lane cannot read
  const nitpicksOfForm =
    purpose.malformed > 0
      ? [
          {
            what: `the root purpose holds ${asCountNoun({ count: purpose.malformed, singular: 'why', plural: 'whys' })} in a form the lane does not read`,
            fix: 'rewrite each as a `- why:` bullet outside any `>` quote, nested 2 to 5 columns under the layer it answers',
            severity,
          },
        ]
      : [];

  // a section present, yet not the yield's first
  const nitpicksOfPosition =
    purpose.section === 'present' && !purpose.isFirst
      ? [
          {
            what: 'the root purpose is not the first `##` section of the vision',
            fix: 'move `## .the root purpose` above every other `##` section, right under the title, so the motive is read before the shape',
            severity,
          },
        ]
      : [];

  // a second header the lane never reads
  const nitpicksOfDuplicate =
    purpose.headers > 1
      ? [
          {
            what: `the vision holds ${purpose.headers} \`## .the root purpose\` headers; the lane reads only the first`,
            fix: 'keep one `## .the root purpose` section, and merge the layers of the others into it',
            severity,
          },
        ]
      : [];

  return [...nitpicksOfForm, ...nitpicksOfPosition, ...nitpicksOfDuplicate];
};
