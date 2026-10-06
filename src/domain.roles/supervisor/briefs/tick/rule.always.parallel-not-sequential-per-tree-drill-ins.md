# rule.always.parallel-not-sequential-per-tree-drill-ins

## .what

when a tick's poll names N trees that each need the SAME independent drill-in — read a modal,
verify a send, check a fell — issue all N tool calls in ONE message. never one tree, read the
result, then the next, one at a time. the trees do not depend on each other; the calls must not
either.

## .why

a serial run of independent work is slower, and it is also the same defect as
`rule.forbid.clipped-sweeps` at the CALL-ORDER layer instead of the data layer: a sweep that
could cover its full scope in one round instead trickles it out one unit at a time, and every
unit left for "the next message" is a unit a context compaction or interrupt can drop before it
is ever reached.

measured 2026-09-13: four trees needed the identical modal-answer cycle in one tick, and were
still worked one after another despite a repeated instruction to batch independent tool calls.

## .the test

before you send the first of N drill-in calls:

> **do calls 2 through N depend on what call 1 returns?**

no → they are independent. send all N in the SAME message, as N separate tool-use blocks.
yes → a serial run is correct; state the dependency, so a later reader can tell a real chain
from a missed batch.

## .what counts as "the same drill-in"

- N permission-modal reads/answers across N different trees
- N `crew.read` health checks across N trees a single poll named
- N `git.crew.reboot` calls to cure N husks the same instrument named in the same pass
- N `git.tree.del` verifications after N mechanics reported released

## .the bound

- a TRUE dependency chain (read tree A's pane to learn WHICH tree B to act on next) is exempt —
  name the dependency when you run it in order
- this rule does not ask you to invent parallel work where the base skill itself takes one
  keyboard at a time (a `crew.send` per pane, because a pane holds one process) — it asks you to
  issue the N independent CALLS to that skill together, not the acts the skill performs inside
  itself

## .enforcement

- N independent per-tree drill-ins issued as N sequential messages, with no stated dependency
  between them = **blocker**
- a tick that names N trees that need the same act, and cures fewer than N in the same round
  with no reason given for the gap = **blocker** (pairs with
  `rule.always.cure-detected-defects-same-tick`)

## .see also

- `rule.forbid.clipped-sweeps.md` — the peer defect at the data-scope layer; this rule is its
  twin at the call-order layer
- `rule.require.bulk-over-byhand.md` — the general mandate this rule sharpens for parallel calls
- `rule.always.cure-detected-defects-same-tick.md` — the peer rule this one serves

---

written by human + beaver 🦫
