import fs from 'fs';
import path from 'path';
import { given, then, when } from 'test-fns';

import {
  genConsumerRepo,
  runRolesInit,
  type ConsumerRepo,
} from '../.test/infra';

describe('behaver role.init acceptance (as consumer)', () => {
  given('[case1] fresh consumer repo without behaver initialization', () => {
    when('[t0] roles init --role behaver is executed', () => {
      let consumer: ConsumerRepo;

      beforeAll(() => {
        consumer = genConsumerRepo({
          prefix: 'roles-init-behaver-test-',
          withClaudeDir: true,
        });
      });

      afterAll(() => {
        consumer.cleanup();
      });

      then('exits with code 0', () => {
        const result = runRolesInit({
          repo: 'bhuild',
          role: 'behaver',
          repoDir: consumer.repoDir,
        });

        expect(result.exitCode).toBe(0);
      });

      then('initializes claude hooks for behaver', () => {
        runRolesInit({
          repo: 'bhuild',
          role: 'behaver',
          repoDir: consumer.repoDir,
        });

        // verify the hooks were installed to settings.local.json
        const settingsPath = path.join(
          consumer.repoDir,
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
      let consumer: ConsumerRepo;

      beforeAll(() => {
        consumer = genConsumerRepo({
          prefix: 'roles-init-behaver-idempotent-test-',
          withClaudeDir: true,
        });
      });

      afterAll(() => {
        consumer.cleanup();
      });

      then('is idempotent - second run also succeeds', () => {
        // first run
        const firstResult = runRolesInit({
          repo: 'bhuild',
          role: 'behaver',
          repoDir: consumer.repoDir,
        });
        expect(firstResult.exitCode).toBe(0);

        // second run should also succeed (idempotent)
        const secondResult = runRolesInit({
          repo: 'bhuild',
          role: 'behaver',
          repoDir: consumer.repoDir,
        });
        expect(secondResult.exitCode).toBe(0);
      });
    });
  });
});
