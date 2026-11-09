import { asCountNoun } from './asCountNoun';
import type { ReviewerConcern } from './asReviewerOutputLines';
import type { getOneVisionRootPurpose } from './getOneVisionRootPurpose';
import { VISION_ROOT_PURPOSE_DEPTH_FLOOR } from './VISION_ROOT_PURPOSE_DEPTH_FLOOR';

/**
 * .what = the fix for a root purpose that is too shallow, by the shape it has
 * .why  = no layer, flat bullets, and a short chain each need a different next move
 * .note = a why in a foreign form is named by its own nitpick, never here
 */
const asFixOfDepth = (input: {
  purpose: ReturnType<typeof getOneVisionRootPurpose>;
}): string => {
  if (input.purpose.layers === 0)
    return 'write the first `- why:` bullet under the header, then nest each next why one indent under it; a `- why:` inside a code fence is an example, not a layer';
  if (input.purpose.placeholders > 0)
    return 'fill the scaffold layers first; each filled layer counts toward depth';
  if (input.purpose.layers > input.purpose.depth)
    return 'nest each `- why:` at least 2 columns under the last, in one chain; bullets at one indent, one column in, or side by side in branches add no depth';
  return 'ask why of the deepest layer, and nest the answer as a `- why:` under it';
};

/**
 * .what = the blockers a root purpose earns, each with its fix
 * .why  = the depth lane refuses an absent section, scaffold left as is, or fewer than
 *         3 layers; each refusal names the next move (rule.require.errors-name-the-fix)
 */
export const getAllVisionRootPurposeBlockers = (input: {
  purpose: ReturnType<typeof getOneVisionRootPurpose>;
}): ReviewerConcern[] => {
  const { purpose } = input;
  const floor = VISION_ROOT_PURPOSE_DEPTH_FLOOR;

  // graded `better`: a vision is not shipped, and the human gate on 1.vision catches a
  // misdirected build before code exists (fulcrum F4)
  const severity = 'better' as const;

  // absent section: the one blocker
  if (purpose.section === 'absent')
    return [
      {
        what: 'the vision has no `## .the root purpose` section',
        fix: `add \`## .the root purpose\`, exactly so (no text after it), as the first \`##\` section right under the title, with at least ${floor} nested \`- why:\` layers, each a motive; a header inside a code fence or an html comment does not count`,
        severity,
      },
    ];

  // scaffold text left in place
  const blockersOfScaffold =
    purpose.placeholders > 0
      ? [
          {
            what: `the root purpose holds no motive in ${asCountNoun({ count: purpose.placeholders, singular: 'layer', plural: 'layers' })} (scaffold text or a blank \`- why:\`)`,
            fix: 'write the motive itself in each, in place of the blank or the scaffold; drop the angle brackets, since a motive wrapped in `<…>` reads as scaffold',
            severity,
          },
        ]
      : [];

  // too shallow; skip when the scaffold blocker already says why (no real layer at all)
  const isShallow = purpose.depth < floor;
  const isOnlyScaffold = purpose.layers === 0 && purpose.placeholders > 0;
  const blockersOfDepth =
    isShallow && !isOnlyScaffold
      ? [
          {
            what: `the root purpose is ${asCountNoun({ count: purpose.depth, singular: 'layer', plural: 'layers' })} deep; it owes at least ${floor}`,
            fix: asFixOfDepth({ purpose }),
            severity,
          },
        ]
      : [];

  return [...blockersOfScaffold, ...blockersOfDepth];
};
