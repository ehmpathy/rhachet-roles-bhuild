# self-review: has-play-test-convention (r3)

## continued from r2

r2 verified that `.play.acceptance.test.ts` is the correct suffix. this r3 review confirms with deeper reflection.

## why `.play.acceptance` vs other options

| option | fits? | why |
|--------|-------|-----|
| `.test.ts` | no | unit tests, not journey tests |
| `.integration.test.ts` | partial | tests domain operations directly |
| `.play.test.ts` | partial | repo may not run these by default |
| `.play.acceptance.test.ts` | **yes** | full workflow via CLI |

### the decisive factor

these tests:
1. invoke `rhx feedback.*` commands
2. verify terminal output
3. check file system state
4. validate full user workflow

this is **acceptance scope** — tests the system as a user would use it.

### repo test runners verified

checked package.json:
- `npm run test:unit` — runs `.test.ts`
- `npm run test:integration` — runs `.integration.test.ts`
- `npm run test:acceptance` — runs `.acceptance.test.ts`

the `.play.acceptance.test.ts` suffix will be picked up by `npm run test:acceptance`.

## did I check the describe block name?

yes — from the yield file:
```typescript
describe('feedback.take.get.play.acceptance', () => {
```

this matches the expected convention:
- `feedback.take.get` — the operation
- `.play` — journey test marker
- `.acceptance` — acceptance scope

## issues found

none.

## conclusion

the journey test convention is correctly documented:
1. `.play.acceptance.test.ts` for CLI workflow tests
2. describe block names match file suffix convention
3. test runner will pick up these files via `npm run test:acceptance`
