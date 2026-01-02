# khue

## definition

a **khue** is a decision point where a tool provides an answer so you don't have to research, debate, or decide.

etymology: from "question" → "que" → "khue" (phonetic respelling)

in the dispatcher measurement framework:
- **khue** = one decision avoided
- measured as **khues/use** in leverage.author.khue
- each khue represents cognitive load reduction


## what khues capture

| aspect              | what it measures                              |
| ------------------- | --------------------------------------------- |
| **research time**   | time not spent looking up best practices      |
| **debate time**     | time not spent discussing tradeoffs           |
| **decision fatigue**| mental energy preserved for harder decisions  |
| **future regret**   | bad decisions avoided via embedded expertise  |


## khues vs other author metrics

| metric                   | unit       | what it measures              |
| ------------------------ | ---------- | ----------------------------- |
| leverage.author.time     | mins/use   | wall-clock time reduction     |
| leverage.author.code.block | blocks/use | structural complexity avoided |
| leverage.author.code.path  | paths/use  | branch complexity avoided     |
| **leverage.author.khue**   | khues/use  | decisions avoided             |


## time conversion

```
khue → mins = 5 mins/khue
```

rationale: average time to research, evaluate options, and decide one question

this feeds into the decomposed time calculation:
```
author.time.decomposed = (blocks × 5) + (paths × 3) + (khues × 5)
```


## how to count khues

enumerate the questions the tool answers for you:

```
tool: dynamodb-dao-generator

khues:
1. "what's the table schema?"
2. "how to design GSI strategy?"
3. "what batch limits to use?"
4. "how to handle pagination?"
5. "what retry strategy?"
6. "how to serialize/deserialize?"
7. "how to handle type safety?"
8. "what error codes to handle?"
... (25 total)

leverage.author.khue = 25 khues/use
```


## why khues matter

khues are often undervalued compared to raw time savings, but they compound:

### cognitive load reduction

each decision you don't make is mental energy preserved for:
- domain-specific decisions (what should the business logic be?)
- creative decisions (how should the UX feel?)
- strategic decisions (what should we build next?)

### expertise embedding

tools with high khue counts embed expertise:
- best practices become defaults
- common mistakes become impossible
- edge cases become handled

### consistency enforcement

when the tool answers the question:
- the answer is consistent across uses
- no variance from developer to developer
- no drift over time


## examples

### positive

```
tool: declapract-typescript-ehmpathy

khues enumerated:
1. "should we use ESLint or TSLint?"
2. "what linting rules to enable?"
3. "how to configure TypeScript strictness?"
4. "what testing framework to use?"
5. "how to structure the project?"
... (80 total)

leverage.author.khue = 80 khues/use
khue.time.equivalent = 80 × 5 = 400 mins = 6.7 hours
```

```
tool: with-simple-cache

khues enumerated:
1. "how to generate cache keys?"
2. "where to store cached values?"
3. "how to handle cache misses?"
4. "what TTL to use?"
5. "how to invalidate?"
6. "how to handle race conditions?"
7. "how to handle errors during caching?"
8. "how to wire up the cache backend?"
9. "how to test caching behavior?"

leverage.author.khue = 9 khues/use
```

### negative

```
# wrong: counting implementation steps instead of decisions
khues = [
  "write the function",
  "add error handling",
  "write tests"
]
# these are tasks, not questions

# right: counting decisions the tool makes for you
khues = [
  "what error types to catch?",
  "what to do on each error type?",
  "what test patterns to use?"
]
```


## in dispatcher context

khue contributes to leverage.author via the decomposed time formula:

```
author.time.decomposed = (blocks × 5) + (paths × 3) + (khues × 5)
leverage.author/use = (α × time.gut) + ((1-α) × author.time.decomposed)
```

high-khue tools provide significant leverage even when raw time savings seem modest:
- 25 khues × 5 mins = 125 mins of decision time avoided
- this compounds across every use
