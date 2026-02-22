/**
 * .what = initialize a .behavior directory for bhuild thoughtroute
 * .how  = TypeScript implementation for init.behavior.sh skill
 *
 * see src/domain.roles/behaver/skills/init.behavior.sh for full documentation
 */

import { spawnSync } from 'child_process';
import { basename, join, relative } from 'path';
import { z } from 'zod';

import {
  getBranchBehaviorBind,
  getCurrentBranch,
  setBranchBehaviorBind,
} from '@src/domain.operations/behavior/bind';
import {
  computeOutputTree,
  initBehaviorDir,
} from '@src/domain.operations/behavior/init';
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

export const initBehavior = (): void => {
  const { named } = getCliArgs({ schema: schemaOfArgs });
  const behaviorName = named.name;
  const rawTargetDir = named.dir ?? process.cwd();
  const context = { cwd: rawTargetDir };

  // validate --open has a value if provided
  if (named.open !== undefined && named.open.trim() === '') {
    console.error('⛈️  error: --open requires an editor name');
    console.error('');
    console.error('please specify what editor to open with. for example:');
    console.error('  --open codium');
    console.error('  --open vim');
    console.error('  --open zed');
    console.error('  --open code');
    process.exit(1);
  }

  // get current branch
  const currentBranch = getCurrentBranch({}, context);

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

  // check if branch already bound (must be after behaviorDir is computed)
  const bindResult = getBranchBehaviorBind(
    { branchName: currentBranch },
    context,
  );
  if (bindResult.behaviorDir && bindResult.behaviorDir !== behaviorDir) {
    console.error(
      `⛈️  error: branch '${currentBranch}' is already bound to: ${basename(bindResult.behaviorDir)}`,
    );
    console.error('');
    console.error('to create a new behavior, use a new tree:');
    console.error('  git tree set --from main --open <branch-name-new>');
    process.exit(1);
  }

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
  let openerUsed: string | undefined;
  if (named.open) {
    try {
      openFileWithOpener({ opener: named.open, filePath: wishPathRel });
      openerUsed = named.open;
    } catch (error) {
      if (error instanceof OpenerUnavailableError) {
        console.log('');
        console.log(`⚠️  ${error.message}`);
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
    { branchName: currentBranch, behaviorDir, boundBy: 'init.behavior skill' },
    context,
  );

  // auto-bind: bind route for bhrain driver (fail fast if fails)
  const routeBindResult = spawnSync(
    'npx',
    [
      'rhachet',
      'run',
      '--repo',
      'bhrain',
      '--skill',
      'route.bind.set',
      '--route',
      behaviorDirRel,
    ],
    { cwd: targetDir, stdio: 'inherit' },
  );
  if (routeBindResult.status !== 0) {
    console.error('');
    console.error(
      `⛈️  route.bind.set failed. is rhachet-roles-bhrain installed?`,
    );
    process.exit(routeBindResult.status ?? 1);
  }

  // log branch bind confirmation
  const dim = '\x1b[2m';
  const reset = '\x1b[0m';
  console.log('');
  console.log(`🍄 we'll remember,`);
  console.log(
    `   ├─ branch ${currentBranch} <-> behavior v${isoDate}.${behaviorName}`,
  );
  console.log(
    `   ├─ ${dim}branch bound to behavior, to boot via hooks${reset}`,
  );
  console.log(`   └─ ${dim}branch bound to route, to drive via hooks${reset}`);
};
