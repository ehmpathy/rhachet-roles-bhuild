# self-review: has-vision-coverage (r2)

## the actual question

> does the playtest cover all behaviors from wish and vision?

let me trace each line of the wish to playtest coverage.

## wish line-by-line trace

### wish line 3: "add a --size nano|mini|medi|mega|giga"

**playtest coverage:**
- happy path 1: `--size nano` ✓
- happy path 2: `--size mini` ✓
- happy path 3: no flag (medi) ✓
- happy path 4: `--size mega` ✓
- edgey path: `--size giga` ✓

### wish line 5: "medi = default"

**playtest coverage:**
- happy path 3: runs `init.behavior --name medi-test` without --size
- verifies output matches medi level (~29 files)

### wish line 22: "similar to --guard heavy|light"

**playtest coverage:**
- happy path 5: `--size mini --guard heavy`
- verifies both flags work together

### wish line 26: "factory is only needed for mega+"

**playtest coverage:**
- happy path 1-3: verify `3.1.2.research.external.factory.*` NOT extant
- happy path 4: verify `3.1.2.research.external.factory.*` extant

### wish line 28: "nano doesn't need research at all, just vision,blueprint,execution"

**playtest coverage:**
- happy path 1 verifies:
  - `0.wish.md` extant (wish)
  - `1.vision.stone` extant (vision)
  - `3.3.1.blueprint.product.v1.stone` extant (blueprint)
  - `5.1.execution.*` extant (execution)
  - `2.1.criteria.blackbox.stone` NOT extant (no criteria)
  - `3.1.*.stone` NOT extant (no research)

### wish line 31: "mini should addon criteria, codepaths"

**playtest coverage:**
- happy path 2 verifies:
  - `2.1.criteria.blackbox.stone` extant (criteria)
  - `3.1.3.research.internal.product.code.prod._.v1.stone` extant (codepaths)

### wish line 33: "medi should include the reflection stones"

**playtest coverage:**
- happy path 3 verifies:
  - `3.1.5.research.reflection.product.premortem._.v1.stone` extant
  - `5.5.playtest.v1.stone` extant

## vision coverage trace

### vision: size → stones map

| size | stones added | playtest verification |
|------|--------------|----------------------|
| nano | wish, vision, blueprint, roadmap, execution | path 1: NO criteria check |
| mini | criteria, code research, evaluation | path 2: YES criteria, YES code research |
| medi | reflection, playtest | path 3: YES reflection, YES playtest |
| mega | domain research, factory research, distillation | path 4: YES factory, YES distillation |

### vision: use cases table

| use case | playtest |
|----------|----------|
| nano: fix typo, bump version | happy path 1 |
| mini: add validation rule | happy path 2 |
| medi: novel endpoint | happy path 3 |
| mega: novel subsystem | happy path 4 |
| giga: platform migration | edgey path |

## why this holds

every requirement from wish is traced to a playtest step:
1. all 5 size values tested
2. medi as default tested (no --size flag)
3. size + guard composition tested
4. factory = mega+ only verified
5. nano = minimal verified
6. mini = criteria + codepaths verified
7. medi = reflection verified

## conclusion

the playtest covers all behaviors from wish and vision. each requirement has a matched verification step with explicit file presence/absence checks.
