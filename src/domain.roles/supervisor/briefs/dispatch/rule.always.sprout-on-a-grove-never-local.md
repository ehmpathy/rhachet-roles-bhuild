# rule.always.sprout-on-a-grove-never-local

## .what

every sprout boots on a cloud grove. never on this machine.

```sh
rhx git.tree.behavior --into <org>/<repo> --name beav/<slug> --size nano \
  --wish <path> --grove cloud://<the live grove>
```

⚠️ `--grove` defaults to `local`, so the bare call is never the correct one — type the flag
every time.

## .why

**this machine is the human's workshop; a crew is a squatter in it.** a local sprout puts a
worktree, two ducts, an install, and a live clone on the same box a human sits at — it competes
for cpu/memory the human feels at the keyboard, opens a terminal window that steals focus, and
adds one more indistinguishable dirty tree to the human's own checkout list.

**a local crew dies with the laptop; a grove crew does not.** a laptop sleeps, reboots, or
closes a lid, and the clone that drives a local crew dies with it — the tree survives,
uncommitted, unattended (`⚠️ WORK ORPHANED`). a grove is a machine nobody closes.

**a grove is reachable when this box is not.** the fleet's whole supervision loop — sweep,
poll, drill-in — is a remote loop by design; a local crew opts out of it.

**it keeps one machine the subject of a defect.** groves mint from one image, so a boot defect
there is shared and fixed once. a local boot fails in the human's own accreted environment, and
the diagnosis is unshared.

## .how to apply

1. name the live grove — `rhx git.grove.list`
2. pass it — `--grove cloud://<slug>`

⚠️ the slug is reminted on each rebuild — never memorize or copy an old one; read it fresh. a
stale slug fails loud at the ssh; a stale slug baked into a brief is a silent phantom path.

⚠️ `.ground` is a different account on the same box, not a grove to sprout on — take the one
with no suffix.

## .the carve-outs

each is a claim about the WORK, never a preference:

| when | why exempt |
|---|---|
| the work's subject IS this machine — a `repo=.this` skill, a local hook, this repo's own `.agent/` | a grove cannot exercise it |
| every grove is unreachable | try `rhx git.grove.wake <grove>` first; a local sprout is the fallback only if the wake fails, and it is then a caught dream to migrate |
| the human says local, explicitly | their box, their call |

"it is a small change" is NOT a carve-out — size predicts neither crew lifetime nor lid-close
risk.

## .the entoolment owed

a real fix would default `--grove` to the live grove rather than `local` — not built, since the
slug reminted on each rebuild makes a hardcoded default stale by construction. a real default
must look up the live grove (or fail loud and name the list). until then this rule is a cue a
human and a clone each carry by hand.

## .enforcement

- a sprout with no `--grove`, or `--grove local`, outside the carve-outs = **blocker**
- a local sprout taken because a grove was asleep, with no wake attempted = **blocker**
- a local sprout from a genuinely unreachable grove, no dream caught to migrate it = **nitpick**
- a grove slug typed from memory rather than read from `git.grove.list` = **nitpick**

## .see also

- `define.sprout-vs-seed.md` — the word that authorizes a tree boot; this rule governs only WHERE
- `term=grove._.choice._.md` — the grove, and why its slug is reminted
- `rule.require.confirm-behavior-size-above-nano.md` — the other gate every sprout passes
- `rule.always.catch-dreams-for-followups` (bhrain/learner) — what a forced local sprout owes
- `philosophy.entoolment-is-the-pinnacle` (bhrain/learner) — why a rule alone is rung 1

---

written by human + beaver 🦫
