# F18 · the cap ledger stays per worktree; a config dir's account is read as of now

## .the fork

a cap % belongs to an account, and the ledger sits under each worktree's `.log/`. so:

- a fell of a worktree drops its rows
- the reader globs every root
- N seats on one account log one change N times
- the burn of a past span is filed by today's sign-in, so a swap misattributes it

- **(a)** keep the per-worktree ledger (gitignored, beside the seat that writes it); name the
  sign-in caveat in the census and the calibrate why
- **(b)** one file per account under `~/.rhachet/storage/…/cap.ledger/<account>.jsonl`, keyed on
  (account, 5h %, 7d %); look up a config dir's account at time t from its latest row at or before t

## .taken, and why

(a). (b) moves a store that one wired seat feeds today: no pair has calibrated yet (yield,
`.todo`), so neither the fell loss nor the swap misattribution has been seen once. the calibration
verdict already refuses a partial pool (`absent`, `nobefore`, `offspan`). this round adds a stale
bound to the pool: a read older than the tolerance is left out. so the errors that remain err low.

## .rework

clean today, dirty later. the ledger holds rows from one seat, so a move now costs one path
constant (`CAPWORK_LEDGER_REL`) and the glob in `get_cap_rows`. once every seat writes it, a move
must carry their rows too.

## .confidence, and why it is low

55%. the swap case (account C burned from a seat now signed in as A) overstates tokens per %. the
verdict guard cannot see it, because C never enters `$burned`.

## .where

`work/capwork.sh` (`CAPWORK_LEDGER_REL`, `get_cap_rows`, `calverdict`); `claude.statusline.caplog.sh`;
the dream named in F16.

## .verdict

open.
