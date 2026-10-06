# rule.require.clarify-radio-push-vs-pull

## .what

"push" and "pull" are the two radio directions a dispatch can take. know both before you act;
`define.sprout-vs-seed` settles which one a bare "dispatch" defaults to.

| direction | means | effect |
|-----------|-------|--------|
| **push** (= seed) | create a task over the radio | opens a gh issue; work is QUEUED, naught starts |
| **pull** (= sprout) | create a tree from a task | boots worktree + ducts + behavior; work STARTS now |

## .why

"dispatch" names an intent, not a mechanism, and the two mechanisms are opposites. a wrong pull
is expensive to unwind (branch, ducts, window, install, behavior scaffold, then a fell). a
wrong push is cheap — it pollutes the queue with an unwanted task, undone with a close.

## .the default

per `define.sprout-vs-seed`: the object authorizes the act. "sprout a tree" / "dispatch a tree"
/ "boot a crew" → pull. all else — a bare "dispatch", "send a task", "queue this" → push, no
question asked. ask only when the human names a tree-shaped outcome and withholds the word
("get someone onto X right now").

| wording | act |
|---|---|
| "dispatch a task into $repo" · "send a radio task" | push (default) |
| "push a radio task" · "queue an issue" · "file it for later" | push |
| "pull a radio task" · "boot a behavior" · "spin up a worktree" | pull |
| "get someone onto X right now" (no tree named) | ask |

## .note

a pull is still subject to every worktree rule — bound behavior, human ok above nano. push/pull
settles WHICH action; it never relaxes the rules that govern it.

## .enforcement

- a worktree booted off a bare "dispatch" with no `sprout`/tree object named = **blocker**
- a task pushed off a bare "dispatch" = correct, never a violation

## .see also

- `define.sprout-vs-seed.md` — the authoritative default and the discriminator
- `rule.require.behaviors-over-adhoc.md` — a pull must boot a bound behavior
- `rule.require.confirm-behavior-size-above-nano.md` — a pull above nano needs a human ok
- `howto.dispatch-workers.md` — the worktree flow, for when a pull is what was meant

---

written by human + seaturtle 🐢
