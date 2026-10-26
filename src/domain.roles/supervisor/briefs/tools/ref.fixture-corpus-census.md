# ref.fixture-corpus-census

## .what

the four work primitives — `crewwork` · `ductwork` · `termwork` · `syncwork` — are the shared
libraries the verbs compose. their fixtures live in `skills/work/.test/.assets/` — **56 files,
each a bug that already shipped**: 51 captured panes, 4 captured *renders* (a verdict the renderer
got wrong), and 1 captured `eco.priority` body. they move with the classifiers or the classifiers
move unguarded (`rule.always.clamp-the-verbatim-pane-your-classifier-judged`).

## .why a count, not a prefix

the 5 non-pane files are why this cites a **count** rather than the `pane.` prefix — the corpus is
named for its commonest member, never bounded by it.

🔴 this read *"51 panes plus 5 renders"* until a peer reviewer counted. `51 + 5 = 56` is
arithmetically true and factually false — there are **four** renders, and the 56th is the
`eco.priority` capture. ⇒ **a right total will hide wrong parts**, so the census is clamped per
part, never by its sum (`testFixtures.integration.test.ts` `[case2]`).

## .who owns a fixture

`eco.priority.get.truncated-body.log` is named for a **prioritizer** skill and read by a
**supervisor** test (`crewwork.poll.integration.test.ts` `[case29]`, which grades
`__crew_eco_star_verdict` against a 64 KiB short write). ⇒ a fixture belongs to whoever **reads**
it, never to whoever it is named after.
