/**
 * .what = initialize a .behavior directory for bhuild thoughtroute
 *
 * .why  = standardize the behavior-driven development thoughtroute
 *         by creating a structured directory with:
 *           - wish definition
 *           - vision statement
 *           - blackbox criteria (user-facing behavioral requirements)
 *           - blueprint criteria (implementation requirements)
 *           - research prompts
 *           - distillation prompts
 *           - blueprint prompts
 *           - roadmap prompts
 *           - execution prompts
 *           - feedback template
 *
 * usage:
 *   npx tsx src/contract/cli/init.behavior.ts --name <behaviorname> [--dir <directory>]
 *
 * guarantee:
 *   - creates .behavior/ if not found
 *   - creates versioned behavior directory
 *   - findserts all thoughtroute files (creates if not found, skips if exists)
 *   - idempotent: safe to rerun
 *   - fail-fast on errors
 */

import { basename, join, relative } from 'path';
import { z } from 'zod';

import {
  getBoundBehaviorByBranch,
  getCurrentBranch,
  setBranchBehaviorBound,
} from '@src/domain.operations/behavior/bind';
import { initBehaviorDir } from '@src/domain.operations/behavior/init';
import { getCliArgs } from '@src/infra/cli';

// ────────────────────────────────────────────────────────────────────
// schema
// ────────────────────────────────────────────────────────────────────

const schemaOfArgs = z.object({
  named: z.object({
    name: z.string(),
    dir: z.string().optional(),
  }),
  ordered: z.array(z.string()).default([]),
});

// ────────────────────────────────────────────────────────────────────
// exported CLI entry point
// ────────────────────────────────────────────────────────────────────

export const initBehavior = (): void => {
  const { named } = getCliArgs({ schema: schemaOfArgs });
  const behaviorName = named.name;
  const rawTargetDir = named.dir ?? process.cwd();

  // get current branch
  const currentBranch = getCurrentBranch();

  // check if branch already bound
  const bindResult = getBoundBehaviorByBranch({ branchName: currentBranch });
  if (bindResult.behaviorDir) {
    console.error(
      `error: branch '${currentBranch}' is already bound to: ${basename(bindResult.behaviorDir)}`,
    );
    console.error('');
    console.error('to create a new behavior, use a new worktree:');
    console.error('  git worktree add ../<new-dir> -b <new-branch>');
    console.error('  cd ../<new-dir>');
    console.error('  init.behavior.sh --name <new-behavior>');
    process.exit(1);
  }

  // normalize target dir (trim trailing .behavior)
  const targetDir = rawTargetDir.replace(/\/?\.behavior\/?$/, '');

  // generate isodate in format YYYY_MM_DD
  const now = new Date();
  const isoDate = `${now.getFullYear()}_${String(now.getMonth() + 1).padStart(2, '0')}_${String(now.getDate()).padStart(2, '0')}`;

  // construct behavior directory path (absolute)
  const behaviorDir = join(
    targetDir,
    '.behavior',
    `v${isoDate}.${behaviorName}`,
  );

  // compute relative path from caller's PWD for file contents
  let behaviorDirRel = join(
    relative(process.cwd(), targetDir),
    '.behavior',
    `v${isoDate}.${behaviorName}`,
  );
  // normalize: remove leading ./ if present
  behaviorDirRel = behaviorDirRel.replace(/^\.\//, '');

  // initialize behavior directory with template files
  const result = initBehaviorDir({ behaviorDir, behaviorDirRel });

  // log results
  for (const file of result.kept) {
    console.log(`   [KEEP] ${file}`);
  }
  for (const file of result.created) {
    console.log(`   [CREATE] ${file}`);
  }

  // auto-bind: bind current branch to newly created behavior
  setBranchBehaviorBound({
    branchName: currentBranch,
    behaviorDir,
    boundBy: 'init.behavior skill',
  });

  console.log('');
  console.log('behavior thoughtroute initialized!');
  console.log(`   ${behaviorDir}`);
  console.log('');
  console.log(
    `branch '${currentBranch}' bound to: v${isoDate}.${behaviorName}`,
  );
};
