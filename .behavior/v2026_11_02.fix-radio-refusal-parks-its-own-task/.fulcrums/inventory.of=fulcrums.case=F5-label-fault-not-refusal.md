# F5 — `get` labels the words `fault:`, not `refusal:`

## the fork

- (a) `refusal: <headline>` — the vision sketch's word
- (b) `fault: <headline>` — the word the drain already prints beside a set-aside record (`asRadioFaultDetailLine`)

## taken: (b), and why at the time

- one record, one label: a human who saw `fault: GraphQL: …` in the drain sees the same line in `get`
- the headline also rides on a halted record (a rate limit); "refusal" misnames a wall
- `refusal` already names a distinct fate in the code (`REFUSED`, a replay github closed for good); a second sense would overload it (`rule.forbid.ambiguous-labels`)

## rework: clean

one string in `asRadioFaultDetailLine`'s caller, plus the snapshot.

## confidence: 85%, and why it is not higher

the vision was approved with `refusal:` in its sketch; the wisher may have meant the word.

## where

`src/domain.operations/radio/record/asRadioHeldOutput.ts` — the `lineFault` child.

## verdict

open — for the fulcrum council.
