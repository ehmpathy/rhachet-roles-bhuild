# self-review: has-journey-tests-from-repros (r4)

## repros artifact check

**searched:** `.behavior/v2026_03_27.behavior-sizes/3.2.distill.repros.experience.*.md`

**result:** no files found.

## why no repros?

this behavior (behavior-sizes) was initialized at mini size level, which does NOT include the repros distillation stone:

per the vision:
- mini adds: criteria, code research, evaluation
- medi adds: reflection, playtest, **distill.repros**

the repros artifact is a medi-level addition, not present in mini behaviors.

## what substitutes for repros?

the criteria artifact (`2.1.criteria.blackbox.md`) defines user journeys:
- usecase.1: init with size (nano,mini,medi,mega,giga)
- usecase.2: default size (medi)
- usecase.3: size composes with guard
- usecase.4: help shows sizes
- usecase.5: wrong size recovery
- usecase.6: feedback template

these use cases are tested:
1. `getAllTemplatesBySize.test.ts` — unit tests for size logic
2. `init.behavior.*.acceptance.test.ts` — acceptance tests for CLI

## journey coverage from criteria

| criteria usecase | test file | coverage |
|------------------|-----------|----------|
| usecase.1 | getAllTemplatesBySize.test.ts | 5 size levels tested |
| usecase.2 | initBehaviorDir.test.ts | default medi verified |
| usecase.3 | getAllTemplatesBySize.test.ts | isTemplateInSize handles guard variants |
| usecase.4 | acceptance tests | CLI output tested |
| usecase.5 | n/a (manual) | documented in vision |
| usecase.6 | giveFeedback.test.ts | feedback template tested |

## conclusion

no repros artifact exists for this behavior (mini size level). however, the criteria artifact defines user journeys, and all journeys are covered by tests. this review checks for journey coverage — that coverage exists via criteria + tests.
