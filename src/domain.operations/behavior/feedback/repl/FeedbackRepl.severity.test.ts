import { render } from 'ink-testing-library';
import React from 'react';
import { given, then, when } from 'test-fns';

import { emitInkStdin } from '../../../../.test/infra/emitInkStdin';
import { FeedbackRepl } from './FeedbackRepl';

describe('FeedbackRepl.severity', () => {
  given('[case1] severity toggle via shift+tab', () => {
    when('[t0] user presses shift+tab once', () => {
      then('severity toggles to nitpick', async () => {
        const { lastFrame, stdin } = render(
          React.createElement(FeedbackRepl, {
            feedbackFile: 'test.feedback.md',
            onSubmit: jest.fn(),
            onExit: jest.fn(),
          }),
        );
        const emit = emitInkStdin({ stdin });

        await emit.key('shiftTab');

        expect(lastFrame()).toContain('# nitpick.1');
      });

      then('post-toggle render matches snapshot', async () => {
        const { lastFrame, stdin } = render(
          React.createElement(FeedbackRepl, {
            feedbackFile: 'test.feedback.md',
            onSubmit: jest.fn(),
            onExit: jest.fn(),
          }),
        );
        const emit = emitInkStdin({ stdin });

        await emit.key('shiftTab');

        expect(lastFrame()).toMatchSnapshot();
      });
    });

    when('[t1] user presses shift+tab twice', () => {
      then('severity toggles back to blocker', async () => {
        const { lastFrame, stdin } = render(
          React.createElement(FeedbackRepl, {
            feedbackFile: 'test.feedback.md',
            onSubmit: jest.fn(),
            onExit: jest.fn(),
          }),
        );
        const emit = emitInkStdin({ stdin });

        await emit.key('shiftTab'); // toggle to nitpick
        await emit.key('shiftTab'); // toggle back to blocker

        expect(lastFrame()).toContain('# blocker.1');
      });
    });
  });

  given('[case2] severity affects submission', () => {
    when('[t0] user toggles to nitpick and submits', () => {
      then('onSubmit receives severity=nitpick', async () => {
        const onSubmit = jest.fn();
        const { stdin } = render(
          React.createElement(FeedbackRepl, {
            feedbackFile: 'test.feedback.md',
            onSubmit,
            onExit: jest.fn(),
          }),
        );
        const emit = emitInkStdin({ stdin });

        await emit.key('shiftTab'); // toggle to nitpick
        await emit.text('minor issue');
        await emit.key('enter');

        expect(onSubmit).toHaveBeenCalledWith({
          severity: 'nitpick',
          index: 1,
          text: 'minor issue',
        });
      });
    });
  });
});
