## .what

new driver rule `rule.always.verify-premises-quoted-from-issues`: a scope or shape that a wish quotes from an issue is a **premise to verify** against current infra, not settled scope. an unverified quote gets a fulcrum row (sub-93% confidence).

## .why

the wish quoted #490: the address `<org>/<repo>` + `@:<clone>`, and "cross-repo reach on one box", with "across boxes later". the driver took both as settled:

- the address shape was wrong for bhuild, where the tree is the grain (it pins repo and branch)
- "across boxes later" was stale: the supervisor role already has grove infra (`git.grove.wake`, ssh alias, `git.grove.send`). the human: "superviser already has grove support right", then "yeah we need that support upfront"

`rule.always.itemize-the-fulcrums-you-best-guess` names "a premise you did not fetch" as a cue, but a premise **quoted in the wish** reads as given, so the cue never fired.

## .provenance

`rhachet-roles-bhuild` @ `beav/feat-phone-text`, stone `1.vision`.

## .the forbid pair — ship both

a forbid bites faster than a require: a reviewer greps for a forbidden shape, but must reason to spot an absent one. so ship the twin:

**`rule.forbid.scope-deferred-on-a-quote`** — a scope deferral or shape adopted because an issue said so, with no check against current infra and no fulcrum row:

| 👎 forbidden | 👍 instead |
|---|---|
| "out of scope (#490: across boxes later)" | check whether the infra exists today; it did (supervisor groves) |
| adopt the issue's `<org>/<repo>` shape as given | verify against peer grains; record a fulcrum if not verified |

## .enforcement (proposed)

- a quoted shape or scope deferral adopted with no check against current infra and no fulcrum row = blocker
