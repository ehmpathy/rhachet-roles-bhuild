#!/usr/bin/env bash
######################################################################
# .what = kill RUNAWAY processes of one name on a grove — TERM, then KILL
#
# .why  = a grove is a shared, finite machine, and a runaway process on it
#         degrades EVERY crew there, not merely the one that spawned it
#         (rule.require.bound-grove-concurrency-by-saturation). so the reaper
#         belongs at the grove layer, where the shared resource lives.
#
#         measured 2026-09-07 on `grove-sandpine-v20260901`, 4 cpu · 31G ram:
#         eleven `nvim` processes held ~6.2G ram and ~43% cpu between them.
#         at the same instant the grove read `runq 35` on 4 cores with
#         `idle 0%` and `cpu some 98.87% @10s` — an all-time high, and the
#         human's report was simply "the machine is defo sluggish now".
#
# 🔴 .why a CPU_OVER rather than a blanket kill
#         `--where-cpu-over` is a cpu-percent floor: a process under it is left alone.
#         that is what parts a PRUNE from a purge — the word means to cut back
#         overgrowth so the rest thrives, never to clear the ground.
#
#         it matters because the same binary appears in both states at once.
#         in the measured case the eleven `nvim` ranged from 19.7% cpu down to
#         0.0% — the top three were the sluggishness and the bottom five were
#         idle editors somebody left open. a blanket kill takes a human's open
#         buffers to solve a problem three processes caused.
#
#      ⇒ `--where-cpu-over 100` on a 4-core grove means "over one whole core",
#        which is a defensible read of runaway. `--where-cpu-over 0` takes every
#        match and is a purge; it is spelled out rather than defaulted to.
#
#      ⚠️ the flag was first named `--limit`, and that was AMBIGUOUS — it reads as
#        "kill at most N", a count cap, which is the opposite kind of quantity.
#        the human read it exactly that way on first sight, and asked why two
#        processes were spared under `--limit 100` (rule.forbid.ambiguous-labels).
#        `--where-cpu-over` names the predicate it actually is.
#
# 🔴 .why TWO PHASES, and why the GRACE is generous
#         of those eleven, `pkill -TERM` cleared six within the second. five were
#         still listed — among them the two heaviest, at 19.5% and 9.9% cpu.
#
#      ⚠️ **and then three of those five exited on their own, minutes later, with
#         no second signal.** they were never deaf to TERM; they were SLOW to
#         reach it. on a grove at `runq 35` a process may wait minutes to be
#         scheduled at all, and nvim's TERM handler writes its swap files to disk
#         before it returns.
#
#         ⇒ so a short grace does not measure defiance, it measures LOAD — and it
#           converts a slow clean exit into a SIGKILL, which is the lost-buffer
#           outcome TERM was sent to avoid. the more saturated the grove, the more
#           likely the escalation fires on a process already on its way out.
#           **the instrument would be most destructive exactly when most needed.**
#
#         ⇒ hence `--grace 60` by default, and the render names how long each
#           phase took, so a caller can judge whether the escalation was earned.
#
#         the verify is what makes either phase honest: `kill` reports whether a
#         signal was SENT, never whether a process DIED (term=false-report), so
#         the survivor set is read from `ps` and never inferred.
#
#         TERM first is not ceremony — nvim writes its swap files on TERM and
#         loses them on KILL, so the order is what parts a clean shutdown from
#         lost buffers.
#
# usage:
#   rhx git.grove.prune <grove>                                  # plan, all matches
#   rhx git.grove.prune <grove> --process nvim --where-cpu-over 100 --mode apply
#   rhx git.grove.prune <grove> --process node --where-cpu-over 50 --mode apply
#   rhx git.grove.prune local --process nvim --mode apply        # this machine, no ssh
#   rhx git.grove.prune local --process continuum_save.sh --where-cpu-over 0 --mode apply
#                                                                 # interpreter-hosted file,
#                                                                 # matched by path, not comm
#
# 🔴 .why `local` is a SENTINEL, not a registry lookup
#      this machine is a shared resource too — the supervisor's own box runs
#      crews beside a human's editors and shells, and a runaway there degrades
#      both exactly as a runaway grove does. every prior line here read a
#      process through `ssh -n "$SSH_ALIAS"`, so a caller who typed `local`
#      hit "grove 'local' is not registered" — a real gap found the moment a
#      human asked to prune their own sluggish machine.
#
#      the fix is additive: `local` skips the registry lookup and the ssh
#      hop, and every remote call runs through `bash -c` instead, via one
#      `__exec` seam. no remote-grove behavior moves.
#
# args:
#   <grove>     the grove's registered name (see: rhx git.grove.list), or
#               the literal word `local` for this machine — no ssh, no registry
#   --process   process name to prune; default `nvim`
#   --where-cpu-over     cpu% floor — under it, a process is left alone; default 0 (all)
#   --mode      plan (default) | apply
#   --grace     seconds to await a clean TERM exit; default 5
#
# ⚠️ .the REFUSAL list is the guardrail, and it is not advisory
#      `--process claude` would fell the entire fleet's clones in one call,
#      with no crew record touched and no route stone moved — every duct would
#      go `husk` at once, each conceals whatever gate its clone had parked at
#      (term=duct.pane.husk). `--process tmux` would take every duct on the box.
#      neither is a prune; both are a fleet-wide outage typed as one word.
#
#   ⇒ a clone is ended through the CREW layer, which owns its record:
#     `rhx git.crew.stop --tree <tree>` · `rhx git.crew.fell --tree <tree>`.
#     this skill refuses those names by construction rather than by a caution.
#
# guarantee:
#   - plan is the default; a kill needs `--mode apply` typed on purpose
#   - a process under --where-cpu-over is never signalled, in either phase
#   - the survivor set is READ back, never inferred from pkill's exit code
#   - refuses to prune a clone, a duct, or the box's own daemons
#   - exit 0 = pruned or naught to prune, 1 = malfunction, 2 = constraint
######################################################################
set -euo pipefail

GROVE=""
PROCESS="nvim"
CPU_OVER=0
MODE="plan"
# .why 60 and not 5: measured 2026-09-07 — three nvim that "ignored" TERM at 5s
#      exited on their own minutes later, unsignalled. a short grace measures the
#      grove's load, never the process's defiance, and escalates over the
#      difference. see the two-phase note in the header.
GRACE=60

# .why these names are refused rather than cautioned about: each one is a
#      fleet-wide outage in the shape of a single word, and a caution is
#      answered by whoever is in a hurry (rule.require.safe-by-default).
REFUSED=(claude node-pty tmux sshd systemd ssm-agent ssm-session-worker amazon-ssm-agent init)

while [[ $# -gt 0 ]]; do
  case "$1" in
    --process) PROCESS="$2"; shift 2 ;;
    --where-cpu-over)   CPU_OVER="$2"; shift 2 ;;
    --mode)    MODE="$2"; shift 2 ;;
    --grace)   GRACE="$2"; shift 2 ;;
    --skill|--repo|--role) shift 2 ;;
    --) shift; [[ -z "$GROVE" ]] && { GROVE="${1:-}"; shift 2>/dev/null || true; } ;;
    -h|--help)
      echo "🌳 git.grove.prune — kill runaway processes of one name on a grove"
      echo ""
      echo "  usage:"
      echo "    rhx git.grove.prune <grove>                       # plan, all matches"
      echo "    rhx git.grove.prune <grove> --process nvim --where-cpu-over 100 --mode apply"
      echo "    rhx git.grove.prune local --process nvim --mode apply   # this machine"
      echo "    rhx git.grove.prune local --process continuum_save.sh --where-cpu-over 0 --mode apply"
      echo "                                                             # interpreter-hosted file"
      echo ""
      echo "  args:"
      echo "    <grove>     registered grove name, or the literal 'local' for this machine"
      echo "    --process   process name to prune; default 'nvim'"
      echo "    --where-cpu-over     cpu% floor — under it, a process is left alone; default 0 (all)"
      echo "    --mode      plan (default) | apply"
      echo "    --grace     seconds to await a clean TERM exit; default 60"
      echo "                ⚠️ on a loaded grove a clean exit can take minutes —"
      echo "                   a short grace escalates over LOAD, never defiance"
      echo ""
      echo "  ⚠️ refuses: ${REFUSED[*]}"
      echo "     a clone is ended through the crew layer, which owns its record:"
      echo "       rhx git.crew.stop --tree <tree>"
      echo ""
      echo "  list groves: rhx git.grove.list"
      exit 0 ;;

    # ⚠️ FAIL LOUD — never `shift` an unknown flag away (rule.forbid.failhide).
    -*) echo "✋ git.grove.prune: unknown flag '$1'" >&2
        echo "   known: --process --where-cpu-over --mode --grace --help" >&2
        exit 2 ;;
    *) [[ -z "$GROVE" ]] && GROVE="$1"; shift ;;
  esac
done

if [[ -z "$GROVE" ]]; then
  echo "✋ usage: rhx git.grove.prune <grove> [--process nvim] [--where-cpu-over 100] [--mode apply]" >&2
  echo "   list them: rhx git.grove.list" >&2
  exit 2
fi

######################################################################
# 🔴 a `cloud://` prefix is a FORM, never a different grove
#
# .why  `git.grove.keyrack` and `git.grove.auth` both strip it already, for
#       the same reason — a caller arrives who holds the uri every crew verb
#       takes. prune did not, so `prune cloud://<name>` fell through to the
#       "is not registered" branch below, which is a term=false-report: a true
#       claim about this filename lookup, stated as a verdict about the world.
#
# 🔴 and prune meets that caller at the WORST moment. the babysit tick names
#    this verb by name for a 🔴 cpu box with a full run queue, where the whole
#    point is to spare real work a fell would destroy. a false "not registered"
#    there reads as a broken registry and sends the supervisor to the fell.
#
#    cured 2026-09-19, adjacent to the same defect measured in
#    git.grove.saturation.spend the same tick.
######################################################################
GROVE="${GROVE#cloud://}"

if [[ "$MODE" != "plan" && "$MODE" != "apply" ]]; then
  echo "✋ --mode takes 'plan' or 'apply', got '$MODE'" >&2
  exit 2
fi

if ! awk -v l="$CPU_OVER" 'BEGIN{exit !(l ~ /^[0-9]+(\.[0-9]+)?$/)}'; then
  echo "✋ --where-cpu-over takes a cpu percent, got '$CPU_OVER'" >&2
  exit 2
fi

# the refusal, checked before the grove is even reached — a caller who typed
# `--process claude` is owed the correct lever, not a connection error first
for refused in "${REFUSED[@]}"; do
  if [[ "$PROCESS" == "$refused" ]]; then
    echo "🛑 refused: '$PROCESS' is not prunable at the grove layer" >&2
    echo "" >&2
    echo "   .why  a prune has no crew record and moves no route stone, so every" >&2
    echo "         duct it hit would go husk at once — each conceals whatever" >&2
    echo "         gate its clone had parked at (term=duct.pane.husk)" >&2
    echo "" >&2
    echo "   fix: end a clone through the layer that owns its record —" >&2
    echo "     rhx git.crew.stop --tree <tree>     # ends the WORK" >&2
    echo "     rhx git.crew.fell --tree <tree>     # ends the CREW, tree and all" >&2
    exit 2
  fi
done

# `local` is a sentinel, never a registry lookup — this machine has no
# ~/.git.forest entry and needs none; every remote call below runs through
# `bash -c` instead of `ssh -n "$SSH_ALIAS"` via the __exec seam
LOCAL=0
SSH_ALIAS=""
if [[ "$GROVE" == "local" ]]; then
  LOCAL=1
else
  # the grove must be REGISTERED — the ssh alias is written by a wake, so a
  # name absent from the forest has no alias and ssh would fall through to dns
  REGISTRY="${GIT_FOREST_DIR:-$HOME/.git.forest}/groves/$GROVE.json"
  if [[ ! -f "$REGISTRY" ]]; then
    echo "🐢 bummer dude — grove '$GROVE' is not registered" >&2
    echo "" >&2
    echo "  fix: see what is — rhx git.grove.list" >&2
    echo "  or, to prune THIS machine: rhx git.grove.prune local --process $PROCESS" >&2
    exit 2
  fi
  SSH_ALIAS=$(jq -r '.sshAlias // .name' "$REGISTRY")
fi

# .what = run a command on the chosen grove — ssh for a remote one, bash -c
#         for `local` — so every call site below names ONE seam rather than
#         branch on $LOCAL itself
__exec() {
  if [[ "$LOCAL" == "1" ]]; then
    bash -c "$1"
  else
    ssh -n "$SSH_ALIAS" "$1"
  fi
}

# .why an exact match on `comm` ($6) rather than a grep of the whole ps line:
#      a grep for "nvim" also matches this very ps command, every shell whose
#      history holds the word, and any unrelated process whose args cite a path
#      with `nvim` in it. `comm` is the executable's own name, so the match is
#      the process rather than a mention of it.
#
# 🔴 a FILE run under an interpreter has no comm of its own — `comm` reads
#    "bash"/"python"/"node", never the file's own name, so `--process
#    continuum_save.sh` matched NAUGHT while `--process bash` would have
#    matched every bash on the box: 138 interactive shells and every other
#    bash-run file this machine hosts, alongside the one pile that mattered.
#
#    measured 2026-09-13: 119 `bash continuum_save.sh` + 4 `bash
#    check_tmux_version.sh` at 787%+143% cpu, invisible to a comm-only match.
#
#    ⇒ so a SECOND test joins the comm test: the full line contains
#      "/$PROCESS" — a path-shaped mention, which a real invocation carries
#      (`bash /home/…/plugins/tmux-continuum/scripts/continuum_save.sh`) and
#      this very pipeline does not (the awk program embeds the bare word,
#      never a `/`-prefixed one). that asymmetry is what keeps the second
#      test from matching itself — the self-match hazard a bare substring
#      grep would have reintroduced.
#
# 🔴 `stat` is read HERE, in the LISTING, not only in the post-kill probe
#
#    measured 2026-09-11: a caller plan-checked this skill FIVE times across one
#    session and the render never once said that three of its subjects sat in
#    `D` — uninterruptible sleep, where no signal lands. only `--mode apply`
#    surfaced it, AFTER the kill. so the one fact that decides whether a prune
#    can work at all was available to the plan and withheld from it.
#
#    ⇒ the plan and the apply now read the same field. a caller learns a subject
#      is unsignalable BEFORE it spends a destructive act, rather than after.
PS_ALL="ps -eo pid,etime,pcpu,pmem,stat,comm,args --sort=-pcpu | awk '\$6 == \"$PROCESS\" || index(\$0, \"/$PROCESS\") > 0'"

echo "🌳 git.grove.prune $GROVE --process $PROCESS --where-cpu-over $CPU_OVER --mode $MODE"
echo ""

# 🔴 the LISTING probe carries the same sentinel as the survivor probe, and for
#    the same reason — an empty match and a failed call are byte-identical
#    otherwise, and `🟢 no '<proc>' on this grove` is the most confident sentence
#    this skill can emit.
#
#    measured 2026-09-08: this line read `ssh … || true` and reported
#    `🟢 no 'nvim' on this grove — naught to prune` while pid 1791658 was alive.
#    the next run, 73 minutes later, listed it at `up 1-15:19:57` — a CONTINUOUS
#    uptime across the clean report, so it never exited (term=false-report).
#
# ⚠️ the lesson is the twin, never the line: the survivor probe was repaired
#    earlier the same day and THIS probe, with the identical defect, was left
#    alone. when you fix a `|| true` that hides a failed read, grep the file for
#    its siblings before you call it fixed.
LIST_END='--list-ran--'
all_raw=$(__exec "$PS_ALL; echo '$LIST_END'" 2>/dev/null) || true
case "$all_raw" in
  *"$LIST_END"*) : ;;
  *)
    echo "   └─ 💥 could not read the process list — the grove did not answer" >&2
    echo "" >&2
    echo "      ⚠️ this is NOT 'no $PROCESS on this grove'. what runs there is" >&2
    echo "         unknown, and no claim is made either way." >&2
    echo "" >&2
    echo "      🌳 read the grove: rhx git.grove.saturation --only $GROVE" >&2
    exit 1 ;;
esac
all=$(printf '%s\n' "$all_raw" | sed "/$LIST_END/d" | sed '/^$/d')

if [[ -z "$all" ]]; then
  echo "   └─ 🟢 no '$PROCESS' on this grove — naught to prune"
  exit 0
fi

# the split is computed HERE, on the full list, so the render can show what was
# SPARED as well as what was taken. a report of only the doomed leaves a reader
# unable to tell a floor that bit from one that matched everything anyway.
over=$(printf '%s\n' "$all"  | awk -v l="$CPU_OVER" '$3+0 >= l+0')
under=$(printf '%s\n' "$all" | awk -v l="$CPU_OVER" '$3+0 <  l+0')

n_all=$(printf '%s\n' "$all" | grep -c . || true)
n_over=$(printf '%s\n' "$over" | grep -c . || true)
n_under=$(printf '%s\n' "$under" | grep -c . || true)

echo "   ├─ found  $n_all × $PROCESS"

if [[ -n "$over" ]]; then
  cpu_sum=$(printf '%s\n' "$over" | awk '{s+=$3} END{printf "%.1f", s}')
  mem_sum=$(printf '%s\n' "$over" | awk '{s+=$4} END{printf "%.1f", s}')
  echo "   ├─ 🪓 over ${CPU_OVER}% cpu — $n_over  ·  ${cpu_sum}% cpu · ${mem_sum}% mem between them"
  printf '%s\n' "$over" | awk '{printf "   │     ├─ pid %-9s up %-12s %5s%% cpu · %4s%% mem · %-5s%s\n", $1, $2, $3, $4, $5, ($5 ~ /^D/ ? "  🔴 unsignalable" : "")}'
fi

if [[ -n "$under" ]]; then
  echo "   ├─ 🟢 under ${CPU_OVER}% cpu — $n_under spared"
  printf '%s\n' "$under" | awk '{printf "   │     ├─ pid %-9s up %-12s %5s%% cpu · %4s%% mem · %-5s%s\n", $1, $2, $3, $4, $5, ($5 ~ /^D/ ? "  🔴 unsignalable" : "")}'
fi

# 🔴 the unsignalable count is stated as a HEADLINE, never left for the reader to
#    spot in a column. a `D` subject cannot be pruned by this skill or any other,
#    so a plan that counts it among the prunable overstates what apply can do.
#
# ⚠️ and the remedy is NOT a bigger signal. the ladder has no rung above KILL,
#    and KILL waits in the same queue. what ends a `D` is the kernel call it
#    sleeps in — an io wait, or a cgroup memory reclaim. relieve THAT
#    (term=grove.process.unsignalable).
n_over_unsig=$(printf '%s\n' "$over" | awk '$5 ~ /^D/' | grep -c . || true)
if (( n_over_unsig > 0 )); then
  echo "   ├─ 🔴 $n_over_unsig of $n_over are in D — uninterruptible sleep"
  echo "   │     ├─ no signal ends these, SIGKILL included. a prune CANNOT take them"
  echo "   │     └─ read what each waits in, before you spend the act:"
  printf '%s\n' "$over" | awk '$5 ~ /^D/ {print $1}' | while IFS= read -r u; do
    wch=$(__exec "cat /proc/$u/wchan 2>/dev/null; echo" 2>/dev/null || true)
    wch=$(printf '%s' "$wch" | tr -d '\0' | tr -d '\n')
    echo "   │        ├─ pid $u waits in: ${wch:-<unreadable>}"
  done
fi

if [[ -z "$over" ]]; then
  echo "   └─ 🟢 none over ${CPU_OVER}% cpu — naught to prune"
  echo ""
  echo "      to take them anyway: rhx git.grove.prune $GROVE --process $PROCESS --where-cpu-over 0 --mode apply"
  exit 0
fi

if [[ "$MODE" == "plan" ]]; then
  echo "   │"
  # the count an apply can actually TAKE is the over-set minus the unsignalable.
  # to print `$n_over` alone reads as a promise the apply cannot keep.
  n_takeable=$(( n_over - n_over_unsig ))
  if (( n_over_unsig > 0 )); then
    echo "   └─ 🌙 plan — killed naught. $n_takeable of $n_over are takeable ($n_over_unsig in D, unreachable):"
  else
    echo "   └─ 🌙 plan — killed naught. to prune the $n_over over ${CPU_OVER}% cpu:"
  fi
  echo "         rhx git.grove.prune $GROVE --process $PROCESS --where-cpu-over $CPU_OVER --mode apply"
  exit 0
fi

# ⚠️ the signal goes to PIDS, never to the process NAME. `pkill -x <name>` would
#    take every match on the box and so ignore --where-cpu-over entirely — the spared set
#    would be spared in the report and killed in fact (term=false-report, of the
#    kind where the render and the act disagree).
pids_over=$(printf '%s\n' "$over" | awk '{printf "%s ", $1}')

######################################################################
# 🔴 the survivor PROBE — an empty match must be distinguishable from
#    a failed call, and until 2026-09-08 it was not
#
# the first draft read the survivor set with:
#
#     alive=$(ssh … "ps -o pid= -p ${pids// /,} …" || true)
#
# two defects stacked, and each alone was enough to make the report lie:
#
#   1. `${pids// /,}` left a COMMA AT THE END, since the pid list ends with a
#      space. measured directly on the grove:
#          ps -o pid= -p 1791658,   → exit 1, no output
#          ps -o pid= -p 1791658    → exit 0, prints the pid
#      so the probe asked a malformed question on EVERY run.
#   2. the `|| true` then converted that failure into an empty `alive`, which
#      the caller reads as "none survived".
#
#   ⇒ a failed call and a clean sweep were byte-identical, and the skill
#     reported `✔ all exited on TERM` twice while pid 1791658 was alive
#     (term=false-report · term=grove.process.unsignalable).
#
# 🔴 and the exit code cannot part them either: `ps -o pid= -p <valid-pid>`
#    exits 1 when that pid is simply gone, which is the SUCCESS case here.
#    so the probe carries a SENTINEL — the remote prints it after the read,
#    and its absence means the read never completed. that is the one signal
#    that separates "asked, and none survived" from "never asked".
######################################################################
PROBE_END='--probe-ran--'

# .what = comma-join a space-separated pid list, with no comma left at the end
__csv_of() {
  printf '%s\n' "$1" | tr ' ' '\n' | sed '/^$/d' | paste -sd, -
}

# .what = which of these pids are STILL ALIVE, one per line on stdout
# .why  = the survivor set is read, never inferred (rule.require.verify-after-send)
# exit    0 = the probe ran (an empty stdout then truly means none survived)
#         2 = the probe did NOT complete — say so, never call it a clean sweep
__probe_alive() {
  local csv out
  csv=$(__csv_of "$1")
  [[ -z "$csv" ]] && return 0
  out=$(__exec "ps -o pid= -p $csv | tr -d ' '; echo '$PROBE_END'" 2>/dev/null) || true
  case "$out" in
    *"$PROBE_END"*) : ;;
    *) return 2 ;;
  esac
  printf '%s\n' "$out" | sed "/$PROBE_END/d" | sed '/^$/d'
  return 0
}

# .what = the kernel state letter of each still-alive pid, as `<pid> <state>`
# .why  = a `D` survivor is UNSIGNALABLE — no signal ends it, SIGKILL included —
#         so it must be reported as SURVIVED rather than folded into a kill count
#         (term=grove.process.unsignalable)
# ⚠️ sentinel-guarded like its two siblings. an empty return here would empty
#    BOTH survivor sets, which makes n_left 0 and closes with `✔ pruned all` —
#    the same lie, reached by a third route.
__probe_state() {
  local csv out
  csv=$(__csv_of "$1")
  [[ -z "$csv" ]] && return 0
  out=$(__exec "ps -o pid=,stat= -p $csv; echo '$PROBE_END'" 2>/dev/null) || true
  case "$out" in
    *"$PROBE_END"*) : ;;
    *) return 2 ;;
  esac
  printf '%s\n' "$out" | sed "/$PROBE_END/d" | sed '/^$/d'
  return 0
}

__probe_failed() {
  echo "   └─ 💥 the survivor probe did not complete — the grove did not answer" >&2
  echo "" >&2
  echo "      ⚠️ TERM was SENT. what is unknown is whether a process DIED, so this" >&2
  echo "         run makes NO claim either way. it is not a clean sweep." >&2
  echo "         pid(s) signalled: $1" >&2
  echo "" >&2
  echo "      read the grove, then re-run: rhx git.grove.saturation --only $GROVE" >&2
  exit 1
}

######################################################################
# phase 1 — TERM, so a process that CAN exit cleanly does
######################################################################
echo "   │"
echo "   ├─ 🪓 phase 1 — SIGTERM to $n_over pid(s), then up to ${GRACE}s grace"
__exec "kill -TERM $pids_over 2>/dev/null || true"

######################################################################
# the grace is POLLED, never slept flat
#
# ⚠️ kill's exit code names whether a signal was SENT, never whether a
#    process DIED. so the survivor set is read from `ps`, never inferred
#    (rule.require.verify-after-send).
#
# .why a poll and not `sleep $GRACE`: the grace is 60s because a LOADED grove
#      schedules a TERM handler slowly — but a healthy prune finishes in one.
#      a flat sleep charges every caller the worst case, which makes the skill
#      feel broken on the easy path and invites a caller to shrink --grace back
#      to the value that caused the defect this default exists to fix.
alive=""
waited=0
while :; do
  if ! alive=$(__probe_alive "$pids_over"); then
    __probe_failed "$pids_over"
  fi
  [[ -z "$alive" ]] && break
  (( waited >= GRACE )) && break
  sleep 2
  waited=$(( waited + 2 ))
done

if [[ -z "$alive" ]]; then
  echo "   ├─ ⏱ all exited within ${waited}s"
  echo "   └─ ✔ all $n_over exited on TERM  ·  $n_under spared under ${CPU_OVER}% cpu"
  echo ""
  echo "      🌳 read what it returned: rhx git.grove.saturation --only $GROVE"
  exit 0
fi

n_alive=$(printf '%s\n' "$alive" | grep -c . || true)
n_termed=$(( n_over - n_alive ))
pids_alive=$(printf '%s\n' "$alive" | tr '\n' ' ')

# ⚠️ "outlasted", never "ignored" — three processes called wedged on 2026-09-07
#    exited unsignalled minutes later. what is measured here is that they did
#    not exit within the grace, which is a weaker claim than defiance.
echo "   ├─ ⚠️ $n_termed of $n_over exited within ${waited}s · $n_alive outlasted the grace"
echo "   │     └─ pid(s): $pids_alive"

# 🔴 part the survivors by KERNEL STATE before the escalation
#
#    a `D` process is UNSIGNALABLE: it is blocked inside a kernel call that
#    cannot be interrupted, so a signal is queued against it and never
#    delivered. SIGKILL is not stronger there — it waits beside the TERM.
#
#    ⇒ so the escalation ladder has NO RUNG for this state, and to send KILL
#      anyway would let the render imply an act that could not occur. the
#      honest move is to name it and leave it (term=grove.process.unsignalable).
if ! states=$(__probe_state "$pids_alive"); then
  __probe_failed "$pids_alive"
fi
pids_unsig=$(printf '%s\n' "$states" | awk '$2 ~ /^D/ {printf "%s ", $1}')
pids_kill=$(printf '%s\n'  "$states" | awk '$2 !~ /^D/ {printf "%s ", $1}')
n_unsig=$(printf '%s\n' "$pids_unsig" | tr ' ' '\n' | sed '/^$/d' | grep -c . || true)
n_kill=$(printf '%s\n'  "$pids_kill"  | tr ' ' '\n' | sed '/^$/d' | grep -c . || true)

if (( n_unsig > 0 )); then
  echo "   ├─ 🔴 $n_unsig unsignalable — State: D, blocked in a kernel call"
  echo "   │     ├─ pid(s): $pids_unsig"
  echo "   │     ├─ no signal ends this, SIGKILL included. it exits when its io or"
  echo "   │     │  memory reclaim completes. these are reported SURVIVED, never pruned"

  # 🔴 the skill READS the blocked call rather than tells the caller to ssh for it
  #
  #    a prior draft closed with `ssh <grove> 'cat /proc/<pid>/stack'` as advice.
  #    that is a skill that prescribes a LAYER DROP — the caller is sent to the
  #    substrate for a fact the skill already had the alias and the pid to fetch
  #    (rule.always.entool-the-layer-you-drop-below). so it fetches it.
  #
  # ⚠️ `/proc/<pid>/stack` is root-only on most kernels (kptr_restrict), so the
  #    read may be refused. `wchan` is world-readable and names the one function
  #    the task sleeps in — less detail, always available, and enough to sort an
  #    io wait from a memory reclaim.
  for u in $pids_unsig; do
    wch=$(__exec "cat /proc/$u/wchan 2>/dev/null; echo" 2>/dev/null || true)
    wch=$(printf '%s' "$wch" | tr -d '\0' | tr -d '\n')
    stk=$(__exec "head -4 /proc/$u/stack 2>/dev/null" 2>/dev/null || true)
    echo "   │     ├─ pid $u waits in: ${wch:-<unreadable>}"
    if [[ -n "$stk" ]]; then
      printf '%s\n' "$stk" | while IFS= read -r l; do
        echo "   │     │    $l"
      done
    else
      echo "   │     │    (stack is root-only on this kernel — wchan is the read you get)"
    fi
  done
  echo "   │     └─ relieve THAT, never the process — it is the symptom"
fi

still_killed=""
if (( n_kill > 0 )); then
  echo "   ├─ 🪓 phase 2 — SIGKILL over the $n_kill signalable survivor(s)"
  __exec "kill -KILL $pids_kill 2>/dev/null || true"
  sleep 1
  if ! still_killed=$(__probe_alive "$pids_kill"); then
    __probe_failed "$pids_kill"
  fi
fi

# the survivor set at the close = the unsignalable + whatever outlived KILL
pids_left="${pids_unsig}$(printf '%s\n' "$still_killed" | tr '\n' ' ')"
pids_left=$(printf '%s\n' "$pids_left" | tr ' ' '\n' | sed '/^$/d' | paste -sd' ' -)
n_left=$(printf '%s\n' "$pids_left" | tr ' ' '\n' | sed '/^$/d' | grep -c . || true)
n_pruned=$(( n_over - n_left ))
n_on_kill=$(( n_alive - n_left ))

if (( n_left > 0 )); then
  echo "   └─ ⚠️ pruned $n_pruned of $n_over × $PROCESS  ·  $n_left SURVIVED  ·  $n_under spared" >&2
  echo "         survivor pid(s): $pids_left" >&2
  echo "" >&2
  echo "      ⚠️ a survivor here is UNSIGNALABLE, never defiant — it is blocked in a" >&2
  echo "         kernel call, so no signal reaches it and none would. the call it" >&2
  echo "         waits in is printed above; that names the cause, and the cause is" >&2
  echo "         what a remedy has to reach. the honest first answer is to WAIT." >&2
  echo "" >&2
  echo "      🌳 read the grove: rhx git.grove.saturation --only $GROVE" >&2
  exit 1
fi

echo "   └─ ✔ pruned $n_over × $PROCESS  ·  $n_termed on TERM, $n_on_kill on KILL  ·  $n_under spared"
echo ""
echo "      🌳 read what it returned: rhx git.grove.saturation --only $GROVE"
