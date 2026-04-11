# self-review: role-standards-adherance (r7)

deeper line-by-line review against mechanic role standards.

---

## additional briefs checked

beyond r6, reviewed:
- practices/code.prod/pitofsuccess.typedefs (for type casts)
- practices/code.prod/evolvable.domain.objects (for nullable)
- practices/code.prod/evolvable.repo.structure (for imports)

---

## line-by-line review: getAuthFromKeyrack.ts

### line 1: import { keyrack } from 'rhachet/keyrack'
- **rule.require.directional-deps**: import from external package ✓
- no circular dependency risk

### lines 3-9: JSDoc header
- **rule.require.what-why-headers**: `.what` and `.why` present ✓
- **rule.prefer.lowercase**: lowercase ✓
- **rule.forbid.gerunds**: no gerunds ✓

### line 10: export const getAuthFromKeyrack = async (input: {
- **rule.require.arrow-only**: arrow function ✓
- **rule.require.sync-filename-opname**: filename matches export ✓

### lines 10-14: input type
- **rule.forbid.io-as-interfaces**: inline type, no separate interface ✓
- **rule.forbid.undefined-inputs**: all fields required (no optional) ✓

### line 14: }): Promise<{ token: string }> => {
- **rule.forbid.io-as-interfaces**: inline return type ✓

### line 22: const attempt = Array.isArray(result) ? result[0] : result
- **rule.forbid.as-cast**: no `as` cast ✓
- ternary is appropriate for simple type narrow

### lines 26-30: error throw
- **rule.require.fail-fast**: early return on error ✓
- **rule.prefer.helpful-error-wrap**: includes message and fix hint ✓

---

## line-by-line review: getGithubTokenByAuthArg.ts

### lines 25-33: function signature
- **rule.require.input-context-pattern**: `(input, context)` ✓
- **rule.forbid.undefined-inputs**: `auth: string | undefined` — intentional, represents CLI arg absence
- **rule.forbid.io-as-interfaces**: inline types ✓

### lines 37-46: keyrack mode branch
- **rule.forbid.else-branches**: no else, early return ✓
- **rule.require.narrative-flow**: linear code paragraph ✓

### lines 49-60: shx mode branch
- **rule.require.fail-fast**: throws on empty output ✓
- **rule.forbid.else-branches**: no else ✓

### lines 63-73: env mode branch
- **rule.require.fail-fast**: throws on absent var ✓
- **rule.forbid.else-branches**: no else ✓

### lines 76-87: as-human branch
- **rule.require.fail-fast**: throws in test env ✓
- **rule.forbid.else-branches**: no else ✓

### lines 90-104: unrecognized auth error
- **rule.require.fail-fast**: throws for unknown mode ✓
- helpful error message with all valid modes

---

## test files review

### getAuthFromKeyrack.test.ts

- **rule.require.given-when-then**: ✓ uses given/when/then
- **rule.forbid.remote-boundaries**: ✓ mocks keyrack module (no real calls)
- **rule.require.snapshots**: n/a — no output artifacts to snapshot

### getGithubTokenByAuthArg.test.ts

- **rule.require.given-when-then**: ✓ uses given/when/then
- **rule.forbid.remote-boundaries**: ✓ mocks getAuthFromKeyrack
- mock functions follow **rule.require.what-why-headers** ✓

### acceptance test

- **rule.require.blackbox**: ✓ tests via skill invocation, no internal access
- **rule.require.given-when-then**: ✓ uses given/when/then
- **rule.require.useThen-useWhen**: ✓ uses useBeforeAll for shared setup

---

## jest.integration.env.ts review

### line 96: keyrack.source({ env: 'test', owner: 'ehmpath', mode: 'strict' })
- **rule.require.fail-fast**: `mode: 'strict'` ensures fail-fast on locked/absent keys ✓
- conditional on keyrack.yml existence — graceful for repos without keyrack ✓

---

## potential issues checked

### auth: string | undefined in input

**question**: does this violate rule.forbid.undefined-inputs?

**analysis**: the rule says "never use undefined for internal contract inputs". but `auth` represents an optional CLI argument that may be absent. the function handles this by default to via-keyrack(ehmpath). this is intentional design, not oversight.

**verdict**: acceptable — CLI input optionality, not internal contract ambiguity.

### no context in getAuthFromKeyrack

**question**: should keyrack be in context?

**analysis**: reviewed in r6. the function is a thin wrapper. module-level import is tested via jest.mock. acceptable.

**verdict**: acceptable.

---

## conclusion

detailed line-by-line review confirms:
- all function signatures follow (input, context) where applicable
- all error paths use fail-fast with helpful messages
- no else branches, all early returns
- inline types, no extracted interfaces
- no `as` casts
- no gerunds in comments
- given-when-then in all tests
- blackbox pattern in acceptance tests

**no violations found**.

