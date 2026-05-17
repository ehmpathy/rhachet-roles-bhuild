# self-review: has-consistent-mechanisms (r3)

deeper reflection on mechanism consistency.

---

## issue found and fixed

searched for `role.*as-robot` and found RadioContext.ts still had:

```typescript
| { token: string; role: 'as-robot' | 'env' }
```

but getGithubTokenByAuthArg now returns only:

```typescript
| { token: string; role: 'as-robot' }
```

the 'env' role was tied to the GITHUB_TOKEN fallback we removed.

**fix**: updated RadioContext.ts to remove `| 'env'`. verified via `npm run test:types` — passes.

---

## why getAuthFromKeyrack is necessary

the question arose: could we just inline the keyrack.get call in getGithubTokenByAuthArg?

**analysis**:

option A: inline keyrack.get
```typescript
if (keyrackMatch) {
  const result = await keyrack.get({ for: { key: ... }, env: ..., owner: ... });
  const attempt = Array.isArray(result) ? result[0] : result;
  if (attempt.status !== 'granted') throw new Error(...);
  return { token: attempt.grant.key.secret, role: 'as-robot' };
}
```

option B: extract to getAuthFromKeyrack
```typescript
if (keyrackMatch) {
  const { token } = await getAuthFromKeyrack({ owner, env: 'prep', key: ... });
  return { token, role: 'as-robot' };
}
```

**why option B is correct**:
1. keyrack error logic is complex (status discrimination, message extraction, fix hints)
2. error logic would clutter getGithubTokenByAuthArg
3. separation of concerns: auth resolution vs keyrack integration
4. testability: can mock getAuthFromKeyrack in unit tests

**verdict**: extraction is justified, not premature

---

## why the auth modes follow the same pattern

each auth mode in getGithubTokenByAuthArg follows identical structure:

```typescript
// pattern: match → extract → call handler → return
const match = auth.match(/^as-robot:(mode)\((.+)\)$/);
if (match) {
  const param = match[1];
  const result = await handler(param);
  return { token: result, role: 'as-robot' };
}
```

this pattern is used for:
- as-robot:shx(command) → context.shx(command)
- as-robot:env(VAR) → context.env[VAR]
- as-robot:via-keyrack(owner) → getAuthFromKeyrack({ owner, ... })

**verdict**: via-keyrack follows extant pattern exactly

---

## conclusion

the mechanisms are consistent:
- getAuthFromKeyrack encapsulates keyrack complexity appropriately
- via-keyrack mode follows the extant auth mode pattern
- no duplication of extant utilities

the implementation maintains consistency while new capability is delivered.

---

## additional verification

verified no extant utilities were bypassed:
- searched `keyrack` in src/ — only found our new integration
- searched `getAuth` in src/ — only found our new files
- searched `github.*token` in src/ — found only getGithubTokenByAuthArg

no duplication detected.
