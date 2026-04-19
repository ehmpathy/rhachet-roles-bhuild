# self-review: behavior-declaration-adherance (round 6)

deep verification: why does each part of the implementation match the vision?

## section placement

**vision requirement**: "after 'open questions & assumptions', before 'what is awkward'"

**why the implementation holds**:
- line 38 starts "open questions"
- line 45 starts "groundwork" (my addition)
- line 63 starts "what is awkward"
- the order is correct because I inserted at line 45, which is between these two sections
- no other sections were moved or reordered

## external/internal subsections

**vision requirement**: "external websearch research or internal codepaths research"

**why the implementation holds**:
- the wisher's words explicitly named these two categories
- I used the exact terms "external research" and "internal research"
- the subsections prompt for what the wisher asked: verification + citations
- the structure (`### subsection`) matches extant subsection patterns in stones

## citation prompts

**vision requirement**: "section that cites groundwork"

**why the implementation holds**:
- external: "cite what you checked (links, key constraints noted)"
- internal: "cite what you checked (file paths, line numbers, key contracts)"
- these match the vision's examples: "links to docs" and "file paths to extant patterns"
- the prompts make citations mandatory, not optional

## self-review guard

**vision requirement**: "self review to double down and verify"

**why the implementation holds**:
- added `has-grounded-in-reality` slug with verification prompts
- the prompt explicitly asks "did the junior ground the vision in reality?"
- it checks both external and internal references
- it emphasizes "sanity checks" not exhaustive research
- added to BOTH light and heavy guards for consistency

## not exhaustive

**vision requirement**: "at a high level contract grain... further detailed research can be done later"

**why the implementation holds**:
- stone says "NOT exhaustive research"
- guard says "this is NOT about exhaustive research — just sanity checks"
- the word "sanity check" appears multiple times
- the vision's distinction (groundwork now, detailed later) is explicitly stated

## deviations or misinterpretations

none found. each implementation element traces directly to a vision requirement.

| vision requirement | implementation | why it matches |
|--------------------|----------------|----------------|
| section placement | lines 45-61 | between open questions and awkward |
| external/internal | two subsections | matches wisher's binary |
| citations | cite prompts | asks for links/paths |
| self-review | guard slug | asks for verification |
| not exhaustive | explicit "NOT" | matches contract-level grain |
