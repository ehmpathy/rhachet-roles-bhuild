# self-review: has-questioned-deletables

## features questioned

| feature | traces to vision? | deletable? | verdict |
|---------|-------------------|------------|---------|
| feedback.give | yes (line 16) | no | keep |
| give.feedback.sh symlink | yes (line 224) | no | keep |
| feedback.take.get | yes (line 53) | no | keep |
| --when hook.onStop | yes (line 79) | no | keep |
| feedback.take.set | yes (line 110) | no | keep |
| hash verification | yes (line 181) | no | keep |
| meta.yml storage | yes (line 221) | no | keep |
| failfast validation | yes (line 203-205) | no | keep |

all features trace directly to vision requirements.

## components questioned

### computeFeedbackHash.ts

could this be inline in feedbackTakeSet?

- **answer**: yes, but it would reduce testability
- **if deleted and had to add back?**: yes, for unit test isolation
- **verdict**: keep — enables pure unit test

### asFeedbackTakenPath.ts

could this be inline in feedbackTakeSet?

- **answer**: yes, but used in multiple places (validate + set)
- **if deleted and had to add back?**: yes, to avoid duplication
- **verdict**: keep — reused transformer

### validateFeedbackTakePaths.ts

could validation be inline in feedbackTakeSet?

- **answer**: yes, but reduces clarity
- **if deleted and had to add back?**: yes, for clear failfast separation
- **verdict**: keep — failfast logic belongs in dedicated operation

### getAllFeedbackForBehavior.ts

could this be inline in feedbackTakeGet?

- **answer**: yes, but it's a pure glob operation
- **if deleted and had to add back?**: questionable
- **verdict**: **questionable** — could be inline

### getFeedbackStatus.ts

could this be inline in feedbackTakeGet?

- **answer**: yes, but it's reused per-file
- **if deleted and had to add back?**: yes, to avoid loop complexity
- **verdict**: keep — extracted for clarity

## examined questionable component

### getAllFeedbackForBehavior.ts deeper analysis

the operation is:
```ts
glob: feedback/*.[given].by_human.md
return paths[]
```

this is a single glob call. it could be inline.

**but**: it serves as a named operation that documents the convention. the function name `getAllFeedbackForBehavior` is clearer than an inline glob pattern.

**decision**: keep — the name adds clarity even if implementation is trivial.

## the simplest version

could we simplify further?

- could we skip meta.yml and inline hash in [taken] filename?
  - no — filenames with hashes are ugly and harder to read
- could we skip hash verification entirely?
  - no — vision explicitly requires it (line 181)
- could we merge get and set into one skill?
  - no — get lists, set records — different operations

no simpler version found that still meets vision requirements.

## issues found

none. each component either:
1. traces to a vision requirement, or
2. serves as a reusable helper that would need to be added back

## conclusion

all components justified. no deletables found.
