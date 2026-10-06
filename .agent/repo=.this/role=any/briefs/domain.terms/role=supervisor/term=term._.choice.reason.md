# domain.term.choice.reason: term

## .etymology

`term` is the clipped form of **terminal**, and the clip is deliberate on three counts:

1. **it matches its peer.** `duct` and `term` are both one syllable, four letters, and they sit
   side by side in every table, every uri, and every skill family. `duct` / `terminal` reads as
   a pair of unequal weight; `duct` / `term` reads as two halves of one substrate layer
2. **`terminal` is ambiguous.** it names a tty, an emulator, an endpoint of a graph, and — in
   this very fleet — a **route-review verdict** (`isReviewPeerVerdictTerminal`, the four states
   that unlock the next level). the clipped form collides with none of those
3. **it is kitty's own register.** the substrate is a kitty window; `term` is what its docs and
   its socket protocol call the surface

## .the rejected synonyms

| ⛔ word | why it was refused |
|---|---|
| `terminal` | the unclipped form. ambiguous three ways (see above), and **`terminal` is TAKEN** by the driver vocabulary — a reviewer verdict is `terminal`, and that word decides whether a route level unlocks |
| `window` | the closest rival, and it is what a term physically IS. refused because it is the **substrate's** word rather than ours — kitty owns it, and a rename of the emulator would strand it. it also cannot name the tab layer, so `window` + `tab` needs two borrowed words where `term` + `tab` needs one |
| `tab` | ⛔ **not a synonym at all — a PART.** one term carries one tab per role. to accept `tab` here would collapse a container into its contents, and `crew.show --role mechanic` depends on exactly that distinction |
| `pane` | TAKEN, and on the other axis. a pane is a tmux subdivision inside a **duct**. one word, two layers, two axes — the worst available collision |
| `tty` | names the kernel device, not the surface a human reads. a duct has a tty; a term is what renders it |
| `console` | os-level, and it carries a single-system-console sense that is false here — there are many terms |
| `screen` | collides with GNU `screen`, a direct rival of the tmux the duct layer runs on |
| `view` | names the **axis**, never the object. a crew has a work axis and a view axis; the object on the view axis is a term. to use `view` for both is to lose the ability to say which one you mean |

## .disputes

### dispute: term (sense 2, a domain word) — raised 2026-09-01 — status: OPEN

- raised.by = beaver 🦫 (supervisor), at the moment this cluster was authored
- claim = `term` already means **a domain word** across this repo's whole glossary machinery:
  the `domain.terms/` directory, every `term=<x>._.choice._.md` filename, the
  `learn.domain.terms` skill, `rule.require.domain-term-itemization`,
  `rule.forbid.domain-term-synonyms`, and the stop-hook that nudges the distillation. that
  sense is older, more widely referenced, and enforced by rules that cite it by name.
- counter = `term` **also** means one window a human reads, and that sense is equally
  entrenched: `termwork.sh` (1500+ lines), five verbs (`term.open/stop/read/send/list`), two
  skills (`term.open`, `term.audit`), the `term://` uri, the `~/.termwork/` registry, and the
  **view axis of every crew** (`crew.show` / `crew.hide`). `define.work-primitive-hierarchy`
  declares it as a stack rung.
- the collision is REAL and it is graded a **blocker** by two extant rules —
  `rule.forbid.domain-term-synonyms` (*"one concept per term — do not overload"*) and
  `rule.forbid.ambiguous-labels` (*"one term overloaded across two concepts = blocker"*).
- ⚠️ the sharpest evidence is this cluster's own filename: **`term=term._.choice._.md`** is
  sense 2 applied to sense 1. a reader who meets that path cannot tell which sense the file is
  about until they read it.
- resolution = **UNSETTLED, on purpose.** both senses are entrenched, both have rules and code
  that cite them, and a unilateral rename would break one of two large surfaces. the choice is
  the human's; the options are enumerated below rather than decided here.

#### the options, un-ranked

| option | what moves | what it costs |
|---|---|---|
| **keep both, part by context** | naught | the ambiguity stays; a reader pays a context check per read. this is the status quo, now written down |
| rename sense 1 | `term.*` → e.g. `pane`(⛔ taken) / `sill` / `glass` | 5 verbs, 2 skills, a uri scheme, a registry dir, the hierarchy brief, `crew.show`'s output |
| rename sense 2 | `domain.terms/` → e.g. `domain.words/` | every cluster filename, the learner skill, 3+ rules, the stop-hook, the glossary readme |
| qualify both | `termwork` stays; the glossary says `domain term`, never bare `term` | cheapest real fix — but it relies on discipline, so it decays |

**the supervisor's read, offered as a claim rather than a verdict:** the fourth option is the
only one whose cost is bounded, and its decay is the reason it is not obviously right. the
glossary already writes `domain term` in prose most of the time; what is bare is the
**filename prefix**, and that is one mechanical rename away from unambiguous.

## .evidence

### the registry settles window-vs-tab

`termwork.sh:209` writes one record per **pid**:

```bash
__term_register() {
  cat > "$TERMWORK_DIR/$pid.json" <<EOF
{ "pid": $pid, "socket": "...", "cwd": "...", "duct": "...",
  "host": "...", "tabs": [], "startedAt": ... }
EOF
}
```

a term is therefore one **process** — a kitty window with a socket — and `tabs` is a field
inside it. observed live 2026-09-01:

```
🖥️  term://rhachet_beav_fix-test-tempdir-leak tab 'mechanic' found (in pid 3525692)
🖥️  term://rhachet_beav_fix-test-tempdir-leak tab 'foreman'  found (in pid 3525692)
```

two tabs, **one pid**. so the containment is real and the hierarchy brief's row
(`| term | one window | a kitty tab a human reads |`) names both halves in adjacent columns
without a decision between them. **corrected in the say file; the brief is owed the same fix.**

### the re-register defect that proves tabs are the fragile half

`__term_register_keep_tabs` exists (`termwork.sh:237`) because the plain register writes
`"tabs": []`, which is right for a fresh spawn and wrong for a re-run:

> *"a second `--for mechanic` used to erase the foreman entry written by the first
> `--for foreman` — a re-run that destroyed a peer tab's record instead of a no-op"*

that is the containment made concrete: an operation on the WINDOW clobbered a peer TAB. a
vocabulary that used one word for both could not have stated the defect, let alone its fix.

### the uri notations disagree — dots vs underscores

| layer | notation |
|---|---|
| duct | `duct:///rhachet.beav.fix-test-tempdir-leak/mechanic` — **dots**, role as a path segment |
| term | `term://rhachet_beav_fix-test-tempdir-leak` + `tab 'mechanic'` — **underscores**, role as a tab name |

the underscores are tmux's — it forbids `.` in a session name and silently rewrites it, which is
the same canonical-key hazard `term=ledger` records. the term layer inherits the rewritten form
rather than the true tree name.

⚠️ so **a tree name is not a safe join key across the two layers.** any instrument that joins a
duct to its term must canonicalize first, exactly as `__crew_canon_name` does for the crew
ledger. `term.audit` is the one instrument that performs this join today.

### `term.read` / `term.send` mirror `duct.read` / `duct.send`

both layers expose a read and a send, so one pane's text is reachable two ways. they are not
redundant — the duct pair addresses the **tmux session** (and works with no display at all,
which is why every remote grove depends on it), while the term pair addresses the **kitty
surface**. a supervisor reaches for the duct pair, always; the term pair serves a human at a
keyboard.

this is also why `termwork` has **zero clamps** while `ductwork` has a full suite: kitty needs a
display, and CI has none. that gap is named in both eject seeds rather than left to be found
(`define.work-primitive-hierarchy`).

## .why the cluster was owed

`term` is leaned on by 5 verbs, 2 skills, a uri scheme, a registry, a stack rung, and one of the
two axes every crew is made of — and it had no cluster, while its exact peer `duct` has had one
since r44. that is the gap `rule.require.domain-term-itemization` exists to end.

⚠️ **`term=replication`'s party-count gate does not block it.** that gate blocks an INVENTED
distinction, never a RECORDED one — and the window/view distinction is recorded three times over
(`define.work-primitive-hierarchy`'s stack, `term=crew`'s work-vs-view axes, and `term.audit`'s
whole reason to exist). the gate had no question left to ask.

## .see also

- `term=duct._.choice._.md` — the peer on the work axis, and the row/session split this mirrors
- `term=crew._.choice._.md` — the work/view axes, and why the verbs never cross
- `define.work-primitive-hierarchy.md` — the stack, and the ambiguous row this corrects
- `rule.forbid.domain-term-synonyms` — the rule the sense-1/sense-2 collision violates
- `rule.forbid.ambiguous-labels` (ergonomist) — *"one term overloaded across two concepts = blocker"*
- `howto.domain-term-disputes.[guide].md` — the shape the open dispute above follows

---

written by human + beaver 🦫
