# rule.forbid.byhand-fix-that-burns-the-live-proof

## .what

> when a tool leaves its job half-done on a LIVE instance of a defect, do not finish that
> instance by hand. fix the TOOL, then let the fixed tool cure the live instance — the
> successful cure IS the proof. a by-hand completion spends the one field reproduction that
> would have proven the repair, and leaves the tool's defect unverified.

a sharper twin of `rule.always.entool-the-skills-you-touch`: that rule says the leftover step
belongs inside the tool; this adds why the leftover step is precious — the live instance is
your proof-fixture, and it is single-use.

## .why — two harms

1. **the entool violation** — you finished by hand what the tool should finish.
2. 🔴 **you spent the proof.** a live instance of a tool defect is rare and costly to produce —
   it is the one case that tests a fixed tool against reality, not a synthetic clamp. clear it
   by hand and it is gone; the repair can only be checked against a clamp you author yourself,
   and a clamp can pass while the field case fails
   (`define.invariant.crew.husk.discriminator-parity`: the banner test passed its synthetic
   clamp and failed in the field).

the asymmetry is the whole rule: a by-hand fix saves seconds now and forfeits the only
end-to-end verification the defect will ever offer.

## .the test

> "is this instance the live reproduction of a defect I am about to fix in a tool?"

yes → 🔴 do not touch it by hand. fix the tool, then cure this instance with the fixed tool.
no → normal operation.

## .the cues

| when… | then… |
|---|---|
| a tool ran, and you reach to finish its job by hand | 🔴 stop — that leftover step is both a tool defect and your proof-fixture |
| a heal/poll/send left a clone one keystroke short | fix the tool to send it; do not send it yourself on the live clone |
| you think "I'll nudge it, then fix the tool later" | the nudge spends the repro |
| the live instance is the ONLY reproduction you have | 🔴 the sharpest case — the repair becomes provable only by clamp |

## .the carve-out — capture before you spend it

if the live instance causes active harm and the tool fix is not immediate, you may triage by
hand — but capture the reproduction first: save the raw pane/state (`crew.read --raw`), record
the exact cure sequence, then clear it by hand. a captured repro is weaker than a live one but
far better than a memory of what the pane said.

## .the measured incident

a mechanic crashed `💥143`; `crew.heal` detected it correctly and its revive rebooted + sent the
resume, but the resume opened claude's interactive Resume Session picker and stopped one
keystroke short. the supervisor sent that `Enter` by hand — closing out and spending the one
field reproduction of heal's picker gap. the fixed heal can now be proven only against a
synthetic clamp.

## .enforcement

- a by-hand completion of a tool's leftover step on a live repro, tool defect unfixed =
  **blocker**
- a hand-fix with no prior capture of the reproduction = **blocker**
- a tool repair verified only by a self-authored clamp, where a live field repro existed and was
  spent by hand = **blocker**

## .see also

- `rule.always.entool-the-skills-you-touch` (bhrain/learner) — the leftover step belongs in the
  tool
- `rule.always.entool-the-layer-you-drop-below` — a supervisor finishes by tool, never by hand
- `define.invariant.crew.husk.discriminator-parity` — why a synthetic clamp can pass where the
  field fails
- `rule.require.clamp-edge-cases` (ehmpathy/mechanic) — the clamp a fix owes
- `rule.require.verify-after-send` — verify the cure landed on the instance the tool cured

---

written by human + beaver 🦫
