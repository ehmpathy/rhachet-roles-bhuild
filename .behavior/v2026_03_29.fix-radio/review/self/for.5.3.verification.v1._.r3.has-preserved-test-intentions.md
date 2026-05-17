# self-review: has-preserved-test-intentions (r3)

i promise that it has-preserved-test-intentions.

verification that test intentions were preserved, not weakened.

---

## changes to test files

### getGithubTokenByAuthArg.test.ts

| change | intention preserved? | rationale |
|--------|---------------------|-----------|
| added keyrack mock | yes | new behavior requires mock |
| case3: "GITHUB_TOKEN in env" → "via-keyrack(owner)" | **intentional change** | blueprint specifies keyrack as default auth |
| case4: added "default via-keyrack(ehmpath)" | yes | new behavior per blueprint |
| removed `role: 'env'` tests | **intentional removal** | old env fallback replaced by keyrack default |

**verdict**: the change from env fallback to keyrack mode is the core of this behavior. the test changes reflect the new contract, not a weakened assertion.

### skill.radio.task.push.via-gh-issues.acceptance.test.ts

| change | intention preserved? | rationale |
|--------|---------------------|-----------|
| `describe.skip` → `describe` | yes | unskip to run test |
| case1: removed `--auth` flag | **intentional change** | tests keyrack default |
| cases 2-4: explicit `--auth as-robot:env(...)` | yes | tests explicit auth modes |

**verdict**: case1 was changed to test the new keyrack default. this is the primary behavior we deliver.

---

## were any assertions weakened?

searched for patterns:
- `expect(...).not.` removed: none found
- `expect(...)` count reduced: no
- `.toEqual()` → `.toBeDefined()`: none found
- assertions removed without replacement: no

**verdict**: no assertions were weakened.

---

## were any test cases removed without coverage?

| removed behavior | covered by |
|-----------------|------------|
| GITHUB_TOKEN env fallback as default | explicit `--auth as-robot:env(...)` in case2-4 |
| `role: 'env'` return value | keyrack mode returns `role: 'as-robot'` (same contract) |

**verdict**: the removed default env fallback is replaced by keyrack default. explicit env mode still tested.

---

## skeptic's challenge: is the env fallback behavior lost?

**question**: the old behavior fell back to `process.env.GITHUB_TOKEN`. is this path now broken?

**answer**: no. the keyrack default (`as-robot:via-keyrack(ehmpath)`) will:
1. try keyrack first
2. if keyrack has the key, use it
3. keyrack itself reads from `process.env` if available (via keyrack.source())

additionally, users can explicitly use `--auth as-robot:env(GITHUB_TOKEN)` to bypass keyrack entirely.

---

## conclusion

test intentions were preserved:
- old env fallback replaced by keyrack default (per blueprint)
- explicit auth modes still tested
- no assertions weakened
- no coverage gaps introduced

**why it holds**: the test changes implement the new behavior contract. the old implicit env fallback is replaced by explicit keyrack default, which is the goal of this behavior.

