# tldr

## severity: blocker

forbid ambiguous terms: blueprints must use unambiguous ubiquitous language

terms that are overloaded or have multiple meanings create confusion. each concept needs one canonical term.

---
---
---

# deets

## .what

review blueprints for terms that are ambiguous due to overload or synonym drift.

## .why

ambiguous terms cause:
- miscommunication between domain experts and developers
- inconsistent implementation across the codebase
- confusion for new team members
- bugs from misunderstood requirements

## severity: blocker

ambiguous terms in blueprints block merge. clarity in specification prevents defects in implementation.

## .how

for each term in the blueprint, check:

1. **overload detection**
   - does this term mean different things in different contexts?
   - is it used for multiple concepts in the codebase?
   - would a newcomer understand it unambiguously?

2. **synonym detection**
   - are there other terms used for the same concept?
   - does the codebase use client/customer/user interchangeably?
   - are there rival names for the same entity?

3. **domain alignment**
   - does the term match what domain experts use?
   - is it defined in a glossary or ubiquitous language doc?
   - would the term make sense in a conversation with stakeholders?

## .examples

### blocker — overloaded term

blueprint says "job" but codebase uses:
- job = requested service
- job = completed work
- job = background task

clarify: use `ServiceRequest`, `CompletedService`, `BackgroundTask`

### blocker — synonym drift

blueprint says "client" but codebase has:
- Customer domain object
- user in auth context
- account in payments

pick one canonical term and use it everywhere.

### blocker — undefined jargon

blueprint introduces "leadCapture" without definition.

add: clear definition of what leadCapture means in this domain.
