# seed S2 — a shared template enumerates a CLOSED set, never an open one

## .said — verbatim, 2026-09-06

> so probably best to blocklist, rather than allowlist

> and there may be terraforms and whatever

> so include all excempt .agent/ and .behavior unless they're yields and .dream

🟡 typos preserved — `excempt`. a tidied quote is already a paraphrase.

## .settled

### 1. the middle clause is the whole argument

*"and there may be terraforms and whatever"* names the property that decides the shape: **the
deliverable set is open, varies per repo, and is unknowable from a shared template.**

| the set | members | closed? | knowable from a shared template? |
|---|---|---|---|
| deliverable dirs | `src` · `blackbox` · `terraform` · `bin` · `infra` · `scripts` · `.github` · … | ❌ open | ❌ it varies per repo |
| non-deliverable trees | `.agent/` · `.dream/` · `.behavior/` | ✅ closed | ✅ org convention fixes it |

### 2. the two failure modes are OPPOSITE, and only one is silent

> **an allowlist fails to EMPTY. a blocklist fails to WIDE.**

an empty target set still returns a well-formed verdict, so the lane runs, grades an empty corpus,
and reports clean. a wide one merely costs context.

⇒ that asymmetry is why this is not a style call. it is the same failure class as a mechanism that
**guesses** rather than refuses — the output is indistinguishable from a real one.

### 3. the general form

> **when the set a pattern must name varies per consumer, the pattern must name its COMPLEMENT — and
> the complement must be the closed side.**

reach for the side of the pair whose membership the template can actually know.

## .landed

- `.agent/repo=.this/role=any/briefs/domain.terms/term=review.scope.blocklist._.choice._.md`
- `.agent/repo=.this/role=any/briefs/domain.terms/term=review.scope.blocklist._.choice.reason.md`
- `ehmpathy/rhachet-roles-bhrain#446` — the structural default this term names
- `$route/.fulcrums/inventory.of=fulcrums.case=F13-scope-cut-becomes-a-structural-default.md`

## .the measured reversal — within the hour

bhuild#366 proposed `'{src,blackbox}/**/*.{test.ts,snap}'` for three `5.3.verification` lanes, and
bundled **two** changes in one diff:

| the change | verdict |
|---|---|
| fold the doubled `--paths-with` into one bind | ✅ correct — the measured defect |
| narrow the glob to `{src,blackbox}` | 🔴 wrong — an allowlist in a shared template |

i applied both. the second was reverted across **4 sites**, one of which predated the issue.

⇒ **an issue that proposes a fix proposes a SHAPE too, and its evidence covers only the defect.**
#366's four-round measurement proves the doubled flag misfires. it demonstrates naught about
whether the repair is positive or negative.

🔴 **and the tell on the page was used as confirmation.** i cited an extant lane that already carried
`{src,blackbox}` as *"the worked precedent, in the same file"* — **one instance of a shape is not
evidence the shape is right; it is one instance.** i ran `rule.require.enumerate-before-you-name` on
the flag names and never on the pattern shape.
