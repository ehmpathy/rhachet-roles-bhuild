import { execSync } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';

export interface TestGitRepo {
  repoDir: string;
  cleanup: () => void;
}

/**
 * .what = creates a minimal git repo for testing
 * .why  = centralizes git repo setup to avoid duplication and ensure
 *         consistent configuration (e.g., -b main to suppress git 3.0 warnings)
 */
export const genTestGitRepo = (input?: {
  prefix?: string;
  branchName?: string;
  copyFrom?: string; // copy fixture contents before git init
  commitGlob?: string; // what to commit initially (defaults to '.')
}): TestGitRepo => {
  const prefix = input?.prefix ?? 'test-git-repo-';
  const repoDir = fs.mkdtempSync(path.join(os.tmpdir(), prefix));

  // copy fixture contents if provided
  if (input?.copyFrom) {
    execSync(`cp -a ${input.copyFrom}/. ${repoDir}/`);
  } else {
    // create default README for initial commit
    fs.writeFileSync(path.join(repoDir, 'README.md'), '# Test');
  }

  // init git repo with main branch to suppress git 3.0 warning
  execSync('git init -b main', { cwd: repoDir });
  execSync('git config user.email "test@test.com"', { cwd: repoDir });
  execSync('git config user.name "Test"', { cwd: repoDir });

  // create initial commit (required for branch operations)
  const commitGlob = input?.commitGlob ?? '.';
  execSync(`git add ${commitGlob}`, { cwd: repoDir });
  execSync('git commit -m "initial"', { cwd: repoDir });

  // checkout requested branch if different from main
  if (input?.branchName && input.branchName !== 'main') {
    execSync(`git checkout -b "${input.branchName}"`, { cwd: repoDir });
  }

  return {
    repoDir,
    cleanup: () => fs.rmSync(repoDir, { recursive: true, force: true }),
  };
};
