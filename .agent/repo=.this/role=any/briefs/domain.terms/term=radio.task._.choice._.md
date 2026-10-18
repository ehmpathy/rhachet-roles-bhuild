# domain.term.choice: task

## .what

a **radio task** is a unit of work **broadcast to a repo over a channel**, so that whoever next
reads that channel may claim it. it is the payload the radio carries; the channel's own form of it
(a github issue, a file under `.radio/`) is how it is rendered, never the concept.

```
term.boundary = radio        # "a task, of WHAT?" → of a radio
```

⇒ `radio` is a **root** — it hangs under no other term. the chain is `radio.task`.

## 🔴 .why this cluster exists — another repo cites bhuild for it

**bhrain declined to declare it, and named us as the owner.** its `term=artifact.seed._.choice.reason.md`
records a tolerated prose overload (*"41 open seeds"*) and settles it by deferral:

> *"the **declared object** for a radio task is `RadioTask`, in `rhachet-roles-bhuild` — imported"*
> *"so 'seed' for a radio task is prose about an imported concept, never a contract of this repo"*

⇒ bhrain's whole justification for its own overload rests on a bhuild declaration that **did not
exist** until this cluster. an import with no export.

## .the cluster

| term | kind | what |
|------|------|------|
| `task` | noun | a unit of work broadcast to a repo over a channel |
| `channel` | noun | the transport a task rides — `gh.issues` · `os.fileops` |
| `push` / `pull` | verb | broadcast a task to a channel · receive tasks from one |
| the three **statuses** | noun | `QUEUED` · `CLAIMED` · `DELIVERED` — a strict lifecycle order |

## .the shape it declares

`RadioTask` is a `DomainEntity`:

- **primary** = `exid` — the channel's own id, so identity is the channel's to assign
- **unique** = `repo` + `title` — one task per title per target repo, which is what makes a push
  idempotent under `--idem findsert`
- **updatable** = title · description · status · claimedBy · claimedAt · deliveredAt · branch

⇒ `exid` primary + `(repo, title)` unique is the whole idempotency contract: a re-push finds the
extant task by title rather than duplicates it.

## .forbidden synonyms

| forbidden | canonical | one-line |
|-----------|-----------|----------|
| `seed` | `radio.task` | 🔴 bhrain's prose uses it for a queued task. **tolerated there as prose about an imported concept; forbidden in any bhuild contract** — `artifact.seed` is a different concept (archived source material) |
| `issue` | `radio.task` | how the **channel renders** it under `gh.issues`, never the task itself. `os.fileops` renders the same task as a file |
| `ticket` | `radio.task` | helpdesk jargon; the channel already owns `issue` |
| `dispatch` | `radio.task` | 🔴 **a real distinction, not a synonym.** `mhedic` — the peer repo `ehmpathy/rhachet-roles-mhedic` — declares `dispatch` as the route-scoped **source artifact** that `radio.task.push` sends. the dispatch is what you write; the task is what is broadcast |
| `broadcast` (as the noun) | `radio.task` | names the **act**, not the payload. it survives as a verb |
| `message` · `job` · `work item` | `radio.task` | generic; each drops the channel that makes a radio task what it is |

## 🟡 .the two words this cluster is measured against

| word | its senses |
|---|---|
| `seed` | ✅ bhrain `artifact.seed` — archived source material, a file the repo keeps · ✅ bhrain **prose** for a queued radio task, tolerated · 🔴 **forbidden** in a bhuild contract |
| `dispatch` | ✅ mhedic-declared — the `$route/.dispatch/` source artifact · 🔴 **not** the broadcast task |

⇒ **a dispatch is authored; a task is broadcast.** one route may hold a dispatch file whose push
created a task; the two are not one concept seen twice.

## .refs

- `src/domain.objects/RadioTask.ts` · `RadioTaskRepo.ts` · `RadioTaskStatus.ts`
- `src/contract/cli/radioTaskPush.ts` · `radioTaskPull.ts`
- `.agent/repo=bhuild/role=dispatcher/skills/radio.task.{push,pull}.sh`
- **bhrain** `term=artifact.seed._.choice.reason.md` — the repo that cites this declaration
- **mhedic** `term=dispatch._.choice._.md` — the source-artifact term this one is parted from

## .reason

- `term=radio.task._.choice.reason.md` — etymology, the eleven-round census gap, evidence
