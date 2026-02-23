import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

import { genTempDir } from 'test-fns';

/**
 * .what = creates a temporary git repo that simulates a consumer repo
 * .why  = tests portability when package is consumed as a dependency
 *
 * sets up:
 *   - git repo with initial commit
 *   - package.json
 *   - node_modules (symlinked from root for speed)
 *   - rhachet.use.ts that references the package
 */
export const genConsumerRepo = (input?: {
  prefix?: string;
  withClaudeDir?: boolean;
  branchName?: string;
}): { repoDir: string } => {
  // create temp dir with git and node_modules symlink
  const repoDir = genTempDir({
    slug: input?.prefix ?? 'consumer-test',
    git: true,
    symlink: [{ at: 'node_modules', to: 'node_modules' }],
  });

  // create .claude directory if requested
  if (input?.withClaudeDir) {
    fs.mkdirSync(path.join(repoDir, '.claude'));
    fs.writeFileSync(
      path.join(repoDir, '.claude', 'settings.json'),
      JSON.stringify({ hooks: {} }, null, 2),
    );
  }

  // create package.json with rhachet-brains-anthropic for brain hooks adapter discovery
  // (init --hooks scans package.json for rhachet-brains-* packages)
  fs.writeFileSync(
    path.join(repoDir, 'package.json'),
    JSON.stringify(
      {
        name: 'test-consumer',
        version: '1.0.0',
        dependencies: {
          'rhachet-brains-anthropic': '*',
        },
      },
      null,
      2,
    ),
  );

  // create rhachet.use.ts (must exist before roles link)
  const rhachetUseContent = `
import type { InvokeHooks, RoleRegistry } from 'rhachet';
import { getRoleRegistry as getRoleRegistryBhuild, getInvokeHooks as getInvokeHooksBhuild } from 'rhachet-roles-bhuild';
import { getRoleRegistry as getRoleRegistryBhrain } from 'rhachet-roles-bhrain';

export const getRoleRegistries = (): RoleRegistry[] => [getRoleRegistryBhuild(), getRoleRegistryBhrain()];
export const getInvokeHooks = (): InvokeHooks[] => [getInvokeHooksBhuild()];
`.trim();
  fs.writeFileSync(path.join(repoDir, 'rhachet.use.ts'), rhachetUseContent);

  // checkout requested branch if different from main
  if (input?.branchName && input.branchName !== 'main') {
    execSync(`git checkout -b "${input.branchName}"`, { cwd: repoDir });
  }

  // link roles so skills are available
  execSync('npx rhachet roles link --repo bhuild --role behaver', {
    cwd: repoDir,
    stdio: 'pipe',
  });
  execSync('npx rhachet roles link --repo bhuild --role decomposer', {
    cwd: repoDir,
    stdio: 'pipe',
  });
  execSync('npx rhachet roles link --repo bhuild --role dispatcher', {
    cwd: repoDir,
    stdio: 'pipe',
  });
  execSync('npx rhachet roles link --repo bhrain --role driver', {
    cwd: repoDir,
    stdio: 'pipe',
  });

  return { repoDir };
};
