# F07 — the wake's probe accepts a new host key

- **the fork**: once the alias names a tailnet host, `known_hosts` has no key for it. options: (a) `StrictHostKeyChecking=accept-new` in the wake's probe — trust on first use; (b) fetch and pin the key out of band (a `git.grove.trust.gen`, which a hint names but this package does not ship); (c) leave it to the human to ssh once by hand
- **taken**: (a). `accept-new` refuses a CHANGED key, so a swapped box still fails loud. saturation already probes this way (`git.grove.saturation.sh:926`)
- **rework**: clean — one ssh option in one probe
- **confidence**: settled
- **where**: `1.vision.yield.md` § the contract, step 4
- **verdict**: **settled by the director, 2026-11-13** — trust on first use over the tailnet is acceptable, because the tailnet already authenticates each peer by its node key
