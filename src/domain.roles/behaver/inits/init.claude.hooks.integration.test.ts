import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { given, then, useBeforeAll, when } from 'test-fns';

import { genTestGitRepo } from '../../../../blackbox/.test/infra';

const HOOKS_SCRIPT = path.join(
  process.cwd(),
  'dist/domain.roles/behaver/inits/init.claude.hooks.sh',
);
const ASSETS = path.join(__dirname, '.test/assets');

/**
 * .what = run the orchestrator script against a test repo
 * .why = test the full hook bind flow
 */
const runHooksInit = (input: { repoDir: string }): string => {
  try {
    return execSync(`bash ${HOOKS_SCRIPT}`, {
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

describe('init.claude.hooks', () => {
  given('[case1] fresh repo with empty hooks', () => {
    const testRepo = useBeforeAll(async () => {
      const repo = genTestGitRepo({
        prefix: 'hooks-init-fresh-',
        copyFrom: path.join(ASSETS, 'repo-empty-hooks'),
      });

      // create the rhachet binary so the command validation passes
      const binDir = path.join(repo.repoDir, 'node_modules', '.bin');
      fs.mkdirSync(binDir, { recursive: true });
      fs.writeFileSync(path.join(binDir, 'rhachet'), '#!/bin/bash\necho ok');
      fs.chmodSync(path.join(binDir, 'rhachet'), '755');

      return repo;
    });

    afterAll(() => testRepo.cleanup());

    when('[t0] hooks init is executed', () => {
      const result = useBeforeAll(async () => {
        const output = runHooksInit({ repoDir: testRepo.repoDir });
        const settingsPath = path.join(
          testRepo.repoDir,
          '.claude',
          'settings.json',
        );
        const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
        return { output, settings };
      });

      then('reports hooks bound', () => {
        expect(result.output).toContain('bind hooks');
        expect(result.output).toContain('sessionstart.boot-behavior');
      });

      then('settings.json contains sessionstart hook', () => {
        const sessionStartMatchers = result.settings.hooks?.SessionStart ?? [];
        expect(sessionStartMatchers.length).toBeGreaterThan(0);
      });

      then('hook command uses rhachet run --init pattern', () => {
        const sessionStartMatchers = result.settings.hooks?.SessionStart ?? [];
        const hooks = sessionStartMatchers.flatMap(
          (m: { hooks?: { command: string }[] }) => m.hooks ?? [],
        );
        const bootHook = hooks.find((h: { command: string }) =>
          h.command.includes('boot-behavior'),
        );
        expect(bootHook?.command).toContain('rhachet');
        expect(bootHook?.command).toContain('run');
        expect(bootHook?.command).toContain('--init');
      });

      then('hook has correct author', () => {
        const sessionStartMatchers = result.settings.hooks?.SessionStart ?? [];
        const hooks = sessionStartMatchers.flatMap(
          (m: { hooks?: { author: string }[] }) => m.hooks ?? [],
        );
        const bootHook = hooks.find(
          (h: { author: string }) => h.author === 'repo=bhuild/role=behaver',
        );
        expect(bootHook).toBeDefined();
      });
    });
  });

  given('[case2] repo with hooks already bound', () => {
    const testRepo = useBeforeAll(async () => {
      const repo = genTestGitRepo({
        prefix: 'hooks-init-idempotent-',
        copyFrom: path.join(ASSETS, 'repo-valid-boot-behavior'),
      });

      // create the rhachet binary
      const binDir = path.join(repo.repoDir, 'node_modules', '.bin');
      fs.mkdirSync(binDir, { recursive: true });
      fs.writeFileSync(path.join(binDir, 'rhachet'), '#!/bin/bash\necho ok');
      fs.chmodSync(path.join(binDir, 'rhachet'), '755');

      return repo;
    });

    afterAll(() => testRepo.cleanup());

    when('[t0] hooks init is executed twice', () => {
      const result = useBeforeAll(async () => {
        // first run
        const output1 = runHooksInit({ repoDir: testRepo.repoDir });
        const settingsPath = path.join(
          testRepo.repoDir,
          '.claude',
          'settings.json',
        );
        const settingsAfter1 = fs.readFileSync(settingsPath, 'utf-8');

        // second run
        const output2 = runHooksInit({ repoDir: testRepo.repoDir });
        const settingsAfter2 = fs.readFileSync(settingsPath, 'utf-8');

        return { output1, output2, settingsAfter1, settingsAfter2 };
      });

      then('second run reports hooks already bound', () => {
        expect(result.output2).toContain('hooks already bound');
      });

      then('settings.json unchanged after second run', () => {
        // compare parsed JSON to ignore format differences
        const parsed1 = JSON.parse(result.settingsAfter1);
        const parsed2 = JSON.parse(result.settingsAfter2);
        expect(parsed2).toEqual(parsed1);
      });
    });
  });

  given('[case3] repo with stale hook from us', () => {
    const testRepo = useBeforeAll(async () => {
      const repo = genTestGitRepo({
        prefix: 'hooks-init-cleanup-',
        copyFrom: path.join(ASSETS, 'repo-stale-hook-ours'),
      });

      // create the rhachet binary
      const binDir = path.join(repo.repoDir, 'node_modules', '.bin');
      fs.mkdirSync(binDir, { recursive: true });
      fs.writeFileSync(path.join(binDir, 'rhachet'), '#!/bin/bash\necho ok');
      fs.chmodSync(path.join(binDir, 'rhachet'), '755');

      return repo;
    });

    afterAll(() => testRepo.cleanup());

    when('[t0] hooks init is executed', () => {
      const result = useBeforeAll(async () => {
        const output = runHooksInit({ repoDir: testRepo.repoDir });
        const settingsPath = path.join(
          testRepo.repoDir,
          '.claude',
          'settings.json',
        );
        const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
        return { output, settings };
      });

      then('stale hook is cleaned up', () => {
        const sessionStartMatchers = result.settings.hooks?.SessionStart ?? [];
        const hooks = sessionStartMatchers.flatMap(
          (m: { hooks?: { command: string }[] }) => m.hooks ?? [],
        );
        const staleHook = hooks.find((h: { command: string }) =>
          h.command.includes('/nonexistent/'),
        );
        expect(staleHook).toBeUndefined();
      });

      then('new hook is bound', () => {
        expect(result.output).toContain('bind hooks');
      });
    });
  });

  given('[case4] repo with hook from other role', () => {
    const testRepo = useBeforeAll(async () => {
      const repo = genTestGitRepo({
        prefix: 'hooks-init-preserve-other-',
        copyFrom: path.join(ASSETS, 'repo-stale-hook-other-role'),
      });

      // create the rhachet binary
      const binDir = path.join(repo.repoDir, 'node_modules', '.bin');
      fs.mkdirSync(binDir, { recursive: true });
      fs.writeFileSync(path.join(binDir, 'rhachet'), '#!/bin/bash\necho ok');
      fs.chmodSync(path.join(binDir, 'rhachet'), '755');

      return repo;
    });

    afterAll(() => testRepo.cleanup());

    when('[t0] hooks init is executed', () => {
      const result = useBeforeAll(async () => {
        const output = runHooksInit({ repoDir: testRepo.repoDir });
        const settingsPath = path.join(
          testRepo.repoDir,
          '.claude',
          'settings.json',
        );
        const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
        return { output, settings };
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

      then('our hook is also bound', () => {
        const sessionStartMatchers = result.settings.hooks?.SessionStart ?? [];
        const hooks = sessionStartMatchers.flatMap(
          (m: { hooks?: { author: string }[] }) => m.hooks ?? [],
        );
        const ourHook = hooks.find(
          (h: { author: string }) => h.author === 'repo=bhuild/role=behaver',
        );
        expect(ourHook).toBeDefined();
      });
    });
  });
});
