# F3: drain `--promise` vouches for every public record in that drain

- **the fork:** one promise for the whole drain · a per-record promise only (via `queue set`)
- **taken:** the whole drain, as the issue's row 6 states ("or passed to `drain`"). per-record
  vouch stays available through the record itself
- **rework:** clean — a scope filter on one flag
- **confidence: 85%** — a drain-wide vouch can cover a record the caller did not re-read; the
  nudge on the first drain names each set-aside record, which bounds that
- **where:** the drain loop's gate call
- **verdict:** ruled as best-guessed, by the director at 1.vision approval
