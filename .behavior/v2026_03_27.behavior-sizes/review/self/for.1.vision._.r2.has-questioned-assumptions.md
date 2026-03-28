# self-review: has-questioned-assumptions (round 2)

## review of: 1.vision.md

deeper dive after stillness check prompted fresh look.

---

### new assumption found: feedback template omitted

**what do we assume?** that feedback template isn't needed

**evidence?** review of templates shows `.ref.[feedback].v1.[given].by_human.md` exists

**what if opposite were true?** feedback template should be in ALL sizes - it's how humans provide input on behaviors

**verdict:** 🔴 **issue found** - feedback template should be included in nano (all sizes)

**fix applied:** will add to vision - feedback template belongs in all sizes

---

### new assumption found: "stones" vs "files" terminology is fuzzy

**what do we assume?** "5 stones" in nano is clear

**evidence?** nano section lists 7 items (wish + 3 .stone files + 3 .guard files)

**what if opposite were true?** "5 stones" when there are 7 files causes confusion

**verdict:** 🔴 **issue found** - terminology is imprecise

**fix applied:** should clarify: stones are milestones, guards are gates, both are files but conceptually different. consider count like "3 milestones with guards"

---

### new assumption found: no "resize" command needed

**what do we assume?** once initialized, size is fixed (only manual add/remove)

**evidence?** not discussed in wish or vision

**what if opposite were true?** users might want `--resize mega` to add absent stones

**did wisher say this?** no

**verdict:** ⚠️ acceptable tradeoff - manual add/remove is fine for now. resize is a nice-to-have, not MVP

---

### new assumption found: sizes orthogonal to guards

**what do we assume?** `--size mini --guard heavy` should work (5×2 = 10 combinations)

**evidence?** vision mentions this as open question

**what if opposite were true?** sizes could imply guard level (nano = always light, mega = always heavy)

**did wisher say this?** no - wisher defined them independently

**verdict:** ✅ orthogonal is correct - critical nano fixes might need heavy guards

---

### new assumption found: timeline estimates are realistic

**what do we assume?** nano takes 30min-2hrs, mega takes 1day-2weeks

**evidence?** based on general experience, no data

**what if opposite were true?** timelines could be wildly different per team/project

**verdict:** ⚠️ acceptable - timelines are illustrative, not prescriptive. add caveat "varies by context"

---

### revisit: stone groups need reconsideration

fresh look at the map:

**nano includes blueprint but skips criteria?**
- this means nano goes: wish → vision → blueprint → execution
- criteria defines what "done" looks like
- without criteria, how does one know blueprint is correct?

**consideration:** should nano include 2.1.criteria.blackbox.stone?

**verdict:** ⚠️ uncertain - the wisher said "vision, blueprint, execution" explicitly. but criteria seems important. will note as question.

**mega guard.heavy only on criteria?**
- vision says mega adds `2.1.criteria.blackbox.guard.heavy`
- but what about vision.guard.heavy and blueprint.guard.heavy for mega?

**verdict:** ⚠️ this needs clarification - mega should probably get heavy guards throughout, not just on criteria

---

## summary of round 2

| find | verdict | action |
|------|---------|--------|
| feedback template omitted | 🔴 issue | update vision to include in all sizes |
| stone/file terminology fuzzy | 🔴 issue | clarify milestone vs guard count |
| no resize command | ⚠️ acceptable | document as out-of-scope |
| sizes orthogonal to guards | ✅ correct | keep as-is |
| timeline estimates | ⚠️ acceptable | add "varies by context" caveat |
| nano skips criteria | ⚠️ question | ask wisher |
| mega guard.heavy scope | ⚠️ unclear | ask wisher |

## updates to vision applied

1. ✅ added `.ref.[feedback].v1.[given].by_human.md` to nano description (all sizes)
2. ✅ clarified terminology: "3 milestones, 3 guards" instead of "5 stones"
3. ✅ added "timelines vary by context" caveat
4. ✅ added open question: should nano include criteria?
5. ✅ added open question: should mega get heavy guards throughout?

all issues found in r2 have been addressed in the vision document.
