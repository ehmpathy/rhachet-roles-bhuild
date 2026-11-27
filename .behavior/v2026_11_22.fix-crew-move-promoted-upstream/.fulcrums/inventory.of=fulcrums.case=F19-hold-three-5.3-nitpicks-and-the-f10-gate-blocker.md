# F19 — hold three 5.3 nitpicks, and the F10 gate blocker, on cited ground

## .the fork

stone 5.3 level 1 raised four points this round holds rather than changes:

- r001 blocker.1: `.husky/check.timestamps.sh` drops the `.eco/*` exemption
- r001 nitpick.1: the move's success tail names `rhx duct.bar.probe`, a duct verb
- r003 nitpick.1: the real registry install and the real `rhachet roles link` are faked in the move suite
- r004 nitpick.1: `crew.refresh`'s home correction is not snapped at the crew grain

## .taken

| point | taken | why |
|---|---|---|
| r001 blocker.1, `.eco/*` exemption | hold, per F10 | the `.husky/*` diff is the worktree's declapract upgrade, not this route's work. F10 keeps it out of this route's commit, so the shipped gate keeps its `.eco/*` exemption (HEAD's copy). the hazard is real for whoever lands the upgrade: it is handed to the human as a merge hazard, with F18's |
| r001 nitpick.1, `duct.bar.probe` in the tail | hold | no crew verb reads a bar. the probe is read-only and the only paved read of a seat's bar on its grove; the miss path already speaks at the crew layer (`rhx git.crew.refresh --tree <t>`). a crew verb for the read is the dream `.dream/v2026_11_26.feat.crew-move-verify-reads-the-bar.md`, where verify reads each bar itself and the tail line goes away |
| r003 nitpick.1, registry install + roles link | hold | the real `npx rhachet roles link` runs in the supervisor acceptance suite (`genConsumerRepo`, case1–case3). a real registry install is a network call to npm in a unit of work whose subject is the move's halt and recovery ladder; each ladder rung is a scripted install error, which no real registry yields on demand. the install command itself is the tree's own (`pnpm install --frozen-lockfile`), not the move's code |
| r004 nitpick.1, `crew.refresh` render | hold | `crew.refresh` prints no line of its own: every line it shows is `duct.refresh`'s. a snapshot at the crew grain with `duct.refresh` faked is hollow (tried and reverted); with it real, it repeats `ductwork.status` case2 [t0] / [t1], which snap the `🏠 home anchor set` / `CORRECTED` lines. case11 proves the crew's own act: which `--home` each duct is handed |

## .rework

clean: each is a local edit — restore one case arm, rename one tail line, add one case.

## .confidence

80%. the `duct.bar.probe` tail is the one a director may rule the other way; it is a one-line edit to name `rhx git.crew.refresh` instead, at the cost of a repaint where a read was asked for.

## .where

`.husky/check.timestamps.sh` · `work/movework.sh` (the tail) · `git.crew.move.integration.test.ts` · `work/crewwork.verbs.integration.test.ts` case11

## .verdict

settled by the driver, under the director's delegation: hold all four. the rework is clean, and none touches a credential or prod, so none goes up.

- `.eco/*` exemption: held out of this route; the shipped gate is HEAD's, so the exemption ships intact. the hazard travels with the F10 upgrade and is named in the pr body for whoever lands it
- `duct.bar.probe` in the tail: held; the only paved read of a bar. the dream `crew-move-verify-reads-the-bar` retires the line
- registry install and roles link: held; the real link runs at acceptance, and a live registry cannot yield the scripted install errors the ladder is tested on
- `crew.refresh` render: held; it prints only `duct.refresh`'s lines, which `ductwork.status` case2 snaps
