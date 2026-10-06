# F3 — the `achiever` seam in sprout rung 2

| | |
|---|---|
| **rework** | clean |
| **status** | best-guessed |
| **confidence** | 80% |
| **where** | `case=1`, handoff §2.4 |

## .the fork, stated fairly

`git.tree.achievement` (rung 2 of the sprout ladder) carries a forward comment in its own header:

> *"the `achiever` role owns a route of its own upstream. once it lands, the boot line below gains
> one stage: `cat $goal | rhx achievement init --goal @stdin`"*

§2.4 is explicit: **do not port that comment without a verdict** — it names a dependency that does
not exist yet.

| branch | consequence |
|---|---|
| bhuild owns `achiever` | a **third** new role in this PR, unscoped by the wish, with no inventory in the handoff and no briefs written |
| rung 2 stays a plain goal-carrier | the ladder ships as it runs today; the comment is marked speculative or struck |

## .taken, and why at the time

**rung 2 stays a plain goal-carrier.** the comment ports, marked explicitly as speculative — it is
not struck, because the gap it names is real and a future reader should know the seam was seen.

two reasons:

1. **the wish scopes this PR to two roles**, by name, in its title and its outcome statement. a
   third role is scope the wisher did not grant.
2. **the handoff has no inventory for `achiever`** — no skills, no briefs, no boot curation. there
   is naught to lift. it would be net-new design smuggled into a lift.

## .rework, and why it is clean

it is a comment and a doc note. if `achiever` lands later, rung 2 gains one stage in its boot line
— an additive change to one shell script, with no caller hardened against its absence.

## .confidence, and why it is 80%

the scope argument is strong. the 20%: a reviewer could reasonably hold that a comment which
points at a non-existent role is itself a phantom path (`case=5`'s own complaint) and should be
struck rather than marked. that is a presentation call on one comment, and either answer is cheap.

## .the verdict, once ruled

_(unset)_

---

written by human + beaver 🦫
