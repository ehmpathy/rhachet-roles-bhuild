# define.invariant.eco.the-store-is-plaintext-in-git

## .what

> **the store is the PLAINTEXT in git. the sqlite file is a derived MIRROR, and it is ignored.**

every write dumps `.eco/<table>.jsonl` for **every table the schema declares**; every open of an
empty db restores from them, and every open of a live db heals them. `.eco/priority.db` is
gitignored and disposable.

## 🔴 .the two words, and they were INVERTED here until 2026-09-14

| term | names | authority |
|---|---|---|
| **store** | `.eco/*.jsonl` | 🔴 authoritative — git carries it, a reviewer diffs it, a merge merges it |
| **mirror** | `.eco/*.db` | derived, gitignored, rebuilt from the store on any cold open |

⇒ **which file you may delete is the test of which one is the store.** delete the mirror and it
comes back; delete the store and the rows are gone from every clone.

⚠️ **the body of this brief still says `mirror` where it means the plaintext** — roughly 86 times.
the **contracts** were corrected on 2026-09-14 (`setStoreDumped`, `setStoreHealed`, `asStorePath`,
`asStoreRows`, `getAllStoredTables`); the **prose** is fixed forward on contact, because a blind
sweep would be wrong in every passage that legitimately means the sqlite side. read a stale
`mirror` below against the table above.

⇒ the settlement, its dispute, and the wisher's verbatim words: `term=eco.store._.choice.reason.md`
and `term=eco.store.mirror._.choice.reason.md`.

## .kind

🟡 **nurture.** nature permits a binary store — sqlite is a perfectly good file to back up. we
carry the plaintext because a binary store cannot be **reviewed**, cannot be **merged**, and
cannot be **restored from history**, and we paid for that lesson before we wrote it down.

## .the invariant, stated

```
write(db)        ⇒  COMMIT, then dump(jsonl)     — never the reverse
open(db)         ⇒  rows = 0  ∧  exists(jsonl)   ⇒  restore(jsonl)
open(db)         ⇒  rows > 0                     ⇒  dump(jsonl)      — the heal
rm(priority.db)  ⇒  loses naught. the next call rebuilds it
rm(*.jsonl)      ⇒  🔴 loses the store
```

⚠️ lines 2 and 3 are **exclusive by construction** and together **total** — a db either holds rows
or it does not, so exactly one fires, and whichever side is behind is the side that is repaired.

⇒ the last two lines are the whole claim. **which file you may delete is the test of which file
is the store.**

## 🔴 .why — the two failures, and the second is the one that earns an invariant

### 1. an uncommitted store has no backups at all

**measured 2026-09-13:** `.eco/` was untracked — a 56K sqlite file with zero copies anywhere. one
`rm -rf` or one lost disk and every prioritization judgment in it was gone. no history, no
recovery, no trace it had ever held rows.

that one is obvious, and its obvious repair is where the real hazard lives.

### 2. 🔴 the obvious repair — `git add priority.db` — is WORSE than the gap

three defects, and only the second makes this an invariant rather than a preference:

| defect | what it costs |
|---|---|
| `Binary files differ` | no review. a diff cannot show that an `urg` moved from 3 to 9 |
| 🔴 **git resolves a binary conflict to ONE SIDE, silently** | the other branch's rows are **dropped with no conflict marker.** a merge that reports success has deleted work |
| a whole-blob rewrite per edit | 56K into history for a one-field change |

⇒ **row two is the argument.** the first and third are annoyances a team could live with. the
second is a **silent data-loss engine**, and it fires precisely when two people prioritize in
parallel — which is the entire point of a shared store.

⇒ and the plaintext inverts all three at once: a jsonl diff shows the field that moved, a jsonl
conflict raises a **marker on the line** rather than a silent pick, and a one-field edit rewrites
one line.

## .why JSONL, rather than json or yaml

| property | why it matters here |
|---|---|
| **line-oriented** | one row per line, so a merge conflict is scoped to the row that changed rather than the whole document |
| **stably ordered** | dumped `ORDER BY` each table's own primary key, read from `PRAGMA table_info`, so two runs over the same state produce byte-identical files and the diff carries signal alone |
| **self-declared** | every line names its own columns, so a later column needs no migration of the dump format |

a single json document fails the first two — one array, one line, and every edit re-indents its
neighbours.

## .why the db is DERIVED, and not merely a peer

> **the jsonl can rebuild the db. a db cannot rebuild a git history.**

that asymmetry settles it. two files that hold the same rows are not equals — one is the record
and one is the index, and the one that can be regenerated is the index. so the db is ignored, and
a reader who wants to know what the store holds reads the text.

## 🔴 .the two orderings, and both are load-bearing

### the dump runs AFTER the commit, and OUTSIDE the try

```js
db.exec('BEGIN');
try { verdict = run(db, input); db.exec('COMMIT'); }
catch (error) { db.exec('ROLLBACK'); throw error; }
setStoreDumped(db, dbPath);   // 🔴 after COMMIT, outside the try
```

- **after the commit** — a dump inside the transaction mirrors rows a rollback is about to erase
- **outside the try** — a filesystem error on the dump must NOT roll back work that already
  committed. the write succeeded; only its mirror failed, and that is a smaller fact

### the restore runs ONLY into an empty db

```js
if (held > 0) return;   // a live store restores from naught
```

a restore into a db that already holds rows must decide which side wins, and **any answer to that
question is a silent overwrite.** so it declines to answer: the mirror seeds a cold cache and
never merges into a warm one.

⇒ and the restore reads its column names **from the row**, never from a hardcoded list — so a
column added next quarter survives every rebuild without a second edit.

## 🔴 .the completeness clause — the mirror is DERIVED from the schema, on both axes

> **no list of what to mirror may exist. the table set comes from `sqlite_master`, and the column
> set comes from `SELECT *` and from the row. what cannot be named cannot be forgotten.**

this is the clause that makes an omission **impossible** rather than merely unlikely, and it took
a measured hole to earn. the mirror once named its three tables by hand:

```js
const asMirrorPaths = (dbPath) => ({
  priority: …, gate: …, serve: …,     // 🔴 a second place the schema lives
});
```

⚠️ **a hand-written table list drifts in ONE direction only.** nobody removes a table from a
schema and leaves it in the list; the move that happens is the reverse — a fourth table is added
to `SCHEMA`, the list keeps its three names, and:

- the dump writes three files and **exits 0**
- the db answers every query correctly, so no surface reads wrong
- git holds **naught** of the fourth table
- a fresh clone restores three tables and reports a complete store

⇒ four steps, no error, no warn. that is `term=partial-audit` at the one place it costs the most —
the file that IS the record.

🟡 **and the clamps could not catch it either**, which is the sharper half. `[case29]` names
`priority` and `gate` by hand, so it grades the mirror complete over the subject set **it** chose.
a suite that enumerates from a list has the same defect as the code that enumerates from a list.

**so the clamps enumerate from the schema too** (`[case38]`): every table `sqlite_master` declares
has a jsonl twin · each twin holds exactly the rows its table holds · a rebuild from the plaintext
**alone** reproduces every table whole. and `[case39]` carries it into git: every emitted jsonl is
tracked, the db is not, and the committed text stands alone.

### 🔴 the third axis — the dump must RUN, and a new write verb cannot skip it

the two axes above prove the dump is **complete**. they prove naught about whether it **ran**.
`setStoreDumped` is called from exactly one place in `main`, so a second write path — a new verb,
a batch import, a repair routine — reaches the db and never the text.

⚠️ that is the quietest failure this store has: the write lands, the verb exits 0, every read
answers with it, and git holds a store one row behind. nobody learns until a clone.

⇒ so the VERB set is derived too, off the module's own refusal message (`[case40]`), and every
verb that is not the read verb must leave the mirror equal to the db. 🔴 **a verb with no fixture
FAILS rather than skips**, and the failure names its own repair:

```
[case40] the module declares a verb this clamp has no fixture for: 'bulk.import'.
  add one to FIXTURES so the clamp can prove that verb dumps its mirror.
  ⇒ a write verb that never dumps leaves git a store behind, silently
```

**that refusal is the mechanism.** a new write verb cannot land green until somebody proves it
dumps — which is what parts *"impossible to omit"* from *"unlikely to omit"*.

## 🔴 .the fourth axis — the dump must have RUN, and a crash is not an excuse

the three axes above prove the dump is **complete** and that it was **called**. none of them proves
it **finished**. a crash between `COMMIT` and the dump leaves the db one write ahead of the text,
and no clamp on a schema, a column, or a verb can see it — the defect is in the **time** between
two statements rather than in any list.

```
db.exec('COMMIT');     // ← the write is durable here
   💥                  // ← and the mirror is one row behind, with nobody to tell
setStoreDumped(...)
```

### 🔴 the repair is a HEAL on open, and it is nearly free

```js
setDbRestored(db, path);    // a cold db takes its rows from the text
setStoreHealed(db, path);  // 🔴 a warm db gives its rows BACK to the text
```

⇒ **the two are mirror images, and the pair is total.** whichever side is behind, an open fixes it:

| on open | the text is behind | the db is empty |
|---|---|---|
| what fires | `setStoreHealed` — re-dump from the db | `setDbRestored` — rebuild from the text |
| what it costs when both agree | 🟡 **naught** — the dump writes only on a real difference | naught — it declines while rows exist |

🟡 **the idempotent dump is what makes this affordable**, and it is not optional. the heal runs on
*every* open, a plain read among them, so an unconditional write would touch every mirror file on
every `get` — a dirty worktree from a read, which is its own defect.

### ⚠️ what the gap NARROWED to

it is not closed to zero, and to claim so would be false. what changed is the second clause:

| | before the heal | after |
|---|---|---|
| a crash mid-dump | text is behind until the next **write** | text is behind until the next **call of any kind** |
| real loss needs | a crash **+** a db deletion before the next write | a crash **+** a db deletion before the next call |

⇒ and a **read** now closes it, which is the whole gain — reads vastly outnumber writes, so the
window shrinks from *"however long until somebody mutates"* to *"however long until somebody
looks."*

### 🟡 .the third option the cost argument missed

this brief once declined the repair outright: *"the alternative is a two-phase commit across a
database and a filesystem, which costs far more than one row."*

⚠️ **the arithmetic was right and the option set was wrong.** it weighed exactly two moves — leave
the window, or make the write atomic — and a third sat between them:

> **do not make the WRITE atomic. make the NEXT CALL converge.**

a two-phase commit buys *"the text is never behind, not for an instant."* a heal on open buys
*"the text is never behind by the time anyone reads it"*, for one comparison per open and no
protocol at all. ⇒ **the second is what the invariant actually needs**, and the first was priced
against a requirement nobody had.

`[case41]` clamps it: a mirror with its tail line stripped, a plain **read**, and the row is back
in the text — with the db never rolled backwards to match the stale file.

## 🔴 .the fifth axis — a column may only hold what JSON can carry back

the four axes above all grade **presence**: every table, every column, on every verb, finished.
🔴 **every one of them can pass while the value in the file is not the value in the db.**

⚠️ **`BLOB` is the case that bites, and it is silent on every count.** node:sqlite hands a blob back
as a `Uint8Array`; `JSON.stringify` renders it `{"0":104,"1":105}` and **throws naught**; the
restore binds that object back as a string:

- the dump writes every file and **exits 0**
- the row counts match, and the column is present on both sides
- the db answers every query correctly, from the bytes it still holds
- git holds a store whose bytes are **gone**, in a shape that reads like data

### 🔴 .this was MEASURED, not reasoned

a `BLOB` column was planted in `gate` and the suite run. the result is the whole argument for a
fifth axis:

| the clamp | verdict with a BLOB column present |
|---|---|
| `[case38]` table + column | ✅ **passed** |
| `[case39]` the committed store | ✅ **passed** |
| `[case40]` every write verb | ✅ **passed** |
| `[case41]` the crash window | ✅ **passed** |
| `[case42]` **type** | 🔴 **red** — named `gate.probe — type 'BLOB'` and the fix |

⇒ **15 of 15 tests across the four prior axes went green on a schema that corrupts its own
record.** a fifth axis is not tidiness; it reads the one property the other four never do — not
*is the column there*, but **what can the column hold**.

### ⚠️ .why its allowlist is NOT the hardcode this invariant bans

a fair objection, and the answer is a real distinction rather than an exemption:

| the banned list | this allowlist |
|---|---|
| of **our schema's contents** | of **JSON's capabilities** |
| grows when we add a table | fixed by the format; grows never |
| drifts, because nobody updates it | cannot drift — there is no second copy to update |

🟡 **the subject set is still derived** from `sqlite_master` + `PRAGMA table_info`. the allowlist is
only what each *derived* column is then graded against. ⇒ the test remains: *does this list have to
be edited when the schema changes?* the banned one does. this one does not.

⚠️ `NUMERIC` is excluded on purpose. its affinity lets one column hold both a number and a string,
so what comes back depends on the row rather than the schema — **a clamp cannot grade a promise the
schema does not make.**

🟡 and the contrast worth the note: a 64-bit `INTEGER` past the safe range returns a `BigInt`, and
`JSON.stringify` **throws** on it. that one fails loud, so it needs no clamp. **the quiet failure is
the one that earns one**, which is why `[case42]` grades the declared type statically rather than
by a round-trip over whatever rows happen to exist.

## 🔴 .the sixth axis — the write itself must be ATOMIC

the five axes above grade the **content** of the dump. none of them grades the **instant** it lands
in, and that instant has a hole.

> **`writeFileSync` on an extant path TRUNCATES it, then writes.** two operations, and a crash
> between them leaves the file that IS the store torn.

| where the tear lands | what it leaves |
|---|---|
| mid-line | invalid json. the restore throws. **loud, and therefore fine** |
| at a newline | 🔴 valid jsonl, rows absent, no complaint from anybody |
| **at byte zero** | 🔴 an **empty file**. the whole store, gone, in a shape that reads real |

⚠️ **row three is not a corner case — it is the FIRST state of every rewrite.** the truncate lands
before the write, so on every dump there is a real instant in which the committed store holds
naught. lose the db in that instant and the store is gone whole, which is precisely the failure
this invariant opens by naming it.

### .the repair is one rename

```js
const temp = `${path}.tmp`;
writeFileSync(temp, text);
renameSync(temp, path);   // 🔴 atomic on posix, within one directory
```

⇒ a reader sees the **old complete file** or the **new complete file**. never a blend, and **no
instant exists in which it sees neither.** the window is not narrowed — it is removed.

⚠️ **the temp must sit in the same directory.** rename is atomic only within one filesystem; a temp
under `/tmp` degrades to copy-then-unlink across two, which reopens the very window it closes.

### 🟡 .why its clamp is STATIC, and why that is not a dodge

`[case43][t1]` reads the module's own source and refuses a direct `writeFileSync(path, …)`.

**a behavioral test cannot do this job.** atomicity is the claim that *no observer can catch the
file mid-write* — so the state it forbids is, by construction, one no test can schedule itself
into. ⇒ **the property is of the mechanism, so the mechanism is what gets graded.**

🟡 the behavioral half still earns its place beside it: `[t2]` tears the mirror to **empty** and
proves the heal rebuilds it. atomicity makes the tear impossible; the heal makes it survivable.
**two independent defences, and the clamp keeps them independent** — with the rename removed, `[t1]`
goes red and `[t2]` stays green, which is how you can tell they measure different things.

### ⚠️ .and the ignore was widened in the same round

`.eco/.gitignore` named `priority.db` **literally**. `--db` takes any path, so a run against
`.eco/other.db` would land a binary store no literal name covers — untracked, unignored, one
`git add .` from the silent merge-drop. it now ignores the **class** (`*.db`, `*.sqlite`), plus
`*.tmp` for a temp a crash strands.

🔴 **the same defect shape as the hand-written table list, one file over**: a literal name is a
second place a fact lives, and it drifts in one direction only.

## 🔴 .the six axes guard the WRITER. a READER can still lie

every axis above grades what the mirror **wrote**. not one of them grades whether the instrument a
human uses to **check** the mirror is answering about the store they named.

**measured 2026-09-14**, and the discovery is the argument. a by-hand verification of this very
invariant was run — copy the committed text somewhere empty, rebuild, count the rows:

```
rhx eco.priority get --db .temp/eco-coldstart/priority.db --status inflight
   ├─ from: .eco/priority.db          🔴 a path it was never pointed at
   └─ found: 8                            and 8 real rows, exit 0
```

⚠️ **`--db` is not a flag this tool takes.** the parser's fallthrough was `*) shift ;;` — an
unknown token, dropped in silence. so the read answered off the **live** store, headed its report
with the default path, exited 0, and **no db was ever built**. the check reported the restore
worked and had verified none of it.

### 🔴 .a dropped flag does not FAIL. it WIDENS

that is what makes it worse than a crash:

| the call | what came back |
|---|---|
| `get --slg dispute-or-concede` | 🔴 `count: 29` — the **whole store**, as a successful slug query |
| `get --db /elsewhere.db` | the live store, under a header naming the path it did not read |

**a superset holds the rows you wanted.** so the answer contains the right answer, reads complete,
and exits 0 — `term=false-report`, with no discriminator available to the reader.

⇒ and the same file **already refused an unknown VERB** by name, twelve lines below the silent
flag fallthrough. `grepsafe`, in this repo, refuses an unknown option outright. the behavior was
known and the parser simply did not have it.

### ⚠️ .why this belongs in THIS brief and not an ergonomics one

the invariant's whole load-bearing claim is *"the jsonl can rebuild the db."* that claim is
checkable by hand exactly one way — point a read at a rebuilt store — and **the instrument for it
was silently answering about a different store.**

🔴 **a clamp on the mirror cannot catch a reader that misreports its own subject.** so the claim
rested on the test suite alone, which is precisely the thing an independent check exists to
verify. `[case44]` closes it: an unknown flag exits 2, prints no rows, and names `--help`.

🟡 and the reach for `--db` was itself the tell of a second gap: **`ECOWORK_DB` was the real
lever, and it appeared in no usage block and no `--help`** — the identical defect `--surgoal`
carried, on the one capability that makes this invariant auditable. now documented.

### ✅ .the by-hand check, once the instrument was honest

```
29 priorities · 7 gate edges · an 88K priority.db, built from committed text alone
```

⇒ the restore is verified **independently of the suite that also verifies it.**

## 🔴 .seven axes read the FILESYSTEM. none reads the INDEX

every clamp above grades a **file on disk**. not one asks git whether that file can be
**committed**.

⇒ so the mirror can be perfect — every table, every column, every type, written atomically,
healed on each open — and git can refuse to track a byte of it. **the store is complete on
disk and absent from the commit**, which is the precise outcome this invariant exists to forbid.

⚠️ **measured 2026-09-14**: `*.jsonl` was added to `.eco/.gitignore` and **all 285 clamps across
the seven prior axes passed.** they pass *by construction* — each runs against a temp db outside
the repo, so not one of them can observe a rule in `.eco/` at all.

### the two directions are not one claim

| the rule must let… | because otherwise |
|---|---|
| `.eco/*.jsonl` be **tracked** | an ignored mirror never reaches a commit |
| `.eco/*.db` stay **ignored** | a committed sqlite is `Binary files differ` on review, and a merge takes one side outright |
| `.eco/*.tmp` stay **ignored** | a stranded temp peer holds a PARTIAL store that diffs like a complete one |

a rule broad enough to cover rows 2 and 3 — `*`, say — swallows row 1. so they are graded
apart, and a widened ignore trips exactly one of them.

### 🔴 the instrument lies by default, and it lied to me first

`git check-ignore` **skips any path already in the index.** so it answers *"is this file tracked
today?"* when the question asked was *"do the rules exclude this?"* — and those differ.

**measured the same day**: the first draft of `[case45]` omitted `--no-index`, `*.jsonl` was
planted, and the clamp **passed**. a clamp with no teeth, indistinguishable on the page from a
real one.

⇒ the durable claim is about the **rules**, never today's index. a **new table's mirror has never
been tracked at all**, so an index-aware read cannot see it excluded — which is the omission axis,
exactly. `--no-index` is not a refinement here; without it the clamp grades naught.

🟡 and this is `term=false-report` for the third time in this brief — after the `--db` flag and
after `[case41]`'s crash window. **an instrument confidently about the wrong subject** is the
defect shape this store keeps on emitting, and every instance so far was found when someone asked
*what exactly did that command measure?* rather than when someone read its exit code.

### 🔴 it lied a SECOND way, on the same flag — the rules it reads are MINE, never git's

`--no-index` fixed *"tracked today"* vs *"excluded by the rules"*. it left a second substitution
in place, and the same question catches it: **whose rules?**

> `check-ignore` reads the **work tree's** ignore files. a clone reads the ones **git carries**.

those diverge the moment an ignore rule is edited and not added to the index — the ordinary state
of any repair.

**measured 2026-09-14, in a scratch repo:**

```
committed .eco/.gitignore   *.db  *.jsonl     ← a clone loses the store
work tree, repaired         *.db
check-ignore --no-index  →  NOT ignored       ← [t1] PASSES
```

⇒ the repair reaches **me** and no one else, and the clamp reports green while every clone runs
the store, writes the mirror, and watches git drop it in silence. the other eleven axes stay green
throughout, because each runs against a temp db outside the repo.

**so `[t4]` asks the same question of the rules git carries** — rebuilt in a scratch repo, the
ruleset derived by a walk of the path's directory prefixes, read from the **index** rather than
`HEAD`, since the index is what the next commit lands. teeth proven: pointed at `.eco/*.db` it
goes red, and only it.

⚠️ **and the divergence is live in this repo, right now.** `.eco/.gitignore` was widened in the
work tree from the literal `priority.db` to the binary **class**, with a comment that names the
exact hazard — *"a run against `.eco/other.db` would land a binary store that no literal name
covers"*. the index still holds the literal:

| path | work tree | as git carries it |
|---|---|---|
| `.eco/*.jsonl` (every table) | false | false ✅ |
| `.eco/priority.db` | true | true ✅ |
| `.eco/other.db` | true | 🔴 **false** |
| `.eco/priority.jsonl.tmp` | true | 🔴 **false** |
| `.eco/priority.sqlite` | true | 🔴 **false** |

🟡 **those three are CONTAMINATION, not omission** — a binary or a half-written peer that reaches
a commit — so `[t2]`/`[t3]` still read the work tree deliberately. to convert them now would
refuse on a state no clone-side lever can clear: the repair is an index write, which is human-only
(`rule.forbid.self-grant-human-gates`), and a red suite with no lever trains a reader to skip it.
⇒ `.dream/v2026_09_14.fix.the-ignore-clamp-grades-my-work-tree.md`

## 🔴 .eight axes grade the FILE. the COMMIT PATH refused it anyway

`[case45]` asks whether git would **track** the store. it does not ask the last question on the
road to a commit: **would the pre-commit hook let it through?**

⚠️ **measured 2026-09-14, and the answer was NO.** `.husky/check.timestamps.sh` refuses any staged
non-`.ts`/`.sh` file that holds `HH:MM:SS`, and **every row of this store carries `set_at`**. run
against a scratch index that held only the store, the real hook exited **2** on `.eco/gate.jsonl`
line 1.

⇒ so the store was **complete, typed, atomic, healed, and trackable — and uncommittable.** the
central claim of this brief was false, and **all 289 clamps stayed green**, because every one of
them grades the file and none grades the road it travels.

🟡 **the hook was right to exist and wrong here**, and the distinction is the durable part:

| | a snapshot | a data store |
|---|---|---|
| what its timestamp is | test output | a domain value (`set_at`, iso-time) |
| when it changes | **every run** | when a human sets a priority |
| so a diff on it is | permadrift — noise | the signal you committed it for |

the hook's reason is **permadrift**, and permadrift does not reach a store whose timestamps move
only on a real edit. the exemption is repaired at `.eco/*`, by path.

### 🔴 the exemption list was by EXTENSION — the same one-way drift, a third time

`*.ts | *.sh` is a hand-written list. a **new file kind that legitimately carries a timestamp is
refused in silence**, and the refusal names permadrift rather than the real cause. `.eco/` was the
first such kind and will not be the last.

⇒ that is `term=partial-audit` again, now in a **hook** rather than in a dump, a restore, or an
audit. the shape does not care which layer it lands in: **a list written by hand is a second place
a fact lives, and it only ever drifts toward omission.**

### ✅ .a further axis was sought on the RESTORE side, and the clamps already held

every axis to this point grades the **dump**, or git's willingness to carry what the dump wrote.
the obvious next question is whether the **restore** can drop what the dump wrote — so it was
probed rather than assumed: `Object.keys(row)` in `setRowsRestored` was cut to `.slice(0, -1)`, so
every rebuild silently loses one column.

**18 tests went red** across `[case29]`, `[case35]`, `[case38]`, and `[case39]` — one of them named,
already, *"the columns survive the round trip, not just the slugs"*. the schema's own `NOT NULL`
caught it a second time, independently.

⇒ **the restore is covered, and this is recorded so the next traveler does not re-probe it.** a
negative result costs one run to obtain and is invisible to everyone who was not there
(`philosophy.pavement-saves-nature`).

## 🔴 .the db is gitignored, so it OUTLIVES the branch it was built on

the property that makes the db disposable is the property that makes it dangerous:

| | tracked? | on `git checkout` |
|---|---|---|
| `.eco/*.jsonl` | ✅ yes | becomes the **arrived** branch's store |
| `.eco/priority.db` | ⛔ gitignored | **does not move** — still the departed branch's rows |

⚠️ **measured 2026-09-14, before the guard**: a plain `get` after a simulated checkout **replaced
the arrived branch's store with the departed branch's rows.** a READ — no write verb, no prompt,
no trace. and the damaged file is the committed store, so the loss lands in git history on the
next commit. **ten rows of clamps stayed green.**

⇒ the cause is the TIME axis's own heal. *"the db is authoritative"* is right when the db is
**ahead** and catastrophic when it is merely **stale**, and `setStoreHealed` could not tell those
apart.

### 🔴 the discriminator — a SUBSET is a crash, a SURPLUS is a stale db

| the mirror holds… | the cause | the act |
|---|---|---|
| a **subset** of the db — rows behind | the crash window | **heal** |
| a row the db does **not** hold | a stale db | 🔴 **refuse** |

the crash window can only ever leave the text **behind**: the db committed a write the dump never
mirrored. **it cannot invent a row the db lacks.** so a surplus row is proof the two sides come
from different histories — and no rule picks a winner there without loss of one.

⇒ **this is the checksum the counter-argument below called for**, in the one form that needs no
stored state: the two sides discriminate themselves. the refusal names the fix (`rm` the db; the
text rebuilds it) and halts *before* the dump.

### ⚠️ a guard that refuses BOTH cases passes every obvious clamp

the three natural assertions — it refuses, the rows survive, the message names the fix — are **all
satisfied by a guard that refuses every divergence**, and such a guard silently undoes the TIME
axis. `[case47][t3]` is the control that catches it, and it was proven: with an over-broad guard
planted, `[t0]`–`[t2]` stayed green and only `[t3]` went red.

🟡 **the general lesson outlives this case.** a clamp on a REFUSAL owes a twin clamp on the case
that must still PASS, or it grades one half of the rule and reports the whole.

### ✅ .the MERGE claim was asserted for this brief's whole life. it now holds by measurement

the line *"one row per line, so a merge conflict is scoped to the row that changed"* is the reason
the mirror exists at all — and **not one clamp had ever run a merge.** every `merge` in the suite
was the `mv` verb's own unrelated refusal.

**measured 2026-09-14**, two branches off one base, each with a row the other lacks:

```
Auto-merging .eco/priority.jsonl
Merge made by the 'ort' strategy.   1 file changed, 1 insertion(+)
⇒ 3 rows: base, aaa-from-branch-a, zzz-from-branch-b
```

zero conflict markers, both branches intact. ⇒ **the premise the whole invariant rests on is now
verified rather than asserted**, and it is the exact case a binary store loses in silence.

🟡 it is recorded rather than clamped: a clamp would need a scratch repo and two commits per run,
for a property of **git** rather than of this store. the measurement is the cheap half of the
value, and the `.eco/*.jsonl` diff in any real PR re-exercises it for free.

## 🔴 .eleven axes grade the shape AROUND a value. none graded the value's BYTES

the store is **line-oriented**. every axis to this point grades the schema, the verbs, the clock,
or git — and a newline inside a `what` field splits one row across two lines, of which the second
is not valid json.

⇒ that is an omission **the schema cannot see**: the column is `TEXT`, the type is right, the dump
ran, git tracks the file, and a row still fails to come back. the TYPE axis grades the column's
*declaration*; this grades what a value may *contain*, and the two are different questions.

**measured 2026-09-14** — 13 byte classes through a write, a dump, a full db deletion, and a
restore from text alone:

| survives, byte for byte | does not |
|---|---|
| newline · CR · CRLF · quote · backslash · tab · emoji · U+2028 · U+2029 · embedded NUL · cjk · rtl · a combined accent | a **lone surrogate** → U+FFFD |

🔴 **and it survives only because `JSON.stringify` and `JSON.parse` escape in step — a pair no
clamp had pinned.** a hand-rolled serializer, the obvious optimization for a hot dump, breaks the
newline case and every other axis stays green. `[case48]` pins it; teeth proven by a planted
un-escape, which went red with `Unterminated string in JSON`.

🟡 **the lone surrogate is a LIMIT, not a defect, and it is pinned rather than hidden.** it is not
valid unicode, so no utf-8 file can carry it, and every text format mangles it identically. it is
left unrefused because no harm ships that a refusal would prevent
(`rule.forbid.overzealous-blockers`) — and clamped so that a future refusal turns the case red on
purpose rather than by surprise.

## 🔴 .the heal is still HALF a guard — the subset direction is open

`[case47]` refuses a **surplus**. the **subset** direction is the more common move and it is not
covered:

```
branch-a:            alpha-only-on-a, base
git checkout main →  base                     ✅ git did its job
a plain `get`     →  alpha-only-on-a, base     🔴 POLLUTED
```

**measured 2026-09-14.** the db outlives the checkout, `main`'s mirror is a strict subset of it,
and a subset is exactly the crash-window signature — so the heal wrote the departed branch's row
into the arrived branch's **committed** store, on a read.

⚠️ **no stateless rule closes this.** a crash window and a checkout-onto-a-shorter-branch are
row-identical, so the two sides no longer discriminate themselves. the heal has to ask *"did the
TEXT move since this db last wrote it"*, which needs a stamp.

### 🔴 the stamp was built, it worked, and it was reverted

a `PRAGMA user_version` fingerprint of the mirror text fixed the case outright. it also broke **10
clamps**, `[case47][t3]` among them — the control written to catch an over-broad guard, at work
exactly as designed. the fatal one is `[case43][t2]`:

| the mirror is… | the stamp says | its printed remedy `rm <db>` then… |
|---|---|---|
| another branch's version | refuse | ✅ rebuilds from good text |
| **torn to empty by a crash** | refuse | 🔴 **restores from an EMPTY file — the store, gone** |

⇒ **a refusal that names one recovery has picked a side, and the text is not always the good side.**
once a stamp says *"the text moved"*, three causes remain — checkout, hand edit, torn mirror — and
the first two want the text kept while the third wants the db kept.

🟡 **the honest position: this axis is OPEN, and the obvious fix is a trap.** the full shape, the
trap, and what a real fix owes are in
`.dream/v2026_09_14.fix.a-checkout-to-fewer-rows-pollutes-the-arrived-store.md`.

## .the counter-argument, stated fairly

**a hand-edited jsonl is silently ignored.** edit a row by hand, run any command, and the dump
overwrites your edit from the db — because the restore declines to fire while rows exist. so the
file that is declared the store does not, in that one case, behave like one.

that is a fair hit, and it is now **half repaired** — by the discriminator above, which was built
for the branch-switch case and covers the sharper half of this one:

| the hand edit… | what happens now |
|---|---|
| **adds** a row, or changes a **key** | 🔴 **refused.** it is a surplus row, and the store halts before the dump |
| changes a **value** on an extant key | still overwritten by the db, exactly as before |

⇒ so the loss that a human would most likely notice — *"the row I added is gone"* — cannot happen
in silence any more. the residue is a same-key value edit, and it is overwritten rather than
merged.

⚠️ **the rule stands regardless: edit through the verbs, never through the file.** the file is for
review, merge, and restore. a full repair of the residue wants a per-row checksum, and that is
still unbuilt — deliberately, since the surplus guard already covers the case that loses work a
human authored.

## .what would overturn it

- **a binary format git can merge row-wise** — then the review and conflict arguments fall, and
  the third defect alone would not justify the mirror
- **a store too large for a text dump** — a jsonl rewrite per write is O(rows); at a million rows
  that is the wrong shape, and the answer becomes an append log with compaction
- ⚠️ neither is close. the store holds tens of rows, and the vast majority of its edits move one
  field

## .enforcement

- a `.db`, `.sqlite`, or other binary store **committed** to git = **blocker** (the silent
  merge-drop above)
- a write verb that mutates the db and does **not** dump the mirror = **blocker** (the store and
  its record diverge, and no alert fires)
- a dump taken **inside** the transaction, or inside the `try` = **blocker** (mirrors rolled-back
  rows, or rolls back committed work over a file error)
- a restore that fires into a **non-empty** db = **blocker** (it must pick a winner, and every
  pick is a silent overwrite)
- a dump with **no `ORDER BY`** = **blocker** (row order churns, and the diff stops to carry
  signal)
- a restore with a **hardcoded column list** = **blocker** (drops every column added after it was
  written)
- 🔴 a **hardcoded TABLE list**, in the dump, the restore, or a clamp = **blocker** (the
  completeness clause above — it drops every table added after it was written, and it exits 0)
- a clamp that names the tables it grades **by hand** = **blocker** (it certifies the mirror
  complete over a subject set it chose, which is the defect it exists to catch)
- 🔴 a **new write verb** that lands with no mirror-parity fixture = **blocker** (the clamp
  refuses it by construction; to delete the refusal rather than add the fixture is the violation)
- a `.jsonl` the mirror emits that **git does not hold** = **blocker** (the mirror wrote it and
  the commit left it on one disk — the uncommitted-store loss, one file at a time)
- 🔴 an **open that does not heal** the mirror from a live db = **blocker** (the crash window
  above stays open until the next *write*, rather than until the next call)
- a dump that writes **unconditionally** = **blocker** (the heal runs on every open, so an
  unconditional write dirties the worktree on a plain read)
- 🔴 a column declared **`BLOB`, `NUMERIC`, or with no type at all** = **blocker** (the fifth axis
  — it dumps with no error and restores a different value, and all four other clamps stay green)
- 🔴 a mirror written with a **direct `writeFileSync(path, …)`** = **blocker** (the sixth axis — the
  truncate lands first, so every dump has an instant where the committed store is empty)
- a temp written **outside the mirror's own directory** = **blocker** (rename is atomic within one
  filesystem only; across two it degrades to copy-then-unlink, which is the window it was meant to close)
- a `.gitignore` that names the binary store by its **literal filename** = **blocker** (`ECOWORK_DB`
  takes any path, so a literal name leaves every other binary store committable)
- 🔴 an **unknown flag dropped in silence** by any tool that reads this store = **blocker** (it
  WIDENS rather than refuses, and a superset reads as an answer — it defeated a by-hand audit of
  this very invariant)
- the **env var or flag that repoints the store**, left out of `--help` = **blocker** (it is the
  only by-hand route to the claim this brief rests on)
- `.eco/*.jsonl` in a `.gitignore` = **blocker** (that is the store)
- 🔴 an ignore rule broad enough to cover the **mirror** = **blocker** (the eighth axis — the seven
  filesystem clamps all stay green, because each runs against a temp db outside the repo)
- 🔴 a `git check-ignore` run **without `--no-index`**, in a clamp or by hand = **blocker** (it
  skips any path already in the index, so it answers a different question and reports green)
- 🔴 a reachability claim about **git** made from the **work tree's** ignore rules alone =
  **blocker** (the same axis, the second substitution — a rule repaired and never added to the
  index reaches me and no clone, and `[t1]` reports green while every clone loses the store. ask
  it of the carried rules too, as `[t4]` does)
- a carried-rules read taken from **`HEAD`** rather than the **index** = **nitpick** (the claim
  under test is *"after this commit lands"*, and the index is what lands)
- the **temp class** left trackable = **blocker** (a stranded peer is a partial store that diffs
  like a complete one)
- 🔴 a **pre-commit check that refuses the store** = **blocker** (the ninth axis — complete on
  disk, trackable by git, and halted at the commit. the eight file-axes all stay green)
- 🔴 a check that exempts by a **hand-written extension list** where the store is a legitimate
  carrier = **blocker** (it refuses a new file kind in silence, and names the wrong cause)
- a clamp on the commit path that **reimplements** a hook's rule rather than runs it = **blocker**
  (two copies of one rule, and the drift between them is invisible from either side)
- 🔴 a heal that dumps over a **surplus** row = **blocker** (the tenth axis — the db is gitignored,
  so it survives a checkout; a plain READ then replaces the arrived branch's store with the
  departed branch's rows, and the nine prior axes all stay green)
- 🔴 a divergence guard that refuses a **subset on the row-set cue alone** = **blocker** (a crash
  leaves the text behind, so a bare subset is the TIME axis's own case — to refuse it there is to
  undo that axis). ⚠️ this does **not** forbid a refusal backed by a **stamp** that proves the text
  moved; that is the open axis above, and it is owed. what it forbids is a refusal with no evidence
  which side changed
- 🔴 a refusal that names **one** recovery, where the damaged side is not known = **blocker** (`rm`
  the db is correct for a stale db and destroys the store for a torn mirror — name both, or name
  neither and halt)
- 🔴 a mirror serializer that is **not** `JSON.stringify`, or a parser that is not `JSON.parse` =
  **blocker** unless it round-trips every byte class in `[case48]` (the twelfth axis — the escape
  pair is what keeps one row on one line, and a hand-rolled replacement breaks a newline value
  while every other axis stays green)
- 🔴 a restore that **collapses** a duplicate natural key rather than halts = **blocker** (the
  fourteenth axis — the diff shows both rows and the store holds one, so the review that is this
  brief's own argument for text is what misleads. 277 of 279 clamps stay green)
- 🔴 a restore that **filters** mirror columns against the schema = **blocker** (the thirteenth
  axis — it turns a loud refusal into a silent omission, and 274 of 276 clamps stay green. the
  throw is the guarantee: a mirror this version cannot read whole must refuse, never truncate)
- a restore whose column list comes from a **hardcoded list** rather than the row = **blocker** (a
  column added later is dropped on every rebuild, and the old text stops to be restorable — which
  is the half this brief's headline claim rests on)
- 🔴 a `.gitattributes` rule that gives the mirror a **`merge` driver** = **blocker** (the fifteenth
  axis — `merge=ours` produces `exit 0`, no conflict, and the other branch's rows gone. it is
  verbatim the failure this brief cites as the binary's flaw, achieved on the text, and 280 of 282
  clamps stay green)
- 🔴 a `.gitattributes` rule that marks the mirror **`-text` or `binary`** = **blocker** (the same
  axis — it hands the text both of the db's defects at once: no line merge, and `Binary files
  differ` in place of a diff)
- 🔴 a `.gitattributes` rule that marks the mirror **`-diff`** = **blocker** (it loses no byte, and
  it deletes **review**, which is the entire case for text over the binary. a store that merges
  cleanly and cannot be read is one whose guarantee rests on no reader)
- a reachability claim about git made from the **ignore** rules alone = **nitpick** (they are one of
  two kinds of per-path rule git carries; the attributes decide whether a merge keeps both sides)
- 🔴 a **binary store in the index**, at any path, under any name = **blocker** (the sixteenth axis
  — the first clause on this list, asserted since day one and unmeasured until a store staged under
  the name `[object Object]` held three rows that lived nowhere else. all fifteen prior axes stay
  green, because each runs against a temp db OUTSIDE the repo)
- 🔴 a claim that no binary store can be committed, made from a **`.gitignore`** = **blocker** (an
  ignore rule is a **prediction** about where a store will appear, and it is bounded by directory
  and by extension at once. grade the INDEX, by the file's own magic bytes at offset 0)
- an ignore rule for a stray store added by its **literal name** = **blocker** (the same defect the
  `priority.db` clause names, a second time — it predicts one path and leaves every other open)
- a magic-byte check that does not demand offset **0** = **nitpick** (several briefs in this repo
  quote `SQLite format 3`, and a quote is not a store)
- 🔴 a mirror on disk that git **tracks at no path** = **blocker** (the seventeenth axis — the whole
  table is absent from every clone, and the sixteen prior axes stay green because each runs against
  a temp db outside the repo)
- 🔴 **carried text that omits a row the store holds** = **blocker** (the same axis — a clone, or a
  plain `git checkout`, rebuilds from what git carries, so an omitted row is gone with no error and
  no diff to read. measured red on 2026-09-14 at 11 priority rows and 4 gate rows, with 286 of 287
  clamps green)
- a store/mirror parity claim graded on a **key column** rather than the whole row = **blocker** (a
  stale `why` under a live slug loses the reason as surely as a dropped row loses the priority, and
  a key-only compare reports that state clean)
- a mirror set derived from what git **tracks alone** = **blocker** (a new table's mirror, written
  and never staged, is precisely the case a tracked-only walk cannot see. derive from the union of
  the index and the disk)
- 🟡 the seventeenth axis left **unwritten because it would be red** = **blocker** (a deferred test
  is a lie, `philosophy.verification-strictness`. what parts an acceptable red from an unacceptable
  one is whether the failure **prints the lever** — this one names the exact human command and says
  in its own text that it is a gate rather than a defect)
- 🔴 a db path accepted that is the **debris of a stringified non-string** = **blocker** (the
  eighteenth axis — `ECOWORK_DB` takes a path and node stringifies whatever it is handed, so a
  caller that passes an object gets a whole second store, in silence. every row written there is a
  row OMITTED from the real one, and neither store complains)
- a debris refusal placed **after** the `mkdirSync` = **blocker** (the mkdir is what creates the
  stray, so the refusal reports correctly and leaves the defect on disk regardless — grade the
  directory, never the exit code)
- 🔴 a stray-store fix that clamps only the **index** = **blocker** (that is the symptom and the
  last line of defence. it cannot fire in a temp dir, a fresh clone, or any box with no `.git`,
  and those are exactly where a stray lands unnoticed)
- a debris guard with **no ordinary-path control** = **blocker** (a guard that refuses every path
  satisfies every assertion about the refusal and breaks the store; the three obvious assertions
  cannot tell those apart — `rule.require.clamp-edge-cases`)
- 🔴 the `disk → index` drift clamped in the **suite alone** = **blocker** (this repo has no CI, so
  a suite clamp fires only when somebody runs the suite, and the commit is the moment the drift
  starts to cost rows. `.husky/check.eco.store.sh` is the twin, and it fires on every commit)
- a mirror-parity hook that reports a **byte or hash** difference rather than a **row count** =
  **nitpick** (a reviewer acts on rows; a byte delta says a file changed and never says what it
  would cost)
- a pre-commit mirror check with **no clean-state control** = **blocker** (a check that halts every
  commit is indistinguishable from one that halts the right ones — prove the pass, across an
  untracked mirror, a clean stage, an unstaged edit, a re-stage, and an absent `.eco/`)
- 🔴 the CONTAMINATION half graded against the **work tree alone** = **blocker** (`[case45][t5]`
  and `[t6]` — a clone gets what git carries, so an ignore rule widened here and never staged
  protects nobody, and `[t2]`/`[t3]` stay green the whole time. measured 2026-09-14: git carried
  `priority.db`, one literal name, while the work tree carried the binary class)
- 🔴 a carried-rules ignore check that asks only about **`priority.db`** = **blocker** (that one
  path is satisfied by the literal name the first clause forbids. ask the CLASS — `gate.db`,
  `other.db`, `priority.sqlite` — or the test reports green on the exact broken state. measured:
  `[t5]` passes and `[t6]` fails)
- `[case45][t2]`/`[t3]` **converted** to the carried rules rather than joined by them = **nitpick**
  (they are a second detector, not a duplicate claim — the local pair catches a regression the
  moment it is typed, the carried pair catches one that never reached a clone, and two cues cannot
  disagree. `rule.require.a-cue-is-not-a-claim`)
- a pre-commit check that guards the **mirrors** and not `.eco/.gitignore` = **blocker** (they
  drift the same way with opposite costs: a stale mirror OMITS rows, a stale ignore rule lets a
  BINARY in — and a committed sqlite merges by one side outright)
- a **new byte class** the store can hold, absent from `[case48]` = **nitpick** (its subject set is
  the one in the suite that cannot be derived, so it drifts toward omission by construction —
  `term=partial-audit`)
- 🟡 a clamp on a **refusal**, with no twin clamp on the case that must still pass = **blocker**
  (the three obvious assertions — it refuses, the rows survive, the message names the fix — are
  all satisfied by a guard that refuses every divergence, so they grade one half and report the
  whole)
- 🔴 a **shared temp name** in the dump = **blocker** (`[case55][t0]`. a write dumps after COMMIT
  and EVERY open dumps via the heal, so a plain `get` — which takes no write lock at all — can sit
  in the dump beside a writer. on one name a peer truncates the temp mid-write and the other
  renames a torn file into place ATOMICALLY, which is the very window the rename exists to close.
  `[case43]` grades the rename and cannot see this)
- 🔴 a **`busy_timeout`** added with no guard across the dump's SELECT and rename = **blocker**
  (`[case55][t1]`. it cures the loud `database is locked` by letting concurrent COMMITS succeed —
  and concurrent commits are exactly what the dump race needs. the two changes land together or
  not at all. measured 2026-09-14: 14 of 16 concurrent writes refused, so the write path
  serializes by ACCIDENT and that accident is the whole protection)
- a clamp written for the dump **race itself** = **nitpick** (it could not be demonstrated — 8
  rounds × 24 concurrent readers against one writer produced 0 damaged stores. a clamp that passes
  whether or not the defect is present proves naught, so the tripwire grades the **coupling**
  instead, which is deterministic)
- 🔴 a **second production program that opens the db** = **blocker** (`[case56]`. the dump belongs
  to one code path, not to the database, so a row written elsewhere reaches the store never — and
  the heal then re-emits it as though the text had always held it. route the caller through
  `ecowork.db.mjs <verb> <db>`. **a read is no exception**: read `.eco/<table>.jsonl`, which IS
  the store)
- the set of db-openers **named in a list** rather than derived from a walk = **blocker** (the
  exact one-way drift that bit the table list and the extension exemption list. nobody removes a
  writer; one gets added. derive it, and exclude tests by SHAPE rather than by name)
- a derivation whose **walk is not itself guarded** = **blocker** (`[case56][t0]`. a broken walk
  finds no file, so the claim holds vacuously and reports a clean bill over an empty set)
- 🔴 a **flag the parser fills that no jq `--arg` reads** = **blocker** (`[case57][t1]`. the flag is
  ACCEPTED, the verb exits 0, the receipt prints, and the value is in no column. jq raises naught —
  an unread local is not an error. **every dump axis stays green**, because each grades a db that
  never held the fact. `OUTPUT` is the one legitimate case, and it is pinned by name so a second
  one turns the clamp red)
- a flag that reaches the payload and **no column below it** = **blocker** (`[case57][t2]`. `[t1]`
  proves it reaches the payload; only a round-trip proves it reaches the store. measured: the field
  dropped from the jq object with the `--arg` kept left `[t1]` **green**, which is why the
  behavioral half is owed rather than redundant)
- a probe table **named apart from the parser** = **blocker** (`[case57][t2]`'s coverage check.
  a flag added tomorrow must turn the clamp red rather than sit un-probed — the one-way drift that
  bit the table list and the extension exemption list)

## 🔴 .twelve axes grade the DUMP. the thirteenth grades the READ BACK

every axis to this point asks whether the text **holds** every fact. not one asks the question
this brief's own headline claim rests on:

> *"the jsonl can rebuild the db. a db cannot rebuild a git history."*

that is a claim about text written under a **different schema** — and it was never measured. the
migrations list proves the schema really has moved: `goal`, `status`, `kind`, and `sponsored` were
each added to an extant table, so mirrors of three earlier shapes sit in this repo's history.

**measured 2026-09-14, in three directions:**

| the text | the code | |
|---|---|---|
| older schema (four columns absent) | current | ✅ restores; `status` takes its DEFAULT `enqueued` |
| newer schema (one unknown column) | current | 🔴 refused — `table priority has no column named …` |
| a **renamed** column | current | 🔴 refused, identically |

### ✅ the history claim HOLDS, and now by measurement rather than assertion

row 1 is the direction a reader of the past actually walks — copy an old mirror out of
`git show <sha>:.eco/priority.jsonl`, point `ECOWORK_DB` at it, read. it works because
`setDbRestored` derives its column list from the **row**, so a column the old text never carried
simply takes its schema default.

⇒ that was the half the whole claim rests on, and it was the half nobody had run.

### 🔴 the REFUSAL in rows 2 and 3 is correct — and it was unguarded

a loud refusal is the right answer: a mirror this version cannot read **whole** must refuse rather
than truncate. what had no clamp was that it **stays** loud.

a future author meets `table priority has no column named x` and has one obvious repair:

```js
const columns = Object.keys(row).filter((c) => known.includes(c));
```

it reads as robustness. it is a **silent omission** — the column is dropped, the restore reports
success, and the fact leaves the store with no complaint.

⚠️ **with that filter planted, 274 of 276 clamps stayed green.** only `[case49]` caught it, because
every other axis grades the dump and this is the only one on the read back.

⇒ so the thirteenth axis is: **a mirror column the schema does not know must be REFUSED, never
DROPPED.** the throw is the guarantee, and `[case49]` is what keeps it.

🟡 and note which way this one runs. the twelve before it clamp a **defect**; this one clamps a
**correct behavior against a plausible repair**. the hazard is not that someone breaks it — it is
that someone fixes the wrong symptom.

## 🔴 .thirteen axes ask if the text HOLDS every fact. the fourteenth asks if it states TOO MANY

the db's unique constraint means the **dump** can never emit a duplicate natural key. the **text**
is a different matter, and the cause is ordinary: a merge resolution that keeps BOTH sides of a
conflicted row. strip the markers, keep both blocks, commit. two lines, one slug.

**measured 2026-09-14, before the repair:** the restore **accepted** it and produced **one** row.
`INSERT OR REPLACE` kept the last and dropped the other in silence.

### 🔴 this is the axis that attacks THIS BRIEF'S OWN ARGUMENT

the case for text over the binary is written a few sections up, and it is that text can be
**reviewed** — `Binary files differ` is the db's named flaw.

> here the diff shows **both** rows. a reviewer approves a PR whose every row is visible, and one
> of them never reaches the store, with no error, ever.

⇒ so the review that was supposed to be the safety net is what lies. **that is worse than an
unreviewable binary**, which at least admits it cannot be read. every earlier axis threatened a
fact; this one threatened the argument.

### the repair

`setDbRestored` now counts natural keys before the first write and halts on any seen twice, with
the key, the columns it keys on, the likely cause, and the fix. the same shape as the surplus
refusal in `setStoreHealed` — and for the same reason: **no rule can pick a winner between two
histories without loss of one** (`rule.require.failfast`).

⚠️ **with the guard disabled, 277 of 279 clamps stayed green.** only `[case50]` caught it.

🟡 note that `[case49]` and `[case50]` are the only two axes on the **read back**, and both were
invisible to the twelve that grade the dump. a complete mirror that is read wrong is as omitted as
one that was never written — and the dump axes cannot see either.

## 🔴 .fourteen axes grade the FILE. the fifteenth grades what GIT IS TOLD ABOUT IT

`[case45]` reads one kind of per-path rule git carries — the **ignore** rules — and no other.
`.gitattributes` is the second kind, and it decides what the ignore rules never touch:

> **whether the mirror MERGES, and whether it can be READ in a diff.**

**measured 2026-09-14, in a scratch repo, with `.eco/*.jsonl merge=ours` committed:**

```
branch-a adds a row · branch-b adds a different row · git merge
git said:   Auto-merge of .eco/priority.jsonl
exit:       0                                  ← a clean merge. no conflict. no complaint
branch-b's row:  GONE
```

⇒ **that is verbatim the failure `.eco/.gitignore` names as the DB's flaw** — *"a merge takes one
side wholesale and the other side's rows are gone"* — reproduced on the **text**, by one line of
config, with the text's own defence (the diff) disabled in the same stroke by `-diff`.

### 🟡 this repo is safe by ABSENCE, never by design

it tracks **no `.gitattributes` at all**, so every mirror gets git's defaults today. that is not a
decision anyone made; it is a file nobody has written yet. the first person who adds one — for a
lockfile, for a generated artifact, for line endings — writes the rule that decides this, and has
no reason to think about `.eco/`.

⚠️ so the danger here is unlike every prior axis: it needs **no defect in this store's code**, and
no change to this store at all. a peer's tidy-up of an unrelated path is enough.

### the three drivers that break it, and why each is a blocker

| attribute | what it does | why it omits |
|---|---|---|
| `merge=<driver>` | picks a side, or runs a custom driver | the side it drops vanishes at exit 0 |
| `-text` / `binary` | git treats the bytes as opaque | no merge, no diff — the db's flaw, on the text |
| `-diff` | the bytes still merge, but `Binary files differ` | **removes review — the whole case for text** |

the third is the subtle one. it loses no data on its own, and it deletes the property this entire
invariant is argued from. a store that merges cleanly and cannot be read is a store whose guarantee
rests on nobody who checks.

⚠️ **with `.eco/*.jsonl merge=ours -diff` planted at the repo root, 280 of 282 clamps stayed
green** — only `[case51]`. fourteen axes said the store was whole while every merge would have
dropped the other branch's rows in silence.

⇒ `[case51]` derives its subject set from the schema, exactly as `[case38]` does, and asks
`git check-attr -a` of each mirror. a new table inherits the clamp with no edit.

## 🔴 .fifteen axes ask whether the TEXT is whole. the sixteenth asks whether a BINARY got in

this brief's **first** enforcement clause has stood since the day it was written:

> *"a `.db`, `.sqlite`, or other binary store **committed** to git = **blocker**"*

**fifteen axes, and not one measured it.** every clamp runs against a temp db **outside** the
repo — a deliberate choice, and the reason none of them could ever see a store **inside** it.

### 🔴 it was caught live, with rows that exist nowhere else

**2026-09-14**, `git status --short`:

```
A  "[object Object]"       ← SQLite format 3 · the priority table · 6 rows · staged
```

a caller passed an **object** where `ECOWORK_DB` expects a **path**. node stringified it, and the
store landed at the repo root.

⚠️ **`git log -- .eco/priority.jsonl` returns no commits.** the mirror has never been committed,
so three of those six rows — `grepsafe-glob` (`quant_asks: 3`, two linked issues),
`svc-chat-acu-floor`, `vendor-line` — existed **in one untracked binary and nowhere else on
earth**. a `git clean` would have ended them, and no reader would have known.

⇒ this brief argues that a binary store loses data. **it did, here, to this store, while every
clamp reported the mirror whole.**

### 🔴 why no ignore rule caught it — the SAME argument, one level up

`.eco/.gitignore` bounds its scope **twice**, and the stray store honoured neither bound:

| the rule bounds by | and the store |
|---|---|
| **directory** — `.eco/` | sat at the repo **root** |
| **extension** — `*.db`, `*.sqlite`, `*.tmp` | had **no extension at all** |

```
git check-ignore --no-index -v '[object Object]'   → exit 1      ← NOT ignored
git check-ignore --no-index -v '.eco/priority.db'  → .eco/.gitignore:17:*.db
```

🔴 **the enforcement list above already condemns the literal filename** — *"`ECOWORK_DB` takes any
path, so a literal name leaves every other binary store committable"*. that repair widened the
**name** into a class and left the **directory** fixed. ⇒ **the very argument that struck down the
literal name still holds against the rule that replaced it**, and it took a live loss to notice.

### the clamp names no path, no extension, and no directory

`[case52]` reads the **index** — what the next commit lands — and grades each blob by its own
**magic bytes**, `SQLite format 3\0`, **at offset 0**. a store is caught wherever it sits, under
whatever name, with whatever extension.

⚠️ **offset 0 carries the whole check.** this repo holds several briefs that *quote* the magic —
this one among them. a quote is not a store, and only the offset parts them.

🟡 note what this axis does **not** do: it adds no ignore rule. an ignore rule is a **prediction**
about where a store will appear, and the prediction is what failed. the index is the **fact**.

## 🔴 .sixteen axes prove the MACHINERY works. the seventeenth proves it RAN

every one of the sixteen builds a temp db **outside the repo**, drives it, and grades the result.
so each answers *"would a dump lose a row?"* — and not one answers the question this invariant
actually asserts:

> **does the text git carries hold what this store holds, right now?**

⚠️ `[case52]` found this blind spot from one side — it caught a binary that got **in**. this is the
other side: **the text that never got in.**

### 🔴 measured 2026-09-14, and RED

```
.eco/priority.jsonl   disk=36   carried=29   omitted=11
.eco/gate.jsonl       disk=11   carried= 7   omitted= 4
```

eleven rows — the whole `proknow-dao` cluster and its four gate edges — sat in the work tree and
in **no commit at all**. and `git log -- .eco/priority.jsonl` returns **zero commits**, so the
mirror has never reached `HEAD` by any route: the store this invariant calls *"plaintext in git"*
has, to date, never been in git.

⇒ **all sixteen prior axes were green in that state. 286 of 287.** that is the teeth, and it was
not planted — the defect was already here.

### 🟡 the two links fail for different reasons, and only one persists

| link | what it is | behavior |
|---|---|---|
| `db → disk` | the **dump** | ✅ **self-corrects** — it reruns on every write, and a short db heals from the text on open |
| `disk → index` | the **stage** | 🔴 **persists** — no code path closes it, so the drift only ever grows |

the sixteen axes all guard the first link, which is the one that repairs itself. the second is
where rows are actually lost, and it had no clamp at all.

⇒ it also needs **no db**, so a clone can check it cold, before the tool has ever run.

### what the clamp grades

`[case53]` derives its mirror set from the **union** of what git tracks and what is on disk — never
a name list, because a whole new table's mirror, written and never staged, is exactly the case a
tracked-only walk cannot see. then, per mirror:

- **`[t1]`** every mirror on disk is tracked at all
- **`[t2]`** the carried text omits no row the disk text holds

⚠️ an **omission** counts a whole absent row and a row whose **content drifted** alike. a stale
`why` under a live slug loses the reason as surely as a dropped row loses the priority, and a
key-only compare calls that state clean.

### 🔴 .it is RED today, and the lever is a human's

the repair is one command, and it is refused:

```
rhx git.stage.add .eco/          →  error: globally blocked
! rhx git.commit.uses allow --global     # a human
```

⚠️ **this is a halt WITH a lever, never a red suite to skip.** the failure message says so in its
own text — *"this is a HUMAN GATE, never a code defect. do not debug it."* the earlier deferral of
`[case45][t2]`/`[t3]` turned on the absence of a printed lever; this one prints it, and the cost of
the hole is eleven real rows rather than a documented gap.

### 🔴 .and a suite catches it only when somebody runs the suite

this repo has **no CI**. `.husky/pre-commit` is the one gate that always fires, and the commit is
the exact moment the drift starts to cost real rows — so the axis is clamped **twice**, once in
each place:

| where | what it catches | when it fires |
|---|---|---|
| `[case53]` | the drift, with row counts and the lever | when the suite is run |
| `.husky/check.eco.store.sh` | the same drift | **on every commit** |

⇒ `[case46]`, the ninth axis, established that the commit path is its own axis — a store can be
perfect and still be refused at the hook. this is the converse: **a store can be imperfect and the
hook let it through**, and the hook is the only instrument placed where that matters.

the check halts when any `.eco/*.jsonl` is untracked, or is tracked with unstaged edits. it names
the cost in **rows**, never in bytes, because a reviewer acts on rows:

```
✋ the plaintext store is not fully staged, so this commit would omit rows
   ├─ .eco/gate.jsonl — disk=11 rows, staged=7 rows
   ├─ .eco/priority.jsonl — disk=36 rows, staged=29 rows
   └─ fix:  rhx git.stage.add .eco/
```

🟡 **the fix is never wrong**, which is what makes this a pit of success rather than friction: the
mirror is derived from the db, and the db is authoritative, so to stage it is always correct.

⇒ **proven across five states**, since a guard that refused everything would read identically:

| state | exit |
|---|---|
| a mirror git has never been told about | 2 |
| staged and clean | **0** ← the control |
| a row added, unstaged | 2 |
| re-staged | 0 |
| no `.eco/` at all | 0 |

## 🔴 .the sixteenth axis caught the SYMPTOM. the eighteenth catches the CAUSE

`[case52]` grades the index, which is the last line of defence. it answers *"did a binary get in?"*
and cannot answer the question one step upstream:

> **why was a second store created at all?**

⚠️ and the loss is easy to misread as a hygiene problem. it is not:

> **every row written to a stray store is a row OMITTED from the real one.**

neither store complains — one holds rows nobody reads, the other is short rows nobody misses. that
makes it an omission axis, and the most silent one on this list.

### the mechanism, in one line

`ECOWORK_DB` takes a **path**, and node stringifies whatever it is handed. so a caller that passes
an object gets `[object Object]`, `mkdirSync` creates it, `DatabaseSync` opens it, and a complete
second store exists — in whatever cwd the process happened to hold, with no error at any step.

### the guard names DEBRIS, never a policy about good paths

`genDb` refuses, **before the mkdir**, when the path holds `[object ` or its basename is exactly
`undefined`, `null`, or `NaN`. each is the stringification of a non-string; none can occur in a
path anyone meant to type.

🟡 **the position carries real weight.** the mkdir is what creates the stray, so a refusal placed
after it reports correctly and leaves the defect on disk regardless — which is why `[case54][t2]`
grades the directory rather than the exit code.

⇒ **teeth, measured:** with the guard removed, one run left five stray stores behind —
`"NaN"`, `"[object Object]"`, `"nested"`, `"null"`, `"undefined"` — and `[t3]`, the ordinary-path
control, stayed green throughout. so the guard bites and is not over-broad.

🟡 and this axis fires **whether or not the repo is a git repo at all**, which is what parts it
from `[case52]`. a clone, a temp dir, a CI box with no `.git` — the refusal holds, because it
grades the **path** rather than git.

## 🔴 .eighteen axes grade ONE process. the nineteenth grades TWO

every axis above assumes a single caller. the dump breaks that assumption twice over: it runs
**outside** the transaction, and it runs on **every open** via the heal — so a plain `get` dumps,
and a `get` takes no write lock at all.

⇒ two processes can sit inside `setStoreDumped` at the same moment, and with a **shared** temp
name that is the torn-write hazard the rename exists to close, reopened:

```
P1  writeFileSync(temp, full)     temp holds the whole store
P2  writeFileSync(temp, ...)      🔴 TRUNCATES it, mid-write
P1  renameSync(temp, path)        publishes a TORN file, ATOMICALLY
```

**the rename stays atomic. what it publishes is garbage.** `[case43]` cannot see this — it
grades whether a rename *happens*, never whether the temp is *unique*. the repair is one
interpolation: `` `${path}.${process.pid}.tmp` ``, and the `.tmp` suffix is kept so
`[case45][t3]` still keeps a stranded temp out of every commit.

### 🔴 the safety here rests on an ACCIDENT, and that is what this axis records

**measured 2026-09-14: of 16 concurrent `set` calls, 14 failed outright** with `database is
locked`, exit 1. that is **loud**, so it omits no row — but it is also the only reason the dump
race is unreachable, because **no `busy_timeout` is set** and the write path therefore
serializes by chance rather than by design.

a probe aimed at the one shape that needs no write lock — a reader's heal-dump that carries a
stale snapshot across a writer's commit — ran 8 rounds × 24 concurrent `get` against one `set`
and produced **0 damaged stores**. the window is real and measured in microseconds.

⇒ so **no clamp was written for the race itself.** a clamp that passes whether or not the defect
is present proves naught (`rule.require.clamp-edge-cases`), and this one survived 192 attempts.

### 🔴 the two defects are JOINED, and the clamp is a TRIPWIRE on that join

> the obvious repair for `database is locked` is `PRAGMA busy_timeout`. that repair makes
> concurrent **commits** succeed — and concurrent commits are exactly what the dump race needs.

**the fix for one defect unlocks the other**, and no other clamp here would notice. so
`[case55][t1]` states the true invariant as a disjunction:

```
the store is safe  ⟺  the write path serializes  ∨  the dump is guarded
```

⚠️ it is **vacuously true today, on purpose**, and its own prose says so. it forbids no
improvement — it requires only that the two land together. **its teeth were proven by hand:** a
`busy_timeout` pragma added to `genDb` turned it red, and only it; `[t0]` went red only when the
temp name was reverted to a fixed `.tmp`.

## 🔴 .nineteen axes grade THE MODULE. the twentieth asks who ELSE opens the db

`[case40]` comes closest to this question and cannot answer it: it proves each **write verb**
dumps, by a read of **the module's own verb table**. so it is blind by construction to a writer
that lives in another file.

> **the dump is a property of ONE CODE PATH, never of the database.**

⇒ a second program that opens `.eco/priority.db` and writes a row omits that row from the store
**completely and permanently**. no dump runs. and the heal on the next open treats the db as
authoritative and re-emits the row as though the text had always held it — so the store silently
gains a row that was never reviewed, never diffed, and never in any commit.

**that is the purest form of the loss this invariant exists to refuse**, and not one of the
nineteen clamps above can see it.

### ✅ measured 2026-09-14, and GREEN

exactly one production file opens the store, and it is `ecowork.db.mjs`. the shell layer —
`eco.priority.sh`, `eco.seed.sh`, `ecowork.sh` — names `ECOWORK_DB` and shells out; it holds no
sqlite call of its own.

### 🟡 so it is a DRIFT clamp, and that is deliberate

this store has been bitten by **one-way drift twice**, and both lists were correct on the day
they were written:

| the list | what a later addition did |
|---|---|
| the hand-written table list | a fourth table would be omitted from the dump |
| the extension exemption list | a new extension would be refused by the hook |

**nobody removes a writer.** the move that happens is the reverse — a helper is added that opens
the db *"just to read"*, and later grows a write. so `[case56]` derives its subject set from a
**directory walk**, never from a name list (`term=partial-audit`), and excludes test files by
**shape** (`.test.ts`) rather than by name.

⇒ `[t0]` guards the walk itself, because a broken walk finds no file and would report a clean
bill over an empty set — the trap `[case52][t0]` and `[case53][t0]` each close for their own
derivation. **teeth, measured:** a second `.mjs` that imports `node:sqlite` turned `[t1]` red and
named the intruder by path; `[t0]` stayed green throughout.

## 🔴 .twenty axes grade a fact the db HOLDS. the twenty-first asks if it ever ARRIVED

every axis above starts from a db that already holds the fact, and grades what happens to it
afterward — the dump, the heal, the atomicity, the ignore rules, the index, the commit path, the
doors. **not one asks the question one link further upstream:**

> **did the fact the caller STATED ever reach the db at all?**

the shell parses a flag into a local, then names that local **by hand** in a jq payload. two
lists, written two hundred lines apart, whose correspondence is held by memory alone:

```
--gain-cash)  GAIN_CASH="${2:-}"      the parser, in the `case`
--arg gainCash "$GAIN_CASH"           the builder, in the jq call
```

⇒ add an arm to the first and omit the second, and **the flag is ACCEPTED**: the verb exits 0,
the receipt prints, and the value lands in no column. jq raises naught — a local nobody
references is not an error, it is merely unread.

### 🔴 why no prior clamp can see it

| clamp | why it is blind |
|---|---|
| `[case44]` | grades a flag the tool does **NOT** take. this one it **does** |
| `[case38]` | grades the dump against the **schema** — and the schema is whole; it is the **write** that was short |
| `[case40]` | grades that every write verb dumps. this verb **did** dump |

**every dump axis stays green by construction**, because each grades a db that never held the
fact. ⇒ this is the one axis where the **store is complete and the RECORD is short** — and a
human who typed a figure has no way at all to learn it was dropped.

### ✅ measured 2026-09-14, and GREEN

all **22 row flags that take a value** round-trip stated-to-stored, and exactly one parser local
reaches no payload: `OUTPUT`, which picks a render and so describes no row.

### 🟡 so it is a TRIPWIRE — and unlike `[case55][t1]`, not a vacuous one

`[case57]` grades the correspondence from **both ends**, and the two halves catch different
shapes:

| | claims | teeth, measured |
|---|---|---|
| `[t0]` | the derivation reaches the real parser and the real builders | the anti-vacuous guard, as `[case52][t0]` · `[case53][t0]` · `[case56][t0]` each carry |
| `[t1]` | every local the parser fills reaches a payload, but the render switch | a parser arm added with no jq line → red, `stranded: COST_NOTE, OUTPUT` |
| `[t2]` | and every such flag round-trips, stated to stored | the field dropped from the jq object, `--arg` kept → red, `dropped: --cost-time '21h'` |

⚠️ **the two plants are not the same defect.** `[t1]` catches the local nobody reads; `[t2]`
catches a value that reaches the payload and dies below it. **the second plant left `[t1]`
green** — which is precisely why the behavioral half is owed.

⇒ the subject set is derived from the parser's **own `case` arms**, never named, so a flag added
tomorrow is graded the day it lands. `[t2]`'s probe table is graded against that same derived
set, so a new flag turns it red rather than un-probed (`term=partial-audit`).

## .see also

- `.eco/.gitignore` — the ignore, with the reason written where a reader finds it
- `ecowork.db.store.mjs` — `getAllStoredTables` (the completeness clause), `setStoreDumped`,
  `setDbRestored`
- `ecowork.db.mjs` — the call order in `genDb` and in `main`
- `ecowork.{mirror,commit}.integration.test.ts` — one case per axis (`[case44]` sits in
  `ecowork.quant`, `[case47]` in `ecowork.migrate`): `[case38]` TABLE + COLUMN (the dump
  is complete, graded from the schema) · `[case39]` the committed store in this repo · `[case40]`
  VERB (the dump RAN, graded from the module's own refusal) · `[case41]` TIME (a mirror left behind
  by a crash, healed by a plain read) · `[case42]` TYPE (a column may only hold what JSON carries) ·
  `[case43]` ATOMICITY (the write lands whole or not at all) · `[case44]` the READER (an unknown
  flag is refused, never dropped — the one clamp that guards the audit rather than the mirror) ·
  🔴 `[case45]` REACHABILITY (git will TRACK it — the only clamp that reads the ignore rules
  rather than the filesystem, and the only one a widened `.gitignore` can trip. `[t4]` asks it a
  second time of the rules **git carries**, because a repair made in the work tree and never added
  to the index reaches no clone. 🔴 `[t5]`/`[t6]` ask the CONTAMINATION half of those same carried
  rules, and `[t6]` is the one with teeth — it demands the binary CLASS, since a literal
  `priority.db` satisfies `[t5]` and covers no other path. measured 2026-09-14: `[t5]` green,
  `[t6]` red) · 🔴 `[case46]` the COMMIT PATH
  (the pre-commit hook lets it THROUGH — it runs the real hook against a scratch index that holds
  only the store, since the real one halts on whichever file sorts earliest) · 🔴 `[case47]` the
  BRANCH SWITCH (a stale db does not overwrite the arrived branch — and `[t3]` is the control that
  proves the guard did not swallow the TIME axis to get there) · 🔴 `[case48]` the VALUE BYTES (a
  newline, a quote, an emoji, a NUL survive a round trip through text alone — the only axis whose
  subject set is written by hand, because a byte class cannot be derived from a schema) ·
  🔴 `[case49]` FORWARD COMPATIBILITY (text under an OLDER schema still rebuilds — the direction
  this brief's headline claim rests on — and a column the schema does NOT know is refused rather
  than dropped. one of two axes on the READ BACK, and the only one that clamps a correct behavior
  against a plausible repair rather than a defect) · 🔴 `[case50]` the AMBIGUOUS TEXT (two lines
  under one natural key are REFUSED, never collapsed — the axis that attacks this brief's own
  argument, since the diff shows both rows and the store would hold one) · 🔴 `[case51]` the MERGE
  ATTRIBUTES (no `.gitattributes` rule turns the mirror into a one-sided merge or an unreadable
  blob — the second kind of per-path rule git carries, and the only axis whose defect needs no
  change to this store at all) · 🔴 `[case52]` NO BINARY STORE IN THE INDEX (the converse of every
  other axis, and this brief's own first enforcement clause, asserted since day one and never
  measured until it caught a live one. it names no path, no extension, and no directory — it grades
  each indexed blob by its magic bytes at offset 0) · 🔴 `[case53]` THE CARRIED TEXT IS THE STORE
  (the only clamp that grades THIS REPO rather than the code — every other one builds a temp db
  outside it, so all sixteen prove the machinery works and none proves it ran. it needs no db at
  all, so a clone can check it cold. RED as of 2026-09-14 on a human gate, with the lever printed
  in its own failure text) · 🔴 `[case54]` THE STORE LANDS WHERE IT WAS SENT (the CAUSE `[case52]`
  only ever caught as a symptom — a debris path refused before the mkdir, so no second store is
  created at all. `[t3]` is the ordinary-path control, without which a guard that refused
  everything would read as perfect) · 🔴 `[case55]` TWO PROCESSES IN THE DUMP (the only axis that
  grades a second caller. `[t0]` demands a per-process temp name, since a shared one lets a peer
  truncate the temp a process is about to rename — the torn write the rename exists to refuse,
  reopened where `[case43]` cannot see it. `[t1]` is a **tripwire**, vacuously true today on
  purpose: it states `serializes ∨ guarded` as a disjunction, so a `busy_timeout` added to cure
  the loud `database is locked` cannot silently open the race it would enable) · 🔴 `[case56]`
  ONE DOOR TO THE STORE (the only axis that grades files OTHER than the module. the dump belongs
  to a code path rather than to the database, so a second program's write reaches the store never
  — and `[case40]`, which reads the module's own verb table, is blind to it by construction. the
  subject set is a directory walk, and `[t0]` guards the walk so an empty one cannot read as clean) ·
  🔴 `[case57]` THE INTAKE (the only axis UPSTREAM of the db. every other starts from a fact the db
  already holds; this one asks whether the fact the caller STATED ever arrived. the parser fills a
  local and a jq payload names it by hand, two hundred lines apart — omit the second and the flag is
  accepted, exits 0, and lands in no column, with every dump axis green because each grades a db
  that never held it. `[t1]` grades the correspondence at the source, `[t2]` round-trips it
  stated-to-stored, and the two catch different shapes: the plant that tripped `[t2]` left `[t1]`
  green)
- `.husky/check.timestamps.sh` — the hook that refused this store, and the `.eco/*` exemption with
  the snapshot-versus-data-store reason written where the next reader hits it
- 🔴 `.husky/check.eco.store.sh` — the enforcement twin of `[case53]`. it halts any commit whose
  `.eco/*.jsonl` is untracked or carries unstaged edits, and names the cost in rows. this repo has
  no CI, so it is the only clamp on this axis that fires without anyone who chose to run it
- `term=partial-audit._.choice._.md` (repo=.this/role=any) — the shape a hand-written list
  produces: a read complete over the scope it chose, reported as a verdict about the store
- `define.invariant.eco.cost-rolls-up-and-sums` — a peer invariant this store must hold
- `rule.require.verify-after-send` (repo=.this/role=any) — the same claim one layer up: a write
  reported is not a write verified

---

written by human + beaver 🦫
