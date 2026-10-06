/**
 * .what = clamps on the crew VERBS — boot, stop, show, hide, open — local and cloud
 *
 * .note = a PART of the `crewwork` suite, cut so one reviewer can hold
 *         it whole. the suite's shared fixtures, and its account of what it
 *         runs against and why, live in crewwork.harness.ts.
 */
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { given, then, useBeforeAll, when } from 'test-fns';

import { tempDirs } from '../../../.test/tempDirs';
import {
  genGitRoot,
  idxOf,
  ROLES_DEFAULT,
  ROLES_LOCAL,
  ROLES_LOCAL_BOOTED,
  ROLES_TREEBOUND,
  roleOfTermOpen,
  TREE,
  TREE_TMUX,
} from './crewwork.harness';
import { runCrew } from './work.harness';

// .why = each case makes a fake git root, and each runCrew makes a driver dir.
//        with no sweep, one run leaves ~30 dirs in the shared /tmp and the
//        hundredth leaves 3000. hermetic per-run is not hermetic over time.
afterAll(() => tempDirs.delAll());

describe('crewwork', () => {
  given('[case1] a tree with a real worktree on disk', () => {
    const scene = useBeforeAll(async () => {
      const gitRoot = genGitRoot({ trees: [TREE] });
      return { gitRoot, dir: join(gitRoot, 'someorg', '_worktrees', TREE) };
    });

    when('[t0] crew.boot runs', () => {
      const result = useBeforeAll(async () =>
        runCrew({
          command: `crew.boot --tree ${TREE}`,
          gitRoot: scene.gitRoot,
        }),
      );

      then('it succeeds', () => {
        expect(result.exit).toEqual(0);
      });

      then('it opens NO tabs — boot is the WORK axis, and only that', () => {
        // .why = boot used to open the tabs too, which made it and crew.open
        //        produce the same end state — two words for one behavior, the
        //        overload rule.forbid.domain-term-synonyms forbids. it also
        //        made the 2x2 in term=crew._.choice._.md untrue of its own
        //        code: the table said boot=work while the code did work+view.
        //
        // .note = this clamp is NOT vacuous. run it against the pre-split boot
        //         and it goes red on 2 term.open calls — verified by revert.
        expect(result.calls.filter((c) => c.startsWith('term.open'))).toEqual(
          [],
        );
      });

      then(
        'every TREE-BOUND duct.open carries --cwd, pointed INSIDE the worktree',
        () => {
          // .why = the 2026-08-09 defect. --cwd was documented as REQUIRED by the
          //        skill while the function rejected it as an unknown arg.
          //
          // ⚠️ a LOCAL-ONLY seat is excluded by name, never by a loosened claim.
          //    its duct opens in this box's mirror dir, so it is not tree-bound —
          //    to widen the assertion to "carries some --cwd" would keep the test
          //    green and blind it to the defect it was written for.
          const opens = result.calls.filter((c) => c.startsWith('duct.open'));
          expect(opens).toHaveLength(ROLES_DEFAULT.length);
          const boundToTree = opens.filter(
            (c) => !ROLES_LOCAL.some((role) => c.includes(`/${TREE}/${role} `)),
          );
          expect(boundToTree).toHaveLength(ROLES_TREEBOUND.length);
          for (const call of boundToTree) {
            expect(call).toContain(`--cwd ${scene.dir}`);
          }
        },
      );

      then('🔴 every LOCAL-ONLY seat opens HERE, never on the tree dir', () => {
        // the reviewer's whole purpose: a saturated grove cannot stall the
        // human's read (define.usecase.review-a-grove-tree-locally). a duct
        // cwd'd into the grove's worktree path would defeat it, and on a cloud
        // tree that path does not exist on this box at all.
        const opens = result.calls.filter((c) => c.startsWith('duct.open'));
        expect(ROLES_LOCAL_BOOTED.length).toBeGreaterThan(0);
        for (const role of ROLES_LOCAL_BOOTED) {
          const local = opens.find((c) => c.includes(`/${TREE}/${role} `));
          expect(local).toBeDefined();
          expect(local).toContain('duct:///'); // empty authority = this box
          expect(local).not.toContain(`--cwd ${scene.dir}`);
        }
      });

      then('it opens one duct per role, in the roster order', () => {
        // .why the NAMES and not only a count: a seat added to the roster and
        //      missed by one arm of the skill would still open N ducts if some
        //      other role were opened twice. the order matters too — the first
        //      role is the one the window's base tab and the focus both take.
        const opens = result.calls.filter((c) => c.startsWith('duct.open'));
        expect(opens).toHaveLength(ROLES_DEFAULT.length);
        ROLES_DEFAULT.forEach((role, i) => {
          expect(opens[i]).toContain(`/${TREE}/${role}`);
        });
      });

      then('a LOCAL duct uri carries an EMPTY authority', () => {
        // duct:///<tree>/<role> — three slashes, like file:///
        expect(result.calls[0]).toContain(`duct:///${TREE}/mechanic`);
      });

      then('it does NOT resume — a resume types into a live duct', () => {
        expect(result.calls.filter((c) => c.startsWith('duct.send'))).toEqual(
          [],
        );
      });
    });

    when('[t1] crew.boot runs with --roles in a custom order', () => {
      const result = useBeforeAll(async () =>
        runCrew({
          command: `crew.boot --tree ${TREE} --roles foreman,mechanic,prober`,
          gitRoot: scene.gitRoot,
        }),
      );

      then('it honors both the set and the order', () => {
        const opens = result.calls.filter((c) => c.startsWith('duct.open'));
        expect(opens).toHaveLength(3);
        expect(opens[0]).toContain(`/${TREE}/foreman`);
        expect(opens[2]).toContain(`/${TREE}/prober`);
      });
    });

    when('[t2] crew.boot runs with --resume mechanic', () => {
      const result = useBeforeAll(async () =>
        runCrew({
          command: `crew.boot --tree ${TREE} --resume mechanic`,
          gitRoot: scene.gitRoot,
        }),
      );

      // .why `--resume $role` and NOT `--continue`: `--continue` is cwd-RECENCY,
      //      and a tree's mechanic and foreman share ONE worktree — so they
      //      share one claude project dir, and the foreman's `--continue` can
      //      hand back the MECHANIC's conversation. neither pane says so, and
      //      the operator reads the wrong transcript as the right one
      //      (term=false-report).
      //
      //      `--resume <name>` is deterministic instead: git.tree.behavior
      //      launches each clone with `--name $role`, so the role IS the handle.
      then('it sends exactly one resume, to that role only', () => {
        const sends = result.calls.filter((c) => c.startsWith('duct.send'));
        expect(sends).toHaveLength(1);
        expect(sends[0]).toContain(`duct:///${TREE}/mechanic`);
        expect(sends[0]).toContain('--resume mechanic');
      });

      // .why = a resumed clone must come back ADDRESSABLE, not merely alive. a
      //        bare `claude` restores the transcript and registers no clone, so
      //        `rhx clone get @:mechanic` has no address to look up — the only
      //        window left is a pane scrape, which is bounded by scrollback,
      //        renders chrome rather than content, and dies with the duct.
      //
      // .the teeth = this goes RED on a revert to the bare launch. the prior
      //        clamp asserted `claude --resume mechanic`, which reads GREEN on
      //        BOTH forms, so it could never have caught an absent enrollment.
      then(
        'the resume ENROLLS the clone, so it is addressable after the fact',
        () => {
          const sends = result.calls.filter((c) => c.startsWith('duct.send'));
          expect(sends[0]).toContain('rhx enroll claude');
          expect(sends[0]).toContain('--as @:mechanic');
        },
      );

      // .why = a permission mode is a LAUNCH flag, never a property of the
      //        conversation, so a resume restores the transcript and NOT the
      //        mode. git.tree.behavior boots with acceptEdits; a resume that
      //        drops it hands back a clone that stalls on its own writes.
      then('the resume carries the SAME permission mode the boot used', () => {
        const sends = result.calls.filter((c) => c.startsWith('duct.send'));
        expect(sends[0]).toContain('--permission-mode acceptEdits');
      });

      // .why against duct.open and NOT `calls.length - 1`: the resume is
      //      followed by the picker reads, so "last call" is no longer the
      //      claim this clamp was ever about. what it guards is the ORDER —
      //      no duct may still be down when a resume types into one.
      then('the resume comes after EVERY duct is up', () => {
        const idxResume = result.calls.findIndex((c) =>
          c.startsWith('duct.send'),
        );
        const idxOpenLast = result.calls.reduce(
          (acc, c, i) => (c.startsWith('duct.open') ? i : acc),
          -1,
        );
        expect(idxOpenLast).toBeGreaterThan(-1);
        expect(idxResume).toBeGreaterThan(idxOpenLast);
      });
    });

    // .why three clamps and not one: `claude --resume <name>` does not resume.
    //      it draws a SESSION PICKER and waits on an Enter — observed on four
    //      real ducts, 2026-09-02 — but only sometimes, and the cause of the
    //      sometimes is unestablished. so the arm reads the pane, and its three
    //      verdicts must each be provable on their own:
    //        picker drew        -> an Enter is owed
    //        no picker          -> an Enter is a STRAY KEYSTROKE. send none
    //        could not look     -> say UNKNOWN. never report a clone's state
    //      the middle one is the costly arm: a stray Enter lands in an empty
    //      input box, and the next poll reports `✍️ PREFILLED` — a human-typed
    //      signal the tool manufactured itself (rule.require.babysit-cron-per-
    //      dispatch-fleet, and term=volunteered-diagnosis).
    when('[t4] the resume draws a session picker', () => {
      const result = useBeforeAll(async () =>
        runCrew({
          command: `crew.boot --tree ${TREE} --resume mechanic`,
          gitRoot: scene.gitRoot,
          paneText: [
            'Resume Session',
            '│ ⌕ mechanic  │',
            '  current worktree',
            '❯ mechanic',
          ].join('\n'),
        }),
      );

      then('it sends an Enter, to select the matched row', () => {
        const sends = result.calls.filter((c) => c.startsWith('duct.send'));
        expect(sends).toHaveLength(2);
        expect(sends[1]).toContain('--keys Enter');
        expect(sends[1]).toContain(`duct:///${TREE}/mechanic`);
      });

      then(
        'the Enter rides --anyway, since a picker holds the keyboard',
        () => {
          const sends = result.calls.filter((c) => c.startsWith('duct.send'));
          expect(sends[1]).toContain('--anyway');
        },
      );

      then('it reads the pane BEFORE it sends the Enter', () => {
        const idxRead = result.calls.findIndex((c) =>
          c.startsWith('duct.read'),
        );
        const idxEnter = result.calls.findIndex((c) =>
          c.includes('--keys Enter'),
        );
        expect(idxRead).toBeGreaterThan(-1);
        expect(idxEnter).toBeGreaterThan(idxRead);
      });
    });

    when('[t5] the resume draws NO picker', () => {
      const result = useBeforeAll(async () =>
        runCrew({
          command: `crew.boot --tree ${TREE} --resume mechanic`,
          gitRoot: scene.gitRoot,
          paneText: '❯ \n  a live clone, box empty',
        }),
      );

      then('it sends NO Enter — a stray key would read as human-typed', () => {
        const sends = result.calls.filter((c) => c.startsWith('duct.send'));
        expect(sends).toHaveLength(1);
        expect(result.stdout).not.toContain('--keys Enter');
      });

      then('it reports the MEASUREMENT, never a claim about the clone', () => {
        expect(result.stdout).toContain("no 'Resume Session' seen");
        expect(result.stdout).not.toContain('resumed direct');
      });
    });

    when('[t6] the pane cannot be read at all', () => {
      const result = useBeforeAll(async () =>
        runCrew({
          command: `crew.boot --tree ${TREE} --resume mechanic`,
          gitRoot: scene.gitRoot,
          rcs: { ductRead: 1 },
        }),
      );

      then('it sends NO Enter — it never learned whether a picker drew', () => {
        const sends = result.calls.filter((c) => c.startsWith('duct.send'));
        expect(sends).toHaveLength(1);
      });

      // .why = a swallowed read error would make "no picker drew" and "i could
      //        not look" one verdict, and the caller would be told the clone
      //        came up while it sat parked at a picker (rule.forbid.failhide).
      then('it says UNKNOWN, and never borrows the no-picker verdict', () => {
        expect(result.stdout).toContain('resume state UNKNOWN');
        expect(result.stdout).not.toContain("no 'Resume Session' seen");
      });

      then('it names the fix, rather than the symptom alone', () => {
        expect(result.stdout).toContain('rhx duct.read --on');
      });

      then(
        'the crew still comes up — an unread pane is not a boot failure',
        () => {
          expect(result.exit).toEqual(0);
        },
      );
    });

    when('[t3] a duct fails to open', () => {
      const result = useBeforeAll(async () =>
        runCrew({
          command: `crew.boot --tree ${TREE}`,
          gitRoot: scene.gitRoot,
          rcs: { ductOpen: 1 },
        }),
      );

      then('it reports a malfunction', () => {
        expect(result.exit).toEqual(1);
      });

      then('it halts rather than resumes into a duct that never opened', () => {
        // .note = the old clamp here read "it opens NO tabs". boot opens no
        //         tabs on ANY path now, so that assertion passed whether or
        //         not the halt worked — vacuous. the live version of it moved
        //         to [case9], where crew.open does open tabs and the claim
        //         can go red.
        expect(result.calls.filter((c) => c.startsWith('duct.send'))).toEqual(
          [],
        );
      });
    });
  });

  given('[case2] a tree with NO worktree on disk', () => {
    const scene = useBeforeAll(async () => ({
      gitRoot: genGitRoot({ trees: [] }),
    }));

    when('[t0] crew.boot runs', () => {
      const result = useBeforeAll(async () =>
        runCrew({
          command: `crew.boot --tree ${TREE}`,
          gitRoot: scene.gitRoot,
        }),
      );

      then('it reports a constraint', () => {
        expect(result.exit).toEqual(2);
      });

      then('it opens naught — not one duct, not one tab', () => {
        // .why = a duct with no --cwd starts in the CALLER's directory. to
        //        fail-fast is the only way to guarantee that never happens.
        expect(result.calls).toEqual([]);
      });

      then('the error names the fix', () => {
        expect(result.stderr).toContain('git.tree.behavior');
      });
    });
  });

  /**
   * ⚠️ [t0]'s third assertion used to read:
   *
   *      then('it passes no --cwd, since it could not stat the dir')
   *
   *    which clamped the DEFECT shut rather than the guarantee. it was true of
   *    what the code did and false of what a crew is: the cloud arm skipped the
   *    tree lookup, fell through to a bare `duct.open`, and both ducts came up
   *    in the ssh login dir — /home/camper — so a crew nominally on a tree held
   *    a shell that had never seen it, and `git branch --show-current` answered
   *    about the wrong repo. the clamp reported green throughout.
   *
   *    the premise was sound (THIS box cannot stat a grove's dir) and the
   *    conclusion was not (so ask the box that can, rather than skip the
   *    question). a clamp inherits its author's conclusion, so it went green on
   *    the wrong half of that sentence for as long as the code did.
   */
  given('[case3] a cloud grove', () => {
    const GROVE_TREE_DIR = `/home/camper/git/somerepo/_worktrees/${TREE}`;

    when('[t0] crew.boot runs against a grove that HOLDS the tree', () => {
      const result = useBeforeAll(async () =>
        runCrew({
          command: `crew.boot --tree ${TREE} --grove cloud://grove-1`,
          groveTreeDir: GROVE_TREE_DIR,
        }),
      );

      then('it succeeds without any worktree on THIS box', () => {
        // .why = the tree lives on the grove. that this box holds no copy is
        //        the normal case for a cloud crew, never a fault.
        expect(result.exit).toEqual(0);
      });

      then('it asked the GROVE for the dir, with the host and the slug', () => {
        expect(result.calls).toContain(
          `__crew_tree_dir_on_grove grove-1 ${TREE}`,
        );
      });

      then('the duct uri carries the grove as its authority', () => {
        expect(result.calls.join('\n')).toContain(
          `duct://grove-1/${TREE}/mechanic`,
        );
      });

      then(
        '--cwd rides on every GROVE seat, and it is the dir the GROVE named',
        () => {
          // .why = the one arg that keeps a pane on its tree. absent it, a duct
          //        opens whereever ssh logs in, and every later read — the
          //        branch, the route, the diff — answers about another repo.
          //
          // ⚠️ the local-only seat is excluded by NAME. its duct never crosses to
          //    the grove, so the grove's dir is not its cwd — and on this box that
          //    path does not exist, so to demand it would demand a broken cwd.
          const opens = result.calls
            .filter((c) => c.startsWith('duct.open'))
            .filter(
              (c) =>
                !ROLES_LOCAL.some((role) => c.includes(`/${TREE}/${role} `)),
            );
          expect(opens).toHaveLength(ROLES_TREEBOUND.length);
          opens.forEach((c) => expect(c).toContain(`--cwd ${GROVE_TREE_DIR}`));
        },
      );

      then(
        '🔴 every LOCAL-ONLY seat stays HOME while its crew goes to the grove',
        () => {
          // this is the whole point of the seat, stated as one assertion: the
          // crew's work axis is on grove-1, and the reviewer's duct is not.
          const opens = result.calls.filter((c) => c.startsWith('duct.open'));
          expect(ROLES_LOCAL_BOOTED.length).toBeGreaterThan(0);
          for (const role of ROLES_LOCAL_BOOTED) {
            const local = opens.find((c) => c.includes(`/${TREE}/${role} `));
            expect(local).toBeDefined();
            expect(local).toContain(`duct:///${TREE}/${role}`); // empty authority
            expect(local).not.toContain('grove-1');
            expect(local).not.toContain(GROVE_TREE_DIR);
          }
        },
      );
    });

    when('[t1] the grove holds no such tree, or is unreachable', () => {
      const result = useBeforeAll(async () =>
        runCrew({
          command: `crew.boot --tree ${TREE} --grove cloud://grove-1`,
        }),
      );

      then('it reports a constraint', () => {
        // .why = the mirror of [case2]. a tree whose dir we cannot learn is a
        //        tree we cannot pass as --cwd, and a duct with no --cwd is the
        //        defect above. so the only safe answer left is to refuse.
        expect(result.exit).toEqual(2);
      });

      then('it opens naught — not one duct, not one tab', () => {
        expect(
          result.calls.filter((c) => !c.startsWith('__crew_tree_dir_on_grove')),
        ).toEqual([]);
      });

      then('the error names the grove, and how to check it is awake', () => {
        expect(result.stderr).toContain('grove-1');
        expect(result.stderr).toContain('git.grove.wake');
      });

      then(
        'the error names the REMOTE root, never the one this box holds',
        () => {
          // .why = the path it printed was $CREWWORK_GIT_ROOT — this laptop's
          //        already-expanded $HOME — for a search that ran under the
          //        grove's own `~`. a directory nobody looked in, named in the
          //        voice of the one we did, which sends a reader to the wrong
          //        machine to go check.
          expect(result.stderr).not.toContain('/home/bert');
          expect(result.stderr).toContain('~/git');
        },
      );
    });

    when('[t2] --grove gets a value that is neither shape', () => {
      const result = useBeforeAll(async () =>
        runCrew({ command: `crew.boot --tree ${TREE} --grove gopher://x` }),
      );

      then('it reports a constraint and touches naught', () => {
        expect(result.exit).toEqual(2);
        expect(result.calls).toEqual([]);
      });
    });

    /**
     * 🔴 .measured 2026-09-07, and it cost a boot + a fell.
     *
     *    the forest holds a WORK grove and a LAB grove, and the lab is tagged
     *    `deletable` in ec2 — thrown away on a schedule. a supervisor found the
     *    work grove 🔴 on saturation, took the saturation rule's own rung 3
     *    (`sprout onto a different grove`), and sprouted onto the lab. every
     *    instrument agreed it was reachable, idle, and 🟢 on both axes. NOT ONE
     *    of them said `do not boot here`.
     *
     *    ⇒ the constraint was real and deterministic and lived in a human's
     *      head. these two clamps are what moved it into the tool.
     */
    when('[t3] the grove is a LAB — tagged deletable, and thrown away', () => {
      const result = useBeforeAll(async () =>
        runCrew({
          command: `crew.boot --tree ${TREE} --grove cloud://grove-1`,
          groveTreeDir: GROVE_TREE_DIR,
          grovePurpose: 'lab',
        }),
      );

      then('it reports a constraint', () => {
        expect(result.exit).toEqual(2);
      });

      then('it opens naught — the refusal lands BEFORE any duct', () => {
        // .why = the whole value is that it costs a fell to undo. a gate that
        //        fires after the first duct has already saved nobody.
        expect(result.calls).toEqual([]);
      });

      then('the error names the grove, its purpose, and the fix', () => {
        expect(result.stderr).toContain('grove-1');
        expect(result.stderr).toContain('lab');
        expect(result.stderr).toContain('deletable');
        expect(result.stderr).toContain('.grove/purpose');
      });
    });

    when('[t4] the grove declares no purpose at all', () => {
      const result = useBeforeAll(async () =>
        runCrew({
          command: `crew.boot --tree ${TREE} --grove cloud://grove-1`,
          groveTreeDir: GROVE_TREE_DIR,
          grovePurpose: 'unknown',
        }),
      );

      then('it fails CLOSED, never open', () => {
        // .why = the grove slug is reminted on every rebuild, so an allowlist
        //        goes stale silently. it must go stale toward a REFUSAL — an
        //        unknown grove that boots is the exact defect this gate exists
        //        to close, one rebuild later.
        expect(result.exit).toEqual(2);
        expect(result.calls).toEqual([]);
      });

      then('the error says WHY it could not tell', () => {
        expect(result.stderr).toContain('no ~/.grove/purpose marker');
      });

      // 🔴 a published package names no org's grove as bootable. with no
      //    list declared, the refusal says so and names the env to set
      then(
        'the bootable list is undeclared by default, and names how to set it',
        () => {
          expect(result.stderr).toContain(
            'bootable today: (none declared — export CREWWORK_GROVES_BOOTABLE=',
          );
          expect(result.stderr).not.toContain('grove-sandpine');
        },
      );
    });
  });

  given('[case4] a crew whose ducts are already up', () => {
    when('[t0] crew.show runs', () => {
      const result = useBeforeAll(async () =>
        runCrew({
          command: `crew.show --tree ${TREE}`,
          sessions: [`${TREE}/mechanic`, `${TREE}/foreman`],
        }),
      );

      then('it succeeds', () => {
        expect(result.exit).toEqual(0);
      });

      then('it NEVER touches a duct — the view is the free half', () => {
        // .why = show/hide are the reversible axis. a show that opened or
        //        stopped a duct would cross the axes, which is the exact
        //        confusion the four verbs exist to prevent.
        expect(result.calls.filter((c) => c.startsWith('duct.'))).toEqual([]);
      });

      then('it opens one tab per role', () => {
        // .why DISTINCT roles rather than a raw call count: crew.show makes ONE
        //      EXTRA term.open on purpose, to pull focus back to the first
        //      role — kitty leaves focus wherever the last open landed, which
        //      on a standard crew is the LAST seat rather than the worker. that
        //      call is a focus, not a tab, so a count assertion reads it as a
        //      duplicate tab and fails on a feature.
        const opens = result.calls.filter((c) => c.startsWith('term.open'));
        const roles = new Set(opens.map(roleOfTermOpen));
        expect([...roles].sort()).toEqual([...ROLES_DEFAULT].sort());
      });

      then('the LAST call pulls focus back to the first role', () => {
        const opens = result.calls.filter((c) => c.startsWith('term.open'));
        expect(opens[opens.length - 1]).toContain('--for mechanic');
      });

      then('every tab is addressed by the TMUX name form', () => {
        // .teeth = the focus re-call was left on the raw dotted `$tree` when
        //          the loop above was converted, so it addressed a session
        //          tmux does not carry and the focus silently never landed —
        //          swallowed, because the focus call discards its own stderr.
        const opens = result.calls.filter((c) => c.startsWith('term.open'));
        expect(opens.every((c) => c.includes(TREE_TMUX))).toEqual(true);
        expect(opens.some((c) => c.includes(`--on ${TREE} `))).toEqual(false);
      });
    });

    when('[t1] crew.hide runs', () => {
      const result = useBeforeAll(async () =>
        runCrew({ command: `crew.hide --tree ${TREE}` }),
      );

      then('it succeeds', () => {
        expect(result.exit).toEqual(0);
      });

      then(
        'it NEVER touches a duct — every clone keeps its conversation',
        () => {
          expect(result.calls.filter((c) => c.startsWith('duct.'))).toEqual([]);
        },
      );

      then('it closes the window once, not once per role', () => {
        expect(
          result.calls.filter((c) => c.startsWith('term.stop')),
        ).toHaveLength(1);
      });

      then('it says the ducts are untouched', () => {
        expect(result.stdout).toContain('still at work');
      });
    });

    when(
      '[t3] the LEDGER says this crew sits on a grove, and no --grove is given',
      () => {
        // .why = the whole clamp. every crew verb defaulted `--grove` to `local`,
        //        so an omitted flag asked THIS box about a crew that lives on a
        //        grove — and got a truthful `no ducts` about the wrong machine.
        //
        //  .teeth = measured 2026-09-03. `crew.show --tree <a grove tree>` refused
        //           with `💥 no ducts on this box` over a crew at work on
        //           grove-sandpine-v20260901 with BOTH tabs already open. revert the
        //           derivation and this case goes red: FAKE_SESSIONS is served for
        //           whatever host is asked, so the exit stays 0 — what fails is the
        //           HOST assertion, which is the half the defect actually broke.
        const result = useBeforeAll(async () =>
          runCrew({
            command: `crew.show --tree ${TREE}`,
            ledger: [{ tree: TREE, grove: 'cloud://grove-1' }],
            sessions: [`${TREE}/mechanic`, `${TREE}/foreman`],
          }),
        );

        then('it succeeds', () => {
          expect(result.exit).toEqual(0);
        });

        then('it asks the GROVE for the ducts, never this box', () => {
          const asks = result.calls.filter((c) =>
            c.startsWith('__duct_list_host_sessions'),
          );
          expect(asks.length).toBeGreaterThan(0);
          expect(asks.every((c) => c.includes('grove-1'))).toEqual(true);
          expect(asks.some((c) => c.includes('localhost'))).toEqual(false);
        });

        then('every tab is addressed on the grove, never bare', () => {
          const opens = result.calls.filter((c) => c.startsWith('term.open'));
          expect(opens.length).toBeGreaterThan(0);
          expect(
            opens.every((c) => c.includes(`grove-1:${TREE_TMUX}`)),
          ).toEqual(true);
        });

        then('it NAMES the box it chose, and that the ledger chose it', () => {
          // .why = a view opened on a box the caller never named must say which.
          //        silent derivation trades one partial audit for another — the
          //        reader still cannot tell which machine the verdict describes.
          expect(result.stdout).toContain('cloud://grove-1');
          expect(result.stdout).toContain('per the ledger');
        });
      },
    );

    when('[t4] NO ledger row names the tree', () => {
      // .why = the fallback arm. `local` must remain reachable for a tree the
      //        ledger has never seen, or the derivation trades a wrong default
      //        for a broken one.
      const result = useBeforeAll(async () =>
        runCrew({
          command: `crew.show --tree ${TREE}`,
          sessions: [`${TREE}/mechanic`, `${TREE}/foreman`],
        }),
      );

      then('it falls back to local and succeeds', () => {
        expect(result.exit).toEqual(0);
      });

      then('it claims NO ledger derivation — there was none to claim', () => {
        expect(result.stdout).not.toContain('per the ledger');
      });

      then('every tab is addressed bare, with no host prefix', () => {
        // ⚠️ this reads the --on VALUE, never the whole call. it used to scan
        //    the call for any ':' at all, which was a proxy that held only
        //    while no flag could carry a colon of its own. a local-only seat
        //    passes `--duct local:<slug>/<role>` — a colon that is the CURE for
        //    an inherited host, not a symptom of one — so the proxy would read
        //    the fix as the defect. assert the field the claim is about.
        const opens = result.calls.filter((c) => c.startsWith('term.open'));
        expect(opens.length).toBeGreaterThan(0);
        const ons = opens.map((c) => c.match(/--on (\S+)/)?.[1]);
        expect(ons.every((on) => on !== undefined)).toEqual(true);
        expect(ons.some((on) => on!.includes(':'))).toEqual(false);
      });
    });

    when('[t2] crew.hide runs and term.stop FAILS', () => {
      const result = useBeforeAll(async () =>
        runCrew({ command: `crew.hide --tree ${TREE}`, rcs: { termStop: 1 } }),
      );

      then('it reports the failure', () => {
        // .why = the 2026-08-09 failhide. this ended `|| true`, so a failed
        //        term.stop still printed "out of sight, still on the job" —
        //        a FALSE REPORT in its costliest shape: the ordinary success
        //        format, exit 0, over content that is untrue, while the window
        //        sits on the human's screen.
        expect(result.exit).toEqual(1);
      });

      then('it does NOT claim the crew is hidden', () => {
        expect(result.stdout).not.toContain('out of sight');
      });

      then('it still says no work was lost', () => {
        expect(result.stderr).toContain('no work was lost');
      });
    });
  });

  given('[case5] a crew with no ducts at all', () => {
    when('[t0] crew.show runs', () => {
      const result = useBeforeAll(async () =>
        runCrew({ command: `crew.show --tree ${TREE}`, sessions: [] }),
      );

      then('it reports a constraint', () => {
        expect(result.exit).toEqual(2);
      });

      then(
        'it opens NO tab — a tab onto an absent session leaves a phantom row',
        () => {
          // .why FILTERED to the verbs: the duct-session read is how show LEARNS
          //      there are no ducts, so it must run and must be recorded — it is
          //      the very call [case10][t0] asserts the host of. a bare-empty
          //      assertion here would forbid the lookup that makes the refusal
          //      possible.
          expect(result.calls.filter((c) => /^(term|duct)\./.test(c))).toEqual(
            [],
          );
        },
      );

      then('the error names the fix', () => {
        expect(result.stderr).toContain('git.crew.boot');
      });
    });
  });

  given('[case6] a crew to be stopped', () => {
    when('[t0] crew.stop runs', () => {
      const result = useBeforeAll(async () =>
        runCrew({ command: `crew.stop --tree ${TREE}` }),
      );

      then('it succeeds', () => {
        expect(result.exit).toEqual(0);
      });

      then(
        'TABS close BEFORE ducts — teardown runs the open order backwards',
        () => {
          // .why = a tab attached to a session you just killed dies on its own
          //        and leaves a registry row behind.
          const idxTerm = idxOf(result.calls, 'term.stop');
          const idxDuct = idxOf(result.calls, 'duct.stop');
          expect(idxTerm).toBeGreaterThanOrEqual(0);
          expect(idxDuct).toBeGreaterThanOrEqual(0);
          expect(idxTerm).toBeLessThan(idxDuct);
        },
      );

      then('it stops one duct per role — every seat, none left live', () => {
        // .why the names: a stop that missed a seat would leave a live duct on
        //      a crew reported down — the crew stays at work where no sweep
        //      derived from the stop looks for it again.
        const stops = result.calls.filter((c) => c.startsWith('duct.stop'));
        expect(stops).toHaveLength(ROLES_DEFAULT.length);
        for (const role of ROLES_DEFAULT) {
          expect(stops.join('\n')).toContain(`/${TREE}/${role}`);
        }
      });

      then('it never fells the tree — it points at the verb that does', () => {
        // .why `git.crew.fell` and no longer `git.tree.del`: stop and fell act
        //      on two different lifetimes, and the crew layer owns the one a
        //      stopped crew is asked about. `crew.fell` delegates the tree to
        //      `git.tree.del` and drops the ledger row on top — so a pointer
        //      at `git.tree.del` would send an operator to the half that
        //      leaves the crew on the books.
        expect(result.stdout).toContain('git.crew.fell');
        expect(result.stdout).toContain('branch are untouched');
      });

      then(
        'it says the LEDGER row survives — a stopped crew is still a crew',
        () => {
          // .why = this is the asymmetry the ledger rests on. duct.stop erases
          //        the duct registry row, so if stop cleared the ledger too, a
          //        stopped crew would be indistinguishable from a tree that
          //        never had one — the exact gap the ledger exists to close.
          expect(result.stdout).toContain('ledger row STAYS');
        },
      );
    });

    when('[t2] crew.stop runs and term.stop FAILS', () => {
      /**
       * .what = the PEER of [case4][t2], on the destructive verb
       *
       * .why  = crew.hide was cured of this exact failhide on 2026-08-09 and
       *         clamped. crew.stop carried the identical `|| true` and was
       *         never checked against its own peer's cure — so it kept the
       *         defect on the verb where it costs MORE, because a hide leaves
       *         the ducts live and a stop does not.
       *
       * 🔴 .met in production 2026-09-20, on the freeze of
       *    rhachet-roles-bhrain.beav.feat-subconscious-term-distill:
       *    term.stop printed `terminal 1175938 is alive but its window would
       *    not close`, `|| true` ate the rc, the ducts were killed anyway, and
       *    the verb signed off `🦫 lodge closed` at exit 0 over a window still
       *    on the human's screen.
       *
       * ⚠️ .and the duct kill is what makes it IRRECOVERABLE. crew.hide keys
       *    its terminal lookup on the duct, so once the ducts are gone the
       *    orphaned window is addressable by no crew verb at all — a
       *    `no terminal for duct` on the one verb that would have closed it.
       */
      const result = useBeforeAll(async () =>
        runCrew({ command: `crew.stop --tree ${TREE}`, rcs: { termStop: 1 } }),
      );

      then('it reports the failure rather than sign off', () => {
        expect(result.exit).toEqual(1);
      });

      then('it does NOT claim the lodge is closed', () => {
        // .why = the false report in its costliest shape — the ordinary
        //        success format over content that is untrue
        //        (rule.forbid.failhide; term=false-report._.choice._.md)
        expect(result.stdout).not.toContain('lodge closed');
      });

      then('it still stops every duct — the work half must go down', () => {
        // .why = a wedged kitty may NOT hold a teardown hostage. the caller
        //        asked for the work off; the tab failure is reported, never
        //        traded for a refusal to stop the crew.
        const stops = result.calls.filter((c) => c.startsWith('duct.stop'));
        expect(stops).toHaveLength(ROLES_DEFAULT.length);
      });

      then(
        'it names the window as ORPHANED, and the read that finds it',
        () => {
          // .why = crew.hide cannot address it once the ducts are gone, so an
          //        error that named crew.hide would send the operator at a verb
          //        that refuses by construction (rule.require.errors-name-the-fix)
          expect(result.stderr).toContain('ORPHANED');
          expect(result.stderr).toContain('term.audit');
        },
      );
    });

    when('[t3] crew.stop runs and term.stop finds NO window (rc=2)', () => {
      /**
       * .what = the NEGATIVE side of [t2] — the shape that looks like the
       *         defect and is not.
       *
       * 🔴 .why = termwork draws a line by rc, and [t2]'s cure did not read it:
       *
       *      rc 2 = CONSTRAINT — `no terminal for duct`, `terminal <pid> not
       *             found`. there is no window, so there is no close to make.
       *             that is the IDEMPOTENT case, and crew.stop's own header
       *             promises `idempotent: a crew already stopped reports so
       *             and exits 0`.
       *      rc 1 = MALFUNCTION — a lock it could not take, a registry it
       *             could not read or write, a tab closed whose entry would
       *             not drop. THOSE orphan a window.
       *
       *    ⚠️ and a window that was already gone is rc 0, never an error:
       *       termwork.sh:1729-1736 unregisters it and returns 0 on purpose.
       *
       * 🔴 .met in production 2026-09-20, ONE command after [t2]'s cure
       *    shipped. a `--roles reviewer` stop on an already-stopped crew
       *    printed `✋ term.stop: no terminal for duct` (rc 2), and the fresh
       *    cure rendered `the view half is ORPHANED on the screen` and exited
       *    1 — over a screen with no such window on it.
       *
       *    ⇒ the cure for a false report, emitting a false report. a stop
       *      that finds no window must read as DONE, or every idempotent
       *      re-run sends an operator hunting a pid that is absent
       *      (term=false-report._.choice._.md).
       */
      const result = useBeforeAll(async () =>
        runCrew({ command: `crew.stop --tree ${TREE}`, rcs: { termStop: 2 } }),
      );

      then('it exits 0 — no window to close is the idempotent case', () => {
        expect(result.exit).toEqual(0);
      });

      then('it does NOT cry orphan over a window that never existed', () => {
        expect(result.stderr).not.toContain('ORPHANED');
      });

      then('it still signs off — the teardown did complete', () => {
        expect(result.stdout).toContain('lodge closed');
      });

      then('it still stops every duct', () => {
        const stops = result.calls.filter((c) => c.startsWith('duct.stop'));
        expect(stops).toHaveLength(ROLES_DEFAULT.length);
      });
    });

    when('[t1] crew.stop runs with the retired --keep-ducts', () => {
      const result = useBeforeAll(async () =>
        runCrew({ command: `crew.stop --tree ${TREE} --keep-ducts` }),
      );

      then('it refuses rather than guess', () => {
        expect(result.exit).toEqual(2);
      });

      then('it touches naught — not a tab, not a duct', () => {
        // .why = the caller asked for the SAFE act. to reinterpret a retired
        //        flag as the destructive verb would end every conversation in
        //        the crew, which is precisely what they were trying to avoid.
        expect(result.calls).toEqual([]);
      });

      then('it names the verb that replaced it', () => {
        expect(result.stderr).toContain('crew.hide');
      });
    });
  });

  given('[case7] a caller who gives no --tree', () => {
    for (const verb of [
      'crew.boot',
      'crew.show',
      'crew.hide',
      'crew.stop',
      'crew.open',
    ]) {
      when(`[t0] ${verb} runs bare`, () => {
        const result = useBeforeAll(async () => runCrew({ command: verb }));

        then('it reports a constraint and touches naught', () => {
          expect(result.exit).toEqual(2);
          expect(result.calls).toEqual([]);
        });
      });
    }
  });

  given('[case8] the libs beside this file', () => {
    then(
      'crewwork sources its peers by PATH, never from the ambient shell',
      () => {
        // .why = an earlier revision guarded the load with
        //          declare -f duct.open >/dev/null || source ...
        //        which read as thrift and was a silent downgrade: a skill runs
        //        under a shell whose rc has already sourced the GLOBAL copy, so
        //        duct.open was already defined — as the older version — and the
        //        repo's own never loaded. the first crew.boot failed with
        //        "unknown arg '--cwd'" against a lib that had supported --cwd
        //        for an hour. this clamps that the load stays unconditional.
        const result = runCrew({
          command: [
            'if declare -f __duct_tmux >/dev/null; then echo LOADED; else echo ABSENT; fi',
            'if declare -f __term_register >/dev/null; then echo LOADED; else echo ABSENT; fi',
          ].join('\n'),
        });
        expect(result.stdout).toContain('LOADED\nLOADED');
        expect(result.stdout).not.toContain('ABSENT');
      },
    );

    then('both peers exist where crewwork expects them', () => {
      expect(existsSync(join(__dirname, 'ductwork.sh'))).toEqual(true);
      expect(existsSync(join(__dirname, 'termwork.sh'))).toEqual(true);
    });
  });

  given('[case9] crew.open — the composite, findsert on BOTH axes', () => {
    const scene = useBeforeAll(async () => {
      const gitRoot = genGitRoot({ trees: [TREE] });
      return { gitRoot, dir: join(gitRoot, 'someorg', '_worktrees', TREE) };
    });

    when('[t0] crew.open runs against a crew that is fully down', () => {
      const result = useBeforeAll(async () =>
        runCrew({
          command: `crew.open --tree ${TREE}`,
          gitRoot: scene.gitRoot,
          sessions: [`${TREE}/mechanic`, `${TREE}/foreman`],
        }),
      );

      then('it succeeds', () => {
        expect(result.exit).toEqual(0);
      });

      then('it reaches BOTH axes — ducts AND tabs', () => {
        // .why = this is the whole point of the verb. boot alone leaves no
        //        window; show alone refuses a crew with no ducts. only the
        //        composite gets a caller to "at work and in view" in one word.
        expect(
          result.calls.filter((c) => c.startsWith('duct.open')),
        ).toHaveLength(ROLES_DEFAULT.length);
        // .why DISTINCT roles: crew.show's focus re-call is an EXTRA term.open
        //      on purpose — see the same note on [case4][t0].
        const opens = result.calls.filter((c) => c.startsWith('term.open'));
        const roles = new Set(opens.map(roleOfTermOpen));
        expect([...roles].sort()).toEqual([...ROLES_DEFAULT].sort());
      });

      then('EVERY duct opens BEFORE ANY tab — the order that matters', () => {
        // .why = term.open findserts a duct of its own. a tab that runs before
        //        its duct spawns that session in the CALLER's directory, which
        //        is how reclaimed mechanics landed in the wrong repo on
        //        2026-08-09. the clamp lived on crew.boot until boot ceased to
        //        open tabs; it belongs here now, where both halves meet.
        const idxLastDuct = result.calls.reduce(
          (acc, c, i) => (c.startsWith('duct.open') ? i : acc),
          -1,
        );
        const idxFirstTerm = idxOf(result.calls, 'term.open');
        expect(idxLastDuct).toBeGreaterThanOrEqual(0);
        expect(idxFirstTerm).toBeGreaterThanOrEqual(0);
        expect(idxLastDuct).toBeLessThan(idxFirstTerm);
      });

      then('every TREE-BOUND duct still starts INSIDE the worktree', () => {
        // ⚠️ the local-only seat is excluded by NAME — its duct opens in this
        //    box's mirror dir. see the twin clamp on [case1][t0] for why the
        //    exclusion is a named list rather than a loosened assertion.
        const opens = result.calls
          .filter((c) => c.startsWith('duct.open'))
          .filter(
            (c) => !ROLES_LOCAL.some((role) => c.includes(`/${TREE}/${role} `)),
          );
        expect(opens).toHaveLength(ROLES_TREEBOUND.length);
        for (const call of opens) {
          expect(call).toContain(`--cwd ${scene.dir}`);
        }
      });

      then('the tabs keep role order — the FIRST takes the base tab', () => {
        const tabs = result.calls.filter((c) => c.startsWith('term.open'));
        expect(tabs[0]).toContain('--for mechanic');
        expect(tabs[1]).toContain('--for foreman');
      });
    });

    when('[t1] a duct fails to open', () => {
      const result = useBeforeAll(async () =>
        runCrew({
          command: `crew.open --tree ${TREE}`,
          gitRoot: scene.gitRoot,
          sessions: [`${TREE}/mechanic`, `${TREE}/foreman`],
          rcs: { ductOpen: 1 },
        }),
      );

      then('it reports the malfunction rather than a crew in view', () => {
        expect(result.exit).toEqual(1);
      });

      then(
        'it opens NO tab — a tab onto an absent duct dies and leaves a row',
        () => {
          // .why = NOT vacuous here, unlike on crew.boot: [t0] proves this same
          //        command opens 2 tabs on the happy path, so a composite that
          //        pressed on through a boot failure would go red.
          expect(result.calls.filter((c) => c.startsWith('term.open'))).toEqual(
            [],
          );
        },
      );
    });

    when('[t2] the ducts are fine but a TAB fails', () => {
      const result = useBeforeAll(async () =>
        runCrew({
          command: `crew.open --tree ${TREE}`,
          gitRoot: scene.gitRoot,
          sessions: [`${TREE}/mechanic`, `${TREE}/foreman`],
          rcs: { termOpen: 1 },
        }),
      );

      then('it reports the failure rather than a clean crew', () => {
        expect(result.exit).toEqual(1);
      });

      then('the WORK is still up — only the view failed', () => {
        expect(
          result.calls.filter((c) => c.startsWith('duct.open')),
        ).toHaveLength(ROLES_DEFAULT.length);
      });

      then(
        'it says the ducts are untouched, so no one stops them by mistake',
        () => {
          expect(result.stdout + result.stderr).toContain('ducts: untouched');
        },
      );
    });

    when('[t3] crew.open runs with --resume mechanic', () => {
      const result = useBeforeAll(async () =>
        runCrew({
          command: `crew.open --tree ${TREE} --resume mechanic`,
          gitRoot: scene.gitRoot,
          sessions: [`${TREE}/mechanic`, `${TREE}/foreman`],
        }),
      );

      then('the resume reaches boot, exactly once', () => {
        const sends = result.calls.filter((c) => c.startsWith('duct.send'));
        expect(sends).toHaveLength(1);
        expect(sends[0]).toContain('--resume mechanic');
        expect(sends[0]).toContain('--permission-mode acceptEdits');
      });

      // .why here too, and not only on crew.boot: crew.open composes boot+show,
      //        so a regression that dropped the enrollment from ONE of the two
      //        paths would leave the other green. the clamp rides both.
      then('the resume crew.open forwards also ENROLLS the clone', () => {
        const sends = result.calls.filter((c) => c.startsWith('duct.send'));
        expect(sends[0]).toContain('rhx enroll claude');
        expect(sends[0]).toContain('--as @:mechanic');
      });

      then(
        '--resume is STRIPPED before show, which never owned that flag',
        () => {
          // .why = crew.show rejects an unknown arg with rc 2. a naive
          //        pass-through of every flag would boot the crew and then fail
          //        the view — half a verb, reported as a failure.
          expect(result.exit).toEqual(0);
          const opens = result.calls.filter((c) => c.startsWith('term.open'));
          const roles = new Set(opens.map(roleOfTermOpen));
          expect([...roles].sort()).toEqual([...ROLES_DEFAULT].sort());
        },
      );
    });

    when('[t4] the tree has no worktree on disk', () => {
      const result = useBeforeAll(async () =>
        runCrew({
          command: `crew.open --tree ${TREE}`,
          gitRoot: genGitRoot({ trees: [] }),
        }),
      );

      then('it reports a constraint and touches naught', () => {
        // the boot half fail-fasts, so the show half never runs
        expect(result.exit).toEqual(2);
        expect(result.calls).toEqual([]);
      });
    });
  });

  /**
   * [case10] — the VIEW axis on a cloud grove
   *
   * .why = "there should be zero difference between local and cloud grove."
   *        there was. crew.show and crew.hide each opened with a bail:
   *
   *          🖥️  tabs are local-only in v1 — a cloud crew has no view
   *
   *        that line was honest and it was a GAP, never a design. the
   *        substrate had attached remote ducts by `ssh -t` since v1, so the
   *        only thing absent was the tab path — a human who dispatches to a
   *        grove wants a window on it for the same reason they want one here.
   *
   * .the family = this is the SIXTH instance of a local check rendered on a
   *        remote subject (crew.poll's localhost pin, duct.open's -d cwd
   *        test, crew.boot's skipped cloud tree lookup, duct.send --keys
   *        calling local tmux, the grove-lookup error naming this box's
   *        $HOME — and now __crew_has_ducts + __term_has_tmux_session, both
   *        pinned local). the cure is never a smarter check: the host is
   *        DATA the caller already holds, so it rides in as an argument.
   *
   * .the clamp = the fake __duct_list_host_sessions RECORDS its host, so
   *        these assertions can part "asked the grove" from "asked this
   *        box". absent that record the verdict would be identical either
   *        way — the clamp would read green while it guarded no defect.
   */
  given(
    '[case10] a cloud crew, whose view must match a local one exactly',
    () => {
      const GROVE = 'grove-1';
      const SLUG_REMOTE = `${GROVE}:${TREE_TMUX}`;

      when('[t0] crew.show runs against a cloud grove', () => {
        const result = useBeforeAll(async () =>
          runCrew({
            command: `crew.show --tree ${TREE} --grove cloud://${GROVE}`,
            sessions: [`${TREE}/mechanic`, `${TREE}/foreman`],
          }),
        );

        then('it succeeds — a cloud crew HAS a view', () => {
          expect(result.exit).toEqual(0);
        });

        then('it never refuses the grove for want of a local tab path', () => {
          expect(result.stdout + result.stderr).not.toContain('local-only');
        });

        then('it asked the GROVE whether ducts are up, not this box', () => {
          // .teeth = __crew_has_ducts pinned `localhost`, so a cloud crew was
          //          judged by whatever sessions THIS laptop happened to hold.
          //          a grove full of live ducts read as down, and an unrelated
          //          local session of the same name read as up.
          expect(result.calls).toContain(`__duct_list_host_sessions ${GROVE}`);
          expect(result.calls).not.toContain(
            '__duct_list_host_sessions localhost',
          );
        });

        then(
          'every tab is addressed HOST:TMUX-NAME, one slug for both halves',
          () => {
            // .why = termwork splits a duct slug on its FIRST colon, so this one
            //        form carries the host AND the session with no special case
            //        anywhere above it. that is the whole of "zero difference".
            const opens = result.calls.filter((c) => c.startsWith('term.open'));
            expect(opens.length).toBeGreaterThan(0);
            opens.forEach((c) => expect(c).toContain(`--on ${SLUG_REMOTE}`));
          },
        );

        then('it opens one tab per role, same as the local arm', () => {
          const opens = result.calls.filter((c) => c.startsWith('term.open'));
          const roles = new Set(opens.map(roleOfTermOpen));
          expect([...roles].sort()).toEqual([...ROLES_DEFAULT].sort());
        });

        then('it NEVER touches a duct — the view stays the free axis', () => {
          // .why = the axes do not blur when the host changes. a cloud show
          //        that opened a duct would cost a claude conversation to undo,
          //        which is exactly what show/hide exist to never do.
          expect(result.calls.filter((c) => c.startsWith('duct.'))).toEqual([]);
        });
      });

      when('[t1] the grove holds no ducts for that tree', () => {
        const result = useBeforeAll(async () =>
          runCrew({
            command: `crew.show --tree ${TREE} --grove cloud://${GROVE}`,
            sessions: [],
          }),
        );

        then('it reports a constraint and opens no tab', () => {
          expect(result.exit).toEqual(2);
          expect(result.calls.filter((c) => c.startsWith('term.'))).toEqual([]);
        });

        then(
          'the error names the GROVE, so nobody checks the wrong machine',
          () => {
            expect(result.stderr).toContain(GROVE);
            expect(result.stderr).not.toContain('on this box');
          },
        );
      });

      when('[t2] crew.hide runs against a cloud grove', () => {
        const result = useBeforeAll(async () =>
          runCrew({
            command: `crew.hide --tree ${TREE} --grove cloud://${GROVE}`,
          }),
        );

        then('it succeeds and closes by the SAME slug show opened', () => {
          expect(result.exit).toEqual(0);
          const stops = result.calls.filter((c) => c.startsWith('term.stop'));
          expect(stops).toHaveLength(1);
          expect(stops[0]).toContain(`--on ${SLUG_REMOTE}`);
        });

        then('it NEVER touches a duct', () => {
          expect(result.calls.filter((c) => c.startsWith('duct.'))).toEqual([]);
        });
      });

      when('[t3] crew.stop runs against a cloud grove', () => {
        const result = useBeforeAll(async () =>
          runCrew({
            command: `crew.stop --tree ${TREE} --grove cloud://${GROVE}`,
          }),
        );

        then('it closes the grove tabs BEFORE it ends the ducts', () => {
          // .teeth = this skipped the view entirely for a cloud crew, so every
          //          grove tab outlived its duct and became a phantom row — a
          //          record whose subject is gone (term=phantom).
          const idxStop = idxOf(result.calls, 'term.stop');
          const idxDuct = idxOf(result.calls, 'duct.stop');
          expect(idxStop).toBeGreaterThanOrEqual(0);
          expect(idxDuct).toBeGreaterThanOrEqual(0);
          expect(idxStop).toBeLessThan(idxDuct);
        });

        then('the tab close carries the grove host', () => {
          const stops = result.calls.filter((c) => c.startsWith('term.stop'));
          expect(stops[0]).toContain(`--on ${SLUG_REMOTE}`);
        });
      });

      when('[t4] crew.stop runs LOCALLY', () => {
        const result = useBeforeAll(async () =>
          runCrew({ command: `crew.stop --tree ${TREE}` }),
        );

        then(
          'it closes tabs by the TMUX form, never the raw dotted tree',
          () => {
            // .teeth = a separate latent LOCAL defect the cloud pass surfaced.
            //          this addressed `--on somerepo.beav.fix-thing`, a slug no
            //          terminal is ever registered under, so the lookup found
            //          naught and `|| true` swallowed it. the window stayed open
            //          while the ducts died under it.
            const stops = result.calls.filter((c) => c.startsWith('term.stop'));
            expect(stops).toHaveLength(1);
            expect(stops[0]).toContain(`--on ${TREE_TMUX}`);
            expect(stops[0]).not.toContain(`--on ${TREE} `);
          },
        );
      });
    },
  );

  /**
   * .what = a crew is born on TWO paths, and the per-role --cwd rule must reach
   *         BOTH — crew.boot (a re-boot) and git.tree.duct (a sprout)
   *
   * .why  = measured 2026-09-15 on a live sprout. `crew.boot` carried the rule
   *         in a comment for its whole life ("the --cwd is PER ROLE, never per
   *         tree"), and the SPROUT loop never learned it: it derived the host
   *         per role via __crew_duct_uri and then handed every role one flat
   *         $repo_path.
   *
   *         so a cloud sprout opened three grove ducts, then handed the LOCAL
   *         reviewer.take seat the grove's `/home/camper/...` path and died on
   *         "is not a directory" — AFTER the worktree and three ducts were on
   *         disk. a half-booted crew, from a verb that reported each step as it
   *         succeeded.
   *
   * 🔴 .the CLASS, not the instance: this is the identical shape as the LEDGER
   *    defect git.tree.duct.sh already documents at its own ledger block — a
   *    rule taught to crew.boot alone, while the other birth path lies. the
   *    extant clamp "🔴 every LOCAL-ONLY seat opens HERE, never on the tree dir"
   *    covers the BOOT path and has no twin for the sprout, which is exactly why
   *    the defect shipped.
   */
  given(
    '[case-birth-paths] the per-role --cwd rule, on BOTH crew birth paths',
    () => {
      when('[t0] the SEAT is local and the caller HINTS the grove', () => {
        /**
         * .why a HINT at all: a sprout reaches __crew_role_cwd BEFORE the ledger
         *      row exists — the row asserts "the ducts are up", so the very loop
         *      that opens them cannot read it. absent a hint the lookup returns
         *      empty and EVERY sprout falls to the mirror branch, which is right
         *      for a cloud tree and wrong for a local one.
         */
        const onCloud = useBeforeAll(async () =>
          runCrew({
            command: `__crew_role_cwd '/tree/dir' '${TREE}' 'reviewer.take' 'cloud://grove-1'`,
          }),
        );
        const onLocal = useBeforeAll(async () =>
          runCrew({
            command: `__crew_role_cwd '/tree/dir' '${TREE}' 'reviewer.take' 'local'`,
          }),
        );
        const onGrovebound = useBeforeAll(async () =>
          runCrew({
            command: `__crew_role_cwd '/tree/dir' '${TREE}' 'mechanic' 'cloud://grove-1'`,
          }),
        );

        then(
          'a CLOUD hint sends the local seat to a MIRROR, never the tree dir',
          () => {
            // the grove's worktree path does not exist on this box at all — that is
            // the whole failure, and it is what the live sprout died on.
            expect(onCloud.stdout).not.toContain('/tree/dir');
          },
        );

        then(
          'a LOCAL hint sends it to the TREE DIR — a local tree needs no mirror',
          () => {
            // the mirror can NEVER be filled for a local tree (tree.sync refuses
            // when --from and --into name one box), so the seat would review an
            // empty dir. this is the arm the hint exists to keep correct.
            expect(onLocal.stdout).toContain('/tree/dir');
          },
        );

        then('a GROVE-BOUND seat is untouched by the hint', () => {
          expect(onGrovebound.stdout).toContain('/tree/dir');
        });
      });

      when('[t1] the SPROUT path builds its duct.open calls', () => {
        /**
         * .why read INLINE rather than through useBeforeAll: the harness proxies
         *      a deferred value, and a proxied primitive string is not iterable —
         *      so `toContain` threw `received is not iterable` and the clamp FAILED
         *      for a reason that had naught to do with its subject. a read of a
         *      file on disk is synchronous and cheap; it needs no deferral at all.
         */
        const readLoop = (): string =>
          readFileSync(join(__dirname, '..', 'git.tree.duct.sh'), 'utf8')
            // 🔴 COMMENTS STRIPPED — the precedent set by the heal clamp above,
            //    and for the same measured reason: the skill's own `.why` block
            //    now QUOTES the cure, so a bare indexOf would grade the comment
            //    that documents the fix as though it were the fix, stay green
            //    forever, and guard naught (rule.forbid.failhide).
            .split('\n')
            .filter((line) => !/^\s*#/.test(line))
            .join('\n');

        then(
          '🔴 it derives the --cwd PER ROLE, never one flat repo_path',
          () => {
            const loop = readLoop();
            // the defect, stated as code: `--cwd "$repo_path"` inside the role loop.
            // revert the fix and this line is what comes back.
            expect(loop).not.toContain(
              'duct.open --on "$uri_role" --cwd "$repo_path"',
            );
            expect(loop).toContain('__crew_role_cwd');
          },
        );

        then(
          'it passes the grove it already knows, rather than trust the ledger',
          () => {
            const loop = readLoop();
            // the ledger row is written BELOW this loop, so a lookup here reads empty
            // and every sprout would fall to the mirror branch — a local one too.
            expect(loop).toContain('"$role" "$grove"');
          },
        );
      });
    },
  );
});
