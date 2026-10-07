#!/usr/bin/env bash
######################################################################
# .what = list every registered terminal window, with the tabs it holds
#
# .why  = the VIEW axis had a reader for the JOIN and none for the RAW
#         registry, so every question about a window itself fell out of
#         the tool set entirely.
#
#         `term.audit` answers one question — *does each live duct have a
#         tab?* — by a join of tmux against the registry. it is the right
#         verb for a health read and the wrong one for a diagnosis: when
#         the join MISSES, it reports `✋ NO term tab` and cannot say
#         whether the window is absent, registered under another key, or
#         holds the tab under a title that never matched.
#
#         🔴 measured 2026-09-13: `crew.stop --roles reviewer` answered
#         `✋ term.stop: no terminal for duct '<grove>:<tree>'`, and the
#         only way to see what key that window WAS registered under was a
#         raw `jq` sweep of ~/.termwork/*.json by hand. the lib had
#         `term.list` the whole time — it simply had no entrypoint, so it
#         was unreachable pavement (rule.always.reuse-pavement-before-improvise).
#
# usage:
#   rhx term.list --via kitty
#   rhx term.list --on <treeslug>        # narrow to the windows that carry it
#   rhx term.list --help
#
# args:
#   --via   terminal emulator (default: kitty)
#   --on    SUBSTRING of a window slug — a tree name narrows to its windows on
#           every grove. a caller who knows the exact key does not need a list;
#           a caller mid-diagnosis knows a tree. without this the only narrow
#           was a `| grep`, which is the very drop this verb exists to close
#
# ⚠️ .this is SUBSTRATE, and a supervisor does not route work through it
#    a supervisor speaks in crews and trees (rule.require.speak-at-the-
#    supervisor-layer) and acts through crew verbs
#    (rule.always.entool-the-layer-you-drop-below). reach for this verb
#    only where the terminal registry IS the subject of the claim — a
#    `term.stop` that cannot find its window, a tab under an unexpected
#    key, a stale record. for "is this crew whole?", the verbs are
#    `rhx git.crew.poll` and `rhx term.audit`.
#
# guarantee:
#   - reads the registry only; opens, closes, and mutates NAUGHT
#   - a corrupt record is surfaced on stderr and skipped, never swallowed
#   - a record whose pid is dead is reaped as it is read
######################################################################

set -euo pipefail

source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/work/termwork.sh"

via="kitty"
while [[ $# -gt 0 ]]; do
  case "$1" in
    --via) via="$2"; shift 2 ;;
    --help|-h) awk 'NR<=2 { next } /^####/ { exit } { sub(/^# ?/, ""); print }' "${BASH_SOURCE[0]}"; exit 0 ;;
    --skill|--repo|--role) shift 2 ;;  # skip rhachet internal flags
    *) echo "✋ term.list: unknown arg '$1'" >&2
       echo "   this wrapper takes: --via" >&2
       exit 2 ;;
  esac
done

term.list --via "$via"
