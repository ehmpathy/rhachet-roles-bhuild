// biome-ignore-all lint/suspicious/noControlCharactersInRegex: a captured pane
// IS a stream of ANSI escapes, so every clamp here must strip them before it
// reads the text. the \u001b is the subject of these regexes rather than a typo
// in them — the rule is a false positive over a terminal-capture corpus.
/**
 * .what = clamps on a HUSK — a crashed, exited, killed, or poisoned clone, and its heal
 *
 * .note = a PART of the `crewwork` suite, cut so one reviewer can hold
 *         it whole. the suite's shared fixtures, and its account of what it
 *         runs against and why, live in crewwork.harness.ts.
 */
import { readFileSync } from 'fs';
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
  given('[case11] a mechanic that crashed mid-stone', () => {
    // .teeth = __crew_heal_one grepped `❯` across the WHOLE read window, so a
    //          pane whose scrollback still held the live claude box it drew
    //          BEFORE it died read as "a live claude box is present" — even
    //          though the box beneath the resume banner is a plain, crashed
    //          shell. measured 2026-09-13 on
    //          rhachet-roles-bhrain.beav.feat-telepath-role: the fleet poll,
    //          which shares this same discriminator, reported the tree
    //          `blocked ✋` — still at work — while its pane read `💥143 ➜`.
    const PANE_TEXT_CRASHED_AFTER_STONE = [
      '❯ ',
      '─────────────────────────────────────────────',
      '🗿 5.1.execution.from_vision, review.peer, l3@i010, blocked ✋',
      '⏵⏵ accept edits on (shift+tab to cycle)',
      '',
      'Resume this session with:',
      'claude --resume "mechanic"',
      '',
      `camper in ${TREE} 🌐 ip-10-20-2-103 took 2d10h12m46s`,
      '💥143 ➜',
    ].join('\n');

    when('[t0] crew.heal reads its pane', () => {
      const result = useBeforeAll(async () =>
        runCrew({
          command: `crew.heal --tree ${TREE} --who mechanic --what work --mode plan`,
          paneText: PANE_TEXT_CRASHED_AFTER_STONE,
        }),
      );

      then('it reports a HUSK, never a live claude box', () => {
        // .teeth = before the fix this read "a live claude box is up — not
        //          a husk, absent any move to make" — the stale ❯ from
        //          before the crash outranked the crash banner beneath it.
        expect(result.stdout).toContain('husk');
        expect(result.stdout).not.toContain('a live claude box is up');
      });

      then(
        'it reads the exit code off the CRASH line, not the dead session',
        () => {
          expect(result.stdout).toContain('exit 143');
        },
      );

      then('a plan never reboots or resumes — it only reports', () => {
        expect(result.calls.filter((c) => c.startsWith('duct.open'))).toEqual(
          [],
        );
        expect(result.calls.filter((c) => c.startsWith('duct.send'))).toEqual(
          [],
        );
      });
    });

    when(
      '[t1] claude genuinely restarted after the crash banner printed',
      () => {
        // a session that resumed AFTER the banner draws its own fresh ❯ box
        // below the banner — that ❯ is live, and a heal would end a
        // conversation that is not dead.
        const PANE_TEXT_RESUMED = [
          PANE_TEXT_CRASHED_AFTER_STONE,
          'claude --resume "mechanic"',
          '❯ ',
        ].join('\n');

        const result = useBeforeAll(async () =>
          runCrew({
            command: `crew.heal --tree ${TREE} --who mechanic --what work --mode plan`,
            paneText: PANE_TEXT_RESUMED,
          }),
        );

        then('it reports live — a ❯ AFTER the banner is never stale', () => {
          // .note = the live-box message itself reads "not a husk", so a
          // check for the bare word 'husk' self-defeats. check the 💀 husk
          // emoji instead — it appears only on the husk-report path.
          expect(result.stdout).toContain('a live claude box is up');
          expect(result.stdout).not.toContain('💀');
        });
      },
    );
  });

  given(
    '[case12] a mechanic husk whose crash banner is GONE — a bare shell',
    () => {
      // .teeth = claude draws its ui and its `Resume this session with:` banner in
      //          the terminal's ALTERNATE screen; on exit the alt-screen is torn
      //          down and the pane returns to a bare shell with NO banner. heal
      //          keyed husk-ness on that banner, so a mechanic at a bare shell fell
      //          to `return 4` ("likely a plain shell duct") and was left dead —
      //          while git.crew.poll rendered the SAME pane `💀 husk` off
      //          `mechanic:shell`. measured 2026-09-13 on
      //          rhachet-roles-bhrain.beav.feat-toggle-term-learner-hook: heal
      //          refused, and a hand-sent crew.send revived it — the workaround
      //          this clamp exists to forbid
      //          (define.invariant.crew.husk.discriminator-parity).
      const PANE_TEXT_BARE_SHELL_HUSK = [
        `${TREE} on beav/feat-x [$!?] is v0.34.1 via v22.21.0 at 14:13:43`,
        '➜',
      ].join('\n');

      when('[t0] the pane is a MECHANIC at a bare shell, no banner', () => {
        const result = useBeforeAll(async () =>
          runCrew({
            command: `crew.heal --tree ${TREE} --who mechanic --what work --mode plan`,
            paneText: PANE_TEXT_BARE_SHELL_HUSK,
          }),
        );

        then('it reports a HUSK — role+box, not the absent banner', () => {
          // the durable discriminator: a mechanic RUNS claude, so a mechanic at a
          // bare shell IS a husk, banner or no banner (poll parity)
          expect(result.stdout).toContain('💀');
          expect(result.stdout).toContain('husk');
        });

        then(
          'it does NOT read the mechanic as a plain shell duct — the regression',
          () => {
            expect(result.stdout).not.toContain('plain shell duct');
            expect(result.stdout).not.toContain('a live claude box is up');
          },
        );

        then(
          'the cure is REACHED — a plan states it would reboot then resume',
          () => {
            // proves __crew_heal_revive is called on this path, so the cure reaches
            // what detection names (no separate hand-send is owed)
            expect(result.stdout).toContain('would crew.reboot');
          },
        );

        then('a plan mutates naught — no reboot, no send', () => {
          expect(
            result.calls.filter((c) => c.startsWith('duct.reboot')),
          ).toEqual([]);
          expect(result.calls.filter((c) => c.startsWith('duct.send'))).toEqual(
            [],
          );
        });
      });

      when('[t1] the SAME bare shell is a FOREMAN, not a mechanic', () => {
        // a foreman is a bare shell BY DESIGN, so it is never a husk — the role
        // scope that keeps the auto-heal off a legitimately-shell role
        const result = useBeforeAll(async () =>
          runCrew({
            command: `crew.heal --tree ${TREE} --who foreman --what work --mode plan`,
            paneText: PANE_TEXT_BARE_SHELL_HUSK,
          }),
        );

        then('it is NOT a husk — a foreman bare shell is legitimate', () => {
          expect(result.stdout).not.toContain('💀');
          expect(result.stdout).toContain('plain shell duct');
        });
      });

      when(
        '[t2] the cure AWAITS shell-ready between the reboot and the resume',
        () => {
          // .teeth = the reboot restarts the pane's shell, whose init takes a moment.
          //          a resume send that races it lands in a shell not yet ready and
          //          is LOST — the exact reason the live heal left the mechanic dead.
          //          a FIXED `sleep 2` cannot fix this: on a saturated grove (measured
          //          2026-09-13, load 871%, runq 22) the shell takes far longer than
          //          2s, so the blind send is lost anyway and the pane sits at a bare
          //          prompt. the cure mirrors crew.boot: `duct.send --await`, which
          //          polls for shell-ready and sends only once, bounded. this reads
          //          the source, since the race is a runtime property the fake-duct
          //          harness cannot reproduce.
          const src = getShellLibWhole({
            path: join(__dirname, 'crewwork.sh'),
          });
          const revive = src.slice(
            src.indexOf('__crew_heal_revive() {'),
            src.indexOf('\n__crew_', src.indexOf('__crew_heal_revive() {') + 1),
          );

          then(
            'the reboot, then an await-gated resume send, run in that order',
            () => {
              expect(
                /crew\.reboot[\s\S]*duct\.send --on "\$uri" --await 30 --what "rhx enroll claude --resume/.test(
                  revive,
                ),
              ).toEqual(true);
            },
          );

          then(
            'the resume send AWAITS shell-ready, NOT a fixed sleep 2 then a blind send',
            () => {
              // .teeth = a blind `sleep 2` + send races the shell init on a saturated
              //          grove and drops the enroll keystrokes — measured 2026-09-13,
              //          the pane rebooted but sat at a bare prompt, no enroll echoed.
              //          crew.boot's proven path uses `duct.send --await`, which polls
              //          for the prompt and sends only once ready, bounded at 30s.
              expect(
                /duct\.send --on "\$uri" --await 30 --what "rhx enroll claude/.test(
                  revive,
                ),
              ).toEqual(true);
              expect(/\n\s*sleep 2\n/.test(revive)).toEqual(false);
            },
          );

          then(
            'revive resumes the NAMED session via --resume "$who" continue, NOT the cwd-recency --continue',
            () => {
              // 🔴 .teeth = `--continue` is cwd-RECENCY: it reattaches whatever session
              //          ran most recently in the cwd, NOT deterministically the named
              //          one — so on a tree that has run more than one session it
              //          silently resumes the wrong transcript, or none. the human
              //          corrected this 2026-09-14, verbatim: "otherwise, it does not
              //          reuse the sesion ... use the command i gave you verbatum." the
              //          fix names the session AND passes a "continue" prompt: a name
              //          is given, so NO picker draws, and "continue" is submitted as
              //          the first turn. the old `--as @:$who --continue` form must be
              //          GONE — delete the fix to see this go red.
              expect(
                /enroll claude --resume \\"\$who\\" continue/.test(revive),
              ).toEqual(true);
              expect(
                /enroll claude --as @:\$who --continue/.test(revive),
              ).toEqual(false);
            },
          );

          then(
            'the "continue" prompt IS the nudge — no --permission-mode flag, no separate nudge send',
            () => {
              // 🔴 .teeth = a NAMED `claude --resume` restores the session's OWN
              //          permission mode, so the revive needs no `--permission-mode
              //          acceptEdits` flag — the human's verbatim form omits it. and
              //          the "continue" prompt is submitted as the first turn, which IS
              //          the nudge the revive owes (define.invariant.crew.revive-is-
              //          incomplete-without-a-nudge). so resume + nudge land in ONE
              //          send: the prior separate `--anyway --what "you were revived
              //          ... continue the work"` send must be GONE, or it is a
              //          false-positive double-nudge (that invariant's enforcement).
              expect(
                /enroll claude --resume \\"\$who\\" continue/.test(revive),
              ).toEqual(true);
              expect(/continue the work you were on/.test(revive)).toEqual(
                false,
              );
            },
          );

          then(
            'heal CLEARS the resume picker itself — no hand-sent key',
            () => {
              // .teeth = the resume opens claude's `Resume Session` picker and stops
              //          one keystroke short. heal must send that Enter ITSELF; a
              //          hand-sent Enter consumed the only field repro on 2026-09-13
              //          (rule.forbid.byhand-fix-that-burns-the-live-proof). the
              //          picker-detect must precede a --keys Enter send.
              expect(/Resume Session[\s\S]*--keys Enter/.test(revive)).toEqual(
                true,
              );
            },
          );

          then(
            'the picker Enter rides --anyway — a plain key hits the busy-guard',
            () => {
              // .teeth = the picker pane holds a LIVE claude, so crew.send's busy-guard
              //          silently drops a plain keystroke — measured 2026-09-13, the
              //          Enter never landed and the husk stayed parked at the picker.
              //          --anyway sends into a busy pane on purpose.
              expect(
                /Resume Session[\s\S]*--anyway --keys Enter/.test(revive),
              ).toEqual(true);
            },
          );

          then(
            'the picker is POLLED, not read once after a fixed sleep',
            () => {
              // .teeth = a fixed `sleep 3` RACES the picker draw — the read lands
              //          before the picker paints, the grep misses, no Enter is sent.
              //          measured 2026-09-13 on a live husk. the cure is a bounded
              //          poll for the picker's own header, its interval a var so a
              //          clamp can zero it (rule.require.fast-tests).
              expect(
                /for attempt in[\s\S]*grep -q 'Resume Session'[\s\S]*picker_seen="yes"/.test(
                  revive,
                ),
              ).toEqual(true);
              expect(/CREW_RESUME_POLL_SECS/.test(revive)).toEqual(true);
            },
          );

          then(
            'the verify requires the picker chrome GONE before it trusts the caret',
            () => {
              // .teeth = the picker highlight is ALSO `❯ $who`, so a bare `❯` grep is
              //          a false floor that reads the picker as a cured clone. the
              //          `Resume Session` guard must fail-out BEFORE the `✨ revived`
              //          success line.
              expect(
                /Resume Session[\s\S]*did not clear[\s\S]*✨ revived/.test(
                  revive,
                ),
              ).toEqual(true);
            },
          );

          then(
            '🔴 the caret give-up renders its verdict on STDOUT, never on stderr alone',
            () => {
              // 🔴 .teeth = every OTHER terminal branch of this operation speaks on
              //    stdout — `✨ revived`, and both flap verdicts. this branch alone
              //    spoke only on stderr, so a caller that reads stdout saw heal print
              //    a 💀 husk DIAGNOSIS and no outcome whatever.
              //
              //    measured TWICE, and the second time is what earns this arm:
              //      2026-09-16 svc-reservations.beav.feat-spot-forecast-widget — cured
              //        by the bounded caret poll above, 6×1s
              //      2026-09-18 declastruct-aws.beav.feat-s3-backup-store-properties —
              //        SAME render, budget intact. a crew.read seconds later showed
              //        `❯ continue` landed and the box mid auto-compaction, grove 215%
              //    ⇒ a resume that lands in compaction outruns any FIXED budget, so
              //      the durable cure is the stream, never a longer poll.
              //
              //    the final `"` before the newline IS the tooth: re-append `>&2` to
              //    that echo and this arm goes red, which is exactly the prior state
              //    of the file.
              expect(
                /\n\s*echo " {3}└─ 🕗 resume SENT, outcome UNCONFIRMED[^\n]*"\n/.test(
                  revive,
                ),
              ).toEqual(true);
              expect(/no claude box seen yet[^\n]*>&2/.test(revive)).toEqual(
                false,
              );
            },
          );

          then(
            '🔴 it says UNCONFIRMED, never FAILED — the send landed, only the confirm ran out',
            () => {
              // 🔴 .teeth = to render a timed-out CONFIRM as a failed REVIVE inverts
              //    the arm the other way: the operator re-heals a clone that is alive,
              //    which is a second resume on a healthy box. the verdict must name
              //    the send as landed and the outcome as unknown — never as a failure.
              expect(
                /is NOT a failed revive: the send landed/.test(revive),
              ).toEqual(true);
            },
          );

          then(
            'the PICKER give-up carries the same stdout verdict — no twin hole one branch over',
            () => {
              // .teeth = the two give-up branches shared one defect. to cure the caret
              //    branch and leave the picker branch on stderr is the partial sweep
              //    rule.forbid.clipped-sweeps names — the identical hole, one branch
              //    over, and invisible until a picker stalls.
              expect(
                /\n\s*echo " {3}└─ 🕗 resume opened the session picker and it did not clear[^\n]*"\n/.test(
                  revive,
                ),
              ).toEqual(true);
              expect(/did not clear[^\n]*>&2/.test(revive)).toEqual(false);
            },
          );

          then(
            '🔴 a picker with ZERO rows routes to the HATCH, never to a second resume',
            () => {
              // 🔴 .teeth = claude reports "no such session" by TWO surfaces, and this
              //    arm reads the one the flap arm below cannot. that arm greps the
              //    NON-interactive sentence `No conversations found to resume`; where
              //    a session NAME is given and matches naught, claude prints no
              //    sentence at all — it opens the picker with the name pre-filled as a
              //    search and draws an EMPTY list.
              //
              //    ⇒ so a flap fell through the picker guard to "verify manually" — a
              //      term=volunteered-diagnosis, which reports the state UNKNOWN while
              //      the pane states the cause outright. the operator then re-heals
              //      every tick and the pane comes back byte-identical.
              //
              //    measured 2026-09-18 over three consecutive ticks on
              //    infrastructure.beav.feat-camp-git-backup-bucket: `--healable`
              //    emitted its heal line each tick, the line ran verbatim, and cured
              //    naught (rule.forbid.remedies-that-mimic-the-defect).
              //
              // ⚠️ the ORDER is the claim — the zero-row arm must sit INSIDE the
              //    picker guard and BEFORE the manual fail-out, or a flap reaches the
              //    fail-out first and the hatch is never summoned. delete the arm to
              //    see this go red.
              expect(
                /grep -q 'Resume Session'[\s\S]*__duct_picker_has_no_rows[\s\S]*__crew_heal_hatch[\s\S]*return 8[\s\S]*did not clear/.test(
                  revive,
                ),
              ).toEqual(true);
            },
          );

          then(
            "🔴 the BOX is polled too — the picker loop's last read is not trusted as the verdict",
            () => {
              // 🔴 .teeth = the picker poll cures the picker race and leaves the VERIFY
              //    race open. that loop exits the moment the picker is GONE — or after
              //    its whole budget when none ever drew — and at that instant a box
              //    that has not yet PAINTED reads identical to a box that never will.
              //    on a saturated grove claude routinely takes longer than that to
              //    draw, so the caret grep false-negatived and the outcome went to
              //    STDERR as "no claude box seen yet" — so stdout carried NO outcome
              //    line at all, on a revive that in fact worked.
              //
              //    measured 2026-09-16, svc-reservations.beav.feat-spot-forecast-widget:
              //    heal rendered three diagnostic lines and no verdict; a crew.read one
              //    second later showed a live box, a live stone, and PR #357.
              //
              //    ⇒ so a THIRD bounded poll owes its place BETWEEN the picker-chrome
              //      guard and the caret verdict, and it must re-READ rather than
              //      re-test the read it inherited. delete that loop to see this go red.
              expect(
                /did not clear[\s\S]*for attempt in[\s\S]*duct\.read[\s\S]*✨ revived/.test(
                  revive,
                ),
              ).toEqual(true);
            },
          );

          then(
            '🔴 the box poll RE-APPLIES the picker guard on every read it takes',
            () => {
              // 🔴 .teeth = the picker guard above is a ONE-SHOT against a snapshot,
              //    and the box poll below it RE-READS. so a picker that draws AFTER
              //    the detect budget was never seen by that guard — and the picker's
              //    own row highlight IS `❯ $who`, which the poll's caret grep then
              //    matches. heal breaks out and renders `✨ revived` over a pane
              //    parked at `Resume Session`.
              //
              //    ⇒ the guard's PLACEMENT (clamped one arm up) is necessary and NOT
              //      sufficient. a guard is only as good as the read it saw, so a
              //      loop that replaces that read owes the guard again — both INSIDE
              //      it, and on whatever it last read.
              //
              //    measured 2026-09-19, two seats healed in one tick:
              //    rhachet.beav.fix-keyrack-daemon-orphan and
              //    ehmpathy-cicd.beav.fix-test-tempdir-leak. heal printed `✨ revived`
              //    for both; a crew.read seconds later showed both still at the
              //    picker with `❯ mechanic` highlighted (term=false-report — true of
              //    the caret it matched, false of the world).
              //
              // .tooth A — the caret break is GUARDED, never the poll's first test.
              //   flatten the `elif` back to a bare `if ... break` to see this go red.
              expect(
                /if printf '%s' "\$after" \| grep -q 'Resume Session'; then[\s\S]{0,600}elif printf '%s' "\$after" \| grep -qE '❯\|No conversations\? found to \(resume\|continue\)'; then\n\s*break/.test(
                  revive,
                ),
              ).toEqual(true);

              // .tooth B — and the LAST read the poll took is re-guarded before the
              //   caret verdict. delete the post-poll picker arm to see this go red.
              //
              // ⚠️ both anchors are the CODE, never the prose — `✨ revived` appears
              //   in a comment ABOVE the poll, so an `indexOf` on the bare words
              //   slices backwards and yields '', which asserts naught and fails
              //   everything. anchor on the caret grep and on the echo itself, and
              //   clamp the slice non-empty so a bad anchor cannot read as a pass.
              const afterPoll = revive.slice(
                revive.lastIndexOf("grep -qE '❯|No conversations"),
                revive.indexOf('echo "   └─ ✨ revived'),
              );
              expect(afterPoll).not.toEqual('');
              expect(afterPoll).toContain("grep -q 'Resume Session'");
            },
          );

          then(
            'the box poll exits early on a FLAP — a terminal shape never waits out the budget',
            () => {
              // .teeth = a flap's pane carries neither a caret nor picker chrome, so a
              //    caret-only poll would burn every interval before it reached the arm
              //    that already knows the answer. the poll's own grep must admit BOTH
              //    terminal shapes, so a flap costs one interval rather than six.
              expect(
                /grep -qE '❯\|No conversations\? found to \(resume\|continue\)'/.test(
                  revive,
                ),
              ).toEqual(true);
            },
          );

          then(
            'a revived clone IS nudged — but by the resume command, so the success branch does NOT re-nudge',
            () => {
              // 🔴 .teeth = a revive is INCOMPLETE without a nudge to continue
              //    (define.invariant.crew.revive-is-incomplete-without-a-nudge). the
              //    nudge is now the resume command's own "continue" prompt, submitted
              //    as the first turn — so the ❯-live-box success branch must NOT send a
              //    SECOND nudge. a second one is a false-positive double-nudge (that
              //    invariant's own enforcement: "a NUDGE cure given a SECOND nudge after
              //    the revive = a false positive"). the branch between the caret grep
              //    and `✨ revived` must carry NO duct.send. add one to see this go red.
              expect(
                /grep -q '❯'; then(?:(?!duct\.send)[\s\S])*✨ revived/.test(
                  revive,
                ),
              ).toEqual(true);
            },
          );

          then(
            'a FLAP — no transcript left to resume — is classified, never reported UNKNOWN',
            () => {
              // 🔴 .teeth = measured 2026-09-14 on BOTH orphaned husks of the fleet.
              //    a flap's pane carries neither `Resume Session` nor a `❯` caret, so
              //    before this arm it fell through to the generic "no claude box seen
              //    yet — verify manually" — a volunteered-diagnosis that reports the
              //    state UNKNOWN while the pane names the cause verbatim. the operator
              //    then re-heals a tree a revive can never cure, every tick.
              //    delete the grep to see this go red.
              expect(
                /grep -qE 'No conversations\? found to \(resume\|continue\)'/.test(
                  revive,
                ),
              ).toEqual(true);
            },
          );

          then(
            'the flap arm fires BEFORE the caret success branch, and HATCHES a fresh clone',
            () => {
              // 🔴 .teeth = ORDER carries the whole value. a flap that reached the `❯`
              //    branch would render `✨ revived` over a dead clone. and the cure must
              //    be a FRESH clone, never a second revive
              //    (rule.forbid.remedies-that-mimic-the-defect) — the transcript is
              //    already gone, so to abandon it forfeits naught.
              expect(
                /🪫 flap[\s\S]*__crew_heal_hatch[\s\S]*grep -q '❯'/.test(
                  revive,
                ),
              ).toEqual(true);
              expect(/do NOT re-heal/.test(revive)).toEqual(true);
            },
          );

          then(
            '🔴 the flap cure RUNS the cure, never merely prints a command',
            () => {
              // 🔴 .teeth = the flap arm first shipped `rhx git.crew.boot` as a PRINTED
              //    cure line, and crew.boot is findsert on the DUCT axis — the husk's
              //    duct is alive, so it reported `duct found · dam fine!` and touched
              //    the dead program not at all. a cure that reports SUCCESS and cures
              //    naught is worse than one that errors (rule.forbid.failhide), and a
              //    heal the operator must finish by hand is a byhand heal
              //    (rule.forbid.byhand-heal).
              //
              // .measured 2026-09-15: the emitted line was run verbatim on
              //           rhachet-roles-bhuild.beav.feat-factory-upgrade-collection
              //           and left it a dead husk.
              //
              // .swap the __crew_heal_hatch call back to an `echo` of a boot command
              //        to see this go red.
              const hatch = (() => {
                const at = src.indexOf('__crew_heal_hatch() {');
                const end = src.indexOf('__crew_heal_revive() {', at);
                return at < 0 || end < 0 ? '' : src.slice(at, end);
              })();
              expect(hatch).not.toEqual('');

              // it REBOOTS (clears the dead frame), then LAUNCHES, in that order
              expect(
                /crew\.reboot[\s\S]*duct\.send --on "\$uri" --await 30/.test(
                  hatch,
                ),
              ).toEqual(true);

              // a FRESH launch — never --resume, which is the one flag a flap refutes
              expect(
                /rhx enroll claude --as @:\$who --name \$who/.test(hatch),
              ).toEqual(true);
              expect(/--resume/.test(hatch)).toEqual(false);

              // and acceptEdits, which a fresh clone has no session to restore
              expect(/--permission-mode acceptEdits/.test(hatch)).toEqual(true);
            },
          );

          then(
            '🔴 NO emitted crew.boot cure line carries --who — crew.boot refuses it',
            () => {
              // 🔴 .teeth = a cure line that does not RUN is not a cure. crew.boot
              //    takes a comma LIST (`--roles`); the heal/read/send family takes ONE
              //    seat (`--who`), and both are documented in one header — so the
              //    wrong flag reads as right to the author and exits 2 for the
              //    operator (rule.require.poll-recommends-every-cure-heal-has).
              //
              // .measured 2026-09-15: the flap arm shipped `--who` and its emitted
              //           cure died on `✋ crew.boot: unknown arg '--who'`.
              //
              // .scope = the WHOLE source, not this arm. the defect is a flag-family
              //          confusion, so it can recur at any future cure line — a clamp
              //          bound to one arm would pass while the next one ships broken.
              //          swap a `--roles` back to `--who` on a boot line to see this
              //          go red.
              //
              // ⚠️ .the claim is NARROW on purpose: it forbids `--who`, and does NOT
              //    require `--roles`. a boot line that names no roles is legitimate —
              //    it defaults to the full roster, which is what the grove-mismatch
              //    cure line wants. a first draft demanded `--roles` on every line
              //    and went red on that correct line, which would have "fixed" a
              //    sound cure to satisfy a test (rule.forbid.overzealous-blockers).
              const bootLines = src
                .split('\n')
                .filter((line) => line.includes('git.crew.boot --tree'));
              expect(bootLines.length).toBeGreaterThan(0);
              for (const line of bootLines) {
                expect(line).not.toContain('--who');
              }
            },
          );
        },
      );
    },
  );

  given('[case54] a picker WITH a row — the `❯` that is NOT a live box', () => {
    // 🔴 .teeth = `__crew_heal_one` reads a bare `❯` as "a live claude box is
    //    up" — and claude's `Resume Session` picker draws its own row
    //    highlight as `❯ mechanic`. so a pane PARKED pre-conversation at the
    //    picker walks the whole live-box chain, finds no rate-limit and no
    //    cap, and falls to `return 3` — healthy, no move to make.
    //
    //    ⇒ and the POLL, which reads the shared `__duct_pane_is_husk`, calls
    //      the same pane `mechanic:husk` and EMITS a heal line for it. so
    //      `--healable` names the tree, the emitted line runs verbatim, heal
    //      declines, and the pane comes back byte-identical: detect → heal →
    //      same state → detect, without bound
    //      (rule.forbid.remedies-that-mimic-the-defect, and the split
    //      define.invariant.crew.husk.discriminator-parity forbids).
    //
    //    measured 2026-09-19 on rhachet.beav.fix-keyrack-daemon-orphan and
    //    rhachet.beav.fix-test-tempdir-leak: `--healable` named both, both
    //    emitted lines were run verbatim, and heal answered `😶 a live claude
    //    box is up — not a husk, absent any move to make` for each.
    //
    // ⚠️ this is the WITH-ROWS picker, the twin of the zero-row one already
    //    clamped at pane.husk.parked-at-the-resume-session-picker.log. same
    //    chrome, opposite cures: zero rows is a FLAP (the transcript is gone,
    //    so hatch); a row present is a live transcript one Enter from cured,
    //    so it REVIVES. a fixture of one can never grade the other.
    const PANE_TEXT_PICKER_WITH_ROW = readFileSync(
      join(
        __dirname,
        '.test/.assets/pane.husk.picker-with-a-row-read-as-a-live-box.log',
      ),
      'utf8',
    );

    when('[t0] heal reads that pane', () => {
      const result = useBeforeAll(async () =>
        runCrew({
          command: `crew.heal --tree ${TREE} --who mechanic --what work --mode plan`,
          paneText: PANE_TEXT_PICKER_WITH_ROW,
        }),
      );

      then(
        '🔴 it is a HUSK — never "a live claude box is up, absent any move"',
        () => {
          // .swap the picker arm back out of __crew_heal_one to see this go red.
          expect(result.stdout).not.toContain('a live claude box is up');
          expect(result.stdout).toContain('💀');
        },
      );

      then(
        'it NAMES the picker, so the operator knows what parked the seat',
        () => {
          // .teeth = a husk verdict that does not say WHICH husk shape sends the
          //    operator to read the pane by hand, which is the drill-in the
          //    verdict exists to spare them.
          expect(result.stdout.toLowerCase()).toContain('picker');
        },
      );
    });
  });

  given(
    '[case-heal-banner-then-picker] a picker parked UNDER a resume banner',
    () => {
      // 🔴 .the FOURTH site of ONE root cause, and this file's own [case56]
      //    comment names it: "a bare ❯ is not evidence of a live box". each prior
      //    site was patched with a literal — a `💥N ➜` badge arm, a picker arm,
      //    an anchored caret — and each left one door open.
      //
      // 🔴 .this door is STRUCTURAL rather than literal. heal's picker arm sits
      //    INSIDE its no-banner branch, so a pane that carries BOTH a banner and
      //    a picker never reaches it. the banner branch runs its own order test:
      //      `a ❯ below the banner ⇒ claude restarted, genuinely live` → return 3
      //    and the picker draws its own row highlight as `❯ mechanic`, BELOW the
      //    banner. so the one token that proves the seat dead is read as proof it
      //    is alive.
      //
      // 🔴 .measured 2026-09-20 — rhachet-roles-bhrain.beav.feat-review-cost-meter,
      //    a SPONSORED star. the clone died `💥143` mid-turn (SIGTERM, this
      //    fleet's own earlyoom) and left the banner; a revive then typed
      //    `claude --resume 'mechanic' cont` and parked at the picker.
      //      crew.poll --healable → `💀 husk`, and a cure line
      //      crew.heal (that line, verbatim) → `😶 a live claude box is up`
      //    the pane was re-read seconds later and came back byte-identical, so
      //    the emitted cure was INERT — a term=false-report, and the exact split
      //    define.invariant.crew.husk.discriminator-parity forbids.
      //
      // ⚠️ .this is NOT [case-picker-with-row] one block up. THAT fixture carries
      //    no banner, so it enters the no-banner branch and can never grade the
      //    banner branch's return. a fixture of one can never clamp the other
      //    (rule.require.enumerate-before-you-name).
      const PANE_TEXT_BANNER_THEN_PICKER = readFileSync(
        join(
          __dirname,
          '.test/.assets/pane.husk.revive-parked-at-picker-read-as-an-ask.log',
        ),
        'utf8',
      );

      when('[t0] the fixture is read', () => {
        then(
          '🔴 it carries BOTH halves — else it clamps the block above',
          () => {
            expect(PANE_TEXT_BANNER_THEN_PICKER).toContain(
              'Resume this session with:',
            );
            expect(PANE_TEXT_BANNER_THEN_PICKER).toContain('Esc to cancel');
          },
        );
      });

      when('[t1] heal reads that pane', () => {
        const result = useBeforeAll(async () =>
          runCrew({
            command: `crew.heal --tree ${TREE} --who mechanic --what work --mode plan`,
            paneText: PANE_TEXT_BANNER_THEN_PICKER,
          }),
        );

        then(
          '🔴 it is a HUSK — never "a live claude box is up, absent any move"',
          () => {
            // .restore the banner branch's bare `❯` order test to see this go red.
            expect(result.stdout).not.toContain('a live claude box is up');
            expect(result.stdout).toContain('💀');
          },
        );

        then(
          'it NAMES the picker, so the operator knows what parked the seat',
          () => {
            expect(result.stdout.toLowerCase()).toContain('picker');
          },
        );
      });

      // 🔴 THE TOOTH. the banner branch's order test is REAL and must survive: a
      //    clone that genuinely restarted after an exit carries the banner in its
      //    scrollback and a live box below it. to fire there would reboot a
      //    healthy clone (rule.forbid.byhand-fix-that-burns-the-live-proof).
      when(
        '[t2] a clone genuinely RESTARTED below its own stale banner',
        () => {
          const result = useBeforeAll(async () =>
            runCrew({
              command: `crew.heal --tree ${TREE} --who mechanic --what work --mode plan`,
              paneText: [
                'Resume this session with:',
                'claude --resume "mechanic"',
                '➜ claude --resume mechanic cont',
                '● I read the brief already.',
                '❯ ',
                '  ⏵⏵ accept edits on (shift+tab to cycle)',
              ].join('\n'),
            }),
          );

          then(
            '🔴 it is NOT a husk — the new arm must not widen the banner branch',
            () => {
              expect(result.stdout).not.toContain('💀');
            },
          );
        },
      );
    },
  );

  given(
    '[case56] a mechanic whose claude died of a V8 heap OOM and left NO exit badge',
    () => {
      // 🔴 .the THIRD site of ONE root cause, and the tool already names it in its
      //    own comment: "a bare ❯ is not evidence of a live box". the two prior
      //    sites were patched with a literal each — a `💥N ➜` badge arm, then a
      //    picker arm — and each left the root untouched, so the next shape that
      //    carried neither literal walked straight past both.
      //
      // 🔴 .measured 2026-09-19 on sdk-aws-lambda.beav.feat-input-only-validation
      //    -and-hydration, ~40s apart and on ONE pane:
      //      crew.poll --healable → `💀 husk … ⚠️ WORK ORPHANED`, and a cure line
      //      crew.heal (that line, verbatim) → `😶 a live claude box is up — not
      //        a husk, absent any move to make`
      //    ⇒ the emitted cure was inert and the `--healable` row a
      //      term=false-report, which is exactly the split
      //      define.invariant.crew.husk.discriminator-parity forbids.
      //
      // ⚠️ .why the BADGE arm did not catch it, though the crash class is one it
      //    already clamps. ductwork's own .why argues the badge is "the one token
      //    all three print, because the SHELL prints it rather than the program".
      //    that claim is refuted by this tree, ONE DAY after it was written:
      //      2026-09-18, V8 heap OOM → `💥134 ➜`   (red prompt, $? = 134)
      //      2026-09-19, V8 heap OOM → bare `➜`    (green prompt, $? = 0)
      //    same crash class, same tree, same dump — and the badge is a starship
      //    `status` render that draws ONLY on a nonzero $?. so the badge is not a
      //    property of the crash at all; it is a property of what the shell was
      //    handed (rule.require.enumerate-before-you-name).
      //
      // ⇒ so the cure is NOT a fourth literal. the durable discriminator already
      //   sits 226 lines below, unreached: a mechanic at a bare shell IS a husk,
      //   banner or no banner (crewwork.sh, the poll's own `mechanic:shell` rule).
      //   what kept the chain from it is the unanchored `❯` grep above it, which
      //   the pre-crash UI satisfies. the fix anchors that caret against a
      //   RETURNED SHELL PROMPT below it, so stale chrome cannot claim the pane.
      const PANE_TEXT_V8_OOM_NO_BADGE = readFileSync(
        join(__dirname, '.test/.assets/pane.husk.v8-oom-no-exit-badge.log'),
        'utf8',
      );

      when('[t0] heal reads that pane', () => {
        const result = useBeforeAll(async () =>
          runCrew({
            command: `crew.heal --tree ${TREE} --who mechanic --what work --mode plan`,
            paneText: PANE_TEXT_V8_OOM_NO_BADGE,
          }),
        );

        then(
          '🔴 it is a HUSK — never "a live claude box is up, absent any move"',
          () => {
            // .swap the returned-shell guard back out of __crew_heal_one's ❯ test
            //    to see this go red — it is the assertion the whole case exists for.
            expect(result.stdout).not.toContain('a live claude box is up');
            expect(result.stdout).toContain('💀');
          },
        );

        then(
          'it routes to a REVIVE — to name a shape and stop is the same false report',
          () => {
            // rule.require.a-cure-path-for-every-named-husk-shape
            expect(result.stdout.toLowerCase()).toMatch(/revive|reboot|resume/);
          },
        );

        then(
          '🔴 it NAMES the crash dump, so the OOM is not lost to a generic verdict',
          () => {
            // .teeth = the durable arm's own render says only "bare shell, no
            //    banner". true, and it drops the one fact this tick needed: claude
            //    died of a heap OOM, which is a MEMORY signal about the box
            //    (surgoal.squeeze-the-grove). a verdict that hides it sends the
            //    operator to read the pane by hand.
            expect(result.stdout.toLowerCase()).toContain('crash');
          },
        );
      });

      // 🔴 THE TOOTH, and it is the one that matters most. this repo's own
      //    fixtures and source hold `➜` in plain text, so a LIVE clone that reads
      //    one carries a shell prompt in its scrollback. to fire there reboots a
      //    healthy clone mid-read (rule.forbid.byhand-fix-that-burns-the-live-proof).
      //    what discriminates is ORDER, never presence: a returned prompt sits
      //    BELOW the last caret; a quoted one sits above it.
      when(
        '[t1] a LIVE clone reads a husk fixture, so a ➜ sits in its SCROLLBACK',
        () => {
          const result = useBeforeAll(async () =>
            runCrew({
              command: `crew.heal --tree ${TREE} --who mechanic --what work --mode plan`,
              paneText: [
                '● let me read the husk fixture to see what the badge arm keys on',
                '⎿  sdk-aws-lambda.beav.feat-x on beav/feat-x took 4d14h5m0s at 08:53:43',
                '   💥134 ➜',
                '● so the badge is a starship status render. noted.',
                '❯ ',
                '  ⏵⏵ accept edits on (shift+tab to cycle)',
              ].join('\n'),
            }),
          );

          then(
            '🔴 it is NOT a husk — the caret sits BELOW the quoted prompt',
            () => {
              expect(result.stdout).toContain('a live claude box is up');
              expect(result.stdout).not.toContain('💀');
            },
          );
        },
      );

      when(
        '[t2] the discriminator is SHARED, never a fourth private chain',
        () => {
          then('🔴 it lives in ductwork — one detector, one home', () => {
            // rule.always.entool-the-skills-you-touch. a private copy in crewwork is
            // precisely how the badge arm and the picker arm fell out of step.
            const duct = getShellLibWhole({
              path: join(__dirname, 'ductwork.sh'),
            });
            expect(duct).toContain('__duct_pane_has_returned_shell() {');
          });

          then(
            'and HEAL reaches that shared one, rather than a local grep',
            () => {
              const body = getShellLibWhole({
                path: join(__dirname, 'crewwork.sh'),
              });
              expect(body).toContain('__duct_pane_has_returned_shell "$plain"');
            },
          );

          then(
            '🔴 it GUARDS the ❯ test — a stale caret must not claim the pane',
            () => {
              const body = getShellLibWhole({
                path: join(__dirname, 'crewwork.sh'),
              });
              const caretAt = body.indexOf(`grep -q '\u276f'`);
              const guardAt = body.indexOf(
                '__duct_pane_has_returned_shell "$plain"',
              );
              expect(caretAt).toBeGreaterThan(-1);
              expect(guardAt).toBeGreaterThan(-1);
              // same line, and the guard must NEGATE — a returned shell defeats the caret
              expect(body.slice(caretAt, guardAt)).not.toContain('\n');
              expect(body.slice(caretAt, guardAt + 60)).toContain(
                '! __duct_pane_has_returned_shell',
              );
            },
          );
        },
      );
    },
  );

  given(
    '[case57] the SAME V8 OOM, on a host whose prompt glyph is not ➜',
    () => {
      // 🔴 .the FOURTH site of the same root cause, and this time the patch that
      //    missed it was MINE, one day old. [case56] anchored the ❯ test against a
      //    RETURNED SHELL PROMPT and enumerated that prompt as `➜`. that
      //    enumeration was drawn from a GROVE-ONLY fixture corpus — complete over
      //    the set it sampled, silent about every other host (term=partial-audit).
      //
      // 🔴 .measured 2026-09-20 on infrastructure.beav.feat-camp-git-backup-bucket,
      //    a LOCAL duct. identical crash class, identical dump, and the prompt
      //    starship drew was `❮`, never `➜`:
      //      grove-sandpine-v20260901  V8 heap OOM -> `➜`
      //      local / laptop          V8 heap OOM -> `❮`
      //    ⇒ the guard saw no returned prompt, the stale pre-crash `❯` claimed the
      //      pane, and heal graded a CORPSE a `🧊 SUSPECTED WEDGE` — then
      //      recommended `crew.reboot`, a live-clone cure aimed at a dead program.
      //
      // ✅ .so the anchor may not be a prompt glyph at ALL. a glyph set is a theme
      //    property and can never be enumerated whole. `----- Native stack trace
      //    -----` is printed by NODE on its way out — no shell, no theme, no `$?`
      //    takes part — so it is the one token this crash class cannot vary. the
      //    glyph arm stays as a widened fallback, admitted incomplete.
      const PANE_TEXT_V8_OOM_ALT_CARET = readFileSync(
        join(
          __dirname,
          '.test/.assets/pane.husk.v8-oom-returned-shell-alt-caret.log',
        ),
        'utf8',
      );

      when('[t0] heal reads that local pane', () => {
        const result = useBeforeAll(async () =>
          runCrew({
            command: `crew.heal --tree ${TREE} --who mechanic --what work --mode plan`,
            paneText: PANE_TEXT_V8_OOM_ALT_CARET,
          }),
        );

        then('🔴 it is a HUSK — never "a live claude box is up"', () => {
          // .swap the dump arm back out of __duct_pane_has_returned_shell to see
          //    this go red; the `➜`-only guard does NOT catch this pane.
          expect(result.stdout).not.toContain('a live claude box is up');
          expect(result.stdout).toContain('💀');
        });

        then(
          '🔴 and never a WEDGE — a wedge cure is aimed at a LIVE clone',
          () => {
            // the measured misgrade: `🧊 SUSPECTED WEDGE` + `crew.reboot`, on a
            // program that had already exited. a wedge verdict here is the
            // false-report define.invariant.crew.husk.discriminator-parity forbids.
            expect(result.stdout).not.toContain('SUSPECTED WEDGE');
          },
        );

        then(
          'it names the crash, so the OOM is not lost to a generic verdict',
          () => {
            expect(result.stdout.toLowerCase()).toContain('crash');
          },
        );
      });

      // 🔴 THE TOOTH. this very test file now holds `----- Native stack trace -----`
      //    in plain text, so a LIVE clone that reads it carries the dump in its
      //    scrollback. ORDER is still the whole discriminator.
      when(
        '[t1] a LIVE clone reads a dump, so the trace sits in its SCROLLBACK',
        () => {
          const result = useBeforeAll(async () =>
            runCrew({
              command: `crew.heal --tree ${TREE} --who mechanic --what work --mode plan`,
              paneText: [
                '● let me read the husk fixture to see what the dump arm keys on',
                '⎿  FATAL ERROR: Reached heap limit Allocation failed',
                '   ----- Native stack trace -----',
                '    1: 0xe38a0e node::OOMErrorHandler(char const*) [claude]',
                '● so node prints it, not the shell. noted.',
                '❯ ',
                '  ⏵⏵ accept edits on (shift+tab to cycle)',
              ].join('\n'),
            }),
          );

          then(
            '🔴 it is NOT a husk — the caret sits BELOW the quoted dump',
            () => {
              expect(result.stdout).toContain('a live claude box is up');
              expect(result.stdout).not.toContain('💀');
            },
          );
        },
      );

      // 🔴 .the tooth that ISOLATES the dump arm, and it was owed.
      //    on the real fixture above, the `❮` widening ALONE satisfies [t0] — so
      //    reverting the dump arm leaves [t0] green and only the structural
      //    assertion goes red. a clamp whose behavioural teeth are carried by the
      //    OTHER half proves naught about the half that generalizes
      //    (rule.require.clamp-edge-cases: a clamp with no teeth guards naught).
      // ⇒ so: a dump below the caret, and a prompt glyph in NEITHER arm's set.
      //   this is the case a fifth host would present, and the whole reason the
      //   anchor moved off the glyph in the first place.
      when(
        '[t3] a dump below the caret, under a prompt glyph NO arm enumerates',
        () => {
          const result = useBeforeAll(async () =>
            runCrew({
              command: `crew.heal --tree ${TREE} --who mechanic --what work --mode plan`,
              paneText: [
                '● Composing the yield…',
                '─────────────────────────────────────────────',
                '❯ ',
                '─────────────────────────────────────────────',
                '  ⏵⏵ accept edits on (shift+tab to cycle)',
                '<--- Last few GCs --->',
                '[2675839:0x1d20d000] Mark-Compact 3988.6 (4143.6) -> 3986.2 (4142.8) MB',
                '',
                '<--- JS stacktrace --->',
                '',
                'FATAL ERROR: Reached heap limit Allocation failed - JavaScript heap out of memory',
                '----- Native stack trace -----',
                '',
                ' 1: 0xe38a0e node::OOMErrorHandler(char const*) [claude]',
                'some-tree on beav/feat-x took 1d13h40m39s at 19:46:46',
                '$ ',
              ].join('\n'),
            }),
          );

          then(
            '🔴 it is a HUSK — carried by the DUMP alone, no glyph in any set',
            () => {
              // .swap the dump arm out of __duct_pane_has_returned_shell to see this
              //    go red. the `➜`/`❮` arm cannot reach it — `$` is in neither.
              expect(result.stdout).not.toContain('a live claude box is up');
              expect(result.stdout).toContain('💀');
            },
          );
        },
      );

      // 🔴 .the WEDGE path is a SEPARATE chain, and the first cure did not reach it.
      //    [t0] above drives `--what work` → __crew_heal_one. the prod call that
      //    misgraded this pane was `--what wedge` → __crew_heal_wedge_one, which
      //    carries its OWN unanchored `❯` grep. so the suite went green while the
      //    prod render was UNCHANGED — the precise failure
      //    rule.always.capture-clamp-then-verify-in-prod exists to catch.
      //
      // ⚠️ .and no gate below that one would have saved it. the next gate asks
      //    __crew_turn_stats for a live work-frame, and a pane frozen mid-turn
      //    keeps its spinner + duration + token count on screen forever — the
      //    exact shape that gate reads as "alive, mid-work". the frame then holds
      //    byte-identical across both reads BECAUSE the program is dead, so every
      //    later gate CONFIRMS the wedge instead of refuting it.
      when('[t4] the WEDGE axis reads the same corpse', () => {
        const result = useBeforeAll(async () =>
          runCrew({
            command: `crew.heal --tree ${TREE} --who mechanic --what wedge --mode apply`,
            paneText: PANE_TEXT_V8_OOM_ALT_CARET,
          }),
        );

        then(
          '🔴 it is NOT a wedge — a wedge cure is aimed at a LIVE clone',
          () => {
            // .swap the guard back out of __crew_heal_wedge_one's ❯ gate to see this
            //    go red. a reboot recommended here burns a conversation that already
            //    ended (rule.forbid.byhand-fix-that-burns-the-live-proof).
            expect(result.stdout).not.toContain('SUSPECTED WEDGE');
            expect(result.stdout).not.toContain('CONFIRMED WEDGE');
          },
        );
      });

      when(
        '[t2] the dump arm is the SHARED one, never a crewwork-local grep',
        () => {
          then(
            '🔴 ductwork carries it, inside the returned-shell detector',
            () => {
              const fnBody = getShellFnBody({
                text: getShellLibWhole({
                  path: join(__dirname, 'ductwork.sh'),
                }),
                fn: '__duct_pane_has_returned_shell',
              });
              expect(fnBody.length).toBeGreaterThan(0); // the read found its subject
              expect(fnBody).toContain('----- Native stack trace -----');
              // and the glyph arm is WIDENED, never replaced
              expect(fnBody).toContain('\u276e');
            },
          );
        },
      );
    },
  );

  /**
   * .what = a husk whose resume banner is present but whose exit code is NOT
   *         rendered by the shell prompt.
   *
   * .why  = __crew_heal_one read the exit code off a `💥NNN` prompt segment and,
   *         where it read none, returned 6 — "its close is unreadable — surface
   *         it". but a `%` / `$` shell prompt renders that segment ONLY on a
   *         non-zero exit, so a claude that ended at 0 leaves a banner and a
   *         bare prompt. the close is perfectly readable; only the CODE is
   *         absent, and the code names HOW it died, never WHETHER.
   *
   *         measured 2026-09-15 on
   *         rhachet-roles-ehmpathy.beav.feat-auto-review-permission-responses —
   *         a ⭐ tree parked at stone 3.3.1.blueprint.product after 24 attempts,
   *         `💀 husk — still 104m`, PERMANENT in --healable across every tick,
   *         and heal refused it on every one. a row that can never leave an
   *         actionable set trains a reader to skip the whole set.
   *
   *         verbatim fixture: .test/.assets/pane.husk.resume-marker-called-
   *         unreadable.log
   *
   * .teeth = the two SAFETY guards above this branch already ran and did not
   *          fire — no `^C` in the tail (no human at the keyboard) and no `❯`
   *          below the banner (claude did not restart). so all the old code
   *          lacked was a cosmetic number. bias to DETECT: a false revive
   *          resumes a conversation (benign, `claude --resume`), a miss parks
   *          a ⭐ tree without bound.
   */
  given(
    '[case21] a mechanic husk whose banner is present but exit code is NOT',
    () => {
      const PANE_HUSK_NO_EXIT_CODE = [
        '● Ran 2 stop hooks (ctrl+o to expand)',
        '  ⎿  Stop hook error: route.drive failed with an error',
        '',
        '  stuck on stone 3.3.1.blueprint.product after 24 attempts.',
        '',
        '───────────────────────────────────────────────',
        '❯ ',
        '───────────────────────────────────────────────',
        '  🗿 3.3.1.blueprint.product, review.peer, l3@i012 🔍',
        '  ⏵⏵ accept edits on (shift+tab to cycle)',
        '',
        'Resume this session with:',
        'claude --resume "mechanic"',
        'ip-10-20-2-103%',
      ].join('\n');

      when('[t0] crew.heal reads a banner with no exit code', () => {
        const result = useBeforeAll(async () =>
          runCrew({
            command: `crew.heal --tree ${TREE} --who mechanic --what work --mode plan`,
            paneText: PANE_HUSK_NO_EXIT_CODE,
          }),
        );

        then('it reports a HUSK, never "unreadable"', () => {
          // .teeth = before the cure this read exactly
          //          "husk detected, but its close is unreadable — surface it"
          //          and returned 6, so the tree was never revived.
          expect(result.stdout).toContain('💀');
          expect(result.stdout).toContain('husk');
          expect(result.stdout).not.toContain('its close is unreadable');
        });

        then(
          'it SAYS the exit code was absent — it does not invent one',
          () => {
            // a cure must guide, not merely classify: name what it could not read,
            // so the reader knows the verdict rests on the banner, not on a code.
            expect(result.stdout).toContain('no exit code');
          },
        );

        then('a plan never reboots or resumes — it only reports', () => {
          expect(result.calls.filter((c) => c.startsWith('duct.open'))).toEqual(
            [],
          );
          expect(result.calls.filter((c) => c.startsWith('duct.send'))).toEqual(
            [],
          );
        });
      });

      when('[t1] the same pane, but a HUMAN typed ^C', () => {
        // .teeth = the safety guard must still outrank the new detect arm. a
        //          human at the keyboard may have already acted on what parked
        //          it, so heal surfaces and refuses (rule.forbid.byhand-fix-
        //          that-burns-the-live-proof).
        const PANE_HUMAN_INTERRUPT = [
          PANE_HUSK_NO_EXIT_CODE,
          '^C',
          'ip-10-20-2-103%',
        ].join('\n');

        const result = useBeforeAll(async () =>
          runCrew({
            command: `crew.heal --tree ${TREE} --who mechanic --what work --mode plan`,
            paneText: PANE_HUMAN_INTERRUPT,
          }),
        );

        then(
          'it surfaces the human interrupt and never claims a safe husk',
          () => {
            expect(result.stdout).toContain('a HUMAN was at this keyboard');
            expect(result.stdout).not.toContain('💀');
          },
        );
      });

      when('[t2] the same pane, but claude RESTARTED below the banner', () => {
        // .teeth = the liveness guard must also outrank the new arm — a ❯ below
        //          the banner is a live conversation, and a reboot would burn it.
        const PANE_RESTARTED = [
          PANE_HUSK_NO_EXIT_CODE,
          'claude --resume "mechanic"',
          '❯ ',
        ].join('\n');

        const result = useBeforeAll(async () =>
          runCrew({
            command: `crew.heal --tree ${TREE} --who mechanic --what work --mode plan`,
            paneText: PANE_RESTARTED,
          }),
        );

        then('it reports live — a ❯ below the banner is never stale', () => {
          expect(result.stdout).toContain('a live claude box is up');
          expect(result.stdout).not.toContain('💀');
        });
      });
    },
  );

  given(
    '[case45] a husk killed by the BOX, versus one that merely exited',
    () => {
      // .teeth = heal already reads the exit code and already KNOWS what 143
      //          means — crewwork.sh's own header says "SIGTERM = 143 is this
      //          fleet's own earlyoom guard". that knowledge lived in a COMMENT
      //          and reached no render, so every 143 healed as a plain husk and
      //          the provision signal died with the heal.
      //
      // 🔴 .the two exits demand OPPOSITE second acts, and that is the whole point
      //    a husk that exited on its own owes a resume, and naught else.
      //    a husk the BOX killed owes a resume AND a look at the grove — the
      //    kill is evidence the box is oversubscribed, and it is the only
      //    evidence there is, because earlyoom's TERMs are UNCOUNTED by the
      //    oom row (git.grove.saturation says so in its own output).
      //
      //    measured 2026-09-17 on
      //    rhachet-roles-bhrain.beav.feat-prescribed-brain-per-stone: TERMed
      //    1h17m into a turn while grove-901 sat at 85% committed; the box
      //    recovered 4.7G and the kernel oom counter never moved off 2. three
      //    consecutive ticks before it had healed husks and reported no
      //    provision signal at all.
      //
      // ⇒ .dream v2026_09_10.fix.the-grove-culls-clones-and-the-counter-is-blind
      //   names this as its rung 2: "a crew whose clone died on 143 should
      //   render as a distinct verdict, never as a plain husk."
      const paneKilled = (code: string) =>
        [
          '❯ ',
          '─────────────────────────────────────────────',
          '🗿 5.1.execution.from_vision, review.peer, l3@i016 🔍',
          '⏵⏵ accept edits on (shift+tab to cycle)',
          '',
          'Resume this session with:',
          'claude --resume "mechanic"',
          '',
          `camper in ${TREE} 🌐 ip-10-20-2-103 took 1d0h9m21s`,
          `💥${code} ➜`,
        ].join('\n');

      when('[t0] the husk exited on 143 — SIGTERM, the box killed it', () => {
        const result = useBeforeAll(async () =>
          runCrew({
            command: `crew.heal --tree ${TREE} --who mechanic --what work --mode plan`,
            paneText: paneKilled('143'),
          }),
        );

        then('it still reports a husk and still reads the code', () => {
          expect(result.stdout).toContain('husk');
          expect(result.stdout).toContain('exit 143');
        });

        then(
          'it names the kill as a PROVISION signal, not merely a crash',
          () => {
            // the render must say the BOX did this — a reader who heals and moves
            // on is the failure mode, and it is the one measured above.
            expect(result.stdout).toMatch(/SIGTERM/);
            expect(result.stdout).toContain('earlyoom');
          },
        );

        then(
          'it points at the grove read, so the signal outlives the heal',
          () => {
            expect(result.stdout).toContain('rhx git.grove.saturation');
          },
        );

        then('it names WHY no counter will corroborate it', () => {
          // a reader who checks the oom row and finds it unmoved would
          // conclude no kill happened. the row counts KERNEL kills; earlyoom
          // TERMs first, so the counter is silent by construction.
          expect(result.stdout).toMatch(/UNCOUNTED|uncounted/);
        });
      });

      when(
        '[t1] COUNTER: the husk exited on a code that is NOT a box kill',
        () => {
          // 🔴 the tooth that makes the pair bite. a render that appended the
          //    provision line unconditionally would pass every assertion in [t0]
          //    while it cried oom over an ordinary crash — and a provision signal
          //    that fires on every husk is one no reader will ever act on.
          const result = useBeforeAll(async () =>
            runCrew({
              command: `crew.heal --tree ${TREE} --who mechanic --what work --mode plan`,
              paneText: paneKilled('1'),
            }),
          );

          then('it reports the husk and its code, as before', () => {
            expect(result.stdout).toContain('husk');
            expect(result.stdout).toContain('exit 1');
          });

          then('it says NAUGHT about earlyoom or the grove', () => {
            expect(result.stdout).not.toContain('earlyoom');
            expect(result.stdout).not.toContain('rhx git.grove.saturation');
          });
        },
      );
    },
  );

  given(
    '[case63] a husk whose TRANSCRIPT is rejected — a poisoned conversation',
    () => {
      // .teeth = a poisoned box is LIVE. it paints a `❯`, it takes a keystroke,
      //          and it answers every turn with the same 400. so the caret arm
      //          fires on it and renders `✨ revived` over a clone that can never
      //          take another turn — true about the box it measured, false about
      //          the world (term=false-report).
      //
      // .measured 2026-09-21 on rhachet-roles-bhrain.beav.feat-review-cost-meter.
      //           crew.heal called it `husk (exit 134)`, revived it, and reported
      //           `✨ revived — claude box is live again`. the pane held FIVE 400s
      //           under five distinct request_ids, each a fault in the BODY.
      //
      // 🔴 .the cure is the HATCH, and the trade is NOT a flap's: a flap's
      //    transcript is already gone, so to abandon it forfeits naught. this one
      //    still exists and the hatch destroys it — acceptable only because the
      //    ROUTE holds the work (rule.require.abandon-poisoned-conversations).
      const raw = () =>
        readFileSync(
          join(
            __dirname,
            '.test/.assets/pane.poison.body-defect-400-repeats-under-new-request-ids.log',
          ),
          'utf8',
        );
      // the capture is --raw so the escapes survive; the shell classifier takes
      // de-ansi'd text, so the arms below must run over that same shape.
      const plain = () => raw().replace(/\u001b\[[0-9;]*m/g, '');

      // the three arms, transcribed from __crew_pane_has_poison. the [t2] tooth
      // holds this transcription honest — an arm that drifts in the shell and not
      // here would leave every assertion below true and meaningless.
      const POISON = (pane: string): boolean => {
        if (!/API Error: 400/.test(pane)) return false;
        if (!/invalid_request_error/.test(pane)) return false;
        const hits = (pane.match(/API Error: 400/g) ?? []).length;
        if (hits < 2) return false;
        const ids = new Set(pane.match(/req_[A-Za-z0-9]{6,}/g) ?? []);
        return ids.size >= 2;
      };

      when('[t0] the captured pane is read', () => {
        then('🔴 it holds the shape — or this whole case proves naught', () => {
          const pane = plain();
          expect((pane.match(/API Error: 400/g) ?? []).length).toBeGreaterThan(
            1,
          );
          expect(pane).toContain('invalid_request_error');
          // the fault is in the BODY, which is what makes it terminal
          expect(pane).toContain('blocks in the latest assistant');
        });

        then(
          'the rejections carry DISTINCT request ids — the discriminator',
          () => {
            // the whole reason a 400 is terminal: the same body rebuilds per turn,
            // so a different request receives the identical rejection.
            const ids = new Set(plain().match(/req_[A-Za-z0-9]{6,}/g) ?? []);
            expect(ids.size).toBeGreaterThan(1);
          },
        );
      });

      when('[t1] the poison arms are run over that pane', () => {
        then('the pane is classified POISON', () => {
          expect(POISON(plain())).toEqual(true);
        });

        then(
          '🔴 ONE rejection is NOT poison — the rule calls that "not yet"',
          () => {
            // .teeth = the sharpest negative, and it is the same bytes. sliced at
            //    the second rejection, the pane still carries a 400, still carries
            //    invalid_request_error, still carries a req_ id — and must NOT
            //    fire. an arm keyed on the error class alone would go green here
            //    and hatch a clone over a single transient.
            const pane = plain();
            const second = pane.indexOf(
              'API Error: 400',
              pane.indexOf('API Error: 400') + 1,
            );
            expect(second).toBeGreaterThan(-1);
            const one = pane.slice(0, second);
            expect(one).toContain('API Error: 400');
            expect(one).toContain('invalid_request_error');
            expect((one.match(/req_[A-Za-z0-9]{6,}/g) ?? []).length).toEqual(1);
            expect(POISON(one)).toEqual(false);
          },
        );

        then(
          'a RATE-LIMITED pane is NOT poison — a cap has its own cure',
          () => {
            // .teeth = the arm must not swallow the vendor-cap shape. a cap is
            //    cured by a wait or an auth swap; to hatch one would destroy a
            //    live transcript over a condition that clears on its own.
            const cap = readFileSync(
              join(
                __dirname,
                '.test/.assets/pane.cap.live-future-reset-halted-midturn.log',
              ),
              'utf8',
            ).replace(/\u001b\[[0-9;]*m/g, '');
            expect(cap).not.toEqual('');
            expect(POISON(cap)).toEqual(false);
          },
        );
      });

      when('[t2] the shell arm is read from source', () => {
        const src = () =>
          getShellLibWhole({ path: join(__dirname, 'crewwork.sh') });
        const region = () => {
          const body = src();
          const at = body.indexOf('__crew_pane_has_poison() {');
          return at < 0 ? '' : body.slice(at, body.indexOf('\n}\n', at));
        };

        then('all three arms are still the ones transcribed above', () => {
          const arm = region();
          expect(arm).not.toEqual('');
          expect(arm).toContain("grep -q 'API Error: 400'");
          expect(arm).toContain("grep -q 'invalid_request_error'");
          expect(arm).toContain('"$hits" -ge 2');
          expect(arm).toContain("grep -oE 'req_[A-Za-z0-9]{6,}'");
          expect(arm).toContain('"$ids" -ge 2');
        });

        then('🔴 the poison arm fires BEFORE the caret success branch', () => {
          // 🔴 .teeth = ORDER carries the whole value, and it is the entire
          //    defect: a poisoned box HAS a caret, so the caret arm reached it
          //    first and rendered `✨ revived`. move this arm below the caret
          //    grep to see it go red.
          expect(
            /__crew_pane_has_poison "\$after"[\s\S]*grep -q '❯'/.test(src()),
          ).toEqual(true);
        });

        then(
          '🔴 the poison cure RUNS the hatch, never merely prints a command',
          () => {
            // a heal the operator must finish by hand is a byhand heal
            // (rule.forbid.byhand-heal), and a second revive would be the same
            // failed remedy (rule.forbid.remedies-that-mimic-the-defect).
            expect(
              /🧪 poison[\s\S]*__crew_heal_hatch[\s\S]*grep -q '❯'/.test(src()),
            ).toEqual(true);
            expect(
              /do NOT re-heal — a second revive restores/.test(src()),
            ).toEqual(true);
          },
        );

        then(
          'the header still states WHY a 400 is terminal and a 429 is not',
          () => {
            // the comment is what stops a later tighten from a widen of arm 1 to
            // every `API Error` — which would swallow the cap shape and hatch a
            // clone that needed only a wait.
            expect(src()).toContain('a 400 that names the BODY');
            expect(src()).toContain('a vendor cap, a different cure entirely');
          },
        );

        then(
          '🔴 the LIVE arm carries it too — the half that blinds the fleet',
          () => {
            // 🔴 .teeth = a cure at the HUSK gate alone is INERT the moment the box
            //    is up, and up is where a poisoned clone comes to rest. measured
            //    2026-09-21 in the same tick: the revive reported `✨ revived`, the
            //    box came live, and the very next heal answered `😶 not a husk,
            //    absent any move to make` over a clone rejected on every turn.
            //    delete this arm to see it go red.
            expect(
              /__crew_pane_has_poison "\$plain"[\s\S]*return 3 {3}# a live claude box is present/.test(
                src(),
              ),
            ).toEqual(true);
          },
        );

        then('🔴 the LIVE arm hatches too, never merely reports', () => {
          // the same byhand-heal bound the husk arm carries: a verdict the
          // operator must finish by hand is not a cure (rule.forbid.byhand-heal).
          const live = (() => {
            const body = src();
            const at = body.indexOf('__crew_pane_has_poison "$plain"');
            return at < 0
              ? ''
              : body.slice(
                  at,
                  body.indexOf('return 3   # a live claude box', at),
                );
          })();
          expect(live).not.toEqual('');
          expect(live).toContain('__crew_heal_hatch');
          expect(live).toContain('POISONED');
        });
      });
    },
  );
});
