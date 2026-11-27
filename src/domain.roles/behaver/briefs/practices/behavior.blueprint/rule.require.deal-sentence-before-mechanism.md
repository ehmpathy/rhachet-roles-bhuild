# rule.require.deal-sentence-before-mechanism

## .what

before you design any flow of money, write the deal in one sentence:

> **who buys what, at what promised price, and who bears each gap between promise and cost.**

every mechanism (ledger, lease, cron, stop, refund, statement) must trace to a clause of that
sentence. a mechanism that traces to no clause is invented; a question that the sentence answers
is not a question.

## .why

- **the deal is upstream of every boundary.** rules about what crosses a service boundary build
  a wrong deal carefully; they cannot catch it
- **one sentence answers most design forks.** what the customer is charged per, whether a charge
  may exceed its quote, who eats an overrun, what a refund returns, which guard matters — each
  falls out of the sentence
- **a mechanism-first model drifts.** it starts from what the system can do, not from what the
  business sold, and each later choice inherits the drift

## .the test

1. is the deal sentence written, at the top of the design?
2. does it name: the buyer, the unit bought, the promised price, and the bearer of each gap
   (cost above promise, cost with no unit delivered)?
3. for each mechanism: which clause does it serve?

any "no" → write the sentence first; then re-derive the mechanisms from it.

## .how to find the sentence

read the deal the business already runs (the extant invoice, the contract, the receipt) before
you read the wish. a new payment mode (prepaid, postpaid, direct) changes WHEN the buyer pays,
almost never WHAT the buyer buys. keep those two axes apart.

## .example

surf school, prepaid lessons: *"a surfer prepays for lessons at a posted price per lesson; the
school pays its instructors by the hour and bears the gap when a lesson runs long or a surfer
no-shows."*

from that sentence alone: the surfer's card shows one line per lesson; a lesson never costs more
than posted; a long lesson is the school's cost, so the school keeps its posted price honest; a
cancelled lesson refunds that lesson's line. no question to the owner was needed.

👎 design the instructor-hours ledger first, debit the surfer's prepaid balance by instructor
hours, then ask the owner whether a no-show is the surfer's cost.

## .enforcement

- a design of a money flow with no deal sentence = **blocker**
- a mechanism that serves no clause of the sentence = **blocker**
- a question to a human that the sentence answers = **blocker**
- a deal sentence silent on who bears a gap the design exposes = **nitpick**

## .demos

- `rule.require.deal-sentence-before-mechanism.demo=six-questions-one-sentence.md`

## .see also

- `rule.forbid.questions-the-territory-answers` (mechanic mod) — what to check before you ask
- `rule.require.risk-bearer-owns-the-estimate` (architect mod) — the gap clause, carried into the design
- `rule.require.customer-statement-before-money-flow` — the customer's view of the same deal

---

written by human + beaver 🦫
