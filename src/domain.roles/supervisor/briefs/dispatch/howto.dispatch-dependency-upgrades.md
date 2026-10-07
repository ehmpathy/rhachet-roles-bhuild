# howto.dispatch-dependency-upgrades

## .what

when a repo needs a dependency upgrade, dispatch a worker to run full `declapract.upgrade`.

## .why

eat technical debt upfront. `declapract.upgrade` handles all deps, not one. its route has
guards for quality. the worker has full repo context; you do not.

## .why NOT git.tree.behavior

a permitted exception to `rule.require.behaviors-over-adhoc`. `declapract.upgrade init` boots
its own bound route (stones + guards) — the structured equivalent of a behavior. a behavior on
top would stack a second route on one tree, so `git.tree.behavior` refuses a `declapract` name
and points to the verb below. not ad-hoc — the route already provides the bound scope + gates.

## .pattern — one call

```bash
rhx git.tree.declapract.upgrade --into org/repo --grove cloud://<groveslug>
```

takes no `--wish`, no `--size` — the upgrade route IS the scope. creates the worktree +
ducts, then boots install → `rhx upgrade` → `rhx declapract.upgrade init` → an enrolled
clone. watch it:

```bash
rhx git.crew.read --tree <tree> --who mechanic
```

never hand-roll a `git.tree.duct` + `duct.send` pair for this — it skips the boot hazards
this verb already cures (see `rhx git.tree.declapract.upgrade --help`).

## .why install, then rhx upgrade, always first

the paved verb does both for you. pick the package manager with an `if`, never a `&&`/`||`
ternary — a bare `npm install` in a pnpm repo writes a stray `package-lock.json`. install
first: a fresh worktree has no node_modules, and `rhx` needs local deps to run. `rhx upgrade`
next: latest cli, briefs, skills — stale tools mean stale patterns.

## .why full upgrade, not targeted

| targeted | full |
|----------|------|
| fixes one dep | fixes all deps |
| may miss cascades | catches cascades |
| debt remains | debt cleared |
| quick, shallow | thorough |

full upgrade clears debt while you are already in the repo.

## .the route

`declapract.upgrade init` creates a route with stones: invoke upgrade → detect hazards →
repair test defects → reflect on test defects → repair cicd defects → reflect on cicd
defects. the worker drives through them; you supervise via `rhx git.crew.read`.

## .when to dispatch

human says "upgrade best practices of $org/$repo" · human mentions "upgrade X in repo Y" ·
you notice an outdated dep in a worktree · declapract reports drift.

## .enforcement

a direct dep upgrade in a foreign worktree = blocker. always dispatch a worker with full
`declapract.upgrade`.

## .see also

- `howto.upgrade-best-practices.md` — the supervisor entry point: vocabulary, the
  leaf-service/library fork, the node/pnpm precheck, known toolchain drift
