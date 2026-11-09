# F23 — a blemish in a dependency's render is reseeded to its owner, never masked in this repo's snapshots

## .the fork

5.3 i001 `ergo-snapshot-visual-blemishes` names two blemishes in this branch's new snapshots:

- blocker.1: the journey [case2] snaps bhrain's `🪶 judge` stdout and stderr, whose blank lines
  end in two spaces (`   │  │  `) where the blank lines beside them are bare
- nitpick.1: each refusal of `rhx review.vision.root-purpose` opens with rhachet's
  `🪨 run solid skill` banner twice

neither byte is written by this repo: the judge tree is bhrain's render, and the doubled banner is
how rhachet's skill runner frames a non-zero exit (every refusal of every skill in this repo's
acceptance snaps shows it).

options:

- **A — reseed to the owner** (taken): each blemish is caught as a `reseed` dream for its owner
  repo; the snapshots here pin the real output, blemish and all
- **B — mask it here**: strip the end spaces, or drop the second banner, in `asSnapshotStable`.
  that helper is shared by every acceptance suite, so it rewrites snapshots far outside this
  branch, and it hides a real render defect from the one place a reviewer can see it

## .taken, and why

A. a snapshot exists to show the output a human sees (`rule.require.snapshots`); a mask that
cleans a dependency's bytes makes the snapshot lie about that output. the fix lives where the
bytes are made, and a reseed carries it there.

## .rework: clean

B is one helper edit plus a resnap of the suites it reaches; it can land on its own, any time.

## .confidence: 85%

## .where

`blackbox/role=behaver/__snapshots__/skill.init.behavior.guards.journey.vision.acceptance.test.ts.snap`;
`blackbox/role=behaver/__snapshots__/skill.review.vision.root-purpose.acceptance.test.ts.snap`;
dream `dreams/2026_11_08.reseed-render-blemishes-in-bhrain-and-rhachet.dream.md`.

## .verdict

(unruled)
