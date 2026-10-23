# F1 — the behaver budget number

## .the fork

- (a) declare ≤ 1.5k, as the wish proposes
- (b) declare the measured post-refout linked cost, rounded up to the next 100 (~2.0k)

## .taken — (b), and why at the time

the wish says the 1.5k is "proposed … to settle with evidence". the evidence (2026-10-21, `roles
cost --what src/domain.roles/behaver/boot.yml`): of 2,571 tokens, 1,233 are the catalog-evolution
rule; a dense draft of its cue keeps every cue at ~2,486 chars (~600 tokens). the rest is chrome
(242, the renderer's floor), the strictness `.md.min` (~240, already cue), the readme (41), and
~815 tokens of ref/also path pointers. projected total ~1.9k. reach 1.5k and one must cut cues or
drop path pointers — both forbidden by the bound "no rule deleted, no sense changed".

## .measured at execution

the render lands at **2,075 src · 2,105 linked** (`roles cost --all`, after `npm run build`), so the
budget is **2,200**. the projection ran low by ~200: the cue kept more words than the char-ratio
draft, because a sentence-level sense map and an adherence pass restored three clauses the dense
draft had weakened (the imperative "you must evolve", the step-3 condition, "a real test that
exercises it").

## .measured: the catalog variant (i007 asked for a real second number)

a variant boot that `not:`s every unsaid brief and every skill, says one brace-compressed catalog
in their place, and keeps both cues word for word: **1,692 src** (cue 708 · catalog 508 ·
strictness 240 · chrome 146). still over 1.5k, and it trades 21 `ref` entries the boot curated by
stage for one catalog line each. the two real numbers for the council: **2,075** (as shipped) or
**~1,700** (catalog variant). 1.5k needs the cue itself condensed — the one lever the wish forbids.

## .rework — clean

one number in one boot.yml. if the wisher wants 1.5k, the remedy is a decision to list some
briefs under `not:` (they drop from the boot entirely) — a sense change only the wisher may grant.

## .confidence — 70%, and why it is low

the number is now measured, not projected; what stays open is whether the wisher holds 1.5k as firm,
not proposed.

## .where

`src/domain.roles/behaver/boot.yml` · yield `## evaluation`

## .verdict

(open — for the council)
