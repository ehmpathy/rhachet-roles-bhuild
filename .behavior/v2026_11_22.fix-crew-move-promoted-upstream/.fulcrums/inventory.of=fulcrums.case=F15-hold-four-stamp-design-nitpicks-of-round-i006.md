# F15 — hold four stamp design nitpicks of round i006 (r011 n1–n4)

## .the fork

r011 nitpicks 1–4 propose a different stamp design: one grove proc that both derives and writes; `set-option -o` for the anchor; a pin built from the global `status-left`; and no pane `@repo` / `@branch` writes. either take them now, or hold the current design.

## .taken — hold, on cited ground

| concern | why it holds |
|---|---|
| n1 — derive and write in one grove proc | the probe is a pure read, and the stamp proc is the only writer. `tmux.bar.probe` and the gone-home check (case11) reuse that read. the quote surface this would remove is already closed: every value is `%q`-quoted, and the proc crosses as base64 (case9, with a bite proof). one more ssh round trip happens once per seat raise. |
| n2 — `set-option -o` for the anchor | `-o` cannot tell an unread option from one that is unset. the read-then-write path keeps those two cases apart, and the pane-copy unset rides the same call. idempotence already holds: a rerun writes the same value (case5, case10). |
| n3 — derive the pin from the global `status-left` | the pin names the `tmux.conf` contract on purpose: ` #{@duct_repo} ` / ` #{@duct_branch} `, per the `ductwork.status.sh` header. a rewrite of the human's format string would carry whatever the global holds, even a format that reads the cwd, which is the original defect. |
| n4 — the legacy pane `@repo` / `@branch` writes | they have a reader: the human's global `status-left ' #{@repo} '`, which an unpinned session reads (status suite, case7 and line 432). if they were dropped, an unpinned seat would lose its label. |

## .rework

clean. each change stays local to `ductwork.status.sh` and its suite, with no caller ripple.

## .confidence

80%. n1 is a matter of taste. a single-trip proc is defensible, but the pure-read probe is used by two other readers.

## .where

`src/domain.roles/supervisor/skills/work/ductwork.status.sh`

## .verdict

open, for the director.
