# F8 — the name of the new record field: `reasonHeadline`

## the fork

- (a) `reasonHeadline` — the words that explain `reason`, noun-first beside it (`reason`,
  `reasonHeadline`), so the two autocomplete and read together
- (b) `reasonFaultLine` — matches `asRadioFaultLineUpstream` and the `fault:` label
- (c) `reasonWords` / `refusal` — the vision's word

## taken: (a), and why at the time

it pairs with `reason` by prefix (`rule.require.order.noun_adj`), and it says what the value is —
the headline line of what upstream said for that reason. the field is a tracked file key, so it
must be settled before the first release; this pr is that release.

## the objection (r11, round 4)

`headline` already names "raw first line of a message" in `asRadioErrorHeadline`, used in the same
orchestrator, and three words now name one concept: field `reasonHeadline`, label `fault:` (F5),
vision `refusal:`.

## rework: clean, before release

a rename is a `sedreplace` across src + fixtures + the case9 snapshot that holds the file bytes;
no record with the field exists outside test trees until this ships. after release it is a
migration — so the council should rule with F5 together, one name for field and label.

## confidence: 75%, and why it is low

the reviewer's overload point is real; (b) would align field, transformer, and label on one word.

## where

`src/domain.objects/RadioTaskRecord.ts` and every writer and test of `reasonHeadline`.

## verdict

open — for the council, with F5.
