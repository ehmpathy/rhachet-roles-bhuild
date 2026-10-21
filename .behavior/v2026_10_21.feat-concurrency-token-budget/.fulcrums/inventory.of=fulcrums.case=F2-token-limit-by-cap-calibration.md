# F2 · derive the token limit by calibration of cap % against cost-weighted burn

- **the fork**: (a) calibrate tokens-per-% from cap % reads against cost-weighted burn · (b) take a published cap in tokens · (c) report burn only and leave the cap to the human
- **taken**: (a). no published token cap was found; (c) does not answer "how many can we afford"
- **how, simplest first**: if the cap read also shows when its window resets, **one read** suffices — tokens-per-% = burn since the window began ÷ % used, since transcripts hold every turn. the two-read pair (case=3) is the fallback when no reset time is visible. either way, the burn must sum **every seat on that account, across every grove**, or the rate is too low
- **rework**: dirty — the token limits, the exchange rate, and the gate all lean on the calibrated figure. if no command can read the %, the verb's shape holds but its token rows degrade to hand reads
- **confidence**: 55% — unverified that a command can read the % (Q2), unverified that the % is linear in cost-weighted tokens (Q3)
- **where**: `1.vision.yield.md` · formula, Q2, Q3; `case=3.uncalibrated-cap`
- **verdict**: —
