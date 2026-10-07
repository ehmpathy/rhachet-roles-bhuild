# F12 — does `#387`'s out-of-scope on the `subrock://` uri shape bind the lifted briefs?

- **rework** = clean
- **status** = best-guessed at **5.1.execution**
- **confidence** = 82%
- **where** = `src/domain.roles/prioritizer/briefs/` — the four artifacts `#387` names, plus the
  two whose subject IS the format (`rule.require.rock-goal-treestruct.md`,
  `define.eco.goal-slugification.md`)

## .the fork, stated fairly

`#387` puts the uri shape out of scope, by name:

> **out of scope:**
> - the specific `bigrock`/`altrock`/`subrock` uri shape. it is how `nheuron` happens to write a
>   root/path split, and a bhuild prioritizer may denote the same tree differently. **what travels
>   is the relation and its consequences, never the string format**

and its scope clause repeats it:

> cite `nheuron` as the worked example rather than import its uri scheme, its column names, or its
> verb names.

the lifted briefs use `subrock://` throughout — `subrock://ahbode.decost/twilio-waste`,
`subrock://twilio-tune/waste-alert`, `subrock://never-declared/a/b`.

| read | the claim | consequence |
|---|---|---|
| **(a)** — taken | the uri appears in **worked examples**, which `#387` explicitly requested. the four artifacts state the RELATION normatively; the format is illustration | satisfied as ported. no change |
| **(b)** | the corpus makes the format **normative** — two briefs' whole subject is the slug shape — so the relation cannot be read apart from it | the four owe a format-independence note, and the two format briefs owe a scope marker |

## .taken, and why — at the time

**(a)**, on three grounds:

1. **`#387` asked for the worked example and supplied it.** its own `.the measured evidence` table
   cites `subrock://never-declared/a/b` as the proof a shape check is not integrity. a brief that
   carries that example carries what the issue handed it.
2. **the relation IS stated independently.** `a-part-gates-its-whole` grounds the block in what
   *part* denotes, and `a-surgoal-must-be-declared-first` grounds the refusal in a reference check
   — neither derives from the string format. the nature/nurture labels survive and cross-cite
   (`:160-161`, `:133`), which is `#387`'s own named clamp.
3. **`F2` already settled the home question this rests on.** the `eco.*` / `goal.*` vocabulary lives
   under `role=prioritizer`, which is why `#302` is satisfied — the prefix matches its bounded
   context. ⇒ the role moved, so its ubiqlang **is** bhuild's now, and `subrock://` is that ubiqlang
   rather than a foreign import.

## 🔴 .why the confidence is 82% and not higher

two reasons, and the second is the sharper one:

- **`#387` is more specific than `#388` on exactly this point.** `#388` said *"its column names or
  its verb names"*; `#387` adds *"its uri scheme"* and then names the three prefixes. a clause that
  enumerates is harder to read as loose than one that gestures.
- 🔴 **the lift carries two briefs whose SUBJECT is the format** —
  `rule.require.rock-goal-treestruct.md` and `define.eco.goal-slugification.md`. those are not
  among `#387`'s four, and `#387` does not forbid them. but their presence makes the format
  normative **for the role**, which is a stronger claim than *"used in an example"* — and a
  reviewer could fairly say that is the import `#387` declined.

⚠️ **and the honest bound on read (a)'s third ground**: `F2` settled where the vocabulary LIVES. it
did not settle whether a vocabulary that travels unchanged counts as *"bhuild's own"*. I stretch
`F2`'s verdict one step past what the council actually said.

## .why the rework is CLEAN

under **(b)** the repair is a doc edit in files already in this diff:

- a format-independence note on each of the four (*"the relation binds; the uri shape is one way to
  write it"*)
- a scope marker on the two format briefs (*"this brief is nurture about a surface, not about the
  relation"*)

no caller, no contract, no test, no rename. ⇒ a reviewer who takes **(b)** overrules a note.

## .the council's question, in one line

> **does a vocabulary that travels with its role count as "bhuild's own", or did `#387` ask for the
> relation to be restated free of `subrock://`?**

## .see also

- `F2` — the home verdict this leans on, and one step past
- `#302` — terms scoped by prefix to a bounded context; the reason `F2` satisfies it
- `#388` — the same scope clause, one notch looser, judged satisfied on the same grounds

---

written by human + beaver 🦫
