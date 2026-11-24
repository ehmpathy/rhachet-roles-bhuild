# domain.term.choice.reason: how

## .etymology

`how` is the plain english third of the trio a wish already speaks in: why, what, how. the rule's
own claim grades the three apart (trust the why, trust the what roughly, never trust the how), so
the noun that names the distrusted part is the one the claim already uses.

## .the enumeration it must cover

`rule.require.enumerate-before-you-name`: list every instance, then pick the word.

| instance | is it an implementation? | is it a how? |
|---|---|---|
| a poc or prior command the wish pastes | yes | yes |
| a named mechanism (field, flag, storage layout) | yes | yes |
| a parity target a prior tool set ("match X's output") | no — a yardstick | yes |
| a done-when phrased by a prior tool ("done when X passes") | no — a yardstick | yes |

`how` covers all four rows and excludes its neighbours (the why, the verbs of the contract).

## .rejected synonyms

| word | why rejected |
|---|---|
| `implementation` | too narrow: misses rows 3 and 4, so a reader passes a parity target as "not an implementation". this was the name the source issue proposed; it allowed the role's own term instead |
| `solution` | too wide: a wish's contract is part of the solution, and it is trusted |
| `approach` | too vague: reads as a stance, not a concrete part of the wish one can strike |

## .evidence

- the worked case `rule.forbid.trust-of-wisher-how.example=rhachet-760.md` holds rows 1 and 3 in
  one wish: a swap command's design adopted as spec (an implementation), and an ad hoc command set
  as the parity target for `get` (a yardstick, no implementation at all). under the name
  `implementation`, the parity target, the costlier of the two, would have slipped past
- the route's fulcrum F1 weighed `-implementations` against `-how`; the director approved `-how`
  with the vision

## .disputes

none open.
