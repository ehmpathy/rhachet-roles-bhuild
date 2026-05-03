# tldr

## severity: blocker

forbid scope leaks: code must respect bounded context boundaries

cross-domain scope leaks occur when code reaches into another domain's internals. each domain owns its logic, models, and procedures.

---
---
---

# deets

## .what

review for cross-domain scope leaks: code that violates bounded context boundaries.

## .why

scope leaks entangle domains, create hidden dependencies, and make code hard to evolve. they couple modules that should be independent.

## severity: blocker

scope leaks block merge. domain boundaries must be respected.

## .how

for each change in the diff, check:

1. **bounded context violation**
   - does this module import from another domain's internals?
   - does it mutate state owned by another context?
   - does it enforce invariants that belong to another domain?

2. **directional dependency violation**
   - does lower layer import from higher layer?
   - does domain.objects import from access/?
   - does domain.operations import from contract/?

3. **reach-in anti-pattern**
   - does code reach into `../../other-domain/internal.ts`?
   - should this use a contract or shared interface instead?

## .examples

### blocker — import from other domain's internals

```ts
// in job/processJob.ts
import { validateCustomer } from '../../customer/internal/validate';
```

customer validation belongs to customer domain. use exported contract.

### blocker — upward dependency

```ts
// in domain.objects/Customer.ts
import { customerDao } from '../access/daos/customerDao';
```

domain.objects must not import from access layer.

### blocker — cross-domain mutation

```ts
// in invoice/generateInvoice.ts
customer.phone = normalizedPhone; // mutates customer domain state
```

invoice domain must not mutate customer domain objects directly.
