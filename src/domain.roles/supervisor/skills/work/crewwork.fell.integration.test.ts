/**
 * .what = clamps on fell — the sweep verdict, the emitted verb, the grove, the fence
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
import { readPollWhole } from './crewwork.harness';
import { runCrew } from './work.harness';

// .why = each case makes a fake git root, and each runCrew makes a driver dir.
//        with no sweep, one run leaves ~30 dirs in the shared /tmp and the
//        hundredth leaves 3000. hermetic per-run is not hermetic over time.
afterAll(() => tempDirs.delAll());

describe('crewwork', () => {
  /**
   * .what = the ON-GROVE caveat that must ride every FELL-set verdict
   *
   * .why  = UNREACHED and ON GROVE are two DIFFERENT omissions, and case20
   *         covers only the first. a grove that ANSWERS still yields no
   *         release verdict for its trees: the tree half of `git.crew.poll`
   *         is local by construction (`__crew_tree_dir`, `git -C`, `gh pr`),
   *         so `__poll_one_tree` returns the declined verdict `🌐 on grove`
   *         before any release read runs.
   *
   *         .measured 2026-09-16 —
   *         `svc-reservations.beav.feat-rec-waitlist-capture` shipped to
   *         PRODUCTION (PR #355 merged 07:12:14Z, release-please cut v0.74.0,
   *         prod deploy green) and the same tick rendered
   *
   *           🦫 no tree to fell — 40 polled, none merged · ⚠️  4 grove(s) UNREACHED
   *
   *         the unreached caveat DID ride that line. it named the wrong
   *         omission — all six sponsored crews sit on groves that answered.
   *         so "none merged" was a claim about the world derived from the
   *         trees on ONE box: term=partial-audit with a confident face.
   *
   *   ⚠️  it must NOT ride `--healable`. that view keys on `crew_status`,
   *       which IS read cross-grove, so a grove tree's heal verdict is a real
   *       judgment. a caveat there would disclaim a subject the view saw.
   */
  given('[case28] a fell sweep whose trees sit on a reachable grove', () => {
    when('[t0] the caveat is asked for a NON-ZERO on-grove count', () => {
      const result = useBeforeAll(async () =>
        runCrew({
          command: [
            'printf "DECLARED[%s]\\n" "$(declare -F __crew_ongrove_caveat >/dev/null 2>&1 && printf yes || printf no)"',
            'printf "CAVEAT[%s]\\n" "$(__crew_ongrove_caveat 6)"',
          ].join('\n'),
        }),
      );

      then('the subject exists — the clamp is not vacuous', () => {
        expect(result.stdout).toContain('DECLARED[yes]');
      });

      then('it names the count, so the omission is declared not silent', () => {
        expect(result.stdout).toContain('6 tree(s) ON GROVE');
      });

      then('it names WHICH read was declined, never a bare disclaimer', () => {
        expect(result.stdout).toContain('release state NOT read');
      });

      then('it is marked as a caveat, never as ordinary tally prose', () => {
        expect(result.stdout).toContain('⚠️');
      });
    });

    /**
     * ⚠️ TOOTH, the pair of case20 [t1]. an all-local fleet reads every tree,
     *    so a caveat there is noise on every tick — and noise is what trains
     *    a reader to skip the line.
     */
    when('[t1] the caveat is asked for a ZERO on-grove count', () => {
      const result = useBeforeAll(async () =>
        runCrew({
          command: 'printf "CAVEAT[%s]\\n" "$(__crew_ongrove_caveat 0)"',
        }),
      );

      then('it says naught — an all-local sweep carries no caveat', () => {
        expect(result.stdout).toContain('CAVEAT[]');
        expect(result.stdout).not.toContain('ON GROVE');
      });
    });

    /**
     * ⚠️ TOOTH. the operation can be perfect and the defect remain: what it
     *    actually was, is a verdict line that never CALLED it. so the clamp
     *    that catches a fell verdict added tomorrow must read the call sites.
     */
    when('[t2] the FELL verdict lines are read from source', () => {
      const fellVerdicts = readPollWhole()
        .split('\n')
        .filter((line) => /echo "🦫 /.test(line))
        .filter((line) => /to fell/.test(line));

      then(
        'there are fell verdicts to grade — the clamp is not vacuous',
        () => {
          expect(fellVerdicts.length).toBeGreaterThanOrEqual(3);
        },
      );

      then('EVERY one carries the on-grove caveat', () => {
        expect(
          fellVerdicts.filter(
            (line) => !line.includes('__crew_ongrove_caveat'),
          ),
        ).toEqual([]);
      });
    });

    /**
     * ⚠️ the BOUND, stated as a clamp rather than a comment. `--healable`
     *    keys on crew_status, read cross-grove — so a caveat there disclaims
     *    a judgment the view genuinely made.
     */
    when('[t3] the HEAL verdict lines are read from source', () => {
      const healVerdicts = readPollWhole()
        .split('\n')
        .filter((line) => /echo "🦫 /.test(line))
        .filter((line) => /to heal/.test(line));

      then(
        'there are heal verdicts to grade — the clamp is not vacuous',
        () => {
          expect(healVerdicts.length).toBeGreaterThanOrEqual(2);
        },
      );

      then('NOT ONE carries the on-grove caveat', () => {
        expect(
          healVerdicts.filter((line) => line.includes('__crew_ongrove_caveat')),
        ).toEqual([]);
      });
    });
  });

  /**
   * .what = the SCOPE PHRASE inside the empty-fell verdict — the count the
   *         sentence itself quotes, before any caveat is appended to it.
   *
   * .why  = case28 made the on-grove caveat RIDE that line, and the caveat is
   *         correct. the HEADLINE it rides beside is not:
   *
   *           🦫 no tree to fell — 41 polled, none merged · ⚠️  25 tree(s) ON GROVE …
   *
   *         "41 polled, none merged" asserts a release verdict over 41 trees
   *         while 25 of them were never read for one. the caveat then disclaims,
   *         in a later clause, the claim the first clause already made — and a
   *         reader who keys on the count meets the claim first.
   *
   * 🔴 .the harm is a DECISION, not a cosmetic one, and it was measured on a
   *     STALLED grove. the babysit tick contract reads:
   *
   *       "on a genuine stall … fell what `git.crew.poll --fellable` names;
   *        0 fellable on a stalled grove is a PROVISION decision for the human"
   *
   *     so an empty set from `--fellable` is the exact input that escalates a
   *     spend. .measured 2026-09-16, grove-sandpine-v20260901 at load 7.17/4,
   *     idle 0%, runq 6: the view rendered `41 polled, none merged` while
   *     `svc-reservations.beav.feat-rec-waitlist-capture` held PR #355,
   *     MERGED 07:12:14Z — verified by hand that same tick. a real fell was
   *     available and the render said there was none, on the one tick where an
   *     empty set buys a provision ask.
   *
   * ⚠️ this does NOT build the owed instrument. the release read for a grove
   *    tree needs org/repo/branch, and this case read them as derivable only
   *    from the slug's dots — which `git.crew.poll.sh` forbids by name ("a
   *    claim about a NAME rather than a read of the subject"). what is cured
   *    here is the SENTENCE: a verdict may not quote a denominator it did not
   *    read.
   *
   * ✅ .the instrument LANDED 2026-09-17, and the premise above was wrong
   *    org/repo/branch never had to come from the slug. `__poll_tree_facts_on_grove`
   *    asks the GROVE for them in one ssh — `git remote get-url origin` and
   *    `rev-parse --abbrev-ref HEAD`, a read of the subject rather than a claim
   *    about its name. the forbid was honored and the fact was reachable all
   *    along; what stood in the way was the assumption that a remote read was
   *    a different instrument.
   *
   *    ⇒ the sentence cure this case guards still holds, and stands on its own.
   *      the note is corrected rather than deleted, because an "owed" arrear
   *      left on the record after it is paid is the same stale-disclaimer
   *      mechanism [case41] exists to punish.
   */
  given('[case30] an empty fell verdict whose sweep left trees unread', () => {
    when(
      '[t0] the phrase is asked for a sweep with trees left ON GROVE',
      () => {
        const result = useBeforeAll(async () =>
          runCrew({
            command: [
              'printf "DECLARED[%s]\\n" "$(declare -F __crew_fell_scope_phrase >/dev/null 2>&1 && printf yes || printf no)"',
              'printf "PHRASE[%s]\\n" "$(__crew_fell_scope_phrase 41 25)"',
            ].join('\n'),
          }),
        );

        then('the subject exists — the clamp is not vacuous', () => {
          expect(result.stdout).toContain('DECLARED[yes]');
        });

        /**
         * ⚠️ TOOTH. the numerator is what the sweep actually READ (41 - 25), and
         *    the denominator rides along so the reader can see the gap. a phrase
         *    that quoted 41 alone is the defect this case exists for.
         */
        then('it quotes what was READ, never the whole poll', () => {
          expect(result.stdout).toContain('PHRASE[16 of 41 read, none merged]');
        });

        then('it does NOT assert the full count as polled-and-clean', () => {
          expect(result.stdout).not.toContain('41 polled');
        });
      },
    );

    /**
     * ⚠️ TOOTH, the pair. on an ALL-LOCAL fleet every tree IS read, so the
     *    plain phrase is the honest one — and to render "41 of 41 read" there
     *    would be noise that trains a reader to skip the count.
     */
    when('[t1] the phrase is asked for a sweep that read every tree', () => {
      const result = useBeforeAll(async () =>
        runCrew({
          command: 'printf "PHRASE[%s]\\n" "$(__crew_fell_scope_phrase 41 0)"',
        }),
      );

      then('it reads plainly — a complete sweep quotes its whole count', () => {
        expect(result.stdout).toContain('PHRASE[41 polled, none merged]');
      });

      then('it carries no of-N gap clause', () => {
        expect(result.stdout).not.toContain('read, none merged');
      });
    });

    /**
     * ⚠️ TOOTH. the operation can be perfect and the defect remain — exactly
     *    as case28 [t2] records. the empty-fell verdict must CALL it.
     */
    when('[t2] the empty-fell verdict line is read from source', () => {
      const emptyFellVerdicts = readPollWhole()
        .split('\n')
        .filter((line) => /echo "🦫 no tree to fell —/.test(line));

      then('there is an empty-fell verdict to grade — not vacuous', () => {
        expect(emptyFellVerdicts.length).toBeGreaterThanOrEqual(1);
      });

      then('EVERY one derives its count through the phrase', () => {
        expect(
          emptyFellVerdicts.filter(
            (line) => !line.includes('__crew_fell_scope_phrase'),
          ),
        ).toEqual([]);
      });

      then('NOT ONE still interpolates the raw polled count', () => {
        expect(
          emptyFellVerdicts.filter((line) => line.includes('$ROWS polled')),
        ).toEqual([]);
      });
    });
  });

  /**
   * .what = may a MERGED, clean tree be felled while a clone holds its pane?
   *
   * 🔴 .why  = `--fellable` fences every tree whose crew holds a live clone,
   *         and it reads that fence off `crew_state == "at work"` alone. its
   *         own comment states the inference:
   *
   *           "`at work` + NOT cloneless means a real claude session holds
   *            this tree, at work on real work, right now"
   *
   *         the second clause does not follow. `at work` means a claude
   *         session EXISTS. a clone that ended its turn twelve minutes ago
   *         satisfies it, and goes on satisfying it forever.
   *
   *   ⚠️  so the render — `merged and clean, but a clone still holds the pane
   *       — wait for it to finish` — names a wait that never ends. the
   *       refusal is PERMANENT and its wording promises it is temporary, so a
   *       supervisor waits across tick after tick and the tree is never
   *       closed out.
   *
   *       measured 2026-09-17: `rhachet-brains-fireworksai.beav.fix-prompt-
   *       cache-affinity` carried that line for three consecutive ticks. its
   *       mechanic had delivered its final report and sat at an empty box on
   *       `✻ Brewed for 12m 18s`. the human read the pane themselves and
   *       asked "fellable?" — the tool never would have said so.
   *
   * 🔴 .the discriminator was ALREADY DERIVED, in the same file
   *       `CREW_TURNENDED` is filed by `__crew_record_turnended`, and its own
   *       comment at the join site reads "it refutes exactly two `inflight`
   *       claims". the fell fence is a THIRD, and it never reached for it.
   *       ⇒ `rule.require.enumerate-before-you-name`: the fence enumerates
   *         LIVE CLONES and the set it meant is CLONES AT WORK. same shape as
   *         the ghost fencer (the eleventh instance), where the parting
   *         literal also sat declared in its own file.
   *
   * .how  = the judgment is extracted into `__crew_clones_idle`, which takes
   *         the boxes map and the turnended map as ARGUMENTS. that keeps it
   *         free of the caller's globals and clampable with no live fleet —
   *         the same shape `__crew_unreached_caveat` already uses.
   *
   * 🔴 .it FAILS CLOSED, and the teeth below are mostly about that
   *       the incident this fence was built for is real: task #33, a mechanic
   *       2m42s into `git.release --into prod --mode apply --watch` on a tree
   *       github had already merged. a fell there kills a prod release in
   *       flight. so `idle` is asserted only where every live pane PROVES it,
   *       and every other shape — a modal, a queue, an unread box, an absent
   *       turnended — keeps the fence shut.
   */
  given('[case31] a merged tree whose clone holds the pane', () => {
    /**
     * 🔴 .why the UNDECLARED arm, and why it is not merely tidy
     *
     *   an absent function makes `if __crew_clones_idle …` fail, and a
     *   failed `if` takes the else — so every BUSY tooth below would read
     *   GREEN with no subject at all. measured on the first draft of this
     *   very block: 7 of 10 assertions passed under a full revert.
     *
     *   ⇒ that is `rule.forbid.failhide` at the clamp layer, and it is the
     *     exact shape that cost two clamps their teeth this week. so the
     *     absent case gets a THIRD verdict word, which matches neither
     *     expectation and drives all 10 red.
     */
    const idle = async (boxes: string, turnended: string) =>
      runCrew({
        command: [
          `printf "DECLARED[%s]\\n" "$(declare -F __crew_clones_idle >/dev/null 2>&1 && printf yes || printf no)"`,
          `declare -F __crew_clones_idle >/dev/null 2>&1 || { printf "VERDICT[undeclared]\\n"; exit 0; }`,
          `if __crew_clones_idle ${boxes} ${turnended}; then printf "VERDICT[idle]\\n"; else printf "VERDICT[busy]\\n"; fi`,
        ].join('\n'),
      });

    when('[t0] the mechanic ended its turn and its box is empty', () => {
      const result = useBeforeAll(async () =>
        idle(
          `"foreman:shell mechanic:empty reflector:shell"`,
          `"$(printf 'mechanic=Brewed for 12m 18s\\n')"`,
        ),
      );

      then('the subject exists — the clamp is not vacuous', () => {
        expect(result.stdout).toContain('DECLARED[yes]');
      });

      then('it reads IDLE, so the fell fence lifts', () => {
        expect(result.stdout).toContain('VERDICT[idle]');
      });
    });

    /**
     * 🔴 THE TOOTH THAT MATTERS — task #33, restated. a clone mid-turn is the
     *    whole reason the fence exists, and no refinement may reach it.
     */
    when('[t1] TOOTH: the mechanic is MID-TURN — no turnended at all', () => {
      const result = useBeforeAll(async () =>
        idle(`"foreman:shell mechanic:empty reflector:shell"`, `""`),
      );

      then('it reads BUSY — the fence stays shut', () => {
        expect(result.stdout).toContain('VERDICT[busy]');
      });
    });

    /**
     * ⚠️ TOOTH. turnended is filed PER ROLE, so `any` is the wrong quantifier.
     *    a mechanic that finished while a reflector still drives is a crew at
     *    work, and an `any` test would fell it.
     */
    when('[t2] TOOTH: one role ended its turn, a PEER still drives', () => {
      const result = useBeforeAll(async () =>
        idle(
          `"foreman:shell mechanic:empty reflector:empty"`,
          `"$(printf 'mechanic=Brewed for 12m 18s\\n')"`,
        ),
      );

      then('it reads BUSY — every live pane must prove it, not one', () => {
        expect(result.stdout).toContain('VERDICT[busy]');
      });
    });

    /**
     * ⚠️ TOOTH. a turn that ended at a MODAL is not idle — the clone stopped
     *    to ask, and the ask is a decision someone owes it. felling there
     *    discards the question.
     */
    when('[t3] TOOTH: the turn ended at a PROMPT', () => {
      const result = useBeforeAll(async () =>
        idle(
          `"foreman:shell mechanic:🚧prompt"`,
          `"$(printf 'mechanic=Brewed for 3m\\n')"`,
        ),
      );

      then('it reads BUSY — a modal is not an idle box', () => {
        expect(result.stdout).toContain('VERDICT[busy]');
      });
    });

    /**
     * ⚠️ TOOTH. a QUEUED box holds a message no turn will drain — that is the
     *    `frozen` state, whose cure is a read and a submit, never a fell.
     */
    when('[t4] TOOTH: the turn ended over a QUEUED box', () => {
      const result = useBeforeAll(async () =>
        idle(
          `"foreman:shell mechanic:📬queued"`,
          `"$(printf 'mechanic=Brewed for 9m\\n')"`,
        ),
      );

      then('it reads BUSY — a parked message is work owed', () => {
        expect(result.stdout).toContain('VERDICT[busy]');
      });
    });

    /**
     * 🔴 TOOTH. we did not LOOK. an unread box is a claim about the read, and
     *    the fail-safe direction on a DESTRUCTIVE act is always shut.
     */
    when('[t5] TOOTH: a live role`s box went UNREAD', () => {
      const result = useBeforeAll(async () =>
        idle(
          `"foreman:shell mechanic:empty reflector:❔unread"`,
          `"$(printf 'mechanic=Brewed for 12m\\n')"`,
        ),
      );

      then('it reads BUSY — an unread box proves naught', () => {
        expect(result.stdout).toContain('VERDICT[busy]');
      });
    });

    /**
     * ⚠️ TOOTH. absent box data is the same failed read, one step earlier.
     */
    when('[t6] TOOTH: no box data at all', () => {
      const result = useBeforeAll(async () =>
        idle(`""`, `"$(printf 'mechanic=Brewed for 12m\\n')"`),
      );

      then('it reads BUSY — an empty map is not an idle crew', () => {
        expect(result.stdout).toContain('VERDICT[busy]');
      });
    });

    /**
     * ⚠️ TOOTH. a crew of seats alone has no clone to prove idle, and the
     *    caller already routes that case through `crew_cloneless`. this must
     *    not become a second, looser path to the same fell.
     */
    when('[t7] TOOTH: every pane is a bare seat', () => {
      const result = useBeforeAll(async () =>
        idle(`"foreman:shell mechanic:shell reflector:shell"`, `""`),
      );

      then('it reads BUSY — no live clone testified either way', () => {
        expect(result.stdout).toContain('VERDICT[busy]');
      });
    });

    /**
     * ⚠️ the FOREMAN is exempt by contract — a bare shell by design, so its
     *    box proves naught in either direction. same exemption the orphan arm
     *    already takes (git.crew.poll.sh, `__ob_role == foreman`).
     */
    when('[t8] a foreman pane that is NOT a shell', () => {
      const result = useBeforeAll(async () =>
        idle(
          `"foreman:empty mechanic:empty"`,
          `"$(printf 'mechanic=Brewed for 12m\\n')"`,
        ),
      );

      then('it reads IDLE — the foreman carries no vote', () => {
        expect(result.stdout).toContain('VERDICT[idle]');
      });
    });

    /**
     * 🔴 THE JOIN. the function above is worth naught unless the fence calls
     *    it. this is the half that the ghost-fencer round proved you must
     *    clamp separately: a cure can be correct and never wired.
     */
    when('[t9] the fell fence in git.crew.poll', () => {
      const src = (): string =>
        readPollWhole()
          // 🔴 COMMENTS STRIPPED. measured twice this week: a `.why` block
          //    that NAMES the guard reads as the guard to a bare indexOf, and
          //    both clamps stayed green through a full revert.
          .split('\n')
          .filter((line) => !/^\s*#/.test(line))
          .join('\n');

      then('the fence consults the idle judgment', () => {
        expect(src()).toContain('__crew_clones_idle');
      });

      then('the FENCED line no longer promises a wait that ends', () => {
        // 🔴 RETARGETED 2026-09-18. this arm used to filter on `merged and
        //    clean, but a clone`, the wording of the prior repair. that repair
        //    swapped one unfalsifiable wait ("wait for it to finish") for
        //    another ("a clone is MID-TURN — it lifts on its own once the turn
        //    ends"), and case48 records the tree that sat behind the second for
        //    three ticks with its turn twelve hours over. the filter is now the
        //    render's own marker, so the arm grades the line that exists.
        const lines = readPollWhole()
          .split('\n')
          .filter((line) => !/^\s*#/.test(line) && /FENCED —/.test(line));
        // ⚠️ ANTI-VACUITY — a re-worded render would empty this filter and
        //    read as a clean pass (`rule.forbid.failhide`).
        expect(lines.length).toBeGreaterThan(0);
        for (const line of lines) {
          expect(line).not.toContain('wait for it to finish');
          expect(line).not.toContain('wait for it"');
        }
      });

      then('it names what the fence SAW, never what a clone does', () => {
        // 🔴 the prior arm here asserted the render names "the ONE state that
        //    still fences". that claim is false about this fence:
        //    `__crew_clones_idle` fails closed on a modal, a queue, an unread
        //    box, or a pane read that did not land — four states, not one. so
        //    the honest render reports its own EVIDENCE, and the tooth moved
        //    with it (`rule.require.enumerate-before-you-name`).
        expect(src()).toContain('no turn-end was seen');
        expect(src()).toContain('fails closed');
      });
    });
  });

  /**
   * [case32] a FELL row carries the ask, never the bare command
   *
   * .what = both sites that emit `git.tree.del` also emit CONFIRM FIRST, and
   *   both say what the safety gate can NOT check.
   *
   * .why = the command travelled alone for the life of this view, and a
   *   supervisor supplied the absent half from memory. memory failed in BOTH
   *   directions inside one session — four ticks waited for the human to type
   *   it ("how come this isnt felled still ?"), then the next tick ran one with
   *   no ask at all. a reminder in the render fails in neither.
   *
   * 🔴 .the seam every tooth here defends
   *   `git tree del` fails closed on unstaged commits and unmerged PRs, so a
   *   tree on this list is mechanically SAFE to fell. that answers a question
   *   about bytes. it cannot answer whether the human still WANTS the tree
   *   gone, which is a decision no tool holds. a render that states only the
   *   first invites the second to be inferred.
   *
   * .why TWO sites: the command is emitted twice, from independent code, and
   *   neither emit can be wrong — so a second copy is a second chance, never a
   *   duplicate (`rule.require.a-cue-is-not-a-claim`).
   */
  given('[case40] a fell command emitted by git.crew.poll', () => {
    // 🔴 COMMENTS STRIPPED FIRST, then searched — never sliced then filtered.
    //    three clamps this week anchored on a string that also appears in a
    //    header-comment sample render, and stayed green through a full revert.
    //    the strip-then-search order kills that whole class.
    const src = (): string =>
      readPollWhole()
        .split('\n')
        .filter((line) => !/^\s*#/.test(line))
        .join('\n');

    // 🔴 SCOPED TO THE FELL SET — `$__ct` — never to the verb alone.
    //    this case governs the CONFIRM-FIRST ask, and that ask is owed by the
    //    fell set alone. the footer holds two peer rows that also call the
    //    verb and owe no ask:
    //
    //      `$__t`  unsponsored — "sponsor it, or fell it" is a SUGGESTION,
    //              not a fell-set row, and the human is the one it addresses
    //      `$__pt` phantom     — the tree is ALREADY gone, so there is no
    //                            work to lose and no consent to seek
    //
    //    a filter on the verb alone swept both in and failed two binds that
    //    are correct (measured here, 2026-09-20, when `git.tree.del --name`
    //    was cured to `git.crew.fell --tree` and this filter followed it).
    //
    //    ⚠️ and the scope is NOT the ask itself — to filter on `CONFIRM
    //       FIRST` then assert `CONFIRM FIRST` is a tooth that cannot bite.
    //       `$__ct` is the fell set's own loop var, so it names the subject
    //       without any reference to the property under guard.
    const fellEmits = (): string[] =>
      src()
        .split('\n')
        .filter((line) => line.includes('git.crew.fell --tree $__ct'));

    when('[t0] the emit sites are read', () => {
      then('both of them are present — the teeth below are not vacuous', () => {
        // ⚠️ ANTI-VACUITY. a rename of the verb would empty every filter
        //    below and read as a clean pass (`rule.forbid.failhide`).
        expect(fellEmits().length).toBeGreaterThanOrEqual(2);
      });

      then('EVERY emit carries the ask, so no copy can travel bare', () => {
        for (const line of fellEmits()) {
          expect(line).toContain('CONFIRM FIRST');
        }
      });

      then('COUNTER: the runnable command survives beside the ask', () => {
        // the reminder must not displace the command it governs — a row that
        // says "ask first" and drops the command trades one gap for another.
        for (const line of fellEmits()) {
          expect(line).toContain('rhx git.crew.fell --tree');
        }
      });
    });

    when('[t1] the note beneath the --fellable list is read', () => {
      then('it names the question the gate ANSWERS', () => {
        expect(src()).toContain('is the WORK safe to lose');
      });

      then('it names the question the gate CANNOT answer', () => {
        expect(src()).toContain('does the human still want');
      });

      then(
        'it grades the fell a DECISION, so safety is not read as consent',
        () => {
          expect(src()).toMatch(/DECISION and is theirs/);
        },
      );
    });

    when('[t2] the ACTIONS footer is read', () => {
      then('it carries the seam once for the whole set', () => {
        expect(src()).toMatch(/SAFE \(merged, clean\) yet UNASKED/);
      });

      then('COUNTER: an EMPTY fell set emits no reminder at all', () => {
        // churn is the mirror failure. a set-level note printed over zero
        // trees teaches a reader to skip the whole row class.
        const guarded = src()
          .split('\n')
          .filter((line) => line.includes('yet UNASKED'));
        expect(guarded.length).toBeGreaterThan(0);
        const joined = src();
        const at = joined.indexOf('yet UNASKED');
        const before = joined.slice(Math.max(0, at - 400), at);
        expect(before).toContain('${#FELLABLE_TREES[@]} > 0');
      });
    });
  });

  /**
   * [case42] a fell emit names the WHOLE verb, never the tree half
   *
   * .what = every fell line this poll emits calls `rhx git.crew.fell --tree`,
   *   never `rhx git.tree.del --name`. and no emit hand-passes a grove.
   *
   * 🔴 .measured 2026-09-20 — the poll recommended a crew BOOT for two trees
   *   it had felled twenty minutes earlier, off its own emitted lines.
   *
   *   `git.tree.del` removes the worktree and stops there. `git.crew.fell`
   *   delegates the tree to it and drops the CREW LEDGER ROW on top. this
   *   poll's row set is `crew ledger ∪ duct registry ∪ live tmux`, so a ledger
   *   row that outlives its tree renders as `💀 NO DUCT` — and the cure this
   *   same footer then names for a duct-less crew is `git.crew.boot`. a
   *   phantom, recommended into existence by the very view that felled it.
   *
   * ⚠️ the repo already held this claim in words. `crew.stop` was cured to
   *   point at the whole verb, and the phantom footer (task #38) emits
   *   `git.crew.fell --tree` per stale row. so the rule was settled and these
   *   two call sites were simply missed.
   *
   * ✅ the grove flag retires WITH the verb, and that is the point rather than
   *   a side effect. [case34] guarded `--grove` on every emit because a
   *   `git.tree.del` with no grove exits 0 against localhost and reports
   *   `tree already gone — idempotent no-op` — TRUE about this box, FALSE
   *   about the world (`term=false-report`), and indistinguishable from a fell
   *   that succeeded, so there is no cue to re-check. `crew.fell` derives the
   *   grove from the ledger itself (`__crew_ledger_grove_of`, `crewwork.sh`),
   *   so the wrong-box hazard is closed BY CONSTRUCTION rather than by a flag
   *   each call site must remember to append.
   */
  given(
    '[case42] a fell emit names the whole verb, never the tree half',
    () => {
      const src = (): string =>
        readPollWhole()
          .split('\n')
          .filter((line) => !/^\s*#/.test(line))
          .join('\n');

      const fellEmits = (): string[] =>
        src()
          .split('\n')
          .filter((line) => line.includes('git.crew.fell --tree'));

      when('[t0] the emit sites are read', () => {
        then(
          'the fell emits are present — the teeth below are not vacuous',
          () => {
            expect(fellEmits().length).toBeGreaterThanOrEqual(2);
          },
        );

        then('NO emit points at the tree half', () => {
          // the whole defect in one line: `git.tree.del` leaves the ledger row
          // behind, and the survivor renders as a duct-less crew whose cure is
          // a boot — so the fell recommends its own undo, one tick later.
          expect(src()).not.toContain('git.tree.del --name');
        });

        then('NO emit hand-passes a grove — the verb derives it', () => {
          for (const line of fellEmits()) {
            expect(line).not.toContain('--grove');
          }
        });

        then('the --stash hatch survives the swap of verbs', () => {
          // a MERGED tree dirty with TOOL STATE alone stays fellable behind a
          // stash plus a stated reason. that escape hatch pays a `--why` toll
          // and must not be dropped when the verb changes.
          const stash = fellEmits().filter((line) =>
            line.includes("--stash --why '<yours>'"),
          );
          expect(stash.length).toBeGreaterThanOrEqual(2);
        });
      });

      when('[t1] the grove maps behind it are read', () => {
        then(
          'no grove map survives — each existed to feed the retired flag',
          () => {
            expect(src()).not.toContain('FELLABLE_GROVE');
            expect(src()).not.toContain('DIRTY_TOOL_GROVE');
            expect(src()).not.toContain('__cg=');
          },
        );

        then(
          'every emit carries a per-row VARIABLE, so no row borrows another name',
          () => {
            // ⚠️ the tooth is `$__<var>` — never the name of ONE var. this footer
            //    holds several fenced sets, each with its own loop head: `$__ct`
            //    for the fellable + tool-state rows, `$__t` for the unsponsored
            //    row, `$__pt` for the phantom row. an assertion pinned to `$__ct`
            //    failed a bind that is correct (measured here, 2026-09-20). the
            //    property under guard is that a tree is INTERPOLATED per row, so
            //    no emit can carry a literal or a neighbour's name.
            for (const line of fellEmits()) {
              expect(line).toMatch(/--tree \$__[a-z]+\b/);
            }
          },
        );
      });

      when(
        '[t2] the teeth are held against the exact line that shipped',
        () => {
          // 🔴 a detector that cannot see the defect it was written for reads as
          //    protection and guards naught. so each tooth is fired at the real
          //    offender, then proven NOT to fire on the cured form.
          const shipped =
            'rhx git.tree.del --name $__ct${__cg:+ --grove $__cg}';
          const cured = 'rhx git.crew.fell --tree $__ct';

          then('TEETH: the verb tooth fires on the offender', () => {
            expect(shipped).toContain('git.tree.del --name');
          });

          then('TEETH: the grove tooth fires on the offender', () => {
            expect(shipped).toContain('--grove');
          });

          then('COUNTER: neither tooth fires on the cured emit', () => {
            expect(cured).not.toContain('git.tree.del --name');
            expect(cured).not.toContain('--grove');
          });
        },
      );
    },
  );

  /**
   * [case48] the LIVE-CLONE fence reports what it SAW, and names its trees
   *
   * .what = a merged, clean tree held back by `__crew_clones_idle` is rendered
   *   with its own name and a falsifiable statement of the fence's evidence.
   *
   * 🔴 .measured 2026-09-18 — infrastructure.beav.feat-grove-reach-ehmpathy-demo
   *   the row read `a clone is MID-TURN — it lifts on its own once the turn
   *   ends`, over a pane whose verbatim tail carried claude's own epilogue
   *   `✻ Cogitated for 5m 21s`, an empty `❯`, `🗿 route complete 🌴🤙`, and an
   *   idle age of 712m. the turn had been over TWELVE HOURS.
   *
   *   `__duct_pane_turn_ended`'s regex matches that epilogue — confirmed
   *   against the captured pane — so the detector was never the gap. the pane
   *   read had not landed, on a grove at 358% load with a run queue of 7.
   *   minutes later, on a calmer grove, the same tree rendered fellable with
   *   no change to the tree whatever.
   *
   * ⚠️ `__crew_clones_idle` FAILS CLOSED by design. its true statement is
   *   therefore "I saw no turn-end", and `a clone is MID-TURN` converts that
   *   ABSENCE OF EVIDENCE into a positive assertion about a clone's state —
   *   then PROMISES a lift that had already happened. a supervisor who trusted
   *   it waited three ticks on a tree that was safe to fell the whole time.
   *
   * ⚠️ .and the row printed the literal `--tree <tree>`, because the fenced
   *   count was a bare subtraction that discarded every name. that is the
   *   defect this view's own header calls "the defect at its sharpest",
   *   committed four lines beneath itself.
   */
  given('[case48] a merged, clean tree the live-clone fence held back', () => {
    const bare = (): string =>
      readPollWhole()
        .split('\n')
        .filter((line) => !/^\s*#/.test(line))
        .join('\n');

    // ⚠️ the tooth is `FENCED —`, with the em dash — never a bare `FENCED`.
    //    the array itself is named LIVE_FENCED_TREES, so a bare match sweeps in
    //    its declaration, its append, and both loop heads, and the teeth below
    //    would grade shell mechanism as though it were a rendered row.
    const fencedRows = (): string[] =>
      bare()
        .split('\n')
        .filter((line) => line.includes('FENCED —'));

    when('[t0] the fenced set is derived', () => {
      then(
        'it is an ARRAY of names, never a subtraction that discards them',
        () => {
          expect(bare()).toContain('LIVE_FENCED_TREES=()');
          expect(bare()).not.toContain('live_excluded=$(( CLEAN - ');
        },
      );

      then(
        'it is filled at the FENCE itself, so count and list are one derivation',
        () => {
          const at = bare().indexOf('LIVE_FENCED_TREES+=("$tree")');
          expect(at).toBeGreaterThan(-1);
          const before = bare().slice(Math.max(0, at - 240), at);
          expect(before).toContain('"$verdict" == "merged"');
          expect(before).toContain('-n "$crew_live_clone"');
        },
      );

      // 🔴 THE TOOTH THIS CASE WAS MISSING, and it is the whole defect.
      //
      //    `__crew_clones_idle` takes CREW_BOXES as its first argument and its
      //    FIRST line is `[[ -n "$boxes" ]] || return 1`. that map is filled by
      //    `__crew_gather_boxes`, whose call site is gated on `$BOXES` — and
      //    the only line that sets BOXES is `if [[ "$ALL" != "true" ]]`.
      //
      // 🔴 so `--fellable --all` left the map EMPTY and the fence failed closed
      //    on its own first line. EVERY merged tree rendered FENCED, on a calm
      //    grove as surely as a loaded one, forever.
      //
      //    measured 2026-09-18: infrastructure.beav.feat-grove-reach-ehmpathy-
      //    demo (merged, pr #38) held for FOUR consecutive ticks. its mechanic
      //    pane reads VERDICT=yes through `__duct_pane_turn_ended` — clamped at
      //    ductwork.signal.integration.test.ts [case25][t5] — so neither the detector
      //    nor the grove load was ever the gap.
      //
      // ⚠️ and the babysit contract prescribes `--all --fellable` BY NAME, so
      //    the one call a supervisor is required to make was the one call that
      //    could never name a fellable tree.
      then('🔴 --fellable gathers the BOX MAP its own fence reads', () => {
        // anchored on the ARM, never on prose or position: the parser case
        // label is the emitter's identity, and it is what must carry BOXES.
        const arm = bare()
          .split('\n')
          .filter((line) => line.includes('--fellable)'));
        // ANTI-VACUITY — a renamed flag would empty this and read as a pass
        expect(arm.length).toEqual(1);
        expect(arm[0]).toContain('BOXES="true"');
      });

      then('⚠️ and it does NOT gather stones — no fell arm reads one', () => {
        // the counter-tooth. the cure must buy the evidence the fence reads
        // and no more, or it has answered a real defect with a sweep nobody
        // consumes — which is what the false exemption feared, correctly,
        // about the half of the claim that was true.
        const arm = bare()
          .split('\n')
          .filter((line) => line.includes('--fellable)'));
        expect(arm[0]).not.toContain('STONES="true"');
      });

      then(
        '🔴 no comment still claims the fell path reaches no box map',
        () => {
          // the claim that caused it, verbatim from the --healable block that
          // exempted this flag. left in place it contradicts the cure four lines
          // above it, and the next reader has two sources and no tiebreak.
          const whole = readPollWhole();
          expect(whole).not.toContain('--fellable stays untouched');
          expect(whole).not.toContain('it reaches no box map');
        },
      );
    });

    when('[t1] the rows it renders are read', () => {
      then(
        'BOTH emit sites render one — the teeth below are not vacuous',
        () => {
          // the `--fellable` view and the ACTIONS footer. a tooth pinned to one
          // would pass while the other kept the claim this case forbids.
          expect(
            bare()
              .split('\n')
              .filter((l) => l.includes('for __ct in "${LIVE_FENCED_TREES'))
              .length,
          ).toBe(2);
        },
      );

      then(
        '🔴 no row claims a clone is MID-TURN — the fence cannot see that',
        () => {
          expect(bare()).not.toContain('MID-TURN');
        },
      );

      then(
        '🔴 no row PROMISES a lift — the turn it waits on may be 12h over',
        () => {
          expect(bare()).not.toContain('lifts on its own once the turn ends');
          expect(bare()).not.toContain('lifts once the turn ends');
        },
      );

      then("every fenced row states the fence's EVIDENCE, falsifiably", () => {
        expect(fencedRows().length).toBeGreaterThanOrEqual(3);
        for (const line of fencedRows()) {
          expect(/no turn-end was seen|fails closed/.test(line)).toEqual(true);
        }
      });

      then('every read a fenced row recommends NAMES its tree', () => {
        const reads = fencedRows().filter((l) => l.includes('git.crew.read'));
        expect(reads.length).toBe(2);
        for (const line of reads) {
          expect(line).toContain('--tree $__ct');
          expect(line).not.toContain('--tree <tree>');
        }
      });
    });
  });

  given('[case43] crew.fell, over a crew that lives on a grove', () => {
    // .why = the refusal this replaced was CORRECT when it was written —
    //   git.tree.del held no --grove, so a fell from here asked the wrong box
    //   and answered `idempotent no-op`, exit 0. it now holds one, and the
    //   refusal became a halt over a cure the tool can perform — plus a
    //   4-step byhand recipe, which is the hand-cure rule.forbid.byhand-heal
    //   forbids outright.
    const fellFn = (): string =>
      getShellFnBody({
        text: getShellLibWhole({ path: join(__dirname, 'crewwork.sh') }),
        fn: 'crew.fell',
      })
        .split('\n')
        .filter((line) => !/^\s*#/.test(line))
        .join('\n');

    when('[t0] the delegation is read', () => {
      then('the body is found — the teeth below are not vacuous', () => {
        expect(fellFn().length).toBeGreaterThan(200);
        expect(fellFn()).toContain('del_args=(--name "$tree")');
      });

      then(
        'the grove rides into git.tree.del, so the gate runs where the tree is',
        () => {
          expect(fellFn()).toContain('del_args+=(--grove');
        },
      );

      then('the uri is converted to the bare name tree.del keys on', () => {
        // the ledger spells a grove `cloud://<name>`; tree.del keys straight
        // into `groves/<name>.json`. a bare interpolation of the ledger value
        // hands it a path that cannot exist.
        const bind = fellFn()
          .split('\n')
          .filter((line) => line.includes('del_args+=(--grove'));
        expect(bind.length).toBe(1);
        expect(bind[0]).toContain('__crew_grove_host');
        expect(bind[0]).not.toMatch(/--grove "\$grove"/);
      });

      then('COUNTER: a LOCAL crew appends no flag at all', () => {
        const bind = fellFn()
          .split('\n')
          .filter((line) => line.includes('del_args+=(--grove'));
        expect(bind[0]).toContain('[[ "$grove" != "local" ]]');
      });
    });

    when('[t1] the refusal it replaced is looked for', () => {
      then('the grove halt is gone — the cure is no longer blocked', () => {
        expect(fellFn()).not.toContain('git.tree.del is localhost-only');
        expect(fellFn()).not.toContain('refused, and the record is KEPT');
      });

      then('its byhand recipe is gone with it', () => {
        // rule.forbid.byhand-heal — a 4-step hand sequence for a defect the
        // tool can cure is unauditable, and recurs.
        expect(fellFn()).not.toContain("--what 'git tree del --this'");
        expect(fellFn()).not.toContain('git.crew.ledger --del $tree');
      });
    });

    when('[t2] the order that made the old halt necessary is read', () => {
      then(
        'the record is dropped only AFTER the tree del returns clean',
        () => {
          // the halt existed because exit 0 from the wrong box let the caller
          // drop a row over a tree that stands. --grove fixes the box; this
          // tooth holds the other half — the row still rides on the exit code.
          const body = fellFn();
          const del = body.indexOf('rhx git.tree.del "${del_args[@]}"');
          const row = body.indexOf('__crew_ledger_del "$tree"');
          expect(del).toBeGreaterThan(-1);
          expect(row).toBeGreaterThan(del);
          expect(body.slice(del, row)).toContain('the ledger row STAYS');
        },
      );
    });
  });

  given('[case46] a felled crew whose seats do NOT all sit on one box', () => {
    // 🔴 .the defect, measured 2026-09-17 — the wisher, verbatim:
    //    "fell should ensure to leave no crew member behind"
    //
    //    `rhx term.audit` on a fleet whose fells had all reported success:
    //      rhachet-roles-bhrain_beav_feat-peer-review-parallelism
    //        🖥️ reviewer.give — tab open (pid 1173246)
    //        🖥️ reviewer.take — tab open (pid 1173246)
    //      …feat-dispute-or-concede-review-budget
    //        held: mechanic foreman reflector reviewer reviewer.take reviewer.give
    //        books: no ledger row — a felled tree
    //
    //    both had printed `🦫 timber! crew felled` and, beneath it,
    //    `└─ tree, branch, ducts, tabs, and record 🌊`.
    //
    // .the root cause = a crew CAN SPAN TWO BOXES, and every crew verb
    //    derives ONE grove from ONE ledger field. per
    //    define.usecase.review-a-grove-tree-locally, a grove tree gets LOCAL
    //    reviewer.take / reviewer.give seats. `git.tree.del --grove X` pipes
    //    its whole body over ssh, so it runs entirely ON THE GROVE — the local
    //    seats are outside its reach by construction, never by oversight.
    //
    // 🔴 .and the final line is the part that made it survive. it is a
    //    CLAIM, not a report: it names four things torn down and verifies
    //    none of them. a teardown that asserts its own completeness is
    //    indistinguishable from one that achieved it (rule.forbid.failhide),
    //    which is why the residue was found by a human's eye rather than by
    //    the tool that produced it.
    //
    // .the instrument = the duct registry. $DUCTWORK_DIR/ducts/<tree>/<role>.json
    //    carries a `.host` PER SEAT — the only per-host record in the fleet,
    //    and the one source that can say a crew spans two boxes.
    const TREE = 'org.repo.beav.feat-two-box-crew';
    const GROVE_HOST = 'grove-7';

    const fellFn = (): string =>
      getShellFnBody({
        text: getShellLibWhole({ path: join(__dirname, 'crewwork.sh') }),
        fn: 'crew.fell',
      });

    // .why the comments are dropped for an ABSENCE tooth: this cure's header
    //   quotes the very line it retired, so a naive `not.toContain` would be
    //   defeated by the record of what it fixed.
    const bodyOf = (src: string): string =>
      src
        .split('\n')
        .filter((line) => !/^\s*#/.test(line))
        .join('\n');

    when('[t0] the registry holds seats on the grove AND on this box', () => {
      const result = useBeforeAll(async () =>
        runCrew({
          command: `__crew_fell_sweep_residue '${TREE}' 'cloud://${GROVE_HOST}'`,
          ledger: [{ tree: TREE, grove: `cloud://${GROVE_HOST}` }],
          ducts: [
            { tree: TREE, role: 'mechanic', host: GROVE_HOST },
            { tree: TREE, role: 'foreman', host: GROVE_HOST },
            { tree: TREE, role: 'reviewer.take', host: '' },
            { tree: TREE, role: 'reviewer.give', host: '' },
          ],
        }),
      );

      then(
        'the sweep reaches the LOCAL seats — the ones tree.del cannot see',
        () => {
          // 🔴 the whole defect in one assertion. a `duct:///` uri (three
          //    slashes) is this box; the grove teardown never emits one.
          expect(result.calls).toContain(
            `duct.stop --on duct:///${TREE}/reviewer.take`,
          );
          expect(result.calls).toContain(
            `duct.stop --on duct:///${TREE}/reviewer.give`,
          );
        },
      );

      then(
        'it reaches the GROVE seats too — the sweep is over the WHOLE crew',
        () => {
          expect(result.calls).toContain(
            `duct.stop --on duct://${GROVE_HOST}/${TREE}/mechanic`,
          );
          expect(result.calls).toContain(
            `duct.stop --on duct://${GROVE_HOST}/${TREE}/foreman`,
          );
        },
      );

      then('the tabs go with them, per host', () => {
        // a duct torn down under a live tab leaves a phantom row — the exact
        // state crew.stop's own header records. the tmux form carries '_'.
        const tmux = TREE.replace(/\./g, '_');
        const terms = result.calls.filter((c) => c.startsWith('term.stop'));
        expect(terms.some((c) => c.includes(`--on ${tmux}`))).toBe(true);
        expect(
          terms.some((c) => c.includes(`--on ${GROVE_HOST}:${tmux}`)),
        ).toBe(true);
      });

      then(
        'it VERIFIES, and reports a swept crew only once the registry is bare',
        () => {
          expect(result.stdout).toMatch(/residue|left behind|swept/i);
          expect(result.stdout).not.toMatch(/still (held|registered)/i);
          expect(result.exit).toBe(0);
        },
      );
    });

    when('[t1] COUNTER: a seat SURVIVES the sweep', () => {
      // 🔴 the tooth that makes the pair bite. a sweep that always printed
      //    `swept` would pass every assertion in [t0] while it reported a
      //    clean teardown over live residue — which IS the measured defect,
      //    merely moved one function along.
      const result = useBeforeAll(async () =>
        runCrew({
          command: `__crew_fell_sweep_residue '${TREE}' 'cloud://${GROVE_HOST}'`,
          ledger: [{ tree: TREE, grove: `cloud://${GROVE_HOST}` }],
          ducts: [{ tree: TREE, role: 'reviewer.take', host: '' }],
          rcs: { ductStop: 1 },
        }),
      );

      then('it names the seat that is still on the books', () => {
        expect(result.stdout).toContain('reviewer.take');
      });

      then('it says so LOUDLY — never a clean-teardown claim', () => {
        expect(result.stdout).toMatch(/✋|🛑/);
      });

      then(
        'it exits non-zero, so no caller can read the fell as complete',
        () => {
          expect(result.exit).not.toBe(0);
        },
      );
    });

    when('[t2] COUNTER: the registry holds no seat at all', () => {
      // an idempotent re-fell, and the common case besides: a crew whose
      // ducts were already stopped. a sweep that announced itself here would
      // put a residue line under every clean fell and teach a reader to skip it.
      const result = useBeforeAll(async () =>
        runCrew({
          command: `__crew_fell_sweep_residue '${TREE}' 'cloud://${GROVE_HOST}'`,
          ledger: [{ tree: TREE, grove: `cloud://${GROVE_HOST}` }],
        }),
      );

      then('it calls naught and exits clean', () => {
        expect(result.calls.filter((c) => c.startsWith('duct.stop'))).toEqual(
          [],
        );
        expect(result.calls.filter((c) => c.startsWith('term.stop'))).toEqual(
          [],
        );
        expect(result.exit).toBe(0);
      });
    });

    when('[t3] the enumerator is read on its own', () => {
      // the registry writes the tmux form for some trees and the dotted form
      // for others (term.open takes '_', __crew_canon_name yields '.'), so an
      // enumerator that reads one form finds half a crew — a partial audit
      // with a confident face.
      const result = useBeforeAll(async () =>
        runCrew({
          command: `__crew_residue_seats '${TREE}'`,
          ducts: [
            {
              tree: TREE.replace(/\./g, '_'),
              role: 'mechanic',
              host: GROVE_HOST,
            },
            { tree: TREE, role: 'reviewer.take', host: '' },
          ],
        }),
      );

      then('it finds the seat under EITHER form of the tree name', () => {
        expect(result.stdout).toContain('mechanic');
        expect(result.stdout).toContain('reviewer.take');
      });

      then(
        'it carries the HOST beside each role — the fact the ledger lacks',
        () => {
          expect(result.stdout).toMatch(
            new RegExp(`${GROVE_HOST}\\s+mechanic`),
          );
        },
      );
    });

    /**
     * 🔴 [t5] — the SWEEP half of [t3], and its absence was the whole defect.
     *
     * [t3] clamps that the ENUMERATOR reads both name forms. no clamp ever
     * asked the same of the SWEEP, and the sweep reads one — so the two
     * halves of one function disagreed about what a seat is, permanently.
     *
     * .the mechanism
     *   `__crew_residue_seats` enumerates `ducts/<form>/*.json` over BOTH
     *   forms, on purpose ([t3]). the sweep delegates to `crew.stop`, and
     *   every crew verb canonicalizes its `--tree` at its own boundary —
     *   crewwork.sh:2034 declares it outright: "… compared or keyed takes
     *   the canonical dots". so the sweep can only ever address a DOTTED row.
     *
     *   ⇒ a seat registered under the tmux form is FOUND by every scan and
     *     REACHABLE BY NO SWEEP. the re-scan re-finds it, and the verb exits
     *     1 with `SURVIVED the sweep` — forever, on every re-run.
     *
     * 🔴 .measured 2026-09-20, in a babysit tick. `git.crew.poll` named two
     *    phantoms and emitted the cure for each:
     *      👻 STALE ROWS — rhachet-brains-anthropic.beav.feat-frontier-claude-models
     *         drop the record: rhx git.crew.fell --tree …
     *    the emitted line was run twice, BYTE-IDENTICAL output both times:
     *      • duct.stop: session 'duct:///rhachet-brains-anthropic.beav.…/foreman'
     *        was already absent; row cleared        ← the DOTTED row
     *      ✋ 2 seat(s) SURVIVED the sweep
     *         ├─ local / foreman
     *         └─ local / mechanic                   ← the UNDERSCORE rows
     *    and on disk: `~/.ductwork/ducts/rhachet-brains-anthropic_beav_…`.
     *
     * ⚠️ .the cost is not the exit code. it is that the tool PRINTS a cure it
     *    cannot perform (`⇒ rhx git.crew.stop --tree …`, which canonicalizes
     *    too), so a supervisor who obeys the render runs a no-op and the poll
     *    re-reports the same phantom next tick. a recommendation that can
     *    never succeed is worse than an absent one — it spends a tick and
     *    teaches the operator the tool is unreliable.
     */
    when(
      '[t5] the sweep meets a seat registered under the LEGACY tmux form',
      () => {
        const result = useBeforeAll(async () =>
          runCrew({
            command: `__crew_fell_sweep_residue '${TREE}' 'local'`,
            ledger: [{ tree: TREE, grove: 'local' }],
            // the ONLY row is under the underscore form — the exact shape the
            // two measured phantoms carry on disk. a dotted row beside it would
            // let the canonical pass claim the credit and hide the miss.
            ducts: [
              { tree: TREE.replace(/\./g, '_'), role: 'mechanic', host: '' },
            ],
          }),
        );

        then('it clears the row rather than report it as a survivor', () => {
          expect(result.stdout).not.toContain('SURVIVED the sweep');
          expect(result.stdout).toContain('swept');
        });

        then(
          'it exits 0 — so the cure the poll emits can actually succeed',
          () => {
            expect(result.exit).toBe(0);
          },
        );

        then('it addressed the duct at the form the row is KEYED at', () => {
          // the discriminator. a dotted `duct.stop` is what the unfixed sweep
          // already issued, and it is what did NOT clear the row — so an
          // assertion that merely counts duct.stop calls would pass on the
          // defect. this reaches for the underscore form by name.
          const stops = result.calls.filter((c) => c.startsWith('duct.stop'));
          expect(stops.join('\n')).toContain(TREE.replace(/\./g, '_'));
        });
      },
    );

    when('[t4] crew.fell is read for the call', () => {
      then(
        'the sweep runs AFTER the tree del and BEFORE the row is dropped',
        () => {
          // 🔴 the order is the safety property, as it is for the row itself.
          //    swept first, a refused tree.del would have torn down the ducts of
          //    a crew that still stands. swept after the row is dropped, the
          //    ledger can no longer say which grove to reach.
          const body = bodyOf(fellFn());
          const del = body.indexOf('rhx git.tree.del "${del_args[@]}"');
          const sweep = body.indexOf('__crew_fell_sweep_residue');
          const row = body.indexOf('__crew_ledger_del "$tree"');
          expect(del).toBeGreaterThan(-1);
          expect(sweep).toBeGreaterThan(del);
          expect(row).toBeGreaterThan(sweep);
        },
      );

      then('the unverified completeness CLAIM is gone', () => {
        // `└─ tree, branch, ducts, tabs, and record 🌊` named four teardowns
        // and checked none. what replaces it reports what was verified.
        expect(bodyOf(fellFn())).not.toContain(
          'tree, branch, ducts, tabs, and record',
        );
      });
    });
  });
});
