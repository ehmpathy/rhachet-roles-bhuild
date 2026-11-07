## .what

new rule `rule.require.flag-name-symmetry` in ergonomist: one argument keeps one flag name across every verb of a noun.

```
rhx phone.contacts set --address <address>
rhx phone.contacts del --address <address>    # not --add on set and --address on del
```

## .why

`rule.prefer.symmetric-term-pairs` covers complementary terms (get/set). it is silent on the flags those verbs share. so a vision drafted `set --add <address>` beside `del --address <address>`, and the human had to ask "why do i see set --add <address> instead of set --address <address>". a human who learns the flag on one verb should never have to relearn it on the next.

also: a flag names the thing (`--address`), never the act (`--add`). the act is already the verb.

## .provenance

`rhachet-roles-bhuild` @ `beav/feat-phone-text`, stone `1.vision`.

## .the forbid pair — ship both

a forbid bites faster than a require: a reviewer greps for a forbidden shape, but must reason to spot an absent one. so ship the twin:

**`rule.forbid.asymmetric-flag-names`** — one argument under two flag names across a noun's verbs, or a flag named for the act:

| 👎 forbidden | 👍 instead |
|---|---|
| `set --add <x>` beside `del --address <x>` | `--address` on both |
| `--add`, `--remove`, `--grant`, `--revoke` | the noun: `--address` |

## .enforcement (proposed)

- one argument under two flag names across a noun's verbs = blocker
- a flag named for the act and not the thing (`--add`, `--remove`) = nitpick
