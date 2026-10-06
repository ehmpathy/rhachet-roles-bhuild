/**
 * .what = clamps on git.grove.auth, whose two legs sit on two machines
 *
 * .note = a PART of the `work.surface` suite, cut so one reviewer can hold
 *         it whole. the suite's shared fixtures, and its account of what it
 *         runs against and why, live in work.surface.harness.ts.
 */
import { join } from 'path';
import { given, then, when } from 'test-fns';

import { DIR_SKILLS, readCode } from './work.surface.harness';

describe('work.surface', () => {
  /**
   * [case25] — git.grove.auth's two legs stay on their own machines
   *
   * .why = this is the fleet's only TWO-MACHINE verb. the sign-in must be
   *        raised ON THE GROVE and answered in a browser ON THIS BOX, so a
   *        call that lands on the wrong side of that seam does not fail — it
   *        succeeds against the wrong machine. an `xdg-open` routed through
   *        `__grove_sh` would try to raise firefox on a headless ec2 box, exit
   *        0, and report a browser that was never there.
   *
   *        the seam is invisible in a diff. `__grove_sh "..."` and a bare
   *        `"..."` are one token apart, and every line in that file already
   *        looks like the others.
   *
   * .why the CLASS, never the one call
   *      [case16]'s lesson verbatim: a clamp pinned to one call by string
   *      cannot see a second one land 170 lines away. so these walk EVERY
   *      `${TMUXC}` line, EVERY `xdg-open` line, and EVERY `send-keys` line,
   *      and grade each — red the day call number five arrives on the wrong
   *      side, whatever it is named.
   *
   * .note = each block carries a floor on the call count. a rename of `TMUXC`
   *         would otherwise leave every filter empty and every assertion green
   *         over a subject that no longer exists ([case7]'s vacuity).
   */
  given('[case25] git.grove.auth, whose two legs sit on two machines', () => {
    const readAuth = (): string =>
      readCode(join(DIR_SKILLS, 'git.grove.auth.sh'));

    const linesWith = (needle: string): string[] =>
      readAuth()
        .split('\n')
        .filter((line) => line.includes(needle));

    /** the text between two markers, without a non-null assertion */
    const between = (held: string, open: string, close: string): string => {
      const i = held.indexOf(open);
      if (i < 0) return '';
      const rest = held.slice(i + open.length);
      const j = rest.indexOf(close);
      return j < 0 ? rest : rest.slice(0, j);
    };

    when('[t0] every tmux call in the file is read', () => {
      then('each one rides __grove_sh, so it acts on the GROVE', () => {
        const calls = linesWith('${TMUXC}');
        expect(calls.length).toBeGreaterThan(8);

        // the scan string is composed here and handed over one line down, so
        // it is the single legitimate exception — enumerated, never inferred.
        const stray = calls.filter(
          (line) => !line.includes('__grove_sh') && !line.includes('scan="'),
        );
        expect(stray).toEqual([]);
      });

      then(
        'the ONE exception is the scan string, and __grove_sh runs it',
        () => {
          const held = readAuth();
          expect(held.includes('scan="${TMUXC}list-sessions')).toEqual(true);
          expect(held.includes('__grove_sh "$scan"')).toEqual(true);
        },
      );
    });

    when('[t1] every xdg-open in the file is read', () => {
      then('NOT ONE rides __grove_sh — the browser is on THIS box', () => {
        // .why = the human drew this line in three words: "browser needs to
        //        open on my local machine, not the cloud grove". a grove has
        //        no display, so the failure is silent rather than loud.
        const calls = linesWith('xdg-open');
        expect(calls.length).toBeGreaterThan(2);
        expect(calls.filter((line) => line.includes('__grove_sh'))).toEqual([]);
      });

      then('the open runs in the FOREGROUND and its verdict is read', () => {
        // .why = it shipped as `xdg-open "$url" >/dev/null 2>&1 &` — both
        //        streams discarded, exit code never read, and the success line
        //        printed either way (rule.forbid.failhide).
        const held = readAuth();
        expect(
          held.includes('timeout 15 xdg-open "$url" 2>&1) || open_code=$?'),
        ).toEqual(true);
        expect(/xdg-open "\$url"[^\n]*&\s*$/m.test(held)).toEqual(false);
      });
    });

    when('[t2] every send-keys in the file is read', () => {
      then(
        'each targets a duct we OWN, or carries the code the caller handed us',
        () => {
          // .why = the attach mech reads a duct a HUMAN may be sat at. a key sent
          //        into one of those answers a decision that was never ours, and
          //        the guarantee in the header — "absent --code it sends NO key"
          //        — is a claim about every call site at once.
          const calls = linesWith('send-keys');
          expect(calls.length).toBeGreaterThan(3);

          const stray = calls.filter(
            (line) =>
              !line.includes("'$AUTH_SESSION'") &&
              !line.includes('$code_q') &&
              !line.includes("send-keys -t '$session' Enter"),
          );
          expect(stray).toEqual([]);

          // 🔴 the exemption above is the code SUBMIT, and it needs its own proof.
          //
          // .why = this clamp once read "carries the code" as its predicate, which
          //        held while the paste and its Enter were ONE send. the Enter was
          //        then split out — a real repair, since the Ink box swallows an
          //        Enter that rides with a paste — and the split broke the PROXY
          //        while the property itself stood untouched.
          //
          // ⇒ so name the property instead: a key on `$session` is sanctioned only
          //   where it completes the delivery the caller asked for. that is
          //   checkable — it must sit AFTER the paste and INSIDE the --code block,
          //   which the attach early-exit bounds.
          const held = readAuth();
          const iPaste = held.indexOf("send-keys -t '$session' -l '$code_q'");
          const iSubmit = held.indexOf("send-keys -t '$session' Enter");
          const iAttachExit = held.indexOf(
            'under --mech attach the duct is not ours',
          );
          expect(iPaste).toBeGreaterThan(0);
          expect(iSubmit).toBeGreaterThan(iPaste);
          expect(iSubmit).toBeLessThan(iAttachExit);
        },
      );

      then('each rides __grove_sh, so no keystroke lands on this box', () => {
        expect(
          linesWith('send-keys').filter((line) => !line.includes('__grove_sh')),
        ).toEqual([]);
      });
    });

    when('[t3] the first-run screen loop is read', () => {
      then(
        'every screen it RECOGNIZES has an arm, or is a declared terminus',
        () => {
          // .why = a marker with no arm is a screen the loop sees, declines to
          //        answer, and then waits out its passes before it reports a
          //        timeout. an arm with no marker is unreachable code. only a
          //        walk of both sets can say so.
          //
          // ⚠️ there are TWO loops in this file — leg 1 drives TOWARD the oauth
          //    url, leg 2 drives PAST it to the repl — so a check that reads
          //    only the FIRST `case` block grades half its subject. it did, and
          //    this is the repair (term=partial-audit, mechanism 1).
          //
          // .why not set EQUALITY: a terminus marker is answered by a `break`
          //      rather than by a keystroke, so it is a marker with no arm ON
          //      PURPOSE. the two subset claims below say exactly that, and
          //      leave no hole an unreachable arm could hide in.
          const held = readAuth();

          const markers = [...held.matchAll(/\)\s*kind=(\w+)\s*;;/g)].map(
            (m) => m[1] ?? '',
          );
          const arms = [...held.matchAll(/^\s{6,}(\w+)\)\s*$/gm)].map(
            (m) => m[1] ?? '',
          );

          expect(markers.length).toBeGreaterThan(6);
          expect(arms.length).toBeGreaterThan(5);

          // every arm is reachable
          expect(arms.filter((arm) => !markers.includes(arm))).toEqual([]);

          // every marker is answered, or is the terminus that breaks the loop
          expect(
            markers.filter((mk) => !arms.includes(mk) && mk !== 'repl'),
          ).toEqual([]);

          // and that terminus really does break, rather than fall through.
          //
          // ⚠️ keyed on the PROPERTY, never on one literal: leg 2 reads the repl
          //    on its own `$repl` axis (see [t9]) while leg 1 keeps it as an arm
          //    of `$kind`, so a pin on either form would fail the other leg for a
          //    shape that is correct.
          expect(
            /if \[\[ (-n "\$repl"|"\$kind" == "repl") \]\]; then landed=1; break; fi/.test(
              held,
            ),
          ).toEqual(true);
        },
      );

      then(
        'EVERY loop records its answer below its own esac, so no arm can skip it',
        () => {
          // .why = "answer each kind at most once" is the guard that stops a
          //        second keystroke from reaching whatever screen came next. a
          //        per-arm record would be a line a new arm forgets; one record
          //        below the `esac` cannot be forgotten by construction.
          //
          // .why counted PER LOOP rather than pinned at one: a second loop that
          //      forgot its record would leave the first loop's record in place
          //      and this check green — the [case16] shape, where a clamp aimed
          //      at one site cannot see the second.
          const held = readAuth();

          const dispatches = [...held.matchAll(/case "\$kind" in/g)].map(
            (m) => m.index ?? -1,
          );
          const records = [
            ...held.matchAll(/answered="\$answered\[\$kind\]"/g),
          ].map((m) => m.index ?? -1);
          const guards = held.split('"$answered" != *"[$kind]"*').length - 1;

          expect(dispatches.length).toBeGreaterThan(1);
          expect(records.length).toEqual(dispatches.length);
          expect(guards).toEqual(dispatches.length);

          // each record sits below the esac of the dispatch it belongs to
          dispatches.forEach((iCase, i) => {
            const iEsac = held.indexOf('esac', iCase);
            expect(records[i] ?? -1).toBeGreaterThan(iEsac);
          });
        },
      );
    });

    when('[t4] the url gate is read', () => {
      then('it demands BOTH parameters, never one', () => {
        // .why = a 400-col read once yielded a url whose last parameter was
        //        `code_challenge_method=S256` — a plausible terminus — with
        //        `&state=` silently absent. one parameter is not a gate.
        const gate = between(readAuth(), '__url_complete() {', '\n}');
        expect(gate.includes('code_challenge=')).toEqual(true);
        expect(gate.includes('state=')).toEqual(true);
      });

      then('the rank of candidates uses the SAME two', () => {
        // .why = a gate that judges by one standard and a ranker that sorts by
        //        another would hand the gate a candidate it never preferred.
        expect(readAuth().includes('/code_challenge=/ && /state=/')).toEqual(
          true,
        );
      });

      then('a url that fails it is REFUSED before any path prints it', () => {
        const held = readAuth();
        const iGate = held.indexOf('if ! __url_complete "$url"; then');
        const iPrint = held.indexOf('echo "$url"');
        expect(iGate).toBeGreaterThan(-1);
        expect(iPrint).toBeGreaterThan(iGate);
      });
    });

    when('[t5] the row-join is read', () => {
      then('it right-trims a row BEFORE it tests that row for a space', () => {
        // .why = the no-space test is the SAFETY property: claude's "Paste code
        //        here if prompted >" box DESTROYS the characters beneath it, and
        //        an overwritten row carries INTERIOR spaces, so the join stops
        //        there rather than splice a hole.
        //
        //        a widened pane pads every row out to full width, so a space at
        //        the END of a row is an artifact while an INTERIOR one is the
        //        signal. reverse these two lines and the widen defeats the join
        //        — the pair then reports a one-row url, a dead link that reads
        //        as a good one.
        const held = readAuth();
        const iTrim = held.indexOf('sub(/[ \\t]+$/, "", line)');
        const iTest = held.indexOf('^[A-Za-z0-9._~:');
        expect(iTrim).toBeGreaterThan(-1);
        expect(iTest).toBeGreaterThan(iTrim);
      });
    });

    when('[t6] the line that reports the open is read', () => {
      then(
        'it names the HANDOFF it measured, never the window it hopes for',
        () => {
          // .why = `$BROWSER` here is a wrapper whose last line is
          //          setsid -f flatpak run org.mozilla.firefox "$@" >/dev/null 2>&1
          //        which returns 0 the instant it forks. so NO exit code we can
          //        read sees past it, and the honest claim is about the handoff.
          //
          // ⚠️ this is the one assertion here aimed at PROSE, so its jurisdiction
          //    is narrow by construction: it catches this sentence's return, and
          //    never a NEW sentence with the same defect. that limit is stated
          //    rather than hidden (term=clamp — a clamp's reach is its assertion).
          const held = readAuth();
          expect(held.includes('handed to xdg-open')).toEqual(true);
          expect(held.includes('opened in your browser')).toEqual(false);
        },
      );
    });

    when('[t7] the flags that govern nought are read', () => {
      then(
        '--width under an OWNED duct is REFUSED, never accepted and ignored',
        () => {
          // .why = a flag taken and disregarded reports success over a knob that
          //        did naught. a caller who set 600 and got their url would
          //        believe it took effect (rule.forbid.failhide).
          //
          // ⚠️ asserted against `$owned` rather than a literal mech name, because
          //    the set of owned mechs GREW (oauth, then token) and a per-name
          //    pin would have to be edited once per mech — the edit a new mech
          //    forgets. `$owned` is the invariant; a mech name is its instance.
          const held = readAuth();
          expect(
            held.includes('if [[ -n "$width_given" && -n "$owned" ]]; then'),
          ).toEqual(true);
          expect(held.includes('--width) width="$2"; width_given=1;')).toEqual(
            true,
          );
        },
      );

      then(
        'EVERY --width resize sits behind a guard, and the BIRTH resize is exempt',
        () => {
          // .why = a `--width` resize on an owned duct would re-introduce the
          //        repaint race the owned duct exists to remove. counted rather
          //        than pinned: an ungated resize breaks the tally and forces a
          //        reader to look. that half of this clamp stands unchanged.
          //
          // 🔴 .but its PREMISE was refuted, 2026-09-09. this clamp read "the owned
          //    duct is sized at birth, so a resize here would…" — and the owned
          //    duct was NOT sized at birth. tmux honors `new-session -x/-y` only
          //    under `window-size manual`; the grove runs the default
          //    `window-size latest`, so the flag was discarded and the pane came up
          //    **45x25** while the skill printed `at 200x50`.
          //
          // ⚠️ the clamp stayed GREEN throughout, because it pinned the ABSENCE of
          //    a resize rather than the PRESENCE of a size. ⇒ **a clamp can be
          //    honest about its subject and still rest on a premise nobody
          //    measured** — and this one then argued against the very call that
          //    would have cured it.
          //
          // ⇒ so the birth resize is admitted by NAME rather than by count: it
          //   carries the geometry, and it is the one resize that makes the
          //   "sized at birth" sentence true instead of merely asserted.
          const held = readAuth();
          expect(
            held.includes('if [[ -n "$owned" ]]; then width=0; fi'),
          ).toEqual(true);

          const guards =
            held.split('if [[ "$width" != "0" ]]; then').length - 1;
          const resizes = linesWith('resize-window');
          expect(guards).toEqual(2);
          expect(resizes.length).toEqual(3);

          // exactly ONE carries the birth geometry, and it pairs with the mode
          // that makes that geometry hold at all
          const birth = resizes.filter((line) => line.includes('-x 200 -y 50'));
          expect(birth.length).toEqual(1);
          expect(held.includes('window-size manual')).toEqual(true);
        },
      );

      then('`owned` holds EXACTLY the mechs that boot their own duct', () => {
        // .why = every guard above now turns on `$owned`, so a mech wrongly
        //        admitted to it inherits four behaviors at once — no widen, a
        //        killed session, a driven screen chain, and keystrokes sent
        //        into a duct. under `attach` that duct is a HUMAN's.
        const held = readAuth();
        expect(
          held.includes(
            '[[ "$mech" == "oauth" || "$mech" == "token" ]] && owned=1',
          ),
        ).toEqual(true);
      });
    });

    /**
     * ⚠️ [t8] the `token` mech is the one arm whose terminus CANNOT be borrowed.
     *
     * .why = `claude auth status` grades oauth honestly — it reads the
     *        credential and names the account. under CLAUDE_CODE_OAUTH_TOKEN it
     *        reports `loggedIn: true` for a string we invented, measured
     *        2026-09-05 with the literal `sk-ant-oat01-notarealtoken`.
     *
     *        so the shared arm must NOT fall through to it. a token that is
     *        never minted would otherwise be graded by a check that cannot
     *        fail, and reported as a success (term=false-report).
     */
    when('[t8] the token mech is read', () => {
      then(
        'it returns BEFORE the auth-status terminus, never through it',
        () => {
          // ⚠️ located by the terminus CALL SITE, never by the `claude auth status`
          //    string. that string also sits in `__account_read`, a helper defined
          //    at the top of the file — so a string match found the DEFINITION and
          //    graded an order that says naught about the terminus.
          //
          // ⇒ the property is unchanged; only its locator moved. pin the call, not
          //   the text the call happens to contain.
          const held = readAuth();
          const iToken = held.indexOf('if [[ "$mech" == "token" ]]; then');
          const iStatus = held.indexOf('acct_after=$(__account_read)');
          expect(iToken).toBeGreaterThan(0);
          expect(iStatus).toBeGreaterThan(0);
          expect(iToken).toBeLessThan(iStatus);
        },
      );

      then(
        'STDOUT carries the token and nought else, so it pipes to keyrack',
        () => {
          // .why = the value must never ride in argv (git.grove.keyrack refuses a
          //        literal BY NAME). that contract holds only if this side keeps
          //        stdout clean — one stray echo and the pipe carries prose into
          //        a credential store.
          const held = readAuth();
          const arm = between(
            held,
            'if [[ "$mech" == "token" ]]; then',
            '\n  fi',
          );
          expect(arm.includes('printf \'%s\\n\' "$tok"')).toEqual(true);

          // every human-readable line in the arm is routed to stderr
          const loud = arm
            .split('\n')
            .filter((line) => /^\s*echo /.test(line))
            .filter((line) => !line.includes('>&2'));
          expect(loud).toEqual([]);
        },
      );

      then(
        'the duct is FELLED once the token is read, so it outlives no pipe',
        () => {
          // .why = a long-lived token left painted in a tmux pane is a credential
          //        at rest on a shared box, readable by any later capture.
          const held = readAuth();
          const arm = between(
            held,
            'if [[ "$mech" == "token" ]]; then',
            '\n  fi',
          );
          expect(arm.includes('kill-session')).toEqual(true);
        },
      );

      /**
       * 🔴 the pane must OUTLIVE the process, or the read races the exit.
       *
       * .why = a tmux session ends with the program it runs, and the two brains
       *        end differently: `claude` is a repl that stays; `claude
       *        setup-token` prints its token and exits at once. so the pane
       *        that holds the token is torn down in the same breath that fills
       *        it, and the reader finds no session — measured on
       *        grove-sandpine-v20260811, 2026-09-08.
       *
       * ⚠️ it fails as a MISS, never as a RACE: an absent session captures as
       *    empty, so the diagnostic says "no token was printed" beneath a blank
       *    pane — a true sentence about the wrong subject. the shape that hides
       *    longest (term=false-report), so it is clamped rather than recalled.
       */
      then('the token duct keeps its pane after setup-token exits', () => {
        const held = readAuth();

        // the guard is set at BOOT — after the exit there is no session to set it on
        const iRemain = held.indexOf('remain-on-exit on');
        const iArm = held.indexOf('if [[ "$mech" == "token" ]]; then');
        expect(iRemain).toBeGreaterThan(0);
        expect(iRemain).toBeLessThan(iArm);

        // and it is scoped to the token mech — a repl duct that never dies has
        // no use for it, and would leave dead panes behind on every sign-in.
        //
        // ⚠️ asserted as a `&&` one-liner ON PURPOSE: an `if [[ "$mech" ==
        //    "token" ]]; then` block here would share an opener with the token
        //    ARM below, and every clamp that anchors on that line would bind to
        //    whichever block came first. it did, and reddened three peers.
        expect(
          /\[\[ "\$mech" == "token" \]\] && __grove_sh "\$\{TMUXC\}set-option[^\n]*remain-on-exit on/.test(
            held,
          ),
        ).toEqual(true);
      });

      then(
        'an ABSENT token fails loud, rather than pipe an empty value',
        () => {
          const held = readAuth();
          const arm = between(
            held,
            'if [[ "$mech" == "token" ]]; then',
            '\n  fi',
          );
          expect(arm.includes('if [[ -z "$tok" ]]; then')).toEqual(true);
          expect(arm.includes('exit 1')).toEqual(true);
        },
      );

      then('it boots setup-token, in a duct of its OWN name', () => {
        // .why = a shared duct would let one mech's leg 2 answer the other's
        //        prompt. the two render alike, so the mismatch is invisible.
        const held = readAuth();
        expect(
          held.includes(
            '[[ "$mech" == "token" ]] && BOOT_CMD="claude setup-token"',
          ),
        ).toEqual(true);
        expect(
          held.includes(
            '[[ "$mech" == "token" ]] && AUTH_SESSION="_token_claude"',
          ),
        ).toEqual(true);
      });
    });

    /**
     * ⚠️ [t9] a screen marker must key on what the SCREEN IS, never on one skin.
     *
     * .why = the repl was keyed on `for shortcuts` alone — ONE skin of a status
     *        line that varies with claude's mode. an accept-edits box paints
     *        `⏵⏵ accept edits on (shift+tab to cycle)` instead, so:
     *
     *          leg 1 spent all 40 passes and reported "claude never reached the
     *          oauth screen" over a pane that plainly held a live `❯` prompt
     *
     *          leg 2 fell out of its loop on EVERY swap of 2026-09-04 and
     *          printed "⚠️ the repl never came up" four times, harmlessly —
     *          which is exactly why it survived four rounds unfixed
     *
     * ⇒ so this clamps the PROPERTY (several skins, both loops) rather than the
     *   three literals, because the skin set will grow again and a pin on
     *   today's three would have to be edited rather than merely satisfied.
     */
    when('[t9] the repl marker is read, in BOTH loops', () => {
      // leg 1 keys the repl as an arm of its screen case; leg 2 keys it on its
      // OWN axis. the split is deliberate — see the third `then` below.
      const replMarkers = (): string[] =>
        readAuth()
          .split('\n')
          .filter((line) => /(kind=repl|repl=1)\s*;;/.test(line));

      then(
        'BOTH loops carry a repl marker — leg 1 to enter, leg 2 to exit',
        () => {
          expect(replMarkers().length).toEqual(2);
        },
      );

      then(
        'EACH keys on several skins, so one status line cannot hide the repl',
        () => {
          // a single-skin marker is the defect; `|` alternation is the cure.
          for (const marker of replMarkers()) {
            const skins = marker
              .split('|')
              .filter((part) => part.includes('*"'));
            expect(skins.length).toBeGreaterThan(2);
          }
        },
      );

      then(
        'the skins span the STATUS LINE and the BANNER, never one surface',
        () => {
          // .why = every status-line phrase moves together with the mode. a
          //        marker set drawn only from status lines is one product change
          //        away from the same blind spot. the banner is a second surface.
          for (const marker of replMarkers()) {
            expect(marker.includes('shift+tab to cycle')).toEqual(true);
            expect(marker.includes('Welcome back')).toEqual(true);
          }
        },
      );

      /**
       * 🔴 leg 2's repl marker must NOT be an arm of its screen case.
       *
       * .why = `Login successful` is transcript residue, never a screen that
       *        ends. it stays on the visible pane beside a live `❯` forever, so
       *        as a peer arm it matched first on every pass and the repl arm —
       *        placed last on purpose — was unreachable. leg 2 then spent all 30
       *        passes and reported "⚠️ the repl never came up" on a healthy repl.
       *
       * ⚠️ first-match order cannot hold both claims at once: an UNANSWERED
       *    select must outrank the repl, and a DEAD transcript line must not.
       *    one ordered list has no slot for both, so leg 2 ranks by ANSWERED
       *    state instead — which is only expressible on a separate axis.
       */
      then(
        'leg 2 reads the repl on its OWN axis, so a pane relic cannot mask it',
        () => {
          const held = readAuth();

          // the screen case must not carry a repl arm at all
          const leg2Case = held.slice(held.indexOf('kind=welcome'));
          const leg2CaseEnd = leg2Case.indexOf('esac');
          expect(leg2Case.slice(0, leg2CaseEnd).includes('repl')).toEqual(
            false,
          );

          // and an ANSWERED screen must yield rather than pin the loop on itself
          expect(
            /answered="\$answered\[\$kind\]"\s*\n\s*sleep 2\s*\n\s*continue/.test(
              held,
            ),
          ).toEqual(true);
        },
      );

      then(
        'leg 1 keeps repl LAST in its case, so a live select still outranks it',
        () => {
          // .why = the status line can sit on screen beneath an active select.
          //        for leg 1 the repl is an ANSWERABLE state (it sends /login), so
          //        the ordered case is the right shape there and order is its guard.
          const held = readAuth();
          const marker = replMarkers().filter((line) =>
            line.includes('kind=repl'),
          )[0]!;
          const rest = held.slice(held.indexOf(marker) + marker.length);
          const nextEsac = rest.indexOf('esac');
          const nextKind = rest.indexOf('kind=');
          expect(nextEsac).toBeGreaterThan(-1);
          expect(nextKind === -1 || nextEsac < nextKind).toEqual(true);
        },
      );
    });

    /**
     * 🔴 the UPSTREAM product can redraw a screen, and a keystroke then goes dead
     *
     * .why = claude code v2.1.270 dropped the numbers from the trust select AND
     *        inverted its order, so `send-keys 1` became a no-op and the default
     *        became `No, exit`. every run parked on that one screen and spent its
     *        whole pass budget, which read as **"the skill got slow"**.
     *
     * ⚠️ the defect's SHAPE is what earns these clamps: a dead keystroke is
     *    indistinguishable from a slow one from outside, because both look like a
     *    loop that waits. only a wall-clock cap plus a pane dump parts them.
     *
     * ⇒ so the clamps pin three properties, each absent when the release landed:
     *   the trust answer must not hardcode a digit, an unknown screen must not
     *   cost an unbounded wait, and a claim about the pane's size must be READ
     *   rather than asserted.
     */
    when(
      '[t10] the upstream product redraws a screen the skill answers',
      () => {
        then(
          'the trust answer is READ off the pane, never a hardcoded digit',
          () => {
            const held = readAuth();

            // one helper owns the answer, and both legs call it
            expect(held.includes('__answer_trust()')).toEqual(true);
            expect(held.split('__answer_trust "$pane"').length - 1).toEqual(2);

            // 🔴 the digit comes from the pane, because the ORDER is what changed.
            //    a hardcoded 2 would be the identical defect, one release later.
            expect(
              /__digit=\$\(printf[^\n]*\$__pane[^\n]*grep -oE/.test(held),
            ).toEqual(true);

            // and the arrow render MOVES before it confirms — a bare Enter declines
            const helper = held.slice(held.indexOf('__answer_trust()'));
            const body = helper.slice(0, helper.indexOf('\n}\n'));
            expect(body.includes("send-keys -t '$AUTH_SESSION' Down")).toEqual(
              true,
            );
            expect(body.indexOf('Down')).toBeLessThan(body.indexOf('Enter'));
          },
        );

        then('the fullscreen renderer is DECLINED on both legs', () => {
          // .why = it draws on the alternate screen buffer, which capture-pane does
          //        not read. to accept is to blind the instrument the skill IS.
          const held = readAuth();
          expect(held.split('*"fullscreen renderer"*)').length - 1).toEqual(2);
          expect(held.split('fullscreen renderer → 2').length - 1).toEqual(2);
        });

        then(
          'a STILL pane under a live select fails fast, and names the screen',
          () => {
            // 🔴 .why = a dead keystroke and a slow boot are indistinguishable from
            //    outside — both are a loop that waits. so the cap alone reports
            //    "gave up after 90s" and names NO cause, which is exactly why the
            //    v2.1.270 trust break read as "the skill got slow" and cost six
            //    rounds of thought aimed at ssh and tmux.
            //
            // ⇒ a byte-identical pane says our answer did not take. beside a live
            //   select that will never clear, so the wait is pure loss.
            const held = readAuth();
            expect(
              held.split(
                'if [[ "$pane" == "$pane_prev" ]]; then still=$((still + 1))',
              ).length - 1,
            ).toEqual(2);
            expect(held.split('"$still" -ge 4').length - 1).toEqual(2);

            // ⚠️ scoped to a live SCREEN — a still pane with no screen up is an
            //    ordinary wait, and to fail on that trades a real defect for a
            //    false alarm.
            //
            // 🔴 named by CONJUNCTION, never by a global count of the screen probe.
            //    this line once read `split("grep -q 'Enter to confirm'") === 2`,
            //    which is a PROXY: it held only while the stall guard was the sole
            //    reader of that phrase. the unknown-screen guard is a second reader,
            //    so the count went to 4 and the clamp went red over a change that
            //    strengthened the very property it guards. bind to the property.
            expect(
              held.split(`"$still" -ge 4 ]] && __screen_up "$pane"`).length - 1,
            ).toEqual(2);

            // and both counters are reset per leg, or the second leg inherits a stall
            expect(held.split('pane_prev=""').length - 1).toEqual(2);
            expect(held.split('still=0').length - 1).toBeGreaterThanOrEqual(2);
          },
        );

        then(
          'every wait is capped by WALL CLOCK, never by a pass count alone',
          () => {
            // .why = a pass budget says naught about elapsed time when each pass pays
            //        an ssh handshake of unknown cost. the cap is what turned a
            //        six-round mystery into a one-run diagnosis.
            const held = readAuth();
            expect(held.includes('STEP_CAP_SECS')).toEqual(true);
            expect(held.split('-ge "$STEP_CAP_SECS"').length - 1).toEqual(2);

            // and a timeout must DUMP the pane — the verdict is the screen itself
            expect(held.includes('the pane, as we last read it')).toEqual(true);
          },
        );

        then(
          'leg 2 CONVERGES on a re-run, and never re-pastes into a filled box',
          () => {
            // 🔴 .why = a blind re-paste APPENDS to what the box already holds, so a
            //    second run over a stuck first one yields a doubled code — and the
            //    failure then reads as a bad code rather than as our own fault.
            //
            // ⚠️ the three states need three acts, and the middle one is the whole
            //    rule: box empty → paste + submit · box FILLED → submit only ·
            //    prompt gone → skip to the chain.
            const held = readAuth();
            expect(
              held.includes(
                'the box already holds a code — submit only, never re-paste',
              ),
            ).toEqual(true);
            expect(held.includes('the code box is already gone')).toEqual(true);

            // the paste is guarded by a read of the box, never issued blind
            expect(held.indexOf("grep -q 'Paste code here'")).toBeLessThan(
              held.indexOf("send-keys -t '$session' -l '$code_q'"),
            );
          },
        );

        then(
          'the code SUBMIT is its own send, never an arg on the paste',
          () => {
            // 🔴 .why = a long code arrives as a PASTE, and the Ink box swallows an
            //    Enter that rides in the same `send-keys`. the code then sits
            //    unsubmitted while the skill reports it sent — measured 2026-09-09,
            //    a 92-char code masked in the box under a "prompt STILL up" error.
            //
            // ⇒ the tell was that a human finished it by hand
            //   (`rule.always.entool-the-skills-you-touch`).
            const held = readAuth();
            expect(
              held.includes("send-keys -t '$session' '$code_q' Enter"),
            ).toEqual(false);
            expect(
              held.includes("send-keys -t '$session' -l '$code_q'"),
            ).toEqual(true);
            expect(held.includes("send-keys -t '$session' Enter")).toEqual(
              true,
            );
          },
        );

        then('the account is read by FIELD NAME, never by a jq path', () => {
          // 🔴 claude code v2.1.270 FLATTENED the schema: `.account.email` became
          //    `.email`, `.organization.uuid` became `.orgId`. a path read now
          //    returns null, so a verdict built on one reports "signed in as
          //    nobody" over a healthy credential — an error on a run that worked.
          //
          // ⇒ the field NAMES survived and only their DEPTH moved, so a name match
          //   holds where a path match breaks. bind to the least a caller needs.
          const held = readAuth();
          expect(held.includes('__account_read()')).toEqual(true);
          expect(held.includes('.account.email')).toEqual(false);
          expect(held.includes('.organization.')).toEqual(false);

          // both fields, by name
          const helper = held.slice(held.indexOf('__account_read()'));
          const body = helper.slice(0, helper.indexOf('\n}\n'));
          expect(body.includes('"email"')).toEqual(true);
          expect(body.includes('"orgId"')).toEqual(true);
        });

        then(
          'the swap verdict is a COMPARISON on both fields, never a single read',
          () => {
            // 🔴 .why = a no-op swap and a real one print the same `signed in as X`.
            //    the account is chosen by the BROWSER, so a caller who does not sign
            //    out first re-auths the one they meant to leave — and the run
            //    SUCCEEDS, writes a fresh credential, and reports truthfully
            //    (`term=auth.swap`).
            //
            // ⚠️ both fields, because one human can hold two orgs: an unmoved email
            //    beside a moved orgId is a real swap that `email` alone calls a no-op.
            const held = readAuth();
            expect(
              held.includes(
                '"$email_before" == "$email_now" && "$org_before" == "$org_now"',
              ),
            ).toEqual(true);

            // 🔴 BOTH legs take a before, because they are separate INVOCATIONS. a
            //    before captured only at the boot is gone by the time leg 2 runs, so
            //    the verdict would degrade to a single read on the one path a caller
            //    actually walks (`--code`) — and degrade SILENTLY.
            expect(
              held.split('acct_before=$(__account_read)').length - 1,
            ).toEqual(2);

            // and each is taken BEFORE its leg acts — there is no second chance
            expect(held.indexOf('acct_before=$(__account_read)')).toBeLessThan(
              held.indexOf('acct_after=$(__account_read)'),
            );
            expect(
              held.lastIndexOf('acct_before=$(__account_read)'),
            ).toBeLessThan(
              held.indexOf("send-keys -t '$session' -l '$code_q'"),
            );

            // 🔴 and UNREAD must not pass as a comparison. both states are the empty
            //    string, so a sentinel is the only thing that parts them.
            expect(held.includes('acct_before_read')).toEqual(true);
            expect(held.includes('a read, never a comparison')).toEqual(true);

            // a no-op is a CONSTRAINT the caller must act on, never a success
            const noop = held.slice(
              held.indexOf('NO-OP — the credential is fresh'),
            );
            expect(
              noop.slice(0, noop.indexOf('\n  fi')).includes('exit 2'),
            ).toEqual(true);
          },
        );

        then('a REFUSED code is parted from a no-op, and outranks it', () => {
          // 🔴 the sharpest defect this file has held, because the wrong verdict
          //    was CONFIDENT and its cure was useless.
          //
          // .why they collide: a failed exchange and a no-op swap both leave the
          //   account unmoved, and `auth status` reads the CREDENTIAL — which a
          //   refused exchange never touched. so the endpoint answers perfectly,
          //   the comparison reads `before == after`, and the no-op arm claims
          //   `the credential is fresh` over one that never moved. it then blames
          //   the browser and prescribes a sign-out that repairs no part of it.
          //
          // ⚠️ measured 2026-09-14 on `grove-sandpine-v20260901`: a 400 exited 2 as
          //   a no-op. the pane held `OAuth error: Request failed with status
          //   code 400` the whole time (`rule.require.trust-but-verify` — read the
          //   pane, never reason about it).
          //
          // ⇒ so the two are parted UPSTREAM, at the pane, and the fact rides down
          //   in `$oauth_err`. the comparison below is sound ONLY because a
          //   failure has already exited by the time it runs.
          const held = readAuth();
          expect(held.includes("grep -q 'OAuth error'")).toEqual(true);
          expect(held.includes('oauth_err=')).toEqual(true);

          // 🔴 the ORDER is the repair. it must outrank all three neighbours, each
          //    of which would otherwise print a sentence that is false on this path
          expect(held.indexOf('if [[ -n "$oauth_err" ]]')).toBeLessThan(
            held.indexOf('NO-OP — the credential is fresh'),
          );
          expect(held.indexOf('if [[ -n "$oauth_err" ]]')).toBeLessThan(
            held.indexOf('the repl never came up'),
          );
          expect(held.indexOf('if [[ -n "$oauth_err" ]]')).toBeLessThan(
            held.indexOf('signed in as nobody'),
          );

          // a failure is a MALFUNCTION (1), never a constraint (2) — the caller
          // did their part; the exchange did not
          const fail = held.slice(held.indexOf('the code was REFUSED'));
          expect(
            fail.slice(0, fail.indexOf('\n  fi')).includes('exit 1'),
          ).toEqual(true);

          // and it must say OUT LOUD that it is not the no-op, or a reader who has
          // seen the no-op once will apply that cure here
          expect(held.includes('this is NOT a no-op swap')).toEqual(true);
        });

        then('the boot size is read BACK, never quoted from the flag', () => {
          // 🔴 the echo said `at 200x50` while the pane was 45x25, for as long as
          //    the skill existed. `-x/-y` holds only under `window-size manual`.
          const held = readAuth();
          expect(held.includes('window-size manual')).toEqual(true);
          expect(held.includes('resize-window')).toEqual(true);

          // the render quotes the RECORD, and the flag only as the ask
          expect(held.includes('pane_wh=$(')).toEqual(true);
          expect(held.includes('${pane_wh:-unread} (asked 200x50)')).toEqual(
            true,
          );
        });

        then(
          'an UNMATCHED screen fails on sight, and names the product version',
          () => {
            // 🔴 .why = the stall guard needs a BYTE-IDENTICAL pane, so a screen that
            //    animates — a spinner, a blink, a token counter — never trips it and
            //    burns the full cap instead. this guard keys on the absence of an
            //    ARM, which is a fact about our own code rather than about the paint,
            //    so no amount of animation can hide it.
            //
            // ⚠️ measured 2026-09-09: v2.1.270 added `Try the new fullscreen
            //    renderer?` and it sat unreachable behind a broken trust arm. with
            //    this guard it names ITSELF, by its own body text, on first render.
            const held = readAuth();
            expect(held.split('unknown=$((unknown + 1))').length - 1).toEqual(
              2,
            );
            expect(held.split('"$unknown" -ge 2').length - 1).toEqual(2);
            expect(
              held.split('a screen is up that this skill has NO ARM for')
                .length - 1,
            ).toEqual(2);

            // ⚠️ TWO passes, never one — a screen mid-paint matches no arm for an
            //    instant, and to fail on that trades a real defect for a false alarm
            expect(held.includes('"$unknown" -ge 1')).toEqual(false);

            // ⚠️ and scoped to a live SCREEN, or it fires on the repl, on a spinner,
            //    and on every ordinary pane the chain passes through.
            //
            // ⇒ bound by CONJUNCTION, per the lesson one clamp up: a global count of
            //   the screen probe is a proxy that the NEXT reader of that phrase
            //   breaks, and it breaks on a change that added a guard rather than
            //   removed one.
            expect(
              held.includes(`[[ -z "$kind" ]] && __screen_up "$pane"`),
            ).toEqual(true);

            // 🔴 and leg 2 clears BOTH axes, never `$kind` alone. it ranks by ANSWERED
            //    state rather than by position, so a pane with a live repl is one the
            //    skill UNDERSTANDS even where no case arm matched — `$kind` alone
            //    would fire on the terminus itself, on every clean run.
            expect(
              held.includes(
                `[[ -z "$kind" && -z "$repl" ]] && __screen_up "$pane"`,
              ),
            ).toEqual(true);

            // both counters reset per leg, or leg 2 inherits leg 1's tally
            expect(held.split('unknown=0').length - 1).toBeGreaterThanOrEqual(
              4,
            );

            // the dump names the VERSION, because a break in the chain is almost
            // always a version move — and that is the one fact a reader needs first
            expect(
              held.split('claude ${brain_version:-unread}').length - 1,
            ).toBeGreaterThanOrEqual(2);
          },
        );

        then(
          'BOTH guards share ONE screen probe, never a phrase copied twice',
          () => {
            // 🔴 .why = the probe was written inline at each guard, and all four
            //    copies keyed on `Enter to confirm` — the SELECT footer, and not the
            //    only screen claude parks on. so the guards had ONE blind spot
            //    between them, and neither could cover for the other.
            //
            // ⚠️ measured 2026-09-14: a refused code rendered `OAuth error … / Press
            //    Enter to retry. / Esc to cancel`, byte-identical for 30 passes over
            //    76 seconds. it matched no arm (the unknown guard's business) and it
            //    never moved (the stall guard's business) — and it carried no
            //    `Enter to confirm`, so neither guard so much as looked.
            //
            // ⇒ a probe duplicated into N callers is one probe with N chances to be
            //   wrong TOGETHER (`rule.always.pave-on-second-repeat`). one helper, and
            //   a new footer is added there rather than at any call site.
            const held = readAuth();
            expect(held.includes('__screen_up()')).toEqual(true);
            expect(held.split('__screen_up "$pane"').length - 1).toEqual(4);

            // the footers it knows, beyond the select
            const helper = held.slice(held.indexOf('__screen_up()'));
            const body = helper.slice(0, helper.indexOf('\n}\n'));
            expect(body.includes('Enter to confirm')).toEqual(true);
            expect(body.includes('Esc to cancel')).toEqual(true);

            // 🔴 and NO guard may keep its own copy — that is how the hole reopens.
            //    scoped past the helper, so the helper's own regex is exempt.
            const guards = held.slice(
              held.indexOf('__screen_up()') + body.length,
            );
            expect(guards.includes("grep -q 'Enter to confirm'")).toEqual(
              false,
            );
          },
        );
      },
    );
  });
});
