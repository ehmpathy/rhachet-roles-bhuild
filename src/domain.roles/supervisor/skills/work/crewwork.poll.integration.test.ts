/**
 * .what = clamps on what the poll RENDERS — the tree shape, stones, scopes, rows, seats
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
  // .what = is this canon structurally a CREW TREE at all? the one test every
  //         subject-set arm must apply before it mints a crew from a name.
  //
  // 🔴 .why = it was an INLINE condition in exactly one of the poll's three
  //    derivation arms, so the other two could not share it and one of them
  //    silently did not. the rule is about the NAME, so it belongs to whatever
  //    reads a name — which is why it is lifted here and clamped here.
  //
  //    every real crew tree in this fleet is `<repo>.beav.<fix|feat>-<slug>`.
  //    tmux forbids a literal dot in a session name, so the raw session always
  //    carries an underscore where the dot belongs, and `__crew_canon` restores
  //    it. ⇒ a canon with NO dot at all was never a crew: it is a bare branch
  //    name, or a stray session that merely happens to hold a slash (task #46).
  //
  // 🔴 .the measured cost of its absence from the registry arm, 2026-09-15:
  //    three leftover keyrack-probe rows —
  //        ~/.ductwork/ducts/main/keyprobe.json
  //        ~/.ductwork/ducts/main/keytest.json
  //        ~/.ductwork/ducts/main/keytest2.json
  //    minted a crew named `main` on every sweep. `--healable` then emitted
  //    `rhx git.crew.heal --tree main --who mechanic --mode apply` for SEVEN
  //    consecutive ticks; each run printed three lines, cured naught, exited 0.
  //    a permanent dead row in an actionable set teaches a supervisor to eyeball
  //    that set — the exact habit rule.always.poll-the-fell-and-heal-sets exists
  //    to prevent.
  //
  // .teeth = t0 is the measured phantom and MUST echo empty. under the pre-cure
  //          registry arm there was no predicate to call at all, and `main`
  //          entered the subject set unconditionally.
  given('[case19] the crew-tree structural test', () => {
    when(
      '[t0] `main` — the measured phantom: a bare branch name, no dot',
      () => {
        const result = useBeforeAll(async () =>
          runCrew({
            // 🔴 the DECLARED probe rides along on purpose. an `echoes empty`
            //    assertion passes vacuously when the function does not exist —
            //    an absent command substitutes to the empty string, so
            //    `RESULT[]` is exactly what a MISSING predicate prints. that is
            //    a clamp with no teeth on the one case that matters most (the
            //    #91 lesson: a clamp that green-passes under the un-fixed tool
            //    proves naught). so the verdict is asserted beside the fact that
            //    a predicate rendered it.
            command: `printf 'DECLARED[%s]' "$(declare -F __crew_is_crew_tree >/dev/null && printf yes || printf no)"; printf 'RESULT[%s]' "$(__crew_is_crew_tree "main")"`,
          }),
        );
        then('a predicate exists to render the verdict', () => {
          expect(result.stdout).toContain('DECLARED[yes]');
        });
        then('it is NOT a crew tree — echoes empty', () => {
          expect(result.stdout).toContain('RESULT[]');
        });
      },
    );

    when('[t1] a real dotted crew tree, as the ledger holds it', () => {
      const result = useBeforeAll(async () =>
        runCrew({
          command: `printf 'RESULT[%s]' "$(__crew_is_crew_tree "rhachet-roles-bhrain.beav.feat-peer-review-parallelism")"`,
        }),
      );
      then('it IS a crew tree — echoes 1', () => {
        expect(result.stdout).toContain('RESULT[1]');
      });
    });

    when(
      '[t2] the same tree in tmux form — underscores where the dots belong',
      () => {
        const result = useBeforeAll(async () =>
          runCrew({
            // ⚠️ `__crew_canon_name` is crewwork's converter; `__crew_canon` is
            //    the poll's. two functions, one body (`${1//_/.}`), two files —
            //    so a test that sources crewwork alone can only reach the former.
            //    the poll's arm 3 canonicalizes with its own before it calls this
            //    predicate, so both paths pass a dotted canon either way.
            command: `printf 'RAW[%s]' "$(__crew_is_crew_tree "svc-reservations_beav_feat-spot-forecast-widget")"; printf 'CANON[%s]' "$(__crew_is_crew_tree "$(__crew_canon_name "svc-reservations_beav_feat-spot-forecast-widget")")"`,
          }),
        );
        then('it IS a crew tree once canonicalized — echoes 1', () => {
          expect(result.stdout).toContain('CANON[1]');
        });
        then(
          'a RAW tmux-form name reads as NOT a crew — so every arm must convert first',
          () => {
            // 🔴 this is the MISS direction, and it is the expensive one. the
            //    predicate keys on the dot, and a raw tmux name holds none — so a
            //    call site that forgets to canonicalize would drop EVERY grove crew
            //    out of the subject set and the poll would render an empty fleet.
            //    the caveat is stated in the predicate's header; this pins it.
            expect(result.stdout).toContain('RAW[]');
          },
        );
      },
    );

    when(
      '[t3] an empty name — no arm should ever mint a crew from naught',
      () => {
        const result = useBeforeAll(async () =>
          runCrew({
            // the same DECLARED probe as t0, for the same reason
            command: `printf 'DECLARED[%s]' "$(declare -F __crew_is_crew_tree >/dev/null && printf yes || printf no)"; printf 'RESULT[%s]' "$(__crew_is_crew_tree "")"`,
          }),
        );
        then('a predicate exists to render the verdict', () => {
          expect(result.stdout).toContain('DECLARED[yes]');
        });
        then('it is NOT a crew tree — echoes empty', () => {
          expect(result.stdout).toContain('RESULT[]');
        });
      },
    );

    // 🔴 .why t4 and t5 exist, measured 2026-09-16
    //    t0-t3 clamp the PREDICATE. they say naught about which arms CALL it,
    //    and the header above enumerated three arms — the poll's — as though
    //    that were every arm that reads a name. `crew.ledger backfill` holds
    //    two more, and neither screened.
    //
    //    ⚠️ the backfill's damage outranks the poll's, because it WRITES. a
    //    phantom in the poll dies with the process; a phantom the backfill
    //    seeds is a durable ledger row, and arm 2 (`✔ by construction`) then
    //    hands it back to every later sweep through a path marked safe.
    //
    //    the measured cost: one `--backfill` on a clean fleet printed exactly
    //    `📒 + main` and took a hand `--del main` to undo.
    //
    // .teeth = drop either `__crew_is_crew_tree` guard in `crew.ledger
    //          backfill` and its case goes red on `+ main`. the real tree in
    //          each case is the COUNTER-clamp: the screen must refuse a bare
    //          branch name without also refusing every crew.
    when(
      '[t4] backfill, live-tmux arm — a bare `main/mechanic` beside a real crew',
      () => {
        const result = useBeforeAll(async () =>
          runCrew({
            // DUCTWORK_DIR is aimed at an absent path on purpose: it isolates the
            // tmux arm from the registry arm, so a red here names ONE of them.
            // left unset it defaults to $HOME/.ductwork — the operator's real
            // registry, inside a hermetic clamp (rule.require.hermetic-tests).
            command: `DUCTWORK_DIR="$PWD/no-such-registry" crew.ledger backfill`,
            sessions: [
              'main/mechanic',
              'svc-reservations_beav_feat-spot-forecast-widget/mechanic',
            ],
          }),
        );
        then('the bare branch name is NOT seeded', () => {
          expect(result.stdout).not.toContain('+ main');
        });
        then(
          'the real crew beside it IS seeded — the screen refuses one, not both',
          () => {
            expect(result.stdout).toContain(
              '+ svc-reservations.beav.feat-spot-forecast-widget',
            );
          },
        );
        then('and exactly one row was seeded', () => {
          expect(result.stdout).toContain('1 seeded');
        });
      },
    );

    when(
      '[t5] backfill, duct-registry arm — the measured `ducts/main/*.json` litter',
      () => {
        const result = useBeforeAll(async () =>
          runCrew({
            // the registry shape is `<DUCTWORK_DIR>/ducts/<tree>/<role>.json`, and
            // `main/keyprobe.json` is the real litter a keyrack probe left behind
            // (measured 2026-09-15). sessions are left empty so a red here names
            // the registry arm alone.
            //
            // 🔴 the registry lives in the run's OWN temp dir (beside the call
            //    log), never under $PWD: the driver's cwd is the repo root, so a
            //    `$PWD/registry` once left `registry/ducts/...` in the repo, where
            //    it got staged (rule.require.hermetic-tests)
            command: [
              'R="$(dirname "$CREW_TEST_LOG")/registry"',
              'mkdir -p "$R/ducts/main" "$R/ducts/test-fns_beav_feat-tempdir-autoprune"',
              'printf "{}" > "$R/ducts/main/keyprobe.json"',
              'printf "{}" > "$R/ducts/test-fns_beav_feat-tempdir-autoprune/mechanic.json"',
              'DUCTWORK_DIR="$R" crew.ledger backfill',
            ].join('; '),
            sessions: [],
          }),
        );
        then('the litter row does NOT mint a crew', () => {
          expect(result.stdout).not.toContain('+ main');
        });
        then('the real registry row beside it IS seeded', () => {
          expect(result.stdout).toContain(
            '+ test-fns.beav.feat-tempdir-autoprune',
          );
        });
        then('and exactly one row was seeded', () => {
          expect(result.stdout).toContain('1 seeded');
        });
      },
    );

    // 🔴 .what = the bare read NAMES THE GROVE of every row it prints.
    //
    // .why  = the ledger is the ONLY source that outlives a session, and the
    //         grove is the half that matters once a crew is DOWN. a live tmux
    //         session proves where a crew is at work; a down crew has none, so
    //         nought is left to prove it — which is what `__crew_ledger_rows`
    //         says in its own `.why`, one function above the render.
    //
    //    🔴 measured 2026-09-20, mid babysit tick. the poll named 4 `💀 NO
    //       DUCT` trees and, in the same render, `⚠️ RETIRED: grove-sandpine-
    //       v20260810 — crews named on it are ORPHANS on a box that is gone`.
    //       which cure each orphan takes is decided ENTIRELY by the box it
    //       names: a boot onto the retired grove exits 2, and a boot onto a
    //       grove at 14% free ram is a provision call a human owns. the
    //       ledger holds that column, printed a bare list of names, and so
    //       the one read that could settle it answered a different question.
    //
    //    ⇒ `__crew_ledger_rows` already emits `<tree>\t<grove>` and sits
    //      directly beside `__crew_ledger_list` in the same file. the column
    //      was derived the whole time — the render dropped it on the way up
    //      (term=partial-audit: a subject set narrower than the claim).
    //
    // .teeth = point `crew.ledger read` back at `__crew_ledger_list` and the
    //          two 🔴 blocks below go red — the names still print, no grove does.
    when('[t6] the bare read, over rows on two DIFFERENT groves', () => {
      const result = useBeforeAll(async () =>
        runCrew({
          command: 'crew.ledger',
          ledger: [
            {
              tree: 'svc-lessons.beav.feat-a',
              grove: 'cloud://grove-sandpine-v20260901',
            },
            { tree: 'svc-lessons.beav.feat-b', grove: 'local' },
          ],
          sessions: [],
        }),
      );

      then(
        'it still names every tree — the extant contract is untouched',
        () => {
          expect(result.stdout).toContain('svc-lessons.beav.feat-a');
          expect(result.stdout).toContain('svc-lessons.beav.feat-b');
        },
      );

      then(
        '🔴 it names the GROVE of each — the half a DOWN crew is asked about',
        () => {
          expect(result.stdout).toContain('cloud://grove-sandpine-v20260901');
        },
      );

      then(
        '🔴 and it PAIRS them — a grove on a row of its own settles naught',
        () => {
          // .why = two names and two groves, printed apart, read as a SET and
          //        never as a MAP. the question that fires this read is "which
          //        box does THIS tree name", so the pair must share a line or
          //        the render answers a question the caller did not ask.
          const lines = result.stdout.split('\n');
          const lineA = lines.find((l) =>
            l.includes('svc-lessons.beav.feat-a'),
          );
          const lineB = lines.find((l) =>
            l.includes('svc-lessons.beav.feat-b'),
          );
          expect(lineA).toBeDefined();
          expect(lineB).toBeDefined();
          expect(lineA).toContain('cloud://grove-sandpine-v20260901');
          // the local row is asserted on its OWN line, never against the whole
          // stdout: `local` is a common word, and a bare `toContain` over the
          // render would pass on a banner that merely used it in prose
          expect(lineB).toContain('local');
        },
      );
    });
  });

  /**
   * .what = the star scope's read of an eco.priority json body — and above all
   *         the TRUNCATED body, which parses as neither absent nor valid.
   *
   * .why  = a truncated body still begins with `{`, so an `^{` grep passes it
   *         and the unreadable branch never fires. then every jq below it dies
   *         under `2>/dev/null` — `.priorities | length` among them — so the
   *         count reads EMPTY rather than a number, and a `rows > 0`
   *         precondition excludes the exact case it was written to catch.
   *
   * 🔴 .the harm is a RUNNABLE DESTRUCTIVE COMMAND, never a blank screen.
   *     with jq dead the sponsored set reads empty, so every funded star is
   *     re-classified an unsponsored INFLIGHT anomaly — and each anomaly row
   *     emits `rhx git.crew.fell --tree <t>`. a truncated read therefore hands
   *     the supervisor a list of commands to fell FUNDED work, with no tell
   *     that the verdict is wrong (term=false-report).
   *
   *     .measured 2026-09-16: `0 shown / 40 hidden / 28 anomaly` against a
   *     store that read `count: 45` with 6 sponsored throughout. it fired
   *     again live on 2026-09-16's later tick, which is what bought this clamp.
   *
   * .the fixture is CAPTURED, never hand-typed — a 65606-byte render whose json
   *  body is cut at 65536 bytes = 64 KiB = the linux pipe buffer, so the cause
   *  is an unchecked short write, never the store (seeded foreign at
   *  ehmpathy/rhachet#535). the capture was the expensive half and it is rare —
   *  ~1 read in 3 under load, naught at rest.
   *
   *  ⚠️ org names in the capture were swapped for placeholders before publish,
   *  which moved the bytes; the body was re-cut at the same 64 KiB boundary, so
   *  the tooth — a plausible json prefix of exactly one pipe buffer — holds
   *
   * 🔴 .see also — THIS CASE SPANS BOTH SEATS, and it is the only one that does.
   *  the fixture is a `rhx eco.priority get` render, so the shape it pins is the
   *  PRIORITIZER's, while the classifier under test and the fixture file both
   *  live at the SUPERVISOR. no contract stands between them:
   *
   *  | side | what it owns |
   *  |------|--------------|
   *  | `role=prioritizer` | `eco.priority.sh` — the json this fixture captures |
   *  | `role=supervisor`  | `git.crew.poll.sh`'s star scope — the reader |
   *
   *  ⇒ the dependency is REAL and it is not a scope leak: the supervisor reads
   *  its peer's stdout as a subprocess, which is the sanctioned seam. what is
   *  absent is a declared shape, so a prioritizer-side render change breaks a
   *  supervisor-side classifier with no compile error and no shared type.
   *
   *  ⚠️ and the fixture's HOME is correct as it sits, per
   *  `testFixtures.integration.test.ts:76-82` — *a fixture belongs to whoever
   *  reads it, never whoever it is named after*. do not move it to the
   *  prioritizer to tidy the name; that would put a supervisor test's input at a
   *  seat the supervisor may not reach into (`roleBoundaries[case3]`).
   *
   *  ⇒ raised by peer `arch-smell-scopeleaks`'s lens at i004 as a soft edge
   *  worth a note. the note is this block; a declared render contract is a
   *  separate, larger change than the lift.
   */
  given('[case29] an eco.priority json body read by the star scope', () => {
    const PATH_TRUNCATED = join(
      __dirname,
      '.test/.assets/eco.priority.get.truncated-body.log',
    );

    /**
     * 🔴 THE TOOTH. the body under test is the real captured truncation, and
     *    the whole defect is that it looks valid to every cheap test: it is
     *    non-empty, it starts with `{`, and it is 65 KB of real json.
     */
    when('[t0] the body is the CAPTURED truncated render', () => {
      const result = useBeforeAll(async () =>
        runCrew({
          command: [
            `__body="$(grep -m1 '^{' '${PATH_TRUNCATED}')"`,
            'printf "LEN[%s]\\n" "$(printf "%s" "$__body" | wc -c)"',
            'printf "STARTS[%s]\\n" "${__body:0:1}"',
            'printf "VERDICT[%s]\\n" "$(__crew_eco_star_verdict "$__body")"',
          ].join('\n'),
        }),
      );

      then('the fixture is the real one — the clamp is not vacuous', () => {
        expect(result.stdout).toContain('LEN[65536]');
      });

      then('it STARTS with `{`, which is why the cheap guard passes it', () => {
        expect(result.stdout).toContain('STARTS[{]');
      });

      then('it is classified TRUNCATED, so the caller halts', () => {
        expect(result.stdout).toContain('VERDICT[truncated]');
      });

      then(
        'it is NOT classified as a row count — a zero would read as a verdict',
        () => {
          expect(result.stdout).not.toContain('VERDICT[rows=');
        },
      );
    });

    when('[t1] the body is absent entirely', () => {
      const result = useBeforeAll(async () =>
        runCrew({
          command: 'printf "VERDICT[%s]\\n" "$(__crew_eco_star_verdict "")"',
        }),
      );

      then('it is classified unreadable, never truncated', () => {
        expect(result.stdout).toContain('VERDICT[unreadable]');
      });
    });

    /**
     * ⚠️ the GREEN arm. a valid body must yield its count and NEVER halt, or
     *    the guard is a permanent refusal rather than a detector.
     */
    when('[t2] the body is a valid render with rows', () => {
      const result = useBeforeAll(async () =>
        runCrew({
          command:
            `printf "VERDICT[%s]\\n" "$(__crew_eco_star_verdict ` +
            `'{"verb":"get","priorities":[{"slug":"a"},{"slug":"b"},{"slug":"c"}]}')"`,
        }),
      );

      then('it yields the row count', () => {
        expect(result.stdout).toContain('VERDICT[rows=3]');
      });
    });

    /**
     * ⚠️ a store with zero rows is a real, VALID state — a fleet with no
     *    priorities yet. it must read as a count, never as a failure, or the
     *    guard refuses a correct store forever.
     */
    when('[t3] the body is a valid render with ZERO rows', () => {
      const result = useBeforeAll(async () =>
        runCrew({
          command:
            `printf "VERDICT[%s]\\n" "$(__crew_eco_star_verdict ` +
            `'{"verb":"get","priorities":[]}')"`,
        }),
      );

      then('zero is a COUNT, never a failure', () => {
        expect(result.stdout).toContain('VERDICT[rows=0]');
        expect(result.stdout).not.toContain('truncated');
      });
    });

    /**
     * ⚠️ TOOTH. the predicate can be perfect and the defect remain: what it
     *    actually was, is a caller that counted before it parsed. so the clamp
     *    reads the call site, and asserts the poll routes through the shared
     *    predicate rather than an inline jq of its own.
     */
    when('[t4] the poll is read from source', () => {
      const src = readPollWhole();

      then('it routes the classification through the shared predicate', () => {
        expect(src).toContain('__crew_eco_star_verdict');
      });

      then(
        'it halts on BOTH failure verdicts, never only the absent one',
        () => {
          expect(src).toContain('"$__eco_verdict" == "unreadable"');
          expect(src).toContain('"$__eco_verdict" == "truncated"');
        },
      );

      then('it no longer derives the row count from its own jq', () => {
        expect(src).not.toContain(
          `__eco_rows="$(printf '%s' "$__eco_json" | jq`,
        );
      });
    });

    /**
     * 🔴 THE CURE, and its tooth. every arm above CLASSIFIES a truncated body;
     *    this one asserts the body can no longer BE truncated.
     *
     *    the cut is an unchecked short write to a pipe: node's stdout is
     *    ASYNCHRONOUS when fd 1 is a pipe and SYNCHRONOUS when it is a regular
     *    file, so the producer that exits before its drain loses the remainder
     *    through a pipe and loses naught through a file.
     *
     *    measured 2026-09-16, 8 reads per shape on a 688%-cpu grove:
     *      pipe-to-grep    1 of 8 cut at 65537 bytes
     *      file-then-grep  0 of 8 cut
     *
     *    ⚠️ it cannot be clamped by a RUN — the defect is intermittent and
     *      load-bound, so a green run proves naught. what IS deterministic is
     *      the SHAPE of the read, so that is what the clamp pins. revert the
     *      reader to the pipe form and [t5] goes red on every box.
     */
    when('[t5] the eco read is read from source', () => {
      const src = readPollWhole();
      const lib = getShellLibWhole({ path: join(__dirname, 'crewwork.sh') });

      then(
        'the poll reads through the shared reader, never its own pipe',
        () => {
          expect(src).toContain('__eco_json="$(__crew_eco_json_read)"');
          expect(src).toContain('__eco_json2="$(__crew_eco_json_read)"');
        },
      );

      then('NOT ONE read site pipes eco.priority into grep', () => {
        // 🔴 .teeth = this is the exact line the cure replaced, at both sites.
        //    restore either one and this arm goes red, on any box, every run.
        expect(src).not.toContain(
          'rhx eco.priority get --output json 2>/dev/null |',
        );
      });

      then('the reader redirects to a FILE rather than a pipe', () => {
        expect(lib).toContain('rhx eco.priority get --output json >"$file"');
      });

      then('the reader cleans up the file it made', () => {
        expect(lib).toContain('rm -f "$file"');
      });
    });
  });

  /**
   * .what = the ⭐ star scope's treatment of a tree it EXCLUDES.
   *
   * .why  = `define.invariant.crew.inflight-implies-sponsored` states the
   *         operative contrapositive — ¬sponsored ⟹ ¬inflight — and its tool
   *         clause is explicit: "an unsponsored-inflight tree is NOT silently
   *         dropped. the default scope hides unsponsored trees that are IDLE;
   *         an unsponsored tree that is INFLIGHT violates the invariant, so it
   *         is surfaced as an ANOMALY — a row flagged ⚠️ — to settle."
   *
   *         that clause was never implemented. the filter folded EVERY excluded
   *         tree into one `N non-star crew(s) hidden` count, idle and inflight
   *         alike.
   *
   *         measured 2026-09-15:
   *         rhachet-roles-ehmpathy.beav.feat-require-commit-sponsor rendered in
   *         no default poll, held 6 live ducts, and carried a HUMAN GATE
   *         (`--as overruled`). `.eco` holds no row naming it, so it is
   *         genuinely unsponsored AND inflight — cause (a), settled by a read
   *         of the store rather than a guess off the instrument under test.
   *
   *         the harm is not a wrong verdict. it is an ABSENT one that the tally
   *         reports as health, and a gate on a tree the default read cannot see
   *         goes unrelayed on every tick (term=partial-audit).
   *
   * .teeth = the discriminator must be LIVENESS, never mere membership. every
   *          tree in the sweep is in the ledger, so a membership test would
   *          flag all of them. `DISPLAY[]` is populated by arm 1 alone — the
   *          live-tmux derivation — so it means "holds a slot", which is what
   *          the invariant's .why is about: "every slot an unfunded tree holds
   *          is one a funded star cannot have".
   *
   *          a STATIC source clamp, on purpose: no behavioral poll harness
   *          exists yet (task #59), and a clamp that waits on one is a clamp
   *          that never lands.
   */
  given('[case22] the star scope, reading a tree it excludes', () => {
    // 🔴 bounded by a MARKER, never a character count.
    //    this read `src.slice(at, at + 3000)` until 2026-09-16. the star block
    //    sits between the two markers below, and a fixed window is a
    //    magic value that silently SHRINKS the clamp: any line added upstream
    //    inside the window pushes the real subjects out of the slice, and the
    //    assertions then grade prose that happens to sit in the first 3000
    //    characters.
    //
    //    measured: a 5-line halt message added to the eco-truncation guard —
    //    upstream of the filter, and unrelated to it — pushed `__star_trees`
    //    and `DISPLAY[` past the boundary and turned two live assertions red
    //    for a cure neither of them grades. the slice must track the BLOCK.
    const starFilter = (() => {
      const src = readPollWhole();
      const at = src.indexOf('STAR_HIDDEN=0');
      // ⚠️ search the end marker FROM `at`. the same `TREES=("${KEPT[@]}")` line
      //    closes the earlier --only filter too, so a bare indexOf finds THAT
      //    one, yields end < at, and `slice` then returns '' — three assertions
      //    green-to-red against an empty subject rather than a real defect.
      const end = src.indexOf('TREES=("${KEPT[@]}")', at);
      return at < 0 || end < 0 ? '' : src.slice(at, end);
    })();

    when('[t0] the filter source is read', () => {
      then('the subject exists — the clamp is not vacuous', () => {
        expect(starFilter).toContain('STAR_HIDDEN');
        expect(starFilter).toContain('__star_trees');
      });

      then(
        'an excluded tree is tested for LIVENESS, not merely counted',
        () => {
          // .teeth = before the cure the else-arm held one statement and no
          //          other — `STAR_HIDDEN=$(( STAR_HIDDEN + 1 ))`.
          expect(starFilter).toContain('DISPLAY[');
        },
      );

      then('an excluded tree that IS live is recorded as an anomaly', () => {
        expect(starFilter).toContain('STAR_ANOMALY');
      });
    });

    when('[t1] the render source is read', () => {
      const src = readPollWhole();

      then('the anomaly is RENDERED, never merely collected', () => {
        // a count that is gathered and never printed is the same silence the
        // invariant forbids — it must reach the reader's eye.
        expect(src).toContain('${STAR_ANOMALY');
      });

      then('the anomaly ROW carries the ⚠️ the invariant names', () => {
        // the invariant's words are "a row flagged ⚠️". the flag rides the
        // HEADER — the line a reader's eye lands on — and the per-tree lines
        // indent beneath it as treestruct children. so the assertion is on
        // the header, never on every line that mentions the counter (the
        // `… N more` remainder reads the counter and is a continuation).
        const header = src
          .split('\n')
          .filter((line) => /echo /.test(line))
          .filter((line) => /ANOMALY:/.test(line));
        expect(header.length).toBeGreaterThanOrEqual(1);
        expect(header.filter((line) => !line.includes('⚠️'))).toEqual([]);
        expect(
          header.filter((line) => !line.includes('${STAR_ANOMALY')),
        ).toEqual([]);
      });

      then(
        'it names the tree, so the reader can act without a second sweep',
        () => {
          // guide, never classify: a bare count "1 anomaly" forces the reader
          // into `--all` to learn which tree. the tree name IS the cure path.
          const block = (() => {
            const at = src.indexOf('${STAR_ANOMALY');
            return at < 0 ? '' : src.slice(Math.max(0, at - 900), at + 900);
          })();
          expect(block).toContain('STAR_ANOMALY_TREES');
        },
      );
    });
  });

  // 🔴 .what = a 🔍 stone that outlived a FAILED arrive — the phantom review.
  //
  // .why  = it is the only false-healthy in this corpus that SUBTRACTS a read
  //    rather than withholds one. `🔍` is the verdict that tells a supervisor
  //    to leave a crew alone, so the miss actively routes attention AWAY from
  //    the tree that needs it. measured 2026-09-15 on FOUR captured panes —
  //    three cap panes and one husk, so the shape is not a cap artifact.
  //
  // ⚠️ .the JOIN is the cure, never the failure alone. a failed arrive under a
  //    `blocked ✋` or `yield 🌾` stone is no phantom — the stone already agrees
  //    with the pane. what harms is the DISAGREEMENT, and t0 clamps that.
  given('[case25] a 🔍 stone that outlived a failed arrive', () => {
    const src = readPollWhole();
    const duct = readFileSync(join(__dirname, '../duct.poll.sh'), 'utf8');

    when('[t0] the detect-and-persist path is read in duct.poll', () => {
      then('the detector is CALLED, not merely defined in ductwork', () => {
        expect(duct).toContain('__duct_pane_arrive_failed');
      });

      then('its value crosses the subshell boundary via a slot file', () => {
        // every worker runs in a `( … ) &` subshell, so a bare variable is
        // lost. the slot file IS the channel.
        expect(duct).toContain('$slot.arrivefail');
      });

      then(
        'a HUSK is excluded — it already renders `relic` for its stone',
        () => {
          const at = duct.indexOf('arrivefail=""');
          expect(at).toBeGreaterThan(-1);
          expect(duct.slice(at, at + 200)).toContain('"$box" != "husk"');
        },
      );

      // 🔴 THE TOOTH: the render must fire on the PAIR. a row keyed on the
      // failure alone would annotate a `blocked ✋` stone that agrees with its
      // pane — a blocker with no harm behind it
      // (rule.forbid.overzealous-blockers).
      then(
        'the row fires on the JOIN with a 🔍 stone, never on the failure alone',
        () => {
          expect(duct).toMatch(
            /if \[\[ -n "\$arrivefail" \]\] && \[\[ "\$stone" == \*'🔍'\* \]\]; then/,
          );
        },
      );
    });

    when('[t1] the consume path is read in git.crew.poll', () => {
      then('the subject exists — the clamp is not vacuous', () => {
        expect(src).toContain('CREW_ARRIVEFAIL');
      });

      then('the row is PARSED, never emitted-and-dropped', () => {
        // duct.poll renders this AFTER the box, so an arm that joins on `uri`
        // rather than `uri_block` drops it.
        //
        // ⚠️ asserted as ONE adjacent block, for the reason [case24] measured
        // by dogfood: `__crew_record_arrivefail` parses a token of its own, so
        // a loose text check can stay green with the poll arm renamed away.
        expect(src).toMatch(
          /\*'STONE vs PANE — the stone says a peer review is in flight'\*\)\s*\n\s*\[\[ -n "\$uri_block" \]\] \|\| continue\s*\n\s*__crew_record_arrivefail "\$uri_block" "\$line"/,
        );
      });

      then(
        'the FAILED COMMAND rides, so the reader can settle the contradiction',
        () => {
          // a bare flag says "this crew is off" and leaves the read unguided.
          expect(src).toContain(
            'CREW_ARRIVEFAIL["$(__crew_canon "$tree")"]+="${role}=${what}"',
          );
        },
      );

      then(
        'the map is pruned to the star scope, like its footer-iterated peers',
        () => {
          // without this, a star-scoped poll renders a star body over a footer
          // that names trees the scope excluded (rule.forbid.clipped-sweeps).
          expect(src).toContain("unset 'CREW_ARRIVEFAIL[$__k]'");
        },
      );
    });

    when('[t2] the crew STATUS is read', () => {
      then('this row does NOT override the status', () => {
        // 🔴 the tooth, and it holds for the OPPOSITE reason to [case24]'s.
        // that one abstains because the clone is genuinely at work; this one
        // abstains because the sweep CANNOT TELL — the contradiction says the
        // stone is untrustworthy, never what the true state is. to mint a
        // status off it trades one confident wrong verdict for another.
        expect(src).not.toContain('__has_arrivefail');
      });
    });

    // 🔴 THE GLYPH TOOTH, and it is a REGRESSION clamp on a defect this cure
    //    itself committed. the first draft rendered `👻 PHANTOM?` — and `👻` is
    //    already the glyph of `term=phantom` (a record whose subject is gone),
    //    which carries an OPEN dispute against `duct.box.ghost` besides.
    //
    //    it was caught by a PEER clamp, never by a glyph read: work.surface
    //    [case26] pins the ACTIONS order via `indexOf('ACTIONS+=("👻')`, so the
    //    second 👻 — emitted ABOVE phantom's — silently took the index that
    //    test meant for phantom, and the order assertion inverted.
    //
    // ⇒ so the lesson is clamped where it was broken: this row may not wear a
    //    glyph that is spoken for (im_an.obsessive_learner.for.domain.glyphs).
    when('[t2b] the glyph is read', () => {
      then(
        'the row does NOT wear 👻 — that glyph belongs to term=phantom',
        () => {
          const at = src.indexOf('STONE vs PANE —');
          expect(at).toBeGreaterThan(-1);
          expect(src.slice(at, at + 700)).not.toContain('👻');
        },
      );

      then('phantom keeps the FIRST 👻 in the ACTIONS order', () => {
        // the exact property [case26] asserts. held here too, so a future
        // reach for 👻 reddens in the file that made the mistake.
        const iFirst = src.indexOf('ACTIONS+=("👻');
        expect(iFirst).toBeGreaterThan(-1);
        expect(src.slice(iFirst, iFirst + 120)).toContain('phantom');
      });
    });

    when('[t3] the action row is read', () => {
      const row = (() => {
        const at = src.indexOf('⚠️ STONE vs PANE —');
        return at < 0 ? '' : src.slice(at, at + 700);
      })();

      then('the row exists and quotes the arrive that failed', () => {
        expect(row).toContain('${__awhat}');
      });

      then('it GUIDES — it names the misread it exists to prevent', () => {
        // 🔴 the non-vacuity assertion. the harm is that `🔍` reads as "leave
        // this crew alone", so the row must strike that read explicitly.
        expect(row).toContain('do NOT read this crew as busy');
        expect(row).toContain("the ROUTE's record, never proof a review runs");
      });

      then('it carries the runnable READ, addressed by tree and role', () => {
        // 🔴 the name is the CANON slug `${__at}`, and NEVER `DISPLAY[$__at]`
        //
        //   this assertion pinned the DISPLAY form, which is the very defect
        //   [case48] (work.surface) was written to cure: DISPLAY holds tmux's
        //   UNDERSCORED session name, and `--tree` resolves only the dotted
        //   slug. so the row it demanded emitted a command that cannot run.
        //
        //   ⚠️ the clamp OUTLIVED the cure. [case48] fixed the emitter and this
        //   assertion kept the pre-cure shape, so the suite went red over the
        //   CORRECT code — a clamp that argues for the defect is worse than an
        //   absent one, because its red reads as a real fault.
        //
        //   ⇒ conformed to [case48], which is the authority on this property:
        //     "one tree renders under ONE name — DISPLAY is a liveness set,
        //      never a label". met 2026-09-18.
        expect(row).toContain(
          'rhx git.crew.read --tree ${__at} --who ${__arole}',
        );
        expect(row).not.toContain('DISPLAY[$__at]');
      });

      then(
        'it offers NO re-arrive — that is the DRIVER\u2019s act, not a supervisor\u2019s',
        () => {
          // a supervisor who sent one would steer a clone past a permission key
          // (rule.forbid.steer-a-clone-beyond-a-permission-key). there is no cure
          // verb for this, and the row must not invent one.
          expect(row).not.toMatch(/rhx git\.crew\.send/);
          expect(row).not.toMatch(/route\.stone\.set/);
        },
      );
    });
  });

  // 🔴 .what = the FOOTER must never speak about a tree the BODY did not render.
  //
  // .why  = `--only` is what a supervisor reaches for when a human says "focus
  //    on this tree". measured 2026-09-15, `--only feat-peer-review-parallelism
  //    --all --stones` rendered ONE tree in the body and then emitted ~23 action
  //    rows about 12 trees the scope deliberately EXCLUDED. that is the
  //    clipped-sweep defect turned inside out (rule.forbid.clipped-sweeps): it
  //    over-reports rather than under-reports, and the ACTIONS rows are the part
  //    a reader is most likely to ACT on.
  //
  // ⚠️ .the mismatch is HALF-correct, which is what made it survive: the `🚦
  //    status` line honors the scope while the ACTIONS footer does not. a reader
  //    who checks one and trusts the other finds no seam.
  //
  // .the two parts, and the clamp bites on BOTH:
  //    a. the prune was gated on `$STAR`, so `--only` (which narrows TREES but
  //       leaves STAR false under `--all`) pruned not one map
  //    b. CREW_ESCALATION and CREW_COMPACT ITERATE the footer and were absent
  //       from the prune list — so they leaked even under star scope
  //
  // 🔴 .t1 is DERIVED from the source rather than a hardcoded list, on purpose.
  //    a named list is a clamp that goes stale the day someone adds map #11; a
  //    set-containment check over the iteration sites reddens itself.
  given('[case26] the footer scope must follow the body scope', () => {
    const src = readPollWhole();

    // the prune block, sliced by its own header down to the body render loop.
    // ⛔ no failhide: an absent block is a thrown constraint, never a silent
    // skip that would let this whole case pass green over a tool that lost its
    // prune entirely.
    const pruneBlock = (() => {
      const at = src.indexOf('── prune the footer aggregate maps');
      if (at < 0)
        throw new Error(
          'CONSTRAINT: the prune block header is absent from git.crew.poll.sh — ' +
            'either it was removed (the defect is back) or the header was reworded. ' +
            'read the file and re-anchor this clamp.',
        );
      const end = src.indexOf('for tree in "${TREES[@]}"', at);
      if (end < 0)
        throw new Error(
          'CONSTRAINT: the body render loop `for tree in "${TREES[@]}"` is absent ' +
            'after the prune block — this clamp cannot bound the block it grades.',
        );
      return src.slice(at, end);
    })();

    when('[t0] the prune GATE is read', () => {
      // 🔴 THE TOOTH for part (a). the gate must not hinge on STAR, because
      // `--only` narrows TREES without setting it.
      then('it does NOT hinge on $STAR — `--only` narrows TREES too', () => {
        expect(pruneBlock).not.toMatch(/"\$STAR" == "true"/);
      });

      then('it fires whenever the boxes sweep populated the maps', () => {
        expect(pruneBlock).toMatch(/if \[\[ "\$BOXES" == "true" \]\]; then/);
      });

      then('the kept set is built from TREES — the RENDERED set itself', () => {
        // keying the prune on TREES rather than on any one flag is what makes
        // it honor a future scope flag with no edit here.
        expect(pruneBlock).toMatch(
          /for t in "\$\{TREES\[@\]\}"; do __kept_tree\["\$t"\]=1/,
        );
      });
    });

    when('[t1] the footer-iterated maps are enumerated FROM the source', () => {
      const iterated = [
        ...new Set(
          [...src.matchAll(/for __[a-z]+ in "\$\{!(CREW_[A-Z]+)\[@\]\}"/g)].map(
            (m) => m[1],
          ),
        ),
      ].sort();

      const pruned = [
        ...new Set(
          [...pruneBlock.matchAll(/unset '(CREW_[A-Z]+)\[\$__k\]'/g)].map(
            (m) => m[1],
          ),
        ),
      ].sort();

      then('the enumeration found the footer loops at all', () => {
        // guards the regex itself: if this drops to 0 the set check below
        // passes vacuously, which is the failhide shape.
        expect(iterated.length).toBeGreaterThanOrEqual(6);
      });

      then('the two maps this defect was found in ARE footer-iterated', () => {
        expect(iterated).toContain('CREW_ESCALATION');
        expect(iterated).toContain('CREW_COMPACT');
      });

      // 🔴 THE TOOTH for part (b) — derived, so it cannot go stale.
      then('EVERY footer-iterated map is pruned', () => {
        expect(pruned).toEqual(expect.arrayContaining(iterated));
      });
    });

    when('[t2] the scope-SAFE maps are read', () => {
      // CREW_CAP and CREW_RATELIMIT are read by per-tree key lookup from INSIDE
      // the TREES loop, so they are scoped by construction. an earlier comment
      // in the tool named them as arrears from memory rather than from the
      // iteration sites — an over-named audit
      // (rule.require.enumerate-before-you-name). this clamps the correction.
      then('CREW_CAP is read by per-tree lookup, never iterated', () => {
        expect(src).toMatch(/\$\{CREW_CAP\[\$\(__crew_canon "\$tree"\)\]/);
        expect(src).not.toMatch(/for __[a-z]+ in "\$\{!CREW_CAP\[@\]\}"/);
      });

      then('CREW_RATELIMIT is read by per-tree lookup, never iterated', () => {
        expect(src).toMatch(
          /\$\{CREW_RATELIMIT\[\$\(__crew_canon "\$tree"\)\]/,
        );
        expect(src).not.toMatch(/for __[a-z]+ in "\$\{!CREW_RATELIMIT\[@\]\}"/);
      });

      then(
        'so the prune block does NOT unset them — they need no prune',
        () => {
          expect(pruneBlock).not.toContain('CREW_CAP[$__k]');
          expect(pruneBlock).not.toContain('CREW_RATELIMIT[$__k]');
        },
      );

      // 🔴 THE TOOTH on my own mistake. the block's prose CLAIMED these two
      // "each iterate the footer" — read off memory, never off the iteration
      // sites. a false claim in a tool comment sends the next reader to prune
      // two maps that need no prune, and costs them the read to find out.
      then(
        'where the block names them, it names them as per-tree LOOKUPS',
        () => {
          const at = pruneBlock.indexOf('CREW_CAP');
          expect(at).toBeGreaterThan(-1);
          expect(pruneBlock.slice(at, at + 260)).toMatch(
            /per-tree|by key|lookup/,
          );
        },
      );

      then('the block does NOT claim they iterate the footer', () => {
        expect(pruneBlock).not.toMatch(
          /CREW_RATELIMIT[\s\S]{0,80}iterate the footer/,
        );
      });
    });

    when('[t3] the block DECLARES what it prunes and why', () => {
      then('it names the inside-out clipped-sweep it prevents', () => {
        expect(pruneBlock).toContain('rule.forbid.clipped-sweeps');
      });

      then(
        'it records the `--live` arrear rather than leaving it unsaid',
        () => {
          // --live filters per-row INSIDE the body loop, so TREES still holds the
          // skipped trees and the footer can still speak about them. the repair
          // ripples into the render loop, so it is deferred and NAMED, never
          // smuggled (rule.always.fix-forward-under-scouts-honor).
          expect(pruneBlock).toContain('--live');
        },
      );
    });
  });

  // .what = the stone label's OWNER glyph. `👋` is the human-owned marker, and the
  //         route prints it for two unrelated halts — `judge, approved?` (a human's,
  //         by rule.forbid.self-grant-human-gates) and `exhausted` (a spent review
  //         budget, which is the DRIVER's lane). so the glyph cannot carry the
  //         split, and the render must assign it from OWNERSHIP (task #88).
  //
  // .teeth = measured 2026-09-15 on rhachet-roles-bhrain.beav.feat-prescribed-brain-
  //          per-stone. the poll rendered
  //            🗿 mechanic: 5.1.execution.from_vision, review.peer, l3@i006, exhausted 👋
  //          while the pane, the same instant, showed the driver had ALREADY spent
  //          its own lever ("Budget extended to 9") and re-arrived — a spinner, a
  //          timer that advanced, a token counter that rose.
  //
  //          🔴 THE DEFECT IS THE GLYPH, not the word. `exhausted` was true at the
  //          last SETTLED transition, so the word is honest. but 👋 points a reader
  //          at a human, and the only lever that read leaves open is a budget
  //          top-up — which the tick procedure forbids outright
  //          (rule.forbid.budget-top-ups). so the render asks a human for an act
  //          no human owns, and whose real owner had already performed it.
  //
  //          this is task #21 INVERTED: there, the ✋ tally was labelled "the
  //          driver's" and held human-only cures. here, a lane wears the HUMAN
  //          glyph while its cure is driver-owned and already spent. one root —
  //          the glyph was assigned from the phase word, never from the owner.
  //
  //          under the un-fixed tree __crew_stone_owner_glyph does not exist, so
  //          every RESULT below is empty and t0 FAILS.
  //
  // .fixture = the stone labels are [case14]'s already-captured constants, reused
  //          verbatim so the two cases cannot drift apart. a stone label is one
  //          duct.poll line, not a pane, so it takes no .assets log — the pane
  //          convention (rule.always.clamp-the-verbatim-pane-your-classifier-judged)
  //          governs multi-line pane captures, and [case14] set this precedent.
  given('[case27] the stone label owner glyph', () => {
    const STONE_EXHAUSTED =
      '5.1.execution.from_vision, review.peer, l3@i006, exhausted 👋';
    const STONE_APPROVED = '1.vision, judge, approved? 👋';
    const STONE_BLOCKED = '1.vision, review.peer, l1@i023, blocked ✋';
    // a narrow pane truncates the verdict token off the END of a stone, which is
    // the shape the ✂️ clipped bucket exists for (git.crew.poll.sh:2621). a
    // clipped label carries NO glyph, so there is naught to reassign — and the
    // render must not invent one.
    const STONE_CLIPPED =
      '5.1.execution.from_vision, review.peer, l3@i006, exha';

    when(
      "[t0] an `exhausted` halt — a spent review budget, the DRIVER's lane",
      () => {
        const result = useBeforeAll(async () =>
          runCrew({
            command: `printf 'RESULT[%s]' "$(__crew_stone_owner_glyph "${STONE_EXHAUSTED}")"`,
          }),
        );

        then("it wears the driver's 🌙, never the human's 👋", () => {
          // 🌙 is not a coinage — it is the form the upstream route already prints
          // for a spent lane (4 independent captures in the learner progress log).
          // so this aligns the render with a glyph the corpus already carries.
          expect(result.stdout).toContain('exhausted 🌙');
        });

        then('the 👋 is gone, so no reader is pointed at a human', () => {
          // ⚠️ ANCHORED on purpose. a bare `not.toContain` passes VACUOUSLY when the
          // helper is absent and RESULT is empty — measured here: this was the one
          // green among 7 reds on the first run, which is the failhide shape the
          // suite forbids (rule.forbid.failhide). the positive companion makes the
          // absence of 👋 provable only over a label that is actually present.
          expect(result.stdout).toContain('exhausted');
          expect(result.stdout).not.toContain('👋');
        });

        then(
          'every other token is untouched — the phase, the lane, the word',
          () => {
            // the tally keys on the PHASE token and never on the glyph
            // (git.crew.poll.sh:2600), so a glyph swap must leave each keyed token
            // byte-identical or it moves a count it was never meant to touch.
            expect(result.stdout).toContain('5.1.execution.from_vision');
            expect(result.stdout).toContain('review.peer');
            expect(result.stdout).toContain('l3@i006');
            expect(result.stdout).toContain('exhausted');
          },
        );
      },
    );

    when('[t1] a REAL human gate — `judge, approved?`', () => {
      const result = useBeforeAll(async () =>
        runCrew({
          command: `printf 'RESULT[%s]' "$(__crew_stone_owner_glyph "${STONE_APPROVED}")"`,
        }),
      );

      then(
        'its 👋 SURVIVES — the one direction this must never fail in',
        () => {
          // 🔴 THE SAFETY CLAMP. `--as approved` is human-only by
          // rule.forbid.self-grant-human-gates, so to strip this 👋 would HIDE a
          // gate only a human can clear. the asymmetry runs one way: a surplus 👋
          // costs one glance, an absent one parks a ⭐ tree indefinitely.
          expect(result.stdout).toContain('approved? 👋');
        },
      );
    });

    when('[t2] an on-defect `blocked ✋` halt', () => {
      const result = useBeforeAll(async () =>
        runCrew({
          command: `printf 'RESULT[%s]' "$(__crew_stone_owner_glyph "${STONE_BLOCKED}")"`,
        }),
      );

      then(
        "it passes through verbatim — ✋ is already the driver's glyph",
        () => {
          expect(result.stdout).toContain('blocked ✋');
        },
      );
    });

    when('[t3] a CLIPPED label whose verdict token was truncated away', () => {
      const result = useBeforeAll(async () =>
        runCrew({
          command: `printf 'RESULT[%s]' "$(__crew_stone_owner_glyph "${STONE_CLIPPED}")"`,
        }),
      );

      then('it invents no glyph — an unreadable stone stays unreadable', () => {
        expect(result.stdout).toContain('l3@i006, exha');
        expect(result.stdout).not.toContain('🌙');
        expect(result.stdout).not.toContain('👋');
      });
    });

    when(
      '[t4] every stone RENDER SITE in the poll routes through the helper',
      () => {
        const src = readPollWhole();

        then(
          'no render site emits the raw label — DERIVED, so a new site bites',
          () => {
            // 🔴 the tooth that outlives this cure. the poll renders the stone in TWO
            // places (the compact status block and the at-work box block), and a
            // third added later would silently reintroduce the human glyph. so assert
            // over the DERIVED set of render sites rather than over two known lines:
            // a new `🗿 <role>:` echo with a raw `${__rs#*=}` reddens this.
            const rendered = [
              ...src.matchAll(/🗿 \$\{__rs%%=\*\}: ([^"]+)"/g),
            ].map((m) => m[1]);
            // anti-vacuity: the poll has two stone render sites. a regex that matched
            // none would pass the containment check below on an empty set — the
            // failhide shape this suite forbids (rule.forbid.failhide).
            expect(rendered.length).toBeGreaterThanOrEqual(2);
            for (const expr of rendered) {
              expect(expr).toContain('__crew_stone_owner_glyph');
            }
          },
        );

        then(
          'the helper is DECLARED in crewwork, beside its ownership peer',
          () => {
            const lib = getShellLibWhole({
              path: join(__dirname, 'crewwork.sh'),
            });
            expect(lib).toContain('__crew_stone_owner_glyph()');
            // it reasons about who owns a halt, exactly as __crew_ondefect_moved
            // does, so the two belong in one neighbourhood rather than one in the
            // library and one inlined in the render.
            expect(lib).toContain('__crew_ondefect_moved()');
          },
        );
      },
    );
  });

  /**
   * [case49] the 🪦absent row's boot names the SEAT it found absent
   *
   * .what = the census row that names `<tree> / <role>` absent emits a
   *   `git.crew.boot` that carries `--roles <role>`.
   *
   * 🔴 .why — without it the command cures NAUGHT, and says it did
   *   `crew.boot` with no `--roles` ensures CREWWORK_ROLES_DEFAULT
   *   (crewwork.sh:151) = `mechanic,foreman,reflector,reviewer.take,
   *   reviewer.give`. that set does NOT hold `reviewer`, nor any seat a route
   *   adds beyond the five.
   *
   * 🔴 .measured 2026-09-18 — rhachet-roles-bhrain.beav.feat-prescribed-brain-
   *   per-stone / reviewer. the row named the seat; the command beside it
   *   re-ensured five live seats, never touched the sixth, and exits 0.
   *
   * ⚠️ SILENT-POSITIVE, which is what makes it expensive: an idempotent boot
   *   that skips the absent seat is indistinguishable from one that restored
   *   it, so there is no cue to re-check (term=false-report).
   */
  given('[case49] a census row that names one ABSENT seat', () => {
    const bare = (): string =>
      readPollWhole()
        .split('\n')
        .filter((line) => !/^\s*#/.test(line))
        .join('\n');

    const absentRow = (): string[] =>
      bare()
        .split('\n')
        .filter((line) => line.includes('the host holds no such session'));

    when('[t0] the row is read', () => {
      then('it exists — the teeth below are not vacuous', () => {
        expect(absentRow().length).toBe(1);
      });

      then('🔴 its boot names the SEAT, never the tree alone', () => {
        for (const line of absentRow()) {
          expect(line).toContain('git.crew.boot --tree $__bwt --roles $__bwr');
        }
      });

      then('COUNTER: the default role set does NOT hold every seat', () => {
        // the whole reason the flag is owed. if this ever became exhaustive,
        // the tooth above would still be right but its .why would be stale —
        // so the premise is clamped beside the cure.
        const roles = getShellLibWhole({ path: join(__dirname, 'crewwork.sh') })
          .split('\n')
          .filter((line) => line.startsWith('CREWWORK_ROLES_DEFAULT='))
          .join('');
        expect(roles).toContain(
          'mechanic,foreman,reflector,reviewer.take,reviewer.give',
        );
        expect(roles).not.toContain(',reviewer,');
      });

      then(
        'COUNTER: it passes NO --grove — boot derives that from the ledger',
        () => {
          // a hand-passed grove here would be a second derivation to drift, and
          // `crew.boot` already reads the ledger (crewwork.sh:5022).
          for (const line of absentRow()) {
            expect(line).not.toContain('--grove');
          }
          const boot = getShellLibWhole({
            path: join(__dirname, 'crewwork.sh'),
          });
          const at = boot.indexOf('crew.boot() {');
          expect(at).toBeGreaterThan(-1);
          expect(boot.slice(at, at + 1600)).toContain('__crew_ledger_grove_of');
        },
      );

      then(
        'the boot skill no longer advertises a `local` default it abandoned',
        () => {
          const help = readFileSync(
            join(__dirname, '../git.crew.boot.sh'),
            'utf8',
          );
          expect(help).not.toContain('--grove   local (default)');
          expect(help).toContain(
            'default: the box the LEDGER says this crew was booted on',
          );
        },
      );
    });
  });

  /**
   * [case47] — a dirty row NAMES its dirt, and says whether it is work
   *
   * .why = the poll's tree verdict carried the bare word `dirty` and stopped.
   *        so the one question a supervisor must answer next — is this WORK, or
   *        is it a tool's own cache? — cost a `crew.send 'git status --short'`
   *        plus a `crew.read`, per tree, per tick. two round trips for a fact
   *        the poll had already read and thrown away.
   *
   * 🔴 .it had already run the read, on BOTH arms
   *    the local arm ran `git status --porcelain | head -1` purely to test it
   *    non-empty. the grove arm shipped that same first line across an ssh and
   *    discarded it at the `read -r`. the content was in hand each time.
   *
   * .measured 2026-09-17 — svc-reservations.beav.feat-spot-forecast-widget
   *    read `👌 merged — pr #357 landed — fell it ✋ dirty` for two ticks. the
   *    whole of the dirt was ` M .radio` — the radio task cache that
   *    `radio.task.pull` writes. the human asked "what kind of dirt?", and a
   *    send plus a read answered what the row should have.
   *
   * ⚠️ .it CLASSIFIES and never decides
   *    the fell's own gate still refuses, and the `--stash --why` that clears
   *    it is a judgment. so the row names the KIND and hands the `--why` over
   *    unwritten (rule.forbid.fabricated-opines).
   */
  given('[case47] the dirt on a row is named and classified', () => {
    const dirt = (raw: string) =>
      runCrew({ command: `__crew_dirt_read '${raw}'` });

    when('[t0] the dirt is a tool cache alone', () => {
      const result = useBeforeAll(async () => dirt(' M .radio;'));

      then('it names the path, so no drill-in is owed', () => {
        expect(result.stdout).toContain('.radio');
      });

      then('it says the dirt is NOT work', () => {
        // the whole value of the classification: `tool state only` is the
        // phrase that tells a supervisor a stash loses naught.
        expect(result.stdout).toContain('tool state only');
      });

      then('it keeps the `✋ dirty` marker every caller greps for', () => {
        // 🔴 four call sites match on `*"✋ dirty"*` — the merged-dirty tally,
        //    the orphan fence, the fellable filter, and the heal gate. a suffix
        //    that renamed the marker would silently unfence all four.
        expect(result.stdout).toContain('✋ dirty');
      });
    });

    when('[t1] the dirt is real work', () => {
      const result = useBeforeAll(async () =>
        dirt(' M src/domain.operations/asGuardPositiveInt.ts;?? src/x.ts;'),
      );

      then('it counts the files and names the first', () => {
        expect(result.stdout).toContain('2 file(s)');
        expect(result.stdout).toContain('asGuardPositiveInt.ts');
      });

      then('it does NOT call work a tool cache', () => {
        expect(result.stdout).not.toContain('tool state only');
      });
    });

    when('[t2] work rides ALONGSIDE a tool cache', () => {
      // 🔴 the counter that matters. a classifier that tested only the FIRST
      //    path, or that matched `.radio` anywhere in the set, would grade this
      //    `tool state only` and invite a stash over real work.
      const result = useBeforeAll(async () => dirt(' M .radio;?? src/x.ts;'));

      then('one work file is enough to make the whole set work', () => {
        expect(result.stdout).not.toContain('tool state only');
        expect(result.stdout).toContain('2 file(s)');
      });
    });

    when('[t3] the worktree is clean', () => {
      const result = useBeforeAll(async () => dirt(''));

      then('it renders naught — a clean row carries no suffix', () => {
        // .note the harness appends an `__EXIT__` sentinel to every stdout, so
        //   the property is the ABSENCE of the marker, never an empty string.
        expect(result.stdout).not.toContain('dirty');
        expect(result.exit).toBe(0);
      });
    });

    when('[t4] the admission test is read', () => {
      // ⚠️ `.meter/` is the near miss, and it is deliberately OUT: it is
      //    tool-written too, and it does NOT regenerate — it holds a human's
      //    granted quota, so a stash there destroys a grant. the test for
      //    admission is REGENERATION, never authorship alone.
      const result = useBeforeAll(async () =>
        dirt(' M .meter/git.commit.uses.jsonc;'),
      );

      then(
        'a tool-written path that does not regenerate is NOT tool state',
        () => {
          expect(result.stdout).not.toContain('tool state only');
        },
      );
    });

    when('[t5] both arms of the poll are read for the feed', () => {
      const poll = (): string => readPollWhole();

      then('the LOCAL arm feeds the shared classifier', () => {
        expect(poll()).toMatch(/dirty="\$\(__crew_dirt_read/);
      });

      then('the GROVE arm ships every line, not just the first', () => {
        // 🔴 the arm shipped `status --porcelain | head -1` over the wire. one
        //    line cannot be classified: a set whose first entry is `.radio` and
        //    whose second is a source file would read `tool state only`.
        const src = poll();
        const at = src.indexOf('__poll_tree_facts_on_grove() {');
        const helper = src.slice(at, src.indexOf('\n}\n', at));
        expect(helper).not.toContain(
          'status --porcelain 2>/dev/null | head -1',
        );
      });

      then('the classifier is carried into the verdict subshell', () => {
        // the arm runs under `bash -c "$(declare -f …)"`. a helper absent from
        // that list is undefined at the call site, the read fails, and every
        // row reverts to the bare word — green in source, inert in production.
        expect(poll()).toMatch(/declare -f [^;]*__crew_dirt_read/);
      });
    });
  });
});
