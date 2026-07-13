import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

import { given, then, when } from 'test-fns';

import { asSnapshotStable } from './.test/skill.init.behavior.utils';

/**
 * .what = type-predicate guard for the execSync error shape
 * .why = narrows an unknown thrown value without an as-cast (rule.forbid.as-cast)
 */
const isExecErrorShape = (
  value: unknown,
): value is { stdout?: Buffer; stderr?: Buffer; status?: number } =>
  typeof value === 'object' && value !== null;

/**
 * .what = extract self-review slugs from a guard file
 * .why = dynamically discover reviews instead of hardcoded lists
 *
 * .note = only extracts slugs from `reviews: self:` section, not `peer:` section
 *         because bhrain only creates .triggered files for self-reviews
 */
const getSlugsFromGuardFile = (input: { guardPath: string }): string[] => {
  const content = fs.readFileSync(input.guardPath, 'utf-8');

  // find the self: section and extract only those slugs
  // self: section ends at peer: or judges: or end of reviews block
  const selfSectionMatch = content.match(
    /reviews:\s*\n\s+self:\s*\n([\s\S]*?)(?=\n\s+peer:|\n\s*judges:|\nartifacts:|\n[a-z]+:|\s*$)/,
  );
  if (!selfSectionMatch) return [];

  const selfSection = selfSectionMatch[1]!;
  const slugMatches = selfSection.matchAll(/^\s+-\s+slug:\s+(.+)$/gm);
  return Array.from(slugMatches, (m) => m[1]!.trim());
};

/**
 * .what = backdate specific triggered file to bypass bhrain stillness check
 * .why = bhrain checks mtime of triggered files; backdate specific slug per bhrain test pattern
 */
const backdateTriggeredFile = (input: {
  routeDir: string;
  stone: string;
  slug: string;
}): void => {
  const files = fs.readdirSync(input.routeDir);
  const triggeredFile = files.find(
    (f) =>
      f.includes(`${input.stone}.guard.selfreview.${input.slug}`) &&
      f.includes('.triggered'),
  );
  if (triggeredFile) {
    const filePath = path.join(input.routeDir, triggeredFile);
    const mtimePast = new Date(Date.now() - 91 * 1000);
    fs.utimesSync(filePath, mtimePast, mtimePast);
  }
};

/**
 * .what = promise all self-reviews for a stone via bhrain test pattern
 * .why = follows bhrain pattern exactly:
 *   t0: --as passed (triggers review 1, blocked) ← done by caller
 *   t1: backdate review 1 + promise (NO pass call)
 *   t2: --as passed (triggers review 2) + backdate + promise
 *   tN: --as passed (triggers review N) + backdate + promise
 */
const promiseAllSelfReviews = (input: {
  repoDir: string;
  routeDir: string;
  routeRel: string;
  stone: string;
  slugs: string[];
}): void => {
  for (let i = 0; i < input.slugs.length; i++) {
    const slug = input.slugs[i]!; // safe: bounded by array length

    // 1. trigger next review via --as passed (skip for i=0, already triggered by caller)
    if (i > 0) {
      try {
        execSync(
          `npx rhachet run --repo bhrain --skill route.stone.set -- --stone ${input.stone} --route ${input.routeRel} --as passed`,
          { cwd: input.repoDir, stdio: ['pipe', 'pipe', 'pipe'] },
        );
      } catch (error: unknown) {
        // allowlist the expected blockage; rethrow all else (else failhide)
        if (!isExecErrorShape(error)) throw error;
        // exit code 2 = constraint: the self-review gate halted the pass (expected)
        const wasBlockedBySelfReview =
          error.status === 2 &&
          error.stdout?.toString().includes('review.self');
        if (!wasBlockedBySelfReview) {
          console.error(
            `[${i}] pass call FAILED unexpectedly: status=${error.status}, stdout=${error.stdout?.toString()}, stderr=${error.stderr?.toString()}`,
          );
          throw error;
        }
      }
    }

    // 2. verify triggered file exists for this slug
    const filesBefore = fs.readdirSync(input.routeDir);
    const triggeredFile = filesBefore.find(
      (f) =>
        f.includes(`${input.stone}.guard.selfreview.${slug}`) &&
        f.includes('.triggered'),
    );
    if (!triggeredFile) {
      throw new Error(
        `[${i}] no triggered file for slug=${slug}. files: ${filesBefore.join(', ')}`,
      );
    }

    // 3. backdate the triggered file (same as bhrain's backdateTriggeredReport)
    backdateTriggeredFile({
      routeDir: input.routeDir,
      stone: input.stone,
      slug,
    });

    // 3.5. create articulation file (bhrain requires content before promise)
    // bhrain expects pattern: for.{stone}._.r{N}.{slug}.md
    const behaviorDir = path.dirname(input.routeDir); // routeDir is .behavior/{name}/.route
    const reviewDir = path.join(behaviorDir, 'review', 'self');
    fs.mkdirSync(reviewDir, { recursive: true });
    fs.writeFileSync(
      path.join(reviewDir, `for.${input.stone}._.r${i + 1}.${slug}.md`),
      `# ${slug}\n\nTest articulation for ${slug}.`,
    );

    // 4. promise this review
    try {
      execSync(
        `npx rhachet run --repo bhrain --skill route.stone.set -- --stone ${input.stone} --route ${input.routeRel} --as promised --that ${slug}`,
        { cwd: input.repoDir, stdio: ['pipe', 'pipe', 'pipe'] },
      );
    } catch (error: unknown) {
      // unexpected — log to aid debug before re-throw
      if (isExecErrorShape(error))
        console.error(
          `[${i}] promise call FAILED: status=${error.status}, stdout=${error.stdout?.toString()}, stderr=${error.stderr?.toString()}`,
        );
      throw error;
    }

    // 5. verify promise file was created
    const filesAfter = fs.readdirSync(input.routeDir);
    const promiseFile = filesAfter.find(
      (f) =>
        f.startsWith(`${input.stone}.guard.promise.${slug}.`) &&
        f.endsWith('.md'),
    );
    if (!promiseFile) {
      throw new Error(
        `[${i}] promise file not created for slug=${slug}. files: ${filesAfter.join(', ')}`,
      );
    }
  }
};

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
    if (!isExecErrorShape(error)) throw error;
    return {
      code: error.status ?? 1,
      stdout: (error.stdout ?? '').toString().trim(),
      stderr: (error.stderr ?? '').toString().trim(),
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

  // create package.json with bhuild, bhrain, and ehmpathy roles
  fs.writeFileSync(
    path.join(repoDir, 'package.json'),
    JSON.stringify(
      {
        name: 'test-consumer',
        version: '1.0.0',
        dependencies: {
          'rhachet-roles-bhuild': `file:${process.cwd()}`,
          'rhachet-roles-bhrain': '0.30.1',
          'rhachet-roles-ehmpathy': '>=1.34.0',
          rhachet: '^1.15.0',
        },
      },
      null,
      2,
    ),
  );

  // create .gitignore to exclude node_modules (prevents ENOBUFS in bhrain's git ls-files)
  fs.writeFileSync(
    path.join(repoDir, '.gitignore'),
    'node_modules/\n',
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
  execSync('npx rhachet roles link --repo ehmpathy --role architect', {
    cwd: repoDir,
    stdio: 'pipe',
  });
  execSync('npx rhachet roles link --repo ehmpathy --role mechanic', {
    cwd: repoDir,
    stdio: 'pipe',
  });
  execSync('npx rhachet roles link --repo ehmpathy --role ergonomist', {
    cwd: repoDir,
    stdio: 'pipe',
  });

  // create stub claude binary (peer reviews use rhachet enroll claude, which calls claude CLI)
  const binDir = path.join(repoDir, 'node_modules', '.bin');
  fs.mkdirSync(binDir, { recursive: true });
  fs.writeFileSync(
    path.join(binDir, 'claude'),
    `#!/usr/bin/env bash
# stub claude for tests - outputs success without API call
# .note = bhrain parses "N blockers" + "N nitpicks" numeric tokens to derive
#         the review verdict; prose like "no blockers found" is a malfunction.
echo "# arch review (stub)"
echo ""
echo "0 blockers"
echo "0 nitpicks"
exit 0
`,
  );
  fs.chmodSync(path.join(binDir, 'claude'), 0o755);

  // create dummy use.apikeys.sh (peer reviews source this, but no real keys needed in tests)
  const apikeysDir = path.join(repoDir, '.agent', 'repo=.this', 'role=any', 'skills');
  fs.mkdirSync(apikeysDir, { recursive: true });
  fs.writeFileSync(
    path.join(apikeysDir, 'use.apikeys.sh'),
    '#!/usr/bin/env bash\n# dummy for tests - no API keys needed\n',
  );
  fs.chmodSync(path.join(apikeysDir, 'use.apikeys.sh'), 0o755);

  // create stub review skill (peer reviews invoke this, outputs success with no issues)
  const reviewSkillDir = path.join(repoDir, '.agent', 'repo=bhrain', 'role=driver', 'skills');
  fs.mkdirSync(reviewSkillDir, { recursive: true });
  fs.writeFileSync(
    path.join(reviewSkillDir, 'review.sh'),
    `#!/usr/bin/env bash
# stub review skill for tests - outputs success with no blockers
# emits numeric counts to stdout per contract.reviewer-output (guard parses stdout)
OUTPUT=""
while [[ $# -gt 0 ]]; do
  case $1 in
    --output) OUTPUT="$2"; shift 2 ;;
    *) shift ;;
  esac
done
# .note = bhrain parses "N blockers" + "N nitpicks" numeric tokens to derive
#         the review verdict; prose like "no blockers found" is a malfunction.
if [[ -n "$OUTPUT" ]]; then
  mkdir -p "$(dirname "$OUTPUT")"
  echo "# peer review (stub)" > "$OUTPUT"
  echo "" >> "$OUTPUT"
  echo "0 blockers" >> "$OUTPUT"
  echo "0 nitpicks" >> "$OUTPUT"
fi
echo "0 blockers"
echo "0 nitpicks"
exit 0
`,
  );
  fs.chmodSync(path.join(reviewSkillDir, 'review.sh'), 0o755);

  // create stub architect role (peer reviews require this role)
  const architectRoleDir = path.join(repoDir, '.agent', 'repo=ehmpathy', 'role=architect');
  fs.mkdirSync(architectRoleDir, { recursive: true });
  fs.writeFileSync(
    path.join(architectRoleDir, 'readme.md'),
    '# architect (stub)\nstub role for tests\n',
  );

  // create stub mechanic role (peer reviews require this role)
  const mechanicRoleDir = path.join(repoDir, '.agent', 'repo=ehmpathy', 'role=mechanic');
  fs.mkdirSync(mechanicRoleDir, { recursive: true });
  fs.writeFileSync(
    path.join(mechanicRoleDir, 'readme.md'),
    '# mechanic (stub)\nstub role for tests\n',
  );

  // create stub ergonomist role (peer reviews require this role)
  const ergonomistRoleDir = path.join(repoDir, '.agent', 'repo=ehmpathy', 'role=ergonomist');
  fs.mkdirSync(ergonomistRoleDir, { recursive: true });
  fs.writeFileSync(
    path.join(ergonomistRoleDir, 'readme.md'),
    '# ergonomist (stub)\nstub role for tests\n',
  );

  // create stub reviewer role — REQUIRED: rhachet resolves every role in
  // `enroll claude --roles reviewer,...` at dispatch (before the enroll stub
  // runs), so this dir must exist or blueprint/execution stones fail to enroll.
  // .note = this dir supports role resolution, not coverage — the reviewer
  //         role's presence in the guards is asserted directly in [t10].
  const reviewerRoleDir = path.join(repoDir, '.agent', 'repo=bhrain', 'role=reviewer');
  fs.mkdirSync(reviewerRoleDir, { recursive: true });
  fs.writeFileSync(
    path.join(reviewerRoleDir, 'readme.md'),
    '# reviewer (stub)\nstub role for tests\n',
  );

  // create stub enroll skill (peer reviews use rhachet enroll claude, must succeed in tests)
  const enrollSkillDir = path.join(repoDir, '.agent', 'repo=rhachet', 'role=any', 'skills');
  fs.mkdirSync(enrollSkillDir, { recursive: true });
  fs.writeFileSync(
    path.join(enrollSkillDir, 'enroll.sh'),
    `#!/usr/bin/env bash
# stub enroll skill for tests - outputs success without active claude
# .note = bhrain parses "N blockers" + "N nitpicks" numeric tokens to derive
#         the review verdict; prose like "no blockers found" is a malfunction.
echo "# arch review (stub)"
echo ""
echo "0 blockers"
echo "0 nitpicks"
exit 0
`,
  );
  fs.chmodSync(path.join(enrollSkillDir, 'enroll.sh'), 0o755);

  return { repoDir, cleanup };
};

describe('skill.init.behavior.guards.journey', () => {
  /**
   * .what = full end-to-end journey through behavior route with guards
   * .why = verifies init.behavior guard templates work with bhrain driver
   *
   * journey covers (heavy mode):
   *   - vision stone: self-reviews + human approval
   *   - criteria stone: self-reviews + human approval
   *   - blueprint stone: self-reviews + human approval
   *   - execution stone: self-reviews, no human approval
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

      // criteria (no approval needed, just self-reviews)
      criteriaPassWithoutPromise: null as {
        code: number;
        stdout: string;
        stderr: string;
      } | null,
      criteriaPassAfterPromises: null as {
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

      // create initial src/ structure (execution guard requires src/**/* artifacts)
      // this is committed early so we can modify it later to show a diff
      const srcDir = path.join(repoDir, 'src');
      fs.mkdirSync(srcDir, { recursive: true });
      fs.writeFileSync(
        path.join(srcDir, 'index.ts'),
        '// initial placeholder\nexport const version = "0.0.0";\n',
      );
      execSync('git add src/ && git commit -m "add initial src structure"', {
        cwd: repoDir,
        stdio: 'pipe',
      });

      // initialize behavior with heavy guards (tests full guard journey)
      runSkill({
        repo: 'bhuild',
        skill: 'init.behavior',
        args: '--name full-journey --guard heavy',
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
      // VISION STONE: self-reviews + human approval (heavy mode)
      // ═══════════════════════════════════════════════════════════════
      fs.writeFileSync(
        path.join(behaviorDir, '1.vision.md'),
        '# Vision\n\nTest vision.',
      );

      const routeDir = path.join(behaviorDir, '.route');

      // try pass without approval → blocked
      checkpoints.visionPassWithoutApproval = runSkill({
        repo: 'bhrain',
        skill: 'route.stone.set',
        args: `--stone 1.vision --route ${behaviorDirRel} --as passed`,
        cwd: repoDir,
      });

      // promise all vision self-reviews via bhrain test pattern
      const visionSlugs = getSlugsFromGuardFile({
        guardPath: path.join(behaviorDir, '1.vision.guard'),
      });
      if (visionSlugs.length === 0)
        throw new Error('no self-review slugs found in 1.vision.guard');
      promiseAllSelfReviews({
        repoDir,
        routeDir,
        routeRel: behaviorDirRel,
        stone: '1.vision',
        slugs: visionSlugs,
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
      // CRITERIA STONE: self-reviews only (no human approval)
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

      // promise all criteria self-reviews via bhrain test pattern
      const criteriaSlugs = getSlugsFromGuardFile({
        guardPath: path.join(behaviorDir, '2.1.criteria.blackbox.guard'),
      });
      if (criteriaSlugs.length === 0)
        throw new Error('no self-review slugs found in 2.1.criteria.blackbox.guard');
      promiseAllSelfReviews({
        repoDir,
        routeDir,
        routeRel: behaviorDirRel,
        stone: '2.1.criteria.blackbox',
        slugs: criteriaSlugs,
      });

      // pass after promises → allowed (no approval needed for criteria)
      checkpoints.criteriaPassAfterPromises = runSkill({
        repo: 'bhrain',
        skill: 'route.stone.set',
        args: `--stone 2.1.criteria.blackbox --route ${behaviorDirRel} --as passed`,
        cwd: repoDir,
      });

      // ═══════════════════════════════════════════════════════════════
      // BLUEPRINT STONE: self-reviews + human approval (heavy mode)
      // ═══════════════════════════════════════════════════════════════
      fs.writeFileSync(
        path.join(behaviorDir, '3.3.1.blueprint.product.yield.md'),
        '# Blueprint\n\nTest blueprint.',
      );

      // try pass without promises → blocked
      checkpoints.blueprintPassWithoutPromises = runSkill({
        repo: 'bhrain',
        skill: 'route.stone.set',
        args: `--stone 3.3.1.blueprint.product --route ${behaviorDirRel} --as passed`,
        cwd: repoDir,
      });

      // promise all blueprint self-reviews via bhrain test pattern
      const blueprintSlugs = getSlugsFromGuardFile({
        guardPath: path.join(behaviorDir, '3.3.1.blueprint.product.guard'),
      });
      if (blueprintSlugs.length === 0)
        throw new Error('no self-review slugs found in 3.3.1.blueprint.product.guard');
      promiseAllSelfReviews({
        repoDir,
        routeDir,
        routeRel: behaviorDirRel,
        stone: '3.3.1.blueprint.product',
        slugs: blueprintSlugs,
      });

      // create mock peer review file (reviewed? judge requires peer review artifacts)
      const blueprintReviewsDir = path.join(routeDir, '.reviews');
      fs.mkdirSync(blueprintReviewsDir, { recursive: true });
      fs.writeFileSync(
        path.join(
          blueprintReviewsDir,
          '3.3.1.blueprint.product.peer-review.failhides.md',
        ),
        '# peer review\n\n0 blockers\n0 nitpicks\n',
      );

      // try pass with promises but no approval → blocked by judge
      checkpoints.blueprintPassWithPromisesNoApproval = runSkill({
        repo: 'bhrain',
        skill: 'route.stone.set',
        args: `--stone 3.3.1.blueprint.product --route ${behaviorDirRel} --as passed`,
        cwd: repoDir,
      });

      // approve, then pass → allowed
      runSkill({
        repo: 'bhrain',
        skill: 'route.stone.set',
        args: `--stone 3.3.1.blueprint.product --route ${behaviorDirRel} --as approved`,
        cwd: repoDir,
      });
      checkpoints.blueprintPassAfterApproval = runSkill({
        repo: 'bhrain',
        skill: 'route.stone.set',
        args: `--stone 3.3.1.blueprint.product --route ${behaviorDirRel} --as passed`,
        cwd: repoDir,
      });

      // ═══════════════════════════════════════════════════════════════
      // ROADMAP STONE: quick pass (no guards in template)
      // ═══════════════════════════════════════════════════════════════
      fs.writeFileSync(
        path.join(behaviorDir, '4.1.roadmap.yield.md'),
        '# Roadmap\n\nTest roadmap.',
      );
      runSkill({
        repo: 'bhrain',
        skill: 'route.stone.set',
        args: `--stone 4.1.roadmap --route ${behaviorDirRel} --as passed`,
        cwd: repoDir,
      });

      // ═══════════════════════════════════════════════════════════════
      // EXECUTION STONE: self-reviews, no human approval
      // ═══════════════════════════════════════════════════════════════

      // modify src/ to create artifact diff (execution guard requires src/**/* artifacts)
      // src/index.ts was created earlier, now we modify it to simulate implementation work
      fs.writeFileSync(
        path.join(repoDir, 'src', 'index.ts'),
        '// test implementation file\nexport const foo = 1;\nexport const bar = 2;\n',
      );

      // artifact path is $route/5.1.execution...i1.md, so create in routeDir
      const i1Path = path.join(
        routeDir,
        '5.1.execution.phase0_to_phaseN.yield.md',
      );
      fs.writeFileSync(i1Path, '# Execution\n\nTest execution.');

      // force-add i1.md (ignored by .route/.gitignore) and stage src changes
      // bhrain artifact detection requires uncommitted staged/modified changes
      execSync(`git add -f "${i1Path}" src/`, { cwd: repoDir, stdio: 'pipe' });

      // try pass without promises → blocked
      checkpoints.executionPassWithoutPromises = runSkill({
        repo: 'bhrain',
        skill: 'route.stone.set',
        args: `--stone 5.1.execution.phase0_to_phaseN --route ${behaviorDirRel} --as passed`,
        cwd: repoDir,
      });

      // promise all execution self-reviews via bhrain test pattern
      const executionSlugs = getSlugsFromGuardFile({
        guardPath: path.join(behaviorDir, '5.1.execution.phase0_to_phaseN.guard'),
      });
      if (executionSlugs.length === 0)
        throw new Error(
          'no self-review slugs found in 5.1.execution.phase0_to_phaseN.guard',
        );
      promiseAllSelfReviews({
        repoDir,
        routeDir,
        routeRel: behaviorDirRel,
        stone: '5.1.execution.phase0_to_phaseN',
        slugs: executionSlugs,
      });

      // create mock peer review file (reviewed? judge requires peer review artifacts)
      fs.writeFileSync(
        path.join(
          routeDir,
          '.reviews',
          '5.1.execution.phase0_to_phaseN.peer-review.failhides.md',
        ),
        '# peer review\n\n0 blockers\n0 nitpicks\n',
      );

      checkpoints.executionPassAfterPromises = runSkill({
        repo: 'bhrain',
        skill: 'route.stone.set',
        args: `--stone 5.1.execution.phase0_to_phaseN --route ${behaviorDirRel} --as passed`,
        cwd: repoDir,
      });
    });

    afterAll(() => {
      cleanup();
    });

    // ═══════════════════════════════════════════════════════════════
    // VISION STONE
    // ═══════════════════════════════════════════════════════════════
    when('[t0] vision pass attempted without promises', () => {
      then('blocked by unpromised self-review', () => {
        expect(checkpoints.visionPassWithoutApproval!.code).not.toEqual(0);
        const output =
          checkpoints.visionPassWithoutApproval!.stdout +
          checkpoints.visionPassWithoutApproval!.stderr;
        expect(asSnapshotStable(output)).toMatchSnapshot();
        expect(output).toContain('review.self required');
      });
    });

    when('[t1] vision pass attempted after promises and approval', () => {
      then('allowed', () => {
        expect(checkpoints.visionPassAfterApproval!.code).toEqual(0);
        const output =
          checkpoints.visionPassAfterApproval!.stdout +
          checkpoints.visionPassAfterApproval!.stderr;
        expect(asSnapshotStable(output)).toMatchSnapshot();
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
        expect(asSnapshotStable(output)).toMatchSnapshot();
        expect(output).toContain('review.self required');
      });
    });

    when('[t3] criteria pass attempted after promises', () => {
      then('allowed (no judges)', () => {
        expect(checkpoints.criteriaPassAfterPromises!.code).toEqual(0);
        const output =
          checkpoints.criteriaPassAfterPromises!.stdout +
          checkpoints.criteriaPassAfterPromises!.stderr;
        expect(asSnapshotStable(output)).toMatchSnapshot();
        expect(output).toContain('passage = allowed');
      });
    });

    // ═══════════════════════════════════════════════════════════════
    // BLUEPRINT STONE
    // ═══════════════════════════════════════════════════════════════
    when('[t4] blueprint pass attempted without promises', () => {
      then('blocked by unpromised self-review', () => {
        expect(checkpoints.blueprintPassWithoutPromises!.code).not.toEqual(0);
        const output =
          checkpoints.blueprintPassWithoutPromises!.stdout +
          checkpoints.blueprintPassWithoutPromises!.stderr;
        expect(asSnapshotStable(output)).toMatchSnapshot();
        expect(output).toContain('review.self required');
      });
    });

    when('[t5] blueprint pass attempted with promises but no approval', () => {
      then('blocked by judge', () => {
        expect(
          checkpoints.blueprintPassWithPromisesNoApproval!.code,
        ).not.toEqual(0);
        const output =
          checkpoints.blueprintPassWithPromisesNoApproval!.stdout +
          checkpoints.blueprintPassWithPromisesNoApproval!.stderr;
        expect(asSnapshotStable(output)).toMatchSnapshot();
        expect(output.toLowerCase()).toContain('judge');
      });
    });

    when('[t6] blueprint pass attempted after approval', () => {
      then('allowed', () => {
        expect(checkpoints.blueprintPassAfterApproval!.code).toEqual(0);
        const output =
          checkpoints.blueprintPassAfterApproval!.stdout +
          checkpoints.blueprintPassAfterApproval!.stderr;
        expect(asSnapshotStable(output)).toMatchSnapshot();
        expect(output).toContain('passage = allowed');
      });
    });

    // ═══════════════════════════════════════════════════════════════
    // EXECUTION STONE
    // ═══════════════════════════════════════════════════════════════
    when('[t7] execution pass attempted without promises', () => {
      then('blocked by unpromised self-review', () => {
        expect(checkpoints.executionPassWithoutPromises!.code).not.toEqual(0);
        const output =
          checkpoints.executionPassWithoutPromises!.stdout +
          checkpoints.executionPassWithoutPromises!.stderr;
        expect(asSnapshotStable(output)).toMatchSnapshot();
        expect(output).toContain('review.self required');
      });
    });

    when('[t8] execution pass attempted after promises', () => {
      then('allowed (no judges)', () => {
        expect(checkpoints.executionPassAfterPromises!.code).toEqual(0);
        const output =
          checkpoints.executionPassAfterPromises!.stdout +
          checkpoints.executionPassAfterPromises!.stderr;
        expect(asSnapshotStable(output)).toMatchSnapshot();
        expect(output).toContain('passage = allowed');
      });
    });

    // ═══════════════════════════════════════════════════════════════
    // FINAL STATE
    // ═══════════════════════════════════════════════════════════════
    when('[t9] journey complete', () => {
      then('all stones have passage markers in passage.jsonl', () => {
        const routeDir = path.join(behaviorDir, '.route');
        const passageFile = path.join(routeDir, 'passage.jsonl');
        expect(fs.existsSync(passageFile)).toBe(true);

        // read passage.jsonl and check all stones are recorded
        const passageContent = fs.readFileSync(passageFile, 'utf-8');
        const passageLines = passageContent
          .trim()
          .split('\n')
          .map((line) => JSON.parse(line));

        // check each stone has a passage record with status="passed"
        const passedStones = passageLines
          .filter((p: { status?: string }) => p.status === 'passed')
          .map((p: { stone: string }) => p.stone);

        expect(passedStones).toContain('1.vision');
        expect(passedStones).toContain('2.1.criteria.blackbox');
        expect(passedStones).toContain('3.3.1.blueprint.product');
        expect(passedStones).toContain('4.1.roadmap');
        expect(passedStones).toContain('5.1.execution.phase0_to_phaseN');
      });
    });

    // ═══════════════════════════════════════════════════════════════
    // ENROLLED REVIEWER CONTRACT (the wish's actual payload)
    // ═══════════════════════════════════════════════════════════════
    when('[t10] every guard-template variant embeds the enrolled-reviewer fix', () => {
      // read the SOURCE guard templates directly so EVERY variant a caller
      // could select is verified — not just the ones the heavy full-journey
      // fixture happens to generate. covers: light | heavy blueprint,
      // from_vision (--size nano) | phase0_to_phaseN execution, verification.
      // .why = the templates are the artifact this wish edits; a per-variant
      //        read locks in the fix so a silent revert of ANY variant fails
      //        (rule.require.contract-snapshot-exhaustiveness — the variant you
      //        skip is the one that breaks in prod)
      const templatesDir = path.join(
        __dirname,
        '../../src/domain.operations/behavior/init/templates',
      );

      const getEnrollLinesFromTemplates = (): {
        template: string;
        model: string | null;
        roles: string | null;
      }[] => {
        const templateFiles = fs
          .readdirSync(templatesDir)
          .filter((f) => f.includes('.guard'));
        return templateFiles.flatMap((template) => {
          const content = fs.readFileSync(
            path.join(templatesDir, template),
            'utf-8',
          );
          const enrollLines = content
            .split('\n')
            .filter((line) => line.includes('enroll claude'));
          return enrollLines.map((line) => ({
            template,
            model: line.match(/--model '([^']+)'/)?.[1] ?? null,
            roles: line.match(/--roles (\S+)/)?.[1] ?? null,
          }));
        });
      };

      then('every enrolled reviewer across all variants uses the sonnet-5 model', () => {
        const enrollLines = getEnrollLinesFromTemplates();

        // guard against a false pass if the extraction matched no lines
        expect(enrollLines.length).toBeGreaterThan(0);

        // every enroll line must carry the sonnet-5 model
        for (const enroll of enrollLines)
          expect(enroll.model).toEqual('claude-sonnet-5[1m]');
      });

      then('every enrolled reviewer across all variants lists the reviewer role first', () => {
        const enrollLines = getEnrollLinesFromTemplates();

        expect(enrollLines.length).toBeGreaterThan(0);

        // reviewer must lead the --roles list so its output contract
        // is never buried (else the judge cannot parse blocker counts)
        for (const enroll of enrollLines) {
          expect(enroll.roles).not.toBeNull();
          expect(enroll.roles!.startsWith('reviewer,')).toBe(true);
        }
      });

      then('every selectable guard variant is covered by the roster', () => {
        const enrollLines = getEnrollLinesFromTemplates();

        // explicit lock-in that BOTH blueprint variants (light is the default),
        // BOTH execution paths (from_vision is --size nano), and verification
        // each carry enroll lines the two assertions above verified. an
        // assertion (not a snapshot) so the literal model id
        // `claude-sonnet-5[1m]` is never misread as ANSI residue.
        const templatesWithEnroll = [
          ...new Set(enrollLines.map((e) => e.template)),
        ].sort();
        expect(templatesWithEnroll).toEqual([
          '3.3.1.blueprint.product.guard.heavy',
          '3.3.1.blueprint.product.guard.light',
          '5.1.execution.from_vision.guard',
          '5.1.execution.phase0_to_phaseN.guard',
          '5.3.verification.guard',
        ]);
      });
    });
  });
});
