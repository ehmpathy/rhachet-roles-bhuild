#!/usr/bin/env bash
######################################################################
# .what = read-only census of the grove this runs on: cpu, ram,
#         pressure, fork rate, per-crew ram + token burn, and the
#         boot toll (what a seat or fork pays before its first word)
#
# .why  = the concurrency budget needs measured per-crew costs per grove
#         - git.crew.tokens is absent on this grove, and blind to actor dirs
#         - each read is raw evidence for the criteria and blueprint stones
#
# usage:
#   grove.census.sh                    # 60 min token window, 30s fork sample
#   grove.census.sh --window 180       # token window, in minutes
#   grove.census.sh --sample 60        # fork-rate sample, in seconds
#   grove.census.sh --json             # one json record, for a tick
#   grove.census.sh --since <iso> --until <iso>
#                                      # burn between two utc instants (cap calibration)
#
# guarantee:
#   - read-only: reads /proc and claude transcripts; writes no file
#   - a closed stdout (`| head`) exits 0, with no broken-pipe trace
#   - prints no clock time; only window lengths and a datestamp
#   - usage is deduped per api message id (one call spans many lines)
#   - a crew = the worktree a seat's cwd sits in
#   - a boot = the first api call of a transcript begun in the span; a
#     fork = a transcript under subagents/; a resume also counts, so
#     boots are an upper bound
#   - cost weight is an estimate (api price ratios): input 1,
#     cache write 5m 1.25, cache write 1h 2, cache read 0.1, output 5
######################################################################
set -euo pipefail

# a reader that closes stdout early (`| head`) ends the census quietly, never as a fault
trap 'exit 0' PIPE

WINDOW_MIN=60
SAMPLE_SEC=30
AS_JSON=false
SINCE_AT=""
UNTIL_AT=""

while [[ $# -gt 0 ]]; do
  case $1 in
    # rhachet passes these; ignore them
    --skill|--repo|--role)
      shift 2
      ;;
    --window)
      WINDOW_MIN="$2"
      shift 2
      ;;
    --sample)
      SAMPLE_SEC="$2"
      shift 2
      ;;
    --json)
      AS_JSON=true
      shift
      ;;
    --since)
      SINCE_AT="$2"
      shift 2
      ;;
    --until)
      UNTIL_AT="$2"
      shift 2
      ;;
    --help|-h)
      echo "usage: grove.census.sh [--window <min> | --since <iso> [--until <iso>]] [--sample <sec>] [--json]"
      echo ""
      echo "  --window <min>   token burn window, in minutes back from now (default 60)"
      echo "  --since <iso>    token burn from this instant (utc), in place of --window"
      echo "  --until <iso>    token burn up to this instant (utc; default now)"
      echo "  --sample <sec>   fork-rate sample length, in seconds (default 30)"
      echo "  --json           emit one json record in place of the tree"
      exit 0
      ;;
    *)
      echo "✋ ConstraintError: unknown argument: $1" >&2
      echo "   run with --help for usage" >&2
      exit 2
      ;;
  esac
done

# fail fast on a non-numeric window or sample
[[ "$WINDOW_MIN" =~ ^[0-9]+$ ]] || { echo "✋ ConstraintError: --window must be whole minutes, got '$WINDOW_MIN'" >&2; exit 2; }
[[ "$SAMPLE_SEC" =~ ^[0-9]+$ ]] || { echo "✋ ConstraintError: --sample must be whole seconds, got '$SAMPLE_SEC'" >&2; exit 2; }
command -v jq >/dev/null || { echo "💥 MalfunctionError: jq is absent on this grove" >&2; exit 1; }

# grove totals: cpu, ram, pressure
CPU_COUNT=$(grep -c '^processor' /proc/cpuinfo)
MEM_TOTAL_KB=$(awk '/^MemTotal:/ {print $2}' /proc/meminfo)
MEM_AVAIL_KB=$(awk '/^MemAvailable:/ {print $2}' /proc/meminfo)
SWAP_TOTAL_KB=$(awk '/^SwapTotal:/ {print $2}' /proc/meminfo)
LOAD_1=$(awk '{print $1}' /proc/loadavg)
LOAD_5=$(awk '{print $2}' /proc/loadavg)
PSI_CPU_SOME_60=$(awk '/^some/ {sub("avg60=", "", $3); print $3}' /proc/pressure/cpu 2>/dev/null || echo "null")
PSI_MEM_SOME_60=$(awk '/^some/ {sub("avg60=", "", $3); print $3}' /proc/pressure/memory 2>/dev/null || echo "null")
PSI_MEM_FULL_60=$(awk '/^full/ {sub("avg60=", "", $3); print $3}' /proc/pressure/memory 2>/dev/null || echo "null")

# map each live process to: pid, ppid, comm, pss kb, cwd
# .note = a process may exit mid-read; each read tolerates that and moves on
# .note = read at both ends of the sample: a pid born inside the window is charged to its
#         crew, and a pid dead inside it still gives back its pre-sample ticks (see read_ticks)
read_proc_rows() {
  for dir in /proc/[0-9]*; do
    pid=${dir#/proc/}
    stat=$(cat "$dir/stat" 2>/dev/null) || continue
    comm=$(cat "$dir/comm" 2>/dev/null) || continue
    rest=${stat##*) }
    ppid=$(echo "$rest" | awk '{print $2}')
    pss=$(awk '/^Pss:/ {print $2}' "$dir/smaps_rollup" 2>/dev/null || true)
    cwd=$(readlink "$dir/cwd" 2>/dev/null || true)
    printf '%s\t%s\t%s\t%s\t%s\t%s\n' "$1" "$pid" "$ppid" "$comm" "${pss:-0}" "$cwd"
  done
}
PROC_ROWS_A=$(read_proc_rows a)

# cpu ticks per process: utime + stime + cutime + cstime (stat fields 14-17)
# .note = a child reaped mid-sample lands its WHOLE life in its parent's cutime, the part
#         before the sample too. the delta below charges each pid (b - a), absent = 0, so a
#         pid gone by b gives back its pre-sample ticks and the parent's jump nets to the window
read_ticks() {
  for dir in /proc/[0-9]*; do
    stat=$(cat "$dir/stat" 2>/dev/null) || continue
    rest=${stat##*) }
    echo "$rest" | awk -v pid="${dir#/proc/}" '{print pid "\t" ($12 + $13 + $14 + $15)}'
  done
}
read_cpu_busy() { awk '/^cpu / {print $2 + $3 + $4 + $7 + $8 + $9}' /proc/stat; }

# one sample window for fork rate and cpu spend
CLK_TCK=$(getconf CLK_TCK)
# .note = a tick read walks all of /proc and takes seconds, so the per-crew span is
#         measured end to end, never assumed to be --sample
SPAN_START_NS=$(date +%s%N)
TICKS_A=$(read_ticks)
BUSY_A=$(read_cpu_busy)
FORKS_BEFORE=$(awk '/^processes/ {print $2}' /proc/stat)
sleep "$SAMPLE_SEC"
FORKS_AFTER=$(awk '/^processes/ {print $2}' /proc/stat)
BUSY_B=$(read_cpu_busy)
TICKS_B=$(read_ticks)
TICK_SPAN_SEC=$(echo "scale=3; ($(date +%s%N) - $SPAN_START_NS) / 1000000000" | bc)
PROC_ROWS_B=$(read_proc_rows b)
FORKS_PER_SEC=$(echo "scale=2; ($FORKS_AFTER - $FORKS_BEFORE) / $SAMPLE_SEC" | bc)
CORES_BUSY=$(echo "scale=2; ($BUSY_B - $BUSY_A) / $CLK_TCK / $SAMPLE_SEC" | bc)
TICK_DELTA_JSON=$(
  printf '%s\n%s\n' "$(echo "$TICKS_A" | sed 's/^/a\t/')" "$(echo "$TICKS_B" | sed 's/^/b\t/')" | jq -R -s '
    split("\n") | map(select(length > 0) | split("\t"))
    | reduce .[] as $r ({}; .[$r[1]][$r[0]] = ($r[2] | tonumber))
    | with_entries(.value = ((.value.b // 0) - (.value.a // 0)))
  '
)

# per crew ram + cpu: each top claude seat plus all its descendants, grouped by worktree
PROC_ROWS=$(printf '%s\n%s\n' "$PROC_ROWS_A" "$PROC_ROWS_B")
PROCS_JSON=$(
  echo "$PROC_ROWS" | jq -R -s '
    split("\n") | map(select(length > 0) | split("\t")
      | {at: .[0], pid: .[1], ppid: .[2], comm: .[3], pss: (.[4] | tonumber), cwd: .[5]})
    # one row per pid: the b read wins; a pid gone by b keeps its a row, with no ram
    | reduce .[] as $p ({}; if $p.at == "b" or .[$p.pid] == null
        then .[$p.pid] = ($p | if .at == "a" then .pss = 0 else . end) else . end)
    | [.[]]
  '
)
CREW_RAM_JSON=$(
  echo "$PROCS_JSON" | jq --argjson dticks "$TICK_DELTA_JSON" --argjson hz "$CLK_TCK" --argjson sec "$TICK_SPAN_SEC" '
    . as $procs
    | (reduce $procs[] as $p ({}; .[$p.ppid] += [$p.pid])) as $kids
    | (reduce $procs[] as $p ({}; .[$p.pid] = $p)) as $byPid
    | def tree($id): [$id] + ([($kids[$id] // [])[] | tree(.)] | add // []);
    def crew($cwd): ($cwd | capture("^(?<root>.*/_worktrees/[^/]+)") .root) // $cwd;
    def cores($t): ([$t, 0] | max | . / $hz / $sec * 100 | floor / 100);
    [ $procs[] | select(.comm == "claude.exe" or .comm == "claude")
      | select(($byPid[.ppid].comm // "") as $pc | ($pc != "claude.exe" and $pc != "claude"))
      | . as $seat
      | (tree($seat.pid)) as $ids
      | { crew: crew($seat.cwd), seat: true, ids: $ids,
          parent: ($byPid[$seat.ppid].comm // "?") } ] as $seats
    | ([$seats[].ids[]] | map({(.): true}) | add // {}) as $inTree
    # a process outside every seat tree, with its cwd in a crew worktree, is that crew'"'"'s
    | ([ $procs[] | select($inTree[.pid] | not) | select(.cwd | test("/_worktrees/[^/]+"))
         | { crew: crew(.cwd), seat: false, ids: [.pid], parent: "cwd" } ]) as $strays
    | ([$seats[].ids[], $strays[].ids[]] | map({(.): true}) | add // {}) as $inCrew
    | { crews: ($seats + $strays
        | map(. + { pss_kb: ([.ids[] | ($byPid[.].pss // 0)] | add // 0),
                    ticks: ([.ids[] | ($dticks[.] // 0)] | add // 0) })
        | group_by(.crew)
        | map({ crew: .[0].crew, seats: (map(select(.seat)) | length),
                seat_parents: (map(select(.seat) | .parent) | group_by(.) | map({(.[0]): length}) | add // {}),
                procs: (map(.ids | length) | add), pss_kb: (map(.pss_kb) | add),
                cores: cores(map(.ticks) | add) })),
        # the rest of the grove: busy cpu in no crew, by command
        outside: ([ $procs[] | select($inCrew[.pid] | not) | {comm, t: ($dticks[.pid] // 0)} ]
          | group_by(.comm) | map({comm: .[0].comm, cores: cores(map(.t) | add)})
          | map(select(.cores > 0)) | sort_by(-.cores)) }
  '
)
CREW_OUTSIDE_JSON=$(echo "$CREW_RAM_JSON" | jq '.outside')
CREW_RAM_JSON=$(echo "$CREW_RAM_JSON" | jq '.crews')

# token burn span: --since/--until when given, else the last --window minutes
NOW_EPOCH=$(date -u +%s)
SINCE_EPOCH=$((NOW_EPOCH - WINDOW_MIN * 60))
UNTIL_EPOCH=$NOW_EPOCH
if [[ -n "$SINCE_AT" ]]; then
  SINCE_EPOCH=$(date -u -d "$SINCE_AT" +%s 2>/dev/null) || { echo "✋ ConstraintError: --since is not a readable instant: '$SINCE_AT'" >&2; exit 2; }
fi
if [[ -n "$UNTIL_AT" ]]; then
  UNTIL_EPOCH=$(date -u -d "$UNTIL_AT" +%s 2>/dev/null) || { echo "✋ ConstraintError: --until is not a readable instant: '$UNTIL_AT'" >&2; exit 2; }
fi
(( SINCE_EPOCH < UNTIL_EPOCH )) || { echo "✋ ConstraintError: the span is empty: --since must precede --until (and now)" >&2; exit 2; }
SINCE=$(date -u -d "@$SINCE_EPOCH" +%Y-%m-%dT%H:%M:%S)
UNTIL=$(date -u -d "@$UNTIL_EPOCH" +%Y-%m-%dT%H:%M:%S)
WINDOW_MIN=$(( (UNTIL_EPOCH - SINCE_EPOCH) / 60 ))
FIND_MIN=$(( (NOW_EPOCH - SINCE_EPOCH) / 60 + 1 ))

# token burn per crew, from every claude config dir on this grove
CONFIG_DIRS=()
[[ -d "$HOME/.claude/projects" ]] && CONFIG_DIRS+=("$HOME/.claude")
for d in "$HOME"/git/*/_worktrees/*/.agent/.actors/*/brain/.claude "$HOME"/git/*/*/.agent/.actors/*/brain/.claude; do
  [[ -d "$d/projects" ]] && CONFIG_DIRS+=("$d")
done

# the account a config dir is signed in to NOW (transcripts record none)
# .note = a swap overwrites this, so burn before the last swap is misattributed
read_account() {
  local cfg="$1" file
  for file in "$cfg/.claude.json" "$(dirname "$cfg")/.claude.json"; do
    [[ -f "$file" ]] || continue
    jq -r '.oauthAccount.emailAddress // "unsigned"' "$file" 2>/dev/null && return 0
  done
  echo "unknown"
}

# one pass over every transcript touched in the span; each row is tagged:
#   use  = an api call inside the span (burn)
#   boot = the transcript's true first api call (the boot toll); kept below only if it began in the span
SPAN_LINES=$(
  for cfg in "${CONFIG_DIRS[@]}"; do
    actor=$(echo "$cfg" | sed -n 's#.*/\.actors/\([^/]*\)/brain/\.claude$#\1#p')
    account=$(read_account "$cfg")
    find "$cfg/projects" -name '*.jsonl' -mmin "-$FIND_MIN" 2>/dev/null | while read -r file; do
      fork=false
      [[ "$file" == */subagents/* ]] && fork=true
      jq -c --arg since "$SINCE" --arg until "$UNTIL" --arg actor "${actor:-home}" --arg account "$account" --argjson fork "$fork" '
        select(.timestamp? != null and .timestamp >= $since and .timestamp < $until and .message.usage? != null)
        | { t: "use", id: (.message.id // .uuid), cwd: (.cwd // ""), actor: $actor, account: $account, fork: $fork,
            session: (.sessionId // ""), u: .message.usage }
      ' "$file" 2>/dev/null || true
      (jq -c --argjson fork "$fork" '
        select(.message.usage? != null and .timestamp? != null)
        | { t: "boot", at: .timestamp, fork: $fork, u: .message.usage }
      ' "$file" 2>/dev/null || true) | head -n 1
    done
  done
)
TOKEN_LINES=$(printf '%s\n' "$SPAN_LINES" | jq -c 'select(.t? == "use")')

# the boot toll: what a seat or fork pays before its first word (a fresh cache write)
# .note = a "boot" = the first api call of a transcript file; a fork = a transcript under
#         subagents/. a resume continues an older transcript and also counts, so boots are an upper bound
BOOT_MD_JSON=$(
  for cfg in "${CONFIG_DIRS[@]}"; do
    size=0
    [[ -f "$cfg/boot.md" ]] && size=$(wc -c < "$cfg/boot.md")
    printf '%s\n' "$size"
  done | jq -s -c 'sort | { dirs: length, with_boot: (map(select(. > 0)) | length),
    median_bytes: (if length == 0 then 0 else .[(length / 2 | floor)] end), max_bytes: (max // 0) }'
)
BOOTS_JSON=$(
  printf '%s\n' "$SPAN_LINES" | jq -s -c --arg since "$SINCE" --arg until "$UNTIL" --argjson window "$WINDOW_MIN" --argjson bootMd "$BOOT_MD_JSON" '
    def n($x): ($x // 0);
    map(select(.t? == "boot" and .at >= $since and .at < $until)
      | .u as $u
      | { fork,
          input: n($u.input_tokens),
          cw1h: n($u.cache_creation.ephemeral_1h_input_tokens),
          cw5: (n($u.cache_creation_input_tokens) - n($u.cache_creation.ephemeral_1h_input_tokens)),
          cr: n($u.cache_read_input_tokens) }) as $all
    | def median($xs): ($xs | sort) as $s | if ($s | length) == 0 then 0 else $s[($s | length / 2 | floor)] end;
    def stats($rows):
      ($rows | map(.input + .cw5 * 1.25 + .cw1h * 2 + .cr * 0.1)) as $wt
      | { boots: ($rows | length),
          prompt_median: median($rows | map(.input + .cw5 + .cw1h + .cr)),
          cache_write_median: median($rows | map(.cw5 + .cw1h)),
          weighted_total: ($wt | add // 0 | floor),
          weighted_per_hour: (if $window == 0 then 0 else (($wt | add // 0) * 60 / $window | floor) end) };
    { boot_md: $bootMd,
      seats: stats($all | map(select(.fork | not))),
      forks: stats($all | map(select(.fork))) }
  '
)

# burn per account, by the account each config dir is signed in to now
ACCOUNT_TOKENS_JSON=$(
  echo "$TOKEN_LINES" | jq -s '
    def n($x): ($x // 0);
    unique_by(.id)
    | map({ account, cfg: .actor,
            weighted: (n(.u.input_tokens)
              + 1.25 * (n(.u.cache_creation_input_tokens) - n(.u.cache_creation.ephemeral_1h_input_tokens))
              + 2 * n(.u.cache_creation.ephemeral_1h_input_tokens)
              + 0.1 * n(.u.cache_read_input_tokens) + 5 * n(.u.output_tokens)) })
    | group_by(.account)
    | map({ account: .[0].account, config_dirs: (map(.cfg) | unique | length),
            weighted: (map(.weighted) | add | floor) })
    | sort_by(-.weighted)
  '
)

CREW_TOKENS_JSON=$(
  echo "$TOKEN_LINES" | jq -s --argjson hours "$(echo "scale=4; $WINDOW_MIN / 60" | bc)" '
    # the brain smoke test (initBehaviorDir.brain.claude) asks claude from a temp dir that names no crew: pool them in one row
    def crew($cwd): if ($cwd | test("brain-claude-ask")) then "(brain smoke test, crew unknown)"
      else (($cwd | capture("^(?<root>.*/_worktrees/[^/]+)") .root) // $cwd) end;
    def n($x): ($x // 0);
    unique_by(.id)
    | map(. + {
        input: n(.u.input_tokens),
        write1h: n(.u.cache_creation.ephemeral_1h_input_tokens),
        write5m: (n(.u.cache_creation_input_tokens) - n(.u.cache_creation.ephemeral_1h_input_tokens)),
        read: n(.u.cache_read_input_tokens),
        output: n(.u.output_tokens) })
    | map(. + { weighted: (.input + 1.25 * .write5m + 2 * .write1h + 0.1 * .read + 5 * .output) })
    | group_by(crew(.cwd))
    | map({
        crew: crew(.[0].cwd),
        sessions: (map(.session) | unique | length),
        actors: (map(.actor) | unique),
        calls: length,
        calls_fork: (map(select(.fork)) | length),
        input: (map(.input) | add), write5m: (map(.write5m) | add), write1h: (map(.write1h) | add),
        read: (map(.read) | add), output: (map(.output) | add),
        raw: (map(.input + .write5m + .write1h + .read + .output) | add),
        weighted: (map(.weighted) | add | floor),
        weighted_fork: (map(select(.fork) | .weighted) | add // 0 | floor) })
    | map(. + { weighted_per_hour: ((.weighted / $hours) | floor) })
    | sort_by(-.weighted)
  '
)

RECORD=$(jq -n \
  --arg host "$(hostname)" --arg date "$(date -u +%Y-%m-%d)" \
  --argjson cpus "$CPU_COUNT" --argjson memTotalKb "$MEM_TOTAL_KB" --argjson memAvailKb "$MEM_AVAIL_KB" \
  --argjson swapKb "$SWAP_TOTAL_KB" --argjson load1 "$LOAD_1" --argjson load5 "$LOAD_5" \
  --arg psiCpu "$PSI_CPU_SOME_60" --arg psiMemSome "$PSI_MEM_SOME_60" --arg psiMemFull "$PSI_MEM_FULL_60" \
  --argjson forksPerSec "$FORKS_PER_SEC" --argjson sampleSec "$SAMPLE_SEC" --argjson windowMin "$WINDOW_MIN" \
  --argjson coresBusy "$CORES_BUSY" --argjson accounts "$ACCOUNT_TOKENS_JSON" \
  --argjson ram "$CREW_RAM_JSON" --argjson tokens "$CREW_TOKENS_JSON" --argjson outside "$CREW_OUTSIDE_JSON" --argjson boots "$BOOTS_JSON" '
  { grove: $host, date: $date,
    cpu: { count: $cpus, busy_cores: $coresBusy, load1: $load1, load5: $load5, psi_some_avg60: $psiCpu,
           outside_crews: $outside },
    ram: { total_gb: ($memTotalKb / 1048576 * 10 | floor / 10), avail_gb: ($memAvailKb / 1048576 * 10 | floor / 10),
           swap_gb: ($swapKb / 1048576 * 10 | floor / 10), psi_some_avg60: $psiMemSome, psi_full_avg60: $psiMemFull },
    forks: { per_sec: $forksPerSec, sample_sec: $sampleSec },
    window_min: $windowMin,
    accounts: $accounts,
    boots: $boots,
    crews:([$ram[].crew, $tokens[].crew] | unique | map(. as $c | {
      crew: ($c | split("/") | last),
      ram_gb: (([$ram[] | select(.crew == $c) | .pss_kb] | add // 0) / 1048576 * 100 | floor / 100),
      seats_live: ([$ram[] | select(.crew == $c) | .seats] | add // 0),
      seat_parents: ([$ram[] | select(.crew == $c) | .seat_parents] | add // {}),
      procs: ([$ram[] | select(.crew == $c) | .procs] | add // 0),
      cores: ([$ram[] | select(.crew == $c) | .cores] | add // 0),
      tokens: (([$tokens[] | select(.crew == $c)] | first) // null) | (if . then del(.crew) else . end) })) }
')

# emit json for a tick
if [[ "$AS_JSON" == "true" ]]; then
  echo "$RECORD"
  exit 0
fi

# emit the tree for a human
# .note = the account rows read "signed in now", never "burned by"; see read_account
echo "$RECORD" | jq -r '
  def mtok($x): "\(($x // 0) / 1000000 * 10 | floor / 10)M";
  def ktok($x): "\(($x // 0) / 1000 | floor)K";
  def atok($x): if ($x // 0) >= 1000000 then mtok($x) else ktok($x) end;
  "🐚 grove.census",
  "   ├─ grove: \(.grove) (\(.date))",
  "   ├─ cpu: \(.cpu.busy_cores) of \(.cpu.count) cores busy over \(.forks.sample_sec)s · load \(.cpu.load1) / \(.cpu.load5) · psi some avg60 \(.cpu.psi_some_avg60)%",
  "   ├─ cpu in crews: \([.crews[].cores] | add * 100 | floor / 100) cores · outside crews: \([.cpu.outside_crews[].cores] | add // 0 | . * 100 | floor / 100) cores (\(.cpu.outside_crews[:3] | map("\(.comm) \(.cores)") | join(", ")))",
  "   ├─ ram: \(.ram.avail_gb)G avail of \(.ram.total_gb)G · swap \(.ram.swap_gb)G · psi some \(.ram.psi_some_avg60)% full \(.ram.psi_full_avg60)%",
  "   ├─ forks: \(.forks.per_sec)/s over \(.forks.sample_sec)s",
  "   ├─ account burn over \(.window_min) min: \(mtok([.crews[].tokens.weighted // 0] | add)) weighted · \(mtok([.crews[].tokens.raw // 0] | add)) raw",
  "   ├─ accounts (signed in now — a swap inside the span misattributes)",
  ( .accounts | length as $len | to_entries[] |
    (if .key == ($len - 1) then "   │  └─ " else "   │  ├─ " end)
    + "\(.value.account): \(mtok(.value.weighted)) weighted · \(.value.config_dirs) config dirs" ),
  "   ├─ boot toll over the \(.window_min) min span (first call of each transcript begun in it; resumes count, so an upper bound)",
  "   │  ├─ boot.md: \(.boots.boot_md.with_boot) of \(.boots.boot_md.dirs) config dirs · median \(.boots.boot_md.median_bytes / 1024 | floor)KB · max \(.boots.boot_md.max_bytes / 1024 | floor)KB",
  "   │  ├─ seats: \(.boots.seats.boots) boots · first prompt median \(ktok(.boots.seats.prompt_median)) · written fresh median \(ktok(.boots.seats.cache_write_median)) · toll \(atok(.boots.seats.weighted_total)) (\(atok(.boots.seats.weighted_per_hour))/h)",
  "   │  └─ forks: \(.boots.forks.boots) boots · first prompt median \(ktok(.boots.forks.prompt_median)) · written fresh median \(ktok(.boots.forks.cache_write_median)) · toll \(atok(.boots.forks.weighted_total)) (\(atok(.boots.forks.weighted_per_hour))/h)",
  "   └─ crews (ram now · tokens over the \(.window_min) min span, cost-weighted)",
  ( .crews | sort_by(-(.tokens.weighted // 0)) | length as $len | to_entries[] |
    (if .key == ($len - 1) then "      └─ " else "      ├─ " end)
    + "\(.value.crew): \(.value.ram_gb)G · \(.value.cores) cores · \(.value.seats_live) seats · \(.value.procs) procs"
    + (if .value.seats_live > 1 then " (seat parents: \(.value.seat_parents | to_entries | map("\(.key)×\(.value)") | join(", ")))" else "" end)
    + (if .value.tokens then
        " · \(mtok(.value.tokens.weighted)) weighted (\(mtok(.value.tokens.weighted_per_hour))/h)"
        + " · raw \(mtok(.value.tokens.raw)) · out \(mtok(.value.tokens.output))"
        + " · forks \(mtok(.value.tokens.weighted_fork))"
      else " · no burn in window" end) )
' || {
  # a reader that closed stdout early kills jq with SIGPIPE (exit 141); that is not a fault
  rc=$?
  [[ $rc -eq 141 ]] && exit 0
  exit "$rc"
}