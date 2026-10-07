# rule.require.resume-quota-capped-clones

## .what

when a clone stalls on a vendor usage cap — `You're out of extra usage · resets <time>` — and
that reset time has ALREADY PASSED, heal it (`git.crew.heal`, which sends the continue). do not
merely name the cap and stop.

a cap whose reset is still future is a genuine block: name it once and move on. a cap whose
reset has passed blocks naught, and the clone sits parked only because naught told it to retry.

## .why

`rule.require.nudge-parked-clones` says "surface it once, named — no supervisor lever reaches a
vendor quota," which is exactly right while the cap is live. the moment the reset passes, that
inverts: the lever a supervisor lacked is now the one it holds — a keystroke. and the pane does
not change when a cap expires:

| | a LIVE cap | an EXPIRED cap |
|---|---|---|
| the pane | `out of extra usage · resets 10:10pm` | the same line, unchanged |
| the poll | box empty, idle | the same verdict |
| what a nudge buys | naught | the whole tree resumes |

the two states are byte-identical from outside, and only a clock parts them — so "name it and
stop" quietly converts a temporary block into a permanent one.

## .the discriminator

compare the reset time against now:

| the reset time is… | you must |
|---|---|
| future | name it once, stop — `rule.require.nudge-parked-clones` governs |
| **past** | **send a continue prompt** |
| absent/unreadable | read more lines; the cap prints several times as each queued turn meets it |

## .how to send it — through the tool, never by hand

`git.crew.poll --healable` names every capped crew heal can cure, and emits one line per tree.
run the emitted line (after the ⭐ check, `rule.require.spend-only-on-sponsored-trees`):

```bash
rhx git.crew.heal --tree $tree --mode apply
```

heal reads the reset against now and picks the cure axis: a nudge for a stale cap, an
`auth.swap` for a live one (`define.invariant.crew.ratelimit.healable-transient`). a hand-typed
resume is a byhand heal (`rule.forbid.byhand-heal`), and any prose it adds is the supervisor's
own judgment in a clone's turn (`rule.forbid.steer-a-clone-beyond-a-permission-key`).

then verify per `rule.require.verify-after-send` — a live spinner is the proof it took.

## .enforcement

- a clone left parked on a cap whose reset has passed = **blocker**
- a resume typed by hand where `git.crew.heal` serves = **blocker**
- a cap reported to the human with no read of its reset time against now = **nitpick**

## .see also

- `rule.require.nudge-parked-clones.md` — the quota row this amends
- `rule.forbid.byhand-heal.md` — why the cure lives in the tool
- `rule.require.verify-after-send.md` — why the spinner check is not optional
- `term=partial-audit._.choice._.md` — a complete read that answers the wrong question

---

written by human + beaver 🦫
