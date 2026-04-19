# self-review: has-questioned-questions (round 3)

line-by-line review of the vision for open questions.

---

## found issues (questions that can be answered now)

### issue 1: question 5 was marked [wisher] but answerable via code

**the question**: "where does detailed research happen — is there a later research phase, or at blueprint time?"

**why this was an issue**: I assumed only the wisher could answer, but I didn't check extant code.

**how I found the answer**: I ran `Glob` on `*.stone` templates and discovered:
- `3.1.1.research.external.product.*.stone`
- `3.1.2.research.external.factory.*.stone`
- `3.1.3.research.internal.product.*.stone`
- `3.1.4.research.internal.factory.*.stone`
- `3.1.5.research.reflection.product.*.stone`

**the answer**: detailed research happens in phase 3.1.x (research stones), after criteria (2.x), before blueprint (3.3.x).

**how it was fixed**: upgraded to [answered] in the vision.

### issue 2: question 6 was marked [wisher] but answerable via logic

**the question**: "is 'groundwork' the right term?"

**why this was an issue**: I thought terminology was pure preference.

**how I found the answer**: I looked up what "groundwork" means — it literally means "preliminary work that lays a foundation." this maps exactly to contract-level research that grounds the vision before we build on it.

**the answer**: yes, "groundwork" is apt. the term's literal sense matches the intent.

**how it was fixed**: upgraded to [answered] in the vision, and removed the awkward note about potential confusion (it's not confused, it's accurate).

### issue 3: question 7 was marked [wisher] but answerable via wisher's words

**the question**: "is the external/internal split the right structure?"

**why this was an issue**: I thought format was pure preference.

**how I found the answer**: I re-read the wish. the wisher wrote "external websearch research or internal codepaths research" — explicitly a binary.

**the answer**: yes, the wisher's words mandate the split.

**how it was fixed**: upgraded to [answered] in the vision.

---

## non-issues (questions that hold as they are)

### question 1: section placement — [answered]

**why it holds**: the answer "after 'open questions', before 'what is awkward'" follows from narrative logic. you ask questions → cite research → reflect on awkwardness. no external validation needed.

### question 2: verify vs self-review — [answered]

**why it holds**: the wisher explicitly said "self review to double down and verify." this directly prescribes semantic self-review over mechanical file checks. the wisher's words are authoritative.

### question 3: contract-level vs detailed — [answered]

**why it holds**: the definition "contract-level = shape; detailed = behavior" is a logical partition. shape = what exists and what's its interface. behavior = how it handles edge cases. this distinction doesn't require wisher validation.

### implicit questions reviewed — all non-issues

| line | text | verdict |
|------|------|---------|
| 83 | "stale citations... future enhancement" | explicitly deferred, not a blocker |
| 112 | "needs clear explanation in template prompt" | implementation note, not open question |
| 117 | "no pivot/abort path" | out of scope for this wish |

---

## final question status

all 6 questions are [answered]:

| # | question | status | source |
|---|----------|--------|--------|
| 1 | section placement | [answered] | logic |
| 2 | verify vs self-review | [answered] | wisher's words |
| 3 | contract vs detailed | [answered] | logic |
| 4 | where detailed research | [answered] | extant code |
| 5 | term "groundwork" | [answered] | logic |
| 6 | external/internal split | [answered] | wisher's words |

zero questions remain [wisher] or [research].

---

## lesson learned

1. **check code before deferring**: the research phase (3.1.x) was documented in templates all along.
2. **re-read wisher's words**: "external...or internal" mandated the split I thought was a preference.
3. **look up definitions**: "groundwork" literally means what we're asking for.

answers often exist in code, in the wisher's words, or in plain definitions — before you ask, look.
