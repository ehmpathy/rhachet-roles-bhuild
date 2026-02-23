# rule.forbid.cwd-override

## .what

never override `cwd` in spawn/exec options. cwd must always be `process.cwd()`.

## .why

- cwd is the user's git root
- all paths are relative to cwd
- cwd override breaks path assumptions everywhere
- relative paths become invalid when cwd changes
- debug becomes impossible when cwd varies

## .pattern

```ts
// contract layer: declare context with cwd = process.cwd()
const context = { cwd: process.cwd() };
const targetDir = named.dir ?? '.';  // relative to cwd, defaults to '.'

// pass context through to domain operations
const branch = getCurrentBranch({}, context);
const bind = getBranchBehaviorBind({ branchName, targetDir }, context);
```

## .distinction: cwd vs targetDir

| concept   | what it is                    | example           |
|-----------|-------------------------------|-------------------|
| cwd       | git root, always process.cwd()| `/home/user/repo` |
| targetDir | relative path from cwd        | `.` or `subdir`   |

```ts
// cwd = /home/user/repo (git root)
// targetDir = '.' (default)
// result: .behavior created at /home/user/repo/.behavior

// cwd = /home/user/repo
// targetDir = 'packages/app'
// result: .behavior created at /home/user/repo/packages/app/.behavior
```

## .constraint: targetDir must be inside cwd

if `targetDir` resolves to a path outside `cwd`, fail fast with `BadRequestError`.

```ts
import { isAbsolute, resolve } from 'path';
import { BadRequestError } from 'helpful-errors';

// validate targetDir is inside cwd
const resolvedTarget = isAbsolute(targetDir)
  ? targetDir
  : resolve(context.cwd, targetDir);

if (!resolvedTarget.startsWith(context.cwd)) {
  throw new BadRequestError('targetDir must be inside cwd', {
    targetDir,
    cwd: context.cwd,
    resolved: resolvedTarget,
  });
}
```

this prevents:
- path traversal attacks (`--dir ../../../etc`)
- accidental operations on external repos
- confusion about which git root applies

## .scope

- applies to all `src/` code
- applies to `spawnSync`, `execSync`, `spawn`, `exec` options
- applies to all CLI entry points that accept `--dir` argument

## .the rule

| scenario | allowed |
|----------|---------|
| cwd override in src/ | NEVER |
| cwd override in tests (to simulate git root) | yes |
| targetDir outside cwd | NEVER (BadRequestError) |
| targetDir relative inside cwd | yes |

## .test pattern

tests may set `cwd` to simulate a user's git root:

```ts
// test invokes skill from temp repo's perspective
execSync(`npx rhachet run --skill bind.behavior -- set --behavior foo`, {
  cwd: tempRepoDir,  // simulates user run from temp repo
});
// inside the skill: process.cwd() returns tempRepoDir
// targetDir defaults to '.' which is inside cwd - valid!
```

what's NOT allowed in tests:

```ts
// DON'T: pass absolute path outside cwd
execSync(`bash skill.sh --dir "${tempRepoDir}"`, {
  // no cwd override - process.cwd() returns main repo
});
// inside the skill: cwd = main repo, targetDir = tempRepoDir
// tempRepoDir is OUTSIDE main repo - BadRequestError!
```

## .enforcement

- cwd override in src/ = **BLOCKER**
- targetDir outside cwd without validation = **BLOCKER**
