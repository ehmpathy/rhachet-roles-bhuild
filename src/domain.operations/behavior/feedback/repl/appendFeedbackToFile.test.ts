import { existsSync, readFileSync, unlinkSync, writeFileSync } from 'fs';
import { join } from 'path';
import { given, then, when } from 'test-fns';

import { appendFeedbackToFile } from './appendFeedbackToFile';

// generate unique ids for test isolation
const getUniqueId = () =>
  `${Date.now()}-${Math.random().toString(36).slice(2)}`;

describe('appendFeedbackToFile', () => {
  const tmpDir = '/tmp';

  given('[case1] empty feedback file', () => {
    const feedbackFile = join(tmpDir, `feedback-${getUniqueId()}.md`);

    beforeEach(() => {
      writeFileSync(feedbackFile, '# feedback\n');
    });

    afterEach(() => {
      if (existsSync(feedbackFile)) unlinkSync(feedbackFile);
    });

    when('[t0] blocker feedback appended', () => {
      then('file contains the feedback block', () => {
        appendFeedbackToFile({
          feedbackFile,
          severity: 'blocker',
          index: 1,
          text: 'this is wrong',
        });

        const content = readFileSync(feedbackFile, 'utf-8');
        expect(content).toContain('# blocker.1');
        expect(content).toContain('this is wrong');
        expect(content).toContain('---');
      });
    });
  });

  given('[case2] file with prior feedback', () => {
    const feedbackFile = join(tmpDir, `feedback-${getUniqueId()}.md`);

    beforeEach(() => {
      writeFileSync(
        feedbackFile,
        '# feedback\n\n# blocker.1\n\nprior text\n\n---\n',
      );
    });

    afterEach(() => {
      if (existsSync(feedbackFile)) unlinkSync(feedbackFile);
    });

    when('[t0] nitpick feedback appended', () => {
      then('file contains both feedbacks', () => {
        appendFeedbackToFile({
          feedbackFile,
          severity: 'nitpick',
          index: 2,
          text: 'consider refactor',
        });

        const content = readFileSync(feedbackFile, 'utf-8');
        expect(content).toContain('# blocker.1');
        expect(content).toContain('prior text');
        expect(content).toContain('# nitpick.2');
        expect(content).toContain('consider refactor');
      });
    });
  });

  given('[case3] multiline feedback', () => {
    const feedbackFile = join(tmpDir, `feedback-${getUniqueId()}.md`);

    beforeEach(() => {
      writeFileSync(feedbackFile, '# feedback\n');
    });

    afterEach(() => {
      if (existsSync(feedbackFile)) unlinkSync(feedbackFile);
    });

    when('[t0] multiline text appended', () => {
      then('all lines are preserved in file', () => {
        appendFeedbackToFile({
          feedbackFile,
          severity: 'blocker',
          index: 1,
          text: 'line one\nline two\nline three',
        });

        const content = readFileSync(feedbackFile, 'utf-8');
        expect(content).toContain('line one\nline two\nline three');
      });
    });
  });

  given('[case4] upsert semantics for duplicate header', () => {
    const feedbackFile = join(tmpDir, `feedback-${getUniqueId()}.md`);

    beforeEach(() => {
      // use the new triple delimiter format
      writeFileSync(
        feedbackFile,
        '# feedback\n\n---\n---\n---\n\n# blocker.1\n\noriginal text\n\n---\n---\n---\n',
      );
    });

    afterEach(() => {
      if (existsSync(feedbackFile)) unlinkSync(feedbackFile);
    });

    when('[t0] same header submitted again', () => {
      then('block content is replaced', () => {
        appendFeedbackToFile({
          feedbackFile,
          severity: 'blocker',
          index: 1,
          text: 'updated text',
        });

        const content = readFileSync(feedbackFile, 'utf-8');
        expect(content).toContain('updated text');
        expect(content).not.toContain('original text');
      });

      then('only one block with that header exists', () => {
        appendFeedbackToFile({
          feedbackFile,
          severity: 'blocker',
          index: 1,
          text: 'updated text',
        });

        const content = readFileSync(feedbackFile, 'utf-8');
        const matches = content.match(/# blocker\.1/g);
        expect(matches?.length).toBe(1);
      });

      then('returns action=update with prior text', () => {
        const result = appendFeedbackToFile({
          feedbackFile,
          severity: 'blocker',
          index: 1,
          text: 'updated text',
        });

        expect(result.action).toBe('update');
        expect(result.before).toBe('original text');
      });
    });
  });

  given('[case5] action return value for new feedback', () => {
    const feedbackFile = join(tmpDir, `feedback-${getUniqueId()}.md`);

    beforeEach(() => {
      writeFileSync(feedbackFile, '# feedback\n');
    });

    afterEach(() => {
      if (existsSync(feedbackFile)) unlinkSync(feedbackFile);
    });

    when('[t0] new feedback appended', () => {
      then('returns action=add with before=null', () => {
        const result = appendFeedbackToFile({
          feedbackFile,
          severity: 'blocker',
          index: 1,
          text: 'new feedback',
        });

        expect(result.action).toBe('add');
        expect(result.before).toBeNull();
      });
    });
  });
});
