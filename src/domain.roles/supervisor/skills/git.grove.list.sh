#!/usr/bin/env bash
######################################################################
# .what = list every registered grove, and PROBE whether its tunnel carries
#
# .why  = a grove's ssh alias, user, and port are what every remote duct
#         address is built from, so a supervisor needs them enumerable
#         without a guess and without a login.
#
# 🔴 .and a registry row is CONFIG, never STATE — so a list alone answers
#    the wrong question. the row says where the tunnel SHOULD be; it says
#    naught about whether anything crosses it.
#
#    ⚠️ the costly case has NO error to match on: an orphaned process still
#    HOLDS localhost:<port>, so every check that asks "is the port bound?"
#    answers yes, and no call ever yields a `Connection refused`. the fleet
#    just goes quiet — crews drift to `😴 unread` while their work is fine,
#    and the reach defect is attributed to the crews, or to the grove, or
#    to load. measured 2026-09-08 on grove-sandpine-v20260901, the box that
#    carried the whole fleet; `git.grove.wake` named it `bound but mute`
#    and the poll's own UNREACHED warn never fired (term=grove.tunnel).
#
#    ⇒ so this skill READS THE BANNER, which is the record rather than a
#      correlate. a live tunnel forwards to the grove's :22, and sshd
#      greets every connection with `SSH-2.0-…` unprompted. that greeting
#      is proof traffic crossed. it needs no credential, no key, and no
#      login — we hang up before a single byte is sent back.
#
# .the three verdicts, and the one cure
#   🟢 live  — connected, and `SSH-2.0-…` came back
#   🔴 mute  — connected, and no byte came back  → rhx git.grove.wake <grove>
#   🔴 down  — refused; no listener at all       → rhx git.grove.wake <grove>
#
#   ⚠️ `mute` and `down` take the SAME cure, and that is deliberate — wake
#   is idempotent and per-leg, so it repairs whichever leg is broken and
#   prints `[KEEP]` for the rest. a healthy grove is unharmed by one.
#
# usage:
#   rhx git.grove.list
#   rhx git.grove.list --json      # the raw records + their probe verdict
#   rhx git.grove.list --no-probe  # config only, zero network — the old shape
#
# .why NO `source ~/.bash_aliases` here — this used to be a three-line
#      dispatch to `git_alias_grove list`, a function defined in the global
#      dotfile. that made the skill a SHIM over a file this repo does not own:
#
#        - `bert/dev-env-setup`'s `install_env` writes that dotfile, so
#          whichever copy wrote last won and a reinstall silently reverted it
#        - the skill could not run at all on a box whose dotfile was stale,
#          and said so — a skill that reports on its own installer is a skill
#          that does not work
#        - it is the exact defect work.surface [case1] clamps across this whole
#          surface, and this file was the one member that violated it
#
#      the registry is plain json on disk, so the skill reads it directly. its
#      wake peer already did; now the pair agree.
#
# guarantee:
#   - reads only; never wakes, never writes, never logs in. the probe opens
#     a tcp connection, reads the greeting the server volunteers, and hangs
#     up — it sends no byte, so it authenticates nothing and mutates nothing
#   - a probe is bounded by --timeout (default 3s), so an unreachable grove
#     costs seconds, never a hang
#   - exit 0 = listed (an EMPTY forest is a valid answer, not a failure).
#     ⚠️ a mute or down grove is REPORTED, never an error — this is a
#     read, and a broken tunnel is a finding rather than a malfunction
#   - exit 2 = constraint (no registry at all)
######################################################################
set -euo pipefail

FORMAT="tree"
PROBE="1"
TIMEOUT="3"

# ── probe one tunnel, without a login ────────────────────────────────
# .why the BANNER and not a port check: a bound port proves a listener
# exists, never that it carries. sshd volunteers `SSH-2.0-…` the moment a
# connection is accepted, so the greeting is the one byte-level record that
# traffic crossed the tunnel end to end (term=grove.tunnel, row 4).
#
# ⚠️ `read -t` returns non-zero on timeout, and this file runs under
# `set -e` — so every read sits inside an `if`, never bare.
__grove_probe_tunnel() {
  local host="$1" port="$2" banner=""

  # a refused connect is `down`. 2>/dev/null so bash's own "connection
  # refused" chatter does not reach the caller's stderr as a fake error.
  exec 3<>"/dev/tcp/${host}/${port}" 2>/dev/null || { printf 'down'; return 0; }

  if IFS= read -r -t "$TIMEOUT" banner <&3; then
    exec 3<&- 3>&-
    case "$banner" in
      SSH-*) printf 'live' ;;
      # a listener that greets with something OTHER than ssh is not the
      # tunnel we registered — say so rather than call it live
      *)     printf 'odd' ;;
    esac
  else
    # accepted, then silent past the timeout — the mute case, and the whole
    # reason this probe exists
    exec 3<&- 3>&-
    printf 'mute'
  fi
}

# rhachet forwards its own --skill/--repo/--role flags; drop them.
# a bare `--` ends the strip — every arg after it is literal.
while [[ $# -gt 0 ]]; do
  case "$1" in
    --json) FORMAT="json"; shift ;;
    --no-probe) PROBE=""; shift ;;
    --timeout) TIMEOUT="$2"; shift 2 ;;
    --skill|--repo|--role) shift 2 ;;
    --) shift; break ;;
    -h|--help)
      awk 'NR<=2 { next } /^####/ { exit } { sub(/^# ?/, ""); print }' "$0"
      exit 0 ;;

    # ⚠️ FAIL LOUD — never `shift` an unknown flag away.
    # .why = a silent drop tells the caller the run succeeded on terms it never
    #        asked for (rule.forbid.failhide). the same defect cost duct.send
    #        twice; full account in duct.send.sh.
    *)
      echo "✋ git.grove.list: unknown arg '$1'" >&2
      echo "   known: --json --no-probe --timeout <secs> --help" >&2
      exit 2 ;;
  esac
done

GROVES_DIR="${GIT_FOREST_DIR:-$HOME/.git.forest}/groves"

if [[ ! -d "$GROVES_DIR" ]]; then
  echo "🐢 bummer dude — no forest registry at $GROVES_DIR" >&2
  echo "" >&2
  echo "  fix: register a grove, which creates it —" >&2
  echo "    rhx git.grove.set <grove> --exid <exid> --env camp --account <id>" >&2
  exit 2
fi

# .why a sorted array rather than a `for` over the glob: the LAST entry takes a
#      different glyph (└─ vs ├─), and that is knowable only once the count is.
#      the prior version printed ├─ on every row, the final one too, which left
#      the tree visually open — it reads as "and more", of a list that ended.
FILES=()
while IFS= read -r f; do FILES+=("$f"); done < <(find "$GROVES_DIR" -maxdepth 1 -name '*.json' | sort)

if [[ "$FORMAT" == "json" ]]; then
  # one array, so a reader can pipe it straight to jq without a join
  if [[ ${#FILES[@]} -eq 0 ]]; then echo "[]"; exit 0; fi
  if [[ -z "$PROBE" ]]; then
    jq -s '.' "${FILES[@]}"
    exit 0
  fi
  # .why an ADDITIVE field: every extant --json reader keeps its keys. a
  # consumer that ignores `.tunnel` behaves exactly as before
  # each jq emits ONE object; `jq -s` slurps them into the array a reader expects
  {
    for f in "${FILES[@]}"; do
      verdict=$(__grove_probe_tunnel "$(jq -r '.host // "127.0.0.1"' "$f")" "$(jq -r '.port // 0' "$f")")
      jq --arg v "$verdict" '. + { tunnel: $v }' "$f"
    done
  } | jq -s '.'
  exit 0
fi

echo "🌲 forest"

if [[ ${#FILES[@]} -eq 0 ]]; then
  # .why an explicit row: an empty tree that prints only its header reads as a
  #      truncated report. absence is an answer, and it should sound like one.
  echo "   └─ (none registered)"
  exit 0
fi

for i in "${!FILES[@]}"; do
  f="${FILES[$i]}"
  [[ $i -eq $((${#FILES[@]} - 1)) ]] && glyph="└─" || glyph="├─"

  name=$(jq -r '.name // "?"' "$f")
  user=$(jq -r '.user // "?"' "$f")
  host=$(jq -r '.host // "?"' "$f")
  port=$(jq -r '.port // "?"' "$f")
  alias=$(jq -r '.sshAlias // .name // "?"' "$f")

  if [[ -z "$PROBE" ]]; then
    echo "   $glyph 🌳 $name → $user@$host:$port (ssh:$alias)"
    continue
  fi

  verdict=$(__grove_probe_tunnel "$host" "$port")
  case "$verdict" in
    live) mark="🟢 live" ;;
    mute) mark="🔴 MUTE — bound, but no greeting"; broken=1 ;;
    down) mark="🔴 DOWN — no listener on the port";  broken=1 ;;
    odd)  mark="🟡 odd — a listener answered, and it is not ssh"; broken=1 ;;
  esac

  echo "   $glyph 🌳 $name → $user@$host:$port (ssh:$alias)"
  cont="│"; [[ $i -eq $((${#FILES[@]} - 1)) ]] && cont=" "
  if [[ "$verdict" == "live" ]]; then
    echo "   $cont     └─ $mark"
  else
    # 🔴 the cure rides WITH the finding — a verdict a reader must go look
    # up is a verdict they will act on late (rule.require.errors-name-the-fix)
    echo "   $cont     ├─ $mark"
    echo "   $cont     └─ fix → rhx git.grove.wake $name"
  fi
done

# ── the closing verdict ──────────────────────────────────────────────
# .why say the clean case OUT LOUD: a report that prints rows and stops
# leaves the reader to tally it themselves, and a silent pass reads the
# same as a check that never ran
if [[ -n "$PROBE" ]]; then
  echo ""
  if [[ -n "${broken:-}" ]]; then
    echo "🛟 a tunnel is broken — wake it. the verb is idempotent and per-leg,"
    echo "   so it repairs only what is down and prints [KEEP] for the rest"
  else
    echo "🌊 every tunnel carries — each one greeted with SSH-2.0"
  fi
fi
