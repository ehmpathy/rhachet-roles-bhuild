# self-review: behavior-declaration-coverage (round 5)

line-by-line verification of changed files against requirements.

## file 1: 1.vision.stone

read lines 45-61. verified:

**line 45**: `## groundwork` — section header present ✓

**line 47**: `sanity check the vision against reality. NOT exhaustive research — just enough to know the vision isn't built on false assumptions.`
- matches wish: "at a high level contract grain" ✓
- matches vision: "NOT exhaustive" ✓

**lines 49-54**: `### external research` with prompts
- "did you verify they exist" — matches wish: "external websearch research" ✓
- "cite what you checked" — matches wish: "cites groundwork" ✓
- "if none referenced, say 'none'" — handles edge case from vision ✓

**lines 56-61**: `### internal research` with prompts
- "verify what that behavior actually is" — matches wish: "internal codepaths research" ✓
- "cite file paths, line numbers" — matches wish: "cites groundwork" ✓
- "if none referenced, say 'none'" — handles edge case from vision ✓

## file 2: 1.vision.guard.light

read lines 64-84. verified:

**line 64**: `slug: has-grounded-in-reality` — self-review present ✓

**line 69**: `did the junior ground the vision in reality, or make things up?`
- matches wish: "self review to double down and verify" ✓

**lines 73-76**: external references check
- "did they actually verify these exist?" ✓
- "or did they assume without sanity check?" ✓

**lines 78-81**: internal references check
- "did they actually verify what that behavior is?" ✓
- "cite specific files/lines?" ✓

**lines 83-84**: `this is NOT about exhaustive research — just sanity checks`
- matches wish: "high level contract grain" ✓
- matches vision: "NOT exhaustive" ✓

## file 3: 1.vision.guard.heavy

verified same content at lines 124-144. identical to light variant. ✓

## why each requirement holds

| requirement | why it holds |
|-------------|--------------|
| groundwork section | line 45 adds `## groundwork` |
| external/internal split | lines 49 and 56 add subsections |
| cite groundwork | prompts ask for citations with links/paths |
| self-review verification | guard line 64 adds `has-grounded-in-reality` |
| contract-level grain | multiple "NOT exhaustive" / "sanity check" phrases |
| semantic not mechanical | guard asks "did you verify" not automated checks |

## gaps found

none. every requirement traceable to specific lines in changed files.
