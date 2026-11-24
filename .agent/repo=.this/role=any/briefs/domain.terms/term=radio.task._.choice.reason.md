# domain.term.choice.reason: task

## .etymology

### `radio` — the boundary, and why it earns a root

a radio **broadcasts to whoever is tuned in**. that is the exact property the mechanism has and that
every rejected synonym drops: a task is not handed to a named recipient, it is put on a channel and
claimed by whoever next reads it.

⇒ so `radio` is a genuine boundary rather than decoration. **`task`, flat, would be the vaguest
possible noun in a repo full of work items** — a stone is a task, a wish is a task, a dispatch
carries a task. the boundary is what makes the word mean one concept.

### `task` — the plain word, deliberately

no coinage was attempted, and `rule.require.enumerate-before-you-name` is why: the concept has one
instance shape (a unit of work), and every candidate that read sharper read **narrower**. `job`
implies scheduled execution; `message` drops that it is work at all; `request` implies a named
respondent.

## 🔴 .the eleven-round census gap, and the shape of it

`domain.terms/.readme.md` carried `radio.task` as **open** from round 4 to round 16 — the last
survivor of a row that also held `dream` and `dispatch`, both of which closed as cites on one read
each.

🟡 **the row was open for the whole route, and its resolution sat in a file that cites us.**
bhrain's `artifact.seed` cluster names `RadioTask` as an **imported** term, from bhuild, by name. so
the record already said *bhuild owns this word* — in another repo, where no bhuild census would look.

⇒ **the settled lesson: a census reads this repo's own contracts, so what another repo has already
claimed we own sits outside its scope.** an import is a citation of an export, and an export that was never written
is a phantom path pointed the wrong way.

## 🔴 .the strongest evidence — an import with no export

bhrain tolerates a real overload on the strength of this declaration:

| bhrain's position | rests on |
|---|---|
| *"41 open seeds"* is legal prose | `seed` there names an **imported** concept |
| the import is safe | `RadioTask` is **declared in bhuild** |
| so no bhrain cluster is owed | bhuild's cluster carries the sense |

**the last row was false until 2026-09-07.** the code existed (`src/domain.objects/RadioTask.ts`);
the *term* did not. ⇒ a `DomainEntity` class is a declaration to a compiler, never to a glossary, and
`rule.require.domain-term-itemization` exists precisely because the two are not the same act.

## .rejected terms

| candidate | for | why not |
|-----------|-----|---------|
| `seed` | the task | ✅ what bhrain's prose says. 🔴 it collides head-on with bhrain's own `artifact.seed` — archived source material — so one word would carry two concepts across a repo boundary. bhrain itself records the collision and tolerates it **only** in prose |
| `dispatch` | the task | 🔴 **a real distinction.** `mhedic` — the peer repo `ehmpathy/rhachet-roles-mhedic` — declares `dispatch` as the route-scoped **source file** that `push` sends. one push turns one dispatch into one task; they are two objects with two lifespans — the dispatch is ephemeral and route-scoped, the task lives on the channel |
| `issue` | the task | how `gh.issues` renders it. `os.fileops` renders the same task as a file under `.radio/`, so `issue` names one channel's form of a channel-agnostic concept |
| `broadcast` | the task | names the **act**. it survives as a verb and is barred only as the noun |
| `job` · `work item` · `message` | the task | each drops the channel, which is the whole discriminator |

## .disputes

none open.

🟡 **one is latent and recorded so it is not re-derived:** bhrain uses `seed` in prose for this
concept, and this cluster forbids it in bhuild contracts. that is **not** a dispute — bhrain's own
reason file already draws the same line (*"prose only"*, *"never a contract of this repo"*), so the
two glossaries agree. a dispute would be owed only if a bhrain **contract** adopted `seed` for a
radio task.

## .evidence

- **the declared shape** — `src/domain.objects/RadioTask.ts`: `primary = ['exid']`,
  `unique = ['repo', 'title']`, `nested = { repo: RadioTaskRepo }`. the unique key is what makes
  `--idem findsert` idempotent, and it is the argument that `title` is part of the term's identity
- **the lifecycle** — `RadioTaskStatus`: `QUEUED → CLAIMED → DELIVERED`, order-enforced by the push
  skill's stated guarantee
- **the two channels** — `gh.issues` and `os.fileops`, both in `radio.task.push.sh` and
  `radio.task.pull.sh`. **two ways to render one concept is the evidence that the concept is neither
  of them**
- **the repo that cites us** — bhrain `term=artifact.seed._.choice.reason.md:61-63`
- **the parted-from term** — mhedic `term=dispatch._.choice._.md`

## .refs

- `.agent/.cache/repo=bhrain/role=learner/skill=learn.domain.terms/progress.2026-09-07.md` — round 16,
  where the census row closed
- `domain.terms/.readme.md` — the census this discharges
