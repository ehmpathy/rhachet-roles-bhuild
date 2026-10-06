# rule.always.render-priorities-as-treestruct

## .what

when you show the priorities to a human, render the **treestruct** —
`rhx eco.priority get --output rootstruct` — never the flat opine-rank table (`--output tree`),
and never a hand-built table.

the rank table answers one question: *what do i work first?* the treestruct answers what a
human actually asks of a board — *how does the work decompose, what rolls up into what, where
is each branch?* — with sev·urg, orchestration state, and gain on every node.

## .why

the flat table is N rows with no structure. a reader cannot see which whole a piece serves,
which pieces a whole is gated by, or where a branch sits in the decomposition.

a hand-built 17-row table drew "this table is unhelpful". the same board as a treestruct read at
a glance — org → initiative, each with its pieces, propagated gain and sev·urg on every node.
one glance replaced seventeen reads.

⇒ the treestruct is the decomposition datastruct made visible
(`define.eco.decomposition-vs-orchestration`). the flat rank is the timeline's sort. a human
who wants the whole shape of the work wants the tree, not the sort.

## .how

- **display** — `rhx eco.priority get --output rootstruct`. the skill already emits it; reach
  for it, never hand-build a table
- **the rank stays available** — `--output tree` (opine-sorted) answers "what first" on
  explicit request. a lens, not the default view
- **never** paste a markdown table of the rows into a report where the treestruct would serve

## 🔴 .emit the rootstruct verbatim

run the skill AND paste its rootstruct output verbatim into your reply. the tool-call stdout is
invisible to the human — a skill run whose output stays in the tool result answered a question
the human cannot read.

⇒ "render the treestruct" is two acts: run it, then echo it. a run with no paste is a
`term=partial-audit` from the human's seat.

- do not summarize it into prose — the structure IS the answer
- do not re-sort or trim it — paste the skill's output as it stands

## .enforcement

- priorities displayed as a flat table — `--output tree` or hand-built — where the treestruct
  would serve = **blocker**
- a hand-built table when the skill's `--output rootstruct` already emits the view = **blocker**
  (a re-derivation of pavement, `rule.always.reuse-pavement`)

## .see also

- `rule.always.forward-a-skill-render-verbatim` (repo=.this/role=any) — the general form; this
  brief is its `eco.priority` specialization
- `rule.require.rock-goal-treestruct` — the goal-uri shape the treestruct renders
- `define.eco.decomposition-vs-orchestration` — the treestruct is the decomposition half; the
  flat rank is the timeline's sort
- `define.eco.rock-taxonomy` — the roots the treestruct rolls up by

---

written by human + beaver 🦫
