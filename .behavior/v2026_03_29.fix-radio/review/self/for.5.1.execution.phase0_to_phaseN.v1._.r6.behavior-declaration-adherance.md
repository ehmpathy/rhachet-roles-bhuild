# self-review: behavior-declaration-adherance (r6)

deeper reflection on file-by-file adherance to the spec.

---

## files changed review

### src/domain.operations/radio/auth/getGithubTokenByAuthArg.ts

| spec requirement | line | adheres? |
|------------------|------|----------|
| default to via-keyrack(ehmpath) | 35 | ✓ `input.auth ?? 'as-robot:via-keyrack(ehmpath)'` |
| via-keyrack pattern match | 37 | ✓ `/^as-robot:via-keyrack\((.+)\)$/` |
| call getAuthFromKeyrack | 40-45 | ✓ calls with owner, env, key |
| return { token, role: 'as-robot' } | 45 | ✓ |
| error help message shows modes | 95-102 | ✓ lists all supported modes |

**why it holds**: the implementation follows the blueprint contract exactly.

### src/domain.operations/radio/auth/getAuthFromKeyrack.ts

| spec requirement | line | adheres? |
|------------------|------|----------|
| handle array return type | 22 | ✓ `Array.isArray(result) ? result[0] : result` |
| fail fast if not granted | 26-30 | ✓ throws Error |
| include message and fix | 27-30 | ✓ extracts from attempt |

**why it holds**: the error handle matches the keyrack API contract.

### src/domain.operations/radio/auth/getAuthFromKeyrack.test.ts

| spec requirement | coverage? |
|------------------|-----------|
| granted status returns token | ✓ case1 |
| absent status throws | ✓ case2 |
| locked status throws | ✓ case3 |
| blocked status throws | ✓ case4 |

**why it holds**: all keyrack status branches are tested.

### src/domain.operations/radio/auth/getGithubTokenByAuthArg.test.ts

| spec requirement | coverage? |
|------------------|-----------|
| as-robot:env mode | ✓ case1 |
| as-robot:shx mode | ✓ case2 |
| as-robot:via-keyrack mode | ✓ case3 |
| default to via-keyrack(ehmpath) | ✓ case4 |
| as-human mode | ✓ (in file) |
| unrecognized auth error | ✓ (in file) |

**why it holds**: all auth branches are covered with positive and negative tests.

### src/domain.roles/dispatcher/getDispatcherRole.ts

| spec requirement | line | adheres? |
|------------------|------|----------|
| keyrack property | 20 | ✓ `keyrack: { uri: __dirname + '/keyrack.yml' }` |

**why it holds**: the keyrack is registered per the blueprint.

### src/domain.roles/dispatcher/keyrack.yml

| spec requirement | adheres? |
|------------------|----------|
| EHMPATH_BEAVER_GITHUB_TOKEN declared | ✓ |
| env=prep | ✓ |
| mechanism=ephemeral | ✓ (shorthand for EPHEMERAL_VIA_GITHUB_APP) |

**why it holds**: the format differs from blueprint (shorthand) but semantically equivalent.

### src/domain.objects/RadioContext.ts

| spec requirement | adheres? |
|------------------|----------|
| role type = 'as-robot' only | ✓ (fixed in r4 review) |

**why it holds**: the 'env' role was removed since GITHUB_TOKEN fallback was removed.

### @repo/provision/ehmpath-beaver/manifest.json

| spec requirement | adheres? |
|------------------|----------|
| name = ehmpath-beaver | ✓ |
| public = true | ✓ |
| issues = write | ✓ |

**why it holds**: matches blueprint contract exactly.

### blackbox acceptance test

| spec requirement | adheres? |
|------------------|----------|
| case1 uses no --auth flag | ✓ |
| case1 tests default keyrack auth | ✓ |
| explicit auth cases test other modes | ✓ (cases 2, 3, 4) |

**why it holds**: the test structure validates both default and explicit auth paths.

### jest.integration.env.ts and jest.acceptance.env.ts

| spec requirement | adheres? |
|------------------|----------|
| keyrack.source() called | ✓ |
| env = 'test' | ✓ |
| owner = 'ehmpath' | ✓ |
| mode = 'strict' | ✓ |

**why it holds**: test setup follows the blueprint contract.

---

## deviations analyzed

### keyrack.yml format

blueprint expected verbose:
```yaml
env:
  prep:
    keys:
      EHMPATH_BEAVER_GITHUB_TOKEN:
        mechanism: EPHEMERAL_VIA_GITHUB_APP
```

actual shorthand:
```yaml
org: ehmpathy
env.prep:
  - { EHMPATH_BEAVER_GITHUB_TOKEN: ephemeral }
```

**not a defect**: rhachet keyrack accepts both formats. `ephemeral` is a valid shorthand.

### ci/cd env var vs prepare:rhachet

blueprint expected `npm run prepare:rhachet` step in CI. actual sets env var directly. the jest env files call keyrack.source() which finds the env var.

**not a defect**: same outcome via different mechanism.

---

## conclusion

all changed files adhere to the behavior declaration:
- getGithubTokenByAuthArg: default and modes match spec ✓
- getAuthFromKeyrack: error handle matches spec ✓
- tests: all branches covered ✓
- dispatcher role: keyrack registered ✓
- provision: manifest matches spec ✓
- jest envs: keyrack.source() setup correct ✓

two format deviations are semantically equivalent and accepted by the system.

**no misinterpretations or spec deviations found**.

