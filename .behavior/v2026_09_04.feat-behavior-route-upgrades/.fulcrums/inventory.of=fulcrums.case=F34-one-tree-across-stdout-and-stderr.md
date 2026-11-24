# F34 — one tree across stdout and stderr

rework = clean · status = open · confidence = 80% · risk = rework only, no harm

## the fork

r006 nitpick.3: on a pre-grove refusal, `git.grove.keyrack` prints the `🔎` discovery tree to
stdout and its last `└─ ✋ …` leaf to stderr, so stdout read alone holds an open branch.

- **A — dispute: progress on stdout, the refusal on stderr** (taken)
- **B — close the tree on stdout, and repeat the refusal on stderr**

## taken, and why at the time

A. a terminal interleaves the two streams, so the human reads one balanced tree. a caller that
captures the streams apart reads stdout as progress and stderr as the reason it stopped, which is
the split `rule.require.exit-code-semantics` and the refusal headers ask for. B prints the refusal
twice in a terminal.

## rework, and why clean

one `echo` moves streams in one skill, plus a resnap.

## confidence, and why it is not higher

a log that captures stdout alone shows the open branch, and the reviewer is right that it reads
broken there.

## where

`src/domain.roles/supervisor/skills/git.grove.keyrack.sh`

## verdict

open — rides to the pr.
