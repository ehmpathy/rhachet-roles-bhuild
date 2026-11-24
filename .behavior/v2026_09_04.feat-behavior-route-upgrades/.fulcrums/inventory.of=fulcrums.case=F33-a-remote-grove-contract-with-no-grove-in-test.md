# F33 — a remote grove contract with no grove to test against

rework = clean · status = closed (driver, i003) · confidence = 95% · risk = rework only, no harm

## the fork

r003 blocker.1 asks `git.grove.keyrack.integration.test.ts` to call a real remote grove over
`ssh`. every case ran `local`, so `__grove_sh` and `__grove_login_sh` never took their `ssh` branch.

- **A — dispute, and hold the ssh case for a grove the driver cannot provision** (taken at i001)
- **B — fake `ssh` with a PATH shim that runs the far command through `bash -c`**
- **C — concede, and wait on a real `cloud://` grove plus its key**
- **D — a real ssh hop on this box: a throwaway `sshd -i` behind a ProxyCommand** (taken at i003)

## taken, and why

A rested on a false premise: that a reachable ssh target needs a grove and a key a human holds.
it does not. `sshd -i` speaks the protocol on a pipe, so a ProxyCommand reaches a real server with
no port, no network grove, and no grant. that premise was never checked at i001, which is why the
fork reached i003 at all.

D is taken. B stays rejected: B replaces the boundary; D keeps every real binary on it. the one
shim in D adds `-F <config>` to `/usr/bin/ssh` and does naught else.

## what the suite now proves over ssh

| case | proves |
|---|---|
| `a remote grove reached over a real ssh hop` | the reach probe passes, discovery reads the far side, the value rides stdin over the wire into `keyrack set`, and the sha256 read-back on the far side matches |
| `a remote grove that ssh cannot reach` | an unreachable grove is `💥 MalfunctionError: … cannot reach grove`, exit 1, never "no repo of org" |

ForceCommand pins the far side's HOME to the throwaway grove, so the real keyrack is never touched.
the case fails loud with a `ConstraintError` where `/usr/sbin/sshd` is absent; GitHub's ubuntu
runners ship openssh-server.

## what stays outside the suite

a production grove's own login profile: whether `rhx` is on its login PATH. the loopback far side
inherits the test's PATH. that miss fails loud at the `set`, `💥 … keyrack set failed`, on first use.

## rework, and why clean

one `given` in one test file. no caller changes.

## where

`src/domain.roles/supervisor/skills/git.grove.keyrack.integration.test.ts`

## verdict

closed by the driver at i003, under `define.invariant.fulcrum.self-sufficient-close`. it should
have closed at i001; the premise of A was checkable then.
