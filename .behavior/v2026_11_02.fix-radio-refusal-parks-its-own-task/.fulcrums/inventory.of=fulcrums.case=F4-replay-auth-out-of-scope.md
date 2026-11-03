# F4 — the replay-auth wants stay out of scope

- **the fork**: (a) also take #511 caseE/F and #626: a held record replays under the carrier
  push's auth, and stores the auth it derived at push time · (b) leave them open
- **taken**: (b). the wish names #511, #551, #626 only "as the same defect" in the pr. ⚠️ #626
  is kin, not the same: its record is set aside on `upstream:auth` (the token is absent), which
  already does not halt the drain; its harm is that `git.tree.del` / fell refuses while any
  record is held. the pr names it honestly as a kin issue, still open. the
  replay-auth change reverses #605's F3 (a held record replays with its own auth) — a contract
  change with its own fulcrum, larger than this nano route
- **rework**: clean — no code here depends on the replay auth
- **confidence**: 80% — #511's updates argue hard for the flip; a wisher may want it here
- **where**: the pr body names each issue and what part of it this pr closes
- **verdict**: —
