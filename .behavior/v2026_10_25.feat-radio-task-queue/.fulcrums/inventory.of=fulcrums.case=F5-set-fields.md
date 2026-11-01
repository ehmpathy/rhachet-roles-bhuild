# F5 — what `set` may amend

- **the fork**: (a) `--auth`, `--description` · (b) also `--via` (it is in `updatable`) · (c) also `--title` (#604 lists it)
- **taken**: (a). `--auth` is the measured cure (#599 → as-human). `--description` is in #604's list and keeps a record's place in line. `--via` has no ask and no case; a channel swap is a del + re-push. `--title`: a create's key is a hash of (repo, title), and upstream findserts by title. a retitled record keeps a key that no longer names it, so a later push with the old title would re-type it, and one with the new title would mint a twin. `del` + re-push gives a retitle with one clear identity
- **rework**: clean — each flag is one field; `--title` needs a key re-mint as well
- **confidence**: 70%
- **where**: `RadioTaskRecord.ts` (`updatable`), `asRadioTaskRecordKey.ts`
- **verdict**: —
