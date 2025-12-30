# gain

## definition

**gain** is the total positive value a behavior produces, measured as a weekly rate.

in the dispatcher measurement framework:
- **gain(+$/wk)** = leverage + yieldage → converted to $/wk
- the `+` indicates positive direction (value added)
- the `$/wk` indicates dollars per week (absolute, comparable, rate-based)


## the gain formula

```
gain(+$/wk) = leverage.$$/wk + yieldage/wk

where:
  leverage.$$/wk = leverage.mins/wk × (hourly_rate / 60)
```


## components

| component    | dimension | what it measures                | unit    |
| ------------ | --------- | ------------------------------- | ------- |
| **leverage** | time      | time gained (effort saved)      | mins/wk |
| **yieldage** | cash      | cash gained (revenue/savings)   | $/wk    |


## why combine time and cash

different behaviors produce different types of value:

| behavior type            | primary gain      | example                  |
| ------------------------ | ----------------- | ------------------------ |
| operational improvement  | leverage (time)   | codegen, automation      |
| revenue feature          | yieldage (cash)   | billing, premium tier    |
| cost reduction           | both              | reduce API calls, errors |
| enabling infrastructure  | transitive        | auth unlocks billing     |

by converting everything to $/wk, all behaviors become comparable on a weekly rate basis.


## gain vs effect

| metric           | formula                     | what it measures          |
| ---------------- | --------------------------- | ------------------------- |
| **gain(+$/wk)**  | leverage.$$/wk + yieldage/wk| total positive value/wk   |
| **effect(~$/wk)**| gain(+$/wk) - cost(-$/wk)   | net value/wk (gain - cost)|

gain ignores cost; effect accounts for it.


## transitive gain

when behavior A unlocks behaviors B and C:

```
A.gain/wk = A.leverage/wk + A.yieldage/wk + B.yieldage/wk + C.yieldage/wk
```

the measure skill computes transitive yieldage from the dependency graph.


## examples

### positive

```
behavior: "add payment processing"

leverage = 120 mins/wk saved
leverage.$$/wk = 120 × ($150/60) = $300/wk

yieldage = $1,000/wk (enables revenue)

gain(+$/wk) = $300/wk + $1,000/wk = +$1,300/wk
```

```
behavior: "add caching layer"

leverage = 480 mins/wk saved (across uses)
leverage.$$/wk = 480 × ($150/60) = $1,200/wk

yieldage.direct = $0/wk
yieldage.transitive = $2,000/wk (unblocks query optimization)

gain(+$/wk) = $1,200/wk + $2,000/wk = +$3,200/wk
```

### gain without yieldage

```
behavior: "refactor legacy module"

leverage = 600 mins/wk saved (future maintenance)
leverage.$$/wk = 600 × ($150/60) = $1,500/wk

yieldage = $0/wk (no direct revenue impact)

gain(+$/wk) = $1,500/wk + $0/wk = +$1,500/wk
```


## in dispatcher context

gain is one side of the effect equation:

```
effect(~$/wk) = gain(+$/wk) - cost(-$/wk)
```

displayed in prioritization output:

```
| behavior   | priority | gain(+$/wk) | cost(-$/wk) | effect(~$/wk) |
| ---------- | -------- | ----------- | ----------- | ------------- |
| auth-flow  | p0       | +$6,360/wk  | -$1,813/wk  | ~$4,547/wk    |
```

behaviors with high gain/wk contribute more positive value.
