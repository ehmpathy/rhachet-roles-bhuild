# self-review: has-ergonomics-validated (r8)

## the actual question

> does the actual input/output match what felt right at repros?

no repros artifact exists (mini size level). compare to vision instead.

## vision sketch vs implementation

### vision: planned CLI interface

```bash
$ npx rhachet run --skill init.behavior --name fix-typo --size nano
$ npx rhachet run --skill init.behavior --name add-validation --size mini
$ npx rhachet run --skill init.behavior --name new-endpoint --size medi
$ npx rhachet run --skill init.behavior --name new-auth-system --size mega --guard heavy
```

### implementation: actual CLI interface

from `src/contract/cli/init.behavior.ts`:
```ts
const schemaOfArgs = z.object({
  named: z.object({
    name: z.string().describe('behavior name'),
    size: z.enum(['nano', 'mini', 'medi', 'mega', 'giga']).optional().describe('ceremony level'),
    guard: z.enum(['light', 'heavy']).optional().describe('guard weight'),
    open: z.string().optional().describe('editor to open wish file'),
  }),
  ordered: z.array(z.string()).default([]),
});
```

**comparison:**
| vision | implementation | match? |
|--------|----------------|--------|
| `--name <name>` | `--name` string required | yes |
| `--size nano\|mini\|medi\|mega\|giga` | `--size` enum optional | yes |
| `--guard light\|heavy` | `--guard` enum optional | yes |
| medi default | `.optional()` + code default | yes |

### vision: planned output

```
🦫 oh, behave!
├─ + 0.wish.md
├─ + 1.vision.stone
...
```

### implementation: actual output

from acceptance test snapshot:
```
"🦫 oh, behave!
   ├─ + 0.wish.md
   ├─ + 1.vision.guard
   ├─ + 1.vision.stone
   ...
```

**comparison:**
| vision | implementation | match? |
|--------|----------------|--------|
| beaver emoji | `🦫 oh, behave!` | yes |
| tree structure | `├─ +` file markers | yes |
| file list | actual templates per size | yes |

### vision: planned help output

```
$ npx rhachet run --skill init.behavior --help

init.behavior - initialize a behavior thoughtroute

usage:
  init.behavior --name <name> [--size <size>] [--guard <level>] [--open <editor>]

options:
  --name <name>       behavior name (required)
  --size <size>       ceremony level (default: medi)
      nano            small isolated changes, no cascades
      mini            small focused changes, adds criteria + codepath research
      medi            known domain work, adds reflection + playtest
      mega            novel domain work, adds domain research + distillation
      giga            novel domain work, decomposition expected
  --guard <level>     guard weight: light (default) or heavy
  --open <editor>     open wish file in editor after init
```

### implementation: actual help output

zod generates help from schema. not explicitly tested, but schema has:
- `--name` with describe
- `--size` with enum values and describe
- `--guard` with enum values and describe
- `--open` with describe

**comparison:** structurally matches. zod format may differ from sketch.

## ergonomics drift?

| aspect | vision | implementation | drift? |
|--------|--------|----------------|--------|
| flag names | --size, --guard | --size, --guard | none |
| size values | nano\|mini\|medi\|mega\|giga | same | none |
| default size | medi | medi | none |
| output format | tree with emoji | tree with emoji | none |
| help output | structured list | zod-generated | acceptable |

## conclusion

no ergonomics drift detected. the implementation matches the vision sketch:
1. CLI flags match planned interface
2. output format matches planned tree structure
3. size values and default match
4. help generation is automatic (acceptable difference from sketch)
