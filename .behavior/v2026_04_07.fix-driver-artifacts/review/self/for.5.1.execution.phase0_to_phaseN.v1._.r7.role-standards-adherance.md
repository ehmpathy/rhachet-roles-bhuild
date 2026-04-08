# self-review: role-standards-adherance

## summary

no mechanic role standard violations. the change was template content only — no TypeScript code.

## review

### rule categories checked

| category | relevance | status |
|----------|-----------|--------|
| code.prod | no TS code changed | n/a |
| code.test | no tests changed | n/a |
| lang.terms | template text only | ✓ |
| lang.tones | template text only | ✓ |
| work.flow | sedreplace + Edit tools used | ✓ |

### lang.terms compliance

| rule | check | status |
|------|-------|--------|
| forbid.gerunds | no gerunds in "yield" | ✓ |
| require.ubiqlang | "yield" is domain-appropriate | ✓ |
| forbid.buzzwords | no buzzwords added | ✓ |

### lang.tones compliance

| rule | check | status |
|------|-------|--------|
| prefer.lowercase | template content is lowercase | ✓ |
| forbid.shouts | no ALL CAPS | ✓ |

### work.flow compliance

| rule | check | status |
|------|-------|--------|
| prefer.sedreplace-for-renames | used for bulk update (30 files) | ✓ |

### why it holds

this change was a template content update:
- no TypeScript code written
- no test code written
- only string replacements in .stone and .guard files
- used sedreplace for bulk changes (mechanic best practice)
- used Edit for targeted changes

## conclusion

no role standards violations. the implementation follows mechanic practices.
