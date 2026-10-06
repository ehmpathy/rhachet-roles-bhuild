/////////////////////////////////////////////////////////////////////
// .what = the input refusals — a slug that is not a goal uri, a bad vocabulary, a bad grain
//
// .why  = a write verb refuses a malformed input before a byte reaches the store,
//         and each refusal names its fix (rule.require.errors-name-the-fix)
//
// .note = a PART of `ecowork.db.mjs`, cut so one reviewer can hold it
//         whole. only the entry opens the store — this module takes an
//         open `db` handle and never opens one ([case56])
/////////////////////////////////////////////////////////////////////

import { SEV_ALLOWED, URG_ALLOWED, PER_ALLOWED, DUR_RE, CASH_RE, HOURS_PER_DAY, isTimeRung, TIME_LADDER, ConstraintError } from './ecowork.db.vocab.mjs';
import { GOAL_RE, asGoalParts } from './ecowork.db.goal.mjs';
import { STATUS_ALLOWED, KIND_ALLOWED } from './ecowork.db.schema.mjs';

/////////////////////////////////////////////////////////////////////
// the verbs
/////////////////////////////////////////////////////////////////////

/**
 * .what = reject a new row whose slug is not a goal uri
 * .note = graded on CREATE alone. a legacy row with a bare slug predates the
 *         uri shape; a partial write on it must land, or every such row is
 *         frozen with no migration path left open. and it runs BEFORE the
 *         absent-field check, so a mistyped or retired name is told what is
 *         wrong with it rather than that it owes a --sev
 */
export const assertSlugIsGoalUri = (input) => {
  // 🔴 the error must name BOTH the shape and the kinds. a bare
  //    'sandpine.decost' is the natural first guess, so the refusal is the
  //    one place the uri shape ever gets taught
  //    (rule.require.errors-name-the-fix)
  // ✅ .why it names `--slug`, and can name no other flag
  //   there is ONE flag now, so the refusal names what the caller typed by
  //   construction. it once computed which of two names to print, and that
  //   computation was the tell: the store held two names, and a caller could
  //   be handed a refusal for an argument absent from their command line
  //   (rule.require.errors-name-the-fix)
  if (!GOAL_RE.test(input.slug))
    throw new ConstraintError(
      `--slug '${input.slug}' is not a goal uri. three shapes:\n` +
        `  bigrock://<root>          a mainquest, e.g. 'bigrock://sandpine.decost'\n` +
        `  altrock://<root>          a sidequest, e.g. 'altrock://dev-ergonomics'\n` +
        `  subrock://<root>/<path>   a decomposition, e.g. 'subrock://sandpine.decost/acu-tune'\n` +
        `a bare slug is refused because it records no kind. a root takes no path, and a ` +
        `subrock requires one — a decomposition of naught is not a decomposition. and a ` +
        `subrock names the root's SLUG, never its KIND, so the root can flip alt<->big ` +
        `without a single child edit`,
    );
};

/** .what = reject an opine or a quant that is not in its declared set */
export const assertVocabularies = (input) => {
  if (!SEV_ALLOWED.includes(input.sev))
    throw new ConstraintError(
      `--sev '${input.sev}' is not a declared severity. one of: ${SEV_ALLOWED.join(' ')}`,
    );

  if (!URG_ALLOWED.includes(input.urg))
    throw new ConstraintError(
      `--urg '${input.urg}' is not a declared urgency. one of: ${URG_ALLOWED.join(' ')}`,
    );

  // 🔴 the refusal teaches the discriminator, because the natural wrong
  //    guess is "how much does it reduce the cost" — which grades the
  //    SIZE of the effect rather than WHICH TERM it moved
  if (input.kind && !KIND_ALLOWED.includes(input.kind))
    throw new ConstraintError(
      `--kind '${input.kind}' is not a declared kind. one of: ${KIND_ALLOWED.join(' ')}\n` +
        `  solve   after it lands the problem is GONE — it removes the rate\n` +
        `  clamp   after it lands the problem is BOUNDED — it truncates the window\n` +
        `a loss is 'rate x window'. the discriminator is which term you moved, never how ` +
        `far. a partial repair still attacks the rate, so it is a small solve — not a clamp`,
    );

  if (input.status && !STATUS_ALLOWED.includes(input.status))
    throw new ConstraintError(
      `--status '${input.status}' is not a declared status. one of: ${STATUS_ALLOWED.join(' ')}\n` +
        `('open' is github's word for an issue, and a different axis from this one — a row can ` +
        `be inflight while its issue is open, and abandoned while its issue is closed)`,
    );

  if (input.gainCash && !CASH_RE.test(input.gainCash))
    throw new ConstraintError(
      `--gain-cash '${input.gainCash}' is not iso-price words. use '<CCY> <amount>', e.g. 'USD 150.00'`,
    );

  if (input.gainPer && !PER_ALLOWED.includes(input.gainPer))
    throw new ConstraintError(
      `--gain-per '${input.gainPer}' is not a declared period. one of: ${PER_ALLOWED.join(' ')}`,
    );

  if (input.costCash && !CASH_RE.test(input.costCash))
    throw new ConstraintError(
      `--cost-cash '${input.costCash}' is not iso-price words. use '<CCY> <amount>', e.g. 'USD 40.00'`,
    );

  if (input.costPer && !PER_ALLOWED.includes(input.costPer))
    throw new ConstraintError(
      `--cost-per '${input.costPer}' is not a declared period. one of: ${PER_ALLOWED.join(' ')}`,
    );

  // 🔴 the error names the LADDER, never merely the shape. `'4h' is not a
  //   work duration` would be a lie — it is well-shaped and off the rungs,
  //   and a human told only the shape re-types `4h` and is refused again
  if (input.costTime && !isTimeRung(input.costTime))
    throw new ConstraintError(
      `--cost-time '${input.costTime}' is off the ladder. a work estimate stands on a ` +
        `fibonacci rung, because nobody can tell 4h from 5h before they start:\n` +
        `  ${TIME_LADDER}\n` +
        `(1d = ${HOURS_PER_DAY}h, so '8h' and '1d' are the same duration)`,
    );

  if (input.gainTime && !isTimeRung(input.gainTime))
    throw new ConstraintError(
      `--gain-time '${input.gainTime}' is off the ladder. a work estimate stands on a ` +
        `fibonacci rung, because nobody can tell 4h from 5h before they start:\n` +
        `  ${TIME_LADDER}\n` +
        `(1d = ${HOURS_PER_DAY}h, so '8h' and '1d' are the same duration)`,
    );

  if (input.gainDuration && !DUR_RE.test(input.gainDuration))
    throw new ConstraintError(
      `--gain-for '${input.gainDuration}' is not a duration. use '<n>d', '<n>w', '<n>mo' or '<n>y', e.g. '3mo' or '5y'`,
    );

  if (input.costDuration && !DUR_RE.test(input.costDuration))
    throw new ConstraintError(
      `--cost-for '${input.costDuration}' is not a duration. use '<n>d', '<n>w', '<n>mo' or '<n>y', e.g. '3mo' or '5y'`,
    );

  if (input.gainPer && input.gainPer !== 'once' && !input.gainCash)
    throw new ConstraintError('--gain-per needs a --gain-cash to apply to');

  if (input.costPer && input.costPer !== 'once' && !input.costCash)
    throw new ConstraintError('--cost-per needs a --cost-cash to apply to');

  // .why a cross-currency pair is refused rather than summed
  //   USD + EUR sums to a meaningless total, and the net is what the
  //   whole cash rank is built on (rule.forbid.any-price: lost currency).
  //   ⇒ a store with no fx rate must say so rather than guess one
  if (input.gainCash && input.costCash) {
    const gainCcy = input.gainCash.split(' ')[0];
    const costCcy = input.costCash.split(' ')[0];
    if (gainCcy !== costCcy)
      throw new ConstraintError(
        `--gain-cash is ${gainCcy} and --cost-cash is ${costCcy}. this store holds no fx rate, so it cannot net them. state both in one currency`,
      );
  }
};

/*
 * 🔴 there is no `assertSlugIsGoal` here, and its absence is the whole repair.
 *
 * it refused a `--goal` that DIFFERED from `--slug`, which means the store held
 * two names and spent a guard on the promise that they would agree. ⇒ a guard
 * that reports a synonym rather than removes one, and its very existence was
 * the proof that one of the two names was redundant.
 *
 * ⚠️ and its printed remedy MADE the defect it guarded against. it read
 *   `⇒ re-run with: --slug '<the uri>'`, so a caller moved the uri there, dropped
 *   the now-redundant `--goal`, and minted a row with an EMPTY goal — invisible to
 *   every rollup, gating naught. measured 2026-09-15: the fix produced the
 *   defect, and the tool was obeyed.
 *
 * ⇒ `rule.prefer.prevent-over-correct` rung 1: make it impossible, never message
 *   it after. the column is gone (2026-09-21), so the two names cannot disagree
 *   and no guard is owed. the etymology lives in the `priority` schema comment.
 */

/**
 * .what = refuse a row that names a TREE and does not take the tree's name
 * .why  = a tree is 1:1 with a branch and 1:1 with a pr
 *         (rule.require.one-pr-per-worktree). so a row that names one is a
 *         row about that pr, and it already HAS a name — the ledger's.
 *
 * 🔴 .the defect this refuses, measured 2026-09-14
 *
 *   six rows were minted for the cert-ingest blocker set, and every
 *   slug was coined at the keyboard:
 *
 *     slug  coachbook-dao-codegen-hygiene        ← a word nobody can decode
 *     goal  .../sql-dao-generator-codegen-hygiene
 *     task  ehmpathy/sql-dao-generator#54
 *     tree  svc-coachbook.bert.wt-1.1-cert-ingest
 *
 *   FOUR names for one piece of work, and no two agree. the wisher read
 *   the render and asked the only question it leaves: "what is codegen
 *   hygiene? no one knows what that is."
 *
 *   ⇒ and the harm is worse than a reader's shrug. a coined slug is a
 *     SYNONYM (rule.forbid.domain-term-synonyms), so a grep for the
 *     branch finds no row, a grep for the row finds no branch, and the
 *     store cannot answer "is this already caught?" — which is the one
 *     question it exists to answer.
 *
 * ✅ .the cure is a borrowed name, never a coined one
 *
 *     slug  subrock://sandpine/entool/sql-dao-generator.beav.fix-post-gen-hand-patches
 *     tree                       sql-dao-generator.beav.fix-post-gen-hand-patches
 *
 *   one name in two fields. it names the repo, so a reader knows where
 *   the edit lands; it names the branch, so `git tree` and `gh pr` find
 *   it; and it can never drift, because a drift is now a refusal.
 *
 * 🔴 .the name to compare is the slug's LEAF, never the whole slug
 *
 *   this check was authored while a row carried TWO names — a bare
 *   `slug` beside a separate `--goal` uri — so `slug === tree` was the
 *   right comparison then. `assertSlugIsGoal` later merged the two and
 *   the slug BECAME the uri; this check was never taught that, so it
 *   went on to hold a uri up against a bare branch name.
 *
 *   ⇒ the two were then MUTUALLY UNSATISFIABLE for any row that carries
 *     a tree: the merge demands the slug BE the uri, this demanded it be
 *     the bare tree name, and the uri-shape check refuses a bare slug
 *     outright. no string satisfied all three, so EVERY write with a
 *     tree was refused — and the refusal read as a scold about names
 *     rather than a defect, which is exactly why it survived.
 *
 *   ⚠️ a ROOT rock carries no path, so its leaf IS its root segment.
 *
 * ⚠️ .why a row may name at most ONE tree
 *   two trees is two branches is two prs, which is two deliverables and
 *   therefore two rows. the row above them is a container, and a
 *   container carries no tree of its own.
 */
export const assertTreeGrain = ({ slug, refTree }) => {
  if (!refTree || refTree.length === 0) return;

  if (refTree.length > 1)
    throw new ConstraintError(
      `'${slug}' names ${refTree.length} trees: ${refTree.join(', ')}\n` +
        `a tree is one branch and one pr, so two trees is two deliverables and two rows ` +
        `(rule.require.one-pr-per-worktree). declare a row per tree, and let this one be ` +
        `their container with no --ref-tree of its own`,
    );

  const [tree] = refTree;

  // ⚠️ this read `asGoalParts(goal ?? slug)` until 2026-09-21, and the
  //   comment beside it argued for the GOAL over the slug: on the 44
  //   legacy two-name rows the slug was bare and only the goal could be
  //   taken apart. that argument was sound and it is now moot — the
  //   column is retired and `setGoalColumnRetired` migrated every one of
  //   those 44 uris ONTO the slug, so the branch the fallback guarded
  //   has no row left to guard
  const parts = asGoalParts(slug);
  const trail = parts.path ? parts.path.split('/') : [];

  // 🔴 the leaf is the last N SEGMENTS, where N is the tree's own segment
  //    count — never the last single segment.
  //
  //    measured 2026-09-16: a one-segment leaf made this check UNSATISFIABLE
  //    for every branch this fleet actually cuts. the convention is
  //    `beav/{fix|feat}-$slug` (im_a.bhuild_supervisor), so a real tree name
  //    holds a '/' — and a one-segment leaf can never equal a two-segment
  //    name. measured:
  //
  //      --slug 'bigrock://beav/fix-twilio' --ref-tree 'beav/fix-twilio'
  //        ⇒ refused. leaf read 'fix-twilio', and the suggested repair was
  //          'bigrock://beav/beav/fix-twilio' — which re-splits to the same
  //          leaf and refuses again, without bound
  //
  //    ⚠️ so the error named a fix that does not work, which is worse than
  //    naming none (rule.require.errors-name-the-fix). a tree whose name
  //    carried no slash passed, so the whole class hid behind a green suite.
  //
  //    ⇒ this is the SECOND half of the defect the header above records. the
  //      first repair taught the check that a slug is a uri; it did not teach
  //      it that a branch name is a PATH
  const whole = trail.length ? [parts.root, ...trail] : [parts.root];
  const depth = tree.split('/').length;
  const leaf = whole.slice(-depth).join('/');
  if (leaf === tree) return;

  // .what = the same slug with its trailing segments swapped for the tree name
  // .why  = a refusal that hands back a runnable command beats one that
  //         hands back a rule (rule.require.errors-name-the-fix)
  const fixed = `${parts.kind}://${[...whole.slice(0, Math.max(whole.length - depth, 0)), tree].join('/')}`;

  throw new ConstraintError(
    `'${slug}' names the tree '${tree}' and does not carry its name.\n` +
      `  --slug  leaf '${leaf}'\n` +
      `               should be '${tree}'\n` +
      `a tree is one branch and one pr, so the tree's name is ALREADY this row's name — ` +
      `borrow it, never coin a second. a coined slug is a synonym: a grep for the branch ` +
      `finds no row, and a grep for the row finds no branch.\n` +
      `⇒ re-run with:  --slug '${fixed}'\n` +
      `⇒ read the name off the ledger:  rhx git.crew.ledger\n` +
      `⇒ a row with no branch of its own is a CONTAINER — drop --ref-tree rather than rename`,
  );
};
