.rule = require.test-coverage-specified

.what = blueprints must specify test coverage for all components

.why = untested code should never reach production; explicit test coverage specification ensures verification strategy is planned upfront

.how = verify unit/integration/acceptance test specifications exist; check that each component has declared test coverage level

.examples:
  .positive:
    - |
      ## testing

      ### test coverage

      **unit tests** (review.behavior.test.ts)
      - argument parse validates required args
      - behavior directory resolution finds correct match
      - artifact file resolution finds correct files

      **integration tests** (review.behavior.integration.test.ts)
      - given valid behavior, review produces feedback files
      - given absent criteria, review warns but continues

      **acceptance tests**
      - npx rhachet run --repo bhuild --skill review.behavior --of valid-behavior
        - produces feedback files collocated with artifacts
  .negative:
    - |
      ## implementation

      the skill will parse arguments, resolve directories, and invoke bhrain.

      ## notes

      should probably add tests later.
    - |
      ## testing

      tests will be written as needed.

.severity = BLOCKER
