# rule.require.verify-after-send.reason

the dated record behind the rule. three mechanisms, each caught live.

## .the two Edit instances that paved the read-back half — 2026-08-15

| the Edit | what the success report concealed |
|---|---|
| an append to a journal | the `old_string` matched mid-sentence, so the append **split a past round's clause** and stranded its real words 100 lines away. undetected for a full round |
| the Edit that recorded the above, and paved this rule | the SAME defect: `old_string` ended mid-sentence, so a whole new round landed **inside** the prior round's final clause and stranded `this single case.` 136 lines away, past the file's own end |

both were the supervisor's own, one round apart. **the second is the sharper on two counts.**

1. it was committed in the very Edit that paved this rule — so to know the cure is no protection
   against the defect, because the success report reads the same either way.
2. it produced a **false diagnosis**: the stranded tail read as a past round's truncation, so the
   round indicted its predecessor for damage it had itself done minutes earlier.

the read-back caught it in the same round. that is the rule's only proof of teeth to date, and it
is a proof against its author.

## .the payload the shell ate — 2026-09-01

a steer was sent as:

```bash
rhx duct.send --on "duct:///$tree/mechanic" --what "…run it without `> /dev/null`…"
```

markdown backticks inside a **double-quoted** bash string. bash read them as **command
substitution**, executed the fragment, and replaced it with its (empty) output. the send
reported success. the mechanic received a steer with its most concrete clause silently absent.

⚠️ run the `false-report` discriminators on the send and it clears BOTH:

| | verdict |
|---|---|
| d1 — did the tool fail? | **no.** it sent, cleanly, exactly what it was handed |
| d2 — is the content untrue? | **no.** *"this text was delivered"* is true of the text it received |

so the false sentence is the SENDER's: *"MY message was delivered"*, inferred from *"A message
was delivered."* the two are byte-identical in the report and part only at a layer the
instrument cannot see — it is handed a string and has no view of the string you typed.

⇒ this lands in `false-report`'s **reader-inference** family: the instrument is honest and the
inference off it is not.

## .why no check below the shell can catch that third one

the registry, the pane, and the tool's own report all agree — because they all describe the
**mutated** string. only a read of what actually landed in the pane, compared against what you
MEANT to send, parts the two.

that is the one job no other instrument in the stack can do, and it is why the rule's read is a
compare rather than a confirmation.

---

written by human + beaver 🦫
