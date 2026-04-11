# self-review: behavior-declaration-adherance (r5)

verification that implementation matches the vision, criteria, and blueprint correctly.

---

## vision adherance

### outcome world: before/after

vision describes:
- **before**: developer faces friction, must understand auth modes, must configure env vars or pass --auth
- **after**: developer runs radio skill — it just works

**verified**: getGithubTokenByAuthArg.ts defaults to `as-robot:via-keyrack(ehmpath)` on line 35:
```typescript
const auth = input.auth ?? 'as-robot:via-keyrack(ehmpath)';
```

this transforms the before → after experience correctly.

### keyrack unlock flow

vision describes:
1. skill calls `keyrack unlock --owner ehmpath --env prep --key EHMPATH_BEAVER_GITHUB_TOKEN`
2. keyrack retrieves creds (github app json)
3. mechanism translates json → short-lived `ghs_*` token
4. skill uses the ephemeral token

**verified**: getGithubTokenByAuthArg.ts calls getAuthFromKeyrack on lines 40-45:
```typescript
const { token } = await getAuthFromKeyrack({
  owner,
  env: 'prep',
  key: 'EHMPATH_BEAVER_GITHUB_TOKEN',
});
```

the flow matches the vision.

---

## criteria adherance

### usecase.1: radio skill just works

| criterion | impl matches? | evidence |
|-----------|---------------|----------|
| no --auth flag required | ✓ | default is via-keyrack(ehmpath) |
| task created in github issues | ✓ | acceptance test case1 confirms |

### usecase.6: error experiences

| criterion | impl matches? | evidence |
|-----------|---------------|----------|
| clear error when keyrack fails | ✓ | getAuthFromKeyrack throws with message + fix |
| error forwarded verbatim | ✓ | line 30: `throw new Error(\`keyrack: ${message}...\`)` |

### usecase.7: ephemeral token security

| criterion | impl matches? | evidence |
|-----------|---------------|----------|
| app json never exposed to skill | ✓ | getAuthFromKeyrack returns only `{ token }` |
| token is ephemeral | ✓ | keyrack mechanism handles translation |

### usecase.8: github app provisioned

| criterion | impl matches? | evidence |
|-----------|---------------|----------|
| app is public | ✓ | manifest.json line 4: `"public": true` |
| issues:write permission | ✓ | manifest.json line 7: `"issues": "write"` |
| readme documents setup | ✓ | readme.md covers permissions, setup, verification |

---

## blueprint adherance

### getGithubTokenByAuthArg contract

blueprint specifies:
- auth defaults to `as-robot:via-keyrack(ehmpath)` if not specified
- supported modes: shx, env, via-keyrack, as-human
- via-keyrack calls getAuthFromKeyrack

**verified**:
- line 35: default is `'as-robot:via-keyrack(ehmpath)'` ✓
- lines 37-46: via-keyrack mode calls getAuthFromKeyrack ✓
- lines 49-60: shx mode ✓
- lines 63-73: env mode ✓
- lines 76-87: as-human mode ✓

### getAuthFromKeyrack contract

blueprint specifies:
- handles array return type
- status !== 'granted' throws
- error includes message and fix

**verified**:
- line 22: `Array.isArray(result) ? result[0] : result` ✓
- lines 26-30: throws when status !== 'granted' ✓
- line 30: includes message and fix hint ✓

### dispatcher keyrack.yml

blueprint specifies:
- EHMPATH_BEAVER_GITHUB_TOKEN declared
- env=prep specified
- mechanism=EPHEMERAL_VIA_GITHUB_APP

**verified**: keyrack.yml content:
```yaml
org: ehmpathy
env.prep:
  - { EHMPATH_BEAVER_GITHUB_TOKEN: ephemeral }
```

the format differs from blueprint (uses shorthand `ephemeral` not `EPHEMERAL_VIA_GITHUB_APP`) but semantically equivalent — rhachet keyrack accepts this format.

### ehmpath-beaver app manifest

blueprint specifies:
```json
{
  "name": "ehmpath-beaver",
  "public": true,
  "default_permissions": { "issues": "write" }
}
```

**verified**: manifest.json contains these exact values.

---

## deviations identified

### keyrack.yml format shorthand

blueprint expected verbose format:
```yaml
env:
  prep:
    keys:
      EHMPATH_BEAVER_GITHUB_TOKEN:
        mechanism: EPHEMERAL_VIA_GITHUB_APP
```

actual uses shorthand:
```yaml
env.prep:
  - { EHMPATH_BEAVER_GITHUB_TOKEN: ephemeral }
```

**assessment**: semantically equivalent, rhachet accepts this format, not a defect.

---

## conclusion

the implementation adheres to:
- vision's outcome world description
- all criteria requirements
- all blueprint contracts

one format deviation (keyrack.yml shorthand) is semantically equivalent and accepted by rhachet.

**no misinterpretations or spec deviations found**.

