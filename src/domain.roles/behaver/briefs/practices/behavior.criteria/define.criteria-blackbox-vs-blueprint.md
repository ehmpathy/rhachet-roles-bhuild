.define = criteria.blackbox vs criteria.blueprint

.what = comparison of blackbox and blueprint criteria to clarify their distinct roles as bounds at different layers

.why = separation of experience bounds from mechanism bounds prevents conflation of "what experience to deliver" with "what mechanisms to build". this separation ensures:
  - blackbox remains pure experience constraints
  - blueprint remains pure mechanism constraints (contract-layer only)
  - implementation decisions are deferred to research and blueprint execution
  - reviewers can validate each layer independently

.key-distinction:
  - blackbox = experience bounds (what users must experience)
  - blueprint = mechanism bounds (what contracts/composition must exist)
  - neither prescribes internal implementation — that's decided later

.relationship = blueprint ⊇ blackbox
  - blackbox = foundational experience bounds
  - blueprint = adds mechanism bounds while preserving experience bounds
  - fulfilled blueprint guarantees blackbox is satisfied

.comparison:

  | aspect | criteria.blackbox | criteria.blueprint |
  |--------|-------------------|-------------------|
  | layer | experience | mechanism |
  | bounds | what users experience | what contracts must exist |
  | perspective | user's view | architect's view |
  | stability | changes with user needs | changes with composition design |
  | testability | acceptance tests | integration tests |
  | required | yes | optional |
  | file | 2.criteria.blackbox.md | 2.criteria.blueprint.md |

.workflow:
  1. define blackbox criteria (experience bounds)
  2. validate blackbox covers all wish/vision usecases
  3. optionally define blueprint criteria (mechanism bounds)
  4. validate blueprint satisfies blackbox + adds only contract-level constraints
  5. during research (3.1), discover implementation options
  6. during blueprint.md (3.3), decide specific implementation approach

.anti-patterns:
  - blackbox with implementation details
    → pollutes experience bounds
  - blueprint with internal implementation
    → pollutes mechanism bounds, removes research/decision freedom
  - jump to blueprint without blackbox
    → loses user perspective
  - blueprint that omits or contradicts blackbox
    → risks unfulfilled experience bounds

.examples:

  .workflow-positive:
    - |
      # step 1: blackbox criteria (experience bounds)

      given('valid location')
        when('weather requested')
          then('returns current weather emoji')

      # step 2: blueprint criteria (mechanism bounds)

      ## satisfies blackbox
      - given valid location → returns emoji ✓

      ## subcomponent contracts
      given('weatherService contract')
        then('exposes: getWeather(location) => WeatherData')

      given('emojiMapper contract')
        then('exposes: mapToEmoji(condition) => string')

      ## composition
      given('getWeatherEmoji')
        then('composes weatherService and emojiMapper')

      # step 3: research discovers implementation options
      # step 4: blueprint.md decides implementation

  .workflow-negative:
    - |
      # ⛔ blueprint that prescribes internals

      given('weatherService')
        then('uses axios with retry')     # should be in blueprint.md
        then('caches in Redis')           # should be in blueprint.md

.severity = BLOCKER if:
  - blackbox contains implementation details
  - blueprint prescribes internal implementation
  - blackbox and blueprint are conflated in single file
