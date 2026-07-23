# handoff: two `def.*` briefs for the ergonomist to declare

## status: ✅ fulfilled (2026-07-21)

both briefs landed in the ergonomist role. they ship from the worktree
`rhachet-roles-ehmpathy.vlad.fix-architect-rules` at:

- `src/domain.roles/ergonomist/briefs/fundamentals/def.frictionless.md`
- `src/domain.roles/ergonomist/briefs/fundamentals/def.ergonomic.md`

the two 5.3 self-reviews now cite them **by name** (`def.frictionless` /
`def.ergonomic`), NOT by full path, and drop the inline checklists. by-name is
deliberate: the ergonomist already moved these into a `fundamentals/` subdir after the
first drop, so any hardcoded path would have broken. the booted clone has the whole
ergonomist role in context, so the brief name is enough to find them and survives
future reorganization.

**one dependency remains:** the def briefs live in the ehmpathy package. a consumer
repo only sees them at `.agent/repo=ehmpathy/role=ergonomist/briefs/def.*.md` once
ehmpathy is released and the consumer re-links its roles. until that release lands, a
booted clone on a new behavior route cannot read the cited path — so the guard pointer
resolves only after the ehmpathy release ships.

---

## the ask (original)

please declare two definition briefs in the ergonomist role, so the 5.3 verification
self-reviews can cite one authoritative source instead of an inline checklist:

- `def.frictionless.md`
- `def.ergonomic.md`

both are **positive definitions** (what each term IS), to complement the extant
hazard-framed rules (what to avoid).

## why the ergonomist owns these

- "frictionless" and "ergonomic" are ergonomist-domain terms — the ergonomist is the
  natural authority for their definition.
- the 5.3 self-reviews `has-critical-paths-frictionless` and `has-ergonomics-validated`
  currently inline a ~15-line checklist each because no canonical definition exists to
  point at. that duplicates the definition and lets it drift.
- once these briefs land, each self-review prompt shrinks to a one-line pointer:
  > "frictionless" is defined by `def.frictionless` — read it, then paste a runthrough
  > per critical path and score it against that rubric.

## what is extant today (do not re-declare — cite these)

| concept | brief | repo |
|---------|-------|------|
| surprises | `rule.forbid.surprises` | ehmpathy/ergonomist |
| friction hazards | `rule.forbid.friction-hazards` | bhuild/behaver (mis-homed — see note) |
| output shape | `rule.require.treestruct-output` | ehmpathy/ergonomist |

note: `rule.forbid.friction-hazards` is pure ergonomics but sits under
`bhuild/role=behaver/.../behavior.execution/architect/`. consider a re-home to the
ergonomist, or have `def.frictionless` cross-reference it as the hazard counterpart.

---

## draft: `def.frictionless.md`

> ready to adopt — this is the checklist the 5.3 self-review inlines today.

```md
# def.frictionless

## .what

a path is **frictionless** when a human walks it without stumble, surprise, or
guesswork. friction is the negative; this is its positive definition — the rubric a
reviewer scores a real runthrough against.

## .the rubric

a path is frictionless when its actual runthrough shows ALL of:

- **no surprises** — every step behaves as a human expects (principle of least
  astonishment); no result that makes the user go "wait, what?"
- **no unexpected error, stack trace, or stall**
- **no undiscoverable step** — every required step is prompted or documented; the user
  never has to guess the next move
- **defaults match the common case** — the bare invocation does the expected work; no
  flag is forced that could be inferred
- **failures are loud and legible** — an error names the fix, not just the symptom

## .see also

- `rule.forbid.surprises` — the least-astonishment hazard
- `rule.forbid.friction-hazards` — the friction hazards to avoid (the negative form)
- `def.ergonomic` — the i/o-shape companion definition
```

---

## draft: `def.ergonomic.md`

> ready to adopt — this is the checklist the 5.3 self-review inlines today.

```md
# def.ergonomic

## .what

an **ergonomic** input/output contract fits the human, not the machine — its names,
defaults, shape, and errors match what a human expects and needs. this is the positive
definition a reviewer scores captured i/o against.

## .the rubric

an i/o contract is ergonomic when the captured i/o shows ALL of:

- **names read as a human expects** — arg/flag/field names use plain domain words, no
  jargon, no cryptic abbreviations
- **defaults match the common case** — the bare invocation does the expected work
- **output is scannable** — structure and alignment are preserved; a human parses it at
  a glance
- **errors name the fix** — a bad input says what to do, not just that it failed

## .see also

- `rule.require.treestruct-output` — the scannable-output standard
- `rule.forbid.friction-hazards` — the name, default, and error-clarity hazards
- `def.frictionless` — the path-walkthrough companion definition
```

---

## after the briefs land

the two 5.3 self-reviews drop their inline checklists and cite `def.frictionless` /
`def.ergonomic` directly. i (or whoever tunes the guard next) will make that edit in
`src/domain.operations/behavior/init/templates/5.3.verification.guard` once the briefs
are declared. until then, the inline checklists stay as the live rubric — they already
name these briefs as the intended home.
