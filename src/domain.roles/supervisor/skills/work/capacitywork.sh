#!/usr/bin/env bash
######################################################################
# capacitywork — the capacity model: how many crews of a kind fit on a
#                grove, which limit binds, and what each lever would buy
#
# 🔴 .a LIB: sourced, never executed. the verb that sources it is
#     `rhx git.grove.capacity`.
#
# .what = CAPACITYWORK_JQ_MODEL — named jq defs, each one quantity:
#
#   stall($r)                the cpu stall, the worse of its minute (psi some avg60) and its
#                            life (since boot): 🟢 <2 · 🟡 ≥2 · 🔴 ≥10 on each
#   ramstall($r)             the memory stall, the worse of its minute (psi full avg60: 🟢 0 ·
#                            🔴 >0) and its life (psi some since boot: 🟢 <1 · 🟡 ≥1 · 🔴 ≥5)
#   costs($r; $k)            what one crew of kind $k spends on grove $r: ram, cores, tokens/h
#   limit_cpu($r; $c)        crews before the cpu runs out — an ESTIMATE (core arithmetic),
#                            capped at the crews at work once the stall reads 🟡 or worse
#   limit_ram($r; $c)        crews before the ram runs out, less a 10% reserve
#   limit_tokens($w; $c)     crews the pool's 5h or 7d headroom sustains
#   free_ram($r; $c; $kb)    crews the ram has room for NOW, with $kb more freed; 0 while
#                            the memory full stall reads 🔴
#   free_cpu($r; $c)         crews the cpu has room for NOW; 0 while the stall reads 🔴
#   free_tokens($w; $c)      crews the pool's headroom has room for NOW, past the fleet burn
#   limits($r; $c)           all of the above, the one that binds, and the free slots
#   lever_gain($r; $c; $idleKb; $l)
#                            the free slots a lever adds, against the axis that binds
#   exchange_rate($kinds; $k; $axis)
#                            one crew of the other kind, in crews of kind $k, on $axis
#   exchange($kinds)         1 directive crew in behavior crews, on the axis that binds behavior
#   held_slots($kinds; $k; $same; $other)
#                            the slots live holds take from an ask of kind $k
#   idle_crews($r)           crews with no cpu now and no burn in the window
#   lever_rank($l) · ranked($rows)
#                            a lever's rank, and the rows in rank order
#
# .why  = the model lived inline in the verb as one jq program, so what a
#         row printed could only be learned by a mental run of the whole
#         program. each quantity now has a name and a one-line sense
#
# .in   = the defs read $tokens, $cal (the two token reads) as jq vars;
#         the caller passes them with --argjson
#
# guarantee:
#   - defines variables only; runs no command
#   - an unread input yields null, never 0: a 0 slot reads as a full grove
######################################################################

# shellcheck disable=SC2034 # read by the verb that sources this lib
CAPACITYWORK_JQ_MODEL='
  def median($xs): ($xs | sort) as $s | if ($s | length) == 0 then null else $s[($s | length / 2 | floor)] end;
  def floorpos($x): if $x == null then null else ([($x | floor), 0] | max) end;
  def minof($xs): ([$xs[] | select(. != null)] | min);

  # the token reads (from git.crew.tokens): a rate is only as real as the groves it read
  # .note = where no grove answered, the rate is unknown (null), never 0: a 0 would read as an
  #         idle fleet (term=false-report)
  def calwindow($w): (($cal // {}).windows // [] | map(select(.window == $w)) | first) // null;
  def poolrate($w): (calwindow($w) | if . != null and .verdict.state == "calibrated" then .pool.sustainable_per_hour else null end);
  def tokgroves: (($tokens // {}).groves // []);
  def tokread: ([tokgroves[] | select(.state == "read")] | length > 0);
  def burnph($k): (if tokread then (($tokens // {}).fleet.by_kind[$k].weighted_per_crew_hour // null) else null end);
  # .note = the fleet rate is a SUM over groves, so a partial read (a grove unreached, a file
  #         unread) understates it, and the headroom past it reads larger than it is. the
  #         unreached grove is often the biggest burner. so a partial read leaves the fleet
  #         rate unread (null), as calibrate refuses a partial burn for the same cause
  def fleetph: (if tokread and ((($tokens // {}).partial // false) | not) then (($tokens // {}).fleet.weighted_per_hour // null) else null end);
  def burned: ([tokgroves[] | select(.record) | .record.crews[] | select(.weighted > 0) | .crew] | unique);

  # .what = a percent graded on two lines, as git.grove.saturation `vrd` grades: ⚪ (null) where
  #         unread, 🔴 at or past $crit, 🟡 at or past $warn, else 🟢
  def grade($p; $warn; $crit): if $p == null then null elif $p >= $crit then "🔴" elif $p >= $warn then "🟡" else "🟢" end;
  def worstmark($a; $b): (["🔴", "🟡", "🟢"] | map(select(. == $a or . == $b)) | first) // null;
  # .note = each stall folds two rows: the minute (psi avg60) and the LIFE (µs stalled since boot,
  #         over the uptime). the minute decays, so a box abused for hours reads calm on it; the
  #         life row does not. the worse of the two is the mark, and `by` names which drove it
  #         (rule.require.bound-grove-concurrency-by-saturation: "gate on the LIFE row")
  # .note = the life bands are those of git.grove.saturation, exactly: cpu some 2 · 10, memory some 1 · 5.
  #         change one, change both
  def stall($r):
    ($r.psi_cpu_some_avg60 | tonumber? // null) as $p
    | ($r.psi_cpu_some_life | tonumber? // null) as $l
    | grade($p; 2; 10) as $now | grade($l; 2; 10) as $life
    | { pct: $p, life_pct: $l, mark: worstmark($now; $life),
        pct_text: ($r.psi_cpu_some_avg60 // null), life_text: ($r.psi_cpu_some_life // null),
        by: (if $life == "🔴" and $now != "🔴" then "life" else "now" end) };
  # .note = a memory FULL stall means every runnable task waited on memory at once: the box
  #         stopped outright, so any full above 0 is 🔴, whatever mem_avail reads
  #         (rule.require.bound-grove-concurrency-by-saturation: "any full above 0 → halt")
  def ramstall($r):
    ($r.psi_mem_full_avg60 | tonumber? // null) as $p
    | ($r.psi_mem_some_life | tonumber? // null) as $l
    | (if $p == null then null elif $p > 0 then "🔴" else "🟢" end) as $now | grade($l; 1; 5) as $life
    | { pct: $p, life_pct: $l, mark: worstmark($now; $life),
        pct_text: ($r.psi_mem_full_avg60 // null), life_text: ($r.psi_mem_some_life // null),
        by: (if $life == "🔴" and $now != "🔴" then "life" else "now" end) };
  # .what = why a 🔴 stall takes no sprout, named by the row that drove it; one phrase for
  #         the early refusal and the late one. the percents print as the probe read them
  def cpustallwhy($c):
    if $c.by == "life" then "cpu stall 🔴 \($c.life_text)% since boot: at or past the 10% line on average since the box booted, a stalled box takes no sprout"
    else "cpu stall 🔴 \($c.pct_text)%: at or past the 10% line, a stalled box takes no sprout" end;
  def ramstallwhy($m):
    if $m.by == "life" then "ram stall 🔴 \($m.life_text)% since boot: at or past the 5% line on average since the box booted, the box takes no sprout"
    else "ram full stall 🔴 \($m.pct_text)%: above 0, the box stopped outright and takes no sprout" end;

  # .what = the costs of one kind on one grove: its own median, else the grove median (borrowed)
  def costs($r; $k):
    ([$r.crews[] | select(.kind == $k)]) as $own
    | (if ($own | length) > 0 then $own else $r.crews end) as $pool
    | { borrowed: (($own | length) == 0 and ($r.crews | length) > 0),
        live: ($own | length),
        ram_kb: median([$pool[].rss_kb]),
        cores: median([$pool[] | select(.cores >= 0.25) | .cores]),
        tokens_ph: burnph($k) };

  def crewkb($r): ([$r.crews[].rss_kb] | add // 0);
  def crewcores($r): ([$r.crews[].cores] | add // 0);
  def crewsatwork($r): ([$r.crews[] | select(.cores >= 0.25)] | length);

  # .note = the box spends cpu outside every crew (tmux, zsh, systemd: catalog.of=saturator),
  #         so the cpu limit is what is left once that non-crew spend is paid
  # .note = the vision defines limit.cpu as the crew count before the stall crosses 🟡. core
  #         arithmetic only estimates it; once the stall already reads 🟡 or worse, the crews
  #         at work now have crossed the line, so the estimate caps at that count
  def limit_cpu($r; $c):
    ([($r.busy_cores - crewcores($r)), 0] | max) as $otherCores
    | (if $c.cores then floorpos(($r.cpus - $otherCores) / $c.cores) else null end) as $byCores
    | if $byCores == null then null
      elif (stall($r).mark == "🟡" or stall($r).mark == "🔴") then ([$byCores, crewsatwork($r)] | min)
      else $byCores end;
  def limit_ram($r; $c):
    if $c.ram_kb then floorpos(($r.mem_avail_kb + crewkb($r) - $r.mem_total_kb * 0.1) / $c.ram_kb) else null end;
  def limit_tokens($w; $c):
    if poolrate($w) and $c.tokens_ph then floorpos(poolrate($w) / $c.tokens_ph) else null end;

  def free_ram($r; $c; $kb):
    if ramstall($r).mark == "🔴" then 0 elif $c.ram_kb then floorpos(($r.mem_avail_kb + $kb - $r.mem_total_kb * 0.1) / $c.ram_kb) else null end;
  # .note = a box whose stall is past the 🔴 line takes no sprout, whatever its core math says
  #         (rule.require.bound-grove-concurrency-by-saturation)
  def free_cpu($r; $c):
    if stall($r).mark == "🔴" then 0 elif $c.cores then floorpos(($r.cpus - $r.busy_cores) / $c.cores) else null end;
  def free_tokens($w; $c):
    if poolrate($w) and $c.tokens_ph and fleetph != null then floorpos((poolrate($w) - fleetph) / $c.tokens_ph) else null end;

  def bindof($limit): ([$limit | to_entries[] | select(.value != null)] | min_by(.value) // null);
  # .note = two axes bind, and they can differ: `binds` caps the count the grove affords, while
  #         `free_binds` caps the slots free NOW (a token pool near its cap frees 0 slots while
  #         the ram limit stays large). a hold weighs on the axis that caps the free slots
  def verdictof($limit; $free):
    bindof($limit) as $bind
    | { limits: $limit, free: $free,
        affordable: ($bind.value // null),
        binds: ($bind.key // null),
        free_binds: (bindof($free).key // null),
        free_slots: minof([$free[]]),
        estimates: ([if $limit.cpu != null then "cpu" else empty end]),
        # an axis is unread where its limit OR its free slots are: a calibrated pool over a partial
        # burn has a limit, yet no honest free count, and the grant must say so
        upper_bound: ([$limit | to_entries[] | select(.value == null or $free[.key] == null)] | length > 0),
        unread_axes: [$limit | to_entries[] | select(.value == null or $free[.key] == null) | .key] };

  # .note = a grove with no crew at all has no unit cost to read. a null ram and cpu would either
  #         refuse every first sprout (a woken grove, the one with the most room, turned away) or,
  #         once the token pool calibrates, let tokens alone grant past the box. so an empty grove
  #         gives exactly one first-crew slot, unless a stall is 🔴 or the ram sits under its 10%
  #         reserve; the crew it boots then gives the cost every later ask reads
  def first_crew_slot($r):
    if stall($r).mark == "🔴" or ramstall($r).mark == "🔴" or ($r.mem_avail_kb < $r.mem_total_kb * 0.1) then 0 else 1 end;
  # .note = the first-crew slot is the grove axis alone: a spent token pool frees 0 on an empty
  #         grove too, so the free slots are the least of the first-crew slot and the token axes
  def limits($r; $c):
    if ($r.crews | length) == 0 then
      { first_crew: first_crew_slot($r), tokens_5h: free_tokens("five_hour"; $c), tokens_7d: free_tokens("seven_day"; $c) } as $free
      | { limits: { ram: null, cpu: null, tokens_5h: limit_tokens("five_hour"; $c), tokens_7d: limit_tokens("seven_day"; $c) } } as $l
      | $l + { free: $free,
        affordable: null, binds: null, free_binds: (bindof($free).key // "first_crew"),
        free_slots: minof([$free[]]),
        estimates: [], upper_bound: true,
        unread_axes: (["ram", "cpu"] + [$free | to_entries[] | select(.key != "first_crew" and .value == null) | .key]),
        first_crew: true }
    else verdictof(
      { ram: limit_ram($r; $c), cpu: limit_cpu($r; $c),
        tokens_5h: limit_tokens("five_hour"; $c), tokens_7d: limit_tokens("seven_day"; $c) };
      { ram: free_ram($r; $c; 0), cpu: free_cpu($r; $c),
        tokens_5h: free_tokens("five_hour"; $c), tokens_7d: free_tokens("seven_day"; $c) }) end;

  # .what = one crew of the other kind, in crews of kind $k, on $axis; null where either cost is unread
  # .note = the one exchange rate: the model line (behavior per directive) and the hold
  #         weight both read it, so the two never compute it two ways
  def axisfield($axis): ({ram: "ram_kb", cpu: "cores", tokens_5h: "tokens_ph", tokens_7d: "tokens_ph"}[$axis // ""]);
  def exchange_rate($kinds; $k; $axis):
    axisfield($axis) as $field
    | (if $k == "behavior" then "directive" else "behavior" end) as $o
    | if $field == null or ($kinds[$k][$field] // 0) == 0 or ($kinds[$o][$field] // null) == null then null
      else $kinds[$o][$field] / $kinds[$k][$field] end;

  # .what = the slots the live holds take, in slots of kind $k: same-kind holds count 1 each,
  #         the other kind counts at the exchange rate on the axis that caps the free slots
  #         (1 where that rate is unread, so an unread cost never weighs a hold at 0)
  def held_slots($kinds; $k; $same; $other):
    ((exchange_rate($kinds; $k; $kinds[$k].free_binds)) // 1) as $rate
    | ($same + $other * $rate) as $h
    | if $h == ($h | floor) then $h else ($h | floor) + 1 end;

  # .what = 1 directive crew in behavior crews, on the axis that binds behavior
  def exchange($kinds):
    ($kinds.behavior.binds) as $axis
    | exchange_rate($kinds; "behavior"; $axis) as $rate
    | if $axis == null or $rate == null then null
      else { axis: $axis, behavior_per_directive: ($rate * 10 | floor / 10),
             borrowed: (($kinds.directive.borrowed // false) or ($kinds.behavior.borrowed // false)) } end;

  # .what = the crews on a grove with no cpu now and no burn in the window
  # .note = idle is not fellable: a crew parked at a human gate reads idle (git.crew.poll --fellable says which may go)
  def idle_crews($r): [$r.crews[] | select(.cores < 0.05 and (.crew as $c | burned | index($c) | not))];

  # .what = the rank of a lever row: unmeasured (no read) · unranked (one read) · ranked (two or more)
  def lever_rank($l): if $l.tier == "unmeasured" then "unmeasured" elif $l.reads < 2 then "unranked" else "ranked" end;

  # .what = the levers ranked: measured first, then estimated, each by gain; then unranked; then unmeasured
  def ranked($rows):
    ($rows | map(select(.rank == "ranked")) | sort_by((if .tier == "measured" then 0 else 1 end), -(.gain // -1)))
    + ($rows | map(select(.rank == "unranked"))) + ($rows | map(select(.rank == "unmeasured")));

  # .what = what a lever would leave free after its cut; a fell frees the idle crews ram
  def lever_after($r; $c; $idleKb; $l):
    if $l.shape == "fell-idle" then limits($r; $c) | .free.ram = free_ram($r; $c; $idleKb) | .free_slots = minof([.free[]])
    elif $l.axis == "tokens" then limits($r; $c + {tokens_ph: (if $c.tokens_ph then $c.tokens_ph * (1 - $l.cut) else null end)})
    elif $l.axis == "ram" then limits($r; $c + {ram_kb: (if $c.ram_kb then $c.ram_kb * (1 - $l.cut) else null end)})
    else limits($r; $c + {cores: (if $c.cores then $c.cores * (1 - $l.cut) else null end)}) end;
  def lever_gain($r; $c; $idleKb; $l):
    lever_after($r; $c; $idleKb; $l) as $after
    | if $l.tier == "unmeasured" or $after.free_slots == null or $c.free_slots == null then null
      else ($after.free_slots - $c.free_slots) end;
'
