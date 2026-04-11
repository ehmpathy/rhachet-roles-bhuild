# self-review: has-pruned-yagni

review for extras that were not prescribed in vision or criteria.

YAGNI = "you ain't gonna need it"

---

## component-by-component review

### 1. keyrack.yml (dispatcher role)

| question | answer |
|----------|--------|
| explicitly requested? | yes — wish line "src/domain.roles/dispatcher/keyrack.yml" |
| minimum viable? | yes — single file with one key declaration |
| added for future flexibility? | no |
| added while we're here? | no |
| premature optimization? | no |

**verdict**: keep — explicitly prescribed

### 2. keyrack.yml (test env)

| question | answer |
|----------|--------|
| explicitly requested? | yes — wish line ".agent/keyrack.yml#env.test" |
| minimum viable? | yes — single file with one key declaration |
| added for future flexibility? | no |
| added while we're here? | no |
| premature optimization? | no |

**verdict**: keep — explicitly prescribed

### 3. getGithubTokenByAuthArg update

| question | answer |
|----------|--------|
| explicitly requested? | yes — wish line "update radio skill to fetch creds from keyrack" |
| minimum viable? | yes — adds keyrack to auth resolution |
| added for future flexibility? | no |
| added while we're here? | no |
| premature optimization? | no |

**verdict**: keep — explicitly prescribed

### 4. tryKeyrackUnlock helper

| question | answer |
|----------|--------|
| explicitly requested? | implied by auth update |
| minimum viable? | could inline, but decomposition improves testability |
| added for future flexibility? | no — testability is immediate need |
| added while we're here? | no |
| premature optimization? | no |

**verdict**: keep — reasonable decomposition for testability

### 5. getDispatcherRoleKeyrack

| question | answer |
|----------|--------|
| explicitly requested? | yes — wish line "ensure keyrack is registered on genDispatcherRole" |
| minimum viable? | follows extant role pattern |
| added for future flexibility? | no |
| added while we're here? | no |
| premature optimization? | no |

**verdict**: keep — explicitly prescribed, follows pattern

### 6. jest env keyrack.source()

| question | answer |
|----------|--------|
| explicitly requested? | yes — wish line "upgrade tests to fetch creds via keyrack" |
| minimum viable? | yes — single function call |
| added for future flexibility? | no |
| added while we're here? | no |
| premature optimization? | no |

**verdict**: keep — explicitly prescribed

### 7. role: 'keyrack' return type

| question | answer |
|----------|--------|
| explicitly requested? | no — this was a design choice |
| minimum viable? | could reuse 'as-robot' |
| added for future flexibility? | partially — observability benefit |
| added while we're here? | yes |
| premature optimization? | possibly |

**verdict**: flag for wisher — this is a design choice not prescribed. could simplify by reuse of 'as-robot'.

---

## flagged for wisher

| component | reason | options |
|-----------|--------|---------|
| role: 'keyrack' | not prescribed, added for observability | A: keep for observability, B: reuse 'as-robot' |

---

## conclusion

all components trace to explicit wish requirements except `role: 'keyrack'`.

the `role: 'keyrack'` return type is a YAGNI candidate — it adds observability but wasn't requested. recommend flag for wisher decision.

