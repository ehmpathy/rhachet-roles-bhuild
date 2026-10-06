# rule.require.bulk-over-byhand

## .what

when an **entooled bulk instrument** covers the subject set, use it. do not hand-loop the
per-subject read.

and when the bulk instrument does not render what you need — **add a flag.** do not fall back to
the loop.

```
👎  duct.read A · duct.read B · duct.read C · … and judge each by eye
👍  git.crew.poll --live --boxes          # one call, every subject, one verdict apiece
```

## .why

### a byhand loop is not merely slower — it is a WORSE INSTRUMENT

the cost that draws the eye is tokens: N tool calls where one would serve. the loop also **loses
the properties the bulk instrument guarantees**, and it loses them silently:

| the bulk instrument gives | the byhand loop gives |
|---|---|
| a subject set **derived live**, so it cannot go stale | whichever subjects you happened to name |
| a **deterministic verdict** per subject | your eye, on prose, one pane at a time |
| a **change baseline** across ticks | naught — each read is its own first read |
| a **bounded timeout** per subject | one hung subject stalls the whole sweep |
| **parallel** reads | serial, N round trips |

the first row is the expensive one. **a hand-named subject set is a `partial audit` by
construction** — its filter is "whatever I thought to type", orthogonal to nearly every property
worth measurement.

### the loop is what a supervisor reaches for when a render is ABSENT

the mechanism is worth a name because it feels like diligence rather than drift:

1. the bulk instrument answers question A but not question B
2. B is genuinely needed, so the operator drops to a per-subject read
3. the loop then answers A too — it has to, since each read carries the whole pane
4. so the bulk instrument is no longer called at all, and every guarantee above is quietly gone

nobody decided to abandon it. an absent render made the loop necessary once, and the loop
subsumed the sweep. **so the fix is never "loop more carefully". it is to close the render gap.**

## .the rule

| the bulk instrument… | you must |
|---|---|
| covers your subject set and renders what you need | **call it** |
| covers your subject set, renders the WRONG SHAPE | **add a flag** (see below) |
| genuinely does not cover the subject set | a targeted read is correct — say why |
| covers it, and you need ONE subject in full depth | a targeted read is correct — **after** the sweep names it |

the last row is the only honest use of a per-subject read: the sweep tells you WHICH subject
warrants depth, then you read that one. `🚧 PROMPT` → `duct.read` for the full command is exactly
this, and it is required (`howto.review-permission-requests`, step 0).

## .add a flag — the paved response to a render gap

a render gap is a **defect in the instrument**, not a reason to route around it
(`rule.require.solve-at-cause`). the flag pays for itself the first time it runs, and for every
future caller who would have hit the same gap.

when you add one:

- **default it OFF.** a caller who wants only the base render must not pay for the extension
- **DELEGATE, never duplicate.** if a peer instrument already computes the value, call it once
  and join. two copies of a detector drift, and drift in a detector that carries safety is a
  defect that reports success
- **one call, never one per subject.** a flag that loops inside the bulk instrument has rebuilt
  the very N+1 it exists to remove
- **key on the STRUCTURE of what you join, not on a glyph.** a glyph is one renderer's choice
  among several; position is the contract

## .the worked example — 2026-08-30, this repo

a babysit tick ran `duct.poll --brief`, then five sequential `duct.read` calls, and hand-
simulated the crew layer one pane at a time. `git.crew.poll` — which renders every crew in one
call — was never invoked. the cause was the mechanism above: `git.crew.poll` named which roles
were **live** and never what they **awaited**, so the box state forced the drop to per-duct
reads — and the loop then answered the crew question too.

the repair was a flag, `--boxes`, which followed each rule above: it **delegated** to
`duct.poll` rather than re-detect (a second copy of its human-vs-ghost sgr-attribute check would
fabricate human instructions once it drifted — `rule.require.distinguish-prefilled-from-
suggested`), joined by canonical tree name in **one call**, **off by default**.

⚠️ its first form was itself defective, in the way this section warns about: it keyed the box
line on the `⌨️` glyph, but a `🚧 PROMPT` row carries no keyboard glyph at all — so it dropped
every stalled mechanic, as though that role were not live. the fix was to key on the
**structure** — the box line is the last child of a duct block — and it is clamped at
`work.surface.poll.integration.test.ts` `[case8]`, proven red under the glyph key and green
under the structural one.

## .a second instance — 2026-09-13, one layer over the first

two mechanics halted on the identical account-level usage-quota string. to check whether the
reset window had passed, the supervisor named the two trees **from memory** and ran
`git.crew.read` on each, one at a time. the correction named the same gap at the layer above:
if a hand-named search recurs, `crew.poll` needs to support that search in bulk.

this gap could not be closed by a new classifier flag, because a shared, incidental condition
(an account-wide quota message, a crash trace, a package name) always arrives un-anticipated.
the paved answer for an un-anticipated pattern over a known corpus is a grep, not a new enum
value — so the repair is a **search primitive**, `--search <text>`, rather than another
classifier flag.

⚠️ **a hand-named subject set is a `partial audit` regardless of size.** two trees named from
memory is the same defect as five.

the repair followed the same shape as `--boxes`: delegates to `duct.poll`'s own fleet-wide pane
read, one call, off by default (an empty `--search` value never fires).

## .the instruments this repo already entools

reach for these before any loop:

| want | call | never |
|---|---|---|
| the whole fleet: crews + trees + prs | `rhx git.crew.poll` | a `git.release` per tree |
| + what each live role awaits | `rhx git.crew.poll --live --boxes` | a `duct.read` per duct |
| + where each sits on its route, and who owns the halt | `rhx git.crew.poll --live --stones` | a `duct.read` per duct |
| only the fell candidates | `rhx git.crew.poll --fellable` | a read-and-sort by eye |
| only the heal candidates (a nudge cures) | `rhx git.crew.poll --healable` | an eye over the 🚫 rows, then a name by hand |
| which trees ever had a crew | `rhx git.crew.ledger` | a `find` over `_worktrees/` |
| a file's content across repos | `rhx git.repo.get lines` | a clone-and-read per repo |
| whether any duct's pane holds a given TEXT (a shared error, a phrase) | `rhx git.crew.poll --search '<text>'` | a `git.crew.read` per named duct |

### ⚠️ `duct.poll` was on this table, and it should not have been

a prior row named `duct.poll --brief` as the way to get every duct's box + change verdict. that
recommendation outlived its reason and became a hole in this very rule.

`git.crew.poll` **calls** `duct.poll`. so the duct sweep is a DELEGATE, not a peer — and the
crew poll now surfaces every signal the delegate carried (`🌊 ducts moved`, `🗿 stones`, `🚧 N at
a modal`). a table that names both hands a supervisor a choice between an instrument and its own
delegate, which answers one half of four — a `partial audit` recommended by name.

**`duct.poll` is not deleted.** it is the right instrument for a caller whose subject genuinely
is a duct. it is simply not a supervisor entrypoint, because a supervisor's subject never is
(`rule.require.speak-at-the-supervisor-layer`).

## .enforcement

- a per-subject loop where an entooled bulk instrument covers the same subject set = **blocker**
  (a `partial audit` by construction, and it discards the change baseline and the timeout)
- a byhand loop reached for because the bulk instrument's render was thin, with no flag added and
  no gap recorded = **blocker** (the loop will subsume the sweep, and silently)
- a flag added that re-detects what a peer instrument already computes = **blocker** where that
  detector carries safety, **nitpick** otherwise
- a flag added that loops per subject inside the bulk instrument = **blocker** (the N+1 is back,
  one layer down)
- a targeted read that DRILLS IN on a subject the sweep already named = **never a violation**
- **a supervisor that reaches for a bulk instrument's own DELEGATE = blocker.** the delegate
  answers a strict subset by construction. `duct.poll` under `git.crew.poll` is the live instance

## .see also

- `rule.require.babysit-cron-per-dispatch-fleet` — the tick this governs; its `duct.poll`-vs-`N
  duct.read` clause is the narrow ancestor of this rule
- `rule.require.nudge-parked-clones` — reads a status line per clone; do it from the sweep
- `howto.review-permission-requests` — step 0 demands the FULL command, so a drill-in read is
  required there
- `term=poll._.choice._.md` — what makes a poll a poll: a derived subject set, a verdict apiece,
  a bound per subject
- `term=partial-audit._.choice._.md` — why a hand-named subject set is one
- `rule.require.solve-at-cause` (architect) — a render gap is a defect, not a detour
- `rule.prefer.most-common-denominator` (architect) — where a lifted operation belongs
- `rule.always.upgrade-crew-tools-as-you-use-them` — why the second instance shipped in-round

---

written by human + beaver 🦫
