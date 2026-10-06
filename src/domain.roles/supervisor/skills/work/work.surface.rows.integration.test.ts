/**
 * .what = clamps on the poll ROWS — queued, plea, parked, turn-ended, prompt, release, phantom, footers
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
  readCode,
  readPollWhole,
} from './work.surface.harness';

describe('work.surface', () => {
  /**
   * [case32] — a 📬queued box REFUTES `unread` on its own tree (task #49)
   *
   * .why = ONE poll render carried both of these lines, measured 2026-09-15 on
   *        rhachet-roles-bhrain.beav.feat-dispute-or-concede-review-budget:
   *
   *          ├─ 😴 unread — …feat-dispute-or-concede-review-budget
   *          ├─ 📬queued × 1 — state is not `empty`, so no stone renders
   *          │     └─ …feat-dispute-or-concede-review-budget / mechanic
   *
   *        so the poll KNEW the box was `📬queued` and labelled the tree
   *        `😴 unread` anyway. the two cannot both hold: `unread` is a claim
   *        about the READ (term=duct.box.unread — "the capture was empty"),
   *        and a queued box is a message the poll READ, already submitted, for
   *        a busy clone to pick up (term=duct.box.inflight). it is the one box
   *        state that cannot be unread.
   *
   * .the harm = the label erases the one distinction a supervisor acts on.
   *        `😴 unread` invites a drill-in and a nudge; the tick contract says
   *        of a queued box "⛔ leave it, the clone drains it" — an Enter there
   *        lands in the EMPTY box beneath the queued row, a recorded harm.
   *        verified minutes later: the queue HAD drained and the clone was live,
   *        at work on the very file the queued message named.
   *
   * .why THIS cure and not the pane-tense one
   *        the contradiction is between two values the poll ALREADY computed,
   *        in ONE pass. no pane parse, no token counter, no tense analysis, no
   *        second poll to diff. and unlike the stone-iteration delta it has no
   *        blind spot — a static iteration says naught about liveness, while
   *        the box state is read every pass.
   *
   * .the bound = it must sit BELOW every positive verdict. a queued box says
   *        the clone is busy; it must NEVER overturn a prompt, a husk, a cap, a
   *        human gate, or a plea. "busy beneath a gate" is still the gate's.
   */
  given(
    '[case32] a 📬queued box refutes `unread` — the poll may not contradict itself',
    () => {
      const readCrewPoll = (): string => asCode(readPollWhole());

      when('[t0] the crew_status ladder is read', () => {
        then('an arm folds a 📬queued box to inflight', () => {
          const src = readCrewPoll();
          expect(
            /\$__boxes_s" == \*"📬queued"\* \]\];\s*then crew_status="inflight"/.test(
              src,
            ),
          ).toEqual(true);
        });

        then(
          '🔴 it sits ABOVE the unread arm — the invariant `box == queued ⟹ tree != unread`',
          () => {
            const src = readCrewPoll();
            const queuedAt = src.indexOf('*"📬queued"*');
            const unreadAt = src.indexOf(
              '-n "$__all_unread" || -n "$__any_unread"',
            );
            expect(queuedAt).toBeGreaterThan(0);
            expect(unreadAt).toBeGreaterThan(0);
            expect(queuedAt).toBeLessThan(unreadAt);
          },
        );

        then(
          'it sits BELOW every positive verdict — a queued box overturns no gate',
          () => {
            const src = readCrewPoll();
            // 🔴 key on the LIVE arm by its VERDICT, never on the first `📬queued`
            //    literal in the file. two arms read that box now, and they make
            //    opposite claims:
            //      turn ENDED + queued -> frozen    (the clone is STOPPED)
            //      queued, turn live   -> inflight  (the clone is BUSY)
            //    this bound belongs to the second one alone. `.the bound` above
            //    argues it in the clone's own words — "a queued box says the clone
            //    is busy" — and that sentence is FALSE once the turn has ended, so
            //    the rule it justifies cannot reach the ended arm.
            //    an indexOf on the bare literal silently re-aimed this assertion at
            //    the ended arm the moment that arm was added above.
            const queuedAt = src.search(
              /\$__boxes_s" == \*"📬queued"\* \]\];\s*then crew_status="inflight"/,
            );
            expect(queuedAt).toBeGreaterThan(0);
            // a live prompt, a dead mechanic, a cap, a stone gate, and a plea each
            // outrank "the clone is busy" — the queued arm may not absorb any of them
            expect(src.indexOf('*"🚧prompt"*')).toBeLessThan(queuedAt);
            expect(src.indexOf('*"mechanic:shell"*')).toBeLessThan(queuedAt);
            expect(src.indexOf('-n "$__has_ratelimit"')).toBeLessThan(queuedAt);
            expect(src.indexOf('*"exhausted"*')).toBeLessThan(queuedAt);
            expect(src.indexOf('*"route complete"*')).toBeLessThan(queuedAt);
            expect(src.indexOf('-n "$__has_plea"')).toBeLessThan(queuedAt);
          },
        );

        then(
          '🔴 but the turn-ENDED join outranks the stone gate — the opposite bound',
          () => {
            // 🔴 the two arms read one box and take opposite ranks, and each rank is
            //    earned by the same argument read in opposite directions.
            //
            //    "busy beneath a gate is still the gate's" holds while a turn runs,
            //    because the clone progresses under it. once the turn ends it
            //    progresses not at all — it is stopped in front of a message that,
            //    on the measured case, was the very answer that opens its gate. so
            //    the stillness is the more urgent fact, and it must be graded first.
            //
            //    measured 2026-09-16: the ended arm shipped BELOW `blocked ✋`, and
            //    since a clone ends its turn to ask a human precisely when it is
            //    gated, the arm was unreachable for its entire target population.
            const src = readCrewPoll();
            const endedAt = src.indexOf(
              '-n "$__has_turnended" && ( "$__boxes_s" == *"📬queued"*',
            );
            expect(endedAt).toBeGreaterThan(0);
            // ABOVE every STONE arm — the route's record does not outrank liveness
            expect(endedAt).toBeLessThan(src.indexOf('*"blocked ✋"*'));
            expect(endedAt).toBeLessThan(src.indexOf('*"exhausted"*'));
            // and still BELOW every PANE arm — each of those names a sharper cure
            expect(src.indexOf('*"🚧prompt"*')).toBeLessThan(endedAt);
            expect(src.indexOf('*"mechanic:shell"*')).toBeLessThan(endedAt);
            expect(src.indexOf('-n "$__has_ratelimit"')).toBeLessThan(endedAt);
            expect(src.indexOf('-n "$__has_escalation"')).toBeLessThan(endedAt);
          },
        );

        then(
          '🔴 it goes RED against the pre-fix ladder — the bite proof',
          () => {
            // the ladder before this cure: the frozen arm, then the unread arm, with
            // no queued arm between them. a collapse that drops the queued arm must
            // NOT still satisfy the invariant above.
            const before = [
              '  elif [[ "$crew_state" != "at work" ]];                   then crew_status="frozen"',
              '  elif [[ -n "$__all_unread" || -n "$__any_unread" ]];     then crew_status="unread"',
            ].join('\n');
            expect(
              /\$__boxes_s" == \*"📬queued"\* \]\];\s*then crew_status="inflight"/.test(
                before,
              ),
            ).toEqual(false);
          },
        );
      });

      when('[t1] the box value the arm keys on is read', () => {
        then(
          'the queued box literal the arm matches is the one the fold emits',
          () => {
            // .teeth = the arm is a string match, so a rename of the box value in
            //          the fold silently disarms it. assert both halves name the
            //          SAME literal, so the pair cannot drift apart.
            const src = readCrewPoll();
            expect(/\*'QUEUED'\*\)\s+box="📬queued"/.test(src)).toEqual(true);
            expect(src.includes('*"📬queued"*')).toEqual(true);
          },
        );
      });
    },
  );

  /**
   * [case33] — the PLEA row carries the grant command it was raised on (task #82)
   *
   * .why = duct.poll reads the grant command out of the pane and renders it
   *        verbatim on its own row:
   *
   *          └─ 🙋 plea SEEN — "rhx route.stone.set --stone 5.1 --as overruled" (scrollback; …)
   *
   *        the crew layer joined that row, kept the ROLE, and threw the command
   *        away. so the fleet action read:
   *
   *          🙋 PLEA SEEN — …/foreman printed a HUMAN-only grant command. read it, then relay
   *
   *        which names a human gate and withholds the one field that DATES it.
   *
   * .the harm = a plea is a proxy off SCROLLBACK, so it carries a known
   *        false-positive rate (term=false-report). measured:
   *          2026-09-12 — 7 of 7 flagged pleas in one tick were already resolved
   *          2026-09-14 — 2 more, both foreman panes, both grants for stone 5.1,
   *                       whose mechanic had already moved on to 5.3.verification
   *        every one cost a full `crew.read` round trip to rule out by hand — and
   *        the round trip is paid on the true ones and the stale ones alike.
   *        with `--stone 5.1` rendered beside a stone of `5.3.verification` two
   *        rows above, the 2026-09-14 pair is refuted with no drill-in at all.
   *
   * .why THIS cure ranks first on task #82
   *        the datum was ALREADY read and ALREADY parsed one layer down, so the
   *        cure moves a value rather than adds a parse — the shape this file
   *        guards elsewhere as a verdict rendered without the evidence its own
   *        renderer holds (term=partial-audit). and it is the PREREQUISITE for
   *        any evidence-based repair of the detector itself: the crew layer
   *        cannot be shown WHICH string matched while it discards that string.
   *
   * .the bound = it adds EVIDENCE, never authority. the row still reads SEEN,
   *        never AWAITS, and still ends `never self-grant`. and a row whose
   *        command cannot be parsed must DEGRADE to the prior form — a human
   *        gate is never dropped for lack of its annotation. fail-safe is SHOW.
   */
  given(
    '[case33] the PLEA row carries the grant command, so a stale ask is refutable from the sweep',
    () => {
      const readCrewPoll = (): string => asCode(readPollWhole());

      when('[t0] the plea recorder is read', () => {
        then('it accepts the duct.poll ROW, not the uri alone', () => {
          const src = readCrewPoll();
          expect(
            /__crew_record_plea\(\)\s*\{\s*\n\s*local uri="\$1" line="\$\{2:-\}"/.test(
              src,
            ),
          ).toEqual(true);
        });

        then('the join passes that row through', () => {
          const src = readCrewPoll();
          expect(
            src.includes('__crew_record_plea "$uri_block" "$line"'),
          ).toEqual(true);
        });

        then(
          '🔴 it stores role=command, so the render can join both halves',
          () => {
            const src = readCrewPoll();
            expect(
              src.includes(
                'CREW_PLEA["$(__crew_canon "$tree")"]+="${role}=${cmd}"',
              ),
            ).toEqual(true);
          },
        );

        then(
          'the marker is tested on the ROW before any strip — else advisory prose renders as the command',
          () => {
            // .teeth = a bare `${line#*plea SEEN — }` on a row that holds no marker
            //          returns the row WHOLE, so the parenthetical advisory text
            //          would be rendered as though the clone had typed it.
            const src = readCrewPoll();
            const guardAt = src.indexOf(
              'case "$line" in\n    *\'plea SEEN — \'*)',
            );
            const stripAt = src.indexOf('cmd="${line#*plea SEEN — }"');
            expect(guardAt).toBeGreaterThan(0);
            expect(stripAt).toBeGreaterThan(0);
            expect(guardAt).toBeLessThan(stripAt);
          },
        );
      });

      when('[t1] the PLEA action row is read', () => {
        then('it splits role from command and renders the command', () => {
          const src = readCrewPoll();
          expect(src.includes('__prole="${__pr%%=*}"')).toEqual(true);
          expect(src.includes('__pcmd="${__pr#*=}"')).toEqual(true);
          expect(src.includes('printed a HUMAN-only grant: ${__pcmd}')).toEqual(
            true,
          );
        });

        then(
          '🔴 it COMPUTES the --stone freshness rather than send a human to eye it',
          () => {
            // 🔴 .the defect this clamps — the tool held BOTH facts and printed NO verdict
            //
            //    the row rendered the plea's `--stone`, CREW_STONES held the stone the
            //    tree renders NOW, and the row said "check its --stone against the stone
            //    rendered above". that compare ran BY EYE, once per plea, every tick,
            //    against a census ~500 lines long on a full fleet — and the skill's own
            //    plea comment records that the MAJORITY of pleas are stale, so the
            //    compare IS the decision, not a formality before it.
            //
            // ⇒ the same family as the healable row's cure: a verdict the tool can
            //   compute and does not print is a verdict re-derived by hand, per row,
            //   forever (rule.require.poll-recommends-every-cure-heal-has). and the
            //   instruction to compare was itself the tell — a step the caller finishes
            //   by hand AFTER the call is a defect in the TOOL
            //   (rule.always.entool-the-skills-you-touch).
            //
            // ⚠️ .safe to assert absent: readCode drops whole-line `#` comments, and the
            //    skill quotes that same sentence in the comment that records this cure.
            const src = readCrewPoll();

            // the by-eye instruction is GONE from the rendered row — its presence IS the defect
            expect(
              src.includes(
                'check its --stone against the stone rendered above',
              ),
            ).toEqual(false);

            // the plea's own --stone is extracted from the command it printed
            expect(src.includes('__pstone="${__pcmd#*--stone }"')).toEqual(
              true,
            );
            // …and the rendered stone is read off CREW_STONES for THAT role, never any role
            expect(
              src.includes('[[ "$__ps" == "${__prole}="* ]] || continue'),
            ).toEqual(true);
            expect(
              src.includes('done < <(sort -u <<< "${CREW_STONES[$__pt]:-}")'),
            ).toEqual(true);

            // all three verdicts exist, and the row carries whichever one fired
            expect(src.includes('__pverdict="✅ FRESH —')).toEqual(true);
            expect(src.includes('__pverdict="⚠️ STALE —')).toEqual(true);
            expect(src.includes('__pverdict="❔ unsettled —')).toEqual(true);
            expect(src.includes('grant: ${__pcmd} — ${__pverdict}')).toEqual(
              true,
            );
          },
        );

        then(
          '🔴 a STALE verdict names BOTH stones, so the refutation is checkable',
          () => {
            // .teeth = a bare "STALE" sends a supervisor to drill in anyway, which
            //          swaps one by-hand step for another. the row must print what
            //          was ASKED and what is RENDERED, side by side.
            const src = readCrewPoll();
            const at = src.indexOf('__pverdict="⚠️ STALE —');
            expect(at).toBeGreaterThan(0);
            const row = src.slice(at, src.indexOf('\n', at));
            expect(row.length).toBeGreaterThan(40); // anti-vacuity: an empty slice satisfies every includes()
            expect(row.includes('${__pstone}')).toEqual(true);
            expect(row.includes('${__prendered}')).toEqual(true);
            expect(row.includes('do NOT relay')).toEqual(true);
          },
        );

        then(
          '🔴 the verdict adds EVIDENCE, never AUTHORITY — the row still forbids a self-grant',
          () => {
            // .the bound = FRESH says the ask is LIVE, never that it is RIGHT. the cure
            //   dates a plea; whether to grant it stays the human's, on every branch.
            const src = readCrewPoll();
            const at = src.indexOf(
              '🙋 PLEA SEEN — ${__pt}/${__prole} printed a HUMAN-only grant: ${__pcmd}',
            );
            expect(at).toBeGreaterThan(0);
            const row = src.slice(at, src.indexOf('\n', at));
            expect(row.length).toBeGreaterThan(40); // anti-vacuity
            expect(row.includes('never self-grant')).toEqual(true);
            // and no branch hands over a runnable grant — SEEN stays SEEN
            const fresh = src.slice(
              src.indexOf('__pverdict="✅ FRESH —'),
              src.indexOf('\n', src.indexOf('__pverdict="✅ FRESH —')),
            );
            expect(fresh.includes("the human's to grant")).toEqual(true);
            expect(fresh.includes('route.stone.set')).toEqual(false);
          },
        );

        then('it still renders SEEN and still forbids a self-grant', () => {
          // .the bound — evidence, never authority
          const src = readCrewPoll();
          expect(src.includes('🙋 PLEA SEEN —')).toEqual(true);
          expect(src.includes('never self-grant')).toEqual(true);
        });

        then(
          'an unparseable row DEGRADES to the prior form — a plea is never dropped',
          () => {
            const src = readCrewPoll();
            expect(
              src.includes(
                'printed a HUMAN-only grant command. read it, then relay — never self-grant',
              ),
            ).toEqual(true);
          },
        );
      });

      when('[t2] the pre-fix form is held against the same assertions', () => {
        then('🔴 it goes RED — the bite proof', () => {
          // the recorder, the join, and the render as they stood before this cure
          const before = [
            '__crew_record_plea() {',
            '  local uri="$1" role tree',
            '  [[ -n "$uri" ]] || return 0',
            '  CREW_PLEA["$(__crew_canon "$tree")"]+="${role}"$\'\\n\'',
            '}',
            '            __crew_record_plea "$uri_block"',
            '    ACTIONS+=("🙋 PLEA SEEN — ${DISPLAY[$__pt]:-$__pt}/${__pr} printed a HUMAN-only grant command. read it, then relay — never self-grant")',
          ].join('\n');
          // every assertion above that names the cure must fail on this form
          expect(
            /__crew_record_plea\(\)\s*\{\s*\n\s*local uri="\$1" line="\$\{2:-\}"/.test(
              before,
            ),
          ).toEqual(false);
          expect(
            before.includes('__crew_record_plea "$uri_block" "$line"'),
          ).toEqual(false);
          expect(
            before.includes(
              'CREW_PLEA["$(__crew_canon "$tree")"]+="${role}=${cmd}"',
            ),
          ).toEqual(false);
          expect(
            before.includes('printed a HUMAN-only grant: ${__pcmd}'),
          ).toEqual(false);
          expect(
            before.includes(
              'check its --stone against the stone rendered above',
            ),
          ).toEqual(false);
          // …while the DEGRADE text is present in both, which is the point of it:
          // the pre-fix render is the fallback the cure keeps
          expect(
            before.includes(
              'printed a HUMAN-only grant command. read it, then relay — never self-grant',
            ),
          ).toEqual(true);
        });
      });
    },
  );

  /**
   * [case28] — a PARKED message (prefilled) and a QUEUED-message list are
   *            distinct box states, never folded into one (task #18)
   *
   * .why = the two demand OPPOSITE moves. a prefilled box holds one message a
   *        human typed and never sent — the supervisor relays it with Enter.
   *        a queued list is already submitted, and a busy clone drains it on
   *        its own — an Enter there lands in the EMPTY box beneath the queued
   *        row, a recorded harm (term=duct.box.unread, term=duct.box.inflight).
   *
   * .the discriminator, verified against the source
   *        duct.poll folds `queued` off the literal `to edit queued messages`
   *        row, and `prefilled` off a non-empty $sgr (white, typed). the two
   *        sit on separate arms. git.crew.poll then maps each to its own glyph.
   */
  given(
    '[case28] the poll parts a parked message from a queued-message list',
    () => {
      const readDuctPoll = (): string =>
        readCode(join(DIR_SKILLS, 'duct.poll.sh'));
      const readCrewPoll = (): string => asCode(readPollWhole());

      when('[t0] duct.poll folds the box state', () => {
        then('a `to edit queued messages` row folds to `queued`', () => {
          const src = readDuctPoll();
          expect(
            /\*'to edit queued messages'\*[\s\S]{0,40}box="queued"/.test(src),
          ).toEqual(true);
        });

        then(
          'a non-empty $sgr (typed, white) folds to `prefilled`, a separate arm',
          () => {
            const src = readDuctPoll();
            expect(/-n "\$sgr" \]\];\s*then box="prefilled"/.test(src)).toEqual(
              true,
            );
          },
        );

        then(
          'the queued arm keys on the message row, NOT on $sgr — the bite proof',
          () => {
            // .why = were `queued` folded into the $sgr `prefilled` arm, a busy
            //        clone's queue would read as a parked message and earn an Enter
            //        into the empty box beneath it. a collapse that drops the
            //        message-row arm must NOT still name the queued state.
            const collapsed =
              'elif [[ -n "$sgr" ]]; then box="prefilled"; box_text="$plain"';
            expect(
              /\*'to edit queued messages'\*[\s\S]{0,40}box="queued"/.test(
                collapsed,
              ),
            ).toEqual(false);
          },
        );
      });

      when('[t1] the two states render for a human', () => {
        then('the parked message renders PREFILLED with a relay caveat', () => {
          const src = readDuctPoll();
          expect(
            src.includes('PREFILLED — a human typed this, unsent'),
          ).toEqual(true);
        });

        then('the queued list renders QUEUED and names no key', () => {
          const src = readDuctPoll();
          expect(
            src.includes(
              'QUEUED — input waits; mechanic busy, will consume it',
            ),
          ).toEqual(true);
        });
      });

      when('[t2] git.crew.poll maps each box to its own glyph', () => {
        then('QUEUED and PREFILLED map to distinct crew-box values', () => {
          const src = readCrewPoll();
          expect(/\*'QUEUED'\*\)\s+box="\S*queued"/.test(src)).toEqual(true);
          expect(/\*'PREFILLED'\*\)\s+box="\S*prefilled"/.test(src)).toEqual(
            true,
          );
        });
      });
    },
  );

  // 🔴 .what = the TURN ENDED row must join on the QUEUED FACT, never on the box
  //    state alone.
  //
  // 🔴 .why  = the box's `queued` arm keys on claude's footer hint, which claude
  //    prints only WHILE A TURN RUNS. so on a clone whose turn has ended — the
  //    only state where a queue stops to drain — the box reads `empty`, the
  //    `:queued` join never fires, and the row never prints.
  //
  //    measured 2026-09-16, `feat-dispute-or-concede-review-budget`, a ⭐ tree.
  //    its mechanic asked the human a ⭐ question, the human answered
  //    `fireworks is back now`, the turn had ended. the message sat undrained
  //    across TWO babysit ticks and the ACTIONS block stayed silent every time.
  //
  // 🔴 .the lesson the cure itself taught, one round earlier: a green DETECTOR
  //    proves not one claim about the RENDER. `__duct_pane_queued_row` went
  //    green and the fleet render was unchanged, because the JOIN two layers up
  //    still keyed on a box state the detector does not set
  //    (rule.always.capture-clamp-then-verify-in-prod).
  //
  // .teeth = revert the join to `:queued` alone and t1 goes red.
  given(
    '[case35] the TURN ENDED row joins on the queued FACT, not the box alone',
    () => {
      const readCrewPoll = (): string => asCode(readPollWhole());

      when('[t0] the crew layer parses the new fact row at all', () => {
        then('it carries a QUEUED SEEN parse arm', () => {
          expect(readCrewPoll().includes('QUEUED SEEN')).toEqual(true);
        });

        then(
          'and files it under its own per-tree map, keyed like its peers',
          () => {
            expect(readCrewPoll().includes('CREW_QUEUEDROW')).toEqual(true);
          },
        );
      });

      when(
        '[t1] the ACTIONS join admits a queued FACT beside the box state',
        () => {
          then('the row no longer turns on `:queued` alone', () => {
            // 🔴 the whole defect in one assertion. the pre-cure join read:
            //      case " ${CREW_BOXES[$__tt]:-} " in *" ${__trole}:queued "*) ;; *) continue ;; esac
            //    one condition, one source, and that source is blind after a turn ends.
            const src = readCrewPoll();
            const loop = src.slice(
              src.indexOf('for __tt in "${!CREW_TURNENDED[@]}"'),
            );
            expect(loop.slice(0, 1400).includes('CREW_QUEUEDROW')).toEqual(
              true,
            );
          });
        },
      );

      when(
        '[t2] the ladder arm reads the same fact, so the two cannot disagree',
        () => {
          then('the crew_status join admits it too', () => {
            expect(readCrewPoll().includes('__has_queuedrow')).toEqual(true);
          });
        },
      );

      when(
        '[t3] the duct layer hands the detector a pane that STILL CARRIES its signal',
        () => {
          // 🔴 .the one gap a detector-level clamp can never see
          //      ductwork's own clamp feeds __duct_pane_queued_row a RAW fixture,
          //      read off disk with its escapes intact, and it goes green. prod
          //      feeds it `$flat` — the same pane with every SGR stripped. the
          //      detector keys on a BACKGROUND SGR, so the stripped pane has
          //      already removed the only signal it reads.
          //
          //      measured twice on one cure, 2026-09-16. the suite was green both
          //      rounds and the fleet render did not move either time. so the
          //      contract that matters is not the detector's — it is the CALL
          //      SITE's, and this is the only clamp positioned to hold it.
          const readDuctPoll = (): string =>
            readCode(join(DIR_SKILLS, 'duct.poll.sh'));

          then(
            'the call site passes $raw, never the escape-stripped $flat',
            () => {
              expect(
                readDuctPoll().includes('__duct_pane_queued_row "${raw:-}"'),
              ).toEqual(true);
            },
          );

          then('and $flat is never handed to it, on any line', () => {
            expect(
              readDuctPoll().includes('__duct_pane_queued_row "${flat:-}"'),
            ).toEqual(false);
          });

          then(
            'the peer detectors keep $flat — this is one exception, not a sweep',
            () => {
              const src = readDuctPoll();
              expect(
                src.includes('__duct_pane_turn_ended "${flat:-}"'),
              ).toEqual(true);
            },
          );
        },
      );

      when('[t4] the arm is REACHABLE for the crews it was written for', () => {
        // 🔴 .the defect this clamp exists for, and it is an ORDER defect
        //    the arm was correct, wired, and clamped — and it sat BELOW the
        //    `blocked ✋` stone arm, so it never once fired. every crew it
        //    targets carries `blocked ✋`: a clone ends its turn to ask a human
        //    precisely when it is gated. so the population the arm was written
        //    for is exactly the population that could never reach it.
        //
        //    two cures went green against this. the first keyed on the box, the
        //    second keyed on the right witness at the wrong rung, and BOTH left
        //    the render unmoved. the human read the pane and said it plainly:
        //    "it is NOT inflight / it is just halted".
        //
        //    ⇒ so no detector-level and no witness-level assertion can hold this.
        //      only the RELATIVE ORDER of the two arms can, and that is what this
        //      reads: the turn-ended join must appear BEFORE `blocked ✋`.
        const readCrewPollSrc = (): string => asCode(readPollWhole());

        then(
          'the turn-ended join is graded ABOVE the `blocked ✋` stone arm',
          () => {
            const src = readCrewPollSrc();
            const join = src.indexOf(
              '-n "$__has_turnended" && ( "$__boxes_s" == *"📬queued"*',
            );
            const stone = src.indexOf('"$__stones_s" == *"blocked ✋"*');
            expect(join).toBeGreaterThan(-1);
            expect(stone).toBeGreaterThan(-1);
            expect(join).toBeLessThan(stone);
          },
        );

        then('and it grades `frozen` — never a coined synonym for it', () => {
          // the verdict table already declares frozen as "still, and the sup owns
          // it", which is this state exactly. a second word would be a synonym
          // (rule.forbid.domain-term-synonyms). a first cure coined `halted`; the
          // human struck it — "isnt that frozen / use that emoji here".
          const src = readCrewPollSrc();
          const arm = src.slice(
            src.indexOf(
              '-n "$__has_turnended" && ( "$__boxes_s" == *"📬queued"*',
            ),
          );
          expect(arm.slice(0, 200).includes('crew_status="frozen"')).toEqual(
            true,
          );
          expect(src.includes('crew_status="halted"')).toEqual(false);
        });

        then(
          'the healable predicate is handed the WITNESS, not the status alone',
          () => {
            // frozen is proven three ways and only one of them names a cure, so the
            // call site must pass the queued row through or --healable would sweep
            // every cloneless orphan in beside it.
            expect(
              readCrewPollSrc().includes(
                '__crew_is_healable "$crew_status" "$__has_ratelimit" "$__cap_stale" "$__has_queuedrow"',
              ),
            ).toEqual(true);
          },
        );
      });
    },
  );

  // 🔴 .what = a 🚧prompt must earn an ACTIONS row, like every other named state.
  //
  // 🔴 .why  = it is the ONE row in this footer whose actor is the READER. every
  //    peer names work for somebody else — a mechanic to steer, a human to ask, a
  //    foreman to tell. a modal is a clone stopped at a keyboard the supervisor
  //    itself holds, and its cure is one keystroke.
  //
  //    and it was the only member of the NAMED family — PLEA SEEN, FELL-READY
  //    SEEN, BOX UNMOVED, CLONE QUIET, CI FAILED, ESCALATION — with no row.
  //
  // 🔴 .the file already graded its own gap, and never cured it. its box census:
  //
  //      > a modal is a clone stopped at a keyboard nobody watches — the single
  //      > most costly row a tick can hold … the `BOX UNMOVED` join names a role
  //      > only where it did NOT move. a modal raised THIS poll moves, so it is
  //      > absent there by construction ⇒ the costliest state is exactly the one
  //      > that stays anonymous.
  //
  //    measured 2026-09-16, two consecutive babysit ticks: `🚧prompt × 1` in the
  //    census and `✨ naught to act on` in the footer, over it. it was answered
  //    both times only because a supervisor re-scanned the census rows by eye —
  //    the exact habit `rule.always.poll-the-fell-and-heal-sets` exists to end.
  //
  // .teeth = delete the `__mw` loop and t0/t1/t2 all go red.
  given(
    '[case36] a 🚧prompt earns an ACTIONS row, and that row names a READ',
    () => {
      const readPoll = (): string => asCode(readPollWhole());

      when(
        '[t0] the footer is asked for the costliest state it can hold',
        () => {
          then('it carries a MODAL row', () => {
            expect(readPoll().includes('🚧 MODAL')).toEqual(true);
          });
        },
      );

      when('[t1] the row is derived', () => {
        then('it reads the census map that already NAMES the role', () => {
          // a count with no subject cannot be acted on. BOX_WHO is the one map
          // that already carries `<tree>/<role>` per box state, and it is in
          // scope here — so the subject needs no new code to find.
          expect(readPoll().includes('BOX_WHO["🚧prompt"]')).toEqual(true);
        });
      });

      when('[t2] the row prescribes a move', () => {
        const row = (): string => {
          const src = readPoll();
          const i = src.indexOf('🚧 MODAL');
          return i < 0 ? '' : src.slice(i, i + 400);
        };

        then('it names a READ', () => {
          expect(row().includes('rhx git.crew.read')).toEqual(true);
        });

        then('and never a key', () => {
          // 🔴 the option COUNT is unknowable from here, and decline is the LAST
          //    option — so a prescribed `--keys 2` on a three-option modal sends
          //    "yes, and don't ask again", a grant that is never the supervisor's
          //    to give (rule.forbid.self-grant-human-gates).
          expect(row().includes('--keys')).toEqual(false);
        });
      });

      // 🔴 the gap was never the modal's alone. the census names roles for FOUR
      //    box states and exactly TWO are the supervisor's own act — so a cure
      //    that covers one and not the other leaves the identical anonymity in
      //    place, and the live fleet proved it in the same tick: the modal was
      //    answered, `✍️prefilled × 1` took its place in the census, and the
      //    footer read `✨ naught to act on` over that one too.
      when('[t3] the OTHER supervisor-owned box state earns a row too', () => {
        then('an unsubmitted box is named', () => {
          expect(readPoll().includes('BOX_WHO["✍️prefilled"]')).toEqual(true);
          expect(readPoll().includes('✍️  UNSENT')).toEqual(true);
        });

        then('and its read is RAW, because a ghost is not typed text', () => {
          // an Enter on an autocomplete ghost submits a word no human wrote
          // (term=duct.box.ghost). a plain read is colour-blind to the
          // difference, so the raw flag IS the prescribed act.
          const src = readPoll();
          const i = src.indexOf('✍️  UNSENT');
          expect(src.slice(i, i + 400).includes('--raw')).toEqual(true);
        });
      });

      when('[t4] the states that are NOT ours stay silent', () => {
        then('a queued box earns no row — it is already submitted', () => {
          // 📬queued is a box the clone itself drains. an Enter there lands in
          // the EMPTY box beneath the queued row, which is a recorded harm
          // (term=duct.box.inflight).
          expect(readPoll().includes('BOX_WHO["📬queued"]')).toEqual(false);
        });
      });
    },
  );

  /**
   * [case38] — the release verdict reaches the GROVE, so `--fellable` can name a
   *            grove tree that shipped
   *
   * .why = `--fellable`'s whole purpose is to render the fell set. it derived
   *        that set from a LOCAL `git` + `gh` read, and returned `🌐 on grove —
   *        not read from here` for every tree whose worktree lives on a grove.
   *
   *        so on a fleet that is 24/25 on-grove, the flag that names the fell
   *        candidates could name almost none of them, and its footer said so in
   *        prose: *"a tree that SHIPPED looks identical to one that did not."*
   *
   * 🔴 .the disclosure is what made it survive
   *    the render DECLARED its blind spot, honestly, on every tick. a declared
   *    blind spot reads as a settled bound rather than a defect, so it was
   *    quoted back as a verdict — four consecutive ticks deferred one tree's
   *    closeout on it. measured 2026-09-17: the human asked "why not felled?",
   *    and ONE `gh pr list --head <branch>` answered it — MERGED at 13:09Z.
   *
   *    ⇒ `term=partial-audit`: complete over the subject set it chose, reported
   *      as a verdict about the fleet. the honesty of the caveat is what let it
   *      pass for a limit.
   *
   * 🔴 .the root cause is that it asked the WRONG SOURCE
   *    merge state is a property of GITHUB, never of the box the worktree sits
   *    on — `gh pr list --repo <org>/<repo> --head <branch>` is host-independent
   *    and always was. the only facts that genuinely need the box are org/repo,
   *    branch, commit count, and dirty. so the cure is not a new instrument: it
   *    is ONE ssh for the four local facts, then the identical `gh` read.
   *
   * ⚠️ .the decline must SURVIVE, narrowed
   *    an unreachable grove still cannot be judged, and the honest verdict for a
   *    subject you did not read is still "not read". what changes is that the
   *    decline is now a FAILURE path rather than the whole grove path — which is
   *    what [t3] holds, and why [case22][t2] stays green.
   */
  given(
    '[case38] the release verdict reaches the grove, and declines only on a failed read',
    () => {
      const readPoll = (): string => asCode(readPollWhole());

      when('[t0] the grove arm of the tree verdict is read', () => {
        then('a remote facts read exists at all', () => {
          expect(readPoll().includes('__poll_tree_facts_on_grove')).toEqual(
            true,
          );
        });

        then(
          'the grove arm CALLS it, rather than returning on sight of a host',
          () => {
            // 🔴 the tooth: it is not enough that a helper exists — the arm that
            //    used to decline unconditionally must now consult it. an assertion
            //    that only checked for the helper would go green over a helper no
            //    caller reaches.
            const src = readPoll();
            const arm = src.indexOf('if [[ -n "$host" ]]; then');
            expect(arm).toBeGreaterThan(0);
            const decline = src.indexOf('not read from here');
            expect(decline).toBeGreaterThan(arm);
            // the call sits BETWEEN the host test and the decline — i.e. the decline
            // is downstream of a read that was attempted
            const call = src.indexOf('__poll_tree_facts_on_grove "$host"');
            expect(call).toBeGreaterThan(arm);
            expect(call).toBeLessThan(decline);
          },
        );

        then(
          'the facts it reads are the four the local arm reads, and no more',
          () => {
            // .why the SAME four: the verdict logic below is shared. a remote read
            //      that returned a different shape would need a second verdict
            //      ladder, which is the two-derivations-of-unequal-reach defect this
            //      file already records three times over.
            const src = readPoll();
            expect(/read -r remote branch commits \w+ <<</.test(src)).toEqual(
              true,
            );
          },
        );
      });

      when('[t1] the remote read itself is read', () => {
        const helper = (): string => {
          const src = asCode(readPollWhole());
          const at = src.indexOf('__poll_tree_facts_on_grove() {');
          expect(at).toBeGreaterThan(0);
          return src.slice(at, src.indexOf('\n}\n', at));
        };

        then('it is BOUNDED — a poll cannot hang on one grove', () => {
          // term=poll, property 4. TIMEOUT is 20s per tree and this ssh now runs
          // on every grove tree, so an unbounded connect would spend the whole
          // budget on a box that is asleep.
          expect(/ConnectTimeout=/.test(helper())).toEqual(true);
        });

        then('it does NOT eat its caller stdin', () => {
          // the -n defect that cost a fleet report once already (see [case21]).
          expect(/ssh -n /.test(helper())).toEqual(true);
        });

        then('it asks the GROVE for the root, never this box', () => {
          // CREWWORK_GIT_ROOT is an already-expanded /home/bert; carried to a
          // grove whose user is `camper` it is a local answer to a remote question.
          expect(helper().includes('CREWWORK_GIT_ROOT_REMOTE')).toEqual(true);
          expect(/CREWWORK_GIT_ROOT[^_]/.test(helper())).toEqual(false);
        });

        then('the remote glob runs under sh, never the login shell', () => {
          // a grove logs in to zsh, which ERRORS on an unmatched glob rather than
          // leave it literal — so a merely-absent tree looks like a transport
          // fault. the same reason __crew_tree_dir_on_grove carries it.
          expect(helper().includes("sh -c '")).toEqual(true);
        });
      });

      when('[t2] the subshell that runs the verdict is read', () => {
        then(
          'the helper is carried into it, so the grove arm is not silently dead',
          () => {
            // 🔴 the arm runs inside `bash -c "$(declare -f …)"`. a helper absent
            //    from that list is undefined at the call site, the read fails, and
            //    EVERY grove tree declines exactly as before — a cure that is green
            //    in source and inert in production.
            expect(
              /declare -f __poll_one_tree __crew_tree_dir __poll_tree_facts_on_grove/.test(
                readPoll(),
              ),
            ).toEqual(true);
          },
        );

        then('and the remote root travels with it', () => {
          expect(
            /CREWWORK_GIT_ROOT_REMOTE='\$CREWWORK_GIT_ROOT_REMOTE'/.test(
              readPoll(),
            ),
          ).toEqual(true);
        });
      });

      when('[t3] the failure path is read', () => {
        then(
          'an UNREADABLE grove still declines — it does not invent a verdict',
          () => {
            // 🔴 the COUNTER. the cure must not turn "i could not read it" into
            //    "no pr" — that arm renders `🫧 no work` / `✋ no pr`, which on a
            //    merged tree would be a false report with a confident face, and
            //    strictly worse than the decline it replaced.
            const src = readPoll();
            const decline = src.indexOf('not read from here');
            expect(decline).toBeGreaterThan(0);
            // the decline is reached from an EMPTY facts read, never unconditionally
            const guard = src.lastIndexOf('-z "$__facts"', decline);
            expect(guard).toBeGreaterThan(0);
            expect(guard).toBeLessThan(decline);
          },
        );

        then(
          'and a worktree it found but git would not answer for is ALSO declined',
          () => {
            // the second failure shape: the ssh succeeded, the tree is there, and
            // `git remote`/`rev-parse` returned nought. an empty org/branch would
            // build `gh pr list --repo /` — which exits non-zero, falls to the no-pr
            // arm, and renders `🫧 no work` over a shipped tree.
            expect(readPoll().includes('git did not answer')).toEqual(true);
          },
        );
      });
    },
  );

  /**
   * .what = the 👻 phantom footer row NAMES its trees and emits a runnable fell
   *
   * .why  = `rule.always.poll-the-fell-and-heal-sets` reads: derive the
   *        actionable sets THROUGH the tool, and act on the emitted lines —
   *        "never a tree name copied by hand off the render (blocker)".
   *
   *        measured 2026-09-17: `👻 phantom` was the ONE state in this footer
   *        whose line was PROSE. `💀 down` emitted a `crew.boot` with a real
   *        tree; the merged sets emitted a `git.tree.del` per tree; phantom
   *        emitted a count and a description. so the only path from a phantom
   *        to its cure was the hand-copy the rule grades a blocker — the tool
   *        forbade the one move it left available.
   *
   * .the bound = a phantom is LOCAL by construction (the arm that sets it
   *        requires `-z "$crew_host"`), so its cure carries no `--grove`, and
   *        must not — a `--grove` on a local tree aims the fell at a box the
   *        tree was never on.
   */
  given(
    '[case39] the phantom row emits a runnable cure per tree, never prose alone',
    () => {
      const readCrewPoll = (): string => asCode(readPollWhole());

      when('[t0] the name collection is read', () => {
        then(
          'a PHANTOM_TREES array exists — the cure cannot run without a name',
          () => {
            expect(/^PHANTOM_TREES=\(\)$/m.test(readCrewPoll())).toEqual(true);
          },
        );

        then(
          '🔴 it fills at the TALLY chokepoint, beside its down twin',
          () => {
            // .why = a name gathered after a fold is a name the fold already took.
            //        the down array is appended at the tally line for exactly this
            //        reason, and a phantom row meets the identical folds.
            const src = readCrewPoll();
            expect(
              src.includes(
                '[[ "$crew_state" == "phantom" ]] && PHANTOM_TREES+=("$tree")',
              ),
            ).toEqual(true);
            expect(
              src.indexOf(
                '[[ "$crew_state" == "phantom" ]] && PHANTOM_TREES+=("$tree")',
              ),
            ).toBeGreaterThan(src.indexOf('CREWTALLY["$crew_state"]='));
          },
        );
      });

      when('[t1] the phantom ACTIONS row is read', () => {
        then('🔴 it emits a runnable fell that names a REAL tree', () => {
          const src = readCrewPoll();
          expect(
            src.includes('for __pt in "${PHANTOM_TREES[@]:-}"; do'),
          ).toEqual(true);
          expect(src.includes('rhx git.crew.fell --tree $__pt')).toEqual(true);
        });

        then(
          'the fell carries NO --grove — a phantom is local by construction',
          () => {
            // .the bound. aimed at the class: no phantom row anywhere may append a
            //   grove bind, not merely the line written today.
            const offenders = readCrewPoll()
              .split('\n')
              .filter(
                (line) =>
                  /PHANTOM_TREES|__pt/.test(line) && /--grove/.test(line),
              )
              .map((line) => line.trim());
            expect(offenders).toEqual([]);
          },
        );

        then('the count row survives, and says the fell is safe', () => {
          // the per-tree rows answer WHICH; the count row answers HOW MANY and
          // WHY the act is safe. neither substitutes for the other.
          const src = readCrewPoll();
          expect(src.includes('👻 $PHANTOM phantom')).toEqual(true);
          expect(
            src.includes('the fell is safe: the tree is already gone'),
          ).toEqual(true);
        });
      });

      when('[t2] the pre-fix form is held against the same assertions', () => {
        then('🔴 it goes RED — the bite proof', () => {
          // .teeth = the line exactly as it shipped. a clamp that passes over the
          //   prior form clamps nought (rule.require.clamp-edge-cases).
          const shipped =
            '(( PHANTOM > 0 ))  && ACTIONS+=("👻 $PHANTOM phantom    — felled trees whose registry rows remain")';
          expect(shipped.includes('rhx git.crew.fell --tree $__pt')).toEqual(
            false,
          );
          expect(/^PHANTOM_TREES=\(\)$/m.test(shipped)).toEqual(false);

          const fixed =
            'ACTIONS+=("👻 STALE ROWS — $__pt — drop the record: rhx git.crew.fell --tree $__pt")';
          expect(fixed.includes('rhx git.crew.fell --tree $__pt')).toEqual(
            true,
          );
        });
      });
    },
  );

  /**
   * .what = the WORK ORPHANED footer row names its trees, one runnable move each
   *
   * .why  = the row sits FIRST among the actions, by the poll's own comment,
   *        "because it is the one state that loses work … a dirty crewless tree
   *        is work that exists and that nobody is on". and it emitted a bare
   *        count, so the reader could not learn WHICH trees without a second,
   *        wider sweep read by eye.
   *
   *        every peer row in that same footer already names its subject and
   *        emits a per-tree command — 🚧 MODAL, ✍️ UNSENT, 👻 STALE ROWS ([case39]),
   *        ✂️ clipped ([case44]). the one row whose subject is UNCOMMITTED WORK
   *        was the one that named none.
   *
   * 🔴 .and the poll's own source records this three times, uncured
   *        `:2477` — "a count with no subject is not actionable … that is the
   *                   identical defect this file records at the orphan row"
   *        `:2634` — "a `--live` run reported `⚠️ 3 WORK ORPHANED` and named not
   *                   ONE of them … ⚠️ and `--live` is not some rare flag here:
   *                   the babysit tick contract MANDATES it"
   *        `:3183` — measured 2026-09-13, "footer read `7 WORK ORPHANED`,
   *                   exactly 1 row named it"
   *
   *        two filter EXEMPTIONS were added so orphan ROWS survive `--live` and
   *        the no-clone fold. neither reached the footer, which is the surface a
   *        tick actually acts from ⇒ the arrear was half-paid and read as paid.
   *
   *        measured again 2026-09-18, this tick: `⚠️  5 WORK ORPHANED` and five
   *        anonymous trees that hold uncommitted work.
   *
   * .the bound = the COUNT row survives. it answers HOW MANY and states the
   *        class; the per-tree rows answer WHICH. neither substitutes for the
   *        other — the same split [case39] holds for 👻 phantom.
   */
  given(
    '[case49] the WORK ORPHANED footer names each tree, never a bare count',
    () => {
      const readCrewPoll = (): string => asCode(readPollWhole());

      when('[t0] the name collection is read', () => {
        then(
          'an ORPHANED_WHO collector exists — the boot cannot run without a name',
          () => {
            expect(/^ORPHANED_WHO=""$/m.test(readCrewPoll())).toEqual(true);
          },
        );

        then(
          '🔴 it fills at the GATE, beside the counter it rides with',
          () => {
            // .why = the gate sits ABOVE both filters on purpose (the `--live`
            //        exemption and the no-clone fold). a name gathered below either
            //        one is a name that filter already took — which is precisely how
            //        the two extant exemptions were earned.
            const src = readCrewPoll();
            const at = src.indexOf('ORPHANED=$((ORPHANED + 1))');
            expect(at).toBeGreaterThan(0);
            expect(src.slice(at, at + 220)).toContain('ORPHANED_WHO+=');
          },
        );

        then('⚠️ and it collects the DOTTED slug, never DISPLAY', () => {
          // DISPLAY holds tmux's underscored session name, which `--tree` refuses.
          // the same rule the FAILED_TREES collector states in its own comment.
          const src = readCrewPoll();
          const line = src
            .split('\n')
            .find((l) => l.includes('ORPHANED_WHO+='));
          expect(line).toBeDefined();
          expect(line).toContain('$tree');
          expect(line).not.toContain('DISPLAY');
        });
      });

      when('[t1] the orphan ACTIONS row is read', () => {
        // 🔴 .why the assertions are SLICED to the orphan emitter
        //   `rhx git.crew.boot --tree` already appears three times elsewhere in
        //   this file — at the 💀 down row, at the 🪦absent row, and in a comment.
        //   so a bare `toContain` passes over the SHIPPED defect and clamps nought.
        //   measured on this clamp's own first draft: that tooth went green while
        //   its three peers went red.
        //
        // ⚠️ and the endpoint is CODE, never a comment — `readCode` strips comment
        //   lines, so a marker in prose is absent from the slice by construction.
        //   the MODAL row's own `if` is the first code after this row, and it is
        //   what bounds it.
        const orphanRow = (): string => {
          const src = readCrewPoll();
          const open = src.indexOf('ACTIONS=()');
          expect(open).toBeGreaterThan(0);
          const shut = src.indexOf('if [[ "$BOXES" == "true" ]]; then', open);
          expect(shut).toBeGreaterThan(open);
          return src.slice(open, shut);
        };

        then('🔴 it walks the collected names', () => {
          expect(orphanRow()).toContain('$ORPHANED_WHO');
        });

        then('🔴 and emits a runnable boot per tree, inside that row', () => {
          expect(orphanRow()).toContain('rhx git.crew.boot --tree');
        });

        then('the count row survives, and keeps the class it states', () => {
          const row = orphanRow();
          expect(row).toContain('$ORPHANED WORK ORPHANED');
          expect(row).toContain('a crew with no clone, on a dirty tree');
        });
      });

      when('[t2] the pre-fix form is held against the same assertions', () => {
        // .teeth = the emitter exactly as it shipped. a clamp that passes over the
        //   prior form clamps nought (rule.require.clamp-edge-cases).
        const shipped =
          '(( ORPHANED > 0 )) && ACTIONS+=("⚠️  $ORPHANED WORK ORPHANED — a crew with no clone, on a dirty tree. boot it or set the work aside")';

        then('🔴 it goes RED on the collector', () => {
          expect(/^ORPHANED_WHO=""$/m.test(shipped)).toEqual(false);
        });

        then('🔴 and RED on the per-tree move', () => {
          expect(shipped.includes('rhx git.crew.boot --tree')).toEqual(false);
        });

        then('and the cured form goes GREEN on both', () => {
          const fixed = [
            'ORPHANED_WHO=""',
            'ACTIONS+=("⚠️  ORPHANED — $__ow — boot it: rhx git.crew.boot --tree $__ow")',
          ].join('\n');
          expect(/^ORPHANED_WHO=""$/m.test(fixed)).toEqual(true);
          expect(fixed.includes('rhx git.crew.boot --tree')).toEqual(true);
        });

        then(
          '⚠️ and a bare POINTER does not satisfy it — a row must be runnable',
          () => {
            const pointer =
              'ACTIONS+=("⚠️  $ORPHANED WORK ORPHANED — see the rows above for which")';
            expect(pointer.includes('rhx git.crew.boot --tree')).toEqual(false);
          },
        );
      });

      when(
        "[t3] the gate itself is read — [case14]'s subject, which this must not disturb",
        () => {
          then('the marker-independent sense test still stands', () => {
            // [case14] clamps that the gate keys on the SENSE, never on the glyph.
            // this cure touches the EMITTER; the gate is untouched, and stays so.
            const src = readCrewPoll();
            expect(src).toContain('crew_cloneless=1');
            expect(src).toContain('$verdict" == "in flight"');
          });
        },
      );
    },
  );

  /**
   * .what = the 💀 DOWN footer row emits a runnable boot PER TREE, never one
   *        command plus a prose remainder
   *
   * .why  = a down crew is cured one tree at a time — `git.crew.boot --tree`
   *        takes exactly one. so a row that names the FIRST tree and then lists
   *        the rest as bare words hands a reader one runnable line and N-1
   *        names with no command beside them. the only path left for those N-1
   *        is a hand-copy off the render, which is the one move
   *        `rule.always.poll-the-fell-and-heal-sets` grades a blocker.
   *
   * 🔴 .and the poll's own source already made this exact argument, three lines
   *        below the row it left uncured. the phantom cure's docblock (`:5355`):
   *
   *          "every peer above hands over a line a reader can run … a prose row
   *           leaves the hand-copy as the only path, so the tool forbade the one
   *           move it permitted."
   *
   *          "per-tree rather than first-plus-remainder (THE `down` SHAPE): each
   *           phantom takes its OWN fell, so one command closes exactly one of
   *           them, and a remainder line would name trees with no command
   *           beside them."
   *
   *        ⇒ it named `down` as the shape it declined, and then left `down` in
   *          it. the argument transfers verbatim: each down crew takes its own
   *          boot, so the remainder line names trees with no command beside
   *          them — the very sentence the phantom cure wrote to justify itself.
   *
   *        measured 2026-09-19, in a live babysit tick: `--all` footed with
   *        `💀 4 down` + `💀 and 3 more down — <three bare names>`. one boot was
   *        runnable; three were transcribable only.
   *
   * .the bound = the COUNT row survives and keeps its class, exactly as
   *        [case39] (phantom) and [case49] (orphaned) hold. it answers HOW MANY;
   *        the per-tree rows answer WHICH. neither substitutes for the other.
   */
  given(
    '[case57] the 💀 DOWN footer emits a boot per tree, never a prose remainder',
    () => {
      const readCrewPoll = (): string => asCode(readPollWhole());

      // 🔴 .why the assertions are SLICED to the down emitter
      //   `rhx git.crew.boot --tree` appears at the 🪦absent row and at the
      //   ⚠️ORPHANED row ([case49]) in this same file, so a bare `toContain`
      //   passes over the SHIPPED defect and clamps nought. the slice is bounded
      //   by two CODE lines — `readCode` strips comments, so a prose marker is
      //   absent from the slice by construction.
      const downRow = (): string => {
        const src = readCrewPoll();
        const open = src.indexOf('(( DOWN   > 0 ))');
        expect(open).toBeGreaterThan(0); // ANTI-VACUITY: the row must exist
        const shut = src.indexOf('(( ASLEEP > 0 ))', open);
        expect(shut).toBeGreaterThan(open); // ANTI-VACUITY: and must close
        const row = src.slice(open, shut);
        expect(row.length).toBeGreaterThan(60); // ANTI-VACUITY: and hold real text
        return row;
      };

      when('[t0] the down ACTIONS row is read', () => {
        then('🔴 it walks the collected names, never just the first', () => {
          expect(downRow()).toMatch(
            /for __\w+ in "\$\{DOWN_TREES\[@\]:-\}"; do/,
          );
        });

        then('🔴 and emits a runnable boot inside the loop', () => {
          const row = downRow();
          const at = row.indexOf('DOWN_TREES[@]');
          expect(at).toBeGreaterThan(-1); // ANTI-VACUITY: the loop must be in the slice
          expect(row.slice(at)).toContain('rhx git.crew.boot --tree');
        });

        then('🔴 it carries NO prose remainder', () => {
          // the defect itself: `and N more down — <bare names>`.
          expect(downRow()).not.toContain('more down');
        });

        then('the count row survives, and keeps the class it states', () => {
          const row = downRow();
          expect(row).toContain('$DOWN down');
        });
      });

      when('[t1] the pre-fix form is held against the same assertions', () => {
        // .teeth = the emitter exactly as it shipped. a clamp that passes over the
        //   prior form clamps nought (rule.require.clamp-edge-cases).
        const shipped = [
          '(( DOWN   > 0 ))   && ACTIONS+=("💀 $DOWN down       — rhx git.crew.boot --tree ${DOWN_TREES[0]:-<tree>}")',
          '(( DOWN > 1 )) && ACTIONS+=("💀 and $(( DOWN - 1 )) more down — ${DOWN_TREES[*]:1}")',
        ].join('\n');

        then('🔴 it goes RED on the per-tree walk', () => {
          expect(
            /for __\w+ in "\$\{DOWN_TREES\[@\]:-\}"; do/.test(shipped),
          ).toEqual(false);
        });

        then('🔴 and RED on the prose remainder', () => {
          expect(shipped.includes('more down')).toEqual(true);
        });

        then('and the cured form goes GREEN on both', () => {
          const fixed = [
            '(( DOWN   > 0 ))   && ACTIONS+=("💀 $DOWN down       — no live duct")',
            'for __dt in "${DOWN_TREES[@]:-}"; do',
            'ACTIONS+=("💀 NO DUCT — $__dt — boot it: rhx git.crew.boot --tree $__dt")',
            'done',
          ].join('\n');
          expect(
            /for __\w+ in "\$\{DOWN_TREES\[@\]:-\}"; do/.test(fixed),
          ).toEqual(true);
          expect(fixed.includes('more down')).toEqual(false);
          expect(fixed).toContain('rhx git.crew.boot --tree $__dt');
        });

        then(
          '⚠️ and a POINTER to --all does not satisfy it — a row must be runnable',
          () => {
            const pointer =
              '(( DOWN > 1 )) && ACTIONS+=("💀 and $(( DOWN - 1 )) more — rhx git.crew.poll --all")';
            expect(
              /for __\w+ in "\$\{DOWN_TREES\[@\]:-\}"; do/.test(pointer),
            ).toEqual(false);
          },
        );
      });

      when(
        '[t2] the peers that already cured this shape are held unchanged',
        () => {
          // the COUNTER-tooth. a cure that rewrote the footer wholesale would pass
          // [t0] and destroy the three rows that earned their own cases.
          then('👻 phantom still emits per tree ([case39])', () => {
            const src = readCrewPoll();
            expect(src).toContain('for __pt in "${PHANTOM_TREES[@]:-}"; do');
            expect(src).toContain('rhx git.crew.fell --tree $__pt');
          });

          then('⚠️ orphaned still emits per tree ([case49])', () => {
            expect(readCrewPoll()).toContain('$ORPHANED WORK ORPHANED');
          });

          then('👌 fellable still emits per tree, under the whole verb', () => {
            // 🔴 RETARGETED 2026-09-20 — same guarantee, new verb. this tooth read
            //    `rhx git.tree.del --name $__ct${__cg:+ --grove $__cg}`, and the
            //    grove bind was HALF the point: `git.tree.del` is the tree half,
            //    so it leaves the crew ledger row behind and the survivor renders
            //    as `💀 NO DUCT` — the poll recommended a BOOT for trees it had
            //    felled off its own line, twenty minutes earlier.
            //
            //    `git.crew.fell` is the whole verb: it delegates the tree, drops
            //    the ledger row, and derives the grove from that ledger itself. so
            //    the flag retires WITH the verb, and the wrong-box hazard the old
            //    bind guarded is closed by construction (`[case42]`, crewwork).
            //
            //    the property THIS tooth guards is unchanged: the row is emitted
            //    PER TREE, never collapsed into a prose remainder.
            const src = readCrewPoll();
            expect(src).toContain('rhx git.crew.fell --tree $__ct');
          });
        },
      );
    },
  );

  /**
   * .what = the ON-GROVE caveat may not claim the grove failed to answer
   *
   * .why  = measured 2026-09-18, in a live babysit tick. `--fellable` footed with
   *
   *           🌐 6 tree(s) on a grove that did NOT answer — asleep, tunnel
   *              dropped, or the worktree moved
   *
   *         and every one of the six sat on `cloud://grove-sandpine-v20260901` —
   *         the grove that ANSWERED FINE. it answered `git.grove.saturation`, it
   *         carried three live crews in the same poll, and three `crew.heal`
   *         probes reached clones on it in that very tick.
   *
   * 🔴 .the file already KNOWS this, 35 lines above the emitter:
   *
   *      "an UNREACHED grove did not answer. an ON-GROVE tree sits on a grove
   *       that answered fine — the tree half of this poll is local by
   *       construction, so `__poll_one_tree` returns the declined verdict
   *       `🌐 on grove` before any release read runs."
   *
   *    ⇒ so the emitted sentence states the OPPOSITE of the semantics its own
   *    comment declares. that is `term=false-report`: a true claim on one axis
   *    (the release state was not read) dressed as a claim on another (the box
   *    is down).
   *
   * ⚠️ .and it is the SAME FUSION the 2026-09-16 split already cured once, for
   *    the UNREACHED/RETIRED pair — two populations with OPPOSITE cures fused
   *    into one sentence. there the cure was a wake; here it is a remote read.
   *    a supervisor who believes the grove is down halts sprouts on a healthy
   *    box, and the `rhx git.grove.list` this line prescribes then renders it
   *    🟢 live — which contradicts the sentence and settles naught.
   *
   * ⇒ the cure names the real omission: the poll's TREE half is local-only, so
   *   a remote worktree's release state is unread. the grove's health does not
   *   enter into it.
   */
  given(
    '[case50] the ON-GROVE caveat names the real omission, never a dead grove',
    () => {
      const readCrewPoll = (): string => asCode(readPollWhole());

      /**
       * .what = the two emitters, which must stay in step with each other
       * ⚠️ .from readCode, never `read` — the emitted STRING is the subject, and
       *    the docblock above quotes the very sentence under ban. a raw read
       *    would fire on this clamp's own prose
       */
      const genOnGroveRows = (): string[] =>
        readCrewPoll()
          .split('\n')
          .filter((each) => each.includes('ONGROVE_N tree(s)'));

      when('[t0] the caveat rows are located', () => {
        // 🔴 non-vacuity: the filter must find BOTH emitters. a selector that
        //    matched naught would pass [t1] over the shipped defect
        then('both fell-verdict emitters are found', () => {
          expect(genOnGroveRows().length).toEqual(2);
        });
      });

      when('[t1] each row is read for the claim it makes', () => {
        then('not one claims the grove failed to answer', () => {
          for (const row of genOnGroveRows())
            expect(row).not.toContain('did NOT answer');
        });

        // ⚠️ the mirror tooth. "asleep" and "tunnel dropped" are the UNREACHED
        //    vocabulary; on an ON-GROVE row they name a cause that is not in play
        then('and not one borrows the UNREACHED cause list', () => {
          for (const row of genOnGroveRows()) {
            expect(row).not.toContain('asleep');
            expect(row).not.toContain('tunnel dropped');
          }
        });

        // 🔴 the positive half: a cure that merely deleted the clause would pass
        //    both teeth above and leave the reader with no account at all
        then('and each still names why the release state is unread', () => {
          for (const row of genOnGroveRows())
            expect(row).toContain('release state');
        });

        then('and each still carries a runnable next move', () => {
          // 🔴 RETARGETED 2026-09-18, later the same day. this demanded
          //    `rhx git.crew.read --tree`, and that command cannot settle what
          //    the line is about: it reads a PANE, and a pane holds no release
          //    state. so the tooth pinned a fix that could not fix.
          //
          //    the durable claim is "a runnable next move", never the verb. the
          //    move that DOES settle it is a re-run — measured below.
          for (const row of genOnGroveRows())
            expect(row).toContain('rhx git.crew.poll --all --fellable');
        });

        // 🔴 the tooth this case was short of, and the reason its premise was
        //    wrong: `🌐 on grove` is a FAILURE path, not a declined scope.
        //    `__poll_one_tree` sshs (line 1921) and renders this verdict ONLY
        //    where the facts come back EMPTY (line 1934).
        then('🔴 each names the bucket as a read that FAILED', () => {
          for (const row of genOnGroveRows()) {
            expect(row).toContain('UNREAD');
            expect(row).toMatch(/FAILED read/);
          }
        });
      });

      when('[t2] the CODE that decides the verdict is read', () => {
        /**
         * 🔴 .RETARGETED 2026-09-18, hours after this case landed — and the move
         *   is the lesson, not the edit.
         *
         *   this block used to anchor on a COMMENT and said so outright: "the
         *   emitter conforms TO this comment, so the comment is the authority".
         *   the comment read "an ON-GROVE tree sits on a grove that answered
         *   fine — the tree half of this poll is local by construction, so
         *   `__poll_one_tree` returns the declined verdict before any release
         *   read runs."
         *
         * ⚠️ .that comment was STALE, and the whole case rested on it. it was
         *   retired by `__poll_tree_facts_on_grove` on 2026-09-17: the grove arm
         *   sshs per tree, and `🌐 on grove` renders ONLY where those facts come
         *   back empty. so the bucket is a FAILURE path, and "local by
         *   construction" describes code that no longer exists.
         *
         * 🔴 .measured 2026-09-18 — two `--all --fellable` runs minutes apart on
         *   one fleet, grove at runq 13: 9 ON GROVE with an empty fell set, then
         *   6 ON GROVE with a merged tree named. a count that is "local by
         *   construction" cannot vary between two runs of one command.
         *
         *   ⇒ so the premise was refuted twice over — by the code and by the
         *     fleet — while every tooth above it stayed green.
         *
         * ⚠️ .the durable lesson: a clamp that takes a COMMENT as its authority
         *   inherits that comment's staleness, and reports it as a verdict.
         *   `rule.require.trust-but-verify` — verify the claim AND the
         *   instrument that produced it. so this anchors on the CODE, which
         *   cannot drift from what runs.
         *
         * ⚠️ .what SURVIVES from the original case, unchanged and still right:
         *   the render may not tell a supervisor the GROVE is down. it is up —
         *   it answers the crew half of the same poll. only the per-tree read
         *   failed. the [t1] teeth that guard that ban are untouched.
         */
        then(
          'the grove arm SSHes, so this bucket cannot be a declined scope',
          () => {
            const code = asCode(readPollWhole());
            const at = code.indexOf('__poll_one_tree() {');
            expect(at).toBeGreaterThan(-1);
            const body = code.slice(at, at + 2600);
            expect(body).toContain('__poll_tree_facts_on_grove');
          },
        );

        then(
          '🔴 and it renders ON GROVE only where those facts came back EMPTY',
          () => {
            const code = asCode(readPollWhole());
            const at = code.indexOf('__poll_one_tree() {');
            const body = code.slice(at, at + 2600);
            const guard = body.indexOf('if [[ -z "$__facts" ]]; then');
            expect(guard).toBeGreaterThan(-1);
            expect(body.slice(guard, guard + 200)).toContain('on grove');
          },
        );
      });
    },
  );
});
