.rule = require.external-contract-integration-tests

.what = every external contract (sdk, api, service) must have integration tests that call the real service and verify the response

.why = mocks lie; mocks drift from reality; mocks create false confidence; only real calls prove the integration works

.how = verify every external contract has at least one integration test that calls the real service with real credentials; check that responses are validated against expected shapes; ensure no silent credential bypasses

.examples:
  .positive:
    - |
      ## external contract coverage

      | sdk | integration test | real call? | response validated? |
      |-----|-----------------|------------|---------------------|
      | stripe | stripe.integration.test.ts | yes | yes, schema check |
      | github | github.integration.test.ts | yes | yes, shape assert |
      | openai | openai.integration.test.ts | yes | yes, content check |

      each integration test:
      - calls the real service (not a mock)
      - validates the response shape
      - handles error cases with real error responses
    - |
      ## exception: mocked by vision

      vision.md declares: "github api may be mocked for ci/cd tests due to rate limits"

      | sdk | mock allowed? | reason | real test exists? |
      |-----|--------------|--------|-------------------|
      | github | yes (ci only) | rate limits | yes, in .integration.test.ts |

      even with exception, at least one real test must exist.

  .negative:
    - |
      ## external calls

      stripe api is mocked in tests to avoid charges.
    - |
      ## integration tests

      - stripe.test.ts (uses mock stripe client)
      - no real stripe calls in test suite
    - |
      ## external contracts

      integration tests call mocks because "credentials are hard to get"

.severity = BLOCKER

.note = "lack of credentials" is not an excuse. get them, or fail the gate. if the vision explicitly marks an exception for a specific sdk to be mocked, document that exception and cite the vision. even then, at least one real integration test must exist somewhere, with atleast the lack of creds failure case.
