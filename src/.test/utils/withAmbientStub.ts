import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { genTempDir } from 'test-fns';

import { assertStubGhOnPath } from './assertStubGhOnPath';

/**
 * .what = the fake token the stub gh prints; no real token ever has this shape
 */
export const STUB_GH_TOKEN = 'gho_stub_never_real_0000';

/**
 * .what = run a callback on an ambient world the test controls: a stub gh first on the
 *         PATH the subprocess inherits, and a git identity the test declares
 * .why  = no test may reach a real gh login or read a real git identity into a log or snap
 *
 * .note = the git identity lives in GIT_CONFIG_GLOBAL (a temp file that holds the email, or
 *         naught) with GIT_CONFIG_NOSYSTEM=1; the callback starts in a bare temp repo, and a
 *         callback that moves cwd elsewhere still reads that identity alone
 * .note = RADIO_GH_STUB=1 declares the stub, which the ambient derive demands in a test env
 */
export const withAmbientStub = async <T>(
  input: {
    slug: string;
    gh: { login: 'token' | 'none' | 'fault'; envToken?: string };
    git: { email: string | null };
  },
  run: (scene: {
    stubPath: string;
    getGhTokensSeen: () => string[];
  }) => Promise<T>,
): Promise<T> => {
  // lay out the temp world: a bin dir with the stub, a global config, a bare repo
  const root = genTempDir({ slug: `radio-ambient-${input.slug}` });
  const binDir = path.join(root, 'bin');
  const repoDir = path.join(root, 'repo');
  const stubPath = path.join(binDir, 'gh');
  const globalConfig = path.join(root, 'gitconfig.global');
  fs.mkdirSync(binDir, { recursive: true });
  fs.mkdirSync(repoDir, { recursive: true });
  fs.writeFileSync(
    globalConfig,
    input.git.email ? `[user]\n\temail = ${input.git.email}\n` : '',
    'utf-8',
  );

  // the stub answers `gh auth token` as the documented gh does: the token, or exit 1; a
  // `fault` login exits 3, a box fault that is never "none" (a broken config, a cut read);
  // it answers the two calls a task create makes (list, then create), and logs the
  // GH_TOKEN each issue call received, so a test can prove which token reached gh
  const tokensLogPath = path.join(root, 'gh.tokens.log');
  const answerByLogin = {
    token: `echo "${STUB_GH_TOKEN}"; exit 0`,
    none: `echo "no oauth token found for github.com" >&2; exit 1`,
    fault: `echo "stub gh: config unreadable" >&2; exit 3`,
  };
  const answer = answerByLogin[input.gh.login];
  fs.writeFileSync(
    stubPath,
    [
      '#!/bin/sh',
      // as the real gh does, an env token answers `gh auth token` before the stored login
      'if [ "$1" = "auth" ] && [ "$2" = "token" ] && [ -n "$GH_TOKEN" ]; then echo "$GH_TOKEN"; exit 0; fi',
      `if [ "$1" = "auth" ] && [ "$2" = "token" ]; then ${answer}; fi`,
      `if [ "$1" = "issue" ]; then echo "\${GH_TOKEN:-(none)}" >> "${tokensLogPath}"; fi`,
      'if [ "$1" = "issue" ] && [ "$2" = "list" ]; then echo "[]"; exit 0; fi',
      'if [ "$1" = "issue" ] && [ "$2" = "create" ]; then echo "https://github.com/stub/stub/issues/7"; exit 0; fi',
      'echo "stub gh: unsupported: $*" >&2',
      'exit 1',
      '',
    ].join('\n'),
    { mode: 0o755 },
  );

  // the subprocess env: stub first on PATH, git config isolated, stub declared
  const envOverlay: Record<string, string> = {
    PATH: `${binDir}${path.delimiter}${process.env.PATH ?? ''}`,
    GIT_CONFIG_GLOBAL: globalConfig,
    GIT_CONFIG_NOSYSTEM: '1',
    RADIO_GH_STUB: '1',
    ...(input.gh.envToken ? { GH_TOKEN: input.gh.envToken } : {}),
  };

  // a bare repo, so git reads only the isolated global config for its identity
  execSync('git init --quiet', {
    cwd: repoDir,
    env: { ...process.env, ...envOverlay },
  });

  // .note = deliberate mutation, scoped to this try/finally: set each key ON process.env,
  // never a new object, since a test that captured process.env earlier (as context.env)
  // must see the same stub declaration the shell does; jest runs one test file per worker,
  // and the callbacks here run serially, so no concurrent reader shares the window
  const envBefore = Object.fromEntries(
    Object.keys(envOverlay).map((key) => [key, process.env[key]]),
  );
  const cwdBefore = process.cwd();
  Object.assign(process.env, envOverlay);
  process.chdir(repoDir);
  try {
    await assertStubGhOnPath({ stubPath });
    return await run({
      stubPath,
      getGhTokensSeen: () =>
        fs.existsSync(tokensLogPath)
          ? fs.readFileSync(tokensLogPath, 'utf-8').split('\n').filter(Boolean)
          : [],
    });
  } finally {
    // restore each key: drop the ones that were absent, reset the rest
    Object.entries(envBefore).forEach(([key, value]) => {
      if (value === undefined) {
        delete process.env[key];
        return;
      }
      process.env[key] = value;
    });
    process.chdir(cwdBefore);
  }
};
