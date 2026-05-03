# tldr

## severity: blocker

forbid friction hazards: user experience must be smooth, errors must be clear

ergonomic friction degrades user trust. friction hazards not covered by acceptance tests will ship and frustrate users.

---
---
---

# deets

## .what

review for ergonomic friction that is unaddressed or friction hazards not covered with acceptance tests and snapshots.

## .why

friction compounds user frustration:
- unclear error messages cause support tickets
- unclear flows cause abandonment
- unsnapped outputs drift without notice
- untested friction paths ship broken

## severity: blocker

friction hazards without test coverage block merge. users deserve smooth experiences.

## .how

for each user-faced operation in the diff, check:

1. **error clarity**
   - are error messages actionable?
   - do they tell the user what went wrong AND how to fix it?
   - are error codes consistent and documented?

2. **flow friction**
   - are there unnecessary steps?
   - is the happy path obvious?
   - are blocked states clearly communicated?

3. **output consistency**
   - is stdout/stderr consistent across invocations?
   - are response formats stable and documented?
   - would output changes break downstream callers?

4. **friction test coverage**
   - is every error path acceptance tested?
   - is every blocked state snapped?
   - can a reviewer see actual user experience via snapshots?

5. **help and discoverability**
   - does --help exist and show all options?
   - are required vs optional inputs clear?
   - are defaults documented and sensible?

## .examples

### blocker — unclear error

```
Error: EINVAL
```

fix: "Invalid phone format. Expected: +1XXXXXXXXXX, got: 555-1234"

### blocker — friction not snapped

```ts
it('rejects invalid input', () => {
  expect(() => run({ bad: true })).toThrow();
  // no snapshot of error message!
});
```

fix: add `expect(error.message).toMatchSnapshot()`

### blocker — hidden blocked state

```ts
// silently returns null when user lacks permission
if (!hasPermission(user)) return null;
```

fix: throw with clear message, snap the error

### nitpick — help could be clearer

```
--format  Output format
```

suggest: "--format  Output format (json|csv|table, default: table)"

## .note

every friction point a user can hit must be tested and snapped. if you can't show the reviewer what the user sees, it's not verified.
