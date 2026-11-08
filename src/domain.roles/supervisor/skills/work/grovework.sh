#!/usr/bin/env bash
######################################################################
# grovework — select the groves, run one payload on each at once, and
#             fold each result into one row
#
# 🔴 .a LIB: sourced, never executed. the verbs that source it are
#     `rhx git.crew.tokens` and `rhx git.grove.capacity`.
#
# .what = the fan-out every forest read makes: the registry folded onto
#         host:port (local last), one payload run per grove under its own
#         clock, and the rc → read | timeout | asleep | unreadable ladder
#
# .why  = the two forest readers each carried a copy of the fan-out and
#         the ladder, so a fix to one verdict had to land twice, and a
#         miss rendered a false verdict on one verb alone. one copy here
#
# .also = the crew kind (fulcrum F11): the payload runs on the grove, so
#         the derivation ships as source text the payload embeds —
#         grovework_payload_lib — and every reader files a crew one way
#
# usage:
#   source "$SKILL_DIR/work/grovework.sh"
#   grovework_select "$ONLY"                     # sets GROVES, GROVE_PROBER, GROVES_DIR
#   grovework_fanout "$PAYLOAD" "$TIMEOUT" "$WORK"
#   ROWS=$(grovework_rows "$WORK" "$TIMEOUT" "rhx git.crew.tokens")
#
# guarantee:
#   - grovework_select exits 2 on a grove that is not registered
#   - grovework_fanout waits on its own probes alone, never on a peer
#     background job of the caller
#   - each grove's files are keyed on its index, so two hosts whose
#     names fold alike never write one file
#   - a result with no parse is never `read`: an empty or non-json stdout
#     reads `unreadable`
######################################################################

# .what = the registered groves to read, folded onto host:port, local last
# .in   = $1 = a grove name, `local`, or empty for every grove + local
# .out  = GROVES (keys), GROVE_PROBER (key → registry entry), GROVES_DIR
grovework_select() {
  local only="$1" e f key
  # the sprout and crew verbs name a grove as cloud://<name> or house://<name>; the registry keys on the bare name
  only="${only#cloud://}"
  only="${only#house://}"
  GROVES_DIR="${GIT_FOREST_DIR:-$HOME/.git.forest}/groves"
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
  declare -gA GROVE_PROBER=()
  GROVES=()
  for e in "${entries[@]}"; do
    key=$(jq -r '"\(.host // "?"):\(.port // "?")"' "$GROVES_DIR/$e.json") || {
      echo "💥 MalfunctionError: the grove registry entry does not parse: $GROVES_DIR/$e.json" >&2
      exit 1
    }
    if [[ -z "${GROVE_PROBER[$key]:-}" ]]; then
      GROVES+=("$key")
      GROVE_PROBER[$key]="$e"
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
grovework_fanout() {
  local payload="$1" timeout="$2" work="$3" quoted i alias
  local pids=()
  printf -v quoted '%q' "$payload"
  # a read can take a minute; a human at a terminal sees what it waits on, never a frozen
  # cursor. a pipe, a --json reader, or a test sees naught, so no output contract moves
  if [[ -t 2 ]]; then
    echo "🌲 reads ${#GROVES[@]} grove(s) at once (${GROVES[*]}), up to ${timeout}s each…" >&2
  fi
  for i in "${!GROVES[@]}"; do
    (
      rc=0
      if [[ "${GROVES[$i]}" == "local" ]]; then
        timeout "$timeout" bash -c "$payload" > "$work/g$i.out" 2> "$work/g$i.err" || rc=$?
      else
        alias=$(jq -r '.sshAlias // .name' "$GROVES_DIR/${GROVE_PROBER[${GROVES[$i]}]}.json")
        timeout "$timeout" ssh -n -o BatchMode=yes -o ConnectTimeout=8 -o StrictHostKeyChecking=accept-new \
          "$alias" "bash -c $quoted" > "$work/g$i.out" 2> "$work/g$i.err" || rc=$?
      fi
      echo "$rc" > "$work/g$i.rc"
    ) &
    pids+=("$!")
  done
  (( ${#pids[@]} == 0 )) || wait "${pids[@]}"
}

# .what = one row per grove: read | timeout | asleep | unreadable, with a hint
# .in   = $1 = the fan-out's work dir, $2 = its timeout, $3 = the verb to re-read with
# .out  = a json array of {grove, state, hint, record}
grovework_rows() {
  local work="$1" timeout="$2" verb="$3" i rc err state hint record
  local rows="[]"
  for i in "${!GROVES[@]}"; do
    rc=$(cat "$work/g$i.rc" 2>/dev/null || echo 1)
    err=$(head -1 "$work/g$i.err" 2>/dev/null || true)
    state="read"; hint=""; record="null"
    if [[ "$rc" == "0" ]] && record=$(jq -c '.' "$work/g$i.out" 2>/dev/null) && [[ -n "$record" && "$record" != "null" ]]; then
      :
    elif [[ "$rc" == "124" ]]; then
      state="timeout"; record="null"
      hint="a slow read is a load signal; re-read once: $verb ${GROVE_PROBER[${GROVES[$i]}]} --timeout $((timeout * 2))"
    elif [[ "$err" == *"Connection refused"* || "$err" == *"No route to host"* ]]; then
      state="asleep"; record="null"; hint="wake it: rhx git.grove.wake ${GROVE_PROBER[${GROVES[$i]}]}"
    # .note = a box that drops the connect (no refusal, no route error) reads `timed out` from ssh
    #         itself, before the probe ran: no record, so never a read; it may sleep or be loaded
    elif [[ "$err" == *"timed out"* || "$err" == *"Timeout"* ]]; then
      state="timeout"; record="null"
      hint="ssh got no answer; wake it if it sleeps: rhx git.grove.wake ${GROVE_PROBER[${GROVES[$i]}]} — else re-read once: $verb ${GROVE_PROBER[${GROVES[$i]}]} --timeout $((timeout * 2))"
    else
      state="unreadable"; record="null"; hint="exit $rc: ${err:-no stderr}"
    fi
    rows=$(jq -c --arg grove "${GROVE_PROBER[${GROVES[$i]}]}" --arg state "$state" --arg hint "$hint" --argjson record "$record" \
      '. + [{grove: $grove, state: $state, hint: $hint, record: $record}]' <<<"$rows") || {
      echo "💥 MalfunctionError: the row of grove ${GROVE_PROBER[${GROVES[$i]}]} did not fold" >&2
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
