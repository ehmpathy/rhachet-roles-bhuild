# F1 — terseness severity: blocker or nitpick

**rework** = clean · **status** = 🔴 **CLOSED** — dissolved, 2026-09-07 · **confidence** = 62% → **91%**

## 🔴 it was never a fork — the directive decides the severity

`rules101.structure` fixes it: `forbid`/`require`/`always` → **blocker** · `avoid`/`prefer` →
**nitpick**. and the directive follows from whether the rule grades a **state** or an **act**.

⇒ so *"what severity?"* is the wrong question. **"what does this rule grade?"** is the right one,
and it answers per rule rather than once for the cluster:

| the rule | grades | directive | severity |
|---|---|---|---|
| `forbid.subversive-prose` | **presence** — is there a settleable claim? binary | forbid | 🔴 **blocker** |
| `forbid.chronological-accretion` | a time-ordered log — grep-detectable | forbid | 🔴 **blocker** |
| `prefer.dense-prose` | *"these 40 lines say what 6 would"* — a judgment of **degree** | prefer | **nitpick** |

🔴 **the third is a nitpick on purpose, and it is the load-central call.** a density reviewer at
blocker grade becomes a **deletion mandate** and destroys the signal it exists to protect — the trap
#351 names and `case=003` demos.

✅ **and this conforms to precedent rather than a fresh scheme.** the extant `lang.prose/` rules
already grade exactly this way: `require.brevity` and `forbid.rambles` are blockers;
`prefer.short-sentences` is a nitpick.

## the deadlock mitigation, and #363 confirms its bound

a blocker-grade prose gate can deadlock a route. the escape is the `.taken` `[REFUTE]` **with cited
evidence** — `case=003` demos it, and `rule.always.converge-with-reviewers.via-a-taken-per-point`
requires the citation.

🟡 **bhuild#363 names the bound**: a `.taken` converges a lane whose objection is an **argument**,
never one whose objection is **absent coverage**. a prose objection is argument-shaped
(*"this passage is bloat"* → *"no, `timeless-lessons` exempts a dispute record"*), so the escape
holds for these three lanes.

⇒ **the residual 9%**: the `prefer.dense-prose` rule must name its own false-positive list in its
body, or a driver has no ground to refute from. that requirement is stated in the handoff and is the
telepath's to honor.

---

🟡 **the original branch analysis is preserved below, unrevised.** it argued the tradeoff correctly
and simply never read the directive taxonomy, which settles it mechanically.

## the fork

does a terseness defect **block** a stone, or merely count against the nitpick budget?

| branch | for | against |
|--------|-----|---------|
| **blocker** | the source rules declare it: `rule.require.brevity`, `rule.forbid.rambles`, and `rule.forbid.chronological-accretion` are each **blocker** in mechanic and architect. a nitpick-grade gate is the status quo that produced 148 accretion sites across 17 artifacts | halts stones on prose. "too wordy" is a judgment call, and a blocker-grade judgment call can deadlock a route |
| **nitpick** | cannot deadlock. the `reviewed?` judge already allows 7 nitpicks, so a prose lane costs near-zero | the extant nitpick budget is shared. prose nitpicks would crowd out substantive ones, and a lane with no teeth is the gap #351 opened |

#351 hands this decision over by name: *"one judgment is genuinely yours."*

## what i took, and why at the time

**split by defect class, not one severity for the lens:**

- **accretion → blocker.** it is mechanically detectable (`/^#{2,3} .*\bi\d{3}\b/`, a grep for
  *"an earlier draft"*), so it is a fact rather than a judgment. a blocker on a fact cannot deadlock.
- **brevity + rambles → the extant nitpick budget.** these are judgment calls. a blocker here is the
  deadlock risk, and the self review already catches most of it upstream.
- **the self review is blocker-grade by nature** — `rule.always.bear-every-self-review` admits no
  overrule — and it carries zero halt risk, because the driver simply answers it.

this places the teeth where the evidence is objective and the leverage where it is highest.

## why 62%

it **diverges from the source severities**, which is not a move to make quietly.
`rule.forbid.rambles` declares blocker in two role clusters, and i effectively demote it inside the
behaver gate.

my defense is that the mechanic rule governs *code prose*, where an author is one edit from a fix,
while a behaver gate governs *a stone that may hold a whole route*. the cost of a false blocker
differs by an order of magnitude. i believe that, and i cannot prove it from the rules alone.

🟡 a second-order risk: if the peer lane points `--rules` at `lang.prose/*.md` directly, the rubric
carries its own declared severities and i cannot demote without a behaver-local rubric — which
re-opens F3. the split above may force a rubric i would otherwise not write.

## where

- the peer lane `--rules` glob and the `--allow-nitpicks` value on every guard that gains prose review
- `1.vision.guard.{light,heavy}`, `3.3.1.blueprint.product.guard.{light,heavy}`,
  `5.1.execution.*.guard`, `5.3.verification.guard`

## the verdict

_(open — for the council)_
