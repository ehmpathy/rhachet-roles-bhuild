.rule = require.contract-snapshot-exhaustiveness

.what = every user-faced contract must have exhaustive snapshot coverage for all output variants

.why = snapshots prove the contract works for all callers; gaps in coverage are blind spots in review; without snapshots, drift goes undetected and regressions ship

.how = verify every cli command, api endpoint, and sdk method has snapshots for positive path, negative path, and edge cases; check stdout/stderr for cli, response body for api, return value for sdk

.examples:
  .positive:
    - |
      ## cli snapshots

      | command | variants | snapshot file |
      |---------|----------|---------------|
      | behavior init | success, error, --help | behavior.init.snap |
      | behavior bind | success, not-found, --help | behavior.bind.snap |

      each variant exercises:
      - positive path: command succeeds
      - negative path: command fails with clear error
      - help: --help output documented
      - edge: empty input, invalid input, boundary conditions
    - |
      ## sdk snapshots

      | method | variants | snapshot file |
      |--------|----------|---------------|
      | getBehavior | found, not-found, invalid-id | getBehavior.snap |
      | setBehavior | created, updated, validation-error | setBehavior.snap |

  .negative:
    - |
      ## tests

      tests verify the behavior works.
    - |
      ## cli tests

      - behavior init creates the directory
      - behavior bind works

      (no snapshots, no error cases, no edge cases)
    - |
      ## snapshots

      - behavior.init.snap (only success path)

.severity = BLOCKER

.note = zero gaps in caller experience. every variant that a caller could encounter must be snapped. if you find yourself about to skip a variant, that is the variant that will break in prod.
