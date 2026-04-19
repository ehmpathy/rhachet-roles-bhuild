# self-review: role-standards-coverage (round 8)

line-by-line review of each changed file against applicable mechanic standards.

## file 1: 1.vision.stone (lines 45-61)

### line 45: `## groundwork`

| standard | check | verdict |
|----------|-------|---------|
| gerunds | "groundwork" is a noun, not gerund | pass |
| naming | lowercase, natural language | pass |
| forbidden terms | none present | pass |

### line 47: `sanity check the vision against reality. NOT exhaustive research — just enough to know the vision isn't built on false assumptions.`

| standard | check | verdict |
|----------|-------|---------|
| gerunds | none — "check" is verb, "vision" is noun | pass |
| forbidden terms | none — "built" is past participle, not gerund | pass |

### line 49: `### external research`

| standard | check | verdict |
|----------|-------|---------|
| gerunds | "research" is noun here | pass |
| naming | lowercase subsection header | pass |
| word order | noun-adj order: "external research" not "research external" | pass |

### lines 51-54: external research prompts

scanned word by word:
- "if" "the" "wish" "references" — all valid
- "external" "APIs" "services" "docs" — nouns
- "did" "you" "verify" — verb phrase
- "they" "exist" "work" — verbs
- "cite" "what" "you" "checked" — verb, past tense
- "if" "none" "referenced" — valid (not "nothing")
- "say" — verb

| standard | check | verdict |
|----------|-------|---------|
| gerunds | none detected | pass |
| forbidden terms | used "none" not "nothing" | pass |

### line 56: `### internal research`

same pattern as line 49. pass all checks.

### lines 58-61: internal research prompts

scanned word by word:
- "extant" — correct, not "existing"
- "behavior" "patterns" "code" — nouns
- "verify" "cite" — verbs
- "file paths" "line numbers" — nouns
- "none" — correct, not "nothing"

| standard | check | verdict |
|----------|-------|---------|
| gerunds | none detected | pass |
| forbidden terms | "extant" used correctly | pass |

## file 2: 1.vision.guard.light (lines 64-84)

### line 64: `- slug: has-grounded-in-reality`

| standard | check | verdict |
|----------|-------|---------|
| slug naming | has-* prefix, kebab-case | pass |
| YAML structure | list item with slug: | pass |

### line 65: `say: |`

| standard | check | verdict |
|----------|-------|---------|
| YAML structure | block scalar indicator | pass |

### lines 66-84: say content

scanned for gerunds: none found
- "recently modified" — past participle, not gerund
- "ground" — verb
- "verification" — noun (-tion suffix)

scanned for forbidden terms: none found
- no "existing", "nothing", "helpers"

| standard | check | verdict |
|----------|-------|---------|
| gerunds | none | pass |
| forbidden terms | none | pass |

## file 3: 1.vision.guard.heavy (lines 124-144)

identical content to light variant. same verdicts apply.

## patterns that should be present

| pattern | expected | found | why it holds |
|---------|----------|-------|--------------|
| section order | after open questions | yes | line 45 follows line 44 blank |
| subsection style | ### headers | yes | matches extant stones |
| edge case prompt | "if none" clause | yes | lines 54, 61 |
| guard in both variants | light + heavy | yes | identical in both |
| slug prefix | has-* | yes | has-grounded-in-reality |

## patterns not applicable

- error handles: no code to handle errors
- validation: no inputs to validate
- tests: no behavior to test (templates are static text)
- types: no TypeScript
- domain patterns: no entities or operations
- observability: no runtime

## gaps found

none. every applicable standard is covered at the word level.
