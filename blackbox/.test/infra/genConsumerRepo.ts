import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

import { genTestGitRepo } from './genTestGitRepo';

export interface ConsumerRepo {
  repoDir: string;
  cleanup: () => void;
}

/**
 * .what = creates a temporary git repo simulating a consumer repo
 * .why  = tests portability when package is consumed as a dependency
 *
 * sets up:
 *   - git repo with initial commit
 *   - package.json
 *   - node_modules/rhachet-roles-bhuild (copied from dist)
 *   - rhachet.use.ts referencing the package
 */
export const genConsumerRepo = (input?: {
  prefix?: string;
  withClaudeDir?: boolean;
}): ConsumerRepo => {
  // create base git repo
  const { repoDir, cleanup } = genTestGitRepo({
    prefix: input?.prefix ?? 'consumer-test-',
  });

  // create .claude directory if requested
  if (input?.withClaudeDir) {
    fs.mkdirSync(path.join(repoDir, '.claude'));
    fs.writeFileSync(
      path.join(repoDir, '.claude', 'settings.json'),
      JSON.stringify({ hooks: {} }, null, 2),
    );
  }

  // create package.json
  fs.writeFileSync(
    path.join(repoDir, 'package.json'),
    JSON.stringify(
      {
        name: 'test-consumer',
        version: '1.0.0',
        dependencies: {},
      },
      null,
      2,
    ),
  );

  // add rhachet-roles-bhuild as file dependency (points to current project)
  // also add rhachet-brains-anthropic for brain adapter discovery (hooks require brain adapters)
  const packageJsonPath = path.join(repoDir, 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
  packageJson.dependencies = {
    ...packageJson.dependencies,
    'rhachet-roles-bhuild': `file:${process.cwd()}`,
    rhachet: '^1.15.0',
    'rhachet-brains-anthropic': '^0.2.0',
  };
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));

  // install dependencies (use npx to ensure pnpm is available)
  execSync('npx pnpm install --ignore-scripts', {
    cwd: repoDir,
    stdio: 'pipe',
  });

  // create rhachet.use.ts (must exist before roles link)
  const rhachetUseContent = `
import type { InvokeHooks, RoleRegistry } from 'rhachet';
import { getRoleRegistry as getRoleRegistryBhuild, getInvokeHooks as getInvokeHooksBhuild } from 'rhachet-roles-bhuild';

export const getRoleRegistries = (): RoleRegistry[] => [getRoleRegistryBhuild()];
export const getInvokeHooks = (): InvokeHooks[] => [getInvokeHooksBhuild()];
`.trim();
  fs.writeFileSync(path.join(repoDir, 'rhachet.use.ts'), rhachetUseContent);

  // link roles so skills are available
  execSync('npx rhachet roles link --repo bhuild --role behaver', {
    cwd: repoDir,
    stdio: 'pipe',
  });
  execSync('npx rhachet roles link --repo bhuild --role decomposer', {
    cwd: repoDir,
    stdio: 'pipe',
  });

  return { repoDir, cleanup };
};
