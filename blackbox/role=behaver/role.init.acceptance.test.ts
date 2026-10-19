import { given, then, useBeforeAll, when } from 'test-fns';

import {
  genConsumerRepo,
  getRepoClaudeSettings,
  REPO_CLAUDE_SETTINGS_PATH,
  runRolesInit,
  setFileInRepo,
} from '../.test/infra';

/**
 * .what = the hooks under one claude event, flattened across matchers
 * .why  = each assertion asks about hooks, not the matcher shape that groups them
 */
const getHooksOfEvent = (input: {
  repoDir: string;
  event: string;
}): { command: string; author?: string }[] =>
  (getRepoClaudeSettings({ repoDir: input.repoDir }).hooks?.[input.event] ?? [])
    .flatMap((matcher) => matcher.hooks ?? []);

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

      then('binds hooks to the repo-level settings', () => {
        // rhachet binds role hooks into .claude/settings.of.repo.json — never the
        // .claude/settings.json beside it, which links to the host's own settings
        const hooks = getHooksOfEvent({
          repoDir: scene.repoDir,
          event: 'SessionStart',
        });
        expect(
          hooks.some((hook) =>
            hook.command.includes('sessionstart.boot-behavior'),
          ),
        ).toBe(true);
      });

      then('hook command uses rhachet run --init pattern', () => {
        const bootHook = getHooksOfEvent({
          repoDir: scene.repoDir,
          event: 'SessionStart',
        }).find((hook) => hook.command.includes('boot-behavior'));

        expect(bootHook?.command).toContain('rhachet');
        expect(bootHook?.command).toContain('run');
        expect(bootHook?.command).toContain('--init');
      });

      then('hook has correct author tag', () => {
        const bootHook = getHooksOfEvent({
          repoDir: scene.repoDir,
          event: 'SessionStart',
        }).find((hook) => hook.author === 'repo=bhuild/role=behaver');

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

        // inject a stale hook that uses deprecated .agent/ path pattern.
        // setFileInRepo refuses any write that would leave the temp repo
        setFileInRepo({
          repoDir,
          path: REPO_CLAUDE_SETTINGS_PATH,
          content: JSON.stringify(
            {
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
            },
            null,
            2,
          ),
        });

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
        const hooks = getHooksOfEvent({
          repoDir: scene.repoDir,
          event: 'SessionStart',
        });

        // stale hook should be removed
        expect(
          hooks.find((hook) => hook.command.includes('.agent/repo=bhuild')),
        ).toBeUndefined();

        // new hook should be present
        expect(
          hooks.find((hook) => hook.command.includes('boot-behavior')),
        ).toBeDefined();
      });
    });
  });
});
