# F7 — `rhachet` rides a git pin to `ehmpathy/rhachet#main`

## .the fork

- (a) keep `rhachet@1.50.0` — the clamp itself needs no more
- (b) pin `github:ehmpathy/rhachet#main`, which carries #636 (the reviewer-enroll depth fix)

## .taken — (b), and why at the time

on 1.50.0 every l3 peer lane refused with `clone enroll depth budget spent` and read no code, so
5.1 could never be reviewed. the efficiency seat ordered the upgrade verbatim: `rhx
set.package.upgrade --package rhachet --to github:ehmpathy/rhachet#main`, and that the pr body note
the pin retires when v1.50.1 releases. with it, both l3 lanes ran (i006).

## .rework — clean

one `rhx set.package.upgrade --package rhachet --to 1.50.1` once that version publishes; the
lockfile follows. the halt snapshot may need a `--resnap` if the released text differs.

## .confidence — 90%, and why it is not higher

the order came from the efficiency seat, not the wisher directly. a reviewer asks to revert it
before merge; that is the council's call between the two.

## .where

`package.json`, `pnpm-lock.yaml`; the pr body names the retirement.

## .verdict

(open — for the council)
