// biome-ignore-all lint/suspicious/noControlCharactersInRegex: a captured pane
// IS a stream of ANSI escapes, so every clamp here must strip them before it
// reads the text. the \u001b is the subject of these regexes rather than a typo
// in them — the rule is a false positive over a terminal-capture corpus.
/**
 * .what = clamps on the ALERT rows — mode-lost, anomaly, ci failed, wake escalation, fulcrum council
 *
 * .note = a PART of the `work.surface` suite, cut so one reviewer can hold
 *         it whole. the suite's shared fixtures, and its account of what it
 *         runs against and why, live in work.surface.harness.ts.
 */
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
   * [case47] — a clone that LOST `--permission-mode acceptEdits` is detected,
   *            surfaced on its own heal axis, and cured without a reboot
   *
   * .why = a permission mode is a LAUNCH flag, never a property of the
   *        conversation. `git.tree.behavior` boots every clone with
   *        `--permission-mode acceptEdits`, so a resume, a reboot, or a
   *        hand-started clone wakes in DEFAULT mode — and from then on draws a
   *        permission modal for EVERY file write.
   *
   *        crewwork already documented the hazard at two sites, and the second
   *        ends with the sentence that names the operator failure verbatim:
   *        "the operator reads that stall as a wedge rather than as a mode it
   *        silently lost."
   *
   *        measured 2026-09-18: one tree was keyed SIX times inside one window.
   *        each key cleared one write; the next write drew the next modal. not
   *        one instrument read the mode, so `--healable` never held the shape
   *        and a byhand key was the only cure on offer — which is precisely
   *        what `rule.forbid.byhand-heal` grades a blocker.
   *
   * .the four properties that carry the whole cure
   *        1. the DISCRIMINATOR is claude's own offer, never an absence. option
   *           2 of an edit modal reads `allow all edits`, and claude prints it
   *           ONLY when the mode is off — positive evidence. the tempting test,
   *           an absent `⏵⏵ accept edits on` footer, is the husk defect exactly
   *           (define.invariant.crew.husk.discriminator-parity): a footer goes
   *           absent on a narrow pane or under any overlay, so its absence
   *           proves the READ rather than the mode.
   *        2. the FACT rides beside the box, never inside a box arm. the first
   *           attempt emitted the row only under `prompt` -> `*)`, so the crew
   *           parser could not depend on it: the suite went green and the real
   *           render did not move by one character
   *           (rule.always.capture-clamp-then-verify-in-prod).
   *        3. the healable screen reads MODE BEFORE STATUS. a mode-lost clone
   *           polls as `at work`, so any arm order that consults status first
   *           drops it on the floor — which is what both predicates did for the
   *           whole of their life.
   *        4. the cure never REBOOTS and never sends option 2. a reboot burns
   *           the live transcript (rule.forbid.byhand-fix-that-burns-the-live-
   *           proof); option 2 is a session-wide GRANT the babysit contract
   *           reserves for a human. so the cure parts the two halves one key
   *           fuses: Escape declines THIS write, BTab restores the mode.
   */
  given(
    '[case47] a mode-lost clone is detected, surfaced, and cured on its own axis',
    () => {
      const readCrewwork = (): string =>
        readCodeWhole(join(DIR_WORK, 'crewwork.sh'));
      const readDuctPoll = (): string =>
        readCode(join(DIR_SKILLS, 'duct.poll.sh'));
      const readCrewPoll = (): string => asCode(readPollWhole());

      /** the cure body alone, so a `duct.reboot` elsewhere in the lib masks no defect here */
      const modeFn = (): string => {
        const src = readCrewwork();
        const start = src.indexOf('__crew_heal_mode() {');
        expect(start).toBeGreaterThan(-1);
        const after = src.indexOf('\n__crew_', start + 1);
        return src.slice(start, after > -1 ? after : undefined);
      };

      when('[t0] the detector is read', () => {
        then('it keys on claude OWN OFFER, never on an absent footer', () => {
          const src = readCodeWhole(join(DIR_WORK, 'ductwork.sh'));
          expect(src.includes('__duct_pane_mode_lost()')).toEqual(true);
          expect(src.includes('allow all edits')).toEqual(true);
        });

        then('it anchors on the STABLE half of that offer', () => {
          // the live pane says `during this session`; the extant fixture at
          // crewwork.pane.integration.test.ts says `in this session`. the words
          // vary by claude version, so a clamp on the whole sentence would go
          // red on an upgrade that broke no property at all.
          const src = readCodeWhole(join(DIR_WORK, 'ductwork.sh'));
          expect(src.includes("grep -an 'allow all edits'")).toEqual(true);
        });

        then('an ANSWERED modal is scrollback, not a live verdict', () => {
          // claude marks its own output with ●, so a bullet BELOW the offer
          // proves the modal was answered and the clone moved on. reused
          // verbatim from __duct_pane_queued_row.
          expect(modeFn().length).toBeGreaterThan(0);
          const src = readCodeWhole(join(DIR_WORK, 'ductwork.sh'));
          const fn = src.slice(src.indexOf('__duct_pane_mode_lost()'));
          expect(fn.includes("grep -q '^[[:space:]]*●' && return 1")).toEqual(
            true,
          );
        });
      });

      when('[t1] the fact row of duct.poll is read', () => {
        then(
          'it rides UNCONDITIONALLY, at the same depth as the QUEUED SEEN fact',
          () => {
            // 🔴 the load-bearing repair, and the DEPTH is what proves it.
            //    a fact row sits at function-body level (a bare two-space `if`) and
            //    renders at the crew-level tree prefix `   └─`. a box-arm copy sits
            //    far deeper and renders at the role-level `      └─`. so the indent
            //    is a structural discriminator, and it bites: move this row into an
            //    arm and both numbers change.
            //
            //    ⚠️ the first attempt emitted ONLY the deep copy, so the crew parser
            //       could not depend on it: the suite went green and the real render
            //       did not move by one character
            //       (rule.always.capture-clamp-then-verify-in-prod).
            const lines = readDuctPoll().split('\n');
            const queued = lines.find((l) =>
              l.includes('if [[ -n "$queuedrow" ]]; then'),
            );
            const mode = lines.find((l) =>
              l.includes('if [[ -n "$modelost" ]]; then'),
            );
            expect(queued).toBeDefined();
            expect(mode).toBeDefined();
            // the extant fact row is the reference depth — no magic number here
            expect(mode!.length - mode!.trimStart().length).toEqual(
              queued!.length - queued!.trimStart().length,
            );
            expect(
              lines.some((l) => l.startsWith('    echo "   └─ 🎛️ MODE LOST')),
            ).toEqual(true);
          },
        );

        then(
          'the prompt arm keeps its OWN copy — two cues that cannot disagree',
          () => {
            // .why = the arm is where a supervisor DECIDES, so the cause belongs
            //        there too. a redundant CUE carries no drift risk, because two
            //        detectors can only both miss or one catch
            //        (rule.require.a-cue-is-not-a-claim).
            const deep = readDuctPoll()
              .split('\n')
              .filter((l) => l.includes('🎛️') && l.includes('MODE LOST'));
            expect(deep.length).toBeGreaterThanOrEqual(2);
          },
        );

        then('the row names the CAUSE and carries a runnable cure', () => {
          const src = readDuctPoll();
          expect(
            src.includes(
              'MODE LOST — this clone dropped --permission-mode acceptEdits',
            ),
          ).toEqual(true);
          expect(
            src.includes(
              'rhx git.crew.heal --tree <tree> --who <role> --what mode',
            ),
          ).toEqual(true);
        });

        then(
          'it says a key clears ONE write — the six-key lesson, in the render',
          () => {
            // .why = the operator who keyed six times was never told the key was
            //        not the cure. the row is where that is cheapest to say.
            expect(
              readDuctPoll().includes(
                'a key clears one write, never the cause',
              ),
            ).toEqual(true);
          },
        );
      });

      when('[t2] the crew join is read', () => {
        then('the fact is parsed off the duct sweep, never re-fetched', () => {
          const src = readCrewPoll();
          expect(src.includes("*'MODE LOST — '*)")).toEqual(true);
          expect(src.includes('__crew_record_modelost')).toEqual(true);
          expect(src.includes('declare -gA CREW_MODELOST=()')).toEqual(true);
        });

        then(
          'both predicates RECEIVE it — the join, never merely the record',
          () => {
            // .why = the record and the join are two separate defects. a fact
            //        parsed and never passed is the shape that made the first cure
            //        inert, so each call site is asserted to carry the argument.
            const src = readCrewPoll();
            expect(src.includes('__crew_is_healable ')).toEqual(true);
            const healable = src
              .split('\n')
              .find((l) => l.includes('__crew_is_healable "$crew_status"'));
            expect(healable).toBeDefined();
            expect(healable!.includes('"$__has_modelost"')).toEqual(true);
            expect(
              src.includes(
                '__crew_heal_axis "$crew_status" "$__has_queuedrow" "$__has_modelost"',
              ),
            ).toEqual(true);
          },
        );
      });

      when('[t3] the arm ORDER of both predicates is read', () => {
        then(
          'is_healable screens mode BEFORE any status arm — the status paradox',
          () => {
            // 🔴 a mode-lost clone polls `at work`. read status first and it is
            //    dropped, silently, which is what both predicates did until now.
            const src = readCrewwork();
            const fn = src.slice(src.indexOf('__crew_is_healable() {'));
            const body = fn.slice(0, fn.indexOf('\n__crew_', 1));
            const modeAt = body.indexOf('[[ -n "$modelost" ]]');
            const statusAt = body.indexOf('"$status"');
            expect(modeAt).toBeGreaterThan(-1);
            expect(statusAt).toBeGreaterThan(-1);
            expect(modeAt).toBeLessThan(statusAt);
          },
        );

        then('heal_axis does the same, so the row and the set agree', () => {
          const src = readCrewwork();
          const fn = src.slice(src.indexOf('__crew_heal_axis() {'));
          const body = fn.slice(0, fn.indexOf('\n__crew_', 1));
          const modeAt = body.indexOf('[[ -n "$modelost" ]]');
          const statusAt = body.indexOf('"$status"');
          expect(modeAt).toBeGreaterThan(-1);
          expect(statusAt).toBeGreaterThan(-1);
          expect(modeAt).toBeLessThan(statusAt);
        });
      });

      when('[t4] the cure is read', () => {
        then('it is a first-class, opt-in --what value', () => {
          expect(
            /all\|work\|view\|seat\|wedge\|mode\)/.test(readCrewwork()),
          ).toEqual(true);
        });

        then('it NEVER reboots — a reboot burns the live transcript', () => {
          expect(modeFn().includes('duct.reboot')).toEqual(false);
          expect(modeFn().includes('crew.reboot')).toEqual(false);
        });

        then(
          'it NEVER sends option 2 — that grant is a human\u2019s alone',
          () => {
            // option 2 grants every edit for the whole session. the babysit
            // contract reserves it, and a tool that sent it under another name
            // would route around the rule rather than honor it.
            const body = modeFn();
            expect(/--keys\s+2\b/.test(body)).toEqual(false);
          },
        );

        then(
          'it parts the two halves one key fuses — Escape, then BTab',
          () => {
            const body = modeFn();
            expect(body.includes('--keys Escape')).toEqual(true);
            expect(body.includes('--keys BTab')).toEqual(true);
          },
        );

        then(
          'each half is VERIFIED by a re-read, never by the send exit code',
          () => {
            // a key send exits 0 on DELIVERY, so its exit proves the keystroke
            // left, never that the mode took (rule.require.verify-after-send).
            const body = modeFn();
            expect(body.includes('__duct_pane_mode_lost "$raw"')).toEqual(true);
            expect(body.includes("grep -qa 'accept edits on'")).toEqual(true);
          },
        );

        then(
          'it gives up LOUD rather than report a cure it did not make',
          () => {
            const body = modeFn();
            expect(body.includes('the modal did not clear on Escape')).toEqual(
              true,
            );
            expect(
              body.includes('the mode would not take after 3 cycles'),
            ).toEqual(true);
          },
        );

        // 🔴 .the NUDGE — added 2026-09-18, after this cure PARKED a clone in prod
        //    the header and the plan text BOTH read "the clone keeps its turn and
        //    retries". measured false on feat-prescribed-brain-per-stone: after
        //    the Escape the pane held an empty ❯ box with no frame — the turn had
        //    ended — and `--healable` then dropped the tree entirely.
        //
        //    ⇒ so the cure restored the mode, PARKED the clone, and reported ✅
        //      over it, which is the one outcome no later tick can find. these
        //      five clamp the repair
        //      (define.invariant.crew.revive-is-incomplete-without-a-nudge).
        then('it NUDGES — a restored mode is not a resumed clone', () => {
          expect(
            modeFn().includes(
              "--what 'your last file write was declined by a MODE CURE",
            ),
          ).toEqual(true);
        });

        then(
          'the nudge lands AFTER the mode verify, at the box it just read',
          () => {
            // a send before the BTab verify would race the mode cycle and land in a
            // box whose state we never read — which this cure otherwise never does
            const body = modeFn();
            const verifyAt = body.indexOf("grep -qa 'accept edits on'");
            const nudgeAt = body.indexOf("--what 'your last file write");
            expect(verifyAt).toBeGreaterThan(-1);
            expect(nudgeAt).toBeGreaterThan(-1);
            expect(verifyAt).toBeLessThan(nudgeAt);
          },
        );

        then(
          'the nudge names the decline MECHANICAL, and steers naught',
          () => {
            // the clone can read a declined write as a HUMAN verdict on its content
            // and re-plan around it. the nudge corrects exactly that, and carries no
            // instruction about the work itself
            // (rule.forbid.steer-a-clone-beyond-a-permission-key)
            const body = modeFn();
            expect(body.includes('never by a human')).toEqual(true);
            expect(body.includes('retry that write as it was')).toEqual(true);
          },
        );

        then(
          'the nudge is VERIFIED by a BOX-scoped re-read, never a wide one',
          () => {
            // 🔴 a SUBMITTED message echoes into the transcript above, so a wide
            //    read would match the nudge's own echo and report a park that never
            //    happened. 6 lines is the box region alone
            //    (rule.require.verify-after-send: compare, never confirm)
            const body = modeFn();
            expect(body.includes('duct.read --on "$uri" --lines 6')).toEqual(
              true,
            );
            expect(body.includes("*'MODE CURE'*")).toEqual(true);
          },
        );

        then('a nudge that PARKS gives up loud, on an rc of its own', () => {
          const body = modeFn();
          expect(body.includes('the nudge PARKED in the box')).toEqual(true);
          expect(body.includes('return 7')).toEqual(true);
        });

        then(
          'the refuted claim is GONE from the header AND the plan text',
          () => {
            // 🔴 the whole-file scope is deliberate: the claim lived in TWO places —
            //    the .why header and the --mode plan render — and a reader who met
            //    either one alone would conclude no nudge was owed
            expect(
              readCrewwork().includes('the clone keeps its turn and retries'),
            ).toEqual(false);
          },
        );
      });

      when('[t5] the healable render is read', () => {
        then('the mode axis gets its OWN row, ahead of the wedge arm', () => {
          const src = readCrewPoll();
          expect(src.includes('"${HEALABLE_AXIS[$__ct]:-}" == "mode"')).toEqual(
            true,
          );
          expect(
            src.includes(
              'rhx git.crew.heal --tree $__ct --who mechanic --what mode --mode apply',
            ),
          ).toEqual(true);
        });

        then('the row says WHY a key is not the cure', () => {
          expect(
            readCrewPoll().includes(
              'a --keys 1 clears ONE write; the next one draws another modal',
            ),
          ).toEqual(true);
        });

        then(
          '🔴 and it names the ORDER — this cure runs BEFORE the modal answer',
          () => {
            /** 🔴 .why = the cure READS the modal. the `shift+tab` affordance that
             *    restores acceptEdits is option 2 OF THE MODAL ITSELF, so a
             *    supervisor who answers the prompt first destroys the very
             *    evidence the heal keys on — and heal then reports `the mode is
             *    intact — no acceptEdits offer on this pane`, which is TRUE about
             *    the pane and false about the clone (term=false-report).
             *
             *  🔴 .measured 2026-09-20 — rhachet-roles-bhrain.beav.feat-acceptance
             *    -under-5min, a ⭐ sponsored star, twice in one tick:
             *      answer-then-heal → `mode is intact`, MODE LOST recurs next write
             *      heal-then-answer → `acceptEdits restored`, loop broken
             *    the tick contract says "on a 🚧prompt, answer it" AND "run each
             *    emitted heal line verbatim"; a row that is BOTH had no stated
             *    order, so the two steps raced and the modal answer won.
             *
             *  ✅ .and the order is SAFE, never merely effective — the cure
             *    DECLINES the unresolved write (`modal cleared — this write was
             *    declined, never granted`) and restores the mode the crew was
             *    BOOTED with. it grants naught, so it never does what key 2 would
             *    (rule.forbid.self-grant-human-gates).
             */
            expect(
              readCrewPoll().includes('run THIS before you answer the modal'),
            ).toEqual(true);
          },
        );
      });
    },
  );

  /**
   * [case61] the ANOMALY remainder must not point at a scope that DROPS it
   *
   * .what = the star scope caps its anomaly list at 5 and declares the
   *         remainder. that cap is correct and measured. what was wrong is
   *         the POINTER it hands the reader for the rest.
   *
   * 🔴 .the defect, measured 2026-09-20 over four consecutive babysit ticks
   *         the remainder line read `… N more — rhx git.crew.poll --all to
   *         read every one`. but the whole anomaly arm — the COUNT and the
   *         RENDER alike — lives inside `if [[ "$STAR" == "true" ]]`, so
   *         `--all` emits no anomaly block at all. a reader who follows the
   *         tool's own instruction receives every tree UNMARKED and no
   *         ⚠️ anywhere, with no tell that the signal was dropped.
   *
   *         ⇒ the remedy the tool named DESTROYED the signal it named it for.
   *           that is `term=false-report` at its most expensive shape: not a
   *           wrong number, but a true-seeming pointer whose destination
   *           contradicts it.
   *
   * .the cost, and why it earns a clamp rather than a note
   *         a supervisor ran `--all` each tick precisely because step 2 of
   *         the babysit contract asks for the whole fleet. so it never once
   *         saw the anomaly block, and reported "september is stalled and no
   *         lever exists" on three consecutive ticks — while the tool held 26
   *         unsponsored INFLIGHT trees, each an off-budget grove slot, which
   *         is the exact lever that verdict denied
   *         (define.invariant.crew.inflight-implies-sponsored).
   *
   * ⚠️ .what this clamp does NOT demand
   *         it does not require `--all` to grow an anomaly block. that cure
   *         is larger and carries its own risk: the arm depends on an
   *         `eco.priority get --output json` read whose 64 KiB truncation
   *         already hard-exits this skill, so to run it under `--all` would
   *         hand `--all` a failure mode it does not have today. the honest
   *         POINTER is the small, clean fix; the wider render is caught at
   *         .dream/v2026_09_20.feat.the-anomaly-block-is-invisible-under-all.md
   *
   *         ⇒ so the clamp grades TRUTHFULNESS, never capability.
   */
  given(
    '[case61] the ANOMALY remainder points at a surface that still marks it',
    () => {
      const readPoll = (): string => asCode(readPollWhole());
      const anomArm = (src: string): string => {
        const at = src.indexOf(
          '⚠️  ANOMALY: ${STAR_ANOMALY} unsponsored tree(s) are INFLIGHT',
        );
        expect(at).toBeGreaterThan(-1); // ANTI-VACUITY: the block still exists
        // ⚠️ the bound is a CODE line, never a comment — `readCode` strips
        //    comments, so a comment anchor returns -1 and the arm never forms
        const end = src.indexOf('__unreached_asleep=()', at);
        expect(end).toBeGreaterThan(at); // ANTI-VACUITY: bounded by its successor
        return src.slice(at, end);
      };

      when('[t0] the remainder line is read', () => {
        const arm = anomArm(readPoll());

        then(
          '🔴 it does NOT promise `--all` as the way to read every anomaly',
          () => {
            // the false pointer, verbatim as it shipped
            expect(
              arm.includes('rhx git.crew.poll --all to read every one'),
            ).toEqual(false);
          },
        );

        then('and it says outright that `--all` marks NO anomaly', () => {
          // the reader must learn the drop from the tool, never from a lost tick
          expect(arm).toContain('--all');
          expect(arm).toMatch(/NO anomaly block/);
        });
      });

      when('[t1] a reader still wants the set the cap withheld', () => {
        const arm = anomArm(readPoll());

        then(
          'the row hands them a surface where sponsorship is actually held',
          () => {
            expect(arm).toContain('rhx eco.priority get');
          },
        );
      });

      /**
       * 🔴 [t2] — the regression guard on the CURE, not on the defect
       *
       *   the edit that fixes a pointer is exactly the edit that deletes a
       *   feature by accident. the three claims the block existed for are
       *   pinned here, at the surface under edit.
       */
      when('[t2] the cure is held against what the block guaranteed', () => {
        const arm = anomArm(readPoll());

        then('the COUNT survives — the anomaly is never silent', () => {
          expect(arm).toContain(
            '${STAR_ANOMALY} unsponsored tree(s) are INFLIGHT',
          );
        });

        then(
          'the per-tree move survives — a tool guides, never merely classifies',
          () => {
            expect(arm).toContain('rhx git.crew.fell --tree $__t');
          },
        );

        then('and the CAP survives — the report stays scannable', () => {
          expect(arm).toContain('__anom_shown < 5');
        });
      });
    },
  );

  /**
   * .what = the ✋ CI FAILED row hands a supervisor a READ, never a SEND
   *
   * .why  = the channel to a clone carries exactly THREE sends — a permission
   *        KEY, "release into prod", and the relay of a gate a human just
   *        granted (rule.forbid.steer-a-clone-beyond-a-permission-key).
   *
   *        this row emitted a fourth until 2026-09-21:
   *        `rhx git.crew.send --tree $t --who mechanic --what 'rhx
   *        show.gh.test.errors'` — a free-text steer.
   *
   * 🔴 .the harm = the TOOL prescribed an act its own reader may not perform.
   *        that is worse than a bare count: a count admits it is not a cure,
   *        where a runnable forbidden command reads as sanctioned by the tool
   *        (term=false-report). measured 2026-09-21 — a tick met this row, and
   *        the decline cost a read of the rule to be sure the tool was wrong
   *        rather than the reader.
   *
   * ⚠️ and the payload was wrong besides: `rhx show.gh.test.errors` reads the
   *        CWD's repo, and a failed tree is almost always in another one.
   */
  given(
    '[case62] the CI FAILED row names a READ, never a send into the clone',
    () => {
      const readPoll = (): string => asCode(readPollWhole());

      /**
       * ⚠️ SLICED to the failed-tree emitter — `rhx git.crew.send` appears many
       *   times elsewhere in this file, so a bare `not.toContain` over the whole
       *   source passes over the shipped defect and clamps naught.
       *
       *   both bounds are CODE lines. `readCode` strips `#` comments, so a
       *   comment anchor returns -1 and the arm never forms.
       */
      const failedArm = (): string => {
        const src = readPoll();
        const at = src.indexOf('for __ft in "${FAILED_TREES[@]:-}"; do');
        expect(at).toBeGreaterThan(-1); // ANTI-VACUITY: the emitter still exists
        const end = src.indexOf('for __ct in "${FELLABLE_TREES[@]:-}"; do', at);
        expect(end).toBeGreaterThan(at); // ANTI-VACUITY: bounded by its successor
        return src.slice(at, end);
      };

      when('[t0] the emitted row is read', () => {
        then('🔴 it issues NO send into the clone', () => {
          expect(failedArm()).not.toContain('rhx git.crew.send');
        });

        then(
          '🔴 and it does not hand over `show.gh.test.errors`, which reads the WRONG repo',
          () => {
            expect(failedArm()).not.toContain('show.gh.test.errors');
          },
        );
      });

      when('[t1] the cure is read', () => {
        then(
          "it names a read the SUPERVISOR can run, in the failed tree's own repo",
          () => {
            const arm = failedArm();
            expect(arm).toContain('gh pr checks');
            // BOTH operands derived from the ref — a bare `gh pr checks` would
            // aim at the cwd repo, which is the defect it replaced
            expect(arm).toContain('${__fref##*#}'); // the pr number
            expect(arm).toContain('${__fref%%#*}'); // the org/repo
          },
        );

        then('and it states outright that the row is not a send', () => {
          const arm = failedArm();
          expect(arm).toContain('do NOT send');
          expect(arm).toMatch(/DRIVER/);
        });
      });

      /**
       * 🔴 [t2] — the regression guard on the CURE, not on the defect
       *
       *   the edit that swaps a remedy is exactly the edit that drops the row's
       *   subject by accident. the two claims the row existed for are pinned
       *   here: it NAMES the tree (never a bare count), and it carries the ref.
       */
      when('[t2] the cure is held against what the row guaranteed', () => {
        then(
          'the tree NAME survives — a count with no subject is not actionable',
          () => {
            expect(failedArm()).toContain('$__ftree');
          },
        );

        then('the pr ref survives, so the reader need not re-derive it', () => {
          expect(failedArm()).toContain('$__fref');
        });

        then(
          'and the glyph and label survive, so the row still sorts as failed',
          () => {
            expect(failedArm()).toContain('✋ CI FAILED');
          },
        );
      });

      when('[t3] the legend at the head of the file is read', () => {
        then('🔴 it no longer prescribes the CWD-bound remedy either', () => {
          // the legend is PROSE, so `read` rather than `readCode`
          const legend = readPollWhole()
            .split('\n')
            .find((l) => l.includes('ci failed'));
          expect(legend).toBeDefined();
          expect(legend).not.toContain('show.gh.test.errors');
        });
      });
    },
  );

  /**
   * 🌙 [case63] — `git.grove.wake`'s ssm-timeout escalation
   *
   *   measured 2026-09-21, tick 19. the escalation ended on
   *
   *     rhx aws.ec2.get --tag exid=$EXID --ssm --env $ENV
   *
   *   and that skill is in NO linked role — `rhx` exits 2 with
   *   `no skill "aws.ec2.get" found`. ⇒ an error that names a fix which
   *   cannot run is `term=false-report` at its most expensive: the reader
   *   spends the call, and learns only that the instrument lied.
   *
   *   🔴 and the skill ALREADY RUNS the real read, at the probe loop above
   *   the block. so it pointed at a phantom while it held the genuine
   *   command in its own hand.
   *
   *   the second half of the same defect: the block stated ONE cause
   *   (hibernate needs longer) and one cure (wake again). september was
   *   STARVED — thrashed under load, so its agent never got serviced — and
   *   there a second wake cures naught and costs another timeout window.
   *   two causes with OPPOSITE cures, told apart by MUTE-vs-DOWN.
   */
  given(
    '[case63] the wake escalation names a runnable read and BOTH causes',
    () => {
      /**
       * ⚠️ SLICED to the escalation block. both bounds are CODE lines —
       *   `readCode` strips whole-line `#` comments, so a comment anchor
       *   returns -1 and the arm never forms.
       */
      const escalation = (): string => {
        const src = readCode(join(DIR_SKILLS, 'git.grove.wake.sh'));
        const at = src.indexOf('if [[ "$SSM_READY" != "true" ]]; then');
        expect(at).toBeGreaterThan(-1); // ANTI-VACUITY: the block still exists
        const end = src.indexOf('ssm  Online', at);
        expect(end).toBeGreaterThan(at); // ANTI-VACUITY: bounded by its successor
        return src.slice(at, end);
      };

      when('[t0] the fix it hands over is read', () => {
        then(
          '🔴 it no longer names `aws.ec2.get`, a skill no linked role holds',
          () => {
            expect(escalation()).not.toContain('aws.ec2.get');
          },
        );

        then(
          '🔴 and the phantom is absent from the WHOLE skill, not merely this arm',
          () => {
            expect(
              readCode(join(DIR_SKILLS, 'git.grove.wake.sh')),
            ).not.toContain('aws.ec2.get');
          },
        );

        then('it hands over the ssm read directly', () => {
          expect(escalation()).toContain(
            'aws ssm describe-instance-information',
          );
        });

        /**
         * 🔴 the strongest tooth here. the remedy is real BY CONSTRUCTION when
         *   it is the same call the skill's own probe loop makes — a phantom
         *   cannot satisfy this, and a typo in the verb cannot either.
         */
        then(
          '🔴 and that read is the one the probe loop itself already runs',
          () => {
            const src = readCode(join(DIR_SKILLS, 'git.grove.wake.sh'));
            const arm = escalation();
            const probe = src.slice(0, src.indexOf(arm));
            expect(probe).toContain('aws ssm describe-instance-information');
          },
        );
      });

      when('[t1] the causes are read', () => {
        then(
          '🔴 it names the STARVED cause, which the prior block omitted',
          () => {
            expect(escalation()).toContain('STARVED');
          },
        );

        then(
          '🔴 and it states outright that the two cures are opposite',
          () => {
            expect(escalation()).toContain('OPPOSITE');
          },
        );

        then(
          'it names the tell that parts them — MUTE rather than DOWN',
          () => {
            const arm = escalation();
            expect(arm).toContain('MUTE');
            expect(arm).toContain('DOWN');
            expect(arm).toContain('rhx git.grove.list');
          },
        );

        then(
          'and it routes the starved case to LOAD, never to another wake',
          () => {
            const arm = escalation();
            expect(arm).toContain('rhx git.grove.saturation');
            expect(arm).toMatch(/PROVISION/);
          },
        );
      });

      /**
       * 🔴 [t2] — the guard on the CURE, not on the defect
       *
       *   an edit that adds a second cause is exactly the edit that drops the
       *   FIRST one by accident. the hibernate path is the common case and the
       *   one this block was written for; it is pinned here.
       */
      when('[t2] the cure is held against what the block guaranteed', () => {
        then(
          'the hibernate cause survives, with its idempotent re-wake',
          () => {
            const arm = escalation();
            expect(arm).toContain('hibernate');
            expect(arm).toContain('rhx git.grove.wake $GROVE');
          },
        );

        then(
          'and it still fails loud — a timeout is never a silent pass',
          () => {
            expect(escalation()).toContain('exit 1');
          },
        );
      });
    },
  );

  /**
   * 🔴 [case64] — a FULCRUM COUNCIL is a human gate the PLEA chain cannot see
   *
   *   measured 2026-09-21, tick 69, on
   *   `rhachet-roles-bhrain.beav.feat-acceptance-under-5min`. the crew row read
   *
   *     ✋ blocked:on-defect · still 256m
   *
   *   — the DRIVER's own — while the pane held, verbatim:
   *
   *     The round is closed. The stone waits on four wisher calls, F10 first:
   *     │ 1 │ F10 │ 🔴 SAFETY │ should protect: survive a descent? │
   *     When you rule, I reprobe F10's own gate
   *
   *   ⇒ four open wisher calls, one of them a stated SAFETY question, routed
   *   to the wrong owner for over four hours.
   *
   * 🔴 .and the miss is STRUCTURAL, never an anchor drawn a shade too tight.
   *   the plea detector keys on a runnable grant COMMAND —
   *   `route.stone.set … --as approved|overruled` — and that anchor IS the
   *   row's value: the render prints the command so a supervisor can date it
   *   against the rendered stone ([case33]). a council prints NO command. it
   *   tables its open calls and stops. so there is naught for the plea chain
   *   to key on, at any tightness, and a widened plea anchor would print prose
   *   where a runnable command is promised.
   *
   *   ⇒ so the cure is a PEER detector, and this case clamps the whole chain
   *   it must traverse — detector, slot write, slot read, FACT row, crew parse
   *   arm, recorder, map, ladder arm, row annotation, ACTIONS row. the lesson
   *   of the plea's own clamp is that an UNJOINED detector is worse than an
   *   absent one: it reads as coverage from the layer that emits it and
   *   provides none at the layer that decides.
   */
  given(
    '[case64] a fulcrum council is detected, joined, and routed to the HUMAN',
    () => {
      const readDuctPoll = (): string =>
        readCode(join(DIR_SKILLS, 'duct.poll.sh'));
      const readCrewPoll = (): string => asCode(readPollWhole());

      /**
       * ⚠️ the VERBATIM capture, never a hand-typed shape. a hand-typed fixture
       *   is the author's MODEL of the pane, and the model is the suspect
       *   (rule.always.clamp-the-verbatim-pane-your-classifier-judged).
       */
      const pane = (): string =>
        read(
          join(
            DIR_WORK,
            '.test/.assets/pane.council.fulcrum-awaits-a-wisher-verdict.log',
          ),
        )
          // ANSI strip — see the biome-ignore-all at the head of this file
          .replace(/\u001b\[[0-9;?]*[A-Za-z]/g, '');

      /**
       * the shell arm, transcribed. it is held against the source at [t2], so a
       * later edit there cannot drift this silently.
       */
      const COUNCIL = (text: string): string => {
        const flat = text.replace(/\n/g, ' ');
        const wait = flat.match(
          /(waits|awaits) on [^|]{0,40}(wisher|fulcrum)[a-z]*( calls?| verdicts?| decisions?)?/g,
        );
        // a non-null match set always holds its last entry, so the `?? ''` is a
        // type-level statement rather than a new case — and '' is already what
        // this arm returns when it finds no clause at all
        if (wait) return wait[wait.length - 1] ?? '';
        const rule = flat.match(/[Ww]hen you rule/g);
        return rule ? (rule[rule.length - 1] ?? '') : '';
      };

      when('[t0] the captured pane is read', () => {
        then(
          '🔴 it holds BOTH shapes — the wait clause and the rule clause',
          () => {
            const p = pane();
            expect(p).toContain('waits on four wisher calls');
            expect(p).toContain('When you rule');
          },
        );

        then(
          'and it carries NO grant command, which is what blinds the plea chain',
          () => {
            expect(pane()).not.toMatch(
              /route\.stone\.set[^\n]*--as\s*(approved|overruled)/,
            );
          },
        );

        then(
          'and its stone renders `blocked ✋` — the row the ladder got honestly wrong',
          () => {
            expect(pane()).toContain('blocked ✋');
          },
        );
      });

      when('[t1] the transcribed arm is run over it', () => {
        then('🔴 it fires, and returns the clause a human can act on', () => {
          expect(COUNCIL(pane())).toContain('wisher');
        });

        /**
         * 🔴 the sharpest negative. a bare `wisher` or `blocked` would match half
         *   the fleet's scrollback, so the 40-char bound between the wait verb
         *   and the noun carries real weight rather than tidiness.
         */
        then(
          '🔴 and a bare mention of a wisher, with no wait clause, does NOT',
          () => {
            expect(
              COUNCIL('the wisher briefs say a driver owns its own budget'),
            ).toEqual('');
          },
        );

        then(
          'nor does an ordinary blocked stone with no council at all',
          () => {
            expect(
              COUNCIL('🗿 5.1.execution, review.peer, l3@i007, blocked ✋'),
            ).toEqual('');
          },
        );

        /**
         * 🔴 the RANK, and this tooth is why the clamp was worth its own case.
         *   a clone prints the wait clause FIRST and the rule clause LAST, so a
         *   single alternation closed with `tail -n 1` returns the least
         *   informative of the two — the protocol, never the count. the first
         *   cut did exactly that and this tooth went red on it.
         */
        then(
          '🔴 the WAIT clause wins over the RULE clause — the row owes the human the COUNT',
          () => {
            const picked = COUNCIL(pane());
            expect(picked).toContain('four wisher calls');
            expect(picked).not.toEqual('When you rule');
          },
        );

        then(
          'and the rule clause is still the FALLBACK, for a wait clause that wrapped',
          () => {
            expect(COUNCIL('When you rule, I reprobe F10 own gate')).toEqual(
              'When you rule',
            );
          },
        );
      });

      when('[t2] the chain it must traverse is read, layer by layer', () => {
        then('the detector is the pattern this case transcribes', () => {
          const src = readDuctPoll();
          expect(src).toContain('councilask="$(printf');
          expect(src).toContain('(waits|awaits) on [^|]{0,40}(wisher|fulcrum)');
          expect(src).toContain('[Ww]hen you rule');
        });

        /**
         * 🔴 the RANK, in the SOURCE — the transcribed arm above proves the
         *   behavior, and this proves the shell still spells it the same way. a
         *   re-merge into one alternation is the exact edit that would restore
         *   the defect [t1] caught, and it would leave the transcription green.
         */
        then(
          '🔴 and the two anchors stay RANKED, never re-merged into one alternation',
          () => {
            const src = readDuctPoll();
            expect(src).toContain(
              '[[ -n "$councilask" ]] || councilask="$(printf',
            );
            expect(src).not.toContain(
              '(wisher|fulcrum)[a-z]*( calls?| verdicts?| decisions?)?|[Ww]hen you rule',
            );
          },
        );

        /**
         * 🔴 the SLOT round trip. duct.poll forks a subshell per duct and hands
         *   its findings back through `$tmpdir/$slot.*` — a detector that writes
         *   no slot computes a fact the parent never receives (the same round
         *   trip [case31] pinned for ratelimit).
         */
        then(
          '🔴 it round-trips through the tmpdir, so the parent actually receives it',
          () => {
            const src = readDuctPoll();
            expect(src).toContain(
              'echo "${councilask:-}" > "$tmpdir/$slot.councilask"',
            );
            expect(src).toContain(
              'councilask="$(cat "$tmpdir/$slot.councilask"',
            );
          },
        );

        /**
         * ⚠️ SEEN, never AWAITS — the claim every peer FACT row makes. the clause
         *   lives in scrollback, so a council the wisher has since answered still
         *   carries it (term=false-report).
         */
        then('it renders a FACT row, SEEN rather than AWAITS', () => {
          const src = readDuctPoll();
          expect(src).toContain('🗳️ council SEEN — ');
          expect(src).not.toContain('🗳️ council AWAITS');
        });

        then(
          '🔴 the crew poll JOINS that row — an unjoined detector is worse than none',
          () => {
            const src = readCrewPoll();
            expect(src).toContain("*'council SEEN'*)");
            expect(src).toContain(
              '__crew_record_councilask "$uri_block" "$line"',
            );
          },
        );

        /**
         * the same guard [case33] proved for the plea: a bare `${line#*…}` on an
         * unmarked row returns the row WHOLE, so the advisory tail would render
         * as though the clone had typed it.
         */
        then('the marker is tested on the ROW before any strip', () => {
          const src = readCrewPoll();
          const guardAt = src.indexOf("*'council SEEN — '*)");
          const stripAt = src.indexOf('clause="${line#*council SEEN — }"');
          expect(guardAt).toBeGreaterThan(0);
          expect(stripAt).toBeGreaterThan(0);
          expect(guardAt).toBeLessThan(stripAt);
        });

        then('the map survives the scope filter, like every peer map', () => {
          const src = readCrewPoll();
          expect(src).toContain('declare -gA CREW_COUNCILASK=()');
          expect(src).toContain("unset 'CREW_COUNCILASK[$__k]'");
        });
      });

      when(
        '[t3] the VERDICT it produces is read — the half that moves the render',
        () => {
          then(
            '🔴 it reaches the status ladder, and lands on the HUMAN',
            () => {
              const src = readCrewPoll();
              expect(src).toContain(
                '[[ -n "${CREW_COUNCILASK[$(__crew_canon "$tree")]:-}" ]] && __has_councilask=1',
              );
              expect(
                /-n "\$__has_councilask" \]\];\s*then crew_status="blocked:on-human"/.test(
                  src,
                ),
              ).toEqual(true);
            },
          );

          /**
           * 🔴 the ORDER, and it is the whole reason the annotation exists. an
           *   explicit `blocked ✋` OUTRANKS this arm on purpose — the safe error
           *   is the one that lands on the supervisor — and the measured pane
           *   carries exactly that stone. so without the annotation the cure is
           *   INERT on the very row it was written for
           *   (rule.always.capture-clamp-then-verify-in-prod).
           */
          then(
            '🔴 `blocked ✋` still outranks it — and the annotation is what keeps it visible',
            () => {
              const src = readCrewPoll();
              const stoneAt = src.indexOf('*"blocked ✋"*');
              const councilAt = src.indexOf('-n "$__has_councilask" ]];');
              expect(stoneAt).toBeGreaterThan(0);
              expect(councilAt).toBeGreaterThan(stoneAt);
              expect(src).toContain('__plea_s+=" · 🗳️council"');
            },
          );

          then(
            'the annotation fires exactly where the status did not absorb it',
            () => {
              const src = readCrewPoll();
              expect(
                src.includes(
                  '[[ -n "$__has_councilask" && "$crew_status" != "blocked:on-human" ]] && __plea_s+=" · 🗳️council"',
                ),
              ).toEqual(true);
            },
          );

          /**
           * 🔴 a council carries no `--stone`, so the plea's FRESH/STALE machine
           *   has naught to key on — and a row must not author a verdict its tool
           *   cannot compute (rule.forbid.fabricated-opines' shape).
           */
          then(
            '🔴 the ACTIONS row names a READ to date it, never a fabricated freshness',
            () => {
              const src = readCrewPoll();
              expect(src).toContain('🗳️ COUNCIL SEEN — ');
              const at = src.indexOf('🗳️ COUNCIL SEEN — ');
              const row = src.slice(at, at + 400);
              expect(row).toContain('read the pane');
              expect(row).not.toContain('FRESH');
              expect(row).not.toContain('STALE');
            },
          );

          then(
            'and it names the OWNER outright — a verdict, never a grant command',
            () => {
              const src = readCrewPoll();
              const at = src.indexOf('🗳️ COUNCIL SEEN — ');
              const row = src.slice(at, at + 400);
              expect(row).toContain('wisher VERDICT');
              expect(row).toContain('never a grant command');
            },
          );

          /**
           * 🔴 the clause arrives ALREADY quoted — duct.poll renders it as
           *   `council SEEN — "…"` and the recorder keeps the quotes with it. the
           *   cure's FIRST prod run printed `""waits on four wisher calls""`,
           *   caught by step 3 rather than by any green suite
           *   (rule.always.capture-clamp-then-verify-in-prod). the plea row takes
           *   `${__pcmd}` bare for the identical reason.
           */
          then(
            '🔴 and it does NOT re-quote a clause that already carries its quotes',
            () => {
              const src = readCrewPoll();
              expect(src).toContain('FULCRUM COUNCIL: ${__cclause} —');
              expect(src).not.toContain('FULCRUM COUNCIL: \\"${__cclause}\\"');
            },
          );
        },
      );

      /**
       * 🔴 [t4] — the guard on the NEIGHBOUR, not on the cure
       *
       *   this case adds a detector beside the plea's, in the same case arm, the
       *   same slot block, the same ladder, the same footer. the edit most likely
       *   to break is the one that drops a plea arm on the way past.
       */
      when('[t4] the PLEA chain it was built beside is held intact', () => {
        then('the plea detector, its slot, and its row all survive', () => {
          const src = readDuctPoll();
          expect(src).toContain(
            'route\\.stone\\.set[^\\";]{0,200}--as[[:space:]]*(approved|overruled)',
          );
          expect(src).toContain('echo "${plea:-}" > "$tmpdir/$slot.plea"');
          expect(src).toContain('🙋 plea SEEN — ');
        });

        then(
          'and the plea join, its ladder arm, and its freshness verdict survive',
          () => {
            const src = readCrewPoll();
            expect(src).toContain('__crew_record_plea "$uri_block" "$line"');
            expect(src).toContain('-n "$__has_plea" ]];');
            expect(src).toContain('✅ FRESH — ');
            expect(src).toContain('⚠️ STALE — ');
          },
        );
      });
    },
  );
});
