# rule.require.a-cure-path-for-every-named-husk-shape

## .what

`term=duct.pane.husk` names several shapes: `💥143` (SIGTERM), `^C` (a human closed it), exit
`1`, and no exit signature at all (a bare shell, no banner, no code). every named shape must
have a defined cure path. where the automated cure verb (`git.crew.heal --mode apply`) declines
because the shape is too ambiguous to act on unattended, a MANUAL cure path must exist and be
followed — never left as an open question the tick moves past.

## .why

a decline from `crew.heal` is correct caution, not a dead end. a supervisor who reads a decline
as "naught more to do here" has confused the tool's caution with permission to stop. measured: a
crew sat dead for the rest of a tick after a correct decline, with no manual cure attempted,
until the human demanded one twice.

## .the manual cure path, for the no-exit-signature shape

1. `git.crew.read --tree <t> --who <r> --raw --lines 200` — read deep scrollback for a missed
   banner
2. `git.crew.send --tree <t> --who <r> --anyway --what 'claude --resume <role>'` — UNQUOTED the
   role token; a quoted arg concatenated after ambient prompt text with a dirty-git glyph (`!`)
   can trigger a zsh history-expansion error
3. if the "Resume Session" picker opens with zero rows, `Escape`, then `crew.send --what
   'claude'` to launch fresh
4. tell the fresh session its route/stone state explicitly — it holds no memory of it

## .a documented candidate root cause

a fresh session launched this way once displayed a session-usage-limit banner — a strong
candidate explanation for the whole no-exit-signature sub-shape: a process that hits an account
usage quota may end with no graceful exit banner at all. per
`rule.always.externalize.lessons.into_briefs` (bhrain/learner), such a finding belongs in
`term=duct.pane.husk._.choice.reason.md` the round it is found, not re-discovered later.

## .the test

for every husk a tick's instruments name: does a cure path exist for this shape? if the
automated verb declined, did you run the manual path, or stop at the decline?

## .enforcement

- a husk shape with no automated and no manual cure path defined = **blocker**
- an automated cure decline, followed by no manual cure attempt in the same tick = **blocker**
  (pairs with `rule.always.cure-detected-defects-same-tick`)
- a candidate root cause found for a husk sub-shape, left unrecorded past the tick it was found
  = **nitpick**

## .see also

- `rule.always.cure-detected-defects-same-tick.md` — the general mandate this sharpens for the
  case where the first cure attempt declines
- `term=duct.pane.husk._.choice.reason.md` — the shapes this rule enumerates
- `git.crew.heal` — the automated cure verb, and its correct, deliberate refusal on ambiguous
  shapes
- `rule.always.entool-the-permission-modal-cycle.md` — the peer rule for a different repeat
  hand-cycle

---

written by human + beaver 🦫
