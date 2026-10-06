# domain.term: duct.box.quiet

term.chosen   = quiet
term.kind     = adj
term.boundary = duct.box
term.synonyms.forbidden:
- asleep
- idle
- stalled
- stuck
- parked
- dormant
- abandoned

## .what

a box that is **`empty`, and has not changed for `--stall-mins`**. two measurements, joined:

```
the box holds no text          the `empty` half
and held none last sweep too   the DURATION half
```

⇒ that is the whole claim. **it says naught about whether a clone sits behind it.**

## 🔴 .it is agnostic about the clone — and that is the point, not a gap

every peer box-verdict describes what a live pane SHOWS. this one describes what a pane **failed
to do between two sweeps**, so it holds over a live clone and a corpse alike:

| the pane held still because | and `quiet` is |
|---|---|
| a clone parked on a genuine plea, waits for a human | ✅ true |
| a clone drifted off its route and awaits nobody | ✅ true |
| the clone is **dead** — a `duct.pane.husk` | ✅ true |

⇒ **`quiet` is a correct verdict over all three, which is exactly why it must never be read as
one of them.** it measures the pane's stillness; it does not measure a clone.

## .the discriminator — against the four it is confused with

| verdict | what it measures | needs a second sweep? |
|---|---|---|
| `empty` | the box holds no text | ⛔ one capture settles it |
| **`quiet`** | **the box holds no text, and did not change** | ✅ **two, by construction** |
| `unread` | the capture came back empty | ⛔ |
| `asleep` (crew) | the **grove** did not answer | ⛔ |
| `husk` (pane) | the **claude is gone** | ⛔ |

⇒ `quiet` is the only box-verdict with a **clock** in it. every peer is a claim about one
capture; this one is a claim about the delta between two.

## ⚠️ .the glyph is WRONG — `😴` already means `asleep`, one boundary up

```
git.crew.poll.sh:1064   crew_glyph="😴"; crew_state="asleep"      # the GROVE did not answer
git.crew.poll.sh:1717   ACTIONS+=("😴 CLONE QUIET — …")           # the BOX did not change
```

one glyph, two concepts — the failure `im_an.obsessive_learner.for.domain.glyphs` names first.
and the two claims are **opposite in kind**:

| the row | asserts | about |
|---|---|---|
| `😴 asleep` | *"we could not look"* | **the instrument** |
| `😴 CLONE QUIET` | *"we looked, twice, and it held still"* | **the world** |

⚠️ and `asleep`'s own `.what` states it is *"the only verdict in the set that is a claim about
the READ."* the glyph now says otherwise on a second row. ⇒ `quiet` is owed a glyph of its own.

## ⚠️ .the render names the wrong SUBJECT

`CLONE QUIET` measures the box and names the **clone** — the misattribution this term's boundary
exists to refuse. the pane may hold no clone at all. the row is owed `BOX QUIET`.

## 🔴 .and its cure prescribes a FORBIDDEN call

```sh
rhx duct.read --on '<uri>' --lines 40                      # what :1717 prints today
rhx git.crew.read --tree <tree> --who <role> --lines 40    # what it owes
```

a supervisor never types a `duct.*` call or a duct uri
(`rule.always.entool-the-layer-you-drop-below` — a blocker, with no first-one-free). **the
instrument that grades the fleet is the one that prescribes the violation**, so a reader who
obeys the row is put in breach by the tool.

## .the read it owes — the husk check

`quiet` is the trigger for exactly one act, and the term's whole operational value sits here:

> a quiet box is the ONE state where a `duct.pane.husk` and a parked live clone are
> **byte-identical to the classifier**. so a quiet box earns a read, and the read runs the husk
> suffix-test: **does the pane's LAST line belong to claude, or to the shell?**

⇒ the read costs one call. an unrun read costs whatever the husk went unnoticed for — 7h51m, in
the measured case (`term=duct.pane.husk`).

## .refs

- `git.crew.poll.sh:67` — `--stall-mins`, the duration gate
- `git.crew.poll.sh:1717` — the action row, its glyph, its subject, and its cure
- `term=duct.pane.husk._.choice._.md` — the state a quiet box can conceal
- `term=asleep._.choice._.md` — the glyph's extant owner, one boundary up
- `term=duct.box.unread._.choice._.md` — the peer that is a claim about the read

## .reason

- `term=duct.box.quiet._.choice.reason.md`

---

written by human + beaver 🦫
