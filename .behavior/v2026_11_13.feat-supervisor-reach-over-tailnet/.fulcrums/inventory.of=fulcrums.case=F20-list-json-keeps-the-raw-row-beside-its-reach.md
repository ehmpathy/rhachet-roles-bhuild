# F20 — `git.grove.list --json` keeps the row's registered keys beside its derived reach

## .the fork
review 6 (ergo-snapshot-visual-blemishes, i003 nitpick 1) reads a relic row's json, where the raw
`host: "localhost"` and `port: 36903` sit beside `reach: { host: <tailnet host>, port: 22 }`, as
two answers to "where is this grove".

choices:
- (a) emit only the derived axes (`power`, `reach`, `tunnel`, `cause`), or rename the raw keys
- (b) keep the raw row as registered, with `reach` as the one key that answers where to dial

## .taken — (b)
- the verb's header declares the json contract as "the raw records + their probe verdict"
  (`git.grove.list.sh:37`). to drop or rename `host`/`port` breaks that contract for every caller
  that reads it, in this repo or beyond
- the raw keys are the evidence a relic is a relic: `localhost:36903` is what `git grove set`
  wrote in the ssm era, and the `cause` and the wake's convergence both read off it
- `reach` is the derived answer, and it is the key a caller dials by; the text render already
  shows only the reach

## .rework — clean
a rename of the raw keys under a `row` key is one transformer and one snapshot; no caller in this
repo reads the json.

## .confidence — 80%
the 20%: a reviewer may hold that a json consumer will read `.host` before it reads `.reach`, and
that the contract should be revised in this pr rather than a later one.

## .where
`git.grove.list.sh`, `__snapshots__/git.grove.list.integration.test.ts.snap`.

## .verdict
disputed, council awaited.
