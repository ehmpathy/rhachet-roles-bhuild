/**
 * .what = compute markdown block content for a feedback entry
 * .why = formats feedback for append to feedback file per blueprint block format
 *
 * block format:
 *   ---
 *   ---
 *   ---
 *
 *   # blocker.1
 *
 *   the feedback content
 *
 *   ---
 *   ---
 *   ---
 */
export const computeFeedbackBlockContent = (input: {
  severity: 'blocker' | 'nitpick';
  index: number;
  text: string;
}): string => {
  // build header with severity and index
  const header = `# ${input.severity}.${input.index}`;

  // triple --- delimiter
  const delimiter = '---\n---\n---';

  // ensure text ends with newline
  const textNormalized = input.text.endsWith('\n')
    ? input.text
    : `${input.text}\n`;

  // combine with delimiters per blueprint
  return `${delimiter}\n\n${header}\n\n${textNormalized}\n${delimiter}\n`;
};
