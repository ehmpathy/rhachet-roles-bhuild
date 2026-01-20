import { render } from 'ink-testing-library';
import React from 'react';
import { given, then, when } from 'test-fns';

import { emitInkStdin } from '../../../../.test/infra/emitInkStdin';
import { FeedbackRepl } from './FeedbackRepl';

// strip ANSI escape codes for cleaner assertions
const stripAnsi = (str: string): string =>
  str.replace(/\u001B\[[0-9;]*[a-zA-Z]/g, '');

describe('FeedbackRepl.input', () => {
  given('[case1] text input', () => {
    when('[t0] user types text', () => {
      then('text appears in input area', async () => {
        const { lastFrame, stdin } = render(
          React.createElement(FeedbackRepl, {
            feedbackFile: 'test.feedback.md',
            onSubmit: jest.fn(),
            onExit: jest.fn(),
          }),
        );
        const emit = emitInkStdin({ stdin });

        await emit.text('hello world');

        expect(lastFrame()).toContain('hello world');
      });
    });

    when('[t1] user presses shift+enter', () => {
      then('newline is inserted, no submit', async () => {
        const onSubmit = jest.fn();
        const { stdin } = render(
          React.createElement(FeedbackRepl, {
            feedbackFile: 'test.feedback.md',
            onSubmit,
            onExit: jest.fn(),
          }),
        );
        const emit = emitInkStdin({ stdin });

        await emit.sequence([
          { text: 'line1' },
          { key: 'shiftEnter' },
          { text: 'line2' },
        ]);

        expect(onSubmit).not.toHaveBeenCalled();
      });
    });
  });

  given('[case2] feedback submission', () => {
    when('[t0] user types text and presses enter', () => {
      then('onSubmit is called with correct args', async () => {
        const onSubmit = jest.fn();
        const { stdin } = render(
          React.createElement(FeedbackRepl, {
            feedbackFile: 'test.feedback.md',
            onSubmit,
            onExit: jest.fn(),
          }),
        );
        const emit = emitInkStdin({ stdin });

        await emit.text('this is my feedback');
        await emit.key('enter');

        expect(onSubmit).toHaveBeenCalledWith({
          severity: 'blocker',
          index: 1,
          text: 'this is my feedback',
        });
      });

      then('input clears after submit', async () => {
        const { lastFrame, stdin } = render(
          React.createElement(FeedbackRepl, {
            feedbackFile: 'test.feedback.md',
            onSubmit: jest.fn(),
            onExit: jest.fn(),
          }),
        );
        const emit = emitInkStdin({ stdin });

        await emit.text('feedback text');
        await emit.key('enter');

        // input should be cleared, footer should now show index 2
        expect(lastFrame()).toContain('# blocker.2');
        expect(lastFrame()).not.toContain('feedback text');
      });

      then('index increments after submit', async () => {
        const onSubmit = jest.fn();
        const { stdin } = render(
          React.createElement(FeedbackRepl, {
            feedbackFile: 'test.feedback.md',
            onSubmit,
            onExit: jest.fn(),
          }),
        );
        const emit = emitInkStdin({ stdin });

        // first submission
        await emit.text('first');
        await emit.key('enter');

        // second submission
        await emit.text('second');
        await emit.key('enter');

        expect(onSubmit).toHaveBeenCalledTimes(2);
        expect(onSubmit).toHaveBeenNthCalledWith(1, {
          severity: 'blocker',
          index: 1,
          text: 'first',
        });
        expect(onSubmit).toHaveBeenNthCalledWith(2, {
          severity: 'blocker',
          index: 2,
          text: 'second',
        });
      });
    });

    when('[t1] user presses enter with empty input', () => {
      then('onSubmit is NOT called', async () => {
        const onSubmit = jest.fn();
        const { stdin } = render(
          React.createElement(FeedbackRepl, {
            feedbackFile: 'test.feedback.md',
            onSubmit,
            onExit: jest.fn(),
          }),
        );
        const emit = emitInkStdin({ stdin });

        await emit.key('enter');

        expect(onSubmit).not.toHaveBeenCalled();
      });

      then('repl stays in input mode', async () => {
        const { lastFrame, stdin } = render(
          React.createElement(FeedbackRepl, {
            feedbackFile: 'test.feedback.md',
            onSubmit: jest.fn(),
            onExit: jest.fn(),
          }),
        );
        const emit = emitInkStdin({ stdin });

        await emit.key('enter');

        // should still show index 1 (no increment)
        expect(lastFrame()).toContain('# blocker.1');
      });
    });
  });

  given('[case3] shift+enter newline at cursor position', () => {
    when('[t0] shift+enter in middle of text', () => {
      then('newline is inserted at cursor position', async () => {
        const onSubmit = jest.fn();
        const { lastFrame, stdin } = render(
          React.createElement(FeedbackRepl, {
            feedbackFile: 'test.feedback.md',
            onSubmit,
            onExit: jest.fn(),
          }),
        );
        const emit = emitInkStdin({ stdin });

        await emit.text('ab');

        // move cursor left 1 position
        await emit.key('arrowLeft');

        // insert newline at cursor
        await emit.key('shiftEnter');

        // onSubmit should NOT be called
        expect(onSubmit).not.toHaveBeenCalled();

        // text should have newline in middle (a + newline + b)
        const frame = stripAnsi(lastFrame() ?? '');
        expect(frame).toContain('a');
        expect(frame).toContain('b');
      });
    });
  });
});
