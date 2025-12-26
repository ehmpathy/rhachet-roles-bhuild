import { execSync } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { given, then, when } from 'test-fns';

/**
 * .what = creates a temporary git repo for testing roles init
 * .why  = roles init requires a git repo context
 */
const createTestRepo = (): { repoDir: string; cleanup: () => void } => {
  // create temp directory
  const repoDir = fs.mkdtempSync(
    path.join(os.tmpdir(), 'roles-init-behaver-test-'),
  );

  // init git repo
  execSync('git init', { cwd: repoDir });
  execSync('git config user.email "test@test.com"', { cwd: repoDir });
  execSync('git config user.name "Test"', { cwd: repoDir });

  // create initial commit (required for branch operations)
  fs.writeFileSync(path.join(repoDir, 'README.md'), '# Test');
  execSync('git add .', { cwd: repoDir });
  execSync('git commit -m "initial"', { cwd: repoDir });

  // create .claude directory (expected by init.claude.hooks.sh)
  fs.mkdirSync(path.join(repoDir, '.claude'));
  fs.writeFileSync(
    path.join(repoDir, '.claude', 'settings.json'),
    JSON.stringify({ hooks: {} }, null, 2),
  );

  // create rhachet.use.ts that references the built dist from the main project
  // only include our local role registry (bhuild) for testing
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
 *
 * .note = runs from the test repo dir where rhachet.use.ts is configured
 *         to reference the main project's built dist
 */
const runRolesInit = (input: {
  role: string;
  targetDir: string;
}): { stdout: string; stderr: string; exitCode: number } => {
  try {
    // run from the target directory where rhachet.use.ts is set up
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

    // log for debugging
    if (stderr) console.error('stderr:', stderr);
    if (stdout) console.log('stdout:', stdout);

    return {
      stdout,
      stderr,
      exitCode: execError.status ?? 1,
    };
  }
};

describe('npx rhachet roles init --role behaver', () => {
  given('[case1] fresh repo without behaver initialization', () => {
    when('[t0] roles init --role behaver is executed', () => {
      let testRepo: { repoDir: string; cleanup: () => void };

      beforeAll(() => {
        testRepo = createTestRepo();
      });

      afterAll(() => {
        testRepo.cleanup();
      });

      then('exits with code 0', () => {
        const result = runRolesInit({
          role: 'behaver',
          targetDir: testRepo.repoDir,
        });

        expect(result.exitCode).toBe(0);
      });

      then('initializes claude hooks for behaver', () => {
        runRolesInit({
          role: 'behaver',
          targetDir: testRepo.repoDir,
        });

        // verify the hooks were installed to settings.local.json
        const settingsPath = path.join(
          testRepo.repoDir,
          '.claude',
          'settings.local.json',
        );
        expect(fs.existsSync(settingsPath)).toBe(true);

        const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));

        // verify SessionStart hook was added for boot-behavior
        expect(settings.hooks).toBeDefined();
        expect(settings.hooks.SessionStart).toBeDefined();

        // hooks are structured as: { matcher: "*", hooks: [{ command: "...", ... }] }
        const sessionStartMatchers = settings.hooks.SessionStart;
        const matcherWithBootBehavior = sessionStartMatchers.find(
          (entry: { matcher: string; hooks: Array<{ command: string }> }) =>
            entry.hooks?.some((hook) =>
              hook.command.includes('sessionstart.boot-behavior'),
            ),
        );
        expect(matcherWithBootBehavior).toBeDefined();
      });
    });

    when('[t1] roles init --role behaver is executed twice', () => {
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
          role: 'behaver',
          targetDir: testRepo.repoDir,
        });
        expect(firstResult.exitCode).toBe(0);

        // second run should also succeed (idempotent)
        const secondResult = runRolesInit({
          role: 'behaver',
          targetDir: testRepo.repoDir,
        });
        expect(secondResult.exitCode).toBe(0);
      });
    });
  });
});
