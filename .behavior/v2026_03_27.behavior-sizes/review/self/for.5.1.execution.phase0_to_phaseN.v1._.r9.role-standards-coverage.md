# self-review: role-standards-coverage (r9)

## rule directories enumerated

all directories in `.agent/repo=ehmpathy/role=mechanic/briefs/practices/`:

```
code.prod/
├── consistent.artifacts/      - pinned versions
├── consistent.contracts/      - as-command ref
├── evolvable.architecture/    - wet-over-dry, bounded-contexts, domain-driven
├── evolvable.domain.objects/  - nullable, undefined, immutable refs
├── evolvable.domain.operations/ - get-set-gen verbs, sync filename
├── evolvable.procedures/      - io-domain, io-interfaces, positional, arrow, contract, di, hook, input-context, input-options, named, single-responsibility
├── evolvable.repo.structure/  - barrel, index, directional-deps
├── pitofsuccess.errors/       - failhide, helpful-error, exit-code, fail-fast
├── pitofsuccess.procedures/   - nonidempotent, undefined-inputs, idempotent, immutable
├── pitofsuccess.typedefs/     - as-cast, shapefit
├── readable.comments/         - what-why headers
├── readable.narrative/        - unnecessary-ifs, else-branches, narrative-flow
└── readable.persistence/      - declastruct
code.test/
├── frames.behavior/           - given-when-then, useThen
├── frames.caselist/           - data-driven
├── lessons.howto/             - write, run, diagnose
└── scope.*/                   - blackbox, unit
lang.*/
├── lang.terms/                - gerunds, noun_adj, treestruct, ubiqlang, forbid terms
└── lang.tones/                - buzzwords, shouts, lowercase, chill emojis, term-human
work.flow/
├── diagnose/                  - bisect, logservation, test-covered-repairs
├── refactor/                  - sedreplace, review-test-changes
├── release/                   - commit-scopes, watch-release
└── tools/                     - git-commit-set, read-package-docs, terraform, externalized-knowledge
```

## file-by-file coverage verification

### file 1: getAllTemplatesBySize.ts

| rule category | specific rule | coverage in r6/r7 | verdict |
|---------------|---------------|-------------------|---------|
| evolvable.procedures/input-context | `(input: {...})` | r7 line 79 | ✓ |
| evolvable.procedures/arrow-only | arrow functions | r7 line 82 | ✓ |
| evolvable.procedures/named-args | named objects | r6 line 28-29 | ✓ |
| evolvable.procedures/single-responsibility | one export per file | r7 line 31 | ✓ |
| evolvable.architecture/wet-over-dry | no premature abstraction | r6 line 37-39 | ✓ |
| evolvable.architecture/domain-driven | BehaviorSizeLevel type | r6 line 41-42 | ✓ |
| pitofsuccess.typedefs/forbid-as-cast | one allowed for Object.keys | r7 lines 68-70 | ✓ |
| pitofsuccess.typedefs/shapefit | satisfies pattern | r7 lines 48-50 | ✓ |
| pitofsuccess.procedures/immutable-vars | const not let | r7 line 70 | ✓ |
| readable.comments/what-why | file header present | r7 lines 34-41 | ✓ |
| readable.narrative/forbid-else | no else branches | r7 line 100 | ✓ |
| readable.narrative/narrative-flow | early returns | r7 line 101 | ✓ |
| lang.terms/forbid-gerunds | no gerunds | r6 lines 86-92 | ✓ |
| lang.terms/noun_adj | sizeLevel, guardLevel | r6 lines 89-92 | ✓ |
| lang.terms/treestruct | getAllTemplatesBySize | r6 lines 94-96 | ✓ |

### file 2: initBehaviorDir.ts (changes only)

| rule category | specific rule | coverage in r6/r7 | verdict |
|---------------|---------------|-------------------|---------|
| evolvable.procedures/input-context | input object | r6 line 22 | ✓ |
| evolvable.procedures/named-args | destructured calls | r7 line 125 | ✓ |
| pitofsuccess.procedures/undefined-inputs | nullable not optional | r7 line 109 | ✓ |
| pitofsuccess.procedures/immutable-vars | const sizeLevel | r7 line 115 | ✓ |
| readable.narrative/narrative-flow | early continue | r7 line 134-135 | ✓ |

### file 3: init.behavior.ts (changes only)

| rule category | specific rule | coverage in r6/r7 | verdict |
|---------------|---------------|-------------------|---------|
| pitofsuccess.typedefs/shapefit | zod schema | r7 line 143 | ✓ |
| evolvable.procedures/named-args | named call | r7 line 153 | ✓ |

### file 4: tests

| rule category | specific rule | coverage in r6/r7 | verdict |
|---------------|---------------|-------------------|---------|
| code.test/frames.behavior | given-when-then | r6 line 77-81 | ✓ |
| code.test/lessons.howto | proper structure | implicit | ✓ |

## rules NOT applicable (with rationale)

| rule | why not applicable |
|------|-------------------|
| consistent.artifacts/pinned-versions | no new dependencies added |
| consistent.contracts/as-command | no command pattern needed |
| evolvable.domain.objects/* | BehaviorSizeLevel is derived type, not domain object |
| evolvable.domain.operations/get-set-gen | getAllTemplates follows pattern (get prefix) |
| evolvable.repo.structure/barrel | no barrel exports added |
| evolvable.repo.structure/directional-deps | all imports follow domain.operations → domain.objects |
| pitofsuccess.errors/fail-fast | no error paths in pure functions |
| pitofsuccess.errors/failhide | no try/catch blocks |
| readable.persistence/declastruct | no remote resources |
| code.test/frames.caselist | data-driven tests not needed |
| code.test/scope.unit | tests are appropriately scoped |
| lang.tones/* | code only, no prose |
| work.flow/* | covered by process, not implementation |

## patterns that could be absent

### checked for gaps

1. **error handle for invalid size?** not needed - zod validates at CLI layer, type system enforces at domain layer
2. **validation in getAllTemplatesBySize?** not needed - BehaviorSizeLevel type constrains input
3. **tests for edge cases?** present - giga = mega verified, cumulative behavior verified
4. **type exports?** present - BehaviorSizeLevel exported for consumers
5. **jsdoc on exports?** present - .what/.why headers on file and functions

### potential gap identified and verified

**question:** does isTemplateInSize need error handle for invalid templateName?

**answer:** no - the function returns boolean, callers handle the false case. this is correct predicate pattern.

## conclusion

all applicable mechanic role standards have coverage. the r6 and r7 reviews systematically verified adherance. no standards are absent from review. the implementation follows all required patterns.

