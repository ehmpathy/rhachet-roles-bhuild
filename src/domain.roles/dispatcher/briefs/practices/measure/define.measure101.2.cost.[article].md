# cost

## definition

**cost** is the total negative value required to complete a behavior, measured as a weekly rate.

in the dispatcher measurement framework:
- **cost(-$/wk)** = attend + expend → converted to $/wk
- the `-` indicates negative direction (value consumed)
- the `$/wk` indicates dollars per week (absolute, comparable, rate-based)


## the cost formula

```
cost(-$/wk) = attend.$$/wk + expend

where:
  attend.$$/wk = attend.mins/wk × (hourly_rate / 60)
```


## components

| component   | dimension | what it measures               | unit    |
| ----------- | --------- | ------------------------------ | ------- |
| **attend**  | time      | time spent (attention)         | mins/wk |
| **expend**  | cash      | cash spent (expenditure)       | $/wk    |


## why combine time and cash

different behaviors require different types of investment:

| behavior type              | primary cost      | example                     |
| -------------------------- | ----------------- | --------------------------- |
| internal implementation    | attend (time)     | developer hours             |
| external integration       | expend (cash)     | API fees, licenses          |
| contractor work            | expend (cash)     | outsourced development      |
| complex feature            | both              | time + infrastructure costs |

by converting everything to $/wk, all costs become comparable on a weekly rate basis.


## cost vs effect

| metric           | formula             | what it measures           |
| ---------------- | ------------------- | -------------------------- |
| **cost(-$/wk)**  | attend + expend     | total investment/wk        |
| **effect(~$/wk)**| gain - cost         | net value/wk (gain - cost) |

cost represents the investment; effect represents the return.


## examples

### time-dominant cost

```
behavior: "refactor authentication module"

attend = 960 mins/wk (16 hours/wk while working on it)
attend.$$ = 960 × ($150/60) = $2,400/wk

expend = $0/wk (no external costs)

cost(-$/wk) = $2,400/wk + $0/wk = -$2,400/wk
```

### cash-dominant cost

```
behavior: "integrate third-party analytics"

attend = 120 mins/wk (2 hours/wk)
attend.$$ = 120 × ($150/60) = $300/wk

expend = $125/wk (recurrent api costs)

cost(-$/wk) = $300/wk + $125/wk = -$425/wk
```

### mixed cost

```
behavior: "add AI-powered search"

attend = 1,440 mins/wk (3 days/wk while building)
attend.$$ = 1,440 × ($150/60) = $3,600/wk

expend = $125/wk (recurrent api costs)

cost(-$/wk) = $3,600/wk + $125/wk = -$3,725/wk
```


## cost and prioritization

low-cost behaviors are not automatically higher priority:

| behavior | gain(+$/wk) | cost(-$/wk) | effect(~$/wk) | priority |
| -------- | ----------- | ----------- | ------------- | -------- |
| A        | +$2,000/wk  | -$1,600/wk  | ~$400/wk      | higher   |
| B        | +$200/wk    | -$100/wk    | ~$100/wk      | lower    |

behavior A has higher cost but also higher effect.

effect (gain - cost) determines priority, not cost alone.


## in dispatcher context

cost is one side of the effect equation:

```
effect(~$/wk) = gain - cost
```

displayed in prioritization output:

```
| behavior   | priority | gain(+$/wk) | cost(-$/wk) | effect(~$/wk) |
| ---------- | -------- | ----------- | ----------- | ------------- |
| auth-flow  | p0       | +$6,360/wk  | -$1,813/wk  | ~$4,547/wk    |
```

the cost column shows total investment required per week for each behavior.
