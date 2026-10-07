# domain.term.choice.reason: crew.reflector

## .etymology

coined by the human, 2026-09-07, as a correction in flight. the supervisor proposed `reviewer` for
a third crew seat and was corrected in the same breath:

> *"or better yet, reflector"*

then made the default:

> *"by default, always creat a third tab, for role reflector"*

`reflector` names the act — to look **back** at a round — where `reviewer` names a verdict on an
artifact. the distinction is not cosmetic in this repo, because the route already owns a review
ladder: `peer` and `self` reviews, tallied by a guard, rendered against a diff.

⇒ so `reviewer` would have been an **overload**, one word across two concepts
(`rule.forbid.domain-term-ambiguity`): the seat, and the lane inside a guard. a reader of
`--who reviewer` could not have told which was meant.

| rejected | why |
|---|---|
| `reviewer` | ⛔ taken by the route's review ladder. and it names a verdict, where the seat is for retrospection |
| `critic` | adversarial by connotation. the seat is for lessons, not for judgment |
| `auditor` | implies a completeness claim this seat makes no attempt at (`term=partial-audit`) |
| `observer` | ⛔ collides with the `foreman`, whose declared job is to observe the round as it happens. the reflector looks back at one that has |
| `retro` | an abbreviation, and it names a ceremony rather than a seat |

## .the evidence — the roster braid the change surfaced

`CREWWORK_ROLES_DEFAULT` reads like the single source of the roster, and it was not. five sites in
`git.tree.duct.sh` carried the pair `mechanic`/`foreman` hardcoded beside it: the duct opens, the
cd sends, the ledger write, the tab loop, and the summary render.

⇒ so a one-line change to the constant would have produced a fleet where **`crew.boot` gave three
seats and every new SPROUT gave two** — a split that reads as a bug in one verb rather than as a
roster that was never single-sourced.

all five now derive from the constant through `__crew_roles_into`. the clamp in
`crewwork.verbs.integration.test.ts` was changed in the same round to assert the roster **by name** and
derive its length, rather than to hardcode `2`:

```ts
const ROLES_DEFAULT = ['mechanic', 'foreman', 'reflector'];
expect(opens).toHaveLength(ROLES_DEFAULT.length);
```

⚠️ the prior clamp read `toHaveLength(2)` and `toEqual(['foreman','mechanic'])`. it would have gone
red on the correct change and green on the braid — a clamp that inherited its author's roster
rather than the repo's.

verified end to end on a grove sprout the same day: three ducts, three cd sends, one ledger row
that carries all three, three tabs.

## .disputes

none open.

---

written by human + beaver 🦫
