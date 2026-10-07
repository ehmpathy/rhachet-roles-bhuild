# define.invariant.crew.revive-is-incomplete-without-a-nudge

## .what

a REVIVE restores a husk's conversation but lands the clone IDLE at a prompt — it does not
resume the interrupted turn. a revive is INCOMPLETE until the clone is NUDGED to continue:
restore, then say "go". a revive that ends at "✅ revived" with no nudge hands back a clone
that is alive, addressable, and parked.

## .kind

**nature.** `claude --continue` reloads the transcript and returns to a prompt; it does not
re-issue the last turn. that is cli behavior, not a choice we made — so a restored clone stays
at a prompt by construction, and the nudge is what converts a restored box into a working one.

## .invariant

```
revive(clone)  =  reboot + resume + NUDGE-to-continue
```

the third term is not optional:

```
reboot + resume, no nudge  ⟹  clone is ALIVE but PARKED  (revived, not at work)
```

## .why

- a restored clone reads as a fresh wedge — an idle ❯ box, still, the exact frame a park, an
  orphan, and an idle clone all share. the operator cannot tell "stands by for go" from "wedged
  again" without a pane read, and the poll's timer climbs on it as on any halt
- the expensive half is already paid — the reboot + resume restored a conversation worth
  keeping; to leave it parked is to pay the whole cure and collect none of the work
- the nudge is a sanctioned tool cure, not a steer — `rule.require.nudge-parked-clones`
  authorizes it; the "go" after a revive is that nudge, issued by the tool

## .the litigation

a revived tree ran one turn, wrote one artifact, then froze at an idle box — the heal routine
verified the live box and returned "✅ revived" with no nudge, so the clone drew a turn and
parked. the cure was half-done: restored, never told to continue.

## .the counter-argument

"a resumed clone should pick up where it left off — a nudge is redundant" is false for
`--continue`, which returns to a prompt and stays there; the nudge carries the whole difference
between revived-and-at-work and revived-and-parked.

## .what would overturn it

claude's `--continue` starts to auto-resume the interrupted turn (then the restore alone lands
a clone at work) · a revive used where the interrupted work is genuinely complete (the nudge
has no work left to drive, but a bare "continue and drive your route" is still harmless).

## .scope

covers `__crew_heal_revive` — the reboot+resume cure for a husk. does not cover a NUDGE cure
(transient 429 / stale cap, which already IS the "go"), nor an auth.swap.

## .enforcement

- a revive that returns "✅ revived" with no nudge-to-continue = a heal defect
- a revived clone found idle later, its interrupted work unresumed, with no nudge on record = a
  supervisor miss
- a NUDGE cure given a second nudge after the revive = a false positive

## .see also

- `rule.require.nudge-parked-clones.md` — the sanctioned nudge this instances
- `define.invariant.crew.husk.discriminator-parity.md` — one husk cure, no divergence
- `rule.forbid.byhand-fix-that-burns-the-live-proof.md` — why the restored conversation is worth
  the nudge
- `__crew_heal_revive` (work/crewwork.sh) — the cure
- `rule.always.clamp-the-production-defect-you-just-saw.md` — the reflex this fired

---

written by human + beaver 🦫
