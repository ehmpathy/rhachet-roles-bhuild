# tldr

## severity: blocker

forbid behavior hazards: code must behave predictably under all conditions

behavior hazards cause intermittent failures, data corruption, and impossible-to-debug production incidents. they hide until the worst moment.

---
---
---

# frame

this contributor has introduced behavior hazards before — race conditions, order-dependent code, hidden side effects. scrutinize any concurrent access, implicit state, or non-obvious control flow.

---
---
---

# deets

## .what

review for structural patterns that create unpredictable behavior at runtime.

## .why

behavior hazards are the hardest bugs to find and fix:
- they reproduce intermittently
- they depend on time, load, or external state
- they pass tests but fail in production
- they corrupt data silently

## severity: blocker

behavior hazards block merge. these are not style issues — they are correctness issues.

## .how

for each operation in the diff, check:

1. **race conditions**
   - does this write to shared state that others read concurrently?
   - are there read-modify-write sequences without locks or transactions?
   - could two instances of this code run simultaneously?

2. **order-dependence**
   - does this assume another function was called first?
   - are there implicit setup/teardown requirements?
   - would a reversed call order break behavior?

3. **time assumptions**
   - does this use setTimeout/setInterval with time assumptions?
   - does this poll without backoff or max attempts?
   - does this assume network/disk latency bounds?

4. **hidden side effects**
   - does the function do more than its name suggests?
   - are there mutations to inputs or global state?
   - are there writes to external systems not obvious from the signature?

5. **unexpected defaults**
   - does this silently fall back to an unexpected value?
   - are undefined/null cases handled with non-obvious defaults?
   - would the caller expect this default behavior?

6. **non-determinism**
   - given the same inputs, could this produce different outputs?
   - does this depend on wall clock time, random values, or external state?
   - if non-determinism is required, is it explicit and documented?

7. **idempotency violations**
   - could this operation produce different results if called twice?
   - are retries safe or would they duplicate side effects?
   - does this create duplicate records on retry?

## .examples

### blocker — race condition

```ts
// read-modify-write without protection
const count = await getCount();
await setCount(count + 1);
```

fix: use atomic increment or transaction

### blocker — order-dependence

```ts
// assumes init() was called somewhere else
export const processOrder = async (order: Order) => {
  const config = getConfig(); // throws if init() not called
  // ...
};
```

fix: pass config explicitly or validate with clear error

### blocker — hidden side effect

```ts
// name says "get" but it also writes
export const getOrCreateUser = async (email: string) => {
  let user = await findUser(email);
  if (!user) user = await createUser(email); // hidden write!
  return user;
};
```

fix: rename to `ensureUser` or split into explicit get/create

### blocker — unexpected default

```ts
// silently returns empty array on error
export const getUsers = async () => {
  try {
    return await fetchUsers();
  } catch {
    return []; // caller thinks no users exist
  }
};
```

fix: throw or return result type that distinguishes empty from error

### blocker — non-idempotent operation

```ts
// retry creates duplicate charge
export const chargeCustomer = async (customerId: string, amount: number) => {
  return await stripe.charges.create({ customer: customerId, amount });
};
```

fix: use idempotency key or check for extant charge first

## .note

if behavior hazards are truly unavoidable (rare), document them explicitly with rationale. undocumented hazards are always blockers.
