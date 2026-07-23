# ref: self-review prune inventory [proposal] v1

> a prune plan for the init.behavior self-reviews, grounded in the corpus grade
> (75 routes · 832 reviews · 25% genuine-gain / 68% genuine-noop / 6% feigned-noop).
> source data: `refs/ref.selfreview-utility.[analysis].v1.md`.

---

## .how to read this

each row carries the corpus grade for a slug:

- **fired** — count of graded windows across all 75 routes
- **gain%** — share the brain called `genuine-gain` (real edit or real catch)
- **feign%** — share the brain called `feigned-noop` (promised without a true look)
- **verdict** — cut / reword / merge / keep, with rationale

a low gain% alone is **not** a cut signal — a verification safety-net that correctly
finds no gap is a genuine-noop, not noise. the cut signal is **low gain% AND a peer
reviewer already covers the concern** (so the self-review is redundant), or **high
feign% with no peer** (so the self-review is a rubber-stamp we should reword to demand
evidence).

---

## .done already (5.3 verification guard)

applied to `src/domain.operations/behavior/init/templates/5.3.verification.guard`
(11 → 8 self-reviews):

| slug | fired | gain% | feign% | action | why |
|------|------:|------:|-------:|--------|-----|
| has-play-test-convention | 26 | 0% | 12% | **cut** | zero gains corpus-wide; a pure convention check |
| has-journey-tests-from-repros | 26 | 4% | 15% | **cut** | peer `ergo-acceptance-journey-coverage` covers it |
| has-contract-output-variants-snapped | 26 | 19% | 15% | **cut** | peer `ergo-contract-snapshots` covers it |
| has-all-tests-passed | 25 | 24% | 16% | **reword** | high feign, no peer — now demands a VERBATIM pasted terminal block |
| has-fixed-all-gaps | 26 | 19% | 12% | **reword** | the closer, no peer — now demands per-gap enumeration + file/diff pointer |

---

## .blueprint focus (proposed next)

the blueprint stone (`3.3.1.blueprint.product.guard.light`, 15 self-reviews) carries a
trio of speculation-prune reviews that overlap heavily. corpus grades:

| slug | fired | gain% | feign% | note |
|------|------:|------:|-------:|------|
| has-questioned-deletables | 6 | 17% | 17% | tiny sample; overlaps yagni/backcompat |
| has-pruned-yagni | 38 | 11% | 8% | largest of the trio; mostly genuine-noop |
| has-pruned-backcompat | 39 | 10% | 3% | honest noop — low feign, low gain |
| has-consistent-mechanisms | 41 | 10% | 2% | honest noop — a stable low-yield check |

**proposal — merge the prune trio into one.** `has-questioned-deletables`,
`has-pruned-yagni`, and `has-pruned-backcompat` all ask a clone to hunt for code that
should not exist. they fire ~40 times each and land a real edit ~10% of the time, with
low feign. one merged `has-pruned-speculation` review would preserve the ~10% catch rate
at a third of the token cost. net: 15 → 13 blueprint self-reviews.

**keep as-is** — `has-consistent-mechanisms` (honest low-yield, no overlap),
`behavior-declaration-coverage` (39% gain, a top earner), `has-questioned-assumptions`
(55% gain, the second-best earner corpus-wide).

---

## .heavy / light split — recommend collapse

the blueprint guard ships two variants. a byte-diff of
`3.3.1.blueprint.product.guard.heavy` vs `.light` shows:

- **peers**: identical
- **self-reviews**: heavy adds exactly 4 — `has-questioned-5whys`,
  `has-questioned-premortem`, `has-questioned-inverse`, `has-questioned-devils-advocate`

corpus grade for those 4 extra slugs: **zero firings across all 75 routes.** they are
dead config — no route on the machine has ever selected the heavy variant, so the 4 extra
reviews have never run.

**proposal — drop the split.** delete the heavy guard, rename light → canonical, and
retire the machinery that selected between them:

1. delete `src/domain.operations/behavior/init/templates/3.3.1.blueprint.product.guard.heavy`
2. rename `…guard.light` → `…guard` (strip the suffix)
3. audit `1.vision.guard.{light,heavy}` for the same dead-config pattern
4. simplify `initBehaviorDir` + `getAllTemplatesBySize` to drop the variant select
5. retire `rule.require.guard-variant-consistency` (no variants left to keep in sync)

the risk is low: a variant nobody selects cannot regress. if heavy's 4 socratic reviews
have merit, the correct move is to fold the best one into the canonical guard, not to
strand all 4 behind an unselected flag.

---

## .summary of proposed cuts

| scope | before | after | delta |
|-------|-------:|------:|-------|
| 5.3 verification | 11 | 8 | −3 (done) |
| 3.3.1 blueprint | 15 | 13 | −2 (merge prune trio) |
| heavy/light split | 2 variants | 1 canonical | −1 dead guard |

net: fewer reviews, same catch rate, less token cost per route, one less config axis to
maintain.

## .next step

await approval before the blueprint merge or the heavy/light collapse — both touch guard
templates that every future route inherits.
