# F4 — `as-ehmpath` falls through on any keyrack non-grant

- **fork**: fall to ambient when keyrack reports (a) `absent` only · (b) any non-grant — absent, locked after the auto-unlock, blocked, unlock failure
- **taken**: (b). the wish says "if keyrack holds none". a locked or blocked key yields no token just as an absent one does; the miss message still names the keyrack status, so a keyrack fault is never hidden
- **rework**: clean — one condition
- **confidence**: 80%
- **where**: the `as-ehmpath` branch of the auth derive
- **verdict**: approved by the director with the vision, 2026-11-14; clean rework, held as taken
