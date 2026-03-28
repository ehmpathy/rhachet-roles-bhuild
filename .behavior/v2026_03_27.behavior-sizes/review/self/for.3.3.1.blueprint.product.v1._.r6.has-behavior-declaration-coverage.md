# self-review: has-behavior-declaration-coverage (round 6)

## review of: 3.3.1.blueprint.product.v1.i1.md

review for coverage of behavior declaration (vision + criteria).

---

## vision requirements check

### vision: nano = wish, vision, blueprint, roadmap, execution

**blueprint says:** NANO_TEMPLATES includes these 5 stones + guards

**covered?** ✅ yes

### vision: mini adds criteria, code research, evaluation

**blueprint says:** MINI_ADDS includes 2.1.criteria, 2.2.criteria.matrix, 3.1.3.research.code.*, 5.2.evaluation

**covered?** ✅ yes

### vision: medi adds reflection, playtest, repros

**blueprint says:** MEDI_ADDS includes 3.1.5.reflection.*, 3.2.distill.repros, 5.5.playtest

**covered?** ✅ yes

### vision: mega adds domain research, factory, distillation

**blueprint says:** MEGA_ADDS includes domain.*, factory.*, distill.domain, distill.factory, blueprint.factory

**covered?** ✅ yes

### vision: giga = mega

**blueprint says:** "giga = mega (same stones, signals decomposition expected)"

**covered?** ✅ yes

### vision: medi is default

**blueprint says:** `const sizeLevel = input.size ?? 'medi'`

**covered?** ✅ yes

### vision: --size and --guard are orthogonal

**blueprint says:** "both flags work independently"

**covered?** ✅ yes

### vision: feedback template in all sizes

**blueprint says:** NANO_TEMPLATES includes 'refs/template.[feedback]...'

**covered?** ✅ yes (if in nano, all sizes have it)

### vision: refs/ subdirectory

**blueprint says:** "subdirectory creation for refs/"

**covered?** ✅ yes

### vision: 3.2.distill.domain.guard (new guard)

**blueprint says:** MEGA_ADDS includes '3.2.distill.domain._.v1.guard'

**covered?** ✅ yes

---

## criteria requirements check

### usecase.1: init with size

**criteria says:** create behavior with size-appropriate stones

**blueprint says:** size filter applied to template list

**covered?** ✅ yes

### usecase.2: default size

**criteria says:** no --size defaults to medi

**blueprint says:** `input.size ?? 'medi'`

**covered?** ✅ yes

### usecase.3: size composes with guard

**criteria says:** --size mini --guard heavy works

**blueprint says:** "both params are independent inputs"

**covered?** ✅ yes

### usecase.4: help shows sizes

**criteria says:** --help shows all five sizes

**blueprint:** not explicitly covered

**gap found?** ⚠️ blueprint doesn't mention --help changes

**fix required?** no - --help is auto-generated from zod schema. size added to schema means --help auto-updates.

**covered?** ✅ implicitly covered via zod schema

### usecase.5: wrong size recovery

**criteria says:** users can manually add/remove stones

**blueprint says:** findsert semantics preserved

**covered?** ✅ yes - findsert means files persist on re-init

### usecase.6: feedback template

**criteria says:** all sizes include feedback template

**blueprint says:** NANO_TEMPLATES includes feedback template

**covered?** ✅ yes

---

## gaps found

| requirement | status | notes |
|-------------|--------|-------|
| nano stones | ✅ covered | |
| mini adds | ✅ covered | |
| medi adds | ✅ covered | |
| mega adds | ✅ covered | |
| giga = mega | ✅ covered | |
| medi default | ✅ covered | |
| orthogonal flags | ✅ covered | |
| feedback template | ✅ covered | |
| refs/ subdir | ✅ covered | |
| new guard | ✅ covered | |
| init with size | ✅ covered | |
| compose with guard | ✅ covered | |
| --help | ✅ implicit | zod schema |
| wrong size recovery | ✅ covered | findsert |

**conclusion:** all vision and criteria requirements are covered in blueprint.
