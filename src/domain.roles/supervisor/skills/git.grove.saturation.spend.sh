#!/usr/bin/env bash
######################################################################
# .what = read where a grove's cpu SPEND went over a measured window —
#         split into work that is still ALIVE and churn that was born
#         and REAPED inside the window
#
# .why  = `git.grove.saturation` answers "does a task WAIT?" and every
#         render it carries is a `ps` sample — a GAUGE. measured on
#         grove-sandpine-v20260901 on 2026-09-13, over 10.6d uptime:
#
#           processes now dead  →  314 cpu-hours  →  🔴 91.4%
#           processes alive     →   29 cpu-hours  →      8.6%
#
#         ⇒ every instrument we had was blind to 91% of the spend. not
#           wrong — they answer "what runs NOW" where "what did this grove
#           SPEND" was asked (surgoal.squeeze-the-grove).
#
#         the sharpest single row: one `zsh` read 0% cpu in every sample
#         ever taken and had reaped 16.7 cpu-hours of dead children. it
#         looks idle because it IS idle. its FORKS are the cost.
#
# .why a COUNTER, never a faster sample
#      a 200ms fork is invisible to a gauge at ANY poll rate. a counter is
#      monotonic since boot, so a delta across two reads holds every
#      process born and died between them — complete coverage, 2 forks.
#      ⇒ the fix is the INSTRUMENT, never the rate.
#
# ⚠️ .a sampler IS a saturator — which is why this reads /proc in ONE call
#      a per-process census over ~640 procs × 60 samples costs ~38,600
#      forks; a counter delta costs 2. measured self-inflicted on
#      2026-09-13: a probe written to find a fork storm forked 38,600 times
#      to look for it. `grep -h "" /proc/[0-9]*/stat` reads every file in
#      one process AND survives a pid that vanishes mid-glob; a
#      `for f … do cat` loop costs one fork per process and aborts awk.
#
# usage:
#   rhx git.grove.saturation.spend                       # every grove, 10s window
#   rhx git.grove.saturation.spend <grove>               # just the one
#   rhx git.grove.saturation.spend local                 # this box — it runs crews too
#   rhx git.grove.saturation.spend --window 30           # a longer window
#   rhx git.grove.saturation.spend --since-boot          # cumulative, no window
#   rhx git.grove.saturation.spend --top 20              # more rows
#   rhx git.grove.saturation.spend --json                # records, for a machine
#
# args:
#   <grove>        a registered grove name, bare or `cloud://<name>`, or `local`
#   --only         the same, as a named flag
#   --grove        an alias for --only, because that is the word every peer
#                  crew verb uses for this same concept
#   --window       seconds to measure (default: 10)
#   --since-boot   rank REAPERS by cumulative dead-child cpu; no window
#   --top          rows per table (default: 12)
#   --json         emit key=value records rather than the tree
#   --timeout      seconds to wait per grove (default: window + 20)
#   --help,-h      usage
#
# .why TWO modes, and when each is the right one
#   --window     "what spends the cpu RIGHT NOW" — a rate. answers a live
#                stall, and it is a sample of ONE window
#   --since-boot "what has this grove spent over its LIFE" — a total.
#                immune to a badly-chosen window by construction, and it
#                cannot tell you what changed in the last minute
#
# 🔴 .ONE window does not rank a lever
#      rule.always.re-measure-a-lever-before-you-rank-it: a single window
#      over-ranks a burst, under-ranks a periodic job, and — worst — yields
#      an accurate numerator over a POLLUTED denominator when a storm runs.
#      report one window AS one window. to rank, run it twice in different
#      conditions, or cross-check with --since-boot.
#
# guarantee:
#   - READ-ONLY on every grove; never wakes one, never writes, never installs
#   - ~2 forks per snapshot, whatever the process count
#   - an unreachable grove is REPORTED, never allowed to abort the sweep
#   - exit 0 = read · exit 1 = a grove you NAMED could not be read
#   - exit 2 = constraint (no registry, unknown grove, bad flag)
######################################################################
set -euo pipefail

ONLY=""
FORMAT="tree"
WINDOW=10
TOP=12
MODE="window"
TIMEOUT=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    # ⚠️ --grove is the word EVERY peer verb uses for this concept
    #    (git.crew.poll --grove, git.crew.read --grove, git.crew.send --grove).
    #    this skill was born with --only, so one concept carried two words
    #    across one family (rule.forbid.domain-term-inconsistency) — measured
    #    2026-09-19, when a supervisor mid-tick typed --grove, got exit 2, and
    #    spent a round on it. --only stays canonical here for its own callers;
    #    --grove is accepted so the family reads as one.
    --only|--grove) ONLY="$2"; shift 2 ;;
    --window) WINDOW="$2"; shift 2 ;;
    --top) TOP="$2"; shift 2 ;;
    --since-boot) MODE="boot"; shift ;;
    --json) FORMAT="json"; shift ;;
    --timeout) TIMEOUT="$2"; shift 2 ;;
    --skill|--repo|--role) shift 2 ;;
    --) shift ;;
    -h|--help)
      echo "🌲 git.grove.saturation.spend — where a grove's cpu went, live vs reaped"
      echo ""
      echo "  usage:"
      echo "    rhx git.grove.saturation.spend                    # every grove, 10s window"
      echo "    rhx git.grove.saturation.spend <grove>            # just the one"
      echo "    rhx git.grove.saturation.spend local              # this box — it runs crews too"
      echo "    rhx git.grove.saturation.spend --window 30        # a longer window"
      echo "    rhx git.grove.saturation.spend --since-boot       # cumulative reapers, no window"
      echo "    rhx git.grove.saturation.spend --top 20           # more rows"
      echo "    rhx git.grove.saturation.spend --json             # records, for a machine"
      echo ""
      echo "  reads: /proc/<pid>/stat counters · /proc/stat forks + ctxt · /proc/uptime"
      echo "  splits: 🟢 LIVE  work still alive  ·  🔴 REAPED  children reaped in-window"
      echo "      ⚠️  REAPED constrains DEATH, never birth — cutime carries the whole"
      echo "          lifetime of a child. over 100% is normal, and is NOT a fork storm."
      echo ""
      echo "  ⚠️  a gauge (ps, top, free) is blind to ~91% of a grove's spend."
      echo "      measured 2026-09-13: 314 of 343 cpu-hours went to dead processes."
      echo "  🔴  ONE window does not rank a lever — run it twice, or cross-check"
      echo "      with --since-boot (rule.always.re-measure-a-lever-before-you-rank-it)"
      echo ""
      echo "  list groves: rhx git.grove.list  (local has no row there, and is read anyway)"
      exit 0 ;;

    # ⚠️ FAIL LOUD — never `shift` an unknown flag away (rule.forbid.failhide).
    -*) echo "✋ git.grove.saturation.spend: unknown flag '$1'" >&2
        echo "   known: --only|--grove --window --since-boot --top --json --timeout --help" >&2
        exit 2 ;;
    *) [[ -z "$ONLY" ]] && ONLY="$1"; shift ;;
  esac
done

[[ "$WINDOW" =~ ^[0-9]+$ ]] || { echo "✋ git.grove.saturation.spend: --window must be an integer, got '$WINDOW'" >&2; exit 2; }
[[ "$TOP" =~ ^[0-9]+$ ]]    || { echo "✋ git.grove.saturation.spend: --top must be an integer, got '$TOP'" >&2; exit 2; }
[[ -n "$TIMEOUT" ]] || TIMEOUT=$(( WINDOW + 20 ))

GROVES_DIR="${GIT_FOREST_DIR:-$HOME/.git.forest}/groves"
if [[ ! -d "$GROVES_DIR" ]]; then
  echo "🐢 bummer dude — no forest registry at $GROVES_DIR" >&2
  echo "" >&2
  echo "  fix: see what is registered —" >&2
  echo "    rhx git.grove.list" >&2
  exit 2
fi

######################################################################
# 🔴 a `cloud://` prefix is a FORM, never a different grove
#
# .why  every crew verb addresses a grove as `cloud://<name>` (or `local`),
#       so a supervisor arrives here with that uri already in hand. this
#       skill keyed on the bare registry filename, so the uri form fell
#       through to "grove '...' is not registered" — which is FALSE: the
#       grove is registered, and the URI is what could not be parsed.
#
# ⚠️ that is a term=false-report: a true claim about its own lookup,
#    rendered as a verdict about the world. a reader acts on it by a
#    hunt for a registry defect that does not exist.
#
#    measured 2026-09-19, mid-tick, after the --grove miss above — two
#    rounds lost on one call.
######################################################################
ONLY="${ONLY#cloud://}"

ENTRIES=()
if [[ "$ONLY" == "local" ]]; then
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

######################################################################
# fold the registry ENTRIES onto the GROVES they name
#
# .why  the forest registers one row per LOGIN, so `grove-x` (camper) and
#       `grove-x.ground` (ground) are two users at ONE host:port. spend is a
#       property of the grove, never of the login — a probe per entry would
#       ssh twice and print one grove's cpu twice, which a reader would tally
#       as two groves (term=false-report).
#
# ⚠️ the key is host:port, never the NAME.
######################################################################
declare -A GROVE_ENTRIES=()
declare -A GROVE_PROBER=()
GROVES=()

for e in "${ENTRIES[@]:-}"; do
  [[ -n "$e" ]] || continue
  key=$(jq -r '"\(.host // "?"):\(.port // "?")"' "$GROVES_DIR/$e.json")
  if [[ -z "${GROVE_ENTRIES[$key]:-}" ]]; then
    GROVES+=("$key"); GROVE_PROBER[$key]="$e"; GROVE_ENTRIES[$key]="$e"
  else
    GROVE_ENTRIES[$key]="${GROVE_ENTRIES[$key]} $e"
  fi
done

# 🔴 LOCAL is a grove. the forest registers a row per REMOTE login, so the
#    fan-out above never visits the box the SUPERVISOR ITSELF runs on — the one
#    box whose stall would hide the whole fleet (term=partial-audit).
if [[ -z "$ONLY" || "$ONLY" == "local" ]]; then
  GROVES+=("local"); GROVE_PROBER["local"]="local"; GROVE_ENTRIES["local"]="local"
fi

######################################################################
# the remote probe — emit FACTS, render locally
#
# ⚠️ quoted heredoc: the awk programs hold `$1`/`$2` the LOCAL shell must
#    never expand. it is passed to ssh as one argv, run by the GROVE's shell.
######################################################################
PROBE=$(cat <<REMOTE
set -u
W=$WINDOW
MODE=$MODE
REMOTE
)
PROBE="$PROBE"$(cat <<'REMOTE'

echo "host=$(hostname 2>/dev/null || echo '?')"
echo "ncpu=$(nproc 2>/dev/null || echo 1)"
echo "uptime_s=$(cut -d' ' -f1 /proc/uptime 2>/dev/null || echo 0)"
echo "mode=$MODE"
echo "window_s=$W"

# ⚠️ the field map. /proc/<pid>/stat holds `comm` in parens and a comm MAY
#    hold spaces AND parens (`tmux: server`, `(sd-pam)`), so the split is
#    anchored on the LAST `)`, never on whitespace. after it, f[1]=state, so
#    original field N is f[N-2]:
#       utime=f[12] stime=f[13] cutime=f[14] cstime=f[15] starttime=f[20]
#
#    🔴 and the emitted record is TAB-separated for the same reason. measured
#       2026-09-13: a default whitespace split shifted every column after a
#       comm with a space and reported `tmux: 100.0%` of ram.
snap() {
  grep -h "" /proc/[0-9]*/stat 2>/dev/null | awk '
    { i = index($0, "("); j = 0
      for (k = length($0); k > i; k--) if (substr($0, k, 1) == ")") { j = k; break }
      if (j == 0) next
      split(substr($0, j + 2), f, " ")
      printf "%s\t%s\t%d\t%d\t%d\n",
        substr($0, 1, i - 2), substr($0, i + 1, j - i - 1),
        f[12] + f[13], f[14] + f[15], f[20] }'
}

if [ "$MODE" = "boot" ]; then
  # cumulative — every figure is since boot, so no window is chosen and none
  # can be chosen badly. the ALIVE/DEAD split is the headline.
  snap | awk -F'\t' '
    { c = $2; OWN[c] += $3; KID[c] += $4; N[c]++; town += $3; tkid += $4 }
    END {
      printf "total_own_ticks=%d\n", town
      printf "total_kid_ticks=%d\n", tkid
      for (c in OWN)
        printf "reaper\t%s\t%d\t%d\t%d\n", c, OWN[c], KID[c], N[c] }'
  awk '/^processes /{print "forks_total="$2} /^ctxt /{print "ctxt_total="$2}' /proc/stat
  exit 0
fi

T0=$(cut -d' ' -f1 /proc/uptime); snap > "${TMPDIR:-/tmp}/.spend1.$$"
F0=$(awk '/^processes /{print $2}' /proc/stat)
C0=$(awk '/^ctxt /{print $2}' /proc/stat)
sleep "$W"
T1=$(cut -d' ' -f1 /proc/uptime); snap > "${TMPDIR:-/tmp}/.spend2.$$"
F1=$(awk '/^processes /{print $2}' /proc/stat)
C1=$(awk '/^ctxt /{print $2}' /proc/stat)

echo "t_elapsed=$(awk -v a="$T0" -v b="$T1" 'BEGIN{printf "%.2f", b-a}')"
echo "forks_delta=$(( F1 - F0 ))"
echo "ctxt_delta=$(( C1 - C0 ))"

# 🔴 a pid ABSENT from the baseline is two different things, and they must not
#    be conflated:
#      born in-window   → its whole utime IS the window's cost. count it all
#      a read RACE      → it was alive at T0 and the glob missed it. count 0
#    starttime (ticks since boot) settles which. to count a long-lived
#    process's whole lifetime as one window's spend is how a probe reports
#    183152% — measured, 2026-09-13.
awk -F'\t' -v t0="$T0" '
  BEGIN { born_after = t0 * 100 }
  NR == FNR { own[$1] = $3; kid[$1] = $4; next }
  {
    if ($1 in own) { dO = $3 - own[$1]; dK = $4 - kid[$1] }
    else if ($5 >= born_after) { dO = $3; dK = $4 }     # genuinely new
    else { next }                                       # read race — skip
    if (dO < 0) dO = 0                                  # pid reuse
    if (dK < 0) dK = 0                                  # cutime rolls up on exit
    c = $2
    LIVE[c] += dO; REAP[c] += dK; N[c]++
  }
  END { for (c in LIVE) printf "cluster\t%s\t%d\t%d\t%d\n", c, LIVE[c], REAP[c], N[c] }
' "${TMPDIR:-/tmp}/.spend1.$$" "${TMPDIR:-/tmp}/.spend2.$$"

rm -f "${TMPDIR:-/tmp}/.spend1.$$" "${TMPDIR:-/tmp}/.spend2.$$"
REMOTE
)

WORK=$(mktemp -d); trap 'rm -rf "$WORK"' EXIT
PIDS=(); FAILED=0

######################################################################
# read every grove in PARALLEL, each under its own timeout
#
# .why a grove hibernates when idle, so a read of a hibernated box blocks
#      until tcp gives up — minutes. read serially, ONE such grove freezes the
#      sweep and the healthy ones never print.
######################################################################
for key in "${GROVES[@]}"; do
  (
    rc=0
    e="${GROVE_PROBER[$key]}"
    slug="${key//[^a-zA-Z0-9]/_}"
    if [[ "$key" == "local" ]]; then
      timeout "$TIMEOUT" bash -c "$PROBE" > "$WORK/$slug.out" 2> "$WORK/$slug.err" || rc=$?
    else
      alias=$(jq -r '.sshAlias // .name' "$GROVES_DIR/$e.json")
      timeout "$TIMEOUT" ssh -n \
        -o BatchMode=yes -o ConnectTimeout=8 -o StrictHostKeyChecking=accept-new \
        "$alias" "$PROBE" > "$WORK/$slug.out" 2> "$WORK/$slug.err" || rc=$?
    fi
    echo "$rc" > "$WORK/$slug.rc"
  ) &
  PIDS+=($!)
done
for p in "${PIDS[@]}"; do wait "$p" || true; done

[[ "$FORMAT" == "tree" ]] && { echo "🌲 grove spend — where the cpu went"; echo ""; }

for key in "${GROVES[@]}"; do
  slug="${key//[^a-zA-Z0-9]/_}"
  rc=$(cat "$WORK/$slug.rc" 2>/dev/null || echo 1)
  names="${GROVE_ENTRIES[$key]}"

  if [[ "$rc" != "0" ]]; then
    [[ -n "$ONLY" ]] && FAILED=1
    if [[ "$FORMAT" == "json" ]]; then
      echo "grove=$names state=unread rc=$rc"
    else
      hint="wake it: rhx git.grove.wake ${GROVE_PROBER[$key]}"
      [[ "$rc" == "124" ]] && state="💤 asleep (timeout ${TIMEOUT}s)" || state="💥 unread (rc=$rc)"
      echo "   🌳 $names"
      echo "      └─ $state"
      echo "         └─ $hint"
      echo ""
    fi
    continue
  fi

  out="$WORK/$slug.out"
  host=$(awk -F= '/^host=/{print $2}' "$out")
  ncpu=$(awk -F= '/^ncpu=/{print $2}' "$out")
  up=$(awk -F= '/^uptime_s=/{print $2}' "$out")

  if [[ "$FORMAT" == "json" ]]; then
    sed "s/^/grove=$names /" "$out"
    continue
  fi

  if [[ "$MODE" == "boot" ]]; then
    town=$(awk -F= '/^total_own_ticks=/{print $2}' "$out")
    tkid=$(awk -F= '/^total_kid_ticks=/{print $2}' "$out")
    echo "   🌳 $names  ($host · ${ncpu} cores · up $(awk -v s="$up" 'BEGIN{printf "%.1fd", s/86400}'))"
    awk -v town="$town" -v tkid="$tkid" '
      BEGIN {
        tot = town + tkid
        printf "      ├─ 🔴 reaped (now dead)  %8.1f cpu-h   %5.1f%%\n", tkid/360000, tot ? 100*tkid/tot : 0
        printf "      ├─ 🟢 alive              %8.1f cpu-h   %5.1f%%\n", town/360000, tot ? 100*town/tot : 0
        printf "      │\n      ├─ top reapers — dead-child cpu, charged to a LIVE parent\n"
      }' /dev/null
    awk -F'\t' -v top="$TOP" -v tot="$(( town + tkid ))" '
      $1 == "reaper" { C[$2] = $4; O[$2] = $3; N[$2] = $5 }
      END {
        n = 0
        for (c in C) { rows[++n] = c }
        for (i = 1; i < n; i++) for (j = i+1; j <= n; j++)
          if (C[rows[j]] > C[rows[i]]) { t = rows[i]; rows[i] = rows[j]; rows[j] = t }
        lim = (n < top) ? n : top
        for (i = 1; i <= lim; i++) {
          c = rows[i]
          if (C[c] == 0) break
          printf "      │  %-22.22s %8.1f cpu-h  %5.1f%%  (n=%d, own %.1fh)\n",
                 c, C[c]/360000, tot ? 100*C[c]/tot : 0, N[c], O[c]/360000
        }
      }' "$out"
    fk=$(awk -F= '/^forks_total=/{print $2}' "$out")
    awk -v f="$fk" -v s="$up" 'BEGIN{ printf "      └─ %d forks since boot  =  %.1f/s mean\n", f, s ? f/s : 0 }' /dev/null
    echo ""
    continue
  fi

  el=$(awk -F= '/^t_elapsed=/{print $2}' "$out")
  fd=$(awk -F= '/^forks_delta=/{print $2}' "$out")
  cx=$(awk -F= '/^ctxt_delta=/{print $2}' "$out")
  echo "   🌳 $names  ($host · ${ncpu} cores · ${el}s window)"
  awk -v el="$el" -v fd="$fd" -v cx="$cx" 'BEGIN{
    printf "      ├─ %.0f forks/s · %.0f ctxt-switch/s\n", el ? fd/el : 0, el ? cx/el : 0 }' /dev/null

  # capacity in ticks = elapsed_seconds × cores × 100
  #
  # 🔴 the REAPED row measures DEATH in-window, never BIRTH. it read
  #    `(born AND died in-window)` until 2026-09-19, and that label is false on
  #    its first half: dK is a cutime+cstime delta on a LIVE parent, and cutime
  #    accrues the whole lifetime of a child at the moment it is reaped — as
  #    line 270 already says in its own comment. so a child alive for an hour
  #    that dies inside a 30s window lands its FULL hour in that window.
  #
  # ⚠️ the harm is the supervisor's next move. measured 2026-09-19 on
  #    grove-sandpine-v20260901: `claude  live 7.2%  reaped 245.0%  (n=23)`. under
  #    the old label a reader concludes one of two wrong things — that a storm of
  #    short-lived processes ate 2.5 cores, or that the tool is broken because a
  #    share cannot exceed 100%. the true account is 23 clones that each reaped
  #    long-lived children, and NEITHER a prune nor a fell is owed.
  #    ⇒ a fork storm is a claim about RATE, so it is settled by forks/s alone.
  awk -F'\t' -v top="$TOP" -v el="$el" -v n="$ncpu" '
    $1 == "cluster" { L[$2] = $3; R[$2] = $4; P[$2] = $5; tl += $3; tr += $4 }
    END {
      cap = el * n * 100
      printf "      ├─ 🟢 live    %6.1f%% of the box   (work still alive)\n", cap ? 100*tl/cap : 0
      printf "      ├─ 🔴 reaped  %6.1f%% of the box   (children reaped in-window — WHOLE lifetime)\n", cap ? 100*tr/cap : 0
      printf "      │     ⚠️ birth is UNCONSTRAINED — cutime rolls the whole lifetime of a child\n"
      printf "      │        into its parent at the moment it is reaped. so over 100%% is NORMAL\n"
      printf "      │        here, and is NOT a fork storm. the storm term is forks/s, never this\n"
      printf "      │\n      ├─ by cluster, ranked on live+reaped\n"
      m = 0
      for (c in L) { if (!(c in seen)) { seen[c]=1; rows[++m]=c } }
      for (c in R) { if (!(c in seen)) { seen[c]=1; rows[++m]=c } }
      for (i = 1; i < m; i++) for (j = i+1; j <= m; j++)
        if (L[rows[j]]+R[rows[j]] > L[rows[i]]+R[rows[i]]) { t=rows[i]; rows[i]=rows[j]; rows[j]=t }
      lim = (m < top) ? m : top
      for (i = 1; i <= lim; i++) {
        c = rows[i]
        if (L[c] + R[c] == 0) break
        printf "      │  %-22.22s  live %6.1f%%  reaped %6.1f%%  (n=%d)\n",
               c, cap ? 100*L[c]/cap : 0, cap ? 100*R[c]/cap : 0, P[c]
      }
      printf "      └─ 🔴 ONE window does not rank a lever — run it twice, or\n"
      printf "         cross-check: rhx git.grove.saturation.spend --since-boot\n"
    }' "$out"
  echo ""
done

exit "$FAILED"
