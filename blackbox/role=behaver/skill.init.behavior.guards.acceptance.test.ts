import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

import { given, then, when } from 'test-fns';

import { genTestGitRepo } from '../.test/infra';

/**
 * .what = helper to run rhachet skill and capture output
 * .why = consistent invocation pattern for all skill calls
 */
const runSkill = (input: {
  repo: string;
  skill: string;
  args?: string;
  cwd: string;
}): { code: number; stdout: string; stderr: string } => {
  const args = input.args ?? '';
  try {
    const stdout = execSync(
      `npx rhachet run --repo ${input.repo} --skill ${input.skill} -- ${args}`,
      {
        cwd: input.cwd,
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'pipe'],
      },
    );
    return { code: 0, stdout: stdout.trim(), stderr: '' };
  } catch (error: unknown) {
    const execError = error as {
      stdout?: Buffer | string;
      stderr?: Buffer | string;
      status?: number;
    };
    return {
      code: execError.status ?? 1,
      stdout: (execError.stdout ?? '').toString().trim(),
      stderr: (execError.stderr ?? '').toString().trim(),
    };
  }
};

/**
 * .what = creates a consumer repo with both bhuild and bhrain linked
 * .why = tests the full journey from init.behavior through route.stone.set
 */
const genConsumerRepoWithBhrain = (input: {
  prefix: string;
  branchName: string;
}): { repoDir: string; cleanup: () => void } => {
  const { repoDir, cleanup } = genTestGitRepo({
    prefix: input.prefix,
    branchName: input.branchName,
  });

  // create package.json with both bhuild and bhrain
  fs.writeFileSync(
    path.join(repoDir, 'package.json'),
    JSON.stringify(
      {
        name: 'test-consumer',
        version: '1.0.0',
        dependencies: {
          'rhachet-roles-bhuild': `file:${process.cwd()}`,
          'rhachet-roles-bhrain': '>=0.13.0',
          rhachet: '^1.15.0',
        },
      },
      null,
      2,
    ),
  );

  // install dependencies
  execSync('npx pnpm install --ignore-scripts', {
    cwd: repoDir,
    stdio: 'pipe',
  });

  // link roles
  execSync('npx rhachet roles link --repo bhuild --role behaver', {
    cwd: repoDir,
    stdio: 'pipe',
  });
  execSync('npx rhachet roles link --repo bhrain --role driver', {
    cwd: repoDir,
    stdio: 'pipe',
  });

  return { repoDir, cleanup };
};

describe('skill.init.behavior.guards.journey', () => {
  /**
   * .what = full end-to-end journey through behavior route with guards
   * .why = verifies init.behavior guard templates work with bhrain driver
   *
   * journey covers:
   *   - vision stone: human approval gate
   *   - criteria stone: self-review (1 prompt) + human approval
   *   - blueprint stone: self-review (3 prompts) + human approval
   *   - execution stone: self-review (2 prompts), no human approval
   */
  given('[case1] full behavior route with guards', () => {
    // scene: consumer repo with behavior initialized
    let repoDir: string;
    let cleanup: () => void;
    let behaviorDir: string;
    let behaviorDirRel: string;

    // journey checkpoints
    const checkpoints = {
      // vision
      visionPassWithoutApproval: null as {
        code: number;
        stdout: string;
        stderr: string;
      } | null,
      visionPassAfterApproval: null as {
        code: number;
        stdout: string;
        stderr: string;
      } | null,

      // criteria
      criteriaPassWithoutPromise: null as {
        code: number;
        stdout: string;
        stderr: string;
      } | null,
      criteriaPassWithPromiseNoApproval: null as {
        code: number;
        stdout: string;
        stderr: string;
      } | null,
      criteriaPassAfterApproval: null as {
        code: number;
        stdout: string;
        stderr: string;
      } | null,

      // blueprint
      blueprintPassWithoutPromises: null as {
        code: number;
        stdout: string;
        stderr: string;
      } | null,
      blueprintPassWithPromisesNoApproval: null as {
        code: number;
        stdout: string;
        stderr: string;
      } | null,
      blueprintPassAfterApproval: null as {
        code: number;
        stdout: string;
        stderr: string;
      } | null,

      // execution
      executionPassWithoutPromises: null as {
        code: number;
        stdout: string;
        stderr: string;
      } | null,
      executionPassAfterPromises: null as {
        code: number;
        stdout: string;
        stderr: string;
      } | null,
    };

    beforeAll(async () => {
      // setup consumer repo
      const consumer = genConsumerRepoWithBhrain({
        prefix: 'full-journey-',
        branchName: 'feature/full-journey',
      });
      repoDir = consumer.repoDir;
      cleanup = consumer.cleanup;

      // initialize behavior
      runSkill({
        repo: 'bhuild',
        skill: 'init.behavior',
        args: '--name full-journey',
        cwd: repoDir,
      });

      // find the behavior dir
      const behaviorRoot = path.join(repoDir, '.behavior');
      const dirs = fs.readdirSync(behaviorRoot);
      const behaviorDirName = dirs.find((d) => d.includes('full-journey'));
      if (!behaviorDirName) throw new Error('behavior dir not found');
      behaviorDir = path.join(behaviorRoot, behaviorDirName);
      behaviorDirRel = `.behavior/${behaviorDirName}`;

      // ═══════════════════════════════════════════════════════════════
      // VISION STONE: human approval only
      // ═══════════════════════════════════════════════════════════════
      fs.writeFileSync(
        path.join(behaviorDir, '1.vision.md'),
        '# Vision\n\nTest vision.',
      );

      // try pass without approval → blocked
      checkpoints.visionPassWithoutApproval = runSkill({
        repo: 'bhrain',
        skill: 'route.stone.set',
        args: `--stone 1.vision --route ${behaviorDirRel} --as passed`,
        cwd: repoDir,
      });

      // approve, then pass → allowed
      runSkill({
        repo: 'bhrain',
        skill: 'route.stone.set',
        args: `--stone 1.vision --route ${behaviorDirRel} --as approved`,
        cwd: repoDir,
      });
      checkpoints.visionPassAfterApproval = runSkill({
        repo: 'bhrain',
        skill: 'route.stone.set',
        args: `--stone 1.vision --route ${behaviorDirRel} --as passed`,
        cwd: repoDir,
      });

      // ═══════════════════════════════════════════════════════════════
      // CRITERIA STONE: 1 self-review (all-real-junior) + human approval
      // ═══════════════════════════════════════════════════════════════
      fs.writeFileSync(
        path.join(behaviorDir, '2.1.criteria.blackbox.i1.md'),
        '# Criteria\n\nTest criteria.',
      );

      // try pass without promise → blocked
      checkpoints.criteriaPassWithoutPromise = runSkill({
        repo: 'bhrain',
        skill: 'route.stone.set',
        args: `--stone 2.1.criteria.blackbox --route ${behaviorDirRel} --as passed`,
        cwd: repoDir,
      });

      // promise self-review
      runSkill({
        repo: 'bhrain',
        skill: 'route.stone.set',
        args: `--stone 2.1.criteria.blackbox --route ${behaviorDirRel} --as promised --that all-real-junior`,
        cwd: repoDir,
      });

      // try pass with promise but no approval → blocked by judge
      checkpoints.criteriaPassWithPromiseNoApproval = runSkill({
        repo: 'bhrain',
        skill: 'route.stone.set',
        args: `--stone 2.1.criteria.blackbox --route ${behaviorDirRel} --as passed`,
        cwd: repoDir,
      });

      // approve, then pass → allowed
      runSkill({
        repo: 'bhrain',
        skill: 'route.stone.set',
        args: `--stone 2.1.criteria.blackbox --route ${behaviorDirRel} --as approved`,
        cwd: repoDir,
      });
      checkpoints.criteriaPassAfterApproval = runSkill({
        repo: 'bhrain',
        skill: 'route.stone.set',
        args: `--stone 2.1.criteria.blackbox --route ${behaviorDirRel} --as passed`,
        cwd: repoDir,
      });

      // ═══════════════════════════════════════════════════════════════
      // BLUEPRINT STONE: 3 self-reviews + human approval
      // ═══════════════════════════════════════════════════════════════
      fs.writeFileSync(
        path.join(behaviorDir, '3.3.blueprint.v1.i1.md'),
        '# Blueprint\n\nTest blueprint.',
      );

      // try pass without promises → blocked
      checkpoints.blueprintPassWithoutPromises = runSkill({
        repo: 'bhrain',
        skill: 'route.stone.set',
        args: `--stone 3.3.blueprint.v1 --route ${behaviorDirRel} --as passed`,
        cwd: repoDir,
      });

      // promise all 3 self-reviews
      runSkill({
        repo: 'bhrain',
        skill: 'route.stone.set',
        args: `--stone 3.3.blueprint.v1 --route ${behaviorDirRel} --as promised --that all-done-self`,
        cwd: repoDir,
      });
      runSkill({
        repo: 'bhrain',
        skill: 'route.stone.set',
        args: `--stone 3.3.blueprint.v1 --route ${behaviorDirRel} --as promised --that all-done-junior`,
        cwd: repoDir,
      });
      runSkill({
        repo: 'bhrain',
        skill: 'route.stone.set',
        args: `--stone 3.3.blueprint.v1 --route ${behaviorDirRel} --as promised --that all-simple-junior`,
        cwd: repoDir,
      });

      // try pass with promises but no approval → blocked by judge
      checkpoints.blueprintPassWithPromisesNoApproval = runSkill({
        repo: 'bhrain',
        skill: 'route.stone.set',
        args: `--stone 3.3.blueprint.v1 --route ${behaviorDirRel} --as passed`,
        cwd: repoDir,
      });

      // approve, then pass → allowed
      runSkill({
        repo: 'bhrain',
        skill: 'route.stone.set',
        args: `--stone 3.3.blueprint.v1 --route ${behaviorDirRel} --as approved`,
        cwd: repoDir,
      });
      checkpoints.blueprintPassAfterApproval = runSkill({
        repo: 'bhrain',
        skill: 'route.stone.set',
        args: `--stone 3.3.blueprint.v1 --route ${behaviorDirRel} --as passed`,
        cwd: repoDir,
      });

      // ═══════════════════════════════════════════════════════════════
      // ROADMAP STONE: quick pass (no guards in template)
      // ═══════════════════════════════════════════════════════════════
      fs.writeFileSync(
        path.join(behaviorDir, '4.1.roadmap.v1.md'),
        '# Roadmap\n\nTest roadmap.',
      );
      runSkill({
        repo: 'bhrain',
        skill: 'route.stone.set',
        args: `--stone 4.1.roadmap.v1 --route ${behaviorDirRel} --as passed`,
        cwd: repoDir,
      });

      // ═══════════════════════════════════════════════════════════════
      // EXECUTION STONE: 2 self-reviews, no human approval
      // ═══════════════════════════════════════════════════════════════
      fs.writeFileSync(
        path.join(behaviorDir, '5.1.execution.phase0_to_phaseN.v1.i1.md'),
        '# Execution\n\nTest execution.',
      );

      // try pass without promises → blocked
      checkpoints.executionPassWithoutPromises = runSkill({
        repo: 'bhrain',
        skill: 'route.stone.set',
        args: `--stone 5.1.execution.phase0_to_phaseN.v1 --route ${behaviorDirRel} --as passed`,
        cwd: repoDir,
      });

      // promise both self-reviews, then pass → allowed (no judges)
      runSkill({
        repo: 'bhrain',
        skill: 'route.stone.set',
        args: `--stone 5.1.execution.phase0_to_phaseN.v1 --route ${behaviorDirRel} --as promised --that all-done-self`,
        cwd: repoDir,
      });
      runSkill({
        repo: 'bhrain',
        skill: 'route.stone.set',
        args: `--stone 5.1.execution.phase0_to_phaseN.v1 --route ${behaviorDirRel} --as promised --that all-done-junior`,
        cwd: repoDir,
      });
      checkpoints.executionPassAfterPromises = runSkill({
        repo: 'bhrain',
        skill: 'route.stone.set',
        args: `--stone 5.1.execution.phase0_to_phaseN.v1 --route ${behaviorDirRel} --as passed`,
        cwd: repoDir,
      });
    });

    afterAll(() => {
      cleanup();
    });

    // ═══════════════════════════════════════════════════════════════
    // VISION STONE
    // ═══════════════════════════════════════════════════════════════
    when('[t0] vision pass attempted without approval', () => {
      then('blocked by judge', () => {
        expect(checkpoints.visionPassWithoutApproval!.code).not.toEqual(0);
        const output =
          checkpoints.visionPassWithoutApproval!.stdout +
          checkpoints.visionPassWithoutApproval!.stderr;
        expect(output).toMatchSnapshot();
        expect(output.toLowerCase()).toContain('judge');
      });
    });

    when('[t1] vision pass attempted after approval', () => {
      then('allowed', () => {
        expect(checkpoints.visionPassAfterApproval!.code).toEqual(0);
        const output =
          checkpoints.visionPassAfterApproval!.stdout +
          checkpoints.visionPassAfterApproval!.stderr;
        expect(output).toMatchSnapshot();
        expect(output).toContain('passage = allowed');
      });
    });

    // ═══════════════════════════════════════════════════════════════
    // CRITERIA STONE
    // ═══════════════════════════════════════════════════════════════
    when('[t2] criteria pass attempted without promise', () => {
      then('blocked by unpromised self-review', () => {
        expect(checkpoints.criteriaPassWithoutPromise!.code).not.toEqual(0);
        const output =
          checkpoints.criteriaPassWithoutPromise!.stdout +
          checkpoints.criteriaPassWithoutPromise!.stderr;
        expect(output).toMatchSnapshot();
        expect(output).toContain('all-real-junior');
      });
    });

    when('[t3] criteria pass attempted with promise but no approval', () => {
      then('blocked by judge', () => {
        expect(
          checkpoints.criteriaPassWithPromiseNoApproval!.code,
        ).not.toEqual(0);
        const output =
          checkpoints.criteriaPassWithPromiseNoApproval!.stdout +
          checkpoints.criteriaPassWithPromiseNoApproval!.stderr;
        expect(output).toMatchSnapshot();
        expect(output.toLowerCase()).toContain('judge');
      });
    });

    when('[t4] criteria pass attempted after approval', () => {
      then('allowed', () => {
        expect(checkpoints.criteriaPassAfterApproval!.code).toEqual(0);
        const output =
          checkpoints.criteriaPassAfterApproval!.stdout +
          checkpoints.criteriaPassAfterApproval!.stderr;
        expect(output).toMatchSnapshot();
        expect(output).toContain('passage = allowed');
      });
    });

    // ═══════════════════════════════════════════════════════════════
    // BLUEPRINT STONE
    // ═══════════════════════════════════════════════════════════════
    when('[t5] blueprint pass attempted without promises', () => {
      then('blocked by unpromised self-review', () => {
        expect(checkpoints.blueprintPassWithoutPromises!.code).not.toEqual(0);
        const output =
          checkpoints.blueprintPassWithoutPromises!.stdout +
          checkpoints.blueprintPassWithoutPromises!.stderr;
        expect(output).toMatchSnapshot();
        expect(output).toContain('all-done-self');
      });
    });

    when('[t6] blueprint pass attempted with promises but no approval', () => {
      then('blocked by judge', () => {
        expect(
          checkpoints.blueprintPassWithPromisesNoApproval!.code,
        ).not.toEqual(0);
        const output =
          checkpoints.blueprintPassWithPromisesNoApproval!.stdout +
          checkpoints.blueprintPassWithPromisesNoApproval!.stderr;
        expect(output).toMatchSnapshot();
        expect(output.toLowerCase()).toContain('judge');
      });
    });

    when('[t7] blueprint pass attempted after approval', () => {
      then('allowed', () => {
        expect(checkpoints.blueprintPassAfterApproval!.code).toEqual(0);
        const output =
          checkpoints.blueprintPassAfterApproval!.stdout +
          checkpoints.blueprintPassAfterApproval!.stderr;
        expect(output).toMatchSnapshot();
        expect(output).toContain('passage = allowed');
      });
    });

    // ═══════════════════════════════════════════════════════════════
    // EXECUTION STONE
    // ═══════════════════════════════════════════════════════════════
    when('[t8] execution pass attempted without promises', () => {
      then('blocked by unpromised self-review', () => {
        expect(checkpoints.executionPassWithoutPromises!.code).not.toEqual(0);
        const output =
          checkpoints.executionPassWithoutPromises!.stdout +
          checkpoints.executionPassWithoutPromises!.stderr;
        expect(output).toMatchSnapshot();
        expect(output).toContain('all-done-self');
      });
    });

    when('[t9] execution pass attempted after promises', () => {
      then('allowed (no judges)', () => {
        expect(checkpoints.executionPassAfterPromises!.code).toEqual(0);
        const output =
          checkpoints.executionPassAfterPromises!.stdout +
          checkpoints.executionPassAfterPromises!.stderr;
        expect(output).toMatchSnapshot();
        expect(output).toContain('passage = allowed');
      });
    });

    // ═══════════════════════════════════════════════════════════════
    // FINAL STATE
    // ═══════════════════════════════════════════════════════════════
    when('[t10] journey complete', () => {
      then('all stones have passage markers', () => {
        const routeDir = path.join(behaviorDir, '.route');
        expect(fs.existsSync(path.join(routeDir, '1.vision.passed'))).toBe(
          true,
        );
        expect(
          fs.existsSync(path.join(routeDir, '2.1.criteria.blackbox.passed')),
        ).toBe(true);
        expect(
          fs.existsSync(path.join(routeDir, '3.3.blueprint.v1.passed')),
        ).toBe(true);
        expect(
          fs.existsSync(path.join(routeDir, '4.1.roadmap.v1.passed')),
        ).toBe(true);
        expect(
          fs.existsSync(
            path.join(routeDir, '5.1.execution.phase0_to_phaseN.v1.passed'),
          ),
        ).toBe(true);
      });
    });
  });
});
