# domain.term: auth.swap

term.chosen   = swap
term.kind     = verb  (the noun form — *a swap* — is the same word, per `auth`'s precedent)
term.boundary = auth
term.synonyms.forbidden:
- relogin
- re-auth
- re-signin
- switch
- changeover

## .what

to **replace the account a machine is signed in as**. the machine stays; the identity changes.

```
rhx git.grove.auth <grove> --brain claude --mech oauth      leg 1, on a box that already holds a credential
rhx git.grove.auth <grove> --brain claude --mech oauth --code '…'
```

a swap is `auth` performed on a box that is **already authed**. that is the whole distinction,
and it is not cosmetic — see below.

## 🔴 .swap is not `rotate`, and this is the sharpest line

both replace a credential. they differ on the one axis that matters:

| | what changes | what holds |
|---|---|---|
| **rotate** | the **token** | the account — same `email`, same `orgId` |
| **swap** | the **account** | the machine |

`keyrack fill --refresh` and `--repair` are rotates. `brains.auth.use --reach <email>` is a swap.

⇒ so *"rotate the grove's login"* names no real act, and *"swap the token"* names a rotate. the
word carries **which of `who` and `what` moved**, and a reader who takes the wrong one reasons
about the wrong quantity — usage budget follows the account, never the token.

## ⚠️ .a swap TRAVERSES a different path than a first auth

the easy read is *"a swap is just auth, done twice."* it is not, and this repo paid to learn it.
an already-authed box raises **different screens, in a different order**:

| | a fresh box | an already-authed box |
|---|---|---|
| trust folder | arrives AFTER sign-in — leg 2 owned it | arrives at **startup** — leg 1 must own it |
| the entry | the sign-in prompt is already up | must send `/login` to raise one |

⇒ two latent defects in `git.grove.auth.sh` were reachable **only** on the swap path, because
that path had never been walked. the word earns its keep because it names a traversal, not
merely an outcome.

## 🔴 .a swap can ATTEMPT and land naught — and the skill cannot tell you

the `.what` above says a swap *replaces* the account. that describes the **outcome a swap wants**,
never what a run guarantees. a third result exists, and it is the common one:

| the run | what moved | what the skill prints |
|---|---|---|
| a swap | the account | `✔ signed in as X` |
| 🔴 **a no-op swap** | **naught** | `✔ signed in as X` — *identical* |
| 🔴 **a refused code** | **naught** | *also identical* — see below. this row once claimed `an error, exit ≠ 0`, and that was FALSE |

⇒ **the account a swap lands is chosen by the BROWSER, never by the caller.** the url authorizes
whichever identity that browser session already holds, so a caller who wants a different account
and does not sign out first re-auths the same one — and the run **succeeds**, writes a fresh
credential, and reports truthfully.

🔴 **that middle row is why the verdict must be a COMPARISON.** `✔ signed in as beaver@` is a true
sentence about a real swap and about a no-op alike, so no reading of the skill's own output can
part them. only a before/after on **both** `email` AND `orgId` can.

⚠️ **measured three times, 2026-09-08, on `grove-ahbode-v20260901`** — twice as a no-op
(`beaver@` → `beaver@`, orgId unmoved), then once real (`beaver@` → `vlad@ahbode.com`, orgId
`8f414231…` → `580539f3…`). the first no-op was misread as a spent code; it was not — an expired
code makes the exchange **fail**, and this one succeeded.

⇒ so the cure is at the browser and costs one action: **sign out, or open the url in a private
window**, before the mint. a caller who skips it is not at risk of an error — they are at risk of
a **success that moved naught**.

### 🔴 .the third row once read `an error, exit ≠ 0`. it was FALSE, and the cost was a WRONG CURE

a **refused** code — `OAuth error: 400` on the exchange — leaves the same `auth status` a no-op
leaves, because **a refused exchange never writes a credential at all.** the one it finds is the
old one: whole, valid, and answered perfectly by the endpoint.

⇒ **that endpoint is blind to a failure BY CONSTRUCTION**, exactly as it is blind to a no-op. so
a verdict derived from it cannot part them, however careful the before/after comparison is.

⚠️ **measured 2026-09-14, `grove-ahbode-v20260901`.** an expired code was refused, and the skill
reported, verbatim:

```
🟡 NO-OP — the credential is fresh, and the account did NOT change
   fix: sign out at claude.ai, or open the url in a private window
```

exit 2. every word of it false, and the prescribed cure was useless — the browser was innocent,
and a sign-out would have moved naught. the true cure was the opposite reflex: **mint a fresh
url and paste the code back promptly.**

⇒ this is the exact mirror of the 2026-09-08 note above — *"the first no-op was misread as a spent
code."* **the confusion runs BOTH ways**, and a caution aimed one way reads as though the other
direction were settled.

### ✅ .the repair — part them UPSTREAM, at the PANE

| where you look | can it part a refusal from a no-op? |
|---|---|
| `auth status`, before/after | 🔴 **no.** neither run writes a credential |
| the exit code | 🔴 no. a refusal exits the same as a success |
| 🟢 **the pane, mid-exchange** | ✅ **yes.** `OAuth error` appears there and nowhere else |

so `git.grove.auth.sh` now greps the live pane for `OAuth error` inside leg 2's watch loop, breaks
with the verbatim string, and the terminus renders a **third** outcome that outranks the no-op arm.

🔴 **the ORDER is the repair, not the grep.** the no-op arm was already correct for its own case
and sat FIRST, so it swallowed every refusal that reached it. a new branch placed below it would
have moved naught.

⚠️ and the grep must run inside the **watch loop**, never at the terminus: the error screen parks
on a human prompt, so a terminus-only read arrives after the stall guard has already burned its
timeout on a screen it could not name.

⇒ measured 2026-09-16, same grove, a second expired code: caught on **watch pass 1, ~4 seconds**,
with the true cause named and exit 1. before the repair, the same input cost 76 seconds and a wrong
verdict.

### ⚠️ .the guard that should have caught it was blind for a SECOND reason

the watch loop already held an unknown-screen guard, and it did not fire either. both it and the
stall guard tested for the literal `Enter to confirm` — the **select** footer. the oauth error
screen carries `Press Enter to retry` and `Esc to cancel`, and neither guard looked for those.

⇒ the phrase was inlined **four times** across the two legs, so each copy read as a local detail
rather than as one shared question asked four ways. the repair was one helper, `__screen_up`,
that every guard now routes through — recorded at
`rule.always.share-one-probe-across-guards.md`.

## ✅ .a swap is GLOBAL and HOT — no crew owes a restart

the credential is machine-wide and **hot-reloaded**. the instant a swap lands, every clone on that
grove reads the new account — mid-turn, parked, or idle alike.

| | what it needs after a swap |
|---|---|
| a live crew | **naught** |
| a parked clone | **naught** |
| the supervisor | the before/after comparison, and then stop |

🔴 **stated because the opposite was asserted repeatedly, and it was never measured.** across four
swaps on 2026-09-08/09 a supervisor closed each report with *"the N crews still hold the previous
token in memory — they need a restart to pick up the new one."* the wisher corrected it:
*"creds are global btw, instantly, hot reloaded."*

⚠️ **the failure shape is the one this file already warns about, committed by the same reader.**
the `.what` above was corrected because it described an outcome the verb cannot guarantee; this
clause exists because a supervisor invented a **consequence** the verb does not have. both are a
claim about the mechanism reached without a measurement — and the restart claim was the more
expensive one, since it prescribes real work on a live fleet.

⇒ the cost of the wrong read is a **fleet-wide reboot for naught**: a dozen crews lose their
conversation to cure a condition that never existed.

## .swap is NOT

- 🔴 **guaranteed** — see above. a run may succeed and land the same account. the verb names the
  INTENT; only a before/after comparison names the outcome
- 🔴 **propagated by a restart** — see above. the credential is global and hot. a swap is complete
  the moment the comparison verifies it, and prescribes no follow-up act at all
- **`rotate`** — see above. the account holds
- **`cycle`** — a cycle is a *policy over* swaps ("move to the next account with headroom"). one
  swap is a step; a cycle is the whole loop. distinct concept, distinct word, not yet paved
- **`auth`'s opposite** — that is a logout. a swap never passes through one
- **idempotent** — each swap mints a new `state` and `code_challenge`, so the prior url dies. a
  re-run is a NEW swap, never a replay of the last (`term=auth` records the same for auth)

## .refs

declared at `.agent/repo=.this/role=any/skills/`:

- `git.grove.auth.sh` — the dop; the trust arm and the leg-2 chain that only a swap reaches

`brains.auth.use` — a **foreign** dop (`examplehuman/dev-env-setup`), cited rather than paved. it
carries the browserless form of this same act, and calls it `a SWAP` in its own exit-code help.

## .reason

see `term=auth.swap._.choice.reason.md` — etymology, the rejected `switch` and `relogin`, the
independent-coinage evidence, and the measured traversal split.

---

written by human + beaver 🦫
