.tactic = criteria:avoid-mechanism-prescription

.what = criteria should declare contracts (what the system provides), not mechanisms (how it fulfills them)

.why
- criteria define the contract between wish and implementation
- mechanisms are blueprint-level details to discover, compare, and choose
- criteria that prescribe mechanisms cannot be satisfied by alternative implementations
- contracts are stable; mechanisms evolve

.scope
- applies to all then() and when() clauses in criteria documents
- NITPICK level violation when detected

.definitions
- **contract** = what the system exposes or provides (e.g., "builds dependency graph", "emits JSON")
- **mechanism** = how the system internally achieves a contract (e.g., "clones to temp cache", "uses quicksort")

.how

.detect
- look for internal mechanism references (e.g., "clones to cache", "queries database", "calls API endpoint")
- look for algorithm choices (e.g., "sorts via quicksort", "hashes with SHA256")
- look for infrastructure details (e.g., "stores in Redis", "writes to S3")
- ask: "could this be fulfilled differently?" - if yes and it specifies one way, it's a mechanism

.fix
- replace mechanism references with contract descriptions
  - "clones to temp cache" → "behaviors are discovered"
  - "queries the database" → "data is retrieved"
- focus on observable outcomes and exposed capabilities

.examples

.negative (mechanism prescription)
```
then('repo is cloned to temp cache')
then('results are stored in Redis')
then('file is uploaded to S3')
```

.positive (contract declaration)
```
then('behaviors are discovered from repo')
then('dependency graph is built')
then('results are persisted')
then('file is stored remotely')
```

.boundary (acceptable in criteria)
- contracts: "builds dependency graph", "emits JSON", "exposes API"
- integration points: "brain.repl is invoked", "dao is called" - specifies what, not how
- output formats: JSON, markdown - part of the contract
- file paths and directory structures - observable behaviors
- error messages and log content - observable outputs
