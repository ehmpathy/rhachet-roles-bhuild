# pr #605 — title and body

## title

feat(radio): radio.task.queue get|set|del|drain

## body

closes #604, closes #511, closes #513, closes #603

### .what

`radio.task.held` becomes `radio.task.queue`, with four verbs:

- `get` — every record held for the radio in this tree, with its state (held at gate · set aside · halted · behind the halt · waits behind · not reached), its last fault code, and the fix for it
- `set --key K` — amend a held record (`--description`, `--auth`); its place in line is kept. `--title` is refused; `del` and re-push instead
- `del --key K --why "..."` — drop a held record; the reason is kept on the record
- `drain [--auth A]` — deliver held records oldest first

`radio.task.held` stays as a deprecated alias of `queue get`, with a rename notice. the onStop hook now calls `queue get --when hook.onStop`.

the held output changes shape on purpose: each row reads its state, its auth, then its moves; the stop line counts records by state (`1 at a gate · 2 set aside (upstream:auth)`) and points to `queue get` for each fix. it no longer prints a bare fault code as `fix:`, nor `next push delivers them` beside a record that would fault again. a refusal shows its message without the error class prefix; the record keeps the full text.

### .why

measured 2026-10-25: one held update refused on bhuild#599 held every push to this repo behind it. no verb could drop it; a seat moved the record out of `.behavior/.radio/` by hand.

### .what each issue gets

| issue | outcome | left out |
|---|---|---|
| #511 head-of-line block | a record that faults (access, not-found, auth, unknown) is set aside and named; the rest still deliver; a later update to the same issue waits behind it, so one issue's updates keep their order. a wall (rate limit, outage) halts the drain and keeps the line in order. a drain starts no send past 3 minutes, inside its lock lease; the rest stay held for the next drain | F2 and F3 ship as best guessed: a record set aside retries once on every drain, and stays set aside while it faults, until amended or dropped; a send replays with the record's own auth, and `drain --auth` overrides it for every record that drain sends. a flip is a clean rework |
| #513 `--auth as-human` | `push`, `set` and `drain` take `--auth as-human`; a fix line names it when a fault is an auth fault | naught |
| #603 edit an extant issue as-human | a push with `--exid` edits the extant issue under `--auth as-human`, through the radio | an edit outside the radio (F9): no github write outside the radio, per the wish's bound. the as-human send is proven to the gh call (a stub gh on the path), not end to end on a real repo, since tests never write as a human |

### .bounds held

- the radio.uses gate stays: a drain while radio.uses blocks delivers naught and says so
- no github write outside the radio
- each fault path has a clamp test, red with the fix reverted, green with it

### .hardened on the way

a drain replays every record in the tree, so a record file is now treated as untrusted input:

- each gh call runs as an argv list, never as shell text; a title with `$(…)` or backticks stays literal
- an exid must be an issue number, and a record key must fit `[a-z0-9][a-z0-9-]*`, before any call
  or path join; an os.fileops path segment refuses a climb
- a persisted `shx(…)` auth never runs from a record; it runs only for the live push a human typed
- the drain lock owns one deadline; each auth derive, each shell call, and each gh call takes at most
  the time left, and no record starts near it, so a stall can never outlive the lock

two of these touch shared code: the os.fileops path guard and a timeout option on `shx`. both are
here because a drain now replays records from tracked files, which a merge can carry in.

a stored auth shows by its kind alone (`as-robot:shx(…), will not replay`), never as text a reader
could paste back; no stored auth reads `default (as-robot:via-keyrack(ehmpath))`, from the one
constant the send itself uses.

`.depcheckrc.yml` also ignores `.claude`: where `.claude` is a symlink into a per-actor dir,
depcheck walked a claude plugin cache through it and failed `test:lint` on a file no one wrote.

### .tests

- unit: state, fix lines, upstream reason classifier, held output and stop line
- integration (a stub gh on the path): drain past a faulted head, two updates to one issue held in order, rate-limit halt and lift, not-found, auth override; `get`, `set`, and `del` make zero gh calls (the wish's "no github write outside the radio")
- integration (os.fileops): the drain send budget, a lock lease overrun
- integration (real gh): a 401 on a rejected token
- acceptance: get, drain at a shut gate, del, set, title refusal, drain at an open gate; every step snapped
- acceptance (a stub gh on the path, through rhachet): a drain sets a faulted update aside, a flag the verb does not read is refused, then `set --auth as-human` and a drain send it; every step snapped

### .proof by ci

the gh-issues push acceptance suite (`skill.radio.task.push.via-gh-issues`) needs `EHMPATH_BEAVER_GITHUB_TOKEN`, a credential the author's host keyrack does not hold; locally it holds every push at `upstream:auth`. ci holds the credential, and its green shard `test-shards-acceptance (explicit, 2, skill.radio.task.push.via-gh-issues)` is the proof for that suite.

the same absent token turns two integration tests red on the author's host, and only there: `genAuthFromKeyrack.integration [case1]` and `getGithubTokenByAuthArg.integration [case3]` (both read `EHMPATH_BEAVER_GITHUB_TOKEN` from a real keyrack). ci's `test-shards-integration` is green for both.

### .left as is

nine `describe.skip` suites predate this pr and none of their files changes here: two radio
gh-issues suites (a demo-repo token), four `review.behavior` and one `review.deliverable` (claude
is not installed in ci), two brain-repl suites (a known seam defect). the radio pair's cheaper fix
— the keyrack beaver token already reaches the demo repo — is caught in a dream for a follow-up pr.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
