# F24 — where "which dirs are routes" is decided

- **the fork:** the record dao walks `.behavior/*` and names each subdir but `.radio` a route (as
  shipped) · lift one shared `getAllBehaviorDirNames` into `domain.operations/behavior/`, reuse it
  in the three extant scans (`getBranchBehaviorBind`, `findBehaviorByExactName`, `getBehaviorDir`)
  and hand the record dao its dirs
- **taken:** the dao walk. the record dao owns where records live, and a route's `.radio/` is that
  place; the walk reads only paths, holds no behavior rule beyond "a subdir of `.behavior`"
- **rework:** clean for the recorder (the dao already takes `dirs` on `get.all`); the dedup of the
  three extant scans reaches files this tree does not open. deferred as a dream
- **confidence:** 70%. the reviewer is right that it is the fourth copy of one scan
- **where:** i006 r011 nitpick 2; dream
  `dreams/2026_09_29.lift-one-behavior-dir-scan-for-all-callers.dream.md`
- **verdict:** —
