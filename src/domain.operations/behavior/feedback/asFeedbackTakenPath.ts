/**
 * .what = derive [taken] path from [given] path
 * .why = ensures consistent path derivation for feedback response files
 *
 * .note = replaces [given] → [taken] and by_human → by_robot
 */
export const asFeedbackTakenPath = (input: { givenPath: string }): string => {
  return input.givenPath
    .replace('[given]', '[taken]')
    .replace('by_human', 'by_robot');
};
