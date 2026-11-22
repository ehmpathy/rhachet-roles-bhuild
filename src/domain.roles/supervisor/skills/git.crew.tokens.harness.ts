/**
 * .what = the shared harness of the `git.crew.tokens` and `git.grove.capacity`
 *         suites — a hermetic HOME that holds crews, transcripts, and cap ledgers
 *
 * .why  = both verbs read the real layout of a grove: each claude config dir
 *         under `~/git/<org>/_worktrees/<tree>/.agent/.actors/<actor>/brain/.claude`,
 *         each cap ledger under the tree's `.log/`. a fixture home with that exact
 *         layout lets the verb under test run verbatim, local only, with no ssh
 *         and no real fleet within reach (rule.require.hermetic-tests)
 *
 * .note = every instant here is relative to the moment of the build, so a
 *         fixture never ages out of the window it was built for. the files live in
 *         a temp dir, never in a tracked file (rule.forbid.timestamps-in-tracked-files)
 */
import { spawnSync } from 'child_process';
import { chmodSync, mkdirSync, writeFileSync } from 'fs';
import { ConstraintError } from 'helpful-errors';
import { join } from 'path';

import { tempDirs } from '../../.test/tempDirs';

export const PATH_TOKENS = join(__dirname, 'git.crew.tokens.sh');
export const PATH_CAPACITY = join(__dirname, 'git.grove.capacity.sh');

/**
 * .what = one api call, as a transcript holds it
 * .why  = the meter reads `message.usage` per line, deduped per `message.id`
 */
export interface FixtureCall {
  id: string;
  minsAgo: number;
  usage: {
    input: number;
    write5m: number;
    write1h: number;
    read: number;
    output: number;
  };
}

/**
 * .what = one crew: where its seat runs, what account it is signed in to, its calls
 */
export interface FixtureCrew {
  /** the tree under ~/git/sandpine/_worktrees/, or a repo root under ~/git/sandpine/ when root=true */
  tree: string;
  root?: boolean;
  /** the branch the tree carries; a bound route on it makes the crew a behavior crew */
  branch: string | null;
  bound: boolean;
  account: string;
  calls: FixtureCall[];
  forkCalls?: FixtureCall[];
  /** a transcript the meter must name as unread */
  unreadable?: boolean;
}

/**
 * .what = one cap ledger row, as claude.statusline.caplog writes it
 */
export interface FixtureCap {
  tree: string;
  account: string;
  minsAgo: number;
  /** resetsAt = epoch seconds; two rows of one window share it unless the window reset */
  fiveHour: { used: number; resetsAt: number } | null;
  sevenDay: { used: number; resetsAt: number } | null;
}

/**
 * .what = a call with every usage field set
 * .why  = a mis-weighted field then moves the total, so a weight drift goes red
 */
export const genCall = (input: {
  id: string;
  minsAgo: number;
}): FixtureCall => ({
  id: input.id,
  minsAgo: input.minsAgo,
  usage: { input: 100, write5m: 600, write1h: 400, read: 10_000, output: 50 },
});

/**
 * .what = an epoch second some minutes ahead, for a cap window's reset
 * .why  = rows of one window must carry the identical reset, so a fixture
 *         computes it once and hands the same value to each row
 */
export const getEpochAhead = (input: { mins: number }): number =>
  Math.floor((Date.now() + input.mins * 60_000) / 1000);

/**
 * .what = the weighted cost of one call, by the verb's own price ratios
 * .why  = an assertion computes its expected figure from the same ratios the
 *         header declares, so a drift between the two goes red
 */
export const getWeightOfCall = (input: { call: FixtureCall }): number =>
  input.call.usage.input +
  1.25 * input.call.usage.write5m +
  2 * input.call.usage.write1h +
  0.1 * input.call.usage.read +
  5 * input.call.usage.output;

const asIsoAgo = (input: { mins: number }): string =>
  new Date(Date.now() - input.mins * 60_000).toISOString();

const asTranscript = (input: {
  calls: FixtureCall[];
  cwd: string;
  session: string;
}): string =>
  input.calls
    .map((call) =>
      JSON.stringify({
        timestamp: asIsoAgo({ mins: call.minsAgo }),
        sessionId: input.session,
        cwd: input.cwd,
        type: 'assistant',
        message: {
          id: call.id,
          usage: {
            input_tokens: call.usage.input,
            cache_creation_input_tokens:
              call.usage.write5m + call.usage.write1h,
            cache_creation: {
              ephemeral_1h_input_tokens: call.usage.write1h,
              ephemeral_5m_input_tokens: call.usage.write5m,
            },
            cache_read_input_tokens: call.usage.read,
            output_tokens: call.usage.output,
          },
        },
      }),
    )
    .join('\n') + '\n';

/**
 * .what = a hermetic home with crews and cap ledgers in the grove layout
 * .why  = the verbs read `$HOME`; a fixture home is the one seam they read through
 */
export const genFixtureHome = (input: {
  slug: string;
  crews: FixtureCrew[];
  caps?: FixtureCap[];
}): { home: string; forest: string } => {
  const home = tempDirs.genOne({ slug: input.slug });
  const forest = join(home, '.git.forest');
  mkdirSync(join(forest, 'groves'), { recursive: true });

  // write each crew: its tree, its branch, its route bind, its actor dir, its transcripts
  input.crews.forEach((crew, index) => {
    const tree = crew.root
      ? join(home, 'git', 'sandpine', crew.tree)
      : join(home, 'git', 'sandpine', '_worktrees', crew.tree);
    mkdirSync(tree, { recursive: true });
    if (crew.branch) {
      const init = spawnSync('git', ['init', '-q', '-b', crew.branch, tree], {
        encoding: 'utf8',
      });
      // a tree with no repo would file its crew as kind other, far from the cause
      if (init.status !== 0)
        throw new ConstraintError(
          'the fixture tree could not be made a git repo',
          {
            hint: 'check that git is on PATH',
            tree,
            stderr: init.stderr,
          },
        );
    }
    if (crew.bound && crew.branch) {
      const flag = `.bind.${crew.branch.replace(/\//g, '.')}.flag`;
      const routeDir = join(
        tree,
        '.behavior',
        'v2026_09_01.book-a-lesson',
        '.route',
      );
      mkdirSync(routeDir, { recursive: true });
      writeFileSync(join(routeDir, flag), '', 'utf8');
    }
    const config = join(
      tree,
      '.agent',
      '.actors',
      'actor.via.repo=ambient',
      'brain',
      '.claude',
    );
    mkdirSync(config, { recursive: true });
    writeFileSync(
      join(config, '.claude.json'),
      JSON.stringify({ oauthAccount: { emailAddress: crew.account } }),
      'utf8',
    );
    const session = `session-${index}`;
    const project = join(config, 'projects', `project-${index}`);
    mkdirSync(join(project, session, 'subagents'), { recursive: true });
    const pathMain = join(project, `${session}.jsonl`);
    writeFileSync(
      pathMain,
      asTranscript({ calls: crew.calls, cwd: tree, session }),
      'utf8',
    );
    if (crew.forkCalls)
      writeFileSync(
        join(project, session, 'subagents', 'agent-1.jsonl'),
        asTranscript({ calls: crew.forkCalls, cwd: tree, session }),
        'utf8',
      );
    if (crew.unreadable) {
      chmodSync(pathMain, 0o000);
      // a uid that reads past 0o000 (root) cannot hold this fixture; fail loud, never pass blind
      if (typeof process.getuid === 'function' && process.getuid() === 0)
        throw new ConstraintError(
          'the unreadable-transcript fixture needs a non-root uid',
          { hint: 'run the suite as a non-root user', pathMain },
        );
    }
  });

  // write each cap ledger row under its tree's .log/
  (input.caps ?? []).forEach((cap) => {
    const dir = join(
      home,
      'git',
      'sandpine',
      '_worktrees',
      cap.tree,
      '.log',
      'role=any',
      'skill=claude.statusline.caplog',
    );
    mkdirSync(dir, { recursive: true });
    const asWindow = (
      window: { used: number; resetsAt: number } | null,
    ): object | null =>
      window
        ? { used_percentage: window.used, resets_at: window.resetsAt }
        : null;
    const row = {
      at: asIsoAgo({ mins: cap.minsAgo }).replace(/\.\d+Z$/, 'Z'),
      account: cap.account,
      five_hour: asWindow(cap.fiveHour),
      seven_day: asWindow(cap.sevenDay),
    };
    writeFileSync(join(dir, 'caps.jsonl'), JSON.stringify(row) + '\n', {
      flag: 'a',
    });
  });

  return { home, forest };
};

/**
 * .what = run a supervisor verb from source against a fixture home
 * .why  = the verb reads only `$HOME` and `$GIT_FOREST_DIR`; both point at the fixture
 */
export const runVerb = (input: {
  path: string;
  args: string[];
  home: string;
  forest: string;
  pipeHead?: boolean;
  env?: Record<string, string>;
}): { status: number | null; stdout: string; stderr: string } => {
  const env = {
    ...process.env,
    HOME: input.home,
    GIT_FOREST_DIR: input.forest,
    ...(input.env ?? {}),
  };
  const out = input.pipeHead
    ? spawnSync(
        'bash',
        ['-c', `bash "$0" "$@" | head -n 1`, input.path, ...input.args],
        { encoding: 'utf8', env, timeout: 240_000 },
      )
    : spawnSync('bash', [input.path, ...input.args], {
        encoding: 'utf8',
        env,
        timeout: 240_000,
      });
  return { status: out.status, stdout: out.stdout, stderr: out.stderr };
};
