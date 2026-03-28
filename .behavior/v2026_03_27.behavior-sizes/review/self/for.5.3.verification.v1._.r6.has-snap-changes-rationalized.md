# self-review: has-snap-changes-rationalized (r6)

## snapshot files changed

| file | change type | lines |
|------|-------------|-------|
| skill.init.behavior.scaffold.acceptance.test.ts.snap | modified | -15 |
| skill.init.behavior.bind.acceptance.test.ts.snap | modified | -15 |
| skill.init.behavior.flags.acceptance.test.ts.snap | modified | -15 |
| skill.init.behavior.idempotent.acceptance.test.ts.snap | modified | -45 |
| getAllTemplatesBySize.test.ts.snap | new | +110 |

## rationale per file

### 1. scaffold.acceptance.test.ts.snap

**what changed:** removed 15 templates from medi output

**removed templates:**
- `.ref.[feedback].v1.[given].by_human.md` → renamed to `refs/template.[feedback]...`
- `3.1.1.research.external.product.claims._.v1.stone` → mega-only
- `3.1.1.research.external.product.domain._.v1.stone` → mega-only
- `3.1.1.research.external.product.domain.terms.v1.stone` → mega-only
- `3.1.1.research.external.product.references._.v1.stone` → mega-only
- `3.1.2.research.external.factory.*` → mega-only
- `3.1.4.research.internal.factory.*` → mega-only
- `3.2.distill.domain._.v1.stone` → mega-only
- `3.2.distill.factory.upgrades._.v1.stone` → mega-only
- `3.3.0.blueprint.factory.v1.stone` → mega-only
- `5.3.verification.v1.*` → NOT in any size level (per vision)

**intentional?** yes. this is the core feature - medi size excludes mega-only templates.

**rationale:** per vision section "size → stones map", mega-only templates are domain research, factory research, and distillation. medi should not include these.

### 2. bind.acceptance.test.ts.snap

**what changed:** same 15 templates removed

**intentional?** yes. bind test also runs at medi (default) size.

**rationale:** same as scaffold - medi excludes mega-only templates.

### 3. flags.acceptance.test.ts.snap

**what changed:** same 15 templates removed

**intentional?** yes. flags test also runs at medi (default) size.

**rationale:** same as scaffold.

### 4. idempotent.acceptance.test.ts.snap

**what changed:** 45 lines removed (same pattern, appears 3x in test)

**intentional?** yes. idempotent test runs twice, so the diff is 3x (first run + re-run comparison).

**rationale:** same as scaffold.

### 5. getAllTemplatesBySize.test.ts.snap (new)

**what changed:** new file with 110 lines

**content:** snapshots for nano/mini/medi/mega template lists

**intentional?** yes. these snapshots enable vibecheck on the size→template map.

**rationale:** this is the single source of truth for which templates are in which size. the snapshot makes changes visible in PR diffs.

## regression check

| concern | status |
|---------|--------|
| output format degraded? | no - same tree structure |
| error messages less helpful? | no - no error messages changed |
| timestamps/ids leaked? | no - no dynamic values |
| extra output added? | no - output reduced (correct) |

## summary

all snapshot changes are intentional:
1. acceptance snapshots reflect medi (default) size - excludes mega-only templates
2. new unit test snapshot captures the size→template map
3. no regressions detected
4. changes match vision and blueprint specifications

the key insight: **verification templates (5.3) are NOT in any size level**. this was explicit in the vision, and the snapshots correctly reflect this decision.
