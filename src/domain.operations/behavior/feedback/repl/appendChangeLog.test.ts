import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'fs';
import { join } from 'path';
import { given, then, when } from 'test-fns';

import { appendChangeLog, type FeedbackChangeEvent } from './appendChangeLog';

const TEST_DIR = join(__dirname, '.test', 'appendChangeLog');
const FEEDBACK_FILE = join(TEST_DIR, 'feedback.md');
const LOG_FILE = join(TEST_DIR, '.log', 'changes.jsonl');

describe('appendChangeLog', () => {
  beforeEach(() => {
    // clean and recreate test directory
    if (existsSync(TEST_DIR)) {
      rmSync(TEST_DIR, { recursive: true });
    }
    mkdirSync(TEST_DIR, { recursive: true });
    writeFileSync(FEEDBACK_FILE, '# feedback\n');
  });

  afterAll(() => {
    if (existsSync(TEST_DIR)) {
      rmSync(TEST_DIR, { recursive: true });
    }
  });

  given('[case1] no prior change log', () => {
    when('[t0] add event appended', () => {
      then('log file is created', () => {
        appendChangeLog({
          feedbackFile: FEEDBACK_FILE,
          event: {
            action: 'add',
            index: 1,
            severity: 'blocker',
            before: null,
            after: 'this is feedback',
          },
        });

        expect(existsSync(LOG_FILE)).toBe(true);
      });

      then('event contains timestamp', () => {
        appendChangeLog({
          feedbackFile: FEEDBACK_FILE,
          event: {
            action: 'add',
            index: 1,
            severity: 'blocker',
            before: null,
            after: 'this is feedback',
          },
        });

        const content = readFileSync(LOG_FILE, 'utf-8');
        const event: FeedbackChangeEvent = JSON.parse(content.trim());
        expect(event.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
      });

      then('event contains action and metadata', () => {
        appendChangeLog({
          feedbackFile: FEEDBACK_FILE,
          event: {
            action: 'add',
            index: 1,
            severity: 'blocker',
            before: null,
            after: 'this is feedback',
          },
        });

        const content = readFileSync(LOG_FILE, 'utf-8');
        const event: FeedbackChangeEvent = JSON.parse(content.trim());
        expect(event.action).toEqual('add');
        expect(event.index).toEqual(1);
        expect(event.severity).toEqual('blocker');
        expect(event.before).toBeNull();
        expect(event.after).toEqual('this is feedback');
      });
    });
  });

  given('[case2] prior change log exists', () => {
    when('[t0] second event appended', () => {
      then('both events are in log', () => {
        // first event
        appendChangeLog({
          feedbackFile: FEEDBACK_FILE,
          event: {
            action: 'add',
            index: 1,
            severity: 'blocker',
            before: null,
            after: 'first',
          },
        });

        // second event
        appendChangeLog({
          feedbackFile: FEEDBACK_FILE,
          event: {
            action: 'add',
            index: 2,
            severity: 'nitpick',
            before: null,
            after: 'second',
          },
        });

        const content = readFileSync(LOG_FILE, 'utf-8');
        const lines = content.trim().split('\n');
        expect(lines).toHaveLength(2);

        const event1: FeedbackChangeEvent = JSON.parse(lines[0] ?? '');
        const event2: FeedbackChangeEvent = JSON.parse(lines[1] ?? '');
        expect(event1.index).toEqual(1);
        expect(event2.index).toEqual(2);
      });
    });
  });

  given('[case3] update action', () => {
    when('[t0] update event appended', () => {
      then('before and after are both populated', () => {
        appendChangeLog({
          feedbackFile: FEEDBACK_FILE,
          event: {
            action: 'update',
            index: 1,
            severity: 'blocker',
            before: 'old text',
            after: 'new text',
          },
        });

        const content = readFileSync(LOG_FILE, 'utf-8');
        const event: FeedbackChangeEvent = JSON.parse(content.trim());
        expect(event.action).toEqual('update');
        expect(event.before).toEqual('old text');
        expect(event.after).toEqual('new text');
      });
    });
  });
});
