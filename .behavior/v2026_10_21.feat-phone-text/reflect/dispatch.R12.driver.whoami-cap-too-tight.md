# fix(route.drive): the `clone whoami` cap (10s) halts healthy drives; raise to 90s

kind: fix · into: ehmpathy/rhachet-roles-bhrain · role: driver

## .the cue

`rhx route.drive` halted at a stone with a `brain:` switch:

```
✋ halted, brain switch could not land
   ├─ this driver runs = unknown — the clone probe did not answer in time
   └─ `clone whoami` was still alive at the 10s cap, and was killed
```

the clone was healthy. the same probe by hand, on the same grove, moments later:

```
$ time rhx clone whoami --output json
{ "serial": "20fa7ac9-…", "slug": "mechanic", "reachState": "LIVE", ... }
… 8.229 total
```

## .the gap, precisely

- `dist/domain.operations/route/brain/getCloneAddress.js:19` — `WHOAMI_TIMEOUT_MS = 10000`
- its own note: measured on rhachet 1.47.6, p50 5537ms, p95 ≈ 6500ms. on rhachet 1.50.0, on a
  grove with several clones at work, a healthy probe takes ~8.2s: 2s of headroom, so any load
  halts a healthy drive with a timeout that names no real defect
- `dist/domain.roles/driver/getDriverRole.js:41-45` — the onBoot hook `route.drive --when
  hook.onBoot` is capped `PT25S`, sized to the 10s probe. a larger probe cap needs a larger hook
  cap, or the hook kills the probe first

## .the shape of the fix

- `WHOAMI_TIMEOUT_MS = 90000`, with the note updated to the new measure
- the onBoot hook `timeout: 'PT120S'` (90s probe + the drive-state lock twice)
- `getCloneAddress.integration.test.ts [case8]` clamps the cap against the smallest `route.drive`
  hook timeout, so it moves with them
- worth a look beside it: why `clone whoami` takes 5–8s at all. it reads one env var
  (`RHACHET_CLONE_SERIAL`); the cost is likely the rhachet bin boot. a faster probe shrinks the
  whole problem

## .the local stopgap

`rhachet-roles-bhuild` carries a `pnpm patch` of `rhachet-roles-bhrain@0.42.1` with exactly these
two values, on branch `beav/feat-phone-text`; it drives green past the brain switch with it.
