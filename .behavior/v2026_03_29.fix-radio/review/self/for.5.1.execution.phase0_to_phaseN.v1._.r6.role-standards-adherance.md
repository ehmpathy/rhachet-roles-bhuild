# self-review: role-standards-adherance (r6)

review of code against mechanic role standards.

---

## briefs directories checked

relevant practices for this code:
- practices/code.prod/evolvable.procedures
- practices/code.prod/evolvable.architecture
- practices/code.prod/pitofsuccess.errors
- practices/code.prod/pitofsuccess.procedures
- practices/code.prod/readable.comments
- practices/code.prod/readable.narrative
- practices/code.test/frames.behavior
- practices/lang.terms
- practices/lang.tones

---

## getAuthFromKeyrack.ts

| rule | status | evidence |
|------|--------|----------|
| rule.require.arrow-only | ✓ | line 10: `export const getAuthFromKeyrack = async (input: ...) => {` |
| rule.require.input-context-pattern | ✓ | uses `(input: {...})` — no context needed since keyrack is module import |
| rule.require.what-why-headers | ✓ | lines 3-8: `.what` and `.why` present |
| rule.require.fail-fast | ✓ | lines 23, 26-30: early throws on error conditions |
| rule.forbid.io-as-domain-objects | ✓ | inline type `{ token: string }` |
| rule.require.single-responsibility | ✓ | one operation per file |
| rule.forbid.gerunds | ✓ | no gerunds in comments |
| rule.prefer.lowercase | ✓ | comments use lowercase |

**why it holds**: the code follows all applicable mechanic standards.

---

## getGithubTokenByAuthArg.ts

| rule | status | evidence |
|------|--------|----------|
| rule.require.arrow-only | ✓ | line 25: `export const getGithubTokenByAuthArg = async (input, context) => {` |
| rule.require.input-context-pattern | ✓ | lines 25-30: `(input: {...}, context: {...})` |
| rule.require.dependency-injection | ✓ | context.env, context.shx injected |
| rule.require.what-why-headers | ✓ | lines 5-24: `.what`, `.why`, `.note`, `.returns`, `.throws` |
| rule.require.fail-fast | ✓ | early throws throughout (lines 54-57, 67-70, 82-84, 90-104) |
| rule.forbid.io-as-domain-objects | ✓ | inline union type in return |
| rule.require.single-responsibility | ✓ | one operation per file |
| rule.require.narrative-flow | ✓ | linear flow with early returns, no nested if/else |
| rule.forbid.gerunds | ✓ | no gerunds in comments |
| rule.prefer.lowercase | ✓ | comments use lowercase |

**why it holds**: the code follows all applicable mechanic standards.

---

## getAuthFromKeyrack.test.ts

| rule | status | evidence |
|------|--------|----------|
| rule.require.given-when-then | ✓ | uses given/when/then from test-fns |
| rule.require.data-driven | n/a | not applicable — behavior test not caselist |
| test file name | ✓ | collocated `*.test.ts` |

**why it holds**: test follows bdd pattern with proper imports.

---

## getGithubTokenByAuthArg.test.ts

| rule | status | evidence |
|------|--------|----------|
| rule.require.given-when-then | ✓ | uses given/when/then from test-fns |
| mock pattern | ✓ | mocks at module level, not inline |
| test file name | ✓ | collocated `*.test.ts` |

**why it holds**: test follows bdd pattern with clear case structure.

---

## acceptance test

| rule | status | evidence |
|------|--------|----------|
| rule.require.given-when-then | ✓ | uses given/when/then from test-fns |
| rule.require.useThen-useWhen | ✓ | uses useBeforeAll for shared setup |
| rule.require.blackbox | ✓ | tests via runRhachetSkill, no internal imports |

**why it holds**: acceptance test follows blackbox pattern.

---

## potential concerns reviewed

### getAuthFromKeyrack lacks context parameter

**question**: should keyrack be injected via context?

**analysis**: the keyrack module is imported at module level. tests mock it via `jest.mock('rhachet/keyrack')`. this is acceptable because:
1. keyrack is a thin wrapper around the rhachet keyrack module
2. module-level mock achieves testability
3. the function is small and focused

**verdict**: acceptable — module-level dependency for simple wrapper functions.

### no else branches

checked all auth mode branches — each uses early return pattern without else.

**verdict**: follows rule.forbid.else-branches ✓

---

## conclusion

all implementation files adhere to mechanic role standards:
- arrow functions ✓
- input-context pattern ✓
- dependency injection (where applicable) ✓
- what-why headers ✓
- fail-fast ✓
- inline types ✓
- single responsibility ✓
- narrative flow ✓
- lowercase comments ✓
- no gerunds ✓
- given-when-then tests ✓

**no violations found**.

