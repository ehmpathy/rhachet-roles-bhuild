# F8 — a comment's body rides the record's `description` field, not a new `comment` field

## .the fork

- **A** a new record field `comment: string | null` (as the vision's record section reads)
- **B** the body rides the extant `description` field; `kind: 'comment'` tells them apart

## .taken at the time — B

a new required field touches ~25 test fixtures and every record file a prior version wrote: a
legacy file lacks the field, so the read must default it, and the file-order write
(`asRecordFieldsInFileOrder`) would append `"comment": null` to each record it rewrites — churn in
tracked files with no change in sense (`rule.forbid.timestamps-in-tracked-files` names the same
cost for a clock). under B, the record file shape is unchanged beyond one more `kind` value, and
every reader already treats `description` as "the body".

the one place the two senses could cross — `queue set --description` — refuses on a comment, since
the body is part of its key.

## .rework — clean

a field rename inside the record domain object and its file schema; no caller outside
`src/domain.operations/radio/record/` reads the body by name.

## .confidence — 80%

low only because the vision text names a `comment` field; the sense (a body, keyed by hash) holds.

## .where

`src/domain.operations/radio/record/setRadioTaskRecordFromComment.ts`,
`src/domain.objects/RadioTaskRecord.ts` (doc on `description`),
`src/domain.operations/radio/record/setRadioTaskRecordAmended.ts` (the refusal).

## .verdict

open
