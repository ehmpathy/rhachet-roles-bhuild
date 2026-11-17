# F5 — os.fileops comments live in a log beside the task file

## .the fork

- **A** a separate comment log file beside `task.<exid>._.md`
- **B** append a `## comments` section inside the task file

## .taken — A, and why at the time

- `extractTaskFromOsFileops.ts:71-87` reads the description as the last `\n---\n` part of the
  body: any text appended to the task file would be parsed as description, so B silently
  rewrites the description — the one act every ask forbids
- A leaves the task file byte-identical, which a test can assert directly
- the log file name must not match the `task.*._.md` scan of `get.one.byUnique`

## .rework — clean

the log path is one function; a move to B would need a parser change, which is why A is taken.

## .confidence — 90%, and why it is low

the readme that `bootstrapRadioDir` writes lists the file kinds; a new kind must be added there,
and a reader of an older readme will not expect it.

## .where

`daoRadioTaskViaOsFileops.ts`, `bootstrapRadioDir.ts` readme.

## .verdict

open
