import { existsSync, readFileSync, writeFileSync } from 'fs';

import { computeFeedbackBlockContent } from './computeFeedbackBlockContent';

/**
 * .what = upsert a feedback entry to a feedback file
 * .why = enables repl to persist feedback with replace semantics for same header
 */
export const appendFeedbackToFile = (input: {
  feedbackFile: string;
  severity: 'blocker' | 'nitpick';
  index: number;
  text: string;
}): { action: 'add' | 'update'; before: string | null } => {
  // compute the markdown block content
  const content = computeFeedbackBlockContent({
    severity: input.severity,
    index: input.index,
    text: input.text,
  });

  // build the header pattern for this feedback
  const headerPattern = `# ${input.severity}.${input.index}`;
  const delimiter = '---\\n---\\n---';

  // regex to match the full block with triple --- delimiters
  const blockRegex = new RegExp(
    `${delimiter}\\n\\n${headerPattern}\\n\\n[\\s\\S]*?\\n\\n${delimiter}\\n`,
    'g',
  );

  // read current file content if exists
  const fileContent = existsSync(input.feedbackFile)
    ? readFileSync(input.feedbackFile, 'utf-8')
    : '';

  // check if block already exists
  const priorMatch = fileContent.match(blockRegex);

  if (priorMatch) {
    // extract prior text from the matched block
    const priorBlock = priorMatch[0] ?? '';
    const priorTextMatch = priorBlock.match(
      new RegExp(`${headerPattern}\\n\\n([\\s\\S]*?)\\n\\n${delimiter}\\n`),
    );
    const priorText = priorTextMatch?.[1]?.trim() ?? null;

    // replace the block (upsert) with proper delimiters
    const newContent = fileContent.replace(blockRegex, content);
    writeFileSync(input.feedbackFile, newContent);
    return { action: 'update', before: priorText };
  }

  // append new block
  writeFileSync(input.feedbackFile, `${fileContent}\n${content}`);
  return { action: 'add', before: null };
};
