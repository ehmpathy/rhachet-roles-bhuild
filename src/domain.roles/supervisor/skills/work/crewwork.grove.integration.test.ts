/**
 * .what = clamps on a poll across groves — the unreached, the blind spot, the feat claim
 *
 * .note = a PART of the `crewwork` suite, cut so one reviewer can hold
 *         it whole. the suite's shared fixtures, and its account of what it
 *         runs against and why, live in crewwork.harness.ts.
 */
import { readFileSync } from 'fs';
import { join } from 'path';
import { given, then, useBeforeAll, when } from 'test-fns';

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
   * .what = the UNREACHED caveat that must ride every actionable-set verdict
   *
   * .why  = `rhx git.crew.poll --fellable` closes with a flat
   *
   *           🦫 no tree to fell — 39 polled, none merged
   *
   *         and on that view it is the LAST line a reader sees — on the empty
   *         arm, very nearly the ONLY line. it reads as a claim about the
   *         WORLD. it is a claim about the groves that ANSWERED.
   *
   *         measured 2026-09-14 with SIX groves unreached, and again
   *         2026-09-15 with four — so it is PERMANENT while any grove sleeps,
   *         never intermittent. a merged tree on an unreached grove is
   *         invisible to that verdict and the line carries no trace of the
   *         failed read: term=partial-audit with a confident face.
   *
   *   ⚠️  the header at git.crew.poll.sh:1251 DOES name the unreached groves —
   *       and it is ABOVE the report. a reader who scrolls to the answer meets
   *       the verdict without it. so the count must ride the VERDICT itself
   *       (rule.forbid.clipped-sweeps: a hidden count is declared, never
   *       silent), and the guide must carry the runnable wake command
   *       (rule.require.poll-recommends-every-cure-heal-has).
   *
   * .how  = the caveat takes the count as an ARGUMENT rather than a read of
   *         the caller's `HOSTS_UNREACHED`, so it is clampable here without a
   *         live fleet and cannot drift with a caller's globals.
   */
  given('[case20] a sweep that could not reach every grove', () => {
    when('[t0] the caveat is asked for a NON-ZERO unreached count', () => {
      const result = useBeforeAll(async () =>
        runCrew({
          command: [
            'printf "DECLARED[%s]\\n" "$(declare -F __crew_unreached_caveat >/dev/null 2>&1 && printf yes || printf no)"',
            'printf "CAVEAT[%s]\\n" "$(__crew_unreached_caveat 4)"',
          ].join('\n'),
        }),
      );

      then('the subject exists — the clamp is not vacuous', () => {
        expect(result.stdout).toContain('DECLARED[yes]');
      });

      then('it names the count, so the omission is declared not silent', () => {
        expect(result.stdout).toContain('4 grove(s) UNREACHED');
      });

      then('it is marked as a caveat, never as ordinary tally prose', () => {
        expect(result.stdout).toContain('⚠️');
      });
    });

    /**
     * ⚠️ TOOTH. a caveat that prints on a COMPLETE sweep is noise on every
     *    healthy tick, and noise is what trains a reader to skip the line —
     *    the same decay #92 records. the caveat must be silent at zero.
     */
    when('[t1] the caveat is asked for a ZERO unreached count', () => {
      const result = useBeforeAll(async () =>
        runCrew({
          command: 'printf "CAVEAT[%s]\\n" "$(__crew_unreached_caveat 0)"',
        }),
      );

      then('it says naught — a complete sweep carries no caveat', () => {
        expect(result.stdout).toContain('CAVEAT[]');
        expect(result.stdout).not.toContain('UNREACHED');
      });
    });

    when('[t2] the guide is asked for a non-zero count and a grove', () => {
      const result = useBeforeAll(async () =>
        runCrew({
          command: '__crew_unreached_guide 4 grove-sandpine-v20260811',
        }),
      );

      then('it emits the RUNNABLE cure, never only the diagnosis', () => {
        expect(result.stdout).toContain(
          'rhx git.grove.wake grove-sandpine-v20260811',
        );
      });

      then('it states what the verdict could not see', () => {
        expect(result.stdout).toContain('INVISIBLE to this verdict');
      });
    });

    /**
     * ⚠️ TOOTH, the pair of [t1] — the guide line must vanish too, or a
     *    complete sweep grows a permanent wake recommendation for a grove
     *    that was read fine.
     */
    when('[t3] the guide is asked for a ZERO unreached count', () => {
      const result = useBeforeAll(async () =>
        runCrew({ command: '__crew_unreached_guide 0 grove-whatever' }),
      );

      then('it says naught', () => {
        expect(result.stdout).not.toContain('git.grove.wake');
        expect(result.stdout).not.toContain('INVISIBLE');
      });
    });

    /**
     * .why  a SOURCE clamp beside the behavioral ones: the two operations can
     *       be perfect and still unreached. what this defect actually is, is a
     *       verdict line that FORGOT to call them — so the clamp that catches
     *       a fifth verdict line added tomorrow has to read the call sites.
     *
     *   ⚠️  bounded by a LOWER bound plus an every(), never an exact count.
     *       an exact count would go red on a legitimately-added verdict and
     *       become the maintenance burden #92 records for case15; the lower
     *       bound guards vacuity, and the filter carries the teeth.
     */
    when('[t4] the actionable-set verdict lines are read from source', () => {
      const verdicts = readPollWhole()
        .split('\n')
        .filter((line) => /echo "🦫 /.test(line))
        .filter((line) => /to fell|to heal/.test(line));

      then(
        'there are verdict lines to grade — the clamp is not vacuous',
        () => {
          expect(verdicts.length).toBeGreaterThanOrEqual(4);
        },
      );

      then('EVERY one carries the unreached caveat', () => {
        expect(
          verdicts.filter((line) => !line.includes('__crew_unreached_caveat')),
        ).toEqual([]);
      });

      /**
       * 🔴 [t5] — the FOOTER kept the fused count the HEADER had just parted
       *
       *    measured 2026-09-16, one tick after the header cure landed. the
       *    same report carried:
       *
       *      ⚠️  UNREACHED: …v20260811.ground …v20260811     ← header, parted
       *      ⚠️  RETIRED:   …v20260810 …v20260810.ground     ← header, parted
       *      🦫 no tree to fell — … · ⚠️  4 grove(s) UNREACHED   ← footer, fused
       *
       *    two counts of ONE set, in ONE render, and the reader cannot tell
       *    which is the defect. `rule.require.enumerate-before-you-name`, the
       *    TENTH instance — and the third in a row where the cure for the
       *    prior instance created the next by curing only one member.
       *
       *    ⚠️ the sharper half is the GUIDE. it hands over
       *    `rhx git.grove.wake $grove`, and its grove name was the FIRST
       *    unreached host — which on a fused set can be a retired one. the
       *    tool would then prescribe a command that exits 2 by construction.
       */
      then(
        'the footer counts come from the PARTED set, never the fused one',
        () => {
          const src = readPollWhole();
          expect(src.includes('UNREACHED_N=${#__unreached_asleep[@]}')).toEqual(
            true,
          );
          expect(src.includes('RETIRED_N=${#__unreached_gone[@]}')).toEqual(
            true,
          );
          // the fused reads are gone from BOTH the count and the grove name
          expect(src.includes('UNREACHED_N=${#HOSTS_UNREACHED[@]}')).toEqual(
            false,
          );
          expect(src.includes('UNREACHED_GROVE=${HOSTS_UNREACHED[0]')).toEqual(
            false,
          );
        },
      );

      then(
        'the wake guide names a WAKEABLE grove, never any unreached one',
        () => {
          // a wake on a retired grove exits 2, so the name must be drawn from
          // the population the wake can actually serve
          expect(
            readPollWhole().includes(
              'UNREACHED_GROVE=${__unreached_asleep[0]:-<grove>}',
            ),
          ).toEqual(true);
        },
      );

      then(
        'the partition is computed ONCE, above every surface that reads it',
        () => {
          // it lived inside the header's `if` for one tick, which is exactly how
          // the footer kept a stale count: a property of the SET, computed in one
          // render's branch
          const src = readPollWhole();
          const partition = src.indexOf('for __u in "${HOSTS_UNREACHED[@]}"');
          const header = src.indexOf(
            'if (( ${#HOSTS_UNREACHED[@]} > 0 )); then',
          );
          const footer = src.indexOf('UNREACHED_N=${#__unreached_asleep[@]}');
          expect(partition).toBeGreaterThan(0);
          expect(header).toBeGreaterThan(0);
          expect(footer).toBeGreaterThan(0);
          expect(partition).toBeLessThan(header);
          expect(partition).toBeLessThan(footer);
        },
      );
    });

    /**
     * [t6] — the two operations must each carry BOTH populations
     *
     * ⚠️ the retired arg is OPTIONAL by design, so a one-arg call still reads
     *    exactly as it did. that keeps every extant caller honest and is why
     *    [t0]–[t3] above are untouched.
     */
    when(
      '[t6] the operations are asked for a mixed set — some asleep, some retired',
      () => {
        const result = useBeforeAll(async () =>
          runCrew({
            command: [
              'printf "CAVEAT[%s]\\n" "$(__crew_unreached_caveat 2 2)"',
              '__crew_unreached_guide 2 grove-sandpine-v20260811 2',
            ].join('\n'),
          }),
        );

        then('the caveat names BOTH counts, apart', () => {
          expect(result.stdout).toContain('2 grove(s) UNREACHED');
          expect(result.stdout).toContain('2 grove(s) RETIRED');
        });

        then('the guide gives the wake ONLY for the wakeable half', () => {
          expect(result.stdout).toContain(
            'rhx git.grove.wake grove-sandpine-v20260811',
          );
          // 🔴 the whole point: the retired line must NOT prescribe a wake. a
          //    cure that exits 2 teaches the reader to distrust the guide
          const retiredLine = result.stdout
            .split('\n')
            .filter((line) => line.includes('RETIRED grove'))
            .join('\n');
          expect(retiredLine).not.toEqual('');
          expect(retiredLine.includes('git.grove.wake')).toEqual(false);
          expect(retiredLine.includes('no wake reaches it')).toEqual(true);
        });
      },
    );

    /**
     * ⚠️ TOOTH for [t6] — a set with NO retired member must render exactly as
     *    it always did. a caveat that grows a `0 grove(s) RETIRED` clause is
     *    the noise [t1] exists to forbid, one column over.
     */
    when('[t7] the operations are asked for an all-asleep set', () => {
      const result = useBeforeAll(async () =>
        runCrew({
          command: [
            'printf "CAVEAT[%s]\\n" "$(__crew_unreached_caveat 2 0)"',
            '__crew_unreached_guide 2 grove-sandpine-v20260811 0',
          ].join('\n'),
        }),
      );

      then('it says naught about retirement', () => {
        expect(result.stdout).toContain('2 grove(s) UNREACHED');
        expect(result.stdout).not.toContain('RETIRED');
        expect(result.stdout).not.toContain('🪦');
      });
    });

    /**
     * ⚠️ the mirror tooth — an ALL-retired set must not prescribe a wake at
     *    all. this is the live shape the moment the august lab groves are
     *    recreated and their predecessors fall out of the forest.
     */
    when('[t8] the operations are asked for an all-retired set', () => {
      const result = useBeforeAll(async () =>
        runCrew({
          command: [
            'printf "CAVEAT[%s]\\n" "$(__crew_unreached_caveat 0 3)"',
            '__crew_unreached_guide 0 grove-whatever 3',
          ].join('\n'),
        }),
      );

      then('it names the retired count and nought else', () => {
        expect(result.stdout).toContain('3 grove(s) RETIRED');
        expect(result.stdout).not.toContain('UNREACHED');
      });

      then('it prescribes NO wake — no grove remains to wake', () => {
        expect(result.stdout).not.toContain('git.grove.wake');
        expect(result.stdout).toContain('rhx git.grove.list');
      });
    });
  });

  /**
   * .what = the feat/fix toll — a `feat` branch must carry a --feat-why
   *
   * .why  = measured 2026-09-16. `beav/feat-acceptance-under-5min` sprouted as
   *         a FEAT and not one instrument said a word. an acceptance-suite
   *         speedup adds no capability a human can ask for — it is a `fix`, and
   *         the tool took `feat` on the caller's say-so.
   *
   * 🔴 .the gate is ONE-SIDED on purpose, and that asymmetry is what these
   *    clamps grade. a `fix` passes silently; a `feat` is a CLAIM, and a claim
   *    owes its reason — because the two mislabels do not cost the same. a fix
   *    called feat cuts a MINOR release for a speedup and writes a feature into
   *    the changelog that nobody can use; a feat called fix under-sells one
   *    line. so `fix` must stay frictionless or the gate gets routed around.
   */
  given('[case30] a branch that claims to be a feat', () => {
    when('[t0] the name says feat and no --feat-why rides along', () => {
      const gated = useBeforeAll(async () =>
        runCrew({
          command: `__crew_guard_feat_level 'beav/feat-acceptance-under-5min' ''`,
        }),
      );

      then(
        '🔴 it refuses with exit 2 — a ConstraintError, the CALLER must fix it',
        () => {
          // exit 2 = constraint, never 1 (rule.require.exit-code-semantics). a 1
          // would read as "the tool broke" and invite a retry of the same command.
          expect(gated.exit).toEqual(2);
        },
      );

      then('it names BOTH ways out, never merely the refusal', () => {
        // rule.require.errors-name-the-fix. the rename carries the SLUG, so the
        // corrected command is copy-pasteable rather than a shape to fill in.
        expect(gated.stderr).toContain('--name beav/fix-acceptance-under-5min');
        expect(gated.stderr).toContain('--feat-why');
      });

      then('it carries the discriminator, so the caller can self-check', () => {
        expect(gated.stderr).toContain('a capability a human can ASK FOR');
        expect(gated.stderr).toContain('a speedup is a fix');
      });
    });

    when('[t1] the name says feat AND a --feat-why rides along', () => {
      const excused = useBeforeAll(async () =>
        runCrew({
          command: `__crew_guard_feat_level 'beav/feat-acceptance-under-5min' 'adds a --budget flag the suite never had'`,
        }),
      );

      then('it passes — the toll is a REASON, never a ban on feats', () => {
        expect(excused.exit).toEqual(0);
        expect(excused.stderr).toEqual('');
      });
    });

    when('[t2] the name says fix', () => {
      const plain = useBeforeAll(async () =>
        runCrew({ command: `__crew_guard_feat_level 'beav/fix-cache-bug' ''` }),
      );

      then(
        '🔴 it passes SILENTLY — fix is the default and pays no toll',
        () => {
          // the one-sidedness. a gate that also taxed `fix` would push every
          // caller toward whichever label was cheaper to type, which is the
          // opposite of what this exists to do.
          expect(plain.exit).toEqual(0);
          expect(plain.stderr).toEqual('');
        },
      );
    });

    when('[t3] the name follows neither convention', () => {
      const human = useBeforeAll(async () =>
        runCrew({
          command: `__crew_guard_feat_level 'bert/case-refund-appeal' ''`,
        }),
      );

      then(
        'it passes — this governs the fix/feat vocabulary, not every branch',
        () => {
          expect(human.exit).toEqual(0);
        },
      );
    });

    when('[t4] the level is read out of a name', () => {
      const cases: { name: string; level: string }[] = [
        { name: 'beav/feat-x', level: 'feat' },
        { name: 'beav/fix-x', level: 'fix' },
        { name: 'bert/case-x', level: '' },
        // ⚠️ a slug that merely STARTS with the letters is not a level. the
        //    split is on the first `-`, so `feature-flag` is neither.
        { name: 'beav/feature-flag', level: '' },
        { name: 'beav/fixture-load', level: '' },
      ];

      for (const each of cases) {
        then(`'${each.name}' reads as '${each.level}'`, () => {
          const read = runCrew({
            command: `printf '[%s]' "$(__crew_branch_level '${each.name}')"`,
          });
          expect(read.stdout).toContain(`[${each.level}]`);
        });
      }
    });

    when('[t5] the sprout verbs are read from source', () => {
      /**
       * .why a SOURCE clamp beside the behavioral ones: the gate above is
       *      proven to refuse, and a gate nobody CALLS refuses naught. these
       *      three verbs are every path by which a branch is born in this repo,
       *      so each owes the call — and a new sprout verb added without one
       *      is exactly the gap this line exists to catch.
       */
      const readVerb = (file: string): string =>
        readFileSync(join(__dirname, '..', file), 'utf8')
          // 🔴 COMMENTS STRIPPED, same precedent as [t1] above: the `.why`
          //    blocks now NAME the guard, so a bare indexOf would grade the
          //    prose that documents the call as though it were the call.
          .split('\n')
          .filter((line) => !/^\s*#/.test(line))
          .join('\n');

      for (const verb of [
        'git.tree.behavior.sh',
        'git.tree.duct.sh',
        'git.tree.achievement.sh',
      ]) {
        then(`${verb} calls the guard`, () => {
          expect(readVerb(verb)).toContain('__crew_guard_feat_level');
        });

        then(`${verb} takes a --feat-why`, () => {
          expect(readVerb(verb)).toContain('--feat-why');
        });
      }
    });
  });

  /**
   * [case33] the ON-GROVE guide hands over a runnable read, and NAMES a tree
   *
   * .what = the line that discloses the 24-tree blind spot emits a real
   *   command with a real tree in it, the way every peer guide on this view
   *   already does.
   *
   * .why = it emitted prose — "read its pane, or ask its foreman" — over a
   *   subject set it never named. the unreached guide beside it hands over
   *   `rhx git.grove.wake <grove>` with a live grove interpolated, so the two
   *   sat one line apart at opposite standards.
   *
   * 🔴 .measured 2026-09-17
   *   `…feat-dispute-or-concede-review-budget` shipped to prod — PR #511
   *   merged, v0.36.0 published — while this view read `no tree to fell — 16
   *   of 40 read, none merged`. the caveat named the omission CORRECTLY and
   *   handed over no way to close it, so the fell candidate surfaced from a
   *   hand-composed read rather than from the tool. a disclosure a reader
   *   cannot act on is a disclosure that changes no behavior
   *   (`rule.require.poll-recommends-every-cure-heal-has`).
   */
  given('[case41] the on-grove blind-spot guide', () => {
    const src = (): string =>
      readPollWhole()
        .split('\n')
        .filter((line) => !/^\s*#/.test(line))
        .join('\n');

    /**
     * 🔴 .the ANCHOR moved on 2026-09-17, and every tooth below is unchanged
     *
     *   the guide used to read *"release state is NOT read from here — no
     *   instrument yet, and a tree that SHIPPED looks identical to one that did
     *   not."* both clauses were true when written and false once
     *   `__poll_tree_facts_on_grove` landed: the instrument exists, and the
     *   `🌐 on grove` verdict is now a FAILURE path rather than the whole grove
     *   path — an asleep grove, a dropped tunnel, a worktree the glob missed.
     *
     *   ⇒ a stale disclaimer is the precise mechanism this case exists to
     *     punish. it disclosed a bound honestly, so it read as settled, and it
     *     was quoted back as a verdict for four consecutive ticks. to leave the
     *     old text in place to keep a clamp green would be to clamp the defect.
     *
     * ⚠️ the HAZARD tooth is re-aimed, never dropped. the old hazard was "a
     *    shipped tree looks identical to one that did not"; the honest hazard
     *    now is that the state is UNREAD rather than absent — the same
     *    term=false-report trap, one cause over.
     */
    /**
     * 🔴 .the anchor moved a SECOND time, 2026-09-18 — and that is the lesson
     *
     *   the prose anchor above (`on a grove that did NOT answer`) was itself
     *   FALSE, and was struck: `git.crew.poll.sh` declares 35 lines above its own
     *   emitter that "an ON-GROVE tree sits on a grove that answered fine". the
     *   caveat had borrowed the UNREACHED cause list, so it named the wrong
     *   omission entirely.
     *
     * ⚠️ .what the second move proves — a PROSE anchor cannot survive a cure of
     *   the prose. every re-word of a verdict empties the filter, and then EVERY
     *   tooth below iterates an empty array and passes. measured here: when the
     *   cure landed, 4 of the 5 teeth in [t0] went green over `[]`, and only the
     *   anti-vacuity count went red. that one tooth is the sole reason this was
     *   caught rather than shipped as 8 green assertions over an empty set.
     *
     *   ⇒ so the anchor is now the emitter's IDENTITY — its variable and unit —
     *     which cannot drift while the verdict exists. `[case50]` in
     *     work.surface keys on the same string, so the two clamps agree by
     *     construction rather than by a reviewer who notices.
     */
    /**
     * 🔴 .the anchor held on the THIRD move, 2026-09-18 — and the TEETH did not
     *
     *   the identity anchor (`ONGROVE_N tree(s)`) survived a full re-word of
     *   the verdict, exactly as designed: the anti-vacuity count stayed at 2
     *   while every prose clause beneath it changed. that is the fix of the
     *   second move, working.
     *
     * ⚠️ .but four teeth went red, and NONE of them was a regression. each had
     *   pinned a clause of the defect as though it were the contract:
     *
     *     `rhx git.crew.read --tree`     a PANE read, over a RELEASE state —
     *                                    a fix that could not fix
     *     `${ONGROVE_TREES[0]`           one name out of an array that holds
     *                                    every one — the discarded-name defect
     *     `unread, never absent`         a false REASON: that the poll declines
     *                                    grove trees by design. retired by
     *                                    __poll_tree_facts_on_grove 2026-09-17
     *
     *   ⇒ **an anchor that cannot drift does not make the TEETH true.** it only
     *     guarantees they are evaluated. a tooth that quotes the defect still
     *     clamps the defect, and it goes green while it does — which is louder
     *     than the vacuity trap, because the count is honest.
     *
     *   ⇒ so all four are retargeted in place, each with the claim it should
     *     have made. the record of what they used to demand rides beside them.
     */
    const guides = (): string[] =>
      src()
        .split('\n')
        .filter((line) => line.includes('ONGROVE_N tree(s)'));

    when('[t0] the guide is read', () => {
      then(
        'BOTH fell verdicts carry it — the teeth below are not vacuous',
        () => {
          // ⚠️ ANTI-VACUITY. the empty-set and populated-set branches each emit
          //    it; a reword that empties this filter reads as a clean pass.
          expect(guides().length).toBe(2);
        },
      );

      then('every copy hands over a RUNNABLE command, never prose', () => {
        // 🔴 RETARGETED 2026-09-18 — the THIRD anchor move, and the one the
        //    comment above predicted. this tooth demanded `rhx git.crew.read
        //    --tree`, and that command CANNOT settle what the line is about:
        //    it reads a PANE, and a pane holds no release state. so the tooth
        //    clamped a fix that could not fix, for as long as it was green.
        //    ⇒ the durable claim is "runnable", never the specific verb.
        for (const line of guides()) {
          expect(line).toMatch(/rhx git\.crew\.poll --all --fellable/);
        }
      });

      then('🔴 EVERY unread tree is named, never just the first', () => {
        // 🔴 RETARGETED 2026-09-18. this tooth demanded `${ONGROVE_TREES[0]`,
        //    which PINNED the discarded-name defect: the array holds every
        //    tree and only [0] was rendered, so a reader met one name and a
        //    count. that is the same shape this file grades "the defect at
        //    its sharpest" for the fell list two views over — clamped here
        //    as though it were the contract.
        expect(src()).not.toContain('${ONGROVE_TREES[0]');
        const loops = src()
          .split('\n')
          .filter((line) =>
            line.includes('for __og in "${ONGROVE_TREES[@]:-}"'),
          );
        expect(loops.length).toBe(2);
      });

      then('it names the hazard, so silence is not read as absence', () => {
        // 🔴 RETARGETED 2026-09-18. the hazard is unchanged; the STRING that
        //    named it was false. "unread, never absent" gave a REASON — that
        //    the poll declines grove trees by design — and that reason died
        //    with `__poll_tree_facts_on_grove` on 2026-09-17. the honest
        //    hazard is that the verdict beside it covers none of these trees.
        for (const line of guides()) {
          expect(line).toContain('says NAUGHT about them');
        }
      });

      then('it no longer claims the instrument is ABSENT', () => {
        // 🔴 the tooth this case was short of. the guide's own staleness is
        //    what let the defect survive, and no assertion caught it — the
        //    anchor strings were the stale text, so the clamp went green on it.
        expect(src()).not.toContain('no instrument yet');
      });

      /**
       * 🔴 .the FOURTH false reason, measured 2026-09-19
       *
       *   the line asserted a CAUSE — "most often a grove too loaded to answer
       *   in time" — and built a prescription on it: "a re-run often settles
       *   it". three consecutive runs in one session, against a grove that
       *   RECOVERED between them:
       *
       *     run | grove runq        | UNREAD
       *     ----+-------------------+-------
       *      1  | 22 of 4 (stalled) |   7
       *      2  |  0    (idle 70%)  |  10
       *      3  |  0    (idle 70%)  |  12
       *
       *   ⇒ load fell to zero and the count nearly DOUBLED. the stated cause
       *     predicts the inverse, and the membership churned entirely between
       *     runs — a tree unread in run 2 read clean in run 3 and vice versa.
       *
       * ⚠️ .the prescription is the sharper half. "a re-run often settles it"
       *   is a LOOP: each call costs one ssh per tree, and three of them did
       *   not converge — the count rose on every one. a forecast merely
       *   misleads; a prescription built on a forecast spends the fleet's
       *   ssh budget on a remedy that was never measured to work.
       *
       * 🟡 .and this file has retired two such reasons already — "no
       *   instrument yet" and "unread, never absent" (see the table above).
       *   ⇒ THREE unmeasured causal claims in ONE render is a pattern rather
       *     than a slip, which is why the teeth below ban the ACT (a cause
       *     asserted without measurement) rather than either particular phrase.
       *
       * 🔴 .what is NOT claimed here. the true cause is unmeasured, and this
       *   cure does not name one. a candidate exists and is worth a capture —
       *   the read is one ssh per tree fanned out against a grove that already
       *   holds 129 sshd sessions, and sshd MaxStartups drops beyond its
       *   threshold at random, which would fit every observation above. but
       *   to ship that as the cause would commit the very defect under cure.
       */
      then('🔴 it asserts no CAUSE it has not measured', () => {
        for (const line of guides()) {
          expect(line).not.toMatch(/too loaded to answer in time/);
        }
      });

      then(
        '🔴 it DECLARES the cause unmeasured — the positive form of the ban',
        () => {
          /**
           * 🟡 .this tooth was drafted as a phrase ban and was WRONG
           *
           *   it read `not.toMatch(/most often a|the cause is|because the
           *   grove/i)`, and the honest cure — "the cause is UNMEASURED" — trips
           *   `the cause is`. so the clamp would have rejected the very sentence
           *   it exists to demand, and the author's next move is to reword the
           *   disclaimer until the regex passes. that is worse than no tooth:
           *   it shapes prose to satisfy a bad check.
           *
           * ⇒ a regex cannot detect "asserts a cause" in general, so do not try.
           *   require the DISCLAIMER instead. a line cannot coherently name a
           *   cause and call it unmeasured in the same breath, and an author who
           *   wants to add one must first delete this word — a deliberate act,
           *   which is exactly what a clamp should force.
           *
           * 🔴 caught in the same round that cured two phrase-anchor traps in
           *   the saturation clamp. third instance, one session.
           */
          for (const line of guides()) {
            expect(line).toMatch(/UNMEASURED/);
          }
        },
      );

      then('🔴 a re-run is not sold as a SETTLEMENT', () => {
        // it is a resample of an unstable read, and three did not converge.
        for (const line of guides()) {
          expect(line).not.toMatch(/often settles it/);
        }
      });

      then(
        'COUNTER: the runnable re-read and the hazard clause both survive',
        () => {
          // the cure removes a CLAIM, never an instrument. the command stays
          // (a resample is still the reader's cheapest next move) and so does
          // the hazard the guide exists to name.
          for (const line of guides()) {
            expect(line).toMatch(/rhx git\.crew\.poll --all --fellable/);
            expect(line).toContain('says NAUGHT about them');
          }
        },
      );
    });

    when('[t1] the array behind it is read', () => {
      then('it is appended on the on-grove verdict', () => {
        expect(src()).toContain('ONGROVE_TREES+=("$tree")');
      });

      then(
        'COUNTER: the count stays TALLY-derived, never re-tallied here',
        () => {
          // two counts of one set in one report is the defect the unreached
          // caveat already records. the array NAMES; it must not re-count.
          expect(src()).toContain('ONGROVE_N=${TALLY["on grove"]:-0}');
          for (const line of guides()) {
            expect(line).not.toContain('${#ONGROVE_TREES[@]}');
          }
        },
      );

      then('COUNTER: it falls back rather than break under set -u', () => {
        // 🔴 RETARGETED 2026-09-18 — same guarantee, new shape. the render no
        //    longer indexes [0]; it iterates. so the set -u guard moved from
        //    `${ONGROVE_TREES[0]:-}` to `${ONGROVE_TREES[@]:-}` plus a
        //    per-row emptiness skip, and BOTH must ride or an empty array
        //    breaks the loop head under `set -u`.
        const loops = src()
          .split('\n')
          .filter((line) =>
            line.includes('for __og in "${ONGROVE_TREES[@]:-}"'),
          );
        expect(loops.length).toBe(2);
        const skips = src()
          .split('\n')
          .filter((line) => line.includes('[[ -n "$__og" ]] || continue'));
        expect(skips.length).toBe(2);
      });
    });
  });

  /**
   * [case50] the ON-GROVE caveat names a FAILED read, never a declined scope
   *
   * 🔴 the comment above this render claimed a repair that never reached the
   *   STRING. it read "this caveat NARROWED on 2026-09-17 … these trees are not
   *   'unread by design'; they are trees whose read did not answer" — and the
   *   line beneath it still emitted "the grove answered fine; this poll reads
   *   TREES locally, so their release state is unread, never absent".
   *
   *   only the render reaches a reader, so the correct claim lived where nobody
   *   reads and the retired one shipped.
   *
   * 🔴 .measured 2026-09-18 — TWO runs of `git.crew.poll --all --fellable`,
   *   minutes apart, same fleet, grove at runq 13:
   *
   *     run 1 → 9 ON GROVE · "none merged" · the merged tree ABSENT entirely
   *     run 2 → 6 ON GROVE · that same tree rendered `👌 merged — pr #38`
   *
   *   `--fellable` is the ONE surface a babysit tick is told to derive the fell
   *   set from. it omitted a fellable tree and headlined a verdict over it.
   *
   * ⚠️ the fix it handed over could not settle its own subject: a `crew.read`
   *   reads a PANE, and a pane holds no release state.
   */
  given('[case50] the ON-GROVE caveat, over a read that did not answer', () => {
    // ⚠️ comment-stripped, for the reason case48 records: the .why blocks above
    //    these renders quote the retired string verbatim as the defect they
    //    repair, so a bare indexOf grades the record as though it were the code.
    const bare = (): string =>
      readPollWhole()
        .split('\n')
        .filter((line) => !/^\s*#/.test(line))
        .join('\n');

    // 🔴 anchored on the emitter's IDENTITY — its variable and unit — never on
    //    its prose. case41 records why, and I proved it the hard way an hour
    //    later: this filter first read `release read did NOT ANSWER`, I then
    //    re-worded that very clause to honor work.surface's [case50] ban, and
    //    my own anti-vacuity arm went red over an empty array.
    //
    //    ⇒ every prose anchor dies on the next cure of the prose. the variable
    //      cannot drift while the verdict exists.
    const ongroveRows = (): string[] =>
      bare()
        .split('\n')
        .filter((line) => line.includes('ONGROVE_N tree(s)'));

    when('[t0] the caveat is rendered', () => {
      then(
        'it exists at BOTH emit sites — the teeth below are not vacuous',
        () => {
          expect(ongroveRows().length).toBe(2);
        },
      );

      then('🔴 it no longer asserts the grove answered fine', () => {
        expect(bare()).not.toContain('the grove answered fine');
      });

      then('🔴 it no longer claims the poll reads trees LOCALLY', () => {
        // retired 2026-09-17 by __poll_tree_facts_on_grove
        expect(bare()).not.toContain('this poll reads TREES locally');
      });

      then('🔴 it no longer calls the release state unread-by-design', () => {
        expect(bare()).not.toContain('release state is unread, never absent');
      });

      then('it names the bucket as a FAILED read', () => {
        for (const line of ongroveRows()) {
          expect(line).toMatch(/FAILED read/);
          expect(line).toContain('UNREAD');
        }
      });

      then('🔴 COUNTER: it does NOT report the grove itself as down', () => {
        // work.surface [case50] measured the opposite error and banned it: all
        // six trees sat on a grove that answered the crew half of the same
        // poll. a supervisor who reads "the grove is down" halts sprouts on a
        // healthy box. the read failed; the box did not.
        //
        // 🔴 RETARGETED 2026-09-20 — a FOURTH prose anchor died on a cure of the
        //    prose, the trap this very case records twice above. the tooth read
        //    `expect(line).toContain('the GROVE is up')` against the SOURCE
        //    line, and [case58] moved that clause into a helper so it could be
        //    withheld when the grove is genuinely unreached. the CLAIM is
        //    unchanged and still owed; only its address moved.
        //
        //    ⇒ so the guarantee is asserted end to end: the line derives the
        //      clause, and the helper's reachable arm still makes it. a cure
        //      that deletes the claim outright now goes red in the helper,
        //      never green over a line that stopped to carry it.
        for (const line of ongroveRows()) {
          expect(line).not.toContain('asleep');
          expect(line).not.toContain('tunnel dropped');
          expect(line).toContain('__crew_ongrove_reach_clause');
        }
        const work = getShellLibWhole({ path: join(__dirname, 'crewwork.sh') });
        const at = work.indexOf('__crew_ongrove_reach_clause() {');
        expect(at).toBeGreaterThan(-1); // ANTI-VACUITY: the helper exists
        const body = work.slice(at, at + 900);
        expect(body).toContain('the GROVE is up');
        // ⚠️ the two BANS follow the clause to its new home. a helper is a new
        //    place for the old error to reappear, and no tooth watched it.
        expect(body).not.toContain('asleep');
        expect(body).not.toContain('tunnel dropped');
      });

      then('it disclaims the verdict it rides beside', () => {
        for (const line of ongroveRows()) {
          expect(line).toContain('says NAUGHT about them');
        }
      });

      then('🔴 its handed-over fix is a RE-RUN, never a pane read', () => {
        for (const line of ongroveRows()) {
          expect(line).toContain('rhx git.crew.poll --all --fellable');
          expect(line).not.toContain('--who mechanic');
        }
      });

      then('🔴 it names EVERY unread tree, never just the first', () => {
        // ONGROVE_TREES held every one and only [0] was rendered — the same
        // discarded-name defect case48 cured for the fenced list.
        expect(bare()).not.toContain('${ONGROVE_TREES[0]:-<tree>}');
        const loops = bare()
          .split('\n')
          .filter((line) =>
            line.includes('for __og in "${ONGROVE_TREES[@]:-}"'),
          );
        expect(loops.length).toBe(2);
        const named = bare()
          .split('\n')
          .filter((line) => line.includes('🌐 UNREAD — $__og'));
        expect(named.length).toBe(2);
      });

      then(
        'COUNTER: the grove arm really does ssh — the claim it replaced is retired',
        () => {
          const poll = readPollWhole();
          const at = poll.indexOf('__poll_one_tree() {');
          expect(at).toBeGreaterThan(-1);
          expect(poll.slice(at, at + 2600)).toContain(
            '__poll_tree_facts_on_grove',
          );
        },
      );

      then('COUNTER: the bucket is still SILENT at zero', () => {
        const work = getShellLibWhole({ path: join(__dirname, 'crewwork.sh') });
        const at = work.indexOf('__crew_ongrove_caveat() {');
        expect(at).toBeGreaterThan(-1);
        expect(work.slice(at, at + 400)).toContain(
          '(( count > 0 )) || return 0',
        );
      });
    });
  });

  /**
   * .what = the REACH clause inside the on-grove blind-spot guide — the half of
   *         that line which speaks about the BOX rather than about the trees.
   *
   * 🔴 .the FIFTH false reason retired from this one render, measured 2026-09-20
   *
   *   the clause was unconditional prose:
   *
   *     ⚠️ the GROVE is up: it answers the crew half of this very poll,
   *        so do NOT halt a sprout on this line.
   *
   *   it was added to cure the FOURTH reason, and it is true in the common
   *   case — an on-grove tree usually sits on a box that answered. but it is
   *   asserted on EVERY run, and that covers the one run where it inverts.
   *
   * ⚠️ .measured on a MUTE tunnel. `rhx git.crew.poll --fellable` rendered, in
   *   one report:
   *
   *     ├─ ⚠️  UNREACHED: grove-sandpine-v20260901.ground … (4 groves)
   *     🦫 no tree to fell — 34 of 38 read, none merged · ⚠️ 4 tree(s) ON GROVE
   *        └─ 🌐 … ⚠️ the GROVE is up: it answers the crew half of this very
   *           poll, so do NOT halt a sprout on this line.
   *
   *   the header and the guide CONTRADICT each other, four lines apart. the
   *   crew half did answer — from the LEDGER, with `still 3255m` clocks that
   *   are the tell no pane was read. `rhx git.grove.list` then measured the
   *   tunnel leg as bound with no answer on it.
   *
   * 🔴 .the harm is the DECISION, exactly as with the fourth reason. the
   *   babysit contract keys on this line: "do NOT halt a sprout on this line"
   *   is an instruction, and a halt is precisely what an unreached grove
   *   warrants. so the one run where the clause is false is the one run where
   *   a reader acts on it — term=false-report, with the refutation already
   *   printed four lines above it in the same render.
   *
   * 🟡 .what is NOT claimed. the clause is kept, unchanged, for the reachable
   *   case — it is true there and it earns its place. only its UNCONDITIONAL
   *   assertion is cured. the cause of the unread set stays unmeasured; this
   *   says naught about it.
   */
  given('[case58] the on-grove guide, over a grove that did NOT answer', () => {
    const guides = (): string[] =>
      readPollWhole()
        .split('\n')
        .filter((line) => !/^\s*#/.test(line))
        .filter((line) => line.includes('ONGROVE_N tree(s)'));

    when('[t0] the clause is asked with ZERO groves unreached', () => {
      const result = useBeforeAll(async () =>
        runCrew({
          command: [
            'printf "DECLARED[%s]\\n" "$(declare -F __crew_ongrove_reach_clause >/dev/null 2>&1 && printf yes || printf no)"',
            'printf "CLAUSE[%s]\\n" "$(__crew_ongrove_reach_clause 0)"',
          ].join('\n'),
        }),
      );

      then('the subject exists — the clamp is not vacuous', () => {
        expect(result.stdout).toContain('DECLARED[yes]');
      });

      then(
        'COUNTER: it still says the grove is up — the true case is kept',
        () => {
          expect(result.stdout).toContain('the GROVE is up');
        },
      );

      then(
        'COUNTER: it still withholds the halt, which is correct here',
        () => {
          expect(result.stdout).toContain('do NOT halt a sprout');
        },
      );
    });

    /**
     * ⚠️ TOOTH. this is the whole defect. the clause must invert, not merely
     *    soften — a reader who meets "do NOT halt" on an unreached grove has
     *    been told the opposite of what the header four lines up measured.
     */
    when('[t1] the clause is asked with a NON-ZERO unreached count', () => {
      const result = useBeforeAll(async () =>
        runCrew({
          command: 'printf "CLAUSE[%s]\\n" "$(__crew_ongrove_reach_clause 4)"',
        }),
      );

      then('🔴 it does NOT claim the grove is up', () => {
        expect(result.stdout).not.toContain('the GROVE is up');
      });

      then('🔴 it does NOT withhold the halt', () => {
        expect(result.stdout).not.toContain('do NOT halt a sprout');
      });

      then('it names the grove as UNREACHED, so the reader can act', () => {
        expect(result.stdout).toMatch(/UNREACHED/);
      });

      then(
        'it names WHY the crew half still answered — the ledger, not a pane',
        () => {
          // the contradiction is only resolvable if the reader learns that the
          // crew half read the LEDGER. absent that, the two halves of one report
          // simply disagree and the reader picks whichever they met first.
          expect(result.stdout).toMatch(/LEDGER/);
        },
      );

      then('it says naught about the CAUSE of the unread set', () => {
        // the cause stays unmeasured (see [case41]). this clause speaks about
        // REACH alone; to borrow a cause here would repeat the fourth reason.
        expect(result.stdout).not.toMatch(/too loaded|often settles/);
      });
    });

    /**
     * ⚠️ TOOTH, and the one that bites. the operation can be perfect while the
     *    verdict lines never CALL it — which is exactly how the fourth reason
     *    survived. so the clamp reads the call sites, not the helper alone.
     */
    when('[t2] the fell verdict lines are read from source', () => {
      then('BOTH carry the guide — the teeth below are not vacuous', () => {
        expect(guides().length).toBe(2);
      });

      then('🔴 NOT ONE hardcodes the reach clause', () => {
        expect(
          guides().filter((line) => line.includes('the GROVE is up')),
        ).toEqual([]);
      });

      then('🔴 EVERY one derives it from the unreached count', () => {
        expect(
          guides().filter(
            (line) =>
              !line.includes('__crew_ongrove_reach_clause "$UNREACHED_N"'),
          ),
        ).toEqual([]);
      });
    });
  });
});
