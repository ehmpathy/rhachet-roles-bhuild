# self-review: has-acceptance-test-citations (r4)

## the actual question

> for each playtest step, cite the acceptance test that verifies it.

## analysis: line-by-line review

### playtest happy path 1: verify --size nano

```
npx tsx ../../../bin/run skill init.behavior --name nano-test --size nano
```

**automated coverage:**
- file: `src/domain.operations/behavior/init/getAllTemplatesBySize.test.ts`
- case: `given('size=nano')` → `then('returns only nano-level templates')`
- lines: 25-34
- assertions:
  - `expect(templates).toContain('0.wish.md')`
  - `expect(templates).toContain('1.vision.stone')`
  - `expect(templates).not.toContain('2.1.criteria.blackbox.stone')`

**acceptance test:** none

### playtest happy path 2: verify --size mini

**automated coverage:**
- file: `src/domain.operations/behavior/init/getAllTemplatesBySize.test.ts`
- case: `given('size=mini')` → `then('returns nano + mini templates')`
- lines: 37-54
- assertions:
  - `expect(templates).toContain('2.1.criteria.blackbox.stone')`
  - `expect(templates).toContain('3.1.3.research.internal.product.code.prod._.v1.stone')`
  - `expect(templates).not.toContain('5.5.playtest.v1.stone')`

**acceptance test:** none

### playtest happy path 3: verify --size medi (default)

**automated coverage:**
- file: `src/domain.operations/behavior/init/getAllTemplatesBySize.test.ts`
- case: `given('size=medi')` → `then('returns nano + mini + medi templates')`
- lines: 56-74
- assertions:
  - `expect(templates).toContain('5.5.playtest.v1.stone')`
  - `expect(templates).toContain('3.2.distill.repros.experience._.v1.stone')`
  - `expect(templates).not.toContain('3.1.1.research.external.product.domain._.v1.stone')`

**acceptance test:** none

### playtest happy path 4: verify --size mega

**automated coverage:**
- file: `src/domain.operations/behavior/init/getAllTemplatesBySize.test.ts`
- case: `given('size=mega')` → `then('returns all templates')`
- lines: 76-89
- assertions:
  - `expect(templates).toContain('3.1.1.research.external.product.domain._.v1.stone')`
  - `expect(templates).toContain('3.2.distill.domain._.v1.guard')`
  - `expect(templates).toContain('3.3.0.blueprint.factory.v1.stone')`

**acceptance test:** none

### playtest happy path 5: verify --size + --guard compose

**automated coverage:** none

**why untestable via automation:**
- verification requires visual inspection: "heavy guards have more self-review prompts"
- this is aesthetic judgment, not deterministic assertion
- snapshot tests would be brittle and hard to maintain

**playtest provides explicit verification:**
```bash
cat .behavior/*/1.vision.guard | head -30
```

### playtest edgey path: invalid size value

**automated coverage:**
- zod schema validation in `src/contract/cli/init.behavior.ts:12`
- `size: z.enum(['nano', 'mini', 'medi', 'mega', 'giga']).optional()`
- any invalid value causes zod parse error with non-zero exit

**acceptance test:** none (validation is schema-enforced)

### playtest edgey path: giga = mega

**automated coverage:**
- file: `src/domain.operations/behavior/init/getAllTemplatesBySize.test.ts`
- case: `given('size=giga')` → `then('returns same as mega (reserved for future)')`
- lines: 91-99
- assertions:
  - `expect(gigaTemplates).toEqual(megaTemplates)`

**acceptance test:** none

## gap analysis

### why no acceptance tests is acceptable

from the blueprint (`3.3.1.blueprint.product.v1.i1.md`):

```markdown
### acceptance tests (optional, via CLI)

| case | scenario |
|------|----------|
| [+] | `init.behavior --name x --size nano` creates expected files |
| [+] | `init.behavior --name x` (no size) creates medi-level files |
```

the word **"optional"** appears in the header. the blueprint explicitly marked acceptance tests as not required.

### coverage summary

| layer | coverage |
|-------|----------|
| unit tests | complete (all 5 sizes + giga=mega) |
| snapshot tests | complete (template lists for all sizes) |
| acceptance tests | none (marked optional in blueprint) |
| playtest (manual) | complete (7 steps with verification commands) |

## why this holds

1. blueprint said acceptance tests are optional
2. unit tests cover size→template logic with snapshots
3. playtest covers manual verification for compose behavior
4. zod schema enforces invalid input rejection
5. no gap between stated requirements and actual coverage

