/**
 * .what = clamps on `git.grove.capacity` — the four limits, the gate, the levers
 *
 * .why  = the verb's whole claim is "the limit that binds", and three of its
 *         fail-safes are invisible on a happy read:
 *           - an uncalibrated cap must read ⚪ and mark the count an upper bound
 *           - two asks for the last slot must not both win
 *           - a lever on an axis that does not bind must show +0, not its spend cut
 *         each case below makes one of them observable
 *
 * .the fixture = the grove half reads the real /proc, so a hermetic home alone
 *         gives it no crew — a ci runner holds no claude seat. so each suite
 *         spawns ONE live crew of its own: a cpu spinner whose comm is `claude`
 *         (a symlink to bash), its cwd in a fixture worktree that binds a route.
 *         every other row the probe sees is the real box. the gate (case2) is the
 *         one exception: it reads a fixture probe record, so its free slots are
 *         known and a race can be held to exactly one grant
 */
import { type ChildProcess, spawn, spawnSync } from 'child_process';
import {
  cpSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  symlinkSync,
  utimesSync,
  writeFileSync,
} from 'fs';
import { basename, dirname, join } from 'path';
import { given, then, useBeforeAll, useThen, when } from 'test-fns';

import { asKeyShape } from '../../.test/asKeyShape';
import { tempDirs } from '../../.test/tempDirs';
import {
  genCall,
  genFixtureHome,
  getEpochAhead,
  PATH_CAPACITY,
  runVerb,
} from './git.crew.tokens.harness';

// .note = deliberate mutation: a registry of the spinners this suite spawned, so the
//         exit handler can kill each one; a push per spawn is the only write
const SPINNERS: ChildProcess[] = [];

// .what = kill every spinner, its whole process group
// .why  = a spinner whose comm is `claude` that outlives the suite reads as a live crew
//         to every later read on the box; afterAll alone misses a jest worker that dies
const killSpinners = (): void => {
  SPINNERS.forEach((child) => {
    if (child.pid === undefined || child.exitCode !== null) return;
    try {
      process.kill(-child.pid, 'SIGKILL');
    } catch (error) {
      // the group is already gone: the only error this kill may meet
      if ((error as NodeJS.ErrnoException).code !== 'ESRCH') throw error;
    }
  });
};
process.on('exit', killSpinners);

afterAll(() => {
  killSpinners();
  tempDirs.delAll();
});

/**
 * .what = a model render with every value the live box decides masked
 * .why  = the grove half reads the real /proc, so counts, the stall mark, and the axis
 *         that binds differ run to run; the shape of the render is what the snapshot holds
 */
const asMaskedRender = (input: { stdout: string }): string =>
  input.stdout
    .replace(/🟢|🟡|🔴/g, '◯')
    .replace(/, no sprout/g, '')
    .replace(
      /\b(binds|on|against) (ram|cpu|tokens_5h|tokens_7d)\b/g,
      '$1 <axis>',
    )
    .replace(/~(\d+(\.\d+)?) \(est\.\)/g, '$1')
    // the cap windows are labels, not live values: keep 5h and 7d apart in the snap
    .replace(/\b(5h|7d)\b/g, '⟨$1⟩')
    .replace(/\d+(\.\d+)?/g, 'N')
    .replace(/⟨N([hd])⟩/g, (_, unit: string) => (unit === 'h' ? '5h' : '7d'));

/**
 * .what = a render on a fixture record, with every figure masked and the fixture home named
 * .why  = the record fixes the box, so the marks and the axis that binds are the claim under
 *         test and stay in the snap; the token figures move with the clock, so the numbers go
 */
const asMaskedFixtureFigures = (input: {
  text: string;
  home: string;
}): string =>
  input.text
    .split(input.home)
    .join('<home>')
    // a window label stands alone or after `tokens_`; a figure never does
    .replace(/(?<!\d|\d\.)(5h|7d)\b/g, '⟨$1⟩')
    .replace(/\d+(\.\d+)?/g, 'N')
    .replace(/⟨N([hd])⟩/g, (_, unit: string) => (unit === 'h' ? '5h' : '7d'));

/**
 * .what = a gate render with the hold facts the clock or the pid decide masked
 * .why  = an unkeyed hold id carries the pid and a random suffix, and a hold's lapse counts
 *         down by the minute; the rest of a refusal is the fixture's own, and stays in the snap
 */
const asMaskedHolds = (input: { text: string }): string =>
  input.text
    .replace(/\.(behavior|directive)\.[0-9]+\.[0-9]+\b/g, '.$1.<pid>.<rand>')
    .replace(/lapses in \d+ min/g, 'lapses in <N> min');

/**
 * .what = the lever rows of a --levers tree: the branches beneath the `levers, by gain` group, and no other
 * .why  = the kind and exchange rows sit beside the group at a shallower depth; a filter by
 *         line shape alone folds them in among the levers (5.3 i003 r6.nitpick.3)
 */
const getLeverRows = (input: { stdout: string }): string[] => {
  const lines = input.stdout.split('\n');
  const header = lines.findIndex((line) => line.includes('levers, by gain'));
  if (header < 0) return [];
  const depth = lines[header]!.search(/[├└]─/);
  const after = lines.slice(header + 1);
  const end = after.findIndex((line) => !(line.search(/[├└]─/) > depth));
  return end < 0 ? after : after.slice(0, end);
};

const TREE = 'svc-lessons.beav.feat-book-a-lesson';

/**
 * .what = a live crew this suite owns: a `claude` spinner in the fixture tree
 * .why  = the grove half needs a crew at work to read a cost from (see header)
 */
const genLiveCrew = (input: { home: string }): void => {
  const bin = tempDirs.genOne({ slug: 'capacity-bin' });
  const claude = join(bin, 'claude');
  symlinkSync(spawnSync('which', ['bash']).stdout.toString().trim(), claude);
  // detached: its own process group, so one group kill reaps it whole
  const child = spawn(claude, ['-c', 'while :; do :; done'], {
    cwd: join(input.home, 'git', 'sandpine', '_worktrees', TREE),
    stdio: 'ignore',
    detached: true,
  });
  SPINNERS.push(child);
};

/**
 * .what = a fixture home whose 5h window is calibrated, whose 7d window is not
 * .why  = a tiny % rise against real burn makes the pool sustain far more than
 *         one crew burns, so the token limit cannot be the one that binds
 */
const genCalibratedHome = (input: { slug: string }) => {
  const resets5h = getEpochAhead({ mins: 200 });
  return genFixtureHome({
    slug: input.slug,
    crews: [
      {
        tree: TREE,
        branch: 'beav/feat-book-a-lesson',
        bound: true,
        account: 'bert@example.com',
        calls: [genCall({ id: 'msg-a', minsAgo: 30 })],
      },
    ],
    caps: [
      {
        tree: TREE,
        account: 'bert@example.com',
        minsAgo: 130,
        fiveHour: { used: 10, resetsAt: resets5h },
        sevenDay: null,
      },
      {
        tree: TREE,
        account: 'bert@example.com',
        minsAgo: 1,
        fiveHour: { used: 10.1, resetsAt: resets5h },
        sevenDay: null,
      },
    ],
  });
};

describe('git.grove.capacity', () => {
  given(
    '[case1] a grove with a live behavior crew and an uncalibrated pool',
    () => {
      const scene = useBeforeAll(async () => {
        const fixture = genFixtureHome({
          slug: 'capacity-read',
          crews: [
            {
              tree: TREE,
              branch: 'beav/feat-book-a-lesson',
              bound: true,
              account: 'bert@example.com',
              calls: [genCall({ id: 'msg-a', minsAgo: 30 })],
            },
          ],
        });
        genLiveCrew({ home: fixture.home });
        return fixture;
      });

      when('[t0] the read runs as json', () => {
        const result = useThen('it reads', async () =>
          runVerb({
            path: PATH_CAPACITY,
            args: ['local', '--sample', '3', '--json'],
            home: scene.home,
            forest: scene.forest,
          }),
        );
        const model = useThen('it parses', async () =>
          JSON.parse(result.stdout),
        );

        then('it exits 0 with the grove read', () => {
          expect(result.status).toEqual(0);
          expect(model.groves[0].state).toEqual('read');
        });

        // cores > 0, not >= the 0.25 at-work bar: a loaded box starves the spin loop
        then(
          'the fixture crew is live, its cpu sampled, and filed as behavior',
          () => {
            const crew = model.groves[0].record.crews.find(
              (c: { crew: string }) => c.crew.endsWith(TREE),
            );
            expect(crew.kind).toEqual('behavior');
            expect(crew.rss_kb).toBeGreaterThan(0);
            expect(crew.cores).toBeGreaterThan(0);
          },
        );

        then(
          'both token limits read ⚪, and the count is an upper bound',
          () => {
            const behavior = model.groves[0].kinds.behavior;
            expect(behavior.limits.tokens_5h).toBeNull();
            expect(behavior.limits.tokens_7d).toBeNull();
            expect(behavior.upper_bound).toEqual(true);
            expect(behavior.unread_axes).toEqual(['tokens_5h', 'tokens_7d']);
            expect(model.tokens.five_hour.verdict.state).toEqual(
              'uncalibrated',
            );
          },
        );

        then(
          'the grove limits are numbers, and the binder is one of them',
          () => {
            const behavior = model.groves[0].kinds.behavior;
            expect(typeof behavior.limits.ram).toEqual('number');
            expect(typeof behavior.limits.cpu).toEqual('number');
            expect(behavior.affordable).toEqual(
              Math.min(behavior.limits.ram, behavior.limits.cpu),
            );
            expect(['ram', 'cpu']).toContain(behavior.binds);
          },
        );

        // the vision defines limit.cpu as the crews before the stall crosses 🟡; core
        // arithmetic only estimates that, so the record says so, and a box already at
        // 🟡+ caps the estimate at the crews at work now
        then(
          'the cpu limit is marked an estimate, capped once the stall reads 🟡+',
          () => {
            const grove = model.groves[0];
            const behavior = grove.kinds.behavior;
            expect(behavior.estimates).toEqual(['cpu']);
            if (grove.cpu_stall.mark === '🟡' || grove.cpu_stall.mark === '🔴')
              expect(behavior.limits.cpu).toBeLessThanOrEqual(
                grove.crews_at_work,
              );
          },
        );

        // found on 0901: at load 30-53 on 4 cores the read said "5 free" — it subtracted the
        // crews' own cores alone, while tmux, zsh, and systemd carry most of the cpu flow
        then(
          'free cpu slots subtract what the whole box spends, not the crews alone',
          () => {
            const grove = model.groves[0];
            const behavior = grove.kinds.behavior;
            expect(typeof grove.record.busy_cores).toEqual('number');
            expect(grove.record.busy_cores).toBeGreaterThan(0);
            const byCores = Math.max(
              Math.floor(
                (grove.record.cpus - grove.record.busy_cores) / behavior.cores,
              ),
              0,
            );
            expect(behavior.free.cpu).toEqual(
              grove.cpu_stall.mark === '🔴' ? 0 : byCores,
            );
          },
        );

        // a box past the 🔴 stall line takes no sprout, whatever its core math says
        // (rule.require.bound-grove-concurrency-by-saturation); on a calm box the formula
        // branch above bites, on a 🔴 box the zero does
        // the mark is the worse of the minute (avg60) and the life row (since boot), each on
        // the 2% and 10% lines git.grove.saturation draws
        then(
          'the cpu stall is read and marked against the 2% and 10% lines, minute and life',
          () => {
            const stall = model.groves[0].cpu_stall;
            expect(typeof stall.pct).toEqual('number');
            expect(typeof stall.life_pct).toEqual('number');
            const rank = (pct: number): number =>
              pct >= 10 ? 2 : pct >= 2 ? 1 : 0;
            const markExpected = ['🟢', '🟡', '🔴'][
              Math.max(rank(stall.pct), rank(stall.life_pct))
            ];
            expect(stall.mark).toEqual(markExpected);
          },
        );

        then('the box fork rate is read', () => {
          expect(typeof model.groves[0].record.forks_per_sec).toEqual('number');
          expect(model.groves[0].record.forks_per_sec).toBeGreaterThanOrEqual(
            0,
          );
        });

        then(
          'the token cost per crew-hour is the fleet burn of the kind',
          () => {
            expect(model.tokens.per_crew_hour.behavior).toBeGreaterThan(0);
          },
        );

        // the --json read is a caller surface (a tick parses it): its shape is held whole
        then('the read record shape matches its snapshot', () => {
          expect(asKeyShape(model)).toMatchSnapshot();
        });
      });

      when('[t1] the read renders the tree', () => {
        const result = useThen('it reads', async () =>
          runVerb({
            path: PATH_CAPACITY,
            args: ['local', '--sample', '3'],
            home: scene.home,
            forest: scene.forest,
          }),
        );

        then('it names the upper bound and the unread caps', () => {
          expect(result.status).toEqual(0);
          expect(result.stdout).toContain('🌲 grove capacity');
          expect(result.stdout).toContain('(upper bound)');
          expect(result.stdout).toContain('5h: ⚪');
          expect(result.stdout).toMatch(/cpu stall (🟢|🟡|🔴) [\d.]+%/);
          expect(result.stdout).toContain('🥥 next');
          expect(result.stdout).toMatch(/cpu ~\d+ \(est\.\)/);
        });

        then('the render, its live values masked, matches its snapshot', () => {
          expect(asMaskedRender({ stdout: result.stdout })).toMatchSnapshot();
        });
      });

      when('[t2] a reader closes stdout after one line', () => {
        const result = useThen('it reads', async () =>
          runVerb({
            path: PATH_CAPACITY,
            args: ['local', '--sample', '1'],
            home: scene.home,
            forest: scene.forest,
            pipeHead: true,
          }),
        );

        then('the pipe exits 0 with no broken-pipe trace', () => {
          expect(result.status).toEqual(0);
          expect(result.stderr).not.toContain('Broken pipe');
        });
      });
    },
  );

  // the gate runs on a fixture record, so the free slots are known: one behavior slot
  // (4 cpus, 3 busy, a behavior crew at 1 core ⇒ free cpu 1; ram leaves 10; tokens unread)
  given('[case2] the sprout gate, on a box with exactly one free slot', () => {
    const scene = useBeforeAll(async () => {
      const fixture = genFixtureHome({
        slug: 'capacity-gate',
        crews: [
          {
            tree: TREE,
            branch: 'beav/feat-book-a-lesson',
            bound: true,
            account: 'bert@example.com',
            calls: [genCall({ id: 'msg-a', minsAgo: 30 })],
          },
        ],
      });
      const record = join(fixture.home, 'capacity.record.json');
      writeFileSync(
        record,
        JSON.stringify({
          host: 'sandpine-box',
          cpus: 4,
          mem_total_kb: 16_777_216,
          mem_avail_kb: 12_582_912,
          psi_cpu_some_avg60: '0.00',
          psi_mem_full_avg60: '0.00',
          sample_sec: 2,
          busy_cores: 3,
          forks_per_sec: 40,
          crews: [
            {
              crew: join(fixture.home, 'git', 'sandpine', '_worktrees', TREE),
              kind: 'behavior',
              seats: 1,
              procs: 3,
              rss_kb: 1_048_576,
              cores: 1,
            },
          ],
        }),
      );
      return { ...fixture, env: { GIT_GROVE_CAPACITY_FIXTURE_RECORD: record } };
    });
    const holdDir = (home: string): string =>
      join(
        home,
        '.rhachet',
        'storage',
        'repo=bhuild',
        'role=supervisor',
        'git.grove.capacity',
        'holds',
      );

    when('[t0] three asks race for behavior slots on local', () => {
      const asks = useThen('they all answer', async () => {
        const runs = [0, 1, 2].map(
          () =>
            new Promise<{ status: number | null; stdout: string }>((done) => {
              const child = spawn(
                'bash',
                [
                  PATH_CAPACITY,
                  '--grove',
                  'local',
                  '--for',
                  'behavior',
                  '--sample',
                  '2',
                  '--json',
                ],
                {
                  env: {
                    ...process.env,
                    HOME: scene.home,
                    GIT_FOREST_DIR: scene.forest,
                    ...scene.env,
                  },
                },
              );
              const out: Buffer[] = [];
              child.stdout.on('data', (chunk: Buffer) => out.push(chunk));
              child.on('close', (status) =>
                done({ status, stdout: Buffer.concat(out).toString('utf8') }),
              );
            }),
        );
        // an object, never a bare array: the useThen proxy carries no array methods
        return {
          list: (await Promise.all(runs)).map((run) => ({
            status: run.status,
            answer: JSON.parse(run.stdout),
          })),
        };
      });

      then('every ask saw exactly one free slot', () => {
        expect(asks.list.map((ask) => ask.answer.free)).toEqual([1, 1, 1]);
      });

      then('exactly one of the three was granted, with exit 0', () => {
        const granted = asks.list.filter((ask) => ask.answer.granted);
        expect(granted).toHaveLength(1);
        expect(granted[0]!.status).toEqual(0);
      });

      then('the other two were refused with exit 2, the slot held', () => {
        const refused = asks.list.filter((ask) => !ask.answer.granted);
        expect(refused.map((ask) => ask.status)).toEqual([2, 2]);
        refused.forEach((ask) => expect(ask.answer.held_before).toEqual(1));
      });

      then('the grant left exactly one hold, under the home storage', () => {
        const holds = readdirSync(holdDir(scene.home)).filter((name) =>
          name.endsWith('.hold'),
        );
        expect(holds).toHaveLength(1);
      });

      then('a release drops the hold it names', () => {
        const granted = asks.list.find((ask) => ask.answer.granted)!;
        const release = runVerb({
          path: PATH_CAPACITY,
          args: ['--release', granted.answer.hold],
          home: scene.home,
          forest: scene.forest,
        });
        expect(release.status).toEqual(0);
        expect(release.stdout).toContain(`dropped hold ${granted.answer.hold}`);
        expect(
          readdirSync(holdDir(scene.home)).filter((name) =>
            name.endsWith('.hold'),
          ),
        ).toHaveLength(0);
        // the release tree was held by toContain alone (5.3 i004 r10.nitpick.4)
        expect({
          status: release.status,
          stdout: release.stdout.split(granted.answer.hold).join('<hold>'),
          stderr: release.stderr,
        }).toMatchSnapshot();
      });
    });

    // a retry of a sprout must not take a second slot: one key, one hold
    when('[t1] one key asks for the slot twice', () => {
      const asks = useThen('both answer', async () => {
        const ask = () =>
          runVerb({
            path: PATH_CAPACITY,
            args: [
              '--grove',
              'local',
              '--for',
              'behavior',
              '--key',
              'beav/feat-surf-forecast',
              '--sample',
              '2',
              '--json',
            ],
            home: scene.home,
            forest: scene.forest,
            env: scene.env,
          });
        const first = ask();
        const second = ask();
        // a third ask under the same key, as a tree: the reheld grant a human reads
        const third = runVerb({
          path: PATH_CAPACITY,
          args: [
            '--grove',
            'local',
            '--for',
            'behavior',
            '--key',
            'beav/feat-surf-forecast',
            '--sample',
            '2',
          ],
          home: scene.home,
          forest: scene.forest,
          env: scene.env,
        });
        return {
          first: { status: first.status, answer: JSON.parse(first.stdout) },
          second: { status: second.status, answer: JSON.parse(second.stdout) },
          third: { status: third.status, stdout: third.stdout },
        };
      });

      then('the grant decision shape matches its snapshot', () => {
        expect(asKeyShape(asks.first.answer)).toMatchSnapshot();
      });

      then('the reheld decision shape matches its snapshot', () => {
        expect(asKeyShape(asks.second.answer)).toMatchSnapshot();
      });

      // the reheld grant was held in json alone (5.3 i003 r4.nitpick.1)
      then(
        'the reheld tree names the renewed hold, and matches its snapshot',
        () => {
          expect(asks.third.status).toEqual(0);
          expect(asks.third.stdout).toContain(
            'the hold this key already took, renewed',
          );
          expect(asks.third.stdout).toMatchSnapshot();
        },
      );

      then('the first is granted under a hold named for its key', () => {
        expect(asks.first.status).toEqual(0);
        expect(asks.first.answer.hold).toEqual(
          'local.behavior.beav+feat-surf-forecast',
        );
      });

      then('the retry is reheld under the same hold, not a second slot', () => {
        expect(asks.second.status).toEqual(0);
        expect(asks.second.answer.reheld).toEqual(true);
        expect(asks.second.answer.hold).toEqual(asks.first.answer.hold);
      });
    });

    // the key above holds the box's only slot: a stale hold must free it
    when('[t2] the hold that takes the slot ages past its bound', () => {
      const asks = useThen('another key asks, before and after', async () => {
        const ask = (key: string) =>
          runVerb({
            path: PATH_CAPACITY,
            args: [
              '--grove',
              'local',
              '--for',
              'behavior',
              '--key',
              key,
              '--sample',
              '2',
              '--json',
            ],
            home: scene.home,
            forest: scene.forest,
            env: scene.env,
          });
        const before = ask('beav/feat-coachbook');
        const aged = new Date(Date.now() - 16 * 60 * 1000);
        utimesSync(
          join(
            holdDir(scene.home),
            'local.behavior.beav+feat-surf-forecast.hold',
          ),
          aged,
          aged,
        );
        const after = ask('beav/feat-cert-ingest');
        return {
          before: { status: before.status, answer: JSON.parse(before.stdout) },
          after: { status: after.status, answer: JSON.parse(after.stdout) },
        };
      });

      then('while the hold is fresh, a new key is refused with exit 2', () => {
        expect(asks.before.status).toEqual(2);
        expect(asks.before.answer.granted).toEqual(false);
      });

      then('the refusal decision shape matches its snapshot', () => {
        expect(asKeyShape(asks.before.answer)).toMatchSnapshot();
      });

      then('once it lapses, the new key is granted the slot', () => {
        expect(asks.after.status).toEqual(0);
        expect(asks.after.answer.granted).toEqual(true);
        expect(asks.after.answer.held_before).toEqual(0);
      });
    });

    // the box holds no directive crew, so its cost is borrowed: the grant must say so
    when('[t3] a directive slot is asked, as a tree', () => {
      const result = useThen(
        'it answers, once the one slot is freed',
        async () => {
          // the key granted in [t2] holds the slot: drop it, so the ask meets a free box
          const release = runVerb({
            path: PATH_CAPACITY,
            args: ['--release', 'local.behavior.beav+feat-cert-ingest'],
            home: scene.home,
            forest: scene.forest,
          });
          expect(release.status).toEqual(0);
          return runVerb({
            path: PATH_CAPACITY,
            args: ['--grove', 'local', '--for', 'directive', '--sample', '2'],
            home: scene.home,
            forest: scene.forest,
            env: scene.env,
          });
        },
      );

      then('it is granted, and marks its cost as an estimate', () => {
        expect(result.status).toEqual(0);
        expect(result.stdout).toContain(
          'an estimate: no directive crew on local',
        );
      });

      then('the grant tree matches its snapshot, the hold id masked', () => {
        expect(
          result.stdout.replace(
            /local\.directive\.[0-9]+\.[0-9]+/g,
            'local.directive.<pid>.<rand>',
          ),
        ).toMatchSnapshot();
      });
    });

    when('[t4] the gate is asked with no grove', () => {
      const result = useThen('it runs', async () =>
        runVerb({
          path: PATH_CAPACITY,
          args: ['--for', 'behavior'],
          home: scene.home,
          forest: scene.forest,
        }),
      );

      then("it refuses with exit 2: the slot is a grove's to give", () => {
        expect(result.status).toEqual(2);
        expect(result.stderr).toContain('the gate needs one grove');
      });

      then('the refusal matches its snapshot', () => {
        expect({
          status: result.status,
          stdout: result.stdout,
          stderr: result.stderr,
        }).toMatchSnapshot();
      });
    });

    // the directive grant of [t3] holds the box's one slot: a behavior ask meets a full box
    when('[t5] a behavior slot is asked of the full box, as a tree', () => {
      const result = useThen('it answers', async () =>
        runVerb({
          path: PATH_CAPACITY,
          args: ['--grove', 'local', '--for', 'behavior', '--sample', '2'],
          home: scene.home,
          forest: scene.forest,
          env: scene.env,
        }),
      );

      then('it is refused with exit 2, the held slot named', () => {
        expect(result.status).toEqual(2);
        expect(result.stderr).toContain('no behavior slot on local');
        expect(result.stderr).toContain(
          'free: 1 · held by sprouts in flight: 1',
        );
      });

      // the box has room and a hold alone fills it: the way out is the hold, never a fell
      then('it names the hold, its kind, its lapse, and --release', () => {
        expect(result.stderr).toMatch(
          /├─ held by sprouts in flight — each lapses on its own, or on --release\n {3}│ {2}└─ local\.directive\.\d+\.\d+ · directive · lapses in \d+ min\n/,
        );
        expect(result.stderr).toContain('rhx git.grove.capacity --release');
        expect(result.stderr).not.toContain('idle crews');
      });

      then('the refusal tree matches its snapshot', () => {
        expect(asMaskedHolds({ text: result.stderr })).toMatchSnapshot();
      });
    });

    // a keyed sprout already holds a slot; another hold then fills the box. its retry must
    // still read granted: a findsert returns the extant, whatever the box reads now
    when('[t6] a keyed hold retries once the box is full', () => {
      const asks = useThen(
        'the retry and a look-alike key answer',
        async () => {
          writeFileSync(
            join(
              holdDir(scene.home),
              'local.behavior.beav+feat-coachbook.hold',
            ),
            'box=local\ngrove=local\nkind=behavior\n',
          );
          const ask = (key: string) =>
            runVerb({
              path: PATH_CAPACITY,
              args: [
                '--grove',
                'local',
                '--for',
                'behavior',
                '--key',
                key,
                '--sample',
                '2',
                '--json',
              ],
              home: scene.home,
              forest: scene.forest,
              env: scene.env,
            });
          const retry = ask('beav/feat-coachbook');
          const lookalike = ask('beav.feat-coachbook');
          // the look-alike refusal as a tree, the render a human reads (5.3 i004 r10.nitpick.4)
          const lookalikeTree = runVerb({
            path: PATH_CAPACITY,
            args: [
              '--grove',
              'local',
              '--for',
              'behavior',
              '--key',
              'beav.feat-coachbook',
              '--sample',
              '2',
            ],
            home: scene.home,
            forest: scene.forest,
            env: scene.env,
          });
          return {
            retry: { status: retry.status, answer: JSON.parse(retry.stdout) },
            lookalike: {
              status: lookalike.status,
              answer: JSON.parse(lookalike.stdout),
            },
            lookalikeTree: {
              status: lookalikeTree.status,
              stderr: lookalikeTree.stderr,
            },
          };
        },
      );

      then('the retry is granted and reheld, with exit 0', () => {
        expect(asks.retry.status).toEqual(0);
        expect(asks.retry.answer.granted).toEqual(true);
        expect(asks.retry.answer.reheld).toEqual(true);
        expect(asks.retry.answer.hold).toEqual(
          'local.behavior.beav+feat-coachbook',
        );
      });

      then(
        'a key that differs only by / and . is its own hold, refused',
        () => {
          expect(asks.lookalike.status).toEqual(2);
          expect(asks.lookalike.answer.granted).toEqual(false);
          expect(asks.lookalike.answer.reheld).toEqual(false);
        },
      );

      then(
        'the look-alike refusal tree names no slot, and matches its snapshot',
        () => {
          expect(asks.lookalikeTree.status).toEqual(2);
          expect(asks.lookalikeTree.stderr).toContain(
            'no behavior slot on local',
          );
          expect(
            asMaskedHolds({ text: asks.lookalikeTree.stderr }),
          ).toMatchSnapshot();
        },
      );
    });

    // a box stalled past the 🔴 line takes no sprout: refused before any token scan
    when(
      '[t7] a slot is asked of a box stalled past the 🔴 line, as a tree',
      () => {
        const result = useThen('it answers', async () => {
          const record = join(scene.home, 'capacity.record.stalled.json');
          writeFileSync(
            record,
            JSON.stringify({
              ...JSON.parse(
                readFileSync(
                  scene.env.GIT_GROVE_CAPACITY_FIXTURE_RECORD,
                  'utf8',
                ),
              ),
              psi_cpu_some_avg60: '12.50',
            }),
          );
          return runVerb({
            path: PATH_CAPACITY,
            args: ['--grove', 'local', '--for', 'behavior', '--sample', '2'],
            home: scene.home,
            forest: scene.forest,
            env: { GIT_GROVE_CAPACITY_FIXTURE_RECORD: record },
          });
        });

        then(
          'it is refused with exit 2, the stall and the seed move named',
          () => {
            expect(result.status).toEqual(2);
            expect(result.stderr).toContain('cpu stall 🔴 12.50%');
            expect(result.stderr).toContain('rhx radio.task.push');
          },
        );

        then('the refusal tree matches its snapshot', () => {
          expect(result.stderr).toMatchSnapshot();
        });
      },
    );

    // a memory full stall above 0 means the box stopped outright, though mem_avail may read
    // healthy under reclaim: the gate refuses, and the model frees no ram slot
    when(
      '[t8] a slot is asked of a box with a memory full stall above 0',
      () => {
        const record = useThen('the stalled record is written', async () => {
          const path = join(scene.home, 'capacity.record.memfull.json');
          writeFileSync(
            path,
            JSON.stringify({
              ...JSON.parse(
                readFileSync(
                  scene.env.GIT_GROVE_CAPACITY_FIXTURE_RECORD,
                  'utf8',
                ),
              ),
              psi_mem_full_avg60: '1.50',
            }),
          );
          return { path };
        });
        const gate = useThen('the gate answers', async () =>
          runVerb({
            path: PATH_CAPACITY,
            args: ['--grove', 'local', '--for', 'behavior', '--sample', '2'],
            home: scene.home,
            forest: scene.forest,
            env: { GIT_GROVE_CAPACITY_FIXTURE_RECORD: record.path },
          }),
        );

        then('it is refused with exit 2, the ram full stall named', () => {
          expect(gate.status).toEqual(2);
          expect(gate.stderr).toContain('ram full stall 🔴 1.50%');
          expect(gate.stderr).toContain('rhx radio.task.push');
        });

        then('the refusal tree matches its snapshot', () => {
          expect(gate.stderr).toMatchSnapshot();
        });
      },
    );

    // the headline grant: a behavior slot, no key, on a box with its one slot free
    // (5.3 i005 r10.blocker.3)
    when('[t9] a behavior slot is asked of the freed box, as a tree', () => {
      const result = useThen(
        'it answers, once every hold is dropped',
        async () => {
          readdirSync(holdDir(scene.home))
            .filter((name) => name.endsWith('.hold'))
            .forEach((name) => {
              const release = runVerb({
                path: PATH_CAPACITY,
                args: ['--release', name.replace(/\.hold$/, '')],
                home: scene.home,
                forest: scene.forest,
              });
              expect(release.status).toEqual(0);
            });
          return runVerb({
            path: PATH_CAPACITY,
            args: ['--grove', 'local', '--for', 'behavior', '--sample', '2'],
            home: scene.home,
            forest: scene.forest,
            env: scene.env,
          });
        },
      );

      then('it is granted with exit 0, the slot and its bind named', () => {
        expect(result.status).toEqual(0);
        expect(result.stdout).toMatch(
          /✅ a behavior slot on local — 0 left after this one \(binds: \S+\)/,
        );
        expect(result.stdout).not.toContain('an estimate');
      });

      then('the grant tree matches its snapshot, the hold id masked', () => {
        expect(
          result.stdout.replace(
            /local\.behavior\.[0-9]+\.[0-9]+/g,
            'local.behavior.<pid>.<rand>',
          ),
        ).toMatchSnapshot();
      });
    });
  });

  given('[case3] a registered grove that cannot be reached', () => {
    const scene = useBeforeAll(async () => {
      const fixture = genFixtureHome({ slug: 'capacity-unread', crews: [] });
      spawnSync('bash', [
        '-c',
        `printf '%s' '{"name":"grove-sandpine-v20260901","host":"grove.invalid","port":22,"sshAlias":"grove.invalid"}' > "${join(fixture.forest, 'groves', 'grove-sandpine-v20260901.json')}"`,
      ]);
      return fixture;
    });

    when('[t0] the gate asks it for a slot', () => {
      const result = useThen('it runs', async () =>
        runVerb({
          path: PATH_CAPACITY,
          args: [
            '--grove',
            'grove-sandpine-v20260901',
            '--for',
            'behavior',
            '--sample',
            '1',
            '--timeout',
            '20',
          ],
          home: scene.home,
          forest: scene.forest,
        }),
      );

      then('it gives no slot and no verdict on an unread grove', () => {
        expect(result.status).toEqual(2);
        expect(result.stderr).toContain('is unread');
      });

      // the resolver text varies by host, so that one clause is masked
      then('the refusal matches its snapshot', () => {
        expect(
          result.stderr.replace(/ssh: .*$/m, 'ssh: <the resolver says why>'),
        ).toMatchSnapshot();
      });
    });

    // the token read spans the whole fleet, so an unreached grove makes the burn a
    // lower bound. found on 0901: a token read that timed out rendered `0K/h now
    // (a lower bound)` — an idle fleet, in the voice of a measure (term=false-report)
    when(
      '[t1] the read runs, and the token half cannot reach that grove',
      () => {
        const json = useThen('it reads as json', async () =>
          runVerb({
            path: PATH_CAPACITY,
            args: [
              '--grove',
              'grove-sandpine-v20260901',
              '--sample',
              '1',
              '--timeout',
              '20',
              '--json',
            ],
            home: scene.home,
            forest: scene.forest,
          }),
        );
        const tree = useThen('it renders', async () =>
          runVerb({
            path: PATH_CAPACITY,
            args: [
              '--grove',
              'grove-sandpine-v20260901',
              '--sample',
              '1',
              '--timeout',
              '20',
            ],
            home: scene.home,
            forest: scene.forest,
          }),
        );

        then('the model names the unreached grove beside the burn', () => {
          const model = JSON.parse(json.stdout);
          expect(model.tokens.partial).toEqual(true);
          expect(
            model.tokens.unreached.map((u: { grove: string }) => u.grove),
          ).toContain('grove-sandpine-v20260901');
        });

        then('the render says which grove the fleet sum left out', () => {
          // the fleet sum is unread, never a 0 rate beside a "lower bound" note
          expect(tree.stdout).not.toMatch(/fleet-wide: [0-9.]+[KMG]?\/h now/);
          expect(tree.stdout).toContain(
            '⚪ unread as a fleet sum — unreached: grove-sandpine-v20260901',
          );
        });

        // the resolver text varies by host, so that one clause is masked
        then('the partial fleet render, masked, matches its snapshot', () => {
          expect(
            asMaskedRender({
              stdout: tree.stdout.replace(
                /exit \d+: ssh: .*$/m,
                'exit <rc>: ssh: <the resolver says why>',
              ),
            }),
          ).toMatchSnapshot();
        });
      },
    );

    // the sprout verbs take `cloud://<grove>`; a gate that read only the bare name would answer
    // "unknown grove" to the very name the brief tells a supervisor to sprout with
    when(
      '[t2] the gate is asked by the cloud:// name the sprout verbs take',
      () => {
        const result = useThen('it runs', async () =>
          runVerb({
            path: PATH_CAPACITY,
            args: [
              '--grove',
              'cloud://grove-sandpine-v20260901',
              '--for',
              'behavior',
              '--sample',
              '1',
              '--timeout',
              '20',
            ],
            home: scene.home,
            forest: scene.forest,
          }),
        );

        then('it reads the registered grove, as the bare name does', () => {
          expect(result.status).toEqual(2);
          expect(result.stderr).toContain('grove-sandpine-v20260901');
          expect(result.stderr).toContain('is unread');
          expect(result.stderr).not.toContain('cloud://');
        });
      },
    );
  });

  given('[case4] the contract surfaces that read no box', () => {
    const scene = useBeforeAll(async () =>
      genFixtureHome({ slug: 'capacity-contract', crews: [] }),
    );

    when('[t0] help is asked for', () => {
      const result = useThen('it runs', async () =>
        runVerb({
          path: PATH_CAPACITY,
          args: ['--help'],
          home: scene.home,
          forest: scene.forest,
        }),
      );

      then('it exits 0 with usage, inputs, and the gate', () => {
        expect(result.status).toEqual(0);
        expect(result.stdout).toContain('--for');
        expect(result.stdout).toContain('--release');
        expect(result.stdout).toContain('--levers');
      });

      then('the help matches its snapshot', () => {
        expect(result.stdout).toMatchSnapshot();
      });
    });

    when('[t1] a hold that does not exist is released', () => {
      const result = useThen('it runs', async () =>
        runVerb({
          path: PATH_CAPACITY,
          args: ['--release', 'local.behavior.1.1'],
          home: scene.home,
          forest: scene.forest,
        }),
      );

      then(
        'it exits 0 and says no hold was there: a release is idempotent',
        () => {
          expect(result.status).toEqual(0);
          expect(result.stdout).toContain(
            'no hold local.behavior.1.1 (lapsed, or already dropped)',
          );
        },
      );

      then('the release matches its snapshot', () => {
        expect(result.stdout).toMatchSnapshot();
      });
    });

    // each refusal lands before the box is read, so each is exact
    const REFUSALS = [
      {
        slug: 'a second grove positional',
        args: ['local', 'grove-sandpine-v20260901'],
        says: 'one grove per read',
      },
      {
        slug: 'a flag with no value',
        args: ['--grove'],
        says: '--grove needs a value',
      },
      {
        slug: 'a flag whose value is a flag',
        args: ['--window', '--json'],
        says: '--window needs a value',
      },
      {
        slug: 'a key with no gate',
        args: ['local', '--key', 'beav/feat-surf-forecast'],
        says: '--key names a gate hold, so it needs --for',
      },
      {
        slug: 'an unknown kind',
        args: ['local', '--for', 'surfer'],
        says: '--for takes behavior or directive',
      },
      {
        slug: 'a non-numeric sample',
        args: ['local', '--sample', 'soon'],
        says: '--sample must be a whole number',
      },
      {
        slug: 'an unregistered grove',
        args: ['grove-absent'],
        says: 'grove-absent',
      },
      {
        slug: 'an unknown flag',
        args: ['--levrs'],
        says: "unknown flag '--levrs'",
      },
      {
        slug: 'a malformed hold id',
        args: ['--release', '../etc'],
        says: '--release takes a hold id',
      },
      // `timeout 0` disables the bound: one hung grove would freeze the whole read
      {
        slug: 'a zero timeout',
        args: ['local', '--timeout', '0'],
        says: '--timeout must be at least 1',
      },
      {
        slug: 'a sample no shorter than the timeout',
        args: ['local', '--sample', '30', '--timeout', '30'],
        says: '--sample (30 s) must be shorter than --timeout (30 s)',
      },
    ];
    REFUSALS.forEach((refusal, index) =>
      when(`[t${index + 2}] the verb is given ${refusal.slug}`, () => {
        const result = useThen('it runs', async () =>
          runVerb({
            path: PATH_CAPACITY,
            args: refusal.args,
            home: scene.home,
            forest: scene.forest,
          }),
        );

        then('it refuses with exit 2 and names why', () => {
          expect(result.status).toEqual(2);
          expect(result.stderr).toContain(refusal.says);
        });

        then('the refusal matches its snapshot', () => {
          expect(result.stderr).toMatchSnapshot();
        });
      }),
    );
  });

  given('[case5] the levers, on a pool whose 5h window is calibrated', () => {
    const scene = useBeforeAll(async () => {
      const fixture = genCalibratedHome({ slug: 'capacity-levers' });
      genLiveCrew({ home: fixture.home });
      return fixture;
    });

    when('[t0] the levers are read as json', () => {
      const model = useThen('it reads', async () =>
        JSON.parse(
          runVerb({
            path: PATH_CAPACITY,
            args: ['local', '--sample', '3', '--levers', '--json'],
            home: scene.home,
            forest: scene.forest,
          }).stdout,
        ),
      );

      then('the 5h token limit is a number, and it does not bind', () => {
        const behavior = model.groves[0].kinds.behavior;
        expect(typeof behavior.limits.tokens_5h).toEqual('number');
        expect(behavior.binds).not.toEqual('tokens_5h');
      });

      then(
        'a token lever on a grove the tokens do not bind shows +0 crews',
        () => {
          const lever = model.groves[0].levers.find(
            (l: { slug: string }) => l.slug === 'slimmer-boot-briefs',
          );
          expect(lever.rank).toEqual('ranked');
          expect(lever.gain).toEqual(0);
        },
      );

      then(
        'a lever with one read is listed with its gain, never ranked',
        () => {
          const lever = model.groves[0].levers.find(
            (l: { slug: string }) => l.slug === 'smoke-test-empty-config-dir',
          );
          expect(lever.rank).toEqual('unranked');
        },
      );

      then('an unmeasured lever has no gain and sits last', () => {
        const levers = model.groves[0].levers;
        expect(levers[levers.length - 1].rank).toEqual('unmeasured');
        expect(levers[levers.length - 1].gain).toBeNull();
      });

      then('ranked rows lead, unranked follow, unmeasured close', () => {
        const order = model.groves[0].levers.map(
          (l: { rank: string }) => l.rank,
        );
        const weight = { ranked: 0, unranked: 1, unmeasured: 2 } as Record<
          string,
          number
        >;
        const weights = order.map((rank: string) => weight[rank]!);
        expect(weights).toEqual([...weights].sort());
      });

      then('the levers record shape matches its snapshot', () => {
        expect(asKeyShape(model)).toMatchSnapshot();
      });
    });

    when('[t1] the levers render', () => {
      const result = useThen('it reads', async () =>
        runVerb({
          path: PATH_CAPACITY,
          args: ['local', '--sample', '3', '--levers'],
          home: scene.home,
          forest: scene.forest,
        }),
      );

      then(
        'the table shows +0 beside a token cut, and the unranked and unmeasured marks',
        () => {
          expect(result.stdout).toContain(
            'slimmer-boot-briefs: +0 crews · cuts tokens 1%',
          );
          expect(result.stdout).toContain('· unranked');
          expect(result.stdout).toContain('unmeasured — listed, never ranked');
        },
      );

      // the ranked order turns on which axis binds, which the live box decides, so the
      // masked lever rows are sorted before the compare: the snapshot holds each row's shape
      then('the lever rows, masked and sorted, match their snapshot', () => {
        const rows = getLeverRows({
          stdout: asMaskedRender({ stdout: result.stdout }),
        })
          .map((line) => line.replace(/^.*?(├─|└─) (#N )?/, ''))
          .sort();
        expect(rows.length).toBeGreaterThan(0);
        // only lever rows: no kind row and no exchange row rides along
        expect(
          rows.filter((row) => /^(behavior|directive|exchange):/.test(row)),
        ).toEqual([]);
        expect(rows.join('\n')).toMatchSnapshot();
      });
    });
  });

  // a partial token read (an unreadable transcript) must reach the capacity render by name,
  // so the reader of "how many crews" learns which file the lower bound left out
  given(
    '[case6] a fleet with one transcript the token read cannot open',
    () => {
      // the grove half reads a fixture record, so the render holds still between this grove and ci
      const scene = useBeforeAll(async () => {
        const fixture = genFixtureHome({
          slug: 'capacity-partial',
          crews: [
            {
              tree: TREE,
              branch: 'beav/feat-book-a-lesson',
              bound: true,
              account: 'bert@example.com',
              calls: [genCall({ id: 'msg-a', minsAgo: 30 })],
              unreadable: true,
            },
          ],
        });
        const record = join(fixture.home, 'capacity.record.partial.json');
        writeFileSync(
          record,
          JSON.stringify({
            host: 'sandpine-box',
            cpus: 4,
            mem_total_kb: 16_777_216,
            mem_avail_kb: 12_582_912,
            psi_cpu_some_avg60: '0.00',
            psi_mem_full_avg60: '0.00',
            sample_sec: 2,
            busy_cores: 1,
            forks_per_sec: 40,
            crews: [
              {
                crew: join(fixture.home, 'git', 'sandpine', '_worktrees', TREE),
                kind: 'behavior',
                seats: 1,
                procs: 3,
                rss_kb: 1_048_576,
                cores: 1,
              },
            ],
          }),
        );
        return { ...fixture, record };
      });

      when('[t0] the read renders the tree', () => {
        const result = useThen('it reads', async () =>
          runVerb({
            path: PATH_CAPACITY,
            args: ['local', '--sample', '1'],
            home: scene.home,
            forest: scene.forest,
            env: { GIT_GROVE_CAPACITY_FIXTURE_RECORD: scene.record },
          }),
        );

        then(
          'the token line names the unread transcript beside the lower bound',
          () => {
            expect(result.status).toEqual(0);
            expect(result.stdout).toContain('1 transcript unread, e.g. local:');
            expect(result.stdout).toContain(TREE);
          },
        );

        // found live on the 5.3 walk: a partial read left the fleet sum null, and the render
        // printed it through mtok as `0/h now`, an idle fleet in the voice of a measure
        then('the fleet sum reads unread, never a 0 rate', () => {
          expect(result.stdout).toContain(
            'tokens, fleet-wide: ⚪ unread as a fleet sum — 1 transcript unread',
          );
          expect(result.stdout).not.toMatch(/fleet-wide: [0-9.]+[KMG]?\/h now/);
        });

        // a transcript left unread is no timeout, so a longer one would cure naught
        then('it offers no re-read, since no grove timed out', () => {
          expect(result.stdout).not.toContain('re-read once');
        });

        then('the partial render, masked, matches its snapshot', () => {
          expect(
            asMaskedRender({
              stdout: result.stdout.split(scene.home).join('<home>'),
            }),
          ).toMatchSnapshot();
        });
      });
    },
  );

  // a woken grove holds no crew, so it has no unit cost to read: it gives exactly one
  // first-crew slot, never a refusal that turns away the box with the most room, and never
  // a grant past the box once the token pool calibrates
  given('[case7] the sprout gate, on a woken grove with no crew', () => {
    const scene = useBeforeAll(async () => {
      const fixture = genFixtureHome({ slug: 'capacity-empty', crews: [] });
      const record = join(fixture.home, 'capacity.record.empty.json');
      writeFileSync(
        record,
        JSON.stringify({
          host: 'sandpine-box',
          cpus: 4,
          mem_total_kb: 16_777_216,
          mem_avail_kb: 15_728_640,
          psi_cpu_some_avg60: '0.00',
          psi_mem_full_avg60: '0.00',
          sample_sec: 2,
          busy_cores: 0.2,
          forks_per_sec: 5,
          crews: [],
        }),
      );
      return { ...fixture, env: { GIT_GROVE_CAPACITY_FIXTURE_RECORD: record } };
    });

    when('[t0] two sprouts ask, under two keys', () => {
      const asks = useThen('each asks once', async () => {
        const ask = (key: string) =>
          runVerb({
            path: PATH_CAPACITY,
            args: [
              '--grove',
              'local',
              '--for',
              'behavior',
              '--key',
              key,
              '--sample',
              '2',
              '--json',
            ],
            home: scene.home,
            forest: scene.forest,
            env: scene.env,
          });
        const first = ask('beav/feat-coachbook');
        const second = ask('beav/feat-cert-ingest');
        // the same two asks as trees, the renders a human reads (5.3 i005 r10.blocker.4):
        // the first hold is dropped, so the first tree meets the box the json ask met
        const release = runVerb({
          path: PATH_CAPACITY,
          args: ['--release', 'local.behavior.beav+feat-coachbook'],
          home: scene.home,
          forest: scene.forest,
        });
        const askTree = (key: string) =>
          runVerb({
            path: PATH_CAPACITY,
            args: [
              '--grove',
              'local',
              '--for',
              'behavior',
              '--key',
              key,
              '--sample',
              '2',
            ],
            home: scene.home,
            forest: scene.forest,
            env: scene.env,
          });
        const firstTree = askTree('beav/feat-coachbook');
        const secondTree = askTree('beav/feat-cert-ingest');
        return {
          first: { status: first.status, answer: JSON.parse(first.stdout) },
          second: { status: second.status, answer: JSON.parse(second.stdout) },
          release: { status: release.status },
          firstTree: { status: firstTree.status, stdout: firstTree.stdout },
          secondTree: { status: secondTree.status, stderr: secondTree.stderr },
        };
      });

      then(
        'the first-crew grant tree names its one slot, and matches its snapshot',
        () => {
          expect(asks.release.status).toEqual(0);
          expect(asks.firstTree.status).toEqual(0);
          expect(asks.firstTree.stdout).toContain(
            '✅ a behavior slot on local',
          );
          expect(asks.firstTree.stdout).toMatchSnapshot();
        },
      );

      then(
        'the tree refused while that hold stands matches its snapshot',
        () => {
          expect(asks.secondTree.status).toEqual(2);
          expect(asks.secondTree.stderr).toContain('no behavior slot on local');
          expect(
            asMaskedHolds({ text: asks.secondTree.stderr }),
          ).toMatchSnapshot();
        },
      );

      then('the first is granted the one first-crew slot', () => {
        expect(asks.first.status).toEqual(0);
        expect(asks.first.answer.granted).toEqual(true);
        expect(asks.first.answer.free).toEqual(1);
      });

      then('the second is refused while that hold stands', () => {
        expect(asks.second.status).toEqual(2);
        expect(asks.second.answer.granted).toEqual(false);
        expect(asks.second.answer.held_before).toEqual(1);
      });
    });

    when('[t1] the read renders the tree', () => {
      const result = useThen('it reads', async () =>
        runVerb({
          path: PATH_CAPACITY,
          args: ['local', '--sample', '1'],
          home: scene.home,
          forest: scene.forest,
          env: scene.env,
        }),
      );

      then('each kind names the first-crew slot, never a bare refusal', () => {
        expect(result.status).toEqual(0);
        expect(result.stdout).toContain(
          'behavior: ⚪ no crew here to read its cost from · first-crew slots free 1',
        );
      });

      then('the first-crew render, masked, matches its snapshot', () => {
        expect(asMaskedRender({ stdout: result.stdout })).toMatchSnapshot();
      });
    });
  });

  // the wish asks for the lower of the token limit and the grove limit: here the 5h pool
  // sits near its cap, so tokens bind below ram and cpu, on the read and at the gate (G3)
  given(
    '[case18] a box with room whose 5h token pool sits near its cap',
    () => {
      const scene = useBeforeAll(async () => {
        const resets5h = getEpochAhead({ mins: 200 });
        const fixture = genFixtureHome({
          slug: 'capacity-tokens-bind',
          crews: [
            {
              tree: TREE,
              branch: 'beav/feat-book-a-lesson',
              bound: true,
              account: 'bert@example.com',
              calls: [genCall({ id: 'msg-a', minsAgo: 30 })],
            },
          ],
          caps: [
            {
              tree: TREE,
              account: 'bert@example.com',
              minsAgo: 121,
              fiveHour: { used: 75, resetsAt: resets5h },
              sevenDay: null,
            },
            {
              tree: TREE,
              account: 'bert@example.com',
              minsAgo: 1,
              fiveHour: { used: 85, resetsAt: resets5h },
              sevenDay: null,
            },
          ],
        });
        const record = join(fixture.home, 'capacity.record.tokens.json');
        writeFileSync(
          record,
          JSON.stringify({
            host: 'sandpine-box',
            cpus: 4,
            mem_total_kb: 16_777_216,
            mem_avail_kb: 12_582_912,
            psi_cpu_some_avg60: '0.00',
            psi_mem_full_avg60: '0.00',
            sample_sec: 2,
            busy_cores: 2,
            forks_per_sec: 40,
            crews: [
              {
                crew: join(fixture.home, 'git', 'sandpine', '_worktrees', TREE),
                kind: 'behavior',
                seats: 1,
                procs: 3,
                rss_kb: 1_048_576,
                cores: 1,
              },
            ],
          }),
        );
        return {
          ...fixture,
          env: { GIT_GROVE_CAPACITY_FIXTURE_RECORD: record },
        };
      });

      // the figures are the fixture's own, so only the numbers are masked: the marks and the
      // axis that binds are the claim under test, and stay in the snap
      const asMaskedFigures = (input: { stdout: string }): string =>
        input.stdout
          .split(scene.home)
          .join('<home>')
          // a window label stands alone or after `tokens_` / `tokens.`; a figure never does
          .replace(/(?<!\d|\d\.)(5h|7d)\b/g, '⟨$1⟩')
          .replace(/\d+(\.\d+)?/g, 'N')
          .replace(/⟨N([hd])⟩/g, (_, unit: string) =>
            unit === 'h' ? '5h' : '7d',
          );

      when('[t0] the read runs as json', () => {
        const model = useThen('it reads', async () =>
          JSON.parse(
            runVerb({
              path: PATH_CAPACITY,
              args: ['local', '--sample', '2', '--json'],
              home: scene.home,
              forest: scene.forest,
              env: scene.env,
            }).stdout,
          ),
        );

        then('the 5h token limit binds, below ram and cpu', () => {
          const behavior = model.groves[0].kinds.behavior;
          expect(behavior.binds).toEqual('tokens_5h');
          expect(behavior.limits.tokens_5h).toBeLessThan(behavior.limits.cpu);
          expect(behavior.limits.tokens_5h).toBeLessThan(behavior.limits.ram);
          expect(behavior.affordable).toEqual(behavior.limits.tokens_5h);
        });

        then('the token axis frees no slot now', () => {
          const behavior = model.groves[0].kinds.behavior;
          expect(behavior.free.tokens_5h).toEqual(0);
          expect(behavior.free_slots).toEqual(0);
        });
      });

      when('[t1] the read renders the tree', () => {
        const result = useThen('it reads', async () =>
          runVerb({
            path: PATH_CAPACITY,
            args: ['local', '--sample', '2'],
            home: scene.home,
            forest: scene.forest,
            env: scene.env,
          }),
        );

        then('the behavior row names tokens_5h as the limit that binds', () => {
          expect(result.status).toEqual(0);
          expect(result.stdout).toMatch(
            /behavior: affordable \d+ (\(upper bound\) )?· binds tokens_5h · free slots 0 · ram \d+ · cpu [^·]+ · tokens_5h \d+ · tokens_7d ⚪/,
          );
        });

        then(
          'the tokens-bind render, its figures masked, matches its snapshot',
          () => {
            expect(
              asMaskedFigures({ stdout: result.stdout }),
            ).toMatchSnapshot();
          },
        );
      });

      when('[t2] a behavior slot is asked, as a tree', () => {
        const result = useThen('it answers', async () =>
          runVerb({
            path: PATH_CAPACITY,
            args: ['--grove', 'local', '--for', 'behavior', '--sample', '2'],
            home: scene.home,
            forest: scene.forest,
            env: scene.env,
          }),
        );

        then(
          'it is refused with exit 2, the token axis named as the bind',
          () => {
            expect(result.status).toEqual(2);
            expect(result.stderr).toContain('no behavior slot on local');
            expect(result.stderr).toContain(
              'free: 0 · held by sprouts in flight: 0 · binds: tokens_5h',
            );
          },
        );

        // a fell frees no token slot, so the refusal names the pool, never the idle crews (G3)
        then('it names the token pool as what frees a slot, not a fell', () => {
          expect(result.stderr).toContain(
            'the token pool caps the free slots (tokens_5h): a fell frees no token slot',
          );
          expect(result.stderr).toContain(
            'read the pool: rhx git.crew.tokens calibrate',
          );
          expect(result.stderr).not.toContain('idle crews');
        });

        then(
          'the token refusal tree, its figures masked, matches its snapshot',
          () => {
            expect(
              asMaskedFigures({ stdout: result.stderr }),
            ).toMatchSnapshot();
          },
        );
      });
    },
  );

  // found in review: one span ran from the first counter read to after the last /proc walk,
  // so a walk that took seconds on a loaded box sat in the rate's denominator — busy cores
  // read low and the gate over-granted exactly when the box was full
  given('[case8] a box whose /proc walk is slow, as on a loaded grove', () => {
    const scene = useBeforeAll(async () => {
      const fixture = genFixtureHome({ slug: 'capacity-slow-walk', crews: [] });
      const bin = tempDirs.genOne({ slug: 'capacity-slow-grep' });
      const grepReal = spawnSync('which', ['grep']).stdout.toString().trim();
      const shim = join(bin, 'grep');
      writeFileSync(
        shim,
        [
          '#!/usr/bin/env bash',
          '# a /proc/<pid>/stat walk takes 2s, as it does at load 30+ with 400+ processes',
          'case "$*" in */proc/[0-9]*/stat*) sleep 2 ;; esac',
          `exec "${grepReal}" "$@"`,
          '',
        ].join('\n'),
        { mode: 0o755 },
      );
      return { ...fixture, env: { PATH: `${bin}:${process.env.PATH}` } };
    });

    when('[t0] a 1s sample is read as json', () => {
      const result = useThen('it reads', async () =>
        runVerb({
          path: PATH_CAPACITY,
          args: ['local', '--sample', '1', '--json'],
          home: scene.home,
          forest: scene.forest,
          env: scene.env,
        }),
      );
      const record = useThen(
        'it parses',
        async () => JSON.parse(result.stdout).groves[0].record,
      );

      // each span = one 2s walk + the 1s sleep, ~3s. a span that also held the second walk reads ~5s
      then('the box rate divides by its counter interval alone', () => {
        expect(result.status).toEqual(0);
        expect(typeof record.box_sample_sec).toEqual('number');
        expect(record.box_sample_sec).toBeGreaterThanOrEqual(1);
        expect(record.box_sample_sec).toBeLessThan(4.5);
      });

      then('the per-crew rate divides by walk start to walk start', () => {
        expect(record.sample_sec).toBeGreaterThanOrEqual(1);
        expect(record.sample_sec).toBeLessThan(4.5);
      });
    });
  });

  // the gate's exit IS its verdict, so neither fault below may reach it:
  // - a closed stdout: the refusal text goes to stderr and the json line comes from a jq child,
  //   so the pipe trap never fires on a refusal. this proves the refusal still exits 2
  // - a slip in the levers table, which the gate never reads, once made every ask a malfunction
  given(
    '[case9] the sprout gate, on a full box, beside a corrupt levers table',
    () => {
      const scene = useBeforeAll(async () => {
        const fixture = genFixtureHome({
          slug: 'capacity-gate-faults',
          crews: [],
        });
        const record = join(fixture.home, 'capacity.record.json');
        const recordOf = (input: { busy: number }): string =>
          JSON.stringify({
            host: 'sandpine-box',
            cpus: 4,
            mem_total_kb: 16_777_216,
            mem_avail_kb: 12_582_912,
            psi_cpu_some_avg60: '0.00',
            psi_mem_full_avg60: '0.00',
            sample_sec: 2,
            busy_cores: input.busy,
            forks_per_sec: 40,
            crews: [
              {
                crew: join(fixture.home, 'git', 'sandpine', '_worktrees', TREE),
                kind: 'behavior',
                seats: 1,
                procs: 3,
                rss_kb: 1_048_576,
                cores: 1,
              },
            ],
          });
        writeFileSync(record, recordOf({ busy: 4 }));
        const recordFree = join(fixture.home, 'capacity.record.free.json');
        writeFileSync(recordFree, recordOf({ busy: 3 }));
        // a copy of the skills tree whose levers table carries the `//` slip a jsonc invites
        const skills = tempDirs.genOne({ slug: 'capacity-skills-copy' });
        cpSync(dirname(PATH_CAPACITY), skills, { recursive: true });
        writeFileSync(
          join(skills, 'git.grove.capacity.levers.jsonc'),
          '{ // a comment jq cannot read\n  "levers": [] }\n',
        );
        return {
          ...fixture,
          record,
          recordFree,
          capacityCopy: join(skills, basename(PATH_CAPACITY)),
        };
      });

      when('[t0] the refusal is asked as json, its stdout closed', () => {
        const result = useThen('it answers', async () => {
          const out = spawnSync(
            'bash',
            [
              '-c',
              'set -o pipefail; bash "$0" "$@" | true; echo "rc=${PIPESTATUS[0]}"',
              PATH_CAPACITY,
              '--grove',
              'local',
              '--for',
              'behavior',
              '--sample',
              '1',
              '--json',
            ],
            {
              encoding: 'utf8',
              env: {
                ...process.env,
                HOME: scene.home,
                GIT_FOREST_DIR: scene.forest,
                GIT_GROVE_CAPACITY_FIXTURE_RECORD: scene.record,
              },
              timeout: 240_000,
            },
          );
          return { stdout: out.stdout };
        });

        then('it still exits 2: a closed pipe never reads as a grant', () => {
          expect(result.stdout).toContain('rc=2');
        });
      });

      when('[t1] a slot is asked, beside the corrupt levers table', () => {
        const gate = useThen('the gate answers', async () =>
          runVerb({
            path: scene.capacityCopy,
            args: [
              '--grove',
              'local',
              '--for',
              'behavior',
              '--sample',
              '1',
              '--json',
            ],
            home: scene.home,
            forest: scene.forest,
            env: { GIT_GROVE_CAPACITY_FIXTURE_RECORD: scene.recordFree },
          }),
        );
        const levers = useThen('the levers read answers', async () =>
          runVerb({
            path: scene.capacityCopy,
            args: ['local', '--sample', '1', '--levers'],
            home: scene.home,
            forest: scene.forest,
            env: { GIT_GROVE_CAPACITY_FIXTURE_RECORD: scene.recordFree },
          }),
        );

        then('the gate grants: it never reads the levers table', () => {
          expect(gate.status).toEqual(0);
          expect(JSON.parse(gate.stdout).granted).toEqual(true);
        });

        then('the levers read fails loud on the slip', () => {
          expect(levers.status).toEqual(1);
          expect(levers.stderr).toContain('the levers table is unreadable');
        });

        // the one exit-1 render of the verb had no snap (5.3 i004 r10.blocker.3)
        then(
          'the malfunction render matches its snapshot, the fixture paths masked',
          () => {
            expect({
              status: levers.status,
              stdout: levers.stdout,
              stderr: levers.stderr
                .split(dirname(scene.capacityCopy))
                .join('<fixture-skills>')
                .split(scene.home)
                .join('<home>')
                // jq's own line differs per jq version (1.7 prefixes `jq: `), so it is masked
                .replace(/^(jq: )?parse error: .*$/m, '<jq parse error>'),
            }).toMatchSnapshot();
          },
        );
      });
    },
  );

  // found in review, raised three rounds: the token scans take minutes on a loaded box, and a
  // crew can boot inside them. a grant made on the sample taken before them sees a box emptier
  // than it is. the stub token verb below fills the box while it "scans"
  given(
    '[case10] the sprout gate, on a box that fills while the token half scans',
    () => {
      const scene = useBeforeAll(async () => {
        const fixture = genFixtureHome({
          slug: 'capacity-gate-fills',
          crews: [],
        });
        const recordOf = (input: { busy: number }): string =>
          JSON.stringify({
            host: 'sandpine-box',
            cpus: 4,
            mem_total_kb: 16_777_216,
            mem_avail_kb: 12_582_912,
            psi_cpu_some_avg60: '0.00',
            psi_mem_full_avg60: '0.00',
            sample_sec: 2,
            busy_cores: input.busy,
            forks_per_sec: 40,
            crews: [
              {
                crew: join(fixture.home, 'git', 'sandpine', '_worktrees', TREE),
                kind: 'behavior',
                seats: 1,
                procs: 3,
                rss_kb: 1_048_576,
                cores: 1,
              },
            ],
          });
        const record = join(fixture.home, 'capacity.record.json');
        writeFileSync(record, recordOf({ busy: 3 }));
        const recordFull = join(fixture.home, 'capacity.record.full.json');
        writeFileSync(recordFull, recordOf({ busy: 4 }));
        // a copy of the skills tree whose token verb fills the box, then reads an empty fleet
        const skills = tempDirs.genOne({ slug: 'capacity-skills-fills' });
        cpSync(dirname(PATH_CAPACITY), skills, { recursive: true });
        writeFileSync(
          join(skills, 'git.crew.tokens.sh'),
          [
            '#!/usr/bin/env bash',
            '# a crew boots while the scan runs: the box is full by the time the scan ends',
            `cp "${recordFull}" "${record}"`,
            "echo '{}'",
            '',
          ].join('\n'),
          { mode: 0o755 },
        );
        return {
          ...fixture,
          record,
          capacityCopy: join(skills, basename(PATH_CAPACITY)),
        };
      });

      when('[t0] a behavior slot is asked as json', () => {
        const result = useThen('it answers', async () =>
          runVerb({
            path: scene.capacityCopy,
            args: [
              '--grove',
              'local',
              '--for',
              'behavior',
              '--sample',
              '1',
              '--json',
            ],
            home: scene.home,
            forest: scene.forest,
            env: { GIT_GROVE_CAPACITY_FIXTURE_RECORD: scene.record },
          }),
        );

        then(
          'it refuses on the box as it reads after the scans, not before',
          () => {
            expect(result.status).toEqual(2);
            const answer = JSON.parse(result.stdout);
            expect(answer.granted).toEqual(false);
            expect(answer.free).toEqual(0);
          },
        );
      });
    },
  );

  // critipath G2: the ram is full, so the refusal must name the idle crews a fell would free,
  // and point to the one read that says which may go
  given(
    '[case11] the sprout gate, on a box whose ram binds, one crew idle',
    () => {
      const scene = useBeforeAll(async () => {
        const fixture = genFixtureHome({
          slug: 'capacity-gate-ram',
          crews: [],
        });
        const record = join(fixture.home, 'capacity.record.json');
        const treeOf = (slug: string): string =>
          join(fixture.home, 'git', 'sandpine', '_worktrees', slug);
        writeFileSync(
          record,
          JSON.stringify({
            host: 'sandpine-box',
            cpus: 4,
            mem_total_kb: 16_777_216,
            mem_avail_kb: 1_572_864,
            psi_cpu_some_avg60: '0.00',
            psi_mem_full_avg60: '0.00',
            sample_sec: 2,
            busy_cores: 1,
            forks_per_sec: 40,
            crews: [
              {
                crew: treeOf(TREE),
                kind: 'behavior',
                seats: 1,
                procs: 3,
                rss_kb: 1_048_576,
                cores: 1,
              },
              {
                crew: treeOf('svc-lessons.beav.feat-coachbook'),
                kind: 'behavior',
                seats: 1,
                procs: 3,
                rss_kb: 2_097_152,
                cores: 0,
              },
            ],
          }),
        );
        return {
          ...fixture,
          env: { GIT_GROVE_CAPACITY_FIXTURE_RECORD: record },
        };
      });

      when('[t0] a behavior slot is asked, as a tree', () => {
        const result = useThen('it answers', async () =>
          runVerb({
            path: PATH_CAPACITY,
            args: ['--grove', 'local', '--for', 'behavior', '--sample', '1'],
            home: scene.home,
            forest: scene.forest,
            env: scene.env,
          }),
        );

        then(
          'it refuses with exit 2, the ram named as the axis that binds',
          () => {
            expect(result.status).toEqual(2);
            expect(result.stderr).toContain('no behavior slot on local');
            expect(result.stderr).toContain('binds: ram');
          },
        );

        then(
          'it names the idle crew and the read that says which may be felled',
          () => {
            expect(result.stderr).toContain(
              'svc-lessons.beav.feat-coachbook · 2G',
            );
            expect(result.stderr).toContain(
              'to see which crews may be felled: rhx git.crew.poll --fellable',
            );
          },
        );

        then('the refusal tree matches its snapshot', () => {
          expect(result.stderr).toMatchSnapshot();
        });
      });
    },
  );

  // critipath R2, its fail-safe half: the default sweep reads every grove at once, so one dark
  // grove never hides the rest. a single --grove read cannot prove that (5.3 i001 r5.blocker.4)
  given(
    '[case12] the default sweep, over local and one grove that cannot be reached',
    () => {
      const scene = useBeforeAll(async () => {
        const fixture = genFixtureHome({
          slug: 'capacity-sweep-mixed',
          crews: [
            {
              tree: TREE,
              branch: 'beav/feat-book-a-lesson',
              bound: true,
              account: 'bert@example.com',
              calls: [genCall({ id: 'msg-a', minsAgo: 30 })],
            },
          ],
        });
        writeFileSync(
          join(fixture.forest, 'groves', 'grove-sandpine-v20260901.json'),
          JSON.stringify({
            name: 'grove-sandpine-v20260901',
            host: 'grove.invalid',
            port: 22,
            sshAlias: 'grove.invalid',
          }),
        );
        return fixture;
      });

      when('[t0] the read runs with no grove named', () => {
        const result = useThen('it reads', async () => {
          const startedMs = Date.now();
          const out = runVerb({
            path: PATH_CAPACITY,
            args: ['--sample', '1', '--timeout', '20'],
            home: scene.home,
            forest: scene.forest,
          });
          return { ...out, elapsedMs: Date.now() - startedMs };
        });

        then('it exits 0: a dark grove is a row, never a halt', () => {
          expect(result.status).toEqual(0);
        });

        then('the readable grove still prints in full', () => {
          expect(result.stdout).toContain('└─ grove local: ');
          expect(result.stdout).toContain('├─ behavior: ');
          expect(result.stdout).toContain('├─ directive: ');
        });

        then('the dark grove reads under its own row, with no stutter', () => {
          expect(result.stdout).toContain(
            '├─ grove-sandpine-v20260901: 💥 unreadable — no slot',
          );
          expect(result.stdout).not.toContain('grove grove-');
        });

        then(
          'the fleet sum names the grove it left out, never a 0 rate',
          () => {
            expect(result.stdout).toContain(
              '⚪ unread as a fleet sum — unreached: grove-sandpine-v20260901',
            );
            expect(result.stdout).not.toMatch(
              /fleet-wide: [0-9.]+[KMG]?\/h now/,
            );
          },
        );

        // the groves read at once: the dark one cannot add its clock to the readable one's
        then('the sweep ends inside one grove clock, not their sum', () => {
          expect(result.elapsedMs).toBeLessThan(3 * 20 * 1000);
        });

        // the local block reads the real box, whose seats differ between this grove and ci, so
        // it is cut to one marker line; the resolver text varies by host, so it is masked too
        then('the mixed sweep render, masked, matches its snapshot', () => {
          const lines = result.stdout
            .replace(
              /exit \d+: ssh: .*$/m,
              'exit <rc>: ssh: <the resolver says why>',
            )
            .split('\n');
          const localAt = lines.findIndex((line) =>
            line.startsWith('   └─ grove local: '),
          );
          const nextAt = lines.findIndex((line) => line.startsWith('🥥 next'));
          expect(localAt).toBeGreaterThan(0);
          expect(nextAt).toBeGreaterThan(localAt);
          const shape = [
            ...lines.slice(0, localAt),
            '   └─ grove local: <the live box, masked out>',
            '',
            ...lines.slice(nextAt),
          ].join('\n');
          expect(asMaskedRender({ stdout: shape })).toMatchSnapshot();
        });
      });
    },
  );

  // found live on the 5.3 walk: a grove with no jq read `jq is absent on this grove`, a cause
  // with no fix. a fake `ssh` runs the payload on a PATH that holds bash and naught else
  given('[case13] a registered grove that answers, but holds no jq', () => {
    const scene = useBeforeAll(async () => {
      const fixture = genFixtureHome({ slug: 'capacity-no-jq', crews: [] });
      writeFileSync(
        join(fixture.forest, 'groves', 'grove-sandpine-v20260901.json'),
        JSON.stringify({
          name: 'grove-sandpine-v20260901',
          host: 'grove.invalid',
          port: 22,
          sshAlias: 'grove-sandpine',
        }),
      );
      const bin = tempDirs.genOne({ slug: 'capacity-ssh-no-jq' });
      const bare = tempDirs.genOne({ slug: 'capacity-path-bare' });
      const bash = spawnSync('which', ['bash']).stdout.toString().trim();
      symlinkSync(bash, join(bare, 'bash'));
      writeFileSync(
        join(bin, 'ssh'),
        `#!/usr/bin/env bash\nPATH='${bare}' exec '${bash}' -c "\${@: -1}"\n`,
        { mode: 0o755 },
      );
      return { ...fixture, bin };
    });

    when('[t0] the read renders the tree', () => {
      const result = useThen('it reads', async () =>
        runVerb({
          path: PATH_CAPACITY,
          args: ['--grove', 'grove-sandpine-v20260901', '--sample', '1'],
          home: scene.home,
          forest: scene.forest,
          env: { PATH: `${scene.bin}:${process.env.PATH}` },
        }),
      );

      then('the grove row names the cause and the install', () => {
        expect(result.stdout).toContain('jq is absent on this grove');
        expect(result.stdout).toContain(
          "rhx git.grove.send <grove> --what 'sudo apt-get install -y jq'",
        );
      });

      then('the no-jq render, masked, matches its snapshot', () => {
        expect(asMaskedRender({ stdout: result.stdout })).toMatchSnapshot();
      });
    });
  });

  // ssh itself refuses the connect: the box is down, so the row is asleep, with the wake
  given('[case14] a registered grove whose ssh connect is refused', () => {
    const scene = useBeforeAll(async () => {
      const fixture = genFixtureHome({ slug: 'capacity-asleep', crews: [] });
      writeFileSync(
        join(fixture.forest, 'groves', 'grove-sandpine-v20260901.json'),
        JSON.stringify({
          name: 'grove-sandpine-v20260901',
          host: 'grove.invalid',
          port: 22,
          sshAlias: 'grove-sandpine',
        }),
      );
      const bin = tempDirs.genOne({ slug: 'capacity-ssh-refused' });
      writeFileSync(
        join(bin, 'ssh'),
        '#!/usr/bin/env bash\necho "ssh: connect to host grove-sandpine port 22: Connection refused" >&2\nexit 255\n',
        { mode: 0o755 },
      );
      return { ...fixture, bin };
    });

    when('[t0] the read renders the tree', () => {
      const result = useThen('it reads', async () =>
        runVerb({
          path: PATH_CAPACITY,
          args: [
            '--grove',
            'grove-sandpine-v20260901',
            '--sample',
            '1',
            '--timeout',
            '2',
          ],
          home: scene.home,
          forest: scene.forest,
          env: { PATH: `${scene.bin}:${process.env.PATH}` },
        }),
      );

      then('the grove row reads asleep, no slot, with the wake', () => {
        expect(result.stdout).toContain(
          '└─ grove-sandpine-v20260901: 💤 asleep — no slot — wake it: rhx git.grove.wake grove-sandpine-v20260901',
        );
      });

      then('the asleep render, masked, matches its snapshot', () => {
        expect(asMaskedRender({ stdout: result.stdout })).toMatchSnapshot();
      });
    });
  });

  // the box takes the connect and never answers: the bound fires, the row reads timeout
  given('[case15] a registered grove whose ssh hangs past the timeout', () => {
    const scene = useBeforeAll(async () => {
      const fixture = genFixtureHome({ slug: 'capacity-hang', crews: [] });
      writeFileSync(
        join(fixture.forest, 'groves', 'grove-sandpine-v20260901.json'),
        JSON.stringify({
          name: 'grove-sandpine-v20260901',
          host: 'grove.invalid',
          port: 22,
          sshAlias: 'grove-sandpine',
        }),
      );
      const bin = tempDirs.genOne({ slug: 'capacity-ssh-hang' });
      writeFileSync(join(bin, 'ssh'), '#!/usr/bin/env bash\nexec sleep 30\n', {
        mode: 0o755,
      });
      return { ...fixture, bin };
    });

    when('[t0] the read renders the tree', () => {
      const result = useThen('it reads', async () =>
        runVerb({
          path: PATH_CAPACITY,
          args: [
            '--grove',
            'grove-sandpine-v20260901',
            '--sample',
            '1',
            '--timeout',
            '2',
          ],
          home: scene.home,
          forest: scene.forest,
          env: { PATH: `${scene.bin}:${process.env.PATH}` },
        }),
      );

      then('the grove row reads timeout, no slot, with the re-read', () => {
        expect(result.stdout).toContain(
          '└─ grove-sandpine-v20260901: ⏳ timeout — no slot — a slow read is a load signal; re-read once: rhx git.grove.capacity grove-sandpine-v20260901 --timeout 4',
        );
      });

      then('the timeout render, masked, matches its snapshot', () => {
        expect(asMaskedRender({ stdout: result.stdout })).toMatchSnapshot();
      });
    });
  });

  // the levers rank a measured row above an estimated one, whatever their gains: a measure
  // outranks a guess (rule.always.re-measure-a-lever-before-you-rank-it) (5.3 i002 r5.nitpick.2)
  given(
    '[case16] the levers, a measured row beside a larger estimated one on the axis that binds',
    () => {
      const scene = useBeforeAll(async () => {
        const fixture = genFixtureHome({
          slug: 'capacity-levers-tiers',
          crews: [],
        });
        // ram binds: 6 slots free on ram, 62 on cpu, the tokens unread
        const record = join(fixture.home, 'capacity.record.ram-binds.json');
        writeFileSync(
          record,
          JSON.stringify({
            host: 'sandpine-box',
            cpus: 32,
            mem_total_kb: 16_777_216,
            mem_avail_kb: 8_388_608,
            psi_cpu_some_avg60: '0.00',
            psi_mem_full_avg60: '0.00',
            sample_sec: 2,
            busy_cores: 1,
            forks_per_sec: 5,
            crews: [
              {
                crew: join(fixture.home, 'git', 'sandpine', '_worktrees', TREE),
                kind: 'behavior',
                seats: 1,
                procs: 3,
                rss_kb: 1_048_576,
                cores: 0.5,
              },
            ],
          }),
        );
        const skills = tempDirs.genOne({ slug: 'capacity-skills-tiers' });
        cpSync(dirname(PATH_CAPACITY), skills, { recursive: true });
        const lever = (input: { slug: string; cut: number; tier: string }) => ({
          slug: input.slug,
          what: `a ${input.tier} cut of the wetsuit-locker ram per crew`,
          shape: 'cost-cut',
          axis: 'ram',
          cut: input.cut,
          tier: input.tier,
          reads: 2,
          basis: 'a fixture row',
        });
        writeFileSync(
          join(skills, 'git.grove.capacity.levers.jsonc'),
          JSON.stringify({
            levers: [
              lever({ slug: 'locker-estimated', cut: 0.5, tier: 'estimated' }),
              lever({ slug: 'locker-measured', cut: 0.1, tier: 'measured' }),
            ],
          }),
        );
        return {
          ...fixture,
          record,
          capacityCopy: join(skills, basename(PATH_CAPACITY)),
        };
      });

      when('[t0] the levers are read as json', () => {
        const levers = useThen('it reads', async () => {
          const out = runVerb({
            path: scene.capacityCopy,
            args: ['local', '--sample', '1', '--levers', '--json'],
            home: scene.home,
            forest: scene.forest,
            env: { GIT_GROVE_CAPACITY_FIXTURE_RECORD: scene.record },
          });
          // useThen hands back a proxy over an object, so the rows ride inside one
          return {
            rows: JSON.parse(out.stdout).groves[0].levers as {
              slug: string;
              tier: string;
              rank: string;
              gain: number;
            }[],
          };
        });

        then('both rows are ranked, on 2 reads each', () => {
          expect(levers.rows.map((l) => l.rank)).toEqual(['ranked', 'ranked']);
        });

        then(
          'the estimated row would buy more crews than the measured one',
          () => {
            const byTier = Object.fromEntries(
              levers.rows.map((l) => [l.tier, l.gain]),
            );
            expect(byTier.measured).toEqual(1);
            expect(byTier.estimated).toEqual(6);
          },
        );

        then('the measured row still ranks first', () => {
          expect(levers.rows.map((l) => l.slug)).toEqual([
            'locker-measured',
            'locker-estimated',
          ]);
        });
      });

      // the order was held in json alone; the tree a human reads could re-sort unseen
      // (5.3 i003 r4.nitpick.2). the rows are snapped in render order, never sorted
      when('[t1] the levers render as a tree', () => {
        const result = useThen('it reads', async () =>
          runVerb({
            path: scene.capacityCopy,
            args: ['local', '--sample', '1', '--levers'],
            home: scene.home,
            forest: scene.forest,
            env: { GIT_GROVE_CAPACITY_FIXTURE_RECORD: scene.record },
          }),
        );
        const rows = useThen('its lever rows are cut out', async () => ({
          list: getLeverRows({ stdout: result.stdout }),
        }));

        then('the measured row renders above the estimated one', () => {
          expect(result.status).toEqual(0);
          const measured = rows.list.findIndex((row) =>
            row.includes('locker-measured:'),
          );
          const estimated = rows.list.findIndex((row) =>
            row.includes('locker-estimated:'),
          );
          expect(measured).toBeGreaterThanOrEqual(0);
          expect(estimated).toBeGreaterThan(measured);
          expect(rows.list[measured]).toContain('#1 locker-measured:');
        });

        then('the lever rows, in render order, match their snapshot', () => {
          expect(rows.list.join('\n')).toMatchSnapshot();
        });
      });
    },
  );

  // the gate graded only the minute (psi avg60), so a box abused for hours and calm this minute
  // was granted a slot. the life row (since boot) is graded as git.grove.saturation grades it,
  // and either row at 🔴 refuses (5.3 i002 r1.blocker.2)
  given(
    '[case17] the sprout gate, on a box whose life stall differs from its minute',
    () => {
      const scene = useBeforeAll(async () => {
        const fixture = genFixtureHome({
          slug: 'capacity-gate-life',
          crews: [],
        });
        const recordOf = (input: {
          cpuLife: string;
          memLife: string;
        }): string => {
          const path = join(
            fixture.home,
            `capacity.record.life.${input.cpuLife}.${input.memLife}.json`,
          );
          writeFileSync(
            path,
            JSON.stringify({
              host: 'sandpine-box',
              cpus: 4,
              mem_total_kb: 16_777_216,
              mem_avail_kb: 12_582_912,
              psi_cpu_some_avg60: '0.00',
              psi_mem_full_avg60: '0.00',
              psi_cpu_some_life: input.cpuLife,
              psi_mem_some_life: input.memLife,
              sample_sec: 2,
              busy_cores: 1,
              forks_per_sec: 40,
              crews: [
                {
                  crew: join(
                    fixture.home,
                    'git',
                    'sandpine',
                    '_worktrees',
                    TREE,
                  ),
                  kind: 'behavior',
                  seats: 1,
                  procs: 3,
                  rss_kb: 1_048_576,
                  cores: 1,
                },
              ],
            }),
          );
          return path;
        };
        return {
          ...fixture,
          cpuLifeRed: recordOf({ cpuLife: '12.300', memLife: '0.200' }),
          memLifeRed: recordOf({ cpuLife: '0.500', memLife: '6.000' }),
          calm: recordOf({ cpuLife: '0.500', memLife: '0.200' }),
        };
      });
      const ask = (input: { record: string; json: boolean }) =>
        runVerb({
          path: PATH_CAPACITY,
          args: [
            '--grove',
            'local',
            '--for',
            'behavior',
            '--sample',
            '1',
            ...(input.json ? ['--json'] : []),
          ],
          home: scene.home,
          forest: scene.forest,
          env: { GIT_GROVE_CAPACITY_FIXTURE_RECORD: input.record },
        });

      when('[t0] the cpu life row reads 🔴, its minute calm', () => {
        const tree = useThen('the gate answers', async () =>
          ask({ record: scene.cpuLifeRed, json: false }),
        );
        const json = useThen('the gate answers as json', async () =>
          ask({ record: scene.cpuLifeRed, json: true }),
        );

        then('it refuses with exit 2, and names the life row', () => {
          expect(tree.status).toEqual(2);
          expect(tree.stderr).toContain(
            '├─ cpu stall 🔴 12.300% since boot: at or past the 10% line on average since the box booted, a stalled box takes no sprout',
          );
          expect(tree.stderr).toContain('rhx radio.task.push');
          expect(json.status).toEqual(2);
          expect(JSON.parse(json.stdout).granted).toEqual(false);
        });

        then('the refusal matches its snapshot', () => {
          expect(tree.stderr).toMatchSnapshot();
        });

        then('the life-stall decision shape matches its snapshot', () => {
          expect(asKeyShape(JSON.parse(json.stdout))).toMatchSnapshot();
        });
      });

      when('[t1] the ram life row reads 🔴, its minute calm', () => {
        const tree = useThen('the gate answers', async () =>
          ask({ record: scene.memLifeRed, json: false }),
        );

        then('it refuses with exit 2, and names the life row', () => {
          expect(tree.status).toEqual(2);
          expect(tree.stderr).toContain(
            '├─ ram stall 🔴 6.000% since boot: at or past the 5% line on average since the box booted, the box takes no sprout',
          );
        });

        then('the refusal matches its snapshot', () => {
          expect(tree.stderr).toMatchSnapshot();
        });
      });

      when('[t2] both life rows and the minute read calm', () => {
        const json = useThen('the gate answers as json', async () =>
          ask({ record: scene.calm, json: true }),
        );

        then('it grants the slot', () => {
          expect(json.status).toEqual(0);
          expect(JSON.parse(json.stdout).granted).toEqual(true);
        });
      });
    },
  );

  // the wish asks for the directive count and the exchange rate between the kinds (R1): here
  // the box holds one crew of each kind, both pools calibrated wide, so the cpu binds, each
  // kind reads its own cost, and the exchange row is a measure, never a borrowed estimate
  given(
    '[case19] a box with one behavior crew and one directive crew, both pools calibrated',
    () => {
      const DIRECTIVE_ROOT = 'svc-lessons';
      const scene = useBeforeAll(async () => {
        const resets5h = getEpochAhead({ mins: 200 });
        const resets7d = getEpochAhead({ mins: 4000 });
        const fixture = genFixtureHome({
          slug: 'capacity-two-kinds',
          crews: [
            {
              tree: TREE,
              branch: 'beav/feat-book-a-lesson',
              bound: true,
              account: 'bert@example.com',
              calls: [genCall({ id: 'msg-a', minsAgo: 30 })],
            },
            {
              tree: DIRECTIVE_ROOT,
              root: true,
              branch: 'main',
              bound: false,
              account: 'bert@example.com',
              calls: [genCall({ id: 'msg-b', minsAgo: 20 })],
            },
          ],
          caps: [
            {
              tree: TREE,
              account: 'bert@example.com',
              minsAgo: 1460,
              fiveHour: null,
              sevenDay: { used: 30, resetsAt: resets7d },
            },
            {
              tree: TREE,
              account: 'bert@example.com',
              minsAgo: 121,
              fiveHour: { used: 10, resetsAt: resets5h },
              sevenDay: { used: 30.05, resetsAt: resets7d },
            },
            {
              tree: TREE,
              account: 'bert@example.com',
              minsAgo: 1,
              fiveHour: { used: 10.1, resetsAt: resets5h },
              sevenDay: { used: 30.1, resetsAt: resets7d },
            },
          ],
        });
        // a directive crew spends twice the cores and twice the ram of a behavior crew
        const record = join(fixture.home, 'capacity.record.two-kinds.json');
        writeFileSync(
          record,
          JSON.stringify({
            host: 'sandpine-box',
            cpus: 8,
            mem_total_kb: 16_777_216,
            mem_avail_kb: 12_582_912,
            psi_cpu_some_avg60: '0.00',
            psi_mem_full_avg60: '0.00',
            sample_sec: 2,
            busy_cores: 3,
            forks_per_sec: 40,
            crews: [
              {
                crew: join(fixture.home, 'git', 'sandpine', '_worktrees', TREE),
                kind: 'behavior',
                seats: 1,
                procs: 3,
                rss_kb: 1_048_576,
                cores: 1,
              },
              {
                crew: join(fixture.home, 'git', 'sandpine', DIRECTIVE_ROOT),
                kind: 'directive',
                seats: 2,
                procs: 6,
                rss_kb: 2_097_152,
                cores: 2,
              },
            ],
          }),
        );
        const holdDir = join(
          fixture.home,
          '.rhachet',
          'storage',
          'repo=bhuild',
          'role=supervisor',
          'git.grove.capacity',
          'holds',
        );
        return {
          ...fixture,
          holdDir,
          env: { GIT_GROVE_CAPACITY_FIXTURE_RECORD: record },
        };
      });
      // .what = a directive hold as a grant writes it: a sprout not yet booted
      const genDirectiveHold = (input: { key: string }): void => {
        mkdirSync(scene.holdDir, { recursive: true });
        writeFileSync(
          join(scene.holdDir, `local.directive.${input.key}.hold`),
          'box=local\ngrove=local\nkind=directive\n',
        );
      };
      const askBehavior = (input: { json: boolean; key: string | null }) =>
        runVerb({
          path: PATH_CAPACITY,
          args: [
            '--grove',
            'local',
            '--for',
            'behavior',
            '--sample',
            '2',
            ...(input.key ? ['--key', input.key] : []),
            ...(input.json ? ['--json'] : []),
          ],
          home: scene.home,
          forest: scene.forest,
          env: scene.env,
        });

      when('[t0] the read runs as json', () => {
        const model = useThen('it reads', async () =>
          JSON.parse(
            runVerb({
              path: PATH_CAPACITY,
              args: ['local', '--sample', '2', '--json'],
              home: scene.home,
              forest: scene.forest,
              env: scene.env,
            }).stdout,
          ),
        );

        then('each kind reads its own cost, none borrowed', () => {
          const kinds = model.groves[0].kinds;
          expect(kinds.behavior.borrowed).toEqual(false);
          expect(kinds.directive.borrowed).toEqual(false);
          expect(kinds.directive.cores).toEqual(2);
          expect(kinds.directive.ram_kb).toEqual(2_097_152);
        });

        then('both pools are calibrated, so no axis is unread', () => {
          const kinds = model.groves[0].kinds;
          expect(model.tokens.five_hour.verdict.state).toEqual('calibrated');
          expect(model.tokens.seven_day.verdict.state).toEqual('calibrated');
          expect(kinds.behavior.unread_axes).toEqual([]);
          expect(kinds.directive.unread_axes).toEqual([]);
          expect(typeof kinds.directive.limits.tokens_7d).toEqual('number');
        });

        then('the cpu binds both kinds: a directive affords half', () => {
          const kinds = model.groves[0].kinds;
          expect(kinds.behavior.binds).toEqual('cpu');
          expect(kinds.directive.binds).toEqual('cpu');
          expect(kinds.behavior.affordable).toEqual(8);
          expect(kinds.directive.affordable).toEqual(4);
          expect(kinds.behavior.free_slots).toEqual(5);
          expect(kinds.directive.free_slots).toEqual(2);
        });

        then(
          'the exchange is a measure: 1 directive ≈ 2 behavior on cpu',
          () => {
            expect(model.groves[0].exchange).toEqual({
              axis: 'cpu',
              behavior_per_directive: 2,
              borrowed: false,
            });
          },
        );
      });

      when('[t1] the read renders the tree', () => {
        const result = useThen('it reads', async () =>
          runVerb({
            path: PATH_CAPACITY,
            args: ['local', '--sample', '2'],
            home: scene.home,
            forest: scene.forest,
            env: scene.env,
          }),
        );

        then('the plain exchange row renders, with no estimate mark', () => {
          expect(result.status).toEqual(0);
          expect(result.stdout).toContain(
            '└─ exchange: 1 directive ≈ 2 behavior (on cpu)\n',
          );
        });

        then('the plain directive row renders, its own costs read', () => {
          expect(result.stdout).toMatch(
            /├─ directive: affordable ~4 \(est\.\) · binds cpu · free slots 2 · ram 6 · cpu ~4 \(est\.\) · tokens_5h \d+ · tokens_7d \d+\n/,
          );
          expect(result.stdout).not.toContain('borrowed');
          expect(result.stdout).not.toContain('upper bound');
        });

        then(
          'the two-kind render, its figures masked, matches its snapshot',
          () => {
            expect(
              asMaskedFixtureFigures({ text: result.stdout, home: scene.home }),
            ).toMatchSnapshot();
          },
        );
      });

      // one directive hold weighs 2 behavior slots on cpu, the axis that caps the free slots
      when('[t2] a behavior slot is asked beside one directive hold', () => {
        const answer = useThen('it answers', async () => {
          genDirectiveHold({ key: 'beav+feat-coachbook' });
          const out = askBehavior({
            json: true,
            key: 'beav/feat-surf-forecast',
          });
          return { status: out.status, answer: JSON.parse(out.stdout) };
        });

        then('the hold counts at the measured rate, never at 1', () => {
          expect(answer.status).toEqual(0);
          expect(answer.answer.granted).toEqual(true);
          expect(answer.answer.free).toEqual(5);
          expect(answer.answer.held_before).toEqual(2);
        });
      });

      // three directive holds weigh 6 behavior slots, past the 5 free: at a weight of 1 they
      // would weigh 3, and the box would grant a slot it does not have
      when('[t3] a behavior slot is asked beside three directive holds', () => {
        const result = useThen('it answers', async () => {
          const release = runVerb({
            path: PATH_CAPACITY,
            args: ['--release', 'local.behavior.beav+feat-surf-forecast'],
            home: scene.home,
            forest: scene.forest,
          });
          expect(release.status).toEqual(0);
          genDirectiveHold({ key: 'beav+feat-cert-ingest' });
          genDirectiveHold({ key: 'beav+feat-spot-forecast-widget' });
          return askBehavior({ json: false, key: null });
        });

        then(
          'it is refused with exit 2: the holds weigh 6 of the 5 free',
          () => {
            expect(result.status).toEqual(2);
            expect(result.stderr).toContain(
              'free: 5 · held by sprouts in flight: 6 · binds: cpu',
            );
          },
        );

        then('it names each hold, its kind, and its lapse', () => {
          expect(result.stderr).toMatch(
            /local\.directive\.beav\+feat-cert-ingest · directive · lapses in \d+ min/,
          );
          expect(result.stderr).toContain(
            'rhx git.grove.capacity --release <hold>',
          );
        });

        then(
          'the refusal tree, its hold lapses masked, matches its snapshot',
          () => {
            expect(asMaskedHolds({ text: result.stderr })).toMatchSnapshot();
          },
        );
      });
    },
  );

  // the weekly cap is half of the token limit (wish item 1): here the 5h pool is wide and the
  // 7d pool sits near its cap, so the 7d axis binds below ram and cpu, on the read and the gate
  given(
    '[case20] a box with room whose 7d token pool sits near its cap',
    () => {
      const scene = useBeforeAll(async () => {
        const resets5h = getEpochAhead({ mins: 200 });
        const resets7d = getEpochAhead({ mins: 4000 });
        const fixture = genFixtureHome({
          slug: 'capacity-tokens-7d-bind',
          crews: [
            {
              tree: TREE,
              branch: 'beav/feat-book-a-lesson',
              bound: true,
              account: 'bert@example.com',
              calls: [genCall({ id: 'msg-a', minsAgo: 30 })],
            },
          ],
          caps: [
            {
              tree: TREE,
              account: 'bert@example.com',
              minsAgo: 1460,
              fiveHour: null,
              sevenDay: { used: 93, resetsAt: resets7d },
            },
            {
              tree: TREE,
              account: 'bert@example.com',
              minsAgo: 121,
              fiveHour: { used: 10, resetsAt: resets5h },
              sevenDay: { used: 94, resetsAt: resets7d },
            },
            {
              tree: TREE,
              account: 'bert@example.com',
              minsAgo: 1,
              fiveHour: { used: 10.1, resetsAt: resets5h },
              sevenDay: { used: 95, resetsAt: resets7d },
            },
          ],
        });
        const record = join(fixture.home, 'capacity.record.tokens-7d.json');
        writeFileSync(
          record,
          JSON.stringify({
            host: 'sandpine-box',
            cpus: 4,
            mem_total_kb: 16_777_216,
            mem_avail_kb: 12_582_912,
            psi_cpu_some_avg60: '0.00',
            psi_mem_full_avg60: '0.00',
            sample_sec: 2,
            busy_cores: 2,
            forks_per_sec: 40,
            crews: [
              {
                crew: join(fixture.home, 'git', 'sandpine', '_worktrees', TREE),
                kind: 'behavior',
                seats: 1,
                procs: 3,
                rss_kb: 1_048_576,
                cores: 1,
              },
            ],
          }),
        );
        return {
          ...fixture,
          env: { GIT_GROVE_CAPACITY_FIXTURE_RECORD: record },
        };
      });

      when('[t0] the read runs as json', () => {
        const model = useThen('it reads', async () =>
          JSON.parse(
            runVerb({
              path: PATH_CAPACITY,
              args: ['local', '--sample', '2', '--json'],
              home: scene.home,
              forest: scene.forest,
              env: scene.env,
            }).stdout,
          ),
        );

        then(
          'the 7d token limit is a number, and binds below every axis',
          () => {
            const behavior = model.groves[0].kinds.behavior;
            expect(model.tokens.seven_day.verdict.state).toEqual('calibrated');
            expect(typeof behavior.limits.tokens_7d).toEqual('number');
            expect(behavior.binds).toEqual('tokens_7d');
            expect(behavior.limits.tokens_7d).toBeLessThan(behavior.limits.cpu);
            expect(behavior.limits.tokens_7d).toBeLessThan(behavior.limits.ram);
            expect(behavior.limits.tokens_7d).toBeLessThan(
              behavior.limits.tokens_5h,
            );
            expect(behavior.affordable).toEqual(behavior.limits.tokens_7d);
          },
        );

        then('the 7d axis frees no slot now', () => {
          const behavior = model.groves[0].kinds.behavior;
          expect(behavior.free.tokens_7d).toEqual(0);
          expect(behavior.free_slots).toEqual(0);
          expect(behavior.free_binds).toEqual('tokens_7d');
        });
      });

      when('[t1] the read renders the tree', () => {
        const result = useThen('it reads', async () =>
          runVerb({
            path: PATH_CAPACITY,
            args: ['local', '--sample', '2'],
            home: scene.home,
            forest: scene.forest,
            env: scene.env,
          }),
        );

        then('the behavior row names tokens_7d as the limit that binds', () => {
          expect(result.status).toEqual(0);
          expect(result.stdout).toMatch(
            /behavior: affordable \d+ · binds tokens_7d · free slots 0 · ram \d+ · cpu [^·]+ · tokens_5h \d+ · tokens_7d \d+/,
          );
          expect(result.stdout).toMatch(/└─ 7d: [^⚪\n]+\/h sustained/);
        });

        then(
          'the 7d-bind render, its figures masked, matches its snapshot',
          () => {
            expect(
              asMaskedFixtureFigures({ text: result.stdout, home: scene.home }),
            ).toMatchSnapshot();
          },
        );
      });

      when('[t2] a behavior slot is asked, as a tree', () => {
        const result = useThen('it answers', async () =>
          runVerb({
            path: PATH_CAPACITY,
            args: ['--grove', 'local', '--for', 'behavior', '--sample', '2'],
            home: scene.home,
            forest: scene.forest,
            env: scene.env,
          }),
        );

        then('it is refused with exit 2, the 7d axis named as the bind', () => {
          expect(result.status).toEqual(2);
          expect(result.stderr).toContain(
            'free: 0 · held by sprouts in flight: 0 · binds: tokens_7d',
          );
          expect(result.stderr).toContain(
            'the token pool caps the free slots (tokens_7d): a fell frees no token slot',
          );
        });

        then(
          'the 7d refusal tree, its figures masked, matches its snapshot',
          () => {
            expect(
              asMaskedFixtureFigures({ text: result.stderr, home: scene.home }),
            ).toMatchSnapshot();
          },
        );
      });
    },
  );

  // the header guarantees "a token read that fails is a malfunction, never a quiet ⚪": a gate
  // that read a failed scan as ⚪ would grant on an upper bound. each stub below fails one read
  given('[case21] a box whose token read fails', () => {
    const scene = useBeforeAll(async () => {
      const fixture = genFixtureHome({
        slug: 'capacity-token-read-fails',
        crews: [],
      });
      const record = join(fixture.home, 'capacity.record.json');
      writeFileSync(
        record,
        JSON.stringify({
          host: 'sandpine-box',
          cpus: 4,
          mem_total_kb: 16_777_216,
          mem_avail_kb: 12_582_912,
          psi_cpu_some_avg60: '0.00',
          psi_mem_full_avg60: '0.00',
          sample_sec: 2,
          busy_cores: 2,
          forks_per_sec: 40,
          crews: [
            {
              crew: join(fixture.home, 'git', 'sandpine', '_worktrees', TREE),
              kind: 'behavior',
              seats: 1,
              procs: 3,
              rss_kb: 1_048_576,
              cores: 1,
            },
          ],
        }),
      );
      // .what = a copy of the skills tree whose token verb is the stub given
      const genSkillsCopy = (input: { slug: string; stub: string[] }) => {
        const skills = tempDirs.genOne({ slug: input.slug });
        cpSync(dirname(PATH_CAPACITY), skills, { recursive: true });
        writeFileSync(
          join(skills, 'git.crew.tokens.sh'),
          ['#!/usr/bin/env bash', ...input.stub, ''].join('\n'),
          { mode: 0o755 },
        );
        return join(skills, basename(PATH_CAPACITY));
      };
      return {
        ...fixture,
        record,
        // the plain read fails, so the burn per crew-hour is unknown
        capacityTokensFail: genSkillsCopy({
          slug: 'capacity-skills-tokens-fail',
          stub: [
            'echo "💥 MalfunctionError: the transcript scan broke" >&2',
            'exit 1',
          ],
        }),
        // the plain read answers; calibrate fails, so the cap pool is unknown
        capacityCalFail: genSkillsCopy({
          slug: 'capacity-skills-cal-fail',
          stub: [
            'if [[ "${1:-}" == "calibrate" ]]; then',
            '  echo "💥 MalfunctionError: the cap ledger could not be read" >&2',
            '  exit 1',
            'fi',
            "echo '{}'",
          ],
        }),
      };
    });
    const read = (input: { path: string }) =>
      runVerb({
        path: input.path,
        args: ['local', '--sample', '1'],
        home: scene.home,
        forest: scene.forest,
        env: { GIT_GROVE_CAPACITY_FIXTURE_RECORD: scene.record },
      });

    when('[t0] the plain token read exits 1', () => {
      const result = useThen('the read answers', async () =>
        read({ path: scene.capacityTokensFail }),
      );

      then('it exits 1 and names the failed read, never a quiet ⚪', () => {
        expect(result.status).toEqual(1);
        expect(result.stdout).toEqual('');
        expect(result.stderr).toContain(
          '💥 MalfunctionError: the token read failed (tokens, exit 1)',
        );
        expect(result.stderr).toContain('the transcript scan broke');
      });

      then('the malfunction render matches its snapshot', () => {
        expect({
          status: result.status,
          stdout: result.stdout,
          stderr: result.stderr,
        }).toMatchSnapshot();
      });
    });

    when('[t1] the calibrate read exits 1', () => {
      const result = useThen('the read answers', async () =>
        read({ path: scene.capacityCalFail }),
      );

      then('it exits 1 and names the failed read, never a quiet ⚪', () => {
        expect(result.status).toEqual(1);
        expect(result.stdout).toEqual('');
        expect(result.stderr).toContain(
          '💥 MalfunctionError: the token read failed (cal, exit 1)',
        );
        expect(result.stderr).toContain('the cap ledger could not be read');
      });

      then('the malfunction render matches its snapshot', () => {
        expect({
          status: result.status,
          stdout: result.stdout,
          stderr: result.stderr,
        }).toMatchSnapshot();
      });
    });

    // the gate reads the same two scans, so a failed scan must stop it too, never grant
    when(
      '[t2] a behavior slot is asked while the calibrate read exits 1',
      () => {
        const result = useThen('the gate answers', async () =>
          runVerb({
            path: scene.capacityCalFail,
            args: ['--grove', 'local', '--for', 'behavior', '--sample', '1'],
            home: scene.home,
            forest: scene.forest,
            env: { GIT_GROVE_CAPACITY_FIXTURE_RECORD: scene.record },
          }),
        );

        then('it exits 1, with no grant and no hold', () => {
          expect(result.status).toEqual(1);
          expect(result.stdout).not.toContain('✅');
          expect(result.stderr).toContain(
            'the token read failed (cal, exit 1)',
          );
        });
      },
    );
  });
});
