# self-review: has-preserved-test-intentions (r4)

## deeper reflection

the guide accuses me of potential "malicious deception" or "reckless negligence" if I changed test intentions. let me prove I did neither.

## snapshot diffs analyzed

the 6 snapshot changes all have the same pattern:

**before:**
```
├─ + 5.2.evaluation.v1.guard
├─ + 5.2.evaluation.v1.stone
├─ + 5.3.verification.v1.guard
├─ + 5.3.verification.v1.stone
├─ + 5.5.playtest.v1.guard
```

**after:**
```
├─ + 5.2.evaluation.v1.guard
├─ + 5.2.evaluation.v1.stone
├─ + 5.5.playtest.v1.guard
```

the 5.3.verification templates are no longer output.

## was this intentional?

**vision says:**
```
medi (adds):
├── 2.3.criteria.blueprint.stone
├── 3.1.1.research.external.product.access._.v1.stone
├── 3.1.5.research.reflection.product.premortem._.v1.stone
├── 3.1.5.research.reflection.product.rootcause._.v1.stone
├── 3.1.5.research.reflection.product.audience._.v1.stone
├── 3.2.distill.repros.experience._.v1 (.stone + .guard)
└── 5.5.playtest.v1 (.stone + .guard)
```

verification (5.3) is NOT listed in medi. it is NOT listed in any size level.

## did the old test know a truth I'm now hidden?

**question:** did the old snapshot reflect correct behavior that I now break?

**answer:** no. the old snapshot was wrong. it showed verification templates in medi output, but:
1. verification templates exist in the templates directory
2. but they were never assigned to any size level in the vision/blueprint
3. the old code included ALL templates regardless of size (no size filter)
4. the new code filters by size, correctly to exclude unassigned templates

the "truth" the old test knew was: "init.behavior outputs these templates". but that truth was incomplete — it did not account for size-based filter.

## requirements changed

| requirement | before | after |
|-------------|--------|-------|
| template selection | all templates | templates filtered by size |
| default size | n/a | medi |
| verification at medi | yes (implicit) | no (per vision) |

the change is documented in:
- 0.wish.md: "which stones are included on boot"
- 1.vision.md: size → stones map (verification absent)
- 3.3.1.blueprint.product.v1.i1.md: BEHAVIOR_SIZE_CONFIG

## conclusion

I did not weaken assertions or hide defects. I updated snapshots to reflect a new feature's intended behavior, as documented in the wish/vision/blueprint. the old snapshots were not "wrong" — they tested the old behavior. the new snapshots test the new behavior.

this is a requirements change, not a cover-up.
