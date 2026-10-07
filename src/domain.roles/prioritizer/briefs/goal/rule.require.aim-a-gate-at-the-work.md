# rule.require.aim-a-gate-at-the-work

> a gate attaches to the row that does the WORK, never to the roll-up above it.

when you type `--gated-by X`, ask which row actually waits on X. that row is almost never the
parent — a parent is a name for a set of parts, and a name does no work.

## .why — wrong twice, in opposite directions

| the defect | what it costs |
|---|---|
| redundant | the parent was already gated by its parts (`a-part-gates-its-whole`) — the edge adds naught |
| imprecise | the leaf that actually waits on X carries no gate, so `--ready` calls it startable — a human hits the wall the gate was meant to stop |

the second is a false green, and fires on exactly the row a human reaches for.

## .the block propagates up for free

```
declapract  →gates→  waste-audit          (stored — a real cross-branch prerequisite)
                     waste-audit  is a PART of  sms-tune    (derived from --goal)

⇒  declapract open  ⇒  waste-audit not ready
                    ⇒  sms-tune.partsOpen holds waste-audit
                    ⇒  sms-tune not ready
```

one edge, both rows correct — the invariant carries the propagation upward, so the precise gate
is also the cheaper one.

## .the test

"which row would hit the wall if this prerequisite were absent?"

- a leaf, or a row with work of its own → aim there
- "the whole branch" → you named a roll-up; ask again, of each part, which actually touches X
- genuinely every part → the gate may sit at the parent — say so out loud

## .the cues

| when… | then… |
|---|---|
| `--gated-by` on a row with parts beneath it | stop — name the part that waits |
| the store refuses your gate as a tree restatement | you aimed at an ancestor of your own row |
| `--ready` returns a row that's obviously not startable | a gate was aimed too high, or never typed |
| you decompose a gated rock into parts | re-aim part by part, unless every part waits |

## .the worked case

a config dependency must land before an audit can run. `rock --gated-by declapract` (the
roll-up) is redundant and imprecise — the peer row that does the actual audit shows startable
with no flag. `audit --gated-by declapract` (the leaf) is correct — the roll-up blocks anyway via
part-of. the store cannot catch a parent-aimed cross-branch gate on its own; a cross-branch gate
at a parent is legal, so the only guard is a deliberate aim.

## .the bound

not a ban on gates at a parent — a prerequisite every part genuinely waits on belongs there, with
a note saying so. does not bind the derived part-of block, which has no aim to choose.

## .enforcement

- a stored gate on a roll-up, where one part carries the dependency and others do not = **blocker**
- a gate aimed at a parent with no note of why every part waits = **nitpick**
- a gate re-aimed downward when a rock is decomposed = correct, never a violation

## .see also

- `define.invariant.eco.a-part-gates-its-whole.md` — makes the upward propagation free
- `define.eco.decomposition-vs-orchestration.md` — the two relations
- `howto.read-eco-priority-flags.md` — what `--ready` claims, and what it does not

---

written by human + beaver 🦫
