/////////////////////////////////////////////////////////////////////
// .what = the verbs — gates, sponsorship, and set / get / del / goal.mv
//
// .why  = the dispatcher in `ecowork.db.mjs` maps each verb name onto one of these.
//         each takes an open db and a parsed payload, and returns a json verdict
//
// .note = a PART of `ecowork.db.mjs`, cut so one reviewer can hold it
//         whole. only the entry opens the store — this module takes an
//         open `db` handle and never opens one ([case56])
/////////////////////////////////////////////////////////////////////

import { randomUUID } from 'node:crypto';
import { ASK_RUNGS, DUR_DEFAULT, ConstraintError, isAskRung, CLEAR } from './ecowork.db.vocab.mjs';
import { GOAL_RE, asGoalParts, isGoalBeneath, asSurgoals, asGoalRollupClause, setServeSet, assertSurgoalDeclared, assertNoOrphansLeft } from './ecowork.db.goal.mjs';
import { STATUS_ALLOWED, STATUS_DEFAULT, genGoalUuid, getGoalUuidOfSlug } from './ecowork.db.schema.mjs';
import { asPriority, ORDER_BY, flagQuantDisagreement, withGates } from './ecowork.db.read.mjs';
import { assertSlugIsGoalUri, assertVocabularies, assertTreeGrain } from './ecowork.db.assert.mjs';

/////////////////////////////////////////////////////////////////////
// the GATE edge — must-precede, over the same rows decomposition uses
/////////////////////////////////////////////////////////////////////

// 🔴 .why a TABLE and not a json column beside ref_task
//
//   1. ONE EDGE, TWO ENDS. `--gates x` and `--gated-by x` write the same
//      fact from opposite rows. on a json column that is two writes that
//      can disagree — row A claims it gates B while B claims naught —
//      and no query can tell which side is right. a table holds the edge
//      once, so the two flags are two VIEWS of one row
//   2. a CYCLE CHECK is a graph walk, and a walk over json_each on every
//      row is a scan. `gate_gater` makes it an index seek
//   3. `--ready` is a JOIN — "rows with no edge whose gater is unfinished"
//      — and a join is what a relation is for
//
//   ⇒ and it is this store's FIRST edge table, so the gain graph that
//     task #5 still owes can reuse the shape rather than invent a second.
//
// 🔴 .why `gater` / `gated` and NOT `blocker` / `blocked`
//   `blocked` is taken twice already — a review severity, and the
//   driver's `--as blocked`. and `gate` is the word
//   define.eco.decomposition-vs-orchestration already settled for this
//   relation, so to reach for a third word here would be the synonym
//   drift `rule.forbid.domain-term-inconsistency` grades.

/**
 * .what = every slug reachable by a walk FORWARD along gate edges
 * .why  = the cycle check. a walk rather than a recursive CTE because
 *         the graph is small and a walk is legible at 3am
 */
export const getGateReach = (db, from) => {
  const seen = new Set();
  const stack = [from];
  const step = db.prepare('SELECT after FROM goal_orchestration_slug WHERE before = ?');
  while (stack.length) {
    const at = stack.pop();
    if (seen.has(at)) continue;
    seen.add(at);
    for (const row of step.all(at)) stack.push(row.after);
  }
  seen.delete(from);
  return seen;
};

/**
 * .what = write one gate edge, after it earns the right to exist
 *
 * .why the two refusals, and why each names its fix
 *   an UNKNOWN slug is the common typo, and an unchecked one is silent:
 *   the edge writes, `--ready` treats it as a shut gate forever, and the
 *   row it guards never surfaces again. a gate that names naught is
 *   indistinguishable from a gate nobody can pass
 *
 *   a CYCLE is worse, because it is locally reasonable at every step —
 *   A gates B, B gates C, C gates A each read fine alone. the result is
 *   a set where no row is ever ready and no error ever fires
 *   (rule.prefer.prevent-over-correct: refuse it rather than detect it)
 */
export const setGate = (db, { gater, gated, now }) => {
  if (gater === gated)
    throw new ConstraintError(
      `'${gater}' cannot gate itself. a gate names what must come FIRST, and naught precedes a row but another row`,
    );

  const rows = {};
  for (const slug of [gater, gated]) {
    rows[slug] = db.prepare('SELECT slug FROM priority WHERE slug = ?').get(slug);
    if (!rows[slug])
      throw new ConstraintError(
        `no priority '${slug}', so a gate on it would name naught. list the slugs with ` +
          `\`rhx eco.priority get\`, or record it first with \`rhx eco.priority set --slug ${slug} ...\``,
      );
  }

  // 🔴 a gate that merely RESTATES the goal tree is refused
  //
  //   a part gates its whole by construction — the store derives that from
  //   the goal uri each row IS, and never from this table
  //   (define.invariant.eco.a-part-gates-its-whole). so a hand-typed edge
  //   between an ancestor and a descendant is a SECOND source of truth for
  //   one fact, and the two can disagree: drop the edge and the ordering
  //   silently vanishes, though the tree still states it.
  //
  //   ⚠️ and the wrong-direction case is worse than redundant, it is FALSE.
  //   `--gates` on a child says the child must precede its parent, which
  //   is already true; on a parent it says the whole precedes its part,
  //   which inverts the tree and would close a loop the cycle check below
  //   cannot see, because one of the two edges is derived rather than
  //   stored (rule.prefer.prevent-over-correct)
  const beneath = isGoalBeneath({ deep: gater, over: gated })
    ? { part: gater, whole: gated }
    : isGoalBeneath({ deep: gated, over: gater })
      ? { part: gated, whole: gater }
      : null;

  if (beneath)
    throw new ConstraintError(
      `'${beneath.part}' is already a PART of '${beneath.whole}', and a part gates its whole by ` +
        `construction — the store derives that from the goal uri itself, so ` +
        `this edge would be a second record of one fact. drop it.\n` +
        `⇒ if you meant a real prerequisite, aim it at the row that does the WORK rather than ` +
        `at the roll-up above it. a gate on a parent is redundant (its parts already gate it) ` +
        `AND imprecise (the leaf that needs it carries none) — and the block reaches the ` +
        `parent on its own, up the tree`,
    );

  if (getGateReach(db, gated).has(gater)) {
    const path = [...getGateReach(db, gated)].join(', ');
    throw new ConstraintError(
      `'${gater}' gates '${gated}' would close a cycle — '${gated}' already reaches '${gater}' ` +
        `(through: ${path}). a timeline with a cycle has no first row, so \`get --ready\` would ` +
        `return naught forever and name no reason. drop one of the edges on that path first`,
    );
  }

  // 🔴 the edge is stored in UUIDs, keyed on the goal uri — which IS the slug.
  //   so a row whose slug is a bare coined name has no identity the edge can
  //   hold, and to write one anyway would need a second keyspace
  //
  // ⚠️ .why this refusal survived the retirement
  //   it once read `if (!goal)` — a row that declared no goal. that state is
  //   gone; the column is. but `setGoalColumnRetired` leaves a LEGACY row's
  //   slug as it stands when the row named no uri to migrate onto, so the
  //   bare-name case is still reachable and still unkeyable. the test moved
  //   from "is a column null" to "is this slug a uri", which is the same
  //   question asked of the one name that is left
  const ends = {};
  for (const slug of [gater, gated]) {
    if (!GOAL_RE.test(slug))
      // 🔴 the advice here named a repair that CANNOT be run, twice over, and
      //   it read as a runnable command both times (measured 2026-09-16,
      //   `.temp/probe-legacy.mjs`) — it prescribed a `--goal` the shell has
      //   never exposed, and a bare token the uri check refuses anyway.
      //
      //   ⇒ so the repair is a uri-shaped SLUG, and that is what the message
      //     must say rather than a command that re-fails
      //     (rule.require.errors-name-the-fix)
      throw new ConstraintError(
        `'${slug}' is a bare name rather than a goal uri, so a gate on it has no key to hold. a ` +
          `gate edge is stored by the goal's uuid, which is what lets a rename move one row and ` +
          `leave every edge untouched.\n` +
          `⇒ this row predates the slug/goal merge — it carries a coined name where a goal uri ` +
          `belongs. rename it in place onto one, KIND and all:\n` +
          `     rhx eco.priority goal.mv --from '${slug}' --to 'bigrock://${slug}'   a mainquest\n` +
          `     rhx eco.priority goal.mv --from '${slug}' --to 'altrock://${slug}'   a sidequest\n` +
          `⇒ a bare '${slug}' is refused: it records no kind`,
      );
    ends[slug] = genGoalUuid(db, { uri: slug, now });
  }

  db.prepare(
    'INSERT INTO goal_orchestration (before, after, set_at) VALUES (?, ?, ?) ON CONFLICT(before, after) DO UPDATE SET set_at = excluded.set_at',
  ).run(ends[gater], ends[gated], now);
};

/**
 * .what = replace one SIDE of a row's gate edges
 *
 * .why REPLACE rather than append
 *   the same shape `--ref-task` already takes, for the same reason: an
 *   omitted flag preserves, so the only way to REMOVE one edge of three
 *   would otherwise be a `del` verb this store does not have. state the
 *   set you want, and `none` states the empty one
 */
export const setGateSide = (db, { slug, side, slugs, now }) => {
  if (!Array.isArray(slugs)) return; // omitted — preserve
  const wanted = slugs.length === 1 && slugs[0] === CLEAR ? [] : slugs;
  const column = side === 'gates' ? 'before' : 'after';
  // ⚠️ an absent uuid means this row holds no edges yet, so the delete is a
  //    no-op — and `''` deletes naught either, which is what makes it safe
  db.prepare(`DELETE FROM goal_orchestration WHERE ${column} = ?`).run(
    getGoalUuidOfSlug(db, slug) ?? '',
  );
  for (const other of wanted)
    setGate(db, {
      gater: side === 'gates' ? slug : other,
      gated: side === 'gates' ? other : slug,
      now,
    });
};

/**
 * .what = upsert one priority, keyed on its slug — PARTIAL by default
 *
 * 🔴 .why an omitted field PRESERVES rather than nulls
 *   the natural call is "this came up again", and a human who types that
 *   supplies a slug and little else. a full-field overwrite would then
 *   delete the gain, the cost, the work estimate, the why, and the refs
 *   — which is the QUANT family, the very half that exists to inform an
 *   opine. so the cheapest, most frequent call would silently destroy
 *   the most expensive data on the record.
 *
 *   ⇒ and a partial update is the ordinary sense of `set` anyway:
 *     `UPDATE SET a = 1` has never nulled `b`. the full overwrite was
 *     the unusual choice, not this one.
 *
 *   ⚠️ so to CLEAR a field you must say so: the sentinel `none` writes a
 *     null. `--cost-cash none` empties it; an omitted `--cost-cash`
 *     leaves it alone.
 */
/**
 * 🔴 .what = open, amend, or close a sponsorship EPISODE on a row's goal
 *
 * .why  = `--sponsor` used to flip a bit. it now opens a record that names a
 *         human, a reason, and a window — because those three are what a
 *         reader of a funded rank actually needs, and a flag holds none.
 *
 * .the four moves
 *   --sponsor                      open an episode (needs --sponsor-who + -why)
 *   --sponsor + --sponsor-until    open a BOUNDED one
 *   --sponsor-who/-why/-until      amend the LIVE episode in place
 *   --unsponsor                    close it — `until = now`, never a delete
 *
 * 🔴 .why --unsponsor CLOSES rather than deletes
 *   the episode is the audit trail. to delete it removes the evidence that a
 *   human ever funded this, which is precisely the question a reader asks
 *   later — "we spent three weeks on this; who said to?". a closed episode
 *   answers it; an absent one reads as though nobody ever did.
 *
 * ⚠️ .why --sponsor REFUSES without a who and a why
 *   the migration already carries ~5 unattributed sponsorships, and each is a
 *   repair a human owes. to let a NEW one land unattributed would mint more
 *   of the exact debt this table was built to retire. an absent who is a
 *   legacy state, never a choice (rule.require.errors-name-the-fix).
 */
export const setSponsorship = (db, input) => {
  const asked =
    input.sponsor === true ||
    input.unsponsor === true ||
    [input.who, input.why, input.since, input.until].some((v) => v !== undefined && v !== null);
  if (!asked) return;

  // ✅ .why there is no "declares no goal" refusal here any more
  //   a sponsorship keys on the GOAL rather than the row, and the slug IS the
  //   goal — so a row that reached this point names one by construction. the
  //   refusal that stood here answered a state the store can no longer hold.
  const uuid = genGoalUuid(db, { uri: input.slug, now: input.now });
  const live = db
    .prepare(
      `SELECT * FROM goal_sponsorship
        WHERE goal = ? AND since <= ? AND (until IS NULL OR until > ?)
        ORDER BY since DESC`,
    )
    .get(uuid, input.now, input.now);

  // ⚠️ a close on a row with no live episode is a NO-OP, never an error. the
  //   verb states a desired end state ("not funded"), and a row that is
  //   already unfunded is in it (rule.require.idempotent-operations)
  if (input.unsponsor === true) {
    if (live)
      db.prepare('UPDATE goal_sponsorship SET until = ?, set_at = ? WHERE uuid = ?').run(
        input.now,
        input.now,
        live.uuid,
      );
    return;
  }

  // an amend — the flags arrived with no --sponsor, and an episode is live
  if (input.sponsor !== true && live) {
    db.prepare(
      'UPDATE goal_sponsorship SET who = ?, why = ?, since = ?, until = ?, set_at = ? WHERE uuid = ?',
    ).run(
      input.who ?? live.who,
      input.why ?? live.why,
      input.since ?? live.since,
      input.until === CLEAR ? null : (input.until ?? live.until),
      input.now,
      live.uuid,
    );
    return;
  }

  if (input.sponsor !== true)
    throw new ConstraintError(
      `--sponsor-who/-why/-until amend a LIVE sponsorship, and '${input.slug}' has none.\n` +
        `  fix: open one — add --sponsor to the same call`,
    );

  // 🔴 an open on a row that is already funded AMENDS rather than stacks. two
  //   live episodes on one goal would each read as the answer to "who funded
  //   this?", and a reader has no way to tell which
  if (live) {
    db.prepare(
      'UPDATE goal_sponsorship SET who = ?, why = ?, until = ?, set_at = ? WHERE uuid = ?',
    ).run(
      input.who ?? live.who,
      input.why ?? live.why,
      input.until === CLEAR ? null : (input.until ?? live.until),
      input.now,
      live.uuid,
    );
    return;
  }

  if (!input.who || !input.why)
    throw new ConstraintError(
      `--sponsor commits scarce budget, so it owes an author and a reason.\n` +
        `  ⇒ a sponsorship nobody signed cannot be questioned, renewed, or revoked —\n` +
        `    which is the exact state the retired 'sponsored' flag left behind.\n` +
        `  fix: rhx eco.priority set --slug ${input.slug} --sponsor \\\n` +
        `         --sponsor-who '<your name>' \\\n` +
        `         --sponsor-why '<what the budget buys>' \\\n` +
        `         [--sponsor-until '<iso date>']`,
    );

  db.prepare(
    'INSERT INTO goal_sponsorship (uuid, goal, who, why, since, until, set_at) ' +
      'VALUES (?, ?, ?, ?, ?, ?, ?)',
  ).run(
    randomUUID(),
    uuid,
    input.who,
    input.why,
    input.since ?? input.now,
    input.until === CLEAR ? null : (input.until ?? null),
    input.now,
  );
};

export const setPriority = (db, input) => {
  if (!input.slug) throw new ConstraintError('set needs --slug');

  // 🔴 a `goal` key is REFUSED, never ignored. the slug IS the goal uri, so a
  //   `set` cannot move a row's goal — and a silent drop would exit 0 on a
  //   reparent that never happened. the move has one verb, and it is named
  if (input.goal !== undefined)
    throw new ConstraintError(
      `set takes no goal. a priority IS a goal, and --slug is its uri.\n` +
        `  ⇒ to move '${input.slug}', and every part beneath it:\n` +
        `       rhx eco.priority goal.mv --from '${input.slug}' --to '<the new goal uri>'`,
    );

  const now = new Date().toISOString();
  const prior = db.prepare('SELECT * FROM priority WHERE slug = ?').get(input.slug);

  // .what = the merge — omitted keeps, `none` clears, a value writes
  const pick = (key, column, fallback = null) => {
    const given = input[key];
    if (given === undefined || given === null || given === '')
      return prior ? (prior[column] ?? fallback) : fallback;
    if (given === CLEAR) return fallback;
    return given;
  };

  // refs arrive as an array or as null. `['none']` is the clear form,
  // since a bare `--ref-task none` is how a human would say it
  const pickRefs = (key, column) => {
    const given = input[key];
    if (!Array.isArray(given)) return prior ? JSON.parse(prior[column] ?? '[]') : [];
    if (given.length === 1 && given[0] === CLEAR) return [];
    return given;
  };

  const merged = {
    // 🔴 there is no `goal: pick('goal', 'goal')` here, and its absence is the
    //   point. the slug IS the goal uri — one attribute, one write, and no
    //   second field for a partial to leave behind or overwrite
    slug: input.slug,
    kind: pick('kind', 'kind'),
    what: pick('what', 'what'),
    why: pick('why', 'why'),
    sev: pick('sev', 'opine_sev'),
    urg: pick('urg', 'opine_urg'),
    status: pick('status', 'status', STATUS_DEFAULT),

    // ⚠️ sponsored is NOT merged here and no longer rides this upsert at all.
    //   it was a 0/1 column until 2026-09-15; it is now an EPISODE in
    //   `goal_sponsorship`, written by setSponsorship after the row lands —
    //   because a sponsorship keys on the row's GOAL, and on a CREATE that
    //   goal has no uuid until `genGoalUuid` runs below
    gainCash: pick('gainCash', 'quant_gain_cash'),
    gainPer: pick('gainPer', 'quant_gain_per', 'once'),
    gainDuration: pick('gainDuration', 'quant_gain_duration', DUR_DEFAULT),
    gainTime: pick('gainTime', 'quant_gain_time'),
    costCash: pick('costCash', 'quant_cost_cash'),
    costPer: pick('costPer', 'quant_cost_per', 'once'),
    costDuration: pick('costDuration', 'quant_cost_duration', DUR_DEFAULT),
    costTime: pick('costTime', 'quant_cost_time'),
    refTask: pickRefs('refTask', 'ref_task'),
    refTree: pickRefs('refTree', 'ref_tree'),
    refPull: pickRefs('refPull', 'ref_pull'),

    // 🔴 asks does NOT ride `pick`. an omission must PRESERVE the count,
    //   never default it, and the two knobs below are the only writers
    asks: Number.isInteger(input.asks) ? input.asks : null,
    ask: input.ask === true,
  };

  // .why a cleared cash resets its period
  //   a period with no amount to apply to is a constraint error, and a
  //   human who clears an amount did not ask for one. so the pit of
  //   success is to drop the orphan rather than reject the call
  if (!merged.gainCash) {
    merged.gainPer = 'once';
    merged.gainDuration = DUR_DEFAULT;
  }
  if (!merged.costCash) {
    merged.costPer = 'once';
    merged.costDuration = DUR_DEFAULT;
  }

  // a NEW priority owes the three judged fields. an extant one owes
  // naught beyond its slug — that is the whole point of the partial
  if (!prior) {
    assertSlugIsGoalUri(merged);
    const absent = ['sev', 'urg', 'what'].filter((k) => !merged[k]);
    if (absent.length)
      throw new ConstraintError(`a new priority needs --${absent.join(' and --')}`);
  }

  /*
   * ✅ there is no goal DERIVATION here, and no `assertSlugIsGoal` call below.
   *   both are gone with the column (2026-09-21) — the slug IS the goal uri, so
   *   there is one value and no second field to fill, compare, or keep in step.
   *
   * ⚠️ what stood here was a shim: `if (!prior && !merged.goal) merged.goal =
   *   merged.slug`. it was correct about the domain and wrong about the rung —
   *   it kept a second column and wrote it for you, which is a patch around the
   *   defect rather than its removal. a derived column is still a column, and
   *   every join, view, dump, and test still had to name it.
   */

  // ⚠️ validate the MERGED state, never the supplied half — a partial that
  //   leaves the row invalid is still an invalid row
  assertVocabularies(merged);

  // 🔴 the tree grain runs on the MERGED row too, and here it MATTERS most
  //   a `set --slug x --ref-tree y` supplies the tree and not the slug, so
  //   each half alone reads fine and only the merge can tell they disagree
  //
  // 🔴 .but only where the write TOUCHES the tree — the same bound the FK
  //   check below already states in its own words, and for the same reason.
  //   `--slug` is the key, so every call supplies it and it can never be the
  //   signal; `--ref-tree` is the one field this check grades.
  //
  //   ⚠️ measured 2026-09-18: `set --slug dispute-or-concede --status done`
  //   was refused for a coined slug the write never touched. 44 legacy rows
  //   carry the two-name shape, each names a tree, and this check ran on
  //   every `set` — so a status, an ask, a gate, or a ref-task on any of the
  //   44 was frozen behind a rename nobody asked for. the refusal was TRUE
  //   about the row and false about the write
  //
  //   ⇒ a stale disagreement is reported when a human touches the fields
  //     that hold it, never when they touch a neighbour. the rename stays
  //     owed; it is a `goal.mv`, and it is not the price of a status edit
  if (!prior || Array.isArray(input.refTree)) assertTreeGrain(merged);

  // 🔴 the FK runs on the CREATE alone, and the slug IS the goal it checks
  //   (define.invariant.eco.a-surgoal-must-be-declared-first)
  //
  // ✅ .why a partial no longer needs a "did this write touch the goal?" bound
  //   it once did: a partial `set --slug x --ask` carried no --goal and must not
  //   be refused for a reference it never touched. now the slug IS the key, so
  //   every partial names the goal the row already declared — a partial cannot
  //   move a goal at all, and a deliberate move is a `goal.mv`.
  //
  //   ⇒ so the check belongs on the CREATE, which is the one write that can
  //     introduce an undeclared parent. to run it on every partial would refuse
  //     an --ask on a row whose parent lapsed for reasons the --ask cannot fix
  //     — the same true-about-the-row, false-about-the-write miss the tree-grain
  //     bound above was measured to make on 2026-09-18
  if (!prior) assertSurgoalDeclared(db, { goal: merged.slug, slug: merged.slug });

  /*
   * ✅ there is no orphan check on a MOVE here, because a `set` can no longer
   *   move a goal — the slug is the primary key, so a `set` with a new slug is a
   *   CREATE and the row it would have moved stays exactly where it is.
   *
   * ⇒ the orphan refusal still stands on `del` and inside `goal.mv`, which are
   *   the two writes that can actually strand a declared part.
   */

  // 🔴 .why an EDIT no longer climbs the ask count — corrected 2026-09-13
  //
  //   this once bumped on every set of an extant slug, and the comment
  //   here defended it: "a human who reaches for a priority is a human
  //   the defect reached first", with the rung ladder cited as a damper
  //   on the noise. both halves turned out wrong on the same day.
  //
  //   ⛔ the premise fails because the caller is usually a CLONE. three
  //     edits made on one human's behalf — a re-grade, a second re-grade,
  //     a time estimate — took `sms-tune` from 1 to 3 and fired the
  //     🪃 "a priority this recurrent" prompt at a priority nobody had
  //     asked for twice.
  //
  //   ⛔ and the damper fails in the same breath: 1 -> 3 IS two rungs.
  //     the ladder widens at the TOP, so it absorbs noise least where
  //     the count is small, which is where every row starts.
  //
  //   ⇒ so `asks` is the one quant no human types, and it was the one
  //     quant a robot could inflate for free. an edit is not an ask.
  //
  // .the two writers, and only these two
  //   --ask        record one more reach   (+1)
  //   --asks <n>   state the count outright (absolute — a repair, or a
  //                human who knows the true number)
  //   an omission preserves, exactly as every other partial field does.
  //
  // 🟡 FULCRUM — `--ask` beside `--asks` is one keystroke apart, and
  //   `rule.forbid.ambiguous-labels` grades a near-collision like that.
  //   kept because the pair is honest (the verb records an event, the
  //   noun states a count) and because the absolute form is a repair
  //   knob a human reaches for rarely. clean to rename either one.
  db.prepare(
    `INSERT INTO priority (
       slug, kind, what, why, opine_sev, opine_urg,
       quant_gain_cash, quant_gain_per, quant_gain_duration, quant_gain_time,
       quant_cost_cash, quant_cost_per, quant_cost_duration, quant_cost_time,
       quant_asks, status,
       ref_task, ref_tree, ref_pull, seen_at, set_at
     )
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(slug) DO UPDATE SET
       kind = excluded.kind,
       what = excluded.what, why = excluded.why,
       opine_sev = excluded.opine_sev, opine_urg = excluded.opine_urg,
       status = excluded.status,
       quant_gain_cash = excluded.quant_gain_cash,
       quant_gain_per = excluded.quant_gain_per,
       quant_gain_duration = excluded.quant_gain_duration,
       quant_gain_time = excluded.quant_gain_time,
       quant_cost_cash = excluded.quant_cost_cash,
       quant_cost_per = excluded.quant_cost_per,
       quant_cost_duration = excluded.quant_cost_duration,
       quant_cost_time = excluded.quant_cost_time,
       ref_task = excluded.ref_task, ref_tree = excluded.ref_tree,
       ref_pull = excluded.ref_pull,
       set_at = excluded.set_at,
       quant_asks = CASE
         WHEN ? IS NOT NULL THEN ?
         WHEN ? = 1 THEN priority.quant_asks + 1
         ELSE priority.quant_asks
       END`,
  ).run(
    merged.slug,
    merged.kind,
    merged.what,
    merged.why,
    merged.sev,
    merged.urg,
    merged.gainCash,
    merged.gainPer,
    merged.gainDuration,
    merged.gainTime,
    merged.costCash,
    merged.costPer,
    merged.costDuration,
    merged.costTime,
    merged.asks ?? 1, // a NEW row starts at 1 — its creation IS the first ask
    merged.status,
    JSON.stringify(merged.refTask),
    JSON.stringify(merged.refTree),
    JSON.stringify(merged.refPull),
    now,
    now,
    // the three that drive the CASE above, in the order they appear
    merged.asks,
    merged.asks,
    merged.ask ? 1 : 0,
  );

  // 🔴 the goal earns its uuid HERE — on the row that declares it, before
  //   any edge can reach for one. a findsert, so a reparent onto a goal
  //   another row already declares reuses that goal's identity rather than
  //   mints a rival for the same uri
  genGoalUuid(db, { uri: merged.slug, now });

  // 🔴 the edges write AFTER the upsert, and the order is load-bearing:
  //   setGate refuses a slug that names no priority, and on a CREATE this
  //   row does not exist until the statement above runs. to write edges
  //   first would refuse every gate on every new row
  setGateSide(db, { slug: merged.slug, side: 'gates', slugs: input.gates, now });
  setGateSide(db, { slug: merged.slug, side: 'gatedBy', slugs: input.gatedBy, now });

  // 🔴 --surgoal is keyed on the GOAL, never on the slug
  //
  //   a gate is an edge between two ROWS, so it is keyed on the slug. a
  //   serve is an edge between two GOALS, and several rows may declare one
  //   goal — so to key it on the slug would give one goal N edge sets that
  //   can disagree, and the last row written would silently win.
  //
  // ✅ .why there is no "declares no goal" refusal here any more
  //   a row that reached this point names a goal by construction — its slug IS
  //   the uri. the refusal that stood here answered a state the store no longer
  //   holds, and an edge from `null` is unreachable rather than merely guarded
  if (Array.isArray(input.surgoal))
    setServeSet(db, { goal: merged.slug, wholes: input.surgoal, now });

  // 🔴 the sponsorship writes LAST, and after genGoalUuid above — it keys on
  //   the row's GOAL, which has no uuid until that findsert runs
  //
  // ⚠️ and it takes `slug` ALONE. a `goal:` key rode along here for as long as
  //   the column existed, and `setSponsorship` never read it — it has always
  //   keyed on the slug. so the pass-through was a second name handed to a
  //   reader that wanted one, which is the whole defect in miniature
  setSponsorship(db, {
    slug: merged.slug,
    // ⚠️ the shell sends ONE tri-state `sponsored` — null | true | false — so
    //   the two verbs are split here rather than at the surface. `null` is an
    //   omission and must reach neither branch, which is why this is an
    //   explicit `=== ` on both sides rather than a truthiness test
    sponsor: input.sponsored === true,
    unsponsor: input.sponsored === false,
    who: input.sponsorWho,
    why: input.sponsorWhy,
    since: input.sponsorSince,
    until: input.sponsorUntil,
    now,
  });

  const row = db.prepare('SELECT * FROM priority_live WHERE slug = ?').get(input.slug);
  const [priority] = withGates(db, [asPriority(row)]);

  return {
    verb: 'set',
    wrote: prior ? 'updated' : 'created',
    // a rung crossed is a PROMPT for the human to re-judge urg. the store
    // never rewrites urg itself — a measured frequency informs a human's
    // claim, it does not overrule it
    //
    // 🔴 three guards, and each caught a real false fire on 2026-09-13
    //   1. the count must have MOVED. this once fired on any set of an
    //      extant row, so a partial edit that touched no ask at all
    //      announced a rung the row had sat on for days
    //   2. it must have moved UP. `--asks 2` to repair an inflated 5 is
    //      a correction downward, and a correction is not a recurrence
    //   3. it must clear the FLOOR. every row is born at rung 1, so
    //      "just hit rung 1" reports an event that never happened
    askCrossed:
      prior &&
      priority.quant.asks > prior.quant_asks &&
      priority.quant.asks > ASK_RUNGS[0] &&
      isAskRung(priority.quant.asks)
        ? priority.quant.askRung
        : null,
    priority,
  };
};

/** .what = read priorities, ranked; every filter is optional */
export const getPriority = (db, input) => {
  const clauses = [];
  const binds = [];

  // 🔴 --slug ROLLS UP whenever it is a goal uri
  //
  //   a priority IS a goal and the uri IS the slug, so `--slug <uri>` asks the
  //   only rollup question there is. it once had a rival key on the retired
  //   column, and that rival is gone — see the absence note below
  //
  //   ⚠️ measured 2026-09-17: `--slug subrock://rhachet/entool/route-efficiency`
  //     returned `found: 0` with 15 rows beneath it. exit 0, and a count that
  //     reads complete — so it says "no priority serves that objective" and
  //     means "you asked about the parent". a confident naught, which is the
  //     term=partial-audit shape this store exists to refuse
  //
  //   ⇒ and it hid for weeks because `--output rootstruct` walks the goal
  //     tree directly rather than through this filter. the one view a human
  //     reads most was correct while the filter beneath it was not
  //
  // ⚠️ a BARE slug still exact-matches, and must. the retirement migrated a
  //   row's uri onto its slug wherever the row named one, and left the slug as
  //   it stands wherever it named none — so a coined token is still a real key
  //   on disk. the two cases are told apart by SHAPE alone, so no flag and no
  //   mode is owed: a uri is a uri, and a token is a token
  //
  // 🔴 .why the uri case ORs the EXACT slug beside the rollup
  //   the rollup matches by PATH DESCENT and by declared edges, and neither
  //   reaches a root whose own row is the one asked for. on the rollup alone a
  //   leaf goal was unreachable by the very uri that names it, so a read of
  //   its own slug returned naught. the OR is what keeps it addressable, and
  //   it costs one term
  if (input.slug) {
    if (GOAL_RE.test(input.slug)) {
      const rollup = asGoalRollupClause(db, input.slug);
      clauses.push(`(slug = ? OR ${rollup.sql})`);
      binds.push(input.slug, ...rollup.binds);
    } else {
      // 🔴 a bare token that names NO row is a mistyped uri, never a real ask.
      //   answered as a filter it exits 0 with an empty set — "no priority
      //   serves that objective" when it means "wrong shape". so it is refused;
      //   a bare token that DOES name a legacy row still matches it
      if (!db.prepare('SELECT 1 FROM priority WHERE slug = ?').get(input.slug))
        throw new ConstraintError(
          `--slug '${input.slug}' is not a filter — it is no goal uri, and no row holds it as a legacy key.\n` +
            `  a goal uri has one of three shapes:\n` +
            `    bigrock://<root>  ·  altrock://<root>  ·  subrock://<root>/<path>\n` +
            `  fix: rhx eco.priority get --slug 'bigrock://${input.slug}'`,
        );
      clauses.push('slug = ?');
      binds.push(input.slug);
    }
  }
  if (input.sev) {
    clauses.push('opine_sev = ?');
    binds.push(input.sev);
  }
  if (input.urg) {
    clauses.push('opine_urg = ?');
    binds.push(input.urg);
  }
  // 🔴 the FUNDED read, and it had no flag at all until 2026-09-15
  //
  // ⚠️ `rule.always.read-stars-as-sponsored-priorities` makes "how are our
  //   stars" the common question, and the store could not answer it — a human
  //   had to pull every row as json and filter by hand. a default question
  //   with no flag is a gap, not a minimalism
  //
  // ⇒ and it reads the DERIVED column, so a lapsed sponsorship drops out of
  //   `--sponsored` the moment it lapses. that is the point of the window
  if (input.sponsored === true) clauses.push('sponsored = 1');
  if (input.sponsored === false) clauses.push('sponsored = 0');

  if (input.status) {
    if (!STATUS_ALLOWED.includes(input.status))
      throw new ConstraintError(
        `--status '${input.status}' is not a declared status, so it can match no row. one of: ${STATUS_ALLOWED.join(' ')}`,
      );
    clauses.push('status = ?');
    binds.push(input.status);
  }
  // 🔴 .there is NO `goal` filter key, and its absence is the retirement
  //
  //   a rival key stood here and read the retired column. it justified itself
  //   on one premise: that `goal` carried the canonical uri on every row while
  //   `slug` carried it on only the migrated ones. `setGoalColumnRetired`
  //   migrated them, so the premise is gone — and what is left of the two keys
  //   is one relation asked twice.
  //
  //   ⚠️ it was not merely redundant, it was WEAKER. it pushed the rollup
  //     alone, with no exact-match OR beside it, so a read of a leaf goal's
  //     own uri through that key returned naught while the same uri through
  //     `--slug` returned the row. two keys, one relation, and the one a
  //     caller was likelier to reach for was the one that lied.
  //
  //   ⇒ the shell never exposed a `--goal` flag to reach it, so no caller loses
  //     a capability here. `--slug <uri>` is the rollup, and it is the whole of
  //     it (2026-09-21)

  // .what = take one ref out of whatever shape the caller sent
  //
  // 🔴 .why an ARRAY must collapse here, and an EMPTY one must vanish
  //   the bash surface builds --ref-task with jq, so it always arrives as an
  //   array — `[]` when the flag was never passed. and `[]` is TRUTHY in js,
  //   so a bare `if (input.refTask)` pushed a filter nobody asked for and
  //   bound an array to a sqlite parameter. every `get` with no ref filter
  //   died with `Provided value cannot be bound to SQLite parameter 1` —
  //   which reads as a store malfunction and was a shape mismatch at the seam
  const asRefFilter = (given) => {
    if (Array.isArray(given)) return given.length ? given[0] : null;
    return given || null;
  };

  // a ref lands in a json array, so an exact-element test beats a LIKE
  // (a LIKE on '#1' would also hit '#12', which is a false report)
  const refTask = asRefFilter(input.refTask);
  const refTree = asRefFilter(input.refTree);

  if (refTask) {
    clauses.push('EXISTS (SELECT 1 FROM json_each(ref_task) WHERE json_each.value = ?)');
    binds.push(refTask);
  }
  if (refTree) {
    clauses.push('EXISTS (SELECT 1 FROM json_each(ref_tree) WHERE json_each.value = ?)');
    binds.push(refTree);
  }

  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  const rows = db.prepare(`SELECT * FROM priority_live ${where} ${ORDER_BY}`).all(...binds);
  const gated = withGates(db, rows.map(asPriority));

  // 🔴 `--ready` filters LAST, after withGates has seen every edge — never
  //   as a WHERE clause. a sql filter would narrow the row set BEFORE the
  //   gate join, so a row's gater could be filtered out of view and the
  //   row would report itself ready because no gater was left to gate it
  const kept = input.ready ? gated.filter((p) => p.ready) : gated;

  // 🟡 the quant flag ranks WITHIN the returned set, so it is computed
  //   after the ready filter — a climb is only meaningful against the rows
  //   the human is actually looking at
  const priorities = flagQuantDisagreement(kept);

  return { verb: 'get', count: priorities.length, priorities };
};

/**
 * .what = drop one priority — idempotent, an absent slug is no error
 *
 * 🔴 .why the edges go with it
 *   an orphan edge names a slug that no longer exists, and `withGates`
 *   reads an absent gater as a SHUT gate. so one delete would silently
 *   freeze every row that priority used to gate, with no error and no
 *   way for a human to see why `--ready` went quiet
 */
export const delPriority = (db, input) => {
  if (!input.slug) throw new ConstraintError('del needs --slug');
  const row = db.prepare('SELECT * FROM priority_live WHERE slug = ?').get(input.slug);

  // 🔴 a del is a departure like any other, so the FK guards it identically
  //   ⚠️ and the ORDER matters: the guard runs before the first DELETE, so a
  //   refusal leaves the store untouched even without the transaction above
  if (row) assertNoOrphansLeft(db, { goal: row.slug, act: 'del' });

  // 🔴 read the edges in SLUGS for the report, and drop them by UUID
  //
  //   measured 2026-09-14, and it is what bought the rekey: four rows were
  //   superseded and deleted, three gate edges pointed at them, and all
  //   three vanished — no refusal, no report, because a slug-keyed edge has
  //   no referent to check against. the count below is that report.
  const edges = db
    .prepare('SELECT before, after FROM goal_orchestration_slug WHERE before = ? OR after = ?')
    .all(input.slug, input.slug);

  const uuid = getGoalUuidOfSlug(db, input.slug);
  if (uuid)
    db.prepare('DELETE FROM goal_orchestration WHERE before = ? OR after = ?').run(uuid, uuid);
  db.prepare('DELETE FROM priority WHERE slug = ?').run(input.slug);

  // ⚠️ the goal row outlives the priority only while some OTHER row still
  //   declares that uri. once none does, the identity has no holder, and to
  //   keep it would leave a uuid nobody can reach and nobody can reuse —
  //   and its serve edges with it. the CASCADE takes those, by construction
  //   🔴 a priority's uri IS its slug — the `goal` column is retired onto it
  if (uuid && !db.prepare('SELECT 1 FROM priority WHERE slug = (SELECT uri FROM goal WHERE uuid = ?)').get(uuid))
    db.prepare('DELETE FROM goal WHERE uuid = ?').run(uuid);

  return {
    verb: 'del',
    dropped: row ? 'yes' : 'absent',
    // reported rather than silent — a human who drops a row has a right to
    // know which parts of the timeline they just unhooked
    gatesDropped: edges.length,
    priority: row ? asPriority(row) : null,
  };
};

/**
 * 🔴 .what = rename or reparent a goal, and carry its whole subtree with it
 *
 * .why it is its own verb rather than a flag on `set`
 *   a strict FK makes a rename unreachable one row at a time — there is no
 *   order of single-row writes that gets you from `bigrock://R` to
 *   `bigrock://S` without a moment where some row's parent does not exist.
 *   the rename is not a property of a row; it is a property of a SUBTREE,
 *   so the verb has to take the subtree as its unit.
 *
 *   ⇒ and that is a feature, not a workaround. `set --slug` now means one
 *     thing only — "this row IS that goal" — and can never silently reshape
 *     the tree for every row beneath it.
 *
 * .what it moves
 *   the row that declares `--from`, plus every row whose uri is beneath it,
 *   with the prefix swapped and the tail preserved.
 *
 * ⚠️ a ROOT KIND flip (`bigrock://R` -> `altrock://R`) touches exactly one
 *   row, because a subrock names the root's SLUG and never its KIND. that
 *   is the invariant paying for itself, and the verb inherits it for free.
 */
export const mvGoal = (db, input) => {
  const { from, to } = input;

  if (!from || !to)
    throw new ConstraintError(
      `goal.mv needs --from and --to, both goal uris:\n` +
        `     rhx eco.priority goal.mv --from 'bigrock://old-name' --to 'bigrock://new-name'`,
    );

  // 🔴 a bare --from is the ONE migration path for a legacy row: it predates
  //   the uri shape, and a rename in place keeps its uuid, its edges, and its
  //   history — where a fresh `set` under a uri would mint a second row beside
  //   it. so --from may be bare when a row holds it; --to never may
  const isLegacyFrom =
    !!from &&
    !GOAL_RE.test(from) &&
    !!db.prepare('SELECT 1 FROM priority WHERE slug = ?').get(from);
  for (const [flag, uri] of [
    ['--from', from],
    ['--to', to],
  ])
    if (!GOAL_RE.test(uri) && !(flag === '--from' && isLegacyFrom))
      throw new ConstraintError(
        `${flag} '${uri}' is not a goal uri. use 'bigrock://<root>', 'altrock://<root>', ` +
          `or 'subrock://<root>/<path>'`,
      );

  if (from === to)
    throw new ConstraintError(`--from and --to are the same goal ('${from}'), so there is no move`);

  // the source must EXIST, for the same reason a gate refuses an unknown
  // slug: a move of a goal nobody declared renames naught and reports success
  const declarants = db.prepare('SELECT slug FROM priority WHERE slug = ?').all(from);
  if (!declarants.length)
    throw new ConstraintError(
      `no priority declares '${from}', so there is no goal to move. list what IS declared:\n` +
        `     rhx eco.priority get --output json | jq -r '.priorities[].slug' | sort -u`,
    );

  // ⚠️ a move INTO your own subtree has no bottom — the parent would end up
  //   beneath the child it carries, and every row on the path would answer
  //   to itself
  if (isGoalBeneath({ deep: to, over: from }))
    throw new ConstraintError(
      `--to '${to}' is beneath --from '${from}', so the move would put a whole inside its own ` +
        `part. move the part out from under it first, or pick a --to outside the subtree`,
    );

  // .what = swap the `from` prefix for the `to` prefix, tail preserved
  const rewrite = (goal) => {
    if (goal === from) return to;
    if (!isGoalBeneath({ deep: goal, over: from })) return goal;
    const { path: fromPath } = asGoalParts(from);
    const { root: toRoot, path: toPath } = asGoalParts(to);
    const { path: goalPath } = asGoalParts(goal);
    const tail = fromPath ? goalPath.slice(fromPath.length + 1) : goalPath;
    return `subrock://${toRoot}/${toPath ? `${toPath}/${tail}` : tail}`;
  };

  const every = db.prepare('SELECT slug FROM priority').all();
  const moved = every
    .map((row) => ({ slug: row.slug, before: row.slug, after: rewrite(row.slug) }))
    .filter((row) => row.after !== row.before);

  // 🔴 a destination already in use is a MERGE, and a merge is a different
  //   intent wearing a rename's clothes. two branches fold into one, nobody
  //   is told, and the move cannot be undone by a second goal.mv
  const settled = new Set(moved.map((row) => row.slug));
  const collision = every.find((row) => !settled.has(row.slug) && row.slug === to);
  if (collision)
    throw new ConstraintError(
      `--to '${to}' is already declared by '${collision.slug}', so this move would MERGE two ` +
        `branches into one rather than rename one. a merge is not reversible by a second ` +
        `goal.mv — say it outright by moving the rows one at a time, or pick a --to nobody holds`,
    );

  // the destination owes the same reference every goal owes. checked against
  // the rows that STAY, so a subtree cannot vouch for its own new parent
  const toSurgoals = asSurgoals(to);
  if (toSurgoals.length) {
    const held = every.some((row) => !settled.has(row.slug) && toSurgoals.includes(row.slug));
    if (!held)
      throw new ConstraintError(
        `--to '${to}' names a part of '${toSurgoals.join("' or '")}', and no priority outside ` +
          `the moved subtree declares that goal. declare the destination's parent first`,
      );
  }

  const now = new Date().toISOString();
  const write = db.prepare('UPDATE priority SET slug = ?, set_at = ? WHERE slug = ?');
  const rename = db.prepare('UPDATE goal SET uri = ?, set_at = ? WHERE uri = ?');

  // 🔴 THIS is what the uuid bought, and it is still one line per goal
  //
  //   the goal keeps its uuid and changes its uri. every gate and every
  //   serve edge holds the uuid, so not one of them is read, rewritten, or
  //   even looked at — a rename touches ONE row per goal, and the edge set is
  //   untouched by construction.
  //
  //   ⚠️ under the old slug-keyed edge, each of the 7 rows this verb moved
  //   in one measured call was a reference the move had to chase. it did
  //   not chase them, and no check existed that could have said so.
  for (const row of moved) rename.run(row.after, now, row.before);

  // 🔴 TWO PASSES over `priority`, through a namespace no uri can occupy —
  //   the same discipline `setGoalColumnRetired` runs, and for the same reason
  //
  //   the rewrite is now on the PRIMARY KEY rather than on a second column, so
  //   a target can equal a source that has not moved yet. that is reachable,
  //   not theoretical: `--from subrock://R/a/b --to subrock://R/a` over rows
  //   `R/a/b` and `R/a/b/b` maps the second onto the first, and one order of
  //   the two writes raises a UNIQUE violation while the other does not.
  //
  //   ⇒ so the sentinel pass is not caution, it is the fix. `\u0000` cannot
  //     match GOAL_RE, so no real uri can collide with a parked key, and the
  //     second pass lands every row against a table that holds none of the old
  //     names (2026-09-21)
  moved.forEach((row, at) => write.run(`\u0000${at}`, now, row.slug));
  moved.forEach((row, at) => write.run(row.after, now, `\u0000${at}`));

  return { verb: 'goal.mv', from, to, count: moved.length, moved };
};
