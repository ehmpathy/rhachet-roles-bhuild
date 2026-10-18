# F13 — #349's scope cut becomes a structural default, and its mechanism moves to bhrain

- **status** CLOSED — wisher verdict, 2026-09-06
- **rework** clean
- **confidence** 94%
- **where** `$route/1.vision.yield.md` (the ships-as table, `case=004`), bhrain#446

## the fork, stated fairly

#349 asks that *"reviewers load only `.yield.md` from a behavior dir"*. #365 then measured the
mechanism **inert**: `--paths-wout` against a `--diffs`-sourced target set **grew** both trees
(`.agent/` 140.0k → 145.4k, `.behavior/` 162.7k → 181.4k).

that left three branches:

| branch | what it means |
|---|---|
| **drop #349** | its mechanism is dead; deliver the other eleven |
| **reshape it as a per-lane flag** | keep the cut in bhuild; wait for a bhrain fix that may never come |
| 🔴 **split it — default in bhrain, add-back in bhuild** | fix the exclusion at the layer that owns it, and make #349 the carve-out on top |

## taken, and why at the time

**branch 3**, and the wisher ruled it rather than i guessed it:

> *"exclude all from .behavior OTHER THAN the current routes .yield.md's, exclude all .agent/ and
> exclude all .dream/"*

> *"we require that pulled in here, cause of how common this blocker is"*

⇒ **the scope of the problem was wider than #349 framed it.** #349 reads as a *behavior-dir*
problem. the wisher's cause is *"so many repos keep [hitting] out of context ... because
`.agent/repo=.this/role=any/briefs` are pulled into review, or `.behavior/` logs"* — which names
`.agent/` first, and it strikes repos with no route at all.

⇒ so the cut is **not a per-lane flag on two bhuild lanes**. it is a default in `rhx review`, and
#349 is the one legitimate exception to it.

## the four layers that result

| layer | what | repo |
|---|---|---|
| fail loud on an unrecognized flag | `--paths-without` is parsed and discarded | 🔴 bhrain#446 |
| make exclusion apply to `--diffs`-sourced targets | #365's measurement | 🔴 bhrain#446 |
| default-exclude `.agent/**` · `.dream/**` · `.behavior/**` | the wisher's tree list | 🔴 bhrain#446 |
| add back `$route/*.yield.md` on the lanes that need it | **#349** | ✅ bhuild, this route |

🔴 **the precedence rule is what makes #349 implementable at all**, and it is stated in the
dispatch: **an explicit `--paths-with` overrides the structural default.** without it, a default
that excludes `.behavior/**` makes a stage rubric unable to read its own subject.

## rework, and why

**clean.** the bhuild half shrinks — #349 was two lanes' flags and is now one add-back. the bhrain
half is a new ship, not a reversal of one. and the two bhuild sites that carried the dead
`--paths-without` are already renamed to `--paths-wout`, so they inherit the fix the day it lands.

## the dependency this creates, stated plainly

🟡 **#349 is now blocked on bhrain#446.** it is inside the twelve and it is required, so this route
carries an external dependency it did not have at the wish. the wisher ruled the pull-in with that
cost visible.

⇒ the mitigation is that the **bhuild-side** change is small and independently correct: the
add-back flag is right whether or not the default lands, and today's rename is right regardless.

## what it invalidated

🔴 **`case=004` claimed one flag removes ~200k from the target set — the flag it names removes no
file.** the demo now carries the two-layer structural-default shape above (`the fix is a structural
default, not a flag on two lanes`). the ~200k figure moved to `appendix.groundwork.md`, guarded as a
quote of the falsified draft rather than a live figure. the rewrite landed.

## confidence — 94%, and why not higher

the verdict is explicit and the layer split follows from ownership, so the fork itself is settled.
the residual 6% is the **precedence rule**: i assert that an explicit `--paths-with` should beat the
structural default, and no one has ruled that yet — it is my design proposal inside someone else's
repo. if bhrain implements the default as unconditional, #349 becomes undeliverable and this fulcrum
reopens.
