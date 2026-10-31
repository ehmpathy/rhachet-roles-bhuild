# F10 · does "held, never a halt" cover a refused push too

- **the fork**: the director's F3/F4 verdict names a refused **commit**. a refused **push** (hook,
  auth, protected ref, non-fast-forward) is (a) held the same way — noted verbatim, the commit stays
  local, the route goes on, the director lands it; (b) still a halt, per the wish's "a refused
  commit or push is a halt".
- **taken (best guess)**: (a). the verdict's reason ("the director lands it when the switch opens")
  applies to a push as well as a commit, and one rule for every refused ship act is simpler to state
  and to test. one exception kept: a push rejected by a hook whose failure the driver can fix
  (a lint the local suite skipped) is fixed, never held — a hold there would hand the director a
  defect.
- **rework**: clean — a sentence in the preship and checkpoint text.
- **confidence**: 75% — the wish named push beside commit; the verdict named only commit.
- **where**: c6, c25, c26, `case=12`.
- **risk**: medium — a held push leaves a commit the pull lacks; the `.held` note and the
  commander's merge gate catch it before any ship. the other way (a halt) only stalls.
- **verdict**: ⚑ flagged best guess, by the director's word ("F10: best-guess it as a flagged
  fulcrum"). `case=12` is redrawn as a hold; the council may still overrule.
