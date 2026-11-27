# rule.require.customer-statement-before-money-flow

## .what

before you design how money moves inside the system, draft what the customer sees: their
statement, line by line, across one full cycle — a purchase, a few uses, an estimate that later
settles, a refund, a top-up. design the internals to produce that statement.

## .why

- **the statement is the deal, made visible.** every line is a promise the customer reads; an
  internal model that cannot yield a sane statement has the deal wrong
- **odd statements surface odd models early.** a balance that jumps in steps the customer never
  caused, a refund line that matches no charge line — each is a model defect, visible in minutes
- **precedent lives at the statement.** cards, banks, and shops already solved how an estimate
  shows (unsettled) and settles (cleared); the statement is where you borrow it

## .the test

1. is there a drafted customer statement for one full cycle?
2. does each line name what the customer bought, paid, or got back?
3. does each internal record map to a line, or to no customer-visible effect at all?

a line the customer would not understand, or a balance move with no line → re-derive the model.

## .example

surf school, prepaid lessons. the drafted statement:

```
oct 01  top-up                     +$300.00    balance $300.00
oct 03  lesson 1  (unsettled)       −$60.00    balance $240.00
oct 04  lesson 1  (cleared)         −$60.00
oct 06  lesson 2  (cleared)         −$60.00    balance $180.00
oct 07  lesson 2  refund            +$60.00    balance $240.00
```

👎 a model that debits instructor hours yields `oct 03 −$47.50, oct 04 −$71.25` — lines no surfer
can read; the defect shows before any of the design is built.

## .enforcement

- a money-flow design with no drafted customer statement = **blocker**
- a balance move that maps to no statement line = **blocker**
- a statement line the customer could not explain in their own words = **nitpick**

## .see also

- `rule.require.deal-sentence-before-mechanism` — the sentence the statement makes visible
- `rule.require.refund-reverses-its-charge` — the refund line mirrors its charge line
- `rule.require.deal-sentence-before-mechanism (behaver)` — the index

---

written by human + beaver 🦫
