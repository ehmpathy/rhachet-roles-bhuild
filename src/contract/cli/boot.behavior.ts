/**
 * .what = output bound behavior context for session start
 * .how  = TypeScript implementation for sessionstart.boot-behavior hook
 *
 * see src/domain.roles/behaver/inits/claude.hooks/sessionstart.boot-behavior.sh for full documentation
 */

import { existsSync, readFileSync } from 'fs';
import { MalfunctionError } from 'helpful-errors';
import { basename, relative } from 'path';

import {
  getAllBehaviorContextArtifacts,
  getBranchBehaviorBind,
  getCurrentBranch,
} from '@src/domain.operations/behavior/bind';

// ────────────────────────────────────────────────────────────────────
// helpers
// ────────────────────────────────────────────────────────────────────

const outputBehaviorFile = (
  scope: string,
  filepath: string,
  isRequired: boolean,
): void => {
  // path shown to the human, relative to cwd (stable + readable in both blocks)
  const relpath = relative(process.cwd(), filepath);

  // emit the block when the file is present, then stop
  if (existsSync(filepath)) {
    console.log(`<behavior scope="${scope}" path="${relpath}">`);
    console.log(readFileSync(filepath, 'utf-8'));
    console.log('</behavior>');
    console.log('');
    return;
  }

  // an absent required file warns loud + actionable (optionals stay silent).
  // .why = this is a SessionStart hook: it MUST NOT throw or exit non-zero, or
  //        it blocks the human's session. so a constraint (absent wish) is
  //        surfaced via a loud, actionable stderr warn rather than a
  //        ConstraintError/exit-2 — deliberate, not a failhide.
  if (isRequired)
    console.error(
      `⚠️  required file not found: ${relpath}\n` +
        `   to fix: create the wish file, or unbind this behavior via ` +
        `'bind.behavior.sh --del'`,
    );
};

/**
 * .what = get the current git branch, or exit 0 when there is no branch to boot
 * .why = a SessionStart hook must never block session start. two conditions are
 *        valid no-ops that warrant a clean exit 0: (a) not inside a git repo, and
 *        (b) an empty branch (rare). ANY other error (git absent, permission
 *        denied) is a real malfunction that fails loud with context.
 *
 * .note = extracted from bootBehavior so the orchestrator reads as narrative and
 *         the malfunction path carries diagnostic context for the on-call human.
 */
const getCurrentBranchOrExit = (context: { cwd: string }): string => {
  try {
    const branch = getCurrentBranch({}, context);
    if (!branch) process.exit(0);
    return branch;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    // a non-git directory is a valid no-op: exit 0, never block the session
    if (/not a git repository/i.test(message)) process.exit(0);

    // any other failure is a real malfunction: fail loud with full context
    throw new MalfunctionError(
      'boot.behavior: could not get the current git branch',
      { operation: 'getCurrentBranch', cwd: context.cwd, reason: message },
    );
  }
};

// ────────────────────────────────────────────────────────────────────
// exported CLI entry point
// ────────────────────────────────────────────────────────────────────

export const bootBehavior = (): void => {
  const context = { cwd: process.cwd() };

  // get the current branch (exits 0 for the valid no-op conditions)
  const currentBranch = getCurrentBranchOrExit(context);

  // check if bound
  const bindResult = getBranchBehaviorBind(
    { branchName: currentBranch },
    context,
  );
  const behaviorDir = bindResult.behaviorDir;
  const bindsCount = bindResult.binds.length;

  // if not bound, exit silently
  if (!behaviorDir) {
    // a multi-bind clash is a constraint the human must fix. but this is a
    // SessionStart hook, so it MUST exit 0 (never block the session): the
    // clash is surfaced via a loud, actionable stderr warn, then exit 0.
    if (bindsCount > 1) {
      console.error(
        `⚠️  warning: branch '${currentBranch}' has conflicting binds:`,
      );
      bindResult.binds.forEach((bind) => {
        console.error(`  - ${basename(bind)}`);
      });
      console.error(
        'no behavior context will load until the conflict is fixed:',
      );
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

  // emit each found behavior artifact (wish, vision, criteria, blueprint)
  const artifacts = getAllBehaviorContextArtifacts({ behaviorDir });
  for (const artifact of artifacts) {
    outputBehaviorFile(artifact.scope, artifact.path, artifact.required);
  }

  console.log('==================================================');
};
