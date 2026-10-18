# F7 — #342: convention only, or the push writes the file

**rework** = **dirty** · **status** = **closed** — wisher verdict, **against my guess** ·
**confidence** = 74% at the time

⇒ raised because reason 2 below is now **closed by a read**: every import of
`domain.operations/behavior/bind` comes from `contract/cli/*`, and **none** from a peer domain. per
`rule.require.bounded-contexts`, cross-context composition belongs in `contract/` — so the CLI
resolves the bind and passes the route path down as an input. **no cross-domain dependency is
created**, and the pattern has 6+ precedents (`bind.behavior.ts`, `boot.behavior.ts`,
`init.behavior.ts`, …). reasons 1 and 3 still stand, which is why it is not higher.

## the fork

#342 asks for a route-local home for authored dispatches, and states a preference:

> **the mechanism**: *ideally* `radio.task.push` (or a behaver dispatch skill) **writes the source
> into `$route/.dispatch/` as part of the push**, so the agent never hand-places it.

| branch | for | against |
|--------|-----|---------|
| **convention only** — a rule + howto + a lint that flags a leak into `briefs/` | small, no code change, satisfies the four stated `.done when` bullets except one | the agent still hand-places the file, so it still copies whatever precedent it finds. that is exactly the failure mode #342 describes: one bad precedent, copied twice |
| **the mechanism writes it** | removes the placement decision entirely; the local artifact and the radio issue are created together and stay in sync | real code in `radioTaskPush` — the cli at `src/contract/cli/radioTaskPush.ts` that broadcasts a dispatch to a channel — plus a route-bind lookup, and a new failure mode when no route is bound |

## what i took, and why at the time

**the mechanism writes it.** the convention-only branch leaves the root cause untouched. #342's own
account is that three dispatches landed wrong because *"the first by an earlier session, the next
two by a copy of that bad precedent"* — a rule that an agent must remember is precisely what failed
there. `rule.prefer.prevent-over-correct` puts this on rung 1 of its ladder: make the wrong action
impossible rather than message it after the fact.

## why 66%, and why dirty

**dirty**: once the push writes files, callers depend on it. a later retreat to convention-only
strands every dispatch already placed by the mechanism, and any tool that reads
`$route/.dispatch/`.

**66%** for three reasons:

1. **i have not read `radioTaskPush`'s implementation.** i verified the shell wrapper delegates to
   `m.cli.radioTaskPush()` and that `.dispatch` appears nowhere in bhuild's `src/`, so this is
   greenfield — but the cost of the change is an estimate, not a measurement.
2. **the route-bind lookup is a new dependency.** the dispatcher role would depend on the behaver
   role's route-bind. that crosses roles inside one package, and i have not checked whether the
   extant layer rules permit it.
3. **`[t2]` of `case=011` invents a behavior nobody asked for** — the fail-loud when no route is
   bound. it is right by `rule.require.failfast`, and it is scope i added.

## a fact found after this row was written

**the lint half of #342 needs an attribution split, and it is owed under either branch.** #342
point 4 asks for a blocker on a `dispatch.*.[task].md` under `.agent/**/briefs/` — a **repo-wide**
glob, unlike every other rule in this wish, whose subject is route-local. so it can block a route
that has no relation to the leaked file.

⇒ the split: **attributable to the bound route → blocker** (the fix is one repo-safe file move,
`rhx mvsafe --from … --into …`, which the driver can run); **orphan from a closed route → flag** (there is no lever the driver holds). #342 already names
this in the same point — *"a dispatch with no known route = flag"* — as a clause easy to drop on the
way to code. demoed at `case=012`.

🟡 this **raises** the cost of the convention-only branch rather than the mechanism branch: the lint
is owed either way, and it is the half with the sharp edge. it does not move the fork's verdict, but
it does mean "convention only" is not the cheap option it reads as.

## where

a rule + howto in the behaver briefs, plus the attributed lint above. **no `radioTaskPush` change.**

## the verdict

**convention only.** — wisher, 2026-09-04:

> convention only on 342

⇒ **overruled.** i argued the mechanism branch from `rule.prefer.prevent-over-correct` rung 1 — make
the wrong action impossible rather than message it. the verdict takes rung 3 instead: catch it early,
at the boundary, with an error that names the fix.

### why the ladder argument was weaker than i priced it

my case rested on *"a rule that an agent must remember is precisely what failed there"*. but the
three leaked dispatches were placed **with no rule and no lint in the repo at all** — the failure was
of an absent guard, not of a remembered one. so the evidence i cited for rung 1 supports rung 3 just
as well, and i read it as backup for only the branch i had taken.

⇒ and the lint is owed under **either** branch (the section above says so in my own words). so the
verdict removes the code and keeps the guard — which is the cheaper half of what i proposed, not a
weaker version of it.

### what changes

| | before | after |
|---|---|---|
| `radioTaskPush` | writes `$route/.dispatch/…` on push | **unchanged** |
| the rule | the boundary + the lint | the boundary + the lint — **unchanged** |
| the howto | absent (the mechanism made it moot) | **owed** — it now carries the placement the mechanism would have |
| `case=011` `[t0]` | *"the push writes it for me"* | the driver places it, guided |
| `case=011` `[t2]` | the push fails loud with no bound route | the **howto** names the route-less fallback |

🟡 **`[t2]` survives the verdict rather than dies with it.** the sharp edge was never "the mechanism
must know where" — it is "**a dispatch authored off-route has no obvious home**". a mechanism would
have answered it by a throw; a convention must answer it in prose, or the lint will demand a
`$route/.dispatch/` that does not exist. repaired in `case=011`.

### 🔴 the verdict conforms to mhedic by LUCK, and that is the sharper result

found 2026-09-07, after the council had already ruled. the peer repo
`ehmpathy/rhachet-roles-mhedic` declares `term=dispatch._.choice._.md`, whose `.what` fixes the home
verbatim — *"born, held, and cleaned up in that route's `$route/.dispatch/` dir, NEVER in the
permanent shared briefs"* — and whose `.refs` names `dispatch.bhuild.route-scoped-dispatch-dir.[task].md`,
**a dispatch into bhuild**.

⇒ so #342 is the **receipt** of a mhedic dispatch, and the fork it appeared to open was never
bhuild's to settle. i weighed *convention only vs the push writes the file* for eleven rounds as
though the convention were ours to shape. **had the council ruled the other way, bhuild would have
shipped a mechanism against a term another repo owns.**

🟡 **and the census knew.** `domain.terms/.readme.md` carried the `dispatch` row for eleven rounds
as *"already declared in mhedic — a cite, not a coin"* — correct in every particular, and the file
was never opened. **a row that states a conclusion closes the loop in the reader's mind while the
file stays unread.**

⇒ that is the discipline the census now carries in its own words: *a row is DISCHARGED only when it
cites what it FOUND. a stated verdict is a hypothesis.*

### the sub-question closed, and why the answer did not matter

*can* the push reach the bind cleanly — **yes**, closed by the read at the head of this entry.
*should* it — the council said no.

⇒ **a feasibility read lifts confidence in a branch without any lift to the odds that branch is
chosen**, and i let the former read as the latter. the read was worth its cost and it moved the
wrong number.
