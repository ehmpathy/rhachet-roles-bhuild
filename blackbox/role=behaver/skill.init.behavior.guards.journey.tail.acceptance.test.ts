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
 * .what = the tail of the journey: 6.preship, then 7.reflect, then the route's end
 * .why = the tail stones are the last two of every route init writes (#590); this drives a route
 *        through them under the bhrain driver, so their order and their guards are proven live —
 *        not only by name order and template text
 *
 * .note = the self-review roster is stubbed to one slug per guard (genGuardedBehaviorScene), per
 *         rule.forbid.live-review-rosters-in-acceptance-journeys; `peer: []` and the absent
 *         `judges:` stay verbatim, since they are the shape under test
 * .note = no commit or push runs: a temp repo has no remote. the ship acts are template text,
 *         held by templates.tail.integration.test.ts
 */
describe('skill.init.behavior.guards.journey.tail', () => {
  given('[case1] a heavy-guard behavior opened at its tail', () => {
    const scene = useBeforeAll(async () => {
      const behavior = genGuardedBehaviorScene({ prefix: 'journey-tail' });

      // drop the scene's src/: it exists for the execution guard, whose artifact glob
      // (`src/**/*`) would make route.stone.del retain 5.1 as a stone with work on record
      execSync('git rm -r -q src && git commit -q -m "drop src"', {
        cwd: behavior.repoDir,
        stdio: 'pipe',
      });

      // drop every stone before the tail, so the drive's frontier is 6.preship
      setStonesDeleted({
        ...behavior,
        stones: ['1.*', '2.*', '3.*', '4.*', '5.*'],
      });

      // [t0] enter the preship stone
      const preshipDrive = setRouteDriven(behavior);

      // [t1] pass with no yield
      const preshipPassWithoutYield = setStoneAs({
        ...behavior,
        stone: '6.preship',
        as: 'passed',
      });

      // [t2] write the yield; pass again → the self-review is asked
      // .note = the yield lives in the route dir, ignored by .route/.gitignore, so force-add it;
      //         bhrain artifact detection reads staged changes
      const preshipYieldPath = path.join(
        behavior.behaviorDir,
        '6.preship.yield.md',
      );
      fs.writeFileSync(preshipYieldPath, '# preship\n\ntest preship.');
      execSync(`git add -f "${preshipYieldPath}"`, {
        cwd: behavior.repoDir,
        stdio: 'pipe',
      });
      const preshipPassWithoutPromise = setStoneAs({
        ...behavior,
        stone: '6.preship',
        as: 'passed',
      });

      // [t3] promise the self-review; pass → allowed
      promiseAllReviewSelfs({ ...behavior, stone: '6.preship' });
      const preshipPassAfterPromise = setStoneAs({
        ...behavior,
        stone: '6.preship',
        as: 'passed',
      });

      // [t4] the drive moves on to the reflect stone
      const reflectDrive = setRouteDriven(behavior);

      // [t5] reflect: yield, self-review asked, promised, passed
      const reflectYieldPath = path.join(
        behavior.behaviorDir,
        '7.reflect.yield.md',
      );
      fs.writeFileSync(reflectYieldPath, '# reflect\n\ntest reflect.');
      execSync(`git add -f "${reflectYieldPath}"`, {
        cwd: behavior.repoDir,
        stdio: 'pipe',
      });
      const reflectPassWithoutPromise = setStoneAs({
        ...behavior,
        stone: '7.reflect',
        as: 'passed',
      });
      promiseAllReviewSelfs({ ...behavior, stone: '7.reflect' });
      const reflectPassAfterPromise = setStoneAs({
        ...behavior,
        stone: '7.reflect',
        as: 'passed',
      });

      // [t6] the drive past the last stone
      const finalDrive = setRouteDriven(behavior);

      return {
        ...behavior,
        preshipDrive,
        preshipPassWithoutYield,
        preshipPassWithoutPromise,
        preshipPassAfterPromise,
        reflectDrive,
        reflectPassWithoutPromise,
        reflectPassAfterPromise,
        finalDrive,
      };
    });

    afterAll(() => scene.cleanup());

    when('[t0] the driver enters the tail', () => {
      then('the frontier is 6.preship, on sonnet, the build brain', () => {
        const output = asCallOutput({ call: scene.preshipDrive });
        expect(asSnapshotStable(output)).toMatchSnapshot();
        expect(output).toContain('stone = 6.preship');
        expect(output).toContain('brain = claude-sonnet-5-5[1m]');
      });
    });

    when('[t1] preship pass attempted with no yield', () => {
      then('blocked', () => {
        expect(scene.preshipPassWithoutYield.code).not.toEqual(0);
        const output = asCallOutput({ call: scene.preshipPassWithoutYield });
        expect(asSnapshotStable(output)).toMatchSnapshot();
      });
    });

    when('[t2] preship pass attempted with a yield, no promise', () => {
      then('blocked by the unpromised self-review', () => {
        expect(scene.preshipPassWithoutPromise.code).not.toEqual(0);
        const output = asCallOutput({ call: scene.preshipPassWithoutPromise });
        expect(asSnapshotStable(output)).toMatchSnapshot();
        expect(output).toContain('review.self required');
      });
    });

    when('[t3] preship pass attempted after the promise', () => {
      then('allowed: no peer round, no judge', () => {
        expect(scene.preshipPassAfterPromise.code).toEqual(0);
        const output = asCallOutput({ call: scene.preshipPassAfterPromise });
        expect(asSnapshotStable(output)).toMatchSnapshot();
        expect(output).toContain('passage = allowed');
      });
    });

    when('[t4] the driver drives on', () => {
      then('the frontier is 7.reflect, on opus, the design brain', () => {
        const output = asCallOutput({ call: scene.reflectDrive });
        expect(asSnapshotStable(output)).toMatchSnapshot();
        expect(output).toContain('stone = 7.reflect');
        expect(output).toContain('brain = claude-opus-5-5[1m]');
      });
    });

    when('[t5] reflect is promised and passed', () => {
      then('blocked before the promise', () => {
        expect(scene.reflectPassWithoutPromise.code).not.toEqual(0);
        expect(asCallOutput({ call: scene.reflectPassWithoutPromise })).toContain(
          'review.self required',
        );
      });

      then('allowed after it', () => {
        expect(scene.reflectPassAfterPromise.code).toEqual(0);
        const output = asCallOutput({ call: scene.reflectPassAfterPromise });
        expect(asSnapshotStable(output)).toMatchSnapshot();
        expect(output).toContain('passage = allowed');
      });

      then('both tail stones hold a passage marker, preship first', () => {
        const passed = getStonesPassed(scene);
        expect(passed).toContain('6.preship');
        expect(passed).toContain('7.reflect');
        expect(passed.indexOf('6.preship')).toBeLessThan(
          passed.indexOf('7.reflect'),
        );
      });
    });

    when('[t6] the driver drives past the last stone', () => {
      then('the route is complete: no next stone', () => {
        const output = asCallOutput({ call: scene.finalDrive });
        expect(asSnapshotStable(output)).toMatchSnapshot();
        expect(output).not.toContain('stone = 6.preship');
        expect(output).not.toContain('stone = 7.reflect');
      });
    });
  });
});
