/**
 * .what = redo the last undone feedback change
 * .why = enables recovery from accidental undos
 */
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';

import { appendChangeLog, type FeedbackChangeEvent } from './appendChangeLog';

export const redoLastUndo = (input: {
  feedbackFile: string;
}): { redone: boolean; event: FeedbackChangeEvent | null } => {
  // derive log path
  const feedbackDir = dirname(input.feedbackFile);
  const logPath = join(feedbackDir, '.log', 'changes.jsonl');

  // check if log exists
  if (!existsSync(logPath)) {
    return { redone: false, event: null };
  }

  // read all events
  const content = readFileSync(logPath, 'utf-8');
  const lines = content.trim().split('\n').filter(Boolean);
  const events: FeedbackChangeEvent[] = lines.map((line) => JSON.parse(line));

  // find last undo that hasnt been redone
  // logic: scan backwards, find last undo, check no redo follows it for same index
  let lastUndo: FeedbackChangeEvent | null = null;
  for (let i = events.length - 1; i >= 0; i--) {
    const event = events[i];
    if (!event) continue;
    if (event.action === 'undo') {
      // check if this undo was followed by a redo for same index
      let hasFollowupRedo = false;
      for (let j = i + 1; j < events.length; j++) {
        const laterEvent = events[j];
        if (laterEvent?.action === 'redo' && laterEvent.index === event.index) {
          hasFollowupRedo = true;
          break;
        }
      }
      if (!hasFollowupRedo) {
        lastUndo = event;
        break;
      }
    }
  }

  if (!lastUndo) {
    return { redone: false, event: null };
  }

  // read current feedback file
  const feedbackContent = readFileSync(input.feedbackFile, 'utf-8');

  // the undo.before is what we want to restore (the original "after")
  const textToRestore = lastUndo.before; // this was the "after" before undo

  if (textToRestore === null) {
    // undo removed the block entirely, so redo means we need to add it back
    // but we dont have the text to add back... this shouldnt happen
    return { redone: false, event: null };
  }

  // check if block already exists (shouldnt after undo)
  const headerPattern = `# ${lastUndo.severity}.${lastUndo.index}`;
  const delimiter = '---\\n---\\n---';
  const blockRegex = new RegExp(
    `${delimiter}\\n\\n${headerPattern}\\n\\n[\\s\\S]*?\\n\\n${delimiter}\\n`,
    'g',
  );

  // triple delimiter literal for building new blocks
  const delimiterLiteral = '---\n---\n---';

  let newContent: string;
  if (feedbackContent.match(blockRegex)) {
    // block exists - replace it
    const restoredBlock = `${delimiterLiteral}\n\n${headerPattern}\n\n${textToRestore}\n\n${delimiterLiteral}\n`;
    newContent = feedbackContent.replace(blockRegex, restoredBlock);
  } else {
    // block doesnt exist - append it
    const restoredBlock = `${delimiterLiteral}\n\n${headerPattern}\n\n${textToRestore}\n\n${delimiterLiteral}\n`;
    newContent = feedbackContent + '\n' + restoredBlock;
  }

  // write updated content
  writeFileSync(input.feedbackFile, newContent);

  // append redo event to log
  appendChangeLog({
    feedbackFile: input.feedbackFile,
    event: {
      action: 'redo',
      index: lastUndo.index,
      severity: lastUndo.severity,
      before: lastUndo.after, // what was there after undo (null or prior)
      after: lastUndo.before, // what we restored
    },
  });

  return { redone: true, event: lastUndo };
};
