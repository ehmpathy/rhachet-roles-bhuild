/////////////////////////////////////////////////////////////////////
// .what = the db shape — tables, views, indexes, goal uuids, and the migrations
//
// .why  = a db opened by any version of this module must converge to one shape.
//         the schema and every migration that reaches it live together, so a reader
//         sees the current shape and the path from each prior one in one place
//
// .note = a PART of `ecowork.db.mjs`, cut so one reviewer can hold it
//         whole. only the entry opens the store — this module takes an
//         open `db` handle and never opens one ([case56])
/////////////////////////////////////////////////////////////////////

import { randomUUID } from 'node:crypto';

/////////////////////////////////////////////////////////////////////
// ORCHESTRATION — the gate edge, and the status that closes it
/////////////////////////////////////////////////////////////////////

// 🔴 .what = the lifecycle state of one priority
//
// .why  = a gate is only useful if it can CLOSE. `get --ready` asks
//         "which row has no OPEN gate before it", and with no status
//         column every gate is shut forever — so the query the whole
//         orchestration half exists to answer cannot be computed.
//
//         ⇒ status is neither a quant nor an opine. it is a FACT about
//           the work rather than a measurement of its value or a claim
//           about its worth, so it sorts naught and informs naught. it
//           exists to answer one question: is this gate still shut?
//
// 🔴 .why `enqueued` and NOT `open`
//         `open` is github's word for an issue, and this store already
//         joins against gh issues via ref_task. two vocabularies for one
//         column is the overload `rule.forbid.domain-term-ambiguity`
//         grades — and worse, gh's `open/closed` is a DIFFERENT AXIS
//         from ours: an issue can be open while the work is inflight,
//         and closed while the work was abandoned.
//
// .the four, and what parts them
//         enqueued   ranked, nobody on it
//         inflight   a tree or a clone is on it now
//         done       the work landed. ⇒ this is what OPENS a gate
//         held       deliberately parked — waits on a human, a date, a
//                    decision. distinct from `enqueued` because a held
//                    row must NOT surface in `--ready`
//
// 🟡 .why `held` rather than `blocked`
//         `blocked` is taken twice over — a review severity, and the
//         driver's `--as blocked`. a third sense in a third boundary is
//         how a word comes to mean naught.
export const STATUS_ALLOWED = ['enqueued', 'inflight', 'done', 'held'];
export const STATUS_DEFAULT = 'enqueued';

// .what = the statuses that leave a gate SHUT
// .why  = stated as a set rather than `!== 'done'`, so a fifth status
//         must be classified deliberately rather than default to shut
export const STATUS_OPEN = ['enqueued', 'inflight', 'held'];

// 🔴 .what = what this goal does to the problem it aims at
//
//         solve   removes the problem at its cause. the bleed STOPS
//         clamp   bounds the problem where it is. the bleed CONTINUES,
//                 capped — an alert, a quota, a timeout, a regression test
//
// .why  = the two deliver DIFFERENT QUANTITIES, so a rank that cannot
//         see the kind mis-weighs them. a solve removes `rate`; a clamp
//         truncates the `window` in `rate x window`. to sum them is the
//         same category error rule.forbid.sev-from-cash-alone refuses
//         one level down.
//
// 🔴 .why it is STORED rather than left to --why prose
//         a clamped problem READS as a closed one. the alert ships, the
//         row goes `done`, the dashboard is green — and the waste is
//         still there at exactly the rate it was, because the solve was
//         never scheduled. the kind is what makes that state queryable
//         instead of tribal. see define.eco.solve-vs-clamp
//
// ⚠️ .why NULL is allowed
//         a goal that aims at no problem — a root, a pure decomposition
//         node, a build piece — is neither. the kind is owed by a goal
//         that names a PROBLEM, and the store cannot tell which those
//         are. so an absent kind is legal and renders as absent, never
//         as a default that would lie
export const KIND_ALLOWED = ['solve', 'clamp'];

export const SCHEMA = `
  CREATE TABLE IF NOT EXISTS priority (
    /*
     * 🔴 the slug IS the goal uri. there is no second name, and there never
     *   should have been one.
     *
     *   a priority row IS a goal. so a 'goal' column on it was 'Goal.goal' —
     *   an entity that carries an attribute of its own name. no domain has
     *   that shape, and this one never did: the two were always meant to hold
     *   one value, which is why a guard existed to refuse a --goal that
     *   DIFFERED from --slug.
     *
     * ⚠️ that guard was the wrong rung. it reported a synonym rather than
     *   removed one, and the second name drifted anyway — measured
     *   2026-09-14: 44 of 44 rows, not one slug matched its goal, and six
     *   were coined at a keyboard. 'coachbook-dao-codegen-hygiene' for
     *   '.../sql-dao-generator-codegen-hygiene'. four names, no two alike.
     *
     * ⇒ retired 2026-09-21. setGoalColumnRetired carries the uri onto the
     *   slug and drops the column; its csv half is setStoreGoalRetired.
     *   see rule.prefer.prevent-over-correct — rung 1 is "make it
     *   impossible", never "message it after".
     */
    slug                TEXT PRIMARY KEY,
    kind                TEXT,
    what                TEXT NOT NULL,
    why                 TEXT,
    opine_sev           TEXT NOT NULL,
    opine_urg           TEXT NOT NULL,
    quant_gain_cash     TEXT,
    quant_gain_per      TEXT NOT NULL DEFAULT 'once',
    quant_gain_duration TEXT NOT NULL DEFAULT '1y',
    quant_gain_time     TEXT,
    quant_cost_cash     TEXT,
    quant_cost_per      TEXT NOT NULL DEFAULT 'once',
    quant_cost_duration TEXT NOT NULL DEFAULT '1y',
    quant_cost_time     TEXT,
    quant_asks          INTEGER NOT NULL DEFAULT 1,
    status              TEXT NOT NULL DEFAULT 'enqueued',
    /*
     * ⚠️ there is no 'sponsored' column here, and its absence is the design.
     *   it shipped as INTEGER 0/1 until 2026-09-15 and was RETIRED into
     *   'goal_sponsorship' — a flag cannot say who authorized the budget, why,
     *   or until when. 'sponsored' is now derived by the 'priority_live' view.
     *   setSponsorFlagRetired carries the old column and its 1s forward.
     */
    ref_task            TEXT NOT NULL DEFAULT '[]',
    ref_tree            TEXT NOT NULL DEFAULT '[]',
    /*
     * 🔴 ref_pull is the ONE ref that OUTLIVES the work
     *
     * the three refs are not peers, and their lifespans are what parts them:
     *
     *   ref_task   the seed — a gh issue. permanent, but its CLOSE is
     *              ambiguous: closed-as-done and closed-as-not-planned are
     *              the same state to a reader who only has the flag
     *   ref_tree   the worktree — EPHEMERAL by design. 'git tree del' fells
     *              it the moment the work merges, so the ref points at a
     *              worktree that no longer exists exactly when the answer
     *              is worth the most
     *   ref_pull   the pull request — PERMANENT and UNAMBIGUOUS. 'merged'
     *              is a fact github keeps forever, and it survives the fell
     *
     * ⚠️ .the quotes above are SINGLE on purpose — this comment sits INSIDE
     *   the SCHEMA template literal, so a backtick here ends the literal and
     *   the whole module dies with 'SyntaxError: Unexpected identifier'.
     *   measured 2026-09-14: every eco.priority call exited 💥 until the four
     *   backticks in this block became quotes
     *
     * ⇒ so a row that tracks only a tree can answer "is work underway?" and
     *   can NEVER answer "did it ship?" — the instant it ships, the tree is
     *   pruned and the evidence with it. that is the gap ref_pull closes
     */
    ref_pull            TEXT NOT NULL DEFAULT '[]',
    /*
     * 🔴 the last sync that saw this row's TREE alive. null = never seen
     *
     * this is what makes 'held' 💤 DERIVABLE rather than hand-asserted.
     * a paused row is not a human's declaration — it is a measurement:
     *
     *   a tree WAS created for this, and no sync has seen it live lately
     *
     * ⇒ so the three tree states are a clock, not a flag:
     *     seen within the window   → the crew is on it       🌾 inflight
     *     seen, but long ago       → sprouted and walked away 💤 held
     *     never seen               → no tree yet              💧 seeded
     *
     * ⚠️ it is a SEPARATE clock from 'seen_at', which counts how often a
     *   HUMAN reached for the row. one measures the work, one measures the
     *   attention, and a row can move on either with the other still
     */
    seen_tree_at        TEXT,
    seen_at             TEXT NOT NULL,
    set_at              TEXT NOT NULL
  );

  /*
   * 🔴 the GOAL entity — uuid PRIMARY, uri UNIQUE, and every edge keys on uuid
   *
   * a goal had no table. it was a TEXT column on priority, and the edges keyed
   * on two different namespaces: gate on slug, serve on goal uri. one graph,
   * two key spaces, no join.
   *
   * ⇒ the split that fixes it is the one 'rule.require.uuid-primary-natural-unique'
   *   states (dispatched to ehmpathy/rhachet-roles-ehmpathy 2026-09-14):
   *
   *     primary = [uuid]   meaningless on purpose. what every FK holds
   *     unique  = [uri]    the natural key. what a human says, greps, renames
   *
   * 🔴 .why the natural key CANNOT be the primary key here
   *   'goal.mv' renames a uri, and renames cascade over a subtree — one move
   *   rewrote 7 rows, measured. with a uri-keyed edge, every one of those is a
   *   reference the move must chase and repoint. with a uuid-keyed edge, the
   *   move touches ONE column on ONE row and every edge survives untouched, by
   *   construction.
   *
   *   ⚠️ 'rule.require.immutable-refs' says a primary key must be immutable. a
   *   renameable uri can never satisfy that, so the rule is satisfiable only by
   *   a minted uuid — never by a cleverer choice of natural key.
   *
   * 🔴 .the cost this repays, measured 2026-09-14
   *   four rows were superseded and deleted. three gate edges pointed at them
   *   by SLUG and vanished with them — no refusal, no report, because a
   *   slug-keyed edge has no referent to check against. a uuid FK makes that
   *   delete a constraint violation instead of a silent loss.
   */
  CREATE TABLE IF NOT EXISTS goal (
    uuid   TEXT PRIMARY KEY,
    uri    TEXT NOT NULL UNIQUE,
    set_at TEXT NOT NULL
  );

  /*
   * 🔴 ORCHESTRATION — the must-precede edge. "what has to happen first?"
   *
   * ⚠️ .why the table is NOT named "gate", which it was until 2026-09-15
   *   "gate" is overloaded across this repo. in repo=.this/role=any/briefs it
   *   names a CHECK THAT REFUSES TO EXIT 0 — a commit quota, a foreman-only
   *   grant, the entrance gate. here it named a TIME ORDER. one word, two
   *   concepts (rule.forbid.domain-term-ambiguity).
   *
   * ⇒ "orchestration" is not a coinage. it is the word
   *   define.eco.decomposition-vs-orchestration already declares for this
   *   exact relation — the tables were the half that drifted, so this is a
   *   conform rather than a rename (rule.forbid.domain-term-inconsistency).
   *
   * ⚠️ what this table does NOT hold: the DERIVED edges. a part gates its
   *   whole by construction, and that half is read from the goal graph, never
   *   stored (define.invariant.eco.a-part-gates-its-whole). so this holds the
   *   edges a human DECIDED, and only those.
   */
  CREATE TABLE IF NOT EXISTS goal_orchestration (
    before TEXT NOT NULL REFERENCES goal(uuid) ON DELETE CASCADE,
    after  TEXT NOT NULL REFERENCES goal(uuid) ON DELETE CASCADE,
    set_at TEXT NOT NULL,
    PRIMARY KEY (before, after)
  );

  /*
   * 🔴 the EXTRA parent edges — what makes the rock model a DAG
   *
   * a goal uri carries ONE path, so it names ONE parent chain. that is a
   * TREE, and a tree cannot express the goal that serves two roots — which
   * is the entire case define.invariant.eco.gain-propagates-down-and-sums
   * was written to make pay. "N birds, one stone" is un-storable in a path.
   *
   * ⇒ so the parent relation moves OUT of the string, for the extra edges
   *   only. the path-implied parent stays implied and is never stored: a
   *   fact with two homes is a fact that can drift, and the implied one is
   *   what keeps a promotion free (define.eco.rock-lifecycle-and-treestruct).
   *
   * ⚠️ this is NOT goal_orchestration. orchestration is an ORDER — A before
   *   B. decomposition is a PART-OF — A is part of B. the two are separate on
   *   purpose (define.eco.decomposition-vs-orchestration), and a part gates
   *   its whole by construction, so every decomposition edge implies an
   *   orchestration edge and no orchestration edge may restate one.
   *
   * ⚠️ .why the table is NOT named "serve", which it was until 2026-09-15
   *   "serve" did double duty INSIDE this store: a subrock slug is also read
   *   as "this row serves that bigrock", so the word named both the path-implied
   *   parent and the stored extra one, and could not tell you which
   *   (rule.forbid.domain-term-ambiguity).
   */
  CREATE TABLE IF NOT EXISTS goal_decomposition (
    part   TEXT NOT NULL REFERENCES goal(uuid) ON DELETE CASCADE,
    whole  TEXT NOT NULL REFERENCES goal(uuid) ON DELETE CASCADE,
    set_at TEXT NOT NULL,
    PRIMARY KEY (part, whole)
  );

  /*
   * 🔴 SPONSORSHIP — the EPISODE, not the flag. who, why, since, until
   *
   * this replaces 'priority.sponsored', an INTEGER 0/1 that shipped until
   * 2026-09-15. the flag could answer exactly one question — "is it funded
   * right now?" — and the three a human actually asks were unanswerable:
   *
   *   who authorized this?           the flag records no author
   *   why did they?                  the flag records no reason
   *   until when?                    the flag has no clock at all
   *
   * ⇒ so every sponsorship read as PERMANENT and AUTHORLESS. a budget grant
   *   made for one sprint stayed at the top of the rank forever, and nobody
   *   could name the human who made it or the case they made.
   *
   * 🔴 .why sponsored is now DERIVED and no longer stored
   *   a flag beside a record is one fact with two homes, and this store
   *   refuses that everywhere else (the path-implied parent is not stored;
   *   the derived precede edge is not stored; the views hold no fact of
   *   their own). a hand-edit of priority.csv could set sponsored=1 on a row
   *   whose sponsorship lapsed in march, and no read would disagree.
   *
   *   ⇒ so 'sponsored' is a QUERY over this table, rendered by the
   *     'priority_live' view. see define.prioritized-vs-sponsored
   *
   * ⚠️ .why until is NULLABLE, and what null means
   *   null = open-ended, never "unknown". a human who sponsors with no end
   *   date has said "until I say otherwise", and that is a real, common, and
   *   honest state. an UNTIL that lapses is the other real state, and the
   *   render owes an expiry note rather than a silent demotion — a row that
   *   falls off the top of the rank with no word is the exact
   *   term=false-report this store exists to refuse.
   *
   * ⚠️ .why who is NULLABLE
   *   only for the 2026-09-15 migration. the flag it carried forward recorded
   *   no author, so a minted 'who' would be a fabrication — the same defect
   *   rule.forbid.fabricated-opines names one level up. a null 'who' renders
   *   as "unattributed" and is a repair a human is asked to make, never a
   *   default a new sponsorship may take.
   *
   * 🔴 .why it keys on goal(uuid) rather than priority(slug)
   *   the flag was keyed on the ROW. a budget is authorized on an OBJECTIVE,
   *   and the two coincide only while 'slug === goal' holds. to key on the
   *   goal means a sponsorship survives a row rename, a row split, and a
   *   'goal.mv' — all three of which the slug key would have dropped.
   */
  CREATE TABLE IF NOT EXISTS goal_sponsorship (
    uuid   TEXT PRIMARY KEY,
    goal   TEXT NOT NULL REFERENCES goal(uuid) ON DELETE CASCADE,
    who    TEXT,
    why    TEXT,
    since  TEXT NOT NULL,
    until  TEXT,
    set_at TEXT NOT NULL
  );
`;

/**
 * 🔴 .what = the two edge tables, rendered back in the words a caller speaks
 *
 * .why  = every FK column above holds a uuid, and NOT ONE caller holds one.
 *         `--gates` takes a slug, `--surgoal` takes a uri, and the render
 *         prints both. so without these, the uuid rekey would have rippled
 *         into ~10 read sites and every one of them would have had to learn
 *         a two-hop join.
 *
 *         ⇒ a view pays that join ONCE, in the schema, and every read keeps
 *           the shape it already had. the uuid stays where it belongs —
 *           between the tables — and never reaches a human.
 *
 * ⚠️ `getAllStoredTables` filters `type = 'table'`, so a VIEW is dumped by
 *    nobody and restored by nobody. that is deliberate: a view holds no
 *    fact of its own, and a second copy of a fact is a fact that can drift.
 */
/**
 * 🔴 .what = "now", spelled so it compares against a js ISO timestamp
 *
 * .why  = every timestamp this store writes is `new Date().toISOString()`,
 *         and every comparison against one is LEXICOGRAPHIC — sqlite has no
 *         date type, so `since <= now` is a string compare on the raw text.
 *
 *         ⇒ the two spellings must match to the character. sqlite's own
 *           `datetime('now')` yields `2026-09-15 17:33:17` — a space where
 *           the js form has a `T`, no milliseconds, no `Z`. compare that
 *           against `2026-09-15T17:33:17.762Z` and `'2026-09-15 …' < '2026-09-15T…'`
 *           holds for EVERY row, because a space sorts below `T`.
 *
 * 🔴 .why that defect would not announce itself
 *         it does not throw. it renders every sponsorship as live, forever,
 *         which is exactly the state this table was built to end. so the
 *         format string is the whole guarantee, and `%f` (not `%S`) plus the
 *         literal `Z` are the two halves a reader is most likely to trim.
 */
export const SQL_NOW = `(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`;

export const VIEWS = `
  CREATE VIEW IF NOT EXISTS goal_orchestration_slug AS
    SELECT pb.slug AS before, pa.slug AS after, o.set_at AS set_at
      FROM goal_orchestration o
      JOIN goal gb     ON gb.uuid = o.before
      JOIN goal ga     ON ga.uuid = o.after
      JOIN priority pb ON pb.slug = gb.uri
      JOIN priority pa ON pa.slug = ga.uri;

  CREATE VIEW IF NOT EXISTS goal_decomposition_uri AS
    SELECT gp.uri AS part, gw.uri AS whole, d.set_at AS set_at
      FROM goal_decomposition d
      JOIN goal gp ON gp.uuid = d.part
      JOIN goal gw ON gw.uuid = d.whole;

  CREATE VIEW IF NOT EXISTS goal_sponsorship_uri AS
    SELECT g.uri AS goal, s.who AS who, s.why AS why,
           s.since AS since, s.until AS until, s.set_at AS set_at,
           CASE
             WHEN s.since <= ${SQL_NOW} AND (s.until IS NULL OR s.until > ${SQL_NOW})
             THEN 1 ELSE 0
           END AS live
      FROM goal_sponsorship s
      JOIN goal g ON g.uuid = s.goal;

  /*
   * 🔴 the read surface for priority — 'sponsored' DERIVED, never stored
   *
   * every read of a priority goes through this view rather than the table,
   * and the one thing it adds is the column the table no longer holds.
   *
   * .why a VIEW rather than a join at each call site
   *   the same reason the two edge views exist: pay the join ONCE, in the
   *   schema, so ~5 read sites and the ORDER BY keep the shape they had. a
   *   per-site join is a second copy of the predicate, and a predicate with
   *   two homes is one that can drift.
   *
   * ⚠️ .why the clock is sqlite's and not the caller's
   *   a view takes no parameter, so 'now' must come from sqlite. the format
   *   string below is chosen to match 'new Date().toISOString()' EXACTLY —
   *   '2026-09-15T17:33:17.762Z' — because every timestamp this store writes
   *   is a js ISO string and the comparison is lexicographic. drop the 'Z',
   *   use a space instead of the 'T', or take '%S' over '%f', and the
   *   comparison silently reads every sponsorship as lapsed.
   *
   * 🔴 .the bound — a WRITE must still target the table
   *   sqlite will not update through this view, and that is the correct
   *   failure: 'sponsored' is not a column a caller may set. the writer is
   *   setSponsorship, which appends an EPISODE rather than flips a bit.
   */
  CREATE VIEW IF NOT EXISTS priority_live AS
    SELECT p.*,
           CASE WHEN EXISTS (
             SELECT 1
               FROM goal_sponsorship s
               JOIN goal g ON g.uuid = s.goal
              WHERE g.uri = p.slug
                AND s.since <= ${SQL_NOW}
                AND (s.until IS NULL OR s.until > ${SQL_NOW})
           ) THEN 1 ELSE 0 END AS sponsored,
           (SELECT MIN(s.until)
              FROM goal_sponsorship s
              JOIN goal g ON g.uuid = s.goal
             WHERE g.uri = p.slug
               AND s.until IS NOT NULL
               AND s.since <= ${SQL_NOW}
               AND s.until > ${SQL_NOW}) AS sponsored_until
      FROM priority p;
`;

/////////////////////////////////////////////////////////////////////
// the GOAL identity — uri in, uuid out
/////////////////////////////////////////////////////////////////////

/**
 * .what = the uuid of a goal uri. mints one on first sight
 *
 * 🔴 .why FINDSERT rather than insert — a uuid is minted ONCE, ever
 *   the uuid is the identity. to mint a second one for a uri that already
 *   has one would split the goal in two: half its edges point at the old
 *   uuid, half at the new, and each half reads as a complete set.
 *
 * ⚠️ so this is the ONLY place a uuid is ever created, and the UNIQUE on
 *    `uri` is what makes that enforceable rather than merely intended.
 */
export const genGoalUuid = (db, { uri, now }) => {
  const held = db.prepare('SELECT uuid FROM goal WHERE uri = ?').get(uri);
  if (held) return held.uuid;
  const uuid = randomUUID();
  db.prepare('INSERT INTO goal (uuid, uri, set_at) VALUES (?, ?, ?)').run(uuid, uri, now);
  return uuid;
};

/** .what = the uuid of a goal uri, or null. never mints one */
export const getGoalUuid = (db, uri) =>
  db.prepare('SELECT uuid FROM goal WHERE uri = ?').get(uri)?.uuid ?? null;

/**
 * .what = the uuid of the goal one PRIORITY declares
 *
 * .why  = `--gates` names a row, never a goal, and that is correct: a gate
 *         is an order between two pieces of WORK. the uuid it stores is the
 *         work's goal, and a row IS its goal — which is what lets the two
 *         edge tables share a keyspace at all. they could not, when gate
 *         keyed on slug and serve on uri.
 *
 * ⚠️ .why the join survives the retirement
 *   it reads `g.uri = p.slug` rather than a column, so it still asks the one
 *   question worth asking: is this slug a uri the `goal` table has minted? a
 *   row whose slug was never minted returns null, which is the honest answer
 *   and the reason this is not merely `getGoalUuid(db, slug)`.
 */
export const getGoalUuidOfSlug = (db, slug) =>
  db
    .prepare('SELECT g.uuid AS uuid FROM priority p JOIN goal g ON g.uri = p.slug WHERE p.slug = ?')
    .get(slug)?.uuid ?? null;

// 🔴 .why the indexes are SEPARATE from the table ddl, and run LAST
//
//   an index names a column, so `CREATE INDEX ... ON priority (goal)`
//   throws `no such column: goal` on a table that predates the column —
//   BEFORE the migration that would have added it ever runs.
//
// ⚠️ and it throws the IDENTICAL message the later SELECT would, which is
//   what makes it costly: the error points at the query the caller ran
//   and comes from a statement in the open path. measured 2026-09-13 —
//   the migration was correct and unreachable, and the clamp that caught
//   it looked like it had caught the bug it was written for.
//
//   ⇒ so the order is: table -> MIGRATE -> indexes. an index may only ever
//     be built against a schema that is already current.
export const INDEXES = `
  CREATE INDEX IF NOT EXISTS priority_sev ON priority (opine_sev);
  CREATE INDEX IF NOT EXISTS priority_urg ON priority (opine_urg);
  /*
   * ⚠️ there is no 'priority_goal ON priority (goal)' here, and its absence is
   *   the design. the column was retired 2026-09-21 — the slug IS the goal
   *   uri, so 'priority' (the PRIMARY KEY index) already covers every lookup
   *   that index served. do NOT restore it; it names a column that is gone,
   *   and 'CREATE INDEX' throws 'no such column' in the OPEN path, where the
   *   error reads as a defect in whatever query the caller happened to run.
   *
   * 🔴 the quotes above are SINGLE on purpose. this comment sits INSIDE a js
   *   template literal, so a backtick here TERMINATES the string and every
   *   line below it parses as javascript. measured 2026-09-21: it threw
   *   SyntaxError at module load, which took down every eco.priority read —
   *   and with it the star scope that git.crew.poll filters the fleet by.
   */
  CREATE INDEX IF NOT EXISTS priority_status ON priority (status);
  CREATE INDEX IF NOT EXISTS priority_kind ON priority (kind);
  CREATE INDEX IF NOT EXISTS goal_sponsorship_goal ON goal_sponsorship (goal);
  /*
   * ⚠️ 'until' is indexed and 'since' is not, on purpose. the query that runs
   *   on every read asks "what lapses next?" and is bounded by until; 'since'
   *   only ever filters a sponsorship dated in the future, which is rare
   */
  CREATE INDEX IF NOT EXISTS goal_sponsorship_until ON goal_sponsorship (until);
  CREATE INDEX IF NOT EXISTS goal_orchestration_before ON goal_orchestration (before);
  CREATE INDEX IF NOT EXISTS goal_orchestration_after ON goal_orchestration (after);
  CREATE INDEX IF NOT EXISTS goal_decomposition_part ON goal_decomposition (part);
  CREATE INDEX IF NOT EXISTS goal_decomposition_whole ON goal_decomposition (whole);
`;

// 🔴 .what = columns added AFTER the first schema shipped, and their ddl
//
// .why  = `CREATE TABLE IF NOT EXISTS` adds no column to an extant table.
//         so a store that gains a field works on a fresh db and dies on
//         every db that already exists — `no such column: goal`, reported
//         to the human as a store malfunction.
//
// 🔴 .why no clamp caught it, and this is the durable lesson
//         every clamp provisions a FRESH temp db, so the whole suite is
//         blind to migration by construction. a green suite declared the
//         schema sound while the only real store was broken. measured
//         2026-09-13, on the first `get --goal` against `.eco/priority.db`
//
//         ⇒ the clamp that catches it must open a db built by the PRIOR
//           schema. see [case13] in ecowork.goal.integration.test.ts
//
// ⚠️ a NEW TABLE needs no entry here — `CREATE TABLE IF NOT EXISTS` in
//   SCHEMA already raises an old db to hold it. only a COLUMN on an
//   extant table is invisible to that, which is what this list is for
export const MIGRATIONS = [
  /*
   * ⚠️ 'goal' had an entry here and it is GONE, deliberately — retired
   *   2026-09-21. the slug IS the goal uri, so the column was a second name
   *   for one value. do NOT restore it.
   *
   * 🔴 an ADD COLUMN here would re-create on every open what
   *   setGoalColumnRetired just dropped, so the retirement would LOOP: each
   *   open re-adds an empty column, the retirement copies an empty value onto
   *   the slug, and every row's primary key is blanked. the 'sponsored' note
   *   below is the same trap for the same reason.
   *
   * ⇒ the forward path for a legacy db is setGoalColumnRetired; for a legacy
   *   csv it is setStoreGoalRetired.
   */
  {
    column: 'status',
    // 🔴 NOT NULL with a DEFAULT is safe on ALTER — sqlite backfills every
    //   extant row with it. and `enqueued` is the honest backfill: a row
    //   written before this column existed recorded no progress, so to
    //   assume `done` would open every gate the moment the store upgrades
    ddl: `ALTER TABLE priority ADD COLUMN status TEXT NOT NULL DEFAULT '${STATUS_DEFAULT}'`,
  },
  {
    column: 'kind',
    // 🔴 NULLABLE on purpose, and this is the honest backfill. every row
    //   written before this column existed declared no kind, and the
    //   store cannot infer one — a guess of `solve` would report a
    //   removal nobody performed. absent is the true value
    ddl: 'ALTER TABLE priority ADD COLUMN kind TEXT',
  },
  /*
   * ⚠️ 'sponsored' had an entry here and it is GONE, deliberately — retired
   *   2026-09-15 into 'goal_sponsorship'. do NOT restore it. an ADD COLUMN
   *   here would re-create the column setSponsorFlagRetired just dropped, on
   *   every single open, so the retirement would loop and the 'priority_live'
   *   view would carry two columns named 'sponsored'.
   *
   * ⇒ the forward path for a legacy db is setSponsorFlagRetired below; the
   *   forward path for a legacy csv is the same function's file half.
   */
  {
    column: 'ref_pull',
    // 🔴 `'[]'` is the honest backfill — a row written before this column
    //   existed named no pull request, and the store cannot infer one.
    //   an empty ref set reads as "no pull is known", which is true
    ddl: `ALTER TABLE priority ADD COLUMN ref_pull TEXT NOT NULL DEFAULT '[]'`,
  },
  {
    column: 'seen_tree_at',
    // 🔴 NULLABLE on purpose. null means "no sync has ever seen this
    //   row's tree alive", which is exactly true of every row written
    //   before the sync existed. a backfill of `now` would claim a
    //   sighting nobody made, and the snoozed window keys on this clock —
    //   so a fabricated value would read every stale row as inflight
    ddl: 'ALTER TABLE priority ADD COLUMN seen_tree_at TEXT',
  },
];

/**
 * .what = raise an extant table to the declared schema
 * .why  = idempotent by construction — it asks the table what it holds
 *         rather than tracks a version number that can drift from reality
 *         (rule.require.idempotent-operations)
 */
export const setSchemaMigrated = (db) => {
  const held = new Set(db.prepare('PRAGMA table_info(priority)').all().map((c) => c.name));
  for (const { column, ddl } of MIGRATIONS) if (!held.has(column)) db.exec(ddl);
};

/**
 * 🔴 .what = retire `priority.sponsored` into `goal_sponsorship` — the DB half
 *
 * .why  = a column cannot be un-declared by a schema edit. `CREATE TABLE IF
 *         NOT EXISTS` is a no-op on an extant table, so a store that has been
 *         opened once keeps `sponsored` forever unless something drops it —
 *         and `priority_live` would then emit TWO columns named `sponsored`,
 *         with better-sqlite3 handing back whichever came last. a silent
 *         coin-flip between the retired flag and the live derivation.
 *
 * 🔴 .why it runs BEFORE the views and BEFORE the restore
 *   the view names the column, so it must not exist when the view is built.
 *   and the restore writes every csv column into the table, so the csv half
 *   (in setStoreFilesRenamed) must have stripped it by then too. the two
 *   halves are separate functions because they run at different moments.
 *
 * ⚠️ .why the 1s are carried rather than dropped
 *   five rows read `sponsored = 1` on 2026-09-15, and each is a budget a
 *   human authorized. to drop the column without them would silently
 *   defund five sponsored objectives — the loudest possible instance of the
 *   silent-loss class the uuid rekey was adopted to end.
 *
 * ⚠️ .why `who` and `why` come out NULL
 *   the flag recorded neither, so any value here would be invented. a null
 *   renders as `unattributed` and asks a human to repair it
 *   (rule.forbid.fabricated-opines — a store may not author a human's word).
 */
export const setSponsorFlagRetired = (db, now) => {
  const held = db.prepare('PRAGMA table_info(priority)').all().map((c) => c.name);
  if (!held.includes('sponsored')) return false;

  // 🔴 the goal may not have a uuid yet on a db this old, so findsert it.
  //   a row with no goal at all cannot be sponsored — a budget is authorized
  //   on an objective, and that row names none. it is reported, never dropped
  //   in silence
  const orphans = [];
  for (const row of db.prepare('SELECT slug, goal FROM priority WHERE sponsored = 1').all()) {
    if (!row.goal) {
      orphans.push(row.slug);
      continue;
    }
    const uuid = genGoalUuid(db, { uri: row.goal, now });
    const live = db.prepare('SELECT 1 FROM goal_sponsorship WHERE goal = ?').get(uuid);
    if (live) continue; // idempotent — a second open must not mint a rival episode
    db.prepare(
      'INSERT INTO goal_sponsorship (uuid, goal, who, why, since, until, set_at) ' +
        'VALUES (?, ?, NULL, ?, ?, NULL, ?)',
    ).run(
      randomUUID(),
      uuid,
      'carried from the retired priority.sponsored flag on 2026-09-15. the flag ' +
        'recorded no author and no reason, so both are absent here rather than ' +
        'invented — a human is owed a --sponsor-who and a --sponsor-why on this row',
      now,
      now,
    );
  }

  if (orphans.length)
    console.error(
      `⚠️ ${orphans.length} row(s) read sponsored=1 and name no goal, so no sponsorship ` +
        `could be keyed for them: ${orphans.join(', ')}\n` +
        `   ⇒ a budget is authorized on an OBJECTIVE, and these rows declare none.\n` +
        `   fix: give each a --goal, then re-sponsor it with --sponsor-who/--sponsor-why`,
    );

  db.exec('DROP INDEX IF EXISTS priority_sponsored');

  // 🔴 sqlite re-parses EVERY view after ANY `DROP COLUMN` and refuses the
  //   drop when one of them no longer resolves — whatever column THAT view
  //   names. so a view left stale by a PEER migration blocks this one.
  //
  //   measured 2026-09-21: this line threw `error in view
  //   goal_orchestration_slug after drop column: no such column: pb.goal` —
  //   a view this function never reads, over a column it never touches. the
  //   open path dropped it one statement LATER, which was too late. every
  //   eco.priority read was down, and with it the star scope that
  //   git.crew.poll filters the whole fleet by.
  //
  //   ⇒ so the drop of a dependent view belongs BESIDE the alter that needs
  //     it, never in the caller. a view is derived; `db.exec(VIEWS)` in the
  //     open path rebuilds both from the one current definition.
  db.exec(`
    DROP VIEW IF EXISTS priority_live;
    DROP VIEW IF EXISTS goal_orchestration_slug;
  `);
  db.exec('ALTER TABLE priority DROP COLUMN sponsored');
  return true;
};

/**
 * 🔴 .what = retire `priority.goal` onto `priority.slug` — the DB half
 *
 * .why  = a priority row IS a goal, so a `goal` column on it read as
 *         `Goal.goal` — an entity that carries an attribute of its own name.
 *         the two were always one value, which is why a guard existed to
 *         refuse a `--goal` that differed from `--slug`.
 *
 * 🔴 .why the migration is `slug := goal` and never the reverse
 *   the goal uri is the REAL name — it carries the kind (`bigrock://`) and the
 *   path, so it states where the row sits in the rock tree. the legacy slug is
 *   the coined one, and coined is what it measurably was: 2026-09-14, 44 of 44
 *   rows disagreed with their goal, and six had been typed by hand into a
 *   fourth spelling. to keep the slug would keep the drift and discard the
 *   only name the tree can read.
 *
 * ✅ .why it cannot collide on the primary key
 *   measured 2026-09-14: 44 rows, 44 DISTINCT goal uris. and the store's own
 *   UNIQUE on `goal.uri` is what makes that a guarantee rather than a happy
 *   sample — two rows cannot declare one uri and be told apart.
 *
 * 🔴 .why no edge needs a repoint
 *   every edge FKs to `goal(uuid)`, never to `priority.slug` — which is the
 *   property the uuid-primary rekey was bought for
 *   (define.invariant.eco.goal-is-uuid-primary-uri-unique). so a slug rewrite
 *   is ONE column on N rows and no reference at all. the code that deferred
 *   this sweep as "a real migration" had that backwards.
 *
 * ⚠️ .why a null goal is REPORTED rather than dropped or guessed
 *   a row with no goal has no uri to become, so its slug is left as it stands
 *   and the human is told. to mint one would be a fabricated name for an
 *   objective nobody declared, and to drop the row would be a silent loss of
 *   the exact class this store refuses.
 */
export const setGoalColumnRetired = (db, now) => {
  const held = db.prepare('PRAGMA table_info(priority)').all().map((c) => c.name);
  if (!held.includes('goal')) return false;

  const rows = db.prepare('SELECT slug, goal FROM priority').all();
  const mute = rows.filter((row) => !row.goal).map((row) => row.slug);
  const moved = rows.filter((row) => row.goal && row.goal !== row.slug);

  // 🔴 every goal uri owes a uuid BEFORE the slug is rewritten. a row whose
  //   goal was never minted would otherwise lose its only uri here, and the
  //   edges it should have carried would have no referent to key on
  for (const row of rows) if (row.goal) genGoalUuid(db, { uri: row.goal, now });

  /*
   * 🔴 TWO PASSES, through a namespace no uri can occupy.
   *
   * the final slugs are distinct, so the END state cannot collide. an
   * INTERMEDIATE one can, and sqlite refuses on the primary key the moment it
   * does: row A moves to 'Y' while row B still holds 'Y' as its own slug.
   *
   * ⚠️ no single-pass ORDER fixes that in general — the rewrites form a
   *   permutation, and a permutation with a cycle (A wants B's slug, B wants
   *   A's) has no safe order at all. so a sort is not a weaker version of this;
   *   it is a wrong answer that passes on the common case and throws on the one
   *   a human would least expect.
   *
   * ⇒ '\u0000' is the sentinel because GOAL_RE cannot match it, so no real slug
   *   can ever equal a staged one.
   */
  moved.forEach((row, at) =>
    db.prepare('UPDATE priority SET slug = ? WHERE slug = ?').run(`\u0000${at}`, row.slug),
  );
  moved.forEach((row, at) =>
    db.prepare('UPDATE priority SET slug = ? WHERE slug = ?').run(row.goal, `\u0000${at}`),
  );

  if (mute.length)
    console.error(
      `⚠️ ${mute.length} row(s) declare no goal, so their slug is left as it stands: ` +
        `${mute.join(', ')}\n` +
        `   ⇒ a priority IS a goal, and these name none. a uri cannot be invented for them.\n` +
        `   fix: re-set each with --slug '<scheme>://<the uri>'`,
    );

  db.exec('DROP INDEX IF EXISTS priority_goal');

  // 🔴 the dependent views go BESIDE the alter that needs them gone, never in
  //   the caller — the law `setSponsorFlagRetired` states one screen up, and for
  //   the same measured reason: sqlite re-parses EVERY view after ANY
  //   `DROP COLUMN` and refuses the drop when one no longer resolves.
  //
  //   ⚠️ here the two views name THIS column, so the refusal is not a peer's
  //   stale definition leaking in — it is the direct one, and it would take the
  //   whole store down on open. `db.exec(VIEWS)` rebuilds both from the one
  //   current definition, which reads `p.slug`
  db.exec(`
    DROP VIEW IF EXISTS priority_live;
    DROP VIEW IF EXISTS goal_orchestration_slug;
  `);
  db.exec('ALTER TABLE priority DROP COLUMN goal');
  return true;
};
