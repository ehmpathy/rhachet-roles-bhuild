# self-review: role-standards-adherance (r7)

## review question

for each file changed in this pr, check:
- does the code follow mechanic standards correctly?
- are there violations of required patterns?
- did the junior introduce anti-patterns, bad practices, or deviations?

## rule directories checked

| directory | checked |
|-----------|---------|
| practices/code.prod/evolvable.procedures | yes |
| practices/code.prod/readable.narrative | yes |
| practices/code.prod/readable.comments | yes |
| practices/code.prod/pitofsuccess.errors | yes |
| practices/code.test/frames.behavior | yes |
| practices/lang.terms | yes |
| practices/lang.tones | yes |

## production code adherance

### rule.require.arrow-only

| file | uses arrow functions | verdict |
|------|---------------------|---------|
| feedbackTakeGet.ts | yes (`export const feedbackTakeGet = (`) | pass |
| feedbackTakeSet.ts | yes (`export const feedbackTakeSet = (`) | pass |
| computeFeedbackHash.ts | yes | pass |
| validateFeedbackTakePaths.ts | yes | pass |
| asFeedbackTakenPath.ts | yes | pass |
| getAllFeedbackForBehavior.ts | yes | pass |
| getFeedbackStatus.ts | yes | pass |

### rule.require.input-context-pattern

| file | uses (input, context?) | verdict |
|------|------------------------|---------|
| feedbackTakeGet.ts | `(input, context)` | pass |
| feedbackTakeSet.ts | `(input)` (no context needed) | pass |
| computeFeedbackHash.ts | `(input)` (pure function) | pass |
| validateFeedbackTakePaths.ts | `(input)` (pure function) | pass |
| asFeedbackTakenPath.ts | `(input)` (pure function) | pass |

### rule.require.what-why-headers

| file | has .what/.why | verdict |
|------|---------------|---------|
| feedbackTakeGet.ts | yes | pass |
| feedbackTakeSet.ts | yes | pass |
| computeFeedbackHash.ts | yes | pass |
| validateFeedbackTakePaths.ts | yes (+ .note) | pass |
| asFeedbackTakenPath.ts | yes | pass |

### rule.require.narrative-flow

| file | has code paragraphs | no else branches | verdict |
|------|---------------------|------------------|---------|
| feedbackTakeGet.ts | yes | yes | pass |
| feedbackTakeSet.ts | yes | yes | pass |
| validateFeedbackTakePaths.ts | yes (early throws) | yes | pass |

### rule.require.failfast

| file | uses BadRequestError for validation | verdict |
|------|-------------------------------------|---------|
| validateFeedbackTakePaths.ts | yes | pass |
| feedbackTakeSet.ts | yes (file not found) | pass |

### rule.forbid.gerunds

checked all files for gerund usage:

| file | gerunds found | verdict |
|------|---------------|---------|
| feedbackTakeGet.ts | none | pass |
| feedbackTakeSet.ts | none | pass |
| validateFeedbackTakePaths.ts | none | pass |
| computeFeedbackHash.ts | none | pass |

### rule.require.treestruct

| function name | follows [verb][...nounhierarchy] | verdict |
|---------------|----------------------------------|---------|
| feedbackTakeGet | feedback + Take + Get | pass |
| feedbackTakeSet | feedback + Take + Set | pass |
| computeFeedbackHash | compute + Feedback + Hash | pass |
| validateFeedbackTakePaths | validate + Feedback + Take + Paths | pass |
| asFeedbackTakenPath | as + Feedback + Taken + Path | pass |
| getAllFeedbackForBehavior | get + All + Feedback + For + Behavior | pass |
| getFeedbackStatus | get + Feedback + Status | pass |

## test code adherance

### rule.require.given-when-then

| test file | uses test-fns | verdict |
|-----------|---------------|---------|
| feedbackTakeSet.integration.test.ts | `import { given, then, when } from 'test-fns'` | pass |
| feedbackTakeGet.integration.test.ts | yes | pass |
| computeFeedbackHash.test.ts | yes | pass |
| validateFeedbackTakePaths.test.ts | yes | pass |

### test label convention

| test file | uses [caseN] for given | uses [tN] for when | verdict |
|-----------|------------------------|--------------------| --------|
| feedbackTakeSet.integration.test.ts | yes ([case1], [case2], ...) | yes ([t0]) | pass |
| feedbackTakeGet.integration.test.ts | yes | yes | pass |
| validateFeedbackTakePaths.test.ts | yes | yes | pass |

### rule.forbid.remote-boundaries (unit tests)

| unit test file | crosses remote boundary | verdict |
|----------------|------------------------|---------|
| computeFeedbackHash.test.ts | no (pure function) | pass |
| validateFeedbackTakePaths.test.ts | no (pure function) | pass |
| asFeedbackTakenPath.test.ts | no (pure function) | pass |

## shell skill adherance

### portable skills pattern

| skill | uses `node -e import()` | verdict |
|-------|------------------------|---------|
| feedback.give.sh | yes | pass |
| feedback.take.get.sh | yes | pass |
| feedback.take.set.sh | yes | pass |
| give.feedback.sh | yes (backwards compat) | pass |

## verdict

**all mechanic role standards are followed.**

no violations of required patterns found. all production code uses arrow functions, (input, context) pattern, .what/.why headers, narrative flow with code paragraphs, failfast errors, and treestruct name convention. all test code uses test-fns given/when/then with proper [caseN]/[tN] labels. no gerunds, no forbidden terms, no anti-patterns.
