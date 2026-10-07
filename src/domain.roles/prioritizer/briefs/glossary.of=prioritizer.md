# glossary

## .what

the prioritizer's vocabulary — one row per word: what it IS, and the synonyms it forbids.

⇒ the full record for each term is kept out of this package, at
`ehmpathy/rhachet-roles-bhuild:.agent/repo=.this/role=any/briefs/domain.terms/role=prioritizer/`.

## .the store

| term | is | never |
|---|---|---|
| **eco.store** | the plaintext `.eco/*.csv` in git — the authoritative record | backup, export, mirror |
| **eco.store.mirror** | the derived sqlite `.eco/*.db` — gitignored, rebuilt from the store, safe to delete | snapshot, replica, store |

## .the fields of a priority

| term | is | never |
|---|---|---|
| **eco.opine** | a field whose value is a HUMAN's claim — `sev`, `urg`. a clone never authors one | claim, grade, assessment |
| **eco.quant** | a field whose value is a number a human would defend — `gain`, `cost`, `asks` | measure, score, stat |
| **eco.ask** | one event where a human reached for a priority (one `set`). `quant.asks` tallies them | occurrence, count, frequency |

## .the two verdicts on a row

| term | is | never |
|---|---|---|
| **eco.prioritized** | the row carries an opine — the org wants it, at a stated sev + urg. its WORTH | graded, rated, weighted |
| **eco.sponsored** | ⭐ a human authorized budget on the row — a commitment of scarce resource, not worth | championed, backed, boosted |

## .goals

| term | is | never |
|---|---|---|
| **goal.surgoal** | the goal one rung UP from a given goal — a relation, never a kind | epic, supergoal, overgoal |
| **goal.effect** | what a goal does to the gain: `solve` creates it, `clamp` protects it | kind, type, category, phase |
| **eco.rock.category.decost** | the rock category for work that cuts what the org spends, so it keeps more of what it earns | savings, efficiency, margin |

---

written by human + beaver 🦫
