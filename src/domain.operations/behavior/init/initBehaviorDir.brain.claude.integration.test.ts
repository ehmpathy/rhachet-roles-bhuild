import { spawnSync } from 'child_process';
import { ConstraintError, MalfunctionError } from 'helpful-errors';
import path from 'path';
import { getAllStones } from 'rhachet-roles-bhrain/sdk/route';
import { genTempDir, given, then, useBeforeAll, when } from 'test-fns';

import { getAllPeerLanesWithBrain } from '../../../.test/utils/getAllPeerLanesWithBrain';
import { initBehaviorDir } from './initBehaviorDir';

/**
 * .what = proves the real claude cli accepts every claude brain string the guard templates prescribe
 * .why  = the brain strings are an external contract: bhrain hands a stone's `brain:` to claude
 *         code (`/model <choice>`), and each reviewer lane hands its `--model` to `claude`. a typo or
 *         a renamed id passes every template test and malfunctions in every consumer route, so one
 *         real call per distinct string must go red here first
 *
 * .note = the calls take their strings from init'd routes via bhrain's own parser, so a new or
 *         changed prescription is called with no edit here. only `[t0]` pins the expected pair,
 *         so a brain bump edits that one assertion on purpose
 * .note = `--model` and `/model` take the same names, aliases, and `[1m]` suffix, per
 *         https://code.claude.com/docs/en/model-config ("each entry accepts a model name or alias";
 *         "you can also use the `[1m]` suffix with model aliases or full model names")
 */

/**
 * .note = the cli is fetched via npx into npx's own cache, never installed as a devDep: a
 *         `node_modules/.bin/claude` would shadow the stub `claude` the acceptance journeys
 *         bind on PATH, and route their reviewer lanes to the real, paid cli
 */
const CLAUDE_CLI_PACKAGE = '@anthropic-ai/claude-code@2.1.280';

/**
 * .what = every distinct claude brain string a giga route can carry, light and heavy
 * .why  = giga holds every guard template; both variants together cover every reviewer lane
 */
const getAllClaudeBrainStrings = async (): Promise<string[]> => {
  const brainsPerRoute = await Promise.all(
    (['light', 'heavy'] as const).map(async (guard) => {
      const repoDir = genTempDir({ slug: `brain-claude-${guard}` });
      const behaviorDirRel = '.behavior/v2026_10_05.brain-claude';
      const route = path.join(repoDir, behaviorDirRel);
      initBehaviorDir({
        behaviorDir: route,
        behaviorDirRel,
        size: 'giga',
        guard,
      });
      const stones = await getAllStones({ route });
      const brainsOfDrivers = stones.flatMap((stone) =>
        stone.guard?.brain?.choice ? [stone.guard.brain.choice] : [],
      );
      const brainsOfReviewers = (await getAllPeerLanesWithBrain({ route }))
        .filter((lane) => lane.isClaude)
        .map((lane) => lane.brain ?? '(no --model named)'); // surfaces in [t0], never dropped
      return [...brainsOfDrivers, ...brainsOfReviewers];
    }),
  );
  return [...new Set(brainsPerRoute.flat())].sort();
};

/**
 * .what = max attempts per question, and the wait before each retry
 * .why  = a cold npx cache, a slow registry, or a slow model reply is a transient blip of the
 *         network, never of the code under test; a bounded retry keeps it from a false red
 */
const ASK_ATTEMPTS_MAX = 3;
const ASK_BACKOFF_MS = [0, 5_000, 15_000];
const ASK_ATTEMPT_TIMEOUT_MS = 120_000; // a cold npx fetch of the cli plus one trivial reply

/**
 * .what = the worst case of one question: every attempt times out, after every backoff
 * .why  = the jest budget below is sized from it, so a retry always has room to run
 */
const ASK_WORST_CASE_MS =
  ASK_ATTEMPTS_MAX * ASK_ATTEMPT_TIMEOUT_MS +
  ASK_BACKOFF_MS.reduce((sum, ms) => sum + ms, 0);

// the most questions any one hook asks is two ([t1]: opus, then sonnet), one at a time.
// the global 90s integration budget (jest.integration.env.ts) would kill the hook before a
// retry could fire, so this file sets its own, from the worst case, plus a margin
jest.setTimeout(2 * ASK_WORST_CASE_MS + 60_000);

/**
 * .what = asks the real claude cli one trivial question on the given brain
 * .why  = the cli is the consumer of the string; its acceptance is the contract under test
 *
 * .note = side effects, each deliberate:
 *         - each attempt is one billed api call (a few tokens; three calls per suite run)
 *         - the first run per machine writes the pinned cli into npx's cache; the cache keys on
 *           the exact version, so later runs reuse it (a findsert, never a drift)
 * .note = only a transient failure retries (a spawn error or a timeout). a cli that answers with a
 *         non-zero exit is a verdict on the brain string, so it returns at once, never retried
 */
const askClaudeOnBrain = async (
  input: { brain: string },
  context: { apiKey: string },
): Promise<{ exitCode: number | null; stdout: string; stderr: string }> => {
  const attempts = Array.from(
    { length: ASK_ATTEMPTS_MAX },
    (_, index) => index,
  );
  const errors: string[] = [];
  for (const attempt of attempts) {
    // wait before a retry, longer each time
    await new Promise((done) => setTimeout(done, ASK_BACKOFF_MS[attempt]));

    // ask once; a verdict (any exit code) returns at once
    const answer = askClaudeOnBrainOnce(input, context);
    if (!answer.error) return answer;
    errors.push(answer.error);
  }
  throw new MalfunctionError('claude cli failed on every attempt', {
    package: CLAUDE_CLI_PACKAGE,
    brain: input.brain,
    attempts: ASK_ATTEMPTS_MAX,
    errors,
    hint: 'check npm registry and anthropic api reachability; the cli is fetched via npx',
  });
};

/**
 * .what = one attempt to ask the real claude cli on the given brain
 * .why  = isolates the spawn, so the retry loop reads as narrative
 */
const askClaudeOnBrainOnce = (
  input: { brain: string },
  context: { apiKey: string },
): {
  exitCode: number | null;
  stdout: string;
  stderr: string;
  error: string | null;
} => {
  const cwd = genTempDir({ slug: 'brain-claude-ask' }); // no repo hooks or settings
  const result = spawnSync(
    'npx',
    [
      '--yes',
      CLAUDE_CLI_PACKAGE,
      '-p',
      '--model',
      input.brain,
      '--output-format',
      'json',
      'reply with exactly the word: ok',
    ],
    {
      cwd,
      encoding: 'utf-8',
      timeout: ASK_ATTEMPT_TIMEOUT_MS,
      env: { ...process.env, ANTHROPIC_API_KEY: context.apiKey },
    },
  );
  return {
    exitCode: result.status,
    stdout: result.stdout,
    stderr: result.stderr,
    error: result.error?.message ?? null, // spawn error or ETIMEDOUT = transient
  };
};

describe('initBehaviorDir.brain.claude', () => {
  given('[case1] every claude brain string the templates prescribe', () => {
    const scene = useBeforeAll(async () => {
      // fail fast: a real call needs a real key
      const apiKey = process.env.ANTHROPIC_API_KEY;
      if (!apiKey)
        throw new ConstraintError('ANTHROPIC_API_KEY required for this test', {
          hint: 'run: rhx keyrack unlock --owner ehmpath --env test',
        });
      const brains = await getAllClaudeBrainStrings();
      return { apiKey, brains };
    });

    when("[t0] the strings are collected from init'd routes", () => {
      then('both the design and the build brain are present', () => {
        expect(scene.brains).toEqual([
          'claude-opus-5-5[1m]',
          'claude-sonnet-5-5[1m]',
        ]);
      });
    });

    when('[t1] each string is handed to the real claude cli', () => {
      // one question at a time: never two cold npx fetches of the cli into one cache at once
      const answers = useBeforeAll(async () => ({
        list: await scene.brains.reduce<
          Promise<
            {
              brain: string;
              exitCode: number | null;
              stdout: string;
              stderr: string;
            }[]
          >
        >(
          async (prior, brain) => [
            ...(await prior),
            {
              brain,
              ...(await askClaudeOnBrain({ brain }, { apiKey: scene.apiKey })),
            },
          ],
          Promise.resolve([]),
        ),
      }));

      then('the cli accepts every string and answers', () => {
        const rejected = answers.list
          .filter((answer) => answer.exitCode !== 0)
          .map((answer) => ({
            brain: answer.brain,
            exitCode: answer.exitCode,
            stderr: answer.stderr.slice(0, 500),
            stdout: answer.stdout.slice(0, 500),
          }));
        expect(rejected).toEqual([]);
      });

      then('each answer ran on the model its string names', () => {
        const offModel = answers.list
          .map((answer) => ({
            brain: answer.brain,
            modelsUsed: Object.keys(
              (JSON.parse(answer.stdout) as { modelUsage?: object })
                .modelUsage ?? {},
            ),
          }))
          .filter(
            (answer) =>
              !answer.modelsUsed.some((model) =>
                model.startsWith(answer.brain.replace(/\[1m\]$/, '')),
              ),
          );
        expect(offModel).toEqual([]);
      });
    });

    when(
      '[t2] a renamed or mistyped id is handed to the real claude cli',
      () => {
        const answer = useBeforeAll(async () =>
          askClaudeOnBrain(
            { brain: 'claude-sonnet-9-9[1m]' },
            { apiKey: scene.apiKey },
          ),
        );

        then(
          'the cli rejects it loud, with the id it could not recognize',
          () => {
            // the experience a consumer meets if a template ever ships a bad id (case=7)
            expect(answer.exitCode).not.toEqual(0);
            expect(answer.stderr).toContain('unrecognized_model');
            expect(answer.stderr).toContain('claude-sonnet-9-9[1m]');
          },
        );
      },
    );
  });
});
