#!/usr/bin/env bash
######################################################################
# .what = the reach of a grove: where it answers, as whom, and how it powers up
#
# .why  = every grove is reached one way — ssh over the camp tailnet, as
#         camper. aws keeps one job: to power an ec2 grove up. wake, list,
#         saturation, spend, and every no-answer cure ask THIS reader, so no two
#         of them can disagree about where a grove answers.
#
#         two axes per row, never one:
#           power  aws  — the row holds `account`; the box may sleep
#                  none — no power lever; the grove does not sleep
#           reach  ssh <user>@<host> -p <port>, over the tailnet
#
# .note = sourced, never executed: a lib of definitions only. a caller sources
#         it; it runs naught at source time.
######################################################################

# .what = the dir that holds one json row per grove
__grove_rows_dir() {
  printf '%s\n' "${GIT_FOREST_DIR:-$HOME/.git.forest}/groves"
}

# .what = the reach of one grove row, as one tab-separated line
#   in:  $1 = the row's path
#   out: power \t host \t port \t user \t alias \t name
#
# .rules
#   power = aws when the row holds `account`, else none
#   host  = .host, unless loopback (localhost, 127.0.0.1, ::1) or absent — a
#           relic of the ssm tunnel — then .exid // .name. .exid first: a
#           `.ground` row's name is a seat, while its exid names the grove
#   port  = 22 for a loopback host, else .port // 22. a loopback port was the
#           tunnel's local end and means naught over the tailnet. an ABSENT host
#           is no tunnel relic — every ssm-era row held `localhost` — so a
#           hand-written row's own port (a sshd on 2222) still holds
#   user  = .user // camper
#   alias = .sshAlias // .name — the ~/.ssh/config entry the crew verbs ride
#
# .note = a drifted tailnet name (a rebuilt grove that rejoined as `<exid>-1`)
#         is pinned by the row's own `.host`; .exid is only the fallback
#
# .note = an unreadable row prints its cause and a named fix to stderr and
#         returns 2: not json · no name · `type: ec2` or `nat` with no account
#         (it would read as power `none`) · a field outside its ssh grammar. jq absent is a
#         malfunction, returns 1. an empty string falls back as an absent field
#         does. a caller reads this through `<<< "$(…)"`, which drops the exit
#         code, so the stderr line is what keeps a corrupt row from a silent
#         probe of an empty host
__grove_reach_of() {
  local row="$1" why="" fix="re-register it — git grove set <grove> --at camper@<tailnet-host>:22"
  # each cause names its own fix: jq absent is ours; a row that is not json, has
  # no name, contradicts itself, or holds a field outside its grammar is the caller's
  if ! command -v jq >/dev/null 2>&1; then
    echo "💥 MalfunctionError: jq is absent on this machine; no grove row can be read" >&2
    echo "   └─ fix: install jq, then retry" >&2
    return 1
  fi
  if ! jq empty "$row" >/dev/null 2>&1; then
    why="not json"
  elif ! jq -e 'type == "object" and ((.name // "") | tostring) != ""' "$row" >/dev/null 2>&1; then
    why="json, but no .name"
  elif jq -e '(.type // "") == "ec2" and ((.account // "") | tostring) == ""' "$row" >/dev/null 2>&1; then
    # an ec2 box without its account would read as power `none`: a box that sleeps
    # would be told it has no lever, and handed a tailnet cure in place of a wake
    why="type ec2, but no account — its power lever cannot be found"
    fix="name its account — git grove set <grove> --account <12-digit id>"
  elif jq -e '((.nat // "") | tostring) != "" and ((.account // "") | tostring) == ""' "$row" >/dev/null 2>&1; then
    # a nat is an aws lever: with no account the wake would read power `none` and
    # drop the nat in silence
    why="nat, but no account — its power lever cannot be found"
    fix="name its account — git grove set <grove> --account <12-digit id>"
  fi

  # an empty string falls back exactly as an absent field does: `read` with a tab
  # IFS merges adjacent tabs, so an empty column would shift every later field
  local line="" power="" host="" port="" user="" alias="" name=""
  if [[ -z "$why" ]]; then
    line=$(jq -r '
      def or_(a; b): if ((a // "") | tostring) == "" then b else (a | tostring) end;
      ((.host // "") | tostring) as $h
      | ($h == "localhost" or $h == "127.0.0.1" or $h == "::1") as $loopback
      | [ (if ((.account // "") | tostring) != "" then "aws" else "none" end),
          (if ($loopback or $h == "") then or_(.exid; .name | tostring) else $h end),
          (if $loopback then "22" else or_(.port; "22") end),
          or_(.user; "camper"),
          or_(.sshAlias; .name | tostring),
          (.name | tostring) ]
      | @tsv
    ' "$row")
    IFS=$'\t' read -r power host port user alias name <<< "$line"

    # every value below reaches ssh as argv, and some reach ~/.ssh/config: one
    # grammar per field, held HERE where each is final for every caller. a `-`
    # at the front would read as an ssh option (`-oProxyCommand=`)
    if [[ "$host" == -* || "$host" == *[!A-Za-z0-9._:-]* ]]; then
      why="host '$host' is outside [A-Za-z0-9._:-], or starts with '-'"
    elif [[ -z "$port" || "$port" == *[!0-9]* ]]; then
      why="port '$port' is not a number"
    elif [[ "$user" == -* || "$user" == *[!A-Za-z0-9._-]* ]]; then
      why="user '$user' is outside [A-Za-z0-9._-], or starts with '-'"
    elif [[ "$alias" == -* || "$alias" == *[!A-Za-z0-9._-]* ]]; then
      why="sshAlias '$alias' is outside [A-Za-z0-9._-], or starts with '-'"
    fi
  fi

  if [[ -n "$why" ]]; then
    echo "✋ ConstraintError: grove row unreadable — $why" >&2
    echo "   ├─ row: $row" >&2
    echo "   └─ fix: $fix" >&2
    return 2
  fi
  printf '%s\t%s\t%s\t%s\t%s\t%s\n' "$power" "$host" "$port" "$user" "$alias" "$name"
}

# .what = the ssh options of one reach probe, into the array GROVE_REACH_SSH_OPTS
#   in:  host=<host> port=<port> [wait=<connect timeout, seconds; default 8>]
#        named, so a call site reads which value is which
#
# .why  = `HostName` is pinned on the command line. an ssm-era alias of the
#         same name (`Host <exid>` → `localhost:<tunnel>`) would otherwise send
#         the probe into a dead tunnel: ssh takes HostName from ~/.ssh/config
#         even when `-p` is given. a command-line `-o` wins, with no write.
#         `accept-new` records a new grove's key on first contact over an
#         authenticated tailnet link; a CHANGED key still refuses, loud
#
# .note = it writes an array, since bash cannot return one. call it DIRECTLY,
#         never in `$(…)`: a subshell's write never reaches the caller, and the
#         probe would run with no HostName pin. so a missed host or port fails
#         loud here rather than yield a half-built array
__grove_reach_ssh_opts() {
  local host="" port="" wait="8" arg
  for arg in "$@"; do
    case "$arg" in
      host=*) host="${arg#host=}" ;;
      port=*) port="${arg#port=}" ;;
      wait=*) wait="${arg#wait=}" ;;
      *) echo "💥 MalfunctionError: __grove_reach_ssh_opts got an unnamed arg '$arg' (host= port= wait=)" >&2; return 1 ;;
    esac
  done
  if [[ -z "$host" || -z "$port" ]]; then
    echo "💥 MalfunctionError: __grove_reach_ssh_opts needs host= and port=" >&2
    return 1
  fi
  GROVE_REACH_SSH_OPTS=(
    -o BatchMode=yes
    -o "ConnectTimeout=$wait"
    -o StrictHostKeyChecking=accept-new
    -o "HostName=$host"
    -p "$port"
  )
}

# .what = the path of the row whose entry name or ssh alias is $1; empty if none
# .note = the entry name (the row's file) is tried first: it is exact and costs
#         no scan. a crew verb holds the ALIAS instead, so the scan follows
__grove_row_of() {
  local want="$1" dir row
  dir=$(__grove_rows_dir)
  [[ -d "$dir" ]] || return 0
  [[ -n "$want" && "$want" != */* && -f "$dir/$want.json" ]] && { printf '%s\n' "$dir/$want.json"; return 0; }
  local alias
  for row in "$dir"/*.json; do
    [[ -f "$row" ]] || continue
    # an unreadable row is named, never skipped in silence: it may be the one sought
    if ! alias=$(jq -r '.sshAlias // .name // ""' "$row" 2>/dev/null); then
      echo "✋ ConstraintError: grove row unreadable, skipped in the alias scan" >&2
      echo "   ├─ row: $row" >&2
      echo "   └─ fix: re-register it — git grove set <grove> --at camper@<tailnet-host>:22" >&2
      continue
    fi
    if [[ "$alias" == "$want" ]]; then
      printf '%s\n' "$row"
      return 0
    fi
  done
  return 0
}

# .what = whether ssh, asked for a grove's alias, dials the row's host, port and user
#   in:  alias=<ssh alias> host=<tailnet host> port=<port> user=<login>
#   out: exit 0 if converged, else 1
# .why  = only the wake writes the alias, and every crew verb rides it. a grove
#         registered but never woken from this machine has no alias, so ssh
#         dials the bare name as the local user — and every no-answer cure that
#         names only the tailnet points away from the one step that fixes it
# .note = an alias equal to its host is no exemption: with no entry, ssh dials
#         that name as the local user on its default port, never as camper. on a
#         grove whose own login is camper, ssh's defaults already match, and the
#         same read says converged — so the one check holds for both seats
__grove_alias_converged() {
  local alias="" host="" port="" user="" arg cfg="$HOME/.ssh/config" said
  for arg in "$@"; do
    case "$arg" in
      alias=*) alias="${arg#alias=}" ;;
      host=*)  host="${arg#host=}" ;;
      port=*)  port="${arg#port=}" ;;
      user=*)  user="${arg#user=}" ;;
      *) echo "💥 MalfunctionError: __grove_alias_converged got an unnamed arg '$arg' (alias= host= port= user=)" >&2; return 1 ;;
    esac
  done
  [[ -f "$cfg" ]] || cfg=/dev/null
  said=$(ssh -n -G -F "$cfg" "$alias" 2>/dev/null) || return 1
  grep -qix "hostname $host" <<< "$said" || return 1
  [[ -z "$port" ]] || grep -qx "port $port" <<< "$said" || return 1
  [[ -z "$user" ]] || grep -qx "user $user" <<< "$said" || return 1
  return 0
}

# .what = the alias-write cure for a registered grove whose alias is absent; empty if none is owed
#   in:  $1 = the ssh alias or grove name a verb could not reach
#   out: one line, or naught when no row matches or its alias is converged
__grove_alias_absent_cure() {
  local who="$1" row power host port user alias name
  row=$(__grove_row_of "$who")
  [[ -n "$row" ]] || return 0
  IFS=$'\t' read -r power host port user alias name <<< "$(__grove_reach_of "$row")"
  [[ -n "$host" ]] || return 0
  __grove_alias_converged alias="$alias" host="$host" port="$port" user="$user" && return 0
  if [[ "$power" == "none" ]]; then
    printf 'write its ssh alias first — rhx git.grove.wake %s (power none: it touches no aws), then retry' "$name"
    return 0
  fi
  printf 'wake it — rhx git.grove.wake %s (it writes the ssh alias every crew verb rides)' "$name"
}

# .what = the tailnet host of a grove, from its row; empty if no row or unreadable
#   in:  $1 = the ssh alias or grove name
#   out: the host, or naught
__grove_host_of() {
  local row host
  row=$(__grove_row_of "$1")
  [[ -n "$row" ]] || return 0
  IFS=$'\t' read -r _ host _ _ _ _ <<< "$(__grove_reach_of "$row" 2>/dev/null)"
  printf '%s' "$host"
}

# .what = the tailnet half of every no-answer cure, for one tailnet host
#   in:  $1 = the grove's tailnet host
#   out: one line — is this machine a peer, then does the grove's name answer
# .why  = the wake's own diagnosis and the one-line cure both name these two
#         checks; one transformer keeps their words from drift
__grove_tailnet_cure() {
  printf 'check the tailnet — tailscale status (is this machine a peer?), then tailscale ping %s' "$1"
}

# .what = the cure for a probe of the row's reach that the box refused
#   in:  name= host= port=
#   out: one line — sshd and its port, never the tailnet, never a wake
# .why  = a refusal proves the tailnet carried the connect and the box is up, so
#         neither the tailnet checks nor a wake can cure it. the common cause is a
#         stale ssm-era port in the row; list, saturation, and spend share these
#         words so the three never disagree on one grove
__grove_refused_cure() {
  local name="" host="" port="" arg
  for arg in "$@"; do
    case "$arg" in
      name=*) name="${arg#name=}" ;;
      host=*) host="${arg#host=}" ;;
      port=*) port="${arg#port=}" ;;
      *) echo "💥 MalfunctionError: __grove_refused_cure got an unnamed arg '$arg' (name= host= port=)" >&2; return 1 ;;
    esac
  done
  printf 'the box answered on %s and refused — is sshd up there, and is %s its port? (a stale ssm-era port reads this way; re-register — git grove set %s --at camper@%s:22)' "$port" "$port" "$name" "$host"
}

# .what = the cure for a grove that did not answer, per its power
#   in:  $1 = the ssh alias or grove name that did not answer
#        $2 = via=row, optional — the caller probed the row's reach, never the
#             alias, so an absent alias cannot explain its miss (list, saturation)
#   out: one line — the cure, with the command to run
#
# .why  = "wake it" is the cure only where a power lever exists. a grove with
#         no aws account does not sleep, so to hand it the wake is a confident
#         wrong fix. its cure is the tailnet: is THIS machine a peer, and does
#         the grove's tailnet name answer? the verdict word beside the cure
#         (`asleep`, `DOWN`, `MUTE`) is not this transformer's to change
#
# .note = no row → the extant wake cure: the wake is what writes a row's alias,
#         and it names the absent row itself
__grove_unreached_cure() {
  local who="$1" via="${2:-via=alias}" row power host name
  case "$via" in
    via=row|via=alias) ;;
    *) echo "💥 MalfunctionError: __grove_unreached_cure got '$via' (via=row|via=alias)" >&2; return 1 ;;
  esac
  row=$(__grove_row_of "$who")
  if [[ -n "$row" ]]; then
    IFS=$'\t' read -r power host _ _ _ name <<< "$(__grove_reach_of "$row")"
    if [[ "$power" == "none" ]]; then
      # a grove never woken from this machine has no alias: the wake (no aws,
      # for power none) is the one step that writes it, so it comes first —
      # for a verb that rides the alias. a probe of the row's reach skips it
      local absent=""
      [[ "$via" == "via=alias" ]] && absent=$(__grove_alias_absent_cure "$who")
      [[ -n "$absent" ]] && { printf '%s\n' "$absent"; return 0; }
      printf '%s\n' "$(__grove_tailnet_cure "$host")"
      return 0
    fi
    # an unreadable row keeps the alias as given; the reader named its fix
    [[ -n "$name" ]] && who="$name"
  fi
  printf 'wake it — rhx git.grove.wake %s\n' "$who"
}
