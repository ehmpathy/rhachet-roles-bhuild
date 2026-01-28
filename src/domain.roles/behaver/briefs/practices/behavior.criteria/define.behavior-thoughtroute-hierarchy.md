.define = behavior thoughtroute hierarchy

.what = the progression from motivation to implementation across behavior artifacts

.why = the hierarchy clarifies what belongs where and prevents conflation across layers. each artifact serves a distinct purpose in the thoughtroute from desire to delivery.

.hierarchy:

  | artifact                  | question                           | answers                                    | bounds                     |
  | ------------------------- | ---------------------------------- | ------------------------------------------ | -------------------------- |
  | 0.wish.md                 | WHY build this?                    | the motivation, desire, problem to solve   | none — declares intent     |
  | 1.vision.md               | WHAT does success look like?       | the north star, ideal outcome              | none — declares aspiration |
  | 2.1.criteria.blackbox.md  | WHAT experience must be delivered? | user inputs, outputs, usecases, boundaries | experience bounds          |
  | 2.3.criteria.blueprint.md | WHAT mechanisms must exist?        | contracts, composition, integration points | mechanism bounds           |
  | 3.3.blueprint.md          | HOW will we implement it?          | specific patterns, algorithms, libraries   | implementation decisions   |

.flow:

  ```
  wish (WHY)
    ↓
  vision (WHAT success looks like)
    ↓
  criteria.blackbox (WHAT experience — bounds)
    ↓
  criteria.blueprint (WHAT mechanisms — bounds) [optional]
    ↓
  research (discover options)
    ↓
  blueprint.md (HOW to implement — decisions)
    ↓
  roadmap → execution
  ```

.key-distinctions:

  wish vs blackbox:
    - wish = WHY to build (the desire)
    - blackbox = WHAT experience must be delivered to fulfill the wish (the bounds)

  blackbox vs blueprint:
    - blackbox = experience bounds (what users experience)
    - blueprint = mechanism bounds (what contracts must exist)

  blueprint criteria vs blueprint.md:
    - criteria.blueprint = mechanism bounds (WHAT contracts)
    - blueprint.md (3.3) = implementation decisions (HOW to build)

.examples:

  .good-separation:
    - |
      # wish (WHY)
      we want users to see weather visually without leaving the app

      # blackbox (WHAT experience)
      given('valid location')
        then('returns weather emoji')

      # blueprint criteria (WHAT mechanisms)
      given('weatherService contract')
        then('exposes: getWeather(location) => WeatherData')

      # blueprint.md (HOW)
      weatherService will use OpenWeatherMap API with axios,
      with retry via exponential backoff and 5-minute cache

  .bad-conflation:
    - |
      # ⛔ wish with experience details
      we want getWeatherEmoji to return emojis for locations

      # ⛔ blackbox with mechanism bounds
      given('valid location')
        then('weatherService fetches data')

      # ⛔ criteria.blueprint with implementation
      given('weatherService')
        then('uses axios with retry')

.rule = each artifact should contain only content appropriate to its layer. conflation across layers is a BLOCKER.
