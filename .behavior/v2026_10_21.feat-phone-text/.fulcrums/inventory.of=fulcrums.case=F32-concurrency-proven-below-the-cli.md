# F32 — the concurrency paths are proven below the cli, never raced through it

## .the fork

two writers at once: eight sends into one mailbox (S26), two daemons that start at once (P9).

- **A (taken)**: prove each race at the layer that holds the lock, where the race can be forced every
  run — `daoPhoneMailbox` case "eight texts are written at once", `daoPhoneDaemon` "two daemons claim
  the lock" and the stale-lock reclaim — and walk one reclaim through the cli (case11 [t5])
- **B**: race several `rhx phone.*` processes at once in the acceptance suite

## .taken, and why at the time

a cli race is not deterministic: each skill run loads the built package in a fresh node, 2s idle and
10–15s on a loaded grove (F30), so two processes rarely overlap in the window the lock guards. a test
that passes whether or not the two overlapped proves no lock (`rule.require.clamp-edge-cases`: a clamp
must bite). the dao tests force the overlap with `Promise.all` over the real fs, every run, and the cli
reaches the same dao calls with no other path between.

## .rework

clean. a cli race test could be added later beside the dao ones; naught rests on its absence.

## .confidence — 80%, low because

a reviewer reads "below the cli only" as a gap at the contract.

## .where

`src/access/daos/daoPhoneMailbox/index.integration.test.ts` (eight writers),
`src/access/daos/daoPhoneDaemon/index.integration.test.ts` (two claims, stale reclaim),
`blackbox/role=dispatcher/skill.phone.acceptance.test.ts` case11 [t5] (a crashed lock reclaimed through
the cli). raised by r010 n6 at 5.3 i005.

## .verdict

(open — for the council)
