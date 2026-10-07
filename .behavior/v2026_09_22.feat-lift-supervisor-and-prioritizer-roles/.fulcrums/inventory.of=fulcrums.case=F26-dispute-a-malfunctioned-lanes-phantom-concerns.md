# `F26` — a lane returned a transcript, not a review. dispute its phantom concerns, or concede them?

- **raised** — 2026-09-28, at `5.3.verification`
- **rework** — **clean** (a disposition on two concerns; one command each to reverse)
- **status** — best-guessed; **unruled**
- **confidence** — **90%**

---

## .the fork, stated fairly

the peer lane `enroll-verif-test-intent` (i005 · r012) returned a verdict of `1 blocker,
1 nitpick` — **tallied over a text that holds neither.** what it actually returned is a transcript
of a different clone's session: it ran `route.stone.set --as blocked`, then reported on an `F19`
verdict and an awaited `claude /login`, and closed with a note that it had no work left it could
do.

its own first six lines say why it could not review: the **workspace is not trusted**, and six
`Write(path)` permission rules are silently dropped because claude honors only `Edit(path)`.

⇒ the engine, correctly, refuses to let me absorb the lane until each concern carries a
disposition:

```
2 concerns of enroll-verif-test-intent stand un-absorbed:
  - blocker.1
  - nitpick.1
```

> **so: `--as conceded` on both, which clears the gate cheaply — or `--as disputed`, which says
> out loud that there is no concern there to concede?**

---

## .what i took, and why

**taken: dispute both.**

1. 🔴 **a concession is a claim about content, and there is no content.** `--as conceded` means
   *"the reviewer is right, i will fix it"*. to say that about `blocker.1` would put an answer on
   record where no question was asked — and the next reader of this stone would see a conceded
   blocker and reasonably assume a real defect was found and repaired.
2. **the `1/1` is a failsafe, not a verdict about the code.** per `contract.reviewer-output`,
   `asPeerGivenVerdict` scores an undetected count as one blocker rather than assume zero. it
   fired exactly as designed on an unreadable given. **the tally is right; the artifact tallied is
   not a review.**
3. **`rule.always.absorb-every-concern` names this case**: *"an unreadable given (a malfunction →
   re-run, never an absorption; `F030`)"*. a dispute is the nearest disposition the surface offers
   to "this did not run."

---

## 🔴 .why my confidence is 90% and not higher

the argument against me is procedural, and it is not silly:

> **a dispute sheds a concern from the tally, and a shed concern is what the council exists to
> rule on.** i reach for a dispute to record a *malfunction*, which is arguably a category error —
> the honest instrument for "this lane did not run" might be a re-run, or a `--as blocked`, and a
> dispute may read to a later auditor as though i argued a real concern down.

⚠️ and i cannot fully rule out that the lane *did* apply its rubric and merely rendered its output
catastrophically. i read the whole given and found no rule cited, no file named, and no
`test-intent` claim — but that is my read of a broken artifact, and a broken artifact is precisely
what a reader can misread.

⇒ 90%, not 97%. the content call i am confident about; the **instrument** is where the doubt sits.

---

## .what would settle it in one step

the trust grant — one human, one interactive `claude`, one dialog accepted. **then the lane
re-runs under the guard and renders a real verdict**, and this fork evaporates rather than needs a
ruled outcome.

⇒ that is the tell that this is a clean rework: the dispute is a placeholder for a lane that
cannot speak, and the moment it can speak, its real concerns supersede whatever i wrote here.

---

## .the reversal, if the council rules the other way

**trivial, and fully reversible.** one command per concern:

```sh
rhx route.stone.set --stone 5.3.verification \
  --as conceded --with enroll-verif-test-intent --about blocker.1 --severity better
```

no code moves, no artifact is rewritten, and the `.taken` already on disk states the diagnosis
either way.

---

## ⚠️ .what must NOT happen under either verdict

**a hand-run of the lane to manufacture a clean result.** `rule.forbid.hand-run-reviews`: a
driver-invoked `rhx review` draws no budget, mints no `.given`, and gates naught — so a favorable
result would be a document that reads as evidence and functions as none. the lane is repaired by
a human's grant, or it stays broken and says so.

## .where

- `.reviews/peer/…r012._.given.by_peer.enroll-verif-test-intent.md` — the transcript itself
- `.reviews/peer/…r012._.taken.by_self.enroll-verif-test-intent.md` — the diagnosis
- `.dream/v2026_09_28.fix-enroll-settings-emit-write-rules-claude-ignores.md` — the half of the
  cause that is fixable, in another repo

## .the verdict

*(unruled)*

## .see also

- `contract.reviewer-output` — why an undetected count scores as one blocker
- `rule.always.absorb-every-concern` — the `F030` carve-out this leans on
- `rule.always.diagnose-reviewer-malfunctions` — the driver-fixable / human-fixable split
- `rule.forbid.hand-run-reviews` — the move i refused
