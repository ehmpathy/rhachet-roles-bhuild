# rule.always.do-the-adjacent-fix-rather-than-dream-it

## .what

> **a fix within reasonable adjacency of the work you already hold is DONE, never dreamed.**
> a dream is for what is genuinely out of reach — never for what is merely out of scope.

the default is act; deferral is the exception that must be earned.

```
you find a fix
   ├─ within reasonable adjacency  →  🔴 DO IT NOW. no dream, no seed, no task row
   └─ genuinely beyond reach       →  catch a dream, and SAY SO in the report
```

## .what "reasonable adjacency" means

not "in scope" — scope is the excuse a deferral hides behind. the test is about REACH:

| you already hold | so these are adjacent |
|---|---|
| the file open, the cause diagnosed | the fix in that file |
| the context of why it broke | the clamp that keeps it fixed |
| a verb you just repaired | its `--help`, a peer verb's row, the call sites you can see |
| a fleet you just swept | the other instances of the same defect the sweep named |

you already paid the expensive half — to understand the defect costs far more than to fix it,
and that comprehension is spent whether you act or not. a deferral throws it away and buys it
again later, colder and dearer.

## 🔴 .the tell: a dream that NAMES the fix is a fix you declined to make

`.the shape of the fix` is a dream's most valuable section, and also its confession. if you
can write the exact condition, line, and clamps owed — you were close enough to do it, and the
write-up cost what the fix would have cost. one dream named a seam, the exact condition, the
affected trees, and the owed clamps — all but the edit — deferred "out of the sweep's wake".
the fix took one condition and under a minute once a human found the gap first.

## .the same defect wears three costumes

| costume | looks like | is |
|---|---|---|
| **the dream** | a careful write-up with a shape-of-the-fix section | a fix you declined |
| **the seed** | a wish dispatched to another repo | correct ONLY where the gap truly lives there |
| **the task row** | a tracked item, honestly logged | a promise that costs naught and retires naught |

the seed is the sneakiest — it looks like delegation. run the originator test
(`rule.always.pave-on-second-repeat`) before you reach for it: a gap in a surface you edit
directly is yours, now. a seed for it burns a human's tokens and a review round on a change
you were already positioned to make — a seat-provision gap in this repo's own `crewwork.sh`
was once seeded to another repo, when the fix was one function and one call site.

## .the cue table

| when… | then… |
|---|---|
| about to write `.the shape of the fix` | 🔴 stop — you are close enough, make the fix |
| you would say "deferred out of X's wake" | a wake is not a wall — the context is warm now |
| a sweep names N instances and you fix one | the other N-1 are adjacent by definition |
| about to reach for a `.dream/` template | answer the reach question out loud first |
| you would seed a gap to another repo | 🔴 run the originator test — do you edit this surface? |
| a task row filed for a fix you can see | a row is a promise; the fix is the deed |
| the fix is in a file already open | no defensible defer |
| the human finds the gap before you report it | 🔴 it was adjacent, and the trust cost is paid |

## .when a dream IS correct

three narrow cases: the fix is genuinely large (a migration, a contract change, a cross-repo
rename); the fix is unsafe from here (touches behavior you cannot verify); the gap lives in a
repo you do not originate (then it is a seed, and the originator test must be run, not
assumed). in all three, name it in the report — a deferral the human learns about from the
artifact rather than from you reads as a miss.

## .the bound

`rule.always.fix-forward-under-scouts-honor` still holds: the fix must be SAFE (no risk to work
you cannot see) and CLEAN (lands in the diff you already have). a large change that ripples,
smuggled in under adjacency, fails CLEAN — the mirror failure this rule would otherwise create.
what this rule adds is the direction of the default: the bar for "too big" is REACH, never
scope, and the defer must be justified, not the fix.

## .enforcement

- a dream caught for a fix whose shape the dream itself states = **blocker**
- a fix deferred out of a sweep's wake, where the sweep already named the instances = **blocker**
- a gap seeded to another repo without the originator test run = **blocker**
- a task row filed for a fix reachable from the work already in hand = **blocker**
- a genuine defer (large · unsafe · foreign), named in the report = ✅ correct
- a large change that ripples, smuggled in under adjacency = **blocker** (fails CLEAN)

## .see also

- `rule.always.fix-forward-under-scouts-honor` (**foreign** — `bhrain/driver`) — the SAFE+CLEAN
  test this rule borrows and re-aims
- `rule.always.catch-dreams-for-followups` (**foreign** — `bhrain/driver`) — its pair
- `rule.always.fix-the-verb-that-left-you-the-gap` — the same claim aimed at a verb that
  under-delivers; this generalizes it past verbs
- `rule.always.pave-on-second-repeat` — the originator test, which the seed costume evades

---

written by human + beaver 🦫
