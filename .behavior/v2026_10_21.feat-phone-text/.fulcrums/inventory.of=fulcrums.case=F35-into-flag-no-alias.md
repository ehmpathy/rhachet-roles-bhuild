# F35 — the peer flag is `--into`, after the `into:` label; `--to` is refused, never aliased

## .the fork

the commander's order left open "whether the --to flag follows the label, to --into".

- **A (taken)**: the flag is `--into`. `--to` is refused, exit 2: `--to is now --into, after the into: label`
- **B**: `--into`, with `--to` kept as an alias
- **C**: keep `--to`

## .taken, and why at the time

every output already labels the peer `into:`, so the flag and the label share one word. an alias
gives one act two spellings, which `rule.forbid.ambiguous-labels` forbids. the refusal names the
new flag, so a clone with a stale habit fixes itself in one run.

## .rework

clean. one flag parse, and the hints that print it.

## .confidence — 75%, low because

the order asked it as an open question. a human may want `--to` kept as an alias for a while.

## .where

`src/contract/cli/phoneText.ts`; every reply and grant hint under `src/domain.operations/phone/render/`.

## .verdict

(best-guessed; named in pr #572 for the commander's review)
