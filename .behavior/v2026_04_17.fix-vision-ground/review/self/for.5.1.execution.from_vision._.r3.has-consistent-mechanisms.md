# self-review: has-consistent-mechanisms (round 3)

deeper verification of consistency with extant patterns.

## consistency check: self-review prompt format

**extant pattern**: all self-reviews in guards start with:
```
a junior recently modified files in this repo. we need to carefully
review the vision due to this.
```

**my addition**:
```
a junior recently modified files in this repo. we need to carefully
review the vision due to this.

did the junior ground the vision in reality, or make things up?
```

**verdict**: consistent with extant format.

## consistency check: YAML structure

**extant pattern**:
```yaml
    - slug: has-questioned-questions
      say: |
        ...prompt text...
```

**my addition**:
```yaml
    - slug: has-grounded-in-reality
      say: |
        ...prompt text...
```

**verdict**: consistent with extant structure.

## consistency check: stone section format

**extant pattern** (from "open questions & assumptions"):
```
## open questions & assumptions

- what assumptions have we made?
- what questions remain unanswered?
```

**my addition**:
```
## groundwork

sanity check the vision against reality...

### external research
...

### internal research
...
```

**verdict**: consistent — section header + explanation + subsections with bullet prompts.

## why consistency matters here

1. behavers learn the template format once, apply it everywhere
2. inconsistent prompts confuse reviewers
3. guards parse YAML — wrong format breaks the system

## for each new mechanism: explicit check

### mechanism 1: groundwork section in stone

**does the codebase already have a mechanism that does this?**
no — searched templates for "groundwork", "sanity check", "grounded". the vision stone had no research prompts before. research stones (3.1.x) exist but serve a different purpose (exhaustive research, later phase).

**do we duplicate extant utilities or patterns?**
no — this is template text, not code. no utilities involved.

**could we reuse an extant component instead?**
no — research stones are wrong phase. groundwork is vision-phase sanity check, not phase 3.1.x exhaustive research.

### mechanism 2: has-grounded-in-reality self-review

**does the codebase already have a mechanism that does this?**
no — searched guards for "grounded", "groundwork", "reality", "sanity". no extant self-review covers this.

**do we duplicate extant utilities or patterns?**
no — this is a YAML prompt entry, not code. follows extant pattern exactly.

**could we reuse an extant component instead?**
no — no extant self-review addresses groundwork verification.

## summary

all additions follow extant patterns:
- self-review prompt format: same "a junior..." opener
- YAML structure: same `slug` + `say` format
- stone section format: same header + explanation + bullets

explicit search confirmed: no extant mechanism does what groundwork does. no duplication.
