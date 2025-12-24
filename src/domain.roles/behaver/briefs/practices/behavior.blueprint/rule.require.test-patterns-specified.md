.rule = require.test-patterns-specified

.what = blueprints must specify test patterns for integration and acceptance tests

.why = clear test patterns enable fast feedback loops and thorough verification; without patterns, tests become inconsistent and unreliable

.how = verify test patterns are articulated (given/when/then structure, fixtures, mocks vs real, isolation strategy); check that patterns support rapid iteration

.examples:
  .positive:
    - |
      ## testing

      ### test patterns

      **unit tests**
      - pure function testing with mocked dependencies
      - given/when/then structure via test-fns

      **integration tests**
      - real filesystem operations against .test/assets/example.repo/
      - no mocking of bhrain invocation
      - cleanup via afterEach hooks

      **acceptance tests**
      - black-box testing via CLI invocation
      - verify file outputs exist and contain expected content
      - use real behavior directory structure
  .negative:
    - |
      ## testing

      **unit tests**
      - test the functions

      **integration tests**
      - test the integrations
    - |
      ## testing

      we will use jest for testing.

.severity = BLOCKER
