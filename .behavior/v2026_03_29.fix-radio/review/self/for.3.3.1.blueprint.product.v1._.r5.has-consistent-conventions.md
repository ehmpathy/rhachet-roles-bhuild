# self-review: has-consistent-conventions

review for divergence from extant names and patterns.

---

## convention-by-convention review

### 1. function names

| blueprint proposes | extant pattern | analysis |
|-------------------|----------------|----------|
| `tryKeyrackUnlock` | `getGithubTokenByAuthArg`, `bootstrapRadioDir` | try + noun + verb is atypical but clear |
| `getDispatcherRoleKeyrack` | `getDispatcherRole`, `getBehaverRole` | follows get + noun pattern |

**verdict**: acceptable — names are clear and follow general get/try patterns

### 2. file names

| blueprint proposes | extant pattern | analysis |
|-------------------|----------------|----------|
| `getDispatcherRoleKeyrack.ts` | `getDispatcherRole.ts`, `getBehaverRole.ts` | follows pattern |
| `keyrack.yml` | `keyrack.yml` in mechanic role | follows extant pattern |

**verdict**: keep — matches extant conventions

### 3. key name prefix: EHMPATH vs EHMPATHY

| aspect | extant | blueprint proposes |
|--------|--------|-------------------|
| keyrack.yml org | `org: ehmpathy` | same |
| extant key name | `EHMPATHY_SEATURTLE_PROD_GITHUB_TOKEN` | - |
| proposed key name | - | `EHMPATH_BEAVER_GITHUB_TOKEN` |
| keyrack owner | `--owner ehmpath` | `--owner ehmpath` |

**issue identified**: prefix inconsistency

- extant key uses `EHMPATHY_` prefix (matches org name)
- blueprint uses `EHMPATH_` prefix (matches keyrack owner)
- wish explicitly says `EHMPATH_BEAVER_GITHUB_TOKEN`

**decision**: trust the wish. the wish explicitly prescribes `EHMPATH_BEAVER_GITHUB_TOKEN`. this may be intentional to match the keyrack owner (`ehmpath`) rather than the github org (`ehmpathy`).

**verdict**: keep as prescribed — wish is explicit about this name

### 4. role property names

| blueprint proposes | extant pattern | analysis |
|-------------------|----------------|----------|
| `keyrack` property on Role | mechanic role has keyrack.yml in same location | follows pattern |

**verdict**: keep — follows extant role pattern

### 5. auth resolution role values

| aspect | extant | blueprint |
|--------|--------|-----------|
| role values | `'as-robot' \| 'env' \| 'as-human'` | same |
| no new role types | - | confirmed (YAGNI review removed `'keyrack'`) |

**verdict**: keep — consistent with extant type

---

## summary

| convention | status |
|------------|--------|
| function names | aligned |
| file names | aligned |
| key prefix | diverges from extant but explicit in wish |
| role property | aligned |
| type values | aligned |

---

## conclusion

all name conventions are either:
1. aligned with extant patterns, or
2. explicitly prescribed by the wisher (EHMPATH_ prefix)

no unprescribed divergence found.

