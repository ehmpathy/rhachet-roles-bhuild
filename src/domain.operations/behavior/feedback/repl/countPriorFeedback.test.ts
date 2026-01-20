import { existsSync, unlinkSync, writeFileSync } from 'fs';
import { join } from 'path';
import { given, then, when } from 'test-fns';

import { countPriorFeedback } from './countPriorFeedback';

// generate unique ids for test isolation
const getUniqueId = () =>
  `${Date.now()}-${Math.random().toString(36).slice(2)}`;

describe('countPriorFeedback', () => {
  const tmpDir = '/tmp';

  given('[case1] file does not exist', () => {
    when('[t0] countPriorFeedback called', () => {
      then('returns count=0, blockerCount=0, nitpickCount=0, empty texts', () => {
        const result = countPriorFeedback({
          feedbackFile: `/tmp/nonexistent-${getUniqueId()}.md`,
        });
        expect(result.count).toBe(0);
        expect(result.blockerCount).toBe(0);
        expect(result.nitpickCount).toBe(0);
        expect(result.texts).toEqual([]);
      });
    });
  });

  given('[case2] file with no feedback blocks', () => {
    const feedbackFile = join(tmpDir, `feedback-${getUniqueId()}.md`);

    beforeEach(() => {
      writeFileSync(feedbackFile, '# feedback\n\nsome header text\n');
    });

    afterEach(() => {
      if (existsSync(feedbackFile)) unlinkSync(feedbackFile);
    });

    when('[t0] countPriorFeedback called', () => {
      then('returns count=0', () => {
        const result = countPriorFeedback({ feedbackFile });
        expect(result.count).toBe(0);
      });
    });
  });

  given('[case3] file with one feedback block', () => {
    const feedbackFile = join(tmpDir, `feedback-${getUniqueId()}.md`);

    beforeEach(() => {
      writeFileSync(
        feedbackFile,
        '# feedback\n\n# blocker.1\n\nfirst feedback\n---\n',
      );
    });

    afterEach(() => {
      if (existsSync(feedbackFile)) unlinkSync(feedbackFile);
    });

    when('[t0] countPriorFeedback called', () => {
      then('returns count=1', () => {
        const result = countPriorFeedback({ feedbackFile });
        expect(result.count).toBe(1);
      });

      then('texts contains the feedback text', () => {
        const result = countPriorFeedback({ feedbackFile });
        expect(result.texts).toEqual(['first feedback']);
      });
    });
  });

  given('[case4] file with multiple feedback blocks', () => {
    const feedbackFile = join(tmpDir, `feedback-${getUniqueId()}.md`);

    beforeEach(() => {
      writeFileSync(
        feedbackFile,
        '# feedback\n\n# blocker.1\n\nfirst\n---\n\n# nitpick.2\n\nsecond\n---\n\n# blocker.3\n\nthird\n---\n',
      );
    });

    afterEach(() => {
      if (existsSync(feedbackFile)) unlinkSync(feedbackFile);
    });

    when('[t0] countPriorFeedback called', () => {
      then('returns correct count', () => {
        const result = countPriorFeedback({ feedbackFile });
        expect(result.count).toBe(3);
      });

      then('returns correct blockerCount and nitpickCount', () => {
        const result = countPriorFeedback({ feedbackFile });
        expect(result.blockerCount).toBe(2);
        expect(result.nitpickCount).toBe(1);
      });

      then('texts contains all feedback texts in order', () => {
        const result = countPriorFeedback({ feedbackFile });
        expect(result.texts).toEqual(['first', 'second', 'third']);
      });
    });
  });

  given('[case5] file with multiline feedback', () => {
    const feedbackFile = join(tmpDir, `feedback-${getUniqueId()}.md`);

    beforeEach(() => {
      writeFileSync(
        feedbackFile,
        '# feedback\n\n# blocker.1\n\nline one\nline two\nline three\n---\n',
      );
    });

    afterEach(() => {
      if (existsSync(feedbackFile)) unlinkSync(feedbackFile);
    });

    when('[t0] countPriorFeedback called', () => {
      then('multiline text is preserved', () => {
        const result = countPriorFeedback({ feedbackFile });
        expect(result.texts).toEqual(['line one\nline two\nline three']);
      });
    });
  });
});
