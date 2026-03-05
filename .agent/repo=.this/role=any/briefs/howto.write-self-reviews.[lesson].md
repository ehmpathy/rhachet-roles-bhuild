# howto: write great self-reviews

## .what

self-reviews are guard prompts that challenge a clone to verify its own work before approval.

## .why questions guide reviews

questions > statements for self-review prompts because:
- questions activate critical evaluation mode
- questions force the clone to search for answers
- questions prevent passive acceptance of prior work
- questions surface gaps that statements gloss over

a statement like "check for assumptions" is vague.
a question like "what do we assume here without evidence?" demands a concrete answer.

## .how to find great questions

### 1. research established techniques

draw from proven critical evaluation frameworks:
- **socratic method**: clarification, assumptions, evidence, viewpoints, implications
- **5 whys**: drill to root cause via repeated "why?"
- **reverse assumptions**: "what if the opposite were true?"
- **counterexamples**: "what exceptions exist?"

### 2. test questions on real artifacts

a good question:
- surfaces hidden gaps when applied to real work
- cannot be answered with "yes" or "no" alone
- forces the reviewer to look at specific evidence
- produces actionable findings

a weak question:
- can be dismissed with "looks fine"
- is too abstract to apply
- produces no concrete output

### 3. iterate via use

after each self-review cycle:
- which questions surfaced real issues?
- which questions produced empty answers?
- what gaps did we miss that a question could have caught?

## .pattern: include sample questions

self-review prompts should include concrete sample questions:

```yaml
- slug: has-questioned-assumptions
  say: |
    are there any hidden assumptions?

    for each assumption, ask:
    - what do we assume here without evidence?
    - what if the opposite were true?
    - did the wisher actually say this, or did we infer it?

    surface all assumptions and question each one.
```

why sample questions matter:
- they calibrate the depth of review expected
- they prevent shallow "i checked it" responses
- they model the critical evaluation mindset
- they ensure consistency across reviewers

## .see also

- ref.self-review-questions.[research].md — curated question bank
- rule.require.slug-promise-format.md — slug format for self-reviews
