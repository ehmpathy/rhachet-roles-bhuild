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

.note = non-deterministic outputs are MASKED, then snapped live — never carved out

some contract outputs hold inherently non-deterministic fields: a live-model verdict, a timestamp, a random id, a network-dependent value. do NOT skip the snapshot for these, and do NOT settle for a snapshot only at an injected or mocked layer. instead, MASK the volatile field — replace it with a stable placeholder before the snapshot (a timestamp → `<ts>`, a uuid → `<id>`, a sampled verdict → `<verdict>`) — so the live output is snapped with only the volatile bytes neutralized.

a mask keeps the real caller path under snapshot: the deterministic structure around the volatile field (static fields, error shape, key order) is still proven live, and only the bytes that vary run-to-run are hidden. this kills the flakiness WITHOUT a live-layer coverage blind spot.

a masked live snapshot and a deterministic injected-layer snapshot are complementary, not substitutes: the injected layer proves the exact volatile value against a stubbed source; the masked live layer proves the contract shape against the real source.
