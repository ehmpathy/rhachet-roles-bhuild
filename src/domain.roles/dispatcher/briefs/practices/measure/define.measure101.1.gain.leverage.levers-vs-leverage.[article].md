# levers vs leverage

## the distinction

a common confusion: properties like "maintainability" and "evolvability" seem like leverage dimensions to measure.

they are not.

| concept      | what it is                         | measurable? | example           |
| ------------ | ---------------------------------- | ----------- | ----------------- |
| **leverage** | the outcome (time saved)           | yes (mins)  | "saves 30 mins"   |
| **lever**    | the property that creates leverage | no (qualitative) | "maintainable" |


## the relationship

```
lever → leverage

maintainability → support leverage (decreases fix time)
evolvability    → author leverage (decreases add time)
observability   → support leverage (decreases diagnose time)
simplicity      → author + support leverage
```

- **levers** are inputs (qualitative properties)
- **leverage** is output (quantitative time saved)


## why this matters

### the measurement trap

if you try to measure "maintainability" directly:
- what units? "maintainability points"?
- how to compare? is 8/10 maintainability better than 7/10?
- what does it mean? subjective, ungrounded.

### the solution

measure the leverage that maintainability creates:
- leverage.support.time = mins saved per incident
- leverage.support.signal = observability hooks added
- leverage.support.defence = safeguards & failsafes added

the lever (maintainability) is qualitative. the leverage (time saved) is quantitative.


## common levers and their leverage

| lever               | type      | creates leverage in                                  |
| ------------------- | --------- | ---------------------------------------------------- |
| **maintainability** | attribute | support (fix faster)                                 |
| **evolvability**    | attribute | author (add faster)                                  |
| **observability**   | attribute | support (detect faster)                              |
| **simplicity**      | attribute | author + support (less to understand)                |
| **type safety**     | attribute | author (fewer bugs) + support (clearer errors)       |
| **codegen**         | mechanism | author (write less)                                  |
| **declarations**    | mechanism | author (decide less) + support (consistent patterns) |
| **wrappers**        | mechanism | author (encapsulate complexity)                      |


## the rule

> measure leverage, not levers.
>
> levers are how. leverage is how much.

when someone says "this tool improves maintainability," ask:
- "how much support time does it save per incident?"
- "how many signals does it add?"
- "how many defences does it provide?"

that's the leverage.


## examples

### wrong: measuring levers

```
tool evaluation:
  maintainability: 8/10
  evolvability: 7/10
  observability: 9/10

total score: 24/30

# meaningless:
# - what do these numbers mean?
# - how do they compare across tools?
# - what's the actual impact?
```

### right: measuring leverage

```
tool evaluation:

leverage.author:
  time = 360 mins/use
  khues = 25/use (decisions avoided)

leverage.support:
  time = 120 mins/fail
  signals = 4/use (observability hooks)
  defences = 8/use (safeguards)

leverage.composite/week = 206 mins ≈ 3.4 hrs/week

# meaningful:
# - concrete time savings
# - comparable across tools
# - ties to actual impact
```


## in dispatcher context

the dispatcher measures **leverage** (the outcome), not **levers** (the properties).

briefs should define leverage metrics:
- leverage.author.time (mins/use)
- leverage.author.khue (decisions/use)
- leverage.support.time (mins/fail)
- leverage.support.signal (signals/use)
- leverage.support.defence (defences/use)

not lever properties:
- ~~maintainability score~~
- ~~evolvability rating~~
- ~~observability level~~

the lever properties are useful for understanding *why* leverage exists, but the leverage metrics are what get measured and compared.
