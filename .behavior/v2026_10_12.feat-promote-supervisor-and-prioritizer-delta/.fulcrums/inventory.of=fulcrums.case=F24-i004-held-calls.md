# F24 — i004 held calls

i004 concerns answered by a held call, not a repair. each row names the concern, the call, and why.

## .a — caps emphasis in ported comments (r035 nitpick.1)

- **the fork**: lowercase every caps-emphasis word (`ONE`, `NOT`, `BENIGN`, `ZERO`, …) in
  `work.surface.stones.integration.test.ts`, or keep it as the source writes it
- **taken**: keep it
- **why, at the time**:
  - `rule.prefer.lowercase` is a `prefer` (nitpick). its target is capitalized sentence starts
    and generic nouns. it does not name caps used for emphasis on purpose
  - the house briefs this repo boots use caps emphasis on purpose, in every role
    (`rule.always.raise-a-blocker-a-taken-cannot-close`: "the halt **stands**", "**ANY**",
    "a `.taken` does not lift the halt"). the ported comments follow that voice
  - the file is a three-way port from the source (F3). a rewrite of every emphasis word across
    a ~2k-line test file makes the next promotion diff noisy, with no shipped harm on the other side
  - the acronyms the same lane raised as a blocker (`SGR`, `ESC`, `SIGTERM`) are a `forbid`,
    and those are repaired
- **rework**: clean. one sedreplace pass per word, whenever the council asks for it
- **confidence**: 75%. low because the reviewer reads the prefer rule as covering emphasis, and
  that reading is defensible
- **where**: `src/domain.roles/supervisor/skills/work/work.surface.stones.integration.test.ts`
- **verdict**: open

## .b — the duct.poll stone pipeline stays inline (r010 nitpick.1)

- **the fork**: lift the `grep 🗿 | tail | sed | sed | sed || true` stone pipeline in
  `duct.poll.sh` into a named `__duct_pane_stone_line`, or keep it inline
- **taken**: keep it inline
- **why, at the time**: four clamps read that ONE statement by its own anchor
  (`work.surface.classify` [case11] t0/t0b, [case69] t1 ×3). the [case11] `.why` says the
  statement-anchor replaced a char window after a real false-red, and it grades `|| true` on the
  statement's own close. the lift was done and measured: 7 reds, each a clamp that lost its
  anchor. a move means rewriting the anchor logic of two guarded cases for a nitpick. reverted
- **rework**: dirty. the lift is one function; the four clamps and their anti-vacuity teeth
  must be rewritten to anchor on the function body
- **confidence**: 80%
- **verdict**: open

## .c — the FENCED row substitution stays inline (r011 nitpick.1)

- **the fork**: lift the `${__row_detail/ — fell it/ — 🐢 FENCED …}` swap in
  `pollwork.rows.sh` into a named transformer, or keep it inline
- **taken**: keep it inline
- **why, at the time**: it is one parameter expansion with no pipeline, and
  `work.surface.scope` [case67] t1/t2 pins it by text, with a bite proof held against the
  exact pre-fix line. the lift was done and measured: 3 reds. reverted
- **rework**: clean, if the council asks; the [case67] clamps retarget to the transformer
- **confidence**: 80%
- **verdict**: open

## .d — the ported else ladders in the poll render stay (r023 nitpick.1)

- **the fork**: flatten every if/else the lane named in `pollwork.sweeps.sh` / `pollwork.actions.sh`
  into guard + early return, or keep the ladders the source draws
- **taken**: the one in a function of its own is flattened (`__crew_uri_as_box` is now a guard and a
  return). the ladders inside the render stages stay
- **why, at the time**: the stages are the poll's top-level code moved VERBATIM, and each part's
  header says so: "left unindented, so `git diff --color-moved` and `git blame -C` trace every line
  to its origin". the ladders sit inside loops that `continue`, not inside functions that return, so a
  guard form means restructured loop bodies across four arms of the boot and mode sweeps, in a file
  the next promotion three-way-merges (F3). that ripple is the F16 ported-debts dream's
- **rework**: dirty. four loop bodies to restructure, plus their text clamps (`[case73]`, `[case74]`)
- **confidence**: 80%
- **verdict**: open

## .e — the grant tripwire stays in the transport (r019 blocker.2)

- **the fork**: have the tree and crew verbs publish the grant predicate the transport consults, or
  keep the deny-list in `ductwork.io.sh`
- **taken**: keep it in the transport, and clamp it to the owners' own grammar
- **why, at the time**:
  - direction. `ductwork` is the lowest lib under `work/`. the size and sponsor verbs source the
    crew and duct libs, never the reverse. a transport that sources a predicate from the verbs it
    carries inverts `rule.require.directional-deps` and opens a source cycle
  - the reviewer's named harm is real: "when `git.tree.size.uses` renames or adds a sub-verb, the
    tripwire silently stops firing … and no source-level check catches it." that harm is now closed.
    `crewwork.sponsor` [case6b] reads each owner's own usage header. t0 fails on any sub-verb not
    classed as a grant or a read; t1 sends every documented grant line through `crew.send` and asserts
    the refusal. bite proofs: drop `revoke` from the predicate → t1 red; add a `grant` sub-verb to the
    size header → t0 red
  - F23.c still holds: only the transport can see that the "terminal" is a pane a clone drives
- **rework**: dirty. a published predicate needs a new lowest-layer contract file that both owners
  write and the transport reads
- **confidence**: 75%
- **verdict**: open

## .f — the poll reads the duct host predicate (r019 nitpick.1)

- **the fork**: give ductwork a public host contract for pollwork to consume, or keep the call
- **taken**: keep the call
- **why, at the time**: pollwork sits ABOVE ductwork and sources it, so the call runs in the sanctioned
  direction (`rule.require.directional-deps`). the `__` prefix is the convention for every function in
  these sourced libs, public or not; it marks "not a cli verb", not "private to one file". the
  predicate is the one place that knows "this machine" has two spellings (`''`, `localhost`), and the
  comment at the call site says a re-derivation is the defect
- **rework**: clean, a rename if the council wants a contract name
- **confidence**: 85%
- **verdict**: open
