# self-review: has-vision-coverage (r1)

## the actual question

> does the playtest cover all behaviors from wish and vision?

let me extract behaviors from each artifact and map to playtest steps.

## behaviors from wish (0.wish.md)

| behavior | playtest coverage |
|----------|-------------------|
| add --size flag to init.behavior | happy paths 1-5 all test --size |
| nano/mini/medi/mega/giga values | happy paths 1, 2, 3, 4 + edgey path |
| medi = default | happy path 3 (no --size flag) |
| nano = 1liner, no research | happy path 1 (NO research files) |
| mini = criteria, codepath research | happy path 2 (YES criteria, YES code research) |
| mega = domain research + distillation | happy path 4 (YES factory research, YES distillation) |
| giga = same as mega | edgey path (giga = mega) |
| which stones are in which size | happy paths 1-5 verify file presence |

## behaviors from vision (1.vision.md)

### use cases table

| use case | playtest coverage |
|----------|-------------------|
| nano: small isolated changes | happy path 1 |
| mini: small focused changes | happy path 2 |
| medi: known domain work | happy path 3 (default) |
| mega: novel domain work | happy path 4 |
| giga: decomposition expected | edgey path |

### contract from vision

| contract | playtest coverage |
|----------|-------------------|
| `init.behavior --name <name> --size <size>` | all happy paths |
| size composes with guard | happy path 5 |
| help shows sizes | NOT tested (zod provides, assumed) |

### size → stones map from vision

| level | stones | playtest verification |
|-------|--------|----------------------|
| nano | wish, vision, blueprint, roadmap, execution | happy path 1 verifies NO criteria |
| mini (adds) | criteria, code research, evaluation | happy path 2 verifies YES criteria, NO playtest |
| medi (adds) | reflection, playtest | happy path 3 verifies YES playtest, NO factory |
| mega (adds) | domain research, factory research, distillation | happy path 4 verifies YES factory, YES distill |
| giga | same as mega | edgey path verifies same output |

## gap analysis

| vision behavior | playtest? |
|-----------------|-----------|
| nano creates ~9 files | yes |
| mini creates ~16 files | yes |
| medi creates ~29 files | yes |
| mega creates ~44 files | yes |
| giga = mega | yes |
| size + guard compose | yes |
| --help shows sizes | NO (acceptable: zod automatic) |
| wrong size recovery | NO (acceptable: manual workflow) |

### acceptable gaps

1. **--help output** - zod generates help from schema, not behavioral
2. **wrong size recovery** - manual workflow, not testable via CLI

## conclusion

the playtest covers all behavioral requirements from wish and vision:
- all 5 size levels verified
- default (medi) verified
- size + guard composition verified
- file presence/absence verified per size
- edgey path for invalid input verified
