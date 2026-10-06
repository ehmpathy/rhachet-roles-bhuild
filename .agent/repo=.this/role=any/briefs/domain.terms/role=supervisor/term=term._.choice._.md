# domain.term: term

term.chosen   = term
term.kind     = noun
term.synonyms.forbidden:
- terminal
- window
- tab
- pane
- tty
- console
- screen
- view

## .what

**one window a human reads**, addressable by a uri:

```
term://<tree>                  a kitty window, with one TAB per role
term://<tree> tab 'mechanic'   one role's view within it
```

it is the bottom rung of the work-primitive stack, and the **view** half of a crew's two axes.

## .the two parts a term is made of

this is the distinction the word most needs, and it is the one the extant declaration gets wrong:

| part | what it is | where it lives |
|---|---|---|
| **window** | one kitty process — a pid and a socket | `~/.termwork/<pid>.json` |
| **tabs** | one per role, each bound to a duct | the `tabs: []` array inside that record |

so a term is the **window**, and it CONTAINS tabs. one term, N tabs, one per role:

```
🖥️  term://rhachet_beav_fix-test-tempdir-leak tab 'mechanic' found (in pid 3525692)
🖥️  term://rhachet_beav_fix-test-tempdir-leak tab 'foreman'  found (in pid 3525692)
   └─ ✔ 2 tab(s) — one pid
```

⚠️ **`define.work-primitive-hierarchy` declares this ambiguously** — its table reads
`| term | one window | a kitty tab a human reads |`, which names a window in one column and a
tab in the next. the registry settles it: the record is keyed by **pid**, and tabs are a field
inside it. the say file is the fix; the hierarchy row is owed a correction.

## ⚠️ .the word is OVERLOADED — two concepts, one word, both entrenched

this repo uses `term` for two unrelated things:

| sense | what it means | where |
|---|---|---|
| **1 — a window** | one kitty window a human reads | `term.open` · `term.audit` · `termwork.sh` · `term://` |
| **2 — a word** | a domain word in the glossary | `domain.terms/` · `term=<x>._.choice._.md` · `learn.domain.terms` |

that is an ubiqlang violation by this glossary's own standard —
`rule.forbid.domain-term-synonyms` forbids one term that does double duty, and
`rule.forbid.ambiguous-labels` grades an overloaded term a **blocker**.

**and this file is the proof:** its name is `term=term._.choice._.md` — sense 2 wrapped around
sense 1. the collision is not hypothetical; it is in the filename.

both senses carry real weight and neither is casual, so this is **not settled here**. a dispute
is open in `.reason`; until it closes, both senses stand and a reader parts them by CONTEXT — a
`term.*` verb or a `term://` uri is sense 1; every file under `domain.terms/` is sense 2.

## .a term is NOT

- **a `tab`** — a tab is a PART of a term, never the whole. one term carries one tab per role, so
  to say "term" where you mean "tab" loses the containment that `crew.show --role` depends on
- **a `duct`** — the sharpest boundary in the stack, and the one that governs safety. a duct is
  the **work** (a tmux session, a keyboard); a term is the **view** (a kitty window a human
  watches). `crew.show` touches no duct, and `crew.boot` opens no tab (`term=crew`)
- **a `pane`** — TAKEN. a pane is a tmux subdivision inside a DUCT, one layer down and on the
  other axis
- **a `view`** — `view` names the AXIS a term sits on, never the object. a crew has a view axis;
  the object on it is a term

## .a term's HOST is not ONE value — its tabs can differ

each tab attaches its own duct, and each duct names its own box. so a term is a **container of
hosts**, never a holder of one. that was free while every tab in a window shared a box, and it
stopped to be free the day a LOCAL seat could sit beside cloud ones — the reviewer
(`define.usecase.review-a-grove-tree-locally`).

⇒ so a host mark belongs on the **tab**, and a host mark on the **window** would be a lie: one
glyph cannot describe four tabs that answer from two boxes.

| the mark | where it can go |
|---|---|
| ☁️ cloud · ☘️ local | the TAB title — `__term_tab_label`, one per tab |
| the tree slug | the WINDOW — a term is 1:1 with a tree, so that one value IS true of it |
| 🔴 a host | ⛔ **nowhere on the window.** no single value is true of a mixed one |

⚠️ **the os titlebar is not termwork's to write.** OSC-2 is emitted by each tab's own SHELL, so
it already reports per-tab — and it reports `repo:branch`, never a host. a reader who wants the
titlebar to carry the mark must reach for the shell prompt, never this lib.

⚠️ and the tab mark is DISPLAY ONLY. every lookup keys on the clean slug, which is why
`__term_tab_label` may only ever PREFIX: `__term_tab_match` falls back to `title:$slug`, and
kitty matches a title by UNANCHORED regex. clamped in `termwork.integration.test.ts` [case6].

## .the property that defines it: FREE TO LOSE

a term is the only unit in the stack whose loss costs **naught**:

| unit | lose it | recover it |
|---|---|---|
| **term** | a human closes a tab | `crew.show` — free, both ways |
| duct | `crew.stop` | ⛔ never — a claude conversation is gone |
| tree | `crew.fell` | ⛔ never — the branch and the record go |

that asymmetry is the whole reason the four crew verbs split along work-vs-view rather than
on/off (`term=crew`), and why `crew.open` has no inverse: a composite off-verb would bundle the
free act with the irreversible one.

⚠️ **free to lose is not free to RESTORE unasked.** a closed tab is a human's decision, and
`term.audit --absent` flags every tabless live duct — so the flag is a report, never a mandate.

## .a term can be absent while its duct is LIVE

the two axes drift, and the gap is invisible from either side alone:

```
duct.list   → the session is up          (the work)
term.list   → no tab for that role       (the view)
term.audit  → ✋ no tab                   (the JOIN)
```

a clone whose tab was closed still works, unwatched. that is the state `term.audit` exists to
name, and the reason a `crew.hide` owes the crew a carry-on order
(`rule.require.brief-a-crew-you-hide`) — from inside the duct, a closed tab and a dead operator
are the same silence.

## .refs

declared at `.agent/repo=.this/role=any/skills/`:

- `work/termwork.sh` — `term.open` · `term.stop` · `term.read` · `term.send` · `term.list`,
  and the pid-keyed registry at `~/.termwork/`
- `term.open.sh` · `term.audit.sh` — the skill surface
- `work/crewwork.sh` — `crew.show` / `crew.hide`, the view axis that composes it
- `define.work-primitive-hierarchy.md` — where a term sits, and the row this cluster corrects
- `pattern.terminal-remote-control.md` — duct vs term, the substrate layer

## .reason

see `term=term._.choice.reason.md` — etymology, the rejected `window` and `tab`, the OPEN
dispute over the two senses, and the evidence.

---

written by human + beaver 🦫
