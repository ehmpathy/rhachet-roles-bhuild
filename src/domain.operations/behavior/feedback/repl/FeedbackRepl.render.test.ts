import { render } from 'ink-testing-library';
import React from 'react';
import { given, then, when } from 'test-fns';

import { emitInkStdin } from '../../../../.test/infra/emitInkStdin';
import { FeedbackRepl } from './FeedbackRepl';

describe('FeedbackRepl.render', () => {
  given('[case1] fresh repl with no prior feedback', () => {
    when('[t0] component renders', () => {
      then('footer shows "# blocker.1" by default', () => {
        const { lastFrame } = render(
          React.createElement(FeedbackRepl, {
            feedbackFile: 'test.feedback.md',
            onSubmit: jest.fn(),
            onExit: jest.fn(),
          }),
        );
        expect(lastFrame()).toContain('# blocker.1');
      });

      then('footer shows severity toggle hint', () => {
        const { lastFrame } = render(
          React.createElement(FeedbackRepl, {
            feedbackFile: 'test.feedback.md',
            onSubmit: jest.fn(),
            onExit: jest.fn(),
          }),
        );
        expect(lastFrame()).toContain('shift+tab to toggle');
      });

      then('initial render matches snapshot', () => {
        const { lastFrame } = render(
          React.createElement(FeedbackRepl, {
            feedbackFile: 'test.feedback.md',
            onSubmit: jest.fn(),
            onExit: jest.fn(),
          }),
        );
        expect(lastFrame()).toMatchSnapshot();
      });
    });
  });

  given('[case2] repl with prior feedback count', () => {
    when('[t0] initialized with 3 blockers and 2 nitpicks', () => {
      then('footer shows "# blocker.6" (continues from prior count)', () => {
        const { lastFrame } = render(
          React.createElement(FeedbackRepl, {
            feedbackFile: 'test.feedback.md',
            initialBlockerCount: 3,
            initialNitpickCount: 2,
            onSubmit: jest.fn(),
            onExit: jest.fn(),
          }),
        );
        expect(lastFrame()).toContain('# blocker.6');
      });
    });
  });

  given('[case3] index increments on submit', () => {
    when('[t0] submitting a blocker', () => {
      then('index increments to next value', async () => {
        const { lastFrame, stdin } = render(
          React.createElement(FeedbackRepl, {
            feedbackFile: 'test.feedback.md',
            initialBlockerCount: 1,
            initialNitpickCount: 0,
            onSubmit: jest.fn(),
            onExit: jest.fn(),
          }),
        );
        const emit = emitInkStdin({ stdin });

        // verify initial index
        expect(lastFrame()).toContain('# blocker.2');

        // submit a blocker
        await emit.text('new blocker');
        await emit.key('enter');

        // index should increment
        expect(lastFrame()).toContain('# blocker.3');
      });
    });

    when('[t1] submitting a nitpick', () => {
      then('index increments to next value', async () => {
        const { lastFrame, stdin } = render(
          React.createElement(FeedbackRepl, {
            feedbackFile: 'test.feedback.md',
            initialBlockerCount: 0,
            initialNitpickCount: 1,
            onSubmit: jest.fn(),
            onExit: jest.fn(),
          }),
        );
        const emit = emitInkStdin({ stdin });

        // verify initial index
        expect(lastFrame()).toContain('# blocker.2');

        // toggle to nitpick and submit
        await emit.key('shiftTab');
        await emit.text('new nitpick');
        await emit.key('enter');

        // index should increment
        expect(lastFrame()).toContain('# nitpick.3');
      });
    });
  });
});
