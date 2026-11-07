# F33 — a malfunction's stack frames keep node's own 4-space indent, under the 3-space tree

## .the fork

the corrupt-meter malfunction prints its tree, then its stack frames (`    at …`), which sit one column
right of the tree's `├─`.

- **A (taken)**: print each frame as node writes it, after the tree (`asCliMalfunctionOutput`, shared by
  every cli in this package)
- **B**: re-indent the frames to 3 spaces, or nest them as tree branches

## .taken, and why at the time

the frames are for the on-call engineer, not the human who reads the tree: they are node's stack, and
an engineer greps and pastes them as node prints them. the shared printer exists to drop node's
second class-name prefix and keep the frames verbatim (`asCliMalfunctionOutput.ts` `.why`). to re-indent
them inside the phone alone would fork the one malfunction printer every bhuild cli shares, and to nest
them as branches would mix a debug artifact into the human's tree.

## .rework

clean. one transformer, `src/infra/cli/asCliMalfunctionOutput.ts`, and its unit snapshot.

## .confidence — 75%, low because

the snapshot shows a one-column jog, and a reviewer reads it as a blemish.

## .where

`src/infra/cli/asCliMalfunctionOutput.ts`; the acceptance snapshot masks the frames to `    at <frame>`
(case2 [t2]). raised by r011 n5 at 5.3 i005.

## .verdict

(open — for the council)
