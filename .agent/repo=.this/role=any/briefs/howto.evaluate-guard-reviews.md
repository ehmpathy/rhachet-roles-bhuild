# howto: evaluate guard reviews

when you analyze or modify peer reviews across guard files, use comparison tables to understand coverage and identify gaps.

---

## paths matrix

compare what file types each reviewer can see:

| guard | slug | `**/*.ts` | `**/*.test.ts` | `**/*.snap` | `$route/*.blueprint.*.md` |
|-------|------|:---------:|:--------------:|:-----------:|:-------------------------:|
| **3.3.1.blueprint** |
| | mech-failhides | | | | ✓ |
| | arch-opport-decomposition | | | | ✓ |
| | arch-smell-scopeleaks | | | | ✓ |
| | arch-hazards-maintenance | | | | ✓ |
| | arch-hazards-behavior | | | | ✓ |
| | ... | | | | |
| **5.1.execution** |
| | mech-failhides | ✓ | | | |
| | arch-opport-decomposition | ✓ | | | |
| | behavior-intent-coverage | ✓ | | | |
| | ergo-friction-hazards | ✓ | | | |
| | ... | | | | |
| **5.3.verification** |
| | ergo-contract-snapshots | ✓ | | ✓ | |
| | mech-external-contracts | ✓ | | ✓ | |
| | ergo-acceptance-journey-coverage | ✓ | | ✓ | |
| | ergo-snapshot-visual-blemishes | ✓ | | ✓ | |
| | mech-given-when-then | | ✓ | ✓ | |
| | mech-test-intent | | ✓ | ✓ | |

*focused paths like `**/*.test.ts` noted in separate column

questions to ask:
- can this reviewer see the files it needs to enforce its rule?
- is the scope too narrow (lacks context) or too broad (noise)?
- do verification reviewers see both code and snapshots?

---

## rules matrix

compare what rule each reviewer enforces:

| slug | rule | repo |
|------|------|------|
| mech-failhides | `pitofsuccess.errors/rule.*.md` | ehmpathy/mechanic |
| arch-opport-decomposition | `rule.prefer.decomposable-architecture.md` | bhuild/behaver |
| arch-smell-scopeleaks | `rule.forbid.scope-leaks.md` | bhuild/behaver |
| arch-hazards-maintenance | `rule.forbid.maintenance-hazards.md` | bhuild/behaver |
| arch-hazards-behavior | `rule.forbid.behavior-hazards.md` | bhuild/behaver |
| behavior-intent-coverage | `rule.require.behavior-intent-coverage.md` | bhuild/behaver |
| ergo-friction-hazards | `rule.forbid.friction-hazards.md` | bhuild/behaver |
| ergo-contract-snapshots | `rule.require.contract-snapshot-exhaustiveness.md` | bhuild/behaver |
| ergo-acceptance-journey-coverage | `rule.require.acceptance-journey-coverage.md` | bhuild/behaver |
| ergo-snapshot-visual-blemishes | `rule.forbid.snapshot-visual-blemishes.md` | bhuild/behaver |
| mech-external-contracts | `rule.require.external-contract-integration-tests.md` | bhuild/behaver |
| mech-given-when-then | `rule.require.given-when-then.md` | ehmpathy/mechanic |
| mech-test-intent | `rule.forbid.test-intent-violations.md` | bhuild/behaver |

questions to ask:
- is each concern covered by exactly one rule?
- are rules in the right repo (ehmpathy for general, bhuild for behavior-specific)?
- do related reviewers share lineage from the same original enroll command?

---

## refs matrix

compare what context each reviewer receives:

| slug | refs summary |
|------|--------------|
| mech-failhides | (none — rules are comprehensive) |
| arch-opport-decomposition | architect `practices/*.md`, mechanic `evolvable.{architecture,procedures,domain.operations}/*.md.min` |
| arch-smell-scopeleaks | (same as arch-opport-decomposition) |
| arch-hazards-maintenance | architect `rule.require.solve-at-cause.md`, mechanic `pitofsuccess.*`, `readable.*` |
| arch-hazards-behavior | mechanic `pitofsuccess.procedures/*.md.min`, `evolvable.procedures/*.md.min` |
| behavior-intent-coverage | `$route/0.wish.md`, `$route/1.vision.yield.md`, behaver `behavior.{verification,criteria}/*.md`, mechanic `code.test/scope.coverage/*.md` |
| ergo-friction-hazards | ergonomist `*.md`, mechanic `lang.tones/*.md.min`, behaver `behavior.verification/*.md` |
| ergo-contract-snapshots | ergonomist `*.md`, mechanic `code.test/scope.coverage/*.md`, behaver `behavior.verification/*.md` |
| mech-external-contracts | mechanic `code.test/scope.coverage/*.md`, `scope.unit/rule.forbid.remote-boundaries.md` |
| ergo-acceptance-journey-coverage | ergonomist `*.md`, mechanic `code.test/frames.behavior/*.md.min`, `scope.coverage/*.md`, behaver `behavior.verification/*.md` |
| ergo-snapshot-visual-blemishes | ergonomist `*.md`, mechanic `lang.tones/*.md.min`, behaver `rule.require.contract-snapshot-exhaustiveness.md` |
| mech-given-when-then | architect `criteria.given_when_then.[seed].v3.md`, mechanic `code.test/frames.behavior/*.md.min`, `lessons.howto/*.md.min` |
| mech-test-intent | mechanic `code.test/scope.coverage/*.md`, `work.flow/refactor/rule.require.review-test-changes.md.min` |

questions to ask:
- does this reviewer have enough context to apply its rule?
- are refs that use `.md.min` efficient where full content isn't needed?
- do related reviewers share the same refs (e.g., arch-smell-scopeleaks and arch-opport-decomposition)?
- are route-specific refs (`$route/...`) included where behavioral context matters?

---

## flags checklist

all reviews should have:
- `--mode hard` — read full file contents, not just paths
- `--diffs since-main` — scope to changed files
- `--join intersect` — only review files that match both diffs and paths

---

## lineage preservation

when you migrate from `$rhachet enroll claude` to `$rhx review`:
- keep original command as `# lineage:` comment above new reviews
- one enroll may split into multiple focused reviews
- enables easy revert if brain quality insufficient
