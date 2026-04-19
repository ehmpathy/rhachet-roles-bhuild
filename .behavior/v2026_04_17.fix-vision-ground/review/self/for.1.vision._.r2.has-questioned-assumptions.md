# self-review: has-questioned-assumptions (round 2)

deeper review with fresh eyes. let me re-read the vision and find what I missed.

## assumption 5: the groundwork section structure (external/internal split)

**what do we assume without evidence?** the vision shows groundwork with two subsections: "external research" and "internal research."

**what evidence supports this?** none — the wisher said "external websearch research or internal codepaths research" but didn't prescribe a format.

**what if the opposite were true?** a single flat list might be simpler. or a different split like "contracts verified" vs "patterns referenced."

**did the wisher say this?** no — I inferred the structure.

**verdict**: ISSUE FOUND. the split is an assumption, not a requirement. need to mark this for wisher confirmation or simplify.

**fix**: updated vision to note this as a [wisher] question.

## assumption 6: behavers will know what "contract-level" means

**what do we assume without evidence?** that "contract-level grain" is clear — that behavers understand the boundary between "API exists" and "detailed implementation."

**what evidence supports this?** none. this is jargon that might confuse.

**what if the opposite were true?** behavers might over-research (exhaustive docs) or under-research (just "yeah there's an API").

**did the wisher say this?** yes — "at a high level contract grain" — but this isn't self-explanatory.

**verdict**: ISSUE FOUND. the guard self-review should clarify what contract-level means: "did you verify the contracts exist and understand their shape? not the detailed behavior, just: it exists, here's its interface."

**fix**: the guard prompt should include examples of contract-level research vs detailed research.

## assumption 7: my own groundwork citations are accurate

**what do we assume without evidence?** in the vision's groundwork section, I cited "lines 38-44 show 'open questions & assumptions'".

**verification:** re-read 1.vision.stone — lines 38-41 are the questions list, line 43 starts "what is awkward". my citation "lines 38-44" was imprecise — it bleeds into the next section.

**verdict**: ISSUE FOUND. ironic that the vision about accurate citations has an inaccurate citation.

**fix**: corrected to "lines 38-41" in the vision.

## assumption 8: there's a later "research phase" for detailed research

**what do we assume without evidence?** line 103 marks a question for "research phase" — but is there actually such a phase?

**verification needed:** what phases exist in the behavior flow?

**what if the opposite were true?** if there's no research phase, this deferred question has nowhere to go.

**verdict**: assumption needs verification. the wisher mentioned "further detailed research can be done later" but didn't specify where. marked for wisher clarification.

## fixes applied

1. **vision groundwork section**: corrected "lines 38-44" to "lines 38-41"
   - before: `lines 38-44 show "open questions & assumptions" section we'll parallel`
   - after: `lines 38-41 show "open questions & assumptions" section we'll parallel`
   - why: lines 43+ are "what is awkward", not part of the questions section

2. **added [wisher] questions to vision**:
   - is the external/internal split the right structure for groundwork, or prefer a flat list?
   - where does detailed research happen — is there a later research phase, or at blueprint time?
   - what defines "contract-level" vs "detailed" research? examples would help clarify

3. **noted for guard implementation**: the guard self-review prompt should include examples of contract-level vs detailed research, to help behavers understand the boundary

## deeper still (third pass)

### assumption 9: external = APIs, internal = codepaths

**what do we assume without evidence?** the vision says "external APIs or internal patterns" — but integrations come in more forms: databases/schemas, third-party SDKs (not just REST APIs), environment constraints (deployment targets), human processes (approval flows).

**did the wisher say this?** yes — "external websearch research or internal codepaths research" — the binary is from the wisher.

**verdict**: wisher-backed but incomplete. clarified in "what is awkward" that the binary may be too simple.

### assumption 10: research comes after draft

**what do we assume without evidence?** the timeline shows: draft → realize dependency → research → cite.

**what if the opposite were true?** some visions require upfront research before the draft. "can we use X?" must be answered before "here's how we'll use X."

**verdict**: the timeline is one valid flow, not the only flow. acceptable for the vision to show one example.

### assumption 11: verification is semantic, not mechanical

**what do we assume without evidence?** line 43 conflated "files are present" (mechanical) with "contracts are accurate" (semantic).

**fix applied**: updated to clarify guard does semantic self-review, not mechanical file checks.

### assumption 12: no pivot/abort path

**what do we assume without evidence?** we don't address what happens if groundwork reveals the vision is impossible.

**verdict**: out of scope for this wish. noted in "what is awkward" as a future consideration.

## all fixes applied to vision

1. corrected citation: "lines 38-44" → "lines 38-41"
2. added [wisher] questions: structure, research phase, contract-level definition
3. clarified semantic vs mechanical verification in evaluation and user experience
4. expanded "what is awkward": external/internal binary too simple, no pivot/abort path

## lesson learned

the vision about accurate citations contained an inaccurate citation. this irony validates the need for this feature — even when we know we should verify, we don't always do it precisely. the guard's self-review will catch this.
