/**
 * .what = initialize a .behavior directory for bhuild thoughtroute
 * .how  = TypeScript implementation for init.behavior.sh skill
 *
 * see src/domain.roles/behaver/skills/init.behavior.sh for full documentation
 */

import { ConstraintError } from 'helpful-errors';
import { basename, join, resolve } from 'path';
import { setRouteBind } from 'rhachet-roles-bhrain/sdk/route';
import { z } from 'zod';

import {
  getBranchBehaviorBind,
  getCurrentBranch,
  setBranchBehaviorBind,
} from '@src/domain.operations/behavior/bind';
import { findBehaviorByExactName } from '@src/domain.operations/behavior/findBehaviorByExactName';
import {
  computeOutputTree,
  initBehaviorDir,
} from '@src/domain.operations/behavior/init';
import { asBehaviorTargetDir } from '@src/domain.operations/behavior/init/asBehaviorTargetDir';
import { asCleanRelativePath } from '@src/domain.operations/behavior/init/asCleanRelativePath';
import { asDatedBehaviorDir } from '@src/domain.operations/behavior/init/asDatedBehaviorDir';
import { findsertWishFromInput } from '@src/domain.operations/behavior/init/findsertWishFromInput';
import { getWishContent } from '@src/domain.operations/behavior/init/getWishContent';
import { expandBehaviorName } from '@src/domain.operations/behavior/name/expandBehaviorName';
import { computeFooterOutput } from '@src/domain.operations/behavior/render/computeFooterOutput';
import { getCliArgs } from '@src/infra/cli';
import { OpenerUnavailableError } from '@src/infra/shell/OpenerUnavailableError';
import { openFileWithOpener } from '@src/infra/shell/openFileWithOpener';

// ────────────────────────────────────────────────────────────────────
// schema
// ────────────────────────────────────────────────────────────────────

const schemaOfArgs = z.object({
  named: z.object({
    // skill-specific args
    name: z.string(),
    dir: z.string().optional(),
    open: z.string().optional(),
    size: z.enum(['nano', 'mini', 'medi', 'mega', 'giga']).optional(),
    guard: z.enum(['light', 'heavy']).optional(),
    wish: z.string().optional(),
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

export const initBehavior = async (): Promise<void> => {
  const { named } = getCliArgs({ schema: schemaOfArgs });
  const context = { cwd: process.cwd() };
  const targetDirRaw = named.dir ?? '.';

  // validate --open has a value if provided
  if (named.open !== undefined && named.open.trim() === '')
    throw new ConstraintError('--open requires an editor name', {
      hint: 'specify what editor to open with: --open codium, --open vim, --open zed, --open code',
    });

  // get current branch
  const currentBranch = getCurrentBranch({}, context);

  // expand @branch token to behavior name
  const behaviorName = expandBehaviorName({
    name: named.name,
    branch: currentBranch,
  });

  // trim .behavior suffix from target dir if present
  const targetDir = asBehaviorTargetDir({ targetDirRaw });

  // check for extant behavior with same name (different date)
  const behaviorFound = findBehaviorByExactName(
    { name: behaviorName, targetDir },
    context,
  );

  // reuse extant behavior or create new with today's date
  const behaviorDir =
    behaviorFound ?? asDatedBehaviorDir({ targetDir, behaviorName });

  // remove prefix ./ for display and route bind
  const behaviorDirRel = asCleanRelativePath({ path: behaviorDir });

  // check if branch already bound (must be after behaviorDir is computed)
  const bindResult = getBranchBehaviorBind(
    {
      branchName: currentBranch,
      targetDir,
    },
    context,
  );
  // compare absolute paths to handle relative vs absolute format differences
  const behaviorDirAbs = resolve(context.cwd, behaviorDir);
  if (bindResult.behaviorDir && bindResult.behaviorDir !== behaviorDirAbs)
    throw new ConstraintError(
      `branch '${currentBranch}' is already bound to: ${basename(bindResult.behaviorDir)}`,
      {
        hint: 'to create a new behavior, use a new tree: git tree set --from main --open <branch-name-new>',
        currentBranch,
        boundTo: bindResult.behaviorDir,
        attempted: behaviorDirAbs,
      },
    );

  // initialize behavior directory with template files
  const result = initBehaviorDir({
    behaviorDir,
    behaviorDirRel,
    size: named.size,
    guard: named.guard,
  });

  // compute wish file path
  const wishPath = join(behaviorDir, '0.wish.md');

  // if --wish provided, findsert content into wish file
  if (named.wish !== undefined) {
    const wishInput = getWishContent({ wish: named.wish });
    findsertWishFromInput({ wishInput, wishPath });
  }

  // render tree-style output
  const treeOutput = computeOutputTree({
    created: result.created,
    kept: result.kept,
    updated: [],
  });
  console.log(treeOutput);

  // compute relative path to wish file
  const wishPathRel = `${behaviorDirRel}/0.wish.md`;

  // try opener if --open is provided (before footer render)
  // .note = graceful degradation: behavior init succeeds even if opener fails
  let openerUsed: string | undefined;
  if (named.open) {
    try {
      openFileWithOpener({ opener: named.open, filePath: wishPathRel });
      openerUsed = named.open;
    } catch (error) {
      if (error instanceof OpenerUnavailableError) {
        // log to stderr: opener failed but behavior init succeeded
        console.error('');
        console.error(`⚠️  ${error.message}`);
        console.error(`    behavior created, open manually: ${wishPathRel}`);
      } else {
        throw error;
      }
    }
  }

  // render footer with wish path (and opener if successful)
  console.log('');
  const footerOutput = computeFooterOutput({ wishPathRel, opener: openerUsed });
  console.log(footerOutput);

  // auto-bind: bind current branch to newly created behavior (behaver hooks)
  setBranchBehaviorBind(
    {
      branchName: currentBranch,
      behaviorDir,
      boundBy: 'init.behavior skill',
      targetDir,
    },
    context,
  );

  // auto-bind: bind route for bhrain driver
  await setRouteBind({ route: behaviorDirRel });

  // log branch bind confirmation
  const dim = '\x1b[2m';
  const reset = '\x1b[0m';
  console.log('');
  console.log(`🍄 we'll remember,`);
  console.log(
    `   ├─ branch ${currentBranch} <-> behavior ${basename(behaviorDir)}`,
  );
  console.log(
    `   ├─ ${dim}branch bound to behavior, to boot via hooks${reset}`,
  );
  console.log(`   └─ ${dim}branch bound to route, to drive via hooks${reset}`);
};
