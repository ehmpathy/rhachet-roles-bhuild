# domain.term: crew.reflector

term.chosen   = reflector
term.kind     = noun
term.boundary = crew
term.synonyms.forbidden:
- reviewer
- critic
- auditor
- observer
- retro

## .what

the **third seat** in this repo's standard crew, beside `mechanic` and `foreman`:

```
CREWWORK_ROLES_DEFAULT = mechanic,foreman,reflector
```

a seat from which to look **back** at the round — what was learned, what should be externalized,
what the next traveler owes. the mechanic drives and the foreman observes; neither has a vantage
on the round as a whole.

## ⚠️ .a role is a DUCT NAME, never a launched program

every name in the roster gets a shell duct and a tab. **only `git.tree.behavior` and
`git.tree.achievement` launch a clone, and only into the mechanic.** so a reflector comes up as a
bare shell on the same worktree — a seat a human or a supervisor takes without a second
conversation to keep alive.

⇒ that is what makes a third seat nearly free: it costs a tmux session and a tab, never a
conversation.

## .a reflector is NOT

- **a reviewer** — a review is a verdict rendered on an artifact, and the route already owns that
  ladder (`peer` + `self` reviews under a guard). a reflector looks at the ROUND, not at a diff
- **a grove purpose** — `term=grove.purpose` names what a machine is for. a role names a seat
  within a crew on that machine

## .refs

- `.agent/repo=.this/role=any/skills/work/crewwork.sh` — `CREWWORK_ROLES_DEFAULT`
- `.agent/repo=.this/role=any/skills/git.tree.duct.sh` — derives every duct, cd, ledger row, and
  tab from that one constant
- `term=crew._.choice._.md` — the work/view axes a role sits on

## .reason

see `term=crew.reflector._.choice.reason.md` — the human's coinage, the word it replaced, and the
roster braid the change surfaced.

---

written by human + beaver 🦫
