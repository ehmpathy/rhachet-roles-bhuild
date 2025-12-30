# leverage

## definition

**leverage** is the time gained by using a tool or mechanism instead of doing work by hand.

in the dispatcher measurement framework:
- **leverage** = time saved (the gain dimension of effort)
- measured in **minutes** (absolute, comparable)
- always positive (a gain, not a cost)


## the three faces of leverage

leverage manifests across the software lifecycle:

| lifecycle   | action       | question                          | what it measures         |
| ----------- | ------------ | --------------------------------- | ------------------------ |
| **author**  | add behavior | "how much easier to build?"       | effort saved to create   |
| **support** | fix behavior | "how much easier to fix/prevent?" | effort saved to operate  |
| **adopt**   | use lever    | "how often? how hard to start?"   | effort required to adopt |


## metrics

### leverage.author (add behavior)

| metric                         | polarity | unit       | what it measures                |
| ------------------------------ | -------- | ---------- | ------------------------------- |
| **leverage.author.time**       | save     | mins/use   | wall-clock effort reduction     |
| **leverage.author.code.block** | save     | blocks/use | structural complexity reduction |
| **leverage.author.code.path**  | save     | paths/use  | branch complexity reduction     |
| **leverage.author.khue**       | save     | khues/use  | cognitive load reduction        |


### leverage.support (fix behavior)

| metric                       | polarity | unit         | what it measures                              |
| ---------------------------- | -------- | ------------ | --------------------------------------------- |
| **leverage.support.time**    | save     | mins/fail    | "fast to fix" — time saved per incident       |
| **leverage.support.signal**  | gain     | signals/use  | "first to know" — observability hooks added   |
| **leverage.support.defence** | gain     | defences/use | "last to fail" — safeguards + failsafes added |


### leverage.adopt (use lever)

| metric                  | polarity | unit      | what it measures                                |
| ----------------------- | -------- | --------- | ----------------------------------------------- |
| **leverage.adopt.freq** | —        | uses/week | "how often?" — expected usage frequency         |
| **leverage.adopt.time** | cost     | mins/tool | "how hard?" — one-time learn + integration cost |


## composition

```
leverage.composite/week =
  (w.author × leverage.author/week) +
  (w.support × leverage.support/week) -
  (leverage.adopt.time / 52)
```

where:
- `leverage.author/week = leverage.author/use × freq`
- `leverage.support/week = leverage.support/fail × fail.rate`


## why leverage matters

1. **time is the fundamental unit** — all leverage reduces to time
2. **time is irreversible** — second law of thermodynamics
3. **leverage compounds** — 10x tool across 50 features = 450 hrs saved
4. **leverage enables focus** — time saved on solved problems → time for unsolved ones


## levers vs leverage

a common confusion: properties like "maintainability" and "evolvability" seem like leverage dimensions.

they are not.

| concept      | what it is                         | measurable?      |
| ------------ | ---------------------------------- | ---------------- |
| **leverage** | the outcome (time saved)           | yes (mins)       |
| **lever**    | the property that creates leverage | no (qualitative) |

```
lever → leverage

maintainability → support leverage (decreases fix time)
evolvability    → author leverage (decreases add time)
observability   → support leverage (decreases diagnose time)
simplicity      → author + support leverage
```

> measure leverage, not levers.
> levers are how. leverage is how much.


## examples

### positive

```
behavior: "add dynamodb-dao-generator to project"

leverage.author.time = 355 mins/use
  (time.byHand=360 mins - time.byTool=5 mins)

leverage.author.khue = 25 khues/use
  (25 decisions avoided: schema design, GSI strategy, batch limits, ...)

leverage.support.defence = 8 defences/use
  (retry backoff, conditional writes, type safety, ...)
```

### negative

```
# wrong: measuring lever instead of leverage
"this tool has 8/10 maintainability"  # meaningless units

# right: measuring leverage the lever creates
"this tool saves 30 mins per incident via built-in logging"
```


## in dispatcher context

leverage is one of two gain dimensions:
- **leverage** = time gained (this article)
- **yieldage** = cash gained (see define.yieldage)

combined: `gain(+$/wk) = leverage + yieldage`
