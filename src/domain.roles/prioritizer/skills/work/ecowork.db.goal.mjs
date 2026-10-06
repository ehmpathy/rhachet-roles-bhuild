/////////////////////////////////////////////////////////////////////
// .what = the goal uri and its graph — parse, beneath, surgoals, serve edges, orphans
//
// .why  = a goal is a uri with a kind, and the serve graph joins parts to wholes.
//         every read and write verb reaches for these to place a row
//
// .note = a PART of `ecowork.db.mjs`, cut so one reviewer can hold it
//         whole. only the entry opens the store — this module takes an
//         open `db` handle and never opens one ([case56])
/////////////////////////////////////////////////////////////////////

import { ConstraintError, CLEAR } from './ecowork.db.vocab.mjs';
import { genGoalUuid, getGoalUuid } from './ecowork.db.schema.mjs';

// 🔴 .what = the vocabulary of a GOAL URI — which is what a priority's
//         `slug` is. a row IS a goal, and this is the shape of its name
//
// .why  = a rank of individual rows cannot answer "do we actually move
//         the objective we said mattered?". three rows that each read p1
//         may serve one objective or three, and a flat list hides which.
//         `get --slug bigrock://sandpine.decost` is the question the queue
//         this store replaces could never answer.
//
//         ⇒ and it is the ONE axis that can promote a row a cash figure
//           would demote: a cheap row that unblocks two expensive ones
//           earns its place through its place in the tree, never through
//           its own net.
//
// 🔴 .why it is the SLUG rather than a column beside it
//         a priority row IS a goal, so a `goal` column on it read as
//         `Goal.goal` — an entity that carries an attribute of its own
//         name. it held one for months and drifted on every row
//         (measured 2026-09-14: 44 of 44 slugs disagreed with their goal).
//         retired 2026-09-21 — `setGoalColumnRetired` carries the uri onto
//         the slug, and the column is gone.
//
// 🟡 .why a plain value rather than a ref
//         ref_task and ref_tree point at records that EXIST elsewhere —
//         a gh issue, a worktree. a goal is a label a human coins on the
//         spot, so there is no record to point at, and a ref shape would
//         promise one.
//
// 🔴 .why the value is a URI — `bigrock://sandpine.decost`, never bare
//
//         a bare `sandpine.decost` is AMBIGUOUS ABOUT ITS OWN KIND, and the
//         ambiguity is unbuyable once a second kind exists. it already
//         does: an `altrock` beside a bare `sandpine.decost` leaves a
//         reader unable to part "this one IS a bigrock" from "nobody
//         recorded the kind". that is a term=false-report in the
//         reader-inference family — the value is correct about itself and
//         false about the caller's question.
//
//         ⇒ and the fix has an expiry. the scheme costs naught while the
//           table is empty and costs a migration of every row after.
//
// 🔴 .the three kinds, settled by the wisher 2026-09-13
//
//         bigrock://<root>          the MAINQUEST — the objective we
//                                   committed to. few, on purpose (covey:
//                                   the big rocks go in first, or they
//                                   never fit at all)
//         altrock://<root>          the SIDEQUEST — real work, worth the
//                                   spend, off the main line. the sand
//                                   that fills the gaps between the rocks
//         subrock://<root>/<path>   a DECOMPOSITION of a root rock. it
//                                   names the root SLUG and never its
//                                   kind, and nests as deep as it needs
//
// 🔴 .the invariant that makes the whole shape work
//
//         > A SUBROCK NAMES THE ROOT'S SLUG. IT NEVER NAMES THE ROOT'S KIND.
//
//         because a root rock is EXPECTED to flip — a sidequest that
//         earns the main line becomes a bigrock, and a mainquest we stop
//         to defend becomes an altrock. that promotion is a one-row edit:
//
//           altrock://sandpine.decost  ->  bigrock://sandpine.decost
//
//         and EVERY subrock beneath it is untouched, because not one of
//         them ever claimed which kind their root was. encode the kind in
//         the child and the same promotion becomes a rewrite of every
//         descendant — the exact migration cost the uri exists to dodge.
//
// 🔴 .why the separator is `/` and not `.`
//         a root slug already holds dots (`sandpine.decost`), so
//         `subrock://sandpine.decost.acu-tune` cannot be split back into a
//         root and a child — the boundary is unrecoverable. a uri PATH is
//         exactly the tool for this: the authority is the root, the path
//         is the decomposition, and `split('/')` yields the tree.
//
// 🔴 .why a filter ROLLS UP rather than matches exactly
//         a decomposition that does not roll up is no decomposition. ask
//         for `bigrock://sandpine.decost` and an exact match returns the
//         root alone — omitting every row that does the actual work,
//         while it reports a count that reads complete
//         (term=partial-audit). so a goal filter matches the goal AND
//         everything beneath it.
//
//         ⇒ a leaf rolls up to itself, so the rule needs no special case.
//
//         ⚠️ and the rollup must reach a subrock from EITHER root kind,
//           since the child does not know which its root is today. the
//           filter therefore matches on the root SLUG, never the scheme.
//
// 🟡 .the flat root namespace this rests on
//         `bigrock://foo` and `altrock://foo` are the SAME rock in two
//         lifecycle states, never two rocks. a human who coins one slug
//         for two objectives has made the same error as two priorities
//         with one slug, and the store cannot tell them apart.
//
//         ⇒ the kind is a STATE of a root, not part of its identity.
//
//         ⇒ the kind is a LENS, never a sort key. a p1 altrock outranks a
//           p2 bigrock, and that is correct: sev already asks "how bad if
//           unfixed", so a human who graded a sidequest p1 has said it
//           matters that much. to let the kind reorder would smuggle a
//           categorical label past the opine-first invariant.
//
// 🟡 FULCRUM — should bigrock break a TIE with altrock at equal sev+urg?
//         best-guessed NO, 2026-09-13. that slot currently holds
//         `quant_asks`, a counted fact, and to insert a categorical label
//         above it lets a label outrank a measurement. a human who wants
//         the mainquest first can say so in urg. clean to reverse.
//
// 🔴 .why a CLOSED set rather than any scheme
//         an open scheme accepts `bigrok://sandpine.decost`, files it under
//         a kind nobody declared, and SILENTLY SPLITS the goal in two —
//         `get --slug bigrock://sandpine.decost` then returns a partial set
//         that reads complete (term=partial-audit). a closed set makes
//         the typo impossible rather than detectable
//         (rule.prefer.prevent-over-correct).
//
// 🔴 .why the store REFUSES a bare value rather than merely prefers a uri
//         a convention no tool checks decays into the two-shape column
//         above, one row at a time, and each row that skips it looks
//         reasonable. enforcement at the boundary is what gives the
//         scheme its force (rule.require.pitofsuccess).
//
// ✅ .and this DISSOLVES the goal-vs-bigrock fulcrum rather than settles it
//         `slug` is the SLOT; `bigrock` is the KIND of value in it; `goal`
//         is what the row IS. three words, three senses, none a synonym
//         for another — and no rename is owed.
export const GOAL_KINDS = ['bigrock', 'altrock', 'subrock'];
export const GOAL_ROOT_KINDS = ['bigrock', 'altrock'];
// 🔴 `=` is legal INSIDE a segment, never at its head.
//
//   `key=value` is the established way a path segment names a dimension
//   rather than a place — s3 and hive partition on exactly this shape
//   (`year=2024/month=09`), and this repo's own agent tree is addressed
//   the same way: `repo=.this/role=prioritizer`.
//
//   so a goal uri that decomposes by role reads in the domain's own
//   words — `subrock://rhachet/entool/bhuild/role=prioritizer` — and a
//   grep for `role=prioritizer` finds the directory AND the row.
//
//   ⚠️ the head stays alphanumeric. a segment that OPENS with `=` names
//   an absent key, and `/=prioritizer` reads as a typo rather than a
//   dimension.
export const GOAL_SEG = '[a-z0-9][a-z0-9._=-]*';

// a SUB requires a path; a ROOT may carry one. the split still refuses
// `subrock://x` — a decomposition of naught is not a decomposition.
//
// 🔴 .why a ROOT may now carry a path — corrected by the wisher 2026-09-13
//
//   this once refused `bigrock://x/y`, on the claim that "a root that
//   claims a path claims to be someone's child". that conflated two
//   senses: a path is a NAMESPACE, and only sometimes a parentage claim.
//
//     bigrock://sandpine/entool/coachbook
//                └──┬─┘ └──┬─┘ └──┬──┘
//                  org  concern  rock
//
//   sandpine's three mainquests are `ensell/1klpm`, `entool/coachbook`, and
//   `entool/ledgers`. `entool` is a CONCERN they are filed under, never a
//   rock — no priority declares it and none ever will, so the old rule
//   demanded a parent that cannot exist.
//
//   ⚠️ the invariant that MATTERS is untouched: a subrock still names its
//   root's SLUG and never its KIND, so a promotion is still one row and
//   one field. what changed is only how much of the uri counts as the
//   root — and `asGoalParts` never decided a kind to begin with.
export const GOAL_RE = new RegExp(
  `^(?:(?:${GOAL_ROOT_KINDS.join('|')})://${GOAL_SEG}(?:/${GOAL_SEG})*` +
    `|subrock://${GOAL_SEG}(?:/${GOAL_SEG})+)$`,
);

/**
 * .what = take a goal uri apart — kind, root slug, decomposition path
 * .why  = one split here rather than N at every call site
 *         (rule.forbid.inline-decode-friction). and `root` is the field
 *         that makes the lifecycle traceable: it reads the same from a
 *         root rock and from every subrock beneath it, whatever kind the
 *         root happens to wear today
 */
export const asGoalParts = (uri) => {
  // 🔴 an ABSENT uri and a MALFORMED one both yield naught, and the second
  //   case is the one that bites. `'dispute-or-concede'.split('://')` gives a
  //   one-element array, so `rest` is undefined and `rest.split` threw a raw
  //   `Cannot read properties of undefined` three frames below any caller
  //   that named the field it passed.
  //
  //   ⚠️ measured 2026-09-18: `set --slug dispute-or-concede --status done`
  //   on one of the 44 legacy two-name rows died that way — exit 1, a message
  //   that named no field and no fix, on a row a human could see was fine
  //
  //   ⇒ a parser owes its caller nulls or a refusal, never a stack three
  //     frames deep (rule.require.failloud). the SHAPE check is elsewhere and
  //     already loud; this one's job is to take a uri apart, so a non-uri is
  //     simply a uri with no parts
  if (!uri || !uri.includes('://')) return { kind: null, root: null, path: null };
  const [kind, rest] = uri.split('://');
  const [root, ...segments] = rest.split('/');
  return { kind, root, path: segments.length ? segments.join('/') : null };
};

/**
 * .what = is `deep` a part of `over`, at any depth?
 *
 * 🔴 .why it keys on the ROOT SLUG and never the scheme
 *   a subrock does not know which kind its root wears today, and a root
 *   is expected to flip. the same rule the `--slug` rollup already runs
 *
 * ⚠️ a row is NOT beneath itself. this answers "is it a PART of", and a
 *   whole is not one of its own parts — to say otherwise makes every row
 *   its own prerequisite and no row is ever ready
 */
export const isGoalBeneath = ({ deep, over }) => {
  if (!deep || !over || deep === over) return false;
  const under = asGoalParts(deep);
  const above = asGoalParts(over);
  if (under.root !== above.root) return false;
  if (!under.path) return false; // a root is beneath naught
  if (!above.path) return true; // every subrock is beneath its root
  return under.path.startsWith(`${above.path}/`);
};

/////////////////////////////////////////////////////////////////////
// GOAL REFERENTIAL INTEGRITY — a surgoal must be declared first
/////////////////////////////////////////////////////////////////////

// 🔴 .what a goal EXISTS means
//
//   "the goal `subrock://R/a` exists" means exactly "a priority carries
//   that slug". the slug IS the uri, so the declaration and the row are
//   one fact, and there is no second place to look.
//
//   ⚠️ the `goal` TABLE is not that second place — it holds the durable
//     UUID every edge keys on, minted on first sight of a uri. it records
//     an identity rather than a declaration, and a uuid outlives the row
//     that named it, which is the whole point of the rekey
//
// 🔴 .why the FK is STRICT — and what it refuses
//
//   the shape check alone is not integrity. `subrock://never/a/b` passes
//   GOAL_RE cleanly, so the store accepted a part of a whole nobody ever
//   declared, and reported it `ready: true` — a leaf of a tree with no
//   trunk. measured 2026-09-13.
//
//   that costs three things at once, and each is silent:
//     1. the row is INVISIBLE to the rollup. `get --slug bigrock://R`
//        matches the root and `subrock://R/%`; an orphan under a root
//        nobody declared is in no rollup at all, so every objective read
//        under-reports (term=partial-audit)
//     2. `partsOpen` is derived from the same walk, so an orphan gates
//        naught and is gated by naught. it reads startable forever
//     3. a typo is UNRECOVERABLE by read. `subrock://sandpine.decost/x` and
//        `subrock://sandpine.dcost/x` both pass the shape check and sit in
//        two different trees, and no query names the second as wrong
//
//   ⇒ so the FK is what makes the tree a tree rather than a convention.

/**
 * .what = the SURGOAL uris a goal may name as its parent — the goals one
 *         rung above it, any one of which satisfies the reference
 *
 * 🔴 .why it returns a SET and not one uri
 *   a subrock names its root's SLUG, never its KIND, so `subrock://R/a`
 *   has a parent that is `bigrock://R` OR `altrock://R` and the child
 *   cannot tell which. to demand one kind would break the very flip the
 *   uri shape was designed to survive.
 *
 * ⚠️ a ROOT returns the empty set — it owes no parent, and that is the
 *   base case that gives the recursion a bottom.
 */
export const asSurgoals = (goal) => {
  const { kind, path, root } = asGoalParts(goal);

  // 🔴 a ROOT KIND answers to naught above it — whatever its path depth.
  //   the test is the KIND, never the presence of a path. a bigrock's
  //   path is a namespace (`sandpine/entool/coachbook`), and its leading
  //   segments name CONCERNS that no priority declares — so a parent
  //   derived from them is one that can never exist, and the FK below
  //   would refuse every root rock filed under a concern.
  if (GOAL_ROOT_KINDS.includes(kind)) return [];

  if (!path) return []; // (unreachable for subrock: GOAL_RE demands a path)
  const segments = path.split('/');
  segments.pop();

  // 🔴 the rung above may be a SUBROCK or a ROOT ROCK, at EVERY depth.
  //   now that a root may carry a path, `subrock://sandpine/entool/coachbook/
  //   cert-ingest` has a parent that is `bigrock://sandpine/entool/coachbook`
  //   — a root, three segments deep. to offer the subrock form alone
  //   would orphan every child of a pathed rock, which is the whole set
  //   of them.
  //
  //   ⚠️ the empty-segment case keeps the same shape for the same reason
  //   it always did: at depth 1 the parent is the bare root, and the kind
  //   is unknowable to the child (it flips).
  const above = segments.length ? `${root}/${segments.join('/')}` : root;
  return [
    ...(segments.length ? [`subrock://${above}`] : []),
    ...GOAL_ROOT_KINDS.map((kind) => `${kind}://${above}`),
  ];
};

/////////////////////////////////////////////////////////////////////
// THE DAG — the extra parent edges a path cannot express
/////////////////////////////////////////////////////////////////////

// 🔴 .what the `serve` table adds, and why a path could never carry it
//
//   `asSurgoals` above reads a goal's parent off its PATH. that is exact,
//   free, and drift-proof — and it yields exactly ONE parent chain, so the
//   model it describes is a TREE.
//
//   a tree cannot hold the one goal shape worth the most:
//
//     subrock://sandpine.decost/acu-tune   also serves   bigrock://dev-speed
//
//   there is no path that says that. `acu-tune` lives under `sandpine.decost`
//   by name, and its second parent has nowhere to go.
//
//   ⇒ so the extra edges are STORED and the implied one stays IMPLIED. the
//     split is deliberate rather than tidy: the implied edge is what keeps
//     a root's promotion a one-row edit, and to store it too would give one
//     fact two homes that can disagree.
//
// 🔴 .why the edges point UP — "root-side"
//   a part knows what it serves; a whole does not enumerate its parts. so
//   the edge is written from the part, and every walk that needs the other
//   direction takes the index on `whole`. the gain invariant reads UP
//   (a part draws from each parent) and the cost invariant reads DOWN over
//   DISTINCT nodes — one edge set, read two ways, which is only sound
//   because it is stored once.

/**
 * .what = the extra surgoals a goal has declared, beyond its path parent
 */
export const getServed = (db, goal) =>
  db
    .prepare('SELECT whole FROM goal_decomposition_uri WHERE part = ? ORDER BY whole ASC')
    .all(goal)
    .map((row) => row.whole);

/**
 * .what = EVERY surgoal of a goal — the path-implied set, plus the stored
 * .why  = the one reader both the rollup and the cycle check share, so the
 *         two can never disagree about what "one rung up" means
 *
 * ⚠️ the path-implied half is a SET of candidates (a subrock cannot tell
 *   which kind its root wears), while the stored half is concrete. the
 *   union is honest for a reachability walk, which is all it is used for.
 */
export const getSurgoalsAll = (db, goal) => [
  ...new Set([...asSurgoals(goal), ...getServed(db, goal)]),
];

/**
 * .what = every goal uri reachable by a walk UP from `from`
 * .why  = the cycle check, and the one place the two edge kinds are read
 *         together. a walk rather than a recursive CTE for the same reason
 *         `getGateReach` is one: the graph is small and a walk reads at 3am
 *
 * 🔴 a cycle needs a STORED edge to exist — a path parent is strictly
 *   shorter than its child, so the implied edges alone always terminate.
 *   the walk still follows both, because a cycle may run through a mix.
 */
export const getServeReach = (db, from) => {
  const seen = new Set();
  const stack = [from];
  while (stack.length) {
    const at = stack.pop();
    if (seen.has(at)) continue;
    seen.add(at);
    for (const up of getSurgoalsAll(db, at)) stack.push(up);
  }
  seen.delete(from);
  return seen;
};

/**
 * .what = the LIKE patterns that match every PATH DESCENDANT of a uri —
 *         one per goal kind
 *
 * 🔴 .why it spans the KINDS rather than assume `subrock://`
 *   a ROOT KIND may sit at ANY depth. `bigrock://sandpine/ensell/1klpm` is a
 *   peak on a peak — a pillar prominent enough to be named as one, nested
 *   under a concern that is itself a part (define.eco.priority-glyphs).
 *
 *   ⚠️ measured 2026-09-18: this clause read `subrock://<root>/<path>/%`, so
 *   `get --slug subrock://sandpine/ensell` returned the peak's CHILDREN and
 *   dropped the peak itself. the render drew a bare folder with no row behind
 *   it, the count read complete, and the omitted row was the one a human had
 *   just promoted (term=partial-audit).
 *
 *   ⇒ `isGoalBeneath` already answered this correctly — it strips the scheme
 *     via `asGoalParts` and compares root + path. one concept, two
 *     implementations, and only the JS half learned that a descendant may
 *     wear a root kind. this closes that seam.
 *
 * ⚠️ the ROOT SLUG stays strict. a wider KIND must never mean a wider ROOT,
 *   or a rollup reaches a same-named path beneath a foreign root
 */
export const asGoalDescendantLikes = (uri) => {
  const { root, path } = asGoalParts(uri);
  const under = path ? `${root}/${path}/%` : `${root}/%`;
  return GOAL_KINDS.map((kind) => `${kind}://${under}`);
};

/**
 * .what = every goal uri BENEATH `goal` in the DAG — itself, its path
 *         descendants, and every goal that serves any of them
 * .why  = the rollup. `get --slug X` must return the work done for X, and
 *         after the DAG that set is no longer a path prefix
 *
 * 🔴 .why DISTINCT is structural rather than a nicety
 *   a goal with two parents is reachable twice from a common ancestor. to
 *   return it twice would double its cost in any rollup that sums — the
 *   exact defect `define.invariant.eco.cost-rolls-up-and-sums` names as
 *   "edges vs nodes". a Set is the whole guard.
 */
export const getGoalsBeneath = (db, goal) => {
  const { root, path } = asGoalParts(goal);
  const seen = new Set();
  const stack = [goal];

  const stepPath = db.prepare('SELECT DISTINCT slug FROM priority WHERE slug LIKE ?');
  const stepServe = db.prepare('SELECT part FROM goal_decomposition_uri WHERE whole = ?');

  // the seed's own path descendants, by prefix — across every goal kind, so
  // a peak on a peak is reachable from the concern above it
  for (const like of asGoalDescendantLikes(goal))
    for (const row of stepPath.all(like)) stack.push(row.slug);

  while (stack.length) {
    const at = stack.pop();
    if (seen.has(at)) continue;
    seen.add(at);

    // every goal that DECLARED it serves this one, plus that goal's own
    // path descendants — a served goal brings its whole subtree with it
    for (const { part } of stepServe.all(at)) {
      stack.push(part);
      for (const like of asGoalDescendantLikes(part))
        for (const row of stepPath.all(like)) stack.push(row.slug);
    }
  }
  return [...seen];
};

/**
 * .what = the WHERE clause that matches one goal uri AND every goal beneath
 *         it — the rollup, as one implementation
 * .why  = an exact match returns the parent alone and omits every row that
 *         does the work, while it reports a count that reads complete
 *         (term=partial-audit). so a uri filter rolls up, always
 *
 * ⚠️ it RETURNS the clause rather than pushes it, so a caller can compose
 *
 * ✅ .why it keys on `slug`, which is the WHOLE point of the retirement
 *   it once keyed on a `goal` column, for a reason that was true at the time:
 *   `goal` carried the canonical uri on every row and `slug` carried it on
 *   only the migrated ones — measured 2026-09-17, 54 rows, 54 goal uris, 13
 *   uri slugs. a rollup off `slug` would then have reached 13 of 54 and
 *   reported that count as the whole.
 *
 *   ⇒ that is an argument for MIGRATING the slug, never for a second column.
 *     `setGoalColumnRetired` does the migration, so the premise is gone and
 *     the clause reads one name (2026-09-21)
 *
 * 🔴 .why the descendant clause keys on the ROOT SLUG, never the scheme
 *   a subrock does not know which kind its root wears today, and the root
 *   is expected to flip. to match `<the whole uri> || '/%'` would return
 *   naught the moment a bigrock became an altrock — the rollup would break
 *   on the one-row edit it must survive by design
 *
 * 🔴 .why it is a WALK and no longer a path prefix
 *   after the DAG, a goal may serve a second parent no path records. a
 *   `LIKE 'subrock://<root>/<path>/%'` clause is blind to that row by
 *   construction — it would return a count that reads complete while it
 *   omits the very goal worth the most, which is the partial-audit shape
 *   this store exists to refuse
 *
 * ⚠️ the walk returns DISTINCT goal uris, so a goal reachable by two paths
 *   from one ancestor appears ONCE. that is what keeps a cost rollup a sum
 *   over NODES rather than over edges
 *   (define.invariant.eco.cost-rolls-up-and-sums)
 */
export const asGoalRollupClause = (db, uri) => {
  const goals = getGoalsBeneath(db, uri);
  const likes = asGoalDescendantLikes(uri);
  const prefix = likes.map(() => 'slug LIKE ?').join(' OR ');
  return {
    sql: `(${prefix} OR slug IN (${goals.map(() => '?').join(', ')}))`,
    binds: [...likes, ...goals],
  };
};

/**
 * .what = write one extra parent edge, after it earns the right to exist
 *
 * .why each refusal, in the order a human trips them
 *   SELF — a goal that is its own part has no bottom, so every walk loops
 *   UNDECLARED — the same FK the path parent obeys. an edge to a goal
 *     nobody declared is a branch with no trunk, invisible to every rollup
 *   REDUNDANT — the whole is ALREADY an ancestor by path, so the edge is a
 *     second home for one fact. drop the edge and the relation survives;
 *     that asymmetry is what makes it a defect rather than a duplicate
 *   CYCLE — locally reasonable at every step and globally unbounded. the
 *     gain invariant sums UP through parents, so a cycle does not merely
 *     loop, it inflates both members without bound on every pass
 */
export const setServe = (db, { part, whole, now }) => {
  if (part === whole)
    throw new ConstraintError(
      `'${part}' cannot serve itself. a surgoal is the goal one rung UP, and naught is above a goal but another goal`,
    );

  for (const uri of [part, whole])
    if (!GOAL_RE.test(uri))
      throw new ConstraintError(
        `--surgoal '${uri}' is not a goal uri. use 'bigrock://<root>', 'altrock://<root>', or 'subrock://<root>/<path>'`,
      );

  if (!getGoalDeclarants(db, { goals: [whole] }).length)
    throw new ConstraintError(
      `--surgoal '${whole}' names a goal no priority declares yet, so the edge would point at ` +
        `naught: it falls out of every rollup, and a typo reads exactly like a real branch.\n` +
        `⇒ declare the whole first:  rhx eco.priority set --slug '${whole}' --what '...' ` +
        `--sev <p0|p1|p2|p3|p5> --urg <1d|3d|1w|1m>`,
    );

  if (isGoalBeneath({ deep: part, over: whole }))
    throw new ConstraintError(
      `'${part}' is ALREADY beneath '${whole}' by its path, so this edge records a fact the uri ` +
        `already states — a second home for one fact, and the two can disagree the moment one ` +
        `is dropped.\n` +
        `⇒ --surgoal is for the parent a path CANNOT express: a second root the goal also advances`,
    );

  if (isGoalBeneath({ deep: whole, over: part }))
    throw new ConstraintError(
      `'${whole}' sits BENEATH '${part}' by its path, so this edge inverts the tree — it would ` +
        `make a whole a part of its own part. check the direction: --surgoal names what this goal ` +
        `feeds INTO, never what feeds it`,
    );

  if (getServeReach(db, whole).has(part))
    throw new ConstraintError(
      `'${part}' serves '${whole}' would close a cycle — '${whole}' already reaches '${part}' ` +
        `(through: ${[...getServeReach(db, whole)].join(', ')}). gain sums UP through parents, so ` +
        `a cycle does not merely loop: it inflates both goals without bound on every pass. drop ` +
        `an edge on that path first`,
    );

  // 🔴 the edge is written in UUIDs, never in uris. the findsert is what
  //   makes that safe on a first sight of either end — and it is a findsert
  //   rather than an insert so a second edge onto one goal reuses its uuid
  db.prepare(
    'INSERT INTO goal_decomposition (part, whole, set_at) VALUES (?, ?, ?) ON CONFLICT(part, whole) DO UPDATE SET set_at = excluded.set_at',
  ).run(genGoalUuid(db, { uri: part, now }), genGoalUuid(db, { uri: whole, now }), now);
};

/**
 * .what = replace the WHOLE extra-parent set of one goal
 * .why  = the same replace-rather-than-append shape `--gates` takes, for
 *         the same reason: an omitted flag preserves, so without a replace
 *         the only way to drop one edge of three is a verb this store does
 *         not have. state the set you want; `none` states the empty one
 */
export const setServeSet = (db, { goal, wholes, now }) => {
  if (!Array.isArray(wholes)) return; // omitted — preserve
  const wanted = wholes.length === 1 && wholes[0] === CLEAR ? [] : wholes;
  // ⚠️ an absent uuid means this goal has no edges yet, so the delete is a
  //    no-op — and `''` would delete naught either, which is why it is safe
  db.prepare('DELETE FROM goal_decomposition WHERE part = ?').run(getGoalUuid(db, goal) ?? '');
  for (const whole of wanted) setServe(db, { part: goal, whole, now });
};

/**
 * .what = every priority that declares one of the given goal uris
 * .why  = the one query behind both the FK check and the del guard, so
 *         the two can never disagree about what "declared" means
 */
export const getGoalDeclarants = (db, { goals, except }) => {
  if (!goals.length) return [];
  const holes = goals.map(() => '?').join(', ');
  return db
    .prepare(`SELECT slug FROM priority WHERE slug IN (${holes}) AND slug != ?`)
    .all(...goals, except ?? '');
};

/**
 * .what = refuse a goal whose surgoal no row has declared
 *
 * ⚠️ the row itself is EXCLUDED from the declarant set, and that is not a
 *   nicety. a row that carries `subrock://R/a` today and moves to
 *   `subrock://R/a/b` would otherwise satisfy its own parent reference
 *   with the very declaration it drops in the same write — and land as an
 *   orphan that passed the check.
 */
export const assertSurgoalDeclared = (db, { goal, slug }) => {
  const surgoals = asSurgoals(goal);
  if (!surgoals.length) return; // a root owes no reference

  if (getGoalDeclarants(db, { goals: surgoals, except: slug }).length) return;

  const { root } = asGoalParts(goal);
  const owed = surgoals.length > 1 ? surgoals.join('  or  ') : surgoals[0];
  throw new ConstraintError(
    `--slug '${goal}' names a part of '${owed}', and no priority declares that goal yet. ` +
      `a part of a whole nobody declared is a leaf with no trunk: it falls out of every ` +
      `\`get --under\` rollup, it gates naught and is gated by naught, and a typo in the root ` +
      `('${root}') reads exactly the same as a real branch.\n` +
      `⇒ declare the whole first, then the part:\n` +
      `     rhx eco.priority set --slug '${surgoals[0]}' --what '...' ` +
      `--sev <p0|p1|p2|p3|p5> --urg <1d|3d|1w|1m>\n` +
      `     rhx eco.priority set --slug '${goal}' ...\n` +
      `⇒ or list what IS declared:  rhx eco.priority get --output json | jq -r '.priorities[].slug' | sort -u`,
  );
};

/**
 * .what = the rows that would be orphaned if `goal` lost its declarant
 * .why  = the FK has two ends, and only one of them is obvious. the check
 *         above guards the CHILD at write time; this guards the PARENT at
 *         the moment its declarant walks away — a move or a del.
 *
 * 🔴 .why there is no extant-declarant test any more
 *   it once read `{ slug, goal }` and, before the dependent scan, asked
 *   whether some OTHER row also declared the same goal — because two rows
 *   could carry one uri in a second column while their slugs differed.
 *
 *   ⇒ the slug IS the uri and the slug is the PRIMARY KEY, so a goal has
 *     exactly ONE declarant by construction. the "several declarants, so the
 *     departure is free" case cannot arise, and a test for it could only ever
 *     return false — it compared `row.slug === goal` over a set that excludes
 *     that very slug. so it is gone rather than merely unused (2026-09-21)
 */
export const getGoalOrphansIf = (db, { goal }) => {
  if (!goal) return [];
  const others = db.prepare('SELECT slug FROM priority WHERE slug != ?').all(goal);
  return others.filter((row) => asSurgoals(row.slug).includes(goal));
};

/**
 * 🔴 .what = refuse a move or a del that would strand a declared part
 *
 * .why it names `goal.mv` rather than just refusing
 *   under a strict FK a rename is UNREACHABLE by `set`. retype the `--slug` on
 *   the parent and every descendant is stranded; retype the descendants
 *   first and each is refused for a parent that no longer exists. there is
 *   no order that works, because `set` writes one row and a rename is an
 *   N-row fact.
 *
 *   ⇒ so the strict FK is what MAKES the separate verb necessary, and the
 *     refusal is the only place a human learns that. an error that merely
 *     said "would orphan 3 rows" would leave them with no next move
 *     (rule.require.errors-name-the-fix)
 */
export const assertNoOrphansLeft = (db, { goal, act }) => {
  const orphans = getGoalOrphansIf(db, { goal });
  if (!orphans.length) return;

  const named = orphans.map((row) => row.slug).join(', ');
  const remedy =
    act === 'del'
      ? `⇒ move the parts somewhere declared first, then drop this row:\n` +
        `     rhx eco.priority goal.mv --from '${goal}' --to '<a declared goal>'\n` +
        `⇒ or drop the parts first, deepest first`
      : `⇒ a rename is an N-row fact, so it has its own verb — it moves the whole subtree at once:\n` +
        `     rhx eco.priority goal.mv --from '${goal}' --to '<the new uri>'\n` +
        `⇒ to reparent THIS row alone, move its parts out from under it first`;

  throw new ConstraintError(
    `'${goal}' is the only priority that declares that goal, and ${orphans.length} ` +
      `${orphans.length === 1 ? 'row names' : 'rows name'} it as their parent: ${named}. ` +
      `to ${act} it would strand them — a part of a whole nobody declares falls out of every ` +
      `rollup and reads startable forever.\n${remedy}`,
  );
};
