# define.invariant.crew.ratelimit.one-active-clone-refutes-every-cap-on-its-grove

## .what

**auth is grove-wide.** a usage cap is a fact about an account, and every clone on a grove
auths as that one account — so cap state is a property of the GROVE, never of the clone.

⇒ **one clone observed actively at work on a grove refutes every cap banner on that grove.**
each such banner is stale scrollback — a cap that has since lifted — and its cure is a NUDGE,
never an auth.swap.

⇒ the mandate that follows: if anyone on a grove has auth, try to heal every capped clone on it,
every tick. a capped-and-halted clone beside an active peer is not a wait; it is a tree parked
for want of a nudge the supervisor already owns.

## .kind

**nature, on a nurture premise.** the premise is ours (one shared account per grove, rather than
one per clone), but given that sharing, the implication is nature: a spent budget is one
budget, so it cannot be spent for clone A and unspent for clone B at the same instant.
`term=auth.swap`'s "one swap heals every clone on the grove" is the same fact from the cure end.

## .invariant

```
∃ clone c on grove G : c is ACTIVE   ⟹   the account for G is NOT capped
                                     ⟹   ∀ cap banners on G : the banner is STALE
                                     ⟹   ∀ such clones : cure = NUDGE, never a swap
```

contrapositive: `the account for G IS capped ⟹ no clone on G can be active`. a capped verdict
and an active peer are mutually exclusive; any render that shows both at once has a defect.

## .why — the two readings are not equally credible

| the evidence | what it is | can it lie? |
|---|---|---|
| a cap banner in scrollback | historical — a past moment | 🔴 yes — persists after the cap lifts |
| a clone that emits tokens now | present-tense | 🟢 no — a capped clone cannot do it |

activity is unfalsifiable; a banner is merely durable. when the two conflict, the active peer
wins. a banner outlives its cause by construction (a clone halts mid-turn, the banner freezes,
the cap later lifts, the pane never repaints). the reset clock is not the discriminator — a
future `resets` reads correctly as a live cap *in isolation*, but wrong *in context*, since it
says when the cap would lift on its own, never whether some other lever already lifted it. the
miss costs a human's browser leg on a no-op, and the tree stays parked afterward since a nudge
was what it wanted.

## .the discriminator

> read the GROVE before you read the pane.

```
active(G) := ∃ clone on G whose pane shows present-tense work (spinner, live tool call,
             a climbing token/elapsed counter)
if active(G): every cap banner on G is STALE  ⇒ nudge, every tick
else:         a banner's own reset clock decides  ⇒ future = swap, passed = nudge
```

the grove check is cheap and already paid — a fleet poll reads every pane on every grove in one
pass, so peer evidence is in hand before the first verdict renders.

## .the tool must GUIDE, never merely classify

| the tool | what it owes on an ACTIVE grove |
|---|---|
| `git.crew.poll --stones` | render the clone halted, never `🚫 limited` — say the grove is active |
| `git.crew.poll --healable` | include it, emit its `git.crew.heal` line |
| `git.crew.heal` | nudge it — never return live-cap swap guidance |
| a report to a human | no auth.swap gate at all while the grove is active |

a false gate is worse than silence: it spends the one resource the fleet cannot replace.

## .the counter-argument

"the reset clock is authoritative, so the active clones must be elsewhere" is refuted: the poll
derives each clone's grove from the ledger, and `term=auth.swap` already declares the account
shared grove-wide (a per-clone account would make a swap heal exactly one, and it does not). "a
clone could be mid-render of cached output" fails for a climbing token/elapsed counter, which is
drawn by a live turn; a genuinely ambiguous pane simply does not count toward `active(G)` — the
invariant needs only one unambiguous peer.

## .what would overturn it

per-clone accounts (then a banner is about its own pane alone — this would also retire
`auth.swap`'s global-and-hot property) · a per-clone/session cap layered on the account budget
(then activity refutes only the account-level cap) · a mid-tick cap onset (narrows rather than
overturns: the grove check must read peers from the SAME poll pass, never a prior tick's cache).

## .scope

covers the usage-cap banner on a clone that shares its grove's account. does not cover a
transient 429 (already nudge-cured) or a husk/flap (dead; activity says naught about a cap),
nor a grove where no clone is active (then the banner's own clock governs, per
`live-cap-healable-via-swap`). this invariant NARROWS that rule; it does not replace it.

## .enforcement

- 🔴 a `🚫 limited` verdict rendered for a clone on a grove where a peer is ACTIVE, same poll
  pass = **blocker**
- 🔴 an `auth.swap` gate relayed to a human while any clone on that grove is active = **blocker**
- a capped-and-halted clone on an active grove left un-nudged = **blocker**
- a poll that classifies correctly but emits no runnable heal line = **blocker**
- a grove check performed against a PRIOR tick's cache rather than the current pass = **blocker**
- a cap on a genuinely quiet grove treated per its future reset clock = 🟢 correct
- a husk or flap on an active grove read as a stale cap = false positive

## .see also

- `term=auth.swap._.choice._.md` — declares the swap global + hot
- `define.invariant.crew.ratelimit.live-cap-healable-via-swap.md` — the rule this narrows
- `define.invariant.crew.ratelimit.healable-transient.md` — the transient/stale rows
- `rule.require.trust-but-verify.md` (ehmpathy/mechanic) — a banner is a correlate; a live turn
  is the record
- `term=false-report._.choice._.md` — an instrument true about a past moment, read as present
- `rule.require.poll-recommends-every-cure-heal-has.md` — the guide-not-merely-classify clause
- `rule.always.clamp-the-production-defect-you-just-saw.md` · `surgoal.polish-the-supervisor-and-prioritizer-tools.md`

---

written by human + beaver 🦫
