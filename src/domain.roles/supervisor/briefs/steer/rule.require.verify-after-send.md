# rule.require.verify-after-send

## .what

after every send, verify via a read that the command did what you expected.

the verbs are `rhx git.crew.send` and `rhx git.crew.read`, addressed by TREE and
ROLE. a supervisor never types a `duct.*` call or a duct uri
(`rule.always.entool-the-layer-you-drop-below`). the `duct.*` spellings below are the
SUBSTRATE those crew verbs call — they appear only because this rule's evidence is
about ductwork itself, a legitimate drop.

## .why

- commands can fail silently
- shell state may differ from expectations
- typos and edge cases surface only on read
- blind send chains compound errors

## .pattern

```bash
# send command
rhx git.crew.send --tree <tree> --who <role> --what 'some command'

# verify result
rhx git.crew.read --tree <tree> --who <role>
```

## .what to check

- no error messages in output
- expected side effects occurred
- shell prompt returned (command finished)
- exit code if visible

⚠️ **never chain sends.** three `crew.send` calls with no `crew.read` between them make every
error invisible, and the first failure poisons the two that follow.

## .the same rule holds for an EDIT — verify by read-back

an `Edit` is a blind write with the identical failure shape. the tool reports
success on the substitution it performed; it says naught about what that
substitution DISPLACED, or whether the write landed whole.

**after every Edit to a durable artifact, read the edited region back.**

| | a duct | a file |
|---|---|---|
| what the tool reports | `sent` | `updated successfully` |
| what it does NOT report | whether the message was consumed | what the write displaced, or truncated |
| how the defect reads | a stranded message reads as success | a split clause reads as success |

a stranded message costs a mechanic a turn. a displaced line costs a durable artifact
its sense, and the artifact is what a later round trusts.

⚠️ to know the cure is no protection — the success report reads the same either way.

### what to check

- the region you edited holds what you intended, whole
- the line **before** and **after** your edit are intact — a bad `old_string` match damages its
  neighbors, never itself
- for an append: the file ends where you meant it to, with its final punctuation and separator

⇒ and **never repair an artifact in the same Edit that appends to it.** a repair and an append
are two claims; bundled into one write, a reader cannot tell which half failed, and neither can
you.

## ⚠️ the payload can be eaten BEFORE the send — quote it

one layer upstream of the Edit half: **the shell rewrites the payload before the
tool ever sees it**, and every verification below that layer comes back clean — the
registry, the pane, and the tool's own report all agree, because all three describe
the MUTATED string.

the instrument is honest and the inference off it is not: *"a message was
delivered"* is true while *"MY message was delivered"* is false (`false-report`,
reader-inference family).

### the cure is at authorship, one character

| the form | verdict |
|---|---|
| ``--what "… `cmd` …"`` | ⛔ bash expands `` ` ``, `$`, and `\` before the tool runs |
| ``--what '… `cmd` …'`` | ✅ single quotes pass the bytes through |
| `printf '%s' '…' \| … --what @stdin` | ✅ the paved form for a multi-line payload |

> **a payload is an ARTIFACT, and the shell is a layer that rewrites artifacts.**

⇒ and this is why the rule's read is a **compare**, never a confirmation: only what landed in
the pane, held against what you MEANT to send, parts the two. the worked case is kept in this
package's source repo:
`.agent/repo=.this/role=any/briefs/evidence/role=supervisor/rule.require.verify-after-send.reason.md`.

## .enforcement

- a send without a subsequent read = **blocker**
- a `duct.send` / `duct.read` typed by a supervisor, where a crew verb exists = **blocker**
  (`rule.always.entool-the-layer-you-drop-below` — the substitution table)
- an Edit to a durable artifact (a brief, a journal, a term cluster, a yield) with no read-back =
  **blocker**
- a repair and an append bundled into one Edit = **nitpick**
- a `--what` payload passed in a **double-quoted** shell string, where it holds `` ` ``, `$`, or
  `\` = **blocker** (the shell rewrites it before the tool sees it, and every check below that
  layer agrees with the mutation)
- a read-back that confirms *a* message landed, without a compare against what you MEANT to
  send = **nitpick** (it answers the wrong half of the question)

## .see also

- `term=partial-audit._.choice.reason.md` — the seventeenth instance, where an audit WROTE
- `term=false-report._.choice._.md` — the discriminators the payload section runs, and the
  reader-inference family it lands the eaten-payload case in
- `rule.require.trust-but-verify` (mechanic) — the general form: verify the claim, and the
  instrument that produced it

---

written by human + beaver 🦫
