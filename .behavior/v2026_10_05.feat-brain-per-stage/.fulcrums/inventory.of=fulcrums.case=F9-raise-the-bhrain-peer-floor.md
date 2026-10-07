# F9 · raise the bhrain peer floor to `>=0.39.0`

## .the fork

- **a.** raise `peerDependencies["rhachet-roles-bhrain"]` from `>=0.30.4` to `>=0.39.0`, and keep
  the dev dep at `0.39.2` (already bumped on this branch)
- **b.** leave the peer floor; a consumer on 0.30–0.38 silently runs without the switch

## .taken — a, and why

the wish: "every behavior route this repo inits picks its brain by stage". a route inits in a
consumer repo, against the consumer's bhrain. a pre-0.39 parser sets `currentKey` only on
`artifacts | reviews | judges | protect` (`v0.38.0 parseStoneGuard.ts:229-317`), so a `brain:` line
is ignored — no error, no switch. the wish would hold in this repo and quietly fail in a consumer
on an older bhrain. a peer floor of `>=0.39.0` makes the package manager warn at install.

## .rework

clean. one line in `package.json`; no code hardens against it.

## .confidence — 85%, and why not higher

a peer bump changes the contract consumers see; the wisher may prefer to leave the floor wide and
accept the silent no-op on old consumers.

## .where

`package.json` `peerDependencies`.
