# domain.term: clone

term.chosen   = clone
term.kind     = noun
term.synonyms.forbidden:
- agent
- bot
- worker (as a noun for one seat)
- session
- seat (in an address)

## .what

**one worker in a tree**, named by its role slug: `mechanic`, `foreman`, `director`. unique within its
tree. a clone with no slug is named by its serial, rhachet's own key for it. rhachet's own word
(`rhx clone say`, `rhx clone whoami`).

## .in an address

`clone=<clone>` is the third grain of `phone://grove=<grove>/tree=<tree>/clone=<clone>`. the value is
the plain slug, or the full serial for a clone with no slug. `@:<clone>` and `@:<short-serial>` are
rhachet's shell shorthand for a clone in the caller's own tree; they are input only, never stored,
never inside the key (`define.grains.grove-tree-clone`).

a slug in an address names the role, not one serial. it resolves at delivery, so a text queued for
`clone=mechanic` reaches whichever LIVE clone holds the slug `mechanic` when it is said, and a
contact held as `clone=mechanic` admits that same clone. a revive under the slug keeps the address.
a serial in an address names one clone for its whole life, so a text to a DEAD serial is refused,
since no revive can take that serial again.

what a seat holds (its mailbox, its contacts) is keyed by the clone's name — the slug, or the serial
where it has none — so a revive under the slug inherits them: a text sent to a seat reaches whatever
clone sits there next (fulcrum F24 of `v2026_10_21.feat-phone-text`, ruled per seat).

## .reason

see `term=clone._.choice.reason.md`.

---

written by human + beaver 🦫
