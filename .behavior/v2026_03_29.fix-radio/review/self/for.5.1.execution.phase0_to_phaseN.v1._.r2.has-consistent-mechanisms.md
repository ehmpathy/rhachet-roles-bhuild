# self-review: has-consistent-mechanisms

review for new mechanisms that duplicate extant functionality.

---

## search for extant mechanisms

searched the codebase for:
- `keyrack.get` — only found in our new getAuthFromKeyrack.ts
- `from 'rhachet/keyrack'` — found in jest env files (keyrack.source) and our new file
- `getAuth` — only found in our new files

**finding**: no extant keyrack wrapper utility exists in this codebase.

---

## new mechanisms reviewed

### getAuthFromKeyrack.ts

| question | answer |
|----------|--------|
| does codebase have a mechanism that does this? | no — first keyrack.get usage |
| do we duplicate extant utilities? | no |
| could we reuse an extant component? | no — none exists |

**analysis**: this is a new integration point with keyrack. the jest env files use `keyrack.source()` (sync, for env setup), while our new code uses `keyrack.get()` (async, for runtime auth). these are different keyrack APIs for different purposes.

**verdict**: no duplication

### getGithubTokenByAuthArg.ts changes

| question | answer |
|----------|--------|
| does this follow extant auth patterns? | yes — extends the extant auth resolution pattern |
| does the via-keyrack mode follow extant mode patterns? | yes — same regex match + handler pattern as shx/env modes |

**analysis**: the new via-keyrack mode follows the exact same pattern as extant modes:
1. regex match: `auth.match(/^as-robot:via-keyrack\((.+)\)$/)`
2. extract parameter: `owner = match[1]`
3. call appropriate handler: `getAuthFromKeyrack({ owner, ... })`
4. return result: `{ token, role: 'as-robot' }`

this is consistent with how as-robot:shx() and as-robot:env() work.

**verdict**: consistent with extant patterns

---

## conclusion

no duplication detected:
- getAuthFromKeyrack.ts is the first keyrack.get wrapper in this codebase
- the via-keyrack mode follows the same pattern as extant auth modes
- jest env uses keyrack.source() (different API, different purpose)

the implementation is consistent with extant mechanisms.
