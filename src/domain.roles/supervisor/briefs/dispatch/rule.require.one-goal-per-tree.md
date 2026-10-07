# rule.require.one-goal-per-tree

## .what

tree ↔ goal is strictly 1:1. every task that earns a tree earns a goal of its own.

```
crew  ↔  tree  ↔  branch  ↔  pr  ↔  goal          1:1:1:1:1
└─ term=crew ────────────────┘
      └─ rule.require.one-pr-per-worktree ─┘
                                      └─ THIS ─┘
```

`term=crew` settles `crew ↔ tree ↔ branch ↔ pr`. `rule.require.one-pr-per-worktree` settles
`worktree ↔ branch ↔ pr`. this settles the last link — the queue's view of the same unit. every
instrument now agrees: tmux sees a crew, git sees a branch, github sees a pr, `eco.priority`
sees a goal.

## .why — a bundled goal has ONE status field and N answers

a priority row carries exactly one `--status`: `enqueued` · `inflight` · `done` · `held`. bundle
two tasks into one goal and that field lies about at least one of them, always — the store
derives real behavior from it:

| what reads `status` | what a bundled row does to it |
|---|---|
| `--ready` — "what can i start right now" | half-startable reads as fully ready or fully blocked |
| `partsOpen` / a part gates its whole | a whole unblocks while real work is open beneath it |
| the phase render (🌲🌾 vs 💧👋) | one glyph for two efforts at different phases |
| `--gates` / `--gated-by` | a gate keys on slug, so half a bundle cannot gate a peer |

and the rollup's count goes wrong in the direction that hides work: N tasks report as 1 row, so
the queue under-states what is owed and reads complete (`term=partial-audit`).

## .the misapplied argument this rule corrects

`define.eco.goal-slugification` §4 holds that depth costs rows, each with a human-authored
sev/urg — the reason to keep the tree shallow. this rule's error is to apply that law to
BREADTH instead:

| §4 governs | this rule governs |
|---|---|
| DEPTH — rungs between root and leaf | BREADTH — how many leaves |
| a container rung has no independent severity | a task leaf has a real severity a human can defend |
| a rung minted to be tidy costs a fabricated opine | a leaf per task costs an honest one |

the two laws never collide. §4 argues against a rung nobody needed; it says naught about how
many real tasks there are. a bundle does not save a human a judgment — it denies one they were
owed. "fewer rows to grade" is the tell: the count of tasks is a fact about the work, never a
budget the author may spend down.

## .the test

> **could these two halves land in separate PRs?**

yes → two tasks, two goals. no → one task, one goal. the same question
`rule.require.one-pr-per-worktree` already asks — if the pr split and the goal split are each
1:1 with the tree, the goal split is settled by a question already answered.

| when… | then… |
|---|---|
| you would list 2+ issue numbers on one row | 🔴 that list IS the cue — one row each |
| a row's `--ref-tree` names 2+ live trees | 🔴 two efforts, one status field — split it |
| you bundle to spare the human sev/urg calls | 🔴 §4 misapplied — you removed a judgment owed |
| a row is `inflight` and you cannot say what is done | the status already lies |
| one task spans 5 files, or 3 repos | ✅ one goal — the unit is the deliverable, not file count |
| a task has no tree yet — a seeded issue | ✅ still its own goal — the tree is the 1:1 witness, not the trigger |
| two issues genuinely ship as one pr | ✅ one goal — they were one task |

## ⚠️ .the bound — the unit is the DELIVERABLE

not a mandate to mint a goal per file, commit, or review round. the unit is exactly what
`rule.require.one-pr-per-worktree` names: one deliverable, one pr. a task that touches 5 files
is one task. a task that surfaced 4 upstream defects is five tasks — itself, and the four —
because each ships on its own.

## 🟡 .the store PERMITS what this rule forbids

`--ref-task` and `--ref-tree` are both repeatable, so the store accepts N trees on one goal
with no flagged defect. this rule is unenforced by the tool, so its violations look like a
clean row. the checkable form is narrow enough to entool: a row whose `--ref-tree` names two or
more trees simultaneously live in the crew ledger.

## .enforcement

- 🔴 a goal that names two or more tasks = **blocker** (its one status field cannot answer for
  both)
- a row whose `--ref-tree` carries two or more live trees = **blocker**
- a bundle justified by the cost of a human's opine calls = **blocker** (§4 governs depth; a
  task count is a fact, never a budget)
- a sprouted tree with no goal row = **blocker** (the queue is blind to work in flight)
- a goal split finer than a pr — per file, commit, or review round = **nitpick**

## .see also

- `rule.require.one-pr-per-worktree` — the middle links of the chain this completes
- `term=crew._.choice._.md` — the `crew ↔ tree ↔ branch ↔ pr` link at the other end
- `rule.require.single-purpose-worktrees` — one purpose per worktree; the queue-side twin
- `define.eco.goal-slugification` — §4 governs DEPTH, often confused with this rule
- `define.invariant.eco.a-part-gates-its-whole` — the derivation a bundled status corrupts
- `term=partial-audit._.choice._.md` — a count that reads complete

---

written by human + beaver 🦫
