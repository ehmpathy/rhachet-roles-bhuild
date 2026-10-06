# domain.term.choice.reason: steer

## .etymology

`steer` was already this repo's word before this file. a grep of
`.agent/repo=.this/role=any/briefs/` returns **18 lines across 5 briefs**, and one of them is a
**field in a declared json contract**:

```json
{
  "verdict": "approve | decline | escalate",
  "steer":   null
}
```

so this cluster records a term in live, load-bearing use — never one coined at a keyboard. it
stands on the same ground `poll` stood on: a word the repo's own contracts already speak.

the metaphor is exact and needs no gloss. you steer a vessel that is already under way, and you
steer it **around** a hazard. the two halves of the act are in the word: an obstacle you cannot
pass, and a course that clears it.

## .why the boundary against `nudge` is the one that matters

every other rejected synonym below is a wrong word for a right concept. `nudge` is a **right
word for an adjacent concept**, and that concept already has a rule of its own
(`rule.require.nudge-parked-clones`). so the boundary is not a matter of taste — two rules
govern two acts, and a reader who conflates them will reach for the wrong rule.

they part on what changes:

| | what the message changes | what the clone does next |
|---|---|---|
| **nudge** | its **motion** | resumes the plan it already had |
| **steer** | its **route** | takes a different plan |

worked against the nudge rule's own table, which lists five routes for a parked clone:

- *dismiss a survey* → the clone was stopped by chrome; dismiss it and it carries on. **nudge**
- *"release into prod"* → the clone is done and awaits a word. **nudge**
- *a continue prompt after a quota reset* → the block lifted; say so. **nudge**
- *"why can't you get l3 to agree with you?"* → a question, not a path. **neither** — it is an
  ask, and `rule.require.ask-why-the-reviewer-wont-agree` owns it
- *"`git checkout -b` is off your allowlist; rebase in place instead"* → the clone was headed at
  a wall. **steer**

the fifth is the only one where the clone's plan had to change. that is the whole distinction.

## .why the forbidden synonyms distort

| ⛔ synonym | why it distorts |
|---|---|
| `nudge` | the neighbor, and already a named rule. a nudge changes MOTION; a steer changes ROUTE. see the table above |
| `redirect` | http jargon, and it implies the sender chooses the destination. a steer names a path and leaves the choice; a redirect is obeyed |
| `correct` | presumes the clone was wrong. in the evidenced case the clone's diagnosis was **exactly right** and already matched a documented defect — only its ROUTE was blocked. a word that indicts the analysis misreads what happened |
| `guide` | too soft, and continuous. you guide someone the whole way; a steer is ONE message and then you leave |
| `hint` | understates to the point of harm. `rule.require.errors-name-the-fix` demands a named, concrete move; a hint is precisely what that rule forbids |
| `advise` | drops the refusal half. advice can be offered where naught is blocked; a steer presumes a wall the clone just hit |
| `unblock` | names an EFFECT, and usually the wrong one — an unblock reads as a grant, which is the one act a steer never is (`rule.forbid.self-grant-human-gates`) |
| `override` | inverts the authority. a steer is advisory and may be rejected with reasons; an override is not |

## .the three senses, and why the disagreement is NOT a defect

three of this repo's own briefs use the word, and they do not agree on its grammar:

| # | sense | the contract that carries it |
|---|---|---|
| 1 | a **payload** on a decline | `howto.review-permission-requests` — a `steer` field, `null` unless the verdict is `decline` |
| 2 | a **peer action** to deny | `rule.require.pause-babysit-cron-after-idle-streak` — *approve / deny / steer / submit / release / send* |
| 3 | a **standalone redirect** | evidenced 2026-08-15; no rule covers it |

read as a vocabulary defect this looks like the drift `rule.forbid.domain-term-synonyms` exists
to catch — one word, two grammars, in two contracts of one repo.

it is not, and the reason is that **the two contracts answer different questions**:

- the review howto answers *"what do i emit?"* — and there, a steer rides ON a decline, because
  a decline with no path is the defect that howto is written to prevent
- the idle rule answers *"did the sweep act?"* — and there, a steer IS an act, peer to the other
  five, because the counter cares whether a message went out at all

so the same word is a **field** in a verdict and an **event** in a counter, and both are true of
one act. a `decline` + `steer` emitted together is one message that resets the streak once.

**sense 3 is the one with no home**, and it is what makes the term worth its keep.

## .the evidence — sense 3, and it had a victim

2026-08-15, tick t25. `duct:///rhachet-brains-fireworksai.beav.fix-deepseek-v4-flash-model-id/mechanic`
sat with a clean box and this in its pane:

```
● Bash(git checkout -b beav/pin-npm-oidc-upgrade origin/main)
  ⎿  Error: Permission to use Bash with command git checkout -b … has been denied.
● The user needs to create this branch too. Could you run:
    git checkout -b beav/pin-npm-oidc-upgrade origin/main
✻ Brewed for 9m 36s
```

three properties, and each one closes a door:

| the property | what it rules out |
|---|---|
| the box is EMPTY — no modal, no request | senses 1 and 2. there is no verdict to attach a steer to |
| the ask is NOT on the human-only list | an escalation. `rule.forbid.self-grant-human-gates` names a closed set of five, and a branch is on none of them |
| a compliant path EXISTS — the branch had merged, so a rebase in place takes new commits | a decline. there was a wall AND a way around it |

so it is not a nudge (the clone's plan had to change), not an escalation (no gate), not a
decline (a path existed), and not a payload on a verdict (there was no verdict). it is the third
sense, and no rule on record covers it.

**it had a victim, and the victim is what makes it a term rather than a note.** the clone had
been parked ~10 minutes on a request no human ever needed to answer, and would have stayed
parked until a human read the pane. `term=factory-upgrade._.choice.reason.md` grades exactly
this shape — *"an upgrade needs a mechanism whenever the victim and the repairer are different
parties"* — and here they were: the mechanic could not clear the block, and the supervisor could.

the steer that cleared it named both halves:

> `git checkout -b` is off your allowlist, but a compliant path exists: your current branch
> ALREADY merged to main, so rebase it onto main and commit on top

one message. the clone took the path, committed on the rebased branch, and drove on to a release
within the tick. it never asked again.

### and the steer did NOT correct it

worth its own line, because it is why `correct` is a forbidden synonym. the clone's own
diagnosis was that the publish workflow upgrades npm from a mutable alias rather than a pinned
major, so it drew npm 12, which demands node `^22.22.2` while the runner's `.nvmrc` pins
`22.21.0` — one patch below the cutoff.

that is right, and it is right in a way this repo had **already written down** —
`howto.upgrade-best-practices.md` names the identical case, down to the version numbers, and
adds that the durable home is the declapract template rather than a per-repo patch. so the steer
carried that citation too, and the clone recorded the template repair in its yield.

a steer that had merely said *"you are wrong"* would have cost the round its analysis. the
analysis was the asset; only the route was blocked.

## .the rule this suggests, recorded rather than paved

sense 3 has no rule, and the shape of one is visible from the single instance:

> **before you relay a clone's ask to a human, check it against the closed human-only list. if
> it is absent AND a compliant path exists, you owe a steer rather than a relay.**

that is `rule.forbid.self-grant-human-gates`'s own inverse — it already grades *"an escalation
of a driver-set lever as though it were human-only"* a **nitpick** — aimed at the supervisor's
relay rather than at the driver's escalation.

**one instance.** per the restraint bar, that earns a note and not a rule. this is where the
second will find the first.

### the second — 2026-08-31 — and it REFUTES the either/or above

`rhachet-roles-bhrain…feat-adopt-seeded-briefs` had done substantial work, then stopped on a
scope question — *"do you want all four repairs or just the split?"* — and noted the question
had been asked once already and was still unanswered.

run the instance-1 rule on it and the verdict comes back **relay**: the question is a wisher
scope decision, which sits squarely on the human-only side. so under that rule no steer is owed,
and the clone stays stopped until a human answers.

that verdict is wrong, and the cause is that the rule bundles two things this case pulls apart:

| | whose | the move |
|---|---|---|
| the **ask** — which option does the wisher want? | the human's, genuinely | relay it |
| the **halt** — the clone stopped until answered | **the clone's own**, and its canon forbids it | steer it |

> **the ask and the halt are two things.** relay the ask where it is genuinely the human's;
> steer the halt regardless. a clone may owe the human a question and still owe itself motion.

`rule.always.defer-fulcrums-to-last` already settles the halt half — a scope fork earns a
best-guess plus a flag, and a block is reserved for a fork whose rework would not be clean,
raised last and named. this clone had met none of that bar. it simply stopped.

so instance 1's rule widens:

> **before you relay a clone's ask, part the ASK from the HALT.** relay the ask against the
> human-only list; steer the halt against the clone's own canon. the two are independent, and a
> relay alone leaves a clone stopped on a fork it was obliged to drive past.

#### what makes this steer cost the supervisor no authority it lacks

the path i handed over was not my preference. it was `rule.always.defer-fulcrums-to-last` — a
commitment the clone already lives under. that is the line between a steer and a
`substituted criterion`:

| the steer's path is drawn from | what it costs |
|---|---|
| a rule the clone ALREADY lives under | naught — it is a reminder of its own commitment |
| the supervisor's own preference | a `substituted criterion`, unless raised as a dispute |

the tell is cheap: **can you cite the rule the path comes from?** where you can, the steer is
enforcement of the clone's own canon and needs no authority you do not hold. where you cannot,
you are about to substitute your judgment for a decision that was never yours — and the honest
form of that is a dispute, never a steer.

⚠️ and it is no licence to skip the relay. i sent the steer AND surfaced the question. had i sent
only the steer, the clone would have best-guessed a wisher decision the wisher had been asked
for twice — which is the same defect `rule.forbid.prescribe-how-on-dispatch` guards, met from
the other end.

## .the restraint bar

116 rounds preceded this one, and most paved zero. the bar: a term must be **compelled** by
evidence, never manufactured to satisfy an hourly hook. tested:

- **a new kind?** yes — and its nearest neighbor already has a rule, so the boundary bears real
  load rather than decorates. `nudge`, `escalate`, `decline`, and `ask` each refuse it on a
  stated ground
- **evidenced?** 18 lines across 5 briefs, one of them a field in a declared json contract, plus
  a sense-3 use with a named victim
- **a victim?** yes — a mechanic parked ~10 minutes on an ask no human owed an answer to, where
  the party who could clear it was not the party who was stuck
- **ours?** yes. every contract that carries the word is declared at
  `.agent/repo=.this/role=any/briefs/`
- **would it be re-derived?** it already was, three times independently: the review howto made it
  a required field, the idle rule made it an action, and the prefilled rule tells a supervisor to
  *"decide what it needs and say that, in your own words"* — which is sense 3, described without
  a word for it

it cleared every line. the rounds that declined on jurisdiction alone are what make this
acceptance credible.

## .disputes

none open.

the three-sense split is recorded above as an **observation**, not a dispute: the two contracts
answer different questions, and neither is wrong for the question it answers. a later round that
judges otherwise should open a dispute here rather than quietly unify them.

## .see also

- `term=steer._.choice._.md` — the choice itself
- `rule.require.nudge-parked-clones.md` — the adjacent act, and the rule this term does NOT
  overlap
- `rule.forbid.self-grant-human-gates.md` — the closed human-only list a steer is tested against
- `howto.review-permission-requests.md` — sense 1, the verdict contract's `steer` field
- the **pause-babysit-cron-after-idle-streak** rule — 🔴 **owed, never authored**, at nheuron or
  here, though five briefs cite it. sense 2, one of six actions that reset the streak
- `term=factory-upgrade._.choice.reason.md` — why a victim who cannot repair is what compels a
  mechanism
- `rule.require.errors-name-the-fix` (ergonomist) — why the PATH half is required, never optional

---

written by human + beaver 🦫
