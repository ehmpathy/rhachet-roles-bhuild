# self-review: has-consistent-mechanisms (r4)

fourth reflection — found and fixed an inconsistency.

---

## issue found

searched for `role.*as-robot` and found RadioContext.ts still had:

```typescript
| { token: string; role: 'as-robot' | 'env' }
```

but getGithubTokenByAuthArg now returns only:

```typescript
| { token: string; role: 'as-robot' }
```

the 'env' role was tied to the GITHUB_TOKEN fallback we removed. the type in RadioContext.ts was stale.

---

## fix applied

updated RadioContext.ts:

```diff
- | { token: string; role: 'as-robot' | 'env' }
+ | { token: string; role: 'as-robot' }
```

verified via `npm run test:types` — passes.

---

## why this was missed

the initial search focused on keyrack-related code. this broader search for `role.*as-robot` revealed the downstream type that needed update.

**lesson**: when a function's return type changes, search for all usages of that type to ensure consistency.

---

## conclusion

the review found a real issue:
- stale type in RadioContext.ts that references the removed 'env' role
- fixed via type update to match the new implementation

the mechanisms are now consistent across the codebase.
