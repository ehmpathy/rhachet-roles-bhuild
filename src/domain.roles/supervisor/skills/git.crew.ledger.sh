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

while [[ $# -gt 0 ]]; do
  case "$1" in
    --skill|--repo|--role) shift 2 ;;
    --help|-h)
      # bounded by the banner that shuts the header, never a line number — the
      # same drift a hardcoded `2,49p` suffers the moment the header grows.
      awk 'NR<=2 { next } /^####/ { exit } { sub(/^# ?/, ""); print }' "$0"
      exit 0
      ;;
    --backfill) VERB="backfill"; shift ;;
    --del) VERB="del"; TREE="$2"; shift 2 ;;
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
      echo "error: unknown arg: $1" >&2
      echo "       this verb takes --backfill, --del <tree>, or no flag at all." >&2
      echo "       run 'rhx git.crew.ledger --help' for the whole contract." >&2
      exit 2
      ;;
  esac
done

crew.ledger "$VERB" "$TREE"
