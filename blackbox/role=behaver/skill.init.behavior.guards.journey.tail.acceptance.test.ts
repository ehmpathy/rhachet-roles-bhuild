import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

import { given, then, useBeforeAll, when } from 'test-fns';

import {
  asStreamsOutput,
  genGuardedBehaviorScene,
  getStonesPassed,
  promiseAllReviewSelfs,
  runSkill,
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
 * .note = the ship commit and push never run: a temp repo has no remote. the one `git commit`
 *         here is setup (the drop of `src/`). the ship acts are template text, held by
 *         templates.tail.integration.test.ts
 * .note = route.drive halts at each tail stone (the brain switch cannot land in a test session);
 *         the frontier is proven by its `stone =` and `brain =` rows, the snap stops at the
 *         halt header, and passage is driven by `route.stone.set` directly
 */

/**
 * .what = a drive's output, cut after its halt header
 * .why  = the drive's claim under test is the frontier: its stone and its brain. below the halt
 *         header sits the host's cause (a `clone whoami` probe that times out on one host fails
 *         at once on another), so the snap keeps the header, which closes the tree, and stops
 *         there; it reads the same on every host
 */
const HALT_ROW = '└─ ✋ halted, brain switch could not land';
const asDriveOutputThroughFrontier = (input: { output: string }): string => {
  const index = input.output.indexOf(HALT_ROW);
  if (index === -1) return input.output;
  return input.output.slice(0, index + HALT_ROW.length);
};

describe('skill.init.behavior.guards.journey.tail', () => {
  given('[case1] a heavy-guard behavior opened at its tail', () => {
    const scene = useBeforeAll(async () => {
      const behavior = genGuardedBehaviorScene({
        prefix: 'journey-tail',
        size: 'medi',
      });

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

      // [t7] the ship tool in a consumer that enrolled no role (case=16, c27): a nested git
      //      repo with the scene's node_modules but no .agent/, so no role is linked
      const repoUnenrolledDir = path.join(behavior.repoDir, '.temp', 'unenrolled');
      fs.mkdirSync(repoUnenrolledDir, { recursive: true });
      execSync('git init -q', { cwd: repoUnenrolledDir, stdio: 'pipe' });
      fs.symlinkSync(
        path.join(behavior.repoDir, 'node_modules'),
        path.join(repoUnenrolledDir, 'node_modules'),
      );
      const skillUnenrolled = runSkill({
        repo: 'ehmpathy',
        skill: 'git.commit.set',
        args: '--help',
        cwd: repoUnenrolledDir,
      });

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
        skillUnenrolled,
      };
    });

    afterAll(() => scene.cleanup());

    when('[t0] the driver enters the tail', () => {
      then('the frontier is 6.preship, on sonnet, the build brain', () => {
        const output = asStreamsOutput({ call: scene.preshipDrive });
        expect(
          asSnapshotStable(asDriveOutputThroughFrontier({ output })),
        ).toMatchSnapshot();
        expect(output).toContain('stone = 6.preship');
        expect(output).toContain('brain = claude-sonnet-5-5[1m]');
        expect(output).toContain('halted, brain switch could not land');
      });
    });

    when('[t1] preship pass attempted with no yield', () => {
      then('blocked: no yield on the stone', () => {
        expect(scene.preshipPassWithoutYield.code).not.toEqual(0);
        const output = asStreamsOutput({ call: scene.preshipPassWithoutYield });
        expect(asSnapshotStable(output)).toMatchSnapshot();
      });
    });

    when('[t2] preship pass attempted with a yield, no promise', () => {
      then('blocked by the unpromised self-review', () => {
        expect(scene.preshipPassWithoutPromise.code).not.toEqual(0);
        const output = asStreamsOutput({ call: scene.preshipPassWithoutPromise });
        expect(asSnapshotStable(output)).toMatchSnapshot();
        expect(output).toContain('review.self required');
      });
    });

    when('[t3] preship pass attempted after the promise', () => {
      then('allowed: no peer round, no judge', () => {
        expect(scene.preshipPassAfterPromise.code).toEqual(0);
        const output = asStreamsOutput({ call: scene.preshipPassAfterPromise });
        expect(asSnapshotStable(output)).toMatchSnapshot();
        expect(output).toContain('passage = allowed');
      });
    });

    when('[t4] the driver drives on', () => {
      then('the frontier is 7.reflect, on opus, the design brain', () => {
        const output = asStreamsOutput({ call: scene.reflectDrive });
        expect(
          asSnapshotStable(asDriveOutputThroughFrontier({ output })),
        ).toMatchSnapshot();
        expect(output).toContain('stone = 7.reflect');
        expect(output).toContain('brain = claude-opus-5-5[1m]');
        expect(output).toContain('halted, brain switch could not land');
      });
    });

    when('[t5] reflect is promised and passed', () => {
      // the [a] / [b] marks sort the snaps in journey order, since jest writes snaps by name
      then('[a] blocked before the self-review promise', () => {
        expect(scene.reflectPassWithoutPromise.code).not.toEqual(0);
        const output = asStreamsOutput({ call: scene.reflectPassWithoutPromise });
        expect(asSnapshotStable(output)).toMatchSnapshot();
        expect(output).toContain('review.self required');
      });

      then('[b] allowed after the self-review promise', () => {
        expect(scene.reflectPassAfterPromise.code).toEqual(0);
        const output = asStreamsOutput({ call: scene.reflectPassAfterPromise });
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
        const output = asStreamsOutput({ call: scene.finalDrive });
        expect(asSnapshotStable(output)).toMatchSnapshot();
        expect(output).toContain('route complete');
        expect(output).not.toContain('stone = 6.preship');
        expect(output).not.toContain('stone = 7.reflect');
      });
    });

    // case=16, c27: a consumer with no mechanic role meets the absent skill at preship's first call
    when('[t7] the ship tool is called where no role was enrolled', () => {
      then('the call fails loud with the error rhachet prints for an absent skill', () => {
        expect(scene.skillUnenrolled.code).not.toEqual(0);
        const output = asStreamsOutput({ call: scene.skillUnenrolled });
        expect(asSnapshotStable(output)).toMatchSnapshot();
        expect(output).toContain('git.commit.set');
      });
    });
  });

  // case=14 [t0]: a route finished before the tail existed, re-inited at its own --size, reopens
  // at 6.preship. the re-init is the only upgrade path to the tail (F26)
  given('[case2] a nano route finished before the tail, re-inited at its own size', () => {
    const scene = useBeforeAll(async () => {
      const behavior = genGuardedBehaviorScene({
        prefix: 'journey-reinit',
        size: 'nano',
      });

      // strip the tail, so the route is one init wrote before #590
      setStonesDeleted({ ...behavior, stones: ['6.*', '7.*'] });

      // finish the route: pass each of its three stones through its guard
      setStoneFinished({ ...behavior, stone: '1.vision', approve: true });
      setStoneFinished({
        ...behavior,
        stone: '5.1.execution.from_vision',
        approve: false,
      });
      setStoneFinished({
        ...behavior,
        stone: '5.3.verification',
        approve: false,
      });

      // [t0] the finished route, before the re-init: no next stone
      const driveBeforeReinit = setRouteDriven(behavior);

      // [t1] re-init at the route's own size: the tail returns
      const reinit = runSkill({
        repo: 'bhuild',
        skill: 'init.behavior',
        args: '--name full-journey --guard heavy --size nano',
        cwd: behavior.repoDir,
      });

      // [t2] the drive reopens at the tail
      const driveAfterReinit = setRouteDriven(behavior);

      return { ...behavior, driveBeforeReinit, reinit, driveAfterReinit };
    });

    afterAll(() => scene.cleanup());

    when('[t0] the finished route is driven before the re-init', () => {
      then('the route is complete: every stone passed, no tail', () => {
        const output = asStreamsOutput({ call: scene.driveBeforeReinit });
        expect(output).toContain('route complete');
        const passed = getStonesPassed(scene);
        expect(passed).toContain('1.vision');
        expect(passed).toContain('5.1.execution.from_vision');
        expect(passed).toContain('5.3.verification');
      });
    });

    when('[t1] the route is re-inited at its own size', () => {
      then('the re-init adds the four tail files, and no other stone', () => {
        expect(scene.reinit.code).toEqual(0);
        const output = asStreamsOutput({ call: scene.reinit });
        expect(output).toContain('+ 6.preship.stone');
        expect(output).toContain('+ 6.preship.guard');
        expect(output).toContain('+ 7.reflect.stone');
        expect(output).toContain('+ 7.reflect.guard');
        expect(output).not.toContain('+ 1.vision.stone');
        expect(output).not.toContain('+ 5.1.execution.from_vision.stone');
        expect(output).not.toContain('+ 5.3.verification.stone');
      });
    });

    when('[t2] the driver drives the re-inited route', () => {
      then('the frontier reopens at 6.preship, on sonnet', () => {
        const output = asStreamsOutput({ call: scene.driveAfterReinit });
        expect(
          asSnapshotStable(asDriveOutputThroughFrontier({ output })),
        ).toMatchSnapshot();
        expect(output).toContain('stone = 6.preship');
        expect(output).toContain('brain = claude-sonnet-5-5[1m]');
      });
    });
  });
});

/**
 * .what = passes one stone through its guard, as a driver would: yield, ask, promise each self
 *         review, a human approval where the guard judges it, then pass
 * .why  = [case2] needs a finished route, so each step fails loud here, never as a later frontier
 *         that reads wrong for a reason the scene hid
 */
const setStoneFinished = (input: {
  repoDir: string;
  behaviorDir: string;
  routeDir: string;
  routeRel: string;
  stone: string;
  approve: boolean;
}): void => {
  // write the yield and stage it (the route dir is ignored; bhrain reads staged changes)
  const yieldPath = path.join(input.behaviorDir, `${input.stone}.yield.md`);
  fs.writeFileSync(yieldPath, `# ${input.stone}\n\ntest ${input.stone}.`);
  execSync(`git add -f "${yieldPath}"`, { cwd: input.repoDir, stdio: 'pipe' });

  // ask the first self review, then promise every one
  setStoneAs({ ...input, as: 'passed' });
  promiseAllReviewSelfs(input);

  // a guard that judges `approved?` needs a human approval before the pass
  if (input.approve) setStoneAs({ ...input, as: 'approved' });

  // pass: the stubbed peers run, then the judges
  const passed = setStoneAs({ ...input, as: 'passed' });
  if (passed.code !== 0)
    throw new Error(
      `${input.stone} did not pass: code=${passed.code}, stdout=${passed.stdout}, stderr=${passed.stderr}`,
    );
};
