# rule.require.zero-padded-case-index

## .what

a `case=` index in an artifact filename is zero-padded to **width 3** — `case=001`, never `case=1`.

⇒ **a cite, never a coin.** bhrain declares the width and its reason at
`src/domain.operations/route/guard/asStoneGuardCounter.ts` — `COUNTER_WIDTH = 3`, *"the single
source of the pad width"* for every guard artifact (`i001`, `r001`). this rule applies that same
convention to the artifacts bhuild hand-names.

## .why

- an unpadded index sorts lexically, and lexical order is not numeric order
  - `case=1 · case=10 · case=11 · case=12 · case=2 · case=3 …`
  - ⇒ the dir then disagrees with the inventory's own sequence, which is the one place a reader
    goes to walk the set in order
- 🔴 **the defect is silent until the tenth case, and then it is retroactive**
  - a route with nine cases sorts correctly and reads fine
  - the tenth breaks the order of the nine that preceded it
  - ⇒ so the round that introduces the defect is not the round that reveals it, and the repair
    costs ten renames plus every citation, over one
- a padded index makes lexical order equal numeric order by construction
  - a glob, a sort, and a human who reads a dir each stay correct with no comparator

🟡 **bhrain carries no such rule because its counters are computed.** `asStoneGuardCounter` makes
the defect unreachable there. bhuild's case files are hand-named, so a rule is the enforcement
available.

## .where

every `case=` index in a route artifact filename bhuild names:

| artifact | shape |
|---|---|
| an experience demo | `1.vision.yield.appendix.experience.case=NNN.$slug.md` |

`case=_` is a **literal, never an index** — it names the inventory, and it stays unpadded.

🟡 **the fulcrum and seed inventories carry the same shape and are out of scope.**
`case=F$n-$slug` and `case=S$n-$slug` are spelled by bhrain's
`rule.always.itemize-the-fulcrums-you-best-guess` and `rule.always.archive-the-wishers-words-verbatim`.
they hold the same defect at `F10`; to conform them here would drift from the repo that declares
them, so the repair is a dispatch — caught at
`.dream/2026_09_08.pad-the-fulcrum-and-seed-case-indices.dream.md`.

## .the test

> **would `case=10` sort after `case=9` in this dir?**

yes → padded · no → the index is unpadded, and the dir's order is already wrong

## .enforcement

- a `case=` index in a filename with fewer than 3 digits = **blocker**
- a citation that names an unpadded index where the file is padded = **blocker** — a phantom path
- an unpadded `case=_` = **false positive**; it is a literal, not an index
- an unpadded `case=F$n` or `case=S$n` = **false positive**; bhrain declares those

## .see also

- `rule.require.experience-coverage` — the artifact set this binds
- `howto.experience.demonstrate` — where the filename shape is spelled
- bhrain `asStoneGuardCounter` — the declaration this cites, and the single source of width 3
