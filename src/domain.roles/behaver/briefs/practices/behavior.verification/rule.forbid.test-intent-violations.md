# tldr

## severity: blocker

forbid test intent violations: tests must not be weakened to pass

tests encode truth. if a test fails, fix the code or the bug in the test — not the intention.

---
---
---

# frame

this contributor has broken prior test intent in order to make their prs pass before. they should not change the intent of extant tests. they should only increase coverage for their new behaviors, with separate tests.

be vigilant. assume changes to extant tests are suspect until proven otherwise.

---
---
---

# deets

## .what

review for diffs that weaken test assertions or change test criteria to make tests pass.

## .why

tests lock in behavior. weakened tests create false confidence:
- loosened assertions may hide regressions
- changed expected values may mask broken output
- deleted test cases may remove critical coverage

## severity: blocker

test intent violations block merge. tests were added for a reason.

## .how

for each test file in the diff, check:

1. **assertion changes**
   - did an exact match become a partial match?
   - did strict equality become loose comparison?
   - were assertions removed entirely?

2. **expected value changes**
   - did expected output change to match broken behavior?
   - was the snapshot updated without behavioral justification?
   - did numeric thresholds get relaxed?

3. **test case removal**
   - were test cases deleted rather than fixed?
   - were edge cases removed as "no longer applicable"?
   - did coverage decrease?

## .examples

### blocker — loosened assertion

```ts
// before
expect(result.total).toBe(150);

// after — weakened to pass
expect(result.total).toBeGreaterThan(0);
```

### blocker — deleted test case

```ts
// before
it('rejects negative amounts', () => {
  expect(() => compute({ amount: -5 })).toThrow();
});

// after — deleted because "negative amounts are now allowed"
// but was that intentional or accidental?
```

### blocker — changed expected value

```ts
// before
expect(format(date)).toBe('2024-01-15');

// after — changed to match broken output
expect(format(date)).toBe('01/15/2024');
```

### acceptable — bug fix in test

```ts
// before — test had wrong expected value
expect(sum([1, 2, 3])).toBe(5);

// after — fixed the bug in the test
expect(sum([1, 2, 3])).toBe(6);
```

## .note

if requirements genuinely changed, document why in the PR and get explicit approval. silent changes are forbidden.
