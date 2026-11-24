import * as fs from 'fs';
import * as path from 'path';

import { given, then, useBeforeAll, when } from 'test-fns';

import {
  asCallOutput,
  FILE_STUB_REVIEW_BLOCKS,
  genGuardedBehaviorScene,
  getStonesPassed,
  promiseAllReviewSelfs,
  setRouteDriven,
  setStoneAs,
  setStonesDeleted,
} from './.test/skill.init.behavior.guards.journey';
import { asSnapshotStable } from './.test/skill.init.behavior.utils';

/**
 * .what = the blueprint stone of the heavy-guard journey: self-reviews,
 *         a judge that holds for human approval, then the roadmap after it
 * .why = verifies the init.behavior blueprint guard works with the bhrain driver
 *
 * .note = one stone per suite, so jest runs the stones as parallel workers
 *         rather than one serial chain; each suite drives its stone from a
 *         freshly initialized route
 */
describe('skill.init.behavior.guards.journey.blueprint', () => {
  given('[case1] a heavy-guard behavior at its blueprint stone', () => {
    const scene = useBeforeAll(async () => {
      const behavior = genGuardedBehaviorScene({
        guard: 'heavy',
        prefix: 'journey-blueprint',
      });
      const stone = '3.3.1.blueprint.product';

      // write the blueprint artifact
      fs.writeFileSync(
        path.join(behavior.behaviorDir, `${stone}.yield.md`),
        '# Blueprint\n\nTest blueprint.',
      );

      // try pass without promises → blocked
      const passWithoutPromises = setStoneAs({
        ...behavior,
        stone,
        as: 'passed',
      });

      // promise every self-review
      promiseAllReviewSelfs({ ...behavior, stone });

      // create mock peer review file (reviewed? judge requires peer review artifacts)
      fs.mkdirSync(path.join(behavior.routeDir, '.reviews'), {
        recursive: true,
      });
      fs.writeFileSync(
        path.join(
          behavior.routeDir,
          '.reviews',
          `${stone}.peer-review.failhides.md`,
        ),
        '# peer review\n\n0 blockers\n0 nitpicks\n',
      );

      // try pass with promises but no approval → blocked by judge
      const passWithPromisesNoApproval = setStoneAs({
        ...behavior,
        stone,
        as: 'passed',
      });

      // approve, then pass → allowed
      setStoneAs({ ...behavior, stone, as: 'approved' });
      const passAfterApproval = setStoneAs({
        ...behavior,
        stone,
        as: 'passed',
      });

      // drop the stones this suite never walks, so the drive's frontier is the roadmap
      setStonesDeleted({
        ...behavior,
        stones: ['1.*', '2.*', '3.1.*', '3.2.*'],
      });

      // enter the roadmap: the blueprint boundary, where bhrain switches to sonnet (case=2)
      const roadmapDrive = setRouteDriven(behavior);

      // roadmap: brain-only guard (no reviews, no judges) → passes at once
      fs.writeFileSync(
        path.join(behavior.behaviorDir, '4.1.roadmap.yield.md'),
        '# Roadmap\n\nTest roadmap.',
      );
      const roadmapPass = setStoneAs({
        ...behavior,
        stone: '4.1.roadmap',
        as: 'passed',
      });

      return {
        ...behavior,
        passWithoutPromises,
        passWithPromisesNoApproval,
        passAfterApproval,
        roadmapDrive,
        roadmapPass,
      };
    });

    afterAll(() => scene.cleanup());

    when('[t0] blueprint pass attempted without promises', () => {
      then('blocked by unpromised self-review', () => {
        expect(scene.passWithoutPromises.code).toEqual(2);
        const output = asCallOutput({ call: scene.passWithoutPromises });
        expect(asSnapshotStable(output)).toMatchSnapshot();
        expect(output).toContain('review.self required');
      });
    });

    when('[t1] blueprint pass attempted with promises but no approval', () => {
      then('blocked by judge', () => {
        expect(scene.passWithPromisesNoApproval.code).toEqual(2);
        const output = asCallOutput({ call: scene.passWithPromisesNoApproval });
        expect(asSnapshotStable(output)).toMatchSnapshot();
        expect(output.toLowerCase()).toContain('judge');
      });
    });

    when('[t2] blueprint pass attempted after approval', () => {
      then('allowed', () => {
        expect(scene.passAfterApproval.code).toEqual(0);
        const output = asCallOutput({ call: scene.passAfterApproval });
        expect(asSnapshotStable(output)).toMatchSnapshot();
        expect(output).toContain('passage = allowed');
      });
    });

    when('[t3] roadmap pass attempted after the blueprint', () => {
      then('allowed at once, with the note `artifacts only`', () => {
        // the brain-only guard has no reviews and no judges (case=2 [t2])
        expect(scene.roadmapPass.code).toEqual(0);
        const output = asCallOutput({ call: scene.roadmapPass });
        expect(asSnapshotStable(output)).toMatchSnapshot();
        expect(output).toContain('passage = allowed');
        expect(output).toContain('artifacts only');
        expect(output).not.toContain('unguarded');
      });

      then('blueprint and roadmap both hold a passage marker', () => {
        const stonesPassed = getStonesPassed(scene);
        expect(stonesPassed).toContain('3.3.1.blueprint.product');
        expect(stonesPassed).toContain('4.1.roadmap');
      });
    });

    when('[t4] the unenrolled driver enters the roadmap, past the blueprint', () => {
      then('bhrain names sonnet, the build brain, and halts with the enroll fix', () => {
        const output = asCallOutput({ call: scene.roadmapDrive });
        expect(asSnapshotStable(output)).toMatchSnapshot();
        expect(output).toContain('stone = 4.1.roadmap');
        expect(output).toContain('brain = claude-sonnet-5-5[1m]');
        expect(output).not.toContain('claude-opus-5-5[1m]');
        expect(output).toContain('halted, brain switch could not land');
        expect(output).toContain('no clone address was confirmed');
        expect(output).toContain(
          'rhx enroll claude --as @:driver --roles driver',
        );
      });
    });
  });

  /**
   * .mock = the wisher-how lane's brain read, via the stub reviewer's blocks marker
   * .why  = the suite grades the state a driver meets when the lane finds a criteria slip:
   *         the real guard, the real judge, the real hold. a live brain would make the
   *         hold a coin flip on a model's words, at a paid call per run (fulcrums F7, F11)
   * .real = the brain's read runs live on every route this guard binds; the review call
   *         itself is proven by rhachet-roles-bhrain's own review suite
   *
   * .note = a light route runs no criteria guard, so the blueprint lane is the first gate a
   *         criteria slip meets; both variants run, since light has no earlier gate
   */
  (['light', 'heavy'] as const).forEach((guard) =>
    given(
      `[case2.${guard}] a ${guard}-guard blueprint stone whose wisher-how lane is stubbed to find a criteria slip`,
      () => {
        const scene = useBeforeAll(async () => {
          const behavior = genGuardedBehaviorScene({
            guard,
            prefix: `journey-blueprint-how-${guard}`,
          });
          const stone = '3.3.1.blueprint.product';
          fs.writeFileSync(
            path.join(behavior.repoDir, FILE_STUB_REVIEW_BLOCKS),
            'trust-of-wisher-how\n',
          );

          // the criteria slip and the blueprint built on it
          fs.writeFileSync(
            path.join(behavior.behaviorDir, '2.1.criteria.blackbox.yield.md'),
            '# Criteria\n\nthen: get shows what the prior tool shows.',
          );
          fs.writeFileSync(
            path.join(behavior.behaviorDir, `${stone}.yield.md`),
            '# Blueprint\n\nTest blueprint.',
          );

          // promise every self-review, approve, then pass
          setStoneAs({ ...behavior, stone, as: 'passed' });
          promiseAllReviewSelfs({ ...behavior, stone });
          setStoneAs({ ...behavior, stone, as: 'approved' });
          const passWithBlocker = setStoneAs({
            ...behavior,
            stone,
            as: 'passed',
          });

          return { ...behavior, passWithBlocker };
        });

        afterAll(() => scene.cleanup());

        when(
          '[t0] blueprint pass attempted after promises and approval',
          () => {
            then('held by the wisher-how blocker', () => {
              // exit 2 = the constraint hold; a malfunction (1) must turn this red
              expect(scene.passWithBlocker.code).toEqual(2);
              const output = asCallOutput({ call: scene.passWithBlocker });
              expect(asSnapshotStable(output)).toMatchSnapshot();
              expect(output).toMatch(/r\d+: wisher-how/);
              expect(output).toContain('blockers exceed threshold (1 > 0)');
              expect(output).not.toContain('passage = allowed');
            });

            then('the blueprint holds no passage marker', () => {
              expect(getStonesPassed(scene)).not.toContain(
                '3.3.1.blueprint.product',
              );
            });
          },
        );
      },
    ),
  );
});
