/**
 * .what = clamps on the poll SCOPE — census, shared caps, blind axes, denominators, healable, uniqueness
 *
 * .note = a PART of the `work.surface` suite, cut so one reviewer can hold
 *         it whole. the suite's shared fixtures, and its account of what it
 *         runs against and why, live in work.surface.harness.ts.
 */
import { readFileSync } from 'fs';
import { join } from 'path';
import { given, then, when } from 'test-fns';

import { asCode, DIR_WORK, readPollWhole } from './work.surface.harness';

describe('work.surface', () => {
  /**
   * .what = the BOX census carries its own move, and never defers to a row that
   *        may not have rendered
   *
   * .why  = the per-tree box line renders under ONE status — the `🚧` arm fires
   *        on `blocked:on-supervisor` alone, and its own comment declares that
   *        scope deliberate. but `BOX_TALLY` counts a non-empty box on EVERY
   *        tree, whatever its status.
   *
   *        so the census header's claim — "each names its own move on its row
   *        above" — held for exactly one status and was false for the rest.
   *
   *        measured 2026-09-17, one tick apart, same tree:
   *          tick A  blocked:on-supervisor -> `🚧 … reviewer:🪦absent` rendered
   *          tick B  modal answered -> 😶 inflight -> box line suppressed, and
   *                  `🪦absent × 1` still pointed at a row that named no move
   *
   *        that is `term=false-report` in its cheapest form: a census row is
   *        READ rather than re-derived, so a stale claim survives longest there
   *        — which the very comment above this line was written to record, and
   *        which the same line then committed a third time.
   *
   * .the bound = 🪦absent is the ONE state whose cure is not a read. its join
   *        arm records that the host answered and holds no such session, so a
   *        re-read is guaranteed to return naught — the cure is a boot.
   */
  given(
    '[case40] the box census carries its move, rather than a defer to a row that may not render',
    () => {
      const readCrewPoll = (): string => asCode(readPollWhole());

      when('[t0] the census header is read', () => {
        then('🔴 it no longer claims the row ABOVE names the move', () => {
          // the box line fires on one status; the tally counts every status. so
          // any pointer at "the row above" is false for all but one of them.
          expect(
            readCrewPoll().includes('each names its own move on its row above'),
          ).toEqual(false);
        });

        then('it points at the rows BELOW, which it does control', () => {
          expect(
            readCrewPoll().includes('each row below carries its own move'),
          ).toEqual(true);
        });
      });

      when('[t1] the per-subject roll row is read', () => {
        then('🔴 it emits a runnable move, never a bare tree/role pair', () => {
          const src = readCrewPoll();
          expect(
            src.includes('rhx git.crew.read --tree $__bwt --who $__bwr'),
          ).toEqual(true);
        });

        then(
          '🪦absent takes a BOOT — a read cannot settle a seat the host does not hold',
          () => {
            // .the bound. the `seat ABSENT` join arm states it outright: the host
            //   answered and holds no such session, so a re-read can only fail.
            const src = readCrewPoll();
            expect(
              /if \[\[ "\$__bs" == "🪦absent" \]\]; then/.test(src),
            ).toEqual(true);
            expect(src.includes('rhx git.crew.boot --tree $__bwt')).toEqual(
              true,
            );
          },
        );

        then(
          '🪦absent is NOT also handed a read — the two arms are exclusive',
          () => {
            // .teeth = a cure appended beside the boot rather than instead of it
            //   would hand the reader a call the join arm says must fail.
            const src = readCrewPoll();
            const bootAt = src.indexOf('rhx git.crew.boot --tree $__bwt');
            const readAt = src.indexOf(
              'rhx git.crew.read --tree $__bwt --who $__bwr',
            );
            expect(bootAt).toBeGreaterThan(0);
            expect(readAt).toBeGreaterThan(0);
            // the read sits in the `else`, so it follows the boot in source order
            expect(bootAt).toBeLessThan(readAt);
            expect(src.slice(bootAt, readAt).includes('else')).toEqual(true);
          },
        );
      });

      when('[t2] the pre-fix form is held against the same assertions', () => {
        then('🔴 it goes RED — the bite proof', () => {
          // .teeth = the two lines exactly as they shipped.
          const shippedHeader =
            'echo "   ├─ $__bs × ${BOX_TALLY[$__bs]} — a non-\\`empty\\` box; each names its own move on its row above"';
          expect(
            shippedHeader.includes('each names its own move on its row above'),
          ).toEqual(true);
          expect(
            shippedHeader.includes('each row below carries its own move'),
          ).toEqual(false);

          const shippedRow = 'echo "   │     └─ ${__bw%%/*} / ${__bw##*/}"';
          expect(
            shippedRow.includes('rhx git.crew.read --tree $__bwt --who $__bwr'),
          ).toEqual(false);
          expect(
            shippedRow.includes('rhx git.crew.boot --tree $__bwt'),
          ).toEqual(false);
        });
      });
    },
  );

  given(
    '[case-shared-cap-one-cure] N capped rows on ONE grove state their ONE cure',
    () => {
      const readPoll = (): string => asCode(readPollWhole());

      /**
       * 🔴 .the defect — the set prints N COMMANDS for ONE cure
       *   `--healable` emits one `git.crew.heal` line per tree. for the `limited`
       *   axis that is wrong by construction: a usage cap is an ACCOUNT fact, so
       *   every capped crew on a grove shares ONE cap and ONE cure. heal says so
       *   itself, in every one of those N identical verdicts:
       *     "HEALABLE via auth.swap (unblocks now; global + hot,
       *      one swap heals the grove)"
       *
       * 🔴 .why the render owes the collapse, and not the reader
       *   the babysit contract says "run each emitted heal line VERBATIM". with
       *   12 capped rows that is 12 ssh round-trips to learn ONE fact the tool
       *   already holds — and it held it BEFORE the first call: `CREW_CAP` has
       *   the cap text per role and `CREW_HOST` has the grove.
       *   ⇒ so the supervisor pays N reads for a fact the poll could state once,
       *     and `rule.require.bulk-over-byhand` grades that loop a blocker.
       *
       * 🔴 .measured 2026-09-20 — the tick that wrote this
       *   13 healable: 12 `limited`, every one `resets 12:10am (UTC)`, all on
       *   grove-sandpine-v20260901. three probes (two ⭐, one unsponsored, to keep
       *   the generalization off a sample that shares the trait that matters)
       *   returned BYTE-IDENTICAL verdicts and the same one-line cure.
       *   ⚠️ and the cure is HUMAN-only — an oauth sign-in to an uncapped
       *     account — so the other nine calls could have cured no row either
       *     (rule.forbid.self-grant-human-gates).
       *
       * ✅ .the bound — this collapses the RENDER, never the SET
       *   each capped tree stays its own row: a supervisor must still see which
       *   trees are held, and an unsponsored one may be felled rather than
       *   waited on. what the banner adds is that the N rows share ONE remedy.
       */
      const SHARED_CAP_TELL = 'share ONE live cap';

      when('[t0] the bound is read', () => {
        then('it exists at all — the clamp is not vacuous', () => {
          expect(readPoll().includes(SHARED_CAP_TELL)).toEqual(true);
        });

        then(
          '🔴 it names the ONE cure, not N — the whole point of the collapse',
          () => {
            const src = readPoll();
            const at = src.indexOf(SHARED_CAP_TELL);
            expect(at).toBeGreaterThan(0);
            expect(src.slice(at, at + 900).includes('git.grove.auth')).toEqual(
              true,
            );
          },
        );

        then(
          '🔴 it marks the cure HUMAN-owned — a command a clone cannot run is a gate',
          () => {
            const src = readPoll();
            const at = src.indexOf(SHARED_CAP_TELL);
            // the sign-in is credential provision, which `rule.forbid.self-grant-
            // human-gates` puts in the human-only set. a row that names the command
            // and omits the owner reads as a supervisor action.
            expect(src.slice(at, at + 900).includes('HUMAN')).toEqual(true);
          },
        );

        then(
          '🔴 it keys on the AXIS word `nudge`, never the STATUS word `limited`',
          () => {
            const src = readPoll();
            const at = src.indexOf(SHARED_CAP_TELL);
            const cond = src.slice(Math.max(0, at - 900), at);
            /**
             * 🔴 .the trap this clamp exists for — the two words are NOT the same
             *   crewwork.sh:1676 reads
             *     [[ "$status" == "limited" ]] && { printf 'nudge\n'; return 0; }
             *   so `limited` is the STATUS and `nudge` is the AXIS it maps to.
             *   `HEALABLE_AXIS` holds the axis, so a guard keyed on the status word
             *   matches no row — it compiles, renders no banner, and breaks no test.
             *
             * 🔴 .caught in prod, 2026-09-20, on a GREEN clamp
             *   the first cut of this very case keyed on `limited`, passed 6/6 here,
             *   and rendered naught against 12 live capped rows. a source-level
             *   clamp proves the TEXT exists and says not one thing about whether
             *   the JOIN fires (rule.always.capture-clamp-then-verify-in-prod).
             *   ⇒ so this assertion pins the discriminator itself, and the negative
             *     below keeps the old defect from a quiet return.
             */
            /**
             * ⚠️ .anchored on the GUARD LINE, never on how near it sits to the tell
             *   an earlier cut sliced 900 chars above the tell and asserted inside
             *   that window. it held until a comment grew between the two, at which
             *   point it failed on a cure that was correct — a clamp that grades
             *   the distance between two lines rather than the line it cares about.
             *   the guard line is unique in this file, so match it outright.
             */
            expect(
              src.includes('"${HEALABLE_AXIS[$__ct]:-}" == "nudge"'),
            ).toEqual(true);
            expect(
              src.includes('HEALABLE_AXIS[$__ct]:-}" == "limited"'),
            ).toEqual(false);
            // and it stays keyed to the class, never to a box that exists today
            expect(cond.includes('grove-sandpine-v2026')).toEqual(false);
          },
        );

        then(
          '🔴 it carries the RESET CLOCK — the datum that ranks its own two options',
          () => {
            const src = readPoll();
            const at = src.indexOf(SHARED_CAP_TELL);
            const body = src.slice(at, at + 1200);
            /**
             * 🔴 .the banner offers TWO options and must supply what sorts them
             *   `swap the auth` costs a human a sign-in. `wait for the reset` costs
             *   naught. which one is right turns entirely on HOW FAR the reset is —
             *   and with that omitted the banner reads identically at 4 minutes out
             *   and at 11 hours out, so a supervisor cannot weigh them at all.
             *
             * 🔴 .measured 2026-09-20 — it cost a real misrank
             *   a tick surfaced the human-only swap as the fleet's #1 item against 12
             *   held crews. the reset was FOUR MINUTES away; the right answer was to
             *   wait, and the banner held no fact that said so. the per-row lines DO
             *   carry `· resets HH:MMxm (UTC)`, so the clock was already derived —
             *   the collapse dropped it on the way up (term=partial-audit: a summary
             *   complete over what it chose, read as complete over the question).
             *
             * ⇒ the same defect class the collapse itself cured, one level up: N rows
             *   reduced to one remedy, minus the fact that decides the remedy.
             */
            expect(body.includes('__cap_reset')).toEqual(true);
            // and the bare form — a reset with no clock — must not return
            expect(body.includes('for the reset. a swap')).toEqual(false);
          },
        );

        then(
          '🔴 it splits a LIVE cap from a STALE one — they have opposite owners',
          () => {
            const src = readPoll();
            const at = src.indexOf(SHARED_CAP_TELL);
            const arm = src.slice(Math.max(0, at - 2400), at + 1600);
            /**
             * 🔴 .one axis word, two states, and the OWNER inverts between them
             *   `limited` maps to axis `nudge` whether the cap's reset clock sits
             *   ahead or behind. so this banner fires on both — and the cure does
             *   not survive the flip:
             *
             *     cap LIVE  → a nudge earns a fresh cap banner. the only real cure
             *                 is an auth swap, and that is credential provision, so
             *                 a HUMAN owns it (rule.forbid.self-grant-human-gates)
             *     cap STALE → every row is nudgeable RIGHT NOW. the N heal lines
             *                 above are each a true cure, and the DRIVER owns them
             *
             * 🔴 .so the unsplit banner is a misroute, never a slip of phrase
             *   it says `do NOT run N heals` and hands up a human-only command — at
             *   the exact moment those N heals are the correct act and no human is
             *   owed. that parks a fleet on a gate nobody needs to open, which is
             *   the failure `rule.always.spend-own-levers-before-escalation` names.
             *
             * 🔴 .measured 2026-09-20, minutes after the clock cure above
             *   13 rows crossed their reset mid-tick and the banner did not move:
             *   still `share ONE live cap`, still the swap. the poll had ALREADY
             *   derived the staleness — the per-row lines flipped to `⏰ reset
             *   PASSED — healable, nudge to retry` in that same render.
             */
            expect(arm.includes('__crew_cap_reset_passed')).toEqual(true);
            expect(arm.includes('reset PASSED')).toEqual(true);
          },
        );

        then(
          '🔴 it fires only on a PLURAL set — one capped row needs no collapse',
          () => {
            const src = readPoll();
            const at = src.indexOf(SHARED_CAP_TELL);
            const cond = src.slice(Math.max(0, at - 700), at);
            expect(/>\s*1\s*\)\)/.test(cond)).toEqual(true);
          },
        );

        then(
          '🔴 it sits INSIDE the healable arm, above its UNRANKED banner',
          () => {
            const src = readPoll();
            const bound = src.indexOf(SHARED_CAP_TELL);
            const unranked = src.indexOf(
              'this set is FLEET-scoped and UNRANKED',
            );
            expect(bound).toBeGreaterThan(0);
            expect(unranked).toBeGreaterThan(0);
            expect(bound).toBeLessThan(unranked);
          },
        );
      });
    },
  );

  given(
    '[case-all-scope-blind] the WIDEST scope states which axes it did not derive',
    () => {
      const readPoll = (): string => asCode(readPollWhole());

      /**
       * 🔴 .the defect — `--all` turns the box and stone axes OFF, at :602
       *
       *      if [[ "$ALL" != "true" ]]; then BOXES="true"; STONES="true"; fi
       *
       *   so the DOCUMENTED way to widen scope is also the way to go blind, and
       *   the wider the set the less the read says. every row renders its
       *   optimistic tail — `😶 crew: at work` — over a fleet that may hold any
       *   number of unanswered modals, pleas, and gates.
       *
       * 🔴 .the file already argues this, at :581-601, and then carves `--all`
       *   out of its own cure. verbatim, about the DENSE render:
       *     "gather neither and the enum finds no prompt, no `👋`, no
       *      `exhausted`, no plea — so every arm falls through to its optimistic
       *      tail and the whole fleet renders `inflight`"
       *     "every row was wrong"
       *   and its principle — "the flag does not gate the data; the RENDER does"
       *   — holds verbatim for `--all`, which states a per-row verdict too.
       *
       * 🔴 .measured 2026-09-20, the tick that wrote this
       *   a supervisor ran `--star --stones`, `--healable`, `--fellable` and saw
       *   ONE modal. `--all --stones` named NINE, seven idle 47–57m. the human
       *   found one of the eight by hand and asked why it was halted.
       *     --star --stones  → box axis ON, but 30 of 38 crews hidden
       *     --healable       → fleet, but a modal is not a heal axis
       *     --fellable       → fleet, but merged trees only
       *     --all            → fleet, and the box axis OFF  ← the hole
       *   ⇒ no read in the tick contract names a modal on an UNSPONSORED crew.
       *
       * ✅ .why the cure is a BANNER and not a flipped condition
       *   the carve-out has a real reason: `--all` is ~38 trees × ~5 roles of ssh
       *   pane reads against 8. to force the axes on would make the widest read
       *   the slowest one, and a supervisor would stop to run it. so the render
       *   must NAME its blind spot instead — the same remedy `--healable`
       *   already carries for its own absent axis (term=partial-audit: a read
       *   complete over the scope it chose, rendered with no trace of the axis
       *   it omitted).
       */
      const ALL_BLIND_TELL =
        'the BOX and STONE axes are NOT derived in this view';

      when('[t0] the bound is read', () => {
        then('it exists at all — the clamp is not vacuous', () => {
          expect(readPoll().includes(ALL_BLIND_TELL)).toEqual(true);
        });

        then(
          '🔴 it names the FIX — a caveat with no command is a shrug',
          () => {
            const src = readPoll();
            const at = src.indexOf(ALL_BLIND_TELL);
            expect(at).toBeGreaterThan(0);
            expect(src.slice(at, at + 900).includes('--all --stones')).toEqual(
              true,
            );
          },
        );

        then(
          '🔴 it says what a green row MEANS — a bare caveat restates the defect',
          () => {
            const src = readPoll();
            const at = src.indexOf(ALL_BLIND_TELL);
            // the star bound's own standard, applied here: `0 among the FUNDED`
            // taught a reader how to READ the number. this must teach them how to
            // read `at work` — as an absence of evidence, never as a state.
            expect(
              src.slice(at, at + 900).includes('absence of evidence'),
            ).toEqual(true);
          },
        );

        then(
          '🔴 it keys on the SCOPE + the axis flag, never on a named tally',
          () => {
            const src = readPoll();
            const at = src.indexOf(ALL_BLIND_TELL);
            const cond = src.slice(Math.max(0, at - 600), at);
            // a tally added tomorrow must be bound the day it ships, with no edit
            // here — the same property [case42] clamps for the star bound
            expect(cond.includes('"$ALL" == "true"')).toEqual(true);
            expect(cond.includes('"$STONES" != "true"')).toEqual(true);
          },
        );

        then(
          '🔴 it sits ABOVE the status tally — a bound below one is no bound',
          () => {
            const src = readPoll();
            const bound = src.indexOf(ALL_BLIND_TELL);
            const tally = src.indexOf('   ├─ 🚦 status — ');
            expect(bound).toBeGreaterThan(0);
            expect(tally).toBeGreaterThan(0);
            expect(bound).toBeLessThan(tally);
          },
        );
      });

      when('[t1] the captured production render is read', () => {
        const asset = (): string =>
          readFileSync(
            join(
              DIR_WORK,
              '.test/.assets/render.poll.all-scope-drops-the-box-and-stone-axes.log',
            ),
            'utf8',
          );

        then(
          'the fixture exists — a real capture, never a hand-typed model',
          () => {
            expect(asset().length).toBeGreaterThan(0);
          },
        );

        then(
          '🔴 it proves the blindness — every crew row renders its optimistic tail',
          () => {
            // the shape the banner must caveat: 30+ rows of `crew: at work`, and
            // not one box state anywhere in the render
            expect(asset().includes('crew: at work')).toEqual(true);
            expect(asset().includes('🚧 MODAL')).toEqual(false);
            expect(asset().includes('🚧prompt')).toEqual(false);
          },
        );
      });
    },
  );

  given('[case42] a STAR-scoped tally states its own denominator', () => {
    const readPoll = (): string => asCode(readPollWhole());

    /** the three tally blocks the bound must govern — status, stones, boxes */
    const TALLY_ANCHORS = [
      '   ├─ 🚦 status — ',
      '   ├─ 🗿 stones — 🙋 ',
      'each row below carries its own move',
    ];

    when('[t0] the bound is read', () => {
      then('it exists at all — the clamp is not vacuous', () => {
        expect(readPoll().includes('every tally below counts the')).toEqual(
          true,
        );
      });

      then(
        '🔴 it sits ABOVE all three tally blocks — a bound below one is no bound',
        () => {
          const src = readPoll();
          const bound = src.indexOf('every tally below counts the');
          expect(bound).toBeGreaterThan(0);
          // .why all three: status, stones, and boxes are three separate render
          //   blocks computed over the same filtered TREES[@]. a bound that
          //   governs only the one that broke is the instance-not-class repair
          //   `rule.require.clamp-edge-cases` forbids — and the box tally in this
          //   very file needed THREE tries to end that exact mistake.
          for (const anchor of TALLY_ANCHORS) {
            const at = src.indexOf(anchor);
            expect(at).toBeGreaterThan(0);
            expect(bound).toBeLessThan(at);
          }
        },
      );

      then('🔴 it keys on the SCOPE, never on a named tally', () => {
        const src = readPoll();
        const at = src.indexOf(
          'if [[ "$STAR" == "true" ]] && (( STAR_HIDDEN > 0 ))',
        );
        expect(at).toBeGreaterThan(0);
        // the condition names the scope and its hidden count — so a tally
        // added tomorrow is bound the day it ships, with no edit here
        const cond = src.slice(at, at + 300);
        expect(cond.includes('await approval')).toEqual(false);
        expect(cond.includes('🚧prompt')).toEqual(false);
      });

      then('it says what a 0 MEANS — a bare count restates the defect', () => {
        const src = readPoll();
        expect(src.includes('0 among the FUNDED')).toEqual(true);
        expect(src.includes('rhx git.crew.poll --all')).toEqual(true);
      });

      then(
        '🔴 a full `if`, never `(( )) && echo` — this file names that abort hazard',
        () => {
          const src = readPoll();
          // the file's own words, ~200 lines down: the arithmetic form "returns 1
          // on a zero count, and as the last statement of this block that would
          // abort the whole sweep the day somebody adds `set -e`"
          expect(src.includes('(( STAR_HIDDEN > 0 )) && echo')).toEqual(false);
        },
      );
    });

    when('[t1] the guard is held against the variables it reads', () => {
      then('🔴 BOTH are initialized unconditionally — `set -u` is on', () => {
        const src = readPoll();
        expect(src.includes('set -uo pipefail')).toEqual(true);
        const starInit = src.indexOf('\nSTAR="true"');
        const hiddenInit = src.indexOf('\nSTAR_HIDDEN=0');
        const guard = src.indexOf(
          'if [[ "$STAR" == "true" ]] && (( STAR_HIDDEN > 0 ))',
        );
        // both at column 0 (unconditional), and both before the guard reads them
        expect(starInit).toBeGreaterThan(0);
        expect(hiddenInit).toBeGreaterThan(0);
        expect(starInit).toBeLessThan(guard);
        expect(hiddenInit).toBeLessThan(guard);
      });
    });

    when('[t2] the captured production render is read', () => {
      const asset = (): string =>
        readFileSync(
          join(
            DIR_WORK,
            '.test/.assets/render.poll.star-scope-tallies-omit-their-denominator.log',
          ),
          'utf8',
        );

      then(
        'the fixture exists — a real capture, never a hand-typed model',
        () => {
          expect(asset().length).toBeGreaterThan(0);
        },
      );

      then('🔴 it holds the false zero beside the scope that caused it', () => {
        const held = asset();
        // the defect, verbatim: 0 await approval where the fleet held 9
        expect(held.includes('🙋 0 await approval')).toEqual(true);
        // and the scope that narrowed it, declared 30 render-lines above
        expect(/non-star crew\(s\) hidden/.test(held)).toEqual(true);
        // the render carried no bound AT the tally — the whole defect
        expect(held.includes('every tally below counts the')).toEqual(false);
      });
    });

    when('[t3] the pre-fix form is held against the same assertions', () => {
      then('🔴 it goes RED — the bite proof', () => {
        // .teeth = the render exactly as it shipped: the trees line, then
        //          straight into the tally block, with no denominator between.
        const shipped = [
          'echo "   ├─ 🌲 trees — ${SUMMARY%, }"',
          '',
          'STATUSSUM=""',
          'echo "   ├─ 🚦 status — ${STATUSSUM% · }"',
          'echo "   ├─ 🗿 stones — 🙋 $STONE_HUMAN await approval"',
        ].join('\n');
        expect(shipped.includes('every tally below counts the')).toEqual(false);
        expect(shipped.includes('0 among the FUNDED')).toEqual(false);
        expect(
          shipped.includes(
            'if [[ "$STAR" == "true" ]] && (( STAR_HIDDEN > 0 ))',
          ),
        ).toEqual(false);
        // and it reaches both tallies with no bound in front of either
        expect(shipped.indexOf('🚦 status')).toBeGreaterThan(0);
        expect(shipped.indexOf('await approval')).toBeGreaterThan(0);
      });
    });
  });

  given('[case43] --healable gathers its pane evidence at EVERY scope', () => {
    const readPoll = (): string => asCode(readPollWhole());
    // .why a RAW reader beside the code one — `readCode` strips every `^\s*#`
    //      line on purpose, so a test asserts behavior rather than prose. the
    //      --fellable bound below is a DECISION carried only in a comment, and
    //      a future editor who widens that arm would pass every code assertion
    //      here. so the one clause that must survive a silent reversal is read
    //      raw, deliberately, and it is the only one that is.
    const readPollRaw = (): string => readPollWhole();

    when('[t0] the --healable arg-parse arm is read', () => {
      then(
        '🔴 it turns BOTH gathers on — three of its four axes are pane facts',
        () => {
          const src = readPoll();
          expect(
            src.includes(
              '--healable) HEALABLE="true"; BOXES="true"; STONES="true"; shift ;;',
            ),
          ).toEqual(true);
        },
      );

      then('🔴 it keys on the FLAG, never on the scope', () => {
        const src = readPoll();
        const at = src.indexOf('--healable) HEALABLE="true"');
        expect(at).toBeGreaterThan(0);
        // the arm itself must carry no scope test — a scope-keyed gather is the
        // exact defect, since `--all` is the form the babysit contract mandates
        const arm = src.slice(at, src.indexOf('\n', at));
        expect(arm.includes('$ALL')).toEqual(false);
        expect(arm.includes('STAR')).toEqual(false);
      });

      then('🔴 it sits ABOVE the `ALL != true` gate it compensates for', () => {
        const src = readPoll();
        const arm = src.indexOf('--healable) HEALABLE="true"');
        const gate = src.indexOf(
          'if [[ "$ALL" != "true" ]]; then BOXES="true"; STONES="true"; fi',
        );
        expect(arm).toBeGreaterThan(0);
        expect(gate).toBeGreaterThan(0);
        expect(arm).toBeLessThan(gate);
      });
    });

    // 🔴 .this [t1] once clamped the OPPOSITE, and that is the whole lesson
    //
    //   it asserted `--fellable is NOT widened — its verdict reaches no box
    //   map`, and it demanded the comment that said so. the claim was half
    //   right: a fell VERDICT is a git fact. the fell FENCE is not.
    //   `__crew_clones_idle` takes CREW_BOXES and CREW_TURNENDED as its two
    //   arguments and its FIRST line is `[[ -n "$boxes" ]] || return 1`.
    //
    // 🔴 so on `--fellable --all` the map was never gathered, the fence failed
    //   closed on its own first line, and EVERY merged tree rendered FENCED —
    //   forever, on a calm grove as surely as a loaded one.
    //
    //   measured 2026-09-18: infrastructure.beav.feat-grove-reach-ehmpathy-demo
    //   (merged, pr #38) held for FOUR consecutive ticks. its mechanic pane
    //   reads VERDICT=yes through `__duct_pane_turn_ended` — clamped at
    //   ductwork.signal.integration.test.ts [case25][t5] — so neither the detector nor
    //   the grove load was ever the gap.
    //
    // ⚠️ .and the clamp is WHY it survived. a wrong claim with a tooth behind
    //   it outlives a wrong claim without one: every reader who checked found a
    //   green suite that agreed with the comment. the defect was not merely
    //   undetected — it was ASSERTED, by the instrument built to detect it.
    //   ⇒ a clamp is only ever as true as the claim it was pointed at, so a
    //     refuted claim owes its clamp an INVERSION in the same round, never a
    //     deletion (rule.require.clamp-edge-cases).
    when('[t1] the same repair, on --fellable, is read', () => {
      then('🔴 --fellable gathers the BOX MAP its own fell FENCE reads', () => {
        const src = readPoll();
        expect(
          src.includes('--fellable) FELLABLE="true"; BOXES="true"; shift ;;'),
        ).toEqual(true);
        expect(src.includes('--fellable) FELLABLE="true"; shift ;;')).toEqual(
          false,
        );
      });

      then('⚠️ COUNTER: it gathers no STONES — no fell arm reads one', () => {
        // the half of the retired bound that was TRUE, kept. the cure must buy
        // the evidence the fence reads and no more, or it answers a real defect
        // with a sweep nobody consumes.
        const src = readPoll();
        const at = src.indexOf('--fellable) FELLABLE="true"');
        expect(at).toBeGreaterThan(0);
        const arm = src.slice(at, src.indexOf('\n', at));
        expect(arm.includes('STONES="true"')).toEqual(false);
      });

      then(
        '🔴 the refuted bound is GONE from the prose, not merely overridden',
        () => {
          // read RAW, for the same reason the retired tooth was: this decision
          // lives in a comment, and a stale comment beside a cured line gives the
          // next reader two sources and no tiebreak.
          expect(
            readPollRaw().includes('--fellable stays untouched, on purpose'),
          ).toEqual(false);
          expect(readPollRaw().includes('it reaches no box map')).toEqual(
            false,
          );
        },
      );
    });

    when('[t2] the captured production render is read', () => {
      const asset = (): string =>
        readFileSync(
          join(
            DIR_WORK,
            '.test/.assets/render.poll.healable-all-loses-every-pane-axis.log',
          ),
          'utf8',
        );

      then(
        'the fixture exists — a real capture of both calls, never a model',
        () => {
          expect(asset().length).toBeGreaterThan(0);
        },
      );

      then('🔴 it holds the contradiction: one fleet, two verdicts', () => {
        const held = asset();
        // the BARE call found the frozen crew and emitted its runnable cure
        expect(held.includes('🦫 dam fine! 1 to heal')).toEqual(true);
        expect(
          held.includes(
            '🧊 frozen — rhachet-roles-bhrain.beav.feat-acceptance-under-5min',
          ),
        ).toEqual(true);
        // the --all call — the WIDEN flag — reported an absence over the same fleet
        expect(held.includes('none a husk, none frozen')).toEqual(true);
      });

      then(
        '🔴 the absence claim is a FLEET claim, with no trace of the dark axes',
        () => {
          const held = asset();
          const denial = held.indexOf('no tree to heal right now');
          expect(denial).toBeGreaterThan(0);
          // it names the scope caveats it DOES know (unreached / retired groves)
          // and says naught about the pane evidence it never read — which is
          // precisely what makes it a partial audit whose face reads complete
          const line = held.slice(denial, held.indexOf('\n', denial));
          expect(line.includes('UNREACHED')).toEqual(true);
          expect(line.includes('box')).toEqual(false);
          expect(line.includes('pane')).toEqual(false);
        },
      );
    });

    when('[t3] the pre-fix form is held against the same assertions', () => {
      then('🔴 it goes RED — the bite proof', () => {
        // .teeth = the arg-parse block exactly as it shipped: --healable set its
        //          own flag and no gather, so `--all` left every pane axis dark
        const shipped = [
          '    --fellable) FELLABLE="true"; shift ;;',
          '    --healable) HEALABLE="true"; shift ;;',
          '    --boxes)    BOXES="true"; shift ;;',
        ].join('\n');
        expect(
          shipped.includes(
            '--healable) HEALABLE="true"; BOXES="true"; STONES="true"; shift ;;',
          ),
        ).toEqual(false);
        expect(
          shipped.includes('--fellable stays untouched, on purpose'),
        ).toEqual(false);
        // and the shipped arm really is the bare one — so the clamp bites on the
        // absent gather, never on some unrelated edit to the same line
        expect(
          shipped.includes('--healable) HEALABLE="true"; shift ;;'),
        ).toEqual(true);
      });
    });
  });

  /**
   * [case52] — the CLONE QUIET row states the DENOMINATOR its claim was
   *            computed over
   *
   * 🔴 .the shape = the row asserts `an age no other duct shares` — a claim
   *    about the FLEET. its denominator is `__age_seen`, built in pass 1 over
   *    `CREW_MOTION`, which holds only the trees THIS poll scoped.
   *
   *    so the claim is true of the polled set and dressed as a fleet fact:
   *    `term=false-report`, the same class `[case42]` cured one arm over.
   *
   * 🔴 .why it is reachable, not theoretical = the two scopes both run this arm
   *    and disagree:
   *
   *      bare poll        STAR=true  → BOXES=true (`:559`) → ⭐ set is the
   *                                    denominator
   *      --all --healable ALL=true   → BOXES=true anyway, because --healable
   *                                    sets it at parse "at EVERY scope"
   *                                    (`:350-356`) → all 37 trees
   *
   *    ⇒ the SAME duct earns a row under one and loses it under the other. and
   *      the direction is the expensive one: a WIDER read has MORE ages, so
   *      more collisions, so FEWER rows. scale buys silence about stalls.
   *
   * ⚠️ .and the babysit contract runs both in one tick — step 2 takes the bare
   *    poll, step 4 takes `--healable`. so the inconsistency is not a corner a
   *    caller must go hunt; it is on the paved path.
   *
   * 🔴 .why it is THIS class and not a new one = `[case42]` bound the three
   *    TALLY blocks to state their denominator, keyed on the SCOPE so "a tally
   *    added tomorrow is bound the day it ships". this row carries the
   *    identical scope-relative claim in its BODY rather than in a tally, so
   *    the bound never reached it — the instance-not-class repair that case's
   *    own comment calls out and `rule.require.clamp-edge-cases` forbids.
   *
   * ⚠️ .the cure is the CLAIM, never the filter. to drop the uniqueness test is
   *    a separate, larger repair already recorded as owed in
   *    `term=duct.box.quiet._.choice.reason.md` (five parts, incl. a glyph and
   *    a rename). the comparative test is deliberate and reasoned — the four
   *    ducts at 886m really are one past event. what is defective here is only
   *    that the row overstates the set it measured.
   *
   * .teeth = restore the bare `an age no other duct shares` and t0/t3 go red.
   */
  given(
    '[case52] the CLONE QUIET row states the scope its uniqueness claim used',
    () => {
      const readPoll = (): string => asCode(readPollWhole());

      /** the emitter line — the ACTIONS row, not the collector ~300 lines up */
      const row = (): string => {
        const src = readPoll();
        const at = src.indexOf('😴 CLONE QUIET');
        return at < 0 ? '' : src.slice(at, at + 400);
      };

      when('[t0] the row is read for what it claims', () => {
        then('the emitter exists at all — the clamp is not vacuous', () => {
          expect(row().length).toBeGreaterThan(80);
        });

        then('🔴 it does NOT assert a bare fleet-wide fact', () => {
          // the shipped text. `no other duct shares` reads as a claim about
          // every duct there is, and the arm never read every duct.
          expect(row().includes('an age no other duct shares')).toEqual(false);
        });

        then('🔴 and it names the set it actually counted', () => {
          expect(/this poll read|scope/.test(row())).toEqual(true);
        });
      });

      when('[t1] the scope qualifier is derived', () => {
        then('🔴 it keys on the SCOPE vars, never on a hardcoded count', () => {
          // the same discriminator [case42] settled on: a row bound to STAR /
          // STAR_HIDDEN stays honest when a new scope flag ships, with no edit.
          const src = readPoll();
          const at = src.indexOf('😴 CLONE QUIET');
          expect(at).toBeGreaterThan(0);
          // the qualifier is computed just above the emitter
          const near = src.slice(Math.max(0, at - 1200), at + 400);
          expect(near.includes('STAR_HIDDEN')).toEqual(true);
          expect(near.includes('$STAR')).toEqual(true);
        });

        then(
          'and it says how many trees went unread when the scope pruned',
          () => {
            const src = readPoll();
            const at = src.indexOf('😴 CLONE QUIET');
            const near = src.slice(Math.max(0, at - 1200), at + 400);
            expect(/unread|outside the/.test(near)).toEqual(true);
          },
        );
      });

      when('[t2] the four gates of the collector are held unchanged', () => {
        // 🔴 counter-teeth. the cure is to the CLAIM; a cure that also loosened
        //    the test would trade a false-report for a flood, and the flood is
        //    the state the comparative test was built to prevent.
        // ⚠️ both anchors are CODE. `readCode` drops every line-leading `#`, so a
        //    comment anchor silently yields -1 and the whole arm reads as empty —
        //    which passes every `includes()` tooth by vacuity. the length tooth
        //    below is what caught exactly that on the first red run.
        const arm = (): string => {
          const src = readPoll();
          const at = src.indexOf('STALLED_QUIET=()');
          const end = src.indexOf('ACTIONS=()', at);
          return at < 0 || end < 0 ? '' : src.slice(at, end);
        };

        then('the arm is still there and still substantial', () => {
          expect(arm().length).toBeGreaterThan(400);
        });

        then('the EMPTY-box gate holds', () => {
          expect(arm().includes(':empty ')).toEqual(true);
        });

        then('the stall-minutes gate holds', () => {
          expect(arm().includes('__stall_mins')).toEqual(true);
        });

        then(
          '🔴 the uniqueness test itself is NOT dropped by this cure',
          () => {
            expect(arm().includes('__age_seen')).toEqual(true);
            expect(arm().includes('== 1 )) || continue')).toEqual(true);
          },
        );

        then(
          '🔴 and the crew-peer join holds — a quiet role beside a peer that moved stays silent',
          () => {
            expect(arm().includes('__qmoved')).toEqual(true);
          },
        );
      });

      when('[t3] the pre-fix form is held against the same assertions', () => {
        then('🔴 it goes RED — the bite proof', () => {
          // .teeth = the emitter exactly as it shipped
          const shipped =
            'ACTIONS+=("😴 CLONE QUIET — ${__sq%% *} ${__sq#* }, an age no other duct shares — read it: rhx git.crew.read")';
          expect(shipped.includes('an age no other duct shares')).toEqual(true);
          expect(/this poll read|unread/.test(shipped)).toEqual(false);
          expect(shipped.includes('STAR_HIDDEN')).toEqual(false);
        });

        then(
          'and a scope word merely ADDED beside the fleet claim is still red',
          () => {
            // the claim must be REPLACED, not annotated. a row that says both
            // "no other duct shares" and "scope: ⭐" states two different sets and
            // leaves the reader to pick.
            const halfCured =
              'ACTIONS+=("😴 CLONE QUIET — an age no other duct shares — scope: ⭐ — read it")';
            expect(halfCured.includes('an age no other duct shares')).toEqual(
              true,
            );
          },
        );
      });
    },
  );

  /**
   * [case59] — a seat on an UNREACHED grove is not a LIVE seat behind an overlay
   *
   * 🔴 .the shape = [case46]'s counter walks `CREW_BOXES`, and those boxes come
   *    from the local duct REGISTRY (git.crew.poll.sh:1613) as well as from a
   *    live tmux read. a registry row records what the LAST successful poll
   *    saw. so on a tree whose grove is UNREACHED the loop finds a box, finds
   *    no stone, and files the seat as `live … rendered no stone`.
   *
   *    ⇒ `live` is a claim about a pane that was never read this sweep.
   *
   * 🔴 .measured 2026-09-20, star scope, 4 crews, all on grove-sandpine-v20260901.
   *    one render carried three mutually exclusive claims about one tree:
   *        ├─ ⚠️  UNREACHED: grove-sandpine-v20260901 …
   *        ├─ 😴 unread — rhachet-roles-bhrain.beav.feat-acceptance-under-5min
   *        │    🗿 reviewer.take: relic — no live clone in this pane
   *        │  └─ 🤐 a live clone whose 🗿 line never rendered — an overlay …
   *    `relic` says no clone, `🤐` says a live clone, and `UNREACHED` says the
   *    pane was never read — so neither of the first two is earned.
   *
   * ⚠️ .and the cost is a DECISION. the 🤐 guide reads "read each seat before
   *    you trust a 0" and emits one `crew.read` per seat as its cure. 4 of 4
   *    were run and 4 of 4 exited 1:
   *        ✋ duct.read: cannot reach 'grove-sandpine-v20260901'
   *           └─ fix:   rhx git.grove.wake <grove>
   *    the cure that reaches it sat in the header one screen above, all along.
   *
   * ✅ .why SPLIT rather than SKIPPED — to drop the seats would shrink the
   *    tally's denominator with no trace, the partial-audit that [case46]'s own
   *    parenthetical exists to prevent. both are counted; they differ in the
   *    claim made and the cure emitted.
   *
   * .teeth = drop the `__crew_host_unreached` guard and [t0] goes red; let the
   *          asleep arm emit a `crew.read` and [t1] goes red; drop the term
   *          from the parenthetical and [t2] goes red.
   */
  given(
    '[case59] an unread seat on an unreached grove claims no live clone',
    () => {
      const readPoll = (): string => asCode(readPollWhole());

      when('[t0] the no-stone counter is read', () => {
        const src = readPoll();

        then(
          "it partitions on whether the seat's grove ANSWERED this sweep",
          () => {
            // the predicate is __crew_host_unreached — the one source that knows a
            // list call FAILED rather than returned empty (:1495)
            expect(
              src.includes(
                'if [[ -n "$__ns_host" ]] && __crew_host_unreached "$__ns_host"; then',
              ),
            ).toEqual(true);
          },
        );

        /**
         * 🔴 .the host comes off the LEDGER, and this tooth is the whole cure
         *
         *   the first cut read `CREW_HOST[canon]` and went INERT in prod — the
         *   clamp was green and the render byte-identical. a probe on 2026-09-20
         *   showed the key PRESENT for every grove tree with the EMPTY STRING as
         *   its value, which this arm reads as "here", so every seat fell to the
         *   live bucket.
         *
         * ⚠️ .and the tooth that shipped with that cut pinned `CREW_HOST` BY NAME,
         *   so it asserted the very correlate that was wrong. a tooth on the
         *   SOURCE of a join cannot catch a wrong source; only one on the
         *   AUTHORITY can. hence the negative below — it carries the weight.
         */
        then(
          '🔴 and the host is derived from the LEDGER, never from CREW_HOST',
          () => {
            const at = src.indexOf(
              '__ns_grove="$(__crew_ledger_grove_of "$__ns_t")"',
            );
            expect(at).toBeGreaterThan(-1); // ANTI-VACUITY
            expect(
              src.includes(
                '__ns_host="$(__crew_grove_host "${__ns_grove:-local}"',
              ),
            ).toEqual(true);
            // 🔴 the correlate must not creep back onto this join
            expect(src.includes('__ns_host="${CREW_HOST')).toEqual(false);
          },
        );

        then('and an unreached seat leaves the LIVE count entirely', () => {
          const at = src.indexOf('__crew_host_unreached "$__ns_host"; then');
          expect(at).toBeGreaterThan(-1); // ANTI-VACUITY
          // ⚠️ bound the window to the arm's OWN `fi`, never a char count — a
          //    fixed slice overshot into the live arm below and the last tooth
          //    fired on a line that was never on this path
          const end = src.indexOf('\n      fi', at);
          expect(end).toBeGreaterThan(at); // ANTI-VACUITY: the arm is closed
          const arm = src.slice(at, end);
          expect(arm.includes('(( STONE_NOSTONE_ASLEEP++ ))')).toEqual(true);
          expect(arm.includes('continue')).toEqual(true);
          // 🔴 the live counter must NOT be reached on this path
          expect(arm.includes('(( STONE_NOSTONE++ ))')).toEqual(false);
        });
      });

      when('[t1] the two render arms are held side by side', () => {
        const src = readPoll();
        const liveAt = src.indexOf(
          '🤐 a live clone whose 🗿 line never rendered',
        );
        const asleepAt = src.indexOf(
          '😴 a seat on a grove that did not ANSWER',
        );

        then('both arms exist — the split reaches the render', () => {
          expect(liveAt).toBeGreaterThan(-1); // ANTI-VACUITY
          expect(asleepAt).toBeGreaterThan(liveAt);
        });

        then(
          '🔴 the asleep arm makes NO liveness claim and emits NO read',
          () => {
            const arm = src.slice(asleepAt, asleepAt + 1200);
            expect(arm.includes('a live clone')).toEqual(false);
            expect(arm.includes('an overlay')).toEqual(false);
            expect(arm.includes('rhx git.crew.read')).toEqual(false);
            // it says outright that the state is unsettled, as duct.read does
            expect(
              arm.includes('present and absent are both possible'),
            ).toEqual(true);
          },
        );

        then("and the cure it emits is the grove's, named per seat", () => {
          const arm = src.slice(asleepAt, asleepAt + 1200);
          expect(arm.includes('rhx git.grove.wake ${__na_grove}')).toEqual(
            true,
          );
          // per seat, never a bare count — [case49]'s rule, same footer family
          expect(arm.includes('${__na_seat%%/*} / ${__na_seat##*/}')).toEqual(
            true,
          );
        });

        then(
          '🔴 and the LIVE arm keeps its read — the true case is untouched',
          () => {
            const arm = src.slice(liveAt, asleepAt);
            expect(arm.includes('rhx git.crew.read --tree')).toEqual(true);
            expect(arm.includes('read each seat before you trust a 0')).toEqual(
              true,
            );
          },
        );
      });

      when('[t2] the stone tally parenthetical is read', () => {
        const src = readPoll();

        then(
          'it states the asleep term too — the denominator stays checkable',
          () => {
            const at = src.indexOf('__ns_paren="');
            expect(at).toBeGreaterThan(-1); // ANTI-VACUITY
            const paren = src.slice(at, at + 500);
            expect(
              paren.includes(
                '$STONE_NOSTONE_ASLEEP seat(s) on an UNREACHED grove',
              ),
            ).toEqual(true);
            expect(paren.includes('NOT read')).toEqual(true);
          },
        );

        then(
          'and the tally row fires when the asleep count alone is non-zero',
          () => {
            // else a fleet whose every unread seat sits on an unreached grove
            // renders no stone row at all, and the exclusion goes silent again
            expect(
              src.includes(
                'if (( STONE_HUMAN + STONE_STUCK + STONE_INWORK + STONE_CLIPPED + STONE_DONE + STONE_NOSTONE + STONE_NOSTONE_ASLEEP > 0 )); then',
              ),
            ).toEqual(true);
          },
        );
      });

      /**
       * 🔴 [t3] — the SECOND surface, found by the prod verification itself
       *
       *   the stone tally was cured and the render then showed the identical
       *   defect one block down: `❔unread × 12`, each row with
       *   `rhx git.crew.read --tree … --who …` beside a seat whose grove had
       *   just been named UNREACHED in the poll's own header.
       *
       *   that census already carried the argument, in its own words, for the
       *   `🪦absent` row: "to hand a reader a read there is to hand them a call
       *   that is guaranteed to return naught". it keyed that on a host that
       *   ANSWERED and held no session — one cause of two, and the second went
       *   unwritten.
       *
       * ⚠️ .this is why step 3 of capture-clamp-then-verify-in-prod is not a
       *   formality. the first two steps proved the detector; the prod read is
       *   what put the second instance on the screen.
       */
      when('[t3] the box census emits a per-row move', () => {
        const src = readPoll();
        const at = src.indexOf(
          '__bw_grove="$(__crew_ledger_grove_of "$__bwt")"',
        );

        then('it derives the grove off the LEDGER here too', () => {
          expect(at).toBeGreaterThan(-1); // ANTI-VACUITY
          expect(
            src.includes(
              '__bw_host="$(__crew_grove_host "${__bw_grove:-local}"',
            ),
          ).toEqual(true);
          expect(src.includes('__bw_host="${CREW_HOST')).toEqual(false);
        });

        then('🔴 and an unreached seat gets a WAKE, never a read', () => {
          const end = src.indexOf('\n      fi', at);
          expect(end).toBeGreaterThan(at); // ANTI-VACUITY: the ladder is closed
          const ladder = src.slice(at, end);
          expect(
            ladder.includes('__crew_host_unreached "$__bw_host"; then'),
          ).toEqual(true);
          // the wake arm must precede — and exclude — the read arm
          const wakeAt = ladder.indexOf('rhx git.grove.wake $__bw_host');
          const readAt = ladder.indexOf('rhx git.crew.read --tree $__bwt');
          expect(wakeAt).toBeGreaterThan(-1); // ANTI-VACUITY
          expect(readAt).toBeGreaterThan(wakeAt);
        });

        then(
          'and the two prior arms survive — neither cause is dropped',
          () => {
            const end = src.indexOf('\n      fi', at);
            const ladder = src.slice(at, end);
            expect(
              ladder.includes('rhx git.crew.boot --tree $__bwt --roles $__bwr'),
            ).toEqual(true);
            expect(
              ladder.includes('rhx git.crew.read --tree $__bwt --who $__bwr'),
            ).toEqual(true);
          },
        );
      });
    },
  );

  /**
   * [case65] — `--healable` owes the ORPHAN set, and its exit was above it
   *
   * 🔴 .the shape = the babysit contract mandates `--healable` as the flag a
   *    tick derives its actionable heal set from. an ORPHANED crew — no clone,
   *    dirty tree — is an actionable class with its own runnable cure, and it
   *    is not healable BY CONSTRUCTION: heal works on a PANE, and an orphan has
   *    none (crewwork.sh:1592). so it can never enter HEALABLE_TREES however
   *    the heal classifier is widened.
   *
   *    the dense footer already emits `rhx git.crew.boot --tree <t>` per orphan.
   *    the `--healable` branch `exit 0`s ~1000 lines ABOVE that footer, so the
   *    one view a tick acts from was the one view blind to it.
   *
   * 🔴 .measured 2026-09-19: 5 crews sat frozen-with-no-duct while `--healable`
   *    printed `no tree to heal right now`. `--all --healable` printed the same,
   *    which REFUTED the star-scope guess and left the render as the only cause
   *    that survived. the bare poll was never the defect; the early exit was.
   *
   * ⚠️ .the EMPTY arm is the one that matters. `no tree to heal right now`
   *    beside live orphaned work is `term=false-report` in the direction that
   *    reads safe — true of the heal set, false of whether a tick owes an act.
   *    so [t0] asserts the block sits AFTER the `fi` that closes both arms,
   *    never inside the non-empty one.
   *
   * .teeth = [t1] holds the shipped form (else → fi → guide → exit) against the
   *          same assertions and proves all three go red.
   */
  given(
    '[case65] the --healable view names the ORPHAN set it cannot heal',
    () => {
      const readCrewPoll = (): string => asCode(readPollWhole());

      // 🔴 .why the assertions are SLICED to the healable branch
      //   `rhx git.crew.boot --tree` already appears at the 💀 down row, the
      //   🪦absent row, and the dense ⚠️ORPHANED footer ([case49]). so a bare
      //   `toContain` over the whole file passes over the SHIPPED defect and
      //   clamps nought — the identical trap [case49] and [case57] each record.
      //
      // ⚠️ both endpoints are CODE — `readCode` strips comment lines, so a marker
      //   in prose is absent from the slice by construction.
      const healBranch = (): string => {
        const src = readCrewPoll();
        const open = src.indexOf('if [[ "$HEALABLE" == "true" ]]; then');
        expect(open).toBeGreaterThan(0); // ANTI-VACUITY: the branch must exist
        const shut = src.indexOf(
          '__crew_unreached_guide "$UNREACHED_N" "$UNREACHED_GROVE" "$RETIRED_N"',
          open,
        );
        expect(shut).toBeGreaterThan(open); // ANTI-VACUITY: and must close
        const slice = src.slice(open, shut);
        expect(slice.length).toBeGreaterThan(60); // ANTI-VACUITY: and hold real text
        return slice;
      };

      when('[t0] the --healable branch is read', () => {
        then('🔴 it walks the collected orphan names', () => {
          expect(healBranch()).toContain('$ORPHANED_WHO');
        });

        then(
          '🔴 and emits a runnable boot per tree, inside that branch',
          () => {
            const slice = healBranch();
            const at = slice.indexOf('$ORPHANED_WHO');
            expect(at).toBeGreaterThan(-1); // ANTI-VACUITY: the walk must be in the slice
            expect(slice).toContain('rhx git.crew.boot --tree $__hw');
          },
        );

        then(
          'the COUNT row rides with the per-tree rows, and states the class',
          () => {
            // the split [case49] holds: the count answers HOW MANY and WHY it
            // matters; the rows answer WHICH. neither substitutes for the other.
            const slice = healBranch();
            expect(slice).toContain('$ORPHANED WORK ORPHANED');
            expect(slice).toContain('(( ORPHANED > 0 ))');
          },
        );

        then(
          '🔴 and it sits AFTER the fi, so it survives the EMPTY heal verdict',
          () => {
            // the case that loses work: 0 healable, N orphaned. a block nested
            // inside the non-empty arm would print nought on exactly that tick.
            expect(healBranch()).toMatch(
              /no tree to heal right now[^\n]*\n\s*fi\s*\n\s*if \(\( ORPHANED > 0 \)\); then/,
            );
          },
        );

        then(
          '⚠️ and it says WHY heal cannot take this set, never just that it will not',
          () => {
            // an unexplained exclusion reads as a scope choice a wider flag would
            // undo — which is exactly the guess `--all --healable` refuted.
            expect(healBranch()).toContain('NOT healable');
          },
        );
      });

      when('[t1] the shipped form is held against the same assertions', () => {
        // .teeth = the branch tail exactly as it shipped. a clamp that passes over
        //   the prior form clamps nought (rule.require.clamp-edge-cases).
        const shipped = [
          '  else',
          '    echo "🦫 no tree to heal right now — none limited by a transient 429 or a cap, none a husk, none frozen$(__crew_unreached_caveat "$UNREACHED_N" "$RETIRED_N")"',
          '  fi',
        ].join('\n');

        then('🔴 it goes RED on the orphan walk', () => {
          expect(shipped.includes('$ORPHANED_WHO')).toEqual(false);
        });

        then('🔴 and RED on the runnable boot', () => {
          expect(shipped.includes('rhx git.crew.boot --tree $__hw')).toEqual(
            false,
          );
        });

        then('🔴 and RED on the after-the-fi placement', () => {
          expect(
            /no tree to heal right now[^\n]*\n\s*fi\s*\n\s*if \(\( ORPHANED > 0 \)\); then/.test(
              shipped,
            ),
          ).toEqual(false);
        });

        then('and the cured form goes GREEN on all three', () => {
          const fixed = [
            shipped,
            '  if (( ORPHANED > 0 )); then',
            '    echo "⚠️  $ORPHANED WORK ORPHANED — NOT healable, so this set is owed a BOOT:"',
            '    while IFS= read -r __hw; do',
            '      echo "   │     rhx git.crew.boot --tree $__hw"',
            '    done <<< "$ORPHANED_WHO"',
            '  fi',
          ].join('\n');
          expect(fixed).toContain('$ORPHANED_WHO');
          expect(fixed).toContain('rhx git.crew.boot --tree $__hw');
          expect(
            /no tree to heal right now[^\n]*\n\s*fi\s*\n\s*if \(\( ORPHANED > 0 \)\); then/.test(
              fixed,
            ),
          ).toEqual(true);
        });
      });

      when('[t2] the DENSE footer it mirrors is held intact', () => {
        // the guard on the neighbour: this cure copies the footer's shape, and the
        // edit most likely to break is one that folds the two into one.
        then(
          '⚠️ the dense orphan footer still emits its own count and boots ([case49])',
          () => {
            const src = readCrewPoll();
            expect(src).toContain(
              '$ORPHANED WORK ORPHANED — a crew with no clone',
            );
            expect(src).toContain('rhx git.crew.boot --tree $__ow');
          },
        );
      });
    },
  );
});
