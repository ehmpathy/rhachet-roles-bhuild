# self-review: has-consistent-mechanisms

## review question

for each mechanism in the code, ask:
- does it follow extant patterns in the codebase?
- do we duplicate extant utilities, operations, or patterns?
- is there an established way to do this that we ignored?

## findings

### 1. hash computation

**mechanism**: `computeFeedbackHash.ts` uses Node.js crypto with SHA256

**extant patterns checked**:
- searched for `createHash` in codebase
- no extant hash utility in rhachet-roles-bhuild
- Node.js crypto is the standard approach

**verdict**: consistent — uses standard Node.js crypto, no duplication.

### 2. file discovery pattern

**mechanism**: `getAllFeedbackForBehavior.ts` uses `readdirSync` + regex pattern match

**extant patterns checked**:
- `getLatestArtifactByName.ts` uses identical pattern: `readdirSync` → regex match → collect → sort
- both use `for (const file of files)` iteration
- both parse metadata from filenames via regex groups
- both return sorted arrays

**verdict**: consistent — follows established `readdirSync` + regex discovery pattern exactly.

### 3. path derivation

**mechanism**: `asFeedbackTakenPath.ts` transforms `[given]` → `[taken]`

**extant patterns checked**:
- no extant path transformation utilities for this pattern
- domain-specific transformation

**verdict**: consistent — new domain-specific transformer, no duplication.

### 4. status determination

**mechanism**: `getFeedbackStatus.ts` computes unresponded/responded/stale

**extant patterns checked**:
- no extant status determination for feedback
- domain-specific logic

**verdict**: consistent — new domain-specific operation, no duplication.

### 5. CLI entry pattern

**mechanism**: `feedbackTakeGet.ts`, `feedbackTakeSet.ts` follow `(input, context)` → CLI pattern

**extant patterns checked**:
- `giveFeedback.ts` (now `feedbackGive.ts`) uses same pattern
- all CLI entry points use `getCliArgs({ schema })` pattern

**verdict**: consistent — follows established CLI entry pattern.

### 6. shell skill pattern

**mechanism**: `feedback.take.get.sh`, `feedback.take.set.sh` use portable dispatch

**extant patterns checked**:
- `feedback.give.sh` uses same `node -e "import('rhachet-roles-bhuild').then(m => m.cli.xyz())"` pattern
- all skills use this portable dispatch pattern

**verdict**: consistent — follows portable skills pattern.

## verdict

**no inconsistent mechanisms found.**

all new code follows established patterns:
- file discovery via glob (like `initBehaviorDir.ts`)
- CLI entry via `getCliArgs({ schema })` (like all CLI exports)
- shell dispatch via portable `node -e import()` (like all skills)
- transformers as pure functions (like extant transformers)

no duplication of extant utilities detected.
