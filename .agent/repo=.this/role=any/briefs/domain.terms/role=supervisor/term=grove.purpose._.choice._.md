# domain.term: grove.purpose

term.chosen   = purpose
term.kind     = noun
term.boundary = grove
term.synonyms.forbidden:
- role
- kind
- type
- tier
- class
- env

## .what

what a grove is **for** — and therefore whether a crew may live on it.

exactly three values, and the third is a verdict rather than a state:

| value | means | may a crew boot? |
|---|---|---|
| `work` | a durable grove. a worktree there survives | ✅ yes |
| `lab` | tagged **deletable** in ec2 — thrown away on a schedule | ⛔ no |
| `unknown` | it declared no purpose and is on no list | ⛔ no — **fails closed** |

## .where it is read

in order. the first answer wins:

1. **the grove's own marker** — `~/.grove/purpose`, one word. the box is what the ec2 tag
   describes, so the box is the right party to answer
2. **`CREWWORK_GROVES_BOOTABLE`** — the declared list, a stopgap while a grove carries no marker
3. neither ⇒ `unknown`

## .the two properties the word carries

| property | what it means |
|---|---|
| **it is a fact about the BOX, never about the crew** | a purpose does not change when a crew boots or fells. it is the box's own attribute |
| **it gates, and it gates BEFORE the first duct** | the whole value is that a wrong boot costs a fell. a gate that fires after one duct is open has saved nobody |

## .a purpose is NOT

- **saturation** — `term=grove.saturation` answers *"can it take one more crew right now?"*, a
  measurement that moves minute to minute. a purpose is a declaration that does not move
- **an env** — `ahbode/infrastructure`'s `term=env` names a deploy stage (`camp`, `prep`, `prod`).
  a purpose names what a MACHINE is for, and one env holds groves of both purposes
- **a role** — a role is a seat within a crew (`mechanic`, `foreman`, `reflector`). a purpose is
  an attribute of the machine the crew sits on

## .refs

- `.agent/repo=.this/role=any/skills/work/crewwork.sh` — `__crew_grove_purpose`,
  `__crew_grove_assert_bootable`, `CREWWORK_GROVES_BOOTABLE`
- `.agent/repo=.this/role=any/skills/git.tree.duct.sh` — the sprout-side gate
- `rule.require.bound-grove-concurrency-by-saturation.md` — the peer gate, on the other axis

## .reason

see `term=grove.purpose._.choice.reason.md` — the measured boot onto a lab grove that produced
the word, and why the fallback fails closed.

---

written by human + beaver 🦫
