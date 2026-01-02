# expend

## definition

**expend** is the cash cost required to complete a behavior, measured as a weekly rate.

in the dispatcher measurement framework:
- **expend** = cash spent (expenditure)
- measured in **$/wk** (absolute, comparable, rate-based)
- always negative in effect calculation (a cost, not a gain)


## what expend captures

| component           | example                                            |
| ------------------- | -------------------------------------------------- |
| **infrastructure**  | cloud resources, APIs, third-party services        |
| **tooling**         | licenses, subscriptions, paid integrations         |
| **external labor**  | contractors, consultants, outsourced work          |
| **operational**     | ongoing costs the behavior introduces              |


## expend vs attend

both are cost dimensions, but measure different things:

| dimension   | what it measures | unit    | example                        |
| ----------- | ---------------- | ------- | ------------------------------ |
| **attend**  | time spent       | mins/wk | "takes 8 hours/wk to build"    |
| **expend**  | cash spent       | $/wk    | "requires $125/wk API cost"    |


## types of expend

### one-time expend (upfront)

costs incurred once, amortized to weekly rate over the **cost.horizon**:

```
behavior: "integrate payment processor"

expend.upfront = $2,400
expend.upfront/wk = $2,400 ÷ cost.horizon
                  = $2,400 ÷ 24 = $100/wk (amortized over 24 weeks)
```

the **cost.horizon** is configurable in `rhachet.dispatch.yml`:

```yaml
cost:
  horizon: 24  # weeks (default: 24 = 1 half year)
```

why 24 weeks default?
- balances short-term ROI visibility with realistic payback expectations
- aligns with typical planning cycles (half-year horizons)
- prevents over-weighting of upfront costs relative to ongoing benefits

### recurrent expend

costs that continue each week:

```
behavior: "add AI-powered search"

expend.recurrent = $125/wk (recurrent api costs)
```

### combining to weekly rate

```
expend/wk = (expend.upfront ÷ cost.horizon) + expend.recurrent
          = ($2,400 ÷ 24) + $125/wk
          = $100/wk + $125/wk
          = $225/wk
```


## expend can be zero

many behaviors have no direct cash cost:

```
behavior: "refactor authentication module"

expend = $0/wk
  (uses existing infrastructure, internal team only)

attend = 960 mins/wk (16 hours/wk of developer time)
```

the cost is still captured via **attend** (time cost).


## examples

### positive

```
behavior: "add real-time analytics dashboard"

expend.upfront = $1,200
expend.recurrent = $50/wk
cost.horizon = 24 weeks (default)

expend/wk = ($1,200 ÷ 24) + $50/wk
          = $50/wk + $50/wk
          = $100/wk
```

```
behavior: "integrate SMS notifications"

expend.upfront = $0
expend.recurrent = $25/wk

expend/wk = $0/wk + $25/wk = $25/wk
```

### negative

```
# wrong: ignoring ongoing costs
expend = $10/wk  # integration fee only
# missing: $50/wk API cost

# wrong: conflating attend with expend
expend = $60/wk  # "developer cost"
# this is attend (time), not expend (cash)
# unless it's external contractor payment
```


## when to use expend vs attend

| scenario                      | use          | rationale                    |
| ----------------------------- | ------------ | ---------------------------- |
| internal team implements      | attend       | time cost, not cash cost     |
| contractor implements         | expend       | direct cash payment          |
| SaaS subscription required    | expend       | direct cash cost             |
| infrastructure scaling needed | expend       | cloud cost increase          |
| code review by team           | attend       | time cost, not cash          |
| external security audit       | expend       | direct cash payment          |


## in dispatcher context

expend is one of two cost dimensions:
- **attend** = time cost (see define.attend)
- **expend** = cash cost (this article)

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
