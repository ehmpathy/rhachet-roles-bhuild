# domain.term.choice.reason: blocklist

## .etymology

`blocklist` / `allowlist` are the **org-standard** pair, adopted rather than coined. they are cited
here for one reason: **the two are not interchangeable in a shared template, and the extant briefs
name neither.**

`blacklist` / `whitelist` are the words most authors reach for first. beyond the org standard, the
plainer argument: **`blocklist` says what it does.** `blacklist` says only what colour it is, so a
reader learns the mechanism from convention rather than from the word.

`denylist` is a live synonym in the wild and is recorded forbidden — one word per concept.

## .the verdict — the wisher, 2026-09-06

> *"so probably best to blocklist, rather than allowlist"*
> *"and there may be terraforms and whatever"*
> *"so include all excempt .agent/ and .behavior unless they're yields and .dream"*

⇒ *"and there may be terraforms and whatever"* is the whole argument in one clause: **the
deliverable set is open and unknowable from a shared template.**

## .evidence — the enumeration, run properly this time

what must a review-scope pattern cover, across every repo that inherits the template?

| the set | members | closed? | knowable from a shared template? |
|---------|---------|---------|----------------------------------|
| **deliverable dirs** | `src` · `blackbox` · `terraform` · `bin` · `infra` · `scripts` · `.github` · … | ❌ open | ❌ no — it varies per repo |
| **non-deliverable trees** | `.agent/` · `.dream/` · `.behavior/` | ✅ closed | ✅ yes — org convention fixes it |

⇒ **an allowlist asks a shared template to enumerate an open, per-repo set.** it cannot, so it will
be wrong somewhere, and where it is wrong it yields **zero targets** — a lane that runs, grades an
empty corpus, and returns a well-formed verdict.

🔴 **that is the same failure class bhrain#448 exists to close**: a mechanism that guesses rather
than refuses, and whose output is indistinguishable from a real one. a template that guesses a
repo's layout and a parser that guesses a caller's intent fail identically.

## .the measured reversal — 2026-09-06, within the hour

bhuild#366 proposed `'{src,blackbox}/**/*.{test.ts,snap}'` for three `5.3.verification` lanes. it
bundled **two** changes in one diff:

| the change | verdict |
|---|---|
| fold the doubled `--paths-with` into one bind | ✅ **correct** — the measured defect |
| narrow the glob to `{src,blackbox}` | 🔴 **wrong** — an allowlist in a shared template |

i applied both. the second was reverted across **4 sites**, one of which predated the issue.

⇒ **an issue that proposes a fix proposes a SHAPE too, and the evidence covers only the defect.**
#366's four-round measurement proves the doubled flag misfires. it demonstrates naught about whether
the repair is positive or negative.

🔴 **and the tell on the page was used as confirmation.** i cited `mech-test-scope-purity` as *"the
worked precedent, in the same file"* — a lane that already carried `{src,blackbox}`. **one extant
instance of a shape is not evidence the shape is right; it is one instance.** i ran
`rule.require.enumerate-before-you-name` on the flag names and never on the pattern shape.

## .the invariant

> **a shared template enumerates a CLOSED set, never an open one.**

when the set a pattern must name varies per consumer, the pattern must name its **complement** — and
the complement must be the closed side. reach for the side of the pair whose membership the template
can actually know.

## .refs

- bhuild#365 · bhrain#446 — the structural default this term names
- bhuild#366 — the proposed shape this term rejects, and the defect it correctly measured
- bhrain#448 — the failure class an allowlist shares with a guessy parser
- `rule.require.enumerate-before-you-name` — the check that would have caught the shape at authorship
