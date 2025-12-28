.rule = require.blackbox-no-implementation

.ref = define.criteria-blackbox

.what = blackbox criteria must contain zero implementation details

.why = blackbox criteria captures pure experience bounds — constraints on what users must experience. any implementation details pollute the experience contract and conflate "what experience to deliver" with "how to build it". this separation enables:
  - clear acceptance testing from user perspective
  - implementation flexibility without requirement changes
  - stable requirements that don't churn with technical decisions

.scope = applies to 2.criteria.blackbox.md only (not blueprint criteria)

.how = verify blackbox criteria contains only:
  - inputs users provide
  - outputs users receive
  - usecases users fulfill
  - boundary/edge cases users encounter

.forbidden = blackbox criteria must NOT mention:
  - sdks, apis, or external services by name
  - database, cache, or storage technologies
  - architectural patterns or design choices
  - internal function names or contracts
  - specific libraries or frameworks

.examples:
  .positive:
    - |
      given('valid location')
        when('weather requested')
          then('returns current weather emoji')
            sothat('user can display weather visually')
    - |
      given('user with valid credentials')
        when('login submitted')
          then('user is authenticated')
          then('user sees dashboard')

  .negative:
    - |
      given('valid location')
        when('weather requested')
          then('calls OpenWeatherMap API')        # ⛔ implementation detail
          then('caches in Redis for 5 min')       # ⛔ implementation detail
    - |
      given('user credentials')
        when('JWT token generated with RS256')    # ⛔ implementation detail
          then('stored in httpOnly cookie')       # ⛔ implementation detail

.severity = BLOCKER
