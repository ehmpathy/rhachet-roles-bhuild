# self-review: has-consistent-conventions

review for divergence from extant names and patterns.

---

## extant conventions identified

from `src/domain.operations/`:

| prefix | purpose | examples |
|--------|---------|----------|
| get* | retrieval | getGithubTokenByAuthArg, getBranchBehaviorBind |
| set* | mutation | setBranchBehaviorBind, setDream |
| compute* | pure computation | computePlanFromFile, computeOutputTree |
| del* | deletion | delBranchBehaviorBind, deleteDream |
| extract* | parse from format | extractTaskFromGhIssues |
| compose* | build into format | composeTaskIntoGhIssues |

---

## new names reviewed

### getAuthFromKeyrack

| question | answer |
|----------|--------|
| does it follow extant prefix? | yes — `get*` for retrieval |
| does it match extant pattern? | yes — `get[What]From[Source]` like `getGithubTokenByAuthArg` |
| does it introduce new terms? | no — uses extant terms: auth, keyrack |

**verdict**: consistent

### via-keyrack auth mode

| question | answer |
|----------|--------|
| does it follow extant pattern? | yes — `as-robot:via-[source]([param])` |
| extant modes for reference | `as-robot:shx(cmd)`, `as-robot:env(var)` |

**verdict**: consistent — `via-keyrack(owner)` matches the `[source]([param])` pattern

### keyrack.yml file

| question | answer |
|----------|--------|
| does it follow extant pattern? | yes — `src/domain.roles/dispatcher/keyrack.yml` |
| extant role files for reference | other roles may have similar yml files |

**verdict**: consistent

---

## conclusion

all new names follow extant conventions:
- `getAuthFromKeyrack` follows the `get*` verb prefix
- `via-keyrack(owner)` follows the `via-[source]([param])` pattern
- `keyrack.yml` follows role directory conventions

no divergence from extant patterns detected.
