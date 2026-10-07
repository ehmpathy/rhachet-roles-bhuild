# domain.term: read

term.chosen   = read
term.kind     = verb
term.synonyms.forbidden:
- get
- fetch
- pull
- peek
- view
- inspect
- capture
- dump
- tail
- cat

## .what

to **observe a surface we do not own, at one moment, without touch** — a pane, a box, a
ledger row.

```
rhx git.crew.read  --tree <slug> --who mechanic one crew's clone, by role   ← the SUPERVISOR's
rhx duct.read      --on <duct>  --lines 20      one clone's pane            ← the substrate
rhx duct.read      --on <duct>  --raw           the same, ANSI kept
```

⚠️ **the order above is the mandate, not a preference.** a supervisor calls `git.crew.read`,
addressed by TREE and ROLE; `duct.read` is the substrate it wraps, and a supervisor does not
type one (`rule.always.entool-the-layer-you-drop-below`). the two are **one verb at two
layers**, never two verbs — which is why they share this cluster rather than split it.

the symmetric twin of `term=send`. a send puts a payload into a destination that is not
ours; a read takes an observation out of one. same boundary, opposite direction.

## 🔴 .a read is a SNAPSHOT, never a lookup — which is why it is not `get`

`rule.require.get-set-gen-verbs` (ehmpathy/mechanic) makes `get` the canonical retrieval
verb, so `read` looks at first like a forbidden synonym of it. it is not, and the split is
the whole reason this term exists:

| | `get` | `read` |
|---|---|---|
| the subject | a store **we** own | a live surface a **clone** owns |
| the answer | true until we change it | **stale the instant it returns** |
| a re-run | same input, same output | may differ, with no input changed |
| what it proves | the value | the value **at that moment**, and no later |

⇒ so a `get` is idempotent by construction and a read is not — it observes a thing that
moves. to call it `get` would promise a stability the surface cannot give.

that promise is what `rule.require.verify-after-send` is built on: a read justifies a send,
and between the two the destination may move. **the read was never wrong; it aged.**

## .the guarantee: a read NEVER touches the work

a read is read-only, and no flag relaxes it. it sends no key, answers no modal, stops no
duct. that is what makes it safe to run on a whole fleet in parallel, and it is why a
supervisor may drill in freely without a grant.

## .a read is ONE subject — a sweep is a `poll`

`rule.require.bulk-over-byhand` grades a loop of reads as a blocker. the verbs are not
interchangeable:

| want | verb |
|---|---|
| the whole fleet, one call | `poll` (`term=poll`) |
| ONE subject a sweep already NAMED | `read` |

⇒ a read is a **drill-in**, and it is legitimate only downstream of a sweep that chose its
subject. a read reached for as a scan is the defect that rule names.

## ⚠️ .the three ways a read has lied, and all three are about SCOPE

the verb is honest; every defect on record came from a read whose **subject set** was
narrower than its verdict implied (`term=partial-audit`):

| the lie | what happened | the cure |
|---|---|---|
| the wrong **end** | `--lines N` trimmed scrollback, never the tail. `capture-pane -S '-N'` with no `-E` ends at the pane bottom, so it returned N lines of history **plus the entire visible pane** — `--lines 1` yielded 30. anything downstream clipped the **tail**, which is exactly where a modal's options live | `\| tail -n "$lines"` on all four capture paths (2026-09-03) |
| the wrong **box** | the localhost-default family — `term.audit` hardcoded `localhost`, `crew.show` defaulted `--grove local`. each returned a truthful answer about a machine the caller never asked about | derive the box from the ledger (`__crew_ledger_grove_of`) |
| the wrong **intensity** | a plain read is color-blind, so prefilled (white, typed) and ghost (gray, autocomplete) render identically. an Enter on the second submits words the human never wrote | `--raw`, before any keystroke (`rule.require.distinguish-prefilled-from-suggested`) |

> **a read reports what it looked at. it never reports what it did NOT look at** — so the
> scope is the caller's to establish, every time.

## .read is NOT

- **`get`** — see the snapshot split above. a get promises stability a live pane cannot give
- **`show`** — TAKEN, and it is the opposite axis: `crew.show` OPENS a window for a human
  (`term=crew`, the view axis). a read opens no window and is invisible to the clone
- **`poll`** — TAKEN. a poll derives its own subject set across the fleet; a read is handed one
- **`audit`** — TAKEN, and it JOINS two axes (work × view). a read observes one surface
- **`peek`** / **`view`** — imply a glance a caller may skip. a read is the paved drill-in a
  `🚧 PROMPT` verdict **requires** before any key is sent
- **`tail`** / **`cat`** / **`capture`** — name the mechanism, never the motive. the mechanism
  is `capture-pane`, and it changed under us once already

## .refs

declared at `.agent/repo=.this/role=any/skills/`:

- `duct.read.sh` — `--on`, `--lines`, `--raw`
- `work/ductwork.sh` — `__duct_read`, and the `| tail -n` that fixed the trimmed end
- `git.crew.read.sh` — the crew-layer verb, added 2026-09-03
- `work/crewwork.sh` — `crew.read`, and `--who all`
- `git.crew.poll.sh` — the sweep a read drills in beneath

## .reason

see `term=read._.choice.reason.md` — etymology, the rejected `get`, and the evidence.

---

written by human + beaver 🦫
