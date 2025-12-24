.rule = prefer.depth-groups

.what = criteria should be grouped by depth of abstraction (foundation to contract)

.why = depth groups clarify the layer at which each behavior operates; enables progressive verification from low-level to high-level; foundation behaviors must work before contract behaviors can be tested

.how = check for depth progression from foundational usecases (infrastructure, data, internal logic) to contract usecases (api, user-facing, integration); verify low-level behaviors are declared before high-level dependents

.examples:
  .positive:
    - |
      # usecase.1 = rule briefs are discoverable (foundation)

      given('rule briefs exist')
        when('searched by artifact type')
          then('rules are found under expected paths')

      # usecase.2 = reviewing a single artifact (internal)

      given('a wish document exists')
        when('reviewed with wish rules')
          then('feedback is produced')

      # usecase.3 = composite skill orchestrates full review (contract)

      given('a behavior directory exists')
        when('review.behavior skill is invoked')
          then('all artifacts are reviewed')
          then('feedback is aggregated')
  .negative:
    - |
      # usecase.1 = full behavior review (contract first - wrong order)

      given('review.behavior is invoked')
        when('executed')
          then('all feedback produced')

      # usecase.2 = single artifact review (foundation after contract)

      given('a wish exists')
        when('reviewed')
          then('feedback produced')

.severity = NITPICK
