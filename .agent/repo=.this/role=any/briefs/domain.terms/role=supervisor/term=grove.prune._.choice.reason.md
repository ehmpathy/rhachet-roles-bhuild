# domain.term.choice.reason: prune

## .etymology

`prune` is **adopted from horticulture, never coined** — to prune is to cut back a plant's
overgrowth **so the remainder thrives**. the word already carries the selectivity in its ordinary
sense: a gardener who removed every branch would not be said to have pruned.

⇒ that provenance is the reason it survives the enumeration below. **the discipline the skill needs
is already inside the word**, so a caller who reads `prune` and expects a total clearance has
misread english, not merely a flag.

and it composes with the forestry vocabulary already in place — `sprout`, `grove`, `tree`, `fell`
(`term=grove`, `term=fell`, `term=sprout`). the fit is not decorative:

```
you SPROUT a tree onto a grove       the crew begins
you FELL  a tree                     the crew ends
you PRUNE a grove                    the machine is cut back; every crew survives
```

## .the enumeration — every act the word must cover

per `rule.require.enumerate-before-you-name`, tested against the whole set rather than the one case
in hand:

| the act | `kill` | `reap` | `purge` | `cull` | **`prune`** |
|---|---|---|---|---|---|
| end 3 runaway `nvim`, spare 8 idle ones | ⛔ no selectivity | ⛔ | 🔴 says the opposite | ⚠️ selective, but by *worth* | ✅ |
| end every `nvim` (`--where-cpu-over 0`) | ✅ | ✅ | ✅ | ✅ | ✅ (the degenerate case) |
| ⚠️ leave every crew, tree, and record intact | ⛔ silent on it | ⛔ | ⛔ | ⛔ | ✅ implied — a pruned plant lives |
| be the FIRST remedy tried, before a fell | ⛔ reads terminal | ⛔ | ⛔ | ⛔ | ✅ reads routine, and it is |

the failures split three ways, which is what the rule predicts:

- **`kill` is FORBIDDEN elsewhere already.** `term=fell` lists it as a forbidden synonym of the
  tree verb. to adopt it here would revive a word this repo has already ruled out once, and worse —
  it would make the two most different acts in the fleet share a name.
- **`purge` and `cull` are too TOTAL.** both mean *"remove the unwanted from a set"*, with no claim
  that the remainder is what mattered. `purge` is the honest name for `--where-cpu-over 0`, which is
  why the say file uses it there and only there.
- 🔴 **`reap` is the near miss, and it fails on the third row.** in unix a reap collects a process
  **already dead** — a parent reaps a zombie. it names the *cleanup after* a death, never the death
  itself. `term=phantom._.choice.reason` already leans on that exact canon (*"a zombie is substance
  with no reaper"*), so `reap` is taken by a neighbouring concept and means the wrong half of it.

## ⚠️ .the caveat the enumeration surfaced — `--where-cpu-over 0` IS a purge

the say file admits this rather than hides it: at a floor of zero the act stops being a prune by
its own definition, since it clears the ground rather than cuts back overgrowth.

that is a **known, deliberate stretch**, and it is bounded three ways:

- it is never the default — the floor is typed out
- the render still names it honestly (`over 0% cpu — 4`), never as a prune of runaways
- the human asked for exactly this on 2026-09-07 (*"kill all the nvim's on that machine"*), so the
  case is real rather than hypothetical

⇒ the alternative was **two verbs**, `prune` and `purge`, parted only by a number. that trades one
stretched edge for a fork every caller must settle before they can act, and the fork would be
settled by the same number anyway. the stretch is one value of one flag; a second verb is a
permanent choice. **stretched knowingly, and recorded here so the next author does not re-derive
it.**

## .disputes

### dispute: `--limit` as the flag name — raised 2026-09-07 — status: RESOLVED (renamed)

- raised.by  = the human, on first sight of the output
- claim      = the flag was authored as `--limit 100`, meaning a cpu-percent floor. the human read
               it and asked *"what do you mean `--limit 100` — both are spared?"*
- counter    = none. `limit` reads as a **count cap** — "kill at most N" — which is the opposite
               kind of quantity from a per-process threshold. the reader's parse was the correct
               parse of the word; the surface was wrong
               (`rule.forbid.ambiguous-labels`, `def.ergonomic` — unambiguous)
- resolution = renamed to `--where-cpu-over`, which names the predicate it is. recorded as evidence
               rather than merely fixed: the defect was invisible to its author and instant to its
               first reader, which is the general shape of an ambiguous label

## .evidence

### the measured case — 2026-09-07, `grove-ahbode-v20260901`

4 cpu · 31G ram, ~15 live clones. the human's report: *"the machine is defo sluggish now."*

```
runq 35 on 4 cores  ·  idle 0%  ·  cpu stall some 98.87% @10s
11 × nvim  ·  ~6.2G ram · ~43% cpu between them  ·  19.7% down to 0.0%
```

after: *"that really helped improve the speed of that box."*

⚠️ **the grove was not over-subscribed on crews.** the extant remedy — the concurrency ladder in
`rule.require.bound-grove-concurrency-by-saturation` — offers wait, fell, move, resize. every one
would have cost real work and cured none of it. **the correct act had no verb, which is how the gap
surfaced.**

### 🔴 the finding that changed the skill — a slow exit read as a defiant one

the first draft sent `SIGTERM`, waited **5s**, and escalated to `SIGKILL` over the survivors. six of
eleven exited at once; five were still listed, and the header called them *"deaf to TERM by
definition."*

**three of those five then exited on their own, minutes later, with no second signal.**

⇒ so the claim was false. on a grove at `runq 35` a process may wait minutes to be scheduled at all,
and nvim's TERM handler writes swap files to disk before it returns. **a short grace measures the
grove's LOAD, never the process's defiance** — and converts a slow clean exit into a SIGKILL, which
is the lost-buffer outcome TERM was sent to avoid.

🔴 **the instrument would therefore have been most destructive exactly when it was most needed**, on
the most saturated groves. grace is now 60s, polled rather than slept, and the render reads
*"outlasted the grace"* rather than *"ignored TERM"* — a weaker claim, and the only one measured.

## .see also

- `term=fell._.choice._.md` — the tree verb, and the three off-verbs this is the fourth of
- `term=grove._.choice._.md` — the boundary; a prune is an act upon a grove
- `term=duct.pane.husk._.choice._.md` — what a prune leaves if aimed at a clone
- `term=false-report._.choice._.md` — `kill` reports a signal sent, never a process dead
- `rule.require.enumerate-before-you-name` (bhrain/learner) — the discipline the table above runs

---

written by human + beaver 🦫
