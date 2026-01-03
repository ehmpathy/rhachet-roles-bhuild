# measure

## what is measure?

**measure** is the dispatcher skill that quantifies the value of behaviors.

without measurement, prioritization is guesswork. with measurement, prioritization becomes arithmetic.


## why measure matters

the dispatcher's job is to answer: "what should we work on next?"

this requires comparing behaviors on a single scale:
- behavior A saves 2 hours/week but costs $500/week
- behavior B generates $10k/week but takes 3 days/week
- behavior C unblocks D, E, and F which together yield $50k/week

how do you compare these? you need a common unit and a common rate.

**measure converts everything to $/week** — time, cash, direct value, transitive value — so behaviors become comparable on a weekly rate basis.


## the measurement framework

all measurements are **weekly rates** ($/wk):

```
effect(~$/wk) = gain(+$/wk) - cost(-$/wk)

where:
  gain(+$/wk)  = leverage.$$/wk + yieldage/wk      # positive value
  cost(-$/wk)  = attend.$$/wk + expend/wk          # negative value
```

| component    | dimension | what it measures              | unit    |
| ------------ | --------- | ----------------------------- | ------- |
| **leverage** | time      | time gained (effort saved)    | mins/wk |
| **yieldage** | cash      | cash gained (revenue/savings) | $/wk    |
| **attend**   | time      | time spent (attention)        | mins/wk |
| **expend**   | cash      | cash spent (expenditure)      | $/wk    |

time dimensions are converted to cash via hourly rate:
```
leverage.$$/wk = leverage.mins/wk × (hourly_rate / 60)
attend.$$/wk   = attend.mins/wk × (hourly_rate / 60)
```


## the learning journey

this brief series teaches the measurement framework:

| brief                    | topic                                          |
| ------------------------ | ---------------------------------------------- |
| **measure101.1.gain**    | positive value: leverage + yieldage            |
| └─ gain.leverage         | time gained (the core leverage concept)        |
| └─ gain.leverage.khue    | decision units (cognitive load reduction)      |
| └─ gain.yieldage         | cash gained (revenue, cost avoidance)          |
| └─ gain.yieldage.distribution | probabilistic yield modeling            |
| **measure101.2.cost**    | negative value: attend + expend                |
| └─ cost.attend           | time cost (attention invested)                 |
| └─ cost.expend           | cash cost (expenditure required)               |
| **measure101.3.effect**  | net value: gain - cost                         |


## the core insight

> effect is the single number that drives prioritization.

behaviors with higher effect(~$/wk) deliver more net value and should be prioritized.

the measure skill computes effect for each behavior. the triage skill uses effect to assign urgency (now/soon/later). the coordinate skill uses effect to rank workstreams.

everything flows from measurement.


## example

```
behavior: "add caching layer"

gain(+$/wk):
  leverage = 200 mins/wk × ($150/60) = $500/wk
  yieldage = $2,000/wk (transitive: unblocks query optimization)
  total gain = $2,500/wk

cost(-$/wk):
  attend = 480 mins/wk × ($150/60) = $1,200/wk
  expend = $0/wk
  total cost = $1,200/wk

effect(~$/wk) = $2,500/wk - $1,200/wk = +$1,300/wk
```

this behavior has positive weekly effect — it delivers more value than it costs per week.
