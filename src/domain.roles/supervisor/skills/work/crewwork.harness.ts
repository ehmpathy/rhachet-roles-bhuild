/**
 * .what = the shared harness of the `crewwork` suite — its tree fixtures, its
 *         role sets, and the git-root factory its clamps share
 *
 * .suite = clamps on crewwork — the ORDER it owns, and the ARGS it passes
 *
 * .why  = crewwork earns its own layer for exactly one reason: a crew op is a
 *         sequence of lower verbs in an order that matters and lived nowhere
 *         but a supervisor's head. so the order IS the subject under test.
 *
 *         two defects from 2026-08-09 are clamped here by name, because both
 *         cost real work and neither is visible by a read of the file:
 *
 *           1. duct.open dropped --cwd, so every session started in the
 *              CALLER's directory. after a reboot that put reclaimed mechanics
 *              in the wrong repo, where `claude --continue` resumes the wrong
 *              conversation entirely.
 *
 *           2. crew.hide swallowed a failed term.stop with `|| true` and
 *              reported success over a window still on the human's screen.
 *
 * .how  = every lower verb is FAKED and records its call. no tmux, no kitty,
 *         no display, and no path from here to the live fleet.
 */
import { mkdirSync } from 'fs';
import { join } from 'path';

import { getShellSkillWhole } from '../../../.test/getShellLibWhole';
import { tempDirs } from '../../../.test/tempDirs';

export const TREE = 'somerepo.beav.fix-thing';

/**
 * .what = the poll skill whole — its entrypoint, then every stage it runs
 * .why  = the poll's body lives in work/pollwork.<part>.sh; a clamp on what the
 *         poll renders reads the stages, or it reads only the arg surface
 */
export const readPollWhole = (): string =>
  getShellSkillWhole({
    path: join(__dirname, '../git.crew.poll.sh'),
    stages: join(__dirname, 'pollwork.sh'),
  });

/**
 * .what = the TMUX form of TREE — tmux rewrites a `.` to `_` on create
 *
 * .why  = a crew is addressed by its DOTTED name at every layer above the
 *         substrate (the tree dir, the ledger key, the duct URI, the `--tree`
 *         a human types), and by this form the moment it reaches tmux or
 *         kitty. crewwork carries both casts for exactly that reason.
 *
 *         it is declared here so a test can assert WHICH form a call used,
 *         rather than only how many calls were made. a count cannot part a
 *         call that went to the wrong session from one that went to the
 *         right one — and the wrong one fails silently.
 */
export const TREE_TMUX = 'somerepo_beav_fix-thing';

/**
 * .what = the roster CREWWORK_ROLES_DEFAULT names, in its order
 *
 * .why  = several clamps assert "one call per role", and each of them spelled
 *         its own literal `2`. so a seat added to the constant broke four tests
 *         that were each RIGHT about the rule and stale about the count — and
 *         the failure then reads as a regression rather than as the roster
 *         change it is. named once here, a future seat is one line in the skill
 *         and one line here.
 *
 * ⚠️ this MIRRORS a bash constant, and never reads it. it is the one value in
 *    this file that can drift with no test to catch the drift, which is why
 *    the clamps below assert the NAMES too, not only the count — a mirror that
 *    drifts then fails on the name it got wrong, rather than passes on a length
 *    that happens to match.
 */
export const ROLES_DEFAULT = [
  'mechanic',
  'foreman',
  'reflector',
  'reviewer.take',
  'reviewer.give',
];

/**
 * .what = the roster's roles whose duct lives on THIS box whatever grove the
 *         tree is on — CREWWORK_ROLES_LOCAL, mirrored
 *
 * .why  = two clamps assert "--cwd is the dir the host named", and that claim
 *         holds for every seat but these. a local-only seat's cwd is a MIRROR
 *         path here, so a clamp that swept the whole roster would fail on it —
 *         correctly, and for the wrong reason. named here so the exclusion is
 *         one list rather than a literal in each clamp.
 */
export const ROLES_LOCAL = ['reviewer.take', 'reviewer.give', 'reviewer'];

/**
 * .what = the roster's roles whose duct is TREE-BOUND — the set difference
 *         ROLES_DEFAULT \ ROLES_LOCAL, derived rather than counted
 *
 * .why  = 🔴 the two lists are NOT subsets of each other, and the arithmetic
 *         `ROLES_DEFAULT.length - ROLES_LOCAL.length` silently assumed they
 *         were. crewwork.sh:424-440 states the reason outright:
 *
 *           CREWWORK_ROLES_DEFAULT  what a NEW crew gets      — a POLICY
 *           CREWWORK_ROLES_LOCAL    where a role's duct LIVES — a FACT
 *
 *         the bare `reviewer` sits in LOCAL and NOT in DEFAULT — it is a
 *         decommissioned slug whose legacy ducts still live on this box, so it
 *         stays a FACT about duct location long after the POLICY dropped it.
 *         ⇒ so the subtraction double-counted it and expected 2 tree-bound
 *           seats where the boot opens 3 (mechanic, foreman, reflector).
 *
 * .note = a set difference cannot drift that way — a role added to either list
 *         moves this constant correctly, whether or not the lists overlap.
 */
export const ROLES_TREEBOUND = ROLES_DEFAULT.filter(
  (role) => !ROLES_LOCAL.includes(role),
);

/**
 * .what = the LOCAL-ONLY seats a boot actually opens — the intersection
 *         ROLES_DEFAULT ∩ ROLES_LOCAL
 *
 * .why  = the local-seat clamps reached for a bare `/${TREE}/reviewer ` and
 *         found it undefined, because a boot never opens one: `reviewer` is a
 *         decommissioned slug that stays in ROLES_LOCAL as a FACT about where
 *         legacy ducts live (crewwork.sh:424-440), and the roster it left is
 *         what a boot reads. the seats a boot DOES open locally are the two
 *         the split produced.
 *
 * .note = the clamps assert over EVERY member rather than find one, so a seat
 *         added to the split cannot pass unchecked.
 */
export const ROLES_LOCAL_BOOTED = ROLES_DEFAULT.filter((role) =>
  ROLES_LOCAL.includes(role),
);

/**
 * .what = the role a `term.open` call opens a tab for
 *
 * .why  = the role arrives by one of TWO flags, and a reader of either alone
 *         gets `undefined` for half the roster. `--for <role>` is the sugar
 *         every grove-bound seat takes; a LOCAL-ONLY seat takes the explicit
 *         `--tab <role> --duct local:<slug>/<role>` pair instead, because the
 *         sugar derives its duct from the WINDOW's slug — which carries the
 *         grove host, and would point the tab at a session on the wrong box.
 *
 * ⚠️ four clamps read this, and each spelled `c.split('--for ')[1]` of its own.
 *    so the day a seat stopped taking --for, all four went red at once and each
 *    read as its own regression rather than as the one contract change it was.
 */
export const roleOfTermOpen = (call: string): string | undefined =>
  (call.match(/--for (\S+)/) ?? call.match(/--tab (\S+)/))?.[1];

/**
 * .what = a fake git root with one worktree in it
 * .why  = crew.boot fail-fasts on a tree it cannot find, so most cases need
 *         a real directory at the exact shape it globs:
 *           <root>/<org>/_worktrees/<repo>.<user>.<slug>
 */
export const genGitRoot = (input: { trees: string[] }): string => {
  const root = tempDirs.genOne({ slug: 'gitroot' });
  for (const tree of input.trees) {
    mkdirSync(join(root, 'someorg', '_worktrees', tree), { recursive: true });
  }
  return root;
};

/** index of the first call whose text holds the needle, or -1 */
export const idxOf = (calls: string[], needle: string): number =>
  calls.findIndex((c) => c.includes(needle));
