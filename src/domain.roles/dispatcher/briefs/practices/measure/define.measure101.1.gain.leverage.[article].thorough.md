# leverage: a measurable domain

this document is the canonical reference for leverage as a measurable domain. it articulates what leverage is, why it matters, and how to measure it.


---


## 1. what is leverage?

### 1.1. definition

**leverage** is the amplification of effort via upfront investment.

in software, leverage measures how much a tool amplifies your effort:
- **input** = time, cognitive load, risk you invest
- **output** = software that works, reliability, maintainability you receive

a high-leverage tool transforms small inputs into large outputs.


### 1.2. the physics

all leverage concepts derive from archimedes' lever:

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│     use.effort                                 use.effect   │
│       ↓                                            ↓        │
│       ●────────────────────┬──────────────────────●         │
│       │                    │                      │         │
│       │◄─── arm.effort ───►│◄─── arm.effect ─────►│         │
│                            ▲                                │
│                         fulcrum                             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**archimedes' law:**
```
use.effort × arm.effort = use.effect × arm.effect
```

**arm vs use:**
- **arm.effort** = mechanism that applies effort on your behalf (embedded in the lever)
- **use.effort** = force you exert each time (adhoc effort per use)
- **arm.effect** = effect capacity the mechanism handles
- **use.effect** = actual effect you achieve each use

**how to increase leverage — move the fulcrum closer to the effect:**

```
low leverage:     ●───────────────────┬───────────────────●
                  use.effort          ▲            use.effect
                  (high force needed)

high leverage:    ●───────────────────────────┬───────────●
                  use.effort                  ▲    use.effect
                  (low force needed)
```

**the symmetry:**
```
more arm.effort → less use.effort (for same use.effect)
```

the mechanism holds embedded effort, so your use.effort becomes amplified.

in software terms:
- **lengthen arm.effort** = invest upfront in mechanisms that handle more
- result: less use.effort needed per use, same use.effect achieved


### 1.3. intuition

imagine two developers:
- **developer A** writes a DAO by hand: 6 hours, 35 code blocks, 25 decisions
- **developer B** uses a generator: 5 minutes, 0 code blocks, 0 decisions

both produce equivalent DAOs. but developer B achieved the same output with ~1/70th the input.

that ratio — 70x — is leverage.


### 1.4. the three faces of leverage

leverage manifests across the software lifecycle:

| lifecycle   | action       | question                          | what it measures         |
| ----------- | ------------ | --------------------------------- | ------------------------ |
| **author**  | add behavior | "how much easier to build?"       | effort saved to create   |
| **support** | fix behavior | "how much easier to fix/prevent?" | effort saved to operate  |
| **adopt**   | use lever    | "how often? how hard to start?"   | effort required to adopt |

- **author** = add new functionality with the lever
- **support** = fix/prevent failures with the lever (fast to fix, first to know, last to fail)
- **adopt** = use the lever itself (frequency and learn cost)

a tool can provide high author leverage but low support leverage (easy to write, hard to debug). or high support leverage but low adopt leverage (great once learned, steep learn curve).

complete leverage assessment requires all three.


---


## 2. why leverage matters

### 2.1. time is the fundamental unit

all leverage ultimately reduces to time:

| metric            | what it really measures               |
| ----------------- | ------------------------------------- |
| code blocks saved | time not spent to write and debug     |
| decisions avoided | time not spent to research and debate |
| signals gained    | time not spent to diagnose            |
| defences gained   | time not spent to recover             |

even non-temporal metrics (complexity, cognitive load, risk) are proxies for time: how long would it take to understand, fix, or recover?


### 2.2. time is irreversible

this isn't arbitrary — it's physically grounded.

the second law of thermodynamics: entropy increases, processes are irreversible. time flows one direction. a tool that saves 1 hour has saved 1 hour of the universe's most scarce resource: irreversible time.


### 2.3. leverage compounds

high-leverage tools don't just save time — they compound:

```
without tool: 10 hrs/feature × 50 features = 500 hrs
with 10x tool: 1 hr/feature × 50 features = 50 hrs

savings = 450 hrs = 11 weeks of full-time work
```

over a year, across a team, across a portfolio — leverage differences become the difference between ship and not ship.


### 2.4. leverage enables focus

time saved on solved problems is time available for unsolved ones.

high-leverage tools shift developer attention from "how do I implement a cache?" to "what should the cache invalidation policy be?" — from mechanism to intent.


---


## 3. the leverage measurement framework

### 3.1. dimension structure

```
leverage.composite/week
│
├── leverage.author/week                        ← "add behavior"
│   └── leverage.author/use × freq
│       └── (α × time.gut) + ((1-α) × time.decomposed)
│           ├── leverage.author.time       [save, mins/use]   ← gut estimate
│           ├── leverage.author.code.block [save, blocks/use] ─┐
│           ├── leverage.author.code.path  [save, paths/use]  ├─ decomposed
│           └── leverage.author.khue       [save, khues/use] ─┘
│
├── leverage.support/week                       ← "fix behavior"
│   └── leverage.support/fail × fail.rate
│       └── (α × time.gut) + ((1-α) × time.decomposed)
│           ├── leverage.support.time     [save, mins/fail]   ← gut estimate
│           ├── leverage.support.signal   [gain, signals/use] ─┐
│           └── leverage.support.defence  [gain, defences/use] ┴─ decomposed
│
└── leverage.adopt                              ← "use lever"
    ├── leverage.adopt.freq            [—, uses/week]      ← scale factor
    └── leverage.adopt.time            [cost, mins/tool]   ← amortized
```


### 3.2. metric structure

every metric follows this pattern:

```
leverage.{lifecycle}.{metric} = {polarity}({value}-{unit}/{scope})

where:
  lifecycle = author | support | adopt
  polarity  = save | gain | cost
  scope     = use | fail | tool
```

**scopes:**

| scope     | when                       | example                               |
| --------- | -------------------------- | ------------------------------------- |
| **/use**  | each time the tool is used | codegen execution, wrapper invocation |
| **/fail** | each time a failure occurs | incident diagnosis, debug             |
| **/tool** | once per tool              | discovery, learn, integration         |


### 3.3. leverage.author metrics

**"add behavior" — effort saved to create**

| metric                         | polarity | unit       | what it measures                |
| ------------------------------ | -------- | ---------- | ------------------------------- |
| **leverage.author.time**       | save     | mins/use   | wall-clock effort reduction     |
| **leverage.author.code.block** | save     | blocks/use | structural complexity reduction |
| **leverage.author.code.path**  | save     | paths/use  | branch complexity reduction     |
| **leverage.author.khue**       | save     | khues/use  | cognitive load reduction        |


### 3.4. leverage.support metrics

**"fix behavior" — effort saved to operate**

fast to fix, first to know, last to fail:

| metric                       | polarity | unit         | what it measures                              |
| ---------------------------- | -------- | ------------ | --------------------------------------------- |
| **leverage.support.time**    | save     | mins/fail    | "fast to fix" — time saved per incident       |
| **leverage.support.signal**  | gain     | signals/use  | "first to know" — observability hooks added   |
| **leverage.support.defence** | gain     | defences/use | "last to fail" — safeguards + failsafes added |


### 3.5. leverage.adopt metrics

**"use lever" — effort required to adopt**

| metric                  | polarity | unit      | what it measures                                |
| ----------------------- | -------- | --------- | ----------------------------------------------- |
| **leverage.adopt.freq** | —        | uses/week | "how often?" — expected usage frequency         |
| **leverage.adopt.time** | cost     | mins/tool | "how hard?" — one-time learn + integration cost |


---


## 4. how to measure leverage

### 4.1. measure leverage.author.time

```
leverage.author.time = time.byHand - time.byTool

where:
  time.byHand = estimated time to implement equivalent by hand
  time.byTool = time to achieve same result with tool
```

**example:** dynamodb-dao-generator
- time.byHand = 6 hours (manual DAO implementation)
- time.byTool = 5 minutes (run generator)
- leverage.author.time = 355 mins/use


### 4.2. measure leverage.author.code.block

```
leverage.author.code.block = blocks.byHand - blocks.byTool

where:
  block = a logical code paragraph (cohesive unit of logic)
```

blocks are more meaningful than lines because:
- a block represents a cohesive unit of logic
- lines vary due to format
- blocks capture "conceptual units" avoided

**example:** with-simple-cache
- blocks.byHand = 6 (key gen, cache check, compute, cache store, error handle, backend wire)
- blocks.byTool = 0 (one-line wrapper)
- leverage.author.code.block = 6 blocks/use


### 4.3. measure leverage.author.khue

```
leverage.author.khue = enumerate(questions the tool answers for you)
```

a **khue** (question) is a decision point where the tool provides an answer so you don't have to research, debate, or decide.

**example khues for dynamodb-dao-generator:**
1. "what's the table schema?"
2. "how to design GSI strategy?"
3. "what batch limits to use?"
4. "how to handle pagination?"
5. "what retry strategy?"
6. "how to serialize/deserialize?"
7. "how to handle type safety?"
... (25 total)


### 4.4. measure leverage.support.signal

```
leverage.support.signal = enumerate(observability hooks added by tool)
```

**example signals for dynamodb-dao-generator:**
1. operation start log
2. operation success log
3. operation failure log
4. operation duration metric

= 4 signals/use


### 4.5. measure leverage.support.defence

```
leverage.support.defence = enumerate(safeguards + failsafes added by tool)
```

**example defences for dynamodb-dao-generator:**
1. retry with exponential backoff
2. conditional writes for idempotency
3. unique key enforcement
4. type safety validation
5. batch size limits
6. pagination guards
7. error classification
8. timeout handle

= 8 defences/use


### 4.6. measure leverage.adopt.freq

consider the tool's **domain depth**:

| depth | scope     | example                  | typical freq |
| ----- | --------- | ------------------------ | ------------ |
| 0     | usecase   | specific business logic  | 0.1/week     |
| 1     | domain    | domain-specific patterns | 0.25/week    |
| 2     | framework | framework-specific       | 0.5/week     |
| 3     | language  | language-specific        | 2/week       |
| 4     | platform  | platform-specific        | 3/week       |
| 5     | universal | any software             | 5+/week      |

higher depth = broader applicability = higher freq potential


---


## 5. compose a single leverage score

### 5.1. the composition challenge

with 9 metrics across 3 lifecycles, how do we get a single comparable score?

key insight: **all leverage reduces to time.** we can:
1. convert any metric to time-equivalent (mins saved)
2. add time-equivalents directly
3. weight by frequency
4. compare on a single scale


### 5.2. decompose time

each lifecycle has:
- a **gut time estimate** (direct "how much time saved?")
- **sub-dimensions** that decompose into time

| lifecycle | gut estimate          | sub-dimensions       | time conversion              |
| --------- | --------------------- | -------------------- | ---------------------------- |
| author    | leverage.author.time  | blocks, paths, khues | blocks×5 + paths×3 + khues×5 |
| support   | leverage.support.time | signals, defences    | signals×10 + defences×15     |


### 5.3. the symmetric composition formula

```
# leverage.author
author.time.decomposed = (blocks × 5) + (paths × 3) + (khues × 5)
leverage.author/use = (α × time.gut) + ((1-α) × author.time.decomposed)
leverage.author/week = leverage.author/use × freq

# leverage.support
support.time.decomposed = (signals × 10) + (defences × 15)
leverage.support/fail = (α × time.gut) + ((1-α) × support.time.decomposed)
leverage.support/week = leverage.support/fail × fail.rate

# leverage.composite
leverage.composite/week =
  (w.author × leverage.author/week) +
  (w.support × leverage.support/week) -
  (leverage.adopt.time / 52)
```


### 5.4. configurable weights

| weight        | what it controls               | default |
| ------------- | ------------------------------ | ------- |
| **α**         | trust in gut vs decomposed     | 0.5     |
| **w.author**  | importance of author leverage  | 1.0     |
| **w.support** | importance of support leverage | 1.0     |
| **fail.rate** | expected failures per week     | 0.1     |

**when to adjust:**
- increase α when estimator has high domain expertise
- increase w.support for operationally-critical systems
- increase fail.rate for unstable or high-traffic systems


---


## 6. worked examples

### 6.1. with-simple-cache

**purpose:** add cache to any function with one-line wrapper

**raw measurements:**

| metric                     | value          |
| -------------------------- | -------------- |
| leverage.author.time       | 20 mins/use    |
| leverage.author.code.block | 6 blocks/use   |
| leverage.author.code.path  | 7 paths/use    |
| leverage.author.khue       | 9 khues/use    |
| leverage.support.time      | 30 mins/fail   |
| leverage.support.signal    | 1 signal/use   |
| leverage.support.defence   | 3 defences/use |
| leverage.adopt.freq        | 5 uses/week    |
| leverage.adopt.time        | 45 mins/tool   |

**composition (α=0.5):**

```
author.time.decomposed = (6×5) + (7×3) + (9×5) = 30 + 21 + 45 = 96 mins
leverage.author/use = (0.5×20) + (0.5×96) = 58 mins
leverage.author/week = 58 × 5 = 290 mins

support.time.decomposed = (1×10) + (3×15) = 10 + 45 = 55 mins
leverage.support/fail = (0.5×30) + (0.5×55) = 43 mins
leverage.support/week = 43 × 0.1 = 4.3 mins

leverage.composite/week = 290 + 4.3 - (45/52) = 293 mins ≈ 4.9 hrs/week
```


### 6.2. dynamodb-dao-generator

**purpose:** generate type-safe DAOs from domain objects

**raw measurements:**

| metric                     | value          |
| -------------------------- | -------------- |
| leverage.author.time       | 360 mins/use   |
| leverage.author.code.block | 35 blocks/use  |
| leverage.author.code.path  | 40 paths/use   |
| leverage.author.khue       | 25 khues/use   |
| leverage.support.time      | 120 mins/fail  |
| leverage.support.signal    | 4 signals/use  |
| leverage.support.defence   | 8 defences/use |
| leverage.adopt.freq        | 0.5 uses/week  |
| leverage.adopt.time        | 180 mins/tool  |

**composition (α=0.5):**

```
author.time.decomposed = (35×5) + (40×3) + (25×5) = 175 + 120 + 125 = 420 mins
leverage.author/use = (0.5×360) + (0.5×420) = 390 mins
leverage.author/week = 390 × 0.5 = 195 mins

support.time.decomposed = (4×10) + (8×15) = 40 + 120 = 160 mins
leverage.support/fail = (0.5×120) + (0.5×160) = 140 mins
leverage.support/week = 140 × 0.1 = 14 mins

leverage.composite/week = 195 + 14 - (180/52) = 206 mins ≈ 3.4 hrs/week
```


### 6.3. declapract-typescript-ehmpathy

**purpose:** 40+ typescript best practices as inheritable declarations

**raw measurements:**

| metric                     | value           |
| -------------------------- | --------------- |
| leverage.author.time       | 360 mins/use    |
| leverage.author.code.block | 75 blocks/use   |
| leverage.author.code.path  | 0 paths/use     |
| leverage.author.khue       | 80 khues/use    |
| leverage.support.time      | 60 mins/fail    |
| leverage.support.signal    | 5 signals/use   |
| leverage.support.defence   | 43 defences/use |
| leverage.adopt.freq        | 0.25 uses/week  |
| leverage.adopt.time        | 90 mins/tool    |

**composition (α=0.5):**

```
author.time.decomposed = (75×5) + (0×3) + (80×5) = 375 + 0 + 400 = 775 mins
leverage.author/use = (0.5×360) + (0.5×775) = 568 mins
leverage.author/week = 568 × 0.25 = 142 mins

support.time.decomposed = (5×10) + (43×15) = 50 + 645 = 695 mins
leverage.support/fail = (0.5×60) + (0.5×695) = 378 mins
leverage.support/week = 378 × 0.1 = 38 mins

leverage.composite/week = 142 + 38 - (90/52) = 178 mins ≈ 3.0 hrs/week
```


### 6.4. comparison

| tool                           | composite/week | hrs/week | rank |
| ------------------------------ | -------------- | -------- | ---- |
| with-simple-cache              | 293 mins       | 4.9 hrs  | #1   |
| dynamodb-dao-generator         | 206 mins       | 3.4 hrs  | #2   |
| declapract-typescript-ehmpathy | 178 mins       | 3.0 hrs  | #3   |


---


## 7. key insights

### 7.1. frequency amplifies small gains

with-simple-cache saves only 58 mins per use, but high frequency (5/week) yields more weekly leverage than dynamodb-dao-generator (390 mins/use but only 0.5/week).

```
high freq × small gain ≈ low freq × large gain
```


### 7.2. khues are undervalued

cognitive load reduction (khues avoided) often contributes more than raw time saved. each khue avoided saves:
- research time
- debate time
- decision fatigue
- future regret

declapract-ts has 80 khues/use — that's 80 decisions you don't have to make.


### 7.3. defences compound over time

support leverage scales with system age. a tool with 43 defences (declapract-ts) prevents 43 classes of failure — every week, forever.

as systems age, support leverage overtakes author leverage.


### 7.4. adoption cost is amortized

a 3-hour learn investment (dynamodb-dao-generator) amortized over 52 weeks is only 3.5 mins/week — negligible compared to continued leverage.

don't let adoption cost deter you from high-leverage tools.


### 7.5. rankings depend on weights

| scenario                    | recommended weights  | likely #1         |
| --------------------------- | -------------------- | ----------------- |
| greenfield, rapid iteration | α=0.5, w.support=0.5 | with-simple-cache |
| production-critical system  | α=0.5, w.support=5.0 | declapract-ts     |
| domain expertise available  | α=1.0, w.support=1.0 | dynamodb-dao-gen  |

there is no universal "best" — only best-for-context.


---


## 8. summary

### 8.1. what leverage is

leverage is the ratio of output gained to input invested. in software, it measures how much a tool amplifies your effort:

- **leverage.author** = add behavior with the lever (effort saved to create)
- **leverage.support** = fix behavior with the lever (effort saved to operate)
- **leverage.adopt** = use the lever (effort required to adopt)


### 8.2. why leverage matters

time is irreversible. leverage saves time. saved time compounds. high-leverage tools are the difference between ship and not ship.


### 8.3. how to measure leverage

1. **enumerate** raw metrics for each lifecycle (time, blocks, paths, khues, signals, defences)
2. **decompose** each lifecycle into time-equivalents
3. **compose** via the symmetric formula:

```
leverage.composite/week =
  (w.author × leverage.author/week) +
  (w.support × leverage.support/week) -
  (leverage.adopt.time / 52)
```

4. **compare** tools on a single, meaningful scale: minutes saved per week


---


## 9. quick reference

### 9.1. measurement checklist

when you evaluate a tool's leverage:

- [ ] estimate time saved per use (leverage.author.time)
- [ ] count code blocks avoided (leverage.author.code.block)
- [ ] count conditional paths avoided (leverage.author.code.path)
- [ ] count decisions avoided (leverage.author.khue)
- [ ] estimate debug time saved per failure (leverage.support.time)
- [ ] count observability hooks added (leverage.support.signal)
- [ ] count safeguards/failsafes added (leverage.support.defence)
- [ ] estimate usage frequency (leverage.adopt.freq)
- [ ] estimate learn + integration time (leverage.adopt.time)


### 9.2. time conversion rates

| metric         | rate    | rationale                                         |
| -------------- | ------- | ------------------------------------------------- |
| block → mins   | 5 mins  | avg time to write + debug one logical paragraph   |
| path → mins    | 3 mins  | avg time to write and test one conditional branch |
| khue → mins    | 5 mins  | avg time to research and decide one question      |
| signal → mins  | 10 mins | avg debug time saved by one observability hook    |
| defence → mins | 15 mins | avg incident time saved by one safeguard          |


### 9.3. default weights

| weight    | default | what it controls          |
| --------- | ------- | ------------------------- |
| α         | 0.5     | balance gut vs decomposed |
| w.author  | 1.0     | importance of author      |
| w.support | 1.0     | importance of support     |
| fail.rate | 0.1     | failures per week         |


---


## 10. appendix: glossary

| term                 | definition                                                  |
| -------------------- | ----------------------------------------------------------- |
| **leverage**         | ratio of output gained to input invested                    |
| **leverage.author**  | "add behavior" — effort saved to create with the lever      |
| **leverage.support** | "fix behavior" — effort saved to operate with the lever     |
| **leverage.adopt**   | "use lever" — effort required to adopt the lever            |
| **block**            | a logical code paragraph; cohesive unit of logic            |
| **path**             | a conditional branch in code                                |
| **khue**             | a decision point; question the tool answers for you         |
| **signal**           | an observability hook (log, metric, trace); "first to know" |
| **defence**          | safeguards + failsafes; "last to fail"                      |
| **safeguard**        | prevents failure (proactive); at devtime or runtime         |
| **failsafe**         | handles failure gracefully (reactive)                       |
| **freq**             | expected uses per week                                      |
| **fail.rate**        | expected failures per week                                  |
| **α (alpha)**        | weight for gut estimate vs decomposed estimate              |
| **w.author**         | weight for author leverage                                  |
| **w.support**        | weight for support leverage                                 |


---


## 11. appendix: levers vs leverage

### 11.1. the distinction

a common confusion: "maintainability" and "evolvability" seem like leverage dimensions to measure.

they are not.

- **leverage** = the measurable outcome (time saved, effort reduced)
- **lever** = the property or tool that creates the leverage

levers are inputs. leverage is output.

```
lever → leverage

maintainability → support leverage (decreases fix time)
evolvability    → author leverage (decreases add time)
observability   → support leverage (decreases diagnose time)
simplicity      → author leverage (decreases write time)
```


### 11.2. why this matters

if you try to measure "maintainability" directly, you get stuck:
- what units? "maintainability points"?
- how to compare? is 8/10 maintainability better than 7/10?
- what does it mean? subjective, ungrounded.

instead, measure the leverage that maintainability creates:
- leverage.support.time = mins saved per incident
- leverage.support.signal = observability hooks added
- leverage.support.defence = safeguards & failsafes added

the lever (maintainability) is qualitative. the leverage (time saved) is quantitative.


### 11.3. common levers and their leverage

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


### 11.4. the rule

> measure leverage, not levers.
>
> levers are how. leverage is how much.

when someone says "this tool improves maintainability," ask:
- "how much support time does it save per incident?"
- "how many signals does it add?"
- "how many defences does it provide?"

that's the leverage.

