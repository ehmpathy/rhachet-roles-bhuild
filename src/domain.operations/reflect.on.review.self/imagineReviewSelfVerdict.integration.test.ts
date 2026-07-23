import { given, then, useBeforeAll, when } from 'test-fns';

import { ReflectOnReviewSelfExperience } from '@src/domain.objects/reflect.on.review.self/ReflectOnReviewSelfExperience';
import { ReflectOnReviewSelfFileTouch } from '@src/domain.objects/reflect.on.review.self/ReflectOnReviewSelfFileTouch';
import { ReflectOnReviewSelfSignals } from '@src/domain.objects/reflect.on.review.self/ReflectOnReviewSelfSignals';
import { ReflectOnReviewSelfWindow } from '@src/domain.objects/reflect.on.review.self/ReflectOnReviewSelfWindow';

import {
  getReflectBrainContext,
  REFLECT_BRAIN_KEYRACK,
  REFLECT_BRAIN_SLUG,
} from './getReflectBrainContext';
import { imagineReviewSelfVerdict } from './imagineReviewSelfVerdict';

/**
 * .what = build a real brain context bound to the cheap judge atom
 * .why = this integration test exercises the true fireworks call — the external
 *        contract — not a fake judge; it consumes the same shared communicator
 *        the CLI uses, so production and test never re-derive the brain setup
 */
const getRealBrainContext = async () =>
  getReflectBrainContext(
    { brainSlug: REFLECT_BRAIN_SLUG },
    {
      onFailureHint: `unlock the fireworks key: rhx keyrack unlock --owner ${REFLECT_BRAIN_KEYRACK.owner} --env ${REFLECT_BRAIN_KEYRACK.env}`,
    },
  );

/**
 * .what = a window with a strong genuine-gain experience — a substantive critique
 *         that surfaced a real gap, followed by a real edit to the artifact
 * .why = a clear-cut case gives the probabilistic brain the best chance of a
 *        stable label, so the test asserts real behavior, not coin flips. the
 *        prompt now grades the EXPERIENCE, so the evidence lives here, not in
 *        the scalar signals
 */
const asGainWindow = (): ReflectOnReviewSelfWindow =>
  new ReflectOnReviewSelfWindow({
    slug: 'has-questioned-assumptions',
    stone: '1.vision',
    route: '.behavior/test-route',
    transcriptPath: '/t.jsonl',
    signals: new ReflectOnReviewSelfSignals({
      editCount: 4,
      readReviewedArtifact: true,
      bashCount: 1,
      articulationChars: 1200,
    }),
    experience: new ReflectOnReviewSelfExperience({
      articulation: [
        '# self-review: has-questioned-assumptions',
        '',
        '## assumptions surfaced',
        '',
        '### A1 — the vision assumed the review window starts at `--as passed`.',
        'this is WRONG: the promise of review N also triggers review N+1, so the',
        'windows form a chain. left unfixed, every review after the first would be',
        'mis-bound. i corrected the vision to the chained-window model.',
        '',
        '### A2 — assumed one transcript per route. a worktree gets its own slug,',
        'so a route can span several session files. flagged for the blueprint.',
      ].join('\n'),
      durationMs: 180_000,
      files: [
        new ReflectOnReviewSelfFileTouch({
          path: '.behavior/test-route/1.vision.yield.md',
          mode: 'read',
          diff: null,
        }),
        new ReflectOnReviewSelfFileTouch({
          path: '.behavior/test-route/1.vision.yield.md',
          mode: 'write',
          diff: 'window starts at `--as passed` → window is chained: prior-promise → this-promise',
        }),
      ],
    }),
    verdict: null,
  });

describe('imagineReviewSelfVerdict (integration)', () => {
  given(
    '[case1] a real fireworks brain context + a genuine-gain window',
    () => {
      const scene = useBeforeAll(async () => {
        const context = await getRealBrainContext();
        return { context };
      });

      when('[t0] the window is judged by the real brain', () => {
        const verdict = useBeforeAll(async () =>
          imagineReviewSelfVerdict({ window: asGainWindow() }, scene.context),
        );

        then('the brain returns one of the three valid labels', () => {
          expect(['genuine-gain', 'genuine-noop', 'feigned-noop']).toContain(
            verdict.label,
          );
        });

        then('the brain grounds its verdict in a non-empty reason', () => {
          expect(typeof verdict.reason).toEqual('string');
          expect(verdict.reason.length).toBeGreaterThan(0);
        });

        then('the strong edit + read signals earn a genuine-gain label', () => {
          // deterministic-enough for a clear-cut case: real edits after a real
          // read is the textbook genuine-gain the prompt describes. the case is
          // deliberately unambiguous (editCount=4, readReviewedArtifact, 1200
          // chars) so this asserts real judge behavior, not a coin flip — the
          // locked-in guarantee that strong evidence is judged a genuine gain
          expect(verdict.label).toEqual('genuine-gain');
        });
      });
    },
  );
});
