# self-review: has-snap-changes-rationalized (r7)

## the actual work: trace each deletion

i examined each removed line in the snapshots and traced it back to the source.

### template categories removed from medi

**category 1: external.product.domain research** (mega-only)
```
- 3.1.1.research.external.product.claims._.v1.stone
- 3.1.1.research.external.product.domain._.v1.stone
- 3.1.1.research.external.product.domain.terms.v1.stone
- 3.1.1.research.external.product.references._.v1.stone
```

**traced to vision:**
> "mega (adds): 3.1.1.research.external.product.*.stone (domain, terms, claims, references)"

**category 2: external.factory research** (mega-only)
```
- 3.1.2.research.external.factory.oss.levers._.v1.stone
- 3.1.2.research.external.factory.templates._.v1.stone
- 3.1.2.research.external.factory.testloops._.v1.stone
```

**traced to vision:**
> "mega (adds): 3.1.2.research.external.factory.*.stone (testloops, oss.levers, templates)"

**category 3: internal.factory research** (mega-only)
```
- 3.1.4.research.internal.factory.blockers._.v1.stone
- 3.1.4.research.internal.factory.opports._.v1.stone
```

**traced to vision:**
> "mega (adds): 3.1.4.research.internal.factory.*.stone (blockers, opports)"

**category 4: distillation** (mega-only)
```
- 3.2.distill.domain._.v1.stone
- 3.2.distill.factory.upgrades._.v1.stone
- 3.3.0.blueprint.factory.v1.stone
```

**traced to vision:**
> "mega (adds): 3.2.distill.domain._.v1 (.stone + .guard), 3.2.distill.factory.upgrades._.v1.stone, 3.3.0.blueprint.factory.v1.stone"

**category 5: verification** (NOT in any size)
```
- 5.3.verification.v1.guard
- 5.3.verification.v1.stone
```

**traced to vision:**
the vision's size → stones map does not list 5.3.verification in any size level. it skips from evaluation (5.2, mini) to playtest (5.5, medi). this is intentional - verification is explicitly excluded.

**category 6: renamed**
```
- .ref.[feedback].v1.[given].by_human.md
+ refs/template.[feedback].v1.[given].by_human.md
```

**traced to blueprint:**
> "templates/[~] .ref.[feedback]... → refs/template.[feedback]...  # rename"

this rename moves the file into a refs/ subdirectory.

### idempotent snapshot structure

the idempotent test captures three outputs:
1. **first run** - `├─ +` prefix (new file)
2. **second run** - `├─ ✓` prefix (extant file, findsert preserved)
3. **tree diff** (shows both runs)

all three sections have the same template removals. this is correct - the template list is the same for both runs.

### the +110 lines in new snapshot

`getAllTemplatesBySize.test.ts.snap` adds 110 lines with snapshots for:
- nano: 9 templates
- mini: 16 templates
- medi: 29 templates
- mega: 44 templates

these numbers match the cumulative sums from BEHAVIOR_SIZE_CONFIG.

### regression check

| potential issue | checked | result |
|-----------------|---------|--------|
| tree structure intact? | yes | `├─ +` and `└─ +` preserved |
| correct file count? | yes | medi = 29 (was 44) |
| idempotent markers? | yes | `✓` markers in second run |
| sorted alphabetically? | yes | templates in alphabetic order |
| no flaky values? | yes | no timestamps or dynamic ids |

## why this holds

1. **every removal traced to vision** - no accidental deletions
2. **mega templates correctly excluded** - medi should not include domain/factory research
3. **verification correctly excluded** - per vision, not in any size level
4. **new snapshot captures source of truth** - enables vibecheck on size config
5. **idempotent behavior preserved** - findsert semantics intact

## conclusion

all 90 line deletions are intentional and traced to the vision's size→stones map. the new 110-line snapshot captures the single source of truth for template lists per size.
