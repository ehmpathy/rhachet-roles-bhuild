import { render } from 'ink-testing-library';
import React from 'react';
import { given, then, when } from 'test-fns';

import { emitInkStdin } from '../../../../.test/infra/emitInkStdin';
import { FeedbackRepl } from './FeedbackRepl';

describe('FeedbackRepl.undo', () => {
  given('[case1] undo via ctrl+z', () => {
    when('[t0] user presses ctrl+z', () => {
      then('onUndo is called', async () => {
        const onUndo = jest
          .fn()
          .mockReturnValue({ undone: true, message: 'undid blocker.1' });
        const { stdin } = render(
          React.createElement(FeedbackRepl, {
            feedbackFile: 'test.feedback.md',
            onSubmit: jest.fn(),
            onUndo,
            onExit: jest.fn(),
          }),
        );
        const emit = emitInkStdin({ stdin });

        await emit.key('ctrlZ');

        expect(onUndo).toHaveBeenCalled();
      });
    });
  });

  given('[case2] redo via ctrl+y', () => {
    when('[t0] user presses ctrl+y', () => {
      then('onRedo is called', async () => {
        const onRedo = jest
          .fn()
          .mockReturnValue({ redone: true, message: 'redid blocker.1' });
        const { stdin } = render(
          React.createElement(FeedbackRepl, {
            feedbackFile: 'test.feedback.md',
            onSubmit: jest.fn(),
            onRedo,
            onExit: jest.fn(),
          }),
        );
        const emit = emitInkStdin({ stdin });

        await emit.key('ctrlY');

        expect(onRedo).toHaveBeenCalled();
      });
    });
  });

  given('[case3] input buffer restore via ctrl+z after ctrl+c', () => {
    when(
      '[t0] user types text, clears with ctrl+c, then presses ctrl+z',
      () => {
        then('input buffer is restored', async () => {
          const onUndo = jest.fn();
          const { lastFrame, stdin } = render(
            React.createElement(FeedbackRepl, {
              feedbackFile: 'test.feedback.md',
              onSubmit: jest.fn(),
              onUndo,
              onExit: jest.fn(),
            }),
          );
          const emit = emitInkStdin({ stdin });

          // type some text
          await emit.text('my feedback');
          expect(lastFrame()).toContain('my feedback');

          // clear with ctrl+c
          await emit.key('ctrlC');
          expect(lastFrame()).not.toContain('my feedback');

          // restore with ctrl+z
          await emit.key('ctrlZ');
          expect(lastFrame()).toContain('my feedback');

          // onUndo should NOT be called (input buffer was restored instead)
          expect(onUndo).not.toHaveBeenCalled();
        });
      },
    );

    when('[t1] user presses ctrl+z with no cleared input', () => {
      then('onUndo is called', async () => {
        const onUndo = jest
          .fn()
          .mockReturnValue({ undone: true, message: 'undid blocker.1' });
        const { stdin } = render(
          React.createElement(FeedbackRepl, {
            feedbackFile: 'test.feedback.md',
            onSubmit: jest.fn(),
            onUndo,
            onExit: jest.fn(),
          }),
        );
        const emit = emitInkStdin({ stdin });

        // no text typed, just ctrl+z
        await emit.key('ctrlZ');

        // onUndo should be called since no input buffer to restore
        expect(onUndo).toHaveBeenCalled();
      });
    });
  });
});
