# F10 — which order do path constants take, now that the lift brought a second convention?

| field | value |
|---|---|
| **rework** | **clean** — 7 module-private constants in 5 files i authored |
| **status** | best-guessed, driven past |
| **confidence** | **65%** |
| **found** | self-review `has-consistent-conventions`, 2026-09-25 |

## .the fork, stated fairly

a module constant that names a path or a directory can be written two ways:

```ts
const DIR_ROLES = __dirname;     // [TYPE]_[noun]
const ROLES_DIR = __dirname;     // [noun]_[TYPE]
```

and after this lift, **`src/` carries both** — each unanimous within its own half.

| the half | the form | measured |
|---|---|---|
| the **host** repo, pre-lift | `[noun]_[TYPE]` | `ASSETS_DIR` ×3 · `SKILL_PATH` · `TEMPLATES_DIR` · `ROLE_DIR` · `GLOBAL_STORAGE_PATH` · `LOCAL_STATE_FILE` · `GLOBAL_STATE_FILE` · `ORG_STATE_FILE` · `SELF_REVIEW_ARTICULATION_DIR` |
| the **lifted** corpus | `[TYPE]_[noun]` | `PATH_ECOWORK_DB` · `PATH_ECOWORK_SH` · `PATH_ECO_PRIORITY_SH` · `PATH_SYNCWORK` · `PATH_SAT` · `PATH_SPEND` · `DIR_SKILLS` · `DIR_WORK` |

⇒ **neither half has a counterexample.** this is not drift inside one codebase; it is two settled
conventions that just became neighbours.

## 🔴 .why this is a fulcrum and not a defect

my first read graded `DIR_ROLES` a violation of `rule.require.order.noun_adj` — *"[noun][adjective]
order… instead of `currentowner`, prefer `ownercurrent`"* — and i was ready to rename all seven.

the wider search killed that verdict. **the lifted corpus does obey the rule** wherever the second
token is an adjective or a state:

```
ROLES_DEFAULT · ROLES_LOCAL · ROLES_TREEBOUND · TREE_DOTTED · SLUG_SIBLING
SLUG_ZOMBIE · SPEC_TOP · SPEC_EATS · MARK_OPEN · MARK_SHUT
```

✅ every one is `[noun]_[adj]`. ⇒ so the corpus is **not** careless about the rule — it draws a
deliberate line: **a qualifier trails the noun; a TYPE leads it.** `PATH_` and `DIR_` are taken as a
namespace, not as an adjective, and the rule governs adjectives.

⚠️ that interpretation is defensible, and so is the host's. **the rule does not settle it**, which
is exactly what makes this a fork rather than a fix.

## .the options

| # | option | cost |
|---|---|---|
| **A** | keep `DIR_*` in my guards — match the lifted neighbours | the host's 9 extant constants take the other form |
| **B** | rename to `ROLES_DIR` etc. — match the host | my guards diverge from the corpus they sit beside |
| **C** | sweep the lifted corpus to the host form | 🔴 **refused.** the wish says *"ports unchanged"*, and this would re-litigate a settled call across 77,742 lines |

⇒ **C is out on the wish's own terms**, so the repo keeps both forms whichever way this goes. the
only live question is which one **my seven** follow.

## .the guess, and why

**A — keep `DIR_*`.** two reasons, neither decisive:

1. my guards live at `src/domain.roles/`, and the majority of that tree by volume is now the lifted
   corpus. a reader who moves from `work.surface`'s `DIR_WORK` to my `DIR_ROLES` meets one form
2. the host's 9 instances are spread across `domain.operations/` and `contract/` — a different
   neighbourhood entirely

⚠️ **the honest counter**: my guards are host code, not lifted code. they were authored this round,
in this repo, by this repo's rules. by that measure B is right, and my guards are the only new code
that adopts an imported convention.

🟡 **65%, and the reason it is not higher**: i can argue B nearly as well as A, and the tiebreak i
used — *"which neighbours does a reader meet?"* — is a guess about a reader, not a measurement.

## .the rework, if the council rules B

```
DIR_ROLES   → ROLES_DIR      (briefCitations, roleBoundaries, roleArtifacts)
DIR_SRC     → SRC_DIR        (testFixtures, glyphsRetired)
DIR_REPO    → REPO_DIR       (testFixtures)
PATH_EXEMPT → EXEMPT_PATH    (glyphsRetired)
```

**7 constants, 5 files, all module-private.** no export, no import, no test asserts on the name.
⇒ **clean** — a `sedreplace` and a suite run.

## .see also

- `rule.require.order.noun_adj` (ehmpathy/mechanic) — the rule that does not settle it
- `rule.require.treestruct` — `[...noun][state]?` for resources, the same open question
- `F2` — the other placement call this lift forced, settled rather than deferred
- the wish's *"ports unchanged, both of them"* — why option C is refused

---

caught by beaver 🦫
