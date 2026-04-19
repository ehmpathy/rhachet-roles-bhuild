# self-review: has-contract-output-variants-snapped

## new contracts added

none. this PR adds template text only:
- `1.vision.stone` — groundwork section (text)
- `1.vision.guard.light` — has-grounded-in-reality guard (YAML)
- `1.vision.guard.heavy` — same guard (YAML)

no new CLI commands, API endpoints, or SDK methods.

## modified contracts

none. the template files are consumed by `init.behavior` which already has snapshot coverage in acceptance tests.

## why this holds

template text changes don't create new contracts — they modify what gets rendered into behavior directories. the contract is `init.behavior`, which:
1. already has acceptance tests with snapshots
2. those snapshots are validated by CI/CD
3. my template changes will surface in snapshot diffs if they affect output

## conclusion

no new contracts = no new snapshot requirements. prior acceptance test coverage validates template render.
