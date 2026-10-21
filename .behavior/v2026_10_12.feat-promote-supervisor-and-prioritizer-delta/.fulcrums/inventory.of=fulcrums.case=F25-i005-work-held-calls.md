# F25 — i005 held calls, the work slice

i005 concerns on `skills/work/` (crewwork excluded) answered by a held call, not a repair. the
F24 calls (a, d, e) stand as written; the rows below are new.

provenance, read 2026-10-20 from `uladkasach/nheuron` at `58f7430` (`git.crew.poll.sh`):
`__login_by_grove` ×4, `__grove_crews` ×5, `__cap_live_n` ×7, `__ct_absent` ×3, `read it RAW` ×3,
`the clone is DEAD` ×2. ⇒ the poll render arms r011 and r023 name are the source's own, moved verbatim.

## .a — the ported group-by folds stay (r011 nitpick.1, nitpick.2)

- **the fork**: lift the LOGIN EXPIRED group-by (`__login_by_grove`) and the grove census
  (`__grove_crews`) into named transformers, or keep the folds the source draws
- **taken**: keep the folds; their field decoders are named (`__poll_seat_as_role`/`_value`)
- **why, at the time**:
  - both folds fill a bash associative array the CALLER reads after the loop. a transformer can
    only hand one back by a global or a serialized string, which adds a decode at the call site
  - both are the source's own lines (provenance above), in a stage moved verbatim so the next
    promotion three-way-merges clean (F3, F24.d)
  - `crewwork.grove` [case] pins `__grove_crews["$__glh"]` by text, so a lift rewrites a peer clamp
- **rework**: clean. one function per fold and a retargeted clamp
- **confidence**: 75%
- **verdict**: open

## .b — named transformers over single-caller inline code (r015 nitpick.1)

- **the fork**: inline the single-caller helpers (`__sync_oid_as_zero`, the branch probes,
  `__poll_words_as_*`), or keep them named
- **taken**: keep them named
- **why, at the time**: the same round's r011 grades inline decode a BLOCKER under
  `rule.forbid.inline-decode-friction`; `rule.prefer.wet-over-dry` is a nitpick about
  GENERALIZATION (one shared shape for several callers), and none of these generalize — each names
  one decode. the probes are also the seam the race clamp (`syncwork` [case-unpack][t3]) overrides,
  so to inline them deletes the test's way in
- **rework**: clean
- **confidence**: 85%
- **verdict**: open

## .c — public ehmpathy branch names cited as provenance stay (r003 nitpick.2)

- **the fork**: rename every `feat-*` provenance slug in the `work.surface.*` tests to a surf-school
  one, or keep the measured names
- **taken**: keep them
- **why, at the time**: `rule.forbid.private-business-in-published-roles` lists as **not leaks**
  "public ehmpathy / rhachet repos and packages". the slugs are branches of public ehmpathy repos
  (`rhachet-roles-bhrain`, `rhachet`, `rhachet-roles-ehmpathy`, `declastruct-aws`,
  `sdk-aws-lambda`); the private ones were scrubbed to sandpine (F2) and `orgNamesAbsent` holds
  green over the slice. the `.dream/` paths the same lane raised are repaired (n1)
- **rework**: clean. a sedreplace per slug, about 50 lines
- **confidence**: 80%
- **verdict**: open

## .d — one verbatim pane fixture, read by two suites (r035 nitpick.3)

- **the fork**: split the login-expired pane fixture into one copy per suite, or keep one asset
- **taken**: keep one asset
- **why, at the time**: the asset is a verbatim capture of what claude printed. `ductwork.signal`
  clamps the predicate (`__duct_pane_has_login_expired`); `ductwork.pane` clamps the classifier
  verdict built on it. two layers over one fact is the point: a second copy could drift from the
  capture, and then the two suites would test two different screens while both claim the real one
- **rework**: clean
- **confidence**: 80%
- **verdict**: open
