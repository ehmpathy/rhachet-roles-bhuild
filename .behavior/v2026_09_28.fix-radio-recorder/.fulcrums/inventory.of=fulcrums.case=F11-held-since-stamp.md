# F11 — the clock a drained line's "held since" reads in

## .the fork

case=3 sketches each drained line with `(held since 09:14)`. the record holds `heldAt` as a utc
iso stamp. how does the line render it?

- **A. utc stamp with date** — `(held since 2026-09-29T09:14Z)`
- **B. local clock, time only** — `(held since 09:14)`, as the sketch reads
- **C. relative age** — `(held 5h)`

## .taken, and why at the time

**A.** one read on every machine and in every snapshot (no tz drift in tests). the date keeps a
task held for days legible — a bare `09:14` from last tuesday reads as today.

## .rework

clean — one transformer, `asRadioHeldSinceLabel`.

## .confidence — 80%, and why it is low

the sketch shows B, and a human reads local time faster. A trades that glance for a
deterministic, unambiguous read.

## .where

`src/domain.operations/radio/record/asRadioHeldSinceLabel.ts`

## .verdict

open
