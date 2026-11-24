# F38 — the new lane slugs carry no family prefix

rework = clean · status = open · confidence = 80% · risk = rework only, no harm

## the fork

r011 i004 nitpick.6: the new lanes `yagni-and-simplicity`, `fulcrums-self-sufficient`,
`scouts-honor-fix-forward`, and `dispatch-lives-with-its-route` sit beside `ergo-*`, `mech-*`,
`arch-*`, `enroll-*` lanes, so `tally.reviews.peer --lane-wout <family>-` cannot address them as a
family.

- **A — keep the bare slugs** (taken)
- **B — prefix them, e.g. `behavior-yagni-and-simplicity`**

## taken, and why at the time

A. the extant vision lanes and `repo-rules` already go unprefixed, so a bare slug is a convention
in this template set, not a slip. the tally filter matches any part of a report name, so each lane
stays addressable by its own name.

## rework, and why clean

B is a rename in the guard templates (light and heavy variants), the guard snapshots, and the
inventory: a sedreplace plus a resnap. a stamped guard keeps its old slug until
`route.guard.upgrade`.

## confidence, and why it is not higher

the reviewer marked it low confidence too. a prefix scheme for lanes is a convention the template
set has never declared, so either answer is a guess at an unwritten rule.

## where

`src/domain.roles/behaver/templates/*.guard*`

## verdict
