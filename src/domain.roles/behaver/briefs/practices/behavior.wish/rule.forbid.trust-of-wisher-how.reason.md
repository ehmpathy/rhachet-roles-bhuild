# rule.forbid.trust-of-wisher-how.reason

the argument behind `rule.forbid.trust-of-wisher-how`. the rule boots as a cue; this file holds why
the cue is right. fetch it to dispute the rule, or to teach it.

## .why

a wisher holds two kinds of knowledge, and they are not equally sound:

- **what hurts, and what they want to press** — this is theirs alone. no one else can supply it
- **how the machine should work** — this is a guess, shaped by the tools they already know

the second kind arrives dressed as the first. a poc works; a prior tool's output looks right; a
named flag set sounds precise. so a writer reads it as spec, and carries it into durable
requirements. once there, every later stage builds on it, and the review that rejects it rejects
the whole route.

the faster horse is the ground: a customer asked how to travel faster would ask for a faster
horse (an aphorism credited to henry ford). they are right about speed, and wrong about horses.

## .why the three trust levels

| the wish holds | trust | why |
|---|---|---|
| the why | full | it is the one fact only the wisher can supply |
| the contract — verbs, rough shape | rough | the verbs name what the wisher will press; drop one and the product misses their need. the inputs, defaults, and scope behind each verb are design, and open |
| a how | none, as spec | it names a mechanism the wisher met first, not one the domain requires |

## .why the strike test

a requirement that names a prior tool can never outlive that tool. when the tool is retired —
often the very reason the work exists — the requirement says naught. to strike the tool and re-read
is one mechanical pass, so a writer and a reviewer reach the same verdict.

## .why a how with a domain why survives

some hows are constraints: "secrets never leave the keyrack" names a mechanism, but its sense is a
domain why. the rule keeps such a how, stated with its why, so it reads right after a strike. to
drop it as "just a how" is the overcorrection the rule also names.

## .why the inverse slip is named

a writer fresh off this rule can read *never trust the how* too wide, and drop the wisher's verbs
with the poc. the verbs are the contract. only what sits behind them is open.

## .why a port still passes the strike test

when the wish is to port tool X, the how looks like the product itself. it is not. X's observable
contract becomes the contract, and X's internals stay a how. the why may name X ("replace X"); a
requirement may not. each requirement states the observable behavior in its own words ("prints each
account's week window"), never "as X does". strike X, and every requirement still reads.

## .why each enforcement grade

- **a requirement that leans on a prior tool = blocker** — it is durable, it seeds every later
  stage, and it fails the strike test by construction
- **a vision or blueprint that adopts a poc's design with no skeptic's pass = blocker** — the
  design is where a how becomes structure. the blueprint is the stage where a how is chosen, so it
  may adopt a poc's mechanism, but only with a domain reason, never "as the poc does"
- **a verb the wisher asked for, dropped as a how = blocker** — the overcorrection ships a product
  that skips the wisher's need, a behavioral harm the user meets
- **a comment or doc that cites a prior tool = nitpick** — it ships no harm a user meets, and it
  is cheap to fix on contact (`rule.forbid.overzealous-blockers`)

## .why the name says how, not implementation

two of the four kinds — a parity target, a done-when phrased by a prior tool — are not
implementations. they are measures borrowed from one. `how` covers all four.

## .see also

- `rule.forbid.trust-of-wisher-how` — the rule this argues for
- `rule.forbid.trust-of-wisher-how.example=rhachet-760.md` — the worked case
- `rule.prefer.clear-desires` — the wish shape this rule reads against
