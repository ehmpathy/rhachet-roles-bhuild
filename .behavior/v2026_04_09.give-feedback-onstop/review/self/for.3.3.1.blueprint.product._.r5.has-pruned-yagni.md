# self-review: has-pruned-yagni (r5)

## continued from r4

r4 checked all components against vision. this r5 questions deeper: are the extracted transformers truly needed or are they YAGNI?

## the core question

are the 5 transformers (computeFeedbackHash, asFeedbackTakenPath, validateFeedbackTakePaths, getAllFeedbackForBehavior, getFeedbackStatus) truly needed, or could they be inline?

### computeFeedbackHash

**could be inline as**:
```ts
const hash = crypto.createHash('sha256').update(content).digest('hex');
```

**why extract?**:
1. unit testable — can test hash output in isolation
2. pattern follows extant code (research showed crypto.createHash pattern)

**is this YAGNI?**: no — extraction follows established pattern, not speculation.

### asFeedbackTakenPath

**could be inline as**:
```ts
const takenPath = givenPath.replace('[given]', '[taken]').replace('by_human', 'by_robot');
```

**why extract?**:
1. used in two places (validate + set)
2. documents the derivation rule explicitly

**is this YAGNI?**: no — reuse justifies extraction.

### validateFeedbackTakePaths

**could be inline as**:
```ts
if (!fs.existsSync(fromPath)) throw new ConstraintError(...);
if (!fs.existsSync(intoPath)) throw new ConstraintError(...);
if (intoPath !== asFeedbackTakenPath(fromPath)) throw new ConstraintError(...);
```

**why extract?**:
1. failfast logic is critical — deserves dedicated operation
2. all three checks are conceptually one validation unit

**is this YAGNI?**: no — failfast is explicit requirement.

### getAllFeedbackForBehavior

**could be inline as**:
```ts
const files = glob.sync('feedback/*.[given].by_human.md', { cwd: behaviorDir });
```

**why extract?**:
1. documents the glob pattern convention
2. single source of truth for the pattern

**is this YAGNI?**: borderline — but documents convention.

### getFeedbackStatus

**could be inline as**:
```ts
const takenPath = asFeedbackTakenPath(givenPath);
const metaPath = takenPath.replace('.md', '.meta.yml');
if (!fs.existsSync(metaPath)) return { responded: false };
const meta = yaml.parse(fs.readFileSync(metaPath));
const hash = computeFeedbackHash(givenPath);
return { responded: meta.hash === hash };
```

**why extract?**:
1. called per-file in a loop
2. encapsulates the responded/unresponded logic

**is this YAGNI?**: no — per-file logic benefits from extraction.

## final verdict

| transformer | yagni? | reason |
|------------|--------|--------|
| computeFeedbackHash | no | follows extant pattern |
| asFeedbackTakenPath | no | reused in two places |
| validateFeedbackTakePaths | no | explicit requirement |
| getAllFeedbackForBehavior | borderline | documents convention |
| getFeedbackStatus | no | per-file logic |

## the borderline case: getAllFeedbackForBehavior

this is the only one that could arguably be inline. but:
- the function name documents what we seek
- a glob pattern change would be a single-line edit
- other operations might need this list in the future

decision: keep — the documentation value exceeds the extraction cost.

## issues found

none. all extractions are justified by either:
1. reuse (asFeedbackTakenPath)
2. explicit requirement (validateFeedbackTakePaths)
3. extant pattern (computeFeedbackHash)
4. loop complexity (getFeedbackStatus)
5. documentation value (getAllFeedbackForBehavior)

## conclusion

no YAGNI violations. all components are minimum viable.
