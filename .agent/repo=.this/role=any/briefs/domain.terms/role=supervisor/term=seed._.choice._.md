# domain.term: seed

term.chosen   = seed
term.kind     = verb
term.synonyms.forbidden:
- push
- queue
- file
- log it
- ticket
- backlog

## .what

to **dispatch a radio task** — a gh issue, queued for later. work does NOT start.

it is the **default**: every dispatch that does not carry the word `sprout` is a seed.

```
seed  →  rhx radio.task.push --via gh.issues --into $org/$repo --title … --description @stdin
```

## .the two properties the word carries

| property | what it means |
|---|---|
| **it waits** | a seed is planted and sits; a sprout breaks ground |
| **it is cheap both ways** | cheap to plant, cheap to leave unplanted — an issue anyone can close |

the second is why it is the default rather than merely the cautious choice.

## .why it is the DEFAULT

**the recovery path from a wrong seed passes THROUGH the seed.** a seed that should have been a
sprout costs one message — the human says "sprout it", and the tree boots from the very same
wish, already authored. a sprout that should have been a seed costs a fell, and the wish must be
pushed to the radio anyway.

so a seed is never wasted work. a sprout can be.

## .a seed is NOT

- **a lesser dispatch** — a seed carries the same wish body a sprout would. the wish is authored
  in full either way; only the moment of the work differs
- **a backlog entry** — it is a live task on a channel a clone can claim
  (`QUEUED → CLAIMED → DELIVERED`), not a wish-list row
- **a sprout** — see `term=sprout._.choice._.md`, its exact counterpart

## .refs

- `define.sprout-vs-seed.md` — the full brief: the pair, the default, the enforcement
- `rule.forbid.prescribe-how-on-dispatch.md` — a seed carries WHAT and WHY, never HOW
- `ehmpathy/rhachet-roles-bhuild#325` — the seed that carries this vocabulary to the role that
  owns it

## .reason

see `term=seed._.choice.reason.md` — etymology, why the default falls here, and the rejected
synonyms.

---

written by human + beaver 🦫
