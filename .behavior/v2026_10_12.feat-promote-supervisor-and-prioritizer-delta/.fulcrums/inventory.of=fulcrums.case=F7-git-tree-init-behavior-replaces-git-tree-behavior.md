# F7 — `git.tree.init behavior` replaces `git.tree.behavior`

## .the ask

the wisher, 2026-10-13: *"how about `git.tree.init behavior`, instead of `git.tree.behavior`, so
that we can extend with `git.tree.init repair|goal|etc`"*. the direction is the wisher's. the forks
below are the shape calls the ask leaves open, each best-guessed.

## .measured reach

`git.tree.behavior` appears 80× across 41 published files (17 supervisor skills, 12 supervisor
briefs, 1 prioritizer brief, the supervisor readme, `suitesPorted.integration.test.ts`), plus 19×
on the delta's added lines. the skill is `git.tree.behavior.sh` + `git.tree.behavior.gates.integration.test.ts`.

## .fork A — the shape of the dispatcher

- **taken:** the paved pattern of `git.branch.rebase` (mechanic), which lives in its own
  `skills/git.branch.rebase/` subdirectory: `skills/git.tree.init/git.tree.init.sh` dispatches its
  first positional to `git.tree.init.<kind>.sh` beside it, via `exec`. the current body moves to
  `git.tree.init.behavior.sh`; its gates test moves to `git.tree.init.behavior.gates.integration.test.ts`
- `git.tree.init help`, `--help`, or an unknown kind → lists the known kinds (`behavior`), exit 2 on
  the unknown kind, naming the closest. `repair` / `goal` are **not built** here — the dispatcher
  makes them a new file each, not a re-shape

## .fork B — the old name

- **taken:** `git.tree.behavior` stays one release as a thin alias: it prints one line on stderr,
  `🌙 git.tree.behavior is now git.tree.init behavior`, then `exec`s the new path with the same args.
  a published 0.23 consumer does not break, so the bump stays a minor
- rejected: a hard rename. it breaks every script and brief a consumer holds, for no gain the alias
  does not already give

## .fork C — the size gate

- **taken:** `git.tree.size.uses` keeps its name. the size ladder (nano · mini · medi · mega · giga)
  is a behavior-route property, so the gate lives in `git.tree.init.behavior.sh` alone; a future
  `repair` or `goal` kind decides its own gate. the refusal text keeps the source's words with the
  verb name changed
- the permissions init (F6) denies the same meter verbs; it names no `git.tree.init` path, since
  `init behavior` is a verb the clone *should* run

## .fork D — divergence from the source

nheuron still names `git.tree.behavior`. the wish forbids an edit to nheuron from this tree. so:

- each three-way port maps `role=any/skills/git.tree.behavior.sh` → `supervisor/skills/git.tree.init.behavior.sh`
  before it applies the source's diff (F3); the yield's verdict table carries the mapping as a row so
  the next maintainer reads it, not re-derives it
- every brief and test reference in the package moves to the new verb, via one `sedreplace` over
  `src/domain.roles/{supervisor,prioritizer}`; the delta's 19 added references move as they port
- the yield asks for the rename upstream in nheuron, with this ask cited, so later deltas stop paying
  the mapping

## .fork E — the second kind already exists

`git.tree.declapract.upgrade.sh` names itself *"the PEER of git.tree.behavior, for the one work that
must NOT boot a behavior"*: it sprouts a tree and boots `rhx declapract.upgrade init` instead of
`rhx init.behavior`. `git.tree.behavior` refuses a `declapract` name and points at it.

- **taken:** it moves under the dispatcher too, as `git.tree.init declapract.upgrade`
  (`git.tree.init.declapract.upgrade.sh`), with the old name kept as an alias the same way. two real
  kinds prove the dispatcher's shape now (`rule.prefer.wet-over-dry`: the second usage is where a
  shape earns its keep); `repair` / `goal` then land as a third and fourth file
- the kind word is `declapract.upgrade`, the route's own name (`rhx declapract.upgrade init`), so it
  reads one way. a shorter `upgrade` would read as *any* upgrade
- the two kind files stay separate, each with its own body — the dispatcher shares no logic between
  them, only the entry point. a shared core waits for a third kind
- the refusal in `init behavior` that points at the peer now names `git.tree.init declapract.upgrade`

## .ambiguity check

`init` already means two things nearby: the behaver's `init.behavior` skill, and a role's `inits`
(the F6 permissions file). `git.tree.init behavior` reads as *"init a tree for a behavior"*, and it
does run `init.behavior` inside the new tree, so the first overlap is the same sense. the second
(role `inits`) is a rhachet config noun a clone never types as a verb. judged safe; noted so a
reviewer can disagree.

## .rework — clean

a rename plus a thin dispatcher and alias. no caller hardens against the dispatcher's shape until a
second kind lands.

## .confidence — 85%, and why it is not higher

fork B (keep an alias one release), fork C (the gate stays behavior-only), and fork E (fold the
declapract peer in now, under the kind word `declapract.upgrade`) are my calls, not the wisher's
words.

## .verdict

direction ruled by the wisher, 2026-10-13. forks A–D best-guessed; pending the council.
