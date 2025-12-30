import { execSync } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { given, then, when } from 'test-fns';

/**
 * .what = creates a temporary git repo with sample behaviors for testing
 * .why  = dispatcher skills require a git repo with behaviors to process
 */
const createTestRepo = (): { repoDir: string; cleanup: () => void } => {
  // create temp directory
  const repoDir = fs.mkdtempSync(
    path.join(os.tmpdir(), 'roles-init-dispatcher-test-'),
  );

  // init git repo
  execSync('git init', { cwd: repoDir });
  execSync('git config user.email "test@test.com"', { cwd: repoDir });
  execSync('git config user.name "Test"', { cwd: repoDir });

  // create initial commit (required for branch operations)
  fs.writeFileSync(path.join(repoDir, 'README.md'), '# Test');
  execSync('git add .', { cwd: repoDir });
  execSync('git commit -m "initial"', { cwd: repoDir });

  // create .claude directory
  fs.mkdirSync(path.join(repoDir, '.claude'));
  fs.writeFileSync(
    path.join(repoDir, '.claude', 'settings.json'),
    JSON.stringify({ hooks: {} }, null, 2),
  );

  // create sample behavior directory
  const behaviorDir = path.join(repoDir, '.behavior', 'v2025_01_01.sample');
  fs.mkdirSync(behaviorDir, { recursive: true });

  // create behavior files
  fs.writeFileSync(
    path.join(behaviorDir, '0.wish.md'),
    '# wish\n\nadd sample feature',
  );
  fs.writeFileSync(
    path.join(behaviorDir, '1.vision.md'),
    '# vision\n\na sample feature is available',
  );
  fs.writeFileSync(
    path.join(behaviorDir, '2.criteria.md'),
    `# criteria

given('sample feature')
  when('used')
    then('works correctly')
`,
  );

  // commit behaviors
  execSync('git add .', { cwd: repoDir });
  execSync('git commit -m "add sample behavior"', { cwd: repoDir });

  // create dispatch config
  const dispatchConfig = `
sources:
  local:
    - path: .behavior

output: .dispatch

constraints:
  maxConcurrency: 3
`;
  fs.writeFileSync(
    path.join(repoDir, 'rhachet.dispatch.yml'),
    dispatchConfig.trim(),
  );

  // create rhachet.use.ts that references the built dist
  const distPath = path.join(process.cwd(), 'dist', 'index.js');
  const rhachetUseContent = `
import type { InvokeHooks, RoleRegistry } from 'rhachet';
import { getRoleRegistry as getRoleRegistryBhuild, getInvokeHooks as getInvokeHooksBhuild } from '${distPath}';

export const getRoleRegistries = (): RoleRegistry[] => [getRoleRegistryBhuild()];
export const getInvokeHooks = (): InvokeHooks[] => [getInvokeHooksBhuild()];
`.trim();
  fs.writeFileSync(path.join(repoDir, 'rhachet.use.ts'), rhachetUseContent);

  return {
    repoDir,
    cleanup: () => fs.rmSync(repoDir, { recursive: true, force: true }),
  };
};

/**
 * .what = runs npx rhachet roles init with given args
 * .why  = centralizes CLI execution for tests
 */
const runRolesInit = (input: {
  role: string;
  targetDir: string;
}): { stdout: string; stderr: string; exitCode: number } => {
  try {
    const stdout = execSync(`npx rhachet roles init --role ${input.role}`, {
      cwd: input.targetDir,
      encoding: 'utf-8',
      env: {
        ...process.env,
        PATH: process.env.PATH,
      },
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    return { stdout: stdout.trim(), stderr: '', exitCode: 0 };
  } catch (error: unknown) {
    const execError = error as {
      stdout?: Buffer | string;
      stderr?: Buffer | string;
      status?: number;
    };
    const stdout = (execError.stdout ?? '').toString().trim();
    const stderr = (execError.stderr ?? '').toString().trim();

    if (stderr) console.error('stderr:', stderr);
    if (stdout) console.log('stdout:', stdout);

    return {
      stdout,
      stderr,
      exitCode: execError.status ?? 1,
    };
  }
};

describe('npx rhachet roles init --role dispatcher', () => {
  given('[case1] fresh repo with behaviors', () => {
    when('[t0] roles init --role dispatcher is executed', () => {
      let testRepo: { repoDir: string; cleanup: () => void };

      beforeAll(() => {
        testRepo = createTestRepo();
      });

      afterAll(() => {
        testRepo.cleanup();
      });

      then('exits with code 0', () => {
        const result = runRolesInit({
          role: 'dispatcher',
          targetDir: testRepo.repoDir,
        });

        expect(result.exitCode).toBe(0);
      });
    });

    when('[t1] roles init --role dispatcher is executed twice', () => {
      let testRepo: { repoDir: string; cleanup: () => void };

      beforeAll(() => {
        testRepo = createTestRepo();
      });

      afterAll(() => {
        testRepo.cleanup();
      });

      then('is idempotent - second run also succeeds', () => {
        // first run
        const firstResult = runRolesInit({
          role: 'dispatcher',
          targetDir: testRepo.repoDir,
        });
        expect(firstResult.exitCode).toBe(0);

        // second run should also succeed (idempotent)
        const secondResult = runRolesInit({
          role: 'dispatcher',
          targetDir: testRepo.repoDir,
        });
        expect(secondResult.exitCode).toBe(0);
      });
    });
  });
});
