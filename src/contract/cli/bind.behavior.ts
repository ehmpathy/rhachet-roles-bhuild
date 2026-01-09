/**
 * .what = bind, unbind, or query branch-to-behavior bound
 * .how  = TypeScript implementation for bind.behavior.sh skill
 *
 * see src/domain.roles/behaver/skills/bind.behavior.sh for full documentation
 */

import { basename } from 'path';
import { z } from 'zod';

import { getBehaviorDir } from '@src/domain.operations/behavior';
import {
  delBranchBehaviorBind,
  getBranchBehaviorBind,
  getCurrentBranch,
  setBranchBehaviorBind,
} from '@src/domain.operations/behavior/bind';
import { getCliArgs } from '@src/infra/cli';

// ────────────────────────────────────────────────────────────────────
// schema
// ────────────────────────────────────────────────────────────────────

const schemaOfArgs = z.object({
  named: z.object({
    // skill-specific args
    behavior: z.string().optional(),
    dir: z.string().optional(),
    // rhachet passthrough args (optional, ignored)
    repo: z.string().optional(),
    role: z.string().optional(),
    skill: z.string().optional(),
    s: z.string().optional(),
  }),
  ordered: z.array(z.string()).default([]),
});

// ────────────────────────────────────────────────────────────────────
// exported CLI entry point
// ────────────────────────────────────────────────────────────────────

export const bindBehavior = (): void => {
  const { named, ordered } = getCliArgs({ schema: schemaOfArgs });

  // action is first ordered arg
  const action = ordered[0];
  const cwd = named.dir ?? process.cwd();

  if (!action) {
    console.error('error: no action specified');
    console.error(
      'usage: bind.behavior.sh <set|get|del> [--behavior <name>] [--dir <path>]',
    );
    process.exit(1);
  }

  if (!['set', 'get', 'del'].includes(action)) {
    console.error(`error: unknown action '${action}'`);
    console.error(
      'usage: bind.behavior.sh <set|get|del> [--behavior <name>] [--dir <path>]',
    );
    process.exit(1);
  }

  const context = { cwd };
  const branchName = getCurrentBranch({}, context);

  // dispatch
  if (action === 'get') {
    const result = getBranchBehaviorBind({ branchName }, context);
    if (!result.behaviorDir) {
      console.log('not bound');
    } else {
      console.log(`bound to: ${basename(result.behaviorDir)}`);
    }
  } else if (action === 'set') {
    const behaviorName = named.behavior;
    if (!behaviorName) {
      console.error('error: --behavior is required with set');
      process.exit(1);
    }

    const behaviorDir = getBehaviorDir({ name: behaviorName, targetDir: cwd });

    const result = setBranchBehaviorBind({ branchName, behaviorDir }, context);

    if (!result.success) {
      console.error(`error: ${result.message}`);
      console.error('');
      console.error('to rebind, first unbind with:');
      console.error('  bind.behavior.sh del');
      console.error('');
      console.error('or use a new worktree for the new behavior:');
      console.error('  git worktree add ../<new-branch> -b <new-branch>');
      process.exit(1);
    }

    console.log(`✓ ${result.message}`);
  } else if (action === 'del') {
    const result = delBranchBehaviorBind({ branchName }, context);
    console.log(`✓ ${result.message}`);
  }
};
