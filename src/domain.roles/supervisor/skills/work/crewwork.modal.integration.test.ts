// biome-ignore-all lint/suspicious/noControlCharactersInRegex: a captured pane
// IS a stream of ANSI escapes, so every clamp here must strip them before it
// reads the text. the \u001b is the subject of these regexes rather than a typo
// in them — the rule is a false positive over a terminal-capture corpus.
/**
 * .what = clamps on the permission modal — the cycle, the route, the ask, the verify
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
import { runCrew } from './work.harness';

// .why = each case makes a fake git root, and each runCrew makes a driver dir.
//        with no sweep, one run leaves ~30 dirs in the shared /tmp and the
//        hundredth leaves 3000. hermetic per-run is not hermetic over time.
afterAll(() => tempDirs.delAll());

describe('crewwork', () => {
  given('[case44] crew.modal, the entooled permission-modal cycle', () => {
    // .why = rule.always.entool-the-permission-modal-cycle grades the THIRD
    //   hand-run of the read/parse/send/verify cycle a blocker, and names the
    //   cure. measured 2026-09-17: four hand-runs across three babysit ticks.
    //   these teeth hold the two properties that make the verb safe to have —
    //   it never picks the answer, and it never guesses a key.
    const modalFn = (): string =>
      getShellFnBody({
        text: getShellLibWhole({ path: join(__dirname, 'crewwork.sh') }),
        fn: 'crew.modal',
      })
        .split('\n')
        .filter((line) => !/^\s*#/.test(line))
        .join('\n');

    when('[t0] the verb exists at the crew layer', () => {
      then('the body is found — the teeth below are not vacuous', () => {
        expect(modalFn().length).toBeGreaterThan(400);
      });

      then('a thin entrypoint carries it, as every crew verb does', () => {
        // a function with no skill file is unreachable from a tick — the
        // supervisor addresses `rhx git.crew.<verb>`, never a bash function.
        const skill = readFileSync(
          join(__dirname, '../git.crew.modal.sh'),
          'utf8',
        );
        expect(skill).toContain('crew.modal "${args[@]}"');
        expect(skill).toContain('--help');
      });
    });

    when('[t1] the judgment bound is read', () => {
      then('a bare call sends NAUGHT — the key rides only on --answer', () => {
        // the rule it pays bounds itself: it governs the MECHANIC of the
        // answer, never the JUDGMENT of which key to press.
        //
        // ⚠️ the guard's BODY is what carries the property, never its
        //   presence. an earlier draft of this tooth asserted only that the
        //   guard existed and preceded the send — so a body rewritten to
        //   `answer=approve` passed it while it defaulted a bare call to an
        //   APPROVAL. the tooth must read what the branch does.
        const body = modalFn();
        const guard = body.indexOf('if [[ -z "$answer" ]]; then');
        const send = body.indexOf('crew.send --tree "$tree"');
        expect(guard).toBeGreaterThan(-1);
        expect(send).toBeGreaterThan(guard);
        const branch = body.slice(guard, body.indexOf('fi', guard));
        expect(branch).toContain('return 0');
        expect(branch).not.toMatch(/answer=/);
      });

      then('--answer takes only approve|decline', () => {
        expect(modalFn()).toContain('""|approve|decline) ;;');
      });

      then('a broadcast is refused — one modal, one keyboard', () => {
        expect(modalFn()).toContain('--who takes ONE role');
      });
    });

    when('[t2] the key derivation is read', () => {
      then('approve keys on a BARE Yes, never on a position', () => {
        expect(modalFn()).toContain('"${opt_t[$__i]}" == "Yes"');
      });

      then('decline requires the No to sit LAST', () => {
        // option 2 on a three-option modal is "yes, and don't ask again" —
        // a grant beyond the run. the position is computed, never assumed.
        const body = modalFn();
        expect(body).toContain('last_n=');
        expect(body).toContain(
          '[[ "${opt_n[$__i]}" == "$last_n" ]] && key_no=',
        );
      });

      then('COUNTER: no literal 1 or 2 is ever sent as a key', () => {
        // the whole defect this verb prevents is a hardcoded position.
        const body = modalFn();
        expect(body).not.toMatch(/--keys\s+["']?[0-9]/);
        expect(body).toContain('--keys "$key"');
      });

      then('an unknown shape is REFUSED, never guessed', () => {
        const body = modalFn();
        expect(body).toContain('the decline key is UNKNOWN here');
        expect(body).toContain('NO option parsed');
      });
    });

    when('[t3] the frame anchor is read', () => {
      then('it keys on the modal frame, not on numbered lines', () => {
        // 🔴 RETARGETED 2026-09-20 — same property, new HOME. the two anchors
        //    moved out of `crew.modal`'s body and into `__crew_modal_region`,
        //    the named seam the option parser was extracted behind ([case59]).
        //    ⚠️ the tooth was pinned to the LOCATION, so the extract turned it
        //       red while the guarantee it grades never moved: a parse that
        //       keys on the FRAME cannot read a clone's own prose list as a
        //       modal. that is still what these two literals prove.
        const src = getShellLibWhole({ path: join(__dirname, 'crewwork.sh') });
        const at = src.indexOf('__crew_modal_region() {');
        expect(at).toBeGreaterThan(-1);
        const region = src.slice(at, src.indexOf('\n}\n', at));
        expect(region).toContain('Esc to cancel');
        expect(region).toContain('Do you want to');
        // and the verb still reaches the frame THROUGH that seam — an extract
        // nobody calls would pass the two teeth above and parse naught.
        expect(modalFn()).toContain('__crew_modal_region');
      });

      then('COUNTER: the known prose-list fixture carries NO frame', () => {
        // .test/.assets/pane.plea.prose-numbered-list-read-as-a-modal.log is
        // the repo's own recorded false positive — bare `1.`/`2.` in a
        // clone's prose. the anchor is what parts it from a real modal, so
        // the asset must actually lack the frame, or the anchor proves naught.
        const asset = readFileSync(
          join(
            __dirname,
            '.test/.assets/pane.plea.prose-numbered-list-read-as-a-modal.log',
          ),
          'utf8',
        );
        expect(asset).toMatch(/^\s*1\.\s/m);
        expect(asset).not.toContain('Esc to cancel');
        expect(asset).not.toContain('Do you want to');
      });
    });

    when('[t4] the consent carve-out is read', () => {
      then('a consent/transcript prompt cannot be approved', () => {
        const body = modalFn();
        expect(body).toContain('a consent/transcript prompt is never approved');
        expect(body).toMatch(/grep -qiE .transcript\|consent/);
      });
    });

    when('[t5] the verify half is read', () => {
      then(
        'it re-reads and checks the frame is GONE before it returns 0',
        () => {
          // the send's own report is not the evidence — rule.require.verify-
          // after-send: the read is a COMPARE, never a confirmation.
          const body = modalFn();
          const send = body.indexOf('crew.send --tree "$tree"');
          const after = body.indexOf('after="$(crew.read');
          expect(after).toBeGreaterThan(send);
          // 🟡 the verdict literal moved on 2026-09-19 when the one-shot read
          //    became a bounded poll ([case55]). the CLAIM this case grades is
          //    unchanged: a still-drawn frame after the verify is never a pass.
          expect(body.slice(after)).toContain('outcome UNCONFIRMED');
        },
      );
    });
  });

  /**
   * .what = a `--keys` send routes the caller to `git.crew.modal`, exactly as a
   *         `--what` send routes them to a cure-tool
   *
   * .why  = crew.send's nudge block carries a per-flag exemption:
   *
   *           "--keys (a modal answer) is exempt — it is the sanctioned modal
   *            path, not a steer."
   *
   *         that sentence was TRUE when it was written and is FALSE now.
   *         `git.crew.modal` was paved 2026-09-17 to pay
   *         rule.always.entool-the-permission-modal-cycle, and it IS the
   *         sanctioned modal path. so `--keys` became the braid on that date,
   *         and the exemption that blessed it never moved.
   *
   * 🔴 .the omission is INVISIBLE from every surface a supervisor reads
   *    measured 2026-09-19, over every brief in repo=.this/role=any:
   *
   *      grepsafe 'crew.modal'  -> matches: 0
   *      grepsafe 'keys 1'      -> 26 lines, 15 files
   *
   *    among the 15: `howto.run-a-babysit-tick.md` (the procedure read every
   *    tick) and `rule.require.babysit-cron-per-dispatch-fleet.md` (the cron
   *    prompt itself). so the verb exists and NOT ONE artifact routes a reader
   *    to it — the shape rule.always.forward-a-skill-render-verbatim already
   *    recorded: a rule nobody is routed to binds nobody.
   *
   *    the cost, same day: the cycle ran BY HAND four times in ONE tick, while
   *    the verb's own header grades the THIRD hand-run in a session a blocker.
   *
   * ⚠️ .it NUDGES and never blocks, and that bound is the point
   *    the modal verb itself refuses to pick the key — "a judgment call (is
   *    this command actually safe?) stays a driver decision every time". a
   *    hard gate on `--keys` would strand a driver who has read the pane and
   *    holds a judgment the tool declines to make. the peer `--what` nudge
   *    carries the identical posture, so this is one rule with two arms rather
   *    than a new gate.
   */
  given(
    '[case51] a modal answer is routed to the verb that was paved for it',
    () => {
      // ⚠️ the nudge lives in crew.send's ARG-CHECK preamble, which returns
      //    before any duct is touched — so the clamp is a SOURCE read, never a
      //    live send. a send would need a real modal on a real grove.
      const lib = (): string =>
        getShellLibWhole({ path: join(__dirname, 'crewwork.sh') });

      const sendBody = (): string => {
        // anchored on crew.send's OWN body. `--keys` appears throughout this
        // file — in duct.send, in heal, in the header prose — so a bare indexOf
        // lands on a peer and grades the wrong function while it reads green.
        const body = getShellFnBody({ text: lib(), fn: 'crew.send' });
        expect(body.length).toBeGreaterThan(0);
        return body;
      };

      const spokenLines = (): string[] =>
        sendBody()
          .split('\n')
          .filter((line) => !/^\s*#/.test(line));

      when('[t0] the nudge block is read from source', () => {
        then('🔴 the `--keys` arm names the paved verb', () => {
          // 🔴 COMMENTS STRIPPED. the block's own `.why` quotes the stale
          //    exemption verbatim to record it, so an unstripped match would
          //    grade the COMMENT that documents the defect as though it were the
          //    cure — green forever, guarding naught. this repair is MEASURED:
          //    the heal-fallback clamp above lost exactly that way on its first
          //    red run, and says so in its own note.
          expect(spokenLines().join('\n')).toContain('git.crew.modal');
        });

        then(
          '🔴 ANTI-VACUITY — the arm really is reachable from a `--keys` send',
          () => {
            // a nudge parked under `if [[ -n "$what" ]]` would satisfy the tooth
            // above and never fire on the flag this case exists for.
            const spoken = spokenLines();
            const at = spoken.findIndex((l) => l.includes('git.crew.modal'));
            expect(at).toBeGreaterThan(0);
            // walk BACK to the nearest guard and assert it opened on `$keys`
            const guard = spoken
              .slice(0, at)
              .reverse()
              .find((l) => /^\s*if \[\[/.test(l));
            expect(guard).toContain('$keys');
          },
        );

        then('it NUDGES — the send still proceeds', () => {
          // ⚠️ the bound from the .why. a `return 2` inside the keys arm would
          //    convert a reminder into a gate, and strand a driver holding a
          //    judgment `git.crew.modal` itself declines to make.
          const spoken = spokenLines();
          const at = spoken.findIndex((l) => l.includes('git.crew.modal'));
          // 🔴 ANCHORED, and this is a MEASURED repair. on the first RED run this
          //    tooth PASSED: with no match `findIndex` returns -1, `slice(-3, 2)`
          //    yields an empty array, and an empty string trivially fails to
          //    match. a bound tooth that can pass on the absence of its own
          //    subject guards naught (rule.forbid.failhide).
          expect(at).toBeGreaterThan(0);
          const arm = spoken.slice(at - 2, at + 3).join('\n');
          expect(arm).not.toMatch(/return [12]/);
        });
      });

      when('[t1] the two arms are held against each other', () => {
        then(
          '🔴 the stale exemption survives only as a RECORD, never as a claim',
          () => {
            // the comment is what taught the braid to every future reader of this
            // file. to nudge at runtime and leave the prose saying `--keys` is
            // exempt would cure the tool and keep teaching the defect.
            //
            // 🔴 but a bare `not.toContain` is WRONG here, and this is a MEASURED
            //    repair: it went red on the GREEN run against the cure's own `.why`
            //    block, which quotes the struck sentence verbatim to record it. the
            //    heal-fallback clamp above documents this exact trap from the other
            //    side — there an unstripped read graded a defect-record as a cure;
            //    here it graded a defect-record as the defect. one phrase, two
            //    senses, and only the FRAME parts them.
            const hits = lib()
              .split('\n')
              .filter((l) => l.includes('--keys (a modal answer) is exempt'));

            // the record is load-bearing — it carries WHY the exemption was struck,
            // which outlives the conclusion (rule.require.timeless-lessons). so its
            // deletion reddens this too, on purpose.
            expect(hits.length).toBe(1);

            // and the one survivor must be framed as history. a line that asserts
            // it live would omit the frame, and that is the defect returned.
            expect(hits[0]).toContain('once read');
          },
        );

        then('the `--what` arm is untouched — one rule, two arms', () => {
          expect(spokenLines().join('\n')).toContain('byhand steer');
        });
      });
    },
  );

  /**
   * .what = `crew.modal` renders the ASK — what a key would approve — beside the
   *         options it already parses
   *
   * .why  = the verb's own header draws its bound in bold:
   *
   *           "🔴 .it never picks the answer, and that is deliberate … a
   *            judgment call (is this command actually safe?) stays a driver
   *            decision every time."
   *
   *         it then withholds the one input that judgment needs. the option
   *         region is anchored AT the prompt —
   *
   *           /Do you want to/ { buf=""; grab=1; next }
   *
   *         — and every modal puts its SUBJECT above that line. so the verb
   *         renders the answer and omits the question.
   *
   * 🔴 .it is a HAZARD, never a friction
   *    a driver who walks the paved path reads `approve → 1` with no command
   *    beside it, and the cheapest next act is to send it. that inverts
   *    rule.require.safe-by-default in the exact verb
   *    rule.always.entool-the-permission-modal-cycle routes every supervisor to
   *    — and `rule.require.babysit-permission-approval` demands the FULL
   *    command be read before any key. the verb made that step skippable.
   *
   *    the fixture below is the sharp case: a THREE-option EDIT modal whose
   *    option 2 grants every edit for the whole session, and whose subject is a
   *    filename the render never showed.
   *
   * .measured 2026-09-19, on a live tick: the modal verb answered
   *    `approve → 1`, and a `crew.read` was still owed to learn what the key
   *    would run. half the braid, restored by the cure that retired it.
   *
   * ⚠️ .the ask is CAPPED, and says so when it caps
   *    an edit modal carries a whole diff. a render that pasted it whole would
   *    bury the options it exists to surface, so the ask is bounded and names
   *    the full read when it truncates — never a silent trim
   *    (term=partial-audit).
   */
  given('[case52] a modal renders the ASK, never the options alone', () => {
    // 🔴 a VERBATIM captured pane, already on disk — never a hand-typed shape.
    //    a modal I typed myself is my MODEL of a modal, and the model is what
    //    sits under suspicion
    //    (rule.always.clamp-the-verbatim-pane-your-classifier-judged).
    const asset = join(
      __dirname,
      '.test/.assets/pane.mode.lost-accept-edits-at-an-edit-modal.log',
    );

    const ask = (): { stdout: string; exit: number } =>
      runCrew({
        command: `cat '${asset}' | __crew_modal_strip_ansi | __crew_modal_ask`,
      }) as { stdout: string; exit: number };

    when('[t0] the ask region is carved from a real modal pane', () => {
      const result = useBeforeAll(async () => ask());

      then('🔴 it names the SUBJECT — the file this edit would touch', () => {
        // the whole defect in one assertion: this string sits ABOVE the
        // `Do you want to` anchor, so today's region never reaches it.
        expect(result.stdout).toContain(
          'blackbox/driver.route.stack.acceptance.test.ts',
        );
      });

      then('it names the KIND of act', () => {
        expect(result.stdout).toContain('Edit file');
      });

      // 🔴 every NEGATIVE tooth below is anchored on this first. a `not.toContain`
      //    over an absent ask passes trivially, and on the first RED run three
      //    of them did exactly that — green against a helper that did not yet
      //    exist (rule.forbid.failhide).
      //
      // ⚠️ and a `length > 0` anchor was NOT enough — MEASURED on the second red
      //    run, where all three stayed green. the harness appends an `__EXIT__`
      //    sentinel to every stdout, so "non-empty" is true even when the
      //    pipeline's last stage does not exist. the anchor must key on the
      //    ask's OWN content, never on the presence of bytes.
      const asked = (): string => {
        expect(result.stdout).toContain('Edit file');
        return result.stdout;
      };

      then('🔴 it stops AT the prompt — the options are the other half', () => {
        // an ask that swallowed the option list would duplicate the render
        // below it, and a reader could no longer tell subject from choice.
        expect(asked()).not.toContain('Do you want to');
        expect(asked()).not.toContain('Esc to cancel');
      });

      then(
        '🔴 it reaches back only to the FRAME, never into the transcript',
        () => {
          // ⚠️ the frame opens on a SOLID rule (─) and carries DASHED rules (╌)
          //    inside it. a reset on any rule would start the region at the last
          //    inner separator — one line above the prompt — and render an empty
          //    ask that reads like a modal with no subject.
          //    the line above the solid rule is the clone's own transcript.
          expect(asked()).not.toContain('● Update(');
        },
      );

      then('the inner chrome is dropped', () => {
        expect(asked()).not.toMatch(/╌╌╌╌╌╌╌╌/);
      });
    });

    when('[t1] the verb wires the ask into its own render', () => {
      const modalBody = (): string => {
        const src = getShellLibWhole({ path: join(__dirname, 'crewwork.sh') });
        const at = src.indexOf('\ncrew.modal() {');
        expect(at).toBeGreaterThan(0);
        return src.slice(at, src.indexOf('\n}\n', at));
      };

      then('🔴 the ask is rendered BEFORE the derived keys', () => {
        // ⚠️ ORDER is the property, not presence. a driver reads top-down and
        //    acts on the first actionable line; an ask printed under
        //    `approve → 1` arrives after the decision it exists to inform.
        // 🔴 COMMENTS STRIPPED — the cure's own `.why` quotes both markers.
        const spoken = modalBody()
          .split('\n')
          .filter((l) => !/^\s*#/.test(l))
          .join('\n');
        const atAsk = spoken.indexOf('__crew_modal_ask');
        const atKey = spoken.indexOf('🔑 approve');
        expect(atAsk).toBeGreaterThan(0);
        expect(atKey).toBeGreaterThan(0);
        expect(atAsk).toBeLessThan(atKey);
      });

      then('a truncated ask names the full read — never a silent trim', () => {
        const spoken = modalBody()
          .split('\n')
          .filter((l) => !/^\s*#/.test(l))
          .join('\n');
        // 🔴 ANCHORED on the ask arm. `git.crew.read --tree` already appears in
        //    this verb's no-option-parsed error path, so the bare match passed
        //    on the first RED run against a render that had no ask at all —
        //    a false green off a true string (rule.forbid.failhide).
        expect(spoken).toContain('__crew_modal_ask');
        const at = spoken.indexOf('__crew_modal_ask');
        expect(spoken.slice(at)).toContain('git.crew.read --tree');
      });
    });

    /**
     * .what = when the pane read FAILS, the verb names no cause it did not
     *         measure, and it surfaces the reason the read itself gave
     *
     * .why  = measured 2026-09-19, on a mistyped slug
     *         (`rhachet.beav.feat-acceptance-under-5min`; the tree is really
     *         `rhachet-roles-bhrain.beav.…`). the arm read:
     *
     *           pane="$(crew.read … 2>/dev/null)" || {
     *             echo "   └─ ✋ could not read the pane" >&2
     *
     *         TWO defects, stacked:
     *
     *         1. it asserts a cause it never measured — "the pane" is blamed,
     *            and for a wrong slug there IS no pane. a failed READ reported
     *            as a fact about the subject is `term=false-report`, and it
     *            sends the reader to the wrong box.
     *         2. `2>/dev/null` discarded the one read that settles it.
     *            crew.read fails loud with its own named reason, and for a
     *            rowless tree that reason is the three-cause ledger hint
     *            [case28] clamps — the exact discriminator this arm withheld.
     *
     *         ⇒ the cure is the same shape [case28] already carries one verb
     *           over: enumerate the shapes, rank NONE, prescribe the read.
     */
    when('[t2] the pane read fails', () => {
      const spokenBody = (): string => {
        const src = getShellLibWhole({ path: join(__dirname, 'crewwork.sh') });
        const at = src.indexOf('\ncrew.modal() {');
        expect(at).toBeGreaterThan(0);
        // 🔴 COMMENTS STRIPPED — the cure's own `.why` quotes the retired
        //    message verbatim, so a bare indexOf would read the rationale as
        //    the render and stay green through a full revert.
        return src
          .slice(at, src.indexOf('\n}\n', at))
          .split('\n')
          .filter((l) => !/^\s*#/.test(l))
          .join('\n');
      };

      const failArm = (): string => {
        const spoken = spokenBody();
        const marker = spoken.indexOf('the pane read FAILED');
        expect(marker).toBeGreaterThan(0);
        const end = spoken.indexOf('return 1', marker);
        expect(end).toBeGreaterThan(marker);
        return spoken.slice(marker, end);
      };

      then('🔴 the arm is real, and it refuses to rank a cause', () => {
        // ⚠️ ANTI-VACUITY: a slice keyed on an anchor is empty the moment the
        //    anchor drifts, and every assertion below would pass on ''.
        expect(failArm().length).toBeGreaterThan(300);
        expect(failArm()).toContain('will not name a cause it did not measure');
      });

      then('🔴 it enumerates BOTH shapes, never the pane alone', () => {
        const arm = failArm();
        expect(arm).toContain('TWO shapes fit');
        expect(arm).toContain('the TREE does not exist');
        expect(arm).toContain('a mistyped slug');
        expect(arm).toContain('no pane to fault');
        expect(arm).toContain('its duct is down');
      });

      then('it prescribes the read that settles it, and its outcome', () => {
        const arm = failArm();
        expect(arm).toContain(
          'rhx git.crew.ledger names every tree, cross-grove',
        );
        expect(arm).toContain('the slug is wrong or the tree is GONE');
      });

      then(
        "🔴 it re-runs the read so the read's OWN reason reaches the human",
        () => {
          // the first read swallowed stderr to keep the render clean. the arm
          // must therefore re-run it with stderr live — a read is idempotent and
          // side-effect free, so the second call is safe.
          const arm = failArm();
          expect(arm).toContain("the read's own reason follows");
          expect(arm).toContain('>/dev/null || true');
          // 🔴 the whole defect was `2>/dev/null` on the diagnostic path.
          expect(arm).not.toContain('2>/dev/null');
        },
      );

      then('the retired bare message is GONE from the verb', () => {
        expect(spokenBody()).not.toContain('✋ could not read the pane');
      });

      then('COUNTER — the ask wire and the no-modal arm are untouched', () => {
        // graded because the cure deliberately changed NEITHER. under a revert
        // of the cure these stay green, which is what makes them scope
        // evidence rather than more content teeth.
        const spoken = spokenBody();
        expect(spoken).toContain('__crew_modal_ask');
        expect(spoken).toContain('no modal — this pane carries no');
      });
    });
  });

  /**
   * .what = the option parser survives a NARROW pane, and says so when it
   *         cannot
   *
   * 🔴 .why — a SHORT count on a permission modal is the worst render this
   *    verb can produce, and it produced one.
   *
   *    .measured 2026-09-20, live, on
   *    `sdk-aws-lambda.beav.feat-input-only-validation-and-hydration/mechanic`.
   *    the pane drew THREE options:
   *
   *        ❯ 1. Yes
   *          2.Yes, and allow …/ access and
   *            for f, do echo, and done commands
   *           3. No
   *
   *    and the verb rendered `🚧 2 option(s)`, silently. the row it dropped is
   *    the one this verb's own header calls the hazard — the grant beyond this
   *    run. a supervisor who falls back to a hand-count off that render reads
   *    a TWO-option modal, and on a two-option modal `2` IS decline.
   *
   *    ⇒ so the defect hands a driver the exact key the header forbids, by
   *      way of a count that reads confident and is wrong (term=false-report).
   *
   * .the cause = `([0-9]+)\.[[:space:]]+` — the space after the dot was
   *    MANDATORY. `crew.refresh`'s own header already records the degradation
   *    ladder a narrow pane walks:
   *
   *        `2. Yes, and…`  ->  `2.Yes, and…`  ->  `2Yes, and…`
   *
   *    the parser matched only the first rung.
   *
   * .the cure, in two halves
   *    1. `[[:space:]]*` — the second rung parses. unambiguous, so it is cured
   *       rather than reported.
   *    2. the third rung stays UNPARSEABLE on purpose — a digit at the head of
   *       a line with no dot is genuinely ambiguous, and a guess would hand a
   *       driver a key the verb invented. so the count is graded against a
   *       row-count and NAMES itself short (rule.forbid.failhide), with the
   *       geometry cure beside it.
   *
   * 🔴 .and the parser was EXTRACTED to reach it
   *    it was a bare loop inside `crew.modal`, which calls `crew.read` and so
   *    needs a live duct — a parser with no seam is a parser with no clamp.
   *    the three named operations below (`__crew_modal_region`,
   *    `__crew_modal_options`, `__crew_modal_rows`) are half the cure
   *    (rule.always.entool-the-skills-you-touch).
   */
  given('[case59] a modal option that lost the space after its dot', () => {
    // 🔴 the GREEN control is a VERBATIM captured pane, already on disk.
    const green = join(
      __dirname,
      '.test/.assets/pane.mode.lost-accept-edits-at-an-edit-modal.log',
    );

    // 🔴 the RED fixture is that SAME verbatim pane with ONE byte removed —
    //    the space at `[37m2.[39m Yes` — which is the exact degradation
    //    measured live above. it is a DERIVATION, and it is named as one:
    //    the offending pane was drawn over before it could be captured, and
    //    a modal I typed from memory would be my MODEL of a modal, which is
    //    the thing under suspicion
    //    (rule.always.clamp-the-verbatim-pane-your-classifier-judged).
    //    ⇒ every other byte — the frame, the chrome, the diff, the wrap, the
    //      per-word escapes — is the world's.
    const red = join(
      __dirname,
      '.test/.assets/pane.modal.option-two-loses-the-space-after-its-dot.log',
    );

    const parse = (asset: string): { stdout: string; exit: number } =>
      runCrew({
        command: `cat '${asset}' | __crew_modal_strip_ansi | __crew_modal_region | __crew_modal_options`,
      }) as { stdout: string; exit: number };

    const rows = (asset: string): { stdout: string; exit: number } =>
      runCrew({
        command: `cat '${asset}' | __crew_modal_strip_ansi | __crew_modal_region | __crew_modal_rows`,
      }) as { stdout: string; exit: number };

    const parsed = (r: { stdout: string }): string[] =>
      r.stdout.split('\n').filter((l) => /^\d+\t/.test(l));

    when('[t0] the pane is WELL DRAWN — the space survives', () => {
      const result = useBeforeAll(async () => parse(green));

      then('all three options parse', () => {
        expect(parsed(result)).toEqual([
          '1\tYes',
          '2\tYes, allow all edits during this session (shift+tab)',
          '3\tNo',
        ]);
      });
    });

    when('[t1] the pane is NARROW — the space after the dot is eaten', () => {
      const result = useBeforeAll(async () => parse(red));

      // 🔴 THE tooth. under the shipped `[[:space:]]+` this array holds TWO
      //    rows, and the one it drops is row 2 — which is what makes the
      //    render dangerous rather than merely incomplete.
      then('🔴 all three still parse — the middle row is NOT dropped', () => {
        expect(parsed(result)).toHaveLength(3);
      });

      then('🔴 the row it used to drop is the GRANT, and it is back', () => {
        expect(parsed(result)[1]).toBe(
          '2\tYes, allow all edits during this session (shift+tab)',
        );
      });

      then('the derived keys are unmoved — approve 1, decline LAST', () => {
        // the keys are derived from option TEXT, so a dropped row never
        // mis-keyed them. the harm was always the COUNT a human reads.
        const list = parsed(result);
        expect(list[0]).toBe('1\tYes');
        expect(list[2]).toBe('3\tNo');
      });

      then('COUNTER: the fixture really does carry the defect shape', () => {
        // ⚠️ a red fixture that quietly kept its space would make every tooth
        //    above a copy of [t0] — green, and proving naught.
        const asset = readFileSync(red, 'utf8');
        expect(asset).toContain('m2.\u001b[39mYes, allow all edits');
        expect(asset).not.toContain('m2.\u001b[39m Yes, allow all edits');
        // and the WELL-DRAWN control must still hold the space it is the
        // control for.
        expect(readFileSync(green, 'utf8')).toContain(
          'm2.\u001b[39m Yes, allow all edits',
        );
      });
    });

    when('[t2] a row LOOKS like an option and cannot parse', () => {
      then(
        'the row count is the denominator the parsed count is graded on',
        () => {
          // both fixtures hold exactly three numbered rows, so `rows` must read
          // 3 on each — that is what lets the verb notice a SHORT parse at all.
          expect(rows(green).stdout).toContain('3');
          expect(rows(red).stdout).toContain('3');
        },
      );

      then('🔴 the verb NAMES a short count rather than swallow it', () => {
        const src = getShellLibWhole({ path: join(__dirname, 'crewwork.sh') });
        const at = src.indexOf('\ncrew.modal() {');
        const body = src.slice(at, src.indexOf('\n}\n', at));
        expect(body).toContain('__crew_modal_rows');
        expect(body).toContain('this count is SHORT');
        // the cure it prescribes is the GEOMETRY one — a narrow pane is what
        // eats the shape, so a re-read alone would return the same bytes.
        expect(body).toContain('rhx git.crew.refresh --tree $tree');
        expect(body).toContain('do NOT hand-count off this render');
      });
    });

    when('[t3] the shipped offender is read back', () => {
      const lib = (): string =>
        getShellLibWhole({ path: join(__dirname, 'crewwork.sh') });

      then('🔴 the mandatory-space form is GONE', () => {
        // the literal that shipped the defect. it may not return under any
        // refactor of this parser.
        expect(lib()).not.toContain('([0-9]+)\\.[[:space:]]+');
      });

      then('the optional-space form is what parses an option', () => {
        expect(lib()).toContain('([0-9]+)\\.[[:space:]]*(.*[^[:space:]])');
      });

      then('the dot stays MANDATORY — a bare digit is never a key', () => {
        // ⚠️ the counter-bound on the cure. relax the DOT too and a wrapped
        //    prose line (`2 of 3 files`) becomes option 2, so the verb would
        //    invent a key rather than report a short count.
        const fn = lib().slice(lib().indexOf('__crew_modal_options() {'));
        expect(fn.slice(0, 600)).toContain('\\.');
        expect(fn.slice(0, 600)).not.toContain('\\.?');
      });
    });
  });

  /**
   * 🔴 .a pane read is a GAUGE over a slot that TURNS
   *
   *   the statusline's right edge is ONE slot that several hints take turns
   *   in. measured 2026-09-19 on `…fix-budget-grant-needs-urgent-concession
   *   /mechanic`, the same slot rendered all three of these inside ~40s:
   *
   *     You've used 91% of your weekly limit · resets Sep 24, 6pm (UTC)
   *     3% until auto-compact
   *     (empty)
   *
   *   ⇒ so a supervisor who wants the budget line RACES it. measured twice in
   *     one tick: the line was read, and was gone seconds later when the
   *     `--raw` capture ran — so the asset did not hold its own subject and
   *     had to be discarded rather than hand-typed
   *     (rule.always.clamp-the-verbatim-pane-your-classifier-judged).
   *
   * 🔴 .and the escapes are PER WORD, which is what makes a naive cure WRONG
   *
   *   captured verbatim from the twin that shares this very slot, into
   *   `.test/.assets/pane.slot.right-edge-rotates-budget-and-autocompact.log`:
   *
   *     \033[37m3%\033[39m \033[37muntil\033[39m \033[37mauto-compact\033[39m
   *
   *   every word is wrapped on its own. so a phrase like `weekly limit` NEVER
   *   matches a `--raw` pane — its two words are parted by an escape run. a
   *   `--until` that matched the raw text would report a confident miss over a
   *   subject fully on screen: a `term=false-report` with a green face, and
   *   the WORST outcome available, because it would retire the instrument.
   *
   *   ⇒ [t0]'s third tooth is therefore the one that carries this case: the
   *     match on the STRIPPED text, the OUTPUT still raw. the caller wants the
   *     escapes in the fixture and cannot match through them, so the two
   *     cannot be the same string.
   */
  given(
    '[case55] the modal verify, and the nudge that fires on its own verb',
    () => {
      const lib55 = (): string =>
        getShellLibWhole({ path: join(__dirname, 'crewwork.sh') });

      const modalBody = (): string => {
        // anchored on crew.modal's OWN body — `Esc to cancel` and `--keys` both
        // appear in peers, so a bare indexOf grades the wrong function green.
        const body = getShellFnBody({ text: lib55(), fn: 'crew.modal' });
        expect(body.length).toBeGreaterThan(0);
        return body;
      };

      when('[t0] the verify block is read from source', () => {
        then(
          '🔴 it POLLS for the frame to clear — it does not read ONCE and accuse',
          () => {
            // 🔴 .teeth = the verify read the pane exactly once, the instant after
            //    the keystroke. a TUI repaints asynchronously, so the frame is
            //    still drawn at that instant on a key that LANDED — and the verb
            //    then returns 1 and tells the operator the answer may have missed.
            //
            //    measured 2026-09-19, TWICE, on rhachet.beav.fix-keyrack-daemon-
            //    orphan and rhachet.beav.fix-test-tempdir-leak. both answers
            //    landed — modal gone, edit made, turn completed — and both runs
            //    rendered `⚠️ a modal frame is STILL present … the key may not
            //    have landed` and exited 1 (term=false-report: true of the read it
            //    took, false of the world).
            //
            // 🔴 .and the harm is not noise. an operator who believes the key
            //    missed SENDS IT AGAIN, and a second key on a cleared modal lands
            //    in the EMPTY BOX as literal text (term=duct.box.unread). so the
            //    false warn invites the exact defect it means to prevent.
            //
            //    ⇒ this is the THIRD site of one root cause, all cured this tick:
            //      a ONE-SHOT read used as a verdict where a bounded poll is owed.
            //      the other two are __crew_heal_revive's caret poll and
            //      __crew_heal_one's picker arm.
            //
            // .delete the poll to see this go red.
            const body = modalBody();
            const afterSend = body.slice(
              body.indexOf('🔧 key'),
              body.indexOf('STILL present'),
            );
            expect(afterSend).not.toEqual('');
            expect(/for attempt in/.test(afterSend)).toEqual(true);
            expect(/crew\.read/.test(afterSend)).toEqual(true);
            // the interval is a var so a clamp can zero it (rule.require.fast-tests),
            // exactly as CREW_RESUME_POLL_SECS is for the revive poll.
            expect(/CREW_MODAL_POLL_SECS/.test(body)).toEqual(true);
          },
        );

        then('🔴 the UNCONFIRMED verdict forbids a re-send outright', () => {
          // .teeth = "the key may not have landed" is an invitation to repeat
          //    the keystroke, and the repeat is the recorded harm. the verdict
          //    must name the settle-read AND refuse the re-send, the same shape
          //    the revive give-up carries ("do NOT re-heal").
          expect(modalBody()).toContain('do NOT re-send');
        });
      });

      when('[t1] crew.send is read for the byhand-modal nudge', () => {
        then(
          '🔴 the nudge does NOT fire on crew.modal own internal send',
          () => {
            // 🔴 .teeth = crew.modal answers through `crew.send --keys`, and the
            //    byhand nudge fires on `--keys`. so the PAVED verb renders, on its
            //    own output, `🪝 byhand modal answer — a key counted and sent by
            //    hand … the cycle is paved: rhx git.crew.modal` — advice to use
            //    the verb that emitted it, and the claim `by hand` is false: the
            //    key was counted and sent by the tool.
            //
            //    measured 2026-09-19 on both runs above. a nudge that cries on the
            //    cure teaches the operator to read past it, which is how a
            //    guardrail is spent (rule.forbid.remedies-that-mimic-the-defect).
            //
            // .drop the inflight guard to see this go red.
            const sendBody = getShellFnBody({ text: lib55(), fn: 'crew.send' });
            expect(sendBody).toContain('__CREW_MODAL_ANSWER_INFLIGHT');
            expect(modalBody()).toContain('__CREW_MODAL_ANSWER_INFLIGHT');
          },
        );
      });
    },
  );
});
