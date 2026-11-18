#!/usr/bin/env bash
######################################################################
# .what = probe, read-only, whether this machine reaches each grove over
#         the camp tailnet: is this box a peer, does each grove's tailnet
#         name answer, and does its seat user accept our ssh key
#
# .why  = the supervisor's reach moves from the ssm tunnel to the tailnet.
#         these three facts decide whether that reach can work from here,
#         and they are owed again at every verification — so they are one
#         call, never three hand-typed commands per grove
#
# usage:
#   grove.reach.probe.sh                       # every row in the forest
#   grove.reach.probe.sh --host <tailnet-host> # add a host with no row (repeatable)
#
# guarantee:
#   - reads ~/.git.forest/groves/*.json; never writes a row or ~/.ssh/config
#   - the ssh probe uses StrictHostKeyChecking=accept-new, so a FIRST contact
#     records the host key in ~/.ssh/known_hosts (the one write); a changed
#     key still refuses
#   - host, port, and user per row come from the ONE reach reader the
#     supervisor skills ride (work/grovework.sh `__grove_reach_of`), so this
#     probe can never name an endpoint the wake would not dial
#   - exit 0 = probes ran (findings are reported, never an error)
#   - exit 2 = bad args, or run outside this repo
######################################################################
set -uo pipefail

HOSTS_EXTRA=()
while [[ $# -gt 0 ]]; do
  case "$1" in
    --host)
      [[ $# -ge 2 && -n "$2" ]] || { echo "✋ ConstraintError: --host needs a value — e.g. --host grove-sandpine-v20260901" >&2; exit 2; }
      HOSTS_EXTRA+=("$2"); shift 2 ;;
    --skill|--repo|--role) shift 2 ;;
    -h|--help)
      awk 'NR<=2 { next } /^####/ { exit } { sub(/^# ?/, ""); print }' "$0"
      exit 0 ;;
    *) echo "✋ ConstraintError: unknown arg '$1' (known: --host <h>, --help)" >&2; exit 2 ;;
  esac
done

# the reach of a row lives in ONE reader; this repo-local skill sources it from
# the repo's src, so the probe and every supervisor verb agree on where a grove
# answers. .why src and not `rhx git.grove.list --json`: that verb runs the
# linked build, which lags src until a build and a link — the probe would then
# check a different reader than the code under work. a moved lib fails loud here
REPO_ROOT=$(git rev-parse --show-toplevel) || {
  echo "✋ ConstraintError: not inside a git repo" >&2
  echo "   └─ fix: run it from within this repo's worktree" >&2
  exit 2
}
GROVEWORK="$REPO_ROOT/src/domain.roles/supervisor/skills/work/grovework.sh"
[[ -f "$GROVEWORK" ]] || {
  echo "💥 MalfunctionError: the reach reader is absent at $GROVEWORK" >&2
  echo "   └─ fix: point GROVEWORK in this probe at where work/grovework.sh now lives" >&2
  exit 1
}
source "$GROVEWORK"
GROVES_DIR="$(__grove_rows_dir)"

echo "🐢 heres the wave..."
echo ""
echo "🌳 grove.reach.probe"

# (a) is this machine a tailnet peer?
echo "   ├─ (a) tailnet peer: tailscale status"
if ! command -v tailscale >/dev/null 2>&1; then
  echo "   │  └─ 🔴 no tailscale binary on this machine"
else
  STATUS_OUT=$(tailscale status 2>&1); STATUS_RC=$?
  echo "   │  ├─ exit $STATUS_RC"
  while IFS= read -r line; do echo "   │  │  $line"; done <<< "$STATUS_OUT"
  echo "   │  └─"
fi

# rows → host / port / user
ROWS=()
if [[ -d "$GROVES_DIR" ]]; then
  while IFS= read -r f; do ROWS+=("$f"); done < <(find "$GROVES_DIR" -maxdepth 1 -name '*.json' | sort)
fi

# .what = the first ip dns gives for a name; empty if none
__dns_ip_of() {
  getent hosts "$1" | awk 'NR==1 { print $1 }'
}

# .what = where ~/.ssh/config sends a name, as host:port
__ssh_cfg_dest_of() {
  ssh -G "$1" 2>/dev/null | awk '$1 == "hostname" { h = $2 } $1 == "port" { p = $2 } END { print h ":" p }'
}

# .what = probe one endpoint; named args: label= host= port= user=
__probe() {
  local label="" host="" port="" user="" arg
  for arg in "$@"; do
    case "$arg" in
      label=*) label="${arg#label=}" ;;
      host=*)  host="${arg#host=}" ;;
      port=*)  port="${arg#port=}" ;;
      user=*)  user="${arg#user=}" ;;
      *) echo "💥 MalfunctionError: __probe got an unnamed arg '$arg'" >&2; return 1 ;;
    esac
  done
  echo "   ├─ $label → $user@$host:$port"
  if command -v tailscale >/dev/null 2>&1; then
    local ping_out ping_rc
    ping_out=$(tailscale ping -c 1 --timeout 5s "$host" 2>&1); ping_rc=$?
    echo "   │  ├─ (b) tailscale ping -c 1 --timeout 5s $host → exit $ping_rc"
    echo "   │  │  └─ $(head -1 <<< "$ping_out")"
  fi
  # where each layer sends this name: an extant ~/.ssh/config alias of the
  # same name shadows the tailnet host, so the config view and the dns view differ
  local dns_ip cfg_dest
  dns_ip=$(__dns_ip_of "$host")
  cfg_dest=$(__ssh_cfg_dest_of "$host")
  echo "   │  ├─ lookup: dns ${dns_ip:-none} · ssh-config $cfg_dest"

  # (c) via ~/.ssh/config — what every crew verb does today
  local ssh_out ssh_rc
  ssh_out=$(ssh -n -o BatchMode=yes -o ConnectTimeout=8 -o StrictHostKeyChecking=accept-new -p "$port" "$user@$host" true 2>&1); ssh_rc=$?
  echo "   │  ├─ (c) via ~/.ssh/config: ssh -o BatchMode=yes -o ConnectTimeout=8 -o StrictHostKeyChecking=accept-new -p $port $user@$host true → exit $ssh_rc"
  [[ -n "$ssh_out" ]] && echo "   │  │  └─ $(tail -1 <<< "$ssh_out")"

  # (c') raw — ~/.ssh/config bypassed, so the tailnet name alone decides
  ssh_out=$(ssh -F /dev/null -n -o BatchMode=yes -o ConnectTimeout=8 -o StrictHostKeyChecking=accept-new -o UserKnownHostsFile="$HOME/.ssh/known_hosts" -p "$port" "$user@$host" true 2>&1); ssh_rc=$?
  echo "   │  └─ (c') raw, -F /dev/null: same probe → exit $ssh_rc"
  [[ -n "$ssh_out" ]] && echo "   │     └─ $(tail -1 <<< "$ssh_out")"
}

for f in "${ROWS[@]}"; do
  IFS=$'\t' read -r _ host port user _ name <<< "$(__grove_reach_of "$f")"
  [[ -n "$host" ]] || continue   # unreadable: the reader named it on stderr
  __probe label="row $name" host="$host" port="$port" user="$user"
done
for h in "${HOSTS_EXTRA[@]}"; do
  __probe label="host $h (no row)" host="$h" port=22 user=camper
done

echo "   └─ done: ${#ROWS[@]} row(s), ${#HOSTS_EXTRA[@]} extra host(s)"
