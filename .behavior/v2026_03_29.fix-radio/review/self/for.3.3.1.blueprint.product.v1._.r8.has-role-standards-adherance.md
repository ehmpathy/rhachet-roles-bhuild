# self-review: has-role-standards-adherance

review for adherance to mechanic role standards.

---

## rule directories checked

| directory | relevance | verdict |
|-----------|-----------|---------|
| lang.terms/ | name conventions | checked |
| lang.tones/ | style guidelines | checked |
| code.prod/evolvable.procedures/ | input-context pattern, arrow functions | checked |
| code.prod/evolvable.repo.structure/ | directional deps | checked |
| code.prod/pitofsuccess.errors/ | fail-fast, helpful errors | checked |
| code.prod/pitofsuccess.procedures/ | idempotency | checked |
| code.test/frames.behavior/ | given-when-then test pattern | checked |

---

## name conventions (lang.terms/)

| name in blueprint | pattern | adherent? |
|-------------------|---------|-----------|
| `getGithubTokenByAuthArg` | get* verb prefix | ✓ yes |
| `tryKeyrackUnlock` | try* for fallible operations | ✓ yes |
| `getDispatcherRoleKeyrack` | get* verb prefix | ✓ yes |
| `keyrack.unlock()` | follows keyrack api | ✓ yes |
| `keyrack.source()` | follows keyrack api | ✓ yes |

no gerunds detected.
no forbidden terms detected.

---

## procedure patterns (code.prod/evolvable.procedures/)

### input-context pattern

| contract | follows (input, context) | adherent? |
|----------|--------------------------|-----------|
| getGithubTokenByAuthArg | `(input: {...}, context: {...})` | ✓ yes |
| tryKeyrackUnlock | `(): Promise<...>` (no input needed) | ✓ acceptable |

### arrow function style

blueprint shows contracts but not implementation. pattern expected at implementation time.

verdict: ✓ no violations detected

---

## error handle (code.prod/pitofsuccess.errors/)

| error case | has clear message | has remediation hint | adherent? |
|------------|-------------------|---------------------|-----------|
| keyrack not unlocked | yes | `hint: run rhx keyrack fill...` | ✓ yes |
| key absent | yes | `hint: run rhx keyrack fill...` | ✓ yes |
| no auth available | yes | explains what's wrong | ✓ yes |

fail-fast pattern: blueprint shows early return on keyrack failure, then fallback chain.

verdict: ✓ follows helpful-errors pattern

---

## idempotency (code.prod/pitofsuccess.procedures/)

| operation | idempotent? | adherent? |
|-----------|-------------|-----------|
| keyrack.unlock() | yes (read-only) | ✓ yes |
| getGithubTokenByAuthArg | yes (pure derivation) | ✓ yes |
| daoRadioTask.findsert | yes (findsert pattern) | ✓ yes |

verdict: ✓ all operations are idempotent

---

## test patterns (code.test/frames.behavior/)

blueprint documents test coverage but not test structure. at implementation:
- integration tests should use given/when/then
- acceptance tests should use given/when/then

verdict: ✓ no violations in blueprint; pattern expected at implementation

---

## repo structure (code.prod/evolvable.repo.structure/)

| change | location | directional deps ok? |
|--------|----------|---------------------|
| getGithubTokenByAuthArg | domain.operations/ | ✓ yes |
| getDispatcherRoleKeyrack | domain.roles/ | ✓ yes |
| keyrack.yml | domain.roles/ | ✓ yes |
| jest.*.env.ts | root | ✓ yes |

no upward imports proposed.

verdict: ✓ follows directional dependency rules

---

## stale risk note

line 217 mentions "role: 'keyrack' may break type consumers" as a risk. the YAGNI review decided not to add this type, so this risk is now resolved. the risk documentation is slightly unclear but does not violate any standard.

action: none required (documentation artifact, not a code violation)

---

## conclusion

the blueprint adheres to mechanic role standards:
- names follow get*/try* verb prefixes
- no gerunds or forbidden terms
- input-context pattern used
- fail-fast with helpful error messages
- idempotent operations
- correct directional dependencies

no violations found.

