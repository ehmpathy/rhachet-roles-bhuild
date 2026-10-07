# surgoal.polish-the-supervisor-and-prioritizer-tools

## .what

> **every defect you find in a supervisor or prioritizer tool is cured IN THE TOOL and
> CLAMPED by a test that reproduces the exact case — before the tick moves on. accumulate
> and clamp the cases you see in production. this is the single most important objective.**

this is a **surgoal** — a target carried on every tick, never completed, never closed. no task
names it, no gate fires it; a supervisor holds it the way it holds the fleet: a permanent fact
about the job.

⚠️ `surgoal` as a word now also names a tree relation (the goal one rung up in a
decomposition) in prioritizer contracts. the kind this brief describes is distinct and is owed
its own word eventually (best guess `evergoal`); until renamed, read "surgoal" here as this
permanent-target sense, not the tree relation.

the tools it governs:

- **the supervisor tools** — `git.crew.*`, `git.grove.*`, and the substrate beneath them
  (`duct.*`, `term.*`), the ledger, the pane classifiers
- **the prioritizer tools** — `rhx eco.priority` and the sponsorship + rank machinery that
  decides which tree the fleet spends its next nudge on

## .the most important objective — accumulate and clamp production cases

a tool defect seen in production is the most valuable bug report there is: real, reproducible,
already paid for. the moment you see one, capture it forever:

1. **reproduce** the exact case — the verbatim pane, ledger row, or rank input — as a fixture
2. **watch it fail** under the un-fixed tool (the clamp must have teeth — `rule.require.clamp-edge-cases`)
3. **cure it IN THE TOOL** — never by hand (`rule.forbid.byhand-heal`), never by a route around
   it (`rule.always.fix-the-verb-that-left-you-the-gap`)
4. **re-run** — watch it pass
5. only then does the tick move on

a fix with no clamp is a lesson lost — the same defect returns on the next refactor. a clamp
with no teeth guards naught. the accumulated corpus of clamped production cases is the tool's
memory of every way it has been wrong; to grow that corpus is the job.

## .accrue the corpus from real captures — clamp right verdicts too

every real pane a classifier judges — right or wrong — is a fixture worth a clamp, because a
correct verdict today regresses on the next detector edit with zero signal. capture real
stdout as log files, never hand-typed strings:

```sh
rhx git.crew.read --tree <t> --who <role> | rhx teesafe .agent/…/work/.test/.assets/pane.<slug>.log
```

a test then reads the asset via `readFileSync(join(__dirname, '.test/.assets/…'))` and asserts
the verdict the tick relied on (`rule.always.clamp-the-verbatim-pane-your-classifier-judged`).
the corpus reaches toward coverage of the real noise distribution, one captured pane at a time.

## .why — a missed detection renders a confident WRONG verdict

the supervisor tools do not fail loud; they render a clean, confident verdict about the wrong
state — a transient-429 wedge read as `😶 at work`, a husk read as healthy, a stale cap read as
live. the recurrence of the same class of miss across incidents is itself the defect: a
sponsored clone sits idle across ticks, and the only signal is a human who finds it hours
later. so the cure is a permanent clamp, never a re-diagnosis each time.

## .the bias — false-detect is cheap, a miss is dear

| the error | what it costs |
|---|---|
| a false detect (nudge a healthy box) | one message into a live pane — benign, self-corrects |
| a miss (heal-worthy wedge read as healthy) | a sponsored clone idle for hours, found only by a human |

when the classifier is unsure, bias to detect — the cost runs entirely one way.

## .the bound — a defect, never churn

the target is a defect: a tool that renders the wrong verdict, or leaves you to finish its job
by hand. it is not a rank judgment you disagree with, a tool that renders the right verdict a
little slower, or a guess dressed as a tune (a change with no measured before-and-after).

## .enforcement

- a tool defect seen in production, worked around and left un-clamped = **blocker**
- a fix with no regression clamp = **blocker** (`rule.require.clamp-edge-cases`)
- a clamp that passes under the un-fixed tool (no teeth) = **blocker**
- a wedge cured by hand instead of in the tool = **blocker** (`rule.forbid.byhand-heal`)
- a classifier biased toward miss rather than detect = **blocker**
- a rank judgment or micro-optimization filed as a tool defect = **false positive**

## .see also

- `rule.always.clamp-the-production-defect-you-just-saw.md` — the enforceable reflex this surgoal fires
- `rule.require.clamp-edge-cases` (ehmpathy/mechanic) — the clamp with teeth, proven red-then-green
- `rule.forbid.byhand-heal.md` — the cure lives in the tool, never in fingers
- `rule.always.fix-the-verb-that-left-you-the-gap.md` — a tool gap is closed, never routed around
- `rule.always.entool-the-skills-you-touch` (bhrain/learner) — a step finished by hand is a tool defect
- `rule.always.cure-detected-defects-same-tick.md` — the tick does not move past a found defect
- `define.invariant.crew.ratelimit.healable-transient.md` — the four rate-limit states the classifier must tell apart
- `surgoal.squeeze-the-grove.md` — the peer surgoal; that one targets waste, this targets tool correctness
- `sandpine-notebook`'s `define.purpose.md` — why that fleet exists at all; stays out-of-package

---

written by human + beaver 🦫
