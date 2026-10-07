// biome-ignore-all lint/suspicious/noControlCharactersInRegex: a captured tmux
// pane IS a stream of ANSI escapes, so every clamp here must strip them before
// it reads the text. the \u001b is the subject of these regexes rather than a
// typo in them — the rule is a false positive over a terminal-capture corpus.
/**
 * .what = clamps on what a pane SAYS — caps, turns, queues, ghosts, lost modes
 *
 * .note = a PART of the `ductwork` suite, cut so one reviewer can hold
 *         it whole. the suite's shared fixtures, and its account of what it
 *         runs against and why, live in ductwork.harness.ts.
 */
import { readFileSync } from 'fs';
import { join } from 'path';
import { given, then, useBeforeAll, when } from 'test-fns';

import { tempDirs } from '../../../.test/tempDirs';
import {
  genSocket,
  readDuctwork,
  readPollWhole,
  SOCKETS_MADE,
} from './ductwork.harness';
import {
  delStaleTestServers,
  delStaleTestSockets,
  delTmuxServer,
  hasTmux,
  runDuct,
} from './work.harness';

beforeAll(() => {
  if (!hasTmux())
    throw new Error(
      'tmux is required for the ductwork clamps. fix: sudo apt install tmux',
    );
  // sweep litter from any prior run that was killed before its teardown.
  //
  // .why BOTH: the two sweeps see different leftovers, and the second one is
  //      the one a socket sweep is blind to. a server whose socket was
  //      unlinked while it still ran leaves NO file to find — only a process.
  delStaleTestServers();
  delStaleTestSockets();
});

afterAll(() => {
  // .why = [case10] clamps the SOCKET sweep, but only in its own part, and a
  //        `--scope case3` run filters it out entirely. no case anywhere
  //        sweeps the temp DIRS. an afterAll in every part is the one teardown
  //        that neither order, scope, nor the cut can step around.
  for (const socket of SOCKETS_MADE) delTmuxServer({ socket });
  tempDirs.delAll();
});

describe('ductwork', () => {
  // .what = run a pure pane-classifier from ductwork against a fixture, with NO
  //         tmux server spun — the fn takes the flattened text as an arg.
  // .why  = these two discriminators are what the babysit tick reads to tell a
  //         DEAD or a WEDGED clone from a healthy one, and they sat inline in
  //         duct.poll's per-duct loop where no clamp could reach them. extracted
  //         into ductwork so `runDuct` can source them and feed a fixture; the
  //         verdict rides out on stdout (rule.require.clamp-edge-cases).
  const runClassifier = (input: {
    fn: string;
    fixture: string;
  }): { stdout: string } => {
    const out = runDuct({
      socket: genSocket('classify'),
      ductworkDir: tempDirs.genOne({ slug: 'registry' }),
      body: [
        "flat=$(cat <<'FIXEOF'",
        input.fixture,
        'FIXEOF',
        ')',
        `if ${input.fn} "$flat"; then echo "VERDICT=yes"; else echo "VERDICT=no"; fi`,
      ].join('\n'),
    });
    return { stdout: out.stdout };
  };

  given(
    '[case16] __duct_pane_has_ratelimit — a live box stopped on the rate cap',
    () => {
      // a WEDGE: claude is ALIVE (its ❯ box is drawn) but STOPPED on `API Error:
      // Rate limit reached` and idled. the pane renders like health, so the tick
      // reads `😶 at work` over an idle clone unless this fires.
      when('[t0] the error sits in the TAIL', () => {
        const scene = useBeforeAll(async () =>
          runClassifier({
            fn: '__duct_pane_has_ratelimit',
            fixture: [
              '❯ run a task',
              '  ⎿  API Error: Rate limit reached · retry soon',
            ].join('\n'),
          }),
        );
        then('it flags the rate-limit hit', () => {
          expect(scene.stdout).toContain('VERDICT=yes');
        });
      });

      // 🔴 the TOOTH. a whole-pane `grep 'Rate limit'` flags this too — but the
      //    error is far up in SCROLLBACK from a turn claude already retried PAST,
      //    so a flag here is a term=false-report. the tail-15 scope excludes it.
      when('[t1] the error is only in far scrollback (>15 lines up)', () => {
        const scene = useBeforeAll(async () =>
          runClassifier({
            fn: '__duct_pane_has_ratelimit',
            fixture: [
              '  ⎿  API Error: Rate limit reached',
              ...Array.from({ length: 16 }, (_unused, i) => `line ${i + 1}`),
              '❯ back at work',
            ].join('\n'),
          }),
        );
        then('it does NOT flag a stale scrollback banner', () => {
          expect(scene.stdout).toContain('VERDICT=no');
        });
      });

      // 🔴 the SECOND TOOTH, and the real-case clamp. a raw tail-15 window MISSES
      //    this: claude's own live UI chrome — a 20-row todo list, a spinner, the
      //    box rule, the input box, the stone, the mode line — sits BELOW the
      //    banner, so the banner is ~19 RAW rows up and out of a tail-15 view,
      //    even though it is the last REAL output line. measured 2026-09-14 on
      //    svc-reservations.beav.feat-spot-forecast-widget (wedged ~21m), which
      //    fell through to `😶 at work`. the real-lines window discards the chrome
      //    and reads the banner.
      when('[t2] the banner sits under a live 20-row todo + box chrome', () => {
        const scene = useBeforeAll(async () =>
          runClassifier({
            fn: '__duct_pane_has_ratelimit',
            fixture: [
              '● Case4 — map the caller region',
              '  ⎿  API Error: Rate limit reached',
              '✻ Worked for 21m 10s',
              '20 tasks (5 done)',
              ...Array.from({ length: 20 }, (_unused, i) => `◼ task ${i + 1}`),
              '… +15 completed',
              '──────────────────────────────',
              '❯',
              '🗿 5.3.verification, review.peer, l1@i002 🔍',
              '⏵⏵ accept edits on',
            ].join('\n'),
          }),
        );
        then(
          'it flags the wedge the chrome pushed out of a tail window',
          () => {
            expect(scene.stdout).toContain('VERDICT=yes');
          },
        );
      });

      // 🔴 the THIRD TOOTH — a bare 429 that fired MID-TURN, right after a Search
      //    returned. the clone ran a Search, the api 429'd, and the bare banner
      //    rendered UNDER the Search line. it is anchored (the error OWNS its ⎿
      //    line — no file:line prefix, no Search(...) wrapper), so it IS a halt.
      //    this is the genuine wedge measured 2026-09-14 on svc-reservations.beav.feat-
      //    spot-forecast-widget, which sat idle 21m at an empty box. a prior
      //    line-above heuristic wrongly read this as tool DATA and left it halted
      //    across ticks. the pure anchor test flags it.
      when(
        '[t3] a bare 429 banner UNDER a Search line — a mid-turn halt',
        () => {
          const scene = useBeforeAll(async () =>
            runClassifier({
              fn: '__duct_pane_has_ratelimit',
              fixture: [
                '● Case4 — the ip-address refusal test asserts the old message text. Let me update it:',
                '  Searched for 1 pattern (ctrl+o to expand)',
                '  ⎿  API Error: Rate limit reached',
                '✻ Worked for 21m 10s',
                '20 tasks (17 done, 1 in progress, 2 open)',
                ...Array.from({ length: 8 }, (_unused, i) => `◼ task ${i + 1}`),
                '… +10 completed',
                '──────────────────────────────',
                '❯',
                '🗿 5.3.verification, review.peer, l1@i002 🔍',
                '⏵⏵ accept edits on',
              ].join('\n'),
            }),
          );
          then('it flags the anchored bare halt as a wedge', () => {
            expect(scene.stdout).toContain('VERDICT=yes');
          });
        },
      );

      // the banner appears as the Search INVOCATION's own argument — the clone
      // grepped FOR the literal text. the `● Search(pattern: "` prefix sits before
      // the banner, so the line does NOT anchor. still DATA, still not a wedge.
      when('[t4] the banner is the Search tool argument itself', () => {
        const scene = useBeforeAll(async () =>
          runClassifier({
            fn: '__duct_pane_has_ratelimit',
            fixture: [
              '● Search(pattern: "API Error: Rate limit reached")',
              '  ⎿  Found 2 files',
              '❯',
              '🗿 5.3.verification, review.peer, l1@i002 🔍',
              '⏵⏵ accept edits on',
            ].join('\n'),
          }),
        );
        then(
          'it does NOT flag a search whose pattern is the banner text',
          () => {
            expect(scene.stdout).toContain('VERDICT=no');
          },
        );
      });

      // an actual GREP MATCH — the clone grepped for "API Error" and the ⎿ result
      // is a file:line hit whose text happens to hold the banner. the `file:line:`
      // locator prefixes the banner, so the line does NOT anchor. DATA, not a wedge.
      when('[t5] the banner is embedded in a grep file:line match', () => {
        const scene = useBeforeAll(async () =>
          runClassifier({
            fn: '__duct_pane_has_ratelimit',
            fixture: [
              '● Grep(pattern: "API Error")',
              '  ⎿  src/gateway.test.ts:42:  expect(msg).toBe("API Error: Rate limit reached")',
              '❯',
              '🗿 5.3.verification, review.peer, l1@i002 🔍',
              '⏵⏵ accept edits on',
            ].join('\n'),
          }),
        );
        then('it does NOT flag an embedded grep match', () => {
          expect(scene.stdout).toContain('VERDICT=no');
        });
      });

      // 🔴 the CROSS-FIRE guard: a USAGE-CAP pane (case17's own [t5] fixture) holds
      //    NO "API Error: Rate limit reached" — only "You've hit your limit". the
      //    two detectors must NOT cross-fire: the cap is case17's job, and the
      //    rate-limit detector stays silent on it. measured 2026-09-14, the same
      //    svc-reservations peer that hit its cap under a Bash grepsafe call.
      when('[t6] a usage-cap pane holds no API-Error banner', () => {
        const scene = useBeforeAll(async () =>
          runClassifier({
            fn: '__duct_pane_has_ratelimit',
            fixture: [
              '● Bash(rhx grepsafe --pattern ".skip(|.only(" --path src --glob "*.test.ts")',
              '  ⎿  🪨 run solid skill repo=ehmpathy/role=mechanic/skill=grepsafe',
              "  ⎿  You've hit your limit · resets 9:30am (UTC)",
              '✻ Sautéed for 1h 25m 30s',
              '❯',
              '🗿 5.3.verification, review.self, r1/r8 🔍',
              '⏵⏵ accept edits on',
            ].join('\n'),
          }),
        );
        then('it does NOT flag a cap pane as a rate-limit wedge', () => {
          expect(scene.stdout).toContain('VERDICT=no');
        });
      });
    },
  );

  given(
    '[case17] __duct_pane_cap_line — the INTERACTIVE usage-cap banner',
    () => {
      // the CAP: claude code drew "You've hit your limit · resets <time>" (or "out
      // of extra usage · resets <time>") with a live ❯ below. measured 2026-09-14
      // on grove v20260901: ~60 live sessions bore this banner and every one read
      // `😴 unread` in the sweep. this is a DIFFERENT banner from the headless
      // "API Error: Rate limit reached" that case16 covers.
      when(
        '[t0] the real grove banner — "hit your limit · resets 2:20am (UTC)"',
        () => {
          const scene = useBeforeAll(async () =>
            runClassifier({
              fn: '__duct_pane_cap_line',
              fixture: [
                "  ⎿  You've hit your limit · resets 2:20am (UTC)",
                '─────────────',
                '❯',
              ].join('\n'),
            }),
          );
          then('it flags the cap', () => {
            expect(scene.stdout).toContain('VERDICT=yes');
          });
          then(
            'it echoes the verbatim cap line for the reset-passed join',
            () => {
              expect(scene.stdout).toContain(
                'hit your limit · resets 2:20am (UTC)',
              );
            },
          );
        },
      );

      // 🔴 the TOOTH the human named: on LOCAL the reset time is the local zone,
      //    NOT UTC. a detector that anchored on "(UTC)" would miss every local
      //    clone. this fixture has NO "(UTC)" suffix — it must still flag, and it
      //    must capture the local time in the echoed line.
      when('[t1] a LOCAL-zone banner with NO (UTC) suffix', () => {
        const scene = useBeforeAll(async () =>
          runClassifier({
            fn: '__duct_pane_cap_line',
            fixture: ["  ⎿  You've hit your limit · resets 9:20pm", '❯'].join(
              '\n',
            ),
          }),
        );
        then('it still flags the cap (never anchored on UTC)', () => {
          expect(scene.stdout).toContain('VERDICT=yes');
        });
        then('it captures the local reset time', () => {
          expect(scene.stdout).toContain('resets 9:20pm');
        });
      });

      when('[t2] the "out of extra usage" variant', () => {
        const scene = useBeforeAll(async () =>
          runClassifier({
            fn: '__duct_pane_cap_line',
            fixture: [
              '  ⎿  out of extra usage · resets 3:00am (UTC)',
              '❯',
            ].join('\n'),
          }),
        );
        then('it flags the cap', () => {
          expect(scene.stdout).toContain('VERDICT=yes');
        });
      });

      // 🔴 the TOOTH against a false positive: a healthy pane never carries the
      //    "hit your limit … resets" phrase, so it must NOT flag.
      when('[t3] a normal live box, no cap banner', () => {
        const scene = useBeforeAll(async () =>
          runClassifier({
            fn: '__duct_pane_cap_line',
            fixture: ['✻ at work', '❯ type here'].join('\n'),
          }),
        );
        then('it does NOT flag a cap', () => {
          expect(scene.stdout).toContain('VERDICT=no');
        });
      });

      // 🔴 the TOOTH against incidental prose: a clone may DISCUSS rate limits in
      //    code or comments. the phrase "limit" alone must not flag — only the
      //    banner shape "hit your limit … resets <time>" counts.
      when('[t4] prose that mentions a limit but is not the banner', () => {
        const scene = useBeforeAll(async () =>
          runClassifier({
            fn: '__duct_pane_cap_line',
            fixture: [
              '  we should handle the rate limit case in the retry path',
              '❯ edit the handler',
            ].join('\n'),
          }),
        );
        then('it does NOT flag on incidental limit text', () => {
          expect(scene.stdout).toContain('VERDICT=no');
        });
      });

      // 🔴 the TOOTH the human named 2026-09-14: the cap banner rendered as a ⎿
      //    TOOL-RESULT that hung off a Bash grepsafe call — then a live box, a task
      //    list, and the stone below it. the whole-pane grep must still flag the cap
      //    — the ⎿ prefix and the chrome above and below do not hide it. (the real
      //    follow-line "/extra-usage to finish …" is elided; no detector reads it.)
      when(
        '[t5] the cap banner as a ⎿ tool-result under a Bash call, live box below',
        () => {
          const scene = useBeforeAll(async () =>
            runClassifier({
              fn: '__duct_pane_cap_line',
              fixture: [
                '● Bash(rhx grepsafe --pattern ".skip(|.only(|it.todo(|xit(|xdescribe(" --path src --glob "*.test.ts")',
                '  ⎿  🪨 run solid skill repo=ehmpathy/role=mechanic/skill=grepsafe',
                '     🐢 sweet',
                '     … +33 lines (ctrl+o to expand)',
                "  ⎿  You've hit your limit · resets 9:30am (UTC)",
                '✻ Sautéed for 1h 25m 30s',
                '  5 tasks (4 done, 1 in progress, 0 open)',
                '  ✔ Confirm asTrailInputRedacted suite green after dogfood revert',
                '  ✔ Run the full gate battery for 5.3 and capture verbatim proof',
                '  ✔ Audit skips, fake tests, and behavior coverage vs wish + vision',
                '  ✔ Write 5.3.verification.yield.md with the eight self-review articulations',
                '  ◼ Arrive 5.3.verification and converge every peer round',
                '─────────────────────────────────',
                '❯',
                '─────────────────────────────────',
                '  🗿 5.3.verification, review.self, r1/r8 🔍                new task? /clear to save 746K tokens',
                '  ⏵⏵ accept edits on (shift+tab to cycle)',
              ].join('\n'),
            }),
          );
          then(
            'it flags the cap through the ⎿ prefix and the chrome around it',
            () => {
              expect(scene.stdout).toContain('VERDICT=yes');
            },
          );
          then('it echoes the verbatim 9:30am cap line', () => {
            expect(scene.stdout).toContain(
              'hit your limit · resets 9:30am (UTC)',
            );
          });
        },
      );

      // 🔴 the REAL-WORLD clamp — the VERBATIM pane, captured 2026-09-14 straight
      //    from `git.crew.read` into .test/.assets/ (never hand-typed). from the
      //    SPONSORED star svc-reservations.beav.feat-rec-waitlist-capture. two
      //    forms the prior fixtures did NOT hold:
      //      1. a DATE-qualified reset — "resets Sep 20, 2pm (UTC)", not the HH:MM
      //         form every other fixture uses. the capture must not stop at a clock.
      //      2. the cap line is a ⎿ tool-result under a COMPACTED conversation, with
      //         a live ❯ + stone below — the box LOOKS idle-at-ready, so a live-box
      //         classifier reads `😶 at work` over a sponsored star capped until Sep 20.
      //    (rule.always.clamp-the-verbatim-pane-your-classifier-judged)
      when(
        '[t6] REAL: date-qualified reset, ⎿ result under a compacted conversation',
        () => {
          const scene = useBeforeAll(async () =>
            runClassifier({
              fn: '__duct_pane_cap_line',
              fixture: readFileSync(
                join(
                  __dirname,
                  '.test/.assets/pane.cap.date-reset-under-compaction.log',
                ),
                'utf8',
              ),
            }),
          );
          then(
            'it flags the cap despite the live ❯ and the compacted scrollback',
            () => {
              expect(scene.stdout).toContain('VERDICT=yes');
            },
          );
          then(
            'it captures the full DATE-qualified reset, not just a clock',
            () => {
              expect(scene.stdout).toContain(
                'hit your limit · resets Sep 20, 2pm (UTC)',
              );
            },
          );
        },
      );
    },
  );

  // 🔴 .what = a clone that GAVE UP and asked for a human, in its own words:
  //    `stuck on stone <X> after <N> attempts. please tell a human …`
  //
  // .why  = the pane that carries it renders like health — a live `❯`, a stone
  //    below it — so the sweep reads `😶 at work` over a clone that has stopped
  //    and explicitly requested a human. measured 2026-09-15 across THREE trees
  //    in one tick, at 23, 25 and 51 attempts.
  //
  // 🔴 .the attempt count is the INSTRUMENT'S cost, never the driver's fault.
  //    every instance sits directly beneath `Stop hook error: … route.drive
  //    └─ 💥 failed with an error` — the hook that would have re-emitted the
  //    stone crashed instead, so the driver re-entered and re-crashed, N times.
  //    the clone's own prose above the crash is coherent in all three.
  //
  // .why the anchor is `^[[:space:]]*stuck on stone` and not a bare phrase match
  //    a clone may GREP for this text, or hold it in a source line it has open —
  //    and both forms carry a locator PREFIX (`Grep(pattern: "…`,
  //    `src/hook.ts:12:`). an anchor at line-start excludes every prefixed form
  //    without a blocklist to maintain. t3 and t4 are that bound, with teeth.
  //
  // .the two REAL fixtures are verbatim `git.crew.read` captures on disk
  //    (rule.always.clamp-the-verbatim-pane-your-classifier-judged).
  given(
    '[case21] __duct_pane_escalation_line — a clone that asked for a human',
    () => {
      when(
        '[t0] REAL: svc-reservations spot-forecast, stuck at 51 attempts',
        () => {
          const scene = useBeforeAll(async () =>
            runClassifier({
              fn: '__duct_pane_escalation_line',
              fixture: readFileSync(
                join(
                  __dirname,
                  '.test/.assets/pane.escalation.stuck-after-51-attempts-please-tell-a-human.log',
                ),
                'utf8',
              ),
            }),
          );

          then('it flags the escalation', () => {
            expect(scene.stdout).toContain('VERDICT=yes');
          });

          // 🔴 the NON-VACUITY assertion. a bare VERDICT=yes would pass on any
          //    detector that fires; this can only pass if the STONE rides out in
          //    the echoed line — which is what lets the render GUIDE rather than
          //    merely classify (rule.require.poll-recommends-every-cure-heal-has).
          then(
            'it carries the STONE and the COUNT, so the render can guide',
            () => {
              expect(scene.stdout).toContain(
                'stuck on stone 5.3.verification after 51 attempts',
              );
            },
          );
        },
      );

      when('[t1] REAL: peer-review-parallelism, stuck at 25 attempts', () => {
        const scene = useBeforeAll(async () =>
          runClassifier({
            fn: '__duct_pane_escalation_line',
            fixture: readFileSync(
              join(
                __dirname,
                '.test/.assets/pane.escalation.route-drive-stophook-crash-after-25-attempts.log',
              ),
              'utf8',
            ),
          }),
        );

        then(
          'it flags the escalation on a SECOND tree, at a different count',
          () => {
            expect(scene.stdout).toContain('VERDICT=yes');
            expect(scene.stdout).toContain('after 25 attempts');
          },
        );
      });

      // 🔴 the TOOTH against a false positive: a healthy live box carries no such
      //    line, and must not flag. an escalation that fired on health would put
      //    every crew in front of a human.
      when('[t2] a normal live box, no escalation', () => {
        const scene = useBeforeAll(async () =>
          runClassifier({
            fn: '__duct_pane_escalation_line',
            fixture: [
              '✻ Cooked for 4m 2s',
              '❯ ',
              '🗿 5.1.execution.from_vision, yield 🌾',
            ].join('\n'),
          }),
        );

        then('it does NOT flag a healthy pane', () => {
          expect(scene.stdout).toContain('VERDICT=no');
        });
      });

      // 🔴 the TOOTH the line-start anchor exists for: the clone GREPPED for the
      //    phrase. the match is tool DATA, and a locator prefixes it.
      when('[t3] the phrase is a grep file:line hit', () => {
        const scene = useBeforeAll(async () =>
          runClassifier({
            fn: '__duct_pane_escalation_line',
            fixture: [
              '● Grep(pattern: "stuck on stone")',
              '  ⎿  src/hook.ts:12:  msg = "stuck on stone " + s + " after " + n + " attempts"',
              '❯ ',
            ].join('\n'),
          }),
        );

        then('it does NOT flag tool data as an escalation', () => {
          expect(scene.stdout).toContain('VERDICT=no');
        });
      });

      // 🔴 the second half of the anchor's bound: `attempts` alone is common
      //    prose, and `stuck on stone` alone is a phrase a brief may quote.
      //    NEITHER may flag on its own.
      when(
        '[t4] prose that carries one half of the phrase but not the shape',
        () => {
          const scene = useBeforeAll(async () =>
            runClassifier({
              fn: '__duct_pane_escalation_line',
              fixture: [
                '  the retry path allows 3 attempts before it gives up',
                '  a driver that is stuck on stone work should converge, never halt',
                '❯ ',
              ].join('\n'),
            }),
          );

          then('it does NOT flag half a match', () => {
            expect(scene.stdout).toContain('VERDICT=no');
          });
        },
      );
    },
  );

  // 🔴 .what = the plea extractor folds the pane before it matches, so a SPLIT
  //    pane stitches two columns into one string. this predicate drops that.
  //
  // .why the stakes are the highest in the file: a plea is a HUMAN-GATE
  //    surface. a miss costs a round trip; a FABRICATION sends a human to run
  //    a grant command not one clone asked for. #25 and #82 cured two other
  //    false-positive shapes here — this is the third, and the only one that
  //    invents its own text rather than resurface a stale one.
  given(
    '[case22] __duct_plea_is_smeared — a plea stitched across a split pane',
    () => {
      // 🔴 REAL, verbatim off the fleet, 2026-09-15. a ⭐ tree's foreman held an
      //    nvim split over `driver.route.contemplated-help.acceptance.test.ts.snap`
      //    — a snapshot whose CONTENT is `route.stone.set --help`, examples block
      //    and all. the poll rendered this to a human as a live grant ask.
      when(
        '[t0] REAL: an nvim split over a help snapshot, rendered as a grant',
        () => {
          const scene = useBeforeAll(async () =>
            runClassifier({
              fn: '__duct_plea_is_smeared',
              fixture:
                'route.stone.set --stone route.stone.set --stone 1.vision --as passed ' +
                '│ │ ├  driver.route.peer-budget-rewound.acceptance.test.ts.snap M ' +
                'route.stone.set --stone route.stone.set --stone 1.vision --as approved',
            }),
          );

          then('it drops the fabricated grant', () => {
            expect(scene.stdout).toContain('VERDICT=yes');
          });
        },
      );

      // 🔴 THE TOOTH, and the one that matters most. a predicate that dropped
      //    real pleas would silently blind the fleet to every human gate — a
      //    worse defect than the one it cures.
      when('[t1] a REAL single grant command, as a clone prints it', () => {
        const scene = useBeforeAll(async () =>
          runClassifier({
            fn: '__duct_plea_is_smeared',
            fixture:
              'route.stone.set --stone 5.1.execution.from_vision --as overruled',
          }),
        );

        then('it keeps a genuine plea', () => {
          expect(scene.stdout).toContain('VERDICT=no');
        });
      });

      // the second tooth: a real plea can be LONG and carry a --route, so length
      // and flag count are not what the cues key on
      when('[t2] a REAL grant that carries a --route path', () => {
        const scene = useBeforeAll(async () =>
          runClassifier({
            fn: '__duct_plea_is_smeared',
            fixture:
              'route.stone.set --stone 3.2.reflect.test.defects ' +
              '--route .route/v2026_07_28.declapract.upgrade --as approved',
          }),
        );

        then('a long real plea is still kept', () => {
          expect(scene.stdout).toContain('VERDICT=no');
        });
      });

      // cue 2 on its own — one verb, but a gutter glyph beside it. proves the
      // second net catches what the first cannot (rule.require.a-cue-is-not-a-claim)
      when('[t3] ONE verb, stitched beside a split gutter', () => {
        const scene = useBeforeAll(async () =>
          runClassifier({
            fn: '__duct_plea_is_smeared',
            fixture:
              '│ ├  some.file.ts M route.stone.set --stone 1.vision --as approved',
          }),
        );

        then('the bare vertical alone is enough to drop it', () => {
          expect(scene.stdout).toContain('VERDICT=yes');
        });
      });

      when('[t4] an empty plea', () => {
        const scene = useBeforeAll(async () =>
          runClassifier({ fn: '__duct_plea_is_smeared', fixture: '' }),
        );

        then('an absent plea is not a smear', () => {
          expect(scene.stdout).toContain('VERDICT=no');
        });
      });
    },
  );

  // 🔴 .what = a clone's context LEFT rides on its own status line and no
  //    instrument in the fleet reads it. at 1–2% a compact fires within a turn,
  //    and a clone can lose the thread of its route across it — while every
  //    render says the tree is fine.
  //
  // ⚠️ .the claim this REFUTES. the task that seeded this (#86) recorded two
  //    shapes as "the same fact":
  //      `N% until auto-compact`               — the context LEFT
  //      `new task? /clear to save NNNK tokens` — the session's cumulative COST
  //    they are NOT one fact. 763K tokens exceeds any context window, so the
  //    second reports what the session has SPENT, never what it has left — and
  //    it sits on panes that are plainly healthy (see t1). to treat it as a
  //    human gate, as that task proposed, would put a gate row on every
  //    long-lived clone: a false-positive machine on the one surface where a
  //    fabrication costs the most (#103 is that lesson, paid once already).
  //
  // ⇒ so this detector reads the EXHAUSTION shape ONLY, and t1 is the tooth
  //    that keeps the cost hint out.
  given(
    '[case23] __duct_pane_compact_percent — a clone near its context limit',
    () => {
      // 🔴 REAL, verbatim. captured 2026-09-15 off a ⭐ tree at 2%.
      when('[t0] REAL: a pane 2% from an auto-compact', () => {
        const scene = useBeforeAll(async () =>
          runClassifier({
            fn: '__duct_pane_compact_percent',
            fixture: readFileSync(
              join(
                __dirname,
                '.test/.assets/pane.husk.below-stale-scrollback.log',
              ),
              'utf8',
            ),
          }),
        );

        then('it flags the near-exhaustion', () => {
          expect(scene.stdout).toContain('VERDICT=yes');
        });

        // the NON-VACUITY assertion: the FIGURE must ride out, or the render
        // cannot say how close the compact is
        then(
          'it carries the percentage, so the render can say how close',
          () => {
            expect(scene.stdout).toMatch(/^2$/m);
          },
        );
      });

      // 🔴 THE TOOTH that parts the two shapes. this pane is HEALTHY and at work
      //    — a live ❯, 4-of-5 tasks done, `⏵⏵ accept edits on` — and it carries
      //    `new task? /clear to save 763K tokens`. a detector that fired here
      //    would flag every long-lived clone as near-exhausted.
      when(
        '[t1] REAL: a healthy at-work pane that offers /clear to save tokens',
        () => {
          const scene = useBeforeAll(async () =>
            runClassifier({
              fn: '__duct_pane_compact_percent',
              fixture: readFileSync(
                join(
                  __dirname,
                  '.test/.assets/pane.cap.date-reset-under-compaction.log',
                ),
                'utf8',
              ),
            }),
          );

          then('a COST hint is not an EXHAUSTION signal', () => {
            expect(scene.stdout).toContain('VERDICT=no');
          });
        },
      );

      when('[t2] a pane with neither shape', () => {
        const scene = useBeforeAll(async () =>
          runClassifier({
            fn: '__duct_pane_compact_percent',
            fixture: [
              '✻ Cooked for 4m 2s',
              '❯ ',
              '  🗿 5.1.execution.from_vision, yield 🌾',
            ].join('\n'),
          }),
        );

        then('a healthy pane does not flag', () => {
          expect(scene.stdout).toContain('VERDICT=no');
        });
      });

      // 🔴 the TOOTH the right-align geometry exists for: the phrase quoted MID
      //    SENTENCE in prose a clone happens to have on screen — a task body, a
      //    brief. the real status line is right-aligned, so it ends its row after
      //    a long whitespace run; quoted prose does neither.
      when('[t3] the phrase quoted mid-sentence in prose', () => {
        const scene = useBeforeAll(async () =>
          runClassifier({
            fn: '__duct_pane_compact_percent',
            fixture: [
              '  #79 records a reviewer that malfunctioned at 1% until auto-compact, on a ⭐ tree',
              '❯ ',
            ].join('\n'),
          }),
        );

        then('prose that quotes the phrase does NOT flag', () => {
          expect(scene.stdout).toContain('VERDICT=no');
        });
      });
    },
  );

  // 🔴 .what = a clone whose `arrive` SPAWN failed, while its own stone still
  //    advertises `🔍` — a peer review underway.
  //
  // .why  = the 🗿 line is a PROXY for the route's record, never for what runs
  //    (duct.poll.sh:575-578). when the background command that was meant to
  //    spawn that very review exits non-zero, the two halves disagree: the
  //    stone says a review is in flight, and the pane shows the spawn of it
  //    failed. a sweep that renders the stone alone reports the clone as
  //    BUSY-IN-REVIEW when no review runs — the phantom.
  //
  // 🔴 .the task (#75) understated itself at ONE instance. a corpus sweep on
  //    2026-09-15 found FOUR captured panes that carry both halves:
  //      pane.cap.arrive-failed-phantom-in-review.log      29 + 43
  //      pane.cap.live-future-reset-halted-midturn.log     19 + 33
  //      pane.cap.date-reset-under-compaction.log          34 + 48
  //      pane.husk.resume-marker-called-unreadable.log   6-25 + 39
  //    three cap panes and one husk — so the shape is not a cap artifact.
  //
  // ⚠️ .the KNOWN BOUND, stated rather than papered over: this corpus holds no
  //    capture of a SUCCEEDED background command, so its render shape is
  //    unknown and the detector cannot prove "no arrive ever landed." it
  //    proves "an arrive FAILED in this pane." that is why the cure ANNOTATES
  //    the stone rather than replaces it, and why the row says `verify` rather
  //    than asserts the review is absent. bias to DETECT: a false detect costs
  //    one read; a miss costs a sponsored clone hours of phantom-busy.
  given(
    '[case24] __duct_pane_arrive_failed — a spawn that failed under a 🔍 stone',
    () => {
      // 🔴 REAL, verbatim. the fixture #75 was captured from.
      when(
        '[t0] REAL: `Arrive 5.3.verification to spawn peer review` failed, stone reads 🔍',
        () => {
          const scene = useBeforeAll(async () =>
            runClassifier({
              fn: '__duct_pane_arrive_failed',
              fixture: readFileSync(
                join(
                  __dirname,
                  '.test/.assets/pane.cap.arrive-failed-phantom-in-review.log',
                ),
                'utf8',
              ),
            }),
          );

          then('it flags the failed spawn', () => {
            expect(scene.stdout).toContain('VERDICT=yes');
          });

          // the NON-VACUITY assertion: the matched line must ride out, or the
          // render cannot name WHICH arrive failed
          then(
            'it carries the failed command, so the render can name it',
            () => {
              expect(scene.stdout).toContain(
                'Arrive 5.3.verification to spawn peer review',
              );
            },
          );
        },
      );

      // 🔴 REAL, verbatim. the SECOND shape — `Re-arrive`, six of them stacked.
      //    it proves the discriminator is not keyed to the word `Arrive` alone.
      when('[t1] REAL: six stacked `Re-arrive iNNN` failures', () => {
        const scene = useBeforeAll(async () =>
          runClassifier({
            fn: '__duct_pane_arrive_failed',
            fixture: readFileSync(
              join(
                __dirname,
                '.test/.assets/pane.husk.resume-marker-called-unreadable.log',
              ),
              'utf8',
            ),
          }),
        );

        then('a `Re-arrive` failure flags too', () => {
          expect(scene.stdout).toContain('VERDICT=yes');
        });

        then('it carries the LAST failure, never the first', () => {
          expect(scene.stdout).toContain('Re-arrive i028');
        });
      });

      // 🔴 THE TOOTH that parts this from "every 🔍 stone". this pane carries a
      //    `🗿 5.3.verification, review.peer, l3@i007 🔍` and 51 attempts of real
      //    route work — and NO failed arrive. a detector that fired here would
      //    annotate every clone in review.
      when('[t2] REAL: a 🔍 stone with no failed arrive', () => {
        const scene = useBeforeAll(async () =>
          runClassifier({
            fn: '__duct_pane_arrive_failed',
            fixture: readFileSync(
              join(
                __dirname,
                '.test/.assets/pane.escalation.stuck-after-51-attempts-please-tell-a-human.log',
              ),
              'utf8',
            ),
          }),
        );

        then('a live review is not a phantom', () => {
          expect(scene.stdout).toContain('VERDICT=no');
        });
      });

      // a second real 🔍 pane, from a different failure family (revive), so the
      // tooth does not rest on one capture
      when('[t3] REAL: a revived pane mid-review', () => {
        const scene = useBeforeAll(async () =>
          runClassifier({
            fn: '__duct_pane_arrive_failed',
            fixture: readFileSync(
              join(
                __dirname,
                '.test/.assets/pane.revive.no-accept-edits-mode.log',
              ),
              'utf8',
            ),
          }),
        );

        then('it does not flag', () => {
          expect(scene.stdout).toContain('VERDICT=no');
        });
      });

      // 🔴 THE SECOND TOOTH: a background command that failed and is NOT an
      //    arrive. the harm class is specific — a spawn whose absence makes the
      //    stone lie — so a failed test run must not wear the same row.
      when('[t4] a failed background command that is not an arrive', () => {
        const scene = useBeforeAll(async () =>
          runClassifier({
            fn: '__duct_pane_arrive_failed',
            fixture: [
              '● Background command "npm run test:unit" failed with exit code 1',
              '❯ ',
              '  🗿 5.3.verification, review.peer, l1@i004 🔍',
            ].join('\n'),
          }),
        );

        then('a failed test run is not a phantom review', () => {
          expect(scene.stdout).toContain('VERDICT=no');
        });
      });
    },
  );

  // 🔴 .what = the spinner's TENSE — did the clone's last turn END, or does it
  //    still run?
  //
  // .why  = `😶 inflight` is an assertion that the clone is mid-turn, and until
  //    now not one signal in the sweep could check it. the only motion tell was
  //    the duct-changed diff, which needs a SECOND poll and only speaks after
  //    90–150 minutes of stillness. so a clone whose turn ended six minutes ago
  //    reads exactly like one that is working.
  //
  //    measured 2026-09-16 on `rhachet-roles-bhrain.beav.feat-dispute-or-
  //    concede-review-budget`: the mechanic ended its turn with a question to
  //    the human (`⭐ can you confirm: did the billing restore apply to the
  //    account behind the test-env Fireworks key…`), the human's answer sat in
  //    the box, and the tick rendered `😶 inflight`. the human read the pane and
  //    asked outright: *"this one is halted. how can you get your crew.poll to
  //    detect this"*. the answer was on the pane the whole time, one row above
  //    the box.
  //
  // 🔴 .the discriminator is the SHAPE, never the GLYPH. claude cycles
  //    `✻ ✽ ✢ · ∗ ⋆` through BOTH states, so a glyph test tells them apart not
  //    at all — [t1] is that tooth, and it carries a `✻` while genuinely live.
  //
  //      LIVE   `✽ Frolicking… (2m 43s · ↑2.8k)`   gerund · `…` · a live counter
  //      ENDED  `✻ Brewed for 6m 15s`              participle · ` for ` · static
  //
  // .the fixtures are VERBATIM captures read from disk, escapes intact — the
  //    halt capture interleaves an SGR run between EVERY word
  //    (`…m✻…m Brewed…m for…m 6m…m 15s`), so a detector that did not fold them
  //    would match the live fleet not at all
  //    (rule.always.clamp-the-verbatim-pane-your-classifier-judged).
  given(
    '[case25] __duct_pane_turn_ended — the spinner tense parts a live turn from a halt',
    () => {
      // 🔴 REAL, verbatim. the capture the human pointed at.
      when('[t0] REAL: the turn ended with a question to the human', () => {
        const scene = useBeforeAll(async () =>
          runClassifier({
            fn: '__duct_pane_turn_ended',
            fixture: readFileSync(
              join(
                __dirname,
                '.test/.assets/pane.halt.turn-ended-with-a-question-to-the-human.log',
              ),
              'utf8',
            ),
          }),
        );

        then('it reads the turn as ENDED', () => {
          expect(scene.stdout).toContain('VERDICT=yes');
        });

        // the NON-VACUITY assertion: the clause must ride out, or a render cannot
        // say HOW LONG the turn has been over — which is the whole actionable half
        then('it carries the clause, so a render can say how long ago', () => {
          expect(scene.stdout).toContain('Brewed for 6m 15s');
        });
      });

      // 🔴 THE TOOTH, and the one that refutes the obvious implementation. this
      //    pane carries `✻ Tinkering… (27m 50s · ↓ 26.4k tokens)` — the SAME glyph
      //    as every ended turn above, on a turn that is genuinely running. a
      //    glyph-keyed detector flags it, and the fleet's whole at-work set then
      //    renders halted.
      when('[t1] REAL: a LIVE turn, under the very same ✻ glyph', () => {
        const scene = useBeforeAll(async () =>
          runClassifier({
            fn: '__duct_pane_turn_ended',
            fixture: readFileSync(
              join(
                __dirname,
                '.test/.assets/pane.husk.below-stale-scrollback.log',
              ),
              'utf8',
            ),
          }),
        );

        then('a gerund with a live counter is NOT an ended turn', () => {
          expect(scene.stdout).toContain('VERDICT=no');
        });
      });

      // 🔴 THE SECOND TOOTH: a THIRD shape rides the same glyph — claude's own
      //    system notice. it is neither a live turn nor an ended one, and a
      //    detector loose enough to claim it would mint a halt on every clone
      //    that ever auto-compacted.
      when('[t2] a system notice under the same glyph', () => {
        const scene = useBeforeAll(async () =>
          runClassifier({
            fn: '__duct_pane_turn_ended',
            fixture: [
              '✻ Conversation compacted (ctrl+o for history)',
              '❯ ',
            ].join('\n'),
          }),
        );

        then('a compaction notice is not a turn verdict at all', () => {
          expect(scene.stdout).toContain('VERDICT=no');
        });
      });

      // 🔴 REAL, verbatim, and it carries BOTH shapes in one pane: the compaction
      //    notice at the top, a genuinely ended turn far below it. the LAST
      //    spinner is the current one, so a first-match detector reads this pane
      //    backwards.
      when(
        '[t3] REAL: a notice ABOVE an ended turn — the last spinner wins',
        () => {
          const scene = useBeforeAll(async () =>
            runClassifier({
              fn: '__duct_pane_turn_ended',
              fixture: readFileSync(
                join(
                  __dirname,
                  '.test/.assets/pane.cap.arrive-failed-phantom-in-review.log',
                ),
                'utf8',
              ),
            }),
          );

          then('it reads the turn as ENDED', () => {
            expect(scene.stdout).toContain('VERDICT=yes');
          });

          then('it carries the LAST clause, never the notice above it', () => {
            expect(scene.stdout).toContain('Worked for 1h 36m 16s');
          });
        },
      );

      // a pane with no spinner at all — a plain shell duct. the detector must
      // stay silent rather than guess, or every foreman seat reads halted.
      when('[t4] a pane with no spinner at all', () => {
        const scene = useBeforeAll(async () =>
          runClassifier({
            fn: '__duct_pane_turn_ended',
            fixture: ['bert@grove svc-reservations.beav.feat-x %', ''].join(
              '\n',
            ),
          }),
        );

        then('an absent spinner is an absent verdict', () => {
          expect(scene.stdout).toContain('VERDICT=no');
        });
      });

      // 🔴 REAL, verbatim. the pane behind a fell fence that has held a MERGED,
      //    route-complete tree across three consecutive ticks
      //    (.dream/v2026_09_18.fix.the-fell-fence-holds-a-route-complete-tree-across-every-tick.md).
      //
      //    `__crew_clones_idle` fences unless every live clone files a
      //    `TURN ENDED SEEN` entry, and that entry is filed off THIS detector. so
      //    a settle-read is emitted on every tick of a tree whose pane answers
      //    cleanly — an ended turn, an empty box, a route-complete stone.
      //
      // 🟡 the duration is the MINUTES form, `5m 21s`, where every other asset in
      //    this case carries a form the detector was authored against. the regex
      //    tail `[0-9][^(…]*` accepts it on a read, so the duration is refuted as
      //    the cause BEFORE this clamp runs — which is exactly why the clamp is
      //    owed: a hypothesis refuted by eye is not a fact until a fixture says
      //    so, and the fence stands between EVERY future merged tree and its
      //    fell, so the cost of a gap here is paid on every closeout.
      when(
        '[t5] REAL: the route-complete pane a fell fence has held for 3 ticks',
        () => {
          const scene = useBeforeAll(async () =>
            runClassifier({
              fn: '__duct_pane_turn_ended',
              fixture: readFileSync(
                join(
                  __dirname,
                  '.test/.assets/pane.turnended.route-complete-tree-stays-fenced.log',
                ),
                'utf8',
              ),
            }),
          );

          then('it reads the turn as ENDED', () => {
            expect(scene.stdout).toContain('VERDICT=yes');
          });

          then('the minutes-form duration rides out in the clause', () => {
            expect(scene.stdout).toContain('Cogitated for 5m 21s');
          });
        },
      );
    },
  );

  // 🔴 [case55] __duct_pane_turn_live — the STILL term a cap verdict needs
  //
  // .what = does this pane hold a turn that RUNS right now?
  //
  // 🔴 .why it is not [case25] inverted, and why a separate detector is owed
  //    `turn_ended` absent has THREE causes — a live turn, a husk whose
  //    spinner died with its process, and a pane that never drew one. so a
  //    consumer that read the absence as "mid-work" would claim a fact from
  //    a silence (term=partial-audit). this ASSERTS the frame instead.
  //
  // 🔴 .the production defect it closes, measured 2026-09-18
  //    duct.poll's cap row states its own join contract verbatim —
  //    `(scrollback; join to reset-vs-now + still to judge)`. git.crew.poll
  //    joined reset-vs-now and a live BOX, and never the STILL term. so two
  //    clones that were mid-turn, with a cap banner far up in scrollback,
  //    both rendered `🚫 limited — ⏰ reset PASSED — healable, nudge to
  //    retry` — and heal, on the same tree in the same tick, answered "this
  //    clock has NOT passed". two instruments, one pane, opposite verdicts.
  //
  // ⚠️ the fixtures are VERBATIM `--raw` captures of those two panes, escapes
  //    intact (rule.always.clamp-the-verbatim-pane-your-classifier-judged).
  //    a hand-typed frame is a model of the pane, and the model is the
  //    suspect.
  given(
    '[case55] __duct_pane_turn_live — the token frame parts mid-work from idle',
    () => {
      // 🔴 THE defect pane: a cap banner in scrollback AND a live turn, at once.
      //    this is the exact shape the cap arm graded `limited` and nudged.
      when('[t0] REAL: a scrollback cap banner under a LIVE turn', () => {
        const scene = useBeforeAll(async () =>
          runClassifier({
            fn: '__duct_pane_turn_live',
            fixture: readFileSync(
              join(
                __dirname,
                '.test/.assets/pane.cap.scrollback-cap-under-a-live-turn.log',
              ),
              'utf8',
            ),
          }),
        );

        then('🔴 it reads the turn as LIVE', () => {
          expect(scene.stdout).toContain('VERDICT=yes');
        });

        then('the token frame rides out in the clause', () => {
          expect(scene.stdout).toContain('↓ 96 tokens');
        });

        // ⚠️ the ANTI-VACUITY tooth: this same pane really does carry the cap
        //    banner, so a verdict of `yes` here is a genuine conflict with the
        //    cap arm and not a fixture that quietly lost its cap line.
        then('⚠️ and the pane genuinely still carries the cap banner', () => {
          const raw = readFileSync(
            join(
              __dirname,
              '.test/.assets/pane.cap.scrollback-cap-under-a-live-turn.log',
            ),
            'utf8',
          );
          expect(raw).toContain("You've hit your limit");
        });
      });

      // a SECOND live pane, different spinner glyph and a bare-minutes elapsed,
      // so the clamp is not shaped around one capture's accidents.
      when(
        '[t1] REAL: a second live turn, under an undrained tool call',
        () => {
          const scene = useBeforeAll(async () =>
            runClassifier({
              fn: '__duct_pane_turn_live',
              fixture: readFileSync(
                join(
                  __dirname,
                  '.test/.assets/pane.turn.live-under-an-undrained-tool-call.log',
                ),
                'utf8',
              ),
            }),
          );

          then('it reads the turn as LIVE', () => {
            expect(scene.stdout).toContain('VERDICT=yes');
          });

          then(
            'it takes the NEWEST frame, not an older one in scrollback',
            () => {
              expect(scene.stdout).toContain('↓ 406 tokens');
            },
          );
        },
      );

      // 🔴 THE counter-tooth, and the one that carries the case. an ENDED turn
      //    draws a duration in the identical `<n>m <n>s` shape, so a detector
      //    anchored on the duration would fire here and grade every halted
      //    clone mid-work — which inverts the very defect this case closes.
      when('[t2] REAL: a pane whose last turn has ENDED', () => {
        const scene = useBeforeAll(async () =>
          runClassifier({
            fn: '__duct_pane_turn_live',
            fixture: readFileSync(
              join(
                __dirname,
                '.test/.assets/pane.turnended.route-complete-tree-stays-fenced.log',
              ),
              'utf8',
            ),
          }),
        );

        then('🔴 it does NOT read a live turn', () => {
          expect(scene.stdout).toContain('VERDICT=no');
        });

        // the anti-vacuity half: that pane really does carry a `5m 21s`, so the
        // `no` above is the token anchor at work rather than an absent duration.
        then('⚠️ even though the pane carries a minutes-form duration', () => {
          const raw = readFileSync(
            join(
              __dirname,
              '.test/.assets/pane.turnended.route-complete-tree-stays-fenced.log',
            ),
            'utf8',
          );
          expect(raw).toContain('5m 21s');
        });
      });
    },
  );

  // 🔴 .what = a QUEUED message — a human's line, submitted, parked above the
  //    input box and NOT yet consumed.
  //
  // 🔴 .why  = the extant box ladder keys `queued` on claude's footer hint,
  //    `to edit queued messages`. claude prints that hint only WHILE A TURN
  //    RUNS. once the turn ends the hint goes and the queued row stays — so the
  //    detector goes blind at the exact moment the queue stops to drain, which
  //    is the only moment the fact is actionable.
  //
  //    measured 2026-09-16 on `feat-dispute-or-concede-review-budget`, a ⭐
  //    tree. its mechanic asked the human a ⭐ question; the human answered
  //    `fireworks is back now`; the turn had ended. the message sat undrained
  //    across TWO full babysit ticks, and every poll in between classified that
  //    box `empty` and rendered no queued row at all. a human's answer, lost in
  //    plain sight.
  //
  // 🔴 .the discriminator is the BACKGROUND, never the caret. claude draws a
  //    queued row with a background SGR (`ESC[48;5;237m`) before its `❯`; the
  //    input box's own caret, an autocomplete ghost, and a modal's selected
  //    option each carry a FOREGROUND colour and no background at all.
  //
  // .and it is a FACT, never a box verdict — it rides beside the box so the
  //    stone still renders (the `TURN ENDED SEEN` pattern, and the survey
  //    dream's whole argument).
  given(
    '[case30] __duct_pane_queued_row — a submitted message parked above the box',
    () => {
      // 🔴 REAL, verbatim. the capture from the tick that found this.
      when('[t0] REAL: a human answer queued under an ENDED turn', () => {
        const scene = useBeforeAll(async () =>
          runClassifier({
            fn: '__duct_pane_queued_row',
            fixture: readFileSync(
              join(
                __dirname,
                '.test/.assets/pane.queued.undrained-after-the-turn-ended.log',
              ),
              'utf8',
            ),
          }),
        );

        then('it reads a queued message', () => {
          expect(scene.stdout).toContain('VERDICT=yes');
        });

        // the NON-VACUITY assertion: the text must ride out, or a render can say
        // that input waits and never say WHAT — which is the actionable half
        then(
          'it carries the message text, so a render can name what waits',
          () => {
            expect(scene.stdout).toContain('fireworks is back now');
          },
        );
      });

      // 🔴 THE TOOTH. this pane's footer hint is GONE (the turn ended), so the
      //    extant `to edit queued messages` arm reads it as an ordinary empty
      //    box. a detector that merely re-used that phrase goes red here.
      when(
        '[t1] the footer hint is absent — the row alone must carry the verdict',
        () => {
          const scene = useBeforeAll(async () =>
            runClassifier({
              fn: '__duct_pane_queued_row',
              fixture: readFileSync(
                join(
                  __dirname,
                  '.test/.assets/pane.queued.undrained-after-the-turn-ended.log',
                ),
                'utf8',
              ),
            }),
          );

          then(
            'the fixture genuinely lacks the hint the old arm keys on',
            () => {
              expect(
                readFileSync(
                  join(
                    __dirname,
                    '.test/.assets/pane.queued.undrained-after-the-turn-ended.log',
                  ),
                  'utf8',
                ).includes('to edit queued messages'),
              ).toEqual(false);
            },
          );

          then('and the verdict still lands', () => {
            expect(scene.stdout).toContain('VERDICT=yes');
          });
        },
      );

      // 🔴 THE SECOND TOOTH: an ordinary EMPTY input box. its caret carries a
      //    foreground SGR and no background, so a detector keyed on the caret
      //    alone would mint a queued message on every idle duct in the fleet.
      when('[t2] an ordinary empty input box', () => {
        const scene = useBeforeAll(async () =>
          runClassifier({
            fn: '__duct_pane_queued_row',
            fixture: [
              '\u001b[38;5;244m────────\u001b[39m',
              '\u001b[39m❯ ',
              '\u001b[38;5;244m────────',
            ].join('\n'),
          }),
        );

        then('a bare caret is not a queued message', () => {
          expect(scene.stdout).toContain('VERDICT=no');
        });
      });

      // 🔴 THE THIRD TOOTH: an autocomplete GHOST. dim FOREGROUND, real text, no
      //    background — the shape closest to a queued row, and the one whose
      //    misread is a recorded harm (an Enter there fabricates a message).
      when(
        '[t3] REAL: an autocomplete ghost carries text but no background',
        () => {
          const scene = useBeforeAll(async () =>
            runClassifier({
              fn: '__duct_pane_queued_row',
              fixture: readFileSync(
                join(
                  __dirname,
                  '.test/.assets/pane.turnended.ghost-box-renders-as-inflight.log',
                ),
                'utf8',
              ),
            }),
          );

          then('a ghost is NOT a queued message', () => {
            expect(scene.stdout).toContain('VERDICT=no');
          });
        },
      );

      // a background SGR with an EMPTY payload — chrome, never a message. the
      // text requirement is the free second cue (rule.require.a-cue-is-not-a-claim).
      when('[t4] a background-highlighted caret with no text after it', () => {
        const scene = useBeforeAll(async () =>
          runClassifier({
            fn: '__duct_pane_queued_row',
            fixture: ['\u001b[48;5;237m❯ \u001b[39m', ''].join('\n'),
          }),
        );

        then('chrome with no payload is no message', () => {
          expect(scene.stdout).toContain('VERDICT=no');
        });
      });

      // 🔴 THE SHARPEST TOOTH, and the one that was absent when this detector
      //    first shipped GREEN. every case above tests a pane where the highlight
      //    means what the detector assumed. this tests the pane where it does not.
      when(
        '[t5] REAL: five highlighted rows, every one of them already answered',
        () => {
          const scene = useBeforeAll(async () =>
            runClassifier({
              fn: '__duct_pane_queued_row',
              fixture: readFileSync(
                join(
                  __dirname,
                  '.test/.assets/pane.queued.consumed-highlight-persists.log',
                ),
                'utf8',
              ),
            }),
          );

          then(
            'a CONSUMED row is not a parked queue — the pane is healthy',
            () => {
              // 🔴 .teeth = the background highlight is how claude renders a HUMAN
              //    TURN, and it persists for every past turn for the life of the
              //    pane. this capture holds five of them, and the clone answered all
              //    five.
              //
              //    against the pre-cure detector this fixture returns VERDICT=yes,
              //    and that is not a near miss: it is the verdict that made heal
              //    relay a duplicate message to a clone which had already replied to
              //    it. and since almost every pane carries a past human turn, the
              //    false positive was the COMMON case, not the edge — the render
              //    would have called most of the fleet frozen and the babysit cron
              //    would have re-relayed on every tick, forever.
              expect(scene.stdout).toContain('VERDICT=no');
            },
          );
        },
      );

      when(
        '[t6] the discriminator is what FOLLOWS the row, not the row itself',
        () => {
          // the same row, in two contexts. it is byte-identical in both, so any
          // test that could pass both is keyed on the wrong half of the pane.
          const row =
            '\u001b[38;5;239m\u001b[48;5;237m❯ \u001b[38;5;231mfireworks is back now\u001b[39m';

          const parked = useBeforeAll(async () =>
            runClassifier({
              fn: '__duct_pane_queued_row',
              fixture: [row, '', '───────────', '❯ ', '───────────'].join('\n'),
            }),
          );
          const consumed = useBeforeAll(async () =>
            runClassifier({
              fn: '__duct_pane_queued_row',
              fixture: [
                row,
                '',
                '\u001b[38;5;231m●\u001b[39m on it.',
                '───────────',
                '❯ ',
              ].join('\n'),
            }),
          );

          then('with only box chrome beneath it, the row is PARKED', () => {
            expect(parked.stdout).toContain('VERDICT=yes');
          });

          then(
            'with an assistant bullet beneath it, the same row is CONSUMED',
            () => {
              expect(consumed.stdout).toContain('VERDICT=no');
            },
          );
        },
      );
    },
  );

  // 🔴 .what = the NON-RAW render must never print an autocomplete GHOST as
  //    though a human typed it.
  //
  // .why  = the non-raw path captured with `capture-pane -p` and NO `-e`, so the
  //    dim/white distinction was destroyed AT CAPTURE and no downstream filter
  //    could recover it. a shell-history ghost then rendered identically to a
  //    composed message.
  //
  // 🔴 .the cost is unique in this corpus. every other tool defect spends time;
  //    this one spends the HUMAN'S AUTHORITY. measured 2026-09-15 on two ⭐
  //    trees in one tick, and in BOTH the ghost reconstructed the human-only
  //    grant that tree was pleading for — because that is what sat in the
  //    shell's history. so the render invited two distinct fabrications:
  //      1. report a grant the human never gave
  //      2. submit it with `--keys Enter` — laundering it into the clone
  //         (rule.forbid.self-grant-human-gates)
  //
  // ⚠️ .the arithmetic that makes it invisible: reverse-video `o` + ghost
  //    `verrule it` concatenate, escape-free, to `overrule it`. a whole word
  //    from ONE keystroke, and no glyph in the plain render marks the seam.
  //
  // .the fixtures are VERBATIM `git.crew.read --raw` captures, read from disk by
  //    path so the raw ESC bytes survive into the assertion unaltered — a
  //    hand-typed pane is a pane that never existed
  //    (rule.always.clamp-the-verbatim-pane-your-classifier-judged).
  //
  // .the scope is the INPUT BOX LINE ONLY, keyed on the paved discriminator from
  //    duct.poll.sh:354-358 — the `❯` whose NEXT line carries a `───` rule
  //    (rule.always.reuse-pavement-before-improvise). claude paints dim chrome
  //    all over a pane; a filter that fenced every dim run would rewrite every
  //    render in the fleet. t3 is that bound, with teeth.
  given(
    '[case20] __duct_mark_pane_ghosts — a ghost must never read as typed',
    () => {
      const runFilter = (input: { body: string }): { stdout: string } =>
        runDuct({
          socket: genSocket('ghost'),
          ductworkDir: tempDirs.genOne({ slug: 'registry' }),
          body: [
            `printf 'DECLARED[%s]\\n' "$(declare -F __duct_mark_pane_ghosts >/dev/null 2>&1 && printf yes || printf no)"`,
            input.body,
          ].join('\n'),
        });

      const asset = (slug: string): string =>
        join(__dirname, `.test/.assets/${slug}`);

      // 🔴 REAL, VERBATIM — rhachet-roles-bhrain.beav.feat-prescribed-brain-per-stone.
      //    held this exact state for THREE consecutive babysit ticks.
      when(
        '[t0] REAL: one real char `o` + a ghost that completes to `overrule it`',
        () => {
          const scene = useBeforeAll(async () =>
            runFilter({
              body: `__duct_mark_pane_ghosts < '${asset('pane.box.one-real-char-plus-ghost-grant.prescribed-brain.log')}' || true`,
            }),
          );
          then(
            'the filter is DECLARED (an absent fn would vacuously satisfy the rest)',
            () => {
              expect(scene.stdout).toContain('DECLARED[yes]');
            },
          );
          then('it fences the ghost so it cannot read as typed', () => {
            expect(scene.stdout).toContain('👻');
            expect(scene.stdout).toContain('ghost: verrule it');
          });
          // 🔴 THE POINT. the un-fixed render printed exactly this, and it is a
          //    sentence no human ever typed.
          then('it never emits the fabricated whole word `overrule it`', () => {
            expect(scene.stdout).not.toContain('❯ overrule it');
          });
          // ⚠️ anchored on the SEAM (`o` then the fence), never on `❯ o` — claude
          //    writes a NON-BREAKING space after the caret, so a literal `❯ o` with
          //    an ordinary space never matches. that is the byte duct.poll.sh:366
          //    already folds, and it cost this assertion one red round. the seam is
          //    also the stronger claim: it proves the real keystroke survived AND
          //    that it sits OUTSIDE the fence.
          then(
            'it keeps the ONE real keystroke, unfenced and before the fence',
            () => {
              expect(scene.stdout).toContain('o👻[ghost:');
            },
          );
          // a tool must GUIDE, not merely classify. the marker says WHAT the text
          // is; this says what to DO about it — the one act that would do harm.
          then('it guides: names the state and forbids the submit', () => {
            expect(scene.stdout).toContain('the box holds a GHOST');
            expect(scene.stdout).toContain('do NOT submit it');
          });
        },
      );

      // 🔴 REAL, VERBATIM — svc-reservations.beav.feat-rec-waitlist-capture.
      //    the ghost here is a complete human-only grant command.
      when(
        '[t1] REAL: one real char `r` + a ghost that completes to a grant command',
        () => {
          const scene = useBeforeAll(async () =>
            runFilter({
              body: `__duct_mark_pane_ghosts < '${asset('pane.box.one-real-char-plus-ghost-grant.rec-marketplace.log')}' || true`,
            }),
          );
          then('it fences the whole grant command as a ghost', () => {
            expect(scene.stdout).toContain(
              'ghost: hx route.stone.set --stone 5.3.verification --as overruled',
            );
          });
          then('it never emits the grant as a runnable-looking line', () => {
            expect(scene.stdout).not.toContain(
              '❯ rhx route.stone.set --stone 5.3.verification --as overruled',
            );
          });
        },
      );

      // 🔴 THE TOOTH. a filter that fenced the whole box line would satisfy t0 and
      //    t1 and be worthless — it would flag every genuinely typed message as a
      //    ghost, and a supervisor would stop believing the marker. a PREFILLED
      //    message is the one thing the babysit contract says TO submit, so a
      //    false fence here costs a real human message its Enter.
      when('[t2] TOOTH: genuinely typed box text carries no dim run', () => {
        const scene = useBeforeAll(async () =>
          runFilter({
            body: [
              "__duct_mark_pane_ghosts <<'BOXEOF' || true",
              '\u001b[39m❯ \u001b[7mo\u001b[0mverrule it\u001b[0m',
              '\u001b[37m────────────────────────────',
              'BOXEOF',
            ].join('\n'),
          }),
        );
        then('it passes the typed text through, unfenced', () => {
          expect(scene.stdout).toContain('❯ overrule it');
        });
        then('it marks no ghost at all', () => {
          expect(scene.stdout).not.toContain('👻');
        });
      });

      // 🔴 THE SECOND TOOTH, and the one that bounds the blast radius. claude
      //    paints dim runs across a whole pane — diff context, `(ctrl+o to
      //    expand)`, status chrome. a filter that keyed on dimness ALONE would
      //    fence all of it and rewrite every non-raw render in the fleet. only a
      //    `❯` whose next line carries a `───` rule is an input box.
      when('[t3] TOOTH: a dim run on a line that is NOT the input box', () => {
        const scene = useBeforeAll(async () =>
          runFilter({
            body: [
              "__duct_mark_pane_ghosts <<'DIMEOF' || true",
              '\u001b[2m  ⎿  dim transcript chrome (ctrl+o to expand)\u001b[0m',
              'a following line that carries no rule',
              'DIMEOF',
            ].join('\n'),
          }),
        );
        then('it leaves the chrome alone', () => {
          expect(scene.stdout).toContain(
            '⎿  dim transcript chrome (ctrl+o to expand)',
          );
        });
        then('it marks no ghost off the box line', () => {
          expect(scene.stdout).not.toContain('👻');
        });
      });

      /**
       * 🔴 THE THIRD TOOTH — the one dim run on the box line that is NOT a
       *    completion: claude's own `Press up to edit queued messages` hint.
       *
       *    measured 2026-09-17 on feat-peer-review-parallelism/mechanic. a
       *    supervisor's steer was QUEUED against a live turn, claude printed the
       *    hint beneath it, and this filter fenced the hint and declared
       *    `no one composed it`. both halves false — the supervisor composed the
       *    message, and claude wrote the hint.
       *
       * ⚠️ the harm is an INVERTED state, not a cosmetic mislabel. `👻 ghost` and
       *    `📬 queued` prescribe the same act (do not press Enter), so the render
       *    reads plausible — and they report opposite worlds. a ghost says NO
       *    message awaits delivery; queued says one does. a supervisor who trusts
       *    the ghost concludes its steer never landed, and sends it twice into a
       *    live clone.
       *
       * ⇒ the eleventh instance of `rule.require.enumerate-before-you-name`: the
       *   ghost arm enumerates DIM TEXT ON THE BOX LINE, and claude's own hint
       *   carries that property exactly.
       *
       * .note = a heredoc, as [t2] and [t3] are, and for the same reason — the
       *   property under test is STRUCTURAL (a dim run that carries a declared
       *   literal). the live queue drained before it could be captured raw, so a
       *   verbatim asset was not available; the SGR shape here follows the
       *   contract the filter's own header declares.
       */
      when('[t4] TOOTH: claude`s queued-messages hint is dim CHROME', () => {
        const scene = useBeforeAll(async () =>
          runFilter({
            body: [
              "__duct_mark_pane_ghosts <<'QUEUEEOF' || true",
              '\u001b[39m❯ \u001b[2mPress up to edit queued messages\u001b[0m',
              '\u001b[37m────────────────────────────',
              'QUEUEEOF',
            ].join('\n'),
          }),
        );
        then('it leaves the hint unfenced', () => {
          expect(scene.stdout).toContain('❯ Press up to edit queued messages');
        });
        then('it marks no ghost', () => {
          expect(scene.stdout).not.toContain('👻');
        });
        // 🔴 the sharpest assertion. the alert is what a supervisor ACTS on, and
        //    its words are what make the state read as the opposite one.
        then('it prints no GHOST alert, whose words are false here', () => {
          expect(scene.stdout).not.toContain('the box holds a GHOST');
          expect(scene.stdout).not.toContain('no one composed it');
        });
        // 🔴 the exemption reuses the discriminator this file ALREADY declared
        //    for its `queued` arm. a second, private literal would drift from it
        //    (`rule.always.reuse-pavement-before-improvise`).
        then(
          'the exemption keys on the literal the queued arm already keys on',
          () => {
            const src = readDuctwork();
            // 🔴 the GUARD verbatim, never a bare `includes` of the literal. two
            //    comments in this file carry the literal too, so `includes` alone
            //    stayed GREEN under the revert while all three behavioral
            //    assertions went red — a clamp with no teeth on the one line that
            //    does the work.
            expect(
              src.includes(
                'if (index(text, "to edit queued messages") > 0) return text',
              ),
            ).toEqual(true);
            // ⇒ that the box ladder's `queued` arm keys on the SAME literal is
            //   already clamped in work.surface (`*'to edit queued messages'*` →
            //   box="queued"). cited, never restated here.
          },
        );
      });

      // 🔴 THE COUNTER-TOOTH. the exemption must not become a hole a real ghost
      //    fits through. a shell-history completion that merely MENTIONS the
      //    phrase is still a ghost, and the exemption is scoped to the dim run
      //    that carries it — so any OTHER dim run on the box line still fences.
      when('[t5] TOOTH: a real ghost beside the hint still fences', () => {
        const scene = useBeforeAll(async () =>
          runFilter({
            body: [
              "__duct_mark_pane_ghosts <<'BOTHEOF' || true",
              '\u001b[39m❯ \u001b[2mrhx route.stone.set --as approved\u001b[0m\u001b[39m \u001b[2mto edit queued messages\u001b[0m',
              '\u001b[37m────────────────────────────',
              'BOTHEOF',
            ].join('\n'),
          }),
        );
        then('the grant completion is still fenced', () => {
          expect(scene.stdout).toContain(
            'ghost: rhx route.stone.set --as approved',
          );
        });
        then('it still alerts, because a real ghost was found', () => {
          expect(scene.stdout).toContain('the box holds a GHOST');
        });
      });
    },
  );

  // .what = a clone that CRASHED leaves no resume banner, so arms 1 and 2 both
  //         miss it — and the pane keeps every scrap of chrome it drew alive
  //
  // 🔴 .measured 2026-09-18 — sdk-aws-lambda.beav.feat-input-only-validation-and
  //    -hydration. a V8 heap OOM killed claude after a 4d14h run (exit 134,
  //    SIGABRT). the pane still held a spinner frame, a ❯ box, and a route
  //    statusline, so `crew.poll` read `😶 at work`, `--healable --all` named
  //    the tree NOT AT ALL, and a HUMAN found it by eye four days in.
  //
  // ⚠️ .the anchor is the shell's EXIT BADGE, never the crash dump. the class is
  //    every abnormal return, and only the badge survives a cause that prints no
  //    dump at all — a kernel SIGKILL (137) and a SIGTERM (143) both leave the
  //    pane bare of any V8 text (rule.require.enumerate-before-you-name).
  // 🔴 .measured 2026-09-18 — rhachet-roles-bhrain.beav.feat-acceptance-under
  //    -5min @ bert/feat-goal-init. a modal was REFUSED, the turn stopped on
  //    the rejection, and the clone sat above an empty box. every instrument
  //    called it healthy: `😶 at work` / `inflight` in the poll, "absent any
  //    move to make" from heal, and `--healable` named it NOT AT ALL. a human
  //    found it by eye and asked "why is it still frozen?"
  //
  //    🔴 the cause is structural, never a threshold too loose: claude prints
  //      its `✻ Cogitated for 12s` epilogue when a turn COMPLETES, and prints
  //      no epilogue at all after a decline. so __duct_pane_turn_ended — the
  //      fleet's one witness to a stopped turn — is blind to the one halt
  //      that parks a clone most reliably.
  given('[case-decline-park] a turn that STOPPED on a declined modal', () => {
    const asset = (slug: string): string =>
      join(__dirname, `.test/.assets/${slug}`);
    const SLUG = 'pane.park.turn-ended-on-a-declined-edit.log';

    const flat = (): string =>
      readFileSync(asset(SLUG), 'utf8')
        // ANSI strip — see the biome-ignore-all at the head of this file
        .replace(/\u001b\[[0-9;]*m/g, '')
        .replace(/\u00a0/g, ' ');

    when('[t0] the fixture is read', () => {
      then('it holds the REFUSAL — the anchor this detector keys on', () => {
        expect(flat()).toContain('User rejected update to');
      });

      then(
        '🔴 and NO turn-end epilogue — so the extant witness provably cannot fire',
        () => {
          // the precondition IS the case. with an epilogue present this fixture
          // would pass on __duct_pane_turn_ended's merits and clamp naught
          expect(flat()).not.toMatch(
            /(✻|✽|✢|·|∗|⋆)\s+[A-Z][a-z]+\s+for\s+[0-9]/,
          );
        },
      );

      then(
        'and the chrome that read as healthy — a caret and an accept-edits footer',
        () => {
          expect(flat()).toContain('❯');
          expect(flat()).toContain('accept edits on');
        },
      );
    });

    when('[t1] the extant turn-end detector reads it', () => {
      const scene = useBeforeAll(async () =>
        runClassifier({ fn: '__duct_pane_turn_ended', fixture: flat() }),
      );

      then(
        '🔴 it finds NAUGHT — which is the defect, stated as a clamp',
        () => {
          expect(scene.stdout).toContain('VERDICT=no');
        },
      );
    });

    when('[t2] the DECLINE detector reads it', () => {
      const scene = useBeforeAll(async () =>
        runClassifier({ fn: '__duct_pane_declined', fixture: flat() }),
      );

      then('🔴 it fires, and carries the clause a reader ranks on', () => {
        expect(scene.stdout).toContain('VERDICT=yes');
        expect(scene.stdout).toContain('driver.route.stack.acceptance.test.ts');
      });
    });

    // THE TOOTH. a healthy clone's scrollback holds every decline it ever met,
    // and the detector takes the LAST one — so this must not claim a pane
    // whose refusal was answered and moved past. the JOIN that makes it
    // actionable is the caller's (an empty box, no live frame), exactly as
    // __duct_pane_turn_ended's is.
    when('[t3] a pane that never met a modal', () => {
      const scene = useBeforeAll(async () =>
        runClassifier({
          fn: '__duct_pane_declined',
          fixture: ['● wrote the file', '✻ Cogitated for 12s', '❯ '].join('\n'),
        }),
      );

      then('it claims naught — no refusal, no verdict', () => {
        expect(scene.stdout).toContain('VERDICT=no');
      });
    });

    when('[t4] the poll pipeline carries the fact', () => {
      then(
        'duct.poll emits it under its own marker, apart from TURN ENDED',
        () => {
          const body = readFileSync(join(__dirname, '../duct.poll.sh'), 'utf8');
          expect(body).toContain('__duct_pane_declined "${flat:-}"');
          expect(body).toContain('DECLINE PARKED SEEN —');
        },
      );

      then(
        '🔴 and crew.poll JOINS it to an EMPTY box — the inverse of the queued arm',
        () => {
          // a decline with a message queued behind it drains on the relay, which
          // is the sharper cure, so this arm must yield to it
          const body = readPollWhole();
          expect(body).toContain('DECLINE PARKED SEEN — ');
          expect(body).toContain(
            '-n "$__has_declined" && "$__boxes_s" != *"📬queued"* && -z "$__has_queuedrow"',
          );
        },
      );

      then(
        '🔴 and it prescribes NO nudge — a decline is a verdict, never a defect',
        () => {
          const body = readPollWhole();
          // 🔴 the anchor is the ACTIONS+= CALL, never the bare row text —
          //    corrected 2026-09-18. the bare `⛔ DECLINE PARKED —` is prose any
          //    COMMENT may quote, and one did: the [case53] cure quotes this very
          //    row while it explains why a STALE decline stands aside. `indexOf`
          //    then found the comment, and the 700-char window past it holds no
          //    `git.crew.read` — so a clamp over the render went red over a note
          //    ABOUT the render. the call site is code and is unique.
          const at = body.indexOf('ACTIONS+=("⛔ DECLINE PARKED —');
          expect(at).toBeGreaterThan(-1);
          expect(body.slice(at, at + 700)).toContain('NO nudge is prescribed');
          expect(body.slice(at, at + 700)).toContain('git.crew.read');
        },
      );
    });
  });

  // .what = a failed read carries its own cause, and the two causes take
  //         OPPOSITE cures — so one row cannot serve both
  //
  // 🔴 .measured 2026-09-17 — rhachet-roles-bhrain.beav.feat-prescribed-brain-per-stone
  //    the poll rendered `reviewer:❔unread`, whose guide reads "re-read the
  //    duct". the re-read exited 1: the seat is a dead local registry row for
  //    the legacy bare `reviewer`, with no tmux session behind it. so the tool
  //    prescribed a command that can never succeed, for a fact it already held
  //    in hand — the absent-session sentence was captured into the slot file
  //    and then thrown away at the `if [[ $rc -eq 0 ]]` gate.
  //
  // ⚠️ the exit CODE cannot part them. both an absent session and an
  //    unreachable grove exit 2 (each is a constraint under
  //    `rule.require.exit-code-semantics`), so a cure keyed on rc would grade
  //    every seat on an asleep grove `absent` and invite a fell over live work.
  //    [t2] is the tooth that holds that line.
  given(
    '[case31] __duct_read_outcome — an ABSENT seat is not an UNREAD one',
    () => {
      // ⚠️ returns an OBJECT rather than a bare string, on purpose. `useBeforeAll`
      //    hands back a proxy, and a proxy over a string primitive is not
      //    iterable — `toContain` throws on it. `runClassifier` above carries the
      //    identical `{ stdout }` shape for the identical reason.
      const outcome = (rc: number, said: string): { stdout: string } => ({
        stdout: runDuct({
          socket: genSocket('outcome'),
          ductworkDir: tempDirs.genOne({ slug: 'registry' }),
          body: [
            "said=$(cat <<'FIXEOF'",
            said,
            'FIXEOF',
            ')',
            `printf 'OUTCOME=%s\\n' "$(__duct_read_outcome ${rc} "$said")"`,
          ].join('\n'),
        }).stdout,
      });

      when('[t0] a LOCAL seat whose tmux session does not exist', () => {
        const scene = useBeforeAll(async () =>
          outcome(
            2,
            [
              "🛑 duct 'duct:///rhachet-roles-bhrain.beav.feat-prescribed-brain-per-stone/reviewer' is absent on this machine",
              '   └─ tmux holds no session by that name',
            ].join('\n'),
          ),
        );

        then('the outcome is ABSENT — a positive fact, never a shrug', () => {
          expect(scene.stdout).toContain('OUTCOME=absent');
        });
      });

      when(
        '[t1] a GROVE that answered, and said the session is not there',
        () => {
          const scene = useBeforeAll(async () =>
            outcome(
              2,
              [
                "🛑 duct 'duct://cloud/some-tree/mechanic' is absent on grove-x",
                '   └─ tmux holds no session by that name',
              ].join('\n'),
            ),
          );

          then(
            'still ABSENT — the grove reached, so its answer is authoritative',
            () => {
              expect(scene.stdout).toContain('OUTCOME=absent');
            },
          );
        },
      );

      // 🔴 the counter that earns the whole split. an asleep grove exits 2 too,
      //    and its seats may be perfectly alive. to grade this `absent` would
      //    hand a supervisor a fell for a tree that is at work.
      when(
        '[t2] COUNTER: the grove was UNREACHABLE, so the state is unknown',
        () => {
          const scene = useBeforeAll(async () =>
            outcome(
              2,
              [
                '🛑 could not reach grove-sandpine-v20260901 to read the duct',
                '   └─ ssh: connect to host grove-x port 22: Connection timed out',
                '   └─ the session state is UNKNOWN — absent and present are both possible',
              ].join('\n'),
            ),
          );

          then('the outcome is UNREAD — never absent', () => {
            expect(scene.stdout).toContain('OUTCOME=unread');
            expect(scene.stdout).not.toContain('OUTCOME=absent');
          });
        },
      );

      when('[t3] COUNTER: the read timed out and said no words at all', () => {
        // rc 124, an empty transcript. naught was learned, so naught is claimed.
        const scene = useBeforeAll(async () => outcome(124, ''));

        then('unknown falls to UNREAD, which is the honest default', () => {
          expect(scene.stdout).toContain('OUTCOME=unread');
        });
      });

      when('[t4] the read SUCCEEDED', () => {
        const scene = useBeforeAll(async () => outcome(0, '❯ some pane text'));

        then('the outcome is READ — the box ladder should run', () => {
          expect(scene.stdout).toContain('OUTCOME=read');
        });
      });

      when(
        '[t5] the poll consumes the split rather than re-deriving it',
        () => {
          const readPoll = (): string =>
            readFileSync(join(__dirname, '..', 'duct.poll.sh'), 'utf8');

          then('duct.poll calls __duct_read_outcome', () => {
            expect(readPoll()).toContain('__duct_read_outcome');
          });

          then('and carries an `absent` box state of its own', () => {
            expect(readPoll()).toContain('box="absent"');
          });

          then('whose cure names a FELL or a BOOT, never another read', () => {
            // ⚠️ anchored on the arm that ECHOES a row, never on the bare
            //    `absent)` — the box ASSIGNMENT carries that token too, and it
            //    sits higher in the file, so a bare anchor grades the wrong arm.
            const src = readPoll();
            const i = src.indexOf('absent)  echo');
            expect(i).toBeGreaterThan(0);
            const row = src.slice(i, i + 400);
            expect(row).toMatch(/fell|boot/);
          });

          then('and never prescribes the re-read that cannot succeed', () => {
            // the whole defect, stated as its own tooth: `unread`'s guide is
            // "re-read the duct", and for an absent seat that command exits 1
            // every time it is run.
            const src = readPoll();
            const i = src.indexOf('absent)  echo');
            expect(src.slice(i, i + 400)).not.toContain('re-read the duct');
          });
        },
      );
    },
  );

  // 🔴 a clone that LOST `--permission-mode acceptEdits` draws a permission
  //    modal for EVERY file write. the fleet default is set at launch
  //    (git.tree.behavior.sh passes the flag on every boot), and a permission
  //    mode is a LAUNCH flag rather than a property of the conversation — so a
  //    resume, a reboot, or a hand-started clone comes back in DEFAULT mode and
  //    stalls on its own edits. crewwork.sh says so verbatim at two sites, and
  //    ends with the sentence this case exists to refute: "the operator reads
  //    that stall as a wedge rather than as a mode it silently lost".
  //
  //    measured 2026-09-18 on `rhachet-roles-bhrain.beav.feat-acceptance-under-
  //    5min`: SIX supervisor keys across one window, one per `Update`, each one
  //    read as ordinary work. the tool named the modal and never named its
  //    cause, so the cost routed to a human keyboard every tick
  //    (rule.forbid.byhand-heal).
  //
  // 🔴 .the discriminator is claude's OWN OFFER, never an absence
  //    option 2 of an edit modal reads `Yes, allow all edits during this
  //    session (shift+tab)`. claude prints that offer ONLY when the mode is
  //    off, so it is positive evidence of the fact — where a test for the
  //    ABSENT `⏵⏵ accept edits on` footer would fire on a narrow pane, a
  //    scrolled capture, or any overlay, which is the husk-discriminator
  //    defect exactly (define.invariant.crew.husk.discriminator-parity).
  //
  // ⚠️ .the BOUND, clamped at [t2] rather than papered over
  //    this reads the MODAL shape alone. a mode-lost clone parked at a quiet
  //    box carries the same defect and no offer, so it is out of reach here —
  //    the absence-test that would catch it is the one the paragraph above
  //    refuses. [t2] pins that gap so a future reader inherits it stated
  //    (rule.require.enumerate-before-you-name).
  given(
    '[case32] __duct_pane_mode_lost — a clone that lost acceptEdits',
    () => {
      when('[t0] REAL: the captured pane, at an edit modal', () => {
        const scene = useBeforeAll(async () =>
          runClassifier({
            fn: '__duct_pane_mode_lost',
            fixture: readFileSync(
              join(
                __dirname,
                '.test/.assets/pane.mode.lost-accept-edits-at-an-edit-modal.log',
              ),
              'utf8',
            ),
          }),
        );

        then('it flags the lost mode', () => {
          expect(scene.stdout).toContain('VERDICT=yes');
        });

        then('and echoes the offer it read, so the caller can quote it', () => {
          expect(scene.stdout).toContain('allow all edits');
        });
      });

      when('[t1] REAL: a healthy pane that carries the mode footer', () => {
        const scene = useBeforeAll(async () =>
          runClassifier({
            fn: '__duct_pane_mode_lost',
            fixture: readFileSync(
              join(
                __dirname,
                '.test/.assets/pane.box.live-claude-with-no-caret-in-window.log',
              ),
              'utf8',
            ),
          }),
        );

        then('it does not flag', () => {
          expect(scene.stdout).toContain('VERDICT=no');
        });
      });

      when(
        '[t2] REAL: a mode-lost pane with NO modal — the stated bound',
        () => {
          const scene = useBeforeAll(async () =>
            runClassifier({
              fn: '__duct_pane_mode_lost',
              fixture: readFileSync(
                join(
                  __dirname,
                  '.test/.assets/pane.revive.no-accept-edits-mode.log',
                ),
                'utf8',
              ),
            }),
          );

          // this pane IS mode-lost — it is the revive capture whose whole subject
          // is a resume that dropped the flag. it carries no offer because it
          // carries no modal, so this detector cannot reach it. the tooth records
          // the bound rather than a claim of coverage.
          then('it does not flag — the offer is what it reads', () => {
            expect(scene.stdout).toContain('VERDICT=no');
          });
        },
      );

      when('[t3] a BASH modal, which acceptEdits never suppresses', () => {
        const scene = useBeforeAll(async () =>
          runClassifier({
            fn: '__duct_pane_mode_lost',
            fixture: [
              'Bash command',
              '  npm run test:unit',
              'Do you want to proceed?',
              ' ❯ 1. Yes',
              "   2. Yes, and don't ask again for npm commands in /repo",
              '   3. No',
              ' Esc to cancel',
            ].join('\n'),
          }),
        );

        // 🔴 the sharpest negative. acceptEdits auto-accepts EDITS and no other
        //    act, so a bash modal is the normal state of a healthy clone. a
        //    detector that fired here would name the whole fleet mode-lost.
        then('it does not flag', () => {
          expect(scene.stdout).toContain('VERDICT=no');
        });
      });
    },
  );
});
