# rule.always.teach-both-crew-birth-paths

## .what

> **a crew is born on TWO paths. whenever you teach one of them a fact about a role, teach the
> other in the same round — or the untaught path ships a crew that lies.**

| the path | the verb | when |
|---|---|---|
| a **sprout** | `git.tree.duct` (under `git.tree.behavior` / `git.tree.achievement`) | a tree that did not exist |
| a **re-boot** | `git.crew.boot` | a tree that already does |

both end with "a crew is up on this tree". a per-role fact — which box its duct opens on,
which dir it opens in, what gets provisioned into its shell — is owed to both; taught to one
alone, it is a defect with a 50% duty cycle.

## .why — the untaught path fails late

`git.tree.duct` opens ducts in a loop, writes the ledger row, then creates the worktree. a fact
absent from the loop does not fail at the door — it fails partway, after earlier steps already
wrote to disk, and the result is a half-booted crew: some live ducts, some absent seats, a
worktree on disk. `git.crew.poll` then renders it `😶 at work`, because the live ducts ARE at
work — the fleet's own instrument reports the half-crew as healthy (`term=false-report`).

this has happened twice from the same cause: a fact (a ledger row; a per-role `--cwd`) was
taught to `crew.boot` and left absent from `git.tree.duct`, even once with an explicit warn
comment left in the untaught file — a comment nobody who works the OTHER path ever opens.

## 🔴 .the misdiagnosis this defect invites

a sprout death shows a uri like `duct:///<tree>/reviewer.take` — an empty authority that reads
exactly like a dropped shell variable. it is not: `reviewer.take`/`reviewer.give` are in
`CREWWORK_ROLES_LOCAL`, so their ducts open on THIS box regardless of the tree's grove
(`define.usecase.review-a-grove-tree-locally`) — a human needs to read a grove tree's work
locally, at local speed. the host is correct by design; a failure here is almost always the
`--cwd`.

**the discriminator:** does the set of roles with an empty host equal `CREWWORK_ROLES_LOCAL`?
yes → by design, check `--cwd`. no → a real host defect. same three slashes, opposite
verdicts — check the list before the uri.

## .the cues

| when… | then… |
|---|---|
| you add a per-role fact to `crew.boot` | open `git.tree.duct.sh` in the same round |
| you add a seat to `CREWWORK_ROLES_DEFAULT` | both birth paths, plus the view half (`crew.show`) |
| you write a `⚠️` comment inside one crew verb | ask who reads that file — a peer-path fact belongs in a seam or a brief |
| a sprout fails partway | assume a fact `crew.boot` has and this path does not — first hypothesis |
| a local-only seat behaves oddly on a cloud tree | check the cwd seam before the host seam |
| you cure it at the call site | that is the next drift — cure it at the seam both paths cross |

## .the cure is a seam, never a second copy

the host half is the template: `__crew_duct_uri` is the single seam all nine crew call sites
cross — one rule, nine readers, no drift. the repair for a both-paths defect is never to paste
the fact into the second path; it is to put the fact where both paths already pass
(`__crew_role_host` for the box, `__crew_role_cwd` for the dir) and have each caller ask.

a seam a caller cannot reach yet needs a hint, never a bypass: `__crew_role_cwd` reads the
ledger to learn a tree's grove, and a sprout runs before its ledger row exists — so the fix is
an optional grove argument the sprout supplies and every other caller omits, and the eight
extant call sites stay untouched.

## .the test

> **"which OTHER path births a crew, and does it know what I just taught this one?"**

it does → done. it does not → not done, and the gap is a half-booted crew, not a clean error.
the fact lives in one seam both cross → the right shape; neither path can drift.

## .enforcement

- a per-role fact added to one birth path and not the other = **blocker**
- a both-paths fact cured by a copy at the second call site rather than at a shared seam = **blocker**
- a sprout that can fail after it opens ducts or writes a worktree, with no clamp on the
  partial state = **blocker**
- a `duct:///` on a `CREWWORK_ROLES_LOCAL` seat reported as a host defect = **false positive**
- a new fact taught to both paths, clamped on both = correct

## .see also

- `define.usecase.review-a-grove-tree-locally.md` — why reviewer seats are local, and the two seams
- `define.invariant.crew.view.all-or-naught.md` — the view-axis peer: a partial window lies too
- `rule.always.fix-the-verb-that-left-you-the-gap.md` — the general form of a cure at the seam
- `rule.always.clamp-the-production-defect-you-just-saw.md` — the reflex that produced this brief
- `term=false-report._.choice._.md` — what `😶 at work` is, over a half-booted crew
- `term=crew._.choice._.md` — the work/view split, and why a seat may break the host rule

---

written by human + beaver 🦫
