#!/usr/bin/env bash
######################################################################
# .what = send command (or raw keys) to a duct (tmux session)
#
# .why  = enables remote command execution in headless sessions
#         - run builds, tests, scripts in background
#         - no need to attach to see output (use duct.read)
#         - drive interactive TUI prompts (e.g. Claude Code selects)
#           that need a keystroke with NO Enter appended
#
# usage:
#   rhx duct.send --on work --what "npm run build"      # text + Enter
#   rhx duct.send --on user@host:work --what "cmd"
#   rhx duct.send --on work --keys Enter                # bare Enter, no text
#   rhx duct.send --on work --keys 1                    # bare "1", NO Enter
#   rhx duct.send --on work --keys Down                 # arrow key, NO Enter
#
# args:
#   --on    session name (required)
#   --what  command to send (text, then Enter appended)
#   --keys  raw tmux key(s) to send, NO Enter appended
#           (e.g. Enter, Down, Up, 1, 2, y) — use for TUI select prompts
#
# .why --keys exists
#   Claude Code (and other Ink-based TUIs) treat a bundled
#   `send-keys "1" Enter` as a paste/newline that does NOT submit the
#   select. the fix is to send the keystroke ALONE, no Enter appended:
#     - numbered selects: `--keys 1` selects+submits option 1
#     - default-highlighted prompts: `--keys Enter` confirms
#   ref: github.com/anthropics/claude-code/issues/15553
#
# .why --anyway also SUBMITS the text
#   a multi-line --what arrives at an Ink TUI as a bracketed paste, and a paste
#   swallows the trailing Enter as a literal newline. the message then sits in
#   the box unsent, rendered as "[Pasted text #N +M lines]", and the supervisor
#   believes it steered a mechanic that never heard a word. so --anyway follows
#   with a SEPARATE Enter, and guards it twice: never while a modal is up (that
#   Enter would confirm the highlighted option — an approval no human granted),
#   and never into an empty box (the first Enter already landed, so a second
#   would be a stray keystroke).
#
# guarantee:
#   - exactly one of --what or --keys is required
#   - --what  sends text + Enter (command execution)
#   - --keys  sends raw key(s), NO auto-Enter (TUI control)
#   - --anyway submits the text, unless a modal is up or the box is empty
#   - fail-fast if session not found
######################################################################

set -euo pipefail

# source ductwork functions
source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/work/ductwork.sh"

# parse args (filter out rhachet internal flags)
on_session=""
what_cmd=""
keys=""
have_what=0
have_keys=0
anyway=0
await=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    --on) on_session="$2"; shift 2 ;;
    --what) what_cmd="$2"; have_what=1; shift 2 ;;
    --keys) keys="$2"; have_keys=1; shift 2 ;;
    --anyway) anyway=1; shift ;;
    --await) await="$2"; shift 2 ;;
    --skill|--repo|--role) shift 2 ;;  # skip rhachet internal flags

    # .why the header's OWN terminator, never a pinned line number: a literal
    #   bound goes stale the moment the header grows, and stays silent when it
    #   does — a false report about the file it lives in (git.crew.poll:477)
    --help|-h)
      awk 'NR<=2 { next } /^####/ { exit } { sub(/^# ?/, ""); print }' "$0"
      exit 0
      ;;

    ####################################################################
    # ⚠️ FAIL LOUD on an unknown flag. never `shift` it away.
    #
    # .why = this arm was `*) shift ;;` — a silent drop — and it cost us
    #        the same defect TWICE, in the same file:
    #
    #        1. `--anyway` was swallowed here, so a busy mechanic could
    #           not be steered at all (see the .why note further down)
    #        2. `--await` was swallowed here, so `git.tree.behavior`'s
    #           boot send raced the worktree `cd` it had just made. the
    #           skill passed `--await 60`, the guard ran with await=0,
    #           the boot was refused, and the tree was left SPROUTED
    #           WITH NO BEHAVIOR — the one state
    #           `rule.require.behaviors-over-adhoc` forbids
    #
    #        repair 1 fixed its instance and left the mechanism, so the
    #        class stayed open and claimed a second victim. this arm is
    #        the class cure: a flag this wrapper does not know is a
    #        caller intent it cannot honor, and to drop it is a
    #        `rule.forbid.failhide` — the caller is told the send
    #        succeeded on terms it never asked for.
    #
    # .note = the ductwork `duct.send` FUNCTION has always failed loud
    #         here (work/ductwork.sh — `unknown arg`). only this wrapper
    #         swallowed. the two layers now agree.
    ####################################################################
    *)
      echo "✋ duct.send: unknown arg '$1'" >&2
      echo "" >&2
      echo "   what: this wrapper does not forward flags it does not know," >&2
      echo "         so an unknown one would be DROPPED and the send would" >&2
      echo "         run on terms you did not ask for" >&2
      echo "" >&2
      echo "   known: --on --what --keys --anyway --await" >&2
      echo "" >&2
      echo "   fix: drop the flag, or add it to this parser AND forward it" >&2
      echo "        to the ductwork function below — both halves, or it is" >&2
      echo "        silently inert again" >&2
      exit 2 ;;
  esac
done

# validate required args
if [[ -z "$on_session" ]]; then
  echo "error: --on required" >&2
  exit 2
fi

# .why reject --await WITH --anyway rather than ignore one of them
#      they ask for opposite things: --await waits for the pane to fall
#      idle; --anyway sends into a busy pane on purpose. to honor one and
#      drop the other silently would be the very failhide the parser arm
#      above exists to end — re-created inside its own repair.
if [[ -n "$await" && "$anyway" -eq 1 ]]; then
  echo "✋ duct.send: --await and --anyway contradict" >&2
  echo "" >&2
  echo "   what: --await waits for the pane to fall IDLE;" >&2
  echo "         --anyway sends into a BUSY pane on purpose" >&2
  echo "" >&2
  echo "   fix: pick one — --await to queue behind a build," >&2
  echo "        --anyway to answer a live program's prompt" >&2
  exit 2
fi

# .why reject --await WITH --keys
#      the --keys path calls tmux DIRECTLY (below) and never reaches the
#      ductwork busy-guard, so an --await there would parse fine and do
#      naught. that is a third silent drop, and it would have shipped
#      inside the very repair that closed the first two.
if [[ -n "$await" && "$have_keys" -eq 1 ]]; then
  echo "✋ duct.send: --await does not apply to --keys" >&2
  echo "" >&2
  echo "   what: --keys drives a TUI through a direct tmux call and never" >&2
  echo "         reaches the busy-guard, so --await would be inert here" >&2
  echo "" >&2
  echo "   fix: a --keys send is aimed at a program that HOLDS the pane" >&2
  echo "        on purpose. read it first — duct.read --on '$on_session'" >&2
  exit 2
fi

# exactly one of --what / --keys
if [[ "$have_what" -eq 1 && "$have_keys" -eq 1 ]]; then
  echo "error: use --what OR --keys, not both" >&2
  exit 2
fi
if [[ "$have_what" -eq 0 && "$have_keys" -eq 0 ]]; then
  echo "error: --what or --keys required" >&2
  exit 2
fi

# the TMUX form (dots to underscores, slashes stay) — for the DIRECT tmux
# calls below ONLY.
#
# ⚠️ it must NOT be handed to the ductwork `duct.send` function. that function
#    parses the uri itself and keys the registry on the DOTTED name, so a
#    pre-converted uri makes it write and read a second, underscore-keyed row
#    for one duct — the `duplicate` phantom term=duct names. the lib converts
#    at its own tmux boundary; see the two-name-form note in work/ductwork.sh.
session_name="${on_session//./_}"

# .what = the bare tmux target, with any duct:// uri prefix stripped
# .why  = --on accepts BOTH a bare dotted name and a duct:// uri. the ductwork
#         duct.send function understands the uri; raw `tmux` does not, and it
#         fails with a name it cannot resolve. so every direct tmux call below
#         uses this normalized target, never the raw --on value.
#         duct:///<tree>/<role>        -> <tree>/<role>   (local)
#         duct://<host>/<tree>/<role>  -> <tree>/<role>   (remote; see is_remote)
tmux_target="$session_name"
is_remote=0
duct_host=""
if [[ "$tmux_target" == duct://* ]]; then
  uri_rest="${tmux_target#duct://}"
  # an EMPTY authority (three slashes) means this machine; a named one is a grove
  [[ "$uri_rest" != /* ]] && { is_remote=1; duct_host="${uri_rest%%/*}"; }
  tmux_target="${uri_rest#*/}"
fi

# .what = the address as a reader should see it, echoed back on success
# .why  = `--on` takes BOTH a bare dotted name and a full uri, and the echo used
#         to prefix `duct://` unconditionally. so a uri input rendered
#         `duct://duct://<host>/<tree>/<role>`, and a bare name rendered
#         `duct://<name>` — which reads as authority=<name>, i.e. a REMOTE
#         address, for a duct on this very box. the local form is `duct:///`
#         with an empty authority (term=duct).
#
#         a report that mangles the very address it was handed is a small lie
#         with a large cost: the echo is the one line a caller copies into the
#         next command (rule.forbid.ambiguous-labels). so the scheme is added
#         only where it is absent, and the local form keeps its third slash.
duct_shown="$on_session"
[[ "$duct_shown" != duct://* ]] && duct_shown="duct:///$duct_shown"

# --keys mode: send raw keystroke(s) with NO auto-Enter (TUI control)
if [[ "$have_keys" -eq 1 ]]; then
  if [[ -z "$keys" ]]; then
    echo "error: --keys requires a value (e.g. Enter, Down, 1)" >&2
    exit 2
  fi

  ####################################################################
  # ⚠️ a REMOTE duct is asked over ssh — this arm used to ask LOCAL tmux
  #    whatever host the uri named.
  #
  # .why it matters more than any other arm: `--keys` IS the approval path.
  #      howto.review-permission-requests step 4a answers every stalled
  #      permission modal with `duct.send --keys N`. so while this arm was
  #      local-only, a supervisor could not clear a modal on a grove clone at
  #      all — and the refusal did not say so. it said:
  #
  #        ✋ duct.send: session '<uri>' not found
  #
  #      of a session that was live, on a box it never asked. the tell that it
  #      was a false report rather than a fact: `duct.read` on the SAME uri
  #      answered fine in the same minute, because that verb routes by host.
  #      two verbs, one address, opposite verdicts (term=false-report).
  #
  # .why the fix was one variable: `is_remote` was already computed directly
  #      above and this arm simply never read it. the host was known, parsed,
  #      and thrown away — the same shape as crew.boot's skipped cloud tree
  #      lookup and the crew poll's `localhost` pin. a value derived and
  #      discarded is the cheapest defect there is, and the hardest to see.
  ####################################################################
  if [[ "$is_remote" -eq 1 ]]; then
    if ! ssh -n "$duct_host" "tmux has-session -t '$tmux_target'" 2>/dev/null; then
      echo "✋ duct.send: session '$tmux_target' is absent on '$duct_host'" >&2
      echo "   note: this asked the GROVE, not this box" >&2
      echo "   fix: confirm the grove is awake, then the duct —" >&2
      echo "     rhx git.grove.wake $duct_host" >&2
      echo "     rhx duct.list --on 'duct://$duct_host/*'" >&2
      exit 2
    fi
    # shellcheck disable=SC2086
    ssh -n "$duct_host" "tmux send-keys -t '$tmux_target' $keys"
    echo "🔧 $duct_shown keys sent: $keys"
    # ⚠️ `tmux send-keys` exits 0 once the key is DELIVERED. whether the TUI
    #    CONSUMED it is unproven, and a reader takes the line as a receipt.
    #    the lib carries the same two lines; keep the pair in step.
    echo "   └─ ⚠️ delivered, never CONSUMED — tmux placed the key; the TUI may have dropped it"
    echo "      read the box back before you call this answered (rule.require.verify-after-send)"
    exit 0
  fi

  if ! tmux has-session -t "$tmux_target" 2>/dev/null; then
    echo "✋ duct.send: session '$on_session' not found on this machine" >&2
    exit 2
  fi
  # send each space-separated token as its own key, no Enter appended
  # shellcheck disable=SC2086
  tmux send-keys -t "$tmux_target" $keys
  echo "🔧 $duct_shown keys sent: $keys"
  exit 0
fi

# --what mode: text, then Enter appended (command execution)
#
# .why --anyway is forwarded: ductwork refuses a --what send when a program
#      (e.g. claude) holds the pane, since the text would land in that
#      program's stdin rather than a shell. that guard is right by default,
#      but a supervisor MUST be able to steer a busy mechanic — a reply to its
#      prompt IS a send into claude's stdin, on purpose. without this
#      passthrough the flag was swallowed by the catch-all above and a busy
#      mechanic could not be steered at all.
if [[ "$anyway" -eq 1 ]]; then
  duct.send --on "$on_session" --anyway --what "$what_cmd"

  # .why a SECOND, separate Enter — the paste-absorption quirk
  #      an Ink TUI (claude) receives a multi-line --what as a BRACKETED PASTE,
  #      and a paste treats the trailing Enter as a literal newline inside the
  #      text rather than a submit. so the message lands in the box, renders as
  #      "[Pasted text #N +M lines]", and sits there unsent — silently. the
  #      supervisor then believes it steered a mechanic that never heard it.
  #      the cure is the same one --keys exists for: a keystroke sent ALONE,
  #      in its own call, after the paste has settled.
  # a remote duct is not reachable by the LOCAL tmux, so the submit-check
  # cannot run there. say so rather than fail — a silent skip would leave the
  # caller to believe the text was submitted.
  if [[ "$is_remote" -eq 1 ]]; then
    echo "   └─ ⚠️  remote duct — could not verify submit; if it sits unsent:"
    echo "      └─ rhx duct.send --on $on_session --keys Enter"
    exit 0
  fi

  # .why we POLL for the box rather than sleep a fixed 0.5s
  #      an Ink TUI redraws asynchronously, and a long paste takes longer to
  #      render than a short one. a single fixed wait read an EMPTY box on an
  #      11-line paste, concluded the first Enter had landed, and skipped the
  #      submit — so the message sat unsent, which is the exact failure this
  #      block exists to prevent. an empty box is ambiguous: it means EITHER
  #      "already submitted" OR "not drawn yet", and only elapsed time tells
  #      them apart. so we re-read until text appears, up to a fixed max.
  #
  # .why the `|| true` is load-bearing, not defensive noise
  #      under `set -o pipefail` a grep that matches no line makes the whole
  #      substitution non-zero, and `set -e` then kills the skill AFTER the
  #      text was already sent. the caller sees exit 1 and cannot tell a
  #      failed send from a failed post-check. an absent ❯ is a normal state
  #      (the box is simply not drawn), so it must not read as an error.
  pane=""
  box=""
  for _ in 1 2 3 4 5 6; do
    sleep 0.5
    pane="$(tmux capture-pane -p -t "$tmux_target" 2>/dev/null || true)"

    # a modal outranks the box — quit the poll at once, and never Enter
    if printf '%s\n' "$pane" | grep -qaE 'Do you want to|requires approval|Esc to cancel'; then
      box=""
      break
    fi

    box="$(printf '%s\n' "$pane" \
      | grep -a '❯' | tail -n 1 \
      | sed 's/.*❯//' \
      | sed 's/\xc2\xa0/ /g' \
      | sed 's/^[[:space:]]*//; s/[[:space:]]*$//' || true)"
    [[ -n "$box" ]] && break
  done

  # .why we NEVER Enter into a modal
  #      between the send and this follow-up, a permission prompt can appear.
  #      an Enter there would confirm its HIGHLIGHTED option — an approval no
  #      human granted. so if any modal chrome is on the pane, leave the text
  #      unsent and say so; a message that waits is cheap, a fabricated
  #      approval is not.
  if printf '%s\n' "$pane" | grep -qaE 'Do you want to|requires approval|Esc to cancel'; then
    echo "   └─ ⚠️  a prompt is up — text left UNSENT (an Enter would answer it)"
    echo "      └─ clear the prompt, then: rhx duct.send --on $on_session --keys Enter"
  elif [[ -n "$box" ]]; then
    # the box still HOLDS the text, so the trailing Enter was absorbed as a
    # newline by the paste. submit it with a keystroke sent ALONE.
    tmux send-keys -t "$tmux_target" Enter
    echo "   └─ ⏎ submitted (paste-absorption quirk)"
  else
    # box stayed empty across the whole poll — the first Enter already landed.
    # a second would be a stray keystroke, so send none.
    echo "   └─ ✔ submitted on send (box empty across 3s)"
  fi
else
  # ⚠️ BOTH HALVES or the flag is inert: parsed above, AND forwarded here.
  #    a flag this wrapper parses but never hands to the ductwork function
  #    is the same failhide as one the catch-all dropped — the caller sees
  #    a clean exit and gets behavior it did not ask for. that is exactly
  #    how `--await` was lost, and why the unknown-arg arm above names the
  #    two halves in its own error text.
  if [[ -n "$await" ]]; then
    duct.send --on "$on_session" --await "$await" --what "$what_cmd"
  else
    duct.send --on "$on_session" --what "$what_cmd"
  fi
fi
