# self-review: has-questioned-questions

triage of open questions from vision.

## questions triaged

### 1. hash algorithm (sha256? md5? what truncation?)

| triage | answer |
|--------|--------|
| can answer via logic? | yes — sha256 is the standard, matches extant patterns |
| can answer via docs/code? | yes — check extant hash usage in codebase |
| needs external research? | no |
| only wisher knows? | no |

**verdict**: [answered] — use sha256, no truncation. standard practice.

### 2. where is hash stored?

| triage | answer |
|--------|--------|
| can answer via logic? | no — multiple valid approaches |
| can answer via docs/code? | partial — check extant patterns |
| needs external research? | no |
| only wisher knows? | yes — affects API design |

options:
- in `[taken]` file frontmatter (collocated, explicit)
- in separate manifest (centralized, but hidden state)
- in filename (visible, but long filenames)

**verdict**: [wisher] — wisher must decide. recommend frontmatter for collocation.

### 3. behavior scope for feedback.take.get

| triage | answer |
|--------|--------|
| can answer via logic? | partial — bound-only is simpler |
| can answer via docs/code? | partial — check how other skills scope |
| needs external research? | no |
| only wisher knows? | yes — affects UX expectations |

**verdict**: [wisher] — wisher must decide. recommend bound-only for focus.

### 4. hook registration (auto or manual?)

| triage | answer |
|--------|--------|
| can answer via logic? | no |
| can answer via docs/code? | yes — check how other skills register hooks |
| needs external research? | no |
| only wisher knows? | no |

**verdict**: [research] — check extant skill patterns for hook registration.

### 5. keep `give.feedback` as alias?

| triage | answer |
|--------|--------|
| can answer via logic? | partial — backwards compat is nice |
| can answer via docs/code? | partial — check if skill is published/used |
| needs external research? | no |
| only wisher knows? | yes — policy decision |

**verdict**: [wisher] — wisher must decide backwards compat policy.

## summary

| question | triage |
|----------|--------|
| hash algorithm | [answered] — sha256, no truncation |
| hash storage location | [wisher] |
| behavior scope | [wisher] |
| hook registration | [research] |
| backwards compat alias | [wisher] |

## action: update vision

the vision must be updated to reflect these triages in the "open questions & assumptions" section.

## issue found

### issue 1: vision questions not triaged

the vision lists questions but does not mark them with triage status.

**fix:** update vision to include [answered], [research], [wisher] markers.
