# self-review: has-consistent-conventions (round 4)

explicit check of each guide question for each name choice.

## name choice 1: `## groundwork` section

**what name conventions does the codebase use?**
stone sections use lowercase natural language: "the outcome world", "user experience", "open questions & assumptions"

**do we use a different namespace, prefix, or suffix pattern?**
no — "groundwork" is lowercase, single word, no prefix/suffix

**do we introduce new terms when extant terms exist?**
yes, "groundwork" is a new term — but intentionally so. the wisher chose this term. no extant section covers this concept.

**does our structure match extant patterns?**
yes — `## {section name}` followed by explanation and bullet prompts

**verdict**: consistent. new term is intentional and wisher-chosen.

## name choice 2: `### external research` / `### internal research` subsections

**what name conventions does the codebase use?**
research stones use these exact terms: 3.1.1.research.external.*, 3.1.3.research.internal.*

**do we use a different namespace, prefix, or suffix pattern?**
no — same terms as research stones

**do we introduce new terms when extant terms exist?**
no — reused extant "external research" and "internal research" terminology

**does our structure match extant patterns?**
yes — `### {subsection name}` with bullet prompts

**verdict**: consistent. reused extant terminology.

## name choice 3: `has-grounded-in-reality` slug

**what name conventions does the codebase use?**
slugs follow `has-{verb/adjective}-{object}`:
- `has-questioned-requirements`
- `has-pruned-yagni`
- `has-research-citations`
- `has-consistent-mechanisms`

**do we use a different namespace, prefix, or suffix pattern?**
no — follows `has-{past-participle}-{preposition}-{object}` which is a valid variant

**do we introduce new terms when extant terms exist?**
"grounded-in-reality" is new but distinct. no extant slug covers groundwork verification.

**does our structure match extant patterns?**
yes — kebab-case, starts with `has-`

**verdict**: consistent. follows extant slug pattern.

## why each non-issue holds

### `## groundwork` holds because:
- extant sections in 1.vision.stone are lowercase natural language
- "groundwork" follows that pattern exactly
- no extant section covers this concept, so new term is necessary
- wisher chose this term explicitly in the wish

### `### external research` / `### internal research` hold because:
- these exact terms exist in research stones (3.1.x)
- reuse creates consistency across phases
- behavers familiar with research stones will recognize the terms

### `has-grounded-in-reality` holds because:
- follows `has-{past-participle}-{object}` pattern
- other slugs use prepositions too: `has-no-silent-scope-creep`
- "grounded" is the verb form that matches "groundwork" section name
- no extant slug covers groundwork verification

## summary

| name | convention check | why it holds |
|------|-----------------|--------------|
| `## groundwork` | lowercase section | matches extant, wisher-chosen term |
| `### external research` | matches research stones | reuse creates consistency |
| `### internal research` | matches research stones | reuse creates consistency |
| `has-grounded-in-reality` | kebab-case has-* slug | follows pattern, no extant covers this |

no divergence. all names follow extant patterns with clear rationale.
