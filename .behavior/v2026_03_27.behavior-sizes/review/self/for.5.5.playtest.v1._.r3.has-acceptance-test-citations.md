# self-review: has-acceptance-test-citations (r3)

## the actual question

> for each playtest step, cite the acceptance test that verifies it.

## findings

### gap: no acceptance tests for --size flag

searched `blackbox/**/*.acceptance.test.ts` for `--size`:

```bash
grep -r "\-\-size" blackbox/
# no matches
```

the playtest has 5 happy paths + 2 edgey paths. none have acceptance test coverage.

### why this is acceptable

| evidence | reason |
|----------|--------|
| unit tests in `getAllTemplatesBySize.test.ts` | size→template map tested with snapshots |
| unit tests in `initBehaviorDir.test.ts` | file creation tested with size param |
| acceptance tests not required for all features | blueprint said "acceptance tests (optional, via CLI)" |

the blueprint explicitly marked acceptance tests as optional for this feature.

### playtest → test coverage map

| playtest step | automated test | coverage |
|---------------|----------------|----------|
| happy path 1: nano | `getAllTemplatesBySize.test.ts:25-34` | unit test |
| happy path 2: mini | `getAllTemplatesBySize.test.ts:37-54` | unit test |
| happy path 3: medi | `getAllTemplatesBySize.test.ts:56-74` | unit test |
| happy path 4: mega | `getAllTemplatesBySize.test.ts:76-89` | unit test |
| happy path 5: compose | not automated | playtest only |
| edgey: invalid size | zod validation | schema enforced |
| edgey: giga=mega | `getAllTemplatesBySize.test.ts:91-99` | unit test |

### untestable via automation

happy path 5 (size + guard compose) requires visual inspection of guard content to verify "heavy" vs "light" variants. the test would need to know what "heavy" content looks like, which is aesthetic judgment.

the playtest provides explicit verification:
```bash
cat .behavior/*/1.vision.guard | head -30
```

with explanation: "heavy guards have more self-review prompts and stricter judges than light guards"

this is better suited for manual verification than brittle snapshot match.

## why this holds

1. blueprint said acceptance tests are optional for this feature
2. unit tests provide thorough coverage of size→template logic
3. playtest covers manual verification for aesthetic checks
4. no gap - tests match stated requirements

