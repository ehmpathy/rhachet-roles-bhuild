# self-review: role-standards-adherance (round 7)

why does each mechanic role standard hold for these specific changes?

## the changes

three template files modified:
1. `1.vision.stone` — added groundwork section (lines 45-61)
2. `1.vision.guard.light` — added has-grounded-in-reality slug (lines 64-84)
3. `1.vision.guard.heavy` — added has-grounded-in-reality slug (lines 124-144)

these are prose templates, not TypeScript. relevant briefs: lang.terms, practices.

## standard: no gerunds

**rule**: gerunds (-ing as nouns) forbidden in code, docs, prompts

**why it holds**:

the changes use verbs and nouns, not gerunds:
- "sanity check" — verb phrase
- "verify" — verb
- "cite" — verb
- "verification" — noun (not gerund — "-tion" suffix)
- "assumptions" — noun (not gerund — "-tion" suffix)

the hooks caught gerunds during iteration (e.g., "checking" → "check"). all were fixed before final write.

**proof**: grep for "-ing " in my additions returns zero matches that are gerunds.

## standard: no forbidden terms

**rule**: specific terms forbidden (existing → extant, nothing → none, helpers → utils)

**why it holds**:

- used "extant" not "existing" in "extant behavior"
- used "none" not "nothing" in "if none referenced"
- no use of "helpers" anywhere

hooks enforced this — early iterations had "existing" which was flagged and fixed.

**proof**: grep for forbidden terms in my additions returns zero matches.

## standard: naming conventions

**rule**: section names lowercase natural language, slugs kebab-case with has-* prefix

**why it holds**:

| element | convention | my usage | compliant |
|---------|------------|----------|-----------|
| section header | `## lowercase words` | `## groundwork` | yes |
| subsection | `### lowercase words` | `### external research` | yes |
| slug | `has-*` kebab-case | `has-grounded-in-reality` | yes |

the naming follows extant patterns in the same files:
- other sections: `## what`, `## how`, `## open questions`
- other slugs: `has-clear-outcome`, `has-user-experience-defined`

**proof**: visual inspection confirms pattern match with adjacent entries.

## standard: YAML structure

**rule**: guards use `slug:` + `say: |` structure, proper indentation

**why it holds**:

my addition follows the exact structure of adjacent entries:
```yaml
- slug: has-grounded-in-reality
  say: |
    a junior recently modified...
```

- list item with `- slug:` ✓
- `say:` with `|` block scalar ✓
- indentation matches (2 spaces for key, 4 for content) ✓

**proof**: build passes, YAML parses correctly, format matches adjacent entries byte-for-byte.

## why these standards matter here

these template files become the stones and guards that behavers fill out. violations would:
- gerunds: make prompts vague, hide agency
- forbidden terms: break ubiqlang consistency
- naming: break navigation and tooling expectations
- YAML: break template parsing at init time

the standards hold because hooks enforced them during iteration, and manual review confirms alignment with extant patterns.
