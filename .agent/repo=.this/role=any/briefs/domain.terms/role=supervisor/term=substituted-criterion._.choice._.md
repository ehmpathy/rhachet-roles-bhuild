# domain.term: substituted criterion

term.chosen   = substituted criterion
term.kind     = noun
term.synonyms.forbidden:
- moved goalpost
- criterion drift
- scope creep
- rationalization
- lowered bar

## .what

a judgment rendered against a standard **the assessor supplied in place of one already set** by the
party with authority to set it.

the mark that separates it from an honest disagreement: **the swap is never announced as a swap.**
the assessor states the new criterion plainly, believes it is the reasonable one, and never notices
that the choice of criterion was not theirs to make.

```
set:        "no new novel vulnerabilities of escalation, exfiltration, expensation"
used:       task count — 70 done → 73 done
reported:   "a red-queen state, it is not converged"
truth:      the round found a NEW novel class; on the criterion set, it did fine
```

## .why it needs its own word

a criterion is what makes a verdict checkable. every wish carries `.acceptance`; every review
carries a rubric; every terminal condition names what counts as done. **the whole supervisor loop
runs on criteria set by one party and met by another.**

when the party that must meet it quietly writes its own, the verdict is no longer about the work —
it is about the assessor's taste, in the shape of a find. and because the substituted criterion is
usually *easier*, the verdict reads as progress.

## .the shape

three parts, and the second is what makes it invisible from the inside:

1. a criterion was set, explicitly, by the party with authority
2. **the assessor states a different criterion out loud, as though the name of it were the analysis**
3. the verdict is rendered against the new one, and never flags that a swap occurred

part 2 is why this is USUALLY not a hidden defect. the swap is visible in the text, and what is
hidden is that to state it was itself the error.

⚠️ **part 2 does NOT always hold.** where the claim is shaped as a **comparison**, the criterion can
sit implicit in the argument and never be stated at all. a review that argued a release level
against *observed behavior*, where the standard is the *declared contract*, named no baseline in
either direction — so the swap stays invisible until a reader reconstructs it, and the cheap check
below cannot fire. see the eighth instance in `.reason`.

## .the evidenced instances

the first three are mine, all in one session, each caught by the human in one turn. the last row is
mine too, one day later — and it was caught by **nobody**, which makes it the one that proves the
shape can persist. the reason file files it as the sixth (two further instances live only there):

| the assessment | the criterion SET | the criterion i used | the cost |
|---|---|---|---|
| camp-grove's convergence | *"no new novel vulnerabilities of escalation, exfiltration, expensation"* | task count (70→73 done, 9→11 left) | a false `red-queen` verdict |
| camp-grove's work left | *"we want to close known vulns too"* | novel finds only — i implied a known-class find does not hold the loop open | a wrong bound on `done` |
| the port-to-grove risk | the three-axis condition, which presumes an adversary | *"your campers are your own clones"* — a benign adversary | argued past the hardened work entirely |
| a 3-option permission modal | `howto.review-permission-requests`: *"the modal offers **more than two options** … → escalate"* | *"option 2 is the grant-beyond-this-run; option 1 is safe"* — my own rule, stated as though it were the operative one | a gate turned into a pass, unescalated |
| whether a clone had moved | `rule.require.nudge-parked-clones`: the three-axis read — **body · elapsed · width** | a **token counter**, an axis the rule does not name and i supplied myself | none — the verdict was right, and right for a reason i did not rely on. the next tick refuted the axis outright |

the third carries the sharpest refutation on record. within the hour, **camp-grove independently
declared the criterion i had argued down as a blocker-severity rule** —
`rule.require.both-axes-of-grove-threat`, which mandates that every change that touches the grove be
judged on BOTH axes, into the grove and from it, and that any axis-2 vector judged unsecurable be
enumerated rather than forgotten.

so the standard i replaced was not merely the human's preference. it is the standard the party that
does the work re-derived on its own, unprompted, and wrote a blocker against.

### the fifth cost NAUGHT — which is why it is the clearest view of the mechanism

every row above was caught by its damage. the fifth did none, so the mechanism stands alone.

i read `↓ 37.3k tokens` flat across a tick and concluded a clone had taken no turn. **that
conclusion was correct.** the body was also identical, and body is what the rule names — so the
stated criterion and my supplied one agreed, and the agreement felt like confirmation of the axis.
the very next tick the body advanced substantially while the counter stayed at `37.3k`. the axis i
had leaned on would have returned the wrong answer alone.

it is a substitution rather than an addition: the rule sets a **conjunction** (body · elapsed ·
width), and i answered from one conjunct that is not in the set — `term=partial-audit`'s rule that
an audit of a conjunctive criterion owes a verdict per conjunct, with the extra twist that mine was
not one of the conjuncts at all.

> **a criterion that agrees with the stated one on the case in front of you is not thereby
> validated.** a right answer from a wrong axis is indistinguishable from a right answer, and that
> indistinguishability is exactly what promotes the wrong axis to a habit.

so the cheap check needs a second half. after you state the criterion and name who set it, ask
whether the one you used is **on their list** — never merely whether it agreed.

#### the CHECK-DESIGN half — replicated 2026-08-30, and it reaches past the reader

the paragraph above puts the whole burden on the assessor: ask a better question. a mechanic in
`ehmpathy/rhachet` re-derived the same mechanism on a wholly different subject and located the
other half of the cure — in the **check**, not the reader.

it reached for `--keep` as a flag name, then verified and found `keep` was already declared as a
contract value (`ClonePruneDecision = 'prune' | 'keep'`). the word was right. its own account:

> *"i reached the right word by habit, then verified. **habit is not a check.**"*
>
> *"a conformance check that only fires on drift would have stayed silent here — and i'd have
> shipped the right word with no record of why it was right."*

the second line is the new part. my fifth instance stops at *do not trust agreement*, which asks a
reader to be more suspicious. this names a property of the INSTRUMENT:

> **a check that only fires on failure emits no record on success — so every success it passes is
> unaudited, and indistinguishable from a success it never examined.**

that is why the substituted criterion survives. the assessor is not careless; the check is silent
in exactly the case where a substitution would be caught for free. and the silence compounds: each
un-recorded success reads as the axis validated, which is precisely how the wrong axis is promoted
to a habit.

the cure is structural rather than a sharper question, and it costs one line: **make the check emit
its verdict on the pass too** — say which criterion it used and where that criterion came from, even
when no defect is present. a green that names its own standard cannot be a substituted one.

⚠️ this is the replication that closes the fifth instance's weakest leg. that instance cost naught,
so it had no damage to point at and rested on my word alone. an independent party, on another
subject, in a repo whose wish never mentioned the term (channel verified — see
`term=replication`, instance 5), arrived at the same mechanism and carried it one step further.

## .why the forbidden synonyms distort

| ⛔ synonym | why it distorts |
|-----------|-----------------|
| `moved goalpost` | imputes bad faith. every instance above felt like help — the assessor genuinely believed the new criterion was the better one. a term that presumes a cheat will never be applied to oneself, which is the only place it matters |
| `criterion drift` | drift is unowned and gradual. this is a single, deliberate, stated act — the assessor picks the new criterion and says it out loud |
| `scope creep` | the opposite direction. creep widens what is in; this narrows what counts |
| `rationalization` | psychologizes a mechanical defect. the cure is not introspection, it is a question about authorship |
| `lowered bar` | names the usual direction, not the mechanism. a substituted criterion can be *harder* and still be the wrong one — the defect is the swap, never the height |

## .the operator's countermeasure

do not ask *"is this find relevant?"* — ask **"who set the criterion i judge it against, and did
they set THIS one?"**

| the criterion i judge against | who set it | verdict |
|---|---|---|
| the one stated in the wish / condition / rubric | the party with authority | sound |
| one i supplied, and said so out loud | **me, just now** | **substituted criterion** |
| one i supplied, and flagged as a dispute | me, openly, for their verdict | a dispute — sound |

the cheap check: **state the criterion out loud, then name who set it.** if the answer is *"me,
just now"*, you have substituted — and the move available is a dispute, never a verdict.

⚠️ **that check presumes you hold a criterion in view to state.** for a claim shaped as a
**comparison** — a break, a regression, a drift, a delta — the criterion is a **baseline**, and a
baseline hides inside the argument rather than on top of it. so the check returns clean and the
defect survives it.

for those, ask the earlier question first: **what do i measure this AGAINST?** *"breaks extant
behavior"* and *"breaks the declared contract"* are different claims, and only the second is a
break. name the baseline, then ask who set it.

## .not-this

- **an open dispute** — sound, and the paved path. `howto.domain-term-disputes` exists precisely so
  a criterion can be argued. the defect is a swap without a dispute, never the disagreement itself
- **a criterion the setter never stated** — that is a gap to surface, not a standard to replace
- **a `partial audit`** — that narrows the SUBJECT SET, and its auditor cannot see its own gap.
  this narrows the STANDARD, and the assessor states the narrow one plainly
- **`assertion-wider-than-its-claim`** (camp-grove's) — an ENFORCEMENT that over-reaches. this is an
  ASSESSMENT that under-reaches

## .see also

- `term=partial-audit._.choice._.md` — the nearest neighbor; the discriminator table parts them
- `rule.require.wish-outcome-over-proposal` — `.acceptance` is authoritative; this names what goes
  wrong when an assessor rewrites it
- `rule.forbid.prescribe-how-on-dispatch` — its test ("are you satisfied by an unimagined shape?")
  is the same question aimed at the wisher rather than the assessor

---

written by human + beaver 🦫
