# self-review: has-questioned-assumptions

review of technical assumptions in the fix-radio blueprint.

---

## assumptions surfaced

### assumption 1: keyrack api available from rhachet package

**what we assume**: `import { keyrack } from 'rhachet/keyrack'` works

**what if opposite true?**: keyrack could be a separate package, not bundled in rhachet

**evidence**: wish says "keyrack has been released via rhachet/keyrack" — implies subpath export

**risk**: moderate — api surface may differ from expectation

**mitigation**: verify keyrack export path before implementation

**verdict**: assumption is risky — needs verification. added to gaps.

### assumption 2: keyrack.source() is correct test pattern

**what we assume**: keyrack.source() in jest env exports tokens to process.env

**what if opposite true?**: keyrack.source() could be async, could require different args

**evidence**: xai repo PR #21 shows this pattern. research doc cites this.

**risk**: low — pattern verified in production use

**verdict**: assumption holds — pattern verified by xai repo.

### assumption 3: EPHEMERAL_VIA_GITHUB_APP mechanism works

**what we assume**: keyrack translates github app json to ephemeral ghs_* token

**what if opposite true?**: mechanism could require additional config or not be implemented

**evidence**: wish says "EPHEMERAL_VIA_GITHUB_APP mechanism fills this gap" — implies extant

**risk**: moderate — haven't verified mechanism implementation

**mitigation**: test with real keyrack before full integration

**verdict**: assumption is risky — needs verification before phase 1.

### assumption 4: tryKeyrackUnlock returns result vs throws

**what we assume**: function returns `{ success: false, reason }` on failure

**what if opposite true?**: keyrack.unlock() could throw on failure

**evidence**: no evidence — this is an api design assumption

**risk**: high — affects error path

**mitigation**: research keyrack.unlock() api before implementation

**verdict**: assumption is risky — needs api verification.

### assumption 5: auth resolution order is correct

**what we assume**: keyrack should be first, before explicit --auth

**what if opposite true?**: explicit --auth could override keyrack

**evidence**: wish says "skill's auth to default to keyrack --owner ehmpath first"

**risk**: low — wish is explicit

**verdict**: assumption holds — wish is explicit.

### assumption 6: role: 'keyrack' is correct return value

**what we assume**: new role value improves observability

**what if opposite true?**: could break callers that expect only 'as-robot' | 'env' | 'as-human'

**evidence**: type is internal, not exported contract

**risk**: moderate — may break extant type consumers

**mitigation**: check type usage before addition of new variant

**verdict**: assumption is risky — should verify type consumers.

---

## assumptions by risk

| assumption | risk | action |
|------------|------|--------|
| keyrack api export path | moderate | verify before impl |
| keyrack.source() pattern | low | validated |
| EPHEMERAL_VIA_GITHUB_APP | moderate | test before phase 1 |
| tryKeyrackUnlock error path | high | research keyrack api |
| auth resolution order | low | wish explicit |
| role: 'keyrack' type | moderate | check type consumers |

---

## simpler alternatives considered

| current | simpler? | decision |
|---------|----------|----------|
| tryKeyrackUnlock helper | inline in getGithubTokenByAuthArg | keep decomposed for testability |
| keyrack.unlock() with catch | let keyrack throw | research api first |
| new role: 'keyrack' | reuse 'as-robot' | keep for observability |

---

## issues found and fixed

the assumptions review surfaced risky assumptions that were not visible in the blueprint.

**fix applied**: updated blueprint to add:
1. "research tasks (pre-implementation)" section with verification steps
2. additional risks: keyrack.unlock() error behavior, EPHEMERAL_VIA_GITHUB_APP mechanism, role type consumers

this ensures the implementation phase won't proceed blindly on unverified assumptions.

---

## conclusion

3 assumptions need verification before implementation:
1. keyrack api export path
2. EPHEMERAL_VIA_GITHUB_APP mechanism
3. keyrack.unlock() error behavior

these are now tracked as research tasks in the blueprint — visible and actionable.

