# define.invariant.fulcrum.self-sufficient-close

## .what

close every fulcrum you can close without the human, at the stage you opened it. only a
dirty-rework fork the human must rule reaches the terminal council.

## .kind

**nurture.** nature permits a driver to carry every open fulcrum to the end and settle them in one
terminal pass. we forbid it, because a driver who reads a vision fulcrum at the terminal stone reads
it with the vision context gone — so the driver misses the cheap close and asks the human what it
could have answered itself.

## .invariant

```
a fulcrum reaches the terminal ESCALATION council  ⟺  its rework is DIRTY (the human must rule it)

∀ fulcrum f opened at stage S:
  f impliedly answered by the wish or a reviewer   → closed at S, verdict recorded ("was never a fulcrum")
  f open, rework CLEAN                              → best-guessed at S, verdict recorded, NOT escalated
  f open, rework DIRTY                              → deferred to the council, named
```

the violation: a driver leaves open, past its own stage, a fulcrum that a clean rework or an
implied answer could close.

## .why

`rule.always.defer-fulcrums-to-last` governs WHEN to escalate — do not halt to ask the human at
every fork. it does NOT license a self-sufficiently-closeable fulcrum left open. the two are
separate: escalation timing is terminal; the driver-owned close is per-stage.

conflate them and the driver carries closeable forks to the end, where the context that would close
them is spent — so the terminal council fills with rows the driver owed itself.

## .scope

- covers the DRIVER-OWNED close — a clean rework, or a fork the wish/a reviewer already answered.
- does NOT cover escalation timing — a dirty-rework fork still defers to the terminal council, and
  the mid-drive halt is still forbidden (`defer-fulcrums-to-last`).
- does NOT bound budget — top-up for an eventual rework is still added after approval.

## .the litigation

- raised.by = wisher, 2026-09-14, on route `.behavior/v2026_09_04.feat-behavior-route-upgrades`
- verbatim:
  > "fulcrums needs to be reviewed at vision and execution; the driver opens fulcrums along the way
  > regularly"
  > "we need to peer-review that they closed any fulcrums that they could have"
  > "fulcrums-self-sufficient maybe; whatever can be self sufficiently closed, should have been"
- the incident: this route placed the fulcrum council terminal-only (`5.5.playtest`), on a misread
  of `defer-fulcrums-to-last` as "review fulcrums ONCE at the end." the escalation IS terminal; the
  close check is not. a `fulcrums-self-sufficient` peer lane at vision + execution corrects it.
- resolution: the terminal `fulcrums-driver-owned` council stays (escalation); the per-stage
  `fulcrums-self-sufficient` lane grades what the driver owed itself.

## .the counter-argument

*a per-stage close-check re-reads fulcrums the terminal council reads anyway — redundant.* it is
not: the two read at different times, and a fulcrum closed while its context is fresh costs a glance
where the same fulcrum closed at the terminal stone costs a re-entry of a stage long left. two cues
at two times, both cheap (`rule.require.a-cue-is-not-a-claim`).

## .what would overturn it

it is nurture, so it falls if the cost that bought it changes: show that a driver closes a
vision-stage fulcrum as cheaply at the terminal stone as at vision — i.e. that stage context is free
to re-enter. it does not fall to *"a per-stage lane is inconvenient."*

## .enforcement

- a fulcrum with a clean rework or an implied answer, left open past the stage it opened = **blocker**
  (`fulcrums-self-sufficient` peer lane, vision + execution).
- a dirty-rework fork escalated mid-drive rather than at the council = **blocker**
  (`defer-fulcrums-to-last`).
- worked example: `.behavior/v2026_09_04.feat-behavior-route-upgrades` — the route that over-deferred.

## .see also

- `rule.always.defer-fulcrums-to-last` (bhrain/driver) — the escalation-timing twin
- `rule.always.itemize-the-fulcrums-you-best-guess` (bhrain/driver) — the record half
- `define.invariant.scouts-honor.fix-forward` — the sibling: a closeable FIX, not a closeable fork
- `im_an.obsessive_learner.for.domain.invariants` (bhrain/learner) — the shape this brief follows
