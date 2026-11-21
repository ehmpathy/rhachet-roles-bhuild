# F28 — the acceptance refusal snapshots hold stdout and stderr merged, so the 🪨 header shows twice

## .the fork

a refused skill prints rhachet's `🪨 run solid skill …` header on stdout, then again on stderr
with `└─ ✋ blocked by constraints`, then the refusal.

- **A (taken)**: snap the merged streams, both headers and all, as one terminal shows them
- **B**: snap stderr alone, or strip the first header

## .taken, and why at the time

the snapshot exists so a reviewer sees what a human sees (`rule.require.snapshots`). a terminal
interleaves both streams, so a human sees both headers. B would show a view no human ever reads,
and would hide a change to either stream. the two headers are rhachet's frame, not the phone's
render, and the phone does not own them.

## .rework

clean. `asSnapOfSteps` in the acceptance test is the one site.

## .confidence — 80%, low because

the second header reads as noise, and a reviewer may prefer the phone's own lines alone.

## .where

`blackbox/role=dispatcher/skill.phone.acceptance.test.ts` (`asSnapOfSteps`), raised by r11 n3 at
5.3 i004.

## .verdict

(open — for the council)
