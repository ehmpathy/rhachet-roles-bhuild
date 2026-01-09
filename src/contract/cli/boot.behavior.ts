/**
 * .what = output bound behavior context for session start
 * .how  = TypeScript implementation for sessionstart.boot-behavior hook
 *
 * see src/domain.roles/behaver/inits/claude.hooks/sessionstart.boot-behavior.sh for full documentation
 */

import { existsSync, readFileSync } from 'fs';
import { basename, relative } from 'path';

import {
  getBranchBehaviorBind,
  getCurrentBranch,
  getLatestBlueprintByBehavior,
} from '@src/domain.operations/behavior/bind';

// ────────────────────────────────────────────────────────────────────
// helpers
// ────────────────────────────────────────────────────────────────────

const outputBehaviorFile = (
  tag: string,
  filepath: string,
  isRequired: boolean,
): void => {
  if (existsSync(filepath)) {
    const relpath = relative(process.cwd(), filepath);
    console.log(`<behavior-${tag} path="${relpath}">`);
    console.log(readFileSync(filepath, 'utf-8'));
    console.log(`</behavior-${tag}>`);
    console.log('');
  } else if (isRequired) {
    console.error(`⚠️  required file not found: ${filepath}`);
  }
};

// ────────────────────────────────────────────────────────────────────
// exported CLI entry point
// ────────────────────────────────────────────────────────────────────

export const bootBehavior = (): void => {
  // get current branch (exit silently if not in git repo)
  let currentBranch: string;
  try {
    currentBranch = getCurrentBranch({});
  } catch {
    process.exit(0);
  }

  if (!currentBranch) {
    process.exit(0);
  }

  // check if bound
  const bindResult = getBranchBehaviorBind({ branchName: currentBranch });
  const behaviorDir = bindResult.behaviorDir;
  const bindsCount = bindResult.binds.length;

  // if not bound, exit silently
  if (!behaviorDir) {
    // check for multiple binds (conflict)
    if (bindsCount > 1) {
      console.error(
        `⚠️  warning: branch '${currentBranch}' has conflicting binds:`,
      );
      bindResult.binds.forEach((bind) => {
        console.error(`  - ${basename(bind)}`);
      });
      console.error(
        "use 'bind.behavior.sh --del' to unbind and 'bind.behavior.sh --set' to rebind",
      );
    }
    process.exit(0);
  }

  // extract behavior name from path
  const behaviorName = basename(behaviorDir);

  // output behavior context
  console.log('==================================================');
  console.log(`BOUND BEHAVIOR: ${behaviorName}`);
  console.log('==================================================');
  console.log('');

  // output wish (required)
  outputBehaviorFile('wish', `${behaviorDir}/0.wish.md`, true);

  // output vision (optional)
  outputBehaviorFile('vision', `${behaviorDir}/1.vision.md`, false);

  // output criteria (optional - check for both new and legacy formats)
  if (existsSync(`${behaviorDir}/2.criteria.blackbox.md`)) {
    outputBehaviorFile(
      'criteria-blackbox',
      `${behaviorDir}/2.criteria.blackbox.md`,
      false,
    );
    outputBehaviorFile(
      'criteria-blueprint',
      `${behaviorDir}/2.criteria.blueprint.md`,
      false,
    );
  } else {
    // fallback to legacy single criteria file
    outputBehaviorFile('criteria', `${behaviorDir}/2.criteria.md`, false);
  }

  // output latest blueprint (optional)
  const latestBlueprint = getLatestBlueprintByBehavior({ behaviorDir });
  if (latestBlueprint && existsSync(latestBlueprint)) {
    outputBehaviorFile('blueprint', latestBlueprint, false);
  }

  console.log('==================================================');
};
