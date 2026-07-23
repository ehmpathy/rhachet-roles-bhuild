# ref: self-review utility — corpus analysis v1

> a long-term record of how each init.behavior self-review slug performs across the
> whole machine corpus, so we can tune (keep / cut / reword) the guard templates with
> evidence, not vibes. produced by `rhx reflect.selfreviews` on 2026-07-15.

## .corpus

- swept `~/.claude/projects/*/*.jsonl` — **154 projects · 988 transcripts · 0 skipped**
- **75 route runs**, **832 self-reviews promised**
- **FULLY GRADED** — every review graded by real fireworks/deepseek, corpus-wide

## .headline

**832 reviews: 25% genuine-gain · 68% genuine-noop · 6% feigned-noop.**

the self-review system is broadly honest — only 6% are rubber-stamps. two-thirds are
genuine-noops (looked, correctly found no gap), a quarter are real gains. the tune
question is NOT "is it noise" (mostly it isn't) but "which slugs are pure noop with a peer
equivalent" (redundant) and "which have an above-average feigned share" (tighten the prompt).

## .full corpus grade — all slugs (real brain, 832 reviews)

sorted by gain-rate desc. feigned-rate is the tighten/cut signal; gain-rate the value signal.
(low-sample `*` = <10 count, indicative only.)

| slug | count | 🟢 gain | 🟡 noop | 🔴 feigned | gain-rate | feigned-rate |
|------|--------:|-------:|-------:|----------:|----------:|-------------:|
| has-questioned-questions | 51 | 40 | 10 | 1 | **78%** | 2% |
| has-behavior-declaration-coverage* | 3 | 2 | 1 | 0 | 67%* | 0% |
| has-behavior-declaration-adherance* | 3 | 2 | 1 | 0 | 67%* | 0% |
| has-role-standards-adherance* | 3 | 2 | 1 | 0 | 67%* | 0% |
| has-role-standards-coverage* | 3 | 2 | 1 | 0 | 67%* | 0% |
| has-questioned-assumptions | 56 | 31 | 22 | 3 | **55%** | 5% |
| has-thorough-test-coverage* | 6 | 3 | 1 | 2 | 50%* | 33%* |
| has-journey-acceptance-test* | 5 | 4 | 0 | 1 | 80%* | 20%* |
| has-research-citations* | 5 | 4 | 0 | 1 | 80%* | 20%* |
| behavior-declaration-coverage | 33 | 13 | 18 | 2 | **39%** | 6% |
| role-standards-adherance | 36 | 12 | 23 | 1 | **33%** | 3% |
| role-standards-coverage | 37 | 12 | 24 | 1 | **32%** | 3% |
| has-grounded-in-reality | 47 | 14 | 32 | 1 | **30%** | 2% |
| has-consistent-conventions | 42 | 12 | 28 | 2 | **29%** | 5% |
| has-proper-directory-decomposition* | 3 | 1 | 2 | 0 | 33%* | 0% |
| has-all-tests-passed | 25 | 6 | 15 | 4 | 24% | **16%** |
| has-questioned-requirements | 48 | 11 | 36 | 1 | 23% | 2% |
| has-contract-output-variants-snapped | 26 | 5 | 17 | 4 | 19% | **15%** |
| has-fixed-all-gaps | 26 | 5 | 18 | 3 | 19% | 12% |
| behavior-declaration-adherance | 31 | 5 | 26 | 0 | 16% | 0% |
| has-behavior-coverage | 24 | 4 | 19 | 1 | 17% | 4% |
| has-questioned-deletables* | 6 | 1 | 4 | 1 | 17%* | 17%* |
| has-zero-test-skips | 24 | 3 | 20 | 1 | 12% | 4% |
| has-pruned-yagni | 38 | 4 | 31 | 3 | 11% | 8% |
| has-consistent-mechanisms | 41 | 4 | 36 | 1 | 10% | 2% |
| has-pruned-backcompat | 39 | 4 | 34 | 1 | 10% | 3% |
| has-snap-changes-rationalized | 27 | 3 | 22 | 2 | 11% | 7% |
| has-critical-paths-frictionless | 27 | 1 | 24 | 2 | 4% | 7% |
| has-ergonomics-validated | 27 | 1 | 23 | 3 | 4% | **11%** |
| has-journey-tests-from-repros | 26 | 1 | 21 | 4 | 4% | **15%** |
| has-preserved-test-intentions | 24 | 0 | 23 | 1 | **0%** | 4% |
| has-play-test-convention | 26 | 0 | 23 | 3 | **0%** | 12% |
| has-zero-deferrals | 5 | 0 | 5 | 0 | 0%* | 0% |
| (7 rare 1-count slugs) | 1 ea | — | — | — | — | — |

### how to read the grade

- **top value**: `has-questioned-questions` (78% gain!) and `has-questioned-assumptions` (55%)
  are the two crown jewels — they reshape the plan. do NOT touch.
- **honest workhorses**: the mid-table execution/blueprint slugs (role-standards, behavior-
  declaration, grounded-in-reality, consistent-conventions) all gain 29–39% with <6% feigned.
  solid keepers.
- **highest feigned share** (the tighten/cut list): `has-all-tests-passed` 16%,
  `has-contract-output-variants-snapped` 15%, `has-journey-tests-from-repros` 15%,
  `has-play-test-convention` 12%, `has-fixed-all-gaps` 12%, `has-ergonomics-validated` 11%.
- **pure-noop, zero-gain**: `has-play-test-convention` (0 gain in 26) + `has-preserved-test-
  intentions` (0 gain but ~96% genuine, honest safety-net).

## .how to read this

two very different measures, do NOT conflate them:

| measure | source | what it means | blind spot |
|---|---|---|---|
| **edit-rate** | plan mode, deterministic | how often the review left an artifact edit | a correct genuine-noop edits no file; verification slugs floor near 0 by nature |
| **grade** | apply mode, cheap brain reads the articulation | genuine-gain / genuine-noop / feigned-noop | probabilistic; cross-session drop can false-positive a feigned |

edit-rate is a **lower bound on value**, not value itself. the **feigned share** (from the
grade) is the real cut-signal: a high feigned share = the reviewer genuinely did not look.

---

## .full slug table (all 41, plan-scan edit-rate)

sorted by edit-rate desc. `edited/firings` = deterministic gain footprint.

| slug | stone(s) | firings | edited | edit-rate |
|------|----------|--------:|-------:|----------:|
| has-questioned-questions | vision, blueprint | 51 | 41 | **80%** |
| has-clear-instructions | (rare) | 1 | 1 | 100%* |
| has-research-citations | blueprint | 5 | 5 | 100%* |
| has-journey-acceptance-test | blueprint | 5 | 4 | 80%* |
| has-questioned-assumptions | vision, blueprint | 56 | 25 | **45%** |
| has-thorough-test-coverage | blueprint | 6 | 3 | 50%* |
| has-behavior-declaration-coverage | blueprint | 3 | 2 | 67%* |
| has-behavior-declaration-adherance | blueprint | 3 | 2 | 67%* |
| has-role-standards-adherance | blueprint | 3 | 2 | 67%* |
| has-role-standards-coverage | blueprint | 3 | 2 | 67%* |
| role-standards-adherance | execution, blueprint | 36 | 13 | **36%** |
| role-standards-coverage | execution, blueprint | 37 | 13 | **35%** |
| behavior-declaration-coverage | execution, blueprint | 33 | 11 | **33%** |
| has-proper-directory-decomposition | blueprint | 3 | 1 | 33%* |
| has-grounded-in-reality | vision | 47 | 13 | **28%** |
| has-consistent-conventions | execution, blueprint | 42 | 10 | **24%** |
| has-questioned-requirements | vision | 48 | 8 | **17%** |
| has-questioned-deletables | blueprint | 6 | 1 | 17%* |
| behavior-declaration-adherance | execution, blueprint | 31 | 5 | **16%** |
| has-pruned-yagni | execution, blueprint | 38 | 6 | **16%** |
| has-contract-output-variants-snapped | verification | 26 | 4 | **15%** |
| has-behavior-coverage | verification | 24 | 3 | **13%** |
| has-consistent-mechanisms | execution, blueprint | 41 | 5 | **12%** |
| has-fixed-all-gaps | verification | 26 | 3 | **12%** |
| has-pruned-backcompat | execution, blueprint | 39 | 4 | **10%** |
| has-all-tests-passed | verification | 25 | 2 | **8%** |
| has-journey-tests-from-repros | verification | 26 | 2 | **8%** |
| has-snap-changes-rationalized | verification | 27 | 2 | **7%** |
| has-zero-test-skips | verification | 24 | 1 | **4%** |
| has-critical-paths-frictionless | verification | 27 | 1 | **4%** |
| has-ergonomics-validated | verification | 27 | 1 | **4%** |
| has-preserved-test-intentions | verification | 24 | 0 | **0%** |
| has-play-test-convention | verification | 26 | 0 | **0%** |
| has-zero-deferrals | blueprint | 5 | 0 | 0%* |
| has-complete-implementation-record | evaluation | 1 | 0 | 0%* |
| has-divergence-analysis | evaluation | 1 | 0 | 0%* |
| has-divergence-addressed | evaluation | 1 | 0 | 0%* |
| has-no-silent-scope-creep | evaluation | 1 | 0 | 0%* |
| has-vision-coverage | (rare) | 1 | 0 | 0%* |
| has-edgecase-coverage | (rare) | 1 | 0 | 0%* |
| has-acceptance-test-citations | (rare) | 1 | 0 | 0%* |
| has-self-run-verification | (rare) | 1 | 0 | 0%* |

`*` = low sample (<20 firings); rate is indicative, not reliable.

---

## .graded slice — 5.3.verification (real brain, 281 reviews)

the whole stone: **9% genuine-gain · 81% genuine-noop · 10% feigned-noop**. a verification
review that mostly confirms is working as designed — edit-rate is the WRONG yardstick here,
the feigned share is the one that matters.

| slug | firings | 🟢 gain | 🟡 noop | 🔴 feigned | feigned-rate | read |
|------|--------:|-------:|-------:|----------:|-------------:|------|
| has-journey-tests-from-repros | 26 | 1 | 20 | 5 | **19%** | highest feigned |
| has-contract-output-variants-snapped | 26 | 4 | 18 | 4 | **15%** | |
| has-all-tests-passed | 25 | 7 | 15 | 3 | 12% | |
| has-fixed-all-gaps | 25 | 3 | 19 | 3 | 12% | |
| has-play-test-convention | 26 | 0 | 23 | 3 | 12% | 0 gains ever |
| has-critical-paths-frictionless | 27 | 1 | 23 | 3 | 11% | |
| has-ergonomics-validated | 27 | 1 | 23 | 3 | 11% | |
| has-zero-test-skips | 24 | 2 | 20 | 2 | 8% | |
| has-snap-changes-rationalized | 27 | 2 | 23 | 2 | 7% | |
| has-preserved-test-intentions | 24 | 0 | 23 | 1 | **4%** | ~96% genuine |
| has-behavior-coverage | 24 | 4 | 20 | 0 | **0%** | cleanest |

### key finds

- **`has-preserved-test-intentions`** — 0 edits, yet ~96% genuine-noop. it audits the test
  diff for silently-weakened assertions, confirms none, correctly leaves the tests as-is. a
  prevention review, NOT noise. its lone feigned is on `fix-behavior-selfreviews` (this
  route, cross-session drop) — a false positive.
- **`has-behavior-coverage`** — 0% feigned across 24: the cleanest verification review.
- **the brain's gain sometimes exceeds the deterministic edit count** (e.g. `has-all-tests-passed`
  7 gain vs 2 edited) — it credits gains whose fix landed just outside the window (chain smear).
  read gain counts as approximate, feigned counts as the reliable cut-signal.

---

## .graded slice — blueprint (samples)

- `fix-review-peer-measurement` (15 reviews): **73% gain / 27% noop / 0% feigned** — blueprint
  is where a lot of real reshaping happens.
- `fix-mutex-writes` (15 reviews, all 0-edit): **13% gain / 87% noop / 0% feigned** — a
  0-edit route the brain still grades as almost-all-genuine (careful audits of an already-right spec).

---

## .known measurement caveats (v1)

1. **cross-session articulation drop** — a review whose `--as promised` and articulation Write
   land in different session files reads as `articulation: null` → false feigned-noop. seen on
   `fix-behavior-selfreviews` (self) + `feat-search-magnets` (all 8 blueprint articulations = 0
   chars). fix: read the articulation from `<route>/review/self/` on disk. until then, treat a
   feigned verdict on a heavily-compacted route with suspicion.
2. **read-signal is route-dir scoped** — an execution/verification review of `src/` code never
   registers a read (the file is not under the route dir). so `read = ·` is uninformative for
   those stones; do not infer "did not look" from it.
3. **edit-attribution smear** — chained windows credit an edit to whichever review closes the
   window, so a catch-and-fix-a-beat-later review under-scores on edit-rate.

---

## .refresh command

```sh
# deterministic edit-rate over the whole machine (cheap, no brain)
rhx reflect.selfreviews --mode plan --into <path>

# graded genuine/noop/feigned for one stone (real brain, ~1 call per review)
rhx reflect.selfreviews --stone 5.3.verification --mode apply --into <path>

# whole corpus graded (heavy — ~832 brain calls)
rhx reflect.selfreviews --mode apply --into <path>
```
