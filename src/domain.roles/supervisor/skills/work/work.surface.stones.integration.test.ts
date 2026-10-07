/**
 * .what = clamps on the STONE tally — malfunctions, verdict buckets, glyphs, unparsed seats, mutes
 *
 * .note = a PART of the `work.surface` suite, cut so one reviewer can hold
 *         it whole. the suite's shared fixtures, and its account of what it
 *         runs against and why, live in work.surface.harness.ts.
 */
import { join } from 'path';
import { given, then, when } from 'test-fns';

import {
  asCode,
  DIR_SKILLS,
  DIR_WORK,
  read,
  readCode,
  readPollWhole,
} from './work.surface.harness';

describe('work.surface', () => {
  /**
   * [case37] — the stuck-stone family has THREE members, and the status ladder
   *            screened two
   *
   * 🔴 .the shape = ONE instrument graded one fact two ways. the `🗿 stones`
   *    tally already counts all three as one set:
   *
   *      *blocked*|*exhausted*|*malfunction*)  (( STONE_STUCK++ ))
   *
   *    while the `crew_status` ladder named `exhausted` and `blocked ✋` and
   *    stopped there, so a malfunctioned crew fell through to `frozen` —
   *    whose declared sense is "still, and nobody waits on it."
   *
   *    measured 2026-09-16 on `rhachet-roles-bhuild.beav.feat-behavior-route-upgrades`:
   *      🧊 frozen · still 388m
   *      🗿 mechanic: 1.vision, review.peer, l1@i023, malfunction 💥
   *
   *    ⇒ and `frozen` is a HEALABLE state, so the row drew a wedge probe every
   *      tick that correctly answered "not wedged" — a null call, forever.
   *
   * ⚠️ .the family = this is the THIRD instance of one shape in one session. a
   *    screen written by NAMING members covers exactly the members it names,
   *    and every peer with the identical property sails through
   *    (rule.require.enumerate-before-you-name). the peers:
   *      - `__crew_is_crew_tree` — header enumerated 3 call sites, 5 existed
   *      - `__crew_is_healable` $5 — named `duct_down`, missed `phantom`
   *
   * .teeth = drop the malfunction arm and [t0] goes red; move it above the
   *    turn-ended arm and [t2] goes red.
   */
  given(
    '[case37] a malfunctioned stone is a DEFECT the driver owns, never `frozen`',
    () => {
      const readPoll = (): string => asCode(readPollWhole());

      when('[t0] the status ladder is read', () => {
        then('malfunction is screened, beside its two declared peers', () => {
          const src = readPoll();
          expect(
            /\$__stones_s" == \*"malfunction"\* \]\];\s*then crew_status="blocked:on-defect"/.test(
              src,
            ),
          ).toEqual(true);
        });

        then('and it is on-DEFECT, never on-human', () => {
          // a malfunctioned reviewer is the driver's to diagnose
          // (rule.always.diagnose-reviewer-malfunctions). it reaches a human only
          // after that diagnosis names a human-owned lever, and to file it
          // `on-human` up front spends the scarcest party in the loop on a step
          // the driver has not taken yet.
          const src = readPoll();
          const i = src.indexOf('*"malfunction"*');
          expect(i).toBeGreaterThan(0);
          expect(src.slice(i, i + 120).includes('blocked:on-human')).toEqual(
            false,
          );
        });
      });

      when(
        '[t1] the three members are held against the tally that already names them',
        () => {
          then(
            'every member of the tally set is also screened by the ladder',
            () => {
              // 🔴 the invariant, stated as a property rather than a list: the ladder
              //    and the tally must agree on WHO is stuck. a fourth member added to
              //    the tally with no ladder arm re-opens this exact defect, and this
              //    assertion is what goes red when it does.
              const src = readPoll();
              const tally = src.match(
                /\*blocked\*\|([^)]*)\)\s*\(\( STONE_STUCK\+\+ \)\)/,
              );
              expect(tally).not.toEqual(null);
              const members = [
                'blocked ✋',
                ...(tally?.[1] ?? '')
                  .split('|')
                  .map((m) => m.replace(/\*/g, '')),
              ];
              for (const member of members) {
                expect(src.includes(`*"${member}"*`)).toEqual(true);
              }
            },
          );

          // 🔴 .the same defect, one bucket over — measured 2026-09-16
          //
          //    the tally's catch-all is `*)  (( STONE_INWORK++ ))`, and this file's
          //    own comment already named the hazard in 2026-09-03 prose: *"`*)`
          //    means 'no halt word matched', which is TRUE of a healthy in-review
          //    stone and equally true of a stone whose halt word was cut off …
          //    counted as `🔍 in review` — the benign bucket — and the tally read
          //    as though the fleet were healthier than it was."*
          //
          //    that round cured ONE member of the set (`*'…'`, the clipped stone)
          //    and left its peers in the catch-all. `rule.require.enumerate-before
          //    -you-name` again, third instance in three ticks.
          //
          //    star scope, 5 crews, the render showed exactly ONE stone in review.
          //    the tally read `🔍 23 in review`:
          //      20 × `relic — no live clone in this pane …`  (a seat with no clone)
          //       2 × `route complete 🌴🤙`                    (DONE, not in review)
          //       1 × `…, review.peer, l3@i013 🔍`             (the only true one)
          //    on `--all` the same row read `🔍 124 in review` — the single
          //    most-read number in the sweep, inflated ~10x, always toward BENIGN.
          //
          // ⚠️ .the catch-all named above is NO LONGER the in-review arm — 2026-09-17
          //    this round cured two more members and then ran the enumeration to its
          //    end: `🔍 in review` now keys on its own glyph, and the DEFAULT counts
          //    `clipped`, which by construction is what a stone that reached no
          //    verdict arm actually is. ⇒ [case44] owns that ladder's verdicts; this
          //    case still owns its ORDER, and the two cannot disagree
          //    (rule.require.a-cue-is-not-a-claim — two nets over one defect).
          when(
            '[t3] the ladder default is held against the shapes that are NOT in review',
            () => {
              then(
                'a relic is parted out — a seat with no clone holds no stone at all',
                () => {
                  const src = readPoll();
                  // the arm exists, and it keys on the prefix duct.poll actually emits
                  expect(
                    /relic\*\)\s*\(\( STONE_RELIC\+\+ \)\)/.test(src),
                  ).toEqual(true);
                  expect(
                    readCode(join(DIR_SKILLS, 'duct.poll.sh')).includes(
                      'stone="relic — ',
                    ),
                  ).toEqual(true);
                },
              );

              then(
                'a completed route is parted out — done is the OPPOSITE of in review',
                () => {
                  expect(
                    /\*'route complete'\*\)\s*\(\( STONE_DONE\+\+ \)\)/.test(
                      readPoll(),
                    ),
                  ).toEqual(true);
                },
              );

              then(
                'both arms sit ABOVE the ladder default, or they never fire',
                () => {
                  // 🔴 .this probe keys on the default's POSITION, never on the verdict
                  //    it happens to carry — and that distinction was bought, not guessed
                  //
                  //    it once read the literal
                  //      `*)                                    (( STONE_INWORK++ ))`
                  //    which fused two separate claims into one string: *where* the
                  //    default sits, and *what* it counts. [case44] moved the verdict off
                  //    the default (in review now keys on its own 🔍; the default became
                  //    `clipped`), and this clamp went red — while the order it was
                  //    written to guard had not moved a line.
                  //
                  //    ⇒ an ORDER clamp that encodes a VERDICT fires on changes it was
                  //      never written to catch, and a red clamp that names no real
                  //      defect trains its reader to edit the clamp rather than read it.
                  //      so the fix is to probe the property the clamp actually claims.
                  const src = readPoll();

                  // the ladder is bounded by a line unique to it, and by its own `esac`
                  const ladder = src.indexOf(
                    '*blocked*|*exhausted*|*malfunction*)  (( STONE_STUCK++ ))',
                  );
                  expect(ladder).toBeGreaterThan(0);
                  const esac = src.indexOf('\n      esac', ladder);
                  expect(esac).toBeGreaterThan(ladder);

                  // the default is the LAST arm-opener before the ladder closes. a bare
                  // `*)` on its own line appears twice in this file, so the search is
                  // bounded to the region between this ladder and its `esac`.
                  const fallthrough = src.lastIndexOf('\n        *)\n', esac);
                  expect(fallthrough).toBeGreaterThan(ladder);

                  // ⚠️ the lower bounds are not decoration — `indexOf` returns -1 for an
                  //    ABSENT arm, and -1 satisfies `toBeLessThan(fallthrough)`. so a rank
                  //    clamp with no lower bound passes loudest exactly when the arm it
                  //    ranks has been deleted. caught on this clamp's own teeth run
                  //    (rule.require.clamp-edge-cases: a clamp that passes under the
                  //    un-fixed defect is a blocker).
                  for (const arm of ['relic*)', "*'route complete'*)"]) {
                    expect(src.indexOf(arm)).toBeGreaterThan(0);
                    expect(src.indexOf(arm)).toBeLessThan(fallthrough);
                  }
                },
              );

              then(
                'the relic exclusion is STATED on the row, never silent',
                () => {
                  // an omission a reader cannot see is a partial audit with a complete
                  // face — the row would not reconcile against the render above it
                  expect(readPoll().includes('seat(s) hold no clone')).toEqual(
                    true,
                  );
                },
              );

              then(
                '`route complete` reuses the extant 🌴, and coins no second glyph',
                () => {
                  // one concept, one symbol: duct.poll already renders `route complete
                  // 🌴🤙`, so the tally adopts that mark rather than mint a peer
                  const src = readPoll();
                  expect(
                    src.includes('\ud83c\udf34 $STONE_DONE complete'),
                  ).toEqual(true);
                  expect(src.includes("*'route complete'*)")).toEqual(true);
                },
              );

              then(
                'the gate that prints the row counts the new bucket too',
                () => {
                  // `route complete` alone must not render an empty row — a fleet whose
                  // every crew finished would print naught under the old sum
                  // 🔴 keyed on the CLAIM (`STONE_DONE` is a term of the guard sum),
                  //    never on the literal tail `…CLIPPED + DONE > 0`. that tail is
                  //    stable only while DONE is the LAST term, so any correct later
                  //    extension of the guard turns this red for no defect — measured
                  //    twice now, 2026-09-17 and 2026-09-18, both times by a cure that
                  //    added a bucket. an order-clamp must key on POSITION or on
                  //    MEMBERSHIP, never on a neighbour that is free to move.
                  const guard =
                    readPoll().match(
                      /if \(\( STONE_HUMAN \+[^)]*> 0 \)\); then/,
                    )?.[0] ?? '';
                  expect(guard).not.toEqual('');
                  expect(guard.includes('STONE_DONE')).toEqual(true);
                  expect(guard.includes('STONE_CLIPPED')).toEqual(true);
                },
              );
            },
          );
        },
      );

      // 🔴 .the UPSTREAM half of the same defect — measured 2026-09-16, in prod
      //
      //    the `relic*)` arm above landed and did not fire. the row still read
      //    `🔍 21 in review · (+0 seat(s) hold no clone)` over a scope whose
      //    render showed 20 relic rows.
      //
      //    the arm was correct. the VALUE it matched against was not:
      //    `__crew_record_stone` parsed `stone="${line#*🗿 }"` — a strip that
      //    NAMES ONE 🗿 in a line that can hold TWO. duct.poll's relic message
      //    carries its own marker inside it (`… a stale 🗿 line sits in
      //    scrollback …`), so the shortest match ate past it and stored the
      //    fragment `line sits in scrollback, not current route state`, whose
      //    first word is neither `relic` nor a stone name.
      //
      //    `rule.require.enumerate-before-you-name`, the EIGHTH instance on
      //    record — and the sharpest, because the cure for instance seven was
      //    itself disarmed by it.
      when('[t4] the recorder that produces the tally value is read', () => {
        then(
          'it strips by the TREE GLYPH, which every consumed line holds once',
          () => {
            // the call site matches `'   ├─ '*|'   └─ '*`, so `─ ` (U+2500) is
            // present exactly once and always at the prefix. the relic message's
            // `—` is U+2014, so a shortest match cannot reach past it.
            expect(
              asCode(readPollWhole()).includes('stone="${line#*\u2500 }"'),
            ).toEqual(true);
          },
        );

        then(
          'it no longer strips by the 🗿 marker, which a message may embed',
          () => {
            // the whole defect, in one expression. this goes red the moment the
            // greedy-past-the-marker form returns.
            expect(
              /\$\{line#\*\ud83d\uddff \}/.test(asCode(readPollWhole())),
            ).toEqual(false);
          },
        );

        then(
          'the marker strip that remains is ANCHORED, so it can only drop one at the HEAD',
          () => {
            // `#🗿 ` and not `#*🗿 ` — an unanchored second strip would reopen the
            // same hole one line lower down.
            const code = asCode(readPollWhole());
            expect(code.includes('stone="${stone#\ud83d\uddff }"')).toEqual(
              true,
            );
            expect(code.includes('stone="${stone#*\ud83d\uddff }"')).toEqual(
              false,
            );
          },
        );

        then('the two strips are ORDERED — glyph first, then marker', () => {
          // reversed, the anchored marker strip finds no marker at the head (the
          // tree prefix is still on) and the glyph strip then eats it anyway.
          const code = asCode(readPollWhole());
          const glyph = code.indexOf('stone="${line#*\u2500 }"');
          const marker = code.indexOf('stone="${stone#\ud83d\uddff }"');
          expect(glyph).toBeGreaterThan(0);
          expect(marker).toBeGreaterThan(0);
          expect(glyph).toBeLessThan(marker);
        });

        then(
          'the value it stores round-trips into the arm the tally matches on',
          () => {
            // the two halves must AGREE: duct.poll emits a message whose first word
            // is `relic`, and the tally keys on `relic*)`. either half renamed
            // alone re-opens the miss with no other symptom.
            const emitted = readCode(join(DIR_SKILLS, 'duct.poll.sh'));
            expect(emitted.includes('stone="relic \u2014 ')).toEqual(true);
            expect(
              /relic\*\)\s*\(\( STONE_RELIC\+\+ \)\)/.test(readPoll()),
            ).toEqual(true);
          },
        );
      });

      when('[t2] its RANK is read', () => {
        const posOf = (needle: string): number => readPoll().indexOf(needle);

        then('it sits among the STONE arms, below every PANE arm', () => {
          // a malfunction is the ROUTE's record. a prompt, a husk, a cap, an
          // escalation are read off the pane and each names a sharper cure, so
          // none may be overturned by it (rule.forbid.overzealous-blockers).
          const at = posOf('*"malfunction"*');
          expect(at).toBeGreaterThan(0);
          expect(posOf('*"🚧prompt"*')).toBeLessThan(at);
          expect(posOf('*"mechanic:shell"*')).toBeLessThan(at);
          expect(posOf('-n "$__has_ratelimit"')).toBeLessThan(at);
          expect(posOf('-n "$__has_escalation"')).toBeLessThan(at);
          // and below the turn-ENDED join, which is a liveness fact, not a record
          expect(
            posOf('-n "$__has_turnended" && ( "$__boxes_s" == *"📬queued"*'),
          ).toBeLessThan(at);
        });

        then('and ABOVE the frozen fallthrough that swallowed it', () => {
          // the whole defect: `elif [[ "$crew_state" != "at work" ]] → frozen`
          // caught it, because no arm above claimed it first.
          const at = posOf('*"malfunction"*');
          expect(at).toBeLessThan(posOf('"$crew_state" != "at work" ]];'));
        });
      });
    },
  );

  given(
    '[case44] the stone tally keys every bucket on a VERDICT, and clips the residue',
    () => {
      const readPoll = (): string => asCode(readPollWhole());
      // .why a RAW reader beside the code one — `readCode` strips every `^\s*#` line,
      //      and the refuted cut-at-the-SGR-seam design is a DECISION carried only in
      //      a comment. a future editor who re-drafts that cut would pass every code
      //      assertion here, so the clause that must survive a silent re-attempt is
      //      read raw. it is the only one that is.
      const readPollRaw = (): string => readPollWhole();

      // a read rather than an existence check: an absent asset throws, which is its
      // own red, and it names the path in the failure
      const asset = (): string =>
        read(
          join(
            DIR_WORK,
            '.test/.assets/pane.stone.statusline-banner-overwrites-the-clip-marker.log',
          ),
        );

      // 🔴 anchored at a LINE START, on purpose: `*)` is a substring of `*'🔍'*)`,
      //    so an unanchored probe matches the very arm this cure ADDED and the
      //    clamp reports the defect it just fixed
      const DEFAULT_IS_INWORK = /^\s*\*\)\s+\(\(\s*STONE_INWORK\+\+/m;

      when('[t0] `🔍 in review` is read', () => {
        then('it keys on its own glyph, never on the ladder default', () => {
          const src = readPoll();
          expect(src.includes(`*'🔍'*)`)).toEqual(true);
          // .teeth = the defect was `*) STONE_INWORK++`, so the bucket meant
          //          "no other arm matched". that exact shape must be gone.
          expect(DEFAULT_IS_INWORK.test(src)).toEqual(false);
        });
      });

      when('[t1] the ladder default is read', () => {
        then('the residue is CLIPPED, and it names its subject', () => {
          const src = readPoll();
          const dflt = src.slice(src.indexOf(`*'🔍'*)`));
          const arm = dflt.slice(dflt.indexOf('*)'));
          expect(arm.includes('STONE_CLIPPED++')).toEqual(true);
          // the cure is per-tree, so a bare count is an instruction with no subject
          expect(arm.includes('STONE_CLIPPED_WHO+=')).toEqual(true);
        });

        then('the symptom-only arm it replaced is gone', () => {
          // `*'…')` keyed on an ellipsis at the end — the one byte a banner overwrites
          expect(readPoll().includes(`*'…')`)).toEqual(false);
        });
      });

      when('[t2] the arm ORDER is read', () => {
        then('every verdict arm runs above the clipped default', () => {
          const src = readPoll();
          const iClip = src.indexOf(`*'🔍'*)`);
          for (const verdict of [
            `*'judge, approved?'*)`,
            '*blocked*|*exhausted*|*malfunction*)',
            'relic*)',
            `*'route complete'*)`,
          ]) {
            const at = src.indexOf(verdict);
            expect(at).toBeGreaterThan(-1);
            // .why this is the whole basis of the cure: "reached no verdict" is only
            //      exact if every verdict was already offered a chance to match
            expect(at).toBeLessThan(iClip);
          }
        });
      });

      when('[t3] the captured production rows are read', () => {
        then('the asset holds both measured shapes, verbatim', () => {
          const log = asset();
          // row 1 — the banner DISPLACED the verdict and the `…` with it
          expect(log.includes('review.peer, l3')).toEqual(true);
          expect(log.includes("You've used 81% of")).toEqual(true);
          // row 2 — the verdict survived, the banner abuts it with no gap at all
          expect(log.includes('blocked')).toEqual(true);
          expect(log.includes('new task? ')).toEqual(true);
        });

        then(
          'row 1 ends in banner prose, which is why the ellipsis arm missed it',
          () => {
            const log = asset();
            const row = log
              .split('\n')
              .find(
                (l) =>
                  l.includes('5.1.execution.from_vision') &&
                  l.includes("You've used"),
              );
            expect(row).toBeDefined();
            // 🔴 the whole defect in one assertion: no `…` anywhere on the row
            expect(row!.includes('…')).toEqual(false);
          },
        );
      });

      when('[t4] the refuted design is read', () => {
        then(
          'the SGR-seam cut is recorded as refuted, with its counter-example',
          () => {
            const raw = readPollRaw();
            expect(
              raw.includes('.why the banner is not CUT at the source instead'),
            ).toEqual(true);
            // the measurement that killed it: one run, one colour, both sides of the seam
            expect(raw.includes('✋new task?')).toEqual(true);
          },
        );
      });

      when('[t5] the ladder as it SHIPPED is read', () => {
        then(
          'the clamp bites — the shipped ladder mis-sorts the measured row',
          () => {
            // .teeth = the two arms exactly as they shipped
            const shipped = [
              `        *'…')`,
              '          (( STONE_CLIPPED++ ))',
              '          ;;',
              '        *)                                    (( STONE_INWORK++ ))  ;;',
            ].join('\n');
            expect(shipped.includes(`*'🔍'*)`)).toEqual(false);
            expect(DEFAULT_IS_INWORK.test(shipped)).toEqual(true);

            // and the measured row really does fall past the ellipsis arm, so the
            // clamp bites on the mis-sort rather than on some unrelated edit
            const measured =
              "5.1.execution.from_vision, review.peer, l3You've used 81% of";
            expect(measured.endsWith('…')).toEqual(false);
            expect(measured.includes('🔍')).toEqual(false);
          },
        );
      });

      // 🔴 .the SECOND defect, and only the PROD VERIFY could surface it
      //
      //    [t0]–[t5] prove the DETECTOR. they say naught about the cure the row
      //    recommends, and the row recommended one that cannot work:
      //
      //      ✂️ a stone cut off before its verdict — the pane is too narrow.
      //         widen it, then re-poll
      //      └─ … — rhx git.crew.refresh --tree …
      //
      //    run verbatim against the tree the cure had just named, the refresh
      //    repainted at 93 cols and the row came back byte-identical:
      //      ESC[37m🗿 …, review.peer, l3ESC[93mYou've used 81% of ESC[39m
      //    two SGR runs on ONE unwrapped row — an OVERWRITE, never a wrap. a
      //    repaint reproduces an overwrite faithfully, so refresh is a null call.
      //
      // ⇒ the clip has two causes and the row named one
      //   (rule.require.poll-recommends-every-cure-heal-has). a supervisor who
      //   obeys it spends a tick on a move that cannot work, and next tick the
      //   row reads `✂️` again with no hint the cure was the wrong one.
      //
      // ⚠️ .this is the whole argument for step 3 of
      //    rule.always.capture-clamp-then-verify-in-prod: the suite was 8/8 and
      //    bite-proven, the detector was correct, and the tool still sent its
      //    reader somewhere useless. only the real verb against the real world
      //    said so.
      when('[t6] the cure the clipped row recommends is read', () => {
        then('both causes are named, never the wrap alone', () => {
          const src = readPoll();
          expect(src.includes('WRAPPED — the pane is too narrow')).toEqual(
            true,
          );
          expect(
            src.includes('OVERWRITTEN — a statusline banner drew over the row'),
          ).toEqual(true);
        });

        then(
          'the overwrite case says outright that a refresh cannot reach it',
          () => {
            // 🔴 a cure listed WITHOUT its bound is read as a cure for the class.
            //    the row must not merely mention the second cause — it must say
            //    the named command does not serve it, or the reader still runs it.
            expect(readPoll().includes('a refresh is a NULL CALL')).toEqual(
              true,
            );
          },
        );

        then(
          'the per-tree command is BOUNDED to the cause it actually cures',
          () => {
            // the emitted line is the one a supervisor copies, so the bound rides
            // ON it — a caveat two lines up is read once and the command is run
            const src = readPoll();
            expect(
              src.includes('if WRAPPED: rhx git.crew.refresh --tree'),
            ).toEqual(true);
            // and the unbounded form is gone, or the copy-paste teaches the wrong move
            expect(
              /└─ \$\{__cw%%\/\*\} \/ \$\{__cw##\*\/\} — rhx git\.crew\.refresh/.test(
                src,
              ),
            ).toEqual(false);
          },
        );

        then(
          'the discriminator is STATED, so the reader can sort their own case',
          () => {
            // a row that names two causes and no test between them has moved the
            // guess from the tool to the human rather than retired it
            expect(
              readPoll().includes('a second SGR run MID-ROW is an overwrite'),
            ).toEqual(true);
          },
        );
      });

      // 🔴 .the THIRD defect, and again only the PROD VERIFY could surface it
      //
      //    [t6] cures what the row ADVISES. it says naught about whether the row
      //    should have fired at all — and on 2026-09-18 it fired on a stone that
      //    was never clipped:
      //
      //      🗿 5.1.execution.from_vision, yield 🌾
      //
      //    measured on `rhachet-roles-bhrain.beav.feat-acceptance-under-5min`,
      //    two consecutive ticks. the row is COMPLETE — ONE SGR run, no second
      //    run mid-row — and `crew.refresh` repainted the pane at 189 cols and
      //    returned it byte-identical. so BOTH causes [t6] enumerates are
      //    refuted: not WRAPPED (the pane is wide), not OVERWRITTEN (one run).
      //
      // 🔴 the cause is the LADDER, never the render. `yield 🌾` is a verdict and
      //    no arm enumerates it, so it falls to `*)` — the clipped default. this
      //    file already declares the word twice, in its own prose:
      //      git.crew.poll.sh:2664  "the stone reads whatever it read before the
      //                              wall — `🔍` or `yield 🌾`"
      //      crewwork.pane.integration.test.ts
      //                             "so it reads `🔍` or `yield 🌾`, which routes
      //                              to the DRIVER"
      //    ⇒ 🌾 is 🔍's DECLARED PEER and shares its whole action — the driver's,
      //      send naught. it belongs in that bucket, never in the defect one.
      //      (rule.require.enumerate-before-you-name — the same shape [t0] cured
      //       for `🔍` itself, one verdict further down the same ladder)
      //
      // ⚠️ .the harm INVERTS [t0]'s bias note. that note argues a false clip is
      //    cheap — "one glance and one crew.refresh" — and that holds for a shape
      //    nobody enumerated ONCE. this shape recurs on EVERY tick a driver sits
      //    mid-yield, so the glance and the null call are charged per tick, and
      //    the tally reports a defect over a healthy fleet (term=false-report).
      //
      // ⚠️ .why the LABEL is left alone, deliberately. `🔍 N in review` now counts
      //    a stone producing a YIELD rather than one under review — imprecise,
      //    and the precise repair is a widened label, which would edit a CAPTURED
      //    production render (.test/.assets/render.poll.star-scope-tallies-omit-
      //    their-denominator.log:46). a captured asset is evidence, never a draft.
      //    recorded here as a known nitpick rather than taken silently.
      when('[t7] a `yield 🌾` stone is sorted', () => {
        then(
          '🌾 has its OWN arm, and it runs above the clipped default',
          () => {
            const src = readPoll();
            expect(src.includes(`*'🌾'*)`)).toEqual(true);
            // .why the order: "reached no verdict" is exact only where every
            //      verdict was already offered a chance to match — [t2]'s basis
            const iYield = src.indexOf(`*'🌾'*)`);
            const iClipDefault = src.indexOf('STONE_CLIPPED++');
            expect(iClipDefault).toBeGreaterThan(-1);
            expect(iYield).toBeLessThan(iClipDefault);
          },
        );

        then('it lands in the DRIVER bucket, never the defect bucket', () => {
          const src = readPoll();
          const arm = src.slice(
            src.indexOf(`*'🌾'*)`),
            src.indexOf('STONE_CLIPPED++'),
          );
          expect(arm.includes('STONE_INWORK++')).toEqual(true);
          expect(arm.includes('STONE_CLIPPED++')).toEqual(false);
        });

        then(
          '🔴 the shipped ladder goes RED on the measured row — the bite proof',
          () => {
            // .teeth = the arms exactly as they shipped, with 🌾 absent from each
            const shipped = [
              `        *'judge, approved?'*)`,
              '        *blocked*|*exhausted*|*malfunction*)  (( STONE_STUCK++ ))   ;;',
              '        relic*)                               (( STONE_RELIC++ ))   ;;',
              `        *'route complete'*)                   (( STONE_DONE++ ))    ;;`,
              `        *'🔍'*)                               (( STONE_INWORK++ ))  ;;`,
              '        *)',
              '          (( STONE_CLIPPED++ ))',
            ].join('\n');
            expect(shipped.includes('🌾')).toEqual(false);

            // and the measured row really does fall past EVERY shipped arm, so the
            // clamp bites on the absent verdict rather than an unrelated edit
            const measured = '5.1.execution.from_vision, yield 🌾';
            expect(measured.includes('judge, approved?')).toEqual(false);
            expect(/blocked|exhausted|malfunction/.test(measured)).toEqual(
              false,
            );
            expect(measured.startsWith('relic')).toEqual(false);
            expect(measured.includes('route complete')).toEqual(false);
            expect(measured.includes('🔍')).toEqual(false);
            expect(measured.includes('🌾')).toEqual(true);
          },
        );

        then(
          'the row was captured verbatim from production, and an asset holds it',
          () => {
            // rule.always.clamp-the-verbatim-pane-your-classifier-judged — a
            // hand-typed row is a pane that never existed. this one was captured
            // off the wire, and it carries the statusline exactly as claude drew it
            const pane = read(
              join(
                DIR_WORK,
                '.test/.assets/pane.husk.false-positive-under-claude-upgrade-notice.log',
              ),
            );
            const row = pane.split('\n').find((l) => l.includes('🌾'));
            expect(row).toBeDefined();
            expect(row!.includes('yield')).toEqual(true);
            // 🔴 the whole defect in one assertion: the row terminates at its own
            //    verdict — no ellipsis, naught cut
            expect(row!.includes('…')).toEqual(false);
          },
        );
      });
    },
  );

  /**
   * [case45] — ✂️ named TWO concepts of opposite valence, two rows apart
   *
   * 🔴 .the shape = the summary block shipped both of these, 258 lines apart in
   *    source and TWO ROWS apart on screen:
   *
   *      ├─ ✂️  0 of the 4 shown cut — 0 with no live clone, 0 still > 24h
   *      ├─ 🌊 ducts moved — 5 changed, 139 unchanged
   *      ├─ 🗿 stones — … · ✂️ 0 clipped  (+12 seat(s) hold no clone)
   *
   *    one glyph, and — worse — one VERB: the declared cure table defines the
   *    second as `clipped  judged, the TAIL was cut`. so `cut` is the word that
   *    DEFINES `clipped`, and the row above used it for a different concept.
   *
   * 🔴 .the valences are OPPOSITE, which is what makes the conflation costly:
   *      🗂️ folded  — the tool CHOSE to elide a row. benign; `--all` widens it
   *      ✂️ clipped — the tool COULD NOT READ a datum. a defect, owed a cure
   *    ⇒ a render that cannot say whether it showed less ON PURPOSE or failed
   *      to SEE is a partial audit with a complete face (term=partial-audit).
   *
   * ⚠️ .the prior decision this does NOT overturn — read it before you edit
   *    `cut` was chosen DELIBERATELY on 2026-09-16, to dodge an overload of
   *    `hidden` against the ⭐ header, after a supervisor misread two `hidden`
   *    counts with different denominators as a self-contradiction. that
   *    argument holds and is untouched here: `folded` is not `hidden` either.
   *    ⇒ this completes that fix rather than reverses it — the same rule
   *      (rule.forbid.domain-term-ambiguity) demands both halves.
   *
   * ✅ .and `folded` is NOT a coinage. it is the file's own word for this very
   *    count in three comments (:113, :2107, :3484). only the RENDER had
   *    drifted, so the repair is a conform (rule.forbid.domain-term-
   *    inconsistency), and no new glyph sense enters the palette un-declared.
   *
   * .teeth = restore `✂️` or `cut` on the fold row and [t0]/[t1] go red.
   */
  given(
    '[case45] a glyph names ONE concept — the fold row and the clip row are parted',
    () => {
      const readPoll = (): string => asCode(readPollWhole());

      // .why a RAW reader beside the code one — the DECLARED cure table that makes
      //      `cut` the wrong word lives in a comment, and `readCode` strips every
      //      `^\s*#` line. so the claim "the table defines clipped with this verb"
      //      is invisible to the code reader, and an assertion on it would pass
      //      `false` forever. ⇒ read raw where the CLAIM is prose, code where the
      //      claim is behavior — never the reverse.
      const readPollRaw = (): string => readPollWhole();

      // the two rendered rows, located by their own text rather than by line
      // number — a line number goes stale on the next edit above them
      const FOLD_ROW =
        /echo " {3}├─ [^"]*of the \$\{#TREES\[@\]\} shown [^"]*"/;
      const STONE_ROW = /echo " {3}├─ 🗿 stones — [^"]*"/;

      when('[t0] the fold row is read', () => {
        then("it does NOT wear ✂️ — that glyph is the clip bucket's", () => {
          const row = readPoll().match(FOLD_ROW)?.[0] ?? '';
          expect(row).not.toEqual('');
          expect(row.includes('✂️')).toEqual(false);
        });

        then(
          'and it does NOT say `cut` — the verb that DEFINES clipped',
          () => {
            // 🔴 the glyph alone was not the whole collision. a reader who sorts on
            //    the word rather than the symbol lands in the same wrong bucket, so
            //    the clamp grades BOTH or it grades half the defect.
            const row = readPoll().match(FOLD_ROW)?.[0] ?? '';
            expect(row).not.toEqual('');
            expect(/\bcut\b/.test(row)).toEqual(false);
          },
        );

        then(
          "it reuses the file's OWN word for this count, rather than a coinage",
          () => {
            const row = readPoll().match(FOLD_ROW)?.[0] ?? '';
            expect(row.includes('folded')).toEqual(true);
          },
        );

        then(
          'and it still does NOT say `hidden` — the 2026-09-16 decision holds',
          () => {
            // ⚠️ the regression this clamp exists to prevent runs BOTH ways. a
            //    future author who reads only the collision above could "simplify"
            //    the row back to `hidden` and re-open the denominator misread that
            //    `cut` was chosen to close.
            const row = readPoll().match(FOLD_ROW)?.[0] ?? '';
            expect(row.includes('hidden')).toEqual(false);
          },
        );
      });

      when('[t1] the two rows are held against each other', () => {
        then('✂️ appears in the stone row and NOT in the fold row', () => {
          const src = readPoll();
          const stone = src.match(STONE_ROW)?.[0] ?? '';
          const fold = src.match(FOLD_ROW)?.[0] ?? '';
          expect(stone).not.toEqual('');
          expect(fold).not.toEqual('');
          // the glyph resolves to exactly one of the two rendered rows
          expect(stone.includes('✂️')).toEqual(true);
          expect(fold.includes('✂️')).toEqual(false);
        });

        then('the fold glyph is unclaimed elsewhere in the render', () => {
          // a swap that trades one collision for another cures naught. 🗂️ must
          // not already carry a sense in this skill's palette.
          const src = readPoll();
          const rendered = src.match(/echo " {3}├─ 🗂️[^"]*"/g) ?? [];
          expect(rendered.length).toEqual(1);
        });
      });

      when('[t2] the collision as it SHIPPED is read', () => {
        then('the clamp bites — the shipped row trips both arms', () => {
          // .teeth = the fold row exactly as it shipped
          const shipped =
            'echo "   ├─ ✂️  $HIDDEN_TOTAL of the ${#TREES[@]} shown cut — $HIDDEN_NOCLONE with no live clone, $HIDDEN_IDLE still > ${__idle_h}h — rhx git.crew.poll --all"';
          expect(FOLD_ROW.test(shipped)).toEqual(true);
          expect(shipped.includes('✂️')).toEqual(true);
          expect(/\bcut\b/.test(shipped)).toEqual(true);
          expect(shipped.includes('folded')).toEqual(false);
        });

        then(
          'and the declared cure table is what makes `cut` the wrong word',
          () => {
            // the collision is not a matter of taste — the table DEFINES clipped
            // with this verb, so the fold row had borrowed the clip row's own
            // definition for a concept of the opposite valence
            expect(
              readPollRaw().includes('clipped  judged, the TAIL was cut'),
            ).toEqual(true);
          },
        );
      });
    },
  );

  /**
   * [case46] — a LIVE seat that filed no stone row was counted in NO bucket
   *
   * 🔴 .the shape = `__crew_record_stone` returns early where the 🗿 line could
   *    not be parsed (git.crew.poll.sh:1237, `[[ -n "$stone" ]] || return 0`),
   *    so that seat files no row at all. the tally walks CREW_STONES, so it
   *    never sees the seat — and `✂️ clipped` cannot catch it either, because
   *    clipped grades a row that EXISTS whose tail was cut. here no row exists.
   *
   *    ⇒ the seat falls out of the five buckets AND out of the `hold no clone`
   *      parenthetical, so the tally's denominator shrinks with no trace.
   *
   * 🔴 .measured 2026-09-17, star scope, 4 crews. the shipped row read:
   *      🗿 stones — 🙋 0 await approval · ✋ 1 blocked · 🔍 1 in review ·
   *                  🌴 0 complete · ✂️ 0 clipped  (+12 seat(s) hold no clone)
   *    14 seats accounted for. `feat-acceptance-under-5min/mechanic` was the
   *    15th: a LIVE clone whose pane printed `route.stone.set --stone 1.vision
   *    --as approved` — a HUMAN-only grant. an ask widget covered its
   *    statusline, so no 🗿 line was emitted.
   *    ⇒ `🙋 0 await approval` on the one row a supervisor reads every tick,
   *      while a human-only gate sat unrelayed in that very seat.
   *
   * ⚠️ .this is the relic parenthetical's own argument (:3795), applied to the
   *    symmetric case: "omitted entirely it would be a silent exclusion, and a
   *    reader could not check the arithmetic against the render above
   *    (term=partial-audit). stated, it is neither."
   *
   * ✅ .and it claims NO new word or glyph — `clipped`, `relic`, `unread`, and
   *    `covered` are each spoken for. a fifth sense on any of them is the very
   *    defect [case45] cured one row up (rule.forbid.domain-term-ambiguity).
   *
   * .teeth = drop `$STONE_NOSTONE` from the tally row and [t0] goes red; drop
   *          the no-clone `case` filter and [t1] goes red.
   */
  given(
    '[case46] a live seat with no parsed stone is counted and named',
    () => {
      const readPoll = (): string => asCode(readPollWhole());
      const STONE_ROW = /echo " {3}├─ 🗿 stones — [^"]*"/;

      when('[t0] the stone tally row is read', () => {
        /**
         * ⚠️ RETARGETED 2026-09-20 — the two terms moved off the echo and into
         *    `__ns_paren`, which [case59] appends a third term to. a literal
         *    anchor on the echo line is the prose-anchor trap [case41] records
         *    three times over, so this asserts the GUARANTEE end to end instead:
         *    the row interpolates the assembly, and the assembly states both.
         */
        then(
          'it states the live-seat-with-no-stone count, beside the relic count',
          () => {
            const src = readPoll();
            const row = src.match(STONE_ROW)?.[0] ?? '';
            expect(row).not.toEqual('');
            // the row carries the parenthetical, whatever terms it came to hold
            expect(row.includes('($__ns_paren)')).toEqual(true);
            const at = src.indexOf('__ns_paren="');
            expect(at).toBeGreaterThan(-1); // ANTI-VACUITY: the assembly exists
            const paren = src.slice(at, at + 400);
            // both exclusions stated — neither is silent
            expect(
              paren.includes('$STONE_RELIC seat(s) hold no clone'),
            ).toEqual(true);
            expect(
              paren.includes('$STONE_NOSTONE live seat(s) rendered no stone'),
            ).toEqual(true);
          },
        );
      });

      when('[t1] the counter is read', () => {
        const src = readPoll();

        then(
          'it walks the BOX map, which holds every seat — not the stone map',
          () => {
            // 🔴 the stone map is precisely what drops these seats, so a count
            //    derived from it could never find them. the box map is filed
            //    unconditionally at :1185, so it is the only complete roster.
            const loop = src.indexOf('for __ns_t in "${!CREW_BOXES[@]}"');
            expect(loop).toBeGreaterThan(0);
          },
        );

        then(
          "it excludes the three no-clone boxes — those are the RELIC count's",
          () => {
            // shell / husk / 🪦absent each mean no live claude draws that pane.
            // to count them here would double-count the relic parenthetical.
            expect(
              src.includes(
                'case "$__ns_box" in shell|husk|\'🪦absent\') continue ;; esac',
              ),
            ).toEqual(true);
          },
        );

        then(
          'and it counts a seat only where the stone map holds no row for it',
          () => {
            expect(
              src.includes(
                'if printf \'%s\\n\' "${CREW_STONES[$__ns_t]:-}" | grep -qa "^${__ns_role}="; then continue; fi',
              ),
            ).toEqual(true);
          },
        );
      });

      when('[t2] the render guard is read', () => {
        /**
         * ⚠️ RETARGETED 2026-09-20 — this pinned the guard's exact TAIL, so it
         *    died the day [case59] appended `+ STONE_NOSTONE_ASLEEP` to it: a
         *    change that STRENGTHENS the very guarantee below. that is the
         *    prose-anchor trap [case41] records three times. so it now asserts
         *    the guarantee — the term is IN the guard — and leaves the tail free.
         */
        then(
          'it admits the new count, so a fleet of only-silent seats still renders',
          () => {
            // 🔴 left out of the guard, a tick whose every seat went silent would
            //    render NO stone row at all — the loudest case, rendered as blank.
            const src = readPoll();
            const at = src.indexOf('if (( STONE_HUMAN + STONE_STUCK');
            expect(at).toBeGreaterThan(-1); // ANTI-VACUITY: the guard exists
            const guard = src.slice(at, src.indexOf('> 0 )); then', at));
            expect(guard.includes('STONE_NOSTONE')).toEqual(true);
          },
        );
      });

      when('[t3] the detail block is read', () => {
        const src = readPoll();

        then(
          'each silent seat is NAMED — a count alone leaves a byhand hunt',
          () => {
            expect(src.includes('while IFS= read -r __nw; do')).toEqual(true);
            expect(
              src.includes('STONE_NOSTONE_WHO+="${__ns_t}/${__ns_role}"'),
            ).toEqual(true);
          },
        );

        then(
          'and each name carries a runnable read, bound to tree AND role',
          () => {
            // the cure for a covered statusline is a raw read of that one seat.
            // --raw, because the overlay is drawn in SGR the plain read strips.
            expect(
              src.includes(
                'rhx git.crew.read --tree ${__nw%%/*} --who ${__nw##*/} --raw --lines 40',
              ),
            ).toEqual(true);
          },
        );
      });

      when('[t4] the premise is re-checked', () => {
        then(
          'the early return that drops the seat is still at the parse layer',
          () => {
            // ⚠️ if this guard ever goes, the drop is cured at the source and this
            //    whole case becomes dead weight — so the clamp asserts its own
            //    premise rather than assume it (rule.require.trust-but-verify).
            expect(
              readPoll().includes('[[ -n "$stone" ]] || return 0'),
            ).toEqual(true);
          },
        );
      });
    },
  );

  /**
   * [case60] — the 🤐 row names a cause it cannot see
   *
   * 🔴 .the shape = [case59] split the UNREACHED seats off this row and left
   *    the LIVE half untouched. that half still asserts ONE cause:
   *
   *        "an overlay (ask widget, modal, survey) covers the statusline"
   *
   *    the counter knows only that a live box rendered no `🗿` line. WHY it
   *    rendered none is not a fact the sweep holds — so the clause is a
   *    volunteered diagnosis, stated in the tool's own voice
   *    (term=volunteered-diagnosis).
   *
   * 🔴 .measured 2026-09-20, star scope. the row named 3 seats; all 3 were
   *    read `--raw` and NOT ONE carried an overlay. each returned a clean box
   *    — prose, a bare `❯`, and the mode line with no 🗿 above it.
   *
   *    the decisive one is `declapract-typescript-ehmpathy.beav.fix-persist
   *    -with-rds-jsdoc-self-close`: an ACHIEVEMENT tree, which carries no
   *    route by construction, so it can never render a stone and no overlay
   *    is ever involved. a single cause cannot cover it.
   *
   * ⚠️ .the cost is a HUNT. the row sends the supervisor to look for a modal,
   *    and the tick pays one read per seat to learn there was none — the same
   *    null call `rule.require.poll-recommends-every-cure-heal-has` grades a
   *    defect, and the exact shape the ✂️ row two blocks down already fixed
   *    for itself ("two causes, and a refresh cures only one").
   *
   * ✅ .why the ACTION is kept — "read each seat before you trust a 0" stayed
   *    right under both causes: the reads found two commit-quota gates this
   *    very tick. only the promise of WHAT the read would show was wrong, so
   *    the cure corrects the cause and leaves the move alone.
   *
   * .teeth = restore the single-cause clause and [t0] goes red; drop the
   *          discriminator and [t1] goes red; drop the surviving read or the
   *          floor sentence and [t2] goes red — that last one is [case59]'s
   *          guarantee, re-asserted here so this cure cannot quietly undo it.
   */
  given(
    '[case60] the muted-stone row states both causes, never the one it guessed',
    () => {
      const readPoll = (): string => asCode(readPollWhole());
      const liveArm = (src: string): string => {
        const at = src.indexOf('🤐 a live clone whose 🗿 line never rendered');
        expect(at).toBeGreaterThan(-1); // ANTI-VACUITY: the row still exists
        const end = src.indexOf('😴 a seat on a grove that did not ANSWER', at);
        expect(end).toBeGreaterThan(at); // ANTI-VACUITY: bounded by its peer arm
        return src.slice(at, end);
      };

      when('[t0] the live arm is read', () => {
        const arm = liveArm(readPoll());

        then('🔴 it does NOT assert an overlay as THE cause', () => {
          // the single-cause clause, verbatim as it shipped
          expect(arm.includes('survey) covers the statusline')).toEqual(false);
        });

        then('it names BOTH causes — the overlay and the undrawn stone', () => {
          expect(arm).toContain('OVERLAID');
          expect(arm).toContain('UNDRAWN');
        });
      });

      when('[t1] a reader asks which of the two they are looking at', () => {
        const arm = liveArm(readPoll());

        then(
          '🔴 the row hands them the discriminator, so neither is a guess',
          () => {
            // conforms to the ✂️ row's shape: name the cheap test, not the verdict
            expect(arm.toLowerCase()).toContain('--raw');
            expect(arm).toContain('CLEAN box');
          },
        );

        then('and it says only ONE of the two can hide a gate', () => {
          expect(arm.includes('only ONE hides a gate')).toEqual(true);
        });
      });

      /**
       * 🔴 [t2] — the regression guard on the CURE, not on the defect
       *
       *   [case59]:[t1] asserts this arm keeps its per-seat read and its floor
       *   sentence. a rewrite of the row is exactly the edit that would drop
       *   one by accident, so the same two claims are pinned here — at the
       *   surface being changed, where a future author will see them.
       */
      when('[t2] the cure is held against what [case59] guaranteed', () => {
        const arm = liveArm(readPoll());

        then('the per-seat read survives — the move is untouched', () => {
          expect(arm).toContain('rhx git.crew.read --tree');
        });

        then(
          'and the floor sentence survives — the tally stays checkable',
          () => {
            expect(arm).toContain('read each seat before you trust a 0');
          },
        );
      });
    },
  );
});
