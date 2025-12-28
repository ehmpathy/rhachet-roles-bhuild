.define = criteria.blackbox

.what = experience bounds — constraints on what users must experience

.why = blackbox criteria declares the experience that must be delivered. it bounds what inputs users provide, what outputs they receive, what usecases they fulfill, and what edge cases they encounter. this is the foundational layer — if it's not needed for blackbox, it's not needed at all.

.clarification = blackbox is NOT "why to build" — that's the wish. blackbox is "what experience must be delivered" to fulfill the wish.

.scope = blackbox criteria bounds:
  - inputs = what users provide to the system
  - outputs = what users receive from the system
  - usecases = what goals users accomplish
  - boundaries = edge cases, error states, constraints
  - experience = how users interact with the behavior

.characteristics:
  - experience-layer = bounds the user-facing contract, not mechanisms
  - implementation-agnostic = no mention of architecture, patterns, or technical choices
  - user-focused = written from the perspective of someone who uses the behavior
  - testable = can be verified through acceptance tests without internal knowledge
  - stable = changes only when user requirements change, not when implementation changes

.format = bdd given/when/then declarations per rule.require.bdd-format

.examples:
  .positive:
    - |
      # usecase.1 = fetch weather for location

      given('a valid location string')
        when('getWeatherEmoji is called')
          then('returns an emoji that represents current weather')
            sothat('caller can display weather visually')

      given('an invalid location string')
        when('getWeatherEmoji is called')
          then('returns error that indicates location not found')
    - |
      # usecase.2 = user authentication

      given('valid credentials')
        when('user submits login')
          then('user receives auth token')
          then('user is redirected to dashboard')

      given('invalid credentials')
        when('user submits login')
          then('user sees error message')
          then('user remains on login page')

  .negative:
    - |
      # implementation details leak into blackbox criteria

      given('a valid location string')
        when('getWeatherEmoji is called')
          then('fetches from OpenWeatherMap API')  # ⛔ implementation detail
          then('caches result in Redis')            # ⛔ implementation detail
          then('returns emoji')
    - |
      given('user submits login')
        when('JWT token is generated using RS256')  # ⛔ implementation detail
          then('token stored in httpOnly cookie')   # ⛔ implementation detail

.relationship = blackbox criteria is the foundational experience contract. blueprint criteria adds mechanism bounds while it preserves blackbox bounds. fulfilled blueprint implies fulfilled blackbox.

.severity = BLOCKER if blackbox criteria contains implementation details
