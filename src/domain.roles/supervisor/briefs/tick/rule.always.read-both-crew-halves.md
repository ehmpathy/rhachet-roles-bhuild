# rule.always.read-both-crew-halves

## .what

whenever you ask **"is this crew alright?"** — booted, healthy, malformed, tabless — read
**both halves** with their own instrument, before you read a single pane:

```sh
rhx git.crew.poll --live --stones     # the WORK half — are the ducts up?
rhx term.audit                        # the VIEW half — does each duct have a tab?
```

a crew has two axes, and each has its own instrument. one instrument answers half the
question, and it never says which half it left out.

## .why

`term=crew` declares the two axes as a strict split — `crew.boot` opens no tab, and `crew.show`
touches no duct. so the failure modes are disjoint by construction:

| what is broken | which instrument sees it | what the other says |
|---|---|---|
| the duct is down | `git.crew.poll` → `💀 down` | naught — no row to join |
| the **tab** is closed, duct alive | `term.audit` → `✋ no tab` | **`😶 at work`** — healthy |

**a tabless crew reports as perfectly healthy in the poll**, because it IS healthy on the axis
the poll measures. the crew is at work, unwatched, and the sweep will never say so — exactly the
state `term.audit` exists to name, and the only state a supervisor cannot reach any other way.

## .and NEVER answer it with a crew.read

a `crew.read` is a drill-in on a subject a sweep already named (`rule.require.bulk-over-byhand`).
it cannot be a health check: it reads the duct beneath the crew, so it is blind to the tab by
construction, and a healthy pane read from a tabless crew looks identical to one with a tab.

⚠️ a `crew.read` used to answer a boot question is the tell that you skipped the instrument — a
`duct.read` here stacks a layer-drop on top (`rule.always.entool-the-layer-you-drop-below`).

## .the cue

| when… | then… |
|---|---|
| a human says a crew is **malformed / not booted / lacks a tab** | 🔴 `term.audit` FIRST |
| you just ran `crew.show` or `crew.boot` | audit it — a verified boot, not a reported one |
| a grove dropped, or a tunnel was reaped | every tab on it died. audit before you re-open |
| the poll says `😶 at work` and a human says otherwise | **the human reads the view.** you read the work. audit closes the gap |
| you are about to `crew.read` to check a crew's HEALTH | 🔴 stop. that is the wrong instrument |

## ⚠️ .the known gap — `term.audit` is localhost-only

`term.audit.sh:84` reads `__duct_list_host_sessions localhost`, hardcoded — so it cannot see a
grove crew at all, and returns a clean, confident report that silently omits every cloud tree. a
`partial audit` in the literal sense: the instrument chose its own subject set, with no trace of
what it excluded.

**until it takes a host:** verify a grove crew's view from `rhx git.crew.show --tree <tree>` —
it prints each tab it opened with a live pid, and fail-fasts on an absent duct. a weaker read
(it proves the open, never the current state), and it is what exists. that workaround needs a
`__crew_ledger_grove_of` in `crewwork.sh` — a layer question, not an unknown.

## .enforcement

- a crew's health judged from the poll alone, where a tab could be the defect = **blocker**
- a `crew.read` used as the health check for a boot question = **blocker**; a `duct.read` used
  for it = **blocker twice over**
- a `crew.show` / `crew.boot` reported as done with no audit of what it produced = **nitpick**
- `term.audit` run on a grove crew and its localhost-only omission not named = **nitpick**

## .see also

- `term=crew._.choice._.md` — the work/view axes, and why the verbs are strictly split
- `term=term._.choice._.md` — the join `term.audit` performs, and the tabless-live state
- `term=partial-audit._.choice._.md` — why an instrument that picks its own subject lies
- `rule.require.bulk-over-byhand.md` — a `crew.read` is a drill-in, never a scan
- `rule.always.entool-the-layer-you-drop-below.md` — why `term.audit` is a deliberate carve-out
  from its substitution table, rather than a contradiction of it

---

written by human + beaver 🦫
