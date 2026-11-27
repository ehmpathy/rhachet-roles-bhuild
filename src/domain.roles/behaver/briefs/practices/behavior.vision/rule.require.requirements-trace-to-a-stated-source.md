# tldr

## severity: blocker

every requirement in a vision, criteria, or blueprint traces to a stated source: the wish, or a
declared standard (an slo, a contract, a house rule). a requirement with no source is invented
scope, and invented scope drives design — it summons the mechanisms built to serve it.

nonfunctional goals are the usual case: "survives", "tolerates", "never blocked by", "degrades to".

---
---
---

# deets

## .the test

beside each requirement, cite the wish line or the standard it serves. no cite → delete it, or
raise it to the wisher as an open decision. never keep it on the author's judgment alone.

## .why

- an invented goal reads as diligence, so nobody asks for its source
- each mechanism it summons looks sound on its own, because it serves the goal; the goal itself
  was never asked for
- the cost lands later: copies, fallbacks, and bypasses that the house law may forbid outright
  (`rule.forbid.workarounds-for-intra-org-outages`)

## .demo

a surf school's blueprint adds the goal "bookings survive a day of calendar-service downtime".
nobody asked for it. it summons a local copy of the calendar, a stale-slot fallback, and a bypass
of the double-book lock. each looks sound because each serves the goal. cut the uncited goal, and
all three go with it.

## .enforcement

- a requirement with no wish or standard cited = **blocker**
- a design element whose only justification is an uncited requirement = **blocker**

## .see also

- `rule.prefer.bounded-scope` (behaver) — the wish declares its scope; this rule: later stages stay
  inside it
- `rule.forbid.workarounds-for-intra-org-outages` (architect)

---

written by human + beaver 🦫
