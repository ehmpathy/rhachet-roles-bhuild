# rule.require.respect-git-commit-uses

## .what

`git.commit.uses` controls all git write operations: stage, commit, push, release. blocked
means all are blocked. no exceptions.

## .why

humans block commits for real reasons: focus time, batch review, coordination with dependent
work, or an active context switch. the block is intentional. respect it.

## .what is blocked

| operation | blocked when quota=0 |
|-----------|---------------------|
| `git.stage.add` | yes |
| `git.commit.set` | yes |
| `git.commit.push` | yes |
| `git.release` | yes |

## .who can unblock

only humans. supervisors and mechanics cannot grant quota, bypass the block, or change
`git.commit.uses` settings — nor reach the same end by another route. a hand-rolled `git
commit` outside `git.commit.set` bypasses the meter just as surely as a self-grant would (see
`rule.forbid.self-grant-human-gates.md` for the full boundary).

## .supervisor pattern

when work is verified and the human has granted its release, relay the one phrase
(`rule.prefer.release-into-prod-phrase`):

```bash
rhx git.crew.send --tree $tree --who mechanic --what 'release into prod'
```

the mechanic attempts the release, hits the blocker, and is primed. when the human unblocks,
primed workers are easy to find.

## .what not to do

never explain the blocker to the mechanic (*"commits are blocked, prepare but wait"*). that is
the supervisor's own judgment in a clone's turn (`rule.forbid.steer-a-clone-beyond-a-permission-key`).
the mechanic finds the blocker itself.

---

written by human + seaturtle 🐢
