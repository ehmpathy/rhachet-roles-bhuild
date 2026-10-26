# rule.always.forward-a-skill-render-verbatim

## .what

when a skill answers a human's question, paste its stdout verbatim into your reply. do not
re-draw it, re-sort it, trim it, or summarize it in its place. a summary may follow; it may
never stand in for the render.

## .why — a tool result is INVISIBLE from the human's seat

the human reads your reply, never your tool results. a skill run whose output stays in the
tool result answered a question the human cannot see, and whatever you type instead becomes
the whole answer to them — one strictly worse than the render you already had:

| the skill's render carries | a hand-drawn copy carries |
|---|---|
| structure the skill computed — rollups, edges, inherited marks | whatever you recalled while typing |
| alignment from real column widths | eyeballed padding |
| every row | the rows you got to |
| a shape a test clamps | a shape no test clamps |

a re-render is also a re-derivation of pavement: a turn spent to rebuild a view the skill
already emits, shipping the worse copy (`rule.always.reuse-pavement-before-improvise`). a
hand-drawn copy has duplicated, mis-nested, and misaligned rows in the past where the skill's
own render flag (`--output rootstruct`) had none and fit one screen.

## .the cues

| when… | then… |
|---|---|
| a skill answers a human | paste its stdout — that IS the answer |
| you are about to type a table of rows a skill just printed | stop — you are re-deriving a view the skill emits |
| the result is too large and got persisted | read the file, then paste. a preview is a partial audit — it chose your subject set for you |
| you want a different shape than the default | check the skill's display flags first (`--output`, `--help`) |
| no flag gives the shape you want | say so, paste the render you have, add your summary beneath it |
| you want to highlight two rows | paste the whole render, then call out the two — never paste only the two |
| the render is ugly or wrong | that is a defect in the skill. repair it (`rule.always.entool-the-layer-you-drop-below`) |
| you catch yourself writing a program to re-draw it | the strongest cue — the view exists; find its flag |

## .the test

would the human see this if you said no word at all? no → it is in a tool result, and it
must be pasted.

## .what a summary is still for

this bans the substitution, never the summary. after the render, say what it means — which
row is actionable, which number is surprising, what you would do first. render first, read
second: a summary alone has deleted the evidence behind it.

## .when a verbatim paste is NOT owed

- the run was for your own diagnosis, and its verdict (not its bytes) is what was asked
- the output is genuinely enormous and the question was narrow — paste the relevant excerpt,
  say it is an excerpt, name the whole command
- the output holds a secret — redact, and say you redacted

none of these license a re-drawn copy of a render you chose not to show.

## .the durable fix

a rule that lives only in an unbooted role's briefs binds no one. prefer a tip the tool
itself prints at the moment of use — it needs no boot and reaches a clone whose briefs never
loaded (`philosophy.entoolment-is-the-pinnacle`). a boot is a property of the session; a tip
is a property of the tool.

## .enforcement

- a skill run to answer a human, no paste of its output = **blocker**
- a hand-drawn copy of a view the skill already renders = **blocker**
- a render re-sorted, trimmed, or re-shaped by hand before the paste = **blocker**
- a paste built from a preview of a persisted result, not the file = **blocker**
- a summary shipped in place of the render = **blocker**; a summary after it = correct
- a render not pasted because the question was narrow, said so = **false positive**

## .see also

- `rule.always.render-priorities-as-treestruct` (role=prioritizer) — the `eco.priority` specialization
- `rule.always.reuse-pavement-before-improvise` (bhrain/learner) — a re-render is a braid
- `rule.always.entool-the-layer-you-drop-below` — a genuinely wrong render is a defect to repair
- `term=partial-audit._.choice._.md` — why a preview of a persisted result is not a read
- `rule.require.specialize-a-rule-its-readers-look-past` (bhrain/learner)

---

written by human + beaver 🦫
