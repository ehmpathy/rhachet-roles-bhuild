# self-review: has-preserved-test-intentions (round 4)

## slow down and look deeper

the guide asks: "did you change what the test asserts, or fix why it failed?"

let me examine this more carefully for each changed test.

## skill.give.feedback.acceptance.test.ts

### before:
```ts
// test verified feedback file in behavior root
const feedbackFiles = fs.readdirSync(scene.behaviorDir).filter(
  (f) => f.includes('[feedback]') && !f.startsWith('.ref.'),
);
```

### after:
```ts
// test verifies feedback file in feedback/ subdirectory
const feedbackDir = path.join(scene.behaviorDir, 'feedback');
const feedbackFiles = fs.readdirSync(feedbackDir).filter(
  (f) => f.includes('[feedback]') && f.includes('[given]'),
);
```

### is this a weakened assertion?

NO. the test still verifies:
1. feedback file exists
2. feedback file has correct content
3. feedback file has placeholders replaced

the LOCATION changed (root → feedback/), but the INTENTION is preserved:
- "verify feedback file created with correct content"

### why did the location change?

the wish explicitly requested:
> "lets move the feedback path produced by feedback.give into $behavior/feedback/..."

this is a requirement change, documented in 0.wish.md.

## getLatestFeedbackVersion.test.ts

### what the tests verified before:
- case1: no feedback in root → null
- case2: v1 feedback in root → 1
- case3: v1+v2 in root → 2
- case4: multiple artifacts in root → filters
- case5: out-of-order in root → highest

### what the tests verify after:
- case1: no feedback in feedback/ → null
- case2: v1 feedback in feedback/ → 1
- case3: v1+v2 in feedback/ → 2
- case4: multiple artifacts in feedback/ → filters
- case5: out-of-order in feedback/ → highest

### is this a weakened assertion?

NO. same test intentions. the function now looks in `feedback/` subdirectory per the requirement. tests updated to match.

## forbidden pattern check (line by line)

| forbidden pattern | evidence of violation? |
|-------------------|----------------------|
| weaken assertions to make tests pass | NO — same assertions, different location |
| remove test cases that "no longer apply" | NO — all cases preserved |
| change expected values to match broken output | NO — expected values unchanged |
| delete tests that fail instead of fix code | NO — no tests deleted |

## requirements changed — is this documented?

YES. the wish (0.wish.md) explicitly says:
> "lets move the feedback path produced by feedback.give into $behavior/feedback/..."

this is not a silent change. it is the documented requirement.

## verdict

test intentions preserved. location changed per documented requirement. assertions remain equally strong.

