# domain.term.choice.reason: at work

## .etymology

`at work` is a **prepositional phrase**, not an adjective, and that is deliberate. every rejected
synonym is a single word that names a PROPERTY of the crew; `at work` names a RELATION between the
crew and its subject.

that grammar carries the whole boundary this term exists to draw:

- *"the crew is **up**"* — a property. it invites the reader to ask no further
- *"the crew is **at work**"* — a relation. it invites *at work on WHAT?* — which is exactly the
  question the verdict cannot answer

the phrase is honest about its own incompleteness. a one-word synonym would not be.

it also matches how the fleet's humans already speak: *"who's on that tree?"*, *"nobody's on it"*.
the domain never said *"the crew is active."*

## .the rejected synonyms

| ⛔ synonym | why it distorts |
|-----------|-----------------|
| `up` | the exact antonym of `down`, and therefore the strongest candidate. but `up` is the vocabulary of a MACHINE, and this axis is about a CREW. a grove can be up while every crew on it is down (`term=grove`) — one word for two layers is the overload `rule.forbid.term.addition.ambiguous` refuses |
| `live` | already spoken for. `live duct`, `live tmux`, `live session` all name the SUBSTRATE. a crew is at work BECAUSE its ducts are live; to call the crew live merges the layer with its evidence |
| `active` | over-claims motion. an idle clone is `at work` and is not active in any sense a reader would accept. this is the term's central defect, and `active` bakes it into the word |
| `busy` | over-claims harder than `active`, and collides outright — `duct.send` already refuses with BUSY when a claude pane holds the keyboard. that is a duct-level fact about one pane, not a crew-level verdict |
| `online` | a network word, and the `term=grove` boundary refutes it directly: reachable ≠ at work |
| `alive` | pairs with `dead`, which `term=down` already refused for over-claim of finality. the pair is wrong in both directions |
| `engaged` | implies attention, which no instrument can observe |

## .the four scattered boundaries this cluster consolidates

`at work` was never undefined. it was defined **four times, in three other terms**, each time as a
boundary in someone else's argument — which is the state a glossary exists to end:

| where | the boundary it drew |
|---|---|
| `term=grove._.choice._.md:56` | `reachable ≠ at work` — a grove can be up and hold a bare shell |
| `term=grove._.choice.reason.md:160` | a whole section: *"the distinction the duct layer cannot draw"* |
| `term=ledger._.choice._.md:30` | the source table — *"is it at work right now? → live tmux → seconds"* |
| `term=ledger._.choice.reason.md:82` | *"live tmux · at work NOW · a stopped crew vanishes — under-reports by design"* |

plus `term=poll._.choice.reason.md:22` (*"`git.crew.list` answers who is at work"*) and
`term=false-report._.choice._.md:543` (the middle row: *"at work, and WAITS on its own tool"*).

so six renderings, five files, and no definition. each author needed the boundary, drew it locally,
and moved on.

> **a word that must be re-bounded every time it is used is a word with no home.** the tell is not
> that it is absent from the glossary — it is that it appears in the glossary only ever as the
> right-hand side of a `≠`.

## .the layer over-claim, stated once so it need not be redrawn again

each of those four boundaries is the SAME defect seen from a different file. the general form:

```
grove reachable  →  says naught about ducts
duct live        →  says naught about the clone      ← this is where `at work` sits
clone moved      →  says naught about the work
```

`at work` reads a fact at layer 2 and is routinely read as a claim about layers 3 and 4. that is
`term=false-report`'s **proxy** cause, and it is why the say-level file leads with the layer table
rather than with the definition.

the practical consequence for a sweep: **`at work` is not actionable on its own.** it is the
precondition for a nudge, never the reason for one. the reason comes from the layer beneath —
`duct.poll`'s box state and the pane's three axes (body · elapsed · width).

## .the tense symmetry with `down`

the two verdicts need OPPOSITE source properties, and the pair makes each one legible:

| verdict | tense | needs a source that... | which is |
|---|---|---|---|
| `💀 down` | past — *was up, now is not* | **remembers** | the crew ledger |
| `👥 at work` | present — *is up now* | **forgets** | live tmux |

so tmux's amnesia is a FEATURE for this word and a defect for the other, and the ledger is the
reverse. neither source is better; they answer questions of different tense. this is
`term=poll`'s derivation-axis rule with a temporal dimension added:

> **the axis a verdict derives on must match not only the verdict's SUBJECT but its TENSE.**

## .disputes

### dispute: up — raised 2026-08-26 — status: RESOLVED (keep `at work`)

- raised.by  = beaver 🦫 (self-raised while the cluster was paved)
- claim      = `down` is the settled negative, so `up` is its literal antonym and
               `rule.prefer.symmetric-term-pairs` favours the matched pair
- counter    = the symmetry is real and it spans the wrong layers. `up` is machine vocabulary — a
               grove is up, a server is up, a socket is up — and `term=grove` already draws
               `reachable ≠ at work` as a live boundary. to name the crew verdict `up` would put
               one word on both sides of that boundary, and the boundary exists because the fleet
               got it wrong once already
- resolution = keep `at work`; record `up` as a forbidden synonym. the `down` / `at work` pair is
               asymmetric on purpose, and the asymmetry is informative: one is proven, one is the
               default

### dispute: active — raised 2026-08-26 — status: RESOLVED (keep `at work`)

- raised.by  = beaver 🦫
- claim      = `active` is one word, reads naturally, and every peer tool uses it
- counter    = it asserts motion the verdict cannot observe. the most common `at work` crew in this
               fleet is an **idle** one — a live duct with an empty box, parked on a survey or a
               modal, which is precisely the state `rule.require.nudge-parked-clones` exists for.
               a word that says `active` over a parked clone is a false report the next tick will
               file
- resolution = keep `at work`; record `active` as a forbidden synonym

## .the GLYPH changed — `👥` → `😶`, 2026-08-30

the verdict's word is unchanged; only its glyph moved. recorded here because every table above
that predates this date renders the old one, and a reader owes an explanation rather than a
contradiction.

`👥` is busts-in-silhouette. it says **humans**. but a crew is a set of **clones**, and rhachet had
already fixed `😶` as the org-wide clone domain-root — *a mouthless face the roles give a voice*,
with its own written etymology at rhachet's `choice.clone-glyph.md`.

so `👥` was a **second glyph for a concept that already had one**, which is synonym drift at the
emoji layer — `rule.require.ubiqlang` forbids it, and `rule.prefer.emoji-language` names the
cross-vocabulary borrow as a defect by example.

plurality was the only objection and it does not hold: the row already names the roles beside it,
and rhachet's own list header is `😶 clones` — singular glyph, plural noun. precedent settles it.

the say-level tables were updated; the `.reason` tables above were **not**, because they record
what was true when each dispute was had. a historical record that silently adopts today's glyph
is no longer a record.

## .the axis peers

| verdict | its term |
|---|---|
| `😶 at work` | **this cluster**, paved 2026-08-26 · glyph changed 2026-08-30 |
| `💀 down` | `term=down`, paved 2026-08-26 |
| `👻 phantom` | `term=phantom`, paved 2026-08-28 — the consolidation this file called owed |

`phantom` is now the last of the three without a home, and its case is the one this file just made
about `at work`: defined twice, in two other terms, as a boundary in someone else's argument.

## .see also

- `term=down._.choice._.md` — its negative, and the tense mirror
- `term=grove._.choice._.md` — `reachable ≠ at work`, the boundary this consolidates
- `term=ledger._.choice._.md` — why live tmux under-reports by design
- `term=false-report._.choice._.md` — the proxy cause, and the three states `🌊 changed` hides
- `rule.require.nudge-parked-clones` — what to do with an `at work` crew that has not moved

---

written by human + beaver 🦫
