# self-review: has-pruned-backcompat (round 3)

## review of: 3.3.1.blueprint.product.v1.i1.md

review for backwards compatibility that was not explicitly requested.

---

## concern 1: findsert semantics preservation

**blueprint says:** "findsert semantics preserved (files kept on re-init)"

**was this explicitly requested?**
- vision mentions findsert in criteria section: "findsert semantics preserved"
- wisher did NOT explicitly ask for findsert preservation

**is there evidence it's needed?**
- findsert is the current behavior of initBehaviorDir
- blueprint says "no changes to findsert logic"
- this is not new backcompat - it's preserved behavior

**verdict:** ✅ not backcompat concern - this is retainment of current behavior, not new backcompat code

---

## concern 2: --guard remains optional

**blueprint says:** initBehaviorDir input has `guard?: 'light' | 'heavy'`

**was this explicitly requested?**
- --guard is pre-behavior (already part of init.behavior)
- blueprint does not change --guard behavior
- vision says --size and --guard are "orthogonal"

**verdict:** ✅ not backcompat concern - no change to --guard

---

## concern 3: medi as default

**blueprint says:** `const sizeLevel = input.size ?? 'medi'`

**was this explicitly requested?**
- yes, wisher confirmed "medi is the right default"
- vision question #1 was [answered]: medi is default

**verdict:** ✅ explicitly requested - not unasked backcompat

---

## concern 4: template file names preserved

**blueprint says:** template names like `1.vision.stone` remain unchanged

**was this explicitly requested?**
- not explicitly, but no request to rename either
- blueprint adds new templates, does not rename extant ones

**exception:** `.ref.[feedback]...` → `refs/template.[feedback]...`
- this IS a rename
- vision explicitly shows this path: "refs/template.[feedback].v1.[given].by_human.md"
- this is an intentional change, not backcompat

**verdict:** ✅ no unasked backcompat - names preserved because no change requested

---

## concern 5: giga = mega equivalence

**blueprint says:** "giga = mega (same stones, signals decomposition expected)"

**was this explicitly requested?**
- vision says giga signals "decomposition expected"
- wisher question #2 was [answered]: giga is reserved for future expansion
- no special giga behavior was requested

**is this backcompat?**
- no - giga is new, not a backcompat shim
- giga with mega templates is simplest implementation

**verdict:** ✅ not backcompat - new feature with minimal implementation

---

## scan for hidden backcompat

**patterns that indicate unasked backcompat:**
- "for backwards compatibility" comments
- migration paths
- deprecated parameter support
- shim layers
- version checks

**blueprint scan:**
- no "backwards compatibility" text
- no migration code
- no deprecated parameters
- no shims
- no version checks

**verdict:** ✅ no hidden backcompat found

---

## summary

| concern | backcompat? | verdict |
|---------|-------------|---------|
| findsert preservation | no | retains current behavior |
| --guard optional | no | pre-behavior, unchanged |
| medi default | no | explicitly requested |
| template names | no | no change requested |
| giga = mega | no | new feature, minimal impl |
| hidden backcompat | no | none found |

**conclusion:** blueprint contains no unasked-for backwards compatibility code or concerns.
