# self-review: has-role-standards-adherance

## rule directories checked

relevant brief categories for this blueprint:

| category | relevance |
|----------|-----------|
| `code.prod/` | n/a — no TypeScript code changes |
| `code.test/` | n/a — no test changes |
| `work.flow/` | applicable — uses sedreplace skill |
| `lang.terms/` | applicable — new term "yield" introduced |
| `lang.tones/` | applicable — documentation clarity |

## standards check

### work.flow standards

**rule.prefer.sedreplace-for-renames**: blueprint uses sedreplace for bulk find-and-replace. **compliant**.

**verification approach**: blueprint uses grep for verification. **compliant**.

### lang.terms standards

**rule.require.ubiqlang**: the term "yield" is introduced consistently. it is:
- used for stone outputs
- unambiguous within the domain
- aligned with the wish

**compliant** — no synonym drift.

**rule.forbid.gerunds**: checked blueprint for gerunds. none found.

**compliant**.

### lang.tones standards

**rule.prefer.lowercase**: blueprint uses lowercase consistently.

**compliant**.

## anti-patterns check

| anti-pattern | present? |
|--------------|----------|
| premature abstraction | no — template-only change |
| undocumented conventions | no — vision explains the pattern |
| hardcoded paths | no — uses $BEHAVIOR_DIR_REL |
| magic strings | no — patterns are explicit |

## summary

| category | violations |
|----------|------------|
| work.flow | 0 |
| lang.terms | 0 |
| lang.tones | 0 |
| anti-patterns | 0 |

**verdict**: blueprint adheres to mechanic role standards. no violations detected.
