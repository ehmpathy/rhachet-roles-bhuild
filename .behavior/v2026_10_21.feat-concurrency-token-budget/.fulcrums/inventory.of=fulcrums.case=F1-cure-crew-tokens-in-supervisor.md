# F1 · the token reader lives in this repo, supervisor role; nheuron's `git.crew.tokens` is a reference, never ported

- **the fork**: which repo owns the fleet-level token reader —
  - (a) **this repo, supervisor role** (`src/domain.roles/supervisor/skills/`) — the lean
  - (b) **bhrain**, as a fleet-wide read any role composes
- **taken**: (a), the lean. two reasons:
  1. **one build for the compose.** the reader folds in `grove.census` and `grove.boot.cost` (the
     boot toll is already folded into `grove.census`). the token half and the grove half then
     compose into `git.grove.capacity` (F4) inside one repo, one build, one test suite
  2. **its peers live there.** every verb it composes with — `git.grove.saturation*`, `git.crew.*` —
     sits in the supervisor role
- **the bhrain seam**: both repos need one piece — the **usage-line reader** (read a transcript's
  `message.usage` lines, dedupe per api message id, cost-weight them). bhrain has a crew on it
  (`rhachet-roles-bhrain.beav.feat-transcript-token-inventory`). **first to land owns the shared
  usage-line reader**; the other imports it and keeps only what sits above it
- **nheuron's `git.crew.tokens`**: read as a reference for its contract and blind spots (actor dirs,
  `_worktrees`, cost weight, EPIPE under load), never ported
- **both options stand before the commander** (Q-B1, fleet.asks #41). his call
- **rework**: clean — the reader is one read-only verb; a move to bhrain relocates it and its test,
  and `git.grove.capacity` imports it
- **confidence**: 60% — the lean is the director's; who owns fleet-level reads is unruled
- **risk**: low — a read-only meter of local transcripts; no credential, no prod write
- **where**: `5.1.execution.from_vision.yield.md` · Q-B1, `.what execution builds`
- **verdict**: open — the commander rules on fleet.asks #41. the director set the lean and struck
  the port (2026-10-26); the earlier Q1 rule (a port of nheuron's source) is superseded
