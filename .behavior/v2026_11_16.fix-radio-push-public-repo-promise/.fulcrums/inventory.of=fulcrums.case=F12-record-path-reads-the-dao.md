# F12: `asRadioTaskRecordPath` reads the record file name from the dao, not a local copy

## .the fork

- **A, taken:** `relative(cwd, daoRadioTaskRecord.get.path({ dir, key }))` — the dao owns the file name
- **B:** build `<dir>/record.<key>.json` locally in the transformer

## .why A, at the time

the record file name is a persistence fact the dao owns (`asRecordFileName` beside the read and write that use it). domain.operations → access is the sanctioned direction (`rule.require.directional-deps`), and extant radio operations already call `daoRadioTaskRecord`. B writes the name rule a second time, so a rename in the dao would leave every fix line and nudge path aimed at a file that is not there.

## .rework: clean

one line, one file.

## .confidence: 85%

## .where

`src/domain.operations/radio/record/asRadioTaskRecordPath.ts`; peer round i001: arch-smell-scopeleaks nitpick.1.

## .verdict

open.
