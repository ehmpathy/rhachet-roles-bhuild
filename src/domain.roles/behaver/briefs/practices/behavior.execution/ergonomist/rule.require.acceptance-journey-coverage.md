# tldr

## severity: blocker

require acceptance journey coverage: every user journey must have acceptance tests with snapshots

user journeys are promises to humans. each journey must be verified end-to-end with snapshots that enable visual review.

---
---
---

# deets

## .what

review for acceptance test coverage on user-faced contracts.

## .why

acceptance tests prove the contract works for real users. snapshots enable visual review in PRs. gaps in coverage are blind spots that ship defects.

## severity: blocker

absent acceptance tests block merge. every user journey requires verification.

## .how

for each contract in the diff (cli, api, sdk), verify:

1. **acceptance test exists**
   - `.acceptance.test.ts` file present
   - tests exercise real user journeys
   - given/when/then structure

2. **snapshot coverage**
   - positive path snapped
   - negative path snapped (errors)
   - edge cases snapped

3. **journey completeness**
   - full user flow tested
   - not just happy path
   - error states verified

4. **integration tests for external contracts**
   - real api calls, not mocks
   - credential difficulty is blocker, not deferral

## .examples

### blocker — no acceptance test

new cli command `behavior init` added.
no `behavior.init.acceptance.test.ts` file.

### blocker — no error snapshot

api endpoint returns 400 on invalid input.
tests only snapshot 200 responses.

the error response must also be snapped.

### blocker — mock instead of integration

```ts
jest.mock('stripe'); // forbidden
```

real stripe api must be called in integration tests.

### mask non-deterministic journey output, then snap it live

a journey whose output holds a non-deterministic field (a live-model verdict, a timestamp, a network value) is NOT exempt from a live snapshot. MASK the volatile field — replace it with a stable placeholder before the snapshot (a sampled verdict → `<verdict>`, a timestamp → `<ts>`) — and snap the live journey with only those bytes neutralized. the deterministic shape around the field (the journey's steps, static output, error states) is still proven end-to-end against the real source.

do NOT settle for a snapshot only at an injected or mocked layer and call the live journey covered. the injected layer proves the exact value against a stub; the masked live snapshot proves the real caller journey. exhaustive coverage wants the live journey snapped with the volatile bytes masked — not skipped, not pushed one layer down.

note: a live external api (stripe, a database) is deterministic ENOUGH — the same call yields the same shape — so it needs no mask; the integration rule above holds as-is. a mask is only for a field that varies run-to-run for identical input (a sampled model verdict, a clock, a random id).

## .test structure

```ts
describe('POST /invoices', () => {
  given('[case1] valid payload', () => {
    when('[t0] endpoint is called', () => {
      const response = useThen('succeeds', async () =>
        request(app).post('/invoices').send(payload),
      );
      then('matches snapshot', () => {
        expect(response.body).toMatchSnapshot();
      });
    });
  });
});
```
