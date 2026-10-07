/**
 * .what = the tier-3 clamps: termwork, against its two REAL seams
 *
 * .why  = an earlier draft of both radio seeds named this tier "not built —
 *         needs a display", and that was wrong. it did not need a display; it
 *         needed a SEAM, exactly as ductwork did before DUCTWORK_TMUX_SOCKET
 *         existed. the two are now built:
 *
 *           TERMWORK_DIR        — a private registry, no live rows in reach
 *           TERMWORK_SOCKET_DIR — a private socket dir, no live windows either
 *
 *         and once they exist, most of termwork turns out to be clampable with
 *         NO display at all. that is the finding worth the file: the defects
 *         that cost real time (a re-run that erased a peer's tab, a socket
 *         handshake keyed on a pid) live in the REGISTRY and in the PATH
 *         DERIVATION — neither of which needs a window to be wrong.
 *
 * .there is ONE tier, and no display is needed
 *
 *         this file once declared TWO — a [registry] tier that runs anywhere,
 *         and a [spawn] tier that "needs xvfb, because kitty has no headless
 *         mode". the spawn tier was never built. every body below drives the
 *         registry functions against a FAKE pid (4242); not one spawns kitty.
 *         so the xvfb probe demanded an install that no test here consumes,
 *         and failed the suite loud to say so — an assertion wider than any
 *         claim the file makes.
 *
 * .why there will never BE a spawn tier — a term is HEADED by definition
 *
 *         the two substrates sit on opposite sides of this, and it is not a
 *         detail of the harness but of the domain:
 *
 *           duct (tmux)   HEADLESS by nature — an addressable keyboard, which
 *                         needs no human and no screen. clampable anywhere.
 *           term (kitty)  HEADED by nature — it exists SO THAT a human looks
 *                         at it. that is the whole of the view axis.
 *
 *         so "a headless kitty" is a contradiction, and a spawn driven onto a
 *         fake screen proves only that the spawn works on a fake screen —
 *         never the property that makes a term a term. the display was never
 *         the absent piece; it is not a piece at all.
 *
 *         what termwork actually owns, and what the defects actually were, is
 *         the REGISTRY and the PATH DERIVATION — which is what the .why above
 *         already said, and what the two-tier split then contradicted.
 *
 * .note = every teardown here converges on the PROCESS TABLE, never on socket
 *         reachability. that is not caution — it is the exact defect the tmux
 *         teardown earned the hard way the same day, where an unlinked socket
 *         made live servers unreachable and unreachable read as down. the
 *         instrument manufactured its own verdict
 *         (term=false-report._.choice._.md). applied here in advance.
 */
import {
  existsSync,
  mkdtempSync,
  readFileSync,
  utimesSync,
  writeFileSync,
} from 'fs';
import { MalfunctionError } from 'helpful-errors';
import { tmpdir } from 'os';
import { join } from 'path';
import { given, then, useBeforeAll, when } from 'test-fns';

import { tempDirs } from '../../../.test/tempDirs';
import {
  delStaleTestDirs,
  delTestTerms,
  genTermSocketDir,
  getTestTermPids,
  getTestTermProcs,
  PATH_TERMWORK,
  PREFIX_TEST_TERM,
  runTerm,
} from './work.harness';

/** every socket dir this file makes, so the final sweep can prove it left none */
const DIRS_MADE: string[] = [];

const genSocketDir = (input: { slug: string }): string => {
  const dir = genTermSocketDir(input);
  DIRS_MADE.push(dir);
  return dir;
};

/** .what = read a terminal's registry row, as the filesystem holds it */
const readRow = (input: { termworkDir: string; pid: string }): any =>
  JSON.parse(
    readFileSync(join(input.termworkDir, `${input.pid}.json`), 'utf8'),
  );

beforeAll(() => {
  // .why = a crashed run leaves live kitties bound into its socket dir. the
  //        dir may be gone (mkdtemp under /tmp gets swept) while the process
  //        lives on, so the PROCESS scan is the one that can see them.
  delTestTerms();

  // .why = the process scan above reaps the kitties and leaves their DIRS. a
  //        run killed before its afterAll therefore leaks one dir per case,
  //        forever, since the next run's sweep only knows what IT made. that
  //        is how /tmp reached 1800+ `work-test-*` dirs before anyone looked.
  delStaleTestDirs();
});

afterAll(() => {
  // .why = [case7] sweeps DIRS_MADE *at the moment it runs*, which is not the
  //        same set as "every dir this file made". two ways that came apart,
  //        both observed:
  //          - ORDER — [case8] registers a dir AFTER [case7] has iterated, so
  //            two `prefixcheck` dirs survived every full run while [case7]
  //            reported `NOT ONE dir survives it` in green
  //          - SCOPE — a `--scope case4` run filters [case7] out entirely, so
  //            its dir had no sweep at all
  //        that is a `partial audit`: a subject set narrower than the claim,
  //        invisible from the verdict. the cure is a teardown that cannot be
  //        ordered or scoped around, which is what an afterAll is.
  for (const socketDir of DIRS_MADE) delTestTerms({ socketDir });
  tempDirs.delAll();

  // fail LOUD on litter rather than swallow it — a teardown that reports what
  // it tore down is a party with the motive and the means to make its own
  // report come true (term=false-report, the observer-broke-the-proxy species)
  const survivors = DIRS_MADE.filter((dir) => existsSync(dir));
  const strays = getTestTermPids();
  if (survivors.length || strays.length)
    throw new Error(
      `termwork suite left litter behind.\n` +
        `  dirs: ${JSON.stringify(survivors)}\n` +
        `  pids: ${JSON.stringify(strays)}\n` +
        `  why: a suite that litters the shared /tmp is not hermetic over time.`,
    );
});

describe('termwork', () => {
  // -------------------------------------------------------------------------
  // tier 1 — the seams themselves
  // -------------------------------------------------------------------------

  given('[case1] the two seams, as a caller sets them', () => {
    const scene = useBeforeAll(async () => {
      const termworkDir = tempDirs.genOne({ slug: 'term-reg' });
      const socketDir = genSocketDir({ slug: 'seam' });
      const run = runTerm({
        termworkDir,
        socketDir,
        body: [
          '__term_ensure_dir',
          'echo "REG=$TERMWORK_DIR"',
          'echo "SOCK=$TERMWORK_SOCKET_DIR"',
        ].join('\n'),
      });
      return { termworkDir, socketDir, run };
    });

    when('[t0] termwork is sourced with both set', () => {
      then('it honors the registry seam, never $HOME/.termwork', () => {
        expect(scene.run.stdout).toContain(`REG=${scene.termworkDir}`);
        expect(scene.run.stdout).not.toContain('/.termwork');
      });

      then('it honors the socket seam, never a bare /tmp', () => {
        // .why = the socket dir is the half that was ABSENT until this suite.
        //        with only the registry seam, a test writes its rows privately
        //        and then binds into the shared /tmp — where a slug collision
        //        reaches the operator's own window.
        expect(scene.run.stdout).toContain(`SOCK=${scene.socketDir}`);
      });

      then('both dirs exist on disk once ensure has run', () => {
        expect({
          registry: existsSync(scene.termworkDir),
          sockets: existsSync(scene.socketDir),
        }).toEqual({ registry: true, sockets: true });
      });
    });
  });

  given('[case2] a caller who sets NEITHER seam', () => {
    when('[t0] the defaults are read', () => {
      then('they fall back to the operator paths, unchanged', () => {
        // .why = the seam must be additive. a lib that REQUIRED the env vars
        //        would break every human caller, and the whole point is that a
        //        supervisor's daily use is untouched by the test seam.
        const body = readFileSync(PATH_TERMWORK, 'utf8');
        expect(body).toContain(
          'TERMWORK_DIR="${TERMWORK_DIR:-$HOME/.termwork}"',
        );
        expect(body).toContain(
          'TERMWORK_SOCKET_DIR="${TERMWORK_SOCKET_DIR:-/tmp}"',
        );
      });
    });
  });

  given('[case3] the socket path, as term.open derives it', () => {
    const scene = useBeforeAll(async () => {
      const body = readFileSync(PATH_TERMWORK, 'utf8');
      // strip comments — a claim proven by a COMMENT is proven by naught
      const code = body
        .split('\n')
        .filter((line) => !/^\s*#/.test(line))
        .join('\n');
      return { code };
    });

    when('[t0] the derivation is read, comments stripped', () => {
      then('the subject exists — the clamp is not vacuous', () => {
        // anti-vacuity: a strip one step too far would empty the subject and
        // make every assertion below pass against an absent body (partial audit)
        expect(scene.code).toContain('sockpath=');
        expect(scene.code.length).toBeGreaterThan(1000);
      });

      then('NO bind hardcodes /tmp — every one goes through the seam', () => {
        // .why = one missed site is one path from a test to the operator's own
        //        window, and it would stay invisible until the day it mattered
        //        (rule.require.hermetic-tests). completeness IS the guarantee.
        const binds = scene.code
          .split('\n')
          .filter((line) => line.includes('/tmp/kitty'));
        expect(binds).toEqual([]);
      });

      then('the path is derived from the DUCT SLUG, never a pid', () => {
        // .why = defect #4. term.open used to spawn with listen_on={kitty_pid}
        //        and then recover the pid with `pgrep -n kitty` — "the newest
        //        kitty on the box". those are not the same process: --detach
        //        forks, and any concurrent spawn wins the -n race. 10 parallel
        //        spawns failed 10/10 against live, healthy windows.
        expect(scene.code).toContain('sock_slug="duct-');
        expect(scene.code).toContain(
          '${TERMWORK_SOCKET_DIR}/kitty-${sock_slug}',
        );
      });

      then('NO pgrep -n takes part in the handshake', () => {
        // the un-fixed code read `pgrep -n kitty`; the fix reads
        // `pgrep -f listen_on=<the path we chose>`, which names one process
        expect(scene.code).not.toMatch(/pgrep\s+-n\s+kitty/);
      });
    });
  });

  given(
    '[case6] the tab LABEL, as every site that titles a tab derives it',
    () => {
      // .why = three sites set a tab title — the launch, the findsert-converge
      //        repaint, and the base tab — and all three go through
      //        `__term_tab_label`. so the label is a one-function seam, and it
      //        had a measured defect with the seam already in place: the glyph
      //        was applied at LAUNCH only, so `term.open`'s findsert path
      //        reported `found` and set no title. on ship day every extant tab
      //        was reached by that path, so the feature landed on zero tabs
      //        while its own report read green.
      //
      //        it stayed unclamped after the repair, which is what makes it owed
      //        (rule.require.clamp-edge-cases). what CANNOT be clamped here is
      //        the converge path itself — that needs a live kitty, and a term is
      //        HEADED by definition (see the header). so this clamps the
      //        derivation, and the three call sites are held by a grep below.
      const scene = useBeforeAll(async () => {
        const termworkDir = tempDirs.genOne({ slug: 'term-label' });
        const socketDir = genSocketDir({ slug: 'label' });
        const run = runTerm({
          termworkDir,
          socketDir,
          // 🔴 every slug here is a REACHABLE one. a tab is named for a ROLE, never
          //    for a tree — `crew.show` passes the tree as `--on` (the window) and
          //    the role as `--tab`/`--for`, and `base_label="$tab"` carries that
          //    same role into the base tab. so the whole reachable set is the four
          //    seats plus the base tab's default.
          //
          //    ⚠️ an earlier fixture fed a tree slug through here to get a long
          //       string. it went green and proved naught — a clamp aimed at an
          //       input shape no caller produces.
          //
          // .the pairs below are the two REAL mixed-window arrangements:
          //    a cloud crew (3 cloud seats + the local reviewer) and a local crew
          //    (every seat local). the first is the arrangement the glyph exists for.
          body: [
            // slug:host — an empty host is the LOCAL end of the axis
            'for pair in "main:cloud://grove-x" "mechanic:cloud://grove-x" \\',
            '            "foreman:cloud://grove-x" "reflector:cloud://grove-x" \\',
            '            "reviewer:" \\',
            '            "main:" "mechanic:" "reviewer:"; do',
            '  slug="${pair%%:*}"',
            '  host="${pair#*:}"',
            '  printf "LABEL\\t%s\\t%s\\t%s\\n" "$slug" "$host" "$(__term_tab_label "$slug" "$host")"',
            'done',
          ].join('\n'),
        });
        const labels = run.stdout
          .split('\n')
          .filter((line) => line.startsWith('LABEL\t'))
          .map((line) => {
            const [, slug, host, label] = line.split('\t');
            // 🔴 the printf above emits all four fields, so a short line is a
            //    malfunction of this harness. it fails LOUD rather than defaults
            //    to '' — an empty slug and label satisfy `label.endsWith(slug)`
            //    vacuously, which is the exact toothless pass [t2] exists to catch
            if (slug === undefined || label === undefined)
              MalfunctionError.throw(
                'a LABEL line carried fewer than four fields',
                { line },
              );
            return { slug, host: host || '(local)', label };
          });
        return { run, labels };
      });

      when('[t0] a label is derived for each end of the host axis', () => {
        then('the subject exists — the clamp is not vacuous', () => {
          // anti-vacuity: a body that failed to source would yield zero rows,
          // and every filter-and-count assertion below would pass over an empty set
          expect(scene.labels).toHaveLength(8);
        });

        then('the tab bar reads as a human sorts it', () => {
          // .why = a SNAPSHOT, because this is the one property a human reviews
          //        with their eyes rather than a predicate. the glyph pair is a
          //        display contract: a reviewer who reads a PR diff must be able
          //        to SEE what the tab bar will look like, and no assertion about
          //        "starts with ☁️" shows them that. a swap, a width change, or a
          //        lost space all surface here as a visible diff.
          expect(scene.labels).toMatchSnapshot();
        });

        then('a CLOUD tab is marked ☁️, a LOCAL tab ☘️', () => {
          // .why = one axis, two ends, and the cost of a wrong read is real: the
          //        reviewer seat is the first seat whose duct does NOT follow its
          //        crew's host, so a human with a grove window open must be able
          //        to tell at a glance which tab replies from their own box.
          expect(
            scene.labels.map(
              (row) =>
                `${row.host === '(local)' ? 'L' : 'C'}=${row.label.slice(0, 2)}`,
            ),
          ).toEqual(['C=☁️', 'C=☁️', 'C=☁️', 'C=☁️', 'L=☘️', 'L=☘️', 'L=☘️', 'L=☘️']);
        });

        then('the glyphs DIFFER — the mark is not decorative', () => {
          // anti-vacuity: one glyph for both ends would satisfy "every label
          // carries a glyph" and sort nobody
          const glyphs = new Set(
            scene.labels.map((row) => row.label.slice(0, 2)),
          );
          expect(glyphs.size).toEqual(2);
        });

        then('🔴 the CLEAN SLUG survives verbatim, as a suffix', () => {
          // 🔴 the clamp that carries the weight. `__term_tab_match` falls back
          //    to `title:$slug` when a tab has no kitty id on record, and kitty's
          //    `title:` match is an UNANCHORED regex — which is the only reason a
          //    decorated tab is still findable. so the decoration may only ever
          //    PREFIX. a label that truncated, reordered, or re-cased the slug
          //    would break every id-less lookup, and the breakage would read as
          //    "tab absent" rather than as a label defect.
          expect(
            scene.labels.filter((row) => row.label.endsWith(row.slug)),
          ).toHaveLength(scene.labels.length);
        });
      });

      when('[t1] the sites that title a tab are read', () => {
        then(
          'NO site hardcodes a glyph — every one goes through the seam',
          () => {
            // .why = completeness IS the guarantee, exactly as [case3] argues for
            //        the socket binds. one site that spelled the glyph inline would
            //        drift the day the pair changes, and it would drift SILENTLY —
            //        a wrong glyph still opens a healthy tab.
            const body = readFileSync(PATH_TERMWORK, 'utf8');
            const code = body
              .split('\n')
              .filter((line) => !/^\s*#/.test(line))
              .join('\n');
            const inline = code.split('\n').filter((line) => /☁️|☘️/.test(line));
            expect(inline).toEqual([
              `  if [[ -n "$host" ]]; then printf '☁️'; else printf '☘️'; fi`,
            ]);
          },
        );

        then('🔴 the seam is the GLYPH, and every composer reaches it', () => {
          // 🔴 the tooth the prior shape was short of. [t1] above proves no
          //    line SPELLS a glyph — it cannot prove a seam still exists, so a
          //    delete of __term_host_glyph plus its two callers would pass it
          //    with an empty array. measured 2026-09-19: a second composer (the
          //    `where` column) drifted in precisely because the seam was the
          //    LABEL, so a caller that wanted the bare mark had naught to call.
          const body = readFileSync(PATH_TERMWORK, 'utf8');

          // ANTI-VACUITY: the seam is declared
          expect(body).toContain('__term_host_glyph() {');

          // and the label composes it, rather than a second copy of the pair
          expect(body).toContain(
            `printf '%s %s' "$(__term_host_glyph "$host")" "$slug"`,
          );

          // and the where column composes it too — both arms, not one
          const callers = body
            .split('\n')
            .filter((line) => /\$\(__term_host_glyph/.test(line));
          expect(callers.length).toBeGreaterThanOrEqual(3);
        });

        then('the REGISTRY is keyed on the clean slug, never the label', () => {
          // .why = the twin of the suffix clamp above, from the write side. a
          //        `__term_register_tab "$label"` would put a glyph into the
          //        record, and then `--tab reviewer` would miss its own tab.
          const body = readFileSync(PATH_TERMWORK, 'utf8');
          expect(body).toContain(
            '__term_register_tab "$pid" "$base_tab" "$base_id"',
          );
          expect(body).not.toMatch(/__term_register_tab[^\n]*\$label/);
        });
      });
    },
  );

  // -------------------------------------------------------------------------
  // tier 2 — the registry, driven for real (no display needed)
  // -------------------------------------------------------------------------

  given('[case4] a terminal registered with two role tabs', () => {
    const scene = useBeforeAll(async () => {
      const termworkDir = tempDirs.genOne({ slug: 'term-tabs' });
      const socketDir = genSocketDir({ slug: 'tabs' });
      const run = runTerm({
        termworkDir,
        socketDir,
        body: [
          '__term_register 4242 "unix:/x" "/cwd" "tree/mechanic" ""',
          '__term_register_tab 4242 mechanic 1',
          '__term_register_tab 4242 foreman 2',
        ].join('\n'),
      });
      return { termworkDir, socketDir, run };
    });

    when('[t0] both tabs are recorded', () => {
      then('the row carries both, in order', () => {
        const row = readRow({ termworkDir: scene.termworkDir, pid: '4242' });
        expect(row.tabs.map((t: any) => t.slug)).toEqual([
          'mechanic',
          'foreman',
        ]);
      });
    });

    when('[t1] the terminal is re-registered via keep_tabs', () => {
      const after = useBeforeAll(async () => {
        runTerm({
          termworkDir: scene.termworkDir,
          socketDir: scene.socketDir,
          body: '__term_register_keep_tabs 4242 "unix:/y" "/cwd2" "tree/mechanic" ""',
        });
        return readRow({ termworkDir: scene.termworkDir, pid: '4242' });
      });

      then('BOTH tabs survive — a re-run does not erase a peer', () => {
        // .why = defect #2, and the sharpest one in the lib. term.open's
        //        idempotency branch called __term_register, which always writes
        //        "tabs": []. so a second `--for mechanic` erased the foreman
        //        entry the first `--for foreman` had written: a re-run that
        //        DESTROYED a peer's state where a no-op was owed
        //        (rule.require.idempotent-procedures).
        expect(after.tabs.map((t: any) => t.slug)).toEqual([
          'mechanic',
          'foreman',
        ]);
      });

      then('the fields it was asked to update DID change', () => {
        // anti-vacuity: a keep_tabs that changed naught would also "keep" the
        // tabs. the clamp above must not pass on a no-op.
        expect({ socket: after.socket, cwd: after.cwd }).toEqual({
          socket: 'unix:/y',
          cwd: '/cwd2',
        });
      });
    });

    when('[t2] a tab slug is re-registered', () => {
      const after = useBeforeAll(async () => {
        runTerm({
          termworkDir: scene.termworkDir,
          socketDir: scene.socketDir,
          body: '__term_register_tab 4242 foreman 99',
        });
        return readRow({ termworkDir: scene.termworkDir, pid: '4242' });
      });

      then('it is findserted, never duplicated', () => {
        expect(
          after.tabs.filter((t: any) => t.slug === 'foreman'),
        ).toHaveLength(1);
      });

      then('its kittyId is updated to the new one', () => {
        const foreman = after.tabs.find((t: any) => t.slug === 'foreman');
        expect(foreman.kittyId).toEqual(99);
      });
    });
  });

  given('[case5] a registry row that is absent or corrupt', () => {
    const scene = useBeforeAll(async () => {
      const termworkDir = tempDirs.genOne({ slug: 'term-corrupt' });
      const socketDir = genSocketDir({ slug: 'corrupt' });
      writeFileSync(join(termworkDir, '777.json'), '{ this is not json');
      return { termworkDir, socketDir };
    });

    when('[t0] keep_tabs meets an UNREADABLE row', () => {
      const after = useBeforeAll(async () => {
        const run = runTerm({
          termworkDir: scene.termworkDir,
          socketDir: scene.socketDir,
          body: '__term_register_keep_tabs 777 "unix:/z" "/c" "t/m" ""',
        });
        return {
          run,
          row: readRow({ termworkDir: scene.termworkDir, pid: '777' }),
        };
      });

      then('it converges to a valid row rather than fail', () => {
        // .why = a corrupt row must not wedge the terminal forever. keep_tabs
        //        falls back to a fresh write, which is the right call when
        //        there are provably no tabs to keep.
        expect(after.row.socket).toEqual('unix:/z');
        expect(after.row.tabs).toEqual([]);
      });
    });

    when('[t1] register_tab meets an ABSENT row', () => {
      const after = useBeforeAll(async () =>
        runTerm({
          termworkDir: scene.termworkDir,
          socketDir: scene.socketDir,
          body: '__term_register_tab 55555 mechanic 1; echo "RC=$?"',
        }),
      );

      then('it FAILS LOUD rather than drop the tab silently', () => {
        // .why = the caller holds the lock and has already verified the
        //        terminal is alive, so an absent row here is an invalid state.
        //        to swallow it would lose the tab and report success — a false
        //        report manufactured by a failhide (rule.forbid.failhide).
        expect(after.stdout).toContain('RC=1');
        expect(after.stderr).toContain('__term_register_tab');
      });
    });
  });

  // -------------------------------------------------------------------------
  // tier 3 — a real kitty, on a display nobody watches
  // -------------------------------------------------------------------------

  // .note = a `the substrate this tier needs` case sat here, and asserted
  //         that kitty AND xvfb were installed. both probes were consumed by
  //         that case ALONE — no other case, and no harness helper, ever
  //         called them, and not one body here spawns kitty. so it demanded a
  //         substrate on behalf of a tier that does not exist, and turned the
  //         whole suite red on a machine that lacks xvfb.
  //
  //         the error it threw was worse than the failure: it read "the
  //         termwork spawn tier needs this", which tells a reader that real
  //         coverage is blocked. no coverage was blocked. the honest reading
  //         is that a term is HEADED by definition (see the header), so the
  //         tier it guarded was never buildable in the first place.
  //
  //         removed rather than skipped: a skip would have kept the same false
  //         claim, quieter.

  // -------------------------------------------------------------------------
  // the sweep — proven against the PROCESS TABLE, never reachability
  // -------------------------------------------------------------------------

  // .note = this clamp proves the SWEEP works, over the dirs made so far. it is
  //         NOT the suite's litter guarantee — that is the afterAll above, which
  //         no test order or --scope filter can step around. read the two
  //         together: this one is the mechanism, that one is the promise.
  given('[case7] every socket dir made BEFORE this point', () => {
    when('[t0] the suite sweeps them', () => {
      const swept = useBeforeAll(async () => {
        const made = DIRS_MADE.length;
        for (const socketDir of DIRS_MADE) delTestTerms({ socketDir });
        return {
          made,
          survivors: DIRS_MADE.filter((dir) => existsSync(dir)).map((dir) => ({
            dir,
            procs: getTestTermProcs({ socketDir: dir }),
          })),
          strays: getTestTermPids(),
        };
      });

      then('there were some to sweep — the clamp is not vacuous', () => {
        // .why = a sweep over an empty set passes trivially. r58 named that
        //        shape a `partial audit`: a subject set narrower than the
        //        claim, invisible from the verdict.
        expect(swept.made).toBeGreaterThan(0);
      });

      then('NOT ONE dir survives it', () => {
        expect(swept.survivors).toEqual([]);
      });

      then('NO kitty process is left bound to a test socket dir', () => {
        // .why = the dir sweep above reads the FILESYSTEM, and a process can
        //        outlive its socket dir entirely. that is precisely the orphan
        //        worth reaping, and only the process table can see it.
        expect(swept.strays).toEqual([]);
      });
    });
  });

  given('[case8] the test-term scan, aimed outside its own prefix', () => {
    when('[t0] a caller asks it to sweep a NON-test dir', () => {
      then('it REFUSES rather than reap the operator windows', () => {
        // .why = the sweep kills by argv match, so its needle is the only
        //        thing between it and a human's live terminal. a needle that
        //        did not carry the test prefix would match every kitty on the
        //        box. this is the clamp that keeps the blast radius honest.
        expect(() => getTestTermPids({ socketDir: '/tmp' })).toThrow(
          /refuses a socket dir outside the test prefix/,
        );
      });

      then('the prefix it demands is the one the generator writes', () => {
        // anti-vacuity: a refusal keyed on a prefix no generator uses would
        // reject every real call too, and the clamp above would still pass
        const dir = genTermSocketDir({ slug: 'prefixcheck' });
        DIRS_MADE.push(dir);
        expect(dir).toContain(PREFIX_TEST_TERM);
        expect(() => getTestTermPids({ socketDir: dir })).not.toThrow();
      });
    });
  });

  given('[case9] the stale sweep, run beside a PARALLEL worker', () => {
    // .why = jest runs each suite in its own worker, at once. so when termwork
    //        sweeps, ductwork holds live dirs that termwork's DIRS_TEMP knows
    //        naught about. an unbounded sweep reaps those and kills a peer
    //        mid-flight — a flake that would surface as ductwork's failure,
    //        never as termwork's, and so would be diagnosed at the wrong file.
    //
    //        AGE is the discriminator: a peer's dir is seconds old, a corpse is
    //        minutes. these two clamps are a PAIR — either alone is vacuous.
    const scene = useBeforeAll(async () => {
      // .note = mkdtemp DIRECTLY, never genTempDir. the sweep skips every dir
      //         in this process's own registry, so a registered pair would make
      //         BOTH clamps vacuous — the fresh one survives for the wrong
      //         reason, and the stale one never gets considered at all.
      //         the TERM prefix, not the TEMP one, so the afterAll's own
      //         delTestTerms can accept it (its scan refuses a needle outside
      //         the term prefix — see [case8]).
      const mk = (slug: string): string => {
        const dir = mkdtempSync(join(tmpdir(), `${PREFIX_TEST_TERM}${slug}-`));
        DIRS_MADE.push(dir); // so the afterAll still owns its cleanup
        return dir;
      };
      const fresh = mk('staleguard-fresh');
      const stale = mk('staleguard-stale');

      // backdate one past the window; leave its twin at now
      const past = new Date(Date.now() - 90 * 60 * 1000);
      utimesSync(stale, past, past);

      const dropped = delStaleTestDirs();
      return { fresh, stale, dropped };
    });

    when('[t0] the sweep has run', () => {
      then('a FRESH dir survives — a peer is never reaped', () => {
        expect(existsSync(scene.fresh)).toEqual(true);
      });

      then(
        'a dir past the window is dropped — the bound is not vacuous',
        () => {
          // without this, a sweep that reaped NOT ONE dir would still pass the
          // clamp above, and the age bound would guard naught
          expect(existsSync(scene.stale)).toEqual(false);
          expect(scene.dropped).toContain(scene.stale);
        },
      );
    });
  });
});
