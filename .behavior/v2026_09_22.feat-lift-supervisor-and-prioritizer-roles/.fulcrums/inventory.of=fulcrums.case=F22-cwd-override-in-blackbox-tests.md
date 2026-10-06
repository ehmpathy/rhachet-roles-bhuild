# F22 — `cwd` override in `blackbox/` test infra: permitted, or a 28-location repair?

| | |
|---|---|
| **rework** | ✅ **clean** |
| **status** | disputed with `repo-rules` (i004 r001 blocker.1) |
| **confidence** | **97%** |
| **where** | `blackbox/.test/infra/*.ts` · 28 cited locations · `…r001._.taken.by_self.repo-rules.md` |

## .the fork, stated fairly

`repo-rules` raised **1 blocker** citing `rule.forbid.cwd-override`, over 28 `execSync`
call sites that pass `cwd: input.repoDir`. its reading:

> *"According to the rule, cwd MUST always be `process.cwd()` (the git root)."*

| option | the call |
|---|---|
| **A — concede** | the rule is absolute. rework all 28 sites, and re-architect every acceptance test to run from the repo root against temp dirs by relative path |
| **B — dispute** (taken) | the rule scopes itself to `src/`, and carves tests out **explicitly** |

## .why I took B

the rule is not ambiguous on this. it states the carve-out twice, in its own words:

**its `.scope` section:**
```
- applies to all `src/` code
```

**its `.the rule` table:**
```
| scenario                                   | allowed |
| cwd override in src/                       | NEVER   |
| cwd override in tests (to simulate git root) | yes   |
```

**and its `.test pattern` section gives the POSITIVE example** — which is, line for line,
the pattern the reviewer flagged as the violation:

```ts
execSync(`npx rhachet run --skill bind.behavior -- set --behavior foo`, {
  cwd: tempRepoDir,  // simulates user run from temp repo
});
```

⇒ the rule does not merely permit this. **it prescribes it.**

and all 28 cited locations are under `blackbox/` — zero under `src/`:

```
blackbox/.test/infra/{runRhachetSkill,runRolesInit,genTestGitRepo,genConsumerRepo}.ts
blackbox/role={behaver,prioritizer,dispatcher}/*.acceptance.test.ts
blackbox/init.behavior.at-branch.acceptance.test.ts
blackbox/role=behaver/.test/skill.init.behavior.utils.ts
```

## 🔴 .and option A would break the thing the rule exists to protect

the rule's own `.test pattern` section spells out what happens without the override:

> *what's NOT allowed in tests:* pass an absolute path outside cwd via `--dir`
> → *"tempRepoDir is OUTSIDE main repo — BadRequestError!"*

⇒ the override IS the sanctioned mechanism. remove it and every acceptance test must
pass `--dir /tmp/…` instead, which is the case the rule actually forbids. **option A
does not merely cost rework; it converts 28 compliant sites into 28 violations.**

## .why it is only 97%, and not higher

the reviewer read the rule and reached the opposite conclusion, which is evidence the
rule can be misread — most likely from its `.what` line (*"never override `cwd`… cwd
must always be `process.cwd()`"*) taken without the `.scope` and table beneath it.

I cannot rule out that the intent has since narrowed and the table is stale. but the
table, the scope line, and the worked example all agree with each other, and a reviewer
citation that quotes none of the three is the weaker evidence.

## .the rework, if overturned

**clean.** the 28 sites share 4 infra operations; the repair is concentrated, not
scattered. no caller outside `blackbox/` leans on it, and no published contract changes.

⇒ if the council rules for A, the honest follow-on is to **amend the rule first** — its
table and example would then contradict its own enforcement, and the next traveler would
re-litigate this exact dispute.

## .the verdict

> _(awaiting council)_
