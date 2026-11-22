#!/usr/bin/env bash
######################################################################
# capacitywork.probe — the capacity read's one communicator: the payload
#                      that samples a grove's cpu, ram, pressure, and crews
#
# 🔴 .a LIB: sourced, never executed. the verb that sources it is
#     `rhx git.grove.capacity`.
#
# .what = CAPACITYWORK_PROBE — one self-contained payload, run under
#         `bash -c` on local and handed to ssh for a grove
#
# .why  = the payload is the only code that reads /proc. inline in the
#         verb, it sat between the arg parse and the model, so the verb
#         read as communicator, transformer, and orchestrator at once
#
# .why two reads of /proc/*/stat, each ONE process (`grep -h "" …`), never a
#      loop of `cat` per pid: a sampler is a saturator, and a loop forks once
#      per process (see git.grove.saturation.spend). cwd is read only for the
#      claude seats, a few readlinks
#
# .in   = CAP_SAMPLE (seconds); and the crew lib the verb prepends (grovework)
# .out  = one json record: cpus, ram, pressure, and each live crew's rss + cores
#
# guarantee:
#   - defines one variable; runs no command on source
#   - a /proc read that comes back empty is a 💥 MalfunctionError, exit 1, never an idle box
######################################################################

# shellcheck disable=SC2034 # read by the verb that sources this lib
CAPACITYWORK_PROBE=$(cat <<'REMOTE'
set -uo pipefail
command -v jq >/dev/null || { echo "💥 MalfunctionError: jq is absent on this grove; install it, then re-read: rhx git.grove.send <grove> --what 'sudo apt-get install -y jq'" >&2; exit 1; }

get_cpu_count() { grep -c '^processor' /proc/cpuinfo; }
# a /proc/meminfo field, in kb
get_meminfo_kb() { awk -v field="$1:" '$1 == field { print $2 }' /proc/meminfo; }
# a psi avg60 percent: resource = cpu | memory, kind = some | full; null where psi is absent
get_psi_avg60() {
  [[ -r "/proc/pressure/$1" ]] || { echo null; return 0; }
  awk -v kind="$2" '$1 == kind { for (i = 2; i <= NF; i++) if ($i ~ /^avg60=/) { sub("avg60=", "", $i); print $i } }' "/proc/pressure/$1"
}
# a psi LIFE percent: the µs stalled since boot (`total=`), as a share of the uptime; null where
# psi or the uptime is absent
# .why  = avg60 decays within minutes, so a box abused for hours and calm this minute reads 🟢 on
#         it. the life share does not decay. the math is git.grove.saturation's `lifeshare`, exactly
get_psi_life() {
  [[ -r "/proc/pressure/$1" && -r /proc/uptime ]] || { echo null; return 0; }
  awk -v kind="$2" -v up="$(awk '{ print $1 }' /proc/uptime)" '$1 == kind { for (i = 2; i <= NF; i++) if ($i ~ /^total=/) {
    sub("total=", "", $i); if (up + 0 > 0) printf "%.3f\n", 100 * ($i / 1000000) / up; else print "null" } }' "/proc/pressure/$1"
}

# one row per pid: tag, pid, ppid, comm, cpu ticks, rss pages
# .note = the fields after the ")" of comm, by their man-page names (proc(5)): state is 1,
#         ppid 2, utime 12, stime 13, cutime 14, cstime 15, rss 22
read_proc_stat_rows() {
  grep -h "" /proc/[0-9]*/stat 2>/dev/null | awk -v tag="$1" '{
    s = $0; lparen = index(s, "("); rparen = 0
    while ((k = index(substr(s, rparen + 1), ")")) > 0) rparen += k
    comm = substr(s, lparen + 1, rparen - lparen - 1); gsub(/\t/, " ", comm)
    split(substr(s, rparen + 2), f, " ")
    pid = substr(s, 1, lparen - 2); ppid = f[2]
    utime = f[12]; stime = f[13]; cutime = f[14]; cstime = f[15]; rss = f[22]
    printf "%s\t%s\t%s\t%s\t%s\t%s\n", tag, pid, ppid, comm, utime + stime + cutime + cstime, rss
  }'
}
# the whole box: busy jiffies and the fork counter, from /proc/stat
# .note = busy = user + nice + system + irq + softirq + steal; idle and iowait wait, and
#         guest is already inside user (proc(5)), so neither is counted
# .why the crews' own cores are not the box's load: tmux, zsh, and systemd carry most of the
#      cpu flow (catalog.of=saturator). free slots must subtract what the WHOLE box spends
read_box_counters() {
  # .note = `sys`, never `system`: system() is an awk builtin, and the program would not parse
  awk '/^cpu / { user = $2; nice = $3; sys = $4; irq = $7; softirq = $8; steal = $9
                 busy = user + nice + sys + irq + softirq + steal }
       /^processes / { forks = $2 }
       END { printf "%s %s\n", busy, forks }' /proc/stat
}
# a counter rate per second over the sample, to $3 decimals
get_rate() { awk -v a="$1" -v b="$2" -v per="$3" -v dp="$4" 'BEGIN { printf "%." dp "f", (b - a) / per }'; }

CPUS=$(get_cpu_count)
MEM_TOTAL_KB=$(get_meminfo_kb MemTotal)
MEM_AVAIL_KB=$(get_meminfo_kb MemAvailable)
PSI_CPU=$(get_psi_avg60 cpu some)
PSI_MEM=$(get_psi_avg60 memory full)
PSI_CPU_LIFE=$(get_psi_life cpu some)
PSI_MEM_LIFE=$(get_psi_life memory some)
PAGE_KB=$(( $(getconf PAGESIZE) / 1024 ))
CLK=$(getconf CLK_TCK)

# each rate divides by the span of ITS OWN reads, stamped where the counters are read
# .why a /proc walk takes seconds on a loaded box. one span from the first read to after the
#      last walk put that walk in the box rate's denominator, so the box read idle and the
#      gate over-granted exactly when it was full
T_BOX_A=$(date +%s%N)
read -r BUSY_A FORKS_A < <(read_box_counters)
T_ROWS_A=$(date +%s%N)
ROWS_A=$(read_proc_stat_rows a)
sleep "$CAP_SAMPLE"
read -r BUSY_B FORKS_B < <(read_box_counters)
T_BOX_B=$(date +%s%N)
T_ROWS_B=$(date +%s%N)
ROWS_B=$(read_proc_stat_rows b)
# a read that came back empty is a broken probe, never an idle box: fail loud
# .note = found in this verb's own build: an awk program that did not parse printed naught,
#         and the model read "no crews, 0 cores busy" — a calm empty box, in the voice of a measure
[[ -n "$BUSY_A" && -n "$BUSY_B" && -n "$FORKS_A" && -n "$FORKS_B" ]] || { echo "💥 MalfunctionError: the /proc/stat read came back empty" >&2; exit 1; }
[[ -n "$ROWS_A" && -n "$ROWS_B" ]] || { echo "💥 MalfunctionError: the /proc/<pid>/stat read came back empty" >&2; exit 1; }
get_span_sec() { awk -v a="$1" -v b="$2" 'BEGIN { printf "%.3f", (b - a) / 1e9 }'; }
BOX_SPAN_SEC=$(get_span_sec "$T_BOX_A" "$T_BOX_B")
# the per-pid span: walk start to walk start, so each pid's two reads sit one span apart
SPAN_SEC=$(get_span_sec "$T_ROWS_A" "$T_ROWS_B")
BUSY_CORES=$(get_rate "$BUSY_A" "$BUSY_B" "$(awk -v clk="$CLK" -v span="$BOX_SPAN_SEC" 'BEGIN { print clk * span }')" 2)
FORKS_PER_SEC=$(get_rate "$FORKS_A" "$FORKS_B" "$BOX_SPAN_SEC" 1)

PROCS=$(printf '%s\n%s\n' "$ROWS_A" "$ROWS_B" | jq -R -s -c --argjson pageKb "$PAGE_KB" '
  split("\n") | map(select(length > 0) | split("\t")
    | {at: .[0], pid: .[1], ppid: .[2], comm: .[3], ticks: (.[4] | tonumber), rss_kb: ((.[5] | tonumber) * $pageKb)})
  | reduce .[] as $r ({}; .[$r.pid] += {($r.at): $r})
  | to_entries | map(.value as $v | ($v.b // $v.a) + {
      dticks: (($v.b.ticks // 0) - ($v.a.ticks // 0)),
      rss_kb: ($v.b.rss_kb // 0) })')

# the seat pids: a claude process whose parent is not claude
SEATS=$(jq -r '
  (map({(.pid): .comm}) | add // {}) as $comm
  | .[] | select(.comm == "claude" or .comm == "claude.exe")
  | select(($comm[.ppid] // "") as $pc | $pc != "claude" and $pc != "claude.exe") | .pid' <<<"$PROCS")
CWDS=$(
  for pid in $SEATS; do
    cwd=$(readlink "/proc/$pid/cwd" 2>/dev/null) || continue
    printf '%s\t%s\n' "$pid" "$cwd"
  done | jq -R -s -c 'split("\n") | map(select(length > 0) | split("\t") | {(.[0]): .[1]}) | add // {}'
)

# each crew root once, and its kind (grovework: crewroot, get_crew_kinds)
KINDS=$(jq -r --arg home "$HOME" "$GROVEWORK_JQ_CREW"'
  [.[] | crewroot(.; $home)] | unique | .[]' <<<"$CWDS" | get_crew_kinds)

jq -n -c --argjson procs "$PROCS" --argjson cwds "$CWDS" --argjson kinds "$KINDS" \
  --arg host "$(hostname)" --arg home "$HOME" --argjson cpus "$CPUS" \
  --argjson memTotal "$MEM_TOTAL_KB" --argjson memAvail "$MEM_AVAIL_KB" \
  --arg psiCpu "$PSI_CPU" --arg psiMem "$PSI_MEM" --arg psiCpuLife "$PSI_CPU_LIFE" --arg psiMemLife "$PSI_MEM_LIFE" --argjson clk "$CLK" --argjson span "$SPAN_SEC" --argjson boxSpan "$BOX_SPAN_SEC" \
  --argjson busyCores "$BUSY_CORES" --argjson forksPerSec "$FORKS_PER_SEC" "$GROVEWORK_JQ_CREW"'
  (reduce $procs[] as $p ({}; .[$p.ppid] += [$p.pid])) as $kids
  | (reduce $procs[] as $p ({}; .[$p.pid] = $p)) as $byPid
  | def tree($id): [$id] + ([($kids[$id] // [])[] | tree(.)] | add // []);
  [ $cwds | to_entries[] | {seat: .key, crew: crewroot(.value; $home), ids: tree(.key)} ]
  | group_by(.crew)
  | map({ crew: .[0].crew,
          kind: ($kinds[.[0].crew] // "other"),
          seats: length,
          procs: ([.[].ids[]] | unique | length),
          rss_kb: ([.[].ids[] ] | unique | map($byPid[.].rss_kb // 0) | add // 0),
          cores: (([.[].ids[]] | unique | map([$byPid[.].dticks // 0, 0] | max) | add // 0) / $clk / $span * 100 | floor / 100) })
  | { host: $host, cpus: $cpus, mem_total_kb: $memTotal, mem_avail_kb: $memAvail,
      psi_cpu_some_avg60: $psiCpu, psi_mem_full_avg60: $psiMem,
      psi_cpu_some_life: $psiCpuLife, psi_mem_some_life: $psiMemLife, sample_sec: $span, box_sample_sec: $boxSpan,
      busy_cores: $busyCores, forks_per_sec: $forksPerSec, crews: . }'
REMOTE
)