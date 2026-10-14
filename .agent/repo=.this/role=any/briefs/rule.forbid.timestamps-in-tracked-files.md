# rule.forbid.timestamps-in-tracked-files

## .what

never write a timestamp into a tracked file. a timestamp is any value that carries a time of day:

| kind | e.g. | verdict | enforced by |
|---|---|---|---|
| iso datetime | `YYYY-MM-DDTHH:MM:SSZ` | ⛔ forbidden | the gate |
| bare clock time | `HH:MM:SS` | ⛔ forbidden | the gate |
| epoch number | milliseconds or seconds since 1970 | ⛔ forbidden | 🟡 review + the writer's own test — the gate cannot tell an epoch from any other number |
| datestamp | `YYYY-MM-DD`, `vYYYY_MM_DD` | ✅ allowed | — |
| iso duration | `PT30M`, `PT12:30:00` | ✅ allowed — a span, not an instant | the gate strips it before the scan |

this binds every file this repo's code writes into a repo — radio queue records, dispatched
task files, route artifacts, snapshots, fixtures — and every file a human or clone commits.

## .why

- **a timestamp churns with no change in sense.** a rerun of the same act on another day
  writes new bytes, so every diff shows noise and a real change hides inside it
- **it breaks snapshots.** a snapshot that holds a clock value can never match twice
- **it trips the repo's own gate.** `.husky/check.timestamps.sh` halts any commit that stages
  one, so a writer that emits a timestamp leaves a file no one can commit as-is
- **order never needs a clock.** where records must line up, a stable sequence (`heldSeq`) or
  the file's own position gives the order, and gives it the same way on every run

a datestamp is allowed: it changes at most once a day, it names a coarse fact a reader wants
(which day a task was delivered, which day a route began), and the gate does not match it.

## .where a timestamp may live instead

| home | why it is safe |
|---|---|
| `.log/` | gitignored; logs are where wall-clock detail belongs |
| any untracked or gitignored file | never enters a diff |
| a lock or cache envelope under a dir that ignores itself (`.gitignore` of `*`) | the dir can never be staged |
| the git commit's own date | git already records when; the file need not |
| an upstream's own field (a gh issue `createdAt`) | the remote holds it, not the repo |
| a declared data store (`.eco/*`, the prioritizer's plaintext store) | a store row's `createdAt` is a fact of the data, not churn from a rerun; the gate exempts `.eco/*` by name |

## .how

- order by a sequence, never by a clock: `heldSeq` = 1 + the highest seq in the worktree. the
  order holds within one worktree; two branches mint apart, so a merge orders a seq tie by key
- when a record shape once held a clock field, shed it on read, so the next write drops it
- a settled record is never written again, so it keeps its legacy clock field until a human strips
  it once, via a temp file so a failed `jq` cannot truncate the record:
  `jq 'del(.heldAt, .settledAt)' record.<key>.json | rhx teesafe record.<key>.json.tmp`, then
  `rhx mvsafe record.<key>.json.tmp record.<key>.json`, then commit
- a value you pass in is yours: a push body with a pasted log line (`... at HH:MM:SS`, with real digits) writes that
  stamp into the task file, and the gate halts it. paste the gist, or mask the clock
- a self-ignored dir stops new files, not files git already tracks: untrack an extant lock dir
  once (`git rm -r --cached .behavior/.radio/.locks`)
- when a value needs a day, cut it to a datestamp (`asIsoDateStamp`)
- when a test fixture or snapshot shows a time, mask it (`THH:MM:SSZ`) or pin the clock
- prove it: assert the written bytes do not match the gate's pattern, and that two runs a day
  apart write the same bytes

## .examples

### 👎 bad — a clock value in a tracked record

```json
{ "title": "book-a-lesson reminder", "heldAt": "<an iso datetime>", "heldSeq": 3 }
```

every rerun rewrites `heldAt`, and the commit halts at the gate.

### 👍 good — order from a sequence

```json
{ "title": "book-a-lesson reminder", "heldSeq": 3 }
```

### 👍 good — a day, not an instant

```md
pushed_at: 2026-10-08
```

## .enforcement

- a timestamp written into a tracked file by repo code = **blocker**, unless the file is a home the
  `.where a timestamp may live instead` table names
- a timestamp committed by hand into a tracked file outside `.ts` / `.sh` = **blocker**, with the
  same exemptions (the gate exempts `.eco/*` by name)
- a writer with no test that proves its output holds no timestamp = **blocker**
- a datestamp = **false positive** (allowed)

## .see also

- `.husky/check.timestamps.sh` — the gate; adopted from declapract-typescript-ehmpathy, with
  repo-local additions marked inline (the `.eco/*` exemption, class-qualified headers, both halt
  branches on stderr, git's stderr kept out of the scan, the halt names "tracked files", staged paths listed raw so a
  non-ascii name reads). a
  declapract upgrade is not a no-op here
- `rule.forbid.any-time` (mechanic) — represent time with iso-time types inside code
- `rule.require.snapshots` (mechanic) — snapshots must be stable to be useful
