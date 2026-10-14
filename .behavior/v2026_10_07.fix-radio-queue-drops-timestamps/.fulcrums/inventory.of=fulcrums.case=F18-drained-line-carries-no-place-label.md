# F18 — a drained line carries no place label

- **the fork** — two peers (i006 enroll-impl-behavior-intent friction.5, enroll-impl-arch-defects
  nitpick.2) read `held #37 in line` as a misread: `heldSeq` is an arrival number that never
  resets, so a task first in line can print `#37`, and `#37` sits beside the exid `#412` on one
  line. (a) print the drain rank instead; (b) rename it `push #N` / `ticket N`; (c) drop the label.
- **taken** — (c). the drained list prints in drain order, so line order alone states the place.
  the label restated it, and both reviewers misread the restatement. the deletion also retires the
  acceptance mask's special case for `held #`. the record keeps `heldSeq`; only the stdout changed.
- **rework** — clean. a label in one transformer; a revert restores it.
- **confidence** — 85%. low part: F3 had shown the wisher `held #N in line`, and the wisher ruled
  only on the age ("loose held since, its irrelevant"); the wisher may want a place label back.
- **drift** — the approved `1.vision.md` contract table still shows `held #N in line` (raised by
  i007 enroll-impl-behavior-intent). the vision is the wisher's approved artifact, so it is left
  as approved; this entry is the record of the departure, for the council to rule on.
- **where** — `src/domain.operations/radio/record/asRadioPushOutput.ts` (`asOthersSections`);
  `asRadioHeldPlaceLabel.ts` removed; acceptance snapshot of the recorder.
- **verdict** — unruled.
