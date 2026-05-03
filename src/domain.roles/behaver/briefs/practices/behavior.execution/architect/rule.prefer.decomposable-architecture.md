# tldr

## severity: blocker

prefer decomposable architecture: operations that compose, recompose, evolve

code should decompose into reusable operations. orchestrators read as narrative. transformers encapsulate compute. communicators encapsulate i/o.

---
---
---

# deets

## .what

review for architectural decomposition that enables recomposition.

## .why

decomposition for recomposition is the core mechanism of dynamically-stable systems. operations that compose safely enable evolution without teardown. poor decomposition compounds — fix it now or pay exponentially later.

## severity: blocker

decomposition violations block merge. flag clear violations as blockers, minor improvements as nitpicks.

## .how

for each new operation in the diff, ask:

1. **grain clarity**: is this a transformer, communicator, or orchestrator?
   - transformers: pure compute, no i/o
   - communicators: raw i/o boundary (sdks, daos)
   - orchestrators: compose leaf operations

2. **orchestrator narrative**: does the orchestrator read as prose?
   - each line tells what, not how
   - no decode-friction inline

3. **recomposition potential**: could these pieces compose differently?
   - single responsibility per operation
   - explicit inputs and outputs
   - dependency injection via context

4. **wet over dry**: is abstraction premature?
   - wait for 3+ usages before extract
   - duplication is cheaper than wrong abstraction

## .examples

### blocker — mixed grains

```ts
// orchestrator with raw i/o inline
const result = await stripe.customers.create({ email });
```

fix: extract to `sdkStripe.setCustomer({ email })`

### blocker — unclear grain

```ts
// is this a transformer or communicator? ambiguous
export const processOrder = async (order: Order) => {
  const total = order.items.reduce((s, i) => s + i.price, 0);
  await db.orders.insert({ ...order, total });
  return { total };
};
```

fix: split into `computeOrderTotal` (transformer) and `daoOrders.set` (communicator)

### nitpick — decode-friction in orchestrator

```ts
// inline logic requires mental simulation
const emails = users.filter(u => u.active).map(u => u.email);
```

suggest: extract to `getAllActiveUserEmails({ users })`
