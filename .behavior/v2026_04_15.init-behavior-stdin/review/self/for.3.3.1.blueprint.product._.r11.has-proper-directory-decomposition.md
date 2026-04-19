# self-review r11: has-proper-directory-decomposition

## why r11?

r10 answered the three checks but lacked deeper articulation. this r11 provides explicit grep results as evidence and additional "why it holds" details.

---

## the three checks

1. is each file placed in the correct layer?
2. are subdomains properly namespaced via subdirectories?
3. does the structure match extant codebase patterns?

---

## blueprint files

from filediff tree (lines 39-52):

| file | action | layer |
|------|--------|-------|
| `src/contract/cli/init.behavior.ts` | [~] update | contract |
| `blackbox/role=behaver/skill.init.behavior.wish.acceptance.test.ts` | [+] create | test |
| `blackbox/role=behaver/.test/skill.init.behavior.utils.ts` | [~] update | test utility |

---

## check 1: layer placement

### Q: is `init.behavior.ts` in the correct layer?

**location**: `src/contract/cli/`

**answer**: yes — CLI entry points belong in `contract/cli/`

**evidence**: grep shows extant CLI files:
```
$ ls src/contract/cli/
bind.behavior.ts
catch.dream.ts
decompose.behavior.ts
feedback.give.ts
feedback.take.get.ts
feedback.take.set.ts
init.behavior.ts         # <- extant, blueprint updates this
radioTaskPull.ts
radioTaskPush.ts
review.behavior.ts
```

**why it holds**: init.behavior.ts is already in contract/cli/ and blueprint updates it in place.

### Q: are test files in the correct layer?

**location**: `blackbox/role=behaver/`

**answer**: yes — acceptance tests belong in blackbox/

**evidence**: extant structure:
```
$ ls blackbox/role=behaver/
skill.init.behavior.acceptance.test.ts
skill.init.behavior.bind.acceptance.test.ts
```

**why it holds**: blueprint adds `skill.init.behavior.wish.acceptance.test.ts` to same directory as extant tests.

### Q: are test utilities in the correct layer?

**location**: `blackbox/role=behaver/.test/`

**answer**: yes — test utilities belong in `.test/` subdirectory

**evidence**: extant structure:
```
$ ls blackbox/role=behaver/.test/
skill.init.behavior.utils.ts     # <- extant, blueprint extends this
```

**why it holds**: blueprint extends extant utility file in `.test/` subdirectory.

---

## check 2: inline transformers — correct layer?

### Q: should transformers be in domain.operations instead of contract?

**blueprint proposes**: inline transformers in `init.behavior.ts`:
- `getWishContent` (5 lines)
- `validateWishContent` (4 lines)
- `validateWishFileState` (6 lines)

**layer rule**: transformers belong in `domain.operations/`

**but**: per rule.prefer.wet-over-dry, wait for 3+ usages before extraction

**analysis**:
- each transformer is used exactly once
- each is 4-6 lines of code
- extraction to domain.operations/ would create 3 new files for 15 total lines
- overhead of file creation > value of separation

**verdict**: inline is appropriate. transformers are small, single-use, and contract-specific.

**why it holds**:
- single-use code doesn't warrant separate file
- extraction adds indirection without value
- matches extant pattern in feedback.take.set.ts (inline @stdin handler)

---

## check 3: subdomain namespace

### Q: are files properly namespaced under subdomain directories?

**blueprint adds**:
- no new files in `domain.operations/`
- no new files in `domain.objects/`
- no new files in `access/`

**all blueprint changes are**:
- 1 update to extant contract file
- 1 new test file (in extant test directory)
- 1 update to extant test utility

**verdict**: no subdomain namespace issues — no new domain directories created.

**why it holds**: this feature is an extension of extant `init.behavior` command, not a new subdomain.

---

## check 4: why not domain.operations/?

### Q: does wish logic belong in a shared domain operation?

**analysis**:
- wish content read is init.behavior specific
- wish validation is init.behavior specific
- no other command uses `--wish` flag
- no other command needs wish file state check

**counterexample search**:
```
$ grep -r "wish" src/domain.operations/
(no results)
```

**verdict**: wish logic stays inline in contract/cli/init.behavior.ts

**why it holds**:
- no extant domain operation for wish
- wish is a feature of init.behavior, not a shared domain concept
- feature scope is one command; domain.operations/ is for cross-command logic

---

## check 5: consistency with extant structure

### Q: does blueprint match extant directory patterns?

**extant patterns**:
- CLI files in `src/contract/cli/*.ts`
- acceptance tests in `blackbox/role=behaver/*.acceptance.test.ts`
- test utilities in `blackbox/role=behaver/.test/*.ts`

**blueprint files**:
| file | matches extant? |
|------|-----------------|
| `src/contract/cli/init.behavior.ts` | yes (update extant) |
| `blackbox/role=behaver/skill.init.behavior.wish.acceptance.test.ts` | yes (follows pattern) |
| `blackbox/role=behaver/.test/skill.init.behavior.utils.ts` | yes (update extant) |

**why it holds**: every file follows extant directory pattern exactly.

---

## summary table

| check | question | verdict |
|-------|----------|---------|
| layer placement | CLI in contract/cli/? | yes, correct |
| layer placement | tests in blackbox/? | yes, correct |
| layer placement | test utils in .test/? | yes, correct |
| inline transformers | should extract to domain.operations/? | no, inline is appropriate |
| subdomain namespace | files properly namespaced? | N/A, no new directories |
| domain.operations | wish logic belong there? | no, init.behavior specific |
| consistency | matches extant patterns? | yes, all files follow extant patterns |

---

## verdict

all directory decomposition checks pass:

- **layer placement** — all files in correct layers
- **inline transformers** — appropriate for small, single-use code
- **no new directories** — feature extends extant structure
- **consistency** — matches extant codebase patterns exactly

no issues found.

