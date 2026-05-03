# tldr

## severity: blocker

forbid maintenance hazards: code that will cause debug hours or silent defects

maintenance hazards are structural defects that compound over time. they hide errors, create race conditions, or make code hard to reason about.

---
---
---

# deets

## .what

review for maintenance hazards: patterns that will cause future pain.

## .why

maintenance hazards cost hours of debug time and erode trust. they ship defects that surface in production, not in review.

## severity: blocker

maintenance hazards block merge. the cost of fix now is far less than the cost of debug later.

## .how

for each change in the diff, check for:

1. **failhide**: does any try/catch hide errors?
   - catch must allowlist expected errors
   - unexpected errors must rethrow
   - silent swallow is forbidden

2. **failfast**: does code halt on invalid state?
   - guard clauses before main logic
   - throw helpful errors with context
   - no silent continuation on bad input

3. **failloud**: do errors include actionable context?
   - what failed, why, how to fix
   - include relevant input values
   - no generic "operation failed" messages

4. **idempotency**: are mutations safe to retry?
   - use findsert/upsert/delete
   - no create/insert that duplicate
   - no non-idempotent side effects

5. **immutability**: are variables mutated?
   - use const, not let
   - use spread/clone, not assignment
   - no shared mutable state

6. **narrative flow**: is code easy to follow?
   - no else branches
   - early returns for guards
   - one clear path through logic

## .examples

### blocker — failhide

```ts
try {
  await sendInvoice();
} catch (error) {
  // swallowed — real errors hidden
}
```

### blocker — non-idempotent mutation

```ts
await db.insert({ email }); // duplicates on retry
```

should use: `await db.upsert({ email });`

### blocker — mutable state

```ts
let total = 0;
items.forEach(i => total += i.amount);
```

should use: `const total = items.reduce((s, i) => s + i.amount, 0);`
