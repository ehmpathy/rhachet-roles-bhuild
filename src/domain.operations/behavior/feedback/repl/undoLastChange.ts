/**
 * .what = undo the last feedback change
 * .why = enables recovery from accidental submissions
 */
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';

import { appendChangeLog, type FeedbackChangeEvent } from './appendChangeLog';

export const undoLastChange = (input: {
  feedbackFile: string;
}): { undone: boolean; event: FeedbackChangeEvent | null } => {
  // derive log path
  const feedbackDir = dirname(input.feedbackFile);
  const logPath = join(feedbackDir, '.log', 'changes.jsonl');

  // check if log exists
  if (!existsSync(logPath)) {
    return { undone: false, event: null };
  }

  // read all events
  const content = readFileSync(logPath, 'utf-8');
  const lines = content.trim().split('\n').filter(Boolean);
  const events: FeedbackChangeEvent[] = lines.map((line) => JSON.parse(line));

  // find last undoable event (add or update, not already undone)
  const undoableActions = ['add', 'update', 'redo'];
  const undoneIndices = new Set<number>();

  // track what has been undone
  for (const event of events) {
    if (event.action === 'undo') {
      undoneIndices.add(event.index);
    }
    if (event.action === 'redo') {
      undoneIndices.delete(event.index);
    }
  }

  // find last event that can be undone
  let lastUndoable: FeedbackChangeEvent | null = null;
  for (let i = events.length - 1; i >= 0; i--) {
    const event = events[i];
    if (!event) continue;
    if (
      undoableActions.includes(event.action) &&
      !undoneIndices.has(event.index)
    ) {
      lastUndoable = event;
      break;
    }
  }

  if (!lastUndoable) {
    return { undone: false, event: null };
  }

  // read current feedback file
  const feedbackContent = readFileSync(input.feedbackFile, 'utf-8');

  // find and replace the block (matches new triple delimiter format)
  const headerPattern = `# ${lastUndoable.severity}.${lastUndoable.index}`;
  const delimiter = '---\\n---\\n---';
  const blockRegex = new RegExp(
    `${delimiter}\\n\\n${headerPattern}\\n\\n[\\s\\S]*?\\n\\n${delimiter}\\n`,
    'g',
  );

  let newContent: string;
  if (lastUndoable.before === null) {
    // was an add - remove the block entirely
    newContent = feedbackContent.replace(blockRegex, '');
  } else {
    // was an update - restore the prior content
    const delimiterLiteral = '---\n---\n---';
    const restoredBlock = `${delimiterLiteral}\n\n${headerPattern}\n\n${lastUndoable.before}\n\n${delimiterLiteral}\n`;
    newContent = feedbackContent.replace(blockRegex, restoredBlock);
  }

  // write updated content
  writeFileSync(input.feedbackFile, newContent);

  // append undo event to log
  appendChangeLog({
    feedbackFile: input.feedbackFile,
    event: {
      action: 'undo',
      index: lastUndoable.index,
      severity: lastUndoable.severity,
      before: lastUndoable.after,
      after: lastUndoable.before,
    },
  });

  return { undone: true, event: lastUndoable };
};
