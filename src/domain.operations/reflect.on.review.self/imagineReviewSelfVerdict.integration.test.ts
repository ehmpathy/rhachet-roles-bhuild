import { genContextBrain } from 'rhachet/brains';
import { getBrainAtomsByFireworksAI } from 'rhachet-brains-fireworksai';
import { given, then, useBeforeAll, when } from 'test-fns';

import { ReflectOnReviewSelfExperience } from '@src/domain.objects/reflect.on.review.self/ReflectOnReviewSelfExperience';
import { ReflectOnReviewSelfFileTouch } from '@src/domain.objects/reflect.on.review.self/ReflectOnReviewSelfFileTouch';
import { ReflectOnReviewSelfSignals } from '@src/domain.objects/reflect.on.review.self/ReflectOnReviewSelfSignals';
import { ReflectOnReviewSelfWindow } from '@src/domain.objects/reflect.on.review.self/ReflectOnReviewSelfWindow';

import { REFLECT_BRAIN_SLUG } from './getReflectBrainContext';
import { imagineReviewSelfVerdict } from './imagineReviewSelfVerdict';

/**
 * .what = the keyrack location the real-brain test targets
 * .why = tests must read the same env the CI firewall exports (`--env test`);
 *        production stays on ehmpath/prep (the dev vault), so the test overrides
 *        the keyrack env to test — mirroring the prod-prep / test-test split
 */
const TEST_BRAIN_KEYRACK = { owner: 'ehmpath', env: 'test' } as const;

/**
 * .what = build a real brain context bound to the cheap judge atom, via explicit
 *         atom registration
 * .why = the production communicator getReflectBrainContext reaches the brain through
 *        rhachet's runtime package discovery, which loads supplier packages via a
 *        native dynamic import() that jest cannot run — so a discovery call under jest
 *        finds zero brains. this test registers the fireworks atoms explicitly (a
 *        static import resolves to a require under jest) and hands them to
 *        genContextBrain's explicit mode, which skips discovery. it still makes the
 *        same real fireworks call the production path makes, so the external contract
 *        is exercised for real. mirrors rhachet-roles-bhrain's genTestBrainContext —
 *        the established pattern for a real-brain jest test.
 */
const getRealBrainContext = () =>
  genContextBrain({
    brains: { atoms: getBrainAtomsByFireworksAI() },
    choice: { atom: REFLECT_BRAIN_SLUG },
    creds: { keyrack: TEST_BRAIN_KEYRACK },
  });

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
        const context = getRealBrainContext();
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
