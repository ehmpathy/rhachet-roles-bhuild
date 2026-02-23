# rule.forbid.cwd-override

## .what

never override `cwd` in spawn/exec options in production code (`src/`). cwd must always be `process.cwd()`.

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

## .scope

- applies to all `src/` code
- applies to `spawnSync`, `execSync`, `spawn`, `exec` options
- does NOT apply to test code

## .exception: tests only

tests may set `cwd` when run against a `genTempDir` repo:

```ts
// allowed in tests
execSync(`bash "${SCRIPT_PATH}" ${input.args}`, {
  cwd: input.repoDir,  // repoDir from genTempDir = git root of temp repo
});
```

this is the ONLY valid case for cwd override:
- `repoDir` from `genTempDir` IS the git root of the test repo
- the test simulates run from a consumer's git root

## .the rule

| context | cwd override | allowed |
|---------|--------------|---------|
| src/    | any          | NEVER   |
| test    | genTempDir repoDir | yes |
| test    | arbitrary path | NEVER |

## .enforcement

cwd override in `src/` = **BLOCKER**
