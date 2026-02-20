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

  given('[case2] exit via double ctrl+c with empty input', () => {
    when('[t0] input is empty and user presses ctrl+c twice', () => {
      then('onExit is called with summary after second ctrl+c', async () => {
        const onExit = jest.fn();
        const { stdin, lastFrame } = render(
          React.createElement(FeedbackRepl, {
            feedbackFile: 'test.feedback.md',
            onSubmit: jest.fn(),
            onExit,
          }),
        );
        const emit = emitInkStdin({ stdin });

        // first ctrl+c shows prompt
        await emit.key('ctrlC');
        expect(onExit).not.toHaveBeenCalled();
        expect(lastFrame()).toContain('press ctrl+c again to exit');

        // wait 500ms then second ctrl+c exits
        await emit.wait(550);
        await emit.key('ctrlC');

        expect(onExit).toHaveBeenCalledWith({ feedbackCount: 0 });
      });
    });

    when(
      '[t1] after feedback, double ctrl+c exits with correct feedbackCount',
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

          // first ctrl+c shows prompt
          await emit.key('ctrlC');
          expect(onExit).not.toHaveBeenCalled();

          // wait 500ms then second ctrl+c exits
          await emit.wait(550);
          await emit.key('ctrlC');

          expect(onExit).toHaveBeenCalledWith({ feedbackCount: 2 });
        });
      },
    );

    when('[t2] ctrl+c pressed too fast (under 500ms)', () => {
      then('does not exit, waits for proper double ctrl+c', async () => {
        const onExit = jest.fn();
        const { stdin, lastFrame } = render(
          React.createElement(FeedbackRepl, {
            feedbackFile: 'test.feedback.md',
            onSubmit: jest.fn(),
            onExit,
          }),
        );
        const emit = emitInkStdin({ stdin });

        // first ctrl+c
        await emit.key('ctrlC');
        expect(onExit).not.toHaveBeenCalled();
        expect(lastFrame()).toContain('press ctrl+c again to exit');

        // second ctrl+c too fast (only 100ms delay from emit.key)
        await emit.key('ctrlC');
        expect(onExit).not.toHaveBeenCalled();

        // now wait and do proper double ctrl+c
        await emit.wait(550);
        await emit.key('ctrlC');
        expect(onExit).toHaveBeenCalledWith({ feedbackCount: 0 });
      });
    });
  });
});
