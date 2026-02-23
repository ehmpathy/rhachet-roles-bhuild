import fs from 'fs';
import path from 'path';
import { given, then, useBeforeAll, when } from 'test-fns';

import { genConsumerRepo, runRolesInit } from '../.test/infra';

describe('behaver role.init acceptance (as consumer)', () => {
  given('[case1] fresh consumer repo without behaver initialization', () => {
    when('[t0] roles init --role behaver is executed', () => {
      const scene = useBeforeAll(async () =>
        genConsumerRepo({
          prefix: 'roles-init-behaver-test',
          withClaudeDir: true,
        }),
      );

      const result = useBeforeAll(async () =>
        runRolesInit({
          repo: 'bhuild',
          role: 'behaver',
          repoDir: scene.repoDir,
        }),
      );

      then('exits with code 0', () => {
        expect(result.exitCode).toBe(0);
      });

      then('binds hooks to settings.json (repo-level)', () => {
        // verify hooks are bound to settings.json (not settings.local.json)
        const settingsPath = path.join(
          scene.repoDir,
          '.claude',
          'settings.json',
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

      then('hook command uses rhachet run --init pattern', () => {
        const settingsPath = path.join(
          scene.repoDir,
          '.claude',
          'settings.json',
        );
        const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
        const sessionStartMatchers = settings.hooks.SessionStart;
        const hooks = sessionStartMatchers.flatMap(
          (m: { hooks?: { command: string }[] }) => m.hooks ?? [],
        );
        const bootHook = hooks.find((h: { command: string }) =>
          h.command.includes('boot-behavior'),
        );

        expect(bootHook.command).toContain('rhachet');
        expect(bootHook.command).toContain('run');
        expect(bootHook.command).toContain('--init');
      });

      then('hook has correct author tag', () => {
        const settingsPath = path.join(
          scene.repoDir,
          '.claude',
          'settings.json',
        );
        const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
        const sessionStartMatchers = settings.hooks.SessionStart;
        const hooks = sessionStartMatchers.flatMap(
          (m: { hooks?: { author: string }[] }) => m.hooks ?? [],
        );
        const bootHook = hooks.find(
          (h: { author: string }) => h.author === 'repo=bhuild/role=behaver',
        );

        expect(bootHook).toBeDefined();
      });
    });

    when('[t1] roles init --role behaver is executed twice', () => {
      const scene = useBeforeAll(async () =>
        genConsumerRepo({
          prefix: 'roles-init-behaver-idempotent-test',
          withClaudeDir: true,
        }),
      );

      then('is idempotent - second run also succeeds', () => {
        // first run
        const firstResult = runRolesInit({
          repo: 'bhuild',
          role: 'behaver',
          repoDir: scene.repoDir,
        });
        expect(firstResult.exitCode).toBe(0);

        // second run should also succeed (idempotent)
        const secondResult = runRolesInit({
          repo: 'bhuild',
          role: 'behaver',
          repoDir: scene.repoDir,
        });
        expect(secondResult.exitCode).toBe(0);
      });
    });
  });

  given('[case2] consumer repo with stale hook from prior version', () => {
    when('[t0] roles init --role behaver is executed', () => {
      const scene = useBeforeAll(async () => {
        const { repoDir } = genConsumerRepo({
          prefix: 'roles-init-cleanup-test',
          withClaudeDir: true,
        });

        // inject a stale hook that uses deprecated .agent/ path pattern
        const settingsPath = path.join(repoDir, '.claude', 'settings.json');
        const staleSettings = {
          hooks: {
            SessionStart: [
              {
                matcher: '*',
                hooks: [
                  {
                    type: 'command',
                    command:
                      '.agent/repo=bhuild/role=behaver/inits/claude.hooks/old-boot-behavior.sh',
                    timeout: 10,
                    author: 'repo=bhuild/role=behaver',
                  },
                ],
              },
            ],
          },
        };
        fs.writeFileSync(settingsPath, JSON.stringify(staleSettings, null, 2));

        return { repoDir };
      });

      const result = useBeforeAll(async () =>
        runRolesInit({
          repo: 'bhuild',
          role: 'behaver',
          repoDir: scene.repoDir,
        }),
      );

      then('exits with code 0', () => {
        expect(result.exitCode).toBe(0);
      });

      then('stale hook is cleaned and replaced', () => {
        const settingsPath = path.join(
          scene.repoDir,
          '.claude',
          'settings.json',
        );
        const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
        const sessionStartMatchers = settings.hooks?.SessionStart ?? [];
        const hooks = sessionStartMatchers.flatMap(
          (m: { hooks?: { command: string }[] }) => m.hooks ?? [],
        );

        // stale hook should be removed
        const staleHook = hooks.find((h: { command: string }) =>
          h.command.includes('.agent/repo=bhuild'),
        );
        expect(staleHook).toBeUndefined();

        // new hook should be present
        const validHook = hooks.find((h: { command: string }) =>
          h.command.includes('boot-behavior'),
        );
        expect(validHook).toBeDefined();
      });
    });
  });
});
