# attend

## definition

**attend** is the time cost required to complete a behavior, measured as a weekly rate.

in the dispatcher measurement framework:
- **attend** = time spent (attention invested)
- measured in **mins/wk** (absolute, comparable, rate-based)
- always negative in effect calculation (a cost, not a gain)


## what attend captures

| component         | example                                               |
| ----------------- | ----------------------------------------------------- |
| **implementation**| writing code, tests, documentation                    |
| **review**        | code review, design review, approval cycles           |
| **coordination**  | meetings, async communication, alignment              |
| **context switch**| ramp-up time, mental load of switching                |


## attend vs leverage

both measure time, but in opposite directions:

| dimension     | what it measures | unit    | polarity | in effect calculation |
| ------------- | ---------------- | ------- | -------- | --------------------- |
| **leverage**  | time saved       | mins/wk | gain (+) | adds to effect        |
| **attend**    | time spent       | mins/wk | cost (-) | subtracts from effect |


## types of attend

### upfront attend (one-time)

time cost incurred once, amortized to weekly rate over the **cost.horizon**:

```
behavior: "add user profile page"

attend.upfront = 480 mins (8 hours total to build)
attend.upfront/wk = 480 ÷ cost.horizon
                  = 480 ÷ 24 = 20 mins/wk (amortized over 24 weeks)
```

the **cost.horizon** is configurable in `rhachet.dispatch.yml`:

```yaml
cost:
  horizon: 24  # weeks (default: 24 = 1 half year)
```

### recurrent attend

time cost that continues each week:

```
behavior: "maintain user profile feature"

attend.recurrent = 60 mins/wk (1 hour/wk recurrent maintenance)
```

### combining to weekly rate

```
attend/wk = (attend.upfront ÷ cost.horizon) + attend.recurrent
          = (480 ÷ 24) + 60
          = 20 mins/wk + 60 mins/wk
          = 80 mins/wk
```

### estimation by complexity

| complexity | typical attend.upfront | example                        |
| ---------- | ---------------------- | ------------------------------ |
| trivial    | 30-60 mins             | config change, typo fix        |
| simple     | 2-4 hours              | single component, clear scope  |
| moderate   | 8-16 hours             | feature with dependencies      |
| complex    | 24-40 hours            | cross-cutting change           |
| epic       | 40+ hours              | architectural change           |


## attend includes hidden costs

beyond obvious implementation time:

| hidden cost           | often missed                               |
| --------------------- | ------------------------------------------ |
| **rework**            | iterations from review feedback            |
| **waiting**           | blocked on dependencies, reviews, deploys  |
| **debugging**         | unexpected issues during development       |
| **documentation**     | updating docs, ADRs, runbooks              |


## examples

### positive

```
behavior: "add email notification system"

attend.upfront = 720 mins (12 hours total to build)
attend.recurrent = 30 mins/wk (recurrent monitoring)
cost.horizon = 24 weeks (default)

attend/wk = (720 ÷ 24) + 30
          = 30 mins/wk + 30 mins/wk
          = 60 mins/wk

breakdown of upfront:
  - design: 60 mins
  - implementation: 360 mins
  - testing: 180 mins
  - review: 60 mins
  - documentation: 60 mins
```

```
behavior: "fix pagination bug"

attend.upfront = 120 mins (2 hours total)
attend.recurrent = 0 mins/wk

attend/wk = (120 ÷ 24) + 0 = 5 mins/wk
```

### negative

```
# wrong: underestimating by ignoring hidden costs
attend.upfront = 60 mins  # "just a quick change"
# reality: 240 mins after review cycles and edge case handling

# wrong: measuring only coding time
attend.upfront = 180 mins  # implementation only
# missing: design, testing, review, documentation
```


## in dispatcher context

attend is one of two cost dimensions:
- **attend** = time cost (this article)
- **expend** = cash cost (see define.expend)

combined: `cost(-$/wk) = attend + expend`

the conversion from attend to $$ uses:
```
attend.$$ = attend.mins × (hourly_rate / 60)
```

the final effect calculation:
```
effect(~$/wk) = gain - cost
              = (leverage + yieldage) - (attend + expend)
```
