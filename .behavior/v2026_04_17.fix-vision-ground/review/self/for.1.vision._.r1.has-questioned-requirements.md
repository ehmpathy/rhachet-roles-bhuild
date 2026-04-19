# self-review: has-questioned-requirements

review of the vision for groundwork citations in vision template.

## requirement 1: add a groundwork section to the vision stone template

**who said this was needed?** the wisher, in the wish.

**what evidence supports this?** the wish explicitly states: "we want both the stone to have a section for grounded citations."

**what if we didn't do this?** visions could reference external APIs or internal patterns without verification. the vision would proceed to blueprint, and contract mismatches would be discovered late — rework follows.

**is the scope right?** yes — the scope is narrowly targeted: add one section to one template file.

**simpler way?** no — the section is already minimal. we could skip the stone change and only add the guard review, but then behavers wouldn't be prompted to fill in groundwork at all.

**verdict**: requirement holds.

## requirement 2: add guard self-review to verify groundwork research was done

**who said this was needed?** the wisher, in the wish.

**what evidence supports this?** the wish states: "the self review to double down and verify that all groundwork level research was done."

**what if we didn't do this?** behavers might skip the groundwork section or fill it superficially. the guard provides accountability.

**is the scope right?** yes — one self-review prompt added to the guard.

**simpler way?** could rely on human reviewer to check groundwork section, but that's what the guard already does — it prompts the behaver to self-check before human review.

**verdict**: requirement holds.

## requirement 3: distinguish contract-level research (groundwork) from detailed research (later)

**who said this was needed?** the wisher, in the wish.

**what evidence supports this?** the wish states: "at a high level contract grain. further detailed research can be done later, with the research questions section specifically for that."

**what if we didn't do this?** behavers might feel obligated to do exhaustive research at vision phase. this slows iteration. or they might skip research entirely.

**is the scope right?** yes — clear separation is valuable. contract-level = does this API exist, what's the shape? detailed = how do we handle every edge case?

**simpler way?** no — this distinction is conceptual and already exists in the wish. we just need to reflect it in the template and guard.

**verdict**: requirement holds.

## summary

all three requirements justified and appropriately scoped. no requirements to remove or reduce.
