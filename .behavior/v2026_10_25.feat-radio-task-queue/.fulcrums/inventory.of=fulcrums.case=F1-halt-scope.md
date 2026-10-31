# F1 — halt scope

- **the fork**: (a) no fault ever halts — every faulted record is set aside · (b) a transient fault halts only its target's lane · (c) a transient fault halts the drain, as today; every other fault sets one record aside · (d) a transient fault halts only the records under the same auth
- **taken**: (c). #511 states it: "a transient failure (network, 5xx, rate limit) keeps today's oldest-first order and stops the drain, as now". a rate limit is a fact about the token, and an outage about github, so (b) keys the halt on the wrong value — the next repo under that token meets the same wall. (a) would fire every record left into the wall and could let a later update overtake an earlier one. (d) is the most precise, but no case shows a mixed-auth queue behind a wall
- **rework**: clean — the halt key is one value in the drain fold; (d) swaps it for the record's auth
- **confidence**: 85%. low part: an unknown `upstream:fault` text is set aside, not halted. if it is in truth an outage, each record retries and fails once per drain — benign (idempotent findsert), but noisy
- **where**: `setRadioTaskRecordUpstream.ts` (`halt: true` on every fault), `setRadioTaskRecordsDrained.ts` (one `halter`)
- **verdict**: —
- **history**: (b) was taken in the first draft; review 4 found it mis-keyed against #511's own words
