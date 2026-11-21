# F28: a sent push prints no `promise:` line

## .the fork

a push with `--promise` that sends, and a push whose stray `--promise` was not needed (private repo, status
only, os.fileops), print the same `created` / `updated` tree as one with no promise. the fork:

- **a.** add a `promise:` line (or a "promise not needed" note) to the delivered tree
- **b.** keep the delivered tree as it is; the promise lives on the record file (`"promise"`), the nudge names it
  before the send, and `queue get` shows it on a held record

## .taken: b, and why at the time

- **#675 names no delivered-output change.** its behavior list covers the halt and the send, not the receipt
- **the delivered tree is an extant contract** that every push prints; a new line moves every delivered snap in
  the repo for a fact the human typed one command earlier
- **the audit trail is on disk**: the record holds `"promise"` (`asRadioTaskRecordFromPush` stores it only with
  text the push passed), and the clamp tests read it there

## .rework

clean. one optional line in `asRadioPushOutput`'s delivered branch, and a resnap.

## .confidence, and why it is low

75%. a reviewer of a snap cannot see from the bytes whether a promise was given; that is a fair audit wish.

## .where

`src/domain.operations/radio/record/asRadioPushOutput.ts` (delivered branch)
