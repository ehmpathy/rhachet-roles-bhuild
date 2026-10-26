# rule.require.behaviors-over-adhoc

## .what

worktree work must boot a behavior (`rhx init.behavior`). never dispatch ad-hoc.

ad-hoc = a `claude ... "do the task"` dispatch straight to a mechanic with no behavior.

## .why

behaviors provide:
- **bound wish** — clear scope, prevents drift
- **automated reviewers** — guards with peer + self reviews
- **institutional memory** — yield files capture decisions
- **route structure** — stones guide progress

ad-hoc dispatch lacks all of the above. work drifts, no review gate, no reflection.

## .sizes

| size | route | when |
|------|-------|------|
| `nano` | wish → vision → execute | a single concern — add one practice, fix one defect |
| `mini` | + blueprint | a new feature with clear scope, whose design is unsettled |
| `medi` | + research, distill, … | needs research, or spans phases or repos |

**if you do not know the size, ask.** do not guess — *"this work is <description>. which behavior
size — nano, mini, or medi?"*

## .the pattern

author the wish in THIS repo under the daily stream, then boot. `git.tree.behavior` requires
`--size` and `--wish`, so the behavior boot is mandatory by construction — there is no ad-hoc
path through it.

```bash
rhx git.tree.behavior --into org/repo --name beav/fix-the-issue --size nano \
  --wish src/stream/$Q/$date.dispatch.repo=$repo.behavior=fix-the-issue.wish.md
```

⚠️ bare `git.tree.duct` boots worktree + ducts + terminal and NO behavior. reach for it only
where a human explicitly permits a no-behavior setup (e.g. `declapract.upgrade`, which boots its
own route). absent that explicit permission, a behavior is mandatory.

## .enforcement

ad-hoc dispatch without behavior = blocker (unless human explicitly permitted skip)

## .see also

- `howto.dispatch-workers.md` — full dispatch workflow (boots behavior)
- `howto.supervise-routes.md` — foreman ducts and route stone approval

---

written by human + seaturtle 🐢
