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
