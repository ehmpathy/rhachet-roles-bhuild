#!/usr/bin/env bash
######################################################################
# .what = list every registered grove, and PROBE whether it answers over the
#         camp tailnet
#
# .why  = a grove's ssh alias, user, host, and port are what every remote
#         duct address is built from, so a supervisor needs them enumerable
#         without a guess and without a login. host and port are read through
#         the one reach reader (work/grovework.sh), so a relic row from the ssm
#         era (`host: localhost`) is listed where the wake will reach it.
#
# 🔴 .and a registry row is CONFIG, never STATE — so a list alone answers
#    the wrong question. the row says where the grove SHOULD answer; it says
#    naught about whether it does.
#
#    ⇒ so this skill READS THE BANNER, which is the record rather than a
#      correlate. sshd greets every connection with `SSH-2.0-…` unprompted,
#      so that banner is proof the grove's sshd is alive and served us. it
#      needs no credential, no key, and no login — we hang up before a single
#      byte is sent back. measured 2026-09-08: a port that accepts and stays
#      silent is the costly case, since no call ever says `Connection refused`
#
# .the verdicts — the cure rides with each, per its cause, then per power
#   🟢 live  — connected, and `SSH-2.0-…` came back
#   🔴 mute  — connected, and no banner came back — a starved grove: read its load
#   🔴 down  — refused (sshd or its port), or a silence or unknown name
#   🟡 odd   — a listener answered that is not ssh: is the row's port right?
#
#   the cure for a silence or unknown name: an ec2 grove (power aws) is handed
#   `rhx git.grove.wake`, which is idempotent and per-leg. a grove with no aws
#   lever does not sleep, so it is handed the tailnet: `tailscale status`, then
#   `tailscale ping <host>`. a refusal, a mute, or an odd banner prove the
#   tailnet carried the connect, so none of them is handed the tailnet
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
#   - a probe is bounded by --timeout (default 5s; a first contact over a tailnet relay can take a second), so an unreachable grove
#     costs seconds, never a hang
#   - exit 0 = listed (an EMPTY forest is a valid answer, not a failure).
#     ⚠️ a mute or down grove is REPORTED, never an error — this is a
#     read, and a broken tunnel is a finding rather than a malfunction
#   - exit 2 = constraint (no registry at all)
######################################################################
set -euo pipefail

FORMAT="tree"
PROBE="1"
TIMEOUT="5"

# ── probe one tunnel, without a login ────────────────────────────────
# .why the BANNER and not a port check: a bound port proves a listener
# exists, never that it carries. sshd volunteers `SSH-2.0-…` the moment a
# connection is accepted, so the greeting is the one byte-level record that
# traffic crossed the tunnel end to end (term=grove.tunnel, row 4).
#
# ⚠️ `read -t` returns non-zero on timeout, and this file runs under
# `set -e` — so every read sits inside an `if`, never bare.
#
# ⚠️ the connect is bounded too. over the tailnet, an offline peer does not
# refuse — the SYN goes unanswered, and a bare `/dev/tcp` open waits out the
# kernel's own retry clock (minutes). so the open and the read run together
# under one `timeout`, and a `C` printed between them parts the two silences:
#   no `C`  → the connect never completed  → down
#   `C`     → accepted, then no banner     → mute
#
# out: verdict \t cause. the cause rides only on `down`, in fixed words, since
# the three ways a grove reads down want three different next moves
__grove_probe_tunnel() {
  local host="$1" port="$2" said="" errfile err=""
  errfile=$(mktemp)
  said=$(timeout "$TIMEOUT" bash -c '
    exec 3<>"/dev/tcp/$1/$2" || exit 9
    printf C
    IFS= read -r banner <&3 && printf "%s" "$banner"
  ' _ "$host" "$port" 2>"$errfile") || true
  err=$(head -1 "$errfile")
  rm -f "$errfile"

  case "$said" in
    CSSH-*) printf 'live\t\n' ;;
    C)      printf 'mute\t\n' ;;   # accepted, then silent — a starved grove
    C*)     printf 'odd\t\n' ;;    # a listener whose banner is not ssh
    *)      printf 'down\t%s\n' "$(__grove_probe_down_cause "$err")" ;;
  esac
}

# .what = the cause of a `down`, in fixed words, from the connect's own error
__grove_probe_down_cause() {
  case "$1" in
    *refused*) printf 'refused — the box answers; no sshd on this port' ;;
    *"not known"* | *"failure in name"* | *"No address"*) printf 'the name is unknown to dns — is it a tailnet peer?' ;;
    "") printf 'no answer within %ss — asleep, or off the tailnet' "$TIMEOUT" ;;
    *) printf '%s' "${1##*: }" ;;
  esac
}

# .what = the fix for a grove that did not greet, per the cause the probe saw
#   in:  verdict= cause= name= host= port=
#   out: one line
# .why  = a refusal, a mute connect, or a non-ssh banner each prove the tailnet
#         CARRIED the connect, so the tailnet checks are the wrong cure for them;
#         only a silence or an unknown name points at the tailnet (or, for an ec2
#         box, at its sleep). a starved box is starved whatever its power
__grove_probe_fix() {
  local verdict="" cause="" name="" host="" port="" arg
  for arg in "$@"; do
    case "$arg" in
      verdict=*) verdict="${arg#verdict=}" ;;
      cause=*)   cause="${arg#cause=}" ;;
      name=*)    name="${arg#name=}" ;;
      host=*)    host="${arg#host=}" ;;
      port=*)    port="${arg#port=}" ;;
      *) echo "💥 MalfunctionError: __grove_probe_fix got an unnamed arg '$arg'" >&2; return 1 ;;
    esac
  done
  case "$verdict:$cause" in
    mute:*)
      printf 'a starved grove — read its load: rhx git.grove.saturation --only %s (a wake cures naught here)' "$name" ;;
    odd:*)
      printf 'is %s the grove'"'"'s sshd port? if not, re-register — git grove set %s --at camper@%s:22' "$port" "$name" "$host" ;;
    down:refused*)
      __grove_refused_cure name="$name" host="$host" port="$port" ;;
    *)
      __grove_unreached_cure "$name" via=row ;;
  esac
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

# the reach of a row lives in ONE reader, shared with wake, saturation, and
# every no-answer cure — so the list probes exactly where the wake reaches
source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/work/grovework.sh"
GROVES_DIR="$(__grove_rows_dir)"

if [[ ! -d "$GROVES_DIR" ]]; then
  echo "🐢 bummer dude — no forest registry at $GROVES_DIR" >&2
  echo "" >&2
  echo "  fix: register a grove, in the shape of its box, which creates it —" >&2
  echo "    a grove with no aws instance (hetzner, any box that never sleeps):" >&2
  echo "      git grove set <grove> --at camper@<tailnet-host>:22" >&2
  echo "    an ec2 grove, which aws powers up:" >&2
  echo "      git grove set <grove> --exid <exid> --env camp --account <id>" >&2
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
  # .why the fields beside the row, one axis each, never mixed:
  #   `.row`    — registry state: `readable` or `unreadable`
  #   `.power`  — the power axis (term=grove.power): `aws` or `none`
  #   `.reach`  — the reach axis: the host:port:user it was probed at. a relic
  #               row's `.host` is `localhost`, so without `.reach` the verdict
  #               would read as a claim about the wrong host
  #   `.tunnel` — the probe verdict (term=grove.tunnel); `.cause` rides on `down`
  # each jq emits ONE object; `jq -s` slurps them into the array a reader expects
  {
    for f in "${FILES[@]}"; do
      IFS=$'\t' read -r r_power r_host r_port r_user _ _ <<< "$(__grove_reach_of "$f")"
      # an unreadable row stays in the array, marked, so the count never shrinks
      # in silence; the reader named its fix on stderr. it was never probed, so
      # its probe fields are null rather than a verdict
      if [[ -z "$r_host" ]]; then
        jq -n --arg name "$(basename "$f" .json)" \
          '{ name: $name, row: "unreadable", power: null, reach: null, tunnel: null, cause: null }'
        continue
      fi
      IFS=$'\t' read -r verdict cause <<< "$(__grove_probe_tunnel "$r_host" "$r_port")"
      jq --arg v "$verdict" --arg cause "$cause" --arg power "$r_power" --arg host "$r_host" \
        --arg port "$r_port" --arg user "$r_user" \
        '. + { row: "readable", power: $power, reach: { host: $host, port: ($port | tonumber), user: $user }, tunnel: $v, cause: (if $cause == "" then null else $cause end) }' "$f"
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

  IFS=$'\t' read -r power host port user alias name <<< "$(__grove_reach_of "$f")"

  # an unreadable row is shown, never probed: an empty host has no answer to read
  if [[ -z "$host" ]]; then
    echo "   $glyph 🌳 $(basename "$f" .json) → 🟡 row unreadable — its fix is named above"
    unreadable=1
    continue
  fi

  if [[ -z "$PROBE" ]]; then
    echo "   $glyph 🌳 $name → $user@$host:$port (ssh:$alias)"
    continue
  fi

  IFS=$'\t' read -r verdict cause <<< "$(__grove_probe_tunnel "$host" "$port")"
  case "$verdict" in
    live) mark="🟢 live" ;;
    mute) mark="🔴 MUTE — connected, but no ssh banner within ${TIMEOUT}s (a starved grove reads this way)"; unanswered=1 ;;
    down) mark="🔴 DOWN — no ssh banner: $cause";  unanswered=1 ;;
    odd)  mark="🟡 odd — a listener answered, and it is not ssh"; odd=1 ;;
  esac

  echo "   $glyph 🌳 $name → $user@$host:$port (ssh:$alias)"
  cont="│"; [[ $i -eq $((${#FILES[@]} - 1)) ]] && cont=" "
  if [[ "$verdict" == "live" ]]; then
    echo "   $cont     └─ $mark"
  else
    # 🔴 the cure rides WITH the finding — a verdict a reader must go look
    # up is a verdict they will act on late (rule.require.errors-name-the-fix).
    # the cure is per cause, then per power: only a silence is the tailnet's
    echo "   $cont     ├─ $mark"
    echo "   $cont     └─ fix → $(__grove_probe_fix verdict="$verdict" cause="$cause" name="$name" host="$host" port="$port")"
  fi
done

# ── the closing verdict ──────────────────────────────────────────────
# .why say the clean case OUT LOUD: a report that prints rows and stops
# leaves the reader to tally it themselves, and a silent pass reads the
# same as a check that never ran. one line per CAUSE: an unreadable row or a
# non-ssh listener is no tailnet silence, so it is never sent to `tailscale status`
if [[ -n "$PROBE" ]]; then
  echo ""
  if [[ -z "${unanswered:-}${odd:-}${unreadable:-}" ]]; then
    echo "🌊 every grove answers over the tailnet — each one greeted with SSH-2.0"
  fi
  if [[ -n "${unanswered:-}" ]]; then
    echo "🛟 a grove did not greet with ssh — each row names its cure, by the cause it saw."
    echo "   first, if every row reads DOWN, is THIS machine a peer? — tailscale status"
  fi
  if [[ -n "${odd:-}" ]]; then
    echo "🛟 a listener answered that is not ssh — is the row's port the grove's sshd?"
  fi
  if [[ -n "${unreadable:-}" ]]; then
    echo "🛟 a row is unreadable — re-register it with the fix named above, then list again"
  fi
fi
