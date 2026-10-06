/**
 * .what = clamps on the REMOTE legs — tree.del gates, ssh stdin, cloud boots, host guards, far-shell escapes
 *
 * .note = a PART of the `work.surface` suite, cut so one reviewer can hold
 *         it whole. the suite's shared fixtures, and its account of what it
 *         runs against and why, live in work.surface.harness.ts.
 */
import { join } from 'path';
import { given, then, when } from 'test-fns';

import { getShellLibWhole } from '../../../.test/getShellLibWhole';
import {
  asCode,
  DIR_SKILLS,
  DIR_WORK,
  getLibFiles,
  getSkillFiles,
  read,
  readCode,
  readCodeWhole,
  readPollWhole,
} from './work.surface.harness';

describe('work.surface', () => {
  /**
   * .what = git.tree.del must gate on the WORKTREE, never through a duct
   *
   * .why the tree layer must not depend on the crew layer
   *   the gate was typed into the foreman's pane and its verdict read back by a
   *   60s poll that grepped that pane. that bound the TREE layer to a LIVE
   *   CREW, and it runs backwards: a crew that is DOWN has no foreman duct, so
   *   the gate could not run, so the tree could not be felled — while
   *   git.crew.poll renders exactly that state as "💀 down — clean fell". the
   *   poll RECOMMENDED a fell the verb was structurally unable to perform.
   *
   *   measured 2026-08-25 on rhachet-brains-fireworksai.beav.fix-deepseek-v4-
   *   flash-model-id (pr #15 merged, crew down):
   *     rhx git.crew.fell --tree <it>
   *       -> "✋ foreman duct unreachable — the safety gate did NOT run", exit 2
   *
   * .why a STATIC clamp
   *   the same reason [case6] is static: a live clamp would need a real
   *   worktree, a real merged branch, and a real crew — and the defect lives in
   *   the TRANSPORT choice, which is legible in the source alone.
   */
  given('[case7] git.tree.del gates on the tree, not on a duct', () => {
    const readTreeDel = (): string =>
      readCode(join(DIR_SKILLS, 'git.tree.del.sh'));

    when('[t0] the skill is read', () => {
      then('it exists — the clamp is not vacuous', () => {
        expect(readTreeDel().length).toBeGreaterThan(0);
      });

      then('it NEVER sends its gate into a duct', () => {
        // .why = `duct.send --what 'git tree del ...'` IS the defect. a duct is
        //        a keyboard: it returns no exit code, only wrapped prose, and it
        //        requires a live crew that a fellable tree usually lacks.
        const offenders = readTreeDel()
          .split('\n')
          .filter((line) => /duct\.send\b[^\n]*git\s+tree\s+del/.test(line))
          .map((line) => line.trim());
        expect(offenders).toEqual([]);
      });

      then('it NEVER reads a pane to learn the gate verdict', () => {
        // .why = a pane read is a PROXY for the outcome (term=false-report).
        //        the outcome is the worktree's absence, and that is directly
        //        observable — so no duct.read belongs in this skill at all.
        const offenders = readTreeDel()
          .split('\n')
          .filter((line) => /\bduct\.read\b/.test(line))
          .map((line) => line.trim());
        expect(offenders).toEqual([]);
      });

      then('it adjudicates on the DIR, which is the fact itself', () => {
        // .why = the old success match accepted /status: removed|branch deleted/.
        //        `git tree del` prints "branch deleted" on the arm where it
        //        never found the worktree at all, so that match reported a
        //        clean fell over a tree still fully on disk — the silent
        //        orphan factory. the dir check cannot be fooled that way.
        expect(/-d "\$treedir"/.test(readTreeDel())).toEqual(true);
      });

      then('the detectors have teeth against the real offender lines', () => {
        // proven against the exact lines that shipped
        const sent = `if ! rhx duct.send --on "$foreman" --what 'git tree del --this'; then`;
        expect(/duct\.send\b[^\n]*git\s+tree\s+del/.test(sent)).toEqual(true);

        const polled = 'pane="$(rhx duct.read --on "$foreman" --lines 60)"';
        expect(/\bduct\.read\b/.test(polled)).toEqual(true);

        // ...and must NOT fire on the corrected transport
        const fixed =
          'result="$(cd "$treedir" && git tree del --this 2>&1)" || gate_rc=$?';
        expect(/duct\.send\b[^\n]*git\s+tree\s+del/.test(fixed)).toEqual(false);
        expect(/\bduct\.read\b/.test(fixed)).toEqual(false);
      });
    });

    /**
     * .what = the --grove hop must RE-QUOTE each arg for the remote bash
     *
     * .why  = `ssh host bash -s -- a b c` does NOT deliver a b c as three argv
     *         entries. ssh JOINS its command words with spaces into ONE string
     *         and hands that to the remote shell, which re-parses it. so a
     *         local `"${remote_args[@]}"` protects the args on the way INTO
     *         ssh and not one step further — every space inside an arg becomes
     *         a word boundary on the far side.
     *
     *         ⚠️ the defect was SILENT for every arg that holds no space.
     *         `--name <slug>` and `--tree-only` carry none, so `--grove` ran
     *         its whole life green; the first arg with a space in it was the
     *         first one to break.
     *
     *         measured 2026-09-17, on a fell of svc-reservations with a real --why:
     *           rhx git.tree.del --grove <g> --name <t> --stash \
     *             --why 'the dirt is a + marker + build residue, recoverable'
     *           -> error: unknown arg: +      exit 2, tree NOT felled
     *
     *         🔴 and `--why` is the one arg that is PROSE by contract — the
     *         toll block demands a sentence, and a sentence is spaces. so the
     *         single flag the skill REQUIRES a caller to write was the single
     *         flag the ssh hop could not carry: the escape hatch was
     *         unreachable on every grove tree, which is exactly where a fell
     *         is hardest to finish by hand.
     */
    when('[t1] the --grove hop is read', () => {
      then('it re-quotes every remote arg with %q', () => {
        // .why = the remote IS bash (`bash -s`), so %q is the right dialect —
        //        it emits a form a bash re-parse restores byte for byte.
        expect(/printf -v \w+ '%q '/.test(readTreeDel())).toEqual(true);
      });

      then('it NEVER hands a bare array expansion to ssh', () => {
        // .why = the array expansion is the defect itself. it reads as
        //        careful quotes and survives exactly one hop.
        const offenders = readTreeDel()
          .split('\n')
          .filter((line) =>
            /\bssh\b[^\n]*bash -s[^\n]*\$\{remote_args\[@\]\}/.test(line),
          )
          .map((line) => line.trim());
        expect(offenders).toEqual([]);
      });

      then('the detector has teeth against the real offender line', () => {
        // the exact line that shipped, and broke
        const shipped =
          'ssh "$SSH_ALIAS" bash -s -- "${remote_args[@]}" < "$0" 2>&1';
        expect(
          /\bssh\b[^\n]*bash -s[^\n]*\$\{remote_args\[@\]\}/.test(shipped),
        ).toEqual(true);

        // ...and must NOT fire on the corrected hop
        const fixed = 'ssh "$SSH_ALIAS" "bash -s -- $remote_argv" < "$0" 2>&1';
        expect(
          /\bssh\b[^\n]*bash -s[^\n]*\$\{remote_args\[@\]\}/.test(fixed),
        ).toEqual(false);
      });
    });

    /**
     * .what = the duct teardown must sweep EVERY host the crew sits on
     *
     * .why  = a grove tree does NOT keep its whole crew on the grove.
     *         `git.tree.duct` boots foreman, mechanic, and reflector on the
     *         grove, and `reviewer.give` + `reviewer.take` on the CONTROL
     *         machine, where the review brains and their credentials live.
     *         `rhx duct.list` shows the split on every grove tree in the fleet.
     *
     *         the teardown's role-discovery cured the ROLE axis of this sweep
     *         and left the HOST axis as it was — ONE probe, of ONE box. that is
     *         the same `term=partial-audit` one dimension over: a verdict
     *         complete over a subject set the instrument chose itself, and it
     *         reads identical either way.
     *
     *         measured 2026-09-17, on a fell of
     *         svc-reservations.beav.feat-spot-forecast-widget at
     *         grove-sandpine-v20260901:
     *           ducts stopped: foreman mechanic reflector 🌊   <- the report
     *           duct:///svc-reservations.beav.feat-spot-forecast-widget/reviewer.give
     *           duct:///svc-reservations.beav.feat-spot-forecast-widget/reviewer.take
     *
     *         🔴 and the survivors do not merely linger — they MISREPORT. the
     *         poll read that crew `😶 at work — reviewer.give reviewer.take`, so
     *         it never graded `phantom`, so `--healable`'s no-duct screen never
     *         fired, and the next tick was handed a wedge probe for a tree whose
     *         worktree was gone. one under-swept host reached three tools.
     */
    when('[t2] the duct teardown is read', () => {
      then('it probes the control machine too, never the grove alone', () => {
        // .why = `probe_hosts` is the whole repair: the grove for the seats
        //        booted there, plus localhost for the reviewer pair.
        const src = readTreeDel();
        expect(/probe_hosts=\("\$\{host:-localhost\}"\)/.test(src)).toEqual(
          true,
        );
        expect(
          /\[\[ -n "\$host" \]\] && probe_hosts\+=\("localhost"\)/.test(src),
        ).toEqual(true);
      });

      then(
        'it stops a DISCOVERED uri, never one rebuilt from the primary host',
        () => {
          // .why = a local duct's uri carries an EMPTY host (`duct:///<tree>/<role>`).
          //        to rebuild every uri from `$host` would aim each stop at the
          //        grove — and a reviewer seat is not there to stop.
          const offenders = readTreeDel()
            .split('\n')
            .filter((line) =>
              /duct\.stop --on "duct:\/\/\$\{host:-\}/.test(line),
            )
            .map((line) => line.trim());
          expect(offenders).toEqual([]);
          expect(/duct\.stop --on "\$uri"/.test(readTreeDel())).toEqual(true);
        },
      );

      then('the detector has teeth against the real offender line', () => {
        // the exact line that shipped, and under-swept
        const shipped =
          'rhx duct.stop --on "duct://${host:-}/$name/$role" || true';
        expect(/duct\.stop --on "duct:\/\/\$\{host:-\}/.test(shipped)).toEqual(
          true,
        );

        // ...and must NOT fire on the corrected stop
        const fixed = 'rhx duct.stop --on "$uri" || true';
        expect(/duct\.stop --on "duct:\/\/\$\{host:-\}/.test(fixed)).toEqual(
          false,
        );
      });
    });

    /**
     * .what = the dir-survived ladder is ORDERED, and its last arm is the only
     *         one that destroys bytes
     *
     * .why  = `[t0]` clamps that the skill adjudicates on `-d "$treedir"`. it
     *         says NAUGHT about what happens next — and what happens next is a
     *         three-arm ladder whose last arm runs `git worktree remove
     *         --force` by this skill's own hand:
     *
     *           1. the gate NAMED a reason (untracked, unstaged, unmerged)
     *              -> exit 2, ducts left UP
     *           2. the gate failed with rc != 0 and named NO reason
     *              -> exit 2, ducts left UP
     *           3. the gate returned rc 0 and the dir is STILL here
     *              -> the name-derivation miss. remove it here, and say so
     *
     *         🔴 the ORDER is the whole safety property. hoist arm 3 above arm
     *         1 and a gate that refused for untracked work has its tree removed
     *         anyway — the one outcome the gate exists to prevent, reached by a
     *         reordering that reads as a tidy-up and changes no line's text.
     *
     *         measured 2026-09-20, on a real fell of
     *         sdk-aws-lambda.beav.fix-gen-lambda-sdk-findsert-memo at
     *         grove-sandpine-v20260901 — arm 3 fired in production, correctly:
     *           ├─ ⚠️  gate left the worktree behind — its path derivation missed it
     *           ├─ tree removed ✨ (by this skill, after the gate missed it)
     *
     *         ⚠️ a CORRECT verdict is exactly why this is owed a clamp. the arm
     *         was guarded by no test, so it sits one edit from a silent
     *         regression whose signal is a destroyed worktree rather than a red
     *         suite (surgoal.polish-the-supervisor-and-prioritizer-tools: clamp
     *         the production case, right or wrong).
     */
    when('[t3] the dir-survived ladder is read', () => {
      /**
       * .what = the index of each arm, in source order
       * .why  = the property under test is ORDER, so every assertion below
       *         compares positions rather than presence. a bare presence check
       *         passes on the hoisted form, which is the defect.
       *
       * 🔴 .why the guard and the removal are anchored FROM the derivation arm
       *   both strings occur MORE THAN ONCE in this skill — the `_worktrees`
       *   refusal is also emitted by an earlier, unrelated block, and the
       *   `worktree remove` line repeats in the chmod retry beneath it. a bare
       *   `indexOf` therefore reads the FIRST occurrence, which sits hundreds
       *   of lines above this ladder and compares as "already in order" no
       *   matter what the ladder does.
       *
       *   measured 2026-09-20: the first draft of this clamp used a bare
       *   `indexOf`, and the mutation that moved the guard BELOW the removal
       *   passed it green. a detector that cannot see the defect it was written
       *   for is worse than an absent one — it reads as protection and guards
       *   naught (rule.require.clamp-edge-cases: prove the clamp bites).
       */
      const readArmIndexes = (
        src: string,
      ): {
        refusal: number;
        unknown: number;
        derivation: number;
        guard: number;
        destroy: number;
      } => {
        const derivation = src.indexOf('gate left the worktree behind');
        const from = Math.max(derivation, 0);
        return {
          refusal: src.indexOf('if [[ -n "$reason" ]]; then'),
          unknown: src.indexOf('if [[ "$gate_rc" -ne 0 ]]; then'),
          derivation,
          guard: src.indexOf(
            'refused — path is not inside a _worktrees dir',
            from,
          ),
          destroy: src.indexOf('worktree remove "$treedir" --force', from),
        };
      };

      then('every arm is present — the clamp is not vacuous', () => {
        const at = readArmIndexes(readTreeDel());
        expect(Object.values(at).every((i) => i > 0)).toEqual(true);
      });

      then(
        'a NAMED refusal is read before the derivation arm can remove a tree',
        () => {
          // .why = arm 1 is the gate's own verdict. it must win, always.
          const at = readArmIndexes(readTreeDel());
          expect(at.refusal).toBeLessThan(at.derivation);
          expect(at.refusal).toBeLessThan(at.destroy);
        },
      );

      then(
        'an UNNAMED failure is read before it too — a guess never removes a tree',
        () => {
          // .why = rc != 0 with no reason is an unknown refusal. the skill says
          //        so and stops; it does not fall through to the removal arm.
          const at = readArmIndexes(readTreeDel());
          expect(at.unknown).toBeLessThan(at.derivation);
          expect(at.unknown).toBeLessThan(at.destroy);
        },
      );

      then(
        'both refusal arms leave the ducts UP, so no live work is lost',
        () => {
          const src = readTreeDel();
          expect(src).toContain(
            '🛑 ducts left UP so no live work is lost. fix it, then retry.',
          );
          expect(src).toContain(
            '🛑 ducts left UP so no live work is lost. diagnose, then retry.',
          );
        },
      );

      then(
        'the _worktrees path guard sits BEFORE the destructive command',
        () => {
          // .why = $treedir came from a glob under $HOME/git/*/_worktrees/, so
          //        this re-asserts a fact already true. a guard that costs one
          //        comparison is cheaper than the outcome it prevents — and a
          //        guard placed AFTER the removal prevents naught.
          const at = readArmIndexes(readTreeDel());
          expect(at.guard).toBeLessThan(at.destroy);
        },
      );

      then('the removal ANNOUNCES itself — it is never silent', () => {
        // .why = this skill removing a tree the gate declined to reach is a
        //        fact the operator must read, not infer from an absence.
        const at = readArmIndexes(readTreeDel());
        expect(at.derivation).toBeLessThan(at.destroy);
        expect(readTreeDel()).toContain(
          'tree removed ✨ (by this skill, after the gate missed it)',
        );
      });

      then(
        'the ordering detector has teeth against a hoisted derivation arm',
        () => {
          // the same four lines, with arm 3 lifted above the refusal checks —
          // every string still present, so every presence check stays green
          const hoisted = [
            'echo "gate left the worktree behind"',
            'git worktree remove "$treedir" --force',
            'if [[ -n "$reason" ]]; then',
            'if [[ "$gate_rc" -ne 0 ]]; then',
          ].join('\n');
          const at = readArmIndexes(hoisted);
          expect(at.refusal).toBeGreaterThan(at.destroy);
          expect(at.unknown).toBeGreaterThan(at.destroy);

          // ...and must NOT fire on the shipped order
          const shipped = readArmIndexes(readTreeDel());
          expect(shipped.refusal).toBeLessThan(shipped.destroy);
          expect(shipped.unknown).toBeLessThan(shipped.destroy);
        },
      );

      then(
        'the guard detector has teeth against a guard placed after the removal',
        () => {
          const swapped = [
            'git worktree remove "$treedir" --force',
            'echo "refused — path is not inside a _worktrees dir"',
          ].join('\n');
          const at = readArmIndexes(swapped);
          expect(at.guard).toBeGreaterThan(at.destroy);
        },
      );
    });
  });

  /**
   * [case21] — every non-interactive ssh refuses stdin
   *
   * .why = ssh READS STDIN by default, to forward it to the remote command. so
   *        an ssh called from inside a `while read` loop consumes that loop's
   *        OWN input, and the loop ends one iteration in.
   *
   *        measured 2026-09-02. `__crew_derive_sessions` walks the registered
   *        hosts with `while read -r h; do __crew_derive_sessions "$h"; done`,
   *        and that helper shells out over ssh. six hosts registered; TWO were
   *        visited. the other four were never asked and never failed — so the
   *        `UNREACHED` caveat, the one line whose whole job is to name a
   *        subject the poll could not read, stayed silent about them.
   *
   *        that is a false report twice over: the fleet verdict was untrue,
   *        AND its own honesty clause was muted by the same cut. worse, WHICH
   *        two hosts survived depended on `find` order, so it read as flake.
   *
   *        the fix is one flag. this clamp is aimed at the CLASS rather than
   *        that one call, because `-n` is a property of the SITE and its
   *        safety is a property of the CALLER — so a rule enforced per-caller
   *        is a rule with N readers, and a rule with N readers drifts. the two
   *        interactive attaches (`ssh -t`) are the sole exemption: they hand
   *        the human's terminal over on purpose.
   */
  given('[case21] no ssh in the work surface inherits its caller stdin', () => {
    /**
     * an ssh INVOCATION, told apart from ssh-the-word.
     *
     * .why = these libs discuss ssh constantly — `fix="ssh -v '$HOST'"` is a
     *        hint string, `echo "├─ ssh said"` is a label, and a comment-strip
     *        reaches neither. so the subject is narrowed by SHAPE: an ssh
     *        followed by flags and then a double-quoted variable is a call;
     *        every mention that is not is prose about one.
     */
    const RE_SSH_CALL = /\bssh\s+((?:-\S+\s+)*)"\$/;

    /**
     * the ONE opt-in, and it is deliberate rather than incidental.
     *
     * .why = a channel that PUTS a file has to forward stdin — the bytes are
     *        the payload. so a blanket `-n` is wrong for exactly that shape,
     *        and the clamp needs a way to hear "on purpose" without a fall to
     *        silence over the next site that merely forgot.
     *
     *        a marker read from the SOURCE (never a filename, never a
     *        function name) keeps it explicit: an author writes the line, and
     *        a reviewer sees it in the diff beside the ssh it excuses. an
     *        exemption nobody has to type is an exemption nobody notices.
     */
    const MARK_ON_PURPOSE = '# stdin: forwarded on purpose';

    // .why skills AND libs: the hazard is a property of ssh, never of which
    //      directory a file sits in. the first version scanned only the libs
    //      and would have said nought about git.grove.send.sh.
    const getSshCalls = (): {
      file: string;
      line: string;
      excused: boolean;
    }[] =>
      [...getLibFiles(), ...getSkillFiles()].flatMap((file) => {
        const lines = read(file).split('\n');
        return lines
          .map((line, i) => ({ line, i }))
          .filter(
            ({ line }) =>
              RE_SSH_CALL.test(line) && !line.trim().startsWith('#'),
          )
          .map(({ line, i }) => ({
            file,
            line: line.trim(),
            // the marker sits on the line ABOVE, where a comment belongs
            excused: (lines[i - 1] ?? '').includes(MARK_ON_PURPOSE),
          }));
      });

    when('[t0] every ssh call site is enumerated', () => {
      then('there is at least one — an empty subject set proves nought', () => {
        // .why = the regex is the whole clamp. were it to stop matching (a
        //        rename, a reshape), every assertion below would pass over an
        //        empty set and report green — term=partial-audit, in a clamp.
        expect(getSshCalls().length).toBeGreaterThan(10);
      });

      then(
        'each one refuses stdin, attaches a human, or is marked on purpose',
        () => {
          const offenders = getSshCalls()
            .filter(({ line, excused }) => {
              if (excused) return false;
              return !/\bssh\s+((?:-\S+\s+)*)-[nt]\b/.test(line);
            })
            .map(({ file, line }) => `${file.split('/').pop()}: ${line}`);
          expect(offenders).toEqual([]);
        },
      );

      then('the interactive exemption is narrow — only attach uses -t', () => {
        const interactive = getSshCalls().filter(({ line }) =>
          /\bssh\s+-t\b/.test(line),
        );
        expect(interactive.length).toBeGreaterThan(0);
        interactive.forEach(({ line }) =>
          expect(line.includes('attach')).toEqual(true),
        );
      });

      then('the on-purpose exemption is EARNED, never blanket', () => {
        // .why = an exemption that nobody has to justify becomes the default.
        //        each marked site must sit in a file whose own prose says WHY
        //        its stdin is a payload — the marker is the flag, the prose is
        //        the argument, and a reviewer is owed both.
        const excused = getSshCalls().filter(({ excused: e }) => e);
        expect(excused.length).toBeGreaterThan(0);
        excused.forEach(({ file }) =>
          expect(read(file).includes('NO `-n`')).toEqual(true),
        );
      });
    });

    when('[t1] the host walk is read', () => {
      then('the site the defect was measured at carries the flag', () => {
        expect(
          readCodeWhole(join(DIR_WORK, 'ductwork.sh')).includes(
            'ssh -n -o ConnectTimeout',
          ),
        ).toEqual(true);
      });

      then('the account of WHY survives beside it', () => {
        // .why = the flag alone reads as noise, so the next traveler drops it.
        //        the prose is what makes it removable only on purpose.
        expect(
          getShellLibWhole({ path: join(DIR_WORK, 'ductwork.sh') }).includes(
            "DRAINS the loop's own input",
          ),
        ).toEqual(true);
      });
    });
  });

  /**
   * [case22] — a cloud crew boots ON ITS TREE, and the poll declines to judge it
   *
   * .why = `crew.boot --grove cloud://<g>` resolved the worktree for a LOCAL
   *        crew and skipped that step for a remote one, then fell through to a
   *        `duct.open` with no `--cwd`. so both ducts came up in the ssh login
   *        dir — /home/camper — and a crew nominally on a tree held a shell
   *        that had never seen it. `git branch --show-current` answered about
   *        the wrong repo, silently.
   *
   *        the repair needed a REMOTE root: CREWWORK_GIT_ROOT expands $HOME on
   *        THIS box, so it carried /home/bert to a machine whose user is
   *        `camper` — a local answer to a remote question, which is the same
   *        defect one layer in.
   *
   *        the poll had the mirror of it. `__poll_one_tree` stat'd THIS disk
   *        for every tree and rendered `💥 unknown — no worktree on disk` over
   *        a worktree plainly present on a grove. a verdict is owed the
   *        subject it was measured against, so the honest answer for a tree
   *        this box did not read is "not read", never "absent".
   */
  given(
    '[case22] a cloud crew boots on its tree, and the poll declines to judge it',
    () => {
      const readCrewwork = (): string =>
        readCodeWhole(join(DIR_WORK, 'crewwork.sh'));
      const readCrewPoll = (): string => asCode(readPollWhole());

      when('[t0] the remote tree lookup is read', () => {
        then('it exists at all', () => {
          expect(readCrewwork().includes('__crew_tree_dir_on_grove')).toEqual(
            true,
          );
        });

        then('it asks the GROVE for the root, never this box', () => {
          // .why = the local constant holds an already-expanded /home/bert. the
          //        remote one leaves `~` alone so the grove's shell resolves it.
          expect(readCrewwork().includes('CREWWORK_GIT_ROOT_REMOTE')).toEqual(
            true,
          );
        });

        then('the glob runs under sh, not the login shell', () => {
          // .why = a grove logs in to zsh, which ERRORS on an unmatched glob
          //        rather than leave it literal — so a merely-absent tree looked
          //        like a transport fault. sh leaves it literal and `ls -d`
          //        fails, so absent sounds like absent.
          expect(readCrewwork().includes('sh -c \\"ls -d')).toEqual(true);
        });
      });

      when('[t1] the duct loop of crew.boot is read', () => {
        then('--cwd rides on every duct, local or remote', () => {
          // .why = the branch that dropped it is exactly what put a grove crew
          //        in $HOME. one call, one shape, no host-conditional.
          //
          // ⚠️ this asserts the PROPERTY, never the variable's NAME. it once
          //    pinned `--cwd "$tree_dir"` verbatim and went red the day the arg
          //    became PER-ROLE (`$cwd`, from __crew_role_cwd) — a change that
          //    STRENGTHENED the guarantee, since a local-only reviewer seat
          //    needs this box's mirror rather than the grove's worktree path.
          //    a clamp that fires on a repair teaches its reader to edit clamps.
          const withCwd = readCrewwork()
            .split('\n')
            .filter((line) => line.includes('duct.open --on "$uri"'));
          expect(withCwd.length).toBeGreaterThan(0);
          withCwd.forEach((line) =>
            expect(/--cwd "\$\w+"/.test(line)).toEqual(true),
          );
        });

        then('the cwd is derived PER ROLE, through one seam', () => {
          // .why = the bite the rename carried, now clamped on purpose: a single
          //        shared cwd strands the local-only seat in $HOME, which is the
          //        very defect the unconditional --cwd was added to end.
          const src = readCrewwork();
          expect(
            src.includes('cwd=$(__crew_role_cwd "$tree_dir" "$tree" "$role")'),
          ).toEqual(true);
          expect(src.includes('__crew_role_cwd()')).toEqual(true);
        });
      });

      when('[t2] the tree verdict of the poll is read', () => {
        then('a grove tree gets a declined verdict, not a phantom one', () => {
          expect(readCrewPoll().includes('on grove')).toEqual(true);
          expect(readCrewPoll().includes('not read from here')).toEqual(true);
        });

        then('no verdict claims THE disk when it read only THIS one', () => {
          // .why = the sentence that shipped was "no worktree on disk". it names
          //        every disk while it stat'd one. the repair narrows the claim
          //        to its subject: "on this box".
          expect(readCrewPoll().includes('no worktree on this box')).toEqual(
            true,
          );
        });

        then(
          'the host rides as an ARG, so the verdict word stays a class',
          () => {
            // .why = a verdict that embeds a host can never match a fixed tally
            //        bucket, so it counts zero and the summary renders EMPTY —
            //        which reads as "no trees" rather than "one i declined".
            expect(
              readCrewPoll().includes("__poll_one_tree '$tree' '$tree_host'"),
            ).toEqual(true);
            expect(readCrewPoll().includes('"on grove"')).toEqual(true);
          },
        );
      });

      when('[t3] the drill-in hint is read', () => {
        then(
          'it carries the host, so the address it prints is pasteable',
          () => {
            // .why = a bare `duct:///` names THIS laptop, and printed under a row
            //        that just said the crew is on a grove it contradicts the line
            //        above it. a hint that cannot be pasted is a hint that lies.
            expect(readCrewPoll().includes('duct://${__bhost}/')).toEqual(true);
          },
        );
      });
    },
  );

  /**
   * [case23] — no bare tmux call in duct.send sits above a host guard
   *
   * .why = `--keys` parsed the duct uri, computed `is_remote`, and then asked
   *        LOCAL tmux whatever host the address named. so a grove duct that was
   *        live got:
   *
   *          ✋ duct.send: session '<name>' not found
   *
   *        a term=false-report in its plainest form — the tool did not fail,
   *        and its content was untrue. the tell was that `duct.read` on the
   *        SAME uri answered fine in the same minute: two verbs, one address,
   *        opposite verdicts. only one of them routed by host.
   *
   *        it is the costliest arm to lose. `--keys` IS the approval path —
   *        howto.review-permission-requests answers every stalled modal with
   *        it — so while this was local-only, no supervisor could clear a
   *        modal on a grove clone at all, and the refusal blamed the duct.
   *
   * .why the clamp ENUMERATES rather than pins the repaired line
   *      term=clamp: a clamp's jurisdiction is its ASSERTION, never its prose.
   *      the defect is not "the keys arm" — it is "a tmux call that presumes
   *      the subject is local", and duct.send holds four such calls across two
   *      arms. an assertion matched against the one repaired line would stay
   *      green the day a fifth lands ungated, which is precisely how [case16]
   *      went blind three ticks after it shipped.
   *
   *      so this walks EVERY tmux invocation in the file and demands a host
   *      guard above it. that is the enumeration form: a pinned string can
   *      only ever match what already exists, and a class is by definition
   *      about what does not exist yet.
   */
  given('[case23] every tmux call in duct.send sits below a host guard', () => {
    const readDuctSend = (): string =>
      readCode(join(DIR_SKILLS, 'duct.send.sh'));

    /** every line that INVOKES tmux as a local command, comments excluded */
    const getLocalTmuxLines = (): { line: string; at: number }[] =>
      readDuctSend()
        .split('\n')
        .map((line, at) => ({ line, at }))
        .filter(({ line }) =>
          /(?:^|[;&|]|\s)tmux\s+(?:has-session|send-keys|capture-pane)/.test(
            line,
          ),
        )
        .filter(({ line }) => !line.trim().startsWith('#'))
        // a call inside an ssh payload is already host-routed, by construction
        .filter(({ line }) => !line.includes('ssh -n "$duct_host"'));

    /** every line that TESTS the parsed host, so a remote subject diverts */
    const getHostGuards = (): number[] =>
      readDuctSend()
        .split('\n')
        .map((line, at) => ({ line, at }))
        .filter(
          ({ line }) =>
            line.includes('"$is_remote" -eq 1') && !line.trim().startsWith('#'),
        )
        .map(({ at }) => at);

    when('[t0] the host is parsed', () => {
      then('the parse yields a host, not merely a boolean', () => {
        // .why = the arm that broke had `is_remote` one line above it and read
        //        neither that nor the host. a value derived and discarded is
        //        the cheapest defect there is, and the hardest to see.
        expect(readDuctSend().includes('duct_host="${uri_rest%%/*}"')).toEqual(
          true,
        );
      });

      then('an EMPTY authority still reads as this box', () => {
        // .why = `duct:///<tree>/<role>` is the local form (term=duct). were
        //        the three-slash case to route over ssh, every local send
        //        would take a network hop to reach its own tmux.
        expect(readDuctSend().includes('[[ "$uri_rest" != /* ]]')).toEqual(
          true,
        );
      });
    });

    when('[t1] every tmux invocation is walked', () => {
      then('the subject set is non-empty', () => {
        // .why = a walk over zero lines passes every demand below it. without
        //        this, a rename of the tmux calls would render the whole case
        //        vacuous while it reported green (term=clamp).
        expect(getLocalTmuxLines().length).toBeGreaterThan(0);
      });

      then('a host guard is declared at all', () => {
        expect(getHostGuards().length).toBeGreaterThan(0);
      });

      then('NOT ONE of them runs before a host guard', () => {
        // .why = this is the whole case. the repaired arm passes because its
        //        guard sits above it; the arm as it shipped had no guard
        //        anywhere, so every call here failed this line.
        const guards = getHostGuards();
        const ungated = getLocalTmuxLines().filter(
          ({ at }) => !guards.some((g) => g < at),
        );
        expect(ungated.map(({ line }) => line.trim())).toEqual([]);
      });
    });

    when('[t2] the remote arm is read', () => {
      then('it asks the grove whether the session is up', () => {
        expect(
          readDuctSend().includes('ssh -n "$duct_host" "tmux has-session'),
        ).toEqual(true);
      });

      then('it sends the keys over that same ssh', () => {
        expect(
          readDuctSend().includes('ssh -n "$duct_host" "tmux send-keys'),
        ).toEqual(true);
      });

      then('its refusal names WHICH box it asked, and the fix', () => {
        // .why = rule.require.errors-name-the-fix. the old refusal said only
        //        "not found", so a reader could not tell a dead duct from a
        //        question put to the wrong machine.
        expect(readDuctSend().includes('is absent on')).toEqual(true);
        expect(
          readDuctSend().includes('this asked the GROVE, not this box'),
        ).toEqual(true);
        expect(
          readDuctSend().includes('rhx git.grove.wake $duct_host'),
        ).toEqual(true);
      });
    });

    when('[t3] the success echo is read', () => {
      then('it never doubles the scheme onto a uri it was handed', () => {
        // .why = the echo prefixed `duct://` unconditionally, so a uri input
        //        rendered `duct://duct://<host>/...` and a bare name rendered
        //        `duct://<name>` — which reads as a REMOTE address for a duct
        //        on this box. the echo is the line a caller pastes into the
        //        next command, so a mangled one costs more than it looks.
        expect(readDuctSend().includes('duct://$on_session keys sent')).toEqual(
          false,
        );
        expect(readDuctSend().includes('$duct_shown keys sent')).toEqual(true);
      });

      then('the local form keeps its third slash', () => {
        expect(
          readDuctSend().includes('duct_shown="duct:///$duct_shown"'),
        ).toEqual(true);
      });

      then('🔴 it states the bound — DELIVERED is not CONSUMED', () => {
        // .why = `tmux send-keys` exits 0 the moment the key reaches the pane.
        //        whether the TUI acted on it is unproven, so `keys sent: 1` is
        //        a true claim about the instrument that a reader takes as a
        //        claim about the world (term=false-report, reader-inference).
        //
        // 🔴 measured 2026-09-18: six modals answered in one tick, every send
        //    reported `keys sent: 1`, and TWO left the pane byte-identical with
        //    the same modal drawn. a re-send cleared each. the same class is on
        //    record one surface over — ductwork.verbs.integration.test.ts [case18][t1] holds a
        //    `keys sent: Enter` whose payload never arrived.
        //
        // ⚠️ the cure is the RENDER, never an in-tool retry: a blind retry would
        //    answer whatever modal is drawn NEXT, and these clones raise one the
        //    instant the first clears. an unasked-for approval is worse than an
        //    unverified one.
        expect(readDuctSend()).toContain('delivered, never CONSUMED');
        expect(readDuctSend()).toContain('rule.require.verify-after-send');
      });

      then('🔴 the LIB carries the same bound — two surfaces, one verb', () => {
        // .why = duct.send.sh and ductwork.sh each own a --keys arm, and only
        //        the skill was ever driven by hand. the crew layer reaches the
        //        LIB, so a bound on the skill alone would miss every supervisor
        //        who obeys rule.always.entool-the-layer-you-drop-below — which
        //        is the exact split ductwork.sh's own --keys comment warns of.
        const lib = readCodeWhole(join(DIR_SKILLS, 'work/ductwork.sh'));
        expect(lib).toContain('__duct_keys_are_not_a_receipt');
        expect(lib).toContain('delivered, never CONSUMED');
        // both arms call it — remote and local, or half the callers go unbounded
        expect(lib.match(/__duct_keys_are_not_a_receipt$/gm)?.length).toEqual(
          2,
        );
      });
    });
  });

  /**
   * [case24] — a remote --what payload is quoted for the FAR shell
   *
   * .why = a remote send crosses two shells; a local one crosses none. the
   *        remote arm pasted `$what` RAW inside single quotes:
   *
   *          ssh "$H" "... send-keys -t '$S' '$what' Enter"
   *
   *        so a payload that held a `'` of its own CLOSED that quote, and the
   *        remainder reached the grove unquoted — word-split by the remote
   *        shell into one argv entry per word, then JOINED BY TMUX with no
   *        separator at all:
   *
   *          claude ... 'hi, please drive'   ->   hi,pleasedrive
   *
   *        a clone booted with that prompt reads a word nobody sent it.
   *
   * .why it is not caught by rule.require.verify-after-send
   *      `duct.send` reported `🔧 sent`, and it HAD sent — every byte it was
   *      handed went over faithfully. the corruption sat one layer BELOW its
   *      subject, in a shell string the function itself composes. that rule
   *      names this shape for a payload the CALLER's shell eats before the
   *      tool sees it; here the eater is ours, which makes it ours to
   *      prevent rather than ours to detect.
   *
   * .why the asymmetry is the whole assertion
   *      the two arms must differ, and a clamp that demanded the same shape
   *      of both would be wrong twice over: to escape the LOCAL payload
   *      injects literal backslashes into the keystroke, since that arm
   *      hands tmux an argv entry and argv honors no quotes.
   */
  given(
    '[case24] a remote --what is escaped for the far shell, and a local one is not',
    () => {
      const readDuctwork = (): string =>
        readCodeWhole(join(DIR_WORK, 'ductwork.sh'));

      when('[t0] the remote send arm is read', () => {
        then('it sends an ESCAPED payload, never the raw one', () => {
          // ⚠️ RE-AIMED 2026-09-15, same defect, new shape. the payload is now
          //    sent with `-l` and the Enter is a separate `send-keys` (#91 —
          //    without `-l`, tmux resolves a `--what` that names a key AS that
          //    key). the ESCAPE property this case exists for is untouched: the
          //    remote arm must still carry `$what_q`, never `$what`.
          expect(
            readDuctwork().includes(
              "send-keys -t '$DUCT_SESSION' -l '$what_q'",
            ),
          ).toEqual(true);
          expect(
            readDuctwork().includes("send-keys -t '$DUCT_SESSION' -l '$what'"),
          ).toEqual(false);
        });

        then("the escape is the sh-safe form — ' becomes '\\''", () => {
          // .why = a single-quoted region in sh honors NO other escape, so this
          //        is the one substitution safe for every byte. a `\'` or a
          //        `\\'` would arrive literal and corrupt a different payload.
          expect(
            readDuctwork().includes(`what_q="\${what//\\'/\\'\\\\\\'\\'}"`),
          ).toEqual(true);
        });
      });

      when('[t1] the local send arm is read', () => {
        then('it hands tmux the RAW payload as one argv entry', () => {
          // .why = argv takes no quotes. to escape here would put literal
          //        backslashes into the keystroke — the mirror defect, and one
          //        a reader who only saw the remote fix would be tempted into.
          //
          // ⚠️ RE-AIMED 2026-09-15 for the same `-l` cure as [t0]. the RAW
          //    property is what this assertion measures, and it still holds.
          expect(
            readDuctwork().includes('send-keys -t "$DUCT_SESSION" -l "$what"'),
          ).toEqual(true);
        });

        then('it never reaches for the escaped form', () => {
          expect(readDuctwork().includes('"$what_q"')).toEqual(false);
        });
      });

      /**
       * 🔴 [t2] — `--what` is TEXT, so it must never pass through tmux's key table
       *
       * .why  the verb declares two flags with two senses and handed both to the
       *       same parser: `--keys` is keystrokes ("each space-separated token is
       *       its own key", ductwork's own comment) and `--what` is text.
       *       `send-keys` looks each argument up in its KEY TABLE first, so a
       *       `--what` whose value names a key was delivered as that key and the
       *       text was never typed.
       *
       * .measured 2026-09-15, `duct.send --what 'Up'` on a local pane:
       *
       *         ^[[A    : not found
       *
       *       `^[[A` is ESC [ A — the up-arrow. tmux resolved the word and sent
       *       the escape sequence. `C-c` sits in the same class and is worse: a
       *       TEXT send that interrupts the program that holds the pane.
       *
       * .why  this is a STATIC clamp beside a LIVE one, and both are owed. the
       *       live half is `ductwork.integration [case19]`, which proves the
       *       behavior against real tmux. this half proves the SHAPE in both
       *       arms — and the remote arm has no live clamp at all, since it needs
       *       an ssh host no hermetic test may reach.
       *
       * .why  the ORDER assertion: the literal send must precede the Enter. were
       *       they inverted, the submit would fire into an empty box and the text
       *       would arrive after — which is the exact defect
       *       `git.grove.auth`'s own clamp guards, one file over.
       */
      when('[t2] both arms are read for the key-table bypass', () => {
        then('each arm sends the payload LITERALLY, with -l', () => {
          expect(
            readDuctwork().includes(
              "send-keys -t '$DUCT_SESSION' -l '$what_q'",
            ),
          ).toEqual(true);
          expect(
            readDuctwork().includes('send-keys -t "$DUCT_SESSION" -l "$what"'),
          ).toEqual(true);
        });

        then('NEITHER arm rides the Enter on the payload send', () => {
          // .why = an Enter in the same `send-keys` as a `-l` payload would be
          //        typed as the five characters `Enter`. the two must be separate
          //        calls, and these are the exact fused forms that preceded the
          //        cure.
          expect(readDuctwork().includes("-l '$what_q' Enter")).toEqual(false);
          expect(readDuctwork().includes('-l "$what" Enter')).toEqual(false);
          expect(
            readDuctwork().includes(
              "send-keys -t '$DUCT_SESSION' '$what_q' Enter",
            ),
          ).toEqual(false);
          expect(
            readDuctwork().includes(
              'send-keys -t "$DUCT_SESSION" "$what" Enter',
            ),
          ).toEqual(false);
        });

        then('the Enter is its OWN send, and it carries NO -l', () => {
          expect(
            readDuctwork().includes("send-keys -t '$DUCT_SESSION' Enter"),
          ).toEqual(true);
          expect(
            readDuctwork().includes('send-keys -t "$DUCT_SESSION" Enter'),
          ).toEqual(true);
          expect(readDuctwork().includes("-l 'Enter'")).toEqual(false);
          expect(readDuctwork().includes('-l Enter')).toEqual(false);
        });

        then('the payload send comes BEFORE the Enter, in each arm', () => {
          const held = readDuctwork();
          const iRemoteText = held.indexOf(
            "send-keys -t '$DUCT_SESSION' -l '$what_q'",
          );
          const iRemoteEnter = held.indexOf(
            "send-keys -t '$DUCT_SESSION' Enter",
          );
          const iLocalText = held.indexOf(
            'send-keys -t "$DUCT_SESSION" -l "$what"',
          );
          const iLocalEnter = held.indexOf(
            'send-keys -t "$DUCT_SESSION" Enter',
          );
          expect(iRemoteText).toBeGreaterThan(-1);
          expect(iRemoteEnter).toBeGreaterThan(iRemoteText);
          expect(iLocalText).toBeGreaterThan(-1);
          expect(iLocalEnter).toBeGreaterThan(iLocalText);
        });
      });

      /**
       * .why this stream clamp lives HERE, static, rather than in ductwork's live
       *      suite: the narrow warn fires only for a duct WITH a client attached,
       *      and every `duct.open` in that suite is detached. so the one property
       *      a live run cannot observe is pinned by a read of the code.
       */
      when('[t2] the narrow-pane warn is read', () => {
        then('every line of it rides STDOUT, never stderr', () => {
          // 🔴 not a style call, and it was wrong first.
          //
          // .why = a narrow pane refreshes FINE. the repaint works, the verb
          //   returns 0 — that success is the whole defect. so a caller that
          //   renders stderr only on failure (as `rhx` does) shows the warn on
          //   exactly none of the runs it exists to cover.
          //
          // ⚠️ measured 2026-09-13: written to stderr first, it printed nowhere
          //   through `rhx git.crew.refresh` against a live 45-column crew. the
          //   verb reported success and the condition stayed invisible — the same
          //   false-report shape the warn was written to end.
          //
          // ⇒ an ERROR rides stderr. a CONDITION that rides a success rides
          //   stdout, or it does not ride at all.
          const held = readDuctwork();
          const warn = held.slice(held.indexOf('NARROW at ${pane_w} cols'));
          const body = warn.slice(0, warn.indexOf('\n  fi'));
          expect(body.includes('NARROW at')).toEqual(true);
          expect(body.includes('>&2')).toEqual(false);
        });

        then(
          'the warn is GATED on a client, so a headless duct is left alone',
          () => {
            // with no client, `latest` hands back a default size the next attach
            // replaces — a warn there is an alarm about a width nobody has
            const held = readDuctwork();
            expect(held.indexOf('no client attached')).toBeLessThan(
              held.indexOf('NARROW at'),
            );
          },
        );

        then(
          'the WIDTH itself is read above that gate — a fact, not a warn',
          () => {
            // .why = the pane has a width whether or not anyone watches it, so the
            //        headless report must carry it too. read below the early return,
            //        it was absent from every headless run (measured, in the live
            //        suite's [case12b]).
            const held = readDuctwork();
            expect(held.indexOf('pane_w=$(')).toBeLessThan(
              held.indexOf('no client attached'),
            );
            expect(
              held.includes('headless is normal, pane ${pane_w:-unread} cols'),
            ).toEqual(true);
          },
        );

        then(
          'BOTH terminal lines carry the width — headless AND refreshed',
          () => {
            // 🔴 this clamp exists because its live twin had NO TEETH, and a dogfood
            //    is the only thing that found it.
            //
            //    [case12] and [case12b] both assert a `pane N cols`, and both are
            //    HEADLESS — every `duct.open` in that suite is detached. so both
            //    read the width off the headless line and passed happily with the
            //    width STRIPPED from the `refreshed` line. measured 2026-09-13: the
            //    fix was reverted and all nine stayed green.
            //
            // ⚠️ the with-client line is the one the fleet actually renders — the
            //   measured 45-column crews all had a client attached. so the path that
            //   matters most was the one no clamp could reach.
            //
            // ⇒ a clamp you have not watched FAIL is a guess
            //   (rule.require.clamp-edge-cases).
            const held = readDuctwork();
            expect(
              held.includes(
                'refreshed ($count client(s), pane ${pane_w:-unread} cols)',
              ),
            ).toEqual(true);
          },
        );

        then('the cure it names is at the TERMINAL, never at tmux', () => {
          // 🔴 a tmux-side force would set `window-size manual` — the very strand
          //    duct.refresh exists to undo. a remedy that mimics the defect
          //    (rule.forbid.remedies-that-mimic-the-defect).
          const held = readDuctwork();
          const warn = held.slice(held.indexOf('NARROW at ${pane_w} cols'));
          const body = warn.slice(0, warn.indexOf('\n  fi'));
          expect(body.includes('git.crew.show')).toEqual(true);
          expect(body.includes('resize-window')).toEqual(false);

          // ⚠️ and it must NOT prescribe a hide: `crew.hide` on a live tree
          //   answered `term.stop: terminal is alive but its window would not
          //   close`. a hint that routes the reader into a wall is worse than
          //   none — they conclude the cure does not work. measured 2026-09-13,
          //   and the attach alone took the same crew 45 -> 93.
          expect(body.includes('crew.hide')).toEqual(false);
        });
      });
    },
  );
});
