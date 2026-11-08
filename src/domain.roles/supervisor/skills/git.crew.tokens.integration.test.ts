/**
 * .what = clamps on `git.crew.tokens` — the crew burn read and the pool calibration
 *
 * .why  = the token half of "how many crews can we afford" rests on two numbers
 *         this verb produces: burn per crew-hour by kind, and tokens per % of cap.
 *         a wrong weight, a double-counted call, a crew filed under the wrong
 *         kind, or a calibration taken off a partial pool each misprices every
 *         crew on the fleet, and none of them looks wrong on a render
 *
 * .note = each case runs the verb verbatim from source against a hermetic home
 *         (git.crew.tokens.harness.ts); no real fleet. one case names a grove
 *         at `grove.invalid`, so its ssh fails at the resolver, never on a host
 */
import { spawnSync } from 'child_process';
import { symlinkSync, writeFileSync } from 'fs';
import { join } from 'path';
import { given, then, useBeforeAll, useThen, when } from 'test-fns';

import { asKeyShape } from '../../.test/asKeyShape';
import { tempDirs } from '../../.test/tempDirs';
import {
  genCall,
  genFixtureHome,
  getEpochAhead,
  getWeightOfCall,
  PATH_TOKENS,
  runVerb,
} from './git.crew.tokens.harness';

afterAll(() => {
  tempDirs.delAll();
});

/**
 * .what = the calibrate tree for one scene, with its live figures masked for the snapshot
 * .why  = each calibrate edge owes its human render, beside the json its verdict is read from
 */
const runCalibrateTree = (input: {
  scene: { home: string; forest: string };
}): { status: number | null; stdout: string; masked: string } => {
  const result = runVerb({
    path: PATH_TOKENS,
    args: ['calibrate', '--grove', 'local'],
    home: input.scene.home,
    forest: input.scene.forest,
  });
  return {
    status: result.status,
    stdout: result.stdout,
    masked: result.stdout.replace(/\d+(\.\d+)?/g, 'N'),
  };
};

describe('git.crew.tokens', () => {
  given(
    '[case1] a behavior crew, a directive seat, and an unbound tree',
    () => {
      const callA = genCall({ id: 'msg-a', minsAgo: 30 });
      const callB = genCall({ id: 'msg-b', minsAgo: 20 });
      const callFork = genCall({ id: 'msg-fork', minsAgo: 15 });
      const callStale = genCall({ id: 'msg-stale', minsAgo: 300 });
      const callDirective = genCall({ id: 'msg-dir', minsAgo: 10 });
      const callOther = genCall({ id: 'msg-other', minsAgo: 10 });

      const scene = useBeforeAll(async () =>
        genFixtureHome({
          slug: 'crew-tokens-kinds',
          crews: [
            {
              tree: 'svc-lessons.beav.feat-book-a-lesson',
              branch: 'beav/feat-book-a-lesson',
              bound: true,
              account: 'bert@example.com',
              // msg-a twice: one call spans many lines, and counts once
              calls: [callA, callA, callB, callStale],
              forkCalls: [callFork],
            },
            {
              tree: 'notebook',
              root: true,
              branch: 'main',
              bound: false,
              account: 'bert@example.com',
              calls: [callDirective],
            },
            {
              tree: 'svc-lessons.beav.fix-wetsuit-sizes',
              branch: 'beav/fix-wetsuit-sizes',
              bound: false,
              account: 'bert@example.com',
              calls: [callOther],
            },
          ],
        }),
      );

      when('[t0] the read runs as json over the default 180 min window', () => {
        const result = useThen('it reads', async () =>
          runVerb({
            path: PATH_TOKENS,
            args: ['local', '--json'],
            home: scene.home,
            forest: scene.forest,
          }),
        );
        const record = useThen('it parses', async () =>
          JSON.parse(result.stdout),
        );

        then('it exits 0', () => {
          expect(result.status).toEqual(0);
        });

        then(
          'the behavior crew sums its calls once each, its fork in, the stale call out',
          () => {
            const crew = record.groves[0].record.crews.find(
              (c: { crew: string }) => c.crew.endsWith('feat-book-a-lesson'),
            );
            const expected = Math.floor(
              getWeightOfCall({ call: callA }) +
                getWeightOfCall({ call: callB }) +
                getWeightOfCall({ call: callFork }),
            );
            expect(crew.weighted).toEqual(expected);
            expect(crew.calls).toEqual(3);
            expect(crew.calls_fork).toEqual(1);
            expect(crew.weighted_fork).toEqual(
              Math.floor(getWeightOfCall({ call: callFork })),
            );
          },
        );

        then('each crew carries the kind its tree implies', () => {
          const kinds = Object.fromEntries(
            record.groves[0].record.crews.map(
              (c: { crew: string; kind: string }) => [
                c.crew.split('/').pop(),
                c.kind,
              ],
            ),
          );
          expect(kinds).toEqual({
            'svc-lessons.beav.feat-book-a-lesson': 'behavior',
            notebook: 'directive',
            'svc-lessons.beav.fix-wetsuit-sizes': 'other',
          });
        });

        then(
          'the fleet burn per crew-hour by kind divides by crews and hours',
          () => {
            const behavior = record.fleet.by_kind.behavior;
            expect(behavior.crews).toEqual(1);
            expect(behavior.weighted_per_crew_hour).toEqual(
              Math.round(behavior.weighted / 1 / 3),
            );
          },
        );

        then('the read is whole', () => {
          expect(record.partial).toEqual(false);
          expect(record.unreached).toEqual([]);
        });

        // the --json record is a caller surface (a tick parses it): its shape is held whole
        then('the record shape matches its snapshot', () => {
          expect(asKeyShape(record)).toMatchSnapshot();
        });
      });

      when('[t1] the read renders the tree', () => {
        const result = useThen('it reads', async () =>
          runVerb({
            path: PATH_TOKENS,
            args: ['local'],
            home: scene.home,
            forest: scene.forest,
          }),
        );

        then('it names each crew with its kind', () => {
          expect(result.stdout).toContain(
            'svc-lessons.beav.feat-book-a-lesson [behavior]',
          );
          expect(result.stdout).toContain('notebook [directive]');
          expect(result.stdout).toContain(
            'svc-lessons.beav.fix-wetsuit-sizes [other]',
          );
        });

        // a floor dropped a different slice from each row than from the sum: rows read
        // 8K + 2K + 2K under a fleet of 14K (5.3 i001 r6.blocker.1). rounded, they add up
        then('the crew rows add up to the fleet line', () => {
          expect(result.stdout).toContain('├─ fleet: 15K');
          expect(result.stdout).toContain('[behavior]: 9K');
          expect(result.stdout).toContain('[other]: 3K');
          expect(result.stdout).toContain('[directive]: 3K');
        });

        then('the render matches its snapshot', () => {
          expect(result.stdout).toMatchSnapshot();
        });
      });

      when('[t2] a reader closes stdout after one line', () => {
        const result = useThen('it reads', async () =>
          runVerb({
            path: PATH_TOKENS,
            args: ['local'],
            home: scene.home,
            forest: scene.forest,
            pipeHead: true,
          }),
        );

        then('the pipe exits 0 with no broken-pipe trace', () => {
          expect(result.status).toEqual(0);
          expect(result.stderr).not.toContain('Broken pipe');
          expect(result.stdout.trim().split('\n')).toHaveLength(1);
        });
      });

      // the help's own example: `rhx git.crew.tokens local --window 60`
      when('[t3] the read runs over a 60 min window', () => {
        const record = useThen('it reads as json', async () =>
          JSON.parse(
            runVerb({
              path: PATH_TOKENS,
              args: ['local', '--window', '60', '--json'],
              home: scene.home,
              forest: scene.forest,
            }).stdout,
          ),
        );
        const tree = useThen('it renders the tree', async () =>
          runVerb({
            path: PATH_TOKENS,
            args: ['local', '--window', '60'],
            home: scene.home,
            forest: scene.forest,
          }),
        );

        then('the behavior crew counts the calls inside the hour alone', () => {
          const crew = record.groves[0].record.crews.find(
            (c: { crew: string }) => c.crew.endsWith('feat-book-a-lesson'),
          );
          expect(crew.calls).toEqual(3);
          expect(crew.weighted).toEqual(
            Math.floor(
              getWeightOfCall({ call: callA }) +
                getWeightOfCall({ call: callB }) +
                getWeightOfCall({ call: callFork }),
            ),
          );
        });

        then('the burn per crew-hour divides by the one hour', () => {
          const behavior = record.fleet.by_kind.behavior;
          expect(behavior.weighted_per_crew_hour).toEqual(
            Math.round(behavior.weighted / 1 / 1),
          );
        });

        then('the 60 min render matches its snapshot', () => {
          expect(tree.status).toEqual(0);
          expect(tree.stdout).toContain('svc-lessons.beav.feat-book-a-lesson');
          expect(tree.stdout).toMatchSnapshot();
        });
      });

      when('[t4] the read runs between two instants', () => {
        const record = useThen('it reads as json', async () =>
          JSON.parse(
            runVerb({
              path: PATH_TOKENS,
              args: [
                'local',
                '--since',
                new Date(Date.now() - 25 * 60_000).toJSON(),
                '--until',
                new Date(Date.now() - 12 * 60_000).toJSON(),
                '--json',
              ],
              home: scene.home,
              forest: scene.forest,
            }).stdout,
          ),
        );

        then('the span holds only the calls between the two instants', () => {
          const crews = record.groves[0].record.crews;
          const book = crews.find((c: { crew: string }) =>
            c.crew.endsWith('feat-book-a-lesson'),
          );
          expect(book.calls).toEqual(2);
          expect(book.weighted).toEqual(
            Math.floor(
              getWeightOfCall({ call: callB }) +
                getWeightOfCall({ call: callFork }),
            ),
          );
          expect(
            crews.filter((c: { calls: number }) => c.calls > 0),
          ).toHaveLength(1);
        });

        then('the read is whole', () => {
          expect(record.partial).toEqual(false);
        });
      });
    },
  );

  given('[case2] a transcript the meter cannot read', () => {
    const scene = useBeforeAll(async () =>
      genFixtureHome({
        slug: 'crew-tokens-unread',
        crews: [
          {
            tree: 'svc-lessons.beav.feat-book-a-lesson',
            branch: 'beav/feat-book-a-lesson',
            bound: true,
            account: 'bert@example.com',
            calls: [genCall({ id: 'msg-a', minsAgo: 30 })],
            unreadable: true,
          },
        ],
      }),
    );

    when('[t0] the read runs', () => {
      const json = useThen('it reads as json', async () =>
        runVerb({
          path: PATH_TOKENS,
          args: ['local', '--json'],
          home: scene.home,
          forest: scene.forest,
        }),
      );
      const tree = useThen('it reads as a tree', async () =>
        runVerb({
          path: PATH_TOKENS,
          args: ['local'],
          home: scene.home,
          forest: scene.forest,
        }),
      );

      then('the record is marked partial and names the unread file', () => {
        const record = JSON.parse(json.stdout);
        expect(record.partial).toEqual(true);
        expect(record.unread).toHaveLength(1);
        expect(record.unread[0]).toContain('session-0.jsonl');
      });

      // a partial read that saw no burn must not print `fleet: 0`, an idle fleet in the voice of
      // a measure; it reads unread, as git.grove.capacity does (5.3 i001 r6.nitpick.1)
      then('the fleet line reads unread, never a 0', () => {
        expect(tree.stdout).toContain('├─ fleet: ⚪ unread as a fleet sum');
        expect(tree.stdout).not.toContain('fleet: 0');
      });

      then(
        'the render calls its total a lower bound and names the file',
        () => {
          expect(tree.stdout).toContain('a LOWER BOUND — see unread)');
          expect(tree.stdout).toContain('⚠️ unread:');
        },
      );

      // the grove and kind rows read `0 over 0 crews` and `no crew of this kind burned` beside
      // `⚠️ 1 unread`: a crew whose burn is unknown, called absent (5.3 i002 r6.blocker.1)
      then('the grove and kind rows read unread, never 0 crews', () => {
        expect(tree.stdout).not.toContain('over 0 crews');
        expect(tree.stdout).not.toContain('no crew of this kind burned');
        expect(tree.stdout).toContain(
          '└─ grove local: ⚪ unread — 1 transcript unread · 1 config dir',
        );
        expect(tree.stdout).toContain(
          '├─ behavior: ⚪ unread — 1 transcript unread',
        );
      });

      then(
        'the partial render, its temp home masked, matches its snapshot',
        () => {
          expect(
            tree.stdout.split(scene.home).join('<home>'),
          ).toMatchSnapshot();
        },
      );
    });

    // the cure above must not reach a whole read: there, no crew truly burned
    when('[t1] beside it, a whole read that holds no crew', () => {
      const sceneEmpty = useBeforeAll(async () =>
        genFixtureHome({ slug: 'crew-tokens-whole-empty', crews: [] }),
      );
      const tree = useThen('it reads as a tree', async () =>
        runVerb({
          path: PATH_TOKENS,
          args: ['local'],
          home: sceneEmpty.home,
          forest: sceneEmpty.forest,
        }),
      );

      then('each kind still says no crew of it burned', () => {
        expect(tree.status).toEqual(0);
        expect(tree.stdout).toContain(
          '├─ behavior: ⚪ no crew of this kind burned in the span',
        );
        expect(tree.stdout).not.toContain('⚪ unread');
      });
    });
  });

  given('[case3] the pool calibration', () => {
    when('[t0] the cap ledger holds no rows', () => {
      const scene = useBeforeAll(async () =>
        genFixtureHome({
          slug: 'crew-tokens-cal-empty',
          crews: [
            {
              tree: 'svc-lessons.beav.feat-book-a-lesson',
              branch: 'beav/feat-book-a-lesson',
              bound: true,
              account: 'bert@example.com',
              calls: [genCall({ id: 'msg-a', minsAgo: 30 })],
            },
          ],
        }),
      );
      const result = useThen('it calibrates', async () =>
        runVerb({
          path: PATH_TOKENS,
          args: ['calibrate', '--grove', 'local', '--json'],
          home: scene.home,
          forest: scene.forest,
        }),
      );

      then('both windows read uncalibrated, and say to wire the ledger', () => {
        const record = JSON.parse(result.stdout);
        expect(
          record.windows.map(
            (w: { verdict: { state: string } }) => w.verdict.state,
          ),
        ).toEqual(['uncalibrated', 'uncalibrated']);
        expect(record.windows[0].verdict.why).toContain(
          'claude.statusline.caplog',
        );
      });

      then('the uncalibrated record shape matches its snapshot', () => {
        expect(asKeyShape(JSON.parse(result.stdout))).toMatchSnapshot();
      });

      const tree = useThen('it renders the calibration', async () =>
        runVerb({
          path: PATH_TOKENS,
          args: ['calibrate', '--grove', 'local'],
          home: scene.home,
          forest: scene.forest,
        }),
      );

      then('the uncalibrated render matches its snapshot', () => {
        expect(tree.status).toEqual(0);
        expect(tree.stdout).toContain('⚪ uncalibrated');
        expect(tree.stdout).toMatchSnapshot();
      });
    });

    when(
      '[t1] one account read twice inside one 5h window, with burn between',
      () => {
        const call = genCall({ id: 'msg-a', minsAgo: 30 });
        const resets5h = getEpochAhead({ mins: 200 });
        const resets7d = getEpochAhead({ mins: 3000 });
        const scene = useBeforeAll(async () =>
          genFixtureHome({
            slug: 'crew-tokens-cal-pair',
            crews: [
              {
                tree: 'svc-lessons.beav.feat-book-a-lesson',
                branch: 'beav/feat-book-a-lesson',
                bound: true,
                account: 'bert@example.com',
                calls: [call],
              },
            ],
            caps: [
              {
                tree: 'svc-lessons.beav.feat-book-a-lesson',
                account: 'bert@example.com',
                minsAgo: 130,
                fiveHour: { used: 10, resetsAt: resets5h },
                sevenDay: { used: 3, resetsAt: resets7d },
              },
              {
                tree: 'svc-lessons.beav.feat-book-a-lesson',
                account: 'bert@example.com',
                minsAgo: 1,
                fiveHour: { used: 20, resetsAt: resets5h },
                sevenDay: { used: 4, resetsAt: resets7d },
              },
            ],
          }),
        );
        const record = useThen('it calibrates', async () =>
          JSON.parse(
            runVerb({
              path: PATH_TOKENS,
              args: ['calibrate', '--grove', 'local', '--json'],
              home: scene.home,
              forest: scene.forest,
            }).stdout,
          ),
        );

        then(
          'the 5h window derives tokens per % from the burn over the rise',
          () => {
            const fiveHour = record.windows.find(
              (w: { window: string }) => w.window === 'five_hour',
            );
            expect(fiveHour.verdict.state).toEqual('calibrated');
            expect(fiveHour.rise_pct).toEqual(10);
            expect(fiveHour.verdict.tokens_per_pct).toEqual(
              Math.floor(Math.floor(getWeightOfCall({ call })) / 10),
            );
            expect(fiveHour.pool.sustainable_per_hour).toBeGreaterThan(0);
          },
        );

        then(
          'the 7d window stays uncalibrated: no read before its 24h span',
          () => {
            const sevenDay = record.windows.find(
              (w: { window: string }) => w.window === 'seven_day',
            );
            expect(sevenDay.verdict.state).toEqual('uncalibrated');
            expect(sevenDay.verdict.why).toContain(
              'no cap read before the span',
            );
          },
        );

        then('the calibrated record shape matches its snapshot', () => {
          expect(asKeyShape(record)).toMatchSnapshot();
        });

        const tree = useThen('it renders the calibration', async () =>
          runVerb({
            path: PATH_TOKENS,
            args: ['calibrate', '--grove', 'local'],
            home: scene.home,
            forest: scene.forest,
          }),
        );

        then(
          'the calibrated render, its live figures masked, matches its snapshot',
          () => {
            expect(tree.status).toEqual(0);
            expect(tree.stdout).toContain('weighted per %');
            expect(tree.stdout.replace(/\d+(\.\d+)?/g, 'N')).toMatchSnapshot();
          },
        );
      },
    );

    when('[t2] the 5h window reset between the two reads', () => {
      const scene = useBeforeAll(async () =>
        genFixtureHome({
          slug: 'crew-tokens-cal-straddle',
          crews: [
            {
              tree: 'svc-lessons.beav.feat-book-a-lesson',
              branch: 'beav/feat-book-a-lesson',
              bound: true,
              account: 'bert@example.com',
              calls: [genCall({ id: 'msg-a', minsAgo: 30 })],
            },
          ],
          caps: [
            {
              tree: 'svc-lessons.beav.feat-book-a-lesson',
              account: 'bert@example.com',
              minsAgo: 130,
              fiveHour: { used: 80, resetsAt: getEpochAhead({ mins: -60 }) },
              sevenDay: null,
            },
            {
              tree: 'svc-lessons.beav.feat-book-a-lesson',
              account: 'bert@example.com',
              minsAgo: 1,
              fiveHour: { used: 5, resetsAt: getEpochAhead({ mins: 240 }) },
              sevenDay: null,
            },
          ],
        }),
      );
      const record = useThen('it calibrates', async () =>
        JSON.parse(
          runVerb({
            path: PATH_TOKENS,
            args: ['calibrate', '--grove', 'local', '--json'],
            home: scene.home,
            forest: scene.forest,
          }).stdout,
        ),
      );

      then('the pair is refused, never a negative rate', () => {
        const fiveHour = record.windows.find(
          (w: { window: string }) => w.window === 'five_hour',
        );
        expect(fiveHour.verdict.state).toEqual('uncalibrated');
        expect(fiveHour.verdict.why).toContain('reset inside the span');
      });

      const tree = useThen('it renders the calibration', async () =>
        runCalibrateTree({ scene }),
      );

      then('the tree reads the 5h window uncalibrated, with its why', () => {
        expect(tree.status).toEqual(0);
        expect(tree.stdout).toMatch(
          /├─ five_hour: ⚪ uncalibrated — .*reset inside the span/,
        );
      });

      then('the reset render, its figures masked, matches its snapshot', () => {
        expect(tree.masked).toMatchSnapshot();
      });
    });

    when('[t3] a second account burns in the span with no cap read', () => {
      const resets5h = getEpochAhead({ mins: 200 });
      const scene = useBeforeAll(async () =>
        genFixtureHome({
          slug: 'crew-tokens-cal-absent',
          crews: [
            {
              tree: 'svc-lessons.beav.feat-book-a-lesson',
              branch: 'beav/feat-book-a-lesson',
              bound: true,
              account: 'bert@example.com',
              calls: [genCall({ id: 'msg-a', minsAgo: 30 })],
            },
            {
              tree: 'svc-lessons.beav.feat-board-rentals',
              branch: 'beav/feat-board-rentals',
              bound: true,
              account: 'jamie@example.com',
              calls: [genCall({ id: 'msg-b', minsAgo: 30 })],
            },
          ],
          caps: [
            {
              tree: 'svc-lessons.beav.feat-book-a-lesson',
              account: 'bert@example.com',
              minsAgo: 130,
              fiveHour: { used: 10, resetsAt: resets5h },
              sevenDay: null,
            },
            {
              tree: 'svc-lessons.beav.feat-book-a-lesson',
              account: 'bert@example.com',
              minsAgo: 1,
              fiveHour: { used: 20, resetsAt: resets5h },
              sevenDay: null,
            },
          ],
        }),
      );
      const record = useThen('it calibrates', async () =>
        JSON.parse(
          runVerb({
            path: PATH_TOKENS,
            args: ['calibrate', '--grove', 'local', '--json'],
            home: scene.home,
            forest: scene.forest,
          }).stdout,
        ),
      );

      then('the pool is refused and names the account that went unread', () => {
        const fiveHour = record.windows.find(
          (w: { window: string }) => w.window === 'five_hour',
        );
        expect(fiveHour.verdict.state).toEqual('uncalibrated');
        expect(fiveHour.verdict.why).toContain('jamie@example.com');
      });

      const tree = useThen('it renders the calibration', async () =>
        runCalibrateTree({ scene }),
      );

      then(
        'the tree reads the 5h window uncalibrated, and names the account',
        () => {
          expect(tree.status).toEqual(0);
          expect(tree.stdout).toMatch(
            /├─ five_hour: ⚪ uncalibrated — .*jamie@example\.com/,
          );
        },
      );

      then(
        'the absent-account render, its figures masked, matches its snapshot',
        () => {
          expect(tree.masked).toMatchSnapshot();
        },
      );
    });

    // the 5h span is 120 min, its tolerance 12: a before-read 200 min back spans other time
    when('[t4] the before-read sits far off the span start', () => {
      const resets5h = getEpochAhead({ mins: 200 });
      const scene = useBeforeAll(async () =>
        genFixtureHome({
          slug: 'crew-tokens-cal-offspan',
          crews: [
            {
              tree: 'svc-lessons.beav.feat-book-a-lesson',
              branch: 'beav/feat-book-a-lesson',
              bound: true,
              account: 'bert@example.com',
              calls: [genCall({ id: 'msg-a', minsAgo: 30 })],
            },
          ],
          caps: [
            {
              tree: 'svc-lessons.beav.feat-book-a-lesson',
              account: 'bert@example.com',
              minsAgo: 200,
              fiveHour: { used: 10, resetsAt: resets5h },
              sevenDay: null,
            },
            {
              tree: 'svc-lessons.beav.feat-book-a-lesson',
              account: 'bert@example.com',
              minsAgo: 1,
              fiveHour: { used: 20, resetsAt: resets5h },
              sevenDay: null,
            },
          ],
        }),
      );
      const record = useThen('it calibrates', async () =>
        JSON.parse(
          runVerb({
            path: PATH_TOKENS,
            args: ['calibrate', '--grove', 'local', '--json'],
            home: scene.home,
            forest: scene.forest,
          }).stdout,
        ),
      );

      then(
        'the pair is refused: its rise spans other time than the burn',
        () => {
          const fiveHour = record.windows.find(
            (w: { window: string }) => w.window === 'five_hour',
          );
          expect(fiveHour.verdict.state).toEqual('uncalibrated');
          expect(fiveHour.verdict.why).toContain(
            'sit more than 12 min off the span ends',
          );
        },
      );

      const tree = useThen('it renders the calibration', async () =>
        runCalibrateTree({ scene }),
      );

      then('the tree reads the 5h window uncalibrated, with its why', () => {
        expect(tree.status).toEqual(0);
        expect(tree.stdout).toMatch(
          /├─ five_hour: ⚪ uncalibrated — .*sit more than 12 min off the span ends/,
        );
      });

      then(
        'the off-span render, its figures masked, matches its snapshot',
        () => {
          expect(tree.masked).toMatchSnapshot();
        },
      );
    });

    // a read whose window already reset says naught of now: the pool must leave it out
    when('[t5] one account last read before its window reset', () => {
      const resets5h = getEpochAhead({ mins: 200 });
      const resetsPast = getEpochAhead({ mins: -10 });
      const scene = useBeforeAll(async () =>
        genFixtureHome({
          slug: 'crew-tokens-cal-stale',
          crews: [
            {
              tree: 'svc-lessons.beav.feat-book-a-lesson',
              branch: 'beav/feat-book-a-lesson',
              bound: true,
              account: 'bert@example.com',
              calls: [genCall({ id: 'msg-a', minsAgo: 30 })],
            },
          ],
          caps: [
            {
              tree: 'svc-lessons.beav.feat-book-a-lesson',
              account: 'bert@example.com',
              minsAgo: 130,
              fiveHour: { used: 10, resetsAt: resets5h },
              sevenDay: null,
            },
            {
              tree: 'svc-lessons.beav.feat-book-a-lesson',
              account: 'bert@example.com',
              minsAgo: 1,
              fiveHour: { used: 20, resetsAt: resets5h },
              sevenDay: null,
            },
            {
              tree: 'svc-lessons.beav.feat-book-a-lesson',
              account: 'jamie@example.com',
              minsAgo: 130,
              fiveHour: { used: 90, resetsAt: resetsPast },
              sevenDay: null,
            },
            {
              tree: 'svc-lessons.beav.feat-book-a-lesson',
              account: 'jamie@example.com',
              minsAgo: 2,
              fiveHour: { used: 90, resetsAt: resetsPast },
              sevenDay: null,
            },
          ],
        }),
      );
      const record = useThen('it calibrates', async () =>
        JSON.parse(
          runVerb({
            path: PATH_TOKENS,
            args: ['calibrate', '--grove', 'local', '--json'],
            home: scene.home,
            forest: scene.forest,
          }).stdout,
        ),
      );

      then('the window calibrates on the fresh account', () => {
        const fiveHour = record.windows.find(
          (w: { window: string }) => w.window === 'five_hour',
        );
        expect(fiveHour.verdict.state).toEqual('calibrated');
      });

      then('the pool counts the stale read and leaves it out', () => {
        const fiveHour = record.windows.find(
          (w: { window: string }) => w.window === 'five_hour',
        );
        expect(fiveHour.pool.accounts).toEqual(2);
        expect(fiveHour.pool.reads_stale).toEqual(1);
      });

      const tree = useThen('it renders the calibration', async () =>
        runCalibrateTree({ scene }),
      );

      // 5h calibrates here, so the uncalibrated line the tree owes is the 7d one
      then(
        'the tree calibrates 5h and reads 7d uncalibrated, with its why',
        () => {
          expect(tree.status).toEqual(0);
          expect(tree.stdout).toContain('├─ five_hour: ');
          expect(tree.stdout).toContain('weighted per %');
          expect(tree.stdout).toMatch(/└─ seven_day: ⚪ uncalibrated — \S/);
        },
      );

      then(
        'the stale-read render, its figures masked, matches its snapshot',
        () => {
          expect(tree.masked).toMatchSnapshot();
        },
      );
    });

    // a read whose window has not reset can still be old: a seat that has not logged since
    // may have spent the headroom it reported, so a read past the tolerance is stale too
    when(
      '[t6] the latest read is an hour old, its window not yet reset',
      () => {
        const resets5h = getEpochAhead({ mins: 200 });
        const scene = useBeforeAll(async () =>
          genFixtureHome({
            slug: 'crew-tokens-cal-aged',
            crews: [
              {
                tree: 'svc-lessons.beav.feat-book-a-lesson',
                branch: 'beav/feat-book-a-lesson',
                bound: true,
                account: 'bert@example.com',
                calls: [genCall({ id: 'msg-a', minsAgo: 100 })],
              },
            ],
            caps: [
              {
                tree: 'svc-lessons.beav.feat-book-a-lesson',
                account: 'bert@example.com',
                minsAgo: 190,
                fiveHour: { used: 10, resetsAt: resets5h },
                sevenDay: null,
              },
              {
                tree: 'svc-lessons.beav.feat-book-a-lesson',
                account: 'bert@example.com',
                minsAgo: 61,
                fiveHour: { used: 20, resetsAt: resets5h },
                sevenDay: null,
              },
            ],
          }),
        );
        const record = useThen('it calibrates', async () =>
          JSON.parse(
            runVerb({
              path: PATH_TOKENS,
              args: ['calibrate', '--grove', 'local', '--json'],
              home: scene.home,
              forest: scene.forest,
            }).stdout,
          ),
        );

        then(
          'the pair still calibrates: its reads sit on the span ends',
          () => {
            const fiveHour = record.windows.find(
              (w: { window: string }) => w.window === 'five_hour',
            );
            expect(fiveHour.verdict.state).toEqual('calibrated');
          },
        );

        then(
          'the pool leaves the aged read out, and sustains naught on it',
          () => {
            const fiveHour = record.windows.find(
              (w: { window: string }) => w.window === 'five_hour',
            );
            expect(fiveHour.pool.reads_stale).toEqual(1);
            expect(fiveHour.pool.sustainable_per_hour).toEqual(0);
          },
        );

        const tree = useThen('it renders the calibration', async () =>
          runCalibrateTree({ scene }),
        );

        then(
          'the tree calibrates 5h and reads 7d uncalibrated, with its why',
          () => {
            expect(tree.status).toEqual(0);
            expect(tree.stdout).toContain('weighted per %');
            expect(tree.stdout).toMatch(/└─ seven_day: ⚪ uncalibrated — \S/);
          },
        );

        then(
          'the aged-read render, its figures masked, matches its snapshot',
          () => {
            expect(tree.masked).toMatchSnapshot();
          },
        );
      },
    );

    // the two windows judge their pairs apart: a 5h reset inside its span must not cost
    // the 7d pair, whose reads hold one reset across the whole 24h span
    when(
      '[t7] the 5h window reset inside its span, the 7d pair whole across 24h',
      () => {
        const call = genCall({ id: 'msg-a', minsAgo: 30 });
        const resets7d = getEpochAhead({ mins: 4000 });
        const scene = useBeforeAll(async () =>
          genFixtureHome({
            slug: 'crew-tokens-cal-seven-day',
            crews: [
              {
                tree: 'svc-lessons.beav.feat-book-a-lesson',
                branch: 'beav/feat-book-a-lesson',
                bound: true,
                account: 'bert@example.com',
                calls: [call],
              },
            ],
            caps: [
              {
                tree: 'svc-lessons.beav.feat-book-a-lesson',
                account: 'bert@example.com',
                minsAgo: 1460,
                fiveHour: {
                  used: 80,
                  resetsAt: getEpochAhead({ mins: -1300 }),
                },
                sevenDay: { used: 30, resetsAt: resets7d },
              },
              {
                tree: 'svc-lessons.beav.feat-book-a-lesson',
                account: 'bert@example.com',
                minsAgo: 1,
                fiveHour: { used: 5, resetsAt: getEpochAhead({ mins: 240 }) },
                sevenDay: { used: 32, resetsAt: resets7d },
              },
            ],
          }),
        );
        const record = useThen('it calibrates', async () =>
          JSON.parse(
            runVerb({
              path: PATH_TOKENS,
              args: ['calibrate', '--grove', 'local', '--json'],
              home: scene.home,
              forest: scene.forest,
            }).stdout,
          ),
        );

        then('the 5h pair is refused for its reset', () => {
          const fiveHour = record.windows.find(
            (w: { window: string }) => w.window === 'five_hour',
          );
          expect(fiveHour.verdict.state).toEqual('uncalibrated');
          expect(fiveHour.verdict.why).toContain('reset inside the span');
        });

        then('the 7d pair is kept: tokens per % over its 2% rise', () => {
          const sevenDay = record.windows.find(
            (w: { window: string }) => w.window === 'seven_day',
          );
          expect(sevenDay.verdict.state).toEqual('calibrated');
          expect(sevenDay.rise_pct).toEqual(2);
          expect(sevenDay.verdict.tokens_per_pct).toEqual(
            Math.floor(Math.floor(getWeightOfCall({ call })) / 2),
          );
          expect(sevenDay.pool.sustainable_per_hour).toBeGreaterThan(0);
        });

        const tree = useThen('it renders the calibration', async () =>
          runCalibrateTree({ scene }),
        );

        then('the tree reads 5h uncalibrated and 7d weighted per %', () => {
          expect(tree.status).toEqual(0);
          expect(tree.stdout).toMatch(
            /├─ five_hour: ⚪ uncalibrated — .*reset inside the span/,
          );
          expect(tree.masked).toMatch(/└─ seven_day: NK? weighted per %/);
        });

        then(
          'the 7d-only render, its figures masked, matches its snapshot',
          () => {
            expect(tree.masked).toMatchSnapshot();
          },
        );
      },
    );
  });

  given('[case4] a flag the verb does not know', () => {
    when('[t0] it is passed', () => {
      const scene = useBeforeAll(async () =>
        genFixtureHome({ slug: 'crew-tokens-flag', crews: [] }),
      );
      const result = useThen('it runs', async () =>
        runVerb({
          path: PATH_TOKENS,
          args: ['--windwo', '60'],
          home: scene.home,
          forest: scene.forest,
        }),
      );

      then('it refuses with exit 2 and names the flag', () => {
        expect(result.status).toEqual(2);
        expect(result.stderr).toContain(
          "✋ ConstraintError: unknown flag '--windwo'",
        );
      });
    });
  });

  given('[case5] the refusals a caller can hit before any read', () => {
    const scene = useBeforeAll(async () =>
      genFixtureHome({ slug: 'crew-tokens-refusals', crews: [] }),
    );
    const REFUSALS = [
      {
        description: '[t0] a non-numeric window',
        args: ['--window', 'soon'],
        says: '--window must be a whole number',
      },
      {
        description: '[t1] a span whose since does not precede its until',
        args: [
          '--since',
          '2026-11-01T10:00:00Z',
          '--until',
          '2026-11-01T09:00:00Z',
        ],
        says: 'the span is empty',
      },
      {
        description: '[t2] a span under one minute',
        args: [
          '--since',
          '2026-11-01T10:00:00Z',
          '--until',
          '2026-11-01T10:00:30Z',
        ],
        says: 'the span is under one minute',
      },
      {
        description: '[t3] a grove no registry names',
        args: ['--grove', 'grove-sandpine-absent'],
        says: 'grove-sandpine-absent',
      },
      {
        description: '[t4] a cap span of zero minutes',
        args: ['calibrate', '--span-5h', '0'],
        says: '--span-5h must be at least 1 minute',
      },
      {
        description: '[t5] a flag with no value',
        args: ['--window'],
        says: '--window needs a value',
      },
      {
        description: '[t6] two groves in one read',
        args: ['local', 'grove-sandpine-v20260901'],
        says: 'one grove per read',
      },
      {
        description: '[t7] an instant that does not read',
        args: ['--since', 'low tide'],
        says: '--since is not a readable instant',
      },
      // `timeout 0` disables the bound: one hung grove would freeze the whole read
      {
        description: '[t8] a zero timeout',
        args: ['--timeout', '0'],
        says: '--timeout must be at least 1 second',
      },
      // a future span holds no transcript yet: its burn read 0, an idle fleet in the voice of a measure
      {
        description: '[t9] a span that begins in the future',
        args: [
          '--since',
          // datestamps, so the snapped refusal holds no clock time (.husky/check.timestamps.sh)
          '2099-01-01',
          '--until',
          '2099-01-02',
        ],
        says: '--since is in the future',
      },
    ];
    REFUSALS.forEach((refusal) =>
      when(refusal.description, () => {
        const result = useThen('it runs', async () =>
          runVerb({
            path: PATH_TOKENS,
            args: refusal.args,
            home: scene.home,
            forest: scene.forest,
          }),
        );

        then('it refuses with exit 2 and says why', () => {
          expect(result.status).toEqual(2);
          expect(result.stderr).toContain('✋ ConstraintError');
          expect(result.stderr).toContain(refusal.says);
        });

        then('the refusal matches its snapshot', () => {
          expect(result.stderr).toMatchSnapshot();
        });
      }),
    );
  });

  given('[case6] help is asked for', () => {
    const scene = useBeforeAll(async () =>
      genFixtureHome({ slug: 'crew-tokens-help', crews: [] }),
    );

    when('[t0] it runs', () => {
      const result = useThen('it runs', async () =>
        runVerb({
          path: PATH_TOKENS,
          args: ['--help'],
          home: scene.home,
          forest: scene.forest,
        }),
      );

      then('it exits 0 with usage, inputs, and calibrate', () => {
        expect(result.status).toEqual(0);
        expect(result.stdout).toContain('calibrate');
        expect(result.stdout).toContain('--window');
        expect(result.stdout).toContain('--grove');
      });

      then('the help matches its snapshot', () => {
        expect(result.stdout).toMatchSnapshot();
      });
    });
  });

  // found on 0901: a read whose one grove timed out rendered `fleet: 0 · 0/h` — an idle
  // fleet, in the voice of a measure (term=false-report)
  given('[case7] the one grove named cannot be reached', () => {
    const scene = useBeforeAll(async () => {
      const fixture = genFixtureHome({
        slug: 'crew-tokens-unreached',
        crews: [],
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

    when('[t0] the read runs', () => {
      const json = useThen('it reads as json', async () =>
        runVerb({
          path: PATH_TOKENS,
          args: [
            '--grove',
            'grove-sandpine-v20260901',
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
          path: PATH_TOKENS,
          args: ['--grove', 'grove-sandpine-v20260901', '--timeout', '20'],
          home: scene.home,
          forest: scene.forest,
        }),
      );

      then('it exits 1: the grove it was asked for went unread', () => {
        expect(json.status).toEqual(1);
        expect(tree.status).toEqual(1);
      });

      then('the burn is unknown (null), never 0', () => {
        const record = JSON.parse(json.stdout);
        expect(record.read).toEqual(false);
        expect(record.fleet.weighted).toBeNull();
        expect(record.fleet.weighted_per_hour).toBeNull();
        expect(record.unreached).toEqual(['grove-sandpine-v20260901']);
      });

      then('the render reads ⚪ unread and names the grove, with no 0', () => {
        expect(tree.stdout).toContain(
          'fleet: ⚪ unread — no grove answered (grove-sandpine-v20260901)',
        );
        expect(tree.stdout).not.toContain('fleet: 0');
      });

      // the header pointed to `see unread` with no unread row in sight (5.3 i003 r6.nitpick.2)
      then('the header names the true cause: unreached, never unread', () => {
        expect(tree.stdout).toContain(
          '(cost-weighted; a LOWER BOUND — see unreached)',
        );
        expect(tree.stdout).not.toContain('see unread');
      });

      then('the unreached record shape matches its snapshot', () => {
        expect(asKeyShape(JSON.parse(json.stdout))).toMatchSnapshot();
      });

      then('the unreached render matches its snapshot, the home masked', () => {
        expect(tree.stdout.split(scene.home).join('<home>')).toMatchSnapshot();
      });
    });
  });

  // the remote arm: a named grove that answers. a fake `ssh` on PATH runs the command it is
  // handed on this box, so the payload re-quote, the remote record parse, and the fold all run
  given('[case8] a named grove that answers over ssh', () => {
    const scene = useBeforeAll(async () => {
      const fixture = genFixtureHome({
        slug: 'crew-tokens-remote',
        crews: [
          {
            tree: 'svc-lessons.beav.feat-book-a-lesson',
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
          sshAlias: 'grove-sandpine',
        }),
      );
      const bin = tempDirs.genOne({ slug: 'crew-tokens-fake-ssh' });
      // the last arg is the remote command (`bash -c <quoted payload>`), as ssh hands it to a shell
      writeFileSync(
        join(bin, 'ssh'),
        '#!/usr/bin/env bash\nexec bash -c "${@: -1}"\n',
        {
          mode: 0o755,
        },
      );
      return { ...fixture, bin };
    });

    when('[t0] the read runs as json', () => {
      const result = useThen('it reads', async () =>
        runVerb({
          path: PATH_TOKENS,
          args: ['--grove', 'grove-sandpine-v20260901', '--json'],
          home: scene.home,
          forest: scene.forest,
          env: { PATH: `${scene.bin}:${process.env.PATH}` },
        }),
      );

      then('it exits 0, the grove read over the remote arm', () => {
        expect(result.status).toEqual(0);
        const record = JSON.parse(result.stdout);
        expect(record.groves).toHaveLength(1);
        expect(record.groves[0].grove).toEqual('grove-sandpine-v20260901');
        expect(record.groves[0].state).toEqual('read');
      });

      then('the remote record shape matches its snapshot', () => {
        expect(asKeyShape(JSON.parse(result.stdout))).toMatchSnapshot();
      });

      then('the remote record folds: its crew, its kind, its weight', () => {
        const record = JSON.parse(result.stdout);
        const crew = record.groves[0].record.crews.find((c: { crew: string }) =>
          c.crew.endsWith('feat-book-a-lesson'),
        );
        expect(crew.kind).toEqual('behavior');
        expect(crew.weighted).toBeGreaterThan(0);
        expect(record.fleet.by_kind.behavior.crews).toEqual(1);
      });
    });

    // the remote tree is its own render: a grove row above the crews it read (5.3 i004 r10.blocker.1)
    when('[t1] the read renders the tree', () => {
      const tree = useThen('it renders', async () =>
        runVerb({
          path: PATH_TOKENS,
          args: ['--grove', 'grove-sandpine-v20260901'],
          home: scene.home,
          forest: scene.forest,
          env: { PATH: `${scene.bin}:${process.env.PATH}` },
        }),
      );

      then('it exits 0, the grove row above its behavior crew', () => {
        expect(tree.status).toEqual(0);
        expect(tree.stdout).toContain('grove-sandpine-v20260901');
        expect(tree.stdout).toContain('feat-book-a-lesson');
        expect(tree.stdout.indexOf('grove-sandpine-v20260901')).toBeLessThan(
          tree.stdout.indexOf('feat-book-a-lesson'),
        );
      });

      then(
        'the remote render matches its snapshot, the home and figures masked',
        () => {
          expect(
            tree.stdout
              .split(scene.home)
              .join('<home>')
              .split('grove-sandpine-v20260901')
              .join('<grove>')
              .replace(/\d+(\.\d+)?/g, 'N')
              .replace('<grove>', 'grove-sandpine-v20260901'),
          ).toMatchSnapshot();
        },
      );
    });
  });

  // a box that drops the connect: ssh itself says `timed out`, exit 255, before any probe ran.
  // it was read `💥 unreadable` with no next move; it is a timeout, with the wake and re-read
  given('[case9] a named grove whose ssh connect times out', () => {
    const scene = useBeforeAll(async () => {
      const fixture = genFixtureHome({
        slug: 'crew-tokens-syn-drop',
        crews: [],
      });
      writeFileSync(
        join(fixture.forest, 'groves', 'grove-sandpine-v20260901.json'),
        JSON.stringify({
          name: 'grove-sandpine-v20260901',
          host: 'grove.invalid',
          port: 22,
          sshAlias: 'grove-sandpine',
        }),
      );
      const bin = tempDirs.genOne({ slug: 'crew-tokens-ssh-timeout' });
      writeFileSync(
        join(bin, 'ssh'),
        '#!/usr/bin/env bash\necho "ssh: connect to host grove-sandpine port 22: Connection timed out" >&2\nexit 255\n',
        { mode: 0o755 },
      );
      return { ...fixture, bin };
    });

    when('[t0] the read runs as json', () => {
      const result = useThen('it reads', async () =>
        runVerb({
          path: PATH_TOKENS,
          args: ['--grove', 'grove-sandpine-v20260901', '--json'],
          home: scene.home,
          forest: scene.forest,
          env: { PATH: `${scene.bin}:${process.env.PATH}` },
        }),
      );

      then('the grove reads timeout, with the wake and the re-read', () => {
        const row = JSON.parse(result.stdout).groves[0];
        expect(row.state).toEqual('timeout');
        expect(row.hint).toContain(
          'rhx git.grove.wake grove-sandpine-v20260901',
        );
        expect(row.hint).toContain('--timeout');
      });
    });

    when('[t1] the read renders the tree', () => {
      const tree = useThen('it renders', async () =>
        runVerb({
          path: PATH_TOKENS,
          args: ['--grove', 'grove-sandpine-v20260901'],
          home: scene.home,
          forest: scene.forest,
          env: { PATH: `${scene.bin}:${process.env.PATH}` },
        }),
      );

      then('the grove row reads timeout and carries the wake', () => {
        expect(tree.stdout).toContain('grove-sandpine-v20260901: ⏳ timeout');
        expect(tree.stdout).toContain(
          'rhx git.grove.wake grove-sandpine-v20260901',
        );
      });

      then('the timeout render matches its snapshot, the home masked', () => {
        expect({
          status: tree.status,
          stdout: tree.stdout.split(scene.home).join('<home>'),
        }).toMatchSnapshot();
      });
    });
  });

  // found on the 5.3 ergonomics walk: a read sat silent through its whole fan-out, a frozen
  // cursor to a human. a terminal now sees what the read waits on; a pipe sees naught
  given('[case10] a read whose stderr is, or is not, a terminal', () => {
    const scene = useBeforeAll(async () =>
      genFixtureHome({ slug: 'crew-tokens-status', crews: [] }),
    );
    const env = (): NodeJS.ProcessEnv => ({
      ...process.env,
      HOME: scene.home,
      GIT_FOREST_DIR: scene.forest,
    });

    when('[t0] it runs on a terminal', () => {
      // `script` hands the verb a pty, as a human's shell does
      const result = useThen('it reads', async () => {
        const out = spawnSync(
          'script',
          ['-qec', `bash '${PATH_TOKENS}' local`, '/dev/null'],
          { encoding: 'utf8', env: env(), timeout: 240_000 },
        );
        return { status: out.status, stdout: out.stdout };
      });

      then('it says what it waits on, before the tree', () => {
        expect(result.status).toEqual(0);
        expect(result.stdout).toContain(
          '🌲 reads 1 grove(s) at once (local), up to 90s each…',
        );
        expect(result.stdout.indexOf('🌲 reads')).toBeLessThan(
          result.stdout.indexOf('🌲 crew tokens'),
        );
      });

      // a pty ends each line with \r\n; the snapshot holds the lines, its temp home masked
      then('the status line and the tree match their snapshot', () => {
        expect(
          result.stdout.replace(/\r/g, '').split(scene.home).join('<home>'),
        ).toMatchSnapshot();
      });
    });

    when('[t1] it runs into a pipe', () => {
      const result = useThen('it reads', async () =>
        runVerb({
          path: PATH_TOKENS,
          args: ['local'],
          home: scene.home,
          forest: scene.forest,
        }),
      );

      then('no status line rides along, so no output contract moves', () => {
        expect(result.status).toEqual(0);
        expect(result.stderr).not.toContain('🌲 reads');
        expect(result.stdout).not.toContain('🌲 reads');
      });
    });
  });

  // found live on the 5.3 walk: a grove with no jq read `jq is absent on this grove`, a cause
  // with no fix. a fake `ssh` runs the payload on a PATH that holds bash and naught else
  given('[case11] a named grove that answers, but holds no jq', () => {
    const scene = useBeforeAll(async () => {
      const fixture = genFixtureHome({
        slug: 'crew-tokens-no-jq',
        crews: [],
      });
      writeFileSync(
        join(fixture.forest, 'groves', 'grove-sandpine-v20260901.json'),
        JSON.stringify({
          name: 'grove-sandpine-v20260901',
          host: 'grove.invalid',
          port: 22,
          sshAlias: 'grove-sandpine',
        }),
      );
      const bin = tempDirs.genOne({ slug: 'crew-tokens-ssh-no-jq' });
      const bare = tempDirs.genOne({ slug: 'crew-tokens-path-bare' });
      const bash = spawnSync('which', ['bash']).stdout.toString().trim();
      symlinkSync(bash, join(bare, 'bash'));
      writeFileSync(
        join(bin, 'ssh'),
        `#!/usr/bin/env bash\nPATH='${bare}' exec '${bash}' -c "\${@: -1}"\n`,
        { mode: 0o755 },
      );
      return { ...fixture, bin };
    });

    when('[t0] the read runs as json', () => {
      const result = useThen('it reads', async () =>
        runVerb({
          path: PATH_TOKENS,
          args: ['--grove', 'grove-sandpine-v20260901', '--json'],
          home: scene.home,
          forest: scene.forest,
          env: { PATH: `${scene.bin}:${process.env.PATH}` },
        }),
      );

      then('the grove reads unreadable, and its hint names the install', () => {
        const row = JSON.parse(result.stdout).groves[0];
        expect(row.state).toEqual('unreadable');
        expect(row.hint).toContain('jq is absent on this grove');
        expect(row.hint).toContain(
          "rhx git.grove.send <grove> --what 'sudo apt-get install -y jq'",
        );
      });
    });

    when('[t1] the read renders the tree', () => {
      const tree = useThen('it renders', async () =>
        runVerb({
          path: PATH_TOKENS,
          args: ['--grove', 'grove-sandpine-v20260901'],
          home: scene.home,
          forest: scene.forest,
          env: { PATH: `${scene.bin}:${process.env.PATH}` },
        }),
      );

      then('the grove row reads unreadable and carries the install', () => {
        expect(tree.stdout).toContain('jq is absent on this grove');
        expect(tree.stdout).toContain('sudo apt-get install -y jq');
      });

      then('the no-jq render matches its snapshot, the home masked', () => {
        expect({
          status: tree.status,
          stdout: tree.stdout.split(scene.home).join('<home>'),
        }).toMatchSnapshot();
      });
    });
  });

  /**
   * .what = a fixture home beside one registered grove, reached through a stub ssh
   * .why  = the asleep and timeout cases differ only in what the stub ssh does
   */
  const genSceneOfStubSsh = (input: { slug: string; ssh: string }) => {
    const fixture = genFixtureHome({ slug: input.slug, crews: [] });
    writeFileSync(
      join(fixture.forest, 'groves', 'grove-sandpine-v20260901.json'),
      JSON.stringify({
        name: 'grove-sandpine-v20260901',
        host: 'grove.invalid',
        port: 22,
        sshAlias: 'grove-sandpine',
      }),
    );
    const bin = tempDirs.genOne({ slug: `${input.slug}-bin` });
    writeFileSync(join(bin, 'ssh'), input.ssh, { mode: 0o755 });
    return { ...fixture, bin };
  };

  // ssh itself refuses the connect: the box is down, so the row is asleep, with the wake
  given('[case12] a named grove whose ssh connect is refused', () => {
    const scene = useBeforeAll(async () =>
      genSceneOfStubSsh({
        slug: 'crew-tokens-ssh-refused',
        ssh: '#!/usr/bin/env bash\necho "ssh: connect to host grove-sandpine port 22: Connection refused" >&2\nexit 255\n',
      }),
    );

    when('[t0] the read renders the tree', () => {
      const tree = useThen('it renders', async () =>
        runVerb({
          path: PATH_TOKENS,
          args: ['--grove', 'grove-sandpine-v20260901', '--timeout', '2'],
          home: scene.home,
          forest: scene.forest,
          env: { PATH: `${scene.bin}:${process.env.PATH}` },
        }),
      );

      then('it exits 1: the grove it was asked for went unread', () => {
        expect(tree.status).toEqual(1);
      });

      then('the grove row reads asleep, with the wake', () => {
        expect(tree.stdout).toContain(
          '└─ grove-sandpine-v20260901: 💤 asleep — wake it: rhx git.grove.wake grove-sandpine-v20260901',
        );
      });

      then('the header points to the unreached grove, never to unread', () => {
        expect(tree.stdout).toContain('a LOWER BOUND — see unreached)');
      });

      then('the asleep render matches its snapshot, the home masked', () => {
        expect(tree.stdout.split(scene.home).join('<home>')).toMatchSnapshot();
      });
    });
  });

  // the box takes the connect and never answers: the bound fires, the row reads timeout
  given('[case13] a named grove whose ssh hangs past the timeout', () => {
    const scene = useBeforeAll(async () =>
      genSceneOfStubSsh({
        slug: 'crew-tokens-ssh-hang',
        ssh: '#!/usr/bin/env bash\nexec sleep 30\n',
      }),
    );

    when('[t0] the read renders the tree', () => {
      const tree = useThen('it renders', async () =>
        runVerb({
          path: PATH_TOKENS,
          args: ['--grove', 'grove-sandpine-v20260901', '--timeout', '2'],
          home: scene.home,
          forest: scene.forest,
          env: { PATH: `${scene.bin}:${process.env.PATH}` },
        }),
      );

      then('it exits 1: the grove it was asked for went unread', () => {
        expect(tree.status).toEqual(1);
      });

      then('the grove row reads timeout, with the re-read', () => {
        expect(tree.stdout).toContain(
          '└─ grove-sandpine-v20260901: ⏳ timeout — a slow read is a load signal; re-read once: rhx git.crew.tokens grove-sandpine-v20260901 --timeout 4',
        );
      });

      then('the timeout render matches its snapshot, the home masked', () => {
        expect(tree.stdout.split(scene.home).join('<home>')).toMatchSnapshot();
      });
    });
  });
});
