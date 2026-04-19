# self-review: behavior-declaration-adherance

verify implementation matches what vision describes.

## vision says: "groundwork section goes after 'open questions', before 'what is awkward'"

**implementation check**: read 1.vision.stone

- line 38: `## open questions & assumptions`
- line 45: `## groundwork` ← added here
- line 63: `## what is awkward?`

**verdict**: matches vision. section is in correct position.

## vision says: "external/internal split with prompts for citations"

**implementation check**: read 1.vision.stone lines 49-61

external research prompts:
- "did you verify they exist and work the way you assume?" ✓
- "cite what you checked (links, key constraints noted)" ✓

internal research prompts:
- "did you verify what that behavior actually is?" ✓
- "cite what you checked (file paths, line numbers, key contracts)" ✓

**verdict**: matches vision. both subsections have citation prompts.

## vision says: "guard prompts semantic self-review, not mechanical file checks"

**implementation check**: read 1.vision.guard.light lines 64-84

- "did the junior ground the vision in reality, or make things up?" — semantic question
- "did they actually verify these exist?" — asks about behavior, not automation
- "this is NOT about exhaustive research — just sanity checks" — matches vision frame

**verdict**: matches vision. prompt asks for self-reflection, not automated verification.

## vision says: "NOT exhaustive — just what impacts the vision"

**implementation check**: both stone and guard

stone line 47: "NOT exhaustive research — just enough to know the vision isn't built on false assumptions"

guard line 83: "this is NOT about exhaustive research — just sanity checks"

**verdict**: matches vision. multiple explicit statements that groundwork is not exhaustive.

## vision says: "if none referenced, say 'none'"

**implementation check**: 1.vision.stone

line 54: "if none referenced, say 'none — no external dependencies'"
line 61: "if none referenced, say 'none — no extant behavior extended'"

**verdict**: matches vision. edge case for self-contained visions is handled.

## deviations found

none. implementation matches vision specification exactly.
