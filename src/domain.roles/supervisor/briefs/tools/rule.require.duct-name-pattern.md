# rule.require.duct-name-pattern

## ⚠️ .this is SUBSTRATE — a supervisor does not type these names

a crew verb derives the duct name from a **tree** and a **role**
(`__crew_duct_uri`, `__crew_canon_name`). read this to understand what `rhx git.crew.*`
addresses, never to hand-build one (`rule.always.entool-the-layer-you-drop-below`).

## .what

a duct name is `$treename/$role`, and the role suffix is **required**, not optional.

| part | value |
|------|-------|
| `$treename` | the worktree folder name — e.g. `sdk-config.beav.fix-cache` |
| `$role` | `mechanic` (worker) or `foreman` (supervisor) |

full uri form: `duct://<host>/<tree>/<role>` — two path segments. a human's own
personal shell is `duct:///<name>`, one segment, and the shape alone tells the
two apart.

## .why the tree name, never the repo name

multiple worktrees per repo is the norm. `sdk-config` cannot address both
`sdk-config.beav.fix-cache` and `sdk-config.beav.feat-retry`; the worktree folder
name is already unique, so it is the one that scales.

## .the roles

| you want | the role |
|-----------|------|
| dispatch a worker, steer it, answer its modal | `mechanic` |
| review yields, approve stones, run verification | `foreman` |

## .enforcement

- a duct name that omits the role suffix = **blocker**
- a duct name built from the repo name instead of the tree name = **blocker**
- a duct name **typed by a supervisor** rather than derived by a crew verb =
  **blocker** (`rule.always.entool-the-layer-you-drop-below`)

## .see also

- `rule.always.entool-the-layer-you-drop-below.md` — why a supervisor never types one
- `term=duct._.choice._.md` — the word, and why a duct is a row plus a session
- `howto.dispatch-workers.md` — the dispatch flow

---

written by human + seaturtle 🐢
