# domain.term.choice.reason: grove.tunnel

## .etymology

`tunnel` is **adopted, never coined**. it is the ordinary word for a port-forward across
the whole networked world — `ssh -L` is universally "an ssh tunnel" — so a traveler
recognizes it with no gloss, which is the first test in `def.domain-discovery`.

the skill already spoke it before this cluster existed. `git.grove.wake.sh` names it
`tunnel` in its comments (§3 "findsert the **tunnel**"), in its failure text (*"the
**tunnel** did not relay within 40s"*), and in its own log path
(`git.grove/tunnel.<grove>.log`). the word was in use and undeclared — the exact arrears
`rule.require.domain-term-itemization` exists to close.

### why not `port-forward`

it names the **mechanism** (a port, forwarded) rather than the **motive** (a way through
to a grove). `howto.domain-discovery` move 2 is *name from the motive*, and the motive
outlives the mechanism: were the relay to become a vpn or a wireguard link tomorrow, the
tunnel would still be the tunnel and `port-forward` would be a lie.

### why not `session`

`session` is a **forbidden synonym of `duct`** already. and ssm's own vocabulary calls
this a session (`aws ssm start-session`, `SessionId: vlad-…`), which makes it exactly the
kind of borrowed tool jargon `def.domain-discovery` warns against: *"the map is not the
territory."* ssm's noun is ssm's, not ours.

## 🔴 .the OVERLOAD this term resolves — `duct` named two concepts

`git.grove.wake.sh:481` prints the tunnel under the word **`duct`**:

```
duct [SET] localhost:36903 → grove-ahbode-v20260901:22 (pid 328173)
```

but `term=duct._.choice._.md` declares a duct to be **"an addressable channel to one
worker's keyboard"**, addressed `duct://<host>/<tree>/<role>`. an ssm port-forward is not
a keyboard, has no tree, and has no role. **one word, two concepts** — the shape
`rule.forbid.domain-term-ambiguity` grades a blocker.

⇒ and per that rule, *"the overload hides an ABSENT DISTINCTION."* it does here, exactly:
the tunnel had no word of its own, so it borrowed the nearest one. this cluster is the
distinction, and the borrow can now end.

### why it went unseen

the two senses **never appear together**. `duct.*` speaks of keyboards; `git.grove.wake`
speaks of the forward. a reader of either surface alone meets one sense and reads it
plainly. only a reader who holds both at once — as a supervisor did while it diagnosed
the drop — sees the collision.

### what is owed, named rather than deferred in silence

⚠️ **the wake skill's output line is NOT changed here.** it is one string, and it is the
line every operator has learned to look for. a rename belongs with a read of every
snapshot that captures it, and this round did not do that read.

⇒ recorded as arrears. the correct line is `tunnel [SET] localhost:36903 → …`.

## .evidence — the measured idle-reap, 2026-09-03

the fleet lost every grove terminal at once. the tunnel's own log, verbatim:

```
Starting session with SessionId: vlad-e273u4gea6x7bk3uoctc3i8p74
Port 36903 opened for sessionId vlad-e273u4gea6x7bk3uoctc3i8p74.
Waiting for connections...
Connection accepted for session [vlad-e273u4gea6x7bk3uoctc3i8p74]

SessionId: vlad-e273u4gea6x7bk3uoctc3i8p74 : Your session timed out due to
inactivity and has been terminated.
```

**three such terminations in one log**, plus one
`Cannot perform start session: write tcp …: write: broken pipe`.

⇒ so the tunnel is **reaped for idleness by aws**, on ssm's `idleSessionTimeout`. no
process on this machine chose it, and no defect in the wake skill caused it.

### the layer split, proven the same day

`rhx git.grove.wake` on the dead grove answered:

| line | what it proves |
|---|---|
| `box i-0642a53a180f22a32 [KEEP] already up` | the **box** never stopped |
| `ssm Online` | its agent never dropped |
| `duct [SET] localhost:36903 → … (pid 328173)` | the **tunnel** was the sole casualty |

and the poll that followed found **all 9 grove crews still `at work`**, tmux intact.

⇒ that is the whole case for a term of its own: three layers, one of which died, and the
other two provably fine. a vocabulary with no word for the middle layer cannot state that
sentence.

### the discriminator, and why it is in the say file

`Connection refused` on a **localhost** port means no local listener — the tunnel. a
**timeout** means a listener answered and the far host did not — the box. this is the
sole cheap way to part the two from the error text alone, so it belongs in the definition
rather than buried here.

## .the blast radius — one tunnel, every view

a tunnel's death is **fleet-wide by construction**, and this is the property most worth a
record:

`termwork.sh:1147` spawns each remote window as `kitty … -e ssh -t "$attach_host" "tmux
attach-session -t …"`. so the ssh **is** kitty's child process. when the tunnel drops:

```
tunnel reaped → localhost:<port> stops its relay → ssh's tcp breaks
  → ssh exits → kitty's -e child is gone → the window closes
```

every grove window at once, because every one of them rides the same single forward.

⚠️ `termwork.sh:679` already knew this failure shape — *"if the session is absent the
shell exits and the kitty dies instantly"* — for an absent tmux session. a reaped tunnel
is the same mechanism with a later trigger, and it was not anticipated there.

## .see also

- `term=grove._.choice._.md` — the box a tunnel reaches, and why its slug is reminted
- `term=duct._.choice._.md` — the word this one was borrowed from
- `term=crew._.choice.reason.md` — where `tunnel` is used in prose without a cluster
  (lines 435, 546), and the `💥`-vs-`😴` read that turns on the same layer split
- `rule.forbid.domain-term-ambiguity` — the rule the `duct` overload violates
- `rule.always.sprout-on-a-grove-never-local.md` — why every crew rides one of these
