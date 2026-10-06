// biome-ignore-all lint/suspicious/noControlCharactersInRegex: a captured tmux
// pane IS a stream of ANSI escapes, so every clamp here must strip them before
// it reads the text. the \u001b is the subject of these regexes rather than a
// typo in them — the rule is a false positive over a terminal-capture corpus.
/**
 * .what = clamps on what a pane IS — a husk, a crash, a picker, live chrome
 *
 * .note = a PART of the `ductwork` suite, cut so one reviewer can hold
 *         it whole. the suite's shared fixtures, and its account of what it
 *         runs against and why, live in ductwork.harness.ts.
 */
import { readFileSync } from 'fs';
import { join } from 'path';
import { given, then, useBeforeAll, when } from 'test-fns';

import { tempDirs } from '../../../.test/tempDirs';
import {
  genSocket,
  readCrewwork,
  readDuctwork,
  SOCKETS_MADE,
} from './ductwork.harness';
import {
  delStaleTestServers,
  delStaleTestSockets,
  delTmuxServer,
  hasTmux,
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
  // .what = run a pure pane-classifier from ductwork against a fixture, with NO
  //         tmux server spun — the fn takes the flattened text as an arg.
  // .why  = these two discriminators are what the babysit tick reads to tell a
  //         DEAD or a WEDGED clone from a healthy one, and they sat inline in
  //         duct.poll's per-duct loop where no clamp could reach them. extracted
  //         into ductwork so `runDuct` can source them and feed a fixture; the
  //         verdict rides out on stdout (rule.require.clamp-edge-cases).
  const runClassifier = (input: {
    fn: string;
    fixture: string;
  }): { stdout: string } => {
    const out = runDuct({
      socket: genSocket('classify'),
      ductworkDir: tempDirs.genOne({ slug: 'registry' }),
      body: [
        "flat=$(cat <<'FIXEOF'",
        input.fixture,
        'FIXEOF',
        ')',
        `if ${input.fn} "$flat"; then echo "VERDICT=yes"; else echo "VERDICT=no"; fi`,
      ].join('\n'),
    });
    return { stdout: out.stdout };
  };

  given(
    '[case15] __duct_pane_is_husk — a dead claude that left a resume banner',
    () => {
      // a HUSK: claude exited on a signal (💥143), left `Resume this session
      // with:`, and the pane still holds the STALE ❯ box it drew BEFORE it died.
      // that stale caret sits ABOVE the banner, so a live-box classifier reads it
      // as alive — which is the 8h `😴 unread` svc-reservations defect this catches.
      when('[t0] the banner is present and the only ❯ is ABOVE it', () => {
        const scene = useBeforeAll(async () =>
          runClassifier({
            fn: '__duct_pane_is_husk',
            fixture: [
              '❯ run the task',
              '  ⎿  interrupted',
              '💥143 ➜',
              'Resume this session with: claude --resume 7f3a',
              'bert@grove svc-reservations.beav.feat-x %',
            ].join('\n'),
          }),
        );
        then('it classifies HUSK', () => {
          expect(scene.stdout).toContain('VERDICT=yes');
        });
      });

      // 🔴 the TOOTH. a naive `grep 'Resume this session with:'` classifies this
      //    husk too — but claude RESTARTED here, so a ❯ sits BELOW the banner and
      //    the clone is genuinely live. the awk-anchor is what tells them apart; a
      //    reboot of a restarted clone would BURN its live conversation.
      when('[t1] claude RESTARTED — a live ❯ sits BELOW the banner', () => {
        const scene = useBeforeAll(async () =>
          runClassifier({
            fn: '__duct_pane_is_husk',
            fixture: [
              '💥143 ➜',
              'Resume this session with: claude --resume 7f3a',
              'bert@grove % claude --resume',
              '✻ Welcome back',
              '❯ type here',
            ].join('\n'),
          }),
        );
        then('it does NOT classify husk (the clone is alive again)', () => {
          expect(scene.stdout).toContain('VERDICT=no');
        });
      });

      when('[t2] a normal live box, no resume banner at all', () => {
        const scene = useBeforeAll(async () =>
          runClassifier({
            fn: '__duct_pane_is_husk',
            fixture: ['✻ at work', '❯ type here'].join('\n'),
          }),
        );
        then('it does NOT classify husk', () => {
          expect(scene.stdout).toContain('VERDICT=no');
        });
      });

      // 🔴 the REAL-WORLD clamp — the VERBATIM pane, captured 2026-09-14 straight
      //    from `git.crew.read` into .test/.assets/ (never hand-typed — a tidied
      //    fixture clamps a pane that never existed). from the star
      //    rhachet-roles-ehmpathy.beav.feat-auto-review-permission-responses: the
      //    husk banner sits at the BOTTOM, beneath a whole layer of STALE scrollback
      //    — a spinner, a product survey, and the STALE ❯ box + stone line claude
      //    drew before it died. a detector fooled by the spinner reads `😶 at work`;
      //    one fooled by the survey answers a modal; one fooled by the stale ❯ reads
      //    it live. the truth is the LAST line — a `💥143 ➜` shell prompt after the
      //    resume banner, no ❯ below it. exactly the pane the poll must never miss.
      //    (rule.always.clamp-the-verbatim-pane-your-classifier-judged)
      when(
        '[t3] REAL: husk banner below a stale spinner + survey + ❯ box',
        () => {
          const scene = useBeforeAll(async () =>
            runClassifier({
              fn: '__duct_pane_is_husk',
              fixture: readFileSync(
                join(
                  __dirname,
                  '.test/.assets/pane.husk.below-stale-scrollback.log',
                ),
                'utf8',
              ),
            }),
          );
          then(
            'it classifies HUSK (the bottom shell prompt is the truth)',
            () => {
              expect(scene.stdout).toContain('VERDICT=yes');
            },
          );
        },
      );
    },
  );

  /**
   * [case-chrome] — `❯` is ONE piece of claude's chrome, and its absence was
   *                 read as the absence of CLAUDE
   *
   * 🔴 .the harm = the box ladder's last arm rendered `none` ("a plain shell
   *    duct"), the crew fold promotes that to `💀 husk` for a MECHANIC, and a
   *    husk's cure REBOOTS. so a live clone whose caret did not reach the read
   *    window was one heal away from a burned conversation
   *    (rule.forbid.byhand-fix-that-burns-the-live-proof).
   *
   *    measured 2026-09-16 on
   *    `rhachet-roles-ehmpathy.beav.feat-auto-review-permission-responses`:
   *      poll → `mechanic:shell` → `🚦 1 husk` → the `--healable` set
   *      heal → "a live claude box is up — not a husk"
   *    two instruments, one pane, opposite verdicts — the exact split
   *    `define.invariant.crew.husk.discriminator-parity` forbids. heal was
   *    right, and it was right only by accident: it found a STALE `❯` in its
   *    wider window. a pane with no stale caret makes both agree on `husk`.
   *
   * ⚠️ .the shape = a screen named for one MEMBER of a set detects exactly that
   *    member (rule.require.enumerate-before-you-name). the fourth instance in
   *    two sessions, after `__crew_is_crew_tree`, `__crew_is_healable` $5, and
   *    the stuck-stone family.
   */
  given(
    '[case-chrome] claude is alive when its CHROME is drawn, caret or no caret',
    () => {
      const asset = (slug: string): string =>
        join(__dirname, `.test/.assets/${slug}`);

      // 🔴 REAL, VERBATIM — the pane that produced the split, captured straight
      //    from `git.crew.read --raw`. its first lines carry the capture
      //    wrapper's own banner; the classifier reads neither a `❯` nor a `───`
      //    there, so the verdict is identical with or without them.
      when(
        '[t0] REAL: 30 lines, ZERO carets, and the mode footer on the last line',
        () => {
          const pane = (): string =>
            readFileSync(
              asset('pane.box.live-claude-with-no-caret-in-window.log'),
              'utf8',
            );

          then(
            'the fixture genuinely holds no ❯ — else it clamps naught',
            () => {
              // the precondition IS the case. a fixture with a caret would take an
              // arm far above the one under test and pass vacuously.
              expect(pane().includes('❯')).toEqual(false);
            },
          );

          then('and it genuinely holds the live mode footer', () => {
            expect(pane().includes('shift+tab to cycle')).toEqual(true);
          });

          const scene = useBeforeAll(async () =>
            runClassifier({
              fn: '__duct_pane_has_claude_chrome',
              fixture: readFileSync(
                asset('pane.box.live-claude-with-no-caret-in-window.log'),
                'utf8',
              ),
            }),
          );

          then('🔴 the detector calls it ALIVE', () => {
            expect(scene.stdout).toContain('VERDICT=yes');
          });
        },
      );

      // the counter-clamp, and the one that keeps `none` useful. a genuine plain
      // shell duct — a foreman seat — must still read as no-claude, or the arm
      // this cure guards would never fire again and every shell duct would
      // render `covered`.
      when('[t1] a genuine plain shell duct carries no chrome at all', () => {
        const scene = useBeforeAll(async () =>
          runClassifier({
            fn: '__duct_pane_has_claude_chrome',
            fixture: [
              '➜  feat-auto-review-permission-responses git:(beav/feat-auto-review) ',
              '➜  ls',
              'package.json  src  readme.md',
              '➜  ',
            ].join('\n'),
          }),
        );

        then('no chrome, no claim', () => {
          expect(scene.stdout).toContain('VERDICT=no');
        });
      });

      // ⚠️ a HUSK's scrollback carries this chrome too — it was drawn by the
      //    program before it died. the detector says ALIVE there, and that is
      //    correct for what it measures: the caller runs `__duct_pane_is_husk`
      //    FIRST, so the resume banner claims the pane before the chrome is read.
      //    this clamp pins that ORDER, because the day it inverts, every husk
      //    stops being healable.
      when(
        '[t2] the husk arm still outranks the chrome arm in the ladder',
        () => {
          const readPoll = (): string =>
            readFileSync(join(__dirname, '..', 'duct.poll.sh'), 'utf8');

          then('__duct_pane_is_husk is tested ABOVE the chrome arm', () => {
            const src = readPoll();
            const huskAt = src.indexOf('__duct_pane_is_husk "$flat"');
            const chromeAt = src.indexOf(
              '__duct_pane_has_claude_chrome "$flat"',
            );
            expect(huskAt).toBeGreaterThan(0);
            expect(chromeAt).toBeGreaterThan(0);
            expect(huskAt).toBeLessThan(chromeAt);
          });

          then(
            'and a chromed, caretless pane falls to `covered`, never `none`',
            () => {
              // `covered` says "claude is live; read it, never key it" — the right
              // move. `none` says "boot a clone that is already alive."
              const src = readPoll();
              const i = src.indexOf('__duct_pane_has_claude_chrome "$flat"');
              expect(src.slice(i, i + 500).includes('box="covered"')).toEqual(
                true,
              );
            },
          );
        },
      );
    },
  );

  // .what = a mechanic mid AUTO-COMPACT reads ALIVE, on every arm of the ladder.
  //
  // 🔴 .why — measured 2026-09-17 on
  //    `rhachet-roles-bhrain.beav.fix-budget-grant-needs-urgent-concession`.
  //    `git.crew.poll --healable` named the tree and rendered `💀 husk`; the
  //    heal line it emitted then REFUSED on the same tree — "a live claude box
  //    is up — not a husk". two instruments, one crew, opposite verdicts
  //    (define.invariant.crew.husk.discriminator-parity, inverted).
  //
  //    a `--raw` read settled who was right: the clone sat at the auto-compact
  //    spinner, with a queued box and its mode footer both drawn. ALIVE. heal
  //    was right and the poll was wrong.
  //
  // ⚠️ .the fixture below is that pane, VERBATIM, and it does NOT reproduce the
  //    split — fed to this ladder it classifies alive on every arm. so the
  //    poll's husk verdict was a read of a DIFFERENT screen: a compact clears
  //    and redraws, so a read that lands mid-redraw sees a pane with no box and
  //    no chrome at all. the divergence is in TIME, not in logic
  //    (`.dream/v2026_09_17.fix.the-husk-verdict-is-a-single-unconfirmed-read.md`).
  //
  // 🔴 .so what this clamps is the CORRECT verdict, and that is the point.
  //    every real pane a classifier judges is worth a fixture — a right answer
  //    today regresses on the next detector edit with zero signal
  //    (rule.always.clamp-the-verbatim-pane-your-classifier-judged). the day
  //    someone narrows the chrome set or the box ladder, this goes red.
  given(
    '[case-compact] a mechanic mid AUTO-COMPACT is ALIVE, never a husk',
    () => {
      const asset = (slug: string): string =>
        join(__dirname, `.test/.assets/${slug}`);
      const SLUG = 'pane.husk.false-positive-under-auto-compact.log';

      // the same two seds duct.poll runs before it hands `flat` to the ladder —
      // sgr codes stripped, NBSP folded. to clamp the RAW bytes would clamp a
      // string the classifier never receives.
      const flat = (): string =>
        readFileSync(asset(SLUG), 'utf8')
          // ANSI strip — see the biome-ignore-all at the head of this file
          .replace(/\u001b\[[0-9;]*m/g, '')
          .replace(/\u00a0/g, ' ');

      when('[t0] the fixture is read', () => {
        then(
          'it holds the auto-compact spinner — else it clamps another pane',
          () => {
            // the precondition IS the case. a fixture without the spinner would
            // pass on some other pane's merits.
            expect(flat()).toContain('Compacting conversation');
          },
        );

        then(
          'it holds NO resume banner — the husk marker is genuinely absent',
          () => {
            expect(flat()).not.toContain('Resume this session with:');
          },
        );

        then('and it holds the live mode footer', () => {
          expect(flat()).toContain('shift+tab to cycle');
        });
      });

      when('[t1] the HUSK arm reads it', () => {
        const scene = useBeforeAll(async () =>
          runClassifier({ fn: '__duct_pane_is_husk', fixture: flat() }),
        );

        then(
          '🔴 it is NOT a husk — a reboot here burns the conversation',
          () => {
            // the compact exists to PRESERVE the transcript. to reboot mid-compact
            // destroys what the clone is at work to keep
            // (rule.forbid.byhand-fix-that-burns-the-live-proof).
            expect(scene.stdout).toContain('VERDICT=no');
          },
        );
      });

      when('[t2] the CHROME arm reads it', () => {
        const scene = useBeforeAll(async () =>
          runClassifier({
            fn: '__duct_pane_has_claude_chrome',
            fixture: flat(),
          }),
        );

        then('🔴 it calls the clone ALIVE', () => {
          expect(scene.stdout).toContain('VERDICT=yes');
        });
      });
    },
  );

  // 🔴 .measured 2026-09-18 — infrastructure.beav.feat-camp-git-backup-bucket
  //    the seat sat 3494m (58h) parked at claude's INTERACTIVE `Resume Session`
  //    picker. two instruments, one pane, opposite verdicts — the parity
  //    invariant inverted (define.invariant.crew.husk.discriminator-parity):
  //
  //      crew.heal  → `💀 husk … safe to heal` + a cure plan
  //      crew.poll  → `❔unread`, and `--healable` named it NOT AT ALL
  //
  // ⚠️ heal was the one that was RIGHT. so this arm RESTORES parity rather than
  //    widens it — the cure path already exists (crewwork.sh drives the picker
  //    with `--keys Enter`); the poll simply never routed here to reach it.
  //
  // 🔴 the harm is that `❔unread` prescribes "re-read the duct", and a re-read
  //    settles naught — the pane reads in full, and the second read repeats the
  //    first. so the one seat state whose guide is a DEAD END is also the one
  //    the actionable set omits
  //    (rule.require.a-cure-path-for-every-named-husk-shape).
  //
  // ⚠️ the extant arm cannot fire here: a picker carries NO `Resume this session
  //    with:` banner. it is a DIFFERENT dead shape under the same word.
  given(
    '[case-picker] a seat parked at the `Resume Session` picker IS a husk',
    () => {
      const asset = (slug: string): string =>
        join(__dirname, `.test/.assets/${slug}`);
      const SLUG = 'pane.husk.parked-at-the-resume-session-picker.log';

      // the same two seds duct.poll runs before it hands `flat` to the ladder.
      const flat = (): string =>
        readFileSync(asset(SLUG), 'utf8')
          // ANSI strip — see the biome-ignore-all at the head of this file
          .replace(/\u001b\[[0-9;]*m/g, '')
          .replace(/\u00a0/g, ' ');

      when('[t0] the fixture is read', () => {
        then('it holds the picker title — else it clamps another pane', () => {
          expect(flat()).toContain('Resume Session');
        });

        then(
          'and the picker FOOTER — the half a prose mention cannot carry',
          () => {
            expect(flat()).toContain('Esc to cancel');
          },
        );

        then(
          '🔴 and NO resume banner — so the extant arm provably cannot fire',
          () => {
            // the precondition IS the case. with a banner present this fixture
            // would pass on the OLD arm's merits and clamp naught.
            expect(flat()).not.toContain('Resume this session with:');
          },
        );
      });

      when('[t1] the HUSK arm reads it', () => {
        const scene = useBeforeAll(async () =>
          runClassifier({ fn: '__duct_pane_is_husk', fixture: flat() }),
        );

        then(
          '🔴 it classifies HUSK — so --healable names it and heal is reached',
          () => {
            expect(scene.stdout).toContain('VERDICT=yes');
          },
        );
      });

      // 🔴 THE TOOTH. the words `Resume Session` appear in this repo's own briefs
      //    and test files, so a clone that reads one carries the literal in its
      //    pane. a bare title match would reboot a LIVE clone mid-read — the
      //    exact harm rule.forbid.byhand-fix-that-burns-the-live-proof names.
      //    the FOOTER is what parts a picker from a mention of one.
      when('[t2] a LIVE clone merely MENTIONS the picker in its output', () => {
        const scene = useBeforeAll(async () =>
          runClassifier({
            fn: '__duct_pane_is_husk',
            fixture: [
              '● I read the brief. it says the `Resume Session` picker opens',
              '  with zero rows when the session never registered.',
              '❯ ',
              '  ⏵⏵ accept edits on (shift+tab to cycle)',
            ].join('\n'),
          }),
        );

        then('🔴 it is NOT a husk — a title alone must never fire', () => {
          expect(scene.stdout).toContain('VERDICT=no');
        });
      });

      // the second tooth: the picker's footer is shared with claude's OTHER
      // pickers (model, file). a footer alone must not fire either — only the
      // pair does (rule.require.enumerate-before-you-name: two literals, one arm).
      when('[t3] a DIFFERENT picker carries the same footer', () => {
        const scene = useBeforeAll(async () =>
          runClassifier({
            fn: '__duct_pane_is_husk',
            fixture: [
              'Select Model',
              '  ❯ opus',
              '    sonnet',
              '  Type to search · Esc to cancel · ',
            ].join('\n'),
          }),
        );

        then('🔴 it is NOT a husk — the clone is live and mid-choice', () => {
          expect(scene.stdout).toContain('VERDICT=no');
        });
      });
    },
  );

  // .what = a pane that holds the resume BANNER *and* the resume PICKER — the
  //         shape a half-finished revive leaves behind it.
  //
  // 🔴 .measured 2026-09-20 — rhachet-roles-bhrain.beav.feat-review-cost-meter,
  //    a SPONSORED star. the clone died `💥143` (SIGTERM, the signal earlyoom
  //    sends) mid-turn after a 14m run, and left arm 1's `Resume this session
  //    with:` banner. a revive then typed `claude --resume 'mechanic' cont`,
  //    which drew the `Resume Session` picker — and parked on it.
  //      crew.poll     → `😶 inflight`, seat rendered as `🙋ask?`
  //      --healable    → `no tree to heal … none a husk`
  //    so the one seat whose clone was GONE was the one the actionable set
  //    omitted (rule.require.a-cure-path-for-every-named-husk-shape).
  //
  // 🔴 .the cause is arm 1's SHORT-CIRCUIT, and it is the third instance of one
  //    root cause: `a bare ❯ is not evidence of a live box`. the picker draws
  //    its own row highlight as `❯ mechanic`, which sits BELOW the banner — so
  //    arm 1's order test reads "claude RESTARTED, genuinely live", and its
  //    unconditional `return` denies arm 2 the pane it was written for.
  //    arm 3 carried the identical hazard and had its guard REMOVED for the
  //    identical reason; arm 1 was never given the same treatment.
  //
  // ⚠️ .this is NOT the case-picker fixture one row over. THAT one asserts
  //    `not.toContain('Resume this session with:')` as its precondition — it
  //    provably cannot reach arm 1, so it can never grade arm 1's return. a
  //    fixture of one can never clamp the other
  //    (rule.require.enumerate-before-you-name).
  given(
    '[case-banner-then-picker] a revive PARKED at the picker, under a banner',
    () => {
      const asset = (slug: string): string =>
        join(__dirname, `.test/.assets/${slug}`);
      const SLUG = 'pane.husk.revive-parked-at-picker-read-as-an-ask.log';

      // the same two seds duct.poll runs before it hands `flat` to the ladder.
      const flat = (): string =>
        readFileSync(asset(SLUG), 'utf8')
          // ANSI strip — see the biome-ignore-all at the head of this file
          .replace(/\u001b\[[0-9;]*m/g, '')
          .replace(/\u00a0/g, ' ');

      when('[t0] the fixture is read', () => {
        then(
          '🔴 it holds the BANNER — the half that routes it into arm 1',
          () => {
            // the precondition IS the case. with no banner this fixture would pass
            // on the case-picker arm's merits and clamp naught.
            expect(flat()).toContain('Resume this session with:');
          },
        );

        then(
          'and the picker TITLE and FOOTER — so arm 2 could grade it',
          () => {
            expect(flat()).toContain('Resume Session');
            expect(flat()).toContain('Esc to cancel');
          },
        );

        then(
          'and a ❯ BELOW the banner — the picker row that misled arm 1',
          () => {
            const after = flat()
              .split('Resume this session with:')
              .slice(1)
              .join('');
            expect(after).toContain('❯');
          },
        );
      });

      when('[t1] the HUSK arm reads it', () => {
        const scene = useBeforeAll(async () =>
          runClassifier({ fn: '__duct_pane_is_husk', fixture: flat() }),
        );

        then(
          '🔴 it classifies HUSK — so --healable names it and heal is reached',
          () => {
            // .restore arm 1's `return` to see this go red.
            expect(scene.stdout).toContain('VERDICT=yes');
          },
        );
      });

      // 🔴 THE TOOTH. arm 1's order test is REAL and must survive: a clone that
      //    genuinely restarted after an exit carries the banner in its scrollback
      //    and a live box below it. to fire there would reboot a healthy clone
      //    (rule.forbid.byhand-fix-that-burns-the-live-proof).
      when(
        '[t2] a clone genuinely RESTARTED below its own stale banner',
        () => {
          const scene = useBeforeAll(async () =>
            runClassifier({
              fn: '__duct_pane_is_husk',
              fixture: [
                'Resume this session with:',
                'claude --resume "mechanic"',
                '➜ claude --resume mechanic cont',
                '● I read the brief already.',
                '❯ ',
                '  ⏵⏵ accept edits on (shift+tab to cycle)',
              ].join('\n'),
            }),
          );

          then(
            '🔴 it is NOT a husk — the fall-through must not widen arm 1',
            () => {
              expect(scene.stdout).toContain('VERDICT=no');
            },
          );
        },
      );
    },
  );

  given(
    '[case-clean-exit-husk] a clone that exited CLEAN is a husk too',
    () => {
      /** .what = the husk class whose claude left NO forensic token at all.
       *
       *  🔴 .why = every extant arm pairs the returned shell with a token that
       *    proves a DEPARTURE, and each of the four is drawn by a different
       *    KIND of death:
       *      arm 1  `Resume this session with:`      — claude, on a clean quit
       *      arm 2  the `Resume Session` picker      — a revive that parked
       *      arm 3  `💥<code>`                        — the shell, on nonzero `$?`
       *      arm 4  `----- Native stack trace -----`  — node, on a fatal
       *    ⇒ a clone that simply ENDS — its turn done, its alt-screen torn
       *      down, its shell back at 0 — prints not one of them. so the ladder
       *      was silent and the chrome arm read the STALE pre-exit `❯` as a
       *      live box.
       *
       *  🔴 .measured 2026-09-20 — infrastructure.beav.feat-camp-git-backup-bucket,
       *    the SAME tree arm 4 was written for that same day, now dead of a
       *    different cause. the spinner froze at `1h 10m 38s` and the shell
       *    below it reports `took 1h11m10s` — the same process, departed. the
       *    split that followed is the parity invariant, inverted:
       *      crew.poll → `🧊 frozen` → --healable emitted `--what wedge`
       *      crew.heal → `💀 … no live claude box — a husk or plain shell`
       *    and `wedge` is OPT-IN, so the emitted line refused every tick it ran
       *    (rule.forbid.remedies-that-mimic-the-defect).
       *
       *  ⚠️ .this widens no class — it RESTORES the invariant's own test. a
       *    mechanic at a bare shell IS a husk, by role + box, never by banner
       *    (define.invariant.crew.husk.discriminator-parity).
       */
      const asset = (slug: string): string =>
        join(__dirname, `.test/.assets/${slug}`);
      const SLUG = 'pane.husk.stale-caret-above-a-live-shell.log';

      const flat = (): string =>
        readFileSync(asset(SLUG), 'utf8')
          // ANSI strip — see the biome-ignore-all at the head of this file
          .replace(/\u001b\[[0-9;]*m/g, '')
          .replace(/\u00a0/g, ' ');

      when('[t0] the fixture is read', () => {
        then('🔴 it carries NOT ONE anchor the four extant arms key on', () => {
          // the precondition IS the case. with any one of these present the
          // fixture would pass on an older arm's merits and clamp naught.
          expect(flat()).not.toContain('Resume this session with:');
          expect(flat()).not.toContain('Resume Session');
          expect(flat()).not.toMatch(/💥[0-9]+/);
          expect(flat()).not.toContain('----- Native stack trace -----');
        });

        then('and it holds the STALE caret that fooled the poll', () => {
          expect(flat()).toContain('❯');
        });

        then(
          'with a RETURNED shell prompt BELOW it — the order is the proof',
          () => {
            const lines = flat().split('\n');
            const caret = lines
              .map((l, i) => (l.includes('❯') ? i : -1))
              .filter((i) => i >= 0)
              .pop();
            const prompt = lines
              .map((l, i) => (l.includes('➜') || l.includes('❮') ? i : -1))
              .filter((i) => i >= 0)
              .pop();
            expect(caret).toBeGreaterThan(-1);
            expect(prompt).toBeGreaterThan(caret as number);
          },
        );
      });

      when('[t1] the HUSK arm reads it', () => {
        const scene = useBeforeAll(async () =>
          runClassifier({ fn: '__duct_pane_is_husk', fixture: flat() }),
        );

        then(
          '🔴 it classifies HUSK — so --healable names it and revive is reached',
          () => {
            expect(scene.stdout).toContain('VERDICT=yes');
          },
        );
      });
    },
  );

  given(
    '[case-crash-husk] a CRASHED clone under stale chrome is a husk',
    () => {
      const asset = (slug: string): string =>
        join(__dirname, `.test/.assets/${slug}`);
      const SLUG = 'pane.husk.crashed-under-stale-ui.log';

      const flat = (): string =>
        readFileSync(asset(SLUG), 'utf8')
          // ANSI strip — see the biome-ignore-all at the head of this file
          .replace(/\u001b\[[0-9;]*m/g, '')
          .replace(/\u00a0/g, ' ');

      when('[t0] the fixture is read', () => {
        then(
          'it holds the shell EXIT BADGE — the anchor this arm keys on',
          () => {
            expect(flat()).toMatch(/💥[0-9]+ ➜/);
          },
        );

        then(
          'and the STALE chrome that fooled the poll — a caret and a statusline',
          () => {
            // this is WHY the seat read `at work`: every token of a live clone is
            // present, each one drawn before the process died
            expect(flat()).toContain('❯');
            expect(flat()).toContain('5.1.execution.from_vision');
          },
        );

        then(
          '🔴 and NEITHER extant anchor — so arms 1 and 2 provably cannot fire',
          () => {
            // the precondition IS the case. with a banner or a picker present, this
            // fixture would pass on an older arm's merits and clamp naught.
            expect(flat()).not.toContain('Resume this session with:');
            expect(flat()).not.toContain('Resume Session');
          },
        );
      });

      when('[t1] the HUSK arm reads it', () => {
        const scene = useBeforeAll(async () =>
          runClassifier({ fn: '__duct_pane_is_husk', fixture: flat() }),
        );

        then(
          '🔴 it classifies HUSK — so --healable names it and heal is reached',
          () => {
            expect(scene.stdout).toContain('VERDICT=yes');
          },
        );
      });

      // 🔴 THE TOOTH. a LIVE clone's scrollback can hold a crash badge — a suite
      //    that exited nonzero, a command the clone itself ran. the badge ALONE
      //    must never fire; what proves the program is GONE is that no ❯ sits
      //    below it. the same order test arm 1 has carried since it was written.
      when('[t2] a LIVE clone carries a crash badge in its SCROLLBACK', () => {
        const scene = useBeforeAll(async () =>
          runClassifier({
            fn: '__duct_pane_is_husk',
            fixture: [
              '● I ran the suite and it aborted:',
              '  💥134 ➜  npm test',
              '● so the heap cap is the cause. let me split the run.',
              '❯ ',
              '  ⏵⏵ accept edits on (shift+tab to cycle)',
            ].join('\n'),
          }),
        );

        then(
          '🔴 it is NOT a husk — a caret BELOW the badge means claude is live',
          () => {
            expect(scene.stdout).toContain('VERDICT=no');
          },
        );
      });

      // the second tooth: a CLEAN return prints no badge, and a clean exit is
      // arm 1's business — claude writes its resume banner on the way out. this
      // arm must claim no pane it holds no evidence about.
      when('[t3] a bare shell prompt carries NO exit badge', () => {
        const scene = useBeforeAll(async () =>
          runClassifier({
            fn: '__duct_pane_is_husk',
            fixture: [
              'some-tree on beav/some-branch took 2s at 09:01:02',
              '➜  ',
            ].join('\n'),
          }),
        );

        then(
          '🔴 it is NOT this arm\u2019s verdict — no badge, no claim',
          () => {
            expect(scene.stdout).toContain('VERDICT=no');
          },
        );
      });

      // 🔴 .PARITY — added 2026-09-18, one tick after the arm above landed.
      //    the arm taught the POLL this shape and left HEAL with its private
      //    chain, so the two split on one pane in one breath:
      //      poll → `mechanic:husk`, and a cure line for it
      //      heal → `😶 a live claude box is up — not a husk`
      //    the emitted cure was inert, which makes the `--healable` row a
      //    term=false-report (define.invariant.crew.husk.discriminator-parity).
      //
      //    ⇒ the repair is one shared discriminator, so a future arm cannot
      //      reach one caller and miss the other. these clamp the share
      //      itself, never merely its result.
      when('[t4] the arm and HEAL read the same pane', () => {
        then(
          '🔴 the arm DELEGATES — it holds no private badge test of its own',
          () => {
            const body = readDuctwork();
            const at = body.indexOf('__duct_pane_is_husk() {');
            const end = body.indexOf('\n__duct_pane_has_claude_chrome', at);
            expect(at).toBeGreaterThan(-1);
            expect(end).toBeGreaterThan(at);
            expect(body.slice(at, end)).toContain(
              '__duct_pane_crash_badge "$flat"',
            );
          },
        );

        then('🔴 and HEAL reaches the SAME shared discriminator', () => {
          expect(readCrewwork()).toContain('__duct_pane_crash_badge "$plain"');
        });

        // 🔴 the arm's PLACE is two constraints, not one, and they pull opposite
        //    ways. it must sit ABOVE the ❯ test (that caret is stale chrome the
        //    dead process drew) and BELOW the banner test (a pane with a banner
        //    is arm 1's, whose render names a 143 as this fleet's own earlyoom
        //    kill). the first draft honored only the first, and [case45] went
        //    red on all three of arm 1's provision assertions.
        then(
          'heal runs it BEFORE its ❯ test — that caret is the stale one',
          () => {
            const body = readCrewwork();
            const crashAt = body.indexOf('__duct_pane_crash_badge "$plain"');
            const caretAt = body.indexOf(`grep -q '\u276f'`);
            expect(crashAt).toBeGreaterThan(-1);
            expect(caretAt).toBeGreaterThan(-1);
            expect(crashAt).toBeLessThan(caretAt);
          },
        );

        then(
          '🔴 and AFTER the banner test — a banner pane is arm 1\u2019s, not this one',
          () => {
            const body = readCrewwork();
            const crashAt = body.indexOf('__duct_pane_crash_badge "$plain"');
            const bannerAt = body.indexOf(
              "grep -q 'Resume this session with:'",
            );
            expect(bannerAt).toBeGreaterThan(-1);
            expect(bannerAt).toBeLessThan(crashAt);
          },
        );

        then(
          'heal routes the crash to a REVIVE, never to a bare surface',
          () => {
            // rule.require.a-cure-path-for-every-named-husk-shape: to detect a
            // shape and stop is the same false report, one step later
            const body = readCrewwork();
            const at = body.indexOf('crashed under its own stale UI');
            expect(at).toBeGreaterThan(-1);
            expect(body.slice(at, at + 400)).toContain('__crew_heal_revive');
          },
        );

        then('and it carves out ^C — 130 is a HUMAN, never a crash', () => {
          const body = readCrewwork();
          const at = body.indexOf('__duct_pane_crash_badge "$plain"');
          expect(body.slice(at, at + 600)).toContain('"130"');
        });
      });

      // 🔴 .the arm's own glyph enumeration, met 2026-09-20 while arm 4 was cured.
      //    `__duct_pane_crash_badge` hardcoded `➜` in BOTH its grep and its order
      //    awk. that glyph is a prompt-theme property, and this fleet runs two
      //    themes — `➜` on the grove, `❮` on local. so every crash class that
      //    leaves NO DUMP was invisible on the local box:
      //      kernel SIGKILL -> no dump, `💥137 ❮`   (arm 4 cannot see it either)
      //      SIGTERM        -> no dump, `💥143 ❮`
      //    ⇒ and the exposure is measured, never hypothetical: `git.grove
      //      .saturation local` reports 7 kernel OOM kills in 17.4d, guard: none
      //      — all SIGKILL, all exit 137 — on a box that runs crews.
      //
      // ✅ .the repair removes an enumeration rather than widen one. a second
      //    `[➜❮]` class here would be the SAME glyph set written twice, and the
      //    two would drift — which is the failure this file has named twice
      //    already. the order test is delegated to
      //    `__duct_pane_has_returned_shell`, which already reads both glyphs AND
      //    the dump (one detector, one home).
      when('[t5] a SIGKILL husk on a box whose prompt is NOT ➜', () => {
        const scene = useBeforeAll(async () =>
          runClassifier({
            fn: '__duct_pane_is_husk',
            fixture: [
              '● let me run the suite.',
              '❯ ',
              '  ⏵⏵ accept edits on (shift+tab to cycle)',
              'some-tree on beav/some-branch took 4h at 09:01:02',
              '💥137 ❮ ',
            ].join('\n'),
          }),
        );

        then(
          '🔴 it classifies HUSK — the badge is real, the glyph is a theme',
          () => {
            expect(scene.stdout).toContain('VERDICT=yes');
          },
        );
      });

      // ⚠️ THE TOOTH, and it is the same one [t2] holds for `➜`: a LIVE clone can
      //    quote a badge of either glyph. ORDER against the last caret decides.
      when('[t6] a LIVE clone quotes a NON-➜ badge in its scrollback', () => {
        const scene = useBeforeAll(async () =>
          runClassifier({
            fn: '__duct_pane_is_husk',
            fixture: [
              '● the suite aborted:',
              '  💥137 ❮  npm test',
              '● so the kernel reaped it. let me cap the heap.',
              '❯ ',
              '  ⏵⏵ accept edits on (shift+tab to cycle)',
            ].join('\n'),
          }),
        );

        then(
          '🔴 it is NOT a husk — a caret BELOW the badge means claude is live',
          () => {
            expect(scene.stdout).toContain('VERDICT=no');
          },
        );
      });

      when('[t7] the badge arm is read as source', () => {
        then(
          '🔴 it holds NO private glyph enumeration — it delegates the order test',
          () => {
            const body = readDuctwork();
            const at = body.indexOf('__duct_pane_crash_badge() {');
            const end = body.indexOf('\n######', at);
            expect(at).toBeGreaterThan(-1);
            expect(end).toBeGreaterThan(at);
            // ⚠️ COMMENTS ARE STRIPPED. the tooth grades what RUNS — and the .why
            //    inside this function names both glyphs on purpose, since the
            //    record of which themes this fleet draws is the whole argument for
            //    the delegation. a tooth that forbade the prose would forbid its
            //    own reason (rule.require.timeless-lessons: the concept stays).
            const fn = body
              .slice(at, end)
              .split('\n')
              .filter((line) => !/^\s*#/.test(line))
              .join('\n');
            expect(fn).toContain('__duct_pane_has_returned_shell');
            // 🔴 the anti-drift tooth: a second copy of the glyph set is exactly
            //    the defect this repair removes, so the CODE may hold neither
            expect(fn).not.toContain('➜');
            expect(fn).not.toContain('❮');
          },
        );
      });
    },
  );

  // .what = a crashed clone whose shell came back with NO EXIT BADGE is still
  //         a husk — the NODE DUMP is the evidence, never the badge
  //
  // 🔴 .measured 2026-09-20 — infrastructure.beav.feat-camp-git-backup-bucket,
  //    a LOCAL duct, and the two instruments split on it for the THIRD tick in
  //    a row (define.invariant.crew.husk.discriminator-parity):
  //      crew.poll  → `mechanic:empty` → `🧊 SUSPECTED WEDGE` → `--what wedge`
  //      crew.heal  → `💀 … no live claude box — a husk or plain shell`
  //    heal was right. the pane holds a V8 heap OOM dump above a returned
  //    shell prompt, and the poll's stale pre-crash `❯` claimed the box.
  //
  // 🔴 .the gap, precisely. `__duct_pane_is_husk` had three arms and this pane
  //    answers NONE of them:
  //      arm 1 (banner)  — an ABORT never reaches the resume banner
  //      arm 3 (badge)   — starship draws `💥N` only on a nonzero `$?`, and the
  //                        shell that re-drew this prompt returned 0
  //      arm 2 (picker)  — no picker
  //    ⇒ so it fell past the ladder into the chrome arm, where the stale caret
  //      reads as a live box. HEAL already had the dump arm (crewwork.sh:
  //      `husk (crashed — a node fatal dump, and the shell came back with NO
  //      exit badge)`); the poll never learned it.
  //
  // 🔴 .the harm is not one missed row. `empty` drove `__crew_heal_axis` to
  //    `wedge`, so `--healable` emitted `--what wedge` — and wedge is opt-in,
  //    NOT part of heal's default `all`, so the emitted line refused every
  //    tick. detect → cure → identical state → detect
  //    (rule.forbid.remedies-that-mimic-the-defect).
  //
  // ✅ .the anchor is the DUMP, never a prompt glyph. a glyph is a theme
  //    property — `➜` on the grove, `❮` on this box — so an enumeration of
  //    them is a term=partial-audit by construction. `----- Native stack trace
  //    -----` is printed by NODE on its way out, so it cannot vary by host.
  given(
    '[case-crash-nobadge] a crash whose shell returned CLEAN is still a husk',
    () => {
      const asset = (slug: string): string =>
        join(__dirname, `.test/.assets/${slug}`);
      const SLUG = 'pane.husk.v8-oom-returned-shell-alt-caret.log';

      const flat = (): string =>
        readFileSync(asset(SLUG), 'utf8')
          // ANSI strip — see the biome-ignore-all at the head of this file
          .replace(/\u001b\[[0-9;]*m/g, '')
          .replace(/\u00a0/g, ' ');

      when('[t0] the fixture is read', () => {
        then('it holds the NODE DUMP — the anchor this arm keys on', () => {
          expect(flat()).toContain('----- Native stack trace -----');
          expect(flat()).toContain('FATAL ERROR: Reached heap limit');
        });

        then('🔴 and NO exit badge — so arm 3 provably cannot fire', () => {
          // the precondition IS the case. with a badge present this fixture
          // would pass on arm 3's merits and clamp naught.
          expect(flat()).not.toMatch(/💥[0-9]+/);
        });

        then(
          '🔴 nor a banner, nor a picker — so arms 1 and 2 cannot fire either',
          () => {
            expect(flat()).not.toContain('Resume this session with:');
            expect(flat()).not.toContain('Resume Session');
          },
        );

        then('and the STALE caret that claimed the box, ABOVE the dump', () => {
          // this is WHY the seat read `empty`: claude drew this caret before it
          // died, and every arm below the husk ladder reads it as a live box
          const lines = flat().split('\n');
          const caret = lines.findIndex((l) => l.includes('❯'));
          const dump = lines.findIndex((l) =>
            l.includes('----- Native stack trace -----'),
          );
          expect(caret).toBeGreaterThan(-1);
          expect(dump).toBeGreaterThan(caret);
        });
      });

      when('[t1] the HUSK ladder reads it', () => {
        const scene = useBeforeAll(async () =>
          runClassifier({ fn: '__duct_pane_is_husk', fixture: flat() }),
        );

        then(
          '🔴 it classifies HUSK — so the poll agrees with heal at last',
          () => {
            expect(scene.stdout).toContain('VERDICT=yes');
          },
        );
      });

      // 🔴 THE TOOTH, and it is sharper here than for any peer arm: this very
      //    test file holds `----- Native stack trace -----` in plain text, so a
      //    LIVE clone that reads it carries the dump in its own scrollback. to
      //    fire on presence would reboot a healthy clone mid-read
      //    (rule.forbid.byhand-fix-that-burns-the-live-proof). ORDER against the
      //    last caret is the whole discriminator.
      when('[t2] a LIVE clone carries a dump in its SCROLLBACK', () => {
        const scene = useBeforeAll(async () =>
          runClassifier({
            fn: '__duct_pane_is_husk',
            fixture: [
              '● the pane held a node dump:',
              '  FATAL ERROR: Reached heap limit Allocation failed',
              '  ----- Native stack trace -----',
              '● so the heap cap is the cause. let me clamp it.',
              '❯ ',
              '  ⏵⏵ accept edits on (shift+tab to cycle)',
            ].join('\n'),
          }),
        );

        then(
          '🔴 it is NOT a husk — the caret sits BELOW the quoted dump',
          () => {
            expect(scene.stdout).toContain('VERDICT=no');
          },
        );
      });

      // ⚠️ the second tooth: the arm must claim no pane it holds no evidence
      //    about. a plain shell with no dump is arm 3's business (a badge) or
      //    nobody's — never this one's.
      when('[t3] a bare shell prompt carries NO dump', () => {
        const scene = useBeforeAll(async () =>
          runClassifier({
            fn: '__duct_pane_is_husk',
            fixture: [
              'some-tree on beav/some-branch took 2s at 09:01:02',
              '❮  ',
            ].join('\n'),
          }),
        );

        then('🔴 it is NOT this arm\u2019s verdict — no dump, no claim', () => {
          expect(scene.stdout).toContain('VERDICT=no');
        });
      });

      // 🔴 .PARITY — the arm must DELEGATE to the shared order test, never hold a
      //    private caret chain. a private copy is precisely how arm 1 and the
      //    picker arm fell out of step before
      //    (rule.always.entool-the-skills-you-touch: one detector, one home).
      when('[t4] the arm and HEAL read the same evidence', () => {
        then('🔴 the arm delegates to the shared returned-shell test', () => {
          const body = readDuctwork();
          const at = body.indexOf('__duct_pane_is_husk() {');
          const end = body.indexOf('\n__duct_pane_has_claude_chrome', at);
          expect(at).toBeGreaterThan(-1);
          expect(end).toBeGreaterThan(at);
          expect(body.slice(at, end)).toContain(
            '__duct_pane_has_returned_shell "$flat"',
          );
        });

        then(
          '🔴 and it does NOT short-circuit the picker arm on a negative',
          () => {
            // a live clone that quotes a dump AND sits parked at the picker is
            // still parked. an unconditional `return` here would hide arm 2.
            const body = readDuctwork();
            const at = body.indexOf('__duct_pane_is_husk() {');
            const end = body.indexOf('\n__duct_pane_has_claude_chrome', at);
            const arm = body.slice(at, end);
            const dumpAt = arm.indexOf(
              '__duct_pane_has_returned_shell "$flat"',
            );
            const pickerAt = arm.indexOf(
              '__duct_pane_is_picker_parked "$flat"',
            );
            expect(dumpAt).toBeGreaterThan(-1);
            expect(pickerAt).toBeGreaterThan(dumpAt);
          },
        );

        then('🔴 and HEAL names the same shape, so neither drifts', () => {
          expect(readCrewwork()).toContain('----- Native stack trace -----');
        });
      });
    },
  );

  // .what = a picker that drew with ZERO rows is a FLAP, not a stuck picker —
  //         the named conversation is GONE, so a resume can never cure it
  //
  // 🔴 .measured 2026-09-18 over three consecutive ticks, one seat —
  //    infrastructure.beav.feat-camp-git-backup-bucket. `--healable` emitted
  //    its heal line each tick, the line ran verbatim, and the state came back
  //    byte-identical: detect → heal → same state → detect. a FLAP, and a
  //    contract that mandates "run each emitted heal line verbatim" walks it
  //    every tick, without bound.
  //
  // 🔴 .the gap, precisely. heal ALREADY holds a flap arm and a flap cure
  //    (crewwork.sh `__crew_heal_hatch`), and the arm keys on claude's verbatim
  //    `No conversations found to resume`. claude prints that sentence only
  //    where it resumes NON-interactively. where a session NAME is given and
  //    does not match, claude reports the same fact by a DIFFERENT surface: it
  //    opens the picker with the name pre-filled as a search, and draws ZERO rows.
  //
  //    ⇒ so the flap wore a PICKER's face, fell through to the
  //      picker-did-not-clear guard, and returned "verify manually" — a
  //      term=volunteered-diagnosis, which reports the state UNKNOWN while the
  //      pane states the cause outright.
  //
  // ⚠️ the discriminator is the first NON-BLANK line after `current worktree`:
  //    with rows, it is a session row; with none, it is the footer keybind line.
  given(
    '[case-flap-picker] a picker with NO rows names a flap, not a stuck picker',
    () => {
      const asset = (slug: string): string =>
        join(__dirname, `.test/.assets/${slug}`);
      const SLUG = 'pane.flap.picker-with-zero-rows.log';

      const flat = (): string =>
        readFileSync(asset(SLUG), 'utf8')
          // ANSI strip — see the biome-ignore-all at the head of this file
          .replace(/\u001b\[[0-9;]*m/g, '')
          .replace(/\u00a0/g, ' ');

      when('[t0] the fixture is read', () => {
        then('it drew the picker at all — else it clamps another pane', () => {
          expect(flat()).toContain('Resume Session');
        });

        then(
          '🔴 and claude NEVER printed its non-interactive flap sentence',
          () => {
            // the precondition IS the case: the extant flap arm greps for this
            // literal, so its absence proves that arm provably cannot fire here.
            expect(flat()).not.toContain('No conversations found to resume');
          },
        );
      });

      when('[t1] the row classifier reads it', () => {
        const scene = useBeforeAll(async () =>
          runClassifier({ fn: '__duct_picker_has_no_rows', fixture: flat() }),
        );

        then('🔴 it names ZERO rows — so heal can route to the hatch', () => {
          expect(scene.stdout).toContain('VERDICT=yes');
        });
      });

      // 🔴 THE TOOTH. a picker WITH a session to pick is a live clone one keystroke
      //    from cured. to call that a flap would HATCH it — a fresh boot that
      //    throws away the very transcript the row proves is still there.
      when('[t2] the picker drew a real session row', () => {
        const scene = useBeforeAll(async () =>
          runClassifier({
            fn: '__duct_picker_has_no_rows',
            fixture: [
              'Resume Session',
              '│ ⌕ mechanic                    │',
              '  current worktree',
              '',
              '❯ mechanic   2h ago   142 messages',
              '',
              '  Ctrl+A to show all projects · Ctrl+B to toggle branch · ',
              '  Ctrl+V to preview · Type to search · Esc to cancel · ',
            ].join('\n'),
          }),
        );

        then(
          '🔴 it is NOT a flap — a row exists, so the transcript is there',
          () => {
            expect(scene.stdout).toContain('VERDICT=no');
          },
        );
      });

      // the second tooth: a pane with no `current worktree` header at all is a
      // picker shape this classifier cannot read. it must answer NO rather than
      // guess — an unreadable pane routed to the hatch would abandon a live
      // transcript on a read that never happened (rule.forbid.failhide).
      when(
        '[t3] the header is absent — the classifier cannot see the list',
        () => {
          const scene = useBeforeAll(async () =>
            runClassifier({
              fn: '__duct_picker_has_no_rows',
              fixture: [
                'Resume Session',
                '  Type to search · Esc to cancel · ',
              ].join('\n'),
            }),
          );

          then(
            '🔴 it declines to claim a flap — unreadable is never a verdict',
            () => {
              expect(scene.stdout).toContain('VERDICT=no');
            },
          );
        },
      );
    },
  );
});
