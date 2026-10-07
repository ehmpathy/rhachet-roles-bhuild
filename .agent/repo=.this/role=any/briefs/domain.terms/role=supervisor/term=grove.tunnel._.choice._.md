# domain.term: grove.tunnel

term.chosen   = tunnel
term.kind     = noun
term.boundary = grove
term.synonyms.forbidden:
- duct
- port-forward
- forward
- session
- link
- pipe

## .what

the **ssm port-forward that carries every reach to one grove** — a local port on this
machine, relayed to that grove's `:22`.

```
localhost:36903  →  grove-ahbode-v20260901:22
```

one tunnel per grove. every ssh, every `duct.read`, every `duct.send`, and every kitty
window on that grove rides the same one.

## .the layers it sits between

a tunnel is its own layer, and it fails independently of the two around it:

| layer | what it is | how it dies |
|---|---|---|
| **box** | the ec2 instance | stopped, or hibernated |
| **tunnel** | the ssm port-forward | **reaped for idleness**, or a broken pipe |
| **crew** | the tmux sessions on that box | felled, or the box died under them |

⚠️ **a dead tunnel and a dead box are indistinguishable from above.** both answer
`cannot reach <grove>`, and neither says which layer broke. the discriminator is the
error's own shape:

| the error | the layer | the cure |
|---|---|---|
| `Connection refused` on `localhost:<port>` | the **tunnel** — no local listener remains | `git.grove.wake` |
| a **timeout** | the **box** — a listener answers, the host does not | wake the box |
| 🔴 `Connection closed by 127.0.0.1 port <port>` | the **tunnel is ALIVE** — one channel broke | **retry** |
| 🔴 **no error at all** — degraded reach, crews that drift to `😴 unread` | the tunnel is **BOUND BUT MUTE** — an orphan holds the port | `git.grove.wake` |

### 🔴 .the fourth row is the one no error names — a BOUND port is not a LIVE tunnel

the first three rows are each reached through an **error string**. the fourth has none, which is
exactly what makes it the costliest: an orphaned process still **holds** `localhost:<port>`, so
every liveness check that asks *"is the port bound?"* answers yes, and no call ever yields a
`Connection refused` to match on.

⚠️ **measured 2026-09-08 on `grove-ahbode-v20260901`** — the grove that carried the whole fleet.
`git.grove.wake` named it in one line:

```
duct [REPLACE] port 36903 bound but mute — an orphan holds it
duct [SET]     localhost:36903 → grove-ahbode-v20260901:22 (pid 2019352)
```

⇒ **a bound port is a CORRELATE of a live tunnel, never a record of one.** the record is whether
traffic crosses it, and the only instrument that reads that is `grove.wake` itself.

🔴 **and the poll's `UNREACHED` warn does NOT catch it.** on the same read the poll flagged a
*different* grove — one absent from `grove.list`, so its printed cure (`git.grove.wake <grove>`)
refuses with `not registered` — while the grove that actually held a mute tunnel went unflagged.
the instrument named an unfixable grove and stayed silent about the broken one.

### ✅ .wake is a REPAIR verb, safe on a LIVE grove — do not wait for a grove to go down

the name reads as a boot, so it invites the misread *"only run this on a grove that is asleep."*
it is idempotent and per-leg: it keeps every leg that is healthy and replaces only the broken one.

```
nat  i-003b…  [KEEP]     already up
box  i-0642…  [KEEP]     already up
ssm            Online
duct           [REPLACE] port bound but mute — an orphan holds it
ssh            [KEEP]    alias matches the registry
```

⇒ so **run it on any reach defect you cannot attribute** — even on a fleet that merely feels slow
or drifts to `😴 unread`. it costs one call, it reports which leg it repaired, and a healthy tunnel
yields four `[KEEP]`s and no change.

🔴 **the third row is a CHANNEL death, never a tunnel death, and the two read almost identically.**
`refused` means no listener accepted at all; `closed` means one accepted and then dropped — so the
tunnel that served it is still up and the next call rides it with no repair.

⚠️ **measured 2026-09-08 on `grove-ahbode-v20260901`:** a `git.grove.auth` died with `Connection
closed by 127.0.0.1 port 36903` immediately after its duct boot. `git.grove.send <grove> --what
uptime` answered on the **very next call** — no wake, no repair — and the retry then ran clean.

⇒ the cost of the absent row is a **wrong cure**: a reader who matches on the word *"Connection"*
lands on row 1, concludes the tunnel is dead, and runs `git.grove.wake` on a healthy tunnel. it
does no harm and finds no defect, so the real cause (a transient channel drop) goes unnamed and
the reader hunts further.

⚠️ **n=1.** the row is entered on one measurement, and the `.why` of the layers table above already
named `a broken pipe` as a way a tunnel dies — so the CAUSE was known and only its **error shape**
was absent from the table a reader actually consults. a second instance would settle whether
`closed` is always transient or merely was this once.

## .what a tunnel's death does NOT touch

the crews. tmux runs on the box, so a reaped tunnel takes the **view** and never the
**work**. `git.grove.wake` reports the split plainly: `box [KEEP] already up` beside
`duct [SET]`.

## .refs

- `git.grove.wake.sh` — findserts it (§3, "findsert the tunnel"), and keeps its log
- `git.grove.list.sh` — renders each grove's `localhost:<port>` endpoint
- `git.grove.send.sh` · `duct.read.sh` · `duct.send.sh` — every remote reach rides it
- its log: `${XDG_STATE_HOME:-~/.local/state}/git.grove/tunnel.<grove>.log`

## .reason

see `term=grove.tunnel._.choice.reason.md` — the etymology, the measured idle-reap, and
the `duct` overload this term resolves.
