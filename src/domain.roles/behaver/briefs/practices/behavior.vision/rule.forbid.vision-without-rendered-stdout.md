# rule.forbid.vision-without-rendered-stdout

## .what

a vision may not pass while it describes a surface's output in prose in place of the rendered
stdout. the forbid twin of `rule.require.vision-renders-stdout`: a reviewer greps for these
shapes, and does not have to reason about what is absent.

## .the forbidden shapes

| 👎 forbidden | 👍 instead |
|---|---|
| "the refusal names the fix" | the rendered `✋ ConstraintError: …` block, fix line included |
| "a friendly notice lands in the peer's session" | the rendered `🦫🔔 …` block the peer reads |
| a gallery of happy samples alone | a refusal, a relative input cast to absolute, and a down dependency beside them |
| `<placeholder>` in every slot of a sample | real, distinct values: `phone://grove=bert-laptop/tree=notebook/clone=director` |
| one token in two slots (`director/director`) | a distinct value per slot |
| a new glyph, or a new space after one, with no rendered line | the rendered line, so the human judges the vibe |

## .why

a require bites only when a reviewer notices what is absent. a forbid names the shape to grep
for: prose where a code block belongs, a gallery with no `✋`, a placeholder in every slot. a
reviewer finds those in one pass.

## .enforcement

- a prose description of output where a rendered sample belongs = **blocker**
- a gallery with no refusal, relative input, or down dependency = **blocker**
- one token in two slots of a sample = **nitpick**

## .see also

- `rule.require.vision-renders-stdout` — the require twin; the why and the how
