# rule.require.vision-renders-stdout

## .what

a vision for a surface a human or a clone reads — a cli, a hook, a notice, an error — **renders the
exact stdout** of that surface, character for character, before the vision passes. it does not
describe the output in prose.

the gallery covers:

- **every critipath**, happy and sharp alike
- **the refusals** — each ConstraintError and MalfunctionError, with its header, its tree, and the fix it names
- **the relative inputs** — a shorthand (`local`, `@:<clone>`, a default) and how it reads once cast
- **the down dependencies** — a peer absent, a daemon down, a tunnel closed
- **what a peer receives** — not only what the caller sees, but what lands on the other side

## .why

- **vibes are a decision, and a decision belongs in the vision.** the glyph, the space after it,
  the tone, the order of branches, the name the fix gives: each one is a choice a human wants to
  make. made in code, they are made by default, and are found only at the verification snapshot,
  when a change is a rework
- **a rendered sample is falsifiable; a description is not.** "a friendly refusal that names the
  fix" passes any review. the rendered refusal shows whether it does
- **the sharp cases teach the design.** a happy gallery hides the grammar's hard edges. on the
  phone vision, the cross-grove pull, the down tunnel, and `local` typed on a remote grove were the
  samples that exposed design gaps; a happy-only gallery showed none of them
- **it is cheap here and dear later.** a rendered block costs minutes at the vision. the same
  correction at the snapshot costs a code change, a resnap, and a re-review

## .how

- add a `.the outputs` section to `1.vision.yield.md`, or render the stdout inside each
  `case=N` timeline under its `then`
- render the extant pattern of the role: its voice glyph, its role mark, its treestruct, its blank
  lines. reuse a peer skill's shape before you invent one
- fill each slot with a distinct, realistic value. no `foo/foo`, no `director/director`
- show the absolute form wherever the input was relative

## .see also

- `rule.forbid.vision-without-rendered-stdout` — the forbid twin; the shapes a reviewer greps for
- `rule.require.experience-coverage` — the experiences these samples render
- `howto.experience.demonstrate` — where the stdout sits in a case timeline
- `rule.require.treestruct-output` (ergonomist) — the shape the samples take

## .enforcement

- a vision for a human- or clone-read surface with no rendered stdout = **blocker**
- a gallery with no sharp sample (no refusal, no relative input, no down dependency) = **blocker**
- a sample whose slots repeat one token for two slots = **nitpick**
