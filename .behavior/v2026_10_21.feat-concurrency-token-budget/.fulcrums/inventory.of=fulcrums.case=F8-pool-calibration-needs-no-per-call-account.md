# F8 · per-call account attribution is not a blocker

## .the fork

- **A — attribute every call to its account**, then calibrate each account's cap from its own burn
  and its own % change.
- **B — calibrate the pool**: read each account's % at two instants, sum the fleet's burn between
  them, and divide: `tokens per % = fleet burn ÷ Σ(Δ% over every account)`.

## .taken: B, and why

- transcripts name no account (zero fields on any line), and `.claude.json` holds only the current
  sign-in, so A has no history to read. the operators swap accounts before a cap hits, so the
  current sign-in misattributes exactly the burn that matters (measured: jelly reads 38M against
  73%, an absurd ~53M cap)
- the wish asks how many crews the fleet affords. with swaps, the fleet draws on a **pool** of
  accounts, so the token wall is the pool's capacity, not one account's. B measures that directly
- burn per crew-hour, the other half of the count, needs no account at all
- the % series comes free: each seat's statusline receives `rate_limits.five_hour` and
  `.seven_day` (`used_percentage` + `resets_at`) after each turn, and runs as the seat's config
  dir, whose `.claude.json` names the account at that moment. one gitignored ledger row per change
  gives each account's % over time, with no `/usage` and no clone
- the same ledger records (session, account) at each tick, so A becomes possible later at no extra
  cost, if a per-account report is ever wanted

## .rework

**clean.** the ledger is the input to both A and B. a switch to A later adds a join; it changes no
contract.

## .confidence: 70%, and why it is low

- B assumes the accounts in the pool share a plan tier (equal caps). unequal tiers skew the pooled
  tokens-per-%. the director does not know the tiers; F9 holds the best guess (one plan, Max)
  and shows the error runs conservative: the pool reads low, never high
- usage on an account outside claude code (claude.ai chat) raises its % with no burn in any
  transcript, so pooled tokens-per-% reads low
- `rate_limits` in the statusline input was reported absent in some versions (anthropics/claude-code
  #45133). the static probe on this grove's 2.1.280 (`rhx claude.statusline.probe`) finds the
  builder `...(five_hour || seven_day || spend_limit) && { rate_limits }`, so the risk shrinks to
  "the api omits a window"; one live tick still owed. the fallback is
  `GET https://api.anthropic.com/api/oauth/usage` per account credential
- the pool spans groves: burn on local counts against the same accounts, so the director's local
  reads are part of the fleet burn, not optional

## .where

- appendix `measure.grove=0901.census.md` → `.accounts`
- the statusline is already wired per seat (`settings.of.repo.json` → bhrain's
  `routeStatusLine`), so the ledger must compose with it, never replace it

## .verdict

open.
