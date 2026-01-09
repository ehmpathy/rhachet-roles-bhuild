import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { given, then, useBeforeAll, when } from 'test-fns';

import { genTestGitRepo } from '../../../../blackbox/.test/infra';

const FINDSERT_SCRIPT = path.join(
  process.cwd(),
  'dist/domain.roles/behaver/inits/init.claude.hooks.findsert.sh',
);

const ASSETS = path.join(__dirname, '.test/assets');

describe('init.claude.hooks.findsert', () => {
  given('[case1] settings.json does not exist', () => {
    const testRepo = useBeforeAll(async () =>
      genTestGitRepo({ prefix: 'findsert-test-' }),
    );

    when('[t0] findsert is called', () => {
      beforeAll(async () => {
        // create .claude dir
        fs.mkdirSync(path.join(testRepo.repoDir, '.claude'));

        // run findsert via the shell script
        execSync(
          `bash ${FINDSERT_SCRIPT} ` +
            `--hook-type SessionStart --matcher "*" --command "echo test" --name "test-hook"`,
          { cwd: testRepo.repoDir },
        );
      });

      then('creates settings.json', () => {
        const settingsPath = path.join(
          testRepo.repoDir,
          '.claude',
          'settings.json',
        );
        expect(fs.existsSync(settingsPath)).toBe(true);
      });

      then('settings.json contains the hook', () => {
        const settingsPath = path.join(
          testRepo.repoDir,
          '.claude',
          'settings.json',
        );
        const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
        expect(settings.hooks.SessionStart).toBeDefined();
        expect(settings.hooks.SessionStart[0].matcher).toEqual('*');
        expect(settings.hooks.SessionStart[0].hooks[0].command).toEqual(
          'echo test',
        );
      });
    });
  });

  given('[case2] settings.json has empty hooks', () => {
    const testRepo = useBeforeAll(async () =>
      genTestGitRepo({
        prefix: 'findsert-empty-',
        copyFrom: path.join(ASSETS, 'repo-empty-hooks'),
      }),
    );

    when('[t0] findsert is called', () => {
      beforeAll(async () => {
        execSync(
          `bash ${FINDSERT_SCRIPT} ` +
            `--hook-type SessionStart --matcher "*" --command "echo test" --name "test-hook"`,
          { cwd: testRepo.repoDir },
        );
      });

      then('adds hook to settings.json', () => {
        const settingsPath = path.join(
          testRepo.repoDir,
          '.claude',
          'settings.json',
        );
        const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
        expect(settings.hooks.SessionStart).toBeDefined();
        expect(settings.hooks.SessionStart[0].hooks[0].command).toEqual(
          'echo test',
        );
      });
    });
  });

  given('[case3] hook already present', () => {
    const testRepo = useBeforeAll(async () =>
      genTestGitRepo({
        prefix: 'findsert-idempotent-',
        copyFrom: path.join(ASSETS, 'repo-valid-boot-behavior'),
      }),
    );

    when('[t0] findsert is called with same hook', () => {
      beforeAll(async () => {
        execSync(
          `bash ${FINDSERT_SCRIPT} ` +
            `--hook-type SessionStart --matcher "*" ` +
            `--command "./node_modules/.bin/rhachet run --repo bhuild --role behaver --init sessionstart.boot-behavior" ` +
            `--name "boot-behavior"`,
          { cwd: testRepo.repoDir },
        );
      });

      then('no duplicate hook is added', () => {
        const settingsPath = path.join(
          testRepo.repoDir,
          '.claude',
          'settings.json',
        );
        const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));

        // should have exactly one hook, not two
        expect(settings.hooks.SessionStart).toHaveLength(1);
        expect(settings.hooks.SessionStart[0].hooks).toHaveLength(1);
      });
    });
  });

  given('[case4] position=prepend', () => {
    const testRepo = useBeforeAll(async () =>
      genTestGitRepo({
        prefix: 'findsert-prepend-',
        copyFrom: path.join(ASSETS, 'repo-multiple-matchers'),
      }),
    );

    when('[t0] findsert is called with prepend position', () => {
      beforeAll(async () => {
        execSync(
          `bash ${FINDSERT_SCRIPT} ` +
            `--hook-type SessionStart --matcher "*" --command "echo prepend-hook" --name "prepend-hook" --position prepend`,
          { cwd: testRepo.repoDir },
        );
      });

      then('hook is first in array for that matcher', () => {
        const settingsPath = path.join(
          testRepo.repoDir,
          '.claude',
          'settings.json',
        );
        const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));

        // find the matcher "*"
        const globalMatcher = settings.hooks.SessionStart.find(
          (m: { matcher: string }) => m.matcher === '*',
        );
        expect(globalMatcher).toBeDefined();
        expect(globalMatcher.hooks[0].command).toEqual('echo prepend-hook');
      });
    });
  });

  given('[case5] hook author is set', () => {
    const testRepo = useBeforeAll(async () =>
      genTestGitRepo({ prefix: 'findsert-author-' }),
    );

    when('[t0] findsert is called', () => {
      beforeAll(async () => {
        fs.mkdirSync(path.join(testRepo.repoDir, '.claude'));
        execSync(
          `bash ${FINDSERT_SCRIPT} ` +
            `--hook-type SessionStart --matcher "*" --command "echo test" --name "test-hook"`,
          { cwd: testRepo.repoDir },
        );
      });

      then('author is repo=bhuild/role=behaver', () => {
        const settingsPath = path.join(
          testRepo.repoDir,
          '.claude',
          'settings.json',
        );
        const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
        expect(settings.hooks.SessionStart[0].hooks[0].author).toEqual(
          'repo=bhuild/role=behaver',
        );
      });
    });
  });
});
