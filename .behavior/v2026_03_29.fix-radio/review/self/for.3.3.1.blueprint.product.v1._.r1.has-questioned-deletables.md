# self-review: has-questioned-deletables

review of deletables in the fix-radio blueprint.

---

## feature traceability

| feature | traces to | wisher explicit? | verdict |
|---------|-----------|------------------|---------|
| keyrack.yml (dispatcher role) | wish line "register EHMPATH_BEAVER_GITHUB_TOKEN into keyrack" | yes | keep |
| keyrack.yml (test env) | wish line ".agent/keyrack.yml#env.test" | yes | keep |
| getGithubTokenByAuthArg update | wish line "update radio skill to fetch creds from keyrack" | yes | keep |
| getDispatcherRole keyrack prop | wish line "ensure keyrack is registered on genDispatcherRole" | yes | keep |
| jest env keyrack.source() | wish line "upgrade tests to fetch creds via keyrack" | yes | keep |
| acceptance test updates | wish line "unskip tests" (implied) | implied | keep |

**result**: all features trace to explicit wish requirements. no untraceable features found.

---

## component deletability

| component | can delete? | if deleted, add back? | verdict |
|-----------|-------------|----------------------|---------|
| tryKeyrackUnlock helper | no - core logic | yes | keep |
| getDispatcherRoleKeyrack | yes - could inline | no - follows pattern | keep |
| error message constants | yes - could inline | yes - reuse | keep |

### simplest version analysis

**tryKeyrackUnlock**: could be inlined into getGithubTokenByAuthArg, but decomposition improves testability. keep as separate function.

**getDispatcherRoleKeyrack**: follows extant pattern of `getDispatcherRoleBriefs`, `getDispatcherRoleSkills`. consistent decomposition. keep.

**error messages**: could hardcode, but extractable constants improve maintainability. keep.

---

## questioned and deleted

| candidate | reason considered | decision |
|-----------|-------------------|----------|
| role: 'keyrack' in return type | could reuse 'as-robot' | keep - explicit source clarity |
| separate keyrack.yml per role | could use single file | keep - role isolation per wish |

**role: 'keyrack' vs 'as-robot'**: considered whether to reuse 'as-robot' for keyrack tokens. decision: keep 'keyrack' role for observability. caller knows auth source.

**single vs per-role keyrack.yml**: wish explicitly asks for dispatcher role keyrack.yml and test env keyrack.yml. keep separate per wish.

---

## conclusion

all blueprint features trace to wish requirements.

no deletable components found — each serves minimum necessary function.

