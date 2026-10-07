# domain.term.choice.reason: crew.resume

## .etymology

`resume` is **not a coinage — it is claude's own word**, printed by the tool at the moment the
state arises:

```
Resume this session with:
claude --resume "mechanic"
```

so the domain expert here is the tool, and it named the act before we did. per
`def.domain-discovery`, the ground truth is the practice rather than any doc we might author —
and this word was already in the practice's mouth.

`rule.require.resume-quota-capped-clones` had also already adopted it, in this repo, for the
second cause. **two independent uses of the word predate this cluster**, which is what makes the
pave a record rather than a decision.

### what it beat

- **`restart`** — its plain sense is *start again from the start*, which is exactly the outcome
  a resume avoids. the closest to a true antonym on the axis that matters
- **`reboot`** — worse, and already spoken for: `duct.reboot` is a live skill, and it starts a
  fresh clone. to reuse it here would be a genuine overload of two opposed acts
- **`revive`** — fits the husk cause and misses the quota one. a capped clone was never dead
- **`restore`** — names what happens to the CONTEXT, not what happens to the CLONE. every other
  verb in this family names the act on the clone (`boot`, `nudge`, `steer`, `fell`)
- **`wake`** — spoken for by `git.grove.wake`, over a different subject (a grove's tunnel), and
  the poll already prints `😴 asleep` for a crew on an unreached grove. to reuse it would collide
  head-on with an extant render
- **`reattach`** — tmux vocabulary, and false: the pane was never detached. the process died

⇒ four of the six rejects were rejected for **collision with an extant skill or render**, which
is a stronger reason than taste and the kind that is expensive to rediscover.

## .the enumeration that licensed it

per `rule.require.enumerate-before-you-name`, the instances were listed before the word was
picked:

| instance | the clone stopped because | is the context intact? |
|---|---|---|
| `feat-telepath-role`, 2026-09-04 tick 23 | `💥143` SIGTERM at 7h51m | ✅ 25.5MB, resumable |
| `rule.require.resume-quota-capped-clones` | a usage cap, reset since passed | ✅ |

**n=2, from two different causes** — which is the case the rule wants, since a word tested on one
cause cannot be shown too narrow.

and it excludes its neighbours, which is the half that fails silently:

| the neighbour | why `resume` is wrong for it |
|---|---|
| `boot` | ends with a clone that remembers naught |
| `nudge` | the clone was already at work |
| `steer` | the clone was already at work, and moved |
| `wake` (grove) | the subject is a machine, not a clone |

⇒ covers both rows, excludes all four neighbours. it holds.

## 🔴 .the asymmetry that gives this term its weight

`boot` and `resume` end in the same place and cost differently to get wrong:

| you did | and should have | the cost |
|---|---|---|
| **boot**, where a resume was available | resume | **every turn the clone had taken** — 7h51m, in the measured case |
| **resume**, where no session remained | boot | one error message, then boot |

⇒ **the wrong boot is silent and expensive; the wrong resume is loud and free.** that is the
whole argument for the order the `.what` states — *resume first, boot only where no session
remains* — and it is the reason the two need different words rather than one verb with a flag.

⚠️ and the fleet's only verb is the expensive one. `git.crew.boot` is what the poll prints for
every `💀 down` crew, with no mention that a resume may be available first.

## .evidence

**2026-09-04**, babysit tick 23. `rhachet-roles-bhrain.beav.feat-telepath-role/mechanic` was a
husk — SIGTERMed mid-turn at 7h51m, its vision yield unwritten, its stone converged and unsaid.
the sequence that recovered it, verbatim:

```sh
rhx git.crew.send --tree rhachet-roles-bhrain.beav.feat-telepath-role \
                  --who mechanic --what 'claude --resume "mechanic"'
# → a session picker renders: `mechanic · 21 minutes ago · beav/feat-telepath-role · 25.5MB`
rhx git.crew.send --tree ... --who mechanic --keys Enter
# → full context restored; the clone's own converged verdict back on the pane
```

⇒ **two calls, one act.** the second answers a picker the first summoned, and a caller who omits
it leaves the clone parked in a modal — the same stranded-paste failure shape
`rule.require.verify-after-send` exists to catch.

## .the verb it is owed

> `rhx git.crew.resume --tree <tree> --who <role>`

what it owes: derive the grove from the ledger · send the resume · **answer the picker itself** ·
fail loud where no session remains, and name `git.crew.boot` as the fix · verify the pane holds a
live box before it reports success.

⚠️ **and `git.crew.poll` owes a change too.** it prints `💀 crew: down — rhx git.crew.boot` for
every absent clone, which is the destructive half of the pair recommended unconditionally. where
a resumable session exists, the poll should name the resume first.

---

written by human + beaver 🦫
