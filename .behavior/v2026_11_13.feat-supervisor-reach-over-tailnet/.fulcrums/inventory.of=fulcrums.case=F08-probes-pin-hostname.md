# F08 — every probe pins `HostName` on the command line

- **the fork**: an extant `~/.ssh/config` alias `Host <exid>` (written by the ssm-era wake) sends the exid to `localhost:<tunnel>`. ssh takes `HostName` from the config even when `-p` is on the command line, so a probe of `camper@<exid>` lands on a dead tunnel. options: (a) pass `-o HostName=<host>` on every probe — a command-line `-o` wins, no write; (b) `-F /dev/null` — bypasses the alias, but drops every identity and option the human set; (c) rewrite the alias before any probe — list and saturation are read-only and must not write
- **taken**: (a), in the reach transformer, so list, saturation, spend, and the wake await all carry it. the wake still upserts the alias (step 5), so a crew verb that reads the alias converges after one wake
- **evidence**: `appendix/5.1.execution.probe.tailnet-reach.md` — `grove-ahbode-v20260901` refused via config, exit 0 raw
- **rework**: clean — one option in one transformer
- **confidence**: 85% — not yet seen against a `Match` block, which this machine does not use
- **where**: the reach transformer · `git.grove.list` · `git.grove.saturation` · `git.grove.wake` step 4
