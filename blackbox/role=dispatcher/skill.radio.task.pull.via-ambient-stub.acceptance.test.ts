import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { given, then, useBeforeAll, when } from 'test-fns';

import { genConsumerRepo, runRhachetSkill, sanitizeOutput } from '../.test/infra';

/**
 * .what = the fake token the stub gh prints for its stored login; no real token has this shape
 */
const STUB_GH_TOKEN = 'gho_blackbox_stub_never_real_0000';

/**
 * .what = the real radio.task.pull skill, run as a consumer runs it, against a stub gh first on
 *         the PATH the skill's own subprocess inherits
 * .why  = the default is ambient-first: an ehmpath box pulls with its gh login, a human box pulls
 *         as-human, and an as-ehmpath miss names each spot it checked. only a run through the .sh
 *         wrapper proves the stub reaches the real subprocess, so no real gh login is ever read
 *
 * .note = the stub logs the GH_TOKEN each issue call carried, so the test reads which identity
 *         reached gh; a human pull carries none, since gh then uses its own stored login
 *
 * .mock = the gh cli, via a stub gh first on the PATH the skill's subprocess inherits
 * .why  = the ambient path reads `gh auth token`; a real gh on a dev box answers with the
 *         human's own login, and no test may read a real gh login (a prior draft leaked a real
 *         token into a log). the stub is the only way to put an ehmpath login on the box
 * .real = skill.radio.task.pull.via-gh-issues.acceptance.test.ts [case6] reaches real github
 *         with a rejected token; getGhAuthTokenFromRealGh.integration.test.ts runs the real gh
 *         with no login, to prove the real exit the code reads as none
 */
describe('radio.task.pull via the ambient default, through the real skill', () => {
  /**
   * .what = a consumer repo with a declared email, an empty home, a stub gh bin
   */
  const genScene = async (input: { slug: string; email: string }) => {
    const consumer = await genConsumerRepo({ prefix: `radio-pull-ambient-${input.slug}-` });
    const homeDir = path.join(consumer.repoDir, '.home');
    const binDir = path.join(consumer.repoDir, '.bin');
    fs.mkdirSync(homeDir);
    fs.mkdirSync(binDir);

    // the repo-local email wins over any global one, so the identity is the test's alone
    execSync(`git config user.email ${input.email}`, { cwd: consumer.repoDir });

    // the stub gh: the stored login (env tokens stripped by the probe), an empty list
    const tokensLogPath = path.join(consumer.repoDir, '.gh.tokens.log');
    fs.writeFileSync(
      path.join(binDir, 'gh'),
      [
        '#!/bin/sh',
        'if [ "$1" = "auth" ] && [ "$2" = "token" ] && [ -n "$GH_TOKEN" ]; then echo "$GH_TOKEN"; exit 0; fi',
        `if [ "$1" = "auth" ] && [ "$2" = "token" ]; then echo "${STUB_GH_TOKEN}"; exit 0; fi`,
        `if [ "$1" = "issue" ]; then echo "\${GH_TOKEN:-(none)}" >> "${tokensLogPath}"; fi`,
        'if [ "$1" = "issue" ] && [ "$2" = "list" ]; then echo "[]"; exit 0; fi',
        'echo "stub gh: unsupported: $*" >&2',
        'exit 1',
        '',
      ].join('\n'),
      { mode: 0o755 },
    );

    return { consumer, homeDir, binDir, tokensLogPath };
  };

  /**
   * .what = pull the gh.issues list under the stub world; keyrack misses, since the temp HOME
   *         holds no vault and the env passthrough is unset
   */
  const runPull = (
    scene: Awaited<ReturnType<typeof genScene>>,
    options: { authArgs: string; keyrackEnv?: string } = { authArgs: '' },
  ) => {
    const result = runRhachetSkill({
      repo: 'bhuild',
      role: 'dispatcher',
      skill: 'radio.task.pull',
      args: `--via gh.issues --from "test-owner/example" --list ${options.authArgs}`.trim(),
      repoDir: scene.consumer.repoDir,
      env: {
        HOME: scene.homeDir,
        PATH: `${scene.binDir}${path.delimiter}${process.env.PATH ?? ''}`,
        RADIO_GH_STUB: '1',
        GH_TOKEN: undefined,
        GITHUB_TOKEN: undefined,
        EHMPATH_BEAVER_GITHUB_TOKEN: options.keyrackEnv,
      },
      timeout: 60000,
    });
    const ghTokensSeen = fs.existsSync(scene.tokensLogPath)
      ? fs.readFileSync(scene.tokensLogPath, 'utf-8').split('\n').filter(Boolean)
      : [];
    return { ...result, ghTokensSeen };
  };

  given('[case1] no --auth on an ehmpath box with a gh login', () => {
    when('[t0] the real skill pulls the list', () => {
      const result = useBeforeAll(async () =>
        runPull(await genScene({ slug: 'ehmpath', email: 'seaturtle@ehmpath.com' })),
      );

      then('the pull succeeds', () => {
        expect(result.exitCode).toEqual(0);
        expect(result.stdout).toContain("what's on the water");
      });

      then('the stub gh login token is the one that reached gh', () => {
        expect(result.ghTokensSeen.length).toBeGreaterThan(0);
        expect(new Set(result.ghTokensSeen)).toEqual(new Set([STUB_GH_TOKEN]));
      });

      then('the output names the spot that paid, never the token', () => {
        expect(result.stdout).toContain('auth: as-ehmpath (via ambient)');
        expect(result.output).not.toContain(STUB_GH_TOKEN);
      });

      then('the output a human reads matches snapshot', () => {
        expect(sanitizeOutput(result.stdout)).toMatchSnapshot();
      });
    });
  });

  given('[case2] no --auth on a human box with a gh login', () => {
    when('[t0] the real skill pulls the list', () => {
      const result = useBeforeAll(async () =>
        runPull(await genScene({ slug: 'human', email: 'bert@example.com' })),
      );

      then('the pull succeeds', () => {
        expect(result.exitCode).toEqual(0);
        expect(result.stdout).toContain("what's on the water");
      });

      then('no robot token reached gh: gh used its own login', () => {
        expect(result.ghTokensSeen.length).toBeGreaterThan(0);
        expect(new Set(result.ghTokensSeen)).toEqual(new Set(['(none)']));
      });

      then('the output names the human source and its email', () => {
        expect(result.stdout).toContain('auth: as-human (via ambient email bert@example.com)');
      });

      then('the output a human reads matches snapshot', () => {
        expect(sanitizeOutput(result.stdout)).toMatchSnapshot();
      });
    });
  });

  given("[case3] --auth as-ehmpath on bert's laptop: keyrack holds none, the email is human", () => {
    when('[t0] the real skill pulls the list', () => {
      const result = useBeforeAll(async () =>
        runPull(await genScene({ slug: 'miss', email: 'bert@example.com' }), {
          authArgs: '--auth as-ehmpath',
        }),
      );

      then('the pull fails loud, exit 2, and no issue call reached gh', () => {
        expect(result.exitCode).toEqual(2);
        expect(result.ghTokensSeen).toEqual([]);
      });

      then('the miss names both spots in walk order, and never a token', () => {
        expect(result.stderr).toContain('found no ehmpath token');
        expect(result.stderr).toContain('keyrack: not granted');
        expect(result.stderr).toContain(
          'ambient: git config user.email = bert@example.com, not an ehmpath email',
        );
        expect(result.stderr.indexOf('keyrack: not granted')).toBeLessThan(
          result.stderr.indexOf('ambient: git config'),
        );
        expect(result.output).not.toContain(STUB_GH_TOKEN);
      });

      then('the stdout stream matches snapshot', () => {
        // snap each stream apart: rhachet frames each with its own banner, so a merged capture reads it twice
        expect(sanitizeOutput(result.stdout).trim()).toMatchSnapshot();
      });

      then('the stderr stream matches snapshot', () => {
        expect(sanitizeOutput(result.stderr).trim()).toMatchSnapshot();
      });
    });
  });

  given('[case4] --auth as-ehmpath on a fresh clone box: keyrack holds none, gh is logged in', () => {
    when('[t0] the real skill pulls the list', () => {
      const result = useBeforeAll(async () =>
        runPull(await genScene({ slug: 'fallthrough', email: 'seaturtle@ehmpath.com' }), {
          authArgs: '--auth as-ehmpath',
        }),
      );

      then('the pull succeeds: keyrack missed, then ambient paid', () => {
        expect(result.exitCode).toEqual(0);
        expect(result.stdout).toContain("what's on the water");
        expect(new Set(result.ghTokensSeen)).toEqual(new Set([STUB_GH_TOKEN]));
      });

      then('the output names the spot that paid: ambient, never the token', () => {
        expect(result.stdout).toContain('auth: as-ehmpath (via ambient)');
        expect(result.output).not.toContain(STUB_GH_TOKEN);
      });

      then('the output a human reads matches snapshot', () => {
        expect(sanitizeOutput(result.stdout)).toMatchSnapshot();
      });
    });
  });

  // a fake keyrack token through the env passthrough, which keyrack reads before any vault.
  // shaped ghs_ (an app install token): the keyrack env firewall refuses a ghp_ value
  const TOKEN_KEYRACK_FAKE = 'ghs_blackbox_pull_keyrack_never_real_00';

  given('[case5] --auth as-ehmpath on a robot box: keyrack grants, the email is human', () => {
    when('[t0] the real skill pulls the list', () => {
      const result = useBeforeAll(async () =>
        runPull(await genScene({ slug: 'keyrack-hit', email: 'bert@example.com' }), {
          authArgs: '--auth as-ehmpath',
          keyrackEnv: TOKEN_KEYRACK_FAKE,
        }),
      );

      then('the pull succeeds: keyrack paid, the gh login was never read', () => {
        expect(result.exitCode).toEqual(0);
        expect(result.stdout).toContain("what's on the water");
        expect(new Set(result.ghTokensSeen)).toEqual(new Set([TOKEN_KEYRACK_FAKE]));
      });

      then('the output names the spot that paid: keyrack, never the token', () => {
        expect(result.stdout).toContain('auth: as-ehmpath (via keyrack)');
        expect(result.output).not.toContain(TOKEN_KEYRACK_FAKE);
      });

      then('the output a human reads matches snapshot', () => {
        expect(sanitizeOutput(result.stdout)).toMatchSnapshot();
      });
    });
  });
});
