import { given, then, when } from 'test-fns';

import type { FeedbackTakeGetResult } from '../feedback/feedbackTakeGet';
import { computeFeedbackTakeGetOutput } from './computeFeedbackTakeGetOutput';

/**
 * .what = a result with one feedback item per status
 * .why  = the render branches on all three, and the color contract must hold
 *         on every branch, never only on the one a fixture happens to hit
 */
const getResultOfEachStatus = (): FeedbackTakeGetResult => ({
  behaviorDir: '/tmp/repo/.behavior/v2026_01_01.demo',
  feedback: [
    {
      givenPath: '/tmp/repo/.behavior/v2026_01_01.demo/feedback/a.given.md',
      givenPathRel: '.behavior/v2026_01_01.demo/feedback/a.given.md',
      artifactFileName: '0.wish.md',
      feedbackVersion: 1,
      status: { status: 'unresponded' },
    },
    {
      givenPath: '/tmp/repo/.behavior/v2026_01_01.demo/feedback/b.given.md',
      givenPathRel: '.behavior/v2026_01_01.demo/feedback/b.given.md',
      artifactFileName: '1.vision.yield.md',
      feedbackVersion: 1,
      status: {
        status: 'stale',
        takenPath: '/tmp/repo/.behavior/v2026_01_01.demo/feedback/b.taken.md',
        reason: 'hash-mismatch',
      },
    },
    {
      givenPath: '/tmp/repo/.behavior/v2026_01_01.demo/feedback/c.given.md',
      givenPathRel: '.behavior/v2026_01_01.demo/feedback/c.given.md',
      artifactFileName: '5.1.execution.yield.md',
      feedbackVersion: 1,
      status: {
        status: 'responded',
        takenPath: '/tmp/repo/.behavior/v2026_01_01.demo/feedback/c.taken.md',
      },
    },
  ],
  unresponded: 1,
  responded: 1,
  stale: 1,
});

const getResultOfEmpty = (): FeedbackTakeGetResult => ({
  behaviorDir: '/tmp/repo/.behavior/v2026_01_01.demo',
  feedback: [],
  unresponded: 0,
  responded: 0,
  stale: 0,
});

// 🔴 the clamp for the blemish a peer reviewer caught at 5.3.verification:
//   these escapes color a status on a terminal and become literal `[31m` /
//   `[0m` noise in a captured stream — a pipe, a ci log, a jest snapshot.
//   a snapshot exists so a human can vibecheck a render, so a control code
//   baked into one is exactly what rule.forbid.snapshot-visual-blemishes
//   forbids. the cli passes `process.stdout.isTTY`, so the captured render is
//   clean and the human render keeps its color.
//
// .note = a plain string, deliberately, never a regex. biome's
//   `lint/suspicious/noControlCharactersInRegex` forbids a control char inside
//   a regex literal, and the suppression for it would be a comment that reads
//   as a guardrail and holds naught — this repo lints with biome, so an
//   `eslint-disable` line here is inert. `toContain` is exactly as strong and
//   needs no suppression at all.
const ANSI_CSI = '\x1b[';

describe('computeFeedbackTakeGetOutput', () => {
  given('[case1] a captured stream — color is off', () => {
    when('[t0] the list render carries all three statuses', () => {
      const result = computeFeedbackTakeGetOutput(
        {
          result: getResultOfEachStatus(),
          mode: 'list',
          behavior: 'v2026_01_01.demo',
        },
        { color: false },
      );

      then('🔴 it carries NO ansi escape of any kind', () => {
        expect(result).not.toContain(ANSI_CSI);
      });

      then('the open/total summary still renders its counts', () => {
        expect(result).toContain('2 open / 3 total');
      });

      then('each status label still renders', () => {
        expect(result).toContain('unresponded:');
        expect(result).toContain('stale (updated):');
        expect(result).toContain('responded:');
      });
    });

    when('[t1] the hook.onStop render halts on open feedback', () => {
      const result = computeFeedbackTakeGetOutput(
        {
          result: getResultOfEachStatus(),
          mode: 'hook.onStop',
          behavior: 'v2026_01_01.demo',
        },
        { color: false },
      );

      then('🔴 it carries NO ansi escape of any kind', () => {
        expect(result).not.toContain(ANSI_CSI);
      });

      then('the halt instruction still renders', () => {
        expect(result).toContain(
          '✋ respond to all feedback before you finish your work',
        );
      });
    });

    when('[t2] no feedback file was found', () => {
      const result = computeFeedbackTakeGetOutput(
        {
          result: getResultOfEmpty(),
          mode: 'list',
          behavior: 'v2026_01_01.demo',
        },
        { color: false },
      );

      then('🔴 it carries NO ansi escape of any kind', () => {
        expect(result).not.toContain(ANSI_CSI);
      });

      then('the empty-state line still renders', () => {
        expect(result).toContain('no feedback files found');
      });
    });
  });

  given('[case2] a human terminal — color is on by default', () => {
    when('[t0] the list render is asked for with no options', () => {
      const result = computeFeedbackTakeGetOutput({
        result: getResultOfEachStatus(),
        mode: 'list',
        behavior: 'v2026_01_01.demo',
      });

      then('the open count is colored', () => {
        expect(result).toContain('\x1b[31m2 open\x1b[0m');
      });

      then('the responded label is green', () => {
        expect(result).toContain('\x1b[32mresponded:\x1b[0m');
      });

      then('the stale label is yellow', () => {
        expect(result).toContain('\x1b[33mstale (updated):\x1b[0m');
      });
    });
  });

  given('[case3] hook.onStop with no open feedback', () => {
    when('[t0] the render is asked for', () => {
      const result = computeFeedbackTakeGetOutput({
        result: {
          ...getResultOfEmpty(),
          feedback: [
            {
              givenPath: '/tmp/repo/.behavior/v1/feedback/c.given.md',
              givenPathRel: '.behavior/v1/feedback/c.given.md',
              artifactFileName: '0.wish.md',
              feedbackVersion: 1,
              status: {
                status: 'responded',
                takenPath: '/tmp/repo/.behavior/v1/feedback/c.taken.md',
              },
            },
          ],
          responded: 1,
        },
        mode: 'hook.onStop',
        behavior: 'v2026_01_01.demo',
      });

      then(
        'it stays silent — the hook must not nag when naught is open',
        () => {
          expect(result).toEqual(null);
        },
      );
    });
  });
});
