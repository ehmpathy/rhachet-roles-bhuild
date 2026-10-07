# domain.term.choice.reason: duct.box.covered

## .etymology

the word names what a reader can SEE: claude is there, and another program sits **over** it. it
was chosen after the enumeration below, per `rule.require.enumerate-before-you-name`.

### what it beat

- **`hidden`** — the closest miss, and it fails on ownership: hidden by *what*, and hidden from
  *whom*? `covered` carries the cover as a lid that can be lifted, which is exactly the cure
- **`obscured`** / **`occluded`** — both suggest a partial or accidental view. the box is not
  dimmed or half-visible; it is fully replaced by another program's render
- **`masked`** — already carries a sense on the credential surface (a masked secret), and that
  one means *deliberately concealed for safety*. the opposite of this state's hazard
- **`blocked`** — 🔴 the one that must be refused outright. `blocked` is the genus of the whole
  `crew.status` enum (`blocked:on-human`, `blocked:on-defect`), so a box named `blocked` would
  read as a claim about **whose move it is**, which is a different question one layer up
  (`rule.forbid.domain-term-ambiguity`)

## 🔴 .the measured defect

**2026-09-04**, babysit tick. the sweep reported:

```
✋ BOX UNMOVED — duct:///rhachet.beav.fix-node-pty-install/foreman
   ✍️prefilled, still 513m
```

`✍️prefilled` means *a human typed a message and never sent it*, and the babysit protocol's
answer to that is explicit: **`--keys Enter`, after a `--raw` ghost check.**

the pane held:

```
❯ and did you answer me concicely and clearly with grounded evidence?
❯ or did yo ujust make some bullshit up and roundabout some words
● Partly bullshit. Three claims of mine were unverified;
  … then an editor's file tree, drawn over all below it …
  Press ENTER or type command to continue
```

⇒ the "unsent message" was a human question from **513 minutes earlier**, which claude had
**already answered on the very next line**. and the Enter would not have reached claude at all —
an editor owned the keyboard, parked on its own modal prompt.

### 🔴 the guard that was supposed to catch this, and why it could not

the protocol's one safety step before an Enter is the `--raw` ghost check
(`rule.require.distinguish-prefilled-from-suggested`). it reads the SGR attribute: dim = an
autocomplete ghost, normal = really typed.

**that text is normal intensity.** it is a real human message. the check passes, correctly.

> **the ghost check parts LIVE from GHOST. it is blind to LIVE from HISTORICAL.**

⇒ two orthogonal hazards, one guard. that is the whole reason this state needed a name of its
own rather than a warn line on `prefilled`.

## 🔴 .the root cause — `❯` carries THREE senses on ONE surface

claude renders `❯` for:

| the `❯` | what it marks | is it a buffer? |
|---|---|---|
| in the box chrome | the live input cursor | ✅ yes |
| in a modal | the menu cursor | ⛔ no |
| in the transcript | **every past human turn** | ⛔ no |

the selector was `grep -a '❯' | tail -n 1` — *the lowest caret in the pane.* that finds the box
only while the box is the lowest caret, which holds right up until it does not.

⚠️ **the file already carried this exact lesson, one arm over.** its PROMPT check reads:

> *"two earlier attempts keyed on the ❯ cursor and both misread it … so key on the modal's own
> CHROME, which no other pane state renders and no wrap can mangle."*

the prompt check learned to key on chrome. **the input-box check never did**, and the same root
cause shipped a third time. ⇒ a lesson recorded in a comment beside the defect it describes does
not generalize itself to the arm next door.

## .the third glyph collision of the week

| glyph | the senses it carries | where |
|---|---|---|
| `😴` | a failed read · an idle clone | `term=duct.box.quiet` |
| `👋` | a human gate · a spent budget | `term=crew.status` |
| **`❯`** | **an input cursor · a menu cursor · a past human turn** | here |

`term=crew.status._.choice.reason.md` closed with *"one more instance from a different surface
and it earns a term."* this is that instance, and it is the strongest of the three: **all three
senses live on one surface, rendered by one program, in one pane.**

⇒ the pattern is now owed a name, and it is **not** *"a glyph chosen for the shape of a halt"*
as first guessed — that only covered `👋`. the general form is wider:

> **a glyph chosen for a SHAPE rather than a ROLE.** `❯` says *"a line of input-ish text"*; it
> does not say whose, or whether it is live.

that term is **owed and not paved here** — it belongs to the glyph catalog, and a coinage
against three instances wants the catalog's palette in view first
(`im_an.obsessive_learner.for.domain.glyphs`).

## ⚠️ .the second defect the same tick surfaced — and it is worse

the enum that renders `crew_status` derives ENTIRELY from box + stone data, and both were gated
behind the optional `--stones` flag. so:

```
rhx git.crew.poll --live          -> 🚦 18 inflight · 9 frozen
rhx git.crew.poll --live --stones -> 🚦 4 inflight · 7 blocked:on-human · 1 blocked:on-defect …
```

**the first reported a healthy fleet over 8 live blocks.** not one row looked wrong; every row
was wrong.

🔴 **this is a sharper failure than the clipped sweep `rule.forbid.clipped-sweeps` records.** a
clip renders FEWER rows, so a careful reader may notice a tree absent. this rendered EVERY row,
all green — no ellipsis, no count mismatch, and no way to part it from a fleet at rest.

⇒ it is `partial-audit` with the subject set intact and the **evidence set** silently empty: the
instrument declined to gather what its own verdict rests on, and said naught about it.

the cure was not a warn line. **the render now gathers what it needs** — a caller who asks for
the dense view has asked for the evidence under it, whatever the flag is called
(`rule.prefer.defaults-match-common-case`). a second fail-safe arm keeps an empty evidence set
from ever reading as `inflight` again.

⚠️ and that fail-safe over-fired on its first run: a **down** crew has no box by definition, so
every one of them promoted from `frozen` to `unread`, the idle prune stopped firing, and hidden
fell 11 → 2. the arm now sits BELOW the down check. ⇒ `unread` is a claim about the READ, and
where `crew_state` already answered there was no failed read to report (`term=asleep`).

## ⚠️ .and the join broke, in the way its own comment predicted

`git.crew.poll` joins by a match on `duct.poll`'s **render prose**. its comment says:

> *"a join that reads its neighbour's render is one the neighbour breaks."*

the new `covered` render was added without its join arm, so the state fell through to
`❔unknown` on its very first run — safe (it never submits) and wrong (it sends a reader to
repair a correct ladder).

⇒ **a render arm and its join arm are ONE change, never two.** the caution was read, in the
file, minutes before it came true.

## .what is owed

| owed | to |
|---|---|
| the `❯` glyph split, or a documented refusal | the palette + `duct.poll.sh` |
| a name for *a glyph chosen for a SHAPE rather than a ROLE* | `domain.glyphs/catalog.of=glyph._.md` |
| a clamp that renders a covered pane and asserts no `prefilled` | `work/work.surface.classify.integration.test.ts` |
| a clamp that drives the dense render with no evidence and asserts no `inflight` | same |
| ⚠️ the render/join pair made structural rather than remembered | `git.crew.poll.sh` |

## .the OPEN question

**does `covered` deserve to reach `crew.status`?** a covered box is decent evidence that a
**human is at that keyboard right now** — they opened the editor. that is a fact a supervisor
would act on (do not send; do not fell; the tree is in use). today it reaches the box tally only,
and the crew row still grades `frozen` off its age.

the answer turns on data not yet held: how often a cover appears with no human behind it — a
pager left open by a clone's own tool call would render identically.

---

written by human + beaver 🦫
