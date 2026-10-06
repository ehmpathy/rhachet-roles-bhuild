# rule.always.re-measure-a-lever-before-you-rank-it

> a lever's size comes from at least TWO reads, taken in different conditions. one read is a
> sample of one, and a config is a sample of none.

`surgoal.squeeze-the-grove` already forbids a cut priced from a config file. this rule adds the
half it does not carry: **one live read is not enough either**, and the failure looks identical
from the inside — a real number, off a real instrument, about the wrong world.

## .the evidence — four violations, one session

| the lever, as ranked | the basis | what a second read said |
|---|---|---|
| one tmux server ≈ 26% of a core | a config | 🔴 2 sockets, real cost ~145% of a core — off by ~800x |
| `dirname` costs 4.0 per `rhx` call | one census, taken amid a storm | 0.7 per call, ~0.05% cpu — not a lever at all |
| `biome` at 20.5% — the largest tunable | one 20s window | 0.0% across 8 windows, 0 execs in a 90s trace |
| ~50 processes/s | the probe's own unbracketed loop | the probe itself forked ~38,600 times |

rows 2 and 3 landed AFTER the config-only clause was already written — a config-only rule does
not catch a bad live read, so this rule stands as its own peer.

## .the test — count the reads, then count the conditions

| reads | verdict |
|---|---|
| 0 — a config, a default, an interval, a doc | you have measured naught |
| 1 | a sample of one — report it as one window, never rank it |
| 2+, same conditions | better, but shares one denominator — see below |
| 2+, different conditions | ✅ rank it |

different conditions carries the weight — two reads back to back on a busy box agree with each
other and are both wrong about a quiet one.

## .why one window fails for cpu

cpu is a flow, so every figure is a ratio, and a single window fails three ways:

| the failure | what it looks like |
|---|---|
| over-rank | a burst lands inside your window and reads as baseline |
| under-rank | the work happened outside your window and reads as zero |
| 🔴 denominator pollution | the numerator is right, the total is wrong, so the share lies — measured amid a storm that burned ~145% of a core |

denominator pollution is the dangerous one: the count is accurate, the box was simply not
itself, and the share computed is a share of a world gone ten minutes later.

ram does not share this failure — it is a stock, so a gauge is correct and one read is a real
answer. this rule is about flows.

## .four ways to get the second read, cheapest first

1. repeat the window N times, print each — variance a mean hides
2. change the conditions — before/after a cut, quiet vs busy, a different hour
3. change the instrument — a counter delta vs an exec tracepoint; agreement settles it, disagreement names which is broken
4. widen to a cumulative counter (`cutime`, `/proc/stat processes`, `cpu.stat`) — immune to a bad window by construction

| when… | then… |
|---|---|
| about to write "the largest lever is X" | count your reads — one → say "in one window" instead |
| a number came off a config, interval, or default | zero reads — measure the box |
| a figure surprises you | the strongest cue — a surprise is a hypothesis, re-read it |
| about to rank two levers against each other | both need 2+ reads, or the order is a coin flip |
| your one window ran amid a known storm | the denominator is polluted — every share from it is void |
| about to seed or dispatch a cut | the number rides into another repo unchecked — 2+ reads, state how many |
| the second read agrees with the first | ✅ cheap, rank it |
| you report a single window on purpose | ✅ fine — label it as one window, rank naught off it |

## 🟡 the bound — not a demand for a study

two reads is the bar. a repeat window costs the window's length; a `ps` call costs
milliseconds. the cost is asymmetric: a second read costs seconds, a wrong rank costs a cut
aimed at the wrong subsystem and a brief that cites it forever.

the bar drops to one read only where you also drop the rank: "one 20s window showed X" is
honest; "X is the largest lever" off that window is not.

## .enforcement

- a lever ranked off a config, default, or interval = **blocker**
- a lever ranked off a single live window = **blocker**
- a share computed from a window that held a known storm = **blocker**
- a number seeded or dispatched to another repo with no read count stated = **blocker**
- a single window reported and labelled as one window, with no rank attached = ✅ correct
- a stock (ram, disk, a live-peer count) read once = ✅ correct — a gauge is the right
  instrument for a stock

## .see also

- `surgoal.squeeze-the-grove` — the config clause this extends, and the flow/stock split it rests on
- `catalog.of=saturator.axis=cpu.md` — the four refuted claims, each with its correction
- `rule.require.trust-but-verify` (ehmpathy/mechanic) — the general form: verify the claim and
  the instrument that produced it
- `rule.require.enumerate-before-you-name` (bhrain/learner) — the same defect one layer over: a
  word tested against one instance

---

written by human + beaver 🦫
