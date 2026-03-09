.define = behavior thoughtroute hierarchy

.what = the progression from motivation to implementation across behavior artifacts

.why = the hierarchy clarifies what belongs where and prevents conflation across layers. each artifact serves a distinct purpose in the thoughtroute from desire to delivery.

.hierarchy:

  | artifact                       | question                             | answers                                        | bounds                     |
  | ------------------------------ | ------------------------------------ | ---------------------------------------------- | -------------------------- |
  | 0.wish.md                      | WHY build this?                      | the motivation, desire, problem to solve       | none — declares intent     |
  | 1.vision.md                    | WHAT does success look like?         | the north star, ideal outcome                  | none — declares aspiration |
  | 2.1.criteria.blackbox.md       | WHAT experience must be delivered?   | user inputs, outputs, usecases, boundaries     | experience bounds          |
  | 2.3.criteria.blueprint.md      | WHAT mechanisms must exist?          | contracts, composition, integration points     | mechanism bounds           |
  | 3.1.1.research.external.product.* | WHAT domain knowledge for product? | access, claims, domain terms, references       | knowledge captured         |
  | 3.1.2.research.external.factory.* | WHAT external factory tools?       | testloops, oss levers, templates               | tools discovered           |
  | 3.1.3.research.internal.product.* | WHAT internal code patterns?       | code.prod, code.test patterns                  | patterns discovered        |
  | 3.1.4.research.internal.factory.* | WHAT factory blockers/opports?     | test infra, feedback loops, credentials        | constraints discovered     |
  | 3.2.distill.repros.experience.*   | HOW to reproduce user experiences? | test sketches, entry points, expected outcomes | repros planned             |
  | 3.3.0.blueprint.factory.md     | WHAT factory work is needed?         | blockers to address, improvements to make      | factory decisions          |
  | 3.3.1.blueprint.product.md     | HOW will we implement the product?   | specific patterns, algorithms, libraries       | implementation decisions   |

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
  research
    ├── 3.1.1 external.product (domain knowledge)
    ├── 3.1.2 external.factory (external tools)
    ├── 3.1.3 internal.product (code patterns)
    └── 3.1.4 internal.factory (blockers, opportunities)
    ↓
  distill
    ├── 3.2.distill.domain (domain synthesis)
    └── 3.2.distill.repros.experience (user journey reproductions)
    ↓
  blueprint.factory (WHAT factory work — decisions)
    ↓
  blueprint.product (HOW to implement product — decisions)
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
    - blueprint.md = implementation decisions (HOW to build)

  factory vs product:
    - factory = the machine that builds the machine (test infra, credentials, feedback loops)
    - product = the deliverable (spec + impl)

  research vs blueprint:
    - research = asks questions to surface options, constraints, blockers
    - blueprint = synthesizes research into decisions about what to build

  3.1.4 research.internal.factory vs 3.3.0 blueprint.factory:
    - research.factory = surfaces blockers and opportunities (questions)
    - blueprint.factory = decides what factory work to do (decisions)

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
