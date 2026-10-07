# define.invariant.crew.view.all-or-naught

## .what

a crew's window shows **every** live role, or the crew has **no window at all**. a window that
carries some live seats and omits others is a defect.

> **all or naught. never partial.**

## .kind

**nurture.** kitty holds a partial window as happily as a full one, and every clone keeps its
duct either way. we choose the invariant because a human reads a window as a **complete**
picture of the crew, and a partial one lies at a glance.

## .the invariant

```
window(crew) exists  ⟹  ∀ role ∈ liveRoles(crew) : tab(window, role) exists
```

contrapositive, the half that gets misread:

```
window(crew) absent  ⟹  no obligation at all
```

⇒ **an invisible crew is not a defect.** it is the state most of the fleet sits in, most of the
time, and it is correct.

## .why

- **a window states intent.** a human opened it, so they mean to watch this crew — every live
  seat is then owed a tab
- **a partial window lies at a glance, and the glance is the whole point of a window.** a human
  who sees `mechanic foreman reflector` reads *"that is the crew"*; the absent reviewer reads as
  **not present in this crew**, not as absent
- **the failure is silent on both instruments.** `crew.poll` reads the work axis, so a tabless
  seat renders `😶 at work`; `term.audit` reads localhost only, so a grove crew is out of its
  scope entirely — a partial crew is invisible to the fleet's own eyes
- **the inverse costs more than it saves.** to treat every tabless live duct as a defect opens a
  window on every crew in the fleet. the window's existence is the only consent available

## .scope

| case | verdict |
|---|---|
| a crew with no window | ✅ correct. open one when you want it |
| a **dead** duct with no tab | `💀 down` — `crew.boot`'s business, never the view's |
| a tab a human **closed on purpose** | see the counter-argument below |
| a window on a felled tree | debris — `term.audit` renders it `🍂` |

## .the litigation

a supervisor booted 18 reviewer seats, opened one tab by hand, and asked permission for the
rest. the human cut the naive rule (*"a live duct owes a tab"*) to the true one:

> *"we only care about partial tabs"*
> *"we expect fully invisible crews"*
> *"just not partially visible — all or naught"*

## .the counter-argument

> *"a human may close ONE tab on purpose. an invariant that reopens it fights them."*

does not overturn the invariant: (1) the cure, `crew.show --roles <role>`, is per-role by
construction and reopens no tab closed on purpose — it adds only the absent seat; (2) a
deliberately-closed single tab and a never-opened one are byte-identical from the registry, so
the invariant is stated over what is observable. the honest residue: a human who closes one tab
of four gets it back on the next heal. the remedy, if this bites, is a **declared** closed-tab
record — never a weaker invariant.

## .what would overturn it

- a registry that records a deliberate tab close, so intent becomes observable
- evidence that humans routinely watch a crew partially on purpose, at a rate that makes the
  repair the annoyance rather than the cure
- a view layer where tabs are not the unit — if a window renders every role in one pane, the
  invariant dissolves rather than relaxes

*"i would rather it left my window alone"* is not admissible on its own.

## .enforcement

- a crew whose window exists, with a live role absent from it = **blocker**
- a repair that opens a window on a crew that had **none** = **blocker** (the louder inverse
  error)
- a repair that **rebuilds** a human's window rather than adds the one absent tab = **blocker**
- a dead duct reported as a view defect = **blocker**
- a crew with no window at all, left alone = ✅ **correct**, never a violation

## .the mechanism

`git.crew.heal --what view` carries it. `__crew_heal_tab` in `crewwork.sh` is the check:

```
no live duct for this role      -> 2   (crew.boot's business)
no window for the crew          -> 3   (expected — the invisible case)
window holds this role          -> 3   (whole)
window exists, role absent      -> 0   🫥 the defect. crew.show --roles <role>
```

swept 2026-09-13: 14 partial crews, every one at `mechanic foreman reflector` with `reviewer`
absent — because `crew.boot` opens no tab and `crew.heal`'s role list was the literal `mechanic
foreman reflector`, so the seat was invisible to the one verb named for crew health.

## .see also

- `term=crew._.choice._.md` — the work/view split this invariant governs the view half of
- `rule.always.read-both-crew-halves` — why a one-axis verdict is half a verdict
- `rule.always.fix-the-verb-that-left-you-the-gap` — the rule this incident produced
- `term=partial-audit._.choice._.md` — the shape a hardcoded role list takes
- `term=false-report._.choice._.md` — what *"18 seated"* was

---

written by human + beaver 🦫
