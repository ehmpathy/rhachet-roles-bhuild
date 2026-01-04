# portable skills pattern

## what

pattern to create shell-based skills that dispatch to TypeScript domain operations, isomorphic across:
- development (run from src/)
- test (run via rhachet in test consumer repos)
- production (installed as npm dependency)

## when to use

use this pattern when:
- domain operations are complex enough to warrant decomposition into `domain.operations/`
- you want TypeScript for type safety, testability, and composition
- the skill must work portably when consumed as a dependency

## how

### 1. isomorphic dispatch

shell scripts dispatch directly against the package export:

```bash
#!/usr/bin/env bash
set -euo pipefail
exec npx tsx -e "import('rhachet-roles-bhuild').then(m => m.cli.mySkill())" -- "$@"
```

this works in both contexts via standard node module resolution:

| context | how resolution works |
|---------|---------------------|
| **local development** | `devDependencies` self-reference (`"rhachet-roles-bhuild": "file:."`) makes the package resolvable to repo root |
| **published / consumed** | standard node_modules resolution finds the installed package |

the self-reference belongs in `devDependencies` because:
- only needed during development (for the import to resolve to repo root)
- at runtime (when consumed as npm dependency), standard node_modules resolution works
- not a runtime dependency of the package itself

```json
{
  "devDependencies": {
    "rhachet-roles-bhuild": "file:."
  }
}
```

### 2. shell skill as thin dispatcher

create a shell script that imports and invokes the CLI export:

```bash
#!/usr/bin/env bash
set -euo pipefail
exec npx tsx -e "import('rhachet-roles-bhuild').then(m => m.cli.mySkill())" -- "$@"
```

the shell script is just a one-liner that delegates to the package export.

### 3. CLI entry point exports

create the CLI entry point at `src/contract/cli/my-skill.ts`:

```typescript
import { z } from 'zod';

import { myOperation } from '../../domain.operations/my-operation';
import { getCliArgs } from '../../infra/cli';

const schemaOfArgs = z.object({
  named: z.object({
    name: z.string(),
    verbose: z.boolean().default(false),
  }),
  ordered: z.array(z.string()).default([]),
});

export const mySkill = () => {
  const { named } = getCliArgs({ schema: schemaOfArgs });
  myOperation(named);
};
```

arg parsing via `getCliArgs({ schema: schemaOfArgs })` provides:
- automatic rhachet arg stripping (`--repo`, `--role`, `--skill`, `-s`, `--`)
- Zod validation with typed output
- schema must follow `{ named, ordered }` shape:
  - `named`: object with --flag and --key value args
  - `ordered`: array of positional args
- error messages on invalid args

export all CLI entry points from `src/index.ts`:

```typescript
import { mySkill } from './contract/cli/my-skill';

export const cli = {
  mySkill,
};
```

the `stripRhachetArgs` utility (from `src/infra/cli/`) removes rhachet dispatch args so skill-specific parsing doesn't fail on unknown arguments.

### 4. domain operations

implement complex logic in `src/domain.operations/`:

```
src/
├── contract/
│   └── cli/
│       └── my-skill.ts       # CLI entry point
├── domain.operations/
│   └── my-operation/
│       ├── index.ts          # public interface
│       ├── step1.ts          # decomposed operations
│       └── step2.ts
└── domain.roles/
    └── my-role/
        └── skills/
            └── my-skill.sh   # thin dispatcher
```

## why this works

shell scripts are location-independent because they import directly from the package.

when rhachet symlinks skills to `.agent/repo=.../skills/`, the shell script location changes but `import('rhachet-roles-bhuild')` still resolves correctly because node module resolution happens at runtime from the consumer's node_modules.

## key constraints

- CLI entry points MUST be exported from `src/index.ts` under `cli.*`
- CLI entry points MUST handle rhachet passthrough args (`--repo`, `--skill`, `--role`, `--`)
- package.json MUST have the self-reference in devDependencies for development to work
