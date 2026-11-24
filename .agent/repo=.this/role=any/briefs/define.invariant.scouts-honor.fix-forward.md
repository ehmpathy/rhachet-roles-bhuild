# define.invariant.scouts-honor.fix-forward

## .what

the driver does a safe, clean, adjacent fix NOW, in-scope. only a large, dirty, or
rippling fix earns a dream.

## .kind

**nurture.** nature permits a driver to defer every fix and queue it as a follow-up. we forbid it
for the small-safe-clean case. a deferral throws away the context that made the fix cheap. it buys
that context again later, at full price. deferrals compound, and the queue proves it.

## .invariant

```
a fix earns a dream (a deferral)  ⟺  it is NOT (safe ∧ clean ∧ adjacent)

∀ fix f spotted during the work:
  safe ∧ clean ∧ adjacent   → done NOW, in the diff already open
  large | dirty | ripples   → caught as a dream (+ a fulcrum if the defer was a JUDGMENT)
```

a safe + clean + adjacent fix deferred to a dream is the violation. a dream that describes a small
in-scope fix is the tell.

## .why

`rule.always.fix-forward-under-scouts-honor`: you already paid to understand the fix — you are in
the file, you hold the context, you can see why it is right. that comprehension is the expensive
half, spent either way. to defer is to throw it away and buy it again later.

the two questions grade the FIX, never the scope: is it SAFE (touches no behavior beyond the work),
is it CLEAN (lands in the diff already open, no ripple). *"i wasn't asked to"* is not one of them.

## .scope

- covers a fix within reach of the work already underway.
- does NOT cover a large/dirty/rippling fix — that is a legitimate defer, and it owes a dream, plus a
  fulcrum if the defer was a judgment about ripple cost.
- does NOT cover a fix that belongs to another repo — that is a reseed dream.
- the dream is the second-best outcome, never the default; the fix is the first.

## .the litigation

- the claim argued: a dream is a safe default for any fix spotted mid-drive, since it loses no work
- what settled it: a dream loses the context, which is the expensive half. only a big, dirty
  refactor earns the defer; an adjacent fix is owed now. and no lane graded the defer-vs-do-now call
  at the stage the fix was spotted
- resolution: a `scouts-honor-fix-forward` peer lane at vision + execution grades
  `$route/dreams/*` — a dream that reads as a small clean adjacent fix is a blocker

## .the counter-argument

*a driver cannot always tell small from large mid-drive.* true, and the rule answers it: when
unsure, treat it as small and try it — a fix that turns out large is a revert, and a revert is
cheap. the asymmetry favors the attempt.

## .what would overturn it

it is nurture, so it falls if the cost that bought it changes: show that a deferred small fix costs
no more to re-derive later than to do now — i.e. that held context is free to rebuild. it does not
fall to *"i was not asked to fix it."*

## .enforcement

- a safe + clean + adjacent fix deferred to a dream (or a later stone) = **blocker**
  (`scouts-honor-fix-forward` peer lane, vision + execution).
- a large/dirty fix deferred with no dream = **blocker** (the record is the price of the defer).
- a dirty-defer with no fulcrum raised = **blocker** (the judgment is unreviewable).
- worked example: `.behavior/v2026_09_04.feat-behavior-route-upgrades/dreams/` — adjacent fixes dreamed.

## .see also

- `rule.always.fix-forward-under-scouts-honor` (bhrain/driver) — the SAFE/CLEAN test
- `rule.always.catch-dreams-for-followups` (bhrain/driver) — what the large half owes
- `rule.prefer.scouts-honor` (ehmpathy/mechanic) — the parent trait
- `define.invariant.fulcrum.self-sufficient-close` — the sibling: a closeable FORK, not a closeable fix
- `im_an.obsessive_learner.for.domain.invariants` (bhrain/learner) — the shape this brief follows
