# F9 — how a text is named, and the flag that names it

## .the fork

ids:

- **A**: a per-mailbox number (an auto-incremented ordinal)
- **B**: a uuid beside a per-mailbox number; a reference accepts either
- **C (taken)**: a uuid only. a reference accepts the uuid's first 8 chars or the full uuid; a
  number is refused, exit 2, with the alias form shown. the mailbox keeps an internal ordinal in
  each file name, for order alone — never printed, never accepted

flag on `get` and `del`:

- **D**: `--seq <n>`
- **E (taken)**: `--text <uuid>`; `--re <uuid>` stays on `set` for the reply link

## .taken, and why

- a number is easy to mistake: a one-digit slip names a valid neighbor, and the wrong text is
  read, linked, or withdrawn with no error. a uuid slip names no text, so it fails fast
- a number is local: the director's `out` #1 lands as the mechanic's `in` #7, so a number in a
  hint names the wrong text in the peer's mailbox. a uuid names one text in every mailbox
- an 8-char alias that matches two texts in one mailbox is refused, lists both full uuids, and asks
  for the full one
- `--seq` would name the argument by a form it no longer takes. one flag per argument
  (`rule.require.flag-name-symmetry`, dispatched R2): `--text` names the text an act targets;
  `--re` names a different role, the text a reply answers

## .rework

clean — one flag, a uuid field on the record, a refusal for a number.

## .confidence — 95%, low because

`--text` on a noun already named `phone.text` reads a touch doubled (`phone.text del --text a1b2c3d4`).

## .verdict

ids: the wisher, 2026-10-21 — first *"seq or uuid (uuid.slice(0,8) works too as an alias)"*, then
*"no <seq>, only uuids"*. the rule behind it is dispatched upstream (R11): never reference by an
auto-incremented id.
flag: settled by robot:director, 2026-10-21 — *"--text for get and del, as you proposed (R2: one
flag name per argument; --re stays for the reply link)"*.
