# self-review: has-pruned-yagni

review for extras that were not prescribed in vision or criteria.

---

## issue found

the YAGNI review identified `role: 'keyrack'` as not prescribed in the wish.

| component | was it requested? | analysis |
|-----------|-------------------|----------|
| role: 'keyrack' return type | no | added for observability but not asked for |

the wish says "fetch creds from keyrack" — it doesn't prescribe a new role value.

---

## issue fixed

removed `role: 'keyrack'` from the return type.

**before**:
```typescript
Promise<
  | { token: string; role: 'as-robot' | 'keyrack' | 'env' }
  | { token: null; role: 'as-human' }
>
```

**after**:
```typescript
Promise<
  | { token: string; role: 'as-robot' | 'env' }
  | { token: null; role: 'as-human' }
>
```

keyrack-derived tokens will use `role: 'as-robot'` — consistent with the extant pattern.

---

## all other components verified

| component | requested? | minimum? | verdict |
|-----------|------------|----------|---------|
| keyrack.yml (dispatcher) | yes | yes | keep |
| keyrack.yml (test env) | yes | yes | keep |
| getGithubTokenByAuthArg | yes | yes | keep |
| tryKeyrackUnlock | implied | yes | keep |
| getDispatcherRoleKeyrack | yes | yes | keep |
| jest env keyrack.source() | yes | yes | keep |

---

## conclusion

found and fixed one YAGNI issue: `role: 'keyrack'` was not prescribed.

all other components are minimum viable implementations of prescribed requirements.

