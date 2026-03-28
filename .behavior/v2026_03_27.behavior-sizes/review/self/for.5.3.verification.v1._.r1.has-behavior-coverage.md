# self-review: has-behavior-coverage (r1)

## wish/vision behavior → test coverage

### from wish

| behavior | test file | covered? |
|----------|-----------|----------|
| --size nano\|mini\|medi\|mega\|giga flag | getAllTemplatesBySize.test.ts | yes |
| medi = default | initBehaviorDir.test.ts | yes |
| sizes are additive | getAllTemplatesBySize.test.ts | yes |
| orthogonal with --guard | isTemplateInSize tests | yes |
| only difference is which stones included | getAllTemplatesBySize.test.ts snapshots | yes |

### from vision

| behavior | test file | covered? |
|----------|-----------|----------|
| nano creates 5 files | getAllTemplatesBySize.test.ts (nano returns 9 templates) | yes |
| mini adds criteria + research + evaluation | getAllTemplatesBySize.test.ts (mini snapshot) | yes |
| medi adds reflection + playtest | getAllTemplatesBySize.test.ts (medi snapshot) | yes |
| mega adds domain research + factory + distillation | getAllTemplatesBySize.test.ts (mega snapshot) | yes |
| giga = mega (reserved) | getAllTemplatesBySize.test.ts (giga === mega test) | yes |
| medi is default | initBehaviorDir.test.ts | yes |
| size composes with guard | isTemplateInSize handles guard variants | yes |
| help shows sizes | acceptance tests | yes |

## evidence

each behavior from wish/vision maps to a test file. the checklist in 5.3.verification.v1.i1.md shows the coverage.

## conclusion

all behaviors have test coverage.
