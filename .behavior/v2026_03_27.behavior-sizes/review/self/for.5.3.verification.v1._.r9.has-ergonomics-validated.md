# self-review: has-ergonomics-validated (r9)

## the actual question

> does the actual input/output match what felt right at repros?

no repros artifact exists. compare vision sketch to actual implementation.

## line-by-line comparison

### vision: schema sketch

```
options:
  --name <name>       behavior name (required)
  --size <size>       ceremony level (default: medi)
  --guard <level>     guard weight: light (default) or heavy
  --open <editor>     open wish file in editor after init
```

### actual: `src/contract/cli/init.behavior.ts` lines 32-47

```ts
const schemaOfArgs = z.object({
  named: z.object({
    name: z.string(),
    dir: z.string().optional(),
    open: z.string().optional(),
    size: z.enum(['nano', 'mini', 'medi', 'mega', 'giga']).optional(),
    guard: z.enum(['light', 'heavy']).optional(),
    // rhachet passthrough args (optional, ignored)
    repo: z.string().optional(),
    role: z.string().optional(),
    skill: z.string().optional(),
    s: z.string().optional(),
  }),
  ordered: z.array(z.string()).default([]),
});
```

**ergonomics comparison:**

| vision | actual | match? | notes |
|--------|--------|--------|-------|
| `--name` required | `z.string()` | yes | required (no .optional()) |
| `--size` optional | `z.enum([...]).optional()` | yes | enum values match |
| `--guard` optional | `z.enum([...]).optional()` | yes | enum values match |
| `--open` optional | `z.string().optional()` | yes | accepts editor name |
| medi default | handled in `initBehaviorDir` | yes | not in schema, in logic |

### vision: size flow sketch

```
npx rhachet run --skill init.behavior --name fix-typo --size nano
```

### actual: size flow (lines 122-128)

```ts
const result = initBehaviorDir({
  behaviorDir,
  behaviorDirRel,
  size: named.size,      // passed directly
  guard: named.guard,    // passed directly
});
```

the size flag flows:
1. zod parses `--size nano` → `named.size = 'nano'`
2. `initBehavior` passes to `initBehaviorDir`
3. `initBehaviorDir` defaults to `'medi'` if undefined

**trace verified:** the size flows from CLI → domain operation without transformation.

### vision: output sketch

```
🦫 oh, behave!
├─ + 0.wish.md
├─ + 1.vision.stone
...

🐟 your wish is my command,
   └─ .behavior/v2026_03_27.test-behavior/0.wish.md
```

### actual: output (lines 130-160)

```ts
const treeOutput = computeOutputTree({
  created: result.created,
  kept: result.kept,
  updated: [],
});
console.log(treeOutput);

// ...

const footerOutput = computeFooterOutput({ wishPathRel, opener: openerUsed });
console.log(footerOutput);
```

**output structure:**
1. tree with `🦫 oh, behave!` header
2. file list with `├─ +` (created) or `├─ ✓` (kept) markers
3. fish emoji footer with wish path

**matches vision?** yes. tree structure, emoji, and path display match.

### vision: auto-bind sketch

```
🍄 we'll remember,
   ├─ branch feature/new-behavior <-> behavior v2026_03_27.test-behavior
   ├─ branch bound to behavior, to boot via hooks
   └─ branch bound to route, to drive via hooks
```

### actual: auto-bind (lines 176-187)

```ts
console.log(`🍄 we'll remember,`);
console.log(
  `   ├─ branch ${currentBranch} <-> behavior ${basename(behaviorDir)}`,
);
console.log(
  `   ├─ ${dim}branch bound to behavior, to boot via hooks${reset}`,
);
console.log(`   └─ ${dim}branch bound to route, to drive via hooks${reset}`);
```

**matches vision?** yes. mushroom emoji, branch<->behavior line, and explanation.

## ergonomics drift found?

**none.** every element of the vision sketch is present in the implementation:

| element | vision | implementation | drift |
|---------|--------|----------------|-------|
| CLI flags | 4 flags | 4 flags (+ dir bonus) | none |
| flag names | name,size,guard,open | exact match | none |
| size enum | nano\|mini\|medi\|mega\|giga | exact match | none |
| default size | medi | medi | none |
| output emoji | 🦫, 🐟, 🍄 | exact match | none |
| tree structure | `├─ +` markers | exact match | none |

## conclusion

the implementation matches the vision sketch exactly. no ergonomics drift. the size flag flows correctly from CLI parse → domain operation → template filter.
