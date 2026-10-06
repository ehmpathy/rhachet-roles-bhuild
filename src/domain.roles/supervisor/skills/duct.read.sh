#!/usr/bin/env bash
######################################################################
# .what = read output from a duct (tmux session)
#
# .why  = enables peek at session output without attach
#         - check build progress
#         - capture command output
#         - diagnose issues
#
# usage:
#   rhx duct.read --on work
#   rhx duct.read --on work --lines 100
#   rhx duct.read --on user@host:work
#
# args:
#   --on      session name (required)
#   --lines   number of lines to capture (default: 50)
#   --raw     keep ANSI escapes instead of a strip (local OR cloud)
#
# .why --raw exists — the plain read is COLOR-BLIND, and that is a trap
#   a claude-code input box renders two different things in the same spot:
#     - PREFILLED text  = what a human actually typed, unsent (white)
#     - SUGGESTED text  = an autocomplete ghost from history (gray)
#   the ONLY difference is color. a normal capture-pane strips ANSI, so both
#   arrive as identical plain text — and a reader who cannot see the color
#   will guess, and eventually guess wrong.
#
#   a wrong guess is not cosmetic. to submit a gray ghost is to put words in
#   the human's mouth: the mechanic acts on an instruction no human gave. when
#   the ghost happens to read "approve the gate", that is
#   rule.forbid.self-grant-human-gates defeated without a forbidden command
#   ever typed.
#
#   so --raw preserves the escapes, and the color becomes checkable rather
#   than a guess. see rule.require.distinguish-prefilled-from-suggested.
#
# guarantee:
#   - captures visible pane content
#   - fail-fast if session not found
#   - --raw works on either host, and NEVER falls back to a stripped read
######################################################################

set -euo pipefail

# source ductwork functions
source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/work/ductwork.sh"

# parse args (filter out rhachet internal flags)
on_session=""
lines=50
raw=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    --on) on_session="$2"; shift 2 ;;
    --lines) lines="$2"; shift 2 ;;
    --raw) raw=1; shift ;;
    --skill|--repo|--role) shift 2 ;;  # skip rhachet internal flags

    # .why the header's OWN terminator, never a pinned line number: a literal
    #   bound goes stale the moment the header grows, and stays silent when it
    #   does — a false report about the file it lives in (git.crew.poll:477)
    --help|-h)
      awk 'NR<=2 { next } /^####/ { exit } { sub(/^# ?/, ""); print }' "$0"
      exit 0
      ;;

    # ⚠️ FAIL LOUD — never `shift` an unknown flag away.
    # .why = a silent drop tells the caller the run succeeded on terms it
    #        never asked for (rule.forbid.failhide). it cost duct.send the
    #        same defect twice — `--anyway`, then `--await`, the second of
    #        which left a tree SPROUTED WITH NO BEHAVIOR. full account in
    #        duct.send.sh; clamped by work.surface [case12].
    #
    # .note = this one is the sharpest of the family. a dropped `--raw`
    #         returns a COLOR-STRIPPED pane while it reports success, and
    #         the whole prefilled-vs-ghost check reads that color
    #         (rule.require.distinguish-prefilled-from-suggested). a
    #         swallowed flag there is how a supervisor submits a ghost.
    *)
      echo "✋ duct.read: unknown arg '$1'" >&2
      echo "   known: --on --lines --raw" >&2
      exit 2 ;;
  esac
done

# validate required args
if [[ -z "$on_session" ]]; then
  echo "error: --on required" >&2
  exit 2
fi

# the TMUX form (dots to underscores, slashes stay) — for the DIRECT tmux
# calls in the --raw branch ONLY. the lib call at the bottom takes the DOTTED
# uri, because ductwork keys its registry on the DOTTED name and converts at
# its own tmux boundary (see the two-name-form note in work/ductwork.sh).
#
# .why `dotted`, and not `raw` as this line once read: `raw` already names a
#      different concept on this very surface — `--raw` means the ANSI escapes
#      are preserved. one word for two concepts is `rule.forbid.domain-term-
#      ambiguity`, and it was at its worst here, two lines from the flag.
#      `dotted` is the canonical word the repo already uses for the
#      un-converted name (crewwork's ledger key, git.crew.ledger's contract).
session_name="${on_session//./_}"

# strip any duct:/// prefix so --raw can address tmux directly
session_bare="${session_name#duct://}"
session_bare="${session_bare#/}"

# --raw: capture WITH ansi, so prefilled (white) vs suggested (gray) is
# checkable. it works on EITHER host — the lib owns both arms, and neither
# falls back to a stripped read, which is the lie this flag exists to end.
#
# .why it is no longer local-only, and no longer a direct tmux call here
#      the refusal cost the cloud fleet its stall detector: `duct.poll`'s
#      box classifier needs the escapes, so it ran only when the host was
#      empty, and every grove duct fell to `unknown`. see the header on
#      `duct.read` in work/ductwork.sh for the measurement.
if [[ -n "$raw" ]]; then
  duct.read --on "$on_session" --lines "$lines" --raw
  exit $?
fi

# call duct.read with the DOTTED uri — never the tmux form; see the note above
duct.read --on "$on_session" --lines "$lines"
