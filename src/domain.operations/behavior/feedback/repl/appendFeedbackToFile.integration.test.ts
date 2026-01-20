import { existsSync, readFileSync, rmSync, writeFileSync } from 'fs';
import { join } from 'path';
import { given, then, when } from 'test-fns';

import { appendChangeLog } from './appendChangeLog';
import { appendFeedbackToFile } from './appendFeedbackToFile';
import { redoLastUndo } from './redoLastUndo';
import { undoLastChange } from './undoLastChange';

/**
 * integration tests for file mutations with snapshots
 * demonstrates: append, update, undo, redo behavior on files
 */
describe('appendFeedbackToFile.integration', () => {
  const tmpDir = '/tmp';
  const getUniqueId = () =>
    `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  given('[case1] append new feedback', () => {
    const feedbackFile = join(tmpDir, `feedback-int-${getUniqueId()}.md`);

    beforeEach(() => {
      writeFileSync(feedbackFile, '# feedback\n');
    });

    afterEach(() => {
      if (existsSync(feedbackFile)) rmSync(feedbackFile);
      // cleanup the log directory
      const logDir = join(tmpDir, '.log');
      if (existsSync(logDir)) rmSync(logDir, { recursive: true });
    });

    when('[t0] blocker feedback appended', () => {
      then('file content matches snapshot', () => {
        appendFeedbackToFile({
          feedbackFile,
          severity: 'blocker',
          index: 1,
          text: 'this variable should be renamed for clarity',
        });

        const content = readFileSync(feedbackFile, 'utf-8');
        expect(content).toMatchSnapshot();
      });
    });

    when('[t1] multiple feedbacks appended', () => {
      then('file content with multiple blocks matches snapshot', () => {
        appendFeedbackToFile({
          feedbackFile,
          severity: 'blocker',
          index: 1,
          text: 'critical bug in authentication',
        });

        appendFeedbackToFile({
          feedbackFile,
          severity: 'nitpick',
          index: 2,
          text: 'consider a more descriptive name',
        });

        appendFeedbackToFile({
          feedbackFile,
          severity: 'blocker',
          index: 3,
          text: 'missing error handling',
        });

        const content = readFileSync(feedbackFile, 'utf-8');
        expect(content).toMatchSnapshot();
      });
    });
  });

  given('[case2] update existing feedback', () => {
    const feedbackFile = join(tmpDir, `feedback-int-${getUniqueId()}.md`);

    beforeEach(() => {
      // create file with existing feedback in new triple delimiter format
      writeFileSync(
        feedbackFile,
        [
          '# feedback',
          '',
          '---',
          '---',
          '---',
          '',
          '# blocker.1',
          '',
          'original feedback text',
          '',
          '---',
          '---',
          '---',
          '',
        ].join('\n'),
      );
    });

    afterEach(() => {
      if (existsSync(feedbackFile)) rmSync(feedbackFile);
    });

    when('[t0] same index submitted again', () => {
      then('file content after update matches snapshot', () => {
        const result = appendFeedbackToFile({
          feedbackFile,
          severity: 'blocker',
          index: 1,
          text: 'updated feedback with more detail',
        });

        expect(result.action).toBe('update');
        expect(result.before).toBe('original feedback text');

        const content = readFileSync(feedbackFile, 'utf-8');
        expect(content).toMatchSnapshot();
      });
    });
  });

  given('[case3] undo last change', () => {
    const feedbackFile = join(tmpDir, `feedback-int-${getUniqueId()}.md`);

    beforeEach(() => {
      writeFileSync(feedbackFile, '# feedback\n');
    });

    afterEach(() => {
      if (existsSync(feedbackFile)) rmSync(feedbackFile);
      // cleanup the actual log directory (not .changelog.json)
      const logDir = join(tmpDir, '.log');
      if (existsSync(logDir)) rmSync(logDir, { recursive: true });
    });

    when('[t0] feedback added then undone', () => {
      then('file content after undo matches snapshot', () => {
        // add feedback
        const addResult = appendFeedbackToFile({
          feedbackFile,
          severity: 'blocker',
          index: 1,
          text: 'this will be undone',
        });

        // log the change
        appendChangeLog({
          feedbackFile,
          event: {
            action: addResult.action,
            index: 1,
            severity: 'blocker',
            before: addResult.before,
            after: 'this will be undone',
          },
        });

        // verify feedback exists
        const contentBefore = readFileSync(feedbackFile, 'utf-8');
        expect(contentBefore).toContain('this will be undone');

        // undo
        const undoResult = undoLastChange({ feedbackFile });
        expect(undoResult.undone).toBe(true);

        // verify feedback removed
        const contentAfter = readFileSync(feedbackFile, 'utf-8');
        expect(contentAfter).toMatchSnapshot();
        expect(contentAfter).not.toContain('this will be undone');
      });
    });

    when('[t1] update then undo', () => {
      then('file content reverts to original', () => {
        // add initial feedback
        const addResult = appendFeedbackToFile({
          feedbackFile,
          severity: 'blocker',
          index: 1,
          text: 'original text',
        });
        appendChangeLog({
          feedbackFile,
          event: {
            action: addResult.action,
            index: 1,
            severity: 'blocker',
            before: addResult.before,
            after: 'original text',
          },
        });

        // update feedback
        const updateResult = appendFeedbackToFile({
          feedbackFile,
          severity: 'blocker',
          index: 1,
          text: 'updated text',
        });
        appendChangeLog({
          feedbackFile,
          event: {
            action: updateResult.action,
            index: 1,
            severity: 'blocker',
            before: updateResult.before,
            after: 'updated text',
          },
        });

        // verify updated
        expect(readFileSync(feedbackFile, 'utf-8')).toContain('updated text');

        // undo the update
        undoLastChange({ feedbackFile });

        // verify reverted to original
        const contentAfterUndo = readFileSync(feedbackFile, 'utf-8');
        expect(contentAfterUndo).toContain('original text');
        expect(contentAfterUndo).not.toContain('updated text');
        expect(contentAfterUndo).toMatchSnapshot();
      });
    });
  });

  given('[case4] redo after undo', () => {
    const feedbackFile = join(tmpDir, `feedback-int-${getUniqueId()}.md`);

    beforeEach(() => {
      writeFileSync(feedbackFile, '# feedback\n');
    });

    afterEach(() => {
      if (existsSync(feedbackFile)) rmSync(feedbackFile);
      // cleanup the log directory
      const logDir = join(tmpDir, '.log');
      if (existsSync(logDir)) rmSync(logDir, { recursive: true });
    });

    when('[t0] add, undo, then redo', () => {
      then('file content after redo matches snapshot', () => {
        // add feedback
        const addResult = appendFeedbackToFile({
          feedbackFile,
          severity: 'blocker',
          index: 1,
          text: 'feedback to undo and redo',
        });
        appendChangeLog({
          feedbackFile,
          event: {
            action: addResult.action,
            index: 1,
            severity: 'blocker',
            before: addResult.before,
            after: 'feedback to undo and redo',
          },
        });

        // undo
        undoLastChange({ feedbackFile });
        expect(readFileSync(feedbackFile, 'utf-8')).not.toContain(
          'feedback to undo and redo',
        );

        // redo
        const redoResult = redoLastUndo({ feedbackFile });
        expect(redoResult.redone).toBe(true);

        // verify restored
        const contentAfterRedo = readFileSync(feedbackFile, 'utf-8');
        expect(contentAfterRedo).toContain('feedback to undo and redo');
        expect(contentAfterRedo).toMatchSnapshot();
      });
    });
  });
});
