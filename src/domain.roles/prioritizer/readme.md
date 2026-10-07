## 🔦 prioritizer

- **scale**: fleet-level, across every repo and queue
- **focus**: what matters next, and why
- **maximizes**: an honest rank over a queue too large to read

used to record and rank what is worth the spend — in dollars and in energy.

---

### .why `eco`

**economy AND ecology**, deliberately both. the two senses of *"what it costs"* are one sentence
here: a priority ranks what is worth the spend, and compute spent to re-derive unranked work is
power drawn and heat rejected (`philosophy.pavement-saves-nature`) as surely as it is money.

⇒ `eco` names the concept both words point at: **the cost of a choice, counted honestly.**

---

### .the gap it fills

the fleet has instruments for *the current state* — `git.crew.poll`, `git.grove.saturation`,
`git.crew.ledger`, `radio.task.pull`. it had **not one** for what matters next.

measured 2026-09-13: **511 open issues** across four repos, **42 crews with 0 merged**, and a
~$300/mo cost bleed the human could name out loud that appeared in **no** queue at all. the
weekly cadence that was meant to catch it (`sandpine-notebook`'s
`howto.strategy.weekly-reprioritize` — one operator's cadence, so it stays there) last ran
2026-06-05.

⇒ a queue with no rank orders itself by filename age, which is why it braids.

---

### skills

#### eco.priority

record, read, and drop a priority — `set` / `get` / `del`.

```sh
rhx eco.priority set --slug subrock://sandpine/decost/pg-upgrade \
      --sev <p0|p1|p2|p3|p5> --urg <1d|3d|1w|1m> \
      --what 'upgrade svc-lessons postgres off the extended-support version' \
      --why  'gain.cash — support fees every month. gain.time — the planner
              change may collapse the ACU problem too' \
      --ref-task sandpine/svc-lessons#12

rhx eco.priority get                                  # every priority, ranked
rhx eco.priority get --slug bigrock://sandpine          # one mainquest, rolled up
rhx eco.priority get --slug subrock://sandpine/decost   # one branch of it
rhx eco.priority get --sev p1                         # one severity
rhx eco.priority get --output rootstruct              # the board, for a human
rhx eco.priority get --output json                    # for composition

rhx eco.priority del --slug subrock://sandpine/decost/pg-upgrade
```

---

### .the goal — a rock, as a uri

🔴 **there is no `--goal`. a priority IS a goal, and `--slug` is its uri.** a second flag for
the same concept is a second name for it, and a second name drifts — measured 2026-09-14, on
44 of 44 rows. so the uri below rides on `--slug`, everywhere, and the surface refuses
`--goal` outright with a fix that names `--slug`.

| uri | the quest | what it holds |
|---|---|---|
| `bigrock://<root>` | 🪨 **mainquest** | what we committed to. **few, on purpose** — the big rocks go in first, or they never fit at all |
| `altrock://<root>` | 🪶 **sidequest** | real work, worth the spend, off the main line. the sand that fills the gaps between the rocks |
| `subrock://<root>/<path>` | 🧩 **decomposition** | a part of a root rock, nested as deep as it needs |

```
                bigrock://sandpine                     ← the ROOT. kind lives here, and only here
                         │
        ┌────────────────┴────────────────┐
subrock://…/acu-tune              subrock://…/sms-tune
        │
subrock://…/acu-tune/query-audit
```

a flat rank cannot answer *"do we actually move the objective we said mattered?"* — three
rows that each read `p1` may serve one objective or three, and a list hides which.

⇒ and the goal is the one axis that can promote a row a cash figure would demote: **a cheap
row that unblocks two expensive ones earns its place through the goal, never through its own
net.**

#### 🔴 a subrock names the root's SLUG, never its KIND

a root rock is **expected to flip**. a sidequest that earns the main line becomes a bigrock;
a mainquest we stop to defend becomes an altrock. that promotion is **one row, one field** —
and every subrock beneath it is untouched at any depth:

```
altrock://sandpine   ──promote──▶   bigrock://sandpine
  subrock://sandpine/decost/acu-tune             ← untouched
  subrock://sandpine/decost/acu-tune/query-audit ← untouched
```

encode the kind in the child and the same promotion costs a rewrite of the whole tree — and
grows more expensive the more the tree does. `goalRoot` rides derived on every row and reads
the same from the root and every descendant, **whatever kind the root wears today**. that is
the trace.

#### 🔴 a filter ROLLS UP

`get --slug <uri>` returns that goal **and every subrock beneath it**. a decomposition that
does not roll up is no decomposition — an exact match returns the root alone and omits every
row that does the work, while it reports a count that reads complete.

⚠️ and the rollup keys on the **root slug**, never the scheme. a scheme-keyed match would
break the instant a rock was promoted — on the one edit it must survive by design.

#### the shapes it refuses

| input | why |
|---|---|
| `sandpine.decost` | bare — records no *kind*, and a column that holds both shapes can never say which |
| `bigrok://sandpine.decost` | outside the closed set. left open, it silently splits the goal in two |
| `subrock://sandpine.decost` | a decomposition of naught is not a decomposition |
| `bigrock://x/y` | a root that claims a path claims to be someone's child |

🔴 **the bare form is refused on the filter too** — and that is the sharper harm: it matches
no row, so it exits `0` with an empty set. *"no priority serves that objective"*, when it
means *"you typed the wrong shape"*.

🔴 **the kind is a LENS, never a sort key.** a `p1` altrock outranks a `p2` bigrock, and that
is correct — `sev` already asks *"how bad if unfixed"*, so a human who graded a sidequest `p1`
has said it matters that much. to let a categorical label reorder would smuggle a sort key
past the opine-first invariant.

⇒ the whole shape, with the lifecycle and what would overturn it:
`briefs/goal/define.eco.rock-lifecycle-and-treestruct.md` · every word this role speaks is one row
in `briefs/glossary.of=prioritizer.md`

🔴 **`--sev` and `--urg` carry no default and no suggested value, on purpose.** they are the
one part of the record only a human may author (`rule.forbid.fabricated-opines`), and a
fibonacci ladder whose rows all start at one rung is no ladder.

🔴 **`--why` must name a cell of the 3×2 `define.cost-gain-matrix`** — `time`, `cash`, or
`rank`. *"it is broken"* restates the `--what`. *"no revenue, so not p1"* tests one row of
three (`rule.require.a-gain-cell-behind-every-sev`, `rule.forbid.sev-from-cash-alone`).

---

### .the store

`.eco/priority.db` — sqlite, per-repo, the way `.meter/` and `.route/` already are.

sqlite rather than more markdown because the queue is **already** markdown and that is precisely
what failed: a flat file cannot answer *"every p1 due this week"* or *"is this already caught?"* —
and the second one is what let the braid form.

---

### .setup — where `eco.seed` looks

`eco.seed` asks *"who else knows about this?"* across sources it is **told** to read. it names no
org's repos by default, so each source reports `⚪ NOT ASKED` until you name it:

```sh
rhx eco.seed get --for <slug> --in myorg/svc-foo --gardens 'myorg/briefs-*'
```

| flag | source |
|---|---|
| `--in <org/repo>` | gh issues, one repo per flag |
| `--gardens <glob>` | garden-seed files across the repos that match |

⇒ `NOT ASKED` is never `none`: a source you did not name was not searched.

---

### .layout

this role **owns** its skills; `role=any/skills/` carries a symlink to each contract point.
see `rule.require.roles-own-skills-any-carries-contract-points.md`.

---

written by human + beaver 🦫
