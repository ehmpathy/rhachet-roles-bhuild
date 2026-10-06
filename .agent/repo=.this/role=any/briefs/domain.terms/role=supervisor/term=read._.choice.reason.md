# domain.term.choice.reason: read

## .etymology

**`read`** is the plain english for *observe a surface and take its content*, and it arrived
here from the substrate rather than from a design session: tmux's `capture-pane` yields
text, and the first verb over it was named for what a human does with that text.

it survived because the alternative every convention pointed at — **`get`** — makes a promise
the subject cannot keep.

### the one that nearly won: `get`

`rule.require.get-set-gen-verbs` (ehmpathy/mechanic) is explicit: retrieval is `get`, and a
`get` must be pure, side-effect free, and named `getOne*` / `getAll*`. by that rule alone
`duct.read` should be `getOnePane`.

it is not, and the reason is a property of the subject rather than a preference:

> a `get` reads a store **we** own, so its answer holds until we change it.
> a read observes a surface a **clone** owns, so its answer is stale the instant it returns.

that is not a nuance. it is the premise of `rule.require.verify-after-send`, which exists
solely because the gap between a read and the send it justified is long enough for a modal
to clear. a verb named `get` would imply a re-read is redundant; the verb `read` implies a
re-read is **owed**, and it is.

⇒ so this is a **split, never a synonym**: `get` and `read` name different guarantees, and
the flat namespace has room for both because they never describe the same act.

### the rejected mechanisms

`tail`, `cat`, `capture`, and `dump` all name **how** rather than **why**
(`howto.domain-discovery`, name from the motive). the point is sharper than usual here,
because the mechanism has already moved once: the `--lines` repair changed the capture from
a bare `-S '-N'` to `-S '-N' | tail -n N`. a verb named `capture` would now name a pipeline
rather than an act.

### the rejected glances

`peek` and `view` both read as optional — a look a caller may skip. that is precisely the
wrong connotation: `howto.review-permission-requests` step 0 makes a read **mandatory**
before any key is sent to a modal, and
`rule.require.babysit-cron-per-dispatch-fleet` grades a `--keys` sent without one as a
blocker. the word must carry that weight.

## .disputes

no dispute is open. the `get`/`read` split above was settled at itemization on 2026-09-03
and is recorded as a split rather than as a dispute, because neither word was ever in use
for the other's sense — there was no drift to correct, only an unwritten distinction.

## .evidence

### the discovery — an asymmetric pair

the term surfaced from a **symmetry check**, not from a defect. on 2026-09-03 the crew layer
gained two verbs at once, `crew.read` and `crew.send`, to close a layer gap. `send` already
carried a full cluster; `read` carried none, though the two are exact opposites across the
same boundary and are used in the same breath by every babysit tick.

⇒ an itemized verb whose twin is unitemized is a glossary that describes half a pair. that
asymmetry is the discovery.

### the evidence — three scope defects, one shape

all three of this verb's defects on record are `partial audit` in the literal sense: the read
was truthful about what it examined and silent about what it excluded.

| date | the defect | measured |
|---|---|---|
| 2026-09-03 | `--lines N` returned N lines of scrollback **plus the whole visible pane** — the `-S '-N'` capture had no `-E`, so the end defaulted to the pane bottom | `--lines 1` → **30 lines**. a clip downstream cut the tail, where a modal's options live. this is why a stuck modal could not be read at all until it was fixed |
| 2026-09-03 | `term.audit` hardcoded `localhost` (`term.audit.sh:84`); `crew.show` defaulted `--grove local` | a crew alive on a grove with both tabs open was reported `💥 no ducts on this box`. **6 of 26 crews were the whole subject set**, and the verdict named no omission |
| unfixed, by design | a plain read is color-blind | prefilled (white) and ghost (gray, `ESC[2m`) render identically, so an Enter can submit an autocomplete the human never wrote. `--raw` is the discriminator, and it is opt-in |

the common shape is what makes the term worth a cluster: **the verb never lied. the caller's
assumption about its scope did.** so the cluster's job is to make the scope question
unavoidable at the call site.

### the corroboration — a read that aged, caught live

on 2026-09-03 a supervisor read a modal, judged it safe, and sent `--keys 1`. the modal had
cleared in between, so the digit landed in an empty box and the next poll reported
`✍️ PREFILLED "1"` — a human-typed signal the supervisor had manufactured itself.

⇒ that is the snapshot property at work, exactly as this cluster predicts, and it is the
reason `read` must not be `get`.

## .see also

- `term=send._.choice._.md` — the symmetric twin, and the verb this one completes
- `term=poll._.choice._.md` — the sweep a read drills in beneath
- `term=partial-audit._.choice._.md` — the family all three defects belong to
- `term=crew._.choice._.md` — the view axis `show` owns, and why a read is not one
- `rule.require.verify-after-send.md` — the rule the snapshot property grounds

---

written by human + beaver 🦫
