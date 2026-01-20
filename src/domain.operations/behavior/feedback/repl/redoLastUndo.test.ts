import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'fs';
import { join } from 'path';
import { given, then, when } from 'test-fns';

import { appendChangeLog } from './appendChangeLog';
import { redoLastUndo } from './redoLastUndo';
import { undoLastChange } from './undoLastChange';

const TEST_DIR = join(__dirname, '.test', 'redoLastUndo');
const FEEDBACK_FILE = join(TEST_DIR, 'feedback.md');

describe('redoLastUndo', () => {
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
    when('[t0] redo invoked', () => {
      then('returns redone=false', () => {
        writeFileSync(FEEDBACK_FILE, '# feedback\n');

        const result = redoLastUndo({ feedbackFile: FEEDBACK_FILE });

        expect(result.redone).toBe(false);
        expect(result.event).toBeNull();
      });
    });
  });

  given('[case2] no undo events in log', () => {
    when('[t0] redo invoked', () => {
      then('returns redone=false', () => {
        writeFileSync(
          FEEDBACK_FILE,
          '# feedback\n\n---\n---\n---\n\n# blocker.1\n\ntext\n\n---\n---\n---\n',
        );
        appendChangeLog({
          feedbackFile: FEEDBACK_FILE,
          event: {
            action: 'add',
            index: 1,
            severity: 'blocker',
            before: null,
            after: 'text',
          },
        });

        const result = redoLastUndo({ feedbackFile: FEEDBACK_FILE });

        expect(result.redone).toBe(false);
      });
    });
  });

  given('[case3] one undo event in log', () => {
    when('[t0] redo invoked', () => {
      then('block is restored to file', () => {
        // setup: add feedback, then undo it (new triple delimiter format)
        writeFileSync(
          FEEDBACK_FILE,
          '# feedback\n\n---\n---\n---\n\n# blocker.1\n\nthe text\n\n---\n---\n---\n',
        );
        appendChangeLog({
          feedbackFile: FEEDBACK_FILE,
          event: {
            action: 'add',
            index: 1,
            severity: 'blocker',
            before: null,
            after: 'the text',
          },
        });
        undoLastChange({ feedbackFile: FEEDBACK_FILE });

        // verify it was removed
        let content = readFileSync(FEEDBACK_FILE, 'utf-8');
        expect(content).not.toContain('the text');

        // redo
        const result = redoLastUndo({ feedbackFile: FEEDBACK_FILE });

        expect(result.redone).toBe(true);
        content = readFileSync(FEEDBACK_FILE, 'utf-8');
        expect(content).toContain('# blocker.1');
        expect(content).toContain('the text');
      });

      then('redo event is appended to log', () => {
        writeFileSync(
          FEEDBACK_FILE,
          '# feedback\n\n---\n---\n---\n\n# blocker.1\n\ntext\n\n---\n---\n---\n',
        );
        appendChangeLog({
          feedbackFile: FEEDBACK_FILE,
          event: {
            action: 'add',
            index: 1,
            severity: 'blocker',
            before: null,
            after: 'text',
          },
        });
        undoLastChange({ feedbackFile: FEEDBACK_FILE });

        redoLastUndo({ feedbackFile: FEEDBACK_FILE });

        const logContent = readFileSync(
          join(TEST_DIR, '.log', 'changes.jsonl'),
          'utf-8',
        );
        const lines = logContent.trim().split('\n');
        expect(lines).toHaveLength(3); // add, undo, redo
        const redoEvent = JSON.parse(lines[2] ?? '');
        expect(redoEvent.action).toEqual('redo');
      });
    });
  });

  given('[case4] redo after redo (already redone)', () => {
    when('[t0] redo invoked twice', () => {
      then('second redo returns redone=false', () => {
        writeFileSync(
          FEEDBACK_FILE,
          '# feedback\n\n---\n---\n---\n\n# blocker.1\n\ntext\n\n---\n---\n---\n',
        );
        appendChangeLog({
          feedbackFile: FEEDBACK_FILE,
          event: {
            action: 'add',
            index: 1,
            severity: 'blocker',
            before: null,
            after: 'text',
          },
        });
        undoLastChange({ feedbackFile: FEEDBACK_FILE });

        // first redo succeeds
        const result1 = redoLastUndo({ feedbackFile: FEEDBACK_FILE });
        expect(result1.redone).toBe(true);

        // second redo fails (no undos left to redo)
        const result2 = redoLastUndo({ feedbackFile: FEEDBACK_FILE });
        expect(result2.redone).toBe(false);
      });
    });
  });

  given('[case5] undo-redo-undo-redo cycle', () => {
    when('[t0] full cycle executed', () => {
      then('file returns to original state', () => {
        writeFileSync(
          FEEDBACK_FILE,
          '# feedback\n\n---\n---\n---\n\n# blocker.1\n\noriginal\n\n---\n---\n---\n',
        );
        appendChangeLog({
          feedbackFile: FEEDBACK_FILE,
          event: {
            action: 'add',
            index: 1,
            severity: 'blocker',
            before: null,
            after: 'original',
          },
        });

        // undo
        undoLastChange({ feedbackFile: FEEDBACK_FILE });
        let content = readFileSync(FEEDBACK_FILE, 'utf-8');
        expect(content).not.toContain('original');

        // redo
        redoLastUndo({ feedbackFile: FEEDBACK_FILE });
        content = readFileSync(FEEDBACK_FILE, 'utf-8');
        expect(content).toContain('original');

        // undo again
        undoLastChange({ feedbackFile: FEEDBACK_FILE });
        content = readFileSync(FEEDBACK_FILE, 'utf-8');
        expect(content).not.toContain('original');

        // redo again
        redoLastUndo({ feedbackFile: FEEDBACK_FILE });
        content = readFileSync(FEEDBACK_FILE, 'utf-8');
        expect(content).toContain('original');
      });
    });
  });
});
