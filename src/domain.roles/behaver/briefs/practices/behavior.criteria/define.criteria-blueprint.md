.define = criteria.blueprint

.what = mechanism bounds — constraints on what contracts/composition must exist to deliver the experience

.why = blueprint criteria declares the mechanisms that must exist to fulfill the blackbox criteria. it bounds what subcomponents are needed, what interfaces they expose, and how they compose — but never how they're implemented internally. this is an optional layer that narrows down what will be built upfront.

.clarification = blueprint criteria is NOT "how to build" — that's discovered during research (3.1) and decided in blueprint.md (3.3). blueprint criteria is "what mechanisms must exist" to deliver the experience.

.scope = blueprint criteria bounds:
  - subcomponent contracts = what interfaces each component exposes
  - composition boundaries = how components connect and depend
  - integration points = what external boundaries exist
  - test coverage requirements = what verification is needed

.forbidden = blueprint criteria must NOT prescribe:
  - internal implementation details of subcomponents
  - specific algorithms or data structures
  - internal control flow or state management
  - how a subcomponent achieves its contract

.characteristics:
  - mechanism-layer = bounds the contract/composition layer, not internals
  - contract-layer only = declares boundaries, not implementations
  - blackbox-inclusive = must satisfy all blackbox experience bounds
  - reviewable = enables architectural review before execution
  - optional = not all behaviors need prescribed mechanism bounds

.format = extends blackbox criteria with contract declarations

.examples:
  .positive:
    - |
      # criteria.blueprint for weather-emoji

      ## blackbox criteria satisfied
      - usecase.1 = fetch weather for location ✓

      ## subcomponent contracts

      given('getWeatherEmoji contract')
        then('exposes: (input: { location: string }) => Promise<{ emoji: string }>')
        then('follows (input, context) pattern per mech briefs')
        then('throws BadRequestError for invalid locations')

      given('weatherService contract')
        then('exposes: getWeather(location: string) => Promise<WeatherData>')
        then('abstracts external weather data fetch')

      given('emojiMapper contract')
        then('exposes: mapToEmoji(condition: WeatherCondition) => string')
        then('handles all known weather conditions')

      ## composition boundaries

      given('getWeatherEmoji implementation')
        then('composes weatherService and emojiMapper')
        then('weatherService provides data, emojiMapper transforms it')

      ## test coverage requirements

      given('weather-emoji feature')
        then('has unit tests for emojiMapper')
        then('has integration tests for weatherService')
        then('has acceptance test for full usecase')
    - |
      ## integration points

      given('external weather api integration')
        then('weatherService abstracts external api')
        then('api choice determined during research/blueprint phase')

  .negative:
    - |
      # ⛔ prescribes internal implementation

      given('weatherService implementation')
        then('uses axios for HTTP')              # ⛔ internal choice
        then('implements retry with backoff')    # ⛔ internal choice
        then('caches in Redis for 5 min')        # ⛔ internal choice
    - |
      # ⛔ specifies algorithms

      given('emojiMapper implementation')
        then('uses switch statement')            # ⛔ internal choice
        then('stores mappings in Map')           # ⛔ internal choice

.relationship = blueprint criteria adds mechanism bounds on top of blackbox experience bounds. fulfilled blueprint implies fulfilled blackbox. the HOW is discovered during research (3.1) and decided in blueprint.md (3.3).

.severity = BLOCKER if blueprint criteria prescribes internal implementation
