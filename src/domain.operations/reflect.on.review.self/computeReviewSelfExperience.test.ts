import { given, then, when } from 'test-fns';

import { ClaudeTranscriptEvent } from '@src/domain.objects/reflect.on.review.self/ClaudeTranscriptEvent';

import { computeReviewSelfExperience } from './computeReviewSelfExperience';

const ROUTE = '.behavior/x';

/**
 * .what = build a minimal event with the given timestamp + tool uses
 */
const asEvent = (input: {
  timestamp?: string;
  toolUses?: { name: string; input: Record<string, unknown> }[];
}): ClaudeTranscriptEvent =>
  new ClaudeTranscriptEvent({
    type: 'assistant',
    role: 'assistant',
    text: null,
    toolUses: input.toolUses ?? [],
    cwd: null,
    gitBranch: null,
    sessionId: null,
    timestamp: input.timestamp ?? null,
    transcriptPath: '/t.jsonl',
  });

describe('computeReviewSelfExperience', () => {
  given(
    '[case1] a window that reads an artifact, edits it, and writes its articulation',
    () => {
      const events = [
        asEvent({
          timestamp: '2026-07-14T10:00:00.000Z',
          toolUses: [
            {
              name: 'Read',
              input: { file_path: `${ROUTE}/1.vision.yield.md` },
            },
          ],
        }),
        asEvent({
          toolUses: [
            {
              name: 'Edit',
              input: {
                file_path: `${ROUTE}/1.vision.yield.md`,
                old_string: 'before',
                new_string: 'after',
              },
            },
          ],
        }),
        asEvent({
          timestamp: '2026-07-14T10:02:00.000Z',
          toolUses: [
            {
              name: 'Write',
              input: {
                file_path: `${ROUTE}/review/self/for.1.vision._.r1.has-x.md`,
                content: 'the real critique: A1 was wrong, fixed it',
              },
            },
          ],
        }),
      ];

      when('[t0] the experience is distilled', () => {
        const experience = computeReviewSelfExperience({
          events,
          route: ROUTE,
        });

        then(
          'it captures the articulation content from the review/self write',
          () => {
            expect(experience.articulation).toEqual(
              'the real critique: A1 was wrong, fixed it',
            );
          },
        );

        then('it computes the duration from first to last timestamp', () => {
          expect(experience.durationMs).toEqual(120_000);
        });

        then(
          'it lists the artifact read and edit, not the articulation write',
          () => {
            expect(experience.files).toHaveLength(2);
            expect(experience.files.map((file) => file.mode)).toEqual([
              'read',
              'write',
            ]);
            expect(
              experience.files.every((file) =>
                file.path.includes('1.vision.yield.md'),
              ),
            ).toEqual(true);
          },
        );

        then('the edit touch carries the old → new diff', () => {
          const editTouch = experience.files.find(
            (file) => file.mode === 'write',
          )!;
          expect(editTouch.diff).toEqual('before → after');
        });

        then('the read touch carries no diff', () => {
          const readTouch = experience.files.find(
            (file) => file.mode === 'read',
          )!;
          expect(readTouch.diff).toBeNull();
        });
      });
    },
  );

  given('[case2] a window with no articulation write and no timestamps', () => {
    const events = [
      asEvent({
        toolUses: [
          {
            name: 'Write',
            input: {
              file_path: `${ROUTE}/1.vision.yield.md`,
              content: 'some content',
            },
          },
        ],
      }),
    ];

    when('[t0] the experience is distilled', () => {
      const experience = computeReviewSelfExperience({ events, route: ROUTE });

      then('the articulation is null (no review/self write)', () => {
        expect(experience.articulation).toBeNull();
      });

      then('the duration is null (fewer than two timestamps)', () => {
        expect(experience.durationMs).toBeNull();
      });

      then('the artifact write is still listed with its content diff', () => {
        expect(experience.files).toHaveLength(1);
        expect(experience.files[0]!.diff).toEqual('some content');
      });
    });
  });

  given('[case3] a write whose content exceeds the diff budget', () => {
    const hugeContent = 'x'.repeat(5000);
    const events = [
      asEvent({
        toolUses: [
          {
            name: 'Write',
            input: {
              file_path: `${ROUTE}/big.ts`,
              content: hugeContent,
            },
          },
        ],
      }),
    ];

    when('[t0] the experience is distilled', () => {
      const experience = computeReviewSelfExperience({ events, route: ROUTE });

      then('the diff is capped with a truncation marker', () => {
        const diff = experience.files[0]!.diff!;
        expect(diff.length).toBeLessThan(hugeContent.length);
        expect(diff.endsWith('…(truncated)')).toEqual(true);
      });
    });
  });

  given('[case4] an empty window', () => {
    when('[t0] the experience is distilled', () => {
      const experience = computeReviewSelfExperience({
        events: [],
        route: ROUTE,
      });

      then('the articulation is null, duration null, no files', () => {
        expect(experience.articulation).toBeNull();
        expect(experience.durationMs).toBeNull();
        expect(experience.files).toEqual([]);
      });
    });
  });
});
