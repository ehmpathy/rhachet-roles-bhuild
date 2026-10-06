# rule.forbid.bind-a-costly-act-to-a-cheap-one — example: the seat that needed its own verb

> **date** 2026-09-10 → 2026-09-11 · **repo** `nheuron` · **path**
> `.agent/repo=.this/role=any/skills/work/{crewwork,syncwork}.sh`

the worked demo of the rule's decay path, walked end to end in one day.

## .the subject

`define.usecase.review-a-grove-tree-locally` asks for a **reviewer seat**: a duct that opens
on the human's own box, cwd'd into a local git mirror of a worktree that lives on a grove —
so a saturated grove cannot stall the human's read.

two acts serve it:

| the act | cost | wanted by |
|---|---|---|
| open a duct + tab for the seat | cheap, local, idempotent | every caller |
| `git.tree.sync` — pull the tree down over ssh | costly, network, can fail | some callers |

## .the bind, and its argument

both were bundled into one verb, `crew.boot.reviewer`. the header stated the case plainly:

> *"the seat exists to be looked at, and a mirror is a snapshot with an age. to open a stale
> one silently is the review-side twin of a false report."*

⚠️ **that argument is true, and it is not a reason to fuse.** it argues that a stale mirror
should be refreshed. it does not argue that a seat cannot be **registered** before a mirror
exists — and registration was the whole of the cheap half.

## .the decay, step by step

| step | what happened here |
|---|---|
| 1. bind | sync + duct + tab, one verb |
| 2. the cheap verb turns costly | `crew.boot` would ssh once per boot if it held the seat |
| 3. **exclude the case** | `reviewer` left out of `CREWWORK_ROLES_DEFAULT`, to keep boot cheap |
| 4. the case has no verb | no verb booted it; `crew.show` had no tab to open |
| 5. invent one | `crew.boot.reviewer` — which is step 1's verb, now load-bearing |

🔴 **the closed loop, stated in one line: a verb invented to ADD a seat had to REMOVE that
seat from the roster in order to exist.**

## .what it cost

- a **second window** per tree, because the fused verb reasoned its tab could not join the
  crew's window — a conclusion that followed from the fusion and not from the substrate
  (`term.open --duct` has carried a per-tab host since v1)
- a **duplicate** of `crew.boot`'s body: ledger lookup, grove derivation, duct open, tab open
- a seat absent from `crew.list`, `crew.stop`, and `crew.fell` — every roster-driven verb
- one skill wrapper, one help dump, one set of error messages, all single-use

## .the strike

the wisher rejected it across six messages:

> *"why is reviewer not automatically booted as part of git.crew.show or git.crew.boot?"*
> *"thats a codesmell"* / *"eliminate that"*
> *"why would crew.boot exclude it? it can BOot it without the sync"*
> *"sync is separate to boot"*
> *"why would you cut the crew registration out, just to arbitrarily bind sync to crew
> registration"*

## .the repair — and how small it turned out to be

the verb was deleted outright, wrapper and all. each property it was built to carry reduced
to one of these:

| what the special verb held | where it went |
|---|---|
| "this seat's duct is local" | `__crew_role_host` — 8 lines, one seam every crew verb crosses |
| "this seat's cwd is the mirror" | `__crew_role_cwd` — 8 lines, called from `crew.boot`'s duct loop |
| "boot it" | `CREWWORK_ROLES_DEFAULT` — one word |
| "show it" | `crew.show`, which walks the roster |
| "sync it" | `git.tree.sync`, which is where it always was |

⇒ **the whole "special seat" apparatus evaporated with the bind.** that is the usual shape:
*a verb born from a bind is mostly a re-implementation of the verb it was meant to supplement.*

`crew.boot` now opens the seat's duct on an **empty** mirror dir, and that is correct — a
registered seat with no content is a seat. `git.tree.sync` fills it when a caller wants it
filled.

## .the clamps this earned

| clamp | what it holds |
|---|---|
| 🔴 the LOCAL-ONLY seat opens HERE, never on the tree dir | `duct:///<tree>/reviewer`, empty authority, cwd ≠ the worktree |
| 🔴 the LOCAL-ONLY seat stays HOME while its crew goes to the grove | on a cloud crew: the uri names no grove and the cwd is not the grove's dir |
| every TREE-BOUND duct carries `--cwd` inside the worktree | the local seat excluded **by name**, never by a loosened assertion |

⚠️ the exclusions are a named list (`ROLES_LOCAL`), so a clamp that would otherwise go red on
the new seat stays sharp for the defect it was written for.

## .see also

- `rule.forbid.bind-a-costly-act-to-a-cheap-one.md` — the concept this demonstrates
- `define.usecase.review-a-grove-tree-locally.md` — the usecase the seat serves
- `term=crew._.choice._.md` — the work/view split that made the seat expressible

---

written by human + beaver 🦫
