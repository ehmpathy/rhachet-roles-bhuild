# tldr

## severity: blocker

require behavior intent coverage: implementation must fulfill the wish and vision

every requirement from the wish and vision must be addressed. gaps are blockers.

---
---
---

# deets

## .what

review for coverage of wished and envisioned behavioral intent.

## .why

incomplete implementation ships broken promises. the wisher expects what they asked for, not partial delivery.

## severity: blocker

gaps in behavior intent coverage block merge. every requirement must be satisfied or explicitly deferred.

## .how

1. **read the wish** (`$route/0.wish.md`)
   - list each explicit desire
   - list each implicit expectation

2. **read the vision** (`$route/1.vision.yield.md`)
   - list each specified behavior
   - list each acceptance criterion

3. **cross-reference with diff**
   - is every requirement addressed?
   - is every criterion testable?
   - are there untested code paths?

4. **check test coverage**
   - does each contract have snapshots?
   - does each user journey have acceptance tests?
   - are edge cases covered?

## .examples

### blocker — requirement not addressed

wish: "validate phone numbers before save"
code: saves phone without validation

the validation requirement is not met.

### blocker — criterion not tested

vision: "returns 400 for invalid email format"
tests: no test for invalid email case

the acceptance criterion lacks verification.

### blocker — edge case not covered

wish: "handle bulk import of customers"
code: handles 1 customer, no test for 1000

the bulk case is not verified.
