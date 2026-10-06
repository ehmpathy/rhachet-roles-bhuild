# domain.term.choice.reason: ledger

## .etymology

**bookkeeping.** a ledger is the durable book of record — the account of what exists, kept apart
from the day's transactions. it is opened on creation and closed on termination, never on a pause.

the human named it directly, and named its precedent in the same breath:

> *"just liike we have duct ledgers, add crew ledgers, and backfill that ledger for the ones you
> have seen crew ducts created for"*
> — 2026-08-25

that citation is the strongest evidence available for a term: **the domain expert supplied the
word AND the analogy, unprompted.** per `howto.domain-discovery` move 1, the word was adopted
rather than translated.

## .⚠️ the analogy the human cited is INEXACT — and the gap IS the term

the human said *"just like we have duct ledgers"*. `~/.ductwork/ducts/` is real and it is
**not a ledger**, on this term's own definition:

```bash
__duct_unregister_duct() {
  rm -f "$file"
  rmdir --ignore-fail-on-non-empty "$(dirname "$file")"
}
```

it is a **registry** — erased on teardown. so the artifact the human pointed at as a precedent is
in fact the exact thing a ledger is not.

this is not a correction of the human. it is what makes the term necessary: the intent *"a durable
record of every crew"* is right, and the extant artifact does not deliver it. had the crew record
been modeled on the duct registry as literally named, it would have been erased by `crew.stop` and
answered no question at all.

**recorded so the analogy is not read as a spec.** the duct layer may well want a real ledger of
its own — that is a separate question, not settled here.

## .disputes

### dispute: registry — raised 2026-08-25 — status: RESOLVED (keep `ledger`)

- raised.by = beaver (self)
- claim = the repo already calls `~/.ductwork/ducts/` a **registry**, and the new artifact has the
  same shape: a dir of json files, one per subject. one shape should take one word
  (`rule.require.ubiqlang`).
- counter = the shape is the same and the **contract is opposite**, which is the axis that
  matters. a registry answers *what is registered NOW* and is erased on teardown; a ledger answers
  *what ever existed* and survives it. to call both `registry` overloads one word onto two
  lifetimes — precisely the ambiguity `rule.forbid.term.addition.ambiguous` forbids.

  the cost is concrete rather than theoretical: a reader who believes the crew record is a
  registry will expect `crew.stop` to clear it, and will read a stale-looking row as litter to
  clean. that read would destroy the one artifact that makes a stopped crew visible.
- resolution = keep `ledger` for the durable record; `registry` stays the live one. two words, two
  lifetimes.

### dispute: log — raised 2026-08-25 — status: RESOLVED (keep `ledger`)

- raised.by = beaver (self)
- claim = `log` is the common word for a durable append-only record, and shorter.
- counter = a log holds every **event**; this holds one row per **subject**, upserted.
  `__crew_ledger_set` preserves `bootedFirst` and refreshes `bootedLast` on a re-boot, so a crew
  booted five times has one row, not five. that is convergence
  (`rule.require.idempotent-operations`), and `log` names the opposite.

  `log` is also taken twice over in this repo — `.log/` dirs for skill output, and `log` as the
  injected context method (`context.log.info`).
- resolution = keep `ledger`. `log` recorded as a forbidden synonym.

## .evidence

### the defect that forced the term

three sources were tried for *"was a crew ever booted on this tree?"* before a ledger existed, and
each failed on its own axis:

| source | what it actually answers | why it fails |
|---|---|---|
| live tmux | at work NOW | a stopped crew vanishes — under-reports by design |
| duct registry | holds a duct NOW | **erased on stop**; the act destroys its own evidence |
| worktrees on disk | a TREE exists | a tree is not a crew — over-reports, badly |

the third was measured and it is the sharpest number this round produced:

```
142 trees on disk
 14 trees a crew was ever booted on
```

so a disk-derived poll reported **~128 crews that were never born**, each rendered
`💀 down — rhx git.crew.boot` — a verdict that asserts a crew DIED where none ever existed. that
clears both `false report` discriminators: the tool did not fail, and the content is untrue.

⚠️ this incident is the first evidence `term=down` rests on, paved 2026-08-26. the constraint it
yields — **a verdict in the past tense may only be derived from a source with a memory** — is what
makes the ledger the only source that can support that word.

the human caught it directly:

> *"well, not all trees were built with crews though. yaknow?"*
> *"i'm saying for most of those trees, no crew ever was created"*

### the layer boundary it settles

disk enumeration is **exhaustive** over crews (a crew cannot exist without a tree) and it is not
**precise**. a poll owes both. the human named the instrument for the other question in the same
round:

> *"if we want a list of all the trees that exist, we'll run `git tree status --repo @all` instead"*

so: `git.crew.poll` reads the ledger and reports crews; `git.tree.status --repo @all` reports
trees. one layer, one instrument, no overlap.

### the backfill, and its permanent incompleteness

seeded 2026-08-25 from live tmux ∪ surviving duct-registry rows: **14 rows, 13 of them `beav.*`**
(the supervisor-dispatch convention, corroborated), plus `main` — the grove's bare shell, which
the poll reports as the fleet's one phantom.

every crew booted **and** stopped before that moment left no trace, because `duct.stop` had
already erased it. that gap is not repairable, so the skill states it in its own output rather
than let `14` read as a total (`term=partial-audit`).

## .a false report caught mid-round, on this term's own skill

`rhx git.crew.ledger list` printed `93`. i read it as a row count. it was **`rhx list`'s** output
— rhx owns `list` as a builtin subcommand and intercepted the positional arg, so the call printed
a skill catalogue and exited 0.

exit 0, ordinary format, a plausible number, and no tell for the caller. it clears both
discriminators of `term=false-report`, and i had already begun to reason from the wrong figure.

what caught it was the `partial audit` habit of a second read: `| head -20` to see the rows
themselves, which showed a skill tree rather than tree slugs. **the cheap corroborating read is
what fired**, not suspicion.

the repair is structural rather than a note: the mode is now a **flag** (`--backfill`), and the
bare call does the read. a flag cannot be intercepted by a parent CLI, and the safe act is the
default (`rule.require.safe-by-default`).

> **a positional verb handed to a wrapped CLI can be eaten by the wrapper, and the theft is
> invisible — the wrapper's own output is well-formed and exits 0.** where a skill runs under a
> parent command, prefer a flag.

that is a general finding about the `rhx` surface, and it applies to every skill that takes a bare
verb.

## .see also

- `term=fell._.choice._.md` — the one act that drops a ledger row
- `term=crew._.choice._.md` — the work/view axes, and why `stop` must not clear the ledger
- `term=duct._.choice._.md` — the **row** / **session** split, and the registry this is not
- `term=false-report._.choice._.md` — the `rhx list` interception, and the disk-derivation verdict
- `term=partial-audit._.choice._.md` — why a backfilled count is not a history
- `rule.forbid.term.addition.ambiguous` — the registry overload this dispute refused

---

written by human + beaver 🦫
