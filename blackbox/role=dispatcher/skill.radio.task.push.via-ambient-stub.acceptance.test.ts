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
 * .what = the output a human reads, with only the bytes that may vary per run masked
 * .why  = each walk's real output is kept for review; the push day is the day the suite runs, and
 *         the record key is masked in case its hash reads aught beyond the fixed title, so a snap
 *         diff shows a change of words, not of run
 */
const asStableWalkOutput = (input: { output: string }): string =>
  sanitizeOutput(input.output)
    .replace(/pushedAt: \d{4}-\d{2}-\d{2}/g, 'pushedAt: <day>')
    .replace(/\b[0-9a-f]{16}\b/g, '<uuid>');

/**
 * .what = the real radio.task.push skill, run as a consumer runs it, with no --auth, against a
 *         stub gh first on the PATH the skill's own subprocess inherits
 * .why  = the default is ambient-first: an ehmpath box sends with its gh login, a human box sends
 *         as-human. only a run through the .sh wrapper proves the stub reaches the real
 *         subprocess, so no real gh login is ever read
 *
 * .note = the stub logs the GH_TOKEN each issue call carried, so the test reads which identity
 *         reached gh; a human send carries none, since gh then uses its own stored login
 *
 * .mock = the gh cli, via a stub gh first on the PATH the skill's subprocess inherits
 * .why  = the ambient path reads `gh auth token`; a real gh on a dev box answers with the
 *         human's own login, and no test may read a real gh login (the wish forbids it, since
 *         a prior draft leaked a real token into a log). the stub is the only way to put an
 *         ehmpath login on the box without a real one
 * .real = skill.radio.task.push.via-gh-issues.acceptance.test.ts [case1]-[case6] create real
 *         issues with a real robot token; getGhAuthTokenFromRealGh.integration.test.ts runs
 *         the real gh binary with no login, to prove its real no-login exit
 */
describe('radio.task.push via the ambient default, through the real skill', () => {
  /**
   * .what = a consumer repo with a declared email, a home that allows radio, a stub gh bin
   */
  const genScene = async (input: { slug: string; email: string }) => {
    const consumer = await genConsumerRepo({ prefix: `radio-ambient-${input.slug}-` });
    const homeDir = path.join(consumer.repoDir, '.home');
    const binDir = path.join(consumer.repoDir, '.bin');
    fs.mkdirSync(homeDir);
    fs.mkdirSync(binDir);

    // the repo-local email wins over any global one, so the identity is the test's alone
    execSync(`git config user.email ${input.email}`, { cwd: consumer.repoDir });

    // the stub gh: the stored login (env tokens stripped by the probe), an empty list, a create
    const tokensLogPath = path.join(consumer.repoDir, '.gh.tokens.log');
    fs.writeFileSync(
      path.join(binDir, 'gh'),
      [
        '#!/bin/sh',
        'if [ "$1" = "auth" ] && [ "$2" = "token" ] && [ -n "$GH_TOKEN" ]; then echo "$GH_TOKEN"; exit 0; fi',
        `if [ "$1" = "auth" ] && [ "$2" = "token" ]; then echo "${STUB_GH_TOKEN}"; exit 0; fi`,
        `if [ "$1" = "issue" ]; then echo "\${GH_TOKEN:-(none)}" >> "${tokensLogPath}"; fi`,
        'if [ "$1" = "issue" ] && [ "$2" = "list" ]; then echo "[]"; exit 0; fi',
        'if [ "$1" = "issue" ] && [ "$2" = "create" ]; then echo "https://github.com/stub/stub/issues/7"; exit 0; fi',
        'echo "stub gh: unsupported: $*" >&2',
        'exit 1',
        '',
      ].join('\n'),
      { mode: 0o755 },
    );

    // allow radio for every org in the temp home
    runRhachetSkill({
      repo: 'bhuild',
      role: 'dispatcher',
      skill: 'radio.uses',
      args: '--org @all allow',
      repoDir: consumer.repoDir,
      env: { __I_AM_HUMAN: 'true', HOME: homeDir },
      timeout: 30000,
    });

    return { consumer, homeDir, binDir, tokensLogPath };
  };

  /**
   * .what = push one gh.issues task with no --auth, under the stub world
   */
  const runPushDefault = (
    scene: Awaited<ReturnType<typeof genScene>>,
    options: { authArgs: string; keyrackEnv?: string } = { authArgs: '' },
  ) => {
    const result = runRhachetSkill({
      repo: 'bhuild',
      role: 'dispatcher',
      skill: 'radio.task.push',
      args: `--via gh.issues --into "test-owner/example" --title "tide chart refresh" --description "the auth reads the box" ${options.authArgs}`.trim(),
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
    when('[t0] the real skill pushes', () => {
      const result = useBeforeAll(async () =>
        runPushDefault(await genScene({ slug: 'ehmpath', email: 'seaturtle@ehmpath.com' })),
      );

      then('the push is delivered', () => {
        expect(result.exitCode).toEqual(0);
        expect(result.output).toContain('🦫 onto the pile!');
      });

      then('the stub gh login token is the one that reached gh', () => {
        expect(result.ghTokensSeen.length).toBeGreaterThan(0);
        expect(new Set(result.ghTokensSeen)).toEqual(new Set([STUB_GH_TOKEN]));
      });

      then('the output names the spot that paid, never the token', () => {
        expect(result.output).toContain('auth: as-ehmpath (via ambient)');
        expect(result.output).not.toContain(STUB_GH_TOKEN);
      });

      then('the output a human reads matches snapshot', () => {
        expect(asStableWalkOutput({ output: result.output })).toMatchSnapshot();
      });
    });
  });

  given('[case2] no --auth on a human box with a gh login', () => {
    when('[t0] the real skill pushes', () => {
      const result = useBeforeAll(async () =>
        runPushDefault(await genScene({ slug: 'human', email: 'bert@example.com' })),
      );

      then('the push is delivered', () => {
        expect(result.exitCode).toEqual(0);
        expect(result.output).toContain('🦫 onto the pile!');
      });

      then('no robot token reached gh: gh used its own login', () => {
        expect(result.ghTokensSeen.length).toBeGreaterThan(0);
        expect(new Set(result.ghTokensSeen)).toEqual(new Set(['(none)']));
      });

      then('the output names the human source and its email', () => {
        expect(result.output).toContain('auth: as-human (via ambient email bert@example.com)');
        expect(result.output).not.toContain('as-ehmpath (via');
      });

      then('the output a human reads matches snapshot', () => {
        expect(asStableWalkOutput({ output: result.output })).toMatchSnapshot();
      });
    });
  });

  // keyrack misses in each case below: the temp HOME holds no vault, and the env passthrough
  // is unset in runPushDefault
  given("[case3] --auth as-ehmpath on bert's laptop: keyrack holds none, the email is human", () => {
    when('[t0] the real skill pushes', () => {
      const result = useBeforeAll(async () =>
        runPushDefault(await genScene({ slug: 'headline-miss', email: 'bert@example.com' }), {
          authArgs: '--auth as-ehmpath',
        }),
      );

      then('the push is held, exit 2, and no issue call reached gh', () => {
        expect(result.exitCode).toEqual(2);
        expect(result.output).toContain('upstream:auth');
        expect(result.ghTokensSeen).toEqual([]);
      });

      then('the miss names both spots in walk order, and never a token', () => {
        expect(result.output).toContain('found no ehmpath token');
        expect(result.output).toContain('keyrack: not granted');
        expect(result.output).toContain(
          'ambient: git config user.email = bert@example.com, not an ehmpath email',
        );
        expect(result.output.indexOf('keyrack: not granted')).toBeLessThan(
          result.output.indexOf('ambient: git config'),
        );
        expect(result.output).not.toContain(STUB_GH_TOKEN);
      });

      then('the held output a human reads matches snapshot', () => {
        // snap each stream apart: rhachet frames each with its own banner, so a merged capture reads it twice
        expect(result.stdout).toContain('🦫 held for the radio');
        expect(asStableWalkOutput({ output: result.stdout })).toMatchSnapshot();
      });

      then('the stderr stream matches snapshot', () => {
        expect(result.stderr).toContain('blocked by constraints');
        expect(asStableWalkOutput({ output: result.stderr })).toMatchSnapshot();
      });
    });
  });

  given('[case4] --auth as-ehmpath on a fresh clone box: keyrack holds none, gh is logged in', () => {
    when('[t0] the real skill pushes', () => {
      const result = useBeforeAll(async () =>
        runPushDefault(await genScene({ slug: 'headline-hit', email: 'seaturtle@ehmpath.com' }), {
          authArgs: '--auth as-ehmpath',
        }),
      );

      then('the push is delivered: keyrack missed, then ambient paid', () => {
        expect(result.exitCode).toEqual(0);
        expect(result.output).toContain('🦫 onto the pile!');
        expect(new Set(result.ghTokensSeen)).toEqual(new Set([STUB_GH_TOKEN]));
      });

      then('the output names the spot that paid: ambient', () => {
        expect(result.output).toContain('auth: as-ehmpath (via ambient)');
        expect(result.output).not.toContain(STUB_GH_TOKEN);
      });

      then('the output a human reads matches snapshot', () => {
        expect(asStableWalkOutput({ output: result.output })).toMatchSnapshot();
      });
    });
  });

  // a fake keyrack token through the env passthrough, which keyrack reads before any vault.
  // shaped ghs_ (an app install token): the keyrack env firewall refuses a ghp_ value
  const TOKEN_KEYRACK_FAKE = 'ghs_blackbox_keyrack_never_real_0000';

  given('[case5] --auth as-ehmpath on a robot box: keyrack grants, the email is human', () => {
    when('[t0] the real skill pushes', () => {
      const result = useBeforeAll(async () =>
        runPushDefault(await genScene({ slug: 'keyrack-hit', email: 'bert@example.com' }), {
          authArgs: '--auth as-ehmpath',
          keyrackEnv: TOKEN_KEYRACK_FAKE,
        }),
      );

      then('the push is delivered: keyrack paid, the gh login was never read', () => {
        expect(result.exitCode).toEqual(0);
        expect(result.output).toContain('🦫 onto the pile!');
        expect(new Set(result.ghTokensSeen)).toEqual(new Set([TOKEN_KEYRACK_FAKE]));
      });

      then('the output names the spot that paid: keyrack, never the token', () => {
        expect(result.output).toContain('auth: as-ehmpath (via keyrack)');
        expect(result.output).not.toContain(TOKEN_KEYRACK_FAKE);
      });

      then('the output a human reads matches snapshot', () => {
        expect(asStableWalkOutput({ output: result.output })).toMatchSnapshot();
      });
    });
  });
});
