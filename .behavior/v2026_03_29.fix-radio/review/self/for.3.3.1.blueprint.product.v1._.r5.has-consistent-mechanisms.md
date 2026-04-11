# self-review: has-consistent-mechanisms

review for new mechanisms that duplicate extant functionality.

---

## mechanism-by-mechanism review

### 1. tryKeyrackUnlock

| question | answer |
|----------|--------|
| does codebase have this already? | no — searched for `tryKeyrack`, `keyrack.unlock` patterns |
| duplicates extant utility? | no — keyrack integration is new |
| could reuse extant component? | no — this is the integration point |

**verdict**: keep — genuinely new mechanism for keyrack integration

### 2. getDispatcherRoleKeyrack.ts

| question | answer |
|----------|--------|
| does codebase have this already? | no — dispatcher role has no keyrack today |
| duplicates extant utility? | no |
| follows extant pattern? | yes — mechanic role in rhachet-roles-ehmpathy has keyrack.yml |

**verdict**: keep — follows extant role keyrack pattern

### 3. keyrack.yml format

| question | answer |
|----------|--------|
| blueprint format | nested: `env.prep.keys.KEY.mechanism: EPHEMERAL_VIA_GITHUB_APP` |
| extant format | flat list: `env.prep: [KEY1, KEY2]` |
| inconsistency? | potential — needs research |

**concern identified**: blueprint proposes mechanism-specific yaml structure, but extant keyrack.yml uses flat key lists.

**research needed**: verify keyrack package supports mechanism specification in yml format. this was flagged in prior research tasks (assumption #3: EPHEMERAL_VIA_GITHUB_APP mechanism).

**verdict**: flag for research — format consistency must be verified

### 4. keyrack.source() in jest env

| question | answer |
|----------|--------|
| does codebase have this already? | no — jest env files don't use keyrack today |
| duplicates extant utility? | no |
| follows extant pattern? | yes — pattern from rhachet-brains-xai PR #21 (cited in wish) |

**verdict**: keep — follows pattern from cited reference

### 5. auth resolution order

| question | answer |
|----------|--------|
| extant order | explicit --auth > GITHUB_TOKEN env var > error |
| proposed order | keyrack > explicit --auth > GITHUB_TOKEN > error |
| duplicates extant logic? | no — adds keyrack as first option |
| preserves extant paths? | yes — all extant paths retained |

**verdict**: keep — extends extant pattern without duplication

---

## issue found

the keyrack.yml format in the blueprint differs from extant keyrack.yml files.

| aspect | blueprint proposes | extant files use |
|--------|-------------------|------------------|
| structure | nested with mechanism | flat key list |
| example | `env.prep.keys.KEY.mechanism: X` | `env.prep: [KEY]` |

this was already flagged as a research task in the blueprint (assumption #3). the blueprint correctly identifies this as unverified.

---

## issue status: deferred to research

the format inconsistency is acknowledged in the blueprint's "research tasks (pre-implementation)" section. no fix required at blueprint stage — implementation will verify the correct format.

---

## conclusion

no duplicate mechanisms found. all new mechanisms either:
1. are genuinely new (tryKeyrackUnlock)
2. follow extant patterns (role keyrack property, keyrack.source())
3. extend extant logic without duplication (auth resolution order)

one format inconsistency deferred to research phase as already documented.

