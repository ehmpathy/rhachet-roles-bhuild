# domain.term.choice.reason: spiral

## .etymology

**`spiral`** is borrowed from its ordinary English sense — a curve that circles a point while its
radius changes monotonically. that is the exact shape of the concept: motion that returns to the
same angle each turn, and arrives **further from the centre** each time.

the alternatives, and why each fails:

| word | why it is forbidden |
|---|---|
| `vicious cycle` | two words for a one-word concept, and `vicious` names a moral quality the domain does not measure. a spiral is a mechanism, never a fault |
| `death spiral` | the modifier is redundant — every spiral in this glossary trends the wrong way — and it overstates: the review spiral costs budget, never a life |
| `feedback loop` | 🔴 the genus, not the differentia. a thermostat is a feedback loop and it converges. this word names only the divergent kind, the kind that deepens itself (`rule.require.enumerate-before-you-name`) |
| `deadlock` | a term of art for **no** motion. a spiral moves constantly, which is what makes it expensive |
| `livelock` | the nearest miss — motion without progress. a spiral has **negative** progress, caused by the motion. see the say file's discriminator |
| `thrash` | names a resource symptom (a machine that swaps rather than computes). it describes a cost, never the causal loop |
| `doom loop` | slang, and it carries no test a reader can run |

## .why it was DEFERRED one round, and what woke it

`spiral` was met on 2026-09-05 and deliberately left unpaved that round. the record of the
deferral, verbatim from the day's progress file:

> ⚠️ **that is two greps, not an enumeration.** and one of the two is foreign, so it is not even
> this repo's to canonize alone. […] ⇒ **no cluster paved.** wake condition: **a third use, from
> a route other than these two.**

at that moment the word had exactly two homes — the foreign `debug spiral` in
`rule.always.diagnose-reviewer-malfunctions` (bhrain/driver), and the freshly-written
`rule.always.break-the-zero-commit-review-spiral` in this repo.

⇒ **the wake condition fired later the same day**, from a subdomain neither instance touched: a
clone parked at a human gate, dead of its own stop-hook loop, whose death then concealed the gate
that parked it (`term=duct.pane.husk`).

⚠️ **that third instance is what made the word paveable, and it is worth a note why.** the first
two both live in the REVIEW machinery — a reviewer that will not settle, and a diff that blinds
one. a term drawn from those two alone would have been a review term under a general name, and
its `.what` would have leaned on lanes and budgets. the third has no reviewer, no diff, and no
budget in it at all, and it satisfies the definition unchanged.

⇒ this is the disposition `feat-peer-review-parallelism`'s mechanic modelled the same day for
`event`, `pool`, and `parallel` — *"I have two greps, not an enumeration"* — and the deferral is
what let the third instance shape the definition rather than merely confirm a guess.

## .the evidence

### instance 1 — the debug spiral (foreign, undated here)

`rule.always.diagnose-reviewer-malfunctions` (bhrain/driver): *"one honest diagnosis pass, never a
debug spiral."* the effort is retries; each spends a round and learns naught.

⚠️ **cited as foreign and not adopted as this repo's own** — a peer repo's brief is a legitimate
citation only when marked (`rule.always.reuse-pavement-before-improvise`).

### instance 2 — the zero-commit review spiral, 2026-09-05, n=2 trees

a branch with zero commits makes `merge-base` equal to HEAD, so `--diffs since-main` scopes every
lane to the whole uncommitted tree. **every artifact the drive writes to satisfy a lane enlarges
the diff that blinded it.**

measured on `fix-keyrack-all-skips-manifest` (23,509 insertions, 208 files) and
`fix-node-pty-install` (nine lanes overflowed) — verified by `gh pr list`, neither branch pushed.

the trapped party named the cost better than the rule first did:

> *"I'm not running r3/r4 — you've shown they'd misattribute exactly as r2 did, so those turns
> would manufacture findings I'd then decline. that isn't convergence, it's **noise with a
> citation**."*

### instance 3 — the parked-clone death spiral, 2026-09-05

`feat-thinker-notes-overflow/mechanic`, husked a second time. its scrollback, verbatim:

```
● One thousand two hundred twenty-fifth run. Unchanged.
  🦉 parked on 1.vision. 🍵
✢ Puzzling… (running stop hooks… 0/2 · 1h 12m 38s · ↓ 673 tokens)
```

the loop, and every step of it is forced: a clone parks at a human gate it may not open → it
tries to rest → a stop hook fires → the hook cannot grant the gate either → **× 1,225** → a hook
run wedges → SIGTERM → a husk → the husk's box is non-`empty` → no stone renders → **the gate
drops out of the `🙋` tally** → it is less likely to be relayed → the wait lengthens.

🔴 **the closed loop is what makes this a spiral rather than mere attrition.** the clone's death
is not a side effect of the wait; it is a cause of a longer wait.

## 🔴 .the strongest counter-argument, stated fairly

> *"three instances that all come from ONE observer, in ONE day, on ONE fleet. that is not an
> enumeration either — it is one supervisor's pattern-match, and a word paved off it may be a
> lens rather than a fact of the domain."*

this holds, and it is not fully answered. what parts it from the two-grep case that justified the
earlier deferral:

- the three sit in **three subdomains** with disjoint machinery — no shared reviewer, diff, or
  clone state. a lens tends to produce instances that resemble each other
- instance 1 is **foreign and predates** this observer entirely, so the word was already in the
  vocabulary with this sense before any of the measurements
- the definition makes a **falsifiable prediction** — *"if the drive did less, the trap would be
  shallower"* — which a future instance can fail

⇒ **what would overturn it:** a stuck state that satisfies *"the effort deepens the trap"* and
whose right cure IS more of the same lever. that would show the supervisor rule in the say file
is wrong, and with it the reason the word earns a slot.

## .see also

- `term=duct.pane.husk._.choice._.md` — instance 3, and the loop it closes
- `term=false-report._.choice._.md` — the review spiral's quiet mode lands in its reader-inference
  family, cause `scope`
- `rule.require.enumerate-before-you-name` (bhrain/learner — **foreign**) — the rule that forced
  the deferral, and the rule the third instance satisfied

---

written by human + beaver 🦫
