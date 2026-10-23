# F2 — the address grammar

## .the fork

- **A**: `<org>/<repo>[#<branch>]@:<clone>` — #490's shape, a branch only to break a tie
- **B**: `phone://<grove>/<tree>@:<clone>` — positional grains, as `duct://<grove>/<tree>/<role>`
- **C (taken)**: `phone://grove=<grove>/tree=<tree>/clone=<clone>` — keyed grains in one fixed
  order; `@:<clone>` as the shell shorthand for a clone in one's own tree
- **D**: address by tree dir path — exact, but not a name a clone would speak

## .taken, and why

- the grains are the supervisor's: a grove is a machine, a tree is a worktree (it already pins repo
  and branch), a clone is an actor. no org, no repo, no branch
- keys make each slot self-evident; the shape matches the repo's own `repo=…/role=…/skill=…` dirs
- one fixed order (grove, tree, clone) gives one form per peer, so contacts compare by string.
  any other order is refused, and the refusal prints the canonical form
- `grove=local` is input shorthand; it is cast to this machine's grove name before it is stored or
  shown

## .rework

clean — the parser, one cast transformer, and the render of an address.

## .verdict

ruled by the wisher, 2026-10-21: A struck (*"isnt the point of bhuild that we work in <tree>s, not
branches?"*, *"why even say repo"*); B taken (*"phone://<grove>/<tree>@:<clone> sounds great"*),
then refined to the keyed form C (*"it'd be nice to be explicit"*). the clone slot is F10.
