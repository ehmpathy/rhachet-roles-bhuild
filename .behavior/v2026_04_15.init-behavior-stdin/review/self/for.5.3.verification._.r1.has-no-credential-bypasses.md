# self-review r1: has-no-credential-bypasses

## question

are there silent credential bypasses that skip tests without fail?

## review

### what is a credential bypass

patterns that silently skip test logic when credentials are absent:
- `if (!process.env.API_KEY) return`
- `if (!credentials) test.skip()`
- early return with no assertion

### scan results

scanned: `blackbox/role=behaver/*init.behavior*.acceptance.test.ts`

| pattern | found? |
|---------|--------|
| `if (!process.env` | no |
| `if (!credentials` | no |
| early return before assertions | no |
| conditional skip | no |

### why no credentials needed

init.behavior is a local operation:
- creates files in local git repos
- no external API calls
- no cloud services
- no authentication required

the test infrastructure uses:
- `genConsumerRepo()` — creates temp git repos
- `spawnSync` — runs bash processes
- `fs` — checks file existence

all local. no credentials to bypass.

## verdict

zero credential bypasses. init.behavior tests require no external credentials.
