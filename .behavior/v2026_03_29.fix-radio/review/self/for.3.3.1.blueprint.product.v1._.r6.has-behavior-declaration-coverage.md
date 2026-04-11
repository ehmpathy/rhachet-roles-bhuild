# self-review: has-behavior-declaration-coverage

review for coverage of the behavior declaration.

---

## criteria coverage checklist

### usecase.1 = radio skill just works

| criterion | blueprint coverage | status |
|-----------|-------------------|--------|
| keyrack first for auth | auth resolution order: keyrack > explicit > env | ✓ covered |
| no --auth flag required | keyrack tries first automatically | ✓ covered |
| output shows exid, status, repo | not changed by this PR (extant behavior) | ✓ n/a |

### usecase.2 = machine-wide credential setup

| criterion | blueprint coverage | status |
|-----------|-------------------|--------|
| rhx keyrack fill works | keyrack feature, not PR scope | ✓ n/a |
| credentials stored machine-wide | keyrack feature, not PR scope | ✓ n/a |

### usecase.3 = per-repo key initialization

| criterion | blueprint coverage | status |
|-----------|-------------------|--------|
| npx rhachet init --keys | dispatcher role gets keyrack property | ✓ covered |
| keyrack.yml linked for repo | dispatcher/keyrack.yml created | ✓ covered |

### usecase.4 = test credential flow

| criterion | blueprint coverage | status |
|-----------|-------------------|--------|
| test env keyrack.yml | .agent/keyrack.yml created | ✓ covered |
| keyrack.source() in jest env | jest.integration.env.ts, jest.acceptance.env.ts | ✓ covered |
| tests use ephemeral token | keyrack.source() unlocks test env | ✓ covered |

### usecase.5 = ci/cd env var fallback

| criterion | blueprint coverage | status |
|-----------|-------------------|--------|
| GITHUB_TOKEN fallback | auth resolution order: ... > GITHUB_TOKEN | ✓ covered |
| behavior identical | fallback returns { token, role: 'env' } | ✓ covered |

### usecase.6 = error experiences

| criterion | blueprint coverage | status |
|-----------|-------------------|--------|
| keyrack not unlocked error | error messages table | ✓ covered |
| key not found error | error messages table | ✓ covered |
| auto-refresh on expiry | keyrack feature, not PR scope | ✓ n/a |

### usecase.7 = ephemeral token security

| criterion | blueprint coverage | status |
|-----------|-------------------|--------|
| ghs_* token format | EPHEMERAL_VIA_GITHUB_APP mechanism | ✓ covered |
| ~1 hour expiry | keyrack mechanism feature | ✓ n/a |
| app json not exposed | keyrack returns only token | ✓ n/a |

---

## vision requirements checklist

| vision requirement | blueprint coverage | status |
|--------------------|-------------------|--------|
| skill calls keyrack unlock for specific key | tryKeyrackUnlock helper | ✓ covered |
| mechanism translates json to ghs_* | EPHEMERAL_VIA_GITHUB_APP in keyrack.yml | ✓ covered |
| zero manual config needed | keyrack first in auth order | ✓ covered |
| same path for tests/dev/ci | keyrack.source() + env fallback | ✓ covered |

---

## gaps identified

none. all criteria and vision requirements are addressed by the blueprint.

note: criteria items marked "n/a" are keyrack features, not in scope for this PR. the blueprint correctly relies on keyrack for those behaviors.

---

## conclusion

the blueprint has complete coverage of the behavior declaration:
- all 7 usecases from criteria are addressed
- all vision requirements are addressed
- scope correctly defers keyrack features to keyrack

no requirements found to be absent.

