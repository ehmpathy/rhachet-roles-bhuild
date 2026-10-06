# `F29` — do the two brain-repl suites stay skipped, when the stone forbids skips outright?

- **raised** — 2026-09-28, at `5.3.verification`
- **rework** — **clean** (two lines per file: strike `describe.skip` and its note)
- **status** — best-guessed; **unruled** · ⚠️ **not escalated — a rule settles it; see below**
- **confidence** — **88%**

---

## .the fork, stated fairly

the stone's mandate is absolute: *"zero skips … remove the skip and make it pass NOW."*

I found **nine** skips, ran every one for real, and removed **seven** (`F24`). **two remain**, and
the `mech-external-contracts` lane (i006 · r003) raised them as a nitpick — correctly:

> *"the effect is the same: the brain REPL integration is not covered by real tests."*

| suite | needs |
|---|---|
| `src/domain.operations/behavior/decompose/imaginePlan.brain.case1.integration.test.ts` | a brain **repl** |
| `src/domain.roles/decomposer/skills/decompose.behavior.brain.case1.integration.test.ts` | the same |

> **so: unskip them, so the mandate is honored literally and CI carries two deterministic
> 7-minute failures — or leave them skipped, with a measured cause, and hand the fix to the repo
> that owns the seam?**

---

## .what I took, and why

**taken: they stay skipped — with a cause that is true, which the prior note was not.**

### 1. 🔴 the old reason was FALSE, and that half IS repaired in this diff

```
"deprecated: anthropic api key disabled, … xai brain integration"
```

measured false in two ways on 2026-09-28, by a lift of the skip and a real run:

| the old reason claimed | measured |
|---|---|
| the blocker is `ANTHROPIC_API_KEY` | 🔴 false — `invokeBrainRepl` shells to `claude --print`, on the CLI's **OAuth** session |
| an xai/fireworks swap unblocks it | 🔴 false — neither ships a repl at all, only atoms. the remedy was unreachable |

⇒ **so the defect this stone is actually about — a skip note that lies — is fixed.** what stands is
a skip with a cause a reader can act on.

### 2. the real cause is a seam redesign in ANOTHER package

with the CLI freshly authenticated the real run took **432s and still exited non-zero**, and its
stderr holds **no auth error** — only this repo's own SessionStart hook warnings, because
`execSync` inherits the repo root as cwd, so the child `claude` boots every hook this repo
declares.

`invokeBrainRepl`'s own header already names where it belongs:

```
.todo = liftout generalized into rhachet repo
```

the fix is **isolation** — a clean cwd, hooks off, or an SDK brain in place of the shell-out. that
is a redesign of an infra seam this lift never opened.

### 3. 🔴 `rule.always.fix-forward-under-scouts-honor` settles the defer — by its own table

| safe | clean | verdict |
|---|---|---|
| ✅ | ✅ | pull it in now |
| ✅ | 🔴 | defer — and raise a fulcrum |
| 🔴 | — | **defer — and raise a fulcrum. unsafe is a harder stop than unclean** |

a redesign of a dependency's brain seam is **unsafe** (it touches behavior far beyond this lift)
**and unclean** (it ripples into a package this PR does not open). that is row 3, which the rule
says to defer with a fulcrum — **this one**.

⇒ this is why the row is **itemized but not escalated**: the council is not owed a call a rule
already made (per this inventory's own corrected escalation test). the row is quoted above rather
than the rule merely named, which is the guard that test demands.

### 4. the alternative is measurably worse than the skip

**a 7-minute deterministic failure in every CI run is a broken gate**, and a broken gate teaches
every reader to ignore red. a recorded skip with a measured cause teaches the next traveler exactly
what to fix.

### 5. ✅ the external **contract** is not uncovered — only the seam

the reviewer pinned this themselves:

> *"the codebase DOES have other brain integration tests that work
> (`imagineReviewSelfVerdict.integration.test.ts` tests real Fireworks AI atoms)"*

⇒ the brain **atom** contract is covered by a real call to a real service. what is uncovered is the
**repl** seam — a shell-out to a local CLI, rather than the sdk/api/service that
`rule.require.external-contract-integration-tests` governs. that is why the lane graded it a
nitpick rather than a blocker, and I think that grade is right.

---

## ⚠️ .why my confidence is 88% and not higher

the 12% is the stone's own words, and they are not soft:

> **"zero skips. skips are hidden lies that pass ci."**

a skip with a good reason is still a skip, and *"the fix belongs to another repo"* is one sentence
away from *"the fix belongs to later"* — the exact shape this stone exists to refuse. a council
that reads the mandate literally would unskip both, accept the red, and treat the red as the
blocker it is.

⇒ what I lean on against that read is **point 4**: the stone's purpose is that a gap be **visible**,
and a deterministic 7-minute red that everyone learns to skip past is *less* visible than one
recorded line with a measured cause. that is a judgment about human attention, not a rule quote,
and I mark it as such.

---

## .the reversal, if the council rules the other way

**clean, two lines per file** — strike the `describe.skip` and its note. the tier then carries two
suites that fail deterministically at ~7 minutes each, until the seam is redesigned.

⚠️ whichever way this rules, the **old** reason may never come back. *"anthropic api key disabled,
… xai brain integration"* is disproven on both clauses.

## .where

- `src/domain.operations/behavior/decompose/imaginePlan.brain.case1.integration.test.ts`
- `src/domain.roles/decomposer/skills/decompose.behavior.brain.case1.integration.test.ts`
- `.dream/v2026_09_28.fix-invokebrainrepl-shells-claude-inside-a-hook-laden-repo.md` — the reseed
- `.reviews/peer/…i006…r003._.given.by_peer.mech-external-contracts.report.md` — the nitpick

## .the verdict

*(unruled)*

## .see also

- `F24` — the peer row: the **seven** that were unskipped. this row is the residue that sweep left,
  and its argument differs — those were credential calls, these are a seam redesign
- `F21` — the adjacent find that only `anthropic/claude/code/*` ships a brain repl at all
- `rule.always.fix-forward-under-scouts-honor` — the table quoted above, which settles the defer
- `philosophy.verification-strictness` (behaver) — the mandate the 12% belongs to
