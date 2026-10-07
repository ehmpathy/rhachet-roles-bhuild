# F8 — §5's exclusion list is an open set, and i extended it by one

## .the fork, stated fairly

the wish says *"do NOT move what §5 says stays"*, and §5 names its artifacts explicitly — 9 briefs
by name, 8 `howto.stream.daily.*`, 2 worktree briefs, 1 skill. **19 artifacts, enumerated.**

`rule.always.archive-seeds-in-the-daily-stream.md` is **not among them**, and it ported with the
supervisor's briefs.

the fork:

| branch | the claim |
|---|---|
| **A — port it** | §5 is the authority. it is enumerated, the wish cites it as the bound, and an artifact absent from a closed list is an artifact that lifts |
| **B — exclude it** | §5 is a *criterion* with an incomplete enumeration. the brief fails that criterion, so it stays regardless of whether the list names it |

## .what i took, and why at the time

**branch B.** the brief's own text decides it, in two lines:

```
line  5: > **in THIS repo, a wisher's verbatim words land in the daily stream** …
line 20: **this repo is a supervisor and prioritizer seat. it drives no route.**
```

the rule's entire justification is a premise about **one repo**: that it has no `$route` to scope a
seed archive to, so the parent rule (`rule.always.archive-the-wishers-words-verbatim`) names a path
that cannot exist there.

🔴 **that premise is false in `rhachet-roles-bhuild`, which drives routes** — this very behavior is
one, at `.behavior/v2026_09_22.…/`, with a live `$route/`.

⇒ so the brief is worse than merely out-of-scope. ported, it would **redirect seeds away from
`$route/.seeds/`** in a repo that has one, and override a bhrain/learner rule with a rule whose
stated reason does not hold. an inert misplacement is a cost; an **active misdirection** is a defect.

the three §5 criteria it satisfies, each on the same footing as an artifact the list does name:

| §5 criterion | this brief |
|---|---|
| "about *this* repo, not about supervision" | line 5 and line 20 both say *"this repo"* outright |
| depends on `src/stream/` — the layout §5 keeps | its whole prescription is `src/stream/$isoYear.Q$quarter/$isoDate.seeds.md` |
| leans on a brief §5 excludes | it quotes `define.dir-stream` as its authority, twice |

## .the rework, and why it is CLEAN

restore one file from the rmsafe trash:

```sh
rhx cpsafe .agent/.cache/repo=ehmpathy/role=mechanic/skill=rmsafe/trash/src/domain.roles/supervisor/briefs/rule.always.archive-seeds-in-the-daily-stream.md \
           ./src/domain.roles/supervisor/briefs/rule.always.archive-seeds-in-the-daily-stream.md
```

no work was built on the removal: **no `boot.yml` entry cites it** (grepped, 0 matches in both
files), and its only outbound citation (`define.dir-stream`) left with the same sweep. one `cpsafe`
reverses it whole.

## .confidence — 90%

high, because the brief's own first line names the scope it claims, and that scope is false here.

the 10% is one thing: **i extended a bound the wish stated in closed terms.** a reviewer could hold
that "do NOT move what §5 says stays" means *exactly* the 19 and no more, and that a 20th is mine to
flag rather than act on. i acted because the act is clean to reverse and the alternative ships an
active misdirection — but the call is a **reading of the wish**, and the wisher owns that reading.

## 🔴 .the generalization the council should rule on

this is the same shape `case=8` found in the same document:

> **§6 is titled "the port hazards" — a closed-set title over an open set.** it omits the build's
> asset manifest, which breaks the prioritizer for every consumer.

§5 is titled *"what is nheuron-bound and must NOT be lifted"* — also a closed-set title, also over an
open set. **two of the handoff's enumerations have now been measured incomplete**, and the handoff is
the wish's named source of truth.

⇒ the ruling worth having is not about this one file. it is: **do the handoff's §-lists bind as
enumerations, or as criteria with worked examples?** i drove on the second reading. if the first is
what the wisher meant, this row and any future one like it revert with one `cpsafe`.

## .where

- removed: `src/domain.roles/supervisor/briefs/rule.always.archive-seeds-in-the-daily-stream.md`
- the criterion it fails: the handoff, §5 (`uladkasach/nheuron:src/stream/2026.Q3/2026-09-21.handoff.*.md:334`)
- the peer defect of the same shape: `1.vision.experience.case=8.the-package-ships-what-the-skill-runs.md`

## .the verdict

⏳ **open — best-guessed, awaits the council.**

---

written by human + beaver 🦫
