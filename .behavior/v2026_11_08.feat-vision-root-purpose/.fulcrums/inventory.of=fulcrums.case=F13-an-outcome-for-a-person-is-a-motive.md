# F13 — an outcome for a person reads as a motive, even when it names the feature

## .the fork

the live motive-lane test (5.1, i006) showed the brain block the surface layer *"surfers who book
a lesson should get a reminder the day before"* as a mechanism, since it names a reminder. the
scaffold defines that layer as *"the surface motive — why the wisher asked"*, so it echoes the
wish by design.

options: **the rule reads an outcome for a person as a motive, and grades a layer a mechanism
only when it names a part of the build** (taken), or **every layer must avoid the feature's
name**, or **only the root is graded**.

## .taken, and why at the time

**an outcome for a person is a motive.** the wish refuses a vision that *"names a mechanism as
its root"*; it does not refuse a surface layer that restates what the wisher asked. an outcome a
person gets can be met by many builds, so it passes the rule's own test (*"could this layer be met
by a different build?"*). a mechanism names the build: a job, a schedule, a flag, a file, an api.
the rule still grades every layer, so a mechanism mid-chain is still refused.

## .rework: clean

one section of `rule.forbid.vision-root-purpose-mechanism.md`, and the fixtures of the live test.

## .confidence: 75%, and why it is low

the line between "an outcome" and "a feature" is a judgment the brain makes per vision; a wisher
may want the surface layer held to the same bar as the root. proven on three live fixtures only.

## .where

`src/domain.roles/behaver/briefs/practices/behavior.vision/rule.forbid.vision-root-purpose-mechanism.md`;
`src/domain.operations/behavior/init/initBehaviorDir.rootPurposeMotive.brain.integration.test.ts`.

## .verdict

confirmed by the director, 2026-11-08: an outcome for a person is a motive. the motive lane's
bind to `rule.forbid.vision-root-purpose-mechanism` stands, so the vision's text that names the
require rule for that lane is a recorded drift, not a defect to repair.
