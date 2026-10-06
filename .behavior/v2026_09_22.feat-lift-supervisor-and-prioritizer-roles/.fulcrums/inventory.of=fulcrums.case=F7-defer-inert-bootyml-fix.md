# F7 — defer the inert `boot.yml` fix for dispatcher + dreamer

| | |
|---|---|
| **rework** | 🔴 **dirty** |
| **status** | best-guessed |
| **confidence** | 88% |
| **where** | `case=3` "the second door" · `review/self/for.1.vision._.r1.has-grounded-in-reality.md` · `.dream/2026_09_22.fix-inert-bootyml-dispatcher-dreamer.dream.md` |

## .the fork, stated fairly

the r1 self-review found a live defect in this repo, adjacent to the lift but not part of it:

```
4 roles ship a boot.yml   — behaver · decomposer · dispatcher · dreamer
2 roles declare  boot:    — behaver · decomposer
```

⇒ `dispatcher/boot.yml` and `dreamer/boot.yml` are never read. both are empty curation today, so
it is **latent**, not live.

## 🔴 .STAKES RAISED at i010 — it is no longer purely latent. it BLOCKS a repair `#325` asks for

this file's whole case for a defer rests on the word **latent**: *"both are empty curation today, so
to declare them changes no behavior."* that is still true of what is IN the files. it is **not** true
of what wants to go in.

`#325` names its governed roles in its own header:

> **role** = `supervisor` (and **`dispatcher`**, which owns the radio skills)

and it hands this repo an open question whose answer the lift can give structurally:

> *"do the words belong to the supervisor, the dispatcher, or both? … the vocabulary may want to live
> in one and be **cited by the other**."*

| the half | status |
|---|---|
| supervisor **homes** it | ✅ verified — `supervisor/boot.yml:223`, at `say` level, named a REFLEX at `:219` |
| dispatcher **cites** it | 🔴 **owed, and blocked** — `grep sprout dispatcher/boot.yml` → **0 matches** |

### 🔴 .the citation is blocked THREE ways, and each is a separate wall

1. **`F7` itself** — `getDispatcherRole.ts` declares no `boot:` field (only a hook that *calls*
   `roles boot`), so any entry added to `dispatcher/boot.yml` **would not load**
2. **no `briefs/` dir** — the dispatcher's whole role dir is `boot.yml` · `getDispatcherRole.ts` ·
   `keyrack.yml` · `readme.md` · `skills/`. there is nowhere for a dispatcher brief to live
3. **no cross-role path precedent** — every boot entry in this repo is `briefs/…` relative to its own
   role dir. `grep '\.\./' src/domain.roles/*/boot.yml` → **0 matches**

⇒ 🔴 **and (1) is the one that makes a "fix" actively harmful.** to add a `ref` to an inert
`boot.yml` produces an entry that **looks wired and is not** — which is the exact defect `F7`
describes, deliberately re-created, and strictly worse than the gap it papers over.

### ⚠️ .what this changes, and what it does NOT

| | |
|---|---|
| the **verdict** | ✅ **unchanged — still defer.** the SAFE/CLEAN split below is untouched |
| the **cost** of the defer | 🔴 **raised.** it is no longer "a trap nobody trips"; it is a precondition for a delegated question from an open radio issue |
| the **confidence** | 88% → 🟡 **85%.** the argument for the defer is the same; the harm on the other side is now nameable |

⇒ **stated plainly for the council: `F7` is a two-line fix that gates a third-party ask.** a reviewer
who reads it as tidy-up will under-price it, and this note exists so that misread is not available.

🟡 **and the order of the three walls is worth a sentence**: even with `F7` fixed, walls (2) and (3)
stand. so the dispatcher citation is not one fix but three, which is itself an argument that it
belongs in a follow-on rather than smuggled into a 77,742-line diff.

| branch | consequence |
|---|---|
| fix it now, in this PR | two lines in two files; the repo stops its silent trap while the lift is fresh in mind |
| defer it — dream + this fulcrum | the PR stays scoped to the lift; the trap survives until someone works `#234` |
| fix it now **and** add the guard test | the strongest outcome, and net-new work with its own A/B design call inside a PR already at ~77,742 lines |

## .taken, and why at the time

**defer.** a dream is caught, symlinked into this route's `dreams/`, and this row records the call.

the SAFE/CLEAN test (`rule.always.fix-forward-under-scouts-honor`) splits:

- **safe?** ✅ — both `boot.yml` files are empty, so to declare them changes no behavior today
- **clean?** 🔴 — it lands in `getDispatcherRole.ts` and `getDreamerRole.ts`, two files this lift
  does not otherwise touch

⇒ safe-but-unclean is the row the rule sends to a **defer + fulcrum**, and that is exactly what
this is. a two-line fix inside a 77,742-line diff is invisible to review, which is the precise
harm the CLEAN question exists to catch.

## .rework, and why it is dirty

not because the fix is hard — it is two lines. because the **deferral** is what ripples: whoever
picks up `#234` (*"add say-level howto in dispatcher boot.yml"*) will write curation into a file
that does not load, and will lose time to a defect we knew about and did not fix.

⇒ the cost of a wrong call here is paid by a **different person, later, with no context** — which
is the shape that makes a cheap fix expensive.

## .confidence, and why it is 88%

the scope argument is strong and the rule's test lands cleanly on "defer". the 12%:

- the fix really is **two lines**, and a reviewer could fairly say the CLEAN test is read too
  strictly for a change this small
- the dream may sit for months. `#234` has been open since the 200s and is still queued — so
  "someone will hit it soon" is an assumption, not a fact
- 🟡 the **guard test** (assert every `boot.yml` has a declaration) would protect the *two roles
  this lift adds*, which makes it arguably in-scope after all. i judged it net-new work; a
  reviewer could judge it part of `case=3`'s pit-of-success and be right

## 🟡 .the verdict — 2026-09-22, and the wisher's answer does NOT reach this row

> **the wisher: *"boot.yml can be modified its fine"***

that settles a **different** question — whether the two *lifted* `boot.yml` files may be amended in
transit (yield question 4: do-not-edit vs do-not-re-curate). ⇒ **do-not-re-curate**, so the
handoff's §3.2 amendment (`false-report` + `partial-audit` → `ref`) lands with the port.

🔴 **this row is not that.** F7 is about two `boot.yml` files **already in this repo** that no role
declares, and the fix is in `getDispatcherRole.ts` / `getDreamerRole.ts` — TypeScript, not yaml.
no answer about yaml edits touches it.

⇒ **the defer stands**, on the CLEAN test alone, and this file is the record that the two questions
were kept apart rather than conflated.

🟡 one shift, mild: the answer removes the *"is any boot edit even permitted?"* hesitation from the
guard-test branch. so the 12% doubt below — *"the guard test is arguably in-scope"* — is now the
live residue, and `case=3` `[t8]`/`[t9]` is where it gets settled.

## 🔴 .a defect in my own inventory, found while i recorded this

the summary file states:

> *"only `F2` and `F4` [reached the council], and both for the same reason: **the rework is
> dirty**."*

**this row is marked `dirty` and was NOT escalated.** so the summary's stated rule has an
unacknowledged exception, and a reader who trusts it would conclude F7 is clean.

⇒ the rule as written is wrong. the true test is **dirty AND not settled by an extant authority**:

| row | dirty? | escalated? | why |
|---|---|---|---|
| `F2` | 🔴 yes | ✅ yes | no authority settles where a vocabulary lives |
| `F4` | 🔴 yes | ✅ yes | a release-surface change, and the premise was mine |
| `F7` | 🔴 yes | ❌ **no** | 🔴 **`rule.always.fix-forward-under-scouts-honor` settles it** — safe-but-unclean is a defer, by the rule's own table. the council is not owed a call a rule already made |

⚠️ and the shape is the one that cost this stone nine finds: **a summary written once, then
trusted rather than re-derived.** it survived six peer rounds in the file that indexes every other
fulcrum.

---

written by human + beaver 🦫
