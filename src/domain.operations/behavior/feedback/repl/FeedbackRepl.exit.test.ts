import { render } from 'ink-testing-library';
import React from 'react';
import { given, then, when } from 'test-fns';

import { emitInkStdin } from '../../../../.test/infra/emitInkStdin';
import { FeedbackRepl } from './FeedbackRepl';

describe('FeedbackRepl.exit', () => {
  given('[case1] input buffer clear via ctrl+c', () => {
    when('[t0] user has text and presses ctrl+c', () => {
      then('input buffer is cleared', async () => {
        const onExit = jest.fn();
        const { lastFrame, stdin } = render(
          React.createElement(FeedbackRepl, {
            feedbackFile: 'test.feedback.md',
            onSubmit: jest.fn(),
            onExit,
          }),
        );
        const emit = emitInkStdin({ stdin });

        await emit.text('some text');
        expect(lastFrame()).toContain('some text');

        await emit.key('ctrlC');

        // text should be cleared
        expect(lastFrame()).not.toContain('some text');
        // onExit should NOT be called (only clears input)
        expect(onExit).not.toHaveBeenCalled();
      });
    });
  });

  given('[case2] exit via ctrl+c with empty input', () => {
    when('[t0] input is empty and user presses ctrl+c', () => {
      then('onExit is called with summary', async () => {
        const onExit = jest.fn();
        const { stdin } = render(
          React.createElement(FeedbackRepl, {
            feedbackFile: 'test.feedback.md',
            onSubmit: jest.fn(),
            onExit,
          }),
        );
        const emit = emitInkStdin({ stdin });

        await emit.key('ctrlC');

        expect(onExit).toHaveBeenCalledWith({ feedbackCount: 0 });
      });
    });

    when(
      '[t1] after submitting feedback, input is empty and user presses ctrl+c',
      () => {
        then('onExit is called with correct feedbackCount', async () => {
          const onExit = jest.fn();
          const { stdin } = render(
            React.createElement(FeedbackRepl, {
              feedbackFile: 'test.feedback.md',
              onSubmit: jest.fn(),
              onExit,
            }),
          );
          const emit = emitInkStdin({ stdin });

          // submit two items
          await emit.text('first');
          await emit.key('enter');
          await emit.text('second');
          await emit.key('enter');

          // now exit
          await emit.key('ctrlC');

          expect(onExit).toHaveBeenCalledWith({ feedbackCount: 2 });
        });
      },
    );
  });
});
