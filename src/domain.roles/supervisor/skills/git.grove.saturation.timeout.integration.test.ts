/**
 * .what = clamps on the timeout arm — rc 124, ssh timeouts, oom guard, cpu rows, the floor
 *
 * .note = a PART of the `git.grove.saturation` suite, cut so one reviewer can hold
 *         it whole. the suite's shared fixtures, and its account of what it
 *         runs against and why, live in git.grove.saturation.harness.ts.
 */
import { readFileSync } from 'fs';
import { given, then, useThen, when } from 'test-fns';

import { tempDirs } from '../../.test/tempDirs';
import {
  getProbePayload,
  PATH_SAT,
  runPayload,
} from './git.grove.saturation.harness';

/**
 * .what = sweep the temp dirs [case2] made
 * .why  = each arm writes a payload file and a spinner; a suite that litters
 *         /tmp is clean on run 1 and filthy on run 1000.
 */
afterAll(() => {
  tempDirs.delAll();
});

/**
 * [case-timeout] — a timeout on a SATURATION probe is EVIDENCE, not a failed read
 *
 * 🔴 .the harm = the `rc == 124` arm named ONE cause — `a slower box?` — and a
 *    timeout here has TWO, whose cures invert:
 *
 *      far / small box  ⇒ raise the budget. the flag IS the fix
 *      SATURATED box    ⇒ the budget is not the defect. provision the box
 *
 *    and the second is the likelier, because this probe is cheap. a box that
 *    cannot answer it inside the budget is a box whose cpu is spoken for.
 *
 * ⚠️ so the instrument goes blind EXACTLY when its subject saturates: a fixed
 *    budget meets a box that is slow by definition, and its reliability falls
 *    as the need for it rises.
 *
 *    measured 2026-09-17 on grove-sandpine-v20260901 — the default sweep timed
 *    out, and the raised read returned `🔴 cpu load 14.78 / 4 = 370% · runq 10
 *    · 6 in D · 2 oom kills`. a supervisor who took `a slower box?` at face
 *    value would have dismissed the one grove that most needed the read.
 *
 * ⇒ the twelfth instance of `rule.require.enumerate-before-you-name`.
 */
describe('git.grove.saturation — the timeout arm', () => {
  /**
   * 🔴 .the NEXT-MOVE BUILDER, read as a peer of the hint line
   *
   * both timeout arms used to render their own re-read ladder inline. that
   * ladder doubled UNCONDITIONALLY, with no cap, while the prose beside it
   * said "re-read" — singular — so a supervisor who runs emitted lines
   * verbatim climbs 20→40→80→160 forever. the cure lifted the ladder into
   * `__sat_next_move`, which bounds it at one re-read and then names a WAKE.
   *
   * ⚠️ so a tooth that reads the HINT LINE alone can no longer see the
   *    confirm — the arm now carries a call, and the builder carries the
   *    command. the teeth below read BOTH halves: the arm must pass the
   *    ENTRY name in, and the builder must render the scoped confirm.
   *
   * ⇒ the delegation itself is graded by `[case12]`, which also forbids an
   *   unconditional ladder anywhere outside this builder.
   */
  const nextMove = (src: string): string => {
    const at = src.indexOf('__sat_next_move() {');
    // ⚠️ ANTI-VACUITY — a renamed builder would slice an empty body and read
    //    as a clean pass on every assertion below (`rule.forbid.failhide`).
    expect(at).toBeGreaterThan(0);
    const end = src.indexOf('\n    }', at);
    expect(end).toBeGreaterThan(at);
    return src
      .slice(at, end)
      .split('\n')
      .filter((line) => !/^\s*#/.test(line))
      .join('\n');
  };

  given('[case-timeout] the rc==124 render arm', () => {
    when('[t0] read from source', () => {
      const src = readFileSync(PATH_SAT, 'utf8');
      /**
       * 🔴 the HINT LINE, never the whole arm.
       *
       * the arm carries a comment block that explains the cure, and that block
       * repeats the cure's own phrases. so an assertion scoped to the arm reads
       * the COMMENT and passes whether or not the hint says a word — measured
       * on my own first draft of this clamp, where `this probe is cheap` stayed
       * green through a full revert while its four peers went red.
       *
       * ⇒ a clamp on a render must read the line that RENDERS
       *   (`rule.require.clamp-edge-cases` — a clamp with no teeth is worse
       *   than an absent one, because it reads as protection).
       */
      const arm = (): string => {
        const at = src.indexOf('if [[ "$rc" == "124" ]]; then');
        expect(at).toBeGreaterThan(0);
        const end = src.indexOf('Connection refused', at);
        expect(end).toBeGreaterThan(at);
        const lines = src
          .slice(at, end)
          .split('\n')
          .filter((line) => !/^\s*#/.test(line) && /\bhint=/.test(line));
        // ⚠️ ANTI-VACUITY — a renamed variable would empty the filter and read
        //    as a clean pass on every assertion below (`rule.forbid.failhide`).
        expect(lines.length).toBe(1);
        return lines[0]!;
      };

      // 🔴 THE TOOTH. the prior hint read `a slower box? raise it: --timeout N`
      //    — one cause, phrased as the whole answer. a clamp that merely
      //    asserted "a hint exists" would have stayed green through the defect.
      then('the hint no longer names the slow box as the sole cause', () => {
        expect(arm()).not.toContain('a slower box? raise it');
      });

      then('it states outright that a timeout IS a saturation signal', () => {
        expect(arm()).toContain('a timeout IS a saturation signal');
      });

      // 🔴 the reason the reader can act on it: the probe's CHEAPNESS is what
      //    makes a timeout evidence. drop that clause and the claim is bare
      //    assertion, and a reader is right to discount it.
      then('it gives the reason — the probe is cheap', () => {
        expect(arm()).toContain('this probe is cheap');
      });

      then('it names LOADED as the likely state, over merely far', () => {
        const text = arm();
        expect(text).toContain('LOADED');
        expect(text).toContain('not merely far');
      });

      // ⚠️ the confirm must be RUNNABLE and scoped to the one grove. the prior
      //    hint handed back a bare flag, so a reader re-swept every box to
      //    re-probe one — and paid the same timeout again on the others.
      then('the confirm is scoped to THIS grove, never a re-sweep', () => {
        // 🔴 BOTH halves. the arm must hand the ENTRY name to the builder —
        //    the same entry-name form the asleep arm hands to git.grove.wake,
        //    since a `--only` takes an ENTRY name, never the host:port key —
        //    and the builder must render the scoped confirm off it.
        expect(arm()).toContain('$(__sat_next_move "${GROVE_PROBER[$key]}")');
        expect(nextMove(src)).toContain(
          'rhx git.grove.saturation --only ${entry}',
        );
      });

      // ⚠️ the budget half is REAL and must survive the cure that bounded it:
      //    a FIRST read still earns exactly one doubled re-read. what the cure
      //    removed is the SECOND one — see [case12].
      then(
        'the confirm still raises the budget, since that half is real',
        () => {
          expect(nextMove(src)).toContain('--timeout $((TIMEOUT * 2))');
        },
      );
    });
  });

  /**
   * .what = SSH's OWN timeout, which is not rc 124 and was not sorted as one
   *
   * 🔴 .why = the arm above catches the `timeout` command's budget expiry. ssh
   *        carries a SECOND, independent clock: it exits 255 with `Connection
   *        timed out ... banner exchange` when the TCP connect SUCCEEDS and
   *        sshd cannot fork a session inside LoginGraceTime.
   *
   *        that is the SAME EVIDENCE the rc-124 arm calls a saturation signal —
   *        the box answered at the network layer and could not spare a process.
   *        yet rc is 255, so it fell to the catch-all and rendered:
   *
   *          🌳 grove-sandpine-v20260901.ground + grove-sandpine-v20260901
   *             └─ 💥 unreadable — Connection timed out ... banner exchange
   *
   *        no hedge, no cause named, and NO re-read prescribed — where its twin
   *        one arm up hands back a scoped confirm.
   *
   *   ⚠️  measured 2026-09-19 on the box that carries EVERY sponsored star. two
   *       full `git.crew.poll` derivations reached that same grove SECONDS
   *       later, so the verdict was a point sample of a flappy channel rendered
   *       as a terminal condition (term=false-report — a failed READ reported
   *       as a fact about the BOX).
   *
   * 🔴 .the harm is the SUPERVISOR's next move, never the words
   *       the babysit contract says to halt sprouts and fell what `--fellable`
   *       names on a stalled grove. `💥 unreadable` with no re-read offered
   *       invites a fleet-wide halt on one missed handshake.
   *       ⇒ the rc-124 arm's own comment already predicted this shape: "the
   *         instrument goes blind EXACTLY when its subject saturates".
   */
  given(
    '[case-ssh-timeout] ssh\u2019s own timeout renders as EVIDENCE, never as unreadable',
    () => {
      when('[t0] read from source', () => {
        const src = readFileSync(PATH_SAT, 'utf8');

        /**
         * 🔴 the HINT LINE, never the whole arm — the same trap its rc-124 twin
         *    documents. the arm carries a comment block that repeats the hint's
         *    own phrases, so an assertion scoped to the arm reads the COMMENT and
         *    passes through a full revert.
         */
        const arm = (): string => {
          const at = src.indexOf('elif [[ "$err" == *"timed out"*');
          expect(at).toBeGreaterThan(0);
          const end = src.indexOf('state="💥 unreadable"', at);
          expect(end).toBeGreaterThan(at);
          const lines = src
            .slice(at, end)
            .split('\n')
            .filter((line) => !/^\s*#/.test(line) && /\bhint=/.test(line));
          // ⚠️ ANTI-VACUITY — a renamed variable would empty the filter and read
          //    as a clean pass on every assertion below (`rule.forbid.failhide`).
          expect(lines.length).toBe(1);
          return lines[0]!;
        };

        // 🔴 THE TOOTH. the arm must exist AND must sort ahead of the catch-all;
        //    delete it and `indexOf` returns -1, which this asserts against.
        then('the arm exists, and sits ABOVE the unreadable catch-all', () => {
          const atArm = src.indexOf('elif [[ "$err" == *"timed out"*');
          const atElse = src.indexOf('state="💥 unreadable"');
          expect(atArm).toBeGreaterThan(0);
          expect(atElse).toBeGreaterThan(atArm);
        });

        // 🔴 the verdict itself — a timeout, never `unreadable`. this is the
        //    whole defect: the state word drives how a supervisor reads the row.
        then('it renders the TIMEOUT state, not the unreadable one', () => {
          const at = src.indexOf('elif [[ "$err" == *"timed out"*');
          const end = src.indexOf('state="💥 unreadable"', at);
          const body = src
            .slice(at, end)
            .split('\n')
            .filter((line) => !/^\s*#/.test(line))
            .join('\n');
          expect(body).toContain('state="⏳ timeout"');
          // COUNTER: it must not ALSO claim unreadable inside its own arm
          expect(body).not.toContain('💥 unreadable');
        });

        then(
          'it names the cause — sshd could not spare a process in time',
          () => {
            expect(arm()).toContain('LoginGraceTime');
          },
        );

        // 🔴 the HEDGE. a timeout here has two causes and this arm must not pick
        //    one: a loaded box AND a transient flap wear the same stderr. the
        //    2026-09-19 datum was the flap, and a row that asserted LOAD outright
        //    would have been confidently wrong.
        then('it hedges BOTH causes — load and a transient flap', () => {
          const text = arm();
          expect(text).toContain('LOAD signal');
          expect(text).toContain('transient flap');
          expect(text).toContain('settles NAUGHT on its own');
        });

        // ⚠️ the operative clause. without it a supervisor may act on a failed
        //    read, which is the harm the whole case exists for.
        then('🔴 it forbids a fell or a sprout-halt on this row', () => {
          const text = arm();
          expect(text).toContain('do NOT halt a sprout or fell a crew');
          expect(text).toContain('a failed read is not a claim about the box');
        });

        // the same runnable, single-grove confirm its rc-124 twin hands back —
        // a `--only` takes an ENTRY name, never the host:port key
        then('the re-read is scoped to THIS grove, never a re-sweep', () => {
          // 🔴 BOTH halves, as its rc-124 twin. the arm hands the ENTRY name in;
          //    the builder renders the scoped confirm and the one doubled budget.
          expect(arm()).toContain('$(__sat_next_move "${GROVE_PROBER[$key]}")');
          const body = nextMove(src);
          expect(body).toContain('rhx git.grove.saturation --only ${entry}');
          expect(body).toContain('--timeout $((TIMEOUT * 2))');
        });

        // ⚠️ the raw stderr must SURVIVE. the catch-all's one virtue was that it
        //    printed what ssh actually said, and a re-sort that dropped it would
        //    trade one defect for another.
        then('COUNTER: the raw stderr is still carried', () => {
          expect(arm()).toContain('${err:-no stderr}');
        });
      });
    },
  );

  /**
   * .what = the userland half of the oom breakdown, and WHICH guard it names
   *
   * 🔴 .why = the render contradicted itself in one block, on two lines that
   *        touch:
   *
   *          ├─ oom  🔴 7 kill(s) in 14.0d uptime  ·  guard: none
   *          │       ├─ ? by earlyoom — its journal is unreadable here,
   *          │       │   so its TERMs are UNCOUNTED
   *          │       └─ 7 by the kernel (SIGKILL …)
   *
   *        `guard: none` says earlyoom does not run. the next line says its
   *        TERMs are uncounted. if it does not run it TERMed no one, so that
   *        half is not unknown — it is ZERO, and the kernel figure is the
   *        WHOLE total.
   *
   *   ⚠️  measured 2026-09-17 on `local`, and it INVERTS the partial-audit
   *       harm: rather than a confident verdict that hides an omission, this
   *       is a FABRICATED omission that undermines a complete count. a reader
   *       sees `7` and is told the real number may be higher — permanently,
   *       unresolvably — so they discount a figure that is exact.
   *
   * 🔴 .the discriminator was already derived, and already PRINTED
   *       `oom_guard` is computed at the probe and rendered on the header line
   *       one row above. `__oom_eline` branched on `oom_esrc` alone — whether
   *       the journal READ — and never asked whether there was an earlyoom to
   *       read about.
   *       ⇒ `rule.require.enumerate-before-you-name`: the arm enumerates ONE
   *         cause for an unread earlyoom journal where there are THREE, and
   *         they do not agree on what the count MEANS:
   *
   *           guard=earlyoom, journal blocked  →  genuinely UNKNOWN
   *           guard=none                       →  exactly 0, total is whole
   *           guard=systemd-oomd               →  0 by earlyoom, and a REAL
   *                                               blind spot this arm never
   *                                               named at all
   */
  given(
    '[case-oom-guard] the userland oom line names the guard that RUNS',
    () => {
      when('[t0] read from source', () => {
        /**
         * 🔴 COMMENTS STRIPPED FIRST, then searched — never sliced then filtered.
         *
         *    this file carries a SAMPLE RENDER inside its header comment, and
         *    it quotes the very lines under test verbatim (`🟢 no kills in 13.4d
         *    uptime`). a slice anchored on that string cuts mid-line, so the
         *    leading `#` is no longer at the head and a later `^\s*#` filter
         *    cannot see it — the clamp then grades the DOCUMENTATION.
         *
         *    measured on the first draft of this very block: the 🟢 assertion
         *    matched the comment at line 374 rather than the echo at 1149.
         *
         *  ⇒ strip, then search. the order is the whole repair, and it is the
         *    same shape as the two comment-in-the-region traps this week — a
         *    clamp that reads prose beside the code it means to grade.
         */
        const code = readFileSync(PATH_SAT, 'utf8')
          .split('\n')
          .filter((line) => !/^\s*#/.test(line))
          .join('\n');

        const eline = (): string => {
          const at = code.indexOf('__oom_eline() {');
          expect(at).toBeGreaterThan(0);
          const end = code.indexOf('__oom_kline() {', at);
          expect(end).toBeGreaterThan(at);
          const body = code.slice(at, end);
          // ⚠️ ANTI-VACUITY — a renamed function would empty this and read as a
          //    clean pass on every assertion below (`rule.forbid.failhide`).
          expect(body.split('\n').length).toBeGreaterThan(3);
          return body;
        };

        then('the subject exists — the clamp is not vacuous', () => {
          expect(code).toContain('__oom_eline() {');
        });

        // 🔴 THE TOOTH. the arm branched on `oom_esrc` alone for the life of
        //    this render. a clamp that merely asserted "a userland line exists"
        //    would have stayed green straight through the defect.
        then('it consults the GUARD, not only whether the journal read', () => {
          expect(eline()).toContain('oom_guard');
        });

        then('an absent guard yields a DEFINITE count, never a `?`', () => {
          expect(eline()).toContain('0 by userland');
        });

        // the claim a reader can act on: the kernel figure below is exact.
        then('it says the kernel count is the whole total', () => {
          expect(eline()).toContain('WHOLE total');
        });

        /**
         * 🔴 COUNTER-TOOTH. the cure must not delete the REAL caveat. a box that
         *    genuinely runs earlyoom behind an unreadable journal has a genuinely
         *    unknown half, and to print a 0 there would be the opposite lie.
         */
        then('a real unreadable journal still reads UNCOUNTED', () => {
          expect(eline()).toContain('UNCOUNTED');
        });

        /**
         * ⚠️ TOOTH. `systemd-oomd` is the third value `oom_guard` takes, and it
         *    is a REAL blind spot — it kills, and this arm reads earlyoom's
         *    journal alone. the prior render named earlyoom there, which was
         *    wrong twice over.
         */
        then('a NON-earlyoom guard is named as its own blind spot', () => {
          expect(eline()).toContain('${oom_guard}');
        });

        /**
         * 🔴 THE PEER ARM. the `🟢 no kills` branch carries the identical
         *    caveat and the identical defect, and a cure to one alone leaves a
         *    healthy box repeating the same falsehood (`rule.require.a-cue-is-
         *    not-a-claim` — two sites, and neither can be wrong, so both are
         *    owed).
         */
        then('the 🟢 branch gates its caveat on the guard too', () => {
          const at = code.indexOf('🟢 no kills in');
          expect(at).toBeGreaterThan(0);
          const region = code.slice(at, at + 1400);
          // the caveat this branch prints, and the guard that must gate it
          expect(region).toContain('userland TERM would not show here');
          expect(region).toContain('oom_guard');
        });
      });
    },
  );

  /**
   * .what = the cpu row says WHICH of its four terms drove the glyph, when the
   *         one that drove it measures the whole uptime rather than this moment
   *
   * 🔴 .why = every number on that row reads NOW, and the glyph above them does
   *        not have to. measured 2026-09-17 on grove-sandpine-v20260901:
   *
   *          ├─ 🔴 cpu    load 1.59 / 4 = 40%  ·  idle 66%  ·  runq 1 · blocked 0
   *          │     ├─ trend   1m 1.59 · 5m 2.48 · 15m 4.74
   *          │     ├─ stall   some 3.17% @10s · 7.58% @60s
   *          │     └─ life    71.4h stalled over 13.9d uptime  ·  21.420% of its life
   *
   *        `v_cpu` is `worst(v_load, v_cpu_stall, v_cpu_full, v_cpu_life)`. on
   *        that box v_load was ⚪ (runq 1 of 4 does not back the load),
   *        v_cpu_stall 🟢 (7.58% under a 10% warn), v_cpu_full ⚪ by
   *        construction — so the WHOLE 🔴 came from v_cpu_life at 21.42%, and
   *        no live term reached it. a reader who joins the glyph to the row
   *        below it reads a contradiction and must guess which half is true.
   *
   * 🔴 .the human was PAYING for the gap, by hand, every tick
   *        the babysit cron prompt carries a hand-authored caveat against this
   *        very render — "the 🔴 cpu flag is a LIFETIME figure; the LIVE signal
   *        is the run queue. runq 0 + high lifetime % = recovered, do not fell."
   *        a caveat a human maintains in prose is a caveat the tool owes its
   *        reader (`rule.always.entool-the-skills-you-touch`).
   *
   *        and the misread is not cheap: it halts a sprout and fells a crew to
   *        reclaim a resource that was never scarce.
   *
   * 🔴 .the identical shape is ALREADY CURED one term over
   *        when `load` would mislead, the row prints `⚠️ load ungraded` and
   *        names why. that note enumerates ONE of the four terms that can drive
   *        this glyph — `life` is a second, and it misleads in the same
   *        direction. `rule.require.enumerate-before-you-name`, and the cure
   *        was on the page the whole time.
   */
  given('[case-cpu-life] the cpu row names a LIFETIME-driven glyph', () => {
    when('[t0] read from source', () => {
      // 🔴 comments stripped BEFORE any search — this file quotes its own
      //    render inside header comments, so a slice-then-filter grades the
      //    prose beside the code. same trap as [case-oom-guard], same repair.
      const code = readFileSync(PATH_SAT, 'utf8')
        .split('\n')
        .filter((line) => !/^\s*#/.test(line))
        .join('\n');

      then('the subject exists — the clamp is not vacuous', () => {
        expect(code).toContain('v_cpu_life=');
        expect(code).toContain('v_cpu=');
      });

      /**
       * 🔴 THE TOOTH. the live half must be derived APART from the lifetime
       *    half, or the render has no term to compare against and cannot say
       *    which one fired. a clamp that only asserted "a cpu row exists"
       *    would have stayed green straight through the defect.
       */
      then('the LIVE half is derived apart from the lifetime half', () => {
        expect(code).toContain('v_cpu_live=');
      });

      then('the glyph is composed from the two halves', () => {
        expect(code).toMatch(/v_cpu=\$\(worst "\$v_cpu_live" "\$v_cpu_life"\)/);
      });

      /**
       * 🔴 THE TOOTH. the render must COMPARE them and speak. a `v_cpu_live`
       *    derived and never printed would be a cure that changes no output at
       *    all — the inert-cure shape
       *    (`rule.always.capture-clamp-then-verify-in-prod`).
       */
      then('the render compares them', () => {
        expect(code).toContain('"$v_cpu" != "$v_cpu_live"');
      });

      then('the note names LIFE as the source of the glyph', () => {
        const at = code.indexOf('"$v_cpu" != "$v_cpu_live"');
        expect(at).toBeGreaterThan(0);
        const region = code.slice(at, at + 900);
        expect(region.split('\n').length).toBeGreaterThan(2);
        expect(region).toContain('from LIFE');
      });

      /**
       * ⚠️ TOOTH. the note must carry the LIVE evidence beside the claim — a
       *    bare "this is historical" leaves the reader to re-derive the very
       *    numbers that settle it. runq is the signal the cron prompt names.
       */
      then('the note carries the live evidence', () => {
        const at = code.indexOf('"$v_cpu" != "$v_cpu_live"');
        const region = code.slice(at, at + 900);
        expect(region).toContain('runq');
      });

      /**
       * 🔴 TOOTH. the note must steer off the harmful act, because that act is
       *    the whole cost of the misread. a note that says "this is a lifetime
       *    figure" and stops has named the fact and not the fix
       *    (`rule.require.errors-name-the-fix`).
       */
      then('the note steers off the fell', () => {
        const at = code.indexOf('"$v_cpu" != "$v_cpu_live"');
        const region = code.slice(at, at + 900);
        expect(region).toMatch(/fell|sprout/);
      });

      /**
       * 🔴 THE TOOTH, second generation. the gate `v_cpu != v_cpu_live` proves
       *    LIFE IS WORSE. it does NOT prove LIVE IS CLEAN — `v_cpu` is
       *    `worst(live, life)`, so the gate trips on every row where life is
       *    STRICTLY worse, a live half already graded 🟡 among them.
       *
       *    measured 2026-09-19 on grove-sandpine-v20260901:
       *
       *      ├─ 🔴 cpu    load 3.37 / 4 = 84%  ·  idle 0%  ·  runq 6 · blocked 1
       *      │     ├─ ⚠️ 🔴  from LIFE, not from now — no live term on this row
       *      │     │          reaches it: runq 6 of 4 cores · stall 22.00% @10s
       *
       *    v_load 🟡 (84%, and runq 6 of 4 BACKS it, so it is not ⚪'d),
       *    v_cpu_stall 🟡 (12.23% @60s) ⇒ live folds to 🟡, life to 🔴. the
       *    note then denied a run queue at 150% of core count on its own next
       *    line.
       *
       * 🔴 the harm INVERTS the one this case was opened for. that defect
       *    over-alarmed a recovered box; this one RE-ASSURES a contended one —
       *    and it can only fire when the live half is degraded, i.e. exactly
       *    when the box is worst. `term=false-report`: a verdict true over the
       *    set it measured, stated as a claim about the world.
       */
      then('the "no live term" claim is gated on a CLEAN live half', () => {
        const at = code.indexOf('"$v_cpu" != "$v_cpu_live"');
        const region = code.slice(at, at + 2000);
        const claimAt = region.indexOf('no live term on this row reaches it');
        expect(claimAt).toBeGreaterThan(0);
        // between the outer gate and the claim there MUST be a second gate on
        // the live grade. without it the claim rides every trip of the outer
        // gate, which is the defect.
        expect(region.slice(0, claimAt)).toMatch(/v_cpu_live"\s*==/);
      });

      /**
       * 🔴 THE TOOTH. a gate alone would SILENCE the note on a degraded box —
       *    which trades a false claim for no claim, and the reader then joins a
       *    🔴 glyph to a row of live numbers with naught to reconcile them.
       *    that is the ORIGINAL defect, re-entered from the other end. so the
       *    degraded branch must exist and must name its own live grade.
       */
      then(
        'a DEGRADED live half gets its own branch, which names the live grade',
        () => {
          const at = code.indexOf('"$v_cpu" != "$v_cpu_live"');
          const region = code.slice(at, at + 2000);
          expect(region).toContain('the LIVE half is ${v_cpu_live}');
        },
      );

      /**
       * 🔴 COUNTER-TOOTH. both branches owe the live evidence and the steer —
       *    the two properties clamped above already demand them of the
       *    single-branch render. a split that carried them in one branch alone
       *    would pass those teeth on a slice and regress the other half
       *    (`rule.require.a-cue-is-not-a-claim` — two sites, both owed).
       */
      then(
        'BOTH branches carry the live evidence and steer off the fell',
        () => {
          const at = code.indexOf('"$v_cpu" != "$v_cpu_live"');
          const region = code.slice(at, at + 2000);
          const elseAt = region.indexOf('\n    else');
          expect(elseAt).toBeGreaterThan(0);
          for (const branch of [
            region.slice(0, elseAt),
            region.slice(elseAt),
          ]) {
            expect(branch).toContain('runq ${vm_r} of ${ncpu} cores');
            expect(branch).toMatch(/fell|sprout/);
          }
        },
      );

      /**
       * 🔴 COUNTER-TOOTH. the glyph itself must NOT change. a lifetime stall of
       *    21% is a real PROVISION signal and 🔴 is the correct grade for it —
       *    the defect was the silence, never the colour. a cure that quietly
       *    downgraded the row would trade an honest verdict for a comfortable
       *    falsehood.
       */
      then('the lifetime term still drives the glyph', () => {
        expect(code).toContain('v_cpu_life');
        expect(code).not.toMatch(/v_cpu=\$\(worst "\$v_cpu_live"\)/);
      });

      /**
       * 🔴 COUNTER-TOOTH. the peer note this cure is modelled on must survive.
       *    both fire on the same row and neither can be wrong, so both are owed
       *    (`rule.require.a-cue-is-not-a-claim`).
       */
      then('the extant load-ungraded note survives', () => {
        expect(code).toContain('load  ungraded');
        expect(code).toContain('runq_backs_load');
      });
    });
  });

  /**
   * .what = the cpu block carries a COUNTER-derived churn rate, beside its gauges
   *
   * 🔴 .why = every cpu term this skill emitted was a GAUGE. load, vm_us, and
   *        every `ps -o pcpu` roll-up sample state at an instant, so a process
   *        born and reaped between two samples is counted by NONE of them — at
   *        any poll rate. `surgoal.squeeze-the-grove` measured 91.4% of one
   *        grove's entire cpu spend in processes that were already dead.
   *
   *   🔴 measured 2026-09-17 on grove-sandpine-v20260901, on a live babysit tick:
   *
   *        ├─ 🔴 cpu    load 12.84 / 4 = 321%  ·  idle 44%  ·  runq 4 · blocked 0
   *        ├─ eats    ~35% accounted for
   *
   *      the missed ~286% was a fork storm. the supervisor hunted a runaway
   *      (`--process nvim` → 0.2%), found none, read 0 fellable, and reached the
   *      PROVISION rung with no account of the residue. the rate was then
   *      measured BY HAND through `git.grove.send` — 231 forks/sec, 10,028
   *      ctxt-sw/sec — which `rule.always.entool-the-skills-you-touch` grades a
   *      defect in the TOOL, and `surgoal.squeeze-the-grove` grades a blocker
   *      outright: "a tune or provision decision made off a gauge alone, where a
   *      counter was available = blocker".
   *
   * 🔴 .and the counter is CHEAPER than the census this skill already runs
   *      a process enumeration costs O(N) forks per sample — ~38,600 for 60
   *      samples over 643 procs — so on a 🔴 box the sampler joins the queue it
   *      measures. two `/proc/stat` reads cost 2, whatever N is.
   */
  given(
    '[case-cpu-churn] the cpu block reads a FORK counter, not only gauges',
    () => {
      when('[t0] the probe payload is read from source', () => {
        const payload = getProbePayload();

        /**
         * 🔴 THE TOOTH. under the un-fixed skill these keys do not exist at all,
         *    so every arm below reddens. a clamp that merely asserted "a cpu row
         *    exists" would have stayed green straight through the defect.
         */
        then('it emits both rates as keys', () => {
          expect(payload).toContain('fork_rate=');
          expect(payload).toContain('ctxt_rate=');
        });

        then('it reads the COUNTERS `/proc/stat` carries', () => {
          // the two monotonic totals. a gauge substitute here would defeat the
          // whole arm, so the source is asserted rather than the key alone.
          expect(payload).toMatch(/\/proc\/stat/);
          expect(payload).toContain('/^processes /');
          expect(payload).toContain('/^ctxt /');
        });

        then('the window is MEASURED, never assumed', () => {
          // 🔴 the surgoal: "a rate reported from a window whose length was not
          //    measured = blocker". a per-second figure needs a denominator, and
          //    an unbracketed `vmstat 1 2` does not have one — its own sleep is
          //    nominal, and on a saturated box it is exactly the number that
          //    drifts. so the window comes off /proc/uptime, at both ends.
          expect(payload).toContain('/proc/uptime');
          expect(payload).toContain('rate_window=');
        });

        then('it takes TWO samples — a single read yields no rate', () => {
          // a counter is a total since boot. one read of it is a lifetime figure,
          // which is the very confusion the cpu glyph already pays for one term
          // over ([case-cpu-life]). the rate needs a delta.
          const spoken = payload
            .split('\n')
            .filter((line) => !/^\s*#/.test(line))
            .filter((line) => /^__(fk|cx|up)_[ab]=/.test(line));
          // ⚠️ ANTI-VACUITY, and the count is the claim: 3 keys × 2 ends.
          expect(spoken.length).toBe(6);
        });

        then('it costs NO census — a counter, never an enumeration', () => {
          // 🔴 the surgoal's hard rule, and the reason this arm is cheap enough to
          //    ride on every sweep. same shape as [case3]'s oom witness.
          const spoken = payload
            .split('\n')
            .filter((line) => !/^\s*#/.test(line))
            .filter((line) => /^__(fk|cx|up)_[ab]=/.test(line));
          for (const line of spoken) {
            expect(line).not.toMatch(/\bps\s+-e/);
            expect(line).not.toMatch(/\bfor\s+\w+\s+in\b/);
          }
        });

        then('it distinguishes UNREADABLE from measured-zero', () => {
          // 🔴 a 0 here would assert a QUIET box — the exact false report the ⚪
          //    states elsewhere in this skill exist to prevent (term=false-report).
          const at = payload.indexOf('fork_rate=-');
          expect(at).toBeGreaterThan(0);
          expect(payload).toContain('print "fork_rate=-"');
          expect(payload).not.toContain('print "fork_rate=0"');
        });
      });

      when('[t1] the payload RUNS on this box', () => {
        const ran = useThen('the probe exits clean', () => ({
          // hermetic: one self-contained bash string, run here — no ssh, no grove
          // within reach (rule.require.hermetic-tests), as every peer case runs it
          emitted: runPayload({ slug: 'sat-churn-runs', root: null }),
        }));

        then('it emits the keys', () => {
          expect(ran.emitted).toMatch(/^fork_rate=/m);
          expect(ran.emitted).toMatch(/^ctxt_rate=/m);
          expect(ran.emitted).toMatch(/^rate_window=/m);
        });

        then('the rates READ on this box — numbers, not the sentinel', () => {
          // ⚠️ this arm proves the cure WORKS rather than merely compiles. linux
          //    always carries both counters in /proc/stat, so a sentinel here
          //    means the read logic is wrong rather than the box is odd.
          const fork = ran.emitted.match(/^fork_rate=(.+)$/m);
          const ctxt = ran.emitted.match(/^ctxt_rate=(.+)$/m);
          expect(fork).not.toBeNull();
          expect(ctxt).not.toBeNull();
          expect((fork?.[1] ?? '').trim()).toMatch(/^\d+$/);
          expect((ctxt?.[1] ?? '').trim()).toMatch(/^\d+$/);
        });

        then(
          'the window is a real span — a rate over 0s has no denominator',
          () => {
            const win = ran.emitted.match(/^rate_window=(.+)$/m);
            expect(win).not.toBeNull();
            expect(Number(win![1])).toBeGreaterThan(0.5);
          },
        );

        then('a box that runs at all shows SOME context switches', () => {
          // 🔴 the anti-vacuity half, and it bites: a delta taken in the wrong
          //    order, or both ends read at once, yields 0 and passes the numeric
          //    assertion above. no live linux box switches context zero times in
          //    a one-second window.
          const ctxt = ran.emitted.match(/^ctxt_rate=(\d+)$/m);
          expect(Number(ctxt![1])).toBeGreaterThan(0);
        });

        then('it still emits every row kind — the cure broke no census', () => {
          expect(ran.emitted).toMatch(/^proc=/m);
          expect(ran.emitted).toMatch(/^roll=/m);
          expect(ran.emitted).toMatch(/^vm_us=/m);
          expect(ran.emitted).toMatch(/^procs_total=\d+$/m);
        });
      });

      when('[t2] the RENDER seam is read from source', () => {
        // 🔴 a green probe clamp proves the DETECTOR and says NOT ONE THING about
        //    the render. that failure has landed repeatedly on this fleet: a
        //    detector went green while the row a human reads never moved
        //    (rule.always.capture-clamp-then-verify-in-prod).
        const code = readFileSync(PATH_SAT, 'utf8')
          .split('\n')
          .filter((line) => !/^\s*#/.test(line))
          .join('\n');

        then('the render READS the keys the probe emits', () => {
          // 🔴 the inert-cure tooth. a probe that emits a number nobody reads is
          //    a green suite over an unmoved render.
          expect(code).toContain('fork_rate=$(kv "$out" fork_rate)');
          expect(code).toContain('ctxt_rate=$(kv "$out" ctxt_rate)');
          expect(code).toContain('rate_window=$(kv "$out" rate_window)');
        });

        then('a churn row is PRINTED under the cpu block', () => {
          const at = code.indexOf('├─ churn');
          expect(at).toBeGreaterThan(0);
          const row = code.slice(at, code.indexOf('\n', at));
          expect(row).toContain('${fork_rate}');
          expect(row).toContain('${ctxt_rate}');
          // 🔴 the window rides WITH the rate. a per-second figure whose window
          //    is off-page cannot be checked by its reader.
          expect(row).toContain('${rate_window}');
        });

        then(
          'the row sits in the CPU block, beside the terms it explains',
          () => {
            // the churn is the residue the `eats` roll-up cannot account for, so it
            // belongs where a reader compares the two — never in a section of its
            // own, where the comparison is theirs to make.
            const atCpu = code.indexOf('cpu    load ${load1}');
            const atChurn = code.indexOf('├─ churn');
            const atMem = code.indexOf('ram    ');
            expect(atCpu).toBeGreaterThan(0);
            expect(atChurn).toBeGreaterThan(atCpu);
            if (atMem > 0) expect(atChurn).toBeLessThan(atMem);
          },
        );

        /**
         * .what = the churn row plus the whole verdict arm beneath it
         *
         * 🔴 .RE-ANCHORED 2026-09-18 — was `code.slice(at, at + 1200)`, a fixed
         *    CHARACTER COUNT. that is a LENGTH anchor, and a length anchor breaks
         *    on growth rather than on behavior: the at-rest branch added seven
         *    echo lines ahead of the storm text, `PARENT` slid past char 1200,
         *    and the tooth went red over a cure that strengthened the very
         *    property it guards.
         *
         * ⇒ the slice now ends where the ARM ends. same region in intent, and it
         *   no longer has an opinion about how long the arm is allowed to be.
         *   the third instance of this lesson in one day (crewwork [case41] ·
         *   [case50] · [case6] here) — an anchor must key on IDENTITY, never on
         *   prose and never on position.
         */
        const churnArm = (): string => {
          const at = code.indexOf('├─ churn');
          expect(at).toBeGreaterThan(0);
          const shut = code.indexOf('\n  fi', at);
          expect(shut).toBeGreaterThan(at);
          return code.slice(at, shut);
        };

        then(
          'a high rate is NAMED as a storm, never left to the reader',
          () => {
            // 🔴 rule.require.errors-name-the-fix. `231/s` means naught to a reader
            //    with no baseline, and the whole cost of the measured case was that
            //    the residue went unnamed. the note must fire on the number.
            expect(churnArm()).toContain('fork STORM');
            expect(churnArm()).toMatch(/f\+0>=50/);
          },
        );

        then('the storm note steers off the two harmful acts', () => {
          // a fell gives up real work and a core is bought with money; neither
          // repairs a parent that reaps hundreds of children a second. so the
          // note must name the PARENT hunt, ahead of both.
          expect(churnArm()).toContain('PARENT');
          expect(churnArm()).toMatch(/fell/);
        });

        then(
          'the extant cpu terms survive — the cure adds, never replaces',
          () => {
            // 🔴 COUNTER-TOOTH. the gauges are not wrong, they are incomplete. a
            //    cure that dropped one would trade a gap for a different gap.
            expect(code).toContain('runq ${vm_r}');
            expect(code).toContain('idle ${vm_id}%');
            expect(code).toContain('load  ungraded');
          },
        );
      });
    },
  );

  /**
   * .what = an EMPTY `eats` roll-up is a QUIET box, never a blind probe
   *
   * .why  = measured in prod 2026-09-18 on `grove-sandpine-v20260811`, a grove
   *         that had just woken. the render read:
   *
   *           ├─ top     hungriest by cpu
   *           │     ├─ sshd        0.5% cpu ·   0.0% mem
   *           ├─ eats    (unreadable)
   *           ├─ greeds  ram by program — n = how many peers share the total
   *           └─ holds   150 processes · 0 in D (unsignalable) · 0 zombie
   *
   *         🔴 three rows rendered from the SAME ps output and one claimed the
   *         instrument had failed. the probe read that box perfectly.
   *
   * .the cause = `eats` is the one row of four that carries a FLOOR. its awk
   *         END emits a row only `if (cpu[k] >= 1)`, so on a 100%-idle box
   *         where the hungriest program holds 0.5%, every key falls under the
   *         floor and zero `roll=` rows are emitted. the renderer then reaches
   *         its `${#rolls[@]} -eq 0` arm, which says `(unreadable)`.
   *         `greeds` (`for (k in cnt) print`), `top`, and `holds` carry no
   *         floor, which is exactly why they rendered.
   *
   * 🔴 .the harm = `term=false-report` — the arithmetic is right over the rows
   *         held and the SENTENCE is untrue of the world. and it lands on the
   *         one row the skill's own comment calls the discriminator: "the
   *         roll-up is what parts a RUNAWAY from CONCURRENCY, and the remedies
   *         for those two disagree". a reader told `unreadable` believes the
   *         runaway hunt is unavailable on that box. it is available; it
   *         returned a clean answer, and that clean answer was overwritten by
   *         a defect report.
   *
   * ⚠️ .and it INVERTS this file's own doctrine, stated at the oom rows:
   *         "an unreadable journal and a quiet one are byte-identical ... a zero
   *         LINE count means unreadable — never zero kills". there the two
   *         states were genuinely indistinguishable, so the render said so.
   *         here they are trivially distinguishable — a box that answered `top`
   *         answered the probe — and the render says the wrong one anyway.
   */
  given(
    '[case-eats-floor] every program on the box sits under the 1% floor',
    () => {
      const code = readFileSync(PATH_SAT, 'utf8');

      when('[t0] the roll-up FLOOR is read from source', () => {
        then('🔴 the floor is real, and it is what empties the array', () => {
          // the cause, pinned. a cure that moved the render without this line in
          // view would be a guess (rule.always.capture-clamp-then-verify-in-prod).
          expect(code).toContain('if (cpu[k] >= 1) print "roll="');
        });

        then(
          'the PEER rows carry no floor — which is why they rendered',
          () => {
            // 🔴 the discriminator, proven to exist rather than assumed. `greeds`
            //    prints every key it grouped, so an empty `greeds` really is a
            //    probe that could not read. an empty `eats` is not the same claim.
            expect(code).toContain('for (k in cnt) print "greeds="');
            const iGreedsEnd = code.indexOf('for (k in cnt) print "greeds="');
            const greedsEnd = code.slice(
              iGreedsEnd,
              code.indexOf('\n', iGreedsEnd),
            );
            expect(greedsEnd).not.toContain('>=');
          },
        );
      });

      when('[t1] the empty-rolls RENDER arm is read', () => {
        // 🔴 the slice must stop at `elif`, never at `else`. `indexOf('else')`
        //    runs straight past `elif` and swallows the NEXT branch whole — so a
        //    coarse slice reads the blind-probe arm's `(unreadable)` as though it
        //    sat in the answered-probe arm, and reports a defect that was cured.
        //    measured here 2026-09-18: this exact slice went red over a green
        //    cure (term=false-report, in the CLAMP rather than in the tool).
        const arm = (): string => {
          const i = code.indexOf('${#rolls[@]} -eq 0');
          expect(i).toBeGreaterThan(0);
          const ends = ['elif', 'else']
            .map((k) => code.indexOf(k, i))
            .filter((n) => n > 0);
          return code.slice(i, Math.min(...ends));
        };

        then('🔴 it does NOT claim the probe was unreadable', () => {
          // the bite. the shipped arm is `echo "   ├─ eats    (unreadable)"`,
          // unconditional — so this assertion goes RED on the shipped file and
          // GREEN only once the arm distinguishes quiet from blind.
          expect(arm()).not.toContain('(unreadable)');
        });

        then('it names the FLOOR, so the reader can check the claim', () => {
          // rule.require.errors-name-the-fix. "under the floor" with no floor
          // stated is as unfalsifiable as "unreadable" was.
          expect(arm()).toContain('1%');
        });

        then('it is GATED on whether the box answered at all', () => {
          // 🔴 the counter-tooth, and the one that keeps the cure honest. a probe
          //    that genuinely failed emits zero rows on EVERY axis, and that case
          //    must still read as unreadable. a cure that renamed the arm
          //    unconditionally would trade a false report for its mirror.
          expect(arm()).toContain('${#procs[@]}');
        });
      });

      when(
        '[t2] the peer arms are read — the cure adds, never replaces',
        () => {
          then('🔴 the BLIND-probe arm survives for eats too', () => {
            // the second cause still exists and still deserves its own sentence. a
            // cure that deleted this arm rather than split it would be the mirror
            // false report: a probe that truly failed, rendered as a quiet box.
            const i = code.indexOf('${#rolls[@]} -eq 0');
            const rest = code.slice(i);
            expect(rest).toContain('elif [[ ${#rolls[@]} -eq 0 ]]; then');
            const blind = rest.slice(
              rest.indexOf('elif'),
              rest.indexOf('else'),
            );
            expect(blind).toContain('(unreadable)');
          });

          then(
            'greeds, holds, and top keep their honest unreadable arms',
            () => {
              // those three have no floor, so an empty array there IS a blind probe.
              // this tooth goes red on a sweep that renamed every arm at once.
              expect(code).toContain('├─ greeds  (unreadable)');
              expect(code).toContain('└─ holds   (unreadable)');
              expect(code).toContain('├─ top     (unreadable)');
            },
          );
        },
      );
    },
  );
});
