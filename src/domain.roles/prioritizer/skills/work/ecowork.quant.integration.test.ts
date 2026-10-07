/**
 * .what = clamps on a priority row and its surface — quants, vocab, rank, sets, flags, help
 *
 * .note = a PART of the `ecowork.db` suite, cut so one reviewer can hold
 *         it whole. the suite's shared fixtures, and its account of what it
 *         runs against and why, live in ecowork.harness.ts.
 */
import { spawnSync } from 'child_process';
import { readdirSync, readFileSync } from 'fs';
import { dirname, join } from 'path';
import { given, then, useBeforeAll, useThen, when } from 'test-fns';

import { tempDirs } from '../../../.test/tempDirs';
import {
  eco,
  genDbPath,
  PATH_ECO_PRIORITY_SH,
  PATH_ECOWORK_DB,
  PATH_ECOWORK_SH,
} from './ecowork.harness';

afterAll(() => tempDirs.delAll());

describe('ecowork.db', () => {
  given('[case1] a priority whose gain repeats for a bounded life', () => {
    const db = genDbPath({ slug: 'eco-duration' });

    when('[t0] it is set with a 1mo period over a 3mo duration', () => {
      const result = useThen('the set lands', () =>
        eco({
          db,
          verb: 'set',
          payload: {
            slug: 'bigrock://svc-lessons-acu-floor',
            what: 'a query over-ramps the min ACU floor',
            sev: 'p1',
            urg: '1w',
            gainCash: 'USD 150.00',
            gainPer: '1mo',
            gainDuration: '3mo',
            costTime: '5h',
          },
        }),
      );

      then('the period repeats three times, not twelve', () => {
        expect(result.priority.quant.gain.repeats).toEqual(3);
      });

      then('the total is the rate times its own repeats', () => {
        expect(result.priority.quant.gain.cashTotal).toEqual('USD 450.00');
      });

      // 🔴 the clamp on the defect that motivated the duration axis. the prior
      //    design annualized to a fixed first-year window, so this row would
      //    have read USD 1800.00 — four times a gain nobody gets
      then('it is NOT annualized to a horizon nobody declared', () => {
        expect(result.priority.quant.gain.cashTotal).not.toEqual('USD 1800.00');
      });

      then('cash per hour divides the net by the work, in cents', () => {
        expect(result.priority.quant.cashPerHour).toEqual('USD 90.00'); // 450 / 5h
      });
    });
  });

  given('[case2] a cost that outlives the gain it bought', () => {
    const db = genDbPath({ slug: 'eco-outlives' });

    when('[t0] a 3mo gain is set against a 5y vendor line', () => {
      const result = useThen('the set lands', () =>
        eco({
          db,
          verb: 'set',
          payload: {
            slug: 'bigrock://vendor-line',
            what: 'a vendor line that outlives its gain',
            sev: 'p2',
            urg: '1m',
            gainCash: 'USD 150.00',
            gainPer: '1mo',
            gainDuration: '3mo',
            costCash: 'USD 40.00',
            costPer: '1mo',
            costDuration: '5y',
            costTime: '5h',
          },
        }),
      );

      // 🔴 THE clamp for per-side durations. one shared window cannot state
      //    this row at all: forced onto 5y it invents 57 months of gain, and
      //    forced onto 3mo it forgives 57 months of spend
      then('each side totals over its OWN life', () => {
        expect(result.priority.quant.gain.cashTotal).toEqual('USD 450.00');
        expect(result.priority.quant.cost.cashTotal).toEqual('USD 2400.00');
      });

      then('the net is a loss, and says so', () => {
        expect(result.priority.quant.netCashTotal).toEqual('USD -1950.00');
      });

      then('the cash rank sorts it to the bottom, as a negative rate', () => {
        expect(result.priority.quant.cashPerHourCents).toBeLessThan(0);
      });
    });
  });

  given('[case3] an extant priority with a full quant family', () => {
    const db = genDbPath({ slug: 'eco-partial' });

    const before = useBeforeAll(async () =>
      eco({
        db,
        verb: 'set',
        payload: {
          slug: 'bigrock://grepsafe-glob',
          what: 'grepsafe --glob matches the basename alone',
          why: 'a silent zero-match reads as a clean absence',
          sev: 'p2',
          urg: '1w',
          gainCash: 'USD 90.00',
          gainPer: '1mo',
          gainDuration: '2y',
          costTime: '2h',
          refTask: ['#598', '#622'],
        },
      }),
    );

    when('[t1] it is re-set with the slug alone — an EDIT, not an ask', () => {
      const after = useThen('the partial set lands', () =>
        eco({ db, verb: 'set', payload: { slug: 'bigrock://grepsafe-glob' } }),
      );

      // 🔴 the clamp on the most expensive silent defect available: the cheapest
      //    call in the tool deletes the half a human paid to measure
      then('the whole quant family survives', () => {
        expect(after.priority.quant.gain.cash).toEqual(
          before.priority.quant.gain.cash,
        );
        expect(after.priority.quant.gain.duration).toEqual('2y');
        expect(after.priority.quant.cost.time).toEqual('2h');
      });

      then('the opine and the prose survive', () => {
        expect(after.priority.opine).toEqual(before.priority.opine);
        expect(after.priority.why).toEqual(before.priority.why);
      });

      then('the refs survive', () => {
        expect(after.priority.refTask).toEqual(['#598', '#622']);
      });

      // 🔴 this pair once asserted the OPPOSITE, and the opposite was wrong
      //    the store used to climb `asks` on every write, defended as a
      //    deliberate over-count: "a human who reaches for a priority is a
      //    human the defect reached first". but the caller is usually a
      //    CLONE, so three edits made on one human's behalf read as three
      //    human asks — measured 2026-09-13, and it fired a false 🪃
      then('asks does NOT climb — an edit is not an ask', () => {
        expect(after.priority.quant.asks).toEqual(1);
      });

      then('and no rung is reported, because none was crossed', () => {
        expect(after.askCrossed).toEqual(null);
      });

      // 🔴 the informs-never-overwrites invariant, as a claim a test can fail on
      then('the opine survives the write untouched', () => {
        expect(after.priority.opine.urg).toEqual(before.priority.opine.urg);
      });
    });

    when('[t1b] a real ask is recorded with --ask', () => {
      const after = useThen('the ask lands', () =>
        eco({
          db,
          verb: 'set',
          payload: { slug: 'bigrock://grepsafe-glob', ask: true },
        }),
      );

      then('asks climbs by exactly one', () => {
        expect(after.priority.quant.asks).toEqual(2);
      });

      then('a crossed rung is reported as a PROMPT', () => {
        expect(after.askCrossed).toEqual(2);
      });

      then('the crossed rung does NOT rewrite urg', () => {
        expect(after.priority.opine.urg).toEqual(before.priority.opine.urg);
      });
    });

    when('[t1c] the count is corrected outright with --asks', () => {
      const after = useThen('the absolute set lands', () =>
        eco({
          db,
          verb: 'set',
          payload: { slug: 'bigrock://grepsafe-glob', asks: 8 },
        }),
      );

      then('the count is exactly what was stated', () => {
        expect(after.priority.quant.asks).toEqual(8);
      });

      then('the rung follows the count', () => {
        expect(after.priority.quant.askRung).toEqual(8);
      });
    });

    // 🔴 the three guards on the nudge, each from a false fire measured
    //    2026-09-13. a nudge that cries on a non-event is a nudge a human
    //    learns to scroll past, which costs the real ones their weight
    when('[t1d] the count is repaired DOWNWARD', () => {
      const after = useThen('the repair lands', () =>
        eco({
          db,
          verb: 'set',
          payload: { slug: 'bigrock://grepsafe-glob', asks: 2 },
        }),
      );

      then('no rung is reported — a correction is not a recurrence', () => {
        expect(after.priority.quant.asks).toEqual(2);
        expect(after.askCrossed).toEqual(null);
      });
    });

    when('[t1e] the count is repaired to the FLOOR', () => {
      const after = useThen('the repair lands', () =>
        eco({
          db,
          verb: 'set',
          payload: { slug: 'bigrock://grepsafe-glob', asks: 1 },
        }),
      );

      // rung 1 is where every row is born, so "just hit rung 1" reports an
      // event that never happened
      then('rung 1 never fires, though it is a rung', () => {
        expect(after.priority.quant.askRung).toEqual(1);
        expect(after.askCrossed).toEqual(null);
      });
    });

    when('[t2] a field is cleared with the `none` sentinel', () => {
      const after = useThen('the clear lands', () =>
        eco({
          db,
          verb: 'set',
          payload: { slug: 'bigrock://grepsafe-glob', gainCash: 'none' },
        }),
      );

      then('the cash is gone', () => {
        expect(after.priority.quant.gain.cash).toEqual(null);
      });

      then('its orphaned period resets rather than errors', () => {
        expect(after.priority.quant.gain.per).toEqual('once');
      });

      // 🔴 the asymmetry define.cost-gain-matrix exists to prevent: a row with
      //    no cash can never earn a ⚖️, so its quiet flag column must NOT read
      //    as "measured, and it agrees"
      then('the row reports itself UNMEASURED, not agreed', () => {
        expect(after.priority.quant.cashMeasured).toEqual(false);
      });
    });
  });

  given('[case4] a payload the vocabularies refuse', () => {
    const db = genDbPath({ slug: 'eco-refuse' });

    const getExitCode = (payload: object): number => {
      try {
        eco({ db, verb: 'set', payload });
        return 0;
      } catch (error) {
        return (error as { status: number }).status;
      }
    };

    // ⚠️ every slug below is a VALID goal uri on purpose. a bare token is now
    //   refused by `assertSlugIsGoal`, and that refusal also exits 2 — so a
    //   bare-token fixture would go green while the guard under test never
    //   ran at all (rule.forbid.failhide)

    // ✅ the sev scale is FIBONACCI — p4 is absent on purpose, and a reader who
    //    infers a typo and adds it destroys the property the scale is FOR
    then('[t0] p4 is refused, because 4 is not in the sequence', () => {
      expect(
        getExitCode({ slug: 'bigrock://x', what: 'x', sev: 'p4', urg: '1w' }),
      ).toEqual(2);
    });

    then('[t1] a bare number is refused as cash', () => {
      expect(
        getExitCode({
          slug: 'bigrock://y',
          what: 'y',
          sev: 'p1',
          urg: '1w',
          gainCash: '150',
        }),
      ).toEqual(2);
    });

    // a cross-currency pair sums to a meaningless net, and the net is what the
    // whole cash rank rests on. a store with no fx rate must say so
    then('[t2] a cross-currency pair is refused rather than summed', () => {
      expect(
        getExitCode({
          slug: 'bigrock://z',
          what: 'z',
          sev: 'p1',
          urg: '1w',
          gainCash: 'USD 100.00',
          costCash: 'EUR 40.00',
        }),
      ).toEqual(2);
    });

    then('[t3] a new priority with no opine is refused', () => {
      expect(getExitCode({ slug: 'bigrock://w', what: 'w' })).toEqual(2);
    });
  });

  given('[case5] rows whose cash rank disagrees with their opine rank', () => {
    const db = genDbPath({ slug: 'eco-flag' });

    const result = useBeforeAll(async () => {
      // p0, and worth naught per hour
      eco({
        db,
        verb: 'set',
        payload: {
          slug: 'bigrock://a-loud-cheap-win',
          what: 'loud, and worth little',
          sev: 'p0',
          urg: '1d',
          gainCash: 'USD 10.00',
          costTime: '2d',
        },
      });
      eco({
        db,
        verb: 'set',
        payload: {
          slug: 'bigrock://b-quiet-middle',
          what: 'quiet',
          sev: 'p1',
          urg: '1w',
        },
      });
      // p3, and the best rate on the board
      eco({
        db,
        verb: 'set',
        payload: {
          slug: 'bigrock://c-quiet-rich-win',
          what: 'quiet, and worth plenty',
          sev: 'p3',
          urg: '1m',
          gainCash: 'USD 400.00',
          gainPer: '1mo',
          gainDuration: '2y',
          costTime: '1h',
        },
      });
      return eco({ db, verb: 'get', payload: {} });
    });

    // 🔴 the invariant, as a rank: evidence breaks a tie between judgments; it
    //    never overturns one
    then('[t0] the OPINE sets the order, and the quant does not', () => {
      expect(result.priorities.map((p: { slug: string }) => p.slug)).toEqual([
        'bigrock://a-loud-cheap-win',
        'bigrock://b-quiet-middle',
        'bigrock://c-quiet-rich-win',
      ]);
    });

    then('[t1] the row whose evidence outranks its judgment is FLAGGED', () => {
      const flagged = result.priorities.filter(
        (p: { quantClimb: number | null }) => p.quantClimb !== null,
      );
      expect(flagged).toHaveLength(1);
      expect(flagged[0].slug).toEqual('bigrock://c-quiet-rich-win');
      expect(flagged[0].quantClimb).toBeGreaterThanOrEqual(2);
    });

    then('[t2] a row with no cash is never flagged, and never agrees', () => {
      const quiet = result.priorities.find(
        (p: { slug: string }) => p.slug === 'bigrock://b-quiet-middle',
      );
      expect(quiet.quantClimb).toEqual(null);
      expect(quiet.quant.cashMeasured).toEqual(false);
    });
  });

  given('[case6] a slug that was never set', () => {
    const db = genDbPath({ slug: 'eco-del' });

    then('[t0] del reports it absent and exits ok', () => {
      const result = eco({
        db,
        verb: 'del',
        payload: { slug: 'bigrock://never-was' },
      });
      expect(result.dropped).toEqual('absent');
    });
  });

  // ─────────────────────────────────────────────────────────────────────
  // the HUMAN surface — ecowork.sh and its entrypoint
  //
  // .why a clamp of its own: every case above speaks json, so a render that
  //   reads a field the store no longer emits passes all of them and prints
  //   `—` to a human forever. the store's contract and its surface are two
  //   different subjects, and only the second is the one anybody looks at
  // ─────────────────────────────────────────────────────────────────────

  given('[case7] the bash surface, over a real store', () => {
    const db = genDbPath({ slug: 'eco-render' });

    /** .what = run `eco.priority ...` through bash, against a private db */
    const shell = (args: string) =>
      spawnSync('bash', ['-c', `source '${PATH_ECOWORK_SH}'\n${args}`], {
        encoding: 'utf8',
        env: { ...process.env, ECOWORK_DB: db },
        timeout: 30_000,
      });

    const render = useBeforeAll(async () => {
      shell(
        `eco.priority set --slug 'bigrock://svc-lessons-acu-floor' --sev p1 --urg 1w ` +
          `--what 'a query over-ramps the min ACU floor' ` +
          `--gain-cash 'USD 150.00' --gain-per 1mo --gain-for 3mo --cost-time 5h`,
      );
      shell(
        `eco.priority set --slug 'bigrock://quiet-one' --sev p2 --urg 1m --what 'no cash story'`,
      );
      return shell('eco.priority get');
    });

    // .why the stderr rides IN the assertion rather than beside it
    //   a bare `expect(status).toEqual(0)` reports a code and no cause, so the
    //   diagnosis costs a second run with a hand-rolled probe. the pair fails
    //   with the reason already on the page
    then('[t0] it exits ok', () => {
      expect({ exit: render.status, stderr: render.stderr }).toEqual({
        exit: 0,
        stderr: '',
      });
    });

    // 🔴 the clamp on a render that reads a field the store renamed. the prior
    //    surface read `.quant.gain.cashYearOne`, which no longer exists — and a
    //    json-only suite would never have noticed
    then(
      '[t1] the gain renders its period AND its duration, then the total',
      () => {
        expect(render.stdout).toContain(
          'USD 150.00 per 1mo for 3mo → USD 450.00',
        );
      },
    );

    // 🔴 the count is the detector, not the presence. the cashless row SHOULD
    //    render `gain  —`; the row with cash should not. a render that reads a
    //    field the store renamed prints `—` for BOTH, and a bare
    //    `not.toContain` cannot tell that apart from the correct output
    then(
      '[t2] exactly ONE row renders an em-dash gain — the cashless one',
      () => {
        const blanks = render.stdout.split('gain  —').length - 1;
        expect(blanks).toEqual(1);
      },
    );

    then('[t2b] no js null or undefined leaks into the human surface', () => {
      expect(render.stdout).not.toContain('null');
      expect(render.stdout).not.toContain('undefined');
    });

    then('[t3] the cashless row carries ❔, and the legend explains it', () => {
      expect(render.stdout).toContain('❔');
      expect(render.stdout).toContain('never a verdict of agreement');
    });

    then(
      '[t4] the rank is declared as OPINE-ordered, in the human surface',
      () => {
        expect(render.stdout).toContain('ranked by OPINE');
      },
    );
  });

  // 🔴 [case15] the nudge that handed back a BROKEN command
  //
  //    measured 2026-09-13. the rung prompt rendered `$SEV` and `$URG` — the
  //    CLI args — rather than the merged row. a partial set supplies only what
  //    it changes, so on nearly every real call those are empty, and the tool
  //    printed `may have outgrown urg=` above a paste-ready
  //    `--sev  --urg <urg>` that fails the moment you run it.
  //
  //    ⇒ the defect lived in the RENDER, so no json clamp could reach it. this
  //      case exists because the store-level clamps were all green while the
  //      human surface shipped a command that could not work.
  given('[case15] a partial set that crosses a rung', () => {
    const db = genDbPath({ slug: 'eco-nudge' });

    const shell = (args: string) =>
      spawnSync('bash', ['-c', `source '${PATH_ECOWORK_SH}'\n${args}`], {
        encoding: 'utf8',
        env: { ...process.env, ECOWORK_DB: db },
        timeout: 30_000,
      });

    const nudge = useBeforeAll(async () => {
      shell(
        `eco.priority set --slug 'bigrock://sms-tune' --sev p1 --urg 1d ` +
          `--what 'tune twilio spend' --why 'gain.cash — per-message spend, every month'`,
      );
      // the ask that crosses rung 2 — and it names NO sev and NO urg
      return shell(`eco.priority set --slug 'bigrock://sms-tune' --ask`);
    });

    then('[t0] it exits ok', () => {
      expect({ exit: nudge.status, stderr: nudge.stderr }).toEqual({
        exit: 0,
        stderr: '',
      });
    });

    then('[t1] the rung fires', () => {
      expect(nudge.stdout).toContain('just hit rung 2');
    });

    // the two the defect produced, verbatim
    then('[t2] urg renders the HELD value, never an empty tail', () => {
      expect(nudge.stdout).toContain('outgrown urg=1d');
      expect(nudge.stdout).not.toContain('outgrown urg=\n');
    });

    then('[t3] the offered command carries a real sev', () => {
      expect(nudge.stdout).toContain('--sev p1');
      expect(nudge.stdout).not.toMatch(/--sev\s+--urg/);
    });

    // 🔴 the general form, so the next blank-valued flag is caught too: a
    //    command this tool hands a human must never carry an empty flag
    then('[t4] no flag in the offered command is left value-less', () => {
      const offered = nudge.stdout
        .split('\n')
        .filter((line) => line.includes('rhx eco.priority'));
      expect(offered.length).toBeGreaterThan(0);
      for (const line of offered) expect(line).not.toMatch(/--[a-z-]+\s\s/);
    });
  });

  // 🔴 [case16] an EDIT must never climb the ask count, at the human surface
  //    the store-level twin is [case3][t1]. this one clamps that no 🪃 reaches
  //    the human either — the false fire is what made the defect visible
  given('[case16] three edits made on one human behalf', () => {
    const db = genDbPath({ slug: 'eco-edits' });

    const shell = (args: string) =>
      spawnSync('bash', ['-c', `source '${PATH_ECOWORK_SH}'\n${args}`], {
        encoding: 'utf8',
        env: { ...process.env, ECOWORK_DB: db },
        timeout: 30_000,
      });

    const after = useBeforeAll(async () => {
      shell(
        `eco.priority set --slug 'bigrock://sms-tune' --sev p3 --urg 1m --what 'tune twilio spend'`,
      );
      shell(`eco.priority set --slug 'bigrock://sms-tune' --sev p1 --urg 1d`); // a re-grade
      shell(`eco.priority set --slug 'bigrock://sms-tune' --cost-time 3h`); // an estimate
      return shell('eco.priority get');
    });

    then('[t0] the count still reads one, after three writes', () => {
      expect(after.stdout).toContain('asks 1 (rung 1)');
    });

    then('[t1] and no 🪃 was ever raised', () => {
      expect(after.stdout).not.toContain('🪃');
    });
  });

  // 🔴 [case18] an omission PRESERVES a ref — the store's most-stated invariant,
  //    and the one it silently broke.
  //
  //    the shell sent `[]` for an unnamed --ref-task, and `pickRefs` parts
  //    "not given" from "given" by Array.isArray — so `[]` read as GIVEN and
  //    wrote empty. `with_entries(select(.value != ""))` did not catch it
  //    either: `[] != ""` is true in jq, so the key survived the filter.
  //
  //    ⚠️ the loss left NO trace. the render shows `task: —`, which is exactly
  //    what a row that never had a ref looks like — so a human re-reads the
  //    output, sees an empty field, and has no way to tell a wipe from an
  //    absence. measured 2026-09-13 on three live rows, two of which had been
  //    verified ✅ by `eco.seed` one round earlier.
  given('[case18] a row with refs, edited on a field that is not a ref', () => {
    const db = genDbPath({ slug: 'eco-ref-preserve' });

    // ⚠️ the slug CARRIES the tree name, and must — `assertSlugIsTree` refuses
    //   a row that names a tree under a coined second name, because the coined
    //   name is a synonym: a grep for the branch would find no row. so the
    //   fixture is `bigrock://beav/fix-twilio`, never `bigrock://sms-tune`

    const shell = (args: string) =>
      spawnSync('bash', ['-c', `source '${PATH_ECOWORK_SH}'\n${args}`], {
        encoding: 'utf8',
        env: { ...process.env, ECOWORK_DB: db },
        timeout: 30_000,
      });

    const after = useBeforeAll(async () => {
      shell(
        `eco.priority set --slug 'bigrock://svc-lessons.beav.fix-twilio' --sev p1 --urg 1d --what 'tune twilio spend' ` +
          `--ref-task 'sandpine/svc-lessons#140' --ref-tree 'svc-lessons.beav.fix-twilio'`,
      );
      // the exact call that destroyed the refs: it names no ref at all
      shell(
        `eco.priority set --slug 'bigrock://svc-lessons.beav.fix-twilio' --gain-cash 'USD 100.00' --gain-per 1mo`,
      );
      return shell('eco.priority get');
    });

    then('[t0] the ref-task survives a write that never mentioned it', () => {
      expect(after.stdout).toContain('sandpine/svc-lessons#140');
    });

    then('[t1] and so does the ref-tree', () => {
      expect(after.stdout).toContain('svc-lessons.beav.fix-twilio');
    });

    then('[t2] the field that WAS named is written', () => {
      expect(after.stdout).toContain('USD 100.00 per 1mo');
    });

    // 🔴 the other half of the contract: `none` must still CLEAR.
    //    a fix that preserved unconditionally would pass [t0] and break this
    then('[t3] and an explicit `none` still clears it', () => {
      shell(
        `eco.priority set --slug 'bigrock://svc-lessons.beav.fix-twilio' --ref-task none`,
      );
      const cleared = shell('eco.priority get');
      expect(cleared.stdout).not.toContain('sandpine/svc-lessons#140');
      expect(cleared.stdout).toContain('task: —');
      // ⚠️ and it clears ONLY what it named — ref-tree is untouched
      expect(cleared.stdout).toContain('svc-lessons.beav.fix-twilio');
    });
  });

  given('[case8] a lost human who reaches for --help', () => {
    const help = useBeforeAll(async () =>
      spawnSync('bash', [PATH_ECO_PRIORITY_SH, '--help'], {
        encoding: 'utf8',
        timeout: 30_000,
      }),
    );

    then('[t0] it exits 0, rather than "a verb is required"', () => {
      expect(help.status).toEqual(0);
      expect(help.stdout).not.toContain('a verb is required');
    });

    // 🔴 the clamp on the defect a fixed `sed -n '2,96p'` range guarantees:
    //    the header grows, the range does not, and the help truncates SILENTLY
    //    in the one surface a lost human reaches for
    then('[t1] it prints the WHOLE header, never a truncated range', () => {
      expect(help.stdout).toContain('.what = record and rank'); // the first line
      expect(help.stdout).toContain('exit 0 = ok'); // the last line
    });

    then('[t2] it teaches the invariant the whole model rests on', () => {
      expect(help.stdout).toContain('a quant INFORMS an opine');
    });

    then('[t3] it teaches all three flags', () => {
      expect(help.stdout).toContain('🪃');
      expect(help.stdout).toContain('⚖️');
      expect(help.stdout).toContain('❔');
    });

    then('[t4] it teaches that an omission preserves and `none` clears', () => {
      expect(help.stdout).toContain('an omitted field PRESERVES');
      expect(help.stdout).toContain('`none` CLEARS');
    });

    then('[t5] it teaches per-vs-for, and that each side owns its own', () => {
      expect(help.stdout).toContain('PER is how often · FOR is how long');
      expect(help.stdout).toContain('EACH SIDE owns its own');
    });

    then('[t6] it strips the comment markers, so it reads as prose', () => {
      expect(help.stdout).not.toContain('#####');
      expect(
        help.stdout.split('\n').filter((line) => line.startsWith('#')),
      ).toEqual([]);
    });

    // 🔴 rule.forbid.fabricated-opines — a suggested opine IS an opine. this
    //    surface once shipped `--sev p1 --urg 1w` as its worked example, which
    //    taught p1 as the default on a ladder whose whole job is to force a pick
    //
    // ⚠️ the `(?!\s*\|)` is load-bearing: the help MUST still print the whole
    //    ladder as a vocabulary line (`--sev  p0 | p1 | p2 | p3 | p5`), and a
    //    bare /--sev\s+p[0-9]/ cannot part an ENUMERATION from a SUGGESTION.
    //    one value is a recommendation; the full set is the menu
    then('[t7] it suggests NO concrete sev or urg', () => {
      expect(help.stdout).not.toMatch(/--sev\s+p[0-9](?!\s*\|)/);
      expect(help.stdout).not.toMatch(/--urg\s+(1[dwmqy]|none)(?!\s*\|)\b/);
    });

    then('[t7b] and it still prints the WHOLE ladder, as a menu', () => {
      expect(help.stdout).toMatch(/--sev\s+p0 \| p1 \| p2 \| p3 \| p5/);
    });

    // 🔴 the help must teach the LADDER, not merely the shape. a human told
    //    only "'<n>h' or '<n>d'" types 4h, is refused, and has no way to
    //    learn from the doc why — which is the very defect the ladder error
    //    fixes, reintroduced one layer up
    then('[t7c] it prints the work ladder, in both units', () => {
      expect(help.stdout).toContain('1h 2h 3h 5h 8h 13h');
      expect(help.stdout).toContain('1d 2d 3d 5d 8d 13d');
      expect(help.stdout).toContain('1d = 8h');
    });

    then('[t7d] it offers no off-rung estimate as an example', () => {
      expect(help.stdout).not.toMatch(
        /--(cost|gain)-time\s+'?\d*[4679]\d*[hd]/,
      );
    });

    // the two knobs that replaced the silent per-write bump
    then('[t7e] it teaches that an edit is NOT an ask', () => {
      expect(help.stdout).toContain('--ask ');
      expect(help.stdout).toContain('--asks <n>');
      expect(help.stdout).toContain('an EDIT is not a reach');
    });

    then(
      '[t8] it says out loud that the opines are the human to author',
      () => {
        expect(help.stdout).toContain('only a human may');
      },
    );

    // 🔴 the urg ladder's SHARP end is where precision is real — "drop it all
    //    right now" is a distinction a human can defend, and the ladder could
    //    not express it: 1d was the tightest rung, so a HOTFIX and a day's
    //    work read identically. measured 2026-09-20: a human graded a live
    //    prod crash loop `1h` and the store refused the word.
    then('[t8e] it teaches the 1h rung, and that 1h means hotfix', () => {
      expect(help.stdout).toMatch(/--urg\s+1h \| 1d \| 3d \| 1w \| 1m/);
      expect(help.stdout).toContain('🔥');
      expect(help.stdout).toContain('hotfix');
    });

    // 🔴 SPONSORSHIP is the one flag family that TOPS the rank, and it was
    //    absent from --help for its whole life while it parsed fine. measured
    //    2026-09-20: a supervisor read --help, found no sponsor flag, and had
    //    to grep ecowork.sh to learn the verb exists at all — which is exactly
    //    what rule.require.discoverability grades a blocker ("reachable only
    //    from memory or source"). the flag that outranks every quant is the
    //    worst one to leave undiscoverable.
    then('[t8b] it teaches the sponsor flags on set, and their refusal', () => {
      expect(help.stdout).toContain('--sponsor ');
      expect(help.stdout).toContain('--unsponsor');
      expect(help.stdout).toContain('--sponsor-who');
      expect(help.stdout).toContain('--sponsor-why');
      expect(help.stdout).toContain('--sponsor-until');
    });

    // ⚠️ the VERB and the NOUN are one letter apart and mean opposite acts —
    //    `--sponsor` WRITES, `--sponsored` FILTERS. a help that names one and
    //    not the other teaches a human to reach for the wrong verb.
    then(
      '[t8c] it teaches the sponsored filter on get, beside the verb',
      () => {
        expect(help.stdout).toContain('--sponsored');
        expect(help.stdout).toContain('--unsponsored');
      },
    );

    // 🔴 a sponsorship nobody signed cannot be questioned, renewed, or
    //    revoked — which is why the refusal exists. the help must name it, or
    //    a caller meets it as an error rather than as a contract
    then(
      '[t8d] it teaches WHY who/why are mandatory, and that until is open-ended',
      () => {
        expect(help.stdout).toContain('cannot be questioned');
        expect(help.stdout).toContain('OPEN-ENDED');
      },
    );

    // 🔴 the two kinds differ by three letters and mean opposite quests, so
    //    the help must name BOTH, and name what each one IS. a reader who
    //    learns only `bigrock://` files every sidequest as a mainquest
    //
    // ⚠️ it asserted `toContain('--goal')` until 2026-09-21, and that
    //    assertion would STILL PASS — the help names `--goal` to say it does
    //    not exist. a string match cannot tell a flag that is taught from one
    //    that is refused, so the check survived its own subject's retirement
    //    and stayed green over a claim that had become false
    then('[t9] it teaches BOTH kinds, and what each quest is', () => {
      expect(help.stdout).toContain('bigrock://');
      expect(help.stdout).toContain('altrock://');
      expect(help.stdout).toContain('MAINQUEST');
      expect(help.stdout).toContain('SIDEQUEST');
    });

    then('[t9b] it teaches that a bare slug is refused, and why', () => {
      expect(help.stdout).toContain('a BARE slug is refused');
      expect(help.stdout).toContain('records no KIND');
    });

    then('[t9c] it teaches that the kind is a lens, never a sort key', () => {
      expect(help.stdout).toContain('a LENS, never a sort key');
    });

    then('[t10] it teaches that --why must name a matrix cell', () => {
      expect(help.stdout).toContain('cost-gain matrix');
      expect(help.stdout).toContain('ONE ROW OF THREE');
    });

    // a flag the store enforces and the help never names is a flag a human
    // finds by a refusal — and `--kind` is a judgment nobody can guess
    then('[t11] it teaches --kind, and both words of the closed set', () => {
      expect(help.stdout).toContain('--kind');
      expect(help.stdout).toContain('solve');
      expect(help.stdout).toContain('clamp');
    });

    // 🔴 the discriminator is the whole teaching. without it a reader
    //    grades the SIZE of the effect — "it reduces the cost a lot" —
    //    and files a partial repair as a clamp, which the rollup then
    //    sums into a cost.clamp that was never a clamp
    then(
      '[t11b] it teaches which TERM each kind moves, not just the words',
      () => {
        expect(help.stdout).toContain('rate');
        expect(help.stdout).toContain('window');
      },
    );

    // the reason the column is STORED rather than a note in --why
    then('[t11c] it names the failure the kind exists to prevent', () => {
      expect(help.stdout).toContain('CLAMPED problem reads as a CLOSED one');
    });

    // 🔴 the clamp on a flag that shipped UNDOCUMENTED for its whole life.
    //    `--surgoal` (called `--serves` until 2026-09-14) appeared in no
    //    usage block and in no `--help`, so the ONE capability that makes
    //    this model a DAG rather than a tree was reachable only by a reader
    //    of the source. every other flag is at worst mis-taught; this one
    //    was unfindable, so a human could not learn it existed to ask for it
    //
    // ⚠️ the second assertion is the load-bearing half. a usage-block line
    //    proves the flag is NAMED; it does not prove a reader learns WHAT it
    //    does — and an extra-surgoal edge is the one relation a path cannot
    //    express, so a name with no explanation teaches naught actionable
    then('[t12] it teaches --surgoal, and what a second surgoal IS', () => {
      expect(help.stdout).toContain('--surgoal');
      expect(help.stdout).toContain('N birds, one stone');
    });

    // 🔴 the flag is keyed on the GOAL, never on the slug — a fact a reader
    //    who guesses wrong learns only from a refusal, which is the exact
    //    shape `--kind` was already clamped against at [t11]
    then('[t12b] it teaches that the edge runs goal → goal', () => {
      expect(help.stdout).toContain('goal → goal');
    });

    // 🔴 the canonical term is `surgoal`, and a cli is the contract surface
    //    rule.forbid.domain-term-synonyms grades "above all". the verb form
    //    may appear in PROSE (the rename record names it on purpose), so the
    //    clamp targets the FLAG, never the word
    then('[t12c] it offers no `--serves` synonym in the contract', () => {
      expect(help.stdout).not.toMatch(/--serves\b(?!`)/);
    });
  });

  // 🔴 [case17] a work estimate off the fibonacci ladder
  //
  //    `--cost-time` once took any `<n>h|<n>d`, decimals included. that is
  //    the one field that invites false precision hardest: nobody can tell
  //    4h from 5h before they start, and the answer then rides into
  //    `cashPerHour`, where it reads as a measurement.
  given('[case17] a work estimate off the ladder', () => {
    const db = genDbPath({ slug: 'eco-time-ladder' });

    const run = (input: { verb: 'set' | 'get'; payload: object }) =>
      spawnSync('node', [PATH_ECOWORK_DB, input.verb, db], {
        input: JSON.stringify(input.payload),
        encoding: 'utf8',
        timeout: 30_000,
      });

    const base = { sev: 'p1', urg: '1w', what: 'x' };

    then(
      '[t0] 4h is refused, and the error names the LADDER, not the shape',
      () => {
        const got = run({
          verb: 'set',
          payload: { ...base, slug: 'bigrock://a', costTime: '4h' },
        });
        expect(got.status).toEqual(2);
        // the discriminator: a shape-only error would send the human back to
        // re-type `4h`, since `4h` IS the shape the old error asked for
        expect(got.stderr).toContain('off the ladder');
        expect(got.stderr).toContain('fibonacci');
        expect(got.stderr).toContain('3h');
        expect(got.stderr).toContain('13d');
      },
    );

    then('[t1] a decimal is refused — 2.5h is a precision nobody holds', () => {
      const got = run({
        verb: 'set',
        payload: { ...base, slug: 'bigrock://b', costTime: '2.5h' },
      });
      expect(got.status).toEqual(2);
    });

    then('[t2] --gain-time is held to the same ladder', () => {
      const got = run({
        verb: 'set',
        payload: { ...base, slug: 'bigrock://c', gainTime: '7d' },
      });
      expect(got.status).toEqual(2);
      expect(got.stderr).toContain('off the ladder');
    });

    then('[t3] a rung is accepted, in either unit', () => {
      expect(
        run({
          verb: 'set',
          payload: { ...base, slug: 'bigrock://d', costTime: '3h' },
        }).status,
      ).toEqual(0);
      expect(
        run({
          verb: 'set',
          payload: { ...base, slug: 'bigrock://e', costTime: '5d' },
        }).status,
      ).toEqual(0);
    });

    // ⚠️ the one overlap the ladder carries, clamped so nobody "fixes" it:
    //    8h and 1d are the same duration, both accepted, neither rewritten
    then('[t4] 8h and 1d are both rungs, and both compute to 8 hours', () => {
      const asHours = (slug: string, costTime: string) =>
        JSON.parse(
          run({ verb: 'set', payload: { ...base, slug, costTime } }).stdout,
        ).priority.quant.cost.hours;
      expect(asHours('bigrock://f', '8h')).toEqual(8);
      expect(asHours('bigrock://g', '1d')).toEqual(8);
    });
  });

  /**
   * .what = an unknown flag is REFUSED, never dropped
   *
   * 🔴 .why = a dropped flag does not fail — it WIDENS. and a wider answer
   *         holds the rows the caller wanted, so it reads like an answer.
   *
   *           get --slg dispute-or-concede  -> the filter vanished and the
   *                                            store returned `count: 29`,
   *                                            exit 0, as a successful get
   *           get --db /elsewhere/other.db  -> read THIS store, and headed
   *                                            its report with the path it
   *                                            had NOT been pointed at
   *
   *         ⚠️ measured 2026-09-14, and the cost was not hypothetical: this
   *         defeated a BY-HAND verification of the plaintext restore. the
   *         check reported the store rebuilt from committed text; it had
   *         read the live db and built no store at all.
   *
   *         ⇒ that is the sharp edge, and it is why this case sits beside
   *           the mirror clamps rather than in an ergonomics file. the whole
   *           invariant rests on "the csv can rebuild the db", and the one
   *           instrument a human has to check that by hand was answering
   *           about a different store. 🔴 a clamp on the MIRROR cannot catch
   *           a READER that misreports its own subject
   */
  given('[case44] a flag the tool does not take', () => {
    const db = genDbPath({ slug: 'eco-unknown-flag' });

    /** .what = run `eco.priority …` through bash, against a private db */
    const shell = (args: string) =>
      spawnSync('bash', ['-c', `source '${PATH_ECOWORK_SH}'\n${args}`], {
        encoding: 'utf8',
        env: { ...process.env, ECOWORK_DB: db },
        timeout: 30_000,
      });

    const scene = useBeforeAll(async () => {
      shell(
        `eco.priority set --slug 'bigrock://only-row' --sev p1 --urg 1w --what 'the one row'`,
      );
      return {
        // a TYPO of --slug. the old parser dropped it and answered with the
        // whole store; the refusal must land before any query runs
        typo: shell(`eco.priority get --slg 'bigrock://only-row'`),
        // a BARE value, which is what a broken quote leaves behind
        bare: shell(`eco.priority get 'bigrock://only-row'`),
        // and the control — the real flag must still filter
        good: shell(`eco.priority get --slug 'bigrock://only-row'`),
      };
    });

    then('[t0] a typo is refused rather than dropped', () => {
      expect(scene.typo.status).toEqual(2);
      expect(`${scene.typo.stdout}${scene.typo.stderr}`).toContain(
        "'--slg' is not a flag",
      );
    });

    // 🔴 the harm is the WIDENING, so the clamp must prove no rows came back.
    //    a refusal that still printed the store would be the same defect with
    //    a warn stapled on
    then('[t1] and it answers with no rows at all', () => {
      expect(`${scene.typo.stdout}${scene.typo.stderr}`).not.toContain(
        'the one row',
      );
    });

    // the error must name the fix, never merely the symptom
    then('[t2] the refusal points at the full flag set', () => {
      expect(`${scene.typo.stdout}${scene.typo.stderr}`).toContain('--help');
    });

    // a bare value is the other shape a broken invocation takes, and it
    // earns its own sentence — "not a flag" would misname it
    then('[t3] a bare value is refused, and named as such', () => {
      expect(scene.bare.status).toEqual(2);
      expect(`${scene.bare.stdout}${scene.bare.stderr}`).toContain(
        'unexpected argument',
      );
    });

    // ⚠️ the control. a refusal that also broke the real flags would pass
    //    every line above and make the tool useless
    then('[t4] and a real flag still works', () => {
      expect(scene.good.status).toEqual(0);
      expect(`${scene.good.stdout}`).toContain('bigrock://only-row');
    });
  });

  /**
   * 🔴 [case57] — the TWENTY-FIRST axis: THE INTAKE
   *
   * every axis above grades a fact the db ALREADY HOLDS — the dump, the heal,
   * the atomicity, the ignore rules, the index, the commit path, the doors.
   * not one asks the question one link further UPSTREAM:
   *
   *   🔴 did the fact the caller STATED ever reach the db at all?
   *
   * the shell parses a flag into a local, then names that local BY HAND in a
   * jq payload. two lists, written two hundred lines apart, whose
   * correspondence is held by memory alone:
   *
   *     --gain-cash)  GAIN_CASH="${2:-}"      the parser
   *     --arg gainCash "$GAIN_CASH"           the builder
   *
   * ⚠️ add an arm to the first and omit the second, and the flag is ACCEPTED:
   *    the verb exits 0, the receipt prints, and the value lands in no column.
   *    jq raises naught, because a local nobody references is not an error —
   *    it is merely unread.
   *
   * 🔴 and not one prior clamp can see it:
   *
   *     [case44]  grades a flag the tool does NOT take. this one it DOES
   *     [case38]  grades the dump against the SCHEMA — and the schema is
   *               whole; it is the WRITE that was short
   *     [case40]  grades that every write verb dumps. this verb did dump
   *
   *   every dump axis stays green by construction, because each grades a db
   *   that never held the fact. ⇒ this is the one axis where the store is
   *   COMPLETE and the RECORD is short — and a human who typed a figure has
   *   no way at all to learn it was dropped.
   *
   * ⚠️ MEASURED 2026-09-14: all 22 row flags that take a value round-trip, and
   *    exactly one parser local (`OUTPUT`, a render switch) reaches no payload.
   *    so this is a TRIPWIRE on the edit that opens the gap — and unlike
   *    `[case55][t1]` it is not vacuous: both halves assert a live property.
   *
   * ⇒ the subject set is DERIVED from the parser's own `case` arms, never
   *   named, so a flag added tomorrow is graded the day it lands
   *   (term=partial-audit).
   */
  given(
    '[case57] every flag the parser takes, traced to the store it claims to reach',
    () => {
      const scene = useBeforeAll(async () => {
        const source = readFileSync(PATH_ECOWORK_SH, 'utf8');

        // ── derive the parser's own arms, flag -> local ────────────────────────
        // three shapes, and the shape is what says whether a flag takes a VALUE:
        //   --slug)     SLUG="${2:-}"        a scalar        value
        //   --ref-task) REF_TASK+=("${2:-}") an accumulator  value
        //   --ask)      ASK="true"           a literal       none
        // .note = every group is mandatory, so a match carries all four. the
        //         defaults state that at the type level — an empty one is
        //         unreachable, and would read as "no flag, takes no value"
        const arms = [
          ...source.matchAll(/^\s*(--[a-z.-]+)\)\s+([A-Z_]+)(\+?=)(\S+)/gm),
        ].map(([, flag = '', local = '', , first = '']) => ({
          flag,
          local,
          takesValue: first.includes('${2:-}'),
        }));

        // ── derive where a local may reach the store ──────────────────────────
        // 🔴 a local reaches the db by exactly ONE route: a jq `--arg` or
        //    `--argjson` on a payload build. so the harvest is every line that
        //    carries one, and the question per local is whether it appears there
        const argLines = source
          .split('\n')
          .filter((line) => /--arg(json)?\s/.test(line))
          .join('\n');

        const stranded = arms
          .map((arm) => arm.local)
          .filter((local, index, all) => all.indexOf(local) === index)
          .filter((local) => !new RegExp(`\\$\\{?${local}\\b`).test(argLines));

        return { arms, argLines, stranded };
      });

      // ⚠️ the derivation guards ITSELF. a regex that matched no arm would make
      //    [t1] hold over an empty set and report a clean bill — the same trap
      //    [case52][t0], [case53][t0], and [case56][t0] each close for their own
      then(
        '[t0] the derivation reaches the real parser and the real builders',
        () => {
          expect(scene.arms.length).toBeGreaterThanOrEqual(20);
          expect(scene.argLines.length).toBeGreaterThan(0);

          const shape = (flag: string) =>
            scene.arms.find((arm) => arm.flag === flag);
          expect(shape('--slug')).toEqual({
            flag: '--slug',
            local: 'SLUG',
            takesValue: true,
          });
          expect(shape('--ref-task')?.takesValue).toEqual(true); // the accumulator shape
          expect(shape('--ask')?.takesValue).toEqual(false); // the literal shape
          expect(shape('--surgoal')?.local).toEqual('SURGOAL');
        },
      );

      // 🔴 THE TRIPWIRE. a local the parser fills and no builder reads is a flag
      //    the caller may type, that the store will never hold
      then(
        '[t1] every local the parser fills reaches a payload, but the render switch',
        () => {
          if (scene.stranded.join(',') !== 'OUTPUT')
            throw new Error(
              `[case57] a flag is parsed and never sent to the store.\n` +
                `  stranded: ${scene.stranded.join(', ') || '(none — and OUTPUT is owed)'}\n` +
                `  expected: OUTPUT alone — it picks a RENDER, so it describes no row\n` +
                `  ⇒ the parser fills this local and no jq \`--arg\` reads it, so the\n` +
                `    flag is ACCEPTED, the verb exits 0, the receipt prints, and the\n` +
                `    value is in no column. jq raises naught: an unread local is not\n` +
                `    an error. no dump axis sees it either — each grades a db that\n` +
                `    never held the fact.\n` +
                `  fix:  add \`--arg <field> "$${scene.stranded[0] ?? 'YOUR_LOCAL'}"\` to the payload\n` +
                `        build, and the field to the object beneath it. if the flag\n` +
                `        truly describes no row, it belongs beside OUTPUT — say so\n` +
                `        here, with the reason`,
            );
        },
      );

      // and the BEHAVIORAL half — a flag can reach the payload and still be
      // dropped below it, by a db layer that writes no column for the field.
      // ⚠️ the table is graded against the DERIVED flag set, so a new flag makes
      //    this red too rather than merely un-probed
      then(
        '[t2] and every row flag that takes a value round-trips, stated to stored',
        () => {
          const db = genDbPath({ slug: 'eco-intake' });
          const shell = (args: string) =>
            spawnSync('bash', ['-c', `source '${PATH_ECOWORK_SH}'\n${args}`], {
              encoding: 'utf8',
              env: { ...process.env, ECOWORK_DB: db },
              timeout: 30_000,
            });

          // ⚠️ the peer rows take the goal uri AS their slug — the two are one
          //   name now (assertSlugIsGoal), and the shell refuses `--goal` outright
          const ROOT = 'altrock://intake';
          const OTHER = 'altrock://intake-other';
          const GATER = 'subrock://intake/gater';
          const GATEE = 'subrock://intake/gatee';
          const PROBE = 'subrock://intake/probe';

          // the FK and the DAG each demand a peer row before the probe can name it
          for (const slug of [ROOT, OTHER, GATER, GATEE])
            expect(
              shell(
                `eco.priority set --slug '${slug}' --sev p3 --urg 1m --what 'a peer row'`,
              ).status,
            ).toEqual(0);

          const stated: [string, string][] = [
            ['--slug', PROBE],
            ['--kind', 'solve'],
            ['--sev', 'p3'],
            ['--urg', '1m'],
            ['--what', 'the outcome words'],
            ['--why', 'rank cell: time'],
            ['--gain-cash', 'USD 111.00'],
            ['--gain-per', '1mo'],
            ['--gain-for', '3mo'],
            ['--gain-time', '13h'],
            ['--cost-cash', 'USD 222.00'],
            ['--cost-per', '1y'],
            ['--cost-for', '5y'],
            ['--cost-time', '21h'],
            ['--asks', '7'],
            ['--ref-task', 'o/r#1'],
            // ⚠️ the tree BORROWS the slug's leaf (assertTreeGrain), so it is
            //    `probe` and never a coined name — a coined one is refused
            ['--ref-tree', 'probe'],
            ['--status', 'enqueued'],
            ['--gates', GATEE],
            ['--gated-by', GATER],
            ['--surgoal', OTHER],
            // 🔴 the sponsorship EPISODE's four fields. `--sponsor` opens one and
            //   refuses without who and why, "because a sponsorship nobody signed
            //   cannot be questioned, renewed, or revoked" (ecowork.sh) — so the
            //   boolean rides on the command below rather than in this table,
            //   which holds only the flags that TAKE a value
            ['--sponsor-who', 'the sponsor name'],
            ['--sponsor-why', 'the sponsor reason'],
            ['--sponsor-since', '2026-09-01T00:00:00.000Z'],
            ['--sponsor-until', '2027-01-01T00:00:00.000Z'],
          ];

          // 🔴 the COVERAGE check — the probe table is graded against the parser,
          //    so a flag added tomorrow is probed tomorrow. `--from` and `--to`
          //    belong to goal.mv, which carries a payload of another shape;
          //    `--output` picks a render. all three describe no row
          //    ⚠️ `--goal` is excluded because the surface REFUSES it: a priority
          //      IS a goal and `--slug` is its uri, so the flag reaches no column
          //      by construction rather than by omission (assertSlugIsGoal)
          const owed = scene.arms
            .filter((arm) => arm.takesValue)
            .map((arm) => arm.flag)
            .filter(
              (flag) =>
                !['--from', '--to', '--output', '--goal'].includes(flag),
            )
            .filter((flag) => !stated.some(([probed]) => probed === flag));
          if (owed.length)
            throw new Error(
              `[case57] a row flag that takes a value is never probed: ${owed.join(', ')}\n` +
                `  ⇒ [t1] proves it reaches the PAYLOAD; only a round-trip proves it\n` +
                `    reaches a COLUMN. add it to \`stated\` with a distinctive value`,
            );

          const set = shell(
            `eco.priority set ${stated.map(([flag, value]) => `${flag} '${value}'`).join(' ')} --sponsor`,
          );
          expect(set.status).toEqual(0);

          const read = shell(
            `eco.priority get --slug '${PROBE}' --output json`,
          );
          expect(read.status).toEqual(0);

          // 🔴 the haystack is the RENDER **and** the MIRROR, and the mirror is
          //   the half that actually settles this claim.
          //
          //   the case asks "stated to STORED", and a render is a proxy for the
          //   store rather than the store itself. the two part company: measured
          //   2026-09-16, `--sponsor-who`, `--sponsor-why`, and `--sponsor-since`
          //   all land in `goal_sponsorship.csv` and appear in NO read surface —
          //   not the json, not the treestruct. graded on the render alone this
          //   would report three dropped columns that are not dropped at all.
          //
          //   ⇒ so the mirror is read directly. the store IS the text
          //     (define.invariant.eco.the-csv-is-truth-the-db-is-a-cache), so a
          //     value present there is a value stored, by definition
          //
          // ⚠️ the render gap is REAL and is not forgiven here — it is caught as
          //    `.dream/v2026_09_16.fix.a-sponsorship-nobody-can-read.md`. a who
          //    and a why exist so the call "can be questioned, renewed, or
          //    revoked", and a fact with no read surface can be none of the three
          const mirrored = readdirSync(dirname(db))
            .filter((f) => f.endsWith('.csv'))
            .map((f) => readFileSync(join(dirname(db), f), 'utf8'))
            .join('\n');

          const dropped = stated.filter(
            ([, value]) =>
              !read.stdout.includes(value) && !mirrored.includes(value),
          );
          if (dropped.length)
            throw new Error(
              `[case57] a flag reached the payload and the store kept no trace of it.\n` +
                `  dropped: ${dropped.map(([flag, value]) => `${flag} '${value}'`).join(', ')}\n` +
                `  read:    ${read.stdout.trim().slice(0, 400)}\n` +
                `  ⇒ the caller typed it, the verb exited 0, and NEITHER the render\n` +
                `    nor the mirror holds it. the plaintext store is COMPLETE against\n` +
                `    that db — which is why every dump axis stays green while this\n` +
                `    one is red`,
            );
        },
      );
    },
  );

  /**
   * .what = the readme may not teach a flag the surface REFUSES
   *
   * .why  = measured 2026-09-18, in a live babysit tick. a supervisor copied the
   *         readme's own `get` example verbatim and the shell exited 2:
   *
   *           ✋ eco.priority: --goal does not exist. a priority IS a goal,
   *              and --slug is its uri.
   *
   *         the refusal is CORRECT — `--goal` was retired because a priority row
   *         IS a goal, so a second name for it drifted on 44 of 44 rows. what is
   *         wrong is that `readme.md` still teaches the retired flag, on three
   *         command lines and one prose claim.
   *
   *         ⇒ a documented defect is worse than an absent doc: it carries the
   *         authority of pavement and leads the reader into an exit 2
   *         (philosophy.pavement-saves-nature — the `.dream/.readme.md` case).
   *
   * .why it drifted = not one clamp in this suite read the readme. the flag was
   *         retired in the SHELL and clamped in the shell — [case57] even
   *         excludes `--goal` from its probe table BY NAME — so every tooth
   *         pointed at the surface and none at the doc that teaches it.
   *
   * ⚠️ .the shape is a CLASS, never the one flag. `--goal` is the instance that
   *         was met; the boundary is "every flag the readme teaches". so the
   *         accepted and refused sets are DERIVED from ecowork.sh, and a future
   *         retirement is caught with no edit here
   *         (rule.require.clamp-edge-cases — clamp the boundary, not the value).
   */
  given(
    '[case60] the readme teaches flags the surface must actually accept',
    () => {
      const PATH_README = join(__dirname, '..', '..', 'readme.md');

      /**
       * .what = split ecowork.sh's flag arms into ACCEPTED and REFUSED
       * .why  = an arm whose body returns 2 is a refusal, never a parse. that
       *         discriminator is the whole cure — it reads the BODY rather than
       *         the flag name, so it holds for the next retired flag too
       */
      const genArmSets = (): { accepted: string[]; refused: string[] } => {
        const source = readFileSync(PATH_ECOWORK_SH, 'utf8');
        const accepted: string[] = [];
        const refused: string[] = [];
        // both groups are mandatory, so a match carries both — the defaults
        // state that at the type level rather than admit a new case
        for (const [, flag = '', body = ''] of source.matchAll(
          /^\s*(--[a-z.-]+)\)([\s\S]*?);;/gm,
        )) {
          if (/return 2/.test(body)) refused.push(flag);
          else accepted.push(flag);
        }
        return { accepted, refused };
      };

      /** .what = every --flag the readme teaches inside an eco.priority shell block */
      const genFlagsTaught = (): string[] => {
        const source = readFileSync(PATH_README, 'utf8');
        const blocks = [...source.matchAll(/```sh\n([\s\S]*?)```/g)].map(
          ([, body = '']) => body,
        );
        const taught = new Set<string>();
        for (const block of blocks) {
          if (!block.includes('eco.priority')) continue;
          for (const [flag] of block.matchAll(/--[a-z][a-z.-]*/g))
            taught.add(flag);
        }
        return [...taught];
      };

      when('[t0] the two sets are derived', () => {
        // 🔴 non-vacuity FIRST. a regex that matched naught would pass [t1] over
        //    the shipped defect, which is the exact toothless shape
        //    rule.require.clamp-edge-cases forbids
        then(
          'it finds a real parser, a real refusal, and a real lesson',
          () => {
            const { accepted, refused } = genArmSets();
            expect(accepted.length).toBeGreaterThan(10);
            expect(refused.length).toBeGreaterThan(0);
            expect(genFlagsTaught().length).toBeGreaterThan(3);
          },
        );
      });

      when('[t1] each taught flag is held against the surface', () => {
        then('not one of them is a flag the surface refuses', () => {
          const { refused } = genArmSets();
          expect(
            genFlagsTaught().filter((each) => refused.includes(each)),
          ).toEqual([]);
        });

        // ⚠️ the mirror tooth: a cure that merely DELETED the example would pass
        //    the check above and teach the reader less than before
        then('and each one is a flag the surface parses', () => {
          const { accepted } = genArmSets();
          expect(
            genFlagsTaught().filter((each) => !accepted.includes(each)),
          ).toEqual([]);
        });
      });

      when('[t2] the shipped lines are read verbatim', () => {
        const readme = (): string => readFileSync(PATH_README, 'utf8');

        // 🔴 these are the four occurrences measured on 2026-09-18. they bite the
        //    DEFECT directly, so the class check above cannot go green on a
        //    derivation that silently stopped to match
        then('no command line passes the retired flag', () => {
          expect(readme()).not.toContain('--goal bigrock://sandpine.decost');
          expect(readme()).not.toContain('--goal altrock://dev-ergonomics');
        });

        then('and the prose claim names the flag that exists', () => {
          expect(readme()).not.toContain('get --goal <uri>');
          expect(readme()).toContain('get --slug <uri>');
        });
      });
    },
  );
});
