// biome-ignore-all lint/suspicious/noControlCharactersInRegex: a captured tmux
// pane IS a stream of ANSI escapes, so every clamp here must strip them before
// it reads the text. the \u001b is the subject of these regexes rather than a
// typo in them — the rule is a false positive over a terminal-capture corpus.
/**
 * .what = clamps on the duct VERBS — open, send, read, stop — on real tmux
 *
 * .note = a PART of the `ductwork` suite, cut so one reviewer can hold
 *         it whole. the suite's shared fixtures, and its account of what it
 *         runs against and why, live in ductwork.harness.ts.
 */
import { spawnSync } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { given, then, useBeforeAll, when } from 'test-fns';

import { tempDirs } from '../../../.test/tempDirs';
import {
  genSocket,
  SOCKETS_MADE,
  TREE,
  TREE_DOTTED,
  TREE_DOTTED_TMUX,
} from './ductwork.harness';
import {
  delStaleTestServers,
  delStaleTestSockets,
  delTmuxServer,
  getPaneText,
  getSocketPath,
  getTestServerPids,
  getTestServerProcs,
  getTmuxSessions,
  hasTmux,
  hasTmuxServer,
  PREFIX_TEST_SOCKET,
  runDuct,
} from './work.harness';

beforeAll(() => {
  if (!hasTmux())
    throw new Error(
      'tmux is required for the ductwork clamps. fix: sudo apt install tmux',
    );
  // sweep litter from any prior run that was killed before its teardown.
  //
  // .why BOTH: the two sweeps see different leftovers, and the second one is
  //      the one a socket sweep is blind to. a server whose socket was
  //      unlinked while it still ran leaves NO file to find — only a process.
  delStaleTestServers();
  delStaleTestSockets();
});

afterAll(() => {
  // .why = [case10] clamps the SOCKET sweep, but only in its own part, and a
  //        `--scope case3` run filters it out entirely. no case anywhere
  //        sweeps the temp DIRS. an afterAll in every part is the one teardown
  //        that neither order, scope, nor the cut can step around.
  for (const socket of SOCKETS_MADE) delTmuxServer({ socket });
  tempDirs.delAll();
});

describe('ductwork', () => {
  given('[case1] the tmux seam, which every other case rests on', () => {
    const scene = useBeforeAll(async () => {
      const socket = genSocket('hermetic');
      const ductworkDir = tempDirs.genOne({ slug: 'registry' });
      const cwd = tempDirs.genOne({ slug: 'cwd' });
      const result = runDuct({
        body: `duct.open --on 'duct:///${TREE}/mechanic' --cwd '${cwd}'`,
        socket,
        ductworkDir,
      });
      return { socket, ductworkDir, cwd, result };
    });

    afterAll(() => delTmuxServer({ socket: scene.socket }));

    when('[t0] a duct is opened through the seam', () => {
      then('it succeeds', () => {
        expect(scene.result.exit).toEqual(0);
      });

      then('the session EXISTS on the private server', () => {
        expect(getTmuxSessions({ socket: scene.socket })).toContain(
          `${TREE}/mechanic`,
        );
      });

      then('the session is INVISIBLE on the default server', () => {
        // .why = THE hermeticity clamp. without it these tests would create
        //        sessions in the same namespace as the real fleet, where a
        //        name collision is possible and a teardown could end real
        //        work with a real claude conversation inside it.
        //
        //        read from tmux DIRECTLY, never through ductwork — to ask
        //        ductwork whether ductwork was hermetic is one instrument
        //        asked about itself (term=false-report._.choice._.md).
        expect(getTmuxSessions({ socket: null })).not.toContain(
          `${TREE}/mechanic`,
        );
      });

      then('the registry row lands in the TEMP dir, not the live one', () => {
        expect(
          existsSync(join(scene.ductworkDir, 'ducts', TREE, 'mechanic.json')),
        ).toEqual(true);
      });

      then('a DIFFERENT seam cannot see it either', () => {
        // .why = the sharpest teeth available, and the safest. if `-L` were
        //        dropped anywhere in the chain, BOTH sockets would land on the
        //        one default server and this would go red — and it proves that
        //        without a single call against live tmux.
        //
        //        the default-server assertion above proves the same thing but
        //        reads the live server to do it; this one is a closed system.
        expect(getTmuxSessions({ socket: `${scene.socket}-other` })).toEqual(
          [],
        );
      });
    });

    when('[t1] the same duct is stopped through a DIFFERENT seam', () => {
      then(
        'the stop cannot reach it — the namespaces are truly separate',
        () => {
          // .why = this is the failure mode the seam exists to prevent, run in
          //        miniature: a stop issued against one server must not be able
          //        to end work that lives on another. if it could, a test run
          //        could end a real mechanic's conversation.
          const other = `${scene.socket}-other`;
          const result = runDuct({
            body: `duct.stop --on 'duct:///${TREE}/mechanic'`,
            socket: other,
            ductworkDir: tempDirs.genOne({ slug: 'registry' }),
          });
          delTmuxServer({ socket: other });

          expect(result.stdout).toContain('already absent');
          // and the real one is still standing
          expect(getTmuxSessions({ socket: scene.socket })).toContain(
            `${TREE}/mechanic`,
          );
        },
      );
    });
  });

  given('[case2] a duct opened with --cwd', () => {
    const scene = useBeforeAll(async () => {
      const socket = genSocket('cwd');
      const ductworkDir = tempDirs.genOne({ slug: 'registry' });
      const cwd = tempDirs.genOne({ slug: 'cwd' });
      const result = runDuct({
        body: [
          `duct.open --on 'duct:///${TREE}/mechanic' --cwd '${cwd}'`,
          // ask tmux itself where the pane sits — an independent read
          `__duct_tmux display-message -p -t '${TREE}/mechanic' '#{pane_current_path}'`,
        ].join('\n'),
        socket,
        ductworkDir,
      });
      return { socket, cwd, result };
    });

    afterAll(() => delTmuxServer({ socket: scene.socket }));

    when('[t0] the pane is asked where it sits', () => {
      then('it started INSIDE --cwd, never in the caller directory', () => {
        // .why = the 2026-08-09 defect. duct.open rejected --cwd as an unknown
        //        arg while its skill documented it as REQUIRED, and
        //        `tmux new-session` carried no -c at all. after a reboot that
        //        put reclaimed mechanics in the wrong repo, where
        //        `claude --continue` resumes the wrong conversation.
        //
        //        macos reports /private/var for /var, so compare the tail.
        const reported = scene.result.stdout.trim().split('\n').pop() ?? '';
        expect(reported).toContain(scene.cwd.replace(/^\/private/, ''));
      });

      then('it is NOT the directory the caller ran from', () => {
        expect(scene.result.stdout).not.toContain(process.cwd());
      });
    });
  });

  given('[case3] a --cwd that does not exist', () => {
    const scene = useBeforeAll(async () => {
      const socket = genSocket('badcwd');
      const result = runDuct({
        body: `duct.open --on 'duct:///${TREE}/mechanic' --cwd '/no/such/dir/at/all'`,
        socket,
        ductworkDir: tempDirs.genOne({ slug: 'registry' }),
      });
      return { socket, result };
    });

    afterAll(() => delTmuxServer({ socket: scene.socket }));

    when('[t0] duct.open runs', () => {
      then('it reports a constraint', () => {
        expect(scene.result.exit).toEqual(2);
      });

      then(
        'it creates NO session — better absent than in the wrong place',
        () => {
          expect(getTmuxSessions({ socket: scene.socket })).toEqual([]);
        },
      );

      then('the error names the bad value', () => {
        expect(scene.result.stderr).toContain('/no/such/dir/at/all');
      });
    });
  });

  given('[case4] a duct that is already open', () => {
    const scene = useBeforeAll(async () => {
      const socket = genSocket('findsert');
      const ductworkDir = tempDirs.genOne({ slug: 'registry' });
      const cwd = tempDirs.genOne({ slug: 'cwd' });
      const first = runDuct({
        body: `duct.open --on 'duct:///${TREE}/mechanic' --cwd '${cwd}'`,
        socket,
        ductworkDir,
      });
      const second = runDuct({
        body: `duct.open --on 'duct:///${TREE}/mechanic' --cwd '${cwd}'`,
        socket,
        ductworkDir,
      });
      return { socket, first, second };
    });

    afterAll(() => delTmuxServer({ socket: scene.socket }));

    when('[t0] duct.open runs a second time', () => {
      then('it succeeds — findsert, never an error', () => {
        expect(scene.second.exit).toEqual(0);
      });

      then('it says FOUND rather than created', () => {
        expect(scene.first.stdout).toContain('created');
        expect(scene.second.stdout).toContain('found');
      });

      then('there is still exactly ONE session', () => {
        const live = getTmuxSessions({ socket: scene.socket }).filter((s) =>
          s.startsWith(TREE),
        );
        expect(live).toHaveLength(1);
      });
    });
  });

  // .why HERE, out of numeric order: this is [case4]'s twin — the same
  //      property (findsert), over the subject [case4] excluded (a DOTTED
  //      name). it sits beside the case it corrects so a reader meets both
  //      at once. it is numbered 11 rather than 5 because [case10] must stay
  //      declared last (see the note above `describe`), and a renumber of
  //      5..10 would churn every label to move one case.
  given(
    '[case11] a duct that is already open, under a DOTTED tree name',
    () => {
      const scene = useBeforeAll(async () => {
        const socket = genSocket('findsert-dotted');
        const ductworkDir = tempDirs.genOne({ slug: 'registry' });
        const cwd = tempDirs.genOne({ slug: 'cwd' });
        const first = runDuct({
          body: `duct.open --on 'duct:///${TREE_DOTTED}/mechanic' --cwd '${cwd}'`,
          socket,
          ductworkDir,
        });
        const second = runDuct({
          body: `duct.open --on 'duct:///${TREE_DOTTED}/mechanic' --cwd '${cwd}'`,
          socket,
          ductworkDir,
        });
        return {
          socket,
          first,
          second,
          rowDotted: join(ductworkDir, 'ducts', TREE_DOTTED, 'mechanic.json'),
          rowTmux: join(
            ductworkDir,
            'ducts',
            TREE_DOTTED_TMUX,
            'mechanic.json',
          ),
        };
      });

      afterAll(() => delTmuxServer({ socket: scene.socket }));

      when('[t0] duct.open runs a second time', () => {
        then('it succeeds — findsert, never an error', () => {
          // .teeth = reverted, this reads exit 1 with tmux's own words:
          //          `duplicate session: test_tree_dotted/mechanic`. tmux
          //          echoes the form it DERIVED, not the form it was handed,
          //          which is the fingerprint of the rewrite.
          expect(scene.second.exit).toEqual(0);
        });

        then('it says FOUND rather than created', () => {
          expect(scene.first.stdout).toContain('created');
          expect(scene.second.stdout).toContain('found');
        });

        then('there is still exactly ONE session', () => {
          const live = getTmuxSessions({ socket: scene.socket }).filter((s) =>
            s.startsWith(TREE_DOTTED_TMUX),
          );
          expect(live).toHaveLength(1);
        });

        then(
          'tmux stores it under the UNDERSCORE form — the rewrite is real',
          () => {
            // .why = this asserts the CAUSE, not the symptom. without it a reader
            //        who saw the above go green would have no evidence of why the
            //        two name forms must exist at all.
            const live = getTmuxSessions({ socket: scene.socket });
            expect(live).toContain(`${TREE_DOTTED_TMUX}/mechanic`);
            expect(live).not.toContain(`${TREE_DOTTED}/mechanic`);
          },
        );

        then(
          'the REGISTRY keeps the dotted name — tmux does not get a vote',
          () => {
            // .teeth = this is the half a naive fix drops. to make the findsert
            //          work it is enough to hand tmux the underscore form; if the
            //          registry key goes with it, every row is re-keyed on the
            //          substrate's rewrite, which strands the extant rows and the
            //          crew ledger, both keyed on the duct's own dotted name.
            expect(existsSync(scene.rowDotted)).toEqual(true);
            expect(existsSync(scene.rowTmux)).toEqual(false);
          },
        );
      });
    },
  );

  /**
   * .what = a duct STRANDED in `window-size manual`, the state a grove run
   *         leaves behind when it dies before its restore
   *
   * .why  = `window-size manual` tells tmux to stop snapping a window to its
   *         client's size, so a stranded session no longer tracks its terminal
   *         — permanently, and with no error anywhere. the pane then stays
   *         narrow, claude's modal chrome WRAPS, and the box detector reads a
   *         live modal as an empty box. the duct goes unbabysat.
   *
   *         measured 2026-09-03 on the live fleet: 11 of 11 grove ducts with a
   *         client sat stranded, and zero local ducts did — `git.grove.auth` is
   *         the only setter and it only runs against a grove. its restore was
   *         written `2>/dev/null || true`, in a block whose own header says a
   *         resize we merely issued is a wish. the guard caught its author.
   *
   * .note = the strand is set here through the SAME private seam the verb
   *         reads, so this cannot touch the live fleet ([case1] is what makes
   *         that safe).
   */
  given('[case12] a duct stranded in `window-size manual`', () => {
    const scene = useBeforeAll(async () => {
      const socket = genSocket('geometry');
      const ductworkDir = tempDirs.genOne({ slug: 'registry' });
      const cwd = tempDirs.genOne({ slug: 'cwd' });
      const result = runDuct({
        body: [
          `duct.open --on 'duct:///${TREE}/mechanic' --cwd '${cwd}'`,
          // strand it, exactly as a died-mid-run git.grove.auth would
          `__duct_tmux set-option -t '${TREE}/mechanic' -w window-size manual`,
          // .why echo the BEFORE: a clamp that assumes its own precondition
          //      proves naught when the precondition silently fails to take.
          //      the strand is measured, never presumed.
          `echo "GEOMETRY_BEFORE=$(__duct_tmux show-options -t '${TREE}/mechanic' -v -w window-size)"`,
          `duct.refresh --on 'duct:///${TREE}/mechanic'`,
          `echo "GEOMETRY_AFTER=$(__duct_tmux show-options -t '${TREE}/mechanic' -v -w window-size)"`,
          `duct.stop --on 'duct:///${TREE}/mechanic'`,
        ].join('\n'),
        socket,
        ductworkDir,
      });
      return { socket, result };
    });

    afterAll(() => delTmuxServer({ socket: scene.socket }));

    when('[t0] duct.refresh is run against it', () => {
      then('the strand was really set — the precondition is MEASURED', () => {
        expect(scene.result.stdout).toContain('GEOMETRY_BEFORE=manual');
      });

      then('the refresh succeeds', () => {
        expect(scene.result.exit).toEqual(0);
      });

      then('the geometry is restored to `latest`', () => {
        // .why THE clamp: this is the whole repair, read from tmux itself
        //      rather than from the verb's own word for it — a verb asked
        //      whether it worked is one instrument asked about itself
        //      (term=false-report).
        expect(scene.result.stdout).toContain('GEOMETRY_AFTER=latest');
      });

      then(
        'it SAYS it repaired the geometry, rather than fixing it mutely',
        () => {
          // .why = a mutation that does not report what it changed leaves the
          //        operator unable to tell a repair from a no-op
          //        (rule.require.status-feedback).
          expect(scene.result.stdout).toContain('window-size manual');
          expect(scene.result.stdout).toContain('restored to');
        },
      );

      then(
        'it ALSO reports the resulting width, on the healthy-mode path',
        () => {
          // 🔴 the other half of [case12b]'s independence clamp, and the half that
          //    matters most: this duct ends at `latest`, so if the width read sat
          //    inside the strand branch it would be unreachable for every duct
          //    whose geometry is fine — which is the measured fleet case.
          //
          // ⚠️ the NUMBER is deliberately unpinned. it is whatever tmux gives a
          //    detached session, and to pin it would clamp tmux's default-size
          //    policy rather than our own contract (rule.require.clamp-edge-cases:
          //    clamp the class, never the one value that happened to appear).
          //
          // 🔴 .the BOUND, and it is the honest half: this duct is HEADLESS, as
          //    every `duct.open` here is, so the width it reads comes off the
          //    headless line. the with-client `refreshed (…)` line is beyond this
          //    suite's reach entirely — measured 2026-09-13 by a dogfood: the
          //    width was stripped from that line and all nine of these stayed
          //    green. its clamp lives in `work.surface` [case24][t2], static.
          expect(/pane \d+ cols/.test(scene.result.stdout)).toEqual(true);
          expect(scene.result.stdout).toContain('no client attached');
        },
      );
    });
  });

  /**
   * [case12b] — a duct that is NARROW under a healthy `window-size latest`
   *
   * .why = [case12] cures ONE cause of a narrow pane, and the verb was blind to
   *        the other. a window can track its client perfectly and still be 45
   *        columns, because the CLIENT is 45 columns — kitty caches a window
   *        size (`remember_window_size`), so one window closed small seeds every
   *        duct window booted after it.
   *
   *        the harm is identical either way: below ~80 cols claude's modal
   *        chrome wraps, `2. Yes, and…` renders `2Yes, and…`, and the box
   *        detector reads a LIVE MODAL as an empty box. the duct goes unbabysat.
   *
   * 🔴 .why it is a term=false-report rather than a plain gap: `duct.refresh`
   *        did not fail. it repainted the narrow pane FAITHFULLY and reported
   *        `refreshed` — a true sentence about the act, from which the reader
   *        draws a false one about the result. measured 2026-09-13 on
   *        `grove-sandpine-v20260901`: six clones at 45-46 cols, refreshed clean,
   *        and named by no instrument at all.
   *
   * .the teeth = this case fails without the width read-back. the geometry here
   *        is LATEST and healthy, so [case12]'s strand clamp passes untouched —
   *        only a verb that quotes the RESULT can surface this one.
   */
  given(
    '[case12b] a duct that is narrow though its geometry is healthy',
    () => {
      const scene = useBeforeAll(async () => {
        const socket = genSocket('narrow');
        const ductworkDir = tempDirs.genOne({ slug: 'registry' });
        const cwd = tempDirs.genOne({ slug: 'cwd' });
        const result = runDuct({
          body: [
            `duct.open --on 'duct:///${TREE}/mechanic' --cwd '${cwd}'`,
            // ⚠️ `manual` is how a width is PINNED on a detached session — with no
            //    client attached, `latest` has no client to size to and tmux is
            //    free to snap the window back. so the mode stays manual here, and
            //    the strand repair fires alongside. that is deliberate: see the
            //    independence clamp below, which is the stronger property anyway.
            `__duct_tmux set-option -t '${TREE}/mechanic' -w window-size manual`,
            `__duct_tmux resize-window -t '${TREE}/mechanic' -x 45 -y 25`,
            // .why the precondition is MEASURED, never presumed — same discipline
            //      as [case12]'s GEOMETRY_BEFORE
            `echo "WIDTH_BEFORE=$(__duct_tmux list-panes -t '${TREE}/mechanic' -F '#{pane_width}' | head -1)"`,
            `duct.refresh --on 'duct:///${TREE}/mechanic'`,
            `duct.stop --on 'duct:///${TREE}/mechanic'`,
          ].join('\n'),
          socket,
          ductworkDir,
        });
        return { socket, result };
      });

      afterAll(() => delTmuxServer({ socket: scene.socket }));

      when('[t0] duct.refresh is run against it', () => {
        then(
          'the pane was really narrowed — the precondition is MEASURED',
          () => {
            expect(scene.result.stdout).toContain('WIDTH_BEFORE=45');
          },
        );

        then('the refresh reports the WIDTH, never only the act', () => {
          // `refreshed (N client(s))` is a claim about the repaint; the harm is a
          // property of the pane. a verb that quotes its input is decoration, one
          // that quotes the record is an instrument.
          //
          // ⚠️ the width here is PINNED at 45 by the `manual` mode above, so this
          //   is a real number rather than tmux's default — which is what makes
          //   it worth asserting exactly. the STREAM and the with-client line are
          //   beyond a headless suite; see `work.surface` [case24][t2].
          expect(scene.result.stdout).toContain('pane 45 cols');
        });

        then(
          'a HEADLESS duct still reports its width, and is NOT warned about',
          () => {
            // 🔴 the split this case exists to pin, and it cuts both ways.
            //
            //  · the WIDTH is a fact about the pane whether or not anyone watches,
            //    so a headless report that omits it has a hole in it. the read must
            //    therefore sit ABOVE the headless early-return — it did not at
            //    first, and this duct (detached, as every `duct.open` is) printed
            //    no width at all.
            //
            //  · the WARN must NOT fire here. with no client, `latest` hands back a
            //    default size the next attach replaces, so a warn is an alarm about
            //    a width nobody has. the measured fleet case had a client attached
            //    (`/dev/pts/102`) — that is the state worth interrupting for.
            expect(scene.result.stdout).toContain('no client attached');
            expect(scene.result.stdout).not.toContain('NARROW at');
          },
        );

        then(
          'the two conditions report INDEPENDENTLY, never one inside the other',
          () => {
            // 🔴 the clamp that keeps this case from being [case12] twice.
            //
            // .why = the strand and the narrowness are different claims with
            //   different cures — one is fixed at tmux, one only at the terminal.
            //   if the width line were nested inside the strand branch, a duct that
            //   is narrow under a HEALTHY `latest` (the measured fleet case, and the
            //   whole reason this exists) would report no width at all.
            //
            // ⇒ so both must be present here, and the width must be reachable from
            //   a path the strand never takes. [case12] holds the other half: it
            //   ends at `latest` and still prints a `pane N cols`.
            expect(scene.result.stdout).toContain('STRANDED in');
            expect(scene.result.stdout).toContain('pane 45 cols');
          },
        );
      });
    },
  );

  given(
    '[case13] an IDLE duct, read with a window SMALLER than its blank tail',
    () => {
      // .why = `capture-pane` pads its output to the full pane height. an idle
      //        pane holds its prompt near the TOP with empty rows beneath, so a
      //        bare `tail -n N` returns N rows of pad and no signal at all.
      //
      //        measured 2026-09-03 on a live grove foreman:
      //          duct.read --lines 20 --raw  → no signal
      //          duct.read --lines 60        → the prompt, plainly
      //
      //        the cost was not a thin read. `duct.poll` classifies the box from
      //        this exact call, and its ladder asserts "a capture-pane of a live
      //        session is never empty" — so the box fell through to `unread`, and
      //        because no stone renders for a non-`empty` box, every idle clone
      //        ALSO lost its route position. the fleet read 5 × ❔unread; after
      //        the repair, 3.
      //
      // .teeth = this case FAILS without `__duct_strip_pane_pad`. the window is
      //          deliberately 3 — wide enough to hold a prompt, far narrower than
      //          the pane's blank tail, so an unstripped tail yields only pad.
      //          [case5] cannot catch this: its `--lines 20` is wide enough to
      //          reach back over the pad on a short pane.
      const scene = useBeforeAll(async () => {
        const socket = genSocket('idlepad');
        const ductworkDir = tempDirs.genOne({ slug: 'registry' });
        const cwd = tempDirs.genOne({ slug: 'cwd' });
        const result = runDuct({
          body: [
            `duct.open --on 'duct:///${TREE}/mechanic' --cwd '${cwd}'`,
            // let the shell settle so a prompt is drawn and the rest is pad
            'sleep 2',
            // sentinels bracket the read, so the assertion sees the READ's bytes
            // alone — duct.open and duct.stop both print, so a bare "stdout is
            // non-empty" check would pass with no read at all
            'echo __READ_BEGIN__',
            `duct.read --on 'duct:///${TREE}/mechanic' --lines 3 --raw`,
            'echo __READ_END__',
            `duct.stop --on 'duct:///${TREE}/mechanic'`,
          ].join('\n'),
          socket,
          ductworkDir,
        });
        return { socket, result };
      });

      when('[t0] the idle pane is read through a 3-line window', () => {
        then('the read yields signal, never the blank rows tmux padded', () => {
          const between =
            scene.result.stdout
              .split('__READ_BEGIN__')[1]
              ?.split('__READ_END__')[0] ?? '';
          // a pad row under --raw still carries ANSI color resets, so it is
          // non-empty as a STRING while it holds no printable char. strip the
          // escapes before the test, exactly as the lib does
          const printable = between
            .replace(/\u001b\[[0-9;?]*[A-Za-z]/g, '')
            .replace(/\s/g, '');
          expect({
            sentinelsFound: between !== '',
            hasPrintable: printable !== '',
          }).toEqual({
            sentinelsFound: true,
            hasPrintable: true,
          });
        });
      });
    },
  );

  given('[case14] a keystroke sent through the LIB, not the skill', () => {
    /**
     * .what = clamps `duct.send --keys` on the ductwork FUNCTION.
     *
     * .why  = the flag lived ONLY in duct.send.sh, the skill. this function
     *         took --on/--what/--await/--anyway and rejected --keys with
     *         `unknown arg`, while the skill's own --help advertised it.
     *
     *         nobody noticed because the skill was the only surface driven by
     *         hand. `git.crew.send` is the first caller to reach the LIB with
     *         a keystroke, so a supervisor who answered a permission modal at
     *         the crew layer got exit 2 — on the one path
     *         howto.review-permission-requests calls the approval path.
     *
     * .teeth = under the un-fixed lib this case goes RED at [t0]: the send
     *          exits 2 and prints `unknown arg '--keys'`. it cannot pass by
     *          accident, because [t1] also proves NO Enter was appended —
     *          which is the whole reason --keys exists apart from --what.
     */
    const scene = useBeforeAll(async () => {
      const socket = genSocket('keys');
      const ductworkDir = tempDirs.genOne({ slug: 'registry' });
      const cwd = tempDirs.genOne({ slug: 'cwd' });
      const marker = join(cwd, 'keys.marker.txt');
      const result = runDuct({
        body: [
          `duct.open --on 'duct:///${TREE}/mechanic' --cwd '${cwd}'`,
          // a bare token, typed into the shell. --keys appends NO Enter, so
          // this must sit at the prompt unsubmitted.
          `duct.send --on 'duct:///${TREE}/mechanic' --keys 'Z'`,
          'sleep 1',
          `duct.read --on 'duct:///${TREE}/mechanic' --lines 20`,
          `duct.stop --on 'duct:///${TREE}/mechanic'`,
        ].join('\n'),
        socket,
        ductworkDir,
      });
      return { socket, marker, result };
    });

    when('[t0] the lib is asked for a keystroke', () => {
      then('it does NOT reject --keys as an unknown arg', () => {
        expect(scene.result.stderr).not.toContain("unknown arg '--keys'");
      });

      then('the send succeeds', () => {
        expect(scene.result.exit).toEqual(0);
      });
    });

    when('[t1] the pane is read back', () => {
      then(
        'the keystroke landed as literal text, with no Enter appended',
        () => {
          // .why = the marker file proves the negative. had an Enter been
          //        appended, the shell would have run `Z` and written nothing —
          //        but more importantly the pane would show a `command not
          //        found`. its ABSENCE is what parts --keys from --what.
          expect(scene.result.stdout).toContain('Z');
          expect(scene.result.stdout).not.toContain('command not found');
          expect(existsSync(scene.marker)).toEqual(false);
        },
      );
    });
  });

  /**
   * [case18] — a --what payload that holds a NON-ASCII glyph
   *
   * .why  measured 2026-09-15 on a grove crew (#91). the payload held `⭐` and
   *       two em dashes. the send exited 1 and tmux printed its own parse error
   *       SIX times:
   *
   *         rhx git.crew.send --tree <t> --who mechanic --what @stdin --submit
   *         └─ 💥 failed with an error
   *         not in a mode
   *         not in a mode
   *         ... (6×)
   *         💥 duct.send: failed to send to 'duct://…/mechanic'
   *
   *       `not in a mode` is tmux's own error, so the payload reached tmux and
   *       was read as a KEY NAME rather than as text. `send-keys` looks each
   *       argument up in its key table first and only falls back to literal
   *       text — so a glyph that resolves to a key tmux will not send outside a
   *       mode ends the whole send.
   *
   * .why  the glyphs are not exotic, which is what makes the frequency high:
   *       `⭐` is this repo's OWN sponsorship glyph. it appears in poll output,
   *       in eco.priority renders, and in a clone's own asks — so a supervisor
   *       who quotes a clone's `⭐ (a) or (b)?` question back at it hits this on
   *       the first try.
   *
   * .why  🔴 [t1] is the DANGEROUS half, and it is a second defect. after the
   *       failed send the pane was left in a mode that SWALLOWS keystrokes, and
   *       an ASCII-only retry then reported full success —
   *
   *         🔧 …/mechanic sent
   *         🔧 …/mechanic keys sent: Enter
   *
   *       — while the payload never arrived. verified twice by read-back: the
   *       pane was byte-identical, the box read `❯ ` empty with no ghost, and no
   *       turn began. so it landed neither as text nor as a submit; it vanished.
   *       a supervisor who trusts `sent` believes it routed an idle ⭐ clone
   *       when it did not, and the clone sits idle for as long as the tick takes
   *       to come back (term=false-report).
   *
   * .why  a LIVE clamp rather than a captured pane log: the subject here is not
   *       a classifier that reads text, it is tmux's own argument parser. a log
   *       asset would record what tmux printed once; this reproduces the parse
   *       against real tmux on every run, which is strictly stronger evidence
   *       (rule.always.clamp-the-verbatim-pane-your-classifier-judged names the
   *       asset rule for a pane a CLASSIFIER judged — this judges no pane).
   *
   * .why  the read-back is a MARKER FILE and a direct tmux capture, never the
   *       send's own report. the whole defect class — #20, #32, and now this —
   *       is a send path that reports on the CALL and not on the ARRIVAL, so a
   *       clamp that read `🔧 sent` would pass under the very defect it exists
   *       to catch.
   *
   * .teeth under the un-fixed lib this goes RED at [t0]: the marker file is
   *        absent, because the payload never reached the pane's shell. and it
   *        goes RED at [t1] too, from the SAME single failure — which is the
   *        point, since the second send is the one that lies.
   */
  given('[case18] a --what payload that holds a non-ASCII glyph', () => {
    /** the exact two glyph shapes the 2026-09-15 incident carried */
    const GLYPH_STAR = '⭐';
    const GLYPH_DASH = '—';

    const scene = useBeforeAll(async () => {
      const socket = genSocket('glyph');
      const ductworkDir = tempDirs.genOne({ slug: 'registry' });
      const cwd = tempDirs.genOne({ slug: 'cwd' });
      const markerGlyph = join(cwd, 'glyph.marker.txt');
      const markerAfter = join(cwd, 'after.marker.txt');
      const result = runDuct({
        body: [
          `duct.open --on 'duct:///${TREE}/mechanic' --cwd '${cwd}'`,
          // the glyph send. an `if` rather than a `$?` capture, so the outcome
          // is legible in stdout without a bare status statement.
          `if duct.send --on 'duct:///${TREE}/mechanic' --await 15 --what 'echo "${GLYPH_STAR} ${GLYPH_DASH} GLYPH_OK" > "${markerGlyph}"'; then echo 'SEND_GLYPH=ok'; else echo 'SEND_GLYPH=fail'; fi`,
          'sleep 2',
          // 🔴 the second send is PURE ASCII and must land. under the un-fixed
          // lib the pane is left to eat every key, so this one reports `sent`
          // and vanishes — the false report that makes defect 1 expensive.
          `if duct.send --on 'duct:///${TREE}/mechanic' --await 15 --what 'echo PLAIN_ASCII_OK > "${markerAfter}"'; then echo 'SEND_AFTER=ok'; else echo 'SEND_AFTER=fail'; fi`,
          'sleep 2',
          `duct.read --on 'duct:///${TREE}/mechanic' --lines 30`,
        ].join('\n'),
        socket,
        ductworkDir,
      });
      // .why read the pane BEFORE the stop: a stopped duct has no pane to
      //      capture, and this read is the independent half of the evidence.
      const pane = getPaneText({ socket, session: `${TREE}/mechanic` });
      runDuct({
        body: `duct.stop --on 'duct:///${TREE}/mechanic'`,
        socket,
        ductworkDir,
      });
      return { socket, markerGlyph, markerAfter, result, pane };
    });

    afterAll(() => delTmuxServer({ socket: scene.socket }));

    when('[t0] the glyph payload is sent', () => {
      then('the send does not fail', () => {
        expect(scene.result.stdout).toContain('SEND_GLYPH=ok');
      });

      then('tmux never reports its own key-table parse error', () => {
        // .why = `not in a mode` is the tell that the payload was read as a KEY
        //        rather than as text. its absence is what proves the cure is at
        //        the cause and not a retry around it.
        expect(scene.result.stderr).not.toContain('not in a mode');
        expect(scene.result.stdout).not.toContain('not in a mode');
      });

      then('the glyph BYTES reached the pane intact', () => {
        // 🔴 the marker file is the independent read-back: the pane's own shell
        //    wrote it, so its content is what tmux actually delivered.
        expect(existsSync(scene.markerGlyph)).toEqual(true);
        const landed = readFileSync(scene.markerGlyph, 'utf8');
        expect(landed).toContain(GLYPH_STAR);
        expect(landed).toContain(GLYPH_DASH);
        expect(landed).toContain('GLYPH_OK');
      });
    });

    when('[t1] an ASCII payload is sent AFTER the glyph one', () => {
      then('it reports success', () => {
        expect(scene.result.stdout).toContain('SEND_AFTER=ok');
      });

      then('🔴 and it actually ARRIVED — the pane was left usable', () => {
        // .why = this is the assertion the 2026-09-15 incident needed and
        //        nobody had. the send reported `sent` and the payload was gone,
        //        and ONLY a read-back caught it. a `sent` report proves naught
        //        about an arrival (rule.require.verify-after-send).
        expect(existsSync(scene.markerAfter)).toEqual(true);
        expect(readFileSync(scene.markerAfter, 'utf8')).toContain(
          'PLAIN_ASCII_OK',
        );
      });
    });

    when('[t2] the pane is captured directly from tmux', () => {
      then('both payloads are visible in its scrollback', () => {
        // .why = a second, independent source. the marker files prove the
        //        pane's shell RAN the line; this proves the line was TYPED
        //        there, so a cure that somehow wrote the file by another route
        //        could not pass both.
        expect(scene.pane).toContain(GLYPH_STAR);
        expect(scene.pane).toContain('PLAIN_ASCII_OK');
      });
    });
  });

  /**
   * [case19] — a --what payload that tmux resolves as a KEY NAME
   *
   * 🔴 .why this case exists and [case18] was not enough
   *       [case18] reproduces the 2026-09-15 payload (`⭐`, em dashes) and
   *       PASSES on the local arm. so the glyph instance is remote-only, and a
   *       clamp that green-passes proves naught (rule.require.clamp-edge-cases:
   *       a clamp you have not seen fail is a guess). rather than guess at the
   *       remote mechanism, this case clamps the CLASS the incident belongs to,
   *       with a payload that bites here, deterministically.
   *
   * .what the class: `duct.send` declares two flags with two senses —
   *
   *         --what  TEXT       (the lib appends an Enter)
   *         --keys  KEYSTROKES ("each space-separated token is its own key",
   *                             its own comment, ductwork.sh:942)
   *
   *       and then hands BOTH to the same `send-keys`, which looks each
   *       argument up in its key table BEFORE it falls back to literal text.
   *       so a `--what` whose value happens to name a key is delivered as that
   *       key. one surface, two senses, one implementation — which is the
   *       ambiguity `rule.forbid.domain-term-ambiguity` names, expressed in
   *       code rather than in a word.
   *
   * .why  `Up` rather than an exotic token: it is a plain english word and an
   *       entirely ordinary one-word reply for a supervisor to send a clone. it
   *       resolves to the up-arrow key, so under the un-fixed lib the pane gets
   *       a history recall and an Enter — it RE-RUNS the previous command — and
   *       the word `Up` is never typed at all. `C-c` and `C-u` sit in the same
   *       class and are worse: a text send that interrupts the program holding
   *       the pane.
   *
   * .why  the cure is `send-keys -l`, and the precedent is already in this
   *       corpus: `git.grove.auth.sh:876` pastes a login code with
   *       `send-keys -t '$session' -l '$code_q'` and submits with a SEPARATE
   *       `send-keys -t '$session' Enter`. `-l` disables the key-table lookup
   *       outright, so it retires the whole class rather than one byte of it —
   *       and it is therefore correct without a name for the glyph that broke
   *       the remote arm (rule.require.solve-at-cause).
   *
   * .teeth under the un-fixed lib [t0] goes RED: the pane holds no `Up: not
   *        found`, because no `Up` was ever typed there.
   */
  given('[case19] a --what payload that names a tmux key', () => {
    const scene = useBeforeAll(async () => {
      const socket = genSocket('keyname');
      const ductworkDir = tempDirs.genOne({ slug: 'registry' });
      const cwd = tempDirs.genOne({ slug: 'cwd' });
      const result = runDuct({
        body: [
          `duct.open --on 'duct:///${TREE}/mechanic' --cwd '${cwd}'`,
          // 🔴 a bare key name, sent as TEXT. the contract says this is text.
          `duct.send --on 'duct:///${TREE}/mechanic' --await 15 --what 'Up'`,
          'sleep 2',
        ].join('\n'),
        socket,
        ductworkDir,
      });
      const pane = getPaneText({ socket, session: `${TREE}/mechanic` });
      runDuct({
        body: `duct.stop --on 'duct:///${TREE}/mechanic'`,
        socket,
        ductworkDir,
      });
      return { socket, result, pane };
    });

    afterAll(() => delTmuxServer({ socket: scene.socket }));

    when('[t0] the pane is captured directly from tmux', () => {
      then('the send reports success', () => {
        expect(scene.result.exit).toEqual(0);
      });

      then('🔴 the word was TYPED as text, never delivered as a key', () => {
        // .why = the shell's own rejection of `Up` is the proof. a pane that
        //        received the up-arrow instead shows a recalled command and no
        //        such line at all — so this assertion cannot pass under the
        //        un-fixed lib, and cannot pass by accident either.
        expect(scene.pane).toMatch(/Up: (?:command )?not found/);
      });
    });
  });

  given('[case5] a live duct to talk to', () => {
    const scene = useBeforeAll(async () => {
      const socket = genSocket('send');
      const ductworkDir = tempDirs.genOne({ slug: 'registry' });
      const cwd = tempDirs.genOne({ slug: 'cwd' });
      const marker = join(cwd, 'marker.txt');
      const result = runDuct({
        body: [
          `duct.open --on 'duct:///${TREE}/mechanic' --cwd '${cwd}'`,
          `duct.send --on 'duct:///${TREE}/mechanic' --await 15 --what 'echo DUCT_SPOKE > "${marker}"'`,
          'sleep 2',
          `duct.read --on 'duct:///${TREE}/mechanic' --lines 20`,
          // .why = close the duct the moment the read is done. this case is
          //        the only one that leaves a pane shell alive for seconds,
          //        and a live pane inherits DUCTWORK_TMUX_SOCKET — so what it
          //        goes on to do lands in THIS private server, after the case
          //        believes it is finished. a case that opens a duct closes
          //        it.
          `duct.stop --on 'duct:///${TREE}/mechanic'`,
        ].join('\n'),
        socket,
        ductworkDir,
      });
      return { socket, marker, result };
    });

    // .why NO given-level afterAll here: [t2] below tears this case's server
    //      down explicitly, and a SECOND delTmuxServer afterward was itself
    //      the suspect — this case's socket kept reappearing, live, after a
    //      teardown that had provably left it dead.
    when('[t0] a command is sent and the pane is read back', () => {
      then('the send succeeds', () => {
        expect(scene.result.exit).toEqual(0);
      });

      then('the command actually RAN in the pane', () => {
        // .why = an independent witness. `✔ submitted` has been a false report
        //        before (a stranded message under load), so the proof that the
        //        send landed is the file the pane wrote, never the send's own
        //        word for it.
        expect(existsSync(scene.marker)).toEqual(true);
        expect(readFileSync(scene.marker, 'utf8')).toContain('DUCT_SPOKE');
      });

      then('duct.read shows the pane contents', () => {
        expect(scene.result.stdout).toContain('DUCT_SPOKE');
      });
    });

    when('[t1] a send is aimed at a session that is absent', () => {
      const result = useBeforeAll(async () =>
        runDuct({
          body: `duct.send --on 'duct:///nosuchtree/mechanic' --what 'echo hi'`,
          socket: scene.socket,
          ductworkDir: tempDirs.genOne({ slug: 'registry' }),
        }),
      );

      then('it reports a constraint and names the fix', () => {
        expect(result.exit).toEqual(2);
        expect(result.stderr).toContain('duct.open');
      });
    });

    when('[t2] this case tears its own server down', () => {
      // .why = case5 is the ONE case whose socket kept showing up in the
      //        end-of-file litter check, so the teardown is clamped HERE,
      //        beside the case, rather than only at the end. a clamp that
      //        fires 5 cases later names the symptom; this one names the
      //        subject.
      const after = useBeforeAll(async () => {
        delTmuxServer({ socket: scene.socket });
        return {
          up: hasTmuxServer({ socket: scene.socket }),
          pids: getTestServerPids({ socket: scene.socket }),
        };
      });

      then('NO server, and no process, survives it', () => {
        expect({ up: after.up, pids: after.pids }).toEqual({
          up: false,
          pids: [],
        });
      });
    });
  });

  given('[case6] a duct to stop', () => {
    const scene = useBeforeAll(async () => {
      const socket = genSocket('stop');
      const ductworkDir = tempDirs.genOne({ slug: 'registry' });
      const cwd = tempDirs.genOne({ slug: 'cwd' });
      const opened = runDuct({
        body: `duct.open --on 'duct:///${TREE}/mechanic' --cwd '${cwd}'`,
        socket,
        ductworkDir,
      });
      const row = join(ductworkDir, 'ducts', TREE, 'mechanic.json');
      const rowBefore = existsSync(row);
      const stopped = runDuct({
        body: `duct.stop --on 'duct:///${TREE}/mechanic'`,
        socket,
        ductworkDir,
      });
      const again = runDuct({
        body: `duct.stop --on 'duct:///${TREE}/mechanic'`,
        socket,
        ductworkDir,
      });
      return { socket, row, rowBefore, opened, stopped, again };
    });

    afterAll(() => delTmuxServer({ socket: scene.socket }));

    when('[t0] duct.stop runs', () => {
      then('it succeeds', () => {
        expect(scene.stopped.exit).toEqual(0);
      });

      then('the SESSION is gone', () => {
        expect(getTmuxSessions({ socket: scene.socket })).not.toContain(
          `${TREE}/mechanic`,
        );
      });

      then('the ROW is gone too — both halves of the duct', () => {
        // a duct is a row AND a session. to remove one is to leave a drift.
        expect(scene.rowBefore).toEqual(true);
        expect(existsSync(scene.row)).toEqual(false);
      });
    });

    when('[t1] duct.stop runs AGAIN on the same duct', () => {
      then(
        'it succeeds — a stop that finds its target absent has arrived',
        () => {
          expect(scene.again.exit).toEqual(0);
          expect(scene.again.stdout).toContain('already absent');
        },
      );
    });
  });

  given('[case7] a PHANTOM — a row whose session is already gone', () => {
    const scene = useBeforeAll(async () => {
      const socket = genSocket('phantom');
      const ductworkDir = tempDirs.genOne({ slug: 'registry' });
      const cwd = tempDirs.genOne({ slug: 'cwd' });
      // open the duct, then kill the SESSION behind ductwork's back, so the
      // row is the only part left. this is what a machine reboot produces:
      // rows are files and survive it; tmux sessions do not.
      const result = runDuct({
        body: [
          `duct.open --on 'duct:///${TREE}/mechanic' --cwd '${cwd}'`,
          `__duct_tmux kill-session -t '${TREE}/mechanic'`,
          `duct.stop --on 'duct:///${TREE}/mechanic'`,
        ].join('\n'),
        socket,
        ductworkDir,
      });
      return {
        socket,
        row: join(ductworkDir, 'ducts', TREE, 'mechanic.json'),
        result,
      };
    });

    afterAll(() => delTmuxServer({ socket: scene.socket }));

    when('[t0] duct.stop runs against the phantom', () => {
      then('it succeeds', () => {
        expect(scene.result.exit).toEqual(0);
      });

      then('it REMOVES the row — the one part that was left to remove', () => {
        // .why = duct.stop used to `return 0` on an absent session BEFORE it
        //        unregistered the row. so the single case where the row is all
        //        that remains was the single case it refused to clean, and a
        //        re-run could not heal it either — the phantom is exactly the
        //        state the early return declines to touch.
        //
        //        that is the live cause of rows that read `💥 malfunction` on
        //        every poll, against trees that were felled on purpose.
        //
        //        its comment cited the idempotent-del family as the reason for
        //        the early return, which misreads `no-op` as "do naught"
        //        rather than "converge to absent". the ROW is part of the
        //        state that must converge (rule.require.get-set-gen-verbs).
        expect(existsSync(scene.row)).toEqual(false);
      });
    });
  });

  given('[case8] a caller who gives a bad uri', () => {
    const socket = genSocket('baduri');
    afterAll(() => delTmuxServer({ socket }));

    for (const verb of ['duct.open', 'duct.stop', 'duct.read']) {
      when(`[t0] ${verb} runs with no --on`, () => {
        const result = useBeforeAll(async () =>
          runDuct({
            body: verb,
            socket,
            ductworkDir: tempDirs.genOne({ slug: 'registry' }),
          }),
        );

        then('it reports a constraint', () => {
          expect(result.exit).toEqual(2);
          expect(result.stderr).toContain('--on required');
        });
      });
    }

    when('[t0] duct.open runs with no --cwd', () => {
      const result = useBeforeAll(async () =>
        runDuct({
          body: `duct.open --on 'duct:///${TREE}/nocwd'`,
          socket,
          ductworkDir: tempDirs.genOne({ slug: 'registry' }),
        }),
      );

      then('it still opens — --cwd is optional at the lib grain', () => {
        // crewwork is what REQUIRES a --cwd, because only crewwork knows the
        // tree. the lib below it stays usable for a duct with no tree at all.
        expect(result.exit).toEqual(0);
      });
    });

    ////////////////////////////////////////////////////////////////////
    // .why = `--on` is a whole-SEGMENT scope, and a `*` in it is stripped
    //        as decoration. so a PARTIAL-segment pattern used to answer
    //        `(none)` — byte-identical to "no such duct here", from a
    //        machine that plainly held one. that is the `false report`
    //        species this repo already catalogs for `duct.list --on`,
    //        caught live on 2026-08-09 against a real tree.
    //
    //        these clamps hold BOTH sides. the refusal alone would be
    //        vacuous if it also refused the legal shapes, so [t2] and
    //        [t3] prove the two documented forms still pass.
    ////////////////////////////////////////////////////////////////////
    when('[t1] duct.list runs with a PARTIAL-segment star', () => {
      const result = useBeforeAll(async () =>
        runDuct({
          body: `duct.open --on 'duct:///${TREE}/mechanic' --cwd /tmp\nduct.list --on 'duct:///${TREE.slice(0, 4)}*'`,
          socket,
          ductworkDir: tempDirs.genOne({ slug: 'registry' }),
        }),
      );

      then('it fail-fasts rather than reports a hollow (none)', () => {
        expect(result.exit).toEqual(2);
      });

      then('the error names the scope semantics AND the fix', () => {
        expect(result.stderr).toContain('whole-segment SCOPE, not a glob');
        expect(result.stderr).toContain('duct.list');
      });

      then('it never renders the ambiguous verdict', () => {
        // the whole point: `(none)` from a bad filter is the untruth
        expect(result.stdout).not.toContain('(none)');
      });
    });

    when('[t2] duct.list runs with a WHOLE-segment star', () => {
      const result = useBeforeAll(async () =>
        runDuct({
          body: `duct.open --on 'duct:///${TREE}/mechanic' --cwd /tmp\nduct.list --on 'duct:///${TREE}/*'`,
          socket,
          ductworkDir: tempDirs.genOne({ slug: 'registry' }),
        }),
      );

      then('it still works — the legal form is untouched', () => {
        expect(result.exit).toEqual(0);
        expect(result.stdout).toContain(`${TREE}/mechanic`);
      });
    });

    when('[t3] duct.list runs with a bare local star', () => {
      const result = useBeforeAll(async () =>
        runDuct({
          body: `duct.open --on 'duct:///${TREE}/mechanic' --cwd /tmp\nduct.list --on 'duct:///*'`,
          socket,
          ductworkDir: tempDirs.genOne({ slug: 'registry' }),
        }),
      );

      then('it still works — a bare star is a whole segment', () => {
        expect(result.exit).toEqual(0);
        expect(result.stdout).toContain(`${TREE}/mechanic`);
      });
    });
  });

  given('[case9] the seam itself', () => {
    // these two invoke no tmux at all — they only render the prefix — so no
    // server starts. the sockets are still named + torn down, so a future
    // edit that DOES invoke tmux cannot silently start leaking one.
    const socketOff = genSocket('seamoff');
    const socketOn = genSocket('seamon');
    afterAll(() => {
      delTmuxServer({ socket: socketOff });
      delTmuxServer({ socket: socketOn });
    });

    then('__duct_tmux_cmd emits a bare tmux, with its own tail space', () => {
      // .why = the remote call sites concatenate this prefix directly:
      //          "$(__duct_tmux_cmd)has-session -t ..."
      //        so a prefix that lost its tail space would produce
      //        `tmuxhas-session` — a command not found, at a remote, under
      //        ssh, which is the worst place to debug an absent space.
      const result = runDuct({
        body: [
          'DUCTWORK_TMUX_SOCKET=""',
          'printf "[%s]" "$(__duct_tmux_cmd)"',
        ].join('\n'),
        socket: socketOff,
        ductworkDir: tempDirs.genOne({ slug: 'registry' }),
      });
      expect(result.stdout).toContain('[tmux ]');
    });

    then('__duct_tmux_cmd carries -L when the seam is ON', () => {
      const result = runDuct({
        body: 'printf "[%s]" "$(__duct_tmux_cmd)"',
        socket: socketOn,
        ductworkDir: tempDirs.genOne({ slug: 'registry' }),
      });
      expect(result.stdout).toContain(`[tmux -L '${socketOn}' ]`);
    });
  });

  // .why LAST: every prior case tears down in its own afterAll, and jest runs
  //      a describe's afterAll before it moves to the next describe. so by the
  //      time this runs, every case above has had its chance to clean up.
  given('[case10] the litter this file leaves behind', () => {
    when('[t0] a live server is torn down through delTmuxServer', () => {
      // .why = the FIRST draft of this case checked only the socket FILE at
      //        end-of-suite, and it stayed GREEN through runs that each left
      //        a real file in /tmp. a clamp that cannot go red under the live
      //        defect proves naught (rule.require.clamp-edge-cases).
      //
      //        it read the wrong subject. tmux unlinks its socket EARLY in
      //        shutdown, so "the file is gone" is true long before the server
      //        is — and a teardown that returns inside that window has not
      //        finished. the file is a PROXY; the SERVER is the subject.
      const socket = genSocket('litter');
      const scene = useBeforeAll(async () => {
        const opened = runDuct({
          body: `duct.open --on 'duct:///littertree/mechanic' --cwd /tmp`,
          socket,
          ductworkDir: tempDirs.genOne({ slug: 'registry' }),
        });
        const upBefore = hasTmuxServer({ socket });
        delTmuxServer({ socket });
        return { opened, upBefore };
      });

      then('the scene really had a live server to tear down', () => {
        // without this, both clamps below pass over an absent server — a
        // partial audit, and invisible from the verdict
        expect(scene.opened.exit).toEqual(0);
        expect(scene.upBefore).toEqual(true);
      });

      then('NO server answers on that socket once it returns', () => {
        expect(hasTmuxServer({ socket })).toEqual(false);
      });

      then('the socket FILE is gone too', () => {
        expect(existsSync(getSocketPath({ socket }))).toEqual(false);
      });
    });

    when('[t1] the file sweeps every socket it ever created', () => {
      // .why = these live in a SHARED /tmp. six runs of an earlier draft left
      //        43 files there, and a suite that litters a shared dir is one
      //        nobody wants to run often.
      //
      // .note = this sweeps FIRST, then asserts, and the order is the point.
      //        an assert-only check clamps "no litter exists", which is NOT
      //        this file's to guarantee: a duct's pane inherits
      //        DUCTWORK_TMUX_SOCKET, so an actor OUTSIDE this process can and
      //        does plant a session in a test server after its teardown — we
      //        caught one, by argv:
      //          tmux -S …/ductwork-test-send-… new-session -d \
      //               -s rhachet_beav_feat-keyrack-unlock-scope/foreman
      //
      //        so the honest claim is narrower and still worth teeth: this
      //        file's own cleanup CONVERGES. it runs the teardown, and what
      //        it leaves after that is what it is accountable for.
      const swept = useBeforeAll(async () => {
        for (const socket of SOCKETS_MADE) delTmuxServer({ socket });
        return {
          survivors: [...SOCKETS_MADE]
            .filter((socket) => existsSync(getSocketPath({ socket })))
            .map((socket) => ({
              socket,
              up: hasTmuxServer({ socket }),
              procs: getTestServerProcs({ socket }),
            })),
        };
      });

      then('NOT ONE survives that sweep', () => {
        //        it reports the STATE of each survivor, never just its name.
        //        a bare list says a file is here and leaves the next reader to
        //        re-derive why; `up` + `procs` says whether a server still
        //        answers and WHICH command spawned it — the argv is what
        //        turned this from a mystery into a named actor.
        expect(swept.survivors).toEqual([]);
      });
    });

    // .why = the litter sweep every part runs at boot once killed EVERY test
    //        server on the box. this suite is cut into parts that jest runs in
    //        parallel, so one part's boot reaped a peer's server mid-case and a
    //        send read back an empty pane. the two cases below are its clamp:
    //        the sweep spares a live run's server, and still reaps a dead one's.
    when('[t2] a litter sweep meets a server whose owner still runs', () => {
      const socket = genSocket('spared');
      const scene = useBeforeAll(async () => {
        const opened = runDuct({
          body: `duct.open --on 'duct:///sparedtree/mechanic' --cwd /tmp`,
          socket,
          ductworkDir: tempDirs.genOne({ slug: 'registry' }),
        });
        const upBefore = hasTmuxServer({ socket });
        delStaleTestServers();
        return { opened, upBefore };
      });

      then('the scene really had a live server to spare', () => {
        expect(scene.opened.exit).toEqual(0);
        expect(scene.upBefore).toEqual(true);
      });

      then('🔴 the server still answers — a live run is never litter', () => {
        expect(hasTmuxServer({ socket })).toEqual(true);
      });
    });

    when('[t3] a litter sweep meets a server whose owner has exited', () => {
      // a pid that provably ran and exited — the shape a crashed run leaves
      const ownerGone = spawnSync('true').pid;
      const socket = `${PREFIX_TEST_SOCKET}orphan-${ownerGone}-${Math.random()
        .toString(36)
        .slice(2, 8)}`;
      SOCKETS_MADE.add(socket);
      const scene = useBeforeAll(async () => {
        const opened = runDuct({
          body: `duct.open --on 'duct:///orphantree/mechanic' --cwd /tmp`,
          socket,
          ductworkDir: tempDirs.genOne({ slug: 'registry' }),
        });
        const upBefore = hasTmuxServer({ socket });
        const reaped = delStaleTestServers();
        return { opened, upBefore, reaped };
      });

      then('the scene really had an orphan server to reap', () => {
        expect(scene.opened.exit).toEqual(0);
        expect(scene.upBefore).toEqual(true);
      });

      then('the sweep reaps it', () => {
        expect(scene.reaped).toBeGreaterThan(0);
        expect(getTestServerPids({ socket })).toEqual([]);
      });
    });
  });
});
