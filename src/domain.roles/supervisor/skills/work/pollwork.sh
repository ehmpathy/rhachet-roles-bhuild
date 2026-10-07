#!/usr/bin/env bash
######################################################################
# .what = the stages of `git.crew.poll` — gather, read, render — as named
#         functions, sourced, never executed, and only BY git.crew.poll.sh
#
# .why  = the poll ran as ~5,700 lines of top-level code. no reviewer could
#         hold it in one window (measured 175k tokens, 88% of the window the
#         peer lanes run on), and its stages had no names, so a read of one
#         stage meant a read of all of them.
#
#         ⇒ each stage is now one function in one part, and the entrypoint
#           reads as the list of them, in order. the shared state stays
#           global — the stages read it exactly as the one file did.
#
# .how  = POLLWORK_PARTS names every part; __poll_load_parts sources them
#         last and refuses loudly if one is absent.
######################################################################

######################################################################
# gather the crews — keyed by TREE, from every trace a crew leaves
######################################################################
#
# .why THREE sources, unioned:
#   a crew that "has or had been opened" leaves one of two traces, and
#   either may outlive the other:
#     - a WORKTREE on disk        (survives a machine death)
#     - a REGISTRY row            (survives a fell; that is a phantom)
#     - a LIVE tmux session       (survives neither, and is the only one
#                                  that proves the crew is at work)
#
# .why the key is a CANONICAL tree name
#   tmux forbids '.' in a session name and writes '_', so one tree is
#   registered under BOTH forms and `duct.poll` reports it twice — with
#   two independent baselines, so the SAME pane can read `🌊 changed` and
#   `🧊 unchanged` in one sweep (term=false-report). keying on one form
#   collapses the duplicate by construction rather than by a de-dupe pass
######################################################################

# .what = the one spelling a tree is keyed by, whatever form arrived
__crew_canon() { printf '%s' "${1//_/.}"; }

######################################################################
# the parts
######################################################################
#
# .what = the explicit list of parts, in stage order, loaded last
# .why  = explicit rather than a glob, so a stray file is never sourced and
#         an absent one is named. `shellLibParts.integration.test.ts` holds
#         this list equal to the files on disk.
POLLWORK_PARTS=(gather read rows sweeps summary actions)
__poll_load_parts() {
  local here part
  here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
  for part in "${POLLWORK_PARTS[@]}"; do
    if [[ ! -f "$here/pollwork.$part.sh" ]]; then
      echo "💥 MalfunctionError: pollwork part absent: $here/pollwork.$part.sh" >&2
      return 1
    fi
    source "$here/pollwork.$part.sh"
  done
}
__poll_load_parts || return 1
