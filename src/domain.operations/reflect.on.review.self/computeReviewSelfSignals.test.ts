import { given, then, when } from 'test-fns';

import { ClaudeTranscriptEvent } from '@src/domain.objects/reflect.on.review.self/ClaudeTranscriptEvent';

import { computeReviewSelfSignals } from './computeReviewSelfSignals';

const ROUTE = '.behavior/x';

/**
 * .what = build a minimal assistant event with the given text + tool uses
 */
const asEvent = (input: {
  text?: string;
  toolUses?: { name: string; input: Record<string, unknown> }[];
}): ClaudeTranscriptEvent =>
  new ClaudeTranscriptEvent({
    type: 'assistant',
    role: 'assistant',
    text: input.text ?? null,
    toolUses: input.toolUses ?? [],
    cwd: null,
    gitBranch: null,
    sessionId: null,
    timestamp: null,
    transcriptPath: '/t.jsonl',
  });

describe('computeReviewSelfSignals', () => {
  given(
    '[case1] a window with edits, a read, bash runs, and articulation',
    () => {
      const events = [
        asEvent({ text: 'i reviewed the artifact carefully' }), // 33 chars
        asEvent({ toolUses: [{ name: 'Edit', input: {} }] }),
        asEvent({ toolUses: [{ name: 'Write', input: {} }] }),
        asEvent({ toolUses: [{ name: 'NotebookEdit', input: {} }] }),
        asEvent({
          toolUses: [
            { name: 'Read', input: { file_path: `${ROUTE}/1.vision.md` } },
          ],
        }),
        asEvent({
          toolUses: [{ name: 'Bash', input: { command: 'npm test' } }],
        }),
      ];

      when('[t0] the signals are computed', () => {
        const signals = computeReviewSelfSignals({ events, route: ROUTE });

        then('it counts each edit tool as an edit', () => {
          expect(signals.editCount).toEqual(3);
        });

        then('it flags a read of the route artifact', () => {
          expect(signals.readReviewedArtifact).toEqual(true);
        });

        then('it counts non-boundary bash runs', () => {
          expect(signals.bashCount).toEqual(1);
        });

        then('it tallies assistant text volume', () => {
          expect(signals.articulationChars).toEqual(
            'i reviewed the artifact carefully'.length,
          );
        });
      });
    },
  );

  given(
    '[case2] a window whose only bash is a route.stone.set boundary',
    () => {
      const events = [
        asEvent({
          toolUses: [
            {
              name: 'Bash',
              input: {
                command: `rhx route.stone.set --stone 1.vision --route ${ROUTE} --as promised --that has-x`,
              },
            },
          ],
        }),
      ];

      when('[t0] the signals are computed', () => {
        const signals = computeReviewSelfSignals({ events, route: ROUTE });

        then('it excludes the boundary command from the bash count', () => {
          expect(signals.bashCount).toEqual(0);
        });
      });
    },
  );

  given('[case3] a read of an unrelated path outside the route', () => {
    const events = [
      asEvent({
        toolUses: [
          { name: 'Read', input: { file_path: '/some/other/file.md' } },
        ],
      }),
    ];

    when('[t0] the signals are computed', () => {
      const signals = computeReviewSelfSignals({ events, route: ROUTE });

      then('it does not flag the reviewed-artifact read', () => {
        expect(signals.readReviewedArtifact).toEqual(false);
      });
    });
  });

  given(
    '[case5] a window whose edits mix artifact work with the articulation write',
    () => {
      // each promised review MUST write its articulation under `<route>/review/self/`;
      // that mandatory write is not artifact work, so it must not count as an edit —
      // else editCount saturates to ~100% and cannot distinguish a real edit
      const events = [
        asEvent({
          toolUses: [
            {
              name: 'Write',
              input: {
                file_path: `${ROUTE}/review/self/for.1.vision._.r1.has-x.md`,
              },
            },
          ],
        }),
        asEvent({
          toolUses: [
            {
              name: 'Edit',
              input: { file_path: `${ROUTE}/1.vision.yield.md` },
            },
          ],
        }),
      ];

      when('[t0] the signals are computed', () => {
        const signals = computeReviewSelfSignals({ events, route: ROUTE });

        then(
          'it excludes the mandatory articulation write from the edit count',
          () => {
            expect(signals.editCount).toEqual(1);
          },
        );
      });
    },
  );

  given(
    '[case6] a read of the self-review articulation file under the route',
    () => {
      // the articulation file lives under the route, so a naive route-prefix
      // match would false-positive the "it actually looked" read signal
      const events = [
        asEvent({
          toolUses: [
            {
              name: 'Read',
              input: {
                file_path: `${ROUTE}/review/self/for.1.vision._.r1.has-x.md`,
              },
            },
          ],
        }),
      ];

      when('[t0] the signals are computed', () => {
        const signals = computeReviewSelfSignals({ events, route: ROUTE });

        then(
          'it does not count the articulation read as an artifact read',
          () => {
            expect(signals.readReviewedArtifact).toEqual(false);
          },
        );
      });
    },
  );

  given('[case4] an empty window', () => {
    when('[t0] the signals are computed', () => {
      const signals = computeReviewSelfSignals({ events: [], route: ROUTE });

      then('all signals are zero / false', () => {
        expect(signals.editCount).toEqual(0);
        expect(signals.bashCount).toEqual(0);
        expect(signals.articulationChars).toEqual(0);
        expect(signals.readReviewedArtifact).toEqual(false);
      });
    });
  });
});
