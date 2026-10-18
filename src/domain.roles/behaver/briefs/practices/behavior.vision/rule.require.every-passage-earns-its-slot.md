# rule.require.every-passage-earns-its-slot

> **a stage yield holds only passages that OUT-RANK their slot. one that is true, tight, and merely
> useful has not earned a place — it is CUT, or EJECTED to the appendix that already exists for it.**

## .why a peer rule is owed, when two rules already say this

`rule.require.reflexive-condensation` states the bar and `rule.require.dense-prose` grades the
degree. both were bound and blocker-graded over 13 peer rounds on one 6,000-word vision yield.
neither ever asked for a cut, and every round the file grew.

🔴 **the cause is the output schema, never the rubric.** `contract.reviewer-output` takes a list of
`{ rule, title, description, locations[], snippet }`, and the `snippet` is mandated to hold *"the
exact code from the target file"*.

| the property | what a reviewer must do | anchored to a location? |
|---|---|---|
| an emphasis stack, an absolute, a 3-claim paragraph | look at the page | ✅ a line |
| *"this said in 40 words what 6 would say"* | **construct the shorter version, then compare** | 🔴 no — it is a property of the WHOLE |

⇒ a whole-file property forced into a location-anchored list becomes a point defect, and **a point
defect is repaired by ADDITION** — a stated mechanism runs longer than the adjective it replaced.

⇒ this rule supplies the one move that fits the schema: **a RANK is a list of locations.**

## .what a reviewer emits

> **one point, N locations, the rewrites in the description.**

`--goal exhaustive` already instructs a reviewer to *"collect their locations under one violation"*.
that is the shape — so a ten-passage rank cannot blow a nitpick budget, and the driver still receives
all ten.

🔴 **the rank has a FLOOR: twenty-five passages, or every passage in the yield, whichever is fewer.**

- a reviewer that names four has not swept — it has stopped at the first four it noticed
- the floor is `--goal exhaustive` applied to the RANK rather than to the defect list
  - a defect list ends when the defects do; a rank is over a **set**, so it ends when you say
- ⇒ a shallow rank is indistinguishable from a clean file, and that is the failure this closes

🔴 **the floor is the CEILING, measured — so its value IS the lever.** two runs on one yield, one
variable changed:

| the floor | ranked | ejects | words recovered |
|---|---|---|---|
| none — *"rank every passage you would cut"* | 4 | 2 | **71** |
| ten | **10** — exactly | **6** | **422** |

⇒ the rank lands on the floor, never above it. so a floor set low is a cap on the round, and the
cheap cuts crowd out the ejects — the expensive moves come last and a short rank never reaches them.

🟡 **a floor cannot manufacture defects, because two of the three verdicts are honest outcomes.**
ranked passages 8, 9, and 10 will often be **keeps** — and a named keep is a real verdict a reader
can check, where silence is not.

per ranked passage, three fields, in order:

1. **the passage** — quoted, with its line range, ordered **least worth its slot first**
2. **its verdict** — exactly one of three:
   - **cut** — write the replacement out in full
   - **eject** — name the destination path; the appendices carry no bar, so this costs naught
   - **keep** — state what a reader would do differently without it. this is an honest verdict
3. **the delta** — words before → words after

close with the total: `N passages · X words → Y words`.

🟡 **a rank is owed even where every passage earns its slot.** the honest emit is *"ranked; the
weakest three are these, and each is a considered KEEP"* — that is a verdict a reader can check.
silence is not.

## .the bound — a cut must be LOSSLESS

lossless compression removes words that carried no distinction. so a shorter version that drops a
distinction the original carried is a **lossy cut**, and `rule.require.reflexive-condensation`
forbids it outright.

⇒ the repair for a lossy cut is a **shorter, more precise cut** — never a restored paragraph, and
never a retreat to *"keep"*.

### 🔴 an EJECT is where a lossy cut hides, and no check reaches it

a **cut** is graded against what it removed — the original sits beside the replacement, so a dropped
distinction is visible. **an eject's replacement is NEW PROSE**, written from memory of a passage
that is on its way to another file.

- and memory generalizes in the direction the argument wants
- the measured case: an eject moved a `+0.6%` measurement out, and its summary line read
  *"invariant"* — the author's own embellishment, in no proposal, and false
- ⇒ **no distinction was dropped. one was INVENTED**, which the lossy-cut definition does not name

⇒ so a driver applies the reviewer's replacement **verbatim**, or, if they extend it, **re-reads the
source before they generalize**. an eject summary written from recall is the one move in this rule
that can make an artifact wrong rather than merely long.

🔴 **and a caveat a reader must ACT on is not the reviewer's to rank.** it stays, however low it
sits.

## .the three verdicts, and why EJECT is the one that gets missed

`rule.require.archaeology-in-notes` (bhrain/telepath) carries the same three, and it names why the
third goes unreached: a reviewer sees the file it was handed, so it cannot name a destination
outside its own scope.

⇒ **so a lane that grades this rule must be able to SEE the appendix** — bound as `--refs`, which
`compileReviewPrompt` loads and walls off from grade. visible, ungraded, and exactly what a
destination wants.

| the material | its rank | the verdict |
|---|---|---|
| surplus — no reader wants it | below the bar | **cut** |
| the decision — every reader wants it here | above the bar | **keep** |
| evidence — one reader, one day, on dispute | above the bar for THEM, below it HERE | **eject**, and cite the path |

## .how a reviewer grades it

read the yield as a **SET**, then rank. do not grade line by line — a line judged against the one
before it was never ranked against the file.

| when… | then… |
|---|---|
| a passage is true, tight, and you cannot cut a word | the strongest cue. ask its RANK, never its length |
| a passage carries a read-trail, a measurement method, or a tool's source | **eject**. the number stays; the road cites out |
| a section restates a count its own table holds | cut the restatement, cite the table |
| the yield grew on a round where no decision changed | volume is a defense. the growth is the point |
| you would emit a point with no replacement text | that is not a point yet. write the shorter version, or grade it a KEEP |
| every passage genuinely earns its slot | say so, and name the weakest three anyway |

## .severity

- **a yield with no rank emitted** = **nitpick** — one point, and it names what to cut
- **a rank shallower than its floor** = **nitpick** — an unswept set reads as a clean one
- **a ranked passage with no replacement text and no stated KEEP reason** = **nitpick**
- **a lossy cut proposed** = **blocker** — it trades a distinction for a word count

⇒ nitpick, deliberately. the bar this rule ranks against is per-stage and not yet a number, so a
blocker would gate on a threshold no artifact declares. what the rule buys is the **proposals**;
the halt is not the point.

## .see also

- `rule.require.reflexive-condensation` (bhrain/telepath) — the bar this ranks against
- `rule.require.dense-prose` (bhrain/telepath) — the degree peer
- `rule.require.archaeology-in-notes` (bhrain/telepath) — the third verdict, and why it needs the
  destination in scope
- `rule.always.yield-the-output-not-the-archaeology` (bhrain/driver) — the appendix contract this
  ejects into
