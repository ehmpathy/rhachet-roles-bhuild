# F05 — one reach transformer

- **the fork**: patch each reader of a row in place (wake, list, saturation, saturation.spend, the ~20 hint sites), or add one shared transformer that maps a row to `{ power, host, port, user }` and a hint per cause
- **taken**: one transformer, sourced by each site. #653 proposes the hint half (`grove.unreachable.hint.sh`); this widens it to the reach half, since F02 needs wake, list, and saturation to agree on the reach of a relic row
- **rework**: clean — a site that inlines the rule can be swapped to the call later
- **confidence**: 80%
- **where**: `1.vision.yield.md` § the contract
- **verdict**: open
