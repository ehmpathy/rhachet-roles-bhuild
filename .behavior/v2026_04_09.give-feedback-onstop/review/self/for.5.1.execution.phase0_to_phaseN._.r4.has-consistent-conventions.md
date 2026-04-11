# self-review: has-consistent-conventions (r4)

## r3 reflection

r3 covered mechanisms. this r4 review focuses on name conventions and patterns.

## review question

for each name choice in the code, ask:
- what name conventions does the codebase use?
- do we use a different namespace, prefix, or suffix pattern?
- do we introduce new terms when extant terms exist?
- does our structure match extant patterns?

## deeper examination

### verified via file read: CLI entry patterns

read `bind.behavior.ts` and `feedback.give.ts` to verify:

| aspect | extant (bind.behavior) | new (feedback.give) |
|--------|------------------------|---------------------|
| import | `getCliArgs` from `@src/infra/cli` | same |
| schema | `schemaOfArgs` with `named`/`ordered` | same |
| domain import | `get*`, `set*`, `del*` ops | `feedbackGive as feedbackGiveOp` |
| validation | `z.object()` | same |

**verdict**: identical structure patterns.

## findings

### 1. CLI file names

**extant patterns**:
- `bind.behavior.ts`, `review.behavior.ts`, `init.behavior.ts`, `boot.behavior.ts` → `{verb}.{noun}.ts`
- `catch.dream.ts` → same pattern
- `radioTaskPush.ts`, `radioTaskPull.ts` → camelCase exception

**new files**:
- `feedback.give.ts`
- `feedback.take.get.ts`
- `feedback.take.set.ts`

**analysis**: the vision explicitly requested rename from `give.feedback` to `feedback.give`, which established `{noun}.{verb}` pattern for feedback operations. the three new files follow this pattern consistently.

**verdict**: consistent — follows vision-mandated convention.

### 2. domain operation names

**extant patterns** (treestruct: `[verb][...nounhierarchy]`):
- `findBehaviorByExactName.ts` → `find` + noun + qualifier
- `getBehaviorDir.ts` → `get` + noun

**new files**:
- `feedbackGive.ts` → `feedback` + `Give` (noun + verb, per CLI alignment)
- `feedbackTakeGet.ts` → `feedback` + `Take` + `Get` (noun + verb compound)
- `feedbackTakeSet.ts` → `feedback` + `Take` + `Set` (noun + verb compound)
- `getAllFeedbackForBehavior.ts` → `get` prefix, treestruct
- `getFeedbackStatus.ts` → `get` prefix, treestruct
- `getLatestFeedbackVersion.ts` → `get` prefix, treestruct
- `computeFeedbackHash.ts` → `compute` prefix, treestruct
- `asFeedbackTakenPath.ts` → `as` transformer prefix, treestruct
- `validateFeedbackTakePaths.ts` → `validate` prefix, treestruct

**verdict**: consistent — all follow treestruct with appropriate verb prefixes.

### 3. shell skill names

**extant patterns**:
- `give.feedback.sh` (old name)

**new files**:
- `feedback.give.sh` (renamed per vision)
- `feedback.take.get.sh`
- `feedback.take.set.sh`
- `give.feedback.sh` (backwards compat alias)

**verdict**: consistent — follows vision-mandated rename convention.

### 4. file pattern names

**extant patterns** (feedback files):
- `{artifact}.[feedback].v{N}.[given].by_human.md`

**new patterns**:
- `{artifact}.[feedback].v{N}.[taken].by_robot.md`

**analysis**: `[taken]` mirrors `[given]` as counterpart. `by_robot` mirrors `by_human` as counterpart.

**verdict**: consistent — symmetric with extant feedback file pattern.

### 5. test file names

**extant patterns**:
- `*.test.ts` for unit tests
- `*.integration.test.ts` for integration tests

**new files**:
- `computeFeedbackHash.test.ts` (unit)
- `asFeedbackTakenPath.test.ts` (unit)
- `feedbackGive.integration.test.ts` (integration)
- `feedbackTakeGet.integration.test.ts` (integration)

**verdict**: consistent — follows extant test file suffix conventions.

## verdict

**no convention divergence found.**

all names follow established patterns:
- CLI: `{noun}.{verb}.ts` per vision mandate
- domain ops: treestruct with verb prefixes (`get*`, `compute*`, `as*`, `validate*`)
- skills: `{noun}.{verb}.sh` per vision mandate
- feedback files: symmetric `[given]`/`[taken]` and `by_human`/`by_robot`
- tests: `*.test.ts` and `*.integration.test.ts` suffixes
