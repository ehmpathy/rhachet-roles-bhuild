# F20 — do the crewwork sub-command helps owe distinct text, or one shared header

**raised at** = `5.3.verification`, self-review 7/8 (`has-ergonomics-validated`)
**rework** = clean
**confidence** = 85%
**status** = best-guessed

---

## .the fork, stated fairly

the supervisor's `--help` emits slice each file's own header with a **pinned line number**, and a
pinned number cannot track a header that keeps growing. measured at this stone, across 24 sites:

| state | sites | what a human sees |
|---|---|---|
| **truncated** | 7 | the help stops mid-contract — 77 content lines lost in total. three cut the `exit 0 / 1 / 2` line; one cuts 47 lines that explain its own security warning |
| **over-read** | 12 | the help runs PAST the header and prints section banners and raw bash source |
| banner leak, no content lost | 4 | a line of `#####` as the last visible line |
| correct today | 1 | `duct.audit.sh` — and it breaks on the next header edit |

the repair is not in question: `git.tree.sync.sh` in this same directory already carries the paved
form, and documents this exact defect class by name:

```bash
awk 'NR<=2 { next } /^####/ { exit } { sub(/^# ?/, ""); print }' "$0"
```

it finds **both** bounds, so it cannot drift. that much is settled.

## .what IS the fork

three files hold **more than one** `--help` handler, one per sub-command function, and their pinned
ranges **differ from each other**:

| file | sub-command sites | the pinned ranges |
|---|---|---|
| `work/crewwork.pane.sh` | 3 | `2,40p` · `2,30p` · `2,40p` |
| `work/crewwork.view.sh` | 3 | `2,70p` · `2,70p` · `2,30p` |
| `work/crewwork.boot.sh` | 3 | `2,70p` · `2,70p` · `2,70p` — already identical |

every one of them slices **the same file header**. so a differing range does not select different
*documentation* — it selects a different **prefix length** of one shared block.

### the two options

| | option | cost |
|---|---|---|
| **A — taken** | one paved emit per site. every sub-command help prints its file's whole header | sibling sub-commands print identical text, where today they print differing text |
| **B** | give each sub-command its own help block, and a way to address it | a redesign of the help contract for 3 files — and no one asked for one |

---

## .what I took, and why at the time

**A.** three reasons, weakest first:

1. **B is a redesign smuggled into a verification stone.** `rule.require.review-test-changes` and
   the CLEAN half of `rule.always.fix-forward-under-scouts-honor` both refuse a change that ripples
   past the defect it came to repair. a new per-function help contract is exactly that.
2. **the pavement already exists, one directory over.** `rule.always.reuse-pavement` says take it
   rather than improvise a second shape — and a second shape here would be the fourth in one role.
3. 🔴 **the strongest: the differing ranges were not carrying distinct documentation — they were
   differently BROKEN.** `crewwork.pane.sh`'s header closes at line 11 and its sites read to 40, 30,
   and 40. so all three already over-read; the "difference" between them is *how many lines of bash
   source each one dumps*. no per-sub-command text is lost, because there was none to lose.

⇒ and the `crewwork.boot.sh` row is the tell: three sites, one identical range. whoever wrote them
was not selecting per-function text — they were pinning a number that later rotted.

## .why the confidence is only 85%

the residual reading is real and I will not round it away: **the original author may have intended
distinct sub-command helps**, chosen the ranges to that end, and simply watched them rot as the
header grew. under that reading, option A cements a regression the rot introduced, rather than
repairing it.

I judge it unlikely — a per-function help sliced from a *shared* header by line offset is not a
design anyone would pick, and `crewwork.boot.sh`'s three-identical-ranges is hard to square with
deliberate selection. but I did not author these files, the origin repo's history is not in this
tree, and *"I judge it unlikely"* is exactly the sentence a fulcrum exists to expose.

I am also aware which option costs me less. that is precisely why it is on this list rather than
settled in silence.

## .why it is clean

a help emit has **no callers**. it is one expression inside a `case` arm; no module imports it, no
caller hardens against it, and no later work builds upon it. to reverse option A is to restore
three `sed` expressions — a delete, not a teardown.

## ✅ .the un-clamped half is CLOSED — at `5.3.verification`, after this entry was filed

when this entry was written, the 12 lib sites were **repaired but not clamped**: `[case4]` in
`skillSurface` RUNS each help and grades its output, so its subject is `getAllEntrypoints()`, which
excludes `skills/work/*.sh` by design — a lib is sourced, never executed, so there is no
`bash lib.sh --help` to run. that exclusion is correct, and it left a hole: a future edit could
restore a pinned range inside a lib and no clamp would go red.

⇒ closed by `[case5]`, which grades the **source** rather than the output: no help emit anywhere
under `skills/` may be bounded by a pinned line number. proved by revert — `crewwork.pane.sh:97`
back to `sed -n '3,40p'` turned `[case5]` **red**, which named `supervisor/crewwork.pane.sh:97`,
while both of `[case4]`'s runtime clamps stayed **green** (they genuinely cannot see a lib).
`[case6]` carries the bite proof on all three historic forms, plus the discriminator that keeps the
paved form's own `NR<=2` out of the net.

🟡 **what this does NOT settle is the fork itself.** a source clamp proves no emit is pinned; it
cannot prove the 12 sub-commands should share one header rather than carry distinct text. that is
still option A vs option B, still 85%, and still the council's.

## .where

- `src/domain.roles/supervisor/skills/work/crewwork.{pane,view,boot}.sh` — the three multi-site files
- `src/domain.roles/supervisor/skills/git.tree.sync.sh:165-172` — the paved form and its own note
- `src/domain.roles/skillSurface.integration.test.ts` — the clamp that keeps the repair honest
- the rule the defect breaks: `rule.require.help-on-demand` (ergonomist) — *"a `--help` that omits
  usage, inputs, or an example = blocker"*

## .the verdict

*(unruled)*
