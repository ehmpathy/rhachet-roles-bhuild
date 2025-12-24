.rule = require.determinism-declared

.what = blueprints must declare which parts are deterministic vs probabilistic

.why = different test strategies apply to each; deterministic code can be assertion-tested; probabilistic code requires example-based or snapshot testing

.how = check for explicit determinism classification of components; verify probabilistic components have example references

.examples:
  .positive:
    - |
      ## testing

      ### deterministic components
      - argument parse
      - behavior directory resolution
      - artifact file resolution
      - bhrain invocation command construction
      - output file path generation

      ### probabilistic components
      - bhrain review feedback content (llm-generated)
        - reference: bhrain already has examples of review output
  .negative:
    - |
      ## testing

      ### test coverage

      **unit tests**
      - test all the things

      **integration tests**
      - test more things
    - |
      ## implementation

      the skill generates feedback using an llm.

      ## testing

      we will test the output.

.severity = BLOCKER
