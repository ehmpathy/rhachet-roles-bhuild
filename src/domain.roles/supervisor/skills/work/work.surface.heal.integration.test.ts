/**
 * .what = clamps on crew.heal and the nudge — wedges, ask widgets, declines, the at-rest nudge
 *
 * .note = a PART of the `work.surface` suite, cut so one reviewer can hold
 *         it whole. the suite's shared fixtures, and its account of what it
 *         runs against and why, live in work.surface.harness.ts.
 */
import { readFileSync } from 'fs';
import { join } from 'path';
import { given, then, when } from 'test-fns';

import {
  asCode,
  DIR_SKILLS,
  DIR_WORK,
  read,
  readCode,
  readCodeWhole,
  readPollWhole,
} from './work.surface.harness';

describe('work.surface', () => {
  /**
   * [case29] — crew.heal --what wedge SURFACES a suspected wedge; it never
   *            auto-cures, and it excludes a plea (task #19)
   *
   * .why = term=duct.program.wedge: a wedge is ALIVE and does not ANSWER — the
   *        one 🧊 frozen face a read cannot confirm, because the address that
   *        would confirm it mutates a live crew. so this axis NARROWS to a
   *        candidate set and hands the confirm+reboot to a human. two boundaries
   *        carry the whole safety of the axis, and this clamps both:
   *          1. a PLEA (a live modal) is excluded — one key moves it, so it is
   *             cured by a keystroke, NEVER a reboot. a reboot on a plea kills a
   *             clone that only needed an answer.
   *          2. the function NEVER invokes reboot — it only PRINTS the command
   *             for a human. an auto-reboot on a false positive (a slow tool
   *             await reads identical from outside) ends a live conversation.
   */
  given(
    '[case29] crew.heal --what wedge surfaces, excludes the plea, and never auto-cures',
    () => {
      const readCrewwork = (): string =>
        readCodeWhole(join(DIR_WORK, 'crewwork.sh'));

      // slice just the __crew_heal_wedge_one body, so a reboot INVOCATION
      // elsewhere in the lib cannot mask a defect in the detector itself.
      const wedgeFn = (): string => {
        const src = readCrewwork();
        const start = src.indexOf('__crew_heal_wedge_one() {');
        expect(start).toBeGreaterThan(-1);
        // the next function declaration marks the end of this one
        const after = src.indexOf('\n__crew_', start + 1);
        return src.slice(start, after > -1 ? after : undefined);
      };

      when('[t0] the axis is a first-class, opt-in --what value', () => {
        then('--what validation accepts wedge', () => {
          // .why the alternation is left OPEN-ENDED, and that is a repair
          //   this once read `…\|wedge\)` — anchored on the close paren, so it
          //   asserted wedge was the LAST value in the set rather than a member
          //   of it. the day a sixth axis landed beside it (`mode`, 2026-09-18)
          //   the clamp went red over a change that violated no property it
          //   names. a clamp that fires on a legal extension trains its reader
          //   to edit the clamp, which is the one habit that kills a clamp.
          //
          //   ⚠️ the BITE is unchanged: drop `wedge` from the set and this still
          //      goes red, because the run of alternatives before it is pinned.
          expect(
            /all\|work\|view\|seat\|wedge[|)]/.test(readCrewwork()),
          ).toEqual(true);
        });

        then(
          'wedge is opt-in ONLY — never folded into `all` (its sleep cost is per-clone)',
          () => {
            const src = readCrewwork();
            // the dispatch guard is a bare wedge test, never OR-ed with `all`
            expect(src.includes('[[ "$what" == "wedge" ]]')).toEqual(true);
            expect(
              src.includes('"$what" == "all" || "$what" == "wedge"'),
            ).toEqual(false);
            expect(
              src.includes('"$what" == "wedge" || "$what" == "all"'),
            ).toEqual(false);
          },
        );
      });

      when('[t1] the detector holds its two safety boundaries', () => {
        then('a live modal (a PLEA) is excluded up front — return 3', () => {
          // the modal test guards a `return 3`, so a plea never reaches the wedge
          // verdict below it.
          //
          // ⚠️ it greps the CALL, not the grammar. the grammar moved out to
          //    `__crew_pane_has_plea` on 2026-09-16 so the four modal shapes could
          //    be clamped in isolation (crewwork [case32]) — a prose list read as
          //    a modal is what earned that split. an inline-regex clamp here would
          //    have to be rewritten on every arm added, and would grade the
          //    WORDS rather than the boundary this case is named for.
          expect(
            /__crew_pane_has_plea[\s\S]{0,120}return 3/.test(wedgeFn()),
          ).toEqual(true);
          // and the helper it calls still holds the modal grammar
          expect(readCrewwork().includes('requires approval')).toEqual(true);
        });

        then(
          'it NEVER invokes reboot — reboot appears only inside an echo, never as a call',
          () => {
            const fn = wedgeFn();
            // the guidance string names the cure for a human
            expect(fn.includes('crew.reboot')).toEqual(true);
            // ...but no line CALLS reboot: no statement-start crew.reboot/duct.reboot
            expect(/\n\s*(crew|duct)\.reboot /.test(fn)).toEqual(false);
          },
        );
      });

      when('[t2] it reads the FRAME, never the clock', () => {
        then(
          'the content compare strips the elapsed/token work-line before the diff',
          () => {
            // term=duct.program.wedge row 61: a timer climbs on a wedge exactly as
            // on a live program, so the compare must exclude it (grep -avE "$wl")
            const fn = wedgeFn();
            expect(fn.includes('grep -avE "$wl"')).toEqual(true);
            expect(/\[\[ "\$c1" != "\$c2" \]\] && return 5/.test(fn)).toEqual(
              true,
            );
          },
        );

        then(
          'an absent work-frame short-circuits to at-REST (idle), never a wedge',
          () => {
            // the sleep+second-read cost is paid only after this gate, so an idle
            // clone never incurs it — return 4 before the sleep
            //
            // 🔴 .why the gate asks __crew_turn_stats and not a duration regex
            //    claude draws a duration on BOTH sides of a turn boundary:
            //      ✻ Sautéed for 6m 20s                    ← the turn is OVER
            //      ✻ Herding… (6m 20s · ↓ 8.0k tokens)     ← the turn is LIVE
            //    the old `$wl` alternation matched `[0-9]+m +[0-9]+s`, so it read
            //    the first as a live work-frame and a halted clone reached the
            //    wedge verdict. the parenthesized `· ↓ <n> tokens` anchor is the
            //    only discriminator, and __crew_turn_stats is where it lives
            //    (crewwork [case33] pins both sides off captured panes).
            const fn = wedgeFn();
            expect(
              fn.includes('__crew_turn_stats "$p1" >/dev/null || return 4'),
            ).toEqual(true);
          },
        );
      });

      // 🔴 .the RENDER seam — a green detector clamp proves the DETECTOR and
      //    says naught about whether a supervisor is ever TOLD to run it
      //    (rule.always.capture-clamp-then-verify-in-prod).
      //
      // 🔴 .the measured defect, 2026-09-16
      //    the wedge axis was opt-in (`--what wedge`, "never under `all`", t0
      //    above) AND absent from `git.crew.poll --healable`. those two compose
      //    into UNREACHABLE: the babysit tick mandates that the actionable sets
      //    be derived THROUGH the tool, so a supervisor who follows the contract
      //    can never probe for a wedge. the only path left was a human who
      //    happened to recall that `--what wedge` exists.
      //
      //    `__crew_is_healable` excluded it explicitly — `frozen && -n queuedrow`
      //    — on the argument that "only the third names a cure". true when
      //    written, false once this axis landed. that is the exact blocker shape
      //    rule.require.poll-recommends-every-cure-heal-has names: a cure added
      //    to a cure-tool with no paired update to its poll, in the same round.
      when(
        '[t3] the paired POLL recommends this cure, and with the right command',
        () => {
          const readPoll = (): string => asCode(readPollWhole());
          const readCw = (): string => readCrewwork();

          then(
            'a frozen crew is healable without a queued row — the witness no longer gates it',
            () => {
              // .teeth = RED on the pre-cure predicate, which required the witness
              //
              // ⚠️ this once pinned the LITERAL `[[ "$status" == "frozen" ]] &&`, and
              //    that exact text went stale the moment the arm took its DOWN screen
              //    on 2026-09-16 (`&& -z "$duct_down"`). the screen is a peer repair,
              //    never a reversal — it removes a crew with no PANE, and not a crew
              //    with no queued row — so a literal-match clamp graded the wrong
              //    subject and went red on a cure it should have passed.
              //
              //    ⇒ grade the PROPERTY the sentence above claims: the frozen arm
              //      exists, and `$queuedrow` is absent from its condition. that
              //      survives any further conjunct that screens a different fact,
              //      and still bites the exact regression it was written for.
              const src = readCw();
              const start = src.indexOf('__crew_is_healable() {');
              expect(start).toBeGreaterThan(-1);
              const fn = src.slice(start, src.indexOf('\n__crew_', start + 1));
              const arm = fn.slice(fn.indexOf('[[ "$status" == "frozen"'));
              const cond = arm.slice(0, arm.indexOf(']]') + 2);
              expect(cond.startsWith('[[ "$status" == "frozen"')).toEqual(true);
              expect(cond.includes('queuedrow')).toEqual(false);
            },
          );

          // ⚠️ the peer half — the DOWN screen, added 2026-09-16. a crew whose duct
          //    is down has no tmux session, so no heal axis can read it, and the
          //    poll's own crew row already names its cure (`rhx git.crew.boot`).
          //    measured over four ticks: 12 of 14 emitted heal lines answered
          //    `no pane read`. the behavioral clamp is crewwork [case18] [t8]-[t10];
          //    this pins the POLL half — that it passes the fact down at all.
          then('and the poll hands the predicate its NO-DUCT screen', () => {
            const poll = readPoll();
            expect(poll.includes('__crew_is_healable "$crew_status"')).toEqual(
              true,
            );
            const call = poll.slice(
              poll.indexOf('__crew_is_healable "$crew_status"'),
            );
            const arg5 = call.slice(0, 1400);

            // 🔴 BOTH no-duct states, not one. this clamp read `== "down"` alone for
            //    a day and the source matched it exactly — while `phantom` (no duct,
            //    no tree here) carried the identical property and sailed through.
            //    the ladder sends both to `frozen` through ONE arm (`!= "at work"`),
            //    so they reach this call indistinguishable.
            //
            //    measured 2026-09-16 over four ticks: three phantom trees each drew
            //    `--who mechanic --what wedge` against no worktree on any box, and
            //    each answered `😴 no pane read`.
            expect(arg5.includes('crew_state" == "down"')).toEqual(true);
            expect(arg5.includes('crew_state" == "phantom"')).toEqual(true);

            // ⚠️ the counter-clamp, and it is what bounds the widened screen.
            //    `asleep` shares the empty-list SYMPTOM and not the property: an
            //    unreached grove was never read, so to screen it would assert an
            //    absent duct from a failed look (term=asleep). it must stay OUT.
            expect(arg5.includes('crew_state" == "asleep"')).toEqual(false);

            // and the parameter is named for the PROPERTY, never for one state that
            // has it — the rename is what stops the next reader from the same miss.
            expect(readCw().includes('no_duct="${5:-}"')).toEqual(true);
          });

          then(
            'an AXIS picker exists, so one status can take two different cures',
            () => {
              expect(readCw().includes('__crew_heal_axis() {')).toEqual(true);
            },
          );

          then(
            'the poll consults that picker per tree, never the status alone',
            () => {
              expect(
                readPoll().includes('__crew_heal_axis "$crew_status"'),
              ).toEqual(true);
            },
          );

          then(
            'the emitted line carries --what wedge for a wedge candidate',
            () => {
              // 🔴 .teeth = the whole cost of the miss. without the flag the emitted
              //    command runs `--what all`, which by t0 above NEVER touches the
              //    wedge axis — so the tree is named and the cure is still hidden.
              const src = readPoll();
              expect(
                /HEALABLE_AXIS\[\$__ct\]:-\}" == "wedge"/.test(src),
              ).toEqual(true);
              expect(src.includes('--who mechanic --what wedge')).toEqual(true);
            },
          );

          // 🔴 ADDED 2026-09-18 — the flag alone is one rung short of the cure.
          //
          //    the tooth above proved the emitted line reaches the wedge AXIS. it
          //    said naught about MODE, so the line stayed plan-only for two days
          //    after heal's rc-4 arm gained the parked-clone nudge. a supervisor
          //    under the babysit contract runs the emitted line verbatim — got a
          //    plan, read a sub-line that still read "a PROBE, never a cure", and
          //    concluded no cure existed.
          //
          // ⇒ rule.require.poll-recommends-every-cure-heal-has: a cure heal OWNS
          //   and the poll does not emit is a cure no supervisor reaches.
          then(
            '🔴 and it carries --mode apply, so the emitted line CURES',
            () => {
              expect(readPoll().includes('--what wedge --mode apply')).toEqual(
                true,
              );
            },
          );

          then(
            '🔴 and its sub-line no longer denies that a cure exists',
            () => {
              const src = readPoll();
              const at = src.indexOf('--what wedge --mode apply');
              const sub = src.slice(at, at + 600);
              expect(sub).not.toContain('never a cure');
              expect(sub).toContain('nudged to continue');
            },
          );

          then('🔴 the pre-fix pair goes RED — the bite proof', () => {
            const shipped = [
              'rhx git.crew.heal --tree $__ct --who mechanic --what wedge"',
              'a PROBE, never a cure: two reads with a repaint between. it names a suspect and stops',
            ].join('\n');
            expect(shipped.includes('--what wedge --mode apply')).toEqual(
              false,
            );
            expect(shipped.includes('never a cure')).toEqual(true);
          });

          then(
            'the empty-set line no longer claims frozen crews are uncurable',
            () => {
              // the prose is the verdict a supervisor reads on an empty sweep, so a
              // stale enumeration there re-hides what the predicate just exposed
              const src = readPoll();
              const idx = src.indexOf('🦫 no tree to heal right now');
              expect(idx).toBeGreaterThan(-1);
              const line = src.slice(idx, src.indexOf('\n', idx));
              expect(line.includes('none frozen')).toEqual(true);
            },
          );
        },
      );

      // 🔴 ADDED 2026-09-20 — the CONFIRM probe, and the dead-end it closes.
      //
      //    [t3] above proved the emitted line reaches the wedge axis AND carries
      //    `--mode apply`, so it cures. that was true of the rc-4 (PARKED) arm
      //    and false of the rc-0 (SUSPECTED WEDGE) arm, which is the arm most
      //    rows land on. rc 0 detected, printed a THREE-STEP byhand cycle —
      //    send Escape → re-read → compare → reboot — and returned.
      //
      //    ⇒ so `--healable` counted `1 to heal`, the supervisor ran the emitted
      //      line verbatim as the babysit contract mandates, and heal delivered
      //      0 cures and a homework list. measured on
      //      infrastructure.beav.feat-camp-git-backup-bucket across two
      //      consecutive ticks — 73m, then 85m — with a byte-identical hand-back
      //      both times and no progress between them. that is
      //      rule.forbid.remedies-that-mimic-the-defect exactly: detect, hand
      //      back, detect, without bound.
      //
      // ⚠️ .the SEAM this case must keep is the one the fix is built around.
      //    --confirm folds the PROBE and stops. the reboot stays the caller's
      //    act because it ENDS A CONVERSATION and cannot be undone
      //    (rule.forbid.bind-a-costly-act-to-a-cheap-one). so [t1]'s
      //    "NEVER invokes reboot" tooth must survive this change untouched —
      //    and it does. this block adds the probe, and guards the seam.
      when(
        '[t4] --confirm folds the PROBE into the tool, and only the probe',
        () => {
          const readCrew = (): string => readCrewwork();

          then(
            'crew.heal parses --confirm and threads it to the wedge helper',
            () => {
              const src = readCrew();
              expect(src.includes('--confirm) confirm=1; shift ;;')).toEqual(
                true,
              );
              // the 5th positional is the flag — a helper that never receives it
              // cannot act on it, which is the silent half of this defect class
              expect(
                src.includes(
                  '__crew_heal_wedge_one "$tree" "$grove" "$w" "$lines" "$confirm"',
                ),
              ).toEqual(true);
              expect(src.includes('confirm="${5:-0}"')).toEqual(true);
            },
          );

          then('the default path is UNCHANGED — no probe fires unasked', () => {
            // .teeth = a flag that fires by default would send a key into every
            //   live pane a roster sweep touches. the guard is the whole safety.
            const fn = wedgeFn();
            expect(fn.includes('if [[ "$confirm" != "1" ]]; then')).toEqual(
              true,
            );
            // and the un-asked path still hands back the same next move
            const bare = fn.slice(
              fn.indexOf('if [[ "$confirm" != "1" ]]; then'),
            );
            expect(bare).toContain('is NOT sent unasked');
            expect(bare).toContain('--what wedge --mode apply --confirm');
          });

          then(
            'with --confirm it SENDS the probe, re-reads, and renders a verdict',
            () => {
              const fn = wedgeFn();
              // the probe itself
              expect(/duct\.send --on "\$uri" --keys Escape/.test(fn)).toEqual(
                true,
              );
              // a re-read, not a re-use of the stale capture
              expect(fn.includes('raw3="$(duct.read --on "$uri"')).toEqual(
                true,
              );
              // and it compares the SAME stripped content the detector compared,
              // never the raw pane — the clock line moves on a wedge too
              expect(
                fn.includes('c3="$(printf \'%s\\n\' "$p3" | grep -avE "$wl")"'),
              ).toEqual(true);
              expect(fn.includes('[[ "$c3" != "$c2" ]]')).toEqual(true);
              // both verdicts are named, and they are opposites
              expect(fn).toContain('REFUTED');
              expect(fn).toContain('CONFIRMED WEDGE');
            },
          );

          then(
            '🔴 the costly act does NOT ride the cheap one — still no reboot call',
            () => {
              // this is [t1]'s tooth, restated here because THIS change is the one
              // that would have broken it. a `--confirm` that also rebooted would
              // sell an irreversible act on the safety of a reversible probe.
              const fn = wedgeFn();
              expect(fn.includes('crew.reboot')).toEqual(true);
              expect(/\n\s*(crew|duct)\.reboot /.test(fn)).toEqual(false);
              // and the CONFIRMED arm says out loud why it stops short
              const hit = fn.slice(fn.indexOf('CONFIRMED WEDGE'));
              expect(hit).toContain('ENDS THIS CONVERSATION');
              expect(hit).toContain('stays YOURS');
            },
          );

          then(
            '--confirm refuses every context where a key must not fly',
            () => {
              // .teeth = three refusals, and each one names the fix rather than
              //   merely a refusal (rule.require.errors-name-the-fix)
              const src = readCrew();
              const guard = src.slice(
                src.indexOf('if [[ "$confirm" == "1" ]]; then'),
              );
              const block = guard.slice(0, 1400);
              // wrong axis — a `--what all` sweep must never carry a probe
              expect(block).toContain('--confirm is the WEDGE axis');
              // plan mode — a plan that mutates is the defect safe-by-default stops
              expect(block).toContain('cannot ride --mode plan');
              // roster sweep — a probe with no --who keys every seat on the tree
              expect(block).toContain('--who is required');
            },
          );

          then(
            '🔴 the pre-fix body goes RED against these teeth — the bite proof',
            () => {
              // the verbatim tail as it shipped before 2026-09-20
              const shipped = [
                'echo "   └─ confirm by hand — a probe key mutates a live crew, so it is NOT auto-sent:"',
                'echo "        address it: rhx git.crew.send --tree $tree --who $who --keys Escape ; then re-read"',
                'echo "        a frame still identical = wedge → cure: rhx git.crew.reboot --tree $tree --who $who"',
                'return 0',
              ].join('\n');
              expect(
                shipped.includes('if [[ "$confirm" != "1" ]]; then'),
              ).toEqual(false);
              expect(
                /duct\.send --on "\$uri" --keys Escape/.test(shipped),
              ).toEqual(false);
              expect(shipped.includes('REFUTED')).toEqual(false);
              expect(shipped.includes('CONFIRMED WEDGE')).toEqual(false);
            },
          );

          then(
            'the skill header documents the flag and its three refusals',
            () => {
              // ⚠️ a flag absent from --help is a flag nobody reaches — the same
              //    unreachability [t3] records for the axis itself
              //
              // 🔴 `read`, never `readCode`. readCode STRIPS comments, and this
              //    skill's --help is `awk … { sub(/^# ?/, ""); print }` over the
              //    header block — so the whole subject of this tooth is exactly
              //    what readCode deletes. caught red on the first run: it returned
              //    the 12-line executable tail and no header at all.
              const skill = read(join(DIR_SKILLS, 'git.crew.heal.sh'));
              expect(skill).toContain('--confirm');
              expect(skill).toContain(
                'requires `--what wedge`, `--mode apply`, and `--who <role>`',
              );
              // and the stale --what enumeration is repaired in the same round
              expect(skill).toContain(
                'all (default) | work | view | seat | wedge | mode',
              );
            },
          );
        },
      );
    },
  );

  // .what = every arm of the poll's subject-set derivation applies ONE crew-tree
  //         test, and `git.crew.heal` refuses a tree the ledger does not name.
  //
  // 🔴 .why = the poll derives its subject set from THREE arms, and only one of
  //    them screened for "is this canon even a crew tree?":
  //
  //      arm 1  live tmux sessions   `[[ "$__c" == *.* ]] || continue`   ✔ screened
  //      arm 2  the crew ledger      a row exists or it does not         ✔ by construction
  //      arm 3  the duct registry    SEEN[...]=1, unconditional          🔴 NOT screened
  //
  //    arm 1 got its screen from task #46 (2026-09-13), with the argument written
  //    out in full at its call site: every real crew tree in this fleet is
  //    `<repo>.beav.<fix|feat>-<slug>`, tmux forbids a literal dot, so a canon
  //    with NO dot at all is structurally never a crew — it is a bare branch name
  //    or a stray session that merely holds a slash.
  //
  //    ⇒ that argument is about the NAME, so it holds for every arm that yields a
  //      name. arm 3 was simply never given it, and #46's cure read as complete
  //      because the arm it repaired was the arm that had been measured.
  //
  // 🔴 .the measured cost, 2026-09-14 → 2026-09-15, SEVEN consecutive ticks:
  //    `rhx git.crew.poll --healable` named `💀 main` and emitted
  //        rhx git.crew.heal --tree main --who mechanic --mode apply
  //    which returns three lines and EXIT 0, every time, and cures naught:
  //        ⏳ main/mechanic: unread (no capture) — skipped, not a verdict
  //        💀 main/mechanic: no live duct — a tab needs work to look at
  //        🪑 main/mechanic: not a local seat — its cwd already resolves this repo's rhx
  //
  //    the row is PERMANENT — measured, not inferred. on one tick the two real
  //    `🚫 limited` rows were nudged and CLEARED from `--healable` (3 → 1) while
  //    this row did not move. the set drains for every row except this one.
  //
  // ⚠️ .the source arm was MIS-DIAGNOSED for a day. the record blamed the live
  //    grove tmux session `main/mechanic` (real — it holds ~6.8% cpu on
  //    grove-sandpine-v20260901). but arm 1 already screens that out, so it cannot
  //    be the source. the true source is LOCAL registry litter from keyrack probe
  //    work, measured 2026-09-15:
  //        ~/.ductwork/ducts/main/keyprobe.json
  //        ~/.ductwork/ducts/main/keytest.json
  //        ~/.ductwork/ducts/main/keytest2.json
  //    two distinct artifacts, one name, conflated. a cure aimed at the tmux arm
  //    would have changed no verdict at all.
  //
  // .teeth = t0 and t1 both go RED on the pre-cure source: arm 3 carried no screen
  //          and `__crew_is_crew_tree` did not exist. t2 goes RED because heal had
  //          no ledger guard — it fell straight through to `grove=local`.
  given(
    '[case34] one crew-tree test, applied by every arm that yields a name',
    () => {
      const readCrewwork = (): string =>
        readCodeWhole(join(DIR_WORK, 'crewwork.sh'));
      const readCrewPoll = (): string => asCode(readPollWhole());

      when(
        '[t0] the test is ONE named predicate, not an inline condition per arm',
        () => {
          then('crewwork declares it, so both arms can share one rule', () => {
            expect(readCrewwork().includes('__crew_is_crew_tree()')).toEqual(
              true,
            );
          });

          then('it keys on the DOT, the structural mark #46 argued for', () => {
            const src = readCrewwork();
            const fn = src.slice(src.indexOf('__crew_is_crew_tree()'));
            expect(fn.slice(0, 400).includes('*.*')).toEqual(true);
          });
        },
      );

      when('[t1] every derivation arm applies it', () => {
        then('the live-tmux arm applies it', () => {
          expect(readCrewPoll().includes('__crew_is_crew_tree "$__c"')).toEqual(
            true,
          );
        });

        then(
          'the duct-registry arm applies it too — the arm that let `main` in',
          () => {
            // 🔴 the whole defect, in one assertion. the pre-cure registry loop read:
            //      SEEN["$(__crew_canon "$(basename "$(dirname "$row")")")"]=1
            //    one statement, no screen. so `ducts/main/keytest.json` minted a crew
            //    named `main` on every sweep, and no other arm could veto it.
            const src = readCrewPoll();
            const arm = src.slice(
              src.indexOf('find "$DUCTWORK_DIR/ducts"') - 900,
            );
            expect(arm.slice(0, 900).includes('__crew_is_crew_tree')).toEqual(
              true,
            );
          },
        );

        then(
          'the registry arm no longer mints a crew in one unscreened statement',
          () => {
            expect(
              readCrewPoll().includes(
                'SEEN["$(__crew_canon "$(basename "$(dirname "$row")")")"]=1',
              ),
            ).toEqual(false);
          },
        );
      });

      // ⚠️ heal's SILENT fallback to `local` for a rowless tree is the second arm
      //    of this defect, and it is deliberately NOT cured or clamped here.
      //
      //    a `return 2` under heal's `-z "$grove"` branch was written, run, and
      //    REVERTED on 2026-09-15: it reddened SIXTEEN hermetic heal tests
      //    (crewwork [case11][case12][case13][case16][case17]), each of which
      //    boots a real LOCAL session for a fixture tree the harness writes no
      //    ledger row for. so `local` is a legitimate resolution for a rowless
      //    tree whose session is genuinely local — the defect is the silence,
      //    never the fallback, and a cure that reddens a peer test is no cure.
      //
      //    nor is a "the comment documents it" clamp written in its place:
      //    readCode() strips every `#` line, so this harness cannot see a shell
      //    comment at all, and a clamp that grades prose has no teeth in the one
      //    sense that matters. the reverted attempt is recorded on the task.
    },
  );

  given('[case41] heal REFUSES to relay into a box an ASK WIDGET holds', () => {
    /**
     * 🔴 .the defect, measured 2026-09-17 on
     *    `rhachet-roles-bhrain.beav.feat-acceptance-under-5min`
     *
     *    ONE poll render carried BOTH of these, about the same tree/role:
     *      ├─ 🙋ask × 1 — …feat-acceptance-under-5min / mechanic
     *      ├─ 🧊 …feat-acceptance-under-5min — rhx git.crew.heal --tree … --mode apply
     *
     *    and duct.poll's OWN row for `box_kind=ask` reads, verbatim:
     *      "🙋 ASK — a DESIGN question, put to the HUMAN. not yours"
     *      "send NO keys. verify its merits, then surface it with what you found"
     *
     *    ⇒ the tool told a supervisor to send keys into the one box it had just
     *      told them to send no keys into — and the babysit contract mandates
     *      that every emitted heal line be run VERBATIM.
     *
     * ⚠️ .the relay's OWN guards are honest and were both met — the queued row
     *    carried its background highlight, the turn had ended. what neither can
     *    see is WHO HOLDS THE INPUT. the pane held a 3-tab AskUserQuestion
     *    widget whose footer reads `Enter to select`, cursor at option 1, so a
     *    relay's text+Enter reaches the WIDGET rather than the box.
     *
     *    duct.poll already names that cost: "an ask misread as a permission
     *    modal costs a decision recorded in the HUMAN's name, and that does not
     *    undo." a wrong relay here is a design fork voted in the human's name.
     */
    const readCrewwork = (): string =>
      readCodeWhole(join(DIR_WORK, 'crewwork.sh'));
    const readDuctPoll = (): string =>
      readCode(join(DIR_SKILLS, 'duct.poll.sh'));

    /** the ask discriminator, as duct.poll spells it */
    const ASK_TELLS = 'Chat about this|\\(Recommended\\)|Tab/Arrow keys';

    when('[t0] the relay arm is read', () => {
      then('an ASK guard exists at all — the clamp is not vacuous', () => {
        expect(
          readCrewwork().includes('an ASK WIDGET holds the input'),
        ).toEqual(true);
      });

      then(
        '🔴 the guard is ordered BEFORE the drain — a check after the send cures naught',
        () => {
          const src = readCrewwork();
          const guard = src.indexOf(`grep -qaE '${ASK_TELLS}'`);
          const drain = src.indexOf(
            '__crew_heal_drain "$tree" "$grove" "$who" "$uri" "$mode" "$__qrow"',
          );
          expect(guard).toBeGreaterThan(0);
          expect(drain).toBeGreaterThan(0);
          expect(guard).toBeLessThan(drain);
        },
      );

      then(
        'it returns 5 — the SAME code the ^C arms use for a human at the keyboard',
        () => {
          // .why reuse rather than a new code: `return 5` already means
          //      "surface, never auto-heal — a HUMAN was at this keyboard".
          //      an ask is that signal, so it earns no second vocabulary.
          const src = readCrewwork();
          const guard = src.indexOf(`grep -qaE '${ASK_TELLS}'`);
          const after = src.slice(guard, guard + 800);
          expect(after.includes('return 5')).toEqual(true);
          // and it must NOT fall through to the relay's own code
          expect(
            after.slice(0, after.indexOf('return 5')).includes('return 7'),
          ).toEqual(false);
        },
      );

      then(
        "it says SEND NO KEYS — duct.poll's own words, not a softer paraphrase",
        () => {
          expect(readCrewwork().includes('send NO keys')).toEqual(true);
        },
      );
    });

    when('[t1] the discriminator is held against duct.poll', () => {
      then(
        '🔴 BOTH files test the SAME tells — a private copy would drift',
        () => {
          // .why this matters: if heal and duct.poll ever disagree about what an
          //      ask IS, the render says `🙋ask` while heal relays into it — the
          //      exact contradiction this case was opened on.
          expect(
            new RegExp(`grep -qaE '${ASK_TELLS}'`).test(readCrewwork()),
          ).toEqual(true);
          expect(
            new RegExp(`grep -qaE '${ASK_TELLS}'`).test(readDuctPoll()),
          ).toEqual(true);
        },
      );

      then('duct.poll still classifies those tells as `ask`', () => {
        const src = readDuctPoll();
        const at = src.indexOf(`grep -qaE '${ASK_TELLS}'`);
        expect(at).toBeGreaterThan(0);
        expect(src.slice(at, at + 200).includes('box_kind="ask"')).toEqual(
          true,
        );
      });
    });

    when('[t2] the captured production pane is read', () => {
      const asset = (): string =>
        readFileSync(
          join(
            DIR_WORK,
            '.test/.assets/pane.ask.widget-holds-input-over-a-queued-row.log',
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
        '🔴 it satisfies the relay guards AND the ask tells at once — the whole defect',
        () => {
          const held = asset();
          // the relay's two preconditions, both honestly met:
          expect(held.includes('Worked for 19m 26s')).toEqual(true); // turn ended
          expect(held.includes('48;5;237')).toEqual(true); // queued-row background highlight
          // and the ask widget that makes a relay a vote:
          expect(/Chat about this|Tab\/Arrow keys/.test(held)).toEqual(true);
          expect(held.includes('Enter')).toEqual(true);
        },
      );
    });

    when('[t3] the pre-fix form is held against the same assertions', () => {
      then('🔴 it goes RED — the bite proof', () => {
        // .teeth = the arm exactly as it shipped: the two guards, then the
        //          drain, with no ask check between them.
        const shipped = [
          'if [[ -n "$__qrow" && -n "$__tended" ]]; then',
          '  echo "🛑 $tree/$who: HALTED — turn ended"',
          '  __crew_heal_drain "$tree" "$grove" "$who" "$uri" "$mode" "$__qrow"',
          '  return 7',
          'fi',
        ].join('\n');
        expect(shipped.includes('an ASK WIDGET holds the input')).toEqual(
          false,
        );
        expect(shipped.includes('send NO keys')).toEqual(false);
        expect(new RegExp(`grep -qaE '${ASK_TELLS}'`).test(shipped)).toEqual(
          false,
        );
        // and it reaches the drain with no guard in front of it
        expect(shipped.indexOf('__crew_heal_drain')).toBeGreaterThan(0);
      });
    });
  });

  /**
   * .what = every wedge verdict that REFUSES over a live pane must name a next move
   *
   * .why  = `--healable` over-recommends on purpose (`crewwork.sh:1520` — "the poll
   *         RECOMMENDS the cure, heal APPLIES or refuses it"), so a refusal is the
   *         COMMON outcome, never the rare one. measured across two consecutive
   *         babysit ticks: 6 probes, 6 refusals, 0 cures, every one of them rc=4.
   *
   *         ⇒ so the refusal verdict is what a supervisor actually reads, and two of
   *         the three already end in a pointer — rc 3 "cured by a key, never a
   *         reboot", rc 6 "(that is heal --what work)". rc 4 ended in a dead end, so
   *         the same three trees were re-nominated every tick against a grove at
   *         runq 15, and the supervisor had no lever to move them off the list.
   *
   * .the boundary = a verdict rendered from a pane heal COULD read and found no wedge
   *   in. deliberately NOT clamped here, and each for its own reason:
   *     - rc 2 `no pane read`  — there was no pane at all, so it reports on the READ
   *       (`crewwork.sh:1537`), and a cure pointer would claim a diagnosis it lacks
   *     - rc 5 `the frame moved` — HEALTHY. the program advanced; no move is owed
   */
  given(
    '[case51] a wedge refusal over a live pane names the supervisor a next move',
    () => {
      const PATH_CREWWORK_SH = join(DIR_SKILLS, 'work', 'crewwork.sh');

      /**
       * .what = the wedge `case $rcw in` arm bodies, keyed by rc
       * .why  = derived from the shell rather than listed here, so an arm added
       *         tomorrow is graded with no edit to this clamp
       */
      const genWedgeArms = (): Record<string, string> => {
        const source = readCodeWhole(PATH_CREWWORK_SH);
        const at = source.lastIndexOf('__crew_heal_wedge_one');
        const block = source.slice(at, source.indexOf('esac', at));
        const arms: Record<string, string> = {};
        for (const [, rc, body] of block.matchAll(
          /^\s*([2-6])\)(.*\$named.*)$/gm,
        ))
          arms[rc!] = body!;
        return arms;
      };

      /** the rcs that read a live pane and then refused — the boundary above */
      const RCS_REFUSED_OVER_A_LIVE_PANE = ['3', '4', '6'];

      when('[t0] the wedge arms are derived from the shell', () => {
        then('all three live-pane refusals are found', () => {
          const arms = genWedgeArms();
          for (const rc of RCS_REFUSED_OVER_A_LIVE_PANE)
            expect(arms[rc]).toBeDefined();
        });

        then(
          'and the arm bodies are the verdicts, not an adjacent match',
          () => {
            expect(genWedgeArms()['4']).toContain('at rest');
            expect(genWedgeArms()['6']).toContain('no live claude box');
          },
        );
      });

      when('[t1] each live-pane refusal is read for its next move', () => {
        /**
         * a pointer is either a runnable `rhx …` or a named peer axis/lever.
         * ⚠️ NOT a mere mention of the tool's own name — the dead-end string held
         *    the word "wedged" and pointed nowhere
         */
        const hasNextMove = (body: string): boolean =>
          /rhx [a-z.]+/.test(body) ||
          /heal --what [a-z]+/.test(body) ||
          /cured by a/.test(body);

        then('not one of them dead-ends', () => {
          const arms = genWedgeArms();
          for (const rc of RCS_REFUSED_OVER_A_LIVE_PANE) {
            expect({ rc, next: hasNextMove(arms[rc]!) }).toEqual({
              rc,
              next: true,
            });
          }
        });

        // 🔴 .AMENDED 2026-09-18 — the at-rest arm used to assert `NO cure`, and
        //    that clamp held a real dead-end in place.
        //
        //    a live box with no active-work frame, on a crew already screened
        //    `frozen` (so still ≥ STALL_MINS), is a PARKED clone — and a parked
        //    clone's cure is a nudge, which heal already owns as
        //    `__crew_heal_nudge` and already spends on `limited`.
        //    `define.invariant.crew.revive-is-incomplete-without-a-nudge` states
        //    it outright: restore, then say "go".
        //
        //    measured: `feat-acceptance-under-5min` sat 200m while this arm said
        //    "heal has NO cure for idle, so the poll will re-nominate it every
        //    tick" — a tool that names the state, owns the cure, and declines to
        //    apply it. the human: "heal exclusively via tool".
        then(
          '🔴 the at-rest verdict names the NUDGE cure, never a dead end',
          () => {
            expect(genWedgeArms()['4']).toContain('nudge');
          },
        );

        then(
          'and it still states the measurement it rests on — idle, not wedged',
          () => {
            expect(genWedgeArms()['4']).toContain('idle, not wedged');
          },
        );

        then('🔴 the pre-fix dead-end form goes RED — the bite proof', () => {
          const shipped =
            '😶 $tree/$w: at rest — a live box with no active-work frame is idle, not wedged. heal has NO cure for idle, so the poll will re-nominate it every tick until you settle it';
          expect(shipped.includes('NO cure')).toEqual(true);
          expect(shipped.includes('nudge')).toEqual(false);
        });
      });

      when('[t2] the verdicts outside the boundary are read', () => {
        then('the healthy arm is left with no cure pointer, on purpose', () => {
          expect(genWedgeArms()['5'] ?? '').not.toContain('rhx ');
        });
      });
    },
  );

  /**
   * [case53] — a DECLINE parks a crew only while it is FRESH
   *
   * 🔴 .the shape = the decline arm reads `__has_declined` off the PANE, and a
   *    resumed clone REPLAYS its transcript into that pane. so a decline that
   *    was answered before a crash is re-rendered after the restore and reads
   *    as though it just happened.
   *
   *    the verdict it produces is `blocked:on-human`, whose whole prescription
   *    is "NO nudge — a decline is a deliberate verdict a tool may not
   *    overturn". ⇒ the misread does not merely mislabel: it SUPPRESSES the one
   *    cure that works, and it does so permanently, because no part of a
   *    replayed line ever expires.
   *
   * 🔴 .measured 2026-09-18, `rhachet-roles-bhrain.beav.feat-acceptance-under
   *    -5min` @ bert/feat-goal-init. the pane held `⎿ User rejected update to
   *    blackbox/driver.route.stack.acceptance.test.ts`, an empty ❯ box, and
   *    `⏵⏵ accept edits on`. the crew rendered `🙋 blocked:on-human · still
   *    190m` and `⛔ DECLINE PARKED — NO nudge is prescribed`.
   *
   *    ⇒ and `--healable` named it NOT AT ALL, while three peers at 529m, 196m
   *      and 516m were named 🧊 frozen and reachable in the same call.
   *
   *    the human's verdict, verbatim: "its frozen because it was resumed from a
   *    crash and never told to 'go'".
   *
   * 🟢 .the corroboration that was on the render the whole time = every PEER
   *    seat on that crew read `relic — no live clone in this pane; a stale 🗿
   *    line sits in scrollback`. a crew whose other four seats are relics is a
   *    crew that died; the survivor's pane content is a replay.
   *
   * 🔴 .the discriminator = RECENCY, and it needs no new read. `crew_idle` is
   *    computed ~300 lines above the ladder. a decline a human just made is
   *    fresh; a pane still for 190m is a parked clone whatever its scrollback
   *    says. past `STALL_MINS` the arm must stand aside and let `:3148` land it
   *    on `frozen` — which IS healable, so the nudge becomes reachable.
   *
   * ⚠️ .the FRESH decline is untouched, on purpose. `rule.forbid.steer-a-clone
   *    -beyond-a-permission-key` still holds: while the verdict is live, to
   *    resume is the decliner's call and no tool may overturn it.
   *
   * .teeth = drop the recency bound and t0/t3 go red.
   */
  given('[case53] a DECLINE parks a crew only while it is fresh', () => {
    const readPoll = (): string => asCode(readPollWhole());

    /** the ladder arm, as CODE — readCode drops the comments above it */
    const arm = (): string => {
      const src = readPoll();
      const at = src.indexOf('$__has_declined');
      return at < 0 ? '' : src.slice(Math.max(0, at - 200), at + 400);
    };

    when('[t0] the decline arm is read', () => {
      then('it exists at all — the clamp is not vacuous', () => {
        expect(arm().length).toBeGreaterThan(100);
      });

      then('🔴 it is bounded by RECENCY, never by the pane text alone', () => {
        expect(arm().includes('crew_idle')).toEqual(true);
        expect(arm().includes('STALL_MINS')).toEqual(true);
      });
    });

    when('[t1] the arm keeps every gate it already had', () => {
      // 🔴 counter-teeth. the cure ADDS a bound; it must remove none, or a
      //    decline with a queued message behind it loses the sharper drain cure.
      then('it still keys on the declined witness', () => {
        expect(arm().includes('__has_declined')).toEqual(true);
      });

      then('it still stands aside for a queued box', () => {
        expect(arm().includes('📬queued')).toEqual(true);
        expect(arm().includes('__has_queuedrow')).toEqual(true);
      });

      then('and a FRESH decline still lands on the human', () => {
        expect(arm().includes('blocked:on-human')).toEqual(true);
      });
    });

    when('[t2] the fall-through it relies on is still there', () => {
      then('🔴 a stale crew lands on frozen, which heal can reach', () => {
        // without this line the cure would strand the crew in `inflight` —
        // surfaced nowhere and healable by none, which is strictly worse than
        // the mislabel it replaced.
        const src = readPoll();
        expect(
          src.includes(
            '"$crew_idle" -ge "$STALL_MINS" ]]; then crew_status="frozen"',
          ),
        ).toEqual(true);
      });
    });

    when('[t3] the pre-fix form is held against the same assertions', () => {
      then('🔴 it goes RED — the bite proof', () => {
        // .teeth = the arm exactly as it shipped this morning: three pane
        //          conditions, no clock at all.
        const shipped =
          'elif [[ -n "$__has_declined" && "$__boxes_s" != *"📬queued"* && -z "$__has_queuedrow" ]]; then crew_status="blocked:on-human"';
        expect(shipped.includes('__has_declined')).toEqual(true);
        expect(shipped.includes('crew_idle')).toEqual(false);
        expect(shipped.includes('STALL_MINS')).toEqual(false);
      });
    });
  });

  /**
   * [case54] — the at-rest NUDGE must reach the clone, and a send that does
   *            not reach it must SAY so
   *
   * 🔴 .the shape = [case51] grades the at-rest VERDICT — the sentence heal
   *    prints. it grades not one byte of the apply path beneath it. so a cure
   *    that announces a nudge and delivers none passes [case51] whole.
   *
   *    measured 2026-09-18, on `feat-acceptance-under-5min`: FOUR consecutive
   *    `--mode apply` runs, each byte-identical to its own `--mode plan`, each
   *    exit 0. the pane was untouched through all four. two defects, stacked:
   *
   *      A. the uri was built from the GROVE, never the HOST, so it read
   *         `duct://cloud://grove-…/<tree>/<role>` — a double scheme no duct
   *         answers. `__crew_duct_uri` says `a HOST, never a grove` at :2158,
   *         and all eleven other call sites derive one first
   *      B. the failure was UNREADABLE — `duct.send … >/dev/null 2>&1` ate the
   *         diagnosis, and the `💥` rode stderr, which rhachet drops on an
   *         exit-0 run. so A stayed invisible across all four runs
   *
   *    ⇒ B is the one that earns a clamp of its own. A was a plain slip and a
   *      read of :2158 corrects it; B is what let a plain slip survive four
   *      applies and read as a cure each time (`rule.forbid.failhide`).
   *
   * ⚠️ .the pane read is what caught it, never the exit code
   *    (`rule.require.verify-after-send`). a green suite proves the detector;
   *    only prod proves the render, and only the PANE proves the cure
   *    (`rule.always.capture-clamp-then-verify-in-prod`).
   */
  given(
    '[case54] the at-rest nudge reaches the clone, or says it did not',
    () => {
      const PATH_CREWWORK_SH = join(DIR_SKILLS, 'work', 'crewwork.sh');

      /**
       * .what = the rc-4 arm WITH its apply block — [case51]'s parser takes the
       *         one-line verdict only, by design, so it cannot see this at all
       * ⚠️ both anchors are CODE. `readCode` drops every line-leading `#`, so a
       *    comment anchor yields -1 and the slice reads empty — which passes
       *    every `includes()` tooth by vacuity. the length tooth below is what
       *    makes that impossible to miss
       */
      const genAtRestApplyBlock = (): string => {
        const src = readCodeWhole(PATH_CREWWORK_SH);
        const at = src.indexOf('at rest — a live box');
        const end = src.indexOf('the frame moved across two reads', at);
        return at < 0 || end < 0 ? '' : src.slice(at, end);
      };

      /** .what = the body of `__crew_heal_nudge`, the cure this arm delegates to */
      const genNudgeFn = (): string => {
        const src = readCodeWhole(PATH_CREWWORK_SH);
        const at = src.indexOf('__crew_heal_nudge() {');
        const end = src.indexOf('\n}', at);
        return at < 0 || end < 0 ? '' : src.slice(at, end);
      };

      when('[t0] the two slices are derived from the shell', () => {
        then('neither is empty — the anti-vacuity tooth', () => {
          expect(genAtRestApplyBlock().length).toBeGreaterThan(200);
          expect(genNudgeFn().length).toBeGreaterThan(200);
        });

        then('and each is the slice it claims, not an adjacent match', () => {
          expect(genAtRestApplyBlock()).toContain('__crew_heal_nudge');
          expect(genNudgeFn()).toContain('duct.send');
        });
      });

      when('[t1] defect A is read — the uri must be built from a HOST', () => {
        then(
          '🔴 the apply path derives the host before it builds the uri',
          () => {
            expect(genAtRestApplyBlock()).toContain('__crew_grove_host');
          },
        );

        then(
          '🔴 and it never hands a GROVE straight to __crew_duct_uri',
          () => {
            // .teeth = the exact pre-fix call. a grove carries a `cloud://` scheme,
            //          so this form yields `duct://cloud://…` and no duct answers
            expect(genAtRestApplyBlock()).not.toContain(
              '__crew_duct_uri "$grove"',
            );
          },
        );

        then(
          'and a grove it cannot derive a host for is reported, never swallowed',
          () => {
            expect(genAtRestApplyBlock()).toContain('nudge NOT sent');
          },
        );
      });

      when('[t2] defect B is read — a failed send must be legible', () => {
        then('🔴 the send output is CAPTURED, never discarded', () => {
          // .teeth = `>/dev/null 2>&1` is what ate the diagnosis for four runs
          expect(genNudgeFn()).not.toContain('>/dev/null 2>&1');
          expect(genNudgeFn()).toContain('2>&1)');
        });

        then(
          '🔴 the failure verdict rides STDOUT, so an exit-0 run cannot drop it',
          () => {
            const fail = genNudgeFn()
              .split('\n')
              .filter((l) => l.includes('💥'));
            expect(fail.length).toBeGreaterThan(0);
            for (const line of fail) expect(line).not.toContain('>&2');
          },
        );

        then(
          'and the failure names the uri, which is where defect A was hiding',
          () => {
            expect(genNudgeFn()).toContain('uri: $uri');
          },
        );

        then(
          'and it states the clone was NOT cured, in the row a human scans',
          () => {
            expect(genNudgeFn()).toContain('STILL parked');
          },
        );

        then('the success verdict is unchanged — one channel for both', () => {
          expect(genNudgeFn()).toContain('🌊 nudged to retry');
        });
      });

      when('[t3] the VERDICT is read for mode-awareness — defect C', () => {
        /**
         * 🔴 .the measured defect, 2026-09-19 — a remedy that names its own caller
         *
         *    the rc-4 verdict was UNCONDITIONAL while the apply block beneath it
         *    was gated on mode. so a real `--mode apply` run printed:
         *
         *      😶 …: PARKED … heal cures it with a nudge: rhx git.crew.heal
         *         --tree … --what wedge --mode apply
         *         └─ 🌊 nudged to retry — verify it resumed: …
         *
         *    line 1 names the invocation that printed it. line 2 says it ran.
         *    measured on a live tick: `feat-review-cost-meter` resumed inside
         *    the second, and the render still read as a move still owed.
         *
         * ⚠️ .the harm is a SECOND nudge, and the babysit contract is what makes
         *    it reachable rather than theoretical: "run each emitted heal line
         *    verbatim". a supervisor who sweeps a render for `rhx git.crew.heal`
         *    finds one HERE, inside heal's own apply output. the clone has
         *    resumed by then, so the re-run is an Enter into a live box — the
         *    harm `term=duct.box.inflight` records.
         *
         * 🟡 .and [case51] cannot catch this BY DESIGN. its parser takes the
         *    one-line verdict and grades it for a next move; a next move that is
         *    correct in plan and self-referential in apply reads identical to it.
         *    that is the same instance-not-class seam [case54] exists to cover
         *    (`rule.require.clamp-edge-cases`).
         */
        /**
         * ⚠️ ANCHORED on text unique to the AT-REST arm, never on `4) [[ -n
         *    "$named" ]]` — measured 2026-09-19, that opener is shared with a
         *    peer rc-4 arm ("no claude box and no crash banner seen") and a bare
         *    indexOf lands on it. this clamp's first draft did exactly that and
         *    graded the wrong arm. it failed loud here, which was luck: the same
         *    slip in the other direction reads as a clean pass forever, and that
         *    is the hazard [case54]'s own header records.
         */
        const verdict = (): string => {
          const src = readCodeWhole(PATH_CREWWORK_SH);
          const marker = src.indexOf('at rest — a live box');
          expect(marker).toBeGreaterThan(0);
          const start = src.lastIndexOf('\n', marker) + 1;
          const end = src.indexOf('\n', marker);
          expect(end).toBeGreaterThan(start);
          return src.slice(start, end);
        };

        then(
          'it is ONE line still — [case51]`s parser stays able to see it',
          () => {
            // 🔴 ANTI-VACUITY + the constraint the shell comment records: a split
            //    arm is invisible to `/^\s*([2-6])\)(.*\$named.*)$/gm`, and the
            //    first draft of the 2026-09-18 cure lost five teeth to exactly that.
            //    so the arm must OPEN as an rc-4 case and CLOSE its own brace on
            //    the same line — a split shows up as a failure of one or the other.
            const line = verdict();
            expect(line.length).toBeGreaterThan(200);
            expect(line.trim().startsWith('4)')).toEqual(true);
            expect(line.trim().endsWith('; }')).toEqual(true);
            expect(line).toContain('$named');
          },
        );

        then(
          '🔴 it BRANCHES on mode — the one byte the prior form lacked',
          () => {
            expect(verdict()).toContain('"$mode" == "apply"');
          },
        );

        then('🔴 the APPLY branch refuses the re-run it used to invite', () => {
          // .teeth = the apply branch must say the send already went AND forbid
          //          a second. either half alone still reads as a move owed.
          const line = verdict();
          expect(line).toContain('SENT, see below');
          expect(line).toContain('do NOT re-run this verb');
          expect(line).toContain('Enter into a box that has resumed');
        });

        then(
          'and the PLAN branch keeps the runnable remedy — it is real there',
          () => {
            // ⚠️ the literal command must SURVIVE, or this cure would defeat
            //    [case51]'s next-move guarantee rather than sharpen it. in plan
            //    mode the command has not run, so the remedy is correct there.
            expect(verdict()).toContain('--what wedge --mode apply');
          },
        );

        then(
          'COUNTER — the measurement clauses survive in BOTH branches',
          () => {
            // 🔴 the cure touches WHEN the remedy is stated, never WHAT the arm
            //    measured. under a revert these stay green, so they grade the
            //    scope of the repair rather than restate its content.
            const line = verdict();
            expect(line).toContain('at rest');
            expect(line).toContain('idle, not wedged');
            expect(line).toContain('PARKED clone');
            expect(line).toContain('cures it with a nudge');
          },
        );

        then('COUNTER — the apply BLOCK beneath is untouched', () => {
          // 🔴 defects A and B were cured in the block; this one was in the
          //    verdict above it. a sweep that rewrote both would redden this.
          const block = genAtRestApplyBlock();
          expect(block).toContain('__crew_grove_host');
          expect(block).toContain('nudge NOT sent');
        });
      });

      when(
        '[t3] the pre-fix forms are held against the same assertions',
        () => {
          then('🔴 they go RED — the bite proof', () => {
            const shippedArm =
              '__puri=$(__crew_duct_uri "$grove" "$tree" "$w")';
            expect(shippedArm.includes('__crew_duct_uri "$grove"')).toEqual(
              true,
            );
            expect(shippedArm.includes('__crew_grove_host')).toEqual(false);

            const shippedSend = [
              'if ! duct.send --on "$uri" --anyway --what "$nudge" >/dev/null 2>&1; then',
              '    echo "   └─ 💥 nudge send failed — the wedge stands" >&2',
            ].join('\n');
            expect(shippedSend.includes('>/dev/null 2>&1')).toEqual(true);
            expect(shippedSend.includes('>&2')).toEqual(true);
            expect(shippedSend.includes('uri: $uri')).toEqual(false);
          });
        },
      );
    },
  );
});
