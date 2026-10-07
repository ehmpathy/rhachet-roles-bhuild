/**
 * .what = clamps on the fork-storm row and the spike verdict — name, grade, lead, settle
 *
 * .note = a PART of the `git.grove.saturation` suite, cut so one reviewer can hold
 *         it whole. the suite's shared fixtures, and its account of what it
 *         runs against and why, live in git.grove.saturation.harness.ts.
 */
import { readFileSync } from 'fs';
import { given, then, when } from 'test-fns';

import { tempDirs } from '../../.test/tempDirs';
import { PATH_SAT } from './git.grove.saturation.harness';

/**
 * .what = sweep the temp dirs [case2] made
 * .why  = each arm writes a payload file and a spinner; a suite that litters
 *         /tmp is clean on run 1 and filthy on run 1000.
 */
afterAll(() => {
  tempDirs.delAll();
});

/**
 * .what = the fork-STORM arm prescribes a hunt, so it must NAME THE VERB that
 *         performs it — a runnable line, the way every other hint on this skill
 *         already does.
 *
 * 🔴 .why — the row sends its reader to the ONE tool that cannot do it
 *         the shipped arm says "hunt the PARENT that reaps them" and emits no
 *         command. the nearest verb by name is `git.grove.prune`, whose default
 *         is `--process nvim` and whose refuse-list holds `node` and `claude` by
 *         design — so the process family that actually reaps on a grove is
 *         UNREACHABLE from it. a reader who follows the row lands on a census of
 *         the wrong population and learns naught.
 *
 *         the verb that does perform this hunt is kin to this very skill:
 *         `git.grove.saturation.spend` reads /proc/<pid>/stat cutime+cstime by
 *         live parent — reaped cpu, attributed to the reaper. it is exactly the
 *         counter read the storm row asks for, and the row does not say so.
 *
 * 🔴 .measured 2026-09-18 on grove-sandpine-v20260901
 *         the row fired at 76 forks/s. the supervisor read it, ran
 *         `rhx git.grove.prune grove-sandpine-v20260901`, and got 3 × nvim at
 *         0.3% cpu / 0.2% mem between them — a wasted call on a 🔴 box, which is
 *         the one place `surgoal.squeeze-the-grove` grades a process census a
 *         blocker. the hunt then took a second call, to the kin verb above.
 *
 * ⚠️ .this is a SOURCE clamp, and completely so
 *         the arm is a static `echo` block with no classifier in it, so the
 *         render is a deterministic function of these lines. there is no captured
 *         pane that could carry more signal than the source does
 *         (rule.always.clamp-the-verbatim-pane-your-classifier-judged, read for
 *         its ARGUMENT rather than its file convention — the same read [case1]
 *         states in this file's own header).
 *
 * ⇒ the house pattern it rejoins: `:853` emits `rhx git.grove.saturation --only
 *   … --timeout …` and `:857` emits `rhx git.grove.wake …`. a hint that names a
 *   move and withholds its command is the outlier here, never the norm
 *   (rule.require.errors-name-the-fix · rule.require.poll-recommends-every-cure).
 */
given(
  '[case4] the fork-STORM row must name the verb that hunts the reaper',
  () => {
    const code = readFileSync(PATH_SAT, 'utf8');

    /**
     * .what = the churn-verdict arm, sliced from its GUARD to its `fi`
     * .why  = a whole-file `toContain` would pass on a mention of the verb
     *         ANYWHERE in the skill — even the usage block, which already names
     *         kin verbs. the claim is about THIS arm, so the slice is what the
     *         assertion must read (rule.require.clamp-edge-cases: a clamp that
     *         cannot go red guards naught).
     *
     * 🔴 .RE-ANCHORED 2026-09-18 — was `code.indexOf('a fork STORM')`, the arm's
     *    own PROSE. that anchor was correct while the storm line opened the arm
     *    unconditionally; the moment the headline became conditional it slid into
     *    the else branch, and the slice silently lost the at-rest half. every
     *    tooth here still passed, over a region half its intended size.
     *
     * ⇒ the anchor is now the GUARD — its variable and its threshold. a rate
     *   emitter that still gates on `fork_rate >= 50` is the same emitter however
     *   its prose reads, so this survives a full re-word. the identical lesson the
     *   ON-GROVE clamp paid for the same day (crewwork [case41] · [case50]).
     */
    const ARM_GUARD = `if [[ "$fork_rate" != "-" ]] && awk -v f="\${fork_rate:-0}" 'BEGIN{exit !(f+0>=50)}'; then`;
    const arm = (): string => {
      const at = code.indexOf(ARM_GUARD);
      expect(at).toBeGreaterThan(0);
      const shut = code.indexOf('\n  fi', at);
      expect(shut).toBeGreaterThan(at);
      return code.slice(at, shut);
    };

    when('[t0] the storm arm is read', () => {
      then(
        '⚠️ the arm slice is non-empty — the derivation must not go vacuous',
        () => {
          // the anti-vacuity tooth, owed by every filtered slice. without it a
          // re-worded guard empties the region and each tooth below passes over ''.
          expect(arm().length).toBeGreaterThan(200);
        },
      );

      then(
        'it still DIAGNOSES — the cure adds a line, never replaces one',
        () => {
          // the counter-tooth. a cure that swapped the explanation for a bare
          // command would trade one defect for its mirror: a reader who is told
          // what to run and never why it is owed.
          expect(arm()).toContain('hunt the PARENT');
        },
      );

      then('🔴 it NAMES the verb that performs that hunt', () => {
        // the bite. RED on the shipped arm, which prescribes a hunt and stops.
        expect(arm()).toContain('git.grove.saturation.spend');
      });

      then(
        'and the line it emits is RUNNABLE — `rhx`-prefixed, like every peer hint',
        () => {
          // "see saturation.spend" is a pointer; `rhx git.grove.saturation.spend
          // <grove>` is a move. the peers at :853 and :857 emit the second kind.
          expect(arm()).toContain('rhx git.grove.saturation.spend');
        },
      );

      then(
        '🔴 the runnable hunt is WINDOWED — a lifetime read cannot see a spike',
        () => {
          // a storm is by definition a spike, so the in-window read that flagged it
          // is the least reliable one to hunt on (rule.always.re-measure-a-lever-
          // before-you-rank-it). that argument is right, and it once carried the
          // WRONG remedy: this line read `--since-boot`.
          //
          // 🔴 the cure for ONE noisy window is a SECOND window, never a WINDOWLESS
          //   read. the kin verb's own --help draws exactly that line: "run it
          //   twice, OR cross-check with --since-boot" — two instruments, not one.
          //
          //   measured on two consecutive ticks, 2026-09-18, both on `local` at a
          //   real flag (499/s vs 102/s, then 180/s vs 102/s): the --since-boot
          //   hunt returned systemd 46% · zsh 10% · tmux 10% BOTH times. over 15.8d
          //   and 729.5 cpu-h a spike of minutes moves no rank by construction, so
          //   the prescription could not answer the question its own headline
          //   raised — at the cost of one live call per tick, to learn it twice.
          const hunt = arm()
            .split('\n')
            .filter((line) =>
              line.includes('hunt it: rhx git.grove.saturation.spend'),
            );
          expect(hunt.length).toEqual(1);
          expect(hunt[0]).toContain('--window');
          expect(hunt[0]).not.toContain('--since-boot');
        },
      );

      then(
        '🔴 and it says to run it TWICE — one window ranks no lever either',
        () => {
          // the re-measure rule is satisfied by the SECOND window, so the count is
          // the part that carries it. drop the word and the cure has merely swapped
          // one single-sample read for another.
          expect(arm()).toContain('TWICE');
        },
      );

      then(
        '⚠️ --since-boot is still NAMED — as the CROSS-CHECK, never as the hunt',
        () => {
          // the counter-tooth. a lifetime read is the right cross-check and the
          // wrong hunt, so a cure that strikes it outright has overshot: the reader
          // then has no second instrument at all.
          expect(arm()).toContain('--since-boot');
          expect(arm()).toContain('CROSS-CHECK');
        },
      );
    });

    when('[t1] the clamp is aimed at the shipped defect and at the fix', () => {
      const bites = (s: string): boolean =>
        /rhx git\.grove\.saturation\.spend/.test(s);

      then('🔴 it BITES the shipped arm, verbatim', () => {
        const shipped = [
          'a fork STORM. a rate this high spends cpu that no',
          '`eats` row can attribute, because each process is',
          'gone before the next sample. hunt the PARENT that',
          'reaps them before you fell a tree or add a core.',
        ].join('\n');
        expect(bites(shipped)).toEqual(false);
      });

      then('and it PASSES an arm that emits the hunt', () => {
        const cured =
          'gone before the next sample. hunt the PARENT that reaps them:\n' +
          'rhx git.grove.saturation.spend $key --since-boot';
        expect(bites(cured)).toEqual(true);
      });

      then(
        '⚠️ and a bare POINTER does not satisfy it — a hint must be runnable',
        () => {
          // the weakest cure a tired author reaches for, and the one this tooth
          // refuses: to name the kin verb in prose leaves the reader to derive the
          // invocation, which is the friction the rule exists to remove.
          expect(
            bites('…hunt the PARENT. see git.grove.saturation.spend'),
          ).toEqual(false);
        },
      );
    });

    when(
      '[t2] the peer hints are read — the house pattern this rejoins',
      () => {
        then('the timeout hint already emits its own runnable line', () => {
          expect(code).toContain('rhx git.grove.saturation --only');
        });

        then('and the asleep hint emits its own', () => {
          expect(code).toContain('wake it: rhx git.grove.wake');
        });
      },
    );
  },
);

/**
 * .what = the fork-STORM flag must grade the live rate against THIS box's own
 *         since-boot mean, never against a bare absolute alone
 *
 * .why  = the flag's claim is about ANOMALY — "a rate this high spends cpu that
 *         no `eats` row can attribute … hunt the PARENT". a threshold with no
 *         baseline cannot support that claim, because "high" is a comparison and
 *         the arm compares against a constant that knows nought of the box.
 *
 *   🔴 measured 2026-09-18 on grove-sandpine-v20260901, on a live babysit tick:
 *
 *        ├─ churn   102/s forks · 9985/s ctxt-sw   (over 1.03s)
 *        │         🔴 a fork STORM. … hunt the PARENT that reaps them
 *
 *      the supervisor ran the prescribed hunt. it returned:
 *
 *        └─ 242084527 forks since boot  =  181.1/s mean
 *
 *      ⇒ the live rate was 102/s — **56% of this box's own baseline** — and the
 *      arm called it a STORM. the hunt then named `tmux: server` at 402.7 cpu-h
 *      / 75.2%, which is STRUCTURAL: every clone's forks charge to it by
 *      construction, so that answer returns identical on every tick forever.
 *
 * 🔴 .the class — `term=false-report`. the arm states a true claim on one axis
 *    (102 >= 50) and dresses it as a claim on another (this is anomalous spend
 *    you must hunt). a supervisor cannot tell the two apart from the render, so
 *    it pays a hunt each tick and is handed structure each time.
 *
 * ⚠️ .why the cure is CLEAN — the datum is already in hand and thrown away. the
 *    awk at :436-445 binds `fb` (forks since boot) and `ub` (uptime) to compute
 *    the delta, then discards both. the mean is `fb/ub`: zero extra reads, zero
 *    extra forks, on a box whose surgoal forbids a heavy sample outright (a
 *    sampler IS a saturator). the peer verb already computes this exact figure.
 *
 * ⇒ this does NOT lower the flag. it keeps the absolute gate exactly as shipped
 *   and adds the one term that makes "high" a checkable word.
 */
given(
  '[case5] the fork-STORM flag must grade the rate against the box baseline',
  () => {
    const code = readFileSync(PATH_SAT, 'utf8');

    /**
     * .what = the storm arm, sliced from its guard to its `fi` — same slice
     *         [case4] takes, and for the same reason
     * .why  = a whole-file `toContain` passes on a mention anywhere in the skill,
     *         and this skill's own header prose already discusses fork rates at
     *         length. the claim is about THIS arm (rule.require.clamp-edge-cases)
     */
    const ARM_GUARD = `if [[ "$fork_rate" != "-" ]] && awk -v f="\${fork_rate:-0}" 'BEGIN{exit !(f+0>=50)}'; then`;
    const arm = (): string => {
      const at = code.indexOf(ARM_GUARD);
      expect(at).toBeGreaterThan(0);
      const shut = code.indexOf('\n  fi', at);
      expect(shut).toBeGreaterThan(at);
      return code.slice(at, shut);
    };

    when(
      '[t0] the emitter is read — the baseline must be COMPUTED before it can be said',
      () => {
        then('🔴 the counter awk emits a since-boot mean', () => {
          // the bite, at the source. RED as shipped: the awk binds fb and ub, prints
          // three keys, and discards the absolute it already holds.
          expect(code).toContain('fork_mean=');
        });

        then(
          'and it derives that mean from the SINCE-BOOT total, never from the window',
          () => {
            // the discriminator. `(fb-fa)/w` is the live rate and already exists; the
            // mean is `fb/ub`. a clamp that read only "fork_mean=" would pass on a
            // second copy of the live rate under a new name.
            expect(code).toMatch(/fork_mean=[^\n]*\n?[^\n]*fb\s*\/\s*ub/);
          },
        );

        then(
          'and the render plumbs it through the same kv seam as its peers',
          () => {
            // fork_rate and ctxt_rate both arrive this way at :947. a mean that never
            // reaches the render is a computed value no reader ever sees.
            expect(code).toContain('fork_mean=$(kv "$out" fork_mean)');
          },
        );
      },
    );

    when('[t1] the storm arm is read', () => {
      then(
        '⚠️ the arm slice is non-empty — the derivation itself must not go vacuous',
        () => {
          // the anti-vacuity tooth. every assertion below reads this slice, so a
          // slice that silently emptied would pass them all on an empty string.
          expect(arm().length).toBeGreaterThan(80);
        },
      );

      then(
        '🔴 it names the box own baseline, so "high" becomes checkable',
        () => {
          expect(arm()).toContain('fork_mean');
        },
      );

      then(
        '🔴 and it says what a BELOW-baseline rate means — that is the whole miss',
        () => {
          // 102/s against a 181/s mean is this grove at rest. the arm must say so,
          // or the supervisor pays the hunt again next tick.
          expect(arm()).toContain('baseline');
        },
      );

      then(
        'and it still DIAGNOSES — the cure adds a term, never replaces one',
        () => {
          // the counter-tooth, which guards [case4]'s property. a cure that swapped
          // the explanation for a ratio would trade one defect for its mirror.
          expect(arm()).toContain('hunt the PARENT');
        },
      );

      then(
        'and it still emits the runnable hunt — [case4] must survive this edit',
        () => {
          expect(arm()).toContain('rhx git.grove.saturation.spend');
          expect(arm()).toContain('--since-boot');
        },
      );
    });

    when('[t2] the clamp is aimed at the shipped defect and at the fix', () => {
      const bites = (s: string): boolean =>
        /fork_mean/.test(s) && /baseline/.test(s);

      then('🔴 it BITES the shipped arm, verbatim', () => {
        const shipped = [
          'a fork STORM. a rate this high spends cpu that no',
          '`eats` row can attribute, because each process is',
          'gone before the next sample. hunt the PARENT that',
          'reaps them before you fell a tree or add a core.',
          '⚠️ NOT via prune — it refuses node/claude by design.',
          'hunt it: rhx git.grove.saturation.spend $key --since-boot',
        ].join('\n');
        expect(bites(shipped)).toEqual(false);
      });

      then('and it PASSES an arm that grades the rate against the mean', () => {
        const cured =
          'a fork STORM — $fork_rate/s against a $fork_mean/s baseline since boot.\n' +
          'hunt the PARENT: rhx git.grove.saturation.spend $key --since-boot';
        expect(bites(cured)).toEqual(true);
      });

      then('⚠️ and a mean PRINTED beside the rate does not satisfy it', () => {
        // the weakest cure available, and the one this tooth refuses: to emit the
        // number and leave the comparison to the reader is the same work the
        // supervisor already did by hand this tick. the arm must render the
        // VERDICT, never merely the operand.
        expect(
          bites('a fork STORM. rate $fork_rate/s, mean $fork_mean/s.'),
        ).toEqual(false);
      });
    });
  },
);

/**
 * .what = the churn verdict must LEAD. the headline, the prescription, and the
 *         runnable command all follow the baseline comparison — none of them
 *         prints ahead of it and is then withdrawn.
 *
 * .why  = [case5] put the baseline INTO the arm and stopped there, on a stated
 *         and deliberate bound: *"the flag is NOT lowered. it still fires on the
 *         absolute; it now says which side of the box's own baseline the rate
 *         fell on"*. so the cured arm rendered, in one block and in this order:
 *
 *           🔴 a fork STORM … hunt the PARENT that reaps them before you fell a
 *              tree or add a core.
 *           ⚠️ but 99/s is BELOW this box's own 181/s baseline … so this is the
 *              grove AT REST, never a spike.
 *              the lever here is PROVISION or fewer concurrent crews, not a hunt.
 *           hunt it: rhx git.grove.saturation.spend <grove> --since-boot
 *
 *   🔴 the LAST line is a runnable hunt, printed directly after the sentence
 *      that says the hunt is not the lever. a reader acts on the prescription,
 *      never on the caveat buried above it.
 *
 * 🔴 .measured 2026-09-18, on the live tick that wrote this case. the supervisor
 *    read the arm on `local` — 499/s — and on `grove-sandpine-v20260901` — 99/s
 *    against a 181/s baseline, flagged 🔴 STORM — and ran the prescribed hunt.
 *    it returned `systemd 388.4 cpu-h / 46.2%` and `102.2/s mean`: a structural
 *    reaper, and a figure the saturation render had ALREADY printed two lines
 *    above the prescription. one whole call, per box, per tick, for naught.
 *
 * ⚠️ .the class — the same one cured in `git.crew.poll`'s ON-GROVE caveat hours
 *    earlier: a render that states a verdict while the material beside it says
 *    the opposite. here it is sharper, because the datum that refutes it is not
 *    merely NEARBY — it is already bound, in the same block, before the headline
 *    ever runs.
 *
 * 🔴 .the second defect, same block, same class — an UNREAD baseline rendered as
 *    a POSITIVE comparison. the guard was `[[ $fork_mean != "-" ]] && (f < m)`,
 *    so an unreadable mean fell through to the else and emitted *"and 99/s is
 *    ABOVE this box's own -/s baseline since boot — a real spike"*. absence of
 *    evidence, dressed as evidence of presence (`term=false-report`).
 *
 * ⇒ this does NOT lower the flag either. the arm fires on the identical absolute
 *   gate and diagnoses on every branch. what moved is the ORDER.
 */
given(
  '[case6] the churn verdict leads — no headline, prescription, or command precedes it',
  () => {
    const code = readFileSync(PATH_SAT, 'utf8');

    /**
     * 🔴 anchored on the emitter's IDENTITY — its guard variable and its threshold
     *    — never on its prose. the prose is exactly what this case moves, so a
     *    prose anchor would have died on the cure it exists to clamp. the lesson
     *    is not abstract: the ON-GROVE clamp earlier the same day was anchored on
     *    a render string, that string was then re-worded, and its own anti-vacuity
     *    arm went red over an empty array.
     */
    const ARM_GUARD = `if [[ "$fork_rate" != "-" ]] && awk -v f="\${fork_rate:-0}" 'BEGIN{exit !(f+0>=50)}'; then`;
    const arm = (): string => {
      const at = code.indexOf(ARM_GUARD);
      expect(at).toBeGreaterThan(0);
      const shut = code.indexOf('\n  fi', at);
      expect(shut).toBeGreaterThan(at);
      return code.slice(at, shut);
    };

    /** the arm with its `#` comment lines stripped — the .why block below quotes
     *  the retired strings verbatim as the defect it repairs, so a raw read would
     *  find them and every ban tooth would go red on the cure's own record. */
    const bare = (): string =>
      arm()
        .split('\n')
        .filter((line) => !/^\s*#/.test(line))
        .join('\n');

    when('[t0] the arm is read', () => {
      then(
        '⚠️ the slice is non-empty, and so is its comment-stripped body',
        () => {
          // both anti-vacuity teeth. the second matters on its own: a slice that is
          // ALL comment would pass the first and empty every ban below.
          expect(arm().length).toBeGreaterThan(200);
          expect(bare().length).toBeGreaterThan(200);
        },
      );

      then(
        '🔴 the baseline branch OPENS the verdict — it is not folded mid-block',
        () => {
          // the bite. RED as shipped: the storm headline was the arm's first echo,
          // and the `fork_mean` comparison came three echoes later.
          const b = bare();
          const gate = b.indexOf('fork_mean');
          const storm = b.indexOf('a fork STORM');
          expect(gate).toBeGreaterThan(-1);
          expect(storm).toBeGreaterThan(-1);
          expect(gate).toBeLessThan(storm);
        },
      );

      then('🔴 and a BELOW-baseline rate is not called a storm at all', () => {
        /**
         * 🟡 .this tooth once read `expect(b).toContain('NOT a storm')`
         *
         *    a PROSE anchor, which this case's own header forbids — and the
         *    phrase it pinned was the exact SETTLEMENT [case9][t5] withdrew:
         *    `NOT a storm` is a claim about a sustained state, asserted off a
         *    ~1s sample. so the tooth graded a word, and that word was the
         *    defect. its peer at :2089 died the same way in an earlier round,
         *    which is what proves the class rather than a slip.
         *
         * ⚠️ the CLAIM is unchanged and still binds: a below-baseline rate gets
         *    its own verdict, never the storm's. what moved is the anchor —
         *    from the retired phrase to the shape that phrase stood in for.
         */
        const b = bare();
        const at = b.indexOf('if [[ "$fork_mean" != "-" ]] && awk');
        expect(at).toBeGreaterThan(-1); // ANTI-VACUITY: the branch must exist
        const shut = b.indexOf('\n    else', at);
        expect(shut).toBeGreaterThan(at); // ANTI-VACUITY: the branch must close
        const branch = b.slice(at, shut);

        // it renders an at-rest verdict of its own …
        expect(branch).toContain('AT REST');
        // … and never the storm one, in word or in glyph
        expect(branch).not.toMatch(/a fork STORM/);
        expect(branch).not.toContain('🔴');
      });

      then(
        '🔴 and it RETRACTS no prescription — it takes back no order it gave',
        () => {
          /**
           * 🟡 .this tooth once read `expect(b).toContain('do NOT hunt the PARENT')`
           *
           *    that is a PROSE anchor, and this case's own header forbids one:
           *    "the prose is exactly what this case moves, so a prose anchor would
           *    have died on the cure it exists to clamp." it did, at [case9][t4].
           *
           *    ⚠️ what [case6] actually cured was a RETRACTION — the shipped arm
           *    printed `hunt it:` unconditionally, AFTER at-rest text saying a hunt
           *    is not the lever. the defect was the self-contradiction, never the
           *    hunt's worth. [t1] clamps the command's placement and carries that
           *    half; this tooth carries the other: the branch takes back no order.
           *
           * 🔴 .and the ban it used to require was refuted in prod, 2026-09-19
           *    the at-rest branch forecast "a hunt would name the structural reaper
           *    (tmux …)". run twice against that ban: tmux reaped 0.0% and 0.0%,
           *    claude reaped 90.8% and 40.4%. the predicted answer measured ZERO,
           *    and the hunt named the real spender on a box at 71.71% stall where
           *    `eats` could attribute only ~36% of a 261% load.
           * ⇒ so the ban is gone and the COHERENCE stays. see [case9][t4].
           *
           * 🟡 .and the cut below is bounded by the branch's own `else`, never by a
           *    char count. a fixed window is a magic number that silently
           *    under-reads the moment the prose grows — measured here, 2026-09-19:
           *    the 700-char slice this tooth once carried stopped one line short of
           *    `PROVISION`, so it went red on a cure that had in fact KEPT the very
           *    lever it grades. the same trap bit [case9][t4] in the same round,
           *    which is what proves it is a class rather than a slip.
           */
          const b = bare();
          const at = b.indexOf('is BELOW this');
          expect(at).toBeGreaterThan(-1); // ANTI-VACUITY: the at-rest branch exists
          const shut = b.indexOf('\n    else', at);
          expect(shut).toBeGreaterThan(at); // ANTI-VACUITY: the branch must close
          const branch = b.slice(at, shut);
          // it still names the lever that IS its own — the PROVISION axis
          expect(branch).toMatch(/PROVISION/);
          // and it issues no order it then walks back
          expect(branch).not.toMatch(/not the lever/i);
        },
      );
    });

    when('[t1] the runnable hunt is read — the line a reader acts on', () => {
      then('🔴 it is emitted ONCE, and only on the storm side', () => {
        // the sharpest tooth. the shipped arm emitted `hunt it:` unconditionally,
        // AFTER the at-rest text said a hunt is not the lever.
        const hunts = bare()
          .split('\n')
          .filter((line) =>
            line.includes('hunt it: rhx git.grove.saturation.spend'),
          );
        expect(hunts.length).toBe(1);
      });

      then(
        '🔴 and it sits BELOW the storm headline, never below the at-rest one',
        () => {
          const b = bare();
          expect(b.indexOf('a fork STORM')).toBeLessThan(
            b.indexOf('hunt it: rhx'),
          );
          expect(b.indexOf('AT REST')).toBeLessThan(b.indexOf('a fork STORM'));
        },
      );

      then(
        'COUNTER: the storm branch still DIAGNOSES and still names the verb',
        () => {
          // the counter-tooth [case4] and [case5] both own. a cure that traded the
          // explanation for an order would swap one defect for its mirror.
          const b = bare();
          expect(b).toContain('hunt the PARENT that');
          expect(b).toContain('rhx git.grove.saturation.spend');
          expect(b).toContain('--since-boot');
          expect(b).toContain('NOT via prune');
        },
      );
    });

    when('[t2] the baseline itself went UNREAD', () => {
      then(
        '🔴 an unreadable mean is not rendered as an ABOVE comparison',
        () => {
          // the second defect. the shipped guard let `-` fall to the else, which
          // asserted `ABOVE this box's own -/s baseline … a real spike`.
          expect(bare()).toContain('baseline went UNREAD');
        },
      );

      then('🔴 and the arm says the side is UNSETTLED, never picks one', () => {
        // ⚠️ scoped to the UNREAD sub-branch, never to the whole arm. [case9] puts
        //    its own hedge into the ABOVE branch, and an arm-wide `toContain` would
        //    then pass off a neighbour's word while this branch lost its own.
        const b = bare();
        const at = b.indexOf('baseline went UNREAD');
        expect(at).toBeGreaterThan(-1);
        const branch = b.slice(at, at + 400);
        expect(branch).toContain('unsettled');
        // and the flag still stands — on the one term it has left
        expect(branch).toContain('absolute alone');
      });

      then(
        'COUNTER: the ABOVE branch survives, for a baseline that WAS read',
        () => {
          // a cure that answered the unread case by a delete of the comparison would
          // discard [case5] entirely.
          expect(bare()).toMatch(
            /is ABOVE this box's own \$\{fork_mean\}\/s baseline/,
          );
        },
      );
    });

    when('[t3] the clamp is aimed at the shipped defect and at the fix', () => {
      const leads = (s: string): boolean => {
        const gate = s.indexOf('fork_mean');
        const storm = s.indexOf('a fork STORM');
        return gate > -1 && storm > -1 && gate < storm;
      };

      then('🔴 it BITES the shipped arm, verbatim', () => {
        const shipped = [
          'echo "🔴 a fork STORM. a rate this high spends cpu that no"',
          'echo "   `eats` row can attribute, because each process is"',
          'echo "   gone before the next sample. hunt the PARENT that"',
          'if [[ "$fork_mean" != "-" ]] && awk ...; then',
          'echo "   ⚠️ but ${fork_rate}/s is BELOW this box\'s own ${fork_mean}/s baseline"',
          'echo "   hunt it: rhx git.grove.saturation.spend ${GROVE_PROBER[$key]} --since-boot"',
        ].join('\n');
        expect(leads(shipped)).toEqual(false);
      });

      then('and it PASSES an arm whose comparison opens the block', () => {
        const cured = [
          'if [[ "$fork_mean" != "-" ]] && awk ...; then',
          'echo "🟡 a high fork rate, and NOT a storm …"',
          'else',
          'echo "🔴 a fork STORM. … hunt the PARENT that"',
          'fi',
        ].join('\n');
        expect(leads(cured)).toEqual(true);
      });
    });
  },
);

given('[case9] ONE window may NOMINATE a spike — it may not SETTLE one', () => {
  const code = readFileSync(PATH_SAT, 'utf8');

  /**
   * 🔴 .the measured defect, two consecutive babysit ticks, 2026-09-19
   *
   *    `fork_rate` is a delta over `rate_window`, and that window is the span of
   *    `vmstat 1 2` — ~1.0 second. `fork_mean` is a since-boot mean over a whole
   *    uptime. the arm compares the two with a bare `f < m`, so a ONE-SECOND
   *    sample of a bursty counter decides a claim about a 15.8-day box.
   *
   *      | the 1s gauge | the arm rendered          | the 30s hunt, run twice |
   *      |---|---|---|
   *      | 231/s        | 🔴 STORM · "a real spike" | 136/s · 95/s            |
   *      | 259/s        | 🔴 STORM · "a real spike" |  57/s · 54/s            |
   *
   *    baseline 180/s both times. ⇒ BOTH refuted, and not narrowly — the AT REST
   *    branch was correct on each, and the arm took the other. 60s of hunt per
   *    tick, to learn the same answer twice.
   *
   * ⚠️ and the arm KNEW the principle: four lines under this very verdict it
   *    tells its reader *"run it TWICE — one window ranks no lever"*. it then
   *    ranked a lever on one window. the cure is that sentence, turned inward.
   *
   * 🟡 the flag is NOT lowered and the hunt is NOT withdrawn — a high absolute
   *    still fires, and the hunt is still the instrument that grades it. what is
   *    withdrawn is the claim that the answer is known BEFORE the hunt runs.
   */

  const ARM_GUARD = `if [[ "$fork_rate" != "-" ]] && awk -v f="\${fork_rate:-0}" 'BEGIN{exit !(f+0>=50)}'; then`;
  const arm = (): string => {
    const at = code.indexOf(ARM_GUARD);
    expect(at).toBeGreaterThan(0);
    const shut = code.indexOf('\n  fi', at);
    expect(shut).toBeGreaterThan(at);
    return code.slice(at, shut);
  };

  /** comment lines stripped — the .why above quotes the retired string verbatim,
   *  so a raw read would find "a real spike" and the ban tooth would go red on
   *  the cure's own record (the trap [case6] already records). */
  const bare = (): string =>
    arm()
      .split('\n')
      .filter((line) => !/^\s*#/.test(line))
      .join('\n');

  when('[t0] the ABOVE-baseline branch is read', () => {
    then(
      '⚠️ ANTI-VACUITY — the slice and its stripped body are non-empty',
      () => {
        expect(arm().length).toBeGreaterThan(200);
        expect(bare().length).toBeGreaterThan(200);
      },
    );

    then('🔴 it no longer asserts a SETTLED spike', () => {
      // the bite. RED as shipped: `since boot — a real spike, so the hunt below
      // is owed.` — a verdict of fact, off one second of counter.
      expect(bare()).not.toContain('a real spike');
    });

    then('🔴 it names the WINDOW its own read was taken over', () => {
      // the datum that bounds the claim. without it a reader cannot tell that
      // the number in front of them is one sample rather than a rate.
      const b = bare();
      const at = b.indexOf("is ABOVE this box's own");
      expect(at).toBeGreaterThan(-1);
      const branch = b.slice(at, at + 400);
      expect(branch).toContain('${rate_window}');
      expect(branch).toContain('CANDIDATE spike');
    });

    then('COUNTER: the flag still FIRES and the hunt is still named', () => {
      // a cure that answered a false positive by a softened gate would trade
      // this defect for the miss the surgoal grades dearer.
      const b = bare();
      expect(b).toContain('a fork STORM');
      expect(b).toContain('hunt the PARENT that');
      expect(b).toContain('hunt it: rhx git.grove.saturation.spend');
      // and the comparison itself survives — [case5]'s whole subject
      expect(b).toMatch(/is ABOVE this box's own \$\{fork_mean\}\/s baseline/);
    });
  });

  when('[t1] the two branches are read against each other', () => {
    then(
      '🔴 each hedges in its OWN words — no shared token carries both',
      () => {
        // .why = [case6][t2] asserts `unsettled` for the UNREAD branch. were this
        //   branch to reach for the same word, an arm-wide tooth would pass off a
        //   neighbour and neither branch would be clamped. the two hedges are
        //   deliberately disjoint, and this is what holds them apart.
        const b = bare();
        const atAbove = b.indexOf("is ABOVE this box's own");
        const atUnread = b.indexOf('baseline went UNREAD');
        expect(atAbove).toBeGreaterThan(-1);
        expect(atUnread).toBeGreaterThan(-1);

        const above = b.slice(atAbove, atAbove + 400);
        const unread = b.slice(atUnread, atUnread + 400);
        expect(above).not.toContain('unsettled'); // the UNREAD branch's word
        expect(unread).not.toContain('CANDIDATE spike'); // this branch's word
      },
    );
  });

  when('[t3] it predicts NO outcome for the hunt it just named', () => {
    /**
     * 🔴 .the SECOND half of this same defect, missed by the first cure
     *
     *    [t0] banned `a real spike` — a prejudgment toward STORM. the branch
     *    then closed with `expect AT REST.` — a prejudgment toward the OTHER
     *    verdict, in the same two sentences, and it survived the cure because
     *    the ban was written against one polarity rather than against the ACT.
     *
     *    ⚠️ the arm's own comment says what was withdrawn: "the claim that the
     *    answer is already known before the hunt runs". `expect AT REST` IS
     *    that claim. the cure was authored and its last two words undid it.
     *
     * 🔴 .refuted in prod, 2026-09-19, the third data point
     *
     *      | the 1s gauge | the arm rendered  | the 30s hunt, run twice     |
     *      |---|---|---|
     *      | 231/s        | expect AT REST    | 136/s · 95/s   → at rest ✅ |
     *      | 259/s        | expect AT REST    |  57/s · 54/s   → at rest ✅ |
     *      | 291/s        | expect AT REST    | 84.9% · 91.9% reaped → 🔴   |
     *
     *    the third tick's hunt named `claude` at 53.4% then 68.1% reaped on a
     *    box at runq 8 of 4 cores and 24.91% stall. NOT at rest, and the hunt
     *    is the only instrument that could say so — which is the whole reason
     *    a reader must not be told the answer in advance.
     *
     * ⇒ n=2 shipped as a law (rule.require.enumerate-before-you-name). the
     *   third instance broke it, and a reader who trusted the line would have
     *   skipped the one call that named the spender.
     *
     * 🟡 the hunt is NOT withdrawn and the flag is NOT lowered — [t0]'s COUNTER
     *   tooth still holds both. what is withdrawn is the forecast.
     */
    then('🔴 it does not forecast AT REST', () => {
      const b = bare();
      // ANTI-VACUITY: the branch this tooth grades must be present at all
      const at = b.indexOf("is ABOVE this box's own");
      expect(at).toBeGreaterThan(-1);
      expect(b.slice(at, at + 400)).not.toMatch(/expect AT REST/);
    });

    then(
      '🔴 NEITHER verdict is forecast — the ban is on the ACT, not a word',
      () => {
        // .why = the first cure banned one polarity and the other walked in. so
        //   this tooth grades the shape: any `expect <verdict>` in the branch
        //   that nominates a spike is the defect, whichever way it leans.
        const b = bare();
        const at = b.indexOf("is ABOVE this box's own");
        const branch = b.slice(at, at + 400);
        expect(branch).not.toMatch(
          /expect\s+(AT REST|A STORM|a storm|at rest)/i,
        );
      },
    );

    then('COUNTER: the hunt is still named, and still owed', () => {
      // a cure that answered a bad forecast by a withdrawal of the hunt would
      // trade this defect for the miss the surgoal grades dearer.
      const b = bare();
      expect(b).toContain('hunt it: rhx git.grove.saturation.spend');
      expect(b).toContain('run it TWICE — one window ranks no lever');
    });
  });

  when('[t4] the AT REST branch forecasts no hunt, and forbids none', () => {
    /**
     * 🔴 .the THIRD face of one defect — and the costliest, because it FORBIDS
     *
     *    [t0] cured the ABOVE branch's `a real spike`. [t3] cured its
     *    `expect AT REST`. the BELOW branch was never read, and it carries the
     *    same act twice over:
     *      1. a FORECAST — "a hunt would name the structural reaper (tmux …)"
     *      2. a PROHIBITION built on it — "⇒ do NOT hunt the PARENT here"
     *
     *    ⚠️ a forecast merely misleads. a prohibition REMOVES the instrument,
     *    so the reader never learns the forecast was wrong.
     *
     * 🔴 .refuted in prod, 2026-09-19, the hunt run twice against the ban
     *
     *      | cluster         | window 1 reaped | window 2 reaped |
     *      |---|---|---|
     *      | claude          | 90.8%           | 40.4%           |
     *      | tmux: server    | 0.0%            | 0.0%            |
     *
     *    the predicted answer measured ZERO, twice. the hunt named `claude`.
     *    and the gap it closed is the whole point: on that box `eats` (a ps
     *    GAUGE) attributed ~36% of a 261% load, where the hunt (a COUNTER)
     *    attributed 129% — ~93 points of cpu no other instrument can see,
     *    on the tick the branch said not to look.
     *
     * 🔴 .the category error beneath it
     *    the branch reasons on the FORK axis (rate vs baseline) and issues a
     *    ban against an instrument whose subject is the CPU axis. a normal
     *    fork rate says naught about whether cpu is attributable — and the
     *    branch's own next clause concedes "no `eats` row can attribute it",
     *    which is the exact condition that makes the hunt worth a call.
     *
     * 🟡 the AT REST VERDICT is not withdrawn — the comparison is real and the
     *   PROVISION lever is sound. what is withdrawn is the forecast and the ban.
     */
    /**
     * 🟡 bounded by the branch's own `else`, never by a char count. a fixed
     *    window is a magic number that silently under-reads the moment the
     *    prose grows — measured here: a 700-char slice stopped one line short
     *    of `PROVISION`, so the COUNTER tooth went red on a cure that had in
     *    fact kept it.
     */
    const atRest = (): string => {
      const b = bare();
      const at = b.indexOf('is BELOW this');
      expect(at).toBeGreaterThan(-1); // ANTI-VACUITY: the branch must exist
      const shut = b.indexOf('\n    else', at);
      expect(shut).toBeGreaterThan(at); // ANTI-VACUITY: the branch must close
      return b.slice(at, shut);
    };

    then('🔴 it does not FORBID the hunt', () => {
      expect(atRest()).not.toMatch(/do NOT hunt/i);
    });

    then('🔴 it names no cluster the hunt "would" return', () => {
      // the forecast, measured at 0.0% twice. any predicted answer is the act.
      const branch = atRest();
      expect(branch).not.toMatch(/would name/i);
      expect(branch).not.toMatch(/structural reaper/i);
    });

    then(
      'COUNTER: the AT REST verdict and its PROVISION lever both survive',
      () => {
        // a cure that answered a bad forecast by a retraction of the verdict
        // would trade this defect for a false storm on every quiet box.
        const branch = atRest();
        expect(branch).toContain('grove AT REST');
        expect(branch).toMatch(/PROVISION or fewer concurrent crews/);
      },
    );
  });

  when('[t5] the AT REST branch settles naught off one window either', () => {
    /**
     * 🔴 .the FOURTH face, and the first that errs in the STEERING direction
     *
     *    [t0] cured the ABOVE branch's `a real spike`. [t3] cured its
     *    `expect AT REST`. [t4] cured the BELOW branch's forecast and its ban.
     *    not one of the four touched the BELOW branch's own HEADLINE:
     *
     *      `NOT a storm … so this is the grove AT REST on the FORK axis`
     *
     *    a settled verdict, off the exact ~1s sample this whole case exists to
     *    say may settle naught. the twin, off the identical datum, already read
     *    `a CANDIDATE spike, never a settled one`.
     *
     * 🔴 .refuted in prod, 2026-09-19, grove-sandpine-v20260901
     *
     *      | instrument        | window | read    | vs 174.2/s baseline      |
     *      |---|---|---|---|
     *      | the churn gauge   | 1.03s  |  58/s   | BELOW → rendered AT REST |
     *      | the 30s hunt      | 30.1s  | 383/s   | 🔴 2.2× ABOVE            |
     *
     *    a 6.6× gap between two windows on one box, minutes apart.
     *
     * ⚠️ .and this polarity is the costlier one
     *    a false STORM costs a hunt that returns "at rest". a false AT REST
     *    points a supervisor AWAY from the fork axis on a box at 2.2× its own
     *    normal — so the read that would have named the spender never runs.
     *    the defect hides itself, which is why [t0]/[t3] found their twin and
     *    four ticks did not find this one.
     *
     * 🟡 .the [t4] COUNTER still binds, and is re-asserted here
     *    the comparison is real and PROVISION is the sound lever, so both
     *    survive verbatim. what is withdrawn is the SETTLEMENT, never the
     *    verdict — see the counter tooth below, which would go red on an
     *    over-broad cure that flipped a quiet box to a storm.
     */
    /**
     * 🔴 anchored on the branch's GUARD, never on its prose — and the reason is
     *    a defect this very tooth caught on its own first draft.
     *
     *    [t4]'s slicer opens at `is BELOW this`. that phrase sits at the END of
     *    the shipped HEADLINE (`… and NOT a storm: ${fork_rate}/s is BELOW this`),
     *    so every word of the verdict this case bans falls UPSTREAM of the slice.
     *    the `NOT a storm` tooth then read a region that could never hold it and
     *    passed GREEN through a full revert — a clamp that reads as protection
     *    and guards naught (`rule.forbid.failhide`).
     *
     * ⇒ the inner `fork_mean` guard IS the branch, so it is the one anchor that
     *   cannot slide beneath the prose it grades.
     */
    const atRest = (): string => {
      const b = bare();
      const at = b.indexOf('if [[ "$fork_mean" != "-" ]] && awk');
      expect(at).toBeGreaterThan(-1); // ANTI-VACUITY: the branch must exist
      const shut = b.indexOf('\n    else', at);
      expect(shut).toBeGreaterThan(at); // ANTI-VACUITY: the branch must close
      return b.slice(at, shut);
    };

    then(
      '⚠️ the slice is non-empty — the derivation must not go vacuous',
      () => {
        expect(atRest().length).toBeGreaterThan(200);
      },
    );

    then('⚠️ the slice reaches the HEADLINE, never only the body', () => {
      // the anti-vacuity tooth this slicer's own first draft needed. the ban
      // below is aimed at the headline, so a slice that opens beneath it
      // cannot go red whatever the headline says.
      const branch = atRest();
      expect(branch).toContain('a high fork rate');
      expect(branch).toContain('is BELOW this');
    });

    then('🔴 it names the WINDOW it read, as its twin does', () => {
      // the bite. RED as shipped: the branch quoted a rate and never the span
      // it was measured over, so a reader could not tell a 1s gauge from a
      // 30s counter — which is the whole discriminator.
      expect(atRest()).toContain('${rate_window}s window');
    });

    then('🔴 it does not SETTLE the at-rest verdict', () => {
      // the shipped headline, verbatim. `NOT a storm` is a claim about a
      // sustained state, made off one second (`term=false-report`).
      expect(atRest()).not.toMatch(/NOT a storm/);
    });

    then('🔴 it marks the read UNSETTLED, in its own words', () => {
      // the positive half — an absent ban is not the same as a stated bound.
      // without this, a cure that merely deleted `NOT a storm` would pass.
      expect(atRest()).toMatch(/CANDIDATE|NOMINATION/);
      expect(atRest()).toMatch(/never a settled one/);
    });

    then(
      '🔴 the hunt is UNCONDITIONAL — no stall gate re-imposes the ban',
      () => {
        // `⇒ where the box stalls, the hunt is still …` was the residue of the
        // ban [t4] withdrew: it returns the instrument on a stalled box and
        // withholds it on every quiet one, which is the same act at half scope.
        const branch = atRest();
        expect(branch).not.toMatch(/where the box stalls/);
        expect(branch).toContain('git.grove.saturation.spend');
        expect(branch).toMatch(/run it TWICE/);
      },
    );

    then('COUNTER: the verdict and the PROVISION lever still survive', () => {
      // re-asserted at THIS cure's grain. a retraction of the verdict would
      // trade a false at-rest for a false storm on every quiet box.
      const branch = atRest();
      expect(branch).toContain('grove AT REST');
      expect(branch).toMatch(/PROVISION or fewer concurrent crews/);
    });

    then(
      'the DISCRIMINATOR bites the shipped branch and passes the cure',
      () => {
        // graded as a SHAPE, never a word — the trap this file records twice:
        // a tooth that greps one phrase survives the next re-word of it.
        const settles = (s: string): boolean =>
          /NOT a storm/.test(s) || !/\$\{rate_window\}/.test(s);

        const shipped = [
          `echo "   🟡 a high fork rate, and NOT a storm: \${fork_rate}/s is BELOW this"`,
          `echo "   box's own \${fork_mean}/s baseline since boot, so this is the"`,
          `echo "   grove AT REST on the FORK axis."`,
        ].join('\n');
        expect(settles(shipped)).toEqual(true);

        const cured = [
          `echo "   🟡 a high fork rate, and a CANDIDATE at-rest read: \${fork_rate}/s"`,
          `echo "   is BELOW this box's own \${fork_mean}/s baseline since boot —"`,
          `echo "   read over ONE \${rate_window}s window, which ranks no lever on"`,
          `echo "   its own. so \\"grove AT REST on the FORK axis\\" is a NOMINATION"`,
          `echo "   here, never a settled one, and the hunt below is what grades it."`,
        ].join('\n');
        expect(settles(cured)).toEqual(false);
      },
    );
  });

  when('[t2] the discriminator is aimed at the defect and at the fix', () => {
    const settles = (s: string): boolean =>
      /a real spike/.test(s) || !/\$\{rate_window\}/.test(s);

    then('🔴 it BITES the shipped branch, verbatim', () => {
      const shipped = [
        'echo "   ⚠️ and ${fork_rate}/s is ABOVE this box\'s own ${fork_mean}/s baseline"',
        'echo "   since boot — a real spike, so the hunt below is owed."',
      ].join('\n');
      expect(settles(shipped)).toEqual(true);
    });

    then('and it PASSES a branch that carries its own window', () => {
      const cured = [
        'echo "   ⚠️ and ${fork_rate}/s is ABOVE this box\'s own ${fork_mean}/s baseline"',
        'echo "   since boot — read over ONE ${rate_window}s window, which ranks no"',
        'echo "   lever on its own. so this is a CANDIDATE spike, never a settled"',
      ].join('\n');
      expect(settles(cured)).toEqual(false);
    });
  });
});
