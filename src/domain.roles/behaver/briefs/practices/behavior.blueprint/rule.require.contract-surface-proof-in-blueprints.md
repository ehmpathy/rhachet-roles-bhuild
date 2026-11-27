# rule.require.contract-surface-proof-in-blueprints

## .what

every blueprint that adds or changes a cross-boundary contract carries a **contract surface
table**: one row per exposed concept, with its proof. the table sits beside the blueprint's
contract list, and a reviewer reads it first.

| contract | producer → consumer | proof: without it the consumer cannot ___ | smallest fact? |
|---|---|---|---|
| `getOneDepositLease({ surfer, intendedFor })` | svc-payments → svc-lessons | know how much the surfer has set aside for lessons, and so whether to book one at all | yes: one lease |
| `getOneLessonPrice({ lesson }) → IsoPriceWords` | svc-lessons → svc-rentals | stamp the official price on the rental when it opens | yes: one value |

## .why

a blueprint that lists its contracts by service and tree, with no line that asks why each exists,
lets a contract that should never have opened ride through review and into the build plan. a column
that demands a proof catches each one on the line it sits on.

## .the table also lists cross-subdomain imports

for an intra-repo change that reaches across `domain.operations/$subdomain/`, list each import
from a peer subdomain, with the same proof.

## .enforcement

- a blueprint that adds a cross-boundary contract with no contract surface table = **blocker**
- a row with an empty or convenience-based proof = **blocker**
- a row whose "smallest fact?" is "no" and stays in = **blocker**

## .see also

- `rule.require.hermetic-subdomains`
- `howto.audit-a-contract-surface`
- `define.invariant.contract.surface-implies-proof`

---

written by human + beaver 🦫
