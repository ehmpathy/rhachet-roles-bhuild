# F3 · the sense of "inside open hours a commit lands after 20:00 CT"

- **the fork**: (a) bake "after 20:00 CT" into the preship stone text; (b) the stone defers to an
  operator config for the hour and zone; (c) drop the clause from the template.
- **taken (best guess)**: read it as "a commit made inside the operator's open hours waits until
  after 20:00 CT", and (b) for where the hour lives.
- **rework**: clean — a sentence in one template.
- **confidence**: 35% — the reason for the hold, and the bounds of "open hours", are not stated.
- **where**: `1.vision.yield.md` q3; c8.
- **verdict**: ruled by the director, 1.vision grant gate, 2026-10-24 — "the open-hours clock stays
  out of the template; a refused commit is held, never a halt." fork (c): no clock in any template.
  the guess (b) is overruled. and the halt rule flips: a refused commit at preship is a **hold**,
  noted verbatim, and the route goes on (see F4). c8 and `case=13` are withdrawn; `case=5` is
  redrawn as a hold.
