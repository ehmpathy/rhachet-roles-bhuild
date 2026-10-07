// biome-ignore-all lint/suspicious/noControlCharactersInRegex: a captured pane
// IS a stream of ANSI escapes, so every clamp here must strip them before it
// reads the text. the \u001b is the subject of these regexes rather than a typo
// in them — the rule is a false positive over a terminal-capture corpus.
/**
 * .what = clamps on what a live pane is AT — mid-turn, a list, a wedge, a plea, a compact
 *
 * .note = a PART of the `crewwork` suite, cut so one reviewer can hold
 *         it whole. the suite's shared fixtures, and its account of what it
 *         runs against and why, live in crewwork.harness.ts.
 */
import { readFileSync } from 'fs';
import { join } from 'path';
import { given, then, useBeforeAll, when } from 'test-fns';

import { getShellLibWhole } from '../../../.test/getShellLibWhole';
import { tempDirs } from '../../../.test/tempDirs';
import { readPollWhole } from './crewwork.harness';
import { runCrew } from './work.harness';

// .why = each case makes a fake git root, and each runCrew makes a driver dir.
//        with no sweep, one run leaves ~30 dirs in the shared /tmp and the
//        hundredth leaves 3000. hermetic per-run is not hermetic over time.
afterAll(() => tempDirs.delAll());

describe('crewwork', () => {
  // .what = __crew_turn_stats — the live TURN's elapsed seconds and token count
  //
  // 🔴 .why = the fleet had a motion instrument for the BOX and none for the
  //         TURN. `CLONE QUIET`, `✋ BOX UNMOVED`, and the `CREW_MOTION` ages all
  //         key on the box between two captures — and a clone mid-turn has an
  //         EMPTY box that stays empty, so every one of them reads "unchanged"
  //         and is right to.
  //
  //         ⇒ measured 2026-09-16 on feat-dispute-or-concede: three byhand pane
  //         reads over ~16 minutes read `34m 34s` → `47m 58s` → `50m 44s` with
  //         the token counter held at `↓ 8.3k` throughout, while the fleet poll
  //         rendered `😴 unread` with no age and no flag of any kind. the poll
  //         was not WRONG — the box really was empty — but a supervisor had to
  //         diff three panes BY EYE to learn what it could not say.
  //
  // 🔴 .the datum was already REACHED and thrown away: crewwork.sh's
  //         `__crew_grove_has_active_clone` greps the exact line that holds both
  //         numbers and asks it one boolean question. the column was never cut.
  //
  // .fixture = the verbatim `--raw` capture at
  //         .test/.assets/pane.turn.long-turn-with-a-frozen-token-counter.log
  //
  // ⚠️ .this clamps the MEASUREMENT only. no threshold and no render ride with
  //         it, on purpose — a 40-minute acceptance suite is normal work on this
  //         fleet, so a number picked before a calibration corpus exists would
  //         flag healthy clones every tick. this asset is the corpus's first row.
  given('[case31] a pane whose clone is mid-turn', () => {
    const ASSET = join(
      __dirname,
      '.test/.assets/pane.turn.long-turn-with-a-frozen-token-counter.log',
    );

    // .what = run the helper and report BOTH its rc and its payload in one token
    // .why  = an rc-only clamp passes on a helper that parses to the wrong
    //         numbers; a payload-only clamp cannot see the no-turn arm at all.
    const probe = (plain: string) =>
      `if out="$(__crew_turn_stats "${plain}")"; then printf 'RESULT[%s]' "$(printf '%s' "$out" | tr '\\t' '|')"; else printf 'RESULT[none]'; fi`;

    when(
      '[t0] the verbatim capture, de-ansi`d as every pane caller does',
      () => {
        const result = useBeforeAll(async () =>
          runCrew({
            command: `plain="$(sed 's/\\x1b\\[[0-9;]*m//g' '${ASSET}')"; ${probe('$plain')}`,
          }),
        );
        then('it reads 50m 44s as 3044 seconds, and the count verbatim', () => {
          // .teeth = `(50m 44s · ↓ 8.3k tokens · thought for 1s)` holds a SECOND
          //    duration — `thought for 1s`. a parse that reached for the last `s`
          //    would answer 1.
          expect(result.stdout).toContain('RESULT[3044|↓ 8.3k]');
        });
      },
    );

    when('[t1] the RAW capture, with its escapes intact', () => {
      const result = useBeforeAll(async () =>
        runCrew({
          command: `plain="$(cat '${ASSET}')"; ${probe('$plain')}`,
        }),
      );
      then(
        'it reads NO turn — the de-ansi contract carries real weight',
        () => {
          // 🔴 .teeth = the raw line carries escapes BETWEEN `↓` and the count:
          //    `(50m 44s · ↓[39m [38;5;246m8.3k tokens`. so a caller that hands
          //    over raw text gets a silent `none` rather than an error, and this
          //    is the case that names that cost out loud.
          expect(result.stdout).toContain('RESULT[none]');
        },
      );
    });

    when('[t2] an idle clone — a turn that ENDED', () => {
      const result = useBeforeAll(async () =>
        runCrew({
          command: probe(
            '✻ Worked for 1m 52s\\n  11 tasks (10 done, 1 in progress)\\n❯ \\n',
          ),
        }),
      );
      then('it reads no turn — the teeth bite both ways', () => {
        // .teeth = an ended turn draws `Worked for 1m 52s` — a duration with no
        //    parens and no token counter. a looser match would age an idle clone.
        expect(result.stdout).toContain('RESULT[none]');
      });
    });

    when('[t3] an hours-form spinner, no clause after the count', () => {
      const result = useBeforeAll(async () =>
        runCrew({
          command: probe('✻ Herding… (4h 7m 10s · ↓ 8.0k tokens)\\n'),
        }),
      );
      then('it carries the hours — 4h 7m 10s is 14830 seconds', () => {
        // .teeth = captured verbatim off feat-peer-review-parallelism, 2026-09-16.
        //    a parse that assumed `<m>m <s>s` would answer 430.
        expect(result.stdout).toContain('RESULT[14830|↓ 8.0k]');
      });
    });

    when('[t4] a stale spinner in the scrollback, above a live one', () => {
      const result = useBeforeAll(async () =>
        runCrew({
          command: probe(
            '✻ Herding… (22m 13s · ↓ 10.8k tokens · thinking)\\n● Bash(npm run test)\\n✻ Herding… (3h 38m 44s · ↓ 5.4k tokens · thinking)\\n',
          ),
        }),
      );
      then('it judges the LAST spinner — the newest frame', () => {
        // .teeth = a pane is scrollback plus a live frame. a first-match parse
        //    would report an age that stopped to move an hour ago.
        expect(result.stdout).toContain('RESULT[13124|↓ 5.4k]');
      });
    });

    // 🔴 .the FALSE-POSITIVE shape — captured 2026-09-16 off
    //    feat-peer-review-parallelism, and it is why this helper ships as a
    //    MEASUREMENT and not as a verdict.
    //
    //    two reads ~12 minutes apart:
    //      4h  7m 10s · ↓ 8.0k tokens
    //      4h 19m 19s · ↓ 8.0k tokens
    //
    //    the clock moved and the counter held byte-identical — the exact pair
    //    the wedge axis would key on. ⚠️ and the clone was NOT wedged: the pane
    //    carries a live bash at `(34m 42s · timeout 40m)`, so the model emitted
    //    naught because it AWAITED A TOOL, which is correct behavior.
    //
    // ⇒ a flat counter beside a live clock is SUSPICIOUS, never CONCLUSIVE. any
    //    future consumer must read the pane's own tool-call state beside it.
    when('[t5] a flat counter with a live tool call beneath it', () => {
      const ASSET_BUSY = join(
        __dirname,
        '.test/.assets/pane.turn.flat-counter-under-a-live-tool-call.log',
      );
      const result = useBeforeAll(async () =>
        runCrew({
          command: `plain="$(sed 's/\\x1b\\[[0-9;]*m//g' '${ASSET_BUSY}')"; ${probe('$plain')}`,
        }),
      );
      then('it reads the TURN, never the tool call beside it', () => {
        // 🔴 .teeth = this pane holds TWO parenthesized durations, and only one
        //    of them is the turn: `(34m 42s · timeout 40m)` is the bash call's
        //    own clock. the `· ↓ <n> tokens` anchor is what parts them — drop it
        //    and this case answers 2082 seconds off a tool call.
        expect(result.stdout).toContain('RESULT[15559|↓ 8.0k]');
      });
    });

    // 🔴 .the SECOND direction — caught 2026-09-16, minutes after the helper
    //    shipped, on feat-prescribed-brain-per-stone. a compaction turn draws
    //    an UP arrow, and the first cut of this parse read only `↓` — so every
    //    clone mid-compaction answered `none` and would have aged as if idle.
    when('[t6] a COMPACTION turn — the arrow points up', () => {
      const result = useBeforeAll(async () =>
        runCrew({
          command: probe(
            '· Compacting conversation… (25m 13s · ↑ 13.3k tokens)\\n',
          ),
        }),
      );
      then('it reads the turn, and carries the arrow with the count', () => {
        // 🔴 .teeth = the arrow is in the PAYLOAD, never merely in the match.
        //    a consumer that compared a bare `13.3k` against a prior `8.0k`
        //    would read a compaction as token movement and clear a clone that
        //    is genuinely wedged. with `↑ 13.3k` vs `↓ 8.0k` the naive string
        //    compare refuses that by construction.
        expect(result.stdout).toContain('RESULT[1513|↑ 13.3k]');
      });
    });
  });

  // 🔴 .the defect this clamps, measured 2026-09-16 on
  //    rhachet-roles-bhrain.beav.feat-behavior-route-upgrades
  //
  //    `--healable` emitted a heal line for that tree, and the heal probe
  //    answered `🙋 a live modal is up`. the pane held NO modal — it held an
  //    ENDED turn (`✻ Sautéed for 6m 20s`), an EMPTY `❯` box, and the clone's
  //    own escalation written as a numbered list in PROSE:
  //
  //        1. <fix the billing> — the reviewer brain cannot run until then
  //        2. once lanes run: --as overruled --level 1 …
  //
  //    the gate's numbered-option arm carried the cursor marker as OPTIONAL
  //    (`[❯>]?`), so prose matched. a supervisor who acted on that verdict
  //    would have sent `--keys 1` into an empty box, where it lands as
  //    LITERAL TEXT and the next poll reports it as human-typed.
  //
  // ⚠️ .and to tighten arm 3 ALONE would be wrong — which is why t2 exists.
  //    the survey pane in this same corpus was caught only by ACCIDENT, via
  //    a prose list that happened to sit above its real row. tighten arm 3
  //    and the survey stops to be detected: a false positive traded for a
  //    false negative, on a pane already clamped.
  given('[case32] a pane with a numbered list that is NOT a modal', () => {
    // .what = one token that carries the verdict, so an rc-only read cannot
    //         pass on a helper that answers the right rc for the wrong reason
    const probe = (plain: string) =>
      `if __crew_pane_has_plea "${plain}"; then printf 'RESULT[plea]'; else printf 'RESULT[none]'; fi`;

    // 🔴 .why a literal pane goes through `printf %b` first
    //   three of this helper's four arms are LINE-ANCHORED (`^`), so a fixture
    //   whose `\n` stays a literal backslash-n collapses to ONE line and only
    //   its first row can ever match. t3 caught exactly that — it answered
    //   `none` on a survey row that the shipped helper detects correctly.
    const probeLiteral = (plain: string) =>
      `p="$(printf '%b' '${plain}')"; ${probe('$p')}`;

    when(
      '[t0] the clone wrote its escalation as a numbered list, in prose',
      () => {
        const ASSET = join(
          __dirname,
          '.test/.assets/pane.plea.prose-numbered-list-read-as-a-modal.log',
        );
        const result = useBeforeAll(async () =>
          runCrew({
            command: `plain="$(sed 's/\\x1b\\[[0-9;]*m//g' '${ASSET}')"; ${probe('$plain')}`,
          }),
        );
        then('it reads NO plea — prose never marks a selection', () => {
          // 🔴 .teeth = this is the case that earned the cure. under the
          //    pre-cure gate it answered `plea`, and the heal verb then
          //    recommended a keystroke into an empty box.
          expect(result.stdout).toContain('RESULT[none]');
        });
      },
    );

    when('[t1] a real permission modal, with its cursor on an option', () => {
      const result = useBeforeAll(async () =>
        runCrew({
          command: probeLiteral(
            ' ❯ 1. Yes\\n   2. Yes, allow all edits in this session (shift+tab)\\n   3. No\\n',
          ),
        }),
      );
      then('it reads a plea — the cursor is the whole discriminator', () => {
        // .teeth = the ONLY difference from t0 is the ❯ on the selected row.
        //    a cure that dropped the arm entirely would answer `none` here and
        //    send a live modal to the reboot path.
        expect(result.stdout).toContain('RESULT[plea]');
      });
    });

    when(
      '[t2] a survey row, whose options are colon-joined on ONE line',
      () => {
        const ASSET = join(
          __dirname,
          '.test/.assets/pane.survey.overlays-an-idle-clone-that-asks-for-a-commit-quota.log',
        );
        const result = useBeforeAll(async () =>
          runCrew({
            command: `plain="$(sed 's/\\x1b\\[[0-9;]*m//g' '${ASSET}')"; ${probe('$plain')}`,
          }),
        );
        then(
          'it still reads a plea — off its OWN arm, not the numbered one',
          () => {
            // 🔴 .teeth = this asset ALSO holds a prose numbered list, which is what
            //    caught it before the cure. tighten arm 3 with no survey arm beside
            //    it and this case flips to `none` — the survey's real row
            //    (`1: Bad  2: Fine  3: Good  0: Dismiss`) uses COLONS on one line
            //    and arm 3 never reached it at all.
            expect(result.stdout).toContain('RESULT[plea]');
          },
        );
      },
    );

    when('[t3] a bare survey row, with no prose list above it', () => {
      const result = useBeforeAll(async () =>
        runCrew({
          command: probeLiteral(
            'how is the clone faring this session?\\n 1: Bad    2: Fine   3: Good   0: Dismiss\\n',
          ),
        }),
      );
      then('the survey arm stands on its own', () => {
        // .teeth = t2 proves the arm fires on the captured pane; this proves it
        //    fires on the ROW, so a future asset with no prose above it is
        //    covered too.
        expect(result.stdout).toContain('RESULT[plea]');
      });
    });

    when('[t4] an ordinary prose list, the plainest shape there is', () => {
      const result = useBeforeAll(async () =>
        runCrew({
          command: probeLiteral(
            'next steps:\\n  1. rebase onto main\\n  2. re-run the suite\\n  3. re-arrive\\n',
          ),
        }),
      );
      then('it reads no plea', () => {
        expect(result.stdout).toContain('RESULT[none]');
      });
    });
  });

  // 🔴 .the SECOND defect in this same gate chain, met the tick the first was
  //    cured — and met only BECAUSE it was cured. with the false plea gone,
  //    the same pane fell through to the next gate and was graded
  //    `SUSPECTED WEDGE`. it was neither: an ENDED turn above an EMPTY box.
  //
  //    the work-frame gate read `[0-9]+m[[:space:]]+[0-9]+s` — a bare duration,
  //    anywhere in the pane. claude draws a duration in that shape on BOTH
  //    sides of a turn boundary:
  //
  //        ✻ Sautéed for 6m 20s                      ← OVER
  //        ✻ Herding… (6m 20s · ↓ 8.0k tokens)       ← LIVE
  //
  // ⇒ so every idle clone whose last turn was still on screen read as mid-work,
  //   and the wedge probe then spent two duct reads and a repaint on it.
  //
  // .the cure is the helper [case31] shipped: the parenthesized
  //   `· ↓/↑ <n> tokens` anchor is the turn-boundary discriminator, and it is
  //   already clamped in BOTH directions there. this case clamps the JOIN —
  //   that the gate actually asks it.
  given('[case33] the wedge probe`s mid-work gate', () => {
    const gate = (plain: string) =>
      `p="$(printf '%b' '${plain}')"; if __crew_turn_stats "$p" >/dev/null; then printf 'RESULT[at-work]'; else printf 'RESULT[at-rest]'; fi`;

    when('[t0] an ENDED turn above an empty box — the measured case', () => {
      const result = useBeforeAll(async () =>
        runCrew({
          command: gate(
            '  reviewer or judge malfunctioned on stone 1.vision.\\n\\n✻ Sautéed for 6m 20s\\n\\n❯ \\n',
          ),
        }),
      );
      then(
        'the gate reads AT REST — so the probe returns 4, never a wedge',
        () => {
          // 🔴 .teeth = verbatim off feat-behavior-route-upgrades, 2026-09-16.
          //    under the old regex `6m 20s` matched and this pane was graded a
          //    suspected wedge — a verdict that routes a halted clone, which
          //    owes a HUMAN two gates, to the reboot path.
          expect(result.stdout).toContain('RESULT[at-rest]');
        },
      );
    });

    when('[t1] a LIVE turn, the same duration in the live shape', () => {
      const result = useBeforeAll(async () =>
        runCrew({
          command: gate('✻ Herding… (6m 20s · ↓ 8.0k tokens)\\n\\n❯ \\n'),
        }),
      );
      then(
        'the gate reads AT WORK — the probe proceeds to its two reads',
        () => {
          // .teeth = the duration is IDENTICAL to t0. only the parens and the
          //    token counter differ, which is the whole discriminator. a cure
          //    that merely dropped the duration arm would answer at-rest here
          //    and blind the wedge axis entirely.
          expect(result.stdout).toContain('RESULT[at-work]');
        },
      );
    });

    when('[t2] a bare box, no turn line at all', () => {
      const result = useBeforeAll(async () =>
        runCrew({ command: gate('❯ \\n  ⏵⏵ accept edits on\\n') }),
      );
      then('the gate reads AT REST', () => {
        expect(result.stdout).toContain('RESULT[at-rest]');
      });
    });

    // 🔴 .the HOURS form — the arm the corpus never covered
    //
    //    every fixture above, and both assets in [case31], carry a duration in
    //    `Nm Ns`. the helper's regex does hold an `([0-9]+h )?` group, so the
    //    hours form parses today — but not one clamp exercised it, so a future
    //    edit could drop that group and every test would stay green while a
    //    clone past the hour mark silently read AT REST.
    //
    // .fixture = a verbatim `--raw` capture, 2026-09-16, off
    //    `rhachet-roles-bhrain.beav.feat-peer-review-parallelism` — a genuinely
    //    live turn at `(7h 4m 49s · ↓ 20.0k tokens · thought for 8s)`, mid
    //    acceptance suite. the fleet poll rendered it `😴 unread`, with no age.
    //
    // ⚠️ this clamps the MEASUREMENT only, exactly as [case31] does. what the
    //    seven-hour figure bears on is the THRESHOLD question that dream defers
    //    — it is the corpus's second row, and its far end.
    when('[t3] a LIVE turn past the hour mark, in the hours form', () => {
      const ASSET = join(
        __dirname,
        '.test/.assets/pane.turn.hours-form-live-turn-at-seven-hours.log',
      );
      const result = useBeforeAll(async () =>
        runCrew({
          command: `p="$(sed 's/\\x1b\\[[0-9;]*m//g' '${ASSET}')"; if out="$(__crew_turn_stats "$p")"; then printf 'RESULT[%s]' "$(printf '%s' "$out" | tr '\\t' '|')"; else printf 'RESULT[none]'; fi`,
        }),
      );
      then(
        'it reads 7h 4m 49s as 25489 seconds, and the count verbatim',
        () => {
          // .teeth = drop the `([0-9]+h )?` group and this goes RESULT[none];
          //    drop the `h * 3600` term and it yields 289 — a seven-hour turn
          //    graded under five minutes.
          expect(result.stdout).toContain('RESULT[25489|↓ 20.0k]');
        },
      );
    });
  });

  /**
   * 🔴 .what = the poll must not render `😶 inflight` over a clone that GAVE UP
   *          and asked for a human.
   *
   * .why  = measured 2026-09-15, THREE trees in one tick — at 23, 25 and 51
   *          attempts, two of them ⭐ sponsored. each pane carries the clone's
   *          own `stuck on stone <X> after <N> attempts. please tell a human`,
   *          and each rendered as health, because the pane HAS a live `❯` and
   *          a stone below it.
   *
   * 🔴 .the two extant human-gate sources both miss it, in opposite ways:
   *          - the STONE is stale by construction — the clone never advanced,
   *            so it reads `🔍` or `yield 🌾`, which routes to the DRIVER
   *          - the PLEA finds naught — no grant command was printed, because
   *            there is no gate to grant. its INSTRUMENT crashed
   *
   * ⚠️ .and the obvious cure is the wrong one. `stuck after 51 attempts` reads
   *          as "this driver is lost" and it is not — the driver's own prose
   *          above the crash is coherent in all three. what failed is
   *          `route.drive` inside the stop hook, so the count measures the
   *          INSTRUMENT's age. a supervisor who routes it to the driver spends
   *          a turn `rule.forbid.steer-a-clone-beyond-a-permission-key` forbids.
   *          ⇒ so the row must SAY what the count means. that is the difference
   *          between a tool that guides and one that merely classifies.
   *
   *          the DETECTOR half is clamped behaviorally in
   *          `ductwork.signal.integration.test.ts [case21]`, against two verbatim
   *          fixtures. this clamps the WIRING — a detector nobody consumes is
   *          the emitted-but-unconsumed defect the poll's own plea arm warns of.
   *          STATIC, for the same reason case22 is: no behavioral poll harness
   *          exists yet (task #59).
   */
  given('[case23] a clone that gave up and asked for a human', () => {
    const src = readPollWhole();

    when('[t0] the consume path is read', () => {
      then('the subject exists — the clamp is not vacuous', () => {
        expect(src).toContain('CREW_ESCALATION');
      });

      then('the detector line is PARSED, never emitted-and-dropped', () => {
        // the defect this whole case block guards: duct.poll renders the row
        // AFTER the box, so an arm that does not join on `uri_block` drops it
        // silently. every peer SEEN arm learned this the hard way.
        expect(src).toContain("*'ESCALATION SEEN'*");
        expect(src).toContain('__crew_record_escalation');
      });
    });

    when('[t1] the status ladder is read', () => {
      then('an escalation reaches the crew STATUS, not just the footer', () => {
        // the measured defect is the status line reading `😶 inflight`. a row
        // that fixed only the footer would leave the headline false.
        expect(src).toContain('__has_escalation');
      });

      then(
        'it outranks the MOTION arm, whose churn is the crash re-fired',
        () => {
          // a crashed stop hook re-fires, so the pane changes between polls and
          // `__crew_ondefect_moved` reads that churn as progress. below it, the
          // row renders `inflight` again — the defect, restored.
          const atEscalation = src.indexOf('elif [[ -n "$__has_escalation" ]]');
          const atMoved = src.indexOf('__crew_ondefect_moved "$__stones_s"');
          expect(atEscalation).toBeGreaterThan(-1);
          expect(atMoved).toBeGreaterThan(-1);
          expect(atEscalation).toBeLessThan(atMoved);
        },
      );
    });

    when('[t2] the action row is read', () => {
      const row = (() => {
        const at = src.indexOf('🙋 ESCALATION —');
        return at < 0 ? '' : src.slice(at, at + 600);
      })();

      then('the row exists and quotes the clone verbatim', () => {
        expect(row).toContain('${__eclause}');
      });

      then('it GUIDES — it names what the count means, and the read', () => {
        // 🔴 the non-vacuity assertion, and the whole point of the cure. a row
        // that printed the count alone would send the reader at the driver.
        expect(row).toContain('route.drive');
        expect(row).toContain('never the driver');
        expect(row).toContain('rhx git.crew.read --tree');
      });
    });
  });

  /**
   * .what = the CONTEXT-LOW wire: duct.poll detects, git.crew.poll consumes.
   *
   * .why  = a clone near auto-compact loses the middle of its own conversation,
   *          unprompted, and no instrument read the line that says so (task
   *          #86). the first visible symptom is a coherence drop with no cause
   *          on the pane — so a supervisor who did not see the number diagnoses
   *          a confused driver and spends a turn
   *          `rule.forbid.steer-a-clone-beyond-a-permission-key` forbids.
   *
   * 🔴 .the task's own premise was REFUTED before this cure was built
   *          (2026-09-15). #86 filed three renders as "the same fact". they are
   *          TWO facts: `N% until auto-compact` reports the context LEFT, while
   *          `/clear to save NNNK tokens` reports the session's cumulative
   *          SPEND — 763K measured, past any window, on a plainly healthy pane.
   *          ⇒ so #86's cure #2, "relay `/clear offered` as a human gate",
   *          would fire on every long-lived clone. it is WITHDRAWN, and only
   *          the narrow half is built. the discriminator is clamped
   *          behaviorally in `ductwork.signal.integration.test.ts [case23]`, against
   *          both shapes, from two verbatim fixtures.
   *
   * 🔴 .this row carries NO runnable line, on purpose, and that is the one way
   *          it departs from every peer row above. `/clear` and `/compact` are
   *          steers beyond a permission key, and either would destroy the
   *          conversation the row exists to protect.
   *          ⇒ so `rule.require.poll-recommends-every-cure-heal-has` is
   *          satisfied by a row that SAYS no lever is owed, never by omission —
   *          a row that merely printed a number reads as an unfinished ask.
   *
   *          STATIC, same reason as case23: no behavioral poll harness exists
   *          yet (task #59).
   */
  given('[case24] a clone about to auto-compact its own conversation', () => {
    const src = readPollWhole();
    const duct = readFileSync(join(__dirname, '../duct.poll.sh'), 'utf8');

    when('[t0] the detect-and-persist path is read in duct.poll', () => {
      then('the detector is CALLED, not merely defined in ductwork', () => {
        expect(duct).toContain('__duct_pane_compact_percent');
      });

      then('its value crosses the subshell boundary via a slot file', () => {
        // every worker runs in a `( … ) &` subshell, so a bare variable is
        // lost. the slot file IS the channel — the peer signals all learned
        // this, and an unpersisted detection is silently dropped.
        expect(duct).toContain('$slot.compactpct');
      });

      then('a HUSK is excluded — its status line is stale scrollback', () => {
        // a dead clone's percentage is a frozen number about a clone that no
        // longer runs. to surface it would warn about a corpse.
        const at = duct.indexOf('compactpct=""');
        expect(at).toBeGreaterThan(-1);
        expect(duct.slice(at, at + 200)).toContain('"$box" != "husk"');
      });
    });

    when('[t1] the consume path is read in git.crew.poll', () => {
      then('the subject exists — the clamp is not vacuous', () => {
        expect(src).toContain('CREW_COMPACT');
      });

      then('the row is PARSED, never emitted-and-dropped', () => {
        // the defect every peer SEEN arm hit: duct.poll renders this AFTER the
        // box, so an arm that joins on `uri` rather than `uri_block` drops it.
        //
        // ⚠️ the arm and its `uri_block` join are asserted as ONE adjacent
        // block, never as two loose substrings. `__crew_record_compact` parses
        // the same token in its OWN case statement, so a bare
        // `toContain("*'CONTEXT LOW — '*")` is satisfied by the recorder and
        // stays green with the poll arm renamed away — measured by dogfood,
        // 2026-09-15, on the first stub.
        expect(src).toMatch(
          /\*'CONTEXT LOW — '\*\)\s*\n\s*\[\[ -n "\$uri_block" \]\] \|\| continue\s*\n\s*__crew_record_compact "\$uri_block" "\$line"/,
        );
      });

      then(
        'the PERCENT rides, so two trees can be ranked against each other',
        () => {
          // a bare flag cannot part a tree at 2% from a tree at 9%, and the
          // number is the whole content of the signal.
          expect(src).toContain(
            'CREW_COMPACT["$(__crew_canon "$tree")"]+="${role}=${pct}"',
          );
        },
      );
    });

    when('[t2] the crew STATUS is read', () => {
      then(
        'a compact does NOT override the status — it is a WATCH, not a gate',
        () => {
          // 🔴 the tooth that parts this cure from its peers. an escalation earns
          // `__has_escalation` because the clone STOPPED; a clone near compact is
          // still at work, so a status override here would put a human in front
          // of a tree that needs none — the fabrication class #103 just cured.
          expect(src).not.toContain('__has_compact');
        },
      );
    });

    when('[t3] the action row is read', () => {
      const row = (() => {
        const at = src.indexOf('🧠 CONTEXT LOW —');
        return at < 0 ? '' : src.slice(at, at + 600);
      })();

      then('the row exists and carries the measured percentage', () => {
        expect(row).toContain('${__cpct}%');
      });

      then(
        'it GUIDES — it STATES that no lever is owed, rather than leaving it unsaid',
        () => {
          // 🔴 the non-vacuity assertion. a row that printed the number alone
          // reads as an unfinished ask, and the first move a reader reaches for
          // is the command that would destroy the conversation.
          expect(row).toContain('NO lever is owed');
          expect(row).toContain('the compact fires itself');
        },
      );

      then('it names the misread it exists to prevent', () => {
        // the coherence drop after a compact looks exactly like a lost driver.
        expect(row).toContain('do NOT read it as a confused driver');
      });

      then('it offers NEITHER /clear NOR /compact as a move', () => {
        // both are steers beyond a permission key. the row may NAME them to
        // forbid them, and it must never render one as an action to take.
        expect(row).not.toMatch(/rhx git\.crew\.send[^"]*\/(clear|compact)/);
      });
    });
  });

  given(
    '[case53] a statusline slot that turns, and the read that must not race it',
    () => {
      // 🔴 COMMENTS STRIPPED — the precedent this file sets many times over, and
      //    here it carries weight rather than ceremony: this verb's own `.why`
      //    block now quotes the banner, the escape shape, AND
      //    `__crew_modal_strip_ansi` by name. so a bare indexOf would grade the
      //    RECORD as though it were the code, and every tooth below would stay
      //    green through a full revert of the cure.
      const readFn = (): string => {
        const src = getShellLibWhole({ path: join(__dirname, 'crewwork.sh') })
          .split('\n')
          .filter((line) => !/^\s*#/.test(line))
          .join('\n');
        // ⚠️ ANCHORED on a newline. the bare string `crew.read` appears dozens of
        //    times in this file — in poll guides, in heal, in modal's own fallback
        //    — so an unanchored indexOf lands on a peer and grades the wrong
        //    function while it reads green.
        const at = src.indexOf('\ncrew.read() {');
        expect(at).toBeGreaterThan(0);
        const end = src.indexOf('\n}\n', at);
        expect(end).toBeGreaterThan(at);
        return src.slice(at, end);
      };

      when('[t0] the verb is read from source', () => {
        then('ANTI-VACUITY: the verb exists and parses --until', () => {
          expect(readFn()).toContain('--until)');
        });

        then('it RE-SAMPLES, and the re-sample is BOUNDED', () => {
          const body = readFn();
          // the loop is what parts this from the one-shot read that lost the race
          expect(body).toMatch(/while \(\( try < until_tries \)\)/);
          // and a default bound, so a bare --until cannot spin without end
          expect(body).toContain('until_tries=12');
          // with a gap, or the re-reads all sample one instant of a slot that turns
          expect(body).toContain('sleep 2');
        });

        then(
          '🔴 the match runs on the STRIPPED pane — ONE line, so the order cannot drift',
          () => {
            // the whole cure, in one assertion: EVERY line that greps for the
            // caller's pattern must also strip first. a two-statement form could be
            // reordered by a later edit and no tooth would notice; one pipeline
            // cannot be.
            const matchLines = readFn()
              .split('\n')
              .filter((l) => l.includes('$until_pat') && l.includes('grep'));
            expect(matchLines.length).toBeGreaterThan(0); // ANTI-VACUITY
            for (const l of matchLines) {
              expect(l).toContain('__crew_modal_strip_ansi');
            }
          },
        );

        then(
          'COUNTER: --raw still reaches duct.read, so the OUTPUT keeps its escapes',
          () => {
            // the mirror of the tooth above, and it is not redundant: a cure that
            // stripped BOTH would pass that tooth and hand back a fixture with no
            // escapes — the artifact the dream says must never be hand-made.
            expect(readFn()).toMatch(
              /duct\.read --on "\$uri" --lines "\$lines" --raw/,
            );
          },
        );
      });

      when('[t1] the verb misses, and must say what a miss is worth', () => {
        then('a miss is a CONSTRAINT — exit 2, never exit 0', () => {
          expect(readFn()).toContain('failed=2');
        });

        then('🔴 it refuses to call a miss an ABSENCE', () => {
          // the honest claim is "not in N samples". "not present" is a different
          // claim and this verb cannot support it, because the slot turns
          // (term=false-report). the render must not smuggle the second.
          const miss = readFn()
            .split('\n')
            .find((l) => l.includes('🕳️'));
          // toBeDefined, never toBeTruthy: `.find` returns `string | undefined`,
          // so `undefined` is the one failure this guard exists to catch. a
          // truthiness check also rejects '', which `.find` cannot return here —
          // a wider net over a narrower claim (rule.require.shapefit)
          expect(miss).toBeDefined();
          expect(miss).toContain('NOT a claim that the subject is absent');
          // and it names the lever, rather than leave the reader to find one
          expect(miss).toContain('--until-tries');
        });

        then(
          'a HIT says which read caught it — so the reader can judge the race',
          () => {
            const hit = readFn()
              .split('\n')
              .find((l) => l.includes('🎯'));
            expect(hit).toBeDefined(); // see [t1] above — `.find` returns `string | undefined`
            expect(hit).toContain('$try');
          },
        );
      });

      when('[t2] --until is aimed at every role at once', () => {
        then('it is REFUSED, never guessed', () => {
          // N panes and one verdict has no single sense: which pane must match?
          // to pick for the caller would be to invent the answer.
          const body = readFn();
          const at = body.indexOf('-n "$until_pat" && "$who" == "all"');
          expect(at).toBeGreaterThan(-1); // ANTI-VACUITY: the guard exists
          expect(body.slice(at, at + 400)).toContain('return 2');
        });
      });
    },
  );

  given('[case62] a survey drawn OVER a prose blocker', () => {
    // .teeth = arm 4 keys on the survey's colon-joined row, and a survey is
    //          an OVERLAY — it draws over whatever the clone last wrote. so a
    //          pane can carry a survey AND an unanswered blocker at once, and
    //          the verdict names only the half a keystroke clears.
    //
    // 🔴 .the two demand OPPOSITE acts, which is what makes the conflation cost
    //    a survey is answered with `0` and the clone drives on.
    //    a blocker is a HUMAN's — the clone named a wall it cannot pass.
    //    ⇒ `🙋survey` tells a supervisor "a keystroke clears this", and on this
    //      pane that is false about the world while true about what it matched
    //      (term=false-report).
    //
    //    measured 2026-09-20 on rhachet.beav.feat-boot-manifest-and-budget:
    //    the clone named a wall it could not pass — its shell cwd stuck under
    //    .reviews/peer/, every route back refused, so `rhx git.repo.test`
    //    could not find .agent/ — then a survey drew over it, and the poll
    //    rendered 🙋survey for two consecutive ticks. the blocker reached NO
    //    tally — not 🙋, not ✋ — across both.
    //
    // ⚠️ this case pins TODAY's behavior, never the cure. the cure changes the
    //    hottest read in the tick and is deferred with a record; what this
    //    guards is that a later tighten of arm 4 cannot drop the survey
    //    silently, and that the fixture keeps both shapes to prove it on.
    const raw = () =>
      readFileSync(
        join(
          __dirname,
          '.test/.assets/pane.plea.prose-blocker-under-a-rating-survey.log',
        ),
        'utf8',
      );
    // the capture is --raw on purpose: the escapes ARE the signal for a ghost
    // and a dim placeholder. the classifier takes de-ansi'd text, so the arms
    // below must run over the same shape the shell hands them.
    const plain = () => raw().replace(/\u001b\[[0-9;]*m/g, '');

    // arm 4, transcribed from __crew_pane_has_plea. the [t2] tooth holds this
    // transcription honest — an arm that drifts in the shell and not here
    // would leave every assertion below true and meaningless.
    const ARM4 = /^[ \t]*[0-9]+:[ \t]+[A-Za-z].*[0-9]+:[ \t]+[A-Za-z]/m;

    when('[t0] the captured pane is read', () => {
      then('🔴 it holds BOTH shapes — or this whole case proves naught', () => {
        expect(plain()).toMatch(/1: Bad/);
        expect(plain()).toMatch(/0: Dismiss/);
        expect(plain()).toMatch(/I'm blocked on one/);
      });

      then('the blocker names a cure only a human can apply', () => {
        // the discriminator against a clone that merely reports a hurdle: it
        // asks to be MOVED, which no keystroke into its own box achieves.
        expect(plain()).toContain('drop me back at the worktree root');
      });
    });

    when('[t1] the plea arms are run over that pane', () => {
      then('arm 4 matches, and it matches on the SURVEY row', () => {
        const hit = plain()
          .split('\n')
          .filter((line) => ARM4.test(line));
        expect(hit.length).toBeGreaterThan(0);
        expect(hit.every((line) => line.includes('Dismiss'))).toEqual(true);
      });

      then(
        '🔴 the blocker sentence matches NO arm — the classifier is blind to it',
        () => {
          const blocker = plain()
            .split('\n')
            .filter((line) => /I'm blocked on one/.test(line));
          expect(blocker.length).toBeGreaterThan(0);
          // every literal the shell arm carries, over the blocker line alone.
          const arms = [
            /Do you want to (proceed|make this edit|create)/,
            /requires approval/,
            /Chat about this/,
            /this session to help/,
            /\(Recommended\)/,
            /^[ \t]*[❯>][ \t]*[0-9]+\.[ \t]+[A-Za-z]/,
            ARM4,
          ];
          for (const line of blocker)
            for (const arm of arms) expect(arm.test(line)).toEqual(false);
        },
      );
    });

    when('[t2] the shell arm is read from source', () => {
      then('arm 4 is still the colon-joined pattern transcribed above', () => {
        const src = getShellLibWhole({ path: join(__dirname, 'crewwork.sh') });
        const at = src.indexOf('__crew_pane_has_plea() {');
        expect(at).toBeGreaterThan(-1);
        const region = src.slice(at, src.indexOf('\n}\n', at));
        expect(region).toContain(
          '[0-9]+:[[:space:]]+[A-Za-z].*[0-9]+:[[:space:]]+[A-Za-z]',
        );
      });

      then('the header still states WHY the survey earns its own arm', () => {
        // the comment is what stops a later tighten from a fold of arm 4 into
        // arm 3 — a trade of a false positive for a false negative, which the
        // header itself records as the reason the arm was split out.
        const src = getShellLibWhole({ path: join(__dirname, 'crewwork.sh') });
        expect(src).toContain('why the survey is its OWN arm');
      });
    });
  });
});
