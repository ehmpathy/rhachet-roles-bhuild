import { given, then, when } from 'test-fns';

import { computeFeedbackBlockContent } from './computeFeedbackBlockContent';

describe('computeFeedbackBlockContent', () => {
  given('[case1] blocker feedback', () => {
    when('[t0] called with blocker severity', () => {
      then('starts with triple delimiter, then header', () => {
        const result = computeFeedbackBlockContent({
          severity: 'blocker',
          index: 1,
          text: 'this is wrong',
        });
        expect(result).toMatch(/^---\n---\n---\n\n# blocker\.1/);
      });

      then('includes the text', () => {
        const result = computeFeedbackBlockContent({
          severity: 'blocker',
          index: 1,
          text: 'this is wrong',
        });
        expect(result).toContain('this is wrong');
      });

      then('ends with separator', () => {
        const result = computeFeedbackBlockContent({
          severity: 'blocker',
          index: 1,
          text: 'this is wrong',
        });
        expect(result).toMatch(/---\n$/);
      });
    });
  });

  given('[case2] nitpick feedback', () => {
    when('[t0] called with nitpick severity', () => {
      then('starts with triple delimiter, then header', () => {
        const result = computeFeedbackBlockContent({
          severity: 'nitpick',
          index: 3,
          text: 'consider a rename',
        });
        expect(result).toMatch(/^---\n---\n---\n\n# nitpick\.3/);
      });
    });
  });

  given('[case3] multiline text', () => {
    when('[t0] text has multiple lines', () => {
      then('all lines are preserved', () => {
        const result = computeFeedbackBlockContent({
          severity: 'blocker',
          index: 2,
          text: 'line one\nline two\nline three',
        });
        expect(result).toContain('line one\nline two\nline three');
      });
    });
  });

  given('[case4] snapshot verification', () => {
    when('[t0] blocker with simple text', () => {
      then('matches snapshot', () => {
        const result = computeFeedbackBlockContent({
          severity: 'blocker',
          index: 1,
          text: 'need to fix this bug',
        });
        expect(result).toMatchSnapshot();
      });
    });

    when('[t1] nitpick with multiline text', () => {
      then('matches snapshot', () => {
        const result = computeFeedbackBlockContent({
          severity: 'nitpick',
          index: 5,
          text: 'consider refactor\nthe code is a bit messy\nbut not critical',
        });
        expect(result).toMatchSnapshot();
      });
    });
  });
});
