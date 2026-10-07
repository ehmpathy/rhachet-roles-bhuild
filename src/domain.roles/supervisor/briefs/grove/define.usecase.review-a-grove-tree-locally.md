# define.usecase.review-a-grove-tree-locally

## .what

a human must be able to **read, browse, and give feedback on** a grove tree's work **from
this machine**, at local speed, while the grove pays naught at read time.

three pieces, and the asymmetry between the last two is the whole design:

| piece | what it is |
|---|---|
| **mirror** | a local, read-only copy of a grove tree's worktree — a real git repo |
| **bench** | a seat in the crew whose duct is **local**, cwd'd into the mirror |
| **the narrow push** | feedback artifacts travel back up; code never does |

## .why — the review surface is coupled to the resource the robots exhaust

a grove is where every clone works, and exactly the machine that saturates
(`term=grove.saturation`). a human's two prior read paths both run **on it**: `git.crew.read`
gives a lossy pane scrape (no browse, no diff, no file open); `git.crew.show` opens an ssh tab
where nvim itself runs on the grove. the editor stalls precisely when there is most to review
— the incentive runs backwards. no local copy existed to fall back to.

## .the mirror — and why the transport is GIT, not rsync

a mount (sshfs, nfs) still does its i/o on the grove, so it stalls under the exact saturation
this exists to dodge. the mirror must be files on local disk. that leaves a snapshot pull, and
the transport is git.

### the snapshot must not disturb the crew

the diff that matters is usually **uncommitted** (`rule.always.break-the-zero-commit-review-spiral`).
`git stash push -u` is forbidden — it removes the work from the crew's worktree. `git diff
HEAD` alone misses untracked files, most of a new round.

the primitive that mutates naught is a **temp index**:

```sh
# the WORKTREE tree — HEAD, overlaid with all that sits on disk
GIT_INDEX_FILE=$tmp git read-tree HEAD
GIT_INDEX_FILE=$tmp git add -A
wtree=$(GIT_INDEX_FILE=$tmp git write-tree)

# the INDEX tree — read off a COPY, since write-tree writes its cache-tree back
cp "$(git rev-parse --git-path index)" "$tmpi"
itree=$(GIT_INDEX_FILE=$tmpi git write-tree)

# the chain: HEAD ← index ← worktree
isnap=$(git commit-tree "$itree" -p HEAD   -m "snapshot: staged")
snap=$( git commit-tree "$wtree" -p "$isnap" -m "snapshot")
git update-ref refs/mirror/<tree> "$snap"
```

`GIT_INDEX_FILE` redirects every index write to a scratch file, so the crew's real index,
worktree, and branch stay untouched by construction.

### the snapshot is a CHAIN of two, because staged ≠ unstaged

uncommitted work splits in two, and which half a file sits in is a statement the crew made on
purpose: staged = "this part I consider done" · unstaged = "this part is still in my hands."
one HEAD+dirty tree records the sum and loses the split, and *what have they changed since
they last staged* is the review question.

so the transport carries both trees; the unpack restores both ends. in the mirror, HEAD =
their tip, index = **their index**, worktree = their worktree:

| in the mirror | reads |
|---|---|
| `git diff` | what they changed since they staged |
| `git diff --cached` | what they staged |
| `git status` | both, partitioned exactly as the crew sees it |

⚠️ the unpack's last step is a `read-tree <index>`, never a `reset HEAD` — a mixed reset
re-flattens the partition the transport carried. clamped by a `status --porcelain`
byte-compare between grove and mirror, on both first sync and each later sync.

the local side fetches straight off the grove over ssh, no github in the middle:

```sh
git fetch <camper@grove>:<worktree> refs/mirror/<tree>:refs/mirror/<tree>
```

no push, so no commit quota (`rule.forbid.self-grant-human-gates` files the quota human-only;
this path never asks for it).

### why git beats rsync here

| | git | rsync |
|---|---|---|
| `node_modules` | 🔴 cannot travel — `git add -A` honors `.gitignore` | must be excluded by a filter |
| `git diff` in the mirror | ✅ works — a real repo | 🔴 broken — a worktree's `.git` is a file that points at the grove's gitdir; dangles when copied |
| incremental | only absent objects move | whole-tree compare |
| "what changed since I last looked" | `git range-diff` between two snapshot refs | not expressible |
| verifiable refresh | one sha compare | file-by-file |

the `git diff` row is decisive — the review act IS `git diff`. the honest bound: gitignored
files (`.env`, `.log/`, build output) do not travel, rarely the review subject.

## .the bench — the first seat whose work is not on the grove

before this, every seat in `CREWWORK_ROLES_DEFAULT` landed on the box the ledger names. the
bench inverts that: its work is the human's read, and the human is here — its duct is local,
cwd'd into the mirror, so nvim/ripgrep/`git diff` run at local speed, unreachable by a
saturated grove.

this is a real break in the crew invariant — a view-axis seat that does not follow the work
axis' host — and deliberate: `term=crew` splits work from view precisely because the two are
independent.

## .the narrow push — pull is WIDE, push is NARROW

a symmetric reverse-sync would clobber the crew's in-flight edits with a stale local copy,
silently, while they work. so the return path carries feedback artifacts and naught else,
bounded by the tool rather than a filter string:

```sh
git checkout <ref> -- .reviews/ '<route>/**/*.given.by_human.md'
```

`git checkout <ref> -- <paths>` can only touch the paths it is given — a wrong rsync filter
silently widens; a wrong path argument here simply copies naught. this is what lets a human
run the behaver's `give.feedback` (`repo=bhuild/role=behaver`) in the mirror and have it reach
the crew.

## .the fulcrums

| # | the call | taken | why |
|---|---|---|---|
| F1 | local copy's name | `mirror` | one sense, no gloss needed |
| F2 | seat's name | `bench` (settled by the wisher) | `reviewer` is taken (bhrain owns it); a bench is where a human sits |
| F3 | refresh trigger | on-demand + a babysit tick that refreshes only trees already mirrored | a fetch of an unchanged ref is ~free |
| F4 | which repo owns it | `ehmpathy/rhachet-roles-bhuild` | the wisher's call |

## .shipped — `rhx git.tree.sync` + the `reviewer` seat

both halves are built and proven on a live tree:

```sh
rhx git.tree.sync --tree <slug> --from cloud://<grove> --into local
rhx git.tree.sync --tree <slug> --from local --into cloud://<grove> --what '*.feedback.*.md' --mode apply
```

proven: the snapshot mutates naught (crew's index byte-identical after); it catches
uncommitted work (a 133-file dirty set survived with no commit); the mirror is a real repo
(`git diff` runs in it); an idle re-sync is a no-op (identical sha across runs). `--from local`
reads the MIRROR, not a local worktree — one sense of `local` for this verb, both directions.

```sh
rhx git.crew.boot --tree <slug>                                      # opens its LOCAL duct, in the mirror dir
rhx git.tree.sync --tree <slug> --from cloud://<grove> --into local   # fills that dir
rhx git.crew.show --tree <slug>                                      # gives it a tab, in the crew's own window
```

### it is a SEAT, with three independent verbs

the reviewer seats are roster rows in `CREWWORK_ROLES_DEFAULT`. `crew.boot` registers them,
`git.tree.sync` fills them, `crew.show` shows them — three verbs, three acts, each callable
alone.

### it is TWO seats — `reviewer.take` and `reviewer.give`

one seat cannot hold both acts, since neither yields the keyboard:

| seat | the act | why it holds the pane |
|---|---|---|
| `reviewer.take` | absorb what the crew did — `nvim` on the mirror | a long read |
| `reviewer.give` | answer it — `rhx give.feedback` | needs a free prompt, any moment while the read continues |

one seat forces a human to quit their editor to say a word and lose cursor/buffer/place every
time. it looks like a VIEW want and is a WORK one — two tabs onto one duct share one prompt and
solve naught; two ducts is the least that parts them.

the names are dotted deliberately — boundary `reviewer`, leaf the act
(`rule.require.boundary-qualified-terms`) — and distinct from the behaver's own
`feedback.take`/`feedback.give`. tmux rewrites every `.` in a session name to `_`; the role half
of a session name is now also defended against that, as the tree half always was
(`__crew_duct_has_role`).

two seams carry the properties that set it apart: `__crew_role_host` (its duct opens here,
whatever grove its tree is on) and `__crew_role_cwd` (its cwd is the mirror, not the worktree).

### the host-override seam — a read that trusted the wrong box

the boot half knew the seat was local; the read half did not, so `crew.read --who reviewer`
derived the grove from the TREE and reported the session absent. the repair sits at
`__crew_duct_uri` — the one seam all nine crew call sites cross — as `CREWWORK_ROLES_LOCAL` +
`__crew_role_host`, rather than a per-call-site patch that would have drifted on the next crew
verb added.

### the seat cannot run `rhx` — and that is correct

`node_modules` is gitignored, so it does not travel. a role skill invoked in the mirror fails
with "no skill found in any linked role."

| in the seat | verdict |
|---|---|
| `git show` · `git diff` · `git range-diff` · `nvim` · `rg` | ✅ the review act, entirely |
| `rhx git.tree.sync` · any role skill | 🔴 absent |

the sync is a SUPERVISOR verb, addressed by tree (`rule.always.entool-the-layer-you-drop-below`).
the seat is a read surface; the refresh is driven from the box that owns the fleet.

## .enforcement

- a human asked to review a grove tree, answered only with `crew.read` = **nitpick** (the lossy
  path; name the gap out loud)
- any implementation that mounts the grove rather than snapshots it = **blocker**
- any implementation whose push-back can reach code = **blocker**
- any snapshot that mutates the crew's worktree, index, or branch = **blocker**

## .see also

- `term=grove.saturation._.choice._.md` — the condition that makes this usecase exist
- `term=crew._.choice._.md` — the work/view split the bench spends
- `rule.always.break-the-zero-commit-review-spiral.md` — why the snapshot must catch uncommitted work
- `rule.always.sprout-on-a-grove-never-local.md` — why the tree is on a grove at all
- `rule.forbid.self-grant-human-gates.md` — why the transport avoids push (quota is human-only)
- `rule.always.entool-the-layer-you-drop-below.md` — the mirror and bench are crew-layer verbs,
  taking a `--tree`, never a host

---

written by human + beaver 🦫
