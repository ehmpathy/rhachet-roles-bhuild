# yieldageDistribution

## definition

**yieldageDistribution** is a probabilistic model for uncertain yieldage.

when the cash outcome of a behavior is uncertain, yieldageDistribution captures:
- multiple possible outcomes (as weekly rates)
- probability of each outcome
- enables expected value calculation


## structure

```typescript
type YieldageDistribution = Array<{
  yieldage: number;     // possible outcome in $/wk
  probability: number;  // likelihood (0 to 1)
}>;
```

constraints:
- probabilities must sum to 1.0
- yieldage values must be >= 0 ($/wk)
- at least one entry required


## why probabilistic modeling

not all behaviors have certain outcomes:

| behavior type           | certainty | model to use           |
| ----------------------- | --------- | ---------------------- |
| operational improvement | high      | deterministic yieldage |
| new feature (validated) | medium    | narrow distribution    |
| experimental feature    | low       | wide distribution      |
| research/exploration    | very low  | include failure case   |


## expected yieldage calculation

```
yieldageExpected = sum of (yieldage × probability) for each entry
```

example:
```
yieldageDistribution = [
  { yieldage: $2,000/wk, probability: 0.3 },
  { yieldage: $600/wk,   probability: 0.5 },
  { yieldage: $0/wk,     probability: 0.2 },
]

yieldageExpected = ($2,000 × 0.3) + ($600 × 0.5) + ($0 × 0.2)
                 = $600 + $300 + $0
                 = $900/wk
```


## modeling failure

the failure case is modeled explicitly:

```
{ yieldage: 0, probability: P }
```

where P = probability of failure (no return on investment)

this means:
- success probability = 1 - P
- expected value naturally discounts for failure risk


## common patterns

### high confidence (validated demand)

```
yieldageDistribution = [
  { yieldage: $1,000/wk, probability: 0.9 },
  { yieldage: $0/wk,     probability: 0.1 },
]
# expected: $900/wk
```

### medium confidence (educated guess)

```
yieldageDistribution = [
  { yieldage: $2,000/wk, probability: 0.3 },
  { yieldage: $1,000/wk, probability: 0.4 },
  { yieldage: $0/wk,     probability: 0.3 },
]
# expected: $1,000/wk
```

### low confidence (experimental)

```
yieldageDistribution = [
  { yieldage: $10,000/wk, probability: 0.1 },  # home run
  { yieldage: $1,000/wk,  probability: 0.2 },  # modest success
  { yieldage: $0/wk,      probability: 0.7 },  # failure
]
# expected: $1,200/wk
```


### deterministic (degenerate case)

when outcome is certain, distribution has one entry:

```
yieldageDistribution = [
  { yieldage: $500/wk, probability: 1.0 },
]
# expected: $500/wk (same as deterministic yieldage)
```


## examples

### positive

```
behavior: "add AI-powered recommendations"

# uncertain outcome - customer adoption unknown
yieldageDistribution = [
  { yieldage: $4,000/wk, probability: 0.2 },  # strong adoption
  { yieldage: $1,000/wk, probability: 0.5 },  # moderate adoption
  { yieldage: $0/wk,     probability: 0.3 },  # feature unused
]

yieldageExpected = ($4,000 × 0.2) + ($1,000 × 0.5) + ($0 × 0.3)
                 = $1,300/wk
```

```
behavior: "migrate to new billing provider"

# highly certain - operational improvement
yieldageDistribution = [
  { yieldage: $600/wk, probability: 0.95 },  # migration succeeds
  { yieldage: $0/wk,   probability: 0.05 },  # migration fails
]

yieldageExpected = $570/wk
```

### negative

```
# wrong: probabilities don't sum to 1.0
yieldageDistribution = [
  { yieldage: $2,000/wk, probability: 0.5 },
  { yieldage: $1,000/wk, probability: 0.3 },
]
# invalid: sums to 0.8, not 1.0

# wrong: missing failure case for uncertain outcome
yieldageDistribution = [
  { yieldage: $2,000/wk, probability: 0.5 },
  { yieldage: $1,000/wk, probability: 0.5 },
]
# misleading: ignores possibility of $0/wk outcome
```


## in dispatcher context

yieldageDistribution is used by the measure skill when:
- behavior has uncertain yield
- multiple outcome scenarios exist
- risk-adjusted prioritization is needed

the computed yieldageExpected flows into:
```
gain(+$/wk) = leverage + yieldageExpected
```
