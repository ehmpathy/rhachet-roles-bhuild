# F1 — the commit sponsor ships no default identity

## .the fork

the source skill `git.crew.commit.sponsor` reads `CREW_COMMIT_SPONSOR="${CREW_COMMIT_SPONSOR:-<the operator's real name + email>}"`
(source `crewwork.sh:8390`). the package cannot ship a real identity
(`rule.forbid.private-business-in-published-roles`, `rule.forbid.real-identities-in-fixtures`).

- **A.** no default. read `CREW_COMMIT_SPONSOR` from env, else a human-recorded value; absent → exit 2, name the fix
- **B.** default to the human's `git config user.name/email` at bind time
- **C.** default to a placeholder (`bert <bert@example.com>`)

## .taken — A, and why

C binds a human who does not exist, which is the exact failure the skill was written to prevent.
B reads the box's git config, which on a clone's box names a seaturtle identity, not a human (the
mechanic's `git.commit.sponsor` notes the same trap). A keeps the source's override path (env) and
fails loud where nothing is recorded.

## .rework — clean

the record's location (env vs a `.meter/` file vs reuse of `git.commit.sponsor`'s bind) is one
read function in `crewwork.sh`. a swap does not ripple.

## .confidence — 90%

read from source: the skill sends `rhx git.commit.sponsor set --who "<sponsor>"` into the crew's
seat, so it already *uses* the mechanic's bind as its target; the question was only where the
supervisor gets the identity. the source carries an empty-sponsor guard
(`[[ -n "$sponsor" ]] || ✋ --sponsor is empty; return 2`) and states it deliberately never reads
`git config` (a grove box's identity is not the human's). so: default the env var to empty, let the
guard fire, and teach the fix in its message. the residual 10% is taste — the wisher may want a
`.meter/`-style record instead of env.

## .where

`src/domain.roles/supervisor/skills/git.crew.commit.sponsor.sh`, `…/work/crewwork.sh`

## .verdict

**overruled by the wisher, 2026-10-12: a `.meter/` record**, not the env var.

the shape, mirrored on `git.tree.size.uses`:

- a human records the sponsor once: `! rhx git.crew.commit.sponsor set --who "bert <bert@example.com>"`.
  it writes `.meter/git.crew.commit.sponsor.json` at the repo root
- off a tty, `set` is refused unless the human's verbatim words ride along via
  `--approval '<their exact words>'`. the words are recorded with the sponsor, the same guard the
  size meter uses
- `rhx git.crew.commit.sponsor get` reads the record; the bind (`--tree <slug> --mode apply`) reads
  it too, and refuses with the fix where none is recorded
- `--sponsor` stays a per-call override. `git config` is never read, as in the source
- the clone is denied `set` and writes to that meter file by the permissions init (F6)

rework class unchanged: clean. one read function and one new subverb.

## .amendment, 2026-10-13 — the `--sponsor` override takes the same guard

found in a coherence pass: with only `set` behind the deny and the tty guard, the per-call
`--sponsor` override (source: "rarely right") let a clone bind any identity with one flag, around
the record. best-guessed: the override stays, behind the same tty guard (`--approval` off a tty) and
the same permissions deny as `set`. rework **clean** (one guard call, one deny line). confidence 90%.
alternative: drop the override — rejected, the source keeps it for a human to correct one bind.
