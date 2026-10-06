/**
 * .what = the regression proof for `F1` — gain sums UP, never down, and an OWN
 *         figure OVERRIDES its children rather than adds to them.
 *
 * .why  = 🔴 these two are not ordinary families. `#389` REVERSED `#386` by
 *         name: gain had propagated DOWN and summed, so every part inherited
 *         its whole's figure and five parts of one whole totalled 5× the real
 *         gain. this route settled that reversal as fulcrum `F1`. **these
 *         families are the only proof the reversal holds.**
 *
 *         ⇒ a refactor that restores down-propagation would sum gain wrong for
 *         every consumer repo. that is a prioritization-correctness harm with a
 *         named victim, so the proof sits in its own file, named for the claim
 *         it holds, rather than as two families among the `ecowork.*` parts.
 *
 * .how  = the families read VERBATIM against the two runners they lean on
 *         (`eco`, `genDbPath`). no assertion is softened, added, or re-worded —
 *         a regression proof that changed would prove a different claim than
 *         the one `F1` settled.
 *
 * .note = found by peer `enroll-impl-arch-defects` at i004, which connected the
 *         suite's gate to `F1`'s proof — a link no prior round had drawn.
 */
import { execFileSync } from 'child_process';
import { join } from 'path';
import { given, then, useBeforeAll } from 'test-fns';

import { tempDirs } from '../../../.test/tempDirs';

const PATH_ECOWORK_DB = join(__dirname, 'ecowork.db.mjs');

/**
 * .what = run one verb against one db, and hand back the parsed result
 * .why  = the same runner `ecowork.harness.ts` exports, held here so the F1
 *         proof reads with no dependency beyond the module under test
 * .note = the verb union mirrors the module's own dispatcher, `ecowork.db.mjs`
 *         `const verbs = { set, get, del, 'goal.mv' }`. it is a cache of that
 *         set, so it drifts the moment a verb lands there and not here — read
 *         the dispatcher, never this line, for the authoritative set.
 */
const eco = (input: {
  db: string;
  verb: 'set' | 'get' | 'del' | 'goal.mv';
  payload: object;
}) =>
  JSON.parse(
    execFileSync('node', [PATH_ECOWORK_DB, input.verb, input.db], {
      input: JSON.stringify(input.payload),
      encoding: 'utf8',
      timeout: 30_000,
    }),
  );

/** .what = a db path nobody else holds, so no clamp can see another's rows */
const genDbPath = (input: { slug: string }) =>
  join(tempDirs.genOne({ slug: input.slug }), 'priority.db');

describe('ecowork.gain — the F1 regression proof', () => {
  afterAll(() => tempDirs.delAll());

  // 🔴 GAIN SUMS UP, NEVER DOWN — and an OWN figure OVERRIDES the children
  //
  //    a parent's own figure and its children's sum are two ESTIMATES of
  //    ONE quantity, never two quantities. the children ARE the parent's
  //    decomposition, so to add them counts the same dollar twice. the rule
  //    picks the direct measurement over the derived one
  given('[case36] a whole whose parts carry the figures', () => {
    const db = genDbPath({ slug: 'eco-gain-up' });

    // ⚠️ a slug IS its goal uri (rule.require.rock-goal-treestruct)
    const WHOLE = 'bigrock://decost';
    const PART_A = 'subrock://decost/alpha';
    const PART_B = 'subrock://decost/beta';

    const scene = useBeforeAll(async () => {
      const set = (payload: object) =>
        eco({ db, verb: 'set', payload: { sev: 'p2', urg: '1w', ...payload } });

      set({ slug: WHOLE, what: 'the whole, unpriced' });
      set({ slug: PART_A, what: 'part a', gainCash: 'USD 300.00' });
      set({ slug: PART_B, what: 'part b', gainCash: 'USD 200.00' });

      const derived = eco({ db, verb: 'get', payload: { slug: WHOLE } })
        .priorities[0];
      const leaf = eco({ db, verb: 'get', payload: { slug: PART_A } })
        .priorities[0];

      // now the whole gains its OWN figure — and it must SUPERSEDE, not add
      set({ slug: WHOLE, gainCash: 'USD 1000.00' });
      const owned = eco({ db, verb: 'get', payload: { slug: WHOLE } })
        .priorities[0];

      return { derived, leaf, owned };
    });

    // 🔴 the UP half. an unpriced whole is worth what its parts deliver
    then('[t0] an unpriced whole sums its parts', () => {
      expect(scene.derived.gainRolled.cashTotal).toEqual('USD 500.00');
    });

    // a derived figure rendered indistinguishably from a measured one is a
    // number no reader can audit — the flag is what parts the two
    then('[t1] and it is marked DERIVED, never stamped as measured', () => {
      expect(scene.derived.gainRolled.derived).toEqual(true);
      expect(scene.derived.quant.gain.cash).toEqual(null);
    });

    // 🔴 THE teeth of the OVERRIDE half. 1000 + 500 = 1500 is the defect
    //    this rule exists to refuse: the parts ARE the whole, counted twice
    then(
      '[t2] a priced whole IGNORES its parts — own overrides, never adds',
      () => {
        expect(scene.owned.gainRolled.cashTotal).toEqual('USD 1000.00');
        expect(scene.owned.gainRolled.cashTotal).not.toEqual('USD 1500.00');
        expect(scene.owned.gainRolled.derived).toEqual(false);
      },
    );

    // 🔴 the NEVER-DOWN half. under the prior invariant the parts inherited
    //    the whole's figure and every leaf read USD 1000 — so five parts of
    //    one whole totalled 5x the real gain, and no portfolio total could
    //    ever be taken. a leaf reports what IT delivers, and naught else
    then(
      '[t3] a part does NOT inherit its whole — gain never flows down',
      () => {
        expect(scene.leaf.gainRolled.cashTotal).toEqual('USD 300.00');
        expect(scene.leaf.gainRolled.derived).toEqual(false);
      },
    );

    // ⚠️ the payoff of the reversal, stated as a clamp: the figures are now
    //    ADDITIVE, so the root's number IS the portfolio number. under
    //    down-propagation this assertion was impossible to write
    then(
      '[t4] the parts sum to the derived whole — the figures are additive',
      () => {
        const parts = eco({ db, verb: 'get', payload: { slug: WHOLE } })
          .priorities.filter((row: { slug: string }) => row.slug !== WHOLE)
          .map(
            (row: { gainRolled: { cashTotal: string } }) =>
              row.gainRolled.cashTotal,
          );
        expect(parts.sort()).toEqual(['USD 200.00', 'USD 300.00']);
      },
    );
  });

  // ⚠️ a goal with two parents pushes its FULL figure to each. that is
  //    correct per-root — both roots genuinely advance when it lands — and
  //    it is why two roots' totals may not be added to one another
  given('[case37] a multi-parent part, summed up both its roots', () => {
    const db = genDbPath({ slug: 'eco-gain-dag' });

    // ⚠️ a slug IS its goal uri (rule.require.rock-goal-treestruct)
    const DECOST = 'bigrock://decost';
    const SPEED = 'bigrock://dev-speed';
    const SHARED = 'subrock://decost/acu-tune';

    const scene = useBeforeAll(async () => {
      const set = (payload: object) =>
        eco({ db, verb: 'set', payload: { sev: 'p2', urg: '1w', ...payload } });

      set({ slug: DECOST, what: 'root one, unpriced' });
      set({ slug: SPEED, what: 'root two, unpriced' });
      set({
        slug: SHARED,
        what: 'one stone, two birds',
        gainCash: 'USD 400.00',
      });
      set({ slug: SHARED, surgoal: [SPEED] });

      const get = (slug: string) =>
        eco({ db, verb: 'get', payload: { slug } }).priorities[0];
      return { decost: get(DECOST), speed: get(SPEED), shared: get(SHARED) };
    });

    then('[t0] the path root sums it', () => {
      expect(scene.decost.gainRolled.cashTotal).toEqual('USD 400.00');
      expect(scene.decost.gainRolled.derived).toEqual(true);
    });

    // 🔴 the served root sums it too, and this is what a path-only rollup
    //    could never see — the second root would report a gain of naught
    //    while real work advanced it
    then('[t1] and the SERVED root sums it too, across the edge', () => {
      expect(scene.speed.gainRolled.cashTotal).toEqual('USD 400.00');
      expect(scene.speed.gainRolled.derived).toEqual(true);
    });

    // ⚠️ and the shared goal's OWN figure is unchanged by how many roots it
    //    serves. gain flows UP, so what it serves does not raise its own
    //    number — the open fulcrum the invariant records
    then(
      '[t2] the shared goal itself still reports its own figure alone',
      () => {
        expect(scene.shared.gainRolled.cashTotal).toEqual('USD 400.00');
        expect(scene.shared.gainRolled.derived).toEqual(false);
      },
    );
  });
});
