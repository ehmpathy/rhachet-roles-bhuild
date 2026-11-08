import * as fs from 'fs';
import * as path from 'path';
import { genTempDir, given, then, useThen, when } from 'test-fns';

import { daoRadioTaskRecord } from '@src/access/daos/daoRadioTaskRecord';
import { RadioChannel } from '@src/domain.objects/RadioChannel';
import { RadioTaskRecordStatus } from '@src/domain.objects/RadioTaskRecordStatus';
import { RadioTaskRepo } from '@src/domain.objects/RadioTaskRepo';
import { shx } from '@src/infra/shell/shx';

import { asRadioAuthFallbackNotice } from './asRadioAuthFallbackNotice';
import { asRadioQueueFixLines } from './asRadioQueueFixLines';
import type { RadioTaskRecordFate } from './RadioTaskRecordFate';
import { setRadioTaskRecordFromPush } from './setRadioTaskRecordFromPush';
import { setRadioTaskRecordsDrained } from './setRadioTaskRecordsDrained';
import { setRadioTaskRecordsDrainedByPush } from './setRadioTaskRecordsDrainedByPush';

/**
 * .mock = the gh cli, via a stateful stub `gh` first on PATH
 * .why  = a refusal of one token and the acceptance of another, on one send, cannot be staged
 *         against real github without two live credentials, one of them deliberately broken.
 *         the stub keeps its issues on disk, logs which token made each call, and refuses
 *         the tokens a case names
 * .real = daoRadioTaskViaGhIssues.integration.test.ts runs the gh dao against real github
 */
const STUB_GH = `#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const dir = process.env.STUB_GH_DIR;
const args = process.argv.slice(2);
const token = process.env.GH_TOKEN || '(none)';
const verb = args[0] + ' ' + args[1];
const lines = (name) => fs.existsSync(path.join(dir, name))
  ? fs.readFileSync(path.join(dir, name), 'utf-8').split('\\n').filter(Boolean)
  : [];
const issuesPath = path.join(dir, 'issues.json');
const issues = fs.existsSync(issuesPath) ? JSON.parse(fs.readFileSync(issuesPath, 'utf-8')) : [];
fs.appendFileSync(path.join(dir, 'calls.log'), token + '\\t' + verb + '\\n');
if (lines('refuse.401').includes(token)) {
  process.stderr.write('HTTP 401: Bad credentials (https://api.github.com/graphql)');
  process.exit(1);
}
if (lines('refuse.403').includes(token)) {
  process.stderr.write('HTTP 403: Resource not accessible by integration');
  process.exit(1);
}
if (lines('notfound').includes(token)) {
  process.stderr.write("GraphQL: Could not resolve to a Repository with the name 'sandpine/svc-lessons'. (repository)");
  process.exit(1);
}
if (lines('ratelimit').includes(token)) {
  process.stderr.write('HTTP 403: API rate limit exceeded for installation');
  process.exit(1);
}
if (verb === 'issue list') {
  process.stdout.write(JSON.stringify(issues));
  process.exit(0);
}
if (verb === 'issue create' && lines('ratelimit-on-create').includes(token)) {
  process.stderr.write('HTTP 403: API rate limit exceeded for installation');
  process.exit(1);
}
if (verb === 'issue create') {
  const title = args[args.indexOf('--title') + 1];
  const body = fs.readFileSync(args[args.indexOf('--body-file') + 1], 'utf-8');
  const number = issues.length + 1;
  issues.push({
    number, title, body, state: 'OPEN', assignees: [],
    createdAt: '2026-11-07T00:00:00Z', author: { login: 'bert' },
  });
  fs.writeFileSync(issuesPath, JSON.stringify(issues));
  if (lines('refuse-after-create.401').includes(token)) {
    process.stderr.write('HTTP 401: Bad credentials (https://api.github.com/graphql)');
    process.exit(1);
  }
  process.stdout.write('https://github.com/sandpine/svc-lessons/issues/' + number + '\\n');
  process.exit(0);
}
process.stderr.write('stub gh: unexpected call: ' + args.join(' '));
process.exit(1);
`;

const TOKEN_BOT = 'ghs_botToken000';
const TOKEN_AMBIENT = 'ghp_ambientToken000';
const TOKEN_TYPED = 'ghp_typedToken000';
const TOKEN_LOGIN = 'gho_loginToken000';

/**
 * .what = a fake keyrack.get: the bot token granted, or absent
 * .why = keyrack is a remote boundary (a vault); the context seam takes a fake
 */
const genKeyrackGet = (input: { bot: 'granted' | 'absent' }) =>
  jest.fn().mockResolvedValue(
    input.bot === 'granted'
      ? {
          attempt: {
            status: 'granted',
            grant: { key: { secret: TOKEN_BOT } },
          },
          emit: { stdout: '' },
        }
      : { attempt: { status: 'absent' }, emit: { stdout: '' } },
  );

/**
 * .what = the env a case runs under: this process's, with no ambient github token but the ones named
 * .why = a developer's own GH_TOKEN or GITHUB_TOKEN must never leak into a case
 */
const genEnv = (input: Record<string, string>): NodeJS.ProcessEnv => {
  const {
    GH_TOKEN: _removed,
    GITHUB_TOKEN: _removed2,
    ...envWithoutToken
  } = process.env;
  return { ...envWithoutToken, ...input };
};

/**
 * .what = the env a gh-login case runs under: genEnv, with the test-env marks dropped too
 * .why = the ambient read skips the gh login in a test env, so a box with only a gh login
 *        cannot be staged without them gone. safe only beside genShxWithGhLoginOnly, which
 *        stands in for every shell call, so no real `gh` can run
 */
const genEnvWithGhLogin = (
  input: Record<string, string>,
): NodeJS.ProcessEnv => {
  const {
    NODE_ENV: _removed,
    JEST_WORKER_ID: _removed2,
    ...envOutsideTest
  } = genEnv(input);
  return envOutsideTest;
};

/**
 * .what = a fake shx that answers the gh-login read with a fixture token, and refuses all else
 * .why = the auth seam's shell is the one path to a real `gh`, whose login is a developer's own.
 *        a login shell rebuilds PATH, so a stub first on PATH cannot shadow it; this fake
 *        replaces the seam whole. any other command throws, so an unforeseen call goes red
 */
const genShxWithGhLoginOnly =
  (input: { login: string }) =>
  async (command: string): Promise<{ stdout: string; stderr: string }> => {
    if (command === 'env -u GH_TOKEN -u GITHUB_TOKEN gh auth token')
      return { stdout: `${input.login}\n`, stderr: '' };
    throw new Error(
      `fake shx: unexpected command in a gh-login case: ${command}`,
    );
  };

/**
 * .what = a scene: a granted repo, a stub gh, one held gh.issues record of a surf-school task
 * .why = each case stages its own credentials and refusals
 */
const genScene = (input: {
  slug: string;
  bot: 'granted' | 'absent';
  env: Record<string, string>;
  refuse?: {
    401?: string[];
    403?: string[];
    afterCreate401?: string[];
    rateLimit?: string[];
    notFound?: string[];
    rateLimitOnCreate?: string[];
  };
  auth?: string | null;
  ghLogin?: string;
}) => {
  const cwd = genTempDir({ slug: `radio-fallback-${input.slug}`, git: true });
  const homeDir = genTempDir({ slug: `radio-fallback-${input.slug}-home` });
  const stubDir = genTempDir({ slug: `radio-fallback-${input.slug}-gh` });
  fs.writeFileSync(path.join(stubDir, 'gh'), STUB_GH, { mode: 0o755 });
  fs.writeFileSync(
    path.join(stubDir, 'refuse.401'),
    (input.refuse?.[401] ?? []).join('\n'),
  );
  fs.writeFileSync(
    path.join(stubDir, 'refuse.403'),
    (input.refuse?.[403] ?? []).join('\n'),
  );
  fs.writeFileSync(
    path.join(stubDir, 'refuse-after-create.401'),
    (input.refuse?.afterCreate401 ?? []).join('\n'),
  );
  fs.writeFileSync(
    path.join(stubDir, 'ratelimit'),
    (input.refuse?.rateLimit ?? []).join('\n'),
  );
  fs.writeFileSync(
    path.join(stubDir, 'notfound'),
    (input.refuse?.notFound ?? []).join('\n'),
  );
  fs.writeFileSync(
    path.join(stubDir, 'ratelimit-on-create'),
    (input.refuse?.rateLimitOnCreate ?? []).join('\n'),
  );
  fs.mkdirSync(path.join(cwd, '.meter'), { recursive: true });
  fs.writeFileSync(
    path.join(cwd, '.meter', 'radio.uses.jsonc'),
    JSON.stringify({ state: 'allowed' }),
  );
  const dir = path.join(cwd, '.behavior', '.radio');
  const { record } = setRadioTaskRecordFromPush(
    {
      push: {
        repo: new RadioTaskRepo({ owner: 'sandpine', name: 'svc-lessons' }),
        via: RadioChannel.GH_ISSUES,
        auth: input.auth ?? null,
        idem: null,
        title: `lesson reminder for ${input.slug}`,
        description: 'remind the surfer of the dawn lesson',
        exid: null,
        status: null,
      },
    },
    { dir, cwd },
  );
  const keyrackGet = genKeyrackGet({ bot: input.bot });
  const context = {
    cwd,
    homeDir,
    env: input.ghLogin ? genEnvWithGhLogin(input.env) : genEnv(input.env),
    shx: input.ghLogin ? genShxWithGhLoginOnly({ login: input.ghLogin }) : shx,
    keyrackGet,
  };
  return { cwd, dir, stubDir, record, context, keyrackGet };
};

/**
 * .what = run one act with the stub gh first on PATH
 * .why = the gh dao calls `gh` from PATH; the stub reads its state dir from the env
 */
const withStubGh = async <T>(
  input: { stubDir: string },
  act: () => Promise<T>,
): Promise<T> => {
  const pathPrior = process.env.PATH;
  const stubDirPrior = process.env.STUB_GH_DIR;
  process.env.PATH = `${input.stubDir}:${pathPrior}`;
  process.env.STUB_GH_DIR = input.stubDir;
  try {
    return await act();
  } finally {
    process.env.PATH = pathPrior;
    process.env.STUB_GH_DIR = stubDirPrior;
  }
};

/**
 * .what = what the stub saw: each call's token, and the issues it holds
 * .why = the clamp asserts which credential sent, and that a resend never doubled
 */
const getStubSeen = (input: { stubDir: string }) => {
  const callsPath = path.join(input.stubDir, 'calls.log');
  const issuesPath = path.join(input.stubDir, 'issues.json');
  const calls = fs.existsSync(callsPath)
    ? fs
        .readFileSync(callsPath, 'utf-8')
        .split('\n')
        .filter(Boolean)
        .map((line) => line.split('\t')[0]!)
    : [];
  const issues: unknown[] = fs.existsSync(issuesPath)
    ? JSON.parse(fs.readFileSync(issuesPath, 'utf-8'))
    : [];
  return { tokens: [...new Set(calls)], calls: calls.length, issues };
};

/**
 * .what = a push of the scene's record: its own gate, then the drain it carries
 * .why = the push path, as `rhx radio.task.push` runs it
 */
const runPush = async (input: {
  scene: ReturnType<typeof genScene>;
  authTyped?: string | null;
}) =>
  withStubGh({ stubDir: input.scene.stubDir }, async () => {
    const drained = await setRadioTaskRecordsDrainedByPush(
      {
        record: input.scene.record,
        dir: input.scene.dir,
        authTyped: input.authTyped ?? null,
      },
      input.scene.context,
    );
    return {
      pushed: drained.pushed as RadioTaskRecordFate,
      onDisk: daoRadioTaskRecord.get.one.byUnique({
        dir: input.scene.dir,
        key: input.scene.record.key,
      }),
      seen: getStubSeen({ stubDir: input.scene.stubDir }),
    };
  });

/**
 * .what = a drain of the scene's worktree
 * .why = the drain path, as `rhx radio.task.queue drain` runs it
 */
const runDrain = async (input: {
  scene: ReturnType<typeof genScene>;
  authOverride?: string | null;
  env?: NodeJS.ProcessEnv;
}) =>
  withStubGh({ stubDir: input.scene.stubDir }, async () => {
    const { fates } = await setRadioTaskRecordsDrained(
      {},
      {
        ...input.scene.context,
        env: input.env ?? input.scene.context.env,
        authOverride: input.authOverride ?? null,
      },
    );
    return {
      fates,
      onDisk: daoRadioTaskRecord.get.one.byUnique({
        dir: input.scene.dir,
        key: input.scene.record.key,
      }),
      seen: getStubSeen({ stubDir: input.scene.stubDir }),
    };
  });

/**
 * .what = a held fate's detail, or null
 * .why = the clamps read what a held record names
 */
const asDetail = (input: { fate: RadioTaskRecordFate }): string | null =>
  input.fate.fate === 'held' ? input.fate.detail : null;

describe('setRadioTaskRecordUpstream — the default auth falls back to the ambient credential (#513)', () => {
  given('[case1] push, the bot token present and accepted', () => {
    when('[t0] the push runs, with GITHUB_TOKEN also in the env', () => {
      const result = useThen('it delivers', async () =>
        runPush({
          scene: genScene({
            slug: 'bot-accepted',
            bot: 'granted',
            env: { GITHUB_TOKEN: TOKEN_AMBIENT },
          }),
        }),
      );

      then('the push is delivered, with no fallback', () => {
        expect(result.pushed.fate).toEqual('delivered');
        expect(
          result.pushed.fate === 'delivered' ? result.pushed.fallback : 'n/a',
        ).toEqual(null);
      });

      then('every gh call went under the bot token alone', () => {
        expect(result.seen.tokens).toEqual([TOKEN_BOT]);
      });

      then('no fallback line prints', () => {
        expect(asRadioAuthFallbackNotice({ fates: [result.pushed] })).toEqual(
          [],
        );
      });
    });
  });

  given('[case2] push, the bot token absent, GITHUB_TOKEN in the env', () => {
    when('[t0] the push runs', () => {
      const result = useThen('it delivers', async () =>
        runPush({
          scene: genScene({
            slug: 'bot-absent',
            bot: 'absent',
            env: { GITHUB_TOKEN: TOKEN_AMBIENT },
          }),
        }),
      );

      then('the push is delivered under the GITHUB_TOKEN env', () => {
        expect(result.pushed.fate).toEqual('delivered');
        expect(result.seen.tokens).toEqual([TOKEN_AMBIENT]);
        expect(result.onDisk?.recordStatus).toEqual(
          RadioTaskRecordStatus.DELIVERED,
        );
      });

      then('the line names the kind and why the bot token did not send', () => {
        const lines = asRadioAuthFallbackNotice({ fates: [result.pushed] });
        expect(lines).toEqual([
          '🦫 delivered via the GITHUB_TOKEN env; the ehmpath bot token was absent',
        ]);
        expect(lines.join('\n')).not.toContain(TOKEN_AMBIENT);
      });

      then(
        'the record keeps no auth, so the next send tries the bot first',
        () => {
          expect(result.onDisk?.auth).toEqual(null);
        },
      );
    });
  });

  given(
    '[case20] push, the bot token absent, no env token, a gh login on the box',
    () => {
      when('[t0] the push runs', () => {
        const result = useThen('it delivers', async () =>
          runPush({
            scene: genScene({
              slug: 'bot-absent-gh-login',
              bot: 'absent',
              env: {},
              ghLogin: TOKEN_LOGIN,
            }),
          }),
        );

        then('the push is delivered under the gh login', () => {
          expect(result.pushed.fate).toEqual('delivered');
          expect(result.seen.tokens).toEqual([TOKEN_LOGIN]);
          expect(result.seen.issues).toHaveLength(1);
          expect(result.onDisk?.recordStatus).toEqual(
            RadioTaskRecordStatus.DELIVERED,
          );
        });

        then('the line names the gh login, never its token', () => {
          const lines = asRadioAuthFallbackNotice({ fates: [result.pushed] });
          expect(lines).toEqual([
            '🦫 delivered via the gh login; the ehmpath bot token was absent',
          ]);
          expect(lines.join('\n')).not.toContain(TOKEN_LOGIN);
        });
      });
    },
  );

  given(
    '[case3] push, the bot token refused (401), GH_TOKEN in the env',
    () => {
      when('[t0] the push runs', () => {
        const result = useThen('it delivers', async () =>
          runPush({
            scene: genScene({
              slug: 'bot-refused-401',
              bot: 'granted',
              env: { GH_TOKEN: TOKEN_AMBIENT },
              refuse: { 401: [TOKEN_BOT] },
            }),
          }),
        );

        then('the push is resent and delivered under the GH_TOKEN env', () => {
          expect(result.pushed.fate).toEqual('delivered');
          expect(result.seen.tokens).toEqual([TOKEN_BOT, TOKEN_AMBIENT]);
        });

        then('the line names the 401', () => {
          expect(asRadioAuthFallbackNotice({ fates: [result.pushed] })).toEqual(
            [
              '🦫 delivered via the GH_TOKEN env; github refused the ehmpath bot token (401)',
            ],
          );
        });
      });
    },
  );

  given(
    '[case4] push, the bot token refused (403 write), GITHUB_TOKEN in the env',
    () => {
      when('[t0] the push runs', () => {
        const result = useThen('it delivers', async () =>
          runPush({
            scene: genScene({
              slug: 'bot-refused-403',
              bot: 'granted',
              env: { GITHUB_TOKEN: TOKEN_AMBIENT },
              refuse: { 403: [TOKEN_BOT] },
            }),
          }),
        );

        then('the push is delivered, and the line names the 403', () => {
          expect(result.pushed.fate).toEqual('delivered');
          expect(asRadioAuthFallbackNotice({ fates: [result.pushed] })).toEqual(
            [
              '🦫 delivered via the GITHUB_TOKEN env; github refused the ehmpath bot token (403)',
            ],
          );
        });
      });
    },
  );

  given(
    '[case5] push, the bot token refused right after its create landed',
    () => {
      when('[t0] the push runs', () => {
        const result = useThen('it delivers', async () =>
          runPush({
            scene: genScene({
              slug: 'bot-refused-after-create',
              bot: 'granted',
              env: { GITHUB_TOKEN: TOKEN_AMBIENT },
              refuse: { afterCreate401: [TOKEN_BOT] },
            }),
          }),
        );

        then(
          'the resend finds the issue the bot made, and never doubles it',
          () => {
            expect(result.pushed.fate).toEqual('delivered');
            expect(result.seen.issues).toHaveLength(1);
            expect(
              result.pushed.fate === 'delivered' ? result.pushed.outcome : null,
            ).toEqual('found');
          },
        );
      });
    },
  );

  given('[case6] push, an explicit --auth that github refuses', () => {
    when('[t0] the push runs, with GITHUB_TOKEN also in the env', () => {
      const result = useThen('it is held', async () =>
        runPush({
          scene: genScene({
            slug: 'explicit-auth-refused',
            bot: 'granted',
            env: { MY_TYPED_TOKEN: TOKEN_TYPED, GITHUB_TOKEN: TOKEN_AMBIENT },
            refuse: { 401: [TOKEN_TYPED] },
            auth: 'as-robot:env(MY_TYPED_TOKEN)',
          }),
          authTyped: 'as-robot:env(MY_TYPED_TOKEN)',
        }),
      );

      then('the push is held on the 401, with the fix named', () => {
        expect(result.pushed.fate).toEqual('held');
        expect(result.onDisk?.reason).toEqual('upstream:401');
        expect(asDetail({ fate: result.pushed })).toContain(
          'the robot token was rejected by github (401)',
        );
        const fixes = asRadioQueueFixLines({
          record: result.onDisk!,
          authOverride: null,
          detail: asDetail({ fate: result.pushed }),
          isCredentialFixShown: false,
        });
        expect(fixes[0]).toContain(
          `rhx radio.task.queue set --uuid ${result.onDisk!.key} --auth as-human`,
        );
      });

      then('the ambient credential is never used past a chosen auth', () => {
        expect(result.seen.tokens).toEqual([TOKEN_TYPED]);
      });
    });
  });

  given('[case7] push, the bot token absent, and no ambient credential', () => {
    when('[t0] the push runs', () => {
      const result = useThen('it is held', async () =>
        runPush({
          scene: genScene({ slug: 'both-absent', bot: 'absent', env: {} }),
        }),
      );

      then('the push is held as upstream:auth, and no gh call is made', () => {
        expect(result.pushed.fate).toEqual('held');
        expect(result.onDisk?.reason).toEqual('upstream:auth');
        expect(result.seen.calls).toEqual(0);
      });

      then('the detail names both credentials, each with its fix', () => {
        const detail = asDetail({ fate: result.pushed });
        expect(detail).toContain('the ehmpath bot token');
        expect(detail).toContain('rhx keyrack set --owner ehmpath');
        expect(detail).toContain(
          'no GH_TOKEN env, no GITHUB_TOKEN env, no gh login',
        );
        expect(detail).toContain('fix: gh auth login');
        expect(detail).toMatchSnapshot();
      });
    });
  });

  given(
    '[case8] push, the bot token refused, and no ambient credential',
    () => {
      when('[t0] the push runs', () => {
        const result = useThen('it is held', async () =>
          runPush({
            scene: genScene({
              slug: 'bot-refused-ambient-absent',
              bot: 'granted',
              env: {},
              refuse: { 401: [TOKEN_BOT] },
            }),
          }),
        );

        then(
          'the push is held on the 401, and both credentials are named',
          () => {
            expect(result.pushed.fate).toEqual('held');
            expect(result.onDisk?.reason).toEqual('upstream:401');
            const detail = asDetail({ fate: result.pushed });
            expect(detail).toContain(
              'github refused the ehmpath bot token (401)',
            );
            expect(detail).toContain(
              'no GH_TOKEN env, no GITHUB_TOKEN env, no gh login',
            );
          },
        );
      });
    },
  );

  given('[case9] push, the bot token absent, and the ambient refused', () => {
    when('[t0] the push runs', () => {
      const result = useThen('it is held', async () =>
        runPush({
          scene: genScene({
            slug: 'bot-absent-ambient-refused',
            bot: 'absent',
            env: { GITHUB_TOKEN: TOKEN_AMBIENT },
            refuse: { 401: [TOKEN_AMBIENT] },
          }),
        }),
      );

      then(
        'the push is held, and names which ambient source was refused',
        () => {
          expect(result.pushed.fate).toEqual('held');
          expect(result.onDisk?.reason).toEqual('upstream:401');
          const detail = asDetail({ fate: result.pushed });
          expect(detail).toContain('github auth via keyrack failed');
          expect(detail).toContain('github refused the GITHUB_TOKEN env (401)');
          expect(result.seen.tokens).toEqual([TOKEN_AMBIENT]);
        },
      );
    });
  });

  given('[case10] push, the bot token rate limited (403)', () => {
    when('[t0] the push runs, with GITHUB_TOKEN also in the env', () => {
      const result = useThen('it is held', async () =>
        runPush({
          scene: genScene({
            slug: 'bot-rate-limited',
            bot: 'granted',
            env: { GITHUB_TOKEN: TOKEN_AMBIENT },
            refuse: { rateLimit: [TOKEN_BOT] },
          }),
        }),
      );

      then(
        'the push is held as a rate limit that halts, with no fallback',
        () => {
          expect(result.pushed.fate).toEqual('held');
          expect(result.onDisk?.reason).toEqual('upstream:rate-limit');
          expect(
            result.pushed.fate === 'held' ? result.pushed.halt : null,
          ).toEqual(true);
          expect(result.seen.tokens).toEqual([TOKEN_BOT]);
        },
      );
    });
  });

  given(
    '[case18] push, the bot token absent, and the repo unseen under GITHUB_TOKEN',
    () => {
      when('[t0] the push runs', () => {
        const result = useThen('it is held', async () =>
          runPush({
            scene: genScene({
              slug: 'bot-absent-ambient-notfound',
              bot: 'absent',
              env: { GITHUB_TOKEN: TOKEN_AMBIENT },
              refuse: { notFound: [TOKEN_AMBIENT] },
            }),
          }),
        );

        then('the push is held as not-found, sent once', () => {
          expect(result.pushed.fate).toEqual('held');
          expect(result.onDisk?.reason).toEqual('upstream:not-found');
          expect(result.seen.tokens).toEqual([TOKEN_AMBIENT]);
        });

        then(
          'the detail leads with the credential it was sent under, and why',
          () => {
            const detail = asDetail({ fate: result.pushed }) ?? '';
            expect(detail.split('\n')[0]).toContain(
              'sent via the GITHUB_TOKEN env (the ehmpath bot token was absent)',
            );
            expect(detail).not.toContain(TOKEN_AMBIENT);
          },
        );
      });
    },
  );

  given('[case11] drain, a record held on an absent bot token', () => {
    const scene = useThen('a push is held with no credential', async () => {
      const staged = genScene({
        slug: 'drain-delivers-held',
        bot: 'absent',
        env: {},
      });
      const first = await runPush({ scene: staged });
      return { staged, first };
    });

    when('[t0] the box gains GITHUB_TOKEN, and the drain runs', () => {
      const result = useThen('it drains', async () =>
        runDrain({
          scene: scene.staged,
          env: genEnv({ GITHUB_TOKEN: TOKEN_AMBIENT }),
        }),
      );

      then('the held push was held as upstream:auth before', () => {
        expect(scene.first.onDisk?.reason).toEqual('upstream:auth');
      });

      then(
        'the drain delivers it under the GITHUB_TOKEN env, with the line',
        () => {
          expect(result.onDisk?.recordStatus).toEqual(
            RadioTaskRecordStatus.DELIVERED,
          );
          expect(asRadioAuthFallbackNotice({ fates: result.fates })).toEqual([
            '🦫 delivered via the GITHUB_TOKEN env; the ehmpath bot token was absent',
          ]);
        },
      );
    });
  });

  given('[case12] drain, the bot token present and accepted', () => {
    when('[t0] the drain runs', () => {
      const result = useThen('it drains', async () =>
        runDrain({
          scene: genScene({
            slug: 'drain-bot-accepted',
            bot: 'granted',
            env: { GITHUB_TOKEN: TOKEN_AMBIENT },
          }),
        }),
      );

      then('the record is delivered under the bot token, with no line', () => {
        expect(result.onDisk?.recordStatus).toEqual(
          RadioTaskRecordStatus.DELIVERED,
        );
        expect(result.seen.tokens).toEqual([TOKEN_BOT]);
        expect(asRadioAuthFallbackNotice({ fates: result.fates })).toEqual([]);
      });
    });
  });

  given('[case13] drain --auth, which github refuses', () => {
    when('[t0] the drain runs, with GITHUB_TOKEN also in the env', () => {
      const result = useThen('it drains', async () => {
        const staged = genScene({
          slug: 'drain-auth-refused',
          bot: 'granted',
          env: { MY_TYPED_TOKEN: TOKEN_TYPED, GITHUB_TOKEN: TOKEN_AMBIENT },
          refuse: { 401: [TOKEN_TYPED] },
        });
        return runDrain({
          scene: staged,
          authOverride: 'as-robot:env(MY_TYPED_TOKEN)',
        });
      });

      then('the record is held on the 401, and the ambient never used', () => {
        expect(result.onDisk?.recordStatus).toEqual(
          RadioTaskRecordStatus.QUEUED,
        );
        expect(result.onDisk?.reason).toEqual('upstream:401');
        expect(result.seen.tokens).toEqual([TOKEN_TYPED]);
        expect(asRadioAuthFallbackNotice({ fates: result.fates })).toEqual([]);
      });

      then('the drain names the fix for the auth it was sent under', () => {
        const held = result.fates.find((fate) => fate.fate === 'held');
        const fixes = asRadioQueueFixLines({
          record: result.onDisk!,
          authOverride: 'as-robot:env(MY_TYPED_TOKEN)',
          detail: held ? asDetail({ fate: held }) : null,
          isCredentialFixShown: false,
        });
        expect(fixes[0]).toContain(
          `rhx radio.task.queue set --uuid ${result.onDisk!.key} --auth as-human`,
        );
      });
    });
  });

  given(
    '[case14] drain, the bot token absent, and no ambient credential',
    () => {
      when('[t0] the drain runs', () => {
        const result = useThen('it drains', async () => {
          const staged = genScene({
            slug: 'drain-both-absent',
            bot: 'absent',
            env: {},
          });
          // a second held record, so the drain meets two
          setRadioTaskRecordFromPush(
            {
              push: {
                repo: new RadioTaskRepo({
                  owner: 'sandpine',
                  name: 'svc-lessons',
                }),
                via: RadioChannel.GH_ISSUES,
                auth: null,
                idem: null,
                title: 'wetsuit restock for the dawn lesson',
                description: 'restock the size m wetsuits',
                exid: null,
                status: null,
              },
            },
            { dir: staged.dir, cwd: staged.cwd },
          );
          return { ...(await runDrain({ scene: staged })), dir: staged.dir };
        });

        then(
          'both records stay held as upstream:auth, each names both credentials with its fix',
          () => {
            const records = daoRadioTaskRecord.get.all({ dirs: [result.dir] });
            expect(records).toHaveLength(2);
            expect(records.map((found) => found.record.reason)).toEqual([
              'upstream:auth',
              'upstream:auth',
            ]);
            const details = result.fates
              .filter((fate) => fate.fate === 'held')
              .map((fate) => asDetail({ fate }) ?? '');
            expect(details).toHaveLength(2);
            for (const detail of details) {
              expect(detail).toContain('rhx keyrack set --owner ehmpath');
              expect(detail).toContain(
                'no GH_TOKEN env, no GITHUB_TOKEN env, no gh login',
              );
              expect(detail).toContain('fix: gh auth login');
            }
            expect(result.seen.calls).toEqual(0);
          },
        );
      });
    },
  );

  given(
    '[case15] drain, three records — two on the default auth, one on a stored auth — and the bot token refused',
    () => {
      when('[t0] the drain runs, with GITHUB_TOKEN in the env', () => {
        const result = useThen('it drains', async () => {
          // record A: default auth, from the scene
          const staged = genScene({
            slug: 'drain-mixed',
            bot: 'granted',
            env: { MY_TYPED_TOKEN: TOKEN_TYPED, GITHUB_TOKEN: TOKEN_AMBIENT },
            refuse: { 401: [TOKEN_BOT, TOKEN_TYPED] },
          });

          // record B: a stored, replayable auth that github refuses
          const { record: recordB } = setRadioTaskRecordFromPush(
            {
              push: {
                repo: staged.record.repo,
                via: RadioChannel.GH_ISSUES,
                idem: null,
                exid: null,
                status: null,
                auth: 'as-robot:env(MY_TYPED_TOKEN)',
                title: 'wetsuit inventory count',
                description: 'count the wetsuits',
              },
            },
            { dir: staged.dir, cwd: staged.cwd },
          );

          // record C: default auth
          const { record: recordC } = setRadioTaskRecordFromPush(
            {
              push: {
                repo: staged.record.repo,
                via: RadioChannel.GH_ISSUES,
                idem: null,
                exid: null,
                status: null,
                auth: null,
                title: 'board rental reminder',
                description: 'remind the surfer to return the board',
              },
            },
            { dir: staged.dir, cwd: staged.cwd },
          );
          const drained = await runDrain({ scene: staged });
          const onDiskOf = (key: string) =>
            daoRadioTaskRecord.get.one.byUnique({ dir: staged.dir, key });
          return {
            ...drained,
            keys: [staged.record.key, recordB.key, recordC.key],
            onDiskB: onDiskOf(recordB.key),
            onDiskC: onDiskOf(recordC.key),
          };
        });

        then('A and C, on the default auth, deliver under the ambient', () => {
          expect(result.onDisk?.recordStatus).toEqual(
            RadioTaskRecordStatus.DELIVERED,
          );
          expect(result.onDiskC?.recordStatus).toEqual(
            RadioTaskRecordStatus.DELIVERED,
          );
        });

        then(
          'B, on its chosen auth, is held on the 401, never fallen back past',
          () => {
            expect(result.onDiskB?.recordStatus).toEqual(
              RadioTaskRecordStatus.QUEUED,
            );
            expect(result.onDiskB?.reason).toEqual('upstream:401');
            const fateB = result.fates.find(
              (fate) => fate.record.key === result.keys[1],
            );
            expect(fateB && asDetail({ fate: fateB })).not.toContain(
              'no credential could send',
            );
          },
        );

        then('B names the fix for the auth it was stored with', () => {
          const fateB = result.fates.find(
            (fate) => fate.record.key === result.keys[1],
          );
          const fixes = asRadioQueueFixLines({
            record: result.onDiskB!,
            authOverride: null,
            detail: fateB ? asDetail({ fate: fateB }) : null,
            isCredentialFixShown: false,
          });
          expect(fixes[0]).toContain(
            `rhx radio.task.queue set --uuid ${result.onDiskB!.key} --auth as-human`,
          );
        });

        then('the fates keep the queue order', () => {
          expect(result.fates.map((fate) => fate.record.key)).toEqual(
            result.keys,
          );
        });

        then('one line prints for the drain, not one per record', () => {
          expect(asRadioAuthFallbackNotice({ fates: result.fates })).toEqual([
            '🦫 delivered via the GITHUB_TOKEN env; github refused the ehmpath bot token (401)',
          ]);
        });
      });
    },
  );

  given(
    '[case16] push, the bot token refused (401), then the ambient refused (403) on its resend',
    () => {
      when('[t0] the push runs', () => {
        const result = useThen('it is held', async () =>
          runPush({
            scene: genScene({
              slug: 'bot-refused-ambient-refused',
              bot: 'granted',
              env: { GITHUB_TOKEN: TOKEN_AMBIENT },
              refuse: { 401: [TOKEN_BOT], 403: [TOKEN_AMBIENT] },
            }),
          }),
        );

        then(
          'the push is held on the resend refusal, and both credentials are named',
          () => {
            expect(result.pushed.fate).toEqual('held');
            expect(result.onDisk?.reason).toEqual('upstream:access');
            const detail = asDetail({ fate: result.pushed });
            expect(detail).toContain(
              'github refused the ehmpath bot token (401)',
            );
            expect(detail).toContain(
              'github refused the GITHUB_TOKEN env (403)',
            );
          },
        );

        then('each credential was tried once, and no issue landed', () => {
          expect(result.seen.tokens).toEqual([TOKEN_BOT, TOKEN_AMBIENT]);
          expect(result.seen.issues).toEqual([]);
        });
      });
    },
  );

  given(
    '[case17] push, the bot token refused (401), then the ambient resend rate limited',
    () => {
      when('[t0] the push runs', () => {
        const result = useThen('it is held', async () =>
          runPush({
            scene: genScene({
              slug: 'bot-refused-ambient-ratelimit',
              bot: 'granted',
              env: { GITHUB_TOKEN: TOKEN_AMBIENT },
              refuse: { 401: [TOKEN_BOT], rateLimit: [TOKEN_AMBIENT] },
            }),
          }),
        );

        then(
          'the push is held on the resend own fault, a rate limit that halts, never both-failed',
          () => {
            expect(result.pushed.fate).toEqual('held');
            expect(result.onDisk?.reason).toEqual('upstream:rate-limit');
            expect(
              result.pushed.fate === 'held' ? result.pushed.halt : null,
            ).toEqual(true);
            expect(asDetail({ fate: result.pushed })).not.toContain(
              'github auth failed:',
            );
          },
        );
      });
    },
  );

  given(
    '[case19] push of a task whose title names gh_token, the bot token rate limited',
    () => {
      when('[t0] the push runs', () => {
        const result = useThen('it is held', async () =>
          runPush({
            scene: genScene({
              slug: 'title-names-gh_token',
              bot: 'granted',
              env: { GITHUB_TOKEN: TOKEN_AMBIENT },
              refuse: { rateLimitOnCreate: [TOKEN_BOT] },
            }),
          }),
        );

        then(
          'the title never fakes a 401: the push holds on the rate limit, halts, sent once',
          () => {
            expect(result.pushed.fate).toEqual('held');
            expect(result.onDisk?.reason).toEqual('upstream:rate-limit');
            expect(
              result.pushed.fate === 'held' ? result.pushed.halt : null,
            ).toEqual(true);
            expect(result.seen.tokens).toEqual([TOKEN_BOT]);
          },
        );
      });
    },
  );
});
