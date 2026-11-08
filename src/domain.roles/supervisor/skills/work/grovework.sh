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
  printf 'the box answered on %s and refused — is sshd up there, and is %s its port? (a stale port in the row reads this way; re-register — git grove set %s --at camper@%s:22)' "$port" "$port" "$name" "$host"
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

######################################################################
# the forest read — select the groves, run one payload on each at once,
# and fold each result into one row
#
# .what = the fan-out every forest read makes (`rhx git.crew.tokens`,
#         `rhx git.grove.capacity`): the rows folded onto their reach
#         host:port (local last), one payload per grove under its own
#         clock, and the rc → read | timeout | refused | asleep | unreadable
#         ladder
#
# .why  = the two forest readers each carried a copy of the fan-out and
#         the ladder, so a fix to one verdict had to land twice. one copy
#         here, on the reach reader above, so a forest read dials a grove
#         where wake, list, saturation, and spend dial it, and hands back
#         the cure they hand back
#
# usage:
#   source "$SKILL_DIR/work/grovework.sh"
#   grovework_select "$ONLY"                     # sets GROVES, GROVE_PROBER, GROVES_DIR
#   grovework_fanout "$PAYLOAD" "$TIMEOUT" "$WORK"
#   ROWS=$(grovework_rows "$WORK" "$TIMEOUT" "rhx git.crew.tokens")
#
# guarantee:
#   - grovework_select exits 2 on a grove that is not registered
#   - an unreadable row is left out of the read; the reach reader names it
#   - grovework_fanout waits on its own probes alone, never on a peer
#     background job of the caller
#   - each grove's files are keyed on its index, so two hosts whose
#     names fold alike never write one file
#   - a result with no parse is never `read`: an empty or non-json stdout
#     reads `unreadable`
######################################################################

# .what = the registered groves to read, folded onto their reach host:port, local last
# .in   = $1 = a grove name, `local`, or empty for every grove + local
# .out  = GROVES (keys), GROVE_PROBER (key → row name), GROVE_HOST, GROVE_PORT,
#         GROVE_USER (key → the prober's reach), GROVES_DIR
# .note = a camper entry displaces a ground prober on one host:port, never the
#         reverse — the same fold git.grove.saturation makes
grovework_select() {
  local only="$1" e f key r_host r_port r_user
  # the sprout and crew verbs name a grove as cloud://<name> or house://<name>; the registry keys on the bare name
  only="${only#cloud://}"
  only="${only#house://}"
  GROVES_DIR="$(__grove_rows_dir)"
  local entries=()
  if [[ "$only" == "local" ]]; then
    :
  elif [[ -n "$only" ]]; then
    [[ -f "$GROVES_DIR/$only.json" ]] || {
      echo "✋ ConstraintError: grove '$only' is not registered" >&2
      echo "   └─ see what is: rhx git.grove.list" >&2
      exit 2
    }
    entries+=("$only")
  elif [[ -d "$GROVES_DIR" ]]; then
    while IFS= read -r f; do
      entries+=("$(basename "$f" .json)")
    done < <(find "$GROVES_DIR" -maxdepth 1 -name '*.json' | sort)
  fi
  declare -gA GROVE_PROBER=() GROVE_HOST=() GROVE_PORT=() GROVE_USER=()
  GROVES=()
  for e in "${entries[@]}"; do
    IFS=$'\t' read -r _ r_host r_port r_user _ _ <<< "$(__grove_reach_of "$GROVES_DIR/$e.json")"
    [[ -n "$r_host" ]] || continue   # unreadable: the reader named it on stderr
    key="$r_host:$r_port"
    if [[ -z "${GROVE_PROBER[$key]:-}" ]]; then
      GROVES+=("$key")
      GROVE_PROBER[$key]="$e"
      GROVE_HOST[$key]="$r_host"; GROVE_PORT[$key]="$r_port"; GROVE_USER[$key]="$r_user"
    elif [[ "${GROVE_USER[$key]}" == "ground" && "$r_user" != "ground" ]]; then
      GROVE_PROBER[$key]="$e"; GROVE_USER[$key]="$r_user"
    fi
  done
  if [[ -z "$only" || "$only" == "local" ]]; then
    GROVES+=("local")
    GROVE_PROBER["local"]="local"
  fi
}

# .what = run one payload on every selected grove at once, each under its own clock
# .why  = one slow or asleep grove must never freeze the forest read
# .out  = $work/g<i>.out, .err, .rc per grove, i its index in GROVES
# .note = over the tailnet, as the prober's user, with HostName pinned, so a
#         stale ssm-era alias of the same name cannot send it into a dead tunnel
grovework_fanout() {
  local payload="$1" timeout="$2" work="$3" quoted i key
  local pids=()
  printf -v quoted '%q' "$payload"
  # a read can take a minute; a human at a terminal sees what it waits on, never a frozen
  # cursor. a pipe, a --json reader, or a test sees naught, so no output contract moves
  if [[ -t 2 ]]; then
    echo "🌲 reads ${#GROVES[@]} grove(s) at once (${GROVES[*]}), up to ${timeout}s each…" >&2
  fi
  for i in "${!GROVES[@]}"; do
    key="${GROVES[$i]}"
    (
      rc=0
      if [[ "$key" == "local" ]]; then
        timeout "$timeout" bash -c "$payload" > "$work/g$i.out" 2> "$work/g$i.err" || rc=$?
      else
        __grove_reach_ssh_opts host="${GROVE_HOST[$key]}" port="${GROVE_PORT[$key]}" wait=8
        timeout "$timeout" ssh -n "${GROVE_REACH_SSH_OPTS[@]}" \
          "${GROVE_USER[$key]}@${GROVE_HOST[$key]}" "bash -c $quoted" > "$work/g$i.out" 2> "$work/g$i.err" || rc=$?
      fi
      echo "$rc" > "$work/g$i.rc"
    ) &
    pids+=("$!")
  done
  (( ${#pids[@]} == 0 )) || wait "${pids[@]}"
}

# .what = one row per grove: read | timeout | refused | asleep | unreadable, with a hint
# .in   = $1 = the fan-out's work dir, $2 = its timeout, $3 = the verb to re-read with
# .out  = a json array of {grove, state, hint, record}
# .note = the cures are the reach reader's own, so a forest read and
#         git.grove.saturation never disagree on one grove: a refusal proves
#         the tailnet carried the connect (sshd or its port, never a wake); no
#         answer at all takes the cure its power lever names (wake, or tailnet)
grovework_rows() {
  local work="$1" timeout="$2" verb="$3" i key name rc err state hint record
  local rows="[]"
  for i in "${!GROVES[@]}"; do
    key="${GROVES[$i]}"
    name="${GROVE_PROBER[$key]}"
    rc=$(cat "$work/g$i.rc" 2>/dev/null || echo 1)
    err=$(head -1 "$work/g$i.err" 2>/dev/null || true)
    state="read"; hint=""; record="null"
    if [[ "$rc" == "0" ]] && record=$(jq -c '.' "$work/g$i.out" 2>/dev/null) && [[ -n "$record" && "$record" != "null" ]]; then
      :
    elif [[ "$rc" == "124" ]]; then
      state="timeout"; record="null"
      hint="a slow read is a load signal; re-read once: $verb $name --timeout $((timeout * 2))"
    elif [[ "$err" == *"Connection refused"* ]]; then
      state="refused"; record="null"
      hint="$(__grove_refused_cure name="$name" host="${GROVE_HOST[$key]}" port="${GROVE_PORT[$key]}")"
    elif [[ "$err" == *"No route to host"* \
         || ( "$err" == *"connect to host"* && "$err" == *"timed out"* ) \
         || "$err" == *"Could not resolve hostname"* || "$err" == *"Name or service not known"* ]]; then
      # no answer on the tailnet at all: an offline peer drops the SYN, it never refuses.
      # ssh's words are quoted verbatim: a matcher against another program's output
      state="asleep"; record="null"; hint="$(__grove_unreached_cure "$name" via=row)"
    # .note = ssh's own clock (not rc 124): the box answered at the network layer, then
    #         spared no process for the login. a load signal, or a flap; no record either way
    elif [[ "$err" == *"timed out"* || "$err" == *"Timeout"* ]]; then
      state="timeout"; record="null"
      hint="ssh got no login in time — a load signal, or a flap; re-read once: $verb $name --timeout $((timeout * 2))"
    else
      state="unreadable"; record="null"; hint="exit $rc: ${err:-no stderr}"
    fi
    rows=$(jq -c --arg grove "$name" --arg state "$state" --arg hint "$hint" --argjson record "$record" \
      '. + [{grove: $grove, state: $state, hint: $hint, record: $record}]' <<<"$rows") || {
      echo "💥 MalfunctionError: the row of grove $name did not fold" >&2
      exit 1
    }
  done
  printf '%s\n' "$rows"
}

######################################################################
# the crew — which tree a seat sits in, and which kind that tree is
#
# .what = GROVEWORK_JQ_CREW: `def crewroot($cwd; $home)` — the tree a seat cwd sits in
#         get_crew_kinds: crew roots on stdin → a json map root → kind
#
# .the kinds (F11)
#   behavior  = a worktree whose branch binds a behavior route
#               (`.behavior/*/.route/.bind.<branch>.flag`)
#   directive = a repo root under ~/git, outside every `_worktrees` tree
#   other     = a worktree with no bound route
#   a cwd in neither shape is "(outside any repo)" and kind other
#
# .note = a probe runs on the grove, so it carries these as text:
#         grovework_payload_lib prints them, `declare`-quoted
######################################################################
# shellcheck disable=SC2034 # read by the payloads that embed this lib
GROVEWORK_JQ_CREW='
  def crewroot($cwd; $home): (($cwd | capture("^(?<root>.*/_worktrees/[^/]+)").root)
    // ($cwd | capture("^(?<root>" + ($home | gsub("[.]"; "\\.")) + "/git/[^/]+/[^/]+)").root)
    // "(outside any repo)");
'

get_crew_kinds() {
  local root kind branch flag
  while read -r root; do
    [[ -n "$root" && "$root" != "(outside any repo)" ]] || continue
    kind="directive"
    if [[ "$root" == */_worktrees/* ]]; then
      kind="other"
      # .note = a detached head reads an empty branch (exit 0), and kind other is right there;
      #         a git that fails (no repo, no git) is named on stderr, never filed in silence
      if ! branch=$(git -C "$root" branch --show-current 2>/dev/null); then
        echo "💥 MalfunctionError: the branch of $root did not read (git failed); filed as kind other" >&2
        branch=""
      fi
      flag=".bind.${branch//\//.}.flag"
      if [[ -n "$branch" ]] && compgen -G "$root/.behavior/*/.route/$flag" >/dev/null; then
        kind="behavior"
      fi
    fi
    printf '%s\t%s\n' "$root" "$kind"
  done | jq -R -s -c 'split("\n") | map(select(length > 0) | split("\t") | {(.[0]): .[1]}) | add // {}'
}

# .what = the crew lib as source text, for a payload to embed
grovework_payload_lib() {
  declare -p GROVEWORK_JQ_CREW
  declare -f get_crew_kinds
}