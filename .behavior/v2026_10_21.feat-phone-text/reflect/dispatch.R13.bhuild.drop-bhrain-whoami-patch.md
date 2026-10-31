# chore(deps): drop the bhrain `clone whoami` cap patch once bhrain ships the fix

kind: followup · into: ehmpathy/rhachet-roles-bhuild

## .the cue

branch `beav/feat-phone-text` adds `patches/rhachet-roles-bhrain@0.42.1.patch` (wired in
`package.json` `pnpm.patchedDependencies`). it raises bhrain's `WHOAMI_TIMEOUT_MS` from 10s to 90s
and the driver onBoot hook from `PT25S` to `PT120S`, because a healthy `clone whoami` took 8.2s
and the 10s cap halted `route.drive` at every stone with a `brain:` switch.

the real fix is dispatched to `ehmpathy/rhachet-roles-bhrain` (the same two values).

## .the shape of the fix

once a bhrain release carries the raised cap:

- `rhx set.package.upgrade --package rhachet-roles-bhrain --to <that version>`
- delete `patches/rhachet-roles-bhrain@0.42.1.patch` and its `patchedDependencies` entry
- confirm `rhx route.drive` passes a `brain:` stone with no halt

until then, the patch stays: every route with a `brain:` switch halts without it.
