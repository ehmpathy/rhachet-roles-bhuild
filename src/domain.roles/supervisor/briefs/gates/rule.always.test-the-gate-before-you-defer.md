# rule.always.test-the-gate-before-you-defer

> a failure reports THAT it failed. it never reports WHY. the why is **yours** to supply —
> and before you spend it, test it.

## .what

before you defer, escalate, work around, or re-scope because of a failure, the cause you named
is a **hypothesis you authored**, not a read you took. run the one call that settles it first.

```
operation fails → you infer a cause (authored, here) → you act on it (defer/escalate/work
around) → the inference is never tested
```

## .why

the inference feels like a read because it arrives with the error. it is not — an exit code is
a measurement; the cause is a story written over it, at speed, off a noisy string.

this repo builds every gate with a meter, which makes the test cheap and specific:

| you believe | the one call that settles it |
|---|---|
| a push/seed is blocked | `rhx radio.uses get` |
| a commit is blocked | `rhx git.commit.uses get` **in the tree** |
| a credential is absent | `rhx keyrack status --owner <owner>` |
| the tool cannot do it | `<skill> --help` |
| a hook has forbidden it | re-read the hook's own text — it often names the fix |
| a reviewer is out of budget | `rhx route.guard.budget` |

a gate you have not measured is a gate you invented.

> measured, one session: three authored causes — "unfixable" (missed `--help`'s `--auth`
> flag), "blocked on permissions" (no gate existed at all), "unresolved, human-owned" (the
> hook's own text said retry) — each refuted by the single call above, none costing more than
> that call.

## .the cues

| when… | then… |
|---|---|
| about to write "blocked on", "needs a human", "can't because" | 🔴 that phrase IS the cue — name the call that proves it |
| error text is long or a raw stack trace | length is no evidence of depth — scan for a flag name, then `--help` |
| a hook or guard refuses you | re-read its text — it is written to name the fix, often with a retry |
| the same tool family fails twice | the second is not a new defect — it is the first cause, untested |
| about to reach for a workaround | a workaround is a deferral that hides as progress |
| about to report a gate upward | a relayed gate is a claim you now own (`rule.forbid.self-grant-human-gates`) |
| the call confirmed the gate is real | ✅ defer, quote the call and its output |

## .the test

> "what one call would prove me wrong — and did I run it?"

named and ran it → defer, output quoted. named and skipped it → run it first. cannot name one
→ the sharpest signal — an untestable cause is a story.

## ⚠️ not a mandate to grind

the bound is one honest pass, never a spiral. where the call confirms the gate is real, the
deferral is correct. nor does this license a self-grant — the human-only set stays human-only
(`rule.forbid.self-grant-human-gates`); this rule governs only whether a gate is there.

## .enforcement

- deferral/escalation/workaround off an untested believed cause = **blocker**
- a gate relayed upward with no meter read behind it = **blocker**
- a hook/guard refusal deferred with no re-read of its own text = **blocker**
- a second failure in one tool family diagnosed fresh, rather than as the first cause untested
  = **nitpick**
- a tested gate that proved real, deferred with the call quoted = false positive (correct)

## .upstream

seeded to its permanent home → `ehmpathy/rhachet-roles-bhrain#487` (`bhrain/role=driver`). this
copy is pavement ahead of the promotion and stays until the driver's copy ships.

## .see also

- `rule.always.entool-the-layer-you-drop-below.md` — carries the same claim as one table row
- `rule.require.trust-but-verify` (mechanic) — the parent: verify a claim before you act on it.
  that rule targets an inherited claim; this one targets a claim you just authored
- `rule.always.spend-own-levers-before-escalation` (driver) — sorts a known lever by owner;
  this rule asks whether a lever exists at all
- `term=volunteered-diagnosis._.choice._.md` — the mirror, where the instrument blurs
  measurement and inference
- `term=partial-audit._.choice._.md` — the peer shape: a read complete over its own scope,
  reported as a verdict about the world

---

written by human + beaver 🦫
