# self-review: has-consistent-mechanisms

## new mechanisms in blueprint

| mechanism | what it does |
|-----------|--------------|
| computeFeedbackHash | sha256 hash of file content |
| asFeedbackTakenPath | derive [taken] path from [given] path |
| validateFeedbackTakePaths | check paths exist and match derivation |
| getAllFeedbackForBehavior | glob for [given] files |
| getFeedbackStatus | check if feedback has valid [taken] response |

## check against extant patterns

### computeFeedbackHash — does extant hash utility exist?

**search**: "crypto.createHash" in codebase

**result from research**: no extant hash utility found. crypto.createHash is used directly.

**verdict**: no duplication — new mechanism follows extant pattern.

### asFeedbackTakenPath — does extant path transformation exist?

**search**: similar path transformations

**result**: no extant [given]/[taken] pattern exists. this is new functionality.

**verdict**: no duplication — new pattern for new feature.

### validateFeedbackTakePaths — does extant validation utility exist?

**search**: path validation patterns

**result**: validation is inline in other commands, not extracted.

**verdict**: no duplication — follows pattern of dedicated validation.

### getAllFeedbackForBehavior — does extant glob utility exist?

**search**: glob patterns in codebase

**result**: glob is used directly (e.g., glob.sync). no wrapper exists.

**verdict**: no duplication — new mechanism documents convention.

### getFeedbackStatus — does extant status check exist?

**search**: status check patterns

**result**: no extant feedback status check. this is new functionality.

**verdict**: no duplication — new pattern for new feature.

## key patterns reused (from blueprint)

| pattern | from | used in blueprint |
|---------|------|-------------------|
| portable skill dispatch | give.feedback.sh | all new skills |
| CLI entry point (zod schema) | giveFeedback.ts | all new CLIs |
| (input, context) => result | all domain ops | all new ops |
| test-fns BDD | extant tests | all new tests |
| temp directory isolation | extant tests | integration tests |
| treestruct output | extant skills | CLI outputs |

the blueprint explicitly reuses extant patterns.

## issues found

none. all new mechanisms are either:
1. new functionality (no extant equivalent)
2. follow extant patterns (crypto.createHash, glob.sync)
3. explicitly reuse extant patterns (CLI entry, domain ops)

## why this holds

1. research stone (3.1.3) already verified extant patterns
2. blueprint explicitly lists "key patterns reused"
3. no utility duplication found

## conclusion

all mechanisms are consistent with extant patterns. no duplication found.
