#!/usr/bin/env bash
######################################################################
# .what = audit the KEY PATH a duct rides on: kitty -> tmux -> app
#
# .why  = the key path is declared in ~/.tmux.conf and served by a LIVE
#         tmux server, and the two drift. `extended-keys` and
#         `terminal-features` are SERVER options (`set -s` / `set -as`),
#         so an edit to the file changes naught until the server is
#         re-sourced AND every client re-attaches.
#
#         that drift is silent, and it breaks exactly one symptom that
#         is very hard to trace: ctrl+c stops through to nvim. the file
#         says `on`, the server says `always`, and no error is printed.
#
#         it also catches the inverse litter: `set -as` APPENDS, so each
#         `source-file` adds another copy of every terminal-feature. a
#         triple entry is the fingerprint of three re-sources.
#
# .the config-files trap
#         `tmux display-message -p '#{config_files}'` reports the paths
#         tmux would CONSIDER, not the ones it read. an absent path is
#         listed exactly like a loaded one. so this skill tests each for
#         existence rather than trusts the list — see
#         `term=false-report._.choice._.md`, the declaration species.
#
# usage:
#   rhx duct.audit           # audit the local key path
#   rhx duct.audit --help
#
# guarantee:
#   - READ-ONLY: never sets a tmux option, never touches a duct
#   - every defect names its FIX, never only its symptom
#   - exit 0 = clean, 2 = drift found (a human must apply the fix),
#     1 = malfunction
######################################################################

set -euo pipefail

TMUX_BIN="${DUCTWORK_TMUX_SOCKET:+tmux -L $DUCTWORK_TMUX_SOCKET}"
TMUX_BIN="${TMUX_BIN:-tmux}"

# 🔴 a LOOP, never a `$1` probe. the probe read `--help` only in first
#    position — so `rhx duct.audit --help` ran the AUDIT, because rhachet
#    injects `--skill <name> --repo <r> --role <r>` ahead of every user arg
#    and `$1` was `--skill`. the skill answered help to a developer who
#    called it directly and ignored it for every consumer who did not.
while [[ $# -gt 0 ]]; do
  case "$1" in
    --skill|--repo|--role) shift 2 ;;
    --help|-h)
      awk 'NR<=2 { next } /^####/ { exit } { sub(/^# ?/, ""); print }' "$0"
      exit 0
      ;;

    # ⚠️ FAIL LOUD — never `shift` an unknown arg away (rule.forbid.failhide).
    #    this verb takes no positionals, so every unmatched token is a defect
    *) echo "✋ duct.audit: unknown arg '$1'" >&2
       echo "   known: --help" >&2
       exit 2 ;;
  esac
done

echo "🦫 chew on it"
echo ""
echo "🪵 duct.audit — the key path: kitty → tmux → app"

DEFECTS=0

# ── is a server even up? ──────────────────────────────────────────────
if ! $TMUX_BIN list-sessions >/dev/null 2>&1; then
  echo "   └─ ✋ no live tmux server on this socket — naught to audit"
  exit 2
fi

# ── 1. which configs did tmux CONSIDER, and which exist? ──────────────
echo "   ├─ 📄 configs"
CONFIGS=$($TMUX_BIN display-message -p '#{config_files}' 2>/dev/null || echo '')
CONFIG_LOADED=''
IFS=',' read -ra CONFIG_ARR <<< "$CONFIGS"
for cfg in "${CONFIG_ARR[@]}"; do
  [[ -z "$cfg" ]] && continue
  if [[ -f "$cfg" ]]; then
    echo "   │  ├─ ✔ $cfg"
    CONFIG_LOADED="$CONFIG_LOADED $cfg"
  else
    echo "   │  ├─ 👻 $cfg (listed, absent on disk — a candidate, never loaded)"
  fi
done
echo "   │  └─ ⚠️  the LAST extant file wins where two set one option"

# ── 2. extended-keys: declared vs live ────────────────────────────────
LIVE_EXTKEYS=$($TMUX_BIN show -s extended-keys 2>/dev/null | awk '{print $2}')
DECL_EXTKEYS=''
for cfg in $CONFIG_LOADED; do
  found=$(grep -E '^[[:space:]]*set(-option)?[[:space:]]+-s[a-z]*[[:space:]]+extended-keys' "$cfg" 2>/dev/null | tail -1 | awk '{print $NF}' || true)
  [[ -n "$found" ]] && DECL_EXTKEYS="$found"
done

echo "   ├─ ⌨️  extended-keys"
echo "   │  ├─ declared: ${DECL_EXTKEYS:-<unset>}"
echo "   │  ├─ live:     ${LIVE_EXTKEYS:-<unset>}"
if [[ -n "$DECL_EXTKEYS" && "$DECL_EXTKEYS" != "$LIVE_EXTKEYS" ]]; then
  DEFECTS=$((DEFECTS + 1))
  echo "   │  └─ 🛑 DRIFT — the server never took the current file"
  echo "   │     why: extended-keys is a SERVER option; a file edit alone changes naught"
  echo "   │     what it breaks: under 'always', tmux sends CSI-u to apps that never"
  echo "   │        asked for the protocol — so nvim reads an escape sequence where it"
  echo "   │        expects the ^C byte, and ctrl+c dies on the way in"
  echo "   │     fix: tmux set -s extended-keys $DECL_EXTKEYS"
  echo "   │          then DETACH + REATTACH every client, so each renegotiates"
elif [[ -z "$LIVE_EXTKEYS" ]]; then
  DEFECTS=$((DEFECTS + 1))
  echo "   │  └─ 🛑 unset — kitty's extended keys cannot reach the app"
  echo "   │     fix: tmux set -s extended-keys on"
else
  echo "   │  └─ ✔ in sync"
fi

# ── 3. terminal-features: present, and how many times ─────────────────
FEATURES=$($TMUX_BIN show -g -A terminal-features 2>/dev/null || echo '')
N_EXTKEYS=$(echo "$FEATURES" | grep -c 'xterm-kitty:extkeys' || true)
N_CLIP=$(echo "$FEATURES" | grep -c 'xterm-kitty:clipboard' || true)

echo "   ├─ 🎛️  terminal-features"
echo "   │  ├─ xterm-kitty:extkeys    × $N_EXTKEYS"
echo "   │  ├─ xterm-kitty:clipboard  × $N_CLIP"
if [[ "$N_EXTKEYS" -eq 0 ]]; then
  DEFECTS=$((DEFECTS + 1))
  echo "   │  └─ 🛑 absent — tmux will not relay kitty's key protocol"
  echo "   │     fix: tmux set -as terminal-features 'xterm-kitty:extkeys'"
elif [[ "$N_EXTKEYS" -gt 1 ]]; then
  echo "   │  └─ 🟡 duplicated ×$N_EXTKEYS — 'set -as' APPENDS, so this counts"
  echo "   │     the re-sources. harmless in effect, but it is the tell that the"
  echo "   │     config was sourced $N_EXTKEYS times into one live server"
else
  echo "   │  └─ ✔ once, as declared"
fi

# ── 4. the rest of the path ───────────────────────────────────────────
CLIP=$($TMUX_BIN show -s set-clipboard 2>/dev/null | awk '{print $2}')
PASS=$($TMUX_BIN show -g allow-passthrough 2>/dev/null | awk '{print $2}')
ESC=$($TMUX_BIN show -g escape-time 2>/dev/null | awk '{print $2}')
TERMOPT=$($TMUX_BIN show -g default-terminal 2>/dev/null | awk '{print $2}')

echo "   └─ 🔩 the rest"
echo "      ├─ set-clipboard:     ${CLIP:-<unset>}"
echo "      ├─ allow-passthrough: ${PASS:-<unset>}"
echo "      ├─ default-terminal:  ${TERMOPT:-<unset>}"
echo "      └─ escape-time:       ${ESC:-<unset>}ms"

[[ "$CLIP" != "on" ]] && { DEFECTS=$((DEFECTS + 1)); echo "         🛑 set-clipboard must be 'on' — fix: tmux set -s set-clipboard on"; }
[[ "$PASS" != "on" ]] && echo "         🟡 allow-passthrough off — kitty graphics (image.nvim) will not render"
[[ -n "$ESC" && "$ESC" -gt 100 ]] && echo "         🟡 escape-time ${ESC}ms is high — nvim's ESC will feel laggy; 10 is typical"

echo ""
if [[ "$DEFECTS" -eq 0 ]]; then
  echo "🦫 dam fine! the key path is clean"
  exit 0
fi
echo "🦫 tail slap — $DEFECTS defect(s) on the key path, each with its fix above"
exit 2
