.rule = require.blueprint-contract-layer-only

.ref = define.criteria-blueprint

.what = blueprint criteria must only declare contract-layer boundaries, never internal implementation

.why = blueprint criteria captures mechanism bounds — constraints on what contracts/composition must exist to deliver the experience. it declares WHAT subcomponents are needed with WHAT interfaces, but never prescribes HOW those subcomponents are built internally. this enables:
  - clear architectural boundaries for composition
  - research and decision freedom during blueprint execution
  - testable integration contracts without implementation coupling
  - parallel work on subcomponents with defined interfaces

.scope = applies to 2.3.criteria.blueprint.md only (not blackbox criteria)

.how = verify blueprint criteria declares only:
  - subcomponent contracts (what interface each exposes)
  - composition boundaries (how components connect)
  - test coverage requirements (what to verify)
  - integration points (what external boundaries exist)

.forbidden = blueprint criteria must NOT prescribe:
  - internal implementation of subcomponents
  - specific algorithms or data structures
  - internal control flow or state management
  - how a subcomponent achieves its contract

.examples:
  .positive:
    - |
      ## subcomponent contracts

      given('weatherService contract')
        then('exposes getEmoji(location: string): Promise<string>')
        then('throws BadRequestError for invalid locations')

      given('weatherCache contract')
        then('exposes get(key: string): Promise<T | null>')
        then('exposes set(key: string, value: T, ttl: number): Promise<void>')

      ## composition boundaries

      given('getWeatherEmoji implementation')
        then('composes weatherService and weatherCache')
        then('cache miss triggers weatherService call')
    - |
      ## test coverage requirements

      given('weatherService')
        then('has unit tests for error mapping')
        then('has integration tests for external api')

  .negative:
    - |
      given('weatherService implementation')
        then('uses axios for HTTP requests')        # ⛔ internal choice
        then('parses JSON with zod schema')         # ⛔ internal choice
        then('implements retry with exponential backoff') # ⛔ internal choice
    - |
      given('cache implementation')
        then('uses LRU eviction policy')            # ⛔ internal choice
        then('stores data in Map<string, T>')       # ⛔ internal choice

.clarification = blueprint criteria says "we need a weatherService with this contract" but does NOT say "weatherService should use axios and retry 3 times". the HOW is discovered during research and decided during blueprint execution.

.severity = BLOCKER
