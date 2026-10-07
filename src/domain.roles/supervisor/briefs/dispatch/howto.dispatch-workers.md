# howto.dispatch-workers

## .what

how to sprout a crew on a tree and supervise its progress.

## .branch convention

always use `beav/{fix|feat}-$slug`: `beav/fix-cache-invalidation`, `beav/feat-add-retry-logic`.

## .the seats

| seat | purpose |
|------|---------|
| `mechanic` | the worker — the clone that drives the bound route |
| `foreman` | an empty shell seat — observation, closeout (`git tree del`) |

you address a seat by TREE and ROLE (`--tree $tree --who mechanic`), never by duct uri
(`rule.always.entool-the-layer-you-drop-below`).

## .the flow

every dispatch boots a behavior — never ad-hoc (`rule.require.behaviors-over-adhoc`).

```bash
# 1. author the wish in THIS repo, under the daily stream
#    src/stream/$Q/$date.dispatch.repo=$repo.behavior=$name.wish.md
#    (bounds the scope the mechanic will drive)

# 2. one call creates worktree + crew + terminal AND boots the behavior
#    --size and --wish are REQUIRED. sprout on a grove, never local
#    (rule.always.sprout-on-a-grove-never-local)
rhx git.tree.behavior \
  --into org/repo \
  --name beav/fix-the-issue \
  --grove cloud://$grove \
  --size nano \
  --wish src/stream/$Q/$date.dispatch.repo=$repo.behavior=fix-the-issue.wish.md

# 3. monitor the whole fleet in one call; drill in on one seat only when the poll names it
rhx git.crew.poll --live --stones
rhx git.crew.read --tree $tree --who mechanic
```

`git.tree.behavior` boots the behavior in the mechanic seat: install → `rhx upgrade` →
`rhx init.behavior --name $name --size $size --wish @stdin` (piped from the file you authored)
→ `claude`, which drives the bound route. never send a separate `claude ... "task"` dispatch —
the wish IS the task.

## .why a behavior, not ad-hoc

bound wish (clear scope, no drift), automated peer + self review gates, yield files for
institutional memory, route stones to guide progress. if you do not know the size, ask the
human — never guess. skip a behavior only where the human explicitly permits it.

## .the tree name

the tree is named after repo + branch: `--into ehmpathy/sdk-config --name beav/fix-cache` →
tree `sdk-config.beav.fix-cache`. both seats are created up front.

## .when the worker finishes

signals: commits pushed, pr created, route stones passed. verify the release
(`rule.require.verify-released-before-close`), fell the tree from the foreman seat
(`rule.require.tree-del-before-duct-close`), then `rhx git.crew.stop --tree $tree`, and report
to the human.

## .when the worker gets stuck

signs: repeated errors, a plea to the human, a stone marked blocked. read the full pane, then:

- a permission modal → approve or reject it (`howto.review-permission-requests`)
- a human-only gate → surface it to the human, once
- all else → send naught. a stall is not a summons
  (`rule.forbid.steer-a-clone-beyond-a-permission-key`)

## .parallel workers

trees run concurrently — each its own behavior, one pr per tree, bounded by grove saturation
(`rule.require.bound-grove-concurrency-by-saturation`). author one wish per task, then sprout
each; one `git.crew.poll` covers them all.

## .see also

- `howto.dispatch-dependency-upgrades.md` — full declapract upgrade workflow
- `rule.forbid.adhoc-worktree-actions.md` — why dispatch, not direct action
- `howto.run-a-babysit-tick.md` — the supervision loop once trees are live

---

written by human + beaver 🦫
