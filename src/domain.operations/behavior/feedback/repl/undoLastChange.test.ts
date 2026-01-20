import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'fs';
import { join } from 'path';
import { given, then, when } from 'test-fns';

import { appendChangeLog } from './appendChangeLog';
import { undoLastChange } from './undoLastChange';

const TEST_DIR = join(__dirname, '.test', 'undoLastChange');
const FEEDBACK_FILE = join(TEST_DIR, 'feedback.md');

describe('undoLastChange', () => {
  beforeEach(() => {
    // clean and recreate test directory
    if (existsSync(TEST_DIR)) {
      rmSync(TEST_DIR, { recursive: true });
    }
    mkdirSync(TEST_DIR, { recursive: true });
  });

  afterAll(() => {
    if (existsSync(TEST_DIR)) {
      rmSync(TEST_DIR, { recursive: true });
    }
  });

  given('[case1] no change log exists', () => {
    when('[t0] undo invoked', () => {
      then('returns undone=false', () => {
        writeFileSync(FEEDBACK_FILE, '# feedback\n');

        const result = undoLastChange({ feedbackFile: FEEDBACK_FILE });

        expect(result.undone).toBe(false);
        expect(result.event).toBeNull();
      });
    });
  });

  given('[case2] one add event in log', () => {
    when('[t0] undo invoked', () => {
      then('block is removed from file', () => {
        // setup: file with one feedback block (new triple delimiter format)
        writeFileSync(
          FEEDBACK_FILE,
          '# feedback\n\n---\n---\n---\n\n# blocker.1\n\nthis is feedback\n\n---\n---\n---\n',
        );
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

        const result = undoLastChange({ feedbackFile: FEEDBACK_FILE });

        expect(result.undone).toBe(true);
        const content = readFileSync(FEEDBACK_FILE, 'utf-8');
        expect(content).not.toContain('# blocker.1');
        expect(content).not.toContain('this is feedback');
      });

      then('undo event is appended to log', () => {
        writeFileSync(
          FEEDBACK_FILE,
          '# feedback\n\n---\n---\n---\n\n# blocker.1\n\nthis is feedback\n\n---\n---\n---\n',
        );
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

        undoLastChange({ feedbackFile: FEEDBACK_FILE });

        const logContent = readFileSync(
          join(TEST_DIR, '.log', 'changes.jsonl'),
          'utf-8',
        );
        const lines = logContent.trim().split('\n');
        expect(lines).toHaveLength(2);
        const undoEvent = JSON.parse(lines[1] ?? '');
        expect(undoEvent.action).toEqual('undo');
      });
    });
  });

  given('[case3] update event in log', () => {
    when('[t0] undo invoked', () => {
      then('prior content is restored', () => {
        // setup: file with updated feedback block (new triple delimiter format)
        writeFileSync(
          FEEDBACK_FILE,
          '# feedback\n\n---\n---\n---\n\n# blocker.1\n\nnew text\n\n---\n---\n---\n',
        );
        appendChangeLog({
          feedbackFile: FEEDBACK_FILE,
          event: {
            action: 'add',
            index: 1,
            severity: 'blocker',
            before: null,
            after: 'old text',
          },
        });
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

        undoLastChange({ feedbackFile: FEEDBACK_FILE });

        const content = readFileSync(FEEDBACK_FILE, 'utf-8');
        expect(content).toContain('old text');
        expect(content).not.toContain('new text');
      });
    });
  });

  given('[case4] already undone event', () => {
    when('[t0] undo invoked twice', () => {
      then('second undo returns undone=false', () => {
        // setup: file with one feedback block (new triple delimiter format)
        writeFileSync(
          FEEDBACK_FILE,
          '# feedback\n\n---\n---\n---\n\n# blocker.1\n\nfeedback\n\n---\n---\n---\n',
        );
        appendChangeLog({
          feedbackFile: FEEDBACK_FILE,
          event: {
            action: 'add',
            index: 1,
            severity: 'blocker',
            before: null,
            after: 'feedback',
          },
        });

        // first undo succeeds
        const result1 = undoLastChange({ feedbackFile: FEEDBACK_FILE });
        expect(result1.undone).toBe(true);

        // second undo fails (no undoable events left)
        const result2 = undoLastChange({ feedbackFile: FEEDBACK_FILE });
        expect(result2.undone).toBe(false);
      });
    });
  });

  given('[case5] multiple events, undo last only', () => {
    when('[t0] undo invoked', () => {
      then('only last event is undone', () => {
        // setup: file with two feedback blocks (new triple delimiter format)
        writeFileSync(
          FEEDBACK_FILE,
          '# feedback\n\n---\n---\n---\n\n# blocker.1\n\nfirst\n\n---\n---\n---\n\n---\n---\n---\n\n# nitpick.2\n\nsecond\n\n---\n---\n---\n',
        );
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

        undoLastChange({ feedbackFile: FEEDBACK_FILE });

        const content = readFileSync(FEEDBACK_FILE, 'utf-8');
        expect(content).toContain('# blocker.1');
        expect(content).toContain('first');
        expect(content).not.toContain('# nitpick.2');
        expect(content).not.toContain('second');
      });
    });
  });
});
