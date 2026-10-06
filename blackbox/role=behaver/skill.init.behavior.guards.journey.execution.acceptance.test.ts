import { execSync } from 'child_process';
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
  setStonesDeleted,
} from './.test/skill.init.behavior.guards.journey';
import { asSnapshotStable } from './.test/skill.init.behavior.utils';

/**
 * .what = the execution stone of the heavy-guard journey: self-reviews, no
 *         human approval
 * .why = verifies the init.behavior execution guard works with the bhrain driver
 *
 * .note = one stone per suite, so jest runs the stones as parallel workers
 *         rather than one serial chain
 */
describe('skill.init.behavior.guards.journey.execution', () => {
  given('[case1] a heavy-guard behavior at its execution stone', () => {
    const scene = useBeforeAll(async () => {
      const behavior = genGuardedBehaviorScene({ prefix: 'journey-execution' });
      const stone = '5.1.execution.phase0_to_phaseN';

      // drop the stones this suite never walks, so the drive's frontier is the execution
      setStonesDeleted({
        ...behavior,
        stones: ['1.*', '2.*', '3.*', '4.*'],
      });

      // enter the execution: a build stone, which stays on sonnet
      const executionDrive = setRouteDriven(behavior);

      // modify src/ to create an artifact diff (execution guard requires src/**/* artifacts)
      fs.writeFileSync(
        path.join(behavior.repoDir, 'src', 'index.ts'),
        '// test implementation file\nexport const foo = 1;\nexport const bar = 2;\n',
      );

      // the yield lives in the route dir; force-add it (ignored by .route/.gitignore)
      // and stage src — bhrain artifact detection reads staged/modified changes
      const yieldPath = path.join(behavior.routeDir, `${stone}.yield.md`);
      fs.writeFileSync(yieldPath, '# Execution\n\nTest execution.');
      execSync(`git add -f "${yieldPath}" src/`, {
        cwd: behavior.repoDir,
        stdio: 'pipe',
      });

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

      // pass after promises → allowed (no approval needed)
      const passAfterPromises = setStoneAs({
        ...behavior,
        stone,
        as: 'passed',
      });

      return {
        ...behavior,
        executionDrive,
        passWithoutPromises,
        passAfterPromises,
      };
    });

    afterAll(() => scene.cleanup());

    when('[t0] execution pass attempted without promises', () => {
      then('blocked by unpromised self-review', () => {
        expect(scene.passWithoutPromises.code).not.toEqual(0);
        const output = asCallOutput({ call: scene.passWithoutPromises });
        expect(asSnapshotStable(output)).toMatchSnapshot();
        expect(output).toContain('review.self required');
      });
    });

    when('[t1] execution pass attempted after promises', () => {
      then('allowed (no judges)', () => {
        expect(scene.passAfterPromises.code).toEqual(0);
        const output = asCallOutput({ call: scene.passAfterPromises });
        expect(asSnapshotStable(output)).toMatchSnapshot();
        expect(output).toContain('passage = allowed');
      });

      then('execution holds a passage marker', () => {
        expect(getStonesPassed(scene)).toContain(
          '5.1.execution.phase0_to_phaseN',
        );
      });
    });

    when('[t2] the unenrolled driver enters the execution', () => {
      then('bhrain names sonnet, the build brain, and halts with the enroll fix', () => {
        const output = asCallOutput({ call: scene.executionDrive });
        expect(asSnapshotStable(output)).toMatchSnapshot();
        expect(output).toContain('stone = 5.1.execution.phase0_to_phaseN');
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
});
