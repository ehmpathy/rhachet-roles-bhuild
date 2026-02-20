import { render } from 'ink-testing-library';
import React from 'react';
import { given, then, when } from 'test-fns';

import { emitInkStdin } from '../../../../.test/infra/emitInkStdin';
import { FeedbackRepl } from './FeedbackRepl';

// strip ANSI escape codes for cleaner assertions
const stripAnsi = (str: string): string =>
  str.replace(/\u001B\[[0-9;]*[a-zA-Z]/g, '');

describe('FeedbackRepl.history', () => {
  given('[case1] history navigation via up/down arrows', () => {
    when('[t0] user presses up arrow with history', () => {
      then('previous feedback text is loaded into input', async () => {
        const { lastFrame, stdin } = render(
          React.createElement(FeedbackRepl, {
            feedbackFile: 'test.feedback.md',
            initialHistory: [
              { text: 'first feedback', severity: 'blocker', index: 1 },
              { text: 'second feedback', severity: 'blocker', index: 2 },
            ],
            onSubmit: jest.fn(),
            onExit: jest.fn(),
          }),
        );
        const emit = emitInkStdin({ stdin });

        await emit.key('arrowUp');

        expect(stripAnsi(lastFrame() ?? '')).toContain('first feedback');
      });

      then('navigating up twice shows older feedback', async () => {
        const { lastFrame, stdin } = render(
          React.createElement(FeedbackRepl, {
            feedbackFile: 'test.feedback.md',
            initialHistory: [
              { text: 'first feedback', severity: 'blocker', index: 1 },
              { text: 'second feedback', severity: 'blocker', index: 2 },
            ],
            onSubmit: jest.fn(),
            onExit: jest.fn(),
          }),
        );
        const emit = emitInkStdin({ stdin });

        await emit.key('arrowUp');
        await emit.key('arrowUp');

        expect(stripAnsi(lastFrame() ?? '')).toContain('second feedback');
      });
    });

    when('[t1] user presses down arrow after navigating up', () => {
      then('newer feedback is shown', async () => {
        const { lastFrame, stdin } = render(
          React.createElement(FeedbackRepl, {
            feedbackFile: 'test.feedback.md',
            initialHistory: [
              { text: 'first feedback', severity: 'blocker', index: 1 },
              { text: 'second feedback', severity: 'blocker', index: 2 },
            ],
            onSubmit: jest.fn(),
            onExit: jest.fn(),
          }),
        );
        const emit = emitInkStdin({ stdin });

        await emit.key('arrowUp');
        await emit.key('arrowUp');
        await emit.key('arrowDown');

        expect(stripAnsi(lastFrame() ?? '')).toContain('first feedback');
      });

      then(
        'up arrow does nothing when input has text (must clear first)',
        async () => {
          const { lastFrame, stdin } = render(
            React.createElement(FeedbackRepl, {
              feedbackFile: 'test.feedback.md',
              initialHistory: [
                { text: 'only feedback', severity: 'blocker', index: 1 },
              ],
              onSubmit: jest.fn(),
              onExit: jest.fn(),
            }),
          );
          const emit = emitInkStdin({ stdin });

          // type some text
          await emit.text('my draft');
          expect(stripAnsi(lastFrame() ?? '')).toContain('my draft');

          // up arrow does nothing (input not empty)
          await emit.key('arrowUp');
          expect(stripAnsi(lastFrame() ?? '')).toContain('my draft');

          // clear input with ctrl+c
          await emit.key('ctrlC');

          // now up arrow navigates history (input is empty)
          await emit.key('arrowUp');
          expect(stripAnsi(lastFrame() ?? '')).toContain('only feedback');
        },
      );
    });

    when('[t2] user presses up arrow with no history', () => {
      then('input remains unchanged', async () => {
        const { lastFrame, stdin } = render(
          React.createElement(FeedbackRepl, {
            feedbackFile: 'test.feedback.md',
            onSubmit: jest.fn(),
            onExit: jest.fn(),
          }),
        );
        const emit = emitInkStdin({ stdin });

        await emit.text('some text');
        await emit.key('arrowUp');

        // text should still be there (no history to navigate to)
        expect(stripAnsi(lastFrame() ?? '')).toContain('some text');
      });
    });

    when('[t3] user edits a history entry', () => {
      then('typing exits history navigation mode', async () => {
        const { lastFrame, stdin } = render(
          React.createElement(FeedbackRepl, {
            feedbackFile: 'test.feedback.md',
            initialHistory: [
              { text: 'first', severity: 'blocker', index: 1 },
              { text: 'second', severity: 'blocker', index: 2 },
            ],
            onSubmit: jest.fn(),
            onExit: jest.fn(),
          }),
        );
        const emit = emitInkStdin({ stdin });

        // navigate to history
        await emit.key('arrowUp');
        expect(stripAnsi(lastFrame() ?? '')).toContain('first');

        // type a character (exits history mode)
        await emit.text('x');

        // now up arrow should not navigate (input not empty)
        await emit.key('arrowUp');
        expect(stripAnsi(lastFrame() ?? '')).toContain('xfirst'); // text unchanged
        expect(stripAnsi(lastFrame() ?? '')).not.toContain('second');
      });

      then('backspace exits history navigation mode', async () => {
        const { lastFrame, stdin } = render(
          React.createElement(FeedbackRepl, {
            feedbackFile: 'test.feedback.md',
            initialHistory: [
              { text: 'first', severity: 'blocker', index: 1 },
              { text: 'second', severity: 'blocker', index: 2 },
            ],
            onSubmit: jest.fn(),
            onExit: jest.fn(),
          }),
        );
        const emit = emitInkStdin({ stdin });

        // navigate to history
        await emit.key('arrowUp');
        expect(stripAnsi(lastFrame() ?? '')).toContain('first');

        // backspace (exits history mode)
        await emit.key('backspace');

        // now up arrow should not navigate (input not empty after deletion)
        await emit.key('arrowUp');
        expect(stripAnsi(lastFrame() ?? '')).not.toContain('second');
      });
    });

    when('[t4] consecutive up arrows navigate through history', () => {
      then('up-up-up navigates through all history entries', async () => {
        const { lastFrame, stdin } = render(
          React.createElement(FeedbackRepl, {
            feedbackFile: 'test.feedback.md',
            initialHistory: [
              { text: 'first', severity: 'blocker', index: 1 },
              { text: 'second', severity: 'blocker', index: 2 },
              { text: 'third', severity: 'blocker', index: 3 },
            ],
            onSubmit: jest.fn(),
            onExit: jest.fn(),
          }),
        );
        const emit = emitInkStdin({ stdin });

        // first up: shows most recent ('first')
        await emit.key('arrowUp');
        expect(stripAnsi(lastFrame() ?? '')).toContain('first');

        // second up: shows next older ('second')
        await emit.key('arrowUp');
        expect(stripAnsi(lastFrame() ?? '')).toContain('second');

        // third up: shows oldest ('third')
        await emit.key('arrowUp');
        expect(stripAnsi(lastFrame() ?? '')).toContain('third');
      });
    });

    when('[t5] up arrow at oldest history entry', () => {
      then('stays at oldest entry', async () => {
        const { lastFrame, stdin } = render(
          React.createElement(FeedbackRepl, {
            feedbackFile: 'test.feedback.md',
            initialHistory: [
              { text: 'first', severity: 'blocker', index: 1 },
              { text: 'second', severity: 'blocker', index: 2 },
            ],
            onSubmit: jest.fn(),
            onExit: jest.fn(),
          }),
        );
        const emit = emitInkStdin({ stdin });

        // navigate to oldest
        await emit.key('arrowUp');
        await emit.key('arrowUp');
        expect(stripAnsi(lastFrame() ?? '')).toContain('second');

        // try to go further back
        await emit.key('arrowUp');
        expect(stripAnsi(lastFrame() ?? '')).toContain('second'); // still oldest
      });
    });

    when('[t6] down arrow returns to draft when at newest', () => {
      then('restores original draft text', async () => {
        const { lastFrame, stdin } = render(
          React.createElement(FeedbackRepl, {
            feedbackFile: 'test.feedback.md',
            initialHistory: [
              { text: 'history entry', severity: 'blocker', index: 1 },
            ],
            onSubmit: jest.fn(),
            onExit: jest.fn(),
          }),
        );
        const emit = emitInkStdin({ stdin });

        // type draft text
        await emit.text('my draft');

        // clear to navigate
        await emit.key('ctrlC');

        // navigate to history
        await emit.key('arrowUp');
        expect(stripAnsi(lastFrame() ?? '')).toContain('history entry');

        // navigate back down
        await emit.key('arrowDown');

        // should be back to empty (draft was empty when we entered history)
        expect(stripAnsi(lastFrame() ?? '')).not.toContain('history entry');
      });
    });

    when('[t7] down arrow when not in history mode', () => {
      then('does nothing', async () => {
        const { lastFrame, stdin } = render(
          React.createElement(FeedbackRepl, {
            feedbackFile: 'test.feedback.md',
            initialHistory: [
              { text: 'history entry', severity: 'blocker', index: 1 },
            ],
            onSubmit: jest.fn(),
            onExit: jest.fn(),
          }),
        );
        const emit = emitInkStdin({ stdin });

        // type some text
        await emit.text('my text');

        // down arrow should do nothing (not in history mode)
        await emit.key('arrowDown');

        // text unchanged
        expect(stripAnsi(lastFrame() ?? '')).toContain('my text');
      });
    });

    when('[t8] delete key exits history navigation mode', () => {
      then(
        'editing with delete prevents further history navigation',
        async () => {
          const { lastFrame, stdin } = render(
            React.createElement(FeedbackRepl, {
              feedbackFile: 'test.feedback.md',
              initialHistory: [
                { text: 'first', severity: 'blocker', index: 1 },
                { text: 'second', severity: 'blocker', index: 2 },
              ],
              onSubmit: jest.fn(),
              onExit: jest.fn(),
            }),
          );
          const emit = emitInkStdin({ stdin });

          // navigate to history
          await emit.key('arrowUp');
          expect(stripAnsi(lastFrame() ?? '')).toContain('first');

          // move cursor left then delete
          await emit.key('arrowLeft');
          await emit.key('delete');

          // now up arrow should not navigate (input was modified)
          await emit.key('arrowUp');
          expect(stripAnsi(lastFrame() ?? '')).not.toContain('second');
        },
      );
    });
  });

  given('[case2] empty history edge cases', () => {
    when('[t0] up arrow with empty history', () => {
      then('does nothing', async () => {
        const { lastFrame, stdin } = render(
          React.createElement(FeedbackRepl, {
            feedbackFile: 'test.feedback.md',
            initialHistory: [],
            onSubmit: jest.fn(),
            onExit: jest.fn(),
          }),
        );
        const emit = emitInkStdin({ stdin });

        // up arrow with no history should do nothing
        await emit.key('arrowUp');

        // input should still be empty (just the prompt)
        const frame = stripAnsi(lastFrame() ?? '');
        expect(frame).toContain('> ');
      });
    });

    when('[t1] down arrow with empty history', () => {
      then('does nothing', async () => {
        const { lastFrame, stdin } = render(
          React.createElement(FeedbackRepl, {
            feedbackFile: 'test.feedback.md',
            initialHistory: [],
            onSubmit: jest.fn(),
            onExit: jest.fn(),
          }),
        );
        const emit = emitInkStdin({ stdin });

        // down arrow with no history should do nothing
        await emit.key('arrowDown');

        // input should still be empty
        const frame = stripAnsi(lastFrame() ?? '');
        expect(frame).toContain('> ');
      });
    });
  });
});
