/**
 * .what = clamps on the heal of a clone stopped on a cap, a 429, or a tree the ledger lacks
 *
 * .note = a PART of the `crewwork` suite, cut so one reviewer can hold
 *         it whole. the suite's shared fixtures, and its account of what it
 *         runs against and why, live in crewwork.harness.ts.
 */
import { join } from 'path';
import { given, then, useBeforeAll, when } from 'test-fns';

import { getShellFnBody } from '../../../.test/getShellFnBody';
import { getShellLibWhole } from '../../../.test/getShellLibWhole';
import { tempDirs } from '../../../.test/tempDirs';
import { TREE } from './crewwork.harness';
import { runCrew } from './work.harness';

// .why = each case makes a fake git root, and each runCrew makes a driver dir.
//        with no sweep, one run leaves ~30 dirs in the shared /tmp and the
//        hundredth leaves 3000. hermetic per-run is not hermetic over time.
afterAll(() => tempDirs.delAll());

describe('crewwork', () => {
  given('[case13] a mechanic ALIVE but stopped on a rate-limit error', () => {
    // .teeth = __crew_heal_one returned 3 ("a live claude box is up — no move")
    //          for ANY live ❯ box, so a clone idled on `API Error: Rate limit
    //          reached` read as healthy and was never surfaced. it is NOT a
    //          husk: claude is alive, so a reboot would BURN its conversation
    //          (rule.forbid.byhand-fix-that-burns-the-live-proof). detect +
    //          SURFACE it, never reboot.
    const PANE_TEXT_RATE_LIMITED = [
      '● Bash(rhx git.repo.test --what unit)',
      '  ⎿  API Error: Rate limit reached',
      '─────────────────────────────────────────────',
      '❯ ',
      '─────────────────────────────────────────────',
      '🗿 5.1.execution.from_vision, review.peer, l3@i010, blocked ✋',
      '⏵⏵ accept edits on (shift+tab to cycle)',
    ].join('\n');

    when('[t0] crew.heal reads a rate-limited pane, even in apply mode', () => {
      const result = useBeforeAll(async () =>
        runCrew({
          command: `crew.heal --tree ${TREE} --who mechanic --what work --mode apply`,
          paneText: PANE_TEXT_RATE_LIMITED,
        }),
      );

      then('it SURFACES the rate-limit wedge, not a healthy box', () => {
        expect(result.stdout).toContain('rate-limited');
        expect(result.stdout).toContain('🚫');
        expect(result.stdout).not.toContain('a live claude box is up');
      });

      then('it NEVER reboots — a live claude keeps its conversation', () => {
        // .teeth = the whole hazard. a reboot of a rate-limited (alive) clone
        //          destroys its live conversation. the cure is a NUDGE, never a
        //          reboot: no crew.reboot, no duct.open/duct.stop, no resume.
        expect(result.calls.filter((c) => c.startsWith('crew.reboot'))).toEqual(
          [],
        );
        expect(result.calls.filter((c) => c.startsWith('duct.open'))).toEqual(
          [],
        );
        expect(result.calls.filter((c) => c.startsWith('duct.stop'))).toEqual(
          [],
        );
        expect(
          result.calls.some(
            (c) => c.includes('--resume') || c.includes('--continue'),
          ),
        ).toBe(false);
        expect(result.stdout).not.toContain('💀');
      });

      then(
        'in APPLY mode it NUDGES the wedge to retry — the cure, through the tool',
        () => {
          // .teeth = heal OWNS the cure (rule.forbid.byhand-heal). apply mode must
          //          issue the retry nudge ITSELF — a duct.send --anyway into the
          //          live busy pane — so the cure never falls to a byhand crew.send.
          //          before __crew_heal_nudge, heal only SURFACED the wedge (return
          //          7) and the nudge fell to a hand (the 2026-09-14 incident).
          const nudges = result.calls.filter(
            (c) => c.startsWith('duct.send') && c.includes('--anyway'),
          );
          expect(nudges.length).toBe(1);
          expect(result.stdout).toContain('nudged to retry');
        },
      );
    });

    when('[t1] the same live box with NO rate-limit banner', () => {
      const PANE_TEXT_HEALTHY = [
        '● Bash(rhx git.repo.test --what unit)',
        '  ⎿  109 passed',
        '─────────────────────────────────────────────',
        '❯ ',
        '─────────────────────────────────────────────',
        '🗿 5.1.execution.from_vision, review.peer, l3@i010, blocked ✋',
      ].join('\n');

      const result = useBeforeAll(async () =>
        runCrew({
          command: `crew.heal --tree ${TREE} --who mechanic --what work --mode plan`,
          paneText: PANE_TEXT_HEALTHY,
        }),
      );

      then('it reports a healthy live box — never rate-limited', () => {
        expect(result.stdout).toContain('a live claude box is up');
        expect(result.stdout).not.toContain('rate-limited');
      });
    });

    when(
      '[t2] the rate-limit error is STALE — high in scrollback, past the tail',
      () => {
        // .teeth = the same error from a turn claude already retried past must NOT
        //          flag the clone (term=false-report). the discriminator scopes
        //          the banner to the tail, so an error above it stays healthy.
        const PANE_TEXT_STALE = [
          '  ⎿  API Error: Rate limit reached',
          ...Array.from(
            { length: 20 },
            (_, i) => `  processed item ${i + 1} — recovered and moved on`,
          ),
          '─────────────────────────────────────────────',
          '❯ ',
          '─────────────────────────────────────────────',
          '🗿 5.1.execution.from_vision, review.peer, l3@i012, blocked ✋',
        ].join('\n');

        const result = useBeforeAll(async () =>
          runCrew({
            command: `crew.heal --tree ${TREE} --who mechanic --what work --mode plan`,
            paneText: PANE_TEXT_STALE,
          }),
        );

        then(
          'a stale banner past the tail reads healthy, not rate-limited',
          () => {
            expect(result.stdout).toContain('a live claude box is up');
            expect(result.stdout).not.toContain('rate-limited');
          },
        );
      },
    );
  });

  // .what = the moved-discriminator that git.crew.poll's per-crew status uses to
  //         promote a stale ON-DEFECT stone to `inflight` (task #58). the pure
  //         helper is tested here directly, so no motion-fixture harness is owed:
  //         it takes a stones blob + a still-map and echoes "1" iff a moved
  //         on-defect stone exists.
  // .teeth = before __crew_ondefect_moved existed, git.crew.poll rendered a crew
  //          `blocked:on-defect` off a stone its own live motion had outrun —
  //          measured 2026-09-13 on feat-telepath-role (`exhausted`, mid-turn at
  //          work) and feat-absorb-librarian-role (`blocked ✋`, mid-verify).
  //          under the un-fixed tree the function is absent, so every RESULT is
  //          empty and the two promote cases below FAIL.
  given('[case14] the on-defect moved-discriminator', () => {
    const STONE_EXHAUSTED =
      'mechanic=5.1.execution.from_vision, review.peer, l3@i010, exhausted 👋';
    const STONE_BLOCKED = 'mechanic=1.vision, review.peer, l1@i023, blocked ✋';
    const STONE_APPROVED = 'mechanic=1.vision, judge, approved? 👋';

    when(
      '[t0] an ON-DEFECT stone (exhausted) whose role MOVED (absent from still-map)',
      () => {
        const result = useBeforeAll(async () =>
          runCrew({
            command: `printf 'RESULT[%s]' "$(__crew_ondefect_moved "${STONE_EXHAUSTED}" "")"`,
          }),
        );
        then('it promotes — echoes 1', () => {
          expect(result.stdout).toContain('RESULT[1]');
        });
      },
    );

    when(
      '[t1] the SAME exhausted stone whose role is STILL (present in still-map)',
      () => {
        const result = useBeforeAll(async () =>
          runCrew({
            command: `printf 'RESULT[%s]' "$(__crew_ondefect_moved "${STONE_EXHAUSTED}" "mechanic=12m")"`,
          }),
        );
        then(
          "it does NOT promote — a parked exhausted lane stays the driver's",
          () => {
            expect(result.stdout).toContain('RESULT[]');
          },
        );
      },
    );

    when('[t2] an ON-HUMAN gate (approved?) whose role MOVED', () => {
      const result = useBeforeAll(async () =>
        runCrew({
          command: `printf 'RESULT[%s]' "$(__crew_ondefect_moved "${STONE_APPROVED}" "")"`,
        }),
      );
      then(
        'it does NOT promote — a real human gate is never hidden by motion',
        () => {
          // 🔴 the safety clamp: a mover BELOW a live approval gate must stay the
          //    human's, so this must echo empty even though the role moved.
          expect(result.stdout).toContain('RESULT[]');
        },
      );
    });

    when('[t3] an ON-DEFECT stone (blocked ✋) whose role MOVED', () => {
      const result = useBeforeAll(async () =>
        runCrew({
          command: `printf 'RESULT[%s]' "$(__crew_ondefect_moved "${STONE_BLOCKED}" "")"`,
        }),
      );
      then('it promotes — echoes 1', () => {
        expect(result.stdout).toContain('RESULT[1]');
      });
    });
  });

  // .what = the tz-aware cap-reset comparison — a usage cap whose reset clock has
  //         PASSED is HEALABLE (nudge to retry), a future clock is a real wait.
  // .why  = git.crew.poll read the cap banner but not its clock, so it could not
  //         tell a live cap from a spent one and left ~24 nudge-able grove crews
  //         parked. __crew_cap_reset_passed is the discriminator; __CREW_NOW_EPOCH
  //         pins the clock so this clamp is deterministic — never tz- or time-flaky.
  //         the LOCAL cases pin now to local-noon; the UTC case pins now to
  //         UTC-noon and parses a UTC clock, so the verdict holds on any box tz.
  given('[case15] the cap-reset passed-vs-future discriminator', () => {
    when(
      '[t0] a past LOCAL cap, a future one, an unparseable one, then a past UTC one',
      () => {
        const result = useBeforeAll(async () =>
          runCrew({
            command: [
              `export __CREW_NOW_EPOCH="$(date -d '12:00' +%s)"`,
              `__crew_cap_reset_passed "You've hit your limit · resets 11:00am" && echo "A[passed]" || echo "A[wait]"`,
              `__crew_cap_reset_passed "You've hit your limit · resets 1:00pm"  && echo "B[passed]" || echo "B[wait]"`,
              `__crew_cap_reset_passed "You've hit your limit · resets soon"    && echo "D[passed]" || echo "D[wait]"`,
              `export __CREW_NOW_EPOCH="$(TZ=UTC date -d '12:00' +%s)"`,
              `__crew_cap_reset_passed "You've hit your limit · resets 11:00am (UTC)" && echo "C[passed]" || echo "C[wait]"`,
            ].join('\n'),
          }),
        );
        then('a PAST local reset is healable — passed', () => {
          expect(result.stdout).toContain('A[passed]');
        });
        then('a FUTURE local reset is a real wait — not passed', () => {
          expect(result.stdout).toContain('B[wait]');
        });
        then(
          'an unparseable reset fails CLOSED — a wait, never a false healable',
          () => {
            expect(result.stdout).toContain('D[wait]');
          },
        );
        then('a PAST UTC reset is healable — passed (tz-aware)', () => {
          expect(result.stdout).toContain('C[passed]');
        });
      },
    );
  });

  // .what = the --healable selector predicate — echoes 1 iff a `limited` crew's
  //         cure is a NUDGE (a transient 429 OR a stale cap), else empty. the
  //         pure helper is tested here directly (the case14 pattern), so the
  //         --healable render needs no end-to-end poll harness (task #59).
  // .why  = `git.crew.poll --healable` derives the nudge set so a supervisor
  //         heals in BULK through the tool, never by hand off the sweep
  //         (rule.require.bulk-over-byhand). the predicate is the whole flag —
  //         a wrong verdict here nudges the wrong clone or skips a wedged one.
  // .teeth = t2 is the false-heal hazard. a LIVE cap (future reset) sets neither
  //          $has_ratelimit nor $cap_stale, so it MUST echo empty — a nudge into
  //          a genuinely capped clone buys naught and reads as a cure. under a
  //          predicate that keyed on `limited` alone, t2 would echo 1 and the
  //          flag would name a wait-only crew as heal-able
  //          (define.invariant.crew.ratelimit.healable-transient).
  given('[case18] the --healable selector predicate', () => {
    when('[t0] a limited crew with a transient 429 banner (no clock)', () => {
      const result = useBeforeAll(async () =>
        runCrew({
          command: `printf 'RESULT[%s]' "$(__crew_is_healable "limited" "1" "")"`,
        }),
      );
      then('it is healable — echoes 1', () => {
        expect(result.stdout).toContain('RESULT[1]');
      });
    });

    when('[t1] a limited crew with a STALE cap (reset passed)', () => {
      const result = useBeforeAll(async () =>
        runCrew({
          command: `printf 'RESULT[%s]' "$(__crew_is_healable "limited" "" "1")"`,
        }),
      );
      then('it is healable — echoes 1', () => {
        expect(result.stdout).toContain('RESULT[1]');
      });
    });

    when(
      '[t2] a limited crew with a LIVE cap — a future reset, no 429, not stale',
      () => {
        const result = useBeforeAll(async () =>
          runCrew({
            command: `printf 'RESULT[%s]' "$(__crew_is_healable "limited" "" "")"`,
          }),
        );
        then(
          'it IS healable — a live cap owes an auth.swap, not a passive wait',
          () => {
            // 🔴 .teeth = this case ENCODED the defect until 2026-09-14: it asserted a
            //    live cap is NOT healable (RESULT[]), because the swap cure axis was
            //    unwired. so the poll's --healable set EXCLUDED a live-capped sponsored
            //    star, and it read as a passive human wait across 6 ticks on
            //    feat-rec-waitlist-capture (resets Sep 20) — when an auth.swap
            //    to an uncapped account (global + hot) would have cleared it now. every
            //    `limited` sub-state has a cure; only the AXIS differs (nudge for a
            //    transient 429 / stale cap, swap for a live cap)
            //    (define.invariant.crew.ratelimit.live-cap-healable-via-swap). revert
            //    the __crew_is_healable `limited` clause to see this go red.
            expect(result.stdout).toContain('RESULT[1]');
          },
        );
      },
    );

    when(
      '[t3] a healthy crew (not limited) that happens to carry a stale flag',
      () => {
        const result = useBeforeAll(async () =>
          runCrew({
            command: `printf 'RESULT[%s]' "$(__crew_is_healable "inflight" "1" "1")"`,
          }),
        );
        then(
          'it is NOT healable — only a `limited` crew is a nudge candidate',
          () => {
            expect(result.stdout).toContain('RESULT[]');
          },
        );
      },
    );

    when(
      '[t4] a husk crew — signal-killed or bare-shell, cured by a REVIVE',
      () => {
        const result = useBeforeAll(async () =>
          runCrew({
            command: `printf 'RESULT[%s]' "$(__crew_is_healable "husk" "" "")"`,
          }),
        );
        then('it is healable — echoes 1 (heal reboots + resumes)', () => {
          // .teeth = before the husk clause, __crew_is_healable returned "" for a
          //          husk (only `limited` was a candidate), so the poll's --healable
          //          set excluded live husks and never recommended the heal it holds.
          //          measured 2026-09-14: 6 grove husks, poll said "no tree to heal".
          expect(result.stdout).toContain('RESULT[1]');
        });
      },
    );

    // 🔴 axis 3 — a FROZEN crew whose stillness is an ORPHANED QUEUE.
    //    the clone is alive, its turn ENDED, and a human's message sits parked
    //    in the queued row above its box. a queue drains at a turn boundary, so
    //    with no turn it never drains. the cure is a RELAY of that same text.
    //
    //    measured 2026-09-16 on feat-dispute-or-concede-review-budget: the human
    //    answered the mechanic's own gate question with `fireworks is back now`,
    //    it sat orphaned across TWO ticks, --healable said "no tree to heal",
    //    and the supervisor cured it BY HAND (rule.forbid.byhand-heal).
    when(
      '[t5] a frozen crew with a message parked in an orphaned queued row',
      () => {
        const result = useBeforeAll(async () =>
          runCrew({
            command: `printf 'RESULT[%s]' "$(__crew_is_healable "frozen" "" "" "fireworks is back now")"`,
          }),
        );
        then('it is healable — echoes 1 (heal relays the parked text)', () => {
          expect(result.stdout).toContain('RESULT[1]');
        });
      },
    );

    // 🔴 axis 4 — a FROZEN crew with NO queued row. added 2026-09-16.
    //    heal's WEDGE probe (`--what wedge`, __crew_heal_wedge_one) is exactly
    //    this state's cure: alive, mid-work, and a frame that held
    //    byte-identical across two reads with a repaint between.
    when(
      '[t6] a frozen crew with NO queued row — the WEDGE-probe candidate',
      () => {
        const result = useBeforeAll(async () =>
          runCrew({
            command: `printf 'RESULT[%s]' "$(__crew_is_healable "frozen" "" "" "")"`,
          }),
        );
        then(
          'it IS healable — the wedge probe is a cure heal holds for it',
          () => {
            // 🔴 .teeth = this case ENCODED the defect until 2026-09-16, exactly as
            //    [t2] did for the live cap until 2026-09-14. it asserted RESULT[],
            //    justified so: "frozen is proven three ways — an absent clone, an
            //    idle clock, and the queued row — and only the third names a cure."
            //
            //    that last clause was no longer true once heal grew its wedge axis.
            //    and the axis is opt-in (`--what wedge`, "never under `all`"), so a
            //    --healable that omitted it made the axis UNREACHABLE to any
            //    supervisor who derives the actionable set through the tool — which
            //    the babysit tick mandates. the poll hid a cure it held
            //    (rule.require.poll-recommends-every-cure-heal-has).
            //
            //    revert the __crew_is_healable `frozen` clause to its
            //    `&& -n "$queuedrow"` form to watch this go red.
            expect(result.stdout).toContain('RESULT[1]');
          },
        );
      },
    );

    // 🔴 the DOWN screen — the one bound [t6]'s widened frozen arm does not
    //    cover. added 2026-09-16. a duct that is DOWN holds no tmux session, so
    //    there is no pane for ANY heal axis to read: a wedge probe needs two
    //    frames, a revive needs a box, a relay needs a queued row. heal's
    //    verdict on one is `😴 no pane read`, which reports the READ and cures
    //    not one crew.
    when(
      '[t8] a frozen crew whose DUCT IS DOWN — no session, so no pane',
      () => {
        const result = useBeforeAll(async () =>
          runCrew({
            command: `printf 'RESULT[%s]' "$(__crew_is_healable "frozen" "" "" "" "1")"`,
          }),
        );
        then(
          'it is NOT healable — its cure is a boot, which its crew row names',
          () => {
            // 🔴 .teeth = measured 2026-09-16 across FOUR consecutive babysit ticks.
            //    --healable named 14 trees; the tick contract mandates every emitted
            //    line be run verbatim; 12 of the 14 answered `no pane read`. 48 tool
            //    calls, zero cures, zero probes, and the set never shrank — because
            //    a down duct is not a state heal can move.
            //
            //    two of those trees were probed directly to settle it:
            //      rhx git.crew.read --tree rhachet.beav.fix-test-tempdir-leak --who mechanic
            //      ✋ duct.read: session 'duct:///…/mechanic' is absent on this machine
            //         └─ what: tmux holds no session by that name
            //
            //    ⚠️ the poll had the cure right on the SAME row the whole time —
            //    crew_state="down" renders `💀 no live duct — rhx git.crew.boot`. so
            //    one render carried two recommendations for one tree, and only the
            //    crew-row one was a cure. that inverts
            //    rule.require.poll-recommends-every-cure-heal-has: the poll
            //    recommended a cure heal does NOT hold.
            //
            //    drop the `&& -z "$duct_down"` conjunct to watch this go red.
            expect(result.stdout).toContain('RESULT[]');
          },
        );
      },
    );

    // ⚠️ the counter-clamp. [t8] must screen the DOWN duct and no other state —
    //    the 2026-09-16 repair that widened the frozen arm to cover the wedge
    //    axis stays intact, and a cloneless-but-LIVE crew (every non-foreman box
    //    a bare shell) still has a pane heal reads and arbitrates. that is the
    //    bounded over-recommend the frozen clause defends by name.
    when(
      '[t9] a frozen crew with a LIVE duct — cloneless, idle, or wedged',
      () => {
        const result = useBeforeAll(async () =>
          runCrew({
            command: `printf 'RESULT[%s]' "$(__crew_is_healable "frozen" "" "" "" "")"`,
          }),
        );
        then(
          'it IS still healable — the DOWN screen did not re-narrow the arm',
          () => {
            expect(result.stdout).toContain('RESULT[1]');
          },
        );
      },
    );

    // ⚠️ and the screen must not leak onto the other two axes. a husk and a
    //    limited crew are both PANE facts — unobservable on an absent session —
    //    so the conjunct sits on the frozen arm alone. these pin that placement.
    when('[t10] a husk and a limited crew, each with the down flag set', () => {
      const result = useBeforeAll(async () =>
        runCrew({
          command: `printf 'HUSK[%s]LIMITED[%s]' "$(__crew_is_healable "husk" "" "" "" "1")" "$(__crew_is_healable "limited" "" "" "" "1")"`,
        }),
      );
      then('both stay healable — the screen touches one arm, not three', () => {
        expect(result.stdout).toContain('HUSK[1]LIMITED[1]');
      });
    });

    // the AXIS half. healable says THAT a crew is curable; this says BY WHICH
    // command — and the two frozen arms diverge, which is the whole point.
    when('[t6b] the heal AXIS picker parts the four cures', () => {
      const result = useBeforeAll(async () =>
        runCrew({
          command: [
            `printf 'HUSK[%s]' "$(__crew_heal_axis "husk" "")"`,
            `printf 'LIMITED[%s]' "$(__crew_heal_axis "limited" "")"`,
            `printf 'FROZEN_Q[%s]' "$(__crew_heal_axis "frozen" "some parked text")"`,
            `printf 'FROZEN_NOQ[%s]' "$(__crew_heal_axis "frozen" "")"`,
            `printf 'INFLIGHT[%s]' "$(__crew_heal_axis "inflight" "")"`,
          ].join('; '),
        }),
      );
      then('a husk revives and a limited crew nudges', () => {
        expect(result.stdout).toContain('HUSK[revive]');
        expect(result.stdout).toContain('LIMITED[nudge]');
      });
      then(
        'a frozen crew WITH parked text relays — the cheap, witnessed cure',
        () => {
          expect(result.stdout).toContain('FROZEN_Q[relay]');
        },
      );
      then('a frozen crew with NO parked text takes the WEDGE probe', () => {
        // 🔴 .teeth = the two frozen arms MUST diverge. one status, two cures —
        //    so a render keyed on the status alone hands a wedge candidate the
        //    default `--mode apply` line, which runs `--what all`, never touches
        //    the wedge axis, and reports "a live claude box is up, absent any
        //    move to make". the tree is named and the cure stays hidden.
        expect(result.stdout).toContain('FROZEN_NOQ[wedge]');
      });
      then('a healthy crew takes no axis at all', () => {
        expect(result.stdout).toContain('INFLIGHT[]');
      });
    });

    when(
      '[t7] an INFLIGHT crew that carries a queued row — a live turn drains it',
      () => {
        const result = useBeforeAll(async () =>
          runCrew({
            command: `printf 'RESULT[%s]' "$(__crew_is_healable "inflight" "" "" "some parked text")"`,
          }),
        );
        then('it is NOT healable — a live turn drains its own queue', () => {
          // 🔴 .teeth = the false-heal hazard on this axis. a queued row under a
          //    LIVE turn is the ordinary healthy case, and a relay there would
          //    double a human's message into a clone about to read it anyway
          //    (rule.forbid.overzealous-blockers). the JOIN is the cure, never
          //    the queued row alone.
          expect(result.stdout).toContain('RESULT[]');
        });
      },
    );

    // 🔴 axis 2b — a husk BOX beneath a crew whose AGGREGATE status reads healthy.
    //    `crew_status` is derived over every seat, so one dead mechanic beside
    //    four live `shell` seats resolves to `at work` and every status arm in
    //    the predicate misses the corpse.
    //
    //    measured 2026-09-18 on feat-prescribed-brain-per-stone — two instruments
    //    disagreed inside ONE tick:
    //      poll --healable --all  -> `no tree to heal right now`
    //      heal --who mechanic    -> `husk (exit 143) — killed by signal, safe to
    //                                 heal … would crew.reboot, then resume`
    //    and the poll's own footer named it on that same run (`husk × 1`, by tree
    //    AND by seat). the datum was measured; the verdict never received it.
    when(
      '[t7b] a husk BOX under an `at work` crew — the aggregate hides it',
      () => {
        const result = useBeforeAll(async () =>
          runCrew({
            command: `printf 'ATWORK[%s]FROZEN[%s]NONE[%s]' "$(__crew_is_healable "at work" "" "" "" "" "" "1")" "$(__crew_is_healable "frozen" "" "" "" "" "" "1")" "$(__crew_is_healable "at work" "" "" "" "" "" "")"`,
          }),
        );
        then(
          '🔴 it is healable even though the crew status proves HEALTHY',
          () => {
            // .teeth = this is the whole defect. before the huskbox arm the predicate
            //          read the aggregate alone, so `at work` fell through every arm
            //          and returned "" — the poll then said `no tree to heal` while
            //          heal, one call later, called the same seat SAFE to revive.
            expect(result.stdout).toContain('ATWORK[1]');
          },
        );
        then(
          'it is healable under a `frozen` aggregate too — the arm is status-blind',
          () => {
            // .teeth = the frozen arm is screened by `-z no_duct`, so a husk seat on a
            //          crew that aggregates to frozen would still have fallen through.
            //          the box fact must carry on its own, never as a rider on a
            //          status arm.
            expect(result.stdout).toContain('FROZEN[1]');
          },
        );
        then(
          '🔴 with NO husk box it stays unhealable — the arm did not swallow every crew',
          () => {
            // .teeth = the anti-vacuity half. an arm that returned 1 unconditionally
            //          would satisfy both assertions above and name all 40 trees
            //          healable, which is `no tree to heal` inverted and no better.
            expect(result.stdout).toContain('NONE[]');
          },
        );
      },
    );

    when(
      '[t7c] the husk BOX picks the REVIVE axis, ahead of every aggregate arm',
      () => {
        const result = useBeforeAll(async () =>
          runCrew({
            command: `printf 'ATWORK[%s]LIMITED[%s]FROZEN[%s]MODE[%s]' "$(__crew_heal_axis "at work" "" "" "1")" "$(__crew_heal_axis "limited" "" "" "1")" "$(__crew_heal_axis "frozen" "" "" "1")" "$(__crew_heal_axis "at work" "" "1" "1")"`,
          }),
        );
        then('🔴 an `at work` crew with a husk box revives', () => {
          expect(result.stdout).toContain('ATWORK[revive]');
        });
        then(
          '🔴 it OUTRANKS nudge and wedge — those cures cannot move a dead pane',
          () => {
            // .teeth = the order argument, and it is the half a signature change alone
            //          would miss. `limited` would emit a nudge at a clone that is not
            //          there; `frozen` would emit a wedge probe that answers `husk or
            //          plain shell` and cures naught. each is a named tree with its
            //          real cure still hidden — the poll one rung short of heal.
            expect(result.stdout).toContain('LIMITED[revive]');
            expect(result.stdout).toContain('FROZEN[revive]');
          },
        );
        then(
          'but MODE still wins — a live clone that lost acceptEdits is not a corpse',
          () => {
            // .teeth = the upper bound on the new arm. modelost is screened first on
            //          purpose (its clone is alive and productive), and a revive there
            //          would reboot a live clone to cure a permission flag.
            expect(result.stdout).toContain('MODE[mode]');
          },
        );
      },
    );

    // the CURE half of axis 3. the predicate above says a crew is heal-able;
    // these read the verb that actually heals it.
    when('[t8] the relay cure itself', () => {
      const src = getShellLibWhole({ path: join(__dirname, 'crewwork.sh') });
      const drain = src.slice(
        src.indexOf('__crew_heal_drain() {'),
        src.indexOf('\n__crew_', src.indexOf('__crew_heal_drain() {') + 1),
      );

      then(
        'heal owns a drain cure at all — the supervisor never relays by hand',
        () => {
          expect(src.includes('__crew_heal_drain() {')).toEqual(true);
        },
      );

      then(
        "it sends the CALLER's text verbatim and composes no word of its own",
        () => {
          // 🔴 .teeth = every other cure in heal writes its own sentence — a nudge
          //    composes one, a revive composes `continue`. this one must not. the
          //    payload is a HUMAN's, already typed and already submitted once, so
          //    a composed string here would put words in their mouth
          //    (rule.forbid.steer-a-clone-beyond-a-permission-key).
          expect(
            /duct\.send --on "\$uri" --anyway --what "\$text"/.test(drain),
          ).toEqual(true);
        },
      );

      then(
        'the submit is its OWN keystroke — a paste swallows a trailing newline',
        () => {
          expect(/--what "\$text"[\s\S]*--keys Enter/.test(drain)).toEqual(
            true,
          );
        },
      );

      then(
        'an empty payload is refused rather than sent as a blank turn',
        () => {
          expect(/-z "\$text"[\s\S]*return 1/.test(drain)).toEqual(true);
        },
      );

      then('plan mode surfaces the move and sends naught', () => {
        expect(
          /"\$mode" != "apply"[\s\S]*would RELAY[\s\S]*return 0/.test(drain),
        ).toEqual(true);
      });

      then(
        'the arm that CALLS it requires the ended turn, never a bare queued row',
        () => {
          // 🔴 .teeth = the join is the whole cure. a queued row under a live turn
          //    is healthy, and a relay there doubles a human's message.
          // 🔴 .bounded by a LANDMARK, never by a char count — measured 2026-09-18
          //    this read `arm.slice(0, 900)`. the ask-widget guard landed at
          //    crewwork.sh:3262-3297 — a correct change — and its comment block
          //    pushed `__crew_heal_drain` past char 900, so the clamp went RED
          //    over source that was RIGHT. a false report in the CLAMP, which is
          //    worse than one in the tool: it spends a tick and teaches a reader
          //    to distrust a green suite.
          //
          // ⚠️ a fixed window measures PROXIMITY, and proximity is not the claim.
          //    the claim is ORDER: the drain is reached from INSIDE the guard. so
          //    assert that, and a comment of any length leaves it alone.
          const arm = src.slice(
            src.indexOf('__qrow="$(__duct_pane_queued_row'),
          );

          // the containment check runs FIRST on purpose: with the drain absent,
          // indexOf returns -1 and the slice below would swallow nearly the whole
          // file, so the guard would be "found" and the tooth would not bite.
          expect(arm).toContain('__crew_heal_drain');
          expect(arm.slice(0, arm.indexOf('__crew_heal_drain'))).toContain(
            '-n "$__qrow" && -n "$__tended"',
          );
        },
      );

      then('and it is reached BEFORE heal calls a live box uncurable', () => {
        // 🔴 .teeth = the arm's position is the defect. heal saw a live ❯, fell
        //    to `return 3 — absent any move to make`, and a halted ⭐ tree sat
        //    with the human's own gate answer undrained across TWO ticks.
        const call = src.indexOf('__crew_heal_drain "$tree"');
        const giveup = src.indexOf('return 3   # a live claude box is present');
        expect(call).toBeGreaterThan(-1);
        expect(giveup).toBeGreaterThan(-1);
        expect(call).toBeLessThan(giveup);
      });
    });
  });

  // .what = the pane's own record that the peer-active inference was REFUTED —
  //         a nudge we sent, answered by the clone with the cap banner again.
  //
  // 🔴 .why = heal infers a STALE banner from an active peer on the same grove
  //         (auth is grove-wide, so a peer that emits tokens proves budget).
  //         that is INDIRECT evidence and it can be wrong. measured 2026-09-16
  //         on feat-peer-review-parallelism at 07:13 UTC, cap `resets 7:50am
  //         (UTC)` — 37m in the FUTURE. a peer WAS at work, the nudge landed,
  //         and the clone answered with the same banner. the supervisor spent a
  //         turn on a wall.
  //
  // 🔴 .the harm is a LOOP, never one turn: the peer-active nudge is owed EVERY
  //         tick until the tree moves, and each nudge RE-PRINTS the banner that
  //         re-arms the detection. the cure feeds its own trigger, once per tick
  //         until reset.
  //
  // .fixture = verbatim pane at .test/.assets/pane.cap.live-future-reset-nudged-
  //          and-recapped.log; its two operative lines are inlined below, so the
  //          clamp cannot drift from the capture.
  given('[case29] a nudge already ANSWERED with the cap banner', () => {
    const NUDGE =
      "a clone on this grove is actively at work, so the account has budget — the 'You've hit your limit' banner above is stale scrollback. " +
      'retry the turn that failed and continue to drive your route autonomously.';
    const CAP = "You've hit your limit · resets 7:50am (UTC)";

    when(
      '[t0] the verbatim pane — a nudge, then the cap banner beneath it',
      () => {
        const result = useBeforeAll(async () =>
          runCrew({
            command: `__crew_cap_nudge_refuted "${NUDGE}\n  ⎿  ${CAP}\n" && printf 'RESULT[refuted]' || printf 'RESULT[trust-peer]'`,
          }),
        );
        then(
          'the cap is LIVE — the inference is refuted, so no further nudge',
          () => {
            // 🔴 .teeth = with this predicate absent, heal's peer-active branch fires
            //    and nudges a genuinely capped clone — the measured 2026-09-16 defect.
            //    drop the `__crew_cap_nudge_refuted` guard from __crew_heal_check and
            //    this case is the one that goes red.
            expect(result.stdout).toContain('RESULT[refuted]');
          },
        );
      },
    );

    when('[t1] a nudge that WORKED — no cap banner after it', () => {
      const result = useBeforeAll(async () =>
        runCrew({
          command: `__crew_cap_nudge_refuted "  ⎿  ${CAP}\n${NUDGE}\n● Bash(npm run test)\n" && printf 'RESULT[refuted]' || printf 'RESULT[trust-peer]'`,
        }),
      );
      then(
        'it is NOT refuted — the cap sits ABOVE the nudge, which is scrollback',
        () => {
          // 🔴 this is the 2026-09-14 case the peer-active override was written for,
          //    and it must still fire. the guard NARROWS that branch; it must never
          //    retire it.
          expect(result.stdout).toContain('RESULT[trust-peer]');
        },
      );
    });

    when('[t2] a capped pane with NO prior nudge at all', () => {
      const result = useBeforeAll(async () =>
        runCrew({
          command: `__crew_cap_nudge_refuted "● Background command failed with exit code 2\n  ⎿  ${CAP}\n" && printf 'RESULT[refuted]' || printf 'RESULT[trust-peer]'`,
        }),
      );
      then('it is NOT refuted — the FIRST nudge still fires', () => {
        expect(result.stdout).toContain('RESULT[trust-peer]');
      });
    });

    when('[t3] two nudges, the LAST one answered with the cap', () => {
      const result = useBeforeAll(async () =>
        runCrew({
          command: `__crew_cap_nudge_refuted "${NUDGE}\n● Bash(npm run test)\n${NUDGE}\n  ⎿  ${CAP}\n" && printf 'RESULT[refuted]' || printf 'RESULT[trust-peer]'`,
        }),
      );
      then('it judges the MOST RECENT nudge only — refuted', () => {
        // .teeth = a non-greedy match would read the FIRST nudge, see the second
        //    nudge's success after it, and nudge forever.
        expect(result.stdout).toContain('RESULT[refuted]');
      });
    });
  });

  // .what = crew.heal cures a STALE usage-cap wedge — a live ❯ box under a
  //         `You've hit your limit · resets HH:MM` banner whose clock has PASSED —
  //         by a NUDGE, exactly as it cures a transient 429. a FUTURE reset is a
  //         LIVE cap and is left alone (a real wait / auth.swap).
  // .why  = the poll flagged "⏰ reset PASSED — healable" but heal only handled the
  //         bare `API Error: Rate limit reached`, so 6 grove clones with completed
  //         work idled at a dead cap banner (measured 2026-09-14). heal now routes
  //         the stale cap to __crew_heal_nudge.
  // .teeth = before the stale-cap branch, __crew_heal_one returned 3 ("a live claude
  //          box is up — no move") for a stale-cap pane, so t0 below would read
  //          healthy and issue no nudge. __CREW_NOW_EPOCH pins the clock UTC so the
  //          verdict holds on any box tz.
  given('[case16] a mechanic ALIVE but stopped on a STALE usage cap', () => {
    const PANE_TEXT_STALE_CAP = [
      '● Read 2 files',
      "  ⎿  You've hit your limit · resets 11:00am (UTC)",
      '     /extra-usage to finish this turn.',
      '─────────────────────────────────────────────',
      '❯ ',
      '─────────────────────────────────────────────',
      '🗿 5.3.verification, review.peer, l1@i001, malfunction 💥',
      '⏵⏵ accept edits on (shift+tab to cycle)',
    ].join('\n');

    when(
      '[t0] the cap reset has PASSED (now = UTC noon, reset 11:00am UTC)',
      () => {
        const result = useBeforeAll(async () =>
          runCrew({
            command: [
              `export __CREW_NOW_EPOCH="$(TZ=UTC date -d '12:00' +%s)"`,
              `crew.heal --tree ${TREE} --who mechanic --what work --mode apply`,
            ].join('\n'),
            paneText: PANE_TEXT_STALE_CAP,
          }),
        );

        then('it SURFACES the stale cap, not a healthy box', () => {
          expect(result.stdout).toContain('stale usage cap');
          expect(result.stdout).toContain('🚫');
          expect(result.stdout).not.toContain('a live claude box is up');
        });

        then('it NEVER reboots — a live claude keeps its conversation', () => {
          expect(
            result.calls.filter((c) => c.startsWith('crew.reboot')),
          ).toEqual([]);
          expect(result.calls.filter((c) => c.startsWith('duct.open'))).toEqual(
            [],
          );
          expect(result.calls.filter((c) => c.startsWith('duct.stop'))).toEqual(
            [],
          );
          expect(
            result.calls.some(
              (c) => c.includes('--resume') || c.includes('--continue'),
            ),
          ).toBe(false);
          expect(result.stdout).not.toContain('💀');
        });

        then(
          'in APPLY mode it NUDGES the wedge to retry — the cure, through the tool',
          () => {
            const nudges = result.calls.filter(
              (c) => c.startsWith('duct.send') && c.includes('--anyway'),
            );
            expect(nudges.length).toBe(1);
            expect(result.stdout).toContain('nudged to retry');
          },
        );
      },
    );

    when(
      '[t1] the cap reset is in the FUTURE (now = UTC noon, reset 1:00pm UTC)',
      () => {
        const PANE_TEXT_LIVE_CAP = [
          '● Read 2 files',
          "  ⎿  You've hit your limit · resets 1:00pm (UTC)",
          '─────────────────────────────────────────────',
          '❯ ',
          '─────────────────────────────────────────────',
          '🗿 5.3.verification, review.peer, l1@i001, malfunction 💥',
        ].join('\n');

        const result = useBeforeAll(async () =>
          runCrew({
            command: [
              `export __CREW_NOW_EPOCH="$(TZ=UTC date -d '12:00' +%s)"`,
              `crew.heal --tree ${TREE} --who mechanic --what work --mode plan`,
            ].join('\n'),
            paneText: PANE_TEXT_LIVE_CAP,
          }),
        );

        then(
          'a LIVE cap SURFACES the auth.swap cure — not a passive wait',
          () => {
            // 🔴 .teeth = this case ENCODED the defect until 2026-09-14: it asserted a
            //    live cap is "left alone — a real wait" and returned 3 ("a live claude
            //    box is up — no move"). so heal took no action on a live-capped
            //    sponsored star, and the operator read it as a passive wait to the
            //    future reset across 6 ticks (feat-rec-marketplace, resets Sep 20).
            //    the cure is an auth.swap to an uncapped account — global + hot,
            //    unblocks NOW (define.invariant.crew.ratelimit.live-cap-healable-via-
            //    swap). heal now SURFACES the swap; it never silently returns "no
            //    move". revert the live-cap branch in __crew_heal_one to see this red.
            expect(result.stdout).toContain('LIVE usage cap');
            expect(result.stdout).toContain('auth.swap');
            expect(result.stdout).toContain('git.grove.auth');
            expect(result.stdout).not.toContain('a live claude box is up');
            expect(result.stdout).not.toContain('stale usage cap');
          },
        );

        then(
          'a LIVE cap is NEVER nudged — a nudge would land on a spent-budget wall',
          () => {
            // the account budget is spent till reset, so a retry nudge hits a wall.
            // the ONLY cure is the swap; heal must surface it, never send a nudge.
            expect(
              result.calls.filter(
                (c) => c.startsWith('duct.send') && c.includes('--anyway'),
              ),
            ).toEqual([]);
            expect(
              result.calls.filter((c) => c.startsWith('crew.reboot')),
            ).toEqual([]);
            expect(result.stdout).not.toContain('nudged to retry');
          },
        );
      },
    );

    when(
      '[t2] AUTH IS GROVE-WIDE — a peer clone at work refutes the cap banner',
      () => {
        // 🔴 .the production miss, measured 2026-09-14 on grove-sandpine-v20260901.
        //    the poll rendered `🚫 limited · resets Sep 20` for THREE trees while
        //    FOUR clones on that SAME grove were plainly at work in the same pass
        //    — two of them revived by git.crew.heal in that very tick. a capped
        //    clone cannot emit tokens, so an active peer PROVES the account has
        //    budget and the banner is stale scrollback. the contradiction sat in
        //    one render, across two tally lines, for THREE consecutive ticks, and
        //    an auth.swap gate was relayed to the human on each one — a browser
        //    leg spent on a cap already lifted, while three real trees stayed
        //    parked for want of a nudge the supervisor owned the whole time.
        //    the human: "if any brain on that grove is active, they're all active".
        //    (define.invariant.crew.ratelimit.one-active-clone-refutes-every-cap-on-its-grove)
        const crewSrc = getShellLibWhole({
          path: join(__dirname, 'crewwork.sh'),
        });
        const healOne = (() => {
          const at = crewSrc.indexOf('__crew_heal_one() {');
          return at < 0 ? '' : crewSrc.slice(at, at + 24000);
        })();

        then(
          'the grove-activity check gates the swap branch, and fires BEFORE it',
          () => {
            // .teeth = ORDER carries the whole value. the grove check must sit ABOVE
            //          the bare `-n "$__capline"` swap branch, or a stale banner on
            //          an active grove reaches the swap guidance and the human is
            //          sent to a browser for a no-op. delete the guarded branch, or
            //          move it below the swap branch, to see this go red.
            expect(
              /-n "\$__capline" \]\] && __crew_grove_has_active_clone "\$grove"[\s\S]*LIVE usage cap/.test(
                healOne,
              ),
            ).toEqual(true);
          },
        );

        then(
          'a stale-on-active-grove cap is NUDGED, never handed an auth.swap',
          () => {
            // .teeth = the cure on an active grove is the supervisor's own nudge. the
            //          guarded branch must call __crew_heal_nudge and must NOT print
            //          git.grove.auth — that line belongs to the quiet-grove branch.
            const guarded = (() => {
              const at = healOne.indexOf(
                '__crew_grove_has_active_clone "$grove"',
              );
              const end = healOne.indexOf('LIVE usage cap');
              return at < 0 || end < 0 ? '' : healOne.slice(at, end);
            })();
            expect(guarded).not.toEqual('');
            expect(/__crew_heal_nudge/.test(guarded)).toEqual(true);
            expect(/git\.grove\.auth/.test(guarded)).toEqual(false);
            expect(/LIVE clock vs ACTIVE peer/.test(guarded)).toEqual(true);
          },
        );

        then(
          'it names itself a PROBE, never a verdict — the clock has NOT passed',
          () => {
            // 🔴 .the label defect, measured 2026-09-16 on grove-sandpine-v20260901.
            //    this branch printed `STALE cap … this banner is scrollback` about a
            //    cap whose reset clock sat 19 MINUTES in the FUTURE, and a supervisor
            //    quoted that word to a human as settled fact. the ACTION was right —
            //    the nudge landed and all three trees resumed — but the CLAIM was a
            //    confident verdict over a state the tool cannot see
            //    (term=false-report).
            //
            //    ⚠️ the passed-clock branch above OWNS the word `STALE`, and it earns
            //       it: __crew_cap_reset_passed proved the clock. this branch reaches
            //       the same ACTION on INDIRECT evidence while the clock contradicts
            //       it, so it must not borrow that word.
            //
            // .teeth = restore `STALE cap` on the label echo, or drop the PROBE
            //          caveat, to see either half go red.
            //
            // ⚠️ the regexes below target the ECHO, never the slice at large. the
            //    comment above this branch QUOTES the old label to record the
            //    defect, so a slice-wide /STALE cap/ matches that prose and passes
            //    whatever the echo says — a clamp with no teeth, caught by its own
            //    red-green probe on 2026-09-16.
            const guarded = (() => {
              const at = healOne.indexOf(
                '__crew_grove_has_active_clone "$grove"',
              );
              const end = healOne.indexOf('LIVE usage cap');
              return at < 0 || end < 0 ? '' : healOne.slice(at, end);
            })();
            expect(guarded).not.toEqual('');
            expect(/PROBE, never a verdict/.test(guarded)).toEqual(true);
            expect(
              /echo "🚫 \$tree\/\$who: LIVE clock vs ACTIVE peer/.test(guarded),
            ).toEqual(true);
            expect(/echo "🚫 \$tree\/\$who: STALE cap/.test(guarded)).toEqual(
              false,
            );
          },
        );

        then(
          'the quiet-grove swap branch says so, so a human can tell the two apart',
          () => {
            // .teeth = a correct verdict a human cannot distinguish from the wrong one
            //          is half a tool. the swap branch must state that the grove is
            //          QUIET — that is the premise its guidance rests on.
            expect(/the grove is QUIET/.test(healOne)).toEqual(true);
          },
        );

        then(
          'the grove check reads a live turn, never a durable banner',
          () => {
            // .teeth = the discriminator must be PRESENT-TENSE. a token counter that
            //          climbs and an `esc to interrupt` hint are drawn per frame by a
            //          live turn, so neither survives a halt — unlike a cap banner,
            //          which persists in scrollback long past its cause. swap the
            //          grep for a banner match to see this go red.
            const helper = (() => {
              const at = crewSrc.indexOf('__crew_grove_has_active_clone() {');
              return at < 0 ? '' : crewSrc.slice(at, at + 2000);
            })();
            expect(helper).not.toEqual('');
            expect(
              /↓ \[0-9\.\]\+k\? tokens\|esc to interrupt/.test(helper),
            ).toEqual(true);
          },
        );

        then(
          '🔴 the grove check builds its uri from a HOST, never a raw grove',
          () => {
            // .teeth = __crew_duct_uri takes a bare HOST and prints `duct://<host>/…`.
            //          hand it `cloud://grove-x` and it yields
            //          `duct://cloud://grove-x/…` — malformed, so EVERY duct.read
            //          fails and the `|| continue` reads each failure as an idle
            //          clone. that is a silent false negative on every grove tree,
            //          and it is the exact defect class this check was written to
            //          close.
            //
            // .measured 2026-09-15, on this function's first live run: it reported
            //           `the grove is QUIET` about grove-sandpine-v20260901 while four
            //           clones were at work on it.
            //
            // .swap `"$host"` back to `"$grove"` in the uri build to see this go red.
            const helper = (() => {
              const at = crewSrc.indexOf('__crew_grove_has_active_clone() {');
              const end = crewSrc.indexOf('__crew_ledger_rows)', at);
              return at < 0 || end < 0 ? '' : crewSrc.slice(at, end);
            })();
            expect(helper).not.toEqual('');

            // the grove is converted through the seam that owns the conversion
            expect(
              /host="\$\(__crew_grove_host "\$grove"\)"/.test(helper),
            ).toEqual(true);

            // and the uri is built from THAT host, never from the grove
            expect(/__crew_duct_uri "\$host"/.test(helper)).toEqual(true);
            expect(/__crew_duct_uri "\$grove"/.test(helper)).toEqual(false);
          },
        );
      },
    );
  });

  // .what = crew.heal cures a transient-429 wedge whose banner sits ABOVE claude's
  //         own interrupted-turn cleanup — a `✻ Cogitated`, an `● Agent completed`,
  //         an `● Background command failed`, a re-rendered task list — with the box
  //         then EMPTY and idle. the banner is the halt; the cleanup below it is not
  //         new work, so the wedge must still be detected and NUDGED.
  // .why  = PRODUCTION MISS, measured 2026-09-14 on svc-reservations.beav.feat-spot-
  //         forecast-widget. a driver ran `route.guard.budget --add 3`, the api
  //         429'd, and claude rendered a cogitation + agent/background notices + the
  //         task list BELOW the banner before the box went idle. the detector scoped
  //         the banner to the last 4 NON-chrome lines, and `● …`/`⎿ …` markers are
  //         not chrome, so they pushed the banner out of the window and the wedge
  //         read `😶 at work` — idle for HOURS, unhealed, TWICE
  //         (define.invariant.crew.ratelimit.healable-transient; the ANCHOR test).
  // .teeth = under the un-fixed detector the `● …` cleanup lines count as real and
  //          bury the banner past the tail, so t0 reads healthy and issues no nudge.
  //          the fix checks is_banner BEFORE is_chrome and treats claude's post-error
  //          markers (`● …`, `⎿ …`) as chrome, so any amount of interrupted-turn
  //          cleanup cannot hide the halt. t1 keeps the RECOVERY counter honest: a
  //          banner buried under REAL new work (plain output lines) still reads
  //          healthy — the window on genuine non-chrome output is what parts a
  //          retried-past banner from a live halt.
  given(
    "[case17] a transient 429 buried under claude's interrupted-turn cleanup",
    () => {
      const PANE_TEXT_429_UNDER_CLEANUP = [
        '● Bash(rhx route.guard.budget --for review --add 3 --stone 5.3.verification --route .behavior/v2026_09_07.feat-spot-forecast-widget)',
        '  ⎿  🪨 run solid skill repo=bhrain/role=driver/skill=route.guard.budget',
        '     … +18 lines (ctrl+o to expand)',
        // 🔴 the teeth: claude renders the ⎿ result marker followed by a
        //    NON-BREAKING space (U+00A0) — the exact byte captured 2026-09-14 on
        //    svc-reservations. an ascii-space fixture passed against the un-fixed
        //    detector — a clamp with no teeth. `[[:space:]]` does not match
        //    U+00A0, so is_banner failed and the ⎿-chrome rule swallowed it.
        '  ⎿ \u00a0API Error: Rate limit reached',
        '',
        '✻ Cogitated for 40s',
        '',
        '● Background command "Re-arrive: re-run all peer lanes against the fixed tree" failed with exit code 2',
        '',
        '● Agent "Fix two perf-nitpick transformers" completed',
        '',
        '● Agent "Lift the origin-verify secret" completed',
        '',
        '● Read 3 files',
        '',
        '● Background command "watch the release CI" failed with exit code 2',
        '',
        '  20 tasks (17 done, 1 in progress, 2 open)',
        '  ◼ Converge the i035 review ladder to terminal',
        '  ◻ Lift the origin-verify secret off terraform into declastruct-aws',
        '  ✔ Finalize contract from vision cases + infra read',
        '   … +17 completed',
        '─────────────────────────────────────────────',
        '❯ ',
        '─────────────────────────────────────────────',
        '  🗿 5.3.verification, review.peer, l1@i003, blocked ✋',
        '  ⏵⏵ accept edits on (shift+tab to cycle)',
      ].join('\n');

      when(
        '[t0] crew.heal reads the wedge, banner above the cleanup, box idle',
        () => {
          const result = useBeforeAll(async () =>
            runCrew({
              command: `crew.heal --tree ${TREE} --who mechanic --what work --mode apply`,
              paneText: PANE_TEXT_429_UNDER_CLEANUP,
            }),
          );

          then('it SURFACES the rate-limit wedge, not a healthy box', () => {
            expect(result.stdout).toContain('rate-limited');
            expect(result.stdout).toContain('🚫');
            expect(result.stdout).not.toContain('a live claude box is up');
          });

          then(
            'it NEVER reboots — a live claude keeps its conversation',
            () => {
              expect(
                result.calls.filter((c) => c.startsWith('crew.reboot')),
              ).toEqual([]);
              expect(
                result.calls.filter((c) => c.startsWith('duct.open')),
              ).toEqual([]);
              expect(
                result.calls.filter((c) => c.startsWith('duct.stop')),
              ).toEqual([]);
              expect(
                result.calls.some(
                  (c) => c.includes('--resume') || c.includes('--continue'),
                ),
              ).toBe(false);
              expect(result.stdout).not.toContain('💀');
            },
          );

          then(
            'in APPLY mode it NUDGES the wedge to retry — the cure, through the tool',
            () => {
              const nudges = result.calls.filter(
                (c) => c.startsWith('duct.send') && c.includes('--anyway'),
              );
              expect(nudges.length).toBe(1);
              expect(result.stdout).toContain('nudged to retry');
            },
          );
        },
      );

      when('[t1] the SAME banner but buried under REAL recovered work', () => {
        // .teeth = the recovery counter. a banner claude retried PAST, then produced
        //          real new output below, must stay healthy — the non-chrome work is
        //          the signal it recovered. this guards the fix from a false trip.
        const PANE_TEXT_RECOVERED = [
          '  ⎿ \u00a0API Error: Rate limit reached',
          ...Array.from(
            { length: 20 },
            (_, i) => `  processed item ${i + 1} — recovered and moved on`,
          ),
          '─────────────────────────────────────────────',
          '❯ ',
          '─────────────────────────────────────────────',
          '  🗿 5.3.verification, review.peer, l1@i003, blocked ✋',
        ].join('\n');

        const result = useBeforeAll(async () =>
          runCrew({
            command: `crew.heal --tree ${TREE} --who mechanic --what work --mode plan`,
            paneText: PANE_TEXT_RECOVERED,
          }),
        );

        then(
          'a banner past real work reads healthy, never rate-limited',
          () => {
            expect(result.stdout).toContain('a live claude box is up');
            expect(result.stdout).not.toContain('rate-limited');
          },
        );
      });
    },
  );

  given('[case28] a tree the LEDGER does not name, handed to crew.heal', () => {
    /**
     * 🔴 .the measured defect, 2026-09-14 → 2026-09-15, task #96
     *
     *    heal derives its box from the ledger and falls through to `local`
     *    SILENTLY. for the phantom tree `main` it then printed three TRUE
     *    lines about a box that holds no such crew, and exited 0:
     *
     *      ⏳ main/mechanic: unread (no capture) — skipped, not a verdict
     *      💀 main/mechanic: no live duct — a tab needs work to look at
     *      🪑 main/mechanic: not a local seat — its cwd already resolves …
     *      EXIT=0
     *
     *    byte-identical for SEVEN consecutive ticks. a supervisor under the
     *    tick contract ("run each emitted line verbatim") reads that 0 as a
     *    clean run, which is why it survived seven (rule.forbid.failhide).
     *
     * 🔴 .and heal was the ONLY silent verb of SIX. read (crewwork.sh:1980),
     *    send (:3391), reboot (:2147), boot (:3512) and stop (:3914) each
     *    announce the same fallback; heal said naught. so the cure is not a
     *    new sentence — it is the sentence its five peers already print
     *    (rule.require.ubiqlang: one concept, one wording).
     *
     * ⚠️ .the FALLBACK is legitimate — only the SILENCE is the defect, and a
     *    naive `return 2` at the derivation is measurably wrong: it reddened
     *    sixteen heal clamps whose fixture trees are rowless BY DESIGN.
     *    `crew.ledger --backfill` (crewwork.sh:1411) seeds rows from live
     *    tmux ∪ duct registry and states "the ledger begins empty", so a
     *    rowless tree with a live local session is an acknowledged
     *    PRODUCTION state — and backfill resolves it to `local` itself.
     *
     *    ⇒ so the refusal must key on REACHED-NAUGHT, never on rowless.
     *      t1 below is the clamp that keeps that distinction honest.
     */

    when('[t0] no duct is reachable on the box it fell back to', () => {
      // .the fixture = a rowless ledger AND an empty pane. `paneText: ''`
      //    makes the faked duct.read return naught, which is exactly what
      //    __crew_heal_one reads as `⏳ unread (no capture)` (crewwork.sh:2240)
      //    — the skill's own signal that it reached naught.
      //
      // ⚠️ paneText MUST be passed. the harness defaults FAKE_PANE_TEXT to a
      //    non-empty '(fake pane, no picker)', so an omitted field would hand
      //    heal a readable pane and this case would grade the wrong state.
      const result = useBeforeAll(async () =>
        runCrew({
          command: `crew.heal --tree ${TREE} --who mechanic --mode plan`,
          paneText: '',
          sessions: [],
        }),
      );

      then('it REFUSES — the 0 was the failhide, and it is gone', () => {
        // 🔴 the whole point. every line heal printed was true; the EXIT was
        //    the lie, because it is the one field an automation reads.
        expect(result.exit).toEqual(2);
      });

      then('it says the ledger named no row — the silence is broken', () => {
        const said = `${result.stdout}${result.stderr}`;
        expect(said).toContain('no ledger row');
        expect(said).toContain(TREE);
      });

      then(
        'it names the GROVE override — the cure a grove-hosted crew needs',
        () => {
          // ⚠️ .this comment USED to read "the most likely truth behind a
          //    rowless tree is that the crew lives on a grove". struck
          //    2026-09-19: that claim was never measured, and it was wrong on
          //    the very next instance — see [t4] for the case that refuted it.
          //    the cure now names three causes and ranks NONE.
          //
          //    the override still must be named, or the operator finds
          //    `--grove` by hand (the measured cost of task #44).
          const said = `${result.stdout}${result.stderr}`;
          expect(said).toContain('--grove cloud://');
        },
      );

      then('it names the BACKFILL — the cure a pre-ledger crew needs', () => {
        // verified real against --help, 2026-09-15: `git.crew.ledger --backfill`
        // exists, so this is a runnable command rather than a gesture
        // (rule.require.errors-name-the-fix).
        const said = `${result.stdout}${result.stderr}`;
        expect(said).toContain('git.crew.ledger --backfill');
      });

      then('it names the THIRD cause — the tree is GONE', () => {
        // 🔴 .the cause the shipped hint omitted, and the one that held on
        //    2026-09-19. both named cures are WRONG for it: `--grove` sends
        //    the reader across every box after a tree that does not exist,
        //    and `--backfill` churns the ledger for a row that SHOULD stay
        //    absent. a clean closeout, reported as a locality fault
        //    (term=false-report).
        const said = `${result.stdout}${result.stderr}`;
        expect(said).toContain('GONE');
        expect(said).toContain('felled after merge');
        expect(said).toContain('mistyped name');
      });

      then(
        'it prescribes the READ that parts the three, and ranks none',
        () => {
          // 🔴 .the honest-hedge shape: a tool that cannot measure the cause
          //    must prescribe a READ, never a ranked guess. and the read is
          //    free — `rhx git.crew.ledger` bare is cross-grove, and it is the
          //    very read whose empty return fired this branch.
          const said = `${result.stdout}${result.stderr}`;
          expect(said).toContain('THREE causes fit');
          expect(said).toContain('parts none of them');
          expect(said).toContain(
            'rhx git.crew.ledger names every tree, cross-grove',
          );
        },
      );

      then(
        'it says what an ABSENT-there outcome means — neither cure applies',
        () => {
          // ⚠️ .a read with no verdict attached sends the reader back to the
          //    same two wrong moves. so the outcome must be spelled out, or
          //    the prescription is a gesture (rule.require.errors-name-the-fix).
          const said = `${result.stdout}${result.stderr}`;
          expect(said).toContain('no --grove and no --backfill will find it');
        },
      );
    });

    when(
      '[t1] a rowless tree whose pane IS readable — the 16-clamp arm',
      () => {
        /**
         * 🔴 THE REGRESSION GUARD, and the reason this case exists at all.
         *
         *    this is the state every one of the sixteen reddened clamps models:
         *    no ledger row, and a session that is genuinely local. a refusal
         *    keyed on `rowless` goes red here; a refusal keyed on
         *    `reached naught` stays green.
         *
         *    ⇒ revert the cure to a bare `return 2` under the `-z "$grove"`
         *      branch to watch this go red — that is the measured wrong cure.
         */
        const PANE_HUSK = [
          '❯ ',
          'Resume this session with:',
          'claude --resume "mechanic"',
          '💥143 ➜',
        ].join('\n');

        const result = useBeforeAll(async () =>
          runCrew({
            command: `crew.heal --tree ${TREE} --who mechanic --what work --mode plan`,
            paneText: PANE_HUSK,
          }),
        );

        then(
          'it PROCEEDS — a readable pane is a reach, so naught is hidden',
          () => {
            expect(result.exit).toEqual(0);
          },
        );

        then(
          'it still renders its verdict — the cure silenced no census',
          () => {
            // a cure that swallows heal's own report is not a cure
            // (rule.forbid.clipped-sweeps).
            expect(result.stdout).toContain('husk');
          },
        );

        then(
          'and it STILL says the row was absent — loud, yet not fatal',
          () => {
            // 🔴 the two halves are independent: the LINE is unconditional, the
            //    REFUSAL is not. a cure that only refused would leave every
            //    reachable rowless tree as silent as before.
            const said = `${result.stdout}${result.stderr}`;
            expect(said).toContain('no ledger row');
          },
        );
      },
    );

    when('[t2] a tree the ledger DOES name', () => {
      const result = useBeforeAll(async () =>
        runCrew({
          command: `crew.heal --tree ${TREE} --who mechanic --what work --mode plan`,
          ledger: [{ tree: TREE, grove: 'cloud://grove-1' }],
          paneText: '',
        }),
      );

      then('no fallback line is printed — there was no fallback', () => {
        // ⚠️ ANCHORED. a bare negative passes vacuously over empty output, so
        //    the positive companion proves heal actually ran on this row.
        const said = `${result.stdout}${result.stderr}`;
        expect(said).toContain('crew.heal');
        expect(said).not.toContain('no ledger row');
      });

      then(
        'and it does NOT refuse — a named grove is never the failhide',
        () => {
          // 🔴 the refusal must key on the ABSENT ROW, never on an unreadable
          //    pane alone. a grove that is merely down is a different defect
          //    with a different cure, and heal must not conflate the two.
          expect(result.exit).toEqual(0);
        },
      );
    });

    when('[t3] the wording, held against the five peer verbs', () => {
      const lib = getShellLibWhole({ path: join(__dirname, 'crewwork.sh') });

      // ⚠️ EXECUTED lines only. heal's own `.why` block quotes the defect
      //    verbatim, so a naive match would grade the COMMENT that records
      //    the cure as though it were the cure.
      const spoken = lib
        .split('\n')
        .filter((line) => !/^\s*#/.test(line))
        .filter((line) => line.includes('no ledger row'));

      then('every verb that falls back says so — six of six', () => {
        // 🔴 DERIVED over the SET, never over a known list. a seventh verb
        //    that adds a silent fallback reddens this, which is the whole
        //    reason it is written as a derivation
        //    (rule.require.a-cue-is-not-a-claim).
        expect(spoken.length).toBeGreaterThanOrEqual(6);
      });

      then('heal is no longer the odd one out', () => {
        // anchored inside heal's OWN body: `grove="${grove:-local}"` appears
        // four times in this file, so a bare indexOf lands on a peer verb's
        // copy and grades the wrong function while it reads as a pass.
        const heal = getShellFnBody({ text: lib, fn: 'crew.heal' });
        expect(heal).toContain('crew.heal: --tree required');

        // 🔴 COMMENTS STRIPPED, and this is a MEASURED repair: on the first RED
        //    run this assertion was the one false GREEN of eleven, because
        //    heal's own `.why` block quotes `no ledger row` while it records the
        //    defect. so the clamp graded the COMMENT that documents the cure as
        //    though it were the cure — it would have stayed green forever and
        //    guarded naught (rule.forbid.failhide).
        const spokenInHeal = heal
          .split('\n')
          .filter((line) => !/^\s*#/.test(line))
          .join('\n');
        expect(spokenInHeal).toContain('no ledger row');
      });
    });

    when(
      '[t4] the THIRD cause, across every verb that carries the long hint',
      () => {
        /**
         * 🔴 .the measured defect, 2026-09-19 — a fix list built on ONE instance
         *
         *    a supervisor drilled into
         *    `rhachet-roles-bhrain.beav.feat-dispute-or-concede-review-budget`
         *    and got, stacked:
         *
         *      🌐 no ledger row … pass --grove cloud://<name>, or … --backfill
         *      ✋ duct.read: session … is absent on this machine
         *         fix:  tmux list-sessions
         *
         *    the tree was GONE — pr #511 merged 2026-09-17, released v0.36.0,
         *    the crew felled after. the cleanest possible closeout, reported as
         *    a LOCALITY fault, with THREE named moves and all three wrong.
         *
         * ⚠️ .the shape is `rule.require.enumerate-before-you-name`. the list was
         *    written against task #44 — a real grove crew with an absent row —
         *    and never tested against a second instance. a list that covers the
         *    one instance in view reads complete, which is exactly why a sample
         *    of one can neither confirm a word nor refute it.
         *
         * 🔴 .and the discriminator was ALREADY IN HAND: this branch fires
         *    BECAUSE the ledger read came back empty, so the failed read is
         *    evidence FOR the omitted cause. the tool held the term that
         *    settles it and pointed the reader elsewhere (term=false-report).
         *
         * ✅ .so the cure prescribes a READ and ranks NO cause. a ranked guess
         *    here would be the forecast-before-the-hunt defect committed inside
         *    its own repair.
         */
        const lib = getShellLibWhole({ path: join(__dirname, 'crewwork.sh') });

        // ⚠️ EXECUTED lines only — the `.why` block above the crew.read site
        //    quotes the cured phrases verbatim, so an unstripped read would
        //    grade the COMMENT that records the cure as though it were the
        //    cure. that exact false-green is measured in [t3] above.
        const spoken = lib
          .split('\n')
          .filter((line) => !/^\s*#/.test(line))
          .filter((line) => line.includes('THREE causes fit'));

        then('every long-hint verb carries it — read, heal, send', () => {
          // 🔴 ANTI-VACUITY + DERIVED over the set. the file states the
          //    invariant itself: this sentence is byte-identical at all three
          //    sites (rule.require.ubiqlang — one concept, one wording). a cure
          //    at one site alone splits one concept into two phrasings, and a
          //    fourth verb that grows a long hint reddens this too.
          expect(spoken.length).toBeGreaterThanOrEqual(3);
        });

        then('each names the GONE cause and refuses to rank the three', () => {
          expect(spoken.length).toBeGreaterThanOrEqual(3);
          spoken.forEach((line) => {
            expect(line).toContain('GONE');
            expect(line).toContain('felled after merge');
            expect(line).toContain('parts none of them');
          });
        });

        then(
          'each prescribes the free cross-grove READ, and states its outcome',
          () => {
            // ⚠️ the read must be NAMED and its verdict SPELLED OUT. a bare
            //    "go check the ledger" returns the reader to the same two wrong
            //    moves (rule.require.errors-name-the-fix).
            expect(spoken.length).toBeGreaterThanOrEqual(3);
            spoken.forEach((line) => {
              expect(line).toContain(
                'rhx git.crew.ledger names every tree, cross-grove',
              );
              expect(line).toContain(
                'no --grove and no --backfill will find it',
              );
            });
          },
        );

        then('COUNTER — the two prior cures survive, untouched', () => {
          // 🔴 the cure ADDS a third cause; it retires neither of the first two.
          //    under a revert of this cure these two stay green, which is what
          //    makes them scope evidence rather than more of the same tooth.
          expect(spoken.length).toBeGreaterThanOrEqual(3);
          spoken.forEach((line) => {
            expect(line).toContain('--grove cloud://');
            expect(line).toContain('git.crew.ledger --backfill');
          });
        });

        then('COUNTER — the SHORT-hint verbs are untouched', () => {
          // 🔴 boot, stop and reboot print a different, shorter sentence and
          //    were deliberately left alone. if this cure had swept the file
          //    rather than the three sites that share one phrase, this goes red
          //    — so it grades the SCOPE of the repair, never its content.
          const terse = lib
            .split('\n')
            .filter((line) => !/^\s*#/.test(line))
            .filter((line) => line.includes('fell back to grove=local'));
          expect(terse.length).toBeGreaterThanOrEqual(3);
          terse.forEach((line) => {
            expect(line).not.toContain('THREE causes fit');
          });
        });
      },
    );
  });
});
