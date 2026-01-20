/**
 * .what = append a change event to the feedback change log
 * .why = enables undo/redo by record of mutations to the feedback file
 */
import { appendFileSync, existsSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';

export interface FeedbackChangeEvent {
  timestamp: string;
  action: 'add' | 'update' | 'undo' | 'redo';
  index: number;
  severity: 'blocker' | 'nitpick';
  before: string | null;
  after: string | null;
}

export const appendChangeLog = (input: {
  feedbackFile: string;
  event: Omit<FeedbackChangeEvent, 'timestamp'>;
}): void => {
  // derive log path from feedback file location
  const feedbackDir = dirname(input.feedbackFile);
  const logDir = join(feedbackDir, '.log');
  const logPath = join(logDir, 'changes.jsonl');

  // ensure log directory exists
  if (!existsSync(logDir)) {
    mkdirSync(logDir, { recursive: true });
  }

  // create timestamped event
  const event: FeedbackChangeEvent = {
    ...input.event,
    timestamp: new Date().toISOString(),
  };

  // append to jsonl file
  appendFileSync(logPath, JSON.stringify(event) + '\n');
};
