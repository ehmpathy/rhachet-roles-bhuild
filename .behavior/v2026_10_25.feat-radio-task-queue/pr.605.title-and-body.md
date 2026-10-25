# pr #605 — title and body

## title

feat(radio): radio.task.queue get|set|del|drain

## body

closes #604, closes #511, closes #513, closes #603

### .what

`radio.task.held` becomes `radio.task.queue`, with four verbs:

- `get` — every record held for the radio in this tree, with its state (held at gate · set aside · halted · not reached), its last fault, and the fix for it
- `set --key K` — amend a held record (`--description`, `--auth`); its place in line is kept. `--title` is refused; `del` and re-push instead
- `del --key K --why "..."` — drop a held record; the reason is kept on the record
- `drain [--auth A]` — deliver held records oldest first

`radio.task.held` stays as a deprecated alias of `queue get`, with a rename notice. the onStop hook now calls `queue get --when hook.onStop`.

### .why

measured 2026-10-25: one held update refused on bhuild#599 held every push to this repo behind it. no verb could drop it; a seat moved the record out of `.behavior/.radio/` by hand.

### .what each issue gets

| issue | outcome | left out |
|---|---|---|
| #511 head-of-line block | a record that faults (access, not-found, auth, unknown) is set aside and named; the rest still deliver. a wall (rate limit, outage) halts the drain and keeps the line in order | caseC (F2) and caseE (F3) ship as best guessed: a transient wall halts the line rather than skip past it; a record set aside stays set aside until amended or dropped. a flip is a clean rework |
| #513 `--auth as-human` | `push`, `set` and `drain` take `--auth as-human`; a fix line names it when a fault is an auth fault | naught |
| #603 edit an extant issue as-human | a push with `--exid` edits the extant issue under `--auth as-human`, through the radio | an edit outside the radio (F9): no github write outside the radio, per the wish's bound |

### .bounds held

- the radio.uses gate stays: a drain while radio.uses blocks delivers naught and says so
- no github write outside the radio
- each fault path has a clamp test, red with the fix reverted, green with it

### .tests

- unit: state, fix lines, upstream reason classifier, held output and stop line
- integration (real gh): drain past a faulted head, rate-limit halt and lift, not-found, auth override, 401
- acceptance: get, drain at a shut gate, del, set, title refusal, drain at an open gate; every step snapped

### .proof by ci

the gh-issues push acceptance suite (`skill.radio.task.push.via-gh-issues`) needs `EHMPATH_BEAVER_GITHUB_TOKEN`, a credential the author's host keyrack does not hold; locally it holds every push at `upstream:auth`. ci holds the credential, and its green shard `test-shards-acceptance (explicit, 2, skill.radio.task.push.via-gh-issues)` is the proof for that suite.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
