# F09 — a row's `.host` pins a drifted tailnet name; `.exid` is only the fallback

- **the fork**: the vision assumed a grove's magicdns name equals its exid. the rebuilt hetzner box rejoined the tailnet as `grove-ahbode-hetzner-v20261022-1`, and magicdns still answers the exid with the old, offline node. options: (a) keep the F02 rule — a non-loopback `.host` wins, `.exid // .name` is the fallback — so a row pins the live name; (b) ask `tailscale status --json` for a live node whose name starts with the exid — a guess across `-1`, `-2` that could pick a wrong box; (c) require `.host` on every row — breaks every extant ec2 row, whose exid does answer
- **taken**: (a). the rule already holds it, so no new code. the no-answer cure names `tailscale status` first, which shows the drifted `-1` name beside the offline one, so the human sees the fix
- **evidence**: `appendix/5.1.execution.probe.tailnet-reach.md` — the exid probe timed out on 100.118.18.46 (offline 10d); `…-1` answered, ssh exit 0
- **rework**: clean — a lookup by node prefix can be added to the transformer later
- **confidence**: 80% — the drift case rests on one rebuilt box
- **where**: the reach transformer · the no-answer cure · `1.vision.yield.md` open question "magicdns name = exid"
