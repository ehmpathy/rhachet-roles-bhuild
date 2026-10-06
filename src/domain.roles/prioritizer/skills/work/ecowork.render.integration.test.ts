/**
 * .what = clamps on what `get` renders — the empty nudge, the rootstruct, glyphs, kinds, pages
 *
 * .note = a PART of the `ecowork.db` suite, cut so one reviewer can hold
 *         it whole. the suite's shared fixtures, and its account of what it
 *         runs against and why, live in ecowork.harness.ts.
 */
import { spawnSync } from 'child_process';
import { given, then, useBeforeAll, useThen, when } from 'test-fns';

import { tempDirs } from '../../../.test/tempDirs';
import {
  eco,
  genDbPath,
  PATH_ECOWORK_DB,
  PATH_ECOWORK_SH,
} from './ecowork.harness';

afterAll(() => tempDirs.delAll());

describe('ecowork.db', () => {
  // 🔴 the empty store is the FIRST surface a new human ever reads, so a
  //    concrete sev there is the strongest suggestion the tool can make
  given(
    '[case9] an empty store, whose nudge is the first surface a human reads',
    () => {
      const db = genDbPath({ slug: 'eco-empty-nudge' });
      const nudge = useBeforeAll(async () =>
        spawnSync(
          'bash',
          ['-c', `source '${PATH_ECOWORK_SH}'\neco.priority get`],
          {
            encoding: 'utf8',
            env: { ...process.env, ECOWORK_DB: db },
            timeout: 30_000,
          },
        ),
      );

      then('[t0] it exits ok and says the rank is empty', () => {
        expect({ exit: nudge.status, stderr: nudge.stderr }).toEqual({
          exit: 0,
          stderr: '',
        });
        expect(nudge.stdout).toContain('the rank is empty');
      });

      then('[t1] the nudge suggests NO concrete sev or urg', () => {
        expect(nudge.stdout).not.toMatch(/--sev\s+p[0-9]/);
        expect(nudge.stdout).not.toMatch(/--urg\s+(1[dwmqy]|none)\b/);
      });

      then('[t2] it shows the whole ladder, so the pick is deliberate', () => {
        expect(nudge.stdout).toContain('p0|p1|p2|p3|p5');
      });

      then(
        '[t3] it says out loud that the absent default is on purpose',
        () => {
          expect(nudge.stdout).toContain('on purpose');
        },
      );
    },
  );

  // 🔴 the rootstruct render groups rows by goal path — the decomposition
  //    view. a leaf with no own cash shows its nearest priced ANCESTOR's
  //    per-hour, marked `↑ … (whole)`, never as its own
  //    (define.invariant.eco.gain-propagates-down-and-sums: a propagated
  //    figure rendered indistinguishably from a measured one is a blocker).
  //
  //    the clamp has teeth on a real bug: the render once joined its fields
  //    on a TAB, and bash `read` treats tab as whitespace — so it collapsed
  //    a run of tabs and DROPPED an empty field. a leaf with an empty own
  //    per-hour then read its ancestor inherit value into the own column,
  //    rendered without the ↑ mark. the fix joins on US (\u001f), a
  //    non-whitespace separator that preserves every empty field in place.
  given(
    '[case12] the rootstruct view — decomposition rolled up by root',
    () => {
      const db = genDbPath({ slug: 'eco-rootstruct' });

      const shell = (args: string) =>
        spawnSync('bash', ['-c', `source '${PATH_ECOWORK_SH}'\n${args}`], {
          encoding: 'utf8',
          env: { ...process.env, ECOWORK_DB: db },
          timeout: 30_000,
        });

      const scene = useBeforeAll(async () => {
        // the trunk — the FK needs a parent before it takes a child, so a root
        // rock and each intermediate level land before the leaves below them
        shell(
          `eco.priority set --slug 'bigrock://acme' --sev p1 --urg 1m --what 'acme — the business'`,
        );
        shell(
          `eco.priority set --slug 'subrock://acme/ensell' --sev p1 --urg 1m --what 'acme revenue'`,
        );
        // a priced initiative, USD 100.00/mo for 1y over 5h = USD 240.00/h
        shell(
          `eco.priority set --slug 'subrock://acme/ensell/product' --sev p1 --urg 1d ` +
            `--what 'the product' --gain-cash 'USD 100.00' --gain-per 1mo --gain-for 1y --cost-time 5h`,
        );
        // a required piece with NO own cash — must inherit the whole, marked ↑
        shell(
          `eco.priority set --slug 'subrock://acme/ensell/product/alpha' --sev p1 --urg 1d ` +
            `--what 'piece a — required, no own cash'`,
        );
        // a required piece WITH own cash — USD 50.00/mo for 1y over 1h = USD 600.00/h
        shell(
          `eco.priority set --slug 'subrock://acme/ensell/product/beta' --sev p1 --urg 1d ` +
            `--what 'piece b — required, own cash' --gain-cash 'USD 50.00' --gain-per 1mo --gain-for 1y --cost-time 1h`,
        );
        // a second root, whose leaf has neither own cash nor a priced ancestor
        shell(
          `eco.priority set --slug 'altrock://tools' --sev p2 --urg 1m --what 'the tools'`,
        );
        shell(
          `eco.priority set --slug 'subrock://tools/entool' --sev p2 --urg 1m --what 'entool the work'`,
        );
        shell(
          `eco.priority set --slug 'subrock://tools/entool/helper' --sev p2 --urg 1w ` +
            `--what 'a tool piece, no cash anywhere above it'`,
        );
        return { render: shell('eco.priority get --output rootstruct') };
      });

      then('[t0] it renders, ok and clean', () => {
        expect({
          exit: scene.render.status,
          stderr: scene.render.stderr,
        }).toEqual({
          exit: 0,
          stderr: '',
        });
      });

      // 🔴 the teeth: a ❔ leaf under a priced parent shows the parent's
      //    per-hour MARKED `↑ … (whole)`. before the separator fix, the empty
      //    own-cash field collapsed and the inherit value rendered AS own
      //    (no ↑), so this exact string was absent
      then(
        '[t1] a required piece with no own cash inherits the whole, marked',
        () => {
          expect(scene.render.stdout).toContain('↑ USD 240.00/h (whole)');
        },
      );

      // a leaf with its OWN cash shows it plainly, never marked propagated
      then('[t2] a piece with own cash shows it as own, not propagated', () => {
        expect(scene.render.stdout).toContain('USD 600.00/h');
        expect(scene.render.stdout).not.toContain('↑ USD 600.00/h');
      });

      // a leaf with no own cash and no priced ancestor shows NO value — the
      // rootstruct omits the ❔ the flat view carries, and never invents an
      // inherited figure where no ancestor is priced
      then(
        '[t3] a piece with no priced ancestor shows no value — never ❔, never inherited',
        () => {
          expect(scene.render.stdout).toMatch(/helper —/);
          expect(scene.render.stdout).not.toMatch(/helper[^\n]*❔/);
          expect(scene.render.stdout).not.toMatch(/helper[^\n]*whole/);
          expect(scene.render.stdout).not.toMatch(/helper[^\n]*USD/);
        },
      );

      // 🔴 .this once clamped a two-emoji [phase][status] PAIR, and the pair was
      //    retired 2026-09-14 — clamp rewritten to follow it.
      //
      //    the render now leads each node with ONE lifecycle glyph, and the
      //    module states the measurement behind that: two glyphs over a tree
      //    thirty rows deep is a wall of emoji a reader scans past, so the axis
      //    that mattered was hidden by the one that did not. the READY/GATED
      //    split moved to where it is ASKED for rather than glanced at —
      //    `get --ready`, and the `state:` line of the flat view.
      //
      //    ⇒ so this grades the axis that survived: enqueued rows read one glyph,
      //      whatever gates them. the gated/ready distinction is clamped where it
      //      now lives, in [case22] and the flat render
      //
      // 🔴 .and the glyph that leads them moved again, 2026-09-18 — 💧 to 🪨
      //    the ladder no longer reads `treeless ⇒ 💧`. it reads a TREE SLUG, then
      //    a TASK, and a row with neither is a ROCK — an objective closed by
      //    fulfillment of its target rather than by a merge
      //    (define.eco.strategic-vs-tactical).
      //
      //    ⚠️ `product` and `helper` carry no refTree and no refTask, so they are
      //    rocks. under the old ladder they rendered 💧 and CLAIMED to be sprout
      //    candidates — a false claim a supervisor acts on, and the defect the
      //    ladder was rewritten to end
      then(
        '[t3b] every enqueued node with no tree and no task leads with 🪨',
        () => {
          expect(scene.render.stdout).toMatch(/🪨 product/);
          expect(scene.render.stdout).toMatch(/🪨 helper/);
          // and the retired pair is gone, rather than quietly still emitted
          expect(scene.render.stdout).not.toMatch(/💧[🪵👋]/u);
          // 🔴 the teeth on the OTHER side — a rock must not advertise a sprout
          expect(scene.render.stdout).not.toMatch(/💧 product/);
        },
      );

      // the temp db path carries a random suffix, so it is swapped for a stable
      // token before the snapshot — else every run diffs on the `from:` line
      then('[t4] the whole render matches snapshot', () => {
        expect(scene.render.stdout.split(db).join('<db>')).toMatchSnapshot();
      });
    },
  );

  // 🔴 the ONE-glyph lifecycle mark — 💧 seeded · 🌲 sprouted · 🌾 inflight ·
  //    🌊 done · 💤 held (define.eco.priority-glyphs).
  //
  //    ⚠️ it was a two-slot [phase][status] PAIR until 2026-09-14, and the
  //    module records why the pair lost: two glyphs over a deep tree is a wall
  //    of emoji a reader scans past, and the phase axis carried exactly one
  //    fact status did not — a row enqueued that ALREADY HAS A TREE. so the
  //    phase folded INTO the single glyph rather than vanished, and 💧 vs 🌲
  //    is the half that outlived the fold. measured: 22 rows carry a tree ref
  //    and 16 of them are enqueued, so a status-only glyph loses the majority.
  //
  //    ⇒ this walks every value the one slot can take, so a render that
  //      collapses two of them back together is caught
  given(
    '[case12b] the one-glyph lifecycle mark across the whole lifecycle',
    () => {
      const db = genDbPath({ slug: 'eco-mark-grammar' });

      const shell = (args: string) =>
        spawnSync('bash', ['-c', `source '${PATH_ECOWORK_SH}'\n${args}`], {
          encoding: 'utf8',
          env: { ...process.env, ECOWORK_DB: db },
          timeout: 30_000,
        });

      const scene = useBeforeAll(async () => {
        // the root, then one child per lifecycle state the mark must render
        shell(
          `eco.priority set --slug 'bigrock://root' --sev p1 --urg 1m --what 'the root'`,
        );
        // 💧 — a SEEDED row: a task queued, no tree sprouted yet
        shell(
          `eco.priority set --slug 'subrock://root/seed-ready' --sev p1 --urg 1d --what 'a ready seed' --ref-task 'org/repo#1'`,
        );
        // the gater, then a GATED seed — still a task, still 💧
        shell(
          `eco.priority set --slug 'subrock://root/gater' --sev p1 --urg 1d --what 'the gater' --ref-task 'org/repo#2'`,
        );
        shell(
          `eco.priority set --slug 'subrock://root/seed-gated' --sev p1 --urg 1d --what 'a gated seed' --ref-task 'org/repo#3' --gated-by 'subrock://root/gater'`,
        );
        // ⚠️ a row that carries a tree must name that tree as its slug LEAF —
        //   the rule [case58] clamps. a leaf that differs is REFUSED outright,
        //   so a fixture that ignored it would write no row and render naught
        // 🌾 — a tree ref plus inflight: a clone is at work on it now
        shell(
          `eco.priority set --slug 'subrock://root/repo.beav.underway' --sev p1 --urg 1d --what 'underway' --ref-tree 'repo.beav.underway' --status inflight`,
        );
        // 🌊 — a tree ref plus done: it landed
        shell(
          `eco.priority set --slug 'subrock://root/repo.beav.done' --sev p1 --urg 1d --what 'landed' --ref-tree 'repo.beav.done' --status done`,
        );
        // 💤 — parked on purpose
        shell(
          `eco.priority set --slug 'subrock://root/repo.beav.parked' --sev p1 --urg 1d --what 'parked' --ref-tree 'repo.beav.parked' --status held`,
        );
        // 🪨 — the DECOMPOSITION axis: no tree, no task. an objective, not a
        //   deliverable, and the one rung the old ladder could not express
        shell(
          `eco.priority set --slug 'subrock://root/rock-row' --sev p1 --urg 1d --what 'an objective'`,
        );
        return { render: shell('eco.priority get --output rootstruct') };
      });

      then('[t0] it renders, ok and clean', () => {
        expect({
          exit: scene.render.status,
          stderr: scene.render.stderr,
        }).toEqual({
          exit: 0,
          stderr: '',
        });
      });

      // 🔴 a ready row and a GATED row read the same 💧, on purpose. the
      //    ready/gated split did not vanish — it moved to where a human ASKS for
      //    it (`get --ready`, and the flat view's `state:` line) rather than
      //    glances at it. so these two clamps are a PAIR: each alone would pass
      //    a render that dropped the other
      //
      // ⚠️ and both rows now carry a refTask, because the ladder keys on a REF
      //    rather than on the absence of one. verbatim, 2026-09-18: *"refTask
      //    keeps 💧"* — a seeded row is dispatch-ready, and to render it 🪨 would
      //    hide every sprout candidate in the store
      then('[t1] a ready, seeded, treeless row leads with 💧', () => {
        expect(scene.render.stdout).toMatch(/💧 seed-ready/);
      });

      then(
        '[t2] a GATED seed leads with the same 💧 — the split moved, not the glyph',
        () => {
          expect(scene.render.stdout).toMatch(/💧 seed-gated/);
        },
      );

      then(
        '[t3] an inflight row with a tree leads with 🌾 — a clone is at work on it now',
        () => {
          expect(scene.render.stdout).toMatch(/🌾 repo.beav.underway/);
        },
      );

      // 🔴 the SECOND axis, and the rung the retired ladder had no glyph for.
      //    a row with no tree and no task is a ROCK — closed by fulfillment of
      //    its target, never by a merge (define.eco.strategic-vs-tactical)
      then(
        '[t3b] a row with no tree and no task leads with 🪨 — the decomposition axis',
        () => {
          expect(scene.render.stdout).toMatch(/🪨 rock-row/);
          // the teeth: it must not advertise a sprout it cannot offer
          expect(scene.render.stdout).not.toMatch(/💧 rock-row/);
        },
      );

      then('[t4] a done row leads with 🌊 — it landed', () => {
        expect(scene.render.stdout).toMatch(/🌊 repo.beav.done/);
      });

      then('[t5] a held row leads with 💤 — parked on purpose', () => {
        expect(scene.render.stdout).toMatch(/💤 repo.beav.parked/);
      });

      // 🔴 the one fact `status` alone cannot carry, and the whole reason the
      //    phase folded IN rather than dropped: an ENQUEUED row that already
      //    has a tree reads 🌲, never 💧. measured 2026-09-14 — that is 16 of
      //    the 22 rows with a tree ref, so a status-only glyph loses the
      //    majority case outright
      then('[t6] an enqueued row WITH a tree reads 🌲, never 💧', () => {
        // ⚠️ the tree BORROWS the slug's leaf, never a name of its own
        //    (assertTreeGrain) — a coined tree name is refused, and a refused
        //    set would leave this row 💧 and pass a clamp that proved naught
        shell(
          `eco.priority set --slug 'subrock://root/seed-ready' --ref-tree 'seed-ready'`,
        );
        const after = shell('eco.priority get --output rootstruct');
        expect(after.stdout).toMatch(/🌲 seed-ready/);
        expect(after.stdout).not.toMatch(/💧 seed-ready/);
      });

      then('[t6] the whole render matches snapshot', () => {
        expect(scene.render.stdout.split(db).join('<db>')).toMatchSnapshot();
      });
    },
  );

  // 🔴 .why the kind is clamped at all
  //    a clamp bounds a problem; a solve removes it. the store holds the
  //    word because a CLAMPED problem reads as a CLOSED one — the alert
  //    ships, the row goes done, the dashboard is green, and the waste
  //    bleeds at exactly the rate it did (define.eco.solve-vs-clamp).
  //    ⇒ so every claim below guards a state that looks healthy when broken
  given('[case28] the solve|clamp kind on a goal', () => {
    const db = genDbPath({ slug: 'eco-kind' });

    /** .what = the opine + prose a NEW row owes, so the kind is the only variable */
    const asNew = (payload: object) => ({ sev: 'p2', urg: '1w', ...payload });

    when('[t0] a goal is set with each declared kind', () => {
      const solve = useThen('the solve lands', () =>
        eco({
          db,
          verb: 'set',
          payload: asNew({
            slug: 'bigrock://audit',
            kind: 'solve',
            what: 'find what bleeds, stop it',
          }),
        }),
      );
      const clamp = useThen('the clamp lands', () =>
        eco({
          db,
          verb: 'set',
          payload: asNew({
            slug: 'bigrock://alert',
            kind: 'clamp',
            what: 'bound the horizon to a day',
          }),
        }),
      );

      then('each kind round-trips as stored', () => {
        expect([solve.priority.kind, clamp.priority.kind]).toEqual([
          'solve',
          'clamp',
        ]);
      });
    });

    // 🔴 the teeth: an undeclared kind must not land as a third value.
    //    a free-text kind column is a kind column that answers no query —
    //    "which problems are clamped and never solved" is the one question
    //    the dimension exists for, and a typo drops a row out of it silently
    when('[t1] an EXTANT goal is edited to an undeclared kind', () => {
      const rejection = useThen('the set is refused', () => {
        // the row is complete first, so the opine precondition cannot be
        // what refuses it — the kind is then the only thing left to fail on
        eco({
          db,
          verb: 'set',
          payload: asNew({
            slug: 'bigrock://mitigate',
            what: 'a goal that will be mis-kinded',
          }),
        });
        const attempt = spawnSync('node', [PATH_ECOWORK_DB, 'set', db], {
          input: JSON.stringify({
            slug: 'bigrock://mitigate',
            kind: 'mitigation',
          }),
          encoding: 'utf8',
          timeout: 30_000,
        });
        return { exit: attempt.status, stderr: attempt.stderr };
      });

      then('it exits non-zero', () => {
        expect(rejection.exit).not.toEqual(0);
      });

      // ⚠️ a refusal that only says "invalid" teaches naught, so the
      //    author guesses again. it must name the two words AND the test
      //    that tells them apart (rule.require.errors-name-the-fix)
      then('the refusal names both declared kinds', () => {
        expect(rejection.stderr).toContain('solve');
        expect(rejection.stderr).toContain('clamp');
      });

      then(
        'the refusal teaches the discriminator, not just the vocabulary',
        () => {
          expect(rejection.stderr).toContain('rate');
          expect(rejection.stderr).toContain('window');
        },
      );

      // a refusal that still WROTE would leave a row wearing an undeclared
      // kind — the exact state the closed set exists to make impossible
      then('the refusal rolls back, so no undeclared kind lands', () => {
        const held = eco({
          db,
          verb: 'get',
          payload: { slug: 'bigrock://mitigate' },
        });
        expect(held.priorities[0].kind).toEqual(null);
      });
    });

    // the partial-set guarantee, applied to the new column. a `set --why`
    // that silently drops the kind would un-clamp a clamped problem, and
    // the row would then read as an unqualified solve
    when('[t2] a later set omits the kind', () => {
      const after = useThen('the partial set lands', () => {
        eco({
          db,
          verb: 'set',
          payload: asNew({
            slug: 'bigrock://keeper',
            kind: 'clamp',
            what: 'a bound',
          }),
        });
        return eco({
          db,
          verb: 'set',
          payload: { slug: 'bigrock://keeper', why: 'cheap bound, real cost' },
        });
      });

      then('the prior kind is preserved', () => {
        expect(after.priority.kind).toEqual('clamp');
      });
    });

    // NULL is allowed on purpose: a goal aimed at no problem — a feature,
    // a chore — is neither a solve nor a clamp, and a forced third word
    // would be a lie the rollup then sums
    when('[t3] a goal is set with no kind at all', () => {
      const kindless = useThen('the set lands', () =>
        eco({
          db,
          verb: 'set',
          payload: asNew({ slug: 'bigrock://feature', what: 'ship a feature' }),
        }),
      );

      then('the kind reads null, never a default', () => {
        expect(kindless.priority.kind).toEqual(null);
      });
    });
  });

  // 🔴 .why a bare get is clamped at all
  //    `rhx eco.priority get` with no flags is THE surface a human reads —
  //    it is the rank, and the rank is what gets acted on. a cap or a
  //    hidden default filter does not error and does not warn: it returns
  //    a shorter list that reads COMPLETE. that is term=partial-audit at
  //    the one place it costs the most — the set a human chooses from
  given('[case31] a bare get over a store larger than any sane page', () => {
    const db = genDbPath({ slug: 'eco-bare-get' });

    const shell = (args: string) =>
      spawnSync('bash', ['-c', `source '${PATH_ECOWORK_SH}'\n${args}`], {
        encoding: 'utf8',
        env: { ...process.env, ECOWORK_DB: db },
        timeout: 60_000,
      });

    // 25 rows — more than a 10 or a 20 default would return, so an
    // off-the-shelf page size cannot hide inside a green clamp
    // 🔴 the slug IS the goal uri (assertSlugIsGoal), so even a generated
    //    fixture name takes the uri form — a bare `row-00` records no kind
    const SLUGS = Array.from(
      { length: 25 },
      (_, i) => `bigrock://row-${String(i).padStart(2, '0')}`,
    );

    const scene = useBeforeAll(async () => {
      for (const slug of SLUGS)
        eco({
          db,
          verb: 'set',
          payload: {
            slug,
            sev: 'p2',
            urg: '1w',
            what: `a priority named ${slug}`,
          },
        });
      // one row driven to a FINISHED state, so a default status filter
      // would show up as a missing row rather than as a passing clamp
      eco({
        db,
        verb: 'set',
        payload: { slug: 'bigrock://row-24', status: 'done' },
      });
      return {
        bare: eco({ db, verb: 'get', payload: {} }),
        render: shell('eco.priority get'),
      };
    });

    then('[t0] every row comes back, and the count agrees with the set', () => {
      expect(scene.bare.priorities.length).toEqual(SLUGS.length);
      expect(scene.bare.count).toEqual(SLUGS.length);
    });

    // 🔴 the teeth: a cap drops the TAIL, and the tail of a rank is where
    //    the rows a human has not looked at yet live. assert the last one
    //    by name — a length check alone passes a cap that pads
    then('[t1] the tail is present, not truncated to a page', () => {
      const held = scene.bare.priorities.map(
        (row: { slug: string }) => row.slug,
      );
      expect(held).toContain('bigrock://row-24');
      expect(held.sort()).toEqual([...SLUGS].sort());
    });

    // 🔴 the likeliest future regression, and it reads as a FEATURE: "a
    //    bare get should show open work". it would silently retire every
    //    finished row from the one view that is supposed to hold them all
    then(
      '[t2] no status filter is applied by default — a done row still returns',
      () => {
        const done = scene.bare.priorities.find(
          (row: { slug: string }) => row.slug === 'bigrock://row-24',
        );
        expect(done.status).toEqual('done');
      },
    );

    // the json contract and the human surface must agree. a render that
    // pages while the json does not is the same lie, one layer up
    then('[t3] the human surface renders every row too', () => {
      expect(scene.render.status).toEqual(0);
      const absent = SLUGS.filter(
        (slug) => !scene.render.stdout.includes(slug),
      );
      expect(absent).toEqual([]);
    });
  });
});
