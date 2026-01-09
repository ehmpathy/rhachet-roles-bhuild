import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { given, then, useBeforeAll, when } from 'test-fns';

import { genTestGitRepo } from '../../../../blackbox/.test/infra';

const CLEANUP_SCRIPT = path.join(
  process.cwd(),
  'dist/domain.roles/behaver/inits/init.claude.hooks.cleanup.sh',
);
const ASSETS = path.join(__dirname, '.test/assets');

/**
 * .what = run the cleanup script against a test repo
 * .why = test the stale hook removal logic
 */
const runCleanup = (input: { repoDir: string }): string => {
  try {
    return execSync(`bash ${CLEANUP_SCRIPT}`, {
      cwd: input.repoDir,
      encoding: 'utf-8',
    });
  } catch (error: unknown) {
    if (error instanceof Error && 'stdout' in error) {
      return (error as { stdout: string }).stdout;
    }
    throw error;
  }
};

describe('init.claude.hooks.cleanup', () => {
  given('[case1] settings.json does not exist', () => {
    const testRepo = useBeforeAll(async () =>
      genTestGitRepo({ prefix: 'cleanup-no-settings-' }),
    );

    afterAll(() => testRepo.cleanup());

    when('[t0] cleanup is called', () => {
      then('exits without error', () => {
        const output = runCleanup({ repoDir: testRepo.repoDir });
        // should exit cleanly with no output (exit 0)
        expect(output).toBe('');
      });
    });
  });

  given('[case2] settings.json has no stale hooks', () => {
    const testRepo = useBeforeAll(async () => {
      const repo = genTestGitRepo({
        prefix: 'cleanup-no-stale-',
        copyFrom: path.join(ASSETS, 'repo-empty-hooks'),
      });
      return repo;
    });

    afterAll(() => testRepo.cleanup());

    when('[t0] cleanup is called', () => {
      then('reports no stale hooks', () => {
        const output = runCleanup({ repoDir: testRepo.repoDir });
        expect(output).toContain('no stale hooks in settings.json');
      });
    });
  });

  given('[case3] settings.json has stale hook with deprecated pattern', () => {
    const testRepo = useBeforeAll(async () => {
      const repo = genTestGitRepo({
        prefix: 'cleanup-stale-ours-',
        copyFrom: path.join(ASSETS, 'repo-stale-hook-ours'),
      });
      return repo;
    });

    afterAll(() => testRepo.cleanup());

    when('[t0] cleanup is called', () => {
      const result = useBeforeAll(async () => {
        const output = runCleanup({ repoDir: testRepo.repoDir });
        const settingsPath = path.join(
          testRepo.repoDir,
          '.claude',
          'settings.json',
        );
        const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
        return { output, settings };
      });

      then('reports stale hooks removed', () => {
        expect(result.output).toContain(
          'remove stale hooks from settings.json',
        );
      });

      then('stale hook is removed from settings.json', () => {
        const sessionStartMatchers = result.settings.hooks?.SessionStart ?? [];
        const hooks = sessionStartMatchers.flatMap(
          (m: { hooks?: { command: string }[] }) => m.hooks ?? [],
        );
        const staleHook = hooks.find((h: { command: string }) =>
          h.command.includes('.agent/repo=bhuild'),
        );
        expect(staleHook).toBeUndefined();
      });
    });
  });

  given('[case4] settings.json has stale hook from other role', () => {
    const testRepo = useBeforeAll(async () => {
      const repo = genTestGitRepo({
        prefix: 'cleanup-stale-other-',
        copyFrom: path.join(ASSETS, 'repo-stale-hook-other-role'),
      });
      return repo;
    });

    afterAll(() => testRepo.cleanup());

    when('[t0] cleanup is called', () => {
      const result = useBeforeAll(async () => {
        const output = runCleanup({ repoDir: testRepo.repoDir });
        const settingsPath = path.join(
          testRepo.repoDir,
          '.claude',
          'settings.json',
        );
        const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
        return { output, settings };
      });

      then('reports no stale hooks (other roles preserved)', () => {
        expect(result.output).toContain('no stale hooks in settings.json');
      });

      then('hook from other role is preserved', () => {
        const sessionStartMatchers = result.settings.hooks?.SessionStart ?? [];
        const hooks = sessionStartMatchers.flatMap(
          (m: { hooks?: { author: string }[] }) => m.hooks ?? [],
        );
        const otherHook = hooks.find(
          (h: { author: string }) => h.author === 'repo=other/role=other',
        );
        expect(otherHook).toBeDefined();
      });
    });
  });

  given('[case5] settings.json has valid hook with rhachet run pattern', () => {
    const testRepo = useBeforeAll(async () => {
      const repo = genTestGitRepo({
        prefix: 'cleanup-valid-rhachet-',
        copyFrom: path.join(ASSETS, 'repo-valid-boot-behavior'),
      });

      // create the rhachet binary so the command is considered valid
      const binDir = path.join(repo.repoDir, 'node_modules', '.bin');
      fs.mkdirSync(binDir, { recursive: true });
      fs.writeFileSync(path.join(binDir, 'rhachet'), '#!/bin/bash\necho ok');
      fs.chmodSync(path.join(binDir, 'rhachet'), '755');

      return repo;
    });

    afterAll(() => testRepo.cleanup());

    when('[t0] cleanup is called', () => {
      const result = useBeforeAll(async () => {
        const settingsPathBefore = path.join(
          testRepo.repoDir,
          '.claude',
          'settings.json',
        );
        const settingsBefore = fs.readFileSync(settingsPathBefore, 'utf-8');

        const output = runCleanup({ repoDir: testRepo.repoDir });

        const settingsAfter = fs.readFileSync(settingsPathBefore, 'utf-8');

        return { output, settingsBefore, settingsAfter };
      });

      then('reports no stale hooks', () => {
        expect(result.output).toContain('no stale hooks in settings.json');
      });

      then('settings.json is unchanged', () => {
        expect(result.settingsAfter).toEqual(result.settingsBefore);
      });
    });
  });

  given('[case6] idempotency - cleanup runs twice', () => {
    const testRepo = useBeforeAll(async () => {
      const repo = genTestGitRepo({
        prefix: 'cleanup-idempotent-',
        copyFrom: path.join(ASSETS, 'repo-stale-hook-ours'),
      });
      return repo;
    });

    afterAll(() => testRepo.cleanup());

    when('[t0] cleanup is called twice', () => {
      const result = useBeforeAll(async () => {
        // first run removes stale hooks
        const output1 = runCleanup({ repoDir: testRepo.repoDir });
        const settingsPath = path.join(
          testRepo.repoDir,
          '.claude',
          'settings.json',
        );
        const settingsAfter1 = fs.readFileSync(settingsPath, 'utf-8');

        // second run should be no-op
        const output2 = runCleanup({ repoDir: testRepo.repoDir });
        const settingsAfter2 = fs.readFileSync(settingsPath, 'utf-8');

        return { output1, output2, settingsAfter1, settingsAfter2 };
      });

      then('first run removes stale hooks', () => {
        expect(result.output1).toContain(
          'remove stale hooks from settings.json',
        );
      });

      then('second run reports no stale hooks', () => {
        expect(result.output2).toContain('no stale hooks in settings.json');
      });

      then('settings.json unchanged after second run', () => {
        expect(result.settingsAfter2).toEqual(result.settingsAfter1);
      });
    });
  });

  // localgrain tests (settings.local.json cleanup)

  given('[case7] settings.local.json does not exist', () => {
    const testRepo = useBeforeAll(async () =>
      genTestGitRepo({ prefix: 'cleanup-localgrain-no-file-' }),
    );

    afterAll(() => testRepo.cleanup());

    when('[t0] cleanup is called', () => {
      then('exits without error', () => {
        const output = runCleanup({ repoDir: testRepo.repoDir });
        // localgrain should exit silently if no settings.local.json
        expect(output).not.toContain('settings.local.json');
      });
    });
  });

  given('[case8] settings.local.json has no behaver hooks', () => {
    const testRepo = useBeforeAll(async () => {
      const repo = genTestGitRepo({
        prefix: 'cleanup-localgrain-no-behaver-',
        copyFrom: path.join(ASSETS, 'repo-localgrain-no-hooks'),
      });
      return repo;
    });

    afterAll(() => testRepo.cleanup());

    when('[t0] cleanup is called', () => {
      then('reports no behaver hooks in settings.local.json', () => {
        const output = runCleanup({ repoDir: testRepo.repoDir });
        expect(output).toContain('no behaver hooks in settings.local.json');
      });
    });
  });

  given('[case9] settings.local.json has behaver hooks', () => {
    const testRepo = useBeforeAll(async () => {
      const repo = genTestGitRepo({
        prefix: 'cleanup-localgrain-behaver-',
        copyFrom: path.join(ASSETS, 'repo-localgrain-behaver-hooks'),
      });
      return repo;
    });

    afterAll(() => testRepo.cleanup());

    when('[t0] cleanup is called', () => {
      const result = useBeforeAll(async () => {
        const output = runCleanup({ repoDir: testRepo.repoDir });
        const settingsPath = path.join(
          testRepo.repoDir,
          '.claude',
          'settings.local.json',
        );
        const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
        return { output, settings };
      });

      then('reports behaver hooks removed', () => {
        expect(result.output).toContain(
          'remove role=behaver hooks from settings.local.json',
        );
      });

      then('behaver hook is removed from settings.local.json', () => {
        const sessionStartMatchers = result.settings.hooks?.SessionStart ?? [];
        const hooks = sessionStartMatchers.flatMap(
          (m: { hooks?: { author: string }[] }) => m.hooks ?? [],
        );
        const behaverHook = hooks.find(
          (h: { author: string }) => h.author === 'repo=bhuild/role=behaver',
        );
        expect(behaverHook).toBeUndefined();
      });
    });
  });

  given('[case10] settings.local.json has hooks from other roles', () => {
    const testRepo = useBeforeAll(async () => {
      const repo = genTestGitRepo({
        prefix: 'cleanup-localgrain-other-',
        copyFrom: path.join(ASSETS, 'repo-localgrain-other-hooks'),
      });
      return repo;
    });

    afterAll(() => testRepo.cleanup());

    when('[t0] cleanup is called', () => {
      const result = useBeforeAll(async () => {
        const output = runCleanup({ repoDir: testRepo.repoDir });
        const settingsPath = path.join(
          testRepo.repoDir,
          '.claude',
          'settings.local.json',
        );
        const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
        return { output, settings };
      });

      then('reports no behaver hooks', () => {
        expect(result.output).toContain(
          'no behaver hooks in settings.local.json',
        );
      });

      then('hooks from other roles are preserved', () => {
        const sessionStartMatchers = result.settings.hooks?.SessionStart ?? [];
        const hooks = sessionStartMatchers.flatMap(
          (m: { hooks?: { author: string }[] }) => m.hooks ?? [],
        );
        const otherHook = hooks.find(
          (h: { author: string }) => h.author === 'repo=other/role=other',
        );
        expect(otherHook).toBeDefined();
      });
    });
  });
});
