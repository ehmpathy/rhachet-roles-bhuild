import { given, then, when } from 'test-fns';

import { ClaudeTranscriptEvent } from '@src/domain.objects/reflect.on.review.self/ClaudeTranscriptEvent';

import { getAllReviewSelfWindows } from './getAllReviewSelfWindows';

const ROUTE = '.behavior/my-feature';
const STONE = '1.vision';

/**
 * .what = build a boundary event that holds a route.stone.set command
 */
const asBoundaryEvent = (input: {
  as: string;
  slug?: string;
}): ClaudeTranscriptEvent => {
  const slugPart = input.slug ? ` --that ${input.slug}` : '';
  return new ClaudeTranscriptEvent({
    type: 'assistant',
    role: 'assistant',
    text: null,
    toolUses: [
      {
        name: 'Bash',
        input: {
          command: `rhx route.stone.set --stone ${STONE} --route ${ROUTE} --as ${input.as}${slugPart}`,
        },
      },
    ],
    cwd: null,
    gitBranch: null,
    sessionId: null,
    timestamp: null,
    transcriptPath: '/transcripts/session.jsonl',
  });
};

/**
 * .what = build a review-work event with articulation text and optional edits
 */
const asWorkEvent = (input: {
  text: string;
  edits: number;
}): ClaudeTranscriptEvent =>
  new ClaudeTranscriptEvent({
    type: 'assistant',
    role: 'assistant',
    text: input.text,
    toolUses: Array.from({ length: input.edits }, () => ({
      name: 'Write',
      input: { file_path: `${ROUTE}/1.vision.yield.md` },
    })),
    cwd: null,
    gitBranch: null,
    sessionId: null,
    timestamp: null,
    transcriptPath: '/transcripts/session.jsonl',
  });

describe('getAllReviewSelfWindows', () => {
  given('[case1] a chain of two reviews with a retried promise', () => {
    // sequence: passed -> work(slug1) -> promise(slug1) -> work(slug2)
    //           -> promise(slug2) -> promise(slug1 retry)
    const events = [
      asBoundaryEvent({ as: 'passed' }),
      asWorkEvent({ text: 'a thorough look at slug1', edits: 1 }),
      asBoundaryEvent({ as: 'promised', slug: 'has-grounded-in-reality' }),
      asWorkEvent({ text: 'a look at slug2', edits: 0 }),
      asBoundaryEvent({ as: 'promised', slug: 'has-questioned-requirements' }),
      asBoundaryEvent({ as: 'promised', slug: 'has-grounded-in-reality' }),
    ];

    when('[t0] windows are reconstructed', () => {
      const windows = getAllReviewSelfWindows({ events });

      then('it emits one window per distinct slug (retry deduped)', () => {
        expect(windows).toHaveLength(2);
        expect(windows.map((w) => w.slug)).toEqual([
          'has-grounded-in-reality',
          'has-questioned-requirements',
        ]);
      });

      then(
        'slug1 window captures its edit from the work between boundaries',
        () => {
          const slug1 = windows.find(
            (w) => w.slug === 'has-grounded-in-reality',
          )!;
          expect(slug1.signals.editCount).toEqual(1);
          expect(slug1.signals.articulationChars).toBeGreaterThan(0);
        },
      );

      then('slug2 window has no edit', () => {
        const slug2 = windows.find(
          (w) => w.slug === 'has-questioned-requirements',
        )!;
        expect(slug2.signals.editCount).toEqual(0);
      });
    });
  });

  given('[case2] a non-behavior route', () => {
    const events = [
      new ClaudeTranscriptEvent({
        type: 'assistant',
        role: 'assistant',
        text: null,
        toolUses: [
          {
            name: 'Bash',
            input: {
              command:
                'rhx route.stone.set --stone 1.x --route .log/other --as promised --that has-some-review',
            },
          },
        ],
        cwd: null,
        gitBranch: null,
        sessionId: null,
        timestamp: null,
        transcriptPath: '/transcripts/session.jsonl',
      }),
    ];

    when('[t0] windows are reconstructed', () => {
      const windows = getAllReviewSelfWindows({ events });

      then('it emits no windows (only .behavior routes are read)', () => {
        expect(windows).toHaveLength(0);
      });
    });
  });
});
