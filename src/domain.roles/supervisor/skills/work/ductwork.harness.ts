/**
 * .what = the shared harness of the `ductwork` suite — its fixtures, its
 *         socket factory, and the lib reads its parity clamps share
 *
 * .suite = clamps on ductwork — against REAL tmux, on a PRIVATE server
 *
 * .why  = ductwork owns the tmux mechanism itself. a fake would prove only the
 *         fake, so these run against real tmux. what makes that safe is the
 *         DUCTWORK_TMUX_SOCKET seam: `-L <name>` gives each socket its own
 *         server with an entirely separate session namespace, so a test can
 *         create, drive, and kill ducts with no path to the live fleet.
 *
 *         [case1] clamps that guarantee directly, and it opens the verbs part
 *         on purpose: every case in the suite is only safe if it holds.
 *
 * .note = an absent tmux is a BLOCKER, never a skip. a silent skip is a test
 *         that passes without verification (rule.forbid.failhide).
 */
import { join } from 'path';

import {
  getShellLibWhole,
  getShellSkillWhole,
} from '../../../.test/getShellLibWhole';
import { PREFIX_TEST_SOCKET } from './work.harness';

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

export const TREE = 'testtree';

/**
 * .what = a tree name with DOTS, the shape every real crew tree has
 *
 * .why  = `TREE` above is `testtree` — dotless, and that is not a neutral
 *         choice. tmux REWRITES a `.` to `_` when it creates a session, and
 *         `has-session -t` does NOT rewrite its target, so the two verbs
 *         disagree about a dotted name and agree about a dotless one.
 *
 *         so [case4] clamped findsert over the ONE name shape that could not
 *         exercise the defect, and it passed green while `duct.open` failed
 *         `duplicate session` for every crew we actually boot
 *         (`repo.beav.slug`). the criterion that chose the subject — a short
 *         convenient test name — is orthogonal to the property measured.
 *         that is a `partial audit`, and it is why the defect went unseen.
 *
 * .note = the two forms are declared as a PAIR on purpose. the fix keeps
 *         both — dots for the duct's own name and the registry key,
 *         underscores for tmux — so a clamp owes an assertion on each.
 */
export const TREE_DOTTED = 'test.tree.dotted';
export const TREE_DOTTED_TMUX = 'test_tree_dotted';

/**
 * .what = the two shell bodies, read as text
 *
 * .why  = a PARITY clamp cannot be written against behavior alone. two
 *         callers agreeing on one fixture today proves naught about
 *         tomorrow — each could hold its own copy and agree by accident,
 *         which is exactly the state that shipped
 *         (define.invariant.crew.husk.discriminator-parity).
 *
 *         ⇒ so the assertion is on the SHARE itself: that each caller names
 *           the one discriminator. that is a property of the source, so the
 *           source is what it reads.
 */
export const readDuctwork = (): string =>
  getShellLibWhole({ path: join(__dirname, 'ductwork.sh') });
export const readCrewwork = (): string =>
  getShellLibWhole({ path: join(__dirname, 'crewwork.sh') });

/**
 * .what = a socket name no other run can collide with
 * .note = the shape is load-bearing: `<prefix><slug>-<pid>-<rand>`. the pid is
 *         what lets the stale sweep tell a crashed run's litter apart from a
 *         parallel worker's live socket.
 */
export const SOCKETS_MADE = new Set<string>();
export const genSocket = (slug: string): string => {
  const socket = `${PREFIX_TEST_SOCKET}${slug}-${process.pid}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
  SOCKETS_MADE.add(socket);
  return socket;
};
