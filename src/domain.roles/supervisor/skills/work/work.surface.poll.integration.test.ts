/**
 * .what = clamps on how git.crew.poll SWEEPS — boxes, separators, stones, gates, hosts, names
 *
 * .note = a PART of the `work.surface` suite, cut so one reviewer can hold
 *         it whole. the suite's shared fixtures, and its account of what it
 *         runs against and why, live in work.surface.harness.ts.
 */
import { readFileSync } from 'fs';
import { join } from 'path';
import { given, then, when } from 'test-fns';

import { getShellFnBody } from '../../../.test/getShellFnBody';
import {
  asCode,
  DIR_SKILLS,
  DIR_WORK,
  readCode,
  readPollWhole,
} from './work.surface.harness';

describe('work.surface', () => {
  /**
   * .what = git.crew.poll --boxes must surface a STALLED role, not drop it
   *
   * .why  = the flag exists so a babysit tick reads the fleet in ONE call
   *         instead of a per-duct loop (rule.require.bulk-over-byhand). its
   *         whole value rests on the actionable states that survive the join.
   *
   *         its first form keyed the box line on the ⌨️ glyph. a `🚧 PROMPT`
   *         row renders its own header and carries NO keyboard glyph — so
   *         every stalled mechanic was dropped, and dropped as though that
   *         role were not live at all. a false report by omission, aimed at
   *         precisely the one state a tick exists to catch.
   *
   *         measured 2026-08-30 on rhachet.beav.fix-keyrack-daemon-orphan:
   *           duct.poll      -> mechanic 🚧 PROMPT, awaits a decision
   *           crew.poll      -> "at work — foreman:shell"   (mechanic absent)
   *
   * .note = the clamp reads the SOURCE rather than a live fleet, because the
   *         defect is in the parser's key and a live fleet may hold no
   *         stalled role at the moment a suite runs. the key is legible in
   *         the source, and it is what the fix changed.
   */
  given(
    '[case8] git.crew.poll --boxes keys on structure, not on a glyph',
    () => {
      const readCrewPoll = (): string => asCode(readPollWhole());

      when('[t0] the skill is read', () => {
        then('it exists — the clamp is not vacuous', () => {
          expect(readCrewPoll().length).toBeGreaterThan(0);
        });

        then('it declares the --boxes flag', () => {
          expect(/--boxes\)\s+BOXES="true"/.test(readCrewPoll())).toEqual(true);
        });

        then(
          'its box-line key is the 3-space branch, never the keyboard glyph',
          () => {
            // the invariant: duct.poll renders the box line as the LAST child of
            // a duct block. position is the contract; the glyph varies by state.
            expect(/' {3}\u2514\u2500 '\*\)/.test(readCrewPoll())).toEqual(
              true,
            );
          },
        );

        then('it maps the PROMPT state explicitly', () => {
          // a stalled role must reach the render with a verdict of its own
          expect(/\*'PROMPT'\*\)/.test(readCrewPoll())).toEqual(true);
        });

        then('it delegates detection rather than copy the ghost check', () => {
          // .why = a second copy of the prefilled/suggested sgr check would be
          //        two detectors that drift, and a drift there fabricates a
          //        human instruction. ONE detector, one owner.
          expect(/rhx duct\.poll --brief/.test(readCrewPoll())).toEqual(true);
          expect(/capture-pane/.test(readCrewPoll())).toEqual(false);
        });

        then('the detector has teeth against the real offender + fix', () => {
          // the shipped defect: the ⌨️ glyph as the key
          const broken = `      *'\u2328\ufe0f'*)`;
          expect(/' {3}\u2514\u2500 '\*\)/.test(broken)).toEqual(false);

          // the corrected key
          const fixed = `      '   \u2514\u2500 '*)`;
          expect(/' {3}\u2514\u2500 '\*\)/.test(fixed)).toEqual(true);

          // and the row that the broken key dropped — no ⌨️ anywhere in it
          const promptRow =
            '   \u2514\u2500 \ud83d\udea7 PROMPT — mechanic STALLED, awaits a decision';
          expect(promptRow.includes('\u2328')).toEqual(false);
          expect(promptRow.startsWith('   \u2514\u2500 ')).toEqual(true);
        });
      });
    },
  );

  given(
    '[case9] git.crew.poll renders one sense per separator, and no dead advice',
    () => {
      const readCrewPoll = (): string => asCode(readPollWhole());

      when('[t0] the ref column is read', () => {
        then('a BRANCH ref joins on @, never on #', () => {
          // .why = `owner/repo#N` is github's OWN notation for an issue/pr. a
          //        branch rendered as `owner/repo#branch` reads as a pr ref and
          //        points at naught — one separator, two senses, in one column
          const branchFormats = readCrewPoll()
            .split('\n')
            .filter(
              (l) => l.includes("printf '%s\\t") && l.includes('%s/%s@%s'),
            );
          expect(branchFormats.length).toEqual(4);
        });

        then('a PR ref still joins on #, so the two senses stay apart', () => {
          // the pair is the point: @ for a branch AND # for a pr. to settle the
          // ambiguity by a move of BOTH to @ would lose github's real notation
          const prFormats = readCrewPoll()
            .split('\n')
            .filter((l) => l.includes('"$org" "$repo" "$num"'));
          expect(prFormats.length).toBeGreaterThan(0);
          expect(/%s\/%s#%s/.test(readCrewPoll())).toEqual(true);
        });

        then('the separator clamp has teeth against the shipped defect', () => {
          const broken = `printf '%s\\t✋\\tin flight\\twork uncommitted, no commit yet\\t%s/%s#%s\\n'`;
          const fixed = `printf '%s\\t✋\\tin flight\\twork uncommitted, no commit yet\\t%s/%s@%s\\n'`;
          expect(broken.includes('%s/%s@%s')).toEqual(false);
          expect(fixed.includes('%s/%s@%s')).toEqual(true);
        });
      });

      when('[t1] the action footer is read', () => {
        then('it never advises a git.release per tree', () => {
          // .why = rule.require.bulk-over-byhand's own table names `a git.release
          //        per tree` as the NEVER for this exact subject set. a footer
          //        that recommends it sends every reader into the loop this poll
          //        exists to replace
          expect(
            /drill in — run .rhx git\.release./.test(readCrewPoll()),
          ).toEqual(false);
        });

        then(
          'every action line is conditional — none prints unprompted',
          () => {
            // the defect was an UNCONDITIONAL last line. now every entry is pushed
            // under a count guard, and the terminator is computed
            expect(/ACTIONS\+=\(/.test(readCrewPoll())).toEqual(true);
            expect(
              /if \(\( \$\{#ACTIONS\[@\]\} == 0 \)\)/.test(readCrewPoll()),
            ).toEqual(true);
          },
        );

        then('a phantom is subtracted from the unread count', () => {
          // .why = phantom is set exactly when verdict==unknown && no worktree,
          //        so every phantom is ALSO an unknown. an unsubtracted count
          //        double-reports them one line below their own row, and calls
          //        them "unread" when they are GONE — different cures
          expect(
            /UNREAD=\$\(\( .*TALLY\[unknown\].*- PHANTOM \)\)/.test(
              readCrewPoll(),
            ),
          ).toEqual(true);
        });

        then('the phantom-subtraction clamp has teeth', () => {
          const broken =
            'UNREAD=$(( ${TALLY[unknown]:-0} + ${TALLY[timeout]:-0} ))';
          const fixed =
            'UNREAD=$(( ${TALLY[unknown]:-0} + ${TALLY[timeout]:-0} - PHANTOM ))';
          const key = /UNREAD=\$\(\( .*TALLY\[unknown\].*- PHANTOM \)\)/;
          expect(key.test(broken)).toEqual(false);
          expect(key.test(fixed)).toEqual(true);
        });
      });

      when('[t2] the crew glyph is read', () => {
        then(
          'an at-work crew renders the clone face, not the human silhouette',
          () => {
            // .why = 👥 says HUMANS; a crew is a set of CLONES, and rhachet already
            //        fixed 😶 as the org-wide clone domain-root. two glyphs for one
            //        concept is synonym drift (rule.require.ubiqlang)
            expect(
              /crew_glyph="\ud83d\ude36"; crew_state="at work"/.test(
                readCrewPoll(),
              ),
            ).toEqual(true);
            expect(/crew_glyph="\ud83d\udc65"/.test(readCrewPoll())).toEqual(
              false,
            );
          },
        );
      });
    },
  );

  /**
   * [case13] — git.crew.poll --stones renders a MEASUREMENT, never a verdict
   *
   * .why = the `--stones` column exists so a babysit tick can see WHERE on its
   *        route each clone sits without a per-duct read (the byhand loop
   *        rule.require.bulk-over-byhand forbids). one line per role, passed
   *        through verbatim from duct.poll.
   *
   *        the load-bearing decision is what it does NOT print. a stone read
   *        observes which stone and which review level; it observes NAUGHT
   *        about whether the clone still advances — a 6h peer-review turn and
   *        a dead session render the identical line. so a word like `stale`
   *        would be a DIAGNOSIS in a MEASUREMENT's voice, fused into one line
   *        where no reader can part the observed half from the reasoned half
   *        (term=volunteered-diagnosis).
   *
   *        that refusal is invisible in the output — a future author who adds
   *        `stale` produces a report that looks MORE helpful, ships clean, and
   *        no extant test notices. this clamp is the only thing that would. it
   *        is aimed at the decision, never at the wiring.
   *
   * .note = two wiring traps are clamped alongside it, because this same join
   *         shipped a live regression on each shape before:
   *           - LIFECYCLE: the box arm clears `uri` when it records, and the
   *             stone line arrives AFTER the box. a stone arm below that guard
   *             drops every stone, silently, as an absence
   *           - DELIMITER: a stone holds spaces and commas, so the
   *             space-delimited accumulator CREW_BOXES leans on would shred it
   *             into one row per word
   */
  given(
    '[case13] git.crew.poll --stones measures, and refuses to diagnose',
    () => {
      const readCrewPoll = (): string => asCode(readPollWhole());

      when('[t0] the stone recorder is read', () => {
        then(
          'it emits NO staleness verdict — the refusal that makes it honest',
          () => {
            // .why = scoped to the recorder, never the whole file: these words are
            //        legitimate elsewhere (a tree can be `behind`; prose discusses
            //        a stall). a whole-file grep would be a clamp nobody can satisfy.
            const recorder = getShellFnBody({
              text: readCrewPoll(),
              fn: '__crew_record_stone',
            });
            expect(recorder.length).toBeGreaterThan(0); // the slice found its subject

            const emitted = recorder
              .split('\n')
              .filter((line) => /^\s*(CREW_STONES|stone=|echo)/.test(line))
              .join('\n');
            expect(emitted.length).toBeGreaterThan(0); // and it emits something
            for (const verdict of [
              'stale',
              'stalled',
              'blocked',
              'idle',
              'stuck',
            ]) {
              expect(emitted.includes(verdict)).toEqual(false);
            }
          },
        );

        then(
          'the detector has teeth — it fires on the line a future author would add',
          () => {
            // .why = the clamp above asserts an ABSENCE, so it must be shown to
            //        catch the presence it forbids.
            const offender = '  CREW_STONES["$c"]+="${role}=${stone} (stale)"';
            expect(/^\s*(CREW_STONES|stone=|echo)/.test(offender)).toEqual(
              true,
            );
            expect(offender.includes('stale')).toEqual(true);
          },
        );
      });

      when('[t1] the two wiring traps are read', () => {
        then(
          'LIFECYCLE — the stone arm sits ABOVE the `-n "$uri"` guard',
          () => {
            // .why = below it, `uri` is already cleared by the box arm, so every
            //        stone is dropped — as an absence rather than an error.
            const src = readCrewPoll();
            const posStone = src.indexOf('__crew_record_stone "$uri_block"');
            const posGuard = src.indexOf(
              '[[ -n "$uri" ]] || continue',
              posStone,
            );
            expect(posStone).toBeGreaterThan(-1);
            expect(posGuard).toBeGreaterThan(posStone);
          },
        );

        then(
          'DELIMITER — CREW_STONES accumulates on newline, not space',
          () => {
            // .why = a stone holds spaces; a space-delimited map shreds it.
            const src = readCrewPoll();
            expect(
              src.includes(
                'CREW_STONES["$(__crew_canon "$tree")"]+="${role}=${stone}"$\'\\n\'',
              ),
            ).toEqual(true);
          },
        );

        then('--stones implies --boxes — both ride ONE delegated call', () => {
          expect(
            /--stones\)\s+STONES="true"; BOXES="true"/.test(readCrewPoll()),
          ).toEqual(true);
        });
      });
    },
  );

  /**
   * [case14] — the WORK ORPHANED gate keys on SENSE, never on a rendered marker
   *
   * .why = `⚠️ WORK ORPHANED` is the loudest row in the fleet: work exists on
   *        disk and no crew is on it. every other row is a decision; this one
   *        is a countdown. so a silent failure here is the most expensive one
   *        git.crew.poll can have.
   *
   * .the defect this clamps, measured 2026-08-31
   *        the gate read `[[ $crew_state == down && $detail == *"✋ dirty"* ]]`.
   *        `✋ dirty` is a SUFFIX the tree renderer adds — to every verdict
   *        BUT ONE. the `in flight` branch omits it on purpose, because that
   *        verdict already says "work uncommitted, no commit yet" and the
   *        suffix would read as redundant.
   *
   *        and `in flight` is emitted ONLY from inside `if [[ -n "$dirty" ]]`,
   *        so it is dirty BY CONSTRUCTION — the one verdict that cannot exist
   *        without work on disk was the one verdict the gate could not see.
   *
   *        live fleet at the time: 9 down crews, every one on an `in flight`
   *        tree, `ORPHANED=0`, not one alarm rendered.
   *
   * .the class, which is what this clamps rather than the instance
   *        a reader that keys on a STRING ITS SOURCE RENDERS is a reader that
   *        source breaks the next time it re-words — silently, and into the
   *        direction that reads as safe. this file already clamps two prior
   *        instances of the same species in the --boxes join ([case13]).
   *        so the assertion is not "the word `in flight` appears" but "the
   *        gate consults the VERDICT, not the marker alone".
   */
  given(
    '[case14] the WORK ORPHANED gate cannot be silenced by a re-worded marker',
    () => {
      const readCrewPoll = (): string => asCode(readPollWhole());

      when('[t0] the orphan gate is read', () => {
        then('it consults the VERDICT, not the `✋ dirty` marker alone', () => {
          const src = readCrewPoll();

          // the gate must reach the `in flight` verdict — the dirty-by-construction
          // case the marker-only test structurally excluded
          expect(/\$verdict"?\s*==\s*"in flight"/.test(src)).toEqual(true);

          // and it must still honor the marker, for the verdicts that DO carry it
          // (`no pr`, `unpushed`, `merged` all add `$dirty`)
          expect(src.includes('"$detail" == *"✋ dirty"*')).toEqual(true);
        });

        then(
          'the two conditions are an OR, so neither alone can gate it',
          () => {
            const src = readCrewPoll();
            // .why = an AND here would invert the defect: it would demand BOTH the
            //        marker and the verdict, and `in flight` never carries the
            //        marker — so the gate would go permanently silent instead.
            expect(
              /\[\[ "\$detail" == \*"✋ dirty"\* \|\| "\$verdict" == "in flight" \]\]/.test(
                src,
              ),
            ).toEqual(true);
          },
        );

        /**
         * .the teeth — proof this clamp would have gone RED on the live defect
         *
         * the pre-fix source is reconstructed here rather than asserted against,
         * because a clamp that has never been shown to bite is a guess
         * (rule.require.clamp-edge-cases step 2).
         */
        then('it goes RED against the pre-fix gate — the bite proof', () => {
          const gateBefore =
            '  if [[ "$crew_state" == "down" && "$detail" == *"✋ dirty"* ]]; then';

          // the marker-only gate satisfies NEITHER assertion above
          expect(/\$verdict"?\s*==\s*"in flight"/.test(gateBefore)).toEqual(
            false,
          );
          expect(
            /\[\[ "\$detail" == \*"✋ dirty"\* \|\| "\$verdict" == "in flight" \]\]/.test(
              gateBefore,
            ),
          ).toEqual(false);
        });

        then('it counts a LIVE duct whose mechanic holds no clone', () => {
          // .why = `down` means "no live duct", which was taken as the whole of
          //        "no crew at work". a duct OUTLIVES its clone — claude exits,
          //        or was never launched, and its shell stays up. measured
          //        2026-09-03: two rhachet crews, `mechanic:shell`, still 325m,
          //        dirty trees, and NEITHER in `⚠️ 9 WORK ORPHANED`. the tally
          //        undercounted by 2, toward the verdict that looks safe.
          // the gate was refactored from a single `== *"mechanic:shell"*` match
          // to a loop over CREW_BOXES: a LIVE crew whose every non-foreman role
          // reads `shell` is cloneless. assert the loop's durable predicates.
          const src = readCrewPoll();
          expect(src.includes('crew_cloneless')).toEqual(true);
          // fires only on a LIVE crew that HAS box data
          expect(
            /"\$crew_state" == "at work" && -n "\$\{CREW_BOXES\[\$tree\]:-\}"/.test(
              src,
            ),
          ).toEqual(true);
          // a non-foreman role whose box is `shell` is the cloneless signal
          expect(/"\$__ob_box" == "shell"/.test(src)).toEqual(true);
        });

        then('only the MECHANIC box can testify, never the foreman', () => {
          // .why = a foreman is a bare shell BY DESIGN, so `foreman:shell` proves
          //        naught. a gate that consulted it would mark every healthy crew.
          const src = readCrewPoll();
          expect(
            src.includes('"${CREW_BOXES[$tree]:-}" == *"foreman:shell"*'),
          ).toEqual(false);
        });

        then('the action names the CLONE, not a dead crew', () => {
          // .why = the row now fires on crews that are emphatically not dead —
          //        their duct is alive. "a dead crew" would misname two thirds of
          //        what the tally counts, and misname the remedy with it.
          const src = readCrewPoll();
          expect(src.includes('a crew with no clone, on a dirty tree')).toEqual(
            true,
          );
          expect(src.includes('a dead crew on a dirty tree')).toEqual(false);
        });
      });

      when('[t1] the `in flight` renderer is read', () => {
        then(
          'it still omits the marker — the precondition the gate must survive',
          () => {
            const src = readCrewPoll();
            // .why assert the OMISSION rather than repair it
            //   to add ` ✋ dirty` to an "in flight" row would read as redundant
            //   noise to a human, and would fix this ONE gate while it left the
            //   class open for the next reader that keys on the marker. the render
            //   is correct; the gate was wrong. this pins that judgment so a later
            //   round does not "fix" it at the render and quietly re-couple them.
            const inFlight = src
              .split('\n')
              .find((l) =>
                l.includes(
                  '\\t✋\\tin flight\\twork uncommitted, no commit yet',
                ),
              );
            expect(inFlight).toBeDefined();
            expect(inFlight!.includes('$dirty')).toEqual(false);
          },
        );
      });
    },
  );

  /**
   * [case15] — ONE duct sweep per crew poll, and every datum it yields is kept
   *
   * .why = `git.crew.poll --boxes` delegates to `duct.poll --brief`, which is a
   *        WHOLE SECOND SWEEP over every duct. that call is the dominant cost of
   *        the babysit tick, so the rule it lives under is: make it once, and
   *        keep all it returns.
   *
   *        twice now a datum was fetched by that call and dropped on the floor,
   *        and both times the caller paid a SECOND full sweep to get it back:
   *          - the route stone   -> closed by `--stones`  ([case13])
   *          - the motion tally  -> closed here
   *
   * .the sharper cost, and why the second sweep is not merely wasteful
   *        duct.poll refreshes a duct's content-hash baseline ONLY when that
   *        duct moved. so a second sweep, run moments after the first, reports
   *        `unchanged` for every duct the FIRST call saw move — it is not just
   *        redundant, it is LESS TRUE than the call already made.
   *
   *        that is what makes the second sweep a defect rather than an expense,
   *        and it is why this clamps the COUNT rather than the columns: a future
   *        round that meets a third dropped datum must extend the parser, never
   *        add a call.
   */
  given(
    '[case15] the crew poll makes ONE duct sweep and keeps what it returns',
    () => {
      const readCrewPoll = (): string => asCode(readPollWhole());

      when('[t0] the delegation is counted', () => {
        then('there is EXACTLY ONE duct.poll call on the NORMAL path', () => {
          // .why an exact count, not `>= 1`
          //   the regression this guards is an ADDED call, so a lower bound
          //   would pass through the very defect it exists to catch.
          //
          // ⚠️ the subject is ONE RUN, never the file. this once counted every
          //    `rhx duct.poll` in the source, which is a PROXY for "one sweep per
          //    run" — and the proxy broke the day `--search` landed as a
          //    mutually-exclusive early-exit path. two call sites, and no run
          //    reaches both, so the property it names was never violated.
          //
          //    ⇒ so the count is taken over the source with that branch REMOVED.
          //      the bite is unchanged: add a second call to the normal path and
          //      this goes red, exactly as before.
          const src = readCrewPoll();
          const normal = src.slice(
            src.indexOf('\nfi', src.indexOf('if [[ -n "$SEARCH" ]]; then')),
          );
          const calls = normal.match(/rhx duct\.poll/g) ?? [];
          expect(calls.length).toEqual(1);
        });

        then(
          'the second call site is REACHABLE only on a path that exits',
          () => {
            // .why = the exclusion above is earned, never assumed. drop the `exit`
            //        and `--search` falls through into the normal poll — two full
            //        sweeps in one run, which is the defect [case15] exists for.
            const src = readCrewPoll();
            const start = src.indexOf('if [[ -n "$SEARCH" ]]; then');
            expect(start).toBeGreaterThan(-1);
            const branch = src.slice(start, src.indexOf('\nfi', start));
            expect(branch.includes('rhx duct.poll')).toEqual(true);
            expect(branch.includes('exit 0')).toEqual(true);
          },
        );
      });

      when('[t1] the motion tally parser is read', () => {
        then(
          'it keys on the COLON, which is what parts a tally from a verdict',
          () => {
            const src = readCrewPoll();
            // duct.poll renders a per-duct verdict as `🌊 changed` and its summary
            // as `🌊 changed: N` — under the SAME `   ├─ ` prefix. so position
            // cannot part them and content must (the r1/r2 lesson, [case13]).
            expect(src.includes("*'🌊 changed: '*)")).toEqual(true);
            expect(src.includes("*'🧊 unchanged: '*)")).toEqual(true);
          },
        );

        then(
          'it goes RED against a prefix-keyed parser — the bite proof',
          () => {
            // a parser keyed on the tree-prefix alone matches BOTH the per-duct
            // verdict and the summary, so it would score the last duct's verdict
            // as the fleet tally — a plausible number, silently wrong.
            const parserBefore =
              '      \'   ├─ \'*) DUCT_CHANGED="${line##*changed}"; continue ;;';
            expect(parserBefore.includes("*'🌊 changed: '*)")).toEqual(false);
          },
        );

        then(
          'the tally is labelled DUCTS, so it cannot be read as crews',
          () => {
            const src = readCrewPoll();
            // .why = one crew holds several ducts, and a foreman shell moves on its
            //        own. an unlabelled "5 changed" beside a crew list reads as
            //        "5 crews moved" — the reader-inference family of false report.
            expect(/🌊 ducts moved — \$DUCT_CHANGED changed/.test(src)).toEqual(
              true,
            );
          },
        );
      });
    },
  );

  /**
   * [case16] — a two-source row must never let one source overwrite the other's claim
   *
   * .why = the crew row joins two INDEPENDENT sources:
   *          crew_state  <- live tmux sessions   (the only proof of `at work`)
   *          CREW_BOXES  <- duct.poll's output   (the duct REGISTRY)
   *
   *        the box list was substituted for `crew_who` unconditionally, so when
   *        the sources disagreed the row rendered its own contradiction:
   *
   *            💀 crew: down — foreman:shell mechanic:shell
   *
   *        i.e. *"this crew has no live duct — here are its two ducts' pane
   *        states."* observed 2026-08-31 across NINE rows at once.
   *
   * .the cost is not merely a confused reader
   *        `down`'s crew_who carries the CURE (`rhx git.crew.boot`). the
   *        overwrite spent that line on a box list that implies the opposite
   *        move — so the loudest rows in the fleet lost their only next step.
   *
   * .why this clamps the CLASS, not the string
   *        the defect is not `shell`; it is an unguarded substitution across a
   *        source boundary. any future datum joined from duct.poll — a stone, an
   *        age, a box — inherits it unless the guard sits on crew_state itself.
   */
  given(
    '[case16] the crew row never lets a registry-derived box overwrite a tmux verdict',
    () => {
      const readCrewPoll = (): string => asCode(readPollWhole());

      when('[t0] the box-substitution branch is read', () => {
        then('it is gated on a crew_state of `at work`', () => {
          const src = readCrewPoll();
          expect(
            /if \[\[ "\$BOXES" == "true" && "\$crew_state" == "at work" && -n "\$\{CREW_BOXES\[\$tree\]:-\}" \]\]/.test(
              src,
            ),
          ).toEqual(true);
        });

        then('it goes RED against the pre-fix branch — the bite proof', () => {
          // .why reconstructed rather than asserted against: a clamp never shown
          //      to bite is a guess (rule.require.clamp-edge-cases step 2).
          const branchBefore =
            '  if [[ "$BOXES" == "true" && -n "${CREW_BOXES[$tree]:-}" ]]; then';
          expect(
            /if \[\[ "\$BOXES" == "true" && "\$crew_state" == "at work" && -n "\$\{CREW_BOXES\[\$tree\]:-\}" \]\]/.test(
              branchBefore,
            ),
          ).toEqual(false);
        });
      });

      when('[t1] a non-at-work crew is rendered', () => {
        then(
          'the else branch still carries crew_who, so the cure survives',
          () => {
            const src = readCrewPoll();
            // a `down` crew must keep `no live duct — rhx git.crew.boot`; that is
            // the one actionable datum the row has, and the overwrite consumed it.
            expect(src.includes('crew: $crew_state — $crew_who')).toEqual(true);
          },
        );

        then('the down branch still names boot as its cure', () => {
          const src = readCrewPoll();
          expect(src.includes('no live duct — rhx git.crew.boot')).toEqual(
            true,
          );
        });
      });
    },
  );

  /**
   * [case17] — EVERY consumer of CREW_BOXES is at-work gated, and the box tally
   *            keys on the CLASS (not-empty) rather than on a named state
   *
   * .why = [case16] pinned ONE branch by exact string, and named a class wider
   *        than the string it pinned:
   *
   *          "any future datum joined from duct.poll — a stone, an age, a box —
   *           inherits it unless the guard sits on crew_state itself"
   *
   *        that prediction came true on 2026-09-01. a NEW consumer of
   *        CREW_BOXES — the box tally — landed ~170 lines below, ungated, and
   *        swept `down` + `phantom` crews into a fleet count. it reported
   *        `❔unknown × 2` where exactly ONE at-work role held that box, so the
   *        number reconciled against no row on screen.
   *
   * .the three subject sets, each wrong in a DIFFERENT direction
   *        1. the stone tally       dropped every live role whose box was not empty
   *        2. the 🚧-only box line  dropped every live role at a non-modal box
   *        3. the ungated tally     swept in dead crews
   *
   *        a partial audit whose every repair was itself one. so this clamps
   *        both halves at once: the GATE (defects 2 + 3) and the KEY (1 + 2).
   *
   * .why it clamps a STRUCTURE, never a string
   *        [case16] could not see a second consumer appear elsewhere in the
   *        file, because it asserted one `if` line verbatim. this walks EVERY
   *        dereference of a per-crew box list and demands a gate above each —
   *        so consumer number three is caught the day it lands.
   */
  given(
    '[case17] every CREW_BOXES consumer is at-work gated, and the tally keys on the class',
    () => {
      const readCrewPoll = (): string => asCode(readPollWhole());

      /**
       * .what = each line that dereferences a PER-CREW box list, with its index
       * .why  = `${#CREW_BOXES[@]}` and `${!CREW_BOXES[@]}` are a size probe and a
       *         key walk; neither reads a crew's roles, so neither needs the gate.
       */
      const getBoxConsumers = (
        src: string,
      ): { line: string; index: number }[] =>
        src
          .split('\n')
          .map((line, index) => ({ line, index }))
          .filter((row) => /\$\{CREW_BOXES\[\$\w+\]/.test(row.line));

      /** .what = true when an at-work gate sits on, or within 8 lines above, the consumer */
      const hasGateAbove = (src: string, index: number): boolean =>
        src
          .split('\n')
          .slice(Math.max(0, index - 8), index + 1)
          .some((line) => /crew_state" == "at work"|CREW_ROLES\[/.test(line));

      when('[t0] every per-crew box dereference is walked', () => {
        then('at least two exist — the crew row and the tally', () => {
          // .why a floor: a clamp that passes when its subject is absent proves
          //      naught. delete both consumers and the walk below goes vacuous.
          expect(getBoxConsumers(readCrewPoll()).length).toBeGreaterThanOrEqual(
            2,
          );
        });

        then('each one sits under an at-work gate', () => {
          const src = readCrewPoll();
          const ungated = getBoxConsumers(src)
            .filter((row) => !hasGateAbove(src, row.index))
            .map((row) => `${row.index + 1}: ${row.line.trim()}`);
          expect(ungated).toEqual([]);
        });

        then('it goes RED against the ungated tally — the bite proof', () => {
          const before = [
            'if [[ "$BOXES" == "true" && "${#CREW_BOXES[@]}" -gt 0 ]]; then',
            '  declare -A BOX_TALLY=()',
            '  for __bt in "${!CREW_BOXES[@]}"; do',
            "    for __br in $(printf '%s\\n' ${CREW_BOXES[$__bt]} | sort -u); do",
          ].join('\n');
          const consumers = getBoxConsumers(before);
          expect(consumers.length).toBeGreaterThan(0);
          expect(
            consumers.every((row) => hasGateAbove(before, row.index)),
          ).toEqual(false);
        });
      });

      when('[t1] the box tally key is read', () => {
        then(
          'it excludes the empty/shell pair, so it keys on the class',
          () => {
            const src = readCrewPoll();
            expect(
              /case "\$__bs" in empty\|shell\|''\) continue ;; esac/.test(src),
            ).toEqual(true);
          },
        );

        then(
          'no named-state counter survives — the 🚧-only cure is gone',
          () => {
            // .why by name: BOX_PROMPT was the instance-scoped counter, and its
            //      return would silently re-narrow the subject set to one state.
            expect(readCrewPoll().includes('BOX_PROMPT')).toEqual(false);
          },
        );

        then('it goes RED against the 🚧-only cure — the bite proof', () => {
          const before =
            '      case "$__br" in *\'🚧\'*) (( BOX_PROMPT++ )) ;; esac';
          expect(
            /case "\$__bs" in empty\|shell\|''\) continue ;; esac/.test(before),
          ).toEqual(false);
          expect(before.includes('BOX_PROMPT')).toEqual(true);
        });
      });
    },
  );

  /**
   * [case18] — a non-empty box on a STILL duct is joined and surfaced as an
   *            ACTIONS row, and that row names a READ and naught else
   *
   * .why = the sweep already held both halves and rendered them APART: the box
   *        state on the crew line, the still-age two rows below. so the join was
   *        left to the reader's eye, and an eye that scans 18 crews will miss it.
   *
   *        evidenced 2026-09-01. a human typed into `test-fns/mechanic` and did
   *        not press enter. the clone parked. the poll reported the box and the
   *        stillness on two separate lines, tick after tick, and 14 minutes of
   *        dead time accrued before a reader happened to put them together.
   *
   * .why STILL is the whole threshold
   *        a duct that MOVED is a duct somebody is on, so no invented age cutoff
   *        is owed. CREW_MOTION already lists only the ducts that did not move,
   *        so the join IS the condition.
   *
   * .why the row names a READ and naught else
   *        a non-empty box on a still duct has four causes, and they take four
   *        different moves:
   *          - PREFILLED   a human typed, unsent          -> relay with Enter
   *          - a ghost     an autocomplete suggestion     -> send no key at all
   *          - QUEUED      already sent, held             -> send no key at all
   *          - a modal     awaits a decision              -> judge it, then --keys
   *        the poll cannot part those four, so a row that named a cause would be
   *        a volunteered diagnosis (term=volunteered-diagnosis). it emits the
   *        observable half — a box, unmoved, for this long — and withholds the
   *        reasoned half. the one move correct under all four causes is a read.
   */
  given(
    '[case18] the poll joins a non-empty box to a still duct and names a read',
    () => {
      const readCrewPoll = (): string => asCode(readPollWhole());

      when('[t0] the join is read', () => {
        then('the box walk collects into STALLED_BOXES', () => {
          expect(readCrewPoll().includes('STALLED_BOXES+=(')).toEqual(true);
        });

        then('it joins against CREW_MOTION — the still-duct map', () => {
          expect(readCrewPoll().includes('${CREW_MOTION[$__bt]:-}')).toEqual(
            true,
          );
        });

        then('the join sits INSIDE the at-work gate, never above it', () => {
          // .why [case17] proved a consumer can land ungated 170 lines away. this
          //      pins the order: the gate must precede the join, so a `down` crew's
          //      registry rows can never reach the ACTIONS list.
          const lines = readCrewPoll().split('\n');
          const gate = lines.findIndex((line) =>
            line.includes('[[ -n "${CREW_ROLES[$__bt]:-}" ]] || continue'),
          );
          const join = lines.findIndex((line) =>
            line.includes('${CREW_MOTION[$__bt]:-}'),
          );
          expect(gate).toBeGreaterThan(-1);
          expect(join).toBeGreaterThan(gate);
        });
      });

      when('[t1] the surfaced row is read', () => {
        then('it renders as an ACTIONS row', () => {
          expect(readCrewPoll().includes('✋ BOX UNMOVED')).toEqual(true);
        });

        then('it carries the age, so the reader sees how long', () => {
          expect(readCrewPoll().includes('still $__bage')).toEqual(true);
        });

        then(
          'its named move is a raw read, deep enough to hold the queued case',
          () => {
            // .why --raw: colour is the ONLY tell between a typed message and an
            //      autocomplete ghost. --lines 20: a queued message renders ABOVE
            //      the live box, so a shallow capture holds the placeholder alone.
            expect(readCrewPoll().includes('--raw --lines 20')).toEqual(true);
          },
        );

        then('it volunteers NO cause — the row is a measurement', () => {
          const row = readCrewPoll()
            .split('\n')
            .filter((line) => line.includes('✋ BOX UNMOVED'))
            .join('\n');
          expect(row).not.toEqual('');
          expect(row.includes('read it')).toEqual(true);
          expect(
            /unsent|walked away|forgot|busy|will consume|awaits a key/.test(
              row,
            ),
          ).toEqual(false);
        });
      });
    },
  );

  /**
   * [case20] — the crew poll asks EVERY host, and declares the ones it could not
   *
   * .why = `crew.boot --grove cloud://<g>` has put a crew's ducts on a remote
   *        grove since it shipped, so the WRITE side speaks grove. the READ
   *        side asked `localhost` and nought else.
   *
   *        a live grove crew therefore missed the tmux arm, fell through to the
   *        registry-row arm, and rendered `👻 phantom` — the verdict for a crew
   *        whose tree AND ducts are both GONE — of a crew at work on a box the
   *        poll never asked. that is term=phantom's own forbidden read, made by
   *        the one instrument that names the word.
   *
   *        worse, the BOX half never had the gap: __crew_gather_boxes shells
   *        out to duct.poll, which spans hosts. so a single row could carry a
   *        true box verdict beside a phantom crew verdict — two derivations of
   *        unequal reach inside one report, and no reader could see the seam.
   */
  given(
    '[case20] the crew poll derives across hosts, and names what it could not read',
    () => {
      const readCrewPoll = (): string => asCode(readPollWhole());

      when('[t0] the session derivation is read', () => {
        then('it does NOT pin the derivation to localhost alone', () => {
          // .why = the exact line that shipped. `localhost` still appears, as the
          //        first host asked — what must not survive is it as the ONLY one.
          const src = readCrewPoll();
          expect(
            /done < <\(__duct_list_host_sessions localhost\)/.test(src),
          ).toEqual(false);
        });

        then('it walks the registered hosts', () => {
          expect(readCrewPoll().includes('__duct_host_list')).toEqual(true);
        });

        then(
          'it still asks this machine — a remote walk that dropped local would be worse',
          () => {
            expect(
              readCrewPoll().includes('__crew_derive_sessions localhost'),
            ).toEqual(true);
          },
        );
      });

      when('[t1] an unreachable host is considered', () => {
        then('it is collected, never absorbed', () => {
          // .why = silence from a hibernated grove is byte-identical to "this
          //        grove holds no crews". to swallow it restores the phantom
          //        defect one layer in (term=partial-audit).
          expect(readCrewPoll().includes('HOSTS_UNREACHED+=(')).toEqual(true);
        });

        then(
          'it is declared in the HEADER, above the verdicts it qualifies',
          () => {
            const lines = readCrewPoll().split('\n');
            const caveat = lines.findIndex((line) =>
              line.includes('UNREACHED:'),
            );
            const readLine = lines.findIndex((line) =>
              line.includes('read: parallel, read-only'),
            );
            expect(caveat).toBeGreaterThan(-1);
            expect(readLine).toBeGreaterThan(caveat);
          },
        );

        /**
         * the header caveat — its `UNREACHED:` line AND the child beneath it.
         *
         * ⚠️ a `.filter(includes('UNREACHED'))` is NOT this subject, and it was
         *    what this block used until 2026-09-03. two defects rode in it:
         *
         *    1. the payload sits on the CHILD line, which carries no `UNREACHED`
         *       token at all — so the true subject was excluded entirely
         *    2. `HOSTS_UNREACHED[0]` appears in the ACTION row 600 lines below,
         *       so the filter swept in an unrelated line and `git.grove.wake`
         *       matched THERE. the assertion was green about the wrong artifact
         *
         * ⇒ a filter is a subject set, and a token that appears elsewhere in the
         *   file makes it the wrong one (term=partial-audit, the WIDE form).
         */
        const readCaveat = (): string => {
          const lines = readCrewPoll().split('\n');
          const i = lines.findIndex((line) => line.includes('⚠️  UNREACHED:'));
          return i < 0 ? '' : lines.slice(i, i + 2).join('\n');
        };

        then('the caveat names the fix, and does not assert one cause', () => {
          expect(readCaveat().includes('git.grove.wake')).toEqual(true);
        });

        then(
          'the caveat names a COUNT — it no longer corrects a verdict',
          () => {
            // ⚠️ this assertion once read `caveat.includes('MAY be at work')`, and
            //    it was GREEN over the defect it now forbids.
            //
            // .why = that hedge was the right repair while the ROW was wrong: a
            //        crew on a hibernated grove rendered `💀 down`, and the header
            //        line existed to tell the reader not to believe it. so the
            //        clamp graded the footnote and never asked whether a footnote
            //        was the right artifact.
            //
            //        it is not. a verdict that needs a footnote to be read
            //        correctly is the WRONG VERDICT — a reader who meets the row
            //        without the header is handed `down`, whose paved cure is a
            //        `crew.boot` that would fail on a box that is not up. so the
            //        cure moved onto the row itself (`😴 asleep`), and this line
            //        now names a count rather than corrects a claim.
            const caveat = readCaveat();
            expect(caveat.includes('😴 asleep')).toEqual(true);
            expect(caveat.includes('NOT down')).toEqual(true);
            expect(readCrewPoll().includes('MAY be at work')).toEqual(false);
          },
        );
      });

      /**
       * [t2] — the unreached set holds TWO populations, and one cure fits ONE
       *
       * 🔴 measured 2026-09-16, in prod. the row read:
       *      ⚠️  UNREACHED: …v20260811.ground …v20260810 …v20260811 …v20260810.ground
       *      └─ crews there render 😴 asleep … rhx git.grove.wake <grove>
       *
       *    `git.grove.list` held FOUR registry entries, and none was v20260810.
       *    the prescribed cure, run against it:
       *      🐢 bummer dude — grove 'grove-sandpine-v20260810' is not registered
       *    exit 2.
       *
       *    so half the names carried a command that cannot work, beneath a
       *    sentence that cannot be true — `😴 asleep` claims a box is there and
       *    quiet, where the forest holds no such box at all.
       *
       *    `rule.require.enumerate-before-you-name`, the NINTH instance: the row
       *    named ONE cause (no answer) for a set that holds TWO (no answer, and
       *    no grove), and the two take opposite cures.
       */
      when('[t2] an unreached host is held against the grove registry', () => {
        then(
          'the set is PARTED before it is rendered, never rendered whole',
          () => {
            const src = readCrewPoll();
            expect(src.includes('__unreached_asleep')).toEqual(true);
            expect(src.includes('__unreached_gone')).toEqual(true);
            // and the whole-set expansion that fused them is gone
            expect(src.includes('UNREACHED: ${HOSTS_UNREACHED[*]}')).toEqual(
              false,
            );
          },
        );

        then(
          'it parts on the SAME registry test git.grove.wake itself applies',
          () => {
            // two surfaces that disagree about who is registered would put the
            // reader back where they started — told to wake a grove that refuses
            const registry = 'groves/$__u.json';
            expect(readCrewPoll().includes(registry)).toEqual(true);
            expect(
              readCode(join(DIR_SKILLS, 'git.grove.wake.sh')).includes(
                'groves/$GROVE.json',
              ),
            ).toEqual(true);
          },
        );

        then('a RETIRED grove gets its own row, and its own verb', () => {
          const src = readCrewPoll();
          const lines = src.split('\n');
          const i = lines.findIndex((line) => line.includes('⚠️  RETIRED:'));
          expect(i).toBeGreaterThan(-1);
          const row = lines.slice(i, i + 2).join('\n');
          // 🔴 the whole point: the wake is NAMED as what fails here, never
          //    prescribed. a clamp that merely asserted the row exists would
          //    stay green if the row carried the wrong cure.
          expect(row.includes('NOT in the forest')).toEqual(true);
          expect(row.includes('a wake exits 2 here')).toEqual(true);
          expect(/rhx git\.grove\.wake <grove>/.test(row)).toEqual(false);
        });

        then('a RETIRED grove names its crews ORPHANS, never asleep', () => {
          // `😴 asleep` says the box is there and quiet. for a grove the forest
          // does not hold, that is a false report on the sharpest axis a
          // supervisor reads — it says wait, where the truth says act.
          const lines = readCrewPoll().split('\n');
          const i = lines.findIndex((line) => line.includes('⚠️  RETIRED:'));
          const row = lines.slice(i, i + 2).join('\n');
          expect(row.includes('ORPHANS')).toEqual(true);
          expect(row.includes('😴 asleep')).toEqual(false);
        });

        then(
          'each row renders only when its own population is non-empty',
          () => {
            // a fleet whose every unreached grove is retired must print NO asleep
            // row, and the reverse. a single unguarded pair would print an empty
            // caveat, which reads as a caveat that applies to nobody
            const src = readCrewPoll();
            expect(
              /\(\( \$\{#__unreached_asleep\[@\]\} > 0 \)\)/.test(src),
            ).toEqual(true);
            expect(
              /\(\( \$\{#__unreached_gone\[@\]\} > 0 \)\)/.test(src),
            ).toEqual(true);
          },
        );
      });
    },
  );

  /**
   * [case26] — a crew's GROVE outlives its session, and an unread box is not a dead one
   *
   * .why = [case20] taught the poll to ASK every host. it left two holes, and
   *        both are the same shape one layer in: a claim drawn about a box
   *        nobody could speak for.
   *
   *   1. the HOST was learned from live sessions ALONE. so a crew that is DOWN
   *      on a grove learned its host nowhere — and `__poll_one_tree` then read
   *      THIS disk for a tree that sits on a grove, found nought, and rendered
   *      `👻 phantom — tree is gone`.
   *
   *      measured 2026-09-02 on `demo-grove-dispatch`, with the grove AWAKE and
   *      the worktree plainly present on it. so hibernation is not the cause —
   *      it merely makes the same defect louder. the cure is the ledger, which
   *      carries `grove` per row and outlives every session (term=ledger:
   *      existence outlives liveness).
   *
   *   2. an UNREACHED grove's crews rendered `💀 down`. that is a claim about
   *      the world — a crew died, its tree stands, boot it — drawn from a box
   *      we never got to look at. its paved cure would fail on a machine that
   *      is not up, so the reader is routed to the wrong repair entirely.
   *
   *      the prior repair was a HEADER caveat ("MAY be at work"). a verdict
   *      that needs a footnote to be read correctly is the wrong verdict, so
   *      the cure moved onto the row: `😴 asleep`, a claim about the READ.
   */
  given(
    '[case26] the crew poll places a DOWN crew, and refuses to judge an unread one',
    () => {
      const readCrewPoll = (): string => asCode(readPollWhole());

      /** the text between two markers, without a non-null assertion */
      const between = (held: string, open: string, close: string): string => {
        const i = held.indexOf(open);
        if (i < 0) return '';
        const rest = held.slice(i + open.length);
        const j = rest.indexOf(close);
        return j < 0 ? rest : rest.slice(0, j);
      };

      when('[t0] the host derivation is read', () => {
        then(
          'the ledger supplies a host, so a DOWN crew is still placed',
          () => {
            // .why = live sessions place a crew that is AT WORK. the ledger is the
            //        only source that survives the session, so it is the only one
            //        that can place a crew that is not.
            const held = readCrewPoll();
            expect(held.includes('__crew_ledger_rows')).toEqual(true);
            expect(held.includes('__crew_grove_host "$g"')).toEqual(true);
          },
        );

        then(
          'LIVE sessions outrank it — the ledger fills only what is UNSET',
          () => {
            // ⚠️ `-v`, never `:-`. a LOCAL crew's host is the empty string, which
            //    is a legitimate VALUE and not an absence — so a `:-` guard would
            //    re-derive from the ledger every sweep and quietly outrank the one
            //    source that reads the world as it is NOW. a crew booted local and
            //    ledgered on a grove would then be asked of the wrong box.
            const held = readCrewPoll();
            expect(
              held.includes('if [[ ! -v CREW_HOST["$__c"] ]]; then'),
            ).toEqual(true);

            // aimed at the CLASS: no re-derivation anywhere may use the `:-` form,
            // not merely the one written today (term=clamp — a clamp's jurisdiction
            // is its assertion, so a pinned line would hold one site of many).
            expect(
              /CREW_HOST\[[^\]]+\]:-[^}]*\}="?\$\(__crew_grove_host/.test(held),
            ).toEqual(false);
          },
        );

        then(
          'the ledger pass runs AFTER the session pass, never before',
          () => {
            // .why = the `-v` guard is what makes live outrank the ledger, and a
            //        guard only outranks what already ran. reverse the two and the
            //        guard holds while the precedence inverts — green, and wrong.
            const held = readCrewPoll();
            expect(
              held.indexOf('__crew_derive_sessions localhost'),
            ).toBeLessThan(held.indexOf('done < <(__crew_ledger_rows)'));
          },
        );
      });

      when('[t1] the crew-state chain is read', () => {
        /** the chain, from its `down` default down to its last arm */
        const readChain = (): string =>
          between(readCrewPoll(), 'crew_glyph="💀"; crew_state="down"', '\nfi');

        then(
          'an unreached host has an arm of its OWN, never the down default',
          () => {
            // .why = `down` is the base the chain starts at, so every state that
            //        fails to claim an arm lands there silently. an unreached grove
            //        yields an empty session list — byte-identical to a grove that
            //        holds no crew — so absent an explicit arm it reads as `down`
            //        by construction, and no reader can see the difference.
            const chain = readChain();
            expect(
              chain.includes('__crew_host_unreached "$crew_host"'),
            ).toEqual(true);
            expect(chain.includes('crew_state="asleep"')).toEqual(true);
          },
        );

        then(
          'the asleep arm names a WAKE — never the boot that would fail',
          () => {
            // .why = the two cures are on different machines. `crew.boot` against a
            //        hibernated grove fails, so to route a reader there is worse
            //        than silence (rule.require.errors-name-the-fix).
            const chain = readChain();
            const iAsleep = chain.indexOf('crew_state="asleep"');
            const cure = chain.slice(iAsleep, iAsleep + 200);
            expect(cure.includes('git.grove.wake')).toEqual(true);
            expect(cure.includes('git.crew.boot')).toEqual(false);
          },
        );

        then(
          'it sits ABOVE phantom, so an unread grove can never fall to litter',
          () => {
            // .why = `phantom` is the terminal verdict on this axis — its cure is a
            //        fell. reached about a box nobody asked, it invites a reader to
            //        clean up a crew that is merely asleep.
            const chain = readChain();
            expect(chain.indexOf('crew_state="asleep"')).toBeLessThan(
              chain.indexOf('crew_state="phantom"'),
            );
          },
        );

        then(
          'phantom is gated on LOCALITY — it may not be said of a grove',
          () => {
            // .why = every read that yields `no worktree` is a read of THIS box, so
            //        the verdict it feeds may only be asserted of a crew that lives
            //        here. said of a cloud crew it claimed `tree is gone` about a
            //        grove nobody asked — measured awake, worktree present
            //        (term=phantom, term=false-report).
            const chain = readChain();
            const iPhantom = chain.indexOf('crew_state="phantom"');
            const arm = chain.slice(0, iPhantom);
            const iGuard = arm.lastIndexOf('elif [[ -z "$crew_host"');
            expect(iGuard).toBeGreaterThan(-1);
            expect(arm.slice(iGuard).includes('no worktree')).toEqual(true);
          },
        );
      });

      when('[t2] the report is read', () => {
        then('the asleep count rides in the HEADLINE, not a footnote', () => {
          // .why = it is the count of crews this sweep DID NOT READ, and a reader
          //        who takes the other three as a total is owed that number in
          //        the same breath (term=partial-audit — an instrument owes its
          //        reader the subject set it could not reach).
          const held = readCrewPoll();
          expect(held.includes('CREWSUM+=", $ASLEEP asleep"')).toEqual(true);
        });

        then('it is offered as an ACTION, above the litter row', () => {
          // .why = it is the only row here whose cure is on a DIFFERENT machine.
          //        a reader who meets it beneath the phantom row prices it as
          //        litter, and litter is a row you ignore.
          const held = readCrewPoll();
          const iAsleep = held.indexOf('ACTIONS+=("😴');
          const iPhantom = held.indexOf('ACTIONS+=("👻');
          expect(iAsleep).toBeGreaterThan(-1);
          expect(iPhantom).toBeGreaterThan(iAsleep);
        });

        then('the legend declares it, and says WHAT parts it from down', () => {
          // .why = the pair is told apart by whether we could LOOK, never by what
          //        we saw. a legend that lists the glyph and omits that leaves a
          //        reader to infer a difference the states do not show.
          //
          // .note = read RAW, not via readCode. a legend IS commentary, so it is
          //         the one subject the comment-strip would erase entirely — and
          //         an erased subject reads as an absent claim, green either way.
          const legend = readPollWhole().split('__poll_one_tree')[0] ?? '';
          expect(legend.includes('😴 asleep')).toEqual(true);
          expect(legend.includes('a claim about the READ')).toEqual(true);
        });
      });
    },
  );

  /**
   * .what = no rendered line may print the VALUE of `DISPLAY`. the map holds the
   *         raw tmux session name (`a_b_c`); every key of it is the canonical
   *         slug (`a.b.c`), and the slug is what `--tree` and every other row of
   *         the render speak.
   *
   * 🔴 .why it is a SOURCE clamp, whole-file, rather than one fixture
   *         this file already names the defect, in its own words, at
   *         git.crew.poll.sh:2484:
   *
   *           "🔴 .the name here is `$tree`, and NEVER `DISPLAY[$tree]`
   *            DISPLAY holds the raw tmux SESSION name (`a_b_c`), and `$tree`
   *            holds the canonical slug (`a.b.c`)."
   *
   *         that comment was written 2026-09-05 and it cured exactly ONE row —
   *         the failed-tree collector it sits above. EIGHT ACTIONS rows kept the
   *         `${DISPLAY[$x]:-$x}` shape, so the cure never reached them.
   *         ⇒ a per-row fixture would have gone green on the one cured row and
   *           said naught about the eight. only a whole-file read can state the
   *           invariant the comment actually claims.
   *
   * 🔴 .measured 2026-09-18, in ONE render, from ONE poll:
   *           tree row    — rhachet-roles-bhrain.beav.feat-acceptance-under-5min
   *           ACTIONS row — rhachet-roles-bhrain_beav_feat-acceptance-under-5min
   *         two names for one tree, side by side, and a reader cannot tell
   *         whether they are the same crew. the CONTEXT LOW row carried the same
   *         split in the same output, so this was never one row's slip.
   *         ⇒ clamped verbatim at
   *           work/.test/.assets/render.poll.one-tree-rendered-under-two-names.log
   *
   * ⚠️ .the MEMBERSHIP read stays legal, and that is the whole nuance
   *         `[[ -v DISPLAY["$t"] ]]` asks "does this tree hold a live tmux
   *         session?" — a liveness test the unsponsored-anomaly sweep depends
   *         on, and it reads no value at all. a clamp that banned the identifier
   *         outright would delete a correct consumer to cure a render defect
   *         (rule.forbid.overzealous-blockers), so it bans the DEREFERENCE and
   *         leaves `-v` alone.
   */
  given(
    '[case48] one tree renders under ONE name — DISPLAY is a liveness set, never a label',
    () => {
      const readCrewPoll = (): string => asCode(readPollWhole());

      /**
       * every dereference of the map — `${DISPLAY[...]}`, with or without a
       * default. deliberately NOT `DISPLAY[` bare, which also matches the
       * assignment and the `-v` membership test.
       */
      const derefs = (src: string): string[] =>
        src.split('\n').filter((l) => /\$\{DISPLAY\[/.test(l));

      when('[t0] the poll source is read', () => {
        then('it exists — the clamp is not vacuous', () => {
          expect(readCrewPoll().length).toBeGreaterThan(0);
        });

        then(
          '🔴 NO line dereferences DISPLAY — the canon key is the only name',
          () => {
            expect(derefs(readCrewPoll())).toEqual([]);
          },
        );

        then(
          'the map is still POPULATED — this bans a read, never the record',
          () => {
            // .why = the liveness sweep below needs the key to exist. a cure that
            //        deleted the assignment would take the anomaly row with it
            expect(/DISPLAY\["\$__c"\]=/.test(readCrewPoll())).toEqual(true);
          },
        );

        then('✅ and the MEMBERSHIP test survives, untouched', () => {
          expect(/\[\[ -v DISPLAY\["\$t"\] \]\]/.test(readCrewPoll())).toEqual(
            true,
          );
        });
      });

      when(
        '[t1] the clamp is aimed at the shipped defect and at the fix',
        () => {
          then('🔴 it BITES the exact shape eight rows carried', () => {
            const broken =
              '    ACTIONS+=("⛔ DECLINE PARKED — ${DISPLAY[$__tt]:-$__tt}/${__drole} had a modal REFUSED")';
            expect(derefs(broken).length).toEqual(1);
          });

          then('and it PASSES the bare canon key the cure uses', () => {
            const fixed =
              '    ACTIONS+=("⛔ DECLINE PARKED — ${__tt}/${__drole} had a modal REFUSED")';
            expect(derefs(fixed)).toEqual([]);
          });

          then(
            '⚠️ and it does NOT bite the membership test it must leave alone',
            () => {
              const liveness = '      if [[ -v DISPLAY["$t"] ]]; then';
              expect(derefs(liveness)).toEqual([]);
            },
          );

          then('⚠️ nor the assignment that records the session', () => {
            const record = '    DISPLAY["$__c"]="${session%/*}"';
            expect(derefs(record)).toEqual([]);
          });
        },
      );

      when('[t2] the captured render is read', () => {
        const raw = (): string =>
          readFileSync(
            join(
              DIR_WORK,
              '.test/.assets/render.poll.one-tree-rendered-under-two-names.log',
            ),
            'utf8',
          );

        then('it holds the DOTTED slug, on the tree row', () => {
          expect(raw()).toContain(
            'rhachet-roles-bhrain.beav.feat-acceptance-under-5min',
          );
        });

        then(
          '🔴 and the UNDERSCORED form, in the same render — the defect, verbatim',
          () => {
            expect(raw()).toContain(
              'rhachet-roles-bhrain_beav_feat-acceptance-under-5min',
            );
          },
        );

        then(
          '🔴 and it is not one row — CONTEXT LOW carried the same split',
          () => {
            expect(raw()).toContain(
              'rhachet-roles-bhrain_beav_fix-budget-grant-needs-urgent-concession',
            );
          },
        );
      });
    },
  );
});
