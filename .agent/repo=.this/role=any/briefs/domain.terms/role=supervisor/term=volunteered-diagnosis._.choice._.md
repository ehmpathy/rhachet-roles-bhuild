# domain.term: volunteered diagnosis

term.chosen   = volunteered diagnosis
term.kind     = noun
term.synonyms.forbidden:
- editorial output
- helpful hint
- inline explanation
- tool commentary
- verbose verdict

## .what

a **diagnosis** an instrument publishes **beside its own measurement, in the measurement's
voice** — where the measurement was observed and the diagnosis was reasoned.

the mark that separates it from an honest report: **the two halves are undifferentiated when a
reader meets them.** same line, same format, same authority. a reader cannot tell which half the
tool saw and which half it supplied.

```
📬 QUEUED — input waits; mechanic busy, will consume it
            └─ observed ─┘  └──── reasoned, unobservable ────┘
```

`input waits` is a fact the tool read off the pane. `mechanic busy, will consume it` is a claim
about another party's internal state and its future behavior — which no pane read can establish.

## .why it needs its own word

`rule.require.nudge-parked-clones` already draws the line the sweep depends on:

> **a poll verdict is a MEASUREMENT, not a diagnosis.**

that rule aims the discipline at the READER — do not treat a measurement as a diagnosis. this
term names the case where **the instrument blurs the line first**, so naught is left for the
reader's discipline to catch. the tool inferred, and printed the result where a fact goes.

## .the shape

three parts, and the third is what makes it hard to catch:

1. the instrument emits a true measurement
2. it appends a diagnosis — a cause, a prognosis, or an attribution — that it did not observe
3. **both arrive in one line, one voice, one authority**, with no marker between them

part 3 is why care does not help. a careful reader re-reads the same undifferentiated sentence.

## .the evidenced instances

| the line | the instrument | the measurement | the volunteered diagnosis | verdict |
|---|---|---|---|---|
| `📬 QUEUED — input waits; mechanic busy, will consume it` | `duct.poll` | text sits in the queue | *why* it waits, and *that it will be consumed* | unfalsifiable at read |
| `⌨️ no input box (not a claude session)` | `duct.poll` | no input box matched | *why* — the pane is not a claude session | **provably wrong** in the common case |
| `👌 merged      safe to delete` | **`git tree status`** | the BRANCH is merged | *that the WORKING TREE may be removed* | **provably wrong**, and it sits in a **legend** |
| `🦫 dam fine! opened in your browser` | **`git.grove.auth`** | `xdg-open` exited 0 | *that a browser WINDOW came up* | **unfounded** — and the human watched for a window that never came |
| `🦫 dam fine! claude is signed in` | **`git.grove.auth --code`** | the oauth url is ABSENT from the last 40 rows | *that the sign-in COMPLETED* | **provably wrong** — the duct sat parked on a trust-this-folder select |

the second is the sharper one on the render axis. a narrow pane breaks the detector, so a **live
claude mechanic** renders exactly that line. the diagnosis is false and the measurement is arguably
true — which is precisely the fusion this term names. the whole per-tick resize workaround exists
to dodge it.

### the third instance is a DIFFERENT instrument — and that is what it repairs

rows 1 and 2 are one skill. a term whose whole evidence base is one skill is a term that may name a
property of **that skill** rather than of the domain, and no amount of further `duct.poll` rows can
part those two readings. row 3 is the first from elsewhere.

evidenced 2026-08-31. `git tree status --repo @all` prints its status glyphs with a legend:

```
👌 merged      safe to delete
```

`merged` is read off the branch and is true. **`safe to delete` is a claim about the WORKING TREE**,
which merge status does not establish — and `declastruct-aws.beav.fix-ssh-key-authorized-stale-proxy`
proved it in the same minute: rendered `👌 merged`, and `git.tree.del` refused it for uncommitted
deletions plus an untracked `dist/`. merged, and not safe to delete.

it also adds a **shape** rows 1 and 2 do not have, and the shape is worse:

| where the fusion sits | who meets it |
|---|---|
| in a **rendered row** (rows 1–2) | the reader of that one subject, on that one run |
| in a **LEGEND** (row 3) | every reader of every row, forever — it is the key by which all rows are read |

a fused row misreports one subject. a fused legend installs the fusion in the reader's model of
the whole instrument, and it is re-taught on every invocation.

⇒ **the author's countermeasure applies hardest to a legend.** a legend is written once, read
always, and it is the one place a tool states what its glyphs MEAN — so a diagnosis smuggled into
it is not an error the reader can catch per-row. the honest legend here is
`👌 merged — the branch landed on main`; whether the directory may go is `git.tree.del`'s verdict,
and it is a different question with a different gate.

### the fourth instance — a FAILHIDE repair does NOT repair the fusion

row 4 is the first instance caught by the **subject of the report**: the human the line was
about, who watched for a window that never came and said so — *"run it again, i never saw the
browser open."*

what earns it a section is that it took **two** repairs, and the first one felt complete.

| the layer | the defect | the repair |
|---|---|---|
| 1 | `xdg-open "$url" >/dev/null 2>&1 &` — backgrounded, both streams discarded, exit code never read. it printed the same line whether or not xdg-open ran at all | read the verdict: foreground it, bound it with `timeout`, branch on the code |
| 2 | **the repaired check still said "opened in your browser"** | say what was MEASURED: *handed to xdg-open, which took it (exit 0)* |

layer 1 is `rule.forbid.failhide`, and its repair is the obvious one — a discarded exit code
is a defect any reviewer names on sight. layer 2 survives it untouched, because a verdict you
now read is still a verdict about **the handoff**, never about the window.

and the gap between them is not small. `$BROWSER` here was a user wrapper:

```sh
setsid -f flatpak run org.mozilla.firefox "$@" >/dev/null 2>&1
```

`setsid -f` returns the instant it forks, and both streams go to the void — so that chain exits
**0 whether or not firefox ever launched**. no exit code available to us can see past it.

> **a failhide repair restores a MEASUREMENT. it says nought about whether the sentence you
> print is that measurement or a conclusion drawn from it.** the two defects sit on one line and
> are fixed by different moves: one adds a read, the other narrows a claim.

⚠️ and note which repair a reviewer would have demanded. layer 1 is grep-able (`2>&1 &`,
`|| true`, a discarded `$?`); layer 2 is a **prose** defect with no token to search for. so the
cheap, findable half is the half that leaves the report just as untrue.

### the fifth instance — an ABSENCE cannot be a terminus

row 5 is the same skill, the same day, **hours after row 4 was paved into this file**. and it is
the first instance whose cure is not a narrower sentence at all.

the measurement was an absence: *the oauth url no longer appears in the last 40 rows.* four
unrelated states produce that exact read:

| the state | why the url is absent |
|---|---|
| the sign-in **completed** | the screen moved on |
| claude **crashed** | the pane holds a shell |
| the url merely **scrolled** past a 40-row window | it is still up, one page back |
| a **NEXT SCREEN** took the pane | the sign-in is under way and unfinished |

the fourth is what actually held — a trust-this-folder select, which waited on a key, under a line
that said the grove was signed in.

⇒ **an absence is shared by success and by every failure mode alike, so it discriminates none of
them.** no sentence you write can repair that, because the defect is not in the sentence — it is
in the measurement the sentence was drawn from.

> **the repair for an absence-terminus is a DIFFERENT MEASUREMENT, never a narrower claim.**
> find a positive marker whose only cause is the outcome you mean to report, and read for that.

here the marker is claude's own prompt. **a claude at its prompt is a claude that got through
every screen** — no crash, no scroll, no unanswered select can produce it. so the loop now drives
to the repl and reports from there, and the report and the measurement finally name one fact.

⚠️ and this is the shape `term=false-report` already names one layer over, in its two-arm test:
**ask which arm absorbs the cases the instrument could not classify.** for an absence-terminus the
answer is always *the success arm* — every unclassified state falls into it silently, which is the
worst possible default a report can carry.

#### the author's own countermeasure did not bind on its author

row 4 and row 5 were written into **one file, by one party, within a day.** to know the term, to
have just paved its evidence, and to ship a fresh instance regardless is not carelessness — it is
the state this glossary now records three times over (r58's clamp; camp-grove's D13-2; this).

⇒ so the tell owes a form a tired author can run with no recall of the term at all: **say what the
report claims, then name what would have to be TRUE for the measurement to hold while the claim is
false.** where you can name even one such state, the measurement is not the claim's terminus.

## .why the forbidden synonyms distort

| ⛔ synonym | why it distorts |
|---|---|
| `editorial output` | implies style or verbosity. the defect is epistemic, never stylistic — a terse diagnosis is just as fused as a wordy one |
| `helpful hint` | credits the intent and hides the cost. `rule.require.errors-name-the-fix` DEMANDS hints; a hint is a good thing. what is wrong here is that a hint wears a fact's clothes |
| `inline explanation` | an explanation is welcome. the defect is that it is **unmarked**, never that it is present |
| `tool commentary` | too broad — every glyph and header a tool prints is commentary. this names one specific fusion |
| `verbose verdict` | `verdict` is taken twice over (poll verdicts, peer-review verdicts), and length is not the axis |

## .the operator's countermeasure

do not ask *"is this report true?"* — ask **"which half of this line did the tool SEE?"**

| the clause | what it is | what it buys |
|---|---|---|
| names a state of the pane / file / process the tool read | measurement | act on it |
| names a CAUSE, a MOTIVE, or a FUTURE | diagnosis | verify it separately, or hold it |

the cheap check: **split the line at the semicolon, the dash, or the parenthesis.** in both
evidenced instances the fusion sits exactly at that punctuation. the tool's own format marks the
seam it declines to name.

## .the AUTHOR's countermeasure — and it is far cheaper than the operator's

every instance above is a **shipped line**, so every cure above is aimed at a reader. that leaves
the term half-armed: a fused line is written once and read forever, so the reader pays the cost on
every tick while the author pays it once.

2026-08-30 is its first use at **design** time, on an instrument that does not exist yet, and it
is the cheapest the term has ever been to apply.

i owe `git.crew.poll` a `--stones` flag — the poll shows a clone's current route stone and never
whether that stone has advanced, so an idle clone costs a `duct.read` per tick. the obvious render
is a staleness verdict: *this stone is stale.*

**that verdict would be born fused**, and this term names exactly why:

| the half | what it is |
|---|---|
| *this stone has not advanced in N minutes* | **observed** — two reads, a comparison |
| *therefore it is stale* | **reasoned** — a claim about whether the clone still advances, which no stone read establishes |

the evidence was in hand the same hour. `all-skips-manifest` sat on `l1@i003` for six-plus ticks;
a read of the pane found a genuine 4h39m review turn, and it then advanced to `l3@i001` with no
supervisor lever. a `--stones` flag that rendered *stale* would have flagged a clone that was at
work and fine — and it would have flagged it in the sweep's own voice, where the whole fleet reads.

> **name the two halves BEFORE you write the renderer.** emit the observable half, withhold the
> reasoned half, or mark the seam between them. an instrument that never fuses them cannot be
> read as a diagnosis, however tired the operator.

so the flag's verdict must be an **age**, never a **judgment** — the same sentence
`rule.require.nudge-parked-clones` opens with, aimed one layer earlier: at the instrument's
author rather than at its reader.

### the tell, for an instrument you are about to build

ask of every line you are about to render: **what would i have to have read to know this?** where
the answer names an artifact the instrument does not open — a pane body, another party's
intention, a future — that clause is a diagnosis, and it does not go where a fact goes.

## .why the `false report` cure does NOT work here

`false report`'s reader-inference family carries this cure:

> say the report's content out loud in its own words, then ask whether THAT sentence is false.

that cure rests on the false sentence being **the reader's paraphrase**. here the false sentence
is **the tool's own words**. said out loud, `mechanic busy, will consume it` sounds exactly like a
measurement — because the instrument put it in a measurement's place.

so the two terms need two cures, and that is the strongest argument for the split.

## .not-this

- **an honest hint** — `rule.require.errors-name-the-fix` requires a fix be named. a fix is a
  prescription, offered as one. a volunteered diagnosis is a description, offered as a fact
- **a `false report`** — that requires the content be UNTRUE (d2). a volunteered diagnosis may be
  entirely correct and still be one, because the defect is that its status is unmarked
- **the reader's own inference** — that family lives in `false report`. here the tool inferred

## .see also

- `term=volunteered-diagnosis._.choice.reason.md` — etymology, the boundary, and the evidence
- `term=false-report._.choice._.md` — the nearest neighbor, and the discriminator that parts them
- `rule.require.nudge-parked-clones` — *a poll verdict is a MEASUREMENT, not a diagnosis*
- `rule.require.errors-name-the-fix` (ergonomist) — why a NAMED prescription is required, and welcome

---

written by human + beaver 🦫
