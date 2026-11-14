# F02 — a loopback host is a tunnel relic

- **the fork**: extant ec2 rows hold `host: localhost, port: 36903` (the ssm tunnel). options: (a) read a loopback host as absent, fall back to `.name` on port 22; (b) require every row be re-registered with a tailnet host; (c) add a new field (`tailnetHost`) and ignore `.host`
- **taken**: (a), with the fallback `.exid // .name` rather than `.name`: a `.ground` row's name is a seat (`grove-x.ground`), its exid is the box. zero human steps on upgrade, and `.host` keeps one sense (where the grove answers)
- **rework**: clean — the rule lives in the reach transformer (F05)
- **confidence**: 75%. it rests on magicdns: the grove's `.name` must be a name the tailnet answers to. #653 lists that as an assumption to confirm. if it is not, the row sets `host` to the tailnet ip, which this rule honors
- **why low**: a local grove (the supervisor's own box) could legitimately be `localhost` — but local has no forest row (`git.grove.saturation.sh:180-189`), so no row is misread
- **where**: `1.vision.yield.md` § the contract · `case=3`
- **verdict**: open
