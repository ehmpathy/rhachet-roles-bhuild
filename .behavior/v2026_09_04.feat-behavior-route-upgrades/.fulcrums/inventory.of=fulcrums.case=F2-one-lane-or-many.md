# F2 — one prose peer lane, or one lane per prose rule

**rework** = clean · **status** = 🔴 **CLOSED** — wisher verdict, 2026-09-07 · **confidence** = 88% → **96%**

## 🔴 the verdict — one lane, for prose

> *"one for prose"*

⇒ **one peer lane, which cites all three telepath rules.** and the words settle branch 3 in the same
breath: *for prose* scopes the lane to the prose rubric, so the prose/yagni merge is **not** taken —
`#354` keeps its own lane.

```sh
rhx review --mode hard \
  --rules '.agent/repo=bhrain/role=telepath/briefs/rule.{forbid.subversive-prose,forbid.chronological-accretion,prefer.dense-prose}.md' \
  --paths-with '$route/*.yield.md'
```

🔴 **no `--optional rules`** — see `$route/.seeds/inventory.of=seeds.case=S3-*`. the rules ship in a
parallel bhrain tree, so an absence must **malfunction** rather than skip-and-approve.

## ✅ why the residual doubt was already gone

the 88% priced one worry: *"if accretion must block while density must not, one lane returns one
verdict and cannot express the split."*

🔴 **that premise was false, and F1's closure is what exposed it.** the reviewer contract tallies
**per item**, never per lane — `contract.reviewer-output` requires a numeric count for **both**
severities from one stdout, and states outright that a section header is prose while *"each item
under them still resolves to blocker OR nitpick"*. so mixed severities in one lane are the **normal**
case, not a strain on it.

⇒ the fork was priced against a mechanism i had not read. the same shape as F1, F3, F4, F6, F7 and
F11 on this route — **the seventh row whose doubt a read closed rather than a judgment.**

## the residual 4% — and half of it is now closed

the three rules are **bhrain's** (F3), so the brace expands to three literal filenames in another
repo, and **one lane means one point of failure rather than three.**

| the failure | caught? |
|---|---|
| the rules **never ship** | ✅ **yes, loudly.** with no `--optional rules`, a zero-match glob throws → the guard grades it a malfunction → the stone blocks |
| a rule is **renamed** | 🔴 **partly.** the same throw fires, so it is loud — but it fires at drive time, on whoever next drives a route, rather than on whoever renamed the file |

⇒ so the strict flag converts the whole class from **silent approval** into **loud malfunction**.
what remains is that the alarm rings in the wrong repo. the handoff names the three exact filenames
so the telepath knows a rename breaks a downstream consumer.

---

🟡 **the original branch analysis is preserved below, unrevised.**

## the fork

the extant guards use **one lane per rule** — `mech-failhides`, `arch-smell-scopeleaks`, and so on,
each with its own `--rules` glob and its own budget. `lang.prose/` holds 5–8 rules.

| branch | for | against |
|--------|-----|---------|
| **one lane**, `--rules 'lang.prose/rule.*.md'` | the whole rubric is ~700 tokens, and one lane means one budget, one verdict, one place to tune. 🟡 the *rubric* is small; the **subject** is not — see fact 2 below | diverges from the extant one-lane-per-rule convention. a single verdict cannot separate an accretion blocker from a brevity nitpick |
| **one lane per rule** | matches convention. each rule keeps its own budget and severity, which F1 wants | 5–8 new lanes on every guard for one concern — the exact "nine bolted-on reviewers" shape the wish forbids |

## what i took, and why at the time

**one lane.** the wish is explicit that these must land as one coherent design rather than a pile of
reviewers, and the rubric is small enough that per-rule separation buys no context relief. the
extant convention exists because those rules are large and unrelated; `lang.prose/` is one small,
cohesive cluster with a shared persona (`define.wick-dense`).

## why 88%

high, because the cost of a reversal is one line per guard. the residual doubt is how tightly F1
binds to this: if accretion must block while brevity must not, one lane returns one verdict and
cannot express that split. two lanes — `prose-accretion` (blocker) and `prose-density` (nitpick) —
may be forced.

that is still "one design, two lanes", not eight. i note it here so the council can rule F1 and F2
together.

## two facts found after this row was written

### 1. the peer lane rests on #356 alone, not on the cluster

i had treated "a prose peer lane is owed" as settled by the cluster. read at source, it is not:

| issue | its exact ask | needs a peer lane? |
|-------|---------------|--------------------|
| #350 | *"a self-review **or** guard rubric that grades every `*.yield.md`"* — the **or** is the issue's own | no |
| #347 | prose graders in the `1.vision` guard | no |
| #357 | a howto for high-signal stage artifacts | no |
| #351 | *"add **self + peer** reviewers that grade artifact terseness, density, directness"* | **yes** |
| #356 | *"**peer + self** review — terseness and signal vs noise, zero excess terms"* | **yes** |

⇒ **the self slug alone satisfies #350, #347 and #357.** the peer half is mandated by **#351 and
#356** — two issues, each of which names both halves in its own title.

🟡 so a "self only" verdict is cheaper than a five-issue retreat but dearer than a one-issue one: it
leaves **two** issues open, both of which state the peer requirement in their titles rather than in
a body clause. the council should price it at two.

### 2. the peer half faces a context gate the self half does not — but the gate is far off

the stage lanes glob `$route/1.vision.*.md`, so a peer prose lane's subject is **one route's** vision
artifacts, never a whole diff. that subject is now measured on this very route:

> `estimate: 58017` at `contextWindowPercent: 5.8`
> (`.log/bhrain/review/2026-09-04T04-42-33-761Z/metrics.expected.json`)

⇒ **5.8% of the window, against a 75% gate.** a route would need ~13x this one's vision artifacts to
overflow a prose lane. the risk is real in kind and remote in degree.

| half | faces the context gate? | how close |
|------|-------------------------|-----------|
| **self** slug | **no** — the driver reads its own artifact; there is no review prompt to compile | — |
| **peer** lane | **yes** — same mechanism as `case=004` | 5.8% of 75%, measured |

🟡 **i had this backwards in two directions, and both are worth the council's note.** i first
recorded the lane as *"~700 tokens, near-free"* — which measured the **rubric** and ignored the
**subject**. i then over-corrected to *"~245k, may overflow"* — a figure i had carried from #349's
**code-lane** measurement, where the subject is a whole diff across many route dirs. neither number
was this lane's.

⇒ so the asymmetry stands (only the self half **cannot** fail closed) but it is a **tiebreaker,
never a decider**. #351 and #356 both name the peer half in their titles, and a peer lane catches
what an author cannot see in their own prose. this argument no longer carries the weight i gave it.

### 3. a third branch exists — merge the prose and yagni lanes

both lenses ask the same question (*does this earn its place?*) of different subjects — prose of a
sentence, yagni of a component. one `rhx review` call takes two `--rules` globs.

| for | against |
|-----|---------|
| one lane, one budget, one verdict for the whole "earns its place" spine — maximally the *one coherent design* the wish demands | one verdict cannot separate a cut sentence from a cut component, and the two have different fix owners |
| the two rubrics together are still small against the narrow stage-artifact subject | #354 is a standalone issue with its own six checks; a merge buries its identity |

🟡 **i did not take this branch**, at ~80% — a merged verdict makes the driver's `.taken` ambiguous
about which subject it answers, and #354's checks are concrete enough to stand alone. recorded
because a council that wants the fewest lanes should see it exists.

## where

the `reviews.peer` block of every guard that gains prose review.

## the verdict

🔴 **one lane, for prose** — wisher, 2026-09-07. see the head of this file.
