# F18 — the shared cli schema gate keeps its exit code in this pr

raised by the 5.3 ergonomics review: `--via gh.discussions` printed `⛈️  error: input invalid` and
exited 1.

## .the fork

- **A** leave `getCliArgs` as main has it; catch the fix as a dream
- **B** change it here: `✋ ConstraintError:`, exit 2, for every skill

## .taken — A, and why at the time

- the gate is shared by every skill on `getCliArgs`; its exit code is a contract each caller may
  key on. a change here ships a cross-skill behavior change inside a comment pr
- `radio.task.comment` meets main's behavior exactly, as push and pull do; no new inconsistency
- the message itself names the valid set (`expected one of "gh.issues"|"os.fileops"`), so the fix
  is still discoverable
- caught as `.dream/2026_11_14.fix-cli-zod-gate-exit-code-and-header.dream.md`

## .rework — clean

one printer and its snaps, in a pr of its own.

## .confidence — 80%

## .where

`src/infra/cli/getCliArgs.ts`

## .verdict

open
