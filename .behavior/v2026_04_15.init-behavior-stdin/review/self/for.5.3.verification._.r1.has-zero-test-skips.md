# self-review: has-zero-test-skips

## question

did you verify zero skips - and REMOVE any you found?

## review

### .skip() and .only() scan

ran: `grep -r '\.skip\(\|\.only\(' blackbox/role=behaver/*init.behavior*.test.ts`

result: no matches in init.behavior test files

### silent credential bypasses

no `if (!credentials) return` or similar patterns in init.behavior tests.

the tests use `genConsumerRepo()` which creates real temporary git repos - no mocks of git operations.

### prior failures carried forward

no known-broken tests. all tests that existed before this PR still pass.

## verdict

zero skips verified:
- [x] no .skip() or .only() found
- [x] no silent credential bypasses
- [x] no prior failures carried forward

no gaps found.
