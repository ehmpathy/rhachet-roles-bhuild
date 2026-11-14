# F04 — ssm leaves the supervisor whole

- **the fork**: keep ssm as a fallback reach for ec2 (#652's shape), or remove it from the supervisor entirely (#653's shape, and the wish)
- **taken**: remove. the wish says "no supervisor path reaches a box through ssm". the ssm agent wait, port-forward, tunnel log, `git.grove.stop --prune orphans` hint, and the `localhost` keepalive rationale all leave `git.grove.wake`. `--timeout` stays and now bounds the ssh await after an ec2 resume. `--port` stays as the ssh port, default 22
- **rework**: clean — the wake is one file; a fallback could be re-added behind a flag
- **confidence**: 85%. the wish is explicit; the open part is flag shape
- **where**: `1.vision.yield.md` § the contract
- **verdict**: open
