/////////////////////////////////////////////////////////////////////
// .what = the read model — one row shaped for its caller, the rank order, rollups, gates
//
// .why  = every derived figure is computed at read time and never stored, so there
//         is exactly one write path and no stored derivation to go stale
//
// .note = a PART of `ecowork.db.mjs`, cut so one reviewer can hold it
//         whole. only the entry opens the store — this module takes an
//         open `db` handle and never opens one ([case56])
/////////////////////////////////////////////////////////////////////

import { URG_DAYS, asDurDays, getRepeats, asCashCents, asCashWords, asCostHours, getAskRung } from './ecowork.db.vocab.mjs';
import { asGoalParts, asSurgoals, getServed, getGoalsBeneath } from './ecowork.db.goal.mjs';
import { STATUS_DEFAULT, STATUS_OPEN } from './ecowork.db.schema.mjs';

/////////////////////////////////////////////////////////////////////
// the shape one row takes for its caller
/////////////////////////////////////////////////////////////////////

/**
 * .what = shape one row — quant and opine split, derived figures added
 *
 * .why the derived cash fields are computed here and never stored
 *   a stored derivation goes stale the moment its inputs move. these
 *   are cheap, so they are read-time — and that leaves exactly one
 *   write path, which cannot drift from a second
 */
export const asPriority = (row) => {
  const costHours = row.quant_cost_time ? asCostHours(row.quant_cost_time) : null;

  // total one side over ITS OWN life, so a 3mo gain and a 5y gain at the
  // same rate never render alike — and so a cost that outlives its gain
  // shows up as the net loss it is
  const asSide = (words, per, duration) => {
    const durDays = asDurDays(duration);
    const repeats = getRepeats(per, durDays);
    if (!words) return { total: null, durDays, repeats };
    const { currency, cents } = asCashCents(words);
    return { total: { currency, cents: cents * BigInt(repeats) }, durDays, repeats };
  };

  const gain = asSide(row.quant_gain_cash, row.quant_gain_per, row.quant_gain_duration);
  const cost = asSide(row.quant_cost_cash, row.quant_cost_per, row.quant_cost_duration);
  const gainTotal = gain.total;
  const costTotal = cost.total;

  // .why net, and not gross
  //   a gain with a cash cost against it is worth what remains. to rank
  //   on the gross figure would put a $1800 win that costs $1700 of
  //   vendor spend above a $500 win that costs naught
  //
  //   a cost with no gain yields a NEGATIVE net, which is correct and
  //   useful: it sorts to the bottom of the cash rank, where it belongs
  const netTotal = (() => {
    if (!gainTotal && !costTotal) return null;
    if (!costTotal) return gainTotal;
    if (!gainTotal) return { currency: costTotal.currency, cents: -costTotal.cents };
    return { currency: gainTotal.currency, cents: gainTotal.cents - costTotal.cents };
  })();

  // cash per hour of work — the one number that answers "what nets money
  // soonest". bigint division truncates, which is correct here: a
  // rounded-up rate would overclaim
  const perHour =
    netTotal && costHours && costHours >= 1
      ? { currency: netTotal.currency, cents: netTotal.cents / BigInt(Math.round(costHours)) }
      : null;

  return {
    // 🔴 there is no `goal` key here, and its absence is the point. the slug
    //   IS the goal uri, so a `goal` field beside it emitted one value twice
    //   under two names — `Goal.goal`. retired 2026-09-21
    slug: row.slug,

    // .why the parts ride DERIVED, beside the whole uri
    //   a caller that splits on '://' to group by kind decodes at every
    //   site (rule.forbid.inline-decode-friction). one split here, never N
    //
    // 🔴 goalRoot is the TRACE field. it reads the same from a root rock
    //    and from every subrock beneath it, whatever kind the root wears
    //    today — which is exactly what lets a root flip alt<->big without
    //    a single child edit
    goalKind: asGoalParts(row.slug).kind,
    goalRoot: asGoalParts(row.slug).root,
    goalPath: asGoalParts(row.slug).path,

    what: row.what,
    why: row.why ?? null,

    // 🔴 kind rides at the top level, never inside opine or quant. it is not a
    //    judgment (a human does not grade it — they read it off what the
    //    work does) and it is not a measurement. it is a FACT ABOUT THE
    //    EDGE between this goal and the problem it aims at
    //
    // ⚠️ null is a real value here, never an unset one. a root, or a pure
    //    decomposition node, aims at no problem and is neither kind. so a
    //    reader must be able to tell "no problem" from "problem, kind
    //    unjudged" — and today it cannot. see define.eco.solve-vs-clamp
    kind: row.kind ?? null,

    // 🔴 status rides OUTSIDE quant and opine, deliberately. it is neither
    //    a measurement of value nor a claim about worth — it is a fact
    //    about the work, and it sorts naught. to file it under either
    //    family would put a lifecycle state where a ranking input goes
    status: row.status ?? STATUS_DEFAULT,

    // 🔴 sponsored rides OUTSIDE opine and quant, beside status. it is not
    //    the org's judgment of worth (that is opine) nor a measurement (that
    //    is quant) — it is a FACT that a human has authorized their budget
    //    (review time, tokens, compute) on this row. prioritized is what the
    //    org WANTS; sponsored is what a human is PAYING for now
    //    (define.prioritized-vs-sponsored)
    //
    // ⚠️ DERIVED, never stored. it arrives from the `priority_live` view, so a
    //    row read straight off the `priority` TABLE has no such field and this
    //    silently renders false. that is the one way to get a wrong answer
    //    here, and it does not throw — every read that renders a priority must
    //    go through the view
    sponsored: row.sponsored === 1,

    // 🔴 the lapse date of the sponsorship that ends SOONEST, or null
    //
    // ⚠️ null is TWO states and the render must part them: no sponsorship at
    //    all, and an OPEN-ENDED one. `sponsored` is what tells them apart —
    //    false + null = unfunded; true + null = funded until a human says
    //    otherwise. to read null alone as "not funded" inverts the answer on
    //    exactly the rows a human cares most about
    sponsoredUntil: row.sponsored_until ?? null,

    opine: {
      sev: row.opine_sev,
      urg: row.opine_urg,
    },
    quant: {
      // 🔴 each side carries its OWN duration. gain and cost run for
      //    different lengths, and that difference is often the verdict
      gain: {
        cash: row.quant_gain_cash ?? null,
        per: row.quant_gain_per,
        duration: row.quant_gain_duration,
        durationDays: gain.durDays,
        repeats: gain.repeats,
        cashTotal: gainTotal ? asCashWords(gainTotal) : null,
        time: row.quant_gain_time ?? null,
        hours: row.quant_gain_time ? asCostHours(row.quant_gain_time) : null,
      },
      cost: {
        cash: row.quant_cost_cash ?? null,
        per: row.quant_cost_per,
        duration: row.quant_cost_duration,
        durationDays: cost.durDays,
        repeats: cost.repeats,
        cashTotal: costTotal ? asCashWords(costTotal) : null,
        time: row.quant_cost_time ?? null,
        hours: costHours,
      },
      netCashTotal: netTotal ? asCashWords(netTotal) : null,
      asks: row.quant_asks,
      askRung: getAskRung(row.quant_asks),
      cashPerHour: perHour ? asCashWords(perHour) : null,
      cashPerHourCents: perHour ? Number(perHour.cents) : null,

      // 🔴 .why `cashMeasured` is distinct from "the flag is quiet"
      //   a row with no cash figure is excluded from the cash rank, so
      //   it can never earn a ⚖️. its blank flag column then reads as
      //   "measured, and it agrees", when it means "never measured".
      //
      //   ⇒ that asymmetry only ever promotes CASH work — which is the
      //     exact undervalue define.cost-gain-matrix exists to prevent.
      //     the render must part the two states.
      cashMeasured: perHour !== null,
    },
    refTask: JSON.parse(row.ref_task),
    refTree: JSON.parse(row.ref_tree),
    // 🔴 `?? '[]'` — a csv written BEFORE this column existed has no
    //   `ref_pull` field at all, and the reader keys on the header, so the
    //   row arrives with it absent rather than empty. a bare JSON.parse
    //   would throw on that row and take the whole rebuild with it
    refPull: JSON.parse(row.ref_pull ?? '[]'),
    seenTreeAt: row.seen_tree_at ?? null,
    seenAt: row.seen_at,
    setAt: row.set_at,
  };
};

/**
 * .what = the rank order — SPONSORED first, then OPINE, then the quants
 *
 * .why sponsored tops the rank
 *   sponsored means a human authorized their budget (review time, cash
 *   tokens + compute) on this work. that authorization is the scarcest
 *   input on a token-capped grove, so a sponsored row outranks every
 *   unsponsored one regardless of sev/urg. prioritized (opine) says the
 *   org WANTS it; sponsored says a human is PAYING for it now.
 *   ⇒ backward-compatible: every extant row is sponsored=0, so this key
 *     is a no-op tiebreak until a human sponsors a row.
 *
 * .why the quants sort LAST, and that is deliberate
 *   sev and urg are the human's declared judgment. asks and cash are
 *   evidence. ⇒ evidence breaks a tie between two judgments; it does not
 *   overturn one. whether `sev x asks` or cash-per-hour should instead
 *   drive the PRIMARY sort is a real fork, itemized as F6 in the dream
 *   and deliberately unmade.
 *
 *   ⇒ what the quants DO get is a flag — see markQuantDisagreement. a
 *     row whose evidence outranks its judgment is surfaced for a human
 *     to re-judge, which is the informs-never-overwrites invariant.
 */
export const ORDER_BY = `
  ORDER BY sponsored DESC,
           CAST(substr(opine_sev, 2) AS INTEGER) ASC,
           CASE opine_urg ${Object.entries(URG_DAYS)
             .map(([k, v]) => `WHEN '${k}' THEN ${v}`)
             .join(' ')} ELSE 999 END ASC,
           quant_asks DESC,
           slug ASC
`;

/**
 * .what = flag each row where the QUANT rank beats the OPINE rank
 *
 * .why  = this is the "a quant informs an opine" mechanism, and it needs
 *         no invented threshold. the rows are already in opine order;
 *         re-sort them by cash-per-hour and compare positions. a row
 *         that climbs two or more places is one whose evidence disagrees
 *         with its judgment, and a human should look.
 *
 *         two places rather than one, because a single swap between
 *         adjacent rows is noise — the same refusal of false precision
 *         the fibonacci ladders make, applied to a rank.
 *
 * ⚠️ .the bound this CANNOT see
 *   it ranks on cash alone, so a row with no cash figure never enters
 *   the sort and never earns a flag. that is not a verdict of agreement
 *   — it is an absence of measurement, and `quant.cashMeasured` is what
 *   parts the two for the render.
 */
export const flagQuantDisagreement = (priorities) => {
  const byQuant = [...priorities]
    .filter((p) => p.quant.cashPerHourCents !== null)
    .sort((a, b) => b.quant.cashPerHourCents - a.quant.cashPerHourCents);

  return priorities.map((priority, indexOpine) => {
    const indexQuant = byQuant.indexOf(priority);
    if (indexQuant < 0) return { ...priority, quantClimb: null };
    const climb = indexOpine - indexQuant;
    return { ...priority, quantClimb: climb >= 2 ? climb : null };
  });
};

/////////////////////////////////////////////////////////////////////
// GAIN ROLLUP — it sums UP, never down, and an own figure OVERRIDES
/////////////////////////////////////////////////////////////////////

// 🔴 .the invariant, and it REVERSES the prior one
//
//     gain(G)  =  gain.own(G)                     when G declares one
//                 Σ gain(child)  over children    otherwise
//
//   two claims, and the second is the one that carries the weight:
//
//   1. gain flows UP. a whole is worth what its parts deliver, added. it
//      does NOT flow down — a parent's figure is never handed to its
//      children.
//
//   2. an OWN figure OVERRIDES the children's sum. it does not add to it.
//
// 🔴 .why OVERRIDE and not ADD — the whole argument in one line
//
//   a parent's own figure and its children's sum are TWO ESTIMATES OF ONE
//   QUANTITY, never two quantities. the children ARE the decomposition of
//   the parent; their value IS the parent's value, counted a second way.
//   to add them is to count the same dollar twice.
//
//   ⇒ so the rule picks which estimate to trust, and it picks the DIRECT
//     measurement over the derived one. a human who priced the whole
//     priced the whole; a bottom-up sum is only as complete as the
//     decomposition, and a decomposition is almost never finished.
//
// ⚠️ .what this GIVES UP, stated rather than hidden
//   down-propagation made a portfolio total impossible — the parent's
//   figure appeared on the parent and again on every child. up-summation
//   is additive by construction, so a root's figure IS the portfolio
//   figure, and it may be read as one. that is the whole trade.
//
// 🔴 .the open fulcrum this creates — see the brief
//   down-propagation was what raised the N-birds-one-stone goal: a child
//   fed by two roots summed both roots' gain and rose on rank without an
//   advocate. up-summation does NOT do that — a goal's own rank is its own
//   figure, whatever it serves. the candidate repair is the serve COUNT as
//   a visible rank input rather than a propagated figure, and it is not
//   settled (define.invariant.eco.gain-sums-up-never-down)

/**
 * .what = the goals one rung DOWN from each goal, over BOTH edge kinds
 * .why  = the rollup reads children, and a child may be one by path or by
 *         a stored serve edge. to read one and not the other would sum a
 *         subset and report a total (term=partial-audit)
 */
export const getChildrenByGoal = (db, goals) => {
  const children = new Map(goals.map((goal) => [goal, new Set()]));
  const known = new Set(goals);

  // the PATH half — a goal is a child when one of its implied surgoals is
  // a goal some row actually declares
  for (const goal of goals)
    for (const up of asSurgoals(goal)) if (known.has(up)) children.get(up).add(goal);

  // the STORED half — the extra parents a path cannot express
  for (const { part, whole } of db.prepare('SELECT part, whole FROM goal_decomposition_uri').all())
    if (children.has(whole) && known.has(part)) children.get(whole).add(part);

  return children;
};

/**
 * .what = the rolled gain per goal, in cents, by the invariant above
 *
 * ⚠️ a goal reachable from two parents contributes its FULL figure to
 *   each. that is correct per-root — both roots genuinely advance when it
 *   lands — and it means the roots' totals may not be added to one
 *   another. the double-count is across ROOTS, never within one
 */
export const getGainRolledByGoal = (db, priorities) => {
  const goals = [...new Set(priorities.map((p) => p.slug).filter(Boolean))];
  if (!goals.length) return new Map();

  // a goal's OWN figure is the sum over every row that declares it —
  // usually one row, and the sum is what keeps two honest
  const own = new Map();
  for (const priority of priorities) {
    if (!priority.slug || !priority.quant.gain.cashTotal) continue;
    const { currency, cents } = asCashCents(priority.quant.gain.cashTotal);
    const prior = own.get(priority.slug);
    own.set(priority.slug, { currency, cents: (prior?.cents ?? 0n) + cents });
  }

  const children = getChildrenByGoal(db, goals);
  const rolled = new Map();

  // ⚠️ `walked` guards a cycle the write path already refuses. a hand-edited
  //   jsonl is a real input (the store is plaintext on purpose), so the
  //   read path may not assume the write path was the only author
  const walk = (goal, walked) => {
    if (rolled.has(goal)) return rolled.get(goal);
    if (walked.has(goal)) return null; // a cycle contributes naught
    walked.add(goal);

    // 🔴 OWN WINS. the children are not consulted at all
    const mine = own.get(goal);
    if (mine) {
      rolled.set(goal, { ...mine, derived: false });
      return rolled.get(goal);
    }

    let sum = null;
    for (const child of children.get(goal) ?? []) {
      const below = walk(child, walked);
      if (!below) continue;
      sum = sum
        ? { currency: sum.currency, cents: sum.cents + below.cents }
        : { currency: below.currency, cents: below.cents };
    }

    const answer = sum ? { ...sum, derived: true } : null;
    rolled.set(goal, answer);
    return answer;
  };

  for (const goal of goals) walk(goal, new Set());
  return rolled;
};

/**
 * .what = attach each row's gate edges, and whether it is READY to start
 *
 * .why ONE query rather than two per row
 *   a `get` over 40 rows would otherwise fire 80 statements to answer a
 *   question one join already holds
 *
 * 🔴 .why it reads edges by `gated IN (...)` and NOT by the filtered set
 *   a gate's gater may sit OUTSIDE the caller's filter — `get --slug X`
 *   narrows to one subtree, and a row in it may be gated by a row in
 *   another. to only consider gaters inside the filter would report a
 *   gated row as ready because the thing that gates it was out of view.
 *   that is a term=partial-audit with a green check on it, which is the
 *   most expensive shape this store can emit
 */
export const withGates = (db, priorities) => {
  if (!priorities.length) return priorities;
  const slugs = priorities.map((p) => p.slug);
  const holes = slugs.map(() => '?').join(', ');

  // 🔴 the rollup reads EVERY row, never the filtered set. a child may sit
  //   outside the caller's filter, and a whole whose parts were out of view
  //   would report a total that omits them — a figure that reads complete
  //   and is not (term=partial-audit)
  const rolled = getGainRolledByGoal(
    db,
    db
      // ⚠️ `priority_live`, never `priority` — `asPriority` reads `sponsored`
      //   off the row, and the TABLE no longer holds it. a table read renders
      //   every row unsponsored, silently
      .prepare('SELECT * FROM priority_live')
      .all()
      .map((row) => asPriority(row)),
  );

  // 🔴 the WHOLE STORE, lightly — never the filtered set
  //   a child may sit outside the caller's filter, and a parent reported
  //   ready because its children were out of view is the same
  //   term=partial-audit the gate join above refuses
  const everyRow = db.prepare('SELECT slug, status FROM priority').all();

  // the join carries the gater's STATUS, because "is this gate shut?" is
  // a question about the gater's progress rather than about the edge
  const edges = db
    .prepare(
      // ⚠️ this one reads `goal_orchestration` directly rather than the
      //    `goal_orchestration_slug` view, and the LEFT JOINs are why. the
      //    view's inner joins DROP an edge whose end lost its priority row —
      //    and the very next block reads an absent gater as a SHUT gate. an
      //    edge that vanishes reads as an OPEN one instead, which inverts the
      //    guarantee
      `SELECT pb.slug AS gater, pa.slug AS gated, pb.status AS gaterStatus
         FROM goal_orchestration o
         JOIN goal gb ON gb.uuid = o.before
         JOIN goal ga ON ga.uuid = o.after
         LEFT JOIN priority pb ON pb.slug = gb.uri
         LEFT JOIN priority pa ON pa.slug = ga.uri
        WHERE pa.slug IN (${holes}) OR pb.slug IN (${holes})`,
    )
    .all(...slugs, ...slugs);

  return priorities.map((priority) => {
    const gates = edges.filter((e) => e.gater === priority.slug).map((e) => e.gated);
    const gatedBy = edges.filter((e) => e.gated === priority.slug);

    // ⚠️ an ABSENT gater counts as SHUT. delPriority drops its edges, so
    //   this should be unreachable — and if it ever is reached, absence of
    //   evidence that the gater finished is not evidence that it did
    const shut = gatedBy
      .filter((e) => e.gaterStatus === null || STATUS_OPEN.includes(e.gaterStatus))
      .map((e) => e.gater);

    // 🔴 the DERIVED half — a part gates its whole, by construction
    //   see define.invariant.eco.a-part-gates-its-whole. this is read from
    //   the goal graph rather than the gate table on purpose: a hand-typed
    //   gate that restates a part-of edge is a second source of truth for
    //   one fact, and the two can disagree
    //
    // 🔴 .why it walks the DAG rather than compares two paths
    //   `isGoalBeneath` answers off the uri STRINGS, so it is blind to a
    //   `serve` edge by construction. left on the path test, a goal that
    //   serves a second root would NOT gate that root — the whole would
    //   report `ready` with real work open beneath it, and the store would
    //   state the part-of relation in one breath and deny it in the next
    const beneath = new Set(priority.slug ? getGoalsBeneath(db, priority.slug) : []);
    beneath.delete(priority.slug); // a goal is not its own part

    const partsOpen = everyRow
      .filter((row) => beneath.has(row.slug))
      .filter((row) => STATUS_OPEN.includes(row.status))
      .map((row) => row.slug);

    return {
      ...priority,
      gates: gates.sort(),
      gatedBy: gatedBy.map((e) => e.gater).sort(),
      gatedByOpen: shut.sort(),

      // 🔴 the EXTRA parents, rendered — a propagated figure that cannot be
      //   traced to a visible edge is a number nobody can audit, which is
      //   the same class as a propagated figure rendered as a measured one
      //   (define.invariant.eco.gain-propagates-down-and-sums, enforcement)
      goalSurgoals: priority.slug ? getServed(db, priority.slug) : [],

      // 🔴 the ROLLED gain, and it is NEVER merged into `quant.gain.cash`
      //
      //   `derived: true` means the figure was summed from parts and nobody
      //   measured it. a derived figure rendered indistinguishably from a
      //   measured one is a number a reader cannot audit — the same class
      //   as term=volunteered-diagnosis, and it is the one enforcement line
      //   both gain invariants have always shared
      //
      // ⚠️ so it rides in its OWN field, beside the measured one, never in
      //   place of it. a render that shows a derived figure must mark it
      gainRolled: (() => {
        const found = priority.slug ? rolled.get(priority.slug) : null;
        if (!found) return null;
        return {
          cashTotal: asCashWords({ currency: found.currency, cents: found.cents }),
          derived: found.derived,
        };
      })(),

      // the two halves stay SEPARATE in the shape, never merged into one
      // list. `gatedByOpen` holds the edges somebody decided; `partsOpen`
      // is what the tree already states, and the repair for each differs —
      // drop an edge, versus finish a piece
      partsOpen: partsOpen.sort(),

      // 🔴 `ready` means "may be STARTED now", so it is narrower than
      //   "has no open gate". three statuses are excluded and each for its
      //   own reason: `inflight` has already begun, `done` has already
      //   finished, and `held` was parked on purpose — to surface a held
      //   row as ready would make the park invisible, which is the whole
      //   reason `held` is not merely `enqueued`
      //
      // 🟡 FULCRUM, open — a part gates its whole's COMPLETION beyond
      //   dispute. whether it also gates the whole's START is the softer
      //   half, and this best-guesses YES: the parent's gain is the
      //   rollup, so it cannot be banked until the parts land, and a
      //   parent with genuinely startable own-work should carry that work
      //   as a child row rather than on itself. clean to reverse
      ready: priority.status === 'enqueued' && shut.length === 0 && partsOpen.length === 0,
    };
  });
};
