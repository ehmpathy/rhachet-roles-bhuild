# self-review: behavior-declaration-coverage (r4)

verification that all blueprint declarations are implemented.

---

## blueprint filediff tree coverage

| file | blueprint | status | notes |
|------|-----------|--------|-------|
| @repo/provision/ehmpath-beaver/readme.md | [+] create | ✓ | extant |
| @repo/provision/ehmpath-beaver/manifest.json | [+] create | ✓ | extant |
| src/domain.operations/radio/auth/getGithubTokenByAuthArg.ts | [~] update | ✓ | via-keyrack mode added, default changed |
| src/domain.operations/radio/auth/getAuthFromKeyrack.ts | [+] create | ✓ | extant |
| src/domain.operations/radio/auth/getAuthFromKeyrack.test.ts | [+] create | ✓ | extant |
| src/domain.roles/dispatcher/keyrack.yml | [+] create | ✓ | extant |
| src/domain.roles/dispatcher/getDispatcherRole.ts | [~] update | ✓ | has keyrack property |
| src/domain.roles/dispatcher/getDispatcherRoleKeyrack.ts | [+] create | n/a | not needed — keyrack registered directly |
| .agent/keyrack.yml | [+] create | ✓ | extant |
| .github/workflows/.test.yml | [~] update | ✓ | EHMPATH_BEAVER_GITHUB_TOKEN env set |
| blackbox/skill.radio.task.push.via-gh-issues.acceptance.test.ts | [~] update | ✓ | default auth case added |
| blackbox/.test/infra/constants.ts | [~] update | ✓ | token deprecated |
| package.json | [~] update | n/a | prepare:rhachet already extant |
| jest.integration.env.ts | [~] update | ✓ | keyrack.source() call extant |
| jest.acceptance.env.ts | [~] update | ✓ | keyrack.source() call extant |

---

## blueprint codepath tree coverage

| codepath | blueprint | status |
|----------|-----------|--------|
| --auth default: 'as-robot:via-keyrack(ehmpath)' | NEW default | ✓ implemented |
| as-robot:via-keyrack(owner) mode | NEW keyrack mode | ✓ implemented |
| getAuthFromKeyrack fail-fast | error forward | ✓ implemented |
| keyrack: { uri: __dirname + '/keyrack.yml' } | NEW property | ✓ in getDispatcherRole.ts |
| keyrack.source() in test setup | test env setup | ✓ in both jest env files |

---

## blueprint contracts coverage

### getGithubTokenByAuthArg

| contract item | status |
|---------------|--------|
| auth defaults to via-keyrack(ehmpath) | ✓ |
| supported modes include via-keyrack | ✓ |
| via-keyrack calls getAuthFromKeyrack | ✓ |
| any error fails fast | ✓ |

### getAuthFromKeyrack

| contract item | status |
|---------------|--------|
| handles array return type | ✓ |
| status !== 'granted' throws | ✓ |
| error includes message and fix | ✓ |

### dispatcher keyrack.yml

| contract item | status |
|---------------|--------|
| EHMPATH_BEAVER_GITHUB_TOKEN declared | ✓ |
| env=prep specified | ✓ |
| mechanism=EPHEMERAL_VIA_GITHUB_APP | ✓ |

### test env keyrack.yml

| contract item | status |
|---------------|--------|
| EHMPATH_BEAVER_GITHUB_TOKEN declared | ✓ |
| env=test specified | ✓ |
| mechanism=EPHEMERAL_VIA_GITHUB_APP | ✓ |

---

## blueprint test coverage

| test type | coverage item | status |
|-----------|---------------|--------|
| unit | getAuthFromKeyrack success | ✓ |
| unit | getAuthFromKeyrack fails | ✓ |
| unit | auth resolution: default | ✓ |
| unit | auth resolution: explicit | ✓ |
| integration | getGithubTokenByAuthArg + via-keyrack | ✓ |
| integration | error output forward | ✓ |
| acceptance | radio.task.push (default auth) | ✓ case1 |
| acceptance | radio.task.push (explicit auth) | ✓ case2, case3, case4 |

---

## deviations from blueprint

### getDispatcherRoleKeyrack.ts not created

blueprint suggested a separate `getDispatcherRoleKeyrack.ts` file, but the keyrack is registered directly in `getDispatcherRole.ts` via:

```typescript
keyrack: { uri: __dirname + '/keyrack.yml' },
```

this is a simpler approach that achieves the same outcome without an extra file.

**verdict**: deviation acceptable — simpler implementation

### prepare:rhachet not changed

blueprint suggested add `prepare:rhachet` to package.json, but it already extant:

```json
"prepare:rhachet": "npm run build && rhachet init --hooks --roles behaver driver mechanic reviewer librarian"
```

**verdict**: no change needed — requirement already satisfied

---

## conclusion

all blueprint declarations are covered:
- all required files created or updated
- all codepaths implemented
- all contracts satisfied
- all tests present

two acceptable deviations:
- keyrack registration simplified (no separate file)
- prepare:rhachet already extant (no change needed)

no absent coverage detected.

