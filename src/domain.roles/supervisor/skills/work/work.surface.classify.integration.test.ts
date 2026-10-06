/**
 * .what = clamps on how duct.poll CLASSIFIES a pane — ask, prompt, husk, cap, scrollback
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
  readCode,
  readCodeWhole,
  readPollWhole,
} from './work.surface.harness';

describe('work.surface', () => {
  given(
    '[case10] duct.poll parts a design ASK from a permission PROMPT',
    () => {
      const readDuctPoll = (): string =>
        readCode(join(DIR_SKILLS, 'duct.poll.sh'));

      when('[t0] the two modal kinds are classified', () => {
        then('the ASK tells are tested BEFORE the perm tells', () => {
          // .why = order is NECESSARY: a perm tell cannot refuse an ask, so an
          //        ask tell must be reached first or the misroute is unavoidable
          //
          // ⚠️ .and order alone was NOT SUFFICIENT — see [t5]. this clamp's own
          //    prior rationale read "EVERY claude modal ends in `Esc to cancel`
          //    regardless of kind", and then checked ORDER while the code kept
          //    that shared chrome as a perm DISCRIMINATOR. the source comment
          //    said the same thing two lines above the same code.
          //
          //    so two artifacts named the defect in prose and neither checked
          //    it, because both took ORDER as the subject when the subject was
          //    the TELL SET. a `partial audit`, and the tell is cheap: where a
          //    comment states a fault, the clamp beside it should assert the
          //    fault is absent — not merely that the arms are sequenced.
          const src = readDuctPoll();
          const iAsk = src.indexOf('Chat about this|');
          const iPerm = src.indexOf('Do you want to proceed');
          expect(iAsk).toBeGreaterThan(-1);
          expect(iPerm).toBeGreaterThan(-1);
          expect(iAsk).toBeLessThan(iPerm);
        });

        then(
          'the ask tells are chrome a permission modal never renders',
          () => {
            // a permission modal offers Yes / Yes-and-dont-ask / No. it carries no
            // (Recommended) marker, no "Chat about this", no Tab/Arrow navigation
            const src = readDuctPoll();
            expect(
              /Chat about this\|\\\(Recommended\\\)\|Tab\/Arrow keys/.test(src),
            ).toEqual(true);
          },
        );
      });

      when('[t1] an ask is rendered', () => {
        then('it forbids keys rather than explain how to send them', () => {
          // .why = the cost is asymmetric. a perm read as an ask costs one
          //        message; an ask read as a perm records a decision in the
          //        HUMAN's name, and that does not undo
          const src = readDuctPoll();
          expect(
            /ASK — a DESIGN question, put to the HUMAN\. not yours/.test(src),
          ).toEqual(true);
          expect(/send NO keys/.test(src)).toEqual(true);
        });

        then(
          'a perm still renders its own how-to, so the split loses naught',
          () => {
            const src = readDuctPoll();
            expect(
              /PROMPT — mechanic STALLED, awaits a decision/.test(src),
            ).toEqual(true);
            expect(
              /read the full command \(--lines 40\) BEFORE any --keys/.test(
                src,
              ),
            ).toEqual(true);
          },
        );
      });

      when('[t2] the clamp is tested against the shipped defect', () => {
        then(
          'the pre-split source would have misrouted the live council',
          () => {
            // the council read on 2026-08-30 carried `Esc to cancel` — a PERM tell
            // — and no perm tell can refuse it. so the pre-split branch classified
            // it `prompt` and told the reader how to key it
            const council =
              'Enter to select \u00b7 Tab/Arrow keys to navigate \u00b7 Esc to cancel';
            const perm = /Do you want to|requires approval|Esc to cancel/;
            const ask = /Chat about this|\(Recommended\)|Tab\/Arrow keys/;
            expect(perm.test(council)).toEqual(true); // the misroute, pre-split
            expect(ask.test(council)).toEqual(true); // the claim, post-split
          },
        );

        then(
          'the kind rides BESIDE the verdict, so no downstream reader breaks',
          () => {
            // git.crew.poll --boxes, the babysit cron, and three briefs all read
            // `prompt`. a new box STATE would have broken every one of them
            const src = readDuctPoll();
            expect(/box="prompt"; box_kind="ask"/.test(src)).toEqual(true);
            expect(/box="prompt"; box_kind="perm"/.test(src)).toEqual(true);
            expect(/boxkind/.test(src)).toEqual(true);
          },
        );
      });

      when(
        '[t3] the JOIN layer is read — where the first clamp did not look',
        () => {
          // .why this block exists at all: [t2]'s last test asserted "no downstream
          //      reader breaks" while its subject set was duct.poll.sh's SOURCE.
          //      the claim was about downstream. those are orthogonal, so the clamp
          //      passed green over a live regression — git.crew.poll --boxes parses
          //      duct.poll's RENDERED OUTPUT, not its state file, and rendered the
          //      live council as `❔unknown`. a `partial audit`, in a clamp written
          //      minutes earlier. caught by a verify-after-send, never by the suite.
          const readCrewPoll = (): string => asCode(readPollWhole());

          then('git.crew.poll carries the ask as its own token', () => {
            expect(
              /\*'ASK —'\*\)\s+box="\ud83d\ude4bask"/.test(readCrewPoll()),
            ).toEqual(true);
          });

          then(
            'it matches ASK before PROMPT, so the split survives the join',
            () => {
              const src = readCrewPoll();
              expect(src.indexOf("*'ASK —'*")).toBeLessThan(
                src.indexOf("*'PROMPT'*"),
              );
            },
          );

          then(
            'the join clamp has teeth against the regression it just caught',
            () => {
              // the rendered ask line matches NEITHER pre-split arm, so it fell
              // through to the catch-all and read `unknown` — a live mechanic at a
              // live modal, reported as a state the tick contract has no route for
              const rendered =
                '   └─ 🙋 ASK — a DESIGN question, put to the HUMAN. not yours';
              expect(/PROMPT/.test(rendered)).toEqual(false); // why it fell through
              expect(/ASK —/.test(rendered)).toEqual(true); // what now claims it
            },
          );
        },
      );

      when('[t5] the kind chain is read for where it FAILS', () => {
        // .why = [t0] clamped the ORDER of the two tell sets and never asked what
        //        happens when NEITHER claims the modal. the chain ended at `perm`,
        //        so every unclassified modal got the one label that says "press a
        //        key" — and it got there most often, because the tell that carried
        //        it was `Esc to cancel`: SHARED chrome, on the modal's LAST line,
        //        so it survives whatever truncation drops the ask tells.
        //
        //        observed live 2026-08-31: a 5-option design council rendered
        //        `🚧prompt` for a whole tick. only step 0 of
        //        howto.review-permission-requests stopped a key from landing.
        //
        //        the source comment had named `Esc to cancel` shared chrome two
        //        lines above the code that used it as a discriminator.

        then('`Esc to cancel` is NOT a perm discriminator', () => {
          // it proves a modal is UP and proves naught about which kind
          const src = readDuctPoll();
          const perm = src.slice(
            src.indexOf('box_kind="perm"') - 400,
            src.indexOf('box_kind="perm"'),
          );
          expect(/Esc to cancel/.test(perm)).toEqual(false);
        });

        then(
          '`Esc to cancel` is used for what it DOES prove — that a modal is up',
          () => {
            expect(
              /Esc to cancel'; then[\s\S]{0,300}box_kind="unsure"/.test(
                readDuctPoll(),
              ),
            ).toEqual(true);
          },
        );

        then('the kind chain never ends at perm', () => {
          // the unsure arm must sit AFTER perm, so an unclaimed modal reaches it
          const src = readDuctPoll();
          expect(src.indexOf('box_kind="perm"')).toBeLessThan(
            src.indexOf('box_kind="unsure"'),
          );
        });

        then(
          'the render dispatches on kind, with no else that defaults to PROMPT',
          () => {
            // an `else` here would hand every unclassified modal the key-press label
            const src = readDuctPoll();
            const dispatch = src.slice(
              src.indexOf('case "$box_kind" in'),
              src.indexOf('PROMPT'),
            );
            expect(dispatch.length).toBeGreaterThan(0); // it IS a case, not an if/else
            expect(/unsure\)/.test(dispatch)).toEqual(true);
          },
        );

        then('the unsure render forbids keys and asserts no kind', () => {
          const src = readDuctPoll();
          const arm = src.slice(
            src.indexOf('unsure)'),
            src.indexOf('unsure)') + 500,
          );
          expect(/KIND UNDETERMINED/.test(arm)).toEqual(true);
          expect(/send NO keys/.test(arm)).toEqual(true);
        });

        then(
          'the join carries the uncertainty rather than round it to a neighbour',
          () => {
            // rounded to `ask` it asserts a determination never made; rounded to
            // `prompt` it says press a key — the one direction the split forbids
            const src = asCode(readPollWhole());
            expect(/\*'ASK\? —'\*\)/.test(src)).toEqual(true);
            expect(src.indexOf("*'ASK? —'*")).toBeLessThan(
              src.indexOf("*'PROMPT'*"),
            );
          },
        );
      });

      when('[t4] the join is read for what it keys ON', () => {
        // .why = [t3] fixed WHICH tokens the join knows and left untouched HOW it
        //        finds the line that carries one. that was the next defect: the
        //        join keyed on the 3-space `└─`, on the claim that the box line
        //        is duct.poll's LAST child. true until `empty` grew a second line
        //        for the stone — then `└─` held the STONE, matched no token, and
        //        every idle crew read ❔unknown. same shape as the round before
        //        it, which keyed on the ⌨️ glyph and dropped every PROMPT.
        //
        //        so two regressions, one cause: a join that reads its
        //        neighbour's LAYOUT is a join its neighbour breaks the next time
        //        it renders. these clamp the CURE — content, never position.
        const readCrewPoll = (): string => asCode(readPollWhole());

        then('it reads BOTH child positions, not the last child alone', () => {
          // the arm must claim `├─` too, or a box line that is not last is unseen
          expect(
            /' {3}\u251c\u2500 '\*\|' {3}\u2514\u2500 '\*\)/.test(
              readCrewPoll(),
            ),
          ).toEqual(true);
        });

        then(
          'a child line that names no box state is skipped, never scored',
          () => {
            // the old catch-all read `box="unknown"` off POSITION alone, so any
            // non-box line at `└─` became a verdict about the mechanic's keyboard.
            // the cure: fall through to `continue`, and score unknown only on the
            // line that SAYS unknown
            const src = readCrewPoll();
            expect(/\*\)\s+continue ;;/.test(src)).toEqual(true);
            expect(/\*'box UNKNOWN'\*\)/.test(src)).toEqual(true);
          },
        );

        then(
          'a block that names no box at all is flushed loud, not dropped',
          () => {
            // fail-loud is what position bought us for free and content does not:
            // with no positional anchor, an unmatched block would simply vanish —
            // the omission defect of the ⌨️ round, back by another route
            const src = readCrewPoll();
            expect(
              /__crew_record_box "\$uri" "\u2754unknown"/.test(src),
            ).toEqual(true);
          },
        );

        then(
          'the clamp has teeth — the rendered two-line empty defeats `└─`',
          () => {
            // the exact block duct.poll emits for an idle claude duct that names a
            // stone. under the old arm, `└─` selected line 2, which carries no box
            // token at all — so the live fleet read ❔unknown across every idle crew
            const lines = [
              '   \u251c\u2500 \u23f1 unchanged (91m)',
              '   \u251c\u2500 \u2328\ufe0f  box empty',
              '   \u2514\u2500 \ud83d\uddff 1.vision, judge, approved? \ud83d\udc4b',
            ];
            const lastChild = lines
              .filter((l) => l.startsWith('   \u2514\u2500 '))
              .pop()!;
            expect(/box empty/.test(lastChild)).toEqual(false); // why `└─` broke
            expect(lines.filter((l) => /box empty/.test(l)).length).toEqual(1); // what content finds
          },
        );
      });
    },
  );

  given(
    '[case11] duct.poll names the move on the one row that lacks one',
    () => {
      const readDuctPoll = (): string =>
        readCode(join(DIR_SKILLS, 'duct.poll.sh'));

      when('[t0] the stone is read off the pane', () => {
        then('it is taken from the LAST stone line, never the first', () => {
          // a pane holds every stone the route has passed; only the last is now
          const src = readDuctPoll();
          expect(
            /stone=.*grep -a '\ud83d\uddff' \| tail -n 1/.test(src),
          ).toEqual(true);
        });

        then('an absent stone is empty, never an error', () => {
          // a plain shell and a remote duct name no stone; neither is a defect
          expect(
            /grep -a '\ud83d\uddff'[\s\S]{0,120}\|\| true/.test(readDuctPoll()),
          ).toEqual(true);
        });
      });

      when('[t1] the stone is rendered', () => {
        // 🔴 .why these two REVERSE what they asserted until 2026-09-16.
        //
        //    they read `it rides on 'empty' alone`, and clamped the stone INSIDE
        //    the `empty)` arm. the rationale was real and it was about a READER:
        //    every other verdict already names its own move, so `empty` is the
        //    one row that earns a second line. that is RENDER ECONOMY.
        //
        //    the defect is that `git.crew.poll` consumes this render as a FACT —
        //    `__crew_record_stone` parses the stone out of duct.poll's stdout. so
        //    a stone we chose not to PRINT was a stone the fleet sweep did not
        //    KNOW, and a presentation choice became a correctness constraint one
        //    layer up. measured on `sdk-aws-lambda.beav.feat-absorb-handler-
        //    invoke-test-util`: an autocomplete GHOST made the box non-`empty`,
        //    so its `blocked ✋` stone never printed, so the crew ladder's
        //    `*"blocked ✋"*` arm was unreachable and the row read `🧊 frozen`
        //    for 326 minutes — healable, and probed to no purpose every tick.
        //
        //    ⇒ so the clamp moves to the invariant that actually holds: the
        //      stone rides on its OWN row, orthogonal to the box, exactly as
        //      `cap` and `ratelimit` already do. the economy is kept by the
        //      `-n "$stone"` guard, never by the box state.
        const posOf = (needle: string): number =>
          readDuctPoll().indexOf(needle);

        then(
          'it rides on its OWN row, outside the box case — every state, not `empty` alone',
          () => {
            const src = readDuctPoll();
            // the row exists, and it sits BELOW the case that classifies the box
            expect(/echo " {3}\u2514\u2500 \$stone"/.test(src)).toEqual(true);
            expect(posOf('echo "   \u2514\u2500 $stone"')).toBeGreaterThan(
              posOf('unread)  echo'),
            );
            // and it is no longer trapped inside the one arm that hid it
            const empty = src.slice(
              src.indexOf('empty)'),
              src.indexOf('none)'),
            );
            expect(/\$stone/.test(empty)).toEqual(false);
          },
        );

        then(
          'it is a PEER of the cap and ratelimit rows, which are the same shape',
          () => {
            // those two already state the pattern in their own comment: a fact
            // orthogonal to the box state gets its own row, never a case arm.
            // ⚠️ the LOWER bound is what gives this teeth — `❔ box UNKNOWN` is the
            //    LAST arm of the box case, so a stone echo above it is a stone echo
            //    still trapped inside an arm. without it, the old placement (inside
            //    `empty)`, which also precedes cap) sailed through.
            const at = posOf('echo "   \u2514\u2500 $stone"');
            expect(at).toBeGreaterThan(posOf('\u2754 box UNKNOWN'));
            expect(at).toBeLessThan(posOf('\ud83d\udd0b cap SEEN'));
          },
        );

        then(
          'with no stone the sweep does not grow — a shell stays ONE line',
          () => {
            const src = readDuctPoll();
            const at = src.indexOf('echo "   \u2514\u2500 $stone"');
            // the guard is what keeps the old rationale's one real win
            expect(src.slice(at - 80, at).includes('-n "$stone"')).toEqual(
              true,
            );
            // and `empty` renders exactly one line now, with no second arm
            expect((src.match(/box empty/g) ?? []).length).toEqual(1);
          },
        );
      });

      when('[t2] a GHOST box carries a stone — the measured case', () => {
        then(
          'no box state can suppress it, because the row sits OUTSIDE the box case',
          () => {
            // .the teeth = every arm of the box case is bounded by the case's own
            //   first and last labels. a stone echo that falls between them is an
            //   echo some box verdict can swallow — which is precisely the defect.
            //   under the old placement the echo sat inside `empty)`, between the
            //   two, so this goes red the moment the cure is reverted.
            const src = readDuctPoll();
            const at = src.indexOf('echo "   \u2514\u2500 $stone"');
            const caseOpen = src.indexOf('case "$box" in');
            const caseLast = src.indexOf('\u2754 box UNKNOWN'); // the final arm
            expect(caseOpen).toBeGreaterThan(0);
            expect(at > caseOpen && at < caseLast).toEqual(false);
            expect(at).toBeGreaterThan(caseLast);
          },
        );

        then(
          'and the box arms name every state, so none of them is where a stone lives',
          () => {
            // the peer half: each box verdict renders its own one-line move, and
            // not one of them mentions the stone. an arm that grew a `$stone` back
            // would re-open the exact hole the ghost fell through.
            const src = readDuctPoll();
            const box = src.slice(
              src.indexOf('case "$box" in'),
              src.indexOf('\u2754 box UNKNOWN'),
            );
            for (const state of [
              'empty)',
              'none)',
              'husk)',
              'covered)',
              'unread)',
              'queued)',
              'suggested)',
              'prefilled)',
            ]) {
              expect(box.includes(state)).toEqual(true); // the arm is there
            }
            expect(/\$stone/.test(box)).toEqual(false); // and not one of them holds the stone
          },
        );
      });
    },
  );

  /**
   * [case31] — the ratelimit signal round-trips through the tmpdir, like cap
   *
   * .why = the detect loop runs in a `( … ) &` SUBSHELL and writes each per-duct
   *        signal to a `$tmpdir/$slot.*` file; the print loop (a SEPARATE loop)
   *        reads each back with a `|| echo ''` default. ratelimit (task #61) was
   *        set in the subshell but NEVER written to a file, and the print loop
   *        read a bare `$ratelimit` — so under `set -u` any `box=none` duct (a
   *        foreman, a reflector) crashed the WHOLE duct.poll with `ratelimit:
   *        unbound variable`, which aborted the grove subprocess and rendered
   *        every crew on it `unread` (measured 2026-09-14, v20260901: a foreman
   *        `no input box` duct crashed the poll at the print loop).
   *
   * .teeth = ratelimit MUST have the SAME write+read-back symmetry as cap. a
   *          write with no read, or a read with no write, reopens the crash.
   */
  given(
    '[case31] ratelimit round-trips through the tmpdir with a default, like cap',
    () => {
      const readDuctPoll = (): string =>
        readCode(join(DIR_SKILLS, 'duct.poll.sh'));

      when('[t0] the persistence is read', () => {
        then('the detect subshell WRITES $slot.ratelimit', () => {
          // cap is the proven-correct sibling; ratelimit must match its shape
          const src = readDuctPoll();
          expect(
            /echo "\$\{ratelimit:-\}" > "\$tmpdir\/\$slot\.ratelimit"/.test(
              src,
            ),
          ).toEqual(true);
          expect(
            /echo "\$\{cap:-\}" > "\$tmpdir\/\$slot\.cap"/.test(src),
          ).toEqual(true); // the sibling
        });

        then(
          'the print loop READS it back with a default — never a bare $ratelimit',
          () => {
            // the default is what keeps `set -u` from crashing on a box=none duct
            const src = readDuctPoll();
            expect(
              /ratelimit="\$\(cat "\$tmpdir\/\$slot\.ratelimit" 2>\/dev\/null \|\| echo ''\)"/.test(
                src,
              ),
            ).toEqual(true);
          },
        );
      });
    },
  );

  /**
   * [case] — the box classifier reads a pane on EITHER host
   *
   * .why = the whole cloud fleet was invisible to the stall detector, and the
   *        cause was one conditional. `duct.poll` wrapped its ENTIRE classifier
   *        in `if [[ "$uri_host" == "" ]]`, so on a grove duct not one line of
   *        it ran: `box` kept its `unknown` default and `stone` grepped a
   *        `$flat` that was never assigned.
   *
   *        measured 2026-09-03 — 11 of 11 grove ducts read `❔unknown`, and no
   *        local duct ever did. `unknown` routes to "treat as a ghost", so a
   *        grove clone halted on a live permission modal could NOT report
   *        `🚧 PROMPT`, and no grove crew rendered a route position at all.
   *
   * .why it is a term=false-report, not a plain gap: the poll did not fail. it
   *      returned a verdict, on time, for every grove duct — and the verdict
   *      was untrue. a human caught a halted grove crew by eye that the sweep
   *      was structurally unable to surface.
   *
   * .why the ROOT sat in ductwork, not in the poll: the classifier needs the
   *      ANSI escapes, and `duct.read --raw` refused every remote uri on the
   *      claim that "a remote raw read is unsupported". it never was —
   *      `capture-pane -p -e` is the same flag over ssh. the poll's host gate
   *      was downstream of that refusal.
   *
   * .the teeth = restore the `if [[ "$uri_host" == "" ]]` gate, or drop the
   *      remote `-e` arm, and these go red.
   */
  given('[case] a duct whose pane must be classified, local or cloud', () => {
    const readDuctPoll = (): string =>
      readCode(join(DIR_SKILLS, 'duct.poll.sh'));
    const readDuctwork = (): string =>
      readCodeWhole(join(DIR_WORK, 'ductwork.sh'));
    // the crew poll parses duct.poll's rendered text, so a verdict coined
    // here is only real once that join learns it — see [t3].
    const readCrewPoll = (): string => asCode(readPollWhole());

    when('[t0] the lib is asked for a raw capture', () => {
      then(
        'BOTH arms capture with the escapes — neither is host-refused',
        () => {
          // .why both: a raw read that runs on one host and refuses on the other
          //      is what produced the blind fleet. the flag must mean the same
          //      on either machine that owns the session.
          const held = readDuctwork();
          expect(held.includes('--raw) raw=1; shift ;;')).toEqual(true);
          expect(
            /ssh -n "\$DUCT_HOST".*capture-pane -t '\$DUCT_SESSION' -p -e/.test(
              held,
            ),
          ).toEqual(true);
          expect(
            /__duct_tmux capture-pane -t "\$DUCT_SESSION" -p -e/.test(held),
          ).toEqual(true);
        },
      );

      then('a raw read NEVER falls back to a stripped one', () => {
        // .why = the local-only guard existed to stop exactly that lie. the
        //        guard is gone, so the guarantee must now be held by the code:
        //        every raw arm carries `-e`, and none returns a plain capture.
        const held = readDuctwork();
        const rawArms = held
          .split('\n')
          .filter(
            (line) => line.includes('capture-pane') && line.includes('$raw'),
          );
        expect(rawArms.every((line) => line.includes('-e'))).toEqual(true);
      });
    });

    when('[t1] the poll classifies that pane', () => {
      then('the classifier is NOT gated on the host', () => {
        // .the exact defect. this string is what made the cloud fleet blind.
        expect(readDuctPoll().includes('if [[ "$uri_host" == "" ]]')).toEqual(
          false,
        );
      });

      then('it is gated on whether the pane was READ', () => {
        // .why = `unread` is the honest verdict for a pane we could not read —
        //        an unreachable grove, an absent session. it was the wrong
        //        verdict for a pane we read fine and declined to look at.
        // .why it keys on `unread` and not `unknown`: the default must promise
        //        the LEAST, and `unknown` claims a ladder run. once the two
        //        senses split, `unknown` moved to the ladder's tail — BELOW
        //        this gate — so a clamp still keyed on it would read the wrong
        //        occurrence and pass or fail for a reason it never meant.
        const held = readDuctPoll();
        const iBox = held.indexOf('box="unread"');
        const iGate = held.indexOf('if [[ $rc -eq 0 ]]; then');
        expect(iBox).toBeGreaterThan(-1);
        expect(iGate).toBeGreaterThan(iBox);
      });

      then(
        'it sources its raw capture from the lib, not from tmux direct',
        () => {
          // .why = a direct `tmux capture-pane` can only ever address THIS
          //        machine, so it re-opens the gap by construction. the lib owns
          //        the host split, so the classifier must go through it.
          const held = readDuctPoll();
          expect(
            held.includes("duct.read --on '$read_uri' --lines '$lines' --raw"),
          ).toEqual(true);
        },
      );

      then('the unread render blames the READ, never the host', () => {
        // .why = it said "remote", which ceased to be true the moment the
        //        classifier learned both hosts. a reader told "remote" looks
        //        for a host problem that is not there.
        const held = readDuctPoll();
        expect(held.includes('box UNREAD (capture came back empty')).toEqual(
          true,
        );
        expect(held.includes('box UNKNOWN (remote')).toEqual(false);
        expect(held.includes('box UNKNOWN (pane unread')).toEqual(false);
      });
    });

    when('[t2] the raw capture comes back empty', () => {
      then('an empty capture is classified UNREAD, never a plain shell', () => {
        // .why = the `-z "$line"` arm reads "no ❯ in the pane" as "a plain
        //        shell duct". an ssh that overran --timeout, or a grove that
        //        hibernated mid-sweep, yields an empty `line` for the OPPOSITE
        //        reason — so absent this guard the ladder lands on `none`: a
        //        bare shell asserted about a pane nobody saw. that is
        //        term=false-report (exit 0, verdict rendered, content untrue),
        //        the same defect as [t1]'s host gate, one branch over.
        const held = readDuctPoll();
        expect(
          /if \[\[ -z "\$raw" \]\]; then\s*\n\s*box="unread"/.test(held),
        ).toEqual(true);
      });

      then('the unread guard precedes the plain-shell arm', () => {
        // .why = the ORDER is the whole fix. below the `none` arm this guard
        //        never fires, because `none` has already claimed the empty
        //        case. a discriminator that runs second discriminates naught.
        const held = readDuctPoll();
        const atRaw = held.indexOf('if [[ -z "$raw" ]]; then');
        const atNone = held.indexOf('box="none"');
        expect(atRaw > -1).toEqual(true);
        expect(atRaw < atNone).toEqual(true);
      });
    });

    when('[t3] a pane is read in full but matches no arm', () => {
      // .why = `unknown` once named BOTH this case and [t2]'s empty capture.
      //        one word, two opposite cures — re-read the duct, versus read
      //        the text already on the row. rule.forbid.domain-term-ambiguity.
      //
      //        the tell that it was not cosmetic: EACH render site glossed the
      //        branch it did not cover. the duct row said "pane unread" over a
      //        pane read in full; the fleet tally said "box not empty" over a
      //        capture that was empty. every reader was told the opposite of
      //        the branch that fired, so a diagnosis could not even begin.

      then(
        'a read-and-unmatched pane keeps UNKNOWN, and carries its text',
        () => {
          // the ladder's tail holds the pane — so the row must show what it
          // holds. a verdict that withholds the evidence it already has sends
          // the reader back to the duct for bytes the sweep had in hand.
          const held = readDuctPoll();
          expect(/else box="unknown"; box_text="\$plain"/.test(held)).toEqual(
            true,
          );
          expect(
            held.includes('box UNKNOWN (read, but matched no arm'),
          ).toEqual(true);
        },
      );

      then('every could-not-read path renders UNREAD, never UNKNOWN', () => {
        // .why = a half-done split is worse than none. three paths assert that
        //        no pane was judged — the pre-classifier default, the empty
        //        capture, and an absent verdict file. any one left on
        //        `unknown` would tell a reader "read, but matched no arm"
        //        about a read that never happened: the same false report the
        //        split was paved to end, re-entered by a back door.
        //
        // ⚠️ .this tooth once pinned `box="unread"` ADJACENT to `box_text=""`,
        //    and the adjacency was a PROXY for the real property: that the
        //    pre-classifier default is `unread`. the `absent` promotion of
        //    2026-09-17 landed between the two and broke the proxy while the
        //    property held — so the anchor is now the assignment itself, and
        //    the promotion gets its own tooth below rather than a loosened one.
        const held = readDuctPoll();
        const atDefault = held.indexOf('box="unread"');
        expect(atDefault).toBeGreaterThan(0);
        expect(held.slice(atDefault, atDefault + 300)).toContain('box_text=""');
        expect(held.includes('|| echo unread')).toEqual(true);
        expect(held.includes('|| echo unknown')).toEqual(false);
      });

      then('and ABSENT is a POSITIVE read, never a fallback', () => {
        // .why = `absent` claims the host ANSWERED and said no session exists,
        //        which is what earns it a cure (a fell or a boot) that `unread`
        //        may not prescribe. so it must be reachable only from the
        //        read's own words — never as a default, and never off the exit
        //        code, which an unreachable grove shares with an absent seat.
        //        were it ever to become a fallback, an asleep grove's every
        //        seat would read `absent` and invite a fell over live work.
        const held = readDuctPoll();
        const at = held.indexOf('absent) box="absent"');
        expect(at).toBeGreaterThan(0);
        // the arm sits inside a case over the CLASSIFIER's verdict, so the
        // discriminator is ductwork's, clamped there, rather than re-derived.
        expect(held.slice(Math.max(0, at - 200), at)).toContain(
          '__duct_read_outcome',
        );
      });

      then(
        'the crew poll joins the new verdict rather than dropping it',
        () => {
          // .why = the crew poll parses duct.poll's RENDERED text. a verdict its
          //        case names not falls to `continue`, and the block is then
          //        flushed `❔unknown` at the next header — so the split would be
          //        invisible at the one layer the babysit tick reads. the join
          //        must learn the word in the same change that coins it.
          const held = readCrewPoll();
          expect(held.includes("*'box UNREAD'*)")).toEqual(true);
          expect(held.includes('❔unread')).toEqual(true);
        },
      );

      then(
        'and the same holds for ABSENT — every coined verdict gets its arm',
        () => {
          // .why = this case has now fired THREE times: `unread` (the note it was
          //        written for), `covered` (2026-09-04, which fell through on the
          //        very tick that coined it), and `absent` (2026-09-17). the join
          //        reads a neighbour's rendered text, so a render arm and its join
          //        arm are ONE change — a tooth per coined word is what makes that
          //        checkable rather than merely written down.
          const held = readCrewPoll();
          expect(held.includes("*'seat ABSENT'*)")).toEqual(true);
          expect(held.includes('🪦absent')).toEqual(true);
        },
      );

      then('COUNTER: absent does not collapse into unread at the join', () => {
        // .why = the two take opposite cures — re-read, versus fell or boot. one
        //        shared arm would erase the split at the layer that acts on it,
        //        which is the whole defect the split was paved to end.
        const held = readCrewPoll();
        const atAbsent = held.indexOf("*'seat ABSENT'*)");
        expect(atAbsent).toBeGreaterThan(0);
        expect(held.slice(atAbsent, atAbsent + 60)).not.toContain('unread');
      });

      then('the fleet tally names the STATE, not the pane', () => {
        // .why = "box not empty" reads as a claim about the captured bytes,
        //        and is false for `❔unread`, which names an empty capture.
        //        so the sentence speaks about the STATE, never the bytes.
        //
        // 🔴 .why the second half of this clamp REVERSED on 2026-09-16
        //    it asserted the row reads `so no stone renders for these roles`.
        //    that was true while the stone rode inside duct.poll's `empty)`
        //    arm. the stone now rides its OWN row, orthogonal to the box, so
        //    a ghost / covered / survey each render one — and the census
        //    denied it three lines under a render that plainly showed one.
        //    ⇒ the same `term=false-report` the FIRST half of this clamp
        //      exists to prevent, re-entered through the clause beside it.
        const held = readCrewPoll();
        expect(held.includes('box not empty, so no stone renders')).toEqual(
          false,
        );
        // the claim it must no longer make — a stone renders for these now
        expect(
          /echo " {3}\u251c\u2500 \$__bs \u00d7 [^"]*no stone renders/.test(
            held,
          ),
        ).toEqual(false);
        // and what it honestly measures: a tally of the non-`empty` STATES
        expect(held.includes('a non-\\`empty\\` box;')).toEqual(true);

        // 🔴 .and the SECOND reversal of this same clause — 2026-09-17, task #39
        //    it asserted the row routes the reader UP ("names its own move on
        //    its row above"). that held while every counted tree also rendered
        //    a box line — and the box line fires on `blocked:on-supervisor`
        //    ALONE, while BOX_TALLY counts every status. so the pointer was
        //    true for one status and false for the rest.
        //
        //    measured one tick apart on the same tree: `blocked:on-supervisor`
        //    rendered `🚧 … reviewer:🪦absent`; the modal was answered, the
        //    tree went `😶 inflight`, the box line was suppressed — and the
        //    census still sent the reader to a row that named no move.
        //
        //    ⇒ the THIRD instance of one shape on one line: a claim accurate
        //      about a mechanism, left in place as a claim about the render.
        //      the cure routes DOWN, to rows this loop itself emits — see
        //      [case40], which clamps the move those rows now carry.
        expect(
          held.includes('each names its own move on its row above'),
        ).toEqual(false);
        expect(held.includes('each row below carries its own move')).toEqual(
          true,
        );
      });
    });
  });

  /**
   * [case27] — a MECHANIC husk is its own verdict, never `at work` nor `frozen`
   *
   * .why = a husk is a live tmux duct at a bare shell where claude should be
   *        (term=duct.pane.husk). duct.poll classifies it `mechanic:shell` (its
   *        `no input box` arm), and the crew_status fold had NO arm for it — so
   *        it fell past every stone to the `😶 at work` default, or once idle to
   *        `🧊 frozen`. a dead mechanic read as alive, tick after tick (task #42).
   *
   *        measured 2026-09-13 on rhachet-roles-ehmpathy.beav.feat-require-
   *        commit-sponsor: a pane that read `💥143 ➜` for 22h, never named dead.
   *
   * .the split this pins, verified against the source
   *        LOCAL husk -> pane read succeeds, no claude chrome -> `mechanic:shell`
   *                      -> THIS arm catches it.
   *        GROVE husk -> ssh capture came back EMPTY -> `unread` at
   *                      duct.poll.sh:449 -> an honest "could not read", a
   *                      SEPARATE capture defect, NOT this arm's gap.
   *
   * .why the precedence carries the whole verdict
   *        below asleep + 🚧prompt (a failed read, or a live prompt, is no husk)
   *        and ABOVE the stone arms (a husk's stone is read from dead scrollback
   *        and is stale — the death outranks the last stone it drew).
   */
  given(
    '[case27] the crew poll names a mechanic husk, and role-guards it',
    () => {
      const readCrewPoll = (): string => asCode(readPollWhole());

      when('[t0] the fold is read', () => {
        then(
          'a `mechanic:shell` OR `mechanic:husk` box folds to `husk`',
          () => {
            // the arm folds BOTH the local husk (pane read → `shell`) and the
            // grove husk that duct.poll named `husk` — so the regex must tolerate
            // the `|| … mechanic:husk` clause between the shell match and the `]]`.
            const src = readCrewPoll();
            expect(
              /elif \[\[ "\$__boxes_s" == \*"mechanic:shell"\* \|\| "\$__boxes_s" == \*"mechanic:husk"\* \]\];\s*then crew_status="husk"/.test(
                src,
              ),
            ).toEqual(true);
          },
        );

        then(
          'the arm keys on the MECHANIC, so a foreman shell cannot trip it',
          () => {
            // .why = a foreman is a bare shell BY DESIGN (ductwork), so a bare
            //        `:shell` match would mark every healthy crew a husk.
            const src = readCrewPoll();
            expect(
              /\$__boxes_s" == \*":shell"\* \]\];\s*then crew_status="husk"/.test(
                src,
              ),
            ).toEqual(false);
          },
        );

        then(
          'the box classifier folds a foreman `💀 HUSK` to `shell`, never `husk`',
          () => {
            // .why = a husk is a DEAD BRAIN, and only the mechanic runs one. every
            //        other role is a SEAT (term=crew) — a 💥143 there is a dead
            //        ad-hoc occupant the human enrolled, not a crew defect. so the
            //        classifier arm is role-aware: mechanic → husk, every seat →
            //        shell, and a seat husk is skipped by the husk breakdown.
            const src = readCrewPoll();
            expect(
              /if \[\[ "\$\{uri##\*\/\}" == "mechanic" \]\]; then box="husk"; else box="shell"; fi/.test(
                src,
              ),
            ).toEqual(true);
          },
        );

        then('the pre-fix role-agnostic fold is GONE — the bite proof', () => {
          // before the fix, ANY `💀 HUSK` box folded to `husk` on one line, so a
          // foreman seat with a dead occupant surfaced in the husk breakdown as a
          // husk to heal. that role-blind form must no longer exist.
          const src = readCrewPoll();
          expect(/\*'💀 HUSK'\*\)\s+box="husk" ;;/.test(src)).toEqual(false);
        });
      });

      when('[t1] the arm precedence is read', () => {
        then('husk sits BELOW prompt and ABOVE the stone arms', () => {
          const src = readCrewPoll();
          const posPrompt = src.indexOf('$__boxes_s" == *"🚧prompt"*');
          const posHusk = src.indexOf('$__boxes_s" == *"mechanic:shell"*');
          const posExhausted = src.indexOf('$__stones_s" == *"exhausted"*');
          expect(posPrompt).toBeGreaterThan(-1);
          expect(posHusk).toBeGreaterThan(posPrompt);
          expect(posExhausted).toBeGreaterThan(posHusk);
        });

        then('it goes RED against the pre-fix fold — the bite proof', () => {
          // the fold before task #42: prompt arm, then exhausted, no husk between.
          const before = [
            '  elif [[ "$__boxes_s" == *"🚧prompt"* ]]; then crew_status="blocked:on-supervisor"',
            '  elif [[ "$__stones_s" == *"exhausted"* ]]; then crew_status="blocked:on-defect"',
          ].join('\n');
          expect(
            /\$__boxes_s" == \*"mechanic:shell"\* \]\];\s*then crew_status="husk"/.test(
              before,
            ),
          ).toEqual(false);
        });
      });

      when('[t2] the husk is rendered', () => {
        then('the dense glyph is 💀', () => {
          expect(/husk\)\s+__sg="💀"/.test(readCrewPoll())).toEqual(true);
        });

        then('the footer status tally counts husk, ahead of the rest', () => {
          // husk stays first; `limited` (a quota-capped clone) follows it, both
          // ahead of the inflight/frozen rest (task: 🚫 limited classification).
          expect(
            /for k in husk limited inflight /.test(readCrewPoll()),
          ).toEqual(true);
        });
      });
    },
  );

  given(
    '[case30] a rate-limited clone (usage cap) is classified 🚫 limited, apart from frozen',
    () => {
      const readCrewPoll = (): string => asCode(readPollWhole());
      // .teeth = a clone at "hit your limit … resets HH:MM" keeps its input box
      //          drawn, so the box arm reads it `at work` and the fleet sweep
      //          rendered it healthy. duct.poll emits `🔋 cap SEEN`, but crew.poll
      //          consumed it in NO arm — measured 2026-09-13, rate-limited clones
      //          read `at work`, invisible to the babysit tick. the cap must join
      //          from duct.poll into a distinct crew status.
      when('[t0] the crew poll source is read', () => {
        then(
          'the cap is RECORDED per role — the fn, its parse arm, and its array all exist',
          () => {
            // an unjoined detector is worse than an absent one (the plea arm lesson):
            // the emit, the join, and the store must all be present.
            const src = readCrewPoll();
            expect(/__crew_record_cap\(\) \{/.test(src)).toEqual(true);
            expect(
              /\*'cap SEEN'\*\)[\s\S]{0,160}__crew_record_cap /.test(src),
            ).toEqual(true);
            expect(/declare -gA CREW_CAP=\(\)/.test(src)).toEqual(true);
          },
        );

        then(
          'a capped, LIVE clone classifies limited — the guard is `== "at work"`, NOT `!= "at work"`',
          () => {
            const src = readCrewPoll();
            // 🔴 .teeth = the guard MUST be `== "at work"`. a capped clone keeps its
            //    ❯ box drawn, so `crew_state` reads `at work` on every poll. the
            //    original clamp asserted `!= "at work"` — the self-cancelling guard
            //    that NEVER fired for an interactive cap, so ~24 capped grove crews
            //    fell to `unread`/`frozen` while `0034.cap` proved detection worked
            //    (measured 2026-09-14, v20260901 telepath). a live box is the
            //    PRECONDITION, not the disqualifier.
            // ⚠️ .the anchor is the TERM, never the arm's closure — loosened
            //    2026-09-18, and the loosening is the point. this once read
            //    `… == "at work" ]];\s*then crew_status="limited"`, which pins the
            //    term to the END of the condition. so the arm could not grow a
            //    THIRD term without this clamp going red — and it needed one: the
            //    cap join was two facts where duct.poll's own cap row asks for
            //    three (`reset-vs-now + still`).
            //
            //    ⇒ a clamp that forbids a CORRECT change is a clamp that will be
            //      deleted by whoever makes it, and the claim it carried dies with
            //      it. so it keys on the arm's IDENTITY (the one line that joins
            //      `__cap_s` to `crew_status="limited"`) and asserts the term is
            //      PRESENT on it — which is the whole of what this case ever
            //      claimed, and it now survives any further term the arm earns.
            const capArm = src
              .split('\n')
              .filter(
                (l) =>
                  l.includes('crew_status="limited"') && l.includes('__cap_s'),
              )
              .join('\n');
            expect(capArm.length).toBeGreaterThan(40); // anti-vacuity
            expect(capArm).toContain('"$crew_state" == "at work"');
            // the buggy guard must be GONE — its presence is the regression itself
            expect(capArm).not.toContain('"$crew_state" != "at work"');
            // ⇒ the THIRD term of this join is clamped at [case56], end to end.
            // and it must sit ABOVE the stone arms: a capped clone's last stone
            // (e.g. `exhausted 👋`) is stale scrollback — the cap is the CURRENT
            // blocker, so limited must win over the exhausted/👋/frozen arms below.
            const limitedAt = src.indexOf(
              'crew_status="limited"',
              src.indexOf('__has_ratelimit'),
            );
            const exhaustedAt = src.indexOf('*"exhausted"*');
            const frozenAt = src.indexOf('then crew_status="frozen"');
            expect(limitedAt).toBeGreaterThan(0);
            expect(limitedAt).toBeLessThan(exhaustedAt);
            expect(limitedAt).toBeLessThan(frozenAt);
          },
        );

        then('the dense glyph is 🚫', () => {
          expect(/limited\)\s+__sg="🚫"/.test(readCrewPoll())).toEqual(true);
        });
      });
    },
  );

  /**
   * 🔴 [case56] the STILL term reaches the cap verdict — EVERY LINK of it
   *
   * .what = a cap banner in scrollback, under a clone that is mid-turn, must
   *         NOT render `🚫 limited` and must NOT enter `--healable`.
   *
   * 🔴 .why this case clamps the WHOLE CHAIN and not merely the arm
   *    the fell-fence defect of 2026-09-18 was a chain break and no more than
   *    that: the detector was correct, its clamp was green, and the gather
   *    that fed it was never switched on — so the verdict reached no map and
   *    the render never moved. a clamp aimed at one link proves one link.
   *
   *    ⇒ so each link gets its own tooth here:
   *         1  the detector EXISTS            (ductwork.sh)
   *         2  duct.poll COMPUTES it          (a slot write)
   *         3  duct.poll EMITS it             (a SEEN row)
   *         4  git.crew.poll GATHERS it       (a case arm + a recorder)
   *         5  the cap arm JOINS it           (the third term)
   *       break any one and the cure is green and inert.
   *
   * 🔴 .the production defect, measured 2026-09-18
   *    duct.poll's cap row names its own join contract verbatim —
   *    `(scrollback; join to reset-vs-now + still to judge)` — and the STILL
   *    half had no emitter, so the crew layer made a two-fact join. two
   *    mid-turn clones therefore rendered `🚫 limited — ⏰ reset PASSED —
   *    healable, nudge to retry`, while `git.crew.heal` on the SAME tree in
   *    the SAME tick answered "this clock has NOT passed". two instruments,
   *    one pane, opposite verdicts — and a nudge into a clone that had not
   *    stopped.
   *
   * ⚠️ every anchor below is an IDENTITY — a variable, a function name, a
   *    literal emitted string. no tooth keys on prose or on position, because
   *    a comment can be reworded and a line can move.
   */
  given('[case56] a scrollback cap under a live turn is not a limit', () => {
    const PATH_DUCTWORK_SH = join(DIR_SKILLS, 'work', 'ductwork.sh');
    const PATH_DUCT_POLL_SH = join(DIR_SKILLS, 'duct.poll.sh');

    /** .what = the cap arm of the crew-status ladder, code only */
    const genCapArm = (): string =>
      asCode(readPollWhole())
        .split('\n')
        .filter(
          (l) => l.includes('crew_status="limited"') && l.includes('__cap_s'),
        )
        .join('\n');

    when(
      '[t0] link 1 — the detector exists, in the layer that holds the pane',
      () => {
        then('🔴 __duct_pane_turn_live is declared in ductwork', () => {
          expect(readCodeWhole(PATH_DUCTWORK_SH)).toContain(
            '__duct_pane_turn_live() {',
          );
        });

        then(
          '🔴 and it anchors on the TOKEN frame, never a bare duration',
          () => {
            // .teeth = an ENDED turn draws `<n>m <n>s` too, so a duration-only
            //          anchor inverts this very defect and grades every halted
            //          clone mid-work
            const src = readCodeWhole(PATH_DUCTWORK_SH);
            const at = src.indexOf('__duct_pane_turn_live() {');
            const body = src.slice(at, src.indexOf('\n}', at));
            expect(body.length).toBeGreaterThan(80); // anti-vacuity
            expect(body).toContain('tokens');
            expect(body).toContain('[↓↑]');
          },
        );
      },
    );

    when('[t1] link 2+3 — duct.poll computes it and emits it', () => {
      const src = (): string => readCode(PATH_DUCT_POLL_SH);

      then('🔴 it calls the detector', () => {
        expect(src()).toContain('__duct_pane_turn_live "${flat:-}"');
      });

      then('🔴 it survives the fork — a slot write AND a slot read', () => {
        // .teeth = duct.poll reads each pane in a forked worker, so a value
        //          that never reaches a slot file is lost at the join
        expect(src()).toContain('.turnlive"');
        expect(src()).toContain('turnlive="$(cat "$tmpdir/$slot.turnlive"');
      });

      then('🔴 and it EMITS the fact row the crew layer greps for', () => {
        expect(src()).toContain('TURN LIVE SEEN');
      });

      then('⚠️ the row is box-guarded, like every peer fact row', () => {
        // a husk's pane is scrollback, so a live frame in it is a dead turn
        const at = src().indexOf('turnlive=""');
        const decl = src().slice(at, at + 220);
        expect(decl).toContain('"$box" != "husk"');
      });
    });

    when('[t2] link 4 — git.crew.poll gathers it', () => {
      const src = (): string => asCode(readPollWhole());

      then('🔴 the case arm matches the emitted row', () => {
        // .teeth = THE fell-fence shape. a detector whose verdict reaches no
        //          map is a cure that is green and inert
        expect(src()).toContain("*'TURN LIVE SEEN'*)");
      });

      then(
        '🔴 the arm calls a recorder, and the recorder files into the map',
        () => {
          expect(src()).toContain('__crew_record_turnlive "$uri_block"');
          expect(src()).toContain('__crew_record_turnlive() {');
          expect(src()).toContain('CREW_TURNLIVE["$(__crew_canon "$tree")"]');
        },
      );

      then(
        '🔴 and the map is DECLARED — an undeclared assoc array reads empty',
        () => {
          expect(src()).toContain('declare -gA CREW_TURNLIVE=()');
        },
      );

      then('🔴 and the per-crew flag is derived from that map', () => {
        expect(src()).toContain('__has_turnlive=""');
        expect(src()).toContain('${CREW_TURNLIVE[$(__crew_canon "$tree")]:-}');
      });
    });

    when('[t3] link 5 — the cap arm joins all THREE facts', () => {
      then('the arm is found — the anti-vacuity tooth', () => {
        expect(genCapArm().length).toBeGreaterThan(40);
      });

      then('🔴 it carries the STILL term', () => {
        expect(genCapArm()).toContain('-z "$__has_turnlive"');
      });

      then(
        '⚠️ and it keeps BOTH prior terms — this subtracts, it replaces none',
        () => {
          // the `at work` term is the 2026-09-14 cure: a capped clone keeps its
          // box drawn, so a live box is the PRECONDITION and not the disqualifier
          expect(genCapArm()).toContain('-n "$__cap_s"');
          expect(genCapArm()).toContain('"$crew_state" == "at work"');
        },
      );

      then('🔴 the RATE-LIMIT arm is NOT guarded the same way', () => {
        // .teeth = a wedge is an ERROR STRING in the tail, not a scrollback
        //          banner, and a wedged clone has already stopped. a guard
        //          copied across would suppress a real wedge
        const wedgeArm = asCode(readPollWhole())
          .split('\n')
          .filter(
            (l) =>
              l.includes('__has_ratelimit') &&
              l.includes('crew_status="limited"'),
          )
          .join('\n');
        expect(wedgeArm.length).toBeGreaterThan(20);
        expect(wedgeArm).not.toContain('__has_turnlive');
      });
    });

    when('[t4] the shipped arm is held against the same assertions', () => {
      then('🔴 it goes RED — the bite proof', () => {
        const shipped =
          'elif [[ -n "$__cap_s" && "$crew_state" == "at work" ]];  then crew_status="limited"';
        expect(shipped.includes('-n "$__cap_s"')).toEqual(true);
        expect(shipped.includes('"$crew_state" == "at work"')).toEqual(true);
        expect(shipped.includes('-z "$__has_turnlive"')).toEqual(false);
      });
    });
  });
});
