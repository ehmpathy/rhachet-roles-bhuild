# measure · grove=0901 · git.grove.capacity

three reads of the built verb on 0901 (4 cpu, 30.9G), on 2026-11-06, at different loads and windows.
`git.grove.capacity` names 0901 `local` because it runs there. the wish's `local` is pop-os, a
different box, and is not read here.

## .the reads

| read | load (1m · 5m) | token window | crews live · at work | box busy (of 4) | forks/s (per seat) | behavior affordable | binds | free now | ram limit | fleet burn | per behavior crew-hour |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 30 · — | 60 min | 30 · 5 | — | — | 10* | cpu | 5* | 55 | 49–51M/h | ~2.8M (18 crews) |
| 1b (token half alone) | 37 · 45 | 60 min | — | — | — | — | — | — | — | 49.3M/h | 2.5M (19 crews) |
| 2 | 53 · 47 | 180 min | 29 · 4 | — | — | 8* | cpu | 5* | 53 | 35.1M/h† | 1.8M |
| 3 | 47 · 48 | 180 min | 30 · 7 | 3.98 | 435.8 (11.1) | 11 (upper bound) | cpu | **0** | 53 | 40.2M/h† | 2.0M |
| 3b (token half alone, `--timeout 240`) | — | 60 min | 12 burned | — | — | — | — | — | — | 41.2M/h | 3.4M (12 crews); one crew's forks 10M of its 11.1M |

\* reads 1 and 2 ran the first cpu formula, which subtracted the crews' own cores alone and so read
the box's other load (tmux, zsh, systemd, hooks) as free. their `free` and `cpu` cells are void;
their token and ram cells stand. a check read between 2 and 3, under the cured formula, read busy
3.78 of 4, free 0, cpu limit 7, 497.4 forks/s (12.7 per seat).

† one registered grove (`grove-ahbode-hetzner-v20261022`) is unreadable: jq is absent there. it holds
no crew we know of, so the lower bound is close.

read 3, verbatim:

```
🌲 grove capacity (token cost over 180 min)
   ├─ tokens, fleet-wide: 40.2M/h now (a lower bound — unreached: grove-ahbode-hetzner-v20261022 unreadable)
   │  ├─ per crew-hour: behavior 2M · directive ⚪
   │  ├─ 5h: ⚪ the cap ledger holds no rows — wire `claude.statusline.caplog` on each seat, then restart it
   │  └─ 7d: ⚪ the cap ledger holds no rows — wire `claude.statusline.caplog` on each seat, then restart it
   └─ grove local: 4 cpu · 11G free of 30.9G · 30 crews live, 7 at work · busy 3.98 of 4 · 435.8 forks/s (11.1 per seat)
      ├─ behavior: affordable 11 (upper bound) · binds cpu · free 0 · ram 53 · cpu 11 · tokens.5h ⚪ · tokens.7d ⚪
      ├─ directive: affordable 11 (upper bound) · binds cpu · free 0 · ram 53 · cpu 11 · tokens.5h ⚪ · tokens.7d ⚪ · costs borrowed from the grove median
      ├─ exchange: 1 directive ≈ 1 behavior (on cpu)
      └─ levers, by gain in behavior slots against cpu
         ├─ #1 slimmer-boot-briefs: +0 crews · cuts tokens 1% · estimated · 2 reads
         ├─ #2 fell-or-park-idle-crews: +0 crews · cuts ram · estimated · 2 reads
         ├─ smoke-test-empty-config-dir: +0 crews · cuts tokens 9% · measured · 1 read · unranked
         ├─ small-context-forks: +0 crews · cuts tokens 25% · estimated · 1 read · unranked
         ├─ fewer-hook-forks: unmeasured — listed, never ranked
         ├─ cheaper-crew-transport: unmeasured — listed, never ranked
         ├─ statusline-from-a-file: unmeasured — listed, never ranked
         └─ fork-cap-per-seat: unmeasured — listed, never ranked
```

## .what the reads agree on

- **cpu binds**, every read. the box is full now: busy 3.78–3.98 of 4 cores, **0 slots free**,
  and a post-read check put the cpu stall (psi `some` avg60) at **🔴 98.1%**: some task waits on cpu
  almost all the time, so the gate grants no sprout here until it falls under 10%.
  the limit, if the box's work outside every crew holds where it is, is **7–11 behavior crews at
  work at once**. the spread is the non-crew load, which moves from minute to minute
- **the box's work outside the crews is the larger share of cpu.** 7 crews at work held well
  under half the busy cores; the rest is the transport and the hooks: 436–497 forks/s, 11–13 per
  live seat. so the cpu levers that would move the limit are the unmeasured three (hook forks,
  crew transport, status line), and their first read is owed
- **ram has room for ~53**, far from the wall
- **a behavior crew burns 1.8–2.8M weighted tokens per hour**; the fleet 35–51M/h. the spread tracks
  the window: the 60 min windows caught review ladders live, the 180 min windows average in gates
- **no measured lever raises cpu slots**, so every ranked lever reads +0 on 0901 today. the token
  levers (small-context forks 25%, smoke test 9%, boot briefs 1%) pay once tokens bind, and the
  caps are unread

## .what stays ⚪, and why

| cell | why | what lands it |
|---|---|---|
| tokens 5h / 7d limit | the cap ledger holds no rows | the director's seat restart, then `rhx git.crew.tokens calibrate` |
| directive crew cost | no directive crew burned on 0901 in any window; its cpu and ram are borrowed from the grove median | a read while a director seat runs |
| the cpu share of hooks, transport, status line | no before/after read | one read of each lever's fork and cpu share, then a second to rank it |
| pop-os (the wish's `local`) | not this box | the efficiency director's census reads |

## .caveats

- forks read 0 in every crew row of reads 1–3. read 3b settles it: one crew read forks 10M of its
  11.1M, so the reader counts forks on live transcripts, and the earlier zeros were true for
  those windows. one fork-heavy crew carried a quarter of the hour's fleet burn — the first read
  of the cost the `small-context-forks` and `fork-cap-per-seat` levers target
- a token read on this box needs `--timeout 240`: the default 90s timed out at load 47
- the crew kind is derived (route bind flag ⇒ behavior; a repo root outside `_worktrees` ⇒
  directive), a best guess on record as fulcrum F11

## .the defects the reads found, cured

- **an unread burn read as 0.** the first try at read 2 rendered `tokens, fleet-wide: 0K/h now`.
  the token scan timed out under the shared 90s budget, and the model read the empty burn as an
  idle fleet. cured: an unread rate is ⚪ with its cause and a re-read command, a partial one names
  the unreached grove, the token scan gets 3× the grove budget, and a model that fails to build
  exits 1. clamp: `git.grove.capacity` [case3][t1]
- **free cpu read the crews alone.** reads 1 and 2 said 5 free on a box at load 30–53 on 4 cores.
  cured: the probe reads the box's busy cores and fork rate off `/proc/stat` at both samples; free
  subtracts the whole box, the limit subtracts the box's work outside every crew. clamp:
  `git.grove.capacity` [case1][t0]
