# rule.forbid.term=property

## .what

do not use the word `property`. it is overloaded past repair — six live senses in this repo —
so it names none of them. reach for the word that fits the sense.

exempt: imported vocabulary. `domain-objects` declares `.properties` on a `DomainEntity`,
and that is the package's word, not ours (`rule.require.domain-term-itemization` excludes
vocab imported from a dependency).

## .why

`rule.forbid.ambiguous-labels` grades an overloaded term a blocker: one concept per term. a
vague word a reader knows is vague gets checked; one that sounds technical gets believed —
`property` is the repo's worst offender, it holds six unrelated senses and still sounds
precise. a sweep of `domain.terms/` found 77 uses, split across six concepts:

| # | the sense | in the wild |
|---|---|---|
| 1 | a **requirement** a kind must meet | "the two properties [of a clamp], and neither is optional" |
| 2 | the trait that **defines** a term | "the property that defines it: RECOVERABLE" |
| 3 | a **measured attribute** | "the selection criterion is orthogonal to the measured property" |
| 4 | a **guarantee** an order carries | "the ORDER carries the safety property" |
| 5 | a fact **decided by** some other subject | "a property of the CREW, not of the task" |
| 6 | a **field** on an object | `domain-objects` — imported, exempt |

senses 1 and 3 are the dangerous pair: a clamp's "two properties" are what it must
**satisfy**; an audit's "measured property" is what it **reads**. one is a demand on the
artifact, the other a fact about the subject — same word, two files apart in one glossary.

## .reach for instead

| the sense | the word |
|---|---|
| a requirement a kind must meet | **demand** — `rule.require.clamp-edge-cases` already says "sharpens … with three demands" |
| the trait that defines a term | **mark** — already used across `false-report` and `partial-audit` |
| a measured attribute | **attribute**, or **axis** where it is one of several |
| a guarantee an order carries | **guarantee** — the word every skill header already uses |
| a fact decided by another subject | say so: a function of, decided by, set by |

**demand** is the strongest: the rule that owns clamps already says *demands*, and the term
cluster that describes them drifted to *properties*. same concept, two words, in files that
cite each other.

## .the test

say the sentence with the word removed and the sense named:

- "the two properties of a clamp" → "the two **demands** a clamp must meet" — sharper
- "the measured property" → "the measured **attribute**" — sharper
- "a property of the operator's ssh config" → "**decided by** the operator's ssh config" — sharper

each replacement is shorter or equal and says more — the signature of a word that carried no
weight of its own.

## .how to apply

- new prose: never reach for it; pick the sense-word above
- extant prose: clean it up when you disturb the file (`rule.forbid.domain-term-synonyms`).
  no mass-rewrite is owed — 77 uses would be an unreviewable diff, and each needs its sense read

## .enforcement

- `property` / `properties` in new prose, a contract, or a name = **blocker**
- `property` left in a file you otherwise edited = **nitpick**
- `.properties` on a `domain-objects` type = **not a violation** (imported vocabulary)

## .see also

- `rule.forbid.ambiguous-labels` (ergonomist) — one term, one sense; an overload is a blocker
- `rule.forbid.domain-term-ambiguity` (learner) — the glossary-side rule this instances
- `rule.require.ubiqlang` (mechanic) — one canonical word per concept
- the `rule.forbid.term=*` family (mechanic) — the same shape: an overloaded word, retired
  with a per-sense table

---

written by human + beaver 🦫
