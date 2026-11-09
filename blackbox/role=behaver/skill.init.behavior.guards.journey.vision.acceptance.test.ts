import * as fs from 'fs';
import * as path from 'path';

import { given, then, useBeforeAll, when } from 'test-fns';

import {
  asCallOutput,
  genGuardedBehaviorScene,
  getStonesPassed,
  promiseAllReviewSelfs,
  runSkill,
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

      // vision: the yield the root-purpose-depth lane reads, live — 3 layers deep
      fs.writeFileSync(
        path.join(behavior.behaviorDir, '1.vision.yield.md'),
        [
          '# vision',
          '',
          '## .the root purpose',
          '',
          '- why: surfers who book a lesson should get a reminder',
          '  - why: a surfer who forgets misses the slot',
          '    - why: an empty slot is an instructor hour never recovered',
          '',
        ].join('\n'),
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
        expect(scene.visionPassWithoutPromises.code).toEqual(2);
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
        expect(scene.criteriaPassWithoutPromises.code).toEqual(2);
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

  given('[case2] a heavy-guard vision whose root purpose is 2 layers deep', () => {
    const scene = useBeforeAll(async () => {
      const behavior = genGuardedBehaviorScene({
        prefix: 'journey-vision-shallow',
      });
      setRouteDriven(behavior);

      // vision: the artifact, and a yield whose root purpose stops one why short
      fs.writeFileSync(
        path.join(behavior.behaviorDir, '1.vision.md'),
        '# Vision\n\nTest vision.',
      );
      fs.writeFileSync(
        path.join(behavior.behaviorDir, '1.vision.yield.md'),
        [
          '# vision',
          '',
          '## .the root purpose',
          '',
          '- why: surfers who book a lesson should get a reminder',
          '  - why: a surfer who forgets misses the slot',
          '',
        ].join('\n'),
      );

      // vision: trigger the first self-review, promise every one, then pass → peer lanes run
      setStoneAs({ ...behavior, stone: '1.vision', as: 'passed' });
      promiseAllReviewSelfs({ ...behavior, stone: '1.vision' });
      const visionPassShallow = setStoneAs({
        ...behavior,
        stone: '1.vision',
        as: 'passed',
      });

      // recovery: dig the third why, answer the depth lane's one blocker, then re-pass
      fs.writeFileSync(
        path.join(behavior.behaviorDir, '1.vision.yield.md'),
        [
          '# vision',
          '',
          '## .the root purpose',
          '',
          '- why: surfers who book a lesson should get a reminder',
          '  - why: a surfer who forgets misses the slot',
          '    - why: an empty slot is an instructor hour never recovered',
          '',
        ].join('\n'),
      );
      const dirOfPeer = path.join(behavior.behaviorDir, '.reviews', 'peer');
      const givenOfDepth = fs
        .readdirSync(dirOfPeer)
        .find((file) => file.endsWith('._.given.by_peer.root-purpose-depth.md'));
      if (!givenOfDepth)
        throw new Error('the shallow pass wrote no given for root-purpose-depth');
      // bhrain wants the answer on record before it takes a disposition
      fs.writeFileSync(
        path.join(
          dirOfPeer,
          givenOfDepth.replace('._.given.by_peer.', '._.taken.by_self.'),
        ),
        '# taken\n\n- blocker.1 [REPAIR]: the yield now nests a third why, `an empty slot is an instructor hour never recovered`\n',
      );
      const visionConcede = runSkill({
        repo: 'bhrain',
        skill: 'route.stone.set',
        args: `--stone 1.vision --route ${behavior.routeRel} --as conceded --with root-purpose-depth --about blocker.1 --severity better`,
        cwd: behavior.repoDir,
      });
      const visionAbsorb = runSkill({
        repo: 'bhrain',
        skill: 'route.stone.set',
        args: `--stone 1.vision --route ${behavior.routeRel} --as absorbed --that root-purpose-depth`,
        cwd: behavior.repoDir,
      });
      const visionPassRecovered = setStoneAs({
        ...behavior,
        stone: '1.vision',
        as: 'passed',
      });

      return {
        ...behavior,
        visionPassShallow,
        visionConcede,
        visionAbsorb,
        visionPassRecovered,
      };
    });

    afterAll(() => scene.cleanup());

    when('[t0] vision pass attempted after every self-review is promised', () => {
      then('the depth lane blocks the stone on its 1 blocker', () => {
        expect(scene.visionPassShallow.code).toEqual(2);
        const output = asCallOutput({ call: scene.visionPassShallow });
        expect(asSnapshotStable(output)).toMatchSnapshot();
        expect(output).toContain('root-purpose-depth');
        expect(output).toMatch(/root-purpose-depth[^\n]*\n[^\n]*rejected/);
        expect(output).not.toContain('passage = allowed');
      });

      then("the depth lane's given hands the clone the fix", () => {
        // the given is the clone's one route to the fix, so it must carry the lane's fix line
        const dirOfPeer = path.join(scene.behaviorDir, '.reviews', 'peer');
        const given = fs
          .readdirSync(dirOfPeer)
          .find((file) =>
            file.endsWith('._.given.by_peer.root-purpose-depth.md'),
          );
        expect(given).toBeDefined();
        const content = fs.readFileSync(path.join(dirOfPeer, given!), 'utf-8');
        expect(content).toContain('2 layers deep; it owes at least 3');
        expect(content).toContain(
          'fix: ask why of the deepest layer, and nest the answer as a `- why:` under it',
        );
      });
    });

    when('[t1] the clone digs a third why, answers the lane, and re-passes', () => {
      then('the concession lands on the lane\'s one blocker', () => {
        // bhrain exits 2 here by design: the hold stands until the re-pass
        const output = asCallOutput({ call: scene.visionConcede });
        expect(scene.visionConcede.code).toEqual(2);
        expect(output).toContain('so it is');
        expect(output).toContain('about = blocker.1 — the last concern this lane owed');
      });

      then('the absorption is accepted', () => {
        expect(scene.visionAbsorb.code).toEqual(0);
        expect(asCallOutput({ call: scene.visionAbsorb })).toContain(
          'root-purpose-depth',
        );
      });

      then('the depth lane no longer rejects the stone', () => {
        const output = asCallOutput({ call: scene.visionPassRecovered });
        expect(asSnapshotStable(output)).toMatchSnapshot();
        expect(output).toContain('root-purpose-depth');
        expect(output).toMatch(/root-purpose-depth[^\n]*\n[^\n]*approved/);
        // the review judge clears; only the human gate still holds the stone
        expect(output).toContain('judge.1 - allowed');
      });
    });
  });
});
