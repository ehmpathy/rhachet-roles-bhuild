# domain.term.choice.reason: fell

## .etymology

**forestry — and the metaphor already carried weight before this term was paved.**

the repo's creation verb is `sprout` — *"a sprout breaks ground"* (`term=sprout._.choice._.md`),
chosen against `seed` for a tree that starts work now. its counterpart was never itemized, yet it
was already in use everywhere the domain spoke:

| where | the words, verbatim |
|---|---|
| `git.release.poll.sh` verdict | `🪵 merged — pr #298 landed — fell it` |
| `git.crew.poll.sh` summary | `🪵 53 to fell — rhx git.tree.del --name <tree>` |
| `git.tree.del.sh` header | *"this skill is the exact inverse: it **fells** the whole setup"* |
| `rule.require.clarify-radio-push-vs-pull` | *"the tree had to be **felled**"* |
| `define.sprout-vs-seed.md` | *"a sprout that should have been a seed costs a **fell**"* |
| `term=crew._.choice._.md` | *"a **felled** tree's stale rows"* |
| `feedback_fell-verify-before-duct-stop` (memory) | *"verify a **fell** landed"* |

so `fell` was **discovered, not invented** — it satisfies
`rule.require.domain-discovery-for-term-proposals` on the strongest evidence there is: the domain
had spoken it for months, in prose, while the skill surface used another word.

the word is right on its own merits too. to **fell** a tree is transitive, terminal, and specific —
you fell a tree; you do not fell a window or a conversation. that specificity is exactly the
boundary the term needs, because the fleet has two other off-verbs that must not blur into it.

## .the human's own words

> *"how about git.crew.fell should just fell the tree and the record"*
> — 2026-08-25

and, on the layers, one line later:

> *"that way git.tree is used by git.crew, but is independent layer"*

both rulings landed in the implementation intact: `crew.fell` delegates wholesale to
`git.tree.del` and adds exactly one act on top.

## .disputes

### dispute: del — raised 2026-08-25 — status: RESOLVED (keep `fell`, `del` survives one layer down)

- raised.by = beaver (self, against the extant skill name `git.tree.del`)
- claim = the repo already ships `git.tree.del`, and `rule.require.get-set-gen-verbs` names `del`
  as one of the four sanctioned core verbs — *"del = idempotent delete (findsert-inverse);
  canonical across declastruct (delVpc, delEc2Instance); do NOT rename del* to set*"*. so a new
  crew-layer verb should be `git.crew.del` for symmetry with its own rule.
- counter = the two words sit at **different layers**, and both are correct at theirs.
  `get-set-gen-verbs` governs **domain operations** — a mechanical vocabulary for reads and
  mutations. `fell` is a **domain act**: it names what a supervisor does to a tree, in the
  supervisor's own language, which `rule.require.speak-at-the-supervisor-layer` mandates be
  *"crews, trees, groves, camps"* rather than substrate.

  the tell that settles it: **every poll verdict in the repo already reads "fell it".** a
  supervisor who reads `fell it` and must then type `del` translates between two vocabularies for
  one act — the exact friction `rule.require.ubiqlang` forbids.

  and the pair matters. `sprout ↔ fell` is symmetric in register, in metaphor, and in
  irreversibility (`rule.prefer.symmetric-term-pairs`). `sprout ↔ del` is not: one is forestry and
  one is a database row.
- resolution = keep `fell` for the crew-layer act; `del` stays canonical for the mechanical
  row-removal beneath it (`__crew_ledger_del`, `git.tree.del`). **not a synonym pair** — they name
  different grains, and both names are used in this round's code at their own layer.

### dispute: stop — raised 2026-08-25 — status: RESOLVED (they are distinct concepts)

- raised.by = beaver (self)
- claim = `crew.stop` already turns a crew off; a third off-verb risks overload.
- counter = `stop` is a **pause**, not a terminal. a stopped crew can be re-booted onto the same
  tree, and its ledger row deliberately survives — `crew.stop` now says so in its own output:
  *"the ledger row STAYS — a stopped crew is still a crew"*. fell is what has no re-boot.

  the three off-verbs act on three lifetimes at three costs (hide/view/free,
  stop/work/irreversible-conversation, fell/crew/irreversible-tree), and to collapse any two would
  bundle a cheap act with an expensive one — the same argument `term=crew._.choice._.md` uses to
  refuse a composite off-verb.
- resolution = three off-verbs, three words. no overload.

### dispute: retire — raised 2026-08-25 — status: RESOLVED (keep `fell`)

- raised.by = human — *"whyd we say crew.fell instead of crew.retire or something like that?"*
- claim = **`fell` takes a tree as its object; `retire` takes people.** a crew is clones, so
  `crew.fell` reads as a category error — you retire a crew, you fell a tree. `retire` is
  grammatical, apt to the subject, and reads well beside `boot`.
- counter = four, and the second is the one that decides it.

  1. **the namespace names the LAYER, not the direct object.** every verb in the cluster
     already works this way: `crew.boot` acts on ducts, `crew.show` on kitty tabs, `crew.stop`
     on tmux sessions. none takes the crew as its literal object. so the sentence is not *"fell
     the crew"* but *"at the crew layer, fell"* — and the category mismatch dissolves.

  2. **`retire` hides the blast radius, and that is disqualifying.** this act destroys a
     worktree and deletes a branch. in software, `retire` conventionally means **deprecate** —
     the thing still exists, merely unused. a reader who types `crew.retire` does not expect
     their branch to be gone. `rule.require.safe-by-default` and `rule.forbid.ambiguous-labels`
     both demand that a destructive verb SOUND destructive. `fell` does; `retire` actively
     misleads.

  3. **`fell` was already the domain's word**, in seven places, months before this round (see
     `.etymology`). `retire` would be a NEW word for an act the domain already names —
     `rule.forbid.term.addition.synonym` on its face.

  4. **it breaks the pair.** `sprout ↔ fell` is symmetric in register and metaphor;
     `sprout ↔ retire` is forestry against HR.
- resolution = keep `fell`; `retire` recorded as a forbidden synonym.

  **where `retire` WOULD have won:** if the verb ended the crew and left the tree standing. that
  act exists — it is `crew.stop` — and `stop` is deliberately the weaker word there, because
  that one IS reversible. the strong/weak pairing already runs the right way round.

## .evidence

### the discovery move: listen to how folks talk

per `howto.domain-discovery`, move 1 — capture the exact words from both the expert and the
prose, and **do not translate either**. the seven citations in `.etymology` are that capture. the
word was unanimous in prose and absent from the skill surface, which is the signature of a term
that was discovered and never itemized.

### the invariant the term encodes

fell is the only verb in the crew cluster whose ORDER carries a safety property:

```
tree felled?  ──no──>  ledger row STAYS, exit 2
      │
     yes
      ↓
ledger row dropped
```

verified live on 2026-08-25 against `sql-dao-generator.beav.fix-truthful-runtime-types`: the gate
refused (`foreman duct unreachable`), the skill exited 2, and `git.crew.ledger` still listed 14
rows with that tree among them. the record survived a refused fell, which is the property the
order exists to guarantee.

### an open defect the term surfaced, and did not cause

`git.tree.del` runs its safety gate by a `duct.send` of `git tree del --this` **through the
foreman duct** — so the tree layer currently depends on a live crew. that inverts the split the
human named (*"git.tree is used by git.crew, but is independent layer"*).

the consequence is measured: of the 53 trees the disk-derived poll flagged to fell,
`git.tree.del` cannot touch any that never had a crew. a clean split would run the gate via
`git -C $treedir`.

**recorded, not repaired.** it is the safety gate for destructive work, and it deserves its own
pass rather than a ride-along on a term round.

## .see also

- `term=sprout._.choice._.md` — the symmetric creation verb this pairs with
- `term=crew._.choice._.md` — the hide/stop axes fell is the third of
- `term=ledger._.choice._.md` — the record fell drops, and only on a confirmed tree removal
- `rule.require.speak-at-the-supervisor-layer` — why the supervisor's word wins over the mechanical one
- `rule.prefer.symmetric-term-pairs` — the sprout/fell shape
- `rule.require.get-set-gen-verbs` — the `del` this dispute parts from, one layer down

---

written by human + beaver 🦫
