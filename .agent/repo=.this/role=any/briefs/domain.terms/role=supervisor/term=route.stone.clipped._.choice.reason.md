# domain.term.choice.reason: clipped

## .etymology

**clipped** is the render word. a *clipping region* is what cuts the part of a drawn thing that
falls outside a viewport; the drawn thing is untouched. that is exactly the fact this bucket
asserts — the stone is whole at the source, and the surface between it and the reader was too
narrow to carry the tail.

the alternatives, and why each was set aside:

| candidate | why not |
|---|---|
| `unread` | already declared at `term=duct.box.unread`, and it means the capture came back **empty**. opposite claim, opposite cure |
| `truncated` | reads as an operation performed **on** the datum. the datum was never altered |
| `unknown` | already declared. asserts the row was **judged** and no arm matched; its text is complete |
| `cut` | a verb doing an adjective's job, and `cut` has no viewport sense |
| `elided` | implies a deliberate omission of the uninteresting. nobody chose |
| `partial` | true of far too much — every summary is partial. it discriminates none of them |

## .the enumeration, done before the word was picked

per `rule.require.enumerate-before-you-name`, every instance the word must cover, listed first:

| the instance, measured 2026-09-03 | the capture was empty? | the cure |
|---|---|---|
| `🗿 mechanic: 5.3.verification, re…` | no | widen the pane |
| `🗿 mechanic: 1.vision, judge, approved? 👋…` | no | widen the pane |
| `🗿 mechanic: 5.1.execution.from_vision, review.peer, l3@i026, …` | no | widen the pane |
| a box whose raw capture came back empty | **yes** | re-read the duct |
| a tree the poll could not read at all | no — a different layer | drill in by name |

the first three share a cure that no peer shares. that is the absent distinction the overload
had hidden.

⚠️ and the reverse test, which is the one `enumerate-before-you-name` says gets skipped: does
`clipped` also cover its **neighbours**? it does not — an empty capture has no tail to clip, and
an unreachable tree was never rendered. so the word is neither too narrow nor too wide over the
set above.

## .disputes

### dispute: unread — raised 2026-09-03 — status: RESOLVED (coin `clipped`, forbid `unread` here)

- raised.by = the same session that shipped the defect
- claim     = the bucket shipped as `❓ N unread`. the stone could not be read to its end, so
              `unread` seemed to name it, and `unread` was already a live word in the very file
- counter   = `term=duct.box.unread`'s whole sense is **the capture came back empty**, so no pane
              was judged. this bucket is the opposite: the capture came back fine, the pane WAS
              judged, and only the tail was lost. `rule.forbid.domain-term-ambiguity` — one word,
              one concept — and the overload hid an absent distinction
- resolution = coin `clipped` at the `route.stone` boundary; record `unread` as forbidden here.
               `unread` keeps its `duct.box` sense untouched

⇒ the discriminator that settled it was the **cure**, which is the same test `unread` itself uses
to part from `unknown` and from `asleep`. that test was already written down, in the very cluster
the overload collided with, and it was not consulted at the moment of the coinage.

## .evidence

### the measurement that produced the bucket

`rhachet.beav.fix-keyrack-all-skips-manifest`, 2026-09-03, rendered `🗿 mechanic:
5.3.verification, re…` against a **27-column** pane. the crew was halted on API 500/529 and had
not moved in 167 minutes. the stone tally's catch-all scored it `🔍 in review`; the sweep
reported `✋ 2 blocked`; the human, who read the pane direct at full width, asked why a third
halt went unflagged.

### 🔴 the finding that followed, and it is the larger one

the bucket shipped, and the very next sweep turned `🔍 5 in review` into `🔍 0 in review · ✂️ 6
clipped`. **not one stone on the fleet was readable.** every "in review" the session had
reported was a fabrication — a health verdict computed from clipped strings.

the root cause is not in this repo: kitty's `remember_window_size` default restores a detached
window at its transient close-time width, so panes reopen at 27–35 columns. the supervision
instrument was blind, and it reported the blindness as health.

⇒ that is why the word matters more than a bucket usually would. `clipped` is the one token that
tells a reader **the instrument cannot see**, and it must not be confusable with a token that
means anything else.

### the glyph collision, same ship

the bucket also shipped with `❓`, a near-twin of `❔` — which is `duct.box.unread`'s **and**
`duct.box.unknown`'s. so one ship produced both a word collision and a glyph collision, for one
concept, in a file that already carried a long comment on why `unread` and `unknown` must not be
confused.

⇒ `im_an.obsessive_learner.for.domain.glyphs`: one concept, one symbol. `✂️` names the cut and
sits nowhere near the `❔` family.

## .the open question — is the boundary `route.stone`, or the wider `pane`?

the mechanism is **pane width**, and pane width cuts whatever is longest on a row. so a box
verdict, a duct age, or any other rendered string could clip by the identical mechanism.

the boundary is set at `route.stone` because that is where the evidence is: three measured
instances, all stones, all from one sweep. no clipped box verdict has been observed — box tokens
are short (`empty`, `prompt`, `queued`), so they may be structurally immune rather than merely
unobserved.

⇒ recorded, not widened. `rule.require.boundary-qualified-terms` asks *"$word, of WHAT?"* and the
answer today is one word — a stone. if a clipped box verdict ever lands, the honest move is a
second cluster at that boundary, not a silent widening of this one.

## .see also

- `term=duct.box.unread._.choice._.md` — the word this was split from, and the three-cure test
  that settled it
- `term=false-report._.choice._.md` — correct arithmetic over clipped strings, untrue sentence
- `term=partial-audit._.choice._.md` — the wider family: an instrument that reports a subset,
  read as though it reported the whole
- `rule.forbid.domain-term-ambiguity` — one word, one concept; the overload hides an absent
  distinction
- `rule.require.enumerate-before-you-name` — the enumeration above, done before the pick

---

written by human + beaver 🦫
