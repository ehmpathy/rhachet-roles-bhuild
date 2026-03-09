# ref: factory optimization

## .what

principles to optimize "the machine that builds the machine" — the factory, not the product.

> "the potential for improvement is at least a factor of 10 greater in production than in the product itself." — elon musk

## .concept kernels

factory optimization wisdom converges on these core concepts across 20+ thinkers:

| kernel | thinkers | key insight |
|--------|----------|-------------|
| constraints | goldratt, musk, ohno | optimize the bottleneck, not all parts |
| flow | ohno, womack, reinertsen | pull systems beat push systems |
| feedback | deming, boyd, kim, beck | tight loops accelerate learn rate |
| waste | ohno, womack, poppendieck | eliminate non-value-add work |
| kaizen | ohno, deming, senge | small daily improvements compound |
| batches | ohno, beck, kim, reinertsen | small batches reduce risk and cycle time |
| systems | senge, deming, goldratt | optimize the whole, not the parts |
| autonomy | bezos, ohno, musk | empowered teams move faster |

---

## kernel 1: constraints

### theory of constraints (goldratt)

> "any improvement not at the constraint is an illusion." — eliyahu goldratt

the five focus steps:
1. **identify** the constraint
2. **exploit** it (maximize throughput at the bottleneck)
3. **subordinate** all else to it
4. **elevate** the constraint (add capacity)
5. **repeat** — find the new constraint

goldratt's insight: a chain is only as strong as its weakest link. optimized non-constraints waste effort.

### musk's bottleneck obsession

> "focus on the constraint. what blocks the critical path?"

musk's 5-step algorithm:
1. question every requirement
2. delete parts and processes
3. simplify and optimize
4. accelerate cycle time
5. automate (last, not first)

critical: steps must run in order. most engineers automate processes that shouldn't exist.

### applied to software

| constraint | symptom | response |
|------------|---------|----------|
| test runtime | slow feedback | parallelize, mock, cache |
| deploy queue | long lead time | trunk-based dev, feature flags |
| code review | blocked prs | pair review, mob review |
| environment setup | slow onboard | containers, scripts |

---

## kernel 2: flow

### toyota production system (ohno)

> "all we are is look at the timeline from the moment the customer gives us an order to the point when we collect the cash. we reduce that timeline." — taiichi ohno

pull vs push:
- **push**: produce based on forecast, inventory buffers absorb mismatch
- **pull**: produce based on demand signal (kanban), minimize inventory

just-in-time (jit): produce only what is needed, when needed, in the amount needed.

### lean (womack & jones)

five principles:
1. **value** — define from customer's perspective
2. **value stream** — map all steps, identify waste
3. **flow** — make value flow without interruption
4. **pull** — let customer pull value through the system
5. **perfection** — pursue continuous improvement

### product development flow (reinertsen)

> "queues are the invisible enemy of product development." — donald reinertsen

key insights:
- batch size reduction improves flow exponentially
- variability is inherent; design for it
- fast feedback reduces cost of failure
- work-in-progress limits prevent overload

### applied to software

| tps concept | software equivalent |
|-------------|---------------------|
| kanban | task boards, wip limits |
| jit | continuous deployment |
| andon cord | build alerts, on-call |
| single piece flow | small prs, trunk-based dev |

---

## kernel 3: feedback

### pdca / deming cycle

> "without data, you're just another person with an opinion." — w. edwards deming

plan-do-check-act:
1. **plan** — hypothesize, design experiment
2. **do** — execute small-scale trial
3. **check** — measure results against hypothesis
4. **act** — adopt, adapt, or abandon

deming's 14 points emphasize systems, not blame; learn, not inspect.

### ooda loop (boyd)

> "he who can handle the quickest rate of change survives." — john boyd

observe-orient-decide-act:
- faster ooda loops confer competitive advantage
- orient = synthesis of mental models
- tempo matters more than individual decisions

applied: team with 10-minute test feedback beats team with 10-hour feedback.

### three ways (kim)

from the phoenix project and devops handbook:

1. **flow** — left to right, dev to ops to customer
2. **feedback** — right to left, fast detection of problems
3. **experimentation** — take risks, learn from failure

### extreme development (beck)

> "embrace change." — kent beck

xp practices optimize feedback at every timescale:

| timescale | practice |
|-----------|----------|
| seconds | pair review |
| minutes | tdd, red-green-refactor |
| hours | continuous integration |
| days | small releases |
| weeks | plan game |

### applied to software

| feedback loop | target latency |
|---------------|----------------|
| syntax errors | <1s (editor) |
| unit tests | <10s |
| integration tests | <5m |
| stage deploy | <30m |
| production monitor | real-time |

---

## kernel 4: waste

### seven wastes (ohno)

> "the most dangerous kind of waste is the waste we do not recognize." — shigeo shingo

original (muda):
1. **transport** — unnecessary movement of materials
2. **inventory** — excess stock
3. **motion** — unnecessary movement of people
4. **wait** — idle time
5. **overproduce** — make more than needed
6. **overprocess** — do more than needed
7. **defects** — rework and scrap

### software wastes (poppendieck)

mary & tom poppendieck translated lean to software:

| original | software equivalent |
|----------|---------------------|
| transport | task switch, handoffs |
| inventory | partial work, branches |
| motion | search for info, meets |
| wait | blocked tickets, reviews |
| overproduce | unused features, dead code |
| overprocess | gold plate, premature optimize |
| defects | bugs, technical debt |

### shingo on waste

> "improvements usually means do what we have never done before." — shigeo shingo

smed (single-minute exchange of die): reduce changeover time from hours to minutes.

applied: reduce environment setup from hours to minutes via containers and scripts.

---

## kernel 5: kaizen

### continuous improvement (ohno)

> "progress is impossible without change, and those who cannot change their minds cannot change anything." — george bernard shaw (via toyota)

kaizen = change (kai) for better (zen)

principles:
- small, daily improvements compound
- everyone suggests improvements
- respect for people
- gemba: go see the actual work

### learn fast (senge)

> "the only sustainable competitive advantage is an organization's ability to learn faster than the competition." — peter senge

five disciplines:
1. **personal mastery** — individual learn
2. **mental models** — surface assumptions
3. **shared vision** — align on goals
4. **team learn** — dialogue and discussion
5. **systems view** — see wholes, not parts

### applied to software

| kaizen practice | software equivalent |
|-----------------|---------------------|
| suggestion box | retrospectives |
| gemba walk | code review, pair |
| andon | incident review |
| 5 whys | root cause analysis |
| pdca | experimentation |

---

## kernel 6: small batches

### single piece flow (ohno)

> "the smaller the batch size, the smoother the flow." — taiichi ohno

benefits:
- faster feedback
- reduced inventory (wip)
- earlier defect detection
- lower risk

### cd practices (fowler, humble)

> "if it hurts, do it more frequently, and pull the pain forward." — jez humble

continuous integration demands:
- commit frequently (at least daily)
- run tests on every commit
- fix broken builds immediately
- keep the build fast

### cost of delay (reinertsen)

> "if you only quantify one fact, quantify the cost of delay." — donald reinertsen

small batches reduce:
- cost of delay (faster delivery)
- cost of failure (less to rework)
- hold cost (less wip)

### applied to software

| large batch | small batch |
|-------------|-------------|
| monolithic feature | decomposed increments |
| big bang releases | continuous deployment |
| complete features | vertical slices |
| manual qa phases | automated tests |

two dimensions of batch size:
- **code batch**: feature flags shrink code batches — ship code to prod sooner, get integration feedback faster, even if not user-visible yet
- **value batch**: decomposition shrinks value batches — ship user-visible increments sooner, get user feedback faster

both reduce risk; they work on different feedback loops.

---

## kernel 7: systems view

### fifth discipline (senge)

> "today's problems come from yesterday's solutions." — peter senge

systems archetypes:
- fixes that backfire
- shift the burden
- limits to growth
- tragedy of the commons

key: local optimization often hurts global performance.

### statistical view (deming)

> "a bad system will beat a good person every time." — w. edwards deming

94/6 rule: 94% of problems are caused by the system; only 6% by individuals.

implications:
- blame the system, not the person
- measure variation, not just outcomes
- understand common cause vs special cause

### theory of constraints (goldratt)

> "tell me how you measure me, and i will tell you how i will behave." — goldratt

throughput account:
- throughput = rate of goal achievement
- inventory = money tied up in the system
- operate expense = money spent to create throughput

optimize throughput, minimize inventory and expense.

### applied to software

| local optimize | global harm |
|----------------| ------------|
| developer productivity metrics | game, rushed code |
| individual velocity | knowledge silos |
| team-specific tools | integration friction |
| department budgets | local hill climb |

---

## kernel 8: autonomy

### two-pizza teams (bezos)

> "if you can't feed a team with two pizzas, it's too large." — jeff bezos

small, autonomous teams:
- own their domain end-to-end
- make decisions quickly
- reduce coordination overhead
- ship independently

### toyota respect for people

> "we get brilliant results from average people in brilliant processes." — toyota

principles:
- trust workers to improve their processes
- provide tools and education
- remove obstacles
- value frontline knowledge

### musk on empowerment

> "the best part is no part. the best process is no process. delete the step."

empower teams to:
- question requirements
- delete unnecessary work
- simplify processes
- accelerate directly

### applied to software

| bureaucratic | autonomous |
|--------------|-----------|
| approval queues | self-service platforms |
| shared resources | team-owned infra |
| centralized decisions | decentralized authority |
| standardized tools | team-selected tools |

---

## .the factory equation

```
output = volume × density × velocity
```

| term | production | software dev |
|------|------------|--------------|
| volume | factory size | team size, hours |
| density | % of space that does useful work | % of time that does useful work |
| velocity | speed of production line | speed of feedback loops |

musk sees 10x improvement potential in density alone (from 2-3% to 20-30%).

---

## .the five questions

for any factory (build system, test infra, dev workflow):

### 1. what's the bottleneck?

- what's the slowest step? (goldratt)
- what blocks higher velocity? (musk)
- where do mechanics wait? (ohno)

### 2. what's manual that could be automated?

- what requires human intervention that shouldn't? (ford)
- what's repetitive? (taylor)
- what's error-prone due to manual steps? (shingo)

### 3. what's the density?

- what % of time is spent on actual value delivery? (musk)
- what's overhead vs productive work? (poppendieck)
- where is space/time wasted? (ohno)

### 4. what's the velocity?

- how fast is the feedback loop? (deming, boyd)
- how quickly can we verify a change? (beck, kim)
- what would 10x faster look like? (musk)

### 5. does this empower or burden?

- do tools help or get in the way? (bezos)
- are systems used or worked around? (senge)
- does the factory serve the mechanic? (ohno)

---

## .factory vs product

| factory (workloops) | product (codepaths) |
|---------------------|---------------------|
| test frameworks | test code (spec) |
| build systems | production code (impl) |
| ci/cd pipelines | features |
| dev environments | user experiences |
| feedback loops | behaviors |

the factory enables verification. the product is what gets verified.

---

## .key insight

> "tesla's long-term competitive advantage will be production." — musk

> "the only sustainable competitive advantage is an organization's ability to learn faster than the competition." — senge

the team that optimizes their factory will outpace teams that only optimize their product.

---

## .sources

### production systems
1. [Toyota Production System - Toyota](https://global.toyota/en/company/vision-and-philosophy/production-system/)
2. [Taiichi Ohno and the Toyota Production System - Lean Enterprise Institute](https://www.lean.org/lexicon-terms/toyota-production-system/)
3. [The Machine That Changed The World - Womack, Jones, Roos](https://www.lean.org/store/book/the-machine-that-changed-the-world/)

### theory of constraints
4. [The Goal - Eliyahu Goldratt](https://www.tocinstitute.org/the-goal-summary.html)
5. [Theory of Constraints - Goldratt Institute](https://www.goldrattresearchlabs.com/theory-of-constraints)

### quality and systems
6. [Out of the Crisis - W. Edwards Deming](https://deming.org/explore/fourteen-points/)
7. [The Fifth Discipline - Peter Senge](https://www.penguinrandomhouse.com/books/163984/the-fifth-discipline-by-peter-m-senge/)
8. [PDCA Cycle - Deming Institute](https://deming.org/explore/pdsa/)

### lean and flow
9. [Lean - Womack & Jones](https://www.lean.org/store/book/lean-thinking/)
10. [The Principles of Product Development Flow - Donald Reinertsen](https://www.leanproductflow.com/)
11. [SMED - Shigeo Shingo](https://www.lean.org/lexicon-terms/smed/)

### devops and software
12. [The Phoenix Project - Gene Kim](https://itrevolution.com/product/the-phoenix-project/)
13. [The DevOps Handbook - Kim, Humble, Debois, Willis](https://itrevolution.com/product/the-devops-handbook-second-edition/)
14. [Accelerate - Forsgren, Humble, Kim](https://itrevolution.com/product/accelerate/)

### extreme development
15. [Extreme Development Explained - Kent Beck](https://www.oreilly.com/library/view/extreme-programming-explained/0321278658/)
16. [Continuous Integration - Martin Fowler](https://martinfowler.com/articles/continuousIntegration.html)

### lean software
17. [Lean Software Development - Mary & Tom Poppendieck](https://www.poppendieck.com/)
18. [Implement Lean Software Development - Poppendieck](https://www.oreilly.com/library/view/implementing-lean-software/0321437381/)

### strategy and decision
19. [OODA Loop - John Boyd](https://www.danford.net/boyd/)
20. [Two-Pizza Teams - Jeff Bezos / Amazon](https://docs.aws.amazon.com/whitepapers/latest/introduction-devops-aws/two-pizza-teams.html)

### musk and production
21. [Musk's 5-Step Process - Everyday Astronaut](https://everydayastronaut.com/musks-5-step-process/)
22. [Tesla: The Machine That Builds The Machine - Harvard](https://d3.harvard.edu/platform-rctom/submission/tesla-building-the-machine-that-builds-the-machine/)
23. [Elon Musk's Production Philosophy - Aviation Week](https://aviationweek.com/space/commercial-space/algorithm-spacexs-five-step-process-better-engineering)

### historical
24. [Ford Assembly Line - History](https://www.history.com/topics/inventions/assembly-line)
25. [Scientific Management - Frederick Taylor](https://www.britannica.com/science/scientific-management)
