#!/usr/bin/env bash
######################################################################
# .what = the durable record of every tree a CREW was ever booted on
#
# .why  = "was a crew ever booted here?" had no answer, and three
#         sources were tried before this existed:
#
#           live tmux         answers "at work NOW" — a stopped crew
#                             vanishes, so it under-reports by design
#           duct registry     ERASED on stop. __duct_unregister_duct
#                             deletes the row AND rmdirs the parent, so
#                             the evidence is destroyed by the very act
#                             whose history we want to read
#           worktrees on disk answers "a TREE exists", never "a crew
#                             worked it" — measured 142 trees against
#                             ~14 that ever had ducts, so it invents
#                             ~128 crews that were never born
#
#         a crew's EXISTENCE and its LIVENESS have different lifetimes,
#         and only a ledger spans both. crew.boot writes it; crew.stop
#         does NOT remove it. that asymmetry is the whole point.
#
# .the boundary = this is the crew layer, and only the crew layer.
#         for every tree on the machine, crewed or not, run:
#           git tree status --repo @all
#
# usage:
#   rhx git.crew.ledger               every tree a crew was ever booted on
#   rhx git.crew.ledger --backfill    seed from live tmux + duct registry
#   rhx git.crew.ledger --del <tree>  drop one stale row, by hand — a
#                                      last-resort instrument; see crew.ledger
#                                      del in work/crewwork.sh for when it
#                                      applies (a felled grove crew's row,
#                                      which crew.fell cannot drop itself)
#   rhx git.crew.ledger --tree <tree> --grove local|cloud://<grove> [--roles a,b] [--idem findsert|upsert]
#                                    place one row: findsert (default) keeps an
#                                    extant row; upsert sets its grove. no --roles
#                                    keeps the row's roles (git.crew.move does this)
#
# .the backfill is INCOMPLETE, and that is not repairable
#         every crew booted AND stopped before this ledger existed is
#         gone — duct.stop deleted its row and no other artifact kept
#         it. the backfill recovers what is still registered and cannot
#         recover the rest, so a post-backfill ledger is complete only
#         for crews booted from here on (term=partial-audit).
#
# guarantee:
#   - list is read-only
#   - backfill is an upsert; a re-run adds no duplicate row
#   - del is idempotent — an absent row reports and exits 0, never an error
#   - --tree --grove is idempotent under either --idem; a --tree with no --grove exits 2
#   - keyed by the CANONICAL dotted tree name, so a tree registered
#     under both the dotted and tmux underscore form is ONE row
#   - exit 0 = ok, 1 = malfunction, 2 = constraint
######################################################################

set -uo pipefail

# source crewwork from the REPO's own lib (it loads ductwork + termwork)
source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/work/crewwork.sh"

# .why the mode is a FLAG, and the bare call READS
#   `rhx git.crew.ledger list` never reached this file — rhx owns `list`
#   as its own subcommand, so the call printed a skill catalogue and
#   exited 0. success shape, wrong content, and no tell for the caller
#   (term=false-report). a flag cannot be intercepted, and the bare
#   invocation now does the safe, read-only act by default.
VERB="read"
TREE=""
GROVE=""
ROLES=""
IDEM="findsert"
# which flags the caller named, so a flag the chosen verb ignores is refused, never dropped
DEL_GIVEN=""
PLACE_FLAGS=""

while [[ $# -gt 0 ]]; do
  # a value flag with no value, or the next flag as its value, is refused by name.
  # `shift 2` past the last arg shifts naught, so an unguarded arm would spin this loop forever
  case "$1" in
    --del|--tree|--grove|--roles|--idem)
      if [[ $# -lt 2 || "$2" == --* ]]; then
        got="none"; [[ $# -ge 2 ]] && got="the next flag '$2'"
        echo "✋ ConstraintError: $1 takes a value, got $got" >&2
        echo "   └─ fix: run 'rhx git.crew.ledger --help' for the whole contract" >&2
        exit 2
      fi ;;
  esac
  case "$1" in
    --skill|--repo|--role) shift; [[ $# -gt 0 ]] && shift ;;  # a trailer with no value never spins the loop
    --help|-h)
      # bounded by the banner that shuts the header, never a line number — the
      # same drift a hardcoded `2,49p` suffers the moment the header grows.
      awk 'NR<=2 { next } /^####/ { exit } { sub(/^# ?/, ""); print }' "$0"
      exit 0
      ;;
    --backfill) VERB="backfill"; shift ;;
    --del) DEL_GIVEN=yes; TREE="${2:-}"; shift 2 ;;
    --tree) TREE="${2:-}"; PLACE_FLAGS+=" --tree"; shift 2 ;;
    --grove) GROVE="${2:-}"; PLACE_FLAGS+=" --grove"; shift 2 ;;
    --roles) ROLES="${2:-}"; PLACE_FLAGS+=" --roles"; shift 2 ;;
    --idem) IDEM="${2:-}"; PLACE_FLAGS+=" --idem"; shift 2 ;;
    # 🔴 an unknown arg FAILS. it used to `shift` — silently dropped, and the
    #    render then answered a question the caller never asked.
    #
    #    .measured 2026-09-16: `git.crew.ledger --tree <slug>` printed all 41
    #    rows with no tell at all. the caller asked about ONE tree and read a
    #    fleet-wide list as though it were the answer — a truthful render of
    #    the wrong subject set (term=false-report, term=partial-audit).
    #
    #    ⇒ the same silence swallowed `--output json`, which is why a `| jq`
    #      over this verb dies on the skill banner rather than on an honest
    #      "no such flag". an unread flag must never look like an honored one.
    *)
      echo "✋ ConstraintError: unknown arg '$1'" >&2
      echo "   ├─ valid args: --tree <tree> --grove <grove> [--roles] [--idem] · --del <tree> · --backfill · --help · or none, to read" >&2
      echo "   └─ fix: rhx git.crew.ledger --tree <tree> --grove <grove>   # see --help for each" >&2
      exit 2
      ;;
  esac
done

# 🔴 --del drops a row; a placement flag beside it would be read by no one, and
#    the caller would think a grove or roles were set (term=false-report)
if [[ -n "$DEL_GIVEN" && -n "$PLACE_FLAGS" ]]; then
  echo "✋ ConstraintError: --del takes no placement flag (got:$PLACE_FLAGS)" >&2
  echo "   ├─ --del drops one row; --tree --grove places one. one act per call" >&2
  echo "   └─ fix: rhx git.crew.ledger --del $TREE   # or place it: rhx git.crew.ledger --tree <tree> --grove <grove>" >&2
  exit 2
fi
if [[ "$VERB" == backfill && -n "$PLACE_FLAGS" ]]; then
  echo "✋ ConstraintError: --backfill takes no placement flag (got:$PLACE_FLAGS)" >&2
  echo "   └─ fix: rhx git.crew.ledger --backfill   # or place one row: rhx git.crew.ledger --tree <tree> --grove <grove>" >&2
  exit 2
fi
if [[ -n "$DEL_GIVEN" ]]; then VERB="del"; fi
if [[ -n "$GROVE" ]]; then VERB="enroll"; fi

# 🔴 --roles or --idem with no --grove would be dropped: the read ignores them,
#    and the caller would believe a row was placed
if [[ "$VERB" != enroll && ( "$PLACE_FLAGS" == *--roles* || "$PLACE_FLAGS" == *--idem* ) ]]; then
  echo "✋ ConstraintError: --roles and --idem place a row, so they need --tree and --grove" >&2
  echo "   └─ fix: rhx git.crew.ledger --tree <tree> --grove local|cloud://<grove>${ROLES:+ --roles $ROLES} --idem $IDEM" >&2
  exit 2
fi

# 🔴 a --tree with no --grove names a subject and no act. a read of the whole
#    ledger in its place would be the false report measured 2026-09-16, so it fails
if [[ "$VERB" == read && -n "$TREE" ]]; then
  echo "✋ ConstraintError: --tree needs --grove: the ledger reads whole, or places one row" >&2
  echo "   └─ fix: rhx git.crew.ledger --tree $TREE --grove local|cloud://<grove> [--idem upsert]" >&2
  exit 2
fi

if [[ "$VERB" == enroll ]]; then
  crew.ledger enroll "$TREE" "$GROVE" "$ROLES" "$IDEM"
  exit $?
fi

crew.ledger "$VERB" "$TREE"
