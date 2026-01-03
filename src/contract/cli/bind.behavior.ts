/**
 * .what = bind, unbind, or query branch-to-behavior bound
 *
 * .why  = explicit user control over which behavior applies to current branch
 *
 * usage:
 *   bind.behavior.sh set --behavior <name>   bind current branch
 *   bind.behavior.sh del                     unbind current branch
 *   bind.behavior.sh get                     query current bound
 *
 * guarantee:
 *   - fail-fast if behavior not found or ambiguous
 *   - fail-fast if set to different behavior (suggest del or worktree)
 *   - idempotent: set to same behavior succeeds, del when unbound succeeds
 */

import { basename } from 'path';
import { z } from 'zod';

import { getBehaviorDir } from '@src/domain.operations/behavior';
import {
  delBranchBehaviorBound,
  getBoundBehaviorByBranch,
  getCurrentBranch,
  setBranchBehaviorBound,
} from '@src/domain.operations/behavior/bind';
import { getCliArgs } from '@src/infra/cli';

// ────────────────────────────────────────────────────────────────────
// schema
// ────────────────────────────────────────────────────────────────────

const schemaOfArgs = z.object({
  named: z.object({
    behavior: z.string().optional(),
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

  if (!action) {
    console.error('error: no action specified');
    console.error('usage: bind.behavior.sh <set|get|del> [--behavior <name>]');
    process.exit(1);
  }

  if (!['set', 'get', 'del'].includes(action)) {
    console.error(`error: unknown action '${action}'`);
    console.error('usage: bind.behavior.sh <set|get|del> [--behavior <name>]');
    process.exit(1);
  }

  const branchName = getCurrentBranch();

  // dispatch
  if (action === 'get') {
    const result = getBoundBehaviorByBranch({ branchName });
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

    const behaviorDir = getBehaviorDir({ name: behaviorName });

    const result = setBranchBehaviorBound({
      branchName,
      behaviorDir,
    });

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
    const result = delBranchBehaviorBound({ branchName });
    console.log(`✓ ${result.message}`);
  }
};
