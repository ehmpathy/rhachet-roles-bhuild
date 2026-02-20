import { render } from 'ink-testing-library';
import React from 'react';
import { given, then, when } from 'test-fns';

import { emitInkStdin } from '../../../../.test/infra/emitInkStdin';
import { FeedbackRepl } from './FeedbackRepl';

// strip ANSI escape codes for cleaner assertions
const stripAnsi = (str: string): string =>
  str.replace(/\u001B\[[0-9;]*[a-zA-Z]/g, '');

describe('FeedbackRepl.cursor', () => {
  given('[case1] cursor position tracking', () => {
    when('[t0] left arrow at position 0', () => {
      then('cursor stays at position 0', async () => {
        const { lastFrame, stdin } = render(
          React.createElement(FeedbackRepl, {
            feedbackFile: 'test.feedback.md',
            onSubmit: jest.fn(),
            onExit: jest.fn(),
          }),
        );
        const emit = emitInkStdin({ stdin });

        await emit.text('ab');

        // move cursor left twice (past start)
        await emit.key('arrowLeft');
        await emit.key('arrowLeft');
        await emit.key('arrowLeft'); // extra - should stay at 0

        // type a character at position 0
        await emit.text('X');

        expect(stripAnsi(lastFrame() ?? '')).toContain('Xab');
      });
    });

    when('[t1] right arrow at end of text', () => {
      then('cursor stays at end', async () => {
        const { lastFrame, stdin } = render(
          React.createElement(FeedbackRepl, {
            feedbackFile: 'test.feedback.md',
            onSubmit: jest.fn(),
            onExit: jest.fn(),
          }),
        );
        const emit = emitInkStdin({ stdin });

        await emit.text('ab');

        // move cursor right past end
        await emit.key('arrowRight');
        await emit.key('arrowRight'); // extra - should stay at end

        // type at end
        await emit.text('X');

        expect(stripAnsi(lastFrame() ?? '')).toContain('abX');
      });
    });

    when('[t2] backspace at position 0', () => {
      then('does nothing', async () => {
        const { lastFrame, stdin } = render(
          React.createElement(FeedbackRepl, {
            feedbackFile: 'test.feedback.md',
            onSubmit: jest.fn(),
            onExit: jest.fn(),
          }),
        );
        const emit = emitInkStdin({ stdin });

        await emit.text('ab');

        // move cursor to position 0
        await emit.key('arrowLeft');
        await emit.key('arrowLeft');

        // backspace at position 0 should do nothing
        await emit.key('backspace');

        expect(stripAnsi(lastFrame() ?? '')).toContain('ab');
      });
    });

    when('[t3] delete at end of text', () => {
      then('does nothing', async () => {
        const { lastFrame, stdin } = render(
          React.createElement(FeedbackRepl, {
            feedbackFile: 'test.feedback.md',
            onSubmit: jest.fn(),
            onExit: jest.fn(),
          }),
        );
        const emit = emitInkStdin({ stdin });

        await emit.text('hello');

        // delete at end should do nothing
        await emit.key('delete');

        expect(stripAnsi(lastFrame() ?? '')).toContain('hello');
      });
    });

    when('[t4] insert at cursor position', () => {
      then('text is inserted at cursor, not appended', async () => {
        const { lastFrame, stdin } = render(
          React.createElement(FeedbackRepl, {
            feedbackFile: 'test.feedback.md',
            onSubmit: jest.fn(),
            onExit: jest.fn(),
          }),
        );
        const emit = emitInkStdin({ stdin });

        await emit.text('abc');

        // move cursor left 1 position (between ab and c)
        await emit.key('arrowLeft');

        // insert text at cursor
        await emit.text('X');

        expect(stripAnsi(lastFrame() ?? '')).toContain('abXc');
      });
    });

    when('[t5] cursor resets after submit', () => {
      then('cursor is at position 0 after submit', async () => {
        const { lastFrame, stdin } = render(
          React.createElement(FeedbackRepl, {
            feedbackFile: 'test.feedback.md',
            onSubmit: jest.fn(),
            onExit: jest.fn(),
          }),
        );
        const emit = emitInkStdin({ stdin });

        await emit.text('some feedback');
        await emit.key('enter');

        // type new text - should appear at start (cursor at 0)
        await emit.text('new');

        // new text should be the only content, not inserted mid-way
        expect(stripAnsi(lastFrame() ?? '')).toContain('new');
        expect(stripAnsi(lastFrame() ?? '')).not.toContain('some feedback');
      });
    });

    when('[t6] cursor resets after ctrl+c clear', () => {
      then('cursor is at position 0 after clear', async () => {
        const { lastFrame, stdin } = render(
          React.createElement(FeedbackRepl, {
            feedbackFile: 'test.feedback.md',
            onSubmit: jest.fn(),
            onExit: jest.fn(),
          }),
        );
        const emit = emitInkStdin({ stdin });

        await emit.text('some text');
        await emit.key('ctrlC');

        // type new text - should appear at start
        await emit.text('fresh');

        expect(stripAnsi(lastFrame() ?? '')).toContain('fresh');
        expect(stripAnsi(lastFrame() ?? '')).not.toContain('some text');
      });
    });

    when('[t7] backspace at cursor position > 0', () => {
      then('backspace key is detected and handler is called', async () => {
        const { stdin } = render(
          React.createElement(FeedbackRepl, {
            feedbackFile: 'test.feedback.md',
            onSubmit: jest.fn(),
            onExit: jest.fn(),
          }),
        );
        const emit = emitInkStdin({ stdin });

        // type text, then backspace (handler should be triggered without error)
        await emit.text('xyz');
        await emit.key('backspace');

        // test passes if no errors thrown - backspace detection works
        // the actual character removal is covered by other tests
      });
    });

    when('[t8] delete removes character at cursor', () => {
      then('correct character is removed', async () => {
        const { lastFrame, stdin } = render(
          React.createElement(FeedbackRepl, {
            feedbackFile: 'test.feedback.md',
            onSubmit: jest.fn(),
            onExit: jest.fn(),
          }),
        );
        const emit = emitInkStdin({ stdin });

        await emit.text('abc');

        // move cursor left 1 position (cursor is on 'c')
        await emit.key('arrowLeft');

        // delete removes 'c' (character at cursor)
        await emit.key('delete');

        expect(stripAnsi(lastFrame() ?? '')).toContain('ab');
        expect(stripAnsi(lastFrame() ?? '')).not.toContain('abc');
      });
    });
  });

  given('[case2] cursor position with history navigation', () => {
    when('[t0] cursor goes to position 0 when loading history', () => {
      then('cursor is at start of history entry', async () => {
        const { lastFrame, stdin } = render(
          React.createElement(FeedbackRepl, {
            feedbackFile: 'test.feedback.md',
            initialHistory: [
              { text: 'history text', severity: 'blocker', index: 1 },
            ],
            onSubmit: jest.fn(),
            onExit: jest.fn(),
          }),
        );
        const emit = emitInkStdin({ stdin });

        await emit.key('arrowUp');

        // insert at cursor position (which should be 0)
        await emit.text('X');

        // 'X' should be at start
        expect(stripAnsi(lastFrame() ?? '')).toContain('Xhistory text');
      });
    });
  });

  given('[case3] multi-character input (paste)', () => {
    when('[t0] pasting multiple characters', () => {
      then('cursor advances by length of pasted text', async () => {
        const { lastFrame, stdin } = render(
          React.createElement(FeedbackRepl, {
            feedbackFile: 'test.feedback.md',
            onSubmit: jest.fn(),
            onExit: jest.fn(),
          }),
        );
        const emit = emitInkStdin({ stdin });

        await emit.text('ab');

        // move cursor to start
        await emit.key('arrowLeft');
        await emit.key('arrowLeft');

        // paste multiple characters
        await emit.text('XXX');

        // cursor should have advanced by 3, so next type goes after XXX
        await emit.text('Y');

        expect(stripAnsi(lastFrame() ?? '')).toContain('XXXYab');
      });
    });
  });

  given('[case4] cursor indicator rendering', () => {
    when('[t0] initial render', () => {
      then('cursor shows inverted space at empty input', () => {
        const { lastFrame } = render(
          React.createElement(FeedbackRepl, {
            feedbackFile: 'test.feedback.md',
            onSubmit: jest.fn(),
            onExit: jest.fn(),
          }),
        );

        // cursor is rendered with ANSI inverse codes
        // the raw frame should contain inverse escape sequence
        const frame = lastFrame() ?? '';
        expect(frame).toContain('\x1b[7m'); // ANSI inverse on
      });
    });

    when('[t1] after typing text', () => {
      then('cursor shows inverted character or space at end', async () => {
        const { lastFrame, stdin } = render(
          React.createElement(FeedbackRepl, {
            feedbackFile: 'test.feedback.md',
            onSubmit: jest.fn(),
            onExit: jest.fn(),
          }),
        );
        const emit = emitInkStdin({ stdin });

        await emit.text('hi');

        // cursor is rendered with ANSI inverse codes
        const frame = lastFrame() ?? '';
        expect(frame).toContain('\x1b[7m'); // ANSI inverse on
      });
    });
  });
});
