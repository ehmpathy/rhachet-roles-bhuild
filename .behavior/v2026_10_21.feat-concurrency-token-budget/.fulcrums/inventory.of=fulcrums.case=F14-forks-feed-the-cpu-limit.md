# F14 · forks/s feeds the cpu limit; it is not a fifth limit

## .the fork

the wish names the grove walls as "cpu, ram, and forks/s per live clone". the vision says
"forks/s feeds the cpu limit via `saturation.spend`". two readings:

- **(a)** forks/s is a cost that lands on the cpu axis. the read prints it beside the cpu limit,
  and the cpu limit, the cpu stall, and the 🔴 gate bound it
- **(b)** forks/s is a fifth limit with its own upper bound, its own count, and a vote in `binds`

## .taken, and why

(a). a fork costs cpu time (the clone, the exec, the page-table copy), and that time shows up in
`busy_cores` and in the cpu stall (psi some avg60). the cpu limit is computed from those two reads,
so a box where forks are the cost reads as a box where cpu binds, and the gate grants no slot.
the two 0901 reads say the same: 436–497 forks/s beside 3.8–4.0 of 4 cores busy and a 98% cpu stall.

(b) needs a bound to divide by. no box here has a known fork-rate bound: `pid_max` is far above
any rate we saw, and the kernel does not refuse a fork for rate. a limit with no measured bound
would be a guess shaped like a number.

## .rework

clean. if a fork-rate bound is ever measured (the rate past which the cpu stall crosses 🟡 on a
box with idle cores), it becomes a fifth row in `limits` and a fifth name `binds` can return. no
caller reads the four-row shape by position.

## .confidence, and why it is low

70%. the claim "fork cost lands in busy_cores" holds for the fork itself. it does not cover a fork
that waits on io or a lock while it holds a pid and a slot in the run queue. on a box where that
wait is the wall, (a) would read cpu as busy only in part, and over-count the free slots.

## .where

`work/capacitywork.sh` (`limits`), `work/capacitywork.probe.sh` (`forks_per_sec`), the render's cpu line.

## .verdict

open.
