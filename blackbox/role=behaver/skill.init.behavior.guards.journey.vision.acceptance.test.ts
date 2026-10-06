import * as fs from 'fs';
import * as path from 'path';

import { given, then, useBeforeAll, when } from 'test-fns';

import {
  asCallOutput,
  genGuardedBehaviorScene,
  getStonesPassed,
  promiseAllReviewSelfs,
  setRouteDriven,
  setStoneAs,
} from './.test/skill.init.behavior.guards.journey';
import { asSnapshotStable } from './.test/skill.init.behavior.utils';

/**
 * .what = the vision and criteria stones of the heavy-guard journey
 *   - vision: self-reviews + human approval
 *   - criteria: self-reviews, no human approval
 * .why = verifies the init.behavior vision + criteria guards work with the
 *        bhrain driver
 *
 * .note = one stone group per suite, so jest runs the stones as parallel
 *         workers rather than one serial chain
 */
describe('skill.init.behavior.guards.journey.vision', () => {
  given('[case1] a heavy-guard behavior at its vision stone', () => {
    const scene = useBeforeAll(async () => {
      const behavior = genGuardedBehaviorScene({ prefix: 'journey-vision' });

      // enter the vision: bhrain applies its `brain:` (case=1, case=6)
      const visionDrive = setRouteDriven(behavior);

      // vision: write the artifact, then try pass without promises → blocked
      fs.writeFileSync(
        path.join(behavior.behaviorDir, '1.vision.md'),
        '# Vision\n\nTest vision.',
      );
      const visionPassWithoutPromises = setStoneAs({
        ...behavior,
        stone: '1.vision',
        as: 'passed',
      });

      // vision: promise every self-review, approve, then pass → allowed
      promiseAllReviewSelfs({ ...behavior, stone: '1.vision' });
      setStoneAs({ ...behavior, stone: '1.vision', as: 'approved' });
      const visionPassAfterApproval = setStoneAs({
        ...behavior,
        stone: '1.vision',
        as: 'passed',
      });

      // criteria: write the artifact, then try pass without promises → blocked
      fs.writeFileSync(
        path.join(behavior.behaviorDir, '2.1.criteria.blackbox.i1.md'),
        '# Criteria\n\nTest criteria.',
      );
      const criteriaPassWithoutPromises = setStoneAs({
        ...behavior,
        stone: '2.1.criteria.blackbox',
        as: 'passed',
      });

      // criteria: promise every self-review, then pass → allowed (no approval needed)
      promiseAllReviewSelfs({ ...behavior, stone: '2.1.criteria.blackbox' });
      const criteriaPassAfterPromises = setStoneAs({
        ...behavior,
        stone: '2.1.criteria.blackbox',
        as: 'passed',
      });

      return {
        ...behavior,
        visionDrive,
        visionPassWithoutPromises,
        visionPassAfterApproval,
        criteriaPassWithoutPromises,
        criteriaPassAfterPromises,
      };
    });

    afterAll(() => scene.cleanup());

    when('[t0] vision pass attempted without promises', () => {
      then('blocked by unpromised self-review', () => {
        expect(scene.visionPassWithoutPromises.code).not.toEqual(0);
        const output = asCallOutput({ call: scene.visionPassWithoutPromises });
        expect(asSnapshotStable(output)).toMatchSnapshot();
        expect(output).toContain('review.self required');
      });
    });

    when('[t1] vision pass attempted after promises and approval', () => {
      then('allowed', () => {
        expect(scene.visionPassAfterApproval.code).toEqual(0);
        const output = asCallOutput({ call: scene.visionPassAfterApproval });
        expect(asSnapshotStable(output)).toMatchSnapshot();
        expect(output).toContain('passage = allowed');
      });
    });

    when('[t2] criteria pass attempted without promise', () => {
      then('blocked by unpromised self-review', () => {
        expect(scene.criteriaPassWithoutPromises.code).not.toEqual(0);
        const output = asCallOutput({
          call: scene.criteriaPassWithoutPromises,
        });
        expect(asSnapshotStable(output)).toMatchSnapshot();
        expect(output).toContain('review.self required');
      });
    });

    when('[t3] criteria pass attempted after promises', () => {
      then('allowed (no judges)', () => {
        expect(scene.criteriaPassAfterPromises.code).toEqual(0);
        const output = asCallOutput({ call: scene.criteriaPassAfterPromises });
        expect(asSnapshotStable(output)).toMatchSnapshot();
        expect(output).toContain('passage = allowed');
      });

      then('vision and criteria both hold a passage marker', () => {
        const stonesPassed = getStonesPassed(scene);
        expect(stonesPassed).toContain('1.vision');
        expect(stonesPassed).toContain('2.1.criteria.blackbox');
      });
    });

    // the journey drives as an unenrolled session (see getEnvOfUnenrolledSession), so at a
    // `brain:` stone bhrain names the prescribed brain, then halts with the `unenrolled` cause
    // and the enroll fix (catalog cell c16)
    when('[t4] the unenrolled driver enters the vision', () => {
      then('bhrain names opus, the design brain, and halts with the enroll fix', () => {
        const output = asCallOutput({ call: scene.visionDrive });
        expect(asSnapshotStable(output)).toMatchSnapshot();
        expect(output).toContain('stone = 1.vision');
        expect(output).toContain('brain = claude-opus-5-5[1m]');
        expect(output).not.toContain('claude-sonnet-5-5[1m]');
        expect(output).toContain('halted, brain switch could not land');
        expect(output).toContain('no clone address was confirmed');
        expect(output).toContain(
          'rhx enroll claude --as @:driver --roles driver',
        );
      });
    });
  });
});
