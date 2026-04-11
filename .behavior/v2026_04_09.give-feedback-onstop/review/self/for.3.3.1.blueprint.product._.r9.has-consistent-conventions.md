# self-review: has-consistent-conventions (r9)

## continued from r8

r8 verified all conventions are consistent. this r9 explores term choices and potential future drift.

## term evolution analysis

### feedback vs response

**question**: should "taken" be "response" instead?

**analysis**:
- "given" and "taken" are symmetric — gift semantics
- "given" and "response" are asymmetric — question/answer semantics
- the feature is about feedback as gift, not as question
- symmetric terms aid comprehension

**verdict**: "taken" is the correct choice for symmetry.

### hash vs checksum vs signature

**question**: should "hash" be called something else?

**analysis**:
- "hash" is accurate — sha256 is a hash function
- "checksum" implies error detection, not identity
- "signature" implies cryptographic authentication
- "hash" is the correct technical term

**verdict**: "hash" is correct.

### meta.yml vs meta.json

**question**: should metadata be json instead of yaml?

**analysis**:
- research noted yaml is already a dependency
- yaml is more human-readable for simple structures
- blueprint uses yaml for meta (1-2 fields only)
- json would work but adds no value

**verdict**: yaml is correct for this use case.

## forward compatibility check

### will these conventions hold as the feature grows?

| convention | growth scenario | holds? |
|------------|-----------------|--------|
| [given]/[taken] path pattern | multi-version feedback | yes — vN already in name |
| sha256 hash | large feedback files | yes — sha256 handles any size |
| feedback/ subdirectory | many feedback files | yes — directory scales |
| meta.yml for hash | additional metadata | yes — yaml extends easily |

all conventions remain stable under expected growth.

## cross-feature consistency

### does this feature match other features in the codebase?

| pattern | extant example | this feature |
|---------|----------------|--------------|
| [given] marker | template.[resource].v1.[given].by_human.md | template.[feedback].v1.[given].by_human.md |
| hash verification | no extant peer | new pattern (but uses extant crypto) |
| feedback/ subdirectory | no extant peer | new pattern (follows directory convention) |

the [given] marker pattern matches extant templates.

## why r9 was needed

r8 was thorough but focused on current state. r9 validates:
1. term choices are optimal, not just consistent
2. conventions hold under growth scenarios
3. cross-feature consistency is verified

## conclusion

all conventions are consistent and future-proof:
- terms are symmetric and accurate
- patterns scale under growth
- cross-feature patterns match extant conventions

