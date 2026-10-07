#!/usr/bin/env bash
######################################################################
# .what = read how SATURATED a grove is — cpu, ram, disk, and the three
#         stall pressures — in ONE call, across the whole forest
#
# .why  = "is that grove struggling?" was a byhand chain: a `git.grove.send`
#         carrying a hand-typed `uptime; free -h; df -h; cat /proc/pressure/*`,
#         retyped from memory every time, with the two signals that actually
#         answer the question — PSI stall and swap rate — the two most often
#         left out because they are the two nobody remembers the path to.
#
#         that is the shape rule.require.bulk-over-byhand forbids and
#         rule.always.entool-the-skills-you-touch names: a skill was called,
#         and the caller still finished the job by hand.
#
# .why SATURATION and not "usage" — usage asks "how much is in use?", which a
#      cache-heavy box answers alarmingly and wrongly (19Gi of 30Gi "used" is
#      reclaimable page cache, not pressure). saturation asks "is anything
#      WAITING?" — and that is a different measurement with a different
#      instrument: PSI. a box can be 95% busy and stall nought; a box can be
#      40% busy and thrash. only the second is a problem.
#
# usage:
#   rhx git.grove.saturation                    # every registered grove, plus local
#   rhx git.grove.saturation grove-sandpine-v1    # just the one
#   rhx git.grove.saturation local              # this box — it runs crews too
#   rhx git.grove.saturation --only grove-x     # same, named
#   rhx git.grove.saturation --json             # the records, for a machine
#   rhx git.grove.saturation --timeout 30       # a slower box
#
# args:
#   <grove>     a grove's registered name (see: rhx git.grove.list)
#   --only      the same, as a named flag
#   --json      emit key=value records rather than the tree
#   --timeout   seconds to wait per grove (default: 20)
#   --help,-h   usage
#
# .why every grove is read in PARALLEL, each under its own timeout
#      a grove hibernates when idle, so a read of a sleeping box blocks until
#      tcp gives up — minutes. read serially, that ONE grove freezes the sweep
#      and the healthy ones never print. this is the same defect duct.poll
#      records and cures the same way: bound each read, and report the box that
#      overran rather than let it hide the fleet.
#
# ⚠️ .the PRIOR ART, and the braid this file must not widen
#      `sandpine/infrastructure` owns groves and already carries
#      `.agent/…/skills/git.grove.stats.sh` + `howto.tend-groves.md`. this file
#      was authored WITHOUT a check for that pavement — the braided-trail failure
#      `rule.always.reuse-pavement-before-improvise` names — and its first draft
#      reproduced a defect that repo had already found and written down (a
#      swapon-based swap check, misread on 2026-08-12).
#
#      the swap probe below is now TAKEN from that prior art rather than
#      re-derived. what this file adds over it — PSI stall grading, the parallel
#      multi-grove sweep, the grove/entry fold — is owed BACK to
#      `sandpine/infrastructure` as a seed, never kept here as a second path.
#      until that seed lands, treat this skill as the junior of the two.
#
# guarantee:
#   - READ-ONLY on every grove; never wakes one, never writes, never installs
#   - an unreachable grove is REPORTED (💤 / 💥), never allowed to abort the
#     sweep — one down box must not hide a live forest
#   - exit 0 = read (a down grove in a SWEEP is a valid answer, not a failure)
#   - exit 1 = a grove you NAMED could not be read
#   - exit 2 = constraint (no registry, unknown grove, bad flag)
######################################################################
set -euo pipefail

ONLY=""
FORMAT="tree"
# 🔴 the default is NAMED, because a failed-probe hint compares against it to
#   tell a FIRST read from a RE-READ (__sat_next_move). a bare literal would
#   put that discriminator in two places, and the two would drift.
SATURATION_TIMEOUT_DEFAULT=20
TIMEOUT=$SATURATION_TIMEOUT_DEFAULT

while [[ $# -gt 0 ]]; do
  case "$1" in
    --only) ONLY="$2"; shift 2 ;;
    --json) FORMAT="json"; shift ;;
    --timeout) TIMEOUT="$2"; shift 2 ;;
    --skill|--repo|--role) shift 2 ;;
    --) shift ;;
    -h|--help)
      echo "🌲 git.grove.saturation — cpu, ram, disk, and stall, per grove"
      echo ""
      echo "  usage:"
      echo "    rhx git.grove.saturation                  # every grove, and local"
      echo "    rhx git.grove.saturation <grove>          # just the one"
      echo "    rhx git.grove.saturation local            # this box — it runs crews too"
      echo "    rhx git.grove.saturation --json           # records, for a machine"
      echo "    rhx git.grove.saturation --timeout 30     # a slower box"
      echo ""
      echo "  reads: load · PSI stall · meminfo · swap rate · df · vmstat · top procs"
      echo "         · programs ranked by cpu AND by ram · a process census (peer"
      echo "         count + rss) — what sleeps and holds ram"
      echo "  list groves: rhx git.grove.list  (local has no row there, and is read anyway)"
      exit 0 ;;

    # ⚠️ FAIL LOUD — never `shift` an unknown flag away (rule.forbid.failhide).
    -*) echo "✋ git.grove.saturation: unknown flag '$1'" >&2
        echo "   known: --only --json --timeout --help" >&2
        exit 2 ;;
    *) [[ -z "$ONLY" ]] && ONLY="$1"; shift ;;
  esac
done

GROVES_DIR="${GIT_FOREST_DIR:-$HOME/.git.forest}/groves"
if [[ ! -d "$GROVES_DIR" ]]; then
  echo "🐢 bummer dude — no forest registry at $GROVES_DIR" >&2
  echo "" >&2
  echo "  fix: see what is registered —" >&2
  echo "    rhx git.grove.list" >&2
  exit 2
fi

ENTRIES=()
if [[ "$ONLY" == "local" ]]; then
  # `local` is a real grove with no registry row — see the LOCAL block below.
  # named alone, it contributes no ENTRIES, and the empty-ENTRIES arm is skipped.
  :
elif [[ -n "$ONLY" ]]; then
  [[ -f "$GROVES_DIR/$ONLY.json" ]] || {
    echo "🐢 bummer dude — grove '$ONLY' is not registered" >&2
    echo "" >&2
    echo "  fix: see what is —" >&2
    echo "    rhx git.grove.list" >&2
    exit 2
  }
  ENTRIES+=("$ONLY")
else
  while IFS= read -r f; do
    ENTRIES+=("$(basename "$f" .json)")
  done < <(find "$GROVES_DIR" -maxdepth 1 -name '*.json' | sort)
fi

if [[ ${#ENTRIES[@]} -eq 0 && "$ONLY" != "local" ]]; then
  echo "🌲 grove saturation"
  echo "   └─ (no groves registered — local still reads below)"
fi

######################################################################
# fold the registry ENTRIES onto the GROVES they name
#
# .why  the forest registers one entry per LOGIN, so a single grove appears in
#       it under several names — `grove-x` (camper) and `grove-x.ground`
#       (ground) are two users at the identical host:port, which is to say ONE
#       grove. saturation is a property of the grove, never of the login: both
#       entries read the same load, the same meminfo, the same PSI.
#
#       so a probe per ENTRY would ssh twice to one grove and print its numbers
#       twice, which reads as two groves at 65% rather than one. the duplicate
#       is not merely wasteful — it is a `false report`, since a reader tallying
#       forest capacity would double it.
#
# ⚠️ the key is host:port, never the NAME. the names differ by design; the
#    endpoint is what says "the same grove".
#
# ⚠️ `box` is a FORBIDDEN synonym of grove (term=grove._.choice._.md), so the
#    fold is named for what it folds onto. the tension this surfaces — that
#    `git.grove.list` prints one 🌳 per ENTRY, and so reports 4 groves where
#    there are 2 — is recorded as a dated finding in term=grove._.choice.reason.md
#    rather than settled here.
######################################################################
declare -A GROVE_ENTRIES=()  # host:port -> the entry names on it, space joined
declare -A GROVE_PROBER=()   # host:port -> the one entry we ssh through
GROVES=()

for e in "${ENTRIES[@]}"; do
  key=$(jq -r '"\(.host // "?"):\(.port // "?")"' "$GROVES_DIR/$e.json")
  if [[ -z "${GROVE_ENTRIES[$key]:-}" ]]; then
    GROVES+=("$key")
    GROVE_PROBER[$key]="$e"
    GROVE_ENTRIES[$key]="$e"
  else
    GROVE_ENTRIES[$key]="${GROVE_ENTRIES[$key]} $e"
  fi
done

# 🔴 LOCAL is a grove, and until 2026-09-11 it was the one grove no read covered
#
#    the forest registers a row per REMOTE login, so `local` has no json and the
#    fan-out above never visited it. but local runs crews like any grove — the
#    duct registry carries `duct:///<tree>/<role>` rows with an empty host, and a
#    supervisor steers them with the same verbs.
#
#    ⇒ so the box the SUPERVISOR ITSELF runs on was the single box in the fleet
#      with no saturation read. a local crew could stall its host and the sweep
#      that exists to catch exactly that would report every grove healthy
#      (term=partial-audit — complete over the subject set it chose, rendered as
#      a verdict about the fleet).
#
# ⚠️ it is appended LAST on purpose. the remote groves carry the crews a human
#    cannot watch, so they lead; local is the one a human already occupies.
if [[ -z "$ONLY" || "$ONLY" == "local" ]]; then
  GROVES+=("local")
  GROVE_PROBER["local"]="local"
  GROVE_ENTRIES["local"]="local"
fi

######################################################################
# the remote probe
#
# .why one payload that emits key=value, rather than several ssh calls that
#      each emit prose: a round trip to a grove is the expensive part, and
#      prose has to be re-parsed by whoever reads it. the grove emits FACTS;
#      the rendering, the thresholds, and the verdicts all happen locally,
#      where they can be changed without a touch to any box.
#
# ⚠️ quoted heredoc — the awk programs below hold `$1`/`$2`, which the LOCAL
#    shell must never expand. it is passed to ssh as one argv and run by the
#    GROVE's shell.
######################################################################
PROBE=$(cat <<'REMOTE'
set -u
echo "host=$(hostname 2>/dev/null || echo '?')"
echo "uptime_s=$(cut -d' ' -f1 /proc/uptime 2>/dev/null || echo '-')"
echo "ncpu=$(nproc 2>/dev/null || echo '-')"

awk '{print "load1="$1; print "load5="$2; print "load15="$3}' /proc/loadavg 2>/dev/null

# ⚠️ Shmem and Unevictable are read for a REASON, not for completeness.
#
# `Cached` is NOT the same claim as "reclaimable". it includes tmpfs/shmem
# pages, which have no filesystem to write back to — they can be evicted ONLY
# to swap. and MemAvailable does not save you here either: shmem sits on the
# file LRU, so the kernel's estimate counts it as pagecache.
#
# ⇒ on a SWAPLESS grove with a loaded tmpfs, both numbers overstate, together,
#   and in the same direction. that is the derived-pair trap (term=false-report)
#   — two instruments that concur because they share one flawed derivation.
awk '/^MemTotal:/     {print "mem_total_kb="$2}
     /^MemAvailable:/ {print "mem_avail_kb="$2}
     /^MemFree:/      {print "mem_free_kb="$2}
     /^Cached:/       {print "mem_cached_kb="$2}
     /^Shmem:/        {print "mem_shmem_kb="$2}
     /^Unevictable:/  {print "mem_unevict_kb="$2}
     /^SwapTotal:/    {print "swap_total_kb="$2}
     /^SwapFree:/     {print "swap_free_kb="$2}' /proc/meminfo 2>/dev/null

# PSI — the stall signal. some = at least one task waited; full = every task
# waited, so no work at all progressed. absent on kernels < 4.20 or with
# CONFIG_PSI off, in which case the keys simply do not appear.
for k in cpu memory io; do
  f=/proc/pressure/$k
  [ -r "$f" ] || continue
  # 🔴 `total` is the field that answers a question the averages CANNOT.
  #
  #   avg10 / avg60 decay to zero within minutes, so a pressure spike at 3am is
  #   invisible to a read taken at 9am. `total` is cumulative microseconds since
  #   boot — it SURVIVES the spike, and divided by uptime it gives the share of
  #   the grove's life spent stalled.
  #
  # ⇒ without it this skill can only answer "is there pressure NOW?", while every
  #   question worth asking of it ("do we need swap?", "is this grove undersized?")
  #   is a question about a DISTRIBUTION OVER TIME. a point read cannot answer a
  #   distribution question except through a cumulative counter.
  awk -v k="$k" '{ split($2,a,"="); split($3,b,"="); split($4,c,"="); split($5,t,"=");
                   print "psi_" k "_" $1 "_10=" a[2];
                   print "psi_" k "_" $1 "_60=" b[2];
                   print "psi_" k "_" $1 "_300=" c[2];
                   print "psi_" k "_" $1 "_total=" t[2] }' "$f" 2>/dev/null
done

df -Pk / 2>/dev/null | awk 'NR==2{ sub(/%/,"",$5);
  print "disk_total_kb="$2; print "disk_used_kb="$3;
  print "disk_avail_kb="$4; print "disk_pct="$5 }'

# 🔴 the HIBERNATION swap probe — read the FILE and the RESUME OFFSET, never `swapon`
#
# ⚠️ on a correctly-prepared grove, `swapon` reads EMPTY and `SwapTotal` reads 0,
#    and that is the HEALTHY state. ec2-hibinit-agent creates /swap-hibinit,
#    registers its block offset with the kernel, then deliberately `swapoff`s it
#    — the file is reserved for the suspend image and must never page.
#
# ⇒ so a swapon-based verdict reports a healthy grove as broken. this is not a
#   hypothesis: sandpine/infrastructure records that exact misread on 2026-08-12,
#   in `git.grove.stats.sh` (.why-NOT-swapon) and `howto.tend-groves.md`. this
#   probe is taken from that prior art rather than re-derived.
if [ -f /swap-hibinit ]; then
  echo "hib_swap_kb=$(du -k /swap-hibinit 2>/dev/null | awk '{print $1}')"
else
  echo "hib_swap_kb=0"
fi
echo "hib_resume_offset=$(cat /sys/power/resume_offset 2>/dev/null || echo '-')"
echo "hib_resume_dev=$(cat /sys/power/resume 2>/dev/null || echo '-')"

# .why the OOM COUNT rides along with a saturation probe
#   the swap arm above states that pressure on this grove "ooms rather than
#   thrashes" — a claim about a CONSEQUENCE, made with no measurement behind it.
#   an unmeasured consequence is a guess dressed as a verdict, so it is counted.
#
#   it is also the one memory signal a stall read cannot give: a kill ENDS the
#   pressure, so an oom event can leave PSI looking calm right after it fired.
#
# 🔴 the kernel count is NOT the whole count, and on a guarded grove it is the
#    WRONG one. earlyoom is USERLAND: it watches MemAvailable and TERMs the
#    fattest process BEFORE the kernel is forced to act. its kills never reach
#    the kernel journal, so `journalctl -k` reads 0 — and reads 0 precisely
#    BECAUSE the guard works. a green light caused by the very event it claims
#    to rule out (term=false-report).
#    ⇒ so the guard's own journal is read too, and the two are reported apart.
#      the exit code tells them apart at the pane: earlyoom TERMs (143), the
#      kernel KILLs (137).
#
# ⚠️ READABILITY is measured, never assumed. `journalctl` exits 0 and prints
#    `-- No entries --` for a caller that lacks the journal groups, so an
#    unreadable journal and a quiet one are byte-identical. a booted box always
#    carries kernel lines when readable, so a zero LINE count means unreadable
#    (or a non-persistent journal) — never zero kills. measured 2026-09-06: the
#    grove user holds neither journal access nor sudo, so every count here was a
#    silent 0 (rule.forbid.failhide).
#
# .note = the two grep patterns quote earlyoom's own log strings verbatim. the
#         gerunds are its wire format, not our prose.
#    ⚠️ the readability count must STRIP journalctl's own sentinel. an empty
#      journal still prints one line — `-- No entries --` — so a naive
#      `grep -c .` reads 1 and calls the journal readable. measured 2026-09-06:
#      that is the same shape as the defect this arm repairs, one layer down.
#      `-q` silences the companion hint that names the absent groups.
#    ⚠️ `|| true`, never `|| echo 0`. `grep -c` already prints `0` on no match
#      and exits 1, so an `echo 0` fallback emits a SECOND line.
echo "oom_klines=$(journalctl -k -q --no-pager 2>/dev/null | grep -v '^-- ' | grep -c . || true)"
echo "oom_kills=$(journalctl -k -q --no-pager 2>/dev/null | grep -icE 'out of memory|oom-kill|oom_reaper' || true)"
echo "oom_elines=$(journalctl -u earlyoom -q --no-pager 2>/dev/null | grep -v '^-- ' | grep -c . || true)"
echo "oom_ekills=$(journalctl -u earlyoom -q --no-pager 2>/dev/null | grep -icE 'sending sig(term|kill)|killing process' || true)"

# 🔴 .the THIRD witness — a CGROUP COUNTER, and it needs NO privilege at all
#
#   the two journal reads above are the only witnesses this arm had, and on a
#   grove they BOTH read blind: the grove user holds neither the journal groups
#   nor sudo. so the arm rendered `⚪ not measured` and printed a fix that names
#   a PRIVILEGE GRANT — a human-owned lever, on a shared host, for a signal that
#   was readable the whole time.
#
#   ⚠️ measured 2026-09-16 on grove-sandpine-v20260901, as `camper`, no sudo:
#      `/sys/fs/cgroup/user.slice/user-1002.slice/memory.events` → `oom_kill 2`.
#      TWO clones had been culled on that box while the instrument called the
#      axis unmeasured — and it said so on the very tick memory graded 🔴
#      (17% available, full 38% @60s, no swap cushion). a confident wrong
#      verdict on the one axis that was red (surgoal.squeeze-the-grove).
#
# 🔴 .it is a COUNTER, never a census — 1 read, whatever the process count.
#    that is the surgoal's own rule: a sampler IS a saturator, and a probe that
#    enumerates a population on a 🔴 box joins the queue it measures.
#
# ⚠️ .its SCOPE is narrower than the journal's, so the two are NOT summed.
#    the journal counts kernel oom lines SYSTEM-WIDE; this counts kills inside
#    ONE cgroup. measured the same day on local, where both read: journal 7,
#    cgroup 2 — no contradiction, two different denominators. so the parser
#    PREFERS the journal where it is readable and reaches here only when it is
#    blind. to add them would double-count on every box that has both.
#
# ⚠️ .and it is a KERNEL witness only. earlyoom TERMs from userland and never
#    touches the kernel oom path, so its kills do NOT increment `oom_kill`.
#    a box whose earlyoom journal is unreadable therefore has an UNKNOWN
#    earlyoom half, and the render must say so rather than print a 0 it did
#    not measure (term=false-report — the same defect, one layer over).
#
# 🔴 .the path is `user.slice`, the AGGREGATE — never the PROBER's own uid slice
#
#    the first draft of this read `user.slice/user-$(id -u).slice`, on the claim
#    that a clone runs as the grove user so the per-uid slice is the tightest
#    grain. that claim names the wrong user, and the render it produced was
#    WORSE than the defect it replaced.
#
#    ⚠️ measured 2026-09-16, and it is the whole reason this comment is long:
#       a grove is registered TWICE — `<name>.ground` and `<name>` — and the
#       fan-out picks ONE entry to ssh through (`GROVE_PROBER`). that entry is
#       the `.ground` login:
#
#         ground  → uid 1001   ·  user-1001.slice/memory.events → oom_kill 0
#         camper  → uid 1002   ·  user-1002.slice/memory.events → oom_kill 2
#         (the aggregate)      ·  user.slice/memory.events      → oom_kill 2
#
#       the CLONES run as `camper`. so `$(id -u)` resolved to the prober's own
#       near-empty slice, the first path SUCCEEDED with 0, the fallback never
#       fired, and the grove rendered:
#
#         ├─ oom     🟢 no kills in 13.4d uptime
#
#       on a box where TWO clones had been culled. ⚪ "I cannot see" became 🟢
#       "no kills" — a `false-report` in place of an honest absence, which is
#       strictly worse than the blindness it was written to cure.
#
# ⇒ so the grain is the BOX, never the login. the question this arm answers is
#   "did this grove cull a clone?", and a per-uid read answers "did it cull one
#   of MY processes?" — a different question, asked by an account that runs no
#   clones. `user.slice` is the parent of every per-user slice, so it aggregates
#   them all, and it is world-readable: verified 2026-09-16 as BOTH `ground`
#   (1001) and `camper` (1002), each of which returned 2.
#
# ⚠️ and no `$(id -u)` may return here. its value depends on which entry the
#    fan-out happened to pick as prober — a fact about the REGISTRY, not about
#    the box — so a read keyed on it is unstable by construction.
#
# .note = the ROOT cgroup carries no `memory.events` at all (verified on the
#         grove), so it is not a candidate for a further fallback.
# .note = `-` means UNREADABLE, and 0 means measured-zero. that distinction is
#         the whole reason this arm exists, so the sentinel is never 0.
echo "oom_cgkills=$(awk '$1=="oom_kill"{print $2; f=1} END{if(!f) print "-"}' \
      /sys/fs/cgroup/user.slice/memory.events 2>/dev/null \
   || echo '-')"
echo "oom_guard=$( systemctl is-active earlyoom 2>/dev/null | grep -q '^active' && echo earlyoom \
             || { systemctl is-active systemd-oomd 2>/dev/null | grep -q '^active' && echo systemd-oomd || echo none; } )"
echo "swappiness=$(cat /proc/sys/vm/swappiness 2>/dev/null || echo '-')"

# 🔴 the FORK + CONTEXT-SWITCH counters — the one axis a `ps` rollup cannot see
#
#    every other cpu figure this probe emits is a GAUGE: load, vm_us, and the
#    `ps -o pcpu` rollups each sample state at an instant, so a process born and
#    reaped between two samples is counted by NONE of them, at any poll rate
#    (`surgoal.squeeze-the-grove`: sample COUNTERS, never GAUGES).
#
#    measured 2026-09-17 on grove-sandpine-v20260901: load read 321% of 4 cores
#    while `eats` accounted for ~35%. the missed ~286% was a fork storm — 231
#    forks/sec — and no render on this skill could name it. a supervisor read
#    the gauges, found no runaway, saw 0 fellable, and reached the PROVISION
#    rung with no account of what the box actually spent.
#
#    `/proc/stat` carries both counts as monotonic totals since boot, so ONE
#    delta over a measured window yields the exact rate, and it costs 2 reads
#    rather than the O(N) forks a process census costs on a box already 🔴.
#
# .note = the window is MEASURED from /proc/uptime, never assumed from the
#         `vmstat 1 2` below. a rate off an unmeasured window has no
#         denominator, and the surgoal grades that a blocker.
# .note = `-` means UNREADABLE, never 0. a 0 here would assert a quiet box.
#
# 🔴 .the payload also emits fork_mean — the BASELINE, and the one term that
#    makes "a rate this high" a checkable word. `fb` is monotonic since boot and
#    `ub` is the uptime, so this box's own mean fork rate is fb/ub: already in
#    hand, and discarded until 2026-09-18. it costs ZERO extra reads on a box
#    whose surgoal forbids a heavy sample outright (a sampler IS a saturator).
#
#    .why it is owed: the storm arm fired at 102/s on a grove whose own mean was
#    181/s — 56% of its baseline — and sent the supervisor on a hunt that
#    returned `tmux: server`. that answer is STRUCTURAL (every clone's forks
#    charge there), so it returns identical on every tick, forever.
#
# ⚠️ .keep this prose OUT of the awk program. the awk below is a SINGLE-QUOTED
#    bash string, so one apostrophe in a comment inside it shuts the quote and
#    the payload dies with `syntax error near unexpected token`. measured the
#    same day, by the author of the cure above: the word was "box's".
#
# ⇒ clamped at [case5] in git.grove.saturation.forks.integration.test.ts
__fk_a=$(awk '/^processes /{print $2}' /proc/stat 2>/dev/null || echo '-')
__cx_a=$(awk '/^ctxt /{print $2}' /proc/stat 2>/dev/null || echo '-')
__up_a=$(awk '{print $1}' /proc/uptime 2>/dev/null || echo '-')

# a 1s sample, because si/so and iowait are RATES — /proc/vmstat carries only
# the boot-cumulative totals, which say nought about right now.
vmstat 1 2 2>/dev/null | awk 'END{ print "vm_r="$1; print "vm_b="$2;
  print "vm_si="$7; print "vm_so="$8; print "vm_us="$13; print "vm_sy="$14;
  print "vm_id="$15; print "vm_wa="$16 }'

__fk_b=$(awk '/^processes /{print $2}' /proc/stat 2>/dev/null || echo '-')
__cx_b=$(awk '/^ctxt /{print $2}' /proc/stat 2>/dev/null || echo '-')
__up_b=$(awk '{print $1}' /proc/uptime 2>/dev/null || echo '-')
awk -v fa="$__fk_a" -v fb="$__fk_b" -v ca="$__cx_a" -v cb="$__cx_b" \
    -v ua="$__up_a" -v ub="$__up_b" 'BEGIN{
  w = ub - ua
  if (fa=="-"||fb=="-"||ca=="-"||cb=="-"||ua=="-"||ub=="-"||w<=0) {
    print "fork_rate=-"; print "ctxt_rate=-"; print "rate_window=-"
    print "fork_mean=-"; exit
  }
  printf "fork_rate=%d\n", (fb-fa)/w
  printf "ctxt_rate=%d\n", (cb-ca)/w
  printf "rate_window=%.2f\n", w
  if (ub+0 > 0) printf "fork_mean=%d\n", fb/ub
  else print "fork_mean=-"
}'

# 🔴 the probe must NOT COUNT ITSELF — task #110, measured 2026-09-15
#
#    `ps -o pcpu` is cputime ÷ elapsed-SINCE-START, and the probe's own `ps` has
#    just started — so its elapsed rounds to near zero and its own share reads
#    ENORMOUS. measured twice on the local box, minutes apart:
#
#      proc=400|0.0|ps|ps -eo pcpu,pmem,comm,args --sort
#      proc=300|0.0|ps|ps -eo pcpu,pmem,comm,args --sort=-pcpu
#
#    which this skill's own render then drew as the box's #1 cpu consumer, above
#    nvim and claude, in the ONE table a supervisor reads before a prune:
#
#      ├─ top     hungriest by cpu
#      │     ├─ ps                       400% cpu ·   0.0% mem
#      │     │   ps -eo pcpu,pmem,comm,args --sort
#
#    and the RUNNER lands in the roll-up beside it — `bash -c` on the local path,
#    `ssh` on a grove.
#
# ⇒ so the instrument named ITSELF the culprit. a confident WRONG verdict on the
#   one read that decides a prune, and PERMANENT by construction rather than a
#   load artifact: the probe is always in its own snapshot. this is
#   `surgoal.squeeze-the-grove`'s own line — "a sampler IS a saturator" — with
#   the sampler counted into the very total it was run to explain.
#
# ⚠️ the filter is the PROCESS GROUP, never the pid. the probe is a shell, its
#    pipelines, its awks, and its `ps` — all one group, since a non-interactive
#    shell starts no new ones. a pid filter would drop the `ps` and keep the
#    shell that spawned it, which is the half that shows up in the ROLL-UP.
__sat_pg=$(ps -o pgid= -p $$ 2>/dev/null | tr -d ' ')
__sat_pg=${__sat_pg:-0}

# 🔴 nor its SIBLING probes — task #111, the residue of #110, measured 2026-09-15
#
#    #110 removed the probe's own `ps`. the LOCAL render then still carried:
#
#      ├─ top     hungriest by cpu
#      │     ├─ nvim                    15.1% cpu ·   2.5% mem
#      │     └─ ssh                     12.2% cpu ·   0.0% mem
#      │         ssh -n -o BatchMode
#
#    which is THIS SKILL's own grove probe, one process group over.
#
#    the fan-out runs each probe under `timeout`, and `timeout` calls
#    setpgid(0,0) — that is HOW it kills the whole group on expiry. so `__sat_pg`
#    above covers this payload and its children EXACTLY, and covers neither its
#    peers nor the skill that spawned them all.
#
# ⇒ so the second filter is an ANCESTRY one. the skill hands the local payload
#   its own pid, and every process whose parent chain reaches it is dropped:
#
#     the skill excludes what it SPAWNS — never what spawned it.
#
# 🔴 that bound IS the design, not a caveat on it. root the closure one level
#    higher — at the skill's `$PPID` — and the width becomes the CALLER's: run by
#    hand from an interactive shell, `$PPID` is the human's shell, and this would
#    hide every process that shell ever started. a surplus instrument row costs
#    one glance; a HIDDEN real consumer costs a wrong prune. rooted at the
#    skill's own `$$`, the width is exactly this invocation's own tree — bounded
#    by construction, on any box, under any caller.
#
# ⚠️ HOST-GUARDED, and that is not belt-and-braces. a pid from the local box,
#    applied on a grove, would drop an unrelated REMOTE process tree. ssh
#    forwards no env without `SendEnv`, but that is a property of the caller's
#    ssh config rather than of this payload — so a leaked value is made INERT
#    here, by construction. non-numeric falls back to 0 for the same reason.
#
# ⚠️ and it is OPTIONAL, so this stays ONE payload: the same bytes run under
#    `bash -c` locally and are handed to ssh remotely, and only the fan-out's
#    LOCAL arm sets the env. a divergent local reader would be a second
#    instrument for one question, and the two would drift.
#
# ⇒ clamped by git.grove.saturation.census.integration.test.ts [case2] — t1 proves it
#   inert with no env, t2 inert with a foreign host, t3 proves it fires beside a
#   `timeout`-wrapped peer, t4 proves it wired through the real fan-out.
__sat_root=0
if [ -n "${SAT_SELF_ROOT:-}" ]; then
  if [ "${SAT_SELF_ROOT%%:*}" = "$(hostname 2>/dev/null || echo '?')" ]; then
    __sat_root="${SAT_SELF_ROOT##*:}"
  fi
fi
case "$__sat_root" in '' | *[!0-9]*) __sat_root=0 ;; esac

# .what = the KIN pid set — this invocation's own process tree, space-delimited
#
# .why  = declared ONCE, from ONE snapshot, for the same reason `__sat_ps` is:
#         two census sites need it, and two copies of a fixpoint closure would
#         drift. it also makes each census site a cheap set-membership test
#         rather than a closure of its own — six fixpoints where one will do is
#         the census-over-counter waste `surgoal.squeeze-the-grove` forbids.
#
# .note = a FIXPOINT, never a depth walk: `ps` emits no topological order, so a
#         single pass would miss a child listed above its parent. 16 iterations
#         is far past the real chain (skill → subshell → timeout → bash →
#         pipeline = 5).
#
#       ⚠️ and were a tree ever deeper than 16, the residue is a SURPLUS
#         instrument row — never a hidden consumer. the failure direction is the
#         safe one by construction.
#
#       ⚠️ membership is tested with awk's `in`, never `kin[x]`. a bare read of
#         `kin[x]` CREATES the element, after which `x in kin` is true — so the
#         closure would swallow the whole box on the second pass.
#
#       ⚠️ the kin are structurally long-lived (the skill, its fan-out subshell,
#         and each `timeout` outlive every probe), so one early snapshot is not
#         stale by the time the censuses below read. what a later fork DOES add
#         is caught by `__sat_pg`, which shares each site's own snapshot.
__sat_kin=$(ps -eo pid=,ppid= 2>/dev/null | awk -v myroot="$__sat_root" '
  { n++; pid[n] = $1; par[n] = $2 }
  END {
    if (myroot + 0 <= 0) exit
    kin[myroot] = 1
    for (pass = 0; pass < 16; pass++)
      for (i = 1; i <= n; i++)
        if (par[i] in kin) kin[pid[i]] = 1
    for (k in kin) print k
  }' | tr '\n' ' ')
__sat_kin=" $__sat_kin "

# .what = one `ps` snapshot with the probe's own process group AND this
#         invocation's own kin removed
#
# .why  = four census sites need the identical exclusion, so it is declared once
#         rather than copied four times — past the rule-of-three bound by one
#         (rule.prefer.wet-over-dry), and the copies would drift apart the
#         moment a fifth site is added.
#
# .note = it prepends `pid,pgid`, filters on both, then STRIPS them — so every
#         caller's field indices are exactly what they were before this existed.
#         awk rebuilds $0 on OFS, which collapses runs of whitespace; every
#         consumer here reads fields by index, so that is harmless.
#
#       ⚠️ TWO filters, and they cover different things. `pgid` drops this
#         payload and its own children; `kinset` drops the skill above it and
#         every peer probe beside it (#110 and #111 respectively). neither
#         subsumes the other, because `timeout` puts each probe in a group of
#         its own — that is the whole reason #111 existed.
#
#       ⚠️ `--no-headers`, so a caller must NOT skip a first row. the two arms
#         below once read `NR>1` for a header that is now absent.
#
# args: $1 = the ps -o field list, minus the pid,pgid columns this adds
#       $2 = an optional --sort key
__sat_ps() {
  local fields="$1" order="${2:-}"
  if [ -n "$order" ]; then
    ps -eo "pid,pgid,$fields" --no-headers --sort="$order" 2>/dev/null
  else
    ps -eo "pid,pgid,$fields" --no-headers 2>/dev/null
  fi | awk -v mypg="$__sat_pg" -v kinset="$__sat_kin" '
    $2 == mypg { next }
    index(kinset, " " $1 " ") { next }
    { $1 = ""; $2 = ""; sub(/^[ \t]+/, ""); print }'
}

# 🔴 `comm` alone does NOT name the process. it is /proc/<pid>/comm, which a
#    runtime may rename — python and node both set it per-thread, so a whole
#    grove's top three can read `MainThread` and identify no program at all.
#
#    measured 2026-09-08 on grove-sandpine-v20260901 at runq 25 / idle 0%: the
#    three hungriest all read `MainThread`, so the one read a supervisor has
#    for "what is eating this box" answered with a word that names no program.
#    ⇒ the caller then drops to a raw `ssh … ps` to learn what comm withheld,
#      which is the exact layer drop rule.always.entool-the-layer-you-drop-below
#      exists to close. carry `args` too — that is what names the program.
# 🔴 nor a ZOMBIE — measured 2026-09-18, on `local`, two ticks apart
#
#    the SAME arithmetic as #110 above, entered from the other end. `ps -o pcpu`
#    is cputime ÷ elapsed, and a reaped-but-unwaited child keeps the cputime it
#    earned while its elapsed collapses — so its share reads ENORMOUS for a
#    process that, by definition, executes not one instruction:
#
#      ├─ top     hungriest by cpu
#      │     ├─ git                     66.6% cpu ·   0.0% mem      (tick A)
#      │     │   [git] <defunct>
#      │     ├─ git                      100% cpu ·   0.0% mem      (tick C)
#      │     │   [git] <defunct>
#
#    ⇒ the #1 row of the one table a supervisor reads before a prune, twice, on
#      a box whose live hungriest was `claude` at 27.2%. and the same render's
#      `holds` row said `2 zombie` three lines below it, so the two halves of one
#      report disagreed and neither named the other.
#
# ⚠️ the harm is NOT the wasted glance. a zombie is UNKILLABLE — it has already
#    exited, and only its parent's wait() clears it. so this row points a prune
#    at a target no signal can touch, and the prune's failure then reads as a
#    tool defect rather than as a phantom target.
#
# ⚠️ and it is a term=false-report of the sharpest kind: every FIGURE is true.
#    `ps` really did report that pcpu. what is false is the inference the row's
#    own header invites — "hungriest" — and the arithmetic that invites it is
#    exactly what #110 already cured once, for exactly one process.
#
# ⇒ so the filter rides on the two CPU-RANKING arms alone (`top`, `eats`), and
#   NOT on __sat_ps itself: `procs_zombie=` below reads through the same helper
#   and a zombie is precisely what it must count. a census counts handles; a
#   ranking ranks spend. a zombie is a handle and it is not a spend.
# 🔴 nor a NEWBORN — measured 2026-09-19, on `local`, two reads apart
#
#    the THIRD face of the same arithmetic. #110 was the probe's own `ps`; the
#    zombie above is an elapsed that STOPPED; this is an elapsed that has barely
#    STARTED. a just-forked hook or guard command divides its cputime by an age
#    near zero, and the ratio explodes:
#
#      ├─ top     hungriest by cpu                    (read A)
#      │     ├─ run.bun.rhachet          225% cpu
#      │     ├─ bash                     125% cpu
#      ├─ eats    cpu by program
#      │     ├─  703.2% cpu · n=7   run.bun.rhachet-run.bc
#      │     ├─  500.0% cpu · n=1   bash route.foreground.guard.sh
#
#    on a 12-core box reading `load 3.07 / 12 = 26% · idle 89%`. the rank summed
#    to ~13.5 cores on a box that was 89% idle, and one read later every one of
#    those rows was GONE while the load held flat (3.07 -> 3.76).
#
# ⚠️ `bash` is the tell that needs no cross-check: a single-threaded shell CANNOT
#    exceed 100%. a row over 100% for one is arithmetically impossible, never
#    merely surprising.
#
#    the raw table, same box, same minute:
#
#      pid      etimes  times  pcpu  comm
#      2749914       0      0   158  MainThread   <- 158%, and zero cpu accrued
#      2749927       0      0  75.0  MainThread
#      2749925       0      0  28.5  zsh
#      3093040   24261   3790  15.6  nvim         <- the first REAL row
#
# ⇒ so the discriminator is `times` — cpu SECONDS accrued — and NOT an age floor.
#   a floor on `etimes` would be a guessed threshold; `times == 0` is definitional:
#   the process has burned no measurable cpu, so it cannot be the hungriest. the
#   worst it can cost the rank is one core-second, which no saturation verdict
#   turns on.
#
# ⚠️ it does NOT subsume the zombie skip, nor the reverse. a zombie has REAL
#    `times` and a stopped elapsed; a newborn has real elapsed and ZERO `times`.
#    two disjoint fictions, and each needs its own term.
#
# ⇒ short-lived spend is already somebody else's job: the fork-storm arm says so
#   outright ("each process is gone before the next sample ... hunt the PARENT"),
#   and `git.grove.saturation.spend` measures it from COUNTERS, which cannot miss
#   a process the way a gauge does. these rows were never `eats`'s to carry.
__sat_ps 'stat,times,pcpu,pmem,comm,args' '-pcpu' | awk '
  $1 ~ /^Z/ { next }                         # a zombie spends naught — see the note above
  $2 == 0   { next }                         # a newborn has spent naught — see the note above
  { kept++ }
  kept<=3 {
  cmd=""; for (i=6; i<=NF; i++) cmd = cmd $i " ";
  gsub(/\|/, "/", cmd);                      # the render splits on | — never emit one
  if (length(cmd) > 72) cmd = substr(cmd, 1, 69) "...";
  print "proc="$3"|"$4"|"$5"|"cmd }'

# 🔴 a top-N cannot answer "what is eating this grove" once the load is WIDE
#
#    measured 2026-09-09: runq 24 on 4 cores, and the top three summed to ~50%.
#    so half the load sat below the cut, and the honest answer — "many peers of
#    the same program" — was invisible. a reader sees three rows at 19% and
#    concludes the box is lightly used by three things.
#
#    ⇒ so a ROLL-UP rides beside the list. it groups by program, sums the cpu,
#      and counts the members, which is the shape of the real question: is this
#      one runaway (prune it) or N legitimate peers (a concurrency decision)?
#      the two have opposite remedies, and a top-N cannot part them.
#
# ⚠️ grouped on a NORMALIZED args, never on comm — comm reads `MainThread` for
#    every node and python thread, so a comm roll-up would pile unrelated
#    programs into one meaningless bucket. the key is the program: argv[0]'s
#    basename, plus argv[1] where argv[0] is an interpreter.
#
# ⚠️ the ZOMBIE filter rides here too, and this arm is the one that MUST have it.
#    `top` shows a phantom at the head of a list; this arm SUMS it into a program's
#    bucket — so a zombie's fictional 100% is added to a real program's real spend
#    and the two become one figure a reader cannot part. and this is the row the
#    note below calls the discriminator between a RUNAWAY and mere CONCURRENCY:
#    n=1 at high cpu reads as a prune target, which is exactly what a lone zombie
#    would manufacture out of a process that cannot be pruned at all.
# ⚠️ and the NEWBORN filter rides here for the same reason, only worse. the
#    measured render summed `703.2% cpu · n=7 run.bun.rhachet-run.bc` on a box
#    that was 89% IDLE — a whole bucket, with a peer count, naming a real tree's
#    test run as the box's runaway. a supervisor who felled or pruned on that row
#    would have given up real work to reclaim naught.
#
# 🔴 .and the KEY BUILDER basenamed an inline `-e` PROGRAM, 2026-09-19
#
#    the `split(a, q, "/")` below is a BASENAME — it turns
#    `/usr/lib/node_modules/foo/processChild.js` into `processChild.js`, which is
#    the whole point. `node -e <program>` has no path, and the prior shape reached
#    `a = $7` and basenamed it anyway. measured on grove-sandpine-v20260901:
#
#      ├─   22.9% cpu · n=9  node processChild.js
#      ├─   21.0% cpu · n=1  node cli').then(m
#      ├─   14.2% cpu · n=1  node review').then(m
#
#    both tails are one program family — `node -e import('rhachet-roles-bhrain/…')`
#    — sliced at the last `/` of its own source text, so one family landed in TWO
#    buckets at n=1 each.
#
#    ⚠️ that is a WRONG RANK, not merely an ugly key. folded, the family is
#       35.2% at n=2, which outranks `processChild.js` at 22.9% — so the #2 row
#       of the table a prune decision is read off was the wrong program.
#
#    🔴 and the sharper harm is the `n` column. this arm's own note above calls
#       n=1-at-high-cpu the RUNAWAY tell. to fragment one family into two n=1
#       rows manufactures that tell out of ordinary concurrency — the exact
#       inversion the zombie and newborn filters above exist to prevent.
#
# ⇒ the cure is definitional: `-e` marks a program, a program has no basename, so
#   the basename is not applied. the family keys as `node -e`, and `n` becomes
#   truthful again.
# 🟡 no discrimination is lost — `top` above still renders each process with its
#   own args (`node -e import('rhachet-roles-bhrain/cli').then(m`). `eats` is the
#   ROLL-UP, and family-level is the grain it is for.
# ⇒ clamped at [case10]
__sat_ps 'stat,times,pcpu,comm,args' '-pcpu' | awk '
  $1 ~ /^Z/ { next }                            # a zombie spends naught — see the top arm
  $2 == 0   { next }                            # a newborn has spent naught — see the top arm
{
  n = split($5, p, "/"); prog = p[n];
  key = prog;
  if (prog ~ /^(node|python[0-9.]*|ruby|perl|sh|bash|npx)$/ && NF >= 6) {
    a = $6;
    # 🔴 `-e` marks a PROGRAM, and a program has no path to basename. see the
    #    note above the arm — the split below is a basename, and it must not
    #    reach an inline program or it slices it at an arbitrary `/`.
    if (a == "-e") key = prog " -e";
    else { n2 = split(a, q, "/"); key = prog " " q[n2]; }
  }
  gsub(/\|/, "/", key);
  if (length(key) > 44) key = substr(key, 1, 41) "...";
  cpu[key] += $3; cnt[key]++ }
END { for (k in cpu) if (cpu[k] >= 1) print "roll=" cpu[k] "|" cnt[k] "|" k }' \
  | sort -t= -k2 -rn | head -6

# 🔴 the CENSUS — what the cpu roll-up cannot see, by construction
#
#    `ps -o pcpu` is cputime ÷ elapsed, so a process that sleeps contributes
#    ~zero to a cpu roll-up and a great deal to `runq` and to committed memory.
#    ⇒ a thousand idle processes are INVISIBLE to every read above this line.
#
#    measured 2026-09-10 on grove-sandpine-v20260901: 1024 processes on a 4-cpu
#    box, of which 219 were `tmux: client` against 17 `claude` clones — leaked
#    handles from the babysit sweep's own pane reads. the cpu roll-up accounted
#    for ~30% of a box at runq 6, and the residue that held the rest had no row
#    anywhere in this skill's output.
#
# ⚠️ sorted by PEER COUNT and reported with RSS, never by cpu. those are the two
#    axes a leak shows on and cpu is not one of them. grouped on `comm` here
#    deliberately — the question is "how many handles of this kind exist", and a
#    handle is named by its executable, never by its argv.
echo "procs_total=$(__sat_ps 'pid' | grep -c . || true)"
echo "procs_zombie=$(__sat_ps 'stat' | grep -c '^Z' || true)"
echo "procs_dstate=$(__sat_ps 'stat' | grep -c '^D' || true)"

# 🔴 the DROPPED count — the one witness that the exclusion above fired
#
#    the `top` and `eats` symptoms are load-sensitive: `ps`'s own share is
#    start-relative, so on a busy 4-cpu grove it once fell below the top-3 cut
#    while on local it read 300-400%. so neither table can PROVE the filter ran.
#
# ⇒ this can. the probe is in its own snapshot on every box at every load, so
#   this is >= 1 always — and a filter that drops no row is caught outright,
#   with no reliance on when the sample landed. it is the clamp's deterministic
#   half (git.grove.saturation.census.integration.test.ts [case1] t2).
echo "procs_self=$(ps -eo pgid= 2>/dev/null | awk -v mypg="$__sat_pg" '$1 == mypg { n++ } END { print n+0 }')"

# 🔴 the KIN count — the same witness, for the #111 filter
#
#    the `top` and `roll` symptoms are load-sensitive here too, and worse: an
#    `ssh` blocked on connect burns no cpu and sits below every cut, so the row
#    that started this appears only when the peer happens to be busy. so no
#    table can prove THIS filter ran either.
#
# ⇒ this can, and it is >= 1 on the local path always: the skill, its fan-out
#   subshell, and the `timeout` above this payload are each kin, at every load.
#
# ⚠️ the overlap with `procs_self` is DELIBERATE. a kin that also sits in the
#    probe's own group is counted here too — the alternative (kin minus group)
#    reads 0 under any topology where the two coincide, which would make the
#    witness depend on whether `timeout` re-grouped, the very fact it exists to
#    be independent of.
#
# ⇒ 0 on every grove BY DESIGN — the env is set by the fan-out's local arm
#   alone, and a foreign hostname is refused at `__sat_root`. that zero is
#   itself clamped ([case2] t1 and t2), because an accidental non-zero remotely
#   would mean a pid from one box silenced a process tree on another.
echo "procs_kin=$(printf '%s' "$__sat_kin" | wc -w | tr -d ' ')"

__rss_snap="$(__sat_ps 'rss,comm')"
printf '%s\n' "$__rss_snap" | awk '{
  gsub(/\|/, "/", $2);
  rss[$2] += $1; cnt[$2]++ }
END { for (k in cnt) print "cens=" cnt[k] "|" rss[k] "|" k }' \
  | sort -t'|' -k1.6 -rn | head -8

# 🔴 GREEDS — the same peers as `eats`, ranked by what they HOLD, not by cpu
#
#    task #35: `top` sorts by cpu, `eats` groups by cpu, and the census above
#    sorts by PEER COUNT (a leak signal, by design — see the comment on it).
#    none of the three names the ram driver directly. on a grove already
#    read as 🔴 ram, a supervisor's next question is exactly that one, and
#    had no row to answer it from.
#
#    measured 2026-09-13, grove-sandpine-v20260901: claude held 22G — the
#    single largest ram total on the box by a wide margin — and sat 6th of
#    8 rows in the census above, because it has fewer peers (19) than
#    sshd/bash/tmux/zsh/sh. a top-to-bottom read for the ram driver would
#    pass five unrelated rows before it arrived at the one that mattered.
#
# ⇒ same aggregation as the census above (same `ps` snapshot, so the two
#    never disagree with each other over a race), re-sorted by total rss.
printf '%s\n' "$__rss_snap" | awk '{
  gsub(/\|/, "/", $2);
  rss[$2] += $1; cnt[$2]++ }
END { for (k in cnt) print "greeds=" rss[k] "|" cnt[k] "|" k }' \
  | sort -t'|' -k1.8 -rn | head -6
REMOTE
)

######################################################################
# fan out — every grove at once, each bounded
######################################################################
WORK=$(mktemp -d)
trap 'rm -rf "$WORK"' EXIT

# 🔴 the root THIS invocation hands its LOCAL probe — task #111
#
#    `$$` is the skill's own pid, so the closure the payload builds from it
#    covers exactly what this skill SPAWNED: the fan-out subshells, every
#    `timeout`, every peer `ssh`, and the local payload itself. it covers naught
#    above the skill, which is the bound — see `__sat_root` in the payload.
#
# ⚠️ the hostname rides WITH it, so the payload can refuse a value that reached
#    the wrong box. a pid means naught off the box that issued it.
SELF_ROOT="$(hostname 2>/dev/null || echo '?'):$$"

for key in "${GROVES[@]}"; do
  (
    e="${GROVE_PROBER[$key]}"
    slug="${key//[^a-zA-Z0-9]/_}"
    rc=0
    # ⚠️ the probe is ONE self-contained payload by design, so local costs no
    #    second implementation — the same bytes run under `bash -c` that run
    #    under ssh. a divergent local reader would be a second instrument for
    #    one question, and the two would drift.
    # ⚠️ `SAT_SELF_ROOT` is set on THIS arm only. the remote arm must not carry
    #    it — a pid from this box, applied on a grove, would silence an
    #    unrelated remote process tree ([case2] t0 grades both arms).
    if [[ "$key" == "local" ]]; then
      SAT_SELF_ROOT="$SELF_ROOT" timeout "$TIMEOUT" bash -c "$PROBE" > "$WORK/$slug.out" 2> "$WORK/$slug.err" || rc=$?
    else
      alias=$(jq -r '.sshAlias // .name' "$GROVES_DIR/$e.json")
      timeout "$TIMEOUT" ssh -n \
        -o BatchMode=yes -o ConnectTimeout=8 -o StrictHostKeyChecking=accept-new \
        "$alias" "$PROBE" > "$WORK/$slug.out" 2> "$WORK/$slug.err" || rc=$?
    fi
    echo "$rc" > "$WORK/$slug.rc"
  ) &
done
wait

######################################################################
# render
######################################################################

# read one key out of a probe's output, or a default when it never appeared
kv() { awk -F= -v k="$2" -v d="${3:--}" '$1==k{print $2; f=1; exit} END{if(!f) print d}' "$1"; }

# kb -> a human unit. the probe emits kb everywhere so this is the one cast.
hkb() { awk -v k="${1:--}" 'BEGIN{ if (k=="-"){print "-"; exit}
  split("K M G T P",u," "); i=1; v=k;
  while (v>=1024 && i<5){ v/=1024; i++ }
  if (v<10 && i>1) printf "%.1f%s\n", v, u[i]; else printf "%.0f%s\n", v, u[i] }'; }

# value vs a warn and a crit threshold -> a glyph. an absent reading is ⚪,
# never 🟢 — "not measured" and "measured fine" are different claims.
vrd() { awk -v v="${1:--}" -v w="$2" -v c="$3" 'BEGIN{
  if (v=="-" || v==""){print "⚪"; exit}
  if (v+0 >= c) print "🔴"; else if (v+0 >= w) print "🟡"; else print "🟢" }'; }

pctof() { awk -v a="${1:--}" -v b="${2:--}" 'BEGIN{
  if (a=="-"||b=="-"||b+0==0){print "-"; exit} printf "%.0f\n", 100*a/b }'; }

worst() { # pick the loudest glyph of those given
  local w="🟢"
  for g in "$@"; do
    [[ "$g" == "🔴" ]] && { echo "🔴"; return; }
    [[ "$g" == "🟡" ]] && w="🟡"
  done
  echo "$w"
}

[[ "$FORMAT" == "tree" ]] && { echo "🌲 grove saturation"; echo ""; }

FAILED_NAMED=0

for key in "${GROVES[@]}"; do
  slug="${key//[^a-zA-Z0-9]/_}"

  # every entry name that resolves to this one grove — the reader is owed all of
  # them, so a name absent from the report is never read as a grove left unread
  names="${GROVE_ENTRIES[$key]}"
  label="${names// / + }"

  rc=$(cat "$WORK/$slug.rc" 2>/dev/null || echo 1)
  out="$WORK/$slug.out"
  err=$(head -1 "$WORK/$slug.err" 2>/dev/null || echo "")

  ####################################################################
  # the unreachable arms — reported, never fatal to the sweep
  ####################################################################
  if [[ "$rc" != "0" ]]; then
    [[ -n "$ONLY" ]] && FAILED_NAMED=1

    # .what = the next move after a failed probe — BOUNDED at one re-read
    #
    # 🔴 .why a bound at all — both timeout arms below said "re-read before you
    #   act" in prose and handed back `--timeout $((TIMEOUT * 2))`
    #   UNCONDITIONALLY. the prose is singular; the command is a ladder with no
    #   top, so the two disagreed and only one of them is runnable.
    #
    #   ⇒ and the babysit contract mandates that emitted lines be run VERBATIM
    #     (`rule.always.poll-the-fell-and-heal-sets`), so a supervisor who obeys
    #     this tool climbs 20 → 40 → 80 → 160 … and each rung costs the wall
    #     clock it just asked for. measured 2026-09-20: two rungs, then a third
    #     offered, on a grove the crew poll had ALREADY classified UNREACHED by
    #     its own independent session-list call.
    #
    # 🔴 .the discriminator is STATELESS, and that is what makes it cheap
    #   this skill keeps no memory across runs — and it needs none. the default
    #   is 20, and the ONLY way a caller arrives with more is to have followed a
    #   prior hint. so `TIMEOUT > default` IS "this is a re-read".
    #
    # ⇒ one re-read tests the flap hypothesis, which is a real and common cause.
    #   a SECOND failure refutes it: a channel that flaps does not flap through
    #   two reads at two budgets. past that point the clock is not the lever,
    #   and to offer a bigger one recommends a measurement in place of a cure
    #   (term=false-report — a next-move that cannot move).
    __sat_next_move() {
      local entry="$1"
      if (( TIMEOUT > SATURATION_TIMEOUT_DEFAULT )); then
        printf '%s' "🔴 this was ALREADY a re-read at ${TIMEOUT}s and it failed again, so a transient flap is REFUTED — a longer clock is no longer the lever, and this probe will not settle it. the box is unreachable in the sense that matters: wake it — rhx git.grove.wake ${entry}   ⚠️ still NOT a claim that the box is saturated; a failed read never is. and \`rhx git.crew.poll\` grades this grove by its own independent session list, so read that before you conclude aught about the crews on it"
      else
        printf '%s' "re-read ONCE before you act — rhx git.grove.saturation --only ${entry} --timeout $((TIMEOUT * 2))   ⚠️ ONCE. if that read fails too, the clock is not the lever and this line will say so"
      fi
    }

    if [[ "$rc" == "124" ]]; then
      # 🔴 a timeout on a SATURATION probe has TWO causes, and they invert the
      #    cure. this arm named ONE of them — `a slower box?` — for the life of
      #    the sweep (rule.require.enumerate-before-you-name, the twelfth
      #    instance on record).
      #
      #      far / small box  ⇒ raise the budget. the flag is the whole fix
      #      SATURATED box    ⇒ the budget is not the defect. provision it
      #
      #    ⚠️ and the second is the likelier one, because this probe is cheap:
      #    a box that cannot answer it inside the budget is a box whose cpu is
      #    spoken for. measured 2026-09-17 on grove-sandpine-v20260901 — the
      #    default sweep timed out, and the raised read came back
      #    `🔴 cpu load 14.78 / 4 = 370% · runq 10 · 6 in D`.
      #
      # 🔴 so the instrument goes blind EXACTLY when its subject saturates: a
      #    fixed budget meets a box that is slow by definition, and its
      #    reliability falls as the need for it rises. a supervisor who reads
      #    `a slower box?` at face value dismisses the one grove that most
      #    needed the read.
      #
      # ⇒ a timeout here is EVIDENCE, never merely a failed read. say so, and
      #   hand back a confirm scoped to this one grove rather than a re-sweep.
      state="⏳ timeout"
      hint="a timeout IS a saturation signal — this probe is cheap, so a box that cannot answer inside ${TIMEOUT}s is likely LOADED, not merely far. confirm before you dismiss it: $(__sat_next_move "${GROVE_PROBER[$key]}")"
    elif [[ "$err" == *"Connection refused"* || "$err" == *"No route to host"* ]]; then
      # the wake takes an ENTRY name, never the host:port key — so hand back the
      # very entry this probe went through, which is one a caller can paste
      state="💤 asleep"; hint="wake it: rhx git.grove.wake ${GROVE_PROBER[$key]}"
    elif [[ "$err" == *"timed out"* || "$err" == *"Timeout"* ]]; then
      # 🔴 SSH's OWN timeout, which is not rc 124 — and it landed in the
      #    catch-all below for the life of this sweep.
      #
      #    the arm above catches the `timeout` command's budget expiry (rc 124).
      #    ssh has a second, independent clock: it exits 255 with `Connection
      #    timed out ... banner exchange` when the TCP connect SUCCEEDS and sshd
      #    cannot fork a session inside LoginGraceTime. that is the SAME
      #    EVIDENCE the rc-124 arm calls a saturation signal — the box answered
      #    at the network layer and could not spare a process — yet it rendered
      #    `💥 unreadable` with the raw stderr and no prescribed next move.
      #
      #    .note = the gerund in ssh's message is its wire format, not our
      #            prose, exactly as the earlyoom patterns above are.
      #
      # ⚠️ measured 2026-09-19 on grove-sandpine-v20260901, the box that carries
      #    EVERY sponsored star: this row read `💥 unreadable`, and two full
      #    `git.crew.poll` derivations reached the same grove seconds later. so
      #    the verdict was a point sample of a flappy channel, rendered as a
      #    terminal condition.
      #
      # 🔴 the harm is the SUPERVISOR's next move, never the words alone. the
      #    babysit contract says to halt sprouts and fell on a stalled grove, so
      #    `unreadable` with no re-read offered invites a fleet-wide halt on one
      #    missed handshake (term=false-report — a failed READ reported as a
      #    fact about the BOX).
      #
      # ⇒ same treatment as its rc-124 twin: name it as evidence, hedge the
      #   cause, and hand back a scoped re-read rather than a verdict.
      state="⏳ timeout"
      hint="ssh timed out (not the probe budget — the box answered at the network layer, then could not spare a process inside LoginGraceTime). that is a LOAD signal, and it is also the shape a transient flap takes, so it settles NAUGHT on its own: $(__sat_next_move "${GROVE_PROBER[$key]}")   ⚠️ do NOT halt a sprout or fell a crew on this row: a failed read is not a claim about the box. stderr: ${err:-no stderr}"
    else
      state="💥 unreadable"; hint="${err:-no stderr}"
    fi

    if [[ "$FORMAT" == "json" ]]; then
      echo "grove=$key"; echo "entries=$names"; echo "state=$rc"; echo "error=${err:-timeout}"; echo ""
    else
      echo "🌳 $label"
      echo "   └─ $state — $hint"
      echo ""
    fi
    continue
  fi

  if [[ "$FORMAT" == "json" ]]; then
    echo "grove=$key"
    echo "entries=$names"
    cat "$out"
    echo ""
    continue
  fi

  ####################################################################
  # the readings
  ####################################################################
  host=$(kv "$out" host)
  ncpu=$(kv "$out" ncpu)
  up_s=$(kv "$out" uptime_s)
  load1=$(kv "$out" load1); load5=$(kv "$out" load5); load15=$(kv "$out" load15)

  mem_total=$(kv "$out" mem_total_kb); mem_avail=$(kv "$out" mem_avail_kb)
  mem_cached=$(kv "$out" mem_cached_kb)
  mem_shmem=$(kv "$out" mem_shmem_kb); mem_unevict=$(kv "$out" mem_unevict_kb)
  swap_total=$(kv "$out" swap_total_kb); swap_free=$(kv "$out" swap_free_kb)
  hib_swap=$(kv "$out" hib_swap_kb)
  hib_off=$(kv "$out" hib_resume_offset); hib_dev=$(kv "$out" hib_resume_dev)
  oom_kills=$(kv "$out" oom_kills 0); oom_guard=$(kv "$out" oom_guard none)
  oom_klines=$(kv "$out" oom_klines 0); oom_elines=$(kv "$out" oom_elines 0)
  oom_ekills=$(kv "$out" oom_ekills 0)
  # the total a reader cares about: a clone died, whoever swung. the SPLIT is
  # rendered below, because the two carry different exit codes and cures.
  # ⚠️ coerced before the arithmetic — `set -euo pipefail` is live, so a probe
  #    that returned a non-numeric would abort the whole report rather than
  #    degrade one arm of it.
  [[ "${oom_kills:-}"  =~ ^[0-9]+$ ]] || oom_kills=0
  [[ "${oom_ekills:-}" =~ ^[0-9]+$ ]] || oom_ekills=0
  [[ "${oom_klines:-}" =~ ^[0-9]+$ ]] || oom_klines=0
  [[ "${oom_elines:-}" =~ ^[0-9]+$ ]] || oom_elines=0
  # 🔴 the CGROUP COUNTER — the third witness, and the only one a grove can read.
  #    `-` (or any non-numeric) = unreadable; a number = measured, 0 included.
  oom_cgkills=$(kv "$out" oom_cgkills -)
  oom_cgok=$([[ "${oom_cgkills:-}" =~ ^[0-9]+$ ]] && echo yes || echo no)

  # 🔴 PREFER the journal, FALL BACK to the cgroup — never sum the two.
  #    the journal counts kernel oom lines system-wide; the cgroup counts kills
  #    inside one slice. measured 2026-09-16 on local, where both read: journal
  #    7, cgroup 2. those are two denominators, not a disagreement — so a sum
  #    would double-count every box that has both, and the broader witness wins
  #    wherever it is available.
  # ⚠️ the discriminator is oom_klines, never oom_kills. a readable journal with
  #    zero oom lines is a measured 0 and must NOT be overwritten by the cgroup;
  #    an unreadable journal reports zero LINES, which is the blind case.
  oom_ksrc=journal
  if [[ "${oom_klines:-0}" -eq 0 && "$oom_cgok" == "yes" ]]; then
    oom_kills="$oom_cgkills"
    oom_ksrc=cgroup
  fi

  # ⚠️ the earlyoom half is UNKNOWN, never 0, when its journal is blind. earlyoom
  #    TERMs from userland and never increments the kernel counter, so the cgroup
  #    witness cannot stand in for it. to render a 0 here would trade one false
  #    report for another (term=false-report).
  oom_esrc=$([[ "${oom_elines:-0}" -gt 0 ]] && echo journal || echo none)

  oom_any=$(( oom_kills + oom_ekills ))
  # ⚪ NO witness readable ⇒ NOT measured. distinct from measured-zero.
  #    the cgroup counter joins the two journals as a third way to say `yes`,
  #    which is what lifts a grove out of the ⚪ state it sat in by default.
  oom_seen=$([[ "${oom_klines:-0}" -gt 0 || "${oom_elines:-0}" -gt 0 || "$oom_cgok" == "yes" ]] && echo yes || echo no)

  disk_total=$(kv "$out" disk_total_kb); disk_used=$(kv "$out" disk_used_kb)
  disk_avail=$(kv "$out" disk_avail_kb); disk_pct=$(kv "$out" disk_pct)

  vm_r=$(kv "$out" vm_r); vm_b=$(kv "$out" vm_b)
  vm_si=$(kv "$out" vm_si); vm_so=$(kv "$out" vm_so)
  vm_id=$(kv "$out" vm_id); vm_wa=$(kv "$out" vm_wa)

  # the COUNTER axis — a rate no gauge on this page can see (see the probe's
  # own note). `-` means unreadable; a 0 here would assert a quiet box.
  fork_rate=$(kv "$out" fork_rate); ctxt_rate=$(kv "$out" ctxt_rate)
  rate_window=$(kv "$out" rate_window)
  # the BASELINE for the storm arm below — this box's own since-boot mean fork
  # rate. a live rate is meaningless against a constant; it is only "high"
  # against the box that produced it (see [case5]).
  fork_mean=$(kv "$out" fork_mean)

  cpu_s10=$(kv "$out" psi_cpu_some_10);  cpu_s60=$(kv "$out" psi_cpu_some_60)
  cpu_f60=$(kv "$out" psi_cpu_full_60)
  mem_s60=$(kv "$out" psi_memory_some_60); mem_f60=$(kv "$out" psi_memory_full_60)
  io_s60=$(kv "$out" psi_io_some_60);     io_f60=$(kv "$out" psi_io_full_60)

  cpu_st=$(kv "$out" psi_cpu_some_total)
  mem_st=$(kv "$out" psi_memory_some_total); mem_ft=$(kv "$out" psi_memory_full_total)
  io_st=$(kv "$out" psi_io_some_total)

  # cumulative µs stalled, as a share of the grove's whole life. this is the
  # LIFETIME verdict — it does not decay, so it answers a question no average can.
  lifeshare() { awk -v us="${1:--}" -v up="${up_s:--}" 'BEGIN{
    if (us=="-"||up=="-"||up+0==0){print "-"; exit} printf "%.3f\n", 100*(us/1000000)/up }'; }
  hsec() { awk -v us="${1:--}" 'BEGIN{ if(us=="-"){print "-"; exit}
    s=us/1000000; if (s<1) printf "%.2fs\n", s; else if (s<60) printf "%.1fs\n", s;
    else if (s<3600) printf "%.1fm\n", s/60; else printf "%.1fh\n", s/3600 }'; }

  ####################################################################
  # the derived quantities + verdicts
  #
  # .why load is graded PER CORE and stall is graded on its own: they answer
  #      different questions. load says how many tasks want the cpu; stall says
  #      whether any of them WAITED for it. a 4-core box at load 4 with zero
  #      stall is fully used and healthy — the alarm belongs on the stall.
  ####################################################################
  load_pct=$(awk -v l="$load1" -v n="$ncpu" 'BEGIN{
    if (l=="-"||n=="-"||n+0==0){print "-"; exit} printf "%.0f\n", 100*l/n }')
  mem_avail_pct=$(pctof "$mem_avail" "$mem_total")
  mem_used_pct=$(awk -v p="$mem_avail_pct" 'BEGIN{ if(p=="-"){print "-";exit} print 100-p }')
  swap_used=$(awk -v t="${swap_total:--}" -v f="${swap_free:--}" 'BEGIN{
    if (t=="-"||f=="-"){print "-"; exit} print t-f }')
  swap_used_pct=$(pctof "$swap_used" "$swap_total")
  up_d=$(awk -v s="$up_s" 'BEGIN{ if(s=="-"){print "-";exit} printf "%.1fd\n", s/86400 }')

  # 🔴 the LIFETIME row is graded, not merely printed.
  #
  # ⚠️ it was printed and ungraded for exactly one round, and the gap showed at
  #    once: the grove read 6.2% lifetime cpu stall — 🟡 by
  #    `rule.require.bound-grove-concurrency-by-saturation`'s own 2–10% band —
  #    while this skill rendered 🟢, because the verdict looked only at the 60s
  #    averages and the instant burst had passed.
  #
  #    so the instrument contradicted the rule that cites it, and the instrument
  #    is the half a supervisor actually reads. an ungraded row is decoration: a
  #    reader who trusts the glyph never reaches the number beneath it.
  #
  # ⇒ the bands here are the rule's bands, deliberately. if they are ever
  #   changed, change BOTH — a threshold that lives in two places and agrees in
  #   one is worse than a threshold in neither.
  # 🔴 LOAD ALONE DOES NOT MEASURE CPU — the run queue must corroborate it
  #
  #    linux counts tasks in UNINTERRUPTIBLE SLEEP (state D) in its load average,
  #    which traditional unix did not. so a task blocked in memory reclaim raises
  #    the load though it never asked for a core. on a memory-bound grove the load
  #    average is therefore a MEMORY signal dressed as a cpu one.
  #
  #    measured on grove-sandpine-v20260901, 2026-09-06/07 — four reads, one box:
  #      load 3.32/4 =  83%  idle 89%  runq 2   ← load says busy, runq says idle
  #      load 4.03/4 = 101%  idle 95%  runq 0   ← graded 🔴 on an EMPTY run queue
  #      load 6.24/4 = 156%  idle 76%  runq 2
  #      load 8.43/4 = 211%  idle 56%  runq 2
  #    across all four, cpu LIFE stall sat flat at 8.1–8.8% — the 🟡 band — while
  #    ram life climbed 44% → 53%. the load tracked the memory axis, never cpu.
  #
  # ⇒ the run queue is the discriminator: it counts only RUNNABLE tasks, which is
  #   exactly what "is the cpu contended" asks. a load above the core count with a
  #   run queue BELOW it is a memory stall, and a 🔴 there sends a supervisor to
  #   add cores that fix naught (`term=false-report`).
  #
  #   so the load is graded only where the run queue agrees. the NUMBER prints
  #   either way — a high load beside an empty runq is itself a useful tell, and
  #   the render names it rather than hides it.
  v_load=$(vrd "$load_pct" 70 100)
  runq_backs_load=$(awk -v r="${vm_r:--}" -v n="${ncpu:-0}" 'BEGIN{
    if (r=="-"||n+0==0){print "unknown"; exit} print (r+0 >= n+0) ? "yes" : "no" }')
  [[ "$runq_backs_load" == "no" ]] && v_load="⚪"
  v_cpu_stall=$(vrd "$cpu_s60" 10 30)
  # ⚠️ cpu `full` is STRUCTURALLY ZERO at the system level — it is not a health
  #    signal, and it must not be graded as one.
  #
  #    `full` means "every non-idle task stalled". for memory and io that state
  #    is reachable. for CPU it is not: if a task stalls on cpu, some other task
  #    holds the cpu, so by construction it can never be all of them. the kernel
  #    reports the line anyway, permanently 0.
  #
  #    measured 2026-09-03, kernel 6.8.0-1063-aws, on a grove that had hit
  #    runq 11: `cpu full total=0` EXACTLY, while `memory full total=1294179` and
  #    `io full total=75815905` on the same box, same instant. a field that sits
  #    at exactly zero where its peers accumulate is structural, never lucky.
  #
  # ⇒ so a 🟢 from this verdict would be the page's most deceptive glyph: it
  #   reads as "measured, and healthy" when the truth is "cannot ever fire".
  #   that is `false-report` of the kind that comforts — see term=false-report.
  v_cpu_full="⚪"
  v_cpu_life=$(vrd "$(lifeshare "$cpu_st")" 2 10)
  # the LIVE half is folded APART from the lifetime half, so the row below can
  # say which of the two drove the glyph. `worst` is associative over
  # {🟢,🟡,🔴} and ignores ⚪, so this composes to the identical verdict the
  # flat four-term fold produced — the split adds a term to READ, never a term
  # to change. see `.the glyph folds a LIFETIME term` at the render.
  v_cpu_live=$(worst "$v_load" "$v_cpu_stall" "$v_cpu_full")
  v_cpu=$(worst "$v_cpu_live" "$v_cpu_life")

  # ram is graded on what is AVAILABLE, never on what is "used" — page cache
  # counts as used and is reclaimable on demand, so a used% verdict cries wolf
  # on every warm box.
  v_mem_life=$(vrd "$(lifeshare "$mem_st")" 1 5)
  v_mem_head=$(vrd "$(awk -v p="$mem_avail_pct" 'BEGIN{if(p=="-"){print "-";exit} print 100-p}')" 80 92)
  v_mem_stall=$(vrd "$mem_s60" 1 10)
  v_mem_full=$(vrd "$mem_f60" 0.01 1)
  v_swap_rate=$(vrd "$(awk -v a="${vm_si:-0}" -v b="${vm_so:-0}" 'BEGIN{print a+b}')" 1 1000)
  # an oom kill is graded 🔴 outright, never merely printed: it is the ONE memory
  # event that a stall read cannot show you after the fact, because the kill ENDS
  # the pressure that caused it.
  # graded on the TOTAL — a clone killed by earlyoom is just as dead to the fleet
  # as one killed by the kernel. an unread journal grades ⚪, never 🟢: it has
  # measured nought, and a green light off no measurement is the defect this arm
  # was repaired to close.
  v_oom=$([[ "$oom_seen" == "yes" ]] && vrd "${oom_any:-0}" 1 1 || echo "⚪")
  v_mem=$(worst "$v_mem_head" "$v_mem_stall" "$v_mem_full" "$v_swap_rate" "$v_mem_life" "$v_oom")

  v_disk_head=$(vrd "$disk_pct" 75 90)
  v_io_stall=$(vrd "$io_s60" 10 30)
  v_io_full=$(vrd "$io_f60" 5 20)
  v_io_life=$(vrd "$(lifeshare "$io_st")" 2 10)
  v_disk=$(worst "$v_disk_head" "$v_io_stall" "$v_io_full" "$v_io_life")

  ####################################################################
  # the tree
  ####################################################################
  echo "🌳 $label  ·  $host  ·  ${ncpu} cpu · $(hkb "$mem_total") ram · $(hkb "$disk_total") disk  ·  up ${up_d}"

  echo "   ├─ $v_cpu cpu    load ${load1} / ${ncpu} = ${load_pct}%  ·  idle ${vm_id}%  ·  runq ${vm_r} · blocked ${vm_b}"
  ####################################################################
  # 🔴 .the CHURN row — the only counter-derived cpu figure on this page
  #
  #  every other cpu term here is a gauge, so a process born and reaped between
  #  two samples is counted by none of them. `surgoal.squeeze-the-grove` measured
  #  91.4% of one grove's whole cpu spend in processes that were already dead.
  #
  #  measured 2026-09-17 on grove-sandpine-v20260901: load 321% of 4 cores, and the
  #  `eats` roll-up accounted for ~35%. the residue was a fork storm at 231/sec,
  #  and this skill had no row that could name it — so the supervisor finished the
  #  read by hand and reached the PROVISION rung on an unexplained 286%.
  #
  # .note = `-` is UNREADABLE, never 0. the window is measured, never assumed.
  echo "   │     ├─ churn   ${fork_rate}/s forks · ${ctxt_rate}/s ctxt-sw   (over ${rate_window}s)"
  # 🔴 .the row must NAME THE VERB, because the nearest verb by name CANNOT do it
  #
  #    "hunt the PARENT" with no command sends its reader to `git.grove.prune`,
  #    which is the one tool on this fleet that can never perform this hunt: its
  #    default is `--process nvim` and its refuse-list holds `node` and `claude`
  #    by design, so the process family that actually reaps on a grove is
  #    unreachable from it. that is not a near-miss — it is a census of the wrong
  #    population, and on a 🔴 box `surgoal.squeeze-the-grove` grades a census a
  #    blocker in its own right (O(N) forks per sample, to answer worse).
  #
  #    measured 2026-09-18, here, at 76 forks/s: the supervisor read this row,
  #    ran `rhx git.grove.prune grove-sandpine-v20260901`, and got 3 × nvim at
  #    0.3% cpu between them. the hunt then took a second call.
  #
  # ⇒ `git.grove.saturation.spend` IS that second call, and it is kin to this
  #   skill: it reads /proc/<pid>/stat cutime+cstime by live parent — reaped cpu,
  #   attributed to the reaper. exactly the counter read this row asks for.
  #
  # .why --window, run TWICE: a storm is a SPIKE by definition, so the in-window
  #   read that flagged it is the least reliable one to rank a lever on
  #   (rule.always.re-measure-a-lever-before-you-rank-it). the same tick proved
  #   it — 76/s at the flag, 14/s on the re-measure twenty minutes later.
  #
  # 🔴 .that argument is right, and it once carried the WRONG remedy
  #   this line read `--since-boot`, on the argument above. but the cure for one
  #   noisy window is a SECOND window, never a WINDOWLESS read — which is what
  #   the spend verb's own --help says outright: "run it twice, OR cross-check
  #   with --since-boot". the two are not one instrument.
  #
  #   measured on two consecutive ticks, 2026-09-18, both on `local` at a real
  #   flag (499/s vs 102/s, then 180/s vs 102/s): the prescribed --since-boot
  #   hunt returned systemd 46% · zsh 10% · tmux 10% BOTH times — the structural
  #   reapers, and not one term a spike could have moved. over 15.8d and 729.5
  #   cpu-h, a spike of minutes shifts no rank by construction. ⇒ the
  #   prescription could not answer the question its own headline raised, and it
  #   cost a live call per tick to learn that twice.
  #
  # ⚠️ and this very row TEACHES the distinction a few lines below, in its own
  #   lifetime-vs-live caveat: "a lifetime share grades the box's whole uptime,
  #   so it is a PROVISION signal — never halt a sprout or fell a crew on this
  #   glyph alone". a LIVE spike handed a LIFETIME instrument is that same
  #   confusion, emitted by the render that warns against it.
  # ⇒ so --since-boot stays named here — as the CROSS-CHECK its help calls it,
  #   never as the hunt.
  # .why GROVE_PROBER: the entry name, never the host:port key, so the line is
  #   one a caller can paste — the same convention the timeout and asleep hints
  #   above already keep. it is set for `local` too (see the declare block).
  # ⇒ clamped at [case4] in git.grove.saturation.forks.integration.test.ts
  # 🔴 .the VERDICT LEADS. it does not print, then withdraw itself
  #
  #   the prior shape emitted `🔴 a fork STORM` + `hunt the PARENT` + a runnable
  #   hunt command UNCONDITIONALLY, and folded the baseline comparison into the
  #   middle. so a below-baseline box rendered, in one block and in this order:
  #
  #     🔴 a fork STORM … hunt the PARENT … before you fell a tree or add a core
  #     ⚠️ but 99/s is BELOW … so this is the grove AT REST, never a spike
  #        the lever here is PROVISION … not a hunt
  #     hunt it: rhx git.grove.saturation.spend <grove> --since-boot
  #
  #   ⇒ the LAST line — the one a reader acts on — is the hunt, printed directly
  #     after the text that says the hunt is not the lever. measured 2026-09-18
  #     on a live tick: the supervisor read it on `local` and ran it, and got
  #     `systemd 388.4 cpu-h / 46.2%` plus a `102.2/s mean` the saturation render
  #     had ALREADY printed two lines above. a whole call, to be handed a figure
  #     already in hand and a reaper that is structural by construction.
  #
  #   ⚠️ the datum that settles it is in hand BEFORE the headline prints. to
  #     print the verdict first and the datum second is the defect, whatever the
  #     datum then says (`rule.always.clamp-the-production-defect-you-just-saw`).
  #
  # 🔴 .and an UNREADABLE baseline used to render as a POSITIVE comparison
  #   the guard was `[[ $fork_mean != "-" ]] && (f < m)`, so `-` fell to the
  #   else and emitted `ABOVE this box's own -/s baseline — a real spike`. a read
  #   that did not land, dressed as a verdict about the world — the same shape as
  #   the ON-GROVE caveat cured 2026-09-18 (`term=false-report`). an unread
  #   baseline supports NEITHER side, so it now says so and owes the hunt on the
  #   absolute alone, which is the only term it still has.
  #
  # ⇒ the flag is NOT lowered — the arm still fires on the same absolute gate,
  #   and still DIAGNOSES on every branch. what changed is that the headline, the
  #   prescription, and the runnable command now all follow the verdict.
  # ⇒ clamped at [case4] (the verb) · [case5] (the baseline) · [case6] (this)
  #
  # 🔴 .and the ABOVE branch asserted a SETTLED spike off ONE window
  #
  #   `fork_rate` is a delta over `rate_window` — and that window is the span of
  #   the `vmstat 1 2` call above, ~1.0s. `fork_mean` is a since-boot mean over
  #   a whole uptime. so `f < m` ranks a ONE-SECOND sample against a 15.8-day
  #   one, and a fork count bursts, so a single second near the mean is close to
  #   a coin flip.
  #
  #   ⚠️ the arm KNEW this and exempted itself. four lines below it tells its
  #      reader "run it TWICE — one window ranks no lever", and then it ranks a
  #      lever on one window.
  #
  #   measured on two consecutive babysit ticks, 2026-09-19, grove-sandpine-v20260901,
  #   baseline 180/s both times:
  #
  #     | the 1s gauge said | the arm rendered            | the 30s hunt, twice |
  #     |---|---|---|
  #     | 231/s             | 🔴 STORM · "a real spike"   | 136/s · 95/s        |
  #     | 259/s             | 🔴 STORM · "a real spike"   |  57/s · 54/s        |
  #
  #   ⇒ BOTH refuted, and by a wide margin — the AT REST branch was the correct
  #     one on each, and the arm took the other. the cost is 60s of hunt per
  #     tick, spent to learn the same answer twice (`rule.always.pave-on-second
  #     -repeat`, and the flag is a `term=false-report`: a true count of one
  #     second, dressed as a verdict about a sustained state).
  #
  #   🔴 and the sharpest datum is a SAME-BOX pair, ~90s apart on one tick:
  #
  #        render A   churn 259/s   → flagged 🔴 STORM
  #        hunt ×2     57/s · 54/s  → over 30s windows
  #        render B   churn  14/s   → below the 50/s gate; the arm did not fire
  #
  #     259 → 14 on one box inside two minutes. ⇒ the quantity this arm grades
  #     swings by ~18× between adjacent samples, so a single sample cannot place
  #     it against a mean AT ALL — the comparison is closer to a coin flip than
  #     to a measurement, whichever side it lands on.
  #
  # 🟡 .the two cures REJECTED, and why
  #   - a MARGIN (fire only above k × mean) — a guessed threshold, and the whole
  #     lesson of the zombie/newborn pair is to reach for a definitional term
  #   - a WIDER window (a third `processes` read at the END of the probe, free of
  #     wall-clock cost) — 🔴 it would span the probe's OWN census, so the probe's
  #     ps/awk forks would enter the numerator. that is #110 rebuilt on the fork
  #     axis, and [case1] exists to forbid exactly it
  #
  # ⇒ so the cure is the arm's own principle, applied to the arm: ONE window may
  #   nominate a spike, and may not settle one. the flag still fires, the hunt is
  #   still named and still owed — what is withdrawn is the claim that the answer
  #   is already known before the hunt runs.
  # ⇒ clamped at [case9]
  #
  # 🔴 .and that cure shipped with its own last two words against it
  #   the ban was written against ONE polarity — the string `a real spike`, which
  #   prejudges STORM. the branch then closed `expect AT REST.`, which prejudges
  #   the OTHER verdict and is the SAME act: an answer handed to the reader ahead
  #   of the hunt that produces it. it survived because the tooth graded a word
  #   rather than the shape.
  #
  #   .measured 2026-09-19, the third data point, and it broke the forecast:
  #     231/s → hunt 136/95   → at rest ✅
  #     259/s → hunt  57/54   → at rest ✅
  #     291/s → hunt 84.9% / 91.9% REAPED, claude 53.4% → 68.1%  → 🔴 NOT at rest
  #   on a box at runq 8 of 4 cores, idle 3%, stall 24.91% @10s. n=2 had been
  #   shipped as a law (rule.require.enumerate-before-you-name), and a reader who
  #   trusted it would have skipped the one call that named the spender.
  # ⇒ clamped at [case9][t3], which grades the ACT rather than either word
  #
  # 🔴 .and the BELOW branch carried the same act twice, unexamined
  #   [t0] and [t3] both read the ABOVE branch. the AT REST branch shipped with
  #   a FORECAST ("a hunt would name the structural reaper (tmux …)") and a
  #   PROHIBITION built on it ("⇒ do NOT hunt the PARENT here"). a forecast
  #   merely misleads; a ban REMOVES the instrument, so its reader never learns
  #   the forecast was wrong.
  #
  #   .measured 2026-09-19, the hunt run twice against the ban:
  #     claude        reaped 90.8%  /  40.4%
  #     tmux: server  reaped  0.0%  /   0.0%    ← the predicted answer, at ZERO
  #   on a box at runq 6 of 4 cores, idle 3%, stall 71.71% @10s, where `eats`
  #   (a ps GAUGE) attributed ~36% of a 261% load and the hunt (a COUNTER)
  #   attributed 129% — ~93 points of cpu no other instrument can see.
  #
  #   ⇒ the category error: this branch reasons on the FORK axis and banned an
  #     instrument whose subject is the CPU axis. its own next clause concedes
  #     "no `eats` row can attribute it", which is the very condition that makes
  #     the hunt worth a call.
  # ⇒ clamped at [case9][t4]
  #
  # 🔴 .and the BELOW branch still SETTLED its own verdict off that one window
  #   [t3] withdrew `expect AT REST` from the ABOVE branch as a prejudgment.
  #   [t4] withdrew the forecast and the ban from the BELOW branch. neither
  #   touched the BELOW branch's own HEADLINE, which read `NOT a storm … so this
  #   is the grove AT REST on the FORK axis` — a settled verdict, off the exact
  #   ~1s sample [case9] exists to say may settle naught.
  #
  #   ⚠️ the asymmetry is the tell, and it is the SAME shape twice: the ABOVE
  #      branch carries `read over ONE ${rate_window}s window, which ranks no
  #      lever on its own … a CANDIDATE spike, never a settled one`, and its
  #      twin, off the identical datum, asserted the opposite as fact. a cure
  #      landed on one branch and its twin went unread — exactly what [t4] had
  #      already recorded one clause above, repeated on the next clause down.
  #
  #   .measured 2026-09-19, and it errs in the STEERING direction:
  #     the 1.03s gauge read  58/s vs a 174.2/s baseline → rendered AT REST
  #     the 30s hunt then read 383/s                     → 2.2× that baseline
  #   a 6.6× gap between the two windows, on one box minutes apart. the render
  #   pointed a supervisor AWAY from the fork axis on a box at 2.2× its own
  #   normal — where a false STORM merely costs a hunt, a false AT REST costs
  #   the read that would have found the spender (`term=false-report`).
  #
  # 🟡 .what is NOT withdrawn — the [t4] counter-tooth still binds
  #   the comparison is real and the PROVISION lever is sound, so both survive
  #   verbatim. the branch keeps `grove AT REST` and keeps its remedy; what it
  #   gives up is the claim that one window SETTLED either. and the hunt is no
  #   longer gated on `where the box stalls` — that conditional was the residue
  #   of the ban [t4] withdrew, and it re-imposed the ban on every quiet box.
  # ⇒ clamped at [case9][t5]
  if [[ "$fork_rate" != "-" ]] && awk -v f="${fork_rate:-0}" 'BEGIN{exit !(f+0>=50)}'; then
    if [[ "$fork_mean" != "-" ]] && awk -v f="${fork_rate:-0}" -v m="${fork_mean:-0}" 'BEGIN{exit !(f+0 < m+0)}'; then
      # AT REST — a CANDIDATE, off the very window the ABOVE branch may not settle on.
      echo "   │     │         🟡 a high fork rate, and a CANDIDATE at-rest read: ${fork_rate}/s"
      echo "   │     │            is BELOW this box's own ${fork_mean}/s baseline since boot —"
      echo "   │     │            read over ONE ${rate_window}s window, which ranks no lever on"
      echo "   │     │            its own. so \"grove AT REST on the FORK axis\" is a NOMINATION"
      echo "   │     │            here, never a settled one, and the hunt below is what grades it."
      echo "   │     │            ⚠️ and that axis alone — it says naught about whether the cpu"
      echo "   │     │               is ATTRIBUTABLE, and the cpu these forks spend is real"
      echo "   │     │               where no \`eats\` row reaches it."
      echo "   │     │            ⇒ the hunt is the one instrument that reads REAPED cpu, and it"
      echo "   │     │               costs 2 forks, not a census. run it TWICE — one window ranks"
      echo "   │     │               no lever, which is the same bound this verdict sits under:"
      echo "   │     │               rhx git.grove.saturation.spend ${GROVE_PROBER[$key]} --window 30"
      echo "   │     │            measured 2026-09-19: a 1.03s gauge read 58/s against a 174/s"
      echo "   │     │               baseline and rendered AT REST; a 30s hunt then read 383/s"
      echo "   │     │               — 2.2× that same baseline, on one box minutes apart."
      echo "   │     │            where the hunt names no lever you can pull, the remedy on"
      echo "   │     │            this axis is PROVISION or fewer concurrent crews."
    else
      echo "   │     │         🔴 a fork STORM. a rate this high spends cpu that no"
      echo "   │     │            \`eats\` row can attribute, because each process is"
      echo "   │     │            gone before the next sample. hunt the PARENT that"
      echo "   │     │            reaps them before you fell a tree or add a core."
      echo "   │     │            ⚠️ NOT via prune — it refuses node/claude by design."
      if [[ "$fork_mean" == "-" ]]; then
        echo "   │     │            ⚠️ this box's own baseline went UNREAD, so which side of it"
        echo "   │     │               ${fork_rate}/s falls on is unsettled — the flag stands on the"
        echo "   │     │               absolute alone, and the hunt is what settles the rest."
      else
        echo "   │     │            ⚠️ and ${fork_rate}/s is ABOVE this box's own ${fork_mean}/s baseline"
        echo "   │     │               since boot — read over ONE ${rate_window}s window, which ranks no"
        echo "   │     │               lever on its own. so this is a CANDIDATE spike, never a settled"
        echo "   │     │               one, and the hunt below is what grades it. it may land either"
        echo "   │     │               way — do NOT skip the hunt on a guess at which."
      fi
      echo "   │     │            hunt it: rhx git.grove.saturation.spend ${GROVE_PROBER[$key]} --window 30"
      echo "   │     │               run it TWICE — one window ranks no lever. and --since-boot"
      echo "   │     │               is the CROSS-CHECK here, never the hunt: over a whole uptime"
      echo "   │     │               a spike of minutes moves no rank, so it hands back the"
      echo "   │     │               structural reaper whatever the spike turns out to be."
    fi
  fi
  # the tell, stated rather than left for the reader to derive: a load over the
  # core count that the run queue does not back does not grade cpu, so the
  # verdict withheld it — and the reader is owed the reason, never just the glyph.
  #
  # 🔴 it said `so this reads the MEMORY axis` until 2026-09-19, and that named a
  #    CAUSE it had not measured. two refutations, both from rows on the SAME
  #    render, measured that day on grove-sandpine-v20260901:
  #      load 7.13 · runq 0 · holds `0 in D` · ram stall 0.00%@60s · ram 23% free
  #    under the old clause a load of 7.13 needs ~7 tasks in uninterruptible
  #    sleep. there were none, and the axis it named read clean.
  #
  # ⚠️ the category error beneath it: LOAD is a decayed average over 1/5/15m,
  #    while runq and the D-count are INSTANTS. so `runq 0, therefore memory`
  #    compares an average to a sample, and the honest account was on the next
  #    row down — trend 1m 7.13 · 5m 9.42, i.e. a burst already receded.
  #
  # 🔴 the harm is a MISDIRECTED READ, and it does not need the box to be idle:
  #    D-state is memory reclaim OR disk io OR a network fs. on a box whose real
  #    axis is disk, the old clause sent a supervisor to memory, memory read
  #    clean, and the red disk row went unexamined. ⇒ so the cure names every
  #    candidate and points at the discriminator, which this render already
  #    prints for free — the three stall rows, plus `holds … in D`.
  if [[ "$runq_backs_load" == "no" ]] && awk -v p="${load_pct:-0}" 'BEGIN{exit !(p+0>=100)}'; then
    echo "   │     ├─ ⚠️ load  ungraded — runq ${vm_r} of ${ncpu} cores, so no task waits on cpu."
    echo "   │     │          ⚠️ load is a DECAYED AVERAGE; runq and the D-count are INSTANTS, so"
    echo "   │     │             a high load OUTLIVES its burst. trend 5m above 1m = it recedes"
    echo "   │     │          uninterruptible sleep counts in load too, and D is memory reclaim"
    echo "   │     │          OR disk io OR a network fs — never memory alone. the stall rows"
    echo "   │     │          below settle WHICH; \`holds … in D\` says if any task waits NOW."
    echo "   │     │          grade cpu on stall + life, never on load"
  fi
  ####################################################################
  # 🔴 .the glyph folds a LIFETIME term into a row of LIVE ones — so say when
  #    the lifetime term is the one that DROVE it, and say what the live half
  #    grades. ⚠️ those are TWO facts, not one — see the second block below,
  #    which is the defect that read them as one.
  #
  #  `v_cpu` is the worst of four, and `v_cpu_life` measures the whole uptime.
  #  so a box that stalled hard last week and idles now renders 🔴 beside
  #  `runq 1 · stall 3.17%`, and EVERY number the reader can see disagrees with
  #  the glyph above them. measured 2026-09-17 on grove-sandpine-v20260901:
  #  v_load ⚪, v_cpu_stall 🟢, v_cpu_full ⚪, v_cpu_life 🔴 at 21.420%.
  #
  # ⚠️ the load note above cures the IDENTICAL shape one term over, and
  #    enumerates one of the four terms that can drive this glyph
  #    (rule.require.enumerate-before-you-name). `life` is a second, it
  #    misleads in the same direction, and it had no note at all — nor does the
  #    load note fire here, since it gates on load >= 100%.
  #
  # 🔴 .the human was PAYING for the gap, by hand, every tick
  #    the babysit cron prompt carries a hand-authored caveat against this very
  #    render: "the 🔴 cpu flag is a LIFETIME figure; the LIVE signal is the run
  #    queue. runq 0 + high lifetime % = recovered, do not fell." a caveat a
  #    human maintains in prose is one the tool owes its reader.
  #
  # .why the glyph itself is UNCHANGED
  #    21% of a box's life stalled is a real PROVISION signal, and 🔴 is the
  #    right grade for it. the defect was the SILENCE, never the colour — to
  #    downgrade the row would trade an honest verdict for a comfortable one.
  #
  # .note = it prints the live NUMBERS rather than a second glyph. an all-⚪ row
  #         makes `worst` return 🟢 (it escalates on 🔴/🟡 alone), so a glyph
  #         there would assert "measured, and healthy" off no measurement — the
  #         same false-report this file names at v_cpu_full.
  ####################################################################
  #
  # 🔴 .the gate proves LIFE IS WORSE. it does NOT prove LIVE IS CLEAN
  #    `v_cpu = worst(v_cpu_live, v_cpu_life)`, so `v_cpu != v_cpu_live` fires
  #    on every row where life is STRICTLY worse — which includes a live half
  #    already graded 🟡. the note then asserted "no live term on this row
  #    reaches it" over a live half that was itself degraded.
  #
  #    measured 2026-09-19 on grove-sandpine-v20260901:
  #      ├─ 🔴 cpu    load 3.37 / 4 = 84%  ·  idle 0%  ·  runq 6 · blocked 1
  #      │     ├─ ⚠️ 🔴  from LIFE, not from now — no live term on this row reaches it:
  #      │     │          runq 6 of 4 cores · stall 22.00% @10s · load 84%.
  #    v_load 🟡 (84%, and runq 6 of 4 BACKS it), v_cpu_stall 🟡 (12.23%@60s),
  #    v_cpu_life 🔴 ⇒ live folds to 🟡, life to 🔴, the gate fires, and the
  #    render denies a run queue at 150% of core count on its own next line.
  #
  # 🔴 the harm is the INVERSE of the one this note was written to cure. that
  #    defect over-alarmed a recovered box; this one RE-ASSURES a contended
  #    one — and it fires exactly when the box is worst, since a degraded live
  #    half is a precondition. `term=false-report`: a verdict true over the set
  #    it measured (life ≠ live), stated as a claim about the world.
  #
  # ⇒ so the branch splits on the LIVE grade. a clean live half keeps the
  #   original note verbatim; a degraded one names its own grade and hands the
  #   sprout/fell decision to the live terms, which stand on their own.
  if [[ "$v_cpu" != "$v_cpu_live" ]]; then
    if [[ "$v_cpu_live" == "🟢" || "$v_cpu_live" == "⚪" ]]; then
      echo "   │     ├─ ⚠️ ${v_cpu}     from LIFE, not from now — no live term on this row reaches it:"
      echo "   │     │          runq ${vm_r} of ${ncpu} cores · stall ${cpu_s10}% @10s · load ${load_pct}%."
      echo "   │     │          a lifetime share grades the box's whole uptime, so it is a PROVISION"
      echo "   │     │          signal — never halt a sprout or fell a crew on this glyph alone"
    else
      echo "   │     ├─ ⚠️ ${v_cpu}     from LIFE — but the LIVE half is ${v_cpu_live}, NOT clean. read BOTH:"
      echo "   │     │          runq ${vm_r} of ${ncpu} cores · stall ${cpu_s10}% @10s · load ${load_pct}%."
      echo "   │     │          the lifetime share is a PROVISION signal and drove the glyph. the live"
      echo "   │     │          terms are a NOW signal and stand on their own — grade a sprout or a"
      echo "   │     │          fell on THEM, never on this glyph, which folds the two together"
    fi
  fi
  echo "   │     ├─ trend   1m ${load1} · 5m ${load5} · 15m ${load15}"
  echo "   │     ├─ stall   some ${cpu_s10}% @10s · ${cpu_s60}% @60s   ·   (no cpu 'full' at system level — always 0)"
  echo "   │     └─ life    $(hsec "$cpu_st") stalled over ${up_d} uptime  ·  $(lifeshare "$cpu_st")% of its life"

  echo "   ├─ $v_mem ram    $(hkb "$mem_avail") available of $(hkb "$mem_total") (${mem_avail_pct}%)  ·  ${mem_used_pct}% committed"
  # ⚠️ `Cached` is NOT a synonym for "reclaimable" — it counts tmpfs/shmem and
  #    mlocked pages, neither of which can be dropped. so the pinned share is
  #    named beside it rather than folded into it; a reader who sees only the
  #    cache figure infers headroom the kernel has not promised.
  echo "   │     ├─ cache   $(hkb "$mem_cached") page cache  ·  pinned: $(hkb "$mem_shmem") shmem + $(hkb "$mem_unevict") unevictable"

  ####################################################################
  # 🔴 the swap arm — THREE states, not two
  #
  # this arm read `SwapTotal == 0 → ⚠️ none configured` and that was a FALSE
  # REPORT. an idle swap is the HEALTHY state on a hibernate-prepared grove:
  # ec2-hibinit-agent lays down /swap-hibinit, registers its resume offset, then
  # deliberately swapoffs it, so the file is reserved for the suspend image.
  #
  # ⇒ the two facts that LOOK like one are:
  #     - is there a PAGING cushion?     (SwapTotal)
  #     - is HIBERNATE prepared?         (the file + the resume offset)
  #   a single "is there swap?" question conflates them and answers neither.
  ####################################################################
  if [[ "$swap_total" != "0" && "$swap_total" != "-" ]]; then
    # a real paging cushion is active — report its use and its RATE
    echo "   │     ├─ swap    $(hkb "$swap_used") of $(hkb "$swap_total") paging (${swap_used_pct}%)  ·  rate in ${vm_si}/s · out ${vm_so}/s"
  elif [[ "$hib_swap" != "0" && "$hib_swap" != "-" && "$hib_off" != "-" && "$hib_off" != "0" ]]; then
    # 🟢 the healthy hibernate shape: file present, offset registered, swapoff'd
    echo "   │     ├─ swap    🟢 hibernate-reserved — /swap-hibinit $(hkb "$hib_swap"), resume offset ${hib_off} on ${hib_dev}"
    echo "   │     │          (idle by design; no paging cushion, so pressure ooms rather than thrashes)"
  elif [[ "$hib_swap" != "0" && "$hib_swap" != "-" ]]; then
    # the file exists and the kernel cannot resume from it — a real defect, and
    # the one a naive `swapon` check can never tell apart from the healthy case
    echo "   │     ├─ swap    🔴 /swap-hibinit $(hkb "$hib_swap") present but NO resume offset registered"
    echo "   │     │          hibernate will fail. see sandpine/infrastructure howto.tend-groves.md"
  else
    echo "   │     ├─ swap    🟡 none at all — no paging cushion AND no hibernate reserve"
  fi
  # ⚠️ an oom kill ENDS the pressure that caused it, so PSI can read calm moments
  #    after one fired. the count is the only witness that survives the event.
  # ⚠️ "since boot" is the denominator, and it is stated on purpose. a grove that
  #    rebooted an hour ago reports 0 kills, which is not the same claim as a
  #    grove that has run a fortnight without one.
  # ⚠️ THREE states, not two — an unread journal is not a quiet one. the middle
  #    state is the one a two-state arm cannot say, so it said 🟢 instead.
  # ⚠️ the earlyoom line is rendered from oom_esrc, never from oom_ekills alone.
  #    an unreadable earlyoom journal yields 0, and a 0 printed beside a measured
  #    kernel count reads as "the guard swung at no one" — a claim never made.
  # 🔴 .and it asks WHICH GUARD RUNS before it asks whether the journal read
  #
  #    this arm branched on `oom_esrc` alone — did the earlyoom journal read —
  #    and never asked whether there was an earlyoom to read about. so on a
  #    box with no userland guard it printed, one line under its own
  #    `guard: none`:
  #
  #      ? by earlyoom — its journal is unreadable here, so its TERMs are
  #      UNCOUNTED
  #
  #    if earlyoom does not run, it TERMed no one. that half is not unknown;
  #    it is exactly 0, and the kernel figure below is the WHOLE total.
  #
  # ⚠️ the harm INVERTS a partial audit. rather than a confident verdict that
  #    hides an omission, this is a FABRICATED omission that undermines a
  #    complete count — a reader sees `7 kill(s)` and is told the real number
  #    may be higher, permanently and unresolvably, so they discount a figure
  #    that is exact. measured 2026-09-17 on `local`.
  #
  # ⇒ `rule.require.enumerate-before-you-name`: one cause was named where
  #   `oom_guard` already takes THREE values, and they disagree about what
  #   the count MEANS. the discriminator was derived at the probe and printed
  #   on the header row one line above this one.
  __oom_eline() {
    if [[ "$oom_guard" == "earlyoom" ]]; then
      if [[ "$oom_esrc" == "journal" ]]; then
        echo "${oom_ekills} by earlyoom (SIGTERM — the clone exits 143, resumable)"
      else
        echo "? by earlyoom — its journal is unreadable here, so its TERMs are UNCOUNTED"
      fi
    elif [[ "$oom_guard" == "none" ]]; then
      echo "0 by userland — no oom guard runs here, so the kernel count below is the WHOLE total"
    else
      # a guard that is neither absent nor earlyoom — `systemd-oomd` today.
      # it DOES kill, and this arm reads earlyoom's journal alone, so it is a
      # real blind spot. name it as its own, never as earlyoom's.
      echo "? by ${oom_guard} — this arm reads earlyoom's journal alone, so ${oom_guard}'s kills are UNCOUNTED"
    fi
  }
  # .the kernel line names WHICH witness answered, because the two have different
  #  denominators: the journal counts kernel oom lines across the whole box, and the
  #  cgroup counts kills charged to `user.slice` — the AGGREGATE over every user
  #  slice, never one uid's. ⚠️ the two are never summed, and never compared.
  __oom_kline() {
    if [[ "$oom_ksrc" == "cgroup" ]]; then
      echo "${oom_kills} by the kernel (SIGKILL — the clone exits 137, gone) · via cgroup counter, every user slice on the box"
    else
      echo "${oom_kills} by the kernel (SIGKILL — the clone exits 137, gone)"
    fi
  }
  if [[ "$oom_seen" != "yes" ]]; then
    echo "   │     ├─ oom     ⚪ not measured — no witness readable on this box  ·  guard: ${oom_guard}"
    echo "   │     │          (a kill here is INVISIBLE to us, never absent — neither journal"
    echo "   │     │           reads, and no cgroup memory.events was found to fall back on)"
  elif [[ "${oom_any:-0}" -gt 0 ]] 2>/dev/null; then
    echo "   │     ├─ oom     🔴 ${oom_any} kill(s) in ${up_d} uptime  ·  guard: ${oom_guard}"
    echo "   │     │          ├─ $(__oom_eline)"
    echo "   │     │          └─ $(__oom_kline)"
  else
    echo "   │     ├─ oom     🟢 no kills in ${up_d} uptime  ·  guard: ${oom_guard}"
    # ⚠️ a proper `if`, never a trailing `[[ ]] && echo`. this is the LAST command
    #    of the branch, so a false test would make the whole `if` return 1 — and
    #    `set -euo pipefail` is live (line 67), so the report would abort here
    #    rather than degrade one arm. the same hazard the coercion above names.
    # 🔴 gated on the GUARD, same repair as __oom_eline above and for the same
    #    reason: on a box with `guard: none` this told a reader that a userland
    #    TERM might be hidden, where no userland guard exists to have sent one.
    #    ⇒ two sites carry this caveat and neither can be wrong, so both were
    #      owed the fix (`rule.require.a-cue-is-not-a-claim`).
    if [[ "$oom_guard" == "earlyoom" && "$oom_esrc" == "none" ]]; then
      echo "   │     │          (kernel half only — earlyoom's journal is unreadable, so a"
      echo "   │     │           userland TERM would not show here)"
    elif [[ "$oom_guard" != "none" && "$oom_guard" != "earlyoom" ]]; then
      echo "   │     │          (kernel half only — this arm reads earlyoom's journal alone,"
      echo "   │     │           so a TERM from ${oom_guard} would not show here)"
    fi
  fi
  echo "   │     ├─ stall   some ${mem_s60}% @60s   ·   full ${mem_f60}% @60s"
  echo "   │     └─ life    $(hsec "$mem_st") stalled over ${up_d} uptime  ·  $(lifeshare "$mem_st")% of its life  ·  full $(hsec "$mem_ft")"

  echo "   ├─ $v_disk disk   $(hkb "$disk_used") of $(hkb "$disk_total") used (${disk_pct}%)  ·  $(hkb "$disk_avail") free"
  echo "   │     ├─ stall   io some ${io_s60}% @60s   ·   full ${io_f60}% @60s  ·  iowait ${vm_wa}%"
  echo "   │     └─ life    $(hsec "$io_st") stalled over ${up_d} uptime  ·  $(lifeshare "$io_st")% of its life"

  procs=()
  while IFS= read -r p; do procs+=("$p"); done < <(awk -F= '$1=="proc"{print $2}' "$out")
  rolls=()
  while IFS= read -r r; do rolls+=("$r"); done < <(awk -F= '$1=="roll"{print $2}' "$out")
  greeds=()
  while IFS= read -r g; do greeds+=("$g"); done < <(awk -F= '$1=="greeds"{print $2}' "$out")

  if [[ ${#procs[@]} -eq 0 ]]; then
    echo "   ├─ top     (unreadable)"
  else
    echo "   ├─ top     hungriest by cpu"
    for i in "${!procs[@]}"; do
      [[ $i -eq $(( ${#procs[@]} - 1 )) ]] && gl="└─" || gl="├─"
      IFS='|' read -r pcpu pmem comm args <<< "${procs[$i]}"
      printf '   │     %s %-22s %5s%% cpu · %5s%% mem\n' "$gl" "$comm" "$pcpu" "$pmem"
      # the second line is what actually names the program — see the ps note above
      [[ -n "${args// /}" ]] && printf '   │     %s   %s\n' \
        "$([[ $gl == '└─' ]] && echo ' ' || echo '│')" "$args"
    done
  fi

  # 🔴 the roll-up is what parts a RUNAWAY from CONCURRENCY, and the remedies
  #    for those two disagree — see the ps note. n=1 at high cpu is a prune;
  #    n=many at high cpu is a fleet-size decision no prune can touch.
  # 🔴 an EMPTY roll-up has TWO causes, and this arm reported only one of them
  #
  #    `eats` is the one row of four that carries a FLOOR — its awk END emits a
  #    row only `if (cpu[k] >= 1)`. so on an idle box where the hungriest
  #    program holds 0.5%, every key falls under the floor and the array is
  #    empty even though the probe read the box perfectly. `top`, `greeds`, and
  #    `holds` carry no floor, which is why they render on that same box.
  #
  #    measured 2026-09-18 on grove-sandpine-v20260811, freshly woken and 100%
  #    idle. three rows rendered from the SAME ps output; this one said:
  #
  #      ├─ top     hungriest by cpu
  #      │     ├─ sshd        0.5% cpu ·   0.0% mem
  #      ├─ eats    (unreadable)      ← the probe had just answered, twice over
  #
  # ⚠️ the harm is a term=false-report, and it lands on the row this block's own
  #    note calls the discriminator between a runaway and mere concurrency. a
  #    reader told `unreadable` believes the hunt is unavailable on that box —
  #    when in truth the hunt RAN and returned `no program over 1%`, which is
  #    the strongest all-clear it can give.
  #
  # ⚠️ and it INVERTS the doctrine this same file states at the oom rows: there,
  #    an unread journal and a quiet one are byte-identical, so the render must
  #    refuse to claim either. here they are trivially told apart — a box that
  #    filled `procs` answered the probe — so the render owes the true one.
  #
  # 🔴 the gate is `procs`, never `rolls`. a probe that genuinely failed emits
  #    zero rows on EVERY axis, and that case must still read as unreadable; to
  #    rename this arm unconditionally would trade a false report for its
  #    mirror (rule.require.enumerate-before-you-name — two causes, two arms).
  if [[ ${#rolls[@]} -eq 0 && ${#procs[@]} -gt 0 ]]; then
    echo "   ├─ eats    no program over the 1% floor — the roll-up ran and found none"
    echo "   │          (a QUIET box, never a blind probe: 'top' above read the same"
    echo "   │           ps output. no runaway sits under a bound this low)"
  elif [[ ${#rolls[@]} -eq 0 ]]; then
    echo "   ├─ eats    (unreadable)"
  else
    echo "   ├─ eats    cpu by program — n = how many peers share the sum"
    for i in "${!rolls[@]}"; do
      gl="├─"
      IFS='|' read -r rcpu rcnt rkey <<< "${rolls[$i]}"
      printf '   │     %s %6.1f%% cpu · n=%-3s %s\n' "$gl" "$rcpu" "$rcnt" "$rkey"
    done
  fi

  # task #35: the ram peer of `eats` — same programs, ranked by what they
  # HOLD rather than by what they spend. answers "who is the ram driver?"
  # directly, which neither `top`, `eats`, nor the peer-count census below
  # does on their own axis.
  if [[ ${#greeds[@]} -eq 0 ]]; then
    echo "   ├─ greeds  (unreadable)"
  else
    echo "   ├─ greeds  ram by program — n = how many peers share the total"
    for i in "${!greeds[@]}"; do
      gl="├─"
      IFS='|' read -r grss gcnt gkey <<< "${greeds[$i]}"
      printf '   │     %s %8s  · n=%-3s %s\n' "$gl" "$(hkb "$grss")" "$gcnt" "$gkey"
    done
  fi

  # 🔴 the CENSUS — the read that `eats` cannot make, sorted by PEER COUNT
  #
  #    an idle process holds real memory and contributes ~zero cpu, so it is
  #    invisible above and material here. this row is where a HANDLE LEAK shows.
  #
  # ⚠️ read the `n` against the fleet's crew count. ~3 handles per pane is
  #    expected; a `tmux: client` count that exceeds the pane count is a leak,
  #    and it grows every sweep until a clone is culled to pay for it.
  cens=()
  while IFS= read -r c; do cens+=("$c"); done < <(awk -F= '$1=="cens"{print $2}' "$out")
  p_total=$(kv "$out" procs_total 0)
  p_zomb=$(kv  "$out" procs_zombie 0)
  p_dstat=$(kv "$out" procs_dstate 0)

  if [[ ${#cens[@]} -eq 0 ]]; then
    echo "   └─ holds   (unreadable)"
  else
    echo "   └─ holds   ${p_total} processes · ${p_dstat} in D (unsignalable) · ${p_zomb} zombie"
    echo "         by peer count — what sleeps is invisible to 'eats' above"
    for i in "${!cens[@]}"; do
      [[ $i -eq $(( ${#cens[@]} - 1 )) ]] && gl="└─" || gl="├─"
      IFS='|' read -r ccnt crss ckey <<< "${cens[$i]}"
      printf '         %s n=%-5s %8s  %s\n' "$gl" "$ccnt" "$(hkb "$crss")" "$ckey"
    done
  fi
  echo ""
done

if [[ "$FORMAT" == "tree" ]]; then
  echo "   🟢 headroom   🟡 tight   🔴 saturated   ⚪ not measured"
  echo "   stall = the share of time work WAITED on that resource (kernel PSI)."
  echo "   'some' = at least one task waited"
  # 🔴 the legend read "'full' = no work progressed at all" and that was WRONG in
  #    the way that matters: it states a THROUGHPUT claim, and `full` is a RATIO
  #    whose denominator excludes idle tasks.
  #
  #    the kernel's own definition: full = the share of time in which every
  #    NON-IDLE task was stalled. a task blocked on a network round trip is idle,
  #    so it leaves the denominator entirely.
  #
  #    ⇒ on a grove of clones that spend most of a turn blocked on an api call,
  #      the denominator is a handful of tasks. 18 clones awaiting the network and
  #      2 in reclaim reports `full 100%` — while 18 clones are perfectly fine and
  #      the fleet feels fast to a human.
  #
  #    measured 2026-09-07, grove-sandpine-v20260901: ram full 48.78% @60s, ~15
  #    clones, and the human reported the fleet "seems speedy still". BOTH were
  #    true. the number was honest; the gloss on it was not (`term=false-report`).
  echo "   'full'  = every NON-IDLE task stalled — a ratio, and idle tasks leave"
  echo "             the denominator. a clone awaiting the network counts as idle,"
  echo "             so a high 'full' can sit beside a fleet that feels fast."
  echo "             read it as CONTENTION AMONG THE RUNNABLE, never as throughput."
fi

# .why a NAMED grove that could not be read is an error, while the same grove
#      inside a sweep is not: you asked about that one box, and got no answer.
#      a sweep asked about the forest, and a sleeping member is part of the
#      answer (rule.forbid.failhide — do not report success on a question that
#      went unanswered).
[[ "$FAILED_NAMED" == "1" ]] && exit 1
exit 0
