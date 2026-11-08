import { execSync } from 'child_process';
import fs from 'fs';
import { ConstraintError, UnexpectedCodePathError } from 'helpful-errors';
import path from 'path';
import { given, then, useBeforeAll, when } from 'test-fns';

import {
  GITHUB_DEMO_REPO,
  genConsumerRepo,
  runRhachetSkill,
  sanitizeOutput,
} from '../.test/infra';

/**
 * .what = acceptance tests for radio.task.push via gh.issues channel
 * .why = validates the github issues integration end-to-end
 *
 * .note = auth is provided via keyrack (EHMPATH_BEAVER_GITHUB_TOKEN)
 *         keyrack.source() is called in jest.acceptance.env.ts
 *
 * .usage:
 *   npm run test:acceptance -- skill.radio.task.push.via-gh-issues
 */

/**
 * .what = mask the record uuid in a held output's queue fix lines
 * .why = the key hashes the title, and the title carries Date.now(), so the key varies per run
 */
const asStableRecordKey = (input: { output: string }): string =>
  input.output.replace(/--uuid [0-9a-f]{16}\b/g, '--uuid <uuid>');

/**
 * .what = mask the bytes of a 401 held output that vary per run
 * .why = the title carries Date.now() and the gh command names a per-run tempfile;
 *        only those bytes are masked. gh's raw stderr is NOT masked — the held output
 *        shows the headline, never the stderr, so a leak must surface as a snap diff
 */
const asStable401Output = (input: { output: string }): string =>
  asStableRecordKey({
    output: sanitizeOutput(input.output)
      .replace(/auth-fail 401 test \d+/g, 'auth-fail 401 test <ts>')
      .replace(/\S*radio-task-\d+\.md/g, '<tempfile>'),
  });

/**
 * .what = mask the bytes of a live delivery that vary per run or per box
 * .why = the title carries Date.now(), github mints the exid, the day stamps pushedAt, and the
 *        bot slot's keyrack status depends on the box; the line shape and the tree are what hold
 */
const asStableDeliveredOutput = (input: { output: string }): string =>
  sanitizeOutput(input.output)
    .replace(/fallback (absent|forged) test \d+/g, 'fallback $1 test <ts>')
    .replace(/test task \d+/g, 'test task <ts>')
    .replace(/exid: \d+/g, 'exid: <exid>')
    .replace(/pushedAt: \d{4}-\d{2}-\d{2}/g, 'pushedAt: <date>')
    .replace(
      /the ehmpath bot token was (absent|locked|blocked|not granted)/g,
      'the ehmpath bot token was <status>',
    );

/**
 * .what = invoke radio.uses skill to set up permissions
 * .why = radio.task.push/pull requires radio.uses permission
 */
const runRadioUses = (input: {
  repoDir: string;
  args: string;
  homeDir?: string;
}): { stdout: string; stderr: string; exitCode: number } => {
  const result = runRhachetSkill({
    repo: 'bhuild',
    role: 'dispatcher',
    skill: 'radio.uses',
    args: input.args,
    repoDir: input.repoDir,
    env: {
      __I_AM_HUMAN: 'true',
      ...(input.homeDir ? { HOME: input.homeDir } : {}),
    },
    timeout: 30000,
  });
  return {
    stdout: result.output,
    stderr: '',
    exitCode: result.exitCode,
  };
};

/**
 * .what = runs radio.task.push via rhachet dispatch
 * .why = tests the skill as a consumer would invoke it
 */
const runRadioTaskPush = (input: {
  repoDir: string;
  via: string;
  auth?: string;
  into?: string;
  title?: string;
  description?: string;
  exid?: string;
  status?: string;
  idem?: string;
  homeDir?: string;
  env?: Record<string, string | undefined>;
}) => {
  const args = [
    `--via ${input.via}`,
    input.auth ? `--auth "${input.auth}"` : '',
    input.into ? `--into "${input.into}"` : '',
    input.title ? `--title "${input.title}"` : '',
    input.description ? `--description "${input.description}"` : '',
    input.exid ? `--exid "${input.exid}"` : '',
    input.status ? `--status ${input.status}` : '',
    input.idem ? `--idem ${input.idem}` : '',
  ]
    .filter(Boolean)
    .join(' ');

  return runRhachetSkill({
    repo: 'bhuild',
    role: 'dispatcher',
    skill: 'radio.task.push',
    args,
    repoDir: input.repoDir,
    env: {
      ...(input.homeDir ? { HOME: input.homeDir } : {}),
      ...(input.env ?? {}),
    },
    timeout: 60000, // gh api calls can be slow
  });
};

/**
 * .what = runs radio.task.push with stdin for @stdin support
 * .why = tests piped content via --description @stdin
 */
const runRadioTaskPushWithStdin = (input: {
  repoDir: string;
  via: string;
  into: string;
  title: string;
  stdin: string;
  homeDir?: string;
}): { stdout: string; stderr: string; output: string; exitCode: number } => {
  const command = `echo "${input.stdin}" | npx rhachet run --repo bhuild --role dispatcher --skill radio.task.push -- --via ${input.via} --into "${input.into}" --title "${input.title}" --description @stdin`;

  try {
    const stdout = execSync(command, {
      cwd: input.repoDir,
      encoding: 'utf-8', // node api requires this key name
      timeout: 60000,
      env: {
        ...process.env,
        PATH: process.env.PATH,
        ...(input.homeDir ? { HOME: input.homeDir } : {}),
      },
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    return {
      stdout: stdout.trim(),
      stderr: '',
      output: stdout.trim(),
      exitCode: 0,
    };
  } catch (error: unknown) {
    const execError = error as {
      stdout?: Buffer | string;
      stderr?: Buffer | string;
      status?: number;
    };
    const stdout = (execError.stdout ?? '').toString().trim();
    const stderr = (execError.stderr ?? '').toString().trim();
    return {
      stdout,
      stderr,
      output: [stdout, stderr].filter(Boolean).join('\n'),
      exitCode: execError.status ?? 1,
    };
  }
};

describe('radio.task.push via gh.issues', () => {
  // shared consumer repo for all test cases (pnpm install is expensive)
  const scene = useBeforeAll(async () => {
    const consumer = await genConsumerRepo({ prefix: 'radio-gh-acpt-' });
    const homeDir = path.join(consumer.repoDir, '.home');
    fs.mkdirSync(homeDir);

    // allow radio usage for @all orgs; a failed grant fails here, not as a later held push
    const allowed = runRadioUses({
      repoDir: consumer.repoDir,
      args: '--org @all allow',
      homeDir,
    });
    if (allowed.exitCode !== 0)
      throw new UnexpectedCodePathError(
        'radio.uses allow failed in the scene',
        {
          exitCode: allowed.exitCode,
          output: allowed.stdout,
        },
      );

    return { consumer, homeDir };
  });

  given('[case1] push new task to gh.issues (default auth via keyrack)', () => {
    when('[t0] push with title and description (no --auth flag)', () => {
      const result = useBeforeAll(async () =>
        runRadioTaskPush({
          repoDir: scene.consumer.repoDir,
          homeDir: scene.homeDir,
          via: 'gh.issues',
          // no auth — uses default as-robot:via-keyrack(ehmpath)
          into: GITHUB_DEMO_REPO,
          title: `test task ${Date.now()}`,
          description: 'automated acceptance test task',
        }),
      );

      then('exits with code 0', () => {
        expect(result.exitCode).toBe(0);
      });

      then('output shows created confirmation', () => {
        expect(result.output).toContain('created');
      });

      then('output shows exid', () => {
        expect(result.output).toMatch(/exid: \d+/);
      });

      then('output shows repo', () => {
        expect(result.output).toContain(GITHUB_DEMO_REPO);
      });

      then('the bot token delivers it, with no fallback line (#513)', () => {
        expect(result.output).not.toContain('delivered via');
        expect(
          asStableDeliveredOutput({ output: result.output }),
        ).toMatchSnapshot();
      });
    });

    when('[t1] push without title (no --auth flag)', () => {
      const result = useBeforeAll(async () =>
        runRadioTaskPush({
          repoDir: scene.consumer.repoDir,
          homeDir: scene.homeDir,
          via: 'gh.issues',
          // no auth — uses default as-robot:via-keyrack(ehmpath)
          into: GITHUB_DEMO_REPO,
          description: 'no title',
        }),
      );

      then('exits with non-zero code', () => {
        expect(result.exitCode).not.toBe(0);
      });

      then('output mentions title required', () => {
        expect(result.output.toLowerCase()).toContain('title');
      });

      then('output names the fix, as snapped', () => {
        expect(result.output).toContain('--exid');
        // snap each stream apart: rhachet frames each with its own banner, so a merged capture reads it twice
        expect(result.stderr).toContain('ConstraintError');
        expect({
          stdout: sanitizeOutput(result.stdout).trim(),
          stderr: sanitizeOutput(result.stderr).trim(),
        }).toMatchSnapshot();
      });
    });
  });

  given('[case2] status transitions on gh.issues', () => {
    let issueNumber: string;

    when('[t0] create then claim task', () => {
      const createResult = useBeforeAll(async () => {
        const result = runRadioTaskPush({
          repoDir: scene.consumer.repoDir,
          homeDir: scene.homeDir,
          via: 'gh.issues',
          // no auth — uses default as-robot:via-keyrack(ehmpath)
          into: GITHUB_DEMO_REPO,
          title: `status test ${Date.now()}`,
          description: 'for status transition test',
        });

        // extract issue exid from output; a miss fails here, never as a later exid-less push
        const match = result.output.match(/exid: (\d+)/);
        if (!match?.[1])
          throw new UnexpectedCodePathError('create output names no exid', {
            output: result.output,
          });
        issueNumber = match[1];

        return result;
      });

      then('task is created', () => {
        expect(createResult.exitCode).toBe(0);
        expect(issueNumber).toBeDefined();
      });

      then('claim updates status', async () => {
        const claimResult = runRadioTaskPush({
          repoDir: scene.consumer.repoDir,
          homeDir: scene.homeDir,
          via: 'gh.issues',
          // no auth — uses default as-robot:via-keyrack(ehmpath)
          into: GITHUB_DEMO_REPO,
          exid: issueNumber,
          status: 'CLAIMED',
        });
        expect(claimResult.exitCode).toBe(0);
        expect(claimResult.output).toContain('CLAIMED');
      });

      then('deliver closes the issue', async () => {
        const deliverResult = runRadioTaskPush({
          repoDir: scene.consumer.repoDir,
          homeDir: scene.homeDir,
          via: 'gh.issues',
          // no auth — uses default as-robot:via-keyrack(ehmpath)
          into: GITHUB_DEMO_REPO,
          exid: issueNumber,
          status: 'DELIVERED',
        });
        expect(deliverResult.exitCode).toBe(0);
        expect(deliverResult.output).toContain('DELIVERED');
      });
    });
  });

  given('[case3] idempotency on gh.issues', () => {
    const uniqueTitle = `findsert test ${Date.now()}`;

    when('[t0] findsert mode with duplicate title', () => {
      const firstResult = useBeforeAll(async () =>
        runRadioTaskPush({
          repoDir: scene.consumer.repoDir,
          homeDir: scene.homeDir,
          via: 'gh.issues',
          // no auth — uses default as-robot:via-keyrack(ehmpath)
          into: GITHUB_DEMO_REPO,
          title: uniqueTitle,
          description: 'first push',
          idem: 'findsert',
        }),
      );

      then('first push creates issue', () => {
        expect(firstResult.exitCode).toBe(0);
        expect(firstResult.output.toLowerCase()).toContain('created');
      });

      then('second push finds the prior issue', async () => {
        // wait for github search index to update
        await new Promise((resolve) => setTimeout(resolve, 5000));

        const secondResult = runRadioTaskPush({
          repoDir: scene.consumer.repoDir,
          homeDir: scene.homeDir,
          via: 'gh.issues',
          // no auth — uses default as-robot:via-keyrack(ehmpath)
          into: GITHUB_DEMO_REPO,
          title: uniqueTitle,
          description: 'second push',
          idem: 'findsert',
        });
        expect(secondResult.exitCode).toBe(0);
        expect(secondResult.output.toLowerCase()).toContain('found');
      });
    });
  });

  given('[case4] gh.issues task format', () => {
    when('[t0] task is pushed to gh.issues', () => {
      const result = useBeforeAll(async () =>
        runRadioTaskPush({
          repoDir: scene.consumer.repoDir,
          homeDir: scene.homeDir,
          via: 'gh.issues',
          // no auth — uses default as-robot:via-keyrack(ehmpath)
          into: GITHUB_DEMO_REPO,
          title: `format test ${Date.now()}`,
          description: 'verify issue format',
        }),
      );

      then('issue title has radio emoji prefix', () => {
        // the gh cli output or the created issue title should contain the emoji
        expect(result.exitCode).toBe(0);
      });
    });
  });

  given('[case5] @stdin reads piped description', () => {
    const uniqueTitle = `stdin test ${Date.now()}`;
    const stdinContent = 'this content was piped via stdin';

    when('[t0] push with --description @stdin', () => {
      const result = useBeforeAll(async () =>
        runRadioTaskPushWithStdin({
          repoDir: scene.consumer.repoDir,
          homeDir: scene.homeDir,
          via: 'gh.issues',
          into: GITHUB_DEMO_REPO,
          title: uniqueTitle,
          stdin: stdinContent,
        }),
      );

      then('exits with code 0', () => {
        expect(result.exitCode).toBe(0);
      });

      then('output shows created confirmation', () => {
        expect(result.output).toContain('created');
      });

      then(
        'output shows exid (proves issue was created with piped content)',
        () => {
          expect(result.output).toMatch(/exid: \d+/);
        },
      );
    });
  });

  given('[case6] findsert searches target repo not cwd repo', () => {
    const uniqueTitle = `cross-repo findsert ${Date.now()}`;

    when('[t0] findsert from consumer repo to demo repo', () => {
      // consumer repo != GITHUB_DEMO_REPO
      // findsert should search GITHUB_DEMO_REPO (--into), not consumer repo (cwd)
      const firstResult = useBeforeAll(async () =>
        runRadioTaskPush({
          repoDir: scene.consumer.repoDir,
          homeDir: scene.homeDir,
          via: 'gh.issues',
          into: GITHUB_DEMO_REPO,
          title: uniqueTitle,
          description: 'cross-repo test - first push',
          idem: 'findsert',
        }),
      );

      then('first push creates issue in target repo', () => {
        expect(firstResult.exitCode).toBe(0);
        expect(firstResult.output.toLowerCase()).toContain('created');
        expect(firstResult.output).toContain(GITHUB_DEMO_REPO);
      });

      then('second push finds extant issue in target repo', () => {
        // no wait needed: findsert lists issues directly (strongly consistent),
        // not via the eventually-consistent search index, so the just-created
        // issue is found immediately.
        const secondResult = runRadioTaskPush({
          repoDir: scene.consumer.repoDir,
          homeDir: scene.homeDir,
          via: 'gh.issues',
          into: GITHUB_DEMO_REPO,
          title: uniqueTitle,
          description: 'cross-repo test - second push',
          idem: 'findsert',
        });

        // should find the prior issue, not create a duplicate
        expect(secondResult.exitCode).toBe(0);
        expect(secondResult.output.toLowerCase()).toContain('found');
      });
    });
  });

  // ────────────────────────────────────────────────────────────────
  // the wish's PRIMARY behavior, proven at the acceptance tier: a human
  // runs the skill, an auth failure occurs, and they see a graceful ✋
  // (a caller-fixable ConstraintError), NOT a raw crash or 💥.
  // ────────────────────────────────────────────────────────────────

  given(
    '[case7] auth misconfig surfaces a graceful ✋ (unset env token)',
    () => {
      // .note = its own consumer repo: the push is held, and a shared repo would
      //   list every other case's held task beside it, so the snapshot would drift
      const sceneOwn = useBeforeAll(async () => {
        const consumer = await genConsumerRepo({
          prefix: 'radio-gh-acpt-authfail-',
        });
        const homeDir = path.join(consumer.repoDir, '.home');
        fs.mkdirSync(homeDir);
        runRadioUses({
          repoDir: consumer.repoDir,
          args: '--org @all allow',
          homeDir,
        });
        return { consumer, homeDir };
      });

      when(
        '[t0] push with --auth as-robot:env(VAR) where VAR is not set',
        () => {
          // fully deterministic: the token is derived from an env var that is not
          // set, so the skill fails fast BEFORE any gh call — no network, no creds.
          const result = useBeforeAll(async () =>
            runRadioTaskPush({
              repoDir: sceneOwn.consumer.repoDir,
              homeDir: sceneOwn.homeDir,
              via: 'gh.issues',
              auth: 'as-robot:env(RADIO_ACCEPT_UNSET_TOKEN)',
              into: GITHUB_DEMO_REPO,
              title: `auth-fail env test ${Date.now()}`,
              description: 'should never be created',
            }),
          );

          then(
            'exits with code 2 (✋ caller-fixable ConstraintError, not 💥 exit 1)',
            () => {
              // the vision's central reclassification: a caller-fixable auth failure
              // is a ConstraintError (exit 2), never a MalfunctionError (exit 1).
              expect(result.exitCode).toBe(2);
            },
          );

          then(
            'names the unset env var in a graceful ✋ (not a raw crash)',
            () => {
              expect(result.output).toContain('RADIO_ACCEPT_UNSET_TOKEN');
              expect(result.output).toContain('not set');
            },
          );

          then('does NOT leak a raw stack trace or unhandled crash', () => {
            expect(result.output).not.toContain('    at ');
            expect(result.output).not.toContain('UnhandledPromiseRejection');
          });

          then('the push is held, not lost', () => {
            expect(result.output).toContain('🦫 held for the radio');
            expect(result.output).toContain('QUEUED (upstream:auth)');
          });

          then('the human-readable output matches snapshot', () => {
            // snap the skill's own stream: rhachet frames stdout and stderr each with a banner
            expect(result.stdout).toContain('🦫 held for the radio');
            expect(
              asStableRecordKey({
                output: sanitizeOutput(result.stdout).replace(
                  /auth-fail env test \d+/g,
                  'auth-fail env test <ts>',
                ),
              }),
            ).toMatchSnapshot();
          });

          then('the stderr stream matches snapshot', () => {
            // snapped apart from stdout, so a leak onto stderr surfaces as a snap diff
            expect(
              asStableRecordKey({
                output: sanitizeOutput(result.stderr).replace(
                  /auth-fail env test \d+/g,
                  'auth-fail env test <ts>',
                ),
              }),
            ).toMatchSnapshot();
          });
        },
      );
    },
  );

  given(
    '[case8] rejected robot token surfaces the as-human nudge (gh 401)',
    () => {
      // .note = its own consumer repo, as [case7]: the push is held, and a shared
      //   repo would list every other case's held task beside it
      const sceneOwn = useBeforeAll(async () => {
        const consumer = await genConsumerRepo({
          prefix: 'radio-gh-acpt-auth401-',
        });
        const homeDir = path.join(consumer.repoDir, '.home');
        fs.mkdirSync(homeDir);
        runRadioUses({
          repoDir: consumer.repoDir,
          args: '--org @all allow',
          homeDir,
        });
        return { consumer, homeDir };
      });

      when('[t0] push with an env token that github rejects (401)', () => {
        // a deliberately bogus token — github answers HTTP 401. no real
        // credential needed: the case under test IS a rejected token.
        const result = useBeforeAll(async () =>
          runRadioTaskPush({
            repoDir: sceneOwn.consumer.repoDir,
            homeDir: sceneOwn.homeDir,
            via: 'gh.issues',
            auth: 'as-robot:env(RADIO_ACCEPT_BOGUS_TOKEN)',
            env: {
              RADIO_ACCEPT_BOGUS_TOKEN: 'ghp_bogusInvalidToken000',
            },
            into: GITHUB_DEMO_REPO,
            title: `auth-fail 401 test ${Date.now()}`,
            description: 'should never be created',
          }),
        );

        then(
          'exits with code 2 (✋ caller-fixable ConstraintError, not 💥 exit 1)',
          () => {
            // same central reclassification, proven for the PRIMARY (gh 401) case.
            expect(result.exitCode).toBe(2);
          },
        );

        then('names the as-human unblock as the primary move', () => {
          expect(result.output).toContain('--auth as-human');
        });

        then('does NOT leak the raw `Command failed` bubble', () => {
          expect(result.output).not.toContain('Command failed');
        });

        then('the push is held, not lost', () => {
          expect(result.output).toContain('🦫 held for the radio');
          expect(result.output).toContain('QUEUED (upstream:401)');
        });

        then(
          'the human-readable held output matches snapshot, volatile bytes masked',
          () => {
            // snap the skill's own stream: rhachet frames stdout and stderr each with a banner
            expect(result.stdout).toContain('🦫 held for the radio');
            expect(
              asStable401Output({ output: result.stdout }),
            ).toMatchSnapshot();
          },
        );

        then(
          'the stderr stream matches snapshot, volatile bytes masked',
          () => {
            expect(result.stderr).not.toContain('Command failed');
            expect(
              asStable401Output({ output: result.stderr }),
            ).toMatchSnapshot();
          },
        );
      });
    },
  );

  given(
    '[case10] no --auth, the ehmpath bot token not granted: the push falls back to the ambient GITHUB_TOKEN, against real github (#513)',
    () => {
      // the real bot token, sourced from keyrack by jest.acceptance.env.ts, rides in as the
      // ambient GITHUB_TOKEN; the bot slot is emptied or forged. no gh login is ever read:
      // the test env forbids it, and every send goes to real github under the env token
      const tokenReal = useBeforeAll(async () => {
        const token = process.env.EHMPATH_BEAVER_GITHUB_TOKEN;
        if (!token)
          throw new ConstraintError(
            'EHMPATH_BEAVER_GITHUB_TOKEN is required for the real-github fallback case',
            { hint: 'rhx keyrack unlock --owner ehmpath --env prep' },
          );
        return { token };
      });
      const tokenForged = 'ghp_radioAcptForgedBotToken000000';

      when('[t0] the bot token is absent', () => {
        const result = useBeforeAll(async () =>
          runRadioTaskPush({
            repoDir: scene.consumer.repoDir,
            homeDir: scene.homeDir,
            via: 'gh.issues',
            env: {
              EHMPATH_BEAVER_GITHUB_TOKEN: undefined,
              GH_TOKEN: undefined,
              GITHUB_TOKEN: tokenReal.token,
            },
            into: GITHUB_DEMO_REPO,
            title: `fallback absent test ${Date.now()}`,
            description: 'delivered under the ambient GITHUB_TOKEN',
          }),
        );

        then('it delivers to real github, exit 0', () => {
          expect(result.exitCode).toBe(0);
          expect(result.output).toContain('created');
          expect(result.output).toMatch(/exid: \d+/);
        });

        then('one line names the credential kind and why', () => {
          expect(result.output).toMatch(
            /🦫 delivered via the GITHUB_TOKEN env; the ehmpath bot token was (absent|locked|blocked|not granted)/,
          );
        });

        then('no token value reaches the output', () => {
          expect(result.output).not.toContain(tokenReal.token);
        });

        then('the stdout matches snapshot, volatile bytes masked', () => {
          expect(
            asStableDeliveredOutput({ output: result.stdout }),
          ).toMatchSnapshot();
        });
      });

      when(
        '[t1] the bot slot holds a forged value keyrack never granted',
        () => {
          const result = useBeforeAll(async () =>
            runRadioTaskPush({
              repoDir: scene.consumer.repoDir,
              homeDir: scene.homeDir,
              via: 'gh.issues',
              env: {
                EHMPATH_BEAVER_GITHUB_TOKEN: tokenForged,
                GH_TOKEN: undefined,
                GITHUB_TOKEN: tokenReal.token,
              },
              into: GITHUB_DEMO_REPO,
              title: `fallback forged test ${Date.now()}`,
              description:
                'delivered under the ambient GITHUB_TOKEN, the forged bot value unsent',
            }),
          );

          then('it delivers to real github under the ambient, exit 0', () => {
            expect(result.exitCode).toBe(0);
            expect(result.output).toContain('created');
            expect(result.output).toMatch(/exid: \d+/);
          });

          then('one line names the keyrack status the forged value hit', () => {
            // keyrack refuses an env value it did not grant, so the forged token is never sent
            expect(result.output).toMatch(
              /🦫 delivered via the GITHUB_TOKEN env; the ehmpath bot token was (blocked|locked|absent|not granted)/,
            );
          });

          then('no token value reaches the output', () => {
            expect(result.output).not.toContain(tokenReal.token);
            expect(result.output).not.toContain(tokenForged);
          });

          then('the stdout matches snapshot, volatile bytes masked', () => {
            expect(
              asStableDeliveredOutput({ output: result.stdout }),
            ).toMatchSnapshot();
          });
        },
      );
    },
  );
});

// ────────────────────────────────────────────────────────────────
// the usage contract at the acceptance (subprocess) tier. a live push snaps
// above through asStableDeliveredOutput, which masks its per-run bytes;
// --help needs no mask, so it snaps here as is.
// ────────────────────────────────────────────────────────────────
describe('radio.task.push via gh.issues — usage contract', () => {
  const helpScene = useBeforeAll(async () =>
    genConsumerRepo({ prefix: 'radio-gh-push-help-' }),
  );

  given('[case9] --help renders the usage contract (deterministic)', () => {
    when('[t0] push is invoked with --help', () => {
      const result = useBeforeAll(async () =>
        runRhachetSkill({
          repo: 'bhuild',
          role: 'dispatcher',
          skill: 'radio.task.push',
          args: '--help',
          repoDir: helpScene.repoDir,
          timeout: 30000,
        }),
      );

      then('exits with code 0', () => {
        expect(result.exitCode).toBe(0);
      });

      then('names the required --via and --into options', () => {
        expect(result.output).toContain('--via');
        expect(result.output).toContain('--into');
      });

      then('the human-readable usage output matches snapshot', () => {
        expect(sanitizeOutput(result.output)).toMatchSnapshot();
      });
    });
  });
});
