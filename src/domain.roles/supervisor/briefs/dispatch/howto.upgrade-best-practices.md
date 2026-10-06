# howto.upgrade-best-practices

## .what

"upgrade best practices" on a repo = dispatch a mechanic to run the full
`declapract.upgrade` route. not a targeted dependency bump. the supervisor's entry point
when a human says "upgrade best practices of $org/$repo".

## .the vocabulary

these name the same request: "upgrade best practices of $org/$repo" · "declapract upgrade
$repo" · "clear the drift on $repo".

declapract holds the org's declared best practices (cicd config, lint, test setup, deps,
scaffold). a repo drifts from them over time. the upgrade route re-applies the declared set
and repairs whatever breaks.

## .the flow

```bash
# one call: worktree + crew + install -> rhx upgrade -> route init -> claude drives
rhx git.tree.declapract.upgrade --into $org/$repo --grove cloud://$grove

# then supervise like any tree
rhx git.crew.poll --live --stones
```

## .why its own verb, not git.tree.behavior

a permitted exception to `rule.require.behaviors-over-adhoc`. `declapract.upgrade init`
boots its own bound route — stones plus guards, the structured equivalent of a behavior. a
behavior on top would put two bound routes on one worktree, so `git.tree.behavior` refuses a
`declapract` name and `git.tree.declapract.upgrade` is the peer verb.

## .never hand-roll the dispatch

the verb carries the hazards a hand-typed command misses:

- **lockfile** — it picks the package manager with an `if`. the old hand form
  `{ [ -f pnpm-lock.yaml ] && pnpm install || npm install; }` ran `npm install` in a pnpm repo
  whenever `pnpm install` failed, and wrote a second lockfile into the pr
- **self-host install** — a repo whose `prepare` runs its own cli installs, builds, then
  installs again
- **order** — install before `rhx upgrade` (a fresh worktree has no node_modules); `rhx
  upgrade` before the route (stale tools reproduce stale patterns)

## .why the FULL upgrade, not a targeted bump

| targeted | full |
|----------|------|
| fixes one dep | fixes all declared practices |
| may miss related drift | catches the cascade |
| debt remains | debt cleared |
| quick, shallow | thorough |

the review cost is already spent in the repo — clear the whole drift.

## .the route

`declapract.upgrade init` lays these stones: invoke upgrade → detect hazards → repair test
defects → reflect on test defects → repair cicd defects → reflect on cicd defects. the
reflect stones feed defects back to declapract — how the org's declared practices improve.
not busywork; do not let a mechanic skip them.

## .fork: leaf service or library?

| repo kind | examples | extra steps |
|-----------|----------|-------------|
| leaf service / deployable | `svc-reminders`, `svc-rentals` | none beyond the route |
| library / npm package | `sdk-config`, `simple-dynamodb-client` | `howto.declapract-upgrade-libraries.md` |

a library carries stricter rules — a cycle propagates to every consumer, a heavy dep (aws
sdk) bloats every consumer's bundle. needs the dependency-injection pattern and a cycle-free
dpdm pass. a leaf service needs none of that.

## .precheck: node v22 + pnpm

if the repo is not yet on node v22.21.0 with pnpm, migrate first — the one-time runbook is
`sandpine-notebook`'s `howto.migrate-to-node-v22.md` (stays there: a one-time migration, not a
supervision practice). skip if the repo already meets the bar. do this first because the
migration deletes `package-lock.json`, and if that file survives into the upgrade run, npm
silently takes over from pnpm and produces the wrong lockfile.

## .what stays human-only

the route drives itself, but two exits need the human: `git.commit.uses` quota (the mechanic
cannot commit or rebase without it), and release authorization. all else (route stones,
budget, reviewer config) is the driver's — surface those two; never self-grant them.

## .known toolchain drift

two failures recur across repos — expect them, prefer the upstream fix:

- `npm@latest` resolves to npm@12, which needs node ≥22.22.2, while `.nvmrc` pins 22.21.0 →
  `EBADENGINE` kills the publish job. pin `npm@11` in the publish workflow (still satisfies
  the ≥11.5.1 oidc minimum).
- `.agent/.cache/` is neither tracked nor gitignored, so it blocks every `git tree del` at
  teardown.

both belong in the declapract template rather than a per-repo patch — the reflect stones are
the right place to push them back.

## .enforcement

- a direct dep upgrade in a foreign worktree = blocker; dispatch a mechanic
- a hand-rolled upgrade dispatch where `git.tree.declapract.upgrade` serves = blocker
- a behavior booted alongside the upgrade route = blocker; the route IS the structure

## .see also

- `howto.dispatch-dependency-upgrades.md` — the same flow, deeper on the why
- `howto.declapract-upgrade-libraries.md` — the library-only extra steps
- `howto.upgrade.scope=node-package.md` — post-upgrade checklist for a package
- `sandpine-notebook`'s `howto.migrate-to-node-v22.md` — the node/pnpm precheck, out-of-package
- `rule.require.verify-after-send.md` — always `git.crew.read` after a send

---

written by human + seaturtle 🐢
