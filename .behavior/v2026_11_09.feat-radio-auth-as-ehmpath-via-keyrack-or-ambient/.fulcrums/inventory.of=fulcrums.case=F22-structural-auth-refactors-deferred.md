# F22 — the structural radio auth refactors are dreams, not this stone

- **fork**: the peer named five structural defects with no change in behavior: an ambient-reader port (arch blocker 1), provenance as a plain return and one context builder and one context type (blockers 4, 5, 6), a grammar registry (blocker 7), and the keyrack unlock note on stdout (hazard 4). (a) land them in 5.1 · (b) land the parts that close a behavior gap, and catch the rest as dreams
- **taken**: (b). landed: ordered spots and one coordinate (blockers 2, 3), and the display policy out of the derive (`AuthSource` + `asAuthSourceShown`, blocker 4's policy half). each rest item changes a contract across 10–20 files and every radio test harness, with no change in any output; each fails CLEAN for a stone whose deliverable is the four values. the extant guard is fail-safe: no test can reach a real gh
- **rework**: dirty only in size, not in direction — each dream is additive on top of this branch
- **confidence**: 70%. the reviewer may hold that a scope leak in prod code is a blocker whatever its size
- **where**: dreams `2026_11_24.refactor-radio-auth-ambient-reader-port`, `2026_11_24.refactor-radio-auth-one-context-and-provenance`, `2026_11_24.refactor-radio-auth-grammar-registry`, `2026_11_24.fix-radio-keyrack-unlock-logs-past-the-emit-channel`, `2026_11_24.refactor-radio-auth-leaves-out-of-dispatchers` (the walk/miss split, one memoized identity read, the dispatcher leaves)
- **verdict**: —
