/**
 * .what = clamps on the LAYOUT of the surface — which skills and libs exist, what they source, how they parse
 *
 * .note = a PART of the `work.surface` suite, cut so one reviewer can hold
 *         it whole. the suite's shared fixtures, and its account of what it
 *         runs against and why, live in work.surface.harness.ts.
 */
import { readdirSync, statSync } from 'fs';
import { join } from 'path';
import { given, then, when } from 'test-fns';

import { getShellLibWhole } from '../../../.test/getShellLibWhole';
import {
  DIR_SKILLS,
  DIR_WORK,
  getLibFiles,
  getSkillFiles,
  getSkillsThatSource,
  hasGlobalSource,
  hasGuardedSource,
  read,
  readCode,
  readCodeWhole,
} from './work.surface.harness';

describe('work.surface', () => {
  given('[case1] every skill and lib in the surface', () => {
    when('[t0] each file is read', () => {
      then('NOT ONE sources a ~/.bash_aliases dotfile', () => {
        // .why = the whole point of the move. a global we do not own is one
        //        reinstall from erased and one shared name from a collision.
        const offenders = [...getSkillFiles(), ...getLibFiles()].filter(
          (path) => hasGlobalSource(readCode(path)),
        );
        expect(offenders).toEqual([]);
      });

      then('NOT ONE guards its source with a `declare -f` check', () => {
        // .why = the silent downgrade. the ambient shell has already loaded
        //        the global copy, so the guard passes on the OLDER version and
        //        the repo's own never loads. the repo's lib must WIN.
        const offenders = [...getSkillFiles(), ...getLibFiles()].filter(
          (path) => hasGuardedSource(readCode(path)),
        );
        expect(offenders).toEqual([]);
      });
    });

    when('[t1] the detectors above are aimed at a known offender', () => {
      // .why = a clamp that never goes red guards naught. both detectors run
      //        over CODE ONLY, because crewwork's header quotes the exact
      //        anti-pattern it warns against — and a strip that went one step
      //        too far would silently make both clamps vacuous, while they
      //        kept reporting green (rule.require.clamp-edge-cases).
      const offender = [
        '#!/usr/bin/env bash',
        '# a comment that merely NAMES ~/.bash_aliases.ductwork.sh is fine',
        'declare -f duct.open >/dev/null || source ~/.bash_aliases.ductwork.sh',
      ].join('\n');
      const clean = [
        '#!/usr/bin/env bash',
        '# an earlier revision guarded it with',
        '#   declare -f duct.open >/dev/null || source ~/.bash_aliases.ductwork.sh',
        'source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/work/ductwork.sh"',
      ].join('\n');

      const strip = (body: string): string =>
        body
          .split('\n')
          .filter((line) => !/^\s*#/.test(line))
          .join('\n');

      then('the global-source detector FIRES on the offender', () => {
        expect(hasGlobalSource(strip(offender))).toEqual(true);
      });

      then('the guarded-source detector FIRES on the offender', () => {
        expect(hasGuardedSource(strip(offender))).toEqual(true);
      });

      then(
        'NEITHER fires on a clean file that merely documents the pattern',
        () => {
          expect(hasGlobalSource(strip(clean))).toEqual(false);
          expect(hasGuardedSource(strip(clean))).toEqual(false);
        },
      );
    });
  });

  given('[case2] the skills that compose a *work lib', () => {
    when('[t0] each is read', () => {
      then('there are some — the clamp is not vacuous', () => {
        // .why = a filter that matched zero files would make every assertion
        //        below pass over an empty set. that is a PARTIAL AUDIT: the
        //        subject set narrower than the claim, and invisible from the
        //        verdict (term=partial-audit._.choice._.md).
        expect(getSkillsThatSource().length).toBeGreaterThanOrEqual(10);
      });

      then(
        'each resolves the lib from ITS OWN directory, never a fixed path',
        () => {
          // BASH_SOURCE-relative is what lets the lib + its skills move as one
          // unit when they eject to rhachet-roles-bhuild.
          for (const { path, body } of getSkillsThatSource()) {
            expect({ path, ok: body.includes('BASH_SOURCE[0]') }).toEqual({
              path,
              ok: true,
            });
          }
        },
      );

      then('each points INTO work/, the one home the libs have', () => {
        for (const { path, body } of getSkillsThatSource()) {
          expect({ path, ok: /work\/\w+work\.sh/.test(body) }).toEqual({
            path,
            ok: true,
          });
        }
      });
    });
  });

  given('[case3] EVERY crew verb on disk, as a caller meets them', () => {
    // .why `boot` and not `open`: the work axis must pair with `stop`, and
    //      `open` did not — worse, it overlapped in sense with `crew.show`, so
    //      a reader who wanted a WINDOW reached for the verb that ends a
    //      conversation. renamed 2026-08-09; `open` is a forbidden synonym now
    //      (see term=crew._.choice.reason.md).
    //
    // .why DERIVED, never declared: this list was hardcoded to five verbs and
    //      went stale the moment a sixth was written. on 2026-09-03 two new
    //      verbs — `read` and `send` — were added to close a layer gap, and
    //      BOTH shipped without an exec bit, so `rhx git.crew.read` died on
    //      `exit 126 Permission denied`. this case's very first assertion is
    //      "it exists and is executable" and it stayed green throughout,
    //      because the new verbs were never in its subject set.
    //
    //      that is a `partial audit` in the literal sense: the test chose its
    //      own subjects and its clean verdict carried no trace of what it left
    //      out. a hardcoded list cannot audit what is new, and what is new is
    //      the only code that has never been checked.
    //
    // ⇒    so the subject set is READ FROM DISK. a verb added tomorrow is
    //      audited tomorrow, with no edit to this file and no one to remember.
    const verbs = readdirSync(DIR_SKILLS)
      .filter((f) => /^git\.crew\.[a-z]+\.sh$/.test(f))
      .map((f) => f.replace(/^git\.crew\./, '').replace(/\.sh$/, ''))
      .sort();

    // `poll` is the one genuine outlier: it is a ~92K skill whose logic is
    // inline rather than delegated, so it has no `crew.poll` line to find. it
    // is excepted from the DELEGATE assertion ALONE — executable, sources
    // crewwork, and swallows the internal flags all still bind to it.
    const verbsWithoutDelegate = ['poll'];

    when('[t0] the crew surface is enumerated', () => {
      then(
        'it is non-empty, so a broken glob cannot pass as a clean sweep',
        () => {
          // a derived subject set has one failure mode a declared one lacks: if
          // the pattern matches no file, every per-verb assertion below silently
          // vanishes and the suite still reports green. this is the guard.
          expect(verbs.length).toBeGreaterThanOrEqual(5);
        },
      );

      then('every excepted verb is really on disk', () => {
        // an exception for a verb that no longer exists is a stale carve-out
        // that would quietly excuse a future verb of the same name
        expect(verbsWithoutDelegate.filter((v) => !verbs.includes(v))).toEqual(
          [],
        );
      });
    });

    for (const verb of verbs) {
      when(`[t0] git.crew.${verb}.sh is inspected`, () => {
        const path = join(DIR_SKILLS, `git.crew.${verb}.sh`);

        then('it exists and is executable', () => {
          // a skill a caller cannot run is a skill that does not exist.
          // the mask is a unix mode bit test — the one place a bitwise op
          // states the intent plainly rather than cleverly
          expect(statSync(path).mode & 0o111).toBeGreaterThan(0);
        });

        then('it sources crewwork, never ductwork or termwork directly', () => {
          // .why = the composition rule: a layer may call DOWN, never around.
          //        a crew skill that reached past crewwork into ductwork would
          //        skip the ORDER crewwork exists to own.
          const body = read(path);
          expect(body).toContain('work/crewwork.sh');
          expect(body).not.toContain('work/ductwork.sh');
          expect(body).not.toContain('work/termwork.sh');
        });

        then('it swallows the rhachet-internal flags', () => {
          // rhachet passes --skill/--repo/--role to every skill; a verb that
          // forwarded them would reject its own invocation as an unknown arg
          expect(read(path)).toContain('--skill|--repo|--role');
        });

        then(`it delegates to crew.${verb}`, () => {
          if (verbsWithoutDelegate.includes(verb)) {
            // the carve-out is narrow and it is STILL an assertion: an
            // excepted verb must at least name the lib it stands on, so a
            // skill that quietly stopped short of crewwork cannot hide here
            expect({
              verb,
              sourcesLib: read(path).includes('work/crewwork.sh'),
            }).toEqual({
              verb,
              sourcesLib: true,
            });
            return;
          }
          expect(read(path)).toContain(`crew.${verb}`);
        });
      });
    }
  });

  given('[case4] the two axes, as the docs promise them', () => {
    when('[t0] the destructive verb is read', () => {
      then('git.crew.stop warns before it is run', () => {
        // .why = stop ends every conversation in the crew and no flag brings
        //        one back. the cheap inverse (hide) must be named right there,
        //        or a caller reaches for the expensive verb by default
        //        (rule.require.safe-by-default).
        const body = read(join(DIR_SKILLS, 'git.crew.stop.sh'));
        expect(body).toContain('THIS ENDS THE WORK');
        expect(body).toContain('git.crew.hide');
      });
    });

    when('[t1] the reversible verbs are read', () => {
      then('neither show nor hide claims to touch a duct', () => {
        for (const verb of ['show', 'hide']) {
          const body = read(join(DIR_SKILLS, `git.crew.${verb}.sh`));
          expect({
            verb,
            ok: /NEVER touches a duct|ducts: untouched|is untouched/.test(body),
          }).toEqual({
            verb,
            ok: true,
          });
        }
      });
    });
  });

  given('[case5] the seam, as the libs expose it', () => {
    when('[t0] ductwork is read', () => {
      const body = getShellLibWhole({ path: join(DIR_WORK, 'ductwork.sh') });

      then('it declares DUCTWORK_TMUX_SOCKET, overridable from the env', () => {
        expect(body).toContain(
          'DUCTWORK_TMUX_SOCKET="${DUCTWORK_TMUX_SOCKET:-}"',
        );
      });

      then('NO tmux call escapes the seam', () => {
        // .why = THE hermeticity guarantee. one call left on the default
        //        server is one way for a test to reach the live fleet, and it
        //        would be invisible until the day it killed real work.
        //
        //        strip comments and echo/printf lines first — those name tmux
        //        as prose, never as an invocation.
        const escaped = body
          .split('\n')
          .map((line, i) => ({ line, no: i + 1 }))
          .filter(({ line }) => !/^\s*#/.test(line))
          .filter(({ line }) => !/\b(echo|printf)\b/.test(line))
          .filter(({ line }) => /(^|[^_a-zA-Z"'`-])tmux\s+[a-z]/.test(line))
          // the seam's own two definitions are the sanctioned exceptions
          .filter(({ line }) => !/command tmux/.test(line));
        expect(escaped).toEqual([]);
      });

      then(
        'DUCTWORK_DIR is overridable too, so a test gets its own registry',
        () => {
          expect(body).toContain('DUCTWORK_DIR="${DUCTWORK_DIR:-');
        },
      );
    });

    when('[t1] termwork is read', () => {
      const body = read(join(DIR_WORK, 'termwork.sh'));

      then('it declares BOTH halves of its seam', () => {
        // .why = a term has the same two parts a duct has — a ROW and a
        //        SUBSTRATE — so one seam is never enough. with the registry
        //        seam alone, a test writes its rows privately and then binds a
        //        kitty socket in the SHARED /tmp, where a slug collision
        //        reaches the operator's own window.
        expect(body).toContain('TERMWORK_DIR="${TERMWORK_DIR:-');
        expect(body).toContain('TERMWORK_SOCKET_DIR="${TERMWORK_SOCKET_DIR:-');
      });

      then('NO kitty socket path escapes the seam', () => {
        // .why = the termwork twin of `NO tmux call escapes the seam`. one
        //        hardcoded /tmp bind is one path from a test to a live window,
        //        and — unlike a tmux session — a window has a human in front
        //        of it. completeness IS the guarantee.
        const escaped = body
          .split('\n')
          .map((line, i) => ({ line, no: i + 1 }))
          .filter(({ line }) => !/^\s*#/.test(line))
          .filter(({ line }) => /\/tmp\/kitty/.test(line));
        expect(escaped).toEqual([]);
      });

      then('the detector has teeth against a known offender', () => {
        // .why = the clamp above asserts an ABSENCE, and an absence-clamp goes
        //        vacuous the instant its pattern stops to match at all — it
        //        would read green over a lib full of offenders. so the pattern
        //        is proven against a line that IS one.
        const offender = 'local sockpath="/tmp/kitty-${sock_slug}"';
        expect(/\/tmp\/kitty/.test(offender)).toEqual(true);
        expect(/^\s*#/.test(offender)).toEqual(false);
      });
    });
  });

  /**
   * .what = no duct.* wrapper may hand the LIB a pre-converted session name
   *
   * .why  = a duct has two name forms — the DOTTED name it is addressed by at
   *         every layer above the substrate, and the UNDERSCORE form tmux
   *         rewrites it to on create. ductwork carries both, and keys its
   *         REGISTRY on the dotted one.
   *
   *         so a wrapper that converts before it calls the lib silently
   *         re-keys the registry on tmux's rewrite. that is not cosmetic:
   *         `duct.open` registered under dots while `duct.stop` unregistered
   *         under underscores, so a stop killed the session, missed the row,
   *         and reported `stopped` regardless — a PHANTOM factory, and the
   *         live cause of rows that read `💥 malfunction` forever against
   *         ducts nobody can heal, since a re-run repeats the same mismatch.
   *
   *         measured 2026-08-25, one dot apart:
   *           duct:///zzprobe.dot/mechanic     stop -> "stopped", row SURVIVES
   *           duct:///zzprobe-nodot/mechanic   stop -> "stopped", row gone
   *
   * .why a STATIC clamp: the lib suites drive ductwork's functions directly,
   *      so not one of them can see a wrapper. this defect lived entirely in
   *      the layer above the tests, which is why it ran for months green.
   */
  given('[case6] the duct wrappers, where the two name forms meet', () => {
    const getDuctWrappers = (): { path: string; code: string }[] =>
      getSkillFiles()
        .filter((p) => /\/duct\.[a-z]+\.sh$/.test(p))
        .map((path) => ({ path, code: readCode(path) }))
        .filter(({ code }) => /\bduct\.[a-z]+\s+--on\b/.test(code));

    when('[t0] each is read', () => {
      then('there are some — the clamp is not vacuous', () => {
        expect(getDuctWrappers().length).toBeGreaterThanOrEqual(3);
      });

      then('NONE hands the lib a pre-converted name', () => {
        const offenders = getDuctWrappers().flatMap(({ path, code }) =>
          code
            .split('\n')
            .filter((line) =>
              /\bduct\.[a-z]+\s+--on\s+"\$session_name"/.test(line),
            )
            .map((line) => ({ path, line: line.trim() })),
        );
        expect(offenders).toEqual([]);
      });

      then('the detector has teeth against the real offender line', () => {
        // .why = the clamp above asserts an ABSENCE. proven against the exact
        //        line that shipped in duct.stop.sh and made the phantoms.
        const offender = 'duct.stop --on "$session_name"';
        expect(
          /\bduct\.[a-z]+\s+--on\s+"\$session_name"/.test(offender),
        ).toEqual(true);
        // and it must NOT fire on the corrected form
        const fixed = 'duct.stop --on "$on_session"';
        expect(/\bduct\.[a-z]+\s+--on\s+"\$session_name"/.test(fixed)).toEqual(
          false,
        );
      });
    });
  });

  /**
   * .what = no duct.* wrapper may SILENTLY drop a flag it does not know
   *
   * .why  = duct.send.sh ended its arg parser with `*) shift ;;` — a catch-all
   *         that discards any unknown flag and exits clean. the caller is told
   *         the send succeeded, on terms it never asked for. that is a
   *         `rule.forbid.failhide` in an arg parser.
   *
   *         it cost the same defect TWICE, in one file:
   *
   *           1. `--anyway` was swallowed, so a busy mechanic could not be
   *              steered at all. repaired by an explicit passthrough — the
   *              INSTANCE — and the file's own .why note records it
   *           2. `--await` was swallowed, so git.tree.behavior's boot send
   *              raced the worktree `cd` it had just made. the skill passed
   *              `--await 60`; the guard ran with await=0; the boot was
   *              refused; the tree was left SPROUTED WITH NO BEHAVIOR, the
   *              one state rule.require.behaviors-over-adhoc forbids
   *
   *         repair 1 fixed its instance and left the mechanism open, so the
   *         class claimed a second victim ~months later. this clamp is aimed
   *         at the CLASS (rule.require.clamp-edge-cases: clamp the boundary,
   *         never the single value that broke).
   *
   *         measured 2026-08-31 — the tell that named it was an ABSENT line.
   *         ductwork prints `note: waited Ns and it is still busy` only when
   *         await > 0. the failure printed no such note, which proved the
   *         flag never arrived rather than that the wait ran short.
   *
   * .why a STATIC clamp
   *   the lib suites drive ductwork's FUNCTIONS, which have always failed loud
   *   on an unknown arg. the defect lived only in the WRAPPER above them —
   *   the same blind spot [case6] was written for.
   */
  given(
    '[case12] the duct wrappers reject an unknown flag, never swallow it',
    () => {
      const getDuctWrappers = (): { path: string; code: string }[] =>
        getSkillFiles()
          .filter((p) => /\/duct\.[a-z]+\.sh$/.test(p))
          .map((path) => ({ path, code: readCode(path) }))
          .filter(({ code }) => /while \[\[ \$# -gt 0 \]\]/.test(code));

      when('[t0] each arg parser is read', () => {
        then('there are some — the clamp is not vacuous', () => {
          expect(getDuctWrappers().length).toBeGreaterThanOrEqual(3);
        });

        then('NONE ends its parser with a silent catch-all', () => {
          // .why = `*) shift ;;` and `*) shift 2 ;;` both DISCARD the flag and
          //        carry on. a wrapper must either name a flag or refuse it.
          const offenders = getDuctWrappers().flatMap(({ path, code }) =>
            code
              .split('\n')
              .filter((line) => /^\s*\*\)\s*shift( 2)?\s*;;\s*$/.test(line))
              .map((line) => ({ path, line: line.trim() })),
          );
          expect(offenders).toEqual([]);
        });

        then('the detector has teeth against the real offender line', () => {
          // .why = the clamp above asserts an ABSENCE. proven against the exact
          //        line that shipped in duct.send.sh and ate --anyway, then --await.
          const offender = '    *) shift ;;';
          expect(/^\s*\*\)\s*shift( 2)?\s*;;\s*$/.test(offender)).toEqual(true);

          // and it must NOT fire on the corrected form, which opens a block
          const fixed = '    *)';
          expect(/^\s*\*\)\s*shift( 2)?\s*;;\s*$/.test(fixed)).toEqual(false);

          // nor on the legitimate NAMED skip of rhachet's own internal flags
          const named = '    --skill|--repo|--role) shift 2 ;;';
          expect(/^\s*\*\)\s*shift( 2)?\s*;;\s*$/.test(named)).toEqual(false);
        });
      });

      when('[t1] duct.send is read for the flag it lost', () => {
        const readDuctSend = (): string =>
          readCode(join(DIR_SKILLS, 'duct.send.sh'));

        then('it PARSES --await', () => {
          expect(/--await\)/.test(readDuctSend())).toEqual(true);
        });

        then(
          'and FORWARDS it to the lib — both halves, or the flag is inert',
          () => {
            // .why = a flag parsed but never handed down is the same failhide as
            //        one the catch-all dropped: clean exit, unasked-for behavior.
            //        this half is what the original defect actually lacked.
            expect(
              /duct\.send --on "\$on_session" --await "\$await"/.test(
                readDuctSend(),
              ),
            ).toEqual(true);
          },
        );

        then('it refuses --await where --await cannot work', () => {
          const src = readDuctSend();
          // --anyway sends into a BUSY pane; --await waits for IDLE. opposites.
          expect(/-n "\$await" && "\$anyway" -eq 1/.test(src)).toEqual(true);
          // --keys drives tmux directly and never reaches the busy-guard.
          expect(/-n "\$await" && "\$have_keys" -eq 1/.test(src)).toEqual(true);
        });
      });
    },
  );

  /**
   * [case19] — an exit code is CAPTURED in the same clause that suppresses it
   *
   * .why = every skill wrapper runs `set -euo pipefail`. under `set -e` a bare
   *        `VAR=$(cmd)`, and a bare call of a function that returns non-zero,
   *        are both simple commands — so a failure KILLS THE SHELL on that
   *        line and the next line never runs.
   *
   *        the next line was always `code=$?`. so every unreachable-grove
   *        branch in ductwork was DEAD CODE: `__duct_probe_remote_session`
   *        held a four-cause diagnosis with a named fix per cause, and not one
   *        caller ever saw a word of it. ssh's own 255 left as the process
   *        exit, and 255 sits outside the {0,1,2} set rhachet renders
   *        (rule.require.exit-code-semantics), so the harness printed a bare
   *        `💥 failed with an error` over a diagnosis that was fully written.
   *
   *        measured 2026-09-02, against a real grove:
   *          before — `rhx duct.read --on duct://<grove>/main/mechanic`
   *                   printed EXACTLY `💥 failed with an error`, exit 255
   *          after  — the same call named the cause (`connect to host
   *                   localhost port 36903: Connection refused`), the fix
   *                   (`rhx git.grove.wake`), and exited 2
   *
   *        this cost a whole session of babysit ticks: a grove duct sat in
   *        `duct.list` all day, every read of it was silent, and the silence
   *        read as "groves are simply out of reach" rather than as "the tunnel
   *        is down and one command revives it".
   *
   * .why a CLASS clamp, and an ENUMERATION rather than a pinned string
   *      the defect shipped at NINE sites — one probe body, six probe calls,
   *      and two session-list captures — and each looked correct in isolation.
   *      a clamp pinned to the one line i happened to find first would have
   *      gone green over the other eight (term=clamp: a clamp's jurisdiction
   *      is its ASSERTION, never its prose).
   */
  given('[case19] every captured exit code survives `set -e`', () => {
    const getWorkLibs = (): { path: string; code: string }[] =>
      getLibFiles().map((path) => ({ path, code: readCode(path) }));

    // a capture is UNGUARDED when `$?` is read as its own statement — either on
    // its own line, or after a `;`. the guarded form puts the capture in the
    // `||` clause, which is the one place `set -e` cannot preempt.
    const RE_BARE_ON_OWN_LINE =
      /^\s*(?:local\s+)?[A-Za-z_][A-Za-z0-9_]*=\$\?\s*$/;
    const RE_BARE_AFTER_SEMI = /;\s*(?:local\s+)?[A-Za-z_][A-Za-z0-9_]*=\$\?/;

    when('[t0] the work libs are read', () => {
      then('there are some — the clamp is not vacuous', () => {
        expect(getWorkLibs().length).toBeGreaterThanOrEqual(3);
      });

      then('NOT ONE capture of $? stands as its own statement', () => {
        const offenders = getWorkLibs().flatMap(({ path, code }) =>
          code
            .split('\n')
            .map((line, i) => ({ path, no: i + 1, line }))
            .filter(
              ({ line }) =>
                RE_BARE_ON_OWN_LINE.test(line) || RE_BARE_AFTER_SEMI.test(line),
            ),
        );
        expect(offenders).toEqual([]);
      });

      then(
        'the detector has teeth against the three lines that shipped',
        () => {
          // .why = the clamp above asserts an ABSENCE, so it must be proven
          //        against the real offenders (rule.require.clamp-edge-cases §2).
          expect(RE_BARE_ON_OWN_LINE.test('  local code=$?')).toEqual(true);
          expect(RE_BARE_ON_OWN_LINE.test('  exitcode=$?')).toEqual(true);
          expect(
            RE_BARE_AFTER_SEMI.test(
              '  sessions=$(__duct_list_host_sessions "$host"); reached=$?',
            ),
          ).toEqual(true);

          // and it must NOT fire on the corrected form, at either shape
          expect(
            RE_BARE_ON_OWN_LINE.test(
              '  __duct_probe_remote_session || probe=$?',
            ),
          ).toEqual(false);
          expect(
            RE_BARE_AFTER_SEMI.test(
              '  sessions=$(__duct_list_host_sessions "$host") || reached=$?',
            ),
          ).toEqual(false);
        },
      );
    });

    when('[t1] the remote probe and its callers are read', () => {
      const readDuctwork = (): string =>
        readCodeWhole(join(DIR_SKILLS, 'work/ductwork.sh'));

      then('EVERY call of the probe is guarded — none bare', () => {
        // .why an enumeration: the six call sites are spread across six verbs,
        //      hundreds of lines apart. a clamp that checked one would have
        //      gone green while five stayed dead ([case17]'s lesson).
        const calls = readDuctwork()
          .split('\n')
          .filter((line) => /__duct_probe_remote_session/.test(line))
          .filter((line) => !/^\s*#/.test(line))
          .filter((line) => !/^__duct_probe_remote_session\(\)/.test(line));
        expect(calls.length).toBeGreaterThanOrEqual(6);
        expect(calls.filter((line) => !/\|\|\s*probe=\$\?/.test(line))).toEqual(
          [],
        );
      });

      then(
        'the diagnosis it guards is REACHED by every verb that probes',
        () => {
          // .why = the guard's whole purpose is to let these run. a fix that
          //        stopped at the probe body would leave them unreachable still.
          const says = readDuctwork()
            .split('\n')
            .filter((line) => /__duct_say_unreachable \w+/.test(line));
          expect(says.length).toBeGreaterThanOrEqual(6);
        },
      );

      then(
        'each ssh the probes make is BOUNDED — a poll cannot hang on one box',
        () => {
          // .why term=poll, property 4: bounded per subject. git.crew.poll now
          //      asks one session-list per registered host on every babysit tick,
          //      so an unbounded ssh to a hung grove would stall the whole sweep.
          const sshCalls = readDuctwork()
            .split('\n')
            .filter((line) => /^\s*[A-Za-z_]+=\$\(ssh /.test(line));
          expect(sshCalls.length).toBeGreaterThanOrEqual(2);
          expect(
            sshCalls.filter((line) => !/ConnectTimeout=/.test(line)),
          ).toEqual([]);
        },
      );
    });
  });

  /**
   * 🔴 [case58] — a case id names ONE axis, within the file that declares it
   *
   * .what = in one clamp file, each `[caseNN]` is declared by exactly one
   *        `given(`.
   *
   * .why  = a case id is an IDENTITY ANCHOR, and it is cited BY NAME across
   *        files. `[case50]` here is cited from crewwork and from
   *        git.grove.saturation. a second `[case50]` in this file fails no
   *        test, moves no count, and renders no red — it silently re-points
   *        every one of those citations, and the earlier block wins the grep.
   *
   *        measured 2026-09-19: a new axis was written as `[case50]` beside
   *        the extant `[case50]`. the cure's own pointer in `git.crew.poll.sh`
   *        then named a case about a different subject, and the suite stayed
   *        green through all of it. a stale background grep surfaced it —
   *        which is to say luck did.
   *
   *       ⇒ the identity family is already clamped on the tool's OUTPUT by
   *         [case45] (one glyph, one concept) and [case48] (one tree, one
   *         name). the gap was that family turned on the clamp corpus itself.
   *
   * .the bound = uniqueness is PER FILE. each clamp file has its own id
   *        namespace, so crewwork's `[case50]` and this file's `[case50]` are
   *        two axes rather than a collision. a cross-file assert would render
   *        a false red over the whole corpus at once.
   *
   *       🟡 .and the CORPUS is `DIR_WORK` — every suite in this dir. **ecowork
   *         is NOT in it**; it lives under role=prioritizer and carries its
   *         own `[caseNN]` set, unread here. so a green on this axis says
   *         naught about ecowork (`term=partial-audit`: a read complete over
   *         the scope it chose, which may never be stated as a verdict about
   *         the whole). to widen it, walk the role dirs rather than one.
   */
  given(
    '[case58] a case id names ONE axis, within the file that declares it',
    () => {
      const getClampFiles = (): string[] =>
        readdirSync(DIR_WORK)
          .filter((f) => f.endsWith('.integration.test.ts'))
          .map((f) => join(DIR_WORK, f));

      /**
       * every `[caseNN]` DECLARED by a given() in one file
       *
       * ⚠️ ANCHORED to line start. `readCode` strips `#` comments — a shell
       *   shape — so it leaves TS prose whole, and a docblock that quotes a
       *   full `given('[caseNN]` line would otherwise read as a declaration.
       *   a docblock line carries a ` * ` prefix, which `^\s*given` refuses.
       *
       * 🔴 .and the `\s*` after `given(` is LOAD-CENTRAL, never cosmetic.
       *   prettier wraps a long title onto its own line:
       *
       *       given(
       *         '[case58] a case id names ONE axis, …',
       *
       *   a regex that demands `given('[case` contiguous then matches the
       *   SHORT titles only. measured 2026-09-25, on the port into
       *   rhachet-roles-bhuild, whose format gate rewrapped the corpus: this
       *   file declares 64 ids and the contiguous form found 16 — so the
       *   collision assert above ran over a quarter of its own subject and
       *   stayed green. the two anti-vacuity teeth are what rendered it red.
       *     ⇒ a clamp that encodes a FORMATTING shape grades the formatter,
       *       never the code. `\s` spans the newline, so the widened form is
       *       format-agnostic and the docblock refusal is untouched.
       */
      const getDeclaredIds = (path: string): string[] =>
        [...read(path).matchAll(/^\s*given\(\s*'\[(case\d+)\]/gm)].map(
          (m) => m[1]!,
        );

      const getCollisions = (): string[] =>
        getClampFiles().flatMap((path) => {
          const seen = new Map<string, number>();
          getDeclaredIds(path).forEach((id) =>
            seen.set(id, (seen.get(id) ?? 0) + 1),
          );
          return [...seen.entries()]
            .filter(([, n]) => n > 1)
            .map(([id, n]) => `${path.split('/').pop()} declares ${id} ${n}x`);
        });

      /**
       * 🟡 .the DEBT — the one collision this clamp found, older than itself
       *
       * named as an EXACT pair, never by file. a by-file allowlist would let
       * syncwork earn a second for free, and the whole value of the clamp is
       * that the NEXT one goes red.
       *
       * it is NOT cured here because the cure is DIRTY rather than unsafe: a
       * case id is cited BY NAME across files, so a rename owes an audit of
       * every citation of it — and a find-and-replace cannot part a CITATION
       * of an id from a DECLARATION of one.
       *   ⇒ caught at .dream/v2026_09_19.fix.five-clamp-ids-name-two-axes.md
       *
       * ✅ crewwork's four (`[case28]`–`[case31]`, each two unrelated axes
       *   under one anchor) are cured by the suite's cut into parts: each
       *   pair now sits in two part files, so a citation that names its part
       *   file names exactly one axis.
       */
      const DEBT_EXTANT = ['syncwork.integration.test.ts declares case6 2x'];

      when('[t0] each clamp file is read for the ids it declares', () => {
        then('🔴 no NEW id is declared twice in one file', () => {
          expect(
            getCollisions().filter((c) => !DEBT_EXTANT.includes(c)),
          ).toEqual([]);
        });

        then(
          '🔴 the debt is a RATCHET — it may not grow, and a repair shrinks it',
          () => {
            // .teeth = a baseline with no size assert absorbs the next collision
            //          in silence, and the clamp stays green forever
            expect(DEBT_EXTANT.length).toEqual(1);
            // and every entry must still be REAL. once one is cured, this goes
            // red and forces the baseline down — a stale entry would otherwise
            // cover a fresh collision whose text happens to match it
            DEBT_EXTANT.forEach((d) => expect(getCollisions()).toContain(d));
          },
        );

        then(
          'the corpus is not empty — the assert above is not vacuous',
          () => {
            // ANTI-VACUITY: a regex that matches naught passes the test above
            // over an empty set, so the corpus is proven to hold real ids
            const files = getClampFiles();
            expect(files.length).toBeGreaterThan(3);
            const total = files.reduce(
              (n, p) => n + getDeclaredIds(p).length,
              0,
            );
            expect(total).toBeGreaterThan(100);
          },
        );

        then('🔴 and THIS suite is inside the corpus it grades', () => {
          // a clamp that omits its own suite grades every peer and not the one
          // it lives in — which is exactly where the collision landed. the
          // suite is cut into ten `work.surface.*` parts, so all ten must be in
          const self = getClampFiles().filter((p) =>
            p.split('/').pop()!.startsWith('work.surface.'),
          );
          expect(self.length).toEqual(10);
          const total = self.reduce((n, p) => n + getDeclaredIds(p).length, 0);
          expect(total).toBeGreaterThan(40);
        });
      });

      when('[t1] a duplicated id is held against the same assertion', () => {
        then('🔴 it goes RED — the bite proof', () => {
          const seen = new Map<string, number>();
          ['case49', 'case50', 'case50', 'case57'].forEach((id) =>
            seen.set(id, (seen.get(id) ?? 0) + 1),
          );
          expect([...seen.entries()].filter(([, n]) => n > 1)).toEqual([
            ['case50', 2],
          ]);
        });
      });
    },
  );
});
