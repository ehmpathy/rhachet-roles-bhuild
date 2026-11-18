# F1: the gate covers gh.issues only

- **the fork:** gate every channel (os.fileops too) · gate only the channel that sends a remote request
- **taken:** gh.issues only. os.fileops writes files into a local repo and sends no request; the
  issue's clamp is phrased on the transport, and its row 1 reads visibility via `gh repo view`
- **rework:** clean — the gate is one call at the send site; extend it to os.fileops by a channel check
- **confidence: 85%** — low because a file written into a public repo's worktree becomes public once
  a human commits and pushes it. that is a later, human act, so it is left out
- **where:** the gate's channel check
- **verdict:** ruled as best-guessed, by the director at 1.vision approval
