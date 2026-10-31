# F1 · how a repo is known as pii

- **the fork**: (a) name `rhigh`, `mhedic`, `mhonie` in the vision and blueprint stone text, as the
  wish states; (b) the stone reads a repo-local pii declaration, and those three repos add it.
- **taken (best guess)**: (b). (a) ships three private repo names to every consumer of a published
  package, against `rule.forbid.private-business-in-published-roles` (this repo).
- **rework**: dirty — the declaration's shape becomes a contract every pii repo must adopt, and the
  stones read it; a later swap touches templates and three repos.
- **confidence**: 40% — the wish names the repos outright, which may mean the commander wants them
  named; and the declaration's form is unchosen.

## the risk, by fork

| fork | if wrong, what ships | who is harmed | reversible? |
|---|---|---|---|
| (a) names in the template | three private repo names in every published copy of `rhachet-roles-bhuild`, on npm, forever | the operator (names disclosed); every consumer (taught a stranger's repos as the pii list) | **no** — a published version cannot be unpublished from every cache |
| (a), a fourth pii repo later | that repo is absent from the list, so its checkpoints push pii yields to a remote | the people whose records sit in that repo — **a pii leak** | **no** — a pushed draft can be fetched before a force-delete |
| (b), undeclared defaults to **push** | a pii repo whose marker was forgotten pushes at the checkpoint | the same — **a pii leak** | **no** |
| (b), undeclared defaults to **local** | every public repo must add a marker to get github review; until it does, its checkpoints stay local | the wisher (reads yields on the box, as today) | yes — add the marker |
| (b), the marker's shape is wrong | three repos and the stone text change together | maintainer time | yes, but across repos (the "dirty" rework) |

⇒ the irreversible harms all sit on a path where a pii repo is read as public. the one fork with
no irreversible harm is (b) with **undeclared ⇒ local**; its cost is friction on public repos.

## the blast radius of the gate itself

F1 gates only the pii branch of the checkpoint text. every other piece — the two tail stones, their
guards, the clamp, the public checkpoint path, the held-commit rule — is independent of it, so the
blueprint drafts all of that now and leaves one marked slot for the pii read.

## the fail-safe default — graded on evidence

**best guess (⚑ flagged): no repo is read as pii, or as public. a checkpoint pushes only where the
repo has opted in, explicitly, to checkpoint pushes. unmarked ⇒ the checkpoint commit stays local,
and 6.preship pushes it at the finish.**

the default inverts the wish's model. the wish names pii repos and lets all else push. this names
no repo, and lets no checkpoint push early unless a human allowed it. so the question F1 asks — "is
this repo pii?" — is never asked; the checkpoint asks only "did a human allow an early push here?"

### can it push a pii repo before its finish? — each path, checked

| path to an early push | under the fail-safe | holds? |
|---|---|---|
| a pii repo nobody marked | no marker ⇒ hold to 6.preship | ✅ yes — the default case |
| a pii repo added later, never listed | the same: no list exists to omit it from | ✅ yes |
| the marker file is absent, unreadable, or malformed | the stone text reads it as "no opt-in" ⇒ hold | ✅ yes — any read but an exact `allow` holds |
| the marker's shape changes in a later release | old markers stop to match ⇒ those repos hold | ✅ yes — a stale marker fails to hold, never to push |
| a human opts a pii repo in by mistake | that repo pushes at the checkpoint | ⛔ **no** — the one residual leak path. it needs a deliberate human act on that repo; no default and no omission reaches it |
| the driver ignores the stone text and passes `--push` | it pushes | ⛔ **no** — but this path is open under every fork; the checkpoint is prose a driver obeys, and no guard reads it. not a property of the default |
| 6.preship pushes, then 7.reflect pushes a cure | both are at or after the finish | ✅ the wish's own rule: pii repos push at preship |

⇒ **a fail-safe exists.** no default, omission, or stale config pushes a pii repo before its
finish. the two open paths each need an explicit wrong act (a mislabel, or a driver that disobeys).

### what it costs — the honest side

- **friction on every public repo**: until a repo opts in, its wisher reads vision and blueprint
  yields on the box, as today. the wish's "the wisher reviews on github" holds only for repos that
  add the marker. that is a loss against the wish, chosen for safety
- **the commander may have meant a named list**: the wish names three repos. this default makes the
  names unnecessary — and keeps them out of a published package (`rule.forbid.private-business-in-published-roles`)

### the marker's shape — a sub-choice, best guess

a tracked repo-local file, read by the checkpoint text: `.behavior/.checkpoint.jsonc` with
`{ "push": "allow" }`. absent, or any other content ⇒ hold. no behaver skill reads a repo-local
`.jsonc` today (`src/domain.roles/behaver/**/*.sh`), so the shape is new.

### rework and risk, re-graded

- **rework**: **dirty**, unchanged in kind — the marker shape is a contract that each opted-in
  public repo adopts, so a later swap touches the stone text plus every repo that opted in. what
  changed is the direction of a botched swap: it fails to hold, never to push. pii repos adopt
  no marker, so no swap ever touches them.
- **risk**: **medium** (was high). no default path leaks; the residual leak needs a human to mark a
  pii repo as push-allowed. medium, not low, because that act is one line in one file, and its
  cost is irreversible.
- **confidence**: 80% that it is safe as stated; 50% that the commander accepts the friction on
  public repos over a named list.

- **where**: `1.vision.yield.md` q1; c12, c22, `case=8`.
- **verdict**: **deferred** out of this behavior (director, 2026-10-24: F1 sat unruled 3h and held 3
  other crews). it leaves with the vision + blueprint checkpoints — the only stones that would push
  before the finish, and the sole subject F1 governs. this behavior ships 6.preship + 7.reflect with
  the push policy repos have today: no stone pushes before preship, and preship pushes at the finish,
  which the wish prescribes for pii repos too. so no pii read is needed here, and no new push lands
  early. the follow-up behavior carries F1, with the fail-safe above as its best guess:
  `dreams/2026_10_24.feat-init-behavior-checkpoint-commits-with-pii-hold.dream.md`.
