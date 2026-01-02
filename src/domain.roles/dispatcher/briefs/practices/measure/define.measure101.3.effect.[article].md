# effect

## definition

**effect** is the net value of a behavior: gain minus cost, measured as a weekly rate.

in the dispatcher measurement framework:
- **effect(~$/wk)** = gain - cost
- measured in **$/wk** (absolute, comparable, rate-based)
- can be positive (net benefit) or negative (net loss)


## the effect formula

```
effect(~$/wk) = gain(+$/wk) - cost(-$/wk)

where:
  gain = leverage + yieldage
  cost = attend + expend
```


## components

| dimension | component    | what it measures | unit    | direction |
| --------- | ------------ | ---------------- | ------- | --------- |
| gain      | **leverage** | time gained      | mins/wk | +         |
| gain      | **yieldage** | cash gained      | $/wk    | +         |
| cost      | **attend**   | time spent       | mins/wk | -         |
| cost      | **expend**   | cash spent       | $/wk    | -         |


## converting time to cash

time dimensions (leverage, attend) must be converted to cash for comparison:

```
leverage.$$ = leverage.mins × (hourly_rate / 60)
attend.$$   = attend.mins × (hourly_rate / 60)
```

the hourly rate is configured in `rhachet.dispatch.yml`:

```yaml
convert:
  equate:
    cash:
      dollars: 150   # $150
    time:
      hours: 1       # = 1 hour
```


## why effect matters

effect provides a single comparable metric:

| approach               | problem                                    |
| ---------------------- | ------------------------------------------ |
| compare time only      | ignores cash dimensions (yieldage, expend) |
| compare cash only      | ignores time dimensions (leverage, attend) |
| compare raw dimensions | apples to oranges (mins vs $)              |
| **compare effect**     | single scale, absolute, comparable         |


## effect drives prioritization

in the dispatcher:

1. **measure skill** computes effect(~$) for each behavior
2. **triage skill** uses effect(~$) to assign urgency (now/soon/later)
3. **coordinate skill** uses effect(~$) to rank workstreams

higher effect = more value delivered = higher priority


## effect includes transitive impact

when behavior A unblocks behaviors B and C:

```
A.effect = A.gain - A.cost
A.gain = A.leverage + A.yieldage + B.yieldage + C.yieldage
                                   ↑           ↑
                              transitive impact
```

this ensures blockers that unlock high-value work are prioritized.


## examples

### positive (net benefit)

```
behavior: "add caching layer"

gain(+$/wk):
  leverage = 200 mins/wk × ($150/60) = $500/wk
  yieldage = $0/wk
  total gain = $500/wk

cost(-$/wk):
  attend = 480 mins/wk × ($150/60) = $1,200/wk
  expend = $0/wk
  total cost = $1,200/wk

effect(~$/wk) = $500/wk - $1,200/wk = -$700/wk
```

wait, this is negative — the cost exceeds the immediate gain.

but consider transitive impact:

```
behavior: "add caching layer"
  unlocks: "query optimization" (yieldage = $2,000/wk)

gain(+$/wk):
  leverage = $500/wk
  yieldage.direct = $0/wk
  yieldage.transitive = $2,000/wk
  total gain = $2,500/wk

cost(-$/wk) = $1,200/wk

effect(~$/wk) = $2,500/wk - $1,200/wk = +$1,300/wk
```

now the behavior has positive effect due to what it enables.

### negative (net loss)

```
behavior: "add experimental feature"

gain(+$/wk):
  leverage = $100/wk
  yieldage = $500/wk (uncertain, low probability)
  total gain = $600/wk

cost(-$/wk):
  attend = $2,000/wk
  expend = $500/wk
  total cost = $2,500/wk

effect(~$/wk) = $600/wk - $2,500/wk = -$1,900/wk
```

negative effect → lower priority, likely "later" bucket.


## the notation

| notation     | meaning                          | example     |
| ------------ | -------------------------------- | ----------- |
| **(+$/wk)**  | gain direction (weekly rate)     | +$2,500/wk  |
| **(-$/wk)**  | cost direction (weekly rate)     | -$1,200/wk  |
| **(~$/wk)**  | net effect (weekly rate)         | ~$1,300/wk  |

the `~` indicates "approximately" or "net" — the balance of gains and costs.


## in dispatcher context

effect is the core prioritization metric:

```
prioritization.md:

| behavior        | priority | gain(+$/wk) | cost(-$/wk) | effect(~$/wk) |
| --------------- | -------- | ----------- | ----------- | ------------- |
| auth-flow       | p0       | +$6,360/wk  | -$1,813/wk  | ~$4,547/wk    |
| cache-layer     | p1       | +$7,260/wk  | -$2,113/wk  | ~$5,147/wk    |
| error-handling  | p1       | +$4,536/wk  | -$1,661/wk  | ~$2,875/wk    |
```

behaviors with higher effect(~$/wk) are more impactful and prioritized accordingly.
