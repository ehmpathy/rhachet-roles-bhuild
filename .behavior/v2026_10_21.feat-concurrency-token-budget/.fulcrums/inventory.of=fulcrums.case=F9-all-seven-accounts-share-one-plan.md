# F9 · all seven accounts share one plan tier

## .the fork

- **A — assume one plan tier** across the seven accounts in rotation, so every account's cap is
  the same size C, and pool calibration (F8) divides by a plain Σ(Δ%).
- **B — learn each account's tier first**, then weigh each Δ% by its own cap.

## .taken: A, and why

- the director does not know the tiers (asked 2026-10-21: *"unknown to me"*), and no file on the
  grove names them: `.claude.json` → `oauthAccount` holds the email and org, no tier
- the fleet buys seats to run claude code all day at review-ladder burn; a lower tier would hit its
  5h wall within the hour. best guess: **every account is on Max**, likely one Max size
- A costs naught now and does not block the ledger. the ledger itself reveals a mismatch (below)

## .how the pooled math changes if A is wrong

under A: `C = burn ÷ Σ Δ%ᵢ`, one cap for all.

with unequal caps Cᵢ, the true relation is `burn = Σ (Δ%ᵢ × Cᵢ)`. the plain division then yields a
**Δ%-weighted mean cap**: `Ĉ = Σ(Δ%ᵢ × Cᵢ) ÷ Σ Δ%ᵢ`.

- the pool's true capacity is `Σ Cᵢ`, but A reports `7 × Ĉ`
- Ĉ leans toward the **small** caps: a small-cap account moves more % per token, so its Δ% weighs
  more in the mean. ⇒ A **understates** the pool, and the crew count it yields is **conservative**
  (too few crews, never too many)
- worked case: 6 accounts at Max 20x and 1 at Max 5x (C/4), with burn spread evenly. the 5x account
  moves 4× the %, so `Ĉ = (6 × 1 + 4 × 0.25) ÷ (6 + 4) · C = 0.7 C`. A reports 4.9 C against a true
  6.25 C: **~22% low**
- the reverse error (the pool overstated) needs burn to pile onto the large-cap accounts, which a
  swap-before-the-cap habit works against

## .how the ledger tests A

the ledger logs (account, 5h %, 7d %) per tick. over any span where one seat burns on one account
alone, that account's own cap falls out: `Cᵢ = seat burn ÷ Δ%ᵢ`. two accounts whose Cᵢ differ past
the noise falsify A, and the fix is per-account calibration from the same rows.

a cheaper path, if it exists: the claude code 2.1.280 binary carries a `subscription type`
(pro / max / team / enterprise) field in one of its schemas; if a seat can surface it, the tier is
read, not inferred. Max 5x vs 20x would still need the ledger.

## .rework

**clean.** A and B read the same ledger. B adds a per-account divisor; no contract changes.

## .confidence: 60%, and why it is low

- no evidence for the tier at all, only the burn pattern that makes a sub-Max tier implausible
- Max has two sizes (5x, 20x); one-plan says naught about which, and a mix is plausible for
  accounts bought at different times

## .risk: low

none ships: an assumption inside a calibration; no credential, no prod write. if wrong, the pool
reads low (conservative), and the same ledger rows correct it

## .where

- `.fulcrums/inventory.of=fulcrums.case=F8-pool-calibration-needs-no-per-call-account.md`, which
  rests on this assumption
- appendix `measure.grove=0901.census.md` → `.accounts`

## .verdict

open. not a halt: A errs conservative, and the ledger will test it.
