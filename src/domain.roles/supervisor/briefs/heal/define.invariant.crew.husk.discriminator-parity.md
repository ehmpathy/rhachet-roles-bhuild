# define.invariant.crew.husk.discriminator-parity

## .what

a husk has ONE test, applied identically by the poll (detect) and heal (cure): **a mechanic at
a bare shell is a husk.** role + box, never the crash banner. the banner refines CAUSE (a
`💥143` signal-kill is safe to heal; a `^C` was a human, so surface); it is not the test for
husk-ness.

## .kind

**nature.** two facts force it: (1) a mechanic runs claude, so a bare shell prompt with no
claude `❯` box is a dead mechanic — there is no other thing it could be (a foreman is a bare
shell by design, so the test is scoped to the claude role); (2) the crash banner is not
durable — claude draws it in the terminal's alternate screen, torn down on exit, so a husk that
died cleanly or scrolled past the banner shows a bare shell with no banner at all. a
discriminator keyed on the banner cannot see the majority of husks.

## .invariant

> for a mechanic, `pane == bare shell (no ❯ claude box)` ⟺ husk — in the poll's render AND in
> heal's cure, by the SAME test. neither instrument keys husk-ness on the crash banner alone.

`git.crew.poll` renders `mechanic:shell → 💀 husk`; `git.crew.heal` treats a mechanic at a bare
shell as a husk and reboots + resumes it, whether or not the banner is still in the read
window. a defect that lets the two DIVERGE — the poll renders `💀 husk` while heal reports
"plain shell duct" and refuses to act — is the regression this invariant forbids.

## .why

- the banner is a false floor — it reads like solid evidence and is gone the instant claude
  exits, so a banner-keyed test passes its clamp (a synthetic pane with the banner) and fails
  in the field (a real pane absent it)
- detection with no cure is theater — a poll that renders `💀 husk` while the only cure verb
  refuses leaves the supervisor exactly where an undetected husk would
- measured: detection was wired to role+box; the cure was never migrated off the banner test, so
  heal fell to "likely a plain shell duct" and left a poll-flagged husk dead

## .scope

governs the husk DISCRIMINATOR and its parity across detect + cure, not the cure's mechanics
beyond — fire on the same set the poll renders. scoped to the claude role — a foreman or review
seat is a bare shell by design, not a husk. `^C` stays a surface, never an auto-heal, in both
instruments: a human typed the interrupt and may have acted on what parked it.

## .the counter-argument

auto-heal of a bare-shell mechanic risks a reboot of a mechanic a human deliberately dropped to
a shell. does not overturn the invariant: the `^C` guard surfaces a human-typed interrupt rather
than heals it; on an unattended fleet a mechanic at a bare shell is dead by default, so the safe
act is to revive it.

## .what would overturn it

if claude stopped use of the alternate screen, the banner could corroborate more often — but
role+box would still be strictly more robust, so it would still not become the test. short of
"a mechanic no longer runs claude," the role+box test stands.

## .enforcement

- `crew.heal` reports "plain shell duct" for a MECHANIC at a bare shell = **blocker** (the poll
  renders it `💀 husk`; the cure must reach it)
- the poll's husk discriminator and heal's diverge (role+box vs banner) = **blocker**
- a fix that repairs detection without the cure, or the reverse = **blocker**
- a husk cure left incomplete, finished by a hand-sent `crew.send` = **blocker**
  (`rule.always.entool-the-layer-you-drop-below`)

## .see also

- `define.invariant.crew.poll.completeness.md` — the poll must render every crew defect; this
  adds that the cure must reach what it renders, by the same test
- `term=duct.pane.husk._.choice.reason.md` — the measured husk instances and the role+box shape
- `term=duct.program.wedge._.choice._.md` — the 🧊 state, a different discriminator
- `rule.always.entool-the-layer-you-drop-below.md` — why a hand-sent cure is a defect in the verb
- `git.crew.poll.sh`, `crewwork.sh` (`__crew_heal_one`, `__crew_heal_revive`) — the two
  implementations this invariant holds in parity

---

written by human + beaver 🦫
