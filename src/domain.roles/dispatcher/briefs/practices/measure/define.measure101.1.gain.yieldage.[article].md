# yieldage

## definition

**yieldage** is the cash gained from completing a behavior, measured as a weekly rate.

in the dispatcher measurement framework:
- **yieldage** = cash gained (revenue earned or cost avoided)
- measured in **$/wk** (absolute, comparable, rate-based)
- always positive (a gain, not a cost)


## what yieldage captures

| source            | example                                              |
| ----------------- | ---------------------------------------------------- |
| **revenue**       | feature enables new sales, upsells, conversions      |
| **cost avoidance**| automation eliminates manual work, reduces errors    |
| **risk reduction**| compliance prevents fines, security prevents breach  |


## yieldage vs leverage

both are gain dimensions, but measure different things:

| dimension     | what it measures | unit    | example                           |
| ------------- | ---------------- | ------- | --------------------------------- |
| **leverage**  | time gained      | mins/wk | "saves 2 hrs/wk"                  |
| **yieldage**  | cash gained      | $/wk    | "enables $2,500/wk"               |


## direct vs dependent yieldage

### direct yieldage

the value this behavior produces on its own.

```
behavior: "add stripe integration"
yieldage.direct = $1,000/wk (enables payments)
```

### dependent yieldage

the value that becomes accessible when this behavior unblocks others.

```
behavior: "add authentication system"
yieldage.direct = $0/wk (no direct revenue)
yieldage.dependent = $4,000/wk (unblocks billing, premium features)
```

the measure skill computes:
```
yieldage.total = yieldage.direct + yieldage.dependent
```


## measuring yieldage

### when yieldage is known

use direct estimation:

```
behavior: "add premium tier pricing"
yieldage = $500/wk

basis: 50 customers × $10/wk premium tier
```

### when yieldage is uncertain

use yieldageDistribution (see define.yieldageDistribution):

```
behavior: "add experimental feature"
yieldageDistribution = [
  { yieldage: $2,000/wk, probability: 0.2 },  # success case
  { yieldage: $200/wk,   probability: 0.5 },  # moderate case
  { yieldage: $0/wk,     probability: 0.3 },  # failure case
]

yieldageExpected = ($2,000 × 0.2) + ($200 × 0.5) + ($0 × 0.3) = $500/wk
```


## examples

### positive

```
behavior: "add automated invoice generation"

yieldage.direct = $300/wk
  basis: eliminates 10 hrs/wk manual work × $30/hr = $300/wk

yieldage.dependent = $0/wk
  (no behaviors blocked on this)

yieldage.total = $300/wk
```

```
behavior: "add user authentication"

yieldage.direct = $0/wk
  (auth itself doesn't generate revenue)

yieldage.dependent = $1,500/wk
  (unblocks: billing $1,000/wk, premium features $500/wk)

yieldage.total = $1,500/wk
```

### negative

```
# wrong: conflating yieldage with leverage
"this feature is worth 100 hours"  # that's leverage (time), not yieldage (cash)

# wrong: ignoring dependent yieldage
"auth has no value"  # misses the value it unlocks
```


## in dispatcher context

yieldage is one of two gain dimensions:
- **leverage** = time gained (see define.leverage)
- **yieldage** = cash gained (this article)

combined: `gain(+$/wk) = leverage.$$/wk + yieldage`

the conversion from leverage to $$/wk uses:
```
leverage.$$/wk = leverage.mins/wk × (hourly_rate / 60)
```
