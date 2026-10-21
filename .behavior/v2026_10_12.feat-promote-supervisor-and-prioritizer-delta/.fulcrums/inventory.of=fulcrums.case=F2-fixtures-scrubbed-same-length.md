# F2 — fixtures with private names are scrubbed by same-length substitution

## .the fork

12 of 40 new pane fixtures name a private org, service, or person. a fixture is a verbatim
capture; the classifier reads its widths, wraps, and smears.

- **A.** substitute each private name with a demo-business name of the **same length**
- **B.** substitute with the natural demo name (any length), then re-tune the cases that break
- **C.** leave those 12 in nheuron, promote only the clean 28

## .taken — A, and why

at least one cure is about width (`pane.husk.false-positive-under-width-mismatch-smear.log`).
a length change could fake or mask it. A preserves every byte offset outside the name. C ships a
classifier whose cures are untested in the package, which the wish forbids ("a test that moves
without its fixture does not count").

## .rework — clean

per-fixture edits; each is independently checked by its own test.

## .confidence — 85%, and why it is low

a same-length name may read awkward (`svc-quotes` → `svc-lesson` fits; a person's name may not). if
no fitting demo name exists for a span, execution pads with a fitting suffix and notes it.

## .where

`src/domain.roles/supervisor/skills/work/.test/.assets/*.log`

## .verdict

(pending the council)
