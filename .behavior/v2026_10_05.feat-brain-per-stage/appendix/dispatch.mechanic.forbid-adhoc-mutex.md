## .what

teach the mechanic a rule: `rule.forbid.adhoc-mutex` — never hand-roll a lock. use `with-simple-mutex` for every mutual-exclusion need.

## .why

a hand-rolled lock looks simple and hides hard failure modes: a non-atomic check-then-write, a stale lock left by a crashed holder, a pid probe that lies across hosts, an unbounded wait, a release skipped on throw. `with-simple-mutex` solves each by construction:

- atomic put-if-absent picks exactly one winner (a conditional write on the cache)
- lease expiration reclaims a crashed holder's lock
- `acquire.timeout` bounds the wait and throws `SimpleMutexAcquireTimeoutError`
- isolation scope is a choice of cache: `simple-in-memory-cache` = per-process, `simple-on-disk-cache` local = per-machine, s3 = global

## .evidence

in `ehmpathy/rhachet-roles-bhuild` (branch `beav/feat-brain-per-stage`), a clone wrote `withRadioDrainLock` as a `wx` lockfile with pid-liveness and age-based stale checks plus a sleep-poll wait (~170 lines). the human caught it in review. it was replaced by `withSimpleMutex` over `simple-on-disk-cache` (~50 lines), with a cross-process test that goes red when the mutex is bypassed.

## .the rule should forbid

- `wx` / `O_EXCL` lockfiles used as a mutex
- `process.kill(pid, 0)` liveness probes to judge a lock stale
- sleep-poll loops that retry an acquire
- in-memory `Map` / flag / promise-chain locks where `with-simple-mutex` + `simple-in-memory-cache` serves
- any other bespoke lock or lease, or an alternative mutex package

## .the rule should require

- `withSimpleMutex(logic, { key, cache, lease, acquire })`
- the cache picks the scope; name the scope in a comment
- a lease sized above the critical section's worst case
- a bounded `acquire.timeout` where a hang would be worse than a loud failure

## .enforcement

- an adhoc or alternative mutex implementation = blocker

## .see also

- `ehmpathy/with-simple-mutex` readme
- `ehmpathy/simple-on-disk-cache` (conditional writes, local + cloud)
