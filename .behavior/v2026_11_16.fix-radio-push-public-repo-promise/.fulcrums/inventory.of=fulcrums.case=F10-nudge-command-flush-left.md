# F10: the nudge's command prints flush-left below the tree, not in its last leaf

## .the fork

- **A, taken:** tree, blank line, command flush-left as the last line; the leaf reads "once checked,
  re-run the command below"
- **B:** the issue's literal tree: the command as the child of `└─ once checked, re-run with:`

## .why A, at the time

`asRadioTreeLines` rails each continuation line of a leaf, so a multi-line body copied from B carries
`│` glyphs into the re-run, and that railed body is what the promise then vouches and sends public.
A also keeps the command the bottom line in every shape (backlog, inherited body, auth).

## .rework: clean

one render function and its snaps.

## .confidence: 85%

the issue text is literal about the tree; the commander may prefer B with a one-line body rule.

## .where

blueprint: nudge layout; vision and distill sketches revised to match.

## .verdict

open.
