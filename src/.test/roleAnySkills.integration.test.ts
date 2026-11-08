/**
 * .what = clamps on this repo's own role=any skills: the cap ledger writer, its
 *         probe, the grove census, and the merge-main helper
 *
 * .why  = jest skips `.agent/**` (rhachet's cache sits there), so a suite beside
 *         these skills would never run. each clamp here holds one defect the
 *         i002 peers found shut:
 *           - caplog: two seats that tick at once both appended one change
 *           - caplog: a ledger dir that could not be made hid its fault
 *           - probe:  a key the binary lacks aborted the scan (grep exit 1 + pipefail)
 *           - census: bc printed ".52", which --argjson refuses, so a calm box broke the read
 *           - census: a transcript that could not be read was dropped in silence
 *           - merge:  every merge failure was reported as a conflict
 *         and the two paved for 5.3 hold their contracts: chmodsafe stays inside
 *         the repo and touches only exec bits; task.output.await is bounded
 */
import { spawn, spawnSync } from 'child_process';
import { existsSync, mkdirSync, readFileSync, statSync, symlinkSync, writeFileSync } from 'fs';
import { MalfunctionError } from 'helpful-errors';
import { homedir, tmpdir } from 'os';
import { join } from 'path';
import { given, then, useBeforeAll, useThen, when } from 'test-fns';

import { asKeyShape } from '../domain.roles/.test/asKeyShape';
import { tempDirs } from '../domain.roles/.test/tempDirs';
import {
  genCall,
  genFixtureHome,
  getWeightOfCall,
} from '../domain.roles/supervisor/skills/git.crew.tokens.harness';

afterAll(() => tempDirs.delAll());

const REPO_ROOT = join(__dirname, '..', '..');
const SKILLS = join(REPO_ROOT, '.agent', 'repo=.this', 'role=any', 'skills');
const PATH_CAPLOG = join(SKILLS, 'claude.statusline.caplog.sh');
const PATH_PROBE = join(SKILLS, 'claude.statusline.probe.sh');
const PATH_CENSUS = join(SKILLS, 'grove.census.sh');
const PATH_MERGE = join(SKILLS, 'git.branch.merge.main.sh');
const LEDGER_REL = join('.log', 'role=any', 'skill=claude.statusline.caplog');

// a fake identity for every commit a fixture makes (rule.forbid.real-identities-in-fixtures)
const GIT_ENV = {
  GIT_AUTHOR_NAME: 'bert',
  GIT_AUTHOR_EMAIL: 'bert@example.com',
  GIT_COMMITTER_NAME: 'bert',
  GIT_COMMITTER_EMAIL: 'bert@example.com',
};

const runSkill = (input: {
  path: string;
  args: string[];
  cwd?: string;
  env?: Record<string, string>;
  stdin?: string;
}): { status: number | null; stdout: string; stderr: string } => {
  const out = spawnSync('bash', [input.path, ...input.args], {
    cwd: input.cwd ?? REPO_ROOT,
    encoding: 'utf8',
    input: input.stdin,
    env: { ...process.env, ...(input.env ?? {}) },
    timeout: 240_000,
  });
  return { status: out.status, stdout: out.stdout, stderr: out.stderr };
};

const asRegexLiteral = (text: string): string => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * .what = a grove.census tree, its live box values masked and the real box's crew rows dropped
 * .why  = cpu, ram, forks, and every seat the box runs vary per run and name trees outside the
 *         fixture; the fixture's own row and the tree's shape are what the snapshot holds
 */
const asMaskedCensusTree = (input: { stdout: string; home: string }): string =>
  input.stdout
    .split('\n')
    // a live seat of another suite's fixture may share the tree name; it shows no burn
    .filter(
      (line) =>
        !/^ {6}[├└]─ /.test(line) || (line.includes('svc-lessons.') && !line.includes('no burn in window')),
    )
    .join('\n')
    // the fixture row's glyph turns on whether real rows followed it, so it is fixed
    .replace(/^ {6}[├└]─ /gm, '      └─ ')
    .split(input.home)
    .join('<home>')
    .replace(/^( {3}├─ grove: ).*$/m, '$1<grove>')
    .replace(/outside crews: .*$/m, 'outside crews: <the box>')
    .replace(/[0-9]+(\.[0-9]+)?/g, 'N');

/**
 * .what = one skill run as a snapshot-stable string: exit, stdout, stderr, volatile bytes masked
 * .why  = the contract a human reads is all three streams; temp paths, the repo root, the home,
 *         pids, shas, and any clock time vary per run, so each is swapped for a stable token
 * .note = the caller's swaps run first and longest-first, so a named fixture path keeps its name
 */
const asSnapStable = (input: {
  result: { status: number | null; stdout: string; stderr: string };
  swaps?: Array<[string, string]>;
}): string => {
  const swaps = [...(input.swaps ?? [])].sort((a, b) => b[0].length - a[0].length);
  const raw = `exit: ${input.result.status}\n[stdout]\n${input.result.stdout}\n[stderr]\n${input.result.stderr}`;
  return swaps
    .reduce((text, [from, to]) => text.split(from).join(to), raw)
    .replace(new RegExp(`${asRegexLiteral(tmpdir())}/[^\\s/'"]+`, 'g'), '<tmp>')
    .split(REPO_ROOT)
    .join('<repo>')
    .split(homedir())
    .join('<home>')
    .replace(/([0-9]{4}-[0-9]{2}-[0-9]{2})?T?[0-9]{2}:[0-9]{2}:[0-9]{2}(\.[0-9]+)?Z?/g, 'YYYY-MM-DDTHH:MM:SSZ')
    // an epoch is an instant too (rule.forbid.timestamps-in-tracked-files); a probe count of 0 stays
    .replace(/"resets_at":\s*[0-9]+/g, '"resets_at":<epoch>')
    .replace(/\bresets_at: [1-9][0-9]*/g, 'resets_at: <epoch>')
    .replace(/\bpid[ =:]?[0-9]+/g, 'pid<pid>')
    // a tool's own exit code and text differ per version (jq 1.6 exits 4 on a parse fault,
    // 1.7 exits 5; git 2.4x adds a strategy line and exits 2 where older git exits 128)
    .replace(/(ledger fault, exit )[0-9]+/g, '$1<tool exit>')
    .replace(/(no conflict to settle \(exit )[0-9]+/g, '$1<tool exit>')
    .replace(/^Merge with strategy \S+ failed\.\n/gm, '')
    // a short sha can be all digits, which the general mask below cannot tell from a count
    .replace(/(origin\/main )[0-9a-f]{7,40}\b/g, '$1<sha>')
    .replace(/\b(?=[0-9a-f]*[0-9])(?=[0-9a-f]*[a-f])[0-9a-f]{7,40}\b/g, '<sha>');
};

/**
 * .what = one `when` that asks a skill for its help: exit 0, the skill named, the whole render snapped
 */
const whenHelpIsAsked = (input: { label: string; path: string; name: string }): void =>
  when(`${input.label} help is asked for`, () => {
    const result = useThen('it runs', async () =>
      runSkill({ path: input.path, args: ['--help'], stdin: '' }),
    );

    then('it exits 0 and names the skill', () => {
      expect(result.status).toEqual(0);
      expect(`${result.stdout}${result.stderr}`).toContain(input.name);
    });

    // a help printed by a line range must stop on its header block (merge.main once printed `set -euo pipefail`)
    then('the help shows no line of the skill body', () => {
      expect(result.stdout).not.toMatch(/^set -euo pipefail$/m);
    });

    then('the help matches its snapshot', () => {
      expect(asSnapStable({ result })).toMatchSnapshot();
    });
  });

const runGit = (input: { cwd: string; args: string[] }): void => {
  const out = spawnSync('git', input.args, {
    cwd: input.cwd,
    encoding: 'utf8',
    env: { ...process.env, ...GIT_ENV },
  });
  if (out.status !== 0)
    throw new MalfunctionError('a fixture git call failed', {
      hint: 'check that git is on PATH and the fixture repo is not corrupt',
      args: input.args,
      stderr: out.stderr,
    });
};

/**
 * .what = one statusline input, as claude code hands it to the command
 */
const asStatuslineInput = (input: {
  projectDir: string;
  fiveHourUsed: number;
}): string =>
  JSON.stringify({
    session_id: 'session-surf-forecast',
    version: '2.0.0',
    model: { id: 'claude-fixture' },
    workspace: { project_dir: input.projectDir },
    rate_limits: {
      five_hour: { used_percentage: input.fiveHourUsed, resets_at: 1_900_000_000 },
      seven_day: { used_percentage: 3, resets_at: 1_900_500_000 },
    },
  });

/**
 * .what = a seat's config dir, signed in to a fake account
 */
const genConfigDir = (): string => {
  const confdir = tempDirs.genOne({ slug: 'caplog-confdir' });
  writeFileSync(
    join(confdir, '.claude.json'),
    JSON.stringify({ oauthAccount: { emailAddress: 'bert@example.com' } }),
  );
  return confdir;
};

/**
 * .what = bhrain's own route statusline for one input, rendered apart from the wrapper
 * .why  = the wrapper's first guarantee is "stdout is exactly bhrain's routeStatusLine for the
 *         same input": each tick's stdout is compared to this, so a blank or altered bar goes red
 */
const getBhrainStatusline = (input: {
  stdin: string;
  cwd?: string;
}): { status: number | null; stdout: string } => {
  const out = spawnSync(
    'node',
    ['-e', "import('rhachet-roles-bhrain/cli/route').then(m => m.routeStatusLine())"],
    { cwd: input.cwd ?? REPO_ROOT, encoding: 'utf8', input: input.stdin, env: process.env },
  );
  return { status: out.status, stdout: out.stdout };
};

/**
 * .what = a tick's stdout with the route bar's text masked, its line kept
 * .why  = bhrain renders the route bound to the cwd's branch: its stone, gate, and round move
 *         with the drive, and an unbound branch renders a bare newline. the bar's text is wholly
 *         live, so it is masked here, after its equality to bhrain's own render is asserted
 */
const asMaskedBar = (input: { stdout: string }): string =>
  input.stdout.length > 0 ? '<the route bar>\n' : '';

const getLedgerRows = (input: { projectDir: string }): string[] => {
  const ledger = join(input.projectDir, LEDGER_REL, 'caps.jsonl');
  if (!existsSync(ledger)) return [];
  return readFileSync(ledger, 'utf8')
    .split('\n')
    .filter((line) => line.length > 0);
};

describe('role=any skills', () => {
  given('[case1] claude.statusline.caplog, fed by one seat', () => {
    const scene = useBeforeAll(async () => {
      const projectDir = tempDirs.genOne({ slug: 'caplog-project' });
      runGit({ cwd: projectDir, args: ['init', '--quiet'] });
      return { projectDir, confdir: genConfigDir() };
    });

    when('[t0] one input arrives twice, then a changed one', () => {
      const rows = useThen('the ledger is read', async () => {
        const feed = (fiveHourUsed: number) =>
          runSkill({
            path: PATH_CAPLOG,
            args: [],
            stdin: asStatuslineInput({ projectDir: scene.projectDir, fiveHourUsed }),
            env: { CLAUDE_CONFIG_DIR: scene.confdir },
          });
        const ticks = [feed(10), feed(10), feed(12)];
        return {
          list: getLedgerRows({ projectDir: scene.projectDir }),
          ticks,
          bhrain: getBhrainStatusline({
            stdin: asStatuslineInput({ projectDir: scene.projectDir, fiveHourUsed: 12 }),
          }),
        };
      });

      // an unbound branch renders a bare newline, so the floor is one byte: a blank bar is none
      then('each tick exits 0 and renders a bar, never a blank stdout', () => {
        rows.ticks.forEach((tick) => {
          expect(tick.status).toEqual(0);
          expect(tick.stdout.length).toBeGreaterThan(0);
          expect(tick.stderr).toEqual('');
        });
      });

      then("each bar is exactly bhrain's routeStatusLine for the same input", () => {
        rows.ticks.forEach((tick) => {
          expect(tick.stdout).toEqual(rows.bhrain.stdout);
        });
        expect(rows.bhrain.status).toEqual(0);
      });

      then('the tick render, the bar text masked, matches its snapshot', () => {
        const tick = rows.ticks[2]!;
        expect(
          asSnapStable({
            result: { ...tick, stdout: asMaskedBar({ stdout: tick.stdout }) },
            swaps: [[scene.projectDir, '<project>']],
          }),
        ).toMatchSnapshot();
      });

      then('it logs one row per change, never one per tick', () => {
        expect(rows.list).toHaveLength(2);
        expect(JSON.parse(rows.list[0]!).five_hour.used_percentage).toEqual(10);
        expect(JSON.parse(rows.list[1]!).five_hour.used_percentage).toEqual(12);
      });

      then('each row names the account and the capwork row fields', () => {
        const row = JSON.parse(rows.list[0]!);
        expect(row.account).toEqual('bert@example.com');
        expect(row.rate_limits_present).toEqual(true);
        expect(row.session).toEqual('session-surf-forecast');
      });
    });

    when('[t1] the status is read from a subdir of the worktree', () => {
      const result = useThen('it runs', async () => {
        const subdir = join(scene.projectDir, 'src', 'lessons');
        mkdirSync(subdir, { recursive: true });
        return runSkill({ path: PATH_CAPLOG, args: ['--status'], cwd: subdir });
      });

      then('it reads the ledger of the worktree root, not of the cwd', () => {
        expect(result.status).toEqual(0);
        expect(result.stdout).toContain('├─ rows: 2');
        expect(result.stdout).toContain('└─ faults: 0');
      });

      then('the status render matches its snapshot', () => {
        expect(asSnapStable({ result, swaps: [[scene.projectDir, '<project>']] })).toMatchSnapshot();
      });
    });

    when('[t2] help is asked for', () => {
      const result = useThen('it runs', async () =>
        runSkill({ path: PATH_CAPLOG, args: ['--help'], stdin: '' }),
      );

      then('it exits 0 with usage, never a read of stdin', () => {
        expect(result.status).toEqual(0);
        expect(result.stdout).toContain('usage:');
        expect(result.stdout).toContain('--status');
      });

      then('the help matches its snapshot', () => {
        expect(asSnapStable({ result })).toMatchSnapshot();
      });
    });

    when('[t3] it is given an unknown flag', () => {
      const result = useThen('it runs', async () =>
        runSkill({ path: PATH_CAPLOG, args: ['--stauts'], stdin: '' }),
      );

      then('it refuses with exit 2 and points to --help', () => {
        expect(result.status).toEqual(2);
        expect(result.stderr).toContain("unknown argument '--stauts' (see --help)");
      });

      then('the refusal matches its snapshot', () => {
        expect(asSnapStable({ result })).toMatchSnapshot();
      });
    });

    // an input that does not parse falls back to the cwd for its ledger, and says so
    when('[t4] an input arrives that does not parse', () => {
      const tick = useThen('it runs', async () => ({
        ...runSkill({
          path: PATH_CAPLOG,
          args: [],
          stdin: '{ not json',
          cwd: scene.projectDir,
          env: { CLAUDE_CONFIG_DIR: scene.confdir },
        }),
        bhrain: getBhrainStatusline({ stdin: '{ not json', cwd: scene.projectDir }),
      }));
      const result = useThen('the status is read', async () =>
        runSkill({ path: PATH_CAPLOG, args: ['--status'], cwd: scene.projectDir }),
      );

      // an input that does not parse leaves bhrain naught to render, so its own exit is the bar;
      // the ledger fault adds no exit and no stderr of its own on top of it
      then("the failed tick renders exactly what bhrain renders, its exit too", () => {
        expect(tick.stdout).toEqual(tick.bhrain.stdout);
        expect(tick.status).toEqual(tick.bhrain.status);
        expect(tick.stderr).not.toContain('MalfunctionError');
      });

      then('the fault is named in faults.log, never hidden behind the cwd fallback', () => {
        expect(result.stdout).not.toContain('└─ faults: 0');
        expect(
          readFileSync(join(scene.projectDir, LEDGER_REL, 'faults.log'), 'utf8'),
        ).toContain('the statusline input does not parse as json');
      });

      then('the status render with its fault matches its snapshot', () => {
        expect(asSnapStable({ result, swaps: [[scene.projectDir, '<project>']] })).toMatchSnapshot();
      });
    });

    // a quiet account holds its % flat; the reader drops a row past its freshness bound, so the
    // writer owes a keepalive row once a flat % has gone unrecorded past CAPLOG_KEEPALIVE_MIN
    when('[t5] the same % arrives once its last row has aged 10 min', () => {
      const rows = useThen('the ledger is read before and after', async () => {
        const ledger = join(scene.projectDir, LEDGER_REL, 'caps.jsonl');
        const before = getLedgerRows({ projectDir: scene.projectDir });
        const aged = before.map((line, index) =>
          index === before.length - 1
            ? JSON.stringify({ ...JSON.parse(line), at: new Date(Date.now() - 10 * 60_000).toISOString().replace(/\.\d+Z$/, 'Z') })
            : line,
        );
        writeFileSync(ledger, `${aged.join('\n')}\n`);
        runSkill({
          path: PATH_CAPLOG,
          args: [],
          stdin: asStatuslineInput({ projectDir: scene.projectDir, fiveHourUsed: 12 }),
          env: { CLAUDE_CONFIG_DIR: scene.confdir },
        });
        return { before: before.length, after: getLedgerRows({ projectDir: scene.projectDir }) };
      });
      const status = useThen('the status is read after the keepalive', async () =>
        runSkill({ path: PATH_CAPLOG, args: ['--status'], cwd: scene.projectDir }),
      );

      then('it appends a keepalive row with the same %', () => {
        expect(rows.after).toHaveLength(rows.before + 1);
        expect(JSON.parse(rows.after[rows.after.length - 1]!).five_hour.used_percentage).toEqual(12);
      });

      then('the status reads the keepalive row, and its render matches its snapshot', () => {
        expect(status.status).toEqual(0);
        expect(status.stdout).toContain(`├─ rows: ${rows.after.length}`);
        expect(
          asSnapStable({ result: status, swaps: [[scene.projectDir, '<project>']] }),
        ).toMatchSnapshot();
      });
    });
  });

  given('[case2] claude.statusline.caplog, fed by four seats at once', () => {
    const scene = useBeforeAll(async () => ({
      projectDir: tempDirs.genOne({ slug: 'caplog-race' }),
      confdir: genConfigDir(),
    }));

    when('[t0] four seats tick the same change together', () => {
      const rows = useThen('all four finish', async () => {
        const stdin = asStatuslineInput({ projectDir: scene.projectDir, fiveHourUsed: 40 });
        await Promise.all(
          [0, 1, 2, 3].map(
            () =>
              new Promise<void>((done) => {
                const child = spawn('bash', [PATH_CAPLOG], {
                  cwd: REPO_ROOT,
                  env: { ...process.env, CLAUDE_CONFIG_DIR: scene.confdir },
                });
                child.stdin.end(stdin);
                child.on('close', () => done());
              }),
          ),
        );
        return { list: getLedgerRows({ projectDir: scene.projectDir }) };
      });

      then('the lock lets one row through, not four', () => {
        expect(rows.list).toHaveLength(1);
      });
    });
  });

  given('[case3] claude.statusline.caplog, with a ledger dir it cannot make', () => {
    when('[t0] the project dir sits under a plain file', () => {
      const result = useThen('it runs', async () => {
        const base = tempDirs.genOne({ slug: 'caplog-blocked' });
        const file = join(base, 'not-a-dir');
        writeFileSync(file, 'a file, not a dir');
        const stdin = asStatuslineInput({ projectDir: join(file, 'repo'), fiveHourUsed: 5 });
        return {
          ...runSkill({
            path: PATH_CAPLOG,
            args: [],
            stdin,
            env: { CLAUDE_CONFIG_DIR: genConfigDir() },
          }),
          bhrain: getBhrainStatusline({ stdin }),
        };
      });

      then('the fault is named on stderr, never hidden', () => {
        expect(result.stderr).toContain(
          '💥 MalfunctionError: caplog: the ledger dir could not be made',
        );
      });

      then("the fault never breaks the render: exit 0, bhrain's own bar", () => {
        expect(result.status).toEqual(0);
        expect(result.stdout.length).toBeGreaterThan(0);
        expect(result.stdout).toEqual(result.bhrain.stdout);
        expect(result.bhrain.status).toEqual(0);
      });

      then('the fault, the bar text masked, matches its snapshot', () => {
        expect(
          asSnapStable({
            result: {
              status: result.status,
              stdout: asMaskedBar({ stdout: result.stdout }),
              stderr: result.stderr,
            },
          }),
        ).toMatchSnapshot();
      });
    });
  });

  given('[case4] claude.statusline.probe, aimed at a binary with no cap keys', () => {
    when('[t0] it scans bash', () => {
      const result = useThen('it runs', async () =>
        runSkill({
          path: PATH_PROBE,
          args: ['--exe', spawnSync('which', ['bash']).stdout.toString().trim()],
        }),
      );

      then('a key the binary lacks reads 0, and the scan completes', () => {
        expect(result.status).toEqual(0);
        expect(result.stdout).toContain('rate_limits: 0');
        expect(result.stdout).toContain('resets_at: 0');
      });

      then('a section with no match reads none, never a bare label', () => {
        expect(result.stdout).toContain('context: none');
        expect(result.stdout).toContain('plan: none');
        expect(result.stdout).toContain('source: none');
        expect(result.stdout).not.toMatch(/^(context|plan|source):$/m);
      });

      // .note = the binary path and version differ per host bash, so those two lines are masked
      then('the scan render matches its snapshot, its binary-specific values masked', () => {
        expect(
          asSnapStable({ result }).replace(/^(.*\b(binary|version): ).*$/gm, '$1<the binary>'),
        ).toMatchSnapshot();
      });
    });

    when('[t1] it is aimed at a path that is no file', () => {
      const result = useThen('it runs', async () =>
        runSkill({ path: PATH_PROBE, args: ['--exe', '/surf/absent'] }),
      );

      then('it refuses with exit 2', () => {
        expect(result.status).toEqual(2);
        expect(result.stderr).toContain('--exe is not a readable file');
      });

      then('the refusal matches its snapshot', () => {
        expect(asSnapStable({ result })).toMatchSnapshot();
      });
    });

    when('[t2] help is asked for', () => {
      const result = useThen('it runs', async () =>
        runSkill({ path: PATH_PROBE, args: ['--help'] }),
      );

      then('it exits 0 and names its usage', () => {
        expect(result.status).toEqual(0);
        expect(result.stdout).toContain('usage:');
      });

      then('the help matches its snapshot', () => {
        expect(asSnapStable({ result })).toMatchSnapshot();
      });
    });

    when('[t3] it is given an unknown flag', () => {
      const result = useThen('it runs', async () =>
        runSkill({ path: PATH_PROBE, args: ['--exee', '/surf'] }),
      );

      then('it refuses with exit 2 and points to --help', () => {
        expect(result.status).toEqual(2);
        expect(result.stderr).toContain("unknown argument '--exee' (see --help)");
      });

      then('the refusal matches its snapshot', () => {
        expect(asSnapStable({ result })).toMatchSnapshot();
      });
    });

    // a fixture binary that holds every key the probe greps for, so each section renders populated
    when('[t4] it scans a binary that holds the cap keys', () => {
      const result = useThen('it runs', async () => {
        const pad = (input: { width: number }): string =>
          'sandpine-surf-school-'.repeat(Math.ceil(input.width / 21)).slice(0, input.width);
        const exe = join(tempDirs.genOne({ slug: 'probe-fixture-bin' }), 'claude');
        writeFileSync(
          exe,
          [
            `${pad({ width: 130 })}rate_limits:{five_hour:{used_percentage,resets_at},seven_day:{used_percentage,resets_at}}${pad({ width: 210 })}`,
            `${pad({ width: 310 })}subscription type (max_plan)${pad({ width: 410 })}`,
            `${pad({ width: 610 })}(ht.five_hour||ht.seven_day)${pad({ width: 20 })}`,
          ].join('\n'),
        );
        return { ...runSkill({ path: PATH_PROBE, args: ['--exe', exe] }), exe };
      });

      then('every key reads a hit count above 0', () => {
        expect(result.status).toEqual(0);
        expect(result.stdout).toContain('rate_limits: 1');
        expect(result.stdout).toContain('five_hour: 2');
        expect(result.stdout).toContain('resets_at: 2');
      });

      then('the context, plan, and source sections render their match, never none', () => {
        expect(result.stdout).toMatch(/^context:\n.*rate_limits:\{five_hour/m);
        expect(result.stdout).toMatch(/^plan:\n.*subscription type \(max_plan\)/m);
        expect(result.stdout).toMatch(/^source:\n.*\(ht\.five_hour\|\|ht\.seven_day$/m);
        expect(result.stdout).not.toContain(': none');
      });

      then('the populated render matches its snapshot, the binary path masked', () => {
        expect(asSnapStable({ result, swaps: [[result.exe, '<fixture-bin>']] })).toMatchSnapshot();
      });
    });

    when('[t5] it is given --exe with no value', () => {
      const result = useThen('it runs', async () =>
        runSkill({ path: PATH_PROBE, args: ['--exe'] }),
      );

      then('it refuses with exit 2 and names the absent path', () => {
        expect(result.status).toEqual(2);
        expect(result.stderr).toContain('✋ ConstraintError: --exe needs a path');
      });

      then('the refusal matches its snapshot', () => {
        expect(asSnapStable({ result })).toMatchSnapshot();
      });
    });
  });

  // the readable crew's one call: the shared fixture call, weighed by the shared oracle
  const CENSUS_CALL = genCall({ id: 'msg-a', minsAgo: 5 });

  given('[case5] grove.census, over a home with one unreadable transcript', () => {
    const scene = useBeforeAll(async () =>
      genFixtureHome({
        slug: 'census',
        crews: [
          {
            tree: 'svc-lessons.beav.feat-book-a-lesson',
            branch: 'beav/feat-book-a-lesson',
            bound: true,
            account: 'bert@example.com',
            calls: [CENSUS_CALL],
          },
          {
            tree: 'svc-lessons.beav.fix-tide-chart',
            branch: 'beav/fix-tide-chart',
            bound: false,
            account: 'bert@example.com',
            calls: [
              {
                id: 'msg-b',
                minsAgo: 5,
                usage: { input: 1, write5m: 0, write1h: 0, read: 0, output: 1 },
              },
            ],
            unreadable: true,
          },
        ],
      }),
    );

    when('[t0] it reads as json over a short sample', () => {
      const result = useThen('it runs', async () =>
        runSkill({
          path: PATH_CENSUS,
          args: ['--window', '30', '--sample', '1', '--json'],
          env: { HOME: scene.home },
        }),
      );
      const record = useThen('it parses', async () => JSON.parse(result.stdout));

      then('every rate is a json number, sub-1 values included', () => {
        expect(result.status).toEqual(0);
        expect(typeof record.cpu.busy_cores).toEqual('number');
        expect(typeof record.forks.per_sec).toEqual('number');
      });

      then('the unreadable transcript is named, never dropped in silence', () => {
        expect(record.transcripts_unread).toHaveLength(1);
        expect(record.transcripts_unread[0]).toContain('fix-tide-chart');
      });

      then('the readable crew is weighed by the shared weight', () => {
        // .note = a live seat of another suite's fixture may share the tree name with no burn, so
        //         the fixture's own row is the one that carries tokens
        const crew = record.crews.find(
          (c: { crew: string; tokens: unknown }) =>
            c.crew.endsWith('feat-book-a-lesson') && c.tokens !== null,
        );
        expect(crew.tokens.weighted).toEqual(Math.floor(getWeightOfCall({ call: CENSUS_CALL })));
      });

      // .note = every value is a live box figure, and `crews` holds one row per live seat on the box,
      //         so the record is snapped as its key structure, the shape a caller parses
      then('the record shape matches its snapshot', () => {
        expect(asKeyShape(record)).toMatchSnapshot();
      });
    });

    // the human tree: every live figure (cpu, ram, forks, the box's own processes) is masked
    when('[t1] it renders the tree', () => {
      const result = useThen('it runs', async () =>
        runSkill({
          path: PATH_CENSUS,
          args: ['--window', '30', '--sample', '1'],
          env: { HOME: scene.home },
        }),
      );

      then('it exits 0 and names the unread transcript in the burn line', () => {
        expect(result.status).toEqual(0);
        expect(result.stdout).toContain('🐚 grove.census');
        expect(result.stdout).toContain('transcripts unread');
      });

      // .note = the crew rows of the real box (every seat that runs on it) are dropped: they vary
      //         per run, and they name trees outside this fixture. the fixture's own row stays
      then('the tree matches its snapshot, its live values masked', () => {
        expect(asMaskedCensusTree({ stdout: result.stdout, home: scene.home })).toMatchSnapshot();
      });
    });

    // a config that exists and does not parse is named, never read as "unknown"
    when('[t2] one crew config does not parse', () => {
      const record = useThen('it reads as json', async () => {
        writeFileSync(
          join(scene.home, 'git', 'sandpine', '_worktrees', 'svc-lessons.beav.feat-book-a-lesson',
            '.agent', '.actors', 'actor.via.repo=ambient', 'brain', '.claude', '.claude.json'),
          '{ not json',
        );
        const run = runSkill({
          path: PATH_CENSUS,
          args: ['--window', '30', '--sample', '1', '--json'],
          env: { HOME: scene.home },
        });
        return JSON.parse(run.stdout);
      });

      then('the config is named in the unread list as one that does not parse', () => {
        expect(
          record.transcripts_unread.filter((file: string) => file.endsWith('.claude.json (does not parse)')),
        ).toHaveLength(1);
      });

      then('its burn is attributed to "unparsed", never "unknown"', () => {
        const accounts = record.accounts.map((row: { account: string }) => row.account);
        expect(accounts).toContain('unparsed');
        expect(accounts).not.toContain('unknown');
      });

      // the tree for this state was never rendered (5.3 i003 r4.nitpick.3)
      const tree = useThen('it renders the tree, the config still unparsed', async () =>
        runSkill({
          path: PATH_CENSUS,
          args: ['--window', '30', '--sample', '1'],
          env: { HOME: scene.home },
        }),
      );

      then('the tree names the config that does not parse, and the unparsed account', () => {
        expect(tree.status).toEqual(0);
        expect(tree.stdout).toContain('.claude.json (does not parse)');
        expect(tree.stdout).toContain('unparsed');
      });

      then('the unparsed tree matches its snapshot, its live values masked', () => {
        expect(asMaskedCensusTree({ stdout: tree.stdout, home: scene.home })).toMatchSnapshot();
      });
    });

    when('[t3] it is given a zero sample', () => {
      const result = useThen('it runs', async () =>
        runSkill({ path: PATH_CENSUS, args: ['--sample', '0'], env: { HOME: scene.home } }),
      );

      then('it refuses with exit 2, before a divide by zero', () => {
        expect(result.status).toEqual(2);
        expect(result.stderr).toContain('--sample must be at least 1 second');
      });

      then('the refusal matches its snapshot', () => {
        expect(asSnapStable({ result, swaps: [[scene.home, '<fixture-home>']] })).toMatchSnapshot();
      });
    });

    // every refusal of the census exits 2 and names its fault, never a partial read
    const REFUSALS = [
      { slug: 'an unknown flag', args: ['--windw', '30'], says: 'unknown argument: --windw' },
      { slug: 'a window in words', args: ['--window', 'an hour'], says: "--window must be whole minutes, got 'an hour'" },
      { slug: 'a sample in words', args: ['--sample', 'ten'], says: "--sample must be whole seconds, got 'ten'" },
      { slug: 'an unreadable --since', args: ['--since', 'low tide', '--until', '2026-11-01T00:00:00Z'], says: "--since is not a readable instant: 'low tide'" },
      { slug: 'an empty span', args: ['--since', '2026-11-01T01:00:00Z', '--until', '2026-11-01T00:00:00Z'], says: 'the span is empty' },
      { slug: 'a flag with no value', args: ['--window'], says: '--window needs a value' },
      { slug: 'a span under one minute', args: ['--since', '2026-11-01T00:00:00Z', '--until', '2026-11-01T00:00:30Z'], says: 'the span is under one minute' },
      // a future span holds no transcript yet: its burn read 0, an idle fleet in the voice of a measure
      { slug: 'a span that begins in the future', args: ['--since', '2099-01-01T00:00:00Z', '--until', '2099-01-01T01:00:00Z'], says: '--since is in the future' },
    ];
    REFUSALS.forEach((refusal, index) =>
      when(`[t${4 + index}] it is given ${refusal.slug}`, () => {
        const result = useThen('it runs', async () =>
          runSkill({ path: PATH_CENSUS, args: refusal.args, env: { HOME: scene.home } }),
        );

        then('it refuses with exit 2 and names the fault', () => {
          expect(result.status).toEqual(2);
          expect(result.stderr).toContain(refusal.says);
        });

        then('the refusal matches its snapshot', () => {
          expect(asSnapStable({ result, swaps: [[scene.home, '<fixture-home>']] })).toMatchSnapshot();
        });
      }),
    );

    whenHelpIsAsked({ label: `[t${4 + REFUSALS.length}]`, path: PATH_CENSUS, name: 'grove.census' });
  });

  given('[case6] git.branch.merge.main, on a feature branch behind main', () => {
    /**
     * .what = a clone of a bare origin, on a feature branch, with main one commit ahead
     */
    const genRepo = (input: { slug: string; mainFile: string }): string => {
      const origin = tempDirs.genOne({ slug: `${input.slug}-origin` });
      runGit({ cwd: origin, args: ['init', '--quiet', '--bare', '--initial-branch=main'] });
      const clone = tempDirs.genOne({ slug: `${input.slug}-clone` });
      runGit({ cwd: clone, args: ['clone', '--quiet', origin, '.'] });
      runGit({ cwd: clone, args: ['checkout', '--quiet', '-b', 'main'] });
      writeFileSync(join(clone, 'readme.md'), 'sandpine surf school\n');
      runGit({ cwd: clone, args: ['add', 'readme.md'] });
      runGit({ cwd: clone, args: ['commit', '--quiet', '-m', 'init'] });
      runGit({ cwd: clone, args: ['push', '--quiet', 'origin', 'main'] });
      runGit({ cwd: clone, args: ['checkout', '--quiet', '-b', 'beav/feat-tide-chart'] });
      runGit({ cwd: clone, args: ['checkout', '--quiet', 'main'] });
      writeFileSync(join(clone, input.mainFile), 'from main\n');
      runGit({ cwd: clone, args: ['add', input.mainFile] });
      runGit({ cwd: clone, args: ['commit', '--quiet', '-m', 'main moves'] });
      runGit({ cwd: clone, args: ['push', '--quiet', 'origin', 'main'] });
      runGit({ cwd: clone, args: ['checkout', '--quiet', 'beav/feat-tide-chart'] });
      return clone;
    };

    when('[t0] an untracked file stands where main adds one', () => {
      const result = useThen('it runs', async () => {
        const clone = genRepo({ slug: 'merge-untracked', mainFile: 'tides.md' });
        writeFileSync(join(clone, 'tides.md'), 'from the branch, untracked\n');
        return runSkill({ path: PATH_MERGE, args: [], cwd: clone, env: GIT_ENV });
      });

      then('it is a malfunction with exit 1, not a conflict to settle', () => {
        expect(result.status).toEqual(1);
        expect(result.stderr).toContain('git merge failed with no conflict to settle');
        expect(result.stderr).not.toContain('conflicts; settle them');
      });

      then('the malfunction matches its snapshot', () => {
        expect(asSnapStable({ result })).toMatchSnapshot();
      });
    });

    when('[t1] the branch and main both change one file', () => {
      const result = useThen('it runs', async () => {
        const clone = genRepo({ slug: 'merge-conflict', mainFile: 'readme.md' });
        writeFileSync(join(clone, 'readme.md'), 'from the branch\n');
        runGit({ cwd: clone, args: ['commit', '--quiet', '-am', 'branch moves'] });
        return runSkill({ path: PATH_MERGE, args: [], cwd: clone, env: GIT_ENV });
      });

      then('it is a conflict with exit 2, and names the file', () => {
        expect(result.status).toEqual(2);
        expect(result.stderr).toContain('conflicts; settle them');
        expect(result.stdout).toContain('└─ readme.md');
      });

      then('the conflict render matches its snapshot', () => {
        expect(asSnapStable({ result })).toMatchSnapshot();
      });
    });

    when('[t2] main merges in clean', () => {
      const result = useThen('it runs', async () => {
        const clone = genRepo({ slug: 'merge-clean', mainFile: 'lessons.md' });
        return runSkill({ path: PATH_MERGE, args: [], cwd: clone, env: GIT_ENV });
      });

      then('it exits 0 with the merge open and no conflict', () => {
        expect(result.status).toEqual(0);
        expect(result.stdout).toContain('merge: open');
        expect(result.stdout).toContain('conflicts: none');
      });

      then('the merge render matches its snapshot', () => {
        expect(asSnapStable({ result })).toMatchSnapshot();
      });
    });

    when('[t3] it runs on main itself', () => {
      const result = useThen('it runs', async () => {
        const clone = genRepo({ slug: 'merge-on-main', mainFile: 'lessons.md' });
        runGit({ cwd: clone, args: ['checkout', '--quiet', 'main'] });
        return runSkill({ path: PATH_MERGE, args: [], cwd: clone, env: GIT_ENV });
      });

      then('it refuses with exit 2: it merges main into a feature branch', () => {
        expect(result.status).toEqual(2);
        expect(result.stderr).toContain('on main; this merges main INTO a feature branch');
      });

      then('the refusal matches its snapshot', () => {
        expect(asSnapStable({ result })).toMatchSnapshot();
      });
    });

    when('[t4] the index holds a staged change', () => {
      const result = useThen('it runs', async () => {
        const clone = genRepo({ slug: 'merge-dirty', mainFile: 'lessons.md' });
        writeFileSync(join(clone, 'wetsuits.md'), 'a staged change\n');
        runGit({ cwd: clone, args: ['add', 'wetsuits.md'] });
        return runSkill({ path: PATH_MERGE, args: [], cwd: clone, env: GIT_ENV });
      });

      then('it refuses with exit 2 before any fetch', () => {
        expect(result.status).toEqual(2);
        expect(result.stderr).toContain('the index holds staged changes');
      });

      then('the refusal matches its snapshot', () => {
        expect(asSnapStable({ result })).toMatchSnapshot();
      });
    });

    when('[t5] a merge is already open', () => {
      const result = useThen('it runs twice', async () => {
        const clone = genRepo({ slug: 'merge-open', mainFile: 'lessons.md' });
        runSkill({ path: PATH_MERGE, args: [], cwd: clone, env: GIT_ENV });
        return runSkill({ path: PATH_MERGE, args: [], cwd: clone, env: GIT_ENV });
      });

      then('the second run refuses with exit 2 and points to --status', () => {
        expect(result.status).toEqual(2);
        expect(result.stderr).toContain('a merge is already open; settle it, or see --status');
      });

      then('the refusal matches its snapshot', () => {
        expect(asSnapStable({ result })).toMatchSnapshot();
      });
    });

    when('[t6] the status is read once main merged in clean', () => {
      const result = useThen('it runs', async () => {
        const clone = genRepo({ slug: 'merge-status', mainFile: 'lessons.md' });
        runSkill({ path: PATH_MERGE, args: [], cwd: clone, env: GIT_ENV });
        return runSkill({ path: PATH_MERGE, args: ['--status'], cwd: clone, env: GIT_ENV });
      });

      then('it exits 0, the merge open and no conflict named', () => {
        expect(result.status).toEqual(0);
        expect(result.stdout).toContain('merge: open');
      });

      then('the status render matches its snapshot, the sha masked', () => {
        expect(result.stdout.replace(/origin\/main [0-9a-f]+/, 'origin/main <sha>')).toMatchSnapshot();
      });
    });

    when('[t7] it is run outside a git repo', () => {
      const result = useThen('it runs', async () => {
        const dir = tempDirs.genOne({ slug: 'merge-no-repo' });
        // GIT_CEILING_DIRECTORIES stops git from a climb into any repo above the temp dir
        return runSkill({ path: PATH_MERGE, args: [], cwd: dir, env: { ...GIT_ENV, GIT_CEILING_DIRECTORIES: dir } });
      });

      then('it refuses with exit 2 as a ConstraintError, not a bare git fatal', () => {
        expect(result.status).toEqual(2);
        expect(result.stderr).toContain('✋ ConstraintError: not a git repo');
        expect(result.stderr).not.toContain('fatal:');
      });

      then('the refusal matches its snapshot', () => {
        expect(asSnapStable({ result })).toMatchSnapshot();
      });
    });

    // a merge staged on a detached HEAD has no branch to conclude on
    when('[t8] HEAD is detached', () => {
      const result = useThen('it runs', async () => {
        const clone = genRepo({ slug: 'merge-detached', mainFile: 'lessons.md' });
        runGit({ cwd: clone, args: ['checkout', '--quiet', '--detach'] });
        return runSkill({ path: PATH_MERGE, args: [], cwd: clone, env: GIT_ENV });
      });

      then('it refuses with exit 2 and names the branch fix, no merge staged', () => {
        expect(result.status).toEqual(2);
        expect(result.stderr).toContain('HEAD is detached');
        expect(result.stderr).toContain('git checkout <branch>');
        expect(result.stdout).not.toContain('merge: open');
      });

      then('the refusal matches its snapshot', () => {
        expect(asSnapStable({ result })).toMatchSnapshot();
      });
    });

    whenHelpIsAsked({ label: '[t9]', path: PATH_MERGE, name: 'git.branch.merge.main' });

    // git opens no merge when the branch already holds origin/main, so no conclusion is owed
    when('[t10] the branch is already level with origin/main', () => {
      const result = useThen('it runs', async () => {
        const clone = genRepo({ slug: 'merge-level', mainFile: 'lessons.md' });
        runGit({ cwd: clone, args: ['merge', '--quiet', '--ff-only', 'origin/main'] });
        return runSkill({ path: PATH_MERGE, args: [], cwd: clone, env: GIT_ENV });
      });

      then('it exits 0, says the branch is level, and owes no commit', () => {
        expect(result.status).toEqual(0);
        expect(result.stdout).toContain('already level with origin/main; naught to merge, naught owed');
        expect(result.stdout).not.toContain('conclude via');
        expect(result.stdout).not.toContain('merge: none open');
      });

      then('the level render matches its snapshot', () => {
        expect(asSnapStable({ result })).toMatchSnapshot();
      });
    });

    when('[t11] the status is read with no merge open', () => {
      const result = useThen('it runs', async () => {
        const clone = genRepo({ slug: 'merge-status-none', mainFile: 'lessons.md' });
        return runSkill({ path: PATH_MERGE, args: ['--status'], cwd: clone, env: GIT_ENV });
      });

      then('it exits 0 and says no merge is open, no conflict', () => {
        expect(result.status).toEqual(0);
        expect(result.stdout).toContain('merge: none open');
        expect(result.stdout).toContain('conflicts: none');
      });

      then('the status render matches its snapshot', () => {
        expect(asSnapStable({ result })).toMatchSnapshot();
      });
    });

    when('[t12] the fetch of origin main fails', () => {
      const result = useThen('it runs', async () => {
        const clone = genRepo({ slug: 'merge-fetch-fails', mainFile: 'lessons.md' });
        runGit({ cwd: clone, args: ['remote', 'set-url', 'origin', join(clone, 'surf-absent-origin')] });
        return runSkill({ path: PATH_MERGE, args: [], cwd: clone, env: GIT_ENV });
      });

      then('it is a malfunction with exit 1, and no merge is staged', () => {
        expect(result.status).toEqual(1);
        expect(result.stderr).toContain('💥 MalfunctionError: git fetch origin main failed');
        expect(result.stdout).not.toContain('merge: open');
      });

      then('the malfunction matches its snapshot', () => {
        expect(asSnapStable({ result })).toMatchSnapshot();
      });
    });
  });

  given('[case7] route.concerns.absorb, fed a malformed list', () => {
    // every line is checked before any call, so a refusal sets no stance at all
    const REFUSALS = [
      { slug: 'no --stone', args: [], stdin: 'mech-failhides blocker.1 conceded better', says: '--stone is required' },
      { slug: 'a bare --stone', args: ['--stone'], stdin: 'mech-failhides blocker.1 conceded better', says: '--stone needs a value' },
      { slug: 'a short line', args: ['--stone', 'x'], stdin: 'mech-failhides blocker.1 conceded', says: 'line 1 needs 4 fields' },
      { slug: 'a bad ordinal', args: ['--stone', 'x'], stdin: 'mech-failhides concern.1 conceded better', says: 'line 1 ordinal must be blocker.N or nitpick.N' },
      { slug: 'a bad severity', args: ['--stone', 'x'], stdin: 'mech-failhides blocker.1 conceded severe', says: 'line 1 severity must be better or urgent' },
      { slug: 'a why-path that is no file', args: ['--stone', 'x'], stdin: 'mech-failhides blocker.1 disputed /surf/absent.md', says: 'line 1 why-path is not a file' },
      { slug: 'a bad stance on line 3', args: ['--stone', 'x'], stdin: '# a note\n\nmech-failhides blocker.1 absorbed better', says: 'line 3 stance must be conceded or disputed' },
    ];
    REFUSALS.forEach((refusal, index) =>
      when(`[t${index}] it is given ${refusal.slug}`, () => {
        const result = useThen('it runs', async () =>
          runSkill({
            path: join(SKILLS, 'route.concerns.absorb.sh'),
            args: refusal.args,
            stdin: refusal.stdin,
          }),
        );

        then('it refuses with exit 2 and names the line', () => {
          expect(result.status).toEqual(2);
          expect(result.stderr).toContain(refusal.says);
          expect(result.stdout).not.toContain('🗿');
        });

        then('the refusal matches its snapshot', () => {
          expect(asSnapStable({ result })).toMatchSnapshot();
        });
      }),
    );

    // a stub `rhx` on PATH stands in for the route driver, so the loop runs hermetic
    when(`[t${REFUSALS.length}] it is given a well-formed list`, () => {
      const result = useThen('it runs', async () => {
        const bin = tempDirs.genOne({ slug: 'absorb-stub-bin' });
        const calls = join(bin, 'calls.log');
        writeFileSync(join(bin, 'rhx'), `#!/usr/bin/env bash\necho "$*" >> "${calls}"\n`, { mode: 0o755 });
        const why = join(bin, 'why.md');
        writeFileSync(why, 'a fulcrum, fixture\n');
        const run = runSkill({
          path: join(SKILLS, 'route.concerns.absorb.sh'),
          args: ['--stone', '5.1.execution.from_vision'],
          stdin: `# r002\nmech-failhides blocker.1 conceded urgent\nmech-failhides nitpick.1 disputed ${why}\n`,
          env: { PATH: `${bin}:${process.env.PATH}` },
        });
        return { ...run, why, calls: readFileSync(calls, 'utf8') };
      });

      then('it exits 0 and calls the driver once per stance', () => {
        expect(result.status).toEqual(0);
        expect(result.calls.split('\n').filter((line) => line.length > 0)).toEqual([
          'route.stone.set --stone 5.1.execution.from_vision --as conceded --with mech-failhides --about blocker.1 --severity urgent',
          `route.stone.set --stone 5.1.execution.from_vision --as disputed --with mech-failhides --about nitpick.1 --why ${result.why}`,
        ]);
      });

      then('the render matches its snapshot, the why-path masked', () => {
        expect(result.stdout.split(result.why).join('<why>')).toMatchSnapshot();
      });
    });

    whenHelpIsAsked({
      label: `[t${REFUSALS.length + 1}]`,
      path: join(SKILLS, 'route.concerns.absorb.sh'),
      name: 'route.concerns.absorb',
    });

    // a stub `rhx` that fails on its second call: the third line must never run
    when(`[t${REFUSALS.length + 2}] the driver fails on the second call`, () => {
      const result = useThen('it runs', async () => {
        const bin = tempDirs.genOne({ slug: 'absorb-stub-fails' });
        const calls = join(bin, 'calls.log');
        writeFileSync(
          join(bin, 'rhx'),
          `#!/usr/bin/env bash\necho "$*" >> "${calls}"\n[[ "$*" == *nitpick.1* ]] && exit 7\nexit 0\n`,
          { mode: 0o755 },
        );
        const run = runSkill({
          path: join(SKILLS, 'route.concerns.absorb.sh'),
          args: ['--stone', '5.1.execution.from_vision'],
          stdin: 'mech-failhides blocker.1 conceded better\nmech-failhides nitpick.1 conceded better\nmech-failhides nitpick.2 conceded better\n',
          env: { PATH: `${bin}:${process.env.PATH}` },
        });
        return { ...run, calls: readFileSync(calls, 'utf8') };
      });

      then('it passes the failed call exit code on', () => {
        expect(result.status).toEqual(7);
      });

      then('the rest of the list never runs, and no count is claimed', () => {
        expect(result.calls.split('\n').filter((line) => line.length > 0)).toHaveLength(2);
        expect(result.calls).not.toContain('nitpick.2');
        expect(result.stdout).not.toContain('concerns rendered');
      });

      then('the halted render matches its snapshot', () => {
        expect(asSnapStable({ result })).toMatchSnapshot();
      });
    });

    when(`[t${REFUSALS.length + 3}] it is given a list of only comments and blank lines`, () => {
      const result = useThen('it runs', async () => {
        const bin = tempDirs.genOne({ slug: 'absorb-stub-empty' });
        const calls = join(bin, 'calls.log');
        writeFileSync(join(bin, 'rhx'), `#!/usr/bin/env bash\necho "$*" >> "${calls}"\n`, { mode: 0o755 });
        const run = runSkill({
          path: join(SKILLS, 'route.concerns.absorb.sh'),
          args: ['--stone', '5.1.execution.from_vision'],
          stdin: '# r002, all answered\n\n   \n',
          env: { PATH: `${bin}:${process.env.PATH}` },
        });
        return { ...run, called: existsSync(calls) };
      });

      then('it exits 0, makes no call, and renders 0 concerns', () => {
        expect(result.status).toEqual(0);
        expect(result.called).toEqual(false);
        expect(result.stdout).toContain('🦉 0 concerns rendered');
      });

      then('the empty render matches its snapshot', () => {
        expect(asSnapStable({ result })).toMatchSnapshot();
      });
    });
  });

  given('[case8] chmodsafe, on files inside and outside the repo', () => {
    // a fixture git repo, so "inside the repo" has a root the test owns
    const scene = useBeforeAll(async () => {
      const repo = tempDirs.genOne({ slug: 'chmodsafe-repo' });
      runGit({ cwd: repo, args: ['init', '-q'] });
      const skill = join(repo, 'lesson.book.sh');
      writeFileSync(skill, '#!/usr/bin/env bash\necho surf\n', { mode: 0o644 });
      const outside = join(tempDirs.genOne({ slug: 'chmodsafe-outside' }), 'board.sh');
      writeFileSync(outside, '#!/usr/bin/env bash\n', { mode: 0o644 });
      return { repo, skill, outside };
    });

    when('[t0] a repo file is marked --exec on', () => {
      const result = useThen('it runs', async () => {
        const run = runSkill({
          path: join(SKILLS, 'chmodsafe.sh'),
          args: ['--exec', 'on', 'lesson.book.sh'],
          cwd: scene.repo,
        });
        return { ...run, modeAfter: statSync(scene.skill).mode & 0o777 };
      });

      then('it exits 0 and the file holds the exec bits, its read/write bits kept', () => {
        expect(result.status).toEqual(0);
        expect(result.modeAfter & 0o111).toBeGreaterThan(0);
        expect(result.modeAfter & 0o666).toEqual(0o644);
        expect(result.stdout).toContain('-rwx');
      });

      then('the render matches its snapshot', () => {
        expect(asSnapStable({ result, swaps: [[scene.repo, '<fixture-repo>']] })).toMatchSnapshot();
      });
    });

    const REFUSALS = [
      { slug: 'no --exec', args: ['lesson.book.sh'], says: '--exec must be on or off' },
      { slug: 'no path', args: ['--exec', 'on'], says: 'name at least one path' },
      { slug: 'a dir', args: ['--exec', 'on', '.git'], says: 'not a regular file' },
      { slug: 'a path outside the repo', args: ['--exec', 'on', '<outside>'], says: 'outside the repo' },
    ];
    REFUSALS.forEach((refusal, index) =>
      when(`[t${1 + index}] it is given ${refusal.slug}`, () => {
        const result = useThen('it runs', async () =>
          runSkill({
            path: join(SKILLS, 'chmodsafe.sh'),
            args: refusal.args.map((arg) => (arg === '<outside>' ? scene.outside : arg)),
            cwd: scene.repo,
          }),
        );

        then('it refuses with exit 2, names why, and changes no mode', () => {
          expect(result.status).toEqual(2);
          expect(result.stderr).toContain(refusal.says);
          expect(statSync(scene.outside).mode & 0o111).toEqual(0);
        });

        then('the refusal matches its snapshot', () => {
          expect(
            asSnapStable({
              result,
              swaps: [
                [scene.repo, '<fixture-repo>'],
                [scene.outside, '<outside>/board.sh'],
              ],
            }),
          ).toMatchSnapshot();
        });
      }),
    );

    whenHelpIsAsked({
      label: `[t${1 + REFUSALS.length}]`,
      path: join(SKILLS, 'chmodsafe.sh'),
      name: 'chmodsafe',
    });

    when(`[t${2 + REFUSALS.length}] two repo files are marked --exec on, then --exec off`, () => {
      const result = useThen('it runs both', async () => {
        const second = join(scene.repo, 'lesson.cancel.sh');
        writeFileSync(second, '#!/usr/bin/env bash\necho wipeout\n', { mode: 0o644 });
        const on = runSkill({
          path: join(SKILLS, 'chmodsafe.sh'),
          args: ['--exec', 'on', 'lesson.book.sh', 'lesson.cancel.sh'],
          cwd: scene.repo,
        });
        const modesOn = [scene.skill, second].map((file) => statSync(file).mode & 0o777);
        const off = runSkill({
          path: join(SKILLS, 'chmodsafe.sh'),
          args: ['--exec', 'off', 'lesson.book.sh', 'lesson.cancel.sh'],
          cwd: scene.repo,
        });
        const modesOff = [scene.skill, second].map((file) => statSync(file).mode & 0o777);
        return { on, off, modesOn, modesOff };
      });

      then('--exec on marks every named file, and names each', () => {
        expect(result.on.status).toEqual(0);
        result.modesOn.forEach((mode) => expect(mode & 0o111).toBeGreaterThan(0));
        expect(result.on.stdout).toContain('2 file(s)');
      });

      then('--exec off clears the exec bits of every file, its read/write bits kept', () => {
        expect(result.off.status).toEqual(0);
        result.modesOff.forEach((mode) => expect(mode).toEqual(0o644));
        expect(result.off.stdout).toContain('-rw-r--r-- lesson.cancel.sh');
      });

      then('the off render matches its snapshot', () => {
        expect(asSnapStable({ result: result.off, swaps: [[scene.repo, '<fixture-repo>']] })).toMatchSnapshot();
      });
    });

    when(`[t${3 + REFUSALS.length}] it is given an unknown flag`, () => {
      const result = useThen('it runs', async () =>
        runSkill({
          path: join(SKILLS, 'chmodsafe.sh'),
          args: ['--recursive', '--exec', 'on', 'lesson.book.sh'],
          cwd: scene.repo,
        }),
      );

      then('it refuses with exit 2 and names the flag', () => {
        expect(result.status).toEqual(2);
        expect(result.stderr).toContain("✋ ConstraintError: unknown flag '--recursive'");
      });

      then('the refusal matches its snapshot', () => {
        expect(asSnapStable({ result, swaps: [[scene.repo, '<fixture-repo>']] })).toMatchSnapshot();
      });
    });

    // a symlink inside the repo that points out of it must never carry the change outside
    when(`[t${4 + REFUSALS.length}] it is given a symlink to a file outside the repo`, () => {
      const result = useThen('it runs', async () => {
        const link = join(scene.repo, 'board.link.sh');
        symlinkSync(scene.outside, link);
        const run = runSkill({
          path: join(SKILLS, 'chmodsafe.sh'),
          args: ['--exec', 'on', 'board.link.sh'],
          cwd: scene.repo,
        });
        return { ...run, modeOutside: statSync(scene.outside).mode & 0o777 };
      });

      then('it refuses with exit 2, and the outside file keeps its mode', () => {
        expect(result.status).toEqual(2);
        expect(result.stderr).toContain('not a regular file: board.link.sh');
        expect(result.modeOutside).toEqual(0o644);
      });

      then('the refusal matches its snapshot', () => {
        expect(asSnapStable({ result, swaps: [[scene.repo, '<fixture-repo>']] })).toMatchSnapshot();
      });
    });
  });

  given('[case9] task.output.await, on a task output file', () => {
    when('[t0] the pattern is already in the file', () => {
      const result = useThen('it runs', async () => {
        const file = join(tempDirs.genOne({ slug: 'await-found' }), 'task.output');
        writeFileSync(file, '💤 inflight (15s)\n🎉 passed (58s)\n');
        return runSkill({
          path: join(SKILLS, 'task.output.await.sh'),
          args: ['--file', file, '--pattern', 'passed|failed', '--max-sec', '20'],
        });
      });

      then('it exits 0 at once and prints the tail', () => {
        expect(result.status).toEqual(0);
        expect(result.stdout).toContain('found after 0s');
        expect(result.stdout).toContain('🎉 passed (58s)');
      });

      then('the found render matches its snapshot', () => {
        expect(asSnapStable({ result })).toMatchSnapshot();
      });
    });

    when('[t1] the pattern never shows inside the bound', () => {
      const result = useThen('it runs', async () => {
        const file = join(tempDirs.genOne({ slug: 'await-bound' }), 'task.output');
        writeFileSync(file, '💤 inflight (15s)\n');
        return runSkill({
          path: join(SKILLS, 'task.output.await.sh'),
          args: ['--file', file, '--pattern', 'passed|failed', '--max-sec', '10'],
        });
      });

      then('it exits 2 and says the task still runs', () => {
        expect(result.status).toEqual(2);
        expect(result.stdout).toContain('not yet, after 10s');
      });

      then('the bound render matches its snapshot', () => {
        expect(asSnapStable({ result })).toMatchSnapshot();
      });
    });

    const REFUSALS = [
      { slug: 'no --file', args: ['--pattern', 'x'], says: '--file is required' },
      { slug: 'no --pattern', args: ['--file', '/dev/null'], says: '--pattern is required' },
      { slug: 'a word for --max-sec', args: ['--file', '/dev/null', '--pattern', 'x', '--max-sec', 'soon'], says: '--max-sec must be an integer' },
      { slug: 'an absent file', args: ['--file', '/surf/absent.output', '--pattern', 'x'], says: 'no such file' },
    ];
    REFUSALS.forEach((refusal, index) =>
      when(`[t${2 + index}] it is given ${refusal.slug}`, () => {
        const result = useThen('it runs', async () =>
          runSkill({ path: join(SKILLS, 'task.output.await.sh'), args: refusal.args }),
        );

        then('it refuses with exit 2 and names why', () => {
          expect(result.status).toEqual(2);
          expect(result.stderr).toContain(refusal.says);
        });

        then('the refusal matches its snapshot', () => {
          expect(asSnapStable({ result })).toMatchSnapshot();
        });
      }),
    );

    whenHelpIsAsked({
      label: `[t${2 + REFUSALS.length}]`,
      path: join(SKILLS, 'task.output.await.sh'),
      name: 'task.output.await',
    });
  });

  given('[case10] gh.workflow.logs, run as rhx runs it', () => {
    // rhx passes --skill, --repo and --role to every skill; this skill once refused them
    when('[t0] the rhachet args arrive beside a flag it does not know', () => {
      const result = useThen('it runs', async () =>
        runSkill({
          path: join(SKILLS, 'gh.workflow.logs.sh'),
          args: ['--skill', 'gh.workflow.logs', '--repo', '.this', '--role', 'any', '--bogus'],
        }),
      );

      then('it skips the rhachet args and refuses the unknown flag alone, exit 2', () => {
        expect(result.status).toEqual(2);
        expect(result.stderr).toContain('✋ ConstraintError: unknown argument: --bogus');
        expect(result.stderr).not.toContain('--skill');
      });

      then('the refusal matches its snapshot', () => {
        expect(asSnapStable({ result })).toMatchSnapshot();
      });
    });
  });
});
