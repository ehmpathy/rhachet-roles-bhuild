## .what

new rule `rule.require.examples-distinguish-slots` in ergonomist:

- an example fills each slot with a value that is **distinct and realistic**. never one token for two slots
- an example set covers the **sharp and relative** cases, not only the happy path: a refusal, a relative input (`local`, a short form), a down dependency, an ambiguous or malformed input

## .why

`rule.forbid.ambiguous-labels` governs labels, not examples. so:

- a vision used `director/director` (tree = `director`, clone = `director`), and a reader cannot tell which slot is which. the human: "why director/director? also sus"
- the stdout gallery showed only easy cases. the human: "dont only choose easy examples". the cross-grove pull, the down tunnel, the relay, and the `local` cast typed on a remote grove were the cases that taught the design, and they were absent

## .provenance

`rhachet-roles-bhuild` @ `beav/feat-phone-text`, stone `1.vision`.

## .the forbid pair — ship both

a forbid bites faster than a require: a reviewer greps for a forbidden shape, but must reason to spot an absent one. so ship the twins:

**`rule.forbid.slot-collision-in-examples`** — one token in two slots of one example:

| 👎 forbidden | 👍 instead |
|---|---|
| `director/director@:director` | `phone://grove=bert-laptop/tree=notebook/clone=director` |
| `foo/foo`, `test/test` | distinct, realistic values per slot |

**`rule.forbid.happy-only-galleries`** — an example gallery for a surface with no refusal, no relative input, and no down dependency.

## .enforcement (proposed)

- one token for two slots in a published example = nitpick
- an example gallery for a surface with no sharp case = blocker
