# F18 — `set*` on the record mutations

- **the fork:** `set*` (upsert) · `upsert*` / `findsert*`
- **taken:** `set*`. `rule.require.get-set-gen-verbs` sanctions `set` as the upsert verb for
  domain operations ("set always writes/overwrites state", idempotent); `rule.forbid.nonidempotent-mutations`
  governs raw dao verbs, and the dao here already reads `set.upsert`. each `set*` record operation
  converges on re-run
- **rework:** clean — `sedreplace` the names
- **confidence:** 85%
- **where:** `setRadioTaskRecord*.ts`; peer r6 nitpick.2
- **verdict:** —
