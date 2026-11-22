# F17 · a hold stays an explicit grant + release on the gate host; it is not tied to the live tree

## .the fork

a hold covers a sprout before its cost shows in the live read. the reviews asked for three more
things:

- release on boot: a hold counts only while its tree is not a crew at work
- a store on the grove, so two supervisor hosts see one hold set
- a held refusal that names each holder, its age, and when it lapses

- **(a)** keep the explicit pair (`--for … --key`, `--release`) with a 15 min lapse, on the host that
  runs the gate; a reheld key is granted whatever the box reads now
- **(b)** key each hold by tree slug, and drop it once that tree reads as a crew at work

## .taken, and why

(a), with this round's repairs: a reheld key is a findsert (granted and renewed, never refused), and
`/` maps to `+` so look-alike keys stay two holds. (b) joins the hold store to the crew read by tree
slug, and the live read has no slug of a tree that has not booted yet. a fresh crew reads ~0 cores
for minutes, so (b) would also need a rule for when "at work" starts. one supervisor host runs the
gate today, so a store on the grove guards against a case that does not occur yet.

## .rework

clean. holds sit behind `get_held_slots` and the hold dir. (b) changes what that function counts,
and the gate around it stays the same.

## .confidence, and why it is low

60%. a caller that never releases double counts for up to 15 min. a fresh crew between boot and its
first read sits in neither count. a second gate host would see none of the first host's holds.

## .where

`git.grove.capacity.sh` (the gate, `get_held_slots`); the dream named in F16.

## .verdict

open.
