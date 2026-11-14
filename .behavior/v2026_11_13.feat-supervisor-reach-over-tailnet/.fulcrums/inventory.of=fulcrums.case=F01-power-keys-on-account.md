# F01 — the power axis keys on the row's `account`

- **the fork**: decide "is this an aws grove?" by `.account` presence (as #653 proposes), or by the extant `.type: "ec2"` field, or by `.exid` (as #652 proposes)
- **taken**: `.account`. the account guard needs it anyway, so a row with no account cannot run the aws legs safely; one key decides both
- **rework**: clean — the predicate lives in one transformer (F05); a swap is a one-line change
- **confidence**: 85%. extant rows hold all three fields, so every key agrees on them today; they only disagree on a hand-written row, e.g. `type: ec2` with no account
- **where**: `1.vision.yield.md` § the contract
- **verdict**: open
