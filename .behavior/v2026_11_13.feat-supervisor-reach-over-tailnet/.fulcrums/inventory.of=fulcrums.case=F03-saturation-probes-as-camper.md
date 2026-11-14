# F03 — saturation probes through the camper entry

- **the fork**: the fold picks its prober by sort order, which lands on `.ground` (`git.grove.saturation.sh:169-178`). ground is refused over the tailnet (#653). options: (a) prefer the entry whose user is `camper`; (b) prefer any non-`.ground` entry; (c) try each entry until one answers
- **taken**: (a), with a fallback to the first entry when no camper entry exists
- **rework**: clean — a prober choice in one loop
- **confidence**: 80%. the oom read already reads `user.slice` (the aggregate), so the camper uid sees what ground saw (`git.grove.saturation.sh:360-389`). unverified: whether any other saturation arm needs a ground privilege
- **where**: `case=6`
- **verdict**: open
