# domain.term: poll

term.chosen   = poll
term.kind     = verb
term.synonyms.forbidden:
- status
- check
- scan
- survey
- monitor
- watch

## .what

a **read over a whole fleet at once** — N independent subjects, derived live, judged in
parallel, rendered as one verdict per subject.

```
rhx duct.poll            every duct — did it move?
rhx git.release.poll     every tree — did its work land?
```

## .the five properties that make it a poll

each one parts it from an ordinary read, and a read that lacks them is a `get`:

| property | what it means |
|---|---|
| **the subject set is DERIVED** | never handed in as an argument — read live from tmux, from disk, from the registry |
| **the subjects are INDEPENDENT** | read in parallel; one slow subject must never hide the rest |
| **each yields a VERDICT** | a judgment (`🌊 changed`, `🪵 merged`), never a raw value |
| **it is BOUNDED per subject** | a timeout, so a partial answer is a valid answer and a hung subject is a row rather than a hang |
| **it is TEMPORAL** | to poll is to ask *again*; the verdict may compare against the prior poll |

## .poll is NOT

- **a `get`** — a `getAll*` takes its scope from its caller and returns values. a poll derives
  its own scope and returns judgments. see `.reason` for why this does not violate
  `rule.require.get-set-gen-verbs`
- **a `list`** — a list enumerates what exists (`duct.list`, `git.crew.list`). a poll *judges*
  what it enumerates. the two are often layered: a poll derives its fleet FROM a list
- **a `read`** — a read is one subject, in full (`duct.read`). a poll is N subjects, in verdict
- **a `watch`** — a watch BLOCKS until an outcome settles (`git.release --watch`,
  `gh run watch`). a poll returns NOW, with whatever is true at this instant. that is the
  sharpest boundary in this cluster, and the two read as opposites in time

## .the axis a poll derives ON is part of its contract

property 1 says the subject set is DERIVED. it does not say **on what**, and that omission cost
a fleet a day.

> **the axis a poll derives on must belong to its own subject. a set derived from a NEIGHBOUR
> layer goes blind whenever that neighbour does.**

`git.release.poll` named a DIMENSION (`release`) rather than a subject, so it had no axis of its
own and picked tmux sessions — i.e. CREWS, one layer over from the trees it judged. on
2026-08-24 a machine death killed every duct: `git.crew.list` returned ONE crew of fourteen
while thirteen trees sat on disk, several of them dirty, and no instrument said so.

`git.crew.poll` supersedes it, through the glossary's own dependency — `crew ↔ tree ↔ branch ↔
pr`, and a tree can have no crew while a crew cannot have no tree.

⚠️ **its shipped derivation is the crew ledger ∪ duct registry ∪ live tmux**, not trees on disk
as its own header argues. the gap is recorded, not repaired — see `.reason`.

## .a poll is READ-ONLY, always

it never sends a key, never opens a duct, never mutates a branch. that is a **guarantee**, not
a tendency — a sweep a supervisor cannot invoke without a second thought is a sweep it will
stop invoking (`rule.require.safe-by-default`).

the hazard the guarantee prevents is specific: a poll whose act touches its own subjects reads
its own act as motion. `duct.poll`'s per-tick resize did exactly that, and it made
`rule.require.pause-babysit-cron-after-idle-streak` structurally unreachable.

## .refs

declared at `.agent/repo=.this/role=any/skills/`:

- `duct.poll.sh` — every duct: changed / unchanged / prompt / malfunction
- `git.crew.poll.sh` — every crew AND its tree, **two verdict axes in one row**:
  crew = at work / down / phantom · tree = merged / green / awaited / failed / behind / …
- `git.release.poll.sh` — ⚠️ **SUPERSEDED** by `git.crew.poll`, 2026-08-24. named here rather
  than dropped, because WHY it was retired is this term's sharpest evidence (see the
  derivation-axis rule above)

## .reason

see `term=poll._.choice.reason.md` — etymology, the `get*` dispute, and the evidence.

---

written by human + beaver 🦫
